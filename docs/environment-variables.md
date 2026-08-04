# Environment Variables

## Backend
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PASSWORD_PEPPER`
- `CREDENTIAL_ENCRYPTION_KEY`
- `CORS_ALLOWED_ORIGINS`
- `COOKIE_DOMAIN`
- `LOG_LEVEL`
- `SENTRY_DSN` optional future-ready error tracking

## Frontend
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Production Rules
- Do not commit real secrets.
- Development may use `.env` files.
- Production should use a Secret Manager or encrypted secret storage.
- Merchant credentials must never be stored in plain text.
