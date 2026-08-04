# Fraud Search Engine Unit-Test Structure

Milestone 5 reserves the fraud search engine test structure. Future executable tests should mock the provider factory and provider adapters.

Test coverage plan:

- Bangladeshi phone validation accepts local and +88 formats.
- Invalid phone numbers fail before provider execution.
- Provider searches run in parallel through mocked providers.
- Aggregation sums only available provider results.
- Partial provider failures return `partial` status when at least one provider succeeds.
- All provider failures return `failed` status.
- Risk score and risk badge follow the documented formula.
- Confidence score reflects weighted provider coverage.
- Data freshness and search timing metadata are returned.
- Correlation ID is propagated to provider requests and final search results.
- Standard internal error codes are returned for rejected provider outcomes.
- Cached status remains reserved for the later cache milestone.

Rules:

- Do not call real courier providers.
- Do not require merchant credentials.
- Do not persist search history.
- Do not use Redis or BullMQ in Milestone 5 tests.
