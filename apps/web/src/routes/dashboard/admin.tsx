import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminBillingPage } from "@/features/billing/admin";

export const Route = createFileRoute("/dashboard/admin")({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		const role = (context.session?.user as { role?: string | null } | undefined)?.role;
		if (role !== "admin") throw redirect({ to: "/dashboard", replace: true });
	},
});

function RouteComponent() {
	return <AdminBillingPage />;
}
