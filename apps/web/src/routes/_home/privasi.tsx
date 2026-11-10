import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";
import { SUPPORT_WHATSAPP_URL } from "@reactive-resume/utils/support-faq";

export const Route = createFileRoute("/_home/privasi")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Kebijakan Privasi PortoFit" },
			{
				name: "description",
				content:
					"Data apa yang dikumpulkan PortoFit, untuk apa, siapa yang memproses, berapa lama disimpan, dan cara meminta akses atau penghapusan.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Kebijakan Privasi"
			summary="Kami hanya mengumpulkan data yang diperlukan untuk menjalankan PortoFit: menyusun CV, memeriksa keterbacaan, mencatat lamaran, dan memproses pembayaran. Kami tidak menjual datamu."
		>
			<LegalSection title="1. Data yang kami kumpulkan">
				<LegalList
					items={[
						"Data akun: nama, nama pengguna, alamat email, dan sandi yang disimpan sebagai hash.",
						"Isi dokumen: CV, surat lamaran, riwayat lamaran, catatan, jawaban latihan, dan berkas yang kamu unggah.",
						"Data pembayaran: paket, nominal, kode unik, status pesanan, dan bukti transfer yang kamu unggah. Kami tidak menyimpan nomor kartu atau PIN.",
						"Data teknis: alamat IP, waktu akses, dan log kesalahan seperlunya untuk keamanan dan perbaikan layanan.",
						"Riwayat chat dukungan: pertanyaan dan jawaban di halaman Bantuan, disimpan selama akun aktif.",
					]}
				/>
			</LegalSection>

			<LegalSection title="2. Mengapa kami memakai data">
				<LegalList
					items={[
						"Menyediakan fitur yang kamu minta, termasuk menyimpan dan membuka kembali dokumen.",
						"Menjalankan pemeriksaan CV, pencocokan lowongan, dan latihan wawancara.",
						"Memverifikasi pembayaran dan mencatat pemakaian kredit.",
						"Melindungi layanan dari penyalahgunaan dan menjawab pertanyaan dukungan.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Pemrosesan AI">
				<p>
					Fitur AI mengirim bagian yang relevan, misalnya CV, deskripsi lowongan, atau jawaban latihan, ke penyedia model
					bahasa melalui gateway yang kami pakai. Hasilnya berupa draf yang harus kamu periksa. Jangan memasukkan data
					sensitif seperti nomor identitas, nomor rekening, atau data kesehatan ke dalam CV, lamaran, atau jawaban
					latihan.
				</p>
				<p>Penyedia model dapat memproses data di luar Indonesia sesuai kebijakan mereka sendiri.</p>
			</LegalSection>

			<LegalSection title="4. Siapa yang dapat melihat">
				<LegalList
					items={[
						"Kamu, melalui akunmu.",
						"Admin PortoFit, hanya untuk verifikasi pembayaran, dukungan, dan keamanan. Bukti transfer disimpan sebagai berkas privat dan tidak dapat diakses publik.",
						"Penyedia infrastruktur: penyedia server, layanan email untuk verifikasi dan pengingat, gateway model AI, dan layanan pesan yang menyimpan salinan cadangan terenkripsi.",
						"Pihak lain hanya bila hukum yang berlaku mewajibkan.",
					]}
				/>
				<p>Kami tidak menjual atau menyewakan data pengguna kepada pengiklan.</p>
			</LegalSection>

			<LegalSection title="5. Cookie dan penyimpanan lokal">
				<p>
					Kami memakai cookie sesi untuk menjaga kamu tetap masuk dan cookie bahasa untuk mengingat pilihan antarmuka.
					Draf jawaban latihan dapat disimpan di penyimpanan lokal peramban. Kami tidak memasang cookie iklan atau
					pelacak pihak ketiga.
				</p>
			</LegalSection>

			<LegalSection title="6. Berapa lama data disimpan">
				<p>
					Data akun dan dokumen disimpan selama akun aktif. Saat kamu menghapus akun dari Pengaturan, akun dan dokumen
					dihapus dari sistem utama. Riwayat chat dukungan ikut terhapus bersama akun. Cadangan bergilir disimpan paling lama 14 hari sebelum terhapus sendiri. Catatan
					pembayaran dapat disimpan lebih lama untuk pembukuan dan kewajiban hukum.
				</p>
			</LegalSection>

			<LegalSection title="7. Hakmu">
				<LegalList
					items={[
						"Melihat dan memperbaiki data melalui akun dan halaman dokumen.",
						"Menghapus akun dan dokumen melalui Pengaturan lalu Akun.",
						"Meminta salinan data atau menjelaskan keberatan atas pemrosesan tertentu melalui WhatsApp di bawah.",
					]}
				/>
				<p>Kami menjawab dalam 14 hari kerja setelah identitas pemilik akun diverifikasi.</p>
			</LegalSection>

			<LegalSection title="8. Keamanan">
				<p>
					Koneksi memakai HTTPS, sandi disimpan sebagai hash, akses admin dibatasi, dan bukti pembayaran tidak dapat
					diakses publik. Tidak ada sistem yang sepenuhnya bebas risiko. Laporkan dugaan kebocoran melalui WhatsApp agar
					kami tindak lanjuti.
				</p>
			</LegalSection>

			<LegalSection title="9. Anak dan perubahan">
				<p>
					PortoFit ditujukan untuk pengguna berusia 18 tahun ke atas. Kebijakan ini dapat diperbarui. Perubahan penting
					diumumkan di situs. Versi yang berlaku selalu menampilkan tanggal di bagian atas halaman.
				</p>
			</LegalSection>

			<LegalSection title="10. Kontak">
				<p>
					Pertanyaan tentang data dan privasi: WhatsApp{" "}
					<a
						href={SUPPORT_WHATSAPP_URL}
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						081939948769
					</a>
					. Sertakan email akun agar kami dapat menemukan datamu.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
