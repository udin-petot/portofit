// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupportChatView } from "./chat-panel";

const base = {
	messages: [] as { id: string; role: string; content: string }[],
	aiFailed: false,
	whatsappUrl: "https://wa.me/6281939948769?text=halo",
	onSend: () => {},
	onReset: () => {},
	sending: false,
};

describe("SupportChatView", () => {
	it("menampilkan ajakan menulis saat percakapan kosong", () => {
		render(<SupportChatView {...base} />);
		expect(screen.getByText(/belum ada pesan/i)).toBeTruthy();
	});

	it("menampilkan tombol WhatsApp walau AI gagal", () => {
		render(<SupportChatView {...base} aiFailed />);
		expect(screen.getByRole("link", { name: /whatsapp/i })).toBeTruthy();
		expect(screen.getByText(/tidak bisa menjawab/i)).toBeTruthy();
	});

	it("menampilkan pesan yang sudah ada", () => {
		render(
			<SupportChatView
				{...base}
				messages={[
					{ id: "1", role: "user", content: "Kredit belum masuk" },
					{ id: "2", role: "assistant", content: "Admin yang memutuskan pengembalian dana." },
				]}
			/>,
		);
		expect(screen.getByText("Kredit belum masuk")).toBeTruthy();
		expect(screen.getByText("Admin yang memutuskan pengembalian dana.")).toBeTruthy();
	});
});
