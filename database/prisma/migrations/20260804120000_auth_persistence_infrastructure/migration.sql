-- Extend user account lifecycle for production authentication.
ALTER TYPE "UserStatus" RENAME VALUE 'INVITED' TO 'PENDING';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'BANNED';

-- Create auth infrastructure enums.
CREATE TYPE "MfaFactorType" AS ENUM ('TOTP', 'RECOVERY_CODE');
CREATE TYPE "LoginRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Extend users for lockout, suspicious-login tracking, and JWT permission invalidation.
ALTER TABLE "users" ADD COLUMN "permission_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMP(3);

-- Create auth sessions.
CREATE TABLE "auth_sessions" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "refresh_token_hash" VARCHAR(255) NOT NULL,
  "device" JSONB NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- Create password history.
CREATE TABLE "password_history" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- Create email verification tokens.
CREATE TABLE "email_verification_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- Create password reset tokens.
CREATE TABLE "password_reset_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- Create MFA factors.
CREATE TABLE "mfa_factors" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "factor_type" "MfaFactorType" NOT NULL,
  "secret_hash" VARCHAR(255) NOT NULL,
  "enabled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id")
);

-- Create recovery codes.
CREATE TABLE "recovery_codes" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "code_hash" VARCHAR(255) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recovery_codes_pkey" PRIMARY KEY ("id")
);

-- Create secure email change requests.
CREATE TABLE "email_change_requests" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "current_email" VARCHAR(190) NOT NULL,
  "new_email" VARCHAR(190) NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_change_requests_pkey" PRIMARY KEY ("id")
);

-- Create suspicious login events.
CREATE TABLE "suspicious_login_events" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID,
  "risk_level" "LoginRiskLevel" NOT NULL,
  "ip_address" VARCHAR(64),
  "user_agent" VARCHAR(500),
  "reasons" JSONB NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "suspicious_login_events_pkey" PRIMARY KEY ("id")
);

-- Unique constraints.
CREATE UNIQUE INDEX "api_keys_public_prefix_key" ON "api_keys"("public_prefix");
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE UNIQUE INDEX "mfa_factors_user_id_factor_type_key" ON "mfa_factors"("user_id", "factor_type");
CREATE UNIQUE INDEX "recovery_codes_user_id_code_hash_key" ON "recovery_codes"("user_id", "code_hash");
CREATE UNIQUE INDEX "email_change_requests_token_hash_key" ON "email_change_requests"("token_hash");

-- Query indexes.
CREATE INDEX "auth_sessions_tenant_id_user_id_idx" ON "auth_sessions"("tenant_id", "user_id");
CREATE INDEX "auth_sessions_user_id_revoked_at_idx" ON "auth_sessions"("user_id", "revoked_at");
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
CREATE INDEX "password_history_user_id_created_at_idx" ON "password_history"("user_id", "created_at");
CREATE INDEX "email_verification_tokens_user_id_expires_at_idx" ON "email_verification_tokens"("user_id", "expires_at");
CREATE INDEX "password_reset_tokens_user_id_expires_at_idx" ON "password_reset_tokens"("user_id", "expires_at");
CREATE INDEX "mfa_factors_user_id_enabled_at_idx" ON "mfa_factors"("user_id", "enabled_at");
CREATE INDEX "recovery_codes_user_id_used_at_idx" ON "recovery_codes"("user_id", "used_at");
CREATE INDEX "email_change_requests_user_id_expires_at_idx" ON "email_change_requests"("user_id", "expires_at");
CREATE INDEX "email_change_requests_new_email_idx" ON "email_change_requests"("new_email");
CREATE INDEX "suspicious_login_events_tenant_id_risk_level_created_at_idx" ON "suspicious_login_events"("tenant_id", "risk_level", "created_at");
CREATE INDEX "suspicious_login_events_user_id_created_at_idx" ON "suspicious_login_events"("user_id", "created_at");

-- Foreign keys.
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "suspicious_login_events" ADD CONSTRAINT "suspicious_login_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "suspicious_login_events" ADD CONSTRAINT "suspicious_login_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
