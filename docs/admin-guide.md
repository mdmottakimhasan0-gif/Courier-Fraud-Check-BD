# Admin Guide

## Admin Coverage
The admin dashboard provides live API-backed workspaces for:
- Users, roles, permissions
- Merchant credentials and courier providers
- API keys
- Plans, subscriptions, coupons, promo campaigns, invoices, payments
- Analytics, search logs, audit logs
- Announcements, feature flags, system settings, maintenance
- Redis, queues, monitoring, health

## Security
- Admin APIs must remain protected by RBAC and PBAC.
- Support impersonation, if enabled later, must be Super Admin only and fully audit logged.
- Maintenance mode supports banner, read-only behavior, and whitelisting as documented in architecture.
