import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah, ORDER_STATUS_LABEL, QRIS_IMAGE_PATH, whatsappLink } from "./config";
import { Countdown } from "./countdown";
import { InvoiceSheet } from "./invoice-sheet";

type Tab = "semua" | "menunggu_bayar" | "diproses" | "selesai" | "batal" | "kuitansi";

const TABS: { id: Tab; label: string }[] = [
	{ id: "semua", label: "Semua" },
	{ id: "menunggu_bayar", label: "Menunggu bayar" },
	{ id: "diproses", label: "Diproses" },
	{ id: "selesai", label: "Selesai" },
	{ id: "batal", label: "Dibatalkan" },
	{ id: "kuitansi", label: "Kuitansi" },
];

const statusText = (status: string) => statusTextMap[status] ?? ORDER_STATUS_LABEL[status] ?? status;

const statusTextMap: Record<string, string> = {
	menunggu_bayar: "Menunggu bayar",
	menunggu_verifikasi: "Diproses",
	lunas: "Selesai",
	ditolak: "Dibatalkan",
	hangus: "Dibatalkan",
};

type TransactionsPageProps = { selectedOrderId?: string | undefined; isAdmin?: boolean };

export function TransactionsPage({ selectedOrderId }: TransactionsPageProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const orders = useQuery(orpc.billing.myOrders.queryOptions({ input: { limit: 100 } }));
	const invoices = useQuery(orpc.invoice.list.queryOptions());
	const uploadFile = useMutation(orpc.storage.uploadFile.mutationOptions({ meta: { noInvalidate: true } }));
	const attachProof = useMutation(orpc.billing.attachProof.mutationOptions());
	const [invoiceOpen, setInvoiceOpen] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>("semua");
	const [query, setQuery] = useState("");

	const list = orders.data?.orders ?? [];
	const counts = useMemo(
		() => ({
			semua: list.length,
			menunggu_bayar: list.filter((order) => order.status === "menunggu_bayar").length,
			diproses: list.filter((order) => order.status === "menunggu_verifikasi").length,
			selesai: list.filter((order) => order.status === "lunas").length,
			batal: list.filter((order) => order.status === "ditolak" || order.status === "hangus").length,
			kuitansi: invoices.data?.items.length ?? 0,
		}),
		[list, invoices.data],
	);

	const shown = list.filter((order) => {
		const matchTab =
			tab === "semua" ||
			(tab === "diproses" && order.status === "menunggu_verifikasi") ||
			(tab === "selesai" && order.status === "lunas") ||
			(tab === "batal" && (order.status === "ditolak" || order.status === "hangus")) ||
			tab === order.status;
		const q = query.trim().toLowerCase();
		const matchQuery = !q || order.id.toLowerCase().includes(q) || order.planName.toLowerCase().includes(q);
		return matchTab && matchQuery;
	});

	const selected = list.find((order) => order.id === selectedOrderId) ?? null;

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		const uploaded = await uploadFile.mutateAsync(file);
		await attachProof.mutateAsync({ orderId: selected.id, proofPath: uploaded.path, note: "Bukti dari halaman transaksi" });
		await queryClient.invalidateQueries();
	};

	return (
		<div className="mx-auto w-full max-w-[860px] px-5 pt-7 pb-28 md:pb-12">
			<h1 className="text-2xl font-semibold text-ink">Transaksi</h1>
			<p className="mt-1 text-sm text-ink-2">Semua pesanan dan kuitansimu.</p>

			<div className="mt-5 flex flex-wrap items-center gap-2">
				<Input
					type="search"
					value={query}
					placeholder="Cari paket atau nomor pesanan"
					aria-label="Cari pesanan"
					className="w-full sm:w-72"
					onChange={(event) => setQuery(event.target.value)}
				/>
			</div>

			<div className="mt-4 flex gap-1 overflow-x-auto border-b border-line pb-px">
				{TABS.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setTab(item.id)}
						className={`shrink-0 border-b-2 px-3 py-2 text-sm transition-colors ${
							tab === item.id ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
						}`}
					>
						{item.label}
						<span className="ml-1.5 tabular-nums text-xs text-ink-3">{counts[item.id]}</span>
					</button>
				))}
			</div>

			{tab === "kuitansi" ? (
				<ul className="mt-3">
					{(invoices.data?.items ?? []).map((item) => (
						<li key={item.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
							<div className="min-w-0">
								<p className="truncate text-sm text-ink">{item.number}</p>
								<p className="text-xs tabular-nums text-ink-3">
									{item.planName} · {new Date(item.issuedAt).toLocaleDateString("id-ID")}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-4">
								<span className="text-sm tabular-nums text-ink">{formatRupiah(item.totalIdr)}</span>
								<Button variant="link" className="text-xs" onClick={() => setInvoiceOpen(item.id)}>
									Lihat
								</Button>
							</div>
						</li>
					))}
					{(invoices.data?.items.length ?? 0) === 0 ? <li className="py-6 text-sm text-ink-3">Belum ada kuitansi.</li> : null}
				</ul>
			) : (
				<>
					{selected && selected.status === "menunggu_bayar" ? (
						<div className="mt-4 grid gap-4 border border-line bg-surface p-4 sm:grid-cols-[160px_minmax(0,1fr)]">
							<img
								src={QRIS_IMAGE_PATH}
								alt="QRIS PortoFit"
								className="w-full max-w-[160px] self-start bg-white"
								onError={(event) => {
									event.currentTarget.style.display = "none";
								}}
							/>
							<div className="min-w-0">
								<p className="text-sm text-ink">{selected.planName}</p>
								<p className="mt-1 text-[22px] leading-6 font-semibold tabular-nums text-ink">{formatRupiah(selected.totalIdr)}</p>
								<p className="mt-1 text-xs tabular-nums text-ink-2">
									Kode unik {String(selected.uniqueCode).padStart(3, "0")} · bayar dalam{" "}
									<Countdown expiresAt={selected.expiresAt ? new Date(selected.expiresAt) : null} onExpire={() => void orders.refetch()} />
								</p>
								<div className="mt-3 grid gap-2">
									<Input
										type="file"
										accept="image/*,application/pdf"
										aria-label="Unggah bukti bayar"
										disabled={uploadFile.isPending || attachProof.isPending}
										onChange={(event) => {
											const file = event.currentTarget.files?.[0];
											if (file) void kirimBukti(file);
										}}
									/>
									<Button
										variant="link"
										className="justify-start text-xs"
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
										Atau kirim bukti lewat WhatsApp
									</Button>
								</div>
							</div>
						</div>
					) : null}

					<ul className="mt-3">
						{shown.map((order) => (
							<li key={order.id} className="border-b border-line py-4 last:border-0">
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0">
										<p className="truncate text-sm text-ink">{order.planName}</p>
										<p className="mt-0.5 text-xs tabular-nums text-ink-3">
											{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString("id-ID")} · kode{" "}
											{String(order.uniqueCode).padStart(3, "0")}
										</p>
										<p className="mt-1 text-xs text-ink-2">
											{statusText(order.status)}
											{order.status === "menunggu_bayar" && order.expiresAt ? (
												<>
													{" · sisa "}
													<Countdown expiresAt={new Date(order.expiresAt)} onExpire={() => void orders.refetch()} />
												</>
											) : null}
										</p>
									</div>
									<div className="shrink-0 text-right">
										<p className="text-sm tabular-nums text-ink">{formatRupiah(order.totalIdr)}</p>
										<Button
											variant="link"
											className="mt-1 text-xs"
											onClick={() => void navigate({ to: "/dashboard/transaksi", search: { order: order.id } })}
										>
											{order.status === "menunggu_bayar" ? "Bayar" : "Lihat"}
										</Button>
									</div>
								</div>
							</li>
						))}
						{shown.length === 0 ? <li className="py-8 text-sm text-ink-3">Tidak ada pesanan di tab ini.</li> : null}
					</ul>
				</>
			)}

			<InvoiceSheet invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
		</div>
	);
}
