import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-geo@3.1.2_geotiff@2.1.3/node_modules/@file-viewer/renderer-geo/dist/index.js
var geoDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "geo");
if (!geoDefinition) throw new Error("@file-viewer/renderer-geo could not locate the core geospatial renderer definition.");
var geoRendererDefinition = geoDefinition;
var renderFileViewerGeo = (buffer, target, type, context) => import("./geo-w1-NiQpi.js").then(({ default: renderGeo }) => renderGeo(buffer, target, type, context));
var geoRenderer = {
	id: "file-viewer-renderer-geo",
	label: "Flyfish File Viewer geospatial renderer",
	definitions: [geoRendererDefinition],
	handlers: [{
		rendererId: geoRendererDefinition.id,
		handler: renderFileViewerGeo
	}]
};
//#endregion
export { geoRendererDefinition as n, renderFileViewerGeo as r, geoRenderer as t };
