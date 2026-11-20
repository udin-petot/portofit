import type { ProviderRequest } from "./contracts";
import z from "zod";
import { MAX_CONTENT_CHARS, MAX_PAGE_BYTES, WebAccessError } from "./contracts";
import { normalizeSearch, parseResponse, postJson } from "./transport";

const searchSchema = z.object({ results: z.array(z.unknown()).max(100) });
const searchItemSchema = z.object({
	url: z.string(),
	title: z.string(),
	highlights: z.array(z.string()).optional(),
	text: z.string().optional(),
});
export async function searchExa(query: string, { connection, signal }: ProviderRequest) {
	const response = parseResponse(
		searchSchema,
		await postJson(
			"https://api.exa.ai/search",
			{
				authorization: `Bearer ${connection.apiKey ?? ""}`,
			},
			{ query, numResults: 5, type: "auto", contents: { highlights: true } },
			signal,
		),
	);
	// Highlights keep the search response small while giving the coach enough text to choose a page to read.
	return normalizeSearch(
		response.results.flatMap((value) => {
			const item = searchItemSchema.safeParse(value);
			if (!item.success) return [];
			const snippet = item.data.highlights?.filter(Boolean).join("\n\n") || item.data.text;
			return [
				{
					url: item.data.url,
					title: item.data.title,
					...(snippet ? { snippet } : {}),
				},
			];
		}),
	);
}

const contentsSchema = z.object({
	results: z
		.array(
			z.object({
				url: z.string(),
				text: z.string().max(MAX_PAGE_BYTES).optional(),
				crawlDate: z.iso.datetime({ offset: true }).optional(),
			}),
		)
		.max(100),
	statuses: z.array(z.object({ id: z.string(), status: z.string() })).optional(),
});
export async function readExa(url: string, { connection, signal }: ProviderRequest) {
	const response = parseResponse(
		contentsSchema,
		await postJson(
			"https://api.exa.ai/contents",
			{
				authorization: `Bearer ${connection.apiKey ?? ""}`,
			},
			{
				urls: [url],
				text: { maxCharacters: MAX_CONTENT_CHARS + 1 },
				maxAgeHours: 0,
				livecrawlTimeout: 14_000,
			},
			signal,
		),
	);
	if (response.statuses?.some((status) => status.status !== "success")) {
		throw new WebAccessError("unreachable");
	}
	const result = response.results[0];
	if (!result?.text) throw new WebAccessError("empty");
	return {
		content: result.text,
		format: "text" as const,
		resolvedUrl: result.url,
		...(result.crawlDate ? { providerFetchedAt: result.crawlDate } : {}),
	};
}
