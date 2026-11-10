import { z } from "zod";

const messageSchema = z.object({
	id: z.string(),
	role: z.string(),
	content: z.string(),
	createdAt: z.date(),
});

const threadSchema = z.object({
	conversationId: z.string().nullable(),
	messages: z.array(messageSchema),
	escalatedAt: z.date().nullable(),
});

const sendOutputSchema = z.object({
	messages: z.array(messageSchema),
	aiFailed: z.boolean(),
	aiFailedReply: z.string().optional(),
	whatsappUrl: z.string(),
});

export const supportDto = {
	thread: { output: threadSchema },
	send: {
		input: z.object({ message: z.string().trim().min(1).max(1000) }),
		output: sendOutputSchema,
	},
	reset: { output: threadSchema },
	escalate: { output: z.object({ url: z.string() }) },
};
