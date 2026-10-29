import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/syarat")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Syarat Layanan — PortoFit" },
			{
				name: "description",
				content: "Aturan pemakaian PortoFit: akun, konten, kredit dan pembayaran, batas kemampuan AI, serta tanggung jawab pengguna.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Syarat Layanan"
			summary="Dengan membuat akun atau memakai PortoFit, kamu menyetujui syarat ini. Bacalah bagian kredit, pembayaran, dan batas kemampuan AI sebelum membeli."
		>
			<LegalSection title="1. Layanan">
				<p>
					PortoFit membantu menyusun CV, memeriksa keterbacaan CV oleh sistem pelacak lamaran (ATS), mencatat lamaran, menyusun draf pesan, dan
					berlatih wawancara. PortoFit bukan agen rekrutmen dan tidak menjamin kamu dipanggil atau diterima kerja.
				</p>
			</LegalSection>

			<LegalSection title="2. Akun">
				<LegalList
					items={[
						"Kamu harus berusia 18 tahun ke atas dan memberikan data yang benar.",
						"Kamu bertanggung jawab menjaga kata sandi, perangkat, dan kode pemulihan akun.",
						"Satu orang tidak boleh memakai akun bersama untuk menghindari penyalahgunaan kredit.",
						"Kami dapat menangguhkan akun yang melanggar syarat ini atau merugikan pengguna lain.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Penggunaan yang dilarang">
				<LegalList
					items={[
						"Mengunggah konten ilegal, menyesatkan, atau milik orang lain tanpa izin.",
						"Mengirim spam, mencoba menembus sistem, atau mengakses akun orang lain.",
						"Menyalin layanan secara massal, melakukan scraping otomatis, atau membebani server secara sengaja.",
						"Memakai PortoFit untuk melamar dengan identitas atau pengalaman yang dipalsukan.",
					]}
				/>
			</LegalSection>

			<LegalSection title="4. Konten kamu">
				<p>
					Isi CV, surat, catatan, dan jawaban tetap milikmu. Kamu memberi kami izin terbatas untuk menyimpan, menampilkan, dan memproses konten
					tersebut semata-mata agar fitur PortoFit dapat berjalan. Kamu bertanggung jawab atas kebenaran isinya.
				</p>
			</LegalSection>

			<LegalSection title="5. Kredit, harga, dan pembayaran">
				<LegalList
					items={[
						"Kredit lamaran Rp5.000 per kredit; kredit wawancara Rp10.000 per kredit. Harga yang berlaku ditampilkan di halaman Harga sebelum kamu membeli.",
						"Pembayaran memakai QRIS dengan kode unik tiga digit. Nominal yang harus dibayar adalah total pesanan, bukan harga paket saja.",
						"Pembayaran diverifikasi manual oleh admin. Kredit masuk setelah bukti bayar sesuai dan diverifikasi.",
						"Tindakan yang memotong kredit ditandai di antarmuka sebelum dijalankan. Kredit yang sudah terpakai tidak dapat dikembalikan, kecuali tindakan gagal karena kesalahan sistem.",
						"Kredit tidak memiliki masa kedaluwarsa selama akun aktif.",
					]}
				/>
				<p>
					Ketentuan pengembalian dana diatur di{" "}
					<a href="/refund" className="font-medium text-accent-text underline-offset-4 hover:underline">
						Kebijakan Pengembalian Dana
					</a>
					.
				</p>
			</LegalSection>

			<LegalSection title="6. AI dan hasil otomatis">
				<p>
					Hasil AI adalah draf, bukan fakta atau jaminan. Model dapat salah, melewatkan sesuatu, atau menghasilkan saran yang tidak cocok. Kamu
					wajib memeriksa setiap klaim, tanggal, dan angka sebelum mengirim dokumen ke perekrut. PortoFit tidak memberikan nasihat hukum,
					imigrasi, atau ketenagakerjaan.
				</p>
			</LegalSection>

			<LegalSection title="7. Ketersediaan">
				<p>
					Kami berusaha menjaga layanan tetap berjalan, tetapi dapat menghentikan sementara untuk perawatan, pembaruan, atau keadaan di luar
					kendali. Tidak ada jaminan ketersediaan tanpa gangguan.
				</p>
			</LegalSection>

			<LegalSection title="8. Kekayaan intelektual">
				<p>
					Merek, desain, dan konten situs PortoFit dilindungi hukum yang berlaku. Kode sumber tersedia di repositori publik dengan lisensi MIT;
					lisensi itu tidak memberi hak untuk memakai merek PortoFit secara menyesatkan.
				</p>
			</LegalSection>

			<LegalSection title="9. Batas tanggung jawab">
				<p>
					Sejauh diizinkan hukum, PortoFit tidak bertanggung jawab atas kerugian tidak langsung, kehilangan peluang kerja, atau kerugian yang
					timbul dari keputusan yang kamu ambil berdasarkan hasil AI. Tanggung jawab kami atas kerugian langsung dibatasi pada jumlah yang kamu
					bayarkan dalam tiga bulan terakhir.
				</p>
			</LegalSection>

			<LegalSection title="10. Penghentian dan perubahan">
				<p>
					Kamu dapat berhenti kapan saja dengan menghapus akun. Kami dapat menutup akun yang melanggar syarat ini. Syarat dapat diperbarui;
					perubahan penting diberitahukan di situs dan berlaku sejak tanggal yang tercantum.
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
						0819-3994-8769
					</a>
					.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
