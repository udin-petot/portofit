// Sepuluh menit terlalu pendek untuk pembayaran QRIS manual: orang harus pindah ke aplikasi bank,
// membayar, lalu kembali mengunggah bukti. Data 12 November 2026 menunjukkan 8 dari 16 pesanan hangus.
export const PAYMENT_WINDOW_MS = 60 * 60_000;
export const REMINDER_MS = 5 * 60_000;

type ExpiryOrder = { status: string; expiresAt: Date | null };

/** Batas bayar dihitung dari waktu pesanan dibuat, bukan dari waktu lain, supaya bisa diuji. */
export function computeExpiry(createdAt: Date): Date {
	return new Date(createdAt.getTime() + PAYMENT_WINDOW_MS);
}

/** Hanya pesanan yang masih menunggu pembayaran yang bisa hangus. */
export function isExpired(order: ExpiryOrder, now: Date): boolean {
	if (order.status !== "menunggu_bayar" || !order.expiresAt) return false;
	return now.getTime() >= order.expiresAt.getTime();
}

export function msLeft(order: ExpiryOrder, now: Date): number {
	if (!order.expiresAt) return 0;
	return Math.max(0, order.expiresAt.getTime() - now.getTime());
}

/** Pengingat dikirim sekali, saat sisa waktu lima menit atau kurang, hanya untuk yang belum bayar. */
export function shouldRemind(order: ExpiryOrder, now: Date): boolean {
	if (order.status !== "menunggu_bayar" || !order.expiresAt) return false;
	const left = msLeft(order, now);
	return left > 0 && left <= REMINDER_MS;
}

export function canAcceptProof(order: ExpiryOrder, now: Date): boolean {
	return !isExpired(order, now);
}
