import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	run: vi.fn<() => Promise<{ sent: number; failed: number }>>(),
	env: { CRON_SECRET: "synthetic-invoice-runner-secret-32-characters" as string | undefined },
}));

vi.mock("@reactive-resume/env/server", () => ({ env: mocks.env }));
vi.mock("@reactive-resume/api/features/invoice/mailer", () => ({ processInvoiceEmails: mocks.run }));

beforeEach(() => {
	mocks.run.mockReset().mockResolvedValue({ sent: 1, failed: 0 });
	mocks.env.CRON_SECRET = "synthetic-invoice-runner-secret-32-characters";
});

describe("invoice mailer authentication", () => {
	it("menyembunyikan rute kalau secret belum diatur", async () => {
		mocks.env.CRON_SECRET = undefined;
		const { handleInvoiceJobs } = await import("./invoice-jobs");
		const response = await handleInvoiceJobs(new Request("http://localhost:3000/api/cron/invoice-mailer", { method: "POST" }));

		expect(response.status).toBe(404);
		expect(mocks.run).not.toHaveBeenCalled();
	});

	it.each([undefined, "Bearer short", "Bearer synthetic-invoice-runner-secret-32-characterX"])(
		"menolak otorisasi %s tanpa mengirim email",
		async (authorization) => {
			const { handleInvoiceJobs } = await import("./invoice-jobs");
			const response = await handleInvoiceJobs(
				new Request("http://localhost:3000/api/cron/invoice-mailer", {
					method: "POST",
					headers: authorization ? { authorization } : {},
				}),
			);

			expect(response.status).toBe(401);
			expect(mocks.run).not.toHaveBeenCalled();
		},
	);

	it("menjalankan antrean dengan secret yang benar", async () => {
		const { handleInvoiceJobs } = await import("./invoice-jobs");
		const response = await handleInvoiceJobs(
			new Request("http://localhost:3000/api/cron/invoice-mailer", {
				method: "POST",
				headers: { authorization: "Bearer synthetic-invoice-runner-secret-32-characters" },
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ sent: 1, failed: 0 });
	});
});
