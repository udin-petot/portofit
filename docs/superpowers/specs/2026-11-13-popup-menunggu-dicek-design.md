# Popup menunggu pemeriksaan, dokumen desain

Tanggal 13 November 2026.

## Maksud

Keadaan `menunggu_dicek` di popup pembayaran sekarang cuma ikon jam statis 38px di dalam lingkaran 84px, di tengah kotak 240px. Isinya terbaca seperti placeholder, bukan keadaan hidup. Dokumen ini mengganti tanda itu dengan jam analog yang berjalan, dan merapikan komposisi keadaan tersebut.

## Yang diukur di produksi

Diambil dari popup hidup pada 13 November 2026 dengan pesanan berstatus `menunggu_verifikasi`.

| Hal | Nilai |
|---|---|
| Kotak tanda | 240px, ikon 38px di lingkaran 84px |
| Tinggi dialog desktop | 470px, isi 4 blok bertumpuk |
| Tinggi lembar ponsel | 678px dari 844px layar |
| Nama paket muncul | 3 kali (ringkasan, kotak rincian, latar) |
| Nominal muncul | 2 kali |
| Label nominal | "Total to pay", padahal bukti sudah dikirim |

## Keputusan

- Bentuk jamnya tetap ikon `clock` yang sudah dipakai sekarang, tidak digambar ulang. Yang ditambah cuma satu jarum detik tipis yang berputar, satu putaran per menit, mulai dari detik saat popup dibuka.
- Tidak ada tanda jam, angka, atau ornamen. Yang bergerak hanya jarum itu, jadi bentuk aslinya tetap sederhana dan tinggal hidup.
- Gerak memakai satu animasi CSS `linear`, bukan pulsa atau denyut. Jam memang bergerak lurus dan terus, jadi bentuk geraknya masuk akal, bukan hiasan.
- `prefers-reduced-motion` menghentikan ketiga jarum di posisi waktu saat dibuka. Jam tetap terbaca, hanya tidak bergerak.
- Kotak tetap 240px supaya perpindahan QR ke tanda keadaan tidak menggeser tata letak.
- Keadaan ini berhenti menampilkan blok ringkasan nominal di atas. Nominal, paket, dan status pindah ke satu kotak rincian tiga baris.
- Judul menjadi "Checking your proof", satu kalimat dengan isi. Frasa "Proof sent" sebagai judul kecil dihapus karena mengulang maksud judul.
- Label "Total to pay" tidak dipakai lagi setelah bukti terkirim.

## Kenapa bukan pemintal atau titik berdenyut

Pemintal dan titik berdenyut adalah gerak tanpa akhir yang tidak membawa informasi: keduanya bilang "tunggu" tanpa memberi tahu apa yang ditunggu. Jam membawa arti yang sama sekali lain, yaitu ada manusia yang memeriksa dan waktu berjalan. Karena geraknya lambat dan lurus, ia tidak berebut perhatian dengan teks, dan hanya satu elemen di layar yang bergerak.

## Susunan

```
Dialog 460 (desktop)                Lembar 390 (ponsel)
┌──────────────────────────┐        ┌──────────────────┐
│ Checking your proof    ✕ │        │      ▬▬▬         │
│                          │        │ Checking your…   │
│         ╭────╮           │        │      ╭────╮      │
│         │ 10:19          │        │      │ 10:19    │
│         ╰────╯           │        │      ╰────╯      │
│  Proof sent. Admin…      │        │ Proof sent. …    │
│  Credits land…           │        │                  │
│ ┌──────────────────────┐ │        │ ┌──────────────┐ │
│ │ Plan    Resume + …   │ │        │ │ Plan  Resume │ │
│ │ Paid    Rp5.489      │ │        │ │ Paid  Rp5.489│ │
│ │ Status  ● In review  │ │        │ │ Status ● In… │ │
│ └──────────────────────┘ │        │ └──────────────┘ │
│ [        Close        ]  │        │ [    Close    ]  │
│ We email you the moment… │        │ We email you…    │
└──────────────────────────┘        └──────────────────┘
```

- Lingkaran kuning 96px di desktop dan 88px di ponsel, ikon 52px dan 48px, di dalam kotak 240px. Jarum detik 2px, panjang 24px dan 22px, berpangkal di titik tengah ikon.
- Jarum detik setipis 2px supaya tidak bersaing dengan jarum ikon. Warnanya sama dengan ikon, jadi tidak menambah warna baru.
- Kotak rincian tiga baris, 13px, label 12px, pemisah `border-line`.
- Status memakai chip kecil "In review" dengan titik, bukan teks biasa, karena statusnya memang keadaan yang sedang berlangsung.
- Jarak: 18px antar blok di desktop, 14px di ponsel. Catatan kaki 11px dengan jarak 6px dari tombol.

## Yang tidak berubah

- Fase lain: `menunggu`, `mengunggah`, `lunas`, `kedaluwarsa`, `ditolak`, `galat`.
- Popup tetap bisa ditutup kapan saja, pesanan tetap hidup di server.
- Tombol "Close" tetap satu-satunya aksi di keadaan ini.
- Warna lain di popup tidak disentuh.

## Uji

- 1280 dan 460: jam di tengah, tiga baris rincian rata, tidak ada gulir.
- 390: lembar tidak lebih dari 92svh, tombol Close terlihat tanpa menggulir.
- `prefers-reduced-motion: reduce`: jarum diam di posisi waktu saat dibuka.
- Jam dibuka pukul 22.19.38: jarum detik mulai di angka 38, lalu satu putaran penuh dalam 60 detik.
- Layar pembaca: jam `aria-hidden`, judul popup tetap satu-satunya heading.
