import { usageService } from "./service";
import type { UsageFeature } from "./taxonomy";

/**
 * Mencatat pemakaian dari dalam server. Tidak pernah menunggu dan tidak pernah melempar galat,
 * karena hitungan statistik tidak boleh menggagalkan pekerjaan yang sedang dilayani.
 */
export function recordUsage(feature: UsageFeature) {
	void usageService.track({ feature, source: "server" }).catch(() => undefined);
}
