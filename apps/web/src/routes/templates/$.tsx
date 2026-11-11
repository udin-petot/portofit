import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { templateSchema } from "@reactive-resume/schema/templates";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { createNoindexFollowMeta } from "@/libs/seo";

export const Route = createFileRoute("/templates/$")({
	component: TemplatePdfRoute,
	head: () => ({
		meta: [createNoindexFollowMeta()],
	}),
});

function TemplateNotFound() {
	return (
		<main id="main-content" className="grid min-h-svh place-items-center px-6">
			<div className="grid max-w-md gap-3 text-center">
				<h1 className="font-sans text-2xl font-semibold text-ink">Template tidak ditemukan</h1>
				<p className="text-sm text-ink-2">
					Alamat ini hanya menampilkan contoh template untuk pratinjau. Pilih template dari editor CV, atau buka dasbor
					untuk mulai dari dokumenmu sendiri.
				</p>
				<div className="mt-2 flex justify-center gap-2">
					<a href="/dashboard" className="rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent">
						Buka dasbor
					</a>
					<a href="/" className="rounded-md border border-line-2 px-3.5 py-2 text-sm text-ink">
						Halaman utama
					</a>
				</div>
			</div>
		</main>
	);
}

function TemplatePdfRoute() {
	const params = Route.useParams();
	// A bare /templates or an unknown slug used to throw a ZodError and leave a raw English error on screen.
	const parsed = templateSchema.safeParse(params._splat?.split(".")[0] ?? "");
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
		<iframe
			title={`${template} template`}
			src={`${url}#toolbar=0`}
			style={{ height: "100svh", width: "100svw", border: "none" }}
		/>
	);
}
