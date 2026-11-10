import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-mindmap@3.1.2/node_modules/@file-viewer/renderer-mindmap/dist/index.js
var mindmapDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "mindmap");
if (!mindmapDefinition) throw new Error("@file-viewer/renderer-mindmap could not locate the core mind map renderer definition.");
var mindmapRendererDefinition = mindmapDefinition;
var renderFileViewerMindMap = (buffer, target, type, context) => import("./xmind-hsPspv6I.js").then(({ default: renderXMind }) => renderXMind(buffer, target, type, context));
var mindmapRenderer = {
	id: "file-viewer-renderer-mindmap",
	label: "Flyfish File Viewer mind map renderer",
	definitions: [mindmapRendererDefinition],
	handlers: [{
		rendererId: mindmapRendererDefinition.id,
		handler: renderFileViewerMindMap
	}]
};
//#endregion
export { mindmapRendererDefinition as n, renderFileViewerMindMap as r, mindmapRenderer as t };
