import { timingSafeEqual } from "node:crypto";
import { processOrderEmails } from "@reactive-resume/api/features/billing/order-mailer";
import { processInvoiceEmails } from "@reactive-resume/api/features/invoice/mailer";
import { env } from "@reactive-resume/env/server";

/** Satu jalur cron untuk dua antrean: kuitansi dan email pesanan. */
export async function handleInvoiceJobs(request: Request): Promise<Response> {
	const headers = { "Cache-Control": "no-store" };
	if (!env.CRON_SECRET) return new Response(null, { status: 404, headers });
	const supplied = Buffer.from(request.headers.get("authorization") ?? "");
	const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
	if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
		return new Response(null, { status: 401, headers });
	const [invoices, orders] = await Promise.all([processInvoiceEmails(), processOrderEmails()]);
	return Response.json({ invoices, orders }, { headers });
}
