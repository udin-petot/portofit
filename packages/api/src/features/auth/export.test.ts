import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyCoverLetterStyle } from "@reactive-resume/resume/cover-letter";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const mocks = vi.hoisted(() => ({
	select: vi.fn(),
	predicates: [] as unknown[],
	getLetter: vi.fn(),
	exportCareer: vi.fn(),
	listOrders: vi.fn(),
	ledger: vi.fn(),
	listInvoices: vi.fn(),
}));
vi.mock("@reactive-resume/db/client", () => ({ db: { select: mocks.select } }));
vi.mock("@reactive-resume/db/schema", () => ({
	user: { id: "user.id" },
	resume: { userId: "resume.userId" },
	coverLetter: { userId: "coverLetter.userId" },
	application: { userId: "application.userId" },
}));
vi.mock("drizzle-orm", () => ({ eq: (column: unknown, value: unknown) => ({ column, value }) }));
vi.mock("@reactive-resume/env/server", () => ({ env: {} }));
vi.mock("@reactive-resume/auth/config", () => ({ isCustomOAuthProviderEnabled: () => false }));
vi.mock("../storage/service", () => ({ getStorageService: vi.fn() }));
vi.mock("../cover-letters/service", () => ({ coverLetterService: { getById: mocks.getLetter } }));
vi.mock("../career/service", () => ({ careerService: { exportData: mocks.exportCareer } }));
vi.mock("../billing/service", () => ({
	billingService: { listMyOrders: mocks.listOrders, ledger: mocks.ledger },
}));
vi.mock("../invoice/service", () => ({ listInvoices: mocks.listInvoices }));
const { authService } = await import("./service");

describe("account backup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.predicates.length = 0;
		mocks.listOrders.mockResolvedValue({ orders: [] });
		mocks.ledger.mockResolvedValue({ entries: [] });
		mocks.listInvoices.mockResolvedValue([]);
	});

	it.each([false, true])(
		"includes owned letters, applications and career data alongside resumes (linked: %s)",
		async (linked) => {
			const letter = {
				id: "letter",
				name: "Saved",
				recipient: "",
				content: "<p>Body</p>",
				style: copyCoverLetterStyle(defaultResumeData),
				layout: "freeform",
				recipientName: "",
				recipientCompany: "",
				letterDate: null,
				senderLinked: linked,
				designLinked: linked,
				isLocked: false,
				sourceResumeId: linked ? "resume" : null,
				sourceApplicationId: null,
				revision: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const resolved = structuredClone(letter);
			if (linked) {
				resolved.style.basics.name = "Current sender";
				resolved.style.metadata.template = "gengar";
			}
			mocks.getLetter.mockResolvedValue(resolved);
			const career = {
				facts: [
					{
						id: "fact",
						text: "I led a warehouse migration.",
						source: { kind: "manual", id: "career-note", quote: "I led a warehouse migration." },
					},
				],
				artifacts: [
					{
						id: "brief",
						data: { kind: "brief", markdown: "Discuss the warehouse migration." },
						evidence: { factIds: ["fact"], sources: [] },
					},
				],
				transcripts: [{ id: "transcript", original: "I lead the migration.", edited: "I led the migration." }],
			};
			mocks.exportCareer.mockResolvedValue(career);
			const application = { id: "application", userId: "owner", company: "Lumen", role: "Designer" };
			for (const rows of [
				[{ id: "owner", name: "Owner" }],
				[{ id: "resume", data: defaultResumeData }],
				[letter],
				[application],
			]) {
				mocks.select.mockReturnValueOnce({
					from: () => ({
						where: (predicate: unknown) => {
							mocks.predicates.push(predicate);
							return Promise.resolve(rows);
						},
					}),
				});
			}
			const exported = await authService.exportData({ userId: "owner" });
			expect(exported).toMatchObject({ coverLetters: [resolved], resumes: [{ id: "resume" }] });
			// Applications come along, without the owner's id.
			expect(exported.applications).toEqual([{ id: "application", company: "Lumen", role: "Designer" }]);
			expect(mocks.predicates).toContainEqual({ column: "coverLetter.userId", value: "owner" });
			expect(mocks.exportCareer).toHaveBeenCalledExactlyOnceWith("owner");
			expect(exported.career).toEqual(career);
			expect(exported.billing).toEqual({ orders: [], invoices: [], ledger: [] });
		},
	);

	it("includes billing orders, invoices and the credit ledger", async () => {
		mocks.listOrders.mockResolvedValue({ orders: [{ id: "order-1" }] });
		mocks.ledger.mockResolvedValue({ entries: [{ id: "ledger-1" }] });
		mocks.listInvoices.mockResolvedValue([{ id: "invoice-1" }]);
		mocks.exportCareer.mockResolvedValue({});
		for (const rows of [[{ id: "owner" }], [], [], []]) {
			mocks.select.mockReturnValueOnce({
				from: () => ({
					where: () => Promise.resolve(rows),
				}),
			});
		}

		const exported = await authService.exportData({ userId: "owner" });

		expect(exported.billing).toEqual({
			orders: [{ id: "order-1" }],
			invoices: [{ id: "invoice-1" }],
			ledger: [{ id: "ledger-1" }],
		});
		expect(mocks.listOrders).toHaveBeenCalledWith("owner", 1000);
		expect(mocks.ledger).toHaveBeenCalledWith("owner", 1000);
		expect(mocks.listInvoices).toHaveBeenCalledWith("owner");
	});
});
