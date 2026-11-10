import type { AnyDialogRendererEntry } from "../schemas";
import { lazy, Suspense } from "react";

const NewDocumentDialog = lazy(() =>
	import("@/features/documents/new-document-dialog").then((module) => ({ default: module.NewDocumentDialog })),
);

export const documentDialogRenderers: readonly AnyDialogRendererEntry[] = [
	{
		type: "document.new",
		render: ({ data }) => (
			<Suspense fallback={null}>
				<NewDocumentDialog data={data} />
			</Suspense>
		),
	},
];
