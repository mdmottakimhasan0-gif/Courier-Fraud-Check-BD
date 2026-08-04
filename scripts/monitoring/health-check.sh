#!/usr/bin/env bash
set -euo pipefail

API_HEALTH_URL="${API_HEALTH_URL:-https://api.courierfraudcheckbd.com/api/v1/health}"
FRONTEND_URL="${FRONTEND_URL:-https://courierfraudcheckbd.com}"

curl --fail --silent --show-error "$FRONTEND_URL" >/dev/null
curl --fail --silent --show-error "$API_HEALTH_URL" >/dev/null

pm2 jlist >/dev/null
redis-cli ping >/dev/null

df -h /
free -m

echo "Health check passed."
