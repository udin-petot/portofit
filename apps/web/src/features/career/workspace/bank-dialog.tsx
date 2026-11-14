import type { BankCategory, BankQuestion } from "../practice-bank";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { cn } from "@reactive-resume/utils/style";
import { BANK_CATEGORIES, BANK_COUNT, bankCategoryLabel, bankLevelLabel, practiceBankFor } from "../practice-bank";

const ALL = "all" as const;
type Filter = BankCategory | typeof ALL;

/**
 * Pick a curated question. The rubric is shown after the question is chosen, so the bank stays scannable; the dialog
 * itself is deterministic and works without an AI connection.
 */
export function BankQuestionDialog({
	open,
	onOpenChange,
	onPick,
	onCustom,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPick: (question: BankQuestion) => void;
	onCustom?: (text: string) => void;
}) {
	const { i18n } = useLingui();
	const locale = i18n.locale;
	const bank = practiceBankFor(locale);
	const english = locale.toLowerCase().startsWith("en");
	const [filter, setFilter] = useState<Filter>(ALL);
	const [own, setOwn] = useState("");
	const list = filter === ALL ? bank : bank.filter((question) => question.category === filter);
	const submitOwn = () => {
		const text = own.trim();
		if (!text) return;
		onCustom?.(text);
		setOwn("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[640px] gap-0 p-0">
				<DialogHeader className="gap-1.5 border-b border-line p-5">
					<DialogTitle className="font-display text-xl">
						<Trans>IT interview question bank</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>
							{BANK_COUNT} questions asked in real technical and HR interviews, with what is scored on each. Pick one to
							start practising.
						</Trans>
					</DialogDescription>
				</DialogHeader>

				{onCustom ? (
					<div className="grid gap-1.5 border-b border-line px-4 py-3">
						<label htmlFor="own-interview-question" className="text-xs font-medium text-ink-2">
							<Trans>Add your own question</Trans>
						</label>
						<div className="flex items-center gap-2">
							<Input
								id="own-interview-question"
								value={own}
								onChange={(event) => setOwn(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										submitOwn();
									}
								}}
								maxLength={2000}
								placeholder={t`Type a question you want to practise…`}
								className="h-9"
							/>
							<Button size="sm" disabled={!own.trim()} onClick={submitOwn}>
								<Trans>Practise</Trans>
							</Button>
						</div>
					</div>
				) : null}

				<div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
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

				<ul className="grid max-h-[50vh] gap-0.5 overflow-y-auto p-2">
					{list.map((question) => (
						<li key={question.id}>
							<button
								type="button"
								onClick={() => onPick(question)}
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
								</span>
								<span className="text-sm leading-5 font-medium text-ink">{question.text}</span>
								<span className="line-clamp-2 text-xs leading-5 text-ink-3">{question.why}</span>
							</button>
						</li>
					))}
				</ul>

				<div className="flex items-center gap-2 border-t border-line px-5 py-3 text-xs text-ink-3">
					<Icon name="info" size={15} />
					<Trans>Rubrics and follow-up questions appear under a question once you pick one.</Trans>
				</div>
			</DialogContent>
		</Dialog>
	);
}
