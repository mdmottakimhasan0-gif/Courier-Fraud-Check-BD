# Seed Architecture

Milestone 3 defines seed architecture only. It does not insert production data.

Future seed execution should be split into deterministic categories:

- `system`: immutable permissions, feature flag keys, and platform defaults.
- `plans`: default plan definitions for local and staging environments.
- `development`: disposable local-only records.
- `test`: deterministic fixtures for automated tests.

Seed rules:

- Production seeds must never create real merchant credentials.
- Production seeds must never create live payment records.
- Production seeds must be idempotent.
- Seed files must be safe to rerun.
- Sensitive values must be read from secure runtime configuration, not committed.

The first executable seed script should be added only when the corresponding Milestone introduces the affected module.
