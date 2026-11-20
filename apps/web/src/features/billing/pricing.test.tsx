// @vitest-environment happy-dom
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

i18n.loadAndActivate({ locale: "en", messages: {} });

const refetch = vi.fn();

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({ data: undefined, isLoading: false, isError: true, refetch }),
	useMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		billing: {
			plans: { queryOptions: () => ({}) },
			createOrder: { mutationOptions: () => ({}) },
		},
	},
}));

const { PlanList } = await import("./pricing");

describe("PlanList", () => {
	it("menampilkan pesan dan tombol coba lagi saat paket gagal dimuat", () => {
		render(
			<I18nProvider i18n={i18n}>
				<PlanList signedIn />
			</I18nProvider>,
		);

		expect(screen.getByRole("alert")).toBeTruthy();
		expect(screen.getByText("Packages couldn't be loaded.")).toBeTruthy();
		fireEvent.click(screen.getByText("Try again"));
		expect(refetch).toHaveBeenCalledTimes(1);
	});
});
