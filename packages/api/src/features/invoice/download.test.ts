import { describe, expect, it } from "vitest";
import { downloadInvoice } from "./service";

const row = {
	id: "inv_1",
	number: "PF/2026/000001",
	orderId: "ord_1",
	userId: "usr_1",
	issuedAt: new Date("2026-11-11T03:00:00Z"),
	snapshot: {
		customerName: "Bagus",
		customerEmail: "a@b.c",
		planName: "Lamaran",
		credits: 1,
		amountIdr: 5000,
		uniqueCode: 123,
		totalIdr: 5123,
		paymentMethod: "qris",
		paidAt: "2026-11-11T03:00:00.000Z",
		balanceAfter: 1,
	},
};

describe("downloadInvoice", () => {
	it("menolak kuitansi milik pengguna lain", async () => {
		await expect(
			downloadInvoice({ userId: "usr_1", invoiceId: "inv_1" }, { find: async () => undefined }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("mengembalikan pdf base64 untuk pemiliknya", async () => {
		const result = await downloadInvoice(
			{ userId: "usr_1", invoiceId: "inv_1" },
			{ find: async () => row, render: async () => Buffer.from("pdf") },
		);

		expect(result.pdf).toBe(Buffer.from("pdf").toString("base64"));
		expect(result.fileName).toContain("PF-2026-000001");
	});
});
