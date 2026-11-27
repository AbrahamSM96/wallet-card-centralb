CREATE TYPE "public"."card_platform" AS ENUM('apple', 'google');--> statement-breakpoint
CREATE TYPE "public"."card_status" AS ENUM('active', 'flagged', 'voided');--> statement-breakpoint
CREATE TYPE "public"."stamp_source" AS ENUM('manual', 'order', 'referral_bonus');--> statement-breakpoint
CREATE TABLE "admins" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"password_hash" text NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "apple_registrations" (
	"card_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_library_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"push_token" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "birthday_notifications" (
	"customer_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"apple_auth_token" text,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "card_platform",
	"public_code" text NOT NULL,
	"stamp_count" integer DEFAULT 0 NOT NULL,
	"status" "card_status" DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cards_public_code_unique" UNIQUE("public_code")
);
--> statement-breakpoint
CREATE TABLE "claim_tokens" (
	"card_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "claim_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"birthday" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"privacy_accepted_at" timestamp with time zone,
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"card_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_admin_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stamps_used" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referred_customer_id" uuid NOT NULL,
	"referrer_card_id" uuid NOT NULL,
	"rewarded_at" timestamp with time zone,
	CONSTRAINT "referrals_referred_customer_id_unique" UNIQUE("referred_customer_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"birthday_promo_text" text NOT NULL,
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"reward_text" text NOT NULL,
	"stamps_required" integer DEFAULT 10 NOT NULL,
	"store_latitude" double precision NOT NULL,
	"store_longitude" double precision NOT NULL,
	"store_name" text NOT NULL,
	"store_relevant_text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row_check" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "stamps" (
	"card_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_admin_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note" text,
	"order_number" text,
	"source" "stamp_source" NOT NULL,
	CONSTRAINT "stamps_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "apple_registrations" ADD CONSTRAINT "apple_registrations_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "birthday_notifications" ADD CONSTRAINT "birthday_notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_tokens" ADD CONSTRAINT "claim_tokens_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_customer_id_customers_id_fk" FOREIGN KEY ("referred_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_card_id_cards_id_fk" FOREIGN KEY ("referrer_card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamps" ADD CONSTRAINT "stamps_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamps" ADD CONSTRAINT "stamps_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "apple_registration_device_card_unique" ON "apple_registrations" USING btree ("device_library_id","card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "birthday_notification_customer_year_unique" ON "birthday_notifications" USING btree ("customer_id","year");--> statement-breakpoint
CREATE INDEX "cards_customer_id_index" ON "cards" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_customer_active_unique" ON "cards" USING btree ("customer_id") WHERE "cards"."status" <> 'voided';--> statement-breakpoint
CREATE INDEX "claim_tokens_card_id_index" ON "claim_tokens" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "stamps_card_id_index" ON "stamps" USING btree ("card_id");