import { expect, test } from "vitest";
import { secondOffset } from "./waiting-clock";

test("jarum mulai di detik saat popup dibuka", () => {
	expect(secondOffset(new Date("2026-11-13T22:19:38+07:00"))).toBe(38);
	expect(secondOffset(new Date("2026-11-13T22:19:00+07:00"))).toBe(0);
});
