import type { RouterOutput } from "@/libs/orpc/client";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { GithubLogoIcon, GoogleLogoIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { getOAuthSignInOptions, isOAuthRedirect } from "../redirect";
import { authClient } from "@/libs/auth/client";
import { ENTER_CLASS } from "@/libs/motion";
import { orpc } from "@/libs/orpc/client";
import { sessionQueryKey } from "@/libs/root-context";

export function SocialAuth() {
	const { data: providers = {}, isLoading } = useQuery(orpc.auth.providers.list.queryOptions());

	return (
		<>
			<div className="flex items-center gap-x-2">
				<hr className="flex-1" />
				<span className="text-xs font-medium tracking-wide">
					<Trans context="Choose to authenticate with a social provider (Google, GitHub, etc.) instead of email and password">
						or continue with
					</Trans>
				</span>
				<hr className="flex-1" />
			</div>

			{isLoading ? <SocialAuthSkeleton /> : <SocialAuthButtons providers={providers} />}
		</>
	);
}

function SocialAuthSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3">
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
		</div>
	);
}

type SocialAuthButtonsProps = {
	providers: RouterOutput["auth"]["providers"]["list"];
};

function SocialAuthButtons({ providers }: SocialAuthButtonsProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { callbackURL } = useSearch({ from: "/auth" });

	const runSignIn = async (fn: () => Promise<{ data?: unknown; error: { message?: string | undefined } | null }>) => {
		const toastId = toast.add({ type: "loading", description: t`Signing in...` });
		const { data, error } = await fn();
		if (error) {
			toast.add({
				type: "error",
				description:
					error.message ||
					t({
						comment: "Fallback toast when sign-in fails without an error message",
						message: "Failed to sign in. Please try again.",
					}),
				id: toastId,
			});
			return;
		}
		toast.close(toastId);
		if (isOAuthRedirect(data)) return;
		await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
		await router.invalidate();
	};

	return (
		<div className={cn(ENTER_CLASS, "grid grid-cols-2 gap-3")}>
			<Button
				variant="secondary"
				onClick={() =>
					runSignIn(() =>
						authClient.signIn.social({
							provider: "custom",
							callbackURL: callbackURL ?? "/dashboard",
							...getOAuthSignInOptions(callbackURL),
						}),
					)
				}
				className={cn("hidden", "custom" in providers && "inline-flex")}
			>
				<Icon name="key" size={16} />
				{providers.custom}
			</Button>

			<Button
				onClick={() =>
					runSignIn(() =>
						authClient.signIn.social({
							provider: "google",
							callbackURL: callbackURL ?? "/dashboard",
							...getOAuthSignInOptions(callbackURL),
						}),
					)
				}
				className={cn(
					"hidden flex-1 bg-[#4285F4] text-white hover:bg-[#4285F4]/80",
					"google" in providers && "inline-flex",
				)}
			>
				<GoogleLogoIcon />
				<Trans comment="Brand name label for Google social sign-in button">Google</Trans>
			</Button>

			<Button
				onClick={() =>
					runSignIn(() =>
						authClient.signIn.social({
							provider: "github",
							callbackURL: callbackURL ?? "/dashboard",
							...getOAuthSignInOptions(callbackURL),
						}),
					)
				}
				className={cn(
					"hidden flex-1 bg-[#2b3137] text-white hover:bg-[#2b3137]/80",
					"github" in providers && "inline-flex",
				)}
			>
				<GithubLogoIcon />
				<Trans comment="Brand name label for GitHub social sign-in button">GitHub</Trans>
			</Button>

		</div>
	);
}
