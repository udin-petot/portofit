import z from "zod";
import { protectedProcedure } from "../../context";
import { quotaDto } from "../../dto/quota";
import { quotaService } from "./service";

export const quotaRouter = {
	status: protectedProcedure
		.route({
			method: "GET",
			path: "/quota/ai",
			tags: ["Quota"],
			operationId: "getAiQuota",
			summary: "My weekly AI allowance",
			description:
				"Returns how much of this week's free AI allowance is left per action, and when it resets. The week starts Monday 00:00 Jakarta time.",
			successDescription: "Used and remaining allowance per AI action.",
		})
		.input(z.object({}).optional())
		.output(quotaDto.status.output)
		.handler(({ context }) => quotaService.status(context.user.id)),
};
