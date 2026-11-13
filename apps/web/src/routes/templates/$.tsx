import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { templateSchema } from "@reactive-resume/schema/templates";
import { templates } from "@/dialogs/resume/template/data";
import { labelClass } from "@/features/homepage/ui";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";

export const Route = createFileRoute("/templates/$")({
	component: TemplateRoute,
	head: () => ({
		meta: [
			{ title: "Resume templates — PortoFit" },
			{
				name: "description",
				content:
					"All 23 PortoFit resume templates in one place. Every one exports a text-based PDF that applicant tracking systems can read.",
			},
		],
	}),
});

/**
 * Browsing templates used to be impossible without an account: a bare /templates answered "Template tidak ditemukan",
 * so the 23 layouts the homepage advertises were never seen before sign-up. The list now lives here, and each card
 * opens the PDF preview that already existed.
 */
function TemplateGallery() {
	const { i18n } = useLingui();
	const entries = Object.entries(templates);

	return (
		<main id="main-content" className="min-h-svh">
			<div className="mx-auto max-w-[1440px] px-(--gutter) py-10 sm:py-14">
				<header className="flex items-center justify-between gap-4 border-b border-line pb-8">
					<a href="/" className="font-anybody text-2xl font-semibold tracking-[-.02em] text-ink">
						PortoFit
					</a>
					<a
						href="/dashboard"
						className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
					>
						<Trans>Build your resume</Trans>
					</a>
				</header>

				<div className="mt-10 grid max-w-3xl gap-4">
					<span className={labelClass}>
						<Trans>Templates</Trans>
					</span>
					<h1 className="font-anybody text-[clamp(38px,5vw,72px)] leading-[.98] font-light tracking-[-.03em] text-balance text-ink">
						<Trans>Every template, on one page.</Trans>
					</h1>
					<p className="max-w-[46ch] font-display text-[clamp(17px,1.3vw,21px)] leading-normal text-pretty text-ink-2">
						<Trans>
							{entries.length} layouts, all exporting a text-based PDF with the words in reading order. Open one, then pick it
							in the editor.
						</Trans>
					</p>
				</div>

				<ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
					{entries.map(([id, template]) => (
						<li key={id}>
							<a href={`/templates/${id}`} className="group block">
								<div className="overflow-hidden rounded-xl border border-line bg-surface">
									<img
										src={template.imageUrl}
										alt={`${template.name} resume template`}
										width={510}
										height={720}
										loading="lazy"
										decoding="async"
										className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.015]"
									/>
								</div>
								<div className="mt-3 flex items-baseline justify-between gap-3">
									<h2 className="font-anybody text-xl font-semibold tracking-[-.01em] text-ink">{template.name}</h2>
									<span className={labelClass}>
										<Trans>Preview</Trans>
									</span>
								</div>
								<p className="mt-1 font-ui text-sm leading-snug text-pretty text-ink-2">{i18n._(template.description)}</p>
							</a>
						</li>
					))}
				</ul>

				<p className="mt-14 border-t border-line pt-8 font-ui text-sm text-ink-3">
					<Trans>Free to browse. No account needed to look around.</Trans>
				</p>
			</div>
		</main>
	);
}

function TemplateNotFound() {
	return (
		<main id="main-content" className="grid min-h-svh place-items-center px-6">
			<div className="grid max-w-md gap-3 text-center">
				<h1 className="font-sans text-2xl font-semibold text-ink">
					<Trans>Template not found</Trans>
				</h1>
				<p className="text-sm text-ink-2">
					<Trans>This address only shows template previews. Pick one from the list, or start from your own document.</Trans>
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
					href="/dashboard"
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
