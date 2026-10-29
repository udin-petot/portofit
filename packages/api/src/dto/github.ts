import z from "zod";

export const githubRepoSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	fullName: z.string(),
	description: z.string().nullable(),
	htmlUrl: z.string(),
	language: z.string().nullable(),
	stars: z.number().int(),
	createdAt: z.string().describe("Tanggal dibuat, ISO 8601."),
	pushedAt: z.string().describe("Tanggal dorongan terakhir, ISO 8601."),
	fork: z.boolean(),
	archived: z.boolean(),
	topics: z.array(z.string()),
});

export const githubDto = {
	repos: {
		input: z.object({
			username: z
				.string()
				.min(1)
				.max(39)
				.optional()
				.describe("Akun GitHub yang dibaca. Kosongkan untuk akun GitHub yang terhubung dengan sesi ini."),
		}),
		output: z.object({
			login: z.string().describe("Login pemilik repo yang dibaca."),
			repos: z.array(githubRepoSchema),
		}),
	},
};
