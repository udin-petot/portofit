import type { Locale } from "@reactive-resume/utils/locale";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@reactive-resume/ui/components/toast";
import { useNewDocumentsStore } from "./new-documents";
import { useDialogStore } from "@/dialogs/store";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { client, orpc } from "@/libs/orpc/client";

/** Start blank, try a sample, or a new letter: each creates the document at once and opens it. */
export function useStartDocument(applicationId?: string) {
	// The cookie the server reads can be missing (a phone that never switched language), and then the sample
	// comes back in English while the app is in Indonesian. Send the language on screen instead.
	const { i18n } = useLingui();
	const locale = i18n.locale as Locale;
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const markNew = useNewDocumentsStore((state) => state.markNew);
	const { mutateAsync: createResume, isPending: creating } = useMutation(orpc.resume.create.mutationOptions());
	const { mutateAsync: createLetter } = useMutation(orpc.coverLetters.create.mutationOptions());

	const created = async (id: string, type: "resume" | "letter") => {
		if (applicationId) await client.documents.linkApplication({ type, id, applicationId });
		markNew(id);
		void queryClient.invalidateQueries({ queryKey: orpc.documents.key() });
		if (applicationId) void queryClient.invalidateQueries({ queryKey: orpc.applications.key() });
		closeDialog();
	};
	const failed = (error: unknown) =>
		toast.add({
			type: "error",
			description: getOrpcErrorMessage(error, { fallback: t`Couldn't create the document.` }),
		});

	return {
		creating,
		startBlank: async () => {
			try {
				const resumeId = await createResume({
					name: t`Untitled resume`,
					tags: [],
					autoName: true,
					withSampleData: false,
					locale,
				});
				await created(resumeId, "resume");
				void navigate({ to: "/builder/$resumeId", params: { resumeId } });
			} catch (error) {
				failed(error);
			}
		},
		trySample: async () => {
			try {
				const resumeId = await createResume({ name: t`Sample resume`, tags: [], withSampleData: true, locale });
				await created(resumeId, "resume");
				toast.add({ description: t`Sample resume added. Delete it anytime.` });
				void navigate({ to: "/builder/$resumeId", params: { resumeId } });
			} catch (error) {
				failed(error);
			}
		},
		newLetter: async () => {
			// A new letter takes its sender details and design from the resume edited most recently.
			const documents = queryClient.getQueryData(orpc.documents.list.queryKey({ input: { trashed: false } }));
			const resume = documents
				?.filter((document) => document.type === "resume")
				.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
			const input = {
				name: t`Untitled letter`,
				recipient: "",
				content: "",
				...(resume ? { resumeId: resume.id } : {}),
			};
			try {
				const letter = await createLetter(input);
				await created(letter.id, "letter");
				void navigate({ to: "/builder/letter/$coverLetterId", params: { coverLetterId: letter.id } });
			} catch (error) {
				failed(error);
			}
		},
	};
}
