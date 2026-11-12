import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { formatRupiah } from "./config";
import { orpc } from "@/libs/orpc/client";

type PricingPageProps = { signedIn: boolean };

type PlanCopy = { name: string; description: string; unit: string };

/** The two plans seeded in the database. Keeping the copy here means the English default never shows Indonesian plan text. */
const PLAN_COPY: Record<"en" | "id", Record<string, PlanCopy>> = {
	en: {
		lamaran: {
			name: "CV + Cover Letter per Application",
			description: "CV and cover letter tailored to one job, plus a match score.",
			unit: "application credit",
		},
		wawancara: {
			name: "Interview Practice Session",
			description: "One interview practice session with questions for your field and feedback.",
			unit: "interview session credit",
		},
	},
	id: {
		lamaran: {
			name: "CV + Cover Letter per Lamaran",
			description: "CV dan cover letter disesuaikan ke satu lowongan, plus skor kecocokan.",
			unit: "kredit lamaran",
		},
		wawancara: {
			name: "Sesi Latihan Wawancara",
			description: "Satu sesi simulasi wawancara dengan pertanyaan sesuai bidang dan umpan balik.",
			unit: "kredit sesi wawancara",
		},
	},
};

/** Plans and the payment walkthrough, without the marketing hero: the dashboard page supplies its own header. */
export function PricingBody({ signedIn }: PricingPageProps) {
	const navigate = useNavigate();
	const { i18n } = useLingui();
	const english = i18n.locale.startsWith("en");
	const { data, isLoading } = useQuery(orpc.billing.plans.queryOptions());
	const createOrder = useMutation(orpc.billing.createOrder.mutationOptions());

	const freeFeatures = [
		t`Unlimited ATS checks, no login`,
		t`One free CV to build and download`,
		t`Preview your CV right on the page`,
	];

	const buy = async (planCode: string) => {
		if (!signedIn) {
			await navigate({ to: "/auth/login" });
			return;
		}
		const order = await createOrder.mutateAsync({ planCode });
		await navigate({ to: "/dashboard/transaksi", search: { order: order.id } });
	};

	const copyFor = (plan: { code: string; name: string; description: string | null; kind: string }): PlanCopy => {
		const localized = PLAN_COPY[english ? "en" : "id"][plan.code];
		if (localized) return localized;
		return {
			name: plan.name,
			description: plan.description ?? "",
			unit: plan.kind === "interview" ? t`interview session credit` : t`application credit`,
		};
	};

	return (
		<div className="grid gap-4">
			<div className="grid gap-4 md:grid-cols-3">
				<section className="flex flex-col rounded-lg border border-line bg-surface p-6">
					<h2 className="text-lg font-semibold text-ink">{t`Free`}</h2>
					<p className="mt-1 text-2xl font-semibold text-ink">Rp0</p>
					<p className="mt-1 text-sm text-ink-3">{t`To try the flow`}</p>
					<ul className="mt-5 grid gap-2 text-sm text-ink-2">
						{freeFeatures.map((item) => (
							<li key={item} className="flex gap-2">
								<span aria-hidden className="text-ink-3">
									·
								</span>
								{item}
							</li>
						))}
					</ul>
					<div className="mt-auto pt-6">
						<Button
							variant="secondary"
							className="w-full"
							onClick={() => void navigate({ to: signedIn ? "/dashboard" : "/auth/register" })}
						>
							{signedIn ? t`Open dashboard` : t`Start free`}
						</Button>
					</div>
				</section>

				{isLoading ? (
					<section className="rounded-lg border border-line bg-surface p-6 text-sm text-ink-3 md:col-span-2">{t`Loading packages…`}</section>
				) : (
					(data?.plans ?? []).map((plan) => {
						const copy = copyFor(plan);
						return (
							<section key={plan.code} className="flex flex-col rounded-lg border border-line bg-surface p-6">
								<h2 className="text-lg font-semibold text-ink">{copy.name}</h2>
								<p className="mt-1 text-2xl font-semibold text-ink">{formatRupiah(plan.priceIdr)}</p>
								<p className="mt-1 text-sm text-ink-3">
									{plan.credits} {copy.unit}
								</p>
								<p className="mt-5 text-sm leading-relaxed text-ink-2">{copy.description}</p>
								<div className="mt-auto pt-6">
									<Button className="w-full" onClick={() => void buy(plan.code)} disabled={createOrder.isPending}>
										{createOrder.isPending ? t`Preparing your order…` : t`Buy ${formatRupiah(plan.priceIdr)}`}
									</Button>
									<p className="mt-2 text-center text-xs text-ink-3">{t`Pay by QRIS, verified manually by an admin.`}</p>
								</div>
							</section>
						);
					})
				)}
			</div>

			<section className="rounded-lg border border-line bg-sunken p-6 text-sm leading-relaxed text-ink-2">
				<h2 className="text-base font-semibold text-ink">{t`How to pay`}</h2>
				<ol className="mt-3 grid gap-2">
					<li>{t`1. Choose a package. The system creates an order with a three-digit unique code, for example Rp5,000 becomes Rp5,003.`}</li>
					<li>{t`2. Scan the QRIS on the order page and pay exactly up to the last digit of the unique code.`}</li>
					<li>{t`3. Upload your payment proof or send it on WhatsApp. An admin verifies it and the credits land immediately.`}</li>
				</ol>
				<p className="mt-3 text-xs text-ink-3">
					{t`Credits are used per document: one application credit for one tailored CV and cover letter, one interview credit for one practice session. Credits do not expire.`}
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
export function PricingPage({ signedIn }: PricingPageProps) {
	return (
		<main id="main-content" className="min-h-svh bg-bg pt-24 pb-20">
			<div className="mx-auto w-full max-w-5xl px-5">
				<header className="max-w-2xl">
					<p className="font-mono text-xs tracking-widest text-ink-3 uppercase">{t`Pricing`}</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{t`Pay only for what you use`}</h1>
					<p className="mt-4 text-base leading-relaxed text-ink-2">
						{t`Start free to see whether software can read your CV. If you need a CV tailored to one job or interview practice, pay per document. No subscription, no promise of passing a selection.`}
					</p>
				</header>
				<div className="mt-10">
					<PricingBody signedIn={signedIn} />
				</div>
			</div>
		</main>
	);
}
