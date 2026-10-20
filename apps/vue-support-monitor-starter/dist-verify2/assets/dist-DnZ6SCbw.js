import { Gi as registerFileViewerAutoRendererPreset } from "./file-viewer-3d-ijA7B-Qe.js";
import { d as ofdRenderer } from "./file-viewer-ofd-9eNsNwQp.js";
import { r as hangulRenderer } from "./file-viewer-hangul-B_bH1JEd.js";
import { i as iworkRenderer } from "./file-viewer-iwork-BYSdYvWo.js";
import { n as pdfRenderer } from "./file-viewer-pdf-Dpq3JwgO.js";
import { c as presentationRenderer } from "./file-viewer-presentation-D4LXtXdY.js";
import { S as wordRenderer, b as wordPerfectRenderer, k as spreadsheetRenderer } from "./file-viewer-preset-all-CExGzNo-.js";
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
