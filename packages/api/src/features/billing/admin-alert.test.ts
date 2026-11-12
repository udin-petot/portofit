import { describe, expect, it } from "vitest";
import { buildAlertRequest, buildWhatsAppRequest, formatAdminAlert, normalizePhone, sendAdminAlerts } from "./admin-alert";

const order = {
	email: "bagus@example.invalid",
	planName: "Paket Lamaran",
	totalIdr: 5_270,
	uniqueCode: 270,
	at: new Date("2026-11-12T12:05:00Z"),
	adminUrl: "https://www.portofit.tech/admin",
};

describe("formatAdminAlert", () => {
	it("memuat paket, nominal, kode unik, waktu WIB, dan tautan verifikasi", () => {
		const message = formatAdminAlert(order);

		expect(message).toContain("Paket Lamaran");
		expect(message).toContain("Rp5.270");
		expect(message).toContain("kode 270");
		expect(message).toContain("12/11/2026");
		expect(message).toContain("19.05 WIB");
		expect(message).toContain("https://www.portofit.tech/admin");
	});

	it("menulis pembeli tanpa email sebagai tidak diketahui, bukan undefined", () => {
		expect(formatAdminAlert({ ...order, email: null })).toContain("Pembeli: tidak diketahui");
	});
});

describe("normalizePhone", () => {
	it("mengubah nol depan jadi 62", () => {
		expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
	});

	it("membiarkan nomor yang sudah 62", () => {
		expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
	});
});

describe("buildWhatsAppRequest", () => {
	it("memakai form Fonnte dengan token di header", () => {
		const request = buildWhatsAppRequest({ provider: "fonnte", to: "62812", token: "rahasia" }, "halo");

		expect(request.url).toBe("https://api.fonnte.com/send");
		expect(request.init.headers.Authorization).toBe("rahasia");
		expect(String(request.init.body)).toContain("target=62812");
	});

	it("memakai Graph API untuk Meta dengan nomor telepon di badan", () => {
		const request = buildWhatsAppRequest(
			{ provider: "meta", to: "62812", token: "rahasia", phoneId: "1234" },
			"halo",
		);

		expect(request.url).toBe("https://graph.facebook.com/v21.0/1234/messages");
		const body = JSON.parse(String(request.init.body));
		expect(body.to).toBe("62812");
		expect(body.text.body).toBe("halo");
	});

	it("mengirim JSON sederhana untuk webhook", () => {
		const request = buildWhatsAppRequest(
			{ provider: "webhook", to: "62812", webhookUrl: "https://contoh.invalid/wa" },
			"halo",
		);

		expect(request.url).toBe("https://contoh.invalid/wa");
		expect(JSON.parse(String(request.init.body))).toEqual({ to: "62812", message: "halo" });
	});
});

describe("buildAlertRequest", () => {
	it("memakai sendMessage Telegram untuk saluran telegram", () => {
		const request = buildAlertRequest({ channel: "telegram", chatId: "12345", token: "tok" }, "halo");

		expect(request.url).toBe("https://api.telegram.org/bottok/sendMessage");
		const body = JSON.parse(String(request.init.body));
		expect(body.chat_id).toBe("12345");
		expect(body.text).toBe("halo");
	});

	it("meneruskan ke penyedia WhatsApp untuk saluran whatsapp", () => {
		const request = buildAlertRequest(
			{ channel: "whatsapp", provider: "fonnte", to: "62812", token: "rahasia" },
			"halo",
		);

		expect(request.url).toBe("https://api.fonnte.com/send");
	});
});

describe("sendAdminAlerts", () => {
	const pending = (id: string, attempts = 0) => ({
		id,
		attempts,
		email: "bagus@example.invalid",
		planName: "Paket Lamaran",
		totalIdr: 5_270,
		uniqueCode: 270,
		createdAt: new Date("2026-11-12T12:05:00Z"),
	});

	it("menandai terkirim hanya untuk pesan yang berhasil", async () => {
		const sent: string[] = [];
		const marked: string[] = [];
		const failed: string[] = [];

		const result = await sendAdminAlerts(new Date("2026-11-12T12:06:00Z"), {
			listPending: async () => [pending("a"), pending("b")],
			send: async (message) => {
				if (message.includes("bagus")) sent.push(message);
			},
			markSent: async (id) => {
				marked.push(id);
			},
			markFailed: async (id) => {
				failed.push(id);
			},
		});

		expect(result).toEqual({ configured: true, sent: 2, failed: 0 });
		expect(marked).toEqual(["a", "b"]);
		expect(failed).toEqual([]);
	});

	it("mencatat percobaan gagal tanpa menandai terkirim", async () => {
		const marked: string[] = [];
		const failed: { id: string; attempts: number; error: string }[] = [];

		const result = await sendAdminAlerts(new Date("2026-11-12T12:06:00Z"), {
			listPending: async () => [pending("a", 1)],
			send: async () => {
				throw new Error("fonnte membalas 500");
			},
			markSent: async (id) => {
				marked.push(id);
			},
			markFailed: async (id, attempts, error) => {
				failed.push({ id, attempts, error });
			},
		});

		expect(result).toEqual({ configured: true, sent: 0, failed: 1 });
		expect(marked).toEqual([]);
		expect(failed).toEqual([{ id: "a", attempts: 2, error: "fonnte membalas 500" }]);
	});

	it("tidak melakukan apa pun saat penyedia belum diatur", async () => {
		const result = await sendAdminAlerts(new Date("2026-11-12T12:06:00Z"));

		expect(result).toEqual({ configured: false, sent: 0, failed: 0 });
	});
});
