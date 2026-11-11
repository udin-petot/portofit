import type { ResumeRenderOptions } from "./context";
import type { SectionTitleResolver } from "./section-title";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import * as forme from "@formepdf/core";
import { parseResumeData } from "@reactive-resume/schema/resume/data";
import { readServerImage } from "./forme/images.node.ts";
import { assertPdfFonts, renderResume, renderResumeElement } from "./forme/render";
import { InvoiceDocument, type InvoicePdfInput } from "./invoice";

export type { InvoicePdfInput } from "./invoice";

export { configureOwnPictureReader } from "./forme/images.node";

export type CreateResumePdfFileOptions = {
	data: ResumeData;
	filename: string;
	template?: Template | undefined;
	renderOptions?: ResumeRenderOptions | undefined;
	resolveSectionTitle?: SectionTitleResolver | undefined;
	/** Operator-configured app origin; only its public picture upload paths may use private addresses. */
	uploadOrigin?: string | undefined;
};

/** Creates a server PDF using deployment font mirroring and the server image reader. */
export const createResumePdfFile = async ({
	filename,
	uploadOrigin,
	...input
}: CreateResumePdfFileOptions): Promise<File> => {
	const result = await renderResume(forme, {
		...input,
		data: parseResumeData(input.data),
		readImage: (source) => readServerImage(source, uploadOrigin),
		webFontBaseUrl: process.env.WEB_FONT_BASE_URL,
	});
	// Characters no font can draw print as "?" rather than failing the file; the editor names them.
	assertPdfFonts(result);
	return new File([result.pdf as Uint8Array<ArrayBuffer>], filename, { type: "application/pdf" });
};

/**
 * Kuitansi memakai font standar PDF dan tidak menyentuh data resume, jadi dirender langsung
 * lewat jalur elemen, bukan jalur resume.
 */
export const createInvoicePdf = async (input: InvoicePdfInput): Promise<Buffer> => {
	const result = await renderResumeElement(forme, <InvoiceDocument {...input} />);
	return Buffer.from(result.pdf as Uint8Array<ArrayBuffer>);
};
