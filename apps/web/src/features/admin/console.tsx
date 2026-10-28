import type { IconName } from "@reactive-resume/ui/components/icon";
import type { ReactNode } from "react";
import type { RouterOutput } from "@/libs/orpc/client";
import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@reactive-resume/ui/components/badge";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
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
import { SegmentedControl, SegmentedControlItem } from "@reactive-resume/ui/components/segmented-control";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah, ORDER_STATUS_LABEL } from "../billing/config";
import { RevenueChart, SignupBars, Sparkline, StatusDonut } from "./charts";

type Analytics = RouterOutput["billing"]["adminAnalytics"];
type AdminOrder = RouterOutput["billing"]["adminOrders"]["orders"][number];
type AdminUser = RouterOutput["billing"]["adminUsers"]["users"][number];
type Plan = RouterOutput["billing"]["plans"]["plans"][number];
type PlanKind = "application" | "interview";
type View = "ringkasan" | "pesanan" | "pengguna" | "paket" | "audit";
type Days = 7 | 30 | 90;

const NAV: Array<{ key: View; label: string; icon: IconName }> = [
	{ key: "ringkasan", label: "Ringkasan", icon: "squares-four" },
	{ key: "pesanan", label: "Pesanan", icon: "tray" },
	{ key: "pengguna", label: "Pengguna", icon: "user-circle" },
	{ key: "paket", label: "Paket & harga", icon: "tag" },
	{ key: "audit", label: "Audit", icon: "clock-counter-clockwise" },
];

const VIEW_COPY: Record<View, { title: string; description: string }> = {
	ringkasan: {
		title: "Ringkasan",
		description: "Pendapatan, pesanan, dan pengguna PortoFit dalam satu layar.",
	},
	pesanan: {
		title: "Pesanan",
		description: "Semua pesanan QRIS. Cocokkan nominal, periksa bukti, lalu putuskan.",
	},
	pengguna: {
		title: "Pengguna",
		description: "Saldo kredit, riwayat bergabung, and koreksi manual.",
	},
	paket: {
		title: "Paket & harga",
		description: "Harga baru berlaku untuk pesanan berikutnya; pesanan lama menyimpan harga saat dibeli.",
	},
	audit: {
		title: "Audit",
		description: "Jejak tindakan admin: verifikasi, penolakan, koreksi kredit, dan perubahan harga.",
	},
};

const STATUS_VARIANT: Record<string, "neutral" | "warn" | "accent" | "danger"> = {
	menunggu_bayar: "neutral",
	menunggu_verifikasi: "warn",
	lunas: "accent",
	ditolak: "danger",
};

const STATUS_COLOR: Record<string, string> = {
	menunggu_bayar: "var(--ink-3)",
	menunggu_verifikasi: "var(--warn)",
	lunas: "var(--accent)",
	ditolak: "var(--danger)",
};

const KIND_LABEL: Record<PlanKind, string> = { application: "CV + cover letter", interview: "Latihan wawancara" };
const KIND_NOUN: Record<PlanKind, string> = { application: "lamaran", interview: "wawancara" };

const ACTION_LABEL: Record<string, string> = {
	"order.verify": "Verifikasi pesanan",
	"order.reject": "Penolakan pesanan",
	"credits.adjust": "Koreksi kredit",
	"plan.update": "Ubah harga paket",
};

const dateShort = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
const timeShort = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dateLong = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const stampShort = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const compactNumber = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

const formatDate = (value: Date | string | number) => dateShort.format(new Date(value));
const formatTime = (value: Date | string | number) => timeShort.format(new Date(value));
const formatStamp = (value: Date | string | number) => stampShort.format(new Date(value));
const uniqueCode = (code: number) => String(code).padStart(3, "0");
const initialOf = (name: string) => name.trim().slice(0, 2).toUpperCase() || "AD";

const FILTERS: Array<{ key: "semua" | keyof typeof STATUS_VARIANT; label: string }> = [
	{ key: "semua", label: "Semua" },
	{ key: "menunggu_verifikasi", label: "Menunggu verifikasi" },
	{ key: "menunggu_bayar", label: "Menunggu bayar" },
	{ key: "lunas", label: "Lunas" },
	{ key: "ditolak", label: "Ditolak" },
];

/**
 * The admin console at /admin: its own shell, separate from the user dashboard, because the work is
 * operational (money in, credits out) rather than document editing. Charts, queue, people, plans and
 * the audit trail live behind one sidebar.
 */
export function AdminConsolePage({ user }: { user: { name: string; email: string } }) {
	const queryClient = useQueryClient();
	const [view, setView] = useState<View>("ringkasan");
	const [days, setDays] = useState<Days>(30);
	const [orderFilter, setOrderFilter] = useState<"semua" | keyof typeof STATUS_VARIANT>("semua");
	const [query, setQuery] = useState("");
	const [headerQuery, setHeaderQuery] = useState("");
	const search = useDeferredValue(query.trim());
	const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
	const [proofOrder, setProofOrder] = useState<AdminOrder | null>(null);
	const [rejectOrder, setRejectOrder] = useState<AdminOrder | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [creditTarget, setCreditTarget] = useState<{ user: AdminUser; kind: PlanKind; delta: number } | null>(null);
	const [creditReason, setCreditReason] = useState("");

	const analytics = useQuery(orpc.billing.adminAnalytics.queryOptions({ input: { days } }));
	const orders = useQuery(orpc.billing.adminOrders.queryOptions({ input: { limit: 100 } }));
	const pending = useQuery(
		orpc.billing.adminOrders.queryOptions({ input: { status: "menunggu_verifikasi", limit: 20 } }),
	);
	const users = useQuery(orpc.billing.adminUsers.queryOptions({ input: { query: search || undefined, limit: 100 } }));
	const plans = useQuery(orpc.billing.plans.queryOptions());
	const audit = useQuery(orpc.billing.adminAudit.queryOptions({ input: { limit: 25 } }));

	const verify = useMutation(orpc.billing.adminVerifyOrder.mutationOptions());
	const reject = useMutation(orpc.billing.adminRejectOrder.mutationOptions());
	const adjust = useMutation(orpc.billing.adminAdjustCredits.mutationOptions());
	const updatePlan = useMutation(orpc.billing.adminUpdatePlan.mutationOptions());
	const exportCsv = useQuery({ ...orpc.billing.adminExportCsv.queryOptions(), enabled: false });

	const proof = useQuery({
		...orpc.billing.adminOrderProof.queryOptions({ input: { orderId: proofOrder?.id ?? "" } }),
		enabled: Boolean(proofOrder),
	});

	const orderList = orders.data?.orders ?? [];
	const pendingOrders = pending.data?.orders ?? [];
	const userList = users.data?.users ?? [];
	const planList = plans.data?.plans ?? [];
	const auditEntries = audit.data?.entries ?? [];
	const filteredOrders = orderFilter === "semua" ? orderList : orderList.filter((order) => order.status === orderFilter);
	const pendingCount = analytics.data?.totals.pendingVerification ?? pendingOrders.length;

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

	const openCredit = (target: AdminUser, kind: PlanKind, delta: number) => {
		setCreditReason("Koreksi manual admin");
		setCreditTarget({ user: target, kind, delta });
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
		const digits = (priceDraft[plan.code] ?? String(plan.priceIdr)).replace(/\D/g, "");
		const value = Number(digits);
		if (!digits || !Number.isFinite(value) || value < 0) {
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

	const goToUsers = (value: string) => {
		setQuery(value);
		setHeaderQuery(value);
		setView("pengguna");
	};

	const copy = VIEW_COPY[view];

	return (
		<div className="flex min-h-svh bg-bg text-ink">
			<AdminSidebar
				view={view}
				onView={setView}
				pendingCount={pendingCount}
				user={user}
			/>

			<main className="min-w-0 flex-1">
				<header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
					<div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
						<div className="min-w-0 flex-1">
							<p className="text-[11px] font-medium tracking-[0.14em] text-ink-3 uppercase">PortoFit · admin</p>
							<h1 className="mt-0.5 font-display text-xl leading-tight font-medium tracking-tight text-ink">
								{copy.title}
							</h1>
							<p className="mt-0.5 hidden text-xs text-ink-3 sm:block">{copy.description}</p>
						</div>
						<InputGroup className="hidden w-56 md:flex">
							<InputGroupAddon align="inline-start">
								<Icon name="magnifying-glass" size={15} />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Cari pengguna…"
								aria-label="Cari pengguna"
								value={headerQuery}
								onChange={(event) => setHeaderQuery(event.currentTarget.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") goToUsers(event.currentTarget.value);
								}}
							/>
						</InputGroup>
						<Button size="sm" variant="secondary" loading={analytics.isFetching || orders.isFetching} onClick={() => void refresh()}>
							<Icon name="arrows-clockwise" size={15} />
							Segarkan
						</Button>
						<Button size="sm" variant="secondary" loading={exportCsv.isFetching} onClick={() => void downloadCsv()}>
							<Icon name="download-simple" size={15} />
							Unduh CSV
						</Button>
					</div>

					<div className="mx-auto flex w-full max-w-[1280px] gap-1 overflow-x-auto border-t border-line px-3 py-2 [scrollbar-width:none] lg:hidden">
						{NAV.map((item) => (
							<button
								key={item.key}
								type="button"
								onClick={() => setView(item.key)}
								className={cn(
									"flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
									view === item.key ? "bg-ink text-bg" : "text-ink-2 hover:bg-sunken",
								)}
							>
								<Icon name={item.icon} size={15} />
								{item.label}
							</button>
						))}
					</div>
				</header>

				<div className="mx-auto w-full max-w-[1280px] px-4 py-5 lg:px-8 lg:py-7">
					{view === "ringkasan" ? (
						<OverviewView
							analytics={analytics.data}
							loading={analytics.isLoading}
							days={days}
							onDays={setDays}
							pendingOrders={pendingOrders}
							recentOrders={orderList}
							onOpenProof={setProofOrder}
							onVerify={verifyNow}
							onOpenReject={openReject}
							onSeeOrders={(filter) => {
								setOrderFilter(filter ?? "semua");
								setView("pesanan");
							}}
						/>
					) : null}

					{view === "pesanan" ? (
						<OrdersView
							orders={filteredOrders}
							loading={orders.isLoading}
							filter={orderFilter}
							onFilter={setOrderFilter}
							onOpenProof={setProofOrder}
							onVerify={verifyNow}
							onOpenReject={openReject}
							verifyingId={verify.isPending ? verify.variables?.orderId : undefined}
						/>
					) : null}

					{view === "pengguna" ? (
						<UsersView
							users={userList}
							loading={users.isLoading}
							query={query}
							onQuery={setQuery}
							onCredit={openCredit}
						/>
					) : null}

					{view === "paket" ? (
						<PlansView
							plans={planList}
							loading={plans.isLoading}
							drafts={priceDraft}
							onDraft={(code, value) => setPriceDraft((previous) => ({ ...previous, [code]: value }))}
							onSave={savePlan}
							saving={updatePlan.isPending}
						/>
					) : null}

					{view === "audit" ? <AuditView entries={auditEntries} loading={audit.isLoading} /> : null}
				</div>
			</main>

			<ProofDialog order={proofOrder} onClose={() => setProofOrder(null)} proof={proof} onReject={openReject} onVerify={verifyNow} verifying={verify.isPending} />
			<RejectDialog
				order={rejectOrder}
				reason={rejectReason}
				onReason={setRejectReason}
				onClose={() => setRejectOrder(null)}
				onSubmit={submitReject}
				pending={reject.isPending}
			/>
			<CreditDialog
				target={creditTarget}
				reason={creditReason}
				onReason={setCreditReason}
				onClose={() => setCreditTarget(null)}
				onSubmit={submitCredit}
				pending={adjust.isPending}
			/>
		</div>
	);
}

function AdminSidebar({
	view,
	onView,
	pendingCount,
	user,
}: {
	view: View;
	onView: (view: View) => void;
	pendingCount: number;
	user: { name: string; email: string };
}) {
	return (
		<aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-e border-line bg-surface lg:flex">
			<Link to="/" className="flex items-center gap-2.5 px-4 py-4">
				<BrandIcon variant="icon" alt="" className="size-7 shrink-0" />
				<span className="text-sm font-semibold">PortoFit</span>
				<Badge variant="outline">admin</Badge>
			</Link>

			<nav className="grid gap-0.5 px-2">
				{NAV.map((item) => (
					<button
						key={item.key}
						type="button"
						onClick={() => onView(item.key)}
						aria-current={view === item.key ? "page" : undefined}
						className={cn(
							"flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
							view === item.key ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:bg-hover hover:text-ink",
						)}
					>
						<Icon name={item.icon} filled={view === item.key} />
						<span className="flex-1 text-start">{item.label}</span>
						{item.key === "pesanan" && pendingCount > 0 ? (
							<span className="rounded-full bg-warn-soft px-1.5 text-[11px] font-medium text-warn-text tabular-nums">
								{pendingCount}
							</span>
						) : null}
					</button>
				))}
			</nav>

			<div className="mt-auto grid gap-2 border-t border-line p-3">
				<Link
					to="/dashboard"
					className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-ink-2 transition-colors hover:bg-hover hover:text-ink"
				>
					<Icon name="arrow-left" size={16} />
					Kembali ke aplikasi
				</Link>
				<div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
					<span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-bg">
						{initialOf(user.name)}
					</span>
					<span className="grid min-w-0">
						<span className="truncate text-sm font-medium">{user.name}</span>
						<span className="truncate text-[11px] text-ink-3">{user.email}</span>
					</span>
				</div>
			</div>
		</aside>
	);
}

function OverviewView({
	analytics,
	loading,
	days,
	onDays,
	pendingOrders,
	recentOrders,
	onOpenProof,
	onVerify,
	onOpenReject,
	onSeeOrders,
}: {
	analytics: Analytics | undefined;
	loading: boolean;
	days: Days;
	onDays: (days: Days) => void;
	pendingOrders: AdminOrder[];
	recentOrders: AdminOrder[];
	onOpenProof: (order: AdminOrder) => void;
	onVerify: (order: AdminOrder) => void;
	onOpenReject: (order: AdminOrder) => void;
	onSeeOrders: (filter?: "semua" | keyof typeof STATUS_VARIANT) => void;
}) {
	const range = analytics?.range;
	const previous = analytics?.previous;
	const daily = analytics?.daily ?? [];
	const revenuePoints = daily.map((point) => ({ date: point.date, value: point.revenueIdr }));
	const signupPoints = daily.map((point) => ({ date: point.date, value: point.newUsers }));
	const donutSegments = (analytics?.byStatus ?? []).map((item) => ({
		key: item.status,
		label: ORDER_STATUS_LABEL[item.status] ?? item.status,
		value: item.count,
		color: STATUS_COLOR[item.status] ?? "var(--ink-3)",
	}));
	const topPlans = analytics?.byPlan ?? [];
	const maxPlanRevenue = Math.max(...topPlans.map((plan) => plan.revenueIdr), 1);
	const totalOrders = (analytics?.byStatus ?? []).reduce((sum, item) => sum + item.count, 0);
	const averageOrder = (range?.orders ?? 0) > 0 ? Math.round((range?.revenueIdr ?? 0) / (range?.orders ?? 1)) : 0;

	return (
		<div className="grid gap-4">
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan angka">
				<StatCard
					label={`Pendapatan ${days} hari`}
					value={formatRupiah(range?.revenueIdr ?? 0)}
					hint={`${range?.orders ?? 0} pesanan lunas`}
					icon="chart-line-up"
					delta={{ current: range?.revenueIdr ?? 0, previous: previous?.revenueIdr ?? 0 }}
					loading={loading}
					spark={revenuePoints.map((point) => point.value)}
				/>
				<StatCard
					label="Pesanan lunas"
					value={String(range?.orders ?? 0)}
					hint={`${days} hari terakhir`}
					icon="tray"
					delta={{ current: range?.orders ?? 0, previous: previous?.orders ?? 0 }}
					loading={loading}
				/>
				<StatCard
					label="Pengguna baru"
					value={String(range?.newUsers ?? 0)}
					hint={`${analytics?.totals.users ?? 0} akun terdaftar`}
					icon="user-plus"
					delta={{ current: range?.newUsers ?? 0, previous: previous?.newUsers ?? 0 }}
					loading={loading}
				/>
				<StatCard
					label="Menunggu verifikasi"
					value={String(analytics?.totals.pendingVerification ?? pendingOrders.length)}
					hint={pendingOrders.length > 0 ? "perlu dicek hari ini" : "antrean bersih"}
					icon="hourglass"
					tone={pendingOrders.length > 0 ? "warn" : "accent"}
					loading={loading}
					onClick={() => onSeeOrders("menunggu_verifikasi")}
				/>
			</section>

			<section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
				<Panel>
					<PanelHeader
						title="Pendapatan"
						description="Pesanan lunas per hari. Hari dihitung UTC."
						action={
							<SegmentedControl
								value={String(days)}
								onValueChange={(value) => onDays(Number(value) as Days)}
								aria-label="Rentang grafik"
							>
								<SegmentedControlItem value="7" className="px-2.5 text-xs">
									7 hari
								</SegmentedControlItem>
								<SegmentedControlItem value="30" className="px-2.5 text-xs">
									30 hari
								</SegmentedControlItem>
								<SegmentedControlItem value="90" className="px-2.5 text-xs">
									90 hari
								</SegmentedControlItem>
							</SegmentedControl>
						}
					/>
					<div className="px-4 pt-4 pb-2">
						<div className="flex flex-wrap items-end gap-x-3 gap-y-1">
							<p className="font-display text-[30px] leading-none tracking-tight tabular-nums text-ink">
								{formatRupiah(range?.revenueIdr ?? 0)}
							</p>
							<span className="pb-0.5 text-xs">
								<Delta current={range?.revenueIdr ?? 0} previous={previous?.revenueIdr ?? 0} suffix={`${days} hari sebelumnya`} />
							</span>
						</div>
						<p className="mt-1 text-xs text-ink-3">
							Rata-rata {formatRupiah(Math.round((range?.revenueIdr ?? 0) / days))} per hari
						</p>
					</div>
					<div className="px-2 pb-3">
						{loading ? <Skeleton className="m-2 h-44 w-full" /> : <RevenueChart data={revenuePoints} formatValue={formatRupiah} formatAxis={(value) => compactNumber.format(value)} />}
					</div>
				</Panel>

				<Panel>
					<PanelHeader title="Status pesanan" description="Seluruh pesanan, bukan hanya rentang grafik." />
					<div className="p-4">
						{loading ? (
							<Skeleton className="h-32 w-full" />
						) : (
							<>
								<StatusDonut segments={donutSegments} caption="Status pesanan" />
								<dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3">
									<div>
										<dt className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">Rata-rata pesanan</dt>
										<dd className="mt-1 text-sm font-medium tabular-nums text-ink">{formatRupiah(averageOrder)}</dd>
									</div>
									<div>
										<dt className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">Total pesanan</dt>
										<dd className="mt-1 text-sm font-medium tabular-nums text-ink">{totalOrders}</dd>
									</div>
								</dl>
							</>
						)}
					</div>
				</Panel>
			</section>

			<section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
				<Panel>
					<PanelHeader
						title="Pesanan terbaru"
						description="Lima pesanan terakhir, semua status."
						action={
							<Button size="sm" variant="ghost" onClick={() => onSeeOrders("semua")}>
								Lihat semua
								<Icon name="arrow-right" size={14} />
							</Button>
						}
					/>
					<OrdersTable
						orders={recentOrders.slice(0, 5)}
						loading={loading}
						onOpenProof={onOpenProof}
						onVerify={onVerify}
						onOpenReject={onOpenReject}
						compact
					/>
				</Panel>

				<div className="grid gap-4">
					<Panel>
						<PanelHeader title="Perlu tindakan" description="Bukti bayar yang menunggu." />
						{pendingOrders.length === 0 ? (
							<EmptyState
								icon="check-circle"
								title="Antrean bersih"
								description="Tidak ada bukti bayar yang menunggu verifikasi."
								tone="accent"
							/>
						) : (
							<ul className="divide-y divide-line">
								{pendingOrders.slice(0, 3).map((order) => (
									<li key={order.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
										<span className="min-w-0">
											<span className="block truncate text-xs font-medium text-ink">{order.planName}</span>
											<span className="block truncate text-[11px] text-ink-3">
												{order.buyerEmail ?? "tanpa email"} · {formatStamp(order.createdAt)}
											</span>
										</span>
										<Button size="sm" variant="secondary" onClick={() => onOpenProof(order)}>
											Periksa
										</Button>
									</li>
								))}
							</ul>
						)}
					</Panel>

					<Panel>
						<PanelHeader title="Paket terlaris" description="Pendapatan lunas per paket." />
						{topPlans.length === 0 ? (
							<p className="px-4 py-6 text-xs text-ink-3">Belum ada penjualan.</p>
						) : (
							<ul className="grid gap-3 px-4 py-3">
								{topPlans.map((plan) => (
									<li key={plan.planCode} className="grid gap-1">
										<div className="flex items-baseline justify-between gap-2 text-xs">
											<span className="truncate text-ink">{plan.planName}</span>
											<span className="shrink-0 tabular-nums text-ink-2">{formatRupiah(plan.revenueIdr)}</span>
										</div>
										<div className="h-1.5 overflow-hidden rounded-full bg-sunken">
											<div
												className="h-full rounded-full bg-accent"
												style={{ width: `${Math.max((plan.revenueIdr / maxPlanRevenue) * 100, 3)}%` }}
											/>
										</div>
									</li>
								))}
							</ul>
						)}
					</Panel>
				</div>
			</section>

			<section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
				<Panel>
					<PanelHeader title="Pendaftaran pengguna" description={`Akun baru per hari, ${days} hari terakhir.`} />
					<div className="p-4">
						{loading ? <Skeleton className="h-16 w-full" /> : <SignupBars data={signupPoints} />}
						<p className="mt-3 text-xs text-ink-3">
							{range?.newUsers ?? 0} akun baru dalam {days} hari. Total {analytics?.totals.users ?? 0} akun terdaftar.
						</p>
					</div>
				</Panel>

				<Panel>
					<PanelHeader title="Keuangan" description="Angka kumulatif, bukan rentang grafik." />
					<dl className="grid gap-2 p-4">
						<div className="flex items-baseline justify-between gap-3 text-sm">
							<dt className="text-ink-2">Hari ini</dt>
							<dd className="font-medium tabular-nums text-ink">{formatRupiah(analytics?.totals.revenueTodayIdr ?? 0)}</dd>
						</div>
						<div className="flex items-baseline justify-between gap-3 text-sm">
							<dt className="text-ink-2">Bulan ini</dt>
							<dd className="font-medium tabular-nums text-ink">{formatRupiah(analytics?.totals.revenueMonthIdr ?? 0)}</dd>
						</div>
						<div className="flex items-baseline justify-between gap-3 border-t border-line pt-2 text-sm">
							<dt className="text-ink-2">Pesanan lunas</dt>
							<dd className="font-medium tabular-nums text-ink">{analytics?.totals.paidOrders ?? 0}</dd>
						</div>
					</dl>
				</Panel>
			</section>
		</div>
	);
}

function OrdersView({
	orders,
	loading,
	filter,
	onFilter,
	onOpenProof,
	onVerify,
	onOpenReject,
	verifyingId,
}: {
	orders: AdminOrder[];
	loading: boolean;
	filter: "semua" | keyof typeof STATUS_VARIANT;
	onFilter: (filter: "semua" | keyof typeof STATUS_VARIANT) => void;
	onOpenProof: (order: AdminOrder) => void;
	onVerify: (order: AdminOrder) => void;
	onOpenReject: (order: AdminOrder) => void;
	verifyingId?: string | undefined;
}) {
	return (
		<Panel>
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
				<div className="flex flex-wrap gap-1">
					{FILTERS.map((item) => (
						<button
							key={item.key}
							type="button"
							onClick={() => onFilter(item.key)}
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
								filter === item.key ? "bg-ink text-bg" : "text-ink-2 hover:bg-sunken",
							)}
						>
							{item.label}
						</button>
					))}
				</div>
				<p className="text-xs text-ink-3">{orders.length} pesanan</p>
			</div>
			<OrdersTable
				orders={orders}
				loading={loading}
				onOpenProof={onOpenProof}
				onVerify={onVerify}
				onOpenReject={onOpenReject}
				verifyingId={verifyingId}
			/>
		</Panel>
	);
}

function OrdersTable({
	orders,
	loading,
	onOpenProof,
	onVerify,
	onOpenReject,
	verifyingId,
	compact = false,
}: {
	orders: AdminOrder[];
	loading: boolean;
	onOpenProof: (order: AdminOrder) => void;
	onVerify: (order: AdminOrder) => void;
	onOpenReject: (order: AdminOrder) => void;
	verifyingId?: string | undefined;
	compact?: boolean;
}) {
	if (loading) {
		return (
			<div className="grid gap-2 p-4">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<EmptyState
				icon="tray"
				title="Belum ada pesanan"
				description="Pesanan muncul di sini setelah pembeli memilih paket di halaman harga."
			/>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[720px] border-collapse text-left text-sm [&_td]:align-middle">
				<caption className="sr-only">Daftar pesanan PortoFit</caption>
				<thead>
					<tr className="text-[11px] tracking-[0.1em] text-ink-3 uppercase">
						<th scope="col" className="px-4 py-2 font-medium">
							Waktu
						</th>
						<th scope="col" className="px-4 py-2 font-medium">
							Pembeli
						</th>
						<th scope="col" className="px-4 py-2 font-medium">
							Paket
						</th>
						<th scope="col" className="px-4 py-2 text-right font-medium">
							Nominal
						</th>
						<th scope="col" className="px-4 py-2 font-medium">
							Status
						</th>
						<th scope="col" className="px-4 py-2 text-right font-medium">
							{compact ? "Bukti" : "Tindakan"}
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-line border-t border-line">
					{orders.map((order) => (
						<tr key={order.id} className="transition-colors duration-150 hover:bg-sunken/50">
							<td className="px-4 py-2.5 whitespace-nowrap">
								<span className="block text-xs text-ink">{formatDate(order.createdAt)}</span>
								<span className="block text-[11px] text-ink-3 tabular-nums">{formatTime(order.createdAt)}</span>
							</td>
							<td className="max-w-52 px-4 py-2.5">
								<span className="block truncate text-xs text-ink-2">{order.buyerEmail ?? "tidak diketahui"}</span>
								{order.paymentMethod === "wa" ? <span className="text-[11px] text-ink-3">lewat WhatsApp</span> : null}
							</td>
							<td className="px-4 py-2.5">
								<span className="block text-ink">{order.planName}</span>
								<span className="block text-[11px] text-ink-3">{KIND_LABEL[order.kind]}</span>
							</td>
							<td className="px-4 py-2.5 text-right whitespace-nowrap">
								<span className="block font-medium text-ink tabular-nums">{formatRupiah(order.totalIdr)}</span>
								<span className="block text-[11px] text-ink-3 tabular-nums">kode {uniqueCode(order.uniqueCode)}</span>
							</td>
							<td className="px-4 py-2.5">
								<Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
								{order.status === "ditolak" && order.rejectionReason ? (
									<span className="mt-1 block max-w-40 truncate text-[11px] text-ink-3">{order.rejectionReason}</span>
								) : null}
							</td>
							<td className="px-4 py-2.5">
								<div className="flex items-center justify-end gap-1.5">
									{order.proofPath ? (
										<Button size="sm" variant="secondary" onClick={() => onOpenProof(order)}>
											<Icon name="eye" size={15} />
											Bukti
										</Button>
									) : null}
									{!compact && order.status === "menunggu_verifikasi" ? (
										<>
											<Button
												size="sm"
												variant="ghost"
												className="text-danger-text hover:bg-danger-soft"
												onClick={() => onOpenReject(order)}
											>
												Tolak
											</Button>
											<Button
												size="sm"
												loading={verifyingId === order.id}
												onClick={() => onVerify(order)}
											>
												Verifikasi
											</Button>
										</>
									) : null}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function UsersView({
	users,
	loading,
	query,
	onQuery,
	onCredit,
}: {
	users: AdminUser[];
	loading: boolean;
	query: string;
	onQuery: (value: string) => void;
	onCredit: (user: AdminUser, kind: PlanKind, delta: number) => void;
}) {
	return (
		<Panel>
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
				<div>
					<h2 className="text-sm font-semibold text-ink">Pengguna dan kredit</h2>
					<p className="text-xs text-ink-3">{users.length} akun ditampilkan</p>
				</div>
				<InputGroup className="w-full max-w-64">
					<InputGroupAddon align="inline-start">
						<Icon name="magnifying-glass" size={15} />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Cari nama atau email"
						aria-label="Cari pengguna"
						value={query}
						onChange={(event) => onQuery(event.currentTarget.value)}
					/>
				</InputGroup>
			</div>

			{loading ? (
				<div className="grid gap-2 p-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			) : users.length === 0 ? (
				<EmptyState
					icon="user-circle"
					title="Tidak ada akun"
					description={query ? `Tidak ada akun yang cocok dengan “${query}”.` : "Belum ada akun terdaftar."}
				/>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px] border-collapse text-left text-sm [&_td]:align-middle">
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
							{users.map((item) => (
								<tr key={item.id} className="transition-colors duration-150 hover:bg-sunken/50">
									<td className="max-w-72 px-4 py-2.5">
										<span className="flex items-center gap-1.5">
											<span className="truncate font-medium text-ink">{item.name}</span>
											{item.role === "admin" ? (
												<Badge variant="accent" className="shrink-0">
													admin
												</Badge>
											) : null}
										</span>
										<span className="block truncate text-[11px] text-ink-3">{item.email}</span>
									</td>
									<td className="px-4 py-2.5">
										<div className="flex flex-wrap items-center gap-1.5">
											<BalanceChip count={item.balances.application} kind="application" />
											<BalanceChip count={item.balances.interview} kind="interview" />
										</div>
									</td>
									<td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink-3">{dateLong.format(new Date(item.createdAt))}</td>
									<td className="px-4 py-2.5 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger
												render={
													<Button size="icon-xs" variant="ghost" className="text-ink-3" aria-label={`Kelola kredit ${item.name}`} />
												}
											>
												<Icon name="dots-three" size={18} />
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-56">
												<DropdownMenuLabel>Kredit lamaran</DropdownMenuLabel>
												<DropdownMenuItem onClick={() => onCredit(item, "application", 1)}>Tambah 1 kredit</DropdownMenuItem>
												<DropdownMenuItem
													disabled={item.balances.application <= 0}
													onClick={() => onCredit(item, "application", -1)}
												>
													Kurangi 1 kredit
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuLabel>Kredit wawancara</DropdownMenuLabel>
												<DropdownMenuItem onClick={() => onCredit(item, "interview", 1)}>Tambah 1 kredit</DropdownMenuItem>
												<DropdownMenuItem
													disabled={item.balances.interview <= 0}
													onClick={() => onCredit(item, "interview", -1)}
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
		</Panel>
	);
}

function PlansView({
	plans,
	loading,
	drafts,
	onDraft,
	onSave,
	saving,
}: {
	plans: Plan[];
	loading: boolean;
	drafts: Record<string, string>;
	onDraft: (code: string, value: string) => void;
	onSave: (plan: Plan) => void;
	saving: boolean;
}) {
	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{plans.map((plan) => {
				const digits = (drafts[plan.code] ?? String(plan.priceIdr)).replace(/\D/g, "");
				const display = digits ? Number(digits).toLocaleString("id-ID") : "";
				const dirty = digits !== String(plan.priceIdr);
				return (
					<Panel key={plan.code}>
						<div className="flex items-start justify-between gap-3 px-4 pt-4">
							<div>
								<h2 className="text-sm font-semibold text-ink">{plan.name}</h2>
								<p className="mt-0.5 text-xs text-ink-3">{KIND_LABEL[plan.kind]}</p>
							</div>
							<Badge variant="outline">{plan.credits} kredit</Badge>
						</div>
						<div className="grid gap-2 p-4">
							<Label htmlFor={`price-${plan.code}`} className="text-xs text-ink-2">
								Harga (Rp)
							</Label>
							<div className="flex items-center gap-2">
								<InputGroup className="flex-1">
									<InputGroupAddon align="inline-start">
										<InputGroupText className="text-xs text-ink-3">Rp</InputGroupText>
									</InputGroupAddon>
									<InputGroupInput
										id={`price-${plan.code}`}
										inputMode="numeric"
										className="tabular-nums"
										value={display}
										onChange={(event) => onDraft(plan.code, event.currentTarget.value.replace(/\D/g, ""))}
									/>
								</InputGroup>
								<Button
									size="sm"
									variant={dirty ? "primary" : "secondary"}
									disabled={!dirty || saving}
									onClick={() => onSave(plan)}
								>
									Simpan
								</Button>
							</div>
							<p className="text-[11px] text-ink-3">
								Dibayar: {formatRupiah(plan.priceIdr)} + kode unik. Perubahan tidak mengubah pesanan lama.
							</p>
						</div>
					</Panel>
				);
			})}
		</div>
	);
}

function AuditView({ entries, loading }: { entries: Array<RouterOutput["billing"]["adminAudit"]["entries"][number]>; loading: boolean }) {
	return (
		<Panel>
			<div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
				<div>
					<h2 className="text-sm font-semibold text-ink">Audit admin</h2>
					<p className="text-xs text-ink-3">Tindakan terakhir, terbaru di atas.</p>
				</div>
			</div>
			{loading ? (
				<div className="grid gap-2 p-4">
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-8 w-full" />
				</div>
			) : entries.length === 0 ? (
				<EmptyState icon="clock-counter-clockwise" title="Belum ada tindakan" description="Verifikasi pesanan pertama akan muncul di sini." />
			) : (
				<ol className="divide-y divide-line">
					{entries.map((entry) => (
						<li key={entry.id} className="flex gap-3 px-4 py-3">
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-2" aria-hidden="true" />
							<div className="min-w-0 flex-1">
								<p className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-ink">
									<span className="font-medium">{ACTION_LABEL[entry.action] ?? entry.action}</span>
									<span className="text-ink-3">{entry.targetType.replaceAll("_", " ")}</span>
								</p>
								<p className="text-[11px] text-ink-3">
									{entry.actorEmail ?? "tidak diketahui"} · {formatStamp(entry.createdAt)}
								</p>
							</div>
						</li>
					))}
				</ol>
			)}
		</Panel>
	);
}

function StatCard({
	label,
	value,
	hint,
	icon,
	tone = "neutral",
	delta,
	spark,
	loading,
	onClick,
}: {
	label: string;
	value: string;
	hint: string;
	icon: IconName;
	tone?: "neutral" | "warn" | "accent";
	delta?: { current: number; previous: number };
	spark?: number[];
	loading?: boolean;
	onClick?: () => void;
}) {
	const content = (
		<>
			<div className="flex items-start justify-between gap-3">
				<p className="text-[11px] font-medium tracking-[0.1em] text-ink-3 uppercase">{label}</p>
				<span
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-lg",
						tone === "warn" && "bg-warn-soft text-warn-text",
						tone === "accent" && "bg-accent-soft text-accent-text",
						tone === "neutral" && "bg-sunken text-ink-2",
					)}
				>
					<Icon name={icon} size={17} />
				</span>
			</div>
			{loading ? (
				<Skeleton className="mt-3 h-7 w-24" />
			) : (
				<p className="mt-2.5 font-display text-2xl leading-none tracking-tight tabular-nums text-ink">{value}</p>
			)}
			<div className="mt-2 flex items-end justify-between gap-2">
				<p className="text-xs leading-4 text-ink-3">
					{delta ? <Delta current={delta.current} previous={delta.previous} suffix="periode sebelumnya" className="me-1" /> : null}
					{hint}
				</p>
				{spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
			</div>
		</>
	);

	const className = "rounded-xl border border-line bg-surface p-4 text-start transition-colors hover:border-line-2";
	if (onClick) {
		return (
			<button type="button" onClick={onClick} className={cn(className, "cursor-pointer")}>
				{content}
			</button>
		);
	}
	return <div className={className}>{content}</div>;
}

function Delta({
	current,
	previous,
	suffix,
	className,
}: {
	current: number;
	previous: number;
	suffix: string;
	className?: string;
}) {
	if (previous <= 0) {
		return <span className={cn("text-ink-3", className)}>{current > 0 ? "tanpa pembanding" : "—"}</span>;
	}
	const percent = ((current - previous) / previous) * 100;
	const up = percent >= 0;
	return (
		<span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-accent-text" : "text-danger-text", className)}>
			<Icon name={up ? "trend-up" : "arrow-down"} size={12} />
			{Math.abs(percent).toFixed(1)}%<span className="font-normal text-ink-3"> vs {suffix}</span>
		</span>
	);
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
	return <section className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>{children}</section>;
}

function PanelHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
			<div className="min-w-0">
				<h2 className="text-sm font-semibold text-ink">{title}</h2>
				{description ? <p className="mt-0.5 text-xs text-ink-3">{description}</p> : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

function EmptyState({
	icon,
	title,
	description,
	tone = "neutral",
}: {
	icon: IconName;
	title: string;
	description: string;
	tone?: "neutral" | "accent";
}) {
	return (
		<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
			<span
				className={cn(
					"flex size-10 items-center justify-center rounded-full",
					tone === "accent" ? "bg-accent-soft text-accent-text" : "bg-sunken text-ink-3",
				)}
			>
				<Icon name={icon} size={22} />
			</span>
			<p className="text-sm font-medium text-ink">{title}</p>
			<p className="max-w-sm text-xs leading-5 text-ink-3">{description}</p>
		</div>
	);
}

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
				className={cn("size-1.5 rounded-full", empty ? "bg-line-2" : kind === "application" ? "bg-accent" : "bg-warn")}
			/>
			{count} {KIND_NOUN[kind]}
		</span>
	);
}

function ProofDialog({
	order,
	onClose,
	proof,
	onReject,
	onVerify,
	verifying,
}: {
	order: AdminOrder | null;
	onClose: () => void;
	proof: {
		isLoading: boolean;
		isError: boolean;
		error: unknown;
		data?: { dataUrl: string; contentType: string; fileName: string; size: number } | undefined;
	};
	onReject: (order: AdminOrder) => void;
	onVerify: (order: AdminOrder) => void;
	verifying: boolean;
}) {
	return (
		<Dialog
			open={Boolean(order)}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-[680px]">
				<DialogHeader>
					<DialogTitle>Bukti bayar</DialogTitle>
					<DialogDescription>
						{order ? `${order.planName} · ${formatRupiah(order.totalIdr)} · kode unik ${uniqueCode(order.uniqueCode)}` : ""}
					</DialogDescription>
				</DialogHeader>

				{order ? (
					<div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-sunken px-3 py-2 text-[11px] text-ink-3">
						<span>Pembeli: {order.buyerEmail ?? "tidak diketahui"}</span>
						<span>Dibuat: {formatStamp(order.createdAt)}</span>
						{order.proofNote ? <span>Catatan: {order.proofNote}</span> : null}
					</div>
				) : null}

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
								alt={`Bukti bayar ${order?.planName ?? ""}`}
								className="mx-auto max-h-[58vh] w-auto rounded-lg bg-white object-contain"
							/>
						) : (
							<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
								<Icon name="file-pdf" size={28} className="text-ink-3" />
								<p className="max-w-xs text-xs leading-5 text-ink-2">
									Bukti berjenis {proof.data.contentType} ({Math.round(proof.data.size / 1024)} KB). Unduh untuk membukanya.
								</p>
								<a className="text-xs font-medium text-accent-text underline underline-offset-2" href={proof.data.dataUrl} download={proof.data.fileName}>
									Unduh bukti
								</a>
							</div>
						)
					) : null}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose}>
						Tutup
					</Button>
					{order ? (
						<Button variant="ghost" className="text-danger-text hover:bg-danger-soft" onClick={() => onReject(order)}>
							Tolak
						</Button>
					) : null}
					{order ? (
						<Button loading={verifying} onClick={() => onVerify(order)}>
							Verifikasi pembayaran
						</Button>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function RejectDialog({
	order,
	reason,
	onReason,
	onClose,
	onSubmit,
	pending,
}: {
	order: AdminOrder | null;
	reason: string;
	onReason: (value: string) => void;
	onClose: () => void;
	onSubmit: () => void;
	pending: boolean;
}) {
	return (
		<Dialog
			open={Boolean(order)}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Tolak pesanan</DialogTitle>
					<DialogDescription>Alasan ini dibaca pembeli di halaman transaksi. Tulis singkat dan jelas.</DialogDescription>
				</DialogHeader>

				{order ? (
					<p className="rounded-lg bg-sunken px-3 py-2 text-xs text-ink-2">
						{order.planName} · {formatRupiah(order.totalIdr)} · kode unik {uniqueCode(order.uniqueCode)}
						{order.buyerEmail ? ` · ${order.buyerEmail}` : ""}
					</p>
				) : null}

				<div className="grid gap-1.5">
					<Label htmlFor="reject-reason">Alasan penolakan</Label>
					<Textarea id="reject-reason" rows={3} maxLength={500} value={reason} onChange={(event) => onReason(event.currentTarget.value)} />
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose}>
						Batal
					</Button>
					<Button variant="danger" loading={pending} disabled={reason.trim().length < 3} onClick={onSubmit}>
						Tolak pesanan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function CreditDialog({
	target,
	reason,
	onReason,
	onClose,
	onSubmit,
	pending,
}: {
	target: { user: AdminUser; kind: PlanKind; delta: number } | null;
	reason: string;
	onReason: (value: string) => void;
	onClose: () => void;
	onSubmit: () => void;
	pending: boolean;
}) {
	return (
		<Dialog
			open={Boolean(target)}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Koreksi kredit</DialogTitle>
					<DialogDescription>Perubahan langsung masuk ke saldo dan tercatat di audit. Koreksi manual tidak menagih pembayaran.</DialogDescription>
				</DialogHeader>

				{target ? (
					<div className="rounded-lg bg-sunken px-3 py-2.5 text-xs text-ink-2">
						<p className="text-sm font-medium text-ink">{target.user.name}</p>
						<p className="mt-0.5 truncate">{target.user.email}</p>
						<p className="mt-2 tabular-nums">
							Kredit {KIND_NOUN[target.kind]}: {target.user.balances[target.kind]} →{" "}
							<span className="font-semibold text-ink">{target.user.balances[target.kind] + target.delta}</span>
						</p>
					</div>
				) : null}

				<div className="grid gap-1.5">
					<Label htmlFor="credit-reason">Alasan</Label>
					<Textarea id="credit-reason" rows={2} maxLength={200} value={reason} onChange={(event) => onReason(event.currentTarget.value)} />
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose}>
						Batal
					</Button>
					<Button loading={pending} disabled={reason.trim().length < 3} onClick={onSubmit}>
						Simpan koreksi
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
