import { inArray, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";

/**
 * Promote accounts listed in ADMIN_EMAILS to admin on startup. Existing accounts only: this never
 * creates a user, so a typo cannot mint an admin with an unknown password.
 */
export async function promoteConfiguredAdmins(): Promise<number> {
	const emails = (env.ADMIN_EMAILS ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
	if (emails.length === 0) return 0;

	const rows = await db
		.update(schema.user)
		.set({ role: "admin" })
		.where(inArray(sql`lower(${schema.user.email})`, emails))
		.returning({ id: schema.user.id });

	return rows.length;
}
