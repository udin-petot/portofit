import { useSyncExternalStore } from "react";

export type CreditKind = "application" | "interview";

type CreditState = { open: boolean; kind: CreditKind };

let state: CreditState = { open: false, kind: "application" };
const listeners = new Set<() => void>();

const emit = () => {
	for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

/** Dipanggil dari penangan galat oRPC saat server membalas CREDIT_REQUIRED. */
export function notifyCreditRequired(kind: CreditKind) {
	state = { open: true, kind };
	emit();
}

export function closeCreditDialog() {
	state = { ...state, open: false };
	emit();
}

/** Dibaca dialog dan juga pengujian, tanpa perlu React. */
export const useCreditGate = () => useSyncExternalStore(subscribe, () => state, () => state);
