import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import {
	billingCreditLedger,
	billingOrder,
	invoice,
	invoiceEmail,
	user,
	type InvoiceSnapshot,
} from "@reactive-resume/db/schema";
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
	items?: { kind: string; credits: number }[],
): InvoiceSnapshot {
	return {
		customerName: customer.name,
		customerEmail: customer.email,
		planName: order.planName,
		credits: order.credits,
		...(items && items.length > 0 ? { items } : {}),
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
	input: {
		order: OrderRow;
		customer: { name: string; email: string };
		balanceAfter: number;
		items?: { kind: string; credits: number }[];
	},
): Promise<InvoiceRow> {
	const findExisting = async () => {
		const [existing] = await tx.select().from(invoice).where(eq(invoice.orderId, input.order.id)).limit(1);
		return existing;
	};

	const existing = await findExisting();
	if (existing) return existing;

	const issuedAt = input.order.verifiedAt ?? new Date();
	const snapshot = buildInvoiceSnapshot(input.order, input.customer, input.balanceAfter, input.items);
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
		.select({
			id: invoice.id,
			orderId: invoice.orderId,
			number: invoice.number,
			issuedAt: invoice.issuedAt,
			snapshot: invoice.snapshot,
		})
		.from(invoice)
		.where(eq(invoice.userId, userId))
		.orderBy(desc(invoice.issuedAt));

	return rows.map((row) => ({
		id: row.id,
		orderId: row.orderId,
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

	return { fileName: `invoice-${row.number.replaceAll("/", "-")}.pdf`, pdf: pdf.toString("base64") };
}

type FindOrder = (orderId: string) => Promise<OrderRow | undefined>;

const findOrderRow: FindOrder = async (orderId) => {
	const [row] = await db.select().from(billingOrder).where(eq(billingOrder.id, orderId)).limit(1);
	return row;
};

const findInvoiceByOrder = async (orderId: string): Promise<InvoiceRow | undefined> => {
	const [row] = await db.select().from(invoice).where(eq(invoice.orderId, orderId)).limit(1);
	return row;
};

/**
 * Menerbitkan kuitansi untuk order lunas yang sudah ada sebelum fitur ini rilis.
 * Tanggal terbit memakai `verifiedAt` asli, bukan hari ini, tetapi nomornya tetap urutan berikutnya.
 */
export async function issueInvoiceForOrder(
	input: { orderId: string },
	deps: {
		findOrder?: FindOrder;
		findInvoice?: (orderId: string) => Promise<InvoiceRow | undefined>;
		issue?: typeof issueInvoice;
	} = {},
): Promise<InvoiceRow> {
	const order = await (deps.findOrder ?? findOrderRow)(input.orderId);
	if (!order) throw new ORPCError("NOT_FOUND", { message: "Order tidak ditemukan." });
	if (order.status !== "lunas") {
		throw new ORPCError("BAD_REQUEST", { message: "Kuitansi hanya untuk order yang sudah lunas." });
	}

	const existing = await (deps.findInvoice ?? findInvoiceByOrder)(order.id);
	if (existing) return existing;

	return db.transaction(async (tx) => {
		const [customer] = await tx
			.select({ name: user.name, email: user.email })
			.from(user)
			.where(eq(user.id, order.userId))
			.limit(1);
		if (!customer) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Pembeli order ini tidak ditemukan." });

		const [ledger] = await tx
			.select({ balanceAfter: billingCreditLedger.balanceAfter })
			.from(billingCreditLedger)
			.where(eq(billingCreditLedger.orderId, order.id))
			.limit(1);

		const issue = deps.issue ?? issueInvoice;
		return issue(tx, { order, customer, balanceAfter: ledger?.balanceAfter ?? 0 });
	});
}

/** Antre ulang email tanpa menyentuh nomor kuitansi. */
export async function resendInvoiceEmail(invoiceId: string): Promise<void> {
	const [row] = await db.select().from(invoice).where(eq(invoice.id, invoiceId)).limit(1);
	if (!row) throw new ORPCError("NOT_FOUND", { message: "Kuitansi tidak ditemukan." });

	await db.insert(invoiceEmail).values({ invoiceId: row.id, toEmail: row.snapshot.customerEmail });
}

/** Snapshot lengkap untuk panel pratinjau. Sumbernya sama dengan PDF, jadi angkanya tidak mungkin beda. */
export async function previewInvoice(input: { userId: string; invoiceId: string }) {
	const row = await findOwnedInvoice(input.userId, input.invoiceId);
	if (!row) throw new ORPCError("NOT_FOUND", { message: "Kuitansi tidak ditemukan." });

	return { number: row.number, issuedAt: row.issuedAt.toISOString(), snapshot: row.snapshot };
}
