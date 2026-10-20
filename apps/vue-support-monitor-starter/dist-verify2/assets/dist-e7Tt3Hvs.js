const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dicom-DU9vnEaE.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/linear-YP6PDw8s.js","assets/init-CgYecCqF.js","assets/value-H8gKMGY5.js","assets/src-gHE2rRQW.js","assets/file-viewer-ebook-si5y3pmt.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-dicom@3.1.2_autoprefixer@10.5.4_postcss@8.5.25__wslink@2.5.0/node_modules/@file-viewer/renderer-dicom/dist/index.js
var dicomRendererDefinition = {
	id: "dicom",
	label: "DICOM medical image",
	category: "image",
	extensions: ["dcm", "dicom"],
	async: true,
	supportLevel: "basic",
	status: "experimental",
	packageName: "@file-viewer/renderer-dicom",
	presets: [],
	knownLimits: ["This MVP is tested with Implicit/Explicit/Deflated Explicit VR Little Endian, JPEG Lossless Process 14 SV1, JPEG-LS Lossless, and JPEG 2000 Lossless Part 10 files; other transfer syntaxes and DICOMweb are not included.", "The MVP renders one single-frame or multi-frame local file as a stack; series assembly, PACS/DICOMweb, MPR, and diagnostic use are not included."],
	capabilities: {
		download: true,
		print: false,
		exportHtml: false,
		zoom: true
	}
};
var createHandler = (options) => (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderDicom } = await import("./dicom-DU9vnEaE.js");
	return { default: renderDicom };
}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9])).then(({ default: renderDicom }) => renderDicom(buffer, target, type, context, options));
var renderFileViewerDicom = createHandler();
var createDicomRenderer = (options) => ({
	id: "file-viewer-renderer-dicom",
	label: "Flyfish File Viewer opt-in DICOM renderer",
	definitions: [dicomRendererDefinition],
	handlers: [{
		rendererId: dicomRendererDefinition.id,
		handler: options ? createHandler(options) : renderFileViewerDicom
	}]
});
var dicomRenderer = createDicomRenderer();
//#endregion
export { createDicomRenderer, dicomRenderer as default, dicomRenderer, dicomRendererDefinition, renderFileViewerDicom };
