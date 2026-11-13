import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { SUPPORT_WHATSAPP_URL } from "@reactive-resume/utils/support-faq";
import { cn } from "@reactive-resume/utils/style";
import { LocaleToggle } from "@/features/locale/toggle";
import { SCENE } from "./scroll";
import { labelClass } from "./ui";

const githubUrl = "https://github.com/udin-petot/portofit";
const licenseUrl = "/lisensi";
const linkClass = "text-ink transition-colors hover:text-accent-text max-sm:flex max-sm:min-h-11 max-sm:items-center";

type FooterLink = { label: string; href: string } | { label: string; to: "/ats-checker" | "/dashboard" };

/**
 * Three groups of four to five links. There used to be four groups holding five, one, one and six links, so two
 * columns existed for a single row and the grid stretched them to the height of their neighbour.
 */
const getColumns = (): { id: string; title: string; links: FooterLink[] }[] => [
	{
		id: "product",
		title: t`Product`,
		links: [
			{ label: t`Pricing`, href: "/harga" },
			{ label: t`Templates`, href: "#design" },
			{ label: t`Features`, href: "#write" },
			{ label: t`ATS checker`, to: "/ats-checker" },
			{ label: t`Get started`, to: "/dashboard" },
		],
	},
	{
		id: "community",
		title: t`Community`,
		links: [
			{ label: t`Source code`, href: githubUrl },
			{ label: t`Report an issue`, href: `${githubUrl}/issues` },
			{ label: t`Help`, href: "/bantuan" },
			{ label: "WhatsApp", href: SUPPORT_WHATSAPP_URL },
		],
	},
	{
		id: "legal",
		title: t`Legal`,
		links: [
			{ label: t`Terms of service`, href: "/syarat" },
			{ label: t`Privacy policy`, href: "/privasi" },
			{ label: t`Refund policy`, href: "/refund" },
			{ label: t`MIT License`, href: licenseUrl },
		],
	},
];

function FooterLinkItem({ link }: { link: FooterLink }): ReactNode {
	if ("to" in link) {
		return (
			<Link to={link.to} className={linkClass}>
				{link.label}
			</Link>
		);
	}
	return (
		<a href={link.href} className={linkClass}>
			{link.label}
		</a>
	);
}

/** 13 Footer, ending on the wordmark rising into view, cropped by the page's edge. */
export function LandingFooter() {
	return (
		<footer data-scene={SCENE.footer} className="relative overflow-hidden border-t border-line">
			<div className="mx-auto grid max-w-[1440px] grid-cols-1 px-(--gutter) pt-16 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] lg:gap-x-8">
				<div className="flex min-w-0 flex-col gap-3.5 pb-8 sm:col-span-3 sm:pb-0 lg:col-span-1">
					<img
						loading="lazy"
						src="/logo/light.svg"
						alt="PortoFit"
						width={140}
						height={140}
						className="-ms-[18px] -mt-[22px] -mb-[18px] size-[140px] dark:hidden"
					/>
					<img
						loading="lazy"
						src="/logo/dark.svg"
						alt="PortoFit"
						width={140}
						height={140}
						className="-ms-[18px] -mt-[22px] -mb-[18px] hidden size-[140px] dark:block"
					/>
					<div className="flex flex-col gap-1 font-ui text-[13px] leading-normal text-ink-3">
						<p>{t`By the community, for the community.`}</p>
						<p>
							<Trans>
								Licensed under{" "}
								<a
									href={licenseUrl}
									className="text-accent-text underline underline-offset-[3px] transition-colors hover:text-accent-hover"
								>
									MIT
								</a>
							</Trans>
							<span>{" · v"}{__APP_VERSION__}</span>
						</p>
						<div className="mt-1 flex items-center gap-3">
							<span className={labelClass}>{t`Language`}</span>
							<LocaleToggle />
						</div>
					</div>
				</div>

				{getColumns().map((column) => (
					<nav
						key={column.id}
						aria-labelledby={`footer-${column.id}`}
						className="flex flex-col gap-2.5 border-t border-line pt-6 pb-5 font-ui text-sm sm:border-0 sm:pt-0 sm:pb-0"
					>
						<h2 id={`footer-${column.id}`} className={cn(labelClass, "mb-1 text-ink-3")}>
							{column.title}
						</h2>
						<ul className="flex flex-col gap-2.5 max-sm:gap-0">
							{column.links.map((link) => (
								<li key={link.label}>
									<FooterLinkItem link={link} />
								</li>
							))}
						</ul>
					</nav>
				))}
			</div>

			{/* It fades in by sliding up out of the mask's faded bottom; an opacity fade would fail contrast checks.
			    One line on phones so the wordmark is not cropped from both sides, two lines from sm up. */}
			<div aria-hidden="true" className="@container mx-auto mt-14 max-w-[1440px] px-(--gutter) max-sm:mt-10">
				<div className="h-[19.5cqw] overflow-hidden sm:h-[27cqw] sm:[mask-image:linear-gradient(to_bottom,#000_35%,transparent_100%)]">
					<div className="font-anybody [transform:translateY(calc((1-clamp(0,(var(--p)-.1)/.8,1))*60%))] pt-[.12em] pb-[.06em] text-[19cqw] leading-[.84] font-extrabold tracking-[-.035em] whitespace-nowrap text-ink font-stretch-[78%] select-none [transition:transform_.35s_var(--ease)] sm:text-[17.5cqw]">
						<span className="block max-sm:inline">Porto</span>
						<span className="block text-accent-text max-sm:inline">Fit</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
