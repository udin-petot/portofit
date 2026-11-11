import { createFileRoute, Navigate } from "@tanstack/react-router";

// The support chat lives in a panel on every dashboard page, so this URL has no page of its own.
// Without this route the path fell through to /$username/$slug and read as a shared resume that is not published.
export const Route = createFileRoute("/dashboard/bantuan")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Navigate to="/bantuan" replace />;
}
