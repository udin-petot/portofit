import { describe, expect, it } from "vitest";
import { defaultResumeData } from "./default";
import { sampleResumeData } from "./sample";

describe("resume level display defaults", () => {
	it("does not draw a level graphic for new or sample resumes", () => {
		expect(defaultResumeData.metadata.design.level.type).toBe("hidden");
		expect(sampleResumeData.metadata.design.level.type).toBe("hidden");
	});

	it("tidak menggambar ikon butir dan ikon judul bagian pada resume baru maupun contoh", () => {
		expect(defaultResumeData.metadata.page.hideIcons).toBe(true);
		expect(defaultResumeData.metadata.page.hideSectionIcons).toBe(true);
		expect(sampleResumeData.metadata.page.hideIcons).toBe(true);
		expect(sampleResumeData.metadata.page.hideSectionIcons).toBe(true);
	});
});
