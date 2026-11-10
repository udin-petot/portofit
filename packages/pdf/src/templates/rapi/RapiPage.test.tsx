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

describe("RapiPage", () => {
	it("is registered as the rapi template", () => {
		expect(getTemplatePage("rapi").name).toBe("RapiPage");
	});

	it("renders the sample with the candidate name and a section title", async () => {
		const bytes = await renderToBuffer(
			createElement(ResumeDocument, { data, template: "rapi", resolveSectionTitle }) as never,
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
