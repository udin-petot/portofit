import { describe, expect, it } from "vitest";
import { formatCountdown } from "./countdown";

describe("formatCountdown", () => {
	it("menampilkan menit dan detik dua digit", () => {
		expect(formatCountdown(10 * 60_000)).toBe("10:00");
		expect(formatCountdown(9 * 60_000 + 59_000)).toBe("09:59");
	});

	it("tidak pernah menampilkan angka negatif", () => {
		expect(formatCountdown(-5000)).toBe("00:00");
	});
});
