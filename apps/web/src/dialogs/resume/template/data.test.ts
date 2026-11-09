import { describe, expect, it } from "vitest";
import { templateSchema } from "@reactive-resume/schema/templates";
import { templates } from "./data";

describe("template metadata", () => {
	it("covers every template id", () => {
		expect(Object.keys(templates).sort()).toEqual([...templateSchema.options].sort());
	});

	it("puts the Phase 1 templates first and gives them a style", () => {
		expect(Object.keys(templates).slice(0, 3)).toEqual(["swiss", "compact", "studio"]);
		for (const id of ["swiss", "compact", "studio"] as const) {
			expect(templates[id].name).toBeTruthy();
			expect(templates[id].imageUrl).toBe(`/templates/jpg/${id}.jpg`);
			expect(templates[id].style).toBe(id);
		}
	});
});
