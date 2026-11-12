import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { buttonVariants } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { cn } from "@reactive-resume/utils/style";
import { applicationsListQueryOptions } from "@/features/applications/queries";

const DISMISSED_KEY = "portofit:start-guide-dismissed";

const readDismissed = () => (typeof window === "undefined" ? true : window.localStorage.getItem(DISMISSED_KEY) === "1");

/**
 * Setelah CV pertama jadi, pengguna berhenti di halaman dokumen tanpa tahu ada lamaran dan latihan.
 * Panduan ini hanya muncul selama belum ada satu pun lamaran, dan bisa ditutup.
 */
export function StartGuide() {
	const [dismissed, setDismissed] = useState(readDismissed);
	const applications = useQuery(applicationsListQueryOptions());

	if (dismissed) return null;
	if (applications.isPending || applications.isError) return null;
	if ((applications.data?.length ?? 0) > 0) return null;

	const dismiss = () => {
		window.localStorage.setItem(DISMISSED_KEY, "1");
		setDismissed(true);
	};

	const steps = [
		{ label: t`First CV`, done: true },
		{ label: t`Log an application and paste the posting`, done: false },
		{ label: t`Prepare files, then practise the interview`, done: false },
	];

	return (
		<section aria-label={t`Getting started`} className="grid gap-3 rounded-xl border border-line bg-surface p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="grid gap-0.5">
					<p className="text-sm font-semibold">
						<Trans>Your first CV is done. Two steps left.</Trans>
					</p>
					<p className="text-xs text-ink-3">
						<Trans>PortoFit tracks each job from the posting to the interview.</Trans>
					</p>
				</div>
				<button
					type="button"
					onClick={dismiss}
					aria-label={t`Dismiss`}
					className="rounded-md p-1 text-ink-3 transition-colors hover:bg-hover hover:text-ink-2"
				>
					<Icon name="x-circle" size={18} />
				</button>
			</div>

			<ol className="grid gap-2 sm:grid-cols-3">
				{steps.map((step, index) => (
					<li key={step.label} className="flex items-start gap-2">
						<span
							className={cn(
								"mt-px grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
								step.done ? "bg-accent text-accent-ink" : "bg-sunken text-ink-3",
							)}
						>
							{step.done ? <Icon name="check" size={12} /> : index + 1}
						</span>
						<span className={cn("text-[13px] leading-5", step.done ? "text-ink-3 line-through" : "text-ink-2")}>
							{step.label}
						</span>
					</li>
				))}
			</ol>

			<div className="flex flex-wrap items-center gap-2">
				<Link to="/dashboard/applications" search={{ create: true }} className={buttonVariants({ size: "sm" })}>
					<Icon name="plus" size={16} />
					<Trans>Log an application</Trans>
				</Link>
				<span className="text-xs text-ink-3">
					<Trans>You can close this and come back later.</Trans>
				</span>
			</div>
		</section>
	);
}
