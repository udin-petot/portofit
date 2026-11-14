import { Trans } from "@lingui/react/macro";
import { useRouteContext } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { DataSection } from "./data";
import { ProfileSection } from "./profile";
import { SecuritySection } from "./security";
import { useSignOut } from "@/hooks/use-sign-out";

export function AccountSettings() {
	const { session } = useRouteContext({ from: "/dashboard" });
	return (
		<>
			<ProfileSection session={session} />
			<SecuritySection />
			<DataSection />
			<div className="border-t border-line pt-6">
				<SignOutButton />
			</div>
		</>
	);
}

export function SignOutButton() {
	const signOut = useSignOut();

	return (
		<Button variant="secondary" onClick={() => void signOut()}>
			<Icon name="sign-out" size={18} />
			<Trans>Log out</Trans>
		</Button>
	);
}
