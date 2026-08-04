# Milestone 7: Persistence Layer + Redis + BullMQ Infrastructure

## Scope

Milestone 7 implements production infrastructure foundations only. It does not add public API controllers, frontend screens, payments, subscriptions, courier business logic, authentication endpoints, or search history UI.

## Repository Architecture

The authentication repository interfaces from Milestone 6 remain unchanged. Prisma implementations now sit behind those interfaces so application services depend on contracts, not database details.

Implemented repositories:

- Users
- Sessions
- Password history
- Email verification tokens
- Password reset tokens
- API keys
- MFA factors
- Recovery codes
- Email change requests
- Suspicious login events

Repositories contain storage mapping and persistence operations only. Authentication decisions, password policy, token policy, MFA flow, and suspicious-login evaluation remain outside repository classes.

## Prisma Adapter Mapping

Prisma infrastructure is provided through `PrismaModule` and `PrismaService`.

Adapter mapping:

- `AUTH_USER_REPOSITORY` -> `PrismaAuthUserRepository`
- `AUTH_SESSION_REPOSITORY` -> `PrismaAuthSessionRepository`
- `PASSWORD_HISTORY_REPOSITORY` -> `PrismaPasswordHistoryRepository`
- `EMAIL_VERIFICATION_REPOSITORY` -> `PrismaEmailVerificationTokenRepository`
- `PASSWORD_RESET_REPOSITORY` -> `PrismaPasswordResetTokenRepository`
- `API_KEY_REPOSITORY` -> `PrismaApiKeyRepository`
- `MFA_REPOSITORY` -> `PrismaMfaRepository`
- `EMAIL_CHANGE_REPOSITORY` -> `PrismaEmailChangeRepository`
- `SUSPICIOUS_LOGIN_REPOSITORY` -> `PrismaSuspiciousLoginEventRepository`

Schema additions:

- Account lifecycle expanded to `PENDING`, `ACTIVE`, `LOCKED`, `SUSPENDED`, `BANNED`, `DELETED`
- `permissionVersion`, `failedLoginCount`, and `lockedUntil` added to users
- `auth_sessions`
- `password_history`
- `email_verification_tokens`
- `password_reset_tokens`
- `mfa_factors`
- `recovery_codes`
- `email_change_requests`
- `suspicious_login_events`
- Global API key public-prefix uniqueness

## Redis Architecture

Redis infrastructure is provided through `RedisInfrastructureModule`.

Components:

- `RedisConnectionManager`: central Redis client creation and lifecycle
- `CacheService`: JSON cache read/write/delete abstraction
- `CacheKeyBuilder`: normalized key construction with tenant-scoped helpers
- `CacheInvalidationService`: explicit key and pattern-based invalidation
- `CacheMetricsService`: in-process cache hit, miss, write, and delete counters
- `DistributedLockService`: Redis-backed lock acquire/release with token-safe release
- `RedisHealthIndicator`: ping-based Redis health and latency snapshot

Redis settings are environment-driven:

- `REDIS_URL`
- `REDIS_KEY_PREFIX`

## BullMQ Architecture

BullMQ infrastructure is provided through `QueueInfrastructureModule`.

Components:

- `QueueManagerService`: lazy queue creation and idempotency-key-aware enqueueing
- `WorkerManagerService`: worker registration and shutdown lifecycle
- `QueueRetryPolicy`: centralized attempts/backoff defaults
- `DeadLetterQueueService`: failed job capture into the `dead-letter` queue
- `QueueHealthService`: waiting, failed, delayed, and latency snapshots

Core queue names:

- `search`
- `notifications`
- `emails`
- `scheduled`
- `dead-letter`

Queue settings are environment-driven:

- `QUEUE_DEFAULT_ATTEMPTS`
- `QUEUE_RETRY_BACKOFF_MS`

## Cache Strategy

Fraud search infrastructure now includes cache services without changing the search engine execution flow.

Implemented pieces:

- `SearchCacheService`
- `ProviderResponseCacheService`
- `SearchCacheKeyFactory`
- `SearchCacheTtlPolicy`
- `SearchCacheVersionStrategy`
- `DuplicateSearchPreventionService`

Default TTL policy:

- Search result cache: 10 minutes
- Provider response cache: 15 minutes
- Duplicate-search lock: 30 seconds

Cache keys are tenant-scoped and versioned. Future formula or normalization changes can invalidate old cache families by bumping `SearchCacheVersionStrategy`.

## Distributed Locking

Duplicate-search prevention uses Redis `SET NX PX` with a random token. Release uses a Lua script that deletes the key only when the stored token matches the lock owner.

This prevents one process from releasing another process lock after timeout/retry overlap.

## Queue Strategy

Milestone 7 prepares queue infrastructure only. No business workers are registered yet.

Planned usage:

- Search tasks: asynchronous fraud search execution
- Notifications: customer and admin notifications
- Emails: verification, reset, billing, and lifecycle emails
- Scheduled jobs: cleanup, cache refresh, billing checks, reporting
- Dead-letter queue: exhausted jobs requiring inspection or replay

## Retry Policy

Default retry behavior:

- Attempts: environment-configured, default 3
- Backoff: exponential
- Backoff delay: environment-configured, default 5000ms
- Successful job retention: bounded
- Failed job retention: retained for inspection

Business workers can override job options while still using the shared defaults.

## Dead-Letter Queue Strategy

When a worker observes a job failure after all attempts are exhausted, the failed job is copied to `dead-letter`.

DLQ payload includes:

- Original queue
- Original job name
- Original job ID
- Attempts made
- Failure reason
- Original payload

This supports manual inspection and future replay tooling without coupling workers to admin features.

## Infrastructure Monitoring

The existing health endpoint now includes infrastructure health snapshots:

- Redis status and latency
- Queue waiting, failed, delayed, and latency metrics
- Cache hit, miss, write, and delete counters

The health response can degrade without crashing the application, supporting graceful degradation when Redis or queues are temporarily unavailable.

## Authentication Persistence Support

Milestone 7 persistence supports the Milestone 6 authentication architecture:

- Argon2id password hash storage
- Password history enforcement
- Email verification tokens
- Password reset tokens
- Secure email change requests
- Session management
- Refresh token rotation
- Device session tracking
- Token revocation through session revocation
- Account status lifecycle
- Account lockout fields
- Permission-version-based JWT invalidation
- API key authentication persistence
- MFA TOTP secret hash persistence
- Recovery code hash persistence and one-time consumption
- Suspicious login event recording

Merchant credentials are not affected by this milestone. No GPL source code or implementation from the uploaded courier package was copied or translated.

## Validation

Completed validation:

- Prisma schema validation passed
- Prisma client generation passed
- Backend lint passed
- Backend typecheck passed
- Backend build passed

Final root-level validation is run after documentation generation as part of the Milestone 7 completion checklist.
