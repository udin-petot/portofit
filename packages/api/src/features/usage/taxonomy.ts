/**
 * Daftar fitur yang dihitung. Kunci ini yang tersimpan di basis data, jadi jangan mengganti nama kunci
 * yang sudah dipakai. Label dan kelompok hanya untuk tampilan admin.
 */
export const USAGE_FEATURES = {
	ats_check: { label: "Periksa ATS", group: "Dokumen" },
	ats_check_posting: { label: "Periksa ATS dengan lowongan", group: "Dokumen" },
	resume_create: { label: "Buat CV", group: "Dokumen" },
	resume_import: { label: "Impor CV", group: "Dokumen" },
	resume_export_pdf: { label: "Ekspor PDF", group: "Dokumen" },
	resume_export_docx: { label: "Ekspor Word", group: "Dokumen" },
	resume_export_markdown: { label: "Ekspor Markdown", group: "Dokumen" },
	resume_export_json: { label: "Ekspor JSON", group: "Dokumen" },
	cover_letter_create: { label: "Buat surat lamaran", group: "Dokumen" },
	resume_share: { label: "Bagikan CV publik", group: "Dokumen" },
	application_create: { label: "Simpan lowongan", group: "Lamaran" },
	tailor_resume: { label: "Sesuaikan CV", group: "Lamaran" },
	prepare_application: { label: "Paket siap lamar", group: "Lamaran" },
	interview_session: { label: "Latihan wawancara", group: "Wawancara" },
	ai_review: { label: "Review CV AI", group: "AI" },
	ai_improve: { label: "Perbaiki baris AI", group: "AI" },
	coach_message: { label: "Tanya coach", group: "AI" },
	job_match: { label: "Skor kecocokan", group: "AI" },
} as const;

export type UsageFeature = keyof typeof USAGE_FEATURES;

export const USAGE_FEATURE_KEYS = Object.keys(USAGE_FEATURES) as UsageFeature[];

export function isUsageFeature(value: string): value is UsageFeature {
	return Object.hasOwn(USAGE_FEATURES, value);
}
