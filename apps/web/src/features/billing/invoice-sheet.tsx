import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { orpc } from "@/libs/orpc/client";

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

const tanggal = (value: string | Date) =>
	new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(value));

export function savePdf(base64: string, fileName: string) {
	const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
	const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

type InvoiceSheetProps = { invoiceId: string | null; onClose: () => void; onResend?: (invoiceId: string) => void };

/** Kuitansi dibuka sebagai lembar dokumen, bukan kartu aplikasi. */
export function InvoiceSheet({ invoiceId, onClose, onResend }: InvoiceSheetProps) {
	const preview = useQuery({
		...orpc.invoice.preview.queryOptions({ input: { invoiceId: invoiceId ?? "" } }),
		enabled: Boolean(invoiceId),
	});
	const download = useMutation(orpc.invoice.download.mutationOptions({ meta: { noInvalidate: true } }));

	useEffect(() => {
		if (!invoiceId) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [invoiceId, onClose]);

	if (!invoiceId) return null;
	const data = preview.data;

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			<button type="button" aria-label="Tutup kuitansi" className="absolute inset-0 bg-black/40" onClick={onClose} />
			<aside className="relative flex h-full w-full max-w-[420px] flex-col border-s border-line bg-surface">
				<header className="flex items-center justify-between border-b border-line px-4 py-3">
					<span className="text-sm font-medium text-ink">{data?.number ?? "Kuitansi"}</span>
					<Button size="icon" variant="ghost" aria-label="Tutup" onClick={onClose}>
						<Icon name="x" size={18} />
					</Button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto bg-[#f3f1ec] p-4">
					{preview.isLoading ? (
						<p className="py-16 text-center text-sm text-ink-3">Memuat kuitansi…</p>
					) : !data ? (
						<p className="py-16 text-center text-sm text-ink-3">Kuitansi belum terbit.</p>
					) : (
						<article className="mx-auto w-full max-w-[560px] bg-white px-7 py-8 text-[#111111] shadow-sm">
							<header className="flex items-start justify-between">
								<div>
									<p className="text-lg font-semibold">PortoFit</p>
									<p className="text-[11px] text-[#666]">www.portofit.tech</p>
								</div>
								<p className="font-display text-2xl">Kuitansi</p>
							</header>

							<div className="mt-6 flex justify-between text-[12px]">
								<div>
									<p className="text-[10px] uppercase tracking-[0.08em] text-[#777]">Nomor</p>
									<p className="mt-1">{data.number}</p>
								</div>
								<div className="text-right">
									<p className="text-[10px] uppercase tracking-[0.08em] text-[#777]">Tanggal</p>
									<p className="mt-1">{tanggal(data.issuedAt)}</p>
								</div>
							</div>

							<section className="mt-6">
								<p className="text-[10px] uppercase tracking-[0.08em] text-[#777]">Dibayar oleh</p>
								<p className="mt-1 text-[13px] font-medium">{data.snapshot.customerName}</p>
								<p className="text-[12px] text-[#555]">{data.snapshot.customerEmail}</p>
							</section>

							<section className="mt-6 text-[12px]">
								<div className="flex justify-between border-b border-[#e5e2dc] py-2">
									<span>
										Paket {data.snapshot.planName} · {data.snapshot.credits} kredit
									</span>
									<span>{rupiah(data.snapshot.amountIdr)}</span>
								</div>
								<div className="flex justify-between border-b border-[#e5e2dc] py-2">
									<span>Kode unik</span>
									<span>{data.snapshot.uniqueCode}</span>
								</div>
								<div className="mt-1 flex items-baseline justify-between border-t border-[#111] pt-3">
									<span className="text-[13px] font-medium">Total dibayar</span>
									<span className="text-xl font-semibold">{rupiah(data.snapshot.totalIdr)}</span>
								</div>
							</section>

							<footer className="mt-8 text-[10px] leading-relaxed text-[#666]">
								Kuitansi ini bukan faktur pajak. Diverifikasi {tanggal(data.snapshot.paidAt)}. Pertanyaan lewat Bantuan di dasbor.
							</footer>
						</article>
					)}
				</div>

				<footer className="flex items-center gap-2 border-t border-line px-4 py-3">
					<Button
						className="flex-1"
						disabled={!data || download.isPending}
						onClick={async () => {
							if (!data) return;
							const result = await download.mutateAsync({ invoiceId });
							savePdf(result.pdf, result.fileName);
						}}
					>
						Unduh PDF
					</Button>
					{onResend ? (
						<Button variant="secondary" onClick={() => onResend(invoiceId)}>
							Kirim ulang
						</Button>
					) : null}
				</footer>
			</aside>
		</div>
	);
}
