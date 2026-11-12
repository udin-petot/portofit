import { describe, expect, it } from "vitest";
import { parseResumeData } from "./data";
import { indonesianSampleResumeData } from "./sample-id";

describe("indonesian sample", () => {
	it("is a valid resume with every section a new user needs already filled", () => {
		const data = parseResumeData(indonesianSampleResumeData);

		expect(data.basics.name).toBe("Rizky Pratama");
		expect(data.basics.headline).toBe("Backend Engineer");
		expect(data.basics.email).toContain("@");
		expect(data.summary.content).toContain("Backend engineer");
		expect(data.sections.experience.items.length).toBeGreaterThanOrEqual(2);
		expect(data.sections.education.items.length).toBeGreaterThanOrEqual(1);
		expect(data.sections.skills.items.length).toBeGreaterThanOrEqual(3);
		expect(data.sections.languages.items.length).toBeGreaterThanOrEqual(2);
		expect(data.sections.projects.items.length).toBeGreaterThanOrEqual(1);
		expect(data.metadata.template).toBe("porygon");
		expect(data.metadata.page.locale).toBe("id-ID");
	});

	it("is a copy, so editing one resume never edits the next one", () => {
		const first = parseResumeData(structuredClone(indonesianSampleResumeData));
		first.basics.name = "Nama Lain";

		expect(indonesianSampleResumeData.basics.name).toBe("Rizky Pratama");
	});
});
