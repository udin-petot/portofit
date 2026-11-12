import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { Icon } from "@reactive-resume/ui/components/icon";
import { SupportChat } from "./chat-panel";

/** Chat bantuan menempel di pojok kanan bawah semua halaman dasbor. */
export function SupportLauncher() {
	const [open, setOpen] = useState(() => typeof window !== "undefined" && window.location.hash === "#bantuan");

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	return (
		<>
			{open ? (
				<section
					id="support-panel"
					role="dialog"
					aria-labelledby="support-title"
					className="fixed end-4 bottom-20 z-50 flex h-[560px] max-h-[calc(100svh-7rem)] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-e3 transition-[opacity,translate] duration-standard ease-enter starting:translate-y-2 starting:opacity-0"
				>
					<header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line ps-4 pe-2">
						<div className="min-w-0 flex-1">
							<h2 id="support-title" className="text-sm font-semibold text-ink">
								<Trans>Help</Trans>
							</h2>
							<p className="truncate text-xs text-ink-3">Dijawab otomatis, bisa dilanjutkan ke admin</p>
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Tutup bantuan"
							className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-quick hover:bg-hover hover:text-ink"
						>
							<Icon name="x-circle" size={18} />
						</button>
					</header>
					<div className="min-h-0 flex-1">
						<SupportChat />
					</div>
				</section>
			) : null}

			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-expanded={open}
				aria-controls="support-panel"
				className={
					open
						? "fixed end-4 bottom-5 z-50 hidden h-11 items-center gap-2 rounded-full border border-line-2 bg-raised px-4 text-sm font-medium text-ink shadow-e2 transition-[background-color,scale] duration-quick ease-enter hover:bg-hover active:scale-[0.97] sm:flex"
						: "fixed end-4 bottom-5 z-50 flex h-11 items-center gap-2 rounded-full border border-line-2 bg-raised px-4 text-sm font-medium text-ink shadow-e2 transition-[background-color,scale] duration-quick ease-enter hover:bg-hover active:scale-[0.97] max-sm:bottom-[76px]"
				}
			>
				<Icon name="chat-text" size={18} />
				<Trans>Help</Trans>
			</button>
		</>
	);
}
