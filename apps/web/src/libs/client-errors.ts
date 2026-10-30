type ClientErrorPayload = {
	message: string;
	stack?: string;
	path: string;
	source: "error" | "unhandledrejection";
};

const reported = new Set<string>();

/** Report a browser error once per session, without cookies, tokens, or query strings. */
function report(payload: ClientErrorPayload) {
	const key = `${payload.message}|${payload.stack?.slice(0, 120) ?? ""}`;
	if (reported.has(key)) return;
	if (reported.size > 50) reported.clear();
	reported.add(key);

	void fetch("/api/client-error", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
		keepalive: true,
	}).catch(() => {
		// If the reporter itself cannot reach the server, there is nowhere left to report that.
	});
}

export function trackClientErrors() {
	if (typeof window === "undefined") return;

	window.addEventListener("error", (event) => {
		if (!event.message) return;
		report({
			message: event.message,
			...(event.error instanceof Error && event.error.stack ? { stack: event.error.stack } : {}),
			path: window.location.pathname,
			source: "error",
		});
	});

	window.addEventListener("unhandledrejection", (event) => {
		const reason: unknown = event.reason;
		const message =
			reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";
		report({
			message,
			...(reason instanceof Error && reason.stack ? { stack: reason.stack } : {}),
			path: window.location.pathname,
			source: "unhandledrejection",
		});
	});
}
