import { extname } from "node:path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png"]);

export const MAX_PROOF_BYTES = 10 * 1024 * 1024;

function looksLikeJpeg(head: Uint8Array): boolean {
	return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
}

function looksLikePng(head: Uint8Array): boolean {
	return head.length >= 4 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
}

export type ProofCandidate = {
	userId: string;
	path: string;
	object: { contentType?: string | undefined; size: number; head: Uint8Array } | null;
};

/**
 * Payment proof is a screenshot or photo, nothing else. A bank transfer receipt is read by an admin on a phone,
 * and a PDF attachment is the wrong shape for that, so the extension, the declared type, and the magic bytes must
 * all agree on JPEG or PNG. Returns the message to show, or null when the file is acceptable.
 */
export function proofRejection(input: ProofCandidate): string | null {
	const path = input.path.trim().replace(/^\/+/, "");

	if (!path.startsWith(`uploads/${input.userId}/`)) return "Berkas bukti bukan milik akun ini.";
	if (!ALLOWED_EXTENSIONS.has(extname(path).toLowerCase())) return "Bukti harus berupa gambar JPG atau PNG.";

	if (!input.object) return "Berkas bukti tidak ditemukan. Unggah ulang fotonya.";
	if (input.object.size > MAX_PROOF_BYTES) return "Bukti lebih dari 10 MB. Kecilkan fotonya dulu.";

	if (input.object.contentType && !ALLOWED_CONTENT_TYPES.has(input.object.contentType)) {
		return "Bukti harus berupa gambar JPG atau PNG.";
	}

	if (!looksLikeJpeg(input.object.head) && !looksLikePng(input.object.head)) {
		return "Isi berkas bukan gambar JPG atau PNG.";
	}

	return null;
}
