import { createElement } from "react";
import { OrderEmail, type OrderEmailKind } from "./templates/order";
import { sendEmail } from "./transport";

export type SendOrderEmailInput = {
	kind: OrderEmailKind;
	to: string;
	name: string;
	planName: string;
	total: string;
	uniqueCode: number;
	deadline: string;
	url: string;
	/** Sisa waktu saat dikirim, misal "sekitar 5 menit". Dipakai pengingat. */
	remaining?: string | undefined;
};

/**
 * Subjek membawa nominal dan batas waktu, karena itu yang dicari orang di kotak masuk.
 * Subjek lama ("Pesanan PortoFit menunggu kamu") tidak memberi tahu apa yang harus dilakukan.
 */
const subjectFor = ({ kind, total, deadline, remaining }: SendOrderEmailInput): string => {
	if (kind === "dibuat") return `Bayar ${total} sebelum ${deadline}`;
	if (kind === "pengingat") return `Sisa ${remaining ?? "waktu"} untuk bayar ${total}`;
	return `Pesanan ${total} hangus`;
};

/** Dipakai antrean di paket api, yang tidak membawa React sendiri. */
export async function sendOrderEmail(input: SendOrderEmailInput): Promise<void> {
	const { kind, to, ...props } = input;
	await sendEmail({
		to,
		subject: subjectFor(input),
		react: createElement(OrderEmail, { kind, ...props }),
		throwOnError: true,
	});
}
