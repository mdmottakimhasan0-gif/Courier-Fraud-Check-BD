#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/courier-fraud-check-bd}"
RELEASE_ID="${RELEASE_ID:-$(date +%Y%m%d%H%M%S)}"
RELEASE_DIR="$APP_DIR/releases/$RELEASE_ID"
CURRENT_LINK="$APP_DIR/current"

mkdir -p "$APP_DIR/releases" "$APP_DIR/shared/logs" "$APP_DIR/shared/uploads" "$APP_DIR/shared/backups"
mkdir -p "$RELEASE_DIR"

rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude dist \
  --exclude logs \
  --exclude uploads \
  --exclude backups \
  ./ "$RELEASE_DIR/"

cp "$APP_DIR/.env" "$RELEASE_DIR/.env"
ln -sfn "$APP_DIR/shared/logs" "$RELEASE_DIR/logs"
ln -sfn "$APP_DIR/shared/uploads" "$RELEASE_DIR/uploads"
ln -sfn "$APP_DIR/shared/backups" "$RELEASE_DIR/backups"

cd "$RELEASE_DIR"
npm ci
npm run build
npm run prisma:validate

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
pm2 startOrReload "$CURRENT_LINK/ecosystem.config.js" --update-env
pm2 save

echo "Production release $RELEASE_ID deployed."
