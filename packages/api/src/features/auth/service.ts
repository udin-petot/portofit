import type { AuthProvider } from "@reactive-resume/auth/types";
import { ORPCError } from "@orpc/client";
import { eq } from "drizzle-orm";
import { isCustomOAuthProviderEnabled } from "@reactive-resume/auth/config";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";
import { billingService } from "../billing/service";
import { careerService } from "../career/service";
import { coverLetterService } from "../cover-letters/service";
import { listInvoices } from "../invoice/service";
import { getStorageService } from "../storage/service";

type ProviderList = Partial<Record<AuthProvider, string>>;

const providers = {
	list: (): ProviderList => {
		const providers: ProviderList = { credential: "Password", passkey: "Passkey" };

		if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.google = "Google";
		if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) providers.github = "GitHub";
		if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) providers.linkedin = "LinkedIn";
		if (isCustomOAuthProviderEnabled()) providers.custom = env.OAUTH_PROVIDER_NAME ?? "Custom OAuth";

		return providers;
	},
};

export const authService = {
	providers,

	// GDPR-style export of everything the user owns. Selects explicit columns so
	// secrets (password hashes, tokens, api keys) never leak into the export.
	exportData: async (input: { userId: string }) => {
		const [userRecord] = await db
			.select({
				id: schema.user.id,
				name: schema.user.name,
				email: schema.user.email,
				username: schema.user.username,
				displayUsername: schema.user.displayUsername,
				image: schema.user.image,
				timezone: schema.user.timezone,
				emailVerified: schema.user.emailVerified,
				createdAt: schema.user.createdAt,
				updatedAt: schema.user.updatedAt,
			})
			.from(schema.user)
			.where(eq(schema.user.id, input.userId));

		if (!userRecord) throw new ORPCError("NOT_FOUND");

		const resumes = await db
			.select({
				id: schema.resume.id,
				name: schema.resume.name,
				slug: schema.resume.slug,
				tags: schema.resume.tags,
				data: schema.resume.data,
				isPublic: schema.resume.isPublic,
				showDownloadButtons: schema.resume.showDownloadButtons,
				isLocked: schema.resume.isLocked,
				createdAt: schema.resume.createdAt,
				updatedAt: schema.resume.updatedAt,
			})
			.from(schema.resume)
			.where(eq(schema.resume.userId, input.userId));

		const coverLetters = await db.select().from(schema.coverLetter).where(eq(schema.coverLetter.userId, input.userId));
		const applications = await db.select().from(schema.application).where(eq(schema.application.userId, input.userId));
		const [orders, invoices, ledger] = await Promise.all([
			billingService.listMyOrders(input.userId, 1000),
			listInvoices(input.userId),
			billingService.ledger(input.userId, 1000),
		]);
		return {
			exportedAt: new Date().toISOString(),
			user: userRecord,
			resumes,
			coverLetters: await Promise.all(
				coverLetters.map(({ id }) => coverLetterService.getById({ id, userId: input.userId })),
			),
			applications: applications.map(({ userId: _userId, ...application }) => application),
			career: await careerService.exportData(input.userId),
			billing: {
				orders: orders.orders,
				invoices,
				ledger: ledger.entries,
			},
		};
	},

	deleteAccount: async (input: { userId: string }): Promise<void> => {
		const storageService = getStorageService();

		// Files, screenshots and PDFs live under one prefix. Purging them is part of the erasure promise, so a
		// failure must not delete the row and leave the objects behind: retry once, then keep the account so the
		// user can try again.
		let purgeError: unknown;
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				await storageService.delete(`uploads/${input.userId}`);
				purgeError = undefined;
				break;
			} catch (err) {
				purgeError = err;
			}
		}
		if (purgeError) {
			console.error("Failed to delete storage for user %s:", input.userId, purgeError);
			throw new ORPCError("BAD_GATEWAY", {
				message: "Penyimpanan sedang tidak bisa dihubungi. Coba hapus akun lagi sebentar lagi.",
			});
		}

		try {
			await db.delete(schema.user).where(eq(schema.user.id, input.userId));
		} catch (err) {
			console.error("Failed to delete user record:", err);

			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	},
};
