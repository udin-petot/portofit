import type { RouterOutput } from "@/libs/orpc/client";
import type { Entry } from "./model";
import { createEntry } from "./model";

type GithubRepo = RouterOutput["github"]["repos"]["repos"][number];

const monthYear = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

function escapeHtml(value: string) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function withoutTrailingPeriod(value: string) {
	return value.trim().replace(/[.!?]+$/, "");
}

function yearMonth(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Turns one GitHub repo into a project entry using only facts GitHub returned: the name, its description,
 * the main language, the star count and the last push. Nothing is inferred, so every sentence can be traced
 * back to the API response, and the user can still edit it afterwards.
 */
export function projectEntryFromRepo(repo: GithubRepo): Entry {
	const lines: string[] = [];
	if (repo.description?.trim()) lines.push(`${withoutTrailingPeriod(repo.description)}.`);
	if (repo.language) lines.push(`Dibangun dengan ${repo.language}.`);
	if (repo.stars > 0) lines.push(`${repo.stars} bintang di GitHub.`);
	lines.push(`Dorongan terakhir ${monthYear.format(new Date(repo.pushedAt))}.`);
	if (repo.archived) lines.push("Arsip, tidak lagi dirawat.");

	const base = createEntry("projects");
	return {
		...base,
		name: repo.name,
		website: { url: repo.htmlUrl, label: "", inlineLink: false },
		dates: { start: yearMonth(repo.createdAt), end: yearMonth(repo.pushedAt), present: false },
		description: `<p>${escapeHtml(lines.join(" "))}</p>`,
	} as Entry;
}

export function projectEntriesFromRepos(repos: GithubRepo[]): Entry[] {
	return repos.map(projectEntryFromRepo);
}
