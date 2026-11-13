import { expect, test } from "vitest";
import { ORDER_SUBJECT } from "./templates/order";

test("subjek email pesanan tidak membawa nominal", () => {
	for (const subject of Object.values(ORDER_SUBJECT)) {
		expect(subject).not.toMatch(/Rp\s?\d/);
	}
});

test("subjek dibuat memakai kalimat perintah yang sama dengan judulnya", () => {
	expect(ORDER_SUBJECT.dibuat).toBe("Selesaikan pembayaran");
});
