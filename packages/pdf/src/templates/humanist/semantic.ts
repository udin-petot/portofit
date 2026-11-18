import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart, oneColumnManifest } from "../../semantic/shared-parts";

export const humanistSemanticManifest = oneColumnManifest("humanist", [itemHeaderRowPart]) satisfies TemplateSemanticManifest;
