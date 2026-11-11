import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { orpc } from "@/libs/orpc/client";

type Tab = "semua" | "menunggu_bayar" | "diproses" | "selesai" | "batal";

const TABS: { id: Tab; label: string }[] = [
	{ id: "semua", label: "Semua" },
	{ id: "menunggu_bayar", label: "Menunggu bayar" },
	{ id: "diproses", label: "Diproses" },
	{ id: "selesai", label: "Selesai" },
	{ id: "batal", label: "Dibatalkan" },
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
		const matchQuery = !q || order.id.toLowerCase().includes(q) || order.planName.toLowerCase().includes(q);
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
						description: `${order.planName}: pembayaran dikonfirmasi, kreditmu sudah masuk.`,
					});
					void queryClient.invalidateQueries({ queryKey: orpc.billing.balances.key() });
					void queryClient.invalidateQueries({ queryKey: orpc.invoice.list.key() });
				}
			}
		}
		previousStatus.current = Object.fromEntries(orders.data.orders.map((order) => [order.id, order.status]));
	}, [orders.data, queryClient]);

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		const reset = () => {
			if (fileInput.current) fileInput.current.value = "";
		};
		if (file.type !== "image/jpeg" && file.type !== "image/png") {
			const message = "Bukti harus JPG atau PNG. PDF tidak diterima.";
			setUploadError(message);
			toast.add({ type: "error", description: message });
			reset();
			return;
		}
		if (file.size > MAX_PROOF_BYTES) {
			const message = "Ukuran bukti maksimal 10 MB.";
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
				description: "Bukti terkirim. Admin memverifikasi, lalu kredit masuk otomatis.",
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Bukti gagal dikirim. Coba lagi.";
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
					<p className="mt-1 hidden text-sm text-ink-2 sm:block">Semua pesanan dan kuitansimu.</p>
				</div>
				<Button variant="secondary" size="sm" className="max-sm:hidden" onClick={() => void navigate({ to: "/harga" })}>
					<Icon name="tag" size={16} />
					Beli kredit
				</Button>
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-6">
				<Input
					type="search"
					value={query}
					placeholder="Cari paket atau nomor pesanan"
					aria-label="Cari pesanan"
					className="w-full sm:w-72"
					onChange={(event) => setQuery(event.target.value)}
				/>
				{loading ? null : <p className="hidden text-xs text-ink-3 tabular-nums sm:block">{counts.semua} pesanan</p>}
			</div>

			{/* One scrolling row of pills at every width: two rows of underlined tabs read as a broken bar. */}
			<div className="-mx-6 mt-3 flex snap-x gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:px-0">
				{TABS.map((item) => {
					const count = counts[item.id];
					const active = tab === item.id;
					return (
						<button
							key={item.id}
							type="button"
							aria-pressed={active}
							onClick={() => setTab(item.id)}
							className={`flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors sm:min-h-10 sm:px-4 sm:text-sm ${
								active
									? "border-ink bg-ink font-medium text-bg"
									: "border-line text-ink-2 hover:border-line-2 hover:text-ink"
							}`}
						>
							{item.label}
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
						<h2 className="text-sm font-medium text-ink">Selesaikan pembayaran</h2>
						<span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs text-warn-text">
							Sisa waktu{" "}
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
								alt="Kode QRIS PortoFit"
								className="w-[min(44vw,176px)] rounded-sm bg-white sm:w-full sm:max-w-[152px]"
								onError={(event) => {
									event.currentTarget.style.display = "none";
								}}
							/>
							<p className="text-center text-xs leading-4 text-ink-3 sm:max-w-[152px] sm:text-left sm:leading-5">
								Pindai dengan aplikasi bank atau dompet digital yang mendukung QRIS.
							</p>
						</div>
						<div className="grid content-start gap-1">
							<p className="text-xs text-ink-3">Total transfer</p>
							<p className="text-[28px] leading-8 font-semibold text-ink tabular-nums">
								{formatRupiah(selected.totalIdr)}
							</p>
							<p className="text-sm text-ink-2">{selected.planName}</p>
							<p className="mt-1 text-xs text-ink-2">
								Kode unik{" "}
								<span className="font-semibold text-ink tabular-nums">
									{String(selected.uniqueCode).padStart(3, "0")}
								</span>
								. Nominal harus persis sampai tiga digit terakhir.
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
									{uploadPending ? "Mengunggah bukti…" : "Unggah bukti bayar"}
								</Button>
								<input
									ref={fileInput}
									type="file"
									accept={PROOF_ACCEPT}
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
									Atau lewat WhatsApp
								</Button>
							</div>
							<p className="mt-1 text-xs text-ink-3">Foto bukti transfer, JPG atau PNG, maksimal 10 MB.</p>
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
						<h2 className="text-sm font-medium text-ink">Bukti terkirim, menunggu verifikasi</h2>
						<p className="text-xs leading-5 text-ink-2">
							Admin memeriksa bukti transfermu secara manual. Kredit masuk otomatis setelah diverifikasi, dan halaman
							ini akan memberi tahu begitu statusnya berubah.
						</p>
					</div>
				</section>
			) : null}

			{selected && selected.status === "lunas" ? (
				<section className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line bg-surface p-4">
					<div className="flex items-start gap-3">
						<Icon name="check-circle" size={20} className="mt-0.5 shrink-0 text-accent-text" />
						<div className="grid gap-1">
							<h2 className="text-sm font-medium text-ink">Pembayaran dikonfirmasi</h2>
							<p className="text-xs leading-5 text-ink-2">
								Kredit sudah masuk ke akunmu. Kuitansi tersedia kalau kamu perlu bukti bayar.
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
							Lihat kuitansi
						</Button>
					) : null}
				</section>
			) : null}

			{selected && (selected.status === "ditolak" || selected.status === "hangus") ? (
				<section className="mt-4 grid gap-1 rounded-lg border border-line bg-surface p-4">
					<h2 className="text-sm font-medium text-ink">
						{selected.status === "hangus" ? "Pesanan hangus" : "Bukti ditolak"}
					</h2>
					<p className="text-xs leading-5 text-ink-2">
						{selected.rejectionReason ??
							(selected.status === "hangus"
								? "Batas waktu bayar lewat sebelum bukti masuk. Buat pesanan baru untuk melanjutkan."
								: "Bukti tidak cocok dengan nominal pesanan ini.")}
					</p>
					<Button variant="secondary" size="sm" className="mt-2 w-fit" onClick={() => void navigate({ to: "/harga" })}>
						Buat pesanan baru
					</Button>
				</section>
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
			) : shown.length === 0 ? (
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
											{invoice ? ` · ${invoice.number}` : null}
										</p>
									</div>
									{/* Phones put the action on the left and the amount on the right, away from the help pill. */}
									<div className="flex items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:flex-col-reverse sm:items-end sm:gap-1">
										<Button variant="secondary" size="sm" onClick={() => bukaPesanan(order.id)}>
											{order.status === "menunggu_bayar" ? "Bayar" : invoice ? "Lihat kuitansi" : "Lihat"}
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
