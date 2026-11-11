import { createFileRoute, Navigate } from "@tanstack/react-router";

// Phones (below 640px) get the three-row root; wider screens open Account, with the pages beside it.
export const Route = createFileRoute("/dashboard/settings/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Navigate to="/dashboard/akun" replace />;
}
