import { t } from "@lingui/core/macro";
import { GithubLogoIcon, StarIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@reactive-resume/ui/components/button";
import { CountUp } from "../animation/count-up";
import { orpc } from "@/libs/orpc/client";

// PortoFit's own repository. Upstream's address was left here when the marketing pages were built, so the button
// sent visitors to a different project than the count it printed.
const repositoryUrl = "https://github.com/udin-petot/portofit";

export function GithubStarsButton() {
	const { data: starCount } = useQuery(orpc.statistics.github.getStarCount.queryOptions());
	// A zero next to the star reads as proof that nobody uses the thing, so the number waits for one worth showing.
	const showCount = starCount != null && starCount > 0;

	const ariaLabel =
		showCount && starCount != null
			? t`Star us on GitHub, currently ${starCount.toLocaleString()} stars (opens in new tab)`
			: t`Star us on GitHub (opens in new tab)`;

	return (
		<Button
			variant="secondary"
			nativeButton={false}
			render={
				<a target="_blank" href={repositoryUrl} aria-label={ariaLabel} rel="noopener noreferrer">
					<GithubLogoIcon aria-hidden="true" />
					{showCount && starCount != null ? <CountUp to={starCount} className="font-bold" aria-hidden="true" /> : null}
					<StarIcon aria-hidden="true" />
				</a>
			}
		/>
	);
}
