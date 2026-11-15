import type { WorkspaceTab } from "@reactive-resume/schema/career";
import { tool, type ToolSet } from "ai";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import z from "zod";
import { careerSystemPromptTemplate } from "@reactive-resume/ai/prompts";
import { db } from "@reactive-resume/db/client";
import {
	application,
	careerArtifact,
	careerNotification,
	careerOpportunity,
	careerSchedule,
} from "@reactive-resume/db/schema";
import { careerStoryInputSchema, factCategorySchema } from "@reactive-resume/schema/career";
import { careerActionProposals } from "./action-proposals";
import { CAREER_PRODUCT_GUIDE } from "./guide";
import { careerService, modelFact } from "./service";

type CareerToolsInput = {
	userId: string;
	threadId?: string;
	context: Awaited<ReturnType<typeof careerService.context>>;
	shareApplication: boolean;
	shareMemory: boolean;
	tab: WorkspaceTab | undefined;
	sourceMessageId: string | undefined;
	/** The document the user attached to this turn, if any. Facts read from it point here. */
	sourceAttachment?: { id: string; filename: string } | undefined;
};

const TABS: Record<WorkspaceTab, string> = {
	fit: "checking how the role fits: its requirements against their evidence",
	apply: "writing answers for the application form",
	prepare: "preparing for the next interview round",
	practise:
		"practising interview answers: ask one question at a time and give feedback on the answer they actually gave",
	debrief: "writing down how a real interview went",
	messages: "reading and replying to messages from the employer",
	saved: "looking back at what was saved for this application",
};

const MEMORY = {
	ask: "When the latest user message states something lasting about them (experience, a skill, an accomplishment, a preference), call remember_fact with their exact words. For a document attached to that message, call remember_fact with one concise fact grounded in the document. The user sees it as a proposal and decides; never say it was saved.",
	auto: "When the latest user message states something lasting about them (experience, a skill, an accomplishment, a preference), call remember_fact with their exact words; it is saved to their Knowledge. Facts read from an attached document are proposed for the user to approve.",
	off: "Don't remember facts; the user switched memory off.",
};

/** Tool responses cannot rely on history compaction: the latest turn must fit by itself. */
function boundedItems<T>(items: T[], budget: number) {
	let remaining = budget;
	const selected: T[] = [];
	for (const item of items) {
		const size = JSON.stringify(item).length;
		if (size > remaining) continue;
		selected.push(item);
		remaining -= size;
	}
	return { items: selected, truncated: selected.length < items.length };
}

type ApplicationRow = typeof application.$inferSelect;
type InterviewEntry = Extract<ApplicationRow["activity"][number], { type: "interview" }>;

const DAY_MS = 86_400_000;

/** Interviews still to come, soonest first; no descriptions or private document contents. */
function upcomingInterviews(rows: ApplicationRow[], days: number, now = new Date()) {
	const until = now.getTime() + days * DAY_MS;
	return rows
		.flatMap((row) =>
			row.activity.flatMap((entry) =>
				entry.type === "interview" &&
				new Date(entry.at).getTime() >= now.getTime() &&
				new Date(entry.at).getTime() <= until
					? [
							{
								applicationId: row.id,
								company: row.company,
								role: row.role,
								at: entry.at,
								kind: entry.kind,
								durationMinutes: entry.durationMinutes,
								location: entry.location ?? null,
							},
						]
					: [],
			),
		)
		.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function nextInterview(row: ApplicationRow, now = new Date()): InterviewEntry | null {
	return (
		row.activity
			.filter(
				(entry): entry is InterviewEntry => entry.type === "interview" && new Date(entry.at).getTime() >= now.getTime(),
			)
			.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())[0] ?? null
	);
}

function applicationSummary(row: ApplicationRow, now = new Date()) {
	const interview = nextInterview(row, now);
	return {
		id: row.id,
		company: row.company,
		role: row.role,
		status: row.status,
		location: row.location,
		salary: row.salary,
		sourceUrl: row.sourceUrl,
		requirements: row.requirements.slice(0, 12),
		updatedAt: row.updatedAt.toISOString(),
		nextInterview: interview
			? {
					at: interview.at,
					kind: interview.kind,
					durationMinutes: interview.durationMinutes,
					location: interview.location ?? null,
				}
			: null,
	};
}

export function buildCareerInstructions(
	input: Pick<CareerToolsInput, "context" | "shareApplication" | "shareMemory" | "tab"> & {
		offers?: Array<{ application: { company: string; role: string } | null; data: unknown }>;
	},
) {
	const { context } = input;
	const company = context.application?.company;
	const task = context.application
		? `Help with this one application (${context.application.role} at ${company}). ${input.tab ? `The user is ${TABS[input.tab]}.` : ""}`
		: "Help with the whole search, across applications. Use list_opportunities to compare them.";
	const selected = {
		...(input.shareApplication
			? { application: context.application, resume: context.resume, letter: context.letter }
			: {}),
		...(input.shareMemory
			? { preferences: context.profile, facts: context.facts.slice(0, 30), stories: context.stories.slice(0, 8) }
			: {}),
		// Saved offers the user chose to compare: terms in their own currency and pay period.
		...(input.offers?.length
			? { offers: input.offers.map(({ application, data }) => ({ ...application, terms: data })) }
			: {}),
	};
	return careerSystemPromptTemplate
		.replace("{{TASK}}", task)
		.replace("{{MEMORY}}", input.shareMemory ? MEMORY[context.profile.memoryMode] : MEMORY.off)
		.replace("{{PRODUCT}}", CAREER_PRODUCT_GUIDE)
		.replace("{{CONTEXT}}", JSON.stringify(selected));
}

export function buildCareerTools(input: CareerToolsInput): ToolSet {
	const scope = { userId: input.userId, applicationId: input.context.application?.id ?? null };
	const tools: ToolSet = {};
	if (input.shareApplication && input.shareMemory && scope.applicationId)
		tools.read_real_interview_history = tool({
			description: "Read the user's own debriefs of real interviews for this application. Practice is excluded.",
			inputSchema: z.object({}),
			execute: async () => {
				const rows = await db
					.select({ at: careerArtifact.createdAt, data: careerArtifact.data })
					.from(careerArtifact)
					.where(
						and(eq(careerArtifact.userId, input.userId), eq(careerArtifact.applicationId, scope.applicationId ?? "")),
					)
					.orderBy(desc(careerArtifact.createdAt))
					.limit(30);
				// Saved debriefs obey the same privacy cutoff as replayed chat messages.
				const cutoff = await careerService.memoryCutoff(input.userId);
				return rows.filter((row) => row.data.kind === "debrief" && (!cutoff || row.at > cutoff));
			},
		});
	if (input.shareMemory) {
		tools.search_career_knowledge = tool({
			description: "Find switched-on facts and STARR stories. Facts private to another application never appear.",
			inputSchema: z.object({ query: z.string().max(500) }),
			execute: async ({ query }) => {
				const facts = boundedItems(
					(await careerService.facts({ ...scope, query })).filter((fact) => fact.status === "active").map(modelFact),
					12_000,
				);
				const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
				const matches = input.context.stories.filter(
					(story) =>
						!terms.length || terms.some((term) => JSON.stringify(story.data).toLocaleLowerCase().includes(term)),
				);
				const stories = boundedItems(matches, 16_000);
				const truncated = facts.truncated || stories.truncated;
				return {
					facts: facts.items,
					stories: stories.items,
					truncated,
					hint: truncated
						? "Results are excerpts. Refine the query to find other supporting facts or stories; do not infer that omitted evidence is absent."
						: null,
				};
			},
		});
		tools.save_story = tool({
			description:
				"Save a STARR story the user agreed to, grounded in existing fact IDs. Leave Result or Reflection empty rather than inventing them.",
			inputSchema: careerStoryInputSchema
				.omit({ applicationId: true })
				.extend({ factIds: z.array(z.string()).min(1).max(30) }),
			execute: (story) =>
				careerService.saveStory(
					input.userId,
					{ ...story, applicationId: scope.applicationId },
					undefined,
					input.context.memoryVersion,
				),
		});
		const mode = input.context.profile.memoryMode;
		const sourceMessageId = input.sourceMessageId;
		if (sourceMessageId && mode !== "off")
			tools.remember_fact = tool({
				description:
					"Remember an explicit statement about the user (their experience, skills, accomplishments or preferences), quoted verbatim from their latest message. When the latest message has an attached document, propose one concise fact grounded in that document instead. Never remember events in an application (an offer, a salary they were quoted, an interview time, what an employer said), hypotheticals, rewrites, generated text, mock answers or other people's claims.",
				inputSchema: z.object({ quote: z.string().trim().min(1).max(2000), category: factCategorySchema }),
				execute: async ({ quote, category }) => {
					const source = input.sourceAttachment
						? ({ kind: "attachment" as const, id: input.sourceAttachment.id, quote } as const)
						: ({ kind: "user-message" as const, id: sourceMessageId, quote } as const);
					const fact = {
						applicationId: scope.applicationId,
						text: quote,
						category,
						source,
					};
					// Ask first: the reply shows the fact as a proposal; the user's Remember saves it.
					// A fact read from a document always needs that approval, even in auto mode.
					if (mode === "ask" || input.sourceAttachment) return { status: "proposed" as const, fact };
					const saved = await careerService.saveFact(input.userId, fact, true);
					return saved ? { status: "saved" as const, fact, id: saved.id } : { status: "skipped" as const, fact };
				},
			});
	}
	if (!scope.applicationId && input.shareApplication)
		tools.list_opportunities = tool({
			description: "Read summaries of the user's applications for comparisons across their search.",
			inputSchema: z.object({}),
			execute: () =>
				db
					.select({
						id: application.id,
						company: application.company,
						role: application.role,
						status: application.status,
						location: application.location,
						salary: application.salary,
						requirements: application.requirements,
					})
					.from(application)
					.where(eq(application.userId, input.userId))
					.orderBy(desc(application.updatedAt))
					.limit(50),
		});
	if (input.shareApplication) {
		tools.list_applications = tool({
			description:
				"Read the user's applications and saved jobs: status, place, salary, next interview, and source. Use this to compare applications or answer what they already have.",
			inputSchema: z.object({}),
			execute: async () => {
				const rows = await db
					.select()
					.from(application)
					.where(eq(application.userId, input.userId))
					.orderBy(desc(application.updatedAt))
					.limit(50);
				return rows.map((row) => applicationSummary(row));
			},
		});
		tools.get_application = tool({
			description:
				"Read one of the user's applications in more detail, including its upcoming interviews and saved offers. It never returns another user's data.",
			inputSchema: z.object({ id: z.string().trim().min(1).max(64) }),
			execute: async ({ id }) => {
				const [row] = await db
					.select()
					.from(application)
					.where(and(eq(application.id, id), eq(application.userId, input.userId)));
				if (!row) return { found: false as const };
				const artifacts = await db
					.select({ id: careerArtifact.id, data: careerArtifact.data, createdAt: careerArtifact.createdAt })
					.from(careerArtifact)
					.where(and(eq(careerArtifact.userId, input.userId), eq(careerArtifact.applicationId, row.id)));
				const offers = artifacts
					.filter((item) => item.data.kind === "offer")
					.map((item) => ({ id: item.id, terms: item.data, createdAt: item.createdAt.toISOString() }));
				return {
					found: true as const,
					...applicationSummary(row),
					jobDescription: row.jobDescription?.slice(0, 4_000) ?? null,
					notes: row.notes,
					tags: row.tags,
					interviews: upcomingInterviews([row], 365),
					offers,
				};
			},
		});
		tools.list_saved_offers = tool({
			description:
				"Read the user's saved offers, with terms in their original currency and pay period. Use this to compare offers or answer what they received.",
			inputSchema: z.object({}),
			execute: async () => {
				const items = await careerService.savedItems({ userId: input.userId, kind: "offer" });
				return items.slice(0, 20).map((item) => ({
					id: item.id,
					application: item.application,
					terms: item.data,
					createdAt: item.createdAt.toISOString(),
				}));
			},
		});
		tools.list_calendar = tool({
			description:
				"Read the user's upcoming interviews and career schedules. Times are ISO strings; use the user's timezone from preferences when explaining them.",
			inputSchema: z.object({ days: z.number().int().min(1).max(90).default(30) }),
			execute: async ({ days }) => {
				const rows = await db
					.select()
					.from(application)
					.where(eq(application.userId, input.userId))
					.orderBy(desc(application.updatedAt))
					.limit(100);
				const now = new Date();
				const schedules = await db
					.select({
						id: careerSchedule.id,
						kind: careerSchedule.kind,
						query: careerSchedule.query,
						nextRunAt: careerSchedule.nextRunAt,
						enabled: careerSchedule.enabled,
					})
					.from(careerSchedule)
					.where(and(eq(careerSchedule.userId, input.userId), gte(careerSchedule.nextRunAt, now)))
					.orderBy(careerSchedule.nextRunAt)
					.limit(30);
				return {
					interviews: upcomingInterviews(rows, days, now),
					schedules: schedules.map((item) => ({ ...item, nextRunAt: item.nextRunAt.toISOString() })),
				};
			},
		});
		tools.list_career_today = tool({
			description:
				"Read what needs the user now: unread career notices, upcoming interviews, recent discovered roles, schedules, and offers waiting for a decision.",
			inputSchema: z.object({}),
			execute: async () => {
				const now = new Date();
				const [applications, notifications, opportunities, schedules, offers] = await Promise.all([
					db
						.select()
						.from(application)
						.where(eq(application.userId, input.userId))
						.orderBy(desc(application.updatedAt))
						.limit(100),
					db
						.select({ id: careerNotification.id, notice: careerNotification.notice, url: careerNotification.url })
						.from(careerNotification)
						.where(and(eq(careerNotification.userId, input.userId), isNull(careerNotification.readAt)))
						.orderBy(desc(careerNotification.createdAt))
						.limit(10),
					db
						.select({
							id: careerOpportunity.id,
							company: careerOpportunity.company,
							role: careerOpportunity.role,
							url: careerOpportunity.url,
							location: careerOpportunity.location,
							lastSeenAt: careerOpportunity.lastSeenAt,
						})
						.from(careerOpportunity)
						.where(and(eq(careerOpportunity.userId, input.userId), isNull(careerOpportunity.dismissedAt)))
						.orderBy(desc(careerOpportunity.lastSeenAt))
						.limit(5),
					db
						.select({
							id: careerSchedule.id,
							kind: careerSchedule.kind,
							query: careerSchedule.query,
							nextRunAt: careerSchedule.nextRunAt,
							enabled: careerSchedule.enabled,
						})
						.from(careerSchedule)
						.where(and(eq(careerSchedule.userId, input.userId), gte(careerSchedule.nextRunAt, now)))
						.orderBy(careerSchedule.nextRunAt)
						.limit(10),
					careerService.savedItems({ userId: input.userId, kind: "offer" }),
				]);
				return {
					notifications,
					upcomingInterviews: upcomingInterviews(applications, 7, now),
					newRoles: opportunities.map((item) => ({ ...item, lastSeenAt: item.lastSeenAt.toISOString() })),
					schedules: schedules.map((item) => ({ ...item, nextRunAt: item.nextRunAt.toISOString() })),
					offersWaiting: offers.slice(0, 5).map((item) => ({
						id: item.id,
						application: item.application,
						terms: item.data,
					})),
				};
			},
		});
	}

	const safeHttpUrl = z
		.string()
		.trim()
		.max(2_000)
		.refine((value) => {
			try {
				const url = new URL(value);
				return url.protocol === "http:" || url.protocol === "https:";
			} catch {
				return false;
			}
		}, "Use an http or https URL.");
	const proposedJob = z.object({
		role: z.string().trim().min(1).max(200),
		company: z.string().trim().min(1).max(200),
		sourceUrl: safeHttpUrl.optional(),
		location: z.string().trim().max(200).optional(),
		salary: z.string().trim().max(200).optional(),
		requirements: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
		description: z.string().trim().max(3_000).optional(),
		reason: z.string().trim().max(500).optional(),
	});
	const threadId = input.threadId;
	let proposalIssued = false;
	if (input.shareApplication && threadId)
		tools.propose_save_jobs = tool({
			description:
				"Propose up to five jobs to save as applications with status saved. This does not save anything: the user must accept a confirmation card. Include the source URL and why each job fits. Never claim it was saved.",
			inputSchema: z.object({ jobs: z.array(proposedJob).min(1).max(5) }),
			execute: async ({ jobs }) => {
				if (proposalIssued)
					throw new Error("Only one save proposal is allowed per reply. Ask the user to handle this card first.");
				proposalIssued = true;
				const seen = new Set<string>();
				const unique: Array<(typeof jobs)[number] & { duplicateApplicationId: string | null }> = [];
				for (const job of jobs) {
					const key = job.sourceUrl
						? `url:${job.sourceUrl.toLowerCase()}`
						: `name:${job.company.toLowerCase()}:${job.role.toLowerCase()}`;
					if (seen.has(key)) continue;
					seen.add(key);
					const [duplicate] = await db
						.select({ id: application.id })
						.from(application)
						.where(
							and(
								eq(application.userId, input.userId),
								job.sourceUrl
									? eq(application.sourceUrl, job.sourceUrl)
									: and(eq(application.company, job.company), eq(application.role, job.role)),
							),
						)
						.limit(1);
					unique.push({ ...job, duplicateApplicationId: duplicate?.id ?? null });
				}
				if (unique.length === 0) throw new Error("No new jobs to propose; all of them are already in Applications.");
				const proposal = await careerActionProposals.create({
					userId: input.userId,
					threadId,
					jobs: unique.map((job) => ({
						role: job.role,
						company: job.company,
						sourceUrl: job.sourceUrl ?? null,
						location: job.location ?? null,
						salary: job.salary ?? null,
						requirements: job.requirements ?? [],
						description: job.description ?? null,
						reason: job.reason ?? null,
						duplicateApplicationId: job.duplicateApplicationId ?? null,
					})),
				});
				return {
					status: "proposed" as const,
					proposalId: proposal.id,
					expiresAt: proposal.expiresAt.toISOString(),
					jobs: proposal.jobs,
				};
			},
		});
	return tools;
}
