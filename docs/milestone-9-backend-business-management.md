# Milestone 9: Backend Business Management

## Admin API Architecture

Milestone 9 adds backend-only business management APIs under `/api/v1/admin`.

Implemented layers:

- `BusinessManagementModule`
- Admin controller routes
- Admin-only guard
- DTO validation
- Business orchestration service
- Central admin audit service
- Merchant credential encryption service

No frontend, admin UI, payment gateway, subscription billing, notification provider, deployment work, courier business logic change, or AI feature was implemented.

## User Management

Implemented APIs:

- List users
- User details
- Create user
- Update user
- Soft delete user
- Restore user
- Lock user
- Unlock user
- Suspend user
- Activate user
- Ban user
- Change user role
- Admin reset user password
- Force logout user

User responses never expose password hashes. Account status uses the approved lifecycle from Milestone 6.

## RBAC/PBAC Flow

Admin endpoints use:

- `JwtAuthGuard`
- `AdminGuard`
- `PermissionGuard`
- Existing `RequirePermissions` metadata

The admin guard accepts users with `super-admin`, `admin`, or `admin:manage`. Endpoint-level permissions then provide finer PBAC boundaries such as `users:read`, `users:write`, `roles:write`, `api-keys:manage`, and `settings:manage`.

## Merchant Credential Security

Courier merchant credential APIs support Steadfast, Pathao, and RedX through the existing provider enum.

Implemented:

- Create credentials
- Update credentials
- Delete credentials
- Enable provider account
- Disable provider account
- Health status endpoint
- Test connection request endpoint

Security rules:

- Credentials are encrypted with AES-256-GCM before storage.
- API responses never expose raw secrets.
- Returned credential fields are masked.
- Credential version increments when secret material changes.

Live courier handshakes are intentionally deferred to the courier integration milestone so provider business logic remains unchanged.

## API Key Management

Implemented:

- Create API key
- Rotate API key
- Revoke API key
- List API keys
- API key usage summary

Storage behavior:

- Full key is shown only once on creation or rotation.
- Database stores only hashed key material.
- API responses expose public prefix only.
- Last-used tracking remains supported by the Milestone 8 API key guard.

## Search Log APIs

Implemented:

- List searches
- Search details
- Search statistics

Filters:

- User
- Phone
- Date range
- Provider
- Status
- Risk badge

Search log APIs use existing `SearchHistory` and `FraudResult` models.

## Dashboard APIs

Implemented dashboard statistics endpoint includes:

- Total users
- Active users
- Today's searches
- Monthly searches
- Provider success rate
- Risk distribution
- Queue statistics
- Redis health
- Cache statistics
- API usage
- Top active users

No frontend dashboard was implemented.

## Settings APIs

Implemented category-based settings APIs:

- General settings
- Security settings
- Search settings
- Cache settings
- Queue settings
- Feature flags
- Maintenance mode

Settings are persisted in `SystemSetting` using namespaced keys such as `security.settings` and `maintenance.settings`.

## Audit Log Architecture

All admin mutations call `AdminAuditService`.

Audit records include:

- Actor ID
- Actor role
- Tenant ID
- Action
- Resource type
- Resource ID
- Correlation ID
- Previous/new values where relevant

Implemented:

- Audit log list
- Audit detail
- Filter-ready pagination structure
- Export architecture remains future-ready and out of scope for this milestone.

## Feature Flag Architecture

Implemented:

- Create feature flag
- Update feature flag
- Enable feature flag
- Disable feature flag
- List feature flags
- Future-ready rules payload for tenant targeting

Feature flags are tenant-scoped and can later support rule-based rollout without schema redesign.

## Announcement APIs

Implemented:

- Create announcement
- Update announcement
- Delete announcement
- Publish announcement
- Unpublish announcement
- List announcements

Announcements use soft delete and `DRAFT`/`PUBLISHED` content status.

## Verification

Required final verification:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

All issues must be fixed before Milestone 9 is approved.
