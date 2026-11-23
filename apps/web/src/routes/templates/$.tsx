import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { templateSchema } from "@reactive-resume/schema/templates";
import { templates } from "@/dialogs/resume/template/data";
import { labelClass } from "@/features/homepage/ui";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { TemplateGallery } from "@/features/templates/gallery";
import { getTemplatesMeta } from "@/libs/seo";

export const Route = createFileRoute("/templates/$")({
	component: TemplateRoute,
	head: () => {
		const { title, description } = getTemplatesMeta();
		return { meta: [{ title }, { name: "description", content: description }] };
	},
});

/**
 * Browsing templates used to be impossible without an account: a bare /templates answered "Template tidak ditemukan",
 * so the 28 layouts the homepage advertises were never seen before sign-up. The list now lives here, and each card
 * opens the PDF preview that already existed.
 */
function TemplateNotFound() {
	return (
		<main id="main-content" className="grid min-h-svh place-items-center px-6">
			<div className="grid max-w-md gap-3 text-center">
				<h1 className="font-sans text-2xl font-semibold text-ink">
					<Trans>Template not found</Trans>
				</h1>
				<p className="text-sm text-ink-2">
					<Trans>
						This address only shows template previews. Pick one from the list, or start from your own document.
					</Trans>
				</p>
				<div className="mt-2 flex justify-center gap-2">
					<a href="/templates" className="rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent">
						<Trans>All templates</Trans>
					</a>
					<a href="/dashboard" className="rounded-md border border-line-2 px-3.5 py-2 text-sm text-ink">
						<Trans>Open dashboard</Trans>
					</a>
				</div>
			</div>
		</main>
	);
}

function TemplatePreview({ slug }: { slug: string }) {
	const parsed = templateSchema.safeParse(slug);
	const template = parsed.success ? parsed.data : null;
	const [url, setUrl] = useState<string>();

	useEffect(() => {
		if (!template) return;
		let objectUrl: string | undefined;
		let cancelled = false;
		void createResumePdfBlob(sampleResumeData, template).then((blob) => {
			if (cancelled) return;
			objectUrl = URL.createObjectURL(blob);
			setUrl(objectUrl);
		});
		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [template]);

	if (!template) return <TemplateNotFound />;
	if (!url) return null;

	return (
		<main id="main-content" className="flex min-h-svh flex-col">
			<div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-(--gutter)">
				<a href="/templates" className="font-ui text-sm text-ink-2 transition-colors hover:text-ink">
					<Trans>All templates</Trans>
				</a>
				<span className={labelClass}>{templates[template].name}</span>
				<a
					href={`/dashboard?template=${encodeURIComponent(template)}`}
					className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
				>
					<Trans>Use this template</Trans>
				</a>
			</div>
			<iframe title={`${template} template`} src={`${url}#toolbar=0`} className="min-h-0 w-full flex-1 border-0" />
		</main>
	);
}

function TemplateRoute() {
	const params = Route.useParams();
	const splat = params._splat ?? "";
	if (!splat) return <TemplateGallery />;
	return <TemplatePreview slug={splat.split(".")[0] ?? ""} />;
}
