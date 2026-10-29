import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/refund")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Pengembalian Dana — PortoFit" },
			{
				name: "description",
				content: "Kapan kredit PortoFit dapat dikembalikan, kapan tidak, dan cara mengajukan pengembalian lewat WhatsApp.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Kebijakan Pengembalian Dana"
			summary="Kredit yang belum terpakai dapat diajukan pengembaliannya dalam 7 hari setelah pembayaran diverifikasi. Kredit yang sudah terpakai tidak dapat dikembalikan, kecuali tindakan gagal karena kesalahan sistem."
		>
			<LegalSection title="1. Kredit belum terpakai">
				<p>
					Jika pembayaran sudah diverifikasi dan saldo kredit belum kamu pakai, ajukan pengembalian dalam 7 hari kalender sejak verifikasi.
					Kredit yang sudah dipakai untuk menyalin CV, briefing, atau tindakan berbayar lain tidak dapat dikembalikan.
				</p>
			</LegalSection>

			<LegalSection title="2. Kesalahan sistem">
				<LegalList
					items={[
						"Kredit terpotong tetapi tindakan gagal dijalankan: laporkan nomor pesanan dan waktu kejadian. Setelah diperiksa, kredit dikembalikan ke saldo.",
						"Pembayaran terbukti ganda untuk pesanan yang sama: kelebihan dikembalikan atau dijadikan kredit sesuai pilihanmu.",
						"Nominal ditransfer lebih besar dari total pesanan: selisih dikembalikan setelah pesanan diverifikasi.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Yang tidak termasuk">
				<LegalList
					items={[
						"Kredit yang sudah terpakai, meskipun hasil AI tidak sesuai harapan. Hasil AI adalah draf dan wajib diperiksa sebelum dipakai.",
						"Lamaran yang ditolak perusahaan, tidak dipanggil wawancara, atau tidak menghasilkan pekerjaan.",
						"Perubahan harga setelah pembelian.",
						"Pembayaran yang belum diverifikasi atau bukti bayar yang tidak cocok.",
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
						0819-3994-8769
					</a>{" "}
					dengan menyertakan: email akun, nomor pesanan atau kode unik, tanggal bayar, dan alasan singkat. Sertakan bukti transfer bila diminta.
				</p>
			</LegalSection>

			<LegalSection title="5. Waktu proses">
				<p>
					Kami membalas paling lambat 3 hari kerja dan menyelesaikan pengembalian yang disetujui dalam 7 hari kerja. Dana dikirim ke rekening
					atau dompet digital yang kamu sebutkan. Biaya transfer bank menjadi tanggungan kami sepanjang bukan karena kesalahan data rekening.
				</p>
			</LegalSection>

			<LegalSection title="6. Pembayaran ditolak">
				<p>
					Jika bukti bayar tidak cocok, pesanan ditolak dan tidak ada kredit yang masuk. Kamu dapat membayar ulang dengan nominal yang benar atau
					menghubungi WhatsApp untuk pemeriksaan.
				</p>
			</LegalSection>

			<LegalSection title="7. Perubahan kebijakan">
				<p>
					Kebijakan ini dapat diperbarui. Permintaan yang diajukan sebelum tanggal perubahan mengikuti kebijakan yang berlaku saat pembayaran
					diverifikasi.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
