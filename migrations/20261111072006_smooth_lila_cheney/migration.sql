ALTER TABLE "billing_order" ADD COLUMN "expires_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "billing_order_status_expires_at_index" ON "billing_order" ("status","expires_at");
--> statement-breakpoint
UPDATE "billing_order" SET "expires_at" = "created_at" + interval '10 minutes' WHERE "status" = 'menunggu_bayar' AND "expires_at" IS NULL;
