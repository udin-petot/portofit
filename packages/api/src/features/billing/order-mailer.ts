import { asc, eq, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { billingOrder, billingOrderEmail, user } from "@reactive-resume/db/schema";
import { sendOrderEmail } from "@reactive-resume/email/order-mail";
import { env } from "@reactive-resume/env/server";
import { nextDeliveryState } from "../invoice/mailer";

type OrderEmailKind = "dibuat" | "pengingat" | "hangus";

/** Pengingat dan email hangus hanya masuk akal selama statusnya masih cocok. */
export function shouldSendOrderEmail(kind: OrderEmailKind, status: string): boolean {
	if (kind === "pengingat") return status === "menunggu_bayar";
	if (kind === "hangus") return status === "hangus";
	return true;
}

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

const deadlineText = (value: Date | null) =>
	value
		? new Intl.DateTimeFormat("id-ID", { timeStyle: "short", timeZone: "Asia/Jakarta" }).format(value)
		: "10 menit sejak pesanan dibuat";

/** Mengirim antrean email pesanan. Satu kegagalan tidak menahan yang lain. */
export async function processOrderEmails(limit = 20): Promise<{ sent: number; failed: number }> {
	const rows = await db
		.select({
			emailId: billingOrderEmail.id,
			kind: billingOrderEmail.kind,
			attempts: billingOrderEmail.attempts,
			orderId: billingOrder.id,
			status: billingOrder.status,
			planName: billingOrder.planName,
			totalIdr: billingOrder.totalIdr,
			uniqueCode: billingOrder.uniqueCode,
			expiresAt: billingOrder.expiresAt,
			email: user.email,
			name: user.name,
		})
		.from(billingOrderEmail)
		.innerJoin(billingOrder, eq(billingOrderEmail.orderId, billingOrder.id))
		.innerJoin(user, eq(billingOrder.userId, user.id))
		.where(eq(billingOrderEmail.status, "pending"))
		.orderBy(asc(billingOrderEmail.createdAt))
		.limit(limit);

	let sent = 0;
	let failed = 0;

	for (const row of rows) {
		const kind = row.kind as OrderEmailKind;

		if (!shouldSendOrderEmail(kind, row.status)) {
			await db.update(billingOrderEmail).set({ status: "sent", sentAt: new Date(), lastError: "dilewati: status berubah" }).where(eq(billingOrderEmail.id, row.emailId));
			continue;
		}

		try {
			await sendOrderEmail({
				kind,
				to: row.email,
				name: row.name,
				planName: row.planName,
				total: rupiah(row.totalIdr),
				uniqueCode: row.uniqueCode,
				deadline: deadlineText(row.expiresAt),
				url: new URL("/dashboard/transaksi", env.APP_URL).toString(),
			});

			await db
				.update(billingOrderEmail)
				.set({ status: "sent", attempts: sql`${billingOrderEmail.attempts} + 1`, sentAt: new Date(), lastError: null })
				.where(eq(billingOrderEmail.id, row.emailId));
			sent += 1;
		} catch (error) {
			const state = nextDeliveryState(
				row.attempts,
				error instanceof Error ? error.message.slice(0, 200) : "Pengiriman gagal.",
			);
			await db.update(billingOrderEmail).set(state).where(eq(billingOrderEmail.id, row.emailId));
			failed += 1;
		}
	}

	return { sent, failed };
}
