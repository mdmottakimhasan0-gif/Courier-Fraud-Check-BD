# Backend API Guide

All backend responses use the approved envelope:

```json
{
  "success": true,
  "message": "Request completed",
  "data": {},
  "meta": {},
  "correlationId": "uuid",
  "timestamp": "ISO-8601"
}
```

## Main Areas
- Authentication: register, login, refresh, logout, email verification, password reset, profile, sessions.
- Fraud Search: phone search, status, result, details, history.
- Billing: plans, subscriptions, invoices, payments, coupons, usage.
- Admin: users, RBAC/PBAC, courier credentials, API keys, billing operations, feature flags, audit logs, system settings.
- Health: application, database, Redis, queue.

Swagger/OpenAPI remains the source of truth for exact DTO schema and examples.
