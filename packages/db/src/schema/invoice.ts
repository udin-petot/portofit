import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@reactive-resume/utils/string";
import { user } from "./auth";
import { billingOrder } from "./billing";

/**
 * Isi kuitansi disalin saat terbit, bukan dibaca ulang dari order atau paket.
 * Kalau harga paket berubah tahun depan, kuitansi lama tetap menampilkan angka yang dibayar saat itu.
 */
export type InvoiceSnapshot = {
	customerName: string;
	customerEmail: string;
	planName: string;
	credits: number;
	items?: { kind: string; credits: number }[];
	amountIdr: number;
	uniqueCode: number;
	totalIdr: number;
	paymentMethod: string;
	paidAt: string;
	balanceAfter: number;
};

/**
 * Satu order lunas hanya boleh punya satu kuitansi, dijaga indeks unik `order_id`.
 * Nomor diambil dari counter per tahun di dalam transaksi verifikasi yang sama.
 */
export const invoice = pg.pgTable(
	"invoice",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		number: pg.text("number").notNull().unique(),
		orderId: pg
			.text("order_id")
			.notNull()
			.unique()
			.references(() => billingOrder.id, { onDelete: "cascade" }),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		issuedAt: pg.timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
		snapshot: pg.jsonb("snapshot").$type<InvoiceSnapshot>().notNull(),
	},
	(t) => [pg.index().on(t.userId, t.issuedAt)],
);

/** Nomor terakhir per tahun. Baris dibuat saat kuitansi pertama tahun itu terbit. */
export const invoiceCounter = pg.pgTable("invoice_counter", {
	year: pg.integer("year").notNull().primaryKey(),
	lastNumber: pg.integer("last_number").notNull().default(0),
});

/**
 * Antrean email keluar. Dibuat di transaksi yang sama dengan kuitansi, dikirim oleh cron.
 * Kalau dikirim langsung di dalam transaksi, SMTP yang lambat ikut menahan verifikasi admin.
 */
export const invoiceEmail = pg.pgTable(
	"invoice_email",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		invoiceId: pg
			.text("invoice_id")
			.notNull()
			.references(() => invoice.id, { onDelete: "cascade" }),
		toEmail: pg.text("to_email").notNull(),
		// pending -> sent | failed
		status: pg.text("status").notNull().default("pending"),
		attempts: pg.integer("attempts").notNull().default(0),
		lastError: pg.text("last_error"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		sentAt: pg.timestamp("sent_at", { withTimezone: true }),
	},
	(t) => [pg.index().on(t.status, t.createdAt)],
);
