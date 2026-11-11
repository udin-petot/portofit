import { describe, expect, it, vi } from "vitest";
import { issueInvoiceForOrder } from "./service";

const lunasOrder = { id: "ord_1", userId: "usr_1", status: "lunas", verifiedAt: new Date("2026-11-01T00:00:00Z") };

describe("issueInvoiceForOrder", () => {
	it("menolak order yang belum lunas", async () => {
		await expect(
			issueInvoiceForOrder(
				{ orderId: "ord_1" },
				{ findOrder: async () => ({ ...lunasOrder, status: "menunggu_verifikasi" }) as never },
			),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("tidak memakai nomor baru kalau kuitansi sudah pernah terbit", async () => {
		const existing = { id: "inv_1" };
		const issue = vi.fn();

		const result = await issueInvoiceForOrder(
			{ orderId: "ord_1" },
			{ findOrder: async () => lunasOrder as never, findInvoice: async () => existing as never, issue: issue as never },
		);

		expect(result).toBe(existing);
		expect(issue).not.toHaveBeenCalled();
	});
});
