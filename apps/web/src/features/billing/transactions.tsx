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

const statusInk = (status: string) =>
	status === "lunas" ? "text-ink" : status === "ditolak" ? "text-danger-text" : "text-ink-2";

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
	const unpaid = running.filter((order) => order.status === "menunggu_bayar").length;

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		const uploaded = await uploadFile.mutateAsync(file);
		await attachProof.mutateAsync({ orderId: selected.id, proofPath: uploaded.path, note: "Bukti dari halaman transaksi" });
		await queryClient.invalidateQueries();
	};

	return (
		<div className="mx-auto w-full max-w-[1080px] px-5 pt-7 pb-28 md:pb-12">
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold text-ink">Transaksi</h1>
					<p className="mt-1 text-sm text-ink-2">
						{unpaid > 0 ? `${unpaid} pesanan belum dibayar.` : "Tidak ada pembayaran yang menunggu."}{" "}
						{(balances.data?.application ?? 0) + (balances.data?.interview ?? 0) === 0
							? "Saldo kredit habis."
							: `Sisa ${(balances.data?.application ?? 0) + (balances.data?.interview ?? 0)} kredit.`}
					</p>
				</div>
				<Button variant="secondary" onClick={() => void navigate({ to: "/harga" })}>
					Beli kredit
				</Button>
			</header>

			<section className="mt-6 grid grid-cols-2 divide-x divide-line border-y border-line">
				<div className="px-0 py-4 pr-5">
					<p className="text-xs text-ink-3">Kredit lamaran</p>
					<p className="mt-1 text-[26px] leading-7 font-normal tabular-nums text-ink">{balances.data?.application ?? 0}</p>
					<p className="mt-1 text-xs text-ink-2">{formatRupiah(5000)} per lamaran</p>
				</div>
				<div className="py-4 pl-5">
					<p className="text-xs text-ink-3">Kredit wawancara</p>
					<p className="mt-1 text-[26px] leading-7 font-normal tabular-nums text-ink">{balances.data?.interview ?? 0}</p>
					<p className="mt-1 text-xs text-ink-2">{formatRupiah(10000)} per sesi</p>
				</div>
			</section>

			{running.length > 0 ? (
				<section className="mt-10">
					<h2 className="text-sm font-semibold text-ink">Perlu dibayar</h2>

					{selected ? (
						<div className="mt-3 grid gap-5 border border-line bg-surface p-4 sm:grid-cols-[180px_minmax(0,1fr)]">
							{selected.status === "menunggu_bayar" || selected.status === "ditolak" ? (
								<img
									src={QRIS_IMAGE_PATH}
									alt="QRIS PortoFit"
									className="w-full max-w-[180px] self-start bg-white"
									onError={(event) => {
										event.currentTarget.style.display = "none";
									}}
								/>
							) : (
								<p className="text-sm text-ink-2">Bukti sudah masuk. Admin memverifikasi manual.</p>
							)}

							<div className="min-w-0">
								<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
									<p className="text-sm text-ink">{selected.planName}</p>
									<p className="text-[22px] leading-6 font-semibold tabular-nums text-ink">{formatRupiah(selected.totalIdr)}</p>
								</div>
								<p className="mt-1 text-xs tabular-nums text-ink-2">
									Kode unik {String(selected.uniqueCode).padStart(3, "0")} · {ORDER_STATUS_LABEL[selected.status] ?? selected.status}
									{selected.status === "menunggu_bayar" && selected.expiresAt ? (
										<>
											{" · bayar dalam "}
											<Countdown expiresAt={new Date(selected.expiresAt)} onExpire={() => void orders.refetch()} />
										</>
									) : null}
								</p>

								{selected.status === "menunggu_bayar" || selected.status === "ditolak" ? (
									<div className="mt-3 grid gap-2">
										<label className="text-xs text-ink-2" htmlFor="bukti-bayar">
											Unggah bukti bayar
										</label>
										<Input
											id="bukti-bayar"
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
								) : null}

								{(uploadFile.isPending || attachProof.isPending) && <p className="mt-2 text-xs text-ink-3">Mengunggah bukti…</p>}
								{(uploadFile.isError || attachProof.isError) && (
									<p className="mt-2 text-xs text-danger-text">Bukti gagal diunggah. Coba lagi atau kirim lewat WhatsApp.</p>
								)}
							</div>
						</div>
					) : null}

					<ul className="mt-3">
						{running.map((order) => (
							<li
								key={order.id}
								className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-line py-3 last:border-0"
							>
								<span className="min-w-0">
									<span className="block truncate text-sm text-ink">{order.planName}</span>
									<span className="text-xs tabular-nums text-ink-3">Kode {String(order.uniqueCode).padStart(3, "0")}</span>
								</span>
								<span className="text-right">
									<span className="block text-sm tabular-nums text-ink">{formatRupiah(order.totalIdr)}</span>
									<span className="block text-xs tabular-nums text-ink-3">
										{order.status === "menunggu_bayar" && order.expiresAt ? (
											<Countdown expiresAt={new Date(order.expiresAt)} onExpire={() => void orders.refetch()} />
										) : (
											ORDER_STATUS_LABEL[order.status]
										)}
									</span>
								</span>
								<Button
									size="sm"
									variant={selected?.id === order.id ? "secondary" : "ghost"}
									onClick={() => void navigate({ to: "/dashboard/transaksi", search: { order: order.id } })}
								>
									{order.status === "menunggu_bayar" ? "Bayar" : "Lihat"}
								</Button>
							</li>
						))}
					</ul>
				</section>
			) : null}

			{history.length > 0 ? (
				<section className="mt-10">
					<div className="flex items-baseline justify-between">
						<h2 className="text-sm font-semibold text-ink">Riwayat pesanan</h2>
						<span className="text-xs tabular-nums text-ink-3">{history.length} pesanan</span>
					</div>
					<table className="mt-2 w-full border-collapse text-sm">
						<thead>
							<tr className="text-xs text-ink-3">
								<th className="py-2 text-left font-normal">Paket</th>
								<th className="py-2 text-left font-normal max-sm:hidden">Tanggal</th>
								<th className="py-2 text-right font-normal">Total</th>
								<th className="py-2 text-right font-normal">Status</th>
							</tr>
						</thead>
						<tbody>
							{history.map((order) => (
								<tr key={order.id} className="border-t border-line">
									<td className="py-2.5 pr-3 text-ink">{order.planName}</td>
									<td className="py-2.5 pr-3 tabular-nums text-ink-2 max-sm:hidden">
										{new Date(order.createdAt).toLocaleDateString("id-ID")}
									</td>
									<td className="py-2.5 text-right tabular-nums text-ink">{formatRupiah(order.totalIdr)}</td>
									<td className={`py-2.5 pl-3 text-right text-xs ${statusInk(order.status)}`}>
										{ORDER_STATUS_LABEL[order.status] ?? order.status}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
			) : null}

			{invoices.data && invoices.data.items.length > 0 ? (
				<section className="mt-10">
					<h2 className="text-sm font-semibold text-ink">Kuitansi</h2>
					<table className="mt-2 w-full border-collapse text-sm">
						<thead>
							<tr className="text-xs text-ink-3">
								<th className="py-2 text-left font-normal">Nomor</th>
								<th className="py-2 text-left font-normal max-sm:hidden">Tanggal</th>
								<th className="py-2 text-right font-normal">Total</th>
								<th className="py-2 text-right font-normal"> </th>
							</tr>
						</thead>
						<tbody>
							{invoices.data.items.map((item) => (
								<tr key={item.id} className="border-t border-line">
									<td className="py-2.5 pr-3 text-ink">{item.number}</td>
									<td className="py-2.5 pr-3 tabular-nums text-ink-2 max-sm:hidden">
										{new Date(item.issuedAt).toLocaleDateString("id-ID")}
									</td>
									<td className="py-2.5 text-right tabular-nums text-ink">{formatRupiah(item.totalIdr)}</td>
									<td className="py-2.5 pl-3 text-right">
										<Button variant="link" className="text-xs" onClick={() => setInvoiceOpen(item.id)}>
											Lihat
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
			) : null}

			<section className="mt-10">
				<h2 className="text-sm font-semibold text-ink">Riwayat kredit</h2>
				{ledger.isLoading ? (
					<p className="mt-2 text-sm text-ink-3">Memuat…</p>
				) : entries.length === 0 ? (
					<p className="mt-2 text-sm text-ink-3">Belum ada pemakaian kredit.</p>
				) : (
					<table className="mt-2 w-full border-collapse text-sm">
						<thead>
							<tr className="text-xs text-ink-3">
								<th className="py-2 text-left font-normal">Keterangan</th>
								<th className="py-2 text-left font-normal max-sm:hidden">Tanggal</th>
								<th className="py-2 text-right font-normal">Kredit</th>
								<th className="py-2 text-right font-normal">Sisa</th>
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => (
								<tr key={entry.id} className="border-t border-line">
									<td className="py-2.5 pr-3 text-ink">
										{entry.reason}
										<span className="block text-xs text-ink-3">{KIND_LABEL[entry.kind] ?? entry.kind}</span>
									</td>
									<td className="py-2.5 pr-3 tabular-nums text-ink-2 max-sm:hidden">
										{new Date(entry.createdAt).toLocaleString("id-ID")}
									</td>
									<td className="py-2.5 text-right tabular-nums text-ink">{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</td>
									<td className="py-2.5 pl-3 text-right tabular-nums text-ink-2">{entry.balanceAfter}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>

			{isAdmin ? (
				<div className="mt-8">
					<Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/admin" })}>
						Panel admin
					</Button>
				</div>
			) : null}

			<InvoiceSheet invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
		</div>
	);
}
