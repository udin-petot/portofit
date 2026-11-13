import { useSyncExternalStore } from "react";

const NARROW_QUERY = "(max-width: 639px)";

const subscribe = (onChange: () => void) => {
	const media = window.matchMedia(NARROW_QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(NARROW_QUERY).matches;

/** Ponsel memakai lembar bawah, desktop memakai dialog tengah. Server selalu menganggap lebar. */
export function useNarrowScreen() {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
