import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { formatRupiah } from "./config";
import { getPlanCopy, type PlanLike } from "./plan-copy";
import { orpc } from "@/libs/orpc/client";

type PricingPageProps = { signedIn: boolean; onOrder?: ((orderId: string) => void) | undefined };

export function PricingBody({ signedIn, onOrder }: PricingPageProps) {
	const navigate = useNavigate();
	const { i18n } = useLingui();
	const english = i18n.locale.startsWith("en");
	const { data, isLoading } = useQuery(orpc.billing.plans.queryOptions());
	const createOrder = useMutation(orpc.billing.createOrder.mutationOptions());

	const buy = async (planCode: string) => {
		if (!signedIn) {
			await navigate({ to: "/auth/login" });
			return;
		}
		const order = await createOrder.mutateAsync({ planCode });
		// Halaman yang punya popup membuka pesanan di tempat; halaman publik tetap pindah halaman.
		if (onOrder) {
			onOrder(order.id);
			return;
		}
		await navigate({ to: "/dashboard/transaksi", search: { order: order.id } });
	};

	const copyFor = (plan: PlanLike) => getPlanCopy(plan, english);

	return (
		<div className="grid gap-4">
			{/* Paket berbayar lebih dulu: halaman ini tentang membeli, bukan tentang mencoba. */}
			<div className="grid gap-4 md:max-w-[760px] md:grid-cols-2">
				{isLoading ? (
					<section className="rounded-lg border border-line bg-surface p-6 text-sm text-ink-3 md:col-span-2">
						{t`Loading packages…`}
					</section>
				) : (
					(data?.plans ?? []).map((plan) => {
						const copy = copyFor(plan);
						return (
							<section key={plan.code} className="flex h-full flex-col rounded-lg border border-line bg-surface p-6">
								<h2 className="text-base font-semibold text-ink">{copy.name}</h2>
								<p className="mt-2 text-[32px] leading-9 font-semibold text-ink tabular-nums">
									{formatRupiah(plan.priceIdr)}
								</p>
								<p className="mt-1 text-sm text-ink-3">
									{plan.credits} {copy.unit}
								</p>
								<p className="mt-4 text-sm leading-relaxed text-ink-2">{copy.description}</p>
								<div className="mt-auto pt-6">
									<Button className="h-11 w-full" onClick={() => void buy(plan.code)} disabled={createOrder.isPending}>
										{createOrder.isPending ? t`Preparing your order…` : t`Buy ${formatRupiah(plan.priceIdr)}`}
									</Button>
									<p className="mt-2 text-center text-xs text-ink-3">
										{t`Pay by QRIS, checked by an admin, credits land once it passes.`}
									</p>
								</div>
							</section>
						);
					})
				)}
			</div>

			<section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line px-4 py-3">
				<div className="min-w-0">
					<p className="text-sm text-ink">
						<Trans>Not sure yet?</Trans>{" "}
						<span className="text-ink-3">
							<Trans>Try the free flow first: unlimited ATS checks, one resume, and the weekly AI allowance.</Trans>
						</span>
					</p>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="shrink-0"
					onClick={() => void navigate({ to: signedIn ? "/dashboard" : "/auth/register" })}
				>
					{signedIn ? t`Open my documents` : t`Start free`}
				</Button>
			</section>

			<section className="rounded-lg border border-line bg-sunken p-6 text-sm leading-relaxed text-ink-2">
				<h2 className="text-base font-semibold text-ink">{t`How to pay`}</h2>
				<ol className="mt-3 grid gap-2">
					<li>{t`1. Choose a package. The order opens straight away in a payment window.`}</li>
					<li>{t`2. Scan the QRIS and pay the exact amount down to the last three digits.`}</li>
					<li>{t`3. Upload the proof in the same window. Credits land once an admin checks it.`}</li>
				</ol>
				<p className="mt-3 text-xs text-ink-3">
					{t`One application credit covers one Prepare this application: a tailored resume, a cover letter and a match score for one job. One interview credit covers one practice session for one interview. Credits do not expire.`}
				</p>
				<p className="mt-2 text-xs text-ink-3">
					<a href="/dashboard/jatah" className="underline underline-offset-4 hover:text-accent-text">
						{t`See what is left of this week's AI allowance`}
					</a>
				</p>
				<p className="mt-3 text-xs leading-5 text-ink-3">{t`By buying, you agree to the terms below.`}</p>
				<p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
					<a href="/syarat" className="underline underline-offset-4 hover:text-accent-text">
						{t`Terms of Service`}
					</a>
					<a href="/refund" className="underline underline-offset-4 hover:text-accent-text">
						{t`Refund Policy`}
					</a>
				</p>
			</section>
		</div>
	);
}

/** The public page: the same plans under a marketing header, for someone who has not signed in yet. */
export function PricingPage({ signedIn }: { signedIn: boolean }) {
	return (
		<main id="main-content" className="min-h-svh bg-bg pt-24 pb-20">
			<div className="mx-auto w-full max-w-5xl px-5">
				<header className="max-w-2xl">
					<p className="font-mono text-xs tracking-widest text-ink-3 uppercase">{t`Pricing`}</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{t`Pay only for what you use`}</h1>
					<p className="mt-4 text-base leading-relaxed text-ink-2">
						{t`Start free to see whether software can read your resume. If you need a resume tailored to one job or interview practice, pay per document. No subscription, no promise of passing a selection.`}
					</p>
				</header>
				<div className="mt-10">
					<PricingBody signedIn={signedIn} />
				</div>
			</div>
		</main>
	);
}
