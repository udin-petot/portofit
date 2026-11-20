import { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "@reactive-resume/auth/config";
import { env } from "@reactive-resume/env/server";


export const handleOAuthAuthorizationServer = oauthProviderAuthServerMetadata(auth);
export const handleOpenIdConfiguration = oauthProviderOpenIdConfigMetadata(auth);

function appUrl() {
	return env.APP_URL.replace(/\/+$/, "");
}

function authorizationServer() {
	return `${appUrl()}/api/auth`;
}

export function handleOpenAiAppsChallenge() {
	if (!env.OPENAI_APPS_CHALLENGE_TOKEN) return new Response("Not Found", { status: 404 });
	return new Response(env.OPENAI_APPS_CHALLENGE_TOKEN, {
		headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
	});
}

export function handleWellKnownFallback() {
	return new Response("OK", { status: 200 });
}

export function handleOAuthProtectedResource() {
	const metadata = {
		resource: env.APP_URL,
		bearer_methods_supported: ["header"],
		authorization_servers: [authorizationServer()],
	};

	return Response.json(metadata, {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
		},
	});
}

/** integrations.sh discovery document (v3): every agent-facing surface of this instance and how it authenticates. */
function buildIntegrations() {
	const baseUrl = appUrl();
	const basis = { via: "declared", source: `${baseUrl}/.well-known/integrations.json` } as const;

	return {
		version: 3,
		summary:
			"PortoFit is a free and open-source resume builder. Agents can read and edit a user's resumes, cover letters and job applications through the REST API.",
		credentials: {
			oauth: {
				type: "oauth2",
				label: "PortoFit OAuth",
				setup: [
					`OAuth authorization-code flow with dynamic client registration (RFC 7591). Clients discover the authorization server from \`${baseUrl}/.well-known/oauth-protected-resource\` (issuer \`${authorizationServer()}\`).`,
					"The user signs in to PortoFit and approves the client on the consent screen; the resulting access token is sent as `Authorization: Bearer <token>`.",
				].join("\n\n"),
			},
		},
		surfaces: [
			{
				type: "http",
				slug: "portofit-api",
				name: "PortoFit REST API",
				basis,
				spec: `${baseUrl}/openapi.json`,
				url: `${baseUrl}/api/openapi`,
				auth: {
					status: "required",
					entries: [
						{
							use: [
								{
									id: "oauth",
									mechanics: { source: "http", in: "header", headerName: "Authorization", scheme: "Bearer" },
								},
							],
							basis,
						},
					],
				},
			},
		],
	};
}

export function handleIntegrations() {
	return Response.json(buildIntegrations(), {
		headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
	});
}

/** RFC 9727 API catalog: the REST API and its documentation. */
export function handleApiCatalog(options: { head?: boolean } = {}) {
	const baseUrl = appUrl();
	const linkset = {
		linkset: [
			{
				anchor: `${baseUrl}/api/openapi`,
				"service-desc": [{ href: `${baseUrl}/openapi.json`, type: "application/vnd.oai.openapi+json" }],
				status: [{ href: `${baseUrl}/api/health`, type: "application/json" }],
			},
		],
	};

	return new Response(options.head ? null : JSON.stringify(linkset), {
		headers: {
			"Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
			"Cache-Control": "public, max-age=3600",
			Link: `<${baseUrl}/.well-known/api-catalog>; rel="api-catalog"`,
		},
	});
}
