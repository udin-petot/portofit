import { describe, expect, it, vi } from "vitest";
import { ignoreSkippedViewTransitions } from "./view-transitions";

type FakeTransition = {
	ready: { catch: ReturnType<typeof vi.fn> };
	finished: { catch: ReturnType<typeof vi.fn> };
	updateCallbackDone: Promise<void>;
	skipTransition: () => void;
};

function stubStartViewTransition() {
	const transition: FakeTransition = {
		ready: { catch: vi.fn() },
		finished: { catch: vi.fn() },
		updateCallbackDone: Promise.resolve(),
		skipTransition: vi.fn(),
	};

	const start = vi.fn().mockReturnValue(transition);
	vi.stubGlobal("document", { startViewTransition: start });

	return { start, transition };
}

describe("ignoreSkippedViewTransitions", () => {
	it("hands both skipped-transition promises a handler", () => {
		const { transition } = stubStartViewTransition();

		ignoreSkippedViewTransitions();
		document.startViewTransition(() => {});

		// Chrome rejects these two when it drops the animation, and TanStack Router never reads them.
		expect(transition.ready.catch).toHaveBeenCalledOnce();
		expect(transition.finished.catch).toHaveBeenCalledOnce();
	});

	it("returns the transition the browser started, with its update callback untouched", async () => {
		const { start, transition } = stubStartViewTransition();
		const update = vi.fn();

		ignoreSkippedViewTransitions();
		const returned = document.startViewTransition(update);

		expect(start).toHaveBeenCalledOnce();
		expect(returned).toBe(transition);
		expect(await returned.updateCallbackDone).toBeUndefined();
	});

	it("leaves a browser without view transitions alone", () => {
		vi.stubGlobal("document", {});

		expect(() => ignoreSkippedViewTransitions()).not.toThrow();
		expect(document.startViewTransition).toBeUndefined();
	});
});
