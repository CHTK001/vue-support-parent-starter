import { tn as resolveFileViewerHangulWorkerUrl } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-hangul@3.1.2/node_modules/@file-viewer/renderer-hangul/dist/workerClient.js
var requestId = 0;
var parseLimits = (options) => ({
	maxUncompressedBytes: options === null || options === void 0 ? void 0 : options.maxUncompressedBytes,
	maxCompressionRatio: options === null || options === void 0 ? void 0 : options.maxCompressionRatio,
	maxEntries: options === null || options === void 0 ? void 0 : options.maxEntries,
	maxRecords: options === null || options === void 0 ? void 0 : options.maxRecords
});
var parseHangulWithWorker = async (buffer, type, options, signal) => {
	var _a;
	const limits = Object.fromEntries(Object.entries(parseLimits(options)).filter(([, value]) => value != null));
	if ((options === null || options === void 0 ? void 0 : options.useWorker) === false || typeof Worker === "undefined") {
		const { parseHangulDocument } = await import("./hangul.parser-D7V5c88z.js");
		return parseHangulDocument(buffer, type, void 0, limits);
	}
	const workerUrl = resolveFileViewerHangulWorkerUrl(options, typeof document === "undefined" ? void 0 : document.baseURI);
	const worker = new Worker(workerUrl, {
		type: "module",
		name: "file-viewer-hangul"
	});
	const id = ++requestId;
	const timeoutMs = Math.max(1e3, (_a = options === null || options === void 0 ? void 0 : options.workerTimeoutMs) !== null && _a !== void 0 ? _a : 6e4);
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (callback) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
			worker.terminate();
			callback();
		};
		const onAbort = () => finish(() => reject(new DOMException("Hangul parsing was aborted.", "AbortError")));
		const timer = setTimeout(() => finish(() => reject(/* @__PURE__ */ new Error(`Hangul parsing exceeded ${timeoutMs}ms.`))), timeoutMs);
		worker.addEventListener("message", (event) => {
			if (event.data.id !== id) return;
			finish(() => event.data.ok && event.data.document ? resolve(event.data.document) : reject(new Error(event.data.error || "Hangul Worker failed.")));
		});
		worker.addEventListener("error", (event) => finish(() => reject(new Error(event.message || "Hangul Worker failed to load."))));
		signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
			onAbort();
			return;
		}
		const transferable = buffer.slice(0);
		worker.postMessage({
			id,
			buffer: transferable,
			type,
			limits
		}, [transferable]);
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-hangul@3.1.2/node_modules/@file-viewer/renderer-hangul/dist/hangul.js
var styleText = `
.hangul-viewer{width:100%;height:100%;overflow:auto;padding:28px;background:var(--file-viewer-render-surface-background,#e6eaf0);box-sizing:border-box;color:#172033;font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif}.hangul-shell{width:min(100%,920px);margin:0 auto}.hangul-page{position:relative;width:min(100%,793.7067px);min-height:1122.5067px;margin:0 auto 20px;padding:75.5733px 113.3867px 56.6933px;background:#fff;box-shadow:0 16px 38px rgba(15,23,42,.12);box-sizing:border-box;overflow:hidden;color-scheme:light}.hangul-page p{margin:0 0 12px;font-size:13.333px;line-height:1.6;white-space:pre-wrap}.hangul-header,.hangul-footer{position:relative;z-index:2;font-size:12px;color:#64748b;white-space:pre-wrap}.hangul-header{margin-bottom:24px;padding-bottom:10px;border-bottom:1px solid #e2e8f0}.hangul-footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0}.hangul-notes{position:relative;z-index:2;margin-top:18px;padding-top:12px;border-top:1px dashed #cbd5e1;font-size:12px;color:#475569}.hangul-structured-html{position:relative;z-index:2;overflow-wrap:anywhere}.hangul-table{position:relative;z-index:2;max-width:100%;margin:18px 0;border-collapse:collapse;background:#fff}.hangul-table td{box-sizing:border-box;padding:6px 8px;border:1px solid #94a3b8;vertical-align:middle;white-space:pre-wrap;overflow-wrap:anywhere}.hangul-page-media{display:block;position:relative;z-index:1;max-width:100%;height:auto;margin:20px auto;object-fit:contain}.hangul-page-media--positioned{position:absolute;margin:0}
[data-viewer-theme='dark'] .hangul-viewer{background:var(--file-viewer-render-surface-background,#0d1117)}
@media(max-width:720px){.hangul-viewer{padding:10px}.hangul-page{min-height:0!important;padding:30px 22px!important}.hangul-page-media--positioned{position:relative!important;left:auto!important;top:auto!important;width:auto!important;height:auto!important;margin:20px auto}}
`;
var mediaLookupKey = (value) => value.replace(/\\/g, "/").split("/").pop().replace(/\.[^.]+$/, "").toLowerCase();
async function renderHangul(buffer, target, type, context) {
	var _a, _b;
	const documentModel = await parseHangulWithWorker(buffer.slice(0), type, (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.hangul, context === null || context === void 0 ? void 0 : context.signal);
	const objectUrls = [];
	const mediaUrls = /* @__PURE__ */ new Map();
	const resolveMedia = (mediaId) => documentModel.media.find((media) => media.id.toLowerCase() === mediaId.toLowerCase() || mediaLookupKey(media.id) === mediaLookupKey(mediaId));
	const mediaUrl = (media) => {
		const existing = mediaUrls.get(media);
		if (existing) return existing;
		const copy = new Uint8Array(media.bytes.length);
		copy.set(media.bytes);
		const url = URL.createObjectURL(new Blob([copy], { type: media.mimeType }));
		mediaUrls.set(media, url);
		objectUrls.push(url);
		return url;
	};
	const usedMedia = /* @__PURE__ */ new Set();
	const appendMedia = (page, placement, media) => {
		const image = document.createElement("img");
		image.className = "hangul-page-media";
		image.src = mediaUrl(media);
		image.alt = placement.alt || "";
		if (placement.widthPx) image.style.width = `${placement.widthPx}px`;
		if (placement.heightPx) image.style.height = `${placement.heightPx}px`;
		if (placement.position === "page" && placement.xPx != null && placement.yPx != null) {
			image.classList.add("hangul-page-media--positioned");
			image.style.left = `${placement.xPx}px`;
			image.style.top = `${placement.yPx}px`;
		}
		page.appendChild(image);
		usedMedia.add(media);
	};
	const style = document.createElement("style");
	style.textContent = styleText;
	const root = document.createElement("div");
	root.className = "hangul-viewer";
	const shell = document.createElement("div");
	shell.className = "hangul-shell";
	documentModel.sections.forEach((section, index) => {
		var _a, _b, _c, _d;
		const page = document.createElement("article");
		page.className = "hangul-page";
		page.dataset.viewerAnchorId = section.id;
		page.dataset.pageIndex = String(index);
		if (section.page) {
			page.style.width = `${section.page.widthPx}px`;
			page.style.minHeight = `${section.page.heightPx}px`;
			page.style.maxWidth = "100%";
			if (section.page.margins) page.style.padding = `${section.page.margins.topPx}px ${section.page.margins.rightPx}px ${section.page.margins.bottomPx}px ${section.page.margins.leftPx}px`;
		}
		if ((_a = section.headers) === null || _a === void 0 ? void 0 : _a.length) {
			const header = document.createElement("header");
			header.className = "hangul-header";
			header.textContent = section.headers.join("\n");
			page.appendChild(header);
		}
		if (section.html) {
			const structured = document.createElement("div");
			structured.className = "hangul-structured-html";
			structured.innerHTML = section.html;
			structured.querySelectorAll("script,iframe,object,embed,link,meta,style").forEach((node) => node.remove());
			structured.querySelectorAll("*").forEach((node) => {
				var _a;
				Array.from(node.attributes).filter((attribute) => attribute.name.startsWith("on")).forEach((attribute) => node.removeAttribute(attribute.name));
				for (const attributeName of [
					"href",
					"src",
					"xlink:href",
					"formaction"
				]) {
					const value = ((_a = node.getAttribute(attributeName)) === null || _a === void 0 ? void 0 : _a.trim()) || "";
					if (value && !/^(?:https?:|blob:|#|\/)/i.test(value)) node.removeAttribute(attributeName);
				}
			});
			page.appendChild(structured);
		} else section.paragraphs.forEach((value) => {
			const paragraph = document.createElement("p");
			paragraph.textContent = value;
			page.appendChild(paragraph);
		});
		section.tables.forEach((table) => {
			const element = document.createElement("table");
			element.className = "hangul-table";
			if (table.widthPx) {
				element.style.width = `${table.widthPx}px`;
				element.style.tableLayout = "fixed";
			} else element.style.width = "100%";
			(table.cells || table.rows.map((row) => row.map((value) => ({ text: value })))).forEach((row) => {
				const tr = document.createElement("tr");
				row.forEach((value) => {
					const cell = document.createElement("td");
					cell.textContent = value.text;
					if (value.colSpan && value.colSpan > 1) cell.colSpan = value.colSpan;
					if (value.rowSpan && value.rowSpan > 1) cell.rowSpan = value.rowSpan;
					if (value.widthPx) cell.style.width = `${value.widthPx}px`;
					if (value.heightPx) cell.style.height = `${value.heightPx}px`;
					if (value.padding) cell.style.padding = `${value.padding.topPx}px ${value.padding.rightPx}px ${value.padding.bottomPx}px ${value.padding.leftPx}px`;
					tr.appendChild(cell);
				});
				element.appendChild(tr);
			});
			page.appendChild(element);
		});
		(_b = section.placedMedia) === null || _b === void 0 || _b.forEach((placement) => {
			const media = resolveMedia(placement.mediaId);
			if (media === null || media === void 0 ? void 0 : media.mimeType.startsWith("image/")) appendMedia(page, placement, media);
		});
		if ((_c = section.notes) === null || _c === void 0 ? void 0 : _c.length) {
			const notes = document.createElement("aside");
			notes.className = "hangul-notes";
			notes.textContent = section.notes.join("\n");
			page.appendChild(notes);
		}
		if ((_d = section.footers) === null || _d === void 0 ? void 0 : _d.length) {
			const footer = document.createElement("footer");
			footer.className = "hangul-footer";
			footer.textContent = section.footers.join("\n");
			page.appendChild(footer);
		}
		shell.appendChild(page);
	});
	const fallbackPage = shell.querySelector(".hangul-page");
	documentModel.media.filter((media) => media.mimeType.startsWith("image/") && !usedMedia.has(media)).forEach((media) => {
		if (fallbackPage) appendMedia(fallbackPage, {
			mediaId: media.id,
			position: "flow"
		}, media);
	});
	root.appendChild(shell);
	target.replaceChildren(style, root);
	(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, { getTarget: () => shell.querySelector(".hangul-page") || shell });
	return {
		$el: target,
		unmount() {
			var _a;
			(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
			objectUrls.forEach((url) => URL.revokeObjectURL(url));
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderHangul as default };
