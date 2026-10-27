import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/features/billing/pricing";

export const Route = createFileRoute("/_home/harga")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Harga — PortoFit" },
			{
				name: "description",
				content:
					"Harga PortoFit: cek ATS gratis, Rp5.000 per lamaran untuk CV dan cover letter yang disesuaikan, Rp10.000 per sesi latihan wawancara. Bayar QRIS, verifikasi manual.",
			},
		],
	}),
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	return <PricingPage signedIn={Boolean(session)} />;
}
