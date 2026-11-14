import { ORPCError } from "@orpc/client";
import { strFromU8, unzipSync } from "fflate";
import { buildExtractedDocument, harvestPdfDocument } from "@reactive-resume/resume/ats-pdf";

/** Text long enough to keep a CV, short enough not to flood a chat turn. */
export const MAX_ATTACHMENT_TEXT_CHARS = 40_000;

const DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const LEGACY_DOC_MEDIA_TYPE = "application/msword";

export const isExtractableAttachment = (mediaType: string) =>
	mediaType === "application/pdf" || mediaType === DOCX_MEDIA_TYPE;

function decodeXmlEntities(value: string): string {
	return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, token: string) => {
		if (token === "amp") return "&";
		if (token === "lt") return "<";
		if (token === "gt") return ">";
		if (token === "quot") return '"';
		if (token === "apos") return "'";
		if (token.toLowerCase().startsWith("#x")) return String.fromCodePoint(Number.parseInt(token.slice(2), 16));
		if (token.startsWith("#")) return String.fromCodePoint(Number.parseInt(token.slice(1), 10));
		return entity;
	});
}

function extractDocxText(data: Uint8Array): string {
	let entries: Record<string, Uint8Array>;
	try {
		entries = unzipSync(data, { filter: (file) => file.name === "word/document.xml" });
	} catch {
		throw new ORPCError("BAD_REQUEST", {
			message: "Dokumen Word ini tidak bisa dibuka. Simpan ulang sebagai .docx atau PDF.",
			data: { code: "ATTACHMENT_UNREADABLE" },
		});
	}
	const xml = entries["word/document.xml"];
	if (!xml) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Isi dokumen Word tidak ditemukan. Simpan ulang sebagai .docx atau PDF.",
			data: { code: "ATTACHMENT_UNREADABLE" },
		});
	}

	const text = decodeXmlEntities(
		strFromU8(xml)
			.replace(/<w:tab\b[^>]*\/>/g, "\t")
			.replace(/<w:br\b[^>]*\/>/g, "\n")
			.replace(/<\/w:p>/g, "\n")
			.replace(/<[^>]+>/g, ""),
	)
		.replace(/\r/g, "")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	if (!text) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Dokumen Word ini tidak berisi teks yang bisa dibaca.",
			data: { code: "ATTACHMENT_NO_TEXT" },
		});
	}

	return text;
}

async function extractPdfText(data: Uint8Array, filename: string): Promise<string> {
	const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
	// Storage returns a Node Buffer; pdf.js deliberately rejects Buffer and asks for a plain Uint8Array.
	const bytes = new Uint8Array(data);
	const task = getDocument({ data: bytes, useSystemFonts: false });
	try {
		const document = await task.promise;
		const raw = await harvestPdfDocument(document, {
			file: { name: filename, sizeBytes: bytes.byteLength, magicBytesOk: true },
			maxPages: 30,
			// The coach needs the words, not the layout/operator audit. Skipping the operator pass keeps
			// a 20-page CV from spending the whole attachment budget on checks nobody reads.
			operatorBudgetMs: 0,
		});
		const text = buildExtractedDocument(raw).fullText.trim();

		if (!text) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"PDF ini tidak punya teks yang bisa dibaca. Kirim PDF dengan teks yang bisa dipilih, tempel teks CV-nya, atau kirim foto halaman CV.",
				data: { code: "ATTACHMENT_NO_TEXT" },
			});
		}

		return text;
	} catch (error) {
		if (error instanceof ORPCError) throw error;
		throw new ORPCError("BAD_REQUEST", {
			message: "PDF ini tidak bisa dibaca. Simpan ulang sebagai PDF standar, atau tempel teks CV-nya.",
			data: { code: "ATTACHMENT_UNREADABLE" },
		});
	} finally {
		await task.destroy().catch(() => undefined);
	}
}

/**
 * Text the model can read directly. Images return null because they travel as image parts; callers keep
 * that path unchanged. PDFs and Word files are converted here so the model never receives a file part
 * its provider may reject.
 */
export async function extractAttachmentText(input: {
	filename: string;
	mediaType: string;
	data: Uint8Array;
}): Promise<string | null> {
	if (input.mediaType === "application/pdf")
		return (await extractPdfText(input.data, input.filename)).slice(0, MAX_ATTACHMENT_TEXT_CHARS);
	if (input.mediaType === DOCX_MEDIA_TYPE) return extractDocxText(input.data).slice(0, MAX_ATTACHMENT_TEXT_CHARS);
	if (input.mediaType === LEGACY_DOC_MEDIA_TYPE) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Format .doc lama belum didukung. Simpan sebagai .docx atau PDF, lalu kirim lagi.",
			data: { code: "ATTACHMENT_UNSUPPORTED" },
		});
	}
	return null;
}
