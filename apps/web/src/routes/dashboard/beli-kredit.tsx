import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Countdown } from "@/features/billing/countdown";
import { formatRupiah } from "@/features/billing/config";
import { PaymentDialog } from "@/features/billing/payment-dialog";
import { getPlanCopy } from "@/features/billing/plan-copy";
import { FreeNote, HowToPay, PlanList } from "@/features/billing/pricing";
import { orpc } from "@/libs/orpc/client";

export const Route = createFileRoute("/dashboard/beli-kredit")({
	component: BuyCreditsPage,
});

type Balances = { application: number; interview: number };

/** Dua saldo dalam satu baris kotak. Angka rata kanan supaya bisa dibandingkan tanpa membaca label. */
function BalanceTiles({ data }: { data?: Balances | undefined }) {
	return (
		<section aria-label={t`Your balance`} className="grid grid-cols-2 gap-2">
			<div className="grid gap-1 rounded-lg border border-line bg-surface px-3 py-2">
				<span className="text-[11px] leading-4 text-ink-3">
					<Trans>Application credits</Trans>
				</span>
				<span className="text-right font-mono text-lg font-medium text-ink tabular-nums">
					{data?.application ?? "—"}
				</span>
			</div>
			<div className="grid gap-1 rounded-lg border border-line bg-surface px-3 py-2">
				<span className="text-[11px] leading-4 text-ink-3">
					<Trans>Interview credits</Trans>
				</span>
				<span className="text-right font-mono text-lg font-medium text-ink tabular-nums">
					{data?.interview ?? "—"}
				</span>
			</div>
		</section>
	);
}

function BuyCreditsPage() {
	const navigate = useNavigate();
	const { i18n } = useLingui();
	const queryClient = useQueryClient();
	const [orderId, setOrderId] = useState<string | null>(null);
	const balances = useQuery(orpc.billing.balances.queryOptions());
	const active = useQuery({ ...orpc.billing.activeOrder.queryOptions(), refetchInterval: 20_000 });

	const pending = active.data?.order ?? null;
	const pendingPlan = pending
		? getPlanCopy(
				{ code: pending.planCode, name: pending.planName, description: null, kind: pending.kind },
				i18n.locale.startsWith("en"),
			)
		: null;

	const closePayment = () => {
		setOrderId(null);
		void queryClient.invalidateQueries({ queryKey: orpc.billing.activeOrder.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.billing.balances.key() });
	};

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

			{/* Ponsel: saldo di atas paket, karena yang dibaca pertama adalah sisa kredit. */}
			<div className="mt-5 lg:hidden">
				<BalanceTiles data={balances.data} />
			</div>

			<div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<div className="min-w-0">
					{pending ? (
						<section
							aria-label={t`Order waiting for payment`}
							className="mb-3 flex flex-col gap-2.5 rounded-lg border border-warn-soft bg-warn-soft/30 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
						>
							<div className="min-w-0">
								<p className="text-[11px] font-medium tracking-[0.06em] text-warn-text uppercase">
									<Trans>Order waiting for payment</Trans>
								</p>
								<p className="mt-0.5 truncate text-sm text-ink">{pendingPlan?.name}</p>
								<p className="mt-0.5 text-xs text-warn-text">
									{pending.expiresAt ? (
										<>
											<Trans>Ends in</Trans>{" "}
											<Countdown
												expiresAt={new Date(pending.expiresAt)}
												onExpire={() => void active.refetch()}
												className="font-medium text-warn-text"
											/>
										</>
									) : null}
								</p>
							</div>
							<div className="flex items-center justify-between gap-3 sm:flex-none sm:justify-end">
								<p className="text-sm font-semibold text-ink tabular-nums">{formatRupiah(pending.totalIdr)}</p>
								<Button className="h-11 sm:h-9" onClick={() => setOrderId(pending.id)}>
									<Trans>Continue payment</Trans>
								</Button>
							</div>
						</section>
					) : null}

					<PlanList signedIn onOrder={setOrderId} />
					<FreeNote signedIn />
				</div>

				<aside className="hidden gap-3 lg:sticky lg:top-6 lg:grid">
					<BalanceTiles data={balances.data} />
					<HowToPay collapsible />
				</aside>
			</div>

			{/* Ponsel: cara bayar di bawah paket, tertutup supaya tidak menutup halaman. */}
			<div className="mt-4 lg:hidden">
				<HowToPay collapsible />
			</div>

			<PaymentDialog orderId={orderId} onClose={closePayment} onRestart={setOrderId} />
		</div>
	);
}
