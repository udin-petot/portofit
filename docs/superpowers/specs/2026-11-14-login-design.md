# Halaman login, dokumen desain

Tanggal 14 November 2026. Halaman login dirapikan mengikuti bahasa aplikasi, dan passkey dihapus.

## Keadaan sekarang, diukur dari halaman hidup

| Hal | Nilai |
|---|---|
| Kolom | 384px, isi formulir 352px, di tengah layar 1440 |
| Judul | "Sign in to your account", sans 24px/600 |
| Panel | tidak ada, formulir mengambang di latar |
| Ikon merek | 80px mengambang di atas formulir |
| Tombol | Sign in, Passkey, Google, GitHub, LinkedIn dalam grid 2 kolom |
| Baris kedua grid | satu tombol yatim (LinkedIn), sisa ruang kosong |
| Tautan tamu | di luar formulir, terpisah |

Empat hal yang bikin terlihat belum jadi: tidak ada panel padahal semua halaman lain memakai panel bergaris, judulnya bukan typeface display, passkey duduk sejajar dengan tombol sosial seolah jenis masuk yang sama, dan grid 2 kolom menyisakan lubang.

## Keputusan

### Passkey dihapus

- Tombol passkey di `components/social-auth.tsx` dihapus, begitu juga efek autofill passkey di `pages/login.tsx`.
- `getOAuthPasskeyOptions` di `redirect.ts` dan ujinya ikut dihapus karena jadi kode mati.
- Bagian passkey di `features/settings/account/security.tsx` juga dihapus. Alasan: passkey hanya dipakai untuk masuk, jadi kalau masuknya dicabut, tombol "tambah passkey" di pengaturan menjadi kontrol yang tidak ada gunanya.
- Konsekuensi yang perlu diketahui: pengguna yang sudah mendaftarkan passkey kehilangan cara masuk itu dan harus memakai email dan kata sandi. Tidak ada data lain yang hilang.

### Susunan 1024 ke atas

Dua kolom, lebar 1080, jarak 72, rata tengah vertikal.

- Kiri: merek 26px dengan nama 15/600, judul serif 30/38 weight 500 maksimal 16 karakter per baris, satu kalimat penjelas 14px maksimal 38 karakter per baris, lalu tiga tautan tenang 13px (Prices, How it works, Help) berjarak 34px.
- Kanan: panel 420px.
- Isi panel: judul serif 30/500 "Sign in", subjudul 13,5px satu baris, dua bidang 44px dengan label di atas, tombol utama 44px selebar panel, garis "or continue with", tiga kotak sosial 44px, baris "No account? Create one".

Judul serif 30px sama dengan judul halaman akun dan Career, jadi login tidak lagi memakai ukuran sendiri.

### Bidang isian

- Label "Email or username". Kalimat bantuan "You can also sign in with your username" dihapus karena sudah ada di label.
- Tautan "Forgot?" 12,5px di kanan label kata sandi.
- Bidang 44px, `rounded-[9px]`, garis `line-2`, latar `sunken`.

### Tombol sosial

Tiga kotak sama lebar dalam satu baris, ikon 18px warna tinta penuh di atas `raised`, masing masing `aria-label`. Passkey hilang, jadi tidak ada lagi tombol yatim.

### Baris tamu

Baris tamu masuk ke dalam panel, menempel di dasar dengan garis pemisah atas dan latar sama, bukan tautan yang mengambang di luar. Hanya tampil bila `allowGuestLogin`.

### Di bawah 1024

Satu kolom. Merek di tengah, panel selebar layar dikurangi 32px, judul panel 26px, dan judul serif kiri disembunyikan. Baris tamu tetap menempel di dasar panel.

### Halaman auth lain

`report`, `forgot`, `reset`, `verify-2fa`, dan `verify-2fa-backup` tidak punya panel sendiri. Semuanya dibungkus `AuthCard` yang sama supaya tidak ada lagi halaman auth tanpa panel. Ikon merek 80px di layout dihapus dan diganti merek kecil.

## Yang tidak berubah

- Alur OAuth, redirect `callbackURL`, 2FA, dan toast galat.
- `AuthLayout` tetap ada, tapi jadi bingkai netral tanpa ikon 80px.
- Halaman consent, error, dan index tidak disentuh.

## Uji

- 1440: panel 420px, judul serif 30px, tiga kotak sosial dalam satu baris tanpa lubang.
- 390: tidak ada gulir mendatar, bidang dan tombol 44px, baris tamu menempel di dasar panel.
- Tidak ada lagi kata "Passkey" di halaman masuk dan pengaturan.
- Daftar, lupa sandi, dan verifikasi 2FA tetap bisa dibuka dan tidak dobel panel.
