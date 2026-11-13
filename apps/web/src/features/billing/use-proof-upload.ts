import { t } from "@lingui/core/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@reactive-resume/ui/components/toast";
import { proofFileProblem } from "./proof-file";
import { orpc } from "@/libs/orpc/client";

/**
 * Satu jalur unggah bukti untuk popup pembayaran dan halaman transaksi.
 * Pesan galat sama di kedua tempat, supaya tidak ada dua aturan yang berbeda.
 */
export function useProofUpload(orderId: string | null, note: string) {
	const queryClient = useQueryClient();
	const uploadFile = useMutation(orpc.storage.uploadFile.mutationOptions({ meta: { noInvalidate: true } }));
	const attachProof = useMutation(orpc.billing.attachProof.mutationOptions());
	const [fileName, setFileName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const upload = async (file: File) => {
		if (!orderId) return;

		const problem = proofFileProblem(file);
		if (problem) {
			const message =
				problem === "type" ? t`The proof must be a JPG or PNG. PDF is not accepted.` : t`The proof can be at most 10 MB.`;
			setError(message);
			toast.add({ type: "error", description: message });
			return;
		}

		setError(null);
		setFileName(file.name);
		try {
			const uploaded = await uploadFile.mutateAsync(file);
			await attachProof.mutateAsync({ orderId, proofPath: uploaded.path, note });
			await queryClient.invalidateQueries();
			toast.add({
				type: "success",
				description: t`Proof sent. An admin checks it by hand, then the credits arrive automatically.`,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : t`The proof could not be sent. Try again.`;
			setError(message);
			toast.add({ type: "error", description: message });
		} finally {
			setFileName(null);
		}
	};

	return {
		upload,
		isPending: uploadFile.isPending || attachProof.isPending,
		fileName,
		error,
		reset: () => setError(null),
	};
}
