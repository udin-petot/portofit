import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon, type IconName } from "@reactive-resume/ui/components/icon";
import { SegmentedControl, SegmentedControlItem } from "@reactive-resume/ui/components/segmented-control";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { cn } from "@reactive-resume/utils/style";
import { orpc } from "@/libs/orpc/client";

const RANGES = ["7", "30", "90"] as const;

/** 2026-11-13 menjadi 13 Nov 2026, sama seperti tanggal di grafik admin. */
function formatDay(isoDate: string) {
	const date = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(date.getTime())) return isoDate;
	return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Angka pemakaian fitur. Sengaja tanpa nama akun dan tanpa surel: yang disimpan di basis data hanya
 * nama fitur dan waktunya, jadi halaman ini memang tidak bisa menunjukkan siapa memakai apa.
 */
export function UsagePanel() {
	const [range, setRange] = useState<(typeof RANGES)[number]>("30");
	const days = Number(range);

	const { data, isLoading } = useQuery(orpc.usage.summary.queryOptions({ input: { days } }));

	const features = data?.features ?? [];
	const used = features.filter((feature) => feature.count > 0);
	const busiest = used[0];
	const busiestShare = busiest && data && data.total > 0 ? Math.round((busiest.count / data.total) * 100) : 0;
	const perDay = data && data.daily.length > 0 ? Math.round((data.total / data.daily.length) * 10) / 10 : 0;


	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-display text-lg tracking-tight text-ink">Pemakaian fitur</h2>
					<p className="text-xs text-ink-3">
						Dihitung tanpa nama akun. Satu baris per aksi, disimpan {days} hari terakhir.
					</p>
				</div>
				<SegmentedControl
					aria-label="Rentang hari"
					value={range}
					onValueChange={(value) => setRange(value as (typeof RANGES)[number])}
					className="h-8 rounded-full border border-line bg-surface p-0.5"
				>
					{RANGES.map((option) => (
						<SegmentedControlItem key={option} value={option} className="px-2.5 text-xs">
							{option} hari
						</SegmentedControlItem>
					))}
				</SegmentedControl>
			</div>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan pemakaian">
				<UsageCard label="Total pemakaian" value={String(data?.total ?? 0)} hint="seluruh fitur" icon="chart-line-up" loading={isLoading} />
				<UsageCard
					label="Fitur terpakai"
					value={`${used.length} dari ${features.length}`}
					hint="fitur yang pernah dipakai"
					icon="squares-four"
					loading={isLoading}
				/>
				<UsageCard
					label="Paling sering"
					value={busiest ? busiest.label : "Belum ada"}
					hint={busiest ? `${busiest.count} kali, ${busiestShare} persen` : "belum ada pemakaian"}
					icon="trend-up"
					loading={isLoading}
				/>
				<UsageCard
					label="Rata rata"
					value={String(perDay)}
					hint="per hari yang ada pemakaian"
					icon="calendar-blank"
					loading={isLoading}
				/>
			</section>

			<section className="rounded-xl border border-line bg-surface">
				<header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
					<h3 className="text-sm font-medium text-ink">Per fitur</h3>
					<span className="text-xs text-ink-3">urut dari yang paling sering</span>
				</header>

				{isLoading ? (
					<div className="grid gap-2 p-4">
						{Array.from({ length: 6 }, (_, index) => (
							<Skeleton key={index} className="h-8 w-full" />
						))}
					</div>
				) : used.length === 0 ? (
					<p className="px-4 py-10 text-center text-sm text-ink-3">
						Belum ada pemakaian tercatat pada rentang ini. Angka akan muncul sendiri setelah ada yang memakai fitur.
					</p>
				) : (
					<ul className="divide-y divide-line">
						{used.map((feature) => (
							<li key={feature.feature} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
								<div className="min-w-0">
									<p className="truncate text-sm text-ink">{feature.label}</p>
									<p className="text-[11px] tracking-[0.08em] text-ink-3 uppercase">{feature.group}</p>
								</div>
								<div className="flex items-center gap-3 sm:justify-end">
									<div className="h-1.5 w-32 overflow-hidden rounded-full bg-sunken">
										<div
											className="h-full rounded-full bg-accent"
											// Batang memakai angka yang sama dengan persentase di sebelahnya, bukan skala
											// terhadap fitur tersering, supaya 50 persen tidak tampil sebagai batang penuh.
											style={{ width: `${Math.max(2, Math.round(feature.share * 100))}%` }}
										/>
									</div>
									<span className="w-12 text-end text-sm tabular-nums text-ink">{feature.count}</span>
									<span className="w-12 text-end text-xs tabular-nums text-ink-3">
										{Math.round(feature.share * 100)}%
									</span>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-xl border border-line bg-surface">
				<header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
					<h3 className="text-sm font-medium text-ink">Per hari</h3>
					<span className="text-xs text-ink-3">waktu Jakarta</span>
				</header>
				{isLoading ? (
					<div className="grid gap-2 p-4">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
					</div>
				) : (data?.daily.length ?? 0) === 0 ? (
					<p className="px-4 py-8 text-center text-sm text-ink-3">Belum ada catatan harian.</p>
				) : (
					<ul className="max-h-80 overflow-y-auto divide-y divide-line">
						{[...(data?.daily ?? [])].reverse().map((day) => (
							<li key={day.date} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
								<span className="tabular-nums text-ink-2">{formatDay(day.date)}</span>
								<span className="tabular-nums text-ink">{day.count}</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function UsageCard({
	label,
	value,
	hint,
	icon,
	loading,
}: {
	label: string;
	value: string;
	hint: string;
	icon: IconName;
	loading: boolean;
}) {
	return (
		<div className="rounded-xl border border-line bg-surface p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="text-[11px] font-medium tracking-[0.1em] text-ink-3 uppercase">{label}</p>
				<span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", "bg-sunken text-ink-2")}>
					<Icon name={icon} size={17} />
				</span>
			</div>
			{loading ? (
				<Skeleton className="mt-3 h-7 w-24" />
			) : (
				<p className="mt-2.5 truncate font-display text-2xl leading-none tracking-tight text-ink">{value}</p>
			)}
			<p className="mt-2 text-xs leading-4 text-ink-3">{hint}</p>
		</div>
	);
}
