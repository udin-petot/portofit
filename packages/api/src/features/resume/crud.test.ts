import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRouterClient } from "@orpc/server";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	update: vi.fn(),
	snapshot: vi.fn(),
}));

vi.mock("../../context", async () => {
	const { os } = await vi.importActual<typeof import("@orpc/server")>("@orpc/server");
	return {
		protectedProcedure: os.$context<{
			locale: "en-US";
			reqHeaders: Headers;
			user: { id: string };
		}>(),
	};
});

vi.mock("./service", () => ({
	resumeService: {
		create: mocks.create,
		update: mocks.update,
		versions: { snapshot: mocks.snapshot },
	},
}));

const { crudRouter } = await import("./crud");

describe("resume write route validation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.create.mockResolvedValue("resume-id");
		mocks.update.mockResolvedValue({});
		mocks.snapshot.mockResolvedValue(undefined);
	});

	it.each(["import", "update"] as const)("rejects invalid %s input before calling persistence", async (operation) => {
		const client = createRouterClient(crudRouter, {
			context: { locale: "en-US", reqHeaders: new Headers(), user: { id: "user-id" } } as never,
		});
		const data = structuredClone(defaultResumeData);
		data.metadata.page.marginX = 500;

		const result = operation === "import" ? client.import({ data }) : client.update({ id: "resume-id", data });
		const error = await result.catch((caught: unknown) => caught);

		expect(error).toMatchObject({ code: "BAD_REQUEST", status: 400 });
		expect(error).toHaveProperty("cause.issues.0.path", ["data", "metadata", "page", "marginX"]);
		expect(mocks.create).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.snapshot).not.toHaveBeenCalled();
	});

	it("puts the account holder's name on a blank resume", async () => {
		const client = createRouterClient(crudRouter, {
			context: { locale: "en-US", reqHeaders: new Headers(), user: { id: "user-id", name: "Sam Taylor" } } as never,
		});

		await client.create({ name: "Outstanding Blue Whale", tags: [], withSampleData: false });

		expect(mocks.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Outstanding Blue Whale",
				data: expect.objectContaining({ basics: expect.objectContaining({ name: "Sam Taylor" }) }),
			}),
		);
	});

	it("keeps the example's own persona on a resume started from the example", async () => {
		const client = createRouterClient(crudRouter, {
			context: { locale: "en-US", reqHeaders: new Headers(), user: { id: "user-id", name: "Sam Taylor" } } as never,
		});

		await client.create({ name: "Outstanding Blue Whale", tags: [], withSampleData: true });

		const created = mocks.create.mock.calls.at(-1)?.[0] as { data: { basics: { name: string } } };
		expect(created.data.basics.name).not.toBe("Sam Taylor");
		expect(created.data.basics.name.length).toBeGreaterThan(0);
	});
});
