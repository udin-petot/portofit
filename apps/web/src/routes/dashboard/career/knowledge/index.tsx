import { createFileRoute, redirect } from "@tanstack/react-router";

// The knowledge area opens on Experience; there is no separate landing page.
export const Route = createFileRoute("/dashboard/career/knowledge/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/career/knowledge/facts" });
	},
});
