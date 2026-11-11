import { describe, expect, it } from "vitest";
import { parseResumeData } from "./data";
import { indonesianSampleResumeData } from "./sample-id";

describe("indonesian sample", () => {
	it("is a valid resume with every section a new user needs already filled", () => {
		const data = parseResumeData(indonesianSampleResumeData);

		expect(data.basics.name).toBe("Rani Puspita");
		expect(data.basics.headline.length).toBeGreaterThan(0);
		expect(data.basics.email).toContain("@");
		expect(data.summary.content).toContain("Analis data");
		expect(data.sections.experience.items.length).toBeGreaterThanOrEqual(2);
		expect(data.sections.education.items.length).toBeGreaterThanOrEqual(1);
		expect(data.sections.skills.items.length).toBeGreaterThanOrEqual(4);
		expect(data.sections.languages.items.length).toBeGreaterThanOrEqual(2);
		expect(data.sections.projects.items.length).toBeGreaterThanOrEqual(1);
		expect(data.sections.certifications.items.length).toBeGreaterThanOrEqual(1);
		expect(data.metadata.page.locale).toBe("id-ID");
	});

	it("is a copy, so editing one resume never edits the next one", () => {
		const first = parseResumeData(structuredClone(indonesianSampleResumeData));
		first.basics.name = "Nama Lain";

		expect(indonesianSampleResumeData.basics.name).toBe("Rani Puspita");
	});
});
