import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import { account } from "@reactive-resume/db/schema";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;

type RawRepo = {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	language: string | null;
	stargazers_count: number;
	created_at: string;
	pushed_at: string;
	fork: boolean;
	archived: boolean;
	topics?: string[];
	owner: { login: string };
};

export type GithubRepo = {
	id: number;
	name: string;
	fullName: string;
	description: string | null;
	htmlUrl: string;
	language: string | null;
	stars: number;
	createdAt: string;
	pushedAt: string;
	fork: boolean;
	archived: boolean;
	topics: string[];
};

/**
 * The GitHub token comes from the user's own GitHub sign-in, stored by better-auth. Requests never go out
 * without one: an unauthenticated call is capped at 60/hour per IP, which the shared server address would
 * burn through in minutes.
 */
async function tokenFor(userId: string): Promise<string> {
	const [row] = await db
		.select({ accessToken: account.accessToken })
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, "github")))
		.limit(1);

	if (!row?.accessToken) {
		throw new ORPCError("FORBIDDEN", {
			message: "Hubungkan akun GitHub dulu untuk mengambil proyek.",
			data: { code: "GITHUB_NOT_CONNECTED" },
		});
	}

	return row.accessToken;
}

async function githubFetch<T>(path: string, token: string): Promise<T> {
	let response: Response;
	try {
		response = await fetch(`${GITHUB_API}${path}`, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${token}`,
				"User-Agent": "PortoFit",
				"X-GitHub-Api-Version": "2022-11-28",
			},
			signal: AbortSignal.timeout(15_000),
		});
	} catch {
		throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "GitHub tidak bisa dihubungi. Coba lagi." });
	}

	if (response.status === 401) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Token GitHub tidak berlaku lagi. Masuk ulang lewat GitHub.",
			data: { code: "GITHUB_TOKEN_INVALID" },
		});
	}
	if (response.status === 404) {
		throw new ORPCError("NOT_FOUND", { message: "Akun GitHub itu tidak ditemukan atau tidak punya repo publik." });
	}
	if (response.status === 403 || response.status === 429) {
		throw new ORPCError("TOO_MANY_REQUESTS", {
			message: "Batas permintaan GitHub tercapai. Coba lagi beberapa menit.",
		});
	}
	if (!response.ok) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `GitHub membalas ${response.status}.` });
	}

	return (await response.json()) as T;
}

function toRepo(row: RawRepo): GithubRepo {
	return {
		id: row.id,
		name: row.name,
		fullName: row.full_name,
		description: row.description,
		htmlUrl: row.html_url,
		language: row.language,
		stars: row.stargazers_count,
		createdAt: row.created_at,
		pushedAt: row.pushed_at,
		fork: row.fork,
		archived: row.archived,
		topics: row.topics ?? [],
	};
}

export const githubService = {
	async repos(input: { userId: string; username?: string | undefined }) {
		const token = await tokenFor(input.userId);
		const path = input.username
			? `/users/${encodeURIComponent(input.username)}/repos?type=owner&sort=pushed&per_page=${PER_PAGE}`
			: `/user/repos?visibility=public&affiliation=owner&sort=pushed&per_page=${PER_PAGE}`;

		const rows = await githubFetch<RawRepo[]>(path, token);
		const repos = rows.map(toRepo);

		return {
			login: rows[0]?.owner.login ?? input.username ?? "",
			repos,
		};
	},
};
