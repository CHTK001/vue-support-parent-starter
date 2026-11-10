import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/index.js
var drawingDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "drawing");
if (!drawingDefinition) throw new Error("@file-viewer/renderer-drawing could not locate the core drawing renderer definition.");
var drawingRendererDefinition = drawingDefinition;
var renderFileViewerDrawing = (buffer, target, type, context) => import("./drawing-BNoNttcI.js").then(({ default: renderDrawing }) => renderDrawing(buffer, target, type, context));
var drawingRenderer = {
	id: "file-viewer-renderer-drawing",
	label: "Flyfish File Viewer drawing renderer",
	definitions: [drawingRendererDefinition],
	handlers: [{
		rendererId: drawingRendererDefinition.id,
		handler: renderFileViewerDrawing
	}]
};
//#endregion
export { drawingRendererDefinition as n, renderFileViewerDrawing as r, drawingRenderer as t };
