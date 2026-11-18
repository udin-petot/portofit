import { describe, expect, it } from "vitest";
import { templateSchema } from "@reactive-resume/schema/templates";
import { templates } from "./data";

describe("template metadata", () => {
	it("covers every template id", () => {
		expect(Object.keys(templates).sort()).toEqual([...templateSchema.options].sort());
	});

	it("puts the newer templates first and gives them a style", () => {
		expect(Object.keys(templates).slice(0, 7)).toEqual([
			"swiss",
			"compact",
			"timeline",
			"banner",
			"technical",
			"academic",
			"humanist",
		]);
		for (const id of ["swiss", "compact", "timeline", "banner", "technical", "academic", "humanist"] as const) {
			expect(templates[id].name).toBeTruthy();
			expect(templates[id].imageUrl).toBe(`/templates/jpg/${id}.jpg`);
		}
		// Rapi dan Bersih memakai gaya yang sudah ada, jadi hanya gaya asli yang harus sama dengan id-nya.
		for (const id of ["swiss", "compact", "studio", "timeline", "banner", "technical", "academic", "humanist"] as const)
			expect(templates[id].style).toBe(id);
	});
});
