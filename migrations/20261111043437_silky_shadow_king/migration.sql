CREATE TABLE "invoice" (
	"id" text PRIMARY KEY,
	"number" text NOT NULL UNIQUE,
	"order_id" text NOT NULL UNIQUE,
	"user_id" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"snapshot" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counter" (
	"year" integer PRIMARY KEY,
	"last_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_email" (
	"id" text PRIMARY KEY,
	"invoice_id" text NOT NULL,
	"to_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "invoice_user_id_issued_at_index" ON "invoice" ("user_id","issued_at");--> statement-breakpoint
CREATE INDEX "invoice_email_status_created_at_index" ON "invoice_email" ("status","created_at");--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_order_id_billing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "billing_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice_email" ADD CONSTRAINT "invoice_email_invoice_id_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE;