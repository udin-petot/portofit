import { ORPCError } from "@orpc/server";
import { and, asc, eq } from "drizzle-orm";
import { generateText } from "ai";
import { db } from "@reactive-resume/db/client";
import { supportConversation, supportMessage } from "@reactive-resume/db/schema";
import { SUPPORT_FAQ } from "@reactive-resume/utils/support-faq";
import { getModel } from "../ai/service";
import { aiProvidersService } from "../ai-providers/service";
import { billingService } from "../billing/service";
import { enforceSupportGuard } from "./guard";
import { buildEscalationText, isConversationFull } from "./policy";
import { buildSupportPrompt } from "./prompt";

/** Nomor admin. Sama dengan yang dipakai halaman harga di apps/web. */
const SUPPORT_WHATSAPP_NUMBER = "6281939948769";

const AI_FAILED_REPLY =
	"Maaf, bantuan otomatis sedang tidak bisa menjawab. Silakan lanjut ke WhatsApp admin di bawah ini.";

const FAQ_TEXT = SUPPORT_FAQ.map((item) => item.answer).join(" ");

type Identity = { name: string; email: string };

type MessageRow = { id: string; role: string; content: string; createdAt: Date };

function whatsappUrl(text: string): string {
	return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

async function findOpen(userId: string) {
	const [row] = await db
		.select()
		.from(supportConversation)
		.where(and(eq(supportConversation.userId, userId), eq(supportConversation.status, "open")))
		.limit(1);

	return row ?? null;
}

async function openConversation(userId: string) {
	const existing = await findOpen(userId);
	if (existing) return existing;

	try {
		const [row] = await db.insert(supportConversation).values({ userId }).returning();
		if (!row) throw new Error("SUPPORT_CONVERSATION_CREATE_FAILED");
		return row;
	} catch {
		// Dua tab bisa membuat percakapan bersamaan. Indeks unik menolak yang kedua, jadi baca yang menang.
		const raced = await findOpen(userId);
		if (raced) return raced;
		throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Gagal membuka percakapan bantuan." });
	}
}

function messagesOf(conversationId: string): Promise<MessageRow[]> {
	return db
		.select({
			id: supportMessage.id,
			role: supportMessage.role,
			content: supportMessage.content,
			createdAt: supportMessage.createdAt,
		})
		.from(supportMessage)
		.where(eq(supportMessage.conversationId, conversationId))
		.orderBy(asc(supportMessage.createdAt));
}

export const supportService = {
	async thread(userId: string) {
		const conversation = await findOpen(userId);
		if (!conversation) return { conversationId: null, messages: [] as MessageRow[], escalatedAt: null };

		return {
			conversationId: conversation.id,
			messages: await messagesOf(conversation.id),
			escalatedAt: conversation.escalatedAt,
		};
	},

	async send(input: { userId: string; identity: Identity; message: string }) {
		const conversation = await openConversation(input.userId);
		const existing = await messagesOf(conversation.id);

		if (isConversationFull(existing.length)) {
			throw new ORPCError("CONFLICT", {
				message: "Percakapan sudah penuh.",
				data: { code: "CONVERSATION_FULL" },
			});
		}

		const [userMessage] = await db
			.insert(supportMessage)
			.values({ conversationId: conversation.id, role: "user", content: input.message })
			.returning();

		const userAmounts = [...existing, ...(userMessage ? [userMessage] : [])]
			.filter((row) => row.role === "user")
			.map((row) => row.content);

		const escalation = whatsappUrl(
			buildEscalationText({
				name: input.identity.name,
				email: input.identity.email,
				lastUserMessage: input.message,
			}),
		);

		try {
			const provider = await aiProvidersService.getDefaultRunnable({ userId: input.userId });
			if (!provider) throw new Error("SUPPORT_NO_PROVIDER");

			const { plans } = await billingService.listPlans();
			const pricesIdr = plans.map((plan) => plan.priceIdr);
			const prompt = buildSupportPrompt({
				prices: plans.map((plan) => ({ code: plan.code, priceIdr: plan.priceIdr })),
				userAmounts,
			});

			const { text } = await generateText({
				model: getModel({
					provider: provider.provider,
					model: provider.model,
					apiKey: provider.apiKey,
					baseURL: provider.baseURL ?? undefined,
				}),
				system: prompt,
				prompt: input.message,
				temperature: 0.2,
			});

			const safe = enforceSupportGuard(text, { faqText: FAQ_TEXT, pricesIdr, userAmounts });
			const [assistantMessage] = await db
				.insert(supportMessage)
				.values({ conversationId: conversation.id, role: "assistant", content: safe.text })
				.returning();

			return {
				messages: [...(userMessage ? [userMessage] : []), ...(assistantMessage ? [assistantMessage] : [])],
				aiFailed: false,
				whatsappUrl: escalation,
			};
		} catch {
			return {
				messages: userMessage ? [userMessage] : [],
				aiFailed: true,
				aiFailedReply: AI_FAILED_REPLY,
				whatsappUrl: escalation,
			};
		}
	},

	async reset(userId: string) {
		await db
			.update(supportConversation)
			.set({ status: "closed", updatedAt: new Date() })
			.where(and(eq(supportConversation.userId, userId), eq(supportConversation.status, "open")));

		return this.thread(userId);
	},

	async escalate(input: { userId: string; identity: Identity }) {
		const conversation = await findOpen(input.userId);
		if (!conversation) throw new ORPCError("BAD_REQUEST", { message: "Belum ada percakapan." });

		const messages = await messagesOf(conversation.id);
		const lastUserMessage = [...messages].reverse().find((row) => row.role === "user")?.content ?? null;

		await db
			.update(supportConversation)
			.set({ escalatedAt: new Date(), updatedAt: new Date() })
			.where(eq(supportConversation.id, conversation.id));

		return {
			url: whatsappUrl(
				buildEscalationText({
					name: input.identity.name,
					email: input.identity.email,
					lastUserMessage,
				}),
			),
		};
	},
};
