export type FinanceKind = "pemasukan" | "pengeluaran";
export type FinanceSource = "order" | "manual";

export type FinanceSummaryRow = {
	kind: FinanceKind;
	category: string;
	amountIdr: number;
	source: FinanceSource;
};

export type FinanceSummary = {
	incomeIdr: number;
	incomeOrderIdr: number;
	incomeManualIdr: number;
	expenseIdr: number;
	balanceIdr: number;
	entryCount: number;
	orderCount: number;
	manualCount: number;
	byCategory: Array<{ kind: FinanceKind; category: string; totalIdr: number; count: number }>;
};

/**
 * Menjumlahkan baris kas yang sudah digabung (pesanan lunas dan catatan manual).
 * Sengaja fungsi murni supaya angka laporan bisa diuji tanpa database.
 */
export function summarizeFinance(rows: readonly FinanceSummaryRow[]): FinanceSummary {
	let incomeOrderIdr = 0;
	let incomeManualIdr = 0;
	let expenseIdr = 0;
	let orderCount = 0;
	let manualCount = 0;
	const categories = new Map<string, { kind: FinanceKind; category: string; totalIdr: number; count: number }>();

	for (const row of rows) {
		if (row.source === "order") orderCount += 1;
		else manualCount += 1;

		if (row.kind === "pemasukan") {
			if (row.source === "order") incomeOrderIdr += row.amountIdr;
			else incomeManualIdr += row.amountIdr;
		} else {
			expenseIdr += row.amountIdr;
		}

		const key = `${row.kind}:${row.category}`;
		const bucket = categories.get(key) ?? { kind: row.kind, category: row.category, totalIdr: 0, count: 0 };
		bucket.totalIdr += row.amountIdr;
		bucket.count += 1;
		categories.set(key, bucket);
	}

	const byCategory = [...categories.values()].sort((left, right) => {
		if (left.kind !== right.kind) return left.kind === "pemasukan" ? -1 : 1;
		if (right.totalIdr !== left.totalIdr) return right.totalIdr - left.totalIdr;
		return left.category.localeCompare(right.category, "id-ID");
	});

	return {
		incomeIdr: incomeOrderIdr + incomeManualIdr,
		incomeOrderIdr,
		incomeManualIdr,
		expenseIdr,
		balanceIdr: incomeOrderIdr + incomeManualIdr - expenseIdr,
		entryCount: rows.length,
		orderCount,
		manualCount,
		byCategory,
	};
}
