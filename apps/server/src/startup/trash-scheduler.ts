import { documentsService } from "@reactive-resume/api/features/documents/service";

/** Six hours keeps the 30-day promise within a day without scanning on every career tick. */
const TICK_MS = 6 * 60 * 60 * 1000;
const FIRST_TICK_DELAY_MS = 60_000;

/**
 * Trash retention runs per account, but nobody has to open the app for it. The long-running Node server
 * sweeps expired documents itself; `deleteForGood` is idempotent, so two instances racing on one row is safe.
 */
export function startTrashScheduler() {
	let stopped = false;
	let inFlight: Promise<void> | null = null;

	const tick = () => {
		if (stopped || inFlight) return;
		inFlight = Promise.resolve()
			.then(() => documentsService.purgeExpiredAll())
			.then((purged) => {
				if (purged > 0) console.info(`[trash] Purged ${purged} expired document(s).`);
			})
			.catch(() => {
				console.error("[trash] Scheduled purge failed. Remaining documents retry on a later tick.");
			})
			.finally(() => {
				inFlight = null;
			});
	};

	const interval = setInterval(tick, TICK_MS);
	interval.unref();
	const firstTick = setTimeout(tick, FIRST_TICK_DELAY_MS);
	firstTick.unref();

	return {
		stop: async () => {
			stopped = true;
			clearInterval(interval);
			clearTimeout(firstTick);
			await inFlight;
		},
	};
}
