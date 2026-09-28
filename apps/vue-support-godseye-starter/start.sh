#!/usr/bin/env bash
# Local launcher: pins Node 24 (package.json requires 24.14.x or 26.x; the
# default `node` on this machine is v25, which is outside that range).
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/usr/local/bin:$PATH"
echo "node $(node --version)"
exec npm run dev -- --host localhost --port 4173
