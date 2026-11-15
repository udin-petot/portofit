import { t } from "@lingui/core/macro";

/** The managed server connection is a product name, not a model selector; hide its model everywhere. */
export const AI_PORTOFIT = "AI PortoFit";

export const displayProviderName = (provider: { label: string; managed?: boolean }) =>
	provider.managed ? AI_PORTOFIT : provider.label;

export const displayStoredProviderName = (label: string | null | undefined) =>
	label === "Server AI" ? AI_PORTOFIT : (label ?? t`your provider`);
