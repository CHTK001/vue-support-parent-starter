//#region ../../node_modules/.pnpm/@file-viewer+renderer-dicom@3.1.2_autoprefixer@10.5.4_postcss@8.5.32__wslink@2.5.0/node_modules/@file-viewer/renderer-dicom/dist/index.js
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
var createHandler = (options) => (buffer, target, type, context) => import("./dicom-CfyzQAlJ.js").then(({ default: renderDicom }) => renderDicom(buffer, target, type, context, options));
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
