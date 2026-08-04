-- Extend subscription lifecycle.
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'TRIAL';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'GRACE_PERIOD';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Extend invoice lifecycle.
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- Add configurable plan limits.
ALTER TABLE "plans" ADD COLUMN "api_request_limit" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "plans" ADD COLUMN "max_api_keys" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "plans" ADD COLUMN "max_team_members" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "plans" ADD COLUMN "max_merchant_accounts" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "plans" ADD COLUMN "max_saved_searches" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "plans" ADD COLUMN "search_history_retention_days" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "plans" ADD COLUMN "priority_queue" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "plans" ADD COLUMN "premium_support" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "plans" ADD COLUMN "feature_flag_access" BOOLEAN NOT NULL DEFAULT false;

-- Add coupon and promo campaign controls.
ALTER TABLE "coupons" ADD COLUMN "per_user_redemption_limit" INTEGER;
ALTER TABLE "promo_codes" ADD COLUMN "coupon_id" UUID;
ALTER TABLE "promo_codes" ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT';
CREATE INDEX "promo_codes_tenant_id_status_idx" ON "promo_codes"("tenant_id", "status");
