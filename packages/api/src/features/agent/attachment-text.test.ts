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

	it("refuses a DOCX whose entry declares a decompressed size over the cap", async () => {
		const docx = zipSync({ "word/document.xml": strToU8("<w:document/>") });
		const view = new DataView(docx.buffer, docx.byteOffset, docx.byteLength);
		// Uncompressed size sits at offset 24 of a central-directory header. fflate allocates from this value
		// before inflating, so a lying declaration is the decompression-bomb shape this cap exists to stop.
		for (let offset = 0; offset + 46 <= docx.byteLength; offset++) {
			if (view.getUint32(offset, true) === 0x02014b50) {
				view.setUint32(offset + 24, 64 * 1024 * 1024, true);
				break;
			}
		}
		await expect(
			extractAttachmentText({
				filename: "cv.docx",
				mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				data: docx,
			}),
		).rejects.toMatchObject({ message: expect.stringContaining("terlalu besar") });
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
