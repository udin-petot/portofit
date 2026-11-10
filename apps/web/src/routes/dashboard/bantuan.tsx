import { createFileRoute } from "@tanstack/react-router";
import { SupportChat } from "@/features/support/chat-panel";
import { FaqList } from "@/features/support/faq-list";

export const Route = createFileRoute("/dashboard/bantuan")({
	component: RouteComponent,
	head: () => ({
		meta: [{ title: "Bantuan PortoFit" }, { name: "robots", content: "noindex, follow" }],
	}),
});

function RouteComponent() {
	return (
		<div className="mx-auto grid w-full max-w-3xl gap-8 px-5 py-10">
			<header className="grid gap-2">
				<h1 className="text-2xl font-semibold tracking-tight text-ink">Bantuan</h1>
				<p className="text-sm leading-6 text-ink-2">
					Bantuan cepat lewat chat. Kalau pertanyaanmu butuh keputusan admin, tekan tombol WhatsApp di bawah supaya
					percakapanmu ikut terkirim.
				</p>
			</header>

			<SupportChat />

			<section className="grid gap-3 border-t border-line pt-8">
				<h2 className="text-lg font-semibold tracking-tight text-ink">Pertanyaan umum</h2>
				<FaqList />
			</section>
		</div>
	);
}
