import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/refund")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Refund Policy — PortoFit" },
			{
				name: "description",
				content: "When PortoFit credits can be refunded, when they cannot, and how to request a refund on WhatsApp.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<LegalPage
			title="Refund Policy"
			summary="Unused credits can be refunded within 7 days after the payment is verified. Spent credits are not refundable unless the action failed because of a system error."
		>
			<LegalSection title="1. Unused credits">
				<p>
					If the payment is verified and you have not spent the credits, request a refund within 7 calendar days from
					verification. Credits already used to copy a CV, prepare a briefing, or run another paid action are not
					refundable.
				</p>
			</LegalSection>

			<LegalSection title="2. System errors">
				<LegalList
					items={[
						"Credits were spent but the action failed: report the order number and the time it happened. After we check it, the credits return to your balance.",
						"A payment was clearly made twice for the same order: the extra amount is refunded or turned into credits, whichever you choose.",
						"You transferred more than the order total: the difference is refunded after the order is verified.",
					]}
				/>
			</LegalSection>

			<LegalSection title="3. What is not covered">
				<LegalList
					items={[
						"Spent credits, even when the AI output did not meet expectations. AI output is a draft and must be checked before use.",
						"Applications rejected by a company, invitations that never arrive, or not getting a job.",
						"Price changes after a purchase.",
						"Payments that are not verified or proofs that do not match.",
					]}
				/>
			</LegalSection>

			<LegalSection title="4. How to request">
				<p>
					Send a WhatsApp message to{" "}
					<a
						href="https://wa.me/6281939948769"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						0819-3994-8769
					</a>{" "}
					with your account email, order number or unique code, payment date, and a short reason. Include the transfer
					proof if asked.
				</p>
			</LegalSection>

			<LegalSection title="5. Processing time">
				<p>
					We reply within 3 business days and complete approved refunds within 7 business days. The money is sent to the
					bank account or digital wallet you name. Bank transfer fees are on us unless the account details were wrong.
				</p>
			</LegalSection>

			<LegalSection title="6. Rejected payments">
				<p>
					If the payment proof does not match, the order is rejected and no credits are added. You can pay again with the
					correct amount or contact WhatsApp for a review.
				</p>
			</LegalSection>

			<LegalSection title="7. Policy changes">
				<p>
					This policy may be updated. Requests made before the change date follow the policy in force when the payment was
					verified.
				</p>
			</LegalSection>
		</LegalPage>
	);
}
