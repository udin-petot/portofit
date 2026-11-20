import type { DocumentsSearch } from "@/features/documents/documents-page";
import { createFileRoute, redirect, stripSearchParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { templateSchema } from "@reactive-resume/schema/templates";
import z from "zod";
import { useDialogStore } from "@/dialogs/store";
import { DocumentsPage } from "@/features/documents/documents-page";

const defaults = { type: "all", q: "", tags: [], public: false, sort: "edited" } satisfies DocumentsSearch;

export const Route = createFileRoute("/dashboard/")({
	validateSearch: z.object({
		type: z.enum(["all", "resume", "letter"]).default("all").catch("all"),
		q: z.string().default("").catch(""),
		tags: z.array(z.string()).default([]).catch([]),
		public: z.boolean().default(false).catch(false),
		sort: z.enum(["edited", "name", "created"]).default("edited").catch("edited"),
		// Without one, the page uses the last view picked on this device.
		view: z.enum(["grid", "list"]).optional().catch(undefined),
		// Older links opened letters here; they open in the letter editor now.
		letter: z.string().optional().catch(undefined),
		// A template picked on the public gallery. Opens the new-document dialog with it.
		template: templateSchema.optional().catch(undefined),
	}),
	search: { middlewares: [stripSearchParams(defaults)] },
	beforeLoad: ({ search }) => {
		if (search.letter) {
			throw redirect({ to: "/builder/letter/$coverLetterId", params: { coverLetterId: search.letter }, replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const openDialog = useDialogStore((state) => state.openDialog);
	const templateStarted = useRef(false);
	const { template, ...documentSearch } = search;

	// The public gallery sends people here with the template they picked. Create it once, then
	// drop the param so a refresh or back button does not create a second document.
	useEffect(() => {
		if (!template || templateStarted.current) return;
		templateStarted.current = true;
		openDialog("document.new", { template });
		void navigate({
			resetScroll: false,
			replace: true,
			search: (previous: typeof search) => ({ ...previous, template: undefined }),
		});
	}, [template, openDialog, navigate]);

	return (
		<DocumentsPage
			search={documentSearch}
			onSearchChange={(patch) =>
				void navigate({
					resetScroll: false,
					search: (previous: DocumentsSearch) => ({ ...previous, ...patch }),
					replace: true,
				})
			}
		/>
	);
}
