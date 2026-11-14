import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { extractAttachmentText, isExtractableAttachment } from "./attachment-text";

describe("attachment text", () => {
	it("reads the document body out of a DOCX archive", async () => {
		const docx = zipSync({
			"word/document.xml": strToU8(
				'<w:document><w:body><w:p><w:r><w:t>Backend Engineer</w:t></w:r></w:p><w:p><w:r><w:t>Yogyakarta</w:t></w:r></w:p></w:body></w:document>',
			),
		});
		await expect(
			extractAttachmentText({
				filename: "cv.docx",
				mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				data: docx,
			}),
		).resolves.toBe("Backend Engineer\nYogyakarta");
	});

	it("marks PDF and DOCX as extractable, and rejects legacy DOC with a clear message", async () => {
		expect(isExtractableAttachment("application/pdf")).toBe(true);
		expect(
			isExtractableAttachment("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
		).toBe(true);
		expect(isExtractableAttachment("image/jpeg")).toBe(false);
		await expect(
			extractAttachmentText({ filename: "cv.doc", mediaType: "application/msword", data: new Uint8Array() }),
		).rejects.toMatchObject({ message: expect.stringContaining(".doc") });
	});
});
