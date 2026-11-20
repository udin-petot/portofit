import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { toast } from "@reactive-resume/ui/components/toast";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";

/** An unverified address still works, so the app never blocks on it; the dashboard asks once. */
export function VerifyEmailBanner() {
	const { session, flags } = useRouteContext({ strict: false });
	const [sending, setSending] = useState(false);

	const user = session?.user;
	if (!user || user.isAnonymous || user.emailVerified) return null;

	const smtpEnabled = flags?.smtpEnabled ?? false;

	const resend = async () => {
		setSending(true);
		const { error } = await authClient.sendVerificationEmail({
			email: user.email,
			callbackURL: "/dashboard",
		});
		setSending(false);

		toast.add(
			error
				? {
						type: "error",
						description: getReadableErrorMessage(error, t`Couldn't send the email. Try again.`),
					}
				: { type: "success", description: t`We sent a new verification link to ${user.email}.` },
		);
	};

	return (
		<div className="px-4 pt-4">
			<Alert variant="info">
				<Icon name="envelope-simple" />
				<AlertTitle>
					<Trans>Verify your email</Trans>
				</AlertTitle>
				<AlertDescription>
					<p>
						<Trans>
							Your account works now. Verifying the address confirms it is yours and keeps password recovery
							working.
						</Trans>
					</p>
					{smtpEnabled ? (
						<Button
							variant="secondary"
							size="sm"
							className="mt-2"
							loading={sending}
							onClick={() => void resend()}
						>
							<Trans>Send verification link</Trans>
						</Button>
					) : (
						<p className="mt-1">
							<Trans>Email delivery isn't set up on this server, so the address can't be verified yet.</Trans>
						</p>
					)}
				</AlertDescription>
			</Alert>
		</div>
	);
}
