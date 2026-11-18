import z from "zod";

export const templateSchema = z.enum([
	"azurill",
	"bronzor",
	"chikorita",
	"ditgar",
	"ditto",
	"gengar",
	"glalie",
	"kakuna",
	"lapras",
	"leafish",
	"meowth",
	"onyx",
	"persian",
	"pikachu",
	"porygon",
	"rhyhorn",
	"scizor",
	"smeargle",
	"swiss",
	"compact",
	"studio",
	"bersih",
	"rapi",
	"timeline",
	"banner",
	"technical",
	"academic",
	"humanist",
]);

export type Template = z.infer<typeof templateSchema>;

/** How a template lays out the page. The single source for the gallery filters, the Check layout rule and DOCX. */
export type TemplateLayout = {
	/** Two-column templates print the sidebar as a column of its own; one-column templates read top to bottom. */
	columns: 1 | 2;
	/** Where the sidebar column sits by default. Null for one-column templates. */
	sidebarSide: "left" | "right" | null;
	/** Where the header sits: across the page, over the main column only, or in the sidebar. */
	headerPlacement: "full-width" | "main-only" | "sidebar-only";
	/** One reading order and plain text headings, which applicant tracking systems read cleanly. */
	atsSafe: boolean;
};

const oneColumn: TemplateLayout = { columns: 1, sidebarSide: null, headerPlacement: "full-width", atsSafe: true };

export const templateLayouts = {
	azurill: { columns: 2, sidebarSide: "left", headerPlacement: "full-width", atsSafe: false },
	// Bronzor prints sidebar sections as labelled rows inside one column.
	bronzor: oneColumn,
	chikorita: { columns: 2, sidebarSide: "right", headerPlacement: "main-only", atsSafe: false },
	ditgar: { columns: 2, sidebarSide: "left", headerPlacement: "sidebar-only", atsSafe: false },
	ditto: { columns: 2, sidebarSide: "left", headerPlacement: "full-width", atsSafe: false },
	gengar: { columns: 2, sidebarSide: "left", headerPlacement: "sidebar-only", atsSafe: false },
	glalie: { columns: 2, sidebarSide: "left", headerPlacement: "sidebar-only", atsSafe: false },
	kakuna: oneColumn,
	lapras: oneColumn,
	leafish: { columns: 2, sidebarSide: "right", headerPlacement: "full-width", atsSafe: false },
	meowth: oneColumn,
	onyx: oneColumn,
	persian: oneColumn,
	pikachu: { columns: 2, sidebarSide: "left", headerPlacement: "main-only", atsSafe: false },
	porygon: oneColumn,
	rhyhorn: oneColumn,
	scizor: oneColumn,
	smeargle: oneColumn,
	swiss: oneColumn,
	compact: oneColumn,
	studio: { columns: 2, sidebarSide: "left", headerPlacement: "main-only", atsSafe: false },
	// Bersih reads as one typed column with a rule over each section.
	bersih: oneColumn,
	// Rapi sets a narrow right column behind a hairline, with no rules between sections.
	rapi: { columns: 2, sidebarSide: "right", headerPlacement: "full-width", atsSafe: false },
	// Timeline prints experience on a dated rail with a dot per entry, in one reading order.
	timeline: oneColumn,
	// Banner opens with a full-width accent band and keeps the body in one plain column.
	banner: oneColumn,
	// Technical sets a dense single column with mono-feeling rules and colored section labels.
	technical: oneColumn,
	// Academic centres the header and every section heading, for research and scholarship CVs.
	academic: oneColumn,
	// Humanist opens with a warm tinted band and a round photo slot, body in one plain column.
	humanist: oneColumn,
} as const satisfies Record<Template, TemplateLayout>;
