# Courier Fraud Check BD - System Architecture Documentation

Status: Milestone 0 draft for approval
Date: 2026-08-03
Code generation status: Not started

## 1. Executive Summary

Courier Fraud Check BD will be a commercial, production-ready enterprise SaaS platform for checking Bangladeshi courier delivery reliability by phone number. The platform's primary goals are 99.9%+ uptime, horizontal scalability, low-latency search, secure merchant credential storage, enterprise-grade security, and readiness for paid SaaS operations.

The system will support customer-facing dashboards, admin operations, subscription billing, public REST API access, API keys for third-party developers, webhook-driven payment and subscription events, background processing, auditability, and future multi-tenant, reseller, partner dashboard, mobile app, courier API marketplace, white-label, and AI risk prediction expansion.

Search performance targets are under 300ms for cached results and 2-8 seconds for fresh searches depending on courier response time. Fresh searches will be designed around parallel provider execution, automatic retries, circuit breakers, graceful degradation, and partial-result handling so that one courier failure does not fail the entire search.

The final SaaS must not contain GPL source code, implementation details, class structure, copied algorithms, comments, naming patterns, or files. The uploaded GPL-3.0 courier package is used strictly for behavioral analysis. All courier integrations will be independently implemented in TypeScript using the user's own merchant credentials and independently designed adapter logic.

## 2. Source Analysis Summary

### 2.1 Courier Package Behavioral Reference

Observed real courier providers:

- Steadfast
- Pathao
- RedX

Observed behavior to reimplement independently:

- Validate Bangladeshi phone numbers in local format.
- Authenticate to courier merchant systems using merchant credentials.
- Maintain request-scoped cookies or access tokens depending on provider.
- Query customer delivery success/return data.
- Normalize provider-specific responses into common delivery statistics.
- Aggregate courier results into total orders, successful deliveries, cancelled/returned deliveries, success rate, return rate, and risk metrics.

License rule:

- No GPL source files, comments, implementation structure, or copied snippets will be included in the SaaS.

### 2.2 Laravel Reference Project

The Laravel project is a lightweight reference app. It confirms the simple business search flow:

1. User enters a phone number.
2. Server validates the Bangladeshi phone format.
3. Server checks Steadfast, Pathao, and RedX.
4. Results are displayed per courier.
5. Delivery, cancellation, total, delivered percentage, and return percentage are shown.

The Laravel UI, controllers, and framework scaffolding will not be reused.

## 3. Target Technology Stack

Frontend:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- TanStack Query
- Zod
- React Hook Form
- ApexCharts
- Lucide Icons

Backend:

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- JWT
- Passport
- Bcrypt or Argon2
- Class Validator
- OpenAPI/Swagger

Deployment:

- Ubuntu 24.04
- PM2
- Nginx
- Let's Encrypt SSL
- No Docker
- No cPanel

## 4. High-Level Architecture

The platform will use a modular monorepo with clean boundaries:

- `apps/web`: Next.js frontend.
- `apps/api`: NestJS backend.
- `packages/shared`: shared TypeScript types, validation contracts, constants, and non-sensitive utilities.

Backend module style:

- Each business capability owns its module, DTOs, domain services, repositories, queue processors, policies, and tests.
- Cross-cutting features are provided by infrastructure modules.
- Modules communicate through interfaces and service contracts, not direct database or implementation coupling.

Primary backend layers:

- API layer: controllers, DTOs, guards, interceptors.
- Application layer: use cases, command/query handlers, orchestration.
- Domain layer: business rules, entities, value objects, policy contracts.
- Infrastructure layer: Prisma repositories, Redis cache, BullMQ jobs, HTTP clients, file storage, mail, payment providers.

## 5. Core Domain Modules

### 5.1 Identity and Access

Responsibilities:

- Register, login, logout.
- Refresh tokens.
- Forgot/reset password.
- Email verification.
- Role-based access control.
- Permission-based access control.
- Audit auth events.

Design:

- JWT access tokens.
- Refresh token rotation.
- Password hashes never returned.
- Sensitive auth events written to audit logs.

### 5.2 Tenant Readiness

V1 behavior:

- Single default tenant/workspace enabled.
- Tenant isolation fields are present but tenant switching may remain disabled.

Future-ready model:

- `tenant_id` on tenant-owned records.
- Tenant-aware repository filters.
- Tenant context resolved from authenticated user, API key, or future custom domain.
- White-label fields reserved for branding and custom domain support.

### 5.3 Courier Integrations

Responsibilities:

- Independently implemented Steadfast adapter.
- Independently implemented Pathao adapter.
- Independently implemented RedX adapter.
- Provider credential encryption.
- Provider-level timeout, retry, and error normalization.
- Provider result normalization.

Provider contract:

- Input: validated local BD phone number.
- Output: normalized provider result containing success count, cancelled/returned count, total count, success rate, return rate, provider status, and diagnostic metadata safe for logs.

Credential handling:

- Merchant credentials stored encrypted at rest.
- Decryption only inside provider adapter execution.
- Credentials never written to logs or exposed in API responses.

### 5.4 Fraud Search

Responsibilities:

- Validate phone numbers.
- Check usage limits.
- Dispatch search tasks.
- Query all enabled courier providers.
- Merge provider results.
- Calculate risk score and risk badge.
- Persist search history and fraud result snapshots.
- Serve cached results for duplicate searches.

Processing model:

- Synchronous fast path may be used for small interactive searches.
- BullMQ-backed asynchronous path will support scale, retries, priority queues, and API users.

### 5.5 Subscription and Billing

Responsibilities:

- Plans: Free, Basic, Pro, Business, Enterprise.
- Daily/monthly search limits.
- API access entitlement.
- Export entitlement.
- Priority queue entitlement.
- Payment records.
- Invoices.
- Coupons and promo codes.

Payment providers:

- bKash
- Nagad
- SSLCommerz

### 5.6 API Keys for Developers

Responsibilities:

- Create, revoke, rotate, and list API keys.
- Store only hashed API keys.
- Scope keys by tenant, user, plan, permissions, and rate limits.
- Support API search endpoints.
- Log API usage.

API key format:

- Public prefix for identification.
- Secret token shown once.
- Hash stored in database.

### 5.7 Webhooks

Responsibilities:

- Emit subscription and payment events.
- Support future external integrations.
- Retry failed deliveries.
- Sign webhook payloads.
- Track delivery attempts and responses.

Initial events:

- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `payment.created`
- `payment.succeeded`
- `payment.failed`
- `invoice.created`
- `invoice.paid`

### 5.8 Notifications and Email

Responsibilities:

- Email verification.
- Password reset.
- Payment notices.
- Subscription updates.
- Admin announcements.
- In-app notifications.

Processing:

- BullMQ queues handle email and notification dispatch.

### 5.9 Admin Operations

Responsibilities:

- User management.
- Subscription management.
- Payment management.
- Coupon management.
- Search logs.
- Courier credential management.
- SMTP settings.
- System settings.
- Audit logs.
- Support tickets.
- Announcements, blogs, news.

### 5.10 Internationalization

Languages:

- English
- Bangla

Design:

- Frontend i18n dictionary structure.
- Backend error codes and translatable message keys.
- User-level locale preference.
- Admin-editable future content can be locale-aware.

### 5.11 Feature Flags

Responsibilities:

- Enable/disable future features safely.
- Gate tenant features, API access, payment providers, exports, white-label, affiliate, referral, GraphQL, and beta UI.

Design:

- Database-backed flags.
- Environment fallback.
- Tenant/user/plan scoped overrides later.

### 5.12 File Storage

Responsibilities:

- Store generated PDFs, CSV exports, invoices, support attachments, and future assets.

Design:

- Storage interface.
- Local disk implementation for v1.
- S3-compatible adapter later.
- File metadata stored in database.

## 6. Background Jobs with BullMQ

Queues:

- `search`: courier checks, retries, priority processing.
- `notifications`: in-app notifications.
- `email`: transactional emails.
- `webhooks`: webhook dispatch and retry.
- `billing`: invoice/payment/subscription follow-up jobs.
- `maintenance`: scheduled cleanup, cache invalidation, backups.

Worker design:

- Each worker has explicit concurrency limits.
- Provider calls have timeout budgets.
- Failed jobs use controlled retries with backoff.
- Dead-letter handling records failure context without secrets.

Scheduled jobs:

- Daily usage reset checks.
- Monthly usage rollover.
- Expired subscription checks.
- Stale refresh token cleanup.
- Old audit/search log retention tasks.
- Backup tasks.

## 7. Redis Caching Strategy

Cache categories:

- Search result cache.
- Provider token/session cache where appropriate.
- Rate limit counters.
- Permission and plan entitlement cache.
- Feature flag cache.
- Short-lived API key lookup cache.

Search cache:

- Key pattern: tenant plus normalized phone plus enabled provider set.
- TTL: 10 minutes.
- Stores normalized result snapshot.

Invalidation rules:

- Search cache expires automatically after TTL.
- Courier credential change invalidates provider session/token cache.
- Plan/subscription update invalidates entitlement cache.
- Role/permission update invalidates permission cache.
- Feature flag update invalidates flag cache.
- API key revoke/rotate invalidates API key cache.

Safety rules:

- Do not cache raw credentials.
- Do not cache decrypted secrets.
- Do not cache sensitive reset tokens beyond intended TTL.

## 8. Database Strategy

Database:

- PostgreSQL with Prisma.
- UUID primary keys.
- Soft delete on business records.
- `created_at`, `updated_at`, `deleted_at` where appropriate.
- `tenant_id` on future tenant-owned records.

Migration strategy:

- Prisma migrations checked into source control.
- One migration per coherent schema change.
- Production migration plan includes backup before migration.
- Backward-compatible migrations preferred.
- Destructive migrations require explicit approval.

Seeding strategy:

- Seed default tenant/workspace.
- Seed system roles and permissions.
- Seed subscription plans.
- Seed core feature flags.
- Seed admin user only through secure local setup flow or controlled command.
- Seed default system settings.

Core tables:

- Tenants/workspaces
- Users
- Roles
- Permissions
- User roles
- Plans
- Subscriptions
- Payments
- Invoices
- Coupons
- Promo codes
- Search history
- Fraud results
- Courier accounts
- API keys
- Webhook endpoints
- Webhook deliveries
- Notifications
- Audit logs
- Support tickets
- Announcements
- Blogs/news
- System settings
- Feature flags
- Files

## 9. API Design

Base path:

- `/api/v1`

Documentation:

- OpenAPI/Swagger generated from NestJS decorators.
- Swagger enabled in non-production by default.
- Production Swagger access can be admin-protected.

API groups:

- Auth
- Users
- Roles and permissions
- Fraud search
- Search history
- Subscriptions
- Payments
- Coupons
- Invoices
- Courier accounts
- API keys
- Webhooks
- Notifications
- Admin settings
- Health

Future GraphQL:

- Domain/application layers remain transport-agnostic so GraphQL can be added later without rewriting core business logic.

## 10. Security Checklist

Required controls:

- Helmet.
- CORS allowlist.
- CSRF protection where cookie-based browser flows require it.
- Rate limiting with Redis.
- Strong input validation with DTOs and Zod on frontend.
- Password hashing with strong parameters.
- Refresh token rotation.
- Secure secret management through environment variables and encrypted database fields.
- AES-GCM or equivalent authenticated encryption for merchant credentials.
- No secrets in logs.
- SQL injection protection through Prisma parameterization.
- XSS prevention through safe rendering and sanitization where needed.
- Audit logs for sensitive actions.
- Permission checks on admin and billing actions.
- API key hashing and scope checks.
- Webhook signature verification for inbound provider callbacks where supported.
- Outbound webhook signing.

## 11. Monitoring and Observability

Health endpoints:

- Liveness endpoint.
- Readiness endpoint.
- Database connectivity check.
- Redis connectivity check.
- Queue health check.

Logging:

- Structured JSON logs in production.
- Correlation/request ID for each request.
- User/tenant context when safe.
- Provider errors normalized without secrets.

Metrics future-readiness:

- Request latency.
- Error rates.
- Queue depth.
- Job failures.
- Search volume.
- Provider availability.

Error tracking:

- Interface prepared for Sentry or equivalent later.
- Error reports scrub secrets and PII.

## 12. Backup and Disaster Recovery

Backup targets:

- PostgreSQL database.
- Local file storage or S3-compatible bucket later.
- Environment/configuration inventory without exposing secret values.

Backup schedule:

- Daily database backups.
- More frequent backups for high-volume production later.
- Retention policy by plan/operation maturity.

Recovery plan:

- Restore database to staging first.
- Verify migrations and app compatibility.
- Restore files.
- Validate health endpoints.
- Perform smoke tests.
- Promote restored instance if needed.

Disaster recovery goals:

- Define RPO and RTO before production launch.
- Keep runbooks for database restore, Redis rebuild, queue replay, and credential rotation.

## 13. Testing Strategy

Unit tests:

- Domain services.
- Risk scoring.
- Phone validation.
- Permission checks.
- Cache key generation.
- Feature flag resolution.
- Provider response normalizers.

Integration tests:

- API controllers with test database.
- Prisma repositories.
- Redis cache behavior.
- BullMQ queue flows.
- Auth refresh flow.
- API key auth.
- Webhook dispatch retry.

End-to-end tests:

- Register/login/search/history flow.
- Admin plan and user management flow.
- Subscription/payment happy path with mocked providers.
- API key search flow.
- Export flow.

Courier tests:

- Real courier integrations should use mocked HTTP fixtures by default.
- Live credential-based smoke tests are separate, manual or protected, and never run in normal CI.

## 14. Loose Coupling and Independent Testability

Rules:

- Every module exposes interfaces for external dependencies.
- Provider integrations are behind adapter contracts.
- Repositories are injected through abstractions.
- Job processors call application services, not controllers.
- Frontend API calls go through typed client functions.
- Shared validation contracts live in shared packages where useful.
- Modules must be testable without real courier systems, payment systems, SMTP, or S3.

## 15. Updated Milestone Plan

### Milestone 0: System Architecture Documentation

Deliverables:

- Architecture document.
- Updated milestone plan.
- License boundary decision.
- Module boundaries.
- Security, testing, caching, queueing, backup, and deployment strategy.

Approval required before code generation.

### Milestone 1: Project Foundation

Tasks:

- Create D-drive project root.
- Create monorepo layout.
- Configure Next.js, NestJS, TypeScript, linting, formatting.
- Add environment schema planning.
- Add initial README and project scripts.

Dependencies:

- Node.js package manager.
- No Docker.
- No cPanel.

### Milestone 2: Backend Core and Infrastructure

Tasks:

- NestJS module architecture.
- Config module.
- Global validation.
- Global exception filter.
- Structured logging.
- API versioning.
- Health endpoints.
- OpenAPI/Swagger setup.

Dependencies:

- NestJS packages.

### Milestone 3: Database, Migration, and Seeding

Tasks:

- Prisma setup.
- PostgreSQL schema.
- UUID and soft-delete conventions.
- Tenant-ready schema.
- Migration workflow.
- Seed roles, permissions, plans, flags, default tenant, and settings.

Dependencies:

- PostgreSQL.
- Prisma.

### Milestone 4: Security, Auth, RBAC, and Secret Handling

Tasks:

- Register/login/logout.
- Refresh tokens.
- Forgot/reset password.
- Email verification.
- Roles and permissions.
- Rate limiting.
- Merchant credential encryption.
- Audit logging.

Dependencies:

- Database schema.
- Redis for rate limits and token/session support.
- Mail service configuration.

### Milestone 5: Courier Adapter Layer

Tasks:

- Independently implement Steadfast adapter.
- Independently implement Pathao adapter.
- Independently implement RedX adapter.
- Normalize provider responses.
- Add provider-level retries, timeouts, and error mapping.
- Add mocked integration tests.

Dependencies:

- User merchant credentials.
- HTTP client.
- Credential encryption.

### Milestone 6: Fraud Search Engine and Redis Cache

Tasks:

- Phone validation.
- Parallel provider checks.
- BullMQ search jobs.
- 10-minute search cache.
- Cache invalidation rules.
- Risk scoring.
- Search history and result persistence.
- Usage limit enforcement.

Dependencies:

- Courier adapters.
- Redis.
- BullMQ.
- Prisma models.

### Milestone 7: API Key and Developer Platform

Tasks:

- API key creation, revocation, rotation.
- Scoped API key authentication.
- API usage logging.
- Developer search endpoint.
- OpenAPI documentation for developers.

Dependencies:

- Auth.
- Permissions.
- Rate limiting.

### Milestone 8: Subscription, Billing, Payments, and Webhooks

Tasks:

- Plans and subscription lifecycle.
- bKash/Nagad/SSLCommerz integration structure.
- Coupons and promo codes.
- Invoices.
- Payment/subscription webhooks.
- Outbound webhook delivery system.

Dependencies:

- Payment provider credentials/docs.
- Queue system.
- Billing schema.

### Milestone 9: User Dashboard

Tasks:

- Dashboard shell.
- Search page.
- Premium result UI.
- Charts, cards, table, timeline, risk badge.
- History, favorites, notifications.
- Profile, settings, dark mode.
- Bangla/English UI.

Dependencies:

- Search API.
- Auth API.
- i18n setup.

### Milestone 10: Admin Panel

Tasks:

- Admin dashboard.
- User management.
- Subscription/payment/coupon management.
- Courier credential management.
- SMTP/settings.
- Search logs.
- Audit logs.
- Support tickets.
- Announcements, blogs, news.
- Feature flag management.

Dependencies:

- RBAC.
- Billing/search modules.

### Milestone 11: File Storage, Exports, and Documents

Tasks:

- Local file storage adapter.
- S3-compatible abstraction.
- CSV export.
- PDF export.
- Invoice files.
- Attachment handling.

Dependencies:

- Storage interface.
- Search results.
- Billing module.

### Milestone 12: Testing Hardening

Tasks:

- Unit test expansion.
- Integration tests.
- End-to-end tests.
- Mock courier fixtures.
- Auth and API key test suites.
- Queue and webhook tests.

Dependencies:

- Core modules complete enough to test.

### Milestone 13: Production Deployment and Operations

Tasks:

- Ubuntu 24.04 deployment guide.
- PM2 config.
- Nginx config.
- Let's Encrypt SSL.
- Backup scripts/strategy.
- Monitoring checklist.
- Security checklist.
- Disaster recovery runbook.

Dependencies:

- Production server/domain details later.

## 16. Final Architecture Revision

### 16.1 Distributed Search Locking

The search system will use Redis distributed locks to prevent duplicate external courier requests for the same tenant, normalized phone number, and enabled provider set.

Lock behavior:

- Lock key includes tenant/workspace, normalized phone number, and provider set hash.
- Lock acquisition uses Redis `SET key value NX PX ttl` or an equivalent atomic locking primitive.
- Only the request that acquires the lock may execute external courier requests.
- Concurrent requests for the same search key must not call couriers again.
- Waiting requests poll or subscribe for the running result and then return the completed cached result.
- Lock value uses a unique request token so cleanup only removes the owner's lock.
- Lock timeout must be longer than expected fresh search duration and shorter than the maximum stuck-job tolerance.
- Expired locks are automatically cleaned up by Redis TTL.

Recommended timing:

- Fresh search target: under 8 seconds.
- Search lock TTL: 15-30 seconds for interactive search.
- Worker-level hard timeout: provider timeout budget plus aggregation margin.

Safety rules:

- A stale lock must not permanently block searches.
- A lock timeout should trigger a controlled retry or a failed search state.
- Lock cleanup must use token comparison to avoid deleting a newer lock.

### 16.2 Search Deduplication

Search deduplication ensures that simultaneous identical requests share one running search result.

Deduplication key:

- Tenant/workspace ID.
- Normalized phone number.
- Enabled courier provider set.
- Search mode and entitlement-sensitive options.

Request lifecycle:

1. Request arrives and validates the phone number.
2. System checks the 10-minute search cache.
3. If cached, return cached result with status `Cached`.
4. If not cached, system checks whether an active search exists for the deduplication key.
5. If no active search exists, create a search record, acquire Redis lock, enqueue or execute the search, and mark it `Queued` or `Searching`.
6. If an active search exists, attach the request to the running search instead of calling couriers again.
7. Waiting requests receive the completed result when the first search finishes, or receive a timeout/pending response depending on API mode.
8. Completed result is persisted and written to cache.
9. Lock and active-search markers are released.

Interactive dashboard behavior:

- Short waits may hold the HTTP request while the search completes.
- Longer searches may return a search ID and allow the frontend to poll or subscribe for status updates.

Public API behavior:

- API clients may receive a completed result, cached result, or accepted/pending response depending on endpoint mode.

### 16.3 Provider Circuit Breaker

Each courier provider adapter will include an independent circuit breaker so one failing provider cannot degrade the entire search system.

Circuit states:

- Closed: provider is healthy and requests are allowed.
- Open: provider is considered failing and requests are blocked for a cooldown period.
- Half-open: a limited probe request is allowed to test recovery.

Failure threshold:

- Open the circuit after a configured number or percentage of failures within a rolling window.
- Failure signals include timeout, authentication failure, connection error, malformed response, and repeated provider-side errors.
- Credential-specific failures may mark only that merchant credential as unhealthy rather than the whole provider.

Cooldown period:

- Provider-specific cooldown avoids repeated calls to failing upstream systems.
- Cooldown may use exponential backoff for repeated outages.

Recovery strategy:

- After cooldown, move to half-open.
- Allow a small number of probe requests.
- If probes succeed, close the circuit.
- If probes fail, reopen the circuit and extend cooldown.

Search behavior:

- Open circuit providers are skipped.
- Skipped providers return a normalized degraded/unavailable result.
- Overall search continues with remaining providers.
- Partial courier failures never fail the entire search.

### 16.4 Provider Health Monitoring

Provider health monitoring will aggregate provider status from recent requests, credential verification checks, circuit breaker state, and worker metrics.

Admin dashboard fields:

- Provider status: Online, Offline, or Degraded.
- Average response time.
- Failure rate.
- Last successful request.
- Last failure.
- Current circuit breaker state.
- Active credential status.
- Last credential verification time.
- Recent error category.

Status rules:

- Online: recent successful responses and closed circuit.
- Degraded: elevated latency, partial failures, half-open circuit, or elevated failure rate.
- Offline: open circuit, repeated failures, or credential/login failure.

Monitoring cadence:

- Passive health from normal searches.
- Active checks through admin credential verification.
- Optional scheduled health checks where safe and compliant with provider usage.

### 16.5 Merchant Credential Verification

Merchant credentials must remain encrypted throughout storage and verification.

Admin workflow:

1. Admin enters or updates courier merchant credentials.
2. Backend validates input format.
3. Credentials are encrypted before persistence.
4. Admin triggers test connection.
5. System decrypts credentials only in memory inside the verification workflow.
6. Provider login/session/API validity is tested.
7. Latency is measured.
8. Connection status and safe diagnostics are stored.
9. Secrets are removed from memory as soon as practical and never logged.

Verification result:

- Provider name.
- Credential/account status.
- Login or API validity status.
- Latency.
- Last verified timestamp.
- Safe error category if failed.

Credential security:

- Encrypted at rest with authenticated encryption.
- Decryption key managed through secure environment secret management.
- Credential reads and updates are audit logged.
- Credential rotation is supported.

### 16.6 Queue Priority Strategy

BullMQ search jobs will use plan-based priorities.

Priority levels:

- Enterprise: highest priority.
- Business: high priority.
- Pro: medium priority.
- Basic: low priority.
- Free: lowest priority.

Queue behavior:

- Higher-priority jobs are processed before lower-priority jobs where BullMQ priority scheduling allows.
- Enterprise and Business plans may receive higher concurrency or reserved worker capacity later.
- Free and Basic searches may be delayed during peak load.
- Retries keep the original plan priority unless abuse controls downgrade or block the request.
- Cached results bypass queue execution whenever possible.
- Deduplicated searches share the priority of the highest entitled waiting request when safe.

Fairness rules:

- Prevent one tenant or API client from starving others.
- Combine priority with per-user, per-tenant, and per-IP rate limits.
- Maintain separate worker concurrency limits for search, email, notifications, billing, webhooks, and maintenance queues.

### 16.7 Abuse Detection

Abuse prevention will protect courier providers, platform stability, and paid-plan fairness.

Controls:

- Rate limiting by IP, account, tenant, API key, and endpoint.
- Repeated search detection for the same phone number.
- Bot detection hooks for suspicious browser, automation, or traffic patterns.
- Temporary blocks for abusive behavior.
- Progressive penalties for repeated violations.
- Captcha trigger for suspicious anonymous or login/search activity.
- IP reputation and velocity monitoring.
- Account behavior monitoring.
- API key quota and anomaly checks.

Progressive response:

1. Soft warning or increased friction.
2. Captcha challenge.
3. Temporary rate reduction.
4. Temporary block.
5. Account/API key suspension pending admin review.

Auditability:

- Abuse decisions should record correlation ID, actor, IP, reason, and enforcement action.

### 16.8 Audit Log Expansion

Every sensitive action must produce an audit log entry.

Required audit fields:

- Actor.
- Role.
- Tenant/workspace.
- IP address.
- Browser.
- Device.
- Timestamp.
- Action.
- Resource type.
- Resource ID.
- Previous value.
- New value.
- Reason.
- Correlation ID.

Sensitive actions:

- Login/logout/security events.
- Role and permission changes.
- Subscription and payment changes.
- API key creation, rotation, and revocation.
- Courier credential create/update/delete/test.
- System setting changes.
- Feature flag changes.
- Webhook endpoint changes.
- Admin user actions.

Security rules:

- Audit logs must not contain raw secrets, passwords, tokens, API keys, or decrypted merchant credentials.
- Sensitive value diffs must be redacted or summarized.

### 16.9 Search Lifecycle

Search lifecycle states:

- Pending: request accepted but not yet queued or executed.
- Queued: search job is waiting in BullMQ.
- Searching: one or more provider checks are running.
- Partially Completed: at least one provider succeeded and at least one provider failed, timed out, was skipped, or is degraded.
- Completed: all required provider checks finished successfully or with acceptable normalized states.
- Failed: search could not produce any usable result.
- Cancelled: search was cancelled by user, timeout, admin action, or system control.
- Cached: result served from cache without external courier calls.

Transitions:

- Pending to Cached when cache hit is found.
- Pending to Queued when asynchronous processing is selected.
- Pending to Searching when synchronous fast path starts immediately.
- Queued to Searching when a worker starts the job.
- Searching to Partially Completed when some providers fail or are skipped but others return results.
- Searching to Completed when all provider responses are processed.
- Searching to Failed when no provider can return usable data.
- Any active state to Cancelled when timeout, cancellation, or policy enforcement occurs.
- Completed or Partially Completed results are persisted and cached when eligible.

Partial-result rule:

- Provider failure, timeout, or open circuit must be represented in provider-level status and must not fail the whole search if another provider returns usable data.

### 16.10 Disaster Recovery

Backup scope:

- PostgreSQL database.
- Redis recovery plan.
- File storage.
- Configuration inventory.
- Deployment and PM2/Nginx process configuration.

Database backups:

- Daily automated backups for v1 production.
- More frequent point-in-time recovery later if infrastructure supports it.
- Backup verification through scheduled restore tests.

Redis recovery:

- Redis is treated primarily as cache, lock, queue, and rate-limit infrastructure.
- Search result cache can be rebuilt from database or fresh searches.
- Queue failure recovery requires BullMQ persistence configuration and operational runbook.
- Distributed locks are short-lived and should not be restored.

File storage backup:

- Local storage backed up with database consistency awareness.
- S3-compatible storage later should use bucket versioning/lifecycle policies where available.

Configuration backup:

- Store non-secret configuration templates in source control.
- Maintain secure secret inventory outside the repository.
- Record required environment variable names without secret values.

Recovery objectives:

- Define RPO and RTO before launch.
- Initial target should align with commercial SaaS expectations and 99.9% uptime goal.

Recovery procedure:

1. Provision clean server or staging environment.
2. Restore PostgreSQL backup.
3. Restore file storage.
4. Reapply environment configuration and secrets.
5. Start Redis and workers.
6. Run migrations if needed.
7. Validate health endpoints.
8. Run smoke tests.
9. Promote restored service or switch traffic.

### 16.11 Monitoring Expansion

Monitoring architecture will cover application, infrastructure, queues, database, Redis, and courier providers.

Health endpoints:

- Liveness.
- Readiness.
- Database check.
- Redis check.
- Queue check.
- Provider dependency summary.

Metrics:

- Request count, latency, and error rate.
- Search latency by cached vs fresh.
- Provider latency and failure rate.
- Queue depth and job age.
- Job success/failure/retry counts.
- Redis latency and memory pressure.
- Database latency and connection pool usage.
- Slow query count.

Logs:

- Structured JSON logs.
- Correlation ID per request/job.
- Tenant/user context when safe.
- Redacted provider diagnostics.

Alerts:

- High error rate.
- Provider outage/degradation.
- Queue backlog.
- Redis unavailable.
- Database unavailable or slow.
- High failed login/API key activity.
- Backup failure.
- Disk/storage pressure.

Dashboards:

- API health.
- Search performance.
- Provider health.
- Queue health.
- Billing/payment health.
- Security and abuse signals.

### 16.12 Security Enhancements

Secret rotation:

- Support periodic rotation of JWT secrets, encryption keys, API keys, webhook signing secrets, and merchant credentials.
- Key rotation must include migration or re-encryption procedure where needed.
- Old keys should have controlled overlap windows where safe.

Credential encryption lifecycle:

- Validate credentials before or after encryption depending on workflow.
- Encrypt before persistence.
- Decrypt only for provider operation or verification.
- Never log decrypted values.
- Re-encrypt on encryption key rotation.

API key hashing:

- Store only API key hash and public prefix.
- Show full secret once at creation.
- Support revocation and rotation.
- Scope keys by permissions, tenant, and plan.

Secure cookie policy:

- HttpOnly cookies.
- Secure cookies in production.
- SameSite policy appropriate to frontend/API deployment.
- Short-lived session cookies where applicable.

Browser security:

- Content Security Policy.
- HSTS.
- X-Frame-Options or CSP frame protections.
- Referrer policy.
- XSS-safe rendering practices.

Session and token control:

- Refresh token rotation.
- Session invalidation on password reset, credential compromise, or admin action.
- Token revocation list or versioning strategy.
- API key revocation takes effect immediately through cache invalidation.

### 16.13 Performance Targets

Search response targets:

- Cached search: under 300ms.
- Fresh search: under 8 seconds where courier providers respond within timeout budgets.
- Fresh search expected range: 2-8 seconds depending on courier response time.

Concurrency targets:

- Architecture should support horizontal scaling of API servers, workers, and frontend independently.
- Initial target capacity should be defined before load testing.
- Load tests should validate concurrent users, concurrent searches, and API key traffic.

Latency targets:

- Redis operations: low single-digit milliseconds under normal load.
- Database read/write operations: optimized through indexes and pagination.
- Queue enqueue latency: near-real-time under normal load.
- Queue wait time depends on plan priority and active load.

Provider timeout strategy:

- Each provider receives an explicit timeout budget.
- Slow providers should return degraded status rather than block the complete search indefinitely.
- Circuit breakers reduce latency during provider outages.

### 16.14 Future Expansion

Future-ready architecture must support:

- Mobile app.
- Public REST API.
- GraphQL.
- Partner dashboard.
- Reseller dashboard.
- White label.
- AI risk engine.
- Additional courier providers.
- Courier API marketplace.

Architecture implications:

- Keep domain logic transport-agnostic.
- Keep provider adapters pluggable.
- Keep API key scopes extensible.
- Maintain tenant-ready and brand-ready records.
- Store normalized historical results for future AI risk features.
- Keep feature flags available for staged rollout.

### 16.15 Secret Management

Development:

- Use `.env` files for local development only.
- Provide `.env.example` with variable names and safe placeholder values.
- Never commit real secrets, merchant credentials, JWT secrets, encryption keys, API keys, or payment credentials.

Production:

- Design for a Secret Manager or encrypted secret storage.
- Production secrets should be injected through the runtime environment or a managed secret provider.
- Secret access should be limited by least privilege.
- Secret rotation must be documented for JWT secrets, encryption keys, payment credentials, webhook signing secrets, API keys, and merchant credentials.

Merchant credential rule:

- Merchant credentials must never be stored in plain text.
- Credentials must be encrypted before database persistence.
- Decryption is allowed only in memory inside credential verification or provider execution workflows.
- Logs, audit records, queue payloads, metrics, and error reports must never contain raw merchant credentials.

### 16.16 Idempotency Strategy

Idempotency is required for all retry-sensitive workflows.

Payment processing:

- Payment initiation, confirmation, and provider callback handling must use idempotency keys.
- Duplicate provider callbacks must not create duplicate payments.
- Payment state transitions must be guarded by current state and unique provider transaction references.

Webhook handling:

- Incoming webhooks must be deduplicated by provider event ID, signature metadata, or a computed payload fingerprint.
- Outbound webhook delivery attempts must be retry-safe and tracked per endpoint/event.

Subscription activation:

- Subscription activation must be idempotent by user, plan, payment, and billing period.
- Replayed payment success events must not extend or activate subscriptions multiple times unless explicitly intended by a renewal record.

Invoice generation:

- Invoice creation must use a deterministic invoice source key such as tenant, subscription, billing period, and payment reference.
- Duplicate invoice generation attempts must return the existing invoice.

Retry-safe background jobs:

- BullMQ jobs must include stable job IDs or idempotency keys for workflows that can be retried.
- Job handlers must check persisted state before applying side effects.
- Retries must be safe for email, notification, billing, webhook, export, and search workflows.

### 16.17 Search Cost Control

External courier API usage must be controlled to protect provider accounts, reduce cost, and preserve platform reliability.

Controls:

- Per-user search limits.
- Per-subscription-plan daily and monthly limits.
- Hourly limits to prevent bursts.
- Tenant-level limits for future multi-tenant usage.
- API key-specific limits for developer access.
- Global emergency limits when courier providers degrade or usage spikes.
- Search deduplication and Redis locking to avoid duplicate external calls.
- Cached result reuse for duplicate searches within the configured cache window.

Cost monitoring:

- Track external courier request count by provider, tenant, user, API key, and plan.
- Track cache hit rate and deduplication savings.
- Track failed, skipped, and circuit-breaker-blocked provider calls.
- Provide admin reporting for usage trends and abnormal spikes.

Emergency controls:

- Admins can lower global limits during incidents.
- Feature flags can disable high-cost features or specific providers.
- Circuit breakers can temporarily stop requests to failing providers.

### 16.18 Admin Impersonation

The platform may include a secure "Login as User" support feature.

Access rules:

- Restricted to Super Admin only.
- Requires explicit permission and strong authentication.
- Optional step-up authentication should be supported before impersonation.

Session rules:

- Impersonation sessions must expire automatically.
- Impersonation must be clearly indicated in the UI at all times.
- Admins must be able to exit impersonation immediately.
- Sensitive actions such as payment changes, credential access, API key secret viewing, and password changes should be blocked or require explicit elevated approval while impersonating.

Audit requirements:

- Log impersonation start and end.
- Log actor admin, target user, role, IP address, browser, device, timestamp, reason, and correlation ID.
- Log all actions performed during impersonation with both actor and impersonated user context.

### 16.19 Maintenance Mode

The platform will support system-wide maintenance mode for planned maintenance and emergency operations.

Modes:

- Full maintenance mode: non-whitelisted users receive a maintenance response/page.
- Read-only mode: safe reads are allowed, writes and external courier searches are blocked or queued.

Whitelist:

- Super Admin whitelist.
- Specific IP whitelist.
- Optional internal health check whitelist.

User experience:

- Frontend displays a maintenance banner.
- API returns structured maintenance responses with retry guidance.
- In-progress searches and jobs are handled gracefully according to mode.
- Admin dashboard shows current mode, reason, start time, expected end time, and operator.

Operational rules:

- Maintenance mode changes are audit logged.
- Background workers can be paused or limited during maintenance.
- Payment/webhook handling should be carefully controlled to avoid data loss.

### 16.20 Project Location Boundary

All implementation files must live under a single D-drive project root:

- `D:\Courier-Fraud-Check-BD\`

Planned root layout:

- `frontend\`
- `backend\`
- `shared\`
- `docs\`
- `database\`
- `scripts\`
- `nginx\`
- `uploads\`
- `backups\`
- `logs\`
- `.env.example`
- `ecosystem.config.js`
- `README.md`

No project implementation files should be created outside this directory.

### 16.21 Final Architecture Validation

Self-review result:

- Scalability: API, worker, cache, and frontend tiers can scale horizontally. Queue priority, Redis locking, deduplication, and search cost controls reduce duplicate upstream load.
- Security: Merchant credentials are encrypted, secrets are managed through environment files in development and Secret Manager or encrypted storage in production, API keys are hashed, sensitive actions are audited, and security headers/token controls are planned.
- Maintainability: Modular clean architecture, provider adapters, repositories, queues, idempotent workflows, and transport-agnostic domain logic support independent testing and change.
- Performance: Cached searches target under 300ms, fresh searches target under 8 seconds, and provider timeouts/circuit breakers protect latency.
- Fault tolerance: Circuit breakers, partial-result handling, retries, idempotency, graceful degradation, maintenance mode, and health monitoring prevent one failing provider from failing the whole search.
- Future extensibility: Multi-tenant readiness, feature flags, API keys, webhooks, file storage abstraction, i18n, and provider adapters support mobile, public API, GraphQL, partner, reseller, white-label, marketplace, and AI risk expansion.
- Architecture lock: The architecture is approved and locked for implementation. It should not be redesigned unless explicitly requested by the user.

Remaining risks and assumptions:

- Courier provider endpoints, behavior, and access rules may change without notice.
- Live provider behavior must be verified using the user's own merchant credentials.
- Payment gateway implementation depends on final merchant account access and provider documentation.
- 99.9% uptime depends on production infrastructure, monitoring, backup discipline, and operational response.
- Exact concurrent user capacity must be validated through load testing after implementation.
- Legal/license review should confirm that behavioral analysis has not introduced GPL source or derivative implementation into the final SaaS.

## 17. Approval Gate

Milestone 0 is documentation-only. No implementation code should be generated until this architecture is approved.
