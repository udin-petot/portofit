# Halaman beli kredit, rencana kerja tata letak

**Spec:** `docs/superpowers/specs/2026-11-13-beli-kredit-layout-design.md`

## Batasan

- Tidak menyentuh API, popup, atau alur bayar.
- `PricingBody` tetap dipakai halaman publik `/harga` dengan tumpukan yang sama.
- Tidak ada dependensi baru dan tidak ada string baru tanpa `lingui extract`.
- Lebar kontainer tetap 1080px dengan padding 24px.
- Tombol aksi minimal 44px di ponsel.

## Review Focus

- Buka halaman dengan pesanan aktif, lalu tutup popupnya. Harapan: baris paket tidak melompat lebih dari tinggi strip.
- Buka di 1024px. Harapan: dua kolom masih muat, tidak ada gulir mendatar.
- Buka di 768px. Harapan: sudah satu kolom, kolom kanan pindah ke bawah tanpa menyisakan ruang kosong.
- Buka di 390px dengan huruf diperbesar 150 persen. Harapan: harga dan tombol tidak bertabrakan, tombol tetap 44px.
- Halaman publik `/harga`. Harapan: tetap menumpuk potongan yang sama, tidak ada kolom kanan kosong.

---

### Task 1: Pecah potongan harga

**Files:** `apps/web/src/features/billing/pricing.tsx`.

**Produces:**
- `PlanList({ signedIn, onOrder })` berisi baris paket saja.
- `FreeNote({ signedIn })` satu baris ajakan coba gratis.
- `HowToPay()` blok cara bayar yang bisa dilipat.
- `PricingBody` merangkai ketiganya untuk halaman publik.

- [ ] Pindahkan isi kartu paket menjadi `PlanRow` di file yang sama: nama, unit, keterangan, harga, tombol.
- [ ] `HowToPay` memakai `<details>` dengan `open` di `sm` ke atas lewat state, bukan CSS, supaya isinya tetap terbaca pembaca layar.
- [ ] `PricingBody` memanggil ketiganya bertumpuk, tanpa perubahan tampilan publik yang berarti.
- [ ] Typecheck.
- [ ] Commit.

### Task 2: Baris paket

**Files:** `apps/web/src/features/billing/pricing.tsx`.

- [ ] Desktop `sm:flex sm:items-center sm:justify-between`, tinggi minimal 108px, garis pemisah `border-line` antar baris.
- [ ] Harga `text-[22px]`, tombol `w-32` rata kanan, sejajar antar baris lewat `items-center`.
- [ ] Ponsel: kolom, harga `text-2xl` dan tombol `h-11 w-full`.
- [ ] Keterangan dipotong dua baris di ponsel (`line-clamp-2`).
- [ ] Commit.

### Task 3: Dua kolom halaman beli kredit

**Files:** `apps/web/src/routes/dashboard/beli-kredit.tsx`.

- [ ] Grid `lg:grid-cols-[minmax(0,1fr)_320px]` dengan `gap-6`, kepala halaman membentang penuh di atas grid.
- [ ] Kolom kiri: strip pesanan aktif, `PlanList`, `FreeNote`.
- [ ] Kolom kanan: kartu saldo, `HowToPay`, tautan syarat dan refund, `lg:sticky lg:top-6`.
- [ ] Di bawah 1024px kolom kanan turun ke bawah kolom kiri, urutan: paket, gratis, saldo, cara bayar.
- [ ] Commit.

### Task 4: Strip pesanan aktif satu baris

**Files:** `apps/web/src/routes/dashboard/beli-kredit.tsx`.

- [ ] Desktop: nama dan sisa waktu di kiri, nominal dan tombol di kanan, satu baris, tinggi sekitar 72px.
- [ ] Ponsel: dua baris, tombol `h-11 w-full`.
- [ ] Commit.

### Task 5: Lipatan cara bayar

**Files:** `apps/web/src/features/billing/pricing.tsx`.

- [ ] Ponsel: `<details>` tertutup, judul "How to pay" 44px dengan ikon panah, isi tiga langkah.
- [ ] Desktop: selalu terbuka, tanpa pegangan lipatan.
- [ ] Halaman publik memakai versi terbuka.
- [ ] Commit.

### Task 6: Uji lebar dan tangkap layar

- [ ] 1440, 1024, 768, 390. Periksa tidak ada gulir mendatar dan tepi kanan sejajar.
- [ ] Dengan pesanan aktif dan tanpa pesanan aktif.
- [ ] Tangkap layar desktop dan ponsel untuk perbandingan sebelum dan sesudah.
- [ ] `lingui extract` bila ada string baru, lalu typecheck dan build.
- [ ] Commit.
