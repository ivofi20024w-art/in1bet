CREATE TABLE "admin_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(30) NOT NULL,
	"target_id" varchar(100) NOT NULL,
	"data_before" text,
	"data_after" text,
	"reason" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" varchar NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"referer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_conversions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" varchar NOT NULL,
	"affiliate_link_id" varchar,
	"user_id" varchar NOT NULL,
	"deposit_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"wager_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"net_revenue" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"commission_type" varchar(20) NOT NULL,
	"commission_value" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"qualified_at" timestamp,
	"matures_at" timestamp,
	"fraud_reason" text,
	"user_ip" varchar(45),
	"user_device" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" varchar NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"clicks" numeric(15, 0) DEFAULT '0' NOT NULL,
	"registrations" numeric(15, 0) DEFAULT '0' NOT NULL,
	"conversions" numeric(15, 0) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "affiliate_payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" varchar NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"pix_key" text NOT NULL,
	"pix_key_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(20),
	"cpf" varchar(14),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"commission_type" varchar(20) DEFAULT 'CPA' NOT NULL,
	"cpa_value" numeric(15, 2) DEFAULT '50.00' NOT NULL,
	"revshare_percentage" numeric(5, 2) DEFAULT '30.00' NOT NULL,
	"min_deposit_for_cpa" numeric(15, 2) DEFAULT '50.00' NOT NULL,
	"min_wager_for_cpa" numeric(15, 2) DEFAULT '100.00' NOT NULL,
	"total_earnings" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"pending_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"locked_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"paid_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"total_referrals" numeric(10, 0) DEFAULT '0' NOT NULL,
	"qualified_referrals" numeric(10, 0) DEFAULT '0' NOT NULL,
	"is_fraud_suspect" boolean DEFAULT false,
	"fraud_reason" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" varchar(30) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"max_value" numeric(15, 2) NOT NULL,
	"fixed_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"max_withdrawal" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"rollover_multiplier" numeric(5, 2) NOT NULL,
	"min_deposit" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_first_deposit_only" boolean DEFAULT false NOT NULL,
	"valid_days" numeric(5, 0) DEFAULT '30' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"document_type" varchar(10) NOT NULL,
	"document_front_url" text NOT NULL,
	"document_back_url" text,
	"selfie_url" text NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pix_deposits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"external_id" varchar(128) NOT NULL,
	"ondapay_transaction_id" varchar(128),
	"amount" numeric(15, 2) NOT NULL,
	"net_amount" numeric(15, 2),
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"qr_code" text,
	"qr_code_base64" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pix_deposits_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "pix_withdrawals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"pix_key" text NOT NULL,
	"pix_key_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"transaction_id" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(30) NOT NULL,
	"target_id" varchar(100) NOT NULL,
	"user_id" varchar,
	"details" text,
	"reason" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"wallet_id" varchar NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"balance_before" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reference_id" varchar(150),
	"description" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "user_bonuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bonus_id" varchar NOT NULL,
	"deposit_id" varchar,
	"bonus_amount" numeric(15, 2) NOT NULL,
	"rollover_total" numeric(15, 2) NOT NULL,
	"rollover_remaining" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"password" text NOT NULL,
	"phone" varchar(20),
	"birth_date" timestamp,
	"is_verified" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"admin_role" varchar(20) DEFAULT 'USER',
	"is_blocked" boolean DEFAULT false,
	"block_reason" text,
	"blocked_at" timestamp,
	"blocked_by" varchar,
	"kyc_status" varchar(20) DEFAULT 'pending',
	"vip_level" varchar(20) DEFAULT 'bronze',
	"auto_withdraw_allowed" boolean DEFAULT false,
	"affiliate_id" varchar,
	"referral_code" varchar(50),
	"registration_ip" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"bonus_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"locked_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"rollover_remaining" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"rollover_total" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "welcome_bonus_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"user_id" varchar NOT NULL,
	"bonus_id" varchar NOT NULL,
	"user_bonus_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "welcome_bonus_claims_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_deposits" ADD CONSTRAINT "pix_deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_withdrawals" ADD CONSTRAINT "pix_withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_withdrawals" ADD CONSTRAINT "pix_withdrawals_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_bonus_id_bonuses_id_fk" FOREIGN KEY ("bonus_id") REFERENCES "public"."bonuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_deposit_id_pix_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."pix_deposits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welcome_bonus_claims" ADD CONSTRAINT "welcome_bonus_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welcome_bonus_claims" ADD CONSTRAINT "welcome_bonus_claims_bonus_id_bonuses_id_fk" FOREIGN KEY ("bonus_id") REFERENCES "public"."bonuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welcome_bonus_claims" ADD CONSTRAINT "welcome_bonus_claims_user_bonus_id_user_bonuses_id_fk" FOREIGN KEY ("user_bonus_id") REFERENCES "public"."user_bonuses"("id") ON DELETE no action ON UPDATE no action;