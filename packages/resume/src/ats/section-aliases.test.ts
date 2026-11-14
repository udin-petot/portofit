import { describe, expect, it } from "vitest";
import { PDF_SECTION_HEADING_LOOKUP } from "./section-aliases";

describe("PDF section heading aliases", () => {
	it("recognises Indonesian section headings exported by PortoFit", () => {
		expect(PDF_SECTION_HEADING_LOOKUP.get("ringkasan")).toBe("summary");
		expect(PDF_SECTION_HEADING_LOOKUP.get("pendidikan")).toBe("education");
		expect(PDF_SECTION_HEADING_LOOKUP.get("pengalaman")).toBe("experience");
		expect(PDF_SECTION_HEADING_LOOKUP.get("keahlian")).toBe("skills");
		expect(PDF_SECTION_HEADING_LOOKUP.get("pengalaman kerja")).toBe("experience");
		expect(PDF_SECTION_HEADING_LOOKUP.get("keterampilan teknis")).toBe("skills");
	});
});
