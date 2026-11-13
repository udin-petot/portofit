# Popup menunggu pemeriksaan, rencana kerja

**Spec:** `docs/superpowers/specs/2026-11-13-popup-menunggu-dicek-design.md`

## Batasan

- Tidak menyentuh API, status pesanan, atau fase lain.
- Tanpa dependensi baru. Jam digambar dengan SVG biasa.
- String baru wajib `lingui extract` sebelum build.
- Gerak hanya `transform` dan `opacity`, tanpa animasi JS per frame.
- `prefers-reduced-motion` wajib dihormati.

## Review Focus

- Buka `?order=` dengan status `menunggu_verifikasi` di 1280. Harapan: tidak ada ringkasan nominal di atas, hanya jam, kalimat, kotak rincian, tombol.
- Buka di 390. Harapan: tombol Close terlihat tanpa menggulir, lembar tidak lebih dari 92svh.
- Nyalakan reduced motion di sistem. Harapan: jarum diam, jam tetap terbaca.
- Buka pukul 22.19. Harapan: jarum jam di antara 10 dan 11, menit di 19, detik di 38.
- Tutup dan buka lagi. Harapan: posisi jarum mengikuti waktu saat dibuka, bukan waktu render pertama.

---

### Task 1: Jarum yang berputar

**Files:** `apps/web/src/features/billing/waiting-clock.tsx` (baru), `waiting-clock.test.ts` (baru).

- [ ] Komponen `WaitingClock({ size })` membungkus `Icon name="clock"` di dalam lingkaran `bg-warn-soft`, tanpa menggambar ulang bentuk jam.
- [ ] Satu jarum `span` 2px, tinggi 24px, `bottom-1/2`, `left-1/2 -translate-x-1/2`, `origin-bottom`, berputar dengan `animation: spin 60s linear infinite`.
- [ ] `animation-delay` negatif sebesar detik sekarang, jadi jarum mulai di posisi detik saat popup dibuka, bukan di 12.
- [ ] Fungsi kecil `secondOffset(date)` mengembalikan detik 0 sampai 59. Uji: 22.19.38 memberi 38.
- [ ] `motion-reduce:animate-none` pada jarum. Ikon dan jarum `aria-hidden`.
- [ ] Commit.

### Task 2: Pasang di kotak tanda

**Files:** `apps/web/src/features/billing/qr-morph.tsx`.

- [ ] `menunggu_dicek` memakai `WaitingClock` di dalam kotak 240px yang sama, menggantikan ikon jam di lingkaran.
- [ ] Transisi silang QR ke jam tetap `opacity` dan `scale`, 300ms, `motion-reduce` tanpa transisi.
- [ ] Tanda `lunas`, `kedaluwarsa`, `ditolak`, `galat` tidak berubah.
- [ ] Commit.

### Task 3: Susun ulang isi keadaan

**Files:** `apps/web/src/features/billing/payment-dialog.tsx`.

- [ ] Keadaan `menunggu_dicek` tidak lagi menampilkan blok ringkasan nominal di atas.
- [ ] Ganti dengan satu kotak rincian tiga baris: Plan, Paid, Status. Baris Status memakai chip "In review" dengan titik.
- [ ] Judul menjadi "Checking your proof". Hapus judul kecil "Proof sent", kalimatnya digabung ke paragraf.
- [ ] Jarak 18px di desktop, 14px di ponsel. Catatan kaki 6px di bawah tombol.
- [ ] Label "Total" dipakai untuk semua fase setelah bukti terkirim, "Total to pay" hanya untuk `menunggu` dan `mengunggah`.
- [ ] Commit.

### Task 4: Teks dan katalog

- [ ] `pnpm --filter web exec lingui extract`, isi katalog id-ID untuk tiga string baru: "Checking your proof", "Status", "In review".
- [ ] Typecheck dan build.
- [ ] Commit.

### Task 5: Uji lebar dan tangkap layar

- [ ] 1280, 460, 390. Tidak ada gulir mendatar, tombol Close terlihat.
- [ ] Reduced motion: jarum diam.
- [ ] Positif: jam dibuka 22.19 menampilkan jarum sesuai.
- [ ] Tangkap layar desktop dan ponsel untuk perbandingan.
- [ ] Deploy dan periksa di produksi dengan pesanan uji, lalu hapus pesanan uji.
