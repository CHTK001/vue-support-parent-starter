import { Bt as getDefaultFileViewerAssetBaseUrl, I as normalizeFileViewerErrorMessage, M as attachFileViewerErrorMessage, b as getFileViewerShadowRootForNode, dn as resolveFileViewerRuntimeAssetBaseUrl, ot as DEFAULT_RENDERER_DEFINITIONS, t as resolveFileViewerCopiedAssetUrl, un as resolveFileViewerPresentationWorkerUrl } from "./dist-B6GcL3C6.js";
import { _ as unregisterFileViewerZoomProvider, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter } from "./fit-BmeG0j2O.js";
import { c as waitForFileViewerNextPaint } from "./export-D49MPTci.js";
import { n as resolveFileViewerLocale, t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { n as resolvePptxPackageWorkerUrl, r as RECOMMENDED_ZIP_LIMITS, t as PptxViewer } from "./dist-BHkjd7xj.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-pptx@3.1.2/node_modules/@file-viewer/renderer-pptx/dist/index.js
var pptxStyle = `
.pptx-viewer-shell{position:relative;box-sizing:border-box;min-height:100%;padding:24px 20px;background:var(--file-viewer-render-surface-background,#eef3f8);color:#1f2d3b;font-family:Aptos,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
.pptx-render-surface{min-height:240px}
.pptx-render-surface.is-loading{opacity:.72}
.pptx-loading{position:sticky;top:12px;z-index:3;box-sizing:border-box;display:inline-flex;align-items:center;gap:10px;margin:0 0 16px 50%;padding:10px 14px;border:1px solid rgba(42,94,144,.14);border-radius:999px;background:rgba(255,255,255,.92);color:#41556b;box-shadow:0 12px 32px rgba(24,44,64,.12);transform:translateX(-50%)}
.pptx-loading[hidden],.pptx-error[hidden]{display:none!important}
.pptx-loading-dot{width:9px;height:9px;border-radius:999px;background:#1f9d67;box-shadow:0 0 0 6px rgba(31,157,103,.13)}
.pptx-error{box-sizing:border-box;width:min(680px,calc(100% - 32px));margin:48px auto;padding:24px;border:1px solid rgba(28,43,58,.12);border-radius:14px;background:#fff;color:#1f2d3b;box-shadow:0 16px 42px rgba(25,42,54,.08)}
.pptx-slideshow-button{position:sticky;top:12px;z-index:4;float:right;display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 14px;border:1px solid rgba(42,94,144,.16);border-radius:999px;background:rgba(255,255,255,.94);color:#2a5e90;font:13px/1.2 inherit;cursor:pointer;box-shadow:0 10px 26px rgba(24,44,64,.12)}
.pptx-slideshow-button:hover{border-color:rgba(42,94,144,.34);color:#1d4a75}
.pptx-slideshow-button:focus-visible{outline:2px solid #2a5e90;outline-offset:2px}
.pptx-slideshow-button[hidden]{display:none!important}
.pptx-slideshow-button-glyph{font-size:11px;line-height:1}
.pptx-slideshow-button-key{padding:1px 6px;border-radius:6px;background:rgba(42,94,144,.1);font-size:11px;letter-spacing:.04em}
[data-viewer-theme='dark'] .pptx-slideshow-button{border-color:rgba(148,163,184,.2);background:rgba(15,23,42,.92);color:#cbd5e1}
[data-viewer-theme='dark'] .pptx-slideshow-button-key{background:rgba(148,163,184,.16)}
.pptx-error strong{display:block;margin-bottom:10px;font-size:18px}
.pptx-error p{margin:0;color:#607282;line-height:1.7}
[data-viewer-theme='dark'] .pptx-viewer-shell{background:var(--file-viewer-render-surface-background,#101820);color:#e5eef8}
[data-viewer-theme='dark'] .pptx-loading{border-color:rgba(148,163,184,.18);background:rgba(15,23,42,.9);color:#cbd5e1;box-shadow:0 18px 44px rgba(0,0,0,.26)}
[data-viewer-theme='dark'] .pptx-error{border-color:rgba(148,163,184,.18);background:#151f2b;color:#f8fafc;box-shadow:0 22px 56px rgba(0,0,0,.32)}
[data-viewer-theme='dark'] .pptx-error p{color:#94a3b8}
[data-viewer-theme='dark'] .pptx-render-surface .slide,[data-viewer-theme='dark'] .pptx-render-surface [data-slide-index]{color-scheme:only light;forced-color-adjust:none}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .pptx-viewer-shell{background:var(--file-viewer-render-surface-background,#101820);color:#e5eef8}[data-viewer-theme='system'] .pptx-loading{border-color:rgba(148,163,184,.18);background:rgba(15,23,42,.9);color:#cbd5e1;box-shadow:0 18px 44px rgba(0,0,0,.26)}[data-viewer-theme='system'] .pptx-error{border-color:rgba(148,163,184,.18);background:#151f2b;color:#f8fafc;box-shadow:0 22px 56px rgba(0,0,0,.32)}[data-viewer-theme='system'] .pptx-error p{color:#94a3b8}[data-viewer-theme='system'] .pptx-render-surface .slide,[data-viewer-theme='system'] .pptx-render-surface [data-slide-index]{color-scheme:only light;forced-color-adjust:none}}
`;
var pptxPrintStyle = `
  .pptx-viewer-shell {
    background: #fff !important;
    padding: 0 !important;
  }
  .pptx-render-surface {
    display: block !important;
    overflow: visible !important;
  }
  .pptx-render-surface [data-slide-index] {
    break-after: page;
    page-break-after: always;
    margin: 0 auto !important;
  }
  .pptx-render-surface [data-slide-index]:last-child {
    break-after: auto;
    page-break-after: auto;
  }
`;
var SLIDESHOW_HOTKEY_LABEL = "F5 / P";
var activePptxShells = /* @__PURE__ */ new WeakMap();
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = pptxStyle;
	return style;
};
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var resolvePptxStyleRoot = (surface, context) => {
	var _a, _b;
	return ((_a = context === null || context === void 0 ? void 0 : context.surface) === null || _a === void 0 ? void 0 : _a.shadowRoot) || getFileViewerShadowRootForNode((_b = context === null || context === void 0 ? void 0 : context.surface) === null || _b === void 0 ? void 0 : _b.container) || getFileViewerShadowRootForNode(surface) || void 0;
};
var clampZoomPercent = (value) => {
	return Math.min(300, Math.max(25, Math.round(value)));
};
var pptxDiagnosticMessages = {
	PPTX_FILE_EMPTY: {
		zh: "文件为空或过小，无法读取。",
		en: "The file is empty or too small to read.",
		ja: "ファイルが空であるか小さすぎるため、読み込めません。",
		de: "Die Datei ist leer oder zu klein zum Lesen."
	},
	PPTX_FILE_TOO_LARGE: {
		zh: "文件超过浏览器安全预览体积限制。",
		en: "The file is larger than the browser-safe preview limit.",
		ja: "ファイルがブラウザーで安全にプレビューできるサイズ上限を超えています。",
		de: "Die Datei überschreitet die sichere Vorschaugröße des Browsers."
	},
	PPTX_INVALID_ZIP: {
		zh: "文件不是有效的 PowerPoint OpenXML 压缩包。",
		en: "The file is not a valid PowerPoint OpenXML package.",
		ja: "有効な PowerPoint OpenXML パッケージではありません。",
		de: "Die Datei ist kein gültiges PowerPoint-OpenXML-Paket."
	},
	PPTX_MISSING_CONTENT_TYPES: {
		zh: "文件缺少 [Content_Types].xml，无法识别内部结构。",
		en: "The package is missing [Content_Types].xml, so its structure cannot be identified.",
		ja: "[Content_Types].xml がないため、内部構造を識別できません。",
		de: "[Content_Types].xml fehlt; die Paketstruktur kann nicht erkannt werden."
	},
	PPTX_MISSING_PRESENTATION: {
		zh: "文件缺少 ppt/presentation.xml，无法读取幻灯片列表。",
		en: "The package is missing ppt/presentation.xml, so the slide list cannot be read.",
		ja: "ppt/presentation.xml がないため、スライド一覧を読み込めません。",
		de: "ppt/presentation.xml fehlt; die Folienliste kann nicht gelesen werden."
	},
	PPTX_NO_SLIDES: {
		zh: "文件中没有找到可预览的幻灯片。",
		en: "No previewable slides were found in the file.",
		ja: "プレビュー可能なスライドが見つかりませんでした。",
		de: "Es wurden keine Folien für die Vorschau gefunden."
	},
	PPTX_MISSING_SLIDE: {
		zh: "文件缺少某一页幻灯片内容。",
		en: "The package is missing one of the slide parts.",
		ja: "スライド部品の一部がありません。",
		de: "Ein Folienbestandteil fehlt im Paket."
	},
	PPTX_SLIDE_RENDER_FAILED: {
		zh: "某一页幻灯片解析失败。",
		en: "One slide failed to parse.",
		ja: "スライドの解析に失敗しました。",
		de: "Eine Folie konnte nicht verarbeitet werden."
	},
	PPTX_WORKER_FAILED: {
		zh: "PPTX Worker 启动或运行失败。",
		en: "The PPTX Worker failed to start or run.",
		ja: "PPTX Worker の起動または実行に失敗しました。",
		de: "Der PPTX-Worker konnte nicht gestartet oder ausgeführt werden."
	},
	PPTX_PARSE_FAILED: {
		zh: "PPTX 文件解析失败。",
		en: "The PPTX file could not be parsed.",
		ja: "PPTX ファイルを解析できませんでした。ファイルを再保存するか、入力元を確認してください。",
		de: "Die PPTX-Datei konnte nicht verarbeitet werden."
	}
};
var pptxDiagnosticFallbackHints = {
	PPTX_INVALID_ZIP: {
		zh: "请确认接口返回的是原始 .pptx 二进制文件，而不是登录页、HTML/JSON 错误响应或被截断的内容。",
		en: "Confirm that the response is the original .pptx binary, not a login page, HTML/JSON error response, or truncated download.",
		ja: "レスポンスがログインページや HTML/JSON エラー、途中で切れたデータではなく、元の .pptx バイナリであることを確認してください。",
		de: "Prüfen Sie, ob die Antwort die ursprüngliche .pptx-Datei und keine Anmeldeseite, HTML/JSON-Fehlerantwort oder unvollständige Datei enthält."
	},
	PPTX_WORKER_FAILED: {
		zh: "请检查 presentation.workerUrl、Worker 文件路径、MIME 类型、CSP 和跨域策略。",
		en: "Check presentation.workerUrl, the Worker file path, MIME type, CSP, and cross-origin policy.",
		ja: "presentation.workerUrl、Worker のパス、MIME type、CSP、cross-origin policy を確認してください。",
		de: "Prüfen Sie presentation.workerUrl, den Worker-Pfad, den MIME-Typ, CSP und die Cross-Origin-Richtlinie."
	},
	PPTX_NO_SLIDES: {
		zh: "请重新保存演示文稿，或检查包内是否存在 ppt/slides/slide*.xml。",
		en: "Re-save the presentation, or check whether ppt/slides/slide*.xml exists inside the package.",
		ja: "プレゼンテーションを再保存するか、パッケージに ppt/slides/slide*.xml があるか確認してください。",
		de: "Speichern Sie die Präsentation erneut oder prüfen Sie, ob ppt/slides/slide*.xml im Paket vorhanden ist."
	}
};
var localizePptxDiagnosticCopy = (copy, locale) => {
	if (!copy) return "";
	return locale === "zh-CN" ? copy.zh : locale === "ja-JP" ? copy.ja : locale === "de-DE" ? copy.de : copy.en;
};
var sanitizePptxDiagnosticText = (value) => {
	if (typeof value !== "string") return "";
	return value.replace(/^Error:\s*/i, "").trim();
};
var isPptxDiagnosticErrorLike = (error) => {
	return Boolean(error && typeof error === "object" && (error.name === "PptxDiagnosticError" || error.code || error.stage));
};
var classifyPptxErrorString = (message) => {
	const lower = message.toLowerCase();
	if (lower.includes("end of central directory") || lower.includes("corrupt zip") || lower.includes("invalid zip") || lower.includes("not a zip") || lower.includes("jszip")) return {
		name: "PptxDiagnosticError",
		code: "PPTX_INVALID_ZIP",
		stage: "read-zip",
		detail: message
	};
	if (lower.includes("worker") || lower.includes("script error") || lower.includes("failed to construct") || lower.includes("failed to load")) return {
		name: "PptxDiagnosticError",
		code: "PPTX_WORKER_FAILED",
		stage: "worker-runtime",
		detail: message
	};
	if (lower.includes("[content_types].xml")) return {
		name: "PptxDiagnosticError",
		code: "PPTX_MISSING_CONTENT_TYPES",
		stage: "read-content-types",
		detail: message
	};
	if (lower.includes("ppt/presentation.xml")) return {
		name: "PptxDiagnosticError",
		code: "PPTX_MISSING_PRESENTATION",
		stage: "read-presentation",
		detail: message
	};
	if (lower.includes("slide") || lower.includes("ppt/slides/")) return {
		name: "PptxDiagnosticError",
		code: "PPTX_SLIDE_RENDER_FAILED",
		stage: "render-slide",
		detail: message
	};
	return null;
};
var formatPptxDiagnosticError = (error, fallback, context) => {
	const locale = resolveFileViewerLocale(context === null || context === void 0 ? void 0 : context.options);
	const code = String(error.code || "PPTX_PARSE_FAILED");
	const localizedReason = localizePptxDiagnosticCopy(pptxDiagnosticMessages[code], locale);
	const rawReason = sanitizePptxDiagnosticText(error.message);
	const reason = (locale === "zh-CN" ? rawReason || localizedReason : localizedReason || rawReason) || fallback;
	const detail = sanitizePptxDiagnosticText(error.detail);
	const hint = localizePptxDiagnosticCopy(pptxDiagnosticFallbackHints[code], locale) || sanitizePptxDiagnosticText(error.hint);
	const stage = sanitizePptxDiagnosticText(error.stage);
	const usesWesternPunctuation = locale === "en-US" || locale === "de-DE";
	const parts = [`${fallback}${usesWesternPunctuation ? ": " : "："}${reason}`];
	if (stage) parts.push(locale === "zh-CN" ? `阶段：${stage}` : locale === "ja-JP" ? `段階：${stage}` : locale === "de-DE" ? `Phase: ${stage}` : `Stage: ${stage}`);
	if (detail && detail !== reason) parts.push(locale === "zh-CN" ? `详情：${detail}` : locale === "ja-JP" ? `詳細：${detail}` : locale === "de-DE" ? `Details: ${detail}` : `Detail: ${detail}`);
	if (hint) parts.push(locale === "zh-CN" ? `建议：${hint}` : locale === "ja-JP" ? `対処：${hint}` : locale === "de-DE" ? `Hinweis: ${hint}` : `Hint: ${hint}`);
	return parts.join(usesWesternPunctuation ? "; " : "；");
};
var formatErrorMessage = (error, fallback, context) => {
	if (isPptxDiagnosticErrorLike(error)) return formatPptxDiagnosticError(error, fallback, context);
	if (error instanceof Error || typeof error === "string") {
		const normalized = normalizeFileViewerErrorMessage(error, context === null || context === void 0 ? void 0 : context.options);
		const classified = classifyPptxErrorString(normalized);
		if (classified) return formatPptxDiagnosticError(classified, fallback, context);
		return normalized || fallback;
	}
	if (error === void 0 || error === null) return fallback;
	try {
		const serialized = JSON.stringify(error) || "";
		if (serialized) {
			const classified = classifyPptxErrorString(serialized);
			if (classified) return formatPptxDiagnosticError(classified, fallback, context);
		}
		return serialized || fallback;
	} catch {
		return String(error || fallback);
	}
};
var collectPptxPrintMaskPages = (surface) => {
	const slots = Array.from(surface.querySelectorAll(".flyfish-pptx-slide-slot"));
	return slots.length ? slots : Array.from(surface.querySelectorAll("[data-slide-index], .slide"));
};
var buildExportAdapter = (surface, targetWindow, getViewer) => ({
	print: true,
	exportHtml: true,
	includeDocumentStyles: true,
	beforeSnapshot: () => waitForFileViewerNextPaint(targetWindow || void 0),
	getPrintMaskPages: () => collectPptxPrintMaskPages(surface),
	printStyle: pptxPrintStyle,
	toHtml: async () => {
		var _a;
		const clone = await ((_a = getViewer()) === null || _a === void 0 ? void 0 : _a.cloneForExport()) || surface.cloneNode(true);
		collectPptxPrintMaskPages(clone).forEach((page, index) => {
			page.dataset.viewerPrintPageIndex = String(index);
		});
		return clone.outerHTML;
	}
});
async function renderPptx(buffer, target, _type, context) {
	var _a;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const documentRef = target.ownerDocument || document;
	const targetWindow = documentRef.defaultView || (typeof window !== "undefined" ? window : null);
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	let viewer = null;
	let state = "loading";
	let errorMessage = "";
	let zoomPercent = 100;
	let progressiveReady = false;
	let disposed = false;
	const style = createStyle(documentRef);
	const shell = createElement(documentRef, "div", "pptx-viewer-shell");
	shell.dataset.viewerZoomProvider = "pptx";
	const loading = createElement(documentRef, "div", "pptx-loading");
	loading.setAttribute("aria-live", "polite");
	loading.append(createElement(documentRef, "span", "pptx-loading-dot"), createElement(documentRef, "span", void 0, t("presentation.state.loading")));
	const error = createElement(documentRef, "div", "pptx-error");
	const errorTitle = createElement(documentRef, "strong", void 0, t("presentation.error.title"));
	const errorText = createElement(documentRef, "p");
	error.append(errorTitle, errorText);
	const slideshowButton = createElement(documentRef, "button", "pptx-slideshow-button");
	slideshowButton.type = "button";
	slideshowButton.hidden = true;
	const slideshowGlyph = createElement(documentRef, "span", "pptx-slideshow-button-glyph", "▶");
	const slideshowText = createElement(documentRef, "span", void 0, t("presentation.slideshow.start"));
	const slideshowKey = createElement(documentRef, "span", "pptx-slideshow-button-key", SLIDESHOW_HOTKEY_LABEL);
	slideshowButton.append(slideshowGlyph, slideshowText, slideshowKey);
	slideshowButton.addEventListener("click", () => {
		viewer === null || viewer === void 0 || viewer.togglePresentation();
	});
	const surface = createElement(documentRef, "div", "pptx-render-surface");
	shell.append(loading, error, slideshowButton, surface);
	target.replaceChildren(style, shell);
	const activateShell = () => {
		activePptxShells.set(documentRef, shell);
	};
	const deactivateShell = (event) => {
		if ((viewer === null || viewer === void 0 ? void 0 : viewer.presenting) || activePptxShells.get(documentRef) !== shell) return;
		if (event.composedPath().includes(shell)) return;
		const targetElement = event.target;
		if (event.type === "focusin" && !(targetElement === null || targetElement === void 0 ? void 0 : targetElement.matches("button, a, input, textarea, select, [contenteditable], [tabindex]"))) return;
		activePptxShells.delete(documentRef);
	};
	shell.addEventListener("pointerdown", activateShell);
	shell.addEventListener("focusin", activateShell);
	documentRef.addEventListener("pointerdown", deactivateShell);
	documentRef.addEventListener("focusin", deactivateShell);
	const isEditableTarget = (node) => {
		const element = node;
		if (!element || typeof element.closest !== "function") return false;
		return Boolean(element.closest("input, textarea, select, [contenteditable=\"\"], [contenteditable=\"true\"]"));
	};
	const handleShortcut = (event) => {
		if (disposed || !viewer || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key !== "F5" && event.key !== "p" && event.key !== "P") return;
		if (!shell.isConnected || isEditableTarget(event.target)) return;
		if (activePptxShells.get(documentRef) !== shell) return;
		const targetElement = event.target;
		if (targetElement && typeof targetElement.closest === "function") {
			const targetShell = targetElement.closest(".pptx-viewer-shell");
			if (targetShell && targetShell !== shell) return;
		}
		event.preventDefault();
		viewer.togglePresentation();
	};
	documentRef.addEventListener("keydown", handleShortcut);
	(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, {
		captureSource: "embedded",
		beforeCapture: async ({ signal }) => {
			const hasFirstVisual = () => Boolean((viewer === null || viewer === void 0 ? void 0 : viewer.thumbnailDataUrl) || surface.querySelector(".slide, .flyfish-pptx-thumbnail"));
			while ((state === "loading" || state === "ready" && !hasFirstVisual()) && !disposed) {
				if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw signal.reason;
				await new Promise((resolve) => {
					if (targetWindow) targetWindow.setTimeout(resolve, 16);
					else setTimeout(resolve, 16);
				});
			}
			if (state === "error") throw new Error(errorMessage || t("presentation.error.parseFailed"));
		},
		capture: () => (viewer === null || viewer === void 0 ? void 0 : viewer.thumbnailDataUrl) ? fetch(viewer.thumbnailDataUrl).then((response) => response.blob()) : null,
		getTarget: () => surface
	});
	const getCurrentZoomPercent = () => {
		var _a;
		return clampZoomPercent((_a = viewer === null || viewer === void 0 ? void 0 : viewer.zoomPercent) !== null && _a !== void 0 ? _a : zoomPercent);
	};
	const getZoomState = () => {
		const percent = getCurrentZoomPercent();
		return {
			scale: percent / 100,
			label: `${percent}%`,
			canZoomIn: percent < 300,
			canZoomOut: percent > 25,
			canReset: percent !== 100,
			minScale: .25,
			maxScale: 3
		};
	};
	const setZoom = async (percent) => {
		const nextPercent = clampZoomPercent(percent);
		zoomPercent = nextPercent;
		if (viewer) {
			await viewer.setZoom(nextPercent);
			zoomPercent = getCurrentZoomPercent();
		}
		zoomEmitter.emit();
		return getZoomState();
	};
	const notifyProgressiveReady = () => {
		var _a, _b;
		if (progressiveReady || disposed || ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.aborted)) return;
		progressiveReady = true;
		(_b = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _b === void 0 || _b.call(context);
	};
	const syncUi = () => {
		var _a;
		loading.hidden = !(state === "loading" && !errorMessage);
		error.hidden = state !== "error";
		errorText.textContent = errorMessage;
		surface.classList.toggle("is-loading", state === "loading");
		const presenting = Boolean(viewer === null || viewer === void 0 ? void 0 : viewer.presenting);
		slideshowButton.hidden = state !== "ready" || ((_a = viewer === null || viewer === void 0 ? void 0 : viewer.slideCount) !== null && _a !== void 0 ? _a : 0) === 0;
		slideshowText.textContent = presenting ? t("presentation.slideshow.exit") : t("presentation.slideshow.start");
		slideshowButton.setAttribute("aria-pressed", presenting ? "true" : "false");
	};
	const registerExportAdapter = () => {
		var _a;
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, buildExportAdapter(surface, targetWindow, () => viewer));
	};
	const reportPptxFailure = (failure) => {
		var _a;
		state = "error";
		errorMessage = formatErrorMessage(failure, t("presentation.error.parseFailed"), context);
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
		syncUi();
		return attachFileViewerErrorMessage(failure, errorMessage);
	};
	registerFileViewerZoomProvider(shell, {
		zoomIn: () => setZoom(getCurrentZoomPercent() + 15),
		zoomOut: () => setZoom(getCurrentZoomPercent() - 15),
		resetZoom: () => setZoom(100),
		setZoom: (scale) => setZoom(scale * 100),
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	const openPresentation = async () => {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
		state = "loading";
		errorMessage = "";
		progressiveReady = false;
		syncUi();
		const presentationOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.presentation;
		let resolveCompletion;
		let rejectCompletion;
		const completion = new Promise((resolve, reject) => {
			resolveCompletion = resolve;
			rejectCompletion = reject;
		});
		completion.catch(() => {});
		const abort = () => {
			var _a;
			const reason = ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.reason) || new DOMException("PPTX rendering aborted.", "AbortError");
			viewer === null || viewer === void 0 || viewer.destroy();
			viewer = null;
			rejectCompletion(reason);
		};
		(_b = context === null || context === void 0 ? void 0 : context.signal) === null || _b === void 0 || _b.addEventListener("abort", abort, { once: true });
		try {
			if ((_c = context === null || context === void 0 ? void 0 : context.signal) === null || _c === void 0 ? void 0 : _c.aborted) throw context.signal.reason || new DOMException("PPTX rendering aborted.", "AbortError");
			const workerUrl = (presentationOptions === null || presentationOptions === void 0 ? void 0 : presentationOptions.workerUrl) || getDefaultFileViewerAssetBaseUrl() ? resolveFileViewerPresentationWorkerUrl(presentationOptions, resolveFileViewerRuntimeAssetBaseUrl(documentRef)) : resolvePptxPackageWorkerUrl() || await resolveFileViewerCopiedAssetUrl(documentRef, "office-presentation", "pptx-worker", context === null || context === void 0 ? void 0 : context.signal);
			if ((_d = context === null || context === void 0 ? void 0 : context.signal) === null || _d === void 0 ? void 0 : _d.aborted) throw context.signal.reason || new DOMException("PPTX rendering aborted.", "AbortError");
			if (!workerUrl) throw new Error("PPTX Worker URL is unavailable. Run file-viewer-copy-assets or provide presentation.workerUrl.");
			const nextViewer = await PptxViewer.open(buffer, surface, {
				styleRoot: resolvePptxStyleRoot(surface, context),
				fitMode: "contain",
				zoomPercent,
				workerUrl,
				workerType: presentationOptions === null || presentationOptions === void 0 ? void 0 : presentationOptions.workerType,
				zipLimits: RECOMMENDED_ZIP_LIMITS,
				lazySlides: true,
				lazyMedia: true,
				listOptions: {
					windowed: true,
					initialSlides: 3,
					batchSize: 4,
					overscanViewport: 1.5
				},
				presentationLabels: {
					exit: t("presentation.slideshow.exit"),
					hint: t("presentation.slideshow.hint")
				},
				onPresentationChange: (state) => {
					if (!disposed) {
						if (state.active) activePptxShells.set(documentRef, shell);
						syncUi();
					}
				},
				onSlideRendered: () => notifyProgressiveReady(),
				onRenderComplete: () => {
					var _a;
					if (disposed || ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.aborted)) return;
					state = "ready";
					notifyProgressiveReady();
					zoomPercent = getCurrentZoomPercent();
					syncUi();
					zoomEmitter.emit();
					resolveCompletion();
				},
				onSlideError: (_index, error) => {
					console.warn("PPTX slide render warning:", error);
				},
				onError: (error) => {
					var _a;
					if (disposed || ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.aborted)) return;
					rejectCompletion(reportPptxFailure(error));
				}
			});
			if (disposed || ((_e = context === null || context === void 0 ? void 0 : context.signal) === null || _e === void 0 ? void 0 : _e.aborted)) {
				nextViewer.destroy();
				throw ((_f = context === null || context === void 0 ? void 0 : context.signal) === null || _f === void 0 ? void 0 : _f.reason) || new DOMException("PPTX rendering aborted.", "AbortError");
			}
			viewer = nextViewer;
			await completion;
			if (disposed || ((_g = context === null || context === void 0 ? void 0 : context.signal) === null || _g === void 0 ? void 0 : _g.aborted)) throw ((_h = context === null || context === void 0 ? void 0 : context.signal) === null || _h === void 0 ? void 0 : _h.reason) || new DOMException("PPTX rendering aborted.", "AbortError");
			zoomPercent = getCurrentZoomPercent();
			registerExportAdapter();
			syncUi();
			zoomEmitter.emit();
		} catch (error) {
			if (disposed || ((_j = context === null || context === void 0 ? void 0 : context.signal) === null || _j === void 0 ? void 0 : _j.aborted)) throw error;
			viewer === null || viewer === void 0 || viewer.destroy();
			viewer = null;
			throw reportPptxFailure(error);
		} finally {
			(_k = context === null || context === void 0 ? void 0 : context.signal) === null || _k === void 0 || _k.removeEventListener("abort", abort);
		}
	};
	const cleanup = () => {
		var _a, _b;
		if (disposed) return;
		disposed = true;
		documentRef.removeEventListener("keydown", handleShortcut);
		documentRef.removeEventListener("pointerdown", deactivateShell);
		documentRef.removeEventListener("focusin", deactivateShell);
		shell.removeEventListener("pointerdown", activateShell);
		shell.removeEventListener("focusin", activateShell);
		if (activePptxShells.get(documentRef) === shell) activePptxShells.delete(documentRef);
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
		(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, null);
		unregisterFileViewerZoomProvider(shell);
		viewer === null || viewer === void 0 || viewer.destroy();
		viewer = null;
		target.replaceChildren();
	};
	try {
		await openPresentation();
	} catch (error) {
		cleanup();
		throw error;
	}
	return {
		$el: shell,
		unmount: cleanup
	};
}
var presentationDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "office-presentation");
if (!presentationDefinition) throw new Error("@file-viewer/renderer-pptx could not locate the core PPTX renderer definition.");
presentationDefinition.id;
//#endregion
export { renderPptx as default };
