/** Pengaturan halaman harga dan pembayaran manual. Ganti dua nilai di bawah dengan data asli PortoFit. */
export const QRIS_IMAGE_PATH = "/qris-portofit.png";
import { SUPPORT_WHATSAPP_NUMBER } from "@reactive-resume/utils/support-faq";

export const WHATSAPP_NUMBER = SUPPORT_WHATSAPP_NUMBER;

export const formatRupiah = (amount: number) =>
	new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export const ORDER_STATUS_LABEL: Record<string, string> = {
	menunggu_bayar: "Menunggu pembayaran",
	menunggu_verifikasi: "Menunggu verifikasi",
	lunas: "Lunas",
	ditolak: "Ditolak",
	hangus: "Hangus",
};

export const ORDER_STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
	menunggu_bayar: "warning",
	menunggu_verifikasi: "warning",
	lunas: "success",
	ditolak: "danger",
	hangus: "danger",
};

export const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** Bukti bayar adalah foto atau tangkapan layar, jadi hanya JPG dan PNG yang diterima. Batasnya sama dengan endpoint unggah. */
export const PROOF_ACCEPT = "image/jpeg,image/png";
export const MAX_PROOF_BYTES = 10 * 1024 * 1024;
