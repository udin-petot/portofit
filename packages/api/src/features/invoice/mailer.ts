import { asc, eq, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { invoice, invoiceEmail } from "@reactive-resume/db/schema";
import { sendInvoiceEmail } from "@reactive-resume/email/invoice-mail";
import { env } from "@reactive-resume/env/server";
import { createInvoicePdf } from "@reactive-resume/pdf/server";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 20;

/** Kegagalan SMTP dicoba lagi dua kali; percobaan ketiga menandai antrean gagal permanen. */
export function nextDeliveryState(
	attempts: number,
	error?: string,
): { attempts: number; status: "pending" | "failed"; lastError: string | null } {
	const next = attempts + 1;
	return {
		attempts: next,
		status: next >= MAX_ATTEMPTS ? "failed" : "pending",
		lastError: error ?? null,
	};
}

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

/** Mengirim antrean kuitansi. Dipanggil cron; tidak pernah melempar supaya satu email rusak tidak menahan yang lain. */
export async function processInvoiceEmails(limit = BATCH_SIZE): Promise<{ sent: number; failed: number }> {
	const rows = await db
		.select({
			emailId: invoiceEmail.id,
			toEmail: invoiceEmail.toEmail,
			attempts: invoiceEmail.attempts,
			number: invoice.number,
			issuedAt: invoice.issuedAt,
			snapshot: invoice.snapshot,
		})
		.from(invoiceEmail)
		.innerJoin(invoice, eq(invoiceEmail.invoiceId, invoice.id))
		.where(eq(invoiceEmail.status, "pending"))
		.orderBy(asc(invoiceEmail.createdAt))
		.limit(limit);

	let sent = 0;
	let failed = 0;

	for (const row of rows) {
		try {
			const pdf = await createInvoicePdf({ number: row.number, issuedAt: row.issuedAt, snapshot: row.snapshot });

			await sendInvoiceEmail({
				to: row.toEmail,
				name: row.snapshot.customerName,
				number: row.number,
				total: rupiah(row.snapshot.totalIdr),
				url: new URL("/dashboard/transaksi", env.APP_URL).toString(),
				detail: `${row.snapshot.planName} · ${row.snapshot.credits} kredit`,
				method: row.snapshot.paymentMethod.toUpperCase(),
				paidAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(
					new Date(row.snapshot.paidAt),
				),
				pdf,
			});

			await db
				.update(invoiceEmail)
				.set({ status: "sent", attempts: sql`${invoiceEmail.attempts} + 1`, sentAt: new Date(), lastError: null })
				.where(eq(invoiceEmail.id, row.emailId));
			sent += 1;
		} catch (error) {
			const state = nextDeliveryState(
				row.attempts,
				error instanceof Error ? error.message.slice(0, 200) : "Pengiriman gagal.",
			);
			await db.update(invoiceEmail).set(state).where(eq(invoiceEmail.id, row.emailId));
			failed += 1;
		}
	}

	return { sent, failed };
}
