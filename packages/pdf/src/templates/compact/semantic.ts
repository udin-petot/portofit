import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart, oneColumnManifest } from "../../semantic/shared-parts";

export const compactSemanticManifest = oneColumnManifest("compact", [
	itemHeaderRowPart,
]) satisfies TemplateSemanticManifest;
