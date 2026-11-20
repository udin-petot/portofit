import { describe, expect, it } from "vitest";
import { orderCreditItems } from "./credit-summary";

describe("orderCreditItems", () => {
	it("mengembalikan setiap jenis kredit dari bundel", () => {
		expect(
			orderCreditItems({
				kind: "bundle",
				credits: 35,
				items: [
					{ kind: "application", credits: 3 },
					{ kind: "interview", credits: 2 },
					{ kind: "coach", credits: 30 },
				],
			}),
		).toEqual([
			{ kind: "application", credits: 3 },
			{ kind: "interview", credits: 2 },
			{ kind: "coach", credits: 30 },
		]);
	});

	it("memakai kredit tunggal kalau rincian kosong", () => {
		expect(orderCreditItems({ kind: "interview", credits: 1 })).toEqual([{ kind: "interview", credits: 1 }]);
		expect(orderCreditItems({ kind: "application", credits: 3 })).toEqual([{ kind: "application", credits: 3 }]);
	});

	it("tidak mengarang kredit untuk bundel tanpa rincian", () => {
		expect(orderCreditItems({ kind: "bundle", credits: 35 })).toEqual([]);
	});

	it("aman untuk pesanan yang belum terbaca", () => {
		expect(orderCreditItems(null)).toEqual([]);
		expect(orderCreditItems(undefined)).toEqual([]);
	});
});
