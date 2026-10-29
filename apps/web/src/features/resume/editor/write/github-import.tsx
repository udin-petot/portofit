import type { ReactNode } from "react";
import type { RouterOutput } from "@/libs/orpc/client";
import type { WriteSection } from "./model";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { authClient } from "@/libs/auth/client";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { addEntriesTo } from "./actions";
import { projectEntriesFromRepos } from "./github-project";

type Repo = RouterOutput["github"]["repos"]["repos"][number];

const MAX_SELECTION = 5;

const pushedFormat = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Pick public GitHub repos to turn into project entries. The dialog only lists what GitHub returned; the
 * caller turns the selection into resume entries, and the user can still edit every field afterwards.
 */
export function GithubImportDialog({
	open,
	onOpenChange,
	onImport,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImport: (repos: Repo[]) => void;
}) {
	const [selected, setSelected] = useState<number[]>([]);
	const [showForks, setShowForks] = useState(false);

	const query = useQuery({
		...orpc.github.repos.queryOptions({ input: {} }),
		enabled: open,
		retry: false,
	});

	const repos = query.data?.repos ?? [];
	const visible = repos.filter((repo) => showForks || !repo.fork);
	const selectedRepos = repos.filter((repo) => selected.includes(repo.id));
	const full = selected.length >= MAX_SELECTION;
	const errorCode =
		query.error && typeof query.error === "object" && "data" in query.error
			? ((query.error as { data?: { code?: string } }).data?.code ?? null)
			: null;
	const needsGithub = errorCode === "GITHUB_NOT_CONNECTED" || errorCode === "GITHUB_TOKEN_INVALID";

	const toggle = (id: number) => {
		setSelected((previous) => {
			if (previous.includes(id)) return previous.filter((value) => value !== id);
			if (previous.length >= MAX_SELECTION) return previous;
			return [...previous, id];
		});
	};

	const close = () => {
		setSelected([]);
		setShowForks(false);
		onOpenChange(false);
	};

	const connect = async () => {
		const { error } = await authClient.linkSocial({ provider: "github", callbackURL: window.location.href });
		if (error) toast.add({ type: "error", description: error.message ?? "GitHub gagal dihubungkan." });
	};

	const submit = () => {
		if (selectedRepos.length === 0) return;
		onImport(selectedRepos);
		close();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) close();
			}}
		>
			<DialogContent className="sm:max-w-[620px]">
				<DialogHeader>
					<DialogTitle>Impor dari GitHub</DialogTitle>
					<DialogDescription>
						Pilih sampai {MAX_SELECTION} repo publik. Poin ditulis dari data repo (deskripsi, bahasa, bintang,
						tanggal dorongan) dan bisa kamu sunting setelah ditambahkan.
					</DialogDescription>
				</DialogHeader>

				{needsGithub ? (
					<div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-sunken p-4">
						<p className="text-sm text-ink">Akun GitHub belum terhubung.</p>
						<p className="text-xs leading-5 text-ink-3">
							PortoFit membaca repo lewat izin akunmu sendiri, bukan token bersama. Hubungkan sekali, lalu impor
							kapan saja.
						</p>
						<Button size="sm" onClick={() => void connect()}>
							<Icon name="github" size={15} />
							Hubungkan GitHub
						</Button>
					</div>
				) : query.isLoading ? (
					<div className="grid gap-2">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				) : query.isError ? (
					<div className="rounded-xl border border-line bg-sunken p-4">
						<p className="text-sm text-ink">Repo tidak bisa dimuat.</p>
						<p className="mt-1 text-xs text-ink-3">
							{getOrpcErrorMessage(query.error, { fallback: "Coba lagi sebentar lagi." })}
						</p>
						<Button size="sm" variant="secondary" className="mt-3" onClick={() => void query.refetch()}>
							Coba lagi
						</Button>
					</div>
				) : repos.length === 0 ? (
					<div className="rounded-xl border border-line bg-sunken p-4 text-sm text-ink-2">
						Tidak ada repo publik di akun ini.
					</div>
				) : (
					<>
						<div className="flex items-center justify-between gap-2 text-xs text-ink-3">
							<span>
								{query.data?.login ? `Akun ${query.data.login} · ` : ""}
								{repos.length} repo publik
							</span>
							<button
								type="button"
								onClick={() => setShowForks((value) => !value)}
								className="rounded-full px-2 py-1 transition-colors hover:bg-sunken hover:text-ink"
							>
								{showForks ? "Sembunyikan fork" : "Tampilkan fork"}
							</button>
						</div>

						<ul className="-mx-1 max-h-[46vh] overflow-y-auto px-1">
							{visible.map((repo) => {
								const checked = selected.includes(repo.id);
								const disabled = !checked && full;
								return (
									<li key={repo.id}>
										<button
											type="button"
											aria-pressed={checked}
											disabled={disabled}
											onClick={() => toggle(repo.id)}
											className={cn(
												"flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
												checked ? "border-accent bg-accent-soft/40" : "border-transparent hover:bg-sunken",
												disabled && "cursor-not-allowed opacity-50",
											)}
										>
											<span
												className={cn(
													"mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
													checked ? "border-accent bg-accent text-on-accent" : "border-line-2",
												)}
												aria-hidden="true"
											>
												{checked ? <Icon name="check" size={12} /> : null}
											</span>
											<span className="min-w-0 flex-1">
												<span className="flex flex-wrap items-center gap-1.5">
													<span className="truncate text-sm font-medium text-ink">{repo.name}</span>
													{repo.fork ? <span className="text-[11px] text-ink-3">fork</span> : null}
													{repo.archived ? <span className="text-[11px] text-ink-3">arsip</span> : null}
												</span>
												{repo.description ? (
													<span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-2">
														{repo.description}
													</span>
												) : null}
												<span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-3">
													{repo.language ? <span>{repo.language}</span> : null}
													<span>{repo.stars} bintang</span>
													<span>dorongan {pushedFormat.format(new Date(repo.pushedAt))}</span>
												</span>
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					</>
				)}

				<DialogFooter>
					<Button variant="secondary" onClick={close}>
						Batal
					</Button>
					<Button disabled={selectedRepos.length === 0} onClick={submit}>
						Tambahkan {selectedRepos.length > 0 ? `${selectedRepos.length} proyek` : "proyek"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


/** A plain button that opens the GitHub picker. Used beside "Add project", where the feature is easier to find. */
export function GithubImportButton({
	section,
	className,
	children,
}: {
	section: WriteSection;
	className?: string;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button type="button" onClick={() => setOpen(true)} className={className}>
				{children}
			</button>
			<GithubImportDialog
				open={open}
				onOpenChange={setOpen}
				onImport={(repos) => {
					addEntriesTo(section, projectEntriesFromRepos(repos));
					toast.add({ type: "success", description: `${repos.length} proyek ditambahkan dari GitHub.` });
				}}
			/>
		</>
	);
}
