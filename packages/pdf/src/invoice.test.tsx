import { dirname, join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { createInvoicePdf } from "./server";

const standardFontDataUrl = `${join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts")}/`;

const snapshot = {
	customerName: "Bagus Maulana",
	customerEmail: "bagus@example.com",
	planName: "Lamaran",
	credits: 1,
	amountIdr: 5000,
	uniqueCode: 123,
	totalIdr: 5123,
	paymentMethod: "qris",
	paidAt: "2026-11-11T03:00:00.000Z",
	balanceAfter: 4,
};

describe("createInvoicePdf", () => {
	it("mencetak satu halaman berisi nomor, pembeli, total, dan catatan bukan faktur pajak", async () => {
		const pdf = await createInvoicePdf({ number: "PF/2026/000123", issuedAt: new Date("2026-11-11T03:05:00Z"), snapshot });
		const doc = await getDocument({ data: new Uint8Array(pdf), standardFontDataUrl }).promise;
		const pages = await Promise.all(Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1).then((p) => p.getTextContent())));
		const text = pages
			.flatMap((content) => content.items.map((item) => ("str" in item ? item.str : "")))
			.join(" ")
			.replace(/\s+/g, " ");

		expect(doc.numPages).toBe(1);
		expect(text).toContain("PF/2026/000123");
		expect(text).toContain("Bagus Maulana");
		expect(text).toContain("Rp5.123");
		expect(text).toContain("bukan faktur pajak");
	});
});
