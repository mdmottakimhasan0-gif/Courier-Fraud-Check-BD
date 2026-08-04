-- Query-performance indexes added during backend stabilization.
CREATE INDEX "subscriptions_tenant_id_user_id_status_current_period_end_idx" ON "subscriptions"("tenant_id", "user_id", "status", "current_period_end");
CREATE INDEX "payments_tenant_id_status_created_at_idx" ON "payments"("tenant_id", "status", "created_at");
CREATE INDEX "invoices_tenant_id_status_created_at_idx" ON "invoices"("tenant_id", "status", "created_at");
CREATE INDEX "coupons_tenant_id_is_active_expires_at_idx" ON "coupons"("tenant_id", "is_active", "expires_at");
CREATE INDEX "promo_codes_tenant_id_coupon_id_idx" ON "promo_codes"("tenant_id", "coupon_id");
CREATE INDEX "search_histories_tenant_id_status_created_at_idx" ON "search_histories"("tenant_id", "status", "created_at");
CREATE INDEX "search_histories_tenant_id_risk_badge_created_at_idx" ON "search_histories"("tenant_id", "risk_badge", "created_at");
