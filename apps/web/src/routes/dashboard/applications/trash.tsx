import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Skeleton } from "@reactive-resume/ui/components/skeleton";
import { toast } from "@reactive-resume/ui/components/toast";
import { useConfirm } from "@/hooks/use-confirm";
import { orpc } from "@/libs/orpc/client";
import { applicationsListQueryKey, trashedApplicationsQueryKey, trashedApplicationsQueryOptions } from "@/features/applications/queries";

export const Route = createFileRoute("/dashboard/applications/trash")({
	component: TrashPage,
});

function TrashPage() {
	const { i18n } = useLingui();
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const { data, isPending, isError, isFetching, refetch } = useQuery(trashedApplicationsQueryOptions());

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: trashedApplicationsQueryKey() });
		void queryClient.invalidateQueries({ queryKey: applicationsListQueryKey() });
		void queryClient.invalidateQueries({ queryKey: orpc.applications.stats.queryKey() });
		void queryClient.invalidateQueries({ queryKey: orpc.applications.tags.queryKey() });
	};

	const restore = useMutation({
		...orpc.applications.restore.mutationOptions(),
		onSuccess: () => {
			invalidate();
			toast.add({ description: t`Application restored` });
		},
		onError: () => toast.add({ type: "error", description: t`Couldn't restore the application. Try again.` }),
	});

	const purge = useMutation({
		...orpc.applications.delete.mutationOptions(),
		onSuccess: () => {
			invalidate();
			toast.add({ description: t`Application deleted permanently` });
		},
		onError: () => toast.add({ type: "error", description: t`Couldn't delete the application. Try again.` }),
	});

	const formatDate = (value: Date | string) =>
		new Date(value).toLocaleDateString(i18n.locale, { day: "numeric", month: "short", year: "numeric" });

	return (
		<div className="mx-auto grid w-full max-w-[900px] content-start gap-5 px-8 py-8 max-sm:px-4 max-sm:py-5 max-sm:pb-28">
			<header className="flex min-w-0 items-center justify-between gap-3">
				<div className="min-w-0">
					<h1 className="truncate font-display text-[26px] leading-8 font-medium sm:text-[30px] sm:leading-9">
						<Trans>Trash</Trans>
					</h1>
					<p className="mt-1 text-sm text-ink-2">
						<Trans>Applications here are deleted automatically after 30 days.</Trans>
					</p>
				</div>
				<Button variant="secondary" nativeButton={false} render={<Link to="/dashboard/applications" />}>
					<Icon name="arrow-left" />
					<Trans>Back</Trans>
				</Button>
			</header>

			{isError ? (
				<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
					<p className="text-sm text-danger-text">
						<Trans>Couldn't load the trash. Try again.</Trans>
					</p>
					<Button variant="secondary" disabled={isFetching} onClick={() => void refetch()}>
						<Trans>Retry</Trans>
					</Button>
				</div>
			) : isPending ? (
				<div className="grid gap-2">
					<Skeleton className="h-16 rounded-xl" />
					<Skeleton className="h-16 rounded-xl" />
					<Skeleton className="h-16 rounded-xl" />
				</div>
			) : data.length === 0 ? (
				<p className="py-16 text-center text-sm text-ink-2">
					<Trans>The trash is empty.</Trans>
				</p>
			) : (
				<ul className="grid gap-2">
					{data.map((application) => (
						<li
							key={application.id}
							className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4"
						>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">
									{application.role} · {application.company}
								</p>
								<p className="text-xs text-ink-3">
									{application.trashedAt ? t`Deleted ${formatDate(application.trashedAt)}` : null}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-1.5">
								<Button size="sm" variant="secondary" loading={restore.isPending} onClick={() => restore.mutate({ id: application.id })}>
									<Trans>Restore</Trans>
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="text-danger-text"
									onClick={async () => {
										const confirmed = await confirm(t`Delete this application permanently?`, {
											description: t`“${application.role} · ${application.company}” and its timeline are removed for good. This can't be undone.`,
											confirmText: t`Delete permanently`,
										});
										if (confirmed) purge.mutate({ id: application.id });
									}}
								>
									<Trans>Delete permanently</Trans>
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
