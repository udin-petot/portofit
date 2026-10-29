import { env } from "@reactive-resume/env/server";
import { templateSchema } from "@reactive-resume/schema/templates";
import { getLocaleAlternates } from "@reactive-resume/utils/locale";

type StaticSeoOptions = {
	head?: boolean;
};

function appUrl() {
	return env.APP_URL.replace(/\/+$/, "");
}

function textResponse(body: string, options: StaticSeoOptions = {}) {
	return new Response(options.head ? null : body, {
		headers: { "Content-Type": "text/plain; charset=UTF-8" },
	});
}

export function handleRobots(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/rpc",
		"Disallow: /api/auth",
		"Disallow: /mcp",
		"Disallow: /.well-known",
		// Discovery documents meant for agents and API directories.
		"Allow: /.well-known/integrations.json",
		"Allow: /.well-known/api-catalog",
		"Allow: /.well-known/mcp/server-card.json",
		"Allow: /.well-known/agent-skills/",
		"",
		`Sitemap: ${baseUrl}/sitemap.xml`,
		"",
	].join("\n");

	return textResponse(body, options);
}

// The indexable pages; everything else is the signed-in app or a public resume, both served noindex.
const sitemapPaths = ["/", "/harga", "/ats-checker", "/syarat", "/privasi", "/refund"];

export function handleSitemap(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	// Each page lists its languages, so every `?locale=` address is discoverable without a sitemap entry of its own.
	const urls = sitemapPaths.map((path) => {
		const pageUrl = `${baseUrl}${path}`;
		const alternates = getLocaleAlternates(pageUrl).map(
			({ hreflang, href }) =>
				`    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href.replaceAll("&", "&amp;")}"/>`,
		);
		return ["  <url>", `    <loc>${pageUrl}</loc>`, ...alternates, "  </url>"].join("\n");
	});
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		"</urlset>",
		"",
	].join("\n");

	return new Response(options?.head ? null : body, {
		headers: { "Content-Type": "application/xml; charset=UTF-8" },
	});
}

export function handleLlms(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		"# PortoFit",
		"",
		`> PortoFit is a free and open-source resume builder. Write a resume in an editor beside a live page, pick one of ${templateSchema.options.length} templates, check that applicant tracking systems can read it, tailor it to a job posting, and share it at a public link or download it. No ads, no tracking, no paid tier; it is funded by donations and released under the MIT License.`,
		"",
		"## Product",
		"",
		`- [Homepage](${baseUrl}/): what PortoFit does, with answers to common questions.`,
		`- [ATS checker](${baseUrl}/ats-checker): a free tool that shows the text applicant tracking systems extract from a resume PDF and what to fix. It runs in the browser; the file is never uploaded.`,
		`- [Get started](${baseUrl}/dashboard): create an account and a first resume.`,
		"",
		"## Facts",
		"",
		"- Price: free, every feature. Optional donations through GitHub Sponsors and Open Collective.",
		"- Export: PDF, Word (DOCX), Markdown and JSON.",
		"- Import: PDF, LinkedIn data export, JSON Resume, PortoFit JSON; Word files with an AI provider.",
		"- Sharing: private by default; a public link or a password-protected link, changeable at any time.",
		"- AI: optional, with the user's own API key (OpenAI, Anthropic, Google Gemini, OpenRouter, Ollama and others). Nothing is sent to an AI service without one.",
		"- Also includes: cover letters, a job application tracker, version history, passkeys and two-factor authentication.",
		"- Languages: the interface is translated into more than 50 languages by volunteers on Crowdin.",
		"- Self-hosting: a Docker image, with PostgreSQL and local or S3-compatible storage.",
		"",
		"## Interfaces",
		"",
		`- [OpenAPI specification](${baseUrl}/openapi.json)`,
		`- [Resume JSON schema](${baseUrl}/schema.json)`,
		`- [MCP server](${baseUrl}/mcp): connect any MCP client with OAuth or an API key.`,
		`- [Agent skills](${baseUrl}/.well-known/agent-skills/index.json): eight job-search skills.`,
		`- [Integrations](${baseUrl}/.well-known/integrations.json): every API and MCP surface with its authentication.`,
		"",
		"## Source",
		"",
		"- [Source code on GitHub](https://github.com/udin-petot/portofit)",
		"",
	].join("\n");

	return textResponse(body, options);
}
