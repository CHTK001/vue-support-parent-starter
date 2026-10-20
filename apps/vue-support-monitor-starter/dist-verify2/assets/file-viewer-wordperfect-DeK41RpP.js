import { Gu as resolveFileViewerWordPerfectWasmUrl, Ku as resolveFileViewerWordPerfectWorkerUrl } from "./file-viewer-3d-ijA7B-Qe.js";
import { x as parseWordPerfectDocument } from "./file-viewer-preset-all-CExGzNo-.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-wordperfect@3.1.2/node_modules/@file-viewer/renderer-wordperfect/dist/workerClient.js
var requestId = 0;
var parseWordPerfectWithWorker = (buffer, options, signal) => {
	var _a;
	if ((options === null || options === void 0 ? void 0 : options.useWorker) === false || typeof Worker === "undefined") return Promise.resolve(parseWordPerfectDocument(buffer));
	const workerUrl = resolveFileViewerWordPerfectWorkerUrl(options, typeof document === "undefined" ? void 0 : document.baseURI);
	const wasmUrl = resolveFileViewerWordPerfectWasmUrl(options, typeof document === "undefined" ? void 0 : document.baseURI);
	const worker = new Worker(workerUrl, {
		type: "module",
		name: "file-viewer-wordperfect"
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
		const onAbort = () => finish(() => reject(new DOMException("WordPerfect parsing was aborted.", "AbortError")));
		const timer = setTimeout(() => finish(() => reject(/* @__PURE__ */ new Error(`WordPerfect parsing exceeded ${timeoutMs}ms.`))), timeoutMs);
		worker.addEventListener("message", (event) => {
			if (event.data.id !== id) return;
			finish(() => event.data.ok && event.data.document ? resolve(event.data.document) : reject(new Error(event.data.error || "WordPerfect Worker failed.")));
		});
		worker.addEventListener("error", (event) => finish(() => reject(new Error(event.message || "WordPerfect Worker failed to load."))));
		signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return onAbort();
		const transferable = buffer.slice(0);
		worker.postMessage({
			id,
			buffer: transferable,
			wasmUrl
		}, [transferable]);
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-wordperfect@3.1.2/node_modules/@file-viewer/renderer-wordperfect/dist/wordperfect.js
var styleText = `
.wpd-viewer{width:100%;height:100%;overflow:auto;padding:28px;background:var(--file-viewer-render-surface-background,#dfe5eb);box-sizing:border-box;color:#1f2937}.wpd-page{width:min(100%,880px);min-height:1040px;margin:0 auto;padding:56px 64px;background:#fff;box-shadow:0 16px 38px rgba(15,23,42,.12);box-sizing:border-box;font:16px/1.85 Georgia,'Times New Roman',serif}.wpd-page p,.wpd-page h1,.wpd-page h2,.wpd-page h3,.wpd-page h4,.wpd-page h5,.wpd-page h6{margin:0 0 13px;white-space:pre-wrap}.wpd-page h1{font-size:1.65em}.wpd-page h2{font-size:1.4em}.wpd-page h3{font-size:1.2em}.wpd-page a{color:#2563eb}.wpd-table{width:100%;margin:18px 0;border-collapse:collapse}.wpd-table td{padding:7px 9px;border:1px solid #94a3b8;vertical-align:top}.wpd-running{margin:0 0 24px;padding:0 0 12px;border-bottom:1px solid #cbd5e1;color:#475569;font-size:.85em}.wpd-footer{margin-top:28px;padding-top:12px;border-top:1px solid #cbd5e1}.wpd-notes{margin-top:28px;padding:16px;background:#f8fafc;border-left:4px solid #94a3b8;font-size:.9em}
[data-viewer-theme='dark'] .wpd-viewer{background:var(--file-viewer-render-surface-background,#0d1117)}.wpd-page{color-scheme:light}
@media(max-width:720px){.wpd-viewer{padding:10px}.wpd-page{min-height:0;padding:34px 24px}}
`;
var appendParagraph = (parent, paragraph) => {
	const level = Math.min(6, Math.max(1, paragraph.level || 1));
	const element = document.createElement(paragraph.kind === "heading" ? `h${level}` : "p");
	if (paragraph.list) {
		const marker = paragraph.list.ordered ? `${paragraph.list.counter}. ` : "• ";
		element.append(document.createTextNode(`${"  ".repeat(Math.max(0, paragraph.list.level - 1))}${marker}`));
	}
	paragraph.runs.forEach((run) => {
		let node = document.createElement("span");
		node.textContent = run.text;
		const styles = new Set(run.styles);
		if (styles.has("bold")) node.style.fontWeight = "700";
		if (styles.has("italic")) node.style.fontStyle = "italic";
		const decorations = [styles.has("underline") ? "underline" : "", styles.has("strikethrough") ? "line-through" : ""].filter(Boolean);
		if (decorations.length) node.style.textDecoration = decorations.join(" ");
		if (styles.has("superscript")) node.style.verticalAlign = "super";
		if (styles.has("subscript")) node.style.verticalAlign = "sub";
		if (run.href) {
			const link = document.createElement("a");
			link.href = run.href;
			link.rel = "noopener noreferrer";
			link.target = "_blank";
			link.appendChild(node);
			node = link;
		}
		element.appendChild(node);
	});
	parent.appendChild(element);
};
var appendTable = (parent, table) => {
	const element = document.createElement("table");
	element.className = "wpd-table";
	table.rows.forEach((row) => {
		const tr = document.createElement("tr");
		row.filter((cell) => !cell.covered).forEach((cell) => {
			const td = document.createElement("td");
			td.textContent = cell.text;
			td.colSpan = Math.max(1, cell.colSpan);
			td.rowSpan = Math.max(1, cell.rowSpan);
			tr.appendChild(td);
		});
		element.appendChild(tr);
	});
	parent.appendChild(element);
};
async function renderWordPerfect(buffer, target, _type, context) {
	var _a, _b;
	const model = await parseWordPerfectWithWorker(buffer.slice(0), (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.wordPerfect, context === null || context === void 0 ? void 0 : context.signal);
	const style = document.createElement("style");
	style.textContent = styleText;
	const root = document.createElement("div");
	root.className = "wpd-viewer";
	const page = document.createElement("article");
	page.className = "wpd-page";
	page.dataset.viewerAnchorId = "wordperfect-body";
	if (model.headers.length) {
		const header = document.createElement("header");
		header.className = "wpd-running";
		model.headers.forEach((paragraph) => appendParagraph(header, paragraph));
		page.appendChild(header);
	}
	model.structuredParagraphs.forEach((paragraph) => appendParagraph(page, paragraph));
	model.tables.forEach((table) => appendTable(page, table));
	if (model.notes.length) {
		const notes = document.createElement("aside");
		notes.className = "wpd-notes";
		model.notes.forEach((paragraph) => appendParagraph(notes, paragraph));
		page.appendChild(notes);
	}
	if (model.footers.length) {
		const footer = document.createElement("footer");
		footer.className = "wpd-running wpd-footer";
		model.footers.forEach((paragraph) => appendParagraph(footer, paragraph));
		page.appendChild(footer);
	}
	root.appendChild(page);
	target.replaceChildren(style, root);
	(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, { getTarget: () => page });
	return {
		$el: target,
		unmount() {
			var _a;
			(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderWordPerfect as t };
