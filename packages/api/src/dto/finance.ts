import z from "zod";

export const financeKindSchema = z.enum(["pemasukan", "pengeluaran"]).describe("Arah uang: masuk atau keluar.");
export const financeSourceSchema = z
	.enum(["order", "manual"])
	.describe("order: otomatis dari pesanan situs yang lunas. manual: dicatat admin.");

export const financeEntryOutputSchema = z.object({
	id: z.string(),
	kind: financeKindSchema,
	category: z.string().describe("Kelompok pengeluaran atau pemasukan, mis. operasional, ai, penjualan."),
	description: z.string(),
	amountIdr: z.number().int(),
	occurredAt: z.date().describe("Tanggal transaksi terjadi, bukan tanggal dicatat."),
	note: z.string().nullable(),
	source: financeSourceSchema,
	editable: z.boolean().describe("Hanya entri manual yang bisa diubah atau dihapus dari panel."),
});

export const financeSummarySchema = z.object({
	incomeIdr: z.number().int().describe("Seluruh uang masuk: pesanan situs ditambah pemasukan manual."),
	incomeOrderIdr: z.number().int(),
	incomeManualIdr: z.number().int(),
	expenseIdr: z.number().int(),
	balanceIdr: z.number().int().describe("Uang masuk dikurangi uang keluar."),
	entryCount: z.number().int(),
	orderCount: z.number().int(),
	manualCount: z.number().int(),
	byCategory: z.array(
		z.object({
			kind: financeKindSchema,
			category: z.string(),
			totalIdr: z.number().int(),
			count: z.number().int(),
		}),
	),
});

const rangeShape = {
	from: z.coerce.date().optional().describe("Awal rentang, inklusif."),
	to: z.coerce.date().optional().describe("Akhir rentang, inklusif."),
};

const entryShape = {
	kind: financeKindSchema,
	category: z.string().trim().min(2).max(40).describe("Kelompok transaksi, mis. operasional atau penjualan."),
	description: z.string().trim().min(3).max(200).describe("Keterangan singkat yang bisa dibaca di laporan."),
	amountIdr: z.number().int().min(1).max(1_000_000_000).describe("Nominal dalam rupiah, selalu positif."),
	occurredAt: z.coerce.date().optional().describe("Tanggal transaksi. Default sekarang."),
	note: z.string().trim().max(300).optional().describe("Nomor nota, nama pembeli, atau tautan bukti."),
};

export const financeDto = {
	list: {
		input: z.object({
			...rangeShape,
			kind: financeKindSchema.optional(),
			limit: z.number().int().min(1).max(500).optional().describe("Jumlah baris terbaru yang ditampilkan (default 200)."),
		}),
		output: z.object({
			entries: z.array(financeEntryOutputSchema),
			summary: financeSummarySchema,
		}),
	},
	create: {
		input: z.object(entryShape),
		output: financeEntryOutputSchema,
	},
	update: {
		input: z.object({
			id: z.string().min(1),
			kind: financeKindSchema.optional(),
			category: z.string().trim().min(2).max(40).optional(),
			description: z.string().trim().min(3).max(200).optional(),
			amountIdr: z.number().int().min(1).max(1_000_000_000).optional(),
			occurredAt: z.coerce.date().optional(),
			note: z.string().trim().max(300).optional(),
		}),
		output: financeEntryOutputSchema,
	},
	remove: {
		input: z.object({ id: z.string().min(1) }),
		output: z.object({ ok: z.literal(true) }),
	},
	exportCsv: {
		input: z.object({ ...rangeShape }),
		output: z.object({
			filename: z.string(),
			csv: z.string(),
			rows: z.number().int(),
		}),
	},
};
