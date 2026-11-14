// @vitest-environment happy-dom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupportChatView } from "./chat-panel";

const base = {
	messages: [] as { id: string; role: string; content: string }[],
	aiFailed: false,
	whatsappUrl: "https://wa.me/6281939948769?text=halo",
	onSend: async () => true,
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

	it("menampilkan pesan error dan menonaktifkan input saat percakapan penuh", () => {
		render(<SupportChatView {...base} error="Percakapan sudah penuh. Tekan Mulai topik baru." full />);
		expect(screen.getByText(/percakapan sudah penuh/i)).toBeTruthy();
		const box = screen.getByPlaceholderText(/tulis pertanyaanmu/i) as HTMLTextAreaElement;
		expect(box.disabled).toBe(true);
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

	it("menampilkan pesan segera dan mengosongkan draft sebelum server selesai", async () => {
		let resolveSend: (value: boolean) => void = () => {};
		const onSend = vi.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSend = resolve;
				}),
		);

		render(<SupportChatView {...base} onSend={onSend} />);
		const box = screen.getByPlaceholderText(/tulis pertanyaanmu/i) as HTMLTextAreaElement;
		fireEvent.change(box, { target: { value: "Kredit belum masuk" } });
		fireEvent.click(screen.getByRole("button", { name: /kirim pesan/i }));

		await waitFor(() => expect(screen.getByText("Kredit belum masuk")).toBeTruthy());
		expect(box.value).toBe("");
		expect(screen.getByText(/sedang mengetik/i)).toBeTruthy();

		resolveSend(true);
		await waitFor(() => expect(screen.queryByText(/sedang mengetik/i)).toBeNull());
	});

	it("mengembalikan draft saat pengiriman gagal", async () => {
		const onSend = vi.fn(async () => false);

		render(<SupportChatView {...base} onSend={onSend} />);
		const box = screen.getByPlaceholderText(/tulis pertanyaanmu/i) as HTMLTextAreaElement;
		fireEvent.change(box, { target: { value: "Tes gagal" } });
		fireEvent.click(screen.getByRole("button", { name: /kirim pesan/i }));

		await waitFor(() => expect(box.value).toBe("Tes gagal"));
	});
});
