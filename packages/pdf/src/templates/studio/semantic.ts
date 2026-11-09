import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { baseManifest, itemHeaderRowPart } from "../../semantic/shared-parts";

export const studioSemanticManifest = baseManifest("studio", [itemHeaderRowPart]) satisfies TemplateSemanticManifest;
