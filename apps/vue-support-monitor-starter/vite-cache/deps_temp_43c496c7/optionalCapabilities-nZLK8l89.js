//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/optionalCapabilities.js
var rtfLoader = null;
var registerFileViewerRtfLoader = (loader) => {
	rtfLoader = loader;
};
var getFileViewerRtfLoader = () => rtfLoader;
//#endregion
export { registerFileViewerRtfLoader as n, getFileViewerRtfLoader as t };
