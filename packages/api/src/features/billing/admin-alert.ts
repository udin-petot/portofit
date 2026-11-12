import { and, asc, eq, lt } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { billingAdminAlert, billingOrder, user } from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";

/** Jenis kejadian yang layak dikirim ke WhatsApp admin. */
export type AlertKind = "bukti_bayar";

/** Setelah lima percobaan, baris berhenti dicoba supaya bukan mengulang selamanya. */
export const MAX_ALERT_ATTEMPTS = 5;
const BATCH = 10;

export type AdminAlertInput = {
	email: string | null;
	planName: string;
	totalIdr: number;
	uniqueCode: number;
	at: Date;
	adminUrl: string;
};

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

/** Pesan singkat untuk admin: cukup untuk memutuskan buka panel atau tidak. */
export function formatAdminAlert(input: AdminAlertInput): string {
	const when = new Intl.DateTimeFormat("id-ID", {
		timeZone: "Asia/Jakarta",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
		.format(input.at)
		.replace(/,\s*/g, " ");

	return [
		"PortoFit: bukti bayar baru masuk",
		`Pembeli: ${input.email ?? "tidak diketahui"}`,
		`Paket: ${input.planName}`,
		`Nominal: ${rupiah(input.totalIdr)} (kode ${String(input.uniqueCode).padStart(3, "0")})`,
		`Waktu: ${when} WIB`,
		`Verifikasi: ${input.adminUrl}`,
	].join("\n");
}

export type WhatsAppConfig = {
	provider: "fonnte" | "meta" | "webhook";
	to: string;
	token?: string | undefined;
	phoneId?: string | undefined;
	webhookUrl?: string | undefined;
};

/** Saluran pemberitahuan admin. WhatsApp dan Telegram memakai bentuk permintaan berbeda. */
export type AlertConfig =
	| ({ channel: "whatsapp" } & WhatsAppConfig)
	| { channel: "telegram"; chatId: string; token: string };

/** Nomor Indonesia ditulis 08xx oleh manusia dan 628xx oleh penyedia. Samakan sebelum dikirim. */
export function normalizePhone(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (digits.startsWith("0")) return `62${digits.slice(1)}`;
	return digits;
}

/** Kembalikan null kalau belum lengkap, supaya pemanggil bisa berhenti tanpa error. */
export function readWhatsAppConfig(): WhatsAppConfig | null {
	const to = env.ADMIN_WHATSAPP_NUMBER;
	const provider = env.WHATSAPP_PROVIDER;
	if (!to || !provider) return null;
	if (provider === "fonnte" && !env.WHATSAPP_TOKEN) return null;
	if (provider === "meta" && (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID)) return null;
	if (provider === "webhook" && !env.WHATSAPP_WEBHOOK_URL) return null;

	return {
		provider,
		to: normalizePhone(to),
		token: env.WHATSAPP_TOKEN,
		phoneId: env.WHATSAPP_PHONE_ID,
		webhookUrl: env.WHATSAPP_WEBHOOK_URL,
	};
}

/** Bentuk permintaan per penyedia. Dipisah supaya bisa diuji tanpa jaringan. */
export function buildWhatsAppRequest(
	config: WhatsAppConfig,
	message: string,
): { url: string; init: { method: string; headers: Record<string, string>; body: string | URLSearchParams } } {
	if (config.provider === "fonnte") {
		return {
			url: "https://api.fonnte.com/send",
			init: {
				method: "POST",
				headers: { Authorization: config.token ?? "" },
				body: new URLSearchParams({ target: config.to, message }),
			},
		};
	}

	if (config.provider === "meta") {
		return {
			url: `https://graph.facebook.com/v21.0/${config.phoneId}/messages`,
			init: {
				method: "POST",
				headers: { Authorization: `Bearer ${config.token ?? ""}`, "Content-Type": "application/json" },
				body: JSON.stringify({
					messaging_product: "whatsapp",
					to: config.to,
					type: "text",
					text: { body: message },
				}),
			},
		};
	}

	return {
		url: config.webhookUrl ?? "",
		init: {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ to: config.to, message }),
		},
	};
}

/** Pilih saluran: ADMIN_CHANNEL menang, kalau kosong pakai Telegram bila kredensialnya lengkap. */
export function readAlertConfig(): AlertConfig | null {
	const channel = env.ADMIN_CHANNEL ?? (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? "telegram" : "whatsapp");

	if (channel === "telegram") {
		if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return null;
		return { channel: "telegram", chatId: env.TELEGRAM_CHAT_ID, token: env.TELEGRAM_BOT_TOKEN };
	}

	const whatsapp = readWhatsAppConfig();
	return whatsapp ? { channel: "whatsapp", ...whatsapp } : null;
}

/** Bentuk permintaan per saluran. Dipisah supaya bisa diuji tanpa jaringan. */
export function buildAlertRequest(
	config: AlertConfig,
	message: string,
): { url: string; init: { method: string; headers: Record<string, string>; body: string | URLSearchParams } } {
	if (config.channel === "telegram") {
		return {
			url: `https://api.telegram.org/bot${config.token}/sendMessage`,
			init: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chat_id: config.chatId, text: message, disable_web_page_preview: true }),
			},
		};
	}

	return buildWhatsAppRequest(config, message);
}

type PendingAlert = {
	id: string;
	attempts: number;
	email: string | null;
	planName: string;
	totalIdr: number;
	uniqueCode: number;
	createdAt: Date;
};

export type AdminAlertDeps = {
	listPending: (limit: number) => Promise<PendingAlert[]>;
	send: (message: string) => Promise<void>;
	markSent: (id: string, at: Date) => Promise<void>;
	markFailed: (id: string, attempts: number, error: string) => Promise<void>;
};

export type AdminAlertResult = { configured: boolean; sent: number; failed: number };

/**
 * Mengirim antrean pemberitahuan ke WhatsApp admin. Dipanggil cron tiap menit.
 * Baris dicoba berurutan: satu pesan gagal tidak boleh menahan pesan berikutnya.
 */
export async function sendAdminAlerts(now: Date = new Date(), deps?: AdminAlertDeps): Promise<AdminAlertResult> {
	let realDeps: AdminAlertDeps;

	if (deps) {
		realDeps = deps;
	} else {
		const config = readAlertConfig();
		if (!config) return { configured: false, sent: 0, failed: 0 };

		realDeps = {
			listPending: async (limit) => {
				const rows = await db
					.select({
						id: billingAdminAlert.id,
						attempts: billingAdminAlert.attempts,
						email: user.email,
						planName: billingOrder.planName,
						totalIdr: billingOrder.totalIdr,
						uniqueCode: billingOrder.uniqueCode,
						createdAt: billingAdminAlert.createdAt,
					})
					.from(billingAdminAlert)
					.innerJoin(billingOrder, eq(billingOrder.id, billingAdminAlert.orderId))
					.leftJoin(user, eq(user.id, billingOrder.userId))
					.where(and(eq(billingAdminAlert.status, "pending"), lt(billingAdminAlert.attempts, MAX_ALERT_ATTEMPTS)))
					.orderBy(asc(billingAdminAlert.createdAt))
					.limit(limit);
				return rows;
			},
			send: async (message) => {
				const { url, init } = buildAlertRequest(config, message);
				const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
				if (!response.ok) throw new Error(`${config.channel === "telegram" ? "telegram" : config.provider} membalas ${response.status}`);
			},
			markSent: async (id, at) => {
				await db
					.update(billingAdminAlert)
					.set({ status: "sent", sentAt: at, lastError: null })
					.where(eq(billingAdminAlert.id, id));
			},
			markFailed: async (id, attempts, error) => {
				await db
					.update(billingAdminAlert)
					.set({
						attempts,
						lastError: error.slice(0, 300),
						status: attempts >= MAX_ALERT_ATTEMPTS ? "failed" : "pending",
					})
					.where(eq(billingAdminAlert.id, id));
			},
		};
	}

	let sent = 0;
	let failed = 0;
	const pending = await realDeps.listPending(BATCH);
	const adminUrl = `${env.APP_URL.replace(/\/$/, "")}/admin`;

	for (const row of pending) {
		try {
			await realDeps.send(
				formatAdminAlert({
					email: row.email,
					planName: row.planName,
					totalIdr: row.totalIdr,
					uniqueCode: row.uniqueCode,
					at: row.createdAt,
					adminUrl,
				}),
			);
			await realDeps.markSent(row.id, now);
			sent += 1;
		} catch (error) {
			await realDeps.markFailed(row.id, row.attempts + 1, error instanceof Error ? error.message : String(error));
			failed += 1;
		}
	}

	return { configured: true, sent, failed };
}
