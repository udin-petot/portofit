import { describe, expect, it } from "vitest";
import { paymentPhase } from "./payment-phase";

const now = new Date("2026-11-13T12:00:00Z");
const base = { now, isPending: false, statusErrors: 0 };

describe("paymentPhase", () => {
	it("menyiapkan saat pesanan belum terbaca", () => {
		expect(paymentPhase({ ...base, status: undefined })).toBe("menyiapkan");
	});

	it("menunggu selama batas belum lewat", () => {
		expect(paymentPhase({ ...base, status: "menunggu_bayar", expiresAt: new Date(now.getTime() + 60_000) })).toBe("menunggu");
	});

	it("kedaluwarsa saat batas lewat walau status server belum berubah", () => {
		expect(paymentPhase({ ...base, status: "menunggu_bayar", expiresAt: now })).toBe("kedaluwarsa");
	});

	it("memetakan status akhir apa adanya", () => {
		expect(paymentPhase({ ...base, status: "menunggu_verifikasi" })).toBe("menunggu_dicek");
		expect(paymentPhase({ ...base, status: "lunas" })).toBe("lunas");
		expect(paymentPhase({ ...base, status: "hangus" })).toBe("kedaluwarsa");
		expect(paymentPhase({ ...base, status: "ditolak" })).toBe("ditolak");
	});

	it("mengunggah hanya saat pesanan masih menunggu bayar", () => {
		expect(paymentPhase({ ...base, status: "menunggu_bayar", isPending: true })).toBe("mengunggah");
		expect(paymentPhase({ ...base, status: "lunas", isPending: true })).toBe("lunas");
	});

	it("galat setelah tiga percobaan status gagal", () => {
		expect(paymentPhase({ ...base, statusErrors: 2 })).toBe("menyiapkan");
		expect(paymentPhase({ ...base, statusErrors: 3 })).toBe("galat");
	});

	it("status akhir tidak tertutup galat jaringan", () => {
		expect(paymentPhase({ ...base, status: "lunas", statusErrors: 5 })).toBe("lunas");
	});
});
