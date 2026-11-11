import { createElement } from "react";
import { InvoiceEmail } from "./templates/invoice";
import { sendEmail } from "./transport";

export type SendInvoiceEmailInput = {
	to: string;
	name: string;
	number: string;
	total: string;
	url: string;
	pdf: Buffer;
};

/** Dipakai antrean di paket api, yang tidak membawa React sendiri. */
export async function sendInvoiceEmail({ to, name, number, total, url, pdf }: SendInvoiceEmailInput): Promise<void> {
	await sendEmail({
		to,
		subject: `Kuitansi ${number} dari PortoFit`,
		react: createElement(InvoiceEmail, { name, number, total, url }),
		attachments: [{ filename: `kuitansi-${number.replaceAll("/", "-")}.pdf`, content: pdf }],
		throwOnError: true,
	});
}
