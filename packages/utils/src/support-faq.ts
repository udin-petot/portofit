export type SupportTopic = "refund" | "pembayaran" | "kredit" | "akun";

/** Nomor WhatsApp admin. Satu sumber supaya tautan di halaman dan di balasan AI tidak pernah berbeda. */
export const SUPPORT_WHATSAPP_NUMBER = "6281939948769";

export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;

/** Batas pesan per percakapan, termasuk balasan asisten. Dipakai server dan UI supaya angkanya tidak berbeda. */
export const SUPPORT_CONVERSATION_LIMIT = 40;

export type SupportFaq = {
	id: string;
	topic: SupportTopic;
	question: string;
	answer: string;
};

/**
 * Satu sumber untuk halaman bantuan dan prompt CS, supaya jawaban yang dibaca pengguna dan jawaban
 * yang dibuat model tidak pernah berbeda. Harga sengaja tidak ditulis di sini: nominal paket dibaca
 * dari tabel billing_plan saat halaman dirender dan saat prompt dibentuk.
 */
export const SUPPORT_FAQ: readonly SupportFaq[] = [
	{
		id: "refund-cara",
		topic: "refund",
		question: "Bagaimana cara mengajukan pengembalian dana?",
		answer:
			"Kirim pesan WhatsApp ke admin dengan email akun, nomor pesanan atau kode unik, tanggal pembayaran, dan alasan singkat. Sertakan bukti transfer bila diminta.",
	},
	{
		id: "refund-lama",
		topic: "refund",
		question: "Berapa lama proses pengembalian dana?",
		answer:
			"Admin membalas dalam 3 hari kerja dan menyelesaikan pengembalian yang disetujui dalam 7 hari kerja.",
	},
	{
		id: "refund-gagal",
		topic: "refund",
		question: "Kredit sudah terpakai tetapi fiturnya gagal, apakah bisa dikembalikan?",
		answer:
			"Bisa, kalau kegagalan berasal dari kesalahan sistem. Laporkan nomor pesanan dan waktu kejadian, lalu kredit kembali ke saldo setelah admin memeriksa.",
	},
	{
		id: "refund-lebih",
		topic: "refund",
		question: "Saya transfer lebih dari total pesanan, bagaimana?",
		answer: "Selisihnya dikembalikan setelah pesanan diverifikasi. Sebutkan nomor pesanan saat menghubungi admin.",
	},
	{
		id: "refund-ditolak",
		topic: "refund",
		question: "Pesanan saya ditolak, apakah uang kembali?",
		answer:
			"Kalau bukti tidak cocok, pesanan ditolak dan tidak ada kredit yang masuk. Kamu bisa membayar ulang dengan nominal yang benar atau meminta peninjauan lewat WhatsApp.",
	},
	{
		id: "refund-kedaluwarsa",
		topic: "refund",
		question: "Apakah kredit bisa kedaluwarsa?",
		answer: "Kredit tidak kedaluwarsa selama akunmu aktif. Kredit tetap bisa dipakai kapan pun kamu butuh.",
	},
	{
		id: "refund-tujuan",
		topic: "refund",
		question: "Pengembalian dana dikirim ke mana?",
		answer:
			"Uang dikirim ke rekening bank atau dompet digital yang kamu sebutkan. Biaya transfer bank ditanggung PortoFit kecuali data rekening yang diberikan salah.",
	},
	{
		id: "refund-ai",
		topic: "refund",
		question: "Hasil AI tidak cocok, apakah kredit saya kembali?",
		answer:
			"Kredit yang sudah terpakai tidak dapat dikembalikan, termasuk saat keluaran AI tidak sesuai harapan. Keluaran AI adalah draf yang perlu kamu periksa sebelum dipakai.",
	},
	{
		id: "bayar-cara",
		topic: "pembayaran",
		question: "Bagaimana cara membayar paket?",
		answer:
			"Pembayaran memakai QRIS. Pindai kode di halaman Harga, lalu bayar sesuai total pesanan yang tertera, bukan hanya harga paket.",
	},
	{
		id: "bayar-kode-unik",
		topic: "pembayaran",
		question: "Apa itu kode unik tiga angka?",
		answer:
			"Setiap pesanan menambahkan kode unik tiga angka ke nominal. Tujuannya supaya pembayaranmu mudah dicocokkan di mutasi rekening.",
	},
	{
		id: "bayar-verifikasi",
		topic: "pembayaran",
		question: "Berapa lama pembayaran diverifikasi?",
		answer: "Admin memverifikasi setiap pembayaran secara manual. Kredit masuk setelah bukti transfer cocok dan diverifikasi.",
	},
	{
		id: "bayar-bukti",
		topic: "pembayaran",
		question: "Bukti apa yang perlu diunggah?",
		answer:
			"Unggah bukti transfer dari halaman pesanan. Pastikan nominal, tanggal, dan tujuan transfer terlihat jelas di gambar.",
	},
	{
		id: "kredit-beda",
		topic: "kredit",
		question: "Apa beda kredit lamaran dan kredit wawancara?",
		answer:
			"Kredit lamaran dipakai untuk menyalin CV dan surat lamaran ke satu lowongan. Kredit wawancara dipakai untuk satu sesi latihan wawancara.",
	},
	{
		id: "kredit-kapan",
		topic: "kredit",
		question: "Kapan kredit terpotong?",
		answer:
			"Kredit terpotong hanya saat tindakan berbayar dijalankan. Tindakan yang memakai kredit ditandai lebih dulu di antarmuka, jadi kamu tahu sebelum menekan tombol.",
	},
	{
		id: "akun-hapus",
		topic: "akun",
		question: "Bagaimana cara menghapus akun?",
		answer: "Buka Pengaturan lalu Akun, pilih hapus akun. Dokumen dan riwayat percakapan ikut terhapus.",
	},
	{
		id: "akun-email",
		topic: "akun",
		question: "Bagaimana cara mengganti email akun?",
		answer: "Hubungi admin lewat WhatsApp dengan email lama dan email baru yang ingin dipakai.",
	},
	{
		id: "akun-sandi",
		topic: "akun",
		question: "Saya lupa sandi, bagaimana?",
		answer:
			"Gunakan tautan lupa sandi di halaman masuk. Kalau email pemulihan tidak masuk, hubungi admin lewat WhatsApp.",
	},
];

export function faqByTopic(topic: SupportTopic): SupportFaq[] {
	return SUPPORT_FAQ.filter((item) => item.topic === topic);
}
