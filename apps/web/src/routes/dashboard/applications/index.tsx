import type { Application } from "@/features/applications/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@reactive-resume/ui/components/tabs";
import { cn } from "@reactive-resume/utils/style";
import {
	AddApplicationDialog,
	type ApplicationStartStage,
} from "@/features/applications/components/add-application-dialog";
import { ApplicationDetailSheet } from "@/features/applications/components/application-detail-sheet";
import { ApplicationFormSheet } from "@/features/applications/components/application-form-sheet";
import { ApplicationBoard } from "@/features/applications/components/board";
import { ApplicationCalendar } from "@/features/applications/components/calendar-view";
import { ExportApplicationsSheet } from "@/features/applications/components/export-applications-sheet";
import { FollowUpDialog } from "@/features/applications/components/follow-up-dialog";
import { ImportApplicationsSheet } from "@/features/applications/components/import-applications-sheet";
import { ApplicationInsights, InsightsSkeleton } from "@/features/applications/components/insights-view";
import { ApplicationList } from "@/features/applications/components/list-view";
import { getNextStep } from "@/features/applications/next-step";
import { applicationsListQueryOptions } from "@/features/applications/queries";
import { ENTER_CLASS } from "@/libs/motion";

const VIEWS = ["list", "board", "insights", "calendar"] as const;
type View = (typeof VIEWS)[number];

const searchSchema = z.object({
	q: z.string().default("").catch(""),
	view: z.enum(VIEWS).default("list").catch("list"),
	closed: z.boolean().default(false).catch(false),
	// Lowongan yang disimpan tapi belum dilamar disembunyikan sampai diminta.
	saved: z.boolean().default(false).catch(false),
	// Deep links: open Add, or one application.
	create: z.boolean().default(false).catch(false),
	applicationId: z.string().optional().catch(undefined),
});
type Search = z.output<typeof searchSchema>;
const defaultSearch: Search = { q: "", view: "list", closed: false, saved: false, create: false };

export const Route = createFileRoute("/dashboard/applications/")({
	component: RouteComponent,
	validateSearch: searchSchema,
	search: { middlewares: [stripSearchParams(defaultSearch)] },
});

/** Search reads role, company, location, contacts and tags. */
function matches(application: Application, query: string) {
	if (!query) return true;
	const haystack = [
		application.role,
		application.company,
		application.location ?? "",
		...application.contacts.map((contact) => contact.name),
		...application.tags,
	]
		.join(" ")
		.toLowerCase();
	return haystack.includes(query);
}

function RouteComponent() {
	const { q, view, closed, saved, create, applicationId } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	// Typing filters at once; the URL only seeds the search.
	const [query, setQuery] = useState(q);
	const [adding, setAdding] = useState(false);
	const [addingStage, setAddingStage] = useState<ApplicationStartStage>("applied");
	const [importing, setImporting] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [editing, setEditing] = useState<Application | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	// Views animate in only after a switch, never on the page's first render.
	const [viewSwitched, setViewSwitched] = useState(false);

	const { data: applications, isPending, isError, isFetching, refetch } = useQuery(applicationsListQueryOptions());
	const setSearch = (patch: Partial<Search>) =>
		void navigate({ resetScroll: false, search: (prev: Search) => ({ ...prev, ...patch }) });
	const openAdd = (stage: ApplicationStartStage) => {
		setAddingStage(stage);
		setAdding(true);
	};

	useEffect(() => {
		if (!create) return;
		// oxlint-disable-next-line react/set-state-in-effect -- takes the one-shot ?create flag from the address, then clears it
		setAddingStage("applied");
		setAdding(true);
		void navigate({ replace: true, resetScroll: false, search: (prev: Search) => ({ ...prev, create: false }) });
	}, [create, navigate]);

	useEffect(() => {
		if (!applicationId || !applications) return;
		// oxlint-disable-next-line react/set-state-in-effect -- takes the one-shot ?applicationId from the address, then clears it
		setSelectedId(applicationId);
		void navigate({
			replace: true,
			resetScroll: false,
			search: (prev: Search) => ({ ...prev, applicationId: undefined }),
		});
	}, [applicationId, applications, navigate]);

	const text = query.trim().toLowerCase();
	const savedCount = (applications ?? []).filter((application) => application.status === "saved").length;
	// Yang belum dilamar bukan lamaran. Sembunyikan dulu, tampilkan lewat tombol di toolbar.
	const visible = (applications ?? []).filter((application) => saved || application.status !== "saved");
	const filtered = visible.filter((application) => matches(application, text));
	const selected = applications?.find((application) => application.id === selectedId) ?? null;
	// Phones keep all four views; the board scrolls sideways and the calendar stacks.
	const shown: View = view;
	const empty = !!applications && applications.length === 0;
	const noMatches = !!applications && !empty && text && filtered.length === 0;
	const allHidden = !!applications && !empty && !text && !saved && savedCount > 0 && filtered.length === 0;

	return (
		<div className="mx-auto grid w-full max-w-[1180px] content-start gap-5 px-8 py-8 max-sm:px-4 max-sm:py-5 max-sm:pb-28">
			<header className="flex min-w-0 items-center justify-between gap-3">
				<h1 className="min-w-0 truncate font-display text-[26px] leading-8 font-medium sm:text-[30px] sm:leading-9">
					<Trans>Applications</Trans>
				</h1>
				<div className="flex shrink-0 items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button variant="secondary" aria-label={t`Import or export CSV`} />}>
							<Icon name="file-text" />
							<span className="max-sm:hidden">CSV</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => setImporting(true)}>
								<Trans>Import from CSV…</Trans>
							</DropdownMenuItem>
							<DropdownMenuItem disabled={empty || !applications} onClick={() => setExporting(true)}>
								<Trans>Export to CSV…</Trans>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button className="max-sm:px-3" aria-label={t`Add application`} onClick={() => openAdd("applied")}>
						<Icon name="plus" />
						<span className="max-[360px]:sr-only">
							<Trans>Add application</Trans>
						</span>
					</Button>
				</div>
			</header>

			{applications && <FollowUpNudge applications={applications} />}

			{isError && (
				<div
					role="alert"
					className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4"
				>
					<p className="text-sm text-danger-text">
						<Trans>Couldn't load applications. Try again.</Trans>
					</p>
					<Button variant="secondary" disabled={isFetching} onClick={() => void refetch()}>
						<Trans>Retry</Trans>
					</Button>
				</div>
			)}

			{isError && !applications ? null : empty ? (
				<EmptyState onAdd={openAdd} onImport={() => setImporting(true)} />
			) : (
				<>
					<div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center">
						<Tabs
							value={shown}
							onValueChange={(value) => {
								setViewSwitched(true);
								setSearch({ view: value as View });
							}}
						>
							<TabsList
								aria-label={t`View`}
								className="grid w-full [scrollbar-width:none] grid-cols-4 sm:flex sm:w-auto"
							>
								<TabsTrigger value="list" className="px-2.5">
									<Icon name="rows" size={16} />
									<Trans>List</Trans>
								</TabsTrigger>
								<TabsTrigger value="board" className="px-2.5">
									<Icon name="kanban" size={16} />
									<Trans>Board</Trans>
								</TabsTrigger>
								<TabsTrigger value="insights" className="px-2.5">
									<Icon name="chart-line-up" size={16} />
									<Trans>Insights</Trans>
								</TabsTrigger>
								<TabsTrigger value="calendar" className="px-2.5">
									<Icon name="calendar-dots" size={16} />
									<Trans>Calendar</Trans>
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<div className="relative min-w-0 sm:max-w-72">
							<Icon
								name="magnifying-glass"
								size={18}
								className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-3"
							/>
							<Input
								type="search"
								aria-label={t`Search applications`}
								placeholder={t`Search role, company or contact`}
								value={query}
								className="ps-8"
								onChange={(event) => setQuery(event.target.value)}
							/>
						</div>

						<div className="flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto pb-0.5 sm:contents">
							{savedCount > 0 && (
								<Button
									variant="secondary"
									aria-pressed={saved}
									onClick={() => setSearch({ saved: !saved })}
									className={cn("shrink-0", saved && "bg-sunken")}
								>
									<Icon name={saved ? "check-square" : "square"} size={18} />
									<Trans>Saved jobs</Trans>
									<span className="font-mono text-xs text-ink-3">{savedCount}</span>
								</Button>
							)}

							{shown !== "insights" && (
								<Button
									variant="secondary"
									aria-pressed={closed}
									onClick={() => setSearch({ closed: !closed })}
									className={cn("shrink-0", closed && "bg-sunken")}
								>
									<Icon name={closed ? "check-square" : "square"} size={18} />
									<Trans>Show closed</Trans>
								</Button>
							)}
						</div>
					</div>

					<p className="text-xs leading-[18px] text-ink-3">
						{shown === "list" ? (
							<Trans>Track each application and see what needs attention next.</Trans>
						) : shown === "board" ? (
							<Trans>Drag a card to move an application through the stages.</Trans>
						) : shown === "insights" ? (
							<Trans>Where applications stall, and how quickly companies reply.</Trans>
						) : (
							<Trans>Interviews and follow-ups by date.</Trans>
						)}
					</p>

					{isPending ? (
						<ViewSkeleton view={shown} />
					) : allHidden ? (
						<div className="grid justify-items-center gap-2 py-16 text-center">
							<p className="text-sm font-medium">
								<Trans>Saved jobs are hidden from this list.</Trans>
							</p>
							<Button size="sm" variant="secondary" onClick={() => setSearch({ saved: true })}>
								<Trans>Show saved jobs</Trans>
							</Button>
						</div>
					) : noMatches ? (
						<div className="grid justify-items-center gap-2 py-16 text-center">
							<p className="text-sm font-medium">
								<Trans>No applications match “{query.trim()}”.</Trans>
							</p>
							<Button size="sm" variant="secondary" onClick={() => setQuery("")}>
								<Trans>Clear search</Trans>
							</Button>
						</div>
					) : (
						<div
							key={shown}
							className={cn(
								viewSwitched
									? "transition-[opacity,translate] duration-standard ease-enter starting:translate-y-1 starting:opacity-0"
									: // The list fades in on its first appearance, after its skeleton.
										shown === "list" && "transition-opacity duration-standard ease-enter starting:opacity-0",
							)}
						>
							{shown === "list" && (
								<ApplicationList
									applications={filtered}
									showClosed={closed}
									selectedId={selectedId}
									onOpen={(application) => setSelectedId(application.id)}
								/>
							)}
							{shown === "board" && (
								<div className="h-[calc(100svh-230px)] min-h-96">
									<ApplicationBoard
										applications={filtered}
										showClosed={closed}
										onOpen={(application) => setSelectedId(application.id)}
									/>
								</div>
							)}
							{shown === "insights" && <ApplicationInsights applications={applications ?? []} />}
							{shown === "calendar" && (
								<ApplicationCalendar
									applications={filtered.filter((application) => closed || application.status !== "closed")}
									allApplications={applications ?? []}
									onOpen={(application) => setSelectedId(application.id)}
								/>
							)}
						</div>
					)}
				</>
			)}

			<AddApplicationDialog open={adding} onOpenChange={setAdding} onAdded={setSelectedId} initialStage={addingStage} />
			<ApplicationFormSheet
				open={Boolean(editing)}
				application={editing}
				onOpenChange={(open) => !open && setEditing(null)}
			/>
			<ImportApplicationsSheet open={importing} onOpenChange={setImporting} />
			<ExportApplicationsSheet
				open={exporting}
				onOpenChange={setExporting}
				applications={applications ?? []}
				filtered={filtered.filter((application) => closed || application.status !== "closed")}
			/>
			<ApplicationDetailSheet
				application={selected}
				onOpenChange={(open) => !open && setSelectedId(null)}
				onEditDetails={(application) => {
					setSelectedId(null);
					setEditing(application);
				}}
			/>
		</div>
	);
}

const NUDGE_STORAGE_KEY = "applications-follow-up-dismissed";

function readDismissed(): string[] {
	try {
		return JSON.parse(window.localStorage.getItem(NUDGE_STORAGE_KEY) ?? "[]") as string[];
	} catch {
		return [];
	}
}

/**
 * The follow-up nudge: the application waiting longest without a reply (10+ days since applying). Dismissing it is
 * remembered on this device; it doesn't come back for that application.
 */
function FollowUpNudge({ applications }: { applications: Application[] }) {
	const [dismissed, setDismissed] = useState(readDismissed);
	const [drafting, setDrafting] = useState<Application | null>(null);

	const dismissedIds = new Set(dismissed);
	const waiting = applications
		.filter((application) => !dismissedIds.has(application.id))
		.flatMap((application) => {
			const step = getNextStep(application);
			return step.kind === "no-reply" ? [{ application, days: step.days }] : [];
		})
		.sort((a, b) => b.days - a.days)[0];
	if (!waiting) return null;

	const dismiss = () => {
		const next = [...dismissed, waiting.application.id].slice(-200);
		setDismissed(next);
		try {
			window.localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(next));
		} catch {
			// Without storage the nudge is dismissed for this visit only.
		}
	};

	const { company } = waiting.application;
	const { days } = waiting;

	return (
		<>
			<div
				key={waiting.application.id}
				role="status"
				className={cn(
					ENTER_CLASS,
					"flex flex-wrap items-center gap-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn-text",
				)}
			>
				<Icon name="clock" size={20} />
				<span className="min-w-0 flex-1">
					<Trans>
						{company}: no reply for {days} days. A short follow-up is usually fine now.
					</Trans>
				</span>
				<Button size="sm" variant="secondary" onClick={() => setDrafting(waiting.application)}>
					<Icon name="sparkle" size={16} />
					<Trans>Write a follow-up</Trans>
				</Button>
				<Button size="icon-sm" variant="ghost" aria-label={t`Dismiss`} onClick={dismiss} className="text-warn-text">
					<Icon name="x" size={18} />
				</Button>
			</div>
			{drafting && <FollowUpDialog application={drafting} onOpenChange={(open) => !open && setDrafting(null)} />}
		</>
	);
}

function EmptyState({ onAdd, onImport }: { onAdd: (stage: ApplicationStartStage) => void; onImport: () => void }) {
	return (
		<div className="grid justify-items-center gap-3 py-20 text-center transition-[opacity,translate] duration-emphasized ease-enter starting:translate-y-2 starting:opacity-0">
			<span className="grid size-12 place-items-center rounded-xl bg-sunken text-ink-2">
				<Icon name="briefcase" size={26} />
			</span>
			<h2 className="text-lg font-semibold">
				<Trans>Track your first application</Trans>
			</h2>
			<p className="max-w-md text-sm text-ink-2">
				<Trans>
					Already applied? Record it here. Still looking? Save the job first, then mark it applied when you send your
					application.
				</Trans>
			</p>
			<ol className="grid max-w-md gap-1.5 text-left text-[13px] text-ink-2">
				<li>
					1. <Trans>Save a job or record one you already applied to.</Trans>
				</li>
				<li>
					2. <Trans>Attach the resume and cover letter you sent.</Trans>
				</li>
				<li>
					3. <Trans>Update the stage when the company replies.</Trans>
				</li>
			</ol>
			<div className="flex flex-wrap justify-center gap-2">
				<Button onClick={() => onAdd("applied")}>
					<Icon name="plus" />
					<Trans>Record an application</Trans>
				</Button>
			</div>
			<Button variant="link" size="sm" onClick={onImport} className="text-xs text-ink-3">
				<Trans>Import from CSV</Trans>
			</Button>
		</div>
	);
}

/** Each view's shape while applications load, so the first rows land where the placeholders were. */
function ViewSkeleton({ view }: { view: View }) {
	if (view === "insights") return <InsightsSkeleton />;
	if (view === "list")
		return (
			<div className="grid gap-2 pt-10">
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className="h-[52px]" />
				))}
			</div>
		);
	return <Skeleton className="h-[calc(100svh-230px)] min-h-96 rounded-xl" />;
}
