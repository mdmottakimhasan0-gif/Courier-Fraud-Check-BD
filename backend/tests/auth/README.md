# Authentication Test Structure

Milestone 6 reserves the authentication test structure. Future executable tests should use mocked repositories and never call external OAuth/email providers.

Planned coverage:

- Argon2id password hashing and verification.
- Password history rejection for reused passwords.
- JWT access token creation.
- Refresh token rotation and reuse detection.
- Current-device logout.
- All-device logout.
- Login rate limiting.
- Account lockout.
- RBAC and PBAC permission decisions.
- Email verification token creation and consumption.
- Password reset token creation and consumption.
- Audit event emission.
- Secure cookie option construction.
- API key authentication contract behavior.
- Google OAuth verifier contract behavior.
- MFA recovery code generation and hash behavior.
- Secure email-change token workflow.
- Suspicious login signal evaluation.
- Account status lifecycle blocking behavior.
- Permission version mismatch invalidation behavior.

Rules:

- Do not introduce public API endpoints in Milestone 6 tests.
- Do not use Redis or BullMQ.
- Do not send real emails.
- Do not call Google OAuth.
- Do not persist production data.
