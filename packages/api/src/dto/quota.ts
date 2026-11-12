import z from "zod";

export const aiFeatureSchema = z
	.enum(["review", "improve", "coach", "job_match"])
	.describe("Jenis aksi AI: review tulis, perbaikan baris, pendamping, atau job match mendalam.");

export const quotaLineSchema = z.object({
	feature: aiFeatureSchema,
	limit: z.number().int().describe("Jatah pekan ini."),
	used: z.number().int().describe("Sudah dipakai pekan ini."),
	remaining: z.number().int().describe("Sisa jatah pekan ini."),
});

export const quotaDto = {
	status: {
		output: z.object({
			periodStart: z.date().describe("Awal pekan berjalan, Senin 00.00 WIB."),
			resetAt: z.date().describe("Jatah kembali penuh pada waktu ini."),
			features: z.array(quotaLineSchema),
		}),
	},
};
