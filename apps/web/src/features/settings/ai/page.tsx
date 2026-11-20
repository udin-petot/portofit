import { Trans } from "@lingui/react/macro";
import { ProvidersSection } from "./providers";
import { WebAccessSection } from "./web-access";

/** The AI connection: the provider that pays for model calls, and optional web access. */
export function AiDeveloperSettings() {
	return (
		<>
			<header className="grid gap-2">
				<h1 className="font-display text-[30px] leading-9 font-medium">
					<Trans>AI</Trans>
				</h1>
				<p className="max-w-[56ch] text-sm leading-6 text-ink-2">
					<Trans>Connect the tools you use for writing, job search and working with your resumes.</Trans>
				</p>
			</header>
			<ProvidersSection />
			<WebAccessSection />
		</>
	);
}
