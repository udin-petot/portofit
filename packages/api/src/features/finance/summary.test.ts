import { describe, expect, it } from "vitest";
import { summarizeFinance } from "./summary";

describe("summarizeFinance", () => {
	it("mengembalikan nol untuk buku kas kosong", () => {
		expect(summarizeFinance([])).toEqual({
			incomeIdr: 0,
			incomeOrderIdr: 0,
			incomeManualIdr: 0,
			expenseIdr: 0,
			balanceIdr: 0,
			entryCount: 0,
			orderCount: 0,
			manualCount: 0,
			byCategory: [],
		});
	});

	it("memisahkan pemasukan pesanan dan pemasukan manual", () => {
		const summary = summarizeFinance([
			{ kind: "pemasukan", category: "penjualan", amountIdr: 5003, source: "order" },
			{ kind: "pemasukan", category: "penjualan", amountIdr: 10002, source: "order" },
			{ kind: "pemasukan", category: "jasa", amountIdr: 15000, source: "manual" },
		]);

		expect(summary.incomeOrderIdr).toBe(15005);
		expect(summary.incomeManualIdr).toBe(15000);
		expect(summary.incomeIdr).toBe(30005);
		expect(summary.expenseIdr).toBe(0);
		expect(summary.balanceIdr).toBe(30005);
		expect(summary.orderCount).toBe(2);
		expect(summary.manualCount).toBe(1);
		expect(summary.entryCount).toBe(3);
	});

	it("mengurangi saldo dengan pengeluaran dan mengelompokkan kategori", () => {
		const summary = summarizeFinance([
			{ kind: "pemasukan", category: "penjualan", amountIdr: 20000, source: "order" },
			{ kind: "pengeluaran", category: "ai", amountIdr: 1200, source: "manual" },
			{ kind: "pengeluaran", category: "ai", amountIdr: 800, source: "manual" },
			{ kind: "pengeluaran", category: "operasional", amountIdr: 5000, source: "manual" },
		]);

		expect(summary.expenseIdr).toBe(7000);
		expect(summary.balanceIdr).toBe(13000);
		expect(summary.byCategory).toEqual([
			{ kind: "pemasukan", category: "penjualan", totalIdr: 20000, count: 1 },
			{ kind: "pengeluaran", category: "operasional", totalIdr: 5000, count: 1 },
			{ kind: "pengeluaran", category: "ai", totalIdr: 2000, count: 2 },
		]);
	});

	it("menghitung saldo negatif saat pengeluaran melebihi pemasukan", () => {
		const summary = summarizeFinance([
			{ kind: "pemasukan", category: "penjualan", amountIdr: 5000, source: "order" },
			{ kind: "pengeluaran", category: "domain", amountIdr: 25000, source: "manual" },
		]);

		expect(summary.balanceIdr).toBe(-20000);
	});
});
