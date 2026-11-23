import { createFileRoute } from "@tanstack/react-router";
import { RefundPage } from "./-pages/refund";
import { getRefundMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/refund")({
	component: RouteComponent,
	head: () => {
		const { title, description } = getRefundMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	return <RefundPage />;
}
