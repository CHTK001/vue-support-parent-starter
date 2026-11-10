import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
import "./edaParser-Cas6Nm5Q.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-eda@3.1.2/node_modules/@file-viewer/renderer-eda/dist/index.js
var edaDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "eda");
if (!edaDefinition) throw new Error("@file-viewer/renderer-eda could not locate the shared EDA renderer definition.");
var edaRendererDefinition = edaDefinition;
var renderFileViewerEda = (buffer, target, type, context) => import("./eda-DHJucU2Q.js").then(({ default: renderEda }) => renderEda(buffer, target, type, context));
var edaRenderer = {
	id: "file-viewer-renderer-eda",
	label: "Flyfish File Viewer EDA renderer",
	definitions: [edaRendererDefinition],
	handlers: [{
		rendererId: edaRendererDefinition.id,
		handler: renderFileViewerEda
	}]
};
//#endregion
export { edaRendererDefinition as n, renderFileViewerEda as r, edaRenderer as t };
