export type BankLevel = "Dasar" | "Menengah" | "Lanjut";

export type BankCategory = "Umum & perilaku" | "Backend" | "Frontend" | "Data" | "QA & testing" | "Negosiasi & karier";

export type BankQuestion = {
	id: string;
	category: BankCategory;
	level: BankLevel;
	/** The question as the interviewer would say it. */
	text: string;
	/** What the interviewer is actually testing. */
	why: string;
	/** Concrete signals a strong answer contains. */
	rubric: string[];
	/** Likely follow-ups, so the candidate isn't surprised. */
	followUps: string[];
};

export const BANK_CATEGORIES: BankCategory[] = [
	"Umum & perilaku",
	"Backend",
	"Frontend",
	"Data",
	"QA & testing",
	"Negosiasi & karier",
];

/**
 * A curated Indonesian IT interview bank. Deliberately deterministic: no AI is needed to show the question or the
 * rubric, and every entry is a question a real interviewer in Indonesia could ask. Keep entries free of company
 * claims and of numbers we cannot back up.
 */
export const PRACTICE_BANK: BankQuestion[] = [
	{
		id: "umum-proyek-bangga",
		category: "Umum & perilaku",
		level: "Dasar",
		text: "Ceritakan proyek yang paling kamu banggakan. Apa peranmu, dan bagaimana kamu mengukur hasilnya?",
		why: "Menguji kejelasan peran, kepemilikan pekerjaan, dan kebiasaan mengukur hasil, bukan sekadar menyebut teknologi.",
		rubric: [
			"Situasi dan tujuan proyek dijelaskan singkat, tanpa berputar.",
			"Peran pribadi jelas: apa yang kamu kerjakan sendiri versus kontribusi tim.",
			"Ada ukuran hasil yang konkret (waktu, error, pengguna, biaya), bukan hanya 'berhasil'.",
			"Menutup dengan pembelajaran atau keputusan yang kamu ubah setelah proyek itu.",
		],
		followUps: ["Kalau diulang, apa yang akan kamu lakukan berbeda?", "Bagian mana yang paling sulit, dan kenapa?"],
	},
	{
		id: "umum-konflik",
		category: "Umum & perilaku",
		level: "Menengah",
		text: "Ceritakan konflik teknis dengan rekan tim. Bagaimana kamu menyelesaikannya?",
		why: "Melihat cara menangani perbedaan pendapat tanpa menjatuhkan orang lain, dan apakah keputusan diambil dengan bukti.",
		rubric: [
			"Fokus pada masalah dan keputusan, bukan menilai pribadi rekan.",
			"Menjelaskan posisi kedua pihak secara adil.",
			"Cara penyelesaian konkret: data, eksperimen kecil, atau kompromi yang disepakati.",
			"Hasil dan hubungan kerja setelah konflik tetap sehat.",
		],
		followUps: ["Apa yang kamu lakukan kalau rekan tetap tidak setuju?", "Siapa yang akhirnya memutuskan?"],
	},
	{
		id: "umum-tugas-baru",
		category: "Umum & perilaku",
		level: "Menengah",
		text: "Kamu diberi tugas yang belum pernah kamu kerjakan dengan tenggat seminggu. Apa yang kamu lakukan?",
		why: "Menguji cara belajar cepat, memecah masalah, dan keberanian meminta bantuan sebelum terlambat.",
		rubric: [
			"Memecah tugas menjadi bagian yang bisa dikerjakan dan diuji.",
			"Menjelaskan sumber belajar yang dipakai (dokumentasi, kode lama, orang yang lebih paham).",
			"Menyebut cara memvalidasi pemahaman di tengah jalan, bukan di akhir.",
			"Jujur soal batas kemampuan dan cara mengomunikasikan risiko ke atasan.",
		],
		followUps: ["Bagaimana kamu tahu kamu sudah cukup paham untuk mulai?", "Apa yang kamu lakukan kalau ternyata tidak selesai seminggu?"],
	},
	{
		id: "umum-kegagalan",
		category: "Umum & perilaku",
		level: "Menengah",
		text: "Ceritakan kegagalan terbesar dalam proyek. Apa yang kamu pelajari, dan apa yang berubah setelah itu?",
		why: "Menguji kejujuran, kepemilikan atas kesalahan, dan apakah pembelajaran benar-benar mengubah cara kerja.",
		rubric: [
			"Mengakui kesalahan sendiri, bukan menyembunyikannya di balik faktor luar.",
			"Menjelaskan dampak nyata dan cara menghentikan kerugian.",
			"Ada perubahan proses yang bertahan setelah kejadian itu.",
			"Tidak memilih 'kegagalan palsu' yang sebenarnya pujian.",
		],
		followUps: ["Siapa yang terdampak, dan bagaimana kamu memberi tahu mereka?", "Bagaimana kamu mencegah hal yang sama terulang?"],
	},
	{
		id: "umum-kenapa-posisi",
		category: "Umum & perilaku",
		level: "Dasar",
		text: "Kenapa kamu tertarik pada posisi ini, dan bagaimana kamu menilai kecocokanmu?",
		why: "Melihat apakah kandidat sudah membaca peran dan perusahaan, atau hanya melamar massal.",
		rubric: [
			"Menyebut hal spesifik dari peran atau produk, bukan pujian umum.",
			"Menghubungkan pengalaman sendiri dengan kebutuhan peran.",
			"Jujur menyebut area yang masih perlu dipelajari.",
			"Menunjukkan pertanyaan balik yang relevan tentang tim atau pekerjaan.",
		],
		followUps: ["Bagian mana dari peran ini yang paling menantang untukmu?", "Apa yang kamu harapkan dari atasan langsung?"],
	},
	{
		id: "backend-sql-nosql",
		category: "Backend",
		level: "Dasar",
		text: "Jelaskan perbedaan SQL dan NoSQL, lalu kapan kamu memilih masing-masing.",
		why: "Menguji pemahaman model data dan trade-off, bukan hafalan daftar database.",
		rubric: [
			"Menjelaskan perbedaan pada tingkat model data dan konsistensi, bukan hanya 'tabel vs dokumen'.",
			"Menyebut contoh nyata: transaksi keuangan vs konten yang bentuknya berubah-ubah.",
			"Mengakui bahwa skala bukan satu-satunya alasan memilih NoSQL.",
			"Bisa menjelaskan konsekuensi operasional (migrasi, query, biaya).",
		],
		followUps: ["Kalau data butuh relasi tapi volumenya besar, apa yang kamu lakukan?", "Apa yang paling sulit saat migrasi dari satu model ke model lain?"],
	},
	{
		id: "backend-desain-api",
		category: "Backend",
		level: "Menengah",
		text: "Bagaimana kamu mendesain satu API yang dipakai aplikasi mobile dan web sekaligus?",
		why: "Menguji keputusan desain yang mempertimbangkan klien berbeda, versi, dan kegagalan jaringan.",
		rubric: [
			"Kontrak stabil: versi, format error, dan penamaan yang konsisten.",
			"Pagination, filter, dan field selection untuk kebutuhan klien berbeda.",
			"Autentikasi dan otorisasi dipisahkan dari logika bisnis.",
			"Rencana perubahan yang tidak memutus klien lama (deprecation, versioning).",
		],
		followUps: ["Bagaimana kamu menangani klien yang masih memakai versi lama?", "Di mana kamu menaruh logika yang berbeda antara mobile dan web?"],
	},
	{
		id: "backend-url",
		category: "Backend",
		level: "Menengah",
		text: "Apa yang terjadi sejak kamu mengetik URL sampai halaman tampil?",
		why: "Menguji pemahaman rantai request dan kemampuan memilih kedalaman jawaban sesuai peran.",
		rubric: [
			"Urutan jelas: DNS, koneksi, TLS, HTTP request, server, respons, render.",
			"Menyebut titik yang bisa gagal atau lambat di tiap tahap.",
			"Tidak berhenti di 'browser mengirim request'; menjelaskan peran server dan cache.",
			"Mau memperdalam bagian yang relevan dengan posisi (mis. cache, load balancer).",
		],
		followUps: ["Di tahap mana caching paling berpengaruh?", "Apa yang berubah kalau situsnya pakai CDN?"],
	},
	{
		id: "backend-pembayaran",
		category: "Backend",
		level: "Lanjut",
		text: "Bagaimana kamu menangani pembayaran yang gagal di tengah proses?",
		why: "Menguji pemahaman idempotensi, konsistensi status, dan rekonsiliasi dengan pihak ketiga.",
		rubric: [
			"Status transaksi eksplisit dan tidak pernah 'setengah jadi'.",
			"Operasi aman diulang (idempotency key) saat retry atau timeout.",
			"Ada mekanisme rekonsiliasi dengan penyedia pembayaran, bukan hanya mengandalkan callback.",
			"Pengguna mendapat status yang jelas dan tidak ditagih dua kali.",
		],
		followUps: ["Bagaimana kamu menangani callback yang datang dua kali?", "Apa yang terjadi kalau penyedia pembayaran sedang down saat checkout?"],
	},
	{
		id: "frontend-ssr-csr",
		category: "Frontend",
		level: "Dasar",
		text: "Jelaskan perbedaan SSR, SSG, dan CSR, lalu kapan kamu memilih masing-masing.",
		why: "Menguji pemahaman dampak ke SEO, waktu muat, dan kompleksitas, bukan definisi singkat.",
		rubric: [
			"Menjelaskan di mana HTML dibuat dan apa artinya untuk first paint dan SEO.",
			"Menyebut kasus nyata: halaman marketing vs dashboard yang butuh data pengguna.",
			"Memahami biaya: server, cache, dan hydration.",
			"Tidak mengklaim satu pendekatan selalu lebih baik.",
		],
		followUps: ["Halaman mana di proyek terakhirmu yang kamu render di server, dan kenapa?", "Apa masalah umum saat hydration?"],
	},
	{
		id: "frontend-performa",
		category: "Frontend",
		level: "Menengah",
		text: "Bagaimana kamu menjaga halaman tetap cepat saat jumlah komponen dan data terus bertambah?",
		why: "Menguji kebiasaan mengukur sebelum mengoptimasi dan memahami biaya JavaScript.",
		rubric: [
			"Mengukur dulu: Lighthouse, Web Vitals, atau profiler, bukan menebak.",
			"Menyebut strategi nyata: code splitting, lazy loading, memoization yang tepat, caching data.",
			"Memisahkan masalah ukuran bundle dari masalah render.",
			"Menetapkan anggaran performa dan memantaunya setelah rilis.",
		],
		followUps: ["Metrik apa yang kamu pantau setelah rilis?", "Kapan memoization justru memperburuk keadaan?"],
	},
	{
		id: "frontend-state",
		category: "Frontend",
		level: "Menengah",
		text: "Bagaimana kamu mengelola state di aplikasi React yang cukup besar?",
		why: "Menguji kemampuan membedakan state lokal, state server, dan state global tanpa menumpuk library.",
		rubric: [
			"Memisahkan state server (cache/query) dari state UI lokal.",
			"Menjelaskan kapan state global benar-benar perlu.",
			"Menghindari duplikasi sumber kebenaran.",
			"Menyebut konsekuensi: re-render, debugging, dan onboarding tim.",
		],
		followUps: ["Kapan kamu memilih Context dibanding library state?", "Bagaimana kamu menghindari prop drilling tanpa membuat semuanya global?"],
	},
	{
		id: "frontend-layout",
		category: "Frontend",
		level: "Dasar",
		text: "Layout hanya berantakan di satu ukuran layar. Bagaimana kamu menemukan dan memperbaikinya?",
		why: "Menguji proses debugging yang sistematis dan kebiasaan mencegah regresi.",
		rubric: [
			"Reproduksi dulu dengan ukuran dan perangkat yang jelas.",
			"Memakai DevTools untuk menemukan elemen dan aturan CSS yang bertanggung jawab.",
			"Memperbaiki akar masalah, bukan menambah override acak.",
			"Menambahkan pengecekan regresi setelah perbaikan.",
		],
		followUps: ["Bagaimana kamu menguji breakpoint tanpa perangkat fisik?", "Apa yang kamu lakukan kalau bug hanya muncul di browser tertentu?"],
	},
	{
		id: "data-validasi",
		category: "Data",
		level: "Menengah",
		text: "Bagaimana kamu memastikan angka hasil analisis bisa dipercaya?",
		why: "Menguji kehati-hatian terhadap definisi metrik, kualitas data, dan bias kesimpulan.",
		rubric: [
			"Menjelaskan sumber data dan definisi metrik secara eksplisit.",
			"Melakukan sanity check dengan angka pembanding atau data mentah.",
			"Menyebut kemungkinan bias: sampling, data hilang, periode yang tidak sebanding.",
			"Memisahkan korelasi dari sebab-akibat.",
		],
		followUps: ["Bagaimana kamu menangani data yang hilang?", "Kapan kamu memilih eksperimen daripada analisis historis?"],
	},
	{
		id: "data-indeks",
		category: "Data",
		level: "Lanjut",
		text: "Jelaskan cara kerja indeks database dan kapan indeks justru memperlambat.",
		why: "Menguji pemahaman struktur data dan biaya tulis, bukan hanya 'tambahkan indeks agar cepat'.",
		rubric: [
			"Menjelaskan indeks sebagai struktur terurut yang mempercepat pencarian tertentu.",
			"Menyebut biaya: ruang penyimpanan dan waktu tulis/update.",
			"Menyadari indeks tidak terpakai jika query tidak cocok atau selektivitas rendah.",
			"Bisa membaca rencana eksekusi untuk memastikan indeks dipakai.",
		],
		followUps: ["Bagaimana kamu memilih urutan kolom pada indeks gabungan?", "Kapan indeks parsial lebih tepat?"],
	},
	{
		id: "data-anomali",
		category: "Data",
		level: "Menengah",
		text: "Angka di dashboard turun 30% dalam semalam. Bagaimana kamu menyelidikinya?",
		why: "Menguji urutan investigasi: pipa data, definisi, lalu kenyataan bisnis.",
		rubric: [
			"Memeriksa pipeline dan freshness data sebelum menyimpulkan bisnis bermasalah.",
			"Membandingkan dengan sumber lain dan segmen yang lebih kecil.",
			"Memisahkan penurunan nyata dari perubahan definisi atau pelacakan.",
			"Mengomunikasikan temuan dengan tingkat keyakinan yang jujur.",
		],
		followUps: ["Kalau data ternyata benar, langkah berikutnya apa?", "Bagaimana kamu mencegah panik yang sama terulang?"],
	},
	{
		id: "qa-otomatis-manual",
		category: "QA & testing",
		level: "Menengah",
		text: "Bagaimana kamu memutuskan apa yang perlu diuji otomatis dan apa yang cukup manual?",
		why: "Menguji prioritisasi berbasis risiko dan biaya, bukan mengejar cakupan 100%.",
		rubric: [
			"Mengutamakan alur kritis dan regresi yang mahal jika lolos.",
			"Mempertimbangkan frekuensi perubahan dan biaya perawatan tes.",
			"Menjelaskan kapan eksplorasi manual lebih bernilai (UX, kasus aneh).",
			"Menetapkan kriteria kapan tes dihapus atau ditulis ulang.",
		],
		followUps: ["Tes mana yang paling sering memberi nilai di proyekmu?", "Bagaimana kamu menangani tes yang rapuh?"],
	},
	{
		id: "qa-login",
		category: "QA & testing",
		level: "Dasar",
		text: "Sebutkan skenario uji untuk fitur login.",
		why: "Menguji kelengkapan berpikir: jalur bahagia, input tidak valid, keamanan, dan aksesibilitas.",
		rubric: [
			"Jalur normal: kredensial benar, sesi terbentuk, redirect tepat.",
			"Kasus negatif: password salah, akun tidak ada, input kosong, percobaan berulang.",
			"Keamanan: rate limit, pesan error tidak membocorkan akun, sesi kedaluwarsa.",
			"Aksesibilitas dan pengalaman: fokus, label, pesan error yang terbaca.",
		],
		followUps: ["Bagaimana kamu menguji 'lupa password'?", "Apa yang kamu cek setelah login berhasil?"],
	},
	{
		id: "qa-produksi",
		category: "QA & testing",
		level: "Lanjut",
		text: "Sebuah bug ditemukan di produksi. Apa langkah pertamamu?",
		why: "Menguji ketenangan, prioritas mitigasi, dan kebiasaan belajar dari insiden.",
		rubric: [
			"Menilai dampak dan cakupan sebelum memperbaiki.",
			"Mitigasi cepat (rollback, feature flag) sebelum akar masalah.",
			"Reproduksi dan catat bukti, lalu perbaiki dengan tes yang mencegah kambuh.",
			"Menulis postmortem tanpa mencari kambing hitam.",
		],
		followUps: ["Kapan kamu memilih rollback dibanding hotfix?", "Siapa yang kamu beri tahu lebih dulu?"],
	},
	{
		id: "karier-gaji",
		category: "Negosiasi & karier",
		level: "Menengah",
		text: "Berapa ekspektasi gaji kamu?",
		why: "Menguji kesiapan riset pasar dan kemampuan menyampaikan angka dengan alasan, bukan menebak.",
		rubric: [
			"Menyebut rentang berdasarkan riset pasar dan level peran.",
			"Menjelaskan komponen total: gaji pokok, tunjangan, bonus, opsi.",
			"Terbuka pada diskusi tanpa menurunkan angka secara refleks.",
			"Menanyakan rentang yang disiapkan perusahaan bila memungkinkan.",
		],
		followUps: ["Kalau tawaran di bawah rentang, apa yang kamu lakukan?", "Komponen apa selain gaji yang penting untukmu?"],
	},
	{
		id: "karier-dua-tawaran",
		category: "Negosiasi & karier",
		level: "Lanjut",
		text: "Kamu punya dua tawaran kerja. Bagaimana kamu memutuskan?",
		why: "Menguji prioritas karier dan kemampuan menilai pekerjaan secara menyeluruh, bukan hanya angka.",
		rubric: [
			"Menetapkan kriteria sebelum membandingkan: pembelajaran, atasan, stabilitas, kompensasi.",
			"Menilai kualitas tim lewat pertanyaan saat wawancara, bukan asumsi.",
			"Mempertimbangkan risiko: masa percobaan, beban kerja, jalur promosi.",
			"Keputusan dijelaskan dengan alasan yang konsisten.",
		],
		followUps: ["Apa yang tidak akan kamu korbankan?", "Bagaimana kamu memverifikasi klaim perusahaan sebelum menerima?"],
	},
	{
		id: "karier-rencana",
		category: "Negosiasi & karier",
		level: "Dasar",
		text: "Apa rencanamu dua sampai tiga tahun ke depan?",
		why: "Melihat arah yang realistis dan apakah posisi ini masuk akal untuk tujuan tersebut.",
		rubric: [
			"Arah yang jelas tetapi tidak kaku.",
			"Menghubungkan rencana dengan peran yang dilamar.",
			"Menyebut keterampilan yang ingin diperdalam dan cara mencapainya.",
			"Tidak menjawab 'ingin jadi manajer' tanpa alasan.",
		],
		followUps: ["Kalau posisi ini tidak menyediakan jalur itu, apa yang kamu lakukan?", "Siapa yang kamu kagumi secara profesional, dan kenapa?"],
	},
];

export const BANK_COUNT = PRACTICE_BANK.length;
