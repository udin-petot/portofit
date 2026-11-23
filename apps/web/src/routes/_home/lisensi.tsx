import { createFileRoute } from "@tanstack/react-router";
import { LicensePage } from "./-pages/lisensi";
import { getLicenseMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/lisensi")({
	component: RouteComponent,
	head: () => {
		const { title, description } = getLicenseMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	return <LicensePage />;
}
