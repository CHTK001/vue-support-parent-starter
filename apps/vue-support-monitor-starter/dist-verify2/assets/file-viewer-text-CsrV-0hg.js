const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/plugin-DgCPbLgw.js","assets/rolldown-runtime-CEgmsyvS.js","assets/core-Dk1zawR-.js"])))=>i.map(i=>d[i]);
import { $s as createEmptyFileViewerSearchState, Bs as unregisterFileViewerSearchProvider, Hs as unregisterFileViewerZoomProvider, Ji as assertFileViewerMermaidSourceHasNoExternalResources, Ls as registerFileViewerSearchProvider, Xi as sanitizeFileViewerSvgResources, Zo as resolveFileViewerFitScale, dr as disposeFileViewerRendered, gc as decodeFileViewerTextBuffer, hc as createFileViewerTextDecoder, ho as createFileViewerTranslator, nc as normalizeFileViewerSearchOptions, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, vc as resolveFileViewerTextEncoding, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
import { f as purify } from "./file-viewer-drawing-DeKTjxNF.js";
import { g as getFileViewerPakoLoader, h as getFileViewerMermaidLoader, m as getFileViewerDiffToHtml, p as sanitizeFileViewerRichHtml } from "./file-viewer-preset-all-CExGzNo-.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/codeStyle.js
var codeStyle = `
.code-viewer{min-height:100%;--code-bg:#f6f8fa;--code-toolbar-bg:rgba(255,255,255,.92);--code-border:rgba(31,35,40,.12);--code-text:#24292f;--code-muted:#57606a;--code-keyword:#cf222e;--code-title:#8250df;--code-string:#0a3069;--code-number:#0550ae;--code-comment:#6e7781;--code-attr:#953800;--code-built-in:#116329;--code-accent:#0969da;--code-accent-border:rgba(9,105,218,.28);--code-accent-soft:rgba(9,105,218,.1);background:var(--code-bg);color:var(--code-text);box-sizing:border-box}
.code-toolbar{position:sticky;top:0;z-index:2;display:flex;height:42px;align-items:center;justify-content:space-between;gap:16px;padding:0 16px;border-bottom:1px solid var(--code-border);background:var(--code-toolbar-bg);backdrop-filter:blur(12px);box-sizing:border-box}
.code-toolbar span,.code-toolbar strong{color:var(--code-muted);font-size:12px;font-weight:700;letter-spacing:0}
.code-toolbar-meta{display:inline-flex;min-width:0;align-items:center;justify-content:flex-end;gap:10px;white-space:nowrap}
.code-toolbar-meta>span{overflow:hidden;text-overflow:ellipsis}
.code-format-status{display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border:1px solid var(--code-accent-border);border-radius:999px;background:var(--code-accent-soft);color:var(--code-accent)!important;font-size:11px!important}
.code-format-toggle{min-height:26px;padding:0 9px;border:1px solid var(--code-border);border-radius:6px;background:var(--code-bg);color:var(--code-text);font:600 11px/1.2 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer}
.code-format-toggle:hover{border-color:var(--code-accent);color:var(--code-accent)}
.code-format-toggle:focus-visible{outline:2px solid var(--code-accent);outline-offset:2px}
.code-area{display:block;min-width:min-content;margin:0;padding:18px 20px 28px;overflow:auto;background:transparent;box-sizing:border-box}
.code-area--line-numbers{display:grid;grid-template-columns:max-content max-content;padding:18px 0 28px}
.code-line-numbers{position:sticky;left:0;z-index:1;display:block;min-width:4ch;padding:0 12px 0 16px;border-right:1px solid var(--code-border);background:var(--code-bg);color:var(--code-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:var(--code-font-size,13px);line-height:1.7;text-align:right;white-space:pre;user-select:none;box-sizing:border-box}
.code-area.code-area--line-numbers code{padding:0 20px}
.code-area code{display:block;padding:0;overflow:visible;background:transparent;color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:var(--code-font-size,13px);line-height:1.7;tab-size:2;white-space:pre}
.code-viewer--wrap-lines .code-area{width:100%;min-width:0;overflow-x:hidden}
.code-viewer--wrap-lines .code-area code{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.code-area--wrapped-line-numbers{display:block;padding:18px 0 28px}
.code-area--wrapped-line-numbers code{width:100%;padding:0;white-space:normal!important}
.code-source-line{display:grid;width:100%;min-width:0;grid-template-columns:max-content minmax(0,1fr);align-items:stretch;min-height:1.7em}
.code-source-line-number{position:sticky;left:0;z-index:1;display:block;min-width:4ch;padding:0 12px 0 16px;border-right:1px solid var(--code-border);background:var(--code-bg);color:var(--code-muted);font:inherit;line-height:inherit;text-align:right;white-space:pre;user-select:none;box-sizing:border-box}
.code-source-line-content{display:block;min-width:0;padding:0 20px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;box-sizing:border-box}
.code-source-line-content:empty::after{content:' '}
.code-area .hljs-comment,.code-area .hljs-quote{color:var(--code-comment)}
.code-area .hljs-keyword,.code-area .hljs-selector-tag,.code-area .hljs-subst{color:var(--code-keyword)}
.code-area .hljs-string,.code-area .hljs-doctag,.code-area .hljs-regexp{color:var(--code-string)}
.code-area .hljs-title,.code-area .hljs-section,.code-area .hljs-selector-id{color:var(--code-title);font-weight:700}
.code-area .hljs-number,.code-area .hljs-literal,.code-area .hljs-variable,.code-area .hljs-template-variable{color:var(--code-number)}
.code-area .hljs-attr,.code-area .hljs-attribute,.code-area .hljs-name,.code-area .hljs-selector-class{color:var(--code-attr)}
.code-area .hljs-built_in,.code-area .hljs-type,.code-area .hljs-class .hljs-title{color:var(--code-built-in)}
[data-viewer-theme='dark'] .code-viewer{--code-bg:#0d1117;--code-toolbar-bg:rgba(13,17,23,.92);--code-border:rgba(139,148,158,.24);--code-text:#e6edf3;--code-muted:#8b949e;--code-keyword:#ff7b72;--code-title:#d2a8ff;--code-string:#a5d6ff;--code-number:#79c0ff;--code-comment:#8b949e;--code-attr:#ffa657;--code-built-in:#7ee787;--code-accent:#58a6ff;--code-accent-border:rgba(88,166,255,.32);--code-accent-soft:rgba(56,139,253,.15)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .code-viewer{--code-bg:#0d1117;--code-toolbar-bg:rgba(13,17,23,.92);--code-border:rgba(139,148,158,.24);--code-text:#e6edf3;--code-muted:#8b949e;--code-keyword:#ff7b72;--code-title:#d2a8ff;--code-string:#a5d6ff;--code-number:#79c0ff;--code-comment:#8b949e;--code-attr:#ffa657;--code-built-in:#7ee787;--code-accent:#58a6ff;--code-accent-border:rgba(88,166,255,.32);--code-accent-soft:rgba(56,139,253,.15)}}
`;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/largeText.js
var DEFAULT_LARGE_TEXT_THRESHOLD_BYTES = 524288;
var DEFAULT_LARGE_TEXT_LINE_SEGMENT_BYTES = 16384;
var LARGE_TEXT_LINE_CHECKPOINT_STRIDE = 256;
var LARGE_TEXT_INDEX_YIELD_BYTES = 4194304;
var LARGE_TEXT_SEARCH_CHUNK_BYTES = 262144;
var LARGE_TEXT_MAX_SCROLL_HEIGHT = 8e6;
var LARGE_TEXT_BASE_LINE_HEIGHT = 22.1;
var LARGE_TEXT_MEASUREMENT_BLOCK_LINES = 256;
var clamp = (value, minimum, maximum) => {
	return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : minimum;
};
var clampZoom$4 = (value) => {
	return Math.min(2.6, Math.max(.6, Number(value.toFixed(2))));
};
var getWindow = (target) => target.ownerDocument.defaultView;
var nextBrowserTurn = (target) => {
	const view = getWindow(target);
	return new Promise((resolve) => {
		if (view === null || view === void 0 ? void 0 : view.setTimeout) {
			view.setTimeout(resolve, 0);
			return;
		}
		setTimeout(resolve, 0);
	});
};
var isUtf8ContinuationByte = (value) => (value & 192) === 128;
var alignUtf8Start = (bytes, offset, limit) => {
	let nextOffset = clamp(offset, 0, limit);
	while (nextOffset < limit && isUtf8ContinuationByte(bytes[nextOffset])) nextOffset += 1;
	return nextOffset;
};
var alignUtf8End = (bytes, offset, limit) => {
	let nextOffset = clamp(offset, 0, limit);
	while (nextOffset < limit && isUtf8ContinuationByte(bytes[nextOffset])) nextOffset += 1;
	return nextOffset;
};
var gb18030UnitLength = (bytes, offset, limit) => {
	const first = bytes[offset];
	const second = bytes[offset + 1];
	const third = bytes[offset + 2];
	const fourth = bytes[offset + 3];
	if (first === void 0 || first <= 127) return 1;
	if (first >= 129 && first <= 254) {
		if (second !== void 0 && second >= 48 && second <= 57 && third !== void 0 && third >= 129 && third <= 254 && fourth !== void 0 && fourth >= 48 && fourth <= 57 && offset + 4 <= limit) return 4;
		if (second !== void 0 && (second >= 64 && second <= 126 || second >= 128 && second <= 254) && offset + 2 <= limit) return 2;
	}
	return 1;
};
var alignGb18030Boundary = (bytes, knownBoundary, requestedOffset, limit) => {
	let cursor = clamp(knownBoundary, 0, limit);
	const requested = clamp(requestedOffset, cursor, limit);
	while (cursor < requested) cursor = Math.min(limit, cursor + gb18030UnitLength(bytes, cursor, limit));
	return cursor;
};
var alignTextBoundary = (index, knownBoundary, requestedOffset, limit) => {
	return index.encoding === "gb18030" ? alignGb18030Boundary(index.bytes, knownBoundary, requestedOffset, limit) : alignUtf8End(index.bytes, requestedOffset, limit);
};
var isLineBreak = (bytes, offset) => {
	const byte = bytes[offset];
	if (byte === 13) return bytes[offset + 1] === 10 ? 2 : 1;
	return byte === 10 ? 1 : 0;
};
var buildLargeTextIndex = async (bytes, encoding, target, onProgress) => {
	const checkpoints = [0];
	let lineIndex = 0;
	let offset = 0;
	let nextYieldOffset = LARGE_TEXT_INDEX_YIELD_BYTES;
	while (offset < bytes.byteLength) {
		const lineBreakSize = isLineBreak(bytes, offset);
		if (lineBreakSize) {
			offset += lineBreakSize;
			lineIndex += 1;
			if (lineIndex % LARGE_TEXT_LINE_CHECKPOINT_STRIDE === 0) checkpoints.push(offset);
		} else offset += 1;
		if (offset >= nextYieldOffset) {
			onProgress(Math.min(99, Math.round(offset / Math.max(1, bytes.byteLength) * 100)));
			nextYieldOffset = offset + LARGE_TEXT_INDEX_YIELD_BYTES;
			await nextBrowserTurn(target);
		}
	}
	onProgress(100);
	return {
		bytes,
		checkpoints,
		encoding,
		lineCount: lineIndex + 1
	};
};
var locateLargeTextLineStart = (index, requestedLine) => {
	var _a;
	const lineIndex = clamp(Math.trunc(requestedLine), 0, index.lineCount - 1);
	const checkpointIndex = Math.floor(lineIndex / LARGE_TEXT_LINE_CHECKPOINT_STRIDE);
	let currentLine = checkpointIndex * LARGE_TEXT_LINE_CHECKPOINT_STRIDE;
	let offset = (_a = index.checkpoints[checkpointIndex]) !== null && _a !== void 0 ? _a : 0;
	while (currentLine < lineIndex && offset < index.bytes.byteLength) {
		const lineBreakSize = isLineBreak(index.bytes, offset);
		offset += lineBreakSize || 1;
		if (lineBreakSize) currentLine += 1;
	}
	return offset;
};
var readLargeTextLineBounds = (index, startLine, count) => {
	const lines = [];
	let lineIndex = clamp(Math.trunc(startLine), 0, index.lineCount - 1);
	let offset = locateLargeTextLineStart(index, lineIndex);
	while (lines.length < count && lineIndex < index.lineCount) {
		const start = offset;
		while (offset < index.bytes.byteLength && !isLineBreak(index.bytes, offset)) offset += 1;
		lines.push({
			lineIndex,
			start,
			end: offset
		});
		const lineBreakSize = isLineBreak(index.bytes, offset);
		offset += lineBreakSize;
		lineIndex += 1;
	}
	return lines;
};
var findLargeTextLineAtOffset = (index, requestedOffset) => {
	var _a, _b;
	const offset = clamp(Math.trunc(requestedOffset), 0, index.bytes.byteLength);
	let low = 0;
	let high = index.checkpoints.length - 1;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (((_a = index.checkpoints[middle]) !== null && _a !== void 0 ? _a : 0) <= offset) low = middle;
		else high = middle - 1;
	}
	let lineIndex = low * LARGE_TEXT_LINE_CHECKPOINT_STRIDE;
	let cursor = (_b = index.checkpoints[low]) !== null && _b !== void 0 ? _b : 0;
	while (cursor < offset && cursor < index.bytes.byteLength) {
		const lineBreakSize = isLineBreak(index.bytes, cursor);
		cursor += lineBreakSize || 1;
		if (lineBreakSize) lineIndex += 1;
	}
	return clamp(lineIndex, 0, index.lineCount - 1);
};
var decodeLargeTextSegment = (index, line, segmentIndex, segmentBytes) => {
	const segmentCount = Math.max(1, Math.ceil((line.end - line.start) / segmentBytes));
	const normalizedSegment = clamp(Math.trunc(segmentIndex), 0, segmentCount - 1);
	const rawStart = line.start + normalizedSegment * segmentBytes;
	const rawEnd = Math.min(line.end, rawStart + segmentBytes);
	const start = index.encoding === "gb18030" ? alignTextBoundary(index, line.start, rawStart, line.end) : alignUtf8Start(index.bytes, rawStart, line.end);
	const end = alignTextBoundary(index, start, rawEnd, line.end);
	return {
		text: createFileViewerTextDecoder(index.encoding).decode(index.bytes.subarray(start, end)),
		segmentCount,
		segmentIndex: normalizedSegment
	};
};
var formatLargeNumber = (value) => {
	try {
		return new Intl.NumberFormat().format(value);
	} catch {
		return String(value);
	}
};
var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var createLargeTextSearchRegExp = (query, options) => {
	const escaped = escapeRegExp(query);
	return new RegExp(options.wholeWord ? `\\b${escaped}\\b` : escaped, options.caseSensitive ? "g" : "gi");
};
var cloneLargeTextSearchState = (state) => ({
	...state,
	current: state.current ? { ...state.current } : null,
	matches: state.matches.map((match) => ({ ...match }))
});
var shouldVirtualizeTextBuffer = (buffer, context) => {
	var _a, _b, _c, _d;
	const configured = (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.virtualizeAboveBytes;
	const threshold = Number.isFinite(configured) ? Math.max(0, Number(configured)) : DEFAULT_LARGE_TEXT_THRESHOLD_BYTES;
	if (buffer.byteLength <= threshold) return false;
	const bytes = new Uint8Array(buffer);
	const { encoding } = resolveFileViewerTextEncoding(bytes, (_d = (_c = context === null || context === void 0 ? void 0 : context.options) === null || _c === void 0 ? void 0 : _c.text) === null || _d === void 0 ? void 0 : _d.encoding);
	return encoding !== "utf-16le" && encoding !== "utf-16be";
};
var shouldVirtualizeMarkdownBuffer = (buffer, context) => {
	var _a, _b, _c, _d;
	const configured = (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.markdownVirtualizeAboveBytes;
	if (!Number.isFinite(configured)) return false;
	if (buffer.byteLength <= Math.max(0, Number(configured))) return false;
	const bytes = new Uint8Array(buffer);
	const { encoding } = resolveFileViewerTextEncoding(bytes, (_d = (_c = context === null || context === void 0 ? void 0 : context.options) === null || _c === void 0 ? void 0 : _c.text) === null || _d === void 0 ? void 0 : _d.encoding);
	return encoding !== "utf-16le" && encoding !== "utf-16be";
};
var largeTextStyle = `
.code-viewer--virtual{height:100%;min-height:240px;display:flex;flex-direction:column;overflow:hidden}
.code-viewer--virtual .code-toolbar{flex:0 0 42px}
.code-virtual-scroll{position:relative;flex:1 1 auto;min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;contain:strict;background:var(--code-bg)}
.code-virtual-spacer{position:relative;min-width:100%}
.code-virtual-window{position:absolute;top:0;left:0;min-width:100%;will-change:transform}
.code-virtual-line{display:flex;height:var(--code-line-height,22.1px);min-width:max-content;align-items:stretch;color:var(--code-text);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:var(--code-font-size,13px);line-height:var(--code-line-height,22.1px);white-space:pre;contain:layout paint style}
.code-virtual-line--match{background:rgba(255,215,0,.18)}
.code-virtual-number{position:sticky;left:0;z-index:1;display:inline-block;width:var(--code-line-number-width,7ch);flex:0 0 var(--code-line-number-width,7ch);padding:0 1.25ch 0 .75ch;border-right:1px solid var(--code-border);background:var(--code-bg);color:var(--code-muted);text-align:right;user-select:none;box-sizing:border-box}
.code-virtual-content{display:inline-block;padding:0 18px;white-space:pre}
.code-virtual-content mark{border-radius:2px;background:#ffd54f;color:#1f2328}
.code-line-segments{position:sticky;left:var(--code-line-number-offset,var(--code-line-number-width,7ch));z-index:1;display:inline-flex;height:100%;align-items:center;gap:2px;padding:0 4px;border-right:1px solid var(--code-border);background:var(--code-toolbar-bg)}
.code-line-segments button{width:22px;height:18px;padding:0;border:1px solid var(--code-border);border-radius:4px;background:var(--code-bg);color:var(--code-muted);font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}
.code-line-segments button:disabled{cursor:not-allowed;opacity:.4}
.code-line-segments span{min-width:64px;color:var(--code-muted);font-size:11px;line-height:1;text-align:center}
.code-viewer--virtual.code-viewer--wrap-lines .code-virtual-scroll{overflow-x:hidden}
.code-viewer--virtual.code-viewer--wrap-lines .code-virtual-spacer,.code-viewer--virtual.code-viewer--wrap-lines .code-virtual-window{width:100%;min-width:0}
.code-viewer--virtual.code-viewer--wrap-lines .code-virtual-line{width:100%;height:auto;min-height:var(--code-line-height,22.1px);min-width:0;align-items:flex-start;white-space:normal;contain:layout paint style}
.code-viewer--virtual.code-viewer--wrap-lines .code-virtual-number{align-self:stretch}
.code-viewer--virtual.code-viewer--wrap-lines .code-line-segments{flex:0 0 auto;align-self:stretch;height:auto}
.code-viewer--virtual.code-viewer--wrap-lines .code-virtual-content{display:block;min-width:0;flex:1 1 auto;padding:0 18px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
`;
async function renderLargeText(buffer, target, type = "txt", context) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const documentRef = target.ownerDocument;
	const sourceBytes = new Uint8Array(buffer);
	const source = resolveFileViewerTextEncoding(sourceBytes, (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.encoding);
	const bytes = sourceBytes.subarray(source.bomLength);
	const configuredSegmentBytes = (_d = (_c = context === null || context === void 0 ? void 0 : context.options) === null || _c === void 0 ? void 0 : _c.text) === null || _d === void 0 ? void 0 : _d.maxRenderedLineBytes;
	const segmentBytes = Number.isFinite(configuredSegmentBytes) ? clamp(Math.trunc(Number(configuredSegmentBytes)), 1024, 262144) : DEFAULT_LARGE_TEXT_LINE_SEGMENT_BYTES;
	const configuredOverscan = (_f = (_e = context === null || context === void 0 ? void 0 : context.options) === null || _e === void 0 ? void 0 : _e.text) === null || _f === void 0 ? void 0 : _f.virtualOverscanLines;
	const overscan = Number.isFinite(configuredOverscan) ? clamp(Math.trunc(Number(configuredOverscan)), 2, 100) : 12;
	const showToolbar = ((_h = (_g = context === null || context === void 0 ? void 0 : context.options) === null || _g === void 0 ? void 0 : _g.text) === null || _h === void 0 ? void 0 : _h.toolbar) !== false;
	const showLineNumbers = ((_k = (_j = context === null || context === void 0 ? void 0 : context.options) === null || _j === void 0 ? void 0 : _j.text) === null || _k === void 0 ? void 0 : _k.lineNumbers) !== false;
	const wrapLongLines = ((_m = (_l = context === null || context === void 0 ? void 0 : context.options) === null || _l === void 0 ? void 0 : _l.text) === null || _m === void 0 ? void 0 : _m.wrapLongLines) === true;
	let disposed = false;
	let zoom = 1;
	let scheduledFrame = 0;
	let measurementFrame = 0;
	let lastWindowStart = -1;
	let activeLine = -1;
	let searchGeneration = 0;
	const lineSegments = /* @__PURE__ */ new Map();
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const style = documentRef.createElement("style");
	style.textContent = `${codeStyle}\n${largeTextStyle}`;
	const root = documentRef.createElement("div");
	root.className = [
		"code-viewer",
		"code-viewer--virtual",
		showLineNumbers ? "code-viewer--line-numbers" : "",
		wrapLongLines ? "code-viewer--wrap-lines" : ""
	].filter(Boolean).join(" ");
	root.dataset.viewerZoomProvider = "code";
	root.dataset.viewerSearchProvider = "code-virtual";
	root.dataset.textToolbar = String(showToolbar);
	root.dataset.lineNumbers = String(showLineNumbers);
	root.dataset.wrapLongLines = String(wrapLongLines);
	root.dataset.textEncoding = source.encoding;
	const toolbar = documentRef.createElement("div");
	toolbar.className = "code-toolbar";
	const extensionLabel = documentRef.createElement("span");
	extensionLabel.textContent = type.toUpperCase();
	const toolbarMeta = documentRef.createElement("div");
	toolbarMeta.className = "code-toolbar-meta";
	const status = documentRef.createElement("span");
	const lineSummary = documentRef.createElement("strong");
	status.textContent = t("text.code.indexingLargeFile", { progress: 0 });
	toolbarMeta.append(status, lineSummary);
	toolbar.append(extensionLabel, toolbarMeta);
	if (showToolbar) root.append(toolbar);
	target.replaceChildren(style, root);
	(_o = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _o === void 0 || _o.call(context);
	const index = await buildLargeTextIndex(bytes, source.encoding, target, (progress) => {
		if (!disposed) status.textContent = t("text.code.indexingLargeFile", { progress });
	});
	if (disposed) return {
		$el: target,
		unmount() {}
	};
	status.textContent = t("text.code.virtualized");
	root.dataset.totalLines = String(index.lineCount);
	lineSummary.textContent = `${formatLargeNumber(index.lineCount)} lines`;
	root.style.setProperty("--code-line-number-width", `${Math.max(6, String(index.lineCount).length + 2)}ch`);
	root.style.setProperty("--code-line-number-offset", showLineNumbers ? "var(--code-line-number-width)" : "0px");
	const viewport = documentRef.createElement("div");
	viewport.className = "code-virtual-scroll";
	viewport.dataset.viewerScrollContainer = "true";
	viewport.tabIndex = 0;
	const spacer = documentRef.createElement("div");
	spacer.className = "code-virtual-spacer";
	const windowElement = documentRef.createElement("div");
	windowElement.className = "code-virtual-window";
	spacer.append(windowElement);
	viewport.append(spacer);
	root.append(viewport);
	const getLineHeight = () => LARGE_TEXT_BASE_LINE_HEIGHT * zoom;
	const getViewportHeight = () => Math.max(240, viewport.clientHeight || 600);
	const measuredLineHeights = /* @__PURE__ */ new Map();
	const measuredLineHeightsByBlock = /* @__PURE__ */ new Map();
	const heightCorrectionTree = new Float64Array(Math.ceil(index.lineCount / LARGE_TEXT_MEASUREMENT_BLOCK_LINES) + 1);
	const updateHeightCorrection = (blockIndex, delta) => {
		for (let treeIndex = blockIndex + 1; treeIndex < heightCorrectionTree.length; treeIndex += treeIndex & -treeIndex) heightCorrectionTree[treeIndex] += delta;
	};
	const getHeightCorrectionBeforeBlock = (blockIndex) => {
		let correction = 0;
		for (let treeIndex = blockIndex; treeIndex > 0; treeIndex -= treeIndex & -treeIndex) correction += heightCorrectionTree[treeIndex];
		return correction;
	};
	const getOffsetForLine = (requestedLine) => {
		const lineIndex = clamp(Math.trunc(requestedLine), 0, index.lineCount);
		if (!wrapLongLines || lineIndex === 0) return lineIndex * getLineHeight();
		const blockIndex = Math.floor(lineIndex / LARGE_TEXT_MEASUREMENT_BLOCK_LINES);
		let correction = getHeightCorrectionBeforeBlock(blockIndex);
		const blockMeasurements = measuredLineHeightsByBlock.get(blockIndex);
		if (blockMeasurements) for (const [measuredLine, height] of blockMeasurements) {
			if (measuredLine >= lineIndex) continue;
			correction += height - getLineHeight();
		}
		return lineIndex * getLineHeight() + correction;
	};
	const getTotalContentHeight = () => getOffsetForLine(index.lineCount);
	const getWindowLineCount = () => Math.min(index.lineCount, Math.ceil(getViewportHeight() / getLineHeight()) + overscan * 2 + 2);
	const getSpacerHeight = () => Math.min(LARGE_TEXT_MAX_SCROLL_HEIGHT, Math.max(getViewportHeight(), getTotalContentHeight()));
	const usesCappedScrollHeight = () => getTotalContentHeight() > LARGE_TEXT_MAX_SCROLL_HEIGHT;
	const updateSpacerHeight = () => {
		root.style.setProperty("--code-font-size", `${13 * zoom}px`);
		root.style.setProperty("--code-line-height", `${getLineHeight()}px`);
		spacer.style.height = `${getSpacerHeight()}px`;
	};
	const getLineAtOffset = (requestedOffset) => {
		const offset = clamp(requestedOffset, 0, Math.max(0, getTotalContentHeight() - 1));
		let low = 0;
		let high = Math.max(0, index.lineCount - 1);
		while (low < high) {
			const middle = Math.ceil((low + high) / 2);
			if (getOffsetForLine(middle) <= offset) low = middle;
			else high = middle - 1;
		}
		return low;
	};
	const getFirstVisibleLine = () => {
		if (!usesCappedScrollHeight()) return wrapLongLines ? getLineAtOffset(viewport.scrollTop) : clamp(Math.floor(viewport.scrollTop / getLineHeight()), 0, index.lineCount - 1);
		const maxScrollTop = Math.max(1, getSpacerHeight() - getViewportHeight());
		return clamp(Math.round(viewport.scrollTop / maxScrollTop * (index.lineCount - 1)), 0, index.lineCount - 1);
	};
	const getWindowOffset = (startLine, renderedLineCount) => {
		if (!usesCappedScrollHeight()) return getOffsetForLine(startLine);
		const maxStart = Math.max(1, index.lineCount - renderedLineCount);
		const maxOffset = Math.max(0, getSpacerHeight() - renderedLineCount * getLineHeight());
		return startLine / maxStart * maxOffset;
	};
	const setMeasuredLineHeight = (lineIndex, measuredHeight) => {
		var _a;
		const nextHeight = Math.max(getLineHeight(), measuredHeight);
		const previousHeight = (_a = measuredLineHeights.get(lineIndex)) !== null && _a !== void 0 ? _a : getLineHeight();
		if (Math.abs(nextHeight - previousHeight) < .5) return false;
		const blockIndex = Math.floor(lineIndex / LARGE_TEXT_MEASUREMENT_BLOCK_LINES);
		measuredLineHeights.set(lineIndex, nextHeight);
		let blockMeasurements = measuredLineHeightsByBlock.get(blockIndex);
		if (!blockMeasurements) {
			blockMeasurements = /* @__PURE__ */ new Map();
			measuredLineHeightsByBlock.set(blockIndex, blockMeasurements);
		}
		blockMeasurements.set(lineIndex, nextHeight);
		updateHeightCorrection(blockIndex, nextHeight - previousHeight);
		return true;
	};
	const clearMeasuredLineHeights = () => {
		measuredLineHeights.clear();
		measuredLineHeightsByBlock.clear();
		heightCorrectionTree.fill(0);
	};
	const scheduleWrappedMeasurement = (startLine, renderedLineCount) => {
		var _a, _b, _c;
		if (!wrapLongLines || disposed || renderedLineCount === 0) return;
		const view = getWindow(target);
		if (measurementFrame && (view === null || view === void 0 ? void 0 : view.cancelAnimationFrame)) view.cancelAnimationFrame(measurementFrame);
		else if (measurementFrame) (_a = view === null || view === void 0 ? void 0 : view.clearTimeout) === null || _a === void 0 || _a.call(view, measurementFrame);
		const measure = () => {
			measurementFrame = 0;
			if (disposed) return;
			const anchorLine = getFirstVisibleLine();
			const anchorOffset = usesCappedScrollHeight() ? 0 : viewport.scrollTop - getOffsetForLine(anchorLine);
			let changed = false;
			const rows = Array.from(windowElement.querySelectorAll(".code-virtual-line"));
			for (const row of rows) {
				const lineIndex = Number(row.dataset.line) - 1;
				if (!Number.isInteger(lineIndex) || lineIndex < 0) continue;
				const measuredHeight = row.getBoundingClientRect().height || row.offsetHeight || 0;
				if (measuredHeight) changed = setMeasuredLineHeight(lineIndex, measuredHeight) || changed;
			}
			if (!changed) return;
			updateSpacerHeight();
			if (!usesCappedScrollHeight()) viewport.scrollTop = getOffsetForLine(anchorLine) + anchorOffset;
			windowElement.style.transform = `translateY(${getWindowOffset(startLine, renderedLineCount)}px)`;
			lastWindowStart = -1;
			scheduleRender();
		};
		if (view === null || view === void 0 ? void 0 : view.requestAnimationFrame) measurementFrame = view.requestAnimationFrame(measure);
		else measurementFrame = Number((_c = (_b = view === null || view === void 0 ? void 0 : view.setTimeout) === null || _b === void 0 ? void 0 : _b.call(view, measure, 0)) !== null && _c !== void 0 ? _c : setTimeout(measure, 0));
	};
	const appendHighlightedContent = (content, text, query) => {
		if (!query) {
			content.textContent = text || " ";
			return;
		}
		const position = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
		if (position < 0) {
			content.textContent = text || " ";
			return;
		}
		content.append(documentRef.createTextNode(text.slice(0, position)), Object.assign(documentRef.createElement("mark"), { textContent: text.slice(position, position + query.length) }), documentRef.createTextNode(text.slice(position + query.length)));
	};
	let searchState = createEmptyFileViewerSearchState();
	const renderWindow = (force = false) => {
		var _a;
		if (disposed) return;
		const firstVisibleLine = getFirstVisibleLine();
		const visibleCount = getWindowLineCount();
		const startLine = clamp(firstVisibleLine - overscan, 0, Math.max(0, index.lineCount - visibleCount));
		if (!force && startLine === lastWindowStart) return;
		lastWindowStart = startLine;
		const lines = readLargeTextLineBounds(index, startLine, visibleCount);
		const fragment = documentRef.createDocumentFragment();
		for (const line of lines) {
			const row = documentRef.createElement("div");
			row.className = "code-virtual-line";
			row.dataset.line = String(line.lineIndex + 1);
			row.dataset.logicalLine = String(line.lineIndex + 1);
			if (line.lineIndex === activeLine) row.classList.add("code-virtual-line--match");
			if (showLineNumbers) {
				const number = documentRef.createElement("span");
				number.className = "code-virtual-number";
				number.setAttribute("aria-hidden", "true");
				number.textContent = String(line.lineIndex + 1);
				row.append(number);
			}
			const currentSegment = (_a = lineSegments.get(line.lineIndex)) !== null && _a !== void 0 ? _a : 0;
			const decoded = decodeLargeTextSegment(index, line, currentSegment, segmentBytes);
			if (decoded.segmentCount > 1) {
				const segments = documentRef.createElement("span");
				segments.className = "code-line-segments";
				const actions = [
					[
						"first",
						"⇤",
						t("text.code.firstSegment")
					],
					[
						"previous",
						"‹",
						t("text.code.previousSegment")
					],
					[
						"next",
						"›",
						t("text.code.nextSegment")
					],
					[
						"last",
						"⇥",
						t("text.code.lastSegment")
					]
				];
				for (const [action, label, title] of actions.slice(0, 2)) {
					const button = documentRef.createElement("button");
					button.type = "button";
					button.dataset.segmentAction = action;
					button.dataset.lineIndex = String(line.lineIndex);
					button.title = title;
					button.setAttribute("aria-label", title);
					button.textContent = label;
					button.disabled = decoded.segmentIndex === 0;
					segments.append(button);
				}
				const segmentLabel = documentRef.createElement("span");
				segmentLabel.textContent = `${decoded.segmentIndex + 1}/${decoded.segmentCount}`;
				segments.append(segmentLabel);
				for (const [action, label, title] of actions.slice(2)) {
					const button = documentRef.createElement("button");
					button.type = "button";
					button.dataset.segmentAction = action;
					button.dataset.lineIndex = String(line.lineIndex);
					button.title = title;
					button.setAttribute("aria-label", title);
					button.textContent = label;
					button.disabled = decoded.segmentIndex === decoded.segmentCount - 1;
					segments.append(button);
				}
				row.append(segments);
			}
			const content = documentRef.createElement("span");
			content.className = "code-virtual-content";
			appendHighlightedContent(content, decoded.text, line.lineIndex === activeLine ? searchState.query : "");
			row.append(content);
			fragment.append(row);
		}
		windowElement.replaceChildren(fragment);
		windowElement.style.transform = `translateY(${getWindowOffset(startLine, lines.length)}px)`;
		scheduleWrappedMeasurement(startLine, lines.length);
	};
	const scheduleRender = () => {
		var _a, _b;
		if (scheduledFrame || disposed) return;
		const view = getWindow(target);
		if (view === null || view === void 0 ? void 0 : view.requestAnimationFrame) {
			scheduledFrame = view.requestAnimationFrame(() => {
				scheduledFrame = 0;
				renderWindow();
			});
			return;
		}
		scheduledFrame = Number((_b = (_a = view === null || view === void 0 ? void 0 : view.setTimeout) === null || _a === void 0 ? void 0 : _a.call(view, () => {
			scheduledFrame = 0;
			renderWindow();
		}, 0)) !== null && _b !== void 0 ? _b : setTimeout(() => {
			scheduledFrame = 0;
			renderWindow();
		}, 0));
	};
	const scrollToLine = (requestedLine) => {
		const lineIndex = clamp(Math.trunc(requestedLine), 0, index.lineCount - 1);
		if (usesCappedScrollHeight()) {
			const maxScrollTop = Math.max(0, getSpacerHeight() - getViewportHeight());
			viewport.scrollTop = index.lineCount > 1 ? lineIndex / (index.lineCount - 1) * maxScrollTop : 0;
		} else viewport.scrollTop = getOffsetForLine(lineIndex);
		lastWindowStart = -1;
		renderWindow(true);
	};
	const setActiveSearchMatch = (requestedIndex) => {
		const matches = searchState.matches;
		if (!matches.length) {
			activeLine = -1;
			searchState.currentIndex = -1;
			searchState.current = null;
			renderWindow(true);
			return cloneLargeTextSearchState(searchState);
		}
		const currentIndex = (requestedIndex % matches.length + matches.length) % matches.length;
		const match = matches[currentIndex];
		searchState.currentIndex = currentIndex;
		searchState.current = match;
		activeLine = match.lineIndex;
		const lineStart = locateLargeTextLineStart(index, match.lineIndex);
		lineSegments.set(match.lineIndex, Math.max(0, Math.floor((match.byteOffset - lineStart) / segmentBytes)));
		scrollToLine(match.lineIndex);
		return cloneLargeTextSearchState(searchState);
	};
	const clearSearch = () => {
		searchGeneration += 1;
		searchState = createEmptyFileViewerSearchState();
		activeLine = -1;
		renderWindow(true);
		return cloneLargeTextSearchState(searchState);
	};
	const searchLargeText = async (rawQuery, rawOptions) => {
		const query = rawQuery.replace(/\s+/g, " ").trim();
		const options = normalizeFileViewerSearchOptions(rawOptions);
		if (!query || options.enabled === false) return clearSearch();
		const generation = searchGeneration + 1;
		searchGeneration = generation;
		const matches = [];
		const maxMatches = Math.max(1, options.maxMatches || 1e3);
		const expression = createLargeTextSearchRegExp(query, options);
		const encoder = new TextEncoder();
		const overlap = clamp((index.encoding === "gb18030" ? query.length * 4 : encoder.encode(query).byteLength) * 2, 256, 65536);
		const advanceBytesForCharacters = (start, end, characterCount) => {
			if (index.encoding !== "gb18030") {
				const decoded = createFileViewerTextDecoder(index.encoding).decode(index.bytes.subarray(start, end));
				return encoder.encode(decoded.slice(0, characterCount)).byteLength;
			}
			let cursor = start;
			let characters = 0;
			while (cursor < end && characters < characterCount) {
				const size = gb18030UnitLength(index.bytes, cursor, end);
				characters += size === 4 ? createFileViewerTextDecoder("gb18030").decode(index.bytes.subarray(cursor, cursor + size)).length : 1;
				cursor += size;
			}
			return cursor - start;
		};
		for (let primaryStart = 0; primaryStart < index.bytes.byteLength && matches.length < maxMatches;) {
			const primaryEnd = alignTextBoundary(index, primaryStart, Math.min(index.bytes.byteLength, primaryStart + LARGE_TEXT_SEARCH_CHUNK_BYTES), index.bytes.byteLength);
			const decodeStart = primaryStart;
			const decodeEnd = alignTextBoundary(index, primaryStart, Math.min(index.bytes.byteLength, primaryEnd + overlap), index.bytes.byteLength);
			const text = createFileViewerTextDecoder(index.encoding).decode(index.bytes.subarray(decodeStart, decodeEnd));
			let lastCharacterOffset = 0;
			let byteCursor = decodeStart;
			expression.lastIndex = 0;
			let match;
			while ((match = expression.exec(text)) && matches.length < maxMatches) {
				if (!match[0]) {
					expression.lastIndex += 1;
					continue;
				}
				byteCursor += advanceBytesForCharacters(byteCursor, decodeEnd, match.index - lastCharacterOffset);
				const matchByteOffset = byteCursor;
				byteCursor += advanceBytesForCharacters(byteCursor, decodeEnd, match[0].length);
				lastCharacterOffset = match.index + match[0].length;
				if (matchByteOffset < primaryStart || matchByteOffset >= primaryEnd) continue;
				const lineIndex = findLargeTextLineAtOffset(index, matchByteOffset);
				matches.push({
					id: `code-virtual-search-${matches.length + 1}`,
					index: matches.length,
					text: match[0],
					anchor: null,
					line: lineIndex + 1,
					byteOffset: matchByteOffset,
					lineIndex
				});
			}
			primaryStart = primaryEnd;
			await nextBrowserTurn(target);
			if (disposed || generation !== searchGeneration) return cloneLargeTextSearchState(searchState);
		}
		searchState = {
			query,
			total: matches.length,
			currentIndex: matches.length ? 0 : -1,
			current: matches[0] || null,
			matches
		};
		return matches.length ? setActiveSearchMatch(0) : cloneLargeTextSearchState(searchState);
	};
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 2.6,
		canZoomOut: zoom > .6,
		canReset: zoom !== 1,
		minScale: .6,
		maxScale: 2.6
	});
	const setZoom = (scale) => {
		const firstVisibleLine = getFirstVisibleLine();
		zoom = clampZoom$4(scale);
		if (wrapLongLines) clearMeasuredLineHeights();
		updateSpacerHeight();
		scrollToLine(firstVisibleLine);
		zoomEmitter.emit();
		return getZoomState();
	};
	registerFileViewerSearchProvider(root, {
		search: searchLargeText,
		next: () => setActiveSearchMatch(searchState.currentIndex + 1),
		previous: () => setActiveSearchMatch(searchState.currentIndex - 1),
		clear: clearSearch,
		getState: () => cloneLargeTextSearchState(searchState)
	});
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	(_p = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _p === void 0 || _p.call(context, {
		print: false,
		exportHtml: false
	});
	viewport.addEventListener("scroll", scheduleRender, { passive: true });
	viewport.addEventListener("click", (event) => {
		var _a, _b;
		const button = (_a = event.target) === null || _a === void 0 ? void 0 : _a.closest("button[data-segment-action]");
		if (!button) return;
		const lineIndex = Number(button.dataset.lineIndex);
		const line = readLargeTextLineBounds(index, lineIndex, 1)[0];
		if (!line) return;
		const segmentCount = Math.max(1, Math.ceil((line.end - line.start) / segmentBytes));
		const current = (_b = lineSegments.get(lineIndex)) !== null && _b !== void 0 ? _b : 0;
		const action = button.dataset.segmentAction;
		const next = action === "first" ? 0 : action === "last" ? segmentCount - 1 : action === "previous" ? current - 1 : current + 1;
		lineSegments.set(lineIndex, clamp(next, 0, segmentCount - 1));
		renderWindow(true);
	});
	const ResizeObserverCtor = (_q = getWindow(target)) === null || _q === void 0 ? void 0 : _q.ResizeObserver;
	const resizeObserver = ResizeObserverCtor ? new ResizeObserverCtor(() => {
		if (wrapLongLines) {
			const firstVisibleLine = getFirstVisibleLine();
			clearMeasuredLineHeights();
			updateSpacerHeight();
			scrollToLine(firstVisibleLine);
			return;
		}
		updateSpacerHeight();
		renderWindow(true);
	}) : null;
	resizeObserver === null || resizeObserver === void 0 || resizeObserver.observe(viewport);
	updateSpacerHeight();
	renderWindow(true);
	return {
		$el: target,
		unmount() {
			var _a, _b, _c;
			disposed = true;
			searchGeneration += 1;
			const view = getWindow(target);
			if (scheduledFrame && (view === null || view === void 0 ? void 0 : view.cancelAnimationFrame)) view.cancelAnimationFrame(scheduledFrame);
			else if (scheduledFrame) (_a = view === null || view === void 0 ? void 0 : view.clearTimeout) === null || _a === void 0 || _a.call(view, scheduledFrame);
			if (measurementFrame && (view === null || view === void 0 ? void 0 : view.cancelAnimationFrame)) view.cancelAnimationFrame(measurementFrame);
			else if (measurementFrame) (_b = view === null || view === void 0 ? void 0 : view.clearTimeout) === null || _b === void 0 || _b.call(view, measurementFrame);
			resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
			viewport.removeEventListener("scroll", scheduleRender);
			unregisterFileViewerSearchProvider(root);
			unregisterFileViewerZoomProvider(root);
			(_c = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _c === void 0 || _c.call(context, null);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/prettyPrint.js
var DEFAULT_PRETTY_PRINT_MAX_BYTES = 524288;
var htmlEmbeddedLanguagePattern = /<(?:script|style)(?:\s|>)/i;
var htmlScriptPattern = /<script(?:\s|>)/i;
var htmlStylePattern = /<style(?:\s|>)/i;
var withHtmlEmbeddedPlugins = (source) => {
	if (!htmlEmbeddedLanguagePattern.test(source)) return ["html"];
	const plugins = ["html"];
	if (htmlScriptPattern.test(source)) plugins.push("babel", "estree", "typescript");
	if (htmlStylePattern.test(source)) plugins.push("postcss");
	return plugins;
};
var prettierLanguages = {
	cjs: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	css: {
		parser: "css",
		plugins: ["postcss"]
	},
	graphql: {
		parser: "graphql",
		plugins: ["graphql"]
	},
	gql: {
		parser: "graphql",
		plugins: ["graphql"]
	},
	html: {
		parser: "html",
		plugins: ["html"],
		resolvePlugins: withHtmlEmbeddedPlugins
	},
	htm: {
		parser: "html",
		plugins: ["html"],
		resolvePlugins: withHtmlEmbeddedPlugins
	},
	ipynb: {
		parser: "json",
		plugins: ["babel", "estree"]
	},
	js: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	json: {
		parser: "json",
		plugins: ["babel", "estree"]
	},
	json5: {
		parser: "json5",
		plugins: ["babel", "estree"]
	},
	jsonc: {
		parser: "jsonc",
		plugins: ["babel", "estree"]
	},
	jsx: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	markdown: {
		parser: "markdown",
		plugins: ["markdown"]
	},
	md: {
		parser: "markdown",
		plugins: ["markdown"]
	},
	mjs: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	react: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	ts: {
		parser: "typescript",
		plugins: ["typescript", "estree"]
	},
	tsx: {
		parser: "typescript",
		plugins: ["typescript", "estree"]
	},
	vue: {
		parser: "vue",
		plugins: [
			"html",
			"babel",
			"estree",
			"typescript",
			"postcss"
		]
	},
	xml: {
		parser: "xml",
		plugins: ["xml"],
		options: {
			xmlWhitespaceSensitivity: "preserve",
			xmlQuoteAttributes: "preserve",
			xmlSortAttributesByKey: false
		}
	},
	yaml: {
		parser: "yaml",
		plugins: ["yaml"]
	},
	yml: {
		parser: "yaml",
		plugins: ["yaml"]
	}
};
var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
var hasWhitespaceSensitiveXml = (source) => {
	if (/\bxml:space\s*=\s*(["'])preserve\1/i.test(source)) return true;
	const Parser = globalThis.DOMParser;
	if (typeof Parser !== "function") return true;
	try {
		const documentRef = new Parser().parseFromString(source, "application/xml");
		if (documentRef.querySelector("parsererror")) return false;
		const containsMixedContent = (element) => {
			var _a, _b, _c;
			if (((_a = element.getAttributeNS(XML_NAMESPACE, "space")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "preserve" || ((_b = element.getAttribute("xml:space")) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "preserve") return true;
			let hasElementChild = false;
			let hasDirectText = false;
			for (const child of Array.from(element.childNodes)) if (child.nodeType === 1) {
				hasElementChild = true;
				if (containsMixedContent(child)) return true;
			} else if ((child.nodeType === 3 || child.nodeType === 4) && ((_c = child.textContent) === null || _c === void 0 ? void 0 : _c.trim())) hasDirectText = true;
			return hasElementChild && hasDirectText;
		};
		return documentRef.documentElement ? containsMixedContent(documentRef.documentElement) : false;
	} catch {
		return false;
	}
};
var pluginLoaders = {
	babel: () => __vitePreload(() => import("./babel-7m1OmRSH.js").then((module) => module.default), []),
	estree: () => __vitePreload(() => import("./estree-DdNuV8TI.js").then((module) => module.default), []),
	typescript: () => __vitePreload(() => import("./typescript-CMe8J1yj.js").then((module) => module.default), []),
	postcss: () => __vitePreload(() => import("./postcss-B5dDJOz2.js").then((module) => module.default), []),
	html: () => __vitePreload(() => import("./html-NMawjeQ6.js").then((module) => module.default), []),
	markdown: () => __vitePreload(() => import("./markdown-DW6n_dx4.js").then((module) => module.default), []),
	yaml: () => __vitePreload(() => import("./yaml-BEEMG2dX.js").then((module) => module.default), []),
	graphql: () => __vitePreload(() => import("./graphql-BSwq3BVU.js").then((module) => module.default), []),
	xml: () => __vitePreload(() => import("./plugin-DgCPbLgw.js").then((module) => module.default), __vite__mapDeps([0,1]))
};
var loadPrettierRuntime = async (definition, source) => {
	var _a, _b;
	const prettierPromise = __vitePreload(() => import("./standalone-DQnok__B.js"), []);
	const pluginNames = (_b = (_a = definition.resolvePlugins) === null || _a === void 0 ? void 0 : _a.call(definition, source)) !== null && _b !== void 0 ? _b : definition.plugins;
	const [prettier, ...plugins] = await Promise.all([prettierPromise, ...pluginNames.map((pluginName) => pluginLoaders[pluginName]())]);
	return {
		format: prettier.format,
		plugins
	};
};
var utf8ByteLength = (source) => new TextEncoder().encode(source).byteLength;
var resolveFileViewerPrettyPrintMaxBytes = (options) => {
	var _a;
	const configured = (_a = options === null || options === void 0 ? void 0 : options.prettyPrintMaxBytes) !== null && _a !== void 0 ? _a : options === null || options === void 0 ? void 0 : options.virtualizeAboveBytes;
	if (!Number.isFinite(configured)) return DEFAULT_PRETTY_PRINT_MAX_BYTES;
	return Math.max(0, Math.trunc(Number(configured)));
};
var supportsFileViewerPrettyPrint = (extension) => {
	return Boolean(prettierLanguages[extension.trim().toLowerCase()]);
};
/**
* Formats a decoded display representation without mutating the source buffer.
*
* Parser support and byte limits are resolved before the Prettier runtime or
* any parser plugin is imported. Failures intentionally return the original
* source so malformed or unsupported uploads remain previewable.
*/
var formatFileViewerTextForDisplay = async (source, extension, options, signal, runtimeLoader = loadPrettierRuntime) => {
	const maxBytes = resolveFileViewerPrettyPrintMaxBytes(options);
	const sourceByteLength = utf8ByteLength(source);
	if ((options === null || options === void 0 ? void 0 : options.prettyPrint) !== true) return {
		text: source,
		formatted: false,
		reason: "disabled",
		sourceByteLength,
		maxBytes
	};
	const definition = prettierLanguages[extension.trim().toLowerCase()];
	if (!definition) return {
		text: source,
		formatted: false,
		reason: "unsupported",
		sourceByteLength,
		maxBytes
	};
	if (sourceByteLength > maxBytes) return {
		text: source,
		formatted: false,
		reason: "too-large",
		parser: definition.parser,
		sourceByteLength,
		maxBytes
	};
	if (signal === null || signal === void 0 ? void 0 : signal.aborted) return {
		text: source,
		formatted: false,
		reason: "aborted",
		parser: definition.parser,
		sourceByteLength,
		maxBytes
	};
	if (definition.parser === "xml" && hasWhitespaceSensitiveXml(source)) return {
		text: source,
		formatted: false,
		reason: "whitespace-sensitive",
		parser: definition.parser,
		sourceByteLength,
		maxBytes
	};
	try {
		const runtime = await runtimeLoader(definition, source);
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return {
			text: source,
			formatted: false,
			reason: "aborted",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
		const formatted = await runtime.format(source, {
			parser: definition.parser,
			plugins: runtime.plugins,
			tabWidth: 2,
			useTabs: false,
			printWidth: 80,
			endOfLine: "lf",
			...definition.options
		});
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return {
			text: source,
			formatted: false,
			reason: "aborted",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
		return {
			text: formatted.replace(/\n$/, ""),
			formatted: true,
			reason: "formatted",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
	} catch {
		return {
			text: source,
			formatted: false,
			reason: "failed",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/code.js
var languageMap = {
	bash: "bash",
	c: "cpp",
	cc: "cpp",
	cjs: "javascript",
	cpp: "cpp",
	cs: "csharp",
	css: "css",
	diff: "diff",
	patch: "diff",
	bundle: "plaintext",
	bdl: "plaintext",
	gv: "plaintext",
	go: "go",
	graphql: "graphql",
	gql: "graphql",
	h: "cpp",
	hcl: "plaintext",
	hpp: "cpp",
	html: "xml",
	htm: "xml",
	http: "http",
	ini: "ini",
	ipynb: "json",
	java: "java",
	js: "javascript",
	json: "json",
	json5: "json",
	jsonc: "json",
	jsx: "javascript",
	kt: "kotlin",
	log: "plaintext",
	md: "markdown",
	markdown: "markdown",
	mjs: "javascript",
	php: "php",
	proto: "protobuf",
	py: "python",
	rb: "ruby",
	react: "javascript",
	rs: "rust",
	sh: "bash",
	sql: "sql",
	swift: "swift",
	tex: "latex",
	toml: "ini",
	ts: "typescript",
	tsx: "typescript",
	txt: "plaintext",
	vue: "xml",
	xml: "xml",
	yaml: "yaml",
	yml: "yaml"
};
var languageLoaders = {
	bash: () => __vitePreload(() => import("./bash-ek8NzA6o.js"), []),
	cpp: () => __vitePreload(() => import("./cpp-C0Fm168c.js"), []),
	csharp: () => __vitePreload(() => import("./csharp-Dh6NE0fJ.js"), []),
	css: () => __vitePreload(() => import("./css-6G0gJfYH.js"), []),
	diff: () => __vitePreload(() => import("./diff-B_FOk4aO.js"), []),
	go: () => __vitePreload(() => import("./go-5ZsQbGwN.js"), []),
	graphql: () => __vitePreload(() => import("./graphql-BBQjT3lA.js"), []),
	http: () => __vitePreload(() => import("./http-DUajez4s.js"), []),
	ini: () => __vitePreload(() => import("./ini-CClNMtWg.js"), []),
	java: () => __vitePreload(() => import("./java-B5BN2Nlk.js"), []),
	javascript: () => __vitePreload(() => import("./javascript-C5bckpYW.js"), []),
	json: () => __vitePreload(() => import("./json-QkX-bpR1.js"), []),
	kotlin: () => __vitePreload(() => import("./kotlin-BALtdBHM.js"), []),
	latex: () => __vitePreload(() => import("./latex-DXGJOZGf.js"), []),
	markdown: () => __vitePreload(() => import("./markdown-DetLIoVv.js"), []),
	php: () => __vitePreload(() => import("./php-Bt_vzcTF.js"), []),
	protobuf: () => __vitePreload(() => import("./protobuf-BNsboRN8.js"), []),
	python: () => __vitePreload(() => import("./python-B8SaiB52.js"), []),
	ruby: () => __vitePreload(() => import("./ruby-BgW5vBSO.js"), []),
	rust: () => __vitePreload(() => import("./rust-2ksLdyQs.js"), []),
	sql: () => __vitePreload(() => import("./sql-BND2vroa.js"), []),
	swift: () => __vitePreload(() => import("./swift-B9Kr7a1U.js"), []),
	typescript: () => __vitePreload(() => import("./typescript-DJHzmdOV.js"), []),
	xml: () => __vitePreload(() => import("./xml-V0L-6TN8.js"), []),
	yaml: () => __vitePreload(() => import("./yaml-CR_QcmZG.js"), [])
};
var highlighterPromise = null;
var registeredLanguages = /* @__PURE__ */ new Set();
var createElement$2 = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var createStyle$3 = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = codeStyle;
	return style;
};
var resolveLanguage = (type) => {
	return languageMap[type.trim().toLowerCase()] || "plaintext";
};
var escapeHtml = (value) => {
	return value.replace(/[&<>"']/g, (char) => {
		return {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		}[char];
	});
};
var loadHighlighter = async () => {
	if (!highlighterPromise) highlighterPromise = __vitePreload(() => import("./core-Dk1zawR-.js").then((module) => module.default), __vite__mapDeps([2,1]));
	return highlighterPromise;
};
var registerLanguageOnce = async (hljs, name) => {
	if (registeredLanguages.has(name)) return true;
	const loader = languageLoaders[name];
	if (!loader) return false;
	const { default: language } = await loader();
	hljs.registerLanguage(name, language);
	registeredLanguages.add(name);
	return true;
};
var clampZoom$3 = (value) => {
	return Math.min(2.6, Math.max(.6, Number(value.toFixed(2))));
};
var lineCountOf = (value) => {
	return value.split(/\r\n|\r|\n/).length;
};
var createLineNumberText = (lineCount) => {
	return Array.from({ length: lineCount }, (_, index) => String(index + 1)).join("\n");
};
var createWrappedSourceLine = (documentRef, lineNumber) => {
	const row = createElement$2(documentRef, "span", "code-source-line");
	row.dataset.line = String(lineNumber);
	const number = createElement$2(documentRef, "span", "code-source-line-number", String(lineNumber));
	number.setAttribute("aria-hidden", "true");
	const content = createElement$2(documentRef, "span", "code-source-line-content");
	row.append(number, content);
	return {
		row,
		content
	};
};
/**
* Splits trusted highlight.js markup into logical source-line wrappers while
* recreating active token spans after every newline. This keeps multiline
* comments and strings highlighted without coupling visual wrapping to source
* line numbers.
*/
var mountWrappedHighlightedLines = (code, highlightedHtml, expectedLineCount) => {
	const documentRef = code.ownerDocument;
	const staging = createElement$2(documentRef, "span");
	staging.innerHTML = highlightedHtml;
	const lines = [createWrappedSourceLine(documentRef, 1)];
	let lineIndex = 0;
	const activeElements = [];
	let activeClones = [];
	const currentContent = () => lines[lineIndex].content;
	const currentParent = () => {
		var _a;
		return (_a = activeClones[activeClones.length - 1]) !== null && _a !== void 0 ? _a : currentContent();
	};
	const continueOnNextLine = () => {
		lineIndex += 1;
		lines.push(createWrappedSourceLine(documentRef, lineIndex + 1));
		let parent = currentContent();
		activeClones = activeElements.map((element) => {
			const clone = element.cloneNode(false);
			parent.append(clone);
			parent = clone;
			return clone;
		});
	};
	const visit = (node) => {
		var _a;
		if (node.nodeType === 3) {
			const parts = ((_a = node.textContent) !== null && _a !== void 0 ? _a : "").split(/\r\n|\r|\n/);
			parts.forEach((part, index) => {
				if (part) currentParent().append(documentRef.createTextNode(part));
				if (index < parts.length - 1) continueOnNextLine();
			});
			return;
		}
		if (node.nodeType !== 1) return;
		const element = node;
		const clone = element.cloneNode(false);
		currentParent().append(clone);
		activeElements.push(element);
		activeClones.push(clone);
		Array.from(element.childNodes).forEach(visit);
		activeElements.pop();
		activeClones.pop();
	};
	Array.from(staging.childNodes).forEach(visit);
	while (lines.length < expectedLineCount) lines.push(createWrappedSourceLine(documentRef, lines.length + 1));
	code.replaceChildren(...lines.map((line) => line.row));
};
var mountCodeMarkup = (pre, code, highlightedHtml, lineCount, showLineNumbers, wrapLongLines) => {
	code.replaceChildren();
	if (showLineNumbers && wrapLongLines) {
		pre.className = "code-area code-area--wrapped-line-numbers";
		pre.replaceChildren(code);
		mountWrappedHighlightedLines(code, highlightedHtml, lineCount);
		return;
	}
	pre.className = showLineNumbers ? "code-area code-area--line-numbers" : "code-area";
	if (showLineNumbers) {
		const gutter = createElement$2(pre.ownerDocument, "span", "code-line-numbers", createLineNumberText(lineCount));
		gutter.setAttribute("aria-hidden", "true");
		pre.replaceChildren(gutter, code);
	} else pre.replaceChildren(code);
	code.innerHTML = highlightedHtml;
};
var canPossiblyFitDecodedPrettyPrintLimit = (buffer, maxBytes) => {
	return buffer.byteLength <= maxBytes * 2 + 4;
};
/**
* Framework-neutral text/code renderer.
*
* highlight.js core, Prettier standalone, and parser definitions are loaded
* lazily by format. HTML and XML are always mounted as escaped source text and
* never executed as real DOM.
*/
async function renderText(buffer, target, type, context) {
	var _a, _b;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const extension = type || "txt";
	const normalizedExtension = extension.trim().toLowerCase();
	const textOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text;
	let sourceText;
	let prettyPrintResult;
	if ((textOptions === null || textOptions === void 0 ? void 0 : textOptions.prettyPrint) === true && supportsFileViewerPrettyPrint(normalizedExtension) && canPossiblyFitDecodedPrettyPrintLimit(buffer, resolveFileViewerPrettyPrintMaxBytes(textOptions))) {
		sourceText = decodeFileViewerTextBuffer(buffer, textOptions.encoding).text;
		prettyPrintResult = await formatFileViewerTextForDisplay(sourceText, normalizedExtension, textOptions, context === null || context === void 0 ? void 0 : context.signal);
	}
	if (!(prettyPrintResult === null || prettyPrintResult === void 0 ? void 0 : prettyPrintResult.formatted) && normalizedExtension !== "bundle" && normalizedExtension !== "bdl" && shouldVirtualizeTextBuffer(buffer, context)) return renderLargeText(buffer, target, extension, context);
	if (normalizedExtension === "patch") {
		const { default: renderPatch } = await __vitePreload(async () => {
			const { default: renderPatch } = await import("./patch--rfqMX61.js");
			return { default: renderPatch };
		}, []);
		return renderPatch(buffer, target, extension, context);
	}
	if (normalizedExtension === "bundle" || normalizedExtension === "bdl") {
		const { default: renderGitBundle } = await __vitePreload(async () => {
			const { default: renderGitBundle } = await import("./gitBundle-_Z4oA3YK.js");
			return { default: renderGitBundle };
		}, []);
		return renderGitBundle(buffer, target, extension, context);
	}
	const originalText = sourceText !== null && sourceText !== void 0 ? sourceText : decodeFileViewerTextBuffer(buffer, textOptions === null || textOptions === void 0 ? void 0 : textOptions.encoding).text;
	const formattedText = (prettyPrintResult === null || prettyPrintResult === void 0 ? void 0 : prettyPrintResult.formatted) ? prettyPrintResult.text : null;
	const language = resolveLanguage(extension);
	const showToolbar = (textOptions === null || textOptions === void 0 ? void 0 : textOptions.toolbar) !== false;
	const showLineNumbers = (textOptions === null || textOptions === void 0 ? void 0 : textOptions.lineNumbers) === true;
	const wrapLongLines = (textOptions === null || textOptions === void 0 ? void 0 : textOptions.wrapLongLines) === true;
	const documentRef = target.ownerDocument;
	let disposed = false;
	let zoom = 1;
	let showingFormatted = formattedText !== null;
	let renderGeneration = 0;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = createElement$2(documentRef, "div", wrapLongLines ? "code-viewer code-viewer--wrap-lines" : "code-viewer");
	root.dataset.viewerZoomProvider = "code";
	root.dataset.textToolbar = String(showToolbar);
	root.dataset.lineNumbers = String(showLineNumbers);
	root.dataset.wrapLongLines = String(wrapLongLines);
	root.dataset.prettyPrint = (_b = prettyPrintResult === null || prettyPrintResult === void 0 ? void 0 : prettyPrintResult.reason) !== null && _b !== void 0 ? _b : "disabled";
	const toolbar = createElement$2(documentRef, "div", "code-toolbar");
	const extensionLabel = createElement$2(documentRef, "span", "", extension.toUpperCase());
	const toolbarMeta = createElement$2(documentRef, "div", "code-toolbar-meta");
	const representationStatus = createElement$2(documentRef, "span", "code-format-status");
	const representationToggle = createElement$2(documentRef, "button", "code-format-toggle");
	representationToggle.type = "button";
	const lineSummary = createElement$2(documentRef, "strong");
	toolbarMeta.append(representationStatus, representationToggle, lineSummary);
	toolbar.append(extensionLabel, toolbarMeta);
	const pre = createElement$2(documentRef, "pre", "code-area");
	const code = createElement$2(documentRef, "code", `hljs language-${language}`);
	pre.append(code);
	if (showToolbar) root.append(toolbar);
	root.append(pre);
	root.style.setProperty("--code-font-size", `${13 * zoom}px`);
	target.replaceChildren(createStyle$3(documentRef), root);
	const currentText = () => showingFormatted && formattedText !== null ? formattedText : originalText;
	const syncRepresentationControls = (lineCount) => {
		const formatted = showingFormatted && formattedText !== null;
		root.dataset.textRepresentation = formatted ? "formatted" : "source";
		lineSummary.textContent = `${lineCount} lines`;
		representationStatus.hidden = !formatted;
		representationStatus.textContent = formatted ? t("text.code.formattedPreview") : "";
		representationToggle.hidden = formattedText === null;
		representationToggle.textContent = formatted ? t("text.code.showOriginal") : t("text.code.showFormatted");
		representationToggle.setAttribute("aria-pressed", String(formatted));
	};
	const renderCurrentRepresentation = async () => {
		const generation = renderGeneration + 1;
		renderGeneration = generation;
		const text = currentText();
		const lineCount = lineCountOf(text);
		syncRepresentationControls(lineCount);
		if (language === "plaintext") {
			mountCodeMarkup(pre, code, escapeHtml(text), lineCount, showLineNumbers, wrapLongLines);
			return;
		}
		code.textContent = t("text.code.loadingHighlight");
		try {
			const hljs = await loadHighlighter();
			const hasLanguage = await registerLanguageOnce(hljs, language);
			if (disposed || generation !== renderGeneration) return;
			const highlighted = hasLanguage ? hljs.highlight(text, {
				language,
				ignoreIllegals: true
			}).value : escapeHtml(text);
			mountCodeMarkup(pre, code, highlighted, lineCount, showLineNumbers, wrapLongLines);
		} catch {
			if (!disposed && generation === renderGeneration) mountCodeMarkup(pre, code, escapeHtml(text), lineCount, showLineNumbers, wrapLongLines);
		}
	};
	const toggleRepresentation = () => {
		if (formattedText === null) return;
		showingFormatted = !showingFormatted;
		renderCurrentRepresentation();
	};
	representationToggle.addEventListener("click", toggleRepresentation);
	await renderCurrentRepresentation();
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 2.6,
		canZoomOut: zoom > .6,
		canReset: zoom !== 1,
		minScale: .6,
		maxScale: 2.6
	});
	const setZoom = (scale) => {
		zoom = clampZoom$3(scale);
		root.style.setProperty("--code-font-size", `${13 * zoom}px`);
		zoomEmitter.emit();
		return getZoomState();
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	return {
		$el: target,
		unmount() {
			disposed = true;
			renderGeneration += 1;
			representationToggle.removeEventListener("click", toggleRepresentation);
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/gitBundle.js
var Inflate = null;
var textDecoder = new TextDecoder("utf-8");
var asciiDecoder = new TextDecoder("latin1");
var bundleStyle = `
.git-bundle-viewer{display:grid;height:100%;min-height:420px;grid-template-rows:auto minmax(0,1fr);--bundle-bg:#f6f8fa;--bundle-surface:#fff;--bundle-border:rgba(31,35,40,.12);--bundle-text:#24292f;--bundle-muted:#57606a;--bundle-accent:#0f766e;--bundle-code:#0d1117;--bundle-code-text:#e6edf3;--bundle-font-size:13px;background:var(--bundle-bg);color:var(--bundle-text);box-sizing:border-box}
.git-bundle-toolbar{position:sticky;top:0;z-index:2;display:flex;min-height:46px;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px;border-bottom:1px solid var(--bundle-border);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);box-sizing:border-box}
.git-bundle-toolbar span,.git-bundle-toolbar strong{color:var(--bundle-muted);font-size:12px;font-weight:800;letter-spacing:0}
.git-bundle-layout{display:grid;min-height:0;grid-template-columns:minmax(260px,340px) minmax(260px,360px) minmax(0,1fr);gap:12px;padding:12px;box-sizing:border-box}
.git-bundle-panel{min-height:0;overflow:auto;border:1px solid var(--bundle-border);border-radius:8px;background:var(--bundle-surface)}
.git-bundle-panel h3{position:sticky;top:0;z-index:1;margin:0;padding:11px 12px;border-bottom:1px solid var(--bundle-border);background:var(--bundle-surface);font-size:13px}
.git-bundle-list{margin:0;padding:8px;list-style:none}
.git-bundle-list button{display:block;width:100%;margin:0 0 6px;padding:9px 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--bundle-text);font:inherit;font-size:var(--bundle-font-size);text-align:left;cursor:pointer}
.git-bundle-list button:hover,.git-bundle-list button.active{border-color:rgba(15,118,110,.28);background:rgba(15,118,110,.08)}
.git-bundle-list small{display:block;margin-top:4px;color:var(--bundle-muted);font-size:.86em;line-height:1.35}
.git-bundle-meta{display:grid;gap:1px;background:var(--bundle-border)}
.git-bundle-meta div{padding:10px 12px;background:var(--bundle-surface)}
.git-bundle-meta span{display:block;color:var(--bundle-muted);font-size:11px;font-weight:800}
.git-bundle-meta strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.git-bundle-tree{padding:10px 12px;font-size:var(--bundle-font-size)}
.git-bundle-tree button{display:block;width:100%;padding:6px 8px;border:0;border-radius:6px;background:transparent;color:var(--bundle-text);font:inherit;text-align:left;cursor:pointer}
.git-bundle-tree button:hover,.git-bundle-tree button.active{background:rgba(15,118,110,.08);color:var(--bundle-accent)}
.git-bundle-file{display:grid;min-height:0;grid-template-rows:auto minmax(0,1fr)}
.git-bundle-file-header{padding:11px 12px;border-bottom:1px solid var(--bundle-border);font-size:12px;font-weight:800;color:var(--bundle-muted)}
.git-bundle-code{margin:0;overflow:auto;padding:16px 18px;background:var(--bundle-code);color:var(--bundle-code-text);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:var(--bundle-font-size);line-height:1.65;white-space:pre}
.git-bundle-notice{margin:8px;padding:10px 12px;border:1px solid rgba(245,158,11,.35);border-radius:8px;background:rgba(245,158,11,.12);color:#92400e;font-size:12px;line-height:1.55}
[data-viewer-theme='dark'] .git-bundle-viewer{--bundle-bg:#0d1117;--bundle-surface:#161b22;--bundle-border:rgba(139,148,158,.24);--bundle-text:#e6edf3;--bundle-muted:#8b949e;--bundle-code:#010409;--bundle-code-text:#e6edf3}
[data-viewer-theme='dark'] .git-bundle-toolbar{background:rgba(13,17,23,.92)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .git-bundle-viewer{--bundle-bg:#0d1117;--bundle-surface:#161b22;--bundle-border:rgba(139,148,158,.24);--bundle-text:#e6edf3;--bundle-muted:#8b949e;--bundle-code:#010409;--bundle-code-text:#e6edf3}[data-viewer-theme='system'] .git-bundle-toolbar{background:rgba(13,17,23,.92)}}
@media (max-width:980px){.git-bundle-layout{grid-template-columns:1fr}.git-bundle-panel{min-height:240px}}
`;
var createElement$1 = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var createStyle$2 = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = bundleStyle;
	return style;
};
var toHex = (bytes) => {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};
var readUInt32 = (bytes, offset) => {
	return (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
};
var concatBytes = (items) => {
	const total = items.reduce((sum, item) => sum + item.byteLength, 0);
	const merged = new Uint8Array(total);
	let offset = 0;
	for (const item of items) {
		merged.set(item, offset);
		offset += item.byteLength;
	}
	return merged;
};
var parseHeader = (bytes, t) => {
	const lines = [];
	let offset = 0;
	while (offset < bytes.length) {
		const next = bytes.indexOf(10, offset);
		if (next < 0) throw new Error("Git bundle header is incomplete.");
		const rawLine = bytes.subarray(offset, next);
		const line = asciiDecoder.decode(rawLine).replace(/\r$/, "");
		offset = next + 1;
		if (line === "") break;
		lines.push(line);
	}
	const signature = lines.shift() || "";
	if (!signature.startsWith("# v") || !signature.includes("git bundle")) throw new Error(t("gitBundle.error.invalid"));
	const capabilities = [];
	const refs = [];
	const prerequisites = [];
	let objectFormat = "sha1";
	for (const line of lines) {
		if (line.startsWith("@")) {
			capabilities.push(line.slice(1));
			const objectFormatMatch = line.match(/^@object-format=(sha1|sha256)$/);
			if (objectFormatMatch) objectFormat = objectFormatMatch[1];
			continue;
		}
		if (line.startsWith("-")) {
			const [oid = "", ...subject] = line.slice(1).split(/\s+/);
			prerequisites.push({
				oid,
				subject: subject.join(" ")
			});
			continue;
		}
		const [oid = "", ...name] = line.split(/\s+/);
		if (oid) refs.push({
			oid,
			name: name.join(" ") || oid
		});
	}
	return {
		signature,
		capabilities,
		refs,
		prerequisites,
		packOffset: offset,
		objectFormat
	};
};
var readPackObjectHeader = (bytes, start) => {
	let offset = start;
	let byte = bytes[offset++];
	const typeCode = byte >> 4 & 7;
	let size = byte & 15;
	let shift = 4;
	while (byte & 128) {
		byte = bytes[offset++];
		size |= (byte & 127) << shift;
		shift += 7;
	}
	return {
		typeCode,
		size,
		offset
	};
};
var readOfsDeltaBase = (bytes, start) => {
	let offset = start;
	let value = bytes[offset++] & 127;
	while (bytes[offset - 1] & 128) {
		value += 1;
		value = (value << 7) + (bytes[offset++] & 127);
	}
	return {
		value,
		offset
	};
};
var inflateObject = (bytes, start) => {
	if (!Inflate) throw new Error("Git bundle support is opt-in. Run `npx file-viewer-cli add text-tools --write`, then `npx file-viewer-cli install --yes`.");
	const inflator = new Inflate();
	let offset = start;
	while (!inflator.ended && offset < bytes.length) {
		inflator.push(bytes.subarray(offset, offset + 1), false);
		offset += 1;
		if (inflator.err) throw new Error(inflator.msg || "Git pack object inflate failed.");
	}
	if (!inflator.ended || !(inflator.result instanceof Uint8Array)) throw new Error("Git pack object is incomplete.");
	return {
		content: inflator.result,
		nextOffset: offset
	};
};
var kindName = (typeCode) => {
	if (typeCode === 1) return "commit";
	if (typeCode === 2) return "tree";
	if (typeCode === 3) return "blob";
	if (typeCode === 4) return "tag";
	if (typeCode === 6) return "ofs-delta";
	if (typeCode === 7) return "ref-delta";
	return "unknown";
};
var hashObjectId = async (format, kind, content) => {
	if (format === "unknown") return;
	const header = new TextEncoder().encode(`${kind} ${content.byteLength}\0`);
	const digest = await globalThis.crypto.subtle.digest(format === "sha256" ? "SHA-256" : "SHA-1", concatBytes([header, content]));
	return toHex(new Uint8Array(digest));
};
var readDeltaSize = (bytes, start) => {
	let offset = start;
	let size = 0;
	let shift = 0;
	let byte = 0;
	do {
		byte = bytes[offset++];
		size |= (byte & 127) << shift;
		shift += 7;
	} while (byte & 128);
	return {
		size,
		offset
	};
};
var applyPackDelta = (base, delta) => {
	const baseSize = readDeltaSize(delta, 0);
	const targetSize = readDeltaSize(delta, baseSize.offset);
	let offset = targetSize.offset;
	const chunks = [];
	if (baseSize.size !== base.byteLength) throw new Error("Git delta base size does not match the resolved object.");
	while (offset < delta.byteLength) {
		const opcode = delta[offset++];
		if (opcode & 128) {
			let copyOffset = 0;
			let copySize = 0;
			if (opcode & 1) copyOffset = delta[offset++];
			if (opcode & 2) copyOffset |= delta[offset++] << 8;
			if (opcode & 4) copyOffset |= delta[offset++] << 16;
			if (opcode & 8) copyOffset |= delta[offset++] << 24;
			if (opcode & 16) copySize = delta[offset++];
			if (opcode & 32) copySize |= delta[offset++] << 8;
			if (opcode & 64) copySize |= delta[offset++] << 16;
			if (copySize === 0) copySize = 65536;
			chunks.push(base.subarray(copyOffset, copyOffset + copySize));
		} else if (opcode) {
			chunks.push(delta.subarray(offset, offset + opcode));
			offset += opcode;
		} else throw new Error("Git delta contains a reserved opcode.");
	}
	const result = concatBytes(chunks);
	if (result.byteLength !== targetSize.size) throw new Error("Git delta target size does not match decoded content.");
	return result;
};
var resolvePackDeltas = async (objects, format) => {
	const byOffset = /* @__PURE__ */ new Map();
	const byOid = /* @__PURE__ */ new Map();
	objects.forEach((object) => {
		byOffset.set(object.offset, object);
		if (object.oid) byOid.set(object.oid, object);
	});
	for (let pass = 0; pass < objects.length; pass += 1) {
		let resolvedThisPass = 0;
		for (const object of objects) {
			if (!object.deltaKind || object.oid || !object.content) continue;
			const base = typeof object.baseOffset === "number" ? byOffset.get(object.baseOffset) : object.baseOid ? byOid.get(object.baseOid) : void 0;
			if (!(base === null || base === void 0 ? void 0 : base.content) || base.deltaKind || base.kind === "ofs-delta" || base.kind === "ref-delta") continue;
			object.content = applyPackDelta(base.content, object.content);
			object.kind = base.kind;
			object.oid = await hashObjectId(format, object.kind, object.content);
			if (object.oid) byOid.set(object.oid, object);
			resolvedThisPass += 1;
		}
		if (!resolvedThisPass) break;
	}
};
var parsePack = async (bytes, header, t) => {
	const offset = header.packOffset;
	if (asciiDecoder.decode(bytes.subarray(offset, offset + 4)) !== "PACK") throw new Error(t("gitBundle.error.missingPack"));
	const version = readUInt32(bytes, offset + 4);
	const count = readUInt32(bytes, offset + 8);
	const objects = [];
	let cursor = offset + 12;
	const maxObjects = Math.min(count, 2500);
	for (let index = 0; index < maxObjects && cursor < bytes.length; index += 1) {
		const objectOffset = cursor;
		const parsedHeader = readPackObjectHeader(bytes, cursor);
		cursor = parsedHeader.offset;
		const kind = kindName(parsedHeader.typeCode);
		let baseOffset;
		let baseOid;
		if (kind === "ofs-delta") {
			const parsedBase = readOfsDeltaBase(bytes, cursor);
			baseOffset = objectOffset - parsedBase.value;
			cursor = parsedBase.offset;
		} else if (kind === "ref-delta") {
			const oidLength = header.objectFormat === "sha256" ? 32 : 20;
			baseOid = toHex(bytes.subarray(cursor, cursor + oidLength));
			cursor += oidLength;
		}
		const inflated = inflateObject(bytes, cursor);
		cursor = inflated.nextOffset;
		const item = {
			kind,
			size: parsedHeader.size,
			offset: objectOffset,
			content: inflated.content,
			baseOffset,
			baseOid,
			deltaKind: kind === "ofs-delta" || kind === "ref-delta" ? kind : void 0
		};
		if (kind !== "ofs-delta" && kind !== "ref-delta" && kind !== "unknown") item.oid = await hashObjectId(header.objectFormat, kind, inflated.content);
		objects.push(item);
	}
	await resolvePackDeltas(objects, header.objectFormat);
	return {
		version,
		declaredCount: count,
		objects,
		parsedCount: objects.length
	};
};
var parseCommit = (object, refsByOid) => {
	if (object.kind !== "commit" || !object.oid || !object.content) return null;
	const [headers = "", ...messageParts] = textDecoder.decode(object.content).split(/\n\n/);
	const parents = [];
	let tree;
	let author;
	let committer;
	for (const line of headers.split(/\n/)) if (line.startsWith("tree ")) tree = line.slice(5);
	else if (line.startsWith("parent ")) parents.push(line.slice(7));
	else if (line.startsWith("author ")) author = line.slice(7);
	else if (line.startsWith("committer ")) committer = line.slice(10);
	return {
		oid: object.oid,
		tree,
		parents,
		author,
		committer,
		message: messageParts.join("\n\n").trim() || "(no message)",
		refs: refsByOid.get(object.oid) || []
	};
};
var parseTree = (content) => {
	const entries = [];
	let offset = 0;
	while (offset < content.byteLength) {
		const modeEnd = content.indexOf(32, offset);
		if (modeEnd < 0) break;
		const nameEnd = content.indexOf(0, modeEnd + 1);
		if (nameEnd < 0 || nameEnd + 21 > content.byteLength) break;
		entries.push({
			mode: asciiDecoder.decode(content.subarray(offset, modeEnd)),
			name: textDecoder.decode(content.subarray(modeEnd + 1, nameEnd)),
			oid: toHex(content.subarray(nameEnd + 1, nameEnd + 21))
		});
		offset = nameEnd + 21;
	}
	return entries;
};
var isMostlyText = (bytes) => {
	const sample = bytes.subarray(0, Math.min(bytes.byteLength, 4096));
	if (!sample.length) return true;
	let printable = 0;
	for (const byte of sample) if (byte === 9 || byte === 10 || byte === 13 || byte >= 32 && byte < 127 || byte >= 128) printable += 1;
	return printable / sample.length > .86;
};
var previewBlob = (content) => {
	if (!isMostlyText(content)) return `[binary blob: ${content.byteLength} bytes]`;
	return textDecoder.decode(content.subarray(0, Math.min(content.byteLength, 12e3)));
};
var collectTree = (objectMap, treeOid, basePath = "", depth = 0) => {
	if (!treeOid || depth > 24) return {
		treeEntries: [],
		files: []
	};
	const treeObject = objectMap.get(treeOid);
	if ((treeObject === null || treeObject === void 0 ? void 0 : treeObject.kind) !== "tree" || !treeObject.content) return {
		treeEntries: [],
		files: []
	};
	const treeEntries = [];
	const files = [];
	for (const entry of parseTree(treeObject.content)) {
		const path = basePath ? `${basePath}/${entry.name}` : entry.name;
		treeEntries.push({
			path,
			entry
		});
		const object = objectMap.get(entry.oid);
		if ((object === null || object === void 0 ? void 0 : object.kind) === "tree") {
			const child = collectTree(objectMap, entry.oid, path, depth + 1);
			treeEntries.push(...child.treeEntries);
			files.push(...child.files);
		} else if ((object === null || object === void 0 ? void 0 : object.kind) === "blob" && object.content) files.push({
			path,
			oid: entry.oid,
			size: object.content.byteLength,
			preview: previewBlob(object.content)
		});
	}
	return {
		treeEntries,
		files
	};
};
var parseBundleModel = async (buffer, t) => {
	const bytes = new Uint8Array(buffer);
	const header = parseHeader(bytes, t);
	const pack = await parsePack(bytes, header, t);
	const objectMap = new Map(pack.objects.flatMap((object) => object.oid ? [[object.oid, object]] : []));
	const refsByOid = /* @__PURE__ */ new Map();
	header.refs.forEach((ref) => {
		refsByOid.set(ref.oid, [...refsByOid.get(ref.oid) || [], ref.name]);
	});
	const commits = pack.objects.map((object) => parseCommit(object, refsByOid)).filter((commit) => Boolean(commit));
	const selectedCommit = header.refs.map((ref) => refsByOid.has(ref.oid) ? commits.find((commit) => commit.oid === ref.oid) : null).find(Boolean) || commits[0];
	const tree = collectTree(objectMap, selectedCommit === null || selectedCommit === void 0 ? void 0 : selectedCommit.tree);
	return {
		header,
		objects: pack.objects,
		commits,
		files: tree.files,
		treeEntries: tree.treeEntries,
		deltaCount: pack.objects.filter((object) => object.deltaKind).length
	};
};
var shortOid = (oid) => oid ? oid.slice(0, 12) : "-";
var commitTitle = (commit) => commit.message.split(/\r?\n/)[0] || "(no message)";
var clampZoom$2 = (value) => {
	return Math.min(2.2, Math.max(.65, Number(value.toFixed(2))));
};
var renderMeta = (documentRef, panel, model, t) => {
	const meta = createElement$1(documentRef, "div", "git-bundle-meta");
	const counts = /* @__PURE__ */ new Map();
	model.objects.forEach((object) => {
		counts.set(object.kind, (counts.get(object.kind) || 0) + 1);
	});
	[
		[t("gitBundle.meta.bundle"), model.header.signature],
		[t("gitBundle.meta.refs"), String(model.header.refs.length)],
		[t("gitBundle.meta.commits"), String(model.commits.length)],
		[t("gitBundle.meta.objects"), String(model.objects.length)],
		[t("gitBundle.meta.deltas"), String(model.deltaCount)],
		[t("gitBundle.meta.objectFormat"), model.header.objectFormat],
		[t("gitBundle.meta.objectTypes"), Array.from(counts).map(([kind, count]) => `${kind}:${count}`).join(" · ") || "-"]
	].forEach(([label, value]) => {
		const row = createElement$1(documentRef, "div");
		row.append(createElement$1(documentRef, "span", void 0, label), createElement$1(documentRef, "strong", void 0, value));
		meta.appendChild(row);
	});
	panel.appendChild(meta);
	if (model.deltaCount > 0) panel.appendChild(createElement$1(documentRef, "div", "git-bundle-notice", t("gitBundle.notice.delta")));
};
async function renderGitBundle(buffer, target, type = "bundle", context) {
	const loadPako = getFileViewerPakoLoader();
	if (!loadPako) throw new Error("Git bundle support is opt-in. Run `npx file-viewer-cli add text-tools --write`, then `npx file-viewer-cli install --yes`.");
	({Inflate} = await loadPako());
	const documentRef = target.ownerDocument || document;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const model = await parseBundleModel(buffer, t);
	let zoom = 1;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = createElement$1(documentRef, "div", "git-bundle-viewer");
	root.dataset.viewerZoomProvider = "git-bundle";
	const toolbar = createElement$1(documentRef, "div", "git-bundle-toolbar");
	toolbar.append(createElement$1(documentRef, "span", void 0, type.toUpperCase()), createElement$1(documentRef, "strong", void 0, t("gitBundle.toolbar.summary", {
		commits: model.commits.length,
		files: model.files.length
	})));
	const layout = createElement$1(documentRef, "div", "git-bundle-layout");
	const historyPanel = createElement$1(documentRef, "section", "git-bundle-panel");
	historyPanel.appendChild(createElement$1(documentRef, "h3", void 0, t("gitBundle.title.history")));
	renderMeta(documentRef, historyPanel, model, t);
	const historyList = createElement$1(documentRef, "ul", "git-bundle-list");
	historyPanel.appendChild(historyList);
	const treePanel = createElement$1(documentRef, "section", "git-bundle-panel");
	treePanel.appendChild(createElement$1(documentRef, "h3", void 0, t("gitBundle.title.fileTree")));
	const tree = createElement$1(documentRef, "div", "git-bundle-tree");
	treePanel.appendChild(tree);
	const filePanel = createElement$1(documentRef, "section", "git-bundle-panel git-bundle-file");
	const fileHeader = createElement$1(documentRef, "div", "git-bundle-file-header", t("gitBundle.file.choose"));
	const fileCode = createElement$1(documentRef, "pre", "git-bundle-code", "");
	filePanel.append(fileHeader, fileCode);
	layout.append(historyPanel, treePanel, filePanel);
	root.append(toolbar, layout);
	target.replaceChildren(createStyle$2(documentRef), root);
	const renderFiles = (files) => {
		tree.replaceChildren();
		if (!files.length) {
			tree.appendChild(createElement$1(documentRef, "div", "git-bundle-notice", t("gitBundle.file.noTree")));
			fileHeader.textContent = t("gitBundle.file.none");
			fileCode.textContent = "";
			return;
		}
		files.forEach((file, index) => {
			const button = createElement$1(documentRef, "button");
			button.type = "button";
			button.textContent = `${file.path} · ${file.size} B`;
			button.addEventListener("click", () => {
				tree.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
				button.classList.add("active");
				fileHeader.textContent = `${file.path} · ${shortOid(file.oid)}`;
				fileCode.textContent = file.preview;
			});
			tree.appendChild(button);
			if (index === 0) button.click();
		});
	};
	model.commits.forEach((commit, index) => {
		const button = createElement$1(documentRef, "button");
		button.type = "button";
		button.innerHTML = "";
		button.append(documentRef.createTextNode(commit.refs[0] || commitTitle(commit)), createElement$1(documentRef, "small", void 0, `${shortOid(commit.oid)} · ${commitTitle(commit)}`));
		button.addEventListener("click", () => {
			historyList.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
			button.classList.add("active");
			const commitTree = collectTree(new Map(model.objects.flatMap((object) => object.oid ? [[object.oid, object]] : [])), commit.tree);
			renderFiles(commitTree.files);
		});
		historyList.appendChild(button);
		if (index === 0) button.click();
	});
	if (!model.commits.length) {
		historyList.appendChild(createElement$1(documentRef, "li", "git-bundle-notice", t("gitBundle.history.empty")));
		renderFiles(model.files);
	}
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 2.2,
		canZoomOut: zoom > .65,
		canReset: zoom !== 1,
		minScale: .65,
		maxScale: 2.2
	});
	const setZoom = (scale) => {
		zoom = clampZoom$2(scale);
		root.style.setProperty("--bundle-font-size", `${13 * zoom}px`);
		zoomEmitter.emit();
		return getZoomState();
	};
	setZoom(1);
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	return {
		$el: root,
		unmount() {
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/html.js
var previewPolicy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
function createHtmlPreviewDocument(documentRef, source) {
	const windowRef = documentRef.defaultView;
	if (!windowRef) throw new Error("HTML preview requires a browser document");
	const sanitized = purify(windowRef).sanitize(source, {
		WHOLE_DOCUMENT: true,
		USE_PROFILES: { html: true },
		ADD_TAGS: ["style"],
		FORBID_TAGS: [
			"script",
			"base",
			"meta",
			"link",
			"iframe",
			"frame",
			"frameset",
			"object",
			"embed",
			"form",
			"template"
		],
		FORBID_ATTR: [
			"srcdoc",
			"action",
			"formaction",
			"target",
			"ping",
			"srcset"
		]
	});
	const preview = new windowRef.DOMParser().parseFromString(sanitized, "text/html");
	for (const element of preview.querySelectorAll("*")) for (const attribute of [...element.attributes]) {
		const name = attribute.name.toLowerCase();
		if (name.startsWith("on")) element.removeAttribute(attribute.name);
		if (name === "href" && !attribute.value.trim().startsWith("#")) element.removeAttribute(attribute.name);
		if (name === "src" && !/^data:image\/(?:png|jpeg|gif|webp|avif|bmp|x-icon|svg\+xml)[;,]/i.test(attribute.value.trim())) element.removeAttribute(attribute.name);
	}
	const policy = preview.createElement("meta");
	policy.httpEquiv = "Content-Security-Policy";
	policy.content = previewPolicy;
	const viewport = preview.createElement("meta");
	viewport.name = "viewport";
	viewport.content = "width=device-width, initial-scale=1";
	preview.head.prepend(policy, viewport);
	return `<!doctype html>\n${preview.documentElement.outerHTML}`;
}
async function renderHtml(buffer, target, type, context) {
	var _a, _b, _c, _d;
	const documentRef = target.ownerDocument;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const root = documentRef.createElement("div");
	root.className = "html-viewer";
	const style = documentRef.createElement("style");
	style.textContent = `
.html-viewer{height:100%;min-height:0;display:flex;flex-direction:column}
.html-viewer-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #dbe2e8;background:var(--file-viewer-panel,#f8fafc);color:var(--file-viewer-text,#172033)}
.html-viewer-toolbar button{border:1px solid #cbd5e1;border-radius:6px;padding:5px 10px;background:transparent;color:inherit;cursor:pointer;min-height:36px}
.html-viewer-toolbar button[aria-pressed="true"]{border-color:#0f766e;background:#0f766e;color:white}
.html-viewer-hint{font-size:12px;flex:1 1 160px}
.html-preview-frame,.html-source-view{flex:1;width:100%;min-height:0;border:0}
.html-preview-frame{background:white}
.html-source-view{overflow:auto}
.html-viewer [hidden]{display:none!important}
@media(max-width:600px){.html-viewer-toolbar button{min-height:44px}}
`;
	const toolbar = documentRef.createElement("div");
	toolbar.className = "html-viewer-toolbar";
	const previewButton = documentRef.createElement("button");
	previewButton.type = "button";
	previewButton.textContent = t("text.html.preview");
	previewButton.dataset.htmlView = "preview";
	const sourceButton = documentRef.createElement("button");
	sourceButton.type = "button";
	sourceButton.textContent = t("text.html.source");
	sourceButton.dataset.htmlView = "source";
	const hint = documentRef.createElement("span");
	hint.className = "html-viewer-hint";
	hint.textContent = t("text.html.safePreview");
	toolbar.append(previewButton, sourceButton, hint);
	const frame = documentRef.createElement("iframe");
	frame.className = "html-preview-frame";
	frame.title = t("text.html.preview");
	frame.setAttribute("sandbox", "");
	frame.referrerPolicy = "no-referrer";
	const sourceTarget = documentRef.createElement("div");
	sourceTarget.className = "html-source-view";
	if (((_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toolbar) !== false) root.append(toolbar);
	root.append(frame, sourceTarget);
	target.replaceChildren(style, root);
	let sourceInstance;
	let sourcePending;
	let disposed = false;
	const select = async (view) => {
		var _a, _b;
		if (disposed) return;
		root.dataset.htmlView = view;
		previewButton.setAttribute("aria-pressed", String(view === "preview"));
		sourceButton.setAttribute("aria-pressed", String(view === "source"));
		frame.hidden = view !== "preview";
		sourceTarget.hidden = view !== "source";
		hint.hidden = view !== "preview";
		if (view === "preview" && !frame.hasAttribute("srcdoc")) frame.srcdoc = createHtmlPreviewDocument(documentRef, decodeFileViewerTextBuffer(buffer, (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.encoding).text);
		if (view === "source" && !sourcePending) sourcePending = renderText(buffer, sourceTarget, type, context).then((instance) => {
			if (disposed) disposeFileViewerRendered(instance);
			else sourceInstance = instance;
		});
		await sourcePending;
	};
	const showPreview = () => {
		select("preview");
	};
	const showSource = () => {
		select("source");
	};
	previewButton.addEventListener("click", showPreview);
	sourceButton.addEventListener("click", showSource);
	await select(((_d = (_c = context === null || context === void 0 ? void 0 : context.options) === null || _c === void 0 ? void 0 : _c.text) === null || _d === void 0 ? void 0 : _d.htmlView) || "preview");
	return {
		$el: target,
		unmount() {
			disposed = true;
			previewButton.removeEventListener("click", showPreview);
			sourceButton.removeEventListener("click", showSource);
			disposeFileViewerRendered(sourceInstance);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/marked@18.0.14/node_modules/marked/lib/marked.esm.js
/**
* marked v18.0.14 - a markdown parser
* Copyright (c) 2018-2026, MarkedJS. (MIT License)
* Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
* https://github.com/markedjs/marked
*/
/**
* DO NOT EDIT THIS FILE
* The code in this file is generated from files in ./src/
*/
function I() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var y = I();
function W(l) {
	y = l;
}
var A = { exec: () => null };
function C(l) {
	let e = [];
	return (t) => {
		let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
		return s || (s = l(n), e[n] = s), s;
	};
}
function h(l, e = "") {
	let t = typeof l == "string" ? l : l.source, n = {
		replace: (s, r) => {
			let o = typeof r == "string" ? r : r.source;
			return o = o.replace(x.caret, "$1"), t = t.replace(s, o), n;
		},
		getRegex: () => new RegExp(t, e)
	};
	return n;
}
var _e = ((l = "") => {
	try {
		return !!new RegExp("(?<=1)(?<!1)" + l);
	} catch {
		return !1;
	}
})();
var x = {
	codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	endingSpaceTabChar: /[ \t]$/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	leadingSpaceTab: /^[ \t]+/,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] +\S/,
	listReplaceTask: /^\[[ xX]\] +/,
	listTaskCheckbox: /\[[ xX]\]/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	numericCharacterReference: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/g,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (l) => new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: C((l) => new RegExp(`^ {0,${l}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: C((l) => new RegExp(`^ {0,${l}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)),
	fencesBeginRegex: C((l) => new RegExp(`^ {0,${l}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: C((l) => new RegExp(`^ {0,${l}}#`)),
	htmlBeginRegex: C((l) => new RegExp(`^ {0,${l}}(?:</?(?:${N})(?: +|$|/?>)|<(?:script|pre|style|textarea|!--))`, "i")),
	blockquoteBeginRegex: C((l) => new RegExp(`^ {0,${l}}>`))
};
var $e = /^(?:[ \t]*(?:\n|$))+/;
var Le = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var ze = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var G = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Ae = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var J = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var ce = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var he = h(ce).replace(/bull/g, J).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Ee = h(ce).replace(/bull/g, J).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var V = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/;
var Me = /^[^\n]+/;
var Y = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var Ie = h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Y).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var Ce = h(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, J).getRegex();
var N = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var ee = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var Be = h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", ee).replace("tag", N).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var de = (l) => h(V).replace("hr", G).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", l).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex();
var De = de(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
var qe = de(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/);
var te = {
	blockquote: h(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", qe).getRegex(),
	code: Le,
	def: Ie,
	fences: ze,
	heading: Ae,
	hr: G,
	html: Be,
	lheading: he,
	list: Ce,
	newline: $e,
	paragraph: De,
	table: A,
	text: Me
};
var le = h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", G).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex();
var Ze = {
	...te,
	lheading: Ee,
	table: le,
	paragraph: h(V).replace("hr", G).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", le).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex()
};
var He = {
	...te,
	html: h(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", ee).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: A,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: h(V).replace("hr", G).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", he).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
};
var Ge = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var Ne = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var ke = /^( {2,}|\\)\n(?!\s*$)[ \t]*/;
var Qe = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var $ = /[\p{P}\p{S}]/u;
var B = /[\s\p{P}\p{S}]/u;
var Q = /[^\s\p{P}\p{S}]/u;
var je = h(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, B).getRegex();
var Fe = /[\p{Pi}\p{Ps}"']/u;
var ge = /(?!~)[\p{P}\p{S}]/u;
var Ue = /(?!~)[\s\p{P}\p{S}]/u;
var Ke = /(?:[^\s\p{P}\p{S}]|~)/u;
var We = h(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", _e ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var fe = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var Xe = h(fe, "u").replace(/punct/g, $).getRegex();
var Je = h(fe, "u").replace(/punct/g, ge).getRegex();
var Ye = h(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/, "u").replace(/openQuote/g, Fe).replace(/punct/g, $).getRegex();
var me = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var et = h(me, "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var tt = h(me, "gu").replace(/notPunctSpace/g, Ke).replace(/punctSpace/g, Ue).replace(/punct/g, ge).getRegex();
var rt = h("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var st = h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var ot = h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var at = h(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, $).getRegex();
var ut = h("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var pt = h(/\\(punct)/, "gu").replace(/punct/g, $).getRegex();
var ct = h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var ht = h(ee).replace("(?:-->|$)", "-->").getRegex();
var dt = h("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ht).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var xe = /\[(?:\\[\s\S]|[^\[\]\\])*\]/;
var U = h(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets", xe).getRegex();
var kt = h(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", U).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var gt = h(/^!?\[(label)\]\[(ref)\]/).replace("label", U).replace("ref", Y).getRegex();
var ft = h(/^!?\[(ref)\](?:\[\])?/).replace("ref", Y).getRegex();
var ue = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/;
var mt = h(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets", xe).getRegex();
var xt = h("reflink|nolink(?!\\()", "g").replace("reflink", h(/^!?\[(label)\]\[(ref)\]/).replace("label", mt).replace("ref", ue).getRegex()).replace("nolink", h(/^!?\[(ref)\](?:\[\])?/).replace("ref", ue).getRegex()).getRegex();
var pe = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var Rt = h(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g, /[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex();
var ne = {
	_backpedal: A,
	anyPunctuation: pt,
	autolink: ct,
	blockSkip: We,
	br: ke,
	code: Ne,
	del: A,
	delLDelim: A,
	delRDelim: A,
	emStrongLDelim: Xe,
	emStrongRDelimAst: et,
	emStrongRDelimUnd: st,
	escape: Ge,
	link: kt,
	nolink: ft,
	punctuation: je,
	reflink: gt,
	reflinkSearch: xt,
	tag: dt,
	text: Qe,
	url: A
};
var Tt = {
	...ne,
	emStrongLDelim: Ye,
	emStrongRDelimAst: rt,
	emStrongRDelimUnd: ot,
	link: h(/^!?\[(label)\]\((.*?)\)/).replace("label", U).getRegex(),
	reflink: h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", U).getRegex()
};
var X = {
	...ne,
	emStrongRDelimAst: tt,
	emStrongLDelim: Je,
	delLDelim: at,
	delRDelim: ut,
	url: h(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol", Rt).replace("protocol", pe).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: h(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol", pe).replace(/emailProtocol/g, /(?:mailto|xmpp):/).getRegex()
};
var Ot = {
	...X,
	br: h(ke).replace("{2,}", "*").getRegex(),
	text: h(X.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
};
var j = {
	normal: te,
	gfm: Ze,
	pedantic: He
};
var D = {
	normal: ne,
	gfm: X,
	breaks: Ot,
	pedantic: Tt
};
var wt = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
var be = (l) => wt[l];
function O(l, e) {
	if (e) {
		if (x.escapeTest.test(l)) return l.replace(x.escapeReplace, be);
	} else if (x.escapeTestNoEncode.test(l)) return l.replace(x.escapeReplaceNoEncode, be);
	return l;
}
function Re(l) {
	return l.replace(x.numericCharacterReference, (e, t, n) => {
		let s = t === void 0 ? Number.parseInt(n, 16) : Number.parseInt(t, 10);
		return s === 0 || s > 1114111 || s >= 55296 && s <= 57343 ? "�" : String.fromCodePoint(s);
	});
}
function re(l) {
	try {
		l = encodeURI(l).replace(x.percentDecode, "%");
	} catch {
		return null;
	}
	return l;
}
function se(l, e) {
	let n = l.replace(x.findPipe, (r, o, i) => {
		let u = !1, a = o;
		for (; --a >= 0 && i[a] === "\\";) u = !u;
		return u ? "|" : " |";
	}).split(x.splitPipe), s = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
	else for (; n.length < e;) n.push("");
	for (; s < n.length; s++) n[s] = n[s].trim().replace(x.slashPipe, "|");
	return n;
}
function L(l, e, t) {
	let n = l.length;
	if (n === 0) return "";
	let s = 0;
	for (; s < n;) {
		let r = l.charAt(n - s - 1);
		if (r === e && !t) s++;
		else if (r !== e && t) s++;
		else break;
	}
	return l.slice(0, n - s);
}
function ie(l) {
	let e = l.split(`
`), t = e.length - 1;
	for (; t >= 0 && x.blankLine.test(e[t]);) t--;
	return e.length - t <= 2 ? l : e.slice(0, t + 1).join(`
`);
}
function q(l) {
	return l.trim().toLowerCase().toUpperCase().toLowerCase();
}
function Te(l, e) {
	if (l.indexOf(e[1]) === -1) return -1;
	let t = 0;
	for (let n = 0; n < l.length; n++) if (l[n] === "\\") n++;
	else if (l[n] === e[0]) t++;
	else if (l[n] === e[1] && (t--, t < 0)) return n;
	return t > 0 ? -2 : -1;
}
function oe(l, e = 0) {
	let t = e, n = "";
	for (let s of l) if (s === "	") {
		let r = 4 - t % 4;
		n += " ".repeat(r), t += r;
	} else n += s, t++;
	return n;
}
function Oe(l, e, t, n, s) {
	let r = e.href, o = e.title || null, i = l[1].replace(s.other.outputLinkReplace, "$1"), u = l[0].charAt(0) === "!";
	n.state.inLink = !0;
	let a = n.state.linkEmitted, p = n.state.inRawBlock;
	n.state.linkEmitted = !1;
	let c = n.inlineTokens(i), d = n.state.linkEmitted;
	if (n.state.linkEmitted = a, n.state.inLink = !1, !u) {
		if (d) {
			n.state.inRawBlock = p;
			return;
		}
		n.state.linkEmitted = !0;
	}
	return {
		type: u ? "image" : "link",
		raw: t,
		href: r,
		title: o,
		text: i,
		tokens: c
	};
}
function yt(l, e, t) {
	let n = l.match(t.other.indentCodeCompensation);
	if (n === null) return e;
	let s = n[1];
	return e.split(`
`).map((r) => {
		let o = r.match(t.other.beginningSpace);
		if (o === null) return r;
		let [i] = o;
		return r.slice(Math.min(i.length, s.length));
	}).join(`
`);
}
function we(l, e, t, n) {
	if (!e.includes("<")) return !1;
	for (let s = 0; s < e.length; s++) {
		if (e[s] === "\\") {
			s++;
			continue;
		}
		if (e[s] === "`") {
			let i = n.inline.code.exec(e.slice(s));
			if (i) {
				s += i[0].length - 1;
				continue;
			}
		}
		if (e[s] !== "<") continue;
		let r = l.slice(t + s), o = n.inline.tag.exec(r) || n.inline.autolink.exec(r);
		if (o) {
			if (o[0].length > e.length - s) return !0;
			s += o[0].length - 1;
		}
	}
	return !1;
}
var P = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || y;
	}
	space(e) {
		let t = this.rules.block.newline.exec(e);
		if (t && t[0].length > 0) return {
			type: "space",
			raw: t[0]
		};
	}
	code(e) {
		let t = this.rules.block.code.exec(e);
		if (t) {
			let n = this.options.pedantic ? t[0] : ie(t[0]);
			return {
				type: "code",
				raw: n,
				codeBlockStyle: "indented",
				text: n.replace(this.rules.other.codeRemoveIndent, "")
			};
		}
	}
	fences(e) {
		let t = this.rules.block.fences.exec(e);
		if (t) {
			let n = t[0], s = yt(n, t[3] || "", this.rules);
			return {
				type: "code",
				raw: n,
				lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
				text: s
			};
		}
	}
	heading(e) {
		let t = this.rules.block.heading.exec(e);
		if (t) {
			let n = t[2].trim();
			if (this.rules.other.endingHash.test(n)) {
				let s = L(n, "#");
				(this.options.pedantic || !s || this.rules.other.endingSpaceTabChar.test(s)) && (n = s.trim());
			}
			return {
				type: "heading",
				raw: L(t[0], `
`),
				depth: t[1].length,
				text: n,
				tokens: this.lexer.inline(n)
			};
		}
	}
	hr(e) {
		let t = this.rules.block.hr.exec(e);
		if (t) return {
			type: "hr",
			raw: L(t[0], `
`)
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let n = L(t[0], `
`).split(`
`), s = "", r = "", o = [];
			for (; n.length > 0;) {
				let i = !1, u = [], a;
				for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) u.push(n[a]), i = !0;
				else if (!i) u.push(n[a]);
				else break;
				n = n.slice(a);
				let p = u.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
				s = s ? `${s}
${p}` : p, r = r ? `${r}
${c}` : c;
				let d = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(c, o, !0), this.lexer.state.top = d, n.length === 0) break;
				let m = o.at(-1);
				if (m?.type === "code") break;
				if (m?.type === "blockquote") {
					let b = m, g = n.join(`
`), w = b.raw + `
` + g.replace(this.rules.other.blockquoteSetextReplace2, ""), f = this.blockquote(w);
					o[o.length - 1] = f;
					let M = w.substring(f.raw.length).replace(/^\n/, ""), v = M ? M.split(`
`).length : 0, Z = v ? n.slice(0, -v) : n;
					Z.length > 0 && (s = `${s}
${Z.join(`
`)}`), r = r.substring(0, r.length - b.text.length) + f.text;
					break;
				} else if (m?.type === "list") {
					let b = m, g = b.raw + `
` + n.join(`
`), w = this.list(g);
					o[o.length - 1] = w, s = s.substring(0, s.length - m.raw.length) + w.raw, r = r.substring(0, r.length - b.raw.length) + w.raw, n = g.substring(o.at(-1).raw.length).split(`
`);
					continue;
				}
			}
			return {
				type: "blockquote",
				raw: s,
				tokens: o,
				text: r
			};
		}
	}
	list(e) {
		let t = this.rules.block.list.exec(e);
		if (t) {
			let n = t[1].trim(), s = n.length > 1, r = {
				type: "list",
				raw: "",
				ordered: s,
				start: s ? +n.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
			let o = this.rules.other.listItemRegex(n), i = !1;
			for (; e;) {
				let a = !1, p = "", c = "";
				if (!(t = o.exec(e)) || this.rules.block.hr.test(e)) break;
				p = t[0], e = e.substring(p.length);
				let d = t[2].split(`
`, 1)[0], m = t[1].length, b = this.options.pedantic ? oe(d, m) : d.replace(this.rules.other.leadingSpaceTab, (M) => oe(M, m)), g = e.split(`
`, 1)[0], w = !b.trim(), f = 0;
				if (this.options.pedantic ? (f = 2, c = b.trimStart()) : w ? f = m + 1 : (f = b.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = b.slice(f), f += m), w && this.rules.other.blankLine.test(g) && (p += g + `
`, e = e.substring(g.length + 1), a = !0), !a) {
					let M = this.rules.other.nextBulletRegex(f), v = this.rules.other.hrRegex(f), Z = this.rules.other.fencesBeginRegex(f), ae = this.rules.other.headingBeginRegex(f), ye = this.rules.other.htmlBeginRegex(f), Pe = this.rules.other.blockquoteBeginRegex(f);
					for (; e;) {
						let K = e.split(`
`, 1)[0], H;
						if (g = K, this.options.pedantic ? (g = g.replace(this.rules.other.listReplaceNesting, "  "), H = g) : H = g.replace(this.rules.other.leadingSpaceTab, (Se) => Se.replace(this.rules.other.tabCharGlobal, "    ")), Z.test(g) || ae.test(g) || ye.test(g) || Pe.test(g) || M.test(g) || v.test(g)) break;
						if (H.search(this.rules.other.nonSpaceChar) >= f || !g.trim()) c += `
` + H.slice(f);
						else {
							if (w || b.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Z.test(b) || ae.test(b) || v.test(b)) break;
							c += `
` + g;
						}
						w = !g.trim(), p += K + `
`, e = e.substring(K.length + 1), b = H.slice(f);
					}
				}
				r.loose || (i ? r.loose = !0 : this.rules.other.doubleBlankLine.test(p) && (i = !0)), r.items.push({
					type: "list_item",
					raw: p,
					task: !!this.options.gfm && this.rules.other.listIsTask.test(c),
					loose: !1,
					text: c,
					tokens: []
				}), r.raw += p;
			}
			let u = r.items.at(-1);
			if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
			else return;
			r.raw = r.raw.trimEnd();
			for (let a of r.items) if (this.lexer.state.top = !1, a.tokens = this.lexer.blockTokens(a.text, []), !r.loose) {
				let p = a.tokens.filter((d) => d.type === "space");
				r.loose = p.length > 0 && p.some((d) => this.rules.other.anyLine.test(d.raw));
			}
			for (let a of r.items) {
				let p = a.tokens[0];
				if (a.task && (p?.type === "text" || p?.type === "paragraph")) {
					a.text = a.text.replace(this.rules.other.listReplaceTask, ""), p.raw = p.raw.replace(this.rules.other.listReplaceTask, ""), p.text = p.text.replace(this.rules.other.listReplaceTask, "");
					for (let d = this.lexer.inlineQueue.length - 1; d >= 0; d--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[d].src)) {
						this.lexer.inlineQueue[d].src = this.lexer.inlineQueue[d].src.replace(this.rules.other.listReplaceTask, "");
						break;
					}
					let c = this.rules.other.listTaskCheckbox.exec(a.raw);
					if (c) {
						let d = {
							type: "checkbox",
							raw: c[0] + " ",
							checked: c[0] !== "[ ]"
						};
						a.checked = d.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = d.raw + a.tokens[0].raw, a.tokens[0].text = d.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(d)) : a.tokens.unshift({
							type: "paragraph",
							raw: d.raw,
							text: d.raw,
							tokens: [d]
						}) : a.tokens.unshift(d);
					}
				} else a.task && (a.task = !1);
			}
			if (r.loose) for (let a of r.items) {
				a.loose = !0;
				for (let p of a.tokens) p.type === "text" && (p.type = "paragraph");
			}
			return r;
		}
	}
	html(e) {
		let t = this.rules.block.html.exec(e);
		if (t) {
			let n = ie(t[0]);
			return {
				type: "html",
				block: !0,
				raw: n,
				pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
				text: n
			};
		}
	}
	def(e) {
		let t = this.rules.block.def.exec(e);
		if (t) {
			let n = q(t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
			return {
				type: "def",
				tag: n,
				raw: L(t[0], `
`),
				href: s,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = se(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], o = {
			type: "table",
			raw: L(t[0], `
`),
			header: [],
			align: [],
			rows: []
		};
		if (n.length === s.length) {
			for (let i of s) this.rules.other.tableAlignRight.test(i) ? o.align.push("right") : this.rules.other.tableAlignCenter.test(i) ? o.align.push("center") : this.rules.other.tableAlignLeft.test(i) ? o.align.push("left") : o.align.push(null);
			for (let i = 0; i < n.length; i++) o.header.push({
				text: n[i],
				tokens: this.lexer.inline(n[i]),
				header: !0,
				align: o.align[i]
			});
			for (let i of r) o.rows.push(se(i, o.header.length).map((u, a) => ({
				text: u,
				tokens: this.lexer.inline(u),
				header: !1,
				align: o.align[a]
			})));
			return o;
		}
	}
	lheading(e) {
		let t = this.rules.block.lheading.exec(e);
		if (t) {
			let n = t[1].trim();
			return {
				type: "heading",
				raw: L(t[0], `
`),
				depth: t[2].charAt(0) === "=" ? 1 : 2,
				text: n,
				tokens: this.lexer.inline(n)
			};
		}
	}
	paragraph(e) {
		let t = this.rules.block.paragraph.exec(e);
		if (t) {
			let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
			return {
				type: "paragraph",
				raw: t[0],
				text: n,
				tokens: this.lexer.inline(n)
			};
		}
	}
	text(e) {
		let t = this.rules.block.text.exec(e);
		if (t) return {
			type: "text",
			raw: t[0],
			text: t[0],
			tokens: this.lexer.inline(t[0])
		};
	}
	escape(e) {
		let t = this.rules.inline.escape.exec(e);
		if (t) return {
			type: "escape",
			raw: t[0],
			text: t[1]
		};
	}
	tag(e) {
		let t = this.rules.inline.tag.exec(e);
		if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: t[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: t[0]
		};
	}
	link(e) {
		let t = this.rules.inline.link.exec(e);
		if (t) {
			let n = t[0].charAt(0) === "!" ? 2 : 1;
			if (!this.options.pedantic && we(e, t[1], n, this.rules)) return;
			let s = t[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(s)) {
				if (!this.rules.other.endAngleBracket.test(s)) return;
				let i = L(s.slice(0, -1), "\\");
				if ((s.length - i.length) % 2 === 0) return;
			} else {
				let i = Te(t[2], "()");
				if (i === -2) return;
				if (i > -1) {
					let a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
					t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, a).trim(), t[3] = "";
				}
			}
			let r = t[2], o = "";
			if (this.options.pedantic) {
				let i = this.rules.other.pedanticHrefTitle.exec(r);
				i && (r = i[1], o = i[3]);
			} else o = t[3] ? t[3].slice(1, -1) : "";
			return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(s) ? r = r.slice(1) : r = r.slice(1, -1)), Oe(t, {
				href: r && r.replace(this.rules.inline.anyPunctuation, "$1"),
				title: o && o.replace(this.rules.inline.anyPunctuation, "$1")
			}, t[0], this.lexer, this.rules);
		}
	}
	reflink(e, t) {
		let n;
		if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
			let s = n[0].charAt(0) === "!" ? 2 : 1;
			if (!this.options.pedantic && we(e, n[1], s, this.rules)) return;
			let o = t[q((n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "))];
			if (!o) {
				let i = n[0].charAt(0);
				return {
					type: "text",
					raw: i,
					text: i
				};
			}
			return Oe(n, o, n[0], this.lexer, this.rules);
		}
	}
	emStrong(e, t, n = "") {
		let s = this.rules.inline.emStrongLDelim.exec(e);
		if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
		if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
			let o = [...s[0]].length - 1, i, u, a = o, p = 0, c = s[0][0], d = n === c, m = c === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (m.lastIndex = 0, t = t.slice(-1 * e.length + o); (s = m.exec(t)) !== null;) {
				if (i = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !i) continue;
				if (u = [...i].length, s[3] || s[4]) {
					a += u;
					continue;
				} else if (s[5] || s[6]) {
					if (o % 3 && !((o + u) % 3)) {
						p += u;
						continue;
					}
					if (d) break;
				}
				if (a -= u, a > 0) continue;
				u = Math.min(u, u + a + p);
				let b = [...s[0]][0].length, g = e.slice(0, o + s.index + b + u);
				if (Math.min(o, u) % 2) {
					let f = g.slice(1, -1);
					return {
						type: "em",
						raw: g,
						text: f,
						tokens: this.lexer.inlineTokens(f)
					};
				}
				let w = g.slice(2, -2);
				return {
					type: "strong",
					raw: g,
					text: w,
					tokens: this.lexer.inlineTokens(w)
				};
			}
		}
	}
	codespan(e) {
		let t = this.rules.inline.code.exec(e);
		if (t) {
			let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
			return s && r && (n = n.substring(1, n.length - 1)), {
				type: "codespan",
				raw: t[0],
				text: n
			};
		}
	}
	br(e) {
		let t = this.rules.inline.br.exec(e);
		if (t) return {
			type: "br",
			raw: t[0]
		};
	}
	del(e, t, n = "") {
		let s = this.rules.inline.delLDelim.exec(e);
		if (!s) return;
		if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
			let o = [...s[0]].length - 1, i, u, a = o, p = this.rules.inline.delRDelim;
			for (p.lastIndex = 0, t = t.slice(-1 * e.length + o); (s = p.exec(t)) !== null;) {
				if (i = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !i || (u = [...i].length, u !== o)) continue;
				if (s[3] || s[4]) {
					a += u;
					continue;
				}
				if (a -= u, a > 0) continue;
				u = Math.min(u, u + a);
				let c = [...s[0]][0].length, d = e.slice(0, o + s.index + c + u), m = d.slice(o, -o);
				return {
					type: "del",
					raw: d,
					text: m,
					tokens: this.lexer.inlineTokens(m)
				};
			}
		}
	}
	autolink(e) {
		let t = this.rules.inline.autolink.exec(e);
		if (t) {
			let n, s;
			return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), {
				type: "link",
				raw: t[0],
				text: n,
				href: s,
				autolink: !0,
				tokens: [{
					type: "text",
					raw: n,
					text: n
				}]
			};
		}
	}
	url(e) {
		let t;
		if (t = this.rules.inline.url.exec(e)) {
			let n, s;
			if (t[2] === "@") n = t[0], s = "mailto:" + n;
			else {
				let r;
				do
					r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
				while (r !== t[0]);
				n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
			}
			return {
				type: "link",
				raw: t[0],
				text: n,
				href: s,
				autolink: !0,
				tokens: [{
					type: "text",
					raw: n,
					text: n
				}]
			};
		}
	}
	inlineText(e) {
		let t = this.rules.inline.text.exec(e);
		if (t) {
			let n = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: t[0],
				text: n ? t[0] : Re(t[0]),
				escaped: n
			};
		}
	}
};
var R = class l {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || y, this.options.tokenizer = this.options.tokenizer || new P(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			linkEmitted: !1,
			top: !0
		};
		let t = {
			other: x,
			block: j.normal,
			inline: D.normal
		};
		this.options.pedantic ? (t.block = j.pedantic, t.inline = D.pedantic) : this.options.gfm && (t.block = j.gfm, this.options.breaks ? t.inline = D.breaks : t.inline = D.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: j,
			inline: D
		};
	}
	static lex(e, t) {
		return new l(t).lex(e);
	}
	static lexInline(e, t) {
		return new l(t).inlineTokens(e);
	}
	lex(e) {
		e = e.replace(x.carriageReturn, `
`), this.blockTokens(e, this.tokens);
		for (let t = 0; t < this.inlineQueue.length; t++) {
			let n = this.inlineQueue[t];
			this.inlineTokens(n.src, n.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(x.tabCharGlobal, "    ").replace(x.spaceLine, ""));
		let s = Infinity;
		for (; e;) {
			if (e.length < s) s = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			let r;
			if (this.options.extensions?.block?.some((i) => (r = i.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
			if (r = this.tokenizer.space(e)) {
				e = e.substring(r.raw.length);
				let i = t.at(-1);
				r.raw.length === 1 && i !== void 0 ? i.raw += `
` : t.push(r);
				continue;
			}
			if (r = this.tokenizer.code(e)) {
				e = e.substring(r.raw.length);
				let i = t.at(-1);
				i?.type === "paragraph" || i?.type === "text" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.text, this.inlineQueue.at(-1).src = i.text) : t.push(r);
				continue;
			}
			if (r = this.tokenizer.fences(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.heading(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.hr(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.blockquote(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.list(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.html(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.def(e)) {
				e = e.substring(r.raw.length);
				let i = t.at(-1);
				i?.type === "paragraph" || i?.type === "text" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.raw, this.inlineQueue.at(-1).src = i.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
					href: r.href,
					title: r.title
				}, t.push(r));
				continue;
			}
			if (r = this.tokenizer.table(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.lheading(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			let o = e;
			if (this.options.extensions?.startBlock) {
				let i = Infinity, u = e.slice(1), a;
				this.options.extensions.startBlock.forEach((p) => {
					a = p.call({ lexer: this }, u), typeof a == "number" && a >= 0 && (i = Math.min(i, a));
				}), i < Infinity && i >= 0 && (o = e.substring(0, i + 1));
			}
			if (this.state.top && (r = this.tokenizer.paragraph(o))) {
				let i = t.at(-1);
				n && i?.type === "paragraph" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = i.text) : t.push(r), n = o.length !== e.length, e = e.substring(r.raw.length);
				continue;
			}
			if (r = this.tokenizer.text(e)) {
				e = e.substring(r.raw.length);
				let i = t.at(-1);
				i?.type === "text" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = i.text) : t.push(r);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return this.state.top = !0, t;
	}
	inline(e, t = []) {
		return this.inlineQueue.push({
			src: e,
			tokens: t
		}), t;
	}
	linkInText(e) {
		if (!e.includes("[")) return !1;
		let t = this.tokenizer.rules.inline.link;
		for (let n of e.matchAll(this.tokenizer.rules.inline.blockSkip)) if (t.test(n[0]) && e.charAt(n.index - 1) !== "!") return !0;
		for (let n of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)) {
			let s = n[0], r = s.lastIndexOf("[");
			if (!(s.charAt(0) === "!" || !Object.hasOwn(this.tokens.links, q(s.slice(r + 1, -1)))) && !(r > 1 && this.linkInText(s.slice(1, r - 1)))) return !0;
		}
		return !1;
	}
	inlineTokens(e, t = []) {
		this.tokenizer.lexer = this;
		let n = e;
		if (this.tokens.links && e.includes("[")) {
			let i = this.tokenizer.rules.inline.reflinkSearch, u = (a) => {
				let p = a.lastIndexOf("[");
				if (!Object.hasOwn(this.tokens.links, q(a.slice(p + 1, -1)))) return a;
				if (p > 1 && a.charAt(0) !== "!") {
					let c = a.slice(1, p - 1);
					if (this.linkInText(c)) return "[" + c.replace(i, u) + "][" + "a".repeat(a.length - p - 2) + "]";
				}
				return "[" + "a".repeat(a.length - 2) + "]";
			};
			n = n.replace(i, u);
		}
		n = n.replace(this.tokenizer.rules.inline.anyPunctuation, (i) => "+".repeat(i.length)), n = n.replace(this.tokenizer.rules.inline.blockSkip, (i, u, a) => {
			let p = a ? a.length : 0;
			return i.slice(0, p) + "[" + "a".repeat(i.length - p - 2) + "]";
		}), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
		let s = !1, r = "", o = Infinity;
		for (; e;) {
			if (e.length < o) o = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			s || (r = ""), s = !1;
			let i;
			if (this.options.extensions?.inline?.some((a) => (i = a.call({ lexer: this }, e, t)) ? (e = e.substring(i.raw.length), t.push(i), !0) : !1)) continue;
			if (i = this.tokenizer.escape(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.tag(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.link(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.reflink(e, this.tokens.links)) {
				e = e.substring(i.raw.length);
				let a = t.at(-1);
				i.type === "text" && a?.type === "text" ? (a.raw += i.raw, a.text += i.text) : t.push(i);
				continue;
			}
			if (i = this.tokenizer.emStrong(e, n, r)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.codespan(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.br(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.del(e, n, r)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.autolink(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (!this.state.inLink && (i = this.tokenizer.url(e))) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			let u = e;
			if (this.options.extensions?.startInline) {
				let a = Infinity, p = e.slice(1), c;
				this.options.extensions.startInline.forEach((d) => {
					c = d.call({ lexer: this }, p), typeof c == "number" && c >= 0 && (a = Math.min(a, c));
				}), a < Infinity && a >= 0 && (u = e.substring(0, a + 1));
			}
			if (i = this.tokenizer.inlineText(u)) {
				e = e.substring(i.raw.length), i.raw.slice(-1) !== "_" && (r = i.raw.slice(-1)), s = !0;
				let a = t.at(-1);
				a?.type === "text" ? (a.raw += i.raw, a.text += i.text) : t.push(i);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return t;
	}
	infiniteLoopError(e) {
		let t = "Infinite loop on byte: " + e;
		if (this.options.silent) console.error(t);
		else throw new Error(t);
	}
};
var S = class {
	options;
	parser;
	constructor(e) {
		this.options = e || y;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let s = (t || "").match(x.notSpaceStart)?.[0], r = e ? e.replace(x.endingNewline, "") + `
` : "";
		return s ? "<pre><code class=\"language-" + O(s) + "\">" + (n ? r : O(r, !0)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, !0)) + `</code></pre>
`;
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: t }) {
		return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
	}
	hr(e) {
		return `<hr>
`;
	}
	list(e) {
		let t = e.ordered, n = e.start, s = "";
		for (let i = 0; i < e.items.length; i++) {
			let u = e.items[i];
			s += this.listitem(u);
		}
		let r = t ? "ol" : "ul", o = t && n !== 1 ? " start=\"" + n + "\"" : "";
		return "<" + r + o + `>
` + s + "</" + r + `>
`;
	}
	listitem(e) {
		return `<li>${this.parser.parse(e.tokens)}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let t = "", n = "";
		for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
		t += this.tablerow({ text: n });
		let s = "";
		for (let r = 0; r < e.rows.length; r++) {
			let o = e.rows[r];
			n = "";
			for (let i = 0; i < o.length; i++) n += this.tablecell(o[i]);
			s += this.tablerow({ text: n });
		}
		return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
		return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${O(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, text: n, tokens: s, autolink: r }) {
		let o = r ? O(n, !0) : this.parser.parseInline(s), i = re(e);
		if (i === null) return o;
		e = O(i, r);
		let u = "<a href=\"" + e + "\"";
		return t && (u += " title=\"" + O(t) + "\""), u += ">" + o + "</a>", u;
	}
	image({ href: e, title: t, text: n, tokens: s }) {
		s && (n = this.parser.parseInline(s, this.parser.textRenderer));
		let r = re(e);
		if (r === null) return O(n);
		e = r;
		let o = `<img src="${O(e)}" alt="${O(n)}"`;
		return t && (o += ` title="${O(t)}"`), o += ">", o;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
	}
};
var z = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
	checkbox({ raw: e }) {
		return e;
	}
};
var T = class l {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || y, this.options.renderer = this.options.renderer || new S(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new z();
	}
	static parse(e, t) {
		return new l(t).parse(e);
	}
	static parseInline(e, t) {
		return new l(t).parseInline(e);
	}
	parse(e) {
		this.renderer.parser = this;
		let t = "";
		for (let n = 0; n < e.length; n++) {
			let s = e[n];
			if (this.options.extensions?.renderers?.[s.type]) {
				let o = s, i = this.options.extensions.renderers[o.type].call({ parser: this }, o);
				if (i !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"checkbox",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(o.type)) {
					t += i || "";
					continue;
				}
			}
			let r = s;
			switch (r.type) {
				case "space":
					t += this.renderer.space(r);
					break;
				case "hr":
					t += this.renderer.hr(r);
					break;
				case "heading":
					t += this.renderer.heading(r);
					break;
				case "code":
					t += this.renderer.code(r);
					break;
				case "table":
					t += this.renderer.table(r);
					break;
				case "blockquote":
					t += this.renderer.blockquote(r);
					break;
				case "list":
					t += this.renderer.list(r);
					break;
				case "checkbox":
					t += this.renderer.checkbox(r);
					break;
				case "html":
					t += this.renderer.html(r);
					break;
				case "def":
					t += this.renderer.def(r);
					break;
				case "paragraph":
					t += this.renderer.paragraph(r);
					break;
				case "text":
					t += this.renderer.text(r);
					break;
				default: {
					let o = "Token with \"" + r.type + "\" type was not found.";
					if (this.options.silent) return console.error(o), "";
					throw new Error(o);
				}
			}
		}
		return t;
	}
	parseInline(e, t = this.renderer) {
		this.renderer.parser = this;
		let n = "";
		for (let s = 0; s < e.length; s++) {
			let r = e[s];
			if (this.options.extensions?.renderers?.[r.type]) {
				let i = this.options.extensions.renderers[r.type].call({ parser: this }, r);
				if (i !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"checkbox",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(r.type)) {
					n += i || "";
					continue;
				}
			}
			let o = r;
			switch (o.type) {
				case "escape":
					n += t.text(o);
					break;
				case "html":
					n += t.html(o);
					break;
				case "link":
					n += t.link(o);
					break;
				case "image":
					n += t.image(o);
					break;
				case "checkbox":
					n += t.checkbox(o);
					break;
				case "strong":
					n += t.strong(o);
					break;
				case "em":
					n += t.em(o);
					break;
				case "codespan":
					n += t.codespan(o);
					break;
				case "br":
					n += t.br(o);
					break;
				case "del":
					n += t.del(o);
					break;
				case "text":
					n += t.text(o);
					break;
				default: {
					let i = "Token with \"" + o.type + "\" type was not found.";
					if (this.options.silent) return console.error(i), "";
					throw new Error(i);
				}
			}
		}
		return n;
	}
};
var _ = class {
	options;
	block;
	constructor(e) {
		this.options = e || y;
	}
	static passThroughHooks = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens",
		"emStrongMask"
	]);
	static passThroughHooksRespectAsync = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens"
	]);
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer(e = this.block) {
		return e ? R.lex : R.lexInline;
	}
	provideParser(e = this.block) {
		return e ? T.parse : T.parseInline;
	}
};
var F = class {
	defaults = I();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = T;
	Renderer = S;
	TextRenderer = z;
	Lexer = R;
	Tokenizer = P;
	Hooks = _;
	constructor(...e) {
		this.use(...e);
	}
	walkTokens(e, t) {
		let n = [];
		for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
			case "table": {
				let r = s;
				for (let o of r.header) n = n.concat(this.walkTokens(o.tokens, t));
				for (let o of r.rows) for (let i of o) n = n.concat(this.walkTokens(i.tokens, t));
				break;
			}
			case "list": {
				let r = s;
				n = n.concat(this.walkTokens(r.items, t));
				break;
			}
			default: {
				let r = s;
				this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((o) => {
					let i = r[o].flat(Infinity);
					n = n.concat(this.walkTokens(i, t));
				}) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
			}
		}
		return n;
	}
	use(...e) {
		let t = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((n) => {
			let s = { ...n };
			if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((r) => {
				if (!r.name) throw new Error("extension name required");
				if ("renderer" in r) {
					let o = t.renderers[r.name];
					o ? t.renderers[r.name] = function(...i) {
						let u = r.renderer.apply(this, i);
						return u === !1 && (u = o.apply(this, i)), u;
					} : t.renderers[r.name] = r.renderer;
				}
				if ("tokenizer" in r) {
					if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
					let o = t[r.level];
					o ? o.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
				}
				"childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
			}), s.extensions = t), n.renderer) {
				let r = this.defaults.renderer || new S(this.defaults);
				for (let o in n.renderer) {
					if (!(o in r)) throw new Error(`renderer '${o}' does not exist`);
					if (["options", "parser"].includes(o)) continue;
					let i = o, u = n.renderer[i], a = r[i];
					r[i] = (...p) => {
						let c = u.apply(r, p);
						return c === !1 && (c = a.apply(r, p)), c || "";
					};
				}
				s.renderer = r;
			}
			if (n.tokenizer) {
				let r = this.defaults.tokenizer || new P(this.defaults);
				for (let o in n.tokenizer) {
					if (!(o in r)) throw new Error(`tokenizer '${o}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(o)) continue;
					let i = o, u = n.tokenizer[i], a = r[i];
					r[i] = (...p) => {
						let c = u.apply(r, p);
						return c === !1 && (c = a.apply(r, p)), c;
					};
				}
				s.tokenizer = r;
			}
			if (n.hooks) {
				let r = this.defaults.hooks || new _();
				for (let o in n.hooks) {
					if (!(o in r)) throw new Error(`hook '${o}' does not exist`);
					if (["options", "block"].includes(o)) continue;
					let i = o, u = n.hooks[i], a = r[i];
					_.passThroughHooks.has(o) ? r[i] = (p) => {
						if (this.defaults.async && _.passThroughHooksRespectAsync.has(o)) return (async () => {
							let d = await u.call(r, p);
							return a.call(r, d);
						})();
						let c = u.call(r, p);
						return a.call(r, c);
					} : r[i] = (...p) => {
						if (this.defaults.async) return (async () => {
							let d = await u.apply(r, p);
							return d === !1 && (d = await a.apply(r, p)), d;
						})();
						let c = u.apply(r, p);
						return c === !1 && (c = a.apply(r, p)), c;
					};
				}
				s.hooks = r;
			}
			if (n.walkTokens) {
				let r = this.defaults.walkTokens, o = n.walkTokens;
				s.walkTokens = function(i) {
					let u = [];
					return u.push(o.call(this, i)), r && (u = u.concat(r.call(this, i))), u;
				};
			}
			this.defaults = {
				...this.defaults,
				...s
			};
		}), this;
	}
	setOptions(e) {
		return this.defaults = {
			...this.defaults,
			...e
		}, this;
	}
	lexer(e, t) {
		return R.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return T.parse(e, t ?? this.defaults);
	}
	parseMarkdown(e) {
		return (n, s) => {
			let r = { ...s }, o = {
				...this.defaults,
				...r
			}, i = this.onError(!!o.silent, !!o.async);
			if (this.defaults.async === !0 && r.async === !1) return i(/* @__PURE__ */ new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof n > "u" || n === null) return i(/* @__PURE__ */ new Error("marked(): input parameter is undefined or null"));
			if (typeof n != "string") return i(/* @__PURE__ */ new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
			if (o.hooks && (o.hooks.options = o, o.hooks.block = e), o.async) return (async () => {
				let u = o.hooks ? await o.hooks.preprocess(n) : n, p = await (o.hooks ? await o.hooks.provideLexer(e) : e ? R.lex : R.lexInline)(u, o), c = o.hooks ? await o.hooks.processAllTokens(p) : p;
				o.walkTokens && await Promise.all(this.walkTokens(c, o.walkTokens));
				let m = await (o.hooks ? await o.hooks.provideParser(e) : e ? T.parse : T.parseInline)(c, o);
				return o.hooks ? await o.hooks.postprocess(m) : m;
			})().catch(i);
			try {
				o.hooks && (n = o.hooks.preprocess(n));
				let a = (o.hooks ? o.hooks.provideLexer(e) : e ? R.lex : R.lexInline)(n, o);
				o.hooks && (a = o.hooks.processAllTokens(a)), o.walkTokens && this.walkTokens(a, o.walkTokens);
				let c = (o.hooks ? o.hooks.provideParser(e) : e ? T.parse : T.parseInline)(a, o);
				return o.hooks && (c = o.hooks.postprocess(c)), c;
			} catch (u) {
				return i(u);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
				let s = "<p>An error occurred:</p><pre>" + O(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(s) : s;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
};
var E = new F();
function k(l, e) {
	return E.parse(l, e);
}
k.options = k.setOptions = function(l) {
	return E.setOptions(l), k.defaults = E.defaults, W(k.defaults), k;
};
k.getDefaults = I;
k.defaults = y;
function Pt(...l) {
	return E.use(...l), k.defaults = E.defaults, W(k.defaults), k;
}
k.use = Pt;
k.walkTokens = function(l, e) {
	return E.walkTokens(l, e);
};
k.parseInline = E.parseInline;
k.Parser = T;
k.parser = T.parse;
k.Renderer = S;
k.TextRenderer = z;
k.Lexer = R;
k.lexer = R.lex;
k.Tokenizer = P;
k.Hooks = _;
k.parse = k;
k.options;
k.setOptions;
k.walkTokens;
k.parseInline;
T.parse;
R.lex;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/markdown.js
var sanitizeMarkdownHtml = sanitizeFileViewerRichHtml;
var purifierByDocument = /* @__PURE__ */ new WeakMap();
var getMarkdownPurifier = (documentRef) => {
	const cached = purifierByDocument.get(documentRef);
	if (cached) return cached;
	const windowRef = documentRef.defaultView;
	if (!windowRef) return null;
	const purifier = purify(windowRef);
	if (!purifier.isSupported) return null;
	purifierByDocument.set(documentRef, purifier);
	return purifier;
};
var hardenMarkdownLinks = (root) => {
	root.querySelectorAll("a[target]").forEach((anchor) => {
		if ((anchor.getAttribute("target") || "").trim().toLowerCase() === "_blank") anchor.rel = "noopener noreferrer";
	});
};
var markdownStyle = `
.markdown-viewer{min-height:100%;padding:28px 16px 48px;background:var(--file-viewer-render-surface-background,#eef1f4);overflow:auto;box-sizing:border-box}
.markdown-body{color-scheme:light;--bgColor-default:#fff;--bgColor-muted:#f6f8fa;--bgColor-neutral-muted:#818b981f;--borderColor-default:#d1d9e0;--borderColor-muted:#d1d9e0b3;--borderColor-neutral-muted:#d1d9e0b3;--fgColor-default:#1f2328;--fgColor-muted:#59636e;--fgColor-accent:#0969da;background:var(--bgColor-default);border:1px solid rgba(20,35,53,.1);border-radius:12px;margin:0 auto;box-sizing:border-box;min-width:200px;max-width:var(--markdown-max-width,980px);padding:var(--markdown-padding,45px);color:var(--fgColor-default);font-size:var(--markdown-font-size,16px);box-shadow:0 18px 42px rgba(15,23,42,.1)}
.markdown-body h1,.markdown-body h2,.markdown-body h3{margin-top:24px;margin-bottom:16px;font-weight:700;line-height:1.25}
.markdown-body h1{padding-bottom:.3em;border-bottom:1px solid var(--borderColor-muted);font-size:2em}
.markdown-body h2{padding-bottom:.3em;border-bottom:1px solid var(--borderColor-muted);font-size:1.5em}
.markdown-body p,.markdown-body ul,.markdown-body ol,.markdown-body blockquote,.markdown-body table,.markdown-body pre{margin-top:0;margin-bottom:16px}
.markdown-body a{color:var(--fgColor-accent);text-decoration:none}
.markdown-body a:hover{text-decoration:underline}
.markdown-body code{padding:.2em .4em;border-radius:6px;background:var(--bgColor-neutral-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:85%}
.markdown-body pre{padding:16px;overflow:auto;border-radius:8px;background:var(--bgColor-muted)}
.markdown-body pre code{padding:0;background:transparent;font-size:100%}
.markdown-body table{display:block;width:max-content;max-width:100%;overflow:auto;border-spacing:0;border-collapse:collapse}
.markdown-body th,.markdown-body td{padding:6px 13px;border:1px solid var(--borderColor-default)}
.markdown-body tr{background:var(--bgColor-default);border-top:1px solid var(--borderColor-muted)}
.markdown-body tr:nth-child(2n){background:var(--bgColor-muted)}
.markdown-body blockquote{padding:0 1em;color:var(--fgColor-muted);border-left:.25em solid var(--borderColor-default)}
.markdown-mermaid{display:flex;justify-content:center;width:100%;margin:0 0 16px;overflow:auto;border:1px solid var(--borderColor-muted);border-radius:10px;padding:16px;box-sizing:border-box;background:var(--bgColor-default)}
.markdown-mermaid svg{display:block;max-width:100%;height:auto;margin:auto}
.markdown-mermaid-error{margin:-8px 0 16px;color:#cf222e;font-size:.875em}
[data-viewer-theme='dark'] .markdown-mermaid-error{color:#ff7b72}
[data-viewer-theme='dark'] .markdown-viewer{background:var(--file-viewer-render-surface-background,#101820)}
[data-viewer-theme='dark'] .markdown-body{color-scheme:dark;--bgColor-default:#0d1117;--bgColor-muted:#151b23;--bgColor-neutral-muted:#656c7633;--borderColor-default:#3d444d;--borderColor-muted:#3d444db3;--borderColor-neutral-muted:#3d444db3;--fgColor-default:#f0f6fc;--fgColor-muted:#9198a1;--fgColor-accent:#4493f8;background:var(--bgColor-default);border-color:rgba(139,148,158,.26);color:var(--fgColor-default);box-shadow:0 24px 56px rgba(0,0,0,.38)}
@media (max-width:767px){.markdown-viewer{padding:14px 10px 28px}.markdown-body{padding:22px 18px;border-radius:10px}}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .markdown-viewer{background:var(--file-viewer-render-surface-background,#101820)}[data-viewer-theme='system'] .markdown-body{color-scheme:dark;--bgColor-default:#0d1117;--bgColor-muted:#151b23;--bgColor-neutral-muted:#656c7633;--borderColor-default:#3d444d;--borderColor-muted:#3d444db3;--borderColor-neutral-muted:#3d444db3;--fgColor-default:#f0f6fc;--fgColor-muted:#9198a1;--fgColor-accent:#4493f8;background:var(--bgColor-default);border-color:rgba(139,148,158,.26);color:var(--fgColor-default);box-shadow:0 24px 56px rgba(0,0,0,.38)}}
`;
var createStyle$1 = () => {
	const style = document.createElement("style");
	style.textContent = markdownStyle;
	return style;
};
var MARKDOWN_BASE_MAX_WIDTH = 980;
var MARKDOWN_BASE_PADDING = 45;
var MARKDOWN_BASE_FONT_SIZE = 16;
var MARKDOWN_MIN_SCALE = .6;
var MARKDOWN_MAX_SCALE = 2.4;
var clampZoom$1 = (value) => {
	return Math.min(MARKDOWN_MAX_SCALE, Math.max(MARKDOWN_MIN_SCALE, Number(value.toFixed(2))));
};
var applyMarkdownZoom = (host, zoom) => {
	host.style.setProperty("--markdown-max-width", `${MARKDOWN_BASE_MAX_WIDTH * zoom}px`);
	host.style.setProperty("--markdown-padding", `${MARKDOWN_BASE_PADDING * zoom}px`);
	host.style.setProperty("--markdown-font-size", `${MARKDOWN_BASE_FONT_SIZE * zoom}px`);
};
var readCssPixels = (value) => {
	const pixels = Number.parseFloat(value || "");
	return Number.isFinite(pixels) ? pixels : 0;
};
var readMarkdownViewport = (root, request) => {
	var _a;
	const viewportWidth = Math.max(1, request.viewportWidth || root.clientWidth || 0);
	const viewportHeight = Math.max(1, request.viewportHeight || root.clientHeight || 0);
	const view = root.ownerDocument.defaultView;
	const computed = (_a = view === null || view === void 0 ? void 0 : view.getComputedStyle) === null || _a === void 0 ? void 0 : _a.call(view, root);
	const mobile = viewportWidth <= 767;
	const horizontalPadding = computed ? readCssPixels(computed.paddingLeft) + readCssPixels(computed.paddingRight) : mobile ? 20 : 32;
	const verticalPadding = computed ? readCssPixels(computed.paddingTop) + readCssPixels(computed.paddingBottom) : mobile ? 42 : 76;
	return {
		width: Math.max(1, viewportWidth - horizontalPadding),
		height: Math.max(1, viewportHeight - verticalPadding)
	};
};
var mermaidRenderSequence = 0;
var mermaidRenderQueue = Promise.resolve();
var isDarkTheme = (documentRef, theme) => {
	var _a, _b;
	if (theme === "dark") return true;
	if (theme === "light") return false;
	return Boolean((_b = (_a = documentRef.defaultView) === null || _a === void 0 ? void 0 : _a.matchMedia) === null || _b === void 0 ? void 0 : _b.call(_a, "(prefers-color-scheme: dark)").matches);
};
var sanitizeMermaidSvg = (documentRef, svg) => {
	const purifier = getMarkdownPurifier(documentRef);
	if (!purifier) throw new Error("Unable to initialize the Mermaid SVG sanitizer.");
	const fragment = purifier.sanitize(svg, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: {
			html: true,
			svg: true,
			svgFilters: true
		},
		FORBID_TAGS: [
			"script",
			"iframe",
			"object",
			"embed",
			"form"
		],
		FORBID_ATTR: ["srcdoc"]
	});
	const root = fragment.querySelector("svg");
	if (!root) throw new Error("Unable to parse the Mermaid SVG.");
	sanitizeFileViewerSvgResources(fragment);
	return documentRef.importNode(root, true);
};
var renderMermaidSvg = async (documentRef, source, theme) => {
	const render = async () => {
		assertFileViewerMermaidSourceHasNoExternalResources(source);
		const loadMermaid = getFileViewerMermaidLoader();
		if (!loadMermaid) throw new Error("Mermaid support is opt-in. Run `npx file-viewer-cli add mermaid-markdown --write`, then `npx file-viewer-cli install --yes`.");
		const mermaid = (await loadMermaid()).default;
		const id = `file-viewer-markdown-mermaid-${Date.now()}-${mermaidRenderSequence += 1}`;
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: "strict",
			htmlLabels: false,
			theme: isDarkTheme(documentRef, theme) ? "dark" : "default"
		});
		return sanitizeMermaidSvg(documentRef, (await mermaid.render(id, source)).svg);
	};
	const result = mermaidRenderQueue.then(render, render);
	mermaidRenderQueue = result.then(() => void 0, () => void 0);
	return result;
};
var renderEmbeddedMermaid = async (article, theme) => {
	const documentRef = article.ownerDocument;
	const mermaidBlocks = Array.from(article.querySelectorAll("pre > code")).filter((code) => /(?:^|\s)(?:language|lang)-mermaid(?:\s|$)/i.test(code.className));
	for (const code of mermaidBlocks) {
		const pre = code.parentElement;
		if (!pre) continue;
		const source = code.textContent || "";
		try {
			const svg = await renderMermaidSvg(documentRef, source, theme);
			svg.classList.add("markdown-mermaid-svg");
			svg.setAttribute("role", "img");
			svg.setAttribute("aria-label", "Mermaid diagram preview");
			const shell = documentRef.createElement("div");
			shell.className = "markdown-mermaid";
			shell.dataset.markdownMermaid = "rendered";
			shell.appendChild(svg);
			pre.replaceWith(shell);
		} catch (error) {
			pre.classList.add("markdown-mermaid-source-error");
			const message = documentRef.createElement("p");
			message.className = "markdown-mermaid-error";
			message.setAttribute("role", "alert");
			message.textContent = error instanceof Error && error.message.includes("npx file-viewer-cli") ? error.message : "Mermaid diagram could not be rendered. The source is shown above.";
			pre.after(message);
			console.warn("[file-viewer] Unable to render embedded Mermaid diagram.", error);
		}
	}
};
var stripMarkdownFrontmatter = (text) => {
	const input = text.replace(/^\uFEFF/, "");
	if (!input.startsWith("---")) return input;
	const firstLineEnd = input.indexOf("\n");
	if ((firstLineEnd >= 0 ? input.slice(0, firstLineEnd).trim() : input.trim()) !== "---") return input;
	const closePattern = /\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/g;
	closePattern.lastIndex = firstLineEnd >= 0 ? firstLineEnd : 3;
	const match = closePattern.exec(input);
	if (!match) return input;
	return input.slice(match.index + match[0].length).replace(/^\r?\n/, "");
};
async function renderMarkdown(buffer, target, context) {
	var _a, _b, _c;
	const text = decodeFileViewerTextBuffer(buffer, (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.encoding).text;
	let zoom = 1;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = document.createElement("div");
	root.className = "markdown-viewer";
	root.dataset.viewerZoomProvider = "markdown";
	const article = document.createElement("article");
	article.className = "markdown-body";
	const renderedHtml = await k(stripMarkdownFrontmatter(text));
	article.append(sanitizeMarkdownHtml(article.ownerDocument, renderedHtml));
	hardenMarkdownLinks(article);
	applyMarkdownZoom(root, zoom);
	root.append(article);
	target.replaceChildren(createStyle$1(), root);
	await renderEmbeddedMermaid(article, (_c = context === null || context === void 0 ? void 0 : context.options) === null || _c === void 0 ? void 0 : _c.theme);
	const baseContentHeight = Math.max(article.scrollHeight || 0, article.offsetHeight || 0, 0);
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < MARKDOWN_MAX_SCALE,
		canZoomOut: zoom > MARKDOWN_MIN_SCALE,
		canReset: zoom !== 1,
		minScale: MARKDOWN_MIN_SCALE,
		maxScale: MARKDOWN_MAX_SCALE
	});
	const setZoom = (scale) => {
		zoom = clampZoom$1(scale);
		applyMarkdownZoom(root, zoom);
		zoomEmitter.emit();
		return getZoomState();
	};
	const fitMarkdown = (request) => {
		var _a, _b;
		const viewport = readMarkdownViewport(root, request);
		const minScale = (_a = request.minScale) !== null && _a !== void 0 ? _a : MARKDOWN_MIN_SCALE;
		const requestedMaxScale = (_b = request.maxScale) !== null && _b !== void 0 ? _b : MARKDOWN_MAX_SCALE;
		const maxScale = request.mode === "auto" && request.maxScale == null ? Math.max(minScale, Math.min(1, requestedMaxScale)) : requestedMaxScale;
		const scale = resolveFileViewerFitScale({
			mode: request.mode === "auto" ? "width" : request.mode,
			viewportWidth: viewport.width,
			viewportHeight: viewport.height,
			contentWidth: MARKDOWN_BASE_MAX_WIDTH,
			contentHeight: baseContentHeight || viewport.height,
			currentScale: zoom,
			minScale,
			maxScale
		});
		if (!scale) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "unmeasurable",
			provider: "zoom"
		};
		const state = setZoom(scale);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: state.scale,
			source: request.source,
			provider: "zoom"
		};
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		fit: fitMarkdown,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	return {
		$el: target,
		unmount() {
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/patch.js
var patchStyle = `
.patch-viewer{min-height:100%;--patch-bg:#f6f8fa;--patch-surface:#fff;--patch-border:rgba(31,35,40,.12);--patch-text:#24292f;--patch-muted:#57606a;--patch-add:#dafbe1;--patch-del:#ffebe9;--patch-info:#ddf4ff;--patch-font-size:13px;background:var(--patch-bg);color:var(--patch-text);box-sizing:border-box}
.patch-toolbar{position:sticky;top:0;z-index:2;display:flex;height:46px;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;border-bottom:1px solid var(--patch-border);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);box-sizing:border-box}
.patch-toolbar span,.patch-toolbar strong{color:var(--patch-muted);font-size:12px;font-weight:800;letter-spacing:0}
.patch-body{padding:16px;overflow:auto;font-size:var(--patch-font-size)}
.patch-body .d2h-wrapper{min-width:860px}
.patch-body .d2h-file-wrapper{margin:0 0 16px;overflow:hidden;border:1px solid var(--patch-border);border-radius:8px;background:var(--patch-surface)}
.patch-body .d2h-file-header{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--patch-border);background:#f8fafc;color:var(--patch-muted);font-weight:800}
.patch-body .d2h-file-name-wrapper{display:flex;min-width:0;align-items:center;gap:8px}
.patch-body .d2h-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.patch-body .d2h-files-diff{display:flex}
.patch-body .d2h-file-side-diff{flex:1 1 0;min-width:0;overflow-x:auto}
.patch-body .d2h-diff-table{width:100%;border-collapse:collapse;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:1em;line-height:1.58}
.patch-body .d2h-diff-table td{padding:0;vertical-align:top}
.patch-body td.d2h-code-side-linenumber,.patch-body td.d2h-code-linenumber{box-sizing:border-box;width:4.5em;min-width:4.5em;padding:0 8px;border-right:1px solid var(--patch-border);color:var(--patch-muted);text-align:right;white-space:nowrap;user-select:none}
/* Ignore template whitespace; only source spans preserve indentation. Long lines scroll without changing matched row heights. */
.patch-body .d2h-code-side-line,.patch-body .d2h-code-line{display:flex;min-height:1.58em;padding:0 10px;white-space:nowrap;word-break:normal;overflow-wrap:normal}
.patch-body .d2h-code-line-prefix{flex:0 0 1ch;white-space:pre;user-select:none}
.patch-body .d2h-code-line-ctn{display:block;flex:0 0 auto;white-space:pre}
.patch-body .d2h-emptyplaceholder{background:var(--patch-bg)}
.patch-body .d2h-ins{background:var(--patch-add)}
.patch-body .d2h-del{background:var(--patch-del)}
.patch-body .d2h-info{background:var(--patch-info);color:var(--patch-muted)}
.patch-body .d2h-file-list-wrapper{margin:0 0 16px;border:1px solid var(--patch-border);border-radius:8px;background:var(--patch-surface)}
.patch-body .d2h-file-list-header{padding:10px 12px;border-bottom:1px solid var(--patch-border);color:var(--patch-muted);font-weight:800}
.patch-body .d2h-file-list{margin:0;padding:8px 12px;list-style:none}
.patch-body .d2h-file-list-line{display:flex;gap:8px;padding:4px 0;color:var(--patch-text);font-size:.95em}
.patch-fallback{margin:0;padding:18px 20px;overflow:auto;border-radius:8px;background:#0d1117;color:#e6edf3;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:var(--patch-font-size);line-height:1.7;white-space:pre}
[data-viewer-theme='dark'] .patch-viewer{--patch-bg:#0d1117;--patch-surface:#161b22;--patch-border:rgba(139,148,158,.24);--patch-text:#e6edf3;--patch-muted:#8b949e;--patch-add:rgba(46,160,67,.26);--patch-del:rgba(248,81,73,.24);--patch-info:rgba(56,139,253,.18)}
[data-viewer-theme='dark'] .patch-toolbar{background:rgba(13,17,23,.92)}
[data-viewer-theme='dark'] .patch-body .d2h-file-header{background:#161b22}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .patch-viewer{--patch-bg:#0d1117;--patch-surface:#161b22;--patch-border:rgba(139,148,158,.24);--patch-text:#e6edf3;--patch-muted:#8b949e;--patch-add:rgba(46,160,67,.26);--patch-del:rgba(248,81,73,.24);--patch-info:rgba(56,139,253,.18)}[data-viewer-theme='system'] .patch-toolbar{background:rgba(13,17,23,.92)}[data-viewer-theme='system'] .patch-body .d2h-file-header{background:#161b22}}
`;
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = patchStyle;
	return style;
};
var clampZoom = (value) => {
	return Math.min(2.4, Math.max(.6, Number(value.toFixed(2))));
};
var countFiles = (text) => {
	var _a;
	const matches = text.match(/^diff --git\s+/gm);
	if (matches === null || matches === void 0 ? void 0 : matches.length) return matches.length;
	return ((_a = text.match(/^---\s+/gm)) === null || _a === void 0 ? void 0 : _a.length) || 1;
};
async function renderPatch(buffer, target, type = "patch", context) {
	var _a, _b;
	const documentRef = target.ownerDocument || document;
	const text = decodeFileViewerTextBuffer(buffer, (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.encoding).text;
	let zoom = 1;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = createElement(documentRef, "div", "patch-viewer");
	root.dataset.viewerZoomProvider = "patch";
	const toolbar = createElement(documentRef, "div", "patch-toolbar");
	toolbar.append(createElement(documentRef, "span", void 0, type.toUpperCase()), createElement(documentRef, "strong", void 0, `${countFiles(text)} files · side-by-side`));
	const body = createElement(documentRef, "div", "patch-body");
	try {
		const diffToHtml = getFileViewerDiffToHtml();
		if (!diffToHtml) throw new Error("Patch side-by-side rendering is opt-in. Run `npx file-viewer-cli add text-tools --write`, then `npx file-viewer-cli install --yes`.");
		const rendered = diffToHtml(text, {
			drawFileList: true,
			matching: "lines",
			outputFormat: "side-by-side",
			renderNothingWhenEmpty: false
		});
		body.replaceChildren(sanitizeFileViewerRichHtml(documentRef, rendered, { allowSvg: true }));
	} catch {
		const fallback = createElement(documentRef, "pre", "patch-fallback");
		fallback.textContent = text;
		body.replaceChildren(fallback);
	}
	root.append(toolbar, body);
	root.style.setProperty("--patch-font-size", `${13 * zoom}px`);
	target.replaceChildren(createStyle(documentRef), root);
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 2.4,
		canZoomOut: zoom > .6,
		canReset: zoom !== 1,
		minScale: .6,
		maxScale: 2.4
	});
	const setZoom = (scale) => {
		zoom = clampZoom(scale);
		root.style.setProperty("--patch-font-size", `${13 * zoom}px`);
		zoomEmitter.emit();
		return getZoomState();
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	return {
		$el: root,
		unmount() {
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
export { createHtmlPreviewDocument as a, renderText as c, renderLargeText as d, shouldVirtualizeMarkdownBuffer as f, stripMarkdownFrontmatter as i, DEFAULT_LARGE_TEXT_LINE_SEGMENT_BYTES as l, renderMarkdown as n, renderHtml as o, shouldVirtualizeTextBuffer as p, sanitizeMermaidSvg as r, renderGitBundle as s, renderPatch as t, DEFAULT_LARGE_TEXT_THRESHOLD_BYTES as u };
