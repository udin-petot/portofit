import { describe, expect, it } from "vitest";
import { rateLimitConfig } from "./rate-limit";

describe("support rate limit", () => {
	it("membatasi 30 pesan per jam", () => {
		expect(rateLimitConfig.orpc.supportRequest).toEqual({ maxRequests: 30, window: 60 * 60 * 1000 });
	});
});
