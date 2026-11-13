import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { toast } from "@reactive-resume/ui/components/toast";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

type PrepareBarProps = {
	application: { id: string; resumeId: string | null; jobDescription: string | null };
};

/**
 * Satu tombol, satu kredit: CV disesuaikan, surat lamaran, dan skor kecocokan.
 * Tampil hanya kalau syaratnya sudah lengkap, supaya tombol yang tidak mungkin jalan tidak pernah muncul.
 */
export function PrepareBar({ application }: PrepareBarProps) {
	const navigate = useNavigate();
	const balances = useQuery(orpc.billing.balances.queryOptions());
	const prepare = useMutation(orpc.applications.ai.prepare.mutationOptions());

	if (!application.resumeId || !application.jobDescription) return null;
	const credits = balances.data?.application;

	const run = async () => {
		try {
			const result = await prepare.mutateAsync({ id: application.id });
			toast.add({
				description: t`Ready: ${result.resumeName}, one cover letter, and a match score of ${result.score}.`,
			});
			void navigate({
				to: "/dashboard/applications/$applicationId/{-$tab}",
				params: { applicationId: application.id, tab: "apply" },
				viewTransition: false,
			});
		} catch (error) {
			const code = error instanceof ORPCError ? (error.data as { code?: string } | undefined)?.code : undefined;
			if (code === "CREDIT_REQUIRED") {
				toast.add({
					type: "error",
					description: t`No application credit left. One credit covers this whole package.`,
					actionProps: {
						children: t`Buy a credit`,
						onClick: () => void navigate({ to: "/dashboard/beli-kredit" }),
					},
				});
				return;
			}
			toast.add({ type: "error", description: getOrpcErrorMessage(error, { fallback: t`Couldn't prepare the documents.` }) });
		}
	};

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sunken px-4 py-2.5 md:px-6">
			<p className="text-xs leading-5 text-ink-2">
				<Trans>One credit: a tailored resume, a cover letter, and a match score for this job.</Trans>
				{typeof credits === "number" ? (
					<>
						{" "}
						<Trans>Application credits left: {credits}.</Trans>
					</>
				) : null}
			</p>
			<Button size="sm" loading={prepare.isPending} onClick={() => void run()}>
				<Icon name="sparkle" size={16} />
				{prepare.isPending ? <Trans>Preparing…</Trans> : <Trans>Prepare this application</Trans>}
			</Button>
		</div>
	);
}
