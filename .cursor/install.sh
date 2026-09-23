#!/usr/bin/env bash
# Repository bootstrap for the Sylvan Cloud Agent environment.
# Runs after checkout. Must be idempotent and terminate.
#
# Sylvan is a Next.js app backed by a *local* Supabase stack, which runs in
# Docker. This script installs the system tooling that stack needs (Docker,
# fuse-overlayfs, the Supabase CLI), installs Node dependencies, and writes a
# local .env.local. Bringing the services up happens per-boot in start.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

APT_CONFOLD=(-o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)

# 1. Docker engine + fuse-overlayfs. The Cloud Agent VM has no systemd and its
#    kernel cannot use the default overlayfs snapshotter, so we install
#    fuse-overlayfs and point Docker at it (see the daemon.json below). Docker
#    is started per-boot in start.sh.
if ! command -v dockerd >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${APT_CONFOLD[@]}" \
    docker.io fuse-overlayfs fuse3
fi

# Ensure fuse packages finished configuring even if a prior run hit an
# interactive conffile prompt.
if ! command -v fuse-overlayfs >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${APT_CONFOLD[@]}" \
    fuse-overlayfs fuse3
fi

# 2. Docker daemon config for the nested VM: use the fuse-overlayfs storage
#    driver and disable the containerd snapshotter (its overlayfs mounts fail
#    with EINVAL inside this environment).
sudo mkdir -p /etc/docker
printf '%s\n' '{' \
  '  "storage-driver": "fuse-overlayfs",' \
  '  "features": { "containerd-snapshotter": false }' \
  '}' | sudo tee /etc/docker/daemon.json >/dev/null

# 3. Let the current user reach the Docker socket without sudo.
sudo groupadd -f docker
sudo usermod -aG docker "$(id -un)"

# 4. Supabase CLI (distributed as a .deb release, not via npm).
if ! command -v supabase >/dev/null 2>&1; then
  arch="$(dpkg --print-architecture)"
  deb_url="$(curl -fsSL https://api.github.com/repos/supabase/cli/releases/latest \
    | grep -o "https://[^\"]*_linux_${arch}.deb" | head -1)"
  tmp_deb="$(mktemp --suffix=.deb)"
  curl -fsSL -o "${tmp_deb}" "${deb_url}"
  sudo dpkg -i "${tmp_deb}"
  rm -f "${tmp_deb}"
fi

# 5. Node dependencies, installed exactly from the committed lockfile.
npm ci

# 6. Local Supabase credentials for the Next.js app. These are Supabase's
#    well-known local-development keys (identical for every local install and
#    published in the Supabase docs), so they are safe to write here and are
#    not project secrets. .env.local is gitignored.
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
fi

echo "install.sh complete: docker=$(command -v dockerd), supabase=$(supabase --version 2>/dev/null), node_modules ready."
