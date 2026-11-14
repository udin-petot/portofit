import type { AuthProvider } from "@reactive-resume/auth/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/libs/auth/client";
import { Button, buttonVariants } from "@reactive-resume/ui/components/button";
import { Switch } from "@reactive-resume/ui/components/switch";
import { SettingsRow, SettingsSection } from "../section";
import { getProviderName, useAuthAccounts, useAuthProviderActions, useEnabledProviders } from "./auth-hooks";
import { useDialogStore } from "@/dialogs/store";

const SOCIAL: AuthProvider[] = ["google", "github", "custom"];

const monthYear = (date: Date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

export function SecuritySection() {
	const openDialog = useDialogStore((state) => state.openDialog);
	const { hasAccount, getAccountByProviderId } = useAuthAccounts();
	const { enabledProviders } = useEnabledProviders();
	const { link, unlink } = useAuthProviderActions();
	const { data: session } = authClient.useSession();

	const password = getAccountByProviderId("credential");
	const twoFactor = session?.user.twoFactorEnabled ?? false;
	const social = SOCIAL.filter((provider) => provider in enabledProviders);

	return (
		<SettingsSection title={<Trans>Sign-in & security</Trans>}>
			<SettingsRow
				title={<Trans>Password</Trans>}
				description={
					password ? (
						<Trans>Last changed in {monthYear(new Date(password.updatedAt))}</Trans>
					) : (
						<Trans>You sign in without one</Trans>
					)
				}
			>
				{password ? (
					<Button size="sm" variant="secondary" onClick={() => openDialog("auth.change-password", undefined)}>
						<Trans>Change</Trans>
					</Button>
				) : (
					<Link to="/auth/forgot-password" className={buttonVariants({ size: "sm", variant: "secondary" })}>
						<Trans>Set a password</Trans>
					</Link>
				)}
			</SettingsRow>

			{password && (
				<SettingsRow
					title={<Trans>Two-step verification</Trans>}
					description={<Trans>A code from an authenticator app at sign-in</Trans>}
				>
					<Switch
						aria-label={t`Two-step verification`}
						checked={twoFactor}
						// Turning it on walks through the QR code and backup codes; turning it off asks for the password.
						onCheckedChange={() =>
							openDialog(twoFactor ? "auth.two-factor.disable" : "auth.two-factor.enable", undefined)
						}
					/>
				</SettingsRow>
			)}

			{social.map((provider) => {
				const account = getAccountByProviderId(provider);
				const name =
					provider === "custom" ? (enabledProviders.custom ?? getProviderName(provider)) : getProviderName(provider);
				return (
					<SettingsRow
						key={provider}
						title={name}
						description={hasAccount(provider) ? <Trans>Connected</Trans> : <Trans>Not connected</Trans>}
					>
						{account ? (
							<Button size="sm" variant="ghost" onClick={() => void unlink(provider, account.accountId)}>
								<Trans>Disconnect</Trans>
							</Button>
						) : (
							<Button size="sm" variant="secondary" onClick={() => void link(provider)}>
								<Trans>Connect</Trans>
							</Button>
						)}
					</SettingsRow>
				);
			})}
		</SettingsSection>
	);
}
