# Akun dan transaksi, dokumen desain

Tanggal 11 November 2026.

## Maksud

Akun jadi rumah untuk profil, kredit, pesanan, dan pengaturan. Transaksi jadi riwayat pesanan saja. Dua halaman ini dipisah supaya masing masing punya satu pekerjaan.

## Keputusan

- Halaman baru `/dashboard/akun` menggantikan `/dashboard/settings` dan menu Other di ponsel.
- Halaman transaksi hanya berisi riwayat pesanan dan kuitansi. Saldo kredit dan riwayat pemakaian kredit pindah ke akun.
- Empat tab status: Semua, Menunggu bayar, Diproses, Selesai, Dibatalkan. Dibatalkan mencakup ditolak dan hangus.
- Tidak ada status Dikirim, karena kredit digital tidak dikirim.
- Pengaturan Akun, Preferensi, dan AI menjadi bagian di dalam halaman akun, bukan halaman terpisah.
- Alamat lama dialihkan: `/dashboard/settings` dan turunannya menuju bagian yang sama di `/dashboard/akun`.

## Susunan halaman akun

1. Profil: nama, email, tanggal bergabung, dan tombol Keluar.
2. Kredit: dua saldo, lamaran dan wawancara, dengan tombol beli dan riwayat pemakaian kredit di bawahnya.
3. Pesanan: empat angka status yang menaut ke tab transaksi, plus lima pesanan terakhir.
4. Pengaturan: Akun, Preferensi, dan AI, masing masing satu bagian dengan judulnya.

## Susunan halaman transaksi

- Kepala: judul dan pencarian nomor pesanan.
- Tab status dengan angka: Semua, Menunggu bayar, Diproses, Selesai, Dibatalkan.
- Tiap pesanan satu kartu: nama paket dan status di baris atas, kode unik dan tanggal di baris kedua, total di kanan, tombol Bayar atau Lihat kuitansi.
- Tab Kuitansi: daftar kuitansi dengan nomor, tanggal, total, dan tombol Lihat yang membuka panel yang sudah ada.
- Pesanan yang masih menunggu bayar menampilkan hitung mundur dan, saat dipilih, blok QRIS serta unggah bukti.

## Navigasi

- Sidebar desktop: item Settings menjadi Akun, ikon user-circle.
- Bilah bawah ponsel: item Other menjadi Akun, isinya pengaturan dan Admin untuk admin.
- Judul halaman pengaturan yang lama tidak dipakai lagi.

## Yang tidak berubah

- Panel kuitansi dan PDF.
- Alur bayar, unggah bukti, hitung mundur, dan hangus.
- Semua prosedur API. Perubahan hanya di tampilan dan rute.

## Uji

- Tab status menghitung pesanan sesuai statusnya.
- Halaman transaksi tidak lagi menampilkan saldo kredit atau riwayat kredit.
- Akun menampilkan saldo, empat angka pesanan, dan tiga bagian pengaturan.
- Alamat settings lama membuka halaman akun, bukan 404.
- Menu bawah ponsel menampilkan Akun, dan Admin tetap bisa dibuka admin.
- Halaman akun dan transaksi lulus typecheck dan tampil benar di 390 dan 1440.
