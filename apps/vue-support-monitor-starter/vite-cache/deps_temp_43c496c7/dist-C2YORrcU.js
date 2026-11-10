import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
import "./sanitizeHtml-BLtqucHp.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/xmlRegistration.js
var key = Symbol.for("@file-viewer/renderer-text/xml-profiles");
var registry = globalThis;
function getXmlProfilesLoader() {
	var _a;
	return (_a = registry[key]) === null || _a === void 0 ? void 0 : _a.values().next().value;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/index.js
var textRendererIds = ["code", "markdown"];
var textDefinitions = DEFAULT_RENDERER_DEFINITIONS.filter((definition) => textRendererIds.includes(definition.id));
if (textDefinitions.length !== textRendererIds.length) throw new Error("@file-viewer/renderer-text could not locate the shared code/markdown format definitions.");
var textRendererDefinitions = textDefinitions;
var renderFileViewerCode = async (buffer, target, type, context) => {
	var _a, _b, _c, _d, _e;
	if (/^(?:html|htm)$/i.test(type || "")) {
		const { default: renderHtml } = await import("./html-DfBHud9g.js");
		return renderHtml(buffer, target, type, context);
	}
	if ((type === null || type === void 0 ? void 0 : type.trim().toLowerCase()) === "xml" && ((_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.xml)) {
		const loader = getXmlProfilesLoader();
		if (loader) {
			const { default: renderXml } = await loader();
			return renderXml(buffer, target, context);
		}
		const message = "Enable @file-viewer/renderer-text/xml-profiles and deploy its self-hosted runtime assets.";
		try {
			(_c = (_b = context.options.xml).onDiagnostic) === null || _c === void 0 || _c.call(_b, {
				code: "capability-unavailable",
				message
			});
		} catch {}
		try {
			(_e = (_d = context.options).onDiagnostic) === null || _e === void 0 || _e.call(_d, {
				code: "xml-profile-capability-unavailable",
				level: "warning",
				message
			});
		} catch {}
	}
	const { default: renderCode } = await import("./code-D-7vyh4e.js");
	return renderCode(buffer, target, type, context);
};
var renderFileViewerMarkdown = (buffer, target, type, context) => import("./largeText-B-NxvPBX.js").then(async ({ default: renderLargeText, shouldVirtualizeMarkdownBuffer }) => {
	if (shouldVirtualizeMarkdownBuffer(buffer, context)) return renderLargeText(buffer, target, type || "md", context);
	const { default: renderMarkdown } = await import("./markdown-DDDjioFB.js");
	return renderMarkdown(buffer, target, context);
});
var textRenderer = {
	id: "file-viewer-renderer-text",
	label: "Flyfish File Viewer text renderer",
	definitions: textRendererDefinitions,
	handlers: [{
		rendererId: "code",
		handler: renderFileViewerCode
	}, {
		rendererId: "markdown",
		handler: renderFileViewerMarkdown
	}]
};
//#endregion
export { textRendererDefinitions as i, renderFileViewerMarkdown as n, textRenderer as r, renderFileViewerCode as t };
