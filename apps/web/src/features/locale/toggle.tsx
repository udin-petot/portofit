import { useLingui } from "@lingui/react";
import { cn } from "@reactive-resume/utils/style";
import { changeLocale } from "@/libs/locale";

const options = [
	{ code: "id-ID", short: "ID", name: "Bahasa Indonesia" },
	{ code: "en-US", short: "EN", name: "English" },
] as const;

/** Dua bahasa untuk pengunjung: Indonesia (bawaan) dan Inggris. Pilihannya disimpan sebagai cookie. */
export function LocaleToggle({ className }: { className?: string }) {
	const { i18n } = useLingui();
	const active = i18n.locale.toLowerCase().startsWith("id") ? "id-ID" : "en-US";

	return (
		<div
			role="group"
			aria-label="Bahasa / Language"
			className={cn("flex items-center gap-0.5 rounded-full border border-line p-0.5", className)}
		>
			{options.map((option) => {
				const isActive = option.code === active;
				return (
					<button
						key={option.code}
						type="button"
						title={option.name}
						aria-pressed={isActive}
						onClick={() => changeLocale(option.code)}
						className={cn(
							"font-martian flex h-7 items-center rounded-full px-2.5 text-[11px] leading-none font-medium tracking-[.08em] uppercase font-stretch-[87.5%] transition-colors",
							isActive ? "bg-accent text-accent-text" : "opacity-65 hover:opacity-100",
						)}
					>
						{option.short}
					</button>
				);
			})}
		</div>
	);
}
