import { Trans } from "@lingui/react/macro";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
import { Icon } from "@reactive-resume/ui/components/icon";

/** Auth pages other than sign-in need an obvious way back; the logo alone is not enough. */
function AuthBackLink() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	if (pathname === "/auth" || pathname === "/auth/login") return null;

	return (
		<Link
			to="/auth/login"
			className="mb-4 inline-flex items-center gap-1.5 self-start text-sm text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline"
		>
			<Icon name="arrow-left" size={16} />
			<Trans>Back to sign in</Trans>
		</Link>
	);
}

export function AuthLayout() {
	return (
		<div className="flex min-h-svh w-full flex-col px-4 py-5 md:px-10 md:py-7">
			<Link to="/" className="flex items-center gap-2 self-start" aria-label="PortoFit">
				<BrandIcon className="size-6" />
				<span className="text-[15px] font-semibold tracking-tight text-ink">PortoFit</span>
			</Link>

			<div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center pt-10 pb-16">
				<AuthBackLink />
				<Outlet />
			</div>
		</div>
	);
}
