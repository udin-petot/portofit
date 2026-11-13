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
			// Setelah bukti terkirim, admin bisa memverifikasi kapan saja: rapatkan dulu, lalu longgarkan.
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
	const credits = order?.credits ?? 1;
	const creditUnit = (() => {
		if (order?.kind === "interview") return credits === 1 ? t`interview credit` : t`interview credits`;
		return credits === 1 ? t`application credit` : t`application credits`;
	})();

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
			? t`Payment received`
			: phase === "kedaluwarsa"
				? t`Time is up`
				: phase === "ditolak"
					? t`Proof rejected`
					: phase === "galat"
						? t`Connection problem`
						: phase === "menunggu_dicek"
							? t`Checking your proof`
							: t`Finish the payment`;

	const summary = order ? (
		<div className="grid gap-0.5">
			<p className="text-[11px] tracking-[0.06em] text-ink-3 uppercase">
				{phase === "menunggu" || phase === "mengunggah" ? (
					<Trans>Total to pay</Trans>
				) : (
					<Trans>Total</Trans>
				)}
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
						<Trans>Unique code</Trans>
					</p>
					<p className="font-mono text-sm font-semibold tracking-[0.08em] text-ink">
						{String(order?.uniqueCode ?? 0).padStart(3, "0")}
					</p>
				</div>
				<Button variant="secondary" size="sm" onClick={() => void copyAmount()}>
					{copied ? <Trans>Copied</Trans> : <Trans>Copy the amount</Trans>}
				</Button>
			</div>

			<QrMorph phase={phase} />

			<div className="mx-auto flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-xs text-warn-text">
				<Icon name="clock" size={13} />
				<Trans>Valid for</Trans>
				<Countdown expiresAt={expiresAt} onExpire={() => setExpired(true)} className="font-medium text-warn-text" />
				<Trans>more</Trans>
			</div>

			<p className="text-center text-xs leading-5 text-ink-2">
				<Trans>
					Pay the exact amount down to the last three digits. Scan it with any bank or wallet app that supports
					QRIS.
				</Trans>
			</p>

			<input
				ref={fileInput}
				type="file"
				accept={PROOF_ACCEPT}
				aria-label={t`Upload payment proof`}
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
					{proof.isPending ? <Trans>Uploading the proof…</Trans> : <Trans>Upload payment proof</Trans>}
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
					<Trans>Send the proof on WhatsApp</Trans>
				</Button>
			</div>

			{proof.error ? (
				<p role="alert" className="text-center text-xs text-danger-text">
					{proof.error}
				</p>
			) : null}

			<p className="text-center text-[11px] text-ink-3">
				<Trans>You can close this any time; the order stays in Transactions.</Trans>
			</p>
		</>
	);

	const reviewing = (
		<>
			<QrMorph phase={phase} />
			<p className="mx-auto max-w-[330px] text-center text-[13px] leading-5 text-ink-2">
				<Trans>Proof sent. An admin checks it by hand, usually within one working day.</Trans>
				<br />
				<span className="text-ink-3">
					<Trans>Credits land in your account the moment it passes.</Trans>
				</span>
			</p>
			<dl className="divide-y divide-line rounded-lg border border-line">
				<div className="flex items-center justify-between gap-3 px-3 py-2.5">
					<dt className="text-xs text-ink-3">
						<Trans>Plan</Trans>
					</dt>
					<dd className="max-w-[230px] truncate text-[13px] text-ink">{plan?.name}</dd>
				</div>
				<div className="flex items-center justify-between gap-3 px-3 py-2.5">
					<dt className="text-xs text-ink-3">
						<Trans>Paid</Trans>
					</dt>
					<dd className="text-[13px] text-ink tabular-nums">{formatRupiah(order?.totalIdr ?? 0)}</dd>
				</div>
				<div className="flex items-center justify-between gap-3 px-3 py-2.5">
					<dt className="text-xs text-ink-3">
						<Trans>Status</Trans>
					</dt>
					<dd>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-[11px] font-medium text-warn-text">
							<span className="size-1.5 rounded-full bg-current" />
							<Trans>In review</Trans>
						</span>
					</dd>
				</div>
			</dl>
			<Button variant="secondary" className="h-11 w-full" onClick={onClose}>
				<Trans>Close</Trans>
			</Button>
			<p className="text-center text-[11px] text-ink-3">
				<Trans>We email you the moment it is verified.</Trans>
			</p>
		</>
	);

	const paid = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Payment received</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					{credits} {creditUnit} <Trans>added to your account.</Trans>
					{balances ? (
						<>
							{" "}
							<Trans>Balance now</Trans>{" "}
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
					<Trans>Download invoice</Trans>
				</Button>
				<Button variant="secondary" className="h-11 w-full" onClick={onClose}>
					<Trans>Done</Trans>
				</Button>
			</div>
		</>
	);

	const expiredBlock = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Order expired</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					<Trans>The deadline passed before the proof arrived. This order is closed and cannot be paid again.</Trans>
				</p>
			</div>
			<div className="grid gap-2">
				<Button className="h-11 w-full" disabled={createOrder.isPending} onClick={() => void restart()}>
					{createOrder.isPending ? <Trans>Preparing…</Trans> : <Trans>Create a new order</Trans>}
				</Button>
				<Button variant="secondary" className="h-11 w-full" onClick={onClose}>
					<Trans>Close</Trans>
				</Button>
			</div>
		</>
	);

	const rejected = (
		<>
			<QrMorph phase={phase} />
			<div className="grid gap-1 text-center">
				<p className="text-[17px] font-semibold text-ink">
					<Trans>Proof did not match</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					{order?.rejectionReason ?? <Trans>The amount or the proof does not match this order.</Trans>}
				</p>
			</div>
			<div className="grid gap-2">
				<Button className="h-11 w-full" disabled={proof.isPending} onClick={() => fileInput.current?.click()}>
					{proof.isPending ? <Trans>Uploading the proof…</Trans> : <Trans>Upload another proof</Trans>}
				</Button>
				<Button variant="secondary" className="h-11 w-full" disabled={createOrder.isPending} onClick={() => void restart()}>
					<Trans>Create a new order</Trans>
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
					<Trans>Status could not be read</Trans>
				</p>
				<p className="text-[13px] leading-5 text-ink-2">
					<Trans>Connection problem. Your order is still saved, try loading its status again.</Trans>
				</p>
			</div>
			<Button className="h-11 w-full" onClick={() => void status.refetch()}>
				<Trans>Try again</Trans>
			</Button>
		</>
	);

	const body = (
		<div className="grid gap-4">
			{phase === "menyiapkan" ? (
				<>
					<div className="mx-auto size-[240px] animate-pulse rounded-xl bg-sunken" />
					<p className="text-center text-xs text-ink-3">
						<Trans>Preparing your payment…</Trans>
					</p>
				</>
			) : (
				<>
					{phase === "menunggu_dicek" ? null : summary}
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
					closeLabel={t`Close`}
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
			<DialogContent showCloseButton={!proof.isPending} closeLabel={t`Close`} className="max-w-[460px] p-5">
				<DialogTitle className="font-sans text-[17px] font-semibold">{title}</DialogTitle>
				<div aria-live="polite" className="sr-only">
					{title}
				</div>
				{body}
			</DialogContent>
		</Dialog>
	);
}
