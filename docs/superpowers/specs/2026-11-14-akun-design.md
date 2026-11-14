# Halaman akun, dokumen desain

Tanggal 14 November 2026. Revisi ketiga: halaman akun memakai bahasa visual Career, bukan bahasa sendiri.

## Maksud

Halaman akun tidak cocok dengan sisa aplikasi. Dua rancangan sebelumnya mengganti bentuk kartu dan urutan, tapi tetap memakai judul sans 24px, judul bagian di dalam kartu, dan tanpa rel kanan. Career, halaman yang jadi acuan pemilik, memakai bahasa lain. Halaman akun sekarang mengikuti bahasa itu, bukan mengarang yang baru.

## Bahasa visual Career, diukur dari halaman hidup

| Hal | Nilai di Career | Nilai di halaman akun sekarang |
|---|---|---|
| Judul halaman | Newsreader, 30px, weight 500, line-height 36 | sans, 24px, weight 600 |
| Subjudul | 14px, `text-ink-2` | 14px, sama |
| Padding halaman | `px-4 py-5 md:px-10 md:py-7` | `max-w-[1080px] px-6 pt-8` |
| Judul bagian | 17px/600, di luar panel, kadang dengan badge angka | 13-14px/600, di dalam kartu |
| Panel | `rounded-xl border border-line bg-surface`, tanpa bayangan | `rounded-lg ... p-5`, judul di dalam |
| Baris dalam panel | 14px judul, 13px isi, 12px meta, ikon 16-20px | campur, beberapa 22px |
| Tata letak | kiri 1fr, rel kanan 380px | satu kolom lalu kartu selebar penuh |

Tiga selisih yang paling terasa: typeface judul, letak judul bagian, dan tidak adanya rel kanan.

## Keputusan

- Judul memakai `font-display` 30px/500, sama seperti Career dan Applications.
- Setiap bagian punya judulnya sendiri di luar panel: 17px/600, dengan badge angka bila ada jumlah.
- Panel seragam: `rounded-xl border border-line bg-surface`, baris dipisah `border-t border-line`, baris pertama tanpa garis. Tanpa bayangan, tanpa padding dalam pembungkus.
- Tata letak dua kolom: kiri profil, kredit, riwayat; kanan rel 380px berisi pengaturan dan ringkasan pesanan.
- Kredit jadi satu panel dua kolom dengan garis pemisah, angka 34px, label 12px di atas, harga 12px di bawah. Tombol "Buy credits" di baris judul bagian, bukan di dalam panel.
- Riwayat kredit: baris 14px nama, 12px tanggal, kanan delta dengan satuan dan sisa. Batas 8 baris.
- Pengaturan dan keluar di rel kanan, bukan di kolom utama.

## Susunan desktop, 1280 ke atas

```
Account
Your profile, your credits, and the trail of what you spent them on.

┌ kiri (1fr) ─────────────────────────────┐  ┌ rel 380 ─────────────┐
│ Profile                                 │  │ Settings             │
│ ┌─────────────────────────────────────┐ │  │ ┌──────────────────┐ │
│ │ (BM) Bagus Maulana                  │ │  │ │ Profile & sec  › │ │
│ │      bagusmaulana…@gmail.com        │ │  │ │ Preferences    › │ │
│ │      Joined October 2026  [Sign out]│ │  │ │ AI & developer › │ │
│ └─────────────────────────────────────┘ │  │ └──────────────────┘ │
│                                         │  │ Orders               │
│ Credits                    [Buy credits] │  │ ┌──────────────────┐ │
│ ┌──────────────────┬──────────────────┐ │  │ │ 10 paid          │ │
│ │ Application      │ Interview        │ │  │ │ 8 cancelled      │ │
│ │ 6                │ 4                │ │  │ └──────────────────┘ │
│ │ Rp5.000/credit   │ Rp10.000/credit  │ │  └──────────────────────┘
│ └──────────────────┴──────────────────┘ │
│                                         │
│ Credit history 18        See all orders │
│ ┌─────────────────────────────────────┐ │
│ │ Interview Practice Session          │ │
│ │ 14 November 2026   +1 interview  4 left │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Grid `xl:grid-cols-[minmax(0,1fr)_380px]`, jarak 32px.
- Jarak antar bagian 28px; judul bagian 10px di atas panelnya.
- Panel kredit: dua sel, `border-l` pada sel kedua, padding 16-18px.

## Ponsel, di bawah 640px

- Satu kolom, urutan: profil, kredit, riwayat 5 baris, pengaturan, keluar.
- Judul 26px `font-display`.
- Panel kredit dua kolom; tombol "Buy credits" selebar panel di bawah angka, 44px.
- Pengaturan dan keluar jadi dua panel terpisah dengan judul bagiannya sendiri.

## Yang tidak berubah

- Endpoint dan data: `billing.balances`, `billing.plans`, `billing.myOrders`, `billing.ledger`.
- Tautan ke `/dashboard/settings/*`, `/dashboard/transaksi`, `/dashboard/beli-kredit`.
- Konfirmasi keluar memakai `useConfirm`.

## Uji

- 1440: judul serif 30px, empat judul bagian di luar panel, rel kanan 380px.
- 1280 dan 1024: rel turun ke bawah kolom kiri tanpa ruang kosong di kanan.
- 390: tidak ada gulir mendatar, tombol beli 44px, baris pengaturan 44px.
- Akun kosong: angka kredit 0 tercetak, panel pesanan menulis satu kalimat, riwayat menulis satu kalimat di dalam panelnya.
