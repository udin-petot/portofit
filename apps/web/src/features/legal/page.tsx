import type { ReactNode } from "react";
import { WHATSAPP_NUMBER } from "@/features/billing/config";

type LegalPageProps = {
	title: string;
	summary: string;
	updated?: string;
	children: ReactNode;
};

const legalLinks = [
	{ href: "/syarat", label: "Syarat layanan" },
	{ href: "/privasi", label: "Kebijakan privasi" },
	{ href: "/refund", label: "Pengembalian dana" },
];

/** Shared shell for the public legal pages: readable prose, one column, no app chrome beyond the site header. */
export function LegalPage({ title, summary, updated = "29 Oktober 2026", children }: LegalPageProps) {
	return (
		<main id="main-content" className="min-h-svh bg-bg pt-28 pb-20">
			<div className="mx-auto w-full max-w-3xl px-5">
				<p className="font-mono text-xs tracking-widest text-ink-3 uppercase">Legal</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
				<p className="mt-3 text-sm text-ink-3">Berlaku {updated}</p>
				<p className="mt-6 text-base leading-relaxed text-ink-2">{summary}</p>

				<div className="mt-10 grid gap-9">{children}</div>

				<footer className="mt-14 border-t border-line pt-6">
					<nav aria-label="Halaman legal" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
						{legalLinks.map((link) => (
							<a key={link.href} href={link.href} className="text-ink-2 underline-offset-4 hover:text-accent-text hover:underline">
								{link.label}
							</a>
						))}
						<a
							href={`https://wa.me/${WHATSAPP_NUMBER}`}
							className="text-ink-2 underline-offset-4 hover:text-accent-text hover:underline"
							rel="noreferrer"
							target="_blank"
						>
							WhatsApp
						</a>
					</nav>
					<p className="mt-4 text-xs leading-6 text-ink-3">
						PortoFit adalah layanan dari tim Kelompok 5 KWU, Program Studi Informatika, Universitas Muhammadiyah Purwokerto.
					</p>
				</footer>
			</div>
		</main>
	);
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="grid gap-2.5">
			<h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
			<div className="grid gap-2.5 text-[15px] leading-7 text-ink-2">{children}</div>
		</section>
	);
}

export function LegalList({ items }: { items: readonly ReactNode[] }) {
	return (
		<ul className="grid list-disc gap-1.5 ps-5 marker:text-ink-3">
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}
