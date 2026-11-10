import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/index.js
var epubDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "epub");
var umdDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "umd");
var fb2Definition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "ebook-fb2");
if (!epubDefinition || !umdDefinition || !fb2Definition) throw new Error("@file-viewer/renderer-epub could not locate the shared ebook format definitions.");
var ebookRendererDefinition = epubDefinition;
var umdRendererDefinition = umdDefinition;
var fb2RendererDefinition = fb2Definition;
var renderFileViewerEpub = (buffer, target, _type, context) => import("./epub-Bc7YWAaz.js").then(({ default: renderEpub }) => renderEpub(buffer, target, context));
var renderFileViewerUmd = (buffer, target, _type, context) => import("./umd-BQ1e39NB.js").then(({ default: renderUmd }) => renderUmd(buffer, target, context));
var renderFileViewerFb2 = (buffer, target, _type, context) => import("./fb2-35ruNJsQ.js").then(({ default: renderFb2 }) => renderFb2(buffer, target, context));
var ebookRenderer = {
	id: "file-viewer-renderer-epub",
	label: "Flyfish File Viewer ebook renderer",
	definitions: [
		ebookRendererDefinition,
		fb2RendererDefinition,
		umdRendererDefinition
	],
	handlers: [
		{
			rendererId: ebookRendererDefinition.id,
			handler: renderFileViewerEpub
		},
		{
			rendererId: umdRendererDefinition.id,
			handler: renderFileViewerUmd
		},
		{
			rendererId: fb2RendererDefinition.id,
			handler: renderFileViewerFb2
		}
	]
};
//#endregion
export { renderFileViewerFb2 as a, renderFileViewerEpub as i, ebookRendererDefinition as n, renderFileViewerUmd as o, fb2RendererDefinition as r, umdRendererDefinition as s, ebookRenderer as t };
