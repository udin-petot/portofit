import type { User } from "better-auth";
import { protectedProcedure, publicProcedure } from "../../context";
import { billingDto } from "../../dto/billing";
import { billingService } from "./service";

function roleOf(user: User | null | undefined) {
	return (user as { role?: string | null } | null | undefined)?.role ?? null;
}

export const billingRouter = {
	plans: publicProcedure
		.route({
			method: "GET",
			path: "/billing/plans",
			tags: ["Billing"],
			operationId: "listBillingPlans",
			summary: "List price plans",
			description: "Returns every active plan. Public: the pricing page renders before sign-in.",
			successDescription: "The active plans, cheapest first.",
		})
		.output(billingDto.listPlans.output)
		.handler(() => billingService.listPlans()),

	balances: protectedProcedure
		.route({
			method: "GET",
			path: "/billing/balances",
			tags: ["Billing"],
			operationId: "getBillingBalances",
			summary: "Get my credit balances",
			description: "Returns the signed-in user's remaining credits for applications and interviews.",
			successDescription: "Remaining credits per kind.",
		})
		.output(billingDto.balances.output)
		.handler(({ context }) => billingService.balances(context.user.id)),

	myOrders: protectedProcedure
		.route({
			method: "GET",
			path: "/billing/orders",
			tags: ["Billing"],
			operationId: "listMyBillingOrders",
			summary: "List my orders",
			description: "Returns the signed-in user's latest orders, newest first.",
			successDescription: "A list of orders.",
		})
		.input(billingDto.listMyOrders.input)
		.output(billingDto.listMyOrders.output)
		.handler(({ context, input }) => billingService.listMyOrders(context.user.id, input.limit)),

	createOrder: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/orders",
			tags: ["Billing"],
			operationId: "createBillingOrder",
			summary: "Create an order",
			description:
				"Creates a pending order for a plan. The total includes a 0-999 unique code so the transfer is easy to match.",
			successDescription: "The created order.",
		})
		.input(billingDto.createOrder.input)
		.output(billingDto.createOrder.output)
		.handler(({ context, input }) => billingService.createOrder(context.user.id, input.planCode)),

	attachProof: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/orders/{orderId}/proof",
			tags: ["Billing"],
			operationId: "attachBillingProof",
			summary: "Attach a payment proof",
			description:
				"Attaches an uploaded file to the caller's own order and moves it to waiting-for-verification. Use the storage upload endpoint first.",
			successDescription: "The updated order.",
		})
		.input(billingDto.attachProof.input)
		.output(billingDto.attachProof.output)
		.handler(({ context, input }) => billingService.attachProof({ ...input, userId: context.user.id })),

	consumeCredit: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/credits/consume",
			tags: ["Billing"],
			operationId: "consumeBillingCredit",
			summary: "Consume one credit",
			description: "Spends one credit of the given kind. Returns 403 with code CREDIT_REQUIRED when the balance is empty.",
			successDescription: "The remaining balance.",
		})
		.input(billingDto.consumeCredit.input)
		.output(billingDto.consumeCredit.output)
		.handler(({ context, input }) => billingService.consumeCredit({ ...input, userId: context.user.id })),

	ledger: protectedProcedure
		.route({
			method: "GET",
			path: "/billing/credits/ledger",
			tags: ["Billing"],
			operationId: "listBillingLedger",
			summary: "List my credit history",
			description: "Returns where the signed-in user's credits came from and what they were spent on, newest first.",
			successDescription: "Credit ledger entries.",
		})
		.input(billingDto.ledger.input)
		.output(billingDto.ledger.output)
		.handler(({ context, input }) => billingService.ledger(context.user.id, input.limit)),

	adminSummary: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/billing/summary",
			tags: ["Admin"],
			operationId: "getBillingAdminSummary",
			summary: "Billing dashboard numbers",
			description: "Counts and revenue for the admin panel. Requires the admin role.",
			successDescription: "Billing totals.",
		})
		.output(billingDto.adminSummary.output)
		.handler(({ context }) => billingService.adminSummary(roleOf(context.user))),

	adminAnalytics: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/billing/analytics",
			tags: ["Admin"],
			operationId: "adminBillingAnalytics",
			summary: "Read dashboard analytics",
			description:
				"Daily revenue, signups, order status mix and plan performance for the admin console. Requires the admin role.",
			successDescription: "Analytics for the requested window.",
		})
		.input(billingDto.adminAnalytics.input)
		.output(billingDto.adminAnalytics.output)
		.handler(({ context, input }) => billingService.adminAnalytics({ ...input, role: roleOf(context.user) })),

	adminOrders: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/billing/orders",
			tags: ["Admin"],
			operationId: "adminListBillingOrders",
			summary: "List orders for review",
			description: "Returns orders, optionally filtered by status. Requires the admin role.",
			successDescription: "Orders, newest first.",
		})
		.input(billingDto.adminListOrders.input)
		.output(billingDto.adminListOrders.output)
		.handler(({ context, input }) => billingService.adminListOrders({ ...input, role: roleOf(context.user) })),

	adminOrderProof: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/billing/orders/{orderId}/proof",
			tags: ["Admin"],
			operationId: "adminGetBillingOrderProof",
			summary: "Read an order's payment proof",
			description:
				"Returns the buyer's uploaded payment proof as a data URL so an admin can check it before verifying. The file is private, so this is the only way to see it. Requires the admin role.",
			successDescription: "The proof file, base64 encoded.",
		})
		.input(billingDto.adminOrderProof.input)
		.output(billingDto.adminOrderProof.output)
		.handler(({ context, input }) =>
			billingService.adminOrderProof({ orderId: input.orderId, role: roleOf(context.user) }),
		),

	adminVerifyOrder: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/billing/orders/{orderId}/verify",
			tags: ["Admin"],
			operationId: "adminVerifyBillingOrder",
			summary: "Verify an order",
			description: "Marks the order paid and credits the buyer. Requires the admin role.",
			successDescription: "The verified order.",
		})
		.input(billingDto.adminVerifyOrder.input)
		.output(billingDto.adminVerifyOrder.output)
		.handler(({ context, input }) =>
			billingService.adminVerifyOrder({ orderId: input.orderId, actorId: context.user.id, role: roleOf(context.user) }),
		),

	adminRejectOrder: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/billing/orders/{orderId}/reject",
			tags: ["Admin"],
			operationId: "adminRejectBillingOrder",
			summary: "Reject an order",
			description: "Rejects the order with a reason the buyer can read. Requires the admin role.",
			successDescription: "The rejected order.",
		})
		.input(billingDto.adminRejectOrder.input)
		.output(billingDto.adminRejectOrder.output)
		.handler(({ context, input }) =>
			billingService.adminRejectOrder({ ...input, actorId: context.user.id, role: roleOf(context.user) }),
		),

	adminUsers: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/billing/users",
			tags: ["Admin"],
			operationId: "adminListBillingUsers",
			summary: "List users with balances",
			description: "Searches users by email or name and includes their credit balances. Requires the admin role.",
			successDescription: "Matching users.",
		})
		.input(billingDto.adminListUsers.input)
		.output(billingDto.adminListUsers.output)
		.handler(({ context, input }) => billingService.adminListUsers({ ...input, role: roleOf(context.user) })),

	adminAdjustCredits: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/billing/credits",
			tags: ["Admin"],
			operationId: "adminAdjustBillingCredits",
			summary: "Adjust a user's credits",
			description: "Adds or removes credits with a mandatory reason; every change lands in the ledger and the audit log.",
			successDescription: "The updated balances.",
		})
		.input(billingDto.adminAdjustCredits.input)
		.output(billingDto.adminAdjustCredits.output)
		.handler(({ context, input }) =>
			billingService.adminAdjustCredits({ ...input, actorId: context.user.id, role: roleOf(context.user) }),
		),

	adminUpdatePlan: protectedProcedure
		.route({
			method: "POST",
			path: "/admin/billing/plans/{code}",
			tags: ["Admin"],
			operationId: "adminUpdateBillingPlan",
			summary: "Update a plan",
			description: "Changes price, credits, wording or availability without a deploy. Requires the admin role.",
			successDescription: "The updated plan.",
		})
		.input(billingDto.adminUpdatePlan.input)
		.output(billingDto.adminUpdatePlan.output)
		.handler(({ context, input }) =>
			billingService.adminUpdatePlan({ ...input, actorId: context.user.id, role: roleOf(context.user) }),
		),

	adminExportCsv: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/billing/export",
			tags: ["Admin"],
			operationId: "adminExportBillingCsv",
			summary: "Export paid orders as CSV",
			description: "Returns a CSV string for the finance appendix. Requires the admin role.",
			successDescription: "The CSV content.",
		})
		.output(billingDto.adminExportCsv.output)
		.handler(({ context }) => billingService.adminExportCsv(roleOf(context.user))),

	adminAudit: protectedProcedure
		.route({
			method: "GET",
			path: "/admin/billing/audit",
			tags: ["Admin"],
			operationId: "adminListBillingAudit",
			summary: "List admin actions",
			description: "Recent admin actions with the actor's email. Requires the admin role.",
			successDescription: "Audit entries, newest first.",
		})
		.input(billingDto.adminAudit.input)
		.output(billingDto.adminAudit.output)
		.handler(({ context, input }) => billingService.adminAudit({ ...input, role: roleOf(context.user) })),
};
