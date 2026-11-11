import type { ResumeData } from "./data";
import { sampleResumeData } from "./sample";

/**
 * The example a new Indonesian user starts from: a one-page CV in their own language with the sections a
 * recruiter expects already filled in, so the first thing they do is replace text instead of working out what a
 * section wants. Names, companies and numbers are invented on purpose. Short by design: a starter that runs to
 * two pages teaches the wrong habit.
 */
const buildIndonesianSample = (): ResumeData => {
	const data = structuredClone(sampleResumeData);

	data.basics = {
		...data.basics,
		name: "Rani Puspita",
		headline: "Analis Data | SQL, Python, Power BI",
		email: "rani.puspita@email.com",
		phone: "+62 812-3456-7890",
		location: "Yogyakarta",
		website: { url: "https://ranipuspita.my.id", label: "ranipuspita.my.id" },
		customFields: [],
	};

	data.summary.content =
		"<p>Analis data dengan tiga tahun pengalaman mengubah data penjualan menjadi laporan mingguan yang dipakai tim bisnis. Terbiasa menulis SQL, merapikan data dengan Python, dan menyusun dasbor Power BI.</p>";

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
				"<ul><li><p>Menyusun dasbor penjualan mingguan di Power BI yang dipakai 40 staf pemasaran dan manajer cabang.</p></li><li><p>Menulis kueri SQL dan skrip Python untuk laporan bulanan, memangkas waktu penyusunan dari lima hari menjadi satu hari.</p></li><li><p>Menemukan penyebab selisih stok gudang 4 persen dan mengusulkan pencatatan ulang yang menutup selisih itu.</p></li></ul>",
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
				"<ul><li><p>Membersihkan data pelanggan dari empat sumber dan menyatukannya menjadi satu tabel acuan.</p></li><li><p>Membuat laporan mingguan pengunjung situs, sumber trafik, dan tingkat pendaftaran.</p></li></ul>",
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
			description: "",
		},
	];

	data.sections.projects.items = [
		{
			id: "019bef5a-93e4-7746-ad39-4d2603fe2801",
			hidden: false,
			name: "Dasbor Pemantau Harga Pangan",
			period: "2023",
			website: {
				url: "https://github.com/ranipuspita/dasbor-harga-pangan",
				label: "github.com/ranipuspita/dasbor-harga-pangan",
				inlineLink: false,
			},
			description:
				"<p>Mengumpulkan harga bahan pokok harian dari situs resmi daerah dan menampilkannya sebagai grafik tren.</p>",
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
			level: 4,
			keywords: ["PostgreSQL", "BigQuery"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-5e8bb7cacbc8",
			hidden: false,
			icon: "brackets-curly",
			iconColor: "",
			name: "Python",
			proficiency: "Mahir",
			level: 4,
			keywords: ["pandas", "scikit-learn"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-622f9d41da55",
			hidden: false,
			icon: "chart-line-up",
			iconColor: "",
			name: "Power BI",
			proficiency: "Mahir",
			level: 3,
			keywords: ["DAX", "Dasbor"],
		},
		{
			id: "019bef5a-93e4-7746-ad39-6574ab6814bd",
			hidden: false,
			icon: "cpu",
			iconColor: "",
			name: "Excel",
			proficiency: "Mahir",
			level: 3,
			keywords: ["Power Query"],
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

	data.sections.awards.items = [];
	data.sections.interests.items = [];
	data.sections.publications.items = [];
	data.sections.volunteer.items = [];
	data.sections.references.items = [];
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
	data.customSections = [];

	data.metadata.template = "rapi";
	data.metadata.layout.sidebarWidth = 32;
	data.metadata.layout.pages = [
		{
			fullWidth: false,
			main: ["summary", "experience", "education", "projects"],
			sidebar: ["profiles", "skills", "languages", "certifications"],
		},
	];
	data.metadata.page.locale = "id-ID";

	return data;
};

export const indonesianSampleResumeData: ResumeData = buildIndonesianSample();
