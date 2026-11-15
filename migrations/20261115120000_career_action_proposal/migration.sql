-- The coach's proposed jobs: a confirmation card reads this row, not job fields sent by the browser.
CREATE TABLE IF NOT EXISTS "career_action_proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"thread_id" text NOT NULL,
	"status" text NOT NULL DEFAULT 'pending',
	"jobs" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "career_action_proposal_user_thread_index"
	ON "career_action_proposal" ("user_id", "thread_id");
CREATE INDEX IF NOT EXISTS "career_action_proposal_status_expires_index"
	ON "career_action_proposal" ("status", "expires_at");
