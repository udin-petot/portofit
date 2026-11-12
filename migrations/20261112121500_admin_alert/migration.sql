CREATE TABLE "billing_admin_alert" (
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
CREATE UNIQUE INDEX "billing_admin_alert_order_kind_index" ON "billing_admin_alert" ("order_id","kind");--> statement-breakpoint
CREATE INDEX "billing_admin_alert_status_created_at_index" ON "billing_admin_alert" ("status","created_at");--> statement-breakpoint
ALTER TABLE "billing_admin_alert" ADD CONSTRAINT "billing_admin_alert_order_id_billing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "billing_order"("id") ON DELETE CASCADE;