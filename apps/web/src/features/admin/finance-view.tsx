import type { RouterOutput } from "@/libs/orpc/client";
import type { IconName } from "@reactive-resume/ui/components/icon";
import { useState } from "react";
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
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@reactive-resume/ui/components/input-group";
import { Label } from "@reactive-resume/ui/components/label";
import { NativeSelect } from "@reactive-resume/ui/components/native-select";
import { SegmentedControl, SegmentedControlItem } from "@reactive-resume/ui/components/segmented-control";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { formatRupiah } from "../billing/config";

type Entry = RouterOutput["finance"]["list"]["entries"][number];
type Kind = "pemasukan" | "pengeluaran";
type Period = "bulan" | "tiga-puluh" | "semua";

const PERIODS: Array<{ key: Period; label: string }> = [
	{ key: "bulan", label: "Bulan ini" },
	{ key: "tiga-puluh", label: "30 hari" },
	{ key: "semua", label: "Semua" },
];

const CATEGORIES: Record<Kind, string[]> = {
	pemasukan: ["penjualan", "jasa", "modal", "lain"],
	pengeluaran: ["operasional", "ai", "domain", "hosting", "cetak", "transport", "lain"],
};

const KIND_LABEL: Record<Kind, string> = { pemasukan: "Pemasukan", pengeluaran: "Pengeluaran" };

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

function todayInput() {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
}

function rangeFor(period: Period) {
	const now = new Date();
	if (period === "semua") return {};
	if (period === "tiga-puluh") {
		const from = new Date(now);
		from.setDate(from.getDate() - 29);
		from.setHours(0, 0, 0, 0);
		return { from: from.toISOString(), to: now.toISOString() };
	}
	const from = new Date(now.getFullYear(), now.getMonth(), 1);
	return { from: from.toISOString(), to: now.toISOString() };
}

export function FinanceView() {
	const queryClient = useQueryClient();
	const [period, setPeriod] = useState<Period>("bulan");
	const range = rangeFor(period);
	const list = useQuery(orpc.finance.list.queryOptions({ input: { ...range, limit: 300 } }));
	const create = useMutation(orpc.finance.create.mutationOptions());
	const remove = useMutation(orpc.finance.remove.mutationOptions());
	const exportCsv = useQuery({ ...orpc.finance.exportCsv.queryOptions({ input: range }), enabled: false });

	const [open, setOpen] = useState(false);
	const [kind, setKind] = useState<Kind>("pengeluaran");
	const [category, setCategory] = useState(CATEGORIES.pengeluaran[0] ?? "operasional");
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [occurredAt, setOccurredAt] = useState(todayInput());
	const [note, setNote] = useState("");

	const entries = list.data?.entries ?? [];
	const summary = list.data?.summary;
	const categoryMax = Math.max(1, ...(summary?.byCategory.map((item) => item.totalIdr) ?? [1]));

	const resetForm = () => {
		setKind("pengeluaran");
		setCategory(CATEGORIES.pengeluaran[0] ?? "operasional");
		setDescription("");
		setAmount("");
		setOccurredAt(todayInput());
		setNote("");
	};

	const openForm = () => {
		resetForm();
		setOpen(true);
	};

	const changeKind = (next: Kind) => {
		setKind(next);
		setCategory(CATEGORIES[next][0] ?? "lain");
	};

	const fail = (error: unknown, fallback: string) => {
		toast.add({ type: "error", description: getOrpcErrorMessage(error, { fallback }) });
	};

	const submit = async () => {
		const value = Number(amount.replace(/\D/g, ""));
		const text = description.trim();
		if (!value || !Number.isFinite(value)) {
			toast.add({ type: "error", description: "Nominal harus lebih dari nol." });
			return;
		}
		if (text.length < 3) {
			toast.add({ type: "error", description: "Keterangan minimal tiga huruf." });
			return;
		}
		try {
			await create.mutateAsync({
				kind,
				category,
				description: text,
				amountIdr: Math.round(value),
				occurredAt: new Date(`${occurredAt}T12:00:00`).toISOString(),
				note: note.trim() || undefined,
			});
			toast.add({ type: "success", description: `${KIND_LABEL[kind]} ${formatRupiah(Math.round(value))} tercatat.` });
			setOpen(false);
			resetForm();
			await queryClient.invalidateQueries({ queryKey: orpc.finance.key() });
		} catch (error) {
			fail(error, "Catatan gagal disimpan. Coba lagi.");
		}
	};

	const hapus = async (entry: Entry) => {
		if (!window.confirm(`Hapus catatan "${entry.description}"?`)) return;
		try {
			await remove.mutateAsync({ id: entry.id });
			toast.add({ type: "success", description: "Catatan dihapus. Jejaknya tetap ada di audit." });
			await queryClient.invalidateQueries({ queryKey: orpc.finance.key() });
		} catch (error) {
			fail(error, "Catatan gagal dihapus. Coba lagi.");
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
			toast.add({ type: "success", description: `${result.data.rows} catatan diunduh sebagai CSV.` });
		} catch (error) {
			fail(error, "CSV gagal disiapkan. Coba lagi.");
		}
	};

	return (
		<div className="grid gap-4">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Pemasukan"
					value={summary ? formatRupiah(summary.incomeIdr) : ""}
					hint={
						summary
							? `${formatRupiah(summary.incomeOrderIdr)} dari pesanan, ${formatRupiah(summary.incomeManualIdr)} manual`
							: ""
					}
					icon="arrow-down"
					tone="accent"
					loading={list.isLoading}
				/>
				<StatCard
					label="Pengeluaran"
					value={summary ? formatRupiah(summary.expenseIdr) : ""}
					hint="Modal dan biaya operasional yang dicatat manual"
					icon="arrow-up-right"
					tone="warn"
					loading={list.isLoading}
				/>
				<StatCard
					label="Saldo"
					value={summary ? formatRupiah(summary.balanceIdr) : ""}
					hint="Pemasukan dikurangi pengeluaran pada rentang ini"
					icon="chart-line-up"
					tone={summary && summary.balanceIdr < 0 ? "warn" : "neutral"}
					loading={list.isLoading}
				/>
				<StatCard
					label="Catatan"
					value={summary ? String(summary.entryCount) : ""}
					hint={summary ? `${summary.orderCount} pesanan, ${summary.manualCount} manual` : ""}
					icon="clipboard-text"
					loading={list.isLoading}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<section className="overflow-hidden rounded-xl border border-line bg-surface">
					<div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
						<div className="min-w-0">
							<h2 className="text-sm font-semibold text-ink">Buku kas</h2>
							<p className="mt-0.5 text-xs text-ink-3">
								Pesanan situs yang lunas masuk otomatis. Catat di sini hanya uang yang tidak lewat situs.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<SegmentedControl
								value={period}
								onValueChange={(value) => setPeriod(value as Period)}
								aria-label="Rentang buku kas"
							>
								{PERIODS.map((item) => (
									<SegmentedControlItem key={item.key} value={item.key} className="px-2.5 text-xs">
										{item.label}
									</SegmentedControlItem>
								))}
							</SegmentedControl>
							<Button size="sm" variant="secondary" onClick={() => void downloadCsv()}>
								CSV
							</Button>
							<Button size="sm" variant="primary" onClick={openForm}>
								Catat transaksi
							</Button>
						</div>
					</div>

					{list.isLoading ? (
						<div className="grid gap-2 p-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : entries.length === 0 ? (
						<div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
							<span className="flex size-10 items-center justify-center rounded-full bg-sunken text-ink-3">
								<Icon name="list-dashes" size={22} />
							</span>
							<p className="text-sm font-medium text-ink">Belum ada catatan</p>
							<p className="max-w-sm text-xs leading-5 text-ink-3">
								Belum ada pesanan lunas dan belum ada pemasukan atau pengeluaran manual pada rentang ini.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[680px] text-sm">
								<thead>
									<tr className="border-b border-line text-left text-[11px] tracking-[0.08em] text-ink-3 uppercase">
										<th className="px-4 py-2 font-medium">Tanggal</th>
										<th className="px-3 py-2 font-medium">Jenis</th>
										<th className="px-3 py-2 font-medium">Kategori</th>
										<th className="px-3 py-2 font-medium">Keterangan</th>
										<th className="px-3 py-2 text-end font-medium">Nominal</th>
										<th className="px-3 py-2 font-medium">Sumber</th>
										<th className="px-3 py-2" />
									</tr>
								</thead>
								<tbody>
									{entries.map((entry) => (
										<tr key={entry.id} className="border-b border-line last:border-b-0">
											<td className="px-4 py-2.5 whitespace-nowrap text-ink-2 tabular-nums">
												{dateFormat.format(new Date(entry.occurredAt))}
											</td>
											<td className="px-3 py-2.5">
												<Badge variant={entry.kind === "pemasukan" ? "accent" : "danger"}>{KIND_LABEL[entry.kind]}</Badge>
											</td>
											<td className="px-3 py-2.5 text-ink-2">{entry.category}</td>
											<td className="px-3 py-2.5">
												<p className="text-ink">{entry.description}</p>
												{entry.note ? <p className="mt-0.5 text-[11px] text-ink-3">{entry.note}</p> : null}
											</td>
											<td
												className={cn(
													"px-3 py-2.5 text-end font-medium whitespace-nowrap tabular-nums",
													entry.kind === "pemasukan" ? "text-accent-text" : "text-danger-text",
												)}
											>
												{entry.kind === "pemasukan" ? "+" : "-"}
												{formatRupiah(entry.amountIdr)}
											</td>
											<td className="px-3 py-2.5">
												<Badge variant="outline">{entry.source === "order" ? "Pesanan situs" : "Manual"}</Badge>
											</td>
											<td className="px-3 py-2.5 text-end">
												{entry.editable ? (
													<Button
														size="sm"
														variant="ghost"
														aria-label={`Hapus ${entry.description}`}
														onClick={() => void hapus(entry)}
														disabled={remove.isPending}
													>
														<Icon name="x-circle" size={14} />
													</Button>
												) : null}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>

				<section className="overflow-hidden rounded-xl border border-line bg-surface">
					<div className="border-b border-line px-4 py-3">
						<h2 className="text-sm font-semibold text-ink">Per kategori</h2>
						<p className="mt-0.5 text-xs text-ink-3">Ke mana uang pergi dan dari mana uang datang.</p>
					</div>
					{list.isLoading ? (
						<div className="grid gap-2 p-4">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					) : (summary?.byCategory.length ?? 0) === 0 ? (
						<p className="px-4 py-8 text-center text-xs text-ink-3">Belum ada data pada rentang ini.</p>
					) : (
						<div className="grid gap-3 p-4">
							{summary?.byCategory.map((row) => {
								return (
									<div key={`${row.kind}:${row.category}`}>
										<div className="flex items-baseline justify-between gap-2 text-xs">
											<span className="text-ink-2">
												{row.category} <span className="text-ink-3">· {row.count}</span>
											</span>
											<span className="font-medium tabular-nums text-ink">{formatRupiah(row.totalIdr)}</span>
										</div>
										<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
											<div
												className={cn("h-full rounded-full", row.kind === "pemasukan" ? "bg-accent" : "bg-danger")}
												style={{ width: `${Math.max(4, (row.totalIdr / categoryMax) * 100)}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</section>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-[460px]">
					<DialogHeader>
						<DialogTitle>Catat transaksi</DialogTitle>
						<DialogDescription>
							Untuk uang yang tidak lewat situs: setoran tunai, transfer langsung, atau biaya operasional.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-3">
						<div className="grid gap-1.5">
							<Label>Jenis</Label>
							<SegmentedControl
								value={kind}
								onValueChange={(value) => changeKind(value as Kind)}
								aria-label="Jenis transaksi"
							>
								<SegmentedControlItem value="pemasukan">Pemasukan</SegmentedControlItem>
								<SegmentedControlItem value="pengeluaran">Pengeluaran</SegmentedControlItem>
							</SegmentedControl>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="finance-category">Kategori</Label>
							<NativeSelect
								id="finance-category"
								value={category}
								onChange={(event) => setCategory(event.currentTarget.value)}
							>
								{CATEGORIES[kind].map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</NativeSelect>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="finance-description">Keterangan</Label>
							<Input
								id="finance-description"
								value={description}
								maxLength={200}
								placeholder="Mis. bayar VPS November"
								onChange={(event) => setDescription(event.currentTarget.value)}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<div className="grid gap-1.5">
								<Label htmlFor="finance-amount">Nominal</Label>
								<InputGroup>
									<InputGroupAddon align="inline-start">
										<InputGroupText className="text-xs text-ink-3">Rp</InputGroupText>
									</InputGroupAddon>
									<InputGroupInput
										id="finance-amount"
										inputMode="numeric"
										className="tabular-nums"
										value={amount}
										placeholder="0"
										onChange={(event) => setAmount(event.currentTarget.value.replace(/\D/g, ""))}
									/>
								</InputGroup>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="finance-date">Tanggal</Label>
								<Input
									id="finance-date"
									type="date"
									value={occurredAt}
									onChange={(event) => setOccurredAt(event.currentTarget.value)}
								/>
							</div>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="finance-note">Catatan (opsional)</Label>
							<Input
								id="finance-note"
								value={note}
								maxLength={300}
								placeholder="Nomor nota, nama pembeli, atau tautan bukti"
								onChange={(event) => setNote(event.currentTarget.value)}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setOpen(false)}>
							Batal
						</Button>
						<Button variant="primary" onClick={() => void submit()} disabled={create.isPending}>
							{create.isPending ? "Menyimpan…" : "Simpan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function StatCard({
	label,
	value,
	hint,
	icon,
	tone = "neutral",
	loading,
}: {
	label: string;
	value: string;
	hint?: string;
	icon: IconName;
	tone?: "neutral" | "accent" | "warn";
	loading?: boolean;
}) {
	return (
		<div className="rounded-xl border border-line bg-surface p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="text-[11px] font-medium tracking-[0.1em] text-ink-3 uppercase">{label}</p>
				<span
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-lg",
						tone === "accent" && "bg-accent-soft text-accent-text",
						tone === "warn" && "bg-warn-soft text-warn-text",
						tone === "neutral" && "bg-sunken text-ink-2",
					)}
				>
					<Icon name={icon} size={17} />
				</span>
			</div>
			{loading ? (
				<Skeleton className="mt-3 h-7 w-28" />
			) : (
				<p className="mt-2.5 font-display text-2xl leading-none tracking-tight tabular-nums text-ink">{value}</p>
			)}
			{hint ? <p className="mt-2 text-xs leading-4 text-ink-3">{hint}</p> : null}
		</div>
	);
}
