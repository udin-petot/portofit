import { SUPPORT_FAQ } from "@reactive-resume/utils/support-faq";
import { supportSystemPromptTemplate } from "@reactive-resume/ai/prompts";

type SupportPrice = { code: string; priceIdr: number };

type BuildSupportPromptInput = {
	prices: SupportPrice[];
	userAmounts: string[];
};

/**
 * Prompt CS dibentuk dari FAQ yang sama dengan halaman bantuan, ditambah harga yang dibaca dari basis data
 * supaya angkanya tidak pernah berbeda dengan halaman Harga.
 */
export function buildSupportPrompt(input: BuildSupportPromptInput): string {
	const faq = SUPPORT_FAQ.map((item) => `T: ${item.question}\nJ: ${item.answer}`).join("\n\n");
	const prices = input.prices.length
		? input.prices.map((price) => `${price.code}: Rp${price.priceIdr}`).join("\n")
		: "Tidak ada paket aktif.";
	const amounts = input.userAmounts.length ? input.userAmounts.join(", ") : "Tidak ada.";

	return supportSystemPromptTemplate
		.replace("{{FAQ}}", faq)
		.replace("{{PRICES}}", prices)
		.replace("{{USER_AMOUNTS}}", amounts);
}
