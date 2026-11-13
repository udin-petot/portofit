import { describe, expect, it } from "vitest";
import { canAcceptProof, computeExpiry, isExpired, msLeft, shouldRemind } from "./expiry";

const now = new Date("2026-11-11T10:00:00Z");
const order = (overrides: Partial<{ status: string; expiresAt: Date | null }> = {}) => ({
	status: "menunggu_bayar",
	expiresAt: new Date(now.getTime() + 5 * 60_000),
	...overrides,
});

describe("computeExpiry", () => {
	it("memberi tiga puluh menit sejak pesanan dibuat, cukup untuk pembayaran QRIS manual", () => {
		expect(computeExpiry(now).toISOString()).toBe("2026-11-11T10:30:00.000Z");
	});
});

describe("isExpired", () => {
	it("hangus setelah batas lewat", () => {
		expect(isExpired({ status: "menunggu_bayar", expiresAt: now }, now)).toBe(true);
	});

	it("belum hangus sebelum batas", () => {
		expect(isExpired(order(), now)).toBe(false);
	});

	it("tidak menyentuh pesanan yang sudah diverifikasi atau lunas", () => {
		expect(isExpired({ status: "menunggu_verifikasi", expiresAt: now }, now)).toBe(false);
		expect(isExpired({ status: "lunas", expiresAt: now }, now)).toBe(false);
	});

	it("pesanan tanpa batas waktu tidak hangus", () => {
		expect(isExpired({ status: "menunggu_bayar", expiresAt: null }, now)).toBe(false);
	});
});

describe("msLeft", () => {
	it("menghitung sisa waktu dan tidak pernah negatif", () => {
		expect(msLeft(order(), now)).toBe(5 * 60_000);
		expect(msLeft({ status: "menunggu_bayar", expiresAt: now }, now)).toBe(0);
	});
});

describe("shouldRemind", () => {
	it("mengingatkan saat sisa lima menit atau kurang", () => {
		expect(shouldRemind(order(), now)).toBe(true);
	});

	it("tidak mengingatkan kalau masih lama", () => {
		expect(shouldRemind(order({ expiresAt: new Date(now.getTime() + 6 * 60_000) }), now)).toBe(false);
	});

	it("tidak mengingatkan pesanan yang sudah bayar atau hangus", () => {
		expect(shouldRemind(order({ status: "menunggu_verifikasi" }), now)).toBe(false);
		expect(shouldRemind(order({ status: "lunas" }), now)).toBe(false);
		expect(shouldRemind({ status: "menunggu_bayar", expiresAt: now }, now)).toBe(false);
	});
});

describe("canAcceptProof", () => {
	it("menerima bukti sebelum batas", () => {
		expect(canAcceptProof(order(), now)).toBe(true);
	});

	it("menolak bukti setelah hangus", () => {
		expect(canAcceptProof({ status: "menunggu_bayar", expiresAt: now }, now)).toBe(false);
	});
});
