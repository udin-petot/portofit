import { describe, expect, it } from "vitest";
import { shouldSendOrderEmail } from "./order-mailer";

describe("shouldSendOrderEmail", () => {
	it("pengingat hanya untuk pesanan yang masih menunggu bayar", () => {
		expect(shouldSendOrderEmail("pengingat", "menunggu_bayar")).toBe(true);
		expect(shouldSendOrderEmail("pengingat", "lunas")).toBe(false);
		expect(shouldSendOrderEmail("pengingat", "menunggu_verifikasi")).toBe(false);
	});

	it("email hangus hanya untuk pesanan yang benar-benar hangus", () => {
		expect(shouldSendOrderEmail("hangus", "hangus")).toBe(true);
		expect(shouldSendOrderEmail("hangus", "menunggu_bayar")).toBe(false);
	});

	it("email pesanan dibuat tetap dikirim walau sudah dibayar", () => {
		expect(shouldSendOrderEmail("dibuat", "lunas")).toBe(true);
	});
});
