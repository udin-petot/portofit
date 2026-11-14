import { describe, expect, it } from "vitest";
import { dedupeQuestions } from "./questions";

describe("dedupeQuestions", () => {
	it("drops a question repeated across briefing and debrief", () => {
		const result = dedupeQuestions([
			{ text: "Ceritakan proyek yang paling kamu banggakan", origin: "simulated" },
			{ text: "  ceritakan   proyek yang paling kamu banggakan ", origin: "recalled" },
			{ text: "Apa yang kamu lakukan saat konflik?", origin: "recalled" },
		]);

		expect(result).toEqual([
			{ text: "Ceritakan proyek yang paling kamu banggakan", origin: "simulated" },
			{ text: "Apa yang kamu lakukan saat konflik?", origin: "recalled" },
		]);
	});

	it("keeps the first occurrence and its source", () => {
		const result = dedupeQuestions([
			{ text: "Pertanyaan A", origin: "simulated" },
			{ text: "Pertanyaan B", origin: "simulated" },
			{ text: "Pertanyaan A", origin: "recalled" },
		]);

		expect(result).toEqual([
			{ text: "Pertanyaan A", origin: "simulated" },
			{ text: "Pertanyaan B", origin: "simulated" },
		]);
	});

	it("keeps questions that only look similar", () => {
		const result = dedupeQuestions([
			{ text: "Kenapa kamu ingin bekerja di sini?", origin: "simulated" },
			{ text: "Kenapa kamu ingin bekerja di sana?", origin: "simulated" },
		]);

		expect(result).toHaveLength(2);
	});
});
