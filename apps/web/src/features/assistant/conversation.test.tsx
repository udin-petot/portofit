// @vitest-environment happy-dom
import type { AssistantDocument } from "./document";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { ORPCError } from "@orpc/client";

const mocks = vi.hoisted(() => ({
	chat: vi.fn(),
	send: vi.fn(),
	attach: vi.fn(),
	publish: vi.fn(),
	quota: undefined as unknown,
	balances: undefined as unknown,
}));
vi.mock("@tanstack/react-query", () => ({
	useQuery: (options: { queryKey: string[] }) =>
		options.queryKey[0] === "quota"
			? { data: mocks.quota }
			: options.queryKey[0] === "billing"
				? { data: mocks.balances }
				: { data: undefined },
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@tanstack/react-router", () => ({ Link: () => null }));
vi.mock("@/features/resume/editor/store", () => ({
	useEditorStore: (select: (state: unknown) => unknown) => select({ setAssistantProposals: mocks.publish }),
}));
vi.mock("@/libs/orpc/client", () => ({
	client: { agent: { attachments: { create: mocks.attach } } },
	orpc: {
		agent: { threads: { list: { key: () => ["threads"] } } },
		quota: { status: { key: () => ["quota"], queryOptions: () => ({ queryKey: ["quota"] }) } },
		billing: { balances: { key: () => ["billing"], queryOptions: () => ({ queryKey: ["billing"] }) } },
	},
}));
vi.mock("@reactive-resume/ui/components/toast", () => ({ toast: { add: vi.fn() } }));
vi.mock("./chat", () => ({
	useAssistantChat: mocks.chat,
	fileToBase64: async () => "Zm9v",
	attachmentPart: (file: { id: string; filename: string; mediaType: string }) => ({
		type: "file",
		url: `agent-attachment:${file.id}`,
		filename: file.filename,
		mediaType: file.mediaType,
	}),
	transcriptOf: () => "",
}));

import { Composer, Conversation } from "./conversation";

const document: AssistantDocument = {
	kind: "resume",
	id: "resume-1",
	name: "Resume",
	locked: false,
	posting: { id: "application-2", company: "Selected Company", role: "Engineer" },
	stateOf: () => "pending",
	accept: () => {},
	locationOf: () => undefined,
};
beforeEach(() => {
	vi.clearAllMocks();
	mocks.quota = undefined;
	mocks.balances = undefined;
	i18n.loadAndActivate({ locale: "en-US", messages: {} });
	mocks.chat.mockReturnValue({ messages: [], sendMessage: mocks.send, status: "ready", clearError: vi.fn() });
	mocks.attach.mockResolvedValue({ id: "file-1", filename: "posting.txt", mediaType: "text/plain" });
});
afterEach(cleanup);

it("uploads a file in the initial composer before sending its first message", async () => {
	const ensureThread = vi.fn(async () => "draft-thread");
	const send = vi.fn();
	const { container } = render(
		<I18nProvider i18n={i18n}>
			<Composer
				document={document}
				context={{ document: false, posting: false }}
				onContextChange={() => {}}
				providerLabel="Local"
				managed={false}
				streaming={false}
				disabled={false}
				threadId={null}
				ensureThread={ensureThread}
				onSend={send}
				onStop={() => {}}
			/>
		</I18nProvider>,
	);
	expect(screen.getByRole("button", { name: "Attach a file" })).toBeDefined();
	const input = container.querySelector('input[type="file"]');
	if (!input) throw new Error("File picker missing");
	fireEvent.change(input, { target: { files: [new File(["foo"], "posting.txt", { type: "text/plain" })] } });
	await waitFor(() => expect(screen.getByText("posting.txt")).toBeDefined());
	expect(mocks.attach).toHaveBeenCalledWith({
		threadId: "draft-thread",
		filename: "posting.txt",
		mediaType: "text/plain",
		data: "Zm9v",
	});
	fireEvent.change(screen.getByRole("textbox"), { target: { value: "Review this posting" } });
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(send).toHaveBeenCalledWith("Review this posting", [
		{ id: "file-1", filename: "posting.txt", mediaType: "text/plain" },
	]);
});

it("preserves first-message context exclusions, selected application and attachment IDs", async () => {
	const context = { document: false, posting: true, applicationId: "application-2" };
	render(
		<I18nProvider i18n={i18n}>
			<Conversation
				document={document}
				threadId="thread-1"
				initialMessages={[]}
				activeRun={false}
				readOnly={false}
				providerLabel="Local"
				managed={false}
				initialContext={context}
				prompt="Prepare"
				promptAttachments={[{ id: "file-1", filename: "posting.txt", mediaType: "text/plain" }]}
				onPromptSent={() => {}}
				onSwitchModel={() => {}}
			/>
		</I18nProvider>,
	);
	await waitFor(() =>
		expect(mocks.send).toHaveBeenCalledWith(
			{ text: "Prepare", files: [expect.objectContaining({ url: "agent-attachment:file-1" })] },
			{ body: { attachmentIds: ["file-1"] } },
		),
	);
	expect(mocks.chat.mock.calls[0]?.[0].context).toEqual(context);
});

it("reopens native and custom web results with sources, clipping and failed or unfinished tool status", () => {
	const messages = [
		{
			id: "web-history",
			role: "assistant",
			parts: [
				{ type: "tool-web_search", toolCallId: "old-native", state: "output-available", input: {}, output: {} },
				{ type: "source-url", sourceId: "native", url: "https://company.example/job", title: "Company role" },
				{
					type: "tool-search_web",
					toolCallId: "failed",
					state: "output-error",
					input: {},
					errorText: "Enhanced access quota exhausted",
				},
				{ type: "tool-google_search", toolCallId: "stopped", state: "input-available", input: {} },
				{
					type: "tool-read_page",
					toolCallId: "read",
					state: "output-available",
					input: { url: "https://careers.example/role" },
					output: {
						requestedUrl: "https://careers.example/role",
						content: "Description",
						format: "text",
						method: "builtin",
						retrievedAt: "2026-09-30T12:00:00Z",
						truncated: true,
						completeness: "incomplete",
					},
				},
			],
		},
	];
	mocks.chat.mockReturnValue({ messages, status: "ready", clearError: vi.fn() });
	render(
		<I18nProvider i18n={i18n}>
			<Conversation
				document={document}
				threadId="thread-1"
				initialMessages={[]}
				activeRun={false}
				readOnly={false}
				providerLabel="Local"
				managed={false}
				initialContext={{ document: true, posting: true }}
				prompt={null}
				promptAttachments={[]}
				onPromptSent={() => {}}
				onSwitchModel={() => {}}
			/>
		</I18nProvider>,
	);
	expect(screen.getAllByText("Searched the web")).toHaveLength(1);
	expect(screen.getByRole("alert").textContent).toContain("Enhanced access quota exhausted");
	expect(screen.getByText("Web search didn't finish.")).toBeDefined();
	expect(screen.getByText("This page is clipped or incomplete. Check the original before using it.")).toBeDefined();
	expect(screen.getByRole("link", { name: "Company role" }).getAttribute("href")).toBe("https://company.example/job");
	expect(screen.getByRole("link", { name: "https://careers.example/role" }).getAttribute("href")).toBe(
		"https://careers.example/role",
	);
});

it("omits the key phrase for a managed connection", () => {
	const { container } = render(
		<I18nProvider i18n={i18n}>
			<Composer
				document={document}
				context={{ document: true, posting: false }}
				onContextChange={() => {}}
				providerLabel="AI PortoFit"
				managed
				streaming={false}
				disabled={false}
				threadId="thread-1"
				onSend={() => {}}
				onStop={() => {}}
			/>
		</I18nProvider>,
	);
	const lines = screen.getAllByText((_, element) =>
		Boolean(element?.textContent?.includes("Sends this resume to AI PortoFit only when you press send.")),
	);
	expect(lines.length).toBeGreaterThan(0);
	expect(container.textContent).not.toContain("with your key");
});

it("shows the Coach count and blocks sending when none are left", () => {
	mocks.quota = { features: [{ feature: "coach", remaining: 0 }] };
	mocks.balances = { coach: 0 };
	render(
		<I18nProvider i18n={i18n}>
			<Composer
				document={document}
				context={{ document: true, posting: false }}
				onContextChange={() => {}}
				providerLabel="Local"
				managed={false}
				streaming={false}
				disabled={false}
				threadId="thread-1"
				onSend={() => {}}
				onStop={() => {}}
			/>
		</I18nProvider>,
	);
	expect(screen.getByText("Free Coach messages are used up.")).toBeDefined();
	fireEvent.change(screen.getByRole("textbox"), { target: { value: "Please review this" } });
	const send = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
	expect(send.disabled).toBe(true);
});

it("does not claim a quota-rejected message was kept", () => {
	mocks.chat.mockReturnValue({
		messages: [],
		sendMessage: vi.fn(),
		status: "ready",
		error: new ORPCError("QUOTA_EXHAUSTED", { message: "Coach messages are used up." }),
		clearError: vi.fn(),
	});
	render(
		<I18nProvider i18n={i18n}>
			<Conversation
				document={document}
				threadId="thread-1"
				initialMessages={[]}
				activeRun={false}
				readOnly={false}
				providerLabel="AI PortoFit"
				managed
				initialContext={{ document: true, posting: true }}
				prompt={null}
				promptAttachments={[]}
				onPromptSent={() => {}}
				onSwitchModel={() => {}}
			/>
		</I18nProvider>,
	);
	const alert = screen.getByRole("alert");
	expect(alert.textContent).toContain("Your message was not sent.");
	expect(alert.textContent).not.toContain("Your message is kept.");
});

it("offers the rejected message for copying so it isn't lost", async () => {
	const writeText = vi.fn(async () => {});
	Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
	mocks.chat.mockReturnValue({
		messages: [],
		sendMessage: vi.fn(),
		status: "ready",
		error: new ORPCError("QUOTA_EXHAUSTED", { message: "Coach messages are used up." }),
		clearError: vi.fn(),
	});
	render(
		<I18nProvider i18n={i18n}>
			<Conversation
				document={document}
				threadId="thread-1"
				initialMessages={[]}
				activeRun={false}
				readOnly={false}
				providerLabel="AI PortoFit"
				managed
				initialContext={{ document: true, posting: true }}
				prompt={null}
				promptAttachments={[]}
				onPromptSent={() => {}}
				onSwitchModel={() => {}}
			/>
		</I18nProvider>,
	);
	fireEvent.change(screen.getByRole("textbox"), { target: { value: "Perbaiki ringkasan ini" } });
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() => expect(screen.getByRole("button", { name: "Copy message" })).toBeDefined());
	fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
	await waitFor(() => expect(writeText).toHaveBeenCalledWith("Perbaiki ringkasan ini"));
});
