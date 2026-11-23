import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "./-pages/bantuan";
import { getSupportMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/bantuan")({
	component: RouteComponent,
	head: () => {
		const { title, description } = getSupportMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	return <SupportPage signedIn={Boolean(session)} />;
}
