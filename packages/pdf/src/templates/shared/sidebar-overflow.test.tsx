import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import { describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { ResumeDocument } from "../../document";
import { renderToBuffer } from "../../forme/testing";
import { act } from "react";
import { createElement } from "react";

const data: ResumeData = { ...sampleResumeData, picture: { ...sampleResumeData.picture, hidden: true } };

/** Berapa persen tinggi halaman yang terpakai teks, per halaman. */
async function pageFills(template: Template): Promise<number[]> {
	const element = createElement(ResumeDocument, { data, template }) as unknown as Parameters<
		typeof renderToBuffer
	>[0];
	let bytes: Uint8Array = new Uint8Array();
	await act(async () => {
		bytes = new Uint8Array(await renderToBuffer(element));
	});

	const loading = getDocument({ data: bytes });
	const fills: number[] = [];
	try {
		const pdf = await loading.promise;
		for (let number = 1; number <= pdf.numPages; number++) {
			const page = await pdf.getPage(number);
			const height = page.getViewport({ scale: 1 }).height;
			const content = await page.getTextContent();
			let bottom = 0;
			for (const item of content.items) {
				if (!("str" in item) || !item.str.trim()) continue;
				const y = (item as { transform: number[] }).transform[5] ?? 0;
				bottom = Math.max(bottom, height - y);
			}
			fills.push(Number((bottom / height).toFixed(3)));
		}
	} finally {
		await loading.destroy();
	}
	return fills;
}

describe("halaman sidebar tidak menjadi halaman kosong", () => {
	it.each(["azurill", "onyx", "swiss"] as Template[])("%s mengisi setiap halaman kecuali halaman terakhir", async (template) => {
		const fills = await pageFills(template);
		const body = fills.slice(0, -1);
		expect(fills.length).toBeLessThanOrEqual(4);
		for (const fill of body) expect(fill).toBeGreaterThan(0.5);
	}, 180000);
});
