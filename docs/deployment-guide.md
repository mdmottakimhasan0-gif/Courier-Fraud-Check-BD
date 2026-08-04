# Deployment Guide

## Target Architecture
- Nginx terminates HTTPS and proxies frontend and backend traffic.
- PM2 runs separate frontend, backend, worker, and scheduler processes.
- PostgreSQL stores persistent application data.
- Redis supports cache, locks, queues, and future distributed rate limiting.

## Release Flow
1. Pull the approved release artifact.
2. Install dependencies with `npm ci`.
3. Validate environment variables.
4. Run migrations during a controlled deployment window.
5. Build all workspaces.
6. Restart PM2 processes with zero-downtime reload where possible.
7. Verify `/api/v1/health`, frontend landing page, login, dashboard, search, billing, and admin routes.

## Rollback
- Keep the previous release directory and PM2 process definition.
- Restore the previous artifact if build or health checks fail.
- Database rollback must follow migration-specific rollback notes.
