import { useEffect, useRef, useState } from "react";
import { cn } from "@reactive-resume/utils/style";

export function formatCountdown(ms: number): string {
	const total = Math.max(0, Math.ceil(ms / 1000));
	const minutes = String(Math.floor(total / 60)).padStart(2, "0");
	const seconds = String(total % 60).padStart(2, "0");
	return `${minutes}:${seconds}`;
}

type CountdownProps = { expiresAt: Date | null; onExpire?: () => void; className?: string };

/** Hitung mundur dari jam perangkat; server tetap yang menentukan hangus. */
export function Countdown({ expiresAt, onExpire, className }: CountdownProps) {
	const [left, setLeft] = useState(() => (expiresAt ? expiresAt.getTime() - Date.now() : 0));
	const fired = useRef(false);

	useEffect(() => {
		if (!expiresAt) return;
		fired.current = false;
		setLeft(expiresAt.getTime() - Date.now());

		const timer = setInterval(() => {
			const next = expiresAt.getTime() - Date.now();
			setLeft(next);
			if (next <= 0 && !fired.current) {
				fired.current = true;
				onExpire?.();
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [expiresAt, onExpire]);

	if (!expiresAt) return null;

	const urgent = left > 0 && left <= 2 * 60_000;

	return (
		<span className={cn("tabular-nums", urgent ? "text-danger" : "text-ink", className)}>
			{left > 0 ? formatCountdown(left) : "Waktu habis"}
		</span>
	);
}
