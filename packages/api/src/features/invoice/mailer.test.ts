import { describe, expect, it } from "vitest";
import { nextDeliveryState } from "./mailer";

describe("nextDeliveryState", () => {
	it("mencoba lagi dengan status pending selama belum tiga kali", () => {
		expect(nextDeliveryState(0, "SMTP mati")).toEqual({ attempts: 1, status: "pending", lastError: "SMTP mati" });
		expect(nextDeliveryState(1, "SMTP mati")).toEqual({ attempts: 2, status: "pending", lastError: "SMTP mati" });
	});

	it("menyerah setelah percobaan ketiga", () => {
		expect(nextDeliveryState(2, "SMTP mati")).toEqual({ attempts: 3, status: "failed", lastError: "SMTP mati" });
	});
});
