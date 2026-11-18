import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart, oneColumnManifest } from "../../semantic/shared-parts";

export const academicSemanticManifest = oneColumnManifest("academic", [itemHeaderRowPart]) satisfies TemplateSemanticManifest;
