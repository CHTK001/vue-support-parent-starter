import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-data@3.1.2/node_modules/@file-viewer/renderer-data/dist/index.js
var dataDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "data-asset");
if (!dataDefinition) throw new Error("@file-viewer/renderer-data could not locate the shared data asset renderer definition.");
var dataRendererDefinition = dataDefinition;
var renderFileViewerData = (buffer, target, type, context) => import("./data-Dxy6HbVn.js").then(({ default: renderDataAsset }) => renderDataAsset(buffer, target, type, context));
var dataRenderer = {
	id: "file-viewer-renderer-data",
	label: "Flyfish File Viewer data asset renderer",
	definitions: [dataRendererDefinition],
	handlers: [{
		rendererId: dataRendererDefinition.id,
		handler: renderFileViewerData
	}]
};
//#endregion
export { dataRendererDefinition as n, renderFileViewerData as r, dataRenderer as t };
