import { generateId } from "@reactive-resume/utils/string";
import * as pg from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Paket yang dijual. Bisa diubah dari panel admin tanpa deploy, karena harga dan jumlah kredit disimpan di sini.
 * `kind` menentukan kuota mana yang bertambah saat order diverifikasi.
 */
export const billingPlan = pg.pgTable(
	"billing_plan",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		code: pg.text("code").notNull().unique(),
		name: pg.text("name").notNull(),
		description: pg.text("description"),
		// "application" (CV + cover letter per lowongan) atau "interview" (sesi latihan wawancara).
		kind: pg.text("kind").notNull().default("application"),
		priceIdr: pg.integer("price_idr").notNull(),
		credits: pg.integer("credits").notNull().default(1),
		active: pg.boolean("active").notNull().default(true),
		sortOrder: pg.integer("sort_order").notNull().default(0),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(t) => [pg.index().on(t.active, t.sortOrder)],
);

/**
 * Satu pesanan pelanggan. Harga paket disalin (snapshot) supaya riwayat keuangan tidak berubah kalau harga paket diedit.
 * `uniqueCode` (0-999) ditambahkan ke nominal agar pembayaran mudah dicocokkan di mutasi QRIS.
 */
export const billingOrder = pg.pgTable(
	"billing_order",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		planId: pg.text("plan_id").references(() => billingPlan.id, { onDelete: "set null" }),
		planCode: pg.text("plan_code").notNull(),
		planName: pg.text("plan_name").notNull(),
		kind: pg.text("kind").notNull(),
		credits: pg.integer("credits").notNull(),
		amountIdr: pg.integer("amount_idr").notNull(),
		uniqueCode: pg.integer("unique_code").notNull(),
		totalIdr: pg.integer("total_idr").notNull(),
		// menunggu_bayar -> menunggu_verifikasi -> lunas | ditolak
		status: pg.text("status").notNull().default("menunggu_bayar"),
		// qris (unggah bukti di situs) atau wa (bukti dikirim lewat WhatsApp, admin mencatat).
		paymentMethod: pg.text("payment_method").notNull().default("qris"),
		proofPath: pg.text("proof_path"),
		proofNote: pg.text("proof_note"),
		verifiedBy: pg.text("verified_by").references(() => user.id, { onDelete: "set null" }),
		verifiedAt: pg.timestamp("verified_at", { withTimezone: true }),
		rejectionReason: pg.text("rejection_reason"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(t) => [pg.index().on(t.userId, t.createdAt), pg.index().on(t.status, t.createdAt)],
);

/**
 * Buku besar kredit. Saldo dihitung dari `sum(delta)` per pengguna dan jenis, bukan kolom yang ditimpa,
 * supaya setiap perubahan bisa diaudit (termasuk koreksi manual admin).
 */
export const billingCreditLedger = pg.pgTable(
	"billing_credit_ledger",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		kind: pg.text("kind").notNull(),
		delta: pg.integer("delta").notNull(),
		reason: pg.text("reason").notNull(),
		orderId: pg.text("order_id").references(() => billingOrder.id, { onDelete: "set null" }),
		balanceAfter: pg.integer("balance_after").notNull(),
		// Pelaku perubahan: pengguna itu sendiri (pemakaian) atau admin (verifikasi, koreksi).
		actorId: pg.text("actor_id").references(() => user.id, { onDelete: "set null" }),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index().on(t.userId, t.kind, t.createdAt), pg.index().on(t.orderId)],
);

/** Jejak tindakan admin: verifikasi, penolakan, koreksi kredit, perubahan paket. */
export const adminAudit = pg.pgTable(
	"admin_audit",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		actorId: pg.text("actor_id").references(() => user.id, { onDelete: "set null" }),
		action: pg.text("action").notNull(),
		targetType: pg.text("target_type").notNull(),
		targetId: pg.text("target_id"),
		detail: pg.jsonb("detail"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index().on(t.createdAt), pg.index().on(t.actorId)],
);
