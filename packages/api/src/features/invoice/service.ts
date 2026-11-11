import { and, desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@reactive-resume/db/client";
import { billingOrder, invoice, invoiceEmail, type InvoiceSnapshot } from "@reactive-resume/db/schema";
import { createInvoicePdf, type InvoicePdfInput } from "@reactive-resume/pdf/server";
import { nextInvoiceNumber } from "./number";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type OrderRow = typeof billingOrder.$inferSelect;
type InvoiceRow = typeof invoice.$inferSelect;

const JAKARTA_YEAR = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric" });

/** Tahun pajak/admin mengikuti Jakarta, bukan UTC, supaya kuitansi 1 Januari tidak bernomor tahun lalu. */
export function invoiceYear(date: Date): number {
	return Number(JAKARTA_YEAR.format(date));
}

/** Snapshot disimpan saat terbit, jadi kuitansi tidak ikut berubah kalau harga paket diedit nanti. */
export function buildInvoiceSnapshot(
	order: OrderRow,
	customer: { name: string; email: string },
	balanceAfter: number,
): InvoiceSnapshot {
	return {
		customerName: customer.name,
		customerEmail: customer.email,
		planName: order.planName,
		credits: order.credits,
		amountIdr: order.amountIdr,
		uniqueCode: order.uniqueCode,
		totalIdr: order.totalIdr,
		paymentMethod: order.paymentMethod,
		paidAt: (order.verifiedAt ?? order.updatedAt).toISOString(),
		balanceAfter,
	};
}

/**
 * Menerbitkan kuitansi di dalam transaksi verifikasi. Satu order hanya punya satu kuitansi;
 * pemanggilan kedua mengembalikan baris yang sudah ada tanpa mengambil nomor baru.
 */
export async function issueInvoice(
	tx: Tx,
	input: { order: OrderRow; customer: { name: string; email: string }; balanceAfter: number },
): Promise<InvoiceRow> {
	const findExisting = async () => {
		const [existing] = await tx.select().from(invoice).where(eq(invoice.orderId, input.order.id)).limit(1);
		return existing;
	};

	const existing = await findExisting();
	if (existing) return existing;

	const issuedAt = input.order.verifiedAt ?? new Date();
	const snapshot = buildInvoiceSnapshot(input.order, input.customer, input.balanceAfter);
	const number = await nextInvoiceNumber(tx, invoiceYear(issuedAt));

	try {
		const [row] = await tx
			.insert(invoice)
			.values({ number, orderId: input.order.id, userId: input.order.userId, issuedAt, snapshot })
			.returning();

		if (!row) throw new Error("Kuitansi gagal dibuat.");

		await tx.insert(invoiceEmail).values({ invoiceId: row.id, toEmail: snapshot.customerEmail });

		return row;
	} catch (error) {
		// Dua permintaan bersamaan: yang kalah membaca baris yang sudah dibuat pemenang, bukan membuat nomor kedua.
		if ((error as { code?: string }).code === "23505") {
			const winner = await findExisting();
			if (winner) return winner;
		}
		throw error;
	}
}

/** Daftar kuitansi milik pengguna, terbaru dulu. */
export async function listInvoices(userId: string) {
	const rows = await db
		.select({ id: invoice.id, number: invoice.number, issuedAt: invoice.issuedAt, snapshot: invoice.snapshot })
		.from(invoice)
		.where(eq(invoice.userId, userId))
		.orderBy(desc(invoice.issuedAt));

	return rows.map((row) => ({
		id: row.id,
		number: row.number,
		issuedAt: row.issuedAt.toISOString(),
		planName: row.snapshot.planName,
		totalIdr: row.snapshot.totalIdr,
	}));
}

type FindInvoice = (userId: string, invoiceId: string) => Promise<InvoiceRow | undefined>;

const findOwnedInvoice: FindInvoice = async (userId, invoiceId) => {
	const [row] = await db
		.select()
		.from(invoice)
		.where(and(eq(invoice.id, invoiceId), eq(invoice.userId, userId)))
		.limit(1);
	return row;
};

/** Pemilik saja. Kuitansi orang lain dijawab "tidak ditemukan", bukan "dilarang", supaya id tidak bisa ditebak. */
export async function downloadInvoice(
	input: { userId: string; invoiceId: string },
	deps: { find?: FindInvoice; render?: (input: InvoicePdfInput) => Promise<Buffer> } = {},
): Promise<{ fileName: string; pdf: string }> {
	const find = deps.find ?? findOwnedInvoice;
	const row = await find(input.userId, input.invoiceId);

	if (!row) throw new ORPCError("NOT_FOUND", { message: "Kuitansi tidak ditemukan." });

	const render = deps.render ?? createInvoicePdf;
	const pdf = await render({ number: row.number, issuedAt: row.issuedAt, snapshot: row.snapshot });

	return { fileName: `kuitansi-${row.number.replaceAll("/", "-")}.pdf`, pdf: pdf.toString("base64") };
}
