import type { AuthSession } from "@reactive-resume/auth/types";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useRouter } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { Icon } from "@reactive-resume/ui/components/icon";
import { useTheme } from "@/features/theme/provider";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/libs/auth/client";
import { changeLocale, localeMap } from "@/libs/locale";
import { isTheme } from "@/libs/theme";

type Props = {
	children: ({ session }: { session: AuthSession }) => React.ComponentProps<typeof DropdownMenuTrigger>["render"];
};

export function UserDropdownMenu({ children }: Props) {
	const router = useRouter();
	const { i18n } = useLingui();
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const signOut = useSignOut();

	const handleThemeChange = (value: string) => {
		if (!isTheme(value)) return;
		setTheme(value);
	};

	const handleLogout = async () => {
		await signOut();
	};

	if (!session?.user) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={children({ session: session as AuthSession })} />

			<DropdownMenuContent align="start" side="top">
				<DropdownMenuItem onClick={() => void router.navigate({ to: "/dashboard/settings" })}>
					<Icon name="gear-six" />
					<Trans>Settings</Trans>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<Icon name="translate" size={16} />
							<Trans comment="Menu item that opens language selection submenu">Language</Trans>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="max-h-[400px] overflow-y-auto">
							<DropdownMenuRadioGroup value={i18n.locale} onValueChange={changeLocale}>
								{Object.entries(localeMap).map(([value, label]) => (
									<DropdownMenuRadioItem key={value} value={value}>
										{i18n.t(label)}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>

					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<Icon name="palette" size={16} />
							<Trans comment="Menu item that opens appearance theme selection submenu">Theme</Trans>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
								<DropdownMenuRadioItem value="light">
									<Trans comment="Appearance theme option for light mode">Light</Trans>
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="dark">
									<Trans comment="Appearance theme option for dark mode">Dark</Trans>
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="system">
									<Trans comment="Appearance theme option that follows the operating system">System</Trans>
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={handleLogout}>
					<Icon name="sign-out" size={16} />
					<Trans comment="User menu action to log out of current account">Log out</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
