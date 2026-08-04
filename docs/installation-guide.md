# Installation Guide

## Requirements
- Ubuntu Server 22.04+ or compatible Linux host
- Node.js 22+
- npm 10+
- PostgreSQL 16+
- Redis 7+
- PM2
- Nginx

## Setup
1. Clone or copy the project into `/var/www/courier-fraud-check-bd`.
2. Run `npm install` from the project root.
3. Copy `.env.example` into environment-specific files for backend and frontend.
4. Configure PostgreSQL, Redis, JWT secrets, encryption keys, CORS origins, and public app/API URLs.
5. Run backend Prisma validation and migrations according to the migration runbook.
6. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
7. Start production processes with `ecosystem.config.js`.

## Notes
- Merchant credentials must be encrypted and never stored in plain text.
- Docker is intentionally not introduced; the approved target is Ubuntu + Node.js + PM2 + Nginx.
