import { describe, expect, it } from "vitest";
import { safeHref } from "./safe-href";

describe("safeHref", () => {
	it.each([
		"https://example.test/jobs/42",
		"http://example.test/jobs",
		"mailto:halo@example.test",
		"tel:+628123456789",
		"/dashboard/applications",
	])("keeps %s", (value) => {
		expect(safeHref(value)).toBe(value);
	});

	it.each([
		"javascript:alert(1)",
		"JaVaScRiPt:alert(1)",
		"java\tscript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:msgbox(1)",
		"//evil.test/login",
		"file:///etc/passwd",
		"",
		"   ",
		undefined,
		null,
	])("drops %j", (value) => {
		expect(safeHref(value)).toBeUndefined();
	});

	it("trims surrounding whitespace before checking", () => {
		expect(safeHref("  https://example.test  ")).toBe("https://example.test");
		expect(safeHref("  javascript:alert(1)  ")).toBeUndefined();
	});
});
