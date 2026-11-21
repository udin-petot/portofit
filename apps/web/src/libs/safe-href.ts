const SAFE_PROTOCOL = /^(?:https?:|mailto:|tel:)/i;

/**
 * A value that is safe to put in an `href`. Job postings, AI citations and saved attachments come from outside the
 * app, so a `javascript:` URL in one of them would run in the page when someone clicks it. Only the schemes the app
 * links to, and same-origin paths, pass.
 */
export function safeHref(value: string | null | undefined): string | undefined {
	const href = value?.trim();
	if (!href) return undefined;
	if (SAFE_PROTOCOL.test(href)) return href;
	if (href.startsWith("/") && !href.startsWith("//")) return href;
	return undefined;
}
