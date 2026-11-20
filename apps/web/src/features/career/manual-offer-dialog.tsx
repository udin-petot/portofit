import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Input } from "@reactive-resume/ui/components/input";
import { NativeSelect } from "@reactive-resume/ui/components/native-select";
import { toast } from "@reactive-resume/ui/components/toast";
import { applicationsListQueryOptions } from "@/features/applications/queries";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

type ManualOfferDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved?: (id: string) => void;
};

const currency = (value: string) => value.trim().toUpperCase().slice(0, 3);
const amount = (value: string) => (value.trim() === "" ? null : Number(value));

/** An offer typed in by the user, for people who already have the numbers and don't need the coach to read a message. */
export function ManualOfferDialog({ open, onOpenChange, onSaved }: ManualOfferDialogProps) {
	const queryClient = useQueryClient();
	const { data: applications } = useQuery(applicationsListQueryOptions());
	const [applicationId, setApplicationId] = useState("");
	const [version, setVersion] = useState<"written" | "verbal">("written");
	const [currencyCode, setCurrencyCode] = useState("IDR");
	const [period, setPeriod] = useState<"month" | "year" | "hour">("month");
	const [base, setBase] = useState("");
	const [variable, setVariable] = useState("");
	const [variableConditions, setVariableConditions] = useState("");
	const [equity, setEquity] = useState("");
	const [location, setLocation] = useState("");
	const [officeDays, setOfficeDays] = useState("");
	const [leave, setLeave] = useState("");
	const [learning, setLearning] = useState("");
	const [other, setOther] = useState("");
	const [respondBy, setRespondBy] = useState("");

	const save = useMutation({
		...orpc.career.saveOffer.mutationOptions(),
		onSuccess: (item) => {
			void queryClient.invalidateQueries({
				queryKey: orpc.career.savedItems.queryKey({ input: { kind: "offer" } }),
			});
			toast.add({ description: t`Offer saved` });
			onSaved?.(item.id);
			onOpenChange(false);
			setBase("");
			setVariable("");
			setVariableConditions("");
			setEquity("");
			setLocation("");
			setOfficeDays("");
			setLeave("");
			setLearning("");
			setOther("");
			setRespondBy("");
		},
		onError: (error) =>
			toast.add({
				type: "error",
				description: getOrpcErrorMessage(error, { fallback: t`Couldn't save the offer. Try again.` }),
			}),
	});

	const submit = () => {
		if (!applicationId) {
			toast.add({ type: "error", description: t`Choose an application first.` });
			return;
		}
		const code = currency(currencyCode);
		if (!/^[A-Z]{3}$/.test(code)) {
			toast.add({ type: "error", description: t`Use a three-letter currency code, like IDR or USD.` });
			return;
		}
		const baseAmount = amount(base);
		const variableAmount = amount(variable);
		const learningAmount = amount(learning);
		const officeAmount = amount(officeDays);
		if (
			[baseAmount, variableAmount, learningAmount, officeAmount].some(
				(value) => value !== null && (!Number.isFinite(value) || value < 0),
			)
		) {
			toast.add({ type: "error", description: t`Amounts must be zero or more.` });
			return;
		}
		if (officeAmount !== null && officeAmount > 5) {
			toast.add({ type: "error", description: t`Office days can be at most five.` });
			return;
		}

		save.mutate({
			applicationId,
			version,
			currency: code,
			period,
			base: baseAmount,
			variable: variableAmount,
			variableConditions,
			equity,
			location,
			officeDays: officeAmount,
			leave,
			learning: learningAmount,
			other,
			respondBy: respondBy ? new Date(`${respondBy}T09:00:00`).toISOString() : null,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[88svh] max-w-[640px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="font-display text-xl">
						<Trans>Add an offer</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>Type the terms you have. Leave anything you don't know blank, never zero.</Trans>
					</DialogDescription>
				</DialogHeader>

				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						submit();
					}}
				>
					<Field label={t`Application`}>
						<NativeSelect
							value={applicationId}
							onChange={(event) => setApplicationId(event.target.value)}
							required
						>
							<option value="">{t`Choose an application`}</option>
							{(applications ?? []).map((application) => (
								<option key={application.id} value={application.id}>
									{application.role} · {application.company}
								</option>
							))}
						</NativeSelect>
					</Field>

					<div className="grid gap-3 sm:grid-cols-3">
						<Field label={t`Offer type`}>
							<NativeSelect
								value={version}
								onChange={(event) => setVersion(event.target.value as "written" | "verbal")}
							>
								<option value="written">{t`Written offer`}</option>
								<option value="verbal">{t`Verbal offer`}</option>
							</NativeSelect>
						</Field>
						<Field label={t`Currency`}>
							<Input
								value={currencyCode}
								maxLength={3}
								onChange={(event) => setCurrencyCode(currency(event.target.value))}
								required
							/>
						</Field>
						<Field label={t`Pay period`}>
							<NativeSelect value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}>
								<option value="month">{t`Per month`}</option>
								<option value="year">{t`Per year`}</option>
								<option value="hour">{t`Per hour`}</option>
							</NativeSelect>
						</Field>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<Field label={t`Base pay`} hint={t`Blank when unknown`}>
							<Input type="number" min={0} step="any" value={base} onChange={(event) => setBase(event.target.value)} />
						</Field>
						<Field label={t`Bonus`} hint={t`Blank when unknown`}>
							<Input
								type="number"
								min={0}
								step="any"
								value={variable}
								onChange={(event) => setVariable(event.target.value)}
							/>
						</Field>
					</div>

					<Field label={t`What the bonus depends on`} hint={t`Optional`}>
						<Input
							value={variableConditions}
							onChange={(event) => setVariableConditions(event.target.value)}
							placeholder={t`For example: 10% of salary when the team hits its target`}
						/>
					</Field>

					<div className="grid gap-3 sm:grid-cols-2">
						<Field label={t`Equity`} hint={t`Optional`}>
							<Input value={equity} onChange={(event) => setEquity(event.target.value)} />
						</Field>
						<Field label={t`Learning budget`} hint={t`Per year, blank when unknown`}>
							<Input
								type="number"
								min={0}
								step="any"
								value={learning}
								onChange={(event) => setLearning(event.target.value)}
							/>
						</Field>
					</div>

					<Field label={t`Where you work`} hint={t`Optional`}>
						<Input value={location} onChange={(event) => setLocation(event.target.value)} />
					</Field>

					<div className="grid gap-3 sm:grid-cols-2">
						<Field label={t`Office days a week`} hint={t`0 for fully remote`}>
							<Input
								type="number"
								min={0}
								max={5}
								step={1}
								value={officeDays}
								onChange={(event) => setOfficeDays(event.target.value)}
							/>
						</Field>
						<Field label={t`Leave`} hint={t`Optional`}>
							<Input value={leave} onChange={(event) => setLeave(event.target.value)} />
						</Field>
					</div>

					<Field label={t`Other benefits`} hint={t`Optional`}>
						<Input value={other} onChange={(event) => setOther(event.target.value)} />
					</Field>

					<Field label={t`Respond by`} hint={t`Optional`}>
						<Input type="date" value={respondBy} onChange={(event) => setRespondBy(event.target.value)} />
					</Field>

					<DialogFooter>
						<Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
							<Trans>Cancel</Trans>
						</Button>
						<Button type="submit" loading={save.isPending} disabled={!applicationId}>
							<Trans>Save offer</Trans>
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
	return (
		<label className="grid gap-1.5">
			<span className="text-sm font-medium">{label}</span>
			{children}
			{hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
		</label>
	);
}
