import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { formatRupiah, ORDER_STATUS_LABEL, QRIS_IMAGE_PATH, whatsappLink } from "./config";
import { Countdown } from "./countdown";
import { InvoiceSheet } from "./invoice-sheet";
import { orpc } from "@/libs/orpc/client";

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
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	const list = useMemo(() => orders.data?.orders ?? [], [orders.data]);
	const loading = orders.isLoading;
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
	// The open order already has its own panel above, so its row would only repeat the same price twice.
	const rows = selected ? shown.filter((order) => order.id !== selected.id) : shown;

	const uploadPending = uploadFile.isPending || attachProof.isPending;

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		setFileName(file.name);
		try {
			const uploaded = await uploadFile.mutateAsync(file);
			await attachProof.mutateAsync({
				orderId: selected.id,
				proofPath: uploaded.path,
				note: "Bukti dari halaman transaksi",
			});
			await queryClient.invalidateQueries();
		} finally {
			setFileName(null);
			if (fileInput.current) fileInput.current.value = "";
		}
	};

	const emptyCopy = () => {
		if (query.trim()) return `Tidak ada pesanan yang cocok dengan "${query.trim()}".`;
		if (tab === "semua") return "Belum ada pesanan.";
		return "Belum ada pesanan di tab ini.";
	};

	return (
		<div className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-28 md:pb-12">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-sans text-2xl font-semibold text-ink">Transaksi</h1>
					<p className="mt-1 text-sm text-ink-2">Semua pesanan dan kuitansimu.</p>
				</div>
				<Button variant="secondary" size="sm" onClick={() => void navigate({ to: "/harga" })}>
					<Icon name="tag" size={16} />
					Beli kredit
				</Button>
			</div>

			<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
				<Input
					type="search"
					value={query}
					placeholder="Cari paket atau nomor pesanan"
					aria-label="Cari pesanan"
					className="w-full sm:w-72"
					onChange={(event) => setQuery(event.target.value)}
				/>
				{loading ? null : <p className="text-xs text-ink-3 tabular-nums">{counts.semua} pesanan</p>}
			</div>

			<div className="mt-4 flex flex-wrap gap-x-1 border-b border-line">
				{TABS.map((item) => {
					const count = counts[item.id];
					return (
						<button
							key={item.id}
							type="button"
							aria-pressed={tab === item.id}
							onClick={() => setTab(item.id)}
							className={`flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm transition-colors ${
								tab === item.id ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
							}`}
						>
							{item.label}
							{/* A zero on every tab is noise, so a count shows only when it is real or the tab is open. */}
							{count > 0 || tab === item.id ? (
								<span className="text-xs text-ink-3 tabular-nums">{loading ? "" : count}</span>
							) : null}
						</button>
					);
				})}
			</div>

			{tab === "kuitansi" ? (
				<ul className="mt-2">
					{(invoices.data?.items ?? []).map((item) => (
						<li
							key={item.id}
							className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0"
						>
							<div className="min-w-0">
								<p className="truncate text-sm text-ink">{item.number}</p>
								<p className="text-xs text-ink-3 tabular-nums">
									{item.planName} · {new Date(item.issuedAt).toLocaleDateString("id-ID")}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-4">
								<span className="text-sm text-ink tabular-nums">{formatRupiah(item.totalIdr)}</span>
								<Button variant="ghost" size="sm" onClick={() => setInvoiceOpen(item.id)}>
									Lihat
								</Button>
							</div>
						</li>
					))}
					{(invoices.data?.items.length ?? 0) === 0 ? (
						<li className="py-6 text-sm text-ink-3">Belum ada kuitansi.</li>
					) : null}
				</ul>
			) : (
				<>
					{selected && selected.status === "menunggu_bayar" ? (
						<div className="mt-4 rounded-lg border border-line bg-raised p-4">
							<div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
								<div className="grid gap-2">
									<img
										src={QRIS_IMAGE_PATH}
										alt="Kode QRIS PortoFit"
										className="w-full max-w-[160px] self-start rounded-sm bg-white"
										onError={(event) => {
											event.currentTarget.style.display = "none";
										}}
									/>
									<p className="max-w-[160px] text-xs leading-5 text-ink-3">
										Pindai dengan aplikasi bank atau dompet digital yang mendukung QRIS.
									</p>
								</div>
								<div className="min-w-0">
									<p className="text-sm text-ink">{selected.planName}</p>
									<p className="mt-1 text-[22px] leading-6 font-semibold text-ink tabular-nums">
										{formatRupiah(selected.totalIdr)}
									</p>
									<p className="mt-1 text-xs text-ink-2 tabular-nums">
										Kode unik {String(selected.uniqueCode).padStart(3, "0")} · bayar dalam{" "}
										<Countdown
											expiresAt={selected.expiresAt ? new Date(selected.expiresAt) : null}
											onExpire={() => void orders.refetch()}
										/>
									</p>
									<p className="mt-1 text-xs text-ink-3">Nominal harus persis, termasuk tiga digit terakhir.</p>
									<div className="mt-3 flex flex-wrap items-center gap-2">
										<Button
											variant="secondary"
											size="sm"
											disabled={uploadPending}
											onClick={() => fileInput.current?.click()}
										>
											<Icon name="upload-simple" size={16} />
											{uploadPending ? "Mengunggah bukti…" : "Unggah bukti bayar"}
										</Button>
										<input
											ref={fileInput}
											type="file"
											accept="image/*,application/pdf"
											aria-label="Unggah bukti bayar"
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
											Atau lewat WhatsApp
										</Button>
									</div>
									{fileName ? <p className="mt-2 truncate text-xs text-ink-3">{fileName}</p> : null}
								</div>
							</div>
						</div>
					) : null}

					{loading ? (
						<ul className="mt-2" aria-busy="true" aria-label="Memuat pesanan">
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
					) : rows.length === 0 ? (
						<div className="mt-2 border-b border-line py-10 text-center">
							<p className="text-sm text-ink-2">{emptyCopy()}</p>
							{query.trim() ? (
								<Button variant="ghost" size="sm" className="mt-3" onClick={() => setQuery("")}>
									Hapus pencarian
								</Button>
							) : counts.semua === 0 ? (
								<Button variant="secondary" size="sm" className="mt-3" onClick={() => void navigate({ to: "/harga" })}>
									Lihat paket
								</Button>
							) : null}
						</div>
					) : (
						<ul className="mt-2">
							{rows.map((order) => (
								<li key={order.id} className="border-b border-line py-4 last:border-0">
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<p className="truncate text-sm text-ink">{order.planName}</p>
											<p className="mt-0.5 text-xs text-ink-3 tabular-nums">
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
										<div className="flex shrink-0 flex-col items-end gap-1">
											<p className="text-sm text-ink tabular-nums">{formatRupiah(order.totalIdr)}</p>
											<Button
												variant="secondary"
												size="sm"
												onClick={() => void navigate({ to: "/dashboard/transaksi", search: { order: order.id } })}
											>
												{order.status === "menunggu_bayar" ? "Bayar" : "Lihat"}
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</>
			)}

			<InvoiceSheet invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
		</div>
	);
}
