# Milestone 8: Backend API Layer

## API Architecture

Milestone 8 adds the backend HTTP API layer on top of the approved architecture from Milestones 1-7.

Implemented API concerns:

- Versioned routes under `/api/v1`
- Thin controllers
- DTO validation
- Standard success response envelope
- Global exception filter for errors
- Correlation ID middleware
- Request logging with duration and authenticated user ID
- JWT, refresh token, RBAC, PBAC, and future-ready API key guards
- Endpoint-level in-memory rate limiting architecture
- Swagger/OpenAPI documentation
- Security bootstrap with Helmet, CORS, and request body limits

No frontend, admin dashboard, payment gateway, subscription workflow, notification provider, deployment automation, or courier business logic changes were added.

## Authentication APIs

Authentication routes are exposed under `/api/v1/auth`.

Implemented endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/refresh`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- `GET /auth/profile`
- `PATCH /auth/profile`
- `GET /auth/sessions/current`
- `GET /auth/sessions`
- `DELETE /auth/sessions`

The API layer uses the existing authentication services for login, logout, password hashing, password history, verification tokens, reset tokens, refresh-token rotation, and session persistence. Registration and profile updates are API orchestration logic backed by Prisma.

Email and notification providers are not implemented in this milestone. In non-production environments only, verification/reset token values may be returned to support local API testing.

## Fraud Search APIs

Fraud search routes are exposed under `/api/v1/fraud-search`.

Implemented endpoints:

- `POST /fraud-search`
- `GET /fraud-search/:searchId/status`
- `GET /fraud-search/:searchId/result`
- `GET /fraud-search`
- `GET /fraud-search/:searchId`

The search endpoint calls the existing Fraud Search Engine and Provider Adapter architecture. Courier provider business logic was not modified. Search summaries and provider result records are stored using the existing Prisma search models.

Because provider credential integration is intentionally not part of this milestone, provider adapters may return graceful failed outcomes until the approved courier integration milestone.

## Authorization Flow

Implemented guards:

- `JwtAuthGuard`: validates bearer access tokens, loads the user, checks active status, and enforces permission-version invalidation.
- `RefreshTokenGuard`: validates the refresh-token request contract before rotation.
- `RoleGuard`: checks role metadata from `RequireRoles`.
- `PermissionGuard`: checks permission metadata from `RequirePermissions`.
- `ApiKeyGuard`: future-ready `x-api-key` authentication with hashed key validation and last-used tracking.

JWT-authenticated requests attach the current user and session ID to the request context.

## Validation Strategy

All API endpoint inputs use DTO classes with `class-validator` rules and Swagger metadata.

Global validation settings:

- Whitelist DTO properties
- Reject non-whitelisted fields
- Transform inbound payloads and query parameters

## API Response Standard

All successful controller responses are wrapped by `ApiResponseInterceptor`.

Response envelope:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {},
  "meta": null,
  "correlationId": "request-correlation-id",
  "timestamp": "2026-08-04T00:00:00.000Z"
}
```

## Error Handling

Errors continue to use the global exception format created earlier.

Error responses include:

- Status code
- Error code
- Message
- Path
- Correlation ID
- Timestamp

Controllers and API orchestration services throw Nest HTTP exceptions for expected API failures.

## Swagger Coverage

Swagger is available at `/api/docs`.

Coverage includes:

- Authentication tag
- Fraud Search tag
- Health tag
- DTO schemas
- Bearer authentication
- Future-ready API key authentication
- Validation and authentication error responses
- Endpoint summaries and response descriptions

## Health APIs

Health routes are exposed under `/api/v1/health`.

Implemented endpoints:

- `GET /health`
- `GET /health/application`
- `GET /health/database`
- `GET /health/redis`
- `GET /health/queues`

The aggregate endpoint includes application status, Redis health, queue health, and cache metrics. Database health uses a lightweight `SELECT 1` check.

## Logging Strategy

Every request is logged with:

- HTTP method
- Request path
- Response status code
- Request duration
- Correlation ID
- Authenticated user ID when available

Correlation IDs are accepted from `x-correlation-id` or generated per request.

## Security Configuration

Security enabled in bootstrap:

- Helmet secure headers
- CORS with environment-configured origins
- Request body size limits
- Global validation pipe
- JWT authentication guard
- Endpoint-level rate limiting metadata
- Permission-version invalidation for JWTs

Environment additions:

- `REQUEST_BODY_LIMIT`

Existing CORS settings:

- `CORS_ORIGINS`

## Verification

Milestone 8 verification commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

All final checks must pass before Milestone 8 is considered complete.
