import type { User } from "better-auth";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../context";
import { downloadInvoice, issueInvoiceForOrder, listInvoices, previewInvoice, resendInvoiceEmail } from "./service";

function assertAdmin(user: User | null | undefined) {
	const role = (user as { role?: string | null } | null | undefined)?.role ?? null;
	if (role !== "admin") throw new ORPCError("FORBIDDEN", { message: "Khusus admin." });
}

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

	adminResend: protectedProcedure
		.route({
			method: "POST",
			path: "/invoices/resend",
			tags: ["Invoice"],
			operationId: "resendInvoiceEmail",
			summary: "Resend a receipt email (admin)",
			description: "Queues the email again without issuing a new receipt number.",
			successDescription: "The email is queued.",
		})
		.input(z.object({ invoiceId: z.string().min(1) }))
		.output(z.object({ ok: z.literal(true) }))
		.handler(async ({ context, input }) => {
			assertAdmin(context.user);
			await resendInvoiceEmail(input.invoiceId);
			return { ok: true as const };
		}),

	preview: protectedProcedure
		.route({
			method: "GET",
			path: "/invoices/preview",
			tags: ["Invoice"],
			operationId: "previewMyInvoice",
			summary: "Preview a receipt",
			description: "Returns the full receipt snapshot for the panel. Another user's receipt is reported as not found.",
			successDescription: "Receipt number, issue date, and snapshot.",
		})
		.input(z.object({ invoiceId: z.string().min(1) }))
		.output(
			z.object({
				number: z.string(),
				issuedAt: z.string(),
				snapshot: z.object({
					customerName: z.string(),
					customerEmail: z.string(),
					planName: z.string(),
					credits: z.number().int(),
					amountIdr: z.number().int(),
					uniqueCode: z.number().int(),
					totalIdr: z.number().int(),
					paymentMethod: z.string(),
					paidAt: z.string(),
					balanceAfter: z.number().int(),
				}),
			}),
		)
		.handler(({ context, input }) => previewInvoice({ userId: context.user.id, invoiceId: input.invoiceId })),

	adminIssue: protectedProcedure
		.route({
			method: "POST",
			path: "/invoices/issue",
			tags: ["Invoice"],
			operationId: "issueInvoiceForOrder",
			summary: "Issue a receipt for an existing paid order (admin)",
			description: "For orders paid before receipts existed. Uses the original verification date.",
			successDescription: "The issued receipt.",
		})
		.input(z.object({ orderId: z.string().min(1) }))
		.output(z.object({ id: z.string(), number: z.string() }))
		.handler(async ({ context, input }) => {
			assertAdmin(context.user);
			const row = await issueInvoiceForOrder(input);
			return { id: row.id, number: row.number };
		}),
};
