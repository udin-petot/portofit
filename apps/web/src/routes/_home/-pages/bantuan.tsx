/**
 * The page's content, kept out of the route file so the build can prerender it (features/homepage/prerender.tsx)
 * without the router. The route renders the same component once the app mounts.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { SUPPORT_WHATSAPP_URL } from "@reactive-resume/utils/support-faq";
import { formatRupiah } from "@/features/billing/config";
import { LegalLanguageNotice } from "@/features/legal/page";
import { FaqList } from "@/features/support/faq-list";
import { orpc } from "@/libs/orpc/client";

export function SupportPage({ signedIn }: { signedIn: boolean }) {
	const plans = useQuery(orpc.billing.plans.queryOptions());

	const prices = plans.data?.plans?.map((plan) => formatRupiah(plan.priceIdr)) ?? [];
	const priceLine =
		prices.length > 0
			? `Paket yang berlaku saat ini ${prices.join(" dan ")}. Harga yang tampil di halaman Harga yang dipakai saat membeli.`
			: undefined;

	return (
		<main id="main-content" lang="id-ID" className="mx-auto w-full max-w-3xl px-5 pt-28 pb-20">
			<LegalLanguageNotice />
			<p className="font-mono text-xs tracking-widest text-ink-3 uppercase">Bantuan</p>
			<h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Pertanyaan yang sering muncul</h1>
			<p className="mt-4 text-base leading-relaxed text-ink-2">
				Jawaban di bawah ini berlaku untuk pembelian dan kredit di PortoFit. Kalau pertanyaanmu butuh keputusan admin,
				lanjutkan lewat WhatsApp. Bantuan cepat di dalam aplikasi juga tersedia setelah kamu masuk.
			</p>

			<div className="mt-10">
				<FaqList priceLine={priceLine} />
			</div>

			<div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
				{signedIn ? (
					<Link
						to="/dashboard"
						hash="bantuan"
						className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
					>
						Buka chat bantuan
					</Link>
				) : (
					<Link
						to="/auth/login"
						className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
					>
						Masuk untuk chat bantuan
					</Link>
				)}
				<a
					href={SUPPORT_WHATSAPP_URL}
					target="_blank"
					rel="noreferrer"
					className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover"
				>
					WhatsApp admin
				</a>
			</div>
		</main>
	);
}
