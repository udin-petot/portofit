import type { User } from "better-auth";
import { protectedProcedure } from "../../context";
import { financeDto } from "../../dto/finance";
import { financeService } from "./service";

function roleOf(user: User | null | undefined) {
	return (user as { role?: string | null } | null | undefined)?.role ?? null;
}

export const financeRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/finance",
			tags: ["Admin"],
			operationId: "listFinanceEntries",
			summary: "Read the cash book",
			description:
				"Returns paid site orders and manual income or expense records in one list, plus totals for the range. Requires the admin role.",
			successDescription: "Cash book entries and their summary.",
		})
		.input(financeDto.list.input)
		.output(financeDto.list.output)
		.handler(({ context, input }) => financeService.list({ ...input, role: roleOf(context.user) })),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/finance",
			tags: ["Admin"],
			operationId: "createFinanceEntry",
			summary: "Record income or an expense",
			description:
				"Adds a manual cash book entry. Site orders appear automatically once verified, so record only money that did not come through the website. Requires the admin role.",
			successDescription: "The created entry.",
		})
		.input(financeDto.create.input)
		.output(financeDto.create.output)
		.handler(({ context, input }) =>
			financeService.create({ ...input, actorId: context.user.id, role: roleOf(context.user) }),
		),

	update: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/finance/{id}",
			tags: ["Admin"],
			operationId: "updateFinanceEntry",
			summary: "Correct a manual entry",
			description: "Edits a manual entry. Orders from the site are read-only here. Requires the admin role.",
			successDescription: "The updated entry.",
		})
		.input(financeDto.update.input)
		.output(financeDto.update.output)
		.handler(({ context, input }) =>
			financeService.update({ ...input, actorId: context.user.id, role: roleOf(context.user) }),
		),

	remove: protectedProcedure
		.route({
			method: "DELETE",
			path: "/admin/finance/{id}",
			tags: ["Admin"],
			operationId: "deleteFinanceEntry",
			summary: "Delete a manual entry",
			description: "Deletes a manual entry and leaves an audit trail. Requires the admin role.",
			successDescription: "The entry was deleted.",
		})
		.input(financeDto.remove.input)
		.output(financeDto.remove.output)
		.handler(({ context, input }) =>
			financeService.remove({ ...input, actorId: context.user.id, role: roleOf(context.user) }),
		),

	exportCsv: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/finance/export",
			tags: ["Admin"],
			operationId: "exportFinanceCsv",
			summary: "Export the cash book as CSV",
			description: "Returns the cash book for a range with income, expense and balance totals. Requires the admin role.",
			successDescription: "The CSV content.",
		})
		.input(financeDto.exportCsv.input)
		.output(financeDto.exportCsv.output)
		.handler(({ context, input }) => financeService.exportCsv({ ...input, role: roleOf(context.user) })),
};
