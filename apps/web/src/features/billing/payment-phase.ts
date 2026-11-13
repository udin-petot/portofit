/** Keadaan yang mungkin tampil di popup pembayaran. */
export type PaymentPhase =
	| "menyiapkan"
	| "menunggu"
	| "mengunggah"
	| "menunggu_dicek"
	| "lunas"
	| "kedaluwarsa"
	| "ditolak"
	| "galat";

type PaymentPhaseInput = {
	status?: string | undefined;
	expiresAt?: Date | null | undefined;
	now: Date;
	isPending: boolean;
	statusErrors: number;
};

/**
 * Keadaan akhir menang atas galat jaringan, karena status yang sudah terbaca tidak boleh
 * tertutup oleh percobaan polling berikutnya yang gagal.
 */
export function paymentPhase({ status, expiresAt, now, isPending, statusErrors }: PaymentPhaseInput): PaymentPhase {
	if (status === "lunas") return "lunas";
	if (status === "hangus") return "kedaluwarsa";
	if (status === "ditolak") return "ditolak";
	if (status === "menunggu_verifikasi") return "menunggu_dicek";
	if (statusErrors >= 3) return "galat";
	if (!status) return "menyiapkan";
	if (isPending) return "mengunggah";
	if (status === "menunggu_bayar") return expiresAt && now.getTime() >= expiresAt.getTime() ? "kedaluwarsa" : "menunggu";
	return "menunggu";
}
