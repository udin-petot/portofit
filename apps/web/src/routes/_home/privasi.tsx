import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/privasi")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Kebijakan Privasi — PortoFit" },
			{
				name: "description",
				content:
					"Data apa yang dikumpulkan PortoFit, mengapa, siapa yang memprosesnya, berapa lama disimpan, dan cara meminta akses atau penghapusan.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Kebijakan Privasi"
			summary="Kami mengumpulkan data seperlunya untuk menjalankan PortoFit: membuat CV, memeriksa keterbacaan, mencatat lamaran, dan memproses pembayaran. Kami tidak menjual data kamu."
		>
			<LegalSection title="1. Data yang kami kumpulkan">
				<LegalList
					items={[
						"Data akun: nama, username, alamat email, dan kata sandi yang disimpan dalam bentuk hash.",
						"Isi dokumen: CV, cover letter, riwayat lamaran, catatan, jawaban latihan, dan berkas yang kamu unggah.",
						"Data pembayaran: paket, nominal, kode unik, status pesanan, dan bukti transfer yang kamu unggah. Kami tidak menyimpan nomor kartu atau PIN.",
						"Data teknis: alamat IP, waktu akses, dan catatan kesalahan secukupnya untuk keamanan dan perbaikan layanan.",
					]}
				/>
			</LegalSection>

			<LegalSection title="2. Mengapa data dipakai">
				<LegalList
					items={[
						"Menyediakan fitur yang kamu minta, termasuk menyimpan dan membuka kembali dokumen.",
						"Menjalankan pemeriksaan CV, pencocokan lowongan, dan latihan wawancara.",
						"Memverifikasi pembayaran dan mencatat pemakaian kredit.",
						"Menjaga layanan dari penyalahgunaan, serta menjawab pertanyaan dukungan.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Pemrosesan oleh AI">
				<p>
					Fitur AI mengirim bagian yang relevan — misalnya CV, deskripsi lowongan, atau jawaban latihan — ke penyedia model bahasa melalui
					gateway yang kami gunakan. Hasilnya berupa draf yang harus kamu periksa. Jangan masukkan data sensitif seperti nomor identitas,
					nomor rekening, atau data kesehatan ke dalam CV, lamaran, atau jawaban latihan.
				</p>
				<p>Penyedia model dapat memproses data di luar Indonesia sesuai kebijakan mereka sendiri.</p>
			</LegalSection>

			<LegalSection title="4. Siapa yang dapat melihat">
				<LegalList
					items={[
						"Kamu, melalui akunmu.",
						"Admin PortoFit, hanya untuk verifikasi pembayaran, dukungan, dan keamanan. Bukti transfer disimpan sebagai berkas privat dan tidak dibuka untuk umum.",
						"Penyedia infrastruktur: penyedia server, layanan email untuk verifikasi dan pengingat, gateway model AI, serta layanan pesan untuk menyimpan salinan cadangan terenkripsi.",
						"Pihak lain hanya jika diwajibkan hukum yang berlaku.",
					]}
				/>
				<p>Kami tidak menjual atau menyewakan data pengguna kepada pengiklan.</p>
			</LegalSection>

			<LegalSection title="5. Cookie dan penyimpanan lokal">
				<p>
					Kami memakai cookie sesi untuk menjaga kamu tetap masuk dan cookie bahasa untuk mengingat pilihan antarmuka. Draft jawaban latihan
					dapat tersimpan di penyimpanan lokal browser. Saat ini kami tidak memasang cookie iklan atau pelacak pihak ketiga.
				</p>
			</LegalSection>

			<LegalSection title="6. Berapa lama disimpan">
				<p>
					Data akun dan dokumen disimpan selama akun aktif. Saat kamu menghapus akun melalui Pengaturan, data akun dan dokumen dihapus dari
					sistem utama. Salinan cadangan bergulir maksimal 14 hari sebelum terhapus sendiri. Catatan pembayaran dapat disimpan lebih lama
					untuk pembukuan dan kewajiban hukum.
				</p>
			</LegalSection>

			<LegalSection title="7. Hak kamu">
				<LegalList
					items={[
						"Melihat dan memperbaiki data melalui halaman akun dan dokumen.",
						"Menghapus akun beserta dokumen melalui Pengaturan → Akun.",
						"Meminta salinan data atau menjelaskan keberatan atas pemrosesan tertentu melalui WhatsApp di bawah.",
					]}
				/>
				<p>Kami menanggapi permintaan paling lambat 14 hari kerja setelah identitas pemilik akun terverifikasi.</p>
			</LegalSection>

			<LegalSection title="8. Keamanan">
				<p>
					Koneksi memakai HTTPS, kata sandi disimpan dalam bentuk hash, akses admin dibatasi, dan bukti pembayaran tidak dapat diakses publik.
					Tidak ada sistem yang sepenuhnya bebas risiko; laporkan dugaan kebocoran melalui WhatsApp agar kami dapat menindaklanjuti.
				</p>
			</LegalSection>

			<LegalSection title="9. Anak dan perubahan">
				<p>
					PortoFit ditujukan untuk pengguna berusia 18 tahun ke atas. Kebijakan ini dapat diperbarui; perubahan penting akan diberitahukan di
					situs. Versi yang berlaku selalu mencantumkan tanggal di bagian atas halaman.
				</p>
			</LegalSection>

			<LegalSection title="10. Kontak">
				<p>
					Pertanyaan tentang data dan privasi: WhatsApp{" "}
					<a
						href="https://wa.me/6281939948769"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						0819-3994-8769
					</a>
					. Sertakan email akun agar kami dapat menemukan datamu.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
