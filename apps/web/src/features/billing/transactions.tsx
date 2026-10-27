import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Input } from "@reactive-resume/ui/components/input";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah, ORDER_STATUS_LABEL, QRIS_IMAGE_PATH, whatsappLink } from "./config";

const STATUS_VARIANT: Record<string, "neutral" | "warn" | "accent" | "danger"> = {
	menunggu_bayar: "neutral",
	menunggu_verifikasi: "warn",
	lunas: "accent",
	ditolak: "danger",
};

type TransactionsPageProps = { selectedOrderId?: string | undefined };

export function TransactionsPage({ selectedOrderId }: TransactionsPageProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const balances = useQuery(orpc.billing.balances.queryOptions());
	const orders = useQuery(orpc.billing.myOrders.queryOptions({ input: { limit: 50 } }));
	const uploadFile = useMutation(orpc.storage.uploadFile.mutationOptions({ meta: { noInvalidate: true } }));
	const attachProof = useMutation(orpc.billing.attachProof.mutationOptions());

	const list = orders.data?.orders ?? [];
	const selected = list.find((order) => order.id === selectedOrderId) ?? list[0] ?? null;

	const openOrder = async (id: string) => {
		await navigate({ to: "/dashboard/transaksi", search: { order: id } });
	};

	const kirimBukti = async (file: File) => {
		if (!selected) return;
		const uploaded = await uploadFile.mutateAsync(file);
		await attachProof.mutateAsync({ orderId: selected.id, proofPath: uploaded.path, note: "Bukti dari halaman transaksi" });
		await queryClient.invalidateQueries();
	};

	return (
		<div className="mx-auto w-full max-w-4xl px-5 py-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-ink">Transaksi</h1>
					<p className="mt-1 text-sm text-ink-2">Pesanan, bukti bayar, dan sisa kredit kamu.</p>
				</div>
				<div className="flex gap-2">
					<Badge variant="outline">Kredit lamaran: {balances.data?.application ?? 0}</Badge>
					<Badge variant="outline">Kredit wawancara: {balances.data?.interview ?? 0}</Badge>
				</div>
			</header>

			<div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
				<section className="rounded-lg border border-line bg-surface">
					<h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Pesanan kamu</h2>
					{orders.isLoading ? (
						<p className="px-4 py-6 text-sm text-ink-3">Memuat pesanan…</p>
					) : list.length === 0 ? (
						<div className="px-4 py-10 text-center text-sm text-ink-3">
							<p>Belum ada pesanan.</p>
							<Button variant="secondary" size="sm" className="mt-3" onClick={() => void navigate({ to: "/harga" })}>
								Lihat paket
							</Button>
						</div>
					) : (
						<ul className="divide-y divide-line">
							{list.map((order) => (
								<li key={order.id}>
									<button
										type="button"
										onClick={() => void openOrder(order.id)}
										className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sunken"
									>
										<span className="min-w-0">
											<span className="block truncate text-sm font-medium text-ink">{order.planName}</span>
											<span className="mt-0.5 block text-xs text-ink-3">
												{new Date(order.createdAt).toLocaleDateString("id-ID")} · kode unik {String(order.uniqueCode).padStart(3, "0")}
											</span>
										</span>
										<span className="flex shrink-0 items-center gap-2">
											<span className="text-sm font-medium text-ink">{formatRupiah(order.totalIdr)}</span>
											<Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
										</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</section>

				<section className="rounded-lg border border-line bg-surface p-4">
					{selected ? (
						<>
							<h2 className="text-sm font-semibold text-ink">{selected.planName}</h2>
							<p className="mt-1 text-xs text-ink-3">
								Status: {ORDER_STATUS_LABEL[selected.status] ?? selected.status}
								{selected.rejectionReason ? ` · ${selected.rejectionReason}` : ""}
							</p>

							<div className="mt-4 rounded-md border border-line bg-sunken p-3 text-sm">
								<div className="flex justify-between text-ink-2">
									<span>Harga paket</span>
									<span>{formatRupiah(selected.amountIdr)}</span>
								</div>
								<div className="mt-1 flex justify-between text-ink-2">
									<span>Kode unik</span>
									<span>{String(selected.uniqueCode).padStart(3, "0")}</span>
								</div>
								<div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold text-ink">
									<span>Total bayar</span>
									<span>{formatRupiah(selected.totalIdr)}</span>
								</div>
							</div>

							{selected.status === "menunggu_bayar" || selected.status === "ditolak" ? (
								<>
									<img
										src={QRIS_IMAGE_PATH}
										alt="QRIS PortoFit"
										className="mt-4 w-full rounded-md border border-line bg-white object-contain"
										onError={(event) => {
											event.currentTarget.style.display = "none";
										}}
									/>
									<p className="mt-2 text-xs text-ink-3">
										Pindai QRIS, bayar tepat {formatRupiah(selected.totalIdr)}, lalu unggah bukti di bawah atau kirim lewat WhatsApp.
									</p>
									<div className="mt-3 grid gap-2">
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
											variant="secondary"
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
											Kirim bukti lewat WhatsApp
										</Button>
									</div>
									{(uploadFile.isPending || attachProof.isPending) && <p className="mt-2 text-xs text-ink-3">Mengunggah bukti…</p>}
									{(uploadFile.isError || attachProof.isError) && <p className="mt-2 text-xs text-danger-text">Bukti gagal diunggah. Coba lagi atau kirim lewat WhatsApp.</p>}
								</>
							) : (
								<p className="mt-4 rounded-md border border-line bg-sunken p-3 text-xs text-ink-2">
									{selected.status === "menunggu_verifikasi"
										? "Bukti sudah masuk. Admin memverifikasi manual, biasanya pada hari yang sama."
										: "Pesanan sudah lunas. Kredit masuk ke saldo akunmu."}
								</p>
							)}
						</>
					) : (
						<p className="text-sm text-ink-3">Pilih pesanan untuk melihat detail pembayaran.</p>
					)}
				</section>
			</div>
		</div>
	);
}
