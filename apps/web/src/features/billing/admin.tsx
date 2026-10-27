import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@reactive-resume/ui/components/button";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Input } from "@reactive-resume/ui/components/input";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah, ORDER_STATUS_LABEL } from "./config";

const STATUS_VARIANT: Record<string, "neutral" | "warn" | "accent" | "danger"> = {
	menunggu_bayar: "neutral",
	menunggu_verifikasi: "warn",
	lunas: "accent",
	ditolak: "danger",
};

export function AdminBillingPage() {
	const queryClient = useQueryClient();
	const [q, setQ] = useState("");
	const [harga, setHarga] = useState<Record<string, string>>({});

	const summary = useQuery(orpc.billing.adminSummary.queryOptions());
	const pending = useQuery(orpc.billing.adminOrders.queryOptions({ input: { status: "menunggu_verifikasi", limit: 50 } }));
	const recent = useQuery(orpc.billing.adminOrders.queryOptions({ input: { limit: 15 } }));
	const users = useQuery(orpc.billing.adminUsers.queryOptions({ input: { query: q.trim() || undefined, limit: 50 } }));
	const plans = useQuery(orpc.billing.plans.queryOptions());
	const audit = useQuery(orpc.billing.adminAudit.queryOptions({ input: { limit: 20 } }));

	const verify = useMutation(orpc.billing.adminVerifyOrder.mutationOptions());
	const reject = useMutation(orpc.billing.adminRejectOrder.mutationOptions());
	const adjust = useMutation(orpc.billing.adminAdjustCredits.mutationOptions());
	const updatePlan = useMutation(orpc.billing.adminUpdatePlan.mutationOptions());
	const exportCsv = useQuery({ ...orpc.billing.adminExportCsv.queryOptions(), enabled: false });

	const segarkan = async () => {
		await queryClient.invalidateQueries();
	};

	const tolak = async (orderId: string) => {
		const reason = window.prompt("Alasan penolakan (dibaca pembeli):", "Bukti tidak sesuai nominal");
		if (!reason) return;
		await reject.mutateAsync({ orderId, reason });
		await segarkan();
	};

	const ubahKredit = async (userId: string, kind: "application" | "interview", delta: number) => {
		const reason = window.prompt(`Alasan ${delta > 0 ? "menambah" : "mengurangi"} kredit (${kind}):`, "Koreksi manual admin");
		if (!reason) return;
		await adjust.mutateAsync({ userId, kind, delta, reason });
		await segarkan();
	};

	const unduhCsv = async () => {
		const result = await exportCsv.refetch();
		const data = result.data;
		if (!data) return;
		const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = data.filename;
		link.click();
		URL.revokeObjectURL(url);
	};

	const simpanHarga = async (code: string) => {
		const value = Number(harga[code]);
		if (!Number.isFinite(value) || value < 0) return;
		await updatePlan.mutateAsync({ code, priceIdr: value });
		await segarkan();
	};

	return (
		<div className="mx-auto w-full max-w-5xl px-5 py-8">
			<header>
				<h1 className="text-2xl font-semibold text-ink">Panel admin</h1>
				<p className="mt-1 text-sm text-ink-2">Verifikasi pembayaran, kelola kredit, dan unduh laporan keuangan.</p>
			</header>

			<section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
				{[
					{ label: "Pengguna", value: String(summary.data?.users ?? 0) },
					{ label: "Menunggu verifikasi", value: String(summary.data?.pendingVerification ?? 0) },
					{ label: "Pendapatan hari ini", value: formatRupiah(summary.data?.revenueTodayIdr ?? 0) },
					{ label: "Pendapatan bulan ini", value: formatRupiah(summary.data?.revenueMonthIdr ?? 0) },
				].map((card) => (
					<div key={card.label} className="rounded-lg border border-line bg-surface p-4">
						<p className="text-xs uppercase tracking-wide text-ink-3">{card.label}</p>
						<p className="mt-1 text-lg font-semibold text-ink">{card.value}</p>
					</div>
				))}
			</section>

			<section className="mt-6 rounded-lg border border-line bg-surface">
				<div className="flex items-center justify-between border-b border-line px-4 py-3">
					<h2 className="text-sm font-semibold text-ink">Antrean verifikasi</h2>
					<Button size="sm" variant="secondary" onClick={() => void segarkan()}>
						Segarkan
					</Button>
				</div>
				{pending.data?.orders.length ? (
					<ul className="divide-y divide-line">
						{pending.data.orders.map((order) => (
							<li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
								<div className="min-w-0">
									<p className="text-sm font-medium text-ink">
										{order.planName} · {formatRupiah(order.totalIdr)}
									</p>
									<p className="mt-0.5 text-xs text-ink-3">
										kode unik {String(order.uniqueCode).padStart(3, "0")} · {new Date(order.createdAt).toLocaleString("id-ID")} · bukti:{" "}
										{order.proofPath ?? "belum ada"}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										disabled={verify.isPending}
										onClick={async () => {
											await verify.mutateAsync({ orderId: order.id });
											await segarkan();
										}}
									>
										Verifikasi
									</Button>
									<Button size="sm" variant="secondary" disabled={reject.isPending} onClick={() => void tolak(order.id)}>
										Tolak
									</Button>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="px-4 py-6 text-sm text-ink-3">Tidak ada pembayaran menunggu verifikasi.</p>
				)}
			</section>

			<section className="mt-6 rounded-lg border border-line bg-surface">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
					<h2 className="text-sm font-semibold text-ink">Pengguna dan kredit</h2>
					<Input className="max-w-xs" placeholder="Cari email atau nama" value={q} onChange={(event) => setQ(event.currentTarget.value)} />
				</div>
				<ul className="divide-y divide-line">
					{(users.data?.users ?? []).map((user) => (
						<li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-ink">
									{user.name} {user.role === "admin" ? <Badge variant="accent">admin</Badge> : null}
								</p>
								<p className="text-xs text-ink-3">{user.email}</p>
							</div>
							<div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
								<span>lamaran: {user.balances.application}</span>
								<span>wawancara: {user.balances.interview}</span>
								<Button size="sm" variant="secondary" onClick={() => void ubahKredit(user.id, "application", 1)}>
									+1 lamaran
								</Button>
								<Button size="sm" variant="secondary" onClick={() => void ubahKredit(user.id, "application", -1)}>
									−1 lamaran
								</Button>
								<Button size="sm" variant="secondary" onClick={() => void ubahKredit(user.id, "interview", 1)}>
									+1 wawancara
								</Button>
							</div>
						</li>
					))}
				</ul>
			</section>

			<div className="mt-6 grid gap-5 md:grid-cols-2">
				<section className="rounded-lg border border-line bg-surface p-4">
					<h2 className="text-sm font-semibold text-ink">Keuangan</h2>
					<p className="mt-1 text-xs text-ink-3">CSV berisi pesanan lunas dan baris TOTAL, siap dilampirkan ke laporan.</p>
					<Button className="mt-3" size="sm" onClick={() => void unduhCsv()} disabled={exportCsv.isFetching}>
						{exportCsv.isFetching ? "Menyiapkan…" : "Unduh CSV transaksi"}
					</Button>
					<ol className="mt-4 grid gap-1 text-xs text-ink-2">
						{(recent.data?.orders ?? []).slice(0, 5).map((order) => (
							<li key={order.id} className="flex justify-between gap-2">
								<span className="truncate">
									{order.planName} · {new Date(order.createdAt).toLocaleDateString("id-ID")}
								</span>
								<span className="flex shrink-0 items-center gap-2">
									{formatRupiah(order.totalIdr)}
									<Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
								</span>
							</li>
						))}
					</ol>
				</section>

				<section className="rounded-lg border border-line bg-surface p-4">
					<h2 className="text-sm font-semibold text-ink">Paket dan harga</h2>
					<ul className="mt-3 grid gap-3">
						{(plans.data?.plans ?? []).map((plan) => (
							<li key={plan.code} className="grid gap-1">
								<p className="text-sm text-ink">{plan.name}</p>
								<div className="flex items-center gap-2">
									<Input
										className="max-w-32"
										defaultValue={String(plan.priceIdr)}
										onChange={(event) => setHarga((prev) => ({ ...prev, [plan.code]: event.currentTarget.value }))}
									/>
									<Button size="sm" variant="secondary" disabled={updatePlan.isPending} onClick={() => void simpanHarga(plan.code)}>
										Simpan
									</Button>
									<span className="text-xs text-ink-3">{plan.credits} kredit</span>
								</div>
							</li>
						))}
					</ul>
				</section>
			</div>

			<section className="mt-6 rounded-lg border border-line bg-surface">
				<h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Audit admin</h2>
				<ul className="divide-y divide-line">
					{(audit.data?.entries ?? []).map((entry) => (
						<li key={entry.id} className="px-4 py-2 text-xs text-ink-2">
							<span className="font-medium text-ink">{entry.action}</span> · {entry.targetType} ·{" "}
							{new Date(entry.createdAt).toLocaleString("id-ID")} · {entry.actorEmail ?? "tidak diketahui"}
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
