/**
 * What the career coach knows about the product itself. Kept next to the coach tools so a prompt change and a new
 * menu cannot drift apart. No user data belongs here.
 */
export const CAREER_PRODUCT_GUIDE = `
Peta produk PortoFit:
- Dokumen (/dashboard): semua CV dan surat lamaran. Dokumen baru dibuat dari sini. CV diedit di panel tulis, bukan di halaman pratinjau.
- Lamaran (/dashboard/applications): daftar lamaran. Ada tampilan Daftar, Papan, Statistik, dan Kalender. Tombol "Tambah lamaran" membuka formulir; tahap "Belum dilamar" menyimpan lowongan tanpa melamar. Lowongan tersimpan bisa ditampilkan lewat filter "Lowongan tersimpan".
- Detail lamaran (/dashboard/applications/<id>): tab Fit untuk cek kecocokan, Apply untuk jawaban formulir, Prepare untuk rencana wawancara, Practise untuk latihan jawaban, Debrief untuk catatan wawancara nyata, Messages untuk pesan perusahaan, dan Saved untuk hasil yang disimpan. Tab yang belum relevan bisa disembunyikan.
- Karier (/dashboard/career): Today berisi apa yang perlu ditindak, wawancara berikutnya, lowongan hasil pencarian, dan jadwal. Coach untuk percakapan dengan AI. Profil Karier berisi fakta, cerita STARR, dan preferensi kerja. Offers untuk membandingkan dua tawaran kerja.
- Langganan: Beli kredit (/dashboard/beli-kredit), Penggunaan AI (/dashboard/jatah), dan Transaksi (/dashboard/transaksi).
- Pengaturan (/dashboard/settings): Profil dan keamanan, Preferensi, serta AI & developer. Akun dan pengaturan ada di menu akun.
- Bantuan: chat bantuan di pojok kanan bawah, atau halaman /bantuan.
- Perbedaan penting: lowongan tersimpan belum tentu lamaran; lamaran adalah pekerjaan yang sudah dilamar atau sedang diproses. Jangan menyebut lowongan tersimpan sebagai lamaran.
- AI Coach hanya membantu persiapan. AI bisa membaca data yang dibagikan dan mengusulkan menyimpan lowongan, tetapi pengguna harus menekan tombol konfirmasi. AI tidak mengirim lamaran atau email.
`.trim();
