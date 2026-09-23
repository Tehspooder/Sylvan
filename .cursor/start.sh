#!/usr/bin/env bash
# Per-boot runtime initialization for the Sylvan Cloud Agent environment.
# Brings up Docker, the local Supabase stack, and the Next.js dev server.
# Idempotent: safe to run on every boot and to re-run by hand.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 1. Start the Docker daemon if it is not already running. There is no systemd
#    in the VM, so dockerd is launched directly and backgrounded. A lock keeps
#    concurrent invocations from racing to start two daemons.
exec 9>/tmp/sylvan-dockerd.lock
flock 9
if ! sudo docker info >/dev/null 2>&1; then
  sudo rm -f /var/run/docker.pid 2>/dev/null || true
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 60); do
    if sudo docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
  sudo docker info >/dev/null 2>&1 || { echo "dockerd failed to start" >&2; tail -n 40 /tmp/dockerd.log >&2 || true; exit 1; }
fi
flock -u 9

# 2. Nested-VM networking fix. Docker programs the legacy iptables backend,
#    whose FORWARD chain defaults to DROP and blocks inter-container traffic
#    (Supabase's Kong gateway reaching Postgres / Auth / REST). Allow it.
sudo iptables-legacy -P FORWARD ACCEPT 2>/dev/null || true

# 3. Let the ubuntu user reach the Docker socket without sudo, so the
#    Supabase CLI (run as ubuntu) can talk to the daemon.
sudo chown root:docker /var/run/docker.sock 2>/dev/null || true
sudo chmod 660 /var/run/docker.sock 2>/dev/null || true

# 4. Existing Supabase containers use a "restart: unless-stopped" policy, so
#    after dockerd restarts they come back on their own but take ~20-30s to
#    become healthy. If a database container is already present, wait for it
#    to report healthy before asking the CLI to reconcile.
db_container="$(sudo docker ps -a --filter 'name=supabase_db_' --format '{{.Names}}' | head -1)"
if [ -n "${db_container}" ]; then
  for _ in $(seq 1 60); do
    status="$(sudo docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "${db_container}" 2>/dev/null || true)"
    [ "${status}" = "healthy" ] && break
    sleep 2
  done
fi

# 5. Bring up the local Supabase stack (Postgres, Auth, REST, Studio, ...).
#    Idempotent: it reconciles existing containers and applies the SQL
#    migrations to a fresh database on first start. Retry a few times to
#    absorb the container startup race after a cold boot.
for attempt in 1 2 3 4 5; do
  if supabase start; then
    break
  fi
  if [ "${attempt}" -eq 5 ]; then
    echo "supabase start did not become ready after ${attempt} attempts" >&2
    exit 1
  fi
  echo "supabase start attempt ${attempt} failed; waiting before retry..." >&2
  sleep 8
done

# 6. Start the Next.js dev server in the background, unless it is already
#    serving or the caller opted out (SKIP_DEV_SERVER=1 for infra-only runs).
if [ "${SKIP_DEV_SERVER:-0}" != "1" ]; then
  if curl -sS -o /dev/null -m 3 http://localhost:3000/ 2>/dev/null; then
    echo "Next.js dev server already serving on http://localhost:3000"
  else
    echo "Starting Next.js dev server (logs: /tmp/next-dev.log)..."
    nohup npm run dev >/tmp/next-dev.log 2>&1 &
    for _ in $(seq 1 30); do
      if curl -sS -o /dev/null -m 3 http://localhost:3000/ 2>/dev/null; then break; fi
      sleep 1
    done
  fi
fi

echo "Sylvan is ready: app on http://localhost:3000, Supabase API on http://127.0.0.1:54321, Studio on http://127.0.0.1:54323."
