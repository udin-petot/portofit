import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/syarat")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Syarat Layanan PortoFit" },
			{
				name: "description",
				content:
					"Aturan pemakaian PortoFit: akun, konten, kredit dan pembayaran, batas pemakaian AI, serta tanggung jawab pengguna.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Syarat Layanan"
			summary="Dengan membuat akun atau memakai PortoFit, kamu setuju dengan syarat ini. Baca bagian kredit, pembayaran, dan batas AI sebelum membeli."
		>
			<LegalSection title="1. Layanan">
				<p>
					PortoFit membantu kamu menyusun CV, memeriksa cara sistem pelacakan pelamar atau ATS membacanya, mencatat
					lamaran, menyusun pesan, dan berlatih wawancara. PortoFit bukan agen rekrutmen dan tidak menjamin wawancara
					atau pekerjaan.
				</p>
			</LegalSection>

			<LegalSection title="2. Akun">
				<LegalList
					items={[
						"Usia minimal 18 tahun dan data yang kamu berikan benar.",
						"Kamu bertanggung jawab menjaga sandi, perangkat, dan kode pemulihan akun.",
						"Satu akun tidak boleh dipakai bersama untuk menghindari penyalahgunaan kredit.",
						"Kami dapat menangguhkan akun yang melanggar syarat ini atau merugikan pengguna lain.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Larangan penggunaan">
				<LegalList
					items={[
						"Mengunggah konten ilegal, menyesatkan, atau milik orang lain tanpa izin.",
						"Mengirim spam, mencoba membobol sistem, atau mengakses akun orang lain.",
						"Menyalin layanan dalam skala besar, mengambil data secara otomatis, atau membebani server dengan sengaja.",
						"Memakai PortoFit untuk melamar dengan identitas palsu atau pengalaman yang direkayasa.",
					]}
				/>
			</LegalSection>

			<LegalSection title="4. Kontenmu">
				<p>
					CV, surat, catatan, dan jawaban tetap milikmu. Kamu memberi kami izin terbatas untuk menyimpan, menampilkan,
					dan memproses konten itu hanya agar fitur PortoFit berjalan. Kamu bertanggung jawab atas kebenaran isinya.
				</p>
			</LegalSection>

			<LegalSection title="5. Kredit, harga, dan pembayaran">
				<LegalList
					items={[
						"Kredit lamaran Rp5.000 per kredit. Kredit wawancara Rp10.000 per kredit. Harga yang tampil di halaman Harga berlaku saat kamu membeli.",
						"Pembayaran memakai QRIS dengan kode unik tiga angka. Kamu harus membayar total pesanan, bukan hanya harga paket.",
						"Admin memverifikasi setiap pembayaran secara manual. Kredit masuk setelah bukti cocok dan diverifikasi.",
						"Tindakan yang memakai kredit ditandai di antarmuka sebelum dijalankan. Kredit yang sudah terpakai tidak dapat dikembalikan kecuali tindakan gagal karena kesalahan sistem.",
						"Kredit tidak kedaluwarsa selama akunmu aktif.",
					]}
				/>
				<p>
					Ketentuan pengembalian dana ada di{" "}
					<a href="/refund" className="font-medium text-accent-text underline-offset-4 hover:underline">
						Kebijakan Pengembalian Dana
					</a>
					.
				</p>
			</LegalSection>

			<LegalSection title="6. AI dan keluaran otomatis">
				<p>
					Keluaran AI adalah draf, bukan fakta atau jaminan. Model dapat salah, melewatkan sesuatu, atau memberi saran
					yang tidak cocok. Periksa setiap klaim, tanggal, dan angka sebelum mengirim dokumen ke perekrut. PortoFit
					tidak memberi nasihat hukum, imigrasi, atau ketenagakerjaan.
				</p>
			</LegalSection>

			<LegalSection title="7. Ketersediaan">
				<p>
					Kami berusaha menjaga layanan tetap berjalan, tetapi dapat menjeda untuk pemeliharaan, pembaruan, atau hal di
					luar kendali. Kami tidak menjamin layanan selalu tersedia tanpa gangguan.
				</p>
			</LegalSection>

			<LegalSection title="8. Kekayaan intelektual">
				<p>
					Merek, desain, dan isi situs PortoFit dilindungi hukum yang berlaku. Kode sumber tersedia di repositori publik
					dengan Lisensi MIT. Lisensi itu tidak memberi hak memakai merek PortoFit secara menyesatkan.
				</p>
			</LegalSection>

			<LegalSection title="9. Batas tanggung jawab">
				<p>
					Sepanjang hukum mengizinkan, PortoFit tidak bertanggung jawab atas kerugian tidak langsung, kehilangan peluang
					kerja, atau kerugian akibat keputusan yang kamu ambil berdasarkan keluaran AI. Tanggung jawab kami atas
					kerugian langsung dibatasi sebesar jumlah yang kamu bayar dalam tiga bulan terakhir.
				</p>
			</LegalSection>

			<LegalSection title="10. Penghentian dan perubahan">
				<p>
					Kamu dapat berhenti kapan saja dengan menghapus akun. Kami dapat menutup akun yang melanggar syarat ini.
					Syarat ini dapat diperbarui. Perubahan penting diumumkan di situs dan berlaku sejak tanggal yang tertera.
				</p>
			</LegalSection>

			<LegalSection title="11. Hukum yang berlaku dan kontak">
				<p>
					Syarat ini tunduk pada hukum Republik Indonesia. Pertanyaan atau keberatan: WhatsApp{" "}
					<a
						href="https://wa.me/6281939948769"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						081939948769
					</a>
					.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
