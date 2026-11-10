import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-image@3.1.2/node_modules/@file-viewer/renderer-image/dist/index.js
var imageDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "image");
if (!imageDefinition) throw new Error("@file-viewer/renderer-image could not locate the core image renderer definition.");
var imageRendererDefinition = imageDefinition;
var renderFileViewerImage = (buffer, target, type, context) => import("./image-DF6thzQx.js").then(({ default: renderImage }) => renderImage(buffer, target, type, context));
var imageRenderer = {
	id: "file-viewer-renderer-image",
	label: "Flyfish File Viewer image renderer",
	definitions: [imageRendererDefinition],
	handlers: [{
		rendererId: imageRendererDefinition.id,
		handler: renderFileViewerImage
	}]
};
//#endregion
export { imageRendererDefinition as n, renderFileViewerImage as r, imageRenderer as t };
