import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@reactive-resume/ui/components/icon";
import { SUPPORT_CONVERSATION_LIMIT, SUPPORT_WHATSAPP_URL } from "@reactive-resume/utils/support-faq";
import { AssistantMarkdown } from "@/features/assistant/markdown";
import { orpc } from "@/libs/orpc/client";

const FALLBACK_WHATSAPP = SUPPORT_WHATSAPP_URL;

type ChatMessage = { id: string; role: string; content: string };

type ViewProps = {
	messages: ChatMessage[];
	aiFailed: boolean;
	whatsappUrl: string;
	onSend: (message: string) => Promise<boolean>;
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
	const [pending, setPending] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const canSend = draft.trim().length > 0 && draft.length <= 1000 && !sending && !submitting && !full;
	const end = useRef<HTMLDivElement>(null);

	useEffect(() => {
		end.current?.scrollIntoView({ block: "end" });
	}, [messages.length, pending]);

	const submit = async () => {
		const message = draft.trim();
		if (!message || submitting || full) return;

		setDraft("");
		setPending(message);
		setSubmitting(true);

		let ok = false;
		try {
			ok = await onSend(message);
		} catch {
			ok = false;
		} finally {
			setSubmitting(false);
			setPending(null);
		}

		if (!ok) setDraft(message);
	};

	const visible = pending
		? [...messages, { id: "pending", role: "user", content: pending } satisfies ChatMessage]
		: messages;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
				{visible.length === 0 ? (
					<div className="grid gap-2">
						<p className="text-sm leading-6 text-ink">
							Belum ada pesan. Tulis pertanyaanmu soal pembayaran, kredit, atau pengembalian dana.
						</p>
						<p className="text-xs text-ink-3">Dijawab otomatis. Kalau perlu keputusan admin, lanjut ke WhatsApp.</p>
					</div>
				) : (
					<ul className="grid gap-4">
						{visible.map((message) => (
							<li key={message.id} className={message.role === "user" ? "grid justify-items-end gap-1" : "grid gap-1"}>
								<span className="text-[11px] font-medium text-ink-3">
									{message.role === "user" ? "Kamu" : "Bantuan PortoFit"}
								</span>
								{message.role === "user" ? (
									<p className="max-w-[85%] rounded-[12px_12px_4px_12px] bg-sunken px-3 py-2 text-sm whitespace-pre-wrap text-ink">
										{message.content}
									</p>
								) : (
									<div className="text-sm text-ink">
										<AssistantMarkdown text={message.content} />
									</div>
								)}
							</li>
						))}
					</ul>
				)}

				{pending || sending ? (
					<div className="mt-3 grid gap-1">
						<span className="text-[11px] font-medium text-ink-3">Bantuan PortoFit</span>
						<p className="text-sm text-ink-3">Sedang mengetik…</p>
					</div>
				) : null}

				{aiFailed ? (
					<p className="mt-3 rounded-lg border border-line px-3 py-2 text-xs leading-5 text-ink-2">
						Bantuan otomatis sedang tidak bisa menjawab. Lanjut lewat WhatsApp supaya admin bisa membaca percakapanmu.
					</p>
				) : null}

				{error ? (
					<p className="mt-3 rounded-lg border border-line px-3 py-2 text-xs leading-5 text-ink-2">{error}</p>
				) : null}

				{full ? (
					<p className="mt-3 rounded-lg border border-line px-3 py-2 text-xs leading-5 text-ink-2">
						Percakapan ini sudah mencapai batas pesan. Mulai topik baru untuk melanjutkan.
					</p>
				) : null}

				<div ref={end} />
			</div>

			<div className="grid gap-2 border-t border-line px-3 pt-2.5 pb-3">
				<div className="flex items-end gap-1.5 rounded-xl border border-line-2 bg-raised p-1.5 transition-[border-color,box-shadow] duration-quick focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-soft">
					<textarea
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey && canSend) {
								event.preventDefault();
								void submit();
							}
						}}
						placeholder="Tulis pertanyaanmu di sini"
						rows={2}
						className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink-3 disabled:opacity-60"
						maxLength={1000}
						disabled={full}
					/>
					<button
						type="button"
						onClick={() => {
							void submit();
						}}
						disabled={!canSend}
						aria-label="Kirim pesan"
						className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-accent text-on-accent transition-[background-color,scale] duration-quick ease-enter enabled:active:scale-[0.97] disabled:opacity-40"
					>
						<Icon name="arrow-up" size={18} />
					</button>
				</div>
				<div className="flex items-center justify-between gap-3 text-xs">
					<a
						href={whatsappUrl || FALLBACK_WHATSAPP}
						target="_blank"
						rel="noreferrer"
						onClick={() => onWhatsapp?.()}
						className="text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline"
					>
						WhatsApp admin
					</a>
					<div className="flex items-center gap-3">
						{draft.length > 800 ? <span className="text-ink-3">{draft.length}/1000</span> : null}
						<button
							type="button"
							onClick={onReset}
							className="text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline"
						>
							Topik baru
						</button>
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
			? "Percakapan sudah penuh. Mulai topik baru untuk melanjutkan."
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
			onSend={async (message) => {
				try {
					await send.mutateAsync({ message });
					await invalidate();
					return true;
				} catch {
					return false;
				}
			}}
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
