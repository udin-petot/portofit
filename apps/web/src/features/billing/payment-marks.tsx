import type { ReactNode } from "react";
import { cn } from "@reactive-resume/utils/style";

function MarkShell({ tone, className, children }: { tone: string; className?: string | undefined; children: ReactNode }) {
	return (
		<span
			className={cn(
				"grid size-[88px] animate-mark-settle place-items-center rounded-full sm:size-24",
				tone,
				className,
			)}
		>
			{children}
		</span>
	);
}

/** Centang yang menggambar dirinya sekali, searah dengan menarik tanda tangan. */
export function PaidMark({ className }: { className?: string | undefined }) {
	return (
		<MarkShell tone="bg-accent-soft text-accent-text" className={className}>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2.2}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				className="size-11 sm:size-[46px]"
			>
				<path d="M4.5 12.8 9.6 17.9 19.5 7" pathLength={1} strokeDasharray={1} className="animate-mark-draw" />
			</svg>
		</MarkShell>
	);
}

/** Silang dua garis, garis kedua menyusul 120ms supaya terbaca ditulis, bukan ditempel. */
export function RejectedMark({ className }: { className?: string | undefined }) {
	return (
		<MarkShell tone="bg-danger-soft text-danger-text" className={className}>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2.2}
				strokeLinecap="round"
				aria-hidden="true"
				className="size-11 sm:size-[46px]"
			>
				<path d="M6.5 6.5 17.5 17.5" pathLength={1} strokeDasharray={1} className="animate-mark-draw" />
				<path
					d="M17.5 6.5 6.5 17.5"
					pathLength={1}
					strokeDasharray={1}
					className="animate-mark-draw [animation-delay:120ms]"
				/>
			</svg>
		</MarkShell>
	);
}
