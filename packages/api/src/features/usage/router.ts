import type { User } from "better-auth";
import { protectedProcedure, publicProcedure } from "../../context";
import { usageDto } from "../../dto/usage";
import { usageTrackRateLimit } from "../../middleware/rate-limit";
import { usageService } from "./service";

function roleOf(user: User | null | undefined) {
	return (user as { role?: string | null } | null | undefined)?.role ?? null;
}

export const usageRouter = {
	track: publicProcedure
		.route({
			method: "POST",
			path: "/usage/track",
			tags: ["Usage"],
			operationId: "trackUsage",
			summary: "Count one feature use",
			description:
				"Records that a feature was used. No account, no document content, no address is stored. Public because the ATS checker works without an account.",
			successDescription: "Whether the event was counted.",
		})
		.input(usageDto.track.input)
		.output(usageDto.track.output)
		.use(usageTrackRateLimit)
		.handler(({ input }) => usageService.track(input)),

	summary: protectedProcedure
		.route({
			method: "GET",
			path: "/usage/summary",
			tags: ["Usage"],
			operationId: "getUsageSummary",
			summary: "Feature usage counted for the admin page",
			description: "Totals per feature and per day. Admin only. Counts are anonymous by design.",
			successDescription: "Totals per feature and per day for the requested window.",
		})
		.input(usageDto.summary.input)
		.output(usageDto.summary.output)
		.handler(({ context, input }) => usageService.summary({ role: roleOf(context.user), days: input.days })),
};
