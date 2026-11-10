CREATE TABLE "support_conversation" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"escalated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_message" (
	"id" text PRIMARY KEY,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "support_conversation_user_id_created_at_index" ON "support_conversation" ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "support_conversation_user_id_index" ON "support_conversation" ("user_id") WHERE "status" = 'open';--> statement-breakpoint
CREATE INDEX "support_message_conversation_id_created_at_index" ON "support_message" ("conversation_id","created_at");--> statement-breakpoint
ALTER TABLE "support_conversation" ADD CONSTRAINT "support_conversation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_conversation_id_support_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "support_conversation"("id") ON DELETE CASCADE;