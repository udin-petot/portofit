/**
 * "Fix these in the editor" survives signing up: the checked file waits in this browser's IndexedDB until the
 * visitor comes back signed in, then it's imported and removed. It never leaves the browser before that.
 *
 * The record carries a one-time token that also travels in the return URL, so a plain `/ats-checker?import=1`
 * link cannot pull a file another visitor parked, and records older than the TTL are dropped instead of imported.
 */
const DB = "reactive-resume";
const STORE = "pending-import";
const KEY = "ats-checker";
const TTL_MS = 30 * 60 * 1000;

type PendingImport = { file: File; token: string; savedAt: number };

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await open();
	try {
		return await new Promise<T>((resolve, reject) => {
			const request = work(db.transaction(STORE, mode).objectStore(STORE));
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
}

function isPendingImport(value: unknown): value is PendingImport {
	if (!value || typeof value !== "object") return false;
	const record = value as Partial<PendingImport>;
	return record.file instanceof File && typeof record.token === "string" && typeof record.savedAt === "number";
}

/** Park the file and return the token that must come back with the visitor to read it. */
export async function savePendingImport(file: File): Promise<string> {
	const token = crypto.randomUUID();
	await run("readwrite", (store) => store.put({ file, token, savedAt: Date.now() } satisfies PendingImport, KEY));
	return token;
}

/** The waiting file, only for the token that parked it. Removed as it's read so it's imported once. */
export async function takePendingImport(token: string): Promise<File | null> {
	const value = await run<unknown>("readonly", (store) => store.get(KEY));
	if (!isPendingImport(value) || value.token !== token || Date.now() - value.savedAt > TTL_MS) {
		await clearPendingImport();
		return null;
	}
	await run("readwrite", (store) => store.delete(KEY));
	return value.file;
}

/** Drop anything parked. Called when the session that could import it goes away. */
export async function clearPendingImport(): Promise<void> {
	await run("readwrite", (store) => store.delete(KEY)).catch(() => undefined);
}
