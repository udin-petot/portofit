import { describe, expect, it } from "vitest";
import { SUPPORT_FAQ } from "@reactive-resume/utils/support-faq";
import { buildSupportPrompt } from "./prompt";

describe("buildSupportPrompt", () => {
	it("memuat semua pertanyaan FAQ", () => {
		const prompt = buildSupportPrompt({ prices: [], userAmounts: [] });
		for (const item of SUPPORT_FAQ) expect(prompt).toContain(item.question);
	});

	it("memuat harga dari basis data, bukan angka yang ditulis mati", () => {
		const prompt = buildSupportPrompt({
			prices: [
				{ code: "plan_lamaran_1", priceIdr: 5000 },
				{ code: "plan_wawancara_1", priceIdr: 10000 },
			],
			userAmounts: [],
		});
		expect(prompt).toContain("5000");
		expect(prompt).toContain("10000");
	});

	it("memuat semua kalimat penjagaan", () => {
		const prompt = buildSupportPrompt({ prices: [], userAmounts: [] });
		expect(prompt).toContain("Jangan pernah menjanjikan pengembalian dana");
		expect(prompt).toContain("Jangan meminta sandi");
		expect(prompt).toContain("admin yang memutuskan");
	});
});
