import { t } from "@lingui/core/macro";

type PlanCopy = { name: string; description: string; unit: string };

/** The two plans seeded in the database. Keeping the copy here means the English default never shows Indonesian plan text. */
const PLAN_COPY: Record<"en" | "id", Record<string, PlanCopy>> = {
	en: {
		lamaran: {
			name: "CV + Cover Letter per Application",
			description:
				"A tailored CV, a cover letter, and a match score for one job. Start it from the application itself, with Prepare this application.",
			unit: "application credit",
		},
		wawancara: {
			name: "Interview Practice Session",
			description:
				"One practice session with questions for your field and feedback. Start it from Practise in the application workspace.",
			unit: "interview session credit",
		},
	},
	id: {
		lamaran: {
			name: "CV + Surat Lamaran per Lamaran",
			description:
				"CV disesuaikan, surat lamaran, dan skor kecocokan untuk satu lowongan. Dimulai dari halaman lamaran, lewat tombol Siapkan berkas lamaran.",
			unit: "kredit lamaran",
		},
		wawancara: {
			name: "Sesi Latihan Wawancara",
			description:
				"Satu sesi latihan dengan pertanyaan sesuai bidang dan umpan balik. Dimulai dari tab Latihan di halaman lamaran.",
			unit: "kredit sesi wawancara",
		},
	},
};

export type PlanLike = { code: string; name: string; description: string | null; kind: string };

/** A plan's reader-facing text, shared by the pricing cards, the credit ledger and the order list so all three agree. */
export function getPlanCopy(plan: PlanLike, english: boolean): PlanCopy {
	const localized = PLAN_COPY[english ? "en" : "id"][plan.code];
	if (localized) return localized;
	return {
		name: plan.name,
		description: plan.description ?? "",
		unit: plan.kind === "interview" ? t`interview session credit` : t`application credit`,
	};
}
