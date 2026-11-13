import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { toast } from "@reactive-resume/ui/components/toast";
import { formatRupiah, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "./config";
import { Countdown } from "./countdown";
import { InvoiceSheet } from "./invoice-sheet";
import { PaymentDialog } from "./payment-dialog";
import { getPlanCopy } from "./plan-copy";
import { orpc } from "@/libs/orpc/client";

type Tab = "semua" | "menunggu_bayar" | "diproses" | "selesai" | "batal";

const TABS: Tab[] = ["semua", "menunggu_bayar", "diproses", "selesai", "batal"];

type TransactionsPageProps = { selectedOrderId?: string | undefined; isAdmin?: boolean };

/** Warna chip status mengikuti tone yang sudah dipakai di config, supaya daftar dan detail tidak berbeda. */
function chipTone(status: string) {
	const tone = ORDER_STATUS_TONE[status] ?? "neutral";
	if (tone === "success") return "bg-accent-soft text-accent-text";
	if (tone === "warning") return "bg-warn-soft text-warn-text";
	if (tone === "danger") return "bg-danger-soft text-danger-text";
	return "bg-sunken text-ink-2";
}

export function TransactionsPage({ selectedOrderId }: TransactionsPageProps) {
	const { i18n } = useLingui();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const orders = useQuery({
		...orpc.billing.myOrders.queryOptions({ input: { limit: 100 } }),
		// Admin verifies by hand, so the page watches for the moment an order turns paid and says so.
		refetchInterval: 20_000,
	});
	const invoices = useQuery(orpc.invoice.list.queryOptions());
	const [invoiceOpen, setInvoiceOpen] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>("semua");
	const [query, setQuery] = useState("");
	const previousStatus = useRef<Record<string, string>>({});

	// Labels are built during render, not at import time, so they follow the language the reader chose.
	const tabLabel = (id: Tab) => {
		switch (id) {
			case "semua":
				return t`All`;
			case "menunggu_bayar":
				return t`Awaiting payment`;
			case "diproses":
				return t`In review`;
			case "selesai":
				return t`Paid`;
			case "batal":
				return t`Cancelled`;
		}
	};

	const statusText = (status: string) => {
		switch (status) {
			case "menunggu_bayar":
				return t`Awaiting payment`;
			case "menunggu_verifikasi":
				return t`In review`;
			case "lunas":
				return t`Paid`;
			case "ditolak":
			case "hangus":
				return t`Cancelled`;
			default:
				return ORDER_STATUS_LABEL[status] ?? status;
		}
	};

	const english = i18n.locale.startsWith("en");
	// Order rows carry the plan name frozen at purchase time, so the display name comes from the plan copy instead.
	const planLabel = useCallback(
		(order: { planCode: string; planName: string; kind: string }) =>
			getPlanCopy({ code: order.planCode, name: order.planName, description: null, kind: order.kind }, english).name,
		[english],
	);

	const term = query.trim();
	const list = useMemo(() => orders.data?.orders ?? [], [orders.data]);
	const loading = orders.isLoading;
	const counts = useMemo(
		() => ({
			semua: list.length,
			menunggu_bayar: list.filter((order) => order.status === "menunggu_bayar").length,
			diproses: list.filter((order) => order.status === "menunggu_verifikasi").length,
			selesai: list.filter((order) => order.status === "lunas").length,
			batal: list.filter((order) => order.status === "ditolak" || order.status === "hangus").length,
		}),
		[list],
	);

	const shown = list.filter((order) => {
		const matchTab =
			tab === "semua" ||
			(tab === "diproses" && order.status === "menunggu_verifikasi") ||
			(tab === "selesai" && order.status === "lunas") ||
			(tab === "batal" && (order.status === "ditolak" || order.status === "hangus")) ||
			tab === order.status;
		const q = query.trim().toLowerCase();
		const matchQuery =
			!q ||
			order.id.toLowerCase().includes(q) ||
			order.planName.toLowerCase().includes(q) ||
			planLabel(order).toLowerCase().includes(q);
		return matchTab && matchQuery;
	});

	const selected = list.find((order) => order.id === selectedOrderId) ?? null;
	const invoiceFor = (orderId: string) => invoices.data?.items.find((item) => item.orderId === orderId);

	useEffect(() => {
		if (!orders.data) return;
		if (Object.keys(previousStatus.current).length > 0) {
			for (const order of orders.data.orders) {
				if (previousStatus.current[order.id] === "menunggu_verifikasi" && order.status === "lunas") {
					toast.add({
						type: "success",
						description: `${planLabel(order)}: ${t`payment confirmed, your credits are in`}.`,
					});
					void queryClient.invalidateQueries({ queryKey: orpc.billing.balances.key() });
					void queryClient.invalidateQueries({ queryKey: orpc.invoice.list.key() });
				}
			}
		}
		previousStatus.current = Object.fromEntries(orders.data.orders.map((order) => [order.id, order.status]));
	}, [orders.data, queryClient, planLabel]);

	const bukaPesanan = (orderId: string) => {
		const invoice = invoiceFor(orderId);
		// A paid order already has a receipt, so the eye goes straight to the document instead of a payment screen.
		if (invoice) {
			setInvoiceOpen(invoice.id);
			return;
		}
		void navigate({ to: "/dashboard/transaksi", search: { order: orderId } });
	};

	return (
		<div className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-28 md:pb-12">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-sans text-2xl font-semibold text-ink">
						<Trans>Transactions</Trans>
					</h1>
					<p className="mt-1 hidden text-sm text-ink-2 sm:block">
						<Trans>All your orders and invoices.</Trans>
					</p>
				</div>
				<Button
					variant="secondary"
					size="sm"
					className="max-sm:hidden"
					onClick={() => void navigate({ to: "/dashboard/beli-kredit" })}
				>
					<Icon name="tag" size={16} />
					<Trans>Buy credits</Trans>
				</Button>
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-6">
				<Input
					type="search"
					value={query}
					placeholder={t`Search a plan or order number`}
					aria-label={t`Search orders`}
					className="w-full sm:w-72"
					onChange={(event) => setQuery(event.target.value)}
				/>
				{loading ? null : (
					<p className="hidden text-xs text-ink-3 tabular-nums sm:block">
						{counts.semua} <Trans>orders</Trans>
					</p>
				)}
			</div>

			{/* One scrolling row of pills at every width: two rows of underlined tabs read as a broken bar. */}
			<div className="mx-[-24px] mt-3 flex snap-x gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:px-0">
				{TABS.map((item) => {
					const count = counts[item];
					const active = tab === item;
					return (
						<button
							key={item}
							type="button"
							aria-pressed={active}
							onClick={() => setTab(item)}
							className={`flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors sm:min-h-10 sm:px-4 sm:text-sm ${
								active
									? "border-ink bg-ink font-medium text-bg"
									: "border-line text-ink-2 hover:border-line-2 hover:text-ink"
							}`}
						>
							{tabLabel(item)}
							{/* A zero on every tab is noise, so a count shows only when it is real or the tab is open. */}
							{count > 0 || active ? (
								<span className={`text-xs tabular-nums ${active ? "text-bg/70" : "text-ink-3"}`}>
									{loading ? "" : count}
								</span>
							) : null}
						</button>
					);
				})}
			</div>

			{selected && selected.status === "menunggu_verifikasi" ? (
				<section className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
					<Icon name="clock" size={20} className="mt-0.5 shrink-0 text-warn" />
					<div className="grid gap-1">
						<h2 className="text-sm font-medium text-ink">
							<Trans>Proof sent, waiting for a check</Trans>
						</h2>
						<p className="text-xs leading-5 text-ink-2">
							<Trans>
								An admin checks your transfer proof by hand. Credits arrive automatically once it passes, and this page
								tells you the moment the status changes.
							</Trans>
						</p>
					</div>
				</section>
			) : null}

			{selected && selected.status === "lunas" ? (
				<section className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line bg-surface p-4">
					<div className="flex items-start gap-3">
						<Icon name="check-circle" size={20} className="mt-0.5 shrink-0 text-accent-text" />
						<div className="grid gap-1">
							<h2 className="text-sm font-medium text-ink">
								<Trans>Payment confirmed</Trans>
							</h2>
							<p className="text-xs leading-5 text-ink-2">
								<Trans>The credits are in your account. An invoice is there if you need proof of payment.</Trans>
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							onClick={() =>
								void navigate({
									to: selected.kind === "interview" ? "/dashboard/career" : "/dashboard/applications",
								})
							}
						>
							{selected.kind === "interview" ? (
								<Trans>Open an application to practise</Trans>
							) : (
								<Trans>Open an application to use it</Trans>
							)}
						</Button>
						{invoiceFor(selected.id) ? (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									const invoice = invoiceFor(selected.id);
									if (invoice) setInvoiceOpen(invoice.id);
								}}
							>
								<Trans>View invoice</Trans>
							</Button>
						) : null}
					</div>
				</section>
			) : null}

			{selected && (selected.status === "ditolak" || selected.status === "hangus") ? (
				<section className="mt-4 grid gap-1 rounded-lg border border-line bg-surface p-4">
					<h2 className="text-sm font-medium text-ink">
						{selected.status === "hangus" ? <Trans>Order expired</Trans> : <Trans>Proof rejected</Trans>}
					</h2>
					<p className="text-xs leading-5 text-ink-2">
						{selected.rejectionReason ??
							(selected.status === "hangus" ? (
								<Trans>The payment deadline passed before the proof arrived. Create a new order to continue.</Trans>
							) : (
								<Trans>The proof did not match the amount on this order.</Trans>
							))}
					</p>
					<Button
						variant="secondary"
						size="sm"
						className="mt-2 w-fit"
						onClick={() => void navigate({ to: "/dashboard/beli-kredit" })}
					>
						<Trans>Create a new order</Trans>
					</Button>
				</section>
			) : null}

			{loading ? (
				<ul className="mt-2" aria-busy="true" aria-label={t`Loading orders`}>
					{[0, 1, 2].map((row) => (
						<li key={row} className="border-b border-line py-4 last:border-0">
							<div className="flex items-start justify-between gap-4">
								<div className="grid w-full gap-2">
									<span className="h-3.5 w-48 animate-pulse rounded-sm bg-sunken" />
									<span className="h-3 w-64 animate-pulse rounded-sm bg-sunken" />
								</div>
								<span className="h-3.5 w-20 shrink-0 animate-pulse rounded-sm bg-sunken" />
							</div>
						</li>
					))}
				</ul>
			) : shown.length === 0 ? (
				<div className="mt-2 border-b border-line py-10 text-center">
					<p className="text-sm text-ink-2">
						{query.trim() ? (
							<Trans>No order matches "{term}".</Trans>
						) : tab === "semua" ? (
							<Trans>No orders yet.</Trans>
						) : (
							<Trans>No orders in this tab.</Trans>
						)}
					</p>
					{query.trim() ? (
						<Button variant="ghost" size="sm" className="mt-3" onClick={() => setQuery("")}>
							<Trans>Clear the search</Trans>
						</Button>
					) : counts.semua === 0 ? (
						<Button
							variant="secondary"
							size="sm"
							className="mt-3"
							onClick={() => void navigate({ to: "/dashboard/beli-kredit" })}
						>
							<Trans>See the plans</Trans>
						</Button>
					) : null}
				</div>
			) : (
				<ul className="mt-2">
					{shown.map((order) => {
						const invoice = invoiceFor(order.id);
						const current = order.id === selected?.id;
						return (
							<li
								key={order.id}
								className={`border-b border-line py-4 last:border-0 ${current ? "bg-hover/40" : ""}`}
								aria-current={current ? "true" : undefined}
							>
								<div className="grid gap-2">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate text-sm text-ink">{planLabel(order)}</p>
											<p className="mt-0.5 text-xs text-ink-3 tabular-nums">
												{new Date(order.createdAt).toLocaleDateString(i18n.locale)} · <Trans>code</Trans>{" "}
												{String(order.uniqueCode).padStart(3, "0")}
												{invoice ? ` · ${invoice.number}` : null}
											</p>
										</div>
										<p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
											{formatRupiah(order.totalIdr)}
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium ${chipTone(order.status)}`}
										>
											{statusText(order.status)}
										</span>
										{order.status === "menunggu_bayar" && order.expiresAt ? (
											<span className="text-xs text-ink-3">
												<Trans>Ends in</Trans>{" "}
												<Countdown expiresAt={new Date(order.expiresAt)} onExpire={() => void orders.refetch()} />
											</span>
										) : null}
									</div>
									<Button
										variant={order.status === "menunggu_bayar" ? "primary" : "secondary"}
										className="h-11 w-full sm:h-9 sm:w-auto sm:justify-self-end"
										onClick={() => bukaPesanan(order.id)}
									>
										{order.status === "menunggu_bayar" ? (
											<Trans>Continue payment</Trans>
										) : invoice ? (
											<Trans>View invoice</Trans>
										) : (
											<Trans>View</Trans>
										)}
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			<InvoiceSheet invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
			<PaymentDialog
				orderId={selectedOrderId ?? null}
				onClose={() => void navigate({ to: "/dashboard/transaksi", search: {} })}
				onRestart={(next) => void navigate({ to: "/dashboard/transaksi", search: { order: next } })}
			/>
		</div>
	);
}
