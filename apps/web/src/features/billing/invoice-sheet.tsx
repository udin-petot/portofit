import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { orpc } from "@/libs/orpc/client";

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

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

/** Invoice dibuka sebagai lembar dokumen, bukan kartu aplikasi. */
export function InvoiceSheet({ invoiceId, onClose, onResend }: InvoiceSheetProps) {
	const { i18n } = useLingui();
	const preview = useQuery({
		...orpc.invoice.preview.queryOptions({ input: { invoiceId: invoiceId ?? "" } }),
		enabled: Boolean(invoiceId),
	});
	const download = useMutation(orpc.invoice.download.mutationOptions({ meta: { noInvalidate: true } }));

	const tanggal = (value: string | Date) =>
		new Intl.DateTimeFormat(i18n.locale, { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(value));

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
			<button type="button" aria-label={t`Close invoice`} className="absolute inset-0 bg-black/40" onClick={onClose} />
			<aside className="relative flex h-full w-full max-w-[540px] flex-col border-s border-line bg-surface">
				<header className="flex items-center justify-between border-b border-line px-4 py-3">
					<span className="flex items-center gap-2 text-sm font-medium text-ink">
						<Icon name="note" size={16} className="text-ink-3" />
						<Trans>Invoice</Trans>
						{data?.number ? <span className="font-normal text-ink-3">{data.number}</span> : null}
					</span>
					<Button size="icon" variant="ghost" aria-label={t`Close`} onClick={onClose}>
						<Icon name="x" size={18} />
					</Button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto bg-[#f3f1ec] p-4">
					{preview.isLoading ? (
						<p className="py-16 text-center text-sm text-ink-3">
							<Trans>Loading invoice…</Trans>
						</p>
					) : !data ? (
						<p className="py-16 text-center text-sm text-ink-3">
							<Trans>This invoice has not been issued yet.</Trans>
						</p>
					) : (
						<article className="mx-auto w-full max-w-[600px] overflow-hidden rounded-lg bg-white text-[#1C1B15] shadow-sm">
							<div className="h-1.5 bg-[#337344]" />

							<div className="flex items-start justify-between px-7 pt-7">
								<div>
									<div className="flex items-center gap-2.5">
										<span className="grid size-8 place-items-center rounded-[7px] bg-[#337344] text-[13px] font-bold text-white">
											PF
										</span>
										<span className="text-sm font-bold tracking-[0.14em]">PORTOFIT</span>
									</div>
									<p className="mt-1.5 text-[11px] text-[#6B6A60]">www.portofit.tech</p>
								</div>
								<div className="text-right">
									<p className="text-[22px] font-bold tracking-[0.16em]">INVOICE</p>
									<p className="mt-1 text-xs text-[#6B6A60]">{data.number}</p>
									<span className="mt-2 inline-block rounded-full bg-[#DCF2DF] px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#195C2E]">
										<Trans>PAID</Trans>
									</span>
								</div>
							</div>

							<div className="mx-7 mt-5 border-t border-[#E4E1D8]" />

							<div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.95fr)] gap-4 px-7 py-5">
								<div className="min-w-0">
									<p className="text-[9px] uppercase tracking-[0.12em] text-[#6B6A60]">
										<Trans>Issued to</Trans>
									</p>
									<p className="mt-1 text-[12px] font-semibold break-words">{data.snapshot.customerName}</p>
									<p className="text-[11px] break-all text-[#6B6A60]">{data.snapshot.customerEmail}</p>
								</div>
								<div className="min-w-0">
									<p className="text-[9px] uppercase tracking-[0.12em] text-[#6B6A60]">
										<Trans>Date</Trans>
									</p>
									<p className="mt-1 text-[12px] font-semibold">{tanggal(data.issuedAt)}</p>
									<p className="text-[11px] text-[#6B6A60]">
										<Trans>Paid {tanggal(data.snapshot.paidAt)}</Trans>
									</p>
									{data.snapshot.uniqueCode > 0 ? (
										<p className="text-[11px] text-[#6B6A60]">
											<Trans>Unique code</Trans> {String(data.snapshot.uniqueCode).padStart(3, "0")}
										</p>
									) : null}
								</div>
								<div className="min-w-0">
									<p className="text-[9px] uppercase tracking-[0.12em] text-[#6B6A60]">
										<Trans>Payment</Trans>
									</p>
									<p className="mt-1 text-[12px] font-semibold uppercase">{data.snapshot.paymentMethod}</p>
									<p className="text-[11px] text-[#6B6A60]">
										<Trans>Checked by hand</Trans>
									</p>
								</div>
							</div>

							<div className="px-7">
								<div className="flex items-center rounded-t-md bg-[#F6F4EE] px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-[#6B6A60]">
									<span className="flex-1">
										<Trans>Description</Trans>
									</span>
									<span className="w-16 text-right">
										<Trans>Credits</Trans>
									</span>
									<span className="w-24 text-right">
										<Trans>Amount</Trans>
									</span>
								</div>

								<div className="flex items-center border-b border-[#E4E1D8] px-3 py-2.5 text-[12px]">
									<span className="flex-1">
										<Trans>Package {data.snapshot.planName}</Trans>
									</span>
									<span className="w-16 text-right">{data.snapshot.credits}</span>
									<span className="w-24 text-right">{rupiah(data.snapshot.amountIdr)}</span>
								</div>

								<div className="flex items-center rounded-b-md bg-[#DCF2DF] px-3 py-3">
									<span className="flex-1 text-[10px] font-bold tracking-[0.12em] text-[#195C2E]">
										<Trans>TOTAL PAID</Trans>
									</span>
									<span className="text-lg font-bold text-[#195C2E]">{rupiah(data.snapshot.totalIdr)}</span>
								</div>
							</div>

							<div className="px-7 pb-7 pt-5">
								<p className="text-[10px] leading-relaxed text-[#6B6A60]">
									<span className="font-semibold text-[#1C1B15]">
										<Trans>This invoice is not a tax invoice.</Trans>
									</span>{" "}
									<Trans>
										Keep it as proof of payment. The number is issued once an admin checks the payment, and it does
										not change when a package price changes later.
									</Trans>
								</p>
								<p className="mt-2 text-[10px] leading-relaxed text-[#6B6A60]">
									<Trans>Questions about a charge: Help in the dashboard, or WhatsApp 081939948769.</Trans>
								</p>
							</div>
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
						<Trans>Download PDF</Trans>
					</Button>
					{onResend ? (
						<Button variant="secondary" onClick={() => onResend(invoiceId)}>
							<Trans>Send again</Trans>
						</Button>
					) : null}
				</footer>
			</aside>
		</div>
	);
}
