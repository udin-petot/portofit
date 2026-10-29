import type { Application } from "../types";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Spinner } from "@reactive-resume/ui/components/spinner";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { toast } from "@reactive-resume/ui/components/toast";
import { applicationsListQueryKey } from "../queries";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { client } from "@/libs/orpc/client";

type Props = {
	application: Pick<Application, "id" | "company" | "role">;
	onOpenChange: (open: boolean) => void;
};

/**
 * Draft a short follow-up for a quiet application. The model sees only the saved posting and resume; the user edits
 * the text and sends it themselves. Marking it done clears the nudge, not the record.
 */
export function FollowUpDialog({ application, onOpenChange }: Props) {
	const queryClient = useQueryClient();
	const [edited, setEdited] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const draft = useQuery({
		queryKey: ["follow-up-draft", application.id],
		queryFn: () => client.applications.ai.draftMessage({ id: application.id, kind: "follow-up" }),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	const text = edited ?? draft.data?.text ?? "";

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			toast.add({ type: "success", description: "Pesan disalin." });
		} catch {
			toast.add({ type: "error", description: "Tidak bisa menyalin. Pilih teksnya manual." });
		}
	};

	const markDone = async () => {
		setSaving(true);
		try {
			await client.applications.update({
				id: application.id,
				followUpAt: new Date(),
				followUpNote: "Pesan susulan dikirim",
			});
			await queryClient.invalidateQueries({ queryKey: applicationsListQueryKey() });
			toast.add({ type: "success", description: "Ditandai sudah ditindaklanjuti." });
			onOpenChange(false);
		} catch (cause) {
			toast.add({
				type: "error",
				description: getOrpcErrorMessage(cause, { fallback: "Gagal menandai. Coba lagi." }),
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[560px]">
				<DialogHeader>
					<DialogTitle>Pesan susulan</DialogTitle>
					<DialogDescription>
						{application.company} · {application.role} — draf dari AI, sunting dulu sebelum dikirim.
					</DialogDescription>
				</DialogHeader>

				{draft.isPending ? (
					<div className="flex items-center gap-2 rounded-lg bg-sunken px-3.5 py-3 text-sm text-ink-2">
						<Spinner /> Menyusun pesan…
					</div>
				) : draft.isError ? (
					<div className="grid gap-2 rounded-lg bg-danger-soft px-3.5 py-3 text-sm text-danger-text">
						<span>{getOrpcErrorMessage(draft.error, { fallback: "Pesan belum bisa dibuat." })}</span>
						<Button size="sm" variant="secondary" className="w-fit" onClick={() => void draft.refetch()}>
							Coba lagi
						</Button>
					</div>
				) : (
					<Textarea
						value={text}
						onChange={(event) => setEdited(event.target.value)}
						className="min-h-40 text-[15px] leading-[23px]"
						maxLength={2000}
						aria-label="Draf pesan susulan"
					/>
				)}

				<DialogFooter className="flex-wrap">
					<Button variant="secondary" onClick={() => void copy()} disabled={!text || draft.isPending}>
						<Icon name="copy" size={16} />
						Salin
					</Button>
					<Button onClick={() => void markDone()} disabled={!text || draft.isPending || saving} loading={saving}>
						Tandai sudah ditindaklanjuti
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
