import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/privasi")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Privacy Policy — PortoFit" },
			{
				name: "description",
				content:
					"What data PortoFit collects, why, who processes it, how long it is kept, and how to request access or deletion.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Privacy Policy"
			summary="We collect only the data needed to run PortoFit: building a CV, checking readability, tracking applications, and processing payments. We do not sell your data."
		>
			<LegalSection title="1. Data we collect">
				<LegalList
					items={[
						"Account data: name, username, email address, and a password stored as a hash.",
						"Document content: CVs, cover letters, application history, notes, practice answers, and files you upload.",
						"Payment data: package, amount, unique code, order status, and the transfer proof you upload. We do not store card numbers or PINs.",
						"Technical data: IP address, access time, and error logs only as needed for security and service fixes.",
					]}
				/>
			</LegalSection>

			<LegalSection title="2. Why we use data">
				<LegalList
					items={[
						"To provide the features you ask for, including saving and reopening documents.",
						"To run CV checks, job matching, and interview practice.",
						"To verify payments and record credit usage.",
						"To protect the service from abuse and answer support questions.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. AI processing">
				<p>
					AI features send the relevant part, such as a CV, a job description, or a practice answer, to a language model
					provider through the gateway we use. The result is a draft you must check. Do not put sensitive data such as
					identity numbers, bank account numbers, or health data into a CV, application, or practice answer.
				</p>
				<p>Model providers may process data outside Indonesia under their own policies.</p>
			</LegalSection>

			<LegalSection title="4. Who can see it">
				<LegalList
					items={[
						"You, through your account.",
						"PortoFit admins, only for payment verification, support, and security. Transfer proofs are stored as private files and are not public.",
						"Infrastructure providers: the server provider, the email service for verification and reminders, the AI model gateway, and the messaging service that stores encrypted backup copies.",
						"Other parties only when applicable law requires it.",
					]}
				/>
				<p>We do not sell or rent user data to advertisers.</p>
			</LegalSection>

			<LegalSection title="5. Cookies and local storage">
				<p>
					We use a session cookie to keep you signed in and a language cookie to remember your interface choice. Practice
					answer drafts may be stored in your browser's local storage. We do not set advertising cookies or third-party
					trackers.
				</p>
			</LegalSection>

			<LegalSection title="6. How long we keep it">
				<p>
					Account data and documents are kept while the account is active. When you delete your account from Settings, the
					account and documents are removed from the main system. Rolling backups are kept for at most 14 days before they
					delete themselves. Payment records may be kept longer for bookkeeping and legal obligations.
				</p>
			</LegalSection>

			<LegalSection title="7. Your rights">
				<LegalList
					items={[
						"See and correct data through your account and document pages.",
						"Delete your account and documents through Settings → Account.",
						"Request a copy of your data or explain an objection to certain processing through WhatsApp below.",
					]}
				/>
				<p>We respond within 14 business days after the account owner's identity is verified.</p>
			</LegalSection>

			<LegalSection title="8. Security">
				<p>
					Connections use HTTPS, passwords are hashed, admin access is restricted, and payment proofs are not publicly
					accessible. No system is completely free of risk. Report a suspected breach on WhatsApp so we can follow up.
				</p>
			</LegalSection>

			<LegalSection title="9. Children and changes">
				<p>
					PortoFit is intended for users aged 18 and over. This policy may be updated. Important changes will be announced
					on the site. The version in force always shows its date at the top of the page.
				</p>
			</LegalSection>

			<LegalSection title="10. Contact">
				<p>
					Questions about data and privacy: WhatsApp{" "}
					<a
						href="https://wa.me/6281939948769"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						0819-3994-8769
					</a>
					. Include your account email so we can find your data.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
