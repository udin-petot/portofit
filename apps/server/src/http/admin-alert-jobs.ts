import { timingSafeEqual } from "node:crypto";
import { sendAdminAlerts } from "@reactive-resume/api/features/billing/admin-alert";
import { env } from "@reactive-resume/env/server";

/** Pengirim antrean WhatsApp admin. Tanpa secret yang cocok, rute ini tidak terlihat. */
export async function handleAdminAlerts(request: Request): Promise<Response> {
	const headers = { "Cache-Control": "no-store" };
	if (!env.CRON_SECRET) return new Response(null, { status: 404, headers });
	const supplied = Buffer.from(request.headers.get("authorization") ?? "");
	const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
	if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
		return new Response(null, { status: 401, headers });
	return Response.json(await sendAdminAlerts(), { headers });
}
