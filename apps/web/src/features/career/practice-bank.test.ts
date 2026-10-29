import { describe, expect, it } from "vitest";
import { BANK_CATEGORIES, BANK_COUNT, PRACTICE_BANK } from "./practice-bank";

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
});
