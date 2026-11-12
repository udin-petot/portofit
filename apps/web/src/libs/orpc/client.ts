import type { InferRouterOutputs, RouterClient } from "@orpc/server";
import type router from "@reactive-resume/api/routers";
import { ORPCError, createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { t } from "@lingui/core/macro";
import { toast } from "@reactive-resume/ui/components/toast";
import { rpcFetch } from "./fetch";

const getRpcUrl = () => `${window.location.origin}/api/rpc`;

/** Satu pesan untuk satu gelombang kegagalan, bukan satu per panggilan yang dibatch. */
let quotaNoticeAt = 0;
function notifyQuotaExhausted() {
	const now = Date.now();
	if (now - quotaNoticeAt < 3000) return;
	quotaNoticeAt = now;
	toast.add({
		type: "error",
		description: t`This week's free AI allowance is used up. It comes back every Monday.`,
		actionProps: {
			children: t`See allowance`,
			onClick: () => window.location.assign("/dashboard/jatah"),
		},
	});
}

export const client: RouterClient<typeof router> = createORPCClient(
	new RPCLink({
		url: getRpcUrl,
		fetch: rpcFetch,
		plugins: [
			new BatchLinkPlugin({
				mode: "streaming",
				groups: [{ condition: () => true, context: {} }],
			}),
		],
		interceptors: [
			onError((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				if (error instanceof ORPCError && (error.data as { code?: string } | undefined)?.code === "QUOTA_EXHAUSTED") {
					notifyQuotaExhausted();
					return;
				}
				console.warn("[oRPC client]", error);
			}),
		],
	}),
);

export const streamClient: RouterClient<typeof router> = createORPCClient(
	new RPCLink({
		url: getRpcUrl,
		fetch: rpcFetch,
		interceptors: [
			onError((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				console.warn("[oRPC stream client]", error);
			}),
		],
	}),
);

export const orpc = createTanstackQueryUtils(client);

export type RouterOutput = InferRouterOutputs<typeof router>;
