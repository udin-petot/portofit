import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah } from "./config";

const FREE_FEATURES = ["Cek ATS tanpa batas, tanpa login", "1 CV gratis untuk dibangun dan diunduh", "Pratinjau CV langsung di halaman"];

type PricingPageProps = { signedIn: boolean };

export function PricingPage({ signedIn }: PricingPageProps) {
	const navigate = useNavigate();
	const { data, isLoading } = useQuery(orpc.billing.plans.queryOptions());
	const createOrder = useMutation(orpc.billing.createOrder.mutationOptions());

	const buy = async (planCode: string) => {
		if (!signedIn) {
			await navigate({ to: "/auth/login" });
			return;
		}
		const order = await createOrder.mutateAsync({ planCode });
		await navigate({ to: "/dashboard/transaksi", search: { order: order.id } });
	};

	return (
		<main id="main-content" className="min-h-svh bg-bg pt-24 pb-20">
			<div className="mx-auto w-full max-w-5xl px-5">
				<header className="max-w-2xl">
					<p className="font-mono text-xs uppercase tracking-widest text-ink-3">Harga</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Bayar hanya yang kamu pakai</h1>
					<p className="mt-4 text-base leading-relaxed text-ink-2">
						Mulai gratis untuk melihat apakah CV-mu terbaca sistem. Kalau butuh CV yang disesuaikan ke satu lowongan atau
						latihan wawancara, bayar per dokumen. Tidak ada langganan, tidak ada janji lolos seleksi.
					</p>
				</header>

				<div className="mt-10 grid gap-4 md:grid-cols-3">
					<section className="flex flex-col rounded-lg border border-line bg-surface p-6">
						<h2 className="text-lg font-semibold text-ink">Gratis</h2>
						<p className="mt-1 text-2xl font-semibold text-ink">Rp0</p>
						<p className="mt-1 text-sm text-ink-3">Untuk mencoba alurnya</p>
						<ul className="mt-5 grid gap-2 text-sm text-ink-2">
							{FREE_FEATURES.map((item) => (
								<li key={item} className="flex gap-2">
									<span aria-hidden className="text-ink-3">·</span>
									{item}
								</li>
							))}
						</ul>
						<div className="mt-auto pt-6">
							<Button variant="secondary" className="w-full" onClick={() => void navigate({ to: signedIn ? "/dashboard" : "/auth/register" })}>
								{signedIn ? "Buka dasbor" : "Mulai gratis"}
							</Button>
						</div>
					</section>

					{isLoading ? (
						<section className="rounded-lg border border-line bg-surface p-6 text-sm text-ink-3 md:col-span-2">Memuat paket…</section>
					) : (
						(data?.plans ?? []).map((plan) => (
							<section key={plan.code} className="flex flex-col rounded-lg border border-line bg-surface p-6">
								<h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
								<p className="mt-1 text-2xl font-semibold text-ink">{formatRupiah(plan.priceIdr)}</p>
								<p className="mt-1 text-sm text-ink-3">
									{plan.credits} kredit {plan.kind === "interview" ? "sesi wawancara" : "lamaran"}
								</p>
								<p className="mt-5 text-sm leading-relaxed text-ink-2">{plan.description ?? ""}</p>
								<div className="mt-auto pt-6">
									<Button className="w-full" onClick={() => void buy(plan.code)} disabled={createOrder.isPending}>
										{createOrder.isPending ? "Menyiapkan pesanan…" : `Beli ${formatRupiah(plan.priceIdr)}`}
									</Button>
									<p className="mt-2 text-center text-xs text-ink-3">Bayar QRIS, verifikasi manual oleh admin</p>
								</div>
							</section>
						))
					)}
				</div>

				<section className="mt-10 rounded-lg border border-line bg-sunken p-6 text-sm leading-relaxed text-ink-2">
					<h2 className="text-base font-semibold text-ink">Cara membayar</h2>
					<ol className="mt-3 grid gap-2">
						<li>1. Pilih paket. Sistem membuat pesanan dengan kode unik tiga digit, mis. Rp5.000 menjadi Rp5.003.</li>
						<li>2. Pindai QRIS di halaman pesanan dan bayar tepat sampai kode unik terakhir.</li>
						<li>3. Unggah bukti bayar atau kirim lewat WhatsApp. Admin memverifikasi, kredit langsung masuk.</li>
					</ol>
					<p className="mt-3 text-xs text-ink-3">
						Kredit dipakai per dokumen: satu kredit lamaran untuk satu CV + cover letter yang disesuaikan, satu kredit wawancara
						untuk satu sesi latihan. Kredit tidak kedaluwarsa.
					</p>
				</section>
			</div>
		</main>
	);
}
