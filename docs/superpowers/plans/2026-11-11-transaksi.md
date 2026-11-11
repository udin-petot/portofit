# Transaksi, hitung mundur, dan pratinjau kuitansi, rencana kerja

**Spec:** `docs/superpowers/specs/2026-11-11-transaksi-design.md`

## Batasan

- Batas bayar 10 menit sejak pesanan dibuat.
- Bukti yang diunggah sebelum batas membekukan hitung mundur dan memindahkan pesanan ke `menunggu_verifikasi`.
- `hangus` final. Admin tidak bisa memverifikasi pesanan hangus.
- Semua email lewat antrean, bukan dikirim di dalam transaksi.
- Kuitansi di panel dan PDF memakai satu sumber data yang sama.
- Tidak ada dependensi baru.

## Review Focus

- Transfer di menit kesembilan lalu unggah bukti. Harapan: pesanan tidak hangus, masuk verifikasi.
- Dua penyapu berjalan bersamaan. Harapan: satu pesanan hanya sekali dihanguskan dan satu email hangus.
- Pengingat jatuh tempo untuk pesanan yang sudah lunas. Harapan: tidak dikirim.
- Panel kuitansi dibuka dengan id milik pengguna lain. Harapan: ditolak.
- Jam perangkat pelanggan meleset satu jam. Harapan: status di layar tetap mengikuti server.

---

### Task 1: Kolom waktu dan status hangus

**Files:** `packages/db/src/schema/billing.ts`, `apps/web/src/features/billing/config.ts`, migrasi baru.

- [ ] Tambah `expiresAt` timestamptz nullable pada `billingOrder`, plus indeks `(status, expiresAt)`.
- [ ] Tambah label `hangus: "Hangus"` dan tone netral di `ORDER_STATUS_TONE`.
- [ ] Isi migrasi: kolom, indeks, dan backfill `expires_at = created_at + interval '10 minutes'` untuk pesanan `menunggu_bayar`; pesanan lama lain dibiarkan kosong.
- [ ] `pnpm --filter @reactive-resume/db db:generate`, lalu typecheck.
- [ ] Commit.

### Task 2: Aturan waktu

**Files:** `packages/api/src/features/billing/expiry.ts` + test.

- [ ] Uji `computeExpiry(createdAt)`, `isExpired(order, now)`, `msLeft(order, now)`, `shouldRemind(order, now)`, `canAcceptProof(order)`.
- [ ] Implementasikan: `computeExpiry` menambah 10 menit; `isExpired` hanya untuk `menunggu_bayar` dan `now >= expiresAt`; `shouldRemind` benar saat sisa ≤ 5 menit dan status masih `menunggu_bayar`; `canAcceptProof` salah saat `isExpired`.
- [ ] Commit.

### Task 3: Penyapu dan antrean email pesanan

**Files:** `packages/db/src/schema/billing.ts` (tabel `billing_order_email`), `packages/api/src/features/billing/expiry-service.ts` + test, router cron.

- [ ] Tabel `billing_order_email` dengan unik `(order_id, kind)`.
- [ ] Fungsi `sweepOrders(now)` yang mengembalikan `{ expired: number; reminded: number }`: satu `update ... returning` untuk hangus, satu `insert ... on conflict do nothing` untuk pengingat.
- [ ] Uji dengan transaksi tiruan: hanya `menunggu_bayar` tersentuh; pengingat tidak dibuat dua kali.
- [ ] Commit.

### Task 4: Email pesanan

**Files:** `packages/api/src/features/billing/order-mailer.ts`, `packages/email/src/invoice-mail.ts`, `packages/email/src/templates/order-*.tsx`.

- [ ] Tiga template: dibuat, pengingat, hangus. Satu fungsi `sendOrderEmail(kind, order, plan)`.
- [ ] Pengolah memeriksa status terakhir sebelum mengirim; lewati kalau bukan `menunggu_bayar` untuk pengingat.
- [ ] Saat `createOrder`, masukkan baris `dibuat` ke antrean di transaksi yang sama.
- [ ] Ubah rute cron menjadi `/api/cron/mailer` yang memproses kuitansi dan pesanan; pertahankan rute lama sebagai alias sampai cron VPS diperbarui.
- [ ] Uji kebijakan lewati dan percobaan ulang.
- [ ] Commit.

### Task 5: Bukti membekukan waktu

**Files:** `packages/api/src/features/billing/service.ts` + test.

- [ ] `attachProof` menolak pesanan hangus atau lewat waktu dengan `BAD_REQUEST`.
- [ ] Pesanan yang masih `menunggu_bayar` dan buktinya masuk dipindahkan ke `menunggu_verifikasi` (sudah ada), dan `expiresAt` dibiarkan sebagai catatan.
- [ ] Uji: bukti di menit kesembilan diterima; bukti setelah hangus ditolak.
- [ ] Commit.

### Task 6: Pratinjau kuitansi

**Files:** `packages/api/src/features/invoice/service.ts`, `router.ts`, `apps/web/src/features/billing/invoice-sheet.tsx`.

- [ ] Prosedur `invoice.preview` mengembalikan `{ number, issuedAt, snapshot }` milik pengguna, atau `null` bila belum terbit.
- [ ] Komponen `InvoiceSheet` memakai satu fungsi format tanggal dan rupiah bersama dengan PDF.
- [ ] Uji penolakan lintas pengguna dan bentuk keluaran.
- [ ] Commit.

### Task 7: Hitung mundur dan halaman transaksi

**Files:** `apps/web/src/features/billing/transactions.tsx`, `countdown.tsx`, test.

- [ ] Komponen `Countdown` menerima `expiresAt` dan `serverNow`; menghitung sisa, berhenti di nol, memanggil `onExpire` sekali.
- [ ] Susun ulang halaman jadi Saldo, Pesanan berjalan, Riwayat. Hapus lencana warna dan blok teks panjang.
- [ ] Uji: countdown menampilkan `09:59`, berhenti di nol, tidak memanggil ulang.
- [ ] Commit.

### Task 8: Kuitansi sebagai dokumen

**Files:** `apps/web/src/features/billing/invoice-sheet.tsx`, `packages/pdf/src/invoice.tsx` + test.

- [ ] Samakan tipografi panel dan PDF: kop, nomor, pembeli, rincian, total besar, kaki.
- [ ] Uji PDF tetap satu halaman dan memuat total.
- [ ] Commit.

### Task 9: Rilis

- [ ] Deploy manual seperti biasa: push, workflow, tag image, pull, up.
- [ ] Tambah cron `* * * * *` untuk `/api/cron/mailer`.
- [ ] Uji ujung ke ujung dengan akun uji: buat pesanan, lihat hitung mundur, unggah bukti di menit kesembilan, pastikan tidak hangus; pesanan kedua dibiarkan hangus dan email tercatat.
- [ ] Bersihkan data uji, reset counter.
