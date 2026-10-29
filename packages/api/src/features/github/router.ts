import { protectedProcedure } from "../../context";
import { githubDto } from "../../dto/github";
import { githubService } from "./service";

export const githubRouter = {
	repos: protectedProcedure
		.route({
			method: "GET",
			path: "/github/repos",
			tags: ["GitHub"],
			operationId: "listGithubRepos",
			summary: "List a GitHub account's public repos",
			description:
				"Reads public repositories with the GitHub token saved from the user's GitHub sign-in. Forks and archives are returned with their flags so the client can hide them. Requires a connected GitHub account.",
			successDescription: "The account login and its public repositories, newest push first.",
		})
		.input(githubDto.repos.input)
		.output(githubDto.repos.output)
		.handler(({ context, input }) =>
			githubService.repos({ userId: context.user.id, username: input.username }),
		),
};
