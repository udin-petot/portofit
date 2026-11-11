# Transaksi dan kuitansi, dokumen desain

Tanggal 11 November 2026. Menggantikan tampilan transaksi dan kuitansi yang sekarang.

## Maksud

Pelanggan membuka halaman transaksi dan langsung paham harus berbuat apa, berapa lama lagi, dan apa yang sudah terjadi. Kuitansi bisa dilihat di tempat tanpa mengunduh dulu, dan tampilannya pantas disimpan.

## Keputusan yang sudah diambil

- Batas bayar 10 menit sejak pesanan dibuat.
- Pesanan yang lewat batas berstatus **Hangus** dan tetap tampil di riwayat.
- Kuitansi dipratinjau di panel samping halaman transaksi, bukan halaman baru.
- Email pengingat dipakai untuk pesanan yang belum dibayar.

## Batasan

- Verifikasi pembayaran tetap manual oleh admin, jadi ada jeda antara transfer dan verifikasi.
- Bukti yang diunggah sebelum batas waktu membekukan hitung mundur. Pesanan pindah ke `menunggu_verifikasi` dan tidak dihanguskan, walaupun admin baru memeriksa setelah 10 menit lewat. Tanpa aturan ini, orang yang transfer di menit kesembilan akan kehilangan uangnya karena antrean verifikasi.
- Semua waktu disimpan UTC dan ditampilkan dalam Asia/Jakarta.
- Bahasa Indonesia.

## Sasaran

1. Hitung mundur terlihat jelas di pesanan yang belum dibayar, akurat sampai detik.
2. Pesanan lewat batas otomatis berstatus hangus tanpa campur tangan admin.
3. Tiga email terkirim pada titik yang tepat: saat pesanan dibuat, saat sisa waktu tinggal separuh, dan saat hangus.
4. Kuitansi bisa dilihat penuh di layar ponsel lalu diunduh.
5. Halaman transaksi punya satu aksi utama per keadaan, tanpa tumpukan lencana dan kartu bersarang.

## Bukan sasaran

- Pembayaran otomatis lewat gateway.
- Perpanjangan waktu bayar. Pesanan hangus dibuat baru.
- Pengembalian dana otomatis.
- Kuitansi untuk pesanan hangus atau ditolak.

## Anti sasaran

- Pelanggan yang sudah transfer kehilangan pesanannya karena batas waktu.
- Hitung mundur berbeda antara layar dan server.
- Email pengingat terkirim untuk pesanan yang sudah lunas.
- Kuitansi berubah setelah terbit.

## Rancangan

### Status pesanan

Status bertambah satu: `hangus`. Urutannya:

`menunggu_bayar` → `menunggu_verifikasi` → `lunas` | `ditolak`
`menunggu_bayar` → `hangus` (lewat 10 menit tanpa bukti)

`hangus` bersifat final. Admin tidak bisa memverifikasinya; kalau uangnya benar sudah masuk, admin membuat kredit manual lewat koreksi yang sudah ada.

### Kolom baru

`billing_order.expires_at` timestamptz, diisi `created_at + 10 menit` saat pesanan dibuat. Pesanan lama diisi dari `created_at` masing-masing, dan yang statusnya bukan `menunggu_bayar` dibiarkan kosong.

### Penyapu

Cron baru tiap menit memanggil `POST /api/cron/order-expiry` dengan `CRON_SECRET`. Isinya satu perintah:

```sql
update billing_order set status = 'hangus'
where status = 'menunggu_bayar' and expires_at < now()
returning id
```

Tiap baris yang hangus memasukki antrean email `hangus`. Karena memakai `returning`, tidak ada pesanan yang terlewat atau terkirim dua kali.

### Antrean email pesanan

Tabel `billing_order_email`: `id`, `order_id`, `kind` (`dibuat`, `pengingat`, `hangus`), `status` (`pending`, `sent`, `failed`), `attempts`, `last_error`, `created_at`, `sent_at`. Unik pada `(order_id, kind)` supaya satu titik hanya mengirim sekali.

Email dikirim pengolah yang sama dengan kuitansi, dipanggil cron `/api/cron/invoice-mailer` yang namanya diubah menjadi `/api/cron/mailer` dan menangani dua antrean.

Tiga email:

1. **Dibuat**, langsung saat pesanan dibuat. Isi: nama paket, total, kode unik, batas waktu, cara bayar QRIS, tombol ke halaman transaksi.
2. **Pengingat**, dimasukkan ke antrean oleh penyapu yang sama ketika sisa waktu tinggal lima menit atau kurang, hanya untuk pesanan yang masih `menunggu_bayar` dan belum punya baris `pengingat`. Unik pada `(order_id, kind)` yang menjaga sekali kirim.
3. **Hangus**, dimasukkan ke antrean saat penyapu mengubah status. Isi: pesanan hangus, kode unik, tombol membuat pesanan baru.

### Hitung mundur

Server mengirim `expiresAt` pada setiap pesanan. Layar menghitung sisa waktu dari jam perangkat, lalu menyelaraskan dengan `expiresAt` setiap kali data diambil ulang, sehingga selisih jam perangkat tidak membuat status berbeda. Kalau sisa waktu habis di layar, halaman memuat ulang data sekali; server yang menentukan hangus.

Tampilan: satu baris tebal berisi `Sisa 07:32`, berubah warna saat tinggal dua menit, dan berhenti pada `Waktu habis` sebelum data ulang tiba.

### Pratinjau kuitansi

Panel samping dari kanan, lebar 420 piksel di desktop dan lembar penuh di ponsel. Isinya kuitansi yang dirender sebagai HTML dari data yang sama dengan PDF, jadi nomor, angka, dan tanggal tidak mungkin berbeda.

Kepala panel: nomor kuitansi dan tombol tutup. Badan: kop, identitas pembeli, rincian, total, catatan bukan faktur pajak. Kaki: tombol Unduh PDF, tombol Kirim ulang ke email untuk admin.

Panel dibuka dari baris kuitansi di halaman transaksi dan dari tautan di email. Untuk pesanan lunas yang belum punya kuitansi, panel menampilkan keterangan bahwa kuitansi menyusul.

Data panel diambil dari prosedur baru `invoice.preview` yang mengembalikan snapshot lengkap milik pengguna, bukan dari daftar ringkas, supaya isi panel dan PDF memakai sumber yang sama.

### Halaman transaksi

Susunannya tiga bagian, bukan tumpukan kartu:

1. **Saldaku**, satu baris angka besar per jenis kredit, tanpa kotak berwarna.
2. **Pesanan berjalan**, hanya pesanan `menunggu_bayar` dan `menunggu_verifikasi`. Tiap pesanan satu baris lebar berisi nama paket, total, kode unik, hitung mundur, dan satu tombol utama: Bayar sekarang atau Unggah bukti.
3. **Riwayat**, daftar rapat tanpa kartu: tanggal, nomor pesanan, paket, total, status sebagai teks, dan aksi sesuai status. Kuitansi muncul di sini sebagai tautan Lihat.

Lencana status berwarna dihapus. Status ditulis sebagai teks dengan satu tanda titik kecil berwarna, supaya tidak ada delapan kotak berwarna di satu layar.

Blok teks penjelasan panjang dihapus. Satu kalimat bantuan hanya muncul di keadaan kosong.

### Tampilan kuitansi

Kuitansi diperlakukan sebagai dokumen, bukan kartu aplikasi. Latar terang di kedua tema, lebar baca 560 piksel, tipografi satu keluarga dengan angka rata kanan.

Kop: nama PortoFit besar, alamat situs kecil di bawahnya, dan tulisan Kuitansi di kanan. Nomor dan tanggal dalam satu baris. Identitas pembeli. Tabel rincian dengan garis pemisah tipis hanya di atas total. Total dicetak paling besar di halaman. Kaki: catatan bukan faktur pajak dan kontak bantuan.

Di layar gelap kuitansi tetap terang, karena ia dokumen yang akan dicetak.

## Uji yang harus ada

- Pesanan lewat 10 menit berubah hangus, dan tidak ada bukti yang bisa diunggah setelahnya.
- Unggah bukti di menit kesembilan membekukan hitung mundur dan pesanan tidak dihanguskan.
- Penyapu tidak menyentuh pesanan yang sudah `menunggu_verifikasi` atau `lunas`.
- Email dibuat, pengingat, dan hangus masing-masing terkirim sekali per pesanan.
- Pratinjau kuitansi menampilkan nomor dan total yang sama dengan PDF.
- Panel menolak kuitansi milik pengguna lain.
- Hitung mundur berhenti di nol dan memicu satu kali muat ulang.

## Risiko

- Sepuluh menit sangat singkat untuk transfer bank. Mitigasi: tombol bayar dan kode unik ada di baris pertama, dan pesanan hangus tetap bisa dilihat untuk dibuat ulang.
- Cron tiap menit bisa tertinggal kalau server sibuk. Mitigasi: penyapu memakai waktu `now()` di basis data, jadi keterlambatan cron hanya menunda status, tidak membuat pesanan hidup lebih lama dari seharusnya di sisi server.
- Email pengingat bisa masuk setelah pelanggan membayar. Mitigasi: pengolah memeriksa ulang status pesanan sebelum mengirim, dan melewati pesanan yang sudah bukan `menunggu_bayar`.

## Yang diserahkan ke pelaksana

Warna aksen untuk keadaan hampir habis, teks tombol pada panel, dan apakah hitung mundur memakai format `mm:ss` atau `10:00` dengan label detik.
