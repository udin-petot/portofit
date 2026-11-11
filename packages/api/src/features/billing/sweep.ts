import { and, eq, gt, lte } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { billingOrder, billingOrderEmail } from "@reactive-resume/db/schema";
import { REMINDER_MS } from "./expiry";

type OrderEmailKind = "dibuat" | "pengingat" | "hangus";

type SweepDeps = {
	markExpired: (now: Date) => Promise<string[]>;
	findRemindable: (now: Date, until: Date) => Promise<string[]>;
	enqueue: (orderId: string, kind: OrderEmailKind) => Promise<boolean>;
};

export type SweepResult = { expired: number; reminded: number };

/**
 * Penyapu berjalan tiap menit. Pesanan yang lewat batas dihanguskan dan diberi email,
 * pesanan yang tinggal lima menit dimasukkan ke antrean pengingat sekali saja.
 */
export async function sweepOrders(now: Date = new Date(), deps?: SweepDeps): Promise<SweepResult> {
	if (!deps) {
		return db.transaction(async (tx) => {
			const expiredRows = await tx
				.update(billingOrder)
				.set({ status: "hangus", updatedAt: now })
				.where(and(eq(billingOrder.status, "menunggu_bayar"), lte(billingOrder.expiresAt, now)))
				.returning({ id: billingOrder.id });

			for (const row of expiredRows) {
				await tx
					.insert(billingOrderEmail)
					.values({ orderId: row.id, kind: "hangus" })
					.onConflictDoNothing({ target: [billingOrderEmail.orderId, billingOrderEmail.kind] });
			}

			const remindable = await tx
				.select({ id: billingOrder.id })
				.from(billingOrder)
				.where(
					and(
						eq(billingOrder.status, "menunggu_bayar"),
						gt(billingOrder.expiresAt, now),
						lte(billingOrder.expiresAt, new Date(now.getTime() + REMINDER_MS)),
					),
				);

			if (remindable.length === 0) {
				return { expired: expiredRows.length, reminded: 0 };
			}

			const remindedRows = await tx
				.insert(billingOrderEmail)
				.values(remindable.map((row) => ({ orderId: row.id, kind: "pengingat" as const })))
				.onConflictDoNothing({ target: [billingOrderEmail.orderId, billingOrderEmail.kind] })
				.returning({ id: billingOrderEmail.id });

			return { expired: expiredRows.length, reminded: remindedRows.length };
		});
	}

	const expiredIds = await deps.markExpired(now);
	let reminded = 0;

	for (const orderId of expiredIds) {
		await deps.enqueue(orderId, "hangus");
	}

	const remindable = await deps.findRemindable(now, new Date(now.getTime() + REMINDER_MS));
	for (const orderId of remindable) {
		if (await deps.enqueue(orderId, "pengingat")) reminded += 1;
	}

	return { expired: expiredIds.length, reminded };
}
