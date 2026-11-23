import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "./-pages/privasi";
import { getPrivacyMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/privasi")({
	component: RouteComponent,
	head: () => {
		const { title, description } = getPrivacyMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	return <PrivacyPage />;
}
