import { t } from "@lingui/core/macro";
import { templateSchema } from "@reactive-resume/schema/templates";

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

/** The public template gallery's title and description. */
export const getTemplatesMeta = () => ({
	title: `Resume templates — ${appName}`,
	description: `All ${templateSchema.options.length} PortoFit resume templates in one place. Every one exports a text-based PDF that applicant tracking systems can read.`,
});

/** The help page's title and description. The page's content is Indonesian, so the copy does not follow the locale. */
export const getSupportMeta = () => ({
	title: `Bantuan ${appName}`,
	description:
		"Pertanyaan umum soal pembayaran, kredit, dan pengembalian dana PortoFit, plus jalan menghubungi admin lewat WhatsApp.",
});

/** The terms page's title and description. Indonesian with the page's content. */
export const getTermsMeta = () => ({
	title: `Syarat Layanan ${appName}`,
	description:
		"Aturan pemakaian PortoFit: akun, konten, kredit dan pembayaran, batas pemakaian AI, serta tanggung jawab pengguna.",
});

/** The privacy page's title and description. Indonesian with the page's content. */
export const getPrivacyMeta = () => ({
	title: `Kebijakan Privasi ${appName}`,
	description:
		"Data apa yang dikumpulkan PortoFit, untuk apa, siapa yang memproses, berapa lama disimpan, dan cara meminta akses atau penghapusan.",
});

/** The refund page's title and description. Indonesian with the page's content. */
export const getRefundMeta = () => ({
	title: `Kebijakan Pengembalian Dana ${appName}`,
	description:
		"Kapan kredit PortoFit dapat dikembalikan, kapan tidak, dan cara mengajukan pengembalian dana lewat WhatsApp.",
});

/** The license page's title and description. Indonesian with the page's content. */
export const getLicenseMeta = () => ({
	title: `Lisensi MIT ${appName}`,
	description:
		"Lisensi MIT yang berlaku untuk PortoFit, proyek Reactive Resume yang menjadi fondasinya, dan atribusi yang diwajibkan keduanya.",
});
