import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { indonesianSampleResumeData } from "@reactive-resume/schema/resume/sample-id";
import { createResumePdfFile } from "./server";

const require = createRequire(import.meta.url);
const standardFontDataUrl = `${join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts")}/`;

/**
 * The starter is the first CV a new user sees, and a recruiter reads one page. If it ever grows to two, the
 * example teaches the wrong habit, so the page count is guarded here rather than noticed by a user.
 */
describe("indonesian starter", () => {
	it("prints on a single page", async () => {
		const file = await createResumePdfFile({ data: indonesianSampleResumeData, filename: "contoh.pdf" });
		const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), standardFontDataUrl });
		const document = await task.promise;

		expect(document.numPages).toBe(1);
	}, 300_000);
});
