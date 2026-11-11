import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon, type IconName } from "@reactive-resume/ui/components/icon";
import { orpc } from "@/libs/orpc/client";
import { authClient } from "@/libs/auth/client";
import { formatRupiah } from "@/features/billing/config";

export const Route = createFileRoute("/dashboard/akun")({
	component: AccountPage,
});

const SETTINGS_LINKS: {
	to: "/dashboard/settings/account" | "/dashboard/settings/preferences" | "/dashboard/settings/ai";
	icon: IconName;
	title: string;
	body: string;
}[] = [
	{ to: "/dashboard/settings/account", icon: "user-circle", title: "Profil & keamanan", body: "Nama, email, sandi, dan sesi masuk." },
	{ to: "/dashboard/settings/preferences", icon: "sliders-horizontal", title: "Preferensi", body: "Bahasa, tema, dan tampilan." },
	{ to: "/dashboard/settings/ai", icon: "sparkle", title: "AI & developer", body: "Penyedia AI, kunci API, dan integrasi." },
];

function AccountPage() {
	const { data: session } = authClient.useSession();
	const balances = useQuery(orpc.billing.balances.queryOptions());
	const orders = useQuery(orpc.billing.myOrders.queryOptions({ input: { limit: 50 } }));
	const ledger = useQuery(orpc.billing.ledger.queryOptions({ input: { limit: 20 } }));

	const user = session?.user as { name?: string; email?: string; createdAt?: string | Date } | undefined;
	const list = orders.data?.orders ?? [];
	const entries = ledger.data?.entries ?? [];
	const count = (status: string[]) => list.filter((order) => status.includes(order.status)).length;
	const joined = user?.createdAt
		? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(user.createdAt))
		: "—";

	return (
		<div className="mx-auto w-full max-w-[1080px] px-6 pt-8 pb-28 md:pb-12">
			<h1 className="font-sans text-2xl font-semibold text-ink">Akun</h1>
			<p className="mt-1 text-sm text-ink-2">Profil, kredit, pesanan, dan pengaturanmu.</p>

			<div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
				<section className="rounded-lg border border-line bg-surface p-5">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="min-w-0">
							<p className="truncate text-lg text-ink">{user?.name ?? "Tanpa nama"}</p>
							<p className="truncate text-sm text-ink-2">{user?.email}</p>
							<p className="mt-1 text-xs text-ink-3">Bergabung {joined}</p>
						</div>
						<Button variant="secondary" size="sm" onClick={() => void authClient.signOut()}>
							Keluar
						</Button>
					</div>
				</section>

				<section className="rounded-lg border border-line bg-surface p-5">
					<div className="flex items-baseline justify-between">
						<h2 className="text-sm font-semibold text-ink">Kredit</h2>
						<Link to="/harga" className="text-xs text-ink-2 underline-offset-4 hover:underline">
							Beli
						</Link>
					</div>
					<div className="mt-3 grid grid-cols-2 divide-x divide-line">
						<div className="pr-4">
							<p className="text-xs text-ink-3">Lamaran</p>
							<p className="mt-1 text-[26px] leading-7 tabular-nums text-ink">{balances.data?.application ?? 0}</p>
							<p className="text-xs text-ink-2">{formatRupiah(5000)} / kredit</p>
						</div>
						<div className="pl-4">
							<p className="text-xs text-ink-3">Wawancara</p>
							<p className="mt-1 text-[26px] leading-7 tabular-nums text-ink">{balances.data?.interview ?? 0}</p>
							<p className="text-xs text-ink-2">{formatRupiah(10000)} / kredit</p>
						</div>
					</div>
				</section>

				<section className="rounded-lg border border-line bg-surface p-5">
					<div className="flex items-baseline justify-between">
						<h2 className="text-sm font-semibold text-ink">Pesanan</h2>
						<Link to="/dashboard/transaksi" className="text-xs text-ink-2 underline-offset-4 hover:underline">
							Lihat semua
						</Link>
					</div>
					<div className="mt-3 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
						{[
							{ label: "Menunggu bayar", value: count(["menunggu_bayar"]) },
							{ label: "Diproses", value: count(["menunggu_verifikasi"]) },
							{ label: "Selesai", value: count(["lunas"]) },
							{ label: "Dibatalkan", value: count(["ditolak", "hangus"]) },
						].map((cell) => (
							<Link key={cell.label} to="/dashboard/transaksi" className="bg-surface p-3 hover:bg-hover">
								<p className="text-xs text-ink-3">{cell.label}</p>
								<p className="mt-0.5 text-[22px] leading-7 tabular-nums text-ink">{cell.value}</p>
							</Link>
						))}
					</div>
				</section>

				<section className="rounded-lg border border-line bg-surface p-5 lg:col-span-2">
					<h2 className="text-sm font-semibold text-ink">Pengaturan</h2>
					<ul className="mt-1 grid gap-x-6 sm:grid-cols-3">
						{SETTINGS_LINKS.map((item) => (
							<li key={item.to}>
								<Link to={item.to} className="flex items-center gap-3 border-b border-line py-3 hover:bg-hover last:border-0 sm:border-0">
									<Icon name={item.icon} size={18} className="text-ink-2" />
									<span className="min-w-0 flex-1">
										<span className="block text-sm text-ink">{item.title}</span>
										<span className="block text-xs text-ink-3">{item.body}</span>
									</span>
									<Icon name="caret-right" size={16} className="text-ink-3" />
								</Link>
							</li>
						))}
					</ul>
				</section>
			</div>

			<section className="mt-5 rounded-lg border border-line bg-surface p-5">
				<h2 className="text-sm font-semibold text-ink">Riwayat kredit</h2>
				{entries.length > 0 ? (
					<ul className="mt-2">
						{entries.slice(0, 6).map((entry) => (
							<li key={entry.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
								<span className="min-w-0">
									<span className="block truncate text-sm text-ink">{entry.reason}</span>
									<span className="text-xs text-ink-3">{new Date(entry.createdAt).toLocaleDateString("id-ID")}</span>
								</span>
								<span className="shrink-0 text-sm tabular-nums text-ink-2">
									{entry.delta > 0 ? `+${entry.delta}` : entry.delta} · sisa {entry.balanceAfter}
								</span>
							</li>
						))}
					</ul>
				) : (
					<p className="mt-2 text-sm text-ink-3">Belum ada pemakaian kredit.</p>
				)}
			</section>
		</div>
	);
}
