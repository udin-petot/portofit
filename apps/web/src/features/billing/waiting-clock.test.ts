import { expect, test } from "vitest";
import { startOffset } from "./waiting-clock";

test("jarum mulai di posisi acak yang tetap, bukan selalu di arah yang sama", () => {
	expect(startOffset(new Date("2026-11-13T22:19:38+07:00"))).toBe(2);
	expect(startOffset(new Date("2026-11-13T22:19:00+07:00"))).toBe(0);
});
