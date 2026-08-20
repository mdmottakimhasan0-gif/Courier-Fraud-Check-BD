# Milestone 15: Courier Order Entry, Live Tracking, and Merchant Reports

## Scope

Milestone 15 adds merchant courier order entry on top of the approved SaaS architecture. It does not reuse GPL source code, naming patterns, comments, algorithms, or implementation details. Steadfast, Pathao, and RedX integrations are independently implemented from publicly observable API behavior and merchant-provided documentation.

## Completed Features

- One-click courier order entry for Steadfast, Pathao, and RedX.
- Encrypted per-merchant courier credential storage using the existing AES-256-GCM credential service.
- Automatic phone risk check before parcel submission.
- Merchant-private customer order history by phone number.
- Local order persistence before courier submission.
- Shipment persistence with tracking, consignment, provider status, and delivery fee metadata.
- Courier status event timeline.
- Manual shipment status refresh architecture.
- Merchant report summary for total, delivered, cancelled, returned, failed, pending, COD delivered amount, and provider/status breakdown.
- Frontend merchant workflow page for credentials, risk checking, order submission, order list, and status sync.
- Portal navigation entries for Courier Orders and Courier Reports.

## Backend Architecture

New module:

- `backend/src/modules/courier-orders`

Main components:

- `CourierOrderController`: authenticated API endpoints.
- `CourierOrderService`: merchant scoping, risk assessment, order persistence, reporting, and status refresh orchestration.
- `CourierOrderProviderGateway`: independent provider request mapping for Steadfast, Pathao, and RedX.
- `CourierStatusNormalizer`: maps provider-specific raw statuses into internal shipment lifecycle.

The module imports existing Auth, Business Management, Courier Providers, Fraud Search, and Prisma infrastructure modules.

## Database Models

New Prisma enums:

- `CourierOrderStatus`
- `CourierShipmentStatus`
- `CourierStatusSource`

New Prisma models:

- `OrderCustomer`
- `CourierOrder`
- `CourierShipment`
- `CourierStatusEvent`

Key relationships:

- Tenant has many order customers, orders, shipments, and status events.
- User has many courier orders.
- Courier account can be linked to orders and shipments.
- Order customer has many courier orders.
- Courier order has many courier shipments.
- Courier shipment has many status events.

## Index Strategy

Indexes are optimized for:

- Tenant/user scoped order lists.
- Customer phone history.
- Provider/status filtering.
- Tracking ID and consignment lookup.
- Shipment sync scheduling.
- Status event timeline queries.

Unique constraints:

- One order per tenant and merchant order ID.
- One order per tenant and invoice number.
- One customer profile per tenant and normalized phone.
- Unique shipment tracking/consignment per tenant/provider when present.

## Provider Field Mapping

### Steadfast

Create order maps internal fields to:

- `invoice`
- `recipient_name`
- `recipient_phone`
- `recipient_address`
- `cod_amount`
- `note`
- `item_description`
- `total_lot`
- `delivery_type`

Status refresh supports consignment ID, tracking code, or invoice number.

### Pathao

Create order maps internal fields to:

- `store_id`
- `merchant_order_id`
- `recipient_name`
- `recipient_phone`
- `recipient_address`
- `delivery_type`
- `item_type`
- `special_instruction`
- `item_quantity`
- `item_weight`
- `item_description`
- `amount_to_collect`

The gateway issues an access token using merchant credentials before Pathao API calls.

### RedX

Create parcel maps internal fields to:

- `customer_name`
- `customer_phone`
- `delivery_area`
- `delivery_area_id`
- `customer_address`
- `merchant_invoice_id`
- `cash_collection_amount`
- `parcel_weight`
- `instruction`
- `value`
- `is_closed_box`
- `pickup_store_id`
- `parcel_details_json`

Status refresh uses parcel info by tracking ID.

## Status Mapping

Internal shipment statuses:

- `PENDING`
- `IN_REVIEW`
- `PICKUP_PENDING`
- `IN_TRANSIT`
- `DELIVERED`
- `PARTIAL_DELIVERED`
- `CANCELLED`
- `RETURNED`
- `HOLD`
- `FAILED`
- `UNKNOWN`

Provider raw statuses are stored unchanged in `rawStatus`, while normalized statuses drive reporting and UI.

## API Endpoints

All endpoints are JWT protected and return the existing standard API envelope.

- `POST /api/v1/courier-orders/credentials`
- `GET /api/v1/courier-orders/credentials`
- `POST /api/v1/courier-orders/risk-check`
- `POST /api/v1/courier-orders`
- `GET /api/v1/courier-orders`
- `GET /api/v1/courier-orders/:orderId`
- `POST /api/v1/courier-orders/shipments/:shipmentId/refresh`
- `GET /api/v1/courier-orders/customers/history`
- `GET /api/v1/courier-orders/reports/summary`

## Merchant Data Isolation

Merchant-facing order APIs are scoped by:

- `tenantId`
- authenticated `userId`

This means a merchant user can only view and report on orders they created. Global fraud checking remains available through the existing fraud search engine, but merchant-private order history is never mixed across users.

## Credential Security

Courier credentials are encrypted before storage in `courier_accounts.encrypted_credentials`.

Credential APIs return only metadata:

- provider
- label
- status
- health status
- active state
- timestamps

Secrets are never returned in API responses.

## Frontend Updates

New portal route:

- `/courier-orders`

Features:

- Provider selector.
- Credential entry form.
- Phone risk check panel.
- Order entry form.
- Provider-specific optional fields.
- Submitted order list.
- Shipment status sync action.

New portal route:

- `/courier-reports`

Uses the live report endpoint through the existing module page pattern.

## Background Job Readiness

The data model includes `nextSyncAt`, `lastSyncedAt`, and status events. This supports future BullMQ scheduled status synchronization without changing the persistence model.

## Verification Plan

Completed verification commands:

- `npx prisma validate --schema database/prisma/schema.prisma` - Passed
- `npx prisma generate --schema database/prisma/schema.prisma` - Passed
- `npm run lint` - Passed
- `npm run typecheck` - Passed
- `npm run build` - Passed

Build output includes the new `/courier-orders` and `/courier-reports` frontend routes.

## Scope Verification

Implemented only Milestone 15 scope:

- Courier order entry.
- Credential storage.
- Risk precheck.
- Merchant order persistence.
- Status refresh architecture.
- Merchant reports.
- Frontend portal pages.

Not implemented:

- Mobile app.
- White label.
- AI prediction model training.
- Courier API marketplace.
- Public third-party order API.
- GPL source reuse.
