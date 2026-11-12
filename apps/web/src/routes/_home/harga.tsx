import { createFileRoute, redirect } from "@tanstack/react-router";
import { PricingPage } from "@/features/billing/pricing";
import { getPricingMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/harga")({
	// Signed-in people belong in the dashboard, where the same plans sit next to their balance and orders.
	beforeLoad: ({ context }) => {
		if (context.session) throw redirect({ to: "/dashboard/beli-kredit", replace: true });
	},
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
