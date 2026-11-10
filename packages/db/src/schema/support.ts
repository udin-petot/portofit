import { sql } from "drizzle-orm";
import { generateId } from "@reactive-resume/utils/string";
import * as pg from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Satu percakapan aktif per pengguna. Percakapan dibuat saat pesan pertama dikirim, bukan saat halaman
 * dibuka, supaya tidak ada baris kosong yang mengacaukan hitungan di laporan.
 */
export const supportConversation = pg.pgTable(
	"support_conversation",
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
		// "open" atau "closed". Hanya satu baris "open" per pengguna.
		status: pg.text("status").notNull().default("open"),
		// Diisi saat pengguna menekan tombol WhatsApp, dipakai untuk menghitung tingkat eskalasi.
		escalatedAt: pg.timestamp("escalated_at", { withTimezone: true }),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [
		pg.index().on(t.userId, t.createdAt.desc()),
		pg
			.uniqueIndex()
			.on(t.userId)
			.where(sql`${t.status} = 'open'`),
	],
);

export const supportMessage = pg.pgTable(
	"support_message",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		conversationId: pg
			.text("conversation_id")
			.notNull()
			.references(() => supportConversation.id, { onDelete: "cascade" }),
		// "user" atau "assistant".
		role: pg.text("role").notNull(),
		content: pg.text("content").notNull(),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index().on(t.conversationId, t.createdAt.asc())],
);
