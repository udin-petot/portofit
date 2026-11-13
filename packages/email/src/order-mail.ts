import { createElement } from "react";
import { OrderEmail, type OrderEmailKind } from "./templates/order";
import { sendEmail } from "./transport";

const SUBJECT: Record<OrderEmailKind, string> = {
	dibuat: "Selesaikan pembayaran PortoFit",
	pengingat: "Pesanan PortoFit menunggu kamu",
	hangus: "Pesanan PortoFit kedaluwarsa",
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
