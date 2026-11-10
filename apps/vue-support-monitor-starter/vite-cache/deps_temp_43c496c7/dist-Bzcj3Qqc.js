import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-3d@3.1.2_esbuild@0.28.1_web-ifc@0.0.78/node_modules/@file-viewer/renderer-3d/dist/index.js
var modelDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "model");
if (!modelDefinition) throw new Error("@file-viewer/renderer-3d could not locate the core 3D model renderer definition.");
var modelRendererDefinition = modelDefinition;
var renderFileViewerModel = (buffer, target, type, context) => import("./model-BTtJXLYk.js").then(({ default: renderModel }) => renderModel(buffer, target, type, context));
var modelRenderer = {
	id: "file-viewer-renderer-3d",
	label: "Flyfish File Viewer 3D model renderer",
	definitions: [modelRendererDefinition],
	handlers: [{
		rendererId: modelRendererDefinition.id,
		handler: renderFileViewerModel
	}]
};
//#endregion
export { modelRendererDefinition as n, renderFileViewerModel as r, modelRenderer as t };
