import { describe, expect, it } from "vitest";
import { getLocaleAlternates, localizedUrl } from "./locale";

describe("locale URLs", () => {
	it("keeps the default locale on the plain address and puts others in the locale parameter", () => {
		expect(localizedUrl("https://rxresu.me/?locale=de-DE", "id-ID")).toBe("https://rxresu.me/");
		expect(localizedUrl("https://rxresu.me/", "de-DE")).toBe("https://rxresu.me/?locale=de-DE");
	});

	it("advertises only the indexed languages plus x-default", () => {
		const alternates = getLocaleAlternates("https://rxresu.me/");

		expect(alternates).toEqual([
			{ hreflang: "id-ID", href: "https://rxresu.me/" },
			{ hreflang: "en-US", href: "https://rxresu.me/?locale=en-US" },
			{ hreflang: "x-default", href: "https://rxresu.me/" },
		]);
		expect(alternates.map((alternate) => alternate.hreflang)).not.toContain("zu-ZA");
		expect(alternates.map((alternate) => alternate.hreflang)).not.toContain("sr");
	});
});
