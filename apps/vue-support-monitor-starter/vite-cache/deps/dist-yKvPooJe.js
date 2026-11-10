import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/index.js
var archiveDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "archive");
if (!archiveDefinition) throw new Error("@file-viewer/renderer-archive could not locate the shared archive format definition.");
var archiveRendererDefinition = archiveDefinition;
var renderFileViewerArchive = (buffer, target, type, context) => import("./archive-CVAm90Tj.js").then(({ default: renderArchive }) => renderArchive(buffer, target, type, context));
var archiveRenderer = {
	id: "file-viewer-renderer-archive",
	label: "Flyfish File Viewer archive renderer",
	definitions: [archiveRendererDefinition],
	handlers: [{
		rendererId: archiveRendererDefinition.id,
		handler: renderFileViewerArchive
	}]
};
//#endregion
export { archiveRendererDefinition as n, renderFileViewerArchive as r, archiveRenderer as t };
