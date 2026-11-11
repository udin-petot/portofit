import { describe, expect, it, vi } from "vitest";
import type { billingOrder } from "@reactive-resume/db/schema";

const nextInvoiceNumber = vi.fn();

vi.mock("./number", () => ({ nextInvoiceNumber, formatInvoiceNumber: (y: number, s: number) => `PF/${y}/${s}` }));

const { buildInvoiceSnapshot, invoiceYear, issueInvoice } = await import("./service");

type OrderRow = typeof billingOrder.$inferSelect;

const order = {
	id: "ord_1",
	userId: "usr_1",
	planName: "Lamaran",
	credits: 1,
	amountIdr: 5000,
	uniqueCode: 123,
	totalIdr: 5123,
	paymentMethod: "qris",
	verifiedAt: new Date("2026-11-11T03:00:00Z"),
	updatedAt: new Date("2026-11-11T03:00:00Z"),
} as OrderRow;

describe("buildInvoiceSnapshot", () => {
	it("menyalin angka yang dibayar dan identitas pembeli", () => {
		const snapshot = buildInvoiceSnapshot(order, { name: "Bagus", email: "a@b.c" }, 4);

		expect(snapshot).toMatchObject({
			customerName: "Bagus",
			planName: "Lamaran",
			amountIdr: 5000,
			uniqueCode: 123,
			totalIdr: 5123,
			balanceAfter: 4,
		});
		expect(snapshot.paidAt).toBe("2026-11-11T03:00:00.000Z");
	});
});

describe("invoiceYear", () => {
	it("memakai tahun Jakarta, bukan UTC", () => {
		expect(invoiceYear(new Date("2026-12-31T18:00:00Z"))).toBe(2027);
	});
});

describe("issueInvoice", () => {
	it("tidak mengambil nomor baru kalau order sudah punya kuitansi", async () => {
		const existing = { id: "inv_1", number: "PF/2026/000001", orderId: "ord_1" };
		const tx = {
			select: () => ({ from: () => ({ where: () => ({ limit: async () => [existing] }) }) }),
		};

		const result = await issueInvoice(tx as never, { order, customer: { name: "Bagus", email: "a@b.c" }, balanceAfter: 4 });

		expect(result).toBe(existing);
		expect(nextInvoiceNumber).not.toHaveBeenCalled();
	});
});
