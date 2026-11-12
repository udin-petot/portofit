import { createFileRoute } from "@tanstack/react-router";
import { QuotaPage } from "@/features/quota/page";

export const Route = createFileRoute("/dashboard/jatah")({
	component: QuotaPage,
});
