CREATE TABLE "ai_quota_usage" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"feature" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_session" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"interview_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_quota_usage_user_feature_period_index" ON "ai_quota_usage" ("user_id","feature","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_session_user_interview_index" ON "interview_session" ("user_id","interview_id");--> statement-breakpoint
ALTER TABLE "ai_quota_usage" ADD CONSTRAINT "ai_quota_usage_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "interview_session" ADD CONSTRAINT "interview_session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;