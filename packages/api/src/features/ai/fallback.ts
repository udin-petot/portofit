import type { LanguageModel } from "ai";

/**
 * A retryable failure: the next model in the chain may still answer.
 *
 * Deliberately narrow. A 401, a 403, or a 402 from the provider means the key, the plan, or the account is the
 * problem, and every model in the chain shares them. A 400 usually means the request itself is wrong. None of those
 * move to the next model.
 */
const RETRYABLE_STATUS = new Set([404, 408, 409, 425, 429, 500, 502, 503, 504]);

const NETWORK_CODES = new Set([
	"ECONNREFUSED",
	"ECONNRESET",
	"EAI_AGAIN",
	"ENOTFOUND",
	"ETIMEDOUT",
	"UND_ERR_CONNECT_TIMEOUT",
	"UND_ERR_SOCKET",
]);

const MODEL_MISSING = /model.*(not|x|tidak).{0,12}(found|exist|tersedia)|unknown model|invalid model/i;

// A part that proves the model has started answering. Metadata-only parts do not count, so a provider that
// accepts the request and then stalls still moves to the next model.
const CONTENT_PARTS = new Set([
	"text-delta",
	"reasoning-delta",
	"reasoning",
	"tool-input-start",
	"tool-input-delta",
	"tool-call",
	"file",
]);

type AnyModel = {
	specificationVersion: string;
	provider: string;
	modelId: string;
	supportedUrls?: Record<string, RegExp[]>;
	doGenerate: (options: never) => Promise<unknown>;
	doStream: (options: never) => Promise<{ stream: ReadableStream<Record<string, unknown>> } & Record<string, unknown>>;
};

class FallbackTimeout extends Error {
	constructor() {
		super("The model did not start answering in time.");
		this.name = "FallbackTimeout";
	}
}

class FallbackEmpty extends Error {
	constructor() {
		super("The model ended the reply without any content.");
		this.name = "FallbackEmpty";
	}
}

class FallbackForced extends Error {
	constructor() {
		super("AI_FORCE_PRIMARY_FAILURE is on.");
		this.name = "FallbackForced";
	}
}

function messageOf(error: unknown): string {
	let current: unknown = error;

	for (let depth = 0; depth < 6 && current; depth++) {
		const message = (current as { message?: unknown }).message;
		if (typeof message === "string" && message.length > 0) return message;
		current = (current as { cause?: unknown }).cause;
	}

	return "";
}

function statusOf(error: unknown): number | undefined {
	let current: unknown = error;

	for (let depth = 0; depth < 6 && current; depth++) {
		const status = (current as { statusCode?: unknown }).statusCode;
		if (typeof status === "number") return status;
		current = (current as { cause?: unknown }).cause;
	}

	return undefined;
}

function codeOf(error: unknown): string | undefined {
	let current: unknown = error;

	for (let depth = 0; depth < 6 && current; depth++) {
		const code = (current as { code?: unknown }).code;
		if (typeof code === "string") return code;
		current = (current as { cause?: unknown }).cause;
	}

	return undefined;
}

function nameOf(error: unknown): string {
	return error instanceof Error ? error.name : "";
}

/** Whether the next model should be tried. `aborted` is the caller's own stop or run timeout, never retried. */
export function shouldFallBack(error: unknown, aborted: boolean): boolean {
	if (aborted) return false;
	if (error instanceof FallbackTimeout || error instanceof FallbackEmpty || error instanceof FallbackForced) return true;
	if (nameOf(error) === "NoSuchModelError") return true;
	// Our own abort reasons (user stop, run timeout) must not be retried; a bare AbortError from the provider is
	// also treated as a stop, because the SDK cannot tell us which side aborted.
	if (nameOf(error) === "AbortError") return false;

	const status = statusOf(error);
	if (status !== undefined) {
		if (status === 400) return MODEL_MISSING.test(messageOf(error));
		if (status === 401 || status === 402 || status === 403) return false;
		return RETRYABLE_STATUS.has(status);
	}

	const code = codeOf(error);
	return code ? NETWORK_CODES.has(code) : false;
}

function retryableReason(error: unknown): string {
	const status = statusOf(error);
	if (status !== undefined) return `HTTP_${status}`;
	if (error instanceof FallbackTimeout) return "FIRST_TOKEN_TIMEOUT";
	if (error instanceof FallbackEmpty) return "EMPTY_REPLY";
	if (error instanceof FallbackForced) return "FORCED_DRILL";
	const code = codeOf(error);
	return code ?? nameOf(error) ?? "UNKNOWN";
}

function logFallback(from: string, to: string, error: unknown) {
	console.info(
		JSON.stringify({
			evt: "ai.fallback",
			from,
			to,
			reason: retryableReason(error),
			at: new Date().toISOString(),
		}),
	);
}

function abortSignalOf(options: unknown): AbortSignal | undefined {
	const signal = (options as { abortSignal?: unknown } | null)?.abortSignal;
	return signal instanceof AbortSignal ? signal : undefined;
}

function isContent(part: Record<string, unknown>): boolean {
	return typeof part.type === "string" && CONTENT_PARTS.has(part.type);
}

type Buffered = {
	reader: ReadableStreamDefaultReader<Record<string, unknown>>;
	chunks: Record<string, unknown>[];
	finished: boolean;
};

/** Reads only until the model proves it is answering, so a stalled provider can still be replaced. */
async function readUntilContent(
	stream: ReadableStream<Record<string, unknown>>,
	timeoutMs: number,
	signal: AbortSignal | undefined,
): Promise<Buffered> {
	const reader = stream.getReader();
	const chunks: Record<string, unknown>[] = [];
	const deadline = Date.now() + timeoutMs;

	try {
		while (true) {
			if (signal?.aborted) throw Object.assign(new Error("Aborted"), { name: "AbortError" });
			const remaining = deadline - Date.now();
			if (remaining <= 0) throw new FallbackTimeout();

			let timer: ReturnType<typeof setTimeout> | undefined;
			const timeout = new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new FallbackTimeout()), remaining);
			});

			let result: ReadableStreamReadResult<Record<string, unknown>>;
			try {
				result = await Promise.race([reader.read(), timeout]);
			} finally {
				if (timer) clearTimeout(timer);
			}

			if (result.done) {
				if (chunks.some(isContent)) return { reader, chunks, finished: true };
				throw new FallbackEmpty();
			}

			chunks.push(result.value);
			if (result.value.type === "error") throw result.value.error ?? new Error("The model stream failed.");
			if (isContent(result.value)) return { reader, chunks, finished: false };
		}
	} catch (error) {
		await reader.cancel(error).catch(() => undefined);
		throw error;
	}
}

/** Re-emits what was buffered, then keeps reading from the original stream. */
function replay(buffered: Buffered): ReadableStream<Record<string, unknown>> {
	return new ReadableStream<Record<string, unknown>>({
		start(controller) {
			for (const chunk of buffered.chunks) controller.enqueue(chunk);
			if (buffered.finished) controller.close();
		},
		async pull(controller) {
			if (buffered.finished) return;
			const result = await buffered.reader.read();
			if (result.done) {
				controller.close();
				return;
			}
			controller.enqueue(result.value);
		},
		cancel(reason) {
			return buffered.reader.cancel(reason);
		},
	});
}

type WithFallbackOptions = {
	/** Model ids in order, for the log line. */
	ids?: string[];
	/** The first attempt is failed on purpose, to prove the chain in production. */
	forcePrimaryFailure?: boolean;
	/** How long each attempt may take to start answering. */
	firstTokenMs?: number[];
};

/**
 * One language model that answers with the first connection that works. It only moves on before the reply has
 * started; a stream that dies halfway stays an error, because restarting would duplicate the transcript.
 */
export function withModelFallback(models: LanguageModel[], options: WithFallbackOptions = {}): LanguageModel {
	const first = models[0];
	if (!first) throw new Error("A model chain needs at least one model.");
	if (models.length === 1) return first;

	const ids = options.ids ?? models.map((model) => (model as unknown as AnyModel).modelId);
	const timeouts = options.firstTokenMs ?? [];
	const primary = first as unknown as AnyModel;

	const generate = async (params: never) => {
		let lastError: unknown;

		for (let index = 0; index < models.length; index++) {
			const model = models[index] as unknown as AnyModel;
			if (index === 0 && options.forcePrimaryFailure) lastError = new FallbackForced();
			else {
				try {
					return await model.doGenerate(params);
				} catch (error) {
					lastError = error;
					if (!shouldFallBack(error, Boolean(abortSignalOf(params)?.aborted))) throw error;
				}
			}
			logFallback(ids[index] ?? model.modelId, ids[index + 1] ?? "none", lastError);
		}

		throw lastError;
	};

	const stream = async (params: never) => {
		let lastError: unknown;

		for (let index = 0; index < models.length; index++) {
			const model = models[index] as unknown as AnyModel;
			try {
				if (index === 0 && options.forcePrimaryFailure) throw new FallbackForced();
				const result = await model.doStream(params);
				const buffered = await readUntilContent(
					result.stream,
					timeouts[index] ?? 20_000,
					abortSignalOf(params),
				);
				return { ...result, stream: replay(buffered) };
			} catch (error) {
				lastError = error;
				if (!shouldFallBack(error, Boolean(abortSignalOf(params)?.aborted))) throw error;
				logFallback(ids[index] ?? model.modelId, ids[index + 1] ?? "none", error);
			}
		}

		throw lastError;
	};

	return {
		specificationVersion: primary.specificationVersion,
		provider: primary.provider,
		modelId: primary.modelId,
		supportedUrls: primary.supportedUrls ?? {},
		doGenerate: generate,
		doStream: stream,
	} as unknown as LanguageModel;
}
