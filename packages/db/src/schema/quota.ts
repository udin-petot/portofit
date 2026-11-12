import { generateId } from "@reactive-resume/utils/string";
import * as pg from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Pemakaian jatah AI per pekan. Satu baris per pengguna, jenis aksi, dan pekan yang mulai Senin 00.00 WIB.
 * Yang disimpan adalah pemakaian, bukan sisa, supaya reset cukup dengan berpindah periode tanpa menyentuh baris lama.
 */
export const aiQuotaUsage = pg.pgTable(
	"ai_quota_usage",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// review, improve, coach, job_match
		feature: pg.text("feature").notNull(),
		periodStart: pg.timestamp("period_start", { withTimezone: true }).notNull(),
		used: pg.integer("used").notNull().default(0),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(t) => [pg.uniqueIndex("ai_quota_usage_user_feature_period_index").on(t.userId, t.feature, t.periodStart)],
);

/**
 * Sesi latihan wawancara yang sudah dibayar. Satu kredit wawancara dipakai sekali per wawancara,
 * berapa kali pun jawabannya dilatih ulang pada wawancara yang sama.
 */
export const interviewSession = pg.pgTable(
	"interview_session",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		interviewId: pg.text("interview_id").notNull(),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.uniqueIndex("interview_session_user_interview_index").on(t.userId, t.interviewId)],
);
