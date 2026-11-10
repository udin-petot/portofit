import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/lisensi")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "MIT License — PortoFit" },
			{
				name: "description",
				content:
					"The MIT license that covers PortoFit, the upstream Reactive Resume project it is built on, and the attribution both require.",
			},
		],
	}),
});

const licenseText = `MIT License

Copyright (c) 2026 Amruth Pillai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

function RouteComponent() {
	return (
		<LegalPage
			title="MIT License"
			summary="PortoFit is built on Reactive Resume, an open source project by Amruth Pillai. Both the original and this fork are released under the MIT License."
		>
			<LegalSection title="What this license allows">
				<p>
					The MIT License lets anyone use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the
					software. It applies to the source code, not to the PortoFit name or logo.
				</p>
				<p>
					The only condition is that the copyright notice and this permission notice travel with every copy or
					substantial portion of the software. The software is provided without warranty.
				</p>
			</LegalSection>

			<LegalSection title="Attribution">
				<p>
					Original work: Reactive Resume, copyright Amruth Pillai,{" "}
					<a
						href="https://github.com/reactive-resume/reactive-resume"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						github.com/reactive-resume/reactive-resume
					</a>
					.
				</p>
				<p>
					This fork:{" "}
					<a
						href="https://github.com/udin-petot/portofit"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						github.com/udin-petot/portofit
					</a>
					. The full license file lives in the repository root.
				</p>
			</LegalSection>

			<LegalSection title="License text">
				<pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-ink-2">
					{licenseText}
				</pre>
			</LegalSection>
		</LegalPage>
	);
}
