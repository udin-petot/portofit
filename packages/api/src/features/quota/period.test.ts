import { describe, expect, it } from "vitest";
import { AI_FEATURES, quotaLine, quotaPeriodStart, quotaResetAt, WEEKLY_AI_LIMITS } from "./period";

/** Waktu WIB ditulis sebagai UTC minus tujuh jam, supaya batas pekan mudah dibaca. */
const wib = (iso: string) => new Date(`${iso}+07:00`);

describe("quotaPeriodStart", () => {
	it("memakai Senin 00.00 WIB sebagai awal pekan", () => {
		expect(quotaPeriodStart(wib("2026-11-09T00:00:00")).toISOString()).toBe("2026-11-08T17:00:00.000Z");
	});

	it("tetap di Senin yang sama sampai Minggu malam", () => {
		const start = "2026-11-08T17:00:00.000Z";
		expect(quotaPeriodStart(wib("2026-11-09T13:45:00")).toISOString()).toBe(start);
		expect(quotaPeriodStart(wib("2026-11-15T23:59:59")).toISOString()).toBe(start);
	});

	it("pindah pekan tepat saat Senin dimulai", () => {
		expect(quotaPeriodStart(wib("2026-11-16T00:00:00")).toISOString()).toBe("2026-11-15T17:00:00.000Z");
	});

	it("memakai WIB, bukan UTC, untuk pengguna yang membuka tengah malam", () => {
		// 2026-11-09 00.30 WIB masih Senin pekan baru, sedangkan dalam UTC masih Minggu.
		expect(quotaPeriodStart(new Date("2026-11-08T17:30:00.000Z")).toISOString()).toBe("2026-11-08T17:00:00.000Z");
	});
});

describe("quotaResetAt", () => {
	it("selalu tujuh hari setelah awal pekan", () => {
		const now = wib("2026-11-12T09:00:00");
		const start = quotaPeriodStart(now).getTime();
		expect(quotaResetAt(now).getTime() - start).toBe(7 * 24 * 60 * 60 * 1000);
	});
});

describe("jatah per jenis aksi", () => {
	it("memberi setiap aksi jatah positif", () => {
		for (const feature of AI_FEATURES) expect(WEEKLY_AI_LIMITS[feature]).toBeGreaterThan(0);
	});

	it("tidak pernah melaporkan sisa negatif", () => {
		expect(quotaLine("review", 9).remaining).toBe(0);
	});
});
