import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { applyFontPairing, fitToPages, FONT_PAIRINGS, matchFontPairing, nextFitStep } from "./presets";

const PHASE_ONE_PAIRINGS = ["modern", "editorial", "studio", "technical", "humanist", "compact"];

describe("font pairings", () => {
	it("includes the six Phase 1 pairings", () => {
		expect(FONT_PAIRINGS.map((pairing) => pairing.id)).toEqual(expect.arrayContaining(PHASE_ONE_PAIRINGS));
	});

	it.each(PHASE_ONE_PAIRINGS)("applies and matches %s", (id) => {
		const pairing = FONT_PAIRINGS.find((candidate) => candidate.id === id);
		expect(pairing).toBeDefined();
		if (!pairing) return;

		const metadata = structuredClone(defaultResumeData.metadata) as Parameters<typeof applyFontPairing>[0];

		applyFontPairing(metadata, pairing.id);

		expect(metadata.typography.heading.fontFamily).toBe(pairing.heading);
		expect(metadata.typography.heading.fontWeights).toEqual([pairing.headingWeight]);
		expect(metadata.typography.body.fontFamily).toBe(pairing.body);
		expect(metadata.typography.body.fontWeights).toEqual(["400", "700"]);
		expect(matchFontPairing(metadata)).toBe(pairing.id);
	});
});

describe("Fit to one page", () => {
	it("tightens density, then margins, then size, never below 9 pt", () => {
		expect(nextFitStep({ density: "roomy", margins: "wide", size: 10 })).toEqual({ density: "normal" });
		expect(nextFitStep({ density: "compact", margins: "wide", size: 10 })).toEqual({ margins: "normal" });
		expect(nextFitStep({ density: "compact", margins: "narrow", size: 10 })).toEqual({ size: 9.5 });
		expect(nextFitStep({ density: "compact", margins: "narrow", size: 9 })).toBeNull();
		// Values that match no preset jump straight to the tightest one.
		expect(nextFitStep({ density: null, margins: null, size: 10 })).toEqual({ density: "compact" });
	});

	it("stops as soon as the page fits", async () => {
		const applied: unknown[] = [];
		let pagesLeft = 2;
		const result = await fitToPages(
			{ density: "normal", margins: "normal", size: 10 },
			(step) => applied.push(step),
			async () => pagesLeft-- <= 0,
		);
		expect(result.fits).toBe(true);
		expect(applied).toEqual([{ density: "compact" }, { margins: "narrow" }]);
		expect(result.state).toEqual({ density: "compact", margins: "narrow", size: 10 });
	});
});
