import { describe, expect, it } from "vitest";
import { formatInvoiceNumber } from "./number";

describe("formatInvoiceNumber", () => {
	it("memberi nomor enam digit dengan nol di depan", () => {
		expect(formatInvoiceNumber(2026, 123)).toBe("PF/2026/000123");
	});

	it("memberi nomor urut pertama", () => {
		expect(formatInvoiceNumber(2026, 1)).toBe("PF/2026/000001");
	});

	it("tetap enam digit saat urutan sudah panjang", () => {
		expect(formatInvoiceNumber(2026, 1234567)).toBe("PF/2026/1234567");
	});
});
