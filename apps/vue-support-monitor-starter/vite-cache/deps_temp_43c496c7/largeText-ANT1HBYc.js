import "./dist-B6GcL3C6.js";
import { r as resolveFileViewerTextEncoding, t as createFileViewerTextDecoder } from "./textEncoding-M25CFHsg.js";
import { C as createEmptyFileViewerSearchState, T as normalizeFileViewerSearchOptions, _ as unregisterFileViewerZoomProvider, f as registerFileViewerSearchProvider, h as unregisterFileViewerSearchProvider, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter } from "./fit-BmeG0j2O.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
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
var clampZoom = (value) => {
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
		zoom = clampZoom(scale);
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
export { shouldVirtualizeTextBuffer as a, shouldVirtualizeMarkdownBuffer as i, DEFAULT_LARGE_TEXT_THRESHOLD_BYTES as n, codeStyle as o, renderLargeText as r, DEFAULT_LARGE_TEXT_LINE_SEGMENT_BYTES as t };
