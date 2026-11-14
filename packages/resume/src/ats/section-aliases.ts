import type { CustomSectionType } from "@reactive-resume/schema/resume/data";

/**
 * Conventional English headings the live builder lint accepts without complaint.
 * Kept deliberately narrow: this set decides whether NON_STANDARD_SECTION_TITLE fires.
 */
export const SECTION_TITLE_ALIASES: Partial<Record<CustomSectionType, ReadonlySet<string>>> = {
	summary: new Set([
		"summary",
		"professional summary",
		"profile",
		"about",
		"about me",
		"objective",
		"career objective",
	]),
	experience: new Set([
		"experience",
		"work experience",
		"professional experience",
		"employment",
		"employment history",
		"work history",
		"career history",
	]),
	education: new Set(["education", "academic background", "education & training", "educational background"]),
	projects: new Set(["projects", "personal projects", "selected projects", "side projects"]),
	skills: new Set(["skills", "technical skills", "core competencies", "competencies", "skills & expertise"]),
	languages: new Set(["languages"]),
	interests: new Set(["interests", "hobbies", "hobbies & interests"]),
	awards: new Set(["awards", "honors", "awards & honors", "achievements"]),
	certifications: new Set(["certifications", "certificates", "licenses", "licenses & certifications"]),
	publications: new Set(["publications", "papers", "research"]),
	volunteer: new Set(["volunteer", "volunteering", "volunteer experience", "community involvement"]),
	references: new Set(["references"]),
	profiles: new Set(["profiles", "links", "social profiles"]),
};

/**
 * Additional headings seen in the wild that the PDF checker must still recognise as a section.
 * These are recall-oriented: a resume that writes "Career Summary" has a summary section, even
 * though the builder lint would still nudge the author toward a more conventional title.
 */
const EXTRA_PDF_HEADING_ALIASES: Partial<Record<CustomSectionType, readonly string[]>> = {
	summary: [
		"career objective",
		"career summary",
		"executive summary",
		"personal statement",
		"professional profile",
		"summary of qualifications",
		"qualifications summary",
		"overview",
		"professional overview",
		"who i am",
		"ringkasan",
		"ringkasan profil",
		"ringkasan profesional",
		"profil singkat",
		"tujuan karier",
	],
	experience: [
		"relevant experience",
		"professional background",
		"work history & experience",
		"industry experience",
		"positions held",
		"roles",
		"experience & achievements",
		"work",
		"employment experience",
		"relevant work experience",
		"pengalaman",
		"pengalaman kerja",
		"pengalaman profesional",
		"pengalaman organisasi",
		"riwayat pekerjaan",
		"riwayat karier",
	],
	education: [
		"academic qualifications",
		"academics",
		"education and training",
		"qualifications",
		"degrees",
		"academic history",
		"schooling",
		"pendidikan",
		"riwayat pendidikan",
		"latar belakang pendidikan",
	],
	projects: [
		"key projects",
		"notable projects",
		"portfolio",
		"project experience",
		"academic projects",
		"proyek",
		"proyek pribadi",
		"proyek akademik",
		"portofolio",
	],
	skills: [
		"technical proficiencies",
		"areas of expertise",
		"key skills",
		"skills summary",
		"tools & technologies",
		"technologies",
		"tech stack",
		"proficiencies",
		"expertise",
		"strengths",
		"keahlian",
		"keterampilan",
		"keterampilan teknis",
		"kompetensi",
		"kemampuan",
	],
	languages: [
		"language skills",
		"spoken languages",
		"languages known",
		"bahasa",
		"kemampuan bahasa",
		"bahasa yang dikuasai",
	],
	interests: ["activities", "personal interests", "outside of work", "minat", "hobi", "minat dan hobi"],
	awards: [
		"honours",
		"awards and honors",
		"recognition",
		"accomplishments",
		"achievements & awards",
		"penghargaan",
		"prestasi",
		"penghargaan dan prestasi",
	],
	certifications: [
		"certifications & licenses",
		"professional certifications",
		"credentials",
		"licenses and certifications",
		"courses & certifications",
		"sertifikasi",
		"sertifikat",
		"lisensi",
		"sertifikasi dan lisensi",
	],
	publications: [
		"publications & talks",
		"talks",
		"presentations",
		"conference papers",
		"patents",
		"publikasi",
		"karya ilmiah",
		"penelitian",
	],
	volunteer: [
		"volunteer work",
		"community service",
		"voluntary experience",
		"community",
		"relawan",
		"pengalaman relawan",
		"kegiatan sosial",
	],
	references: ["references available upon request", "referees", "referensi", "rujukan"],
	profiles: [
		"contact",
		"contact information",
		"contact details",
		"online profiles",
		"find me online",
		"kontak",
		"informasi kontak",
		"tautan",
		"profil online",
	],
};

function buildHeadingLookup(): ReadonlyMap<string, CustomSectionType> {
	const lookup = new Map<string, CustomSectionType>();

	for (const [type, aliases] of Object.entries(SECTION_TITLE_ALIASES)) {
		for (const alias of aliases) lookup.set(alias, type as CustomSectionType);
	}

	for (const [type, aliases] of Object.entries(EXTRA_PDF_HEADING_ALIASES)) {
		for (const alias of aliases) {
			if (!lookup.has(alias)) lookup.set(alias, type as CustomSectionType);
		}
	}

	return lookup;
}

/**
 * Lowercased heading text -> the resume section it most likely introduces.
 * Callers are expected to normalise (case-fold, collapse whitespace, strip punctuation) first.
 */
export const PDF_SECTION_HEADING_LOOKUP = buildHeadingLookup();
