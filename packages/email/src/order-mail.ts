import { createElement } from "react";
import { OrderEmail, type OrderEmailKind } from "./templates/order";
import { sendEmail } from "./transport";

const SUBJECT: Record<OrderEmailKind, string> = {
	dibuat: "Selesaikan pembayaran PortoFit dalam 10 menit",
	pengingat: "Sisa 5 menit untuk menyelesaikan pembayaran PortoFit",
	hangus: "Pesanan PortoFit hangus",
};

export type SendOrderEmailInput = {
	kind: OrderEmailKind;
	to: string;
	name: string;
	planName: string;
	total: string;
	uniqueCode: number;
	deadline: string;
	url: string;
};

/** Dipakai antrean di paket api, yang tidak membawa React sendiri. */
export async function sendOrderEmail(input: SendOrderEmailInput): Promise<void> {
	const { kind, to, ...props } = input;
	await sendEmail({
		to,
		subject: SUBJECT[kind],
		react: createElement(OrderEmail, { kind, ...props }),
		throwOnError: true,
	});
}
