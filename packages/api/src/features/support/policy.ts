export const CONVERSATION_LIMIT = 40;
export const MESSAGE_LIMIT = 1000;
const ESCALATION_EXCERPT_LIMIT = 300;

const EMPTY_COMPLAINT = "Saya butuh bantuan soal pesanan atau refund.";

export function isConversationFull(messageCount: number): boolean {
	return messageCount >= CONVERSATION_LIMIT;
}

type EscalationInput = {
	name: string;
	email: string;
	lastUserMessage: string | null;
};

/** Pesan WhatsApp yang sudah terisi, supaya pengguna tidak perlu mengetik ulang konteksnya. */
export function buildEscalationText(input: EscalationInput): string {
	const complaint = (input.lastUserMessage ?? "").trim().slice(0, ESCALATION_EXCERPT_LIMIT) || EMPTY_COMPLAINT;

	return `Halo admin PortoFit, saya ${input.name} (${input.email}).\nKendala: ${complaint}\nMohon dibantu, terima kasih.`;
}
