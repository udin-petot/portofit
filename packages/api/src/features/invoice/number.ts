import type { db } from "@reactive-resume/db/client";
import { sql } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const NUMBER_PREFIX = "PF";
const SEQUENCE_DIGITS = 6;

/** Nomor kuitansi yang dibaca pelanggan: PF/2026/000123. */
export function formatInvoiceNumber(year: number, sequence: number): string {
	return `${NUMBER_PREFIX}/${year}/${String(sequence).padStart(SEQUENCE_DIGITS, "0")}`;
}

/**
 * Mengambil nomor berikutnya untuk tahun berjalan. Kunci transaksi mencegah dua verifikasi
 * bersamaan mendapat nomor yang sama, dan karena nomor diambil di dalam transaksi verifikasi,
 * pembatalan transaksi ikut membatalkan nomornya sehingga tidak ada nomor loncat.
 */
export async function nextInvoiceNumber(tx: Tx, year: number): Promise<string> {
	await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`invoice:${year}`}))`);

	const result = await tx.execute<{ last_number: number }>(sql`
		insert into invoice_counter (year, last_number)
		values (${year}, 1)
		on conflict (year) do update set last_number = invoice_counter.last_number + 1
		returning last_number
	`);

	const sequence = Number(result.rows[0]?.last_number ?? 0);

	if (!sequence) {
		throw new Error("Counter kuitansi tidak mengembalikan nomor.");
	}

	return formatInvoiceNumber(year, sequence);
}
