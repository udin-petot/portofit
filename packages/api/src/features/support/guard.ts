const SAFE_REPLY =
	"Saya belum bisa memastikan hal itu. Admin yang memutuskan pengembalian dana dan verifikasi pesanan, silakan lanjut lewat WhatsApp di bawah ini.";

/** Kalimat yang menjanjikan hasil. Tidak boleh lolos, sekalipun model mengarang. */
const PROMISE_PATTERNS = [
	/\bpasti\s+(refund|dikembalikan|kembali)\b/i,
	/\bdijamin\s+(kembali|refund|dikembalikan)\b/i,
	/\botomatis\s+dikembalikan\b/i,
	/\b(uang|dana)\s+(kamu|anda)\s+pasti\s+kembali\b/i,
];

type GuardAllowed = {
	faqText: string;
	pricesIdr: number[];
	userAmounts: string[];
};

type GuardResult = {
	text: string;
	replaced: boolean;
};

function toAmount(raw: string): number {
	return Number(raw.replace(/\./g, "").replace(/,.*$/, ""));
}

function amountsIn(text: string): number[] {
	const found: number[] = [];

	for (const match of text.matchAll(/\bRp\s?([\d.]+)/gi)) found.push(toAmount(match[1] ?? ""));
	for (const match of text.matchAll(/\b([\d.]+)\s?(rb|ribu)\b/gi)) found.push(toAmount(match[1] ?? "") * 1000);

	return found.filter((value) => Number.isFinite(value));
}

/**
 * Lapis kedua setelah prompt. Menolak balasan yang menjanjikan hasil atau menyebut nominal yang tidak berasal
 * dari FAQ, harga paket, atau pesan pengguna sendiri.
 */
export function enforceSupportGuard(reply: string, allowed: GuardAllowed): GuardResult {
	const promises = PROMISE_PATTERNS.some((pattern) => pattern.test(reply));
	if (promises) return { text: SAFE_REPLY, replaced: true };

	const permitted = new Set<number>([
		...allowed.pricesIdr,
		...amountsIn(allowed.faqText),
		...allowed.userAmounts.flatMap(amountsIn),
	]);

	const invented = amountsIn(reply).some((amount) => !permitted.has(amount));
	if (invented) return { text: SAFE_REPLY, replaced: true };

	return { text: reply, replaced: false };
}
