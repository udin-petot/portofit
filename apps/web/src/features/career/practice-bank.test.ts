import { describe, expect, it } from "vitest";
import { BANK_CATEGORIES, BANK_COUNT, PRACTICE_BANK, bankCategoryLabel, bankLevelLabel, practiceBankFor } from "./practice-bank";
import { PRACTICE_BANK_EN } from "./practice-bank-english";

describe("practice bank", () => {
	it("has unique ids and covers every category", () => {
		const ids = PRACTICE_BANK.map((question) => question.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(BANK_COUNT).toBe(PRACTICE_BANK.length);

		for (const category of BANK_CATEGORIES) {
			expect(PRACTICE_BANK.some((question) => question.category === category)).toBe(true);
		}
	});

	it("keeps every question usable by the practice session", () => {
		for (const question of PRACTICE_BANK) {
			// practiceDraftSchema caps the question at 500 characters.
			expect(question.text.length).toBeGreaterThan(20);
			expect(question.text.length).toBeLessThanOrEqual(500);
			expect(question.why.length).toBeGreaterThan(10);
			expect(question.rubric.length).toBeGreaterThanOrEqual(3);
			expect(question.followUps.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("keeps every English entry as complete as the Indonesian one", () => {
		for (const question of PRACTICE_BANK) {
			expect(PRACTICE_BANK_EN[question.id], question.id).toBeDefined();
			expect(PRACTICE_BANK_EN[question.id]?.rubric.length, question.id).toBe(question.rubric.length);
			expect(PRACTICE_BANK_EN[question.id]?.followUps.length, question.id).toBe(question.followUps.length);
		}
	});

	it("returns copy in the reader's language without changing the canonical category", () => {
		expect(practiceBankFor("id-ID").find((question) => question.id === "umum-proyek-bangga")?.text).toContain(
			"Ceritakan proyek",
		);
		expect(practiceBankFor("en-US").find((question) => question.id === "umum-proyek-bangga")?.text).toContain(
			"Tell me about the project",
		);
		expect(bankCategoryLabel("Umum & perilaku", "id-ID")).toBe("Umum & perilaku");
		expect(bankCategoryLabel("Umum & perilaku", "en-US")).toBe("General & behavioural");
		expect(bankLevelLabel("Lanjut", "en-US")).toBe("Advanced");
	});
});
