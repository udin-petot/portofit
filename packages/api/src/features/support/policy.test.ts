import { describe, expect, it } from "vitest";
import { buildEscalationText, CONVERSATION_LIMIT, isConversationFull, MESSAGE_LIMIT } from "./policy";

describe("support policy", () => {
	it("membatasi percakapan 40 pesan termasuk balasan asisten", () => {
		expect(CONVERSATION_LIMIT).toBe(40);
		expect(isConversationFull(37)).toBe(false);
		expect(isConversationFull(38)).toBe(false);
		expect(isConversationFull(39)).toBe(true);
	});

	it("membatasi pesan pengguna 1000 karakter", () => {
		expect(MESSAGE_LIMIT).toBe(1000);
	});

	it("menyusun pesan eskalasi berisi nama, email, dan keluhan terakhir", () => {
		const text = buildEscalationText({
			name: "Bagus",
			email: "bagus@example.com",
			lastUserMessage: "Kredit belum masuk setelah transfer",
		});
		expect(text).toContain("Bagus");
		expect(text).toContain("bagus@example.com");
		expect(text).toContain("Kredit belum masuk setelah transfer");
	});

	it("memakai kalimat umum saat belum ada pesan pengguna", () => {
		const text = buildEscalationText({ name: "Bagus", email: "bagus@example.com", lastUserMessage: null });
		expect(text).toContain("Saya butuh bantuan soal pesanan atau refund.");
	});

	it("memotong keluhan panjang menjadi 300 karakter", () => {
		const text = buildEscalationText({
			name: "Bagus",
			email: "bagus@example.com",
			lastUserMessage: "x".repeat(500),
		});
		const kendala = text.split("Kendala: ")[1]?.split("\n")[0] ?? "";
		expect(kendala.length).toBe(300);
	});
});
