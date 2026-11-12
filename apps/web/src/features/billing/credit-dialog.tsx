import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Icon } from "@reactive-resume/ui/components/icon";
import { closeCreditDialog, useCreditGate } from "@/features/billing/credit-gate";
import { orpc } from "@/libs/orpc/client";

const rupiah = (amount: number) =>
	new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

/**
 * Muncul saat aksi berbayar ditolak karena saldo kosong. Pengguna baru tahu
 * ada yang harus dibeli kalau diberi satu langkah jelas, bukan pesan galat lewat.
 */
export function CreditDialog() {
	const current = useCreditGate();
	const plans = useQuery({ ...orpc.billing.plans.queryOptions(), enabled: current.open });
	const plan = plans.data?.plans.find((item) => item.kind === current.kind);

	return (
		<Dialog open={current.open} onOpenChange={(open) => (open ? undefined : closeCreditDialog())}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{current.kind === "interview" ? (
							<Trans>Interview credits used up</Trans>
						) : (
							<Trans>Application credits used up</Trans>
						)}
					</DialogTitle>
					<DialogDescription>
						{current.kind === "interview" ? (
							<Trans>
								One interview package covers one practice session with AI feedback. Practising again on the same
								interview is free.
							</Trans>
						) : (
							<Trans>
								One application package covers one set of files: a tailored CV, a cover letter, and a match score.
							</Trans>
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-start gap-2.5 rounded-lg bg-sunken px-3 py-2.5 text-[13px] leading-5 text-ink-2">
					<Icon name="warning-circle" size={18} className="mt-px shrink-0 text-warn-text" />
					<span>
						{plan ? (
							<>
								{plan.name} · {rupiah(plan.priceIdr)}
							</>
						) : (
							<Trans>Buy credits to continue.</Trans>
						)}
					</span>
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={closeCreditDialog}>
						<Trans>Not now</Trans>
					</Button>
					<Button onClick={() => window.location.assign("/dashboard/beli-kredit")}>
						<Trans>Buy credits</Trans>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
