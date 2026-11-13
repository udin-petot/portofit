import { cn } from "@reactive-resume/utils/style";

/** Detik ke berapa sekarang, dipakai untuk memulai jarum di posisi yang benar. */
export function secondOffset(date: Date): number {
	return date.getSeconds();
}

/**
 * Ikon jam yang sama dengan yang dipakai di seluruh aplikasi, hanya jarum panjangnya berputar.
 * Satu putaran per menit, linear, dan berhenti di posisi sekarang kalau pengguna meminta gerak dikurangi.
 */
export function WaitingClock({ className }: { className?: string }) {
	const seconds = secondOffset(new Date());

	return (
		<span
			className={cn("grid size-[88px] place-items-center rounded-full bg-warn-soft text-warn-text sm:size-24", className)}
		>
			<svg
				viewBox="0 0 256 256"
				fill="none"
				stroke="currentColor"
				strokeWidth={16}
				strokeLinecap="round"
				aria-hidden="true"
				focusable="false"
				className="size-12 sm:size-[52px]"
			>
				<circle cx="128" cy="128" r="88" />
				<line x1="128" y1="128" x2="128" y2="80" />
				<line
					x1="128"
					y1="128"
					x2="192"
					y2="128"
					className="origin-[128px_128px] animate-[spin_60s_linear_infinite] motion-reduce:animate-none"
					style={{ animationDelay: `-${seconds}s` }}
				/>
			</svg>
		</span>
	);
}
