# Pembayaran QRIS manual dalam popup, dokumen desain

Tanggal 13 November 2026.

## Maksud

Pembayaran PortoFit tetap manual. Tidak ada payment gateway, tidak ada QRIS dinamis, dan kredit tetap diverifikasi admin seperti sekarang. Yang berubah adalah tempat dan bentuk alurnya. Pembayaran pindah dari blok di tengah daftar transaksi ke satu popup, dan popup itu yang memandu pembaca dari QR sampai selesai.

Data 12 November 2026 menunjukkan 8 dari 16 pesanan hangus. Sebagian besar karena pembaca harus pindah halaman, mencari QRIS bersama, menambahkan kode unik tiga angka, lalu kembali mengunggah bukti. Popup ini memotong perpindahan itu, bukan mengganti verifikasinya.

## Keputusan yang mengikat

- Tanpa payment gateway. Verifikasi tetap manual oleh admin.
- QRIS statis `/qris-portofit.png` dan kode unik tiga angka tetap dipakai. Nominal pesanan adalah harga paket ditambah kode unik.
- Batas bayar 30 menit sejak pesanan dibuat. Lewat dari itu pesanan hangus dan tidak bisa dibayar lagi.
- Bukti yang diunggah sebelum batas membekukan hitung mundur dan memindahkan pesanan ke `menunggu_verifikasi`. Aturan ini sudah ada dan tidak berubah.
- Popup bisa ditutup kapan saja. Menutup popup tidak membatalkan pesanan, dan pesanan bisa dibuka lagi dari halaman transaksi.
- Setelah bukti terunggah, isi popup berganti dari QR ke keadaan menunggu dicek, bukan langsung centang. Centang hanya muncul setelah admin memverifikasi.
- Kedaluwarsa dan bukti ditolak memakai tanda silang.

## Alur

1. Pembaca menekan tombol beli. Pesanan dibuat, popup terbuka, dan nominal sudah termasuk kode unik.
2. Pembaca memindai QRIS dan membayar tepat sampai tiga angka terakhir.
3. Pembaca menekan "Unggah bukti bayar" di dalam popup, memilih foto, lalu menunggu unggahan selesai.
4. Server menyimpan bukti, status pindah ke `menunggu_verifikasi`, hitung mundur berhenti. Popup berganti ke keadaan menunggu dicek.
5. Admin memverifikasi dari panel admin. Kredit masuk, invoice terbit, dan email terkirim.
6. Bila popup masih terbuka saat verifikasi masuk, polling menangkapnya dan isi popup berganti ke centang. Bila sudah ditutup, email dan halaman transaksi yang memberi tahu.
7. Tanpa bukti sampai 30 menit, pesanan hangus dan popup berganti ke tanda silang.

## Menutup dan membuka lagi

Popup ditutup dengan tombol X, tombol Tutup, atau Escape. Tidak ada dialog konfirmasi, karena pesanan sudah aman di server dan membuka lagi cuma satu ketukan.

Tiga pintu masuk kembali ke popup yang sama:

- Halaman transaksi. Baris pesanan berstatus menunggu bayar menampilkan tombol "Lanjutkan bayar". Nomor pesanan dan hitung mundur ikut terlihat di baris itu.
- Halaman beli kredit. Bila ada pesanan yang belum dibayar, satu strip muncul di atas daftar paket berisi nama paket, total, sisa waktu, dan tombol "Lanjutkan". Yang ditampilkan hanya pesanan yang paling cepat kedaluwarsa.
- Email pesanan. Tombol "Buka pembayaran" menuju `/dashboard/transaksi?order=<id>`, dan halaman itu langsung membuka popup.

Aturan tambahan supaya tidak ada pesanan ganda:

- Menekan tombol beli untuk paket yang sama saat masih ada pesanan aktif mengembalikan pesanan itu, bukan membuat pesanan baru.
- Pesanan baru hanya dibuat bila tidak ada pesanan aktif untuk paket itu, atau pesanan lama sudah hangus.
- Setelah hangus, tombol "Lanjutkan bayar" hilang dan diganti "Buat pesanan baru".
- Selama unggahan berjalan, tombol tutup diganti "Tunggu sebentar" dan Escape diabaikan, karena unggahan setengah jalan menyisakan status yang tidak jelas.

## Keadaan popup

| Keadaan | Isi | Pemicu | Tombol |
|---|---|---|---|
| Menyiapkan | Kerangka QR abu abu, satu baris teks | Popup dibuka | Tidak ada |
| Menunggu bayar | QR 240px, total, kode unik, hitung mundur | Pesanan `menunggu_bayar` | Salin nominal, Unggah bukti bayar, WhatsApp, Tutup |
| Mengunggah | Bar kemajuan di tempat tombol | Berkas sedang dikirim | Tidak ada |
| Menunggu dicek | Ikon jam, kalimat bukti terkirim, rincian pesanan | Status `menunggu_verifikasi` | Tutup |
| Lunas | Tanda centang, jumlah kredit masuk, nomor invoice | Status `lunas` | Lihat invoice, Selesai |
| Kedaluwarsa | Tanda silang, kalimat waktu habis | Status `hangus` | Buat pesanan baru, Tutup |
| Ditolak | Tanda silang, alasan dari admin | Status `ditolak` | Unggah bukti lain, Buat pesanan baru |
| Galat | Tanda seru netral, kalimat koneksi | Unggahan gagal atau status tidak terbaca tiga kali | Coba lagi |

Tanda centang, tanda silang, dan ikon jam menggantikan QR di kotak yang sama. Nominal dan nama paket tetap terlihat di semua keadaan supaya pembaca tidak kehilangan konteks.

## Perilaku

- Hitung mundur memakai `expiresAt` dari server, bukan jam perangkat. `Countdown` yang sudah ada dipakai apa adanya.
- Nominal tampil sebagai satu angka besar, dengan kode unik dipisah di baris sendiri dan tombol salin.
- Unggahan memakai aturan yang sama dengan server: JPG atau PNG, maksimal 10 MB. Berkas lain ditolak di klien sebelum dikirim.
- Polling 5 detik sekali selama 30 detik pertama setelah unggah, lalu 15 detik sekali, berhenti di keadaan akhir. Saat tab kembali terlihat, status dibaca ulang lebih dulu.
- Escape menutup popup, kecuali saat mengunggah.
- Animasi perpindahan 320ms tanpa memantul. Pada `prefers-reduced-motion`, centang dan silang muncul tanpa animasi.

## Desktop

- Dialog 460px, sudut 14px, di tengah layar, latar belakang digelapkan `rgba(0,0,0,0.55)` tanpa blur supaya isi halaman di belakang tetap terbaca sebagai konteks.
- QR 240px, nominal 30px, tombol setinggi 40px dan selebar dialog.
- Tinggi maksimum 90vh. Bila isi lebih panjang, hanya badan dialog yang menggulir, kepala dan tombol aksi tetap di tempat.
- Fokus masuk ke tombol tutup saat dibuka, terkunci di dalam dialog, dan kembali ke tombol asal saat ditutup.

## Ponsel

- Di bawah 640px dialog menjadi lembar dari bawah, sudut atas 16px, pegangan kecil di tengah atas, tinggi maksimum 92svh.
- QR tetap 240px karena muat di layar 390px dengan padding 20px. Nominal turun ke 28px.
- Tombol setinggi 44px, selebar layar, jarak antar tombol 10px, ditambah `env(safe-area-inset-bottom)` di padding bawah.
- Tombol tutup 44 kali 44px di kanan atas dan tetap terlihat saat isi digulir.
- Halaman beli kredit menaruh dua kartu berbayar lebih dulu. Kartu gratis menjadi satu strip tipis di bawahnya, bukan kartu pertama yang memakan satu layar penuh.
- Strip pesanan aktif menempel di atas daftar paket, tidak mengambang.
- Baris transaksi di ponsel menaruh judul dan chip status di baris pertama, nominal di kanan atas, lalu satu baris meta ringkas, lalu tombol aksi selebar baris. Nominal tidak lagi di pojok bawah berseberangan dengan tombol.
- Tombol bantuan yang mengambang dinaikkan 12px dari bilah bawah supaya tidak menutupi tombol aksi.

## Ukuran yang diukur pada 13 November 2026

Angka di bawah diambil dari situs produksi sebelum perubahan, supaya klaim di dokumen ini bisa diperiksa.

- Halaman beli kredit pada 1440px: tiga kartu setinggi 361px dan tombolnya sudah sejajar. Masalah tata letak desktop yang dulu dikhawatirkan tidak ada, jadi yang diubah hanya isi dan urutannya.
- Halaman beli kredit pada 390px: tidak ada gulir mendatar, tetapi kartu pertama yang terlihat adalah kartu gratis, dan tombol aksi hanya 36px tinggi.
- Halaman transaksi pada 390px: baris setinggi 127px, nominal dan tombol berbagi satu baris di bawah, dan status hanya teks kecil di baris meta.

## Teks

- Judul menunggu: "Selesaikan pembayaran".
- Baris bantu: "Pindai dengan aplikasi bank atau dompet digital apa pun yang mendukung QRIS."
- Peringatan kode unik: "Bayar tepat Rp5.745. Tiga angka terakhir menandai pesananmu."
- Hitung mundur: "Berlaku 29:41 lagi".
- Menunggu dicek: "Bukti terkirim. Admin memeriksa manual, biasanya kurang dari satu hari kerja."
- Lunas: "Pembayaran diterima. 1 kredit lamaran masuk ke akunmu."
- Kedaluwarsa: "Waktu habis. Pesanan ini ditutup dan tidak bisa dibayar lagi."
- Ditolak: "Bukti tidak cocok. Alasan dari admin muncul di sini."
- Galat: "Bukti gagal terkirim. Coba lagi."
- Nominal ditulis dengan `formatRupiah` yang sudah ada, tanpa desimal.

## Halaman beli kredit

- Kartu berbayar lebih dulu, masing masing dengan harga sebagai elemen terbesar (32px), satu baris isi, dan tombol rata bawah.
- Kartu gratis menulis "Gratis", bukan "Rp0".
- Baris di bawah tombol berbunyi jujur: "Bayar QRIS, dicek admin, kredit masuk setelah lolos".
- Blok "How to pay" ditulis ulang tiga baris: pilih paket, pindai QR dan bayar sampai tiga angka terakhir, unggah bukti di popup. Tidak ada lagi kalimat yang menyuruh pindah ke halaman transaksi.
- Dua kotak saldo diberi border tipis dan angka rata kanan.

## Halaman transaksi

- Blok "Finish the payment" dihapus. Baris pesanan yang menunggu bayar menampilkan tombol "Lanjutkan bayar" yang membuka popup.
- `?order=<id>` membuka popup otomatis saat halaman dimuat, jadi tautan dari email langsung mendarat di pembayaran.
- Tiap baris pesanan punya chip status berwarna. Chip menunggu bayar memakai warna peringatan, lunas memakai warna aksen, hangus dan ditolak memakai warna bahaya.
- Baris yang dibuka menampilkan garis waktu singkat: dibuat, bukti dikirim, diverifikasi.
- Baris pesanan yang hangus atau ditolak menampilkan tombol "Buat pesanan baru" di barisnya sendiri.

## Invoice

Invoice yang berjalan sudah rapi. Tiga hal yang perlu dibereskan:

- Total muncul dua kali, di kotak hijau atas dan di bawah tabel. Baris total di bawah tabel dihapus, kotak hijau menjadi satu satunya angka total.
- Kode unik sekarang terlihat seperti baris tagihan. Ia dipindah ke ringkasan atas sebagai "Kode unik pembayaran", bukan baris di tabel rincian.
- Blok tanda tangan "Diverifikasi / Tim penagihan" diganti satu baris "Diverifikasi admin pada 13 November 2026, 19.55 WIB". Tanda tangan kosong pada invoice digital terbaca sebagai dokumen setengah jadi.

Nomor invoice, tata letak, warna, dan blok bantuan tidak berubah.

## Email

- Subjek pesanan tidak lagi menyebut angka menit yang salah. Isinya "Selesaikan pembayaran PortoFit", "Pesanan PortoFit menunggu kamu", dan "Pesanan PortoFit kedaluwarsa".
- Badan email pesanan menaruh nominal sebagai elemen terbesar, memisahkan kode unik ke barisnya sendiri, dan memuat batas bayar dari data pesanan.
- Satu tombol "Buka pembayaran" menuju `${APP_URL}/dashboard/transaksi?order=<id>` supaya popup langsung terbuka.
- Email lunas memakai bentuk invoice yang sudah ada, ditambah satu baris "1 kredit lamaran masuk ke akunmu" dan tombol "Lihat invoice".
- Pengingat tetap dikirim saat sisa waktu lima menit, dengan subjek yang menyebut sisa waktu dari data, bukan angka tetap di kode.
- Semua email lewat antrean yang sudah ada, tidak dikirim di dalam transaksi.

## Yang tidak berubah

- Panel admin, antrean verifikasi, dan tombol verifikasi.
- Nomor invoice `PF/YYYY/NNNNNN` dan panel invoice di aplikasi.
- Tabel saldo, buku besar kredit, dan halaman jatah.
- Antrean email, cron, dan penjagaan sebelum kirim.

## Uji

- Alur penuh: pesanan dibuat dari popup, QR tampil dengan nominal dan kode unik, bukti diunggah, popup berganti ke keadaan menunggu dicek tanpa pindah halaman.
- Tutup dan buka lagi: popup ditutup di tengah jalan, halaman dimuat ulang, tombol "Lanjutkan bayar" di baris transaksi membuka popup yang sama dengan sisa waktu yang benar.
- Pesanan aktif: menekan beli lagi untuk paket yang sama membuka pesanan yang sudah ada, bukan membuat yang kedua.
- Verifikasi: admin memverifikasi saat popup masih terbuka, popup berganti ke centang dan saldo bertambah.
- Kedaluwarsa: pesanan tanpa bukti lewat 30 menit, status hangus, popup berganti silang, tombol buat pesanan baru berfungsi.
- Ditolak: admin menolak bukti, popup berganti silang dengan alasan, unggah bukti lain mengembalikan status ke menunggu verifikasi.
- Bukti salah: PDF dan berkas lebih dari 10 MB ditolak di klien tanpa memanggil server.
- Ponsel 390px dan desktop 1440px: tidak ada gulir mendatar, tidak ada tombol di bawah 44px pada ponsel, dan lembar bawah tidak terpotong bilah navigasi.
