import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { PricingBody } from "@/features/billing/pricing";
import { orpc } from "@/libs/orpc/client";

export const Route = createFileRoute("/dashboard/beli-kredit")({
	component: BuyCreditsPage,
});

/** Balance tiles, so someone arriving from Transaksi sees what they still own before buying more. */
function Balance({ label, value }: { label: string; value: number | undefined }) {
	return (
		<div className="flex items-baseline justify-between gap-3 rounded-lg bg-sunken px-3.5 py-3">
			<span className="text-sm text-ink-2">{label}</span>
			<span className="font-mono text-lg font-medium text-ink tabular-nums">{value ?? "—"}</span>
		</div>
	);
}

function BuyCreditsPage() {
	const navigate = useNavigate();
	const balances = useQuery(orpc.billing.balances.queryOptions());

	return (
		<div className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-28 md:pb-12">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-sans text-2xl font-semibold text-ink">
						<Trans>Buy credits</Trans>
					</h1>
					<p className="mt-1 text-sm text-ink-2">
						<Trans>Pay per document. No subscription, and credits do not expire.</Trans>
					</p>
				</div>
				<Button variant="secondary" size="sm" onClick={() => void navigate({ to: "/dashboard/transaksi" })}>
					<Icon name="file-text" size={16} />
					<Trans>My orders</Trans>
				</Button>
			</div>

			<section aria-label={t`Your balance`} className="mt-5 grid gap-2 sm:grid-cols-2">
				<Balance label={t`Application credits`} value={balances.data?.application} />
				<Balance label={t`Interview credits`} value={balances.data?.interview} />
			</section>

			<div className="mt-8">
				<PricingBody signedIn />
			</div>
		</div>
	);
}
