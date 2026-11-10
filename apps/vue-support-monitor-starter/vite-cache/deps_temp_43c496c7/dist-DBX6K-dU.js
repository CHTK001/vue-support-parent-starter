import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/index.js
var mediaRendererIds = ["audio", "video"];
var mediaDefinitions = DEFAULT_RENDERER_DEFINITIONS.filter((definition) => mediaRendererIds.includes(definition.id));
if (mediaDefinitions.length !== mediaRendererIds.length) throw new Error("@file-viewer/renderer-media could not locate the shared audio/video format definitions.");
var mediaRendererDefinitions = mediaDefinitions;
var renderFileViewerAudio = (buffer, target, type, context) => import("./audio-DCVnIrZ4.js").then(({ default: renderAudio }) => renderAudio(buffer, target, type, context));
var renderFileViewerVideo = (buffer, target, type, context) => import("./video-C_Q-SSzT.js").then(({ default: renderVideo }) => renderVideo(buffer, target, type, context));
var mediaRenderer = {
	id: "file-viewer-renderer-media",
	label: "Flyfish File Viewer media renderer",
	definitions: mediaRendererDefinitions,
	handlers: [{
		rendererId: "audio",
		handler: renderFileViewerAudio
	}, {
		rendererId: "video",
		handler: renderFileViewerVideo
	}]
};
//#endregion
export { renderFileViewerVideo as i, mediaRendererDefinitions as n, renderFileViewerAudio as r, mediaRenderer as t };
