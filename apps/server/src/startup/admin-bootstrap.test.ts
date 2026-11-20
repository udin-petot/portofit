import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	env: { ADMIN_EMAILS: undefined as string | undefined },
	update: vi.fn(),
	set: vi.fn(),
	where: vi.fn(),
	returning: vi.fn(),
	inArray: vi.fn((column: unknown, values: unknown) => ({ column, values })),
}));

vi.mock("@reactive-resume/env/server", () => ({ env: mocks.env }));
vi.mock("@reactive-resume/db/client", () => ({ db: { update: mocks.update } }));
vi.mock("@reactive-resume/db/schema", () => ({ user: { id: "user.id", email: "user.email" } }));
vi.mock("drizzle-orm", () => ({ inArray: mocks.inArray, sql: () => "lower(user.email)" }));

const { promoteConfiguredAdmins } = await import("./admin-bootstrap");

describe("promoteConfiguredAdmins", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.env.ADMIN_EMAILS = undefined;
		mocks.returning.mockResolvedValue([{ id: "user-1" }]);
		mocks.where.mockReturnValue({ returning: mocks.returning });
		mocks.set.mockReturnValue({ where: mocks.where });
		mocks.update.mockReturnValue({ set: mocks.set });
	});

	it("tidak menyentuh database kalau ADMIN_EMAILS kosong", async () => {
		expect(await promoteConfiguredAdmins()).toBe(0);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("menormalkan email dan mengembalikan jumlah akun yang dipromosikan", async () => {
		mocks.env.ADMIN_EMAILS = " A@X.com, b@y.com ";

		expect(await promoteConfiguredAdmins()).toBe(1);
		expect(mocks.set).toHaveBeenCalledWith({ role: "admin" });
		expect(mocks.inArray).toHaveBeenCalledWith("lower(user.email)", ["a@x.com", "b@y.com"]);
	});
});
