import { useLingui } from "@lingui/react";
/**
 * The public gallery at /templates. Kept out of the route file so the build can prerender it
 * (features/homepage/prerender.tsx) without the router: the page is indexable, so its cards belong in the first
 * response. The first row of cards is on screen at load, so those images load eagerly and the first one is the
 * page's LCP image.
 */
import { Trans } from "@lingui/react/macro";
import { templates } from "@/dialogs/resume/template/data";
import { labelClass } from "@/features/homepage/ui";

export function TemplateGallery() {
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
							{entries.length} layouts, all exporting a text-based PDF with the words in reading order. Open one, then
							pick it in the editor.
						</Trans>
					</p>
				</div>

				<ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
					{entries.map(([id, template], index) => (
						<li key={id}>
							<a href={`/templates/${id}`} className="group block">
								<div className="overflow-hidden rounded-xl border border-line bg-surface">
									<img
										src={template.imageUrl}
										alt={`${template.name} resume template`}
										width={510}
										height={720}
										loading={index < 3 ? "eager" : "lazy"}
										fetchPriority={index === 0 ? "high" : undefined}
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
								<p className="mt-1 font-ui text-sm leading-snug text-pretty text-ink-2">
									{i18n._(template.description)}
								</p>
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
