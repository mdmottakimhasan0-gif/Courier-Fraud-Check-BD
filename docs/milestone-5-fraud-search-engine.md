# Milestone 5 - Fraud Search Engine

Status: Complete with final enhancements
Completed: 2026-08-03
Final enhancement update: 2026-08-04

## Scope

Milestone 5 creates the internal fraud search engine architecture only. It does not implement authentication, payment, subscription, admin panel, frontend UI, Redis integration, BullMQ jobs, search history persistence, or user-facing API endpoints.

## Search Flow

1. Receive an internal `FraudSearchRequest` with `correlationId`, `tenantId`, and phone number.
2. Validate and normalize the Bangladeshi phone number.
3. Capture search `startedAt` timestamp.
4. Resolve all registered courier providers through `ProviderFactory`.
5. Resolve configurable provider weights.
6. Execute provider checks in parallel using `Promise.allSettled`.
7. Propagate correlation ID to every provider request.
8. Convert provider success/failure into `ProviderSearchOutcome` records.
9. Attach provider latency and data freshness metadata.
10. Aggregate only available provider results.
11. Calculate confidence score.
12. Calculate risk score, risk badge, and human-readable risk explanation.
13. Resolve lifecycle status.
14. Capture `finishedAt` and total duration.
15. Return an internal `FraudSearchResult`.

## Parallel Search Strategy

Provider execution is parallel and isolated:

- Steadfast, Pathao, and RedX are invoked through the unified `CourierProvider` interface.
- `Promise.allSettled` prevents one provider rejection from cancelling the entire search.
- Each provider outcome is preserved independently.
- Each provider result includes latency metadata.
- The search engine depends on provider contracts and factory only, not provider internals.

## Aggregation Logic

Aggregation uses normalized provider responses only.

Included provider results:

- Provider outcome must be fulfilled.
- Provider result status must be `available`.

Calculated totals:

- Total Deliveries = Successful Deliveries + Cancelled Deliveries
- Successful Deliveries = sum of available provider successful deliveries
- Cancelled Deliveries = sum of available provider cancelled deliveries
- Success Rate = Successful Deliveries / Total Deliveries * 100
- Cancel Rate = Cancelled Deliveries / Total Deliveries * 100

Rates are rounded to two decimal places.

## Confidence Score Calculation

Confidence score measures how much weighted provider coverage is available for a search.

Formula:

```text
weightedCoverage = availableProviderWeight / totalProviderWeight * 100
confidenceScore = round(weightedCoverage)
```

Confidence metadata includes:

- Available provider count.
- Total provider count.
- Weighted coverage.
- Confidence score.

The default provider weight strategy assigns equal weight to Steadfast, Pathao, and RedX. The strategy is configurable so future deployments can assign higher weight to providers with stronger data quality or reliability.

## Provider Weight Strategy

Provider weighting is implemented through `ProviderWeightStrategy`.

Default strategy:

- Steadfast: 1
- Pathao: 1
- RedX: 1

Future strategy options:

- Admin-configurable provider weight.
- Tenant-specific provider weight.
- Provider reliability based weight.
- Data-volume based weight.

No admin UI or persistence is implemented in Milestone 5.

## Risk Score Formula

Risk score is calculated from aggregate cancel rate, unavailable provider count, delivery volume confidence, and low-confidence penalty.

Formula:

```text
riskScore = min(100, round(cancelRate * 0.85 + providerPenalty + volumeConfidence + lowConfidencePenalty))
```

Provider penalty:

- 5 points per unavailable/rejected provider.
- Maximum provider penalty: 15.

Volume confidence:

- 0 points for fewer than 10 deliveries.
- 2 points for 10-49 deliveries.
- 5 points for 50 or more deliveries.

Low-confidence penalty:

- 5 points when confidence score is below 70.
- 0 points when confidence score is 70 or higher.

No delivery data:

- Score: 0
- Badge: `unknown`
- Explanation states that risk cannot be confidently estimated.

## Risk Badge Calculation

Risk badges:

- `critical`: score >= 80
- `high`: score >= 60
- `medium`: score >= 30
- `low`: score < 30
- `unknown`: no delivery data

## Human-Readable Risk Explanation

Each risk result includes an explanation string summarizing:

- Risk badge.
- Numeric score.
- Cancel rate.
- Total delivery volume.
- Available provider coverage.
- Provider issue count.

This explanation is generated internally and can later be translated or formatted for UI/API responses.

## Strategy Pattern for Future AI Risk Calculators

Risk calculation now uses the `RiskCalculatorStrategy` contract.

Current implementation:

- `RiskScoreCalculator`: deterministic rules-based calculator.

Future implementation options:

- AI risk calculator.
- Hybrid rules plus AI calculator.
- Tenant-specific calculator.
- A/B tested calculator behind feature flags.

Milestone 5 does not implement AI logic.

## Data Freshness Metadata

Search results include data freshness metadata:

- `checkedAt`: timestamp of the newest available provider result.
- `ageSeconds`: age of the selected freshness timestamp.
- `source`: `live`, `cached`, or `unavailable`.

Provider outcomes also include per-provider freshness metadata.

Current behavior:

- Available provider results are marked `live`.
- Unavailable provider results are marked `unavailable`.
- Cached freshness source is reserved for the future caching milestone.

## Search Timing Metrics

Search results include:

- `startedAt`
- `finishedAt`
- `durationMs`
- `providerLatency`

Provider latency records:

- Provider ID.
- Duration in milliseconds.

These metrics support future monitoring, debugging, and SLA reporting without introducing a monitoring system in this milestone.

## Standard Internal Error Codes

Rejected provider outcomes include standard internal error codes:

- `INVALID_PHONE_NUMBER`
- `PROVIDER_TIMEOUT`
- `PROVIDER_AUTH_FAILED`
- `PROVIDER_RATE_LIMITED`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_UNEXPECTED_ERROR`
- `NO_PROVIDER_DATA`

Milestone 5 uses these codes internally only. No public API endpoint is introduced.

## Correlation ID Propagation

The search engine receives a `correlationId` in `FraudSearchRequest`.

Propagation rules:

- The correlation ID is passed to each provider request.
- The final `FraudSearchResult` includes the same correlation ID.
- Future logging, persistence, and monitoring can use the same ID without changing the search engine contract.

## Error Handling

Provider failures are handled gracefully:

- Provider rejections become `rejected` outcomes.
- Rejected outcomes include standard internal error code and message.
- Unavailable provider responses remain fulfilled provider outcomes with unavailable status.
- Failed providers are excluded from delivery totals.
- Failed providers influence confidence score and risk score.
- One provider failure never fails the whole search if another provider returns usable data.

## Failure Recovery Strategy

Milestone 5 recovery is internal and contract-level:

- Provider isolation is inherited from Milestone 4.
- Provider circuit breakers can return unavailable provider results.
- Rejected provider promises are captured by `Promise.allSettled`.
- Partial searches still return aggregate data from available providers.

Redis caching, BullMQ retries, and search persistence are intentionally deferred to later approved milestones.

## Search Lifecycle

Defined statuses:

- `queued`
- `searching`
- `partial`
- `completed`
- `failed`
- `cached`

Implemented status resolution:

- `cached`: reserved for later cache milestone.
- `completed`: all provider outcomes are available.
- `partial`: at least one provider is available and at least one provider failed, was rejected, or is unavailable.
- `failed`: no provider returned available data.

`queued` and `searching` are lifecycle states reserved for future queue/API orchestration. Milestone 5 does not implement BullMQ or public API endpoints.

## Created Files

Core module:

- `backend/src/modules/fraud-search/fraud-search.module.ts`
- `backend/src/modules/fraud-search/fraud-search-engine.service.ts`

Contracts and DTOs:

- `backend/src/modules/fraud-search/contracts/fraud-search.types.ts`
- `backend/src/modules/fraud-search/dto/fraud-search-request.dto.ts`

Validation:

- `backend/src/modules/fraud-search/validation/bd-phone-number.validator.ts`

Aggregation, confidence, risk, and metadata:

- `backend/src/modules/fraud-search/aggregation/fraud-result.aggregator.ts`
- `backend/src/modules/fraud-search/confidence/confidence-score.calculator.ts`
- `backend/src/modules/fraud-search/risk/risk-calculator.strategy.ts`
- `backend/src/modules/fraud-search/risk/risk-score.calculator.ts`
- `backend/src/modules/fraud-search/freshness/data-freshness.resolver.ts`
- `backend/src/modules/fraud-search/timing/search-timing.factory.ts`
- `backend/src/modules/fraud-search/weights/provider-weight.strategy.ts`
- `backend/src/modules/fraud-search/errors/search-error-code.normalizer.ts`

Lifecycle:

- `backend/src/modules/fraud-search/lifecycle/search-lifecycle.ts`

Test structure:

- `backend/tests/fraud-search/README.md`

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

- Scalability: Provider execution is parallel and provider-isolated.
- Security: No credentials, authentication, or external secrets were introduced.
- Maintainability: Validation, aggregation, confidence, risk scoring, lifecycle, metadata, and orchestration are separated.
- Performance: Search provider calls are parallel, aggregation is lightweight, and timing metrics are captured.
- Fault tolerance: Partial provider failures are handled without failing the entire search.
- Future extensibility: Risk calculation uses a strategy interface ready for a future AI risk calculator.
- Scope control: No Redis, BullMQ, persistence, API endpoint, auth, billing, admin, or frontend work was implemented.

## Approval Gate

Milestone 5 is complete with final enhancements. Milestone 6 must not begin until user approval is provided.