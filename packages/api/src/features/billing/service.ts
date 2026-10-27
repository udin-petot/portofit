import { ORPCError } from "@orpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { adminAudit, billingCreditLedger, billingOrder, billingPlan, user } from "@reactive-resume/db/schema";

export type PlanKind = "application" | "interview";
export type OrderStatus = "menunggu_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
export type PaymentMethod = "qris" | "wa";

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
	menunggu_bayar: "Menunggu pembayaran",
	menunggu_verifikasi: "Menunggu verifikasi",
	lunas: "Lunas",
	ditolak: "Ditolak",
};

/** Bentuk yang dikirim ke klien, dipangkas supaya cocok dengan kontrak DTO. */
export type OrderDto = {
	id: string;
	planCode: string;
	planName: string;
	kind: PlanKind;
	credits: number;
	amountIdr: number;
	uniqueCode: number;
	totalIdr: number;
	status: OrderStatus;
	paymentMethod: PaymentMethod;
	proofPath: string | null;
	proofNote: string | null;
	rejectionReason: string | null;
	createdAt: Date;
	verifiedAt: Date | null;
};

type OrderRow = typeof billingOrder.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toOrderDto(order: OrderRow): OrderDto {
	return {
		id: order.id,
		planCode: order.planCode,
		planName: order.planName,
		kind: order.kind as PlanKind,
		credits: order.credits,
		amountIdr: order.amountIdr,
		uniqueCode: order.uniqueCode,
		totalIdr: order.totalIdr,
		status: order.status as OrderStatus,
		paymentMethod: order.paymentMethod as PaymentMethod,
		proofPath: order.proofPath,
		proofNote: order.proofNote,
		rejectionReason: order.rejectionReason,
		createdAt: order.createdAt,
		verifiedAt: order.verifiedAt,
	};
}

function assertAdmin(role: string | null | undefined) {
	if (role !== "admin") throw new ORPCError("FORBIDDEN", { message: "Butuh peran admin untuk tindakan ini." });
}

async function sumCredits(tx: Tx | typeof db, userId: string, kind: PlanKind) {
	const [row] = await tx
		.select({ total: sql<number>`coalesce(sum(${billingCreditLedger.delta}), 0)::int` })
		.from(billingCreditLedger)
		.where(and(eq(billingCreditLedger.userId, userId), eq(billingCreditLedger.kind, kind)));
	return row?.total ?? 0;
}

/** Kode 0–999 supaya nominal unik dan mudah dicocokkan di mutasi; hindari tabrakan dengan order terbuka hari ini. */
async function pickUniqueCode(amountIdr: number) {
	for (let attempt = 0; attempt < 12; attempt += 1) {
		const code = Math.floor(Math.random() * 1000);
		const [clash] = await db
			.select({ id: billingOrder.id })
			.from(billingOrder)
			.where(
				and(
					eq(billingOrder.uniqueCode, code),
					eq(billingOrder.amountIdr, amountIdr),
					or(eq(billingOrder.status, "menunggu_bayar"), eq(billingOrder.status, "menunggu_verifikasi")),
					sql`${billingOrder.createdAt} > now() - interval '3 days'`,
				),
			)
			.limit(1);
		if (!clash) return code;
	}
	return Math.floor(Math.random() * 1000);
}

async function balancesFor(userId: string) {
	const rows = await db
		.select({ kind: billingCreditLedger.kind, total: sql<number>`coalesce(sum(${billingCreditLedger.delta}), 0)::int` })
		.from(billingCreditLedger)
		.where(eq(billingCreditLedger.userId, userId))
		.groupBy(billingCreditLedger.kind);

	const map = new Map(rows.map((row) => [row.kind, row.total]));
	return { application: map.get("application") ?? 0, interview: map.get("interview") ?? 0 };
}

function csvCell(value: string | number | null | undefined) {
	const text = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const billingService = {
	async listPlans() {
		const plans = await db
			.select({
				code: billingPlan.code,
				name: billingPlan.name,
				description: billingPlan.description,
				kind: billingPlan.kind,
				priceIdr: billingPlan.priceIdr,
				credits: billingPlan.credits,
			})
			.from(billingPlan)
			.where(eq(billingPlan.active, true))
			.orderBy(billingPlan.sortOrder, billingPlan.createdAt);
		return { plans: plans.map((plan) => ({ ...plan, kind: plan.kind as PlanKind })) };
	},

	balances(userId: string) {
		return balancesFor(userId);
	},

	async listMyOrders(userId: string, limit: number | undefined = 20) {
		const orders = await db
			.select()
			.from(billingOrder)
			.where(eq(billingOrder.userId, userId))
			.orderBy(desc(billingOrder.createdAt))
			.limit(limit);
		return { orders: orders.map(toOrderDto) };
	},

	async createOrder(userId: string, planCode: string) {
		const [plan] = await db
			.select()
			.from(billingPlan)
			.where(and(eq(billingPlan.code, planCode), eq(billingPlan.active, true)))
			.limit(1);
		if (!plan) throw new ORPCError("NOT_FOUND", { message: "Paket tidak ditemukan atau sudah tidak dijual." });

		const uniqueCode = await pickUniqueCode(plan.priceIdr);
		const [order] = await db
			.insert(billingOrder)
			.values({
				userId,
				planId: plan.id,
				planCode: plan.code,
				planName: plan.name,
				kind: plan.kind,
				credits: plan.credits,
				amountIdr: plan.priceIdr,
				uniqueCode,
				totalIdr: plan.priceIdr + uniqueCode,
				status: "menunggu_bayar",
				paymentMethod: "qris",
			})
			.returning();

		if (!order) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Order gagal dibuat." });

		return toOrderDto(order);
	},

	async attachProof(input: {
		userId: string;
		orderId: string;
		proofPath: string;
		note?: string | undefined;
		paymentMethod?: PaymentMethod | undefined;
	}) {
		const [order] = await db.select().from(billingOrder).where(eq(billingOrder.id, input.orderId)).limit(1);
		if (!order || order.userId !== input.userId) throw new ORPCError("NOT_FOUND", { message: "Order tidak ditemukan." });
		if (order.status === "lunas") throw new ORPCError("BAD_REQUEST", { message: "Order ini sudah lunas." });
		if (order.status === "menunggu_verifikasi") throw new ORPCError("BAD_REQUEST", { message: "Bukti sudah dikirim dan sedang menunggu verifikasi." });

		const [updated] = await db
			.update(billingOrder)
			.set({
				proofPath: input.proofPath,
				proofNote: input.note ?? null,
				paymentMethod: input.paymentMethod ?? "qris",
				status: "menunggu_verifikasi",
				rejectionReason: null,
			})
			.where(eq(billingOrder.id, order.id))
			.returning();

		if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Bukti gagal disimpan." });

		return toOrderDto(updated);
	},

	/** Dipakai fitur lain sebelum melakukan aksi berbayar; menolak bila saldo kurang. */
	consumeCredit(input: { userId: string; kind: PlanKind; reason: string }) {
		return db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${input.userId}:${input.kind}`}))`);
			const current = await sumCredits(tx, input.userId, input.kind);
			if (current < 1) {
				throw new ORPCError("FORBIDDEN", {
					message: "Kredit habis. Beli paket di halaman harga untuk melanjutkan.",
					data: { code: "CREDIT_REQUIRED", kind: input.kind, balance: current },
				});
			}
			const remaining = current - 1;
			await tx.insert(billingCreditLedger).values({
				userId: input.userId,
				kind: input.kind,
				delta: -1,
				reason: input.reason,
				balanceAfter: remaining,
				actorId: input.userId,
			});
			return { ok: true as const, remaining };
		});
	},

	async adminListOrders(input: {
		role?: string | null | undefined;
		status?: OrderStatus | undefined;
		limit?: number | undefined;
	}) {
		assertAdmin(input.role);
		const where = input.status ? eq(billingOrder.status, input.status) : undefined;
		const query = db.select().from(billingOrder).orderBy(desc(billingOrder.createdAt)).limit(input.limit ?? 50);
		const orders = where ? await query.where(where) : await query;
		return { orders: orders.map(toOrderDto) };
	},

	adminVerifyOrder(input: { role?: string | null | undefined; actorId: string; orderId: string }) {
		assertAdmin(input.role);
		return db.transaction(async (tx) => {
			const [order] = await tx.select().from(billingOrder).where(eq(billingOrder.id, input.orderId)).limit(1);
			if (!order) throw new ORPCError("NOT_FOUND", { message: "Order tidak ditemukan." });
			if (order.status === "lunas") throw new ORPCError("BAD_REQUEST", { message: "Order ini sudah lunas." });
			if (order.status !== "menunggu_verifikasi") {
				throw new ORPCError("BAD_REQUEST", { message: `Order berstatus ${ORDER_STATUS_LABEL[order.status as OrderStatus]}. Bukti belum diunggah.` });
			}

			const kind = order.kind as PlanKind;
			await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${order.userId}:${kind}`}))`);
			const current = await sumCredits(tx, order.userId, kind);
			const balanceAfter = current + order.credits;

			await tx.insert(billingCreditLedger).values({
				userId: order.userId,
				kind,
				delta: order.credits,
				reason: `Pembayaran ${order.planName}`,
				orderId: order.id,
				balanceAfter,
				actorId: input.actorId,
			});
			const [updated] = await tx
				.update(billingOrder)
				.set({ status: "lunas", verifiedBy: input.actorId, verifiedAt: new Date(), rejectionReason: null })
				.where(eq(billingOrder.id, order.id))
				.returning();
			await tx.insert(adminAudit).values({
				actorId: input.actorId,
				action: "order.verify",
				targetType: "billing_order",
				targetId: order.id,
				detail: { totalIdr: order.totalIdr, credits: order.credits, kind, balanceAfter },
			});

			if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Order gagal diperbarui." });
			return toOrderDto(updated);
		});
	},

	async adminRejectOrder(input: { role?: string | null | undefined; actorId: string; orderId: string; reason: string }) {
		assertAdmin(input.role);
		const [order] = await db.select().from(billingOrder).where(eq(billingOrder.id, input.orderId)).limit(1);
		if (!order) throw new ORPCError("NOT_FOUND", { message: "Order tidak ditemukan." });
		if (order.status === "lunas") throw new ORPCError("BAD_REQUEST", { message: "Order yang sudah lunas tidak bisa ditolak; pakai koreksi kredit." });

		const [updated] = await db
			.update(billingOrder)
			.set({ status: "ditolak", rejectionReason: input.reason, verifiedBy: input.actorId, verifiedAt: new Date() })
			.where(eq(billingOrder.id, order.id))
			.returning();
		await db.insert(adminAudit).values({
			actorId: input.actorId,
			action: "order.reject",
			targetType: "billing_order",
			targetId: order.id,
			detail: { reason: input.reason },
		});

		if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Order gagal diperbarui." });
		return toOrderDto(updated);
	},

	async adminListUsers(input: { role?: string | null | undefined; query?: string | undefined; limit?: number | undefined }) {
		assertAdmin(input.role);
		const filter = input.query?.trim()
			? or(ilike(user.email, `%${input.query.trim()}%`), ilike(user.name, `%${input.query.trim()}%`))
			: undefined;
		const base = db
			.select({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt })
			.from(user)
			.orderBy(desc(user.createdAt))
			.limit(input.limit ?? 50);
		const rows = filter ? await base.where(filter) : await base;

		const totals = rows.length
			? await db
					.select({
						userId: billingCreditLedger.userId,
						kind: billingCreditLedger.kind,
						total: sql<number>`coalesce(sum(${billingCreditLedger.delta}), 0)::int`,
					})
					.from(billingCreditLedger)
					.groupBy(billingCreditLedger.userId, billingCreditLedger.kind)
			: [];

		return {
			users: rows.map((row) => {
				const mine = totals.filter((t) => t.userId === row.id);
				return {
					...row,
					role: row.role ?? "user",
					balances: {
						application: mine.find((t) => t.kind === "application")?.total ?? 0,
						interview: mine.find((t) => t.kind === "interview")?.total ?? 0,
					},
				};
			}),
		};
	},

	adminAdjustCredits(input: {
		role?: string | null | undefined;
		actorId: string;
		userId: string;
		kind: PlanKind;
		delta: number;
		reason: string;
	}) {
		assertAdmin(input.role);
		if (input.delta === 0) throw new ORPCError("BAD_REQUEST", { message: "Delta tidak boleh nol." });
		return db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${input.userId}:${input.kind}`}))`);
			const current = await sumCredits(tx, input.userId, input.kind);
			const balanceAfter = current + input.delta;
			if (balanceAfter < 0) throw new ORPCError("BAD_REQUEST", { message: `Saldo tidak cukup (sisa ${current}).` });

			await tx.insert(billingCreditLedger).values({
				userId: input.userId,
				kind: input.kind,
				delta: input.delta,
				reason: input.reason,
				balanceAfter,
				actorId: input.actorId,
			});
			await tx.insert(adminAudit).values({
				actorId: input.actorId,
				action: "credits.adjust",
				targetType: "user",
				targetId: input.userId,
				detail: { kind: input.kind, delta: input.delta, balanceAfter, reason: input.reason },
			});

			const balances = await balancesFor(input.userId);
			return { ok: true as const, balances };
		});
	},

	async adminSummary(role?: string | null | undefined) {
		assertAdmin(role);
		const [userCount] = await db.select({ value: sql<number>`count(*)::int` }).from(user);
		const [paid] = await db
			.select({
				orders: sql<number>`count(*)::int`,
				today: sql<number>`coalesce(sum(case when ${billingOrder.verifiedAt} >= date_trunc('day', now()) then ${billingOrder.totalIdr} else 0 end), 0)::int`,
				month: sql<number>`coalesce(sum(case when ${billingOrder.verifiedAt} >= date_trunc('month', now()) then ${billingOrder.totalIdr} else 0 end), 0)::int`,
			})
			.from(billingOrder)
			.where(eq(billingOrder.status, "lunas"));
		const [pending] = await db
			.select({ value: sql<number>`count(*)::int` })
			.from(billingOrder)
			.where(eq(billingOrder.status, "menunggu_verifikasi"));

		return {
			users: userCount?.value ?? 0,
			pendingVerification: pending?.value ?? 0,
			revenueTodayIdr: paid?.today ?? 0,
			revenueMonthIdr: paid?.month ?? 0,
			paidOrders: paid?.orders ?? 0,
		};
	},

	async adminUpdatePlan(input: {
		role?: string | null | undefined;
		actorId: string;
		code: string;
		name?: string | undefined;
		description?: string | null | undefined;
		priceIdr?: number | undefined;
		credits?: number | undefined;
		active?: boolean | undefined;
		sortOrder?: number | undefined;
	}) {
		assertAdmin(input.role);
		const patch = {
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.priceIdr !== undefined ? { priceIdr: input.priceIdr } : {}),
			...(input.credits !== undefined ? { credits: input.credits } : {}),
			...(input.active !== undefined ? { active: input.active } : {}),
			...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
		};
		if (Object.keys(patch).length === 0) throw new ORPCError("BAD_REQUEST", { message: "Tidak ada perubahan." });

		const [updated] = await db.update(billingPlan).set(patch).where(eq(billingPlan.code, input.code)).returning();
		if (!updated) throw new ORPCError("NOT_FOUND", { message: "Paket tidak ditemukan." });

		await db.insert(adminAudit).values({
			actorId: input.actorId,
			action: "plan.update",
			targetType: "billing_plan",
			targetId: updated.id,
			detail: patch,
		});

		return {
			code: updated.code,
			name: updated.name,
			description: updated.description,
			kind: updated.kind as PlanKind,
			priceIdr: updated.priceIdr,
			credits: updated.credits,
		};
	},

	async adminExportCsv(role?: string | null | undefined) {
		assertAdmin(role);
		const orders = await db.select().from(billingOrder).where(eq(billingOrder.status, "lunas")).orderBy(billingOrder.verifiedAt);
		const header = ["tanggal", "kode_order", "paket", "jenis", "nominal", "kode_unik", "total", "metode", "diverifikasi_oleh"];
		const lines = [header.join(",")];
		for (const order of orders) {
			lines.push(
				[
					csvCell((order.verifiedAt ?? order.createdAt).toISOString().slice(0, 10)),
					csvCell(order.id),
					csvCell(order.planName),
					csvCell(order.kind),
					csvCell(order.amountIdr),
					csvCell(order.uniqueCode),
					csvCell(order.totalIdr),
					csvCell(order.paymentMethod),
					csvCell(order.verifiedBy),
				].join(","),
			);
		}
		const total = orders.reduce((sum, order) => sum + order.totalIdr, 0);
		lines.push(["", "", "", "", "", "", csvCell(total), "", "TOTAL"].join(","));
		const stamp = new Date().toISOString().slice(0, 10);
		return { filename: `portofit-transaksi-${stamp}.csv`, csv: lines.join("\n"), rows: orders.length };
	},

	async adminAudit(input: { role?: string | null | undefined; limit?: number | undefined }) {
		assertAdmin(input.role);
		const entries = await db
			.select({
				id: adminAudit.id,
				action: adminAudit.action,
				targetType: adminAudit.targetType,
				targetId: adminAudit.targetId,
				detail: adminAudit.detail,
				createdAt: adminAudit.createdAt,
				actorEmail: user.email,
			})
			.from(adminAudit)
			.leftJoin(user, eq(adminAudit.actorId, user.id))
			.orderBy(desc(adminAudit.createdAt))
			.limit(input.limit ?? 50);
		return { entries };
	},
};
