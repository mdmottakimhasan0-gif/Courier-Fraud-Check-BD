CREATE TYPE "CourierOrderStatus" AS ENUM (
  'DRAFT',
  'SUBMITTING',
  'SUBMITTED',
  'PENDING',
  'IN_REVIEW',
  'PICKUP_PENDING',
  'IN_TRANSIT',
  'DELIVERED',
  'PARTIAL_DELIVERED',
  'CANCELLED',
  'RETURNED',
  'HOLD',
  'FAILED',
  'UNKNOWN'
);

CREATE TYPE "CourierShipmentStatus" AS ENUM (
  'PENDING',
  'IN_REVIEW',
  'PICKUP_PENDING',
  'IN_TRANSIT',
  'DELIVERED',
  'PARTIAL_DELIVERED',
  'CANCELLED',
  'RETURNED',
  'HOLD',
  'FAILED',
  'UNKNOWN'
);

CREATE TYPE "CourierStatusSource" AS ENUM ('API_POLL', 'WEBHOOK', 'MANUAL_REFRESH', 'ORDER_CREATE');

CREATE TABLE "order_customers" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "normalized_phone" VARCHAR(24) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "phone" VARCHAR(32) NOT NULL,
  "secondary_phone" VARCHAR(32),
  "address" TEXT NOT NULL,
  "city" VARCHAR(120),
  "area" VARCHAR(120),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "order_customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courier_orders" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "order_customer_id" UUID NOT NULL,
  "selected_provider" "CourierProvider" NOT NULL,
  "courier_account_id" UUID,
  "merchant_order_id" VARCHAR(120) NOT NULL,
  "invoice_number" VARCHAR(120) NOT NULL,
  "customer_name" VARCHAR(160) NOT NULL,
  "customer_phone" VARCHAR(32) NOT NULL,
  "customer_address" TEXT NOT NULL,
  "cod_amount" DECIMAL(12,2) NOT NULL,
  "item_description" TEXT,
  "item_quantity" INTEGER NOT NULL DEFAULT 1,
  "item_weight" DECIMAL(8,2) NOT NULL DEFAULT 0.5,
  "delivery_instruction" TEXT,
  "status" "CourierOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "risk_score" INTEGER,
  "risk_badge" "RiskBadge" NOT NULL DEFAULT 'UNKNOWN',
  "risk_recommendation" VARCHAR(80),
  "risk_snapshot" JSONB,
  "provider_payload" JSONB,
  "provider_response" JSONB,
  "failure_reason" TEXT,
  "submitted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "courier_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courier_shipments" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "courier_account_id" UUID,
  "provider" "CourierProvider" NOT NULL,
  "provider_order_id" VARCHAR(160),
  "tracking_id" VARCHAR(160),
  "consignment_id" VARCHAR(160),
  "merchant_invoice_id" VARCHAR(160),
  "delivery_fee" DECIMAL(12,2),
  "cod_charge" DECIMAL(12,2),
  "status" "CourierShipmentStatus" NOT NULL DEFAULT 'PENDING',
  "raw_status" VARCHAR(160),
  "last_synced_at" TIMESTAMP(3),
  "next_sync_at" TIMESTAMP(3),
  "raw_response" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "courier_shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courier_status_events" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "shipment_id" UUID NOT NULL,
  "provider" "CourierProvider" NOT NULL,
  "status" "CourierShipmentStatus" NOT NULL,
  "raw_status" VARCHAR(160),
  "message_en" TEXT,
  "message_bn" TEXT,
  "source" "CourierStatusSource" NOT NULL DEFAULT 'API_POLL',
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "raw_payload" JSONB,
  "correlation_id" VARCHAR(120),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "courier_status_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_customers_tenant_id_normalized_phone_key" ON "order_customers"("tenant_id", "normalized_phone");
CREATE INDEX "order_customers_tenant_id_normalized_phone_created_at_idx" ON "order_customers"("tenant_id", "normalized_phone", "created_at");
CREATE INDEX "order_customers_tenant_id_deleted_at_idx" ON "order_customers"("tenant_id", "deleted_at");

CREATE UNIQUE INDEX "courier_orders_tenant_id_merchant_order_id_key" ON "courier_orders"("tenant_id", "merchant_order_id");
CREATE UNIQUE INDEX "courier_orders_tenant_id_invoice_number_key" ON "courier_orders"("tenant_id", "invoice_number");
CREATE INDEX "courier_orders_tenant_id_user_id_created_at_idx" ON "courier_orders"("tenant_id", "user_id", "created_at");
CREATE INDEX "courier_orders_tenant_id_customer_phone_created_at_idx" ON "courier_orders"("tenant_id", "customer_phone", "created_at");
CREATE INDEX "courier_orders_tenant_id_selected_provider_status_idx" ON "courier_orders"("tenant_id", "selected_provider", "status");
CREATE INDEX "courier_orders_tenant_id_risk_badge_created_at_idx" ON "courier_orders"("tenant_id", "risk_badge", "created_at");
CREATE INDEX "courier_orders_tenant_id_deleted_at_idx" ON "courier_orders"("tenant_id", "deleted_at");

CREATE UNIQUE INDEX "courier_shipments_tenant_id_provider_tracking_id_key" ON "courier_shipments"("tenant_id", "provider", "tracking_id");
CREATE UNIQUE INDEX "courier_shipments_tenant_id_provider_consignment_id_key" ON "courier_shipments"("tenant_id", "provider", "consignment_id");
CREATE INDEX "courier_shipments_tenant_id_order_id_idx" ON "courier_shipments"("tenant_id", "order_id");
CREATE INDEX "courier_shipments_tenant_id_provider_status_idx" ON "courier_shipments"("tenant_id", "provider", "status");
CREATE INDEX "courier_shipments_tenant_id_tracking_id_idx" ON "courier_shipments"("tenant_id", "tracking_id");
CREATE INDEX "courier_shipments_tenant_id_next_sync_at_idx" ON "courier_shipments"("tenant_id", "next_sync_at");
CREATE INDEX "courier_shipments_tenant_id_deleted_at_idx" ON "courier_shipments"("tenant_id", "deleted_at");

CREATE INDEX "courier_status_events_tenant_id_shipment_id_occurred_at_idx" ON "courier_status_events"("tenant_id", "shipment_id", "occurred_at");
CREATE INDEX "courier_status_events_tenant_id_provider_status_idx" ON "courier_status_events"("tenant_id", "provider", "status");
CREATE INDEX "courier_status_events_tenant_id_created_at_idx" ON "courier_status_events"("tenant_id", "created_at");

ALTER TABLE "order_customers" ADD CONSTRAINT "order_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courier_orders" ADD CONSTRAINT "courier_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courier_orders" ADD CONSTRAINT "courier_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courier_orders" ADD CONSTRAINT "courier_orders_order_customer_id_fkey" FOREIGN KEY ("order_customer_id") REFERENCES "order_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courier_orders" ADD CONSTRAINT "courier_orders_courier_account_id_fkey" FOREIGN KEY ("courier_account_id") REFERENCES "courier_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "courier_shipments" ADD CONSTRAINT "courier_shipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courier_shipments" ADD CONSTRAINT "courier_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "courier_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "courier_shipments" ADD CONSTRAINT "courier_shipments_courier_account_id_fkey" FOREIGN KEY ("courier_account_id") REFERENCES "courier_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "courier_status_events" ADD CONSTRAINT "courier_status_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courier_status_events" ADD CONSTRAINT "courier_status_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "courier_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
