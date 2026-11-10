import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart, oneColumnManifest } from "../../semantic/shared-parts";

export const bersihSemanticManifest = oneColumnManifest("bersih", [itemHeaderRowPart]) satisfies TemplateSemanticManifest;
