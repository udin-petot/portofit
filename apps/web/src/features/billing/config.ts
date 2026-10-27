/** Pengaturan halaman harga dan pembayaran manual. Ganti dua nilai di bawah dengan data asli PortoFit. */
export const QRIS_IMAGE_PATH = "/qris-portofit.png";
export const WHATSAPP_NUMBER = "6281939948769";

export const formatRupiah = (amount: number) =>
	new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export const ORDER_STATUS_LABEL: Record<string, string> = {
	menunggu_bayar: "Menunggu pembayaran",
	menunggu_verifikasi: "Menunggu verifikasi",
	lunas: "Lunas",
	ditolak: "Ditolak",
};

export const ORDER_STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
	menunggu_bayar: "neutral",
	menunggu_verifikasi: "warning",
	lunas: "success",
	ditolak: "danger",
};

export const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
