# Database ERD Summary

```mermaid
erDiagram
  Tenant ||--o{ User : owns
  Tenant ||--o{ Role : owns
  Tenant ||--o{ Plan : owns
  Tenant ||--o{ Subscription : owns
  Tenant ||--o{ Payment : owns
  Tenant ||--o{ Invoice : owns
  Tenant ||--o{ SearchHistory : owns
  Tenant ||--o{ FraudResult : owns
  Tenant ||--o{ CourierAccount : owns
  Tenant ||--o{ ApiKey : owns
  Tenant ||--o{ WebhookEndpoint : owns
  Tenant ||--o{ Notification : owns
  Tenant ||--o{ AuditLog : owns
  Tenant ||--o{ SupportTicket : owns
  Tenant ||--o{ Announcement : owns
  Tenant ||--o{ BlogPost : owns
  Tenant ||--o{ SystemSetting : owns
  Tenant ||--o{ FeatureFlag : owns
  Tenant ||--o{ StoredFile : owns

  User ||--o{ UserRole : assigned
  Role ||--o{ UserRole : assigned
  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : granted

  User ||--o{ Subscription : subscribes
  Plan ||--o{ Subscription : selected
  Subscription ||--o{ Payment : billed
  Subscription ||--o{ Invoice : invoiced
  Payment ||--o{ Invoice : settles

  User ||--o{ SearchHistory : performs
  SearchHistory ||--o{ FraudResult : contains

  User ||--o{ ApiKey : owns
  WebhookEndpoint ||--o{ WebhookDelivery : receives
  User ||--o{ Notification : receives
  User ||--o{ AuditLog : acts
  User ||--o{ SupportTicket : opens
  User ||--o{ StoredFile : uploads
```

## Notes

- Tenant-ready modeling is present across tenant-owned records through `tenant_id`.
- Soft-delete support is represented through `deleted_at` on business records.
- Sensitive merchant credentials are represented only as encrypted credential payloads.
- Search and fraud result records are normalized for future analytics and AI risk scoring.