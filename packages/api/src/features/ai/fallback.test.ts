import { describe, expect, it, vi } from "vitest";
import { shouldFallBack, withModelFallback } from "./fallback";

type StreamPart = Record<string, unknown>;

function httpError(status: number, message = `HTTP ${status}`) {
	return Object.assign(new Error(message), { statusCode: status });
}

function streamOf(parts: StreamPart[], thenFail = false): ReadableStream<StreamPart> {
	let index = 0;

	return new ReadableStream<StreamPart>({
		pull(controller) {
			const part = parts[index];
			index += 1;
			if (part !== undefined) {
				controller.enqueue(part);
				return;
			}
			if (thenFail) controller.error(new Error("stream died"));
			else controller.close();
		},
	});
}

function stalled(): ReadableStream<StreamPart> {
	return new ReadableStream<StreamPart>({ start() {} });
}

function fake(id: string, overrides: Partial<Record<"doGenerate" | "doStream", unknown>> = {}) {
	return {
		specificationVersion: "v2",
		provider: "test",
		modelId: id,
		supportedUrls: {},
		doGenerate: vi.fn(async () => ({ text: id })),
		doStream: vi.fn(async () => ({ stream: streamOf([{ type: "text-delta", delta: id }]) })),
		...overrides,
	};
}

const asChain = (model: unknown) =>
	model as unknown as {
		doGenerate: (params: unknown) => Promise<{ text: string }>;
		doStream: (params: unknown) => Promise<{ stream: ReadableStream<StreamPart> }>;
		modelId: string;
	};

async function collect(stream: ReadableStream<StreamPart>) {
	const parts: StreamPart[] = [];
	for await (const part of stream) parts.push(part);
	return parts;
}

describe("shouldFallBack", () => {
	it("moves on for rate limits, server errors, network failures, and missing models", () => {
		expect(shouldFallBack(httpError(429), false)).toBe(true);
		expect(shouldFallBack(httpError(503), false)).toBe(true);
		expect(shouldFallBack(httpError(404), false)).toBe(true);
		expect(shouldFallBack(Object.assign(new Error("reset"), { code: "ECONNRESET" }), false)).toBe(true);
		expect(shouldFallBack(Object.assign(new Error("gone"), { name: "NoSuchModelError" }), false)).toBe(true);
		expect(shouldFallBack(httpError(400, "model not found"), false)).toBe(true);
	});

	it("stops for bad keys, empty balance, bad requests, and our own aborts", () => {
		expect(shouldFallBack(httpError(401), false)).toBe(false);
		expect(shouldFallBack(httpError(402), false)).toBe(false);
		expect(shouldFallBack(httpError(403), false)).toBe(false);
		expect(shouldFallBack(httpError(400, "messages: invalid role"), false)).toBe(false);
		expect(shouldFallBack(httpError(503), true)).toBe(false);
		expect(shouldFallBack(Object.assign(new Error("stop"), { name: "AbortError" }), false)).toBe(false);
	});
});

describe("withModelFallback", () => {
	it("keeps one model when there is nothing behind it", () => {
		const only = fake("only");
		expect(withModelFallback([only as never])).toBe(only);
	});

	it("answers with the second model when the first reports 503", async () => {
		const primary = fake("primary", { doGenerate: vi.fn(async () => Promise.reject(httpError(503))) });
		const backup = fake("backup");
		const chain = asChain(withModelFallback([primary as never, backup as never]));

		await expect(chain.doGenerate({})).resolves.toEqual({ text: "backup" });
		expect(primary.doGenerate).toHaveBeenCalledTimes(1);
		expect(backup.doGenerate).toHaveBeenCalledTimes(1);
	});

	it("does not spend a backup on a bad key or an aborted run", async () => {
		const primary = fake("primary", { doGenerate: vi.fn(async () => Promise.reject(httpError(401))) });
		const backup = fake("backup");
		const chain = asChain(withModelFallback([primary as never, backup as never]));

		await expect(chain.doGenerate({})).rejects.toMatchObject({ statusCode: 401 });
		expect(backup.doGenerate).not.toHaveBeenCalled();

		const aborted = new AbortController();
		aborted.abort();
		const stopping = fake("stopping", { doStream: vi.fn(async () => Promise.reject(httpError(503))) });
		const stopped = asChain(withModelFallback([stopping as never, backup as never]));
		await expect(stopped.doStream({ abortSignal: aborted.signal })).rejects.toMatchObject({ statusCode: 503 });
		expect(backup.doStream).not.toHaveBeenCalled();
	});

	it("streams from the next model when the first stalls before answering", async () => {
		const primary = fake("primary", { doStream: vi.fn(async () => ({ stream: stalled() })) });
		const backup = fake("backup");
		const chain = asChain(withModelFallback([primary as never, backup as never], { firstTokenMs: [30, 30] }));

		const result = await chain.doStream({});
		await expect(collect(result.stream)).resolves.toEqual([{ type: "text-delta", delta: "backup" }]);
		expect(backup.doStream).toHaveBeenCalledTimes(1);
	});

	it("streams from the next model when the first stream fails before any content", async () => {
		const primary = fake("primary", {
			doStream: vi.fn(async () => {
				throw httpError(502);
			}),
		});
		const backup = fake("backup");
		const chain = asChain(withModelFallback([primary as never, backup as never], { firstTokenMs: [1000, 1000] }));

		const result = await chain.doStream({});
		await expect(collect(result.stream)).resolves.toEqual([{ type: "text-delta", delta: "backup" }]);
	});

	it("never restarts a stream that already answered", async () => {
		const primary = fake("primary", {
			doStream: vi.fn(async () => ({
				stream: streamOf([{ type: "text-delta", delta: "first" }], true),
			})),
		});
		const backup = fake("backup");
		const chain = asChain(withModelFallback([primary as never, backup as never], { firstTokenMs: [1000, 1000] }));

		const result = await chain.doStream({});
		await expect(collect(result.stream)).rejects.toThrow("stream died");
		expect(backup.doStream).not.toHaveBeenCalled();
	});

	it("skips the primary only for the drill switch", async () => {
		const primary = fake("primary");
		const backup = fake("backup");
		const chain = asChain(
			withModelFallback([primary as never, backup as never], { forcePrimaryFailure: true, firstTokenMs: [1000] }),
		);

		await expect(chain.doGenerate({})).resolves.toEqual({ text: "backup" });
		expect(primary.doGenerate).not.toHaveBeenCalled();
	});
});
