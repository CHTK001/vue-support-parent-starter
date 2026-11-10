import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-hangul@3.1.2/node_modules/@file-viewer/renderer-hangul/dist/index.js
var hangulDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "office-hangul");
if (!hangulDefinition) throw new Error("@file-viewer/renderer-hangul could not locate the shared HWP/HWPX definition.");
var hangulRendererDefinition = hangulDefinition;
var renderFileViewerHangul = (buffer, target, type, context) => import("./hangul-BGTBjOT4.js").then(({ default: renderHangul }) => renderHangul(buffer, target, type, context));
var hangulRenderer = {
	id: "file-viewer-renderer-hangul",
	label: "Flyfish File Viewer HWP/HWPX renderer",
	definitions: [hangulRendererDefinition],
	handlers: [{
		rendererId: hangulRendererDefinition.id,
		handler: renderFileViewerHangul
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-iwork@3.1.2/node_modules/@file-viewer/renderer-iwork/dist/index.js
var definitions = [
	"apple-pages",
	"apple-numbers",
	"apple-keynote"
].map((id) => DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === id));
if (definitions.some((definition) => !definition)) throw new Error("@file-viewer/renderer-iwork could not locate all shared iWork definitions.");
var renderFileViewerIwork = (buffer, target, type, context) => import("./iwork-BHcFv_4J.js").then(({ default: renderIwork }) => renderIwork(buffer, target, type, context));
var iworkRenderer = {
	id: "file-viewer-renderer-iwork",
	label: "Flyfish File Viewer Apple iWork renderer",
	definitions,
	handlers: definitions.map((definition) => ({
		rendererId: definition.id,
		handler: renderFileViewerIwork
	}))
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/dist/index.js
var ofdDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "ofd");
if (!ofdDefinition) throw new Error("@file-viewer/renderer-ofd could not locate the core OFD renderer definition.");
var ofdRendererDefinition = ofdDefinition;
var renderFileViewerOfd = (buffer, target, _type, context) => import("./ofd-DdOL_Qy8.js").then(({ default: renderOfd }) => renderOfd(buffer, target, context));
var ofdRenderer = {
	id: "file-viewer-renderer-ofd",
	label: "Flyfish File Viewer OFD renderer",
	definitions: [ofdRendererDefinition],
	handlers: [{
		rendererId: ofdRendererDefinition.id,
		handler: renderFileViewerOfd
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-pdf@3.1.2_pdf-lib@1.17.1/node_modules/@file-viewer/renderer-pdf/dist/index.js
var pdfDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "pdf");
if (!pdfDefinition) throw new Error("@file-viewer/renderer-pdf could not locate the core PDF renderer definition.");
var pdfRendererDefinition = pdfDefinition;
var renderFileViewerPdf = (buffer, target, _type, context) => import("./pdf-CiC60Ol5.js").then(({ default: renderPdf }) => renderPdf(buffer, target, context));
var pdfRenderer = {
	id: "file-viewer-renderer-pdf",
	label: "Flyfish File Viewer PDF renderer",
	definitions: [pdfRendererDefinition],
	handlers: [{
		rendererId: pdfRendererDefinition.id,
		handler: renderFileViewerPdf
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-presentation@3.1.2/node_modules/@file-viewer/renderer-presentation/dist/index.js
var binaryPresentationDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "office-presentation-binary");
var presentationDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "office-presentation");
if (!binaryPresentationDefinition || !presentationDefinition) throw new Error("@file-viewer/renderer-presentation could not locate the core presentation renderer definitions.");
var binaryPresentationRendererDefinition = binaryPresentationDefinition;
var presentationRendererDefinition = presentationDefinition;
var renderFileViewerBinaryPresentation = (buffer, target, type, context) => import("./ppt-CLg0REPd.js").then(({ default: renderPpt }) => renderPpt(buffer, target, type, context));
var renderFileViewerPresentation = (buffer, target, type, context) => import("./pptx-DHn4-pA_.js").then(({ default: renderPptx }) => renderPptx(buffer, target, type, context));
var presentationRenderer = {
	id: "file-viewer-renderer-presentation",
	label: "Flyfish File Viewer presentation renderer",
	definitions: [binaryPresentationRendererDefinition, presentationRendererDefinition],
	handlers: [{
		rendererId: binaryPresentationRendererDefinition.id,
		handler: renderFileViewerBinaryPresentation
	}, {
		rendererId: presentationRendererDefinition.id,
		handler: renderFileViewerPresentation
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/index.js
var spreadsheetDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "spreadsheet-openxml");
var dbfDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "spreadsheet-dbf");
if (!spreadsheetDefinition || !dbfDefinition) throw new Error("@file-viewer/renderer-spreadsheet could not locate the shared Spreadsheet format definition.");
var spreadsheetRendererDefinition = spreadsheetDefinition;
var dbfRendererDefinition = dbfDefinition;
var renderFileViewerSpreadsheet = (buffer, target, type, context) => import("./spreadsheet-Dm1VHhTP.js").then(({ default: renderSpreadsheet }) => renderSpreadsheet(buffer, target, type, context));
var spreadsheetRenderer = {
	id: "file-viewer-renderer-spreadsheet",
	label: "Flyfish File Viewer Spreadsheet renderer",
	definitions: [spreadsheetRendererDefinition, dbfRendererDefinition],
	handlers: [spreadsheetRendererDefinition, dbfRendererDefinition].map((definition) => ({
		rendererId: definition.id,
		handler: renderFileViewerSpreadsheet
	}))
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/index.js
var wordRendererIds = [
	"office-word-openxml",
	"office-word-binary",
	"open-document"
];
var wordDefinitions = DEFAULT_RENDERER_DEFINITIONS.filter((definition) => wordRendererIds.includes(definition.id));
if (wordDefinitions.length !== wordRendererIds.length) throw new Error("@file-viewer/renderer-word could not locate the shared Word renderer definitions.");
var wordRendererDefinitions = wordDefinitions;
var renderFileViewerWordDocx = (buffer, target, _type, context) => import("./wordDocx-DXeNQP2l.js").then(({ default: renderWordDocx }) => renderWordDocx(buffer, target, context));
/**
* A surprising number of legacy systems keep the `.doc` suffix after saving
* an OOXML document. Route those ZIP-based files through the DOCX engine while
* leaving genuine OLE/CFB `.doc` files on the binary parser. Word 2003 XML
* has its own single-file container and is adapted lazily to the OOXML renderer.
*/
var resolveFileViewerWordContainer = (buffer) => {
	if (buffer.byteLength < 2) return "binary";
	const bytes = new Uint8Array(buffer, 0, 2);
	if (bytes[0] === 80 && bytes[1] === 75) return "openxml";
	const prefix = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8192));
	const utf16le = bytes[0] === 255 && bytes[1] === 254 || bytes[0] === 60 && bytes[1] === 0;
	const utf16be = bytes[0] === 254 && bytes[1] === 255 || bytes[0] === 0 && bytes[1] === 60;
	const text = new TextDecoder(utf16le ? "utf-16le" : utf16be ? "utf-16be" : "utf-8").decode(prefix);
	return /<(?:[\w.-]+:)?wordDocument(?:\s|>)/.test(text) && text.includes("http://schemas.microsoft.com/office/word/2003/wordml") ? "wordml" : "binary";
};
var renderFileViewerWordDoc = (buffer, target, _type, context) => {
	const container = resolveFileViewerWordContainer(buffer);
	if (container === "wordml") return Promise.all([import("./wordMl-D_KOjHMJ.js"), import("./wordDocx-DXeNQP2l.js")]).then(async ([{ convertWordMlToDocx }, { default: renderWordDocx }]) => renderWordDocx(await convertWordMlToDocx(buffer, target), target, context));
	return container === "openxml" ? import("./wordDocx-DXeNQP2l.js").then(({ default: renderWordDocx }) => renderWordDocx(buffer, target, context)) : import("./wordDoc-Cvd8oOEG.js").then(({ default: renderWordDoc }) => renderWordDoc(buffer, target, context));
};
var renderFileViewerOpenDocument = (buffer, target, type, context) => import("./openDocument-DZAtXljN.js").then(({ default: renderOpenDocument }) => renderOpenDocument(buffer, target, type, context));
var wordRenderer = {
	id: "file-viewer-renderer-word",
	label: "Flyfish File Viewer Word renderer",
	definitions: wordRendererDefinitions,
	handlers: [
		{
			rendererId: "office-word-openxml",
			handler: renderFileViewerWordDocx
		},
		{
			rendererId: "office-word-binary",
			handler: renderFileViewerWordDoc
		},
		{
			rendererId: "open-document",
			handler: renderFileViewerOpenDocument
		}
	]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-wordperfect@3.1.2/node_modules/@file-viewer/renderer-wordperfect/dist/index.js
var definition = DEFAULT_RENDERER_DEFINITIONS.find((item) => item.id === "office-wordperfect");
if (!definition) throw new Error("@file-viewer/renderer-wordperfect could not locate the shared WordPerfect definition.");
var wordPerfectRendererDefinition = definition;
var renderFileViewerWordPerfect = (buffer, target, type, context) => import("./wordperfect-CPkW2VKY.js").then(({ default: renderWordPerfect }) => renderWordPerfect(buffer, target, type, context));
var wordPerfectRenderer = {
	id: "file-viewer-renderer-wordperfect",
	label: "Flyfish File Viewer WordPerfect renderer",
	definitions: [wordPerfectRendererDefinition],
	handlers: [{
		rendererId: wordPerfectRendererDefinition.id,
		handler: renderFileViewerWordPerfect
	}]
};
//#endregion
export { pdfRenderer as a, hangulRenderer as c, presentationRenderer as i, wordRenderer as n, ofdRenderer as o, spreadsheetRenderer as r, iworkRenderer as s, wordPerfectRenderer as t };
