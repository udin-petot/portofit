import { timingSafeEqual } from "node:crypto";
import { sweepOrders } from "@reactive-resume/api/features/billing/sweep";
import { env } from "@reactive-resume/env/server";

/** Penyapu pesanan kedaluwarsa. Tanpa secret yang cocok, rute ini tidak terlihat. */
export async function handleOrderExpiry(request: Request): Promise<Response> {
	const headers = { "Cache-Control": "no-store" };
	if (!env.CRON_SECRET) return new Response(null, { status: 404, headers });
	const supplied = Buffer.from(request.headers.get("authorization") ?? "");
	const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
	if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
		return new Response(null, { status: 401, headers });
	return Response.json(await sweepOrders(), { headers });
}
