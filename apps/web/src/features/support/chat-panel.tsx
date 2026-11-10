import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SUPPORT_CONVERSATION_LIMIT, SUPPORT_WHATSAPP_URL } from "@reactive-resume/utils/support-faq";
import { orpc } from "@/libs/orpc/client";

const FALLBACK_WHATSAPP = SUPPORT_WHATSAPP_URL;

type ChatMessage = { id: string; role: string; content: string };

type ViewProps = {
	messages: ChatMessage[];
	aiFailed: boolean;
	whatsappUrl: string;
	onSend: (message: string) => void;
	onReset: () => void;
	sending: boolean;
	error?: string | null;
	full?: boolean;
	onWhatsapp?: () => void;
};

export function SupportChatView({
	messages,
	aiFailed,
	whatsappUrl,
	onSend,
	onReset,
	sending,
	error,
	full,
	onWhatsapp,
}: ViewProps) {
	const [draft, setDraft] = useState("");
	const canSend = draft.trim().length > 0 && draft.length <= 1000 && !sending && !full;
	const seen = useRef(messages.length);

	// Draf baru dikosongkan setelah pesan benar-benar bertambah, supaya teks tidak hilang saat server menolak.
	useEffect(() => {
		if (messages.length > seen.current) setDraft("");
		seen.current = messages.length;
	}, [messages.length]);

	return (
		<div className="grid gap-5">
			<div className="grid gap-3 rounded-xl border border-line bg-card p-4">
				{messages.length === 0 ? (
					<p className="text-sm text-ink-3">
						Belum ada pesan. Tulis pertanyaanmu soal pembayaran, kredit, atau pengembalian dana.
					</p>
				) : (
					<ul className="grid gap-3">
						{messages.map((message) => (
							<li
								key={message.id}
								className={
									message.role === "user"
										? "justify-self-end rounded-lg bg-ink px-3.5 py-2 text-sm text-bg"
										: "justify-self-start rounded-lg bg-hover px-3.5 py-2 text-sm text-ink"
								}
							>
								{message.content}
							</li>
						))}
					</ul>
				)}

				{aiFailed ? (
					<p className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2">
						Bantuan otomatis sedang tidak bisa menjawab. Lanjutkan lewat WhatsApp supaya admin bisa membaca
						percakapanmu.
					</p>
				) : null}

				{error ? (
					<p className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2">{error}</p>
				) : null}

				{full ? (
					<p className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2">
						Percakapan ini sudah mencapai 40 pesan. Tekan Mulai topik baru untuk melanjutkan.
					</p>
				) : null}
			</div>

			<div className="grid gap-2">
				<textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					placeholder="Tulis pertanyaanmu di sini"
					className="min-h-24 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink disabled:opacity-50"
					maxLength={1000}
					disabled={full}
				/>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-xs text-ink-3">{draft.length} dari 1000 karakter</span>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => {
								onSend(draft.trim());
							}}
							disabled={!canSend}
							className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
						>
							Kirim
						</button>
						<button
							type="button"
							onClick={onReset}
							className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
						>
							Mulai topik baru
						</button>
						<a
							href={whatsappUrl || FALLBACK_WHATSAPP}
							target="_blank"
							rel="noreferrer"
							onClick={() => onWhatsapp?.()}
							className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
						>
							Lanjut ke WhatsApp admin
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

export function SupportChat() {
	const queryClient = useQueryClient();
	const thread = useQuery(orpc.support.thread.queryOptions());
	const send = useMutation(orpc.support.send.mutationOptions());
	const reset = useMutation(orpc.support.reset.mutationOptions());
	const escalate = useMutation(orpc.support.escalate.mutationOptions());

	const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.support.thread.key() });

	const messages = thread.data?.messages ?? [];
	const full = messages.length + 2 > SUPPORT_CONVERSATION_LIMIT;
	const whatsappUrl = escalate.data?.url ?? FALLBACK_WHATSAPP;

	const code = (send.error as { data?: { code?: string } } | null)?.data?.code;
	const error = send.error
		? code === "CONVERSATION_FULL"
			? "Percakapan sudah penuh. Tekan Mulai topik baru untuk melanjutkan."
			: code === "TOO_MANY_REQUESTS"
				? "Terlalu banyak pesan dalam satu jam. Coba lagi nanti."
				: "Pesan gagal dikirim. Teksmu masih ada di kotak, coba kirim lagi."
		: null;

	return (
		<SupportChatView
			messages={messages}
			aiFailed={Boolean(send.data?.aiFailed)}
			whatsappUrl={whatsappUrl}
			sending={send.isPending}
			error={error}
			full={full}
			onSend={(message) => send.mutate({ message }, { onSuccess: () => void invalidate() })}
			onReset={() => {
				const ok = window.confirm(
					"Percakapan baru akan menutup percakapan ini. Riwayatnya tidak bisa dibuka lagi. Lanjut?",
				);
				if (!ok) return;
				send.reset();
				reset.mutate(undefined, { onSuccess: () => void invalidate() });
			}}
			onWhatsapp={() => escalate.mutate(undefined)}
		/>
	);
}
