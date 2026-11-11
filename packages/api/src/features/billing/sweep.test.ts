import { describe, expect, it } from "vitest";
import { sweepOrders } from "./sweep";

const now = new Date("2026-11-11T10:00:00Z");

describe("sweepOrders", () => {
	it("menghanguskan pesanan lewat batas dan mengantre email untuk tiap perubahan", async () => {
		const sent: Array<[string, string]> = [];

		const result = await sweepOrders(now, {
			markExpired: async () => ["ord_1", "ord_2"],
			findRemindable: async () => ["ord_3"],
			enqueue: async (orderId, kind) => {
				sent.push([orderId, kind]);
				return true;
			},
		});

		expect(result).toEqual({ expired: 2, reminded: 1 });
		expect(sent).toContainEqual(["ord_1", "hangus"]);
		expect(sent).toContainEqual(["ord_3", "pengingat"]);
	});

	it("tidak menghitung pengingat yang sudah pernah masuk antrean", async () => {
		const result = await sweepOrders(now, {
			markExpired: async () => [],
			findRemindable: async () => ["ord_3"],
			enqueue: async () => false,
		});

		expect(result).toEqual({ expired: 0, reminded: 0 });
	});
});
