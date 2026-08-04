# Milestone 12: Production Infrastructure, DevOps and CI/CD

## Scope

Milestone 12 implements production infrastructure and DevOps readiness only.

No business logic, frontend UI flows, courier logic, payment logic, authentication workflow, or database models were redesigned. The only backend runtime change is security-header hardening in the NestJS bootstrap.

## Folder Changes

Created:

- `.github/workflows/ci.yml`
- `.github/workflows/production-release.yml`
- `config/env/.env.development.example`
- `config/env/.env.staging.example`
- `config/env/.env.production.example`
- `config/systemd/cfcb-health-monitor.service`
- `config/systemd/cfcb-health-monitor.timer`
- `nginx/courier-fraud-check-bd.conf`
- `nginx/cfcb-proxy-headers.conf`
- `nginx/logrotate-cfcb`
- `scripts/deployment/preflight-check.sh`
- `scripts/deployment/deploy-production.sh`
- `scripts/deployment/rollback-production.sh`
- `scripts/maintenance/backup.sh`
- `scripts/maintenance/restore-database.sh`
- `scripts/monitoring/health-check.sh`
- `scripts/pm2-future-process.js`

Modified:

- `.env.example`
- `ecosystem.config.js`
- `backend/src/main.ts`

Docker was not introduced because the existing project did not contain Docker assets and the approved deployment target remains Ubuntu Server, Node.js, PM2, and Nginx.

## Environment Configuration

Environment templates now cover:

- Local development
- Staging
- Production
- Backend runtime values
- Frontend public API values
- PostgreSQL connection
- Redis connection
- Queue retry defaults
- JWT secrets
- Secure cookie settings
- Credential encryption key
- Payment gateway placeholders
- Logging and backup retention

Production rules:

- Real secrets must be injected through server-side `.env` or a future secret manager.
- Merchant credentials must never be stored in plain text.
- `NODE_ENV=production` is required for staging and production templates.
- Production JWT secrets must be at least 32 characters.
- `CREDENTIAL_ENCRYPTION_KEY` must be replaced with a real 32-byte base64 key before launch.

## PM2

`ecosystem.config.js` now defines separate production processes:

- `cfcb-backend`
- `cfcb-frontend`
- `cfcb-worker-future`
- `cfcb-scheduler-future`

Backend:

- Runs compiled NestJS from `backend/dist/main.js`.
- Uses cluster mode with `instances: max`.
- Has memory restart policy.
- Writes logs under `logs/pm2`.

Frontend:

- Runs `next start` from the frontend workspace.
- Uses fork mode.
- Receives `NEXT_PUBLIC_API_BASE_URL`.

Worker and scheduler:

- Are reserved future processes.
- They do not start BullMQ, notifications, search processing, or scheduled business jobs in Milestone 12.
- They provide PM2 process slots for future milestones without changing current application behavior.

## Nginx

Production Nginx configuration includes:

- HTTP to HTTPS redirect.
- Let's Encrypt ACME challenge support.
- Separate frontend and API server blocks.
- Compression.
- Static Next.js asset caching.
- Large upload support up to 25 MB.
- API and auth rate limiting.
- Connection limiting.
- WebSocket upgrade forwarding.
- Reverse proxy headers.
- HSTS.
- `X-Content-Type-Options`.
- `X-Frame-Options`.
- Referrer policy.
- Permissions policy.
- CSP for API responses.
- CSP report-only mode for the frontend until nonce-based strict CSP is introduced.

Files:

- `nginx/courier-fraud-check-bd.conf`
- `nginx/cfcb-proxy-headers.conf`
- `nginx/logrotate-cfcb`

## SSL

Prepared SSL strategy:

- Use Let's Encrypt certificates through Certbot on Ubuntu.
- Use separate certificates for:
  - `courierfraudcheckbd.com`
  - `www.courierfraudcheckbd.com`
  - `api.courierfraudcheckbd.com`
- Enable TLS 1.2 and TLS 1.3.
- Disable session tickets.
- Enable HSTS after domain validation.
- Configure Certbot auto-renew through system timer.

Recommended setup:

```bash
sudo mkdir -p /var/www/letsencrypt
sudo certbot certonly --webroot -w /var/www/letsencrypt -d courierfraudcheckbd.com -d www.courierfraudcheckbd.com
sudo certbot certonly --webroot -w /var/www/letsencrypt -d api.courierfraudcheckbd.com
sudo systemctl list-timers | grep certbot
```

## Logging

Logging strategy covers:

- Application logs through PM2.
- Frontend logs under `logs/pm2/frontend-*.log`.
- Backend logs under `logs/pm2/backend-*.log`.
- Future worker logs under `logs/pm2/worker-*.log`.
- Future scheduler logs under `logs/pm2/scheduler-*.log`.
- Nginx frontend access and error logs.
- Nginx API access and error logs.
- Audit logs remain application-level records from previous milestones.

Rotation:

- `nginx/logrotate-cfcb` rotates Nginx and application log files daily.
- Default retention is 30 rotations.
- Compression and `copytruncate` are enabled.

## Monitoring

Production monitoring architecture includes:

- Backend health API checks.
- Frontend availability checks.
- PM2 process status.
- CPU visibility through server monitoring.
- Memory visibility through server monitoring and PM2.
- Disk usage checks.
- Redis ping checks.
- Queue health through the existing backend health surface and future BullMQ worker process.
- Database health through backend health endpoints.
- Application status through PM2 and `/api/v1/health`.

Created:

- `scripts/monitoring/health-check.sh`
- `config/systemd/cfcb-health-monitor.service`
- `config/systemd/cfcb-health-monitor.timer`

The systemd timer is prepared for one-minute health checks on Ubuntu.

## Backup Strategy

Created `scripts/maintenance/backup.sh` for:

- PostgreSQL backups through `pg_dump`.
- Upload archive backup.
- Logs archive backup.
- Configuration archive backup.
- Retention cleanup.

Created `scripts/maintenance/restore-database.sh` for database recovery from compressed SQL backups.

Recommended backup storage:

- Local encrypted backup directory for immediate recovery.
- Off-server S3-compatible storage for disaster recovery.
- Daily database backups.
- Daily uploads backup.
- Daily configuration backup after deployment changes.
- Logs retained according to compliance requirements.

Recovery order:

1. Restore server packages and Node.js.
2. Restore repository release.
3. Restore `.env` and Nginx config.
4. Restore PostgreSQL database.
5. Restore uploads.
6. Install dependencies.
7. Build application.
8. Restart PM2.
9. Verify health endpoints.

## CI/CD

Created GitHub Actions workflows:

- `ci.yml`
- `production-release.yml`

CI workflow:

- Runs on pull requests.
- Runs on pushes to `main` and `develop`.
- Installs dependencies with `npm ci`.
- Runs lint.
- Runs typecheck.
- Runs build.

Production release workflow:

- Manual `workflow_dispatch` release.
- Accepts a Git ref.
- Runs lint, typecheck, and build before packaging.
- Uploads a release artifact.
- Copies the artifact to the production server over SSH.
- Runs the production deployment script.
- Keeps rollback script ready on the server.

Required GitHub secrets:

- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`

## Deployment

Production deployment target:

- Ubuntu Server
- Node.js 22+
- npm 10+
- PM2
- Nginx
- PostgreSQL
- Redis
- Certbot

Deployment script:

- `scripts/deployment/deploy-production.sh`

Preflight script:

- `scripts/deployment/preflight-check.sh`

Rollback script:

- `scripts/deployment/rollback-production.sh`

Release layout:

```text
/var/www/courier-fraud-check-bd/
├── .env
├── current -> releases/<release-id>
├── releases/
├── shared/
│   ├── backups/
│   ├── logs/
│   └── uploads/
```

## Security

Reviewed and improved:

- Helmet is configured with explicit CSP directives for backend responses.
- Helmet referrer policy is explicit.
- Cross-origin embedder policy is disabled to avoid breaking Swagger and proxied docs.
- CORS remains environment-driven through `CORS_ORIGINS`.
- Secure cookies remain production-enabled through existing auth config.
- Nginx adds security headers at the edge.
- Nginx adds API and auth route rate limiting.
- Environment templates separate local, staging, and production values.
- Secrets are represented only as placeholders.
- Large request body limits are explicit.

Future security hardening:

- Strict nonce-based frontend CSP after SSR nonce support is added.
- Distributed rate limiting when Redis-backed rate limiting is enabled.
- External secret manager integration.
- Centralized error tracking integration.

## Production Checklist

Node:

- Install Node.js 22+.
- Install npm 10+.
- Run `npm ci`.
- Run `npm run build`.

PM2:

- Install PM2 globally.
- Start with `pm2 startOrReload ecosystem.config.js --update-env`.
- Run `pm2 save`.
- Enable PM2 startup service.

Nginx:

- Copy `nginx/courier-fraud-check-bd.conf` to `/etc/nginx/sites-available/`.
- Copy `nginx/cfcb-proxy-headers.conf` to `/etc/nginx/snippets/`.
- Enable the site.
- Run `nginx -t`.
- Reload Nginx.

SSL:

- Install Certbot.
- Issue Let's Encrypt certificates.
- Confirm auto-renew timer.
- Enable HSTS only after successful HTTPS validation.

Database:

- Create production PostgreSQL user and database.
- Set `DATABASE_URL`.
- Validate Prisma schema.
- Apply migrations when migration execution is approved.

Redis:

- Install and secure Redis.
- Bind Redis to localhost or private network.
- Set `REDIS_URL`.
- Verify `redis-cli ping`.

Queue:

- Confirm BullMQ Redis connectivity.
- Keep worker/scheduler future PM2 slots stopped until implementation milestone.

Environment Variables:

- Copy `config/env/.env.production.example` to server `.env`.
- Replace every placeholder.
- Lock file permissions to deployment user only.

Domain and DNS:

- Point apex and `www` records to the frontend server.
- Point `api` record to the API server or same reverse proxy.
- Validate DNS before certificate issuance.

Firewall:

- Allow SSH from trusted IPs.
- Allow HTTP and HTTPS.
- Restrict PostgreSQL and Redis to private interfaces.

Backup:

- Schedule `scripts/maintenance/backup.sh`.
- Test restore using `scripts/maintenance/restore-database.sh`.
- Copy backups off-server.

Monitoring:

- Enable systemd health monitor timer.
- Monitor PM2 process status.
- Monitor CPU, memory, disk, Redis, database, queues, and health endpoints.

Logging:

- Install logrotate config.
- Confirm PM2 logs under `logs/pm2`.
- Confirm Nginx access and error logs.
- Confirm audit logging remains application-level.

## Verification Results

Commands required after this document:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

The final results are reported in the Milestone 12 completion response.

## Remaining Work

- Provision real Ubuntu infrastructure.
- Configure real DNS records.
- Issue real Let's Encrypt certificates.
- Add production secrets through `.env` or a future secret manager.
- Enable off-server backup storage.
- Enable strict nonce-based frontend CSP in a future hardening milestone.
- Replace future worker and scheduler placeholders when their runtime entrypoints are approved.

## Self-Review

- Infrastructure is aligned with Ubuntu, Node.js, PM2, and Nginx.
- Docker was not introduced.
- Business logic was not redesigned.
- Frontend UI was not redesigned.
- Courier logic was not modified.
- Payment logic was not modified.
- Authentication flow was not redesigned.
- Database models were not changed.
- Existing health, Redis, queue, billing, admin, auth, and frontend milestone boundaries were preserved.

## Approval Gate

Milestone 12 stops here. Milestone 13 must not start without explicit approval.
