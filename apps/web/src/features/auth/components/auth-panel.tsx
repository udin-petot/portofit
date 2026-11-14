import type { ReactNode } from "react";

type Props = {
	title: ReactNode;
	description?: ReactNode;
	footer?: ReactNode;
	children: ReactNode;
};

/**
 * The one frame every auth page sits in: heading, optional description, the page's body,
 * and an optional footer bar that holds the link to the sibling page.
 */
export function AuthPanel({ title, description, footer, children }: Props) {
	return (
		<section data-auth-panel className="overflow-hidden rounded-xl border border-line bg-surface">
			<div className="p-6">
				<h1 className="font-display text-[26px] leading-8 font-medium text-ink md:text-[30px] md:leading-9">{title}</h1>

				{description ? <p className="mt-1.5 text-sm text-ink-2">{description}</p> : null}

				<div className="mt-5">{children}</div>
			</div>

			{footer ? (
				<div data-auth-panel-footer className="border-t border-line px-6 py-3.5 text-center text-[13px] text-ink-3">
					{footer}
				</div>
			) : null}
		</section>
	);
}
