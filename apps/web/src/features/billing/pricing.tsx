import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { formatRupiah } from "./config";
import { getPlanCopy, type PlanLike } from "./plan-copy";
import { useNarrowScreen } from "./use-narrow-screen";
import { orpc } from "@/libs/orpc/client";

type PricingPageProps = { signedIn: boolean; onOrder?: ((orderId: string) => void) | undefined };

/**
 * Daftar paket sebagai baris, bukan kartu besar. Dua paket saja tidak butuh dua kotak,
 * dan baris mengikuti irama blok lain di halaman ini.
 */
export function PlanList({ signedIn, onOrder }: PricingPageProps) {
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

	if (isLoading) {
		return (
			<div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-3">{t`Loading packages…`}</div>
		);
	}

	return (
		<div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
			{(data?.plans ?? []).map((plan) => {
				const copy = getPlanCopy(plan as PlanLike, english);
				return (
					<section
						key={plan.code}
						className="flex flex-col gap-3 p-5 sm:min-h-[108px] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
					>
						<div className="grid min-w-0 flex-1 gap-0.5">
							<h2 className="text-[15px] font-semibold text-ink">{copy.name}</h2>
							<p className="text-xs text-ink-3">
								{plan.credits} {copy.unit}
							</p>
							<p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-2">
								{copy.description}
							</p>
						</div>
						<div className="flex items-center justify-between gap-4 sm:flex-none sm:justify-end sm:gap-5">
							<span className="text-2xl font-semibold text-ink tabular-nums sm:text-[22px]">
								{formatRupiah(plan.priceIdr)}
							</span>
							<Button
								className="h-11 w-40 sm:h-9 sm:w-32"
								onClick={() => void buy(plan.code)}
								disabled={createOrder.isPending}
							>
								{createOrder.isPending ? t`Preparing…` : t`Buy`}
							</Button>
						</div>
					</section>
				);
			})}
		</div>
	);
}

/** Satu baris ajakan mencoba alur gratis, bukan kartu setinggi isi. */
export function FreeNote({ signedIn }: { signedIn: boolean }) {
	const navigate = useNavigate();

	return (
		<div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-dashed border-line px-4 py-3 sm:h-14 sm:py-0">
			<p className="text-[13px] leading-5 text-ink-2">
				<Trans>Not sure yet?</Trans>{" "}
				<span className="text-ink-3">
					<Trans>Try the free flow first: unlimited ATS checks, one resume, and the weekly AI allowance.</Trans>
				</span>
			</p>
			<Button
				variant="ghost"
				size="sm"
				className="shrink-0"
				onClick={() => void navigate({ to: signedIn ? "/dashboard" : "/auth/register" })}
			>
				{signedIn ? t`Open my documents` : t`Start free`}
			</Button>
		</div>
	);
}

/**
 * Cara bayar. Di ponsel ia informasi pendukung yang bisa dilipat, di desktop selalu terbuka
 * karena kolom kanan memang tempat membaca.
 */
export function HowToPay({ collapsible = false }: { collapsible?: boolean }) {
	const narrow = useNarrowScreen();

	const body = (
		<>
			<ol className="mt-3 grid gap-2 text-[13px] leading-5 text-ink-2">
				<li>{t`1. Choose a package. The order opens straight away in a payment window.`}</li>
				<li>{t`2. Scan the QRIS and pay the exact amount down to the last three digits.`}</li>
				<li>{t`3. Upload the proof in the same window. Credits land once an admin checks it.`}</li>
			</ol>
			<p className="mt-3 text-[11.5px] leading-5 text-ink-3">
				{t`One application credit covers one Prepare this application: a tailored resume, a cover letter and a match score for one job. One interview credit covers one practice session for one interview. Credits do not expire.`}
			</p>
			<p className="mt-2 text-[11.5px] text-ink-3">
				<a href="/dashboard/jatah" className="underline underline-offset-4 hover:text-accent-text">
					{t`See what is left of this week's AI allowance`}
				</a>
			</p>
			<p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-3">
				<a href="/syarat" className="underline underline-offset-4 hover:text-accent-text">
					{t`Terms of Service`}
				</a>
				<a href="/refund" className="underline underline-offset-4 hover:text-accent-text">
					{t`Refund Policy`}
				</a>
			</p>
		</>
	);

	if (collapsible && narrow) {
		return (
			<details className="rounded-xl border border-line bg-surface">
				<summary className="flex h-11 cursor-pointer list-none items-center justify-between px-4 text-[13px] font-medium text-ink">
					<Trans>How to pay</Trans>
					<Icon name="caret-down" size={14} className="text-ink-3" />
				</summary>
				<div className="px-4 pb-4">{body}</div>
			</details>
		);
	}

	return (
		<section className="rounded-xl border border-line bg-surface p-4">
			<h2 className="text-sm font-semibold text-ink">
				<Trans>How to pay</Trans>
			</h2>
			{body}
		</section>
	);
}

export function PricingBody({ signedIn, onOrder }: PricingPageProps) {
	return (
		<div className="grid gap-4">
			<PlanList signedIn={signedIn} onOrder={onOrder} />
			<FreeNote signedIn={signedIn} />
			<HowToPay />
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
