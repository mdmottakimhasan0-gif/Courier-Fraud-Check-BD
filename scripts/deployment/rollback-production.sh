#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/courier-fraud-check-bd}"
CURRENT_LINK="$APP_DIR/current"
PREVIOUS_RELEASE="$(find "$APP_DIR/releases" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 2 | head -n 1)"

if [ -z "$PREVIOUS_RELEASE" ]; then
  echo "No previous release found."
  exit 1
fi

ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
pm2 startOrReload "$CURRENT_LINK/ecosystem.config.js" --update-env
pm2 save

echo "Rolled back to $PREVIOUS_RELEASE."
