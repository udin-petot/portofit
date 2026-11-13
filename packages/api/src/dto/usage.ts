import { z } from "zod";
import { USAGE_FEATURES } from "../features/usage/taxonomy";

const featureKeys = Object.keys(USAGE_FEATURES) as [string, ...string[]];

export const usageDto = {
	track: {
		input: z.object({
			// Dibatasi ke daftar yang dikenal lewat enum, jadi permintaan liar tidak bisa mengotori tabel.
			feature: z.enum(featureKeys),
			source: z.enum(["web", "server"]).optional(),
		}),
		output: z.object({ recorded: z.boolean() }),
	},
	summary: {
		input: z.object({ days: z.number().int().min(1).max(365).optional() }),
		output: z.object({
			days: z.number().int(),
			since: z.string(),
			total: z.number().int(),
			features: z.array(
				z.object({
					feature: z.string(),
					label: z.string(),
					group: z.string(),
					count: z.number().int(),
					share: z.number(),
				}),
			),
			daily: z.array(z.object({ date: z.string(), count: z.number().int() })),
			lastEventAt: z.string().nullable(),
		}),
	},
};
