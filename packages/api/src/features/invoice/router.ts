import { z } from "zod";
import { protectedProcedure } from "../../context";
import { downloadInvoice, listInvoices } from "./service";

export const invoiceRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/invoices",
			tags: ["Invoice"],
			operationId: "listMyInvoices",
			summary: "List my receipts",
			description: "Returns the signed-in user's receipts, newest first.",
			successDescription: "Receipts with number, date, plan, and total.",
		})
		.input(z.object({}).optional())
		.output(
			z.object({
				items: z.array(
					z.object({
						id: z.string(),
						number: z.string(),
						issuedAt: z.string(),
						planName: z.string(),
						totalIdr: z.number().int(),
					}),
				),
			}),
		)
		.handler(async ({ context }) => ({ items: await listInvoices(context.user.id) })),

	download: protectedProcedure
		.route({
			method: "POST",
			path: "/invoices/download",
			tags: ["Invoice"],
			operationId: "downloadMyInvoice",
			summary: "Download a receipt",
			description: "Returns the receipt PDF as base64. Other users' receipts are reported as not found.",
			successDescription: "File name and base64 PDF bytes.",
		})
		.input(z.object({ invoiceId: z.string().min(1) }))
		.output(z.object({ fileName: z.string(), pdf: z.string() }))
		.handler(({ context, input }) => downloadInvoice({ userId: context.user.id, invoiceId: input.invoiceId })),
};
