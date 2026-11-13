import { t } from "@lingui/core/macro";

/**
 * The server writes every page's canonical link, hreflang alternates, social cards and site-wide structured data into
 * the HTML it sends (apps/server/src/static/web.ts), so crawlers that never run JavaScript see them. Routes only set
 * what changes as the visitor navigates: the title, the description and, where needed, `noindex`.
 */

const appName = "PortoFit";

export const createNoindexFollowMeta = () => ({ name: "robots", content: "noindex, follow" });

/** JSON for an inline `application/ld+json` script, escaped so no string in it can close the script early. */
export const serializeJsonLd = (data: Record<string, unknown>) =>
	JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => {
		switch (character) {
			case "<":
				return "\\u003C";
			case ">":
				return "\\u003E";
			case "&":
				return "\\u0026";
			case "\u2028":
				return "\\u2028";
			case "\u2029":
				return "\\u2029";
			default:
				return character;
		}
	});

/** The homepage's title and description in the active locale. The prerendered page and the route share them. */
export const getHomepageMeta = () => ({
	title: `${appName} — ${t`Job preparation from resume to interview`}`,
	description: t`PortoFit prepares your job application in one flow: build a resume, check how systems read it, match it to a job, then practise interviews. Start free, no ads.`,
});

/** The ATS checker's title and description in the active locale. The prerendered page and the route share them. */
export const getAtsCheckerMeta = () => ({
	title: `${t`Free ATS resume checker`} — ${appName}`,
	// Keep under ~120 characters so Google's mobile SERP snippet is not truncated at 3 lines.
	description: t`Check whether software can read your resume PDF. Runs entirely in your browser, so your file is never uploaded.`,
});

/** The pricing page's title and description in the active locale. */
export const getPricingMeta = () => ({
	title: `${t`Pricing`} — ${appName}`,
	description: t`PortoFit pricing: free ATS checks, Rp5,000 per application for a tailored resume and cover letter, Rp10,000 per interview practice session. Pay by QRIS, verified manually.`,
});
