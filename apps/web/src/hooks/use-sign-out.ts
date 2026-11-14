import { t } from "@lingui/core/macro";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "@reactive-resume/ui/components/toast";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";

type SignOutOptions = {
	/** Ask before leaving. Off only when the caller already confirmed, such as account deletion. */
	confirm?: boolean;
};

/**
 * Logs out from every surface the same way: optional confirmation, clear cached data, then land on
 * the sign-in page. Without the redirect the dashboard stays mounted with no session and every
 * action silently fails.
 */
export function useSignOut() {
	const confirm = useConfirm();
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();

	return async ({ confirm: shouldConfirm = true }: SignOutOptions = {}) => {
		if (shouldConfirm) {
			const ok = await confirm(t`Log out of this account?`, {
				description: t`You can sign back in at any time.`,
			});
			if (!ok) return false;
		}

		const { error } = await authClient.signOut();
		if (error) {
			toast.add({
				type: "error",
				description: getReadableErrorMessage(error, t`Couldn't log out. Try again.`),
			});
			return false;
		}

		queryClient.clear();
		await router.invalidate();
		await navigate({ to: "/auth/login", replace: true });
		return true;
	};
}
