export type PracticeQuestion = { text: string; origin: "simulated" | "recalled" };

/** Drops repeated question text while keeping the first occurrence and its source order. */
export function dedupeQuestions(items: PracticeQuestion[]): PracticeQuestion[] {
	const seen = new Set<string>();

	return items.filter((item) => {
		const key = item.text.trim().replace(/\s+/g, " ").toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
