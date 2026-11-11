# Kuitansi PortoFit, dokumen desain

Tanggal 11 November 2026. Status: menunggu persetujuan sebelum rencana kerja.

## Maksud

Setiap pembayaran yang sudah diverifikasi admin menghasilkan kuitansi bernomor. Pelanggan bisa mengunduhnya dari dasbor dan menerimanya lewat email saat verifikasi selesai.

Alasannya dua. Pelanggan punya bukti bayar yang rapi untuk pembukuan mereka, dan PortoFit punya jejak terbit yang tidak bisa diubah belakangan kalau ada sengketa.

## Batasan yang disepakati

- Ini kuitansi, bukan faktur pajak. Tidak ada NPWP, tidak ada klaim pajak. Di badan kuitansi ada satu kalimat: "Kuitansi ini bukan faktur pajak."
- Pengirim email tetap `noreply@portofit.tech` lewat Resend yang sudah terpasang. Bukan Gmail pribadi.
- Data order sudah menyimpan snapshot paket, kredit, harga, kode unik, total, metode bayar, dan waktu verifikasi, jadi kuitansi tidak perlu membaca ulang tabel paket.
- Bahasa Indonesia, A4, satu halaman, tanpa ikon dan tanpa blok warna.

## Sasaran

1. Setiap order berstatus `lunas` punya tepat satu kuitansi.
2. Nomor kuitansi unik, berurutan per tahun, dan tidak berubah setelah terbit.
3. Pelanggan dapat mengunduh PDF kapan saja dari `/dashboard/transaksi`.
4. Email kuitansi terkirim otomatis setelah verifikasi, dengan percobaan ulang kalau gagal.
5. Admin dapat mengirim ulang email tanpa membuat nomor baru.

## Bukan sasaran

- Faktur pajak, e-faktur, atau integrasi DJP.
- Kuitansi untuk kredit bonus, koreksi admin, atau pemberian manual.
- Integrasi payment gateway. Pembayaran tetap QRIS manual dengan verifikasi admin.
- Multi mata uang. Semua rupiah.

## Anti sasaran

- Nomor ganda atau nomor berubah setelah kuitansi terkirim.
- Kuitansi terbit untuk order yang belum lunas.
- Email gagal tanpa jejak, sehingga pelanggan tidak pernah menerima apa pun dan tidak ada yang tahu.
- Nomor kuitansi loncat karena transaksi basis data dibatalkan.

## Pendekatan yang dipilih

Tiga cara dipertimbangkan. Pertama, kuitansi resmi dengan nomor urut dan antrean email. Kedua, kuitansi langsung dari data order tanpa tabel baru, dengan nomor memakai id order. Ketiga, kuitansi berupa tautan, bukan lampiran.

Yang dipilih cara pertama, karena nomor yang enak dibaca dan email yang bisa dicoba ulang lebih penting daripada penghematan satu tabel. Cara kedua tidak punya percobaan ulang dan nomornya tidak layak dibaca pelanggan. Cara ketiga menambah langkah bagi pelanggan yang hanya ingin menyimpan bukti.

## Rancangan

### Tabel `invoice`

- `id` teks, kunci utama.
- `number` teks, unik, contoh `PF/2026/000123`.
- `order_id` teks, unik, merujuk `billing_order`. Unik di sini yang mencegah dua kuitansi untuk satu order.
- `user_id` teks, merujuk `user`.
- `issued_at` timestamptz.
- `snapshot` jsonb berisi nama paket, kredit, harga, kode unik, total, metode, waktu bayar, nama dan email pembeli, serta jumlah saldo setelah transaksi.

Snapshot disimpan supaya kuitansi tidak berubah kalau nama paket atau harga berubah di kemudian hari.

### Tabel `invoice_counter`

- `year` integer, kunci utama.
- `last_number` integer.

Nomor diambil di dalam transaksi verifikasi dengan `pg_advisory_xact_lock` pada tahun berjalan, lalu `insert ... on conflict do update ... returning`. Cara ini sama dengan pola kunci yang sudah dipakai verifikasi kredit, jadi tidak menambah pola baru.

### Tabel `invoice_email`

Antrean keluar, bukan pengiriman langsung di dalam transaksi.

- `id`, `invoice_id`, `to_email`, `status` dengan nilai `pending`, `sent`, `failed`.
- `attempts`, `last_error`, `created_at`, `sent_at`.

Baris antrean dibuat di transaksi yang sama dengan penerbitan kuitansi. Kalau email langsung dikirim di dalam transaksi dan SMTP lambat, verifikasi admin ikut menggantung, dan kalau SMTP gagal setelah commit, tidak ada yang mencoba lagi.

### PDF

Dibuat di server memakai mesin PDF yang sudah ada di `packages/pdf`, bukan pustaka baru. Saya sudah cek: paket itu tidak memakai `@react-pdf/renderer`, melainkan mesin Forme dengan primitif sendiri di `#react-pdf-renderer`, dan `server.tsx` sudah punya jalur render ke buffer.

Rencananya menambah satu modul `packages/pdf/src/invoice.tsx` berisi dokumen kuitansi satu halaman, lalu satu ekspor `createInvoicePdf` di `server.tsx` yang memakai jalur render yang sama. Font memakai Helvetica standar PDF, jadi tidak ada berkas font baru dan tidak ada dependensi baru.

Kalau ternyata mesin itu tidak bisa merender dokumen di luar data resume tanpa membongkar lapisan semantik, jalan mundurnya menambah `pdf-lib` dan menggambar kuitansi langsung. Itu keputusan pelaksana, dan saya akan laporkan kalau sampai ke sana.

Isi halaman, urut dari atas:

1. Nama PortoFit dan alamat situs, kecil, di kiri atas. Kata "Kuitansi" besar di kanan.
2. Nomor kuitansi, tanggal terbit dalam zona Asia/Jakarta, dan status LUNAS.
3. Identitas pembeli: nama dan email, diambil dari tabel pengguna saat kuitansi diterbitkan lalu disimpan di snapshot.
4. Rincian satu baris: nama paket, jumlah kredit, kemudian harga, kode unik, dan total di kolom angka rata kanan.
5. Metode bayar dan waktu verifikasi.
6. Kalimat "Kuitansi ini bukan faktur pajak." dan kontak bantuan di kaki halaman.

Angka memakai pemisah ribuan titik dan awalan Rp, sama seperti halaman harga.

### Endpoint

- `invoice.list` untuk pengguna yang login, mengembalikan nomor, tanggal, paket, total, dan id untuk unduhan.
- `invoice.download` menerima id kuitansi milik pengguna itu, mengembalikan PDF.
- `invoice.resend` khusus admin, memasukkan ulang baris antrean tanpa membuat nomor baru.
- `POST /api/cron/invoice-mailer` dengan header rahasia yang sama seperti jalur cron lain, memproses maksimal 20 antrean `pending` tiap panggilan.

### Pengiriman email

Template baru `packages/email/src/templates/invoice.tsx` memakai react-email, dengan lampiran PDF lewat `attachments` di nodemailer. Isi email singkat: terima kasih, nomor kuitansi, total, dan satu tombol menuju dasbor transaksi.

`sendEmail` sekarang hanya menerima `to`, `subject`, dan `react`, jadi perlu tambahan `attachments` opsional. Perubahan ini kecil dan tidak mengganggu email auth yang sudah ada.

### Tampilan

Di `/dashboard/transaksi`, setiap baris berstatus lunas mendapat tombol "Unduh kuitansi". Kalau kuitansi belum terbit karena order lama, tombolnya tidak muncul dan admin yang menerbitkan lewat alat terpisah.

### Order lama

Order lunas sebelum fitur ini rilis tidak otomatis dibuatkan kuitansi, karena nomornya akan menabrak urutan tanggal. Admin mendapat satu tindakan "terbitkan kuitansi" per order lama, yang memakai tanggal verifikasi asli dan tetap memakai nomor urut berikutnya.

## Uji yang harus ada

- Nomor berurutan dan tidak ganda saat dua verifikasi berjalan bersamaan.
- Satu order hanya menghasilkan satu kuitansi, termasuk kalau endpoint verifikasi dipanggil dua kali.
- Kuitansi tidak terbit untuk order yang bukan `lunas`.
- PDF satu halaman, memuat nomor, nama pembeli, total, dan kalimat bukan faktur pajak.
- Antrean email dicoba ulang dan berhenti setelah status `sent`.
- Unduhan menolak kuitansi milik pengguna lain.

## Risiko

- Deliverability Resend ke Gmail pelanggan. Mitigasi: kirim dari domain yang sudah punya SPF dan DKIM, dan sediakan tombol unduh di dasbor sebagai jalur kedua.
- Nomor loncat kalau transaksi dibatalkan setelah nomor diambil. Mitigasi: nomor diambil di dalam transaksi yang sama dengan perubahan status order, jadi pembatalan ikut membatalkan nomor.
- Zona waktu. Semua tanggal kuitansi dicetak dalam Asia/Jakarta, bukan UTC.

## Yang diserahkan ke pelaksana

Nama dan alamat usaha yang dicetak di kop, format akhir nomor kalau ingin diubah, dan apakah footer memuat nomor WhatsApp admin.
