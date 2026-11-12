import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { toast } from "@reactive-resume/ui/components/toast";
import {
	formatRupiah,
	MAX_PROOF_BYTES,
	ORDER_STATUS_LABEL,
	PROOF_ACCEPT,
	QRIS_IMAGE_PATH,
	whatsappLink,
} from "./config";
import { Countdown } from "./countdown";
import { InvoiceSheet } from "./invoice-sheet";
import { getPlanCopy } from "./plan-copy";
import { orpc } from "@/libs/orpc/client";

type Tab = "semua" | "menunggu_bayar" | "diproses" | "selesai" | "batal";

const TABS: Tab[] = ["semua", "menunggu_bayar", "diproses", "selesai", "batal"];

type TransactionsPageProps = { selectedOrderId?: string | undefined; isAdmin?: boolean };

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
	const uploadFile = useMutation(orpc.storage.uploadFile.mutationOptions({ meta: { noInvalidate: true } }));
	const attachProof = useMutation(orpc.billing.attachProof.mutationOptions());
	const [invoiceOpen, setInvoiceOpen] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>("semua");
	const [query, setQuery] = useState("");
	const [fileName, setFileName] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
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
	const uploadPending = uploadFile.isPending || attachProof.isPending;

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

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		const reset = () => {
			if (fileInput.current) fileInput.current.value = "";
		};
		if (file.type !== "image/jpeg" && file.type !== "image/png") {
			const message = t`The proof must be a JPG or PNG. PDF is not accepted.`;
			setUploadError(message);
			toast.add({ type: "error", description: message });
			reset();
			return;
		}
		if (file.size > MAX_PROOF_BYTES) {
			const message = t`The proof can be at most 10 MB.`;
			setUploadError(message);
			toast.add({ type: "error", description: message });
			reset();
			return;
		}
		setUploadError(null);
		setFileName(file.name);
		try {
			const uploaded = await uploadFile.mutateAsync(file);
			await attachProof.mutateAsync({
				orderId: selected.id,
				proofPath: uploaded.path,
				note: "Bukti dari halaman transaksi",
			});
			await queryClient.invalidateQueries();
			toast.add({
				type: "success",
				description: t`Proof sent. An admin checks it by hand, then the credits arrive automatically.`,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : t`The proof could not be sent. Try again.`;
			setUploadError(message);
			toast.add({ type: "error", description: message });
		} finally {
			setFileName(null);
			reset();
		}
	};

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
						<Trans>All your orders and receipts.</Trans>
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

			{selected && selected.status === "menunggu_bayar" ? (
				<section className="mt-4 overflow-hidden rounded-lg border border-line bg-raised">
					<header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
						<h2 className="text-sm font-medium text-ink">
							<Trans>Finish the payment</Trans>
						</h2>
						<span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs text-warn-text">
							<Trans>Time left</Trans>{" "}
							<Countdown
								expiresAt={selected.expiresAt ? new Date(selected.expiresAt) : null}
								onExpire={() => void orders.refetch()}
							/>
						</span>
					</header>
					<div className="grid gap-4 p-4 sm:grid-cols-[152px_minmax(0,1fr)] sm:gap-5">
						<div className="grid justify-items-center gap-2 sm:justify-items-start">
							<img
								src={QRIS_IMAGE_PATH}
								alt={t`PortoFit QRIS code`}
								className="w-[min(44vw,176px)] rounded-sm bg-white sm:w-full sm:max-w-[152px]"
								onError={(event) => {
									event.currentTarget.style.display = "none";
								}}
							/>
							<p className="text-center text-xs leading-4 text-ink-3 sm:max-w-[152px] sm:text-left sm:leading-5">
								<Trans>Scan it with any bank or wallet app that supports QRIS.</Trans>
							</p>
						</div>
						<div className="grid content-start gap-1">
							<p className="text-xs text-ink-3">
								<Trans>Total to transfer</Trans>
							</p>
							<p className="text-[28px] leading-8 font-semibold text-ink tabular-nums">
								{formatRupiah(selected.totalIdr)}
							</p>
							<p className="text-sm text-ink-2">{planLabel(selected)}</p>
							<p className="mt-1 text-xs text-ink-2">
								<Trans>Unique code</Trans>{" "}
								<span className="font-semibold text-ink tabular-nums">
									{String(selected.uniqueCode).padStart(3, "0")}
								</span>
								. <Trans>The amount has to match down to the last three digits.</Trans>
							</p>
							<div className="mt-3 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
								<Button
									variant="secondary"
									size="sm"
									className="w-full sm:w-auto"
									disabled={uploadPending}
									onClick={() => fileInput.current?.click()}
								>
									<Icon name="upload-simple" size={16} />
									{uploadPending ? <Trans>Uploading the proof…</Trans> : <Trans>Upload payment proof</Trans>}
								</Button>
								<input
									ref={fileInput}
									type="file"
									accept={PROOF_ACCEPT}
									aria-label={t`Upload payment proof`}
									className="sr-only"
									disabled={uploadPending}
									onChange={(event) => {
										const file = event.currentTarget.files?.[0];
										if (file) void kirimBukti(file);
									}}
								/>
								<Button
									variant="ghost"
									size="sm"
									className="w-full sm:w-auto"
									onClick={() =>
										window.open(
											whatsappLink(
												`Halo PortoFit, saya mau konfirmasi pembayaran ${selected.planName} total ${formatRupiah(selected.totalIdr)} (kode unik ${String(selected.uniqueCode).padStart(3, "0")}).`,
											),
											"_blank",
											"noopener",
										)
									}
								>
									<Trans>Or through WhatsApp</Trans>
								</Button>
							</div>
							<p className="mt-1 text-xs text-ink-3">
								<Trans>A photo of the transfer proof, JPG or PNG, at most 10 MB.</Trans>
							</p>
							{fileName ? <p className="truncate text-xs text-ink-3">{fileName}</p> : null}
							{uploadError ? (
								<p role="alert" className="mt-1 text-xs text-danger-text">
									{uploadError}
								</p>
							) : null}
						</div>
					</div>
				</section>
			) : null}

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
								<Trans>The credits are in your account. A receipt is there if you need proof of payment.</Trans>
							</p>
						</div>
					</div>
					{invoiceFor(selected.id) ? (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								const invoice = invoiceFor(selected.id);
								if (invoice) setInvoiceOpen(invoice.id);
							}}
						>
							<Trans>View receipt</Trans>
						</Button>
					) : null}
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
								<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
									<div className="min-w-0">
										<p className="truncate text-sm text-ink">{planLabel(order)}</p>
										<p className="mt-0.5 text-xs text-ink-3 tabular-nums">
											{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString(i18n.locale)} ·{" "}
											<Trans>code</Trans> {String(order.uniqueCode).padStart(3, "0")}
										</p>
										<p className="mt-1 text-xs text-ink-2">
											{statusText(order.status)}
											{order.status === "menunggu_bayar" && order.expiresAt ? (
												<>
													{" · "}
													<Trans>left</Trans>{" "}
													<Countdown expiresAt={new Date(order.expiresAt)} onExpire={() => void orders.refetch()} />
												</>
											) : null}
											{invoice ? ` · ${invoice.number}` : null}
										</p>
									</div>
									{/* Phones put the action on the left and the amount on the right, away from the help pill. */}
									<div className="flex items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:flex-col-reverse sm:items-end sm:gap-1">
										<Button variant="secondary" size="sm" onClick={() => bukaPesanan(order.id)}>
											{order.status === "menunggu_bayar" ? (
												<Trans>Pay</Trans>
											) : invoice ? (
												<Trans>View receipt</Trans>
											) : (
												<Trans>View</Trans>
											)}
										</Button>
										<p className="text-sm text-ink tabular-nums">{formatRupiah(order.totalIdr)}</p>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			<InvoiceSheet invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
		</div>
	);
}
