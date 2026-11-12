import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Locale } from "@reactive-resume/utils/locale";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { indonesianSampleResumeData } from "@reactive-resume/schema/resume/sample-id";
import { EMPTY_SEMANTIC_CSS_SOURCE } from "@reactive-resume/schema/resume/stylesheet";

type CreateResumeDataOptions = {
	withSampleData?: boolean;
	/** The person the resume is for, printed as its name: the account holder's name, not the document's. */
	name?: string;
	/** Their address, so the sample does not open on a stranger's email. */
	email?: string;
	locale?: Locale;
};

/**
 * One reference CV for every new document, whatever the interface language: it is the document the product team
 * keeps as its own example, and a second, older example in English only ever reached users by accident.
 */
const starterSample = indonesianSampleResumeData;

export function createResumeData(options: CreateResumeDataOptions): ResumeData {
	const data = structuredClone(options.withSampleData ? starterSample : defaultResumeData);

	// The example carries its own invented persona: putting the account holder's name on it makes a stranger's CV
	// look like theirs, and they upload it before noticing.
	if (!options.withSampleData) {
		const name = options.name?.trim();
		if (name) data.basics.name = name;
		const email = options.email?.trim();
		if (email) data.basics.email = email;
	}
	if (!options.withSampleData && options.locale) data.metadata.page.locale = options.locale;
	data.metadata.stylesheet = {
		mode: "semantic",
		source: { languageVersion: 1, text: EMPTY_SEMANTIC_CSS_SOURCE },
	};

	return data;
}
