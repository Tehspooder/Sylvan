#!/usr/bin/env bash
# Repository bootstrap for the Sylvan Cloud Agent environment.
# Runs after the repo is checked out. Must be idempotent and terminate.
# System tooling (Docker, fuse-overlayfs, the Supabase CLI) and the
# pre-pulled Supabase images live in the base snapshot, not here.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Node dependencies, installed exactly from the committed lockfile.
npm ci

# Local Supabase credentials for the Next.js app. These are Supabase's
# well-known local-development keys (identical for every local install and
# published in the Supabase docs), so they are safe to write here and are
# not project secrets. .env.local is gitignored.
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
fi
