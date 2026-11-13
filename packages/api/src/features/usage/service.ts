import { ORPCError } from "@orpc/server";
import { gte, lt, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { usageEvent } from "@reactive-resume/db/schema";
import { isUsageFeature, USAGE_FEATURES, USAGE_FEATURE_KEYS } from "./taxonomy";

/** Baris lebih tua dari ini dibuang. Satu tahun, sesuai keputusan pemilik produk. */
const RETENTION_DAYS = 365;

function assertAdmin(role: string | null | undefined) {
	if (role !== "admin") throw new ORPCError("FORBIDDEN", { message: "Butuh peran admin untuk tindakan ini." });
}

export const usageService = {
	/**
	 * Mencatat satu pemakaian. Tidak menyimpan siapa yang memakai, hanya fitur apa dan kapan.
	 * Kunci yang tidak ada di daftar ditolak, supaya tabel tidak jadi tempat sampah.
	 */
	async track(input: { feature: string; source?: "web" | "server" | undefined }) {
		if (!isUsageFeature(input.feature)) return { recorded: false };

		await db.insert(usageEvent).values({
			feature: input.feature,
			source: input.source === "server" ? "server" : "web",
		});

		return { recorded: true };
	},

	/** Membuang baris kedaluwarsa. Dipanggil saat admin membuka halaman, bukan tiap permintaan. */
	async prune() {
		const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
		await db.delete(usageEvent).where(lt(usageEvent.createdAt, cutoff));
	},

	async summary(input: { role?: string | null | undefined; days?: number | undefined }) {
		assertAdmin(input.role);

		const days = Math.min(Math.max(input.days ?? 30, 1), 365);
		const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		await this.prune();

		const rows = await db
			.select({ feature: usageEvent.feature, count: sql<number>`count(*)::int` })
			.from(usageEvent)
			.where(gte(usageEvent.createdAt, since))
			.groupBy(usageEvent.feature);

		const totals = new Map(rows.map((row) => [row.feature, row.count]));
		const total = rows.reduce((sum, row) => sum + row.count, 0);

		// Fitur tanpa pemakaian tetap muncul dengan angka nol, supaya yang belum laku terlihat juga.
		const features = USAGE_FEATURE_KEYS.map((feature) => {
			const count = totals.get(feature) ?? 0;
			return {
				feature,
				label: USAGE_FEATURES[feature].label,
				group: USAGE_FEATURES[feature].group,
				count,
				share: total > 0 ? count / total : 0,
			};
		}).sort((a, b) => b.count - a.count);

		const daily = await db
			.select({
				date: sql<string>`to_char(date_trunc('day', ${usageEvent.createdAt} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`,
				count: sql<number>`count(*)::int`,
			})
			.from(usageEvent)
			.where(gte(usageEvent.createdAt, since))
			.groupBy(sql`1`)
			.orderBy(sql`1`);

		const [last] = await db.select({ at: sql<string | null>`max(${usageEvent.createdAt})::text` }).from(usageEvent);

		return { days, since: since.toISOString(), total, features, daily, lastEventAt: last?.at ?? null };
	},
};
