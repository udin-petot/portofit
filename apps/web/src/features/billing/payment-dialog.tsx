import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Dialog, DialogContent, DialogTitle } from "@reactive-resume/ui/components/dialog";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@reactive-resume/ui/components/sheet";
import { formatRupiah, PROOF_ACCEPT, whatsappLink } from "./config";
import { Countdown } from "./countdown";
import { savePdf } from "./invoice-sheet";
import { paymentPhase } from "./payment-phase";
import { getPlanCopy } from "./plan-copy";
import { QrMorph } from "./qr-morph";
import { useNarrowScreen } from "./use-narrow-screen";
import { useProofUpload } from "./use-proof-upload";
import { orpc } from "@/libs/orpc/client";

type PaymentDialogProps = {
	orderId: string | null;
	onClose: () => void;
	/** Dipanggil setelah pesanan baru dibuat dari keadaan hangus atau ditolak. */
	onRestart?: ((orderId: string) => void) | undefined;
};

/**
 * Pembayaran manual di satu popup. Ponsel memakai lembar bawah, desktop memakai dialog tengah.
 * Menutup popup tidak membatalkan pesanan: status hidup di server dan bisa dibuka lagi kapan saja.
 */
export function PaymentDialog({ orderId, onClose, onRestart }: PaymentDialogProps) {
	const narrow = useNarrowScreen();
	const { i18n } = useLingui();
	const english = i18n.locale.startsWith("en");
	const [expired, setExpired] = useState(false);
	const [copied, setCopied] = useState(false);
	const [uploadedAt, setUploadedAt] = useState<number | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const proof = useProofUpload(orderId, "Bukti dari popup pembayaran");

	useEffect(() => {
		setExpired(false);
		setCopied(false);
		setUploadedAt(null);
	}, [orderId]);

	const status = useQuery({
		...orpc.billing.orderStatus.queryOptions({ input: { orderId: orderId ?? "" } }),
		enabled: Boolean(orderId),
		refetchInterval: (query) => {
			const state = query.state.data?.order.status;
			if (state === "lunas" || state === "hangus" || state === "ditolak") return false;
			const fresh = uploadedAt !== null && Date.now() - uploadedAt < 30_000;
			return fresh ? 5_000 : 15_000;
		},
	});

	const order = status.data?.order;
	const balances = status.data?.balances;
	const invoiceId = status.data?.invoiceId ?? null;
	const invoiceNumber = status.data?.invoiceNumber ?? null;
	const expiresAt = order?.expiresAt ? new Date(order.expiresAt) : null;
	const phase = paymentPhase({
		status: order?.status,
		expiresAt: expired ? new Date(0) : expiresAt,
		now: new Date(),
		isPending: proof.isPending,
		statusErrors: status.failureCount,
	});

	const createOrder = useMutation(orpc.billing.createOrder.mutationOptions());
	const downloadInvoice = useMutation(orpc.invoice.download.mutationOptions({ meta: { noInvalidate: true } }));

	const plan = order
		? getPlanCopy({ code: order.planCode, name: order.planName, description: null, kind: order.kind }, english)
		: null;
	const unit = order?.kind === "interview" ? t`kredit wawancara` : t`kredit lamaran`;

	const copyAmount = async () => {
		if (!order) return;
		await navigator.clipboard.writeText(String(order.totalIdr));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleFile = async (file: File) => {
		const sent = await proof.upload(file);
		if (!sent) return;
		setUploadedAt(Date.now());
		void status.refetch();
	};

	const restart = async () => {
		if (!order) return;
		const next = await createOrder.mutateAsync({ planCode: order.planCode });
		onRestart?.(next.id);
	};

	const title =
		phase === "lunas"
			? t`Pembayaran diterima`
			: phase === "kedaluwarsa"
				? t`Waktu habis`
				: phase === "ditolak"
					? t`Bukti ditolak`
					: phase === "galat"
						? t`Koneksi bermasalah`
						: phase === "menunggu_dicek"
							? t`Menunggu dicek admin`
							: t`Selesaikan pembayaran`;

	const summary = order ? (
		<div className="grid gap-0.5">
			<p className="text-[11px] tracking-[0.06em] text-ink-3 uppercase">
				<Trans>Total bayar</Trans>
			</p>
			<p className="text-[30px] leading-9 font-semibold text-ink tabular-nums max-sm:text-[28px]">
				{formatRupiah(order.totalIdr)}
			</p>
			<p className="truncate text-[13px] text-ink-3">{plan?.name}</p>
		</div>
	) : (
		<div className="grid gap-2" aria-hidden="true">
			<span className="h-2.5 w-20 animate-pulse rounded-sm bg-sunken" />
			<span className="h-8 w-40 animate-pulse rounded-sm bg-sunken" />
		</div>
	);

	const waiting = (
		<>
			<div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-sunken px-3 py-2.5">
				<div>
					<p className="text-[11px] text-ink-3">
						<Trans>Kode unik</Trans>
					</p>
					<p className="font-mono text-sm font-semibold tracking-[0.08em] text-ink">
						{String(order?.uniqueCode ?? 0).padStart(3, "0")}
					</p>
				</div>
				<Button variant="secondary" size="sm" onClick={() => void copyAmount()}>
					{copied ? <Trans>Tersalin</Trans> : <Trans>Salin nominal</Trans>}
				</Button>
			</div>

			<QrMorph phase={phase} />

			<div className="mx-auto flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-xs text-warn-text">
				<Icon name="clock" size={13} />
				<Trans>Berlaku</Trans>
				<Countdown
					expiresAt={expiresAt}
					onExpire={() => setExpired(true)}
					className="font-medium text-warn-text"
				/>
				<Trans>lagi</Trans>
			</div>

			<p className="text-center text-xs leading-5 text-ink-2">
				<Trans>
					Bayar tepat sampai tiga angka terakhir. Pindai dengan aplikasi bank atau dompet digital apa pun yang
					mendukung QRIS.
				</Trans>
			</p>

			<input
				ref={fileInput}
				type="file"
				accept={PROOF_ACCEPT}
				aria-label={t`Unggah bukti bayar`}
				className="sr-only"
				disabled={proof.isPending}
				onChange={(event) => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = "";
					if (file) void handleFile(file);
				}}
			/>

			<div className="grid gap-2">
				<Button className="h-11 w-full" disabled={proof.isPending} onClick={() => fileInput.current?.click()}>
					<Icon name="upload-simple" size={16} />
					{proof.isPending ? <Trans>Mengunggah bukti…</Trans> : <Trans>Unggah bukti bayar</Trans>}
				</Button>
				<Button
					variant="secondary"
					className="h-11 w-full"
					onClick={() =>
						window.open(
							whatsappLink(
								`Halo PortoFit, saya mau konfirmasi pembayaran ${plan?.name ?? ""} total ${formatRupiah(
									order?.totalIdr ?? 0,
								)} (kode unik ${String(order?.uniqueCode ?? 0).padStart(3, "0")}).`,
							),
							"_blank",
							"noopener",
						)
					}
				>
					<Icon name="chat-text" size={16} />
					<Trans>Kirim bukti lewat WhatsApp</Trans>
				</Button>
			</div>

			{proof.error ? (
				<p role="alert" className="text-center text-xs text-danger-text">
					{proof.error}
				</p>
			) : null}

			<p className="text-center text-[11px] text-ink-3">
				<Trans>Bisa ditutup kapan saja, pesanan tetap tersimpan di Transaksi.</Trans>
			</p>
		</>
	);

	const reviewing = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[15px] font-semibold text-ink">
					<Trans>Bukti sudah masuk</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					<Trans>Admin memeriksa manual, biasanya kurang dari satu hari kerja. Kredit langsung masuk setelah lolos.</Trans>
				</p>
			</div>
			<div className="grid gap-1.5 rounded-lg border border-line bg-sunken px-3 py-2.5 text-[13px]">
				<div className="flex justify-between gap-3">
					<span className="text-ink-3">
						<Trans>Paket</Trans>
					</span>
					<span className="truncate text-ink">{plan?.name}</span>
				</div>
				<div className="flex justify-between gap-3">
					<span className="text-ink-3">
						<Trans>Dibayar</Trans>
					</span>
					<span className="text-ink tabular-nums">{formatRupiah(order?.totalIdr ?? 0)}</span>
				</div>
			</div>
			<Button variant="secondary" className="h-11 w-full" onClick={onClose}>
				<Trans>Tutup</Trans>
			</Button>
			<p className="text-center text-[11px] text-ink-3">
				<Trans>Kami kabari lewat email begitu diverifikasi.</Trans>
			</p>
		</>
	);

	const paid = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Pembayaran diterima</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					{order?.credits ?? 1} {unit} <Trans>masuk ke akunmu.</Trans>
					{balances ? (
						<>
							{" "}
							<Trans>Saldo sekarang</Trans>{" "}
							{order?.kind === "interview" ? balances.interview : balances.application}.
						</>
					) : null}
				</p>
			</div>
			{invoiceNumber ? (
				<div className="flex items-center justify-between rounded-lg border border-line bg-sunken px-3 py-2.5 text-[13px]">
					<span className="text-ink-3">
						<Trans>Invoice</Trans>
					</span>
					<span className="font-medium text-ink tabular-nums">{invoiceNumber}</span>
				</div>
			) : null}
			<div className="grid gap-2">
				<Button
					className="h-11 w-full"
					disabled={!invoiceId || downloadInvoice.isPending}
					onClick={async () => {
						if (!invoiceId) return;
						const result = await downloadInvoice.mutateAsync({ invoiceId });
						savePdf(result.pdf, result.fileName);
					}}
				>
					<Trans>Unduh invoice</Trans>
				</Button>
				<Button variant="secondary" className="h-11 w-full" onClick={onClose}>
					<Trans>Selesai</Trans>
				</Button>
			</div>
		</>
	);

	const expiredBlock = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Pesanan kedaluwarsa</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					<Trans>Batas waktu lewat sebelum bukti masuk. Pesanan ini ditutup dan tidak bisa dibayar lagi.</Trans>
				</p>
			</div>
			<div className="grid gap-2">
				<Button className="h-11 w-full" disabled={createOrder.isPending} onClick={() => void restart()}>
					{createOrder.isPending ? <Trans>Menyiapkan…</Trans> : <Trans>Buat pesanan baru</Trans>}
				</Button>
				<Button variant="secondary" className="h-11 w-full" onClick={onClose}>
					<Trans>Tutup</Trans>
				</Button>
			</div>
		</>
	);

	const rejected = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Bukti tidak cocok</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					{order?.rejectionReason ?? <Trans>Nominal atau bukti tidak sesuai dengan pesanan ini.</Trans>}
				</p>
			</div>
			<div className="grid gap-2">
				<Button className="h-11 w-full" disabled={proof.isPending} onClick={() => fileInput.current?.click()}>
					{proof.isPending ? <Trans>Mengunggah bukti…</Trans> : <Trans>Unggah bukti lain</Trans>}
				</Button>
				<Button variant="secondary" className="h-11 w-full" disabled={createOrder.isPending} onClick={() => void restart()}>
					<Trans>Buat pesanan baru</Trans>
				</Button>
			</div>
			{proof.error ? (
				<p role="alert" className="text-center text-xs text-danger-text">
					{proof.error}
				</p>
			) : null}
		</>
	);

	const failed = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Status tidak terbaca</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					<Trans>Koneksi bermasalah. Pesananmu tetap tersimpan, coba muat ulang statusnya.</Trans>
				</p>
			</div>
			<Button className="h-11 w-full" onClick={() => void status.refetch()}>
				<Trans>Coba lagi</Trans>
			</Button>
		</>
	);

	const body = (
		<div className="grid gap-4">
			{phase === "menyiapkan" ? (
				<>
					<div className="mx-auto size-[240px] animate-pulse rounded-xl bg-sunken" />
					<p className="text-center text-xs text-ink-3">
						<Trans>Menyiapkan pembayaran…</Trans>
					</p>
				</>
			) : (
				<>
					{summary}
					{phase === "menunggu" || phase === "mengunggah" ? waiting : null}
					{phase === "menunggu_dicek" ? reviewing : null}
					{phase === "lunas" ? paid : null}
					{phase === "kedaluwarsa" ? expiredBlock : null}
					{phase === "ditolak" ? rejected : null}
					{phase === "galat" ? failed : null}
				</>
			)}
		</div>
	);

	if (!orderId) return null;

	const handleOpenChange = (open: boolean) => {
		if (open) return;
		if (proof.isPending) return;
		onClose();
	};

	if (narrow) {
		return (
			<Sheet open onOpenChange={handleOpenChange}>
				<SheetContent
					side="bottom"
					showCloseButton={!proof.isPending}
					closeLabel={t`Tutup`}
					className="max-h-[92svh] gap-2 pb-[env(safe-area-inset-bottom)]"
				>
					<SheetHeader>
						<SheetTitle className="font-sans text-[17px] font-semibold">{title}</SheetTitle>
					</SheetHeader>
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">{body}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={!proof.isPending} closeLabel={t`Tutup`} className="max-w-[460px] p-5">
				<DialogTitle className="font-sans text-[17px] font-semibold">{title}</DialogTitle>
				<div aria-live="polite" className="sr-only">
					{title}
				</div>
				{body}
			</DialogContent>
		</Dialog>
	);
}
