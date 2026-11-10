//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/optionalCapabilities.js
var mermaidLoader = null;
var diffToHtml = null;
var pakoLoader = null;
/**
* Enables embedded Mermaid blocks without making Mermaid part of the base text
* renderer dependency closure. Capability packs call this once at startup.
*/
var registerFileViewerMermaidLoader = (loader) => {
	mermaidLoader = loader;
};
var getFileViewerMermaidLoader = () => mermaidLoader;
var registerFileViewerDiffToHtml = (renderer) => {
	diffToHtml = renderer;
};
var getFileViewerDiffToHtml = () => diffToHtml;
var registerFileViewerPakoLoader = (loader) => {
	pakoLoader = loader;
};
var getFileViewerPakoLoader = () => pakoLoader;
//#endregion
export { registerFileViewerMermaidLoader as a, registerFileViewerDiffToHtml as i, getFileViewerMermaidLoader as n, registerFileViewerPakoLoader as o, getFileViewerPakoLoader as r, getFileViewerDiffToHtml as t };
