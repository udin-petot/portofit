type StartViewTransition = Document["startViewTransition"];

/**
 * Chrome rejects a transition's `ready` and `finished` promises whenever it drops the animation: another navigation
 * started first, or the tab went hidden. The DOM update still lands, so the skip is not a failure for the user, but
 * TanStack Router keeps only `updateCallbackDone`, and the two orphaned rejections reach the page unhandled, where the
 * client error reporter picks them up as AbortErrors and mails them to the alarm. Chrome 157 rejects skips that
 * earlier versions dropped silently. Owning both promises here marks them handled; the transition itself is untouched.
 */
export function ignoreSkippedViewTransitions() {
	if (typeof document === "undefined" || typeof document.startViewTransition !== "function") return;

	const startViewTransition = document.startViewTransition.bind(document);

	const guarded = (...args: Parameters<StartViewTransition>) => {
		const transition = startViewTransition(...args);

		transition.ready.catch(() => {});
		transition.finished.catch(() => {});

		return transition;
	};

	document.startViewTransition = guarded;
}
