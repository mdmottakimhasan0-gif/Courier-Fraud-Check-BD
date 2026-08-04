# Troubleshooting Guide

## Frontend Cannot Reach API
- Verify `NEXT_PUBLIC_API_BASE_URL`.
- Confirm Nginx proxy path and backend PM2 process.
- Check CORS allowed origins.

## Login Fails
- Confirm backend auth service health.
- Check secure cookie domain and HTTPS.
- Review account status and session audit logs.

## Search Is Slow
- Check provider latency in search result metadata.
- Review circuit breaker state.
- Check Redis cache health and cache hit rate.

## Billing Data Missing
- Verify billing API health and plan seed state.
- Confirm authenticated session permissions.

## Build Fails
- Run workspace-specific lint/typecheck.
- Clear stale build output only after confirming it is generated output.
