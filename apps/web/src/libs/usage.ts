import { client } from "@/libs/orpc/client";

type TrackInput = Parameters<typeof client.usage.track>[0];

/**
 * Menghitung satu pemakaian fitur. Tidak mengirim siapa penggunanya, tidak mengirim isi dokumen.
 * Sengaja tidak menunggu hasil dan tidak pernah melempar galat: pencatatan statistik tidak boleh
 * menggagalkan aksi yang sedang dikerjakan orang.
 */
export function trackUsage(feature: TrackInput["feature"]) {
	void client.usage.track({ feature, source: "web" }).catch(() => undefined);
}
