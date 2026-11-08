import { ORPCError } from "@orpc/server";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { adminAudit, billingOrder, financeEntry, user } from "@reactive-resume/db/schema";
import { summarizeFinance, type FinanceKind, type FinanceSummary, type FinanceSummaryRow } from "./summary";

export type FinanceSource = "order" | "manual";

export type FinanceEntryDto = {
	id: string;
	kind: FinanceKind;
	category: string;
	description: string;
	amountIdr: number;
	occurredAt: Date;
	note: string | null;
	source: FinanceSource;
	editable: boolean;
};

type EntryRow = typeof financeEntry.$inferSelect;
type Range = { from?: Date | undefined; to?: Date | undefined };

const ORDER_PREFIX = "order:";
const jakartaDate = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Asia/Jakarta",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

function assertAdmin(role: string | null | undefined) {
	if (role !== "admin") throw new ORPCError("FORBIDDEN", { message: "Butuh peran admin untuk tindakan ini." });
}

function assertManual(id: string) {
	if (id.startsWith(ORDER_PREFIX)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Pemasukan dari pesanan situs tidak bisa diubah di sini. Ubah status pesanannya.",
		});
	}
}

function toEntry(row: EntryRow): FinanceEntryDto {
	return {
		id: row.id,
		kind: row.kind as FinanceKind,
		category: row.category,
		description: row.description,
		amountIdr: row.amountIdr,
		occurredAt: row.occurredAt,
		note: row.note,
		source: "manual",
		editable: true,
	};
}

function inRange(date: Date, range: Range) {
	if (range.from && date < range.from) return false;
	if (range.to && date > range.to) return false;
	return true;
}

async function collectEntries(range: Range) {
	const orderRows = await db
		.select({
			id: billingOrder.id,
			planName: billingOrder.planName,
			totalIdr: billingOrder.totalIdr,
			uniqueCode: billingOrder.uniqueCode,
			verifiedAt: billingOrder.verifiedAt,
			createdAt: billingOrder.createdAt,
			buyerEmail: user.email,
		})
		.from(billingOrder)
		.leftJoin(user, eq(billingOrder.userId, user.id))
		.where(eq(billingOrder.status, "lunas"));

	const orders: FinanceEntryDto[] = orderRows
		.map((row) => {
			const occurredAt = row.verifiedAt ?? row.createdAt;
			return {
				id: `${ORDER_PREFIX}${row.id}`,
				kind: "pemasukan" as const,
				category: "penjualan",
				description: `${row.planName} · ${row.buyerEmail ?? "pembeli"}`,
				amountIdr: row.totalIdr,
				occurredAt,
				note: `Kode unik ${String(row.uniqueCode).padStart(3, "0")} · ${row.id}`,
				source: "order" as const,
				editable: false,
			};
		})
		.filter((entry) => inRange(entry.occurredAt, range));

	const conditions: SQL[] = [];
	if (range.from) conditions.push(gte(financeEntry.occurredAt, range.from));
	if (range.to) conditions.push(lte(financeEntry.occurredAt, range.to));

	const base = db.select().from(financeEntry);
	const manualRows = await (conditions.length > 0 ? base.where(and(...conditions)) : base).orderBy(
		desc(financeEntry.occurredAt),
	);

	const entries = [...orders, ...manualRows.map(toEntry)].sort((left, right) => {
		return right.occurredAt.getTime() - left.occurredAt.getTime();
	});

	return entries;
}

function summaryOf(entries: readonly FinanceEntryDto[]): FinanceSummary {
	const rows: FinanceSummaryRow[] = entries.map((entry) => ({
		kind: entry.kind,
		category: entry.category,
		amountIdr: entry.amountIdr,
		source: entry.source,
	}));
	return summarizeFinance(rows);
}

function csvCell(value: string | number | null | undefined) {
	const text = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const financeService = {
	async list(input: { role?: string | null | undefined; from?: Date | undefined; to?: Date | undefined; kind?: FinanceKind | undefined; limit?: number | undefined }) {
		assertAdmin(input.role);
		const entries = await collectEntries({ from: input.from, to: input.to });
		const filtered = input.kind ? entries.filter((entry) => entry.kind === input.kind) : entries;
		return {
			entries: filtered.slice(0, input.limit ?? 200),
			summary: summaryOf(entries),
		};
	},

	async create(input: {
		role?: string | null | undefined;
		actorId: string;
		kind: FinanceKind;
		category: string;
		description: string;
		amountIdr: number;
		occurredAt?: Date | undefined;
		note?: string | undefined;
	}) {
		assertAdmin(input.role);
		const [row] = await db
			.insert(financeEntry)
			.values({
				kind: input.kind,
				category: input.category,
				description: input.description,
				amountIdr: input.amountIdr,
				occurredAt: input.occurredAt ?? new Date(),
				note: input.note ?? null,
				createdBy: input.actorId,
			})
			.returning();

		if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Catatan gagal disimpan." });

		await db.insert(adminAudit).values({
			actorId: input.actorId,
			action: "finance.create",
			targetType: "finance_entry",
			targetId: row.id,
			detail: { kind: row.kind, category: row.category, amountIdr: row.amountIdr, description: row.description },
		});

		return toEntry(row);
	},

	async update(input: {
		role?: string | null | undefined;
		actorId: string;
		id: string;
		kind?: FinanceKind | undefined;
		category?: string | undefined;
		description?: string | undefined;
		amountIdr?: number | undefined;
		occurredAt?: Date | undefined;
		note?: string | undefined;
	}) {
		assertAdmin(input.role);
		assertManual(input.id);

		const patch = {
			...(input.kind !== undefined ? { kind: input.kind } : {}),
			...(input.category !== undefined ? { category: input.category } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.amountIdr !== undefined ? { amountIdr: input.amountIdr } : {}),
			...(input.occurredAt !== undefined ? { occurredAt: input.occurredAt } : {}),
			...(input.note !== undefined ? { note: input.note } : {}),
		};
		if (Object.keys(patch).length === 0) throw new ORPCError("BAD_REQUEST", { message: "Tidak ada perubahan." });

		const [row] = await db.update(financeEntry).set(patch).where(eq(financeEntry.id, input.id)).returning();
		if (!row) throw new ORPCError("NOT_FOUND", { message: "Catatan tidak ditemukan." });

		await db.insert(adminAudit).values({
			actorId: input.actorId,
			action: "finance.update",
			targetType: "finance_entry",
			targetId: row.id,
			detail: patch,
		});

		return toEntry(row);
	},

	async remove(input: { role?: string | null | undefined; actorId: string; id: string }) {
		assertAdmin(input.role);
		assertManual(input.id);

		const [row] = await db.delete(financeEntry).where(eq(financeEntry.id, input.id)).returning();
		if (!row) throw new ORPCError("NOT_FOUND", { message: "Catatan tidak ditemukan." });

		await db.insert(adminAudit).values({
			actorId: input.actorId,
			action: "finance.delete",
			targetType: "finance_entry",
			targetId: row.id,
			detail: { kind: row.kind, category: row.category, amountIdr: row.amountIdr, description: row.description },
		});

		return { ok: true as const };
	},

	async exportCsv(input: { role?: string | null | undefined; from?: Date | undefined; to?: Date | undefined }) {
		assertAdmin(input.role);
		const entries = await collectEntries({ from: input.from, to: input.to });
		const summary = summaryOf(entries);
		const header = ["tanggal", "jenis", "kategori", "keterangan", "nominal", "sumber", "catatan"];
		const lines = [header.join(",")];

		for (const entry of entries) {
			lines.push(
				[
					csvCell(jakartaDate.format(entry.occurredAt)),
					csvCell(entry.kind),
					csvCell(entry.category),
					csvCell(entry.description),
					csvCell(entry.amountIdr),
					csvCell(entry.source === "order" ? "pesanan situs" : "catatan manual"),
					csvCell(entry.note),
				].join(","),
			);
		}

		lines.push(["", "", "", "TOTAL PEMASUKAN", csvCell(summary.incomeIdr), "", ""].join(","));
		lines.push(["", "", "", "TOTAL PENGELUARAN", csvCell(summary.expenseIdr), "", ""].join(","));
		lines.push(["", "", "", "SALDO", csvCell(summary.balanceIdr), "", ""].join(","));

		const stamp = new Date().toISOString().slice(0, 10);
		return { filename: `portofit-keuangan-${stamp}.csv`, csv: lines.join("\n"), rows: entries.length };
	},
};
