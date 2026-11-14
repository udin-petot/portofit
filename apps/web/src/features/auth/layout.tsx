import { Link, Outlet } from "@tanstack/react-router";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";

export function AuthLayout() {
	return (
		<div className="flex min-h-svh w-full flex-col px-4 py-5 md:px-10 md:py-7">
			<Link to="/" className="flex items-center gap-2 self-start" aria-label="PortoFit">
				<BrandIcon className="size-6" />
				<span className="text-[15px] font-semibold tracking-tight text-ink">PortoFit</span>
			</Link>

			<div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center pt-10 pb-16">
				<Outlet />
			</div>
		</div>
	);
}
