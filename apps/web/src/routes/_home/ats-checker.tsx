import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { AtsCheckerPage } from "@/features/ats-checker/page";
import { getAtsCheckerMeta } from "@/libs/seo";

export const Route = createFileRoute("/_home/ats-checker")({
	component: RouteComponent,
	// Back from signing up with a checked file to import. The token identifies the parked file.
	validateSearch: z.object({ import: z.string().min(1).max(64).optional().catch(undefined) }),
	head: () => {
		const { title, description } = getAtsCheckerMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const { import: importToken } = Route.useSearch();

	return <AtsCheckerPage signedIn={Boolean(session)} importPending={importToken} />;
}
