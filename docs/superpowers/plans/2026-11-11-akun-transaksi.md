# Akun dan transaksi, rencana kerja

**Spec:** `docs/superpowers/specs/2026-11-11-akun-transaksi-design.md`

## Batasan

- Tidak ada perubahan API. Hanya rute dan tampilan.
- Panel kuitansi, hitung mundur, dan alur bayar tidak disentuh.
- Empat tab status: semua, menunggu_bayar, menunggu_verifikasi, lunas, dibatalkan (ditolak + hangus).
- Pengaturan dipindah, bukan ditulis ulang isinya.

## Review Focus

- Pengguna membuka `/dashboard/settings` dari bookmark lama. Harapan: sampai di akun, bukan 404.
- Admin membuka menu bawah ponsel. Harapan: Akun ada, dan Admin tetap bisa dibuka.
- Pesanan hangus dan ditolak. Harapan: keduanya muncul di tab Dibatalkan.
- Pesanan menunggu bayar. Harapan: hitung mundur dan QRIS tetap berfungsi.
- Saldo kredit tidak lagi muncul di transaksi, tetapi muncul di akun.

---

### Task 1: Rute akun dan pengalihan

- [ ] Buat `apps/web/src/routes/dashboard/akun.tsx` dengan judul Akun.
- [ ] Pindahkan isi `settings/route.tsx` ke dalam komponen akun sebagai bagian, bukan layout berisi nav.
- [ ] Buat pengalihan `/dashboard/settings` dan turunannya ke `/dashboard/akun`.
- [ ] Typecheck dan commit.

### Task 2: Isi akun

- [ ] Profil: nama, email, tanggal bergabung, tombol keluar.
- [ ] Kredit: dua saldo, tombol beli, dan riwayat pemakaian kredit yang dipindah dari halaman transaksi.
- [ ] Pesanan: empat angka status yang menaut ke tab transaksi, plus lima pesanan terakhir.
- [ ] Pengaturan: bagian Akun, Preferensi, AI memakai komponen yang sudah ada.
- [ ] Typecheck dan commit.

### Task 3: Transaksi jadi riwayat

- [ ] Hapus blok saldo kredit dan riwayat kredit dari halaman transaksi.
- [ ] Tambah pencarian nomor pesanan dan tab status dengan angka.
- [ ] Kartu pesanan: paket dan status, kode dan tanggal, total, tombol Bayar atau Lihat kuitansi.
- [ ] Tab Kuitansi memakai daftar yang sudah ada dengan panel Lihat.
- [ ] Blok QRIS dan unggah bukti hanya muncul untuk pesanan menunggu bayar yang dipilih.
- [ ] Typecheck dan commit.

### Task 4: Navigasi

- [ ] Sidebar desktop: Settings menjadi Akun.
- [ ] Bilah bawah ponsel: Other menjadi Akun, panel berisi pengaturan dan Admin.
- [ ] Perbarui komentar shell yang menyebut Settings.
- [ ] Typecheck dan commit.

### Task 5: Rilis

- [ ] Push, workflow, tarik image, jalankan container.
- [ ] Uji di 390 dan 1440: menu Akun, tab transaksi, hitung mundur, panel kuitansi.
- [ ] Uji pengalihan alamat lama.
- [ ] Hapus akun uji.
