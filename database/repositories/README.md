# Repository Contracts

Milestone 3 reserves this folder for database repository interfaces and persistence contracts.

No executable repository implementation is added in this milestone because business services are out of scope.

Future repository contracts should follow these rules:

- Depend on domain/application interfaces, not controllers.
- Keep tenant scoping explicit.
- Never expose raw merchant credentials.
- Support soft-delete filters by default.
- Keep read models and write models independently testable.
