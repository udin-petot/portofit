import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/features/billing/pricing";
import { getPricingMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/harga")({
	component: RouteComponent,
	head: () => {
		const { title, description } = getPricingMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	return <PricingPage signedIn={Boolean(session)} />;
}
