import type { IconName } from "@reactive-resume/ui/components/icon";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { getInitials } from "@reactive-resume/utils/string";
import { cn } from "@reactive-resume/utils/style";
import { formatRupiah } from "@/features/billing/config";
import { getPlanCopy } from "@/features/billing/plan-copy";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/libs/auth/client";
import { orpc } from "@/libs/orpc/client";

export const Route = createFileRoute("/dashboard/akun")({
	component: AccountPage,
});

const SETTINGS_LINKS: {
	to: "/dashboard/settings/account" | "/dashboard/settings/preferences" | "/dashboard/settings/ai";
	icon: IconName;
	title: string;
}[] = [
	{ to: "/dashboard/settings/account", icon: "user-circle", title: t`Profile and security` },
	{ to: "/dashboard/settings/preferences", icon: "sliders-horizontal", title: t`Preferences` },
	{ to: "/dashboard/settings/ai", icon: "sparkle", title: t`AI and developer` },
];

/** Judul bagian di luar panel, dengan badge angka bila bagiannya punya jumlah. */
function Section({
	title,
	count,
	action,
	className,
	children,
}: {
	title: ReactNode;
	count?: number | undefined;
	action?: ReactNode;
	className?: string;
	children: ReactNode;
}) {
	return (
		<section className={cn("flex flex-col gap-2.5", className)}>
			<div className="flex items-center justify-between gap-3">
				<h2 className="flex min-w-0 items-center gap-2 text-[17px] leading-6 font-semibold text-ink">
					<span className="truncate">{title}</span>
					{count === undefined ? null : (
						<span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-sunken px-1.5 text-[11px] font-semibold text-ink-3 tabular-nums">
							{count}
						</span>
					)}
				</h2>
				{action}
			</div>
			{children}
		</section>
	);
}

const PANEL = "overflow-hidden rounded-xl border border-line bg-surface";

function AccountPage() {
	const { i18n } = useLingui();
	const confirm = useConfirm();
	const navigate = useNavigate();
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const balances = useQuery(orpc.billing.balances.queryOptions());
	const plans = useQuery(orpc.billing.plans.queryOptions());
	const orders = useQuery(orpc.billing.myOrders.queryOptions({ input: { limit: 50 } }));
	const ledger = useQuery(orpc.billing.ledger.queryOptions({ input: { limit: 20 } }));

	const user = session?.user as { name?: string; email?: string; createdAt?: string | Date } | undefined;
	const list = orders.data?.orders ?? [];
	const entries = (ledger.data?.entries ?? []).slice(0, 8);
	const paid = list.filter((order) => order.status === "lunas").length;
	const cancelled = list.filter((order) => order.status === "ditolak" || order.status === "hangus").length;
	const joined = user?.createdAt
		? new Intl.DateTimeFormat(i18n.locale, { month: "long", year: "numeric" }).format(new Date(user.createdAt))
		: null;

	// The ledger stores a code, not a sentence, so the row reads in the language of whoever opens the page.
	const reasonText = (reason: string) => {
		const english = i18n.locale.startsWith("en");
		const findPlan = (code: string, name: string) =>
			plans.data?.plans.find((plan) => plan.code === code || plan.name === name);

		const coded = /^purchase:(.+)$/.exec(reason);
		if (coded?.[1]) {
			const plan = findPlan(coded[1], coded[1]);
			return `${t`Payment`} · ${plan ? getPlanCopy(plan, english).name : coded[1]}`;
		}

		const legacy = /^Pembayaran (.+)$/.exec(reason);
		if (legacy?.[1]) {
			const plan = findPlan("", legacy[1]);
			return `${t`Payment`} · ${plan ? getPlanCopy(plan, english).name : legacy[1]}`;
		}

		return reason;
	};

	const perCredit = (code: string) => {
		const plan = plans.data?.plans.find((item) => item.code === code);
		if (!plan || plan.credits < 1) return null;
		return formatRupiah(Math.round(plan.priceIdr / plan.credits));
	};

	const deltaText = (delta: number, kind: string) => {
		const unit =
			kind === "interview"
				? Math.abs(delta) === 1
					? t`interview credit`
					: t`interview credits`
				: Math.abs(delta) === 1
					? t`application credit`
					: t`application credits`;
		return `${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${unit}`;
	};

	const signOut = async () => {
		const ok = await confirm(t`Sign out of this account?`, { description: t`You can sign back in at any time.` });
		if (ok) await authClient.signOut();
	};

	return (
		<div className="px-4 py-5 md:px-10 md:py-7">
			<header className="grid gap-1.5">
				<h1 className="font-display text-[30px] leading-9 font-medium text-ink">
					<Trans>Account</Trans>
				</h1>
				<p className="max-w-[60ch] text-sm text-ink-2">
					<Trans>Your profile, your credits, and the trail of what you spent them on.</Trans>
				</p>
			</header>

			<div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
				<div className="flex min-w-0 flex-col gap-7">
					<Section title={<Trans>Profile</Trans>}>
						<div className={PANEL}>
							<div className="flex items-center gap-3 px-4 py-3.5">
								<span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-sunken text-[13px] font-semibold text-ink-2">
									{sessionLoading ? "" : getInitials(user?.name ?? "")}
								</span>
								<div className="grid min-w-0 flex-1 gap-px">
									<p className="truncate text-[15px] font-semibold text-ink">{user?.name || t`No name`}</p>
									<p className="truncate text-[13px] text-ink-2">{user?.email}</p>
									{joined ? (
										<p className="text-xs text-ink-3">
											<Trans>Joined {joined}</Trans>
										</p>
									) : null}
								</div>
								<Button variant="secondary" size="sm" className="ml-auto max-xl:hidden" onClick={() => void signOut()}>
									<Trans>Sign out</Trans>
								</Button>
							</div>
						</div>
					</Section>

					<Section
						title={<Trans>Credits</Trans>}
						action={
							<Button size="sm" className="h-9" onClick={() => void navigate({ to: "/dashboard/beli-kredit" })}>
								<Trans>Buy credits</Trans>
							</Button>
						}
					>
						<div className={cn(PANEL, "grid grid-cols-2")}>
							<div className="p-4">
								<p className="text-xs text-ink-3">
									<Trans>Application</Trans>
								</p>
								<p className="mt-0.5 text-[34px] leading-10 font-semibold text-ink tabular-nums">
									{balances.isLoading ? "—" : (balances.data?.application ?? 0)}
								</p>
								{perCredit("lamaran") ? (
									<p className="mt-0.5 text-xs text-ink-2">
										{perCredit("lamaran")} <Trans>per credit</Trans>
									</p>
								) : null}
							</div>
							<div className="border-l border-line p-4">
								<p className="text-xs text-ink-3">
									<Trans>Interview</Trans>
								</p>
								<p className="mt-0.5 text-[34px] leading-10 font-semibold text-ink tabular-nums">
									{balances.isLoading ? "—" : (balances.data?.interview ?? 0)}
								</p>
								{perCredit("wawancara") ? (
									<p className="mt-0.5 text-xs text-ink-2">
										{perCredit("wawancara")} <Trans>per credit</Trans>
									</p>
								) : null}
							</div>
						</div>
					</Section>

					<Section
						title={<Trans>Credit history</Trans>}
						count={list.length}
						action={
							<Link to="/dashboard/transaksi" className="shrink-0 text-[13px] text-ink-2 hover:text-ink">
								<Trans>See all orders</Trans>
							</Link>
						}
					>
						<div className={PANEL}>
							{ledger.isLoading ? (
								<div className="grid gap-2 p-4" aria-hidden="true">
									<span className="h-3.5 w-52 animate-pulse rounded-sm bg-sunken" />
									<span className="h-3 w-36 animate-pulse rounded-sm bg-sunken" />
								</div>
							) : entries.length === 0 ? (
								<p className="p-4 text-sm text-ink-3">
									<Trans>Nothing spent yet. Credits appear here after you use one.</Trans>
								</p>
							) : (
								entries.map((entry) => (
									<div
										key={entry.id}
										className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 first:border-t-0"
									>
										<div className="min-w-0">
											<p className="truncate text-sm text-ink">{reasonText(entry.reason)}</p>
											<p className="mt-0.5 text-xs text-ink-3">
												{new Date(entry.createdAt).toLocaleDateString(i18n.locale)}
											</p>
										</div>
										<div className="shrink-0 text-right tabular-nums">
											<p className={cn("text-[13px]", entry.delta > 0 && "text-accent-text")}>
												{deltaText(entry.delta, entry.kind)}
											</p>
											<p className="mt-0.5 text-xs text-ink-3">
												{entry.balanceAfter} <Trans>left</Trans>
											</p>
										</div>
									</div>
								))
							)}
						</div>
					</Section>
				</div>

				<aside className="flex min-w-0 flex-col gap-7">
					<Section title={<Trans>Settings</Trans>}>
						<div className={PANEL}>
							{SETTINGS_LINKS.map((item) => (
								<Link
									key={item.to}
									to={item.to}
									className="flex h-11 items-center gap-3 border-t border-line px-4 text-sm text-ink first:border-t-0 hover:bg-hover"
								>
									<Icon name={item.icon} size={16} className="shrink-0 text-ink-3" />
									<span className="min-w-0 flex-1 truncate">{item.title}</span>
									<Icon name="caret-right" size={16} className="shrink-0 text-ink-3" />
								</Link>
							))}
						</div>
					</Section>

					<Section
						title={<Trans>Orders</Trans>}
						action={
							<Link to="/dashboard/transaksi" className="shrink-0 text-[13px] text-ink-2 hover:text-ink">
								<Trans>See all</Trans>
							</Link>
						}
					>
						<div className={cn(PANEL, "px-4")}>
							<div className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
								<span className="text-sm text-ink">
									<Trans>Paid</Trans>
								</span>
								<span className="text-sm text-ink tabular-nums">{orders.isLoading ? "—" : paid}</span>
							</div>
							<div className="flex items-center justify-between gap-3 border-t border-line py-3">
								<span className="text-sm text-ink">
									<Trans>Cancelled</Trans>
								</span>
								<span className="text-sm text-ink tabular-nums">{orders.isLoading ? "—" : cancelled}</span>
							</div>
						</div>
					</Section>

					{/* Di bawah 1280 tombol keluar di baris profil disembunyikan, jadi ia dapat panelnya sendiri. */}
					<Section title={<Trans>Session</Trans>} className="xl:hidden">
						<div className={PANEL}>
							<button
								type="button"
								onClick={() => void signOut()}
								className="touch-target flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-ink hover:bg-hover"
							>
								<Trans>Sign out</Trans>
								<Icon name="caret-right" size={16} className="ml-auto text-ink-3" />
							</button>
						</div>
					</Section>
				</aside>
			</div>
		</div>
	);
}
