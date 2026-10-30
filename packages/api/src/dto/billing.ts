import z from "zod";

export const planKindSchema = z.enum(["application", "interview"]).describe("Jenis kredit yang dibeli: per lamaran atau per sesi wawancara.");
export const orderStatusSchema = z
	.enum(["menunggu_bayar", "menunggu_verifikasi", "lunas", "ditolak"])
	.describe("Tahap pesanan: dibuat, bukti diunggah, diverifikasi admin, atau ditolak.");
export const paymentMethodSchema = z.enum(["qris", "wa"]).describe("qris: bukti diunggah di situs. wa: bukti dikirim lewat WhatsApp lalu dicatat admin.");

export const planOutputSchema = z.object({
	code: z.string().describe("Kode paket yang dipakai saat membuat order."),
	name: z.string(),
	description: z.string().nullable(),
	kind: planKindSchema,
	priceIdr: z.number().int().describe("Harga paket dalam rupiah, belum termasuk kode unik."),
	credits: z.number().int().describe("Jumlah kredit yang bertambah setelah order diverifikasi."),
});

export const orderOutputSchema = z.object({
	id: z.string(),
	planCode: z.string(),
	planName: z.string(),
	kind: planKindSchema,
	credits: z.number().int(),
	amountIdr: z.number().int().describe("Harga paket yang di-snapshot saat order dibuat."),
	uniqueCode: z.number().int().describe("Kode 0–999 yang ditambahkan ke nominal agar mudah dicocokkan di mutasi."),
	totalIdr: z.number().int().describe("Nominal yang harus dibayar: harga paket ditambah kode unik."),
	status: orderStatusSchema,
	paymentMethod: paymentMethodSchema,
	proofPath: z.string().nullable(),
	proofNote: z.string().nullable(),
	rejectionReason: z.string().nullable(),
	createdAt: z.date(),
	verifiedAt: z.date().nullable(),
});

export const adminOrderOutputSchema = orderOutputSchema.extend({
	buyerEmail: z.string().nullable().describe("Email pembeli, supaya admin tahu siapa yang membayar."),
});

export const balancesOutputSchema = z.object({
	application: z.number().int().describe("Sisa kredit untuk CV + cover letter per lamaran."),
	interview: z.number().int().describe("Sisa kredit untuk sesi latihan wawancara."),
});

export const billingDto = {
	listPlans: { output: z.object({ plans: z.array(planOutputSchema) }) },
	balances: { output: balancesOutputSchema },
	listMyOrders: {
		input: z.object({ limit: z.number().int().min(1).max(100).optional().describe("Jumlah order terakhir yang diambil (default 20).") }),
		output: z.object({ orders: z.array(orderOutputSchema) }),
	},
	createOrder: {
		input: z.object({ planCode: z.string().min(1).max(64).describe("Kode paket dari daftar paket aktif.") }),
		output: orderOutputSchema,
	},
	attachProof: {
		input: z.object({
			orderId: z.string().min(1),
			proofPath: z.string().min(1).max(512).describe("Path hasil unggah lewat endpoint storage."),
			note: z.string().max(500).optional().describe("Catatan pengirim, mis. nama pemilik rekening."),
			paymentMethod: paymentMethodSchema.optional().describe("Default qris. Pakai wa bila bukti dikirim lewat WhatsApp."),
		}),
		output: orderOutputSchema,
	},
	consumeCredit: {
		input: z.object({
			kind: planKindSchema,
			reason: z.string().min(3).max(200).describe("Keterangan pemakaian, mis. 'Tailor CV ke lowongan Backend PT X'."),
		}),
		output: z.object({ ok: z.literal(true), remaining: z.number().int() }),
	},
	ledger: {
		input: z.object({ limit: z.number().int().min(1).max(100).optional().describe("Jumlah baris terakhir (default 30).") }),
		output: z.object({
			entries: z.array(
				z.object({
					id: z.string(),
					kind: planKindSchema,
					delta: z.number().int().describe("+1 saat kredit masuk, -1 saat dipakai."),
					reason: z.string(),
					balanceAfter: z.number().int(),
					orderId: z.string().nullable(),
					createdAt: z.date(),
				}),
			),
		}),
	},
	adminListOrders: {
		input: z.object({
			status: orderStatusSchema.optional(),
			limit: z.number().int().min(1).max(200).optional(),
		}),
		output: z.object({ orders: z.array(adminOrderOutputSchema) }),
	},
	adminOrderProof: {
		input: z.object({ orderId: z.string().min(1) }),
		output: z.object({
			dataUrl: z.string().describe("Bukti bayar sebagai data URL, siap dipasang di <img> atau tautan unduh."),
			contentType: z.string(),
			fileName: z.string(),
			size: z.number().int().describe("Ukuran file bukti dalam byte."),
		}),
	},
	adminVerifyOrder: {
		input: z.object({ orderId: z.string().min(1) }),
		output: orderOutputSchema,
	},
	adminRejectOrder: {
		input: z.object({ orderId: z.string().min(1), reason: z.string().min(3).max(500) }),
		output: orderOutputSchema,
	},
	adminListUsers: {
		input: z.object({ query: z.string().max(120).optional(), limit: z.number().int().min(1).max(200).optional() }),
		output: z.object({
			users: z.array(
				z.object({
					id: z.string(),
					email: z.string(),
					name: z.string(),
					role: z.string(),
					createdAt: z.date(),
					balances: balancesOutputSchema,
				}),
			),
		}),
	},
	adminAdjustCredits: {
		input: z.object({
			userId: z.string().min(1),
			kind: planKindSchema,
			delta: z.number().int().min(-1000).max(1000).refine((value) => value !== 0, "Delta tidak boleh nol."),
			reason: z.string().min(3).max(200),
		}),
		output: z.object({ ok: z.literal(true), balances: balancesOutputSchema }),
	},
	adminSummary: {
		output: z.object({
			users: z.number().int(),
			pendingVerification: z.number().int(),
			revenueTodayIdr: z.number().int(),
			revenueMonthIdr: z.number().int(),
			paidOrders: z.number().int(),
		}),
	},
	adminAnalytics: {
		input: z.object({ days: z.number().int().min(7).max(90).default(30).describe("Panjang jendela grafik, dalam hari.") }),
		output: z.object({
			range: z.object({
				days: z.number().int(),
				revenueIdr: z.number().int(),
				orders: z.number().int(),
				newUsers: z.number().int(),
			}),
			previous: z.object({
				revenueIdr: z.number().int(),
				orders: z.number().int(),
				newUsers: z.number().int(),
			}),
			totals: z.object({
				users: z.number().int(),
				pendingVerification: z.number().int(),
				revenueTodayIdr: z.number().int(),
				revenueMonthIdr: z.number().int(),
				paidOrders: z.number().int(),
			}),
			daily: z.array(
				z.object({
					date: z.string().describe("Tanggal UTC dalam bentuk YYYY-MM-DD."),
					revenueIdr: z.number().int(),
					orders: z.number().int(),
					newUsers: z.number().int(),
				}),
			),
			byStatus: z.array(z.object({ status: orderStatusSchema, count: z.number().int() })),
			byPlan: z.array(
				z.object({
					planCode: z.string(),
					planName: z.string(),
					orders: z.number().int(),
					revenueIdr: z.number().int(),
				}),
			),
			funnel: z.object({
				users: z.number().int(),
				withResume: z.number().int(),
				withApplication: z.number().int(),
				withPractice: z.number().int(),
				paid: z.number().int(),
			}),
		}),
	},
	adminUpdatePlan: {
		input: z.object({
			code: z.string().min(1).max(64),
			name: z.string().min(1).max(120).optional(),
			description: z.string().max(500).nullable().optional(),
			priceIdr: z.number().int().min(0).max(10_000_000).optional(),
			credits: z.number().int().min(1).max(100).optional(),
			active: z.boolean().optional(),
			sortOrder: z.number().int().min(0).max(999).optional(),
		}),
		output: planOutputSchema,
	},
	adminExportCsv: {
		output: z.object({ filename: z.string(), csv: z.string().describe("Isi CSV transaksi lunas, siap dibuka di Excel."), rows: z.number().int() }),
	},
	adminAudit: {
		input: z.object({ limit: z.number().int().min(1).max(200).optional() }),
		output: z.object({
			entries: z.array(
				z.object({
					id: z.string(),
					action: z.string(),
					targetType: z.string(),
					targetId: z.string().nullable(),
					detail: z.unknown().nullable(),
					createdAt: z.date(),
					actorEmail: z.string().nullable(),
				}),
			),
		}),
	},
};
