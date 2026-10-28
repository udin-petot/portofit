import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminConsolePage } from "@/features/admin/console";

export const Route = createFileRoute("/admin")({
	beforeLoad: ({ context, location }) => {
		if (!context.session) throw redirect({ to: "/auth/login", search: { callbackURL: location.href }, replace: true });
		const role = (context.session.user as { role?: string | null } | undefined)?.role;
		if (role !== "admin") throw redirect({ to: "/dashboard", replace: true });
	},
	head: () => ({
		meta: [{ title: "Admin — PortoFit" }, { name: "robots", content: "noindex, nofollow" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	return (
		<AdminConsolePage
			user={{
				name: session?.user.name ?? "Admin",
				email: session?.user.email ?? "",
			}}
		/>
	);
}
