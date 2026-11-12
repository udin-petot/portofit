import type { Locale } from "@reactive-resume/utils/locale";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import { env } from "@reactive-resume/env/server";
import { templateSchema } from "@reactive-resume/schema/templates";
import { defaultLocale, getLocaleAlternates, isLocale, localizedUrl } from "@reactive-resume/utils/locale";
import { SUPPORT_FAQ } from "@reactive-resume/utils/support-faq";

function resolveWebDistPath() {
	const candidates = [
		// Source layout: apps/server/src/static/web.ts -> apps/web/dist
		fileURLToPath(new URL("../../../web/dist", import.meta.url)),
		// Bundled layout: apps/server/dist/index.mjs -> apps/web/dist
		fileURLToPath(new URL("../../web/dist", import.meta.url)),
	];
	const [fallback] = candidates;
	if (!fallback) throw new Error("Could not resolve web dist path");

	return candidates.find((candidate) => existsSync(candidate)) ?? fallback;
}

const staticRoot = resolveWebDistPath();
const indexHtmlPath = `${staticRoot}/index.html`;
// The marketing pages prerendered per locale by the web build (apps/web/vite.config.ts), as <page>/<locale>.html, kept
// beside dist/ so they're never served at an address of their own.
const prerenderRoot = `${staticRoot}-prerender`;
const noindexShellPrefixes = ["/auth", "/dashboard", "/admin", "/builder", "/agent", "/templates"];

// The dashboard is client-rendered behind auth, so the first paint would otherwise wait for the session,
// the documents query and the whole route chunk. Paint the page title immediately; React replaces it on
// mount. Kept to the exact title block so the swap does not move the rest of the page.
const dashboardBootShell = (html: string) =>
	html.replace(
		'<div id="app"></div>',
		() => `<div id="app"><style>
#dashboard-boot { width: 100%; max-width: 1180px; margin: 0 auto; padding: 32px 32px 0; }
#dashboard-boot h1 { margin: 0; color: var(--ink, #1c1a17); font-family: var(--font-display, ui-serif, Georgia, serif); font-size: 30px; font-weight: 500; line-height: 36px; }
@media (max-width: 640px) { #dashboard-boot { padding: 20px 16px 0; } #dashboard-boot h1 { font-size: 46px; line-height: 54px; } }
</style><main id="main-content"><div id="dashboard-boot"><h1>Documents</h1></div></main></div>`,
	);
/**
 * Marketing pages the SPA owns that search engines should index.
 *
 * Without an entry here the fallback below returns 404 for the path in production — the dev Vite
 * server serves the shell for anything, so this failure only ever shows up once deployed.
 */
const indexableAppPaths = new Set(["/ats-checker", "/bantuan", "/harga", "/syarat", "/privasi", "/refund", "/lisensi"]);

/**
 * Addresses people and crawlers guess, and the upstream documentation uses. They used to render an
 * empty shell with a 200, which reads as a broken page. Send them to the real document instead.
 */
const legalPathRedirects: Record<string, string> = {
	"/legal": "/syarat",
	"/legal/terms": "/syarat",
	"/legal/privacy": "/privasi",
	"/legal/license": "/lisensi",
	"/terms": "/syarat",
	"/privacy": "/privasi",
	"/license": "/lisensi",
};
const reservedPublicResumeSegments = new Set([
	"api",
	"mcp",
	".well-known",
	"uploads",
	"auth",
	"dashboard",
	"admin",
	"builder",
	"agent",
	"templates",
	"ats-checker",
]);

function isAssetPath(pathname: string): boolean {
	return pathname.split("/").pop()?.includes(".") ?? false;
}

function getPathSegments(pathname: string) {
	return pathname.split("/").filter(Boolean);
}

function isNoindexShellPath(pathname: string): boolean {
	return noindexShellPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicResumePath(pathname: string): boolean {
	const segments = getPathSegments(pathname);
	const [firstSegment] = segments;

	return segments.length === 2 && firstSegment !== undefined && !reservedPublicResumeSegments.has(firstSegment);
}

const BASE_SECURITY_HEADERS = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	// `wasm-unsafe-eval` lets the PDF engine (Forme, WebAssembly) start in the browser.
	"Content-Security-Policy-Report-Only":
		"default-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
};

const githubUrl = "https://github.com/udin-petot/portofit";
// Fallback copy for a build without prerendered pages; a prerendered page carries its own locale's title and
// description, and the social cards reuse them.
const ROOT_TITLE = "PortoFit — Job preparation from CV to interview";
const ROOT_DESCRIPTION =
	"PortoFit prepares your job application in one flow: build a CV, match it to a job, then practise interviews. Start free, no ads.";
const ATS_CHECKER_TITLE = "Free ATS resume checker — PortoFit";
const ATS_CHECKER_DESCRIPTION =
	"Check whether software can read your resume PDF. Runs entirely in your browser, so your file is never uploaded.";
const PRICING_TITLE = "Pricing — PortoFit";
const PRICING_DESCRIPTION =
	"Free ATS checks, Rp5,000 per application for a tailored CV and cover letter, Rp10,000 per interview practice session. Pay by QRIS, verified manually.";
const TERMS_TITLE = "Syarat Layanan PortoFit";
const TERMS_DESCRIPTION =
	"Aturan pemakaian PortoFit: akun, konten, kredit dan pembayaran, batas pemakaian AI, serta tanggung jawab pengguna.";
const PRIVACY_TITLE = "Kebijakan Privasi PortoFit";
const PRIVACY_DESCRIPTION =
	"Data apa yang dikumpulkan PortoFit, untuk apa, siapa yang memproses, berapa lama disimpan, dan cara meminta akses atau penghapusan.";
const REFUND_TITLE = "Kebijakan Pengembalian Dana PortoFit";
const REFUND_DESCRIPTION =
	"Kapan kredit PortoFit dapat dikembalikan, kapan tidak, dan cara mengajukan pengembalian dana lewat WhatsApp.";
const SUPPORT_TITLE = "Bantuan PortoFit";
const SUPPORT_DESCRIPTION =
	"Pertanyaan umum soal pembayaran, kredit, dan pengembalian dana PortoFit, plus jalan menghubungi admin lewat WhatsApp.";
const LICENSE_TITLE = "Lisensi MIT PortoFit";
const LICENSE_DESCRIPTION =
	"Lisensi MIT yang berlaku untuk PortoFit, proyek Reactive Resume yang menjadi fondasinya, dan atribusi yang diwajibkan keduanya.";

type StructuredData = Record<string, unknown>;

/** Who makes PortoFit, referenced by id from every page's structured data. */
function organization(origin: string): StructuredData {
	return {
		"@type": "Organization",
		"@id": `${origin}/#organization`,
		name: "PortoFit",
		url: `${origin}/`,
		logo: { "@type": "ImageObject", url: `${origin}/pwa-512x512.png`, width: 512, height: 512 },
		sameAs: [githubUrl],
	};
}

function homepageStructuredData(origin: string): StructuredData {
	const rootUrl = `${origin}/`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			organization(origin),
			{
				"@type": "WebSite",
				"@id": `${origin}/#website`,
				name: "PortoFit",
				url: rootUrl,
				publisher: { "@id": `${origin}/#organization` },
			},
			{
				"@type": ["SoftwareApplication", "WebApplication"],
				name: "PortoFit",
				url: rootUrl,
				description: ROOT_DESCRIPTION,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Web",
				isAccessibleForFree: true,
				offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
				license: `${githubUrl}/blob/main/LICENSE`,
				codeRepository: githubUrl,
				publisher: { "@id": `${origin}/#organization` },
				featureList: [
					"Resume editor with a live page preview",
					`${templateSchema.options.length} templates`,
					"PDF, Word (DOCX), Markdown, and JSON export",
					"Import from PDF, LinkedIn, JSON Resume, and Word",
					"ATS readability checker",
					"Public or password-protected share links",
					"Cover letters and a job application tracker",
					"AI assistant for writing, job matching, and interview practice",
					"Self-hosting with Docker",
				],
			},
		],
	};
}

function supportStructuredData(origin: string): StructuredData {
	const url = `${origin}/bantuan`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			organization(origin),
			{
				"@type": "FAQPage",
				"@id": `${url}#faq`,
				url,
				name: "Pertanyaan yang sering muncul",
				inLanguage: "id-ID",
				mainEntity: SUPPORT_FAQ.map((item) => ({
					"@type": "Question",
					name: item.question,
					acceptedAnswer: { "@type": "Answer", text: item.answer },
				})),
			},
		],
	};
}

function atsCheckerStructuredData(origin: string): StructuredData {
	return {
		"@context": "https://schema.org",
		"@graph": [
			organization(origin),
			{
				"@type": "WebApplication",
				name: "Pemeriksa resume ATS",
				url: `${origin}/ats-checker`,
				description: ATS_CHECKER_DESCRIPTION,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Web",
				isAccessibleForFree: true,
				offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
				isPartOf: { "@type": "WebSite", "@id": `${origin}/#website`, name: "PortoFit", url: `${origin}/` },
				provider: { "@id": `${origin}/#organization` },
			},
		],
	};
}

type PageSeoOptions = {
	/** The page's plain address: the canonical for the default locale, and the base of its hreflang alternates. */
	canonicalUrl: string;
	locale: Locale;
	/** A `?locale=` request is canonical for its own language. */
	requested: boolean;
	/** Already HTML-escaped, as the page's own <title> and description are. */
	title: string;
	description: string;
	imageUrl: string;
	structuredData: StructuredData;
};

function createPageSeoMarkup(options: PageSeoOptions) {
	const pageUrl = options.requested ? localizedUrl(options.canonicalUrl, options.locale) : options.canonicalUrl;
	const alternates = getLocaleAlternates(options.canonicalUrl)
		.map(({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${escapeAttribute(href)}">`)
		.join("");

	return `
		<link rel="canonical" href="${escapeAttribute(pageUrl)}">
		${alternates}
		<meta property="og:type" content="website">
		<meta property="og:site_name" content="PortoFit">
		<meta property="og:locale" content="${options.locale.replace("-", "_")}">
		<meta property="og:title" content="${options.title}">
		<meta property="og:description" content="${options.description}">
		<meta property="og:url" content="${escapeAttribute(pageUrl)}">
		<meta property="og:image" content="${options.imageUrl}">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:title" content="${options.title}">
		<meta name="twitter:description" content="${options.description}">
		<meta name="twitter:image" content="${options.imageUrl}">
		<script type="application/ld+json">${JSON.stringify(options.structuredData)}</script>
	`;
}

/** The title and description a page was built with, still HTML-escaped. */
function readPageMeta(html: string, fallback: { title: string; description: string }) {
	return {
		title: html.match(/<title>([^<]*)<\/title>/)?.[1] ?? fallback.title,
		description: html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? fallback.description,
	};
}

// Resume names, headlines, and summaries are user-authored, so they must never reach the served
// HTML unescaped.
const escapeAttribute = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

async function createPublicResumeSeoMarkup(pathname: string, origin: string) {
	const [username, slug] = getPathSegments(pathname);
	if (!username || !slug) return null;

	// A card render must never take down the page: any lookup failure falls back to the plain shell.
	const meta = await import("@reactive-resume/api/features/resume/social-meta")
		.then((module) => module.getPublicResumeSocialMeta({ username, slug }))
		.catch(() => null);
	if (!meta) return null;

	const canonicalUrl = `${origin}/${username}/${slug}`;
	const imageUrl = `${origin}/opengraph/banner.jpg`;
	const pageTitle = escapeAttribute(`${meta.name} - PortoFit`);
	const title = escapeAttribute(meta.title);
	const description = escapeAttribute(meta.description);

	return {
		pageTitle,
		description,
		markup: `
		<link rel="canonical" href="${canonicalUrl}">
		<meta property="og:type" content="profile">
		<meta property="og:site_name" content="PortoFit">
		<meta property="og:title" content="${title}">
		<meta property="og:description" content="${description}">
		<meta property="og:url" content="${canonicalUrl}">
		<meta property="og:image" content="${imageUrl}">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:title" content="${title}">
		<meta name="twitter:description" content="${description}">
		<meta name="twitter:image" content="${imageUrl}">
	`,
	};
}

export const serveWebDistStatic = env.CLOUDFLARE
	? undefined
	: serveStatic({
			root: staticRoot,
			onFound: (_path, context) => {
				// Vite fingerprints everything under /assets, so a file there never changes.
				if (context.req.path.startsWith("/assets/") || /^\/videos\/.*-v\d+\.(?:mp4|webp)$/.test(context.req.path)) {
					context.header("Cache-Control", "public, max-age=31536000, immutable");
					return;
				}

				// Everything else keeps a stable path, so a replaced logo, icon or screenshot must
				// revalidate instead of being pinned by heuristic freshness after a rebrand.
				context.header("Cache-Control", "public, max-age=0, must-revalidate");
			},
		});

function getFallbackResponseHeaders(pathname: string) {
	if (pathname === "/" && env.ROOT_RESUME_ID) {
		return {
			"Content-Type": "text/html; charset=UTF-8",
			"X-Robots-Tag": "noindex, follow",
			"Cache-Control": "private, no-store",
			...BASE_SECURITY_HEADERS,
		};
	}
	// A shell that is cached by heuristic freshness keeps pointing at the previous build's hashed assets, which is
	// how a phone ends up showing an interface weeks after a deploy. Every HTML answer revalidates.
	if (pathname === "/" || indexableAppPaths.has(pathname)) {
		return { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-cache", ...BASE_SECURITY_HEADERS };
	}
	if (isNoindexShellPath(pathname) || isPublicResumePath(pathname)) {
		return {
			"Content-Type": "text/html; charset=UTF-8",
			"X-Robots-Tag": "noindex, follow",
			"Cache-Control": "no-cache",
			...BASE_SECURITY_HEADERS,
		};
	}

	return null;
}

/**
 * A prerendered page's language: a `?locale=` address first (its hreflang alternates), then the visitor's saved
 * choice, in the order the app reads them (apps/web/src/libs/locale.ts).
 */
function getPageLocale(request: Request) {
	const requested = new URL(request.url).searchParams.get("locale");
	if (isLocale(requested)) return { locale: requested, requested: true };

	const saved = request.headers.get("cookie")?.match(/(?:^|;\s*)locale=([^;]*)/)?.[1] ?? "";
	return { locale: isLocale(saved) ? saved : defaultLocale, requested: false };
}

function notFoundResponse(options: { head?: boolean; noindex?: boolean } = {}) {
	const headers = new Headers({ "Content-Type": "text/plain; charset=UTF-8" });
	if (options.noindex) headers.set("X-Robots-Tag", "noindex, nofollow");

	return new Response(options.head ? null : "Not Found", {
		status: 404,
		headers,
	});
}

const withMeta = (html: string, meta: { title: string; description: string }) =>
	html
		.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
		.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${meta.description}">`);

/** The indexable pages the web build prerenders, by path. */
const prerenderedPages: Record<
	string,
	{
		name: string;
		meta: { title: string; description: string };
		image: string;
		structuredData: (origin: string) => StructuredData;
		/** The page when the build has no prerendered copy: the app shell, titled for the page. */
		fallback: (shell: string) => string;
	}
> = {
	"/": {
		name: "home",
		meta: { title: ROOT_TITLE, description: ROOT_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: homepageStructuredData,
		fallback: (shell) => shell,
	},
	"/ats-checker": {
		name: "ats-checker",
		meta: { title: ATS_CHECKER_TITLE, description: ATS_CHECKER_DESCRIPTION },
		image: "/opengraph/ats-checker.png",
		structuredData: atsCheckerStructuredData,
		fallback: (shell) => withMeta(shell, { title: ATS_CHECKER_TITLE, description: ATS_CHECKER_DESCRIPTION }),
	},
	// No prerendered file yet: the server serves the app shell with the page's title and description.
	"/harga": {
		name: "harga",
		meta: { title: PRICING_TITLE, description: PRICING_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: homepageStructuredData,
		fallback: (shell) => withMeta(shell, { title: PRICING_TITLE, description: PRICING_DESCRIPTION }),
	},
	"/syarat": {
		name: "syarat",
		meta: { title: TERMS_TITLE, description: TERMS_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: homepageStructuredData,
		fallback: (shell) => withMeta(shell, { title: TERMS_TITLE, description: TERMS_DESCRIPTION }),
	},
	"/privasi": {
		name: "privasi",
		meta: { title: PRIVACY_TITLE, description: PRIVACY_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: homepageStructuredData,
		fallback: (shell) => withMeta(shell, { title: PRIVACY_TITLE, description: PRIVACY_DESCRIPTION }),
	},
	"/refund": {
		name: "refund",
		meta: { title: REFUND_TITLE, description: REFUND_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: homepageStructuredData,
		fallback: (shell) => withMeta(shell, { title: REFUND_TITLE, description: REFUND_DESCRIPTION }),
	},
	"/bantuan": {
		name: "bantuan",
		meta: { title: SUPPORT_TITLE, description: SUPPORT_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: supportStructuredData,
		fallback: (shell) => withMeta(shell, { title: SUPPORT_TITLE, description: SUPPORT_DESCRIPTION }),
	},
	"/lisensi": {
		name: "lisensi",
		meta: { title: LICENSE_TITLE, description: LICENSE_DESCRIPTION },
		image: "/opengraph/banner.jpg",
		structuredData: homepageStructuredData,
		fallback: (shell) => withMeta(shell, { title: LICENSE_TITLE, description: LICENSE_DESCRIPTION }),
	},
};

// ponytail: GET and HEAD share the same routing logic; method determines body presence
export type ReadWebFile = (path: string) => Promise<string>;

export async function handleWebApp(request: Request, readFile: ReadWebFile = (path) => fs.readFile(path, "utf-8")) {
	const isHead = request.method === "HEAD";
	const pathname = new URL(request.url).pathname;

	const redirectTo = legalPathRedirects[pathname];
	if (redirectTo) {
		return new Response(null, {
			status: 301,
			headers: { Location: redirectTo, ...BASE_SECURITY_HEADERS },
		});
	}

	if (!isNoindexShellPath(pathname) && isAssetPath(pathname)) {
		return new Response(isHead ? null : "Not Found", { status: 404 });
	}

	const headers = getFallbackResponseHeaders(pathname);
	if (!headers) return notFoundResponse({ head: isHead, noindex: true });

	if (isHead) return new Response(null, { status: 200, headers });

	const html = await readFile(indexHtmlPath);

	if (pathname === "/" && env.ROOT_RESUME_ID) {
		const canonicalUrl = new URL("/", env.APP_URL).toString();
		// Root configuration never discloses a target in the HTML shell. The public API
		// gates data and browser metadata; shell requests must not count extra views.
		const shell = html
			.replace(/<title>[^<]*<\/title>/, "<title>PortoFit</title>")
			.replace(/<meta\s+name="description"[^>]*>/, '<meta name="description" content="">');
		const markup = `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" data-root-resume-shell><meta name="robots" content="noindex, follow" data-root-resume-shell>`;
		return new Response(
			shell.replace("</head>", () => `${markup}</head>`),
			{ headers },
		);
	}

	const prerendered = prerenderedPages[pathname];
	if (prerendered) {
		const { locale, requested } = getPageLocale(request);
		const origin = new URL(env.APP_URL).origin;
		// Without a prerendered page (a build that skipped it), the app renders the page in the browser.
		const page = await readFile(`${prerenderRoot}/${prerendered.name}/${locale}.html`).catch(() =>
			prerendered.fallback(html),
		);
		const markup = createPageSeoMarkup({
			canonicalUrl: new URL(pathname, env.APP_URL).toString(),
			locale,
			requested,
			...readPageMeta(page, prerendered.meta),
			imageUrl: `${origin}${prerendered.image}`,
			structuredData: prerendered.structuredData(origin),
		});

		// The saved locale changes what this address shows, so caches have to key on the cookie.
		return new Response(
			page.replace("</head>", () => `${markup}</head>`),
			{ headers: { ...headers, Vary: "Cookie" } },
		);
	}

	if (isPublicResumePath(pathname)) {
		const resumeSeo = await createPublicResumeSeoMarkup(pathname, new URL(env.APP_URL).origin);
		if (resumeSeo) {
			// The shell's generic title/description are replaced so shares and previews show the resume,
			// not the marketing copy baked into index.html. Function replacers keep `$&`, `$'` etc. in user text literal.
			const withTitle = html
				.replace(/<title>[^<]*<\/title>/, () => `<title>${resumeSeo.pageTitle}</title>`)
				.replace(
					/<meta\s+name="description"[^>]*>/,
					() => `<meta name="description" content="${resumeSeo.description}">`,
				);

			return new Response(
				withTitle.replace("</head>", () => `${resumeSeo.markup}</head>`),
				{ headers },
			);
		}
	}

	if (pathname === "/dashboard" || pathname === "/dashboard/") {
		return new Response(dashboardBootShell(html), { headers });
	}

	return new Response(html, { headers });
}
