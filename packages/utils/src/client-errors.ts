const IGNORED_CLIENT_ERRORS = [/^ResizeObserver loop (?:limit exceeded|completed with undelivered notifications)\.?$/i];

// Crawlers run the page with scripts on, then abort the requests a browser would make. Their failures
// say nothing about real users, and one crawl can report an error on every route.
const CRAWLER_USER_AGENTS =
	/AhrefsBot|SemrushBot|MJ12bot|DotBot|Bytespider|PetalBot|GPTBot|CCBot|ClaudeBot|PerplexityBot|Amazonbot|YandexBot|bingbot|Googlebot|Applebot/i;

/** Whether the report comes from a crawler rather than a person's browser. */
export function isCrawlerUserAgent(userAgent: string | undefined): boolean {
	return typeof userAgent === "string" && CRAWLER_USER_AGENTS.test(userAgent);
}

/**
 * Browser warnings that carry no stack and no user-visible failure. Reporting them only
 * turns monitoring into noise, so the client and the server both drop them.
 */
export function isIgnorableClientError(message: string): boolean {
	const normalized = message.trim();
	return IGNORED_CLIENT_ERRORS.some((pattern) => pattern.test(normalized));
}
