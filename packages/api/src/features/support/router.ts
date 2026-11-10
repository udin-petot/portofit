import { z } from "zod";
import { protectedProcedure } from "../../context";
import { supportDto } from "../../dto/support";
import { supportRequestRateLimit } from "../../middleware/rate-limit";
import { supportService } from "./service";

function identity(context: { user: { name?: string | null; email?: string | null } }) {
	return { name: context.user.name ?? "Pengguna PortoFit", email: context.user.email ?? "-" };
}

export const supportRouter = {
	thread: protectedProcedure
		.route({
			method: "GET",
			path: "/support/thread",
			tags: ["Support"],
			summary: "Get the open support conversation",
			successDescription: "The open conversation with its messages, or an empty result.",
		})
		.input(z.object({}).optional())
		.output(supportDto.thread.output)
		.handler(({ context }) => supportService.thread(context.user.id)),

	send: protectedProcedure
		.route({
			method: "POST",
			path: "/support/messages",
			tags: ["Support"],
			summary: "Send a support message",
			successDescription: "The stored messages and the WhatsApp fallback link.",
		})
		.input(supportDto.send.input)
		.use(supportRequestRateLimit)
		.output(supportDto.send.output)
		.handler(({ context, input }) =>
			supportService.send({ userId: context.user.id, identity: identity(context), message: input.message }),
		),

	reset: protectedProcedure
		.route({
			method: "POST",
			path: "/support/reset",
			tags: ["Support"],
			summary: "Close the open conversation and start a new one",
			successDescription: "An empty conversation.",
		})
		.input(z.object({}).optional())
		.output(supportDto.reset.output)
		.handler(({ context }) => supportService.reset(context.user.id)),

	escalate: protectedProcedure
		.route({
			method: "POST",
			path: "/support/escalate",
			tags: ["Support"],
			summary: "Build the WhatsApp link for the admin",
			successDescription: "A prefilled WhatsApp URL.",
		})
		.input(z.object({}).optional())
		.output(supportDto.escalate.output)
		.handler(({ context }) =>
			supportService.escalate({ userId: context.user.id, identity: identity(context) }),
		),
};
