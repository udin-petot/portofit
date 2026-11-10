import type { MessageDescriptor } from "@lingui/core";
import type { Template } from "@reactive-resume/schema/templates";
import { msg } from "@lingui/core/macro";

export type TemplateStyle = "editorial" | "swiss" | "studio" | "compact" | "technical" | "academic" | "humanist";

export type TemplateMetadata = {
	name: string;
	description: MessageDescriptor;
	imageUrl: string;
	tags: string[];
	style?: TemplateStyle;
};

export const templates = {
	swiss: {
		name: "Swiss",
		description: msg`One column with a strict grid, right-aligned dates and no icons. A calm, modern choice for tech, product and consulting roles.`,
		imageUrl: "/templates/jpg/swiss.jpg",
		tags: ["One column", "ATS friendly", "Modern", "Grid", "Tech", "Consulting"],
		style: "swiss",
	},
	compact: {
		name: "Compact",
		description: msg`One column with compact spacing and standard headings. Built for fresh graduates applying through job portals and applicant tracking systems.`,
		imageUrl: "/templates/jpg/compact.jpg",
		tags: ["One column", "ATS friendly", "Compact", "Fresh graduate", "Job portal"],
		style: "compact",
	},
	rapi: {
		name: "Rapi",
		description: msg`Two columns with a narrow right rail behind a hairline and no rules between sections. Contact, skills and languages stay out of the way of the experience.`,
		imageUrl: "/templates/jpg/rapi.jpg",
		tags: ["Two columns", "Right sidebar", "Minimal", "Skills", "Consulting", "Tech"],
		style: "swiss",
	},
	bersih: {
		name: "Bersih",
		description: msg`One column with a plain rule over every section and right-aligned dates. The calmest, most ATS-safe layout here, built for job portals and large companies.`,
		imageUrl: "/templates/jpg/bersih.jpg",
		tags: ["One column", "ATS friendly", "Minimal", "Rule", "Job portal", "Large company"],
		style: "editorial",
	},
	studio: {
		name: "Studio",
		description: msg`Two columns with a soft neutral sidebar and a serif name. Visual without the heavy colour blocks, for design, creative and portfolio roles.`,
		imageUrl: "/templates/jpg/studio.jpg",
		tags: ["Two columns", "Creative", "Designer", "Portfolio", "Serif", "Soft sidebar"],
		style: "studio",
	},
	azurill: {
		name: "Azurill",
		description: msg`Two-column with a bold colored sidebar and skill bars; great for creative or tech roles where visual flair is welcome.`,
		imageUrl: "/templates/jpg/azurill.jpg",
		tags: ["Two-column", "Creative", "Tech", "Visual flair"],
	},
	bronzor: {
		name: "Bronzor",
		description: msg`Two-column, clean and professional with subtle section dividers; suits corporate, finance, or consulting positions.`,
		imageUrl: "/templates/jpg/bronzor.jpg",
		tags: ["Two-column", "Clean", "Professional", "Corporate", "Finance", "Consulting"],
	},
	chikorita: {
		name: "Chikorita",
		description: msg`Two-column with a soft header accent and circular profile photo; ideal for marketing, HR, or client-facing roles.`,
		imageUrl: "/templates/jpg/chikorita.jpg",
		tags: ["Two-column", "Soft accent", "Marketing", "HR", "Client-facing"],
	},
	ditgar: {
		name: "Ditgar",
		description: msg`Two-column with a dark teal sidebar and skills grid; modern feel for developers, data scientists, or technical PMs.`,
		imageUrl: "/templates/jpg/ditgar.jpg",
		tags: ["Two-column", "Modern", "Developer", "Data science", "Technical PM", "Dark sidebar"],
	},
	ditto: {
		name: "Ditto",
		description: msg`Two-column, minimal and text-dense with no decorative elements; perfect for traditional industries or ATS-heavy applications.`,
		imageUrl: "/templates/jpg/ditto.jpg",
		tags: ["Two-column", "ATS friendly", "Minimal", "Text-dense", "Traditional", "No decoration"],
	},
	gengar: {
		name: "Gengar",
		description: msg`Two-column with accent colors and clean typography; balanced choice for business analysts or operations roles.`,
		imageUrl: "/templates/jpg/gengar.jpg",
		tags: ["Two-column", "Accent colors", "Clean typography", "Business analyst", "Operations"],
	},
	glalie: {
		name: "Glalie",
		description: msg`Two-column, minimal with light gray sidebar and subtle icons; professional and understated for legal, finance, or executive roles.`,
		imageUrl: "/templates/jpg/glalie.jpg",
		tags: ["Two-column", "Minimal", "Professional", "Legal", "Finance", "Executive", "Understated"],
	},
	kakuna: {
		name: "Kakuna",
		description: msg`Single-column with a magenta left border accent; compact and efficient for entry-level or internship applications.`,
		imageUrl: "/templates/jpg/kakuna.jpg",
		tags: ["Single-column", "ATS friendly", "Compact", "Efficient", "Entry level", "Internship", "Magenta accent"],
	},
	lapras: {
		name: "Lapras",
		description: msg`Single-column; polished and serious for senior or enterprise-level positions.`,
		imageUrl: "/templates/jpg/lapras.jpg",
		tags: ["Single-column", "ATS friendly", "Polished", "Senior", "Enterprise"],
	},
	leafish: {
		name: "Leafish",
		description: msg`Two-column with a muted color sidebar; earthy and calm, suits sustainability, healthcare, or nonprofit sectors.`,
		imageUrl: "/templates/jpg/leafish.jpg",
		tags: ["Two-column", "Muted sidebar", "Earthy", "Calm", "Sustainability", "Healthcare", "Nonprofit"],
	},
	meowth: {
		name: "Meowth",
		description: msg`Single-column with an inline three-column entry header (position · organization · period); compact and ATS-friendly, well-suited for Asian resume conventions (CN/JP/KR).`,
		imageUrl: "/templates/jpg/meowth.jpg",
		tags: ["Single-column", "ATS friendly", "Inline header", "Compact", "Asian style", "CN/JP/KR"],
	},
	onyx: {
		name: "Onyx",
		description: msg`Single-column with a sidebar and clean grid layout; versatile for any professional or technical role.`,
		imageUrl: "/templates/jpg/onyx.jpg",
		tags: ["Single-column", "ATS friendly", "Sidebar", "Grid layout", "Versatile", "Professional", "Technical"],
	},
	persian: {
		name: "Persian",
		description: msg`Single-column Wall Street style with a centered header and ruled section headings.`,
		imageUrl: "/templates/jpg/persian.jpg",
		tags: ["Single-column", "ATS friendly", "Finance", "Consulting", "Traditional"],
	},
	pikachu: {
		name: "Pikachu",
		description: msg`Two-column with a left margin color; simple and approachable for creative, editorial, or junior roles.`,
		imageUrl: "/templates/jpg/pikachu.jpg",
		tags: ["Two-column", "Simple", "Creative", "Editorial", "Junior", "Accent colors"],
	},
	porygon: {
		name: "Porygon",
		description: msg`Single-column ruled form inspired by the Japanese rirekisho: a bordered header of field cells and every section as a table with a solid title bar; dense and fast to scan for engineering, operations, or applications in Japan.`,
		imageUrl: "/templates/jpg/porygon.jpg",
		tags: [
			"Single-column",
			"ATS friendly",
			"Ruled grid",
			"Dense",
			"Structured",
			"Engineering",
			"Operations",
			"Asian style",
		],
	},
	rhyhorn: {
		name: "Rhyhorn",
		description: msg`Single-column with a minimal top header and lots of whitespace; clean and modern for designers or content creators.`,
		imageUrl: "/templates/jpg/rhyhorn.jpg",
		tags: ["Single-column", "ATS friendly", "Minimal", "Clean", "Modern", "Designer", "Content creator", "Whitespace"],
	},
	scizor: {
		name: "Scizor",
		description: msg`Single-column with uppercase section headings and a primary-color top rule on every page; polished for executive, consulting, or startup resumes.`,
		imageUrl: "/templates/jpg/scizor.jpg",
		tags: ["Single-column", "ATS friendly", "Uppercase headings", "Executive", "Consulting", "Startup"],
	},
	smeargle: {
		name: "Smeargle",
		description: msg`Single-column set like a magazine feature: a large display name under an uppercase kicker and the summary as a larger standfirst; refined for writers, designers, and communications roles.`,
		imageUrl: "/templates/jpg/smeargle.jpg",
		tags: ["Single-column", "ATS friendly", "Editorial", "Magazine", "Serif", "Writer", "Designer", "Communications"],
	},
} as const satisfies Record<Template, TemplateMetadata>;
