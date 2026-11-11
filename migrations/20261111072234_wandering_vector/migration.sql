CREATE TABLE "billing_order_email" (
	"id" text PRIMARY KEY,
	"order_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "billing_order_email_order_kind_index" ON "billing_order_email" ("order_id","kind");--> statement-breakpoint
CREATE INDEX "billing_order_email_status_created_at_index" ON "billing_order_email" ("status","created_at");--> statement-breakpoint
ALTER TABLE "billing_order_email" ADD CONSTRAINT "billing_order_email_order_id_billing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "billing_order"("id") ON DELETE CASCADE;