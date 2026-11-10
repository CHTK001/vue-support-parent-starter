import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-cad@3.1.2_three@0.185.1/node_modules/@file-viewer/renderer-cad/dist/index.js
var cadDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "cad");
if (!cadDefinition) throw new Error("@file-viewer/renderer-cad could not locate the shared CAD format definition.");
var cadRendererDefinition = cadDefinition;
var renderFileViewerCad = (buffer, target, type, context) => import("./cad-C1ggCWRm.js").then(({ default: renderCad }) => renderCad(buffer, target, type, context));
var cadRenderer = {
	id: "file-viewer-renderer-cad",
	label: "Flyfish File Viewer CAD renderer",
	definitions: [cadRendererDefinition],
	handlers: [{
		rendererId: cadRendererDefinition.id,
		handler: renderFileViewerCad
	}]
};
//#endregion
export { cadRendererDefinition as n, renderFileViewerCad as r, cadRenderer as t };
