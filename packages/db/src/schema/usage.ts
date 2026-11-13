import { generateId } from "@reactive-resume/utils/string";
import * as pg from "drizzle-orm/pg-core";

/**
 * Penghitung pemakaian fitur. Satu baris per aksi, tanpa identitas siapa pun.
 *
 * Sengaja TIDAK ada kolom user, surel, IP, user agent, atau isi dokumen. Tujuannya menjawab
 * "fitur apa yang dipakai berapa kali", bukan "siapa memakainya". Karena itu tidak ada kolom
 * yang bisa dipakai menelusuri orang, dan tidak ada yang perlu dihapus kalau akun dihapus.
 *
 * Baris lebih tua dari 365 hari dibersihkan oleh usageService.summary saat admin membuka halaman.
 */
export const usageEvent = pg.pgTable(
	"usage_event",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		// Kunci fitur, misalnya ats_check atau interview_session. Daftar lengkap ada di usage/taxonomy.ts.
		feature: pg.text("feature").notNull(),
		// web untuk aksi di peramban, server untuk aksi yang dipicu prosedur di server.
		source: pg.text("source").notNull().default("web"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index("usage_event_feature_created_at_index").on(t.feature, t.createdAt)],
);
