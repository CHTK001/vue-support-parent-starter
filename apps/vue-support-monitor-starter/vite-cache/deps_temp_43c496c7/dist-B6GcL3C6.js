import { C as createEmptyFileViewerSearchState, S as buildFileViewerDocumentTextChunks, T as normalizeFileViewerSearchOptions, b as getCurrentFileViewerDocumentAnchor, d as findFileViewerZoomProvider, g as unregisterFileViewerViewStateProvider, i as resolveFileViewerFitScale, l as findFileViewerSearchProvider, p as registerFileViewerViewStateProvider, u as findFileViewerViewStateProvider, v as collectFileViewerDocumentAnchors, x as scrollToFileViewerDocumentAnchor, y as findFileViewerAnchorForElement } from "./fit-BmeG0j2O.js";
import { a as triggerFileViewerBlobDownload, c as waitForFileViewerNextPaint, l as waitForFileViewerPrintWindowReady, o as triggerFileViewerUrlDownload } from "./export-D49MPTci.js";
import { n as resolveFileViewerLocale, r as translateFileViewerMessage } from "./messages-C9eWaSMj.js";
import "./printMaskLoader-Si187RQ4.js";
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/platform/assets.js
var DEFAULT_FILE_VIEWER_ARCHIVE_WORKER_PATH = "vendor/libarchive/worker-bundle.js";
var DEFAULT_FILE_VIEWER_ARCHIVE_WASM_PATH = "vendor/libarchive/libarchive.wasm";
var DEFAULT_FILE_VIEWER_CHM_WORKER_PATH = "vendor/chm/chm.worker.js";
var DEFAULT_FILE_VIEWER_CHM_WORKER_PACKAGE_PATH = "@file-viewer/renderer-chm/worker/chm.worker.js";
var DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH = "vendor/chm/chm_wasm.js";
var DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PACKAGE_PATH = "@file-viewer/renderer-chm/wasm/chm_wasm.js";
var DEFAULT_FILE_VIEWER_CHM_WASM_PATH = "vendor/chm/chm_wasm_bg.wasm";
var DEFAULT_FILE_VIEWER_CHM_WASM_PACKAGE_PATH = "@file-viewer/renderer-chm/wasm/chm_wasm_bg.wasm";
var DEFAULT_FILE_VIEWER_DOCX_WORKER_PATH = "vendor/docx/docx.worker.js";
var DEFAULT_FILE_VIEWER_DOCX_WORKER_JSZIP_PATH = "vendor/docx/jszip.min.js";
var DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION = "0.3.32";
var DEFAULT_FILE_VIEWER_PRESENTATION_WORKER_PATH = "vendor/pptx/pptx.worker.js";
var DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH = "vendor/ppt";
var DEFAULT_FILE_VIEWER_PPT_RUNTIME_VERSION = "0.3.4";
var DEFAULT_FILE_VIEWER_PPT_MODULE_PATH = `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/index.mjs`;
var DEFAULT_FILE_VIEWER_PPT_WORKER_PATH = `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/worker.mjs`;
var DEFAULT_FILE_VIEWER_PPT_FRAME_CACHE_PATH = `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/frame-cache.mjs`;
var DEFAULT_FILE_VIEWER_PPT_WASM_PATH = `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/ppt-native.wasm`;
var DEFAULT_FILE_VIEWER_PPT_FONT_PATH = `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/ppt-font-cjk.otf`;
var DEFAULT_FILE_VIEWER_SPREADSHEET_WORKER_PATH = "vendor/xlsx/sheet.worker.js";
var DEFAULT_FILE_VIEWER_IWORK_WORKER_PATH = "vendor/iwork/iwork.worker.js";
var DEFAULT_FILE_VIEWER_IWORK_WORKER_PACKAGE_PATH = "@file-viewer/renderer-iwork/worker/iwork.worker.js";
var DEFAULT_FILE_VIEWER_HANGUL_WORKER_PATH = "vendor/hangul/hangul.worker.js";
var DEFAULT_FILE_VIEWER_HANGUL_WORKER_PACKAGE_PATH = "@file-viewer/renderer-hangul/worker/hangul.worker.js";
var DEFAULT_FILE_VIEWER_WORDPERFECT_WORKER_PATH = "vendor/wordperfect/wordperfect.worker.js";
var DEFAULT_FILE_VIEWER_WORDPERFECT_WORKER_PACKAGE_PATH = "@file-viewer/renderer-wordperfect/worker/wordperfect.worker.js";
var DEFAULT_FILE_VIEWER_WORDPERFECT_WASM_PATH = "vendor/wordperfect/libwpd.wasm";
var DEFAULT_FILE_VIEWER_WORDPERFECT_WASM_PACKAGE_PATH = "@file-viewer/renderer-wordperfect/worker/libwpd.wasm";
var DEFAULT_FILE_VIEWER_WORDPERFECT_MODULE_PATH = "vendor/wordperfect/libwpd.mjs";
var DEFAULT_FILE_VIEWER_WORDPERFECT_MODULE_PACKAGE_PATH = "@file-viewer/renderer-wordperfect/worker/libwpd.mjs";
var DEFAULT_FILE_VIEWER_PDF_WORKER_PATH = "vendor/pdf/pdf.worker.mjs";
var DEFAULT_FILE_VIEWER_PDF_CMAP_PATH = "vendor/pdf/cmaps/";
var DEFAULT_FILE_VIEWER_PDF_WASM_PATH = "vendor/pdf/wasm/";
var DEFAULT_FILE_VIEWER_PDF_STANDARD_FONT_PATH = "vendor/pdf/standard_fonts/";
var DEFAULT_FILE_VIEWER_PDF_CJK_FONT_FALLBACK_PATH = "vendor/pdf/fonts/";
var DEFAULT_FILE_VIEWER_DRAWIO_VIEWER_SCRIPT_PATH = "vendor/drawio/viewer-static.min.js";
var DEFAULT_FILE_VIEWER_DRAWIO_ASSET_PATH = "vendor/drawio/";
var DEFAULT_FILE_VIEWER_CAD_RUNTIME_VERSION = "0.8.2";
var COMPATIBILITY_FILE_VIEWER_CAD_RUNTIME_VERSION = "0.8.0";
var DEFAULT_FILE_VIEWER_CAD_WASM_PATH = `wasm/cad/${DEFAULT_FILE_VIEWER_CAD_RUNTIME_VERSION}/`;
var DEFAULT_FILE_VIEWER_CAD_WORKER_PATH = `${DEFAULT_FILE_VIEWER_CAD_WASM_PATH}dwg-worker.js`;
var DEFAULT_FILE_VIEWER_CAD_DWF_WASM_PATH = `${DEFAULT_FILE_VIEWER_CAD_WASM_PATH}dwfv-render.wasm`;
var DEFAULT_FILE_VIEWER_CAD_LIBREDWG_SCRIPT_PATH = `${DEFAULT_FILE_VIEWER_CAD_WASM_PATH}libredwg-web.js`;
var DEFAULT_FILE_VIEWER_CAD_LIBREDWG_WASM_PATH = `${DEFAULT_FILE_VIEWER_CAD_WASM_PATH}libredwg-web.wasm`;
var DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_URL = "wasm/typst/typst_ts_web_compiler_bg.wasm";
var DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_URL = "wasm/typst/typst_ts_renderer_bg.wasm";
var DEFAULT_FILE_VIEWER_TYPST_FONT_ASSETS_URL = "wasm/typst/fonts/";
var DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_PACKAGE_PATH = "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm";
var DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_PACKAGE_PATH = "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm";
var DEFAULT_FILE_VIEWER_DATA_SQL_WASM_URL = "wasm/data/sql-wasm.wasm";
var DEFAULT_FILE_VIEWER_DATA_SQL_WASM_PACKAGE_PATH = "sql.js/dist/sql-wasm.wasm";
var DEFAULT_FILE_VIEWER_ILLUSTRATOR_WORKER_PATH = "vendor/design/illustrator-pgf.worker.js";
var DEFAULT_FILE_VIEWER_ILLUSTRATOR_WORKER_PACKAGE_PATH = "@file-viewer/renderer-design/worker/illustrator-pgf.worker.js";
var DEFAULT_FILE_VIEWER_ILLUSTRATOR_LICENSE_PATH = "vendor/design/LICENSE.illustrator-pgf-MIT.txt";
var DEFAULT_FILE_VIEWER_ILLUSTRATOR_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/illustrator-pgf-MIT.txt";
var DEFAULT_FILE_VIEWER_ILLUSTRATOR_ZSTD_LICENSE_PATH = "vendor/design/LICENSE.fzstd-MIT.txt";
var DEFAULT_FILE_VIEWER_ILLUSTRATOR_ZSTD_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/fzstd-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_WORKER_PATH = "vendor/design/photoshop.worker.js";
var DEFAULT_FILE_VIEWER_DESIGN_WORKER_PACKAGE_PATH = "@file-viewer/renderer-design/worker/photoshop.worker.js";
var DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH = "vendor/design/adobe-container.worker.js";
var DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PACKAGE_PATH = "@file-viewer/renderer-design/worker/adobe-container.worker.js";
var DEFAULT_FILE_VIEWER_ADOBE_RESOURCE_WORKER_PATH = "vendor/design/adobe-resource.worker.js";
var DEFAULT_FILE_VIEWER_ADOBE_RESOURCE_WORKER_PACKAGE_PATH = "@file-viewer/renderer-design/worker/adobe-resource.worker.js";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_WORKER_PATH = "vendor/design/postscript.worker.js";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_WORKER_PACKAGE_PATH = "@file-viewer/renderer-design/worker/postscript.worker.js";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_WASM_PATH = "vendor/design/stet_wasm_bg.wasm";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_WASM_PACKAGE_PATH = "@file-viewer/renderer-design/wasm/postscript.wasm";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_APACHE_LICENSE_PATH = "vendor/design/LICENSE.stet-Apache-2.0.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_APACHE_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/Stet-Apache-2.0.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_MIT_LICENSE_PATH = "vendor/design/LICENSE.stet-MIT.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_MIT_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/Stet-MIT.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_CARLITO_LICENSE_PATH = "vendor/design/LICENSE.Carlito-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_CARLITO_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/Carlito-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_TINOS_LICENSE_PATH = "vendor/design/LICENSE.Tinos-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_TINOS_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/Tinos-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_COUSINE_LICENSE_PATH = "vendor/design/LICENSE.Cousine-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_COUSINE_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/Cousine-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_NOTO_SYMBOLS_LICENSE_PATH = "vendor/design/LICENSE.NotoSansSymbols2-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_POSTSCRIPT_NOTO_SYMBOLS_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/NotoSansSymbols2-OFL-1.1.txt";
var DEFAULT_FILE_VIEWER_IDML_WORKER_PATH = "vendor/design/idml.worker.js";
var DEFAULT_FILE_VIEWER_IDML_WORKER_PACKAGE_PATH = "@file-viewer/renderer-design/worker/idml.worker.js";
var DEFAULT_FILE_VIEWER_IDML_WASM_PATH = "vendor/design/paged_introspect_wasm_bg.wasm";
var DEFAULT_FILE_VIEWER_IDML_WASM_PACKAGE_PATH = "@paged-media/introspect-wasm/paged_introspect_wasm_bg.wasm";
var DEFAULT_FILE_VIEWER_IDML_LICENSE_PATH = "vendor/design/LICENSE.introspect-wasm-MPL-2.0.txt";
var DEFAULT_FILE_VIEWER_IDML_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/MPL-2.0.txt";
var DEFAULT_FILE_VIEWER_DESIGN_THIRD_PARTY_NOTICES_PATH = "vendor/design/THIRD_PARTY_NOTICES.md";
var DEFAULT_FILE_VIEWER_DESIGN_THIRD_PARTY_NOTICES_PACKAGE_PATH = "@file-viewer/renderer-design/third-party-notices";
var DEFAULT_FILE_VIEWER_DESIGN_XMLDOM_LICENSE_PATH = "vendor/design/LICENSE.xmldom-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_XMLDOM_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/xmldom-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_SAXES_LICENSE_PATH = "vendor/design/LICENSE.saxes-ISC.txt";
var DEFAULT_FILE_VIEWER_DESIGN_SAXES_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/saxes-ISC.txt";
var DEFAULT_FILE_VIEWER_DESIGN_AG_PSD_LICENSE_PATH = "vendor/design/LICENSE.ag-psd-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_AG_PSD_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/ag-psd-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_WEBTOON_PSD_LICENSE_PATH = "vendor/design/LICENSE.webtoon-psd-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_WEBTOON_PSD_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/webtoon-psd-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_BASE64_JS_LICENSE_PATH = "vendor/design/LICENSE.base64-js-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_BASE64_JS_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/base64-js-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_PAKO_LICENSE_PATH = "vendor/design/LICENSE.pako-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_PAKO_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/pako-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_XMLCHARS_LICENSE_PATH = "vendor/design/LICENSE.xmlchars-MIT.txt";
var DEFAULT_FILE_VIEWER_DESIGN_XMLCHARS_LICENSE_PACKAGE_PATH = "@file-viewer/renderer-design/licenses/xmlchars-MIT.txt";
var DEFAULT_FILE_VIEWER_MODEL_WORKER_URL = "wasm/model/occt-worker.js";
var DEFAULT_FILE_VIEWER_MODEL_RUNTIME_URL = "wasm/model/occt-import-js.js";
var DEFAULT_FILE_VIEWER_MODEL_WASM_URL = "wasm/model/occt-import-js.wasm";
var DEFAULT_FILE_VIEWER_MODEL_OCCT_LICENSE_URL = "wasm/model/LICENSE.occt.txt";
var DEFAULT_FILE_VIEWER_MODEL_IMPORT_LICENSE_URL = "wasm/model/LICENSE.occt-import-js.txt";
var DEFAULT_FILE_VIEWER_MODEL_RUNTIME_PACKAGE_PATH = "occt-import-js/dist/occt-import-js.js";
var DEFAULT_FILE_VIEWER_MODEL_WASM_PACKAGE_PATH = "occt-import-js/dist/occt-import-js.wasm";
var DEFAULT_FILE_VIEWER_MODEL_OCCT_LICENSE_PACKAGE_PATH = "occt-import-js/dist/license.occt.txt";
var DEFAULT_FILE_VIEWER_MODEL_IMPORT_LICENSE_PACKAGE_PATH = "occt-import-js/dist/license.occt-import-js.txt";
var automaticFileViewerAssetBaseUrl = Symbol("automatic-file-viewer-asset-base");
var configuredFileViewerAssetBaseUrl = automaticFileViewerAssetBaseUrl;
var pathDepth = (pathname) => pathname.split("/").filter(Boolean).length;
var longestCommonDirectoryPath = (left, right) => {
	const leftSegments = left.split("/").filter(Boolean);
	const rightSegments = right.split("/").filter(Boolean);
	const common = [];
	const length = Math.min(leftSegments.length, Math.max(0, rightSegments.length - 1));
	for (let index = 0; index < length && leftSegments[index] === rightSegments[index]; index += 1) common.push(leftSegments[index]);
	return common.length ? `/${common.join("/")}/` : "/";
};
var resolveFileViewerScriptAssetBaseCandidate = (script, documentBaseUrl, index) => {
	try {
		const rawScriptUrl = script.src || script.getAttribute("src") || "";
		if (!rawScriptUrl) return [];
		const scriptUrl = new URL(rawScriptUrl, documentBaseUrl);
		const viteClient = scriptUrl.pathname.match(/^(.*\/)@vite\/client$/i);
		const isSourceModule = /\/(?:src|node_modules|@fs|@id|@vite)(?:\/|$)/i.test(scriptUrl.pathname);
		const documentUrl = new URL(documentBaseUrl);
		const documentPathname = documentUrl.pathname.endsWith("/") ? documentUrl.pathname : `${documentUrl.pathname}/`;
		const scriptName = scriptUrl.pathname.slice(scriptUrl.pathname.lastIndexOf("/") + 1);
		const isEntryScript = /^(?:app|index|main|runtime|umi)(?:[.-]|$)/i.test(scriptName);
		const candidates = /* @__PURE__ */ new Map();
		const addCandidate = (basePath, quality) => {
			const url = new URL(basePath, scriptUrl).href;
			const candidateUrl = new URL(url);
			let score = quality + index / 1e4;
			if (candidateUrl.origin === documentUrl.origin) score += 8;
			if (documentPathname.startsWith(candidateUrl.pathname)) score += 16 + pathDepth(candidateUrl.pathname) / 4;
			if (script.type === "module") score += 2;
			if (isEntryScript) score += 2;
			const previous = candidates.get(url);
			if (!previous || previous.score < score) candidates.set(url, {
				url,
				score
			});
		};
		if (viteClient) addCandidate(viteClient[1], 12);
		if (isSourceModule) return [...candidates.values()];
		const directories = scriptUrl.pathname.split("/").filter(Boolean).slice(0, -1);
		[
			{
				segments: ["static", "js"],
				weight: 9
			},
			{
				segments: ["assets", "js"],
				weight: 9
			},
			{
				segments: ["assets", "chunks"],
				weight: 8
			},
			{
				segments: ["assets"],
				weight: 6
			},
			{
				segments: ["static"],
				weight: 6
			},
			{
				segments: ["js"],
				weight: 4
			}
		].forEach(({ segments, weight }) => {
			for (let segmentIndex = 0; segmentIndex <= directories.length - segments.length; segmentIndex += 1) {
				if (!segments.every((segment, offset) => {
					var _a;
					return ((_a = directories[segmentIndex + offset]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === segment;
				})) continue;
				const basePath = directories.slice(0, segmentIndex).length ? `/${directories.slice(0, segmentIndex).join("/")}/` : "/";
				addCandidate(basePath, weight + segments.length);
			}
		});
		if (isEntryScript) addCandidate(scriptUrl.pathname.slice(0, scriptUrl.pathname.lastIndexOf("/") + 1), 3);
		if (scriptUrl.origin === documentUrl.origin) addCandidate(longestCommonDirectoryPath(documentUrl.pathname, scriptUrl.pathname), 8);
		return [...candidates.values()];
	} catch {
		return [];
	}
};
/**
* Resolves the stable public base for runtime assets without reading
* bundler-specific environment metadata or webpack public-path variables.
* Explicit HTML `<base>` configuration stays authoritative; for SPA fallback
* routes, emitted Vite/Webpack/UMI entry scripts reveal the deployment root
* more reliably than the route-derived page URL.
*/
var resolveFileViewerRuntimeAssetBaseUrl = (documentRef) => {
	var _a;
	const documentBaseUrl = documentRef.baseURI || documentRef.URL || "file:///";
	if (configuredFileViewerAssetBaseUrl !== automaticFileViewerAssetBaseUrl) {
		if (!configuredFileViewerAssetBaseUrl) return documentBaseUrl;
		try {
			return new URL(configuredFileViewerAssetBaseUrl, documentBaseUrl).href;
		} catch {
			return configuredFileViewerAssetBaseUrl;
		}
	}
	if (documentRef.querySelector("base[href]")) return documentBaseUrl;
	return ((_a = Array.from(documentRef.querySelectorAll("script[src]")).flatMap((script, index) => resolveFileViewerScriptAssetBaseCandidate(script, documentBaseUrl, index)).sort((left, right) => right.score - left.score)[0]) === null || _a === void 0 ? void 0 : _a.url) || documentBaseUrl;
};
var getDefaultFileViewerAssetBaseUrl = (documentRef) => {
	if (configuredFileViewerAssetBaseUrl !== automaticFileViewerAssetBaseUrl) return configuredFileViewerAssetBaseUrl;
	return documentRef ? resolveFileViewerRuntimeAssetBaseUrl(documentRef) : void 0;
};
var createDesignThirdPartyAssets = (rendererId, includeContainerXmlLicenses = false) => {
	const assets = [{
		id: `${rendererId}-third-party-notices`,
		rendererId,
		kind: "license",
		target: "public",
		required: true,
		defaultPath: DEFAULT_FILE_VIEWER_DESIGN_THIRD_PARTY_NOTICES_PATH,
		packagePath: DEFAULT_FILE_VIEWER_DESIGN_THIRD_PARTY_NOTICES_PACKAGE_PATH,
		description: "Third-party notices for the bundled Adobe design Worker and WebAssembly dependency closure."
	}];
	if (includeContainerXmlLicenses) assets.push({
		id: `${rendererId}-xmldom-license`,
		rendererId,
		kind: "license",
		target: "public",
		required: true,
		defaultPath: DEFAULT_FILE_VIEWER_DESIGN_XMLDOM_LICENSE_PATH,
		packagePath: DEFAULT_FILE_VIEWER_DESIGN_XMLDOM_LICENSE_PACKAGE_PATH,
		description: "@xmldom/xmldom MIT license text for the bundled Adobe container Worker."
	}, {
		id: `${rendererId}-saxes-license`,
		rendererId,
		kind: "license",
		target: "public",
		required: true,
		defaultPath: DEFAULT_FILE_VIEWER_DESIGN_SAXES_LICENSE_PATH,
		packagePath: DEFAULT_FILE_VIEWER_DESIGN_SAXES_LICENSE_PACKAGE_PATH,
		description: "saxes ISC and inherited notice text for the bundled Adobe container Worker."
	}, {
		id: `${rendererId}-xmlchars-license`,
		rendererId,
		kind: "license",
		target: "public",
		required: true,
		defaultPath: DEFAULT_FILE_VIEWER_DESIGN_XMLCHARS_LICENSE_PATH,
		packagePath: DEFAULT_FILE_VIEWER_DESIGN_XMLCHARS_LICENSE_PACKAGE_PATH,
		description: "xmlchars MIT license text for the dependency bundled through saxes."
	});
	return assets;
};
var createPhotoshopWorkerLicenseAssets = (rendererId, includeWebtoonPsd = false) => {
	const assets = [
		{
			id: `${rendererId}-ag-psd-license`,
			rendererId,
			kind: "license",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_AG_PSD_LICENSE_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_AG_PSD_LICENSE_PACKAGE_PATH,
			description: "ag-psd MIT license and upstream image/brush ownership notice."
		},
		{
			id: `${rendererId}-base64-js-license`,
			rendererId,
			kind: "license",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_BASE64_JS_LICENSE_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_BASE64_JS_LICENSE_PACKAGE_PATH,
			description: "base64-js MIT license text for the dependency bundled through ag-psd."
		},
		{
			id: `${rendererId}-pako-license`,
			rendererId,
			kind: "license",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_PAKO_LICENSE_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_PAKO_LICENSE_PACKAGE_PATH,
			description: "pako MIT license text for the dependency bundled through ag-psd."
		}
	];
	if (includeWebtoonPsd) assets.push({
		id: `${rendererId}-webtoon-psd-license`,
		rendererId,
		kind: "license",
		target: "public",
		required: true,
		defaultPath: DEFAULT_FILE_VIEWER_DESIGN_WEBTOON_PSD_LICENSE_PATH,
		packagePath: DEFAULT_FILE_VIEWER_DESIGN_WEBTOON_PSD_LICENSE_PACKAGE_PATH,
		description: "@webtoon/psd MIT license text for the bundled PSB parser."
	});
	return assets;
};
var DEFAULT_FILE_VIEWER_RENDERER_ASSET_MANIFESTS = [
	{
		rendererId: "chm",
		assets: [
			{
				id: "chm-worker",
				rendererId: "chm",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CHM_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_CHM_WORKER_PACKAGE_PATH,
				optionPath: "chm.workerUrl",
				description: "Module Worker that isolates Rust/WASM CHM parsing, LZX decompression, search and virtual-file access."
			},
			{
				id: "chm-wasm-module",
				rendererId: "chm",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PACKAGE_PATH,
				optionPath: "chm.wasmModuleUrl",
				description: "wasm-bindgen ES module loader for the browser-local Rust CHM engine."
			},
			{
				id: "chm-wasm",
				rendererId: "chm",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CHM_WASM_PATH,
				packagePath: DEFAULT_FILE_VIEWER_CHM_WASM_PACKAGE_PATH,
				optionPath: "chm.wasmUrl",
				description: "Rust WebAssembly engine for bounded ITSF/ITSP parsing and LZX decompression."
			}
		]
	},
	{
		rendererId: "model",
		assets: [
			{
				id: "model-occt-worker",
				rendererId: "model",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_MODEL_WORKER_URL,
				optionPath: "model.workerUrl",
				description: "File Viewer worker that runs STEP, IGES, and BREP tessellation off the UI thread."
			},
			{
				id: "model-occt-runtime",
				rendererId: "model",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_MODEL_RUNTIME_URL,
				packagePath: DEFAULT_FILE_VIEWER_MODEL_RUNTIME_PACKAGE_PATH,
				optionPath: "model.runtimeUrl",
				description: "Self-hosted occt-import-js runtime for browser-native STEP, IGES, and BREP preview."
			},
			{
				id: "model-occt-wasm",
				rendererId: "model",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_MODEL_WASM_URL,
				packagePath: DEFAULT_FILE_VIEWER_MODEL_WASM_PACKAGE_PATH,
				optionPath: "model.wasmUrl",
				description: "OpenCascade WebAssembly geometry kernel used by the model renderer."
			},
			{
				id: "model-occt-license",
				rendererId: "model",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_MODEL_OCCT_LICENSE_URL,
				packagePath: DEFAULT_FILE_VIEWER_MODEL_OCCT_LICENSE_PACKAGE_PATH,
				description: "OpenCascade license notice distributed with the browser geometry kernel."
			},
			{
				id: "model-occt-import-license",
				rendererId: "model",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_MODEL_IMPORT_LICENSE_URL,
				packagePath: DEFAULT_FILE_VIEWER_MODEL_IMPORT_LICENSE_PACKAGE_PATH,
				description: "occt-import-js license notice distributed with the browser geometry kernel."
			}
		]
	},
	{
		rendererId: "drawing",
		assets: [{
			id: "drawio-viewer-script",
			rendererId: "drawing",
			kind: "script",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DRAWIO_VIEWER_SCRIPT_PATH,
			optionPath: "drawing.viewerScriptUrl",
			description: "Official diagrams.net viewer-static.min.js self-hosted for offline Draw.io rendering."
		}, {
			id: "drawio-offline-assets",
			rendererId: "drawing",
			kind: "directory",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DRAWIO_ASSET_PATH,
			description: "Official diagrams.net styles, shapes, stencils, images, mxGraph and math assets for offline rendering."
		}]
	},
	{
		rendererId: "pdf",
		assets: [
			{
				id: "pdf-worker",
				rendererId: "pdf",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PDF_WORKER_PATH,
				optionPath: "pdf.workerUrl",
				description: "PDF.js module worker copied into viewer assets for offline PDF rendering."
			},
			{
				id: "pdf-cmaps",
				rendererId: "pdf",
				kind: "directory",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PDF_CMAP_PATH,
				optionPath: "pdf.cMapUrl",
				description: "PDF.js packed CMaps used for CJK and embedded text decoding."
			},
			{
				id: "pdf-wasm",
				rendererId: "pdf",
				kind: "wasm-directory",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PDF_WASM_PATH,
				optionPath: "pdf.wasmUrl",
				description: "PDF.js WebAssembly helpers for image decoding and fully self-hosted PDF rendering."
			},
			{
				id: "pdf-standard-fonts",
				rendererId: "pdf",
				kind: "directory",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PDF_STANDARD_FONT_PATH,
				optionPath: "pdf.standardFontDataUrl",
				description: "PDF.js standard font data used when PDF files reference base fonts."
			},
			{
				id: "pdf-cjk-font-fallback",
				rendererId: "pdf",
				kind: "directory",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PDF_CJK_FONT_FALLBACK_PATH,
				optionPath: "pdf.cjkFontFallbackPath",
				description: "Self-hosted Noto Sans SC variable font shards used for missing unembedded CJK fonts."
			}
		]
	},
	{
		rendererId: "archive",
		assets: [{
			id: "libarchive-worker",
			rendererId: "archive",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_ARCHIVE_WORKER_PATH,
			optionPath: "archive.workerUrl",
			description: "libarchive.js module worker used for broad archive format parsing."
		}, {
			id: "libarchive-wasm",
			rendererId: "archive",
			kind: "wasm",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_ARCHIVE_WASM_PATH,
			optionPath: "archive.wasmUrl",
			description: "libarchive.js WebAssembly module expected next to the public worker."
		}]
	},
	{
		rendererId: "cad",
		assets: [
			{
				id: "cad-wasm-directory",
				rendererId: "cad",
				kind: "wasm-directory",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CAD_WASM_PATH,
				optionPath: "cad.wasmPath",
				description: "@flyfish-dev/cad-viewer WebAssembly directory for DWG/DXF helpers."
			},
			{
				id: "cad-dwg-worker",
				rendererId: "cad",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CAD_WORKER_PATH,
				optionPath: "cad.workerUrl",
				description: "DWG worker entry used by @flyfish-dev/cad-viewer."
			},
			{
				id: "cad-dwf-wasm",
				rendererId: "cad",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CAD_DWF_WASM_PATH,
				optionPath: "cad.dwfWasmUrl",
				description: "DWF/DWFx/XPS raster WebAssembly module used by @flyfish-dev/cad-viewer."
			},
			{
				id: "cad-libredwg-script",
				rendererId: "cad",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CAD_LIBREDWG_SCRIPT_PATH,
				description: "LibreDWG JavaScript runtime loaded by the CAD DWG worker for offline parsing."
			},
			{
				id: "cad-libredwg-wasm",
				rendererId: "cad",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_CAD_LIBREDWG_WASM_PATH,
				description: "LibreDWG WebAssembly runtime loaded by the CAD DWG worker for offline parsing."
			},
			{
				id: "cad-compat-0-8-0-wasm-directory",
				rendererId: "cad",
				kind: "wasm-directory",
				target: "public",
				required: true,
				defaultPath: `wasm/cad/${COMPATIBILITY_FILE_VIEWER_CAD_RUNTIME_VERSION}/`,
				description: "Legacy @flyfish-dev/cad-viewer 0.8.0 directory kept for full-package path compatibility."
			},
			{
				id: "cad-compat-0-8-0-dwg-worker",
				rendererId: "cad",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: `wasm/cad/${COMPATIBILITY_FILE_VIEWER_CAD_RUNTIME_VERSION}/dwg-worker.js`,
				description: "Legacy CAD 0.8.0 DWG worker kept for full-package path compatibility."
			},
			{
				id: "cad-compat-0-8-0-dwf-wasm",
				rendererId: "cad",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: `wasm/cad/${COMPATIBILITY_FILE_VIEWER_CAD_RUNTIME_VERSION}/dwfv-render.wasm`,
				description: "Legacy CAD 0.8.0 DWF runtime kept for full-package path compatibility."
			},
			{
				id: "cad-compat-0-8-0-libredwg-script",
				rendererId: "cad",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: `wasm/cad/${COMPATIBILITY_FILE_VIEWER_CAD_RUNTIME_VERSION}/libredwg-web.js`,
				description: "Legacy CAD 0.8.0 LibreDWG script kept for full-package path compatibility."
			},
			{
				id: "cad-compat-0-8-0-libredwg-wasm",
				rendererId: "cad",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: `wasm/cad/${COMPATIBILITY_FILE_VIEWER_CAD_RUNTIME_VERSION}/libredwg-web.wasm`,
				description: "Legacy CAD 0.8.0 LibreDWG WebAssembly runtime kept for full-package path compatibility."
			},
			{
				id: "cad-legacy-dwg-worker",
				rendererId: "cad",
				kind: "worker",
				target: "public",
				required: false,
				defaultPath: "wasm/cad/dwg-worker.js",
				description: "Unversioned compatibility alias for deployments that explicitly configured the former DWG worker path."
			},
			{
				id: "cad-legacy-dwf-wasm",
				rendererId: "cad",
				kind: "wasm",
				target: "public",
				required: false,
				defaultPath: "wasm/cad/dwfv-render.wasm",
				description: "Unversioned compatibility alias for deployments that explicitly configured the former DWF runtime path."
			},
			{
				id: "cad-legacy-libredwg-script",
				rendererId: "cad",
				kind: "script",
				target: "public",
				required: false,
				defaultPath: "wasm/cad/libredwg-web.js",
				description: "Unversioned compatibility alias for the former LibreDWG JavaScript runtime path."
			},
			{
				id: "cad-legacy-libredwg-wasm",
				rendererId: "cad",
				kind: "wasm",
				target: "public",
				required: false,
				defaultPath: "wasm/cad/libredwg-web.wasm",
				description: "Unversioned compatibility alias for the former LibreDWG WebAssembly runtime path."
			}
		]
	},
	{
		rendererId: "office-word-openxml",
		assets: [{
			id: "docx-worker",
			rendererId: "office-word-openxml",
			kind: "worker",
			target: "public",
			required: false,
			defaultPath: DEFAULT_FILE_VIEWER_DOCX_WORKER_PATH,
			optionPath: "docx.workerUrl",
			description: "Optional @file-viewer/docx worker for off-main-thread DOCX ZIP/XML parsing."
		}, {
			id: "docx-worker-jszip",
			rendererId: "office-word-openxml",
			kind: "script",
			target: "public",
			required: false,
			defaultPath: DEFAULT_FILE_VIEWER_DOCX_WORKER_JSZIP_PATH,
			optionPath: "docx.workerJsZipUrl",
			description: "JSZip runtime loaded by the @file-viewer/docx worker for fully offline DOCX parsing."
		}]
	},
	{
		rendererId: "office-presentation-binary",
		assets: [
			{
				id: "ppt-module",
				rendererId: "office-presentation-binary",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PPT_MODULE_PATH,
				optionPath: "presentation.pptModuleUrl",
				description: "Official @file-viewer/ppt 0.3 browser entry for PowerPoint 97–2003 preview."
			},
			{
				id: "ppt-worker",
				rendererId: "office-presentation-binary",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PPT_WORKER_PATH,
				optionPath: "presentation.pptWorkerUrl",
				description: "Official @file-viewer/ppt 0.3 module Worker."
			},
			{
				id: "ppt-frame-cache",
				rendererId: "office-presentation-binary",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PPT_FRAME_CACHE_PATH,
				description: "Bounded IndexedDB frame cache imported by the binary-PPT Worker."
			},
			{
				id: "ppt-wasm",
				rendererId: "office-presentation-binary",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PPT_WASM_PATH,
				optionPath: "presentation.pptWasmUrl",
				description: "Official @file-viewer/ppt 0.3 native WebAssembly parser and renderer."
			},
			{
				id: "ppt-cjk-font",
				rendererId: "office-presentation-binary",
				kind: "font",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_PPT_FONT_PATH,
				optionPath: "presentation.pptFontUrl",
				description: "CJK font pack verified and loaded by the binary-PPT runtime."
			},
			{
				id: "ppt-runtime-manifest",
				rendererId: "office-presentation-binary",
				kind: "metadata",
				target: "public",
				required: true,
				defaultPath: `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/manifest.json`,
				description: "Integrity and edition metadata for the official binary-PPT runtime."
			},
			{
				id: "ppt-runtime-package",
				rendererId: "office-presentation-binary",
				kind: "metadata",
				target: "public",
				required: true,
				defaultPath: `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/package.json`,
				description: "Package identity metadata for the official binary-PPT runtime."
			},
			{
				id: "ppt-runtime-license",
				rendererId: "office-presentation-binary",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/LICENSE`,
				description: "License shipped by the independently versioned @file-viewer/ppt package."
			},
			{
				id: "ppt-runtime-notice",
				rendererId: "office-presentation-binary",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: `${DEFAULT_FILE_VIEWER_PPT_RUNTIME_PATH}/NOTICE`,
				description: "Notices shipped by the independently versioned @file-viewer/ppt package."
			}
		]
	},
	{
		rendererId: "office-presentation",
		assets: [{
			id: "pptx-worker",
			rendererId: "office-presentation",
			kind: "worker",
			target: "public",
			required: false,
			defaultPath: DEFAULT_FILE_VIEWER_PRESENTATION_WORKER_PATH,
			optionPath: "presentation.workerUrl",
			description: "Optional @file-viewer/pptx worker for stable PPTX parsing in IIFE, CDN, and offline deployments."
		}]
	},
	{
		rendererId: "spreadsheet-openxml",
		assets: [{
			id: "spreadsheet-worker",
			rendererId: "spreadsheet-openxml",
			kind: "worker",
			target: "public",
			required: false,
			defaultPath: DEFAULT_FILE_VIEWER_SPREADSHEET_WORKER_PATH,
			optionPath: "spreadsheet.workerUrl",
			description: "Optional Spreadsheet worker for off-main-thread styled-exceljs workbook parsing."
		}]
	},
	...[
		"apple-pages",
		"apple-numbers",
		"apple-keynote"
	].map((rendererId) => ({
		rendererId,
		assets: [{
			id: `${rendererId}-iwork-worker`,
			rendererId,
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_IWORK_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_IWORK_WORKER_PACKAGE_PATH,
			optionPath: "iwork.workerUrl",
			description: "Module Worker for bounded ZIP, Snappy, IWA/Protobuf and iWork 09 XML/APXL parsing."
		}]
	})),
	{
		rendererId: "office-hangul",
		assets: [{
			id: "hangul-worker",
			rendererId: "office-hangul",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_HANGUL_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_HANGUL_WORKER_PACKAGE_PATH,
			optionPath: "hangul.workerUrl",
			description: "Module Worker for bounded HWP v5 CFB and HWPX ZIP/XML parsing."
		}]
	},
	{
		rendererId: "office-wordperfect",
		assets: [
			{
				id: "wordperfect-worker",
				rendererId: "office-wordperfect",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_WORDPERFECT_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_WORDPERFECT_WORKER_PACKAGE_PATH,
				optionPath: "wordPerfect.workerUrl",
				description: "Module Worker for bounded WordPerfect signature detection and parsing."
			},
			{
				id: "wordperfect-libwpd-wasm",
				rendererId: "office-wordperfect",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_WORDPERFECT_WASM_PATH,
				packagePath: DEFAULT_FILE_VIEWER_WORDPERFECT_WASM_PACKAGE_PATH,
				optionPath: "wordPerfect.wasmUrl",
				description: "MPL-2.0 libwpd/librevenge WebAssembly parser lazy-loaded by the WordPerfect Worker."
			},
			{
				id: "wordperfect-libwpd-module",
				rendererId: "office-wordperfect",
				kind: "script",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_WORDPERFECT_MODULE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_WORDPERFECT_MODULE_PACKAGE_PATH,
				description: "Emscripten ES module loader for the MPL-2.0 libwpd/librevenge WebAssembly runtime."
			}
		]
	},
	{
		rendererId: "typst",
		assets: [
			{
				id: "typst-compiler-wasm",
				rendererId: "typst",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_URL,
				packagePath: DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_PACKAGE_PATH,
				optionPath: "typst.compilerWasmUrl",
				description: "Typst compiler WebAssembly module copied to the public assets directory."
			},
			{
				id: "typst-renderer-wasm",
				rendererId: "typst",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_URL,
				packagePath: DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_PACKAGE_PATH,
				optionPath: "typst.rendererWasmUrl",
				description: "Typst SVG renderer WebAssembly module copied to the public assets directory."
			},
			{
				id: "typst-font-assets",
				rendererId: "typst",
				kind: "directory",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_TYPST_FONT_ASSETS_URL,
				optionPath: "typst.fontAssetsUrl",
				description: "Self-hosted default Typst text fonts used by typst.ts without public CDN requests."
			}
		]
	},
	{
		rendererId: "illustrator-pdf-design",
		assets: [
			...createDesignThirdPartyAssets("illustrator-pdf-design"),
			{
				id: "illustrator-pgf-license",
				rendererId: "illustrator-pdf-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_ILLUSTRATOR_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_ILLUSTRATOR_LICENSE_PACKAGE_PATH,
				description: "illustrator-pgf MIT license text for the bundled native Illustrator Worker."
			},
			{
				id: "illustrator-pgf-worker",
				rendererId: "illustrator-pdf-design",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_ILLUSTRATOR_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_ILLUSTRATOR_WORKER_PACKAGE_PATH,
				optionPath: "design.illustratorWorkerUrl",
				description: "Terminable module Worker for bounded native Illustrator PGF/private-source parsing and Canvas rendering."
			},
			{
				id: "illustrator-zstd-license",
				rendererId: "illustrator-pdf-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_ILLUSTRATOR_ZSTD_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_ILLUSTRATOR_ZSTD_LICENSE_PACKAGE_PATH,
				description: "fzstd MIT license text for the bounded streaming zstd decoder bundled into the Illustrator Worker."
			}
		]
	},
	{
		rendererId: "photoshop-design",
		assets: [
			...createDesignThirdPartyAssets("photoshop-design"),
			...createPhotoshopWorkerLicenseAssets("photoshop-design", true),
			{
				id: "photoshop-design-worker",
				rendererId: "photoshop-design",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_DESIGN_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_DESIGN_WORKER_PACKAGE_PATH,
				optionPath: "design.workerUrl",
				description: "Module Worker for bounded PSD/PSB parsing and composite/layer pixel synthesis."
			}
		]
	},
	{
		rendererId: "photoshop-resource-design",
		assets: [
			...createDesignThirdPartyAssets("photoshop-resource-design"),
			...createPhotoshopWorkerLicenseAssets("photoshop-resource-design"),
			{
				id: "photoshop-resource-worker",
				rendererId: "photoshop-resource-design",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_ADOBE_RESOURCE_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_ADOBE_RESOURCE_WORKER_PACKAGE_PATH,
				optionPath: "design.adobeResourceWorkerUrl",
				description: "Module Worker for bounded Photoshop ABR, CSH, PAT, GRD, and ASL resource parsing."
			}
		]
	},
	{
		rendererId: "adobe-palette-design",
		assets: [...createDesignThirdPartyAssets("adobe-palette-design", true), {
			id: "adobe-palette-container-worker",
			rendererId: "adobe-palette-design",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PACKAGE_PATH,
			optionPath: "design.containerWorkerUrl",
			description: "Terminable module Worker for bounded ASE and ACO palette parsing."
		}]
	},
	{
		rendererId: "indesign-exchange-design",
		assets: [...createDesignThirdPartyAssets("indesign-exchange-design", true), {
			id: "indesign-exchange-container-worker",
			rendererId: "indesign-exchange-design",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PACKAGE_PATH,
			optionPath: "design.containerWorkerUrl",
			description: "Terminable module Worker for bounded ICML, IDMS, and legacy INX parsing and layout-fragment reconstruction."
		}]
	},
	{
		rendererId: "adobe-animate-xfl-design",
		assets: [...createDesignThirdPartyAssets("adobe-animate-xfl-design", true), {
			id: "adobe-animate-xfl-container-worker",
			rendererId: "adobe-animate-xfl-design",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PACKAGE_PATH,
			optionPath: "design.containerWorkerUrl",
			description: "Terminable module Worker for bounded modern ZIP/XFL-based Animate FLA parsing and first-frame reconstruction."
		}]
	},
	{
		rendererId: "adobe-xd-design",
		assets: [...createDesignThirdPartyAssets("adobe-xd-design", true), {
			id: "adobe-xd-container-worker",
			rendererId: "adobe-xd-design",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PACKAGE_PATH,
			optionPath: "design.containerWorkerUrl",
			description: "Terminable module Worker for bounded XD package parsing and saved-preview extraction."
		}]
	},
	{
		rendererId: "indesign-native-design",
		assets: [...createDesignThirdPartyAssets("indesign-native-design", true), {
			id: "indesign-native-container-worker",
			rendererId: "indesign-native-design",
			kind: "worker",
			target: "public",
			required: true,
			defaultPath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH,
			packagePath: DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PACKAGE_PATH,
			optionPath: "design.containerWorkerUrl",
			description: "Terminable module Worker for bounded native INDD and INDT parsing."
		}]
	},
	{
		rendererId: "postscript-design",
		assets: [
			...createDesignThirdPartyAssets("postscript-design"),
			{
				id: "postscript-design-worker",
				rendererId: "postscript-design",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_WORKER_PACKAGE_PATH,
				optionPath: "design.postscriptWorkerUrl",
				description: "Terminable module Worker for bounded EPS/PostScript execution and page rasterization."
			},
			{
				id: "postscript-design-wasm",
				rendererId: "postscript-design",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_WASM_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_WASM_PACKAGE_PATH,
				optionPath: "design.postscriptWasmUrl",
				description: "License-safe Stet WebAssembly interpreter with OFL substitutes and no bundled CMYK ICC profile."
			},
			{
				id: "postscript-design-license-stet-apache",
				rendererId: "postscript-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_APACHE_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_APACHE_LICENSE_PACKAGE_PATH,
				description: "Stet Apache-2.0 license text."
			},
			{
				id: "postscript-design-license-stet-mit",
				rendererId: "postscript-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_MIT_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_STET_MIT_LICENSE_PACKAGE_PATH,
				description: "Stet MIT license text."
			},
			{
				id: "postscript-design-license-carlito-ofl",
				rendererId: "postscript-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_CARLITO_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_CARLITO_LICENSE_PACKAGE_PATH,
				description: "Carlito SIL Open Font License 1.1 text."
			},
			{
				id: "postscript-design-license-tinos-ofl",
				rendererId: "postscript-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_TINOS_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_TINOS_LICENSE_PACKAGE_PATH,
				description: "Tinos SIL Open Font License 1.1 text."
			},
			{
				id: "postscript-design-license-cousine-ofl",
				rendererId: "postscript-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_COUSINE_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_COUSINE_LICENSE_PACKAGE_PATH,
				description: "Cousine SIL Open Font License 1.1 text."
			},
			{
				id: "postscript-design-license-noto-symbols-ofl",
				rendererId: "postscript-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_POSTSCRIPT_NOTO_SYMBOLS_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_POSTSCRIPT_NOTO_SYMBOLS_LICENSE_PACKAGE_PATH,
				description: "Noto Sans Symbols 2 SIL Open Font License 1.1 text."
			}
		]
	},
	{
		rendererId: "indesign-idml-design",
		assets: [
			...createDesignThirdPartyAssets("indesign-idml-design"),
			{
				id: "indesign-idml-worker",
				rendererId: "indesign-idml-design",
				kind: "worker",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_IDML_WORKER_PATH,
				packagePath: DEFAULT_FILE_VIEWER_IDML_WORKER_PACKAGE_PATH,
				optionPath: "design.idmlWorkerUrl",
				description: "Module Worker that validates IDML packages and renders pages outside the UI thread."
			},
			{
				id: "indesign-idml-wasm",
				rendererId: "indesign-idml-design",
				kind: "wasm",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_IDML_WASM_PATH,
				packagePath: DEFAULT_FILE_VIEWER_IDML_WASM_PACKAGE_PATH,
				optionPath: "design.idmlWasmUrl",
				description: "Self-hosted @paged-media/introspect-wasm CPU renderer used by the IDML Worker."
			},
			{
				id: "indesign-idml-license",
				rendererId: "indesign-idml-design",
				kind: "license",
				target: "public",
				required: true,
				defaultPath: DEFAULT_FILE_VIEWER_IDML_LICENSE_PATH,
				packagePath: DEFAULT_FILE_VIEWER_IDML_LICENSE_PACKAGE_PATH,
				description: "MPL-2.0 license text distributed with the IDML WebAssembly engine."
			}
		]
	},
	{
		rendererId: "data-asset",
		assets: [{
			id: "data-sql-wasm",
			rendererId: "data-asset",
			kind: "wasm",
			target: "public",
			required: false,
			defaultPath: DEFAULT_FILE_VIEWER_DATA_SQL_WASM_URL,
			packagePath: DEFAULT_FILE_VIEWER_DATA_SQL_WASM_PACKAGE_PATH,
			optionPath: "data.sqlWasmUrl",
			description: "sql.js WebAssembly module copied to the public assets directory for SQLite previews."
		}]
	}
];
var DEFAULT_FILE_VIEWER_DOCUMENT_BASE_URL = "file:///";
var resolveFileViewerAssetUrl = (value, fallback, options = {}) => {
	const raw = value ? String(value) : fallback;
	const documentBaseUrl = options.documentBaseUrl || DEFAULT_FILE_VIEWER_DOCUMENT_BASE_URL;
	const configuredBaseUrl = !value && configuredFileViewerAssetBaseUrl !== automaticFileViewerAssetBaseUrl ? configuredFileViewerAssetBaseUrl : void 0;
	const preferredBaseUrl = options.baseUrl || configuredBaseUrl;
	const baseUrl = preferredBaseUrl ? preferredBaseUrl.endsWith("/") ? preferredBaseUrl : `${preferredBaseUrl}/` : documentBaseUrl;
	const resolvedBase = preferredBaseUrl ? new URL(baseUrl, documentBaseUrl).href : baseUrl;
	const resolved = new URL(raw, resolvedBase).href;
	return options.trimTrailingSlash ? resolved.replace(/\/+$/, "") : resolved;
};
var resolveFileViewerArchiveWorkerUrl = (options, baseUrl) => {
	return resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_ARCHIVE_WORKER_PATH, { baseUrl });
};
var resolveFileViewerArchiveWasmUrl = (options, fallback = "", documentBaseUrl) => {
	if (!(options === null || options === void 0 ? void 0 : options.wasmUrl)) return fallback;
	return resolveFileViewerAssetUrl(options.wasmUrl, fallback || options.wasmUrl, { documentBaseUrl });
};
var resolveFileViewerCadAssetUrls = (options, documentBaseUrl) => {
	const workerUrl = resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_CAD_WORKER_PATH, { documentBaseUrl });
	const dwfWasmUrl = resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.dwfWasmUrl, DEFAULT_FILE_VIEWER_CAD_DWF_WASM_PATH, { documentBaseUrl });
	const versionDefaultRuntimeAsset = (url, overridden) => {
		if (overridden) return url;
		return `${url}${url.includes("?") ? "&" : "?"}file-viewer-cad=${encodeURIComponent(DEFAULT_FILE_VIEWER_CAD_RUNTIME_VERSION)}`;
	};
	return {
		wasmPath: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.wasmPath, DEFAULT_FILE_VIEWER_CAD_WASM_PATH, {
			documentBaseUrl,
			trimTrailingSlash: true
		}),
		workerUrl: versionDefaultRuntimeAsset(workerUrl, Boolean(options === null || options === void 0 ? void 0 : options.workerUrl)),
		dwfWasmUrl: versionDefaultRuntimeAsset(dwfWasmUrl, Boolean(options === null || options === void 0 ? void 0 : options.dwfWasmUrl))
	};
};
var resolveFileViewerPdfAssetUrls = (options, documentBaseUrl) => {
	const rawAssetBaseUrl = (options === null || options === void 0 ? void 0 : options.assetBaseUrl) ? String(options.assetBaseUrl) : "";
	const assetBaseUrl = rawAssetBaseUrl ? new URL(rawAssetBaseUrl.endsWith("/") ? rawAssetBaseUrl : `${rawAssetBaseUrl}/`, documentBaseUrl || DEFAULT_FILE_VIEWER_DOCUMENT_BASE_URL).href : documentBaseUrl;
	return {
		workerUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_PDF_WORKER_PATH, { documentBaseUrl: assetBaseUrl }),
		cMapUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.cMapUrl, DEFAULT_FILE_VIEWER_PDF_CMAP_PATH, { documentBaseUrl: assetBaseUrl }),
		wasmUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.wasmUrl, DEFAULT_FILE_VIEWER_PDF_WASM_PATH, { documentBaseUrl: assetBaseUrl }),
		standardFontDataUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.standardFontDataUrl, DEFAULT_FILE_VIEWER_PDF_STANDARD_FONT_PATH, { documentBaseUrl: assetBaseUrl }),
		cjkFontFallbackPath: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.cjkFontFallbackPath, DEFAULT_FILE_VIEWER_PDF_CJK_FONT_FALLBACK_PATH, { documentBaseUrl: assetBaseUrl })
	};
};
var resolveFileViewerDrawioViewerScriptUrl = (options, documentBaseUrl) => {
	return resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.viewerScriptUrl, DEFAULT_FILE_VIEWER_DRAWIO_VIEWER_SCRIPT_PATH, { documentBaseUrl });
};
var resolveFileViewerDocxWorkerUrl = (options, documentBaseUrl) => {
	const resolved = resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_DOCX_WORKER_PATH, { documentBaseUrl });
	if (options === null || options === void 0 ? void 0 : options.workerUrl) return resolved;
	return `${resolved}${resolved.includes("?") ? "&" : "?"}file-viewer-docx=${encodeURIComponent(DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION)}`;
};
var resolveFileViewerDocxWorkerJsZipUrl = (options, documentBaseUrl) => {
	const resolved = resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerJsZipUrl, DEFAULT_FILE_VIEWER_DOCX_WORKER_JSZIP_PATH, { documentBaseUrl });
	if (options === null || options === void 0 ? void 0 : options.workerJsZipUrl) return resolved;
	return `${resolved}${resolved.includes("?") ? "&" : "?"}file-viewer-docx=${encodeURIComponent(DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION)}`;
};
var resolveFileViewerSpreadsheetWorkerUrl = (options, documentBaseUrl) => {
	return resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_SPREADSHEET_WORKER_PATH, { documentBaseUrl });
};
var resolveFileViewerIworkWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_IWORK_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerHangulWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_HANGUL_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerWordPerfectWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_WORDPERFECT_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerWordPerfectWasmUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.wasmUrl, DEFAULT_FILE_VIEWER_WORDPERFECT_WASM_PATH, { documentBaseUrl });
var resolveFileViewerChmWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_CHM_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerChmWasmModuleUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.wasmModuleUrl, DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH, { documentBaseUrl });
var resolveFileViewerChmWasmUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.wasmUrl, DEFAULT_FILE_VIEWER_CHM_WASM_PATH, { documentBaseUrl });
var resolveFileViewerPresentationWorkerUrl = (options, documentBaseUrl) => {
	return resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_PRESENTATION_WORKER_PATH, { documentBaseUrl });
};
var resolveFileViewerTypstCompilerWasmUrl = (options, overrides = [], documentBaseUrl) => {
	return resolveFileViewerAssetUrl((options === null || options === void 0 ? void 0 : options.compilerWasmUrl) || overrides.find(Boolean), DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_URL, { documentBaseUrl });
};
var resolveFileViewerTypstRendererWasmUrl = (options, overrides = [], documentBaseUrl) => {
	return resolveFileViewerAssetUrl((options === null || options === void 0 ? void 0 : options.rendererWasmUrl) || overrides.find(Boolean), DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_URL, { documentBaseUrl });
};
var resolveFileViewerTypstFontAssetsUrl = (options, overrides = [], documentBaseUrl) => {
	return resolveFileViewerAssetUrl((options === null || options === void 0 ? void 0 : options.fontAssetsUrl) || overrides.find(Boolean), DEFAULT_FILE_VIEWER_TYPST_FONT_ASSETS_URL, {
		documentBaseUrl,
		trimTrailingSlash: true
	});
};
var resolveFileViewerDataSqlWasmUrl = (options, overrides = [], documentBaseUrl) => {
	return resolveFileViewerAssetUrl((options === null || options === void 0 ? void 0 : options.sqlWasmUrl) || overrides.find(Boolean), DEFAULT_FILE_VIEWER_DATA_SQL_WASM_URL, { documentBaseUrl });
};
var resolveFileViewerDesignWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_DESIGN_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerIllustratorWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.illustratorWorkerUrl, DEFAULT_FILE_VIEWER_ILLUSTRATOR_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerDesignContainerWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.containerWorkerUrl, DEFAULT_FILE_VIEWER_DESIGN_CONTAINER_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerAdobeResourceWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.adobeResourceWorkerUrl, DEFAULT_FILE_VIEWER_ADOBE_RESOURCE_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerPostscriptWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.postscriptWorkerUrl, DEFAULT_FILE_VIEWER_POSTSCRIPT_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerPostscriptWasmUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.postscriptWasmUrl, DEFAULT_FILE_VIEWER_POSTSCRIPT_WASM_PATH, { documentBaseUrl });
var resolveFileViewerIdmlWorkerUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.idmlWorkerUrl, DEFAULT_FILE_VIEWER_IDML_WORKER_PATH, { documentBaseUrl });
var resolveFileViewerIdmlWasmUrl = (options, documentBaseUrl) => resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.idmlWasmUrl, DEFAULT_FILE_VIEWER_IDML_WASM_PATH, { documentBaseUrl });
var resolveFileViewerModelAssetUrls = (options, documentBaseUrl) => ({
	workerUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.workerUrl, DEFAULT_FILE_VIEWER_MODEL_WORKER_URL, { documentBaseUrl }),
	runtimeUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.runtimeUrl, DEFAULT_FILE_VIEWER_MODEL_RUNTIME_URL, { documentBaseUrl }),
	wasmUrl: resolveFileViewerAssetUrl(options === null || options === void 0 ? void 0 : options.wasmUrl, DEFAULT_FILE_VIEWER_MODEL_WASM_URL, { documentBaseUrl })
});
var getFileViewerRendererAssetManifest = (rendererId) => {
	return DEFAULT_FILE_VIEWER_RENDERER_ASSET_MANIFESTS.find((manifest) => manifest.rendererId === rendererId) || null;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/registry/formats.generated.js
var DEFAULT_RENDERER_DEFINITIONS = [
	{
		"id": "office-word-openxml",
		"label": "Word OpenXML",
		"category": "office",
		"extensions": [
			"docx",
			"docm",
			"dotx",
			"dotm"
		],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-word",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["OOXML Transitional", "OOXML Strict"],
		"knownLimits": ["VBA is never executed"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "office-word-binary",
		"label": "Word Binary",
		"category": "office",
		"extensions": ["doc", "dot"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-word",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["Word 97-2003 Binary"],
		"knownLimits": ["Macros are never executed"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "office-presentation-binary",
		"label": "PowerPoint 97–2003",
		"category": "office",
		"extensions": ["ppt", "pot"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-ppt",
		"presets": ["office", "all"],
		"containerVersions": ["PowerPoint 97-2003 Binary"],
		"knownLimits": ["Embedded engine watermark is retained", "Macros are never executed"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": false
		}
	},
	{
		"id": "office-presentation",
		"label": "PowerPoint OpenXML",
		"category": "office",
		"extensions": [
			"pptx",
			"pptm",
			"potx",
			"potm",
			"ppsx",
			"ppsm"
		],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-pptx",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["OOXML Transitional", "OOXML Strict"],
		"knownLimits": ["Macros and external programs are never executed"],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "open-document",
		"label": "Open Document",
		"category": "office",
		"extensions": [
			"rtf",
			"odt",
			"odp"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-word",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["RTF", "OpenDocument"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "spreadsheet-openxml",
		"label": "Spreadsheet",
		"category": "office",
		"extensions": [
			"xlsx",
			"xltx",
			"xlsm",
			"xlsb",
			"xls",
			"xlt",
			"xla",
			"xlam",
			"xltm",
			"csv",
			"tsv",
			"ods",
			"fods"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-spreadsheet",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": [
			"OOXML",
			"BIFF",
			"OpenDocument",
			"Delimited text"
		],
		"knownLimits": ["VBA and add-in code are never executed", "Formula results are read from the saved workbook cache"],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "apple-pages",
		"label": "Apple Pages",
		"category": "office",
		"extensions": ["pages"],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-iwork",
		"presets": ["office", "all"],
		"containerVersions": ["iWork '09 index.xml(.gz)", "iWork 2013+ IWA"],
		"knownLimits": ["Static preview only", "Encrypted iwpv2 files are detected but not decrypted"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "apple-numbers",
		"label": "Apple Numbers",
		"category": "office",
		"extensions": ["numbers"],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-iwork",
		"presets": ["office", "all"],
		"containerVersions": ["iWork '09 index.xml", "iWork 2013+ IWA"],
		"knownLimits": ["Formula results are read from the saved document cache", "Encrypted iwpv2 files are detected but not decrypted"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "apple-keynote",
		"label": "Apple Keynote",
		"category": "office",
		"extensions": ["key"],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-iwork",
		"presets": ["office", "all"],
		"containerVersions": ["iWork '09 index.apxl", "iWork 2013+ IWA"],
		"knownLimits": ["Animations, transitions and video playback are not executed", "Encrypted iwpv2 files are detected but not decrypted"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "office-wordperfect",
		"label": "WordPerfect",
		"category": "office",
		"extensions": [
			"wpd",
			"wp",
			"wp5",
			"wp6"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-wordperfect",
		"presets": ["office", "all"],
		"containerVersions": [
			"WordPerfect 4.2",
			"WordPerfect 5.x",
			"WordPerfect 6+"
		],
		"knownLimits": [
			"Macros are never executed",
			".wp5 and .wp6 are routing aliases for genuine WP5/WP6 payloads, not separate container formats",
			"Pagination and unsupported embedded objects are presented as structured static preview"
		],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "spreadsheet-dbf",
		"label": "dBASE Table",
		"category": "office",
		"extensions": ["dbf"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-spreadsheet",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["dBASE III/IV", "Visual FoxPro"],
		"knownLimits": ["Missing DBT/FPT memo sidecars are reported as incomplete"],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "pdf",
		"label": "PDF",
		"category": "document",
		"extensions": ["pdf"],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-pdf",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["PDF"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": "provider"
		}
	},
	{
		"id": "ofd",
		"label": "OFD",
		"category": "document",
		"extensions": ["ofd"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-ofd",
		"presets": [
			"standard",
			"office",
			"all"
		],
		"containerVersions": ["OFD"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "office-hangul",
		"label": "Hancom Hangul",
		"category": "office",
		"extensions": ["hwp", "hwpx"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-hangul",
		"presets": ["office", "all"],
		"containerVersions": ["HWP v5 CFB", "HWPX ZIP/XML"],
		"knownLimits": [
			"Encrypted, DRM-protected and distribution documents are detected but not decrypted",
			"Charts, OLE objects and advanced drawing effects remain limited in the static structured preview",
			"HWP v5 pagination is approximated when the binary producer omits usable page geometry"
		],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "typst",
		"label": "Typst",
		"category": "document",
		"extensions": ["typ", "typst"],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-typst",
		"presets": ["all"],
		"containerVersions": ["Typst source"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "archive",
		"label": "Archive",
		"category": "archive",
		"extensions": [
			"zip",
			"zipx",
			"7z",
			"rar",
			"tar",
			"gz",
			"gzip",
			"tgz",
			"bz2",
			"bzip2",
			"tbz",
			"tbz2",
			"xz",
			"txz",
			"lzma",
			"zst",
			"tzst",
			"cab",
			"ar",
			"cpio",
			"iso",
			"xar",
			"lha",
			"lzh",
			"jar",
			"war",
			"ear",
			"apk",
			"cbz",
			"cbr"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-archive",
		"presets": ["standard", "all"],
		"containerVersions": ["libarchive-supported containers"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "chm",
		"label": "Compiled HTML Help",
		"category": "ebook",
		"extensions": ["chm"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-chm",
		"presets": ["all"],
		"containerVersions": ["Microsoft HTML Help ITSF v2/v3", "LZX MSCompressed and uncompressed content"],
		"knownLimits": ["ActiveX, Shortcut/WinHelp commands, scripts and external network resources are intentionally blocked", "Merged help collections require each referenced CHM file to be opened separately"],
		"capabilities": {
			"download": true,
			"print": "adapter",
			"exportHtml": "adapter",
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "email",
		"label": "Email",
		"category": "email",
		"extensions": [
			"eml",
			"msg",
			"mbox"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-email",
		"presets": ["standard", "all"],
		"containerVersions": [
			"MIME",
			"Outlook MSG",
			"mbox"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "eda",
		"label": "EDA",
		"category": "eda",
		"extensions": [
			"olb",
			"dra",
			"gds",
			"oas",
			"oasis"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-eda",
		"presets": ["engineering", "all"],
		"containerVersions": [
			"OrCAD",
			"GDSII",
			"OASIS"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "cad",
		"label": "CAD",
		"category": "cad",
		"extensions": [
			"dxf",
			"dwg",
			"dwf",
			"dwfx",
			"xps"
		],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-cad",
		"presets": ["engineering", "all"],
		"containerVersions": [
			"DWG",
			"DXF",
			"DWF",
			"DWFX/XPS"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": false
		}
	},
	{
		"id": "model",
		"label": "3D Model",
		"category": "model",
		"extensions": [
			"glb",
			"gltf",
			"obj",
			"stl",
			"ply",
			"fbx",
			"dae",
			"3ds",
			"3mf",
			"amf",
			"usd",
			"usda",
			"usdc",
			"usdz",
			"kmz",
			"step",
			"stp",
			"iges",
			"igs",
			"ifc",
			"3dm",
			"brep",
			"pcd",
			"wrl",
			"vrml",
			"xyz",
			"vtk",
			"vtp"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-3d",
		"presets": ["engineering", "all"],
		"containerVersions": [
			"Mesh",
			"CAD exchange",
			"scene"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": "provider",
			"search": false
		}
	},
	{
		"id": "geo",
		"label": "Geospatial",
		"category": "geo",
		"extensions": [
			"geojson",
			"kml",
			"gpx",
			"shp"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-geo",
		"presets": ["engineering", "all"],
		"containerVersions": [
			"GeoJSON",
			"KML",
			"GPX",
			"Shapefile"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "drawing",
		"label": "Drawing",
		"category": "drawing",
		"extensions": [
			"excalidraw",
			"drawio",
			"dio",
			"mermaid",
			"mmd",
			"plantuml",
			"puml"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-drawing",
		"presets": ["all"],
		"containerVersions": [
			"Draw.io",
			"Excalidraw",
			"Mermaid",
			"PlantUML"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "bpmn",
		"label": "BPMN 2.0",
		"category": "drawing",
		"extensions": ["bpmn"],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-drawing",
		"presets": [],
		"containerVersions": ["BPMN 2.0 XML with BPMN DI"],
		"knownLimits": [
			"Explicit opt-in with bpmn-js",
			"Diagram preview requires BPMN DI layout; source remains available without it",
			"Read-only preview; process scripts are never executed",
			"The bpmn.io watermark is retained under the upstream license"
		],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": "provider",
			"search": false
		}
	},
	{
		"id": "mindmap",
		"label": "Mind Map",
		"category": "mindmap",
		"extensions": ["xmind"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-mindmap",
		"presets": ["all"],
		"containerVersions": ["XMind"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "epub",
		"label": "EPUB",
		"category": "ebook",
		"extensions": ["epub"],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-epub",
		"presets": ["all"],
		"containerVersions": ["EPUB 2", "EPUB 3"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": true,
			"zoom": false,
			"search": "provider"
		}
	},
	{
		"id": "ebook-fb2",
		"label": "FictionBook",
		"category": "ebook",
		"extensions": ["fb2"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-epub",
		"presets": ["all"],
		"containerVersions": ["FictionBook 2 XML"],
		"knownLimits": ["External network resources are not loaded"],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "umd",
		"label": "UMD",
		"category": "ebook",
		"extensions": ["umd"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-epub",
		"presets": ["all"],
		"containerVersions": ["UMD"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": true
		}
	},
	{
		"id": "image",
		"label": "Image",
		"category": "image",
		"extensions": [
			"gif",
			"jpg",
			"jpeg",
			"bmp",
			"tiff",
			"tif",
			"png",
			"svg",
			"webp",
			"avif",
			"ico",
			"heic",
			"heif",
			"jxl"
		],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-image",
		"presets": [
			"lite",
			"standard",
			"all"
		],
		"containerVersions": ["Raster", "SVG"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": "provider",
			"search": false
		}
	},
	{
		"id": "dicom",
		"label": "DICOM",
		"category": "medical-image",
		"extensions": ["dcm", "dicom"],
		"async": true,
		"supportLevel": "basic",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-dicom",
		"presets": [],
		"containerVersions": ["DICOM Part 10"],
		"knownLimits": ["Local single-file and multi-frame viewing only; series assembly, PACS/DICOMweb, MPR, segmentation, measurement tools, and diagnostic-use claims are not included", "Tested transfer syntaxes are Implicit/Explicit VR Little Endian, JPEG Lossless Process 14 SV1, JPEG-LS Lossless, and JPEG 2000 Lossless"],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": "provider",
			"search": false
		}
	},
	{
		"id": "signature",
		"label": "Digital signatures and evidence containers",
		"category": "cryptographic-container",
		"extensions": [
			"p7m",
			"p7s",
			"p7c",
			"p7b",
			"pkcs7",
			"cms",
			"cmsc",
			"tsd",
			"tst",
			"tsq",
			"tsr",
			"asics",
			"scs",
			"asice",
			"sce",
			"ers",
			"asc",
			"sig",
			"pgp",
			"gpg",
			"jws"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-signature",
		"presets": [],
		"containerVersions": [
			"CMS/PKCS#7",
			"CAdES attributes",
			"RFC 3161",
			"RFC 5544",
			"ASiC-S/E",
			"RFC 4998",
			"RFC 7515",
			"OpenPGP RFC 9580"
		],
		"knownLimits": [
			"Opt-in renderer; it is not added to the published preset-all/full compatibility closure",
			"Cryptographic checks are reported separately from certificate/key trust, policy, qualified-signature status and legal validity",
			"ASiC XML references and RFC 4998 renewal chains are structurally inspected; full XAdES and archival-policy validation are not claimed",
			"OpenPGP private-key operations and automatic decryption are intentionally excluded"
		],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	},
	{
		"id": "markdown",
		"label": "Markdown",
		"category": "markdown",
		"extensions": ["md", "markdown"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-text",
		"presets": [
			"lite",
			"standard",
			"all"
		],
		"containerVersions": ["CommonMark/GFM"],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "code",
		"label": "Code and Text",
		"category": "code",
		"extensions": [
			"txt",
			"json",
			"js",
			"mjs",
			"cjs",
			"css",
			"java",
			"py",
			"html",
			"htm",
			"jsx",
			"ts",
			"tsx",
			"xml",
			"log",
			"vue",
			"yaml",
			"yml",
			"ini",
			"sh",
			"bash",
			"sql",
			"go",
			"rs",
			"php",
			"c",
			"cpp",
			"cc",
			"h",
			"hpp",
			"cs",
			"diff",
			"patch",
			"bundle",
			"bdl",
			"jsonc",
			"json5",
			"ipynb",
			"toml",
			"proto",
			"hcl",
			"tex",
			"gv",
			"http",
			"react",
			"rb",
			"swift",
			"kt"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-text",
		"presets": [
			"lite",
			"standard",
			"all"
		],
		"containerVersions": [
			"Plain text",
			"source code",
			"Git bundle"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "video",
		"label": "Video",
		"category": "media",
		"extensions": [
			"mp4",
			"webm",
			"m3u8"
		],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-media",
		"presets": [
			"lite",
			"standard",
			"all"
		],
		"containerVersions": ["Browser media"],
		"knownLimits": ["Codec support follows the browser"],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	},
	{
		"id": "audio",
		"label": "Audio",
		"category": "media",
		"extensions": [
			"mp3",
			"mpeg",
			"wav",
			"ogg",
			"oga",
			"opus",
			"m4a",
			"aac",
			"flac",
			"weba",
			"midi",
			"mid"
		],
		"async": true,
		"supportLevel": "high-fidelity",
		"status": "stable",
		"packageName": "@file-viewer/renderer-media",
		"presets": [
			"lite",
			"standard",
			"all"
		],
		"containerVersions": ["Browser media", "MIDI"],
		"knownLimits": ["Codec support follows the browser"],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	},
	{
		"id": "photoshop-design",
		"label": "Adobe Photoshop",
		"category": "asset",
		"extensions": [
			"psb",
			"pdd",
			"psdt"
		],
		"async": true,
		"supportLevel": "experimental",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"enhancesRendererId": "data-asset",
		"enhancesExtensions": ["psd"],
		"containerVersions": ["PSD v1", "PSB v2"],
		"knownLimits": [
			"Pixel rendering is enabled only for 8-bit RGB and grayscale documents; unsupported color modes and bit depths are rejected instead of decoded incorrectly",
			"The untouched merged composite is the fidelity reference and must have been saved with Maximize Compatibility using Raw or PackBits RLE compression; ZIP composites are rejected",
			"Auxiliary channels are accepted only when PSD layer-info declares one merged-transparency channel; PSB currently requires exactly the base RGB or grayscale channels",
			"Embedded ICC profiles are detected but not color-converted yet, so profiled color is not reference-verified",
			"The PSD/PSB container version is taken from the 8BPS header; a mismatched filename extension is diagnosed and never used as the format authority",
			"Legacy PhotoDeluxe PDD and Photoshop template PSDT inputs are accepted only when the bytes validate as a PSD v1 8BPS container; unrelated files sharing those extensions are rejected",
			"PSD layer visibility is interactive only for flat normal-blend 100%-opacity documents without masks, effects, clipping, adjustments, groups, or resource-limit violations",
			"PSB currently exposes the saved composite and a read-only layer tree; interactive PSB layer recomposition is not claimed, and PSB files containing ZIP-compressed layer channels are rejected"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": false,
			"zoom": true,
			"search": false
		}
	},
	{
		"id": "illustrator-pdf-design",
		"label": "Adobe Illustrator AI/AIT",
		"category": "asset",
		"extensions": ["ait"],
		"async": true,
		"supportLevel": "experimental",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"enhancesRendererId": "data-asset",
		"enhancesExtensions": ["ai"],
		"containerVersions": ["Illustrator PDF-compatible AI/AIT", "Illustrator native PGF/private source"],
		"knownLimits": [
			"Automatic mode prefers the verified PDF-compatible surface for the highest saved appearance fidelity, while Native PGF mode parses the editable private source in a dedicated bounded Worker and exposes native artboards and layer visibility",
			"A PDF header alone is insufficient: the renderer also requires Illustrator-origin XMP, MIME, creator, or AIPrivateData evidence so an ordinary renamed PDF is not advertised as an Illustrator document",
			"The packaged browser Worker decodes uncompressed, deflate, and Illustrator 24 zstd private source entirely offline; zstd output is streamed through the same decoded-byte ceiling and unsupported long-distance frames fail explicitly",
			"Native PGF rendering currently preserves and reports unknown operators but does not claim complete Illustrator gradients, text shaping, placed or embedded images, plugins, effects, masks, blending, overprint, spot-color management, or font substitution fidelity",
			"The PDF renderer is required only for the saved PDF surface; native-only AI/AIT can open without it, and PDF pages or optional-content groups are not presented as native artboards or layers"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": false,
			"zoom": true,
			"search": true
		}
	},
	{
		"id": "indesign-idml-design",
		"label": "Adobe InDesign IDML",
		"category": "asset",
		"extensions": ["idml"],
		"async": true,
		"supportLevel": "experimental",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": ["IDML package", "@paged-media/introspect-wasm 0.63.0"],
		"knownLimits": [
			"Pages are rendered locally by the CPU WASM engine in a module Worker; the browser never uploads the IDML package",
			"ZIP64, encrypted, multi-disk, overlapping, unsafe-path, unsupported-compression, and configured expansion-limit packages are rejected before the WASM engine opens them",
			"The current engine page tree lists TextFrame and Rectangle objects only even though other supported objects may still appear in rendered page pixels",
			"Each page render rebuilds the upstream document internally; interactive requests are latest-wins, preview is lazy, and print-all is bounded by the configured total RGBA working-set limit"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": false,
			"zoom": true,
			"search": false
		}
	},
	{
		"id": "indesign-exchange-design",
		"label": "Adobe InCopy and InDesign Exchange",
		"category": "asset",
		"extensions": [
			"icml",
			"idms",
			"inx"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": [
			"ICML InCopyInterchange",
			"IDMS PageItem",
			"legacy INX"
		],
		"knownLimits": [
			"ICML is rendered as styled story content because the format does not carry a complete document page layout",
			"IDMS page-item paths, transforms, colors, stories, styles, layers, and linked-resource metadata are parsed in a terminable Worker and shown as a bounded layout-fragment preview; it is not advertised as a complete INDD page",
			"Legacy INX abbreviated records have no maintained browser layout engine; common page items and geometry are visualized while every unmapped element name remains visible in the structure inventory",
			"UTF-8, signature, DTD/entity, source size, node, depth, attribute, text, story, item, point, style, and color limits are enforced; linked resource paths are never fetched"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "adobe-animate-xfl-design",
		"label": "Adobe Animate XFL",
		"category": "asset",
		"extensions": ["fla", "xfl"],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": ["Modern compressed XFL-based FLA (CS5+)", "single DOMDocument XML XFL"],
		"knownLimits": [
			"Modern ZIP/XFL-based FLA is parsed in a terminable Worker; legacy binary FLA (Flash CS4 and earlier) is explicitly rejected",
			"The bounded first-frame preview reconstructs solid shapes, static text, nested symbols, and direct PNG/JPEG instances; masks, filters, tweens, ActionScript, audio/video playback, and proprietary bitmap .dat payloads remain structure-only",
			"A standard uncompressed .xfl is only a marker beside DOMDocument.xml, LIBRARY, and media folders; a single browser File object cannot access those siblings, so it must be packaged as FLA or supplied through a future folder/multi-file API",
			"ZIP64, encryption, multi-disk archives, overlapping records, unsafe or ambiguous paths, CRC failures, unsupported compression, DTD/entity XML, external XML stylesheets, and configured size/node/depth/ratio limits are rejected"
		],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	},
	{
		"id": "adobe-xd-design",
		"label": "Adobe XD Package",
		"category": "asset",
		"extensions": ["xd"],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": ["XD UCF package", "AGC JSON inventory"],
		"knownLimits": [
			"A terminable module Worker shows the highest-resolution structurally referenced embedded PNG/JPEG rendition and a bounded manifest, artboard, layer, and resource inventory",
			"Native AGC vector scene reconstruction is not implemented; files without a saved preview remain structure-only",
			"ZIP64, encrypted, multi-disk, overlapping, unsafe-path, CRC-invalid, unsupported-compression, and configured expansion-limit packages are rejected"
		],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	},
	{
		"id": "indesign-native-design",
		"label": "Adobe InDesign Native",
		"category": "asset",
		"extensions": ["indd", "indt"],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": [
			"InDesign 2+ native database",
			"INDD",
			"INDT"
		],
		"knownLimits": [
			"A terminable module Worker shows a JPEG/PNG preview only when it is embedded in a structurally verified contiguous XMP object",
			"The proprietary native layout database is not reconstructed; files without a saved XMP thumbnail remain metadata- or structure-only and should be exported to IDML for full page rendering",
			"The reader follows declared master-page and object boundaries and never scans arbitrary binary bytes for coincidental image signatures; legacy InDesign 1.x is rejected"
		],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	},
	{
		"id": "postscript-design",
		"label": "Adobe EPS and PostScript",
		"category": "asset",
		"extensions": ["ps"],
		"async": true,
		"supportLevel": "experimental",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"enhancesRendererId": "data-asset",
		"enhancesExtensions": ["eps"],
		"containerVersions": ["EPSF/DSC PostScript", "Adobe PostScript programs"],
		"knownLimits": [
			"Stet WASM renders pages in a terminable Worker with latest-wins interactive requests and bounded source size, VM memory, page count, dimensions, pixels, DPI, total print working set, and retained canvas cache",
			"The distributed runtime excludes upstream URW Base35 and Ghostscript CMYK ICC assets; Carlito, Tinos, Cousine, and Noto Sans Symbols 2 OFL substitutes plus the PLRM DeviceCMYK formula fallback can differ in metrics and color from Adobe applications",
			"This experimental path is not claimed to implement every Adobe PostScript Level 3 operator, font technology, color-management workflow, or printer device"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": false,
			"zoom": true,
			"search": false
		}
	},
	{
		"id": "adobe-palette-design",
		"label": "Adobe Color Palettes",
		"category": "asset",
		"extensions": ["ase", "aco"],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": ["ASE 1.x", "ACO v1/v2"],
		"knownLimits": [
			"ASE RGB, CMYK, Gray, and CIELAB colors and ACO RGB, HSB, CMYK, CIELAB, and Gray colors are parsed with strict bounds in a terminable module Worker",
			"Browser swatches convert CIELAB D50 and device CMYK to approximate sRGB; original model values remain visible for reference",
			"Unknown ASE blocks and bounded ACO trailing application data are skipped and reported rather than executed"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "photoshop-resource-design",
		"label": "Adobe Photoshop Resources and Presets",
		"category": "asset",
		"extensions": [
			"abr",
			"csh",
			"pat",
			"grd",
			"asl"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-design",
		"presets": [],
		"containerVersions": [
			"Photoshop ABR 6.x",
			"Photoshop CSH v2",
			"PAT v1",
			"GRD v5",
			"ASL v2",
			"ag-psd 31.0.2"
		],
		"knownLimits": [
			"ABR previews decode saved brush-tip alpha, embedded patterns, and bounded preset metadata; they do not simulate Photoshop's stroke engine, dynamics, or paint blending",
			"CSH previews reconstruct bounded Bezier path geometry; subtract, intersect, and exclude composition is exposed as metadata rather than claimed as Photoshop-equivalent raster output",
			"PAT previews decode bounded RGB, grayscale, indexed-color, alpha, Raw, and PackBits pattern tiles; unsupported image modes and compression variants fail closed",
			"GRD previews render saved solid color stops and deterministic bounded noise samples from v5 descriptors; they do not claim Photoshop's complete interpolation and color-management pipeline",
			"ASL previews expose bounded layer-effect descriptors, blend metadata, and embedded pattern thumbnails as a structure view; they do not rasterize Photoshop's full effect stack",
			"Legacy ABR variants before 6.x and unknown CSH container versions are rejected instead of being scanned heuristically"
		],
		"capabilities": {
			"download": true,
			"print": true,
			"exportHtml": false,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "data-asset",
		"label": "Data Asset",
		"category": "asset",
		"extensions": [
			"ttf",
			"otf",
			"woff",
			"woff2",
			"psd",
			"ai",
			"eps",
			"sqlite",
			"wasm",
			"parquet",
			"avro",
			"webarchive"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "stable",
		"packageName": "@file-viewer/renderer-data",
		"presets": ["all"],
		"containerVersions": [
			"Font",
			"design",
			"database",
			"binary data"
		],
		"knownLimits": [],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": true,
			"zoom": false,
			"search": true
		}
	},
	{
		"id": "binary-inspector",
		"label": "Binary Inspector",
		"category": "asset",
		"extensions": [
			"bin",
			"hex",
			"elf",
			"exe",
			"dll",
			"class",
			"macho"
		],
		"async": true,
		"supportLevel": "structured",
		"status": "experimental",
		"packageName": "@file-viewer/renderer-binary",
		"presets": [],
		"containerVersions": [
			"Raw bytes",
			"ELF",
			"PE/COFF",
			"Mach-O",
			"PNG",
			"ZIP",
			"WebAssembly",
			"Java class"
		],
		"knownLimits": [
			"The package is explicit opt-in and never claims application/octet-stream or extensions owned by dedicated renderers",
			"Only a reviewed built-in template catalog is parsed in a terminable module Worker; user-authored templates, dynamic imports, editing, and patching are out of scope",
			"Whole inputs, parse time, structure nodes, nesting, and decoded string bytes are capped before data reaches the DOM; large files are rejected instead of partially scanning arbitrary pages"
		],
		"capabilities": {
			"download": true,
			"print": false,
			"exportHtml": false,
			"zoom": false,
			"search": false
		}
	}
];
var DEFAULT_REGISTERED_EXTENSIONS = Object.freeze(Array.from(new Set(DEFAULT_RENDERER_DEFINITIONS.flatMap((definition) => definition.extensions))).sort());
Object.freeze(Array.from(new Set(DEFAULT_RENDERER_DEFINITIONS.filter((definition) => definition.status === "stable").flatMap((definition) => definition.extensions))).sort());
/** @deprecated Use DEFAULT_REGISTERED_EXTENSIONS when the experimental/stable distinction matters. */
var DEFAULT_SUPPORTED_EXTENSIONS = DEFAULT_REGISTERED_EXTENSIONS;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/registry/formats.js
var extensionsFor = (rendererId) => {
	var _a, _b;
	return Object.freeze([...(_b = (_a = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === rendererId)) === null || _a === void 0 ? void 0 : _a.extensions) !== null && _b !== void 0 ? _b : []]);
};
var ARCHIVE_EXTENSIONS = extensionsFor("archive");
var MODEL_EXTENSIONS = extensionsFor("model");
var TEXT_EXTENSIONS = extensionsFor("code");
var IMAGE_EXTENSIONS = extensionsFor("image");
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/source/index.js
var DEFAULT_FILE_VIEWER_SOURCE_FILENAME = "preview.bin";
var normalizeFileExtension = (extension) => {
	return extension.trim().replace(/^\./, "").toLowerCase();
};
var decodeFilename = (name) => {
	try {
		return decodeURIComponent(name);
	} catch {
		return name;
	}
};
var getExtension = (name) => {
	const clean = name.split(/[?#]/)[0] || name;
	const dot = clean.lastIndexOf(".");
	return dot === -1 ? "" : normalizeFileExtension(clean.slice(dot + 1));
};
var normalizeFilename = (value, fallback = DEFAULT_FILE_VIEWER_SOURCE_FILENAME) => {
	const next = (value || "").split(/[?#]/)[0].trim();
	if (!next) return fallback;
	const slash = Math.max(next.lastIndexOf("/"), next.lastIndexOf("\\"));
	return decodeFilename(slash === -1 ? next : next.slice(slash + 1));
};
var getSourceKind = (source) => {
	if (source.file) return "file";
	if (source.buffer) return "buffer";
	if (source.url) return "url";
	return "empty";
};
var getBlobName = (file) => {
	return file && "name" in file && typeof file.name === "string" ? file.name : void 0;
};
var resolveFileViewerSourceFilename = ({ filename, file, url, fallback = "" }) => {
	if (filename) return normalizeFilename(filename, fallback);
	const fileName = getBlobName(file);
	if (fileName) return normalizeFilename(fileName, fallback);
	if (url) return normalizeFilename(url, fallback);
	return fallback;
};
var normalizeSource = (source) => {
	const kind = getSourceKind(source);
	const filename = normalizeFilename(source.filename || getBlobName(source.file) || source.url, source.type ? `preview.${normalizeFileExtension(source.type)}` : DEFAULT_FILE_VIEWER_SOURCE_FILENAME);
	const extension = normalizeFileExtension(source.type || getExtension(filename));
	const sourceSize = typeof source.size === "number" ? source.size : source.file ? source.file.size : source.buffer ? source.buffer.byteLength : void 0;
	return {
		kind,
		filename,
		extension,
		url: source.url,
		file: source.file,
		buffer: source.buffer,
		size: sourceSize
	};
};
var wrapFileViewerFileRef = (data, filename = DEFAULT_FILE_VIEWER_SOURCE_FILENAME) => {
	if (typeof File !== "undefined" && data instanceof File) return data;
	const safeFilename = normalizeFilename(filename || "preview.bin");
	if (typeof Blob !== "undefined" && data instanceof Blob) return new File([data], safeFilename, { type: data.type });
	if (data instanceof ArrayBuffer) return new File([data], safeFilename, {});
	throw new Error("Unsupported file source input.");
};
var readFileViewerBuffer = async (file) => {
	if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			var _a;
			const result = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
			if (result instanceof ArrayBuffer) {
				resolve(result);
				return;
			}
			reject(/* @__PURE__ */ new Error("Failed to read file as ArrayBuffer."));
		};
		reader.onerror = (error) => reject(error);
		reader.readAsArrayBuffer(file);
	});
};
var toFileViewerBlob = (source) => {
	if (typeof Blob !== "undefined" && source instanceof Blob) return source;
	if (typeof Blob === "undefined") throw new Error("Blob is not available in the current execution environment.");
	return new Blob([source]);
};
var readFileViewerText = async (source, encoding = "utf-8") => {
	const blob = toFileViewerBlob(source);
	if (typeof blob.text === "function" && encoding.toLowerCase() === "utf-8") return blob.text();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			var _a;
			const result = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
			if (typeof result === "string") {
				resolve(result);
				return;
			}
			reject(/* @__PURE__ */ new Error("Failed to read file as text."));
		};
		reader.onerror = (error) => reject(error);
		reader.readAsText(blob, encoding);
	});
};
[...Object.keys({
	docx: ["[content_types].xml", "word/document.xml"],
	docm: ["[content_types].xml", "word/document.xml"],
	dotx: ["[content_types].xml", "word/document.xml"],
	dotm: ["[content_types].xml", "word/document.xml"],
	xlsx: ["[content_types].xml", "xl/workbook.xml"],
	xltx: ["[content_types].xml", "xl/workbook.xml"],
	xlsm: ["[content_types].xml", "xl/workbook.xml"],
	xltm: ["[content_types].xml", "xl/workbook.xml"],
	xlsb: ["[content_types].xml", "xl/workbook.bin"],
	pptx: ["[content_types].xml", "ppt/presentation.xml"],
	pptm: ["[content_types].xml", "ppt/presentation.xml"],
	potx: ["[content_types].xml", "ppt/presentation.xml"],
	potm: ["[content_types].xml", "ppt/presentation.xml"],
	ppsx: ["[content_types].xml", "ppt/presentation.xml"],
	ppsm: ["[content_types].xml", "ppt/presentation.xml"],
	odt: ["content.xml"],
	ods: ["content.xml"],
	odp: ["content.xml"],
	ofd: ["ofd.xml"],
	numbers: ["index/document.iwa"],
	epub: ["meta-inf/container.xml"],
	xps: ["[content_types].xml"],
	dwfx: ["[content_types].xml"]
})];
new TextDecoder("utf-8");
var DEFAULT_FILE_VIEWER_SCROLLABLE_OVERFLOW_VALUES = [
	"auto",
	"scroll",
	"overlay"
];
var getFileViewerScrollableRange = (element) => {
	return Math.max(0, element.scrollHeight - element.clientHeight);
};
var isFileViewerScrollableElement = (element, options = {}) => {
	var _a, _b;
	const minScrollRange = (_a = options.minScrollRange) !== null && _a !== void 0 ? _a : 2;
	if (getFileViewerScrollableRange(element) <= minScrollRange) return false;
	const ownerView = (_b = element.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
	const view = (ownerView === null || ownerView === void 0 ? void 0 : ownerView.getComputedStyle) ? ownerView : typeof window !== "undefined" ? window : void 0;
	if (!(view === null || view === void 0 ? void 0 : view.getComputedStyle)) return false;
	const style = view.getComputedStyle(element);
	const overflowY = style.overflowY || style.overflow;
	return (options.overflowValues || DEFAULT_FILE_VIEWER_SCROLLABLE_OVERFLOW_VALUES).includes(overflowY);
};
var resolveFileViewerScrollContainer = (root, options = {}) => {
	if (!root) return null;
	const preferredSelector = options.preferredSelector || "[data-viewer-scroll-container], .pdf-wrapper";
	const candidateSelector = options.candidateSelector || "div, section, article, pre";
	const preferred = root.querySelector(preferredSelector);
	if (preferred && isFileViewerScrollableElement(preferred, options)) return preferred;
	if (isFileViewerScrollableElement(root, options)) return root;
	return Array.from(root.querySelectorAll(candidateSelector)).filter((element) => isFileViewerScrollableElement(element, options)).sort((a, b) => getFileViewerScrollableRange(b) - getFileViewerScrollableRange(a))[0] || preferred || root;
};
var DEFAULT_FILE_VIEWER_SEARCH_MAX_MATCHES = 1e3;
var SKIP_SELECTOR = [
	"script",
	"style",
	"textarea",
	"input",
	"select",
	"button",
	".viewer-actions",
	".viewer-watermark",
	".state-panel",
	".pdf-toolbar",
	".pdf-nav-pane",
	"[aria-hidden=\"true\"]",
	".flyfish-search-match",
	".textLayer",
	".annotationLayer",
	".xfaLayer",
	"svg",
	"canvas",
	"iframe",
	"video",
	"audio"
].join(",");
var cloneSearchMatch = (match) => ({
	...match,
	anchor: match.anchor ? { ...match.anchor } : null
});
var cloneFileViewerSearchState = (state) => ({
	query: state.query,
	total: state.total,
	currentIndex: state.currentIndex,
	current: state.current ? cloneSearchMatch(state.current) : null,
	matches: state.matches.map(cloneSearchMatch)
});
var applyFileViewerSearchState = (target, source) => {
	const nextState = cloneFileViewerSearchState(source);
	target.query = nextState.query;
	target.total = nextState.total;
	target.currentIndex = nextState.currentIndex;
	target.current = nextState.current;
	target.matches = nextState.matches;
	return target;
};
var syncFileViewerDomSearchControllerState = (target, controller) => {
	target.anchors.value = controller.anchors;
	applyFileViewerSearchState(target.state, controller.state);
	return target.state;
};
var observeFileViewerDomSearchController = (target, controller) => {
	controller.observe();
	return syncFileViewerDomSearchControllerState(target, controller);
};
var runFileViewerDomSearchControllerAction = async (target, controller, action) => {
	await action();
	return syncFileViewerDomSearchControllerState(target, controller);
};
var destroyFileViewerDomSearchController = (target, controller) => {
	controller.destroy();
	return syncFileViewerDomSearchControllerState(target, controller);
};
var createFileViewerDomSearchControllerActionHandlers = (target, controller) => {
	return {
		observe() {
			return observeFileViewerDomSearchController(target, controller);
		},
		async refreshAnchors() {
			await runFileViewerDomSearchControllerAction(target, controller, () => controller.refreshAnchors());
			return target.anchors.value;
		},
		async search(query) {
			return runFileViewerDomSearchControllerAction(target, controller, () => controller.search(query));
		},
		async next() {
			return runFileViewerDomSearchControllerAction(target, controller, () => controller.next());
		},
		async previous() {
			return runFileViewerDomSearchControllerAction(target, controller, () => controller.previous());
		},
		async clear() {
			return runFileViewerDomSearchControllerAction(target, controller, () => controller.clear());
		},
		destroy() {
			return destroyFileViewerDomSearchController(target, controller);
		}
	};
};
var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var normalizeQuery = (value) => value.replace(/\s+/g, " ").trim();
var createSearchRegExp = (query, options) => {
	const source = options.wholeWord ? `\\b${escapeRegExp(query)}\\b` : escapeRegExp(query);
	return new RegExp(source, options.caseSensitive ? "g" : "gi");
};
var getSerializableMatches = (matches) => {
	return matches.map(({ element: _element, ...match }) => match);
};
var unwrapMark = (mark) => {
	const parent = mark.parentNode;
	if (!parent) return;
	while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
	parent.removeChild(mark);
	parent.normalize();
};
var isSkippableTextNode = (node, root) => {
	const parent = node.parentElement;
	if (!parent || parent.closest(SKIP_SELECTOR)) return true;
	return !root.contains(parent) || !node.data.trim();
};
var getNodeFilterConstant = (root, key) => {
	const view = root.ownerDocument.defaultView;
	const localNodeFilter = (view === null || view === void 0 ? void 0 : view.NodeFilter) || (typeof NodeFilter !== "undefined" ? NodeFilter : void 0);
	if (localNodeFilter) return localNodeFilter[key];
	return key === "SHOW_TEXT" ? 4 : key === "FILTER_REJECT" ? 2 : 1;
};
var walkTextNodes = (root) => {
	const nodes = [];
	const walker = root.ownerDocument.createTreeWalker(root, getNodeFilterConstant(root, "SHOW_TEXT"), { acceptNode(node) {
		return isSkippableTextNode(node, root) ? getNodeFilterConstant(root, "FILTER_REJECT") : getNodeFilterConstant(root, "FILTER_ACCEPT");
	} });
	let current = walker.nextNode();
	while (current) {
		if (!isSkippableTextNode(current, root)) nodes.push(current);
		current = walker.nextNode();
	}
	return nodes;
};
var getMutationObserverConstructor$1 = (root) => {
	var _a, _b;
	return ((_b = (_a = root === null || root === void 0 ? void 0 : root.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) === null || _b === void 0 ? void 0 : _b.MutationObserver) || (typeof MutationObserver !== "undefined" ? MutationObserver : void 0);
};
var getWindowLike = (root) => {
	var _a;
	return ((_a = root === null || root === void 0 ? void 0 : root.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) || (typeof window !== "undefined" ? window : void 0);
};
var isScrollableElement = (element) => {
	if (Math.max(0, element.scrollHeight - element.clientHeight) <= 2) return false;
	const view = element.ownerDocument.defaultView || (typeof window !== "undefined" ? window : void 0);
	if (!(view === null || view === void 0 ? void 0 : view.getComputedStyle)) return true;
	const style = view.getComputedStyle(element);
	const overflowY = style.overflowY || style.overflow;
	return [
		"auto",
		"scroll",
		"overlay",
		"visible"
	].includes(overflowY);
};
var createFileViewerDomSearchController = ({ root, options, waitForDomUpdate, preferredScrollContainer }) => {
	let anchors = [];
	let internalMatches = [];
	const marks = /* @__PURE__ */ new Set();
	const state = createEmptyFileViewerSearchState();
	let observer = null;
	let shouldObserve = false;
	let debounceTimer = null;
	let applying = false;
	const getOptions = () => normalizeFileViewerSearchOptions(options === null || options === void 0 ? void 0 : options());
	const syncState = () => {
		const serializable = getSerializableMatches(internalMatches);
		state.total = serializable.length;
		state.currentIndex = serializable.length ? Math.max(0, Math.min(state.currentIndex, serializable.length - 1)) : -1;
		state.current = state.currentIndex >= 0 ? serializable[state.currentIndex] : null;
		state.matches = serializable;
	};
	const applyExternalState = (nextState) => {
		return applyFileViewerSearchState(state, nextState);
	};
	const clearMarks = () => {
		Array.from(marks).forEach(unwrapMark);
		marks.clear();
		internalMatches = [];
		state.total = 0;
		state.currentIndex = -1;
		state.current = null;
		state.matches = [];
	};
	const runProviderAction = async (action, fallbackQuery = state.query) => {
		var _a;
		const provider = findFileViewerSearchProvider(root());
		if (!provider) return null;
		clearMarks();
		const nextState = await action(provider);
		return applyExternalState(nextState || ((_a = provider.getState) === null || _a === void 0 ? void 0 : _a.call(provider)) || createEmptyFileViewerSearchState(fallbackQuery));
	};
	const disconnectObserver = () => {
		observer === null || observer === void 0 || observer.disconnect();
		observer = null;
	};
	const getMatchScrollContainer = (element) => {
		const currentRoot = root() || null;
		const preferred = (preferredScrollContainer === null || preferredScrollContainer === void 0 ? void 0 : preferredScrollContainer()) || null;
		if (preferred && (preferred === element || preferred.contains(element))) return preferred;
		let current = element.parentElement;
		while (current) {
			if (isScrollableElement(current)) return current;
			if (current === currentRoot) break;
			current = current.parentElement;
		}
		return currentRoot;
	};
	const scrollMatchIntoView = (element) => {
		const container = getMatchScrollContainer(element);
		if (!container) {
			element.scrollIntoView({
				block: "center",
				inline: "nearest"
			});
			return;
		}
		const lockedLeft = container.scrollLeft;
		const containerRect = container.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();
		const targetTop = elementRect.top - containerRect.top + container.scrollTop - container.clientHeight / 2 + elementRect.height / 2;
		const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
		const nextTop = Math.max(0, Math.min(targetTop, maxTop));
		if (typeof container.scrollTo === "function") container.scrollTo({
			top: nextTop,
			left: lockedLeft,
			behavior: "auto"
		});
		else {
			container.scrollTop = nextTop;
			container.scrollLeft = lockedLeft;
		}
		container.scrollLeft = lockedLeft;
	};
	const setActiveMatch = (index, scroll = true) => {
		const normalizedOptions = getOptions();
		if (!internalMatches.length) {
			syncState();
			return state;
		}
		const normalized = (index % internalMatches.length + internalMatches.length) % internalMatches.length;
		internalMatches.forEach((match) => {
			match.element.classList.remove(normalizedOptions.activeClassName || "flyfish-search-match--active");
		});
		const active = internalMatches[normalized];
		active.element.classList.add(normalizedOptions.activeClassName || "flyfish-search-match--active");
		state.currentIndex = normalized;
		syncState();
		if (scroll) scrollMatchIntoView(active.element);
		return state;
	};
	const highlightTextNode = (node, expression, maxMatches, nextMatches) => {
		var _a;
		const currentRoot = root();
		if (!currentRoot) return;
		const normalizedOptions = getOptions();
		const text = node.data;
		let lastIndex = 0;
		let match;
		const fragment = node.ownerDocument.createDocumentFragment();
		let matched = false;
		expression.lastIndex = 0;
		while ((match = expression.exec(text)) && nextMatches.length < maxMatches) {
			if (!match[0]) {
				expression.lastIndex += 1;
				continue;
			}
			if (match.index > lastIndex) fragment.appendChild(node.ownerDocument.createTextNode(text.slice(lastIndex, match.index)));
			const mark = node.ownerDocument.createElement("mark");
			mark.className = normalizedOptions.className || "flyfish-search-match";
			mark.textContent = match[0];
			mark.dataset.searchMatchId = `viewer-search-match-${nextMatches.length + 1}`;
			marks.add(mark);
			fragment.appendChild(mark);
			matched = true;
			const anchor = findFileViewerAnchorForElement(node.parentElement, anchors, currentRoot);
			nextMatches.push({
				id: mark.dataset.searchMatchId,
				index: nextMatches.length,
				text: match[0],
				anchor,
				line: anchor === null || anchor === void 0 ? void 0 : anchor.line,
				page: anchor === null || anchor === void 0 ? void 0 : anchor.page,
				element: mark
			});
			lastIndex = match.index + match[0].length;
		}
		if (!matched) return;
		if (lastIndex < text.length) fragment.appendChild(node.ownerDocument.createTextNode(text.slice(lastIndex)));
		(_a = node.parentNode) === null || _a === void 0 || _a.replaceChild(fragment, node);
	};
	const startObserver = () => {
		disconnectObserver();
		const currentRoot = root();
		const MutationObserverCtor = getMutationObserverConstructor$1(currentRoot);
		if (!shouldObserve || !currentRoot || !MutationObserverCtor || findFileViewerSearchProvider(currentRoot)) return;
		observer = new MutationObserverCtor(rerunAfterDomChange);
		observer.observe(currentRoot, {
			childList: true,
			subtree: true,
			characterData: true
		});
	};
	const resumeObserver = () => {
		if (!shouldObserve) return;
		const view = getWindowLike(root());
		if (view === null || view === void 0 ? void 0 : view.setTimeout) {
			view.setTimeout(startObserver, 0);
			return;
		}
		setTimeout(startObserver, 0);
	};
	const runSearch = async (query, preferredIndex = 0) => {
		const normalizedQuery = normalizeQuery(query);
		const normalizedOptions = getOptions();
		state.query = normalizedQuery;
		disconnectObserver();
		applying = true;
		try {
			clearMarks();
			const currentRoot = root();
			if (!normalizedQuery || normalizedOptions.enabled === false || !currentRoot) {
				const providerState = await runProviderAction((provider) => {
					var _a;
					return (_a = provider.clear) === null || _a === void 0 ? void 0 : _a.call(provider);
				}, normalizedQuery);
				if (providerState) return providerState;
				return state;
			}
			const providerState = await runProviderAction((provider) => provider.search(normalizedQuery, normalizedOptions), normalizedQuery);
			if (providerState) return providerState;
			await (waitForDomUpdate === null || waitForDomUpdate === void 0 ? void 0 : waitForDomUpdate());
			const nextRoot = root();
			if (!nextRoot) return state;
			anchors = collectFileViewerDocumentAnchors(nextRoot);
			const expression = createSearchRegExp(normalizedQuery, normalizedOptions);
			const maxMatches = Math.max(1, normalizedOptions.maxMatches || 1e3);
			const nextMatches = [];
			const textNodes = walkTextNodes(nextRoot);
			for (const node of textNodes) {
				if (nextMatches.length >= maxMatches) break;
				highlightTextNode(node, expression, maxMatches, nextMatches);
			}
			internalMatches = nextMatches;
			syncState();
			if (nextMatches.length) setActiveMatch(preferredIndex, true);
		} finally {
			applying = false;
			resumeObserver();
		}
		return state;
	};
	const rerunAfterDomChange = () => {
		var _a;
		const normalizedOptions = getOptions();
		if (!state.query || applying || normalizedOptions.enabled === false) return;
		if (debounceTimer !== null) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			runSearch(state.query, Math.max(0, state.currentIndex));
		}, (_a = normalizedOptions.debounce) !== null && _a !== void 0 ? _a : 180);
	};
	return {
		get anchors() {
			return anchors;
		},
		state,
		getInternalMatches: () => internalMatches,
		observe() {
			shouldObserve = true;
			startObserver();
		},
		async refreshAnchors() {
			await (waitForDomUpdate === null || waitForDomUpdate === void 0 ? void 0 : waitForDomUpdate());
			anchors = collectFileViewerDocumentAnchors(root() || null);
			return anchors;
		},
		search: (query) => runSearch(query, 0),
		next: async () => {
			return await runProviderAction((provider) => {
				var _a, _b;
				return ((_a = provider.next) === null || _a === void 0 ? void 0 : _a.call(provider)) || ((_b = provider.getState) === null || _b === void 0 ? void 0 : _b.call(provider));
			}) || setActiveMatch(state.currentIndex + 1);
		},
		previous: async () => {
			return await runProviderAction((provider) => {
				var _a, _b;
				return ((_a = provider.previous) === null || _a === void 0 ? void 0 : _a.call(provider)) || ((_b = provider.getState) === null || _b === void 0 ? void 0 : _b.call(provider));
			}) || setActiveMatch(state.currentIndex - 1);
		},
		clear: async () => {
			state.query = "";
			disconnectObserver();
			applying = true;
			try {
				clearMarks();
				const providerState = await runProviderAction((provider) => {
					var _a;
					return (_a = provider.clear) === null || _a === void 0 ? void 0 : _a.call(provider);
				}, "");
				if (providerState) return providerState;
				return state;
			} finally {
				applying = false;
				resumeObserver();
			}
		},
		destroy() {
			shouldObserve = false;
			disconnectObserver();
			if (debounceTimer !== null) {
				clearTimeout(debounceTimer);
				debounceTimer = null;
			}
			clearMarks();
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/document/events.js
var createFileViewerSearchChangeState = (state) => {
	return cloneFileViewerSearchState(state);
};
var resolveFileViewerLocationChangeAnchor = ({ root, anchors }) => {
	return getCurrentFileViewerDocumentAnchor(root || null, anchors);
};
var createFileViewerDocumentFeatureControllerActionHandlers = ({ root, searchTarget, searchOptions, waitForDomUpdate, preferredScrollContainer, getAiOptions, onSearchChange, onLocationChange }) => {
	let documentActions = null;
	const searchActions = createFileViewerDomSearchControllerActionHandlers(searchTarget, createFileViewerDomSearchController({
		root,
		options: searchOptions,
		waitForDomUpdate,
		preferredScrollContainer: () => {
			var _a, _b;
			return (_b = (_a = preferredScrollContainer === null || preferredScrollContainer === void 0 ? void 0 : preferredScrollContainer()) !== null && _a !== void 0 ? _a : documentActions === null || documentActions === void 0 ? void 0 : documentActions.getScrollContainer()) !== null && _b !== void 0 ? _b : null;
		}
	}));
	documentActions = createFileViewerDocumentFeatureActions({
		root,
		searchController: {
			getAnchors: () => searchTarget.anchors.value,
			getSearchState: () => searchTarget.state,
			observe: searchActions.observe,
			refreshAnchors: searchActions.refreshAnchors,
			search: searchActions.search,
			clear: searchActions.clear,
			next: searchActions.next,
			previous: searchActions.previous
		},
		getAiOptions,
		onSearchChange,
		onLocationChange
	});
	return {
		...documentActions,
		destroyDocumentFeatures: searchActions.destroy
	};
};
var dispatchFileViewerSearchChange = ({ state, onChange }) => {
	const payload = createFileViewerSearchChangeState(state);
	onChange === null || onChange === void 0 || onChange(payload);
	return true;
};
var dispatchFileViewerLocationChange = ({ anchor, onChange }) => {
	onChange === null || onChange === void 0 || onChange(anchor);
	return true;
};
var createFileViewerDocumentFeatureActions = ({ root, searchController, getAiOptions, onSearchChange, onLocationChange }) => {
	const getRoot = () => root() || null;
	const getAnchors = () => searchController.getAnchors();
	const getSearchState = () => createFileViewerSearchChangeState(searchController.getSearchState());
	const notifySearchChange = () => {
		const state = getSearchState();
		dispatchFileViewerSearchChange({
			state,
			onChange: onSearchChange
		});
		return state;
	};
	const getCurrentDocumentAnchor = () => {
		return resolveFileViewerLocationChangeAnchor({
			root: getRoot(),
			anchors: getAnchors()
		});
	};
	const notifyLocationChange = () => {
		const anchor = getCurrentDocumentAnchor();
		dispatchFileViewerLocationChange({
			anchor,
			onChange: onLocationChange
		});
		return anchor;
	};
	const maybeNotifyLocationChange = (actionOptions) => {
		if ((actionOptions === null || actionOptions === void 0 ? void 0 : actionOptions.notify) === false) return getCurrentDocumentAnchor();
		return notifyLocationChange();
	};
	const refreshDocumentIndex = async (actionOptions) => {
		searchController.observe();
		const anchors = await searchController.refreshAnchors();
		maybeNotifyLocationChange(actionOptions);
		return anchors;
	};
	const ensureAnchors = async (actionOptions) => {
		if (!getAnchors().length) await refreshDocumentIndex(actionOptions);
		return getAnchors();
	};
	const scrollToLoadedAnchor = (anchor, actionOptions) => {
		const result = scrollToFileViewerDocumentAnchor(getRoot(), anchor);
		maybeNotifyLocationChange(actionOptions);
		return result;
	};
	return {
		refreshDocumentIndex,
		async clearDocumentState() {
			await searchController.clear();
			return getSearchState();
		},
		getScrollContainer() {
			return resolveFileViewerScrollContainer(getRoot());
		},
		async searchDocument(query) {
			await searchController.search(query);
			return notifySearchChange();
		},
		async clearDocumentSearch() {
			await searchController.clear();
			return notifySearchChange();
		},
		async nextSearchResult() {
			await searchController.next();
			notifyLocationChange();
			return notifySearchChange();
		},
		async previousSearchResult() {
			await searchController.previous();
			notifyLocationChange();
			return notifySearchChange();
		},
		getSearchState,
		async collectDocumentAnchors(actionOptions) {
			await refreshDocumentIndex(actionOptions);
			return getAnchors();
		},
		getCurrentDocumentAnchor,
		scrollToLoadedAnchor,
		async scrollToAnchor(anchor, actionOptions) {
			await ensureAnchors(actionOptions);
			return scrollToLoadedAnchor(anchor, actionOptions);
		},
		async scrollToLine(line, actionOptions) {
			await ensureAnchors(actionOptions);
			return scrollToLoadedAnchor(line, actionOptions);
		},
		getDocumentTextChunks(textOptions) {
			return buildFileViewerDocumentTextChunks(getAnchors(), textOptions !== null && textOptions !== void 0 ? textOptions : getAiOptions === null || getAiOptions === void 0 ? void 0 : getAiOptions());
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/document/viewState.js
var cloneFileViewerViewState = (state) => {
	if (!state) return null;
	return {
		...state,
		zoom: state.zoom ? { ...state.zoom } : void 0,
		scroll: state.scroll ? { ...state.scroll } : void 0,
		navigation: state.navigation ? { ...state.navigation } : void 0,
		extra: state.extra ? { ...state.extra } : void 0
	};
};
var createFileViewerViewStateChange = (state, patch = {}) => ({
	state: cloneFileViewerViewState(state) || {},
	action: patch.action || "init",
	source: patch.source || "viewer",
	timestamp: patch.timestamp || Date.now()
});
var createFileViewerViewStateChangeEmitter = () => {
	const listeners = /* @__PURE__ */ new Set();
	return {
		emit(change) {
			listeners.forEach((listener) => listener(change));
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
	};
};
var getViewStateWindow = (host) => {
	var _a;
	return ((_a = host.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) || (typeof window !== "undefined" ? window : void 0);
};
var waitForViewStateFrame = (host) => {
	const ownerWindow = getViewStateWindow(host);
	return new Promise((resolve) => {
		if (ownerWindow === null || ownerWindow === void 0 ? void 0 : ownerWindow.requestAnimationFrame) {
			ownerWindow.requestAnimationFrame(() => resolve());
			return;
		}
		setTimeout(resolve, 16);
	});
};
var readFileViewerScrollState = (element) => {
	const maxTop = Math.max(0, element.scrollHeight - element.clientHeight);
	const maxLeft = Math.max(0, element.scrollWidth - element.clientWidth);
	return {
		top: element.scrollTop || 0,
		left: element.scrollLeft || 0,
		width: element.scrollWidth || 0,
		height: element.scrollHeight || 0,
		clientWidth: element.clientWidth || 0,
		clientHeight: element.clientHeight || 0,
		topRatio: maxTop > 0 ? (element.scrollTop || 0) / maxTop : 0,
		leftRatio: maxLeft > 0 ? (element.scrollLeft || 0) / maxLeft : 0
	};
};
var resolveScrollValue = (value, ratio, maxValue) => {
	if (Number.isFinite(value)) return Number(value);
	if (Number.isFinite(ratio)) return Number(ratio) * maxValue;
};
var registerFileViewerGenericViewStateProvider = ({ host, renderer, scrollTarget }) => {
	var _a, _b;
	const emitter = createFileViewerViewStateChangeEmitter();
	const ownerWindow = getViewStateWindow(host);
	let destroyed = false;
	let scrollFrame = 0;
	let suppressScrollEventUntil = 0;
	let unsubscribeZoom = null;
	const resolveScrollTarget = () => {
		if (typeof scrollTarget === "function") return scrollTarget() || host;
		return scrollTarget || resolveFileViewerScrollContainer(host) || host;
	};
	const getZoomProvider = () => findFileViewerZoomProvider(host);
	const getState = () => {
		var _a, _b;
		const zoom = (_b = (_a = getZoomProvider()) === null || _a === void 0 ? void 0 : _a.getState) === null || _b === void 0 ? void 0 : _b.call(_a);
		const scrollElement = resolveScrollTarget();
		return {
			renderer,
			scale: zoom === null || zoom === void 0 ? void 0 : zoom.scale,
			zoom,
			scroll: scrollElement ? readFileViewerScrollState(scrollElement) : void 0
		};
	};
	const emit = (action, source = "viewer") => {
		if (destroyed) return getState();
		const state = getState();
		emitter.emit(createFileViewerViewStateChange(state, {
			action,
			source
		}));
		return state;
	};
	const suppressProgrammaticScrollEvents = () => {
		suppressScrollEventUntil = Math.max(suppressScrollEventUntil, Date.now() + 180);
	};
	const applyScrollState = (scroll) => {
		if (!scroll) return;
		const scrollElement = resolveScrollTarget();
		const maxTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
		const maxLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth);
		const top = resolveScrollValue(scroll.top, scroll.topRatio, maxTop);
		const left = resolveScrollValue(scroll.left, scroll.leftRatio, maxLeft);
		suppressProgrammaticScrollEvents();
		if (top !== void 0) scrollElement.scrollTop = Math.min(Math.max(0, top), maxTop);
		if (left !== void 0) scrollElement.scrollLeft = Math.min(Math.max(0, left), maxLeft);
	};
	const fit = async (request) => {
		var _a, _b, _c, _d;
		const zoomProvider = getZoomProvider();
		if (zoomProvider === null || zoomProvider === void 0 ? void 0 : zoomProvider.fit) return zoomProvider.fit(request);
		if (!(zoomProvider === null || zoomProvider === void 0 ? void 0 : zoomProvider.setZoom)) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "zoom-provider-unavailable",
			provider: "view-state"
		};
		const zoomState = zoomProvider.getState();
		const currentScale = Number(zoomState.scale) > 0 ? Number(zoomState.scale) : 1;
		const scrollElement = resolveScrollTarget();
		const viewportWidth = request.viewportWidth || scrollElement.clientWidth || host.clientWidth;
		const viewportHeight = request.viewportHeight || scrollElement.clientHeight || host.clientHeight;
		const contentWidth = Math.max(scrollElement.scrollWidth || 0, host.scrollWidth || 0, ((_a = scrollElement.getBoundingClientRect) === null || _a === void 0 ? void 0 : _a.call(scrollElement).width) || 0);
		const contentHeight = Math.max(scrollElement.scrollHeight || 0, host.scrollHeight || 0, ((_b = scrollElement.getBoundingClientRect) === null || _b === void 0 ? void 0 : _b.call(scrollElement).height) || 0);
		const scale = resolveFileViewerFitScale({
			mode: request.mode,
			viewportWidth,
			viewportHeight,
			contentWidth: contentWidth / currentScale,
			contentHeight: contentHeight / currentScale,
			currentScale,
			minScale: (_c = request.minScale) !== null && _c !== void 0 ? _c : zoomState.minScale,
			maxScale: (_d = request.maxScale) !== null && _d !== void 0 ? _d : zoomState.maxScale
		});
		if (!scale) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "unmeasurable",
			provider: "view-state"
		};
		suppressProgrammaticScrollEvents();
		await zoomProvider.setZoom(scale);
		await waitForViewStateFrame(host);
		const state = emit("fit", request.source);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale,
			source: request.source,
			provider: "view-state",
			state
		};
	};
	const scheduleScrollChange = () => {
		if (destroyed || Date.now() < suppressScrollEventUntil || scrollFrame) return;
		scrollFrame = ((ownerWindow === null || ownerWindow === void 0 ? void 0 : ownerWindow.requestAnimationFrame) || ((callback) => {
			return setTimeout(() => callback(Date.now()), 16);
		}))(() => {
			scrollFrame = 0;
			emit("scroll", "user");
		});
	};
	const provider = {
		getState,
		async applyState(state, options = {}) {
			var _a, _b;
			const source = options.source || "api";
			const action = options.action || "restore";
			const notify = options.notify !== false;
			const zoomProvider = getZoomProvider();
			const nextScale = Number((_a = state.scale) !== null && _a !== void 0 ? _a : (_b = state.zoom) === null || _b === void 0 ? void 0 : _b.scale);
			suppressProgrammaticScrollEvents();
			if (Number.isFinite(nextScale) && (zoomProvider === null || zoomProvider === void 0 ? void 0 : zoomProvider.setZoom)) await zoomProvider.setZoom(nextScale);
			await waitForViewStateFrame(host);
			applyScrollState(state.scroll);
			await waitForViewStateFrame(host);
			applyScrollState(state.scroll);
			if (notify) return emit(action, source);
			return getState();
		},
		fit,
		subscribe: emitter.subscribe
	};
	host.dataset.viewerViewStateProvider = "generic";
	registerFileViewerViewStateProvider(host, provider);
	(_a = host.addEventListener) === null || _a === void 0 || _a.call(host, "scroll", scheduleScrollChange, {
		capture: true,
		passive: true
	});
	const zoomProvider = getZoomProvider();
	unsubscribeZoom = ((_b = zoomProvider === null || zoomProvider === void 0 ? void 0 : zoomProvider.subscribe) === null || _b === void 0 ? void 0 : _b.call(zoomProvider, () => {
		emit("zoom-change", "viewer");
	})) || null;
	return {
		provider,
		destroy() {
			var _a;
			destroyed = true;
			unsubscribeZoom === null || unsubscribeZoom === void 0 || unsubscribeZoom();
			unsubscribeZoom = null;
			if (scrollFrame && (ownerWindow === null || ownerWindow === void 0 ? void 0 : ownerWindow.cancelAnimationFrame)) ownerWindow.cancelAnimationFrame(scrollFrame);
			scrollFrame = 0;
			(_a = host.removeEventListener) === null || _a === void 0 || _a.call(host, "scroll", scheduleScrollChange, true);
			unregisterFileViewerViewStateProvider(host);
		}
	};
};
var getMutationObserverConstructor = (root) => {
	var _a, _b;
	return ((_b = (_a = root === null || root === void 0 ? void 0 : root.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) === null || _b === void 0 ? void 0 : _b.MutationObserver) || (typeof MutationObserver !== "undefined" ? MutationObserver : void 0);
};
var createFileViewerViewStateController = ({ root, enabled, onChange }) => {
	let provider = null;
	let unsubscribe = null;
	let observer = null;
	let state = null;
	const readProviderState = () => {
		var _a;
		return cloneFileViewerViewState(((_a = provider === null || provider === void 0 ? void 0 : provider.getState) === null || _a === void 0 ? void 0 : _a.call(provider)) || null);
	};
	const commitState = (nextState, change) => {
		state = cloneFileViewerViewState(nextState);
		if (change && state) onChange === null || onChange === void 0 || onChange({
			...change,
			state: cloneFileViewerViewState(change.state) || state
		});
		return cloneFileViewerViewState(state);
	};
	const clearProvider = () => {
		unsubscribe === null || unsubscribe === void 0 || unsubscribe();
		unsubscribe = null;
		provider = null;
		return commitState(null);
	};
	const syncProvider = () => {
		var _a;
		if ((enabled === null || enabled === void 0 ? void 0 : enabled()) === false) {
			clearProvider();
			return null;
		}
		const nextProvider = findFileViewerViewStateProvider(root());
		if (nextProvider !== provider) {
			unsubscribe === null || unsubscribe === void 0 || unsubscribe();
			provider = nextProvider;
			unsubscribe = ((_a = nextProvider === null || nextProvider === void 0 ? void 0 : nextProvider.subscribe) === null || _a === void 0 ? void 0 : _a.call(nextProvider, (change) => {
				commitState(change.state, change);
			})) || null;
		}
		commitState(readProviderState());
		return nextProvider;
	};
	const disconnectObserver = () => {
		observer === null || observer === void 0 || observer.disconnect();
		observer = null;
	};
	return {
		get provider() {
			return provider;
		},
		get state() {
			return cloneFileViewerViewState(state);
		},
		hasProvider() {
			return !!syncProvider();
		},
		refreshProvider: syncProvider,
		observe() {
			disconnectObserver();
			const currentRoot = root();
			const MutationObserverCtor = getMutationObserverConstructor(currentRoot);
			if (!currentRoot || !MutationObserverCtor) {
				syncProvider();
				return;
			}
			observer = new MutationObserverCtor(() => {
				syncProvider();
			});
			observer.observe(currentRoot, {
				childList: true,
				subtree: true
			});
			syncProvider();
		},
		clearProvider,
		getState() {
			syncProvider();
			return cloneFileViewerViewState(state);
		},
		async applyState(nextState, options) {
			const nextProvider = syncProvider();
			if (!(nextProvider === null || nextProvider === void 0 ? void 0 : nextProvider.applyState)) return cloneFileViewerViewState(state);
			const appliedState = await nextProvider.applyState(nextState, options);
			commitState(appliedState || nextProvider.getState());
			return cloneFileViewerViewState(state);
		},
		destroy() {
			disconnectObserver();
			clearProvider();
		}
	};
};
var createFileViewerViewStateControllerActionHandlers = (controller) => {
	return {
		hasViewStateProvider() {
			return controller.hasProvider();
		},
		refreshViewStateProvider() {
			return controller.refreshProvider();
		},
		startViewStateObserver() {
			controller.observe();
			return controller.getState();
		},
		stopViewStateObserver() {
			controller.destroy();
			return null;
		},
		clearViewStateProvider() {
			return controller.clearProvider();
		},
		getViewState() {
			return controller.getState();
		},
		applyViewState(state, options) {
			return controller.applyState(state, options);
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/registry/capabilities.js
var DEFAULT_OPERATION_AVAILABILITY = Object.freeze({
	download: false,
	print: false,
	exportHtml: false,
	zoom: false,
	zoomIn: false,
	zoomOut: false,
	zoomReset: false
});
/**
* 这些格式只有专属适配器准备好后才展示打印。
*
* 它们的在线预览常依赖分页引擎、虚拟渲染或 Worker 生命周期，直接克隆
* DOM 很容易只得到当前页或当前视口。
*/
var ADAPTER_PRINT_REQUIRED_EXTENSIONS = [
	"docx",
	"docm",
	"dotx",
	"dotm",
	"doc",
	"dot",
	"ppt",
	"pdf",
	"typ",
	"typst"
];
/**
* 这些格式的预览结果是完整 DOM / SVG / Canvas 截图，解除滚动容器裁切后
* 可以稳定进入浏览器打印流程。
*/
var DOM_PRINTABLE_EXTENSIONS = [
	"pptx",
	"pptm",
	"potx",
	"potm",
	"ppsx",
	"ppsm",
	"ofd",
	"dxf",
	"dwg",
	"dwf",
	"dwfx",
	"xps",
	"excalidraw",
	"drawio",
	"dio",
	"mermaid",
	"mmd",
	"plantuml",
	"puml",
	"umd",
	"md",
	"markdown",
	"olb",
	"dra",
	...TEXT_EXTENSIONS,
	...IMAGE_EXTENSIONS
];
/**
* 这些格式默认不展示打印按钮，避免导出半截内容。
*/
var NON_PRINTABLE_EXTENSIONS = [
	"xlsx",
	"xltx",
	"xlsm",
	"xlsb",
	"xls",
	"xlt",
	"xltm",
	"csv",
	"tsv",
	"ods",
	"fods",
	"numbers",
	...ARCHIVE_EXTENSIONS,
	"eml",
	"msg",
	"epub",
	"mp4",
	"mp3",
	"mpeg",
	"wav",
	"ogg",
	"oga",
	"opus",
	"m4a",
	"aac",
	"flac",
	"weba",
	...MODEL_EXTENSIONS
];
var hasExtension = (items, extension) => {
	return items.includes(normalizeFileExtension(extension));
};
var needsDedicatedPrintAdapter = (extension) => {
	return hasExtension(ADAPTER_PRINT_REQUIRED_EXTENSIONS, extension);
};
var isDomPrintableExtension = (extension) => {
	return hasExtension(DOM_PRINTABLE_EXTENSIONS, extension);
};
var isKnownNonPrintableExtension = (extension) => {
	return hasExtension(NON_PRINTABLE_EXTENSIONS, extension);
};
var resolvePrintAvailability = (extension, adapter, renderedReady) => {
	if (!renderedReady) return false;
	if (adapter) {
		if (adapter.print === false) return false;
		if (adapter.toHtml) return true;
	}
	if (needsDedicatedPrintAdapter(extension) || isKnownNonPrintableExtension(extension)) return false;
	return isDomPrintableExtension(extension);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/viewer/operations.js
var DEFAULT_FILE_VIEWER_PREVIEW_TITLE = "file-viewer-preview";
var DEFAULT_FILE_VIEWER_EXPORT_FILENAME = "preview";
var DEFAULT_FILE_VIEWER_DOWNLOAD_FILENAME = DEFAULT_FILE_VIEWER_SOURCE_FILENAME;
var FILE_VIEWER_OPERATION_ACTION_ERROR_MESSAGE_KEYS = {
	download: "error.download",
	print: "error.print",
	"export-html": "error.exportHtml"
};
var getBlobFilename = (file) => {
	return file && "name" in file && typeof file.name === "string" ? file.name : "";
};
var getBlobMimeType = (file) => {
	return file && typeof file.type === "string" ? file.type : "";
};
var createFileViewerOriginalSourceState = ({ buffer = null, file = null, url = null, filename = null, mimeType = null } = {}) => {
	return {
		buffer,
		file,
		url,
		filename,
		mimeType: mimeType || getBlobMimeType(file) || null
	};
};
var resolveFileViewerOriginalFilename = (source, fallback = "preview") => {
	return source.filename || getBlobFilename(source.file) || fallback;
};
var resolveFileViewerOperationFilename = ({ filename, source, fallback = DEFAULT_FILE_VIEWER_PREVIEW_TITLE }) => {
	return filename || (source ? resolveFileViewerOriginalFilename(source, "") : "") || fallback;
};
var resolveFileViewerOperationActionErrorMessage = ({ context, formatErrorMessage, prefixes, i18n }) => {
	var _a;
	return formatErrorMessage((_a = prefixes === null || prefixes === void 0 ? void 0 : prefixes[context.operation]) !== null && _a !== void 0 ? _a : translateFileViewerMessage(i18n, FILE_VIEWER_OPERATION_ACTION_ERROR_MESSAGE_KEYS[context.operation]), context.error, i18n);
};
var hasFileViewerOriginalSource = (source) => {
	return !!source.buffer || !!source.file || !!source.url;
};
var runBeforeOperation = async (beforeOperation, operation) => {
	if (!beforeOperation) return true;
	return await beforeOperation(operation);
};
var buildRenderedHtmlDocumentFromOperation = async (mode, { source, title, filename, adapter = null, watermarkInlineStyle, mask = null, i18n }) => {
	if (!source) throw new Error(translateFileViewerMessage(i18n, "error.noExportContent"));
	const { buildFileViewerRenderedHtmlDocument } = await import("./export-DnO3xVZm.js");
	return buildFileViewerRenderedHtmlDocument({
		source,
		mode,
		title: resolveFileViewerOperationFilename({
			filename: title || filename,
			fallback: DEFAULT_FILE_VIEWER_PREVIEW_TITLE
		}),
		adapter,
		watermarkInlineStyle,
		mask: mode === "print" ? mask : null
	});
};
var buildRenderedDomDocumentFromOperation = async ({ source, title, filename, adapter = null, watermarkInlineStyle, mask = null, i18n }) => {
	if (!source) throw new Error(translateFileViewerMessage(i18n, "error.noExportContent"));
	const { buildFileViewerRenderedDomDocument } = await import("./export-DnO3xVZm.js");
	return buildFileViewerRenderedDomDocument({
		source,
		mode: "print",
		title: resolveFileViewerOperationFilename({
			filename: title || filename,
			fallback: DEFAULT_FILE_VIEWER_PREVIEW_TITLE
		}),
		adapter,
		watermarkInlineStyle,
		mask
	});
};
var replaceFileViewerPrintDocument = (targetDocument, sanitizedRoot) => {
	const importedRoot = targetDocument.importNode(sanitizedRoot, true);
	const currentRoot = targetDocument.documentElement;
	if (currentRoot) currentRoot.replaceWith(importedRoot);
	else targetDocument.append(importedRoot);
	if (!targetDocument.doctype) targetDocument.insertBefore(targetDocument.implementation.createDocumentType("html", "", ""), importedRoot);
};
var FILE_VIEWER_PRINT_STANDARDS_DOCUMENT = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"></head><body></body></html>";
var ensureFileViewerPrintStandardsMode = async (targetWindow) => {
	if (targetWindow.document.compatMode === "CSS1Compat") return;
	const targetGlobal = targetWindow;
	const objectUrl = targetGlobal.URL.createObjectURL(new targetGlobal.Blob([FILE_VIEWER_PRINT_STANDARDS_DOCUMENT], { type: "text/html;charset=utf-8" }));
	try {
		await new Promise((resolve, reject) => {
			let settled = false;
			const finish = () => {
				if (settled) return;
				settled = true;
				globalThis.clearTimeout(timeoutId);
				if (targetWindow.document.compatMode === "CSS1Compat") resolve();
				else reject(/* @__PURE__ */ new Error("Unable to initialize the print window in standards mode."));
			};
			const timeoutId = globalThis.setTimeout(finish, 1500);
			targetWindow.addEventListener("load", finish, { once: true });
			targetWindow.location.replace(objectUrl);
		});
	} finally {
		targetGlobal.URL.revokeObjectURL(objectUrl);
	}
};
var executeFileViewerDownloadOperation = async ({ source, filename, beforeOperation, i18n, throwOnMissingSource = true }) => {
	var _a;
	if (!hasFileViewerOriginalSource(source)) {
		if (throwOnMissingSource) throw new Error(translateFileViewerMessage(i18n, "error.noDownloadSource"));
		return false;
	}
	if (!await runBeforeOperation(beforeOperation, "download")) return false;
	const resolvedFilename = resolveFileViewerOperationFilename({
		filename,
		source,
		fallback: DEFAULT_FILE_VIEWER_DOWNLOAD_FILENAME
	});
	if (source.buffer && (source.buffer.byteLength > 0 || !source.file && !source.url)) {
		triggerFileViewerBlobDownload(new Blob([source.buffer], { type: source.mimeType || ((_a = source.file) === null || _a === void 0 ? void 0 : _a.type) || "application/octet-stream" }), resolvedFilename);
		return true;
	}
	if (source.file && (source.file.size > 0 || !source.url)) {
		triggerFileViewerBlobDownload(source.file, resolvedFilename);
		return true;
	}
	if (source.url) {
		triggerFileViewerUrlDownload(source.url, resolvedFilename);
		return true;
	}
	if (source.file) {
		triggerFileViewerBlobDownload(source.file, resolvedFilename);
		return true;
	}
	triggerFileViewerBlobDownload(new Blob([source.buffer], { type: source.mimeType || "application/octet-stream" }), resolvedFilename);
	return true;
};
var executeFileViewerExportHtmlOperation = async ({ download = true, filename, beforeOperation, i18n, ...input }) => {
	if (!await runBeforeOperation(beforeOperation, "export-html")) return "";
	const html = await buildRenderedHtmlDocumentFromOperation("export", {
		...input,
		filename,
		i18n
	});
	if (download !== false) {
		const baseName = resolveFileViewerOperationFilename({
			filename: filename || input.title,
			fallback: DEFAULT_FILE_VIEWER_EXPORT_FILENAME
		});
		triggerFileViewerBlobDownload(new Blob([html], { type: "text/html;charset=utf-8" }), `${baseName}.rendered.html`);
	}
	return html;
};
var executeFileViewerPrintOperation = async ({ autoPrint = true, beforeOperation, i18n, openWindow, printAvailable = true, printWindow, ...input }) => {
	if (!printAvailable) throw new Error(translateFileViewerMessage(i18n, "error.printUnavailable"));
	const beforeResult = beforeOperation ? beforeOperation("print") : true;
	if (beforeResult === false) return false;
	const ownsPrintWindow = !printWindow;
	const targetWindow = printWindow || (openWindow === null || openWindow === void 0 ? void 0 : openWindow()) || (typeof window !== "undefined" ? window.open("", "_blank") : null);
	if (!targetWindow) throw new Error(translateFileViewerMessage(i18n, "error.printWindowBlocked"));
	try {
		if (!await beforeResult) {
			if (ownsPrintWindow) targetWindow.close();
			return false;
		}
		const printableRoot = await buildRenderedDomDocumentFromOperation({
			...input,
			i18n
		});
		await ensureFileViewerPrintStandardsMode(targetWindow);
		replaceFileViewerPrintDocument(targetWindow.document, printableRoot);
		targetWindow.focus();
		await waitForFileViewerPrintWindowReady(targetWindow);
		if (autoPrint !== false) targetWindow.print();
		return true;
	} catch (error) {
		if (ownsPrintWindow) targetWindow.close();
		throw error;
	}
};
var handleFileViewerOperationActionError = (operation, error, { errorPrefixes, formatErrorMessage, getI18n, i18n, onError, onErrorMessage }) => {
	var _a;
	const context = {
		operation,
		error
	};
	onError === null || onError === void 0 || onError(context);
	if (formatErrorMessage && onErrorMessage) onErrorMessage(resolveFileViewerOperationActionErrorMessage({
		context,
		formatErrorMessage,
		prefixes: errorPrefixes,
		i18n: (_a = getI18n === null || getI18n === void 0 ? void 0 : getI18n()) !== null && _a !== void 0 ? _a : i18n
	}), context);
};
var createFileViewerOperationActionHandlers = ({ getBuffer, getFile, getUrl, getI18n, getFilename, getMimeType, getRenderedSource, getAdapter, getWatermarkInlineStyle, getPrintAvailable, beforeOperation, i18n, errorPrefixes, formatErrorMessage, onError, onErrorMessage }) => {
	const resolveI18n = () => {
		var _a;
		return (_a = getI18n === null || getI18n === void 0 ? void 0 : getI18n()) !== null && _a !== void 0 ? _a : i18n;
	};
	const getOriginalSource = () => {
		var _a, _b, _c, _d;
		const file = (_a = getFile === null || getFile === void 0 ? void 0 : getFile()) !== null && _a !== void 0 ? _a : null;
		return createFileViewerOriginalSourceState({
			buffer: (_b = getBuffer === null || getBuffer === void 0 ? void 0 : getBuffer()) !== null && _b !== void 0 ? _b : null,
			file,
			url: (_c = getUrl === null || getUrl === void 0 ? void 0 : getUrl()) !== null && _c !== void 0 ? _c : null,
			filename: getFilename(),
			mimeType: (_d = getMimeType === null || getMimeType === void 0 ? void 0 : getMimeType()) !== null && _d !== void 0 ? _d : getBlobMimeType(file)
		});
	};
	const getRenderedOperationInput = () => {
		var _a, _b;
		const filename = getFilename() || void 0;
		return {
			source: getRenderedSource(),
			adapter: (_a = getAdapter === null || getAdapter === void 0 ? void 0 : getAdapter()) !== null && _a !== void 0 ? _a : null,
			title: filename,
			filename,
			watermarkInlineStyle: (_b = getWatermarkInlineStyle === null || getWatermarkInlineStyle === void 0 ? void 0 : getWatermarkInlineStyle()) !== null && _b !== void 0 ? _b : void 0,
			beforeOperation,
			i18n: resolveI18n()
		};
	};
	return {
		async downloadOriginalFile() {
			try {
				return await executeFileViewerDownloadOperation({
					source: getOriginalSource(),
					beforeOperation,
					i18n: resolveI18n(),
					throwOnMissingSource: false
				});
			} catch (error) {
				handleFileViewerOperationActionError("download", error, {
					errorPrefixes,
					formatErrorMessage,
					getI18n,
					i18n,
					onError,
					onErrorMessage
				});
				return;
			}
		},
		async exportRenderedHtml() {
			try {
				return await executeFileViewerExportHtmlOperation(getRenderedOperationInput());
			} catch (error) {
				handleFileViewerOperationActionError("export-html", error, {
					errorPrefixes,
					formatErrorMessage,
					getI18n,
					i18n,
					onError,
					onErrorMessage
				});
				return;
			}
		},
		async printRenderedHtml(options = {}) {
			var _a, _b, _c;
			try {
				return await executeFileViewerPrintOperation({
					...getRenderedOperationInput(),
					...options,
					watermarkInlineStyle: (_b = (_a = options.watermarkInlineStyle) !== null && _a !== void 0 ? _a : getWatermarkInlineStyle === null || getWatermarkInlineStyle === void 0 ? void 0 : getWatermarkInlineStyle()) !== null && _b !== void 0 ? _b : void 0,
					printAvailable: (_c = getPrintAvailable === null || getPrintAvailable === void 0 ? void 0 : getPrintAvailable()) !== null && _c !== void 0 ? _c : true
				});
			} catch (error) {
				handleFileViewerOperationActionError("print", error, {
					errorPrefixes,
					formatErrorMessage,
					getI18n,
					i18n,
					onError,
					onErrorMessage
				});
				return;
			}
		},
		async printWithMask(options = {}) {
			var _a, _b, _c, _d, _e, _f, _g, _h;
			try {
				const source = getRenderedSource();
				if (!source) throw new Error(translateFileViewerMessage(resolveI18n(), "error.noExportContent"));
				const { openFileViewerPrintMaskDesignerAsync } = await import("./printMaskLoader-CUNBLtrG.js");
				const adapter = (_a = getAdapter === null || getAdapter === void 0 ? void 0 : getAdapter()) !== null && _a !== void 0 ? _a : null;
				const result = await openFileViewerPrintMaskDesignerAsync({
					root: source,
					pages: (_b = adapter === null || adapter === void 0 ? void 0 : adapter.getPrintMaskPages) === null || _b === void 0 ? void 0 : _b.call(adapter),
					i18n: resolveI18n(),
					color: (_c = options.mask) === null || _c === void 0 ? void 0 : _c.color,
					initialRegions: (_d = options.mask) === null || _d === void 0 ? void 0 : _d.regions,
					initialStamps: (_e = options.mask) === null || _e === void 0 ? void 0 : _e.stamps
				});
				if (!(result === null || result === void 0 ? void 0 : result.mask)) return;
				return await executeFileViewerPrintOperation({
					...getRenderedOperationInput(),
					...options,
					watermarkInlineStyle: (_g = (_f = options.watermarkInlineStyle) !== null && _f !== void 0 ? _f : getWatermarkInlineStyle === null || getWatermarkInlineStyle === void 0 ? void 0 : getWatermarkInlineStyle()) !== null && _g !== void 0 ? _g : void 0,
					mask: result.mask,
					printAvailable: (_h = getPrintAvailable === null || getPrintAvailable === void 0 ? void 0 : getPrintAvailable()) !== null && _h !== void 0 ? _h : true
				});
			} catch (error) {
				handleFileViewerOperationActionError("print", error, {
					errorPrefixes,
					formatErrorMessage,
					getI18n,
					i18n,
					onError,
					onErrorMessage
				});
				return;
			}
		}
	};
};
var createFileViewerPublicOperationActionHandlers = (input) => {
	const actions = createFileViewerOperationActionHandlers(input);
	return {
		async downloadOriginalFile() {
			await actions.downloadOriginalFile();
		},
		async exportRenderedHtml() {
			await actions.exportRenderedHtml();
		},
		async printRenderedHtml(options) {
			await actions.printRenderedHtml(options);
		},
		async printWithMask(options) {
			await actions.printWithMask(options);
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/lifecycle/operations.js
var FILE_VIEWER_LIFECYCLE_HOOKS = {
	"load-start": "onLoadStart",
	"load-complete": "onLoadComplete",
	"unload-start": "onUnloadStart",
	"unload-complete": "onUnloadComplete"
};
var FILE_VIEWER_LIFECYCLE_HOOK_ERROR_MESSAGE_PREFIX = "FileViewer";
var FILE_VIEWER_ZOOM_OPERATIONS = [
	"zoom-in",
	"zoom-out",
	"zoom-reset"
];
var FILE_VIEWER_ZOOM_BUTTON_OPERATIONS = {
	canZoomIn: "zoom-in",
	canZoomOut: "zoom-out",
	canReset: "zoom-reset"
};
var DEFAULT_FILE_VIEWER_TOOLBAR_ORDER = [
	"search",
	"zoom",
	"download",
	"print",
	"exportHtml",
	"theme"
];
var buildFileViewerLifecycleContext = ({ phase, version, source, filename, file, url, size, bufferSize, startedAt, duration, timestamp, reason }) => {
	var _a;
	const resolvedFilename = normalizeFilename((file === null || file === void 0 ? void 0 : file.name) || filename || url || "");
	const now = timestamp !== null && timestamp !== void 0 ? timestamp : Date.now();
	return {
		phase,
		type: getExtension(resolvedFilename),
		filename: resolvedFilename,
		source,
		url,
		file: file || void 0,
		size: (_a = size !== null && size !== void 0 ? size : file === null || file === void 0 ? void 0 : file.size) !== null && _a !== void 0 ? _a : bufferSize,
		version,
		timestamp: now,
		duration: duration !== null && duration !== void 0 ? duration : phase === "load-complete" && typeof startedAt === "number" ? now - startedAt : void 0,
		reason
	};
};
var resolveFileViewerLifecycleFallbackSource = ({ file, url } = {}) => {
	if (file) return { source: "file" };
	if (url) return {
		source: "url",
		sourceUrl: url
	};
	return { source: "empty" };
};
var createFileViewerLifecycleStateController = () => {
	let activeDocumentContext = null;
	const loadStartedAt = /* @__PURE__ */ new Map();
	return {
		markLoadStarted(version, timestamp = Date.now()) {
			loadStartedAt.set(version, timestamp);
		},
		clearLoadStarted(version) {
			loadStartedAt.delete(version);
		},
		getLoadStartedAt(version) {
			return loadStartedAt.get(version);
		},
		getActiveDocumentContext() {
			return activeDocumentContext;
		},
		setActiveDocumentContext(context) {
			activeDocumentContext = context;
		},
		clearActiveDocumentContext() {
			activeDocumentContext = null;
		},
		buildActiveUnloadContext(phase, context, reason = "replace", timestamp = Date.now()) {
			if (!context) return null;
			return {
				...context,
				phase,
				timestamp,
				reason
			};
		}
	};
};
var buildFileViewerOperationContext = (operation, lifecycleContext, timestamp = Date.now(), i18n) => {
	const { phase: _phase, ...context } = lifecycleContext;
	const labelKey = {
		download: "operation.download",
		print: "operation.print",
		"export-html": "operation.exportHtml",
		"zoom-in": "operation.zoomIn",
		"zoom-out": "operation.zoomOut",
		"zoom-reset": "operation.zoomReset"
	};
	return {
		...context,
		operation,
		label: translateFileViewerMessage(i18n, labelKey[operation]),
		timestamp
	};
};
var buildFileViewerOperationContextFromLifecycleState = ({ operation, lifecycleState, version, filename, bufferSize, currentFile, fallbackFile, fallbackUrl, timestamp, lifecycleTimestamp, i18n }) => {
	const activeContext = lifecycleState.getActiveDocumentContext();
	const fallbackSource = resolveFileViewerLifecycleFallbackSource({
		file: fallbackFile,
		url: fallbackUrl
	});
	return buildFileViewerOperationContext(operation, activeContext || buildFileViewerLifecycleContext({
		phase: "load-complete",
		version,
		source: fallbackSource.source,
		file: currentFile,
		filename,
		url: fallbackSource.sourceUrl,
		bufferSize,
		startedAt: lifecycleState.getLoadStartedAt(version),
		timestamp: lifecycleTimestamp
	}), timestamp, i18n);
};
var emitFileViewerComponentLifecycleEvent = (emit, context) => {
	if (context.phase === "load-start") {
		emit("load-start", context);
		return;
	}
	if (context.phase === "load-complete") {
		emit("load-complete", context);
		return;
	}
	if (context.phase === "unload-start") {
		emit("unload-start", context);
		return;
	}
	emit("unload-complete", context);
};
var resolveFileViewerBeforeOperationErrorMessage = ({ error, formatErrorMessage, prefix, i18n }) => {
	return formatErrorMessage(prefix || translateFileViewerMessage(i18n, "error.beforeOperation"), error, i18n);
};
var resolveFileViewerLifecycleHookErrorMessage = ({ context, prefix = FILE_VIEWER_LIFECYCLE_HOOK_ERROR_MESSAGE_PREFIX }) => {
	return `${prefix} ${context.phase} hook failed`;
};
var DEFAULT_FILE_VIEWER_LIFECYCLE_HOOK_ERROR_LOGGER = (message, error) => {
	if (typeof console !== "undefined" && typeof console.error === "function") console.error(message, error);
};
var reportFileViewerLifecycleHookError = ({ error, context, onLogError = DEFAULT_FILE_VIEWER_LIFECYCLE_HOOK_ERROR_LOGGER, prefix }) => {
	const message = resolveFileViewerLifecycleHookErrorMessage({
		context,
		prefix
	});
	onLogError === null || onLogError === void 0 || onLogError(message, error, context);
	return message;
};
var DEFAULT_FILE_VIEWER_OPERATION_ERROR_LOGGER = (error) => {
	if (typeof console !== "undefined" && typeof console.error === "function") console.error(error);
};
var reportFileViewerOperationError = ({ error, context, onLogError = DEFAULT_FILE_VIEWER_OPERATION_ERROR_LOGGER }) => {
	onLogError === null || onLogError === void 0 || onLogError(error, context);
	return error;
};
var runFileViewerActiveUnloadStart = ({ lifecycleState, reason = "replace", onLifecycle }) => {
	const context = lifecycleState.getActiveDocumentContext();
	const unloadContext = lifecycleState.buildActiveUnloadContext("unload-start", context, reason);
	if (unloadContext) onLifecycle === null || onLifecycle === void 0 || onLifecycle(unloadContext);
	return {
		reason,
		context,
		unloadContext
	};
};
var runFileViewerActiveUnloadComplete = ({ lifecycleState, context = null, reason = "replace", onLifecycle }) => {
	const unloadContext = lifecycleState.buildActiveUnloadContext("unload-complete", context, reason);
	if (unloadContext) onLifecycle === null || onLifecycle === void 0 || onLifecycle(unloadContext);
	return {
		reason,
		context,
		unloadContext
	};
};
var getFileViewerLifecycleHookName = (phase) => {
	return FILE_VIEWER_LIFECYCLE_HOOKS[phase];
};
var runFileViewerLifecycleHook = async (context, hooks, onError) => {
	const hook = hooks === null || hooks === void 0 ? void 0 : hooks[getFileViewerLifecycleHookName(context.phase)];
	if (!hook) return;
	try {
		await hook(context);
	} catch (error) {
		onError === null || onError === void 0 || onError(error, context);
	}
};
var getFileViewerBeforeOperationHooks = (options, operation) => {
	const toolbar = options === null || options === void 0 ? void 0 : options.toolbar;
	if (!toolbar || typeof toolbar !== "object") return [options === null || options === void 0 ? void 0 : options.beforeOperation];
	const specificHook = operation === "download" ? toolbar.beforeDownload : operation === "print" ? toolbar.beforePrint : operation === "export-html" ? toolbar.beforeExportHtml : void 0;
	return [
		options === null || options === void 0 ? void 0 : options.beforeOperation,
		toolbar.beforeOperation,
		specificHook
	];
};
var isToolbarActionMapAllowed = (map, operation) => (map === null || map === void 0 ? void 0 : map[operation]) !== false;
var isFileViewerToolbarOperationPermitted = (toolbar, operation) => {
	if (!toolbar || typeof toolbar !== "object") return true;
	return isToolbarActionMapAllowed(toolbar.permissions, operation);
};
var isFileViewerToolbarOperationVisible = (toolbar, operation) => isToolbarActionMapAllowed(toolbar.items, operation) && isToolbarActionMapAllowed(toolbar.permissions, operation);
var normalizeFileViewerToolbarItem = (item) => {
	if (item === "search" || item === "zoom" || item === "download" || item === "print") return item;
	if (item === "exportHtml" || item === "export-html") return "exportHtml";
	if (item === "theme") return "theme";
};
var resolveFileViewerToolbarOrder = (toolbar) => {
	const order = [];
	const seen = /* @__PURE__ */ new Set();
	const addItem = (item) => {
		const normalized = normalizeFileViewerToolbarItem(item);
		if (!normalized || seen.has(normalized)) return;
		seen.add(normalized);
		order.push(normalized);
	};
	if (Array.isArray(toolbar === null || toolbar === void 0 ? void 0 : toolbar.order)) toolbar.order.forEach(addItem);
	DEFAULT_FILE_VIEWER_TOOLBAR_ORDER.forEach(addItem);
	return order;
};
var hasAnyToolbarZoomOperation = (toolbar) => FILE_VIEWER_ZOOM_OPERATIONS.some((operation) => isFileViewerToolbarOperationVisible(toolbar, operation));
var applyToolbarPermissionsToAvailability = (availability, toolbar) => {
	if (!toolbar || typeof toolbar !== "object" || !toolbar.permissions) return availability;
	const next = cloneFileViewerOperationAvailability(availability);
	if (!isFileViewerToolbarOperationPermitted(toolbar, "download")) next.download = false;
	if (!isFileViewerToolbarOperationPermitted(toolbar, "print")) next.print = false;
	if (!isFileViewerToolbarOperationPermitted(toolbar, "export-html")) next.exportHtml = false;
	if (!isFileViewerToolbarOperationPermitted(toolbar, "zoom-in")) next.zoomIn = false;
	if (!isFileViewerToolbarOperationPermitted(toolbar, "zoom-out")) next.zoomOut = false;
	if (!isFileViewerToolbarOperationPermitted(toolbar, "zoom-reset")) next.zoomReset = false;
	next.zoom = next.zoom && (next.zoomIn || next.zoomOut || next.zoomReset);
	return next;
};
var runFileViewerBeforeOperation = async ({ context, options, onBefore, onCancel, onError }) => {
	onBefore === null || onBefore === void 0 || onBefore(context);
	try {
		if (!isFileViewerToolbarOperationPermitted(options === null || options === void 0 ? void 0 : options.toolbar, context.operation)) {
			onCancel === null || onCancel === void 0 || onCancel(context);
			return false;
		}
		for (const hook of getFileViewerBeforeOperationHooks(options, context.operation)) {
			if (!hook) continue;
			if (await hook(context) === false) {
				onCancel === null || onCancel === void 0 || onCancel(context);
				return false;
			}
		}
	} catch (error) {
		onError === null || onError === void 0 || onError(error, context);
		onCancel === null || onCancel === void 0 || onCancel(context);
		return false;
	}
	return true;
};
var dispatchFileViewerLifecycleEvent = ({ context, hooks, onChange, onError }) => {
	onChange === null || onChange === void 0 || onChange(context.phase, context);
	runFileViewerLifecycleHook(context, hooks, onError);
	return true;
};
var dispatchFileViewerOperationContextEvent = ({ context, onChange }) => {
	onChange === null || onChange === void 0 || onChange(context);
	return true;
};
var createFileViewerLifecycleActions = ({ lifecycleState, getOptions = () => void 0, onLifecycleChange, onLifecycleError, onOperationBefore, onOperationCancel, onOperationError }) => {
	const notifyLifecycle = (context) => {
		var _a;
		return dispatchFileViewerLifecycleEvent({
			context,
			hooks: (_a = getOptions()) === null || _a === void 0 ? void 0 : _a.hooks,
			onChange: onLifecycleChange,
			onError: onLifecycleError
		});
	};
	return {
		notifyLifecycle,
		notifyActiveUnloadStart(reason = "replace") {
			return runFileViewerActiveUnloadStart({
				lifecycleState,
				reason,
				onLifecycle: notifyLifecycle
			}).context;
		},
		notifyActiveUnloadComplete(context, reason = "replace") {
			return runFileViewerActiveUnloadComplete({
				lifecycleState,
				context,
				reason,
				onLifecycle: notifyLifecycle
			});
		},
		runBeforeOperation(context) {
			return runFileViewerBeforeOperation({
				context,
				options: getOptions(),
				onBefore: (nextContext) => {
					dispatchFileViewerOperationContextEvent({
						event: "operation-before",
						context: nextContext,
						onChange: onOperationBefore
					});
				},
				onCancel: (nextContext) => {
					dispatchFileViewerOperationContextEvent({
						event: "operation-cancel",
						context: nextContext,
						onChange: onOperationCancel
					});
				},
				onError: onOperationError
			});
		}
	};
};
var dispatchFileViewerOperationAvailabilityChange = ({ availability, onChange }) => {
	const payload = cloneFileViewerOperationAvailability(availability);
	onChange === null || onChange === void 0 || onChange(payload);
	return true;
};
var dispatchFileViewerZoomChange = ({ state, onChange }) => {
	onChange === null || onChange === void 0 || onChange(state);
	return true;
};
var createFileViewerToolbarActions = ({ getOperationAvailability, getToolbarDisabled = () => false, getZoomState, onOperationAvailabilityChange, onZoomChange }) => {
	return {
		notifyOperationAvailabilityChange(availability = getOperationAvailability()) {
			return dispatchFileViewerOperationAvailabilityChange({
				availability,
				onChange: onOperationAvailabilityChange
			});
		},
		notifyZoomChange(state = getZoomState()) {
			return dispatchFileViewerZoomChange({
				state,
				onChange: onZoomChange
			});
		},
		isZoomButtonDisabled(action) {
			return isFileViewerZoomButtonDisabled({
				action,
				availability: getOperationAvailability(),
				toolbarDisabled: getToolbarDisabled(),
				zoomState: getZoomState()
			});
		}
	};
};
var createFileViewerPublicApi = ({ getOperationAvailability, ...api }) => {
	return {
		...api,
		getOperationAvailability: () => cloneFileViewerOperationAvailability(getOperationAvailability())
	};
};
var createFileViewerToolbarZoomSyncSnapshot = (state) => [
	state.scale,
	state.label,
	state.canZoomIn,
	state.canZoomOut,
	state.canReset
];
var runFileViewerToolbarAvailabilitySync = ({ toolbarActions, availability }) => {
	return toolbarActions.notifyOperationAvailabilityChange(availability);
};
var runFileViewerToolbarZoomSync = ({ toolbarActions, state }) => {
	return toolbarActions.notifyZoomChange(state);
};
var createFileViewerToolbarControllerActionHandlers = ({ getAdapter = () => null, getBuffer = () => null, getExtension, getFile = () => null, getHasError = () => false, getLoading = () => false, getOptions, getSearchAvailable = () => true, getSourceUrl = () => null, getToolbar, getRenderedReady, getZoomState, zoomSyncState, onOperationAvailabilityChange, onZoomChange }) => {
	let currentToolbarState = null;
	const resolveToolbarState = () => {
		var _a, _b, _c, _d;
		currentToolbarState = resolveFileViewerToolbarState({
			extension: getExtension(),
			source: createFileViewerOriginalSourceState({
				buffer: (_a = getBuffer()) !== null && _a !== void 0 ? _a : null,
				file: (_b = getFile()) !== null && _b !== void 0 ? _b : null,
				url: (_c = getSourceUrl()) !== null && _c !== void 0 ? _c : null
			}),
			renderedReady: getRenderedReady(),
			hasError: getHasError(),
			adapter: (_d = getAdapter()) !== null && _d !== void 0 ? _d : null,
			zoomState: getZoomState(),
			toolbar: getToolbar(),
			options: getOptions === null || getOptions === void 0 ? void 0 : getOptions(),
			searchAvailable: getSearchAvailable(),
			loading: getLoading()
		});
		return currentToolbarState;
	};
	const getResolvedToolbarState = () => currentToolbarState !== null && currentToolbarState !== void 0 ? currentToolbarState : resolveToolbarState();
	const toolbarActions = createFileViewerToolbarActions({
		getOperationAvailability: () => getResolvedToolbarState().operationAvailability,
		getToolbarDisabled: () => getResolvedToolbarState().toolbarDisabled,
		getZoomState,
		onOperationAvailabilityChange,
		onZoomChange
	});
	return {
		resolveToolbarState,
		createZoomSyncSnapshot: () => createFileViewerToolbarZoomSyncSnapshot(zoomSyncState !== null && zoomSyncState !== void 0 ? zoomSyncState : getZoomState()),
		syncOperationAvailability: (availability) => runFileViewerToolbarAvailabilitySync({
			toolbarActions,
			availability
		}),
		syncZoomChange: (state) => runFileViewerToolbarZoomSync({
			toolbarActions,
			state
		}),
		isZoomButtonDisabled: toolbarActions.isZoomButtonDisabled
	};
};
var normalizeFileViewerToolbar = (options) => {
	const toolbar = options === null || options === void 0 ? void 0 : options.toolbar;
	if (toolbar === false) return {
		download: false,
		print: false,
		exportHtml: false,
		zoom: false,
		search: false,
		theme: false,
		order: resolveFileViewerToolbarOrder(void 0)
	};
	if (toolbar && typeof toolbar === "object") return {
		download: toolbar.download !== false && isFileViewerToolbarOperationVisible(toolbar, "download"),
		print: toolbar.print !== false && isFileViewerToolbarOperationVisible(toolbar, "print"),
		exportHtml: toolbar.exportHtml !== false && isFileViewerToolbarOperationVisible(toolbar, "export-html"),
		zoom: toolbar.zoom !== false && hasAnyToolbarZoomOperation(toolbar),
		search: toolbar.search !== false,
		theme: toolbar.theme !== false,
		order: resolveFileViewerToolbarOrder(toolbar),
		items: toolbar.items,
		permissions: toolbar.permissions,
		position: toolbar.position,
		beforeOperation: toolbar.beforeOperation,
		beforeDownload: toolbar.beforeDownload,
		beforePrint: toolbar.beforePrint,
		beforeExportHtml: toolbar.beforeExportHtml
	};
	return {
		download: true,
		print: true,
		exportHtml: true,
		zoom: true,
		search: true,
		theme: true,
		order: resolveFileViewerToolbarOrder(void 0)
	};
};
var resolveFileViewerOperationAvailability = ({ extension, hasOriginalSource, renderedReady, hasError = false, adapter, source, zoomState }) => {
	const hasRenderableOutput = renderedReady && !hasError;
	const hasSource = hasOriginalSource !== null && hasOriginalSource !== void 0 ? hasOriginalSource : source ? hasFileViewerOriginalSource(source) : false;
	const zoomEnabled = hasRenderableOutput && (zoomState.canZoomIn || zoomState.canZoomOut || zoomState.canReset);
	return {
		download: hasSource,
		print: hasRenderableOutput && resolvePrintAvailability(extension, adapter !== null && adapter !== void 0 ? adapter : null, renderedReady),
		exportHtml: hasRenderableOutput && (adapter === null || adapter === void 0 ? void 0 : adapter.exportHtml) !== false,
		zoom: zoomEnabled,
		zoomIn: zoomEnabled && zoomState.canZoomIn,
		zoomOut: zoomEnabled && zoomState.canZoomOut,
		zoomReset: zoomEnabled && zoomState.canReset
	};
};
var cloneFileViewerOperationAvailability = (availability) => ({
	download: availability.download,
	print: availability.print,
	exportHtml: availability.exportHtml,
	zoom: availability.zoom,
	zoomIn: availability.zoomIn,
	zoomOut: availability.zoomOut,
	zoomReset: availability.zoomReset
});
var resolveVisibleFileViewerToolbar = (toolbar, availability, searchEnabled = true) => {
	return {
		download: toolbar.download && availability.download,
		print: toolbar.print && availability.print,
		exportHtml: toolbar.exportHtml && availability.exportHtml,
		zoom: toolbar.zoom && availability.zoom,
		search: toolbar.search !== false && searchEnabled,
		theme: toolbar.theme !== false
	};
};
var hasVisibleFileViewerToolbarActions = (toolbar) => {
	return !!(toolbar.download || toolbar.print || toolbar.exportHtml || toolbar.zoom || toolbar.search || toolbar.theme);
};
var isFileViewerZoomButtonDisabled = ({ toolbarDisabled = false, availability, zoomState, action }) => {
	const operation = FILE_VIEWER_ZOOM_BUTTON_OPERATIONS[action];
	const operationAllowed = operation === "zoom-in" ? availability.zoomIn : operation === "zoom-out" ? availability.zoomOut : availability.zoomReset;
	return toolbarDisabled || !availability.zoom || !operationAllowed || !zoomState[action];
};
var isFileViewerToolbarDisabled = ({ loading = false, hasError = false }) => {
	return !!(loading || hasError);
};
var resolveFileViewerToolbarState = ({ toolbar, options, searchAvailable = true, loading = false, ...availabilityInput }) => {
	const operationAvailability = applyToolbarPermissionsToAvailability(resolveFileViewerOperationAvailability(availabilityInput), options === null || options === void 0 ? void 0 : options.toolbar);
	const visibleToolbar = resolveVisibleFileViewerToolbar(toolbar, operationAvailability, (options === null || options === void 0 ? void 0 : options.search) !== false && searchAvailable);
	return {
		operationAvailability,
		visibleToolbar,
		toolbarOrder: resolveFileViewerToolbarOrder(toolbar),
		showToolbar: hasVisibleFileViewerToolbarActions(visibleToolbar),
		toolbarPosition: resolveFileViewerToolbarPosition(options, availabilityInput.extension),
		toolbarDisabled: isFileViewerToolbarDisabled({
			loading,
			hasError: availabilityInput.hasError
		})
	};
};
var resolveFileViewerToolbarPosition = (options, extension) => {
	const toolbar = options === null || options === void 0 ? void 0 : options.toolbar;
	const position = toolbar && typeof toolbar === "object" ? toolbar.position : "auto";
	if (position === "top" || position === "top-center" || position === "bottom-right") return position;
	return extension === "pdf" ? "bottom-right" : "top";
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/output/snapshotDownload.js
var isFileViewerSnapshotDownloadPermitted = (options) => isFileViewerToolbarOperationPermitted(options === null || options === void 0 ? void 0 : options.toolbar, "download") && isFileViewerToolbarOperationPermitted(options === null || options === void 0 ? void 0 : options.toolbar, "export-html");
/** Renderer-local downloads still use the owning viewer's hooks and request version. */
var createFileViewerSnapshotDownload = ({ getOptions, isCurrent, beforeDownload }) => async (create) => {
	var _a, _b;
	const allowed = () => isCurrent() && isFileViewerSnapshotDownloadPermitted(getOptions());
	if (!allowed() || !await beforeDownload() || !allowed()) return false;
	const watermark = (_a = getOptions()) === null || _a === void 0 ? void 0 : _a.watermark;
	const watermarkState = JSON.stringify(watermark);
	const result = await create(watermark && typeof watermark === "object" ? Object.freeze({ ...watermark }) : watermark);
	if (!allowed() || JSON.stringify((_b = getOptions()) === null || _b === void 0 ? void 0 : _b.watermark) !== watermarkState) return false;
	triggerFileViewerBlobDownload(result.blob, result.filename);
	return true;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/registry/registry.js
var autoRendererBucketKey = "__flyfish_file_viewer_auto_renderer_presets__";
var getAutoRendererBucket = () => {
	const host = globalThis;
	if (!host[autoRendererBucketKey]) host[autoRendererBucketKey] = {
		version: 0,
		presets: /* @__PURE__ */ new Map()
	};
	return host[autoRendererBucketKey];
};
var normalizeDefinition = (definition) => {
	var _a;
	return {
		...definition,
		extensions: definition.extensions.map(normalizeFileExtension),
		enhancesExtensions: (_a = definition.enhancesExtensions) === null || _a === void 0 ? void 0 : _a.map(normalizeFileExtension)
	};
};
var createRendererRegistry = (initialDefinitions = DEFAULT_RENDERER_DEFINITIONS) => {
	const byId = /* @__PURE__ */ new Map();
	const byExtension = /* @__PURE__ */ new Map();
	const register = (definition) => {
		const normalized = normalizeDefinition(definition);
		const existing = byId.get(normalized.id);
		if (existing) existing.extensions.forEach((extension) => {
			var _a;
			if (((_a = byExtension.get(extension)) === null || _a === void 0 ? void 0 : _a.id) === existing.id) byExtension.delete(extension);
		});
		byId.set(normalized.id, normalized);
		normalized.extensions.forEach((extension) => {
			const owner = byExtension.get(extension);
			if (owner && owner.id !== normalized.id) throw new Error(`File extension "${extension}" is already registered by renderer "${owner.id}".`);
			byExtension.set(extension, normalized);
		});
	};
	initialDefinitions.forEach(register);
	return {
		register,
		unregister(id) {
			const existing = byId.get(id);
			if (!existing) return false;
			existing.extensions.forEach((extension) => {
				var _a;
				if (((_a = byExtension.get(extension)) === null || _a === void 0 ? void 0 : _a.id) === id) byExtension.delete(extension);
			});
			byId.delete(id);
			return true;
		},
		getById(id) {
			return byId.get(id);
		},
		getByExtension(extension) {
			return byExtension.get(normalizeFileExtension(extension));
		},
		hasExtension(extension) {
			return byExtension.has(normalizeFileExtension(extension));
		},
		list() {
			return Array.from(byId.values());
		},
		listExtensions() {
			return Array.from(byExtension.keys()).sort();
		}
	};
};
var collectRendererEnhancementClaims = (registry, definitions) => {
	var _a, _b;
	const normalizedDefinitions = definitions.map(normalizeDefinition);
	const incomingDefinitionsById = /* @__PURE__ */ new Map();
	normalizedDefinitions.forEach((definition) => {
		incomingDefinitionsById.set(definition.id, definition);
	});
	const claimsByOwnerAndExtension = /* @__PURE__ */ new Map();
	for (const definition of registry.list().map(normalizeDefinition)) {
		const ownerId = definition.enhancesRendererId;
		if (!ownerId || !((_a = definition.enhancesExtensions) === null || _a === void 0 ? void 0 : _a.length)) continue;
		const ownedExtensions = new Set(definition.extensions);
		definition.enhancesExtensions.forEach((extension) => {
			var _a;
			if (ownedExtensions.has(extension) && ((_a = registry.getByExtension(extension)) === null || _a === void 0 ? void 0 : _a.id) === definition.id) claimsByOwnerAndExtension.set(`${ownerId}\u0000${extension}`, {
				enhancerId: definition.id,
				ownerId,
				extension
			});
		});
	}
	for (const definition of normalizedDefinitions) {
		const declaresOwner = definition.enhancesRendererId !== void 0;
		const declaresExtensions = definition.enhancesExtensions !== void 0;
		if (declaresOwner !== declaresExtensions) throw new Error(`Renderer "${definition.id}" enhancement must declare both enhancesRendererId and enhancesExtensions.`);
		if (!declaresOwner || !declaresExtensions) continue;
		const ownerId = ((_b = definition.enhancesRendererId) === null || _b === void 0 ? void 0 : _b.trim()) || "";
		const enhancedExtensions = definition.enhancesExtensions || [];
		if (!ownerId) throw new Error(`Renderer "${definition.id}" enhancement owner must not be empty.`);
		if (!enhancedExtensions.length) throw new Error(`Renderer "${definition.id}" enhancement extensions must not be empty.`);
		if (ownerId === definition.id) throw new Error(`Renderer "${definition.id}" cannot enhance its own definition.`);
		const directlyOwnedExtensions = new Set(definition.extensions);
		for (const extension of enhancedExtensions) {
			if (!extension) throw new Error(`Renderer "${definition.id}" enhancement extension must not be empty.`);
			if (directlyOwnedExtensions.has(extension)) throw new Error(`Renderer "${definition.id}" must not own and enhance extension "${extension}" simultaneously.`);
			const key = `${ownerId}\u0000${extension}`;
			const existing = claimsByOwnerAndExtension.get(key);
			if (existing && existing.enhancerId !== definition.id) throw new Error(`Renderer enhancement collision: extension "${extension}" from "${ownerId}" is claimed by both "${existing.enhancerId}" and "${definition.id}".`);
			claimsByOwnerAndExtension.set(key, {
				enhancerId: definition.id,
				ownerId,
				extension
			});
		}
	}
	for (const claim of claimsByOwnerAndExtension.values()) {
		const owner = incomingDefinitionsById.get(claim.ownerId) || registry.getById(claim.ownerId);
		if (!owner) throw new Error(`Renderer "${claim.enhancerId}" enhances unknown renderer "${claim.ownerId}".`);
		const ownerExtensions = new Set(owner.extensions.map(normalizeFileExtension));
		const installedExtensionOwner = registry.getByExtension(claim.extension);
		const alreadyInstalled = (installedExtensionOwner === null || installedExtensionOwner === void 0 ? void 0 : installedExtensionOwner.id) === claim.enhancerId;
		if (!ownerExtensions.has(claim.extension) && !alreadyInstalled) throw new Error(`Renderer "${claim.enhancerId}" cannot enhance extension "${claim.extension}" because renderer "${claim.ownerId}" does not own it.`);
	}
	return {
		claims: Array.from(claimsByOwnerAndExtension.values()),
		normalizedDefinitions
	};
};
var createRendererDefinitionInstallPlan = (registry, definitions) => {
	const { claims, normalizedDefinitions } = collectRendererEnhancementClaims(registry, definitions);
	const claimedExtensionsByOwnerId = /* @__PURE__ */ new Map();
	claims.forEach((claim) => {
		const extensions = claimedExtensionsByOwnerId.get(claim.ownerId) || /* @__PURE__ */ new Set();
		extensions.add(claim.extension);
		claimedExtensionsByOwnerId.set(claim.ownerId, extensions);
	});
	const applyClaims = (definition) => {
		var _a, _b;
		const normalized = normalizeDefinition(definition);
		const extensions = new Set(normalized.extensions);
		(_a = normalized.enhancesExtensions) === null || _a === void 0 || _a.forEach((extension) => extensions.add(extension));
		(_b = claimedExtensionsByOwnerId.get(normalized.id)) === null || _b === void 0 || _b.forEach((extension) => extensions.delete(extension));
		return {
			...normalized,
			extensions: Array.from(extensions)
		};
	};
	const incomingDefinitionIds = new Set(normalizedDefinitions.map((definition) => definition.id));
	const existingOwnerDefinitions = Array.from(claimedExtensionsByOwnerId.keys()).filter((ownerId) => !incomingDefinitionIds.has(ownerId)).map((ownerId) => registry.getById(ownerId)).filter((definition) => !!definition).map(applyClaims);
	const regularDefinitions = normalizedDefinitions.filter((definition) => definition.enhancesRendererId === void 0).map(applyClaims);
	const enhancerDefinitions = normalizedDefinitions.filter((definition) => definition.enhancesRendererId !== void 0).map(applyClaims);
	const plannedDefinitions = [
		...existingOwnerDefinitions,
		...regularDefinitions,
		...enhancerDefinitions
	];
	const validationRegistry = createRendererRegistry(registry.list());
	plannedDefinitions.forEach((definition) => validationRegistry.register(definition));
	return { definitions: plannedDefinitions };
};
var createEnhancementAwareInstallRegistry = (registry) => ({
	register(definition) {
		createRendererDefinitionInstallPlan(registry, [definition]).definitions.forEach((plannedDefinition) => registry.register(plannedDefinition));
	},
	unregister: (id) => registry.unregister(id),
	getById: (id) => registry.getById(id),
	getByExtension: (extension) => registry.getByExtension(extension),
	hasExtension: (extension) => registry.hasExtension(extension),
	list: () => registry.list(),
	listExtensions: () => registry.listExtensions()
});
var isRendererPreset = (input) => {
	return !!input && typeof input === "object" && !Array.isArray(input) && Array.isArray(input.renderers);
};
var collectFileViewerRendererPlugins = (input) => {
	if (!input) return [];
	if (Array.isArray(input)) return input.flatMap((item) => collectFileViewerRendererPlugins(item));
	if (isRendererPreset(input)) return collectFileViewerRendererPlugins(input.renderers);
	return [input];
};
var resolveAutoRendererPresetId = (input, options = {}) => {
	if (options.id) return options.id;
	if (options.packageName) return options.packageName;
	if (isRendererPreset(input)) return input.id;
	if (!Array.isArray(input) && input && typeof input === "object" && "id" in input) return String(input.id);
	return "file-viewer-auto-renderers";
};
var registerFileViewerAutoRendererPreset = (input, options = {}) => {
	const bucket = getAutoRendererBucket();
	const id = resolveAutoRendererPresetId(input, options);
	const existing = bucket.presets.get(id);
	if ((existing === null || existing === void 0 ? void 0 : existing.input) !== input || existing.packageName !== options.packageName) {
		bucket.presets.set(id, {
			id,
			packageName: options.packageName,
			input
		});
		bucket.version += 1;
	}
	return () => {
		unregisterFileViewerAutoRendererPreset(id);
	};
};
var unregisterFileViewerAutoRendererPreset = (id) => {
	const bucket = getAutoRendererBucket();
	const removed = bucket.presets.delete(id);
	if (removed) bucket.version += 1;
	return removed;
};
var listFileViewerAutoRendererPresets = () => Array.from(getAutoRendererBucket().presets.values()).map((entry) => entry.input);
var findFileViewerAutoRendererPreset = (id) => {
	var _a;
	const bucket = getAutoRendererBucket();
	const direct = bucket.presets.get(id);
	if (direct) return direct.input;
	const packageSuffix = id.startsWith("@file-viewer/preset-") ? id : `@file-viewer/preset-${id}`;
	return (_a = Array.from(bucket.presets.values()).find((entry) => entry.packageName === packageSuffix || entry.id === packageSuffix)) === null || _a === void 0 ? void 0 : _a.input;
};
/**
* Normalizes `options.preset` / `options.presets` into renderer plugin inputs.
*
* Passing a preset object is the most portable integration style because it
* works in any bundler. String selectors intentionally only resolve presets
* that are already registered by a side-effect import or by build tooling.
*/
var resolveFileViewerRendererPresetInputs = (input) => {
	if (!input) return [];
	if (typeof input === "string") {
		const preset = findFileViewerAutoRendererPreset(input);
		return preset ? [preset] : [];
	}
	if (Array.isArray(input)) return input.flatMap((item) => resolveFileViewerRendererPresetInputs(item));
	return [input];
};
var installFileViewerRendererPlugins = async ({ registry, plugins, registerHandler }) => {
	var _a, _b;
	const pluginList = Array.from(plugins);
	createRendererDefinitionInstallPlan(registry, pluginList.flatMap((plugin) => [...plugin.definitions || []])).definitions.forEach((definition) => registry.register(definition));
	const installRegistry = createEnhancementAwareInstallRegistry(registry);
	for (const plugin of pluginList) {
		(_a = plugin.handlers) === null || _a === void 0 || _a.forEach((registration) => {
			registerHandler === null || registerHandler === void 0 || registerHandler(registration);
		});
		await ((_b = plugin.install) === null || _b === void 0 ? void 0 : _b.call(plugin, {
			registry: installRegistry,
			registerHandler
		}));
	}
	return registry;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/rendering/dispatcher.js
var resolveFileViewerRendererRedirectId = (error) => {
	if (!error || typeof error !== "object" || !("actualRendererId" in error)) return;
	return String(error.actualRendererId || "").trim() || void 0;
};
var createFileViewerRendererDispatcher = ({ registry = createRendererRegistry(DEFAULT_RENDERER_DEFINITIONS), handlers, fallbackHandler, fallbackKey = "error" }) => {
	const handlersByRendererId = Array.from(handlers).reduce((result, entry) => {
		result.set(entry.rendererId, entry.handler);
		return result;
	}, /* @__PURE__ */ new Map());
	const handlersByExtension = /* @__PURE__ */ new Map();
	const missingRendererIds = [];
	registry.list().forEach((definition) => {
		const handler = handlersByRendererId.get(definition.id);
		if (!handler) {
			missingRendererIds.push(definition.id);
			return;
		}
		definition.extensions.forEach((extension) => {
			handlersByExtension.set(normalizeFileExtension(extension), handler);
		});
	});
	if (fallbackHandler && fallbackKey) handlersByExtension.set(normalizeFileExtension(fallbackKey), fallbackHandler);
	const get = (extension) => {
		return handlersByExtension.get(normalizeFileExtension(extension));
	};
	return {
		handlersByRendererId,
		handlersByExtension,
		missingRendererIds,
		get,
		resolve(extension) {
			return get(extension) || (fallbackKey ? get(fallbackKey) : void 0);
		},
		has(extension) {
			return handlersByExtension.has(normalizeFileExtension(extension));
		},
		listExtensions() {
			return Array.from(handlersByExtension.keys()).sort();
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/viewer/state.js
/**
* Renderers can attach a localized, user-safe explanation without replacing
* the original error object that hosts use for diagnostics and recovery.
*/
var FILE_VIEWER_ERROR_MESSAGE = "fileViewerErrorMessage";
var attachFileViewerErrorMessage = (error, message) => {
	const normalizedMessage = message.trim();
	if (!normalizedMessage) return error;
	if (error && typeof error === "object") try {
		Object.defineProperty(error, FILE_VIEWER_ERROR_MESSAGE, {
			configurable: true,
			value: normalizedMessage
		});
		return error;
	} catch {}
	const presented = new Error(normalizedMessage);
	Object.defineProperty(presented, FILE_VIEWER_ERROR_MESSAGE, {
		configurable: true,
		value: normalizedMessage
	});
	Object.defineProperty(presented, "cause", {
		configurable: true,
		value: error
	});
	return presented;
};
Object.freeze({
	downloading: "正在下载文件资源...",
	streamingPdf: "正在建立 PDF 流式预览...",
	reading: "正在解析文件内容..."
});
var resolveFileViewerPreviewMessages = (i18n) => Object.freeze({
	downloading: translateFileViewerMessage(i18n, "preview.downloading"),
	streamingPdf: translateFileViewerMessage(i18n, "preview.streamingPdf"),
	reading: translateFileViewerMessage(i18n, "preview.reading")
});
var DEFAULT_FILE_VIEWER_STATE_THEME = Object.freeze({
	accent: "#5f6f82",
	soft: "rgba(95, 111, 130, 0.12)",
	badge: "DOC",
	label: "文件内容",
	hint: "正在整理内容结构并生成预览。"
});
var extensionLabel = (extension, i18n) => {
	const normalized = normalizeFileExtension(extension);
	if (normalized) return `.${normalized}`;
	const locale = resolveFileViewerLocale(i18n);
	if (locale === "zh-CN") return "当前文件";
	if (locale === "ja-JP") return "現在のファイル";
	if (locale === "de-DE") return "aktuelle Datei";
	return "current file";
};
var rendererPackageById = {
	"office-word-openxml": "@file-viewer/renderer-word",
	"office-word-binary": "@file-viewer/renderer-word",
	"office-presentation-binary": "@file-viewer/renderer-presentation",
	"office-presentation": "@file-viewer/renderer-presentation",
	"open-document": "@file-viewer/renderer-word",
	"spreadsheet-openxml": "@file-viewer/renderer-spreadsheet",
	pdf: "@file-viewer/renderer-pdf",
	ofd: "@file-viewer/renderer-ofd",
	typst: "@file-viewer/renderer-typst",
	archive: "@file-viewer/renderer-archive",
	chm: "@file-viewer/renderer-chm",
	email: "@file-viewer/renderer-email",
	eda: "@file-viewer/renderer-eda",
	cad: "@file-viewer/renderer-cad",
	model: "@file-viewer/renderer-3d",
	geo: "@file-viewer/renderer-geo",
	drawing: "@file-viewer/renderer-drawing",
	mindmap: "@file-viewer/renderer-mindmap",
	epub: "@file-viewer/renderer-epub",
	umd: "@file-viewer/renderer-epub",
	image: "@file-viewer/renderer-image",
	markdown: "@file-viewer/renderer-text",
	code: "@file-viewer/renderer-text",
	video: "@file-viewer/renderer-media",
	audio: "@file-viewer/renderer-media",
	"data-asset": "@file-viewer/renderer-data"
};
var officeRendererIds = /* @__PURE__ */ new Set([
	"office-word-openxml",
	"office-word-binary",
	"office-presentation-binary",
	"office-presentation",
	"open-document",
	"spreadsheet-openxml",
	"pdf",
	"ofd"
]);
var liteRendererIds = /* @__PURE__ */ new Set([
	"image",
	"markdown",
	"code",
	"video",
	"audio"
]);
var engineeringRendererIds = /* @__PURE__ */ new Set([
	"typst",
	"archive",
	"eda",
	"cad",
	"model",
	"geo",
	"drawing",
	"mindmap",
	"data-asset"
]);
var resolvePresetHint = (definition) => {
	if (officeRendererIds.has(definition.id)) return {
		packageName: "@file-viewer/preset-office",
		vitePreset: "office",
		label: "Office preset"
	};
	if (engineeringRendererIds.has(definition.id)) return {
		packageName: "@file-viewer/preset-engineering",
		vitePreset: "engineering",
		label: "Engineering preset"
	};
	if (liteRendererIds.has(definition.id)) return {
		packageName: "@file-viewer/preset-lite",
		vitePreset: "lite",
		label: "Lite preset"
	};
	return {
		packageName: "@file-viewer/preset-all",
		vitePreset: "all",
		label: "Full preset"
	};
};
var resolveFileViewerRendererInstallHint = (extension = "") => {
	const normalized = normalizeFileExtension(extension);
	const definition = DEFAULT_RENDERER_DEFINITIONS.find((item) => item.extensions.map(normalizeFileExtension).includes(normalized));
	if (!definition) return null;
	const preset = resolvePresetHint(definition);
	return {
		extension: normalized,
		rendererId: definition.id,
		rendererLabel: definition.label,
		rendererCategory: definition.category,
		rendererPackage: rendererPackageById[definition.id],
		presetPackage: preset.packageName,
		vitePreset: preset.vitePreset,
		presetLabel: preset.label
	};
};
var createFileViewerStateDescriptor = ({ state, extension = "", title, message, description, theme = DEFAULT_FILE_VIEWER_STATE_THEME, recoverable }) => ({
	state,
	extension: normalizeFileExtension(extension),
	title,
	message,
	description,
	theme,
	recoverable
});
var createFileViewerUnsupportedState = (extension = "", theme = DEFAULT_FILE_VIEWER_STATE_THEME, i18n) => {
	const label = extensionLabel(extension, i18n);
	const installHint = resolveFileViewerRendererInstallHint(extension);
	if (installHint) {
		const locale = resolveFileViewerLocale(i18n);
		const localeRendererTip = installHint.rendererPackage ? locale === "zh-CN" ? `；如果需要极致裁剪，也可以只安装 ${installHint.rendererPackage}` : locale === "ja-JP" ? `；厳密に最小構成へ絞る場合は ${installHint.rendererPackage} のみをインストールすることもできます` : locale === "de-DE" ? `; für eine strikt minimale Konfiguration installieren Sie nur ${installHint.rendererPackage}` : `; for a strict custom cut, install only ${installHint.rendererPackage}` : "";
		return createFileViewerStateDescriptor({
			state: "unsupported",
			extension,
			title: translateFileViewerMessage(i18n, "state.unsupported.install.title"),
			message: translateFileViewerMessage(i18n, "state.unsupported.install.message", {
				extension: label,
				rendererLabel: installHint.rendererLabel
			}),
			description: translateFileViewerMessage(i18n, "state.unsupported.install.description", {
				extension: label,
				rendererLabel: installHint.rendererLabel,
				presetPackage: installHint.presetPackage,
				vitePreset: installHint.vitePreset,
				rendererTip: localeRendererTip
			}),
			theme,
			recoverable: true
		});
	}
	return createFileViewerStateDescriptor({
		state: "unsupported",
		extension,
		title: translateFileViewerMessage(i18n, "state.unsupported.title"),
		message: translateFileViewerMessage(i18n, "state.unsupported.message", { extension: label }),
		description: translateFileViewerMessage(i18n, "state.unsupported.description"),
		theme,
		recoverable: true
	});
};
var FILE_VIEWER_KNOWN_ERROR_MESSAGE_KEYS = {
	"Blob is not available in the current execution environment.": "error.blobUnavailable",
	"Unsupported file source input.": "error.sourceUnsupported",
	"Failed to read file as ArrayBuffer.": "error.fileReadArrayBuffer",
	"Failed to read file as data URL.": "error.fileReadDataUrl",
	"Failed to read file as text.": "error.fileReadText",
	"Unable to read image data URL.": "error.imageDataUrlRead",
	"文件不是有效的 DOCX/OOXML 压缩包，可能下载不完整或被服务端错误内容替换，请重新上传或检查文件源。": "word.error.invalidDocx",
	"ODF 文件缺少 content.xml": "word.error.missingOdfContent",
	"ODF 文件缺少 content.xml。": "word.error.missingOdfContent",
	"ODF XML 解析失败": "word.error.odfXmlParseFailed",
	"ODF XML 解析失败。": "word.error.odfXmlParseFailed",
	"OFD 文件中没有可渲染的文档": "ofd.error.empty",
	"OFD 文件解析失败": "ofd.error.parseFailed",
	"IndexedDB 不可用": "archive.error.indexedDbUnavailable",
	"Web Worker is not supported by this browser.": "archive.error.workerUnsupported"
};
var resolveKnownFileViewerErrorMessage = (message, i18n) => {
	const key = FILE_VIEWER_KNOWN_ERROR_MESSAGE_KEYS[message.trim()];
	return key ? translateFileViewerMessage(i18n, key) : message;
};
var readFileViewerErrorProperty = (error, key) => {
	try {
		return error[key];
	} catch {
		return;
	}
};
var normalizeFileViewerErrorMessage = (error, i18n) => {
	if (error && typeof error === "object") {
		const presentedMessage = readFileViewerErrorProperty(error, FILE_VIEWER_ERROR_MESSAGE);
		if (typeof presentedMessage === "string" && presentedMessage.trim()) return resolveKnownFileViewerErrorMessage(presentedMessage, i18n);
	}
	if (error instanceof Error) return resolveKnownFileViewerErrorMessage(error.message, i18n);
	if (typeof error === "string") return resolveKnownFileViewerErrorMessage(error, i18n);
	if (error === void 0 || error === null) return translateFileViewerMessage(i18n, "error.unknown");
	if (typeof error === "object") {
		const message = readFileViewerErrorProperty(error, "message");
		if (typeof message === "string" && message.trim()) return resolveKnownFileViewerErrorMessage(message, i18n);
		const reason = readFileViewerErrorProperty(error, "reason");
		if (reason !== void 0 && reason !== error) return normalizeFileViewerErrorMessage(reason, i18n);
	}
	const fallback = String(error);
	return fallback === "[object Object]" ? translateFileViewerMessage(i18n, "error.unknown") : fallback;
};
var formatFileViewerErrorMessage = (prefix, error, i18n) => {
	const detail = normalizeFileViewerErrorMessage(error, i18n);
	if (!detail) return prefix;
	return resolveFileViewerLocale(i18n) === "zh-CN" || resolveFileViewerLocale(i18n) === "ja-JP" ? `${prefix}：${detail}` : `${prefix}: ${detail}`;
};
var createFileViewerErrorState = (extension = "", error = void 0, theme = DEFAULT_FILE_VIEWER_STATE_THEME, i18n) => createFileViewerStateDescriptor({
	state: "error",
	extension,
	title: translateFileViewerMessage(i18n, "state.error.title"),
	message: normalizeFileViewerErrorMessage(error, i18n),
	theme,
	recoverable: true
});
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/source/loading.js
var DEFAULT_PDF_RANGE_CHUNK_SIZE = 65536;
var DEFAULT_FILE_VIEWER_STREAMING_PDF_FILENAME = "preview.pdf";
var resolveFileViewerPreviewLoadErrorMessage = ({ kind, error, formatErrorMessage, prefixes, i18n }) => {
	var _a;
	const fallbackPrefix = kind === "local" ? translateFileViewerMessage(i18n, "error.localRead") : kind === "stream" ? translateFileViewerMessage(i18n, "error.stream") : translateFileViewerMessage(i18n, "error.load");
	return formatErrorMessage((_a = prefixes === null || prefixes === void 0 ? void 0 : prefixes[kind]) !== null && _a !== void 0 ? _a : fallbackPrefix, error, i18n);
};
var resolveFileViewerMissingRemoteDataErrorMessage = ({ message, i18n } = {}) => message || translateFileViewerMessage(i18n, "error.remoteDownload");
var DEFAULT_FILE_VIEWER_PREVIEW_LOAD_ERROR_LOGGER = (error) => {
	if (typeof console !== "undefined" && typeof console.error === "function") console.error(error);
};
var reportFileViewerPreviewLoadError = ({ onLogError = DEFAULT_FILE_VIEWER_PREVIEW_LOAD_ERROR_LOGGER, onErrorMessage, ...messageInput }) => {
	onLogError === null || onLogError === void 0 || onLogError(messageInput.error);
	const message = resolveFileViewerPreviewLoadErrorMessage(messageInput);
	onErrorMessage === null || onErrorMessage === void 0 || onErrorMessage(message);
	return message;
};
var reportFileViewerMissingRemoteData = ({ onErrorMessage, ...messageInput } = {}) => {
	const message = resolveFileViewerMissingRemoteDataErrorMessage(messageInput);
	onErrorMessage === null || onErrorMessage === void 0 || onErrorMessage(message);
	return message;
};
var createFileViewerRequestController = () => {
	let version = 0;
	let activeAbortController = null;
	return {
		get version() {
			return version;
		},
		createVersion() {
			version += 1;
			activeAbortController === null || activeAbortController === void 0 || activeAbortController.abort();
			activeAbortController = null;
			return version;
		},
		isCurrent(nextVersion) {
			return nextVersion === version;
		},
		createAbortController() {
			activeAbortController = typeof AbortController === "function" ? new AbortController() : null;
			return activeAbortController;
		},
		clearAbortController(controller) {
			if (activeAbortController === controller) activeAbortController = null;
		},
		abort() {
			activeAbortController === null || activeAbortController === void 0 || activeAbortController.abort();
			activeAbortController = null;
		}
	};
};
var createFileViewerRequestScope = (requestController = createFileViewerRequestController()) => {
	return {
		requestController,
		getCurrentVersion: () => requestController.version,
		isCurrentRequest: (version) => requestController.isCurrent(version)
	};
};
var isFileViewerAbortError = (error) => {
	if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") return true;
	if (!error || typeof error !== "object") return false;
	const candidate = error;
	return candidate.__CANCEL__ === true || candidate.code === "ERR_CANCELED" || candidate.name === "AbortError" || candidate.name === "CanceledError";
};
var hasFileViewerPreviewSource = ({ file, url } = {}) => {
	return !!file || !!url;
};
var resolveFileViewerPreviewRequestReason = (input = {}) => {
	return hasFileViewerPreviewSource(input) ? "replace" : "reset";
};
var FILE_VIEWER_HIERARCHICAL_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
var FILE_VIEWER_SCHEME_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
var findFileViewerUrlSuffixIndex = (value) => {
	const queryIndex = value.indexOf("?");
	const hashIndex = value.indexOf("#");
	if (queryIndex === -1) return hashIndex;
	if (hashIndex === -1) return queryIndex;
	return Math.min(queryIndex, hashIndex);
};
var encodeFileViewerUrlPathSegment = (segment) => {
	if (!segment) return segment;
	let decoded = segment;
	try {
		decoded = decodeURIComponent(segment);
	} catch {}
	return encodeURIComponent(decoded).replace(/%3A/gi, ":").replace(/%40/gi, "@").replace(/%24/g, "$").replace(/%26/g, "&").replace(/%2B/gi, "+").replace(/%2C/gi, ",").replace(/%3B/gi, ";").replace(/%3D/gi, "=");
};
var normalizeFileViewerUrlPathname = (pathname) => {
	return pathname.split("/").map(encodeFileViewerUrlPathSegment).join("/");
};
var splitFileViewerUrlPathPrefix = (pathPart) => {
	if (pathPart.startsWith("//")) {
		const pathStart = pathPart.indexOf("/", 2);
		return pathStart === -1 ? {
			prefix: pathPart,
			pathname: ""
		} : {
			prefix: pathPart.slice(0, pathStart),
			pathname: pathPart.slice(pathStart)
		};
	}
	const hierarchical = pathPart.match(FILE_VIEWER_HIERARCHICAL_URL_PATTERN);
	if (hierarchical) {
		const pathStart = pathPart.indexOf("/", hierarchical[0].length);
		return pathStart === -1 ? {
			prefix: pathPart,
			pathname: ""
		} : {
			prefix: pathPart.slice(0, pathStart),
			pathname: pathPart.slice(pathStart)
		};
	}
	if (FILE_VIEWER_SCHEME_URL_PATTERN.test(pathPart)) return {
		prefix: pathPart,
		pathname: ""
	};
	return {
		prefix: "",
		pathname: pathPart
	};
};
var normalizeFileViewerSourceUrl = (sourceUrl) => {
	const trimmed = sourceUrl === null || sourceUrl === void 0 ? void 0 : sourceUrl.trim();
	if (!trimmed) return null;
	const suffixIndex = findFileViewerUrlSuffixIndex(trimmed);
	const pathPart = suffixIndex === -1 ? trimmed : trimmed.slice(0, suffixIndex);
	const suffix = suffixIndex === -1 ? "" : trimmed.slice(suffixIndex);
	const { prefix, pathname } = splitFileViewerUrlPathPrefix(pathPart);
	if (!pathname) return `${prefix}${suffix}`;
	return `${prefix}${normalizeFileViewerUrlPathname(pathname)}${suffix}`;
};
var createFileViewerEmptyPreviewState = () => {
	return {
		filename: "",
		file: null,
		buffer: null,
		sourceUrl: null,
		renderedReady: false,
		progressiveReady: false
	};
};
var createFileViewerPreviewRequestResetState = () => {
	return {
		file: null,
		buffer: null,
		sourceUrl: null,
		progressiveReady: false
	};
};
var createFileViewerPreviewStateTarget = ({ filename, file, buffer, sourceUrl, renderedReady, progressiveReady }) => {
	return {
		get filename() {
			return filename.get();
		},
		set filename(value) {
			filename.set(value);
		},
		get file() {
			return file.get();
		},
		set file(value) {
			file.set(value);
		},
		get buffer() {
			return buffer.get();
		},
		set buffer(value) {
			buffer.set(value);
		},
		get sourceUrl() {
			return sourceUrl.get();
		},
		set sourceUrl(value) {
			sourceUrl.set(value);
		},
		get renderedReady() {
			return renderedReady.get();
		},
		set renderedReady(value) {
			renderedReady.set(value);
		},
		get progressiveReady() {
			return progressiveReady.get();
		},
		set progressiveReady(value) {
			progressiveReady.set(value);
		}
	};
};
var applyFileViewerPreviewRequestResetState = (target, state = createFileViewerPreviewRequestResetState()) => {
	target.file = state.file;
	target.buffer = state.buffer;
	target.sourceUrl = state.sourceUrl;
	target.progressiveReady = state.progressiveReady;
	return target;
};
var commitFileViewerPreviewRequestStartState = ({ reason = "replace", requestController, previewTarget, onClearRenderedContent, onClearError }) => {
	const version = requestController.createVersion();
	onClearRenderedContent === null || onClearRenderedContent === void 0 || onClearRenderedContent(reason);
	applyFileViewerPreviewRequestResetState(previewTarget);
	onClearError === null || onClearError === void 0 || onClearError();
	return version;
};
var cancelFileViewerPreviewRequest = ({ reason = "component-unmount", requestController, previewTarget, onClearRenderedContent, onClearError }) => {
	return commitFileViewerPreviewRequestStartState({
		reason,
		requestController,
		previewTarget,
		onClearRenderedContent,
		onClearError
	});
};
var runFileViewerPreviewSourceChange = ({ onRefreshPreview } = {}) => {
	return onRefreshPreview === null || onRefreshPreview === void 0 ? void 0 : onRefreshPreview();
};
var runFileViewerPreviewComponentUnmount = ({ reason = "component-unmount", onCancelPreview, onClearRenderedContent, onResetLoading, onStopZoomObserver, onStopFitObserver, onStopViewStateObserver } = {}) => {
	onCancelPreview === null || onCancelPreview === void 0 || onCancelPreview(reason);
	if (!onCancelPreview) onClearRenderedContent === null || onClearRenderedContent === void 0 || onClearRenderedContent(reason);
	onResetLoading === null || onResetLoading === void 0 || onResetLoading();
	onStopZoomObserver === null || onStopZoomObserver === void 0 || onStopZoomObserver();
	onStopFitObserver === null || onStopFitObserver === void 0 || onStopFitObserver();
	onStopViewStateObserver === null || onStopViewStateObserver === void 0 || onStopViewStateObserver();
	return { reason };
};
var applyFileViewerEmptyPreviewState = (target, state = createFileViewerEmptyPreviewState()) => {
	target.filename = state.filename;
	target.renderedReady = state.renderedReady;
	applyFileViewerPreviewRequestResetState(target, state);
	return target;
};
var commitFileViewerEmptyPreviewResetState = ({ previewTarget, state, reason, onClearRenderedContent, onResetLoading }) => {
	applyFileViewerEmptyPreviewState(previewTarget, state);
	onClearRenderedContent === null || onClearRenderedContent === void 0 || onClearRenderedContent(reason);
	onResetLoading === null || onResetLoading === void 0 || onResetLoading();
	return previewTarget;
};
var runFileViewerPreviewRequest = async ({ file, url, reason = resolveFileViewerPreviewRequestReason({
	file,
	url
}), requestController, previewTarget, onPreviewLocalFile, onPreviewRemoteFile, onClearRenderedContent, onClearError, onResetLoading }) => {
	const version = commitFileViewerPreviewRequestStartState({
		reason,
		requestController,
		previewTarget,
		onClearRenderedContent,
		onClearError
	});
	if (file) return {
		status: "file",
		version,
		reason,
		file,
		url: null,
		result: await onPreviewLocalFile(file, version)
	};
	if (url) return {
		status: "url",
		version,
		reason,
		file: null,
		url,
		result: await onPreviewRemoteFile(url, version)
	};
	return {
		status: "reset",
		version,
		reason,
		file: null,
		url: null,
		result: commitFileViewerEmptyPreviewResetState({
			previewTarget,
			onClearRenderedContent,
			onResetLoading
		})
	};
};
var createFileViewerReadPreviewState = ({ file, buffer, sourceUrl, fallbackFilename = "" }) => ({
	filename: resolveFileViewerSourceFilename({
		file,
		fallback: fallbackFilename
	}),
	file,
	buffer,
	sourceUrl: normalizeFileViewerSourceUrl(sourceUrl)
});
var applyFileViewerReadPreviewState = (target, state) => {
	target.filename = state.filename;
	target.file = state.file;
	target.buffer = state.buffer;
	target.sourceUrl = state.sourceUrl;
	return target;
};
var applyFileViewerPreviewSourceUrlState = (target, sourceUrl) => {
	target.sourceUrl = normalizeFileViewerSourceUrl(sourceUrl);
	return target;
};
var applyFileViewerPreviewFilenameState = (target, filename, fallbackFilename = "") => {
	target.filename = resolveFileViewerSourceFilename({
		filename,
		fallback: fallbackFilename
	});
	return target;
};
var applyFileViewerRenderReadinessState = (target, state) => {
	if (typeof state.renderedReady === "boolean") target.renderedReady = state.renderedReady;
	if (typeof state.progressiveReady === "boolean") target.progressiveReady = state.progressiveReady;
	return target;
};
var commitFileViewerRenderCompleteState = ({ version, session, buildState, readinessTarget, onSession, onActiveDocumentContext, onLifecycle, onClearLoadStarted }) => {
	onSession === null || onSession === void 0 || onSession(session !== null && session !== void 0 ? session : null);
	const completeState = buildState();
	applyFileViewerRenderReadinessState(readinessTarget, completeState.readiness);
	onActiveDocumentContext === null || onActiveDocumentContext === void 0 || onActiveDocumentContext(completeState.lifecycleContext);
	onLifecycle === null || onLifecycle === void 0 || onLifecycle(completeState.lifecycleContext);
	onClearLoadStarted === null || onClearLoadStarted === void 0 || onClearLoadStarted(version);
	return completeState;
};
var runFileViewerReadAndRenderFile = async ({ file, version, sourceUrl, source = sourceUrl ? "url" : "file", fallbackFilename = "", previewTarget, isCurrent, mountRenderedContent, destroyRenderSession, buildRenderCompleteState, onSession, onActiveDocumentContext, onLifecycle, onClearLoadStarted }) => {
	const buffer = await readFileViewerBuffer(file);
	if (!isCurrent(version)) return {
		stale: true,
		buffer,
		session: null,
		complete: null
	};
	applyFileViewerReadPreviewState(previewTarget, createFileViewerReadPreviewState({
		file,
		buffer,
		sourceUrl,
		fallbackFilename
	}));
	const session = await mountRenderedContent(buffer, file, version, sourceUrl);
	if (!isCurrent(version)) {
		destroyRenderSession === null || destroyRenderSession === void 0 || destroyRenderSession(session);
		return {
			stale: true,
			buffer,
			session,
			complete: null
		};
	}
	return {
		stale: false,
		buffer,
		session,
		complete: commitFileViewerRenderCompleteState({
			version,
			session,
			readinessTarget: previewTarget,
			buildState: () => buildRenderCompleteState({
				version,
				source,
				file,
				sourceUrl
			}),
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted
		})
	};
};
var runFileViewerStreamingPdfPreview = async ({ url, version, filename, previewTarget, isCurrent, mountRenderedContent, destroyRenderSession, buildRenderCompleteState, loadingMessage, i18n, onStartLoading, onSession, onActiveDocumentContext, onLifecycle, onClearLoadStarted, onStopLoading, onError }) => {
	let placeholderFile = null;
	onStartLoading === null || onStartLoading === void 0 || onStartLoading(loadingMessage || resolveFileViewerPreviewMessages(i18n).streamingPdf);
	try {
		placeholderFile = createFileViewerStreamingPdfPlaceholderFile(filename);
		applyFileViewerPreviewSourceUrlState(previewTarget, url);
		const session = await mountRenderedContent(/* @__PURE__ */ new ArrayBuffer(0), placeholderFile, version, url, url);
		if (!isCurrent(version)) {
			destroyRenderSession === null || destroyRenderSession === void 0 || destroyRenderSession(session);
			return {
				status: "stale",
				placeholderFile,
				session,
				complete: null,
				error: null
			};
		}
		const complete = commitFileViewerRenderCompleteState({
			version,
			session,
			readinessTarget: previewTarget,
			buildState: () => buildRenderCompleteState({
				version,
				source: "url",
				sourceUrl: url
			}),
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted
		});
		return {
			status: "ready",
			placeholderFile,
			session,
			complete,
			error: null
		};
	} catch (error) {
		if (!isCurrent(version)) return {
			status: "stale",
			placeholderFile,
			session: null,
			complete: null,
			error: null
		};
		onError === null || onError === void 0 || onError(error);
		return {
			status: "error",
			placeholderFile,
			session: null,
			complete: null,
			error
		};
	} finally {
		finalizeFileViewerPreviewLoadState({
			version,
			isCurrent,
			onClearLoadStarted,
			onStopLoading
		});
	}
};
var runFileViewerLocalFilePreview = async ({ source, version, currentFilename, fallbackFilename, previewTarget, isCurrent, mountRenderedContent, destroyRenderSession, buildLoadStartState, buildRenderCompleteState, onMarkLoadStarted, onStartLoading, onSession, onActiveDocumentContext, onLifecycle, onClearLoadStarted, onStopLoading, onError }) => {
	const localSource = resolveFileViewerFileRefSourcePlan({
		source,
		currentFilename,
		fallbackFilename
	});
	const { file } = localSource;
	commitFileViewerLoadStartState({
		version,
		filename: localSource.filename,
		filenameTarget: previewTarget,
		buildState: () => buildLoadStartState({
			version,
			source: "file",
			file
		}),
		onMarkLoadStarted,
		onLifecycle,
		onStartLoading
	});
	try {
		const read = await runFileViewerReadAndRenderFile({
			file,
			version,
			source: "file",
			previewTarget,
			isCurrent,
			mountRenderedContent,
			destroyRenderSession,
			buildRenderCompleteState: (input) => buildRenderCompleteState({
				version: input.version,
				source: "file",
				file
			}),
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted
		});
		if (read.stale) return {
			status: "stale",
			source: localSource,
			read,
			error: null
		};
		return {
			status: "ready",
			source: localSource,
			read,
			error: null
		};
	} catch (error) {
		if (!isCurrent(version)) return {
			status: "stale",
			source: localSource,
			read: null,
			error: null
		};
		onError === null || onError === void 0 || onError(error);
		return {
			status: "error",
			source: localSource,
			read: null,
			error
		};
	} finally {
		finalizeFileViewerPreviewLoadState({
			version,
			isCurrent,
			onClearLoadStarted,
			onStopLoading
		});
	}
};
var runFileViewerRemoteFilePreview = async ({ url, version, pageHref, streaming, previewTarget, requestController, isCurrent, downloadFile, mountRenderedContent, destroyRenderSession, buildLoadStartState, buildRenderCompleteState, i18n, onMarkLoadStarted, onStartLoading, onSetLoadingMessage, onSession, onActiveDocumentContext, onLifecycle, onClearLoadStarted, onStopLoading, onMissingData, onError }) => {
	const remoteSource = resolveFileViewerRemoteSourcePlan({
		pageHref,
		streaming,
		url
	});
	const sourceUrl = remoteSource.url;
	commitFileViewerLoadStartState({
		version,
		filename: remoteSource.filename,
		filenameTarget: previewTarget,
		buildState: () => buildLoadStartState({
			version,
			source: "url",
			sourceUrl
		}),
		onMarkLoadStarted,
		onLifecycle,
		onStartLoading
	});
	if (remoteSource.streamPdf) {
		const stream = await runFileViewerStreamingPdfPreview({
			url: sourceUrl,
			version,
			filename: remoteSource.filename,
			previewTarget,
			isCurrent,
			mountRenderedContent,
			destroyRenderSession,
			buildRenderCompleteState: (input) => buildRenderCompleteState({
				version: input.version,
				source: "url",
				sourceUrl
			}),
			i18n,
			onStartLoading,
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted,
			onStopLoading,
			onError: (error) => onError === null || onError === void 0 ? void 0 : onError(error, "stream")
		});
		if (stream.status === "ready") return {
			status: "stream",
			remoteSource,
			download: null,
			read: null,
			stream,
			error: null
		};
		if (stream.status === "error") return {
			status: "error",
			remoteSource,
			download: null,
			read: null,
			stream,
			error: stream.error
		};
		return {
			status: "stale",
			remoteSource,
			download: null,
			read: null,
			stream,
			error: null
		};
	}
	const controller = requestController.createAbortController();
	try {
		const download = commitFileViewerRemoteDownloadState({
			version,
			data: await downloadFile({
				url: sourceUrl,
				signal: controller === null || controller === void 0 ? void 0 : controller.signal
			}),
			currentFilename: remoteSource.filename,
			isCurrent,
			i18n,
			onMissingData,
			onSetLoadingMessage
		});
		if (download.stale) return {
			status: "stale",
			remoteSource,
			download,
			read: null,
			stream: null,
			error: null
		};
		if (download.missing) return {
			status: "missing",
			remoteSource,
			download,
			read: null,
			stream: null,
			error: null
		};
		const read = await runFileViewerReadAndRenderFile({
			file: download.source.file,
			version,
			source: "url",
			sourceUrl,
			previewTarget,
			isCurrent,
			mountRenderedContent,
			destroyRenderSession,
			buildRenderCompleteState: (input) => buildRenderCompleteState({
				version: input.version,
				source: "url",
				file: input.file,
				sourceUrl
			}),
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted
		});
		if (read.stale) return {
			status: "stale",
			remoteSource,
			download,
			read,
			stream: null,
			error: null
		};
		return {
			status: "ready",
			remoteSource,
			download,
			read,
			stream: null,
			error: null
		};
	} catch (error) {
		if (!isCurrent(version) || isFileViewerAbortError(error)) return {
			status: "stale",
			remoteSource,
			download: null,
			read: null,
			stream: null,
			error: null
		};
		onError === null || onError === void 0 || onError(error, "load");
		return {
			status: "error",
			remoteSource,
			download: null,
			read: null,
			stream: null,
			error
		};
	} finally {
		requestController.clearAbortController(controller);
		finalizeFileViewerPreviewLoadState({
			version,
			isCurrent,
			onClearLoadStarted,
			onStopLoading
		});
	}
};
var createFileViewerSourceLoadingActionHandlers = ({ getFile, getUrl, getCurrentFilename, getPdfStreaming, getI18n, getPageHref, previewTarget, requestController, downloadFile, mountRenderedContent, destroyRenderSession, buildLoadStartState, buildRenderCompleteState, formatErrorMessage, onMarkLoadStarted, onClearLoadStarted, onStartLoading, onSetLoadingMessage, onStopLoading, onShowError, onClearError, onResetLoading, onClearRenderedContent, onSession, onActiveDocumentContext, onLifecycle }) => {
	const isCurrentRequest = (version) => requestController.isCurrent(version);
	const previewLocalFile = async (source, version) => {
		var _a;
		return await runFileViewerLocalFilePreview({
			source,
			version,
			currentFilename: (_a = getCurrentFilename === null || getCurrentFilename === void 0 ? void 0 : getCurrentFilename()) !== null && _a !== void 0 ? _a : previewTarget.filename,
			previewTarget,
			isCurrent: isCurrentRequest,
			mountRenderedContent,
			destroyRenderSession,
			buildLoadStartState: (input) => buildLoadStartState({
				version: input.version,
				source: "file",
				file: input.file
			}),
			buildRenderCompleteState: (input) => buildRenderCompleteState({
				version: input.version,
				source: "file",
				file: input.file
			}),
			onMarkLoadStarted,
			onStartLoading,
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted,
			onStopLoading,
			onError: (error) => {
				reportFileViewerPreviewLoadError({
					kind: "local",
					error,
					formatErrorMessage,
					i18n: getI18n === null || getI18n === void 0 ? void 0 : getI18n(),
					onErrorMessage: onShowError
				});
			}
		});
	};
	const previewRemoteFile = async (url, version) => {
		return await runFileViewerRemoteFilePreview({
			url,
			version,
			pageHref: getPageHref === null || getPageHref === void 0 ? void 0 : getPageHref(),
			streaming: getPdfStreaming === null || getPdfStreaming === void 0 ? void 0 : getPdfStreaming(),
			i18n: getI18n === null || getI18n === void 0 ? void 0 : getI18n(),
			previewTarget,
			requestController,
			isCurrent: isCurrentRequest,
			downloadFile,
			mountRenderedContent,
			destroyRenderSession,
			buildLoadStartState: (input) => buildLoadStartState({
				version: input.version,
				source: "url",
				sourceUrl: input.sourceUrl
			}),
			buildRenderCompleteState: (input) => buildRenderCompleteState({
				version: input.version,
				source: "url",
				file: input.file,
				sourceUrl: input.sourceUrl
			}),
			onMarkLoadStarted,
			onStartLoading,
			onSetLoadingMessage,
			onSession,
			onActiveDocumentContext,
			onLifecycle,
			onClearLoadStarted,
			onStopLoading,
			onMissingData: () => {
				reportFileViewerMissingRemoteData({
					i18n: getI18n === null || getI18n === void 0 ? void 0 : getI18n(),
					onErrorMessage: onShowError
				});
			},
			onError: (error, kind) => {
				reportFileViewerPreviewLoadError({
					kind,
					error,
					formatErrorMessage,
					i18n: getI18n === null || getI18n === void 0 ? void 0 : getI18n(),
					onErrorMessage: onShowError
				});
			}
		});
	};
	const resetViewer = (reason) => {
		return commitFileViewerEmptyPreviewResetState({
			previewTarget,
			reason,
			onClearRenderedContent,
			onResetLoading
		});
	};
	const refreshPreview = async () => {
		return await runFileViewerPreviewRequest({
			file: getFile(),
			url: getUrl(),
			requestController,
			previewTarget,
			onPreviewLocalFile: previewLocalFile,
			onPreviewRemoteFile: previewRemoteFile,
			onClearRenderedContent,
			onClearError,
			onResetLoading
		});
	};
	const cancelPreview = (reason = "component-unmount") => {
		return cancelFileViewerPreviewRequest({
			reason,
			requestController,
			previewTarget,
			onClearRenderedContent,
			onClearError
		});
	};
	return {
		isCurrentRequest,
		previewLocalFile,
		previewRemoteFile,
		resetViewer,
		refreshPreview,
		cancelPreview
	};
};
var finalizeFileViewerPreviewLoadState = ({ version, isCurrent, onClearLoadStarted, onStopLoading }) => {
	onClearLoadStarted === null || onClearLoadStarted === void 0 || onClearLoadStarted(version);
	if (isCurrent(version)) onStopLoading === null || onStopLoading === void 0 || onStopLoading();
};
var resolveFileViewerLoadStartMessage = (source, i18n) => {
	const messages = resolveFileViewerPreviewMessages(i18n);
	return source === "url" ? messages.downloading : messages.reading;
};
var commitFileViewerLoadStartState = ({ version, filename, fallbackFilename, filenameTarget, buildState, onMarkLoadStarted, onLifecycle, onStartLoading }) => {
	if (filenameTarget) applyFileViewerPreviewFilenameState(filenameTarget, filename, fallbackFilename);
	onMarkLoadStarted === null || onMarkLoadStarted === void 0 || onMarkLoadStarted(version);
	const loadStartState = buildState();
	onLifecycle === null || onLifecycle === void 0 || onLifecycle(loadStartState.lifecycleContext);
	onStartLoading === null || onStartLoading === void 0 || onStartLoading(loadStartState.loadingMessage);
	return loadStartState;
};
var createFileViewerLoadStartState = ({ version, source, filename, file, sourceUrl, bufferSize, loadingMessage, i18n, timestamp }) => {
	return {
		loadingMessage: loadingMessage || resolveFileViewerLoadStartMessage(source, i18n),
		lifecycleContext: buildFileViewerLifecycleContext({
			phase: "load-start",
			version,
			source,
			file,
			filename,
			url: normalizeFileViewerSourceUrl(sourceUrl) || void 0,
			bufferSize,
			timestamp
		})
	};
};
var createFileViewerRenderCompleteState = ({ version, source, filename, file, sourceUrl, bufferSize, startedAt, timestamp, lifecycleState }) => {
	return {
		readiness: {
			renderedReady: true,
			progressiveReady: false
		},
		lifecycleContext: buildFileViewerLifecycleContext({
			phase: "load-complete",
			version,
			source,
			file,
			filename,
			url: normalizeFileViewerSourceUrl(sourceUrl) || void 0,
			bufferSize,
			startedAt: startedAt !== null && startedAt !== void 0 ? startedAt : lifecycleState === null || lifecycleState === void 0 ? void 0 : lifecycleState.getLoadStartedAt(version),
			timestamp
		})
	};
};
var resolveFileViewerFileRefSourcePlan = ({ source, currentFilename, fallbackFilename = DEFAULT_FILE_VIEWER_SOURCE_FILENAME }) => {
	const file = wrapFileViewerFileRef(source, currentFilename || fallbackFilename);
	return {
		file,
		filename: resolveFileViewerSourceFilename({
			file,
			fallback: fallbackFilename
		})
	};
};
var normalizePdfStreamingMode = (mode) => {
	if (mode === true || mode === false || mode === "same-origin") return mode;
	return "same-origin";
};
var isSameOriginUrl = (url, pageHref) => {
	try {
		const target = new URL(url, pageHref);
		const page = new URL(pageHref);
		return target.origin === page.origin;
	} catch {
		return false;
	}
};
var shouldStreamPdfUrl = ({ extension, pageHref, streaming, url }) => {
	if (extension.toLowerCase() !== "pdf") return false;
	const mode = normalizePdfStreamingMode(streaming);
	if (mode === false) return false;
	if (mode === true) return true;
	return isSameOriginUrl(url, pageHref);
};
var resolveFileViewerRemoteSourcePlan = ({ filename, fallbackFilename = DEFAULT_FILE_VIEWER_SOURCE_FILENAME, pageHref, streaming, url }) => {
	const sourceUrl = normalizeFileViewerSourceUrl(url) || url;
	const nextFilename = normalizeFilename(filename || url, fallbackFilename);
	const extension = getExtension(nextFilename);
	return {
		url: sourceUrl,
		filename: nextFilename,
		extension,
		streamPdf: pageHref ? shouldStreamPdfUrl({
			extension,
			pageHref,
			streaming,
			url: sourceUrl
		}) : false
	};
};
var commitFileViewerRemoteDownloadState = ({ version, data, currentFilename, fallbackFilename, isCurrent, i18n, onMissingData, onSetLoadingMessage }) => {
	if (!isCurrent(version)) return {
		stale: true,
		missing: false,
		source: null
	};
	if (!data) {
		onMissingData === null || onMissingData === void 0 || onMissingData();
		return {
			stale: false,
			missing: true,
			source: null
		};
	}
	onSetLoadingMessage === null || onSetLoadingMessage === void 0 || onSetLoadingMessage(resolveFileViewerPreviewMessages(i18n).reading);
	return {
		stale: false,
		missing: false,
		source: resolveFileViewerFileRefSourcePlan({
			source: data,
			currentFilename,
			fallbackFilename
		})
	};
};
var createFileViewerStreamingPdfPlaceholderFile = (filename) => {
	if (typeof Blob === "undefined") throw new Error("Blob is not available in the current execution environment.");
	return wrapFileViewerFileRef(new Blob([], { type: "application/pdf" }), normalizeFilename(filename, DEFAULT_FILE_VIEWER_STREAMING_PDF_FILENAME));
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/rendering/handler.js
var FILE_VIEWER_RENDER_SESSION_DISPOSE_ERROR_MESSAGE = "预览内容卸载失败";
var FILE_VIEWER_RENDER_SURFACE_BACKGROUND_PROPERTY = "--file-viewer-render-surface-background";
var normalizeFileViewerRenderSurfaceBackground = (value) => {
	if (typeof value !== "string") return null;
	const normalized = value.trim();
	return normalized && normalized.toLowerCase() !== "auto" ? normalized : null;
};
/**
* Keeps the public UI option and the renderer-facing CSS custom property in
* sync. Custom properties inherit through Shadow DOM, so setting this on the
* render host covers both scoped and shadow-isolated renderer targets.
*/
var syncFileViewerRenderSurfaceBackground = (target, options) => {
	var _a;
	if (!target) return null;
	const background = normalizeFileViewerRenderSurfaceBackground((_a = options === null || options === void 0 ? void 0 : options.ui) === null || _a === void 0 ? void 0 : _a.surfaceBackground);
	if (background) target.style.setProperty(FILE_VIEWER_RENDER_SURFACE_BACKGROUND_PROPERTY, background);
	else target.style.removeProperty(FILE_VIEWER_RENDER_SURFACE_BACKGROUND_PROPERTY);
	return background;
};
var isFileViewerShadowRoot = (value) => {
	if (!value || typeof value !== "object") return false;
	if (typeof ShadowRoot !== "undefined" && value instanceof ShadowRoot) return true;
	return value.nodeType === 11 && !!value.host;
};
var getFileViewerShadowRootForNode = (node) => {
	var _a;
	if (!node) return null;
	if (isFileViewerShadowRoot(node)) return node;
	const root = (_a = node.getRootNode) === null || _a === void 0 ? void 0 : _a.call(node);
	return isFileViewerShadowRoot(root) ? root : null;
};
var normalizeFileViewerStyleIsolation = (isolation) => {
	return isolation === "shadow" || isolation === "scoped" || isolation === "none" ? isolation : "auto";
};
var isPromiseLike = (value) => {
	return !!value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
};
var clearFileViewerRenderSurface = (container) => {
	if (!container) return;
	while (container.firstChild) container.removeChild(container.firstChild);
};
var createFileViewerRenderTarget = (container, options = {}) => {
	const target = container.ownerDocument.createElement("div");
	target.className = options.className || "file-render";
	target.style.width = "100%";
	target.style.minWidth = "0";
	target.style.minHeight = "0";
	container.appendChild(target);
	return target;
};
var removeFileViewerRenderTarget = (container, target) => {
	if (target.parentNode !== container) return false;
	container.removeChild(target);
	return true;
};
var createFileViewerRenderReadinessTarget = ({ renderedReady, progressiveReady }) => {
	return {
		get renderedReady() {
			return renderedReady.get();
		},
		set renderedReady(value) {
			renderedReady.set(value);
		},
		get progressiveReady() {
			return progressiveReady.get();
		},
		set progressiveReady(value) {
			progressiveReady.set(value);
		}
	};
};
var createFileViewerRenderSurfaceStateTarget = ({ session, exportAdapter, thumbnailAdapter }) => {
	let localThumbnailAdapter = null;
	return {
		get session() {
			return session.get();
		},
		set session(value) {
			session.set(value);
		},
		get exportAdapter() {
			return exportAdapter.get();
		},
		set exportAdapter(value) {
			exportAdapter.set(value);
		},
		get thumbnailAdapter() {
			var _a;
			return (_a = thumbnailAdapter === null || thumbnailAdapter === void 0 ? void 0 : thumbnailAdapter.get()) !== null && _a !== void 0 ? _a : localThumbnailAdapter;
		},
		set thumbnailAdapter(value) {
			localThumbnailAdapter = value;
			thumbnailAdapter === null || thumbnailAdapter === void 0 || thumbnailAdapter.set(value);
		}
	};
};
var applyFileViewerRenderSurfaceState = (target, state) => {
	var _a, _b, _c;
	if ("session" in state) target.session = (_a = state.session) !== null && _a !== void 0 ? _a : null;
	if ("exportAdapter" in state) target.exportAdapter = (_b = state.exportAdapter) !== null && _b !== void 0 ? _b : null;
	if ("thumbnailAdapter" in state) target.thumbnailAdapter = (_c = state.thumbnailAdapter) !== null && _c !== void 0 ? _c : null;
	return target;
};
var createFileRenderHandlerRendererSession = (rendered, destroy) => ({
	rendered,
	destroy: () => {
		if (destroy) return destroy();
		return disposeFileViewerRendered(rendered);
	}
});
var disposeFileViewerRendered = (rendered) => {
	if (!rendered || typeof rendered !== "object") return;
	const disposable = rendered;
	if (typeof disposable.unmount === "function") return disposable.unmount();
	if (typeof disposable.$destroy === "function") return disposable.$destroy();
	if (typeof disposable.destroy === "function") return disposable.destroy();
};
var resolveFileViewerRenderSessionDisposeErrorMessage = ({ message = FILE_VIEWER_RENDER_SESSION_DISPOSE_ERROR_MESSAGE } = {}) => message;
var DEFAULT_FILE_VIEWER_RENDER_SESSION_DISPOSE_ERROR_LOGGER = (message, error) => {
	if (typeof console !== "undefined" && typeof console.warn === "function") console.warn(message, error);
};
var reportFileViewerRenderSessionDisposeError = ({ error, onLogError = DEFAULT_FILE_VIEWER_RENDER_SESSION_DISPOSE_ERROR_LOGGER, ...messageInput }) => {
	const message = resolveFileViewerRenderSessionDisposeErrorMessage(messageInput);
	onLogError === null || onLogError === void 0 || onLogError(message, error);
	return message;
};
var disposeFileViewerRendererSession = (session, options = {}) => {
	if (!(session === null || session === void 0 ? void 0 : session.destroy)) return;
	const handleError = (error) => {
		var _a;
		(_a = options.onError) === null || _a === void 0 || _a.call(options, error);
	};
	try {
		const result = session.destroy();
		if (isPromiseLike(result)) Promise.resolve(result).catch(handleError);
	} catch (error) {
		handleError(error);
	}
};
var disposeActiveFileViewerRendererSession = (target, options = {}) => {
	const session = target.session;
	try {
		disposeFileViewerRendererSession(session, options);
	} finally {
		target.session = null;
	}
	return session;
};
var resetFileViewerRenderSurface = ({ surfaceState, readinessState, container, disposeOptions }) => {
	const session = disposeActiveFileViewerRendererSession(surfaceState, disposeOptions);
	applyFileViewerRenderSurfaceState(surfaceState, {
		exportAdapter: null,
		thumbnailAdapter: null
	});
	applyFileViewerRenderReadinessState(readinessState, {
		renderedReady: false,
		progressiveReady: false
	});
	clearFileViewerRenderSurface(container);
	return session;
};
var runFileViewerRenderSurfaceClear = ({ reason = "replace", surfaceState, readinessState, container, disposeOptions, onUnloadStart, onUnloadComplete, onClearActiveDocumentContext, onClearDocumentState, onStopZoomObserver, onClearZoomProvider, onStopFitObserver, onStopViewStateObserver, onClearViewStateProvider }) => {
	const unloadContext = onUnloadStart === null || onUnloadStart === void 0 ? void 0 : onUnloadStart(reason);
	let session;
	try {
		session = resetFileViewerRenderSurface({
			surfaceState,
			readinessState,
			container,
			disposeOptions
		});
	} finally {
		onClearActiveDocumentContext === null || onClearActiveDocumentContext === void 0 || onClearActiveDocumentContext();
		onClearDocumentState === null || onClearDocumentState === void 0 || onClearDocumentState();
		onStopZoomObserver === null || onStopZoomObserver === void 0 || onStopZoomObserver();
		onClearZoomProvider === null || onClearZoomProvider === void 0 || onClearZoomProvider();
		onStopFitObserver === null || onStopFitObserver === void 0 || onStopFitObserver();
		onStopViewStateObserver === null || onStopViewStateObserver === void 0 || onStopViewStateObserver();
		onClearViewStateProvider === null || onClearViewStateProvider === void 0 || onClearViewStateProvider();
	}
	onUnloadComplete === null || onUnloadComplete === void 0 || onUnloadComplete(unloadContext, reason);
	return {
		reason,
		unloadContext,
		session
	};
};
var runFileViewerRenderSurfaceMount = async ({ buffer, file, version, sourceUrl, streamUrl, getContainer, surfaceState, readinessState, isCurrent, clearRenderedContent, render, waitForContainer, waitForPaint = waitForFileViewerNextPaint, disposeSession = disposeFileViewerRendererSession, onStartZoomObserver, onStartFitObserver, onStartViewStateObserver, onApplyInitialFit, onRefreshDocumentIndex, onRefreshZoomProvider, onRefreshViewStateProvider }) => {
	if (!getContainer()) await (waitForContainer === null || waitForContainer === void 0 ? void 0 : waitForContainer());
	const container = getContainer();
	if (!container || !isCurrent(version)) return;
	clearRenderedContent("replace");
	const target = createFileViewerRenderTarget(container);
	onStartZoomObserver === null || onStartZoomObserver === void 0 || onStartZoomObserver();
	onStartFitObserver === null || onStartFitObserver === void 0 || onStartFitObserver();
	onStartViewStateObserver === null || onStartViewStateObserver === void 0 || onStartViewStateObserver();
	await (waitForContainer === null || waitForContainer === void 0 ? void 0 : waitForContainer());
	await waitForPaint();
	if (!isCurrent(version)) {
		removeFileViewerRenderTarget(container, target);
		return;
	}
	const registerExportAdapter = (adapter) => {
		applyFileViewerRenderSurfaceState(surfaceState, { exportAdapter: adapter });
	};
	const onProgressiveRender = () => {
		if (isCurrent(version)) applyFileViewerRenderReadinessState(readinessState, { progressiveReady: true });
	};
	try {
		const session = await render({
			buffer,
			file,
			version,
			type: getExtension(file.name),
			target,
			filename: file.name,
			sourceUrl,
			streamUrl,
			onProgressiveRender,
			registerExportAdapter,
			surfaceState,
			readinessState
		});
		if (!isCurrent(version)) {
			disposeSession(session);
			removeFileViewerRenderTarget(container, target);
			return;
		}
		onRefreshDocumentIndex === null || onRefreshDocumentIndex === void 0 || onRefreshDocumentIndex();
		onRefreshZoomProvider === null || onRefreshZoomProvider === void 0 || onRefreshZoomProvider();
		onRefreshViewStateProvider === null || onRefreshViewStateProvider === void 0 || onRefreshViewStateProvider();
		if (onApplyInitialFit) {
			await onApplyInitialFit();
			onRefreshZoomProvider === null || onRefreshZoomProvider === void 0 || onRefreshZoomProvider();
			onRefreshViewStateProvider === null || onRefreshViewStateProvider === void 0 || onRefreshViewStateProvider();
		}
		return session;
	} catch (error) {
		removeFileViewerRenderTarget(container, target);
		throw error;
	}
};
var createFileViewerRenderSurfaceActionHandlers = ({ getContainer, surfaceState, readinessState, isCurrent, render, waitForContainer, waitForPaint, disposeOptions, onUnloadStart, onUnloadComplete, onClearActiveDocumentContext, onClearDocumentState, onStartZoomObserver, onStopZoomObserver, onClearZoomProvider, onStartFitObserver, onStopFitObserver, onStartViewStateObserver, onStopViewStateObserver, onClearViewStateProvider, onApplyInitialFit, onRefreshDocumentIndex, onRefreshZoomProvider, onRefreshViewStateProvider }) => {
	const handleDisposeError = (error) => {
		if (disposeOptions === null || disposeOptions === void 0 ? void 0 : disposeOptions.onError) {
			disposeOptions.onError(error);
			return;
		}
		reportFileViewerRenderSessionDisposeError({ error });
	};
	const mergedDisposeOptions = {
		...disposeOptions,
		onError: handleDisposeError
	};
	const destroyRenderSession = (session) => {
		disposeFileViewerRendererSession(session, mergedDisposeOptions);
	};
	const setActiveRenderSession = (session) => {
		return applyFileViewerRenderSurfaceState(surfaceState, { session });
	};
	const clearRenderedContent = (reason = "replace") => {
		return runFileViewerRenderSurfaceClear({
			reason,
			surfaceState,
			readinessState,
			container: getContainer(),
			disposeOptions: mergedDisposeOptions,
			onUnloadStart,
			onUnloadComplete,
			onClearActiveDocumentContext,
			onClearDocumentState,
			onStopZoomObserver,
			onClearZoomProvider,
			onStopFitObserver,
			onStopViewStateObserver,
			onClearViewStateProvider
		});
	};
	const mountRenderedContent = async (buffer, file, version, sourceUrl, streamUrl) => {
		return await runFileViewerRenderSurfaceMount({
			buffer,
			file,
			version,
			sourceUrl,
			streamUrl,
			getContainer,
			surfaceState,
			readinessState,
			isCurrent,
			clearRenderedContent,
			render,
			waitForContainer,
			waitForPaint,
			disposeSession: destroyRenderSession,
			onStartZoomObserver,
			onStartFitObserver,
			onStartViewStateObserver,
			onApplyInitialFit,
			onRefreshDocumentIndex,
			onRefreshZoomProvider,
			onRefreshViewStateProvider
		});
	};
	return {
		destroyRenderSession,
		setActiveRenderSession,
		clearRenderedContent,
		mountRenderedContent
	};
};
var buildFileRenderContextFromLoadContext = ({ source, surface, options, signal, registerExportAdapter, registerThumbnailAdapter, renderContext }) => ({
	filename: source.filename,
	url: source.url,
	streamUrl: source.url,
	signal,
	options,
	surface,
	registerExportAdapter,
	registerThumbnailAdapter,
	...renderContext
});
var renderFileViewerHandler = async ({ dispatcher, buffer, target, type = "", context, throwOnMissingHandler = false }) => {
	var _a, _b, _c;
	const normalizedType = normalizeFileExtension(type);
	const handler = dispatcher.resolve(normalizedType);
	if (!handler) {
		if (throwOnMissingHandler) throw new Error(`No file viewer renderer is registered for "${normalizedType}".`);
		return;
	}
	try {
		return await handler(buffer, target, normalizedType, context);
	} catch (error) {
		const redirectedRendererId = resolveFileViewerRendererRedirectId(error);
		const redirectedHandler = redirectedRendererId ? dispatcher.handlersByRendererId.get(redirectedRendererId) : void 0;
		if (!redirectedHandler || redirectedHandler === handler) throw error;
		const redirectedType = ((_a = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === redirectedRendererId)) === null || _a === void 0 ? void 0 : _a.extensions[0]) || normalizedType;
		(_c = (_b = context === null || context === void 0 ? void 0 : context.options) === null || _b === void 0 ? void 0 : _b.onDiagnostic) === null || _c === void 0 || _c.call(_b, {
			code: "renderer-content-signature-redirect",
			level: "warning",
			message: `File extension .${normalizedType} contains the ${redirectedRendererId} container and was routed as .${redirectedType}.`,
			detail: {
				declaredExtension: normalizedType,
				detectedRendererId: redirectedRendererId,
				routedExtension: redirectedType
			}
		});
		return await redirectedHandler(buffer, target, redirectedType, context);
	}
};
var createFileRenderHandlerLoader = ({ handler, rendererId, getTarget = (context) => context.surface.container, createContext = buildFileRenderContextFromLoadContext, destroy }) => {
	return async (context) => {
		const { source } = context;
		if (!source.buffer) throw new Error("FileRenderHandler renderer requires an ArrayBuffer source.");
		const target = getTarget(context);
		const renderContext = createContext(context);
		const rendered = await handler(source.buffer, target, source.extension, renderContext);
		const existingProvider = findFileViewerViewStateProvider(target);
		const genericViewStateProvider = existingProvider ? null : registerFileViewerGenericViewStateProvider({
			host: target,
			renderer: rendererId || source.extension
		});
		const viewStateProvider = existingProvider || (genericViewStateProvider === null || genericViewStateProvider === void 0 ? void 0 : genericViewStateProvider.provider) || null;
		if (context.options.initialViewState && (viewStateProvider === null || viewStateProvider === void 0 ? void 0 : viewStateProvider.applyState)) await viewStateProvider.applyState(context.options.initialViewState, {
			action: "restore",
			source: "initial"
		});
		return createFileRenderHandlerRendererSession(rendered, () => {
			const destroyRendered = () => {
				if (destroy) return destroy(rendered, context);
				return disposeFileViewerRendered(rendered);
			};
			try {
				genericViewStateProvider === null || genericViewStateProvider === void 0 || genericViewStateProvider.destroy();
			} finally {
				return destroyRendered();
			}
		});
	};
};
var createFileRenderHandlerRegistry = ({ definitions = DEFAULT_RENDERER_DEFINITIONS, handlers, getTarget, createContext, destroy }) => {
	const baseRegistry = createRendererRegistry(definitions);
	const dispatcher = createFileViewerRendererDispatcher({
		registry: baseRegistry,
		handlers
	});
	return {
		registry: createRendererRegistry(baseRegistry.list().map((definition) => {
			if (!dispatcher.handlersByRendererId.get(definition.id)) return definition;
			return {
				...definition,
				load: createFileRenderHandlerLoader({
					handler: (buffer, target, type, context) => renderFileViewerHandler({
						dispatcher,
						buffer,
						target,
						type,
						context,
						throwOnMissingHandler: true
					}),
					rendererId: definition.id,
					getTarget,
					createContext,
					destroy
				})
			};
		})),
		dispatcher,
		missingRendererIds: dispatcher.missingRendererIds
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/renderers/index.js
var createWrapper = (el) => ({
	$el: el,
	unmount() {}
});
var coreBrowserRendererHandlers = [{
	rendererId: "image",
	handler: async (buffer, target, type, context) => {
		const { default: renderImage } = await import("./image-BuJdd3F6.js");
		return renderImage(buffer, target, type, context);
	}
}];
var CORE_LITE_RENDERER_IDS = ["image"];
var coreLiteBrowserRendererHandlers = coreBrowserRendererHandlers.filter((handler) => CORE_LITE_RENDERER_IDS.includes(handler.rendererId));
var coreLiteRendererDefinitions = DEFAULT_RENDERER_DEFINITIONS.filter((definition) => CORE_LITE_RENDERER_IDS.includes(definition.id));
var resolveCoreRendererDefinitions = (preset) => {
	if (preset === "none") return [];
	if (preset === "lite") return coreLiteRendererDefinitions;
	return DEFAULT_RENDERER_DEFINITIONS;
};
var resolveCoreRendererHandlers = (preset) => {
	if (preset === "none") return [];
	if (preset === "lite") return coreLiteBrowserRendererHandlers;
	return coreBrowserRendererHandlers;
};
var renderUnsupported = async (_buffer, target, type, context) => {
	const state = createFileViewerUnsupportedState(type, void 0, context === null || context === void 0 ? void 0 : context.options);
	const wrapper = document.createElement("div");
	wrapper.style.textAlign = "center";
	wrapper.style.marginTop = "80px";
	const message = document.createElement("div");
	message.textContent = state.message;
	wrapper.appendChild(message);
	if (state.description) {
		const description = document.createElement("div");
		description.textContent = state.description;
		wrapper.appendChild(description);
	}
	target.replaceChildren(wrapper);
	return createWrapper(target);
};
var createFileViewerCoreRendererRegistry = (options = {}) => {
	const preset = options.builtinRenderers || "all";
	const bridge = createFileRenderHandlerRegistry({
		definitions: resolveCoreRendererDefinitions(preset),
		handlers: resolveCoreRendererHandlers(preset)
	});
	return {
		...bridge,
		dispatcher: createFileViewerRendererDispatcher({
			registry: bridge.registry,
			handlers: coreBrowserRendererHandlers,
			fallbackHandler: renderUnsupported
		})
	};
};
var fileViewerCoreRendererRegistryBridge = createFileViewerCoreRendererRegistry();
fileViewerCoreRendererRegistryBridge.registry;
fileViewerCoreRendererRegistryBridge.dispatcher;
fileViewerCoreRendererRegistryBridge.missingRendererIds;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/viewer/loading.js
var FALLBACK_FILE_VIEWER_LOADING_THEME = {
	accent: "#5f6f82",
	soft: "rgba(95, 111, 130, 0.12)",
	badge: "DOC",
	label: "文件内容",
	hint: "正在整理内容结构并生成预览。"
};
var FILE_VIEWER_LOADING_THEME_MAP = {
	doc: {
		accent: "#2b78f6",
		soft: "rgba(43, 120, 246, 0.12)",
		badge: "W",
		label: "Word 文档",
		hint: "正在准备分页、文本样式和文档结构。"
	},
	docx: {
		accent: "#2b78f6",
		soft: "rgba(43, 120, 246, 0.12)",
		badge: "W",
		label: "Word 文档",
		hint: "正在通过 Worker 准备文档结构、文本样式和分页结果。"
	},
	xls: {
		accent: "#21a366",
		soft: "rgba(33, 163, 102, 0.12)",
		badge: "X",
		label: "Excel 表格",
		hint: "正在准备工作表、样式和可视区数据。"
	},
	xlsx: {
		accent: "#21a366",
		soft: "rgba(33, 163, 102, 0.12)",
		badge: "X",
		label: "Excel 表格",
		hint: "正在准备工作表、样式和可视区数据。"
	},
	csv: {
		accent: "#21a366",
		soft: "rgba(33, 163, 102, 0.12)",
		badge: "X",
		label: "表格数据",
		hint: "正在准备行列数据和基础样式。"
	},
	tsv: {
		accent: "#21a366",
		soft: "rgba(33, 163, 102, 0.12)",
		badge: "X",
		label: "表格数据",
		hint: "正在准备行列数据和基础样式。"
	},
	ppt: {
		accent: "#f28b27",
		soft: "rgba(242, 139, 39, 0.12)",
		badge: "P",
		label: "PPT 演示文稿",
		hint: "正在构建幻灯片布局和媒体内容。"
	},
	pptx: {
		accent: "#f28b27",
		soft: "rgba(242, 139, 39, 0.12)",
		badge: "P",
		label: "PPT 演示文稿",
		hint: "正在构建幻灯片布局和媒体内容。"
	},
	pdf: {
		accent: "#e5534b",
		soft: "rgba(229, 83, 75, 0.12)",
		badge: "PDF",
		label: "PDF 文档",
		hint: "正在载入页面位图、文本层和缩放视图。"
	},
	ofd: {
		accent: "#c2410c",
		soft: "rgba(194, 65, 12, 0.12)",
		badge: "OFD",
		label: "OFD 版式文件",
		hint: "正在解析国产版式文档和页面对象。"
	},
	zip: {
		accent: "#a15c07",
		soft: "rgba(161, 92, 7, 0.12)",
		badge: "ZIP",
		label: "压缩包",
		hint: "正在启动 Worker 并读取压缩包目录。"
	},
	rar: {
		accent: "#a15c07",
		soft: "rgba(161, 92, 7, 0.12)",
		badge: "RAR",
		label: "压缩包",
		hint: "正在启动 Worker 并读取压缩包目录。"
	},
	"7z": {
		accent: "#a15c07",
		soft: "rgba(161, 92, 7, 0.12)",
		badge: "7Z",
		label: "压缩包",
		hint: "正在启动 Worker 并读取压缩包目录。"
	},
	tar: {
		accent: "#a15c07",
		soft: "rgba(161, 92, 7, 0.12)",
		badge: "TAR",
		label: "压缩包",
		hint: "正在启动 Worker 并读取压缩包目录。"
	},
	gz: {
		accent: "#a15c07",
		soft: "rgba(161, 92, 7, 0.12)",
		badge: "GZ",
		label: "压缩包",
		hint: "正在启动 Worker 并读取压缩包目录。"
	},
	eml: {
		accent: "#2563eb",
		soft: "rgba(37, 99, 235, 0.12)",
		badge: "EML",
		label: "邮件文件",
		hint: "正在解析邮件头、正文和附件。"
	},
	msg: {
		accent: "#2563eb",
		soft: "rgba(37, 99, 235, 0.12)",
		badge: "MSG",
		label: "邮件文件",
		hint: "正在解析 Outlook 邮件和附件。"
	},
	olb: {
		accent: "#0d7884",
		soft: "rgba(13, 120, 132, 0.12)",
		badge: "OLB",
		label: "EDA 文件",
		hint: "正在读取 EDA 容器结构和可读属性。"
	},
	dra: {
		accent: "#0d7884",
		soft: "rgba(13, 120, 132, 0.12)",
		badge: "DRA",
		label: "EDA 文件",
		hint: "正在读取 EDA 容器结构和可读属性。"
	},
	dxf: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "CAD",
		label: "CAD 图纸",
		hint: "正在准备 CAD 图层、几何对象和画布视图。"
	},
	dwg: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "CAD",
		label: "CAD 图纸",
		hint: "正在通过 Worker 加载 DWG 几何和 LibreDWG WASM。"
	},
	dwf: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "DWF",
		label: "CAD 图纸",
		hint: "正在加载 DWF native renderer 与 W2D/W3D 图形。"
	},
	dwfx: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "DWFx",
		label: "CAD 图纸",
		hint: "正在加载 DWFx/XPS native renderer 与页面图形。"
	},
	xps: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "XPS",
		label: "CAD 图纸",
		hint: "正在加载 XPS native renderer 与嵌入字体。"
	},
	drawio: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "DIO",
		label: "draw.io 图纸",
		hint: "正在解析图元、连线和 SVG 预览。"
	},
	dio: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "DIO",
		label: "draw.io 图纸",
		hint: "正在解析图元、连线和 SVG 预览。"
	},
	excalidraw: {
		accent: "#6d28d9",
		soft: "rgba(109, 40, 217, 0.12)",
		badge: "EX",
		label: "Excalidraw 图纸",
		hint: "正在解析手绘图元并生成安全 SVG。"
	},
	epub: {
		accent: "#7c3aed",
		soft: "rgba(124, 58, 237, 0.12)",
		badge: "EPUB",
		label: "EPUB 电子书",
		hint: "正在解析目录、章节资源和阅读分页。"
	},
	umd: {
		accent: "#0284c7",
		soft: "rgba(2, 132, 199, 0.12)",
		badge: "UMD",
		label: "UMD 电子书",
		hint: "正在解析移动电子书结构、目录和压缩正文。"
	},
	png: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	jpg: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	jpeg: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	gif: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	webp: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	svg: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	bmp: {
		accent: "#7c5cff",
		soft: "rgba(124, 92, 255, 0.12)",
		badge: "IMG",
		label: "图片文件",
		hint: "正在解码像素数据并生成预览。"
	},
	mp4: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "VID",
		label: "视频文件",
		hint: "正在准备媒体资源和播放组件。"
	},
	mp3: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	mpeg: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	wav: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	ogg: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	oga: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	opus: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	m4a: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	aac: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	flac: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	weba: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "AUD",
		label: "音频文件",
		hint: "正在准备音频资源和播放控件。"
	},
	mov: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "VID",
		label: "视频文件",
		hint: "正在准备媒体资源和播放组件。"
	},
	avi: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "VID",
		label: "视频文件",
		hint: "正在准备媒体资源和播放组件。"
	},
	webm: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "VID",
		label: "视频文件",
		hint: "正在准备媒体资源和播放组件。"
	},
	m4v: {
		accent: "#0f766e",
		soft: "rgba(15, 118, 110, 0.12)",
		badge: "VID",
		label: "视频文件",
		hint: "正在准备媒体资源和播放组件。"
	}
};
var FILE_VIEWER_LOADING_COPY_KEYS = {
	doc: {
		label: "loading.word.label",
		hint: "loading.word.hint"
	},
	docx: {
		label: "loading.word.label",
		hint: "loading.wordWorker.hint"
	},
	xls: {
		label: "loading.sheet.label",
		hint: "loading.sheet.hint"
	},
	xlsx: {
		label: "loading.sheet.label",
		hint: "loading.sheet.hint"
	},
	csv: {
		label: "loading.csv.label",
		hint: "loading.csv.hint"
	},
	tsv: {
		label: "loading.csv.label",
		hint: "loading.csv.hint"
	},
	ppt: {
		label: "loading.presentation.label",
		hint: "loading.presentation.hint"
	},
	pptx: {
		label: "loading.presentation.label",
		hint: "loading.presentation.hint"
	},
	pdf: {
		label: "loading.pdf.label",
		hint: "loading.pdf.hint"
	},
	ofd: {
		label: "loading.ofd.label",
		hint: "loading.ofd.hint"
	},
	zip: {
		label: "loading.archive.label",
		hint: "loading.archive.hint"
	},
	rar: {
		label: "loading.archive.label",
		hint: "loading.archive.hint"
	},
	"7z": {
		label: "loading.archive.label",
		hint: "loading.archive.hint"
	},
	tar: {
		label: "loading.archive.label",
		hint: "loading.archive.hint"
	},
	gz: {
		label: "loading.archive.label",
		hint: "loading.archive.hint"
	},
	eml: {
		label: "loading.email.label",
		hint: "loading.email.hint"
	},
	msg: {
		label: "loading.email.label",
		hint: "loading.msg.hint"
	},
	olb: {
		label: "loading.eda.label",
		hint: "loading.eda.hint"
	},
	dra: {
		label: "loading.eda.label",
		hint: "loading.eda.hint"
	},
	dxf: {
		label: "loading.cad.label",
		hint: "loading.cad.hint"
	},
	dwg: {
		label: "loading.cad.label",
		hint: "loading.dwg.hint"
	},
	dwf: {
		label: "loading.cad.label",
		hint: "loading.dwf.hint"
	},
	dwfx: {
		label: "loading.cad.label",
		hint: "loading.dwfx.hint"
	},
	xps: {
		label: "loading.cad.label",
		hint: "loading.xps.hint"
	},
	drawio: {
		label: "loading.drawio.label",
		hint: "loading.drawio.hint"
	},
	dio: {
		label: "loading.drawio.label",
		hint: "loading.drawio.hint"
	},
	excalidraw: {
		label: "loading.excalidraw.label",
		hint: "loading.excalidraw.hint"
	},
	epub: {
		label: "loading.epub.label",
		hint: "loading.epub.hint"
	},
	umd: {
		label: "loading.umd.label",
		hint: "loading.umd.hint"
	},
	png: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	jpg: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	jpeg: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	gif: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	webp: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	svg: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	bmp: {
		label: "loading.image.label",
		hint: "loading.image.hint"
	},
	mp4: {
		label: "loading.video.label",
		hint: "loading.video.hint"
	},
	mov: {
		label: "loading.video.label",
		hint: "loading.video.hint"
	},
	avi: {
		label: "loading.video.label",
		hint: "loading.video.hint"
	},
	webm: {
		label: "loading.video.label",
		hint: "loading.video.hint"
	},
	m4v: {
		label: "loading.video.label",
		hint: "loading.video.hint"
	},
	mp3: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	mpeg: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	wav: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	ogg: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	oga: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	opus: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	m4a: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	aac: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	flac: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	},
	weba: {
		label: "loading.audio.label",
		hint: "loading.audio.hint"
	}
};
/**
* 根据扩展名返回统一的加载主题。
* 这样不同预览器可以复用同一套视觉语义，避免颜色、图标和文案各写一份。
*/
var localizeFileViewerLoadingTheme = (theme, extend = "", i18n) => {
	const keys = FILE_VIEWER_LOADING_COPY_KEYS[extend.trim().toLowerCase()] || {
		label: "loading.generic.label",
		hint: "loading.generic.hint"
	};
	return {
		...theme,
		label: translateFileViewerMessage(i18n, keys.label),
		hint: translateFileViewerMessage(i18n, keys.hint)
	};
};
var resolveFileViewerLoadingTheme = (extend = "", i18n) => {
	const normalized = extend.trim().toLowerCase();
	return localizeFileViewerLoadingTheme(FILE_VIEWER_LOADING_THEME_MAP[normalized] || FALLBACK_FILE_VIEWER_LOADING_THEME, normalized, i18n);
};
var createFileViewerLoadingStyleVars = (theme) => ({
	"--viewer-accent": theme.accent,
	"--viewer-soft": theme.soft
});
var createFileViewerLoadingState = (extend = "", i18n) => {
	const theme = resolveFileViewerLoadingTheme(extend, i18n);
	return {
		loading: false,
		error: "",
		message: "",
		theme,
		styleVars: createFileViewerLoadingStyleVars(theme)
	};
};
var cloneFileViewerLoadingState = (state) => ({
	loading: state.loading,
	error: state.error,
	message: state.message,
	theme: { ...state.theme },
	styleVars: { ...state.styleVars }
});
var applyFileViewerLoadingState = (target, source) => {
	target.loading = source.loading;
	target.error = source.error;
	target.message = source.message;
	target.theme = { ...source.theme };
	target.styleVars = { ...source.styleVars };
	return target;
};
var syncFileViewerLoadingControllerState = (target, controller, source = controller.getState()) => {
	return applyFileViewerLoadingState(target, source);
};
var runFileViewerLoadingControllerAction = (target, action) => {
	return applyFileViewerLoadingState(target, action());
};
var runFileViewerLoadingExtensionSync = ({ target, controller, extension }) => {
	return runFileViewerLoadingControllerAction(target, () => controller.setExtension(extension));
};
var createFileViewerLoadingControllerActionHandlers = (target, controller) => {
	return {
		setExtension(nextExtend) {
			return runFileViewerLoadingExtensionSync({
				target,
				controller,
				extension: nextExtend
			});
		},
		setI18n(nextI18n) {
			return runFileViewerLoadingControllerAction(target, () => controller.setI18n(nextI18n));
		},
		startLoading(nextMessage) {
			return runFileViewerLoadingControllerAction(target, () => controller.startLoading(nextMessage));
		},
		setLoadingMessage(nextMessage) {
			return runFileViewerLoadingControllerAction(target, () => controller.setLoadingMessage(nextMessage));
		},
		stopLoading() {
			return runFileViewerLoadingControllerAction(target, () => controller.stopLoading());
		},
		showError(nextMessage) {
			return runFileViewerLoadingControllerAction(target, () => controller.showError(nextMessage));
		},
		clearError() {
			return runFileViewerLoadingControllerAction(target, () => controller.clearError());
		},
		resetLoading() {
			return runFileViewerLoadingControllerAction(target, () => controller.resetLoading());
		},
		syncLoadingState() {
			return syncFileViewerLoadingControllerState(target, controller);
		}
	};
};
/**
* 统一管理加载、错误、文案和主题色。
* wrapper 只负责把这个加载状态映射到各自框架的响应式系统。
*/
var createFileViewerLoadingController = (extend = "", initialI18n) => {
	let currentExtend = extend;
	let currentI18n = initialI18n;
	const state = createFileViewerLoadingState(extend, initialI18n);
	const updateTheme = (nextExtend) => {
		currentExtend = nextExtend;
		state.theme = resolveFileViewerLoadingTheme(nextExtend, currentI18n);
		state.styleVars = createFileViewerLoadingStyleVars(state.theme);
	};
	return {
		state,
		setExtension(nextExtend = "") {
			updateTheme(nextExtend);
			return cloneFileViewerLoadingState(state);
		},
		setI18n(nextI18n) {
			currentI18n = nextI18n;
			updateTheme(currentExtend);
			return cloneFileViewerLoadingState(state);
		},
		startLoading(nextMessage) {
			state.loading = true;
			state.message = nextMessage;
			state.error = "";
			return cloneFileViewerLoadingState(state);
		},
		setLoadingMessage(nextMessage) {
			state.message = nextMessage;
			return cloneFileViewerLoadingState(state);
		},
		stopLoading() {
			state.loading = false;
			state.message = "";
			return cloneFileViewerLoadingState(state);
		},
		showError(nextMessage) {
			state.loading = false;
			state.message = "";
			state.error = nextMessage;
			return cloneFileViewerLoadingState(state);
		},
		clearError() {
			state.error = "";
			return cloneFileViewerLoadingState(state);
		},
		resetLoading() {
			state.loading = false;
			state.message = "";
			state.error = "";
			return cloneFileViewerLoadingState(state);
		},
		getState() {
			return cloneFileViewerLoadingState(state);
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/lifecycle/facade.js
var createFileViewerLifecycleFacade = ({ getOptions, getFilename, getBufferSize, getCurrentFile, getCurrentVersion, getFallbackFile, getFallbackUrl, emitLifecycle, emitOperationBefore, emitOperationCancel, formatErrorMessage, handleLifecycleError, handleOperationError, onOperationErrorMessage }) => {
	const lifecycleState = createFileViewerLifecycleStateController();
	const lifecycleActions = createFileViewerLifecycleActions({
		lifecycleState,
		getOptions,
		onLifecycleChange: (_event, context) => {
			emitFileViewerComponentLifecycleEvent(emitLifecycle, context);
		},
		onLifecycleError: handleLifecycleError,
		onOperationBefore: emitOperationBefore,
		onOperationCancel: emitOperationCancel,
		onOperationError: (error, context) => {
			handleOperationError === null || handleOperationError === void 0 || handleOperationError(error, context);
			onOperationErrorMessage === null || onOperationErrorMessage === void 0 || onOperationErrorMessage(resolveFileViewerBeforeOperationErrorMessage({
				error,
				formatErrorMessage,
				i18n: getOptions()
			}), context);
		}
	});
	const buildOperationContext = (operation) => {
		return buildFileViewerOperationContextFromLifecycleState({
			operation,
			lifecycleState,
			version: getCurrentVersion(),
			filename: getFilename(),
			bufferSize: getBufferSize(),
			currentFile: getCurrentFile(),
			fallbackFile: getFallbackFile(),
			fallbackUrl: getFallbackUrl(),
			i18n: getOptions()
		});
	};
	return {
		markLoadStarted: lifecycleState.markLoadStarted,
		clearLoadStarted: lifecycleState.clearLoadStarted,
		notifyLifecycle: lifecycleActions.notifyLifecycle,
		notifyActiveUnloadStart: lifecycleActions.notifyActiveUnloadStart,
		notifyActiveUnloadComplete: lifecycleActions.notifyActiveUnloadComplete,
		setActiveDocumentContext: lifecycleState.setActiveDocumentContext,
		clearActiveDocumentContext: lifecycleState.clearActiveDocumentContext,
		buildOperationContext,
		buildLoadStartState({ version, source, file, sourceUrl }) {
			return createFileViewerLoadStartState({
				version,
				source,
				file,
				sourceUrl,
				filename: getFilename(),
				bufferSize: getBufferSize(),
				i18n: getOptions()
			});
		},
		buildRenderCompleteState({ version, source, file, sourceUrl }) {
			return createFileViewerRenderCompleteState({
				version,
				source,
				file,
				sourceUrl,
				filename: getFilename(),
				bufferSize: getBufferSize(),
				lifecycleState
			});
		},
		runBeforeOperation(operation) {
			return lifecycleActions.runBeforeOperation(buildOperationContext(operation));
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/config/options.js
var normalizeFileViewerTheme = (theme) => {
	return theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
};
var readSystemDarkMode = () => {
	return typeof globalThis.matchMedia === "function" && globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
};
var resolveFileViewerColorScheme = (theme, systemDark = readSystemDarkMode()) => {
	const normalizedTheme = normalizeFileViewerTheme(theme);
	return normalizedTheme === "system" ? systemDark ? "dark" : "light" : normalizedTheme;
};
var toggleFileViewerColorScheme = (theme, systemDark = readSystemDarkMode()) => {
	return resolveFileViewerColorScheme(theme, systemDark) === "dark" ? "light" : "dark";
};
var normalizeFileViewerUiDensity = (density) => {
	return density === "compact" ? "compact" : "comfortable";
};
var resolveFileViewerUiDensity = (options) => {
	var _a;
	return normalizeFileViewerUiDensity((_a = options === null || options === void 0 ? void 0 : options.ui) === null || _a === void 0 ? void 0 : _a.density);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/presentation/state.js
var resolveFileViewerPresentationState = ({ filename, file, url, options }) => {
	const displayFilename = resolveFileViewerSourceFilename({
		filename,
		file,
		url
	});
	return {
		displayFilename,
		extension: getExtension(displayFilename),
		toolbar: normalizeFileViewerToolbar(options),
		theme: normalizeFileViewerTheme(options === null || options === void 0 ? void 0 : options.theme),
		density: resolveFileViewerUiDensity(options)
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/platform/copiedAssets.js
var manifests = /* @__PURE__ */ new WeakMap();
var MAX_MANIFEST_BYTES = 1048576;
var readManifest = async (url, signal) => {
	var _a, _b, _c;
	const controller = new AbortController();
	const abort = () => controller.abort(signal === null || signal === void 0 ? void 0 : signal.reason);
	if (signal === null || signal === void 0 ? void 0 : signal.aborted) abort();
	else signal === null || signal === void 0 || signal.addEventListener("abort", abort, { once: true });
	const timeout = setTimeout(() => controller.abort(), 3e3);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			credentials: "same-origin"
		});
		if (!response.ok || !((_a = response.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.includes("json")) || Number(response.headers.get("content-length")) > MAX_MANIFEST_BYTES) return null;
		const reader = (_b = response.body) === null || _b === void 0 ? void 0 : _b.getReader();
		if (!reader) return null;
		const chunks = [];
		let size = 0;
		try {
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > MAX_MANIFEST_BYTES) return null;
				chunks.push(value);
			}
		} finally {
			await reader.cancel();
		}
		const bytes = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		const manifest = JSON.parse(new TextDecoder().decode(bytes));
		return (manifest === null || manifest === void 0 ? void 0 : manifest.schemaVersion) === 1 && manifest.packageName === "file-viewer-copy-assets" && Array.isArray((_c = manifest.validation) === null || _c === void 0 ? void 0 : _c.assets) ? manifest : null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
		signal === null || signal === void 0 || signal.removeEventListener("abort", abort);
	}
};
/** Finds assets copied by the standard CLI without trusting a SPA fallback or arbitrary manifest URLs. */
async function resolveFileViewerCopiedAssetUrl(documentRef, rendererId, assetId, signal) {
	var _a, _b, _c;
	const asset = (_a = getFileViewerRendererAssetManifest(rendererId)) === null || _a === void 0 ? void 0 : _a.assets.find((item) => item.id === assetId);
	if (!(asset === null || asset === void 0 ? void 0 : asset.defaultPath)) return void 0;
	const base = new URL(resolveFileViewerRuntimeAssetBaseUrl(documentRef));
	if (!["http:", "https:"].includes(base.protocol)) return void 0;
	const bases = base.pathname.endsWith("/file-viewer/") ? [base] : [new URL("file-viewer/", base), base];
	let cache = manifests.get(documentRef);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		manifests.set(documentRef, cache);
	}
	for (const directory of bases) {
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return void 0;
		const url = new URL("flyfish-viewer-assets.json", directory).href;
		const manifest = cache.has(url) ? cache.get(url) : await readManifest(url, signal);
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return void 0;
		cache.set(url, manifest || null);
		if ((_c = (_b = manifest === null || manifest === void 0 ? void 0 : manifest.validation) === null || _b === void 0 ? void 0 : _b.assets) === null || _c === void 0 ? void 0 : _c.find((item) => item && item.id === assetId && item.rendererId === rendererId && item.exists === true && item.relativePath === asset.defaultPath)) return new URL(asset.defaultPath, directory).href;
	}
}
//#endregion
export { createFileViewerViewStateChangeEmitter as $, resolveFileViewerDocxWorkerUrl as $t, runFileViewerPreviewComponentUnmount as A, DEFAULT_FILE_VIEWER_PPT_FONT_PATH as At, installFileViewerRendererPlugins as B, getDefaultFileViewerAssetBaseUrl as Bt, renderFileViewerHandler as C, DEFAULT_FILE_VIEWER_MODEL_WASM_URL as Ct, createFileViewerRequestScope as D, DEFAULT_FILE_VIEWER_PDF_STANDARD_FONT_PATH as Dt, createFileViewerPreviewStateTarget as E, DEFAULT_FILE_VIEWER_PDF_CMAP_PATH as Et, formatFileViewerErrorMessage as F, DEFAULT_FILE_VIEWER_PRESENTATION_WORKER_PATH as Ft, isFileViewerSnapshotDownloadPermitted as G, resolveFileViewerCadAssetUrls as Gt, registerFileViewerAutoRendererPreset as H, resolveFileViewerArchiveWasmUrl as Ht, normalizeFileViewerErrorMessage as I, DEFAULT_FILE_VIEWER_SPREADSHEET_WORKER_PATH as It, reportFileViewerLifecycleHookError as J, resolveFileViewerChmWorkerUrl as Jt, createFileViewerPublicApi as K, resolveFileViewerChmWasmModuleUrl as Kt, createFileViewerRendererDispatcher as L, DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_URL as Lt, attachFileViewerErrorMessage as M, DEFAULT_FILE_VIEWER_PPT_RUNTIME_VERSION as Mt, createFileViewerErrorState as N, DEFAULT_FILE_VIEWER_PPT_WASM_PATH as Nt, createFileViewerSourceLoadingActionHandlers as O, DEFAULT_FILE_VIEWER_PDF_WASM_PATH as Ot, createFileViewerUnsupportedState as P, DEFAULT_FILE_VIEWER_PPT_WORKER_PATH as Pt, createFileViewerViewStateChange as Q, resolveFileViewerDocxWorkerJsZipUrl as Qt, collectFileViewerRendererPlugins as R, DEFAULT_FILE_VIEWER_TYPST_FONT_ASSETS_URL as Rt, normalizeFileViewerStyleIsolation as S, DEFAULT_FILE_VIEWER_MODEL_RUNTIME_URL as St, DEFAULT_PDF_RANGE_CHUNK_SIZE as T, DEFAULT_FILE_VIEWER_PDF_CJK_FONT_FALLBACK_PATH as Tt, resolveFileViewerRendererPresetInputs as U, resolveFileViewerArchiveWorkerUrl as Ut, listFileViewerAutoRendererPresets as V, resolveFileViewerAdobeResourceWorkerUrl as Vt, createFileViewerSnapshotDownload as W, resolveFileViewerAssetUrl as Wt, createFileViewerPublicOperationActionHandlers as X, resolveFileViewerDesignContainerWorkerUrl as Xt, reportFileViewerOperationError as Y, resolveFileViewerDataSqlWasmUrl as Yt, DEFAULT_OPERATION_AVAILABILITY as Z, resolveFileViewerDesignWorkerUrl as Zt, createFileViewerRenderSurfaceActionHandlers as _, resolveFileViewerWordPerfectWorkerUrl as _n, DEFAULT_FILE_VIEWER_DATA_SQL_WASM_URL as _t, resolveFileViewerColorScheme as a, resolveFileViewerIworkWorkerUrl as an, readFileViewerText as at, getFileViewerShadowRootForNode as b, DEFAULT_FILE_VIEWER_DOCX_WORKER_PATH as bt, createFileViewerLoadingController as c, resolveFileViewerPostscriptWasmUrl as cn, DEFAULT_FILE_VIEWER_ARCHIVE_WASM_PATH as ct, createFileViewerCoreRendererRegistry as d, resolveFileViewerRuntimeAssetBaseUrl as dn, DEFAULT_FILE_VIEWER_CAD_RUNTIME_VERSION as dt, resolveFileViewerDrawioViewerScriptUrl as en, createFileViewerViewStateController as et, FILE_VIEWER_RENDER_SURFACE_BACKGROUND_PROPERTY as f, resolveFileViewerSpreadsheetWorkerUrl as fn, DEFAULT_FILE_VIEWER_CAD_WASM_PATH as ft, createFileViewerRenderReadinessTarget as g, resolveFileViewerWordPerfectWasmUrl as gn, DEFAULT_FILE_VIEWER_CHM_WORKER_PATH as gt, createFileRenderHandlerRendererSession as h, resolveFileViewerTypstRendererWasmUrl as hn, DEFAULT_FILE_VIEWER_CHM_WASM_PATH as ht, normalizeFileViewerUiDensity as i, resolveFileViewerIllustratorWorkerUrl as in, normalizeSource as it, runFileViewerPreviewSourceChange as j, DEFAULT_FILE_VIEWER_PPT_MODULE_PATH as jt, normalizeFileViewerSourceUrl as k, DEFAULT_FILE_VIEWER_PDF_WORKER_PATH as kt, createFileViewerLoadingControllerActionHandlers as l, resolveFileViewerPostscriptWorkerUrl as ln, DEFAULT_FILE_VIEWER_ARCHIVE_WORKER_PATH as lt, createFileRenderHandlerRegistry as m, resolveFileViewerTypstFontAssetsUrl as mn, DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH as mt, resolveFileViewerPresentationState as n, resolveFileViewerIdmlWasmUrl as nn, createFileViewerDocumentFeatureControllerActionHandlers as nt, toggleFileViewerColorScheme as o, resolveFileViewerModelAssetUrls as on, DEFAULT_RENDERER_DEFINITIONS as ot, createFileRenderHandlerLoader as p, resolveFileViewerTypstCompilerWasmUrl as pn, DEFAULT_FILE_VIEWER_CAD_WORKER_PATH as pt, createFileViewerToolbarControllerActionHandlers as q, resolveFileViewerChmWasmUrl as qt, normalizeFileViewerTheme as r, resolveFileViewerIdmlWorkerUrl as rn, DEFAULT_FILE_VIEWER_SEARCH_MAX_MATCHES as rt, createFileViewerLifecycleFacade as s, resolveFileViewerPdfAssetUrls as sn, DEFAULT_SUPPORTED_EXTENSIONS as st, resolveFileViewerCopiedAssetUrl as t, resolveFileViewerHangulWorkerUrl as tn, createFileViewerViewStateControllerActionHandlers as tt, coreBrowserRendererHandlers as u, resolveFileViewerPresentationWorkerUrl as un, DEFAULT_FILE_VIEWER_CAD_DWF_WASM_PATH as ut, createFileViewerRenderSurfaceStateTarget as v, DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION as vt, syncFileViewerRenderSurfaceBackground as w, DEFAULT_FILE_VIEWER_MODEL_WORKER_URL as wt, normalizeFileViewerRenderSurfaceBackground as x, DEFAULT_FILE_VIEWER_DRAWIO_VIEWER_SCRIPT_PATH as xt, disposeFileViewerRendered as y, DEFAULT_FILE_VIEWER_DOCX_WORKER_JSZIP_PATH as yt, createRendererRegistry as z, DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_URL as zt };
