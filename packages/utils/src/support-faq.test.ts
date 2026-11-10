import { describe, expect, it } from "vitest";
import { faqByTopic, SUPPORT_FAQ } from "./support-faq";

describe("SUPPORT_FAQ", () => {
	it("punya minimal delapan pertanyaan refund", () => {
		expect(faqByTopic("refund").length).toBeGreaterThanOrEqual(8);
	});

	it("tidak menulis nominal rupiah di jawaban mana pun", () => {
		for (const item of SUPPORT_FAQ) expect(item.answer).not.toMatch(/Rp\s?\d/);
	});

	it("tidak memakai titik koma atau tanda hubung di teks yang tampil", () => {
		for (const item of SUPPORT_FAQ) {
			const text = `${item.question} ${item.answer}`;
			expect(text).not.toMatch(/[;—–]/);
			expect(text).not.toMatch(/[A-Za-z]+-[A-Za-z]+/);
		}
	});

	it("setiap id unik", () => {
		expect(new Set(SUPPORT_FAQ.map((item) => item.id)).size).toBe(SUPPORT_FAQ.length);
	});
});
