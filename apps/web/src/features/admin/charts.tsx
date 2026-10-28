import { useId, useState } from "react";
import { cn } from "@reactive-resume/utils/style";

const MONTH_SHORT = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" });

function labelForDate(value: string) {
	const date = new Date(`${value}T00:00:00Z`);
	return Number.isNaN(date.getTime()) ? value : MONTH_SHORT.format(date);
}

function niceMax(value: number) {
	if (!Number.isFinite(value) || value <= 0) return 1;
	const magnitude = 10 ** Math.floor(Math.log10(value));
	const normalized = value / magnitude;
	const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
	return step * magnitude;
}

/**
 * A 30-day revenue line with a soft area under it. Hovering shows the day's value; the same numbers are
 * repeated in the table view, so the chart is decoration over data that is readable without it.
 */
export function RevenueChart({
	data,
	formatValue,
	formatAxis,
	height = 208,
	className,
}: {
	data: Array<{ date: string; value: number }>;
	formatValue: (value: number) => string;
	formatAxis: (value: number) => string;
	height?: number;
	className?: string;
}) {
	const gradientId = useId().replace(/:/g, "");
	const [hover, setHover] = useState<number | null>(null);

	const count = data.length;
	if (count === 0) {
		return <div className="flex h-[208px] items-center justify-center text-xs text-ink-3">Belum ada data untuk rentang ini.</div>;
	}

	const width = 720;
	const padding = { top: 18, right: 16, bottom: 24, left: 44 };
	const plotWidth = width - padding.left - padding.right;
	const plotHeight = height - padding.top - padding.bottom;
	const max = niceMax(Math.max(...data.map((point) => point.value), 1));

	const x = (index: number) => padding.left + (count <= 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth);
	const y = (value: number) => padding.top + (1 - value / max) * plotHeight;

	const line = data.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`).join(" ");
	const area = `${line} L ${x(count - 1).toFixed(2)} ${(padding.top + plotHeight).toFixed(2)} L ${x(0).toFixed(2)} ${(padding.top + plotHeight).toFixed(2)} Z`;

	const gridValues = [0, 0.5, 1].map((ratio) => max * ratio);
	const tickIndexes = count <= 1 ? [0] : [0, Math.floor((count - 1) / 2), count - 1];
	const hovered = hover !== null ? data[hover] : null;
	const tooltipWidth = 148;
	const tooltipX = hover !== null ? Math.min(Math.max(x(hover) - tooltipWidth / 2, 2), width - tooltipWidth - 2) : 0;

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			className={cn("w-full", className)}
			role="img"
			aria-label={`Pendapatan harian, ${count} hari terakhir. Total ${formatValue(data.reduce((sum, point) => sum + point.value, 0))}.`}
			onMouseLeave={() => setHover(null)}
			onMouseMove={(event) => {
				const bounds = event.currentTarget.getBoundingClientRect();
				const pointer = ((event.clientX - bounds.left) / bounds.width) * width;
				const ratio = (pointer - padding.left) / plotWidth;
				const index = Math.round(ratio * Math.max(count - 1, 1));
				setHover(Math.max(0, Math.min(count - 1, index)));
			}}
		>
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
					<stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
				</linearGradient>
			</defs>

			{gridValues.map((value) => (
				<g key={value}>
					<line
						x1={padding.left}
						x2={width - padding.right}
						y1={y(value)}
						y2={y(value)}
						stroke="var(--line)"
						strokeWidth={1}
						strokeDasharray={value === 0 ? undefined : "3 4"}
					/>
					<text x={padding.left - 8} y={y(value) + 3} textAnchor="end" fontSize={10} fill="var(--ink-3)">
						{formatAxis(value)}
					</text>
				</g>
			))}

			<path d={area} fill={`url(#${gradientId})`} />
			<path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
			<circle cx={x(count - 1)} cy={y(data[count - 1]?.value ?? 0)} r={3} fill="var(--accent)" />

			{tickIndexes.map((index) => (
				<text
					key={index}
					x={x(index)}
					y={height - 6}
					textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
					fontSize={10}
					fill="var(--ink-3)"
				>
					{labelForDate(data[index]?.date ?? "")}
				</text>
			))}

			{hover !== null && hovered ? (
				<g pointerEvents="none">
					<line
						x1={x(hover)}
						x2={x(hover)}
						y1={padding.top}
						y2={padding.top + plotHeight}
						stroke="var(--line-2)"
						strokeWidth={1}
						strokeDasharray="3 3"
					/>
					<circle cx={x(hover)} cy={y(hovered.value)} r={3.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
					<g>
						<rect
							x={tooltipX}
							y={4}
							width={tooltipWidth}
							height={38}
							rx={8}
							fill="var(--raised)"
							stroke="var(--line)"
						/>
						<text x={tooltipX + 10} y={19} fontSize={10} fill="var(--ink-3)">
							{labelForDate(hovered.date)}
						</text>
						<text x={tooltipX + 10} y={33} fontSize={12} fontWeight={600} fill="var(--ink)">
							{formatValue(hovered.value)}
						</text>
					</g>
				</g>
			) : null}
		</svg>
	);
}

/** Daily signups as slim bars; enough to see the shape without a second axis. */
export function SignupBars({ data, height = 96 }: { data: Array<{ date: string; value: number }>; height?: number }) {
	const width = 720;
	const padding = { top: 6, right: 2, bottom: 6, left: 2 };
	const plotWidth = width - padding.left - padding.right;
	const plotHeight = height - padding.top - padding.bottom;
	const max = Math.max(...data.map((point) => point.value), 1);
	const slot = plotWidth / Math.max(data.length, 1);
	const barWidth = Math.max(slot * 0.55, 2);

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			className="w-full"
			role="img"
			aria-label={`Pendaftaran pengguna harian: ${data.map((point) => `${labelForDate(point.date)} ${point.value}`).join(", ")}.`}
		>
			{data.map((point, index) => {
				const barHeight = point.value > 0 ? Math.max((point.value / max) * plotHeight, 3) : 1;
				return (
					<rect
						key={point.date}
						x={padding.left + index * slot + (slot - barWidth) / 2}
						y={padding.top + plotHeight - barHeight}
						width={barWidth}
						height={barHeight}
						rx={barWidth > 4 ? 2 : 1}
						fill={point.value > 0 ? "var(--accent)" : "var(--line)"}
						opacity={point.value > 0 ? 0.75 : 1}
					/>
				);
			})}
		</svg>
	);
}

export type DonutSegment = { key: string; label: string; value: number; color: string };

/** Order status mix. The center carries the total; the legend carries every number. */
export function StatusDonut({ segments, caption }: { segments: DonutSegment[]; caption: string }) {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0);
	const radius = 54;
	const circumference = 2 * Math.PI * radius;
	let offset = 0;

	return (
		<div className="flex flex-col items-center gap-4">
			<svg viewBox="0 0 140 140" className="size-[132px] shrink-0" role="img" aria-label={`${caption}: ${total} pesanan.`}>
				<circle cx={70} cy={70} r={radius} fill="none" stroke="var(--sunken)" strokeWidth={14} />
				{total > 0
					? segments.map((segment) => {
							if (segment.value <= 0) return null;
							const length = (segment.value / total) * circumference;
							const dash = `${Math.max(length - 1.5, 0)} ${circumference - Math.max(length - 1.5, 0)}`;
							const element = (
								<circle
									key={segment.key}
									cx={70}
									cy={70}
									r={radius}
									fill="none"
									stroke={segment.color}
									strokeWidth={14}
									strokeDasharray={dash}
									strokeDashoffset={-offset}
									strokeLinecap="round"
									transform="rotate(-90 70 70)"
								/>
							);
							offset += length;
							return element;
						})
					: null}
				<text x={70} y={66} textAnchor="middle" fontSize={20} fontWeight={600} fill="var(--ink)">
					{total}
				</text>
				<text x={70} y={84} textAnchor="middle" fontSize={9} fill="var(--ink-3)">
					pesanan
				</text>
			</svg>

			<ul className="grid w-full gap-2">
				{segments.map((segment) => (
					<li key={segment.key} className="flex items-center justify-between gap-2 text-xs">
						<span className="flex min-w-0 items-start gap-2">
							<span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: segment.color }} aria-hidden="true" />
							<span className="text-ink-2">{segment.label}</span>
						</span>
						<span className="shrink-0 tabular-nums text-ink">
							{segment.value}
							<span className="ms-1 text-ink-3">{total > 0 ? `${Math.round((segment.value / total) * 100)}%` : "0%"}</span>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/** Tiny trend line for a stat card; no axes, no labels, purely shape. */
export function Sparkline({ values, height = 30 }: { values: number[]; height?: number }) {
	const width = 96;
	const max = Math.max(...values, 1);
	const min = Math.min(...values, 0);
	const span = max - min || 1;
	const points = values.map((value, index) => {
		const x = (index / Math.max(values.length - 1, 1)) * width;
		const y = height - ((value - min) / span) * (height - 4) - 2;
		return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
	});

	return (
		<svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-24" aria-hidden="true">
			<path d={points.join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
