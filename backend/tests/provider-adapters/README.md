# Provider Adapter Unit-Test Structure

Milestone 4 reserves the provider adapter test structure and mock-response fixture locations.

Future tests should cover:

- Provider factory resolution by provider ID.
- DTO validation for Bangladeshi phone numbers.
- Response normalization from provider-specific raw fixtures into the unified response contract.
- Error normalization for timeouts, unauthorized responses, rate limits, upstream errors, and malformed payloads.
- Retry behavior with mocked failures and eventual success.
- Circuit breaker transitions: closed, open, and half-open.
- Health reporter updates after success and failure.

Rules:

- Tests must use mocked HTTP clients only.
- Tests must not call real courier systems.
- Tests must not require merchant credentials.
- Tests must not include copied GPL source code or copied implementation details.