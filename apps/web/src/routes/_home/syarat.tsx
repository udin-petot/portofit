import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "./-pages/syarat";
import { getTermsMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/syarat")({
	component: RouteComponent,
	head: () => {
		const { title, description } = getTermsMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	return <TermsPage />;
}
