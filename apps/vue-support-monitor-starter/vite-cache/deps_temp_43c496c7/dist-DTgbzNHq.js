import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/index.js
var emailDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "email");
if (!emailDefinition) throw new Error("@file-viewer/renderer-email could not locate the shared email format definition.");
var emailRendererDefinition = emailDefinition;
var renderFileViewerEmail = (buffer, target, type, context) => import("./email-B7OyRZec.js").then(({ default: renderEmail }) => renderEmail(buffer, target, type, context));
var emailRenderer = {
	id: "file-viewer-renderer-email",
	label: "Flyfish File Viewer email renderer",
	definitions: [emailRendererDefinition],
	handlers: [{
		rendererId: emailRendererDefinition.id,
		handler: renderFileViewerEmail
	}]
};
//#endregion
export { emailRendererDefinition as n, renderFileViewerEmail as r, emailRenderer as t };
