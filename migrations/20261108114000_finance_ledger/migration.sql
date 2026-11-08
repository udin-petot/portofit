CREATE TABLE "finance_entry" (
	"id" text PRIMARY KEY,
	"kind" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount_idr" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "finance_entry_occurred_at_index" ON "finance_entry" ("occurred_at");--> statement-breakpoint
CREATE INDEX "finance_entry_kind_occurred_at_index" ON "finance_entry" ("kind","occurred_at");--> statement-breakpoint
ALTER TABLE "finance_entry" ADD CONSTRAINT "finance_entry_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;