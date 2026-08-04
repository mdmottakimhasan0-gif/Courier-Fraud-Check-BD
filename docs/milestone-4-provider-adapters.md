# Milestone 4 - Courier Provider Adapter Layer

Status: Complete
Completed: 2026-08-03

## Scope

Milestone 4 creates the courier provider adapter architecture only. It does not implement the search aggregation engine, search history, Redis caching, BullMQ queues, authentication, payments, subscriptions, admin panel, frontend features, or business logic outside provider adapters.

All provider code is independently written. No GPL source code, class structure, comments, implementation details, or copied algorithms were used.

## Provider Architecture

Provider code lives under:

`backend/src/modules/courier-providers`

Main boundaries:

- `contracts`: provider interfaces, request/response contracts, HTTP contracts, credential contracts, health contracts, and config contracts.
- `dto`: validation DTOs for provider check inputs and health output shapes.
- `normalizers`: unified delivery metric and response normalization.
- `errors`: provider error normalization.
- `resilience`: retry executor, timeout helper, and circuit breaker.
- `health`: in-memory provider health reporter.
- `http`: HTTP client abstraction and fetch-based implementation.
- `security`: credential-management tokens and interfaces.
- `factory`: provider factory for resolving providers by ID.
- `providers`: isolated Steadfast, Pathao, and RedX provider adapters.

## Interface Design

Core interface:

- `CourierProvider`
  - `id`
  - `check(request)`

Unified request:

- `phoneNumber`
- `tenantId`
- `correlationId`

Unified provider result:

- `provider`
- `status`
- `metrics`
- `riskSignal`
- `responseTimeMs`
- `checkedAt`
- `unavailableReason`

Metrics:

- `totalOrders`
- `successfulDeliveries`
- `cancelledDeliveries`
- `successRate`
- `returnRate`

## DTOs

DTOs created:

- `ProviderCheckDto`
- `ProviderHealthDto`

`ProviderCheckDto` validates:

- Bangladeshi local phone format.
- Tenant UUID.
- Correlation ID.

## Error Handling

`DefaultProviderErrorNormalizer` converts unknown provider errors into a unified failure contract:

- `provider`
- `code`
- `message`
- `retryable`

Mapped error categories include:

- Auth failure.
- Timeout.
- Rate limit.
- Provider unavailable.
- Generic provider error.

Provider failures are returned as unavailable provider results so one provider failure never affects another provider.

## Retry Strategy

`ProviderRetryExecutor` provides:

- Configurable max attempts.
- Linear backoff based on attempt number.
- Rethrow of the final failure after retries are exhausted.

Provider retry policy is supplied by `ProviderConfigurationRegistry`.

Default design values:

- `maxAttempts`: 2
- `backoffMs`: 250

## Timeout Strategy

Timeout architecture includes:

- Provider timeout config.
- Request timeout helper.
- Fetch HTTP client abort support.

Default design values:

- `connectTimeoutMs`: 2000
- `requestTimeoutMs`: 8000

Live provider execution remains intentionally deferred until the approved integration implementation step.

## Circuit Breaker Design

`ProviderCircuitBreaker` supports:

- Closed state.
- Open state.
- Half-open state.
- Failure threshold.
- Cooldown period.
- Half-open probe limit.

Default design values:

- `failureThreshold`: 5
- `cooldownMs`: 60000
- `halfOpenProbeLimit`: 1
- `rollingWindowMs`: 300000

Circuit behavior:

- Closed allows requests.
- Open skips provider calls and returns unavailable result.
- Half-open allows limited probe requests.
- Success closes the circuit.
- Failure opens the circuit.

## Health Monitoring Design

`InMemoryProviderHealthReporter` records:

- Success count.
- Failure count.
- Recent response times.
- Last successful request timestamp.
- Last failure timestamp.
- Circuit breaker state.
- Average response time.
- Failure rate.
- Provider status.

Health statuses:

- Online.
- Degraded.
- Offline.
- Unknown.

This is an architecture-level implementation. Persistence and admin dashboard presentation are later milestones.

## Provider Isolation

Created isolated provider adapters:

- `SteadfastProviderAdapter`
- `PathaoProviderAdapter`
- `RedxProviderAdapter`

Each provider:

- Has its own adapter class.
- Exposes the unified `CourierProvider` contract.
- Uses shared abstractions for HTTP, config, retry, errors, circuit breaker, and health.
- Returns the unified response contract.
- Does not share execution state with other providers except through injected core resilience abstractions.

## Credential Management Interfaces

Credential architecture includes:

- `ProviderCredentialReader`
- `ProviderCredentialCipher`
- `EncryptedCredentialEnvelope`
- `ProviderCredentialMaterial`

Rules:

- Credentials are read as encrypted envelopes.
- Decryption is represented by an interface only.
- No merchant credentials are stored or hardcoded.
- No credential persistence logic is implemented in this milestone.

## HTTP Client Abstraction

HTTP architecture includes:

- `ProviderHttpClient`
- `ProviderHttpRequest`
- `ProviderHttpResponse`
- `FetchProviderHttpClient`

Provider adapters depend on the abstraction, not direct HTTP implementation details.

## Provider Factory

`ProviderFactory` resolves registered provider adapters by provider ID:

- `steadfast`
- `pathao`
- `redx`

The factory returns unified `CourierProvider` instances and can list all registered providers for later orchestration.

## Unit-Test Structure

Mocked unit-test structure was created at:

`backend/tests/provider-adapters`

Fixtures live at:

`backend/tests/provider-adapters/mock-responses`

Rules documented:

- Use mocked HTTP only.
- Do not call real courier systems.
- Do not require merchant credentials.
- Do not include GPL source code or copied implementation details.

## Verification

The following commands completed successfully:

```bash
npm run lint
npm run typecheck
npm run build
```

Verification results:

- Linting passed with zero warnings.
- TypeScript checks passed.
- Production build passed.

## Self-Review

- Scalability: Provider adapters are isolated and can be orchestrated independently in later milestones.
- Security: Credential handling is interface-based, with no plaintext merchant credential storage or hardcoded secrets.
- Maintainability: Contracts, DTOs, normalizers, resilience, health, HTTP, and provider implementations are separated.
- Performance: Timeout and retry policies are explicit and configurable.
- Fault tolerance: Circuit breaker architecture and unavailable-result handling ensure one provider failure does not fail another provider.
- License hygiene: No GPL code, GPL naming patterns, copied comments, copied class structure, or copied implementation details were introduced.
- Scope control: No search aggregation, persistence flow, Redis, BullMQ, auth, payment, subscription, admin, or frontend work was implemented.

## Approval Gate

Milestone 4 is complete. Milestone 5 must not begin until user approval is provided.
