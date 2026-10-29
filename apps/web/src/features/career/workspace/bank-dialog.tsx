import type { BankCategory, BankQuestion } from "../practice-bank";
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
import { BANK_CATEGORIES, BANK_COUNT, PRACTICE_BANK } from "../practice-bank";

const ALL = "Semua" as const;
type Filter = BankCategory | typeof ALL;

/**
 * Pick a curated question. The rubric is shown after the question is chosen, so the bank stays scannable; the dialog
 * itself is deterministic and works without an AI connection.
 */
export function BankQuestionDialog({
	open,
	onOpenChange,
	onPick,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPick: (question: BankQuestion) => void;
}) {
	const [filter, setFilter] = useState<Filter>(ALL);
	const list = filter === ALL ? PRACTICE_BANK : PRACTICE_BANK.filter((question) => question.category === filter);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[640px] gap-0 p-0">
				<DialogHeader className="gap-1.5 border-b border-line p-5">
					<DialogTitle className="font-display text-xl">Bank soal wawancara IT</DialogTitle>
					<DialogDescription>
						{BANK_COUNT} pertanyaan yang benar-benar ditanyakan di wawancara teknis dan HR, lengkap dengan apa yang dinilai.
						Pilih satu untuk mulai latihan.
					</DialogDescription>
				</DialogHeader>

				<div className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-3 [scrollbar-width:none]">
					{[ALL, ...BANK_CATEGORIES].map((category) => {
						const active = filter === category;
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
								{category}
							</button>
						);
					})}
				</div>

				<ul className="grid max-h-[52vh] gap-0.5 overflow-y-auto p-2">
					{list.map((question) => (
						<li key={question.id}>
							<button
								type="button"
								onClick={() => onPick(question)}
								className="grid w-full gap-1.5 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-sunken"
							>
								<span className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-3">
									<span className="rounded-full bg-sunken px-2 py-0.5 font-medium text-ink-2">{question.category}</span>
									<span
										className={cn(
											"rounded-full px-2 py-0.5 font-medium",
											question.level === "Lanjut" && "bg-accent-soft text-accent-text",
										)}
									>
										{question.level}
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
					Rubrik dan pertanyaan lanjutan muncul di samping soal setelah kamu memilih.
				</div>
			</DialogContent>
		</Dialog>
	);
}
