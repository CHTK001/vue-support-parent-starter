const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/binary-CmkUhoc-.js","assets/types-DfBjmPYG.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS } from "./file-viewer-3d-ijA7B-Qe.js";
import { n as normalizeBinaryInspectorLimits, t as DEFAULT_BINARY_INSPECTOR_LIMITS } from "./types-DfBjmPYG.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-binary@3.1.2/node_modules/@file-viewer/renderer-binary/dist/index.js
var binaryDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "binary-inspector");
if (!binaryDefinition) throw new Error("@file-viewer/renderer-binary could not locate the binary inspector renderer definition.");
var binaryRendererDefinition = binaryDefinition;
var renderFileViewerBinary = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderBinary } = await import("./binary-CmkUhoc-.js");
	return { default: renderBinary };
}, __vite__mapDeps([0,1])).then(({ default: renderBinary }) => renderBinary(buffer, target, type, context));
var createBinaryRenderer = (options = {}) => ({
	id: "file-viewer-renderer-binary",
	label: "Flyfish File Viewer binary inspector",
	definitions: [binaryRendererDefinition],
	handlers: [{
		rendererId: binaryRendererDefinition.id,
		handler: (buffer, target, type, context) => __vitePreload(async () => {
			const { default: renderBinary } = await import("./binary-CmkUhoc-.js");
			return { default: renderBinary };
		}, __vite__mapDeps([0,1])).then(({ default: renderBinary }) => renderBinary(buffer, target, type, context, options))
	}]
});
var binaryRenderer = createBinaryRenderer();
//#endregion
export { DEFAULT_BINARY_INSPECTOR_LIMITS, binaryRenderer, binaryRenderer as default, binaryRendererDefinition, createBinaryRenderer, normalizeBinaryInspectorLimits, renderFileViewerBinary };
