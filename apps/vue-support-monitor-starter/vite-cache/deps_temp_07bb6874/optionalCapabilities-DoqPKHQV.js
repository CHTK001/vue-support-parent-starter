//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/optionalCapabilities.js
var hlsLoader = null;
var midiLoader = null;
var registerFileViewerHlsLoader = (loader) => {
	hlsLoader = loader;
};
var registerFileViewerMidiLoader = (loader) => {
	midiLoader = loader;
};
var getFileViewerHlsLoader = () => hlsLoader;
var getFileViewerMidiLoader = () => midiLoader;
//#endregion
export { registerFileViewerMidiLoader as i, getFileViewerMidiLoader as n, registerFileViewerHlsLoader as r, getFileViewerHlsLoader as t };
