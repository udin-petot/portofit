# PortoFit

PortoFit adalah platform persiapan kerja untuk pencari kerja Indonesia. Satu alur dari CV sampai wawancara: **bikin** CV dari pengalaman nyata, **review** dengan rubrik rekruter, **cocokkan** CV dan bukti kerja ke lowongan yang dituju, lalu **latihan** tes wawancara.

Situs: https://www.portofit.tech (versi pengembangan, akses masih terbatas)

## Fondasi dan atribusi

PortoFit dibangun di atas [Reactive Resume](https://github.com/reactive-resume/reactive-resume), proyek open source berlisensi MIT karya Amruth Pillai. Kami memakai fondasinya, lalu menambahkan lapisan PortoFit: bahasa Indonesia sebagai bawaan, naskah produk sendiri, serta rencana fitur bukti kerja dan jalur harga. Lisensi MIT dan atribusi ke penulis asli dipertahankan, lihat [`LICENSE`](./LICENSE).

## Yang sudah jalan di kode

- Pembuat CV dan cover letter, banyak template, ekspor PDF dan DOCX, impor PDF dan DOCX
- Pemeriksa ATS setelah ekspor: format, kata kunci, keterbacaan
- Pencocokan CV dengan iklan lowongan yang ditempel
- Pelacak lamaran: status, wawancara, tawaran, pengingat lewat cron
- Asisten AI dan career coach (butuh `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`)
- Masuk dengan Google, GitHub, atau LinkedIn (butuh kunci OAuth)
- Impor riwayat dari file ekspor LinkedIn
- Antarmuka Indonesia dan Inggris, tombol ganti bahasa di header dan footer

## Yang sedang dikerjakan

- Bukti kerja dari GitHub dan LinkedIn: link portofolio dirangkum jadi poin CV yang bisa dilacak ke sumbernya
- Jalur harga freemium: cek dasar gratis, bayar per CV dan per sesi latihan wawancara
- Bank soal wawancara untuk bidang IT

## Menjalankan sendiri

Monorepo pnpm (Node 24) dengan PostgreSQL.

```bash
pnpm install
pnpm dev
```

Variabel lingkungan yang wajib diisi: `APP_URL`, `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_SECRET`. Daftar lengkap dan nilai contoh ada di [`.env.example`](./.env.example). Fitur AI, SMTP, OAuth, dan pencarian lowongan hanya menyala kalau kuncinya diisi.

Panduan self-hosting, arsitektur, dan API mengikuti dokumentasi Reactive Resume di [docs.rxresu.me](https://docs.rxresu.me) karena kode dasarnya sama.

## Build dan deploy

Image dibangun lewat `.github/workflows/docker-build.yml` (dipicu manual, bukan oleh `git push`) dan dipublikasikan sebagai `ghcr.io/udin-petot/portofit:sha-<commit>`.

## Batasan yang kami pegang

- Tidak ada fitur kirim lamaran otomatis atau massal. Batasan ini sengaja: melanggar aturan platform dan berisiko membuat akun pengguna diblokir.
- Tidak ada janji lolos seleksi. Skor dan saran bersifat perbaikan, bukan jaminan.
- Tidak memakai mitos "sekian persen CV ditolak ATS". Format ramah ATS kami perlakukan sebagai fitur, bukan statistik.

## Lisensi

MIT. Kode asli (c) Amruth Pillai, Reactive Resume. Atribusi wajib dipertahankan kalau kode ini dipakai ulang.
