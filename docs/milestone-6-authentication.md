# Milestone 6 - Authentication

Status: Complete with final enhancements
Completed: 2026-08-04
Final enhancement update: 2026-08-04

## Scope

Milestone 6 implements production-grade backend authentication architecture and internal services only. It does not implement Redis, BullMQ, search history, payments, subscriptions, admin panel, frontend features, public API controllers, UI, or external providers.

## Implemented Architecture

Authentication module:

- `backend/src/modules/auth/auth.module.ts`

Core services:

- `AuthenticationService`
- `Argon2idPasswordHasher`
- `JwtTokenService`
- `RefreshTokenRotationService`
- `SessionManagementService`
- `LoginRateLimiterService`
- `PasswordHistoryPolicy`
- `PasswordChangeService`
- `EmailVerificationService`
- `PasswordResetService`
- `EmailChangeService`
- `MfaService`
- `SuspiciousLoginDetector`
- `AccessControlService`
- `PermissionVersionStrategy`
- `SecureCookieFactory`

Future-ready contracts:

- API key authentication contract.
- Google OAuth verifier contract.
- MFA repository and TOTP verifier contracts.
- Email change repository contract.
- Repository interfaces for users, sessions, password history, verification tokens, reset tokens, and API keys.
- Audit logger interface.

## Account Status Lifecycle

The authentication architecture recognizes the following user account statuses:

- `pending`: account exists but is not fully activated.
- `active`: account can authenticate normally.
- `locked`: account is temporarily locked because of security policy.
- `suspended`: account is disabled by operational or billing policy.
- `banned`: account is permanently blocked by enforcement policy.
- `deleted`: account is soft-deleted and must not authenticate.

Only `active` users can complete login. Other statuses are rejected and audit logged.

## Password Security

Password hashing uses Argon2id through `argon2`.

Current parameters:

- Type: Argon2id
- Memory cost: 19456
- Time cost: 2
- Parallelism: 1

Password history architecture:

- Recent password hashes are read through `PasswordHistoryRepository`.
- Candidate passwords are checked against recent hashes.
- Reused recent passwords are rejected.
- New password hashes are recorded after successful change.

## JWT and Refresh Token Rotation

JWT access token architecture:

- Access tokens are signed through `JwtTokenService`.
- Payload includes user ID, tenant ID, session ID, roles, permissions, and permission version.
- Access token TTL is configurable.

Refresh token architecture:

- Refresh tokens are opaque random tokens.
- Only refresh token hashes are stored.
- Rotation replaces the stored refresh token hash.
- Refresh token reuse revokes the active session.

## Permission Version Strategy

Permission-version strategy supports JWT invalidation after permission changes.

Design:

- `AuthUserPrincipal` includes `permissionVersion`.
- JWT access tokens include the current permission version at signing time.
- `PermissionVersionStrategy` compares token version with current user version.
- If roles or permissions change, the stored user permission version should increment.
- Any token with an older permission version is considered stale and should require reauthentication.

No route guard is implemented in this milestone.

## Session Management

Session architecture supports:

- Device session creation.
- Device metadata tracking.
- Logout from current device.
- Logout from all devices.
- Refresh token hash replacement.
- Session revocation.

Device metadata:

- IP address.
- User agent.
- Browser.
- Device.

## Multi-Factor Authentication Future-Ready Architecture

MFA architecture supports future TOTP and recovery-code flows.

Added contracts/services:

- `MfaService`
- `MfaRepository`
- `TotpVerifier`
- `MfaEnrollment`
- `RecoveryCodeSet`

TOTP design:

- TOTP secret storage is represented as a hash/encrypted persistence concern behind `MfaRepository`.
- TOTP code verification is represented behind `TotpVerifier`.
- No external TOTP library, QR generation, UI, or setup endpoint is implemented in this milestone.

Recovery-code design:

- Recovery codes are generated as opaque random values.
- Recovery codes are hashable through `SecureTokenService`.
- Persistence and one-time consumption are represented by `MfaRepository`.

## Email Verification

Email verification architecture supports:

- Opaque verification token generation.
- Token hashing before persistence.
- Expiration-aware consumption.
- Repository abstraction for persistence.

No email delivery provider is implemented in Milestone 6.

## Secure Email Change Workflow

Secure email-change architecture supports:

- Requesting an email change with current email, new email, user ID, token hash, and expiry.
- Returning a one-time opaque token to the caller for future delivery workflow.
- Hashing the token before persistence.
- Confirming the email change by consuming a valid token.
- Completing the change through repository abstraction.

No email delivery provider, UI, or public endpoint is implemented.

## Forgot Password and Password Reset

Password reset architecture supports:

- Opaque reset token generation.
- Token hashing before persistence.
- Expiration-aware consumption.
- Password change through password history policy and Argon2id hashing.

No public reset endpoints and no email delivery provider are implemented in Milestone 6.

## Login Rate Limiting and Account Lockout

Login rate limiting architecture:

- In-memory limiter for internal architecture.
- Keyed by tenant, email, and IP address.
- Configurable rate-limit window.
- Configurable failed-attempt threshold.

Account lockout:

- Account lockout is triggered after repeated failures.
- Lockout duration is configurable.
- User repository interface includes `setAccountLockedUntil`.

Redis-backed distributed rate limiting is intentionally deferred.

## Suspicious Login Detection Architecture

Suspicious login detection is represented by `SuspiciousLoginDetector`.

Signals evaluated:

- New IP address.
- New user agent.
- Future-ready known-device comparison.

Output:

- Suspicious boolean.
- Risk level: `low`, `medium`, or `high`.
- Reason codes.

Future enhancements can add geo-velocity, impossible travel, ASN reputation, device fingerprinting, and adaptive MFA without changing the authentication module boundary.

## RBAC and PBAC

RBAC/PBAC architecture:

- `AccessControlService` validates roles and permissions.
- `RequireRoles` decorator defines required roles.
- `RequirePermissions` decorator defines required permissions.
- `PermissionVersionStrategy` supports token invalidation after permission changes.

No public route guards/controllers are implemented in Milestone 6.

## Audit Logging

Audit logging architecture includes:

- `AuthAuditLogger` interface.
- `NullAuthAuditLogger` placeholder implementation.
- Audit events for login success/failure, lockout, refresh rotation, logout, email verification, password reset, MFA, email change, and suspicious login detection.

Persistence-backed audit logging is deferred to a later approved milestone.

## API Key Authentication Future-Ready Architecture

API key authentication is represented by:

- `ApiKeyAuthenticator`
- `ApiKeyRepository`
- `ApiKeyPrincipal`

API key storage rules:

- Store hashes only.
- Track public prefix separately.
- Record last-used timestamp.

No API key public endpoints are implemented.

## Google OAuth Future-Ready Architecture

Google OAuth architecture is represented by:

- `GoogleOAuthVerifier`
- `GoogleOAuthProfile`

No OAuth callback routes and no Google network calls are implemented.

## Secure Cookie Support

`SecureCookieFactory` creates secure refresh-token cookie options:

- `HttpOnly`
- `Secure` in production
- Configurable `SameSite`
- Optional cookie domain
- Scoped path

## Token Revocation

Token revocation architecture:

- Current-device logout revokes one session.
- All-device logout revokes all sessions for a user.
- Refresh token reuse detection revokes the active session.
- Permission version changes invalidate stale JWT access tokens.

## Persistence Boundary

Milestone 6 defines persistence interfaces and unimplemented fail-closed adapters:

- `UnimplementedAuthUserRepository`
- `UnimplementedAuthSessionRepository`
- `UnimplementedPasswordHistoryRepository`
- `UnimplementedVerificationTokenRepository`
- `UnimplementedApiKeyRepository`
- `UnimplementedMfaRepository`
- `UnimplementedEmailChangeRepository`

These placeholders prevent accidental insecure in-memory production persistence. Real database-backed adapters must be added only in an approved persistence/API milestone.

## Environment Configuration

Added `.env.example` entries:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TOKEN_TTL_SECONDS`
- `JWT_REFRESH_TOKEN_TTL_SECONDS`
- `AUTH_LOGIN_RATE_WINDOW_SECONDS`
- `AUTH_MAX_FAILED_LOGIN_ATTEMPTS`
- `AUTH_ACCOUNT_LOCKOUT_MINUTES`
- `AUTH_PASSWORD_HISTORY_LIMIT`
- `AUTH_COOKIE_SAME_SITE`

Production secrets must be at least 32 characters.

## Verification

The following commands completed successfully:

```bash
npm run lint
npm run typecheck
npm run build
```

## Self-Review

- Security: Passwords use Argon2id, refresh tokens are opaque and hash-stored, permission versioning supports JWT invalidation, and repository placeholders fail closed.
- Maintainability: Auth concerns are separated into tokens, sessions, passwords, rate limiting, access control, audit, email verification, email change, password reset, MFA, suspicious login, API keys, OAuth, and cookies.
- Scalability: Repository interfaces allow future database and distributed rate-limit adapters without changing service contracts.
- Future extensibility: MFA, Google OAuth, API keys, suspicious login signals, and permission-version invalidation are architected without public endpoints or external providers.
- Scope control: No Redis, BullMQ, search history, payments, subscriptions, admin panel, frontend, UI, public API controllers, or external providers were implemented.

## Approval Gate

Milestone 6 is complete with final enhancements. Milestone 7 must not begin until user approval is provided.