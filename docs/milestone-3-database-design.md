# Milestone 3 - Database Design with Prisma

Status: Complete
Completed: 2026-08-03

## Scope

Milestone 3 installs and configures Prisma, establishes PostgreSQL database design, creates schema/migration artifacts, and documents relationships. It does not implement authentication, courier providers, search engine, Redis, BullMQ, payments, subscription logic, API endpoints, business services, controllers, or frontend features.

## Prisma Configuration

- Prisma schema: `database/prisma/schema.prisma`
- Prisma config: `backend/prisma.config.ts`
- Datasource provider: PostgreSQL
- Connection source: `DATABASE_URL`
- Initial migration: `database/prisma/migrations/20260803183000_initial_database_design/migration.sql`

## Models

Core tenancy and identity design:

- `Tenant`
- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`

Commercial SaaS design:

- `Plan`
- `Subscription`
- `Payment`
- `Invoice`
- `Coupon`
- `PromoCode`

Fraud/search design:

- `SearchHistory`
- `FraudResult`
- `CourierAccount`

Developer and integration design:

- `ApiKey`
- `WebhookEndpoint`
- `WebhookDelivery`

Operations and content design:

- `Notification`
- `AuditLog`
- `SupportTicket`
- `Announcement`
- `BlogPost`
- `SystemSetting`
- `FeatureFlag`
- `StoredFile`

## Relationships

- `Tenant` owns tenant-scoped business records.
- `User` belongs to one `Tenant`.
- `User`, `Role`, and `Permission` use join tables for RBAC.
- `Plan` has many `Subscription` records.
- `Subscription` belongs to `User` and `Plan`.
- `Payment` can belong to a `Subscription`.
- `Invoice` can reference a `Subscription` and `Payment`.
- `SearchHistory` can belong to a `User` and has many `FraudResult` records.
- `FraudResult` belongs to one `SearchHistory` and one provider enum.
- `CourierAccount` belongs to a `Tenant` and stores encrypted credential payload metadata only.
- `ApiKey` belongs to a `Tenant` and optionally a `User`.
- `WebhookEndpoint` has many `WebhookDelivery` records.
- `AuditLog` can reference an actor `User`.
- `StoredFile` belongs to a `Tenant` and optionally an uploader `User`.

## Index Strategy

- Tenant-scoped records index `tenant_id` with status, user, provider, or created timestamp depending on query pattern.
- Soft-deletable business records index `deleted_at` with tenant scope.
- Search history indexes normalized phone number and creation time for fast history lookup.
- Fraud results index provider and creation time for provider reporting.
- API keys index public prefix, hash, status, user, and tenant scope.
- Webhook deliveries have uniqueness by endpoint and event ID for idempotency.
- Payment, subscription, and invoice models include idempotency/source keys to prevent duplicate side effects.
- Audit logs index actor, resource, and correlation ID for traceability.

## Constraints

- All primary keys use UUIDs.
- Tenant slugs are unique.
- Tenant-scoped slugs/codes are unique where required.
- User emails are unique inside a tenant.
- Role permissions and user roles use composite primary keys.
- Fraud results are unique by search history and provider.
- API key hashes are globally unique and public prefixes are tenant-unique.
- Payment idempotency keys are tenant-unique.
- Invoice source keys and invoice numbers are tenant-unique.
- Webhook endpoint/event pairs are unique for safe retries.

## Migration Summary

The initial migration creates:

- PostgreSQL enum types for statuses, providers, billing, risk, webhooks, content, and file storage.
- Tenant-ready SaaS tables.
- RBAC tables and join tables.
- Billing/payment/invoice/coupon tables.
- Search history and normalized fraud result tables.
- Courier account table with encrypted credential field.
- API key, webhook, notification, audit, support, content, settings, feature flag, and file tables.
- Foreign keys, unique constraints, and indexes from the Prisma schema.

## ERD Summary

ERD documentation was generated at:

`database/erd/database-relationships.md`

High-level shape:

- `Tenant` is the root for tenant-scoped records.
- Identity/RBAC branches from `User`, `Role`, and `Permission`.
- Billing branches from `Plan`, `Subscription`, `Payment`, and `Invoice`.
- Search branches from `SearchHistory` to `FraudResult`.
- Integration branches include `CourierAccount`, `ApiKey`, and webhook tables.
- Operational branches include audit logs, notifications, support tickets, content, settings, feature flags, and stored files.

## Seed Architecture

Seed architecture is documented at:

`database/seeds/README.md`

No production data is inserted in Milestone 3.

## Verification

The following commands completed successfully:

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
```

`prisma validate` was run with a placeholder local PostgreSQL `DATABASE_URL` only for configuration validation.

## Self-Review

- Scalability: Tenant-scoped indexes and normalized high-volume search tables are ready for future scale.
- Security: Merchant credentials are represented as encrypted payloads only; API keys store hashes, not secrets.
- Maintainability: Database schema is grouped by domain and documented with relationship notes.
- Performance: Common query paths have explicit compound indexes.
- Future extensibility: Tenant, feature flag, file storage, API key, webhook, and normalized fraud result tables support later milestones.
- Scope control: No Milestone 4 or later behavior was implemented.

## Approval Gate

Milestone 3 is complete. Milestone 4 must not begin until user approval is provided.