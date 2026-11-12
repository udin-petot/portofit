import { t } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { orpc } from "@/libs/orpc/client";

/** Nama dan penjelasan tiap jenis aksi, ditulis sekali supaya halaman ini dan pesan galat memakai kata yang sama. */
export const QUOTA_LABEL = {
	review: t`Writing review`,
	improve: t`Line rewrites`,
	coach: t`Coach messages`,
	job_match: t`Deep job match`,
} as const;

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
	const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
	const empty = limit - used <= 0;

	return (
		<article className="rounded-lg border border-line bg-surface p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="text-sm font-medium text-ink">{label}</h2>
				<p className="font-mono text-sm text-ink-2 tabular-nums">
					{limit - used} / {limit}
				</p>
			</div>
			<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken">
				<div
					className={empty ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-accent-text"}
					style={{ width: `${percent}%` }}
				/>
			</div>
			<p className="mt-2 text-xs text-ink-3">
				{empty ? <Trans>Used up. It comes back on Monday.</Trans> : <Trans>{limit - used} left this week.</Trans>}
			</p>
		</article>
	);
}

/** Halaman jatah: menjawab berapa sisa, habis kapan, dan ke mana kalau mau lebih. */
export function QuotaPage() {
	const { i18n } = useLingui();
	const quota = useQuery(orpc.quota.status.queryOptions());

	const resetAt = quota.data?.resetAt ? new Date(quota.data.resetAt) : null;
	const resetLabel = resetAt
		? new Intl.DateTimeFormat(i18n.locale, { weekday: "long", day: "numeric", month: "long" }).format(resetAt)
		: null;

	return (
		<div className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-28 md:pb-12">
			<header className="max-w-2xl">
				<h1 className="font-sans text-2xl font-semibold text-ink">
					<Trans>AI allowance</Trans>
				</h1>
				<p className="mt-1 text-sm leading-6 text-ink-2">
					<Trans>Free AI actions reset every Monday at 00:00 WIB. Nothing carries over.</Trans>
				</p>
			</header>

			{quota.isError ? (
				<p role="alert" className="mt-6 text-sm text-danger-text">
					<Trans>Your allowance couldn't be loaded.</Trans>{" "}
					<button type="button" className="underline underline-offset-4" onClick={() => void quota.refetch()}>
						<Trans>Try again</Trans>
					</button>
				</p>
			) : quota.isPending ? (
				<div className="mt-6 grid gap-3 sm:grid-cols-2">
					<Skeleton className="h-28 rounded-lg" />
					<Skeleton className="h-28 rounded-lg" />
					<Skeleton className="h-28 rounded-lg" />
					<Skeleton className="h-28 rounded-lg" />
				</div>
			) : (
				<>
					<section aria-label={t`This week`} className="mt-6 grid gap-3 sm:grid-cols-2">
						{quota.data.features.map((row) => (
							<Meter key={row.feature} label={QUOTA_LABEL[row.feature]} used={row.used} limit={row.limit} />
						))}
					</section>
					{resetLabel ? (
						<p className="mt-4 text-xs text-ink-3">
							<Trans>Back to full on {resetLabel}.</Trans>
						</p>
					) : null}
				</>
			)}

			<section className="mt-8 rounded-lg border border-line bg-sunken p-5">
				<h2 className="text-sm font-semibold text-ink">
					<Trans>What stays free</Trans>
				</h2>
				<p className="mt-2 text-sm leading-6 text-ink-2">
					<Trans>
						Every ATS scan, issue list and basic job match stays free with no limit. Only actions that call a model
						use this allowance.
					</Trans>
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<Link to="/dashboard/beli-kredit" className={buttonVariants({ variant: "secondary", size: "sm" })}>
						<Icon name="tag" size={16} />
						<Trans>See packages</Trans>
					</Link>
					<Link to="/dashboard/transaksi" className={buttonVariants({ variant: "ghost", size: "sm" })}>
						<Trans>My orders</Trans>
					</Link>
				</div>
			</section>
		</div>
	);
}
