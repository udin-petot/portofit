import type { Entry, WriteSection } from "./model";
import { useEditorStore } from "../store";
import { createEntry, getEntries } from "./model";
import { useResumeStore } from "@/features/resume/builder/draft";

/** Opens an entry: expands its section, selects it (outlining it on the page) and focuses a new draft. */
export function openEntry(sectionId: string, entryId: string, options: { focus?: boolean } = {}) {
	const editor = useEditorStore.getState();
	editor.setSectionOpen(sectionId, true);
	editor.select({ kind: "item", sectionId, itemId: entryId });
	if (options.focus) editor.setFocusEntry(entryId);
}

/** "+ Add {type}": a draft entry at the end of the section, open and focused. */
/** Adds several entries at once (GitHub import), then opens the first so the user can review it. */
export function addEntriesTo(section: WriteSection, entries: Entry[]) {
	if (entries.length === 0) return;
	useResumeStore.getState().updateResumeData(
		(draft) => {
			getEntries(draft, section).push(...entries);
		},
		{ newStep: true },
	);
	const [first] = entries;
	if (first) openEntry(section.id, first.id);
}

export function addEntryTo(section: WriteSection) {
	const entry = createEntry(section.type);
	useResumeStore.getState().updateResumeData(
		(draft) => {
			getEntries(draft, section).push(entry);
		},
		{ newStep: true },
	);
	openEntry(section.id, entry.id, { focus: true });
}
