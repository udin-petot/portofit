import { createFileRoute, redirect } from "@tanstack/react-router";

/** The admin console moved to its own page. Keep the old address working for bookmarks. */
export const Route = createFileRoute("/dashboard/admin")({
	beforeLoad: () => {
		throw redirect({ to: "/admin", replace: true });
	},
});
