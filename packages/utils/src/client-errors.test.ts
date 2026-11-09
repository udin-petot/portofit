import { describe, expect, it } from "vitest";
import { isIgnorableClientError } from "./client-errors";

describe("isIgnorableClientError", () => {
	it("ignores both ResizeObserver loop warnings", () => {
		expect(isIgnorableClientError("ResizeObserver loop completed with undelivered notifications.")).toBe(true);
		expect(isIgnorableClientError("ResizeObserver loop limit exceeded")).toBe(true);
		expect(isIgnorableClientError("  resizeobserver loop limit exceeded  ")).toBe(true);
	});

	it("keeps real errors", () => {
		expect(isIgnorableClientError("TypeError: cannot read properties of undefined")).toBe(false);
		expect(isIgnorableClientError("ResizeObserver is not defined")).toBe(false);
		expect(isIgnorableClientError("")).toBe(false);
	});
});
