import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/syarat")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Terms of Service — PortoFit" },
			{
				name: "description",
				content:
					"Rules for using PortoFit: accounts, content, credits and payments, AI limits, and user responsibilities.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Terms of Service"
			summary="By creating an account or using PortoFit, you agree to these terms. Read the sections on credits, payments, and AI limits before buying."
		>
			<LegalSection title="1. Service">
				<p>
					PortoFit helps you build a CV, check how applicant tracking systems (ATS) read it, track applications, draft
					messages, and practise interviews. PortoFit is not a recruitment agency and does not guarantee an interview
					or a job.
				</p>
			</LegalSection>

			<LegalSection title="2. Account">
				<LegalList
					items={[
						"You must be at least 18 years old and provide accurate information.",
						"You are responsible for keeping your password, devices, and account recovery codes safe.",
						"One person may not share an account to avoid credit abuse.",
						"We may suspend accounts that break these terms or harm other users.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. Prohibited use">
				<LegalList
					items={[
						"Uploading illegal, misleading, or other people's content without permission.",
						"Sending spam, trying to break into the system, or accessing another person's account.",
						"Copying the service at scale, scraping automatically, or deliberately overloading the server.",
						"Using PortoFit to apply with a false identity or invented experience.",
					]}
				/>
			</LegalSection>

			<LegalSection title="4. Your content">
				<p>
					Your CV, letters, notes, and answers remain yours. You give us limited permission to store, display, and process
					that content only so PortoFit features can work. You are responsible for the accuracy of what you write.
				</p>
			</LegalSection>

			<LegalSection title="5. Credits, prices, and payments">
				<LegalList
					items={[
						"Application credits cost Rp5,000 each. Interview credits cost Rp10,000 each. The price shown on the Pricing page applies when you buy.",
						"Payments use QRIS with a three-digit unique code. You must pay the order total, not only the package price.",
						"An admin verifies every payment manually. Credits arrive after the proof matches and is verified.",
						"Actions that spend credits are marked in the interface before they run. Spent credits are not refundable unless the action failed because of a system error.",
						"Credits do not expire while your account is active.",
					]}
				/>
				<p>
					Refund terms are set out in the{" "}
					<a href="/refund" className="font-medium text-accent-text underline-offset-4 hover:underline">
						Refund Policy
					</a>
					.
				</p>
			</LegalSection>

			<LegalSection title="6. AI and automated output">
				<p>
					AI output is a draft, not a fact or a guarantee. A model can be wrong, miss something, or produce advice that
					does not fit. You must check every claim, date, and number before sending a document to a recruiter. PortoFit
					does not provide legal, immigration, or employment advice.
				</p>
			</LegalSection>

			<LegalSection title="7. Availability">
				<p>
					We try to keep the service running, but we may pause it for maintenance, updates, or events outside our
					control. We do not guarantee uninterrupted availability.
				</p>
			</LegalSection>

			<LegalSection title="8. Intellectual property">
				<p>
					PortoFit's brand, design, and site content are protected by applicable law. The source code is available in a
					public repository under the MIT License. That licence does not give you the right to use the PortoFit brand in a
					misleading way.
				</p>
			</LegalSection>

			<LegalSection title="9. Limitation of liability">
				<p>
					To the extent the law allows, PortoFit is not liable for indirect losses, lost job opportunities, or losses
					arising from decisions you make based on AI output. Our liability for direct losses is limited to the amount you
					paid in the last three months.
				</p>
			</LegalSection>

			<LegalSection title="10. Termination and changes">
				<p>
					You can stop at any time by deleting your account. We may close accounts that break these terms. These terms may
					be updated. Important changes are announced on the site and apply from the date shown.
				</p>
			</LegalSection>

			<LegalSection title="11. Governing law and contact">
				<p>
					These terms are governed by the laws of the Republic of Indonesia. Questions or objections: WhatsApp{" "}
					<a
						href="https://wa.me/6281939948769"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						0819-3994-8769
					</a>
					.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
