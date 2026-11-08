import { generateId } from "@reactive-resume/utils/string";
import * as pg from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Buku kas manual kelompok: pemasukan di luar pesanan situs dan semua pengeluaran.
 * Pemasukan dari pesanan yang lunas tidak disalin ke sini supaya tidak terhitung dua kali; laporan
 * menggabungkan keduanya saat dibaca. `kind` hanya "pemasukan" atau "pengeluaran".
 */
export const financeEntry = pg.pgTable(
	"finance_entry",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		kind: pg.text("kind").notNull(),
		category: pg.text("category").notNull(),
		description: pg.text("description").notNull(),
		amountIdr: pg.integer("amount_idr").notNull(),
		occurredAt: pg.timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
		// Catatan bebas: nomor nota, nama pembeli, atau tautan bukti di luar aplikasi.
		note: pg.text("note"),
		createdBy: pg.text("created_by").references(() => user.id, { onDelete: "set null" }),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(t) => [pg.index().on(t.occurredAt), pg.index().on(t.kind, t.occurredAt)],
);
