import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-typst@3.1.2/node_modules/@file-viewer/renderer-typst/dist/index.js
var typstDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "typst");
if (!typstDefinition) throw new Error("@file-viewer/renderer-typst could not locate the core Typst renderer definition.");
var typstRendererDefinition = typstDefinition;
var renderFileViewerTypst = (buffer, target, type, context) => import("./typst-BHzz7AmM.js").then(({ default: renderTypst }) => renderTypst(buffer, target, type, context));
var typstRenderer = {
	id: "file-viewer-renderer-typst",
	label: "Flyfish File Viewer Typst renderer",
	definitions: [typstRendererDefinition],
	handlers: [{
		rendererId: typstRendererDefinition.id,
		handler: renderFileViewerTypst
	}]
};
//#endregion
export { typstRenderer as n, typstRendererDefinition as r, renderFileViewerTypst as t };
