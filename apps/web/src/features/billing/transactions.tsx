import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah, ORDER_STATUS_LABEL, QRIS_IMAGE_PATH, whatsappLink } from "./config";
import { Countdown } from "./countdown";
import { InvoiceSheet } from "./invoice-sheet";

const KIND_LABEL: Record<string, string> = { application: "Lamaran", interview: "Wawancara" };

const STATUS_DOT: Record<string, string> = {
	lunas: "bg-accent",
	menunggu_verifikasi: "bg-warn",
	ditolak: "bg-danger",
	hangus: "bg-ink-3",
	menunggu_bayar: "bg-ink-3",
};

type TransactionsPageProps = { selectedOrderId?: string | undefined; isAdmin?: boolean };

export function TransactionsPage({ selectedOrderId, isAdmin = false }: TransactionsPageProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const balances = useQuery(orpc.billing.balances.queryOptions());
	const ledger = useQuery(orpc.billing.ledger.queryOptions({ input: { limit: 20 } }));
	const orders = useQuery(orpc.billing.myOrders.queryOptions({ input: { limit: 50 } }));
	const uploadFile = useMutation(orpc.storage.uploadFile.mutationOptions({ meta: { noInvalidate: true } }));
	const attachProof = useMutation(orpc.billing.attachProof.mutationOptions());
	const invoices = useQuery(orpc.invoice.list.queryOptions());
	const [invoiceOpen, setInvoiceOpen] = useState<string | null>(null);

	const list = orders.data?.orders ?? [];
	const entries = ledger.data?.entries ?? [];
	const running = list.filter((order) => order.status === "menunggu_bayar" || order.status === "menunggu_verifikasi");
	const history = list.filter((order) => order.status !== "menunggu_bayar" && order.status !== "menunggu_verifikasi");
	const selected = list.find((order) => order.id === selectedOrderId) ?? running[0] ?? null;

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		const uploaded = await uploadFile.mutateAsync(file);
		await attachProof.mutateAsync({ orderId: selected.id, proofPath: uploaded.path, note: "Bukti dari halaman transaksi" });
		await queryClient.invalidateQueries();
	};

	return (
		<div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-28 md:pb-12">
			<header>
				<h1 className="font-display text-[34px] leading-10 font-medium text-ink">Transaksi</h1>
				<p className="mt-2 text-sm text-ink-2">Kredit yang tersisa, pesanan yang berjalan, dan bukti pembayaran.</p>
			</header>

			<section className="mt-10 grid gap-8 sm:grid-cols-2">
				<div>
					<p className="text-xs text-ink-3">Kredit lamaran</p>
					<p className="mt-1 font-display text-5xl leading-none text-ink">{balances.data?.application ?? 0}</p>
					<p className="mt-2 text-sm text-ink-2">Rp5.000 per kredit, untuk satu lowongan.</p>
					<Button variant="link" className="mt-2" onClick={() => void navigate({ to: "/harga" })}>
						Beli kredit
					</Button>
				</div>
				<div>
					<p className="text-xs text-ink-3">Kredit wawancara</p>
					<p className="mt-1 font-display text-5xl leading-none text-ink">{balances.data?.interview ?? 0}</p>
					<p className="mt-2 text-sm text-ink-2">Rp10.000 per kredit, untuk satu sesi latihan.</p>
					<Button variant="link" className="mt-2" onClick={() => void navigate({ to: "/harga" })}>
						Beli kredit
					</Button>
				</div>
			</section>

			{running.length > 0 ? (
				<section className="mt-12">
					<h2 className="text-sm font-medium text-ink">Menunggu pembayaran</h2>
					<ul className="mt-3">
						{running.map((order) => (
							<li key={order.id} className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-ink">{order.planName}</p>
									<p className="mt-1 text-xs text-ink-3">
										{formatRupiah(order.totalIdr)} · kode {String(order.uniqueCode).padStart(3, "0")}
										{order.status === "menunggu_bayar" && order.expiresAt ? (
											<>
												{" · sisa "}
												<Countdown expiresAt={new Date(order.expiresAt)} onExpire={() => void orders.refetch()} />
											</>
										) : null}
									</p>
								</div>
								<Button
									size="sm"
									variant={selected?.id === order.id ? "secondary" : "primary"}
									onClick={() => void navigate({ to: "/dashboard/transaksi", search: { order: order.id } })}
								>
									{order.status === "menunggu_bayar" ? "Bayar" : "Lihat"}
								</Button>
							</li>
						))}
					</ul>

					{selected ? (
						<div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
							{selected.status === "menunggu_bayar" || selected.status === "ditolak" ? (
								<img
									src={QRIS_IMAGE_PATH}
									alt="QRIS PortoFit"
									className="w-full max-w-[240px] bg-white"
									onError={(event) => {
										event.currentTarget.style.display = "none";
									}}
								/>
							) : null}
							<div>
								<p className="text-xs text-ink-3">Total bayar</p>
								<p className="mt-1 font-display text-3xl text-ink">{formatRupiah(selected.totalIdr)}</p>
								<p className="mt-1 text-sm text-ink-2">
									{selected.planName} · kode unik {String(selected.uniqueCode).padStart(3, "0")}
								</p>

								{selected.status === "menunggu_bayar" || selected.status === "ditolak" ? (
									<div className="mt-4 grid gap-2">
										<Input
											type="file"
											accept="image/*,application/pdf"
											disabled={uploadFile.isPending || attachProof.isPending}
											onChange={(event) => {
												const file = event.currentTarget.files?.[0];
												if (file) void kirimBukti(file);
											}}
										/>
										<Button
											variant="link"
											className="justify-start"
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
											Kirim bukti lewat WhatsApp
										</Button>
									</div>
								) : (
									<p className="mt-4 text-sm text-ink-2">
										{selected.status === "menunggu_verifikasi"
											? "Bukti sudah masuk, menunggu verifikasi admin."
											: selected.status === "hangus"
												? "Pesanan ini hangus karena lewat batas waktu."
												: "Pesanan sudah lunas."}
									</p>
								)}

								{(uploadFile.isPending || attachProof.isPending) && <p className="mt-2 text-xs text-ink-3">Mengunggah bukti…</p>}
								{(uploadFile.isError || attachProof.isError) && (
									<p className="mt-2 text-xs text-danger-text">Bukti gagal diunggah. Coba lagi atau kirim lewat WhatsApp.</p>
								)}
							</div>
						</div>
					) : null}
				</section>
			) : null}

			{history.length > 0 ? (
				<section className="mt-12">
					<h2 className="text-sm font-medium text-ink">Riwayat pesanan</h2>
					<ul className="mt-3">
						{history.map((order) => (
							<li key={order.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
								<div className="min-w-0">
									<p className="truncate text-sm text-ink">{order.planName}</p>
									<p className="text-xs text-ink-3">
										{new Date(order.createdAt).toLocaleDateString("id-ID")} · kode {String(order.uniqueCode).padStart(3, "0")}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-4">
									<span className="text-sm text-ink">{formatRupiah(order.totalIdr)}</span>
									<span className="flex items-center gap-1.5 text-xs text-ink-2">
										<span className={`size-1.5 rounded-full ${STATUS_DOT[order.status] ?? "bg-ink-3"}`} />
										{ORDER_STATUS_LABEL[order.status] ?? order.status}
									</span>
								</div>
							</li>
						))}
					</ul>
				</section>
			) : null}

			{invoices.data && invoices.data.items.length > 0 ? (
				<section className="mt-12">
					<h2 className="text-sm font-medium text-ink">Kuitansi</h2>
					<ul className="mt-3">
						{invoices.data.items.map((item) => (
							<li key={item.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
								<div className="min-w-0">
									<p className="truncate text-sm text-ink">{item.number}</p>
									<p className="text-xs text-ink-3">
										{item.planName} · {new Date(item.issuedAt).toLocaleDateString("id-ID")} · {formatRupiah(item.totalIdr)}
									</p>
								</div>
								<Button variant="link" onClick={() => setInvoiceOpen(item.id)}>
									Lihat
								</Button>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<section className="mt-12">
				<h2 className="text-sm font-medium text-ink">Riwayat kredit</h2>
				{ledger.isLoading ? (
					<p className="mt-3 text-sm text-ink-3">Memuat…</p>
				) : entries.length === 0 ? (
					<p className="mt-3 text-sm text-ink-3">Belum ada pemakaian kredit.</p>
				) : (
					<ul className="mt-3">
						{entries.map((entry) => (
							<li key={entry.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
								<div className="min-w-0">
									<p className="truncate text-sm text-ink">{entry.reason}</p>
									<p className="text-xs text-ink-3">
										{KIND_LABEL[entry.kind] ?? entry.kind} · {new Date(entry.createdAt).toLocaleString("id-ID")}
									</p>
								</div>
								<div className="shrink-0 text-right">
									<p className="text-sm text-ink">{entry.delta > 0 ? `+${entry.delta}` : entry.delta} kredit</p>
									<p className="text-xs text-ink-3">sisa {entry.balanceAfter}</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			{isAdmin ? (
				<div className="mt-10">
					<Button variant="secondary" size="sm" onClick={() => void navigate({ to: "/admin" })}>
						Panel admin
					</Button>
				</div>
			) : null}

			<InvoiceSheet invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
		</div>
	);
}
