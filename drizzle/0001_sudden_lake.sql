ALTER TABLE "claim_tokens" ADD COLUMN "invalidated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "reward_skipped_reason" text;