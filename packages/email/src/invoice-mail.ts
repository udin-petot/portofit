import { createElement } from "react";
import { InvoiceEmail } from "./templates/invoice";
import { sendEmail } from "./transport";

export type SendInvoiceEmailInput = {
	to: string;
	name: string;
	number: string;
	total: string;
	url: string;
	/** Rincian satu baris dan tanggal bayar, supaya email tidak hanya berisi angka total. */
	detail?: string | undefined;
	method?: string | undefined;
	paidAt?: string | undefined;
	pdf: Buffer;
};

/** Dipakai antrean di paket api, yang tidak membawa React sendiri. */
export async function sendInvoiceEmail({ to, name, number, total, url, detail, method, paidAt, pdf }: SendInvoiceEmailInput): Promise<void> {
	await sendEmail({
		to,
		subject: `Invoice ${number} dari PortoFit`,
		react: createElement(InvoiceEmail, { name, number, total, url, detail, method, paidAt }),
		attachments: [{ filename: `invoice-${number.replaceAll("/", "-")}.pdf`, content: pdf }],
		throwOnError: true,
	});
}
