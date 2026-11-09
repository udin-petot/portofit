import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { act } from "react";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { ResumeDocument } from "../../document";
import { renderToBuffer } from "../../forme/testing";

type LevelType = ResumeData["metadata"]["design"]["level"]["type"];

async function renderSkillLevel(type: LevelType) {
	const data = structuredClone(defaultResumeData);
	data.metadata.typography.body.fontFamily = "Helvetica";
	data.metadata.typography.heading.fontFamily = "Helvetica";
	data.metadata.layout.pages = [{ fullWidth: true, main: ["skills"], sidebar: [] }];
	data.metadata.design.level = { type, icon: "star" };
	data.sections.skills.items = [
		{
			id: "skill-1",
			hidden: false,
			icon: "",
			iconColor: "",
			name: "TypeScript",
			proficiency: "Advanced",
			level: 4,
			keywords: ["React"],
		},
	];

	const bytes = await act(() => renderToBuffer(<ResumeDocument data={data} template="onyx" />));
	const loading = getDocument({ data: new Uint8Array(bytes) });
	const text: string[] = [];
	try {
		const pdf = await loading.promise;
		for (let number = 1; number <= pdf.numPages; number++) {
			const page = await pdf.getPage(number);
			text.push((await page.getTextContent()).items.flatMap((item) => ("str" in item ? [item.str] : [])).join(" "));
		}
	} finally {
		await loading.destroy();
	}
	return text.join(" ");
}

describe("level display types", () => {
	it("renders a bar with a percentage label", async () => {
		const text = await renderSkillLevel("progress-bar-percent");
		expect(text).toContain("TypeScript");
		expect(text).toContain("Advanced");
		expect(text).toContain("80%");
	});

	it("renders five stars without inventing a percentage", async () => {
		const text = await renderSkillLevel("stars");
		expect(text).toContain("TypeScript");
		expect(text).toContain("Advanced");
		expect(text).not.toContain("%");
	});
});
