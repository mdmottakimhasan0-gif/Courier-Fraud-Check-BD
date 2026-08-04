#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: restore-database.sh /path/to/cfcb-db.sql.gz"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for restore."
  exit 1
fi

echo "Restoring database from $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "Database restore completed."
