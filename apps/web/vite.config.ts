import type { ProxyOptions } from "vite";
import { readFileSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lingui } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootPackageJsonPath = new URL("../../package.json", import.meta.url);
const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf-8")) as { version: string | undefined };
const appVersion = JSON.stringify(rootPackageJson.version ?? "0.0.0");
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const webRoot = fileURLToPath(new URL(".", import.meta.url));
const prerenderBundleDir = `${webRoot}node_modules/.prerender`;
// Outside dist/, so the static server and the CDN never serve these pages at their own addresses.
const prerenderOutDir = `${webRoot}dist-prerender`;

const escapeHtml = (value: string) =>
	value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/**
 * The faces the app shell paints with, so the browser can start them beside the render-blocking stylesheet instead of
 * after it parses. Worded as filename prefixes because the build adds a content hash. Measured on the live site: the
 * font requests used to start ~700 ms after the HTML, because `@font-face` is only discovered once the CSS arrives.
 *
 * The italic Newsreader is not here: it is the landing page's headline face, and the dashboard and builder never paint
 * it. Marketing pages add it themselves (`marketingFontPrefixes`), so every signed-in page is spared 147 kB.
 */
const criticalFontPrefixes = ["hanken-grotesk-latin-wght-normal-", "newsreader-latin-opsz-normal-"];

/** The marketing pages' faces on top of the shell's: the italic Newsreader the landing headline sets. */
const marketingFontPrefixes = [...criticalFontPrefixes, "newsreader-latin-opsz-italic-"];

async function preloadFonts(html: string, prefixes: readonly string[]) {
	const fonts = await readdir(`${webRoot}dist/assets`);
	const links = prefixes
		.map((prefix) => fonts.find((file) => file.startsWith(prefix) && file.endsWith(".woff2")))
		.filter((file) => file !== undefined)
		.map(
			(file) =>
				`<link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin fetchpriority="high">`,
		)
		.join("\n		");

	return html.replace("</head>", () => `	${links}\n	</head>`);
}

/**
 * Writes dist-prerender/<page>/<locale>.html: the built index.html with the page rendered into #app, in that locale's
 * language, direction, title and description. The server sends them for the marketing pages (apps/server/src/static/web.ts).
 */
async function prerenderPages() {
	type PrerenderModule = typeof import("./src/features/homepage/prerender");
	const { locales, prerenderedPages, renderPage }: PrerenderModule = await import(
		pathToFileURL(`${prerenderBundleDir}/prerender.js`).href
	);
	const rawShell = await readFile(`${webRoot}dist/index.html`, "utf8");
	const shell = await preloadFonts(rawShell, criticalFontPrefixes);
	// The shell itself is served for every page the build does not prerender, so it carries the preloads too.
	await writeFile(`${webRoot}dist/index.html`, shell);

	await rm(prerenderOutDir, { recursive: true, force: true });

	for (const name of prerenderedPages) {
		await mkdir(`${prerenderOutDir}/${name}`, { recursive: true });

		for (const locale of locales) {
			const page = await renderPage(name, locale);
			// Marketing pages set their headline in the italic face, so they preload it on top of the shell's two.
			const html = await preloadFonts(
				rawShell
					.replace(/<html lang="[^"]*">/, () => `<html lang="${locale}" dir="${page.dir}">`)
					.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(page.title)}</title>`)
					.replace(
						/<meta\s+name="description"[^>]*>/,
						() => `<meta name="description" content="${escapeHtml(page.description)}">`,
					)
					.replace('<div id="app"></div>', () => `<div id="app">${page.html}</div>`)
					// The page is readable before any script runs, so the stylesheet, fonts and images go first.
					.replaceAll('<link rel="modulepreload" ', '<link rel="modulepreload" fetchpriority="low" ')
					.replace('<script type="module" ', '<script type="module" fetchpriority="low" '),
				marketingFontPrefixes,
			);
			await writeFile(`${prerenderOutDir}/${name}/${locale}.html`, html);
		}
	}
}

// TanStack Router loads `route.tsx?tsr-split=…`. The native parser infers syntax from the filename,
// and the query hides `.tsx`, so JSX is parsed as JS.
const linguiPlugin = () =>
	lingui({ macroTransform: { parser: { syntax: "typescript", tsx: true, decorators: true } } });

const serverPaths = ["/api", "/mcp", "/uploads", "/.well-known", "/schema.json", "/openapi.json"] as const;

const serverProxy = serverPaths.reduce(
	(acc, path) => {
		acc[path] = {
			target: `http://localhost:${process.env.SERVER_PORT ?? "3001"}`,
			changeOrigin: true,
		};
		return acc;
	},
	{} as Record<string, ProxyOptions>,
);

export default defineConfig({
	envDir: workspaceRoot,

	resolve: {
		tsconfigPaths: true,
	},

	define: {
		__APP_VERSION__: appVersion,
	},

	// `vite build` builds the app, then the marketing pages' server entry, then prerenders the pages with it.
	builder: {
		buildApp: async (builder) => {
			const { client, ssr } = builder.environments;
			if (!client || !ssr) throw new Error("Missing client or SSR build environment");
			await builder.build(client);
			await builder.build(ssr);
			await prerenderPages();
		},
	},

	environments: {
		ssr: {
			build: {
				outDir: prerenderBundleDir,
				emptyOutDir: true,
				rolldownOptions: { input: "src/features/homepage/prerender.tsx" },
			},
		},
	},

	build: {
		chunkSizeWarningLimit: 10 * 1024, // 10 MB
		// TanStack's route tree makes every page a dynamic import. Vite would otherwise emit a modulepreload
		// for all 50+ route chunks, so opening the dashboard downloaded the builder, settings, auth and admin
		// pages too. Preload the shared vendor chunk only; the router fetches the route it is about to render.
		modulePreload: {
			resolveDependencies: (_filename, deps) => deps.filter((dep) => /\/vendor-[^/]+\.js$/.test(dep)),
		},
		rolldownOptions: {
			external: ["bcryptjs", "sharp", "@aws-sdk/client-s3", "ioredis", "linkedom"],
			// Every page loads the libraries the entry imports statically; one file instead of ~100 tiny ones saves
			// a round trip each on slow connections. App modules stay split to keep their execution order.
			output: { codeSplitting: { groups: [{ name: "vendor", test: /node_modules/, tags: ["$initial"] }] } },
		},
	},

	// The PDF worker renders templates with translated section titles, so it needs the catalogs and macros too.
	worker: {
		format: "es",
		plugins: () => [linguiPlugin()],
	},

	server: {
		host: true,
		strictPort: true,
		port: Number.parseInt(process.env.PORT ?? "3000", 10),
		proxy: serverProxy,
	},

	plugins: [
		{
			name: "cloudflare-rocket-loader-bootstrap",
			transformIndexHtml: {
				order: "post",
				handler: (html) =>
					html.replace(
						/<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="\/assets\/[^"]+")(?![^>]*\bdata-cfasync=)[^>]*>/,
						(script) => script.replace('src="', 'data-cfasync="false" src="'),
					),
			},
		},
		devtools(),
		tailwindcss(),
		tanstackRouter({
			target: "react",
			semicolons: true,
			quoteStyle: "double",
			autoCodeSplitting: true,
		}),
		viteReact(),
		linguiPlugin(),
		// Keep @babel/core on 7: under Babel 8, React Compiler 1.0 skips every function with a destructuring default
		// (guarded by src/react-compiler.test.ts).
		babel({ presets: [reactCompilerPreset()] }),
	],
});
