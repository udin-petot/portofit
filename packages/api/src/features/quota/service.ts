import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { aiQuotaUsage, interviewSession } from "@reactive-resume/db/schema";
import { billingService } from "../billing/service";
import { AI_FEATURES, type AiFeature, quotaLine, quotaPeriodStart, quotaResetAt, WEEKLY_AI_LIMITS } from "./period";

export type { AiFeature, QuotaLine } from "./period";
export { AI_FEATURES, WEEKLY_AI_LIMITS, quotaPeriodStart, quotaResetAt } from "./period";

function line(feature: AiFeature, used: number) {
	return quotaLine(feature, used);
}

export const quotaService = {
	/** Pemakaian pekan berjalan untuk halaman jatah. Fitur yang belum dipakai tetap muncul dengan angka nol. */
	async status(userId: string, now: Date = new Date()) {
		const periodStart = quotaPeriodStart(now);
		const rows = await db
			.select({ feature: aiQuotaUsage.feature, used: aiQuotaUsage.used })
			.from(aiQuotaUsage)
			.where(and(eq(aiQuotaUsage.userId, userId), eq(aiQuotaUsage.periodStart, periodStart)));

		const used = new Map(rows.map((row) => [row.feature, row.used]));
		return {
			periodStart,
			resetAt: quotaResetAt(now),
			features: AI_FEATURES.map((feature) => line(feature, used.get(feature) ?? 0)),
		};
	},

	/**
	 * Memotong jatah sebelum pekerjaan AI dimulai. Dipanggil di awal handler, bukan di tampilan,
	 * supaya panggilan langsung ke endpoint tidak bisa melewati batas.
	 */
	consume(input: { userId: string; feature: AiFeature; cost?: number; now?: Date }) {
		// Tombol mati: menghentikan biaya model tanpa deploy ulang. Dibaca dari process.env supaya
		// bisa dinyalakan hanya dengan mengganti env container, tanpa menyentuh skema env.
		if (process.env.AI_PAUSED === "true" || process.env.AI_PAUSED === "1") {
			throw new ORPCError("SERVICE_UNAVAILABLE", {
				message: "Layanan AI sedang dijeda sebentar. Coba lagi nanti.",
				data: { code: "AI_PAUSED" },
			});
		}
		const cost = input.cost ?? 1;
		const limit = WEEKLY_AI_LIMITS[input.feature];
		const periodStart = quotaPeriodStart(input.now);

		return db.transaction(async (tx) => {
			await tx.execute(
				sql`select pg_advisory_xact_lock(hashtext(${`${input.userId}:ai:${input.feature}`}))`,
			);
			const [row] = await tx
				.select({ id: aiQuotaUsage.id, used: aiQuotaUsage.used })
				.from(aiQuotaUsage)
				.where(
					and(
						eq(aiQuotaUsage.userId, input.userId),
						eq(aiQuotaUsage.feature, input.feature),
						eq(aiQuotaUsage.periodStart, periodStart),
					),
				)
				.limit(1);

			const used = row?.used ?? 0;
			if (used + cost > limit) {
				throw new ORPCError("FORBIDDEN", {
					message: "Jatah AI pekan ini habis. Jatah kembali penuh setiap Senin.",
					data: {
						code: "QUOTA_EXHAUSTED",
						feature: input.feature,
						limit,
						used,
						resetAt: quotaResetAt(input.now).toISOString(),
					},
				});
			}

			const next = used + cost;
			if (row) {
				await tx.update(aiQuotaUsage).set({ used: next }).where(eq(aiQuotaUsage.id, row.id));
			} else {
				await tx.insert(aiQuotaUsage).values({
					userId: input.userId,
					feature: input.feature,
					periodStart,
					used: next,
				});
			}

			return line(input.feature, next);
		});
	},

	/**
	 * Mengembalikan jatah yang sudah dipotong ketika pekerjaan AI gagal, supaya pengguna tidak
	 * kehilangan jatah karena kesalahan penyedia, bukan karena pemakaian.
	 */
	async release(input: { userId: string; feature: AiFeature; cost?: number; now?: Date }) {
		const cost = input.cost ?? 1;
		const periodStart = quotaPeriodStart(input.now);
		await db
			.update(aiQuotaUsage)
			.set({ used: sql`greatest(${aiQuotaUsage.used} - ${cost}, 0)` })
			.where(
				and(
					eq(aiQuotaUsage.userId, input.userId),
					eq(aiQuotaUsage.feature, input.feature),
					eq(aiQuotaUsage.periodStart, periodStart),
				),
			);
	},

	/**
	 * Satu kredit wawancara dipakai sekali per wawancara, bukan per jawaban.
	 * Baris sesi dibuat lebih dulu sebagai penanda; kalau kreditnya tidak ada, penanda dihapus lagi.
	 */
	async claimInterviewSession(input: { userId: string; interviewId: string; reason: string }) {
		const [session] = await db
			.insert(interviewSession)
			.values({ userId: input.userId, interviewId: input.interviewId })
			.onConflictDoNothing({ target: [interviewSession.userId, interviewSession.interviewId] })
			.returning({ id: interviewSession.id });

		if (!session) return { charged: false as const };

		try {
			await billingService.consumeCredit({
				userId: input.userId,
				kind: "interview",
				reason: input.reason,
			});
			return { charged: true as const };
		} catch (error) {
			await db.delete(interviewSession).where(eq(interviewSession.id, session.id));
			throw error;
		}
	},
};
