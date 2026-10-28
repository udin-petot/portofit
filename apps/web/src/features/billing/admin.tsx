import type { IconName } from "@reactive-resume/ui/components/icon";
import type { RouterOutput } from "@/libs/orpc/client";
import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { Icon } from "@reactive-resume/ui/components/icon";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@reactive-resume/ui/components/input-group";
import { Label } from "@reactive-resume/ui/components/label";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah, ORDER_STATUS_LABEL } from "./config";

type AdminOrder = RouterOutput["billing"]["adminOrders"]["orders"][number];
type AdminUser = RouterOutput["billing"]["adminUsers"]["users"][number];
type Plan = RouterOutput["billing"]["plans"]["plans"][number];
type PlanKind = "application" | "interview";

const STATUS_VARIANT: Record<string, "neutral" | "warn" | "accent" | "danger"> = {
	menunggu_bayar: "neutral",
	menunggu_verifikasi: "warn",
	lunas: "accent",
	ditolak: "danger",
};

const KIND_LABEL: Record<PlanKind, string> = { application: "CV + cover letter", interview: "Latihan wawancara" };
const KIND_NOUN: Record<PlanKind, string> = { application: "lamaran", interview: "wawancara" };

const ACTION_LABEL: Record<string, string> = {
	"order.verify": "Verifikasi pesanan",
	"order.reject": "Penolakan pesanan",
	"credits.adjust": "Koreksi kredit",
	"plan.update": "Ubah harga paket",
};

const TARGET_LABEL: Record<string, string> = {
	billing_order: "pesanan",
	billing_plan: "paket",
	user: "pengguna",
};

const dateShort = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
const timeShort = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dateLong = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const stampShort = new Intl.DateTimeFormat("id-ID", {
	day: "2-digit",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

const formatDate = (value: Date | string | number) => dateShort.format(new Date(value));
const formatTime = (value: Date | string | number) => timeShort.format(new Date(value));
const formatStamp = (value: Date | string | number) => stampShort.format(new Date(value));
const uniqueCode = (code: number) => String(code).padStart(3, "0");

/**
 * The admin's operating desk: what needs checking (payment proofs), who holds credits, what the plans cost,
 * and what was done. The queue comes first, then the people, then the money and the record it leaves.
 */
export function AdminBillingPage() {
	const queryClient = useQueryClient();
	const [query, setQuery] = useState("");
	const search = useDeferredValue(query.trim());
	const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
	const [proofOrder, setProofOrder] = useState<AdminOrder | null>(null);
	const [rejectOrder, setRejectOrder] = useState<AdminOrder | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [creditTarget, setCreditTarget] = useState<{ user: AdminUser; kind: PlanKind; delta: number } | null>(null);
	const [creditReason, setCreditReason] = useState("");

	const summary = useQuery(orpc.billing.adminSummary.queryOptions());
	const pending = useQuery(
		orpc.billing.adminOrders.queryOptions({ input: { status: "menunggu_verifikasi", limit: 50 } }),
	);
	const recent = useQuery(orpc.billing.adminOrders.queryOptions({ input: { limit: 8 } }));
	const users = useQuery(orpc.billing.adminUsers.queryOptions({ input: { query: search || undefined, limit: 50 } }));
	const plans = useQuery(orpc.billing.plans.queryOptions());
	const audit = useQuery(orpc.billing.adminAudit.queryOptions({ input: { limit: 12 } }));

	const verify = useMutation(orpc.billing.adminVerifyOrder.mutationOptions());
	const reject = useMutation(orpc.billing.adminRejectOrder.mutationOptions());
	const adjust = useMutation(orpc.billing.adminAdjustCredits.mutationOptions());
	const updatePlan = useMutation(orpc.billing.adminUpdatePlan.mutationOptions());
	const exportCsv = useQuery({ ...orpc.billing.adminExportCsv.queryOptions(), enabled: false });

	const proof = useQuery({
		...orpc.billing.adminOrderProof.queryOptions({ input: { orderId: proofOrder?.id ?? "" } }),
		enabled: Boolean(proofOrder),
	});

	const pendingOrders = pending.data?.orders ?? [];
	const pendingCount = summary.data?.pendingVerification ?? pendingOrders.length;
	const userList = users.data?.users ?? [];
	const planList = plans.data?.plans ?? [];
	const auditEntries = audit.data?.entries ?? [];
	const recentOrders = recent.data?.orders ?? [];
	const refreshing =
		summary.isFetching || pending.isFetching || recent.isFetching || plans.isFetching || audit.isFetching;

	const refresh = async () => {
		await queryClient.invalidateQueries({ queryKey: orpc.billing.key() });
	};

	const fail = (error: unknown, fallback: string) => {
		toast.add({ type: "error", description: getOrpcErrorMessage(error, { fallback }) });
	};

	const verifyNow = async (order: AdminOrder) => {
		try {
			await verify.mutateAsync({ orderId: order.id });
			toast.add({
				type: "success",
				description: `${order.planName} diverifikasi. ${order.credits} kredit ${KIND_NOUN[order.kind]} masuk ke pembeli.`,
			});
			setProofOrder(null);
			await refresh();
		} catch (error) {
			fail(error, "Verifikasi gagal. Coba lagi.");
		}
	};

	const openReject = (order: AdminOrder) => {
		setProofOrder(null);
		setRejectReason("Bukti tidak sesuai nominal");
		setRejectOrder(order);
	};

	const submitReject = async () => {
		if (!rejectOrder) return;
		const reason = rejectReason.trim();
		if (reason.length < 3) return;
		try {
			await reject.mutateAsync({ orderId: rejectOrder.id, reason });
			toast.add({ type: "success", description: "Pesanan ditolak. Alasan tampil di halaman transaksi pembeli." });
			setRejectOrder(null);
			await refresh();
		} catch (error) {
			fail(error, "Penolakan gagal. Coba lagi.");
		}
	};

	const openCredit = (user: AdminUser, kind: PlanKind, delta: number) => {
		setCreditReason("Koreksi manual admin");
		setCreditTarget({ user, kind, delta });
	};

	const submitCredit = async () => {
		if (!creditTarget) return;
		const reason = creditReason.trim();
		if (reason.length < 3) return;
		try {
			const result = await adjust.mutateAsync({
				userId: creditTarget.user.id,
				kind: creditTarget.kind,
				delta: creditTarget.delta,
				reason,
			});
			toast.add({
				type: "success",
				description: `Saldo ${KIND_NOUN[creditTarget.kind]} ${creditTarget.user.name} kini ${result.balances[creditTarget.kind]}.`,
			});
			setCreditTarget(null);
			await refresh();
		} catch (error) {
			fail(error, "Koreksi kredit gagal. Coba lagi.");
		}
	};

	const savePlan = async (plan: Plan) => {
		const value = Number(priceDraft[plan.code] ?? plan.priceIdr);
		if (!Number.isFinite(value) || value < 0) {
			toast.add({ type: "error", description: "Harga harus angka nol atau lebih." });
			return;
		}
		try {
			await updatePlan.mutateAsync({ code: plan.code, priceIdr: Math.round(value) });
			setPriceDraft((previous) => {
				const next = { ...previous };
				delete next[plan.code];
				return next;
			});
			toast.add({ type: "success", description: `Harga ${plan.name} disimpan.` });
			await refresh();
		} catch (error) {
			fail(error, "Harga gagal disimpan. Coba lagi.");
		}
	};

	const downloadCsv = async () => {
		try {
			const result = await exportCsv.refetch();
			if (result.error || !result.data) throw result.error ?? new Error("CSV kosong");
			const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = result.data.filename;
			link.click();
			URL.revokeObjectURL(url);
			toast.add({ type: "success", description: `${result.data.rows} pesanan lunas diunduh sebagai CSV.` });
		} catch (error) {
			fail(error, "CSV gagal disiapkan. Coba lagi.");
		}
	};

	const stats: Array<{
		label: string;
		value: string;
		hint: string;
		icon: IconName;
		tone: "neutral" | "warn" | "accent";
	}> = [
		{
			label: "Pengguna",
			value: String(summary.data?.users ?? 0),
			hint: "akun terdaftar",
			icon: "user-circle",
			tone: "neutral",
		},
		{
			label: "Menunggu verifikasi",
			value: String(pendingCount),
			hint: pendingCount > 0 ? "perlu dicek" : "antrean bersih",
			icon: "hourglass",
			tone: pendingCount > 0 ? "warn" : "accent",
		},
		{
			label: "Pendapatan hari ini",
			value: formatRupiah(summary.data?.revenueTodayIdr ?? 0),
			hint: "sejak tengah malam",
			icon: "chart-line-up",
			tone: "neutral",
		},
		{
			label: "Pendapatan bulan ini",
			value: formatRupiah(summary.data?.revenueMonthIdr ?? 0),
			hint: `${summary.data?.paidOrders ?? 0} pesanan lunas`,
			icon: "scales",
			tone: "neutral",
		},
	];

	return (
		<div className="mx-auto w-full max-w-6xl px-5 py-8">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="text-[11px] font-medium tracking-[0.14em] text-ink-3 uppercase">PortoFit · operasional</p>
					<h1 className="mt-1.5 text-[30px] leading-none font-medium tracking-tight text-ink">Panel admin</h1>
					<p className="mt-2 max-w-xl text-sm leading-6 text-ink-2">
						Periksa bukti bayar, atur kredit pengguna, dan siapkan laporan keuangan. Setiap tindakan tercatat di audit.
					</p>
				</div>
				<div className="flex flex-col items-end gap-1.5">
					<div className="flex items-center gap-2">
						<Button size="sm" variant="secondary" loading={refreshing} onClick={() => void refresh()}>
							<Icon name="arrows-clockwise" size={15} />
							Segarkan
						</Button>
						<Button size="sm" loading={exportCsv.isFetching} onClick={() => void downloadCsv()}>
							<Icon name="download-simple" size={15} />
							Unduh CSV
						</Button>
					</div>
					<p className="min-h-4 text-[11px] text-ink-3" aria-live="polite">
						{summary.dataUpdatedAt ? `Diperbarui ${formatTime(summary.dataUpdatedAt)}` : ""}
					</p>
				</div>
			</header>

			{summary.isError ? (
				<p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-text">
					Ringkasan gagal dimuat. Segarkan halaman; kalau tetap gagal, periksa sesi admin dan koneksi basis data.
				</p>
			) : null}

			<section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan">
				{stats.map((stat) => (
					<div key={stat.label} className="rounded-xl border border-line bg-surface p-4">
						<div className="flex items-start justify-between gap-3">
							<p className="text-[11px] font-medium tracking-[0.1em] text-ink-3 uppercase">{stat.label}</p>
							<span
								className={cn(
									"flex size-8 shrink-0 items-center justify-center rounded-lg",
									stat.tone === "warn" && "bg-warn-soft text-warn-text",
									stat.tone === "accent" && "bg-accent-soft text-accent-text",
									stat.tone === "neutral" && "bg-sunken text-ink-2",
								)}
							>
								<Icon name={stat.icon} size={17} />
							</span>
						</div>
						{summary.isLoading ? (
							<Skeleton className="mt-4 h-6 w-24" />
						) : (
							<p className="mt-3 font-display text-[26px] leading-none tracking-tight tabular-nums text-ink">
								{stat.value}
							</p>
						)}
						<p className="mt-2 text-xs text-ink-3">{stat.hint}</p>
					</div>
				))}
			</section>

			<section className="mt-6 overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="antrean-heading">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
					<div className="flex items-center gap-2">
						<h2 id="antrean-heading" className="text-sm font-semibold text-ink">
							Antrean verifikasi
						</h2>
						{pendingOrders.length > 0 ? (
							<Badge variant="warn">{pendingOrders.length}</Badge>
						) : (
							<Badge variant="accent">bersih</Badge>
						)}
					</div>
					<p className="text-xs text-ink-3">Cocokkan nominal dengan mutasi QRIS, lalu buka buktinya.</p>
				</div>

				{pending.isLoading ? (
					<div className="grid gap-2 px-4 py-3">
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-9 w-full" />
					</div>
				) : pendingOrders.length === 0 ? (
					<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
						<span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-text">
							<Icon name="check-circle" size={22} />
						</span>
						<p className="text-sm font-medium text-ink">Tidak ada yang menunggu</p>
						<p className="max-w-sm text-xs leading-5 text-ink-3">
							Pesanan muncul di sini setelah pembeli mengunggah bukti bayar atau mengirimkannya lewat WhatsApp.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[760px] border-collapse text-left text-sm">
							<caption className="sr-only">Pesanan yang menunggu verifikasi pembayaran</caption>
							<thead>
								<tr className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">
									<th scope="col" className="px-4 py-2 font-medium">
										Waktu
									</th>
									<th scope="col" className="px-4 py-2 font-medium">
										Paket
									</th>
									<th scope="col" className="px-4 py-2 text-right font-medium">
										Nominal
									</th>
									<th scope="col" className="px-4 py-2 font-medium">
										Bukti
									</th>
									<th scope="col" className="px-4 py-2 text-right font-medium">
										Tindakan
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line border-t border-line">
								{pendingOrders.map((order) => (
									<tr key={order.id} className="transition-colors duration-150 hover:bg-sunken/60">
										<td className="px-4 py-2.5 whitespace-nowrap">
											<span className="block text-xs text-ink">{formatDate(order.createdAt)}</span>
											<span className="block text-[11px] text-ink-3 tabular-nums">{formatTime(order.createdAt)}</span>
										</td>
										<td className="px-4 py-2.5">
											<span className="block text-ink">{order.planName}</span>
											<span className="block text-[11px] text-ink-3">{KIND_LABEL[order.kind]}</span>
										</td>
										<td className="px-4 py-2.5 text-right whitespace-nowrap">
											<span className="block font-medium text-ink tabular-nums">{formatRupiah(order.totalIdr)}</span>
											<span className="block text-[11px] text-ink-3 tabular-nums">
												kode {uniqueCode(order.uniqueCode)}
											</span>
										</td>
										<td className="px-4 py-2.5">
											{order.proofPath ? (
												<Button size="sm" variant="ghost" onClick={() => setProofOrder(order)}>
													<Icon name="eye" size={15} />
													Lihat bukti
												</Button>
											) : (
												<span className="text-xs text-ink-3">belum ada</span>
											)}
										</td>
										<td className="px-4 py-2.5">
											<div className="flex items-center justify-end gap-1.5">
												<Button
													size="sm"
													loading={verify.isPending && verify.variables?.orderId === order.id}
													onClick={() => void verifyNow(order)}
												>
													<Icon name="check" size={15} />
													Verifikasi
												</Button>
												<Button
													size="sm"
													variant="ghost"
													className="text-danger-text hover:bg-danger-soft"
													disabled={reject.isPending}
													onClick={() => openReject(order)}
												>
													Tolak
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<section
				className="mt-6 overflow-hidden rounded-xl border border-line bg-surface"
				aria-labelledby="pengguna-heading"
			>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
					<div className="flex items-center gap-2">
						<h2 id="pengguna-heading" className="text-sm font-semibold text-ink">
							Pengguna dan kredit
						</h2>
						{userList.length > 0 ? <p className="text-xs text-ink-3">{userList.length} akun</p> : null}
					</div>
					<InputGroup className="w-full max-w-64">
						<InputGroupAddon align="inline-start">
							<Icon name="magnifying-glass" size={15} />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Cari nama atau email"
							aria-label="Cari pengguna"
							value={query}
							onChange={(event) => setQuery(event.currentTarget.value)}
						/>
					</InputGroup>
				</div>

				{users.isLoading ? (
					<div className="grid gap-2 px-4 py-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : userList.length === 0 ? (
					<p className="px-4 py-10 text-center text-sm text-ink-3">
						{search ? `Tidak ada akun yang cocok dengan “${search}”.` : "Belum ada akun terdaftar."}
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] border-collapse text-left text-sm">
							<caption className="sr-only">Daftar pengguna beserta saldo kredit</caption>
							<thead>
								<tr className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">
									<th scope="col" className="px-4 py-2 font-medium">
										Pengguna
									</th>
									<th scope="col" className="px-4 py-2 font-medium">
										Saldo kredit
									</th>
									<th scope="col" className="px-4 py-2 font-medium">
										Bergabung
									</th>
									<th scope="col" className="px-4 py-2 text-right font-medium">
										<span className="sr-only">Aksi</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line border-t border-line">
								{userList.map((user) => (
									<tr key={user.id} className="transition-colors duration-150 hover:bg-sunken/60">
										<td className="max-w-72 px-4 py-2.5">
											<span className="flex items-center gap-1.5">
												<span className="truncate font-medium text-ink">{user.name}</span>
												{user.role === "admin" ? (
													<Badge variant="accent" className="shrink-0">
														admin
													</Badge>
												) : null}
											</span>
											<span className="block truncate text-[11px] text-ink-3">{user.email}</span>
										</td>
										<td className="px-4 py-2.5">
											<div className="flex flex-wrap items-center gap-1.5">
												<BalanceChip count={user.balances.application} kind="application" />
												<BalanceChip count={user.balances.interview} kind="interview" />
											</div>
										</td>
										<td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink-3">
											{dateLong.format(new Date(user.createdAt))}
										</td>
										<td className="px-4 py-2.5 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger
													render={
														<Button
															size="icon-xs"
															variant="ghost"
															className="text-ink-3"
															aria-label={`Kelola kredit ${user.name}`}
														/>
													}
												>
													<Icon name="dots-three" size={18} />
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-56">
													<DropdownMenuLabel>Kredit lamaran</DropdownMenuLabel>
													<DropdownMenuItem onClick={() => openCredit(user, "application", 1)}>
														Tambah 1 kredit
													</DropdownMenuItem>
													<DropdownMenuItem
														disabled={user.balances.application <= 0}
														onClick={() => openCredit(user, "application", -1)}
													>
														Kurangi 1 kredit
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuLabel>Kredit wawancara</DropdownMenuLabel>
													<DropdownMenuItem onClick={() => openCredit(user, "interview", 1)}>
														Tambah 1 kredit
													</DropdownMenuItem>
													<DropdownMenuItem
														disabled={user.balances.interview <= 0}
														onClick={() => openCredit(user, "interview", -1)}
													>
														Kurangi 1 kredit
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
				<section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="keuangan-heading">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h2 id="keuangan-heading" className="text-sm font-semibold text-ink">
								Keuangan
							</h2>
							<p className="mt-1 text-xs leading-5 text-ink-3">
								CSV berisi semua pesanan lunas dan baris TOTAL, siap dilampirkan ke laporan.
							</p>
						</div>
						<Button size="sm" variant="secondary" loading={exportCsv.isFetching} onClick={() => void downloadCsv()}>
							<Icon name="download-simple" size={15} />
							CSV
						</Button>
					</div>

					<dl className="mt-4 grid grid-cols-2 gap-2">
						<div className="rounded-lg bg-sunken px-3 py-2">
							<dt className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">Bulan ini</dt>
							<dd className="mt-1 font-display text-xl leading-none tabular-nums text-ink">
								{formatRupiah(summary.data?.revenueMonthIdr ?? 0)}
							</dd>
						</div>
						<div className="rounded-lg bg-sunken px-3 py-2">
							<dt className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">Pesanan lunas</dt>
							<dd className="mt-1 font-display text-xl leading-none tabular-nums text-ink">
								{summary.data?.paidOrders ?? 0}
							</dd>
						</div>
					</dl>

					<h3 className="mt-4 text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase">Pesanan terbaru</h3>
					{recent.isLoading ? (
						<div className="mt-2 grid gap-2">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					) : recentOrders.length === 0 ? (
						<p className="mt-2 text-xs text-ink-3">Belum ada pesanan.</p>
					) : (
						<ul className="mt-1 divide-y divide-line">
							{recentOrders.slice(0, 5).map((order) => (
								<li key={order.id} className="flex items-center justify-between gap-3 py-2">
									<span className="min-w-0">
										<span className="block truncate text-xs text-ink">{order.planName}</span>
										<span className="block text-[11px] text-ink-3">{formatStamp(order.createdAt)}</span>
									</span>
									<span className="flex shrink-0 items-center gap-2">
										<span className="text-xs tabular-nums text-ink">{formatRupiah(order.totalIdr)}</span>
										<Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>
											{ORDER_STATUS_LABEL[order.status] ?? order.status}
										</Badge>
									</span>
								</li>
							))}
						</ul>
					)}
				</section>

				<section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="paket-heading">
					<h2 id="paket-heading" className="text-sm font-semibold text-ink">
						Paket dan harga
					</h2>
					<p className="mt-1 text-xs leading-5 text-ink-3">
						Harga baru berlaku untuk pesanan berikutnya; pesanan lama menyimpan harga saat dibeli.
					</p>

					{plans.isLoading ? (
						<div className="mt-3 grid gap-2">
							<Skeleton className="h-14 w-full" />
							<Skeleton className="h-14 w-full" />
						</div>
					) : (
						<ul className="mt-2 divide-y divide-line">
							{planList.map((plan) => {
								const draft = priceDraft[plan.code] ?? String(plan.priceIdr);
								const dirty = draft.trim() !== String(plan.priceIdr);
								return (
									<li key={plan.code} className="grid gap-2 py-3">
										<div className="flex items-center justify-between gap-2">
											<span className="min-w-0">
												<span className="block truncate text-sm text-ink">{plan.name}</span>
												<span className="block text-[11px] text-ink-3">{KIND_LABEL[plan.kind]}</span>
											</span>
											<Badge variant="outline" className="shrink-0">
												{plan.credits} kredit
											</Badge>
										</div>
										<div className="flex items-center gap-2">
											<InputGroup className="flex-1">
												<InputGroupAddon align="inline-start">
													<InputGroupText className="text-xs text-ink-3">Rp</InputGroupText>
												</InputGroupAddon>
												<InputGroupInput
													inputMode="numeric"
													aria-label={`Harga ${plan.name}`}
													className="tabular-nums"
													value={draft}
													onChange={(event) =>
														setPriceDraft((previous) => ({ ...previous, [plan.code]: event.currentTarget.value }))
													}
												/>
											</InputGroup>
											<Button
												size="sm"
												variant={dirty ? "primary" : "secondary"}
												disabled={!dirty || updatePlan.isPending}
												onClick={() => void savePlan(plan)}
											>
												Simpan
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</section>
			</div>

			<section className="mt-6 overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="audit-heading">
				<div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
					<h2 id="audit-heading" className="text-sm font-semibold text-ink">
						Audit admin
					</h2>
					<p className="text-xs text-ink-3">tindakan terakhir</p>
				</div>
				{audit.isLoading ? (
					<div className="grid gap-2 px-4 py-3">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
					</div>
				) : auditEntries.length === 0 ? (
					<p className="px-4 py-8 text-center text-sm text-ink-3">
						Belum ada tindakan. Verifikasi pesanan pertama akan muncul di sini.
					</p>
				) : (
					<ol className="divide-y divide-line">
						{auditEntries.map((entry) => (
							<li key={entry.id} className="flex gap-3 px-4 py-2.5">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-2" aria-hidden="true" />
								<div className="min-w-0 flex-1">
									<p className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-ink">
										<span className="font-medium">{ACTION_LABEL[entry.action] ?? entry.action}</span>
										<span className="text-ink-3">{TARGET_LABEL[entry.targetType] ?? entry.targetType}</span>
									</p>
									<p className="text-[11px] text-ink-3">
										{entry.actorEmail ?? "tidak diketahui"} · {formatStamp(entry.createdAt)}
									</p>
								</div>
							</li>
						))}
					</ol>
				)}
			</section>

			<Dialog
				open={Boolean(proofOrder)}
				onOpenChange={(open) => {
					if (!open) setProofOrder(null);
				}}
			>
				<DialogContent className="sm:max-w-[680px]">
					<DialogHeader>
						<DialogTitle>Bukti bayar</DialogTitle>
						<DialogDescription>
							{proofOrder
								? `${proofOrder.planName} · ${formatRupiah(proofOrder.totalIdr)} · kode unik ${uniqueCode(proofOrder.uniqueCode)}`
								: ""}
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-xl bg-sunken p-2">
						{proof.isLoading ? (
							<Skeleton className="mx-auto h-[320px] w-full max-w-sm" />
						) : proof.isError ? (
							<div className="px-4 py-10 text-center">
								<p className="text-sm text-ink">Bukti tidak bisa dimuat.</p>
								<p className="mt-1 text-xs text-ink-3">
									{getOrpcErrorMessage(proof.error, { fallback: "Coba segarkan, atau minta pembeli mengirim ulang." })}
								</p>
							</div>
						) : proof.data ? (
							proof.data.contentType.startsWith("image/") ? (
								<img
									src={proof.data.dataUrl}
									alt={`Bukti bayar ${proofOrder?.planName ?? ""}`}
									className="mx-auto max-h-[58vh] w-auto rounded-lg bg-white object-contain"
								/>
							) : (
								<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
									<Icon name="file-pdf" size={28} className="text-ink-3" />
									<p className="max-w-xs text-xs leading-5 text-ink-2">
										Bukti berjenis {proof.data.contentType} ({Math.round(proof.data.size / 1024)} KB). Unduh untuk
										membukanya.
									</p>
									<a
										className="text-xs font-medium text-accent-text underline underline-offset-2"
										href={proof.data.dataUrl}
										download={proof.data.fileName}
									>
										Unduh bukti
									</a>
								</div>
							)
						) : null}
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setProofOrder(null)}>
							Tutup
						</Button>
						{proofOrder ? (
							<Button
								variant="ghost"
								className="text-danger-text hover:bg-danger-soft"
								disabled={reject.isPending}
								onClick={() => openReject(proofOrder)}
							>
								Tolak
							</Button>
						) : null}
						{proofOrder ? (
							<Button loading={verify.isPending} onClick={() => void verifyNow(proofOrder)}>
								Verifikasi pembayaran
							</Button>
						) : null}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(rejectOrder)}
				onOpenChange={(open) => {
					if (!open) setRejectOrder(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tolak pesanan</DialogTitle>
						<DialogDescription>Alasan ini dibaca pembeli di halaman transaksi. Tulis singkat dan jelas.</DialogDescription>
					</DialogHeader>

					{rejectOrder ? (
						<p className="rounded-lg bg-sunken px-3 py-2 text-xs text-ink-2">
							{rejectOrder.planName} · {formatRupiah(rejectOrder.totalIdr)} · kode unik{" "}
							{uniqueCode(rejectOrder.uniqueCode)}
						</p>
					) : null}

					<div className="grid gap-1.5">
						<Label htmlFor="reject-reason">Alasan penolakan</Label>
						<Textarea
							id="reject-reason"
							rows={3}
							maxLength={500}
							value={rejectReason}
							onChange={(event) => setRejectReason(event.currentTarget.value)}
						/>
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setRejectOrder(null)}>
							Batal
						</Button>
						<Button
							variant="danger"
							loading={reject.isPending}
							disabled={rejectReason.trim().length < 3}
							onClick={() => void submitReject()}
						>
							Tolak pesanan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(creditTarget)}
				onOpenChange={(open) => {
					if (!open) setCreditTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Koreksi kredit</DialogTitle>
						<DialogDescription>
							Perubahan langsung masuk ke saldo dan tercatat di audit. Koreksi manual tidak menagih pembayaran.
						</DialogDescription>
					</DialogHeader>

					{creditTarget ? (
						<div className="rounded-lg bg-sunken px-3 py-2.5 text-xs text-ink-2">
							<p className="text-sm font-medium text-ink">{creditTarget.user.name}</p>
							<p className="mt-0.5 truncate">{creditTarget.user.email}</p>
							<p className="mt-2 tabular-nums">
								Kredit {KIND_NOUN[creditTarget.kind]}: {creditTarget.user.balances[creditTarget.kind]} →{" "}
								<span className="font-semibold text-ink">
									{creditTarget.user.balances[creditTarget.kind] + creditTarget.delta}
								</span>
							</p>
						</div>
					) : null}

					<div className="grid gap-1.5">
						<Label htmlFor="credit-reason">Alasan</Label>
						<Textarea
							id="credit-reason"
							rows={2}
							maxLength={200}
							value={creditReason}
							onChange={(event) => setCreditReason(event.currentTarget.value)}
						/>
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setCreditTarget(null)}>
							Batal
						</Button>
						<Button
							loading={adjust.isPending}
							disabled={creditReason.trim().length < 3}
							onClick={() => void submitCredit()}
						>
							Simpan koreksi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/** A credit balance as a chip: the dot carries the kind, the number stays tabular. */
function BalanceChip({ count, kind }: { count: number; kind: PlanKind }) {
	const empty = count <= 0;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
				empty ? "border border-line text-ink-3" : "bg-sunken text-ink",
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"size-1.5 rounded-full",
					empty ? "bg-line-2" : kind === "application" ? "bg-stage-applied" : "bg-stage-interview",
				)}
			/>
			{count} {KIND_NOUN[kind]}
		</span>
	);
}
