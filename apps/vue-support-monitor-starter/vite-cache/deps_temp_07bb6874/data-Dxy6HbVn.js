import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { Yt as resolveFileViewerDataSqlWasmUrl, dn as resolveFileViewerRuntimeAssetBaseUrl } from "./dist-B6GcL3C6.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-data@3.1.2/node_modules/@file-viewer/renderer-data/dist/data.js
var dataStyle = `
.data-viewer{min-height:100%;padding:28px;background:#eef1f4;color:#132235}
.data-card{max-width:1080px;margin:0 auto;overflow:hidden;border:1px solid rgba(15,23,42,.08);border-radius:8px;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.12)}
.data-header{padding:20px 24px;border-bottom:1px solid rgba(15,23,42,.08)}
.data-header span{color:#0f766e;font-size:12px;font-weight:800}
.data-header h2{margin:6px 0 0;font-size:24px}
.data-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;background:rgba(15,23,42,.08)}
.data-summary div{min-width:0;padding:15px 18px;background:#f8fafc}
.data-summary span{display:block;color:#64748b;font-size:12px}
.data-summary strong{display:block;margin-top:5px;overflow:hidden;color:#132235;font-size:15px;text-overflow:ellipsis;white-space:nowrap}
.font-preview{padding:34px 28px;border-top:1px solid rgba(15,23,42,.08);font-size:42px;line-height:1.45;word-break:break-word}
.asset-image{padding:24px;border-top:1px solid rgba(15,23,42,.08);background:#f8fafc;text-align:center}
.asset-image img{max-width:100%;max-height:70vh;box-shadow:0 10px 30px rgba(15,23,42,.16)}
.asset-text{margin:0;padding:18px 24px;overflow:auto;border-top:1px solid rgba(15,23,42,.08);background:#111827;color:#e5e7eb;font-size:13px;line-height:1.7}
.data-table-wrap{max-height:520px;overflow:auto;border-top:1px solid rgba(15,23,42,.08)}
.data-table{width:100%;border-collapse:collapse;font-size:13px}
.data-table th,.data-table td{max-width:260px;padding:10px 12px;border-bottom:1px solid rgba(15,23,42,.08);overflow:hidden;text-align:left;text-overflow:ellipsis;white-space:nowrap}
.data-table th{position:sticky;top:0;background:#f8fafc;color:#64748b;z-index:1}
[data-viewer-theme='dark'] .data-viewer{background:#101820;color:#e5eef8}
[data-viewer-theme='dark'] .data-card{border-color:rgba(148,163,184,.18);background:#111827;box-shadow:0 22px 56px rgba(0,0,0,.32)}
[data-viewer-theme='dark'] .data-header,[data-viewer-theme='dark'] .font-preview,[data-viewer-theme='dark'] .asset-image,[data-viewer-theme='dark'] .data-table-wrap{border-color:rgba(148,163,184,.18)}
[data-viewer-theme='dark'] .data-header h2,[data-viewer-theme='dark'] .data-summary strong,[data-viewer-theme='dark'] .data-table{color:#f8fafc}
[data-viewer-theme='dark'] .data-summary,[data-viewer-theme='dark'] .data-table th,[data-viewer-theme='dark'] .data-table td{border-color:rgba(148,163,184,.18)}
[data-viewer-theme='dark'] .data-summary div,[data-viewer-theme='dark'] .data-table th{background:#151f2b}
[data-viewer-theme='dark'] .data-summary span,[data-viewer-theme='dark'] .data-table th{color:#94a3b8}
[data-viewer-theme='dark'] .asset-image{background:#151f2b}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .data-viewer{background:#101820;color:#e5eef8}[data-viewer-theme='system'] .data-card{border-color:rgba(148,163,184,.18);background:#111827;box-shadow:0 22px 56px rgba(0,0,0,.32)}[data-viewer-theme='system'] .data-header,[data-viewer-theme='system'] .font-preview,[data-viewer-theme='system'] .asset-image,[data-viewer-theme='system'] .data-table-wrap{border-color:rgba(148,163,184,.18)}[data-viewer-theme='system'] .data-header h2,[data-viewer-theme='system'] .data-summary strong,[data-viewer-theme='system'] .data-table{color:#f8fafc}[data-viewer-theme='system'] .data-summary,[data-viewer-theme='system'] .data-table th,[data-viewer-theme='system'] .data-table td{border-color:rgba(148,163,184,.18)}[data-viewer-theme='system'] .data-summary div,[data-viewer-theme='system'] .data-table th{background:#151f2b}[data-viewer-theme='system'] .data-summary span,[data-viewer-theme='system'] .data-table th{color:#94a3b8}[data-viewer-theme='system'] .asset-image{background:#151f2b}}
`;
var fontMimeMap = {
	otf: "font/otf",
	ttf: "font/ttf",
	woff: "font/woff",
	woff2: "font/woff2"
};
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = dataStyle;
	return style;
};
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var formatBytes = (value) => {
	if (value < 1024) return `${value} B`;
	if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
	return `${(value / 1024 / 1024).toFixed(1)} MB`;
};
var makeRows = (rows) => {
	return rows.slice(0, 30).map((row) => {
		const next = {};
		Object.entries(row).slice(0, 24).forEach(([key, value]) => {
			if (typeof value === "bigint") next[key] = value.toString();
			else if (value instanceof Uint8Array) next[key] = `[bytes:${value.byteLength}]`;
			else if (value && typeof value === "object") next[key] = JSON.stringify(value).slice(0, 180);
			else next[key] = value;
		});
		return next;
	});
};
var extractReadableText = (buffer, max = 8e3) => {
	const bytes = new Uint8Array(buffer);
	return Array.from(bytes.slice(0, Math.min(bytes.length, max))).map((byte) => byte >= 32 && byte <= 126 || byte === 10 || byte === 13 || byte === 9 ? String.fromCharCode(byte) : " ").join("").replace(/[ \t]{3,}/g, " ").trim().slice(0, max);
};
var readMagic = (buffer, length = 12) => {
	return String.fromCharCode(...new Uint8Array(buffer.slice(0, length)));
};
var getWindowSqlWasmOverride = (documentRef) => {
	return documentRef.defaultView?.__FLYFISH_DATA_SQL_WASM_URL__ || (typeof window !== "undefined" ? window.__FLYFISH_DATA_SQL_WASM_URL__ : void 0);
};
var renderFont = async (documentRef, buffer, type, t) => {
	const family = `FlyfishPreviewFont-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const FontFaceConstructor = (documentRef.defaultView || (typeof window !== "undefined" ? window : void 0))?.FontFace || (typeof FontFace !== "undefined" ? FontFace : void 0);
	if (!FontFaceConstructor) throw new Error(t("data.error.fontFaceUnsupported"));
	const face = new FontFaceConstructor(family, buffer);
	await face.load();
	documentRef.fonts?.add(face);
	return {
		title: t("data.title.font"),
		fontFamily: family,
		summary: [
			{
				label: t("data.label.format"),
				value: type.toUpperCase()
			},
			{
				label: t("data.label.size"),
				value: formatBytes(buffer.byteLength)
			},
			{
				label: t("data.label.rendering"),
				value: "Browser FontFace API"
			}
		]
	};
};
var renderSqlite = async (documentRef, buffer, context, t) => {
	const { default: initSqlJs } = await import("./sql-wasm-browser-Do-9ZWAu.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
	const sqlWasmUrl = resolveFileViewerDataSqlWasmUrl(context?.options?.data, [getWindowSqlWasmOverride(documentRef)], resolveFileViewerRuntimeAssetBaseUrl(documentRef));
	const db = new (await (initSqlJs({ locateFile: () => sqlWasmUrl }))).Database(new Uint8Array(buffer));
	try {
		const tables = db.exec("select name, type from sqlite_master where type in ('table','view') and name not like 'sqlite_%' order by type, name")[0]?.values || [];
		const firstTable = String(tables[0]?.[0] || "");
		const rows = firstTable ? db.exec(`select * from "${firstTable.replace(/"/g, "\"\"")}" limit 30`)[0] : null;
		return {
			title: t("data.title.sqlite"),
			summary: [
				{
					label: t("data.label.objects"),
					value: String(tables.length)
				},
				{
					label: t("data.label.sampleTable"),
					value: firstTable || "-"
				},
				{
					label: t("data.label.rendering"),
					value: "sql.js WASM"
				}
			],
			rows: rows ? makeRows(rows.values.map((values) => Object.fromEntries(rows.columns.map((column, index) => [column, values[index]])))) : makeRows(tables.map((value) => ({
				name: value[0],
				type: value[1]
			})))
		};
	} finally {
		db.close();
	}
};
var renderParquet = async (buffer, t) => {
	const { parquetMetadataAsync, parquetReadObjects } = await import("./src-DGb2T8n7.js");
	const file = {
		byteLength: buffer.byteLength,
		slice: (start, end) => buffer.slice(start, end)
	};
	const metadata = await parquetMetadataAsync(file);
	const rows = await parquetReadObjects({
		file,
		rowFormat: "object",
		rowEnd: 30
	});
	return {
		title: t("data.title.parquet"),
		summary: [
			{
				label: t("data.label.rows"),
				value: metadata.num_rows?.toString?.() || "-"
			},
			{
				label: t("data.label.columns"),
				value: String(metadata.schema?.filter((item) => item.name).length || 0)
			},
			{
				label: t("data.label.rendering"),
				value: "hyparquet"
			}
		],
		rows: makeRows(rows)
	};
};
var renderAvro = async (buffer, t) => {
	const imported = await import("./avsc-BSImGlSA.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
	const decoder = (imported.default || imported).createBlobDecoder(new Blob([buffer]));
	const rows = [];
	let schema = "";
	await new Promise((resolve, reject) => {
		decoder.on("metadata", (type) => {
			schema = type?.toString?.() || "";
		});
		decoder.on("data", (value) => {
			if (rows.length < 30) rows.push(value);
		});
		decoder.on("end", resolve);
		decoder.on("error", reject);
	});
	return {
		title: t("data.title.avro"),
		summary: [
			{
				label: t("data.label.sampleRows"),
				value: String(rows.length)
			},
			{
				label: "Schema",
				value: schema ? t("data.value.schemaRead") : t("data.value.schemaUnread")
			},
			{
				label: t("data.label.rendering"),
				value: "avsc"
			}
		],
		rows: makeRows(rows),
		text: schema.slice(0, 6e3)
	};
};
var renderWasm = async (buffer, t) => {
	const module = await WebAssembly.compile(buffer.slice(0));
	const imports = WebAssembly.Module.imports(module);
	const exports = WebAssembly.Module.exports(module);
	return {
		title: t("data.title.wasm"),
		summary: [
			{
				label: t("data.label.imports"),
				value: String(imports.length)
			},
			{
				label: t("data.label.exports"),
				value: String(exports.length)
			},
			{
				label: t("data.label.rendering"),
				value: "WebAssembly.Module"
			}
		],
		rows: makeRows([...imports.map((item) => ({
			kind: "import",
			module: item.module,
			name: item.name,
			type: item.kind
		})), ...exports.map((item) => ({
			kind: "export",
			module: "-",
			name: item.name,
			type: item.kind
		}))])
	};
};
var renderPostScriptLike = async (buffer, type, t) => ({
	title: type === "eps" ? t("data.title.eps") : t("data.title.ai"),
	summary: [
		{
			label: t("data.label.magic"),
			value: readMagic(buffer).replace(/\s/g, " ")
		},
		{
			label: t("data.label.size"),
			value: formatBytes(buffer.byteLength)
		},
		{
			label: t("data.label.note"),
			value: type === "ai" ? t("data.note.aiSummary") : t("data.note.postscriptSummary")
		}
	],
	text: extractReadableText(buffer)
});
var renderWebArchive = async (buffer, t) => ({
	title: t("data.title.webarchive"),
	summary: [
		{
			label: t("data.label.container"),
			value: readMagic(buffer).startsWith("bplist") ? "Binary plist" : "WebArchive"
		},
		{
			label: t("data.label.size"),
			value: formatBytes(buffer.byteLength)
		},
		{
			label: t("data.label.note"),
			value: t("data.note.webarchive")
		}
	],
	text: extractReadableText(buffer)
});
var buildPreview = async (documentRef, buffer, type, context, t) => {
	if (type in fontMimeMap) return renderFont(documentRef, buffer, type, t);
	if (type === "sqlite") return renderSqlite(documentRef, buffer, context, t);
	if (type === "parquet") return renderParquet(buffer, t);
	if (type === "avro") return renderAvro(buffer, t);
	if (type === "wasm") return renderWasm(buffer, t);
	if (type === "ai" || type === "eps") return renderPostScriptLike(buffer, type, t);
	if (type === "webarchive") return renderWebArchive(buffer, t);
	return {
		title: t("data.title.summary"),
		summary: [{
			label: t("data.label.format"),
			value: type.toUpperCase()
		}, {
			label: t("data.label.size"),
			value: formatBytes(buffer.byteLength)
		}],
		text: extractReadableText(buffer)
	};
};
var appendSummary = (documentRef, parent, summary) => {
	const summaryRoot = createElement(documentRef, "div", "data-summary");
	summary.forEach((item) => {
		const cell = createElement(documentRef, "div");
		cell.append(createElement(documentRef, "span", void 0, item.label), createElement(documentRef, "strong", void 0, item.value));
		summaryRoot.appendChild(cell);
	});
	parent.appendChild(summaryRoot);
};
var appendRows = (documentRef, parent, rows) => {
	if (!rows?.length) return;
	const keys = Object.keys(rows[0]);
	const wrap = createElement(documentRef, "div", "data-table-wrap");
	const table = createElement(documentRef, "table", "data-table");
	const thead = createElement(documentRef, "thead");
	const headRow = createElement(documentRef, "tr");
	keys.forEach((key) => {
		headRow.appendChild(createElement(documentRef, "th", void 0, key));
	});
	thead.appendChild(headRow);
	const tbody = createElement(documentRef, "tbody");
	rows.forEach((row) => {
		const tr = createElement(documentRef, "tr");
		keys.forEach((key) => {
			tr.appendChild(createElement(documentRef, "td", void 0, String(row[key] ?? "")));
		});
		tbody.appendChild(tr);
	});
	table.append(thead, tbody);
	wrap.appendChild(table);
	parent.appendChild(wrap);
};
var renderPreviewDom = (documentRef, preview, type, t) => {
	const root = createElement(documentRef, "div", "data-viewer");
	const card = createElement(documentRef, "section", "data-card");
	const header = createElement(documentRef, "header", "data-header");
	header.append(createElement(documentRef, "span", void 0, type.toUpperCase()), createElement(documentRef, "h2", void 0, preview.title));
	card.appendChild(header);
	appendSummary(documentRef, card, preview.summary);
	if (preview.fontFamily) {
		const fontPreview = createElement(documentRef, "div", "font-preview", t("data.font.sample"));
		fontPreview.style.fontFamily = preview.fontFamily;
		card.appendChild(fontPreview);
	}
	if (preview.image) {
		const imageWrap = createElement(documentRef, "div", "asset-image");
		const image = createElement(documentRef, "img");
		image.src = preview.image;
		image.alt = t("data.image.alt");
		imageWrap.appendChild(image);
		card.appendChild(imageWrap);
	}
	if (preview.text) card.appendChild(createElement(documentRef, "pre", "asset-text", preview.text));
	appendRows(documentRef, card, preview.rows);
	root.appendChild(card);
	return root;
};
async function renderDataAsset(buffer, target, type = "bin", context) {
	const documentRef = target.ownerDocument || document;
	const normalizedType = type.toLowerCase();
	const t = createFileViewerTranslator(context?.options);
	if (normalizedType === "ai" && readMagic(buffer, 5) === "%PDF-" && context?.renderNestedBuffer) {
		const rendered = await context.renderNestedBuffer(buffer, "pdf", target, context);
		if (rendered) return rendered;
	}
	if (normalizedType === "psd") {
		const { default: renderPsdAsset } = await import("./psd-DJNTQt9u.js");
		return renderPsdAsset(buffer, target, context);
	}
	const root = renderPreviewDom(documentRef, await buildPreview(documentRef, buffer, normalizedType, context, t), normalizedType, t);
	target.replaceChildren(createStyle(documentRef), root);
	return {
		$el: root,
		unmount() {
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderDataAsset as default };
