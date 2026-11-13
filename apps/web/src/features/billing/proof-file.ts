import { MAX_PROOF_BYTES } from "./config";

/** Masalah berkas bukti yang bisa diketahui sebelum menyentuh jaringan. */
export type ProofFileProblem = "type" | "size";

/**
 * Aturan yang sama dengan server, diperiksa lebih dulu supaya berkas 11 MB tidak dikirim
 * hanya untuk ditolak. Server tetap memeriksa ulang, termasuk magic bytes.
 */
export function proofFileProblem(file: { type: string; size: number }): ProofFileProblem | null {
	if (file.type !== "image/jpeg" && file.type !== "image/png") return "type";
	if (file.size > MAX_PROOF_BYTES) return "size";
	return null;
}
