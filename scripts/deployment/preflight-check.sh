#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/courier-fraud-check-bd}"
REQUIRED_NODE_MAJOR="${REQUIRED_NODE_MAJOR:-22}"

command -v node >/dev/null
command -v npm >/dev/null
command -v pm2 >/dev/null
command -v nginx >/dev/null
command -v psql >/dev/null
command -v redis-cli >/dev/null

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo "Node.js $REQUIRED_NODE_MAJOR or newer is required."
  exit 1
fi

test -d "$APP_DIR"
test -f "$APP_DIR/.env"
test -f "$APP_DIR/ecosystem.config.js"
test -d "$APP_DIR/logs"
test -d "$APP_DIR/uploads"
test -d "$APP_DIR/backups"

nginx -t
pm2 ping >/dev/null

echo "Preflight checks passed."
