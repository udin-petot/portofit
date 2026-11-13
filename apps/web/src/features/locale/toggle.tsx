import { useLingui } from "@lingui/react";
import { Icon } from "@reactive-resume/ui/components/icon";
import { cn } from "@reactive-resume/utils/style";
import { changeLocale } from "@/libs/locale";

const options = [
	{ code: "id-ID", short: "ID", name: "Bahasa Indonesia" },
	{ code: "en-US", short: "EN", name: "English" },
] as const;

/**
 * Dua bahasa untuk pengunjung: Indonesia (bawaan) dan Inggris. Pilihannya disimpan sebagai cookie.
 *
 * The chosen language used to be white text on a green fill, which measured about 1.2:1 and read as a smudge.
 * The selected segment is now a solid ink pill labelled in the page background, so the state is legible at a
 * glance and the accent green stays reserved for the header's one call to action.
 */
export function LocaleToggle({ className }: { className?: string }) {
	const { i18n } = useLingui();
	const active = i18n.locale.toLowerCase().startsWith("id") ? "id-ID" : "en-US";

	return (
		<div
			role="group"
			aria-label="Bahasa / Language"
			className={cn("flex items-center gap-0.5 rounded-full border border-line-2/60 bg-hover p-[3px]", className)}
		>
			<Icon name="translate" size={13} className="ms-1 me-0.5 shrink-0 text-ink-3" aria-hidden="true" />
			{options.map((option) => {
				const isActive = option.code === active;

				return (
					<button
						key={option.code}
						type="button"
						title={option.name}
						aria-label={option.name}
						aria-pressed={isActive}
						onClick={() => changeLocale(option.code)}
						className={cn(
							"font-martian flex h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-[11px] leading-none font-medium tracking-[.08em] uppercase font-stretch-[87.5%] outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent",
							isActive ? "bg-ink text-bg shadow-e1" : "text-ink-2 hover:bg-hover hover:text-ink",
						)}
					>
						{option.short}
					</button>
				);
			})}
		</div>
	);
}
