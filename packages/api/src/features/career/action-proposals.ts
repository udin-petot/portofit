import type { CareerActionJob } from "@reactive-resume/db/schema";
import { ORPCError } from "@orpc/client";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { application, careerActionProposal } from "@reactive-resume/db/schema";
import { generateId } from "@reactive-resume/utils/string";

const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_JOBS = 5;
const MAX_PROPOSALS_PER_HOUR = 10;
const MAX_SAVED_PER_DAY = 50;

function duplicateWhere(userId: string, job: CareerActionJob) {
	const byUrl = job.sourceUrl ? eq(application.sourceUrl, job.sourceUrl) : undefined;
	const byName = and(eq(application.company, job.company), eq(application.role, job.role));
	return and(eq(application.userId, userId), byUrl ?? byName);
}

/**
 * Accepting a proposal is the only write path. It takes an opaque proposal id, re-checks the owner and status, and
 * creates every application in one transaction. The browser never supplies the job fields used here.
 */
export const careerActionProposals = {
	async create(input: { userId: string; threadId: string; jobs: CareerActionJob[] }) {
		if (input.jobs.length === 0 || input.jobs.length > MAX_JOBS)
			throw new ORPCError("BAD_REQUEST", { message: `Save between 1 and ${MAX_JOBS} jobs at a time.` });

		const now = new Date();
		const since = new Date(now.getTime() - 60 * 60 * 1000);
		const [recent] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(careerActionProposal)
			.where(and(eq(careerActionProposal.userId, input.userId), sql`${careerActionProposal.createdAt} >= ${since}`));
		if ((recent?.count ?? 0) >= MAX_PROPOSALS_PER_HOUR)
			throw new ORPCError("TOO_MANY_REQUESTS", { message: "Too many save proposals this hour. Try again later." });

		const [row] = await db
			.insert(careerActionProposal)
			.values({
				userId: input.userId,
				threadId: input.threadId,
				jobs: input.jobs,
				expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS),
				status: "pending",
			})
			.returning();
		if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Couldn't create the save proposal." });
		return row;
	},

	async accept(input: { userId: string; id: string }) {
		return db.transaction(async (tx) => {
			const [proposal] = await tx
				.select()
				.from(careerActionProposal)
				.where(and(eq(careerActionProposal.id, input.id), eq(careerActionProposal.userId, input.userId)))
				.for("update");
			if (!proposal) throw new ORPCError("NOT_FOUND");
			if (proposal.status !== "pending")
				throw new ORPCError("CONFLICT", { message: "This proposal has already been handled." });
			if (proposal.expiresAt.getTime() <= Date.now()) {
				await tx
					.update(careerActionProposal)
					.set({ status: "expired", updatedAt: new Date() })
					.where(eq(careerActionProposal.id, proposal.id));
				throw new ORPCError("BAD_REQUEST", { message: "This proposal has expired. Ask the coach again." });
			}

			const startOfDay = new Date();
			startOfDay.setUTCHours(0, 0, 0, 0);
			const [savedToday] = await tx
				.select({ count: sql<number>`count(*)::int` })
				.from(application)
				.where(
					and(
						eq(application.userId, input.userId),
						sql`${application.source} = 'AI Coach'`,
						sql`${application.createdAt} >= ${startOfDay}`,
					),
				);
			const remaining = MAX_SAVED_PER_DAY - (savedToday?.count ?? 0);
			if (remaining < proposal.jobs.length)
				throw new ORPCError("TOO_MANY_REQUESTS", { message: "Daily save limit reached. Try again tomorrow." });

			const applicationIds: string[] = [];
			let created = 0;
			let existing = 0;
			for (const job of proposal.jobs.slice(0, MAX_JOBS)) {
				const [duplicate] = await tx
					.select({ id: application.id })
					.from(application)
					.where(duplicateWhere(input.userId, job))
					.limit(1);
				if (duplicate) {
					applicationIds.push(duplicate.id);
					existing++;
					continue;
				}
				const id = generateId();
				await tx.insert(application).values({
					id,
					userId: input.userId,
					company: job.company,
					role: job.role,
					location: job.location,
					salary: job.salary,
					sourceUrl: job.sourceUrl,
					source: "AI Coach",
					jobDescription: job.description,
					requirements: job.requirements,
					status: "saved",
					activity: [{ id: generateId(), type: "stage", stage: "saved", at: new Date() }],
					appliedAt: new Date(),
				});
				applicationIds.push(id);
				created++;
			}

			await tx
				.update(careerActionProposal)
				.set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
				.where(eq(careerActionProposal.id, proposal.id));
			return { applicationIds, created, existing };
		});
	},

	async dismiss(input: { userId: string; id: string }) {
		const [row] = await db
			.update(careerActionProposal)
			.set({ status: "dismissed", updatedAt: new Date() })
			.where(
				and(
					eq(careerActionProposal.id, input.id),
					eq(careerActionProposal.userId, input.userId),
					eq(careerActionProposal.status, "pending"),
				),
			)
			.returning({ id: careerActionProposal.id });
		if (!row) throw new ORPCError("NOT_FOUND");
		return { ok: true as const };
	},
};
