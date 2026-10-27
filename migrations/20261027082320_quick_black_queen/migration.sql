CREATE TABLE "admin_audit" (
	"id" text PRIMARY KEY,
	"actor_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_credit_ledger" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"order_id" text,
	"balance_after" integer NOT NULL,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_order" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"plan_id" text,
	"plan_code" text NOT NULL,
	"plan_name" text NOT NULL,
	"kind" text NOT NULL,
	"credits" integer NOT NULL,
	"amount_idr" integer NOT NULL,
	"unique_code" integer NOT NULL,
	"total_idr" integer NOT NULL,
	"status" text DEFAULT 'menunggu_bayar' NOT NULL,
	"payment_method" text DEFAULT 'qris' NOT NULL,
	"proof_path" text,
	"proof_note" text,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_plan" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"kind" text DEFAULT 'application' NOT NULL,
	"price_idr" integer NOT NULL,
	"credits" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_audit_created_at_index" ON "admin_audit" ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_actor_id_index" ON "admin_audit" ("actor_id");--> statement-breakpoint
CREATE INDEX "billing_credit_ledger_user_id_kind_created_at_index" ON "billing_credit_ledger" ("user_id","kind","created_at");--> statement-breakpoint
CREATE INDEX "billing_credit_ledger_order_id_index" ON "billing_credit_ledger" ("order_id");--> statement-breakpoint
CREATE INDEX "billing_order_user_id_created_at_index" ON "billing_order" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "billing_order_status_created_at_index" ON "billing_order" ("status","created_at");--> statement-breakpoint
CREATE INDEX "billing_plan_active_sort_order_index" ON "billing_plan" ("active","sort_order");--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_actor_id_user_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "billing_credit_ledger" ADD CONSTRAINT "billing_credit_ledger_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "billing_credit_ledger" ADD CONSTRAINT "billing_credit_ledger_order_id_billing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "billing_order"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "billing_credit_ledger" ADD CONSTRAINT "billing_credit_ledger_actor_id_user_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "billing_order" ADD CONSTRAINT "billing_order_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "billing_order" ADD CONSTRAINT "billing_order_plan_id_billing_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plan"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "billing_order" ADD CONSTRAINT "billing_order_verified_by_user_id_fkey" FOREIGN KEY ("verified_by") REFERENCES "user"("id") ON DELETE SET NULL;