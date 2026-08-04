# Backup & Restore Guide

## Backups
- PostgreSQL: scheduled logical backups plus point-in-time recovery where available.
- Uploads: filesystem backup now, S3-compatible storage later.
- Logs: rotate and retain according to compliance policy.
- Configuration: encrypted backup of deployment templates and non-secret configuration.

## Restore Procedure
1. Stop application writes or enable maintenance mode.
2. Restore PostgreSQL to the selected point.
3. Restore uploads and required configuration.
4. Validate Redis can be rebuilt or restored depending on cache/queue state.
5. Run health checks.
6. Re-enable traffic gradually.

## Recovery Targets
- Document RPO/RTO per merchant SLA before production onboarding.
