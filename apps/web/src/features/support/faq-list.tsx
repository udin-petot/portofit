import { SUPPORT_FAQ, type SupportFaq, type SupportTopic } from "@reactive-resume/utils/support-faq";

const TOPIC_LABEL: Record<SupportTopic, string> = {
	refund: "Pengembalian dana",
	pembayaran: "Pembayaran",
	kredit: "Kredit",
	akun: "Akun",
};

const TOPIC_ORDER: SupportTopic[] = ["refund", "pembayaran", "kredit", "akun"];

type Props = {
	items?: readonly SupportFaq[];
	priceLine?: string | undefined;
};

/** Daftar FAQ dari sumber yang sama dengan prompt CS, supaya jawaban halaman dan jawaban AI tidak berbeda. */
export function FaqList({ items = SUPPORT_FAQ, priceLine }: Props) {
	return (
		<div className="grid gap-10">
			{priceLine ? <p className="text-[15px] leading-7 text-ink-2">{priceLine}</p> : null}
			{TOPIC_ORDER.map((topic) => {
				const entries = items.filter((item) => item.topic === topic);
				if (entries.length === 0) return null;

				return (
					<section key={topic} className="grid gap-3">
						<h2 className="text-lg font-semibold tracking-tight text-ink">{TOPIC_LABEL[topic]}</h2>
						<div className="grid gap-2">
							{entries.map((item) => (
								<details key={item.id} className="group rounded-lg border border-line px-4 py-3">
									<summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
										{item.question}
									</summary>
									<p className="mt-2 text-[15px] leading-7 text-ink-2">{item.answer}</p>
								</details>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}
