import { Icon } from "@reactive-resume/ui/components/icon";
import { cn } from "@reactive-resume/utils/style";
import { QRIS_IMAGE_PATH } from "./config";
import type { PaymentPhase } from "./payment-phase";
import { PaidMark, RejectedMark } from "./payment-marks";
import { WaitingClock } from "./waiting-clock";

const MARKS = {
	kedaluwarsa: { icon: "x-circle", box: "bg-danger-soft", ink: "text-danger-text" },
	galat: { icon: "warning-circle", box: "bg-warn-soft", ink: "text-warn-text" },
} as const;

/**
 * Satu kotak 240px yang isinya berganti antara QR dan tanda keadaan. Keduanya ditumpuk
 * supaya perpindahannya silang, bukan lompat, dan tata letak di sekitarnya tidak bergeser.
 */
export function QrMorph({ phase }: { phase: PaymentPhase }) {
	const showQr = phase === "menunggu" || phase === "mengunggah";
	const customMark = phase === "menunggu_dicek" || phase === "lunas" || phase === "ditolak";
	const mark = showQr || customMark ? null : MARKS[phase as keyof typeof MARKS];

	return (
		<div className="relative mx-auto size-[240px] overflow-hidden rounded-xl">
			<img
				src={QRIS_IMAGE_PATH}
				alt=""
				aria-hidden={showQr ? undefined : "true"}
				className={cn(
					"absolute inset-0 size-[240px] rounded-xl bg-white object-contain transition-[opacity,scale] duration-300 ease-enter motion-reduce:transition-none",
					showQr ? "scale-100 opacity-100" : "scale-95 opacity-0",
				)}
			/>

			<div
				className={cn(
					"absolute inset-0 grid place-items-center transition-[opacity,scale] duration-300 ease-enter motion-reduce:transition-none",
					showQr ? "scale-95 opacity-0" : "scale-100 opacity-100",
				)}
				aria-hidden={showQr ? "true" : undefined}
			>
				{phase === "menunggu_dicek" ? (
					<WaitingClock />
				) : phase === "lunas" ? (
					<PaidMark />
				) : phase === "ditolak" ? (
					<RejectedMark />
				) : mark ? (
					<span className={cn("grid size-[84px] place-items-center rounded-full", mark.box, mark.ink)}>
						<Icon name={mark.icon} size={38} />
					</span>
				) : null}
			</div>
		</div>
	);
}
