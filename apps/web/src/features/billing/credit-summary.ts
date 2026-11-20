export type CreditKind = "application" | "interview" | "coach";

export type CreditItem = {
	kind: CreditKind;
	credits: number;
};

type OrderLike = {
	kind: string;
	credits: number;
	items?: readonly CreditItem[] | undefined;
};

/**
 * Bundel punya beberapa jenis kredit. Kembalikan tiap jenis, jangan pernah totalnya
 * ditampilkan sebagai kredit lamaran. Bundel lama tanpa rincian tidak menampilkan angka.
 */
export function orderCreditItems(order: OrderLike | null | undefined): CreditItem[] {
	if (!order) return [];
	if (order.items && order.items.length > 0) return order.items.map((item) => ({ ...item }));
	if (order.kind === "bundle") return [];
	return [{ kind: order.kind as CreditKind, credits: order.credits }];
}
