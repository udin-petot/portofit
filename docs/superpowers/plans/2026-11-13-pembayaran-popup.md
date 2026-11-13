# Pembayaran QRIS manual dalam popup, rencana kerja

**Spec:** `docs/superpowers/specs/2026-11-13-pembayaran-popup-design.md`

## Batasan

- Tanpa payment gateway. Verifikasi tetap manual lewat panel admin.
- `PAYMENT_WINDOW_MS` menjadi 30 menit. `REMINDER_MS` tetap 5 menit.
- QRIS statis `/qris-portofit.png` dan kode unik tiga angka tetap dipakai.
- Pesanan tetap `total_idr = harga + kode unik`. Tidak ada perubahan skema untuk nominal.
- Kredit hanya masuk lewat `adminVerifyOrder`. Tidak ada jalur otomatis baru.
- Popup boleh ditutup kapan saja. Pesanan tidak pernah dibatalkan oleh tutupnya popup.
- Tidak ada dependensi baru.
- Semua email lewat antrean yang sudah ada.

## Review Focus

- Popup ditutup di menit ke 5, lalu dibuka lagi dari halaman transaksi. Harapan: pesanan yang sama terbuka dengan sisa waktu yang benar, bukan pesanan baru.
- Menekan beli dua kali untuk paket yang sama. Harapan: satu pesanan, bukan dua.
- Bukti diunggah di menit ke 29. Harapan: diterima, hitung mundur berhenti, pesanan tidak hangus.
- Admin memverifikasi saat popup masih terbuka. Harapan: centang muncul tanpa muat ulang.
- `?order=<id>` milik akun lain. Harapan: 404 dan popup tidak terbuka.
- Popup dibuka di ponsel 390px. Harapan: lembar bawah tidak terpotong, tombol 44px, tidak ada gulir mendatar.

---

### Task 1: Batas 30 menit dan teks waktu

**Files:** `packages/api/src/features/billing/expiry.ts`, `expiry.test.ts`, `packages/db/src/schema/billing.ts`, `packages/api/src/features/billing/order-mailer.ts`, `packages/email/src/order-mail.ts`, `packages/email/src/templates/order.tsx`.

- [ ] Ubah `PAYMENT_WINDOW_MS` menjadi `30 * 60_000` dan perbarui komentar alasannya.
- [ ] Perbarui uji di `expiry.test.ts` yang masih menyebut 60 menit, termasuk kasus `computeExpiry`.
- [ ] Ubah komentar skema `Batas bayar 10 menit` menjadi 30 menit.
- [ ] Ubah fallback `deadlineText` di `order-mailer.ts` menjadi `"30 menit sejak pesanan dibuat"`.
- [ ] Hapus angka menit dari subjek dan preview email di `order-mail.ts` dan `templates/order.tsx`.
- [ ] Jalankan `pnpm --filter @reactive-resume/api test` dan `pnpm --filter @reactive-resume/api typecheck`.
- [ ] Commit.

### Task 2: Hook unggah bukti bersama

**Files:** `apps/web/src/features/billing/use-proof-upload.ts` + `use-proof-upload.test.ts`, `apps/web/src/features/billing/transactions.tsx`.

**Produces:**
- `useProofUpload(orderId: string): { upload: (file: File) => Promise<void>; isPending: boolean; fileName: string | null; error: string | null; reset: () => void }`

- [ ] Pindahkan validasi tipe dan ukuran, `storage.uploadFile`, dan `billing.attachProof` dari `transactions.tsx` ke hook, tanpa mengubah pesan galat yang sudah ada.
- [ ] Uji: berkas `application/pdf` ditolak tanpa memanggil server, berkas 11 MB ditolak, PNG kecil memanggil kedua mutasi berurutan.
- [ ] Pakai hook di blok unggah `transactions.tsx` dan pastikan perilakunya sama.
- [ ] Commit.

### Task 3: Keadaan popup

**Files:** `apps/web/src/features/billing/payment-phase.ts` + `payment-phase.test.ts`.

**Produces:**
- `type PaymentPhase = "menyiapkan" | "menunggu" | "mengunggah" | "menunggu_dicek" | "lunas" | "kedaluwarsa" | "ditolak" | "galat"`
- `paymentPhase(input: { status?: string; expiresAt?: Date | null; now: Date; isPending: boolean; statusErrors: number }): PaymentPhase`

- [ ] Uji: status kosong menghasilkan `menyiapkan`; `menunggu_bayar` dengan `expiresAt` lewat menghasilkan `kedaluwarsa`; `menunggu_verifikasi` menghasilkan `menunggu_dicek`; `lunas`, `hangus`, dan `ditolak` dipetakan apa adanya; `isPending` menghasilkan `mengunggah`; tiga galat status menghasilkan `galat`.
- [ ] Jalankan uji, lihat gagal, lalu implementasikan sebagai fungsi murni.
- [ ] Commit.

### Task 4: Popup pembayaran, desktop dan ponsel

**Files:** `apps/web/src/features/billing/payment-dialog.tsx`, `qr-morph.tsx`, `payment-dialog.test.tsx`.

**Consumes:** `useProofUpload`, `paymentPhase`, `Countdown`, `QRIS_IMAGE_PATH`, `formatRupiah`.

**Produces:** `<PaymentDialog orderId={string | null} onClose={() => void} />`

- [ ] Dialog `role="dialog"` dengan `aria-modal`, fokus awal pada tombol tutup, fokus terkunci di dalam, `aria-live="polite"` pada baris keadaan, dan Escape yang menutup kecuali saat mengunggah.
- [ ] Desktop: lebar 460px, sudut 14px, latar gelap `rgba(0,0,0,0.55)`, tinggi maksimum 90vh dengan badan yang menggulir dan aksi yang menetap.
- [ ] Ponsel di bawah 640px: lembar dari bawah, sudut atas 16px, pegangan di tengah, tinggi maksimum 92svh, tombol tutup 44px, tombol aksi 44px penuh, padding bawah ditambah `env(safe-area-inset-bottom)`.
- [ ] Keadaan menunggu: QR 240px dari `QRIS_IMAGE_PATH`, total `formatRupiah(totalIdr)`, kode unik di baris sendiri dengan tombol salin `navigator.clipboard.writeText`, hitung mundur dari `expiresAt`, tombol unggah, tautan WhatsApp, dan tombol tutup.
- [ ] `qr-morph.tsx`: satu kotak 240px dengan empat isi, QR, jam, centang, silang; perpindahan `opacity` dan `scale` 320ms; `prefers-reduced-motion` mematikannya.
- [ ] Keadaan menunggu dicek, lunas, kedaluwarsa, ditolak, dan galat sesuai tabel di spec, termasuk tombol invoice dan buat pesanan baru.
- [ ] Polling `billing.orderStatus` 5 detik selama 30 detik pertama setelah unggah, lalu 15 detik, berhenti di keadaan akhir, dan membaca ulang saat `visibilitychange`.
- [ ] Uji komponen: keadaan lunas menampilkan jumlah kredit dan nomor invoice, keadaan kedaluwarsa menampilkan tombol buat pesanan baru, berkas PDF tidak memanggil server, tombol tutup nonaktif saat mengunggah.
- [ ] Commit.

### Task 5: Pesanan aktif dan status untuk popup

**Files:** `packages/api/src/features/billing/service.ts`, `dto/billing.ts`, `router.ts`.

**Produces:**
- `billingService.orderStatus(userId, orderId)` membalas `{ status, paidAt, credits, planName, totalIdr, uniqueCode, expiresAt, rejectionReason, invoiceNumber }`.
- `billingService.activeOrder(userId)` membalas pesanan `menunggu_bayar` dengan `expiresAt` paling dekat, atau null.
- `createOrder` mengembalikan pesanan aktif untuk `planCode` yang sama bila belum lewat batas.

- [ ] Tambah `orderStatus`; pesanan milik akun lain dibalas `NOT_FOUND`, sama seperti `invoice.download`.
- [ ] Tambah `activeOrder` dan prosedur `billing.activeOrder`.
- [ ] Ubah `createOrder`: cari pesanan `menunggu_bayar` untuk pengguna dan paket yang sama dengan `expiresAt` di masa depan; bila ada, kembalikan itu. Bila belum ada, buat baru seperti sekarang.
- [ ] Tambah prosedur `billing.orderStatus` dengan input `{ orderId }`.
- [ ] Uji: pesanan akun lain ditolak, `createOrder` dua kali menghasilkan satu pesanan, pesanan yang sudah lewat batas tidak dipakai ulang.
- [ ] Commit.

### Task 6: Pasang popup dan jalur buka lagi

**Files:** `apps/web/src/features/billing/pricing.tsx`, `apps/web/src/routes/dashboard/beli-kredit.tsx`, `apps/web/src/routes/dashboard/transaksi.tsx`, `apps/web/src/features/billing/transactions.tsx`.

- [ ] `buy()` tidak lagi bernavigasi. Ia memanggil `createOrder`, menyimpan `order.id` ke state, lalu membuka `PaymentDialog`.
- [ ] Halaman transaksi menerima `?order=<id>` lewat `validateSearch` dan membuka dialog yang sama saat dimuat.
- [ ] Blok "Finish the payment" dihapus. Baris `menunggu_bayar` mendapat tombol "Lanjutkan bayar" yang membuka dialog.
- [ ] Strip pesanan aktif di halaman beli kredit memakai `billing.activeOrder`, berisi nama paket, total, `Countdown`, dan tombol "Lanjutkan".
- [ ] Setelah `lunas`, `invalidateQueries` untuk `billing.balances`, `billing.activeOrder`, dan `invoice.list`.
- [ ] Commit.

### Task 7: Halaman beli kredit

**Files:** `apps/web/src/features/billing/pricing.tsx`, `apps/web/src/routes/dashboard/beli-kredit.tsx`.

- [ ] Dua kartu berbayar dirender lebih dulu dalam grid `md:grid-cols-2` dengan lebar maksimum 760px, tinggi sama lewat `h-full`, harga `text-[32px]`, dan tombol di dalam `mt-auto`.
- [ ] Kartu gratis menjadi strip tipis di bawah grid: satu baris teks dan tautan "Coba gratis", bukan kartu setinggi isi.
- [ ] Baris bantu di bawah tombol menjadi "Bayar QRIS, dicek admin, kredit masuk setelah lolos".
- [ ] Blok "How to pay" ditulis ulang tiga baris sesuai spec.
- [ ] Kotak saldo diberi `border border-line`, angka rata kanan, dan tombol aksi 44px di ponsel.
- [ ] Commit.

### Task 8: Halaman transaksi

**Files:** `apps/web/src/features/billing/transactions.tsx`.

- [ ] Tiap baris pesanan memakai chip status berwarna dari `ORDER_STATUS_TONE`, menempel pada judul.
- [ ] Di bawah 640px, susunan baris menjadi: judul dan chip sebaris, nominal di kanan atas, satu baris meta ringkas berisi tanggal dan kode unik, lalu tombol aksi selebar baris. Nominal tidak lagi berbagi baris dengan tombol.
- [ ] Baris yang dibuka menampilkan garis waktu singkat: dibuat, bukti dikirim, diverifikasi, memakai `createdAt`, `verifiedAt`, dan `status`.
- [ ] Baris `hangus` dan `ditolak` mendapat tombol "Buat pesanan baru".
- [ ] Tombol bantuan mengambang dinaikkan 12px dari bilah bawah pada ponsel.
- [ ] Commit.

### Task 9: Invoice PDF dan email invoice

**Files:** `packages/pdf/src/invoice.tsx`, `packages/pdf/src/invoice.test.tsx`, `packages/email/src/templates/invoice.tsx`.

- [ ] Hapus baris total di bawah tabel; kotak hijau menjadi satu satunya total.
- [ ] Pindahkan kode unik ke ringkasan atas sebagai "Kode unik pembayaran".
- [ ] Ganti blok tanda tangan dengan satu baris "Diverifikasi admin pada {tanggal}".
- [ ] Email invoice menambah baris jumlah kredit yang masuk di atas tombol.
- [ ] Uji: PDF tetap satu halaman, memuat kode unik, dan tidak memuat dua baris total.
- [ ] Commit.

### Task 10: Email pesanan

**Files:** `packages/email/src/order-mail.ts`, `packages/email/src/templates/order.tsx`, `packages/api/src/features/billing/order-mailer.ts`.

- [ ] Subjek menjadi "Selesaikan pembayaran PortoFit", "Pesanan PortoFit menunggu kamu", dan "Pesanan PortoFit kedaluwarsa".
- [ ] Badan email: nominal `text-[28px]`, kode unik di baris sendiri, batas bayar dari `deadline`, dan nomor pesanan.
- [ ] Tombol menuju `${APP_URL}/dashboard/transaksi?order=${orderId}`.
- [ ] Uji: ketiga jenis email dirender dengan data contoh dan subjek tidak memuat angka menit.
- [ ] Commit.

### Task 11: Uji produksi dan bersih bersih

- [ ] Deploy, lalu uji dengan akun uji: beli, tutup popup, buka lagi dari halaman transaksi, sisa waktu benar.
- [ ] Uji tekan beli dua kali untuk paket yang sama, hanya satu pesanan yang lahir.
- [ ] Unggah bukti dari popup, verifikasi admin saat popup masih terbuka, centang muncul.
- [ ] Uji kedaluwarsa dengan mengubah `expiresAt` pesanan uji lewat SQL ke waktu lampau, cron menutupnya, popup berganti silang.
- [ ] Uji tolak bukti, lalu unggah bukti lain dari popup.
- [ ] Tangkap layar 390px dan 1440px untuk halaman beli kredit, popup, dan transaksi. Periksa tidak ada gulir mendatar dan tombol ponsel minimal 44px.
- [ ] Hapus akun uji, pesanan uji, dan baris antrean yang tersisa.
- [ ] Commit dan deploy.
