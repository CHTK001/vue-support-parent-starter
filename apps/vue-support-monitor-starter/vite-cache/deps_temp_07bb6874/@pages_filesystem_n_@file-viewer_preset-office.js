import { H as registerFileViewerAutoRendererPreset } from "./dist-B6GcL3C6.js";
import { a as pdfRenderer, c as hangulRenderer, i as presentationRenderer, n as wordRenderer, o as ofdRenderer, r as spreadsheetRenderer, s as iworkRenderer, t as wordPerfectRenderer } from "./dist-CJ8Q2u36.js";
//#region ../../node_modules/.pnpm/@file-viewer+preset-office@3.1.2_pdf-lib@1.17.1/node_modules/@file-viewer/preset-office/dist/index.js
var officeRenderers = {
	id: "file-viewer-preset-office",
	label: "Flyfish File Viewer office renderer preset",
	renderers: [
		pdfRenderer,
		wordRenderer,
		spreadsheetRenderer,
		presentationRenderer,
		ofdRenderer,
		iworkRenderer,
		wordPerfectRenderer,
		hangulRenderer
	]
};
var fileViewerPresetOffice = officeRenderers;
registerFileViewerAutoRendererPreset(officeRenderers, {
	id: "office",
	packageName: "@file-viewer/preset-office"
});
//#endregion
export { officeRenderers as default, officeRenderers, fileViewerPresetOffice };
