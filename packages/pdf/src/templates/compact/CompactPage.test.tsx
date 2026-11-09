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

describe("CompactPage", () => {
	it("is registered as the compact template", () => {
		expect(getTemplatePage("compact").name).toBe("CompactPage");
	});

	it("renders the sample and keeps the main sections in reading order", async () => {
		const bytes = await renderToBuffer(
			createElement(ResumeDocument, { data, template: "compact", resolveSectionTitle }) as never,
		);
		const loadingTask = getDocument({ data: new Uint8Array(bytes) });
		const document = await loadingTask.promise;
		const parts: string[] = [];
		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
			const page = await document.getPage(pageNumber);
			const items = await page.getTextContent();
			parts.push(...items.items.map((item) => ("str" in item ? item.str : "")));
		}
		const text = parts.join(" ").toLowerCase();

		expect(document.numPages).toBeGreaterThanOrEqual(1);
		expect(text).toContain(sampleResumeData.basics.name.toLowerCase());
		expect(text).toContain("experience");
		expect(text).toContain("education");

		await loadingTask.destroy();
	});
});
