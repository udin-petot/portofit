/** Jenis aksi AI yang punya jatah sendiri. Aksi deterministik tidak pernah masuk hitungan ini. */
export const AI_FEATURES = ["review", "improve", "coach", "job_match"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

/**
 * Jatah per pekan, bukan per bulan, supaya pengguna punya alasan kembali tiap Senin.
 * Angka dipilih dari biaya per aksi: review paling mahal, perbaikan baris paling murah.
 */
export const WEEKLY_AI_LIMITS: Record<AiFeature, number> = {
	review: 3,
	improve: 20,
	coach: 5,
	job_match: 3,
};

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Senin 00.00 WIB pada pekan berjalan, dikembalikan sebagai waktu UTC. */
export function quotaPeriodStart(now: Date = new Date()): Date {
	const wib = new Date(now.getTime() + WIB_OFFSET_MS);
	const day = wib.getUTCDay();
	const sinceMonday = (day + 6) % 7;
	const midnightWib = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate() - sinceMonday);
	return new Date(midnightWib - WIB_OFFSET_MS);
}

/** Senin 00.00 WIB pekan berikutnya, dipakai klien untuk menulis kapan jatah kembali penuh. */
export function quotaResetAt(now: Date = new Date()): Date {
	return new Date(quotaPeriodStart(now).getTime() + WEEK_MS);
}

export type QuotaLine = {
	feature: AiFeature;
	limit: number;
	used: number;
	remaining: number;
};

export function quotaLine(feature: AiFeature, used: number): QuotaLine {
	const limit = WEEKLY_AI_LIMITS[feature];
	return { feature, limit, used, remaining: Math.max(0, limit - used) };
}
