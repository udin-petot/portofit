import { describe, expect, it } from "vitest";
import { projectEntryFromRepo } from "./github-project";

type Repo = Parameters<typeof projectEntryFromRepo>[0];

const repo = (overrides: Partial<Repo> = {}): Repo => ({
	id: 1,
	name: "portofit",
	fullName: "udin-petot/portofit",
	description: "Persiapan kerja dari CV sampai wawancara",
	htmlUrl: "https://github.com/udin-petot/portofit",
	language: "TypeScript",
	stars: 7,
	createdAt: "2026-09-01T00:00:00Z",
	pushedAt: "2026-10-27T10:00:00Z",
	fork: false,
	archived: false,
	topics: [],
	...overrides,
});

describe("projectEntryFromRepo", () => {
	it("writes only what GitHub returned", () => {
		const entry = projectEntryFromRepo(repo()) as { name: string; dates: unknown; description: string; website: { url: string } };

		expect(entry.name).toBe("portofit");
		expect(entry.website.url).toBe("https://github.com/udin-petot/portofit");
		expect(entry.dates).toEqual({ start: "2026-09", end: "2026-10", present: false });
		expect(entry.description).toContain("Persiapan kerja dari CV sampai wawancara.");
		expect(entry.description).toContain("Dibangun dengan TypeScript.");
		expect(entry.description).toContain("7 bintang di GitHub.");
		expect(entry.description).toContain("Dorongan terakhir Oktober 2026.");
	});

	it("does not invent a language or stars when GitHub has none", () => {
		const entry = projectEntryFromRepo(repo({ language: null, stars: 0, description: null })) as { description: string };

		expect(entry.description).not.toContain("Dibangun dengan");
		expect(entry.description).not.toContain("bintang");
		expect(entry.description).toContain("Dorongan terakhir Oktober 2026.");
	});

	it("escapes HTML in the description", () => {
		const entry = projectEntryFromRepo(repo({ description: "A <b>tag</b> & a quote" })) as { description: string };

		expect(entry.description).toContain("A &lt;b&gt;tag&lt;/b&gt; &amp; a quote.");
	});
});
