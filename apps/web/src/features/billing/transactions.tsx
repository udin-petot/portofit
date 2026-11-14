import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { formatRupiah, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "./config";
import { Countdown } from "./countdown";
import { InvoiceSheet } from "./invoice-sheet";
import { PaymentDialog } from "./payment-dialog";
import { getPlanCopy } from "./plan-copy";
import { D2, EASE } from "@/libs/motion";
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

	/** Bulan sebagai pemisah, seperti buku besar: orang mencari transaksi dengan mengingat kapan. */
	const groups = useMemo(() => {
		const buckets = new Map<string, typeof shown>();
		for (const order of shown) {
			const key = new Date(order.createdAt).toLocaleDateString(i18n.locale, { month: "long", year: "numeric" });
			const bucket = buckets.get(key);
			if (bucket) bucket.push(order);
			else buckets.set(key, [order]);
		}
		return [...buckets.entries()];
	}, [shown, i18n.locale]);

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

			{/* Satu baris alat: cari di kiri, saring di kanan. Dua baris terpisah memakan tinggi tanpa alasan. */}
			<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Input
					type="search"
					value={query}
					placeholder={t`Search a plan or order number`}
					aria-label={t`Search orders`}
					className="w-full sm:w-64"
					onChange={(event) => setQuery(event.target.value)}
				/>
				<div className="relative -mx-6 sm:mx-0">
					<div
						role="group"
						aria-label={t`Filter by status`}
						className="flex [scrollbar-width:none] overflow-x-auto px-6 pb-1 sm:overflow-visible sm:px-0 sm:pb-0"
					>
						<div className="flex shrink-0 gap-0.5 rounded-[9px] bg-sunken p-[3px]">
							{TABS.map((item) => {
								const count = counts[item];
								const active = tab === item;
								return (
									<button
										key={item}
										type="button"
										aria-pressed={active}
										onClick={() => setTab(item)}
										className={cn(
											"touch-target relative flex h-[30px] shrink-0 items-center gap-1.5 rounded-sm px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
											active ? "text-ink" : "text-ink-2 hover:text-ink",
										)}
									>
										{active && (
											<m.span
												layoutId="transactions-filter"
												transition={{ duration: D2, ease: EASE }}
												className="absolute inset-0 rounded-sm bg-raised shadow-e1"
											/>
										)}
										<span className="relative">{tabLabel(item)}</span>
										{/* A zero on every tab is noise, so a count shows only when it is real or the tab is open. */}
										{count > 0 || active ? (
											<span className={cn("relative text-xs tabular-nums", active ? "text-ink-2" : "text-ink-3")}>
												{loading ? "" : count}
											</span>
										) : null}
									</button>
								);
							})}
						</div>
						<span
							aria-hidden="true"
							className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-bg to-transparent sm:hidden"
						/>
					</div>
				</div>
			</div>

			{loading ? (
				<ul className="mt-4" aria-busy="true" aria-label={t`Loading orders`}>
					{[0, 1, 2].map((row) => (
						<li key={row} className="border-b border-line py-3.5 last:border-0">
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
				<div className="mt-4 rounded-lg border border-dashed border-line py-12 text-center">
					<p className="text-sm text-ink-2">
						{term ? (
							<Trans>No order matches "{term}".</Trans>
						) : tab === "semua" ? (
							<Trans>No orders yet.</Trans>
						) : (
							<Trans>No orders in this tab.</Trans>
						)}
					</p>
					{term ? (
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
				<div className="mt-2">
					{groups.map(([month, rows]) => (
						<section key={month}>
							<h2 className="px-2 pt-5 pb-2 text-xs font-medium text-ink-3">{month}</h2>
							<ul className="border-t border-line">
								{rows.map((order) => {
									const invoice = invoiceFor(order.id);
									const current = order.id === selected?.id;
									const awaiting = order.status === "menunggu_bayar";
									return (
										<li key={order.id} className="border-b border-line">
											<button
												type="button"
												onClick={() => bukaPesanan(order.id)}
												aria-current={current ? "true" : undefined}
												className={cn(
													"group flex w-full items-start justify-between gap-4 px-2 py-3.5 text-left transition-colors",
													"hover:bg-hover/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
													current && "bg-hover/40",
												)}
											>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-ink">{planLabel(order)}</p>
													<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-3">
														<span
															className={cn(
																"inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
																chipTone(order.status),
															)}
														>
															<span className="size-1.5 rounded-full bg-current" />
															{statusText(order.status)}
														</span>
														<span className="tabular-nums">
															{new Date(order.createdAt).toLocaleDateString(i18n.locale)}
														</span>
														<span aria-hidden="true">·</span>
														<span className="tabular-nums">
															<Trans>code</Trans> {String(order.uniqueCode).padStart(3, "0")}
														</span>
														{invoice ? (
															<>
																<span aria-hidden="true">·</span>
																<span className="tabular-nums">{invoice.number}</span>
															</>
														) : null}
														{awaiting && order.expiresAt ? (
															<>
																<span aria-hidden="true">·</span>
																<span className="text-warn-text tabular-nums">
																	<Trans>Ends in</Trans>{" "}
																	<Countdown
																		expiresAt={new Date(order.expiresAt)}
																		onExpire={() => void orders.refetch()}
																	/>
																</span>
															</>
														) : null}
													</div>
												</div>
												<div className="flex shrink-0 items-start gap-2.5 pt-0.5">
													<span className="text-sm font-semibold text-ink tabular-nums">
														{formatRupiah(order.totalIdr)}
													</span>
													<Icon
														name="caret-right"
														size={14}
														className="mt-1 text-ink-3 transition-transform group-hover:translate-x-0.5"
													/>
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						</section>
					))}
				</div>
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
