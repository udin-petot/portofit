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

describe("SwissPage", () => {
	it("is registered as the swiss template", () => {
		expect(getTemplatePage("swiss").name).toBe("SwissPage");
	});

	it("renders the sample with the candidate name and experience", async () => {
		const bytes = await renderToBuffer(
			createElement(ResumeDocument, { data, template: "swiss", resolveSectionTitle }) as never,
		);
		const loadingTask = getDocument({ data: new Uint8Array(bytes) });
		const document = await loadingTask.promise;
		const page = await document.getPage(1);
		const text = (await page.getTextContent()).items.map((item) => ("str" in item ? item.str : "")).join(" ");

		expect(document.numPages).toBeGreaterThanOrEqual(1);
		expect(text).toContain(sampleResumeData.basics.name);
		expect(text.toLowerCase()).toContain("experience");
		await loadingTask.destroy();
	}, 60_000);
});
