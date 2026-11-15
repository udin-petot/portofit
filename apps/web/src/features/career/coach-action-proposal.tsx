import { Trans } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { Checkbox } from "@reactive-resume/ui/components/checkbox";
import { Icon } from "@reactive-resume/ui/components/icon";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

const jobSchema = z.object({
	role: z.string(),
	company: z.string(),
	sourceUrl: z.string().nullable().optional(),
	location: z.string().nullable().optional(),
	salary: z.string().nullable().optional(),
	requirements: z.array(z.string()).optional().default([]),
	description: z.string().nullable().optional(),
	reason: z.string().nullable().optional(),
	duplicateApplicationId: z.string().nullable().optional(),
});

export const actionProposalSchema = z.object({
	status: z.literal("proposed"),
	proposalId: z.string(),
	expiresAt: z.string(),
	jobs: z.array(jobSchema),
});

export type ActionProposalOutput = z.infer<typeof actionProposalSchema>;

const hostOf = (url: string | null | undefined) => {
	if (!url) return null;
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
};

/** A server-owned proposal. The card only sends its id; job fields are never trusted from the browser. */
export function CoachActionProposal({ output }: { output: ActionProposalOutput }) {
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<ReadonlySet<string>>(
		() => new Set(output.jobs.flatMap((job, index) => (job.duplicateApplicationId ? [] : [String(index)]))),
	);
	const [done, setDone] = useState<"accepted" | "dismissed" | null>(null);
	const accept = useMutation(orpc.career.acceptActionProposal.mutationOptions());
	const dismiss = useMutation(orpc.career.dismissActionProposal.mutationOptions());
	const selectedJobs = output.jobs.filter((_, index) => selected.has(String(index)));
	const busy = accept.isPending || dismiss.isPending;

	const toggle = (index: number) => {
		const value = String(index);
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return next;
		});
	};

	const submit = async () => {
		try {
			const result = await accept.mutateAsync({ id: output.proposalId });
			setDone("accepted");
			void queryClient.invalidateQueries({ queryKey: orpc.applications.list.key() });
			toast.add({
				type: "success",
				description:
					result.created > 0 ? `${result.created} lowongan disimpan ke lamaran.` : "Lowongan sudah ada di lamaran.",
			});
		} catch (error) {
			toast.add({
				type: "error",
				description: getOrpcErrorMessage(error, { fallback: "Tidak bisa menyimpan lowongan. Coba lagi." }),
			});
		}
	};

	const cancel = async () => {
		try {
			await dismiss.mutateAsync({ id: output.proposalId });
			setDone("dismissed");
		} catch (error) {
			toast.add({
				type: "error",
				description: getOrpcErrorMessage(error, { fallback: "Tidak bisa membatalkan usulan. Coba lagi." }),
			});
		}
	};

	if (done === "dismissed") return null;
	if (done === "accepted")
		return (
			<div className="grid gap-2 rounded-xl border border-line bg-surface p-4">
				<p className="flex items-center gap-2 text-sm font-medium text-accent-text">
					<Icon name="check-circle" size={18} />
					<Trans>Disimpan ke lamaran</Trans>
				</p>
				<Link to="/dashboard/applications" className="text-sm text-accent-text underline underline-offset-2">
					<Trans>Buka lamaran</Trans>
				</Link>
			</div>
		);

	return (
		<section
			aria-labelledby={`proposal-${output.proposalId}`}
			className="grid gap-3 rounded-xl border border-line bg-surface p-4"
		>
			<div className="grid gap-0.5">
				<h3 id={`proposal-${output.proposalId}`} className="text-sm font-semibold text-ink">
					<Trans>Simpan lowongan ini?</Trans>
				</h3>
				<p className="text-xs leading-[17px] text-ink-3">
					<Trans>Pilih yang cocok. Baru setelah kamu menekan Simpan, lowongan masuk ke lamaran.</Trans>
				</p>
			</div>

			<ul className="grid gap-2">
				{output.jobs.map((job, index) => {
					const checked = selected.has(String(index));
					const duplicate = Boolean(job.duplicateApplicationId);
					return (
						<li key={`${job.company}:${job.role}:${index}`}>
							<label
								className={cn(
									"flex cursor-pointer items-start gap-2.5 rounded-lg border border-line-2 p-3 transition-colors",
									checked ? "bg-accent-soft/40" : "bg-bg",
									duplicate && "opacity-70",
								)}
							>
								<Checkbox checked={checked} disabled={duplicate || busy} onCheckedChange={() => toggle(index)} />
								<span className="grid min-w-0 gap-0.5">
									<span className="truncate text-sm font-medium text-ink">{job.role}</span>
									<span className="truncate text-xs text-ink-2">{job.company}</span>
									{job.sourceUrl ? (
										<span className="truncate text-[11px] text-ink-3">{hostOf(job.sourceUrl)}</span>
									) : null}
									{job.reason ? <span className="text-[11px] leading-4 text-ink-3">{job.reason}</span> : null}
									{duplicate ? (
										<span className="text-[11px] font-medium text-warn-text">
											<Trans>Sudah ada di lamaran</Trans>
										</span>
									) : null}
								</span>
							</label>
						</li>
					);
				})}
			</ul>

			<div className="flex flex-wrap items-center justify-end gap-2">
				<Button variant="ghost" size="sm" disabled={busy} onClick={() => void cancel()}>
					<Trans>Batal</Trans>
				</Button>
				<Button size="sm" disabled={busy || selectedJobs.length === 0} onClick={() => void submit()}>
					<Trans>Simpan ke lamaran</Trans>
				</Button>
			</div>
		</section>
	);
}
