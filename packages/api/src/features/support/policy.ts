import { SUPPORT_CONVERSATION_LIMIT } from "@reactive-resume/utils/support-faq";

export const CONVERSATION_LIMIT = SUPPORT_CONVERSATION_LIMIT;
export const MESSAGE_LIMIT = 1000;
const ESCALATION_EXCERPT_LIMIT = 300;

const EMPTY_COMPLAINT = "Saya butuh bantuan soal pesanan atau refund.";

export function isConversationFull(messageCount: number): boolean {
	// Sisakan ruang untuk pesan pengguna dan balasan asisten, supaya percakapan tidak pernah melewati 40.
	return messageCount + 2 > CONVERSATION_LIMIT;
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
