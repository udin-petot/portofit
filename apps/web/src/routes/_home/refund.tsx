import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/refund")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Kebijakan Pengembalian Dana PortoFit" },
			{
				name: "description",
				content:
					"Kapan kredit PortoFit dapat dikembalikan, kapan tidak, dan cara mengajukan pengembalian dana lewat WhatsApp.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Kebijakan Pengembalian Dana"
			summary="Kredit yang belum terpakai dapat dikembalikan dalam 7 hari setelah pembayaran diverifikasi. Kredit yang sudah terpakai tidak dapat dikembalikan kecuali tindakan gagal karena kesalahan sistem."
		>
			<LegalSection title="1. Kredit yang belum terpakai">
				<p>
					Jika pembayaran sudah diverifikasi dan kredit belum terpakai, ajukan pengembalian dalam 7 hari kalender sejak
					verifikasi. Kredit yang sudah dipakai untuk menyalin CV, menyiapkan briefing, atau tindakan berbayar lain tidak
					dapat dikembalikan.
				</p>
			</LegalSection>

			<LegalSection title="2. Kesalahan sistem">
				<LegalList
					items={[
						"Kredit terpakai tetapi tindakan gagal: laporkan nomor pesanan dan waktu kejadian. Setelah kami periksa, kredit kembali ke saldo.",
						"Pembayaran jelas dilakukan dua kali untuk pesanan yang sama: kelebihan dikembalikan atau dijadikan kredit, mana yang kamu pilih.",
						"Kamu mentransfer lebih dari total pesanan: selisihnya dikembalikan setelah pesanan diverifikasi.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Yang tidak ditanggung">
				<LegalList
					items={[
						"Kredit terpakai meski keluaran AI tidak sesuai harapan. Keluaran AI adalah draf dan harus diperiksa sebelum dipakai.",
						"Lamaran ditolak perusahaan, undangan yang tidak pernah datang, atau tidak mendapat pekerjaan.",
						"Perubahan harga setelah pembelian.",
						"Pembayaran yang tidak terverifikasi atau bukti yang tidak cocok.",
					]}
				/>
			</LegalSection>

			<LegalSection title="4. Cara mengajukan">
				<p>
					Kirim pesan WhatsApp ke{" "}
					<a
						href="https://wa.me/6281939948769"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						081939948769
					</a>{" "}
					dengan email akun, nomor pesanan atau kode unik, tanggal pembayaran, dan alasan singkat. Sertakan bukti transfer
					bila diminta.
				</p>
			</LegalSection>

			<LegalSection title="5. Waktu proses">
				<p>
					Kami membalas dalam 3 hari kerja dan menyelesaikan pengembalian yang disetujui dalam 7 hari kerja. Uang dikirim
					ke rekening bank atau dompet digital yang kamu sebutkan. Biaya transfer bank kami tanggung kecuali data rekening
					yang diberikan salah.
				</p>
			</LegalSection>

			<LegalSection title="6. Pembayaran ditolak">
				<p>
					Jika bukti pembayaran tidak cocok, pesanan ditolak dan tidak ada kredit yang masuk. Kamu dapat membayar ulang
					dengan nominal yang benar atau menghubungi WhatsApp untuk peninjauan.
				</p>
			</LegalSection>

			<LegalSection title="7. Perubahan kebijakan">
				<p>
					Kebijakan ini dapat diperbarui. Permintaan yang diajukan sebelum tanggal perubahan mengikuti kebijakan yang
					berlaku saat pembayaran diverifikasi.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
