import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	run: vi.fn<() => Promise<{ expired: number; reminded: number }>>(),
	env: { CRON_SECRET: "synthetic-expiry-runner-secret-32-characters" as string | undefined },
}));

vi.mock("@reactive-resume/env/server", () => ({ env: mocks.env }));
vi.mock("@reactive-resume/api/features/billing/sweep", () => ({ sweepOrders: mocks.run }));

beforeEach(() => {
	mocks.run.mockReset().mockResolvedValue({ expired: 1, reminded: 2 });
	mocks.env.CRON_SECRET = "synthetic-expiry-runner-secret-32-characters";
});

describe("order expiry authentication", () => {
	it("menyembunyikan rute kalau secret belum diatur", async () => {
		mocks.env.CRON_SECRET = undefined;
		const { handleOrderExpiry } = await import("./order-expiry-jobs");
		const response = await handleOrderExpiry(new Request("http://localhost:3000/api/cron/order-expiry", { method: "POST" }));

		expect(response.status).toBe(404);
		expect(mocks.run).not.toHaveBeenCalled();
	});

	it("menolak otorisasi yang salah", async () => {
		const { handleOrderExpiry } = await import("./order-expiry-jobs");
		const response = await handleOrderExpiry(
			new Request("http://localhost:3000/api/cron/order-expiry", {
				method: "POST",
				headers: { authorization: "Bearer salah" },
			}),
		);

		expect(response.status).toBe(401);
		expect(mocks.run).not.toHaveBeenCalled();
	});

	it("menjalankan penyapu dengan secret yang benar", async () => {
		const { handleOrderExpiry } = await import("./order-expiry-jobs");
		const response = await handleOrderExpiry(
			new Request("http://localhost:3000/api/cron/order-expiry", {
				method: "POST",
				headers: { authorization: "Bearer synthetic-expiry-runner-secret-32-characters" },
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ expired: 1, reminded: 2 });
	});
});
