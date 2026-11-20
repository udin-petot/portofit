-- Soft delete for applications: hidden from lists and insights, restorable for 30 days.
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "trashed_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "application_user_trashed_index"
	ON "application" ("user_id", "trashed_at");
