// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthPanel } from "./auth-panel";

describe("AuthPanel", () => {
	it("renders the title as the page heading inside the panel", () => {
		const { container } = render(
			<AuthPanel title="Sign in" description="Use your email, or a social account.">
				<form data-testid="body" />
			</AuthPanel>,
		);

		const panel = container.querySelector("[data-auth-panel]");
		const heading = screen.getByRole("heading", { level: 1 });

		expect(heading.textContent).toBe("Sign in");
		expect(panel?.contains(heading)).toBe(true);
		expect(screen.getByText("Use your email, or a social account.")).toBeDefined();
		expect(panel?.querySelector("form")).not.toBeNull();
	});

	it("puts the cross link in a footer under the panel body", () => {
		const { container } = render(
			<AuthPanel
				title="Sign in"
				footer={
					<>
						No account? <a href="/auth/register">Create one</a>
					</>
				}
			>
				<form />
			</AuthPanel>,
		);

		const panel = container.querySelector("[data-auth-panel]");
		const footer = container.querySelector("[data-auth-panel-footer]");
		const link = screen.getByRole("link", { name: "Create one" });

		expect(footer).not.toBeNull();
		expect(footer?.contains(link)).toBe(true);
		expect(panel?.lastElementChild).toBe(footer);
	});
});
