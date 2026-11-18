import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart, oneColumnManifest } from "../../semantic/shared-parts";

export const technicalSemanticManifest = oneColumnManifest("technical", [itemHeaderRowPart]) satisfies TemplateSemanticManifest;
