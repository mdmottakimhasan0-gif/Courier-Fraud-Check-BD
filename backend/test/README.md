# Backend Test Scaffolding

Milestone 10.5 defines the backend test structure without adding full test suites.

- `unit`: isolated service, guard, DTO, and utility tests.
- `integration`: module-level tests with mocked infrastructure or test database adapters.
- `e2e`: HTTP API contract tests against the Nest application.

Future test milestones should add a runner configuration and coverage thresholds without changing production behavior.
