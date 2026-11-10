import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/index.js
var definition = DEFAULT_RENDERER_DEFINITIONS.find((item) => item.id === "chm");
if (!definition) throw new Error("@file-viewer/renderer-chm could not locate the shared CHM definition.");
var chmRendererDefinition = definition;
var renderFileViewerChm = (buffer, target, type, context) => import("./chm-Bk2aseUm.js").then(({ default: renderChm }) => renderChm(buffer, target, type, context));
var chmRenderer = {
	id: "file-viewer-renderer-chm",
	label: "Flyfish File Viewer CHM renderer",
	definitions: [chmRendererDefinition],
	handlers: [{
		rendererId: chmRendererDefinition.id,
		handler: renderFileViewerChm
	}]
};
//#endregion
export { chmRendererDefinition as n, renderFileViewerChm as r, chmRenderer as t };
