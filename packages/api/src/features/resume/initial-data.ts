import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Locale } from "@reactive-resume/utils/locale";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { indonesianSampleResumeData } from "@reactive-resume/schema/resume/sample-id";
import { EMPTY_SEMANTIC_CSS_SOURCE } from "@reactive-resume/schema/resume/stylesheet";

type CreateResumeDataOptions = {
	withSampleData?: boolean;
	/** The person the resume is for, printed as its name: the account holder's name, not the document's. */
	name?: string;
	locale?: Locale;
};

/** A filled example in the reader's own language: the English sample reads as foreign to an Indonesian user. */
const sampleFor = (locale?: Locale) => (locale === "id-ID" ? indonesianSampleResumeData : sampleResumeData);

export function createResumeData(options: CreateResumeDataOptions): ResumeData {
	const data = structuredClone(options.withSampleData ? sampleFor(options.locale) : defaultResumeData);

	const name = options.name?.trim();
	if (name) data.basics.name = name;
	if (options.locale) data.metadata.page.locale = options.locale;
	data.metadata.stylesheet = {
		mode: "semantic",
		source: { languageVersion: 1, text: EMPTY_SEMANTIC_CSS_SOURCE },
	};

	return data;
}
