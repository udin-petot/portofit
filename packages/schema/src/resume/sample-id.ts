import type { ResumeData } from "./data";
import { sampleResumeData } from "./sample";

/**
 * The example a new Indonesian user starts from: every section the editor offers is already filled with
 * ordinary, believable content, so the first thing they do is replace text instead of wondering what a
 * section wants. Names, companies and numbers are invented on purpose.
 */
const buildIndonesianSample = (): ResumeData => {
	const data = structuredClone(sampleResumeData);

	data.basics = {
		...data.basics,
		name: "Rani Puspita",
		headline: "Analis Data | SQL, Python, dan Power BI",
		email: "rani.puspita@email.com",
		phone: "+62 812-3456-7890",
		location: "Yogyakarta, Indonesia",
		website: { url: "https://ranipuspita.my.id", label: "ranipuspita.my.id" },
		customFields: [
			{
				id: "019bef5a-0477-77e0-968b-5d0e2ecb34e3",
				icon: "linkedin-logo",
				text: "linkedin.com/in/ranipuspita",
				link: "https://linkedin.com/in/ranipuspita",
			},
			{
				id: "019bef5a-93e4-7746-ad39-3a132360f823",
				icon: "github-logo",
				text: "github.com/ranipuspita",
				link: "https://github.com/ranipuspita",
			},
		],
	};

	data.summary.content =
		"<p>Analis data dengan tiga tahun pengalaman mengubah data penjualan dan operasional menjadi laporan yang dipakai tim bisnis setiap minggu. Terbiasa menulis SQL untuk data warehouse, merapikan data dengan Python, dan menyusun dasbor Power BI yang dibaca manajer tanpa perlu penjelasan tambahan. Pernah memangkas waktu penyusunan laporan bulanan dari lima hari menjadi satu hari.</p>";

	data.sections.profiles.items = [
		{
			id: "019bef5a-93e4-7746-ad39-3d42ddc9b4d8",
			hidden: false,
			icon: "linkedin-logo",
			iconColor: "",
			network: "LinkedIn",
			username: "ranipuspita",
			website: { url: "https://linkedin.com/in/ranipuspita", label: "linkedin.com/in/ranipuspita", inlineLink: false },
		},
		{
			id: "019bef5a-93e4-7746-ad39-43c470b77f4a",
			hidden: false,
			icon: "github-logo",
			iconColor: "",
			network: "GitHub",
			username: "ranipuspita",
			website: { url: "https://github.com/ranipuspita", label: "github.com/ranipuspita", inlineLink: false },
		},
	];

	data.sections.experience.items = [
		{
			id: "019bef5a-93e4-7746-ad39-44d8cec98ca4",
			hidden: false,
			company: "PT Sinar Digital Nusantara",
			position: "Analis Data",
			location: "Yogyakarta",
			period: "Juli 2023 - Sekarang",
			website: { url: "", label: "", inlineLink: false },
			roles: [],
			description:
				"<ul><li><p>Menyusun dasbor penjualan mingguan di Power BI yang dipakai 40 staf marketing dan manajer cabang.</p></li><li><p>Menulis kueri SQL untuk mengambil data dari gudang data perusahaan, lalu merapikannya dengan Python sebelum masuk laporan.</p></li><li><p>Memangkas waktu penyusunan laporan bulanan dari lima hari kerja menjadi satu hari dengan skrip otomatis.</p></li><li><p>Menemukan penyebab selisih stok gudang sebesar 4 persen dan mengusulkan pencatatan ulang yang menutup selisih itu.</p></li></ul>",
		},
		{
			id: "019bef5a-d1fa-7289-a87c-2677688d9e75",
			hidden: false,
			company: "CV Kreasi Media",
			position: "Magang Analis Data",
			location: "Yogyakarta",
			period: "Agustus 2022 - Juni 2023",
			website: { url: "", label: "", inlineLink: false },
			roles: [],
			description:
				"<ul><li><p>Membersihkan data pelanggan dari empat sumber berbeda dan menyatukannya menjadi satu tabel acuan.</p></li><li><p>Membuat laporan mingguan berisi jumlah pengunjung situs, sumber trafik, dan tingkat pendaftaran.</p></li><li><p>Membantu tim produk membaca hasil uji A/B pada halaman pendaftaran.</p></li></ul>",
		},
	];

	data.sections.education.items = [
		{
			id: "019bef5a-93e4-7746-ad39-48455f6cef9e",
			hidden: false,
			school: "Universitas Gadjah Mada",
			degree: "Sarjana",
			area: "Statistika",
			grade: "IPK 3,62 dari 4,00",
			location: "Yogyakarta",
			period: "2018 - 2022",
			website: { url: "", label: "", inlineLink: false },
			description:
				"<p>Skripsi tentang peramalan permintaan barang ritel dengan model deret waktu. Mengambil mata kuliah analisis regresi, basis data, dan visualisasi data.</p>",
		},
	];

	data.sections.projects.items = [
		{
			id: "019bef5a-93e4-7746-ad39-4d2603fe2801",
			hidden: false,
			name: "Dasbor Pemantau Harga Pangan",
			period: "2023 - Sekarang",
			website: {
				url: "https://github.com/ranipuspita/dasbor-harga-pangan",
				label: "github.com/ranipuspita/dasbor-harga-pangan",
				inlineLink: false,
			},
			description:
				"<p>Mengumpulkan harga bahan pokok dari situs resmi daerah setiap hari, menyimpannya di PostgreSQL, lalu menampilkannya sebagai grafik tren. Dipakai tiga komunitas untuk memantau kenaikan harga menjelang hari raya.</p>",
		},
		{
			id: "019bef5a-93e4-7746-ad39-524195dd7eff",
			hidden: false,
			name: "Model Prediksi Pelanggan Berhenti",
			period: "2024",
			website: { url: "", label: "", inlineLink: false },
			description:
				"<p>Membuat model sederhana dengan Python untuk menandai pelanggan yang berisiko berhenti berlangganan. Hasilnya dipakai tim layanan pelanggan untuk menghubungi pelanggan lebih dulu.</p>",
		},
	];

	data.sections.skills.items = [
		{
			id: "019bef5a-93e4-7746-ad39-5a52dcf50ed4",
			hidden: false,
			icon: "code",
			iconColor: "",
			name: "SQL",
			proficiency: "Mahir",
			level: 5,
			keywords: ["PostgreSQL", "BigQuery", "Window function"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-5e8bb7cacbc8",
			hidden: false,
			icon: "brackets-curly",
			iconColor: "",
			name: "Python",
			proficiency: "Mahir",
			level: 4,
			keywords: ["pandas", "scikit-learn", "Requests"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-622f9d41da55",
			hidden: false,
			icon: "chart-line-up",
			iconColor: "",
			name: "Power BI",
			proficiency: "Mahir",
			level: 4,
			keywords: ["DAX", "Model data", "Dasbor"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-6574ab6814bd",
			hidden: false,
			icon: "cpu",
			iconColor: "",
			name: "Excel",
			proficiency: "Mahir",
			level: 4,
			keywords: ["Pivot", "Power Query", "Rumus bersarang"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-6a8e22bec684",
			hidden: false,
			icon: "brain",
			iconColor: "",
			name: "Komunikasi hasil analisis",
			proficiency: "Lanjutan",
			level: 3,
			keywords: ["Presentasi", "Laporan tertulis"],
		},
	];

	data.sections.languages.items = [
		{
			id: "019bef5a-93e4-7746-ad39-73807ccc48b5",
			hidden: false,
			language: "Bahasa Indonesia",
			fluency: "Penutur asli",
			level: 5,
		},
		{
			id: "019bef5a-93e4-7746-ad39-768670459358",
			hidden: false,
			language: "Inggris",
			fluency: "Profesional",
			level: 4,
		},
	];

	data.sections.interests.items = [
		{
			id: "019bef5a-93e4-7746-ad39-7c79a1ad4a3c",
			hidden: false,
			icon: "books",
			iconColor: "",
			name: "Membaca buku data",
			keywords: [],
		},
		{
			id: "019bef5a-93e4-7746-ad39-80a0e5e9c86a",
			hidden: false,
			icon: "football",
			iconColor: "",
			name: "Bersepeda",
			keywords: [],
		},
		{
			id: "019bef5a-93e4-7746-ad39-84b1a7f2a7f5",
			hidden: false,
			icon: "star",
			iconColor: "",
			name: "Fotografi jalanan",
			keywords: [],
		},
	];

	data.sections.awards.items = [
		{
			id: "019bef5a-93e4-7746-ad39-8a0f0a1b1e11",
			hidden: false,
			title: "Juara 2 Kompetisi Analisis Data Nasional",
			awarder: "Himpunan Statistik Indonesia",
			date: "2022",
			website: { url: "", label: "", inlineLink: false },
			description: "<p>Menganalisis data transportasi umum untuk mengusulkan rute baru di kota tuan rumah.</p>",
		},
	];

	data.sections.certifications.items = [
		{
			id: "019bef5a-93e4-7746-ad39-8c2b3c4d5f22",
			hidden: false,
			title: "Google Data Analytics",
			issuer: "Google",
			date: "2023",
			website: { url: "", label: "", inlineLink: false },
			description: "",
		},
	];

	data.sections.publications.items = [];
	data.sections.volunteer.items = [];
	data.sections.references.items = [];
	data.customSections = [];

	data.metadata.template = "azurill";
	data.metadata.layout.sidebarWidth = 30;
	data.metadata.layout.pages = [
		{
			fullWidth: false,
			main: ["summary", "experience", "education", "projects"],
			sidebar: ["profiles", "skills", "languages", "certifications", "awards", "interests"],
		},
	];
	data.metadata.page.locale = "id-ID";

	return data;
};

export const indonesianSampleResumeData: ResumeData = buildIndonesianSample();
