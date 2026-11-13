import { createElement } from "react";
import { ORDER_SUBJECT, OrderEmail, type OrderEmailKind } from "./templates/order";
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

/** Dipakai antrean di paket api, yang tidak membawa React sendiri. */
export async function sendOrderEmail(input: SendOrderEmailInput): Promise<void> {
	const { kind, to, ...props } = input;
	await sendEmail({
		to,
		subject: ORDER_SUBJECT[kind],
		react: createElement(OrderEmail, { kind, ...props }),
		throwOnError: true,
	});
}
