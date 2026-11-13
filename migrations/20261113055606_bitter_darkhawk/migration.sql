CREATE TABLE "usage_event" (
	"id" text PRIMARY KEY,
	"feature" text NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "usage_event_feature_created_at_index" ON "usage_event" ("feature","created_at");
