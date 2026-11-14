import type { BankCategory } from "./practice-bank";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Icon } from "@reactive-resume/ui/components/icon";
import { cn } from "@reactive-resume/utils/style";
import { BANK_CATEGORIES, BANK_COUNT, bankCategoryLabel, bankLevelLabel, practiceBankFor } from "./practice-bank";

const ALL = "all" as const;
type Filter = BankCategory | typeof ALL;

/**
 * Browse the interview bank without an application: question, why it is asked, rubric and follow-ups. Practice with
 * AI feedback stays inside an application, where the answer can be judged against a real posting.
 */
export function BankBrowseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const { i18n } = useLingui();
	const locale = i18n.locale;
	const english = locale.toLowerCase().startsWith("en");
	const bank = practiceBankFor(locale);
	const [filter, setFilter] = useState<Filter>(ALL);
	const [expanded, setExpanded] = useState<string | null>(null);
	const list = filter === ALL ? bank : bank.filter((question) => question.category === filter);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[680px] gap-0 p-0">
				<DialogHeader className="gap-1.5 border-b border-line p-5">
					<DialogTitle className="font-display text-xl">
						<Trans>IT interview question bank</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>
							{BANK_COUNT} technical and HR interview questions with rubrics. Open one to see what is scored and the
							follow-up questions.
						</Trans>
					</DialogDescription>
				</DialogHeader>

				<div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto border-b border-line px-4 py-3 [&::-webkit-scrollbar]:hidden">
					{[ALL, ...BANK_CATEGORIES].map((category) => {
						const active = filter === category;
						const label = category === ALL ? (english ? "All" : "Semua") : bankCategoryLabel(category, locale);
						return (
							<button
								key={category}
								type="button"
								aria-pressed={active}
								onClick={() => setFilter(category)}
								className={cn(
									"h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors",
									active
										? "border-accent bg-accent text-on-accent"
										: "border-line text-ink-2 hover:bg-sunken hover:text-ink",
								)}
							>
								{label}
							</button>
						);
					})}
				</div>

				<ul className="grid max-h-[55vh] gap-0.5 overflow-y-auto p-2">
					{list.map((question) => {
						const isOpen = expanded === question.id;
						return (
							<li key={question.id} className="rounded-lg">
								<button
									type="button"
									aria-expanded={isOpen}
									onClick={() => setExpanded(isOpen ? null : question.id)}
									className="grid w-full gap-1.5 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-sunken"
								>
									<span className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-3">
										<span className="rounded-full bg-sunken px-2 py-0.5 font-medium text-ink-2">
											{bankCategoryLabel(question.category, locale)}
										</span>
										<span
											className={cn(
												"rounded-full px-2 py-0.5 font-medium",
												question.level === "Lanjut" && "bg-accent-soft text-accent-text",
											)}
										>
											{bankLevelLabel(question.level, locale)}
										</span>
										<span className="ms-auto inline-flex items-center gap-1">
											<Icon name={isOpen ? "minus" : "plus"} size={14} />
											{isOpen ? (english ? "Close" : "Tutup") : english ? "Rubric" : "Rubrik"}
										</span>
									</span>
									<span className="text-sm leading-5 font-medium text-ink">{question.text}</span>
									<span className="line-clamp-2 text-xs leading-5 text-ink-3">{question.why}</span>
								</button>

								{isOpen && (
									<div className="mx-2 mb-1 grid gap-3 rounded-lg border border-line bg-sunken p-3.5">
										<div>
											<p className="font-mono text-[10px] font-medium tracking-[0.06em] text-ink-3 uppercase">
												<Trans>What's scored</Trans>
											</p>
											<ul className="mt-1.5 grid gap-1.5">
												{question.rubric.map((item) => (
													<li key={item} className="flex gap-2 text-[13px] leading-[19px] text-ink-2">
														<span className="mt-[7px] size-1 shrink-0 rounded-full bg-accent" />
														{item}
													</li>
												))}
											</ul>
										</div>
										<div>
											<p className="font-mono text-[10px] font-medium tracking-[0.06em] text-ink-3 uppercase">
												<Trans>Possible follow-ups</Trans>
											</p>
											<p className="mt-1 text-xs leading-5 text-ink-2">{question.followUps.join(" · ")}</p>
										</div>
									</div>
								)}
							</li>
						);
					})}
				</ul>

				<div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 text-xs text-ink-3">
					<Icon name="info" size={15} />
					<span className="min-w-0 flex-1">
						{english
							? "AI feedback needs the posting context. Create an application first, then open the Practise tab."
							: "Umpan balik AI butuh konteks lowongan. Buat lamaran dulu, lalu buka tab Latihan."}
					</span>
					<Link to="/dashboard/applications" className="font-medium text-accent-text hover:underline">
						{english ? "Open applications" : "Buka lamaran"}
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	);
}
