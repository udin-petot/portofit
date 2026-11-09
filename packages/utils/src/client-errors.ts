const IGNORED_CLIENT_ERRORS = [/^ResizeObserver loop (?:limit exceeded|completed with undelivered notifications)\.?$/i];

/**
 * Browser warnings that carry no stack and no user-visible failure. Reporting them only
 * turns monitoring into noise, so the client and the server both drop them.
 */
export function isIgnorableClientError(message: string): boolean {
	const normalized = message.trim();
	return IGNORED_CLIENT_ERRORS.some((pattern) => pattern.test(normalized));
}
