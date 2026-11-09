import { describe, expect, it } from "vitest";
import { templateLayouts, templateSchema } from "./templates";

describe("template registry", () => {
	it("includes the Phase 1 templates", () => {
		expect(templateSchema.options).toEqual(expect.arrayContaining(["swiss", "compact", "studio"]));
	});

	it("keeps one-column templates ATS-safe and Studio two-column", () => {
		expect(templateLayouts.swiss).toMatchObject({ columns: 1, atsSafe: true });
		expect(templateLayouts.compact).toMatchObject({ columns: 1, atsSafe: true });
		expect(templateLayouts.studio).toMatchObject({ columns: 2, sidebarSide: "left", atsSafe: false });
	});
});
