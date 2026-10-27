import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { TransactionsPage } from "@/features/billing/transactions";

export const Route = createFileRoute("/dashboard/transaksi")({
	component: RouteComponent,
	validateSearch: z.object({ order: z.string().optional().catch(undefined) }),
});

function RouteComponent() {
	const { order } = Route.useSearch();
	return <TransactionsPage selectedOrderId={order} />;
}
