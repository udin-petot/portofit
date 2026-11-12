import { t } from "@lingui/core/macro";

type PlanCopy = { name: string; description: string; unit: string };

/** The two plans seeded in the database. Keeping the copy here means the English default never shows Indonesian plan text. */
const PLAN_COPY: Record<"en" | "id", Record<string, PlanCopy>> = {
	en: {
		lamaran: {
			name: "CV + Cover Letter per Application",
			description: "CV and cover letter tailored to one job, plus a match score.",
			unit: "application credit",
		},
		wawancara: {
			name: "Interview Practice Session",
			description: "One interview practice session with questions for your field and feedback.",
			unit: "interview session credit",
		},
	},
	id: {
		lamaran: {
			name: "CV + Cover Letter per Lamaran",
			description: "CV dan cover letter disesuaikan ke satu lowongan, plus skor kecocokan.",
			unit: "kredit lamaran",
		},
		wawancara: {
			name: "Sesi Latihan Wawancara",
			description: "Satu sesi simulasi wawancara dengan pertanyaan sesuai bidang dan umpan balik.",
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
