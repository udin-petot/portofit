import type { SectionTitleResolver } from "../../section-title";
import { describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createElement } from "react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { ResumeDocument } from "../../document";
import { renderToBuffer } from "../../forme/testing";
import { getTemplatePage } from "../../templates";

const resolveSectionTitle: SectionTitleResolver = (input) => input.defaultEnglishTitle ?? input.sectionId;
const data = { ...sampleResumeData, picture: { ...sampleResumeData.picture, hidden: true } };

describe("AcademicPage", () => {
	it("is registered as the academic template", () => {
		expect(getTemplatePage("academic").name).toBe("AcademicPage");
	});

	it("renders the sample as one column with the candidate name", async () => {
		const bytes = await renderToBuffer(
			createElement(ResumeDocument, { data, template: "academic", resolveSectionTitle }) as never,
		);
		const loadingTask = getDocument({ data: new Uint8Array(bytes) });
		const document = await loadingTask.promise;
		const page = await document.getPage(1);
		const text = (await page.getTextContent()).items.map((item) => ("str" in item ? item.str : "")).join(" ");

		expect(document.numPages).toBeGreaterThanOrEqual(1);
		// The header prints the name uppercase, so compare without case.
		expect(text.toLowerCase()).toContain(sampleResumeData.basics.name.toLowerCase());
		expect(text.toLowerCase()).toContain("education");
		await loadingTask.destroy();
	}, 60_000);
});
