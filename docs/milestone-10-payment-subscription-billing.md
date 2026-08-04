# Milestone 10: Payment, Subscription & Billing System

## Completed Before Interruption

- Extended Prisma schema for subscription lifecycle values, invoice lifecycle values, configurable plan limits, coupon per-user limit, and promo campaign fields.
- Added migration: `20260804130000_payment_subscription_billing`.
- Added payment gateway environment placeholders to `.env.example`.
- Validated Prisma schema and regenerated Prisma client.
- Created empty billing module folder structure.

## Newly Completed After Resume

- Implemented `BillingModule`.
- Implemented payment gateway architecture:
  - Payment provider interface
  - Static bKash, Nagad, SSLCommerz-compatible provider factory
  - Payment status normalization through provider responses
  - Webhook signature verification contract
- Implemented subscription plan APIs and default plan seeding:
  - Free
  - Starter
  - Professional
  - Enterprise
- Implemented subscription lifecycle APIs:
  - Subscribe
  - Upgrade
  - Downgrade
  - Renew
  - Cancel
  - Resume
  - Active subscription lookup
- Implemented usage tracking:
  - Daily searches
  - Monthly searches
  - API key count
  - Search history usage
  - Login count
  - Active sessions
  - Reset scheduler architecture documented for future workers
- Implemented subscription enforcement before fraud search execution:
  - Active subscription required
  - Daily limit validation
  - Monthly limit validation
  - API request limit validation
- Implemented payment APIs:
  - Create payment
  - Verify payment
  - Payment status
  - Cancel payment
  - Retry payment
- Implemented webhook architecture endpoint with signature-verification and replay-key contract.
- Implemented invoice architecture:
  - Invoice number generator
  - Invoice generation API
  - Invoice listing API
  - PDF rendering explicitly deferred
- Implemented coupon system:
  - Create coupon
  - Update coupon
  - Disable coupon
  - Validate coupon
  - Expiry and usage-limit validation
  - Percentage/fixed discount support from schema
- Implemented promo campaign creation with coupon attachment field and schedule fields.
- Implemented transaction history APIs and billing history/summary APIs.
- Implemented admin billing APIs:
  - Plan CRUD
  - Coupon CRUD
  - Payment/transaction monitoring
  - Invoice monitoring
  - Billing analytics/dashboard
- Implemented analytics APIs:
  - Revenue summary
  - Monthly revenue grouping architecture
  - Active subscribers
  - Subscription distribution
  - Churn summary
  - Payment success/gateway statistics
  - Coupon usage

## Plan Architecture

Plans are database-configurable through the `Plan` model. Supported limits:

- Daily search limit
- Monthly search limit
- API request limit
- Maximum API keys
- Maximum team members
- Maximum merchant accounts
- Maximum saved searches
- Search history retention
- Priority queue
- Premium support
- Feature flag access

Default plans are seeded through an admin endpoint, not hardcoded into application startup.

## Subscription Lifecycle

Supported lifecycle statuses:

- Trial
- Active
- Expired
- Suspended
- Cancelled
- Grace Period

The service calculates active eligibility from subscription status and period end date. Expiry handling and reset scheduling are structured for a future BullMQ scheduled worker.

## Usage Tracking

`UsageCounterService` reads existing operational tables for counters. `SubscriptionLimitService` enforces limits before fraud search execution.

## Payment Provider Architecture

The provider interface supports:

- Create payment
- Verify payment
- Cancel payment
- Webhook signature verification

Providers are static architecture adapters only. No live transaction is performed and no gateway credentials are used.

## Webhook Architecture

The webhook endpoint accepts provider, event ID, signature, and payload. It returns a replay-protection key and correlation ID when verification succeeds. Real gateway callback validation is deferred until live gateway integration.

## Invoice Architecture

Invoices are generated from subscriptions with deterministic tenant/date invoice number structure plus random suffix. PDF rendering is intentionally not implemented.

## Coupon System

Coupons support:

- Expiry
- Max redemption count
- Per-user redemption limit field
- Percentage discounts
- Fixed discounts
- Enable/disable state

## Promo Campaigns

Promo campaigns use `PromoCode` with payload, schedule fields, status, and optional coupon attachment.

## Billing APIs

Billing APIs are available under `/api/v1/billing` and admin billing APIs under `/api/v1/admin/billing`.

## Transaction APIs

Transactions are represented by the `Payment` model. APIs support listing, status lookup, retry, cancel, and verification architecture.

## Analytics APIs

Analytics are computed from existing Prisma models and exposed through admin billing routes.

## Security Strategy

- Idempotency keys are enforced by payment and subscription unique constraints.
- Duplicate payment protection uses tenant/idempotency key lookup.
- Webhook verification contract is present.
- Payment references are generated by provider adapters and stored separately from internal IDs.
- Admin mutations use audit logging.
- Real gateway credentials are not included.

## Remaining Items

No Milestone 10 scope items remain intentionally unimplemented, except explicitly excluded live payment processing, real gateway callbacks, PDF rendering, notification providers, frontend/admin UI, deployment, courier business logic changes, and AI features.

## Verification Results

Pre-documentation checks after resume:

- Backend typecheck passed.
- Lint passed.
- Backend build passed.

Final required root verification is run after this document update.

## Scope Verification

Milestone 10 remained backend-only. No frontend, React components, admin dashboard UI, landing page, email/SMS/push providers, real payment processing, courier logic changes, deployment automation, or AI features were implemented.
