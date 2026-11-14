import { t } from "@lingui/core/macro";

type PlanCopy = { name: string; description: string; unit: string };

/** The two plans seeded in the database. Keeping the copy here means the English default never shows Indonesian plan text. */
const PLAN_COPY: Record<"en" | "id", Record<string, PlanCopy>> = {
	en: {
		lamaran: {
			name: "Resume + Cover Letter per Application",
			description:
				"A tailored resume, a cover letter, and a match score for one job. Start it from the application itself, with Prepare this application.",
			unit: "application credit",
		},
		"lamaran-3": {
			name: "Three Applications",
			description: "Three application credits: a tailored resume, a cover letter, and a match score for each job.",
			unit: "application credits",
		},
		wawancara: {
			name: "Interview Practice Session",
			description:
				"One practice session with questions for your field and feedback. Start it from Practise in the application workspace.",
			unit: "interview session credit",
		},
		"wawancara-3": {
			name: "Three Interview Sessions",
			description: "Three practice sessions with questions for your field and AI feedback.",
			unit: "interview session credits",
		},
		"coach-20": {
			name: "Coach 20 Messages",
			description: "Twenty Coach messages for strategy, job search, and interview answer reviews.",
			unit: "Coach messages",
		},
		"mulai-cepat": {
			name: "Quick Start",
			description: "One application, one interview session, and ten Coach messages to try the whole flow.",
			unit: "mixed credits",
		},
		"karier-lengkap": {
			name: "Complete Career Bundle",
			description: "Three applications, two interview sessions, and thirty Coach messages for one full job hunt.",
			unit: "mixed credits",
		},
		"karier-pro": {
			name: "Career Pro Bundle",
			description: "Five applications, three interview sessions, and fifty Coach messages for a serious search.",
			unit: "mixed credits",
		},
	},
	id: {
		lamaran: {
			name: "Resume + Surat Lamaran per Lamaran",
			description:
				"Resume disesuaikan, surat lamaran, dan skor kecocokan untuk satu lowongan. Dimulai dari halaman lamaran, lewat tombol Siapkan berkas lamaran.",
			unit: "kredit lamaran",
		},
		"lamaran-3": {
			name: "Paket Lamar 3",
			description: "Tiga kredit lamaran: resume disesuaikan, surat lamaran, dan skor kecocokan untuk tiap lowongan.",
			unit: "kredit lamaran",
		},
		wawancara: {
			name: "Sesi Latihan Wawancara",
			description:
				"Satu sesi latihan dengan pertanyaan sesuai bidang dan umpan balik. Dimulai dari tab Latihan di halaman lamaran.",
			unit: "kredit sesi wawancara",
		},
		"wawancara-3": {
			name: "Paket Wawancara 3",
			description: "Tiga sesi latihan dengan pertanyaan sesuai bidang dan umpan balik AI.",
			unit: "kredit sesi wawancara",
		},
		"coach-20": {
			name: "Paket Coach 20",
			description: "Dua puluh pesan Coach untuk strategi, cari lowongan, dan bedah jawaban wawancara.",
			unit: "pesan Coach",
		},
		"mulai-cepat": {
			name: "Mulai Cepat",
			description: "Satu lamaran, satu sesi wawancara, dan sepuluh pesan Coach untuk mencoba seluruh alur.",
			unit: "kredit campuran",
		},
		"karier-lengkap": {
			name: "Karier Lengkap",
			description: "Tiga lamaran, dua sesi wawancara, dan tiga puluh pesan Coach untuk satu siklus pencarian kerja.",
			unit: "kredit campuran",
		},
		"karier-pro": {
			name: "Karier Pro",
			description: "Lima lamaran, tiga sesi wawancara, dan lima puluh pesan Coach untuk pencarian yang serius.",
			unit: "kredit campuran",
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
		unit:
			plan.kind === "interview"
				? t`interview session credit`
				: plan.kind === "coach"
					? t`Coach messages`
					: plan.kind === "bundle"
						? t`mixed credits`
						: t`application credit`,
	};
}
