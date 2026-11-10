import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { baseManifest, itemHeaderRowPart } from "../../semantic/shared-parts";

export const rapiSemanticManifest = baseManifest("rapi", [itemHeaderRowPart]) satisfies TemplateSemanticManifest;
