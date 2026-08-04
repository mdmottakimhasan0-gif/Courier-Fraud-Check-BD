#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/courier-fraud-check-bd}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"

mkdir -p "$BACKUP_DIR/database" "$BACKUP_DIR/uploads" "$BACKUP_DIR/logs" "$BACKUP_DIR/config"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for database backup."
  exit 1
fi

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/database/cfcb-db-$TIMESTAMP.sql.gz"
tar -czf "$BACKUP_DIR/uploads/cfcb-uploads-$TIMESTAMP.tar.gz" -C "$APP_DIR" uploads
tar -czf "$BACKUP_DIR/logs/cfcb-logs-$TIMESTAMP.tar.gz" -C "$APP_DIR" logs
tar -czf "$BACKUP_DIR/config/cfcb-config-$TIMESTAMP.tar.gz" -C "$APP_DIR" .env ecosystem.config.js nginx

find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete

echo "Backup completed at $TIMESTAMP."
