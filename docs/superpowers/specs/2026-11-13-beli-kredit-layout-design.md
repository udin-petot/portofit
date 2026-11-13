# Halaman beli kredit, dokumen desain tata letak

Tanggal 13 November 2026.

## Maksud

Setelah popup pembayaran dipasang, halaman beli kredit berubah bentuk: dari tiga kartu selebar kontainer menjadi dua kartu selebar 760px. Hasilnya halaman terasa pincang. Dua kartu berhenti 224px lebih awal dari blok di bawahnya, dan sisa ruang di kanan dibiarkan kosong. Dokumen ini menyusun ulang tata letaknya untuk desktop dan ponsel, tanpa mengubah alur pembayaran yang sudah jalan.

## Yang diukur di produksi

Angka diambil dari halaman hidup pada 13 November 2026, bukan perkiraan.

| Bagian | 1440px | 1920px | 390px |
|---|---|---|---|
| Grid paket | 760px, kiri di 221 | 760px, kiri di 557 | 350px |
| Blok di bawahnya | 984px | 1032px | 350px |
| Selisih kanan | 224px | 272px | 0 |
| Tinggi satu kartu | 334px | 334px | 334px |
| Strip pesanan aktif | tidak tampil | 140px | tidak tampil |
| Blok cara bayar | 290px | 290px | 407px |

Tiga hal yang salah dari angka itu:

- Grid paket lebih sempit dari setiap blok lain, dan rata kiri. Ada takik 224 sampai 272 piksel di kanan yang terbaca sebagai halaman belum selesai.
- Kartu setinggi 334px dipakai untuk isi yang cuma butuh sekitar 220px. Ruang kosongnya jatuh di antara deskripsi dan tombol.
- Di ponsel, blok cara bayar setinggi 407px menutup halaman setelah orang sudah lewat dua tombol beli. Ia informasi pendukung yang tampil seperti isi utama.

## Keputusan

- Desktop memakai dua kolom: paket di kiri, ringkasan di kanan. Ringkasan menempel saat halaman digulir.
- Paket ditulis sebagai baris, bukan kartu. Dua paket saja tidak perlu dua kotak besar, dan baris mengikuti irama blok lain.
- Ponsel tetap satu kolom, dengan baris paket yang sama, tombol selebar layar.
- Blok cara bayar pindah ke kolom kanan di desktop, dan jadi lipatan tertutup di ponsel.
- Halaman publik `/harga` tidak ikut dua kolom. Ia memakai potongan yang sama, ditumpuk seperti sekarang.

## Desktop, 1280px ke atas

```
Buy credits                                    [My orders]
┌──────────────────────────────────┐  ┌─────────────────┐
│ strip pesanan aktif (bila ada)   │  │ Saldo kredit    │
├──────────────────────────────────┤  │ 3 lamaran       │
│ Resume + Cover Letter            │  │ 3 wawancara     │
│ 1 kredit lamaran · keterangan    │  ├─────────────────┤
│ Rp5.000              [Beli]      │  │ Cara bayar      │
├──────────────────────────────────┤  │ 1 pilih paket   │
│ Sesi Latihan Wawancara           │  │ 2 pindai QRIS   │
│ 1 kredit wawancara · keterangan  │  │ 3 unggah bukti  │
│ Rp10.000             [Beli]      │  ├─────────────────┤
└──────────────────────────────────┘  │ Syarat · Refund │
┌──────────────────────────────────┐  └─────────────────┘
│ Belum yakin? Coba alur gratis →  │     menempel
└──────────────────────────────────┘
```

- Kolom kiri `minmax(0,1fr)`, kolom kanan 320px, jarak 24px, lebar total 1080px.
- Baris paket setinggi minimal 108px: nama dan keterangan di kiri, harga dan tombol di kanan, garis pemisah tipis antar baris.
- Harga memakai ukuran 22px, bukan 32px. Di baris, angka besar berebut perhatian dengan nama paket.
- Tombol beli selebar 128px, rata kanan, sejajar antar baris.
- Strip pesanan aktif berada di kolom kiri, satu baris: nama dan sisa waktu di kiri, nominal dan tombol di kanan.
- Kolom kanan menempel (`position: sticky`, `top: 24px`), berisi saldo, cara bayar, dan tautan syarat.
- Baris "belum yakin" setinggi 56px, satu baris, tautan di kanan.

## Ponsel, di bawah 640px

- Satu kolom, urutan: judul, saldo, strip pesanan aktif, dua baris paket, baris gratis, lipatan cara bayar.
- Saldo menjadi satu baris dua kotak setinggi 60px, label 11px, angka 18px.
- Baris paket menumpuk: nama, keterangan dua baris, lalu harga 24px dan tombol selebar layar setinggi 44px.
- Strip pesanan aktif dua baris: judul dan sisa waktu di atas, nominal dan tombol di bawah.
- Cara bayar menjadi `<details>` tertutup, judulnya satu baris 44px. Isinya muncul saat dibuka.
- Tidak ada gulir mendatar. Semua blok selebar kontainer.

## Yang tidak berubah

- Alur beli, popup pembayaran, dan strip pesanan aktif.
- Nama, harga, dan isi paket.
- Halaman publik `/harga` yang tetap menumpuk potongan yang sama.
- Saldo, riwayat, dan tautan ke transaksi.

## Uji

- 1440px: tidak ada takik. Tepi kanan baris paket, baris gratis, dan kolom kanan sejajar dalam 1px.
- 1024px: satu kolom penuh. Dua kolom baru muncul di 1280px karena di bawah itu kolom kiri tinggal 392px dan baris paket jadi sempit.
- 768px: satu kolom, tanpa gulir mendatar.
- 390px: tombol beli 44px, lipatan cara bayar tertutup, halaman tidak lebih dari sekitar 1100px sebelum blok cara bayar dibuka.
- Dengan dan tanpa pesanan aktif, posisi dua baris paket tidak melompat lebih dari tinggi strip.
