// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SUPPORT_FAQ } from "@reactive-resume/utils/support-faq";
import { FaqList } from "./faq-list";

describe("FaqList", () => {
	it("menampilkan setiap pertanyaan dari sumber tunggal", () => {
		render(<FaqList />);
		for (const item of SUPPORT_FAQ) expect(screen.getByText(item.question)).toBeTruthy();
	});

	it("mengelompokkan refund di bagian sendiri", () => {
		render(<FaqList />);
		expect(screen.getByRole("heading", { name: "Pengembalian dana" })).toBeTruthy();
	});

	it("menampilkan baris harga saat diberikan", () => {
		render(<FaqList priceLine="Paket saat ini Rp5.000 dan Rp10.000." />);
		expect(screen.getByText("Paket saat ini Rp5.000 dan Rp10.000.")).toBeTruthy();
	});
});
