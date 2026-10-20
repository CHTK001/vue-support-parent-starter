const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sql-wasm-browser-Do-9ZWAu.js","assets/rolldown-runtime-CEgmsyvS.js","assets/bundle-XtOpUS3Z.js"])))=>i.map(i=>d[i]);
import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { Bu as resolveFileViewerRuntimeAssetBaseUrl, Cu as resolveFileViewerDataSqlWasmUrl, Hs as unregisterFileViewerZoomProvider, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
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
var createStyle$1 = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = dataStyle;
	return style;
};
var createElement$1 = (documentRef, tagName, className, text) => {
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
	const { default: initSqlJs } = await __vitePreload(async () => {
		const { default: initSqlJs } = await import("./sql-wasm-browser-Do-9ZWAu.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
		return { default: initSqlJs };
	}, __vite__mapDeps([0,1]));
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
	const { parquetMetadataAsync, parquetReadObjects } = await __vitePreload(async () => {
		const { parquetMetadataAsync, parquetReadObjects } = await import("./src-DGb2T8n7.js");
		return {
			parquetMetadataAsync,
			parquetReadObjects
		};
	}, []);
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
	const imported = await __vitePreload(() => import("./avsc-uw-CEJda.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1)), []);
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
	const summaryRoot = createElement$1(documentRef, "div", "data-summary");
	summary.forEach((item) => {
		const cell = createElement$1(documentRef, "div");
		cell.append(createElement$1(documentRef, "span", void 0, item.label), createElement$1(documentRef, "strong", void 0, item.value));
		summaryRoot.appendChild(cell);
	});
	parent.appendChild(summaryRoot);
};
var appendRows = (documentRef, parent, rows) => {
	if (!rows?.length) return;
	const keys = Object.keys(rows[0]);
	const wrap = createElement$1(documentRef, "div", "data-table-wrap");
	const table = createElement$1(documentRef, "table", "data-table");
	const thead = createElement$1(documentRef, "thead");
	const headRow = createElement$1(documentRef, "tr");
	keys.forEach((key) => {
		headRow.appendChild(createElement$1(documentRef, "th", void 0, key));
	});
	thead.appendChild(headRow);
	const tbody = createElement$1(documentRef, "tbody");
	rows.forEach((row) => {
		const tr = createElement$1(documentRef, "tr");
		keys.forEach((key) => {
			tr.appendChild(createElement$1(documentRef, "td", void 0, String(row[key] ?? "")));
		});
		tbody.appendChild(tr);
	});
	table.append(thead, tbody);
	wrap.appendChild(table);
	parent.appendChild(wrap);
};
var renderPreviewDom = (documentRef, preview, type, t) => {
	const root = createElement$1(documentRef, "div", "data-viewer");
	const card = createElement$1(documentRef, "section", "data-card");
	const header = createElement$1(documentRef, "header", "data-header");
	header.append(createElement$1(documentRef, "span", void 0, type.toUpperCase()), createElement$1(documentRef, "h2", void 0, preview.title));
	card.appendChild(header);
	appendSummary(documentRef, card, preview.summary);
	if (preview.fontFamily) {
		const fontPreview = createElement$1(documentRef, "div", "font-preview", t("data.font.sample"));
		fontPreview.style.fontFamily = preview.fontFamily;
		card.appendChild(fontPreview);
	}
	if (preview.image) {
		const imageWrap = createElement$1(documentRef, "div", "asset-image");
		const image = createElement$1(documentRef, "img");
		image.src = preview.image;
		image.alt = t("data.image.alt");
		imageWrap.appendChild(image);
		card.appendChild(imageWrap);
	}
	if (preview.text) card.appendChild(createElement$1(documentRef, "pre", "asset-text", preview.text));
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
		const { default: renderPsdAsset } = await __vitePreload(async () => {
			const { default: renderPsdAsset } = await import("./psd-DD2OdLac.js");
			return { default: renderPsdAsset };
		}, []);
		return renderPsdAsset(buffer, target, context);
	}
	const root = renderPreviewDom(documentRef, await buildPreview(documentRef, buffer, normalizedType, context, t), normalizedType, t);
	target.replaceChildren(createStyle$1(documentRef), root);
	return {
		$el: root,
		unmount() {
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-data@3.1.2/node_modules/@file-viewer/renderer-data/dist/index.js
var dataDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "data-asset");
if (!dataDefinition) throw new Error("@file-viewer/renderer-data could not locate the shared data asset renderer definition.");
var dataRendererDefinition = dataDefinition;
var renderFileViewerData = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderDataAsset } = await import("./data-BBGLODn6.js");
	return { default: renderDataAsset };
}, []).then(({ default: renderDataAsset }) => renderDataAsset(buffer, target, type, context));
var dataRenderer = {
	id: "file-viewer-renderer-data",
	label: "Flyfish File Viewer data asset renderer",
	definitions: [dataRendererDefinition],
	handlers: [{
		rendererId: dataRendererDefinition.id,
		handler: renderFileViewerData
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-data@3.1.2/node_modules/@file-viewer/renderer-data/dist/psd.js
var psdStyle = `
.psd-viewer{display:grid;height:100%;min-height:460px;grid-template-rows:auto minmax(0,1fr);--psd-bg:#eef1f4;--psd-surface:#fff;--psd-border:rgba(15,23,42,.1);--psd-text:#132235;--psd-muted:#64748b;--psd-accent:#0f766e;background:var(--psd-bg);color:var(--psd-text);box-sizing:border-box}
.psd-toolbar{position:sticky;top:0;z-index:2;display:flex;min-height:52px;align-items:center;justify-content:space-between;gap:14px;padding:10px 16px;border-bottom:1px solid var(--psd-border);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);box-sizing:border-box}
.psd-title{display:flex;min-width:0;flex-direction:column;gap:2px}
.psd-title strong{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}
.psd-title span{color:var(--psd-muted);font-size:12px;font-weight:700}
.psd-actions{display:flex;flex-shrink:0;align-items:center;gap:6px}
.psd-actions button{height:30px;min-width:34px;border:1px solid rgba(100,116,139,.28);border-radius:6px;background:#fff;color:#132235;cursor:pointer;font-size:12px;font-weight:800}
.psd-actions button:hover{border-color:rgba(15,118,110,.45);color:var(--psd-accent)}
.psd-actions span{min-width:48px;color:var(--psd-muted);font-size:12px;font-weight:800;text-align:center}
.psd-layout{display:grid;min-height:0;grid-template-columns:280px minmax(0,1fr)}
.psd-sidebar{min-height:0;overflow:auto;border-right:1px solid var(--psd-border);background:rgba(248,250,252,.86)}
.psd-sidebar-header{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-bottom:1px solid var(--psd-border);background:rgba(248,250,252,.94);font-size:12px;font-weight:800}
.psd-layer-list{margin:0;padding:8px;list-style:none}
.psd-layer{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start;margin:0 0 6px;padding:8px;border:1px solid transparent;border-radius:8px;background:#fff}
.psd-layer:hover{border-color:rgba(15,118,110,.24)}
.psd-layer input{margin-top:2px;accent-color:var(--psd-accent)}
.psd-layer strong{display:block;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
.psd-layer span{display:block;margin-top:3px;color:var(--psd-muted);font-size:11px}
.psd-stage{min-width:0;min-height:0;overflow:auto;padding:28px}
.psd-canvas-wrap{display:inline-block;transform-origin:top left;transition:transform .18s ease}
.psd-canvas-shell{display:inline-block;padding:18px;border:1px solid var(--psd-border);border-radius:8px;background:
  linear-gradient(45deg,#e5e7eb 25%,transparent 25%),
  linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),
  linear-gradient(45deg,transparent 75%,#e5e7eb 75%),
  linear-gradient(-45deg,transparent 75%,#e5e7eb 75%);
  background-color:#fff;background-position:0 0,0 10px,10px -10px,-10px 0;background-size:20px 20px;box-shadow:0 18px 48px rgba(15,23,42,.14)}
.psd-canvas-shell canvas{display:block;max-width:none;background:transparent}
.psd-empty{padding:20px;color:var(--psd-muted);font-weight:700}
[data-viewer-theme='dark'] .psd-viewer{--psd-bg:#0d1117;--psd-surface:#161b22;--psd-border:rgba(139,148,158,.24);--psd-text:#e6edf3;--psd-muted:#8b949e}
[data-viewer-theme='dark'] .psd-toolbar{background:rgba(13,17,23,.92)}
[data-viewer-theme='dark'] .psd-sidebar,[data-viewer-theme='dark'] .psd-sidebar-header{background:rgba(22,27,34,.92)}
[data-viewer-theme='dark'] .psd-layer,[data-viewer-theme='dark'] .psd-actions button{background:#161b22;color:#e6edf3}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .psd-viewer{--psd-bg:#0d1117;--psd-surface:#161b22;--psd-border:rgba(139,148,158,.24);--psd-text:#e6edf3;--psd-muted:#8b949e}[data-viewer-theme='system'] .psd-toolbar{background:rgba(13,17,23,.92)}[data-viewer-theme='system'] .psd-sidebar,[data-viewer-theme='system'] .psd-sidebar-header{background:rgba(22,27,34,.92)}[data-viewer-theme='system'] .psd-layer,[data-viewer-theme='system'] .psd-actions button{background:#161b22;color:#e6edf3}}
@media (max-width:760px){.psd-layout{grid-template-columns:1fr}.psd-sidebar{max-height:240px;border-right:0;border-bottom:1px solid var(--psd-border)}.psd-stage{padding:14px}}
`;
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = psdStyle;
	return style;
};
var toCanvas = (documentRef, source) => {
	if (!source) return;
	const ownerWindow = documentRef.defaultView || (typeof window !== "undefined" ? window : void 0);
	if (ownerWindow && source instanceof ownerWindow.HTMLCanvasElement) return source;
	if (ownerWindow && source instanceof ownerWindow.ImageData) {
		const canvas = documentRef.createElement("canvas");
		canvas.width = source.width;
		canvas.height = source.height;
		canvas.getContext("2d")?.putImageData(source, 0, 0);
		return canvas;
	}
	if (typeof source === "object" && "data" in source && "width" in source && "height" in source) {
		const pixelData = source;
		const canvas = documentRef.createElement("canvas");
		canvas.width = pixelData.width;
		canvas.height = pixelData.height;
		const clamped = new Uint8ClampedArray(pixelData.data.length);
		clamped.set(pixelData.data);
		const ImageDataConstructor = ownerWindow?.ImageData || ImageData;
		canvas.getContext("2d")?.putImageData(new ImageDataConstructor(clamped, pixelData.width, pixelData.height), 0, 0);
		return canvas;
	}
};
var buildLayerTree = (documentRef, layers, depth = 0, path = "") => {
	if (!Array.isArray(layers)) return [];
	return layers.map((layer, index) => {
		const name = String(layer.name || `Layer ${index + 1}`);
		const id = `${path}${index}`;
		const canvas = toCanvas(documentRef, layer.canvas || layer.imageData);
		return {
			id,
			name,
			depth,
			left: Number(layer.left || 0),
			top: Number(layer.top || 0),
			width: Math.max(0, Number(layer.right || 0) - Number(layer.left || 0)),
			height: Math.max(0, Number(layer.bottom || 0) - Number(layer.top || 0)),
			hidden: Boolean(layer.hidden),
			canvas,
			children: buildLayerTree(documentRef, layer.children, depth + 1, `${id}.`)
		};
	});
};
var flattenLayerTreeForDrawing = (layers) => {
	return layers.flatMap((layer) => [layer, ...flattenLayerTreeForDrawing(layer.children)]);
};
var flattenLayerTreeForPanel = (layers) => {
	return layers.slice().reverse().flatMap((layer) => [layer, ...flattenLayerTreeForPanel(layer.children)]);
};
var clampZoom = (value) => {
	return Math.min(4, Math.max(.1, Number(value.toFixed(2))));
};
async function renderPsdAsset(buffer, target, context) {
	const documentRef = target.ownerDocument || document;
	const t = createFileViewerTranslator(context?.options);
	const imported = await __vitePreload(() => import("./bundle-XtOpUS3Z.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1)), __vite__mapDeps([2,1]));
	const { readPsd } = imported.default || imported;
	const psd = readPsd(buffer, { useImageData: true });
	const compositeCanvas = toCanvas(documentRef, psd.canvas || psd.imageData);
	const layerTree = buildLayerTree(documentRef, psd.children);
	const layers = flattenLayerTreeForDrawing(layerTree);
	const panelLayers = flattenLayerTreeForPanel(layerTree);
	const drawableLayers = layers.filter((layer) => layer.canvas);
	const selected = new Set(drawableLayers.filter((layer) => !layer.hidden).map((layer) => layer.id));
	let zoom = 1;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = createElement(documentRef, "div", "psd-viewer");
	root.dataset.viewerZoomProvider = "psd";
	const toolbar = createElement(documentRef, "div", "psd-toolbar");
	const title = createElement(documentRef, "div", "psd-title");
	title.append(createElement(documentRef, "strong", void 0, t("psd.title")), createElement(documentRef, "span", void 0, `${psd.width || 0} x ${psd.height || 0} · ${layers.length} layers · ag-psd`));
	const actions = createElement(documentRef, "div", "psd-actions");
	const zoomOut = createElement(documentRef, "button", void 0, "-");
	const zoomLabel = createElement(documentRef, "span", void 0, "100%");
	const zoomIn = createElement(documentRef, "button", void 0, "+");
	const reset = createElement(documentRef, "button", void 0, t("psd.action.fit"));
	const showAll = createElement(documentRef, "button", void 0, t("psd.action.showAll"));
	const hideAll = createElement(documentRef, "button", void 0, t("psd.action.hideAll"));
	[
		zoomOut,
		zoomIn,
		reset,
		showAll,
		hideAll
	].forEach((button) => {
		button.type = "button";
	});
	actions.append(zoomOut, zoomLabel, zoomIn, reset, showAll, hideAll);
	toolbar.append(title, actions);
	const layout = createElement(documentRef, "div", "psd-layout");
	const sidebar = createElement(documentRef, "aside", "psd-sidebar");
	const sidebarHeader = createElement(documentRef, "div", "psd-sidebar-header");
	sidebarHeader.append(createElement(documentRef, "span", void 0, t("psd.layers.title")), createElement(documentRef, "span", void 0, t("psd.layers.redrawable", { count: drawableLayers.length })));
	const list = createElement(documentRef, "ul", "psd-layer-list");
	sidebar.append(sidebarHeader, list);
	const stage = createElement(documentRef, "main", "psd-stage");
	const wrap = createElement(documentRef, "div", "psd-canvas-wrap");
	const shell = createElement(documentRef, "div", "psd-canvas-shell");
	const canvas = createElement(documentRef, "canvas");
	canvas.width = Math.max(1, Number(psd.width || compositeCanvas?.width || 1));
	canvas.height = Math.max(1, Number(psd.height || compositeCanvas?.height || 1));
	shell.appendChild(canvas);
	wrap.appendChild(shell);
	stage.appendChild(wrap);
	layout.append(sidebar, stage);
	root.append(toolbar, layout);
	target.replaceChildren(createStyle(documentRef), root);
	const redraw = () => {
		const context = canvas.getContext("2d");
		if (!context) return;
		context.clearRect(0, 0, canvas.width, canvas.height);
		const visibleLayerCanvases = drawableLayers.filter((layer) => selected.has(layer.id));
		if (!visibleLayerCanvases.length && compositeCanvas) {
			context.drawImage(compositeCanvas, 0, 0);
			return;
		}
		visibleLayerCanvases.forEach((layer) => {
			if (layer.canvas) context.drawImage(layer.canvas, layer.left, layer.top);
		});
	};
	if (!layers.length) list.appendChild(createElement(documentRef, "li", "psd-empty", t("psd.layers.empty")));
	panelLayers.forEach((layer) => {
		const item = createElement(documentRef, "li", "psd-layer");
		item.dataset.layerId = layer.id;
		item.dataset.layerName = layer.name;
		item.style.paddingLeft = `${8 + layer.depth * 14}px`;
		const checkbox = createElement(documentRef, "input");
		checkbox.type = "checkbox";
		checkbox.disabled = !layer.canvas;
		checkbox.checked = selected.has(layer.id);
		checkbox.addEventListener("change", () => {
			if (checkbox.checked) selected.add(layer.id);
			else selected.delete(layer.id);
			redraw();
		});
		const copy = createElement(documentRef, "div");
		copy.append(createElement(documentRef, "strong", void 0, layer.name), createElement(documentRef, "span", void 0, `${layer.left},${layer.top} · ${layer.width} x ${layer.height}${layer.hidden ? ` · ${t("psd.layers.hidden")}` : ""}`));
		item.append(checkbox, copy);
		list.appendChild(item);
	});
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 4,
		canZoomOut: zoom > .1,
		canReset: zoom !== 1,
		minScale: .1,
		maxScale: 4
	});
	const setZoom = (scale) => {
		zoom = clampZoom(scale);
		wrap.style.transform = `scale(${zoom})`;
		zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
		zoomEmitter.emit();
		return getZoomState();
	};
	zoomOut.addEventListener("click", () => setZoom(zoom - .1));
	zoomIn.addEventListener("click", () => setZoom(zoom + .1));
	reset.addEventListener("click", () => setZoom(1));
	showAll.addEventListener("click", () => {
		drawableLayers.forEach((layer) => selected.add(layer.id));
		list.querySelectorAll("input[type=\"checkbox\"]").forEach((input) => {
			if (!input.disabled) input.checked = true;
		});
		redraw();
	});
	hideAll.addEventListener("click", () => {
		selected.clear();
		list.querySelectorAll("input[type=\"checkbox\"]").forEach((input) => {
			if (!input.disabled) input.checked = false;
		});
		redraw();
	});
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	redraw();
	setZoom(1);
	return {
		$el: root,
		unmount() {
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-data@3.1.2/node_modules/@file-viewer/renderer-data/dist/vendor/avsc.cjs
var require_avsc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __esm = (fn, res, err) => function __init() {
		if (err) throw err[0];
		try {
			return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __commonJS = (cb, mod) => function __require() {
		try {
			return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
		} catch (e) {
			throw mod = 0, e;
		}
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	var require_base64_js = __commonJS({ "../../../node_modules/.pnpm/base64-js@1.5.1/node_modules/base64-js/index.js"(exports2) {
		"use strict";
		init_browser_globals();
		exports2.byteLength = byteLength;
		exports2.toByteArray = toByteArray;
		exports2.fromByteArray = fromByteArray;
		var lookup = [];
		var revLookup = [];
		var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
		var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		for (i = 0, len = code.length; i < len; ++i) {
			lookup[i] = code[i];
			revLookup[code.charCodeAt(i)] = i;
		}
		var i;
		var len;
		revLookup["-".charCodeAt(0)] = 62;
		revLookup["_".charCodeAt(0)] = 63;
		function getLens(b64) {
			var len2 = b64.length;
			if (len2 % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
			var validLen = b64.indexOf("=");
			if (validLen === -1) validLen = len2;
			var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
			return [validLen, placeHoldersLen];
		}
		function byteLength(b64) {
			var lens = getLens(b64);
			var validLen = lens[0];
			var placeHoldersLen = lens[1];
			return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
		}
		function _byteLength(b64, validLen, placeHoldersLen) {
			return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
		}
		function toByteArray(b64) {
			var tmp;
			var lens = getLens(b64);
			var validLen = lens[0];
			var placeHoldersLen = lens[1];
			var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
			var curByte = 0;
			var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
			var i2;
			for (i2 = 0; i2 < len2; i2 += 4) {
				tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
				arr[curByte++] = tmp >> 16 & 255;
				arr[curByte++] = tmp >> 8 & 255;
				arr[curByte++] = tmp & 255;
			}
			if (placeHoldersLen === 2) {
				tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
				arr[curByte++] = tmp & 255;
			}
			if (placeHoldersLen === 1) {
				tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
				arr[curByte++] = tmp >> 8 & 255;
				arr[curByte++] = tmp & 255;
			}
			return arr;
		}
		function tripletToBase64(num) {
			return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
		}
		function encodeChunk(uint8, start, end) {
			var tmp;
			var output = [];
			for (var i2 = start; i2 < end; i2 += 3) {
				tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
				output.push(tripletToBase64(tmp));
			}
			return output.join("");
		}
		function fromByteArray(uint8) {
			var tmp;
			var len2 = uint8.length;
			var extraBytes = len2 % 3;
			var parts = [];
			var maxChunkLength = 16383;
			for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
			if (extraBytes === 1) {
				tmp = uint8[len2 - 1];
				parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
			} else if (extraBytes === 2) {
				tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
				parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
			}
			return parts.join("");
		}
	} });
	var require_ieee754 = __commonJS({ "../../../node_modules/.pnpm/ieee754@1.2.1/node_modules/ieee754/index.js"(exports2) {
		init_browser_globals();
		exports2.read = function(buffer, offset, isLE, mLen, nBytes) {
			var e, m;
			var eLen = nBytes * 8 - mLen - 1;
			var eMax = (1 << eLen) - 1;
			var eBias = eMax >> 1;
			var nBits = -7;
			var i = isLE ? nBytes - 1 : 0;
			var d = isLE ? -1 : 1;
			var s = buffer[offset + i];
			i += d;
			e = s & (1 << -nBits) - 1;
			s >>= -nBits;
			nBits += eLen;
			for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);
			m = e & (1 << -nBits) - 1;
			e >>= -nBits;
			nBits += mLen;
			for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);
			if (e === 0) e = 1 - eBias;
			else if (e === eMax) return m ? NaN : (s ? -1 : 1) * Infinity;
			else {
				m = m + Math.pow(2, mLen);
				e = e - eBias;
			}
			return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
		};
		exports2.write = function(buffer, value, offset, isLE, mLen, nBytes) {
			var e, m, c;
			var eLen = nBytes * 8 - mLen - 1;
			var eMax = (1 << eLen) - 1;
			var eBias = eMax >> 1;
			var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
			var i = isLE ? 0 : nBytes - 1;
			var d = isLE ? 1 : -1;
			var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
			value = Math.abs(value);
			if (isNaN(value) || value === Infinity) {
				m = isNaN(value) ? 1 : 0;
				e = eMax;
			} else {
				e = Math.floor(Math.log(value) / Math.LN2);
				if (value * (c = Math.pow(2, -e)) < 1) {
					e--;
					c *= 2;
				}
				if (e + eBias >= 1) value += rt / c;
				else value += rt * Math.pow(2, 1 - eBias);
				if (value * c >= 2) {
					e++;
					c /= 2;
				}
				if (e + eBias >= eMax) {
					m = 0;
					e = eMax;
				} else if (e + eBias >= 1) {
					m = (value * c - 1) * Math.pow(2, mLen);
					e = e + eBias;
				} else {
					m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
					e = 0;
				}
			}
			for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8);
			e = e << mLen | m;
			eLen += mLen;
			for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8);
			buffer[offset + i - d] |= s * 128;
		};
	} });
	var require_buffer = __commonJS({ "../../../node_modules/.pnpm/buffer@6.0.3/node_modules/buffer/index.js"(exports2) {
		"use strict";
		init_browser_globals();
		var base64 = require_base64_js();
		var ieee754 = require_ieee754();
		var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
		exports2.Buffer = Buffer3;
		exports2.SlowBuffer = SlowBuffer;
		exports2.INSPECT_MAX_BYTES = 50;
		var K_MAX_LENGTH = 2147483647;
		exports2.kMaxLength = K_MAX_LENGTH;
		Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
		if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
		function typedArraySupport() {
			try {
				const arr = /* @__PURE__ */ new Uint8Array(1);
				const proto = { foo: function() {
					return 42;
				} };
				Object.setPrototypeOf(proto, Uint8Array.prototype);
				Object.setPrototypeOf(arr, proto);
				return arr.foo() === 42;
			} catch (e) {
				return false;
			}
		}
		Object.defineProperty(Buffer3.prototype, "parent", {
			enumerable: true,
			get: function() {
				if (!Buffer3.isBuffer(this)) return void 0;
				return this.buffer;
			}
		});
		Object.defineProperty(Buffer3.prototype, "offset", {
			enumerable: true,
			get: function() {
				if (!Buffer3.isBuffer(this)) return void 0;
				return this.byteOffset;
			}
		});
		function createBuffer(length) {
			if (length > K_MAX_LENGTH) throw new RangeError("The value \"" + length + "\" is invalid for option \"size\"");
			const buf = new Uint8Array(length);
			Object.setPrototypeOf(buf, Buffer3.prototype);
			return buf;
		}
		function Buffer3(arg, encodingOrOffset, length) {
			if (typeof arg === "number") {
				if (typeof encodingOrOffset === "string") throw new TypeError("The \"string\" argument must be of type string. Received type number");
				return allocUnsafe(arg);
			}
			return from(arg, encodingOrOffset, length);
		}
		Buffer3.poolSize = 8192;
		function from(value, encodingOrOffset, length) {
			if (typeof value === "string") return fromString(value, encodingOrOffset);
			if (ArrayBuffer.isView(value)) return fromArrayView(value);
			if (value == null) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
			if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) return fromArrayBuffer(value, encodingOrOffset, length);
			if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) return fromArrayBuffer(value, encodingOrOffset, length);
			if (typeof value === "number") throw new TypeError("The \"value\" argument must not be of type number. Received type number");
			const valueOf = value.valueOf && value.valueOf();
			if (valueOf != null && valueOf !== value) return Buffer3.from(valueOf, encodingOrOffset, length);
			const b = fromObject(value);
			if (b) return b;
			if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
			throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
		}
		Buffer3.from = function(value, encodingOrOffset, length) {
			return from(value, encodingOrOffset, length);
		};
		Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
		Object.setPrototypeOf(Buffer3, Uint8Array);
		function assertSize(size) {
			if (typeof size !== "number") throw new TypeError("\"size\" argument must be of type number");
			else if (size < 0) throw new RangeError("The value \"" + size + "\" is invalid for option \"size\"");
		}
		function alloc(size, fill, encoding) {
			assertSize(size);
			if (size <= 0) return createBuffer(size);
			if (fill !== void 0) return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
			return createBuffer(size);
		}
		Buffer3.alloc = function(size, fill, encoding) {
			return alloc(size, fill, encoding);
		};
		function allocUnsafe(size) {
			assertSize(size);
			return createBuffer(size < 0 ? 0 : checked(size) | 0);
		}
		Buffer3.allocUnsafe = function(size) {
			return allocUnsafe(size);
		};
		Buffer3.allocUnsafeSlow = function(size) {
			return allocUnsafe(size);
		};
		function fromString(string, encoding) {
			if (typeof encoding !== "string" || encoding === "") encoding = "utf8";
			if (!Buffer3.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
			const length = byteLength(string, encoding) | 0;
			let buf = createBuffer(length);
			const actual = buf.write(string, encoding);
			if (actual !== length) buf = buf.slice(0, actual);
			return buf;
		}
		function fromArrayLike(array) {
			const length = array.length < 0 ? 0 : checked(array.length) | 0;
			const buf = createBuffer(length);
			for (let i = 0; i < length; i += 1) buf[i] = array[i] & 255;
			return buf;
		}
		function fromArrayView(arrayView) {
			if (isInstance(arrayView, Uint8Array)) {
				const copy = new Uint8Array(arrayView);
				return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
			}
			return fromArrayLike(arrayView);
		}
		function fromArrayBuffer(array, byteOffset, length) {
			if (byteOffset < 0 || array.byteLength < byteOffset) throw new RangeError("\"offset\" is outside of buffer bounds");
			if (array.byteLength < byteOffset + (length || 0)) throw new RangeError("\"length\" is outside of buffer bounds");
			let buf;
			if (byteOffset === void 0 && length === void 0) buf = new Uint8Array(array);
			else if (length === void 0) buf = new Uint8Array(array, byteOffset);
			else buf = new Uint8Array(array, byteOffset, length);
			Object.setPrototypeOf(buf, Buffer3.prototype);
			return buf;
		}
		function fromObject(obj) {
			if (Buffer3.isBuffer(obj)) {
				const len = checked(obj.length) | 0;
				const buf = createBuffer(len);
				if (buf.length === 0) return buf;
				obj.copy(buf, 0, 0, len);
				return buf;
			}
			if (obj.length !== void 0) {
				if (typeof obj.length !== "number" || numberIsNaN(obj.length)) return createBuffer(0);
				return fromArrayLike(obj);
			}
			if (obj.type === "Buffer" && Array.isArray(obj.data)) return fromArrayLike(obj.data);
		}
		function checked(length) {
			if (length >= K_MAX_LENGTH) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
			return length | 0;
		}
		function SlowBuffer(length) {
			if (+length != length) length = 0;
			return Buffer3.alloc(+length);
		}
		Buffer3.isBuffer = function isBuffer(b) {
			return b != null && b._isBuffer === true && b !== Buffer3.prototype;
		};
		Buffer3.compare = function compare(a, b) {
			if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
			if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
			if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) throw new TypeError("The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array");
			if (a === b) return 0;
			let x = a.length;
			let y = b.length;
			for (let i = 0, len = Math.min(x, y); i < len; ++i) if (a[i] !== b[i]) {
				x = a[i];
				y = b[i];
				break;
			}
			if (x < y) return -1;
			if (y < x) return 1;
			return 0;
		};
		Buffer3.isEncoding = function isEncoding(encoding) {
			switch (String(encoding).toLowerCase()) {
				case "hex":
				case "utf8":
				case "utf-8":
				case "ascii":
				case "latin1":
				case "binary":
				case "base64":
				case "ucs2":
				case "ucs-2":
				case "utf16le":
				case "utf-16le": return true;
				default: return false;
			}
		};
		Buffer3.concat = function concat(list, length) {
			if (!Array.isArray(list)) throw new TypeError("\"list\" argument must be an Array of Buffers");
			if (list.length === 0) return Buffer3.alloc(0);
			let i;
			if (length === void 0) {
				length = 0;
				for (i = 0; i < list.length; ++i) length += list[i].length;
			}
			const buffer = Buffer3.allocUnsafe(length);
			let pos = 0;
			for (i = 0; i < list.length; ++i) {
				let buf = list[i];
				if (isInstance(buf, Uint8Array)) if (pos + buf.length > buffer.length) {
					if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
					buf.copy(buffer, pos);
				} else Uint8Array.prototype.set.call(buffer, buf, pos);
				else if (!Buffer3.isBuffer(buf)) throw new TypeError("\"list\" argument must be an Array of Buffers");
				else buf.copy(buffer, pos);
				pos += buf.length;
			}
			return buffer;
		};
		function byteLength(string, encoding) {
			if (Buffer3.isBuffer(string)) return string.length;
			if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) return string.byteLength;
			if (typeof string !== "string") throw new TypeError("The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type " + typeof string);
			const len = string.length;
			const mustMatch = arguments.length > 2 && arguments[2] === true;
			if (!mustMatch && len === 0) return 0;
			let loweredCase = false;
			for (;;) switch (encoding) {
				case "ascii":
				case "latin1":
				case "binary": return len;
				case "utf8":
				case "utf-8": return utf8ToBytes(string).length;
				case "ucs2":
				case "ucs-2":
				case "utf16le":
				case "utf-16le": return len * 2;
				case "hex": return len >>> 1;
				case "base64": return base64ToBytes(string).length;
				default:
					if (loweredCase) return mustMatch ? -1 : utf8ToBytes(string).length;
					encoding = ("" + encoding).toLowerCase();
					loweredCase = true;
			}
		}
		Buffer3.byteLength = byteLength;
		function slowToString(encoding, start, end) {
			let loweredCase = false;
			if (start === void 0 || start < 0) start = 0;
			if (start > this.length) return "";
			if (end === void 0 || end > this.length) end = this.length;
			if (end <= 0) return "";
			end >>>= 0;
			start >>>= 0;
			if (end <= start) return "";
			if (!encoding) encoding = "utf8";
			while (true) switch (encoding) {
				case "hex": return hexSlice(this, start, end);
				case "utf8":
				case "utf-8": return utf8Slice(this, start, end);
				case "ascii": return asciiSlice(this, start, end);
				case "latin1":
				case "binary": return latin1Slice(this, start, end);
				case "base64": return base64Slice(this, start, end);
				case "ucs2":
				case "ucs-2":
				case "utf16le":
				case "utf-16le": return utf16leSlice(this, start, end);
				default:
					if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
					encoding = (encoding + "").toLowerCase();
					loweredCase = true;
			}
		}
		Buffer3.prototype._isBuffer = true;
		function swap(b, n, m) {
			const i = b[n];
			b[n] = b[m];
			b[m] = i;
		}
		Buffer3.prototype.swap16 = function swap16() {
			const len = this.length;
			if (len % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
			for (let i = 0; i < len; i += 2) swap(this, i, i + 1);
			return this;
		};
		Buffer3.prototype.swap32 = function swap32() {
			const len = this.length;
			if (len % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
			for (let i = 0; i < len; i += 4) {
				swap(this, i, i + 3);
				swap(this, i + 1, i + 2);
			}
			return this;
		};
		Buffer3.prototype.swap64 = function swap64() {
			const len = this.length;
			if (len % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
			for (let i = 0; i < len; i += 8) {
				swap(this, i, i + 7);
				swap(this, i + 1, i + 6);
				swap(this, i + 2, i + 5);
				swap(this, i + 3, i + 4);
			}
			return this;
		};
		Buffer3.prototype.toString = function toString() {
			const length = this.length;
			if (length === 0) return "";
			if (arguments.length === 0) return utf8Slice(this, 0, length);
			return slowToString.apply(this, arguments);
		};
		Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
		Buffer3.prototype.equals = function equals(b) {
			if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
			if (this === b) return true;
			return Buffer3.compare(this, b) === 0;
		};
		Buffer3.prototype.inspect = function inspect() {
			let str = "";
			const max = exports2.INSPECT_MAX_BYTES;
			str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
			if (this.length > max) str += " ... ";
			return "<Buffer " + str + ">";
		};
		if (customInspectSymbol) Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
		Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
			if (isInstance(target, Uint8Array)) target = Buffer3.from(target, target.offset, target.byteLength);
			if (!Buffer3.isBuffer(target)) throw new TypeError("The \"target\" argument must be one of type Buffer or Uint8Array. Received type " + typeof target);
			if (start === void 0) start = 0;
			if (end === void 0) end = target ? target.length : 0;
			if (thisStart === void 0) thisStart = 0;
			if (thisEnd === void 0) thisEnd = this.length;
			if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) throw new RangeError("out of range index");
			if (thisStart >= thisEnd && start >= end) return 0;
			if (thisStart >= thisEnd) return -1;
			if (start >= end) return 1;
			start >>>= 0;
			end >>>= 0;
			thisStart >>>= 0;
			thisEnd >>>= 0;
			if (this === target) return 0;
			let x = thisEnd - thisStart;
			let y = end - start;
			const len = Math.min(x, y);
			const thisCopy = this.slice(thisStart, thisEnd);
			const targetCopy = target.slice(start, end);
			for (let i = 0; i < len; ++i) if (thisCopy[i] !== targetCopy[i]) {
				x = thisCopy[i];
				y = targetCopy[i];
				break;
			}
			if (x < y) return -1;
			if (y < x) return 1;
			return 0;
		};
		function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
			if (buffer.length === 0) return -1;
			if (typeof byteOffset === "string") {
				encoding = byteOffset;
				byteOffset = 0;
			} else if (byteOffset > 2147483647) byteOffset = 2147483647;
			else if (byteOffset < -2147483648) byteOffset = -2147483648;
			byteOffset = +byteOffset;
			if (numberIsNaN(byteOffset)) byteOffset = dir ? 0 : buffer.length - 1;
			if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
			if (byteOffset >= buffer.length) if (dir) return -1;
			else byteOffset = buffer.length - 1;
			else if (byteOffset < 0) if (dir) byteOffset = 0;
			else return -1;
			if (typeof val === "string") val = Buffer3.from(val, encoding);
			if (Buffer3.isBuffer(val)) {
				if (val.length === 0) return -1;
				return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
			} else if (typeof val === "number") {
				val = val & 255;
				if (typeof Uint8Array.prototype.indexOf === "function") if (dir) return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
				else return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
				return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
			}
			throw new TypeError("val must be string, number or Buffer");
		}
		function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
			let indexSize = 1;
			let arrLength = arr.length;
			let valLength = val.length;
			if (encoding !== void 0) {
				encoding = String(encoding).toLowerCase();
				if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
					if (arr.length < 2 || val.length < 2) return -1;
					indexSize = 2;
					arrLength /= 2;
					valLength /= 2;
					byteOffset /= 2;
				}
			}
			function read(buf, i2) {
				if (indexSize === 1) return buf[i2];
				else return buf.readUInt16BE(i2 * indexSize);
			}
			let i;
			if (dir) {
				let foundIndex = -1;
				for (i = byteOffset; i < arrLength; i++) if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
					if (foundIndex === -1) foundIndex = i;
					if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
				} else {
					if (foundIndex !== -1) i -= i - foundIndex;
					foundIndex = -1;
				}
			} else {
				if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
				for (i = byteOffset; i >= 0; i--) {
					let found = true;
					for (let j = 0; j < valLength; j++) if (read(arr, i + j) !== read(val, j)) {
						found = false;
						break;
					}
					if (found) return i;
				}
			}
			return -1;
		}
		Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
			return this.indexOf(val, byteOffset, encoding) !== -1;
		};
		Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
			return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
		};
		Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
			return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
		};
		function hexWrite(buf, string, offset, length) {
			offset = Number(offset) || 0;
			const remaining = buf.length - offset;
			if (!length) length = remaining;
			else {
				length = Number(length);
				if (length > remaining) length = remaining;
			}
			const strLen = string.length;
			if (length > strLen / 2) length = strLen / 2;
			let i;
			for (i = 0; i < length; ++i) {
				const parsed = parseInt(string.substr(i * 2, 2), 16);
				if (numberIsNaN(parsed)) return i;
				buf[offset + i] = parsed;
			}
			return i;
		}
		function utf8Write(buf, string, offset, length) {
			return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
		}
		function asciiWrite(buf, string, offset, length) {
			return blitBuffer(asciiToBytes(string), buf, offset, length);
		}
		function base64Write(buf, string, offset, length) {
			return blitBuffer(base64ToBytes(string), buf, offset, length);
		}
		function ucs2Write(buf, string, offset, length) {
			return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
		}
		Buffer3.prototype.write = function write(string, offset, length, encoding) {
			if (offset === void 0) {
				encoding = "utf8";
				length = this.length;
				offset = 0;
			} else if (length === void 0 && typeof offset === "string") {
				encoding = offset;
				length = this.length;
				offset = 0;
			} else if (isFinite(offset)) {
				offset = offset >>> 0;
				if (isFinite(length)) {
					length = length >>> 0;
					if (encoding === void 0) encoding = "utf8";
				} else {
					encoding = length;
					length = void 0;
				}
			} else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
			const remaining = this.length - offset;
			if (length === void 0 || length > remaining) length = remaining;
			if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) throw new RangeError("Attempt to write outside buffer bounds");
			if (!encoding) encoding = "utf8";
			let loweredCase = false;
			for (;;) switch (encoding) {
				case "hex": return hexWrite(this, string, offset, length);
				case "utf8":
				case "utf-8": return utf8Write(this, string, offset, length);
				case "ascii":
				case "latin1":
				case "binary": return asciiWrite(this, string, offset, length);
				case "base64": return base64Write(this, string, offset, length);
				case "ucs2":
				case "ucs-2":
				case "utf16le":
				case "utf-16le": return ucs2Write(this, string, offset, length);
				default:
					if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
					encoding = ("" + encoding).toLowerCase();
					loweredCase = true;
			}
		};
		Buffer3.prototype.toJSON = function toJSON() {
			return {
				type: "Buffer",
				data: Array.prototype.slice.call(this._arr || this, 0)
			};
		};
		function base64Slice(buf, start, end) {
			if (start === 0 && end === buf.length) return base64.fromByteArray(buf);
			else return base64.fromByteArray(buf.slice(start, end));
		}
		function utf8Slice(buf, start, end) {
			end = Math.min(buf.length, end);
			const res = [];
			let i = start;
			while (i < end) {
				const firstByte = buf[i];
				let codePoint = null;
				let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
				if (i + bytesPerSequence <= end) {
					let secondByte, thirdByte, fourthByte, tempCodePoint;
					switch (bytesPerSequence) {
						case 1:
							if (firstByte < 128) codePoint = firstByte;
							break;
						case 2:
							secondByte = buf[i + 1];
							if ((secondByte & 192) === 128) {
								tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
								if (tempCodePoint > 127) codePoint = tempCodePoint;
							}
							break;
						case 3:
							secondByte = buf[i + 1];
							thirdByte = buf[i + 2];
							if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
								tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
								if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) codePoint = tempCodePoint;
							}
							break;
						case 4:
							secondByte = buf[i + 1];
							thirdByte = buf[i + 2];
							fourthByte = buf[i + 3];
							if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
								tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
								if (tempCodePoint > 65535 && tempCodePoint < 1114112) codePoint = tempCodePoint;
							}
					}
				}
				if (codePoint === null) {
					codePoint = 65533;
					bytesPerSequence = 1;
				} else if (codePoint > 65535) {
					codePoint -= 65536;
					res.push(codePoint >>> 10 & 1023 | 55296);
					codePoint = 56320 | codePoint & 1023;
				}
				res.push(codePoint);
				i += bytesPerSequence;
			}
			return decodeCodePointsArray(res);
		}
		var MAX_ARGUMENTS_LENGTH = 4096;
		function decodeCodePointsArray(codePoints) {
			const len = codePoints.length;
			if (len <= MAX_ARGUMENTS_LENGTH) return String.fromCharCode.apply(String, codePoints);
			let res = "";
			let i = 0;
			while (i < len) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
			return res;
		}
		function asciiSlice(buf, start, end) {
			let ret = "";
			end = Math.min(buf.length, end);
			for (let i = start; i < end; ++i) ret += String.fromCharCode(buf[i] & 127);
			return ret;
		}
		function latin1Slice(buf, start, end) {
			let ret = "";
			end = Math.min(buf.length, end);
			for (let i = start; i < end; ++i) ret += String.fromCharCode(buf[i]);
			return ret;
		}
		function hexSlice(buf, start, end) {
			const len = buf.length;
			if (!start || start < 0) start = 0;
			if (!end || end < 0 || end > len) end = len;
			let out = "";
			for (let i = start; i < end; ++i) out += hexSliceLookupTable[buf[i]];
			return out;
		}
		function utf16leSlice(buf, start, end) {
			const bytes = buf.slice(start, end);
			let res = "";
			for (let i = 0; i < bytes.length - 1; i += 2) res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
			return res;
		}
		Buffer3.prototype.slice = function slice(start, end) {
			const len = this.length;
			start = ~~start;
			end = end === void 0 ? len : ~~end;
			if (start < 0) {
				start += len;
				if (start < 0) start = 0;
			} else if (start > len) start = len;
			if (end < 0) {
				end += len;
				if (end < 0) end = 0;
			} else if (end > len) end = len;
			if (end < start) end = start;
			const newBuf = this.subarray(start, end);
			Object.setPrototypeOf(newBuf, Buffer3.prototype);
			return newBuf;
		};
		function checkOffset(offset, ext, length) {
			if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
			if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
		}
		Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
			offset = offset >>> 0;
			byteLength2 = byteLength2 >>> 0;
			if (!noAssert) checkOffset(offset, byteLength2, this.length);
			let val = this[offset];
			let mul = 1;
			let i = 0;
			while (++i < byteLength2 && (mul *= 256)) val += this[offset + i] * mul;
			return val;
		};
		Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
			offset = offset >>> 0;
			byteLength2 = byteLength2 >>> 0;
			if (!noAssert) checkOffset(offset, byteLength2, this.length);
			let val = this[offset + --byteLength2];
			let mul = 1;
			while (byteLength2 > 0 && (mul *= 256)) val += this[offset + --byteLength2] * mul;
			return val;
		};
		Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 1, this.length);
			return this[offset];
		};
		Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 2, this.length);
			return this[offset] | this[offset + 1] << 8;
		};
		Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 2, this.length);
			return this[offset] << 8 | this[offset + 1];
		};
		Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 4, this.length);
			return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
		};
		Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 4, this.length);
			return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
		};
		Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
			offset = offset >>> 0;
			validateNumber(offset, "offset");
			const first = this[offset];
			const last = this[offset + 7];
			if (first === void 0 || last === void 0) boundsError(offset, this.length - 8);
			const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
			const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
			return BigInt(lo) + (BigInt(hi) << BigInt(32));
		});
		Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
			offset = offset >>> 0;
			validateNumber(offset, "offset");
			const first = this[offset];
			const last = this[offset + 7];
			if (first === void 0 || last === void 0) boundsError(offset, this.length - 8);
			const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
			const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
			return (BigInt(hi) << BigInt(32)) + BigInt(lo);
		});
		Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
			offset = offset >>> 0;
			byteLength2 = byteLength2 >>> 0;
			if (!noAssert) checkOffset(offset, byteLength2, this.length);
			let val = this[offset];
			let mul = 1;
			let i = 0;
			while (++i < byteLength2 && (mul *= 256)) val += this[offset + i] * mul;
			mul *= 128;
			if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
			return val;
		};
		Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
			offset = offset >>> 0;
			byteLength2 = byteLength2 >>> 0;
			if (!noAssert) checkOffset(offset, byteLength2, this.length);
			let i = byteLength2;
			let mul = 1;
			let val = this[offset + --i];
			while (i > 0 && (mul *= 256)) val += this[offset + --i] * mul;
			mul *= 128;
			if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
			return val;
		};
		Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 1, this.length);
			if (!(this[offset] & 128)) return this[offset];
			return (255 - this[offset] + 1) * -1;
		};
		Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 2, this.length);
			const val = this[offset] | this[offset + 1] << 8;
			return val & 32768 ? val | 4294901760 : val;
		};
		Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 2, this.length);
			const val = this[offset + 1] | this[offset] << 8;
			return val & 32768 ? val | 4294901760 : val;
		};
		Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 4, this.length);
			return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
		};
		Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 4, this.length);
			return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
		};
		Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
			offset = offset >>> 0;
			validateNumber(offset, "offset");
			const first = this[offset];
			const last = this[offset + 7];
			if (first === void 0 || last === void 0) boundsError(offset, this.length - 8);
			const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
			return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
		});
		Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
			offset = offset >>> 0;
			validateNumber(offset, "offset");
			const first = this[offset];
			const last = this[offset + 7];
			if (first === void 0 || last === void 0) boundsError(offset, this.length - 8);
			const val = (first << 24) + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
			return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
		});
		Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 4, this.length);
			return ieee754.read(this, offset, true, 23, 4);
		};
		Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 4, this.length);
			return ieee754.read(this, offset, false, 23, 4);
		};
		Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 8, this.length);
			return ieee754.read(this, offset, true, 52, 8);
		};
		Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
			offset = offset >>> 0;
			if (!noAssert) checkOffset(offset, 8, this.length);
			return ieee754.read(this, offset, false, 52, 8);
		};
		function checkInt(buf, value, offset, ext, max, min) {
			if (!Buffer3.isBuffer(buf)) throw new TypeError("\"buffer\" argument must be a Buffer instance");
			if (value > max || value < min) throw new RangeError("\"value\" argument is out of bounds");
			if (offset + ext > buf.length) throw new RangeError("Index out of range");
		}
		Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
			value = +value;
			offset = offset >>> 0;
			byteLength2 = byteLength2 >>> 0;
			if (!noAssert) {
				const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
				checkInt(this, value, offset, byteLength2, maxBytes, 0);
			}
			let mul = 1;
			let i = 0;
			this[offset] = value & 255;
			while (++i < byteLength2 && (mul *= 256)) this[offset + i] = value / mul & 255;
			return offset + byteLength2;
		};
		Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
			value = +value;
			offset = offset >>> 0;
			byteLength2 = byteLength2 >>> 0;
			if (!noAssert) {
				const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
				checkInt(this, value, offset, byteLength2, maxBytes, 0);
			}
			let i = byteLength2 - 1;
			let mul = 1;
			this[offset + i] = value & 255;
			while (--i >= 0 && (mul *= 256)) this[offset + i] = value / mul & 255;
			return offset + byteLength2;
		};
		Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
			this[offset] = value & 255;
			return offset + 1;
		};
		Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
			this[offset] = value & 255;
			this[offset + 1] = value >>> 8;
			return offset + 2;
		};
		Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
			this[offset] = value >>> 8;
			this[offset + 1] = value & 255;
			return offset + 2;
		};
		Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
			this[offset + 3] = value >>> 24;
			this[offset + 2] = value >>> 16;
			this[offset + 1] = value >>> 8;
			this[offset] = value & 255;
			return offset + 4;
		};
		Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
			this[offset] = value >>> 24;
			this[offset + 1] = value >>> 16;
			this[offset + 2] = value >>> 8;
			this[offset + 3] = value & 255;
			return offset + 4;
		};
		function wrtBigUInt64LE(buf, value, offset, min, max) {
			checkIntBI(value, min, max, buf, offset, 7);
			let lo = Number(value & BigInt(4294967295));
			buf[offset++] = lo;
			lo = lo >> 8;
			buf[offset++] = lo;
			lo = lo >> 8;
			buf[offset++] = lo;
			lo = lo >> 8;
			buf[offset++] = lo;
			let hi = Number(value >> BigInt(32) & BigInt(4294967295));
			buf[offset++] = hi;
			hi = hi >> 8;
			buf[offset++] = hi;
			hi = hi >> 8;
			buf[offset++] = hi;
			hi = hi >> 8;
			buf[offset++] = hi;
			return offset;
		}
		function wrtBigUInt64BE(buf, value, offset, min, max) {
			checkIntBI(value, min, max, buf, offset, 7);
			let lo = Number(value & BigInt(4294967295));
			buf[offset + 7] = lo;
			lo = lo >> 8;
			buf[offset + 6] = lo;
			lo = lo >> 8;
			buf[offset + 5] = lo;
			lo = lo >> 8;
			buf[offset + 4] = lo;
			let hi = Number(value >> BigInt(32) & BigInt(4294967295));
			buf[offset + 3] = hi;
			hi = hi >> 8;
			buf[offset + 2] = hi;
			hi = hi >> 8;
			buf[offset + 1] = hi;
			hi = hi >> 8;
			buf[offset] = hi;
			return offset + 8;
		}
		Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
			return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
		});
		Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
			return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
		});
		Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) {
				const limit = Math.pow(2, 8 * byteLength2 - 1);
				checkInt(this, value, offset, byteLength2, limit - 1, -limit);
			}
			let i = 0;
			let mul = 1;
			let sub = 0;
			this[offset] = value & 255;
			while (++i < byteLength2 && (mul *= 256)) {
				if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) sub = 1;
				this[offset + i] = (value / mul >> 0) - sub & 255;
			}
			return offset + byteLength2;
		};
		Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) {
				const limit = Math.pow(2, 8 * byteLength2 - 1);
				checkInt(this, value, offset, byteLength2, limit - 1, -limit);
			}
			let i = byteLength2 - 1;
			let mul = 1;
			let sub = 0;
			this[offset + i] = value & 255;
			while (--i >= 0 && (mul *= 256)) {
				if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) sub = 1;
				this[offset + i] = (value / mul >> 0) - sub & 255;
			}
			return offset + byteLength2;
		};
		Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
			if (value < 0) value = 255 + value + 1;
			this[offset] = value & 255;
			return offset + 1;
		};
		Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
			this[offset] = value & 255;
			this[offset + 1] = value >>> 8;
			return offset + 2;
		};
		Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
			this[offset] = value >>> 8;
			this[offset + 1] = value & 255;
			return offset + 2;
		};
		Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
			this[offset] = value & 255;
			this[offset + 1] = value >>> 8;
			this[offset + 2] = value >>> 16;
			this[offset + 3] = value >>> 24;
			return offset + 4;
		};
		Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
			if (value < 0) value = 4294967295 + value + 1;
			this[offset] = value >>> 24;
			this[offset + 1] = value >>> 16;
			this[offset + 2] = value >>> 8;
			this[offset + 3] = value & 255;
			return offset + 4;
		};
		Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
			return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
		});
		Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
			return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
		});
		function checkIEEE754(buf, value, offset, ext, max, min) {
			if (offset + ext > buf.length) throw new RangeError("Index out of range");
			if (offset < 0) throw new RangeError("Index out of range");
		}
		function writeFloat(buf, value, offset, littleEndian, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
			ieee754.write(buf, value, offset, littleEndian, 23, 4);
			return offset + 4;
		}
		Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
			return writeFloat(this, value, offset, true, noAssert);
		};
		Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
			return writeFloat(this, value, offset, false, noAssert);
		};
		function writeDouble(buf, value, offset, littleEndian, noAssert) {
			value = +value;
			offset = offset >>> 0;
			if (!noAssert) checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
			ieee754.write(buf, value, offset, littleEndian, 52, 8);
			return offset + 8;
		}
		Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
			return writeDouble(this, value, offset, true, noAssert);
		};
		Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
			return writeDouble(this, value, offset, false, noAssert);
		};
		Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
			if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
			if (!start) start = 0;
			if (!end && end !== 0) end = this.length;
			if (targetStart >= target.length) targetStart = target.length;
			if (!targetStart) targetStart = 0;
			if (end > 0 && end < start) end = start;
			if (end === start) return 0;
			if (target.length === 0 || this.length === 0) return 0;
			if (targetStart < 0) throw new RangeError("targetStart out of bounds");
			if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
			if (end < 0) throw new RangeError("sourceEnd out of bounds");
			if (end > this.length) end = this.length;
			if (target.length - targetStart < end - start) end = target.length - targetStart + start;
			const len = end - start;
			if (this === target && typeof Uint8Array.prototype.copyWithin === "function") this.copyWithin(targetStart, start, end);
			else Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
			return len;
		};
		Buffer3.prototype.fill = function fill(val, start, end, encoding) {
			if (typeof val === "string") {
				if (typeof start === "string") {
					encoding = start;
					start = 0;
					end = this.length;
				} else if (typeof end === "string") {
					encoding = end;
					end = this.length;
				}
				if (encoding !== void 0 && typeof encoding !== "string") throw new TypeError("encoding must be a string");
				if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
				if (val.length === 1) {
					const code = val.charCodeAt(0);
					if (encoding === "utf8" && code < 128 || encoding === "latin1") val = code;
				}
			} else if (typeof val === "number") val = val & 255;
			else if (typeof val === "boolean") val = Number(val);
			if (start < 0 || this.length < start || this.length < end) throw new RangeError("Out of range index");
			if (end <= start) return this;
			start = start >>> 0;
			end = end === void 0 ? this.length : end >>> 0;
			if (!val) val = 0;
			let i;
			if (typeof val === "number") for (i = start; i < end; ++i) this[i] = val;
			else {
				const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
				const len = bytes.length;
				if (len === 0) throw new TypeError("The value \"" + val + "\" is invalid for argument \"value\"");
				for (i = 0; i < end - start; ++i) this[i + start] = bytes[i % len];
			}
			return this;
		};
		var errors = {};
		function E(sym, getMessage, Base) {
			errors[sym] = class NodeError extends Base {
				constructor() {
					super();
					Object.defineProperty(this, "message", {
						value: getMessage.apply(this, arguments),
						writable: true,
						configurable: true
					});
					this.name = `${this.name} [${sym}]`;
					this.stack;
					delete this.name;
				}
				get code() {
					return sym;
				}
				set code(value) {
					Object.defineProperty(this, "code", {
						configurable: true,
						enumerable: true,
						value,
						writable: true
					});
				}
				toString() {
					return `${this.name} [${sym}]: ${this.message}`;
				}
			};
		}
		E("ERR_BUFFER_OUT_OF_BOUNDS", function(name) {
			if (name) return `${name} is outside of buffer bounds`;
			return "Attempt to access memory outside buffer bounds";
		}, RangeError);
		E("ERR_INVALID_ARG_TYPE", function(name, actual) {
			return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
		}, TypeError);
		E("ERR_OUT_OF_RANGE", function(str, range, input) {
			let msg = `The value of "${str}" is out of range.`;
			let received = input;
			if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) received = addNumericalSeparator(String(input));
			else if (typeof input === "bigint") {
				received = String(input);
				if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) received = addNumericalSeparator(received);
				received += "n";
			}
			msg += ` It must be ${range}. Received ${received}`;
			return msg;
		}, RangeError);
		function addNumericalSeparator(val) {
			let res = "";
			let i = val.length;
			const start = val[0] === "-" ? 1 : 0;
			for (; i >= start + 4; i -= 3) res = `_${val.slice(i - 3, i)}${res}`;
			return `${val.slice(0, i)}${res}`;
		}
		function checkBounds(buf, offset, byteLength2) {
			validateNumber(offset, "offset");
			if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) boundsError(offset, buf.length - (byteLength2 + 1));
		}
		function checkIntBI(value, min, max, buf, offset, byteLength2) {
			if (value > max || value < min) {
				const n = typeof min === "bigint" ? "n" : "";
				let range;
				if (byteLength2 > 3) if (min === 0 || min === BigInt(0)) range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
				else range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
				else range = `>= ${min}${n} and <= ${max}${n}`;
				throw new errors.ERR_OUT_OF_RANGE("value", range, value);
			}
			checkBounds(buf, offset, byteLength2);
		}
		function validateNumber(value, name) {
			if (typeof value !== "number") throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
		}
		function boundsError(value, length, type) {
			if (Math.floor(value) !== value) {
				validateNumber(value, type);
				throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
			}
			if (length < 0) throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
			throw new errors.ERR_OUT_OF_RANGE(type || "offset", `>= ${type ? 1 : 0} and <= ${length}`, value);
		}
		var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
		function base64clean(str) {
			str = str.split("=")[0];
			str = str.trim().replace(INVALID_BASE64_RE, "");
			if (str.length < 2) return "";
			while (str.length % 4 !== 0) str = str + "=";
			return str;
		}
		function utf8ToBytes(string, units) {
			units = units || Infinity;
			let codePoint;
			const length = string.length;
			let leadSurrogate = null;
			const bytes = [];
			for (let i = 0; i < length; ++i) {
				codePoint = string.charCodeAt(i);
				if (codePoint > 55295 && codePoint < 57344) {
					if (!leadSurrogate) {
						if (codePoint > 56319) {
							if ((units -= 3) > -1) bytes.push(239, 191, 189);
							continue;
						} else if (i + 1 === length) {
							if ((units -= 3) > -1) bytes.push(239, 191, 189);
							continue;
						}
						leadSurrogate = codePoint;
						continue;
					}
					if (codePoint < 56320) {
						if ((units -= 3) > -1) bytes.push(239, 191, 189);
						leadSurrogate = codePoint;
						continue;
					}
					codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
				} else if (leadSurrogate) {
					if ((units -= 3) > -1) bytes.push(239, 191, 189);
				}
				leadSurrogate = null;
				if (codePoint < 128) {
					if ((units -= 1) < 0) break;
					bytes.push(codePoint);
				} else if (codePoint < 2048) {
					if ((units -= 2) < 0) break;
					bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
				} else if (codePoint < 65536) {
					if ((units -= 3) < 0) break;
					bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
				} else if (codePoint < 1114112) {
					if ((units -= 4) < 0) break;
					bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
				} else throw new Error("Invalid code point");
			}
			return bytes;
		}
		function asciiToBytes(str) {
			const byteArray = [];
			for (let i = 0; i < str.length; ++i) byteArray.push(str.charCodeAt(i) & 255);
			return byteArray;
		}
		function utf16leToBytes(str, units) {
			let c, hi, lo;
			const byteArray = [];
			for (let i = 0; i < str.length; ++i) {
				if ((units -= 2) < 0) break;
				c = str.charCodeAt(i);
				hi = c >> 8;
				lo = c % 256;
				byteArray.push(lo);
				byteArray.push(hi);
			}
			return byteArray;
		}
		function base64ToBytes(str) {
			return base64.toByteArray(base64clean(str));
		}
		function blitBuffer(src, dst, offset, length) {
			let i;
			for (i = 0; i < length; ++i) {
				if (i + offset >= dst.length || i >= src.length) break;
				dst[i + offset] = src[i];
			}
			return i;
		}
		function isInstance(obj, type) {
			return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
		}
		function numberIsNaN(obj) {
			return obj !== obj;
		}
		var hexSliceLookupTable = (function() {
			const alphabet = "0123456789abcdef";
			const table = new Array(256);
			for (let i = 0; i < 16; ++i) {
				const i16 = i * 16;
				for (let j = 0; j < 16; ++j) table[i16 + j] = alphabet[i] + alphabet[j];
			}
			return table;
		})();
		function defineBigIntMethod(fn) {
			return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
		}
		function BufferBigIntNotDefined() {
			throw new Error("BigInt not supported");
		}
	} });
	var require_browser = __commonJS({ "../../../node_modules/.pnpm/process@0.11.10/node_modules/process/browser.js"(exports2, module2) {
		init_browser_globals();
		var process = module2.exports = {};
		var cachedSetTimeout;
		var cachedClearTimeout;
		function defaultSetTimout() {
			throw new Error("setTimeout has not been defined");
		}
		function defaultClearTimeout() {
			throw new Error("clearTimeout has not been defined");
		}
		(function() {
			try {
				if (typeof setTimeout === "function") cachedSetTimeout = setTimeout;
				else cachedSetTimeout = defaultSetTimout;
			} catch (e) {
				cachedSetTimeout = defaultSetTimout;
			}
			try {
				if (typeof clearTimeout === "function") cachedClearTimeout = clearTimeout;
				else cachedClearTimeout = defaultClearTimeout;
			} catch (e) {
				cachedClearTimeout = defaultClearTimeout;
			}
		})();
		function runTimeout(fun) {
			if (cachedSetTimeout === setTimeout) return setTimeout(fun, 0);
			if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
				cachedSetTimeout = setTimeout;
				return setTimeout(fun, 0);
			}
			try {
				return cachedSetTimeout(fun, 0);
			} catch (e) {
				try {
					return cachedSetTimeout.call(null, fun, 0);
				} catch (e2) {
					return cachedSetTimeout.call(this, fun, 0);
				}
			}
		}
		function runClearTimeout(marker) {
			if (cachedClearTimeout === clearTimeout) return clearTimeout(marker);
			if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
				cachedClearTimeout = clearTimeout;
				return clearTimeout(marker);
			}
			try {
				return cachedClearTimeout(marker);
			} catch (e) {
				try {
					return cachedClearTimeout.call(null, marker);
				} catch (e2) {
					return cachedClearTimeout.call(this, marker);
				}
			}
		}
		var queue = [];
		var draining = false;
		var currentQueue;
		var queueIndex = -1;
		function cleanUpNextTick() {
			if (!draining || !currentQueue) return;
			draining = false;
			if (currentQueue.length) queue = currentQueue.concat(queue);
			else queueIndex = -1;
			if (queue.length) drainQueue();
		}
		function drainQueue() {
			if (draining) return;
			var timeout = runTimeout(cleanUpNextTick);
			draining = true;
			var len = queue.length;
			while (len) {
				currentQueue = queue;
				queue = [];
				while (++queueIndex < len) if (currentQueue) currentQueue[queueIndex].run();
				queueIndex = -1;
				len = queue.length;
			}
			currentQueue = null;
			draining = false;
			runClearTimeout(timeout);
		}
		process.nextTick = function(fun) {
			var args = new Array(arguments.length - 1);
			if (arguments.length > 1) for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
			queue.push(new Item(fun, args));
			if (queue.length === 1 && !draining) runTimeout(drainQueue);
		};
		function Item(fun, array) {
			this.fun = fun;
			this.array = array;
		}
		Item.prototype.run = function() {
			this.fun.apply(null, this.array);
		};
		process.title = "browser";
		process.browser = true;
		process.env = {};
		process.argv = [];
		process.version = "";
		process.versions = {};
		function noop() {}
		process.on = noop;
		process.addListener = noop;
		process.once = noop;
		process.off = noop;
		process.removeListener = noop;
		process.removeAllListeners = noop;
		process.emit = noop;
		process.prependListener = noop;
		process.prependOnceListener = noop;
		process.listeners = function(name) {
			return [];
		};
		process.binding = function(name) {
			throw new Error("process.binding is not supported");
		};
		process.cwd = function() {
			return "/";
		};
		process.chdir = function(dir) {
			throw new Error("process.chdir is not supported");
		};
		process.umask = function() {
			return 0;
		};
	} });
	var import_buffer;
	var import_browser;
	var init_browser_globals = __esm({ "scripts/browser-globals.js"() {
		"use strict";
		import_buffer = __toESM(require_buffer(), 1);
		import_browser = __toESM(require_browser(), 1);
	} });
	var require_crypto = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/etc/browser/lib/crypto.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var Buffer3 = require_buffer().Buffer;
		function createHash(algorithm) {
			if (algorithm !== "md5") throw new Error("only md5 is supported in the browser");
			return new Hash();
		}
		function Hash() {
			this.data = void 0;
		}
		Hash.prototype.end = function(data) {
			this.data = data;
		};
		Hash.prototype.read = function() {
			return md5(this.data);
		};
		function md5cycle(x, k) {
			var a = x[0], b = x[1], c = x[2], d = x[3];
			a = ff(a, b, c, d, k[0], 7, -680876936);
			d = ff(d, a, b, c, k[1], 12, -389564586);
			c = ff(c, d, a, b, k[2], 17, 606105819);
			b = ff(b, c, d, a, k[3], 22, -1044525330);
			a = ff(a, b, c, d, k[4], 7, -176418897);
			d = ff(d, a, b, c, k[5], 12, 1200080426);
			c = ff(c, d, a, b, k[6], 17, -1473231341);
			b = ff(b, c, d, a, k[7], 22, -45705983);
			a = ff(a, b, c, d, k[8], 7, 1770035416);
			d = ff(d, a, b, c, k[9], 12, -1958414417);
			c = ff(c, d, a, b, k[10], 17, -42063);
			b = ff(b, c, d, a, k[11], 22, -1990404162);
			a = ff(a, b, c, d, k[12], 7, 1804603682);
			d = ff(d, a, b, c, k[13], 12, -40341101);
			c = ff(c, d, a, b, k[14], 17, -1502002290);
			b = ff(b, c, d, a, k[15], 22, 1236535329);
			a = gg(a, b, c, d, k[1], 5, -165796510);
			d = gg(d, a, b, c, k[6], 9, -1069501632);
			c = gg(c, d, a, b, k[11], 14, 643717713);
			b = gg(b, c, d, a, k[0], 20, -373897302);
			a = gg(a, b, c, d, k[5], 5, -701558691);
			d = gg(d, a, b, c, k[10], 9, 38016083);
			c = gg(c, d, a, b, k[15], 14, -660478335);
			b = gg(b, c, d, a, k[4], 20, -405537848);
			a = gg(a, b, c, d, k[9], 5, 568446438);
			d = gg(d, a, b, c, k[14], 9, -1019803690);
			c = gg(c, d, a, b, k[3], 14, -187363961);
			b = gg(b, c, d, a, k[8], 20, 1163531501);
			a = gg(a, b, c, d, k[13], 5, -1444681467);
			d = gg(d, a, b, c, k[2], 9, -51403784);
			c = gg(c, d, a, b, k[7], 14, 1735328473);
			b = gg(b, c, d, a, k[12], 20, -1926607734);
			a = hh(a, b, c, d, k[5], 4, -378558);
			d = hh(d, a, b, c, k[8], 11, -2022574463);
			c = hh(c, d, a, b, k[11], 16, 1839030562);
			b = hh(b, c, d, a, k[14], 23, -35309556);
			a = hh(a, b, c, d, k[1], 4, -1530992060);
			d = hh(d, a, b, c, k[4], 11, 1272893353);
			c = hh(c, d, a, b, k[7], 16, -155497632);
			b = hh(b, c, d, a, k[10], 23, -1094730640);
			a = hh(a, b, c, d, k[13], 4, 681279174);
			d = hh(d, a, b, c, k[0], 11, -358537222);
			c = hh(c, d, a, b, k[3], 16, -722521979);
			b = hh(b, c, d, a, k[6], 23, 76029189);
			a = hh(a, b, c, d, k[9], 4, -640364487);
			d = hh(d, a, b, c, k[12], 11, -421815835);
			c = hh(c, d, a, b, k[15], 16, 530742520);
			b = hh(b, c, d, a, k[2], 23, -995338651);
			a = ii(a, b, c, d, k[0], 6, -198630844);
			d = ii(d, a, b, c, k[7], 10, 1126891415);
			c = ii(c, d, a, b, k[14], 15, -1416354905);
			b = ii(b, c, d, a, k[5], 21, -57434055);
			a = ii(a, b, c, d, k[12], 6, 1700485571);
			d = ii(d, a, b, c, k[3], 10, -1894986606);
			c = ii(c, d, a, b, k[10], 15, -1051523);
			b = ii(b, c, d, a, k[1], 21, -2054922799);
			a = ii(a, b, c, d, k[8], 6, 1873313359);
			d = ii(d, a, b, c, k[15], 10, -30611744);
			c = ii(c, d, a, b, k[6], 15, -1560198380);
			b = ii(b, c, d, a, k[13], 21, 1309151649);
			a = ii(a, b, c, d, k[4], 6, -145523070);
			d = ii(d, a, b, c, k[11], 10, -1120210379);
			c = ii(c, d, a, b, k[2], 15, 718787259);
			b = ii(b, c, d, a, k[9], 21, -343485551);
			x[0] = add32(a, x[0]);
			x[1] = add32(b, x[1]);
			x[2] = add32(c, x[2]);
			x[3] = add32(d, x[3]);
		}
		function cmn(q, a, b, x, s, t) {
			a = add32(add32(a, q), add32(x, t));
			return add32(a << s | a >>> 32 - s, b);
		}
		function ff(a, b, c, d, x, s, t) {
			return cmn(b & c | ~b & d, a, b, x, s, t);
		}
		function gg(a, b, c, d, x, s, t) {
			return cmn(b & d | c & ~d, a, b, x, s, t);
		}
		function hh(a, b, c, d, x, s, t) {
			return cmn(b ^ c ^ d, a, b, x, s, t);
		}
		function ii(a, b, c, d, x, s, t) {
			return cmn(c ^ (b | ~d), a, b, x, s, t);
		}
		function md51(s) {
			var n = s.length, state = [
				1732584193,
				-271733879,
				-1732584194,
				271733878
			], i;
			for (i = 64; i <= s.length; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
			s = s.substring(i - 64);
			var tail = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
			tail[i >> 2] |= 128 << (i % 4 << 3);
			if (i > 55) {
				md5cycle(state, tail);
				for (i = 0; i < 16; i++) tail[i] = 0;
			}
			tail[14] = n * 8;
			md5cycle(state, tail);
			return state;
		}
		function md5blk(s) {
			var md5blks = [], i;
			for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
			return md5blks;
		}
		function md5(s) {
			var arr = md51(s);
			var buf = Buffer3.alloc ? Buffer3.alloc(16) : new Buffer3(16);
			var i;
			for (i = 0; i < 4; i++) buf.writeIntLE(arr[i], i * 4, 4);
			return buf;
		}
		function add32(a, b) {
			return a + b & 4294967295;
		}
		module2.exports = { createHash };
	} });
	var require_shams = __commonJS({ "../../../node_modules/.pnpm/has-symbols@1.1.0/node_modules/has-symbols/shams.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = function hasSymbols() {
			if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") return false;
			if (typeof Symbol.iterator === "symbol") return true;
			var obj = {};
			var sym = /* @__PURE__ */ Symbol("test");
			var symObj = Object(sym);
			if (typeof sym === "string") return false;
			if (Object.prototype.toString.call(sym) !== "[object Symbol]") return false;
			if (Object.prototype.toString.call(symObj) !== "[object Symbol]") return false;
			var symVal = 42;
			obj[sym] = symVal;
			for (var _ in obj) return false;
			if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) return false;
			if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) return false;
			var syms = Object.getOwnPropertySymbols(obj);
			if (syms.length !== 1 || syms[0] !== sym) return false;
			if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) return false;
			if (typeof Object.getOwnPropertyDescriptor === "function") {
				var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
				if (descriptor.value !== symVal || descriptor.enumerable !== true) return false;
			}
			return true;
		};
	} });
	var require_shams2 = __commonJS({ "../../../node_modules/.pnpm/has-tostringtag@1.0.2/node_modules/has-tostringtag/shams.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var hasSymbols = require_shams();
		module2.exports = function hasToStringTagShams() {
			return hasSymbols() && !!Symbol.toStringTag;
		};
	} });
	var require_es_object_atoms = __commonJS({ "../../../node_modules/.pnpm/es-object-atoms@1.1.2/node_modules/es-object-atoms/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Object;
	} });
	var require_es_errors = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Error;
	} });
	var require_eval = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/eval.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = EvalError;
	} });
	var require_range = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/range.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = RangeError;
	} });
	var require_ref = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/ref.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = ReferenceError;
	} });
	var require_syntax = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/syntax.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = SyntaxError;
	} });
	var require_type = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/type.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = TypeError;
	} });
	var require_uri = __commonJS({ "../../../node_modules/.pnpm/es-errors@1.3.0/node_modules/es-errors/uri.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = URIError;
	} });
	var require_abs = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/abs.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Math.abs;
	} });
	var require_floor = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/floor.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Math.floor;
	} });
	var require_max = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/max.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Math.max;
	} });
	var require_min = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/min.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Math.min;
	} });
	var require_pow = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/pow.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Math.pow;
	} });
	var require_round = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/round.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Math.round;
	} });
	var require_isNaN = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/isNaN.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Number.isNaN || function isNaN2(a) {
			return a !== a;
		};
	} });
	var require_sign = __commonJS({ "../../../node_modules/.pnpm/math-intrinsics@1.1.0/node_modules/math-intrinsics/sign.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var $isNaN = require_isNaN();
		module2.exports = function sign(number) {
			if ($isNaN(number) || number === 0) return number;
			return number < 0 ? -1 : 1;
		};
	} });
	var require_gOPD = __commonJS({ "../../../node_modules/.pnpm/gopd@1.2.0/node_modules/gopd/gOPD.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Object.getOwnPropertyDescriptor;
	} });
	var require_gopd = __commonJS({ "../../../node_modules/.pnpm/gopd@1.2.0/node_modules/gopd/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var $gOPD = require_gOPD();
		if ($gOPD) try {
			$gOPD([], "length");
		} catch (e) {
			$gOPD = null;
		}
		module2.exports = $gOPD;
	} });
	var require_es_define_property = __commonJS({ "../../../node_modules/.pnpm/es-define-property@1.0.1/node_modules/es-define-property/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var $defineProperty = Object.defineProperty || false;
		if ($defineProperty) try {
			$defineProperty({}, "a", { value: 1 });
		} catch (e) {
			$defineProperty = false;
		}
		module2.exports = $defineProperty;
	} });
	var require_has_symbols = __commonJS({ "../../../node_modules/.pnpm/has-symbols@1.1.0/node_modules/has-symbols/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var origSymbol = typeof Symbol !== "undefined" && Symbol;
		var hasSymbolSham = require_shams();
		module2.exports = function hasNativeSymbols() {
			if (typeof origSymbol !== "function") return false;
			if (typeof Symbol !== "function") return false;
			if (typeof origSymbol("foo") !== "symbol") return false;
			if (typeof /* @__PURE__ */ Symbol("bar") !== "symbol") return false;
			return hasSymbolSham();
		};
	} });
	var require_Reflect_getPrototypeOf = __commonJS({ "../../../node_modules/.pnpm/get-proto@1.0.1/node_modules/get-proto/Reflect.getPrototypeOf.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
	} });
	var require_es_object_atoms2 = __commonJS({ "../../../node_modules/.pnpm/es-object-atoms@1.1.1/node_modules/es-object-atoms/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Object;
	} });
	var require_Object_getPrototypeOf = __commonJS({ "../../../node_modules/.pnpm/get-proto@1.0.1/node_modules/get-proto/Object.getPrototypeOf.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = require_es_object_atoms2().getPrototypeOf || null;
	} });
	var require_implementation = __commonJS({ "../../../node_modules/.pnpm/function-bind@1.1.2/node_modules/function-bind/implementation.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
		var toStr = Object.prototype.toString;
		var max = Math.max;
		var funcType = "[object Function]";
		var concatty = function concatty2(a, b) {
			var arr = [];
			for (var i = 0; i < a.length; i += 1) arr[i] = a[i];
			for (var j = 0; j < b.length; j += 1) arr[j + a.length] = b[j];
			return arr;
		};
		var slicy = function slicy2(arrLike, offset) {
			var arr = [];
			for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) arr[j] = arrLike[i];
			return arr;
		};
		var joiny = function(arr, joiner) {
			var str = "";
			for (var i = 0; i < arr.length; i += 1) {
				str += arr[i];
				if (i + 1 < arr.length) str += joiner;
			}
			return str;
		};
		module2.exports = function bind(that) {
			var target = this;
			if (typeof target !== "function" || toStr.apply(target) !== funcType) throw new TypeError(ERROR_MESSAGE + target);
			var args = slicy(arguments, 1);
			var bound;
			var binder = function() {
				if (this instanceof bound) {
					var result = target.apply(this, concatty(args, arguments));
					if (Object(result) === result) return result;
					return this;
				}
				return target.apply(that, concatty(args, arguments));
			};
			var boundLength = max(0, target.length - args.length);
			var boundArgs = [];
			for (var i = 0; i < boundLength; i++) boundArgs[i] = "$" + i;
			bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
			if (target.prototype) {
				var Empty = function Empty2() {};
				Empty.prototype = target.prototype;
				bound.prototype = new Empty();
				Empty.prototype = null;
			}
			return bound;
		};
	} });
	var require_function_bind = __commonJS({ "../../../node_modules/.pnpm/function-bind@1.1.2/node_modules/function-bind/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var implementation = require_implementation();
		module2.exports = Function.prototype.bind || implementation;
	} });
	var require_functionCall = __commonJS({ "../../../node_modules/.pnpm/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/functionCall.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Function.prototype.call;
	} });
	var require_functionApply = __commonJS({ "../../../node_modules/.pnpm/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/functionApply.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Function.prototype.apply;
	} });
	var require_reflectApply = __commonJS({ "../../../node_modules/.pnpm/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/reflectApply.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
	} });
	var require_actualApply = __commonJS({ "../../../node_modules/.pnpm/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/actualApply.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var bind = require_function_bind();
		var $apply = require_functionApply();
		var $call = require_functionCall();
		module2.exports = require_reflectApply() || bind.call($call, $apply);
	} });
	var require_call_bind_apply_helpers = __commonJS({ "../../../node_modules/.pnpm/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var bind = require_function_bind();
		var $TypeError = require_type();
		var $call = require_functionCall();
		var $actualApply = require_actualApply();
		module2.exports = function callBindBasic(args) {
			if (args.length < 1 || typeof args[0] !== "function") throw new $TypeError("a function is required");
			return $actualApply(bind, $call, args);
		};
	} });
	var require_get = __commonJS({ "../../../node_modules/.pnpm/dunder-proto@1.0.1/node_modules/dunder-proto/get.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var callBind = require_call_bind_apply_helpers();
		var gOPD = require_gopd();
		var hasProtoAccessor;
		try {
			hasProtoAccessor = [].__proto__ === Array.prototype;
		} catch (e) {
			if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") throw e;
		}
		var desc = !!hasProtoAccessor && gOPD && gOPD(
			Object.prototype,
			/** @type {keyof typeof Object.prototype} */
			"__proto__"
		);
		var $Object = Object;
		var $getPrototypeOf = $Object.getPrototypeOf;
		module2.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? (
		/** @type {import('./get')} */
		function getDunder(value) {
			return $getPrototypeOf(value == null ? value : $Object(value));
		}) : false;
	} });
	var require_get_proto = __commonJS({ "../../../node_modules/.pnpm/get-proto@1.0.1/node_modules/get-proto/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var reflectGetProto = require_Reflect_getPrototypeOf();
		var originalGetProto = require_Object_getPrototypeOf();
		var getDunderProto = require_get();
		module2.exports = reflectGetProto ? function getProto(O) {
			return reflectGetProto(O);
		} : originalGetProto ? function getProto(O) {
			if (!O || typeof O !== "object" && typeof O !== "function") throw new TypeError("getProto: not an object");
			return originalGetProto(O);
		} : getDunderProto ? function getProto(O) {
			return getDunderProto(O);
		} : null;
	} });
	var require_hasown = __commonJS({ "../../../node_modules/.pnpm/hasown@2.0.4/node_modules/hasown/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var call = Function.prototype.call;
		var $hasOwn = Object.prototype.hasOwnProperty;
		module2.exports = require_function_bind().call(call, $hasOwn);
	} });
	var require_get_intrinsic = __commonJS({ "../../../node_modules/.pnpm/get-intrinsic@1.3.0/node_modules/get-intrinsic/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var undefined2;
		var $Object = require_es_object_atoms();
		var $Error = require_es_errors();
		var $EvalError = require_eval();
		var $RangeError = require_range();
		var $ReferenceError = require_ref();
		var $SyntaxError = require_syntax();
		var $TypeError = require_type();
		var $URIError = require_uri();
		var abs = require_abs();
		var floor = require_floor();
		var max = require_max();
		var min = require_min();
		var pow = require_pow();
		var round = require_round();
		var sign = require_sign();
		var $Function = Function;
		var getEvalledConstructor = function(expressionSyntax) {
			try {
				return $Function("\"use strict\"; return (" + expressionSyntax + ").constructor;")();
			} catch (e) {}
		};
		var $gOPD = require_gopd();
		var $defineProperty = require_es_define_property();
		var throwTypeError = function() {
			throw new $TypeError();
		};
		var ThrowTypeError = $gOPD ? (function() {
			try {
				arguments.callee;
				return throwTypeError;
			} catch (calleeThrows) {
				try {
					return $gOPD(arguments, "callee").get;
				} catch (gOPDthrows) {
					return throwTypeError;
				}
			}
		})() : throwTypeError;
		var hasSymbols = require_has_symbols()();
		var getProto = require_get_proto();
		var $ObjectGPO = require_Object_getPrototypeOf();
		var $ReflectGPO = require_Reflect_getPrototypeOf();
		var $apply = require_functionApply();
		var $call = require_functionCall();
		var needsEval = {};
		var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
		var INTRINSICS = {
			__proto__: null,
			"%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
			"%Array%": Array,
			"%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
			"%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
			"%AsyncFromSyncIteratorPrototype%": undefined2,
			"%AsyncFunction%": needsEval,
			"%AsyncGenerator%": needsEval,
			"%AsyncGeneratorFunction%": needsEval,
			"%AsyncIteratorPrototype%": needsEval,
			"%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
			"%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
			"%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
			"%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
			"%Boolean%": Boolean,
			"%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
			"%Date%": Date,
			"%decodeURI%": decodeURI,
			"%decodeURIComponent%": decodeURIComponent,
			"%encodeURI%": encodeURI,
			"%encodeURIComponent%": encodeURIComponent,
			"%Error%": $Error,
			"%eval%": eval,
			"%EvalError%": $EvalError,
			"%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array,
			"%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
			"%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
			"%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
			"%Function%": $Function,
			"%GeneratorFunction%": needsEval,
			"%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
			"%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
			"%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
			"%isFinite%": isFinite,
			"%isNaN%": isNaN,
			"%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
			"%JSON%": typeof JSON === "object" ? JSON : undefined2,
			"%Map%": typeof Map === "undefined" ? undefined2 : Map,
			"%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
			"%Math%": Math,
			"%Number%": Number,
			"%Object%": $Object,
			"%Object.getOwnPropertyDescriptor%": $gOPD,
			"%parseFloat%": parseFloat,
			"%parseInt%": parseInt,
			"%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
			"%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
			"%RangeError%": $RangeError,
			"%ReferenceError%": $ReferenceError,
			"%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
			"%RegExp%": RegExp,
			"%Set%": typeof Set === "undefined" ? undefined2 : Set,
			"%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
			"%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
			"%String%": String,
			"%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
			"%Symbol%": hasSymbols ? Symbol : undefined2,
			"%SyntaxError%": $SyntaxError,
			"%ThrowTypeError%": ThrowTypeError,
			"%TypedArray%": TypedArray,
			"%TypeError%": $TypeError,
			"%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
			"%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
			"%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
			"%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
			"%URIError%": $URIError,
			"%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
			"%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
			"%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet,
			"%Function.prototype.call%": $call,
			"%Function.prototype.apply%": $apply,
			"%Object.defineProperty%": $defineProperty,
			"%Object.getPrototypeOf%": $ObjectGPO,
			"%Math.abs%": abs,
			"%Math.floor%": floor,
			"%Math.max%": max,
			"%Math.min%": min,
			"%Math.pow%": pow,
			"%Math.round%": round,
			"%Math.sign%": sign,
			"%Reflect.getPrototypeOf%": $ReflectGPO
		};
		if (getProto) try {
			null.error;
		} catch (e) {
			errorProto = getProto(getProto(e));
			INTRINSICS["%Error.prototype%"] = errorProto;
		}
		var errorProto;
		var doEval = function doEval2(name) {
			var value;
			if (name === "%AsyncFunction%") value = getEvalledConstructor("async function () {}");
			else if (name === "%GeneratorFunction%") value = getEvalledConstructor("function* () {}");
			else if (name === "%AsyncGeneratorFunction%") value = getEvalledConstructor("async function* () {}");
			else if (name === "%AsyncGenerator%") {
				var fn = doEval2("%AsyncGeneratorFunction%");
				if (fn) value = fn.prototype;
			} else if (name === "%AsyncIteratorPrototype%") {
				var gen = doEval2("%AsyncGenerator%");
				if (gen && getProto) value = getProto(gen.prototype);
			}
			INTRINSICS[name] = value;
			return value;
		};
		var LEGACY_ALIASES = {
			__proto__: null,
			"%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
			"%ArrayPrototype%": ["Array", "prototype"],
			"%ArrayProto_entries%": [
				"Array",
				"prototype",
				"entries"
			],
			"%ArrayProto_forEach%": [
				"Array",
				"prototype",
				"forEach"
			],
			"%ArrayProto_keys%": [
				"Array",
				"prototype",
				"keys"
			],
			"%ArrayProto_values%": [
				"Array",
				"prototype",
				"values"
			],
			"%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
			"%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
			"%AsyncGeneratorPrototype%": [
				"AsyncGeneratorFunction",
				"prototype",
				"prototype"
			],
			"%BooleanPrototype%": ["Boolean", "prototype"],
			"%DataViewPrototype%": ["DataView", "prototype"],
			"%DatePrototype%": ["Date", "prototype"],
			"%ErrorPrototype%": ["Error", "prototype"],
			"%EvalErrorPrototype%": ["EvalError", "prototype"],
			"%Float32ArrayPrototype%": ["Float32Array", "prototype"],
			"%Float64ArrayPrototype%": ["Float64Array", "prototype"],
			"%FunctionPrototype%": ["Function", "prototype"],
			"%Generator%": ["GeneratorFunction", "prototype"],
			"%GeneratorPrototype%": [
				"GeneratorFunction",
				"prototype",
				"prototype"
			],
			"%Int8ArrayPrototype%": ["Int8Array", "prototype"],
			"%Int16ArrayPrototype%": ["Int16Array", "prototype"],
			"%Int32ArrayPrototype%": ["Int32Array", "prototype"],
			"%JSONParse%": ["JSON", "parse"],
			"%JSONStringify%": ["JSON", "stringify"],
			"%MapPrototype%": ["Map", "prototype"],
			"%NumberPrototype%": ["Number", "prototype"],
			"%ObjectPrototype%": ["Object", "prototype"],
			"%ObjProto_toString%": [
				"Object",
				"prototype",
				"toString"
			],
			"%ObjProto_valueOf%": [
				"Object",
				"prototype",
				"valueOf"
			],
			"%PromisePrototype%": ["Promise", "prototype"],
			"%PromiseProto_then%": [
				"Promise",
				"prototype",
				"then"
			],
			"%Promise_all%": ["Promise", "all"],
			"%Promise_reject%": ["Promise", "reject"],
			"%Promise_resolve%": ["Promise", "resolve"],
			"%RangeErrorPrototype%": ["RangeError", "prototype"],
			"%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
			"%RegExpPrototype%": ["RegExp", "prototype"],
			"%SetPrototype%": ["Set", "prototype"],
			"%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
			"%StringPrototype%": ["String", "prototype"],
			"%SymbolPrototype%": ["Symbol", "prototype"],
			"%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
			"%TypedArrayPrototype%": ["TypedArray", "prototype"],
			"%TypeErrorPrototype%": ["TypeError", "prototype"],
			"%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
			"%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
			"%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
			"%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
			"%URIErrorPrototype%": ["URIError", "prototype"],
			"%WeakMapPrototype%": ["WeakMap", "prototype"],
			"%WeakSetPrototype%": ["WeakSet", "prototype"]
		};
		var bind = require_function_bind();
		var hasOwn = require_hasown();
		var $concat = bind.call($call, Array.prototype.concat);
		var $spliceApply = bind.call($apply, Array.prototype.splice);
		var $replace = bind.call($call, String.prototype.replace);
		var $strSlice = bind.call($call, String.prototype.slice);
		var $exec = bind.call($call, RegExp.prototype.exec);
		var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
		var reEscapeChar = /\\(\\)?/g;
		var stringToPath = function stringToPath2(string) {
			var first = $strSlice(string, 0, 1);
			var last = $strSlice(string, -1);
			if (first === "%" && last !== "%") throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
			else if (last === "%" && first !== "%") throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
			var result = [];
			$replace(string, rePropName, function(match, number, quote, subString) {
				result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
			});
			return result;
		};
		var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
			var intrinsicName = name;
			var alias;
			if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
				alias = LEGACY_ALIASES[intrinsicName];
				intrinsicName = "%" + alias[0] + "%";
			}
			if (hasOwn(INTRINSICS, intrinsicName)) {
				var value = INTRINSICS[intrinsicName];
				if (value === needsEval) value = doEval(intrinsicName);
				if (typeof value === "undefined" && !allowMissing) throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
				return {
					alias,
					name: intrinsicName,
					value
				};
			}
			throw new $SyntaxError("intrinsic " + name + " does not exist!");
		};
		module2.exports = function GetIntrinsic(name, allowMissing) {
			if (typeof name !== "string" || name.length === 0) throw new $TypeError("intrinsic name must be a non-empty string");
			if (arguments.length > 1 && typeof allowMissing !== "boolean") throw new $TypeError("\"allowMissing\" argument must be a boolean");
			if ($exec(/^%?[^%]*%?$/, name) === null) throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
			var parts = stringToPath(name);
			var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
			var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
			var intrinsicRealName = intrinsic.name;
			var value = intrinsic.value;
			var skipFurtherCaching = false;
			var alias = intrinsic.alias;
			if (alias) {
				intrinsicBaseName = alias[0];
				$spliceApply(parts, $concat([0, 1], alias));
			}
			for (var i = 1, isOwn = true; i < parts.length; i += 1) {
				var part = parts[i];
				var first = $strSlice(part, 0, 1);
				var last = $strSlice(part, -1);
				if ((first === "\"" || first === "'" || first === "`" || last === "\"" || last === "'" || last === "`") && first !== last) throw new $SyntaxError("property names with quotes must have matching quotes");
				if (part === "constructor" || !isOwn) skipFurtherCaching = true;
				intrinsicBaseName += "." + part;
				intrinsicRealName = "%" + intrinsicBaseName + "%";
				if (hasOwn(INTRINSICS, intrinsicRealName)) value = INTRINSICS[intrinsicRealName];
				else if (value != null) {
					if (!(part in value)) {
						if (!allowMissing) throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
						return;
					}
					if ($gOPD && i + 1 >= parts.length) {
						var desc = $gOPD(value, part);
						isOwn = !!desc;
						if (isOwn && "get" in desc && !("originalValue" in desc.get)) value = desc.get;
						else value = value[part];
					} else {
						isOwn = hasOwn(value, part);
						value = value[part];
					}
					if (isOwn && !skipFurtherCaching) INTRINSICS[intrinsicRealName] = value;
				}
			}
			return value;
		};
	} });
	var require_call_bound = __commonJS({ "../../../node_modules/.pnpm/call-bound@1.0.4/node_modules/call-bound/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var GetIntrinsic = require_get_intrinsic();
		var callBindBasic = require_call_bind_apply_helpers();
		var $indexOf = callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
		module2.exports = function callBoundIntrinsic(name, allowMissing) {
			var intrinsic = GetIntrinsic(name, !!allowMissing);
			if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) return callBindBasic(
				/** @type {const} */
				[intrinsic]
			);
			return intrinsic;
		};
	} });
	var require_is_arguments = __commonJS({ "../../../node_modules/.pnpm/is-arguments@1.2.0/node_modules/is-arguments/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var hasToStringTag = require_shams2()();
		var $toString = require_call_bound()("Object.prototype.toString");
		var isStandardArguments = function isArguments(value) {
			if (hasToStringTag && value && typeof value === "object" && Symbol.toStringTag in value) return false;
			return $toString(value) === "[object Arguments]";
		};
		var isLegacyArguments = function isArguments(value) {
			if (isStandardArguments(value)) return true;
			return value !== null && typeof value === "object" && "length" in value && typeof value.length === "number" && value.length >= 0 && $toString(value) !== "[object Array]" && "callee" in value && $toString(value.callee) === "[object Function]";
		};
		var supportsStandardArguments = (function() {
			return isStandardArguments(arguments);
		})();
		isStandardArguments.isLegacyArguments = isLegacyArguments;
		module2.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;
	} });
	var require_is_regex = __commonJS({ "../../../node_modules/.pnpm/is-regex@1.2.1/node_modules/is-regex/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var callBound = require_call_bound();
		var hasToStringTag = require_shams2()();
		var hasOwn = require_hasown();
		var gOPD = require_gopd();
		var fn;
		if (hasToStringTag) {
			$exec = callBound("RegExp.prototype.exec");
			isRegexMarker = {};
			throwRegexMarker = function() {
				throw isRegexMarker;
			};
			badStringifier = {
				toString: throwRegexMarker,
				valueOf: throwRegexMarker
			};
			if (typeof Symbol.toPrimitive === "symbol") badStringifier[Symbol.toPrimitive] = throwRegexMarker;
			fn = function isRegex(value) {
				if (!value || typeof value !== "object") return false;
				var descriptor = gOPD(
					/** @type {{ lastIndex?: unknown }} */
					value,
					"lastIndex"
				);
				if (!(descriptor && hasOwn(descriptor, "value"))) return false;
				try {
					$exec(
						value,
						/** @type {string} */
						/** @type {unknown} */
						badStringifier
					);
				} catch (e) {
					return e === isRegexMarker;
				}
			};
		} else {
			$toString = callBound("Object.prototype.toString");
			regexClass = "[object RegExp]";
			fn = function isRegex(value) {
				if (!value || typeof value !== "object" && typeof value !== "function") return false;
				return $toString(value) === regexClass;
			};
		}
		var $exec;
		var isRegexMarker;
		var throwRegexMarker;
		var badStringifier;
		var $toString;
		var regexClass;
		module2.exports = fn;
	} });
	var require_safe_regex_test = __commonJS({ "../../../node_modules/.pnpm/safe-regex-test@1.1.0/node_modules/safe-regex-test/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var callBound = require_call_bound();
		var isRegex = require_is_regex();
		var $exec = callBound("RegExp.prototype.exec");
		var $TypeError = require_type();
		module2.exports = function regexTester(regex) {
			if (!isRegex(regex)) throw new $TypeError("`regex` must be a RegExp");
			return function test(s) {
				return $exec(regex, s) !== null;
			};
		};
	} });
	var require_generator_function = __commonJS({ "../../../node_modules/.pnpm/generator-function@2.0.1/node_modules/generator-function/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var cached = function* () {}.constructor;
		module2.exports = () => cached;
	} });
	var require_is_generator_function = __commonJS({ "../../../node_modules/.pnpm/is-generator-function@1.1.2/node_modules/is-generator-function/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var callBound = require_call_bound();
		var isFnRegex = require_safe_regex_test()(/^\s*(?:function)?\*/);
		var hasToStringTag = require_shams2()();
		var getProto = require_get_proto();
		var toStr = callBound("Object.prototype.toString");
		var fnToStr = callBound("Function.prototype.toString");
		var getGeneratorFunction = require_generator_function();
		module2.exports = function isGeneratorFunction(fn) {
			if (typeof fn !== "function") return false;
			if (isFnRegex(fnToStr(fn))) return true;
			if (!hasToStringTag) return toStr(fn) === "[object GeneratorFunction]";
			if (!getProto) return false;
			var GeneratorFunction = getGeneratorFunction();
			return GeneratorFunction && getProto(fn) === GeneratorFunction.prototype;
		};
	} });
	var require_is_callable = __commonJS({ "../../../node_modules/.pnpm/is-callable@1.2.7/node_modules/is-callable/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var fnToStr = Function.prototype.toString;
		var reflectApply = typeof Reflect === "object" && Reflect !== null && Reflect.apply;
		var badArrayLike;
		var isCallableMarker;
		if (typeof reflectApply === "function" && typeof Object.defineProperty === "function") try {
			badArrayLike = Object.defineProperty({}, "length", { get: function() {
				throw isCallableMarker;
			} });
			isCallableMarker = {};
			reflectApply(function() {
				throw 42;
			}, null, badArrayLike);
		} catch (_) {
			if (_ !== isCallableMarker) reflectApply = null;
		}
		else reflectApply = null;
		var constructorRegex = /^\s*class\b/;
		var isES6ClassFn = function isES6ClassFunction(value) {
			try {
				var fnStr = fnToStr.call(value);
				return constructorRegex.test(fnStr);
			} catch (e) {
				return false;
			}
		};
		var tryFunctionObject = function tryFunctionToStr(value) {
			try {
				if (isES6ClassFn(value)) return false;
				fnToStr.call(value);
				return true;
			} catch (e) {
				return false;
			}
		};
		var toStr = Object.prototype.toString;
		var objectClass = "[object Object]";
		var fnClass = "[object Function]";
		var genClass = "[object GeneratorFunction]";
		var ddaClass = "[object HTMLAllCollection]";
		var ddaClass2 = "[object HTML document.all class]";
		var ddaClass3 = "[object HTMLCollection]";
		var hasToStringTag = typeof Symbol === "function" && !!Symbol.toStringTag;
		var isIE68 = !(0 in [,]);
		var isDDA = function isDocumentDotAll() {
			return false;
		};
		if (typeof document === "object") {
			all = document.all;
			if (toStr.call(all) === toStr.call(document.all)) isDDA = function isDocumentDotAll(value) {
				if ((isIE68 || !value) && (typeof value === "undefined" || typeof value === "object")) try {
					var str = toStr.call(value);
					return (str === ddaClass || str === ddaClass2 || str === ddaClass3 || str === objectClass) && value("") == null;
				} catch (e) {}
				return false;
			};
		}
		var all;
		module2.exports = reflectApply ? function isCallable(value) {
			if (isDDA(value)) return true;
			if (!value) return false;
			if (typeof value !== "function" && typeof value !== "object") return false;
			try {
				reflectApply(value, null, badArrayLike);
			} catch (e) {
				if (e !== isCallableMarker) return false;
			}
			return !isES6ClassFn(value) && tryFunctionObject(value);
		} : function isCallable(value) {
			if (isDDA(value)) return true;
			if (!value) return false;
			if (typeof value !== "function" && typeof value !== "object") return false;
			if (hasToStringTag) return tryFunctionObject(value);
			if (isES6ClassFn(value)) return false;
			var strClass = toStr.call(value);
			if (strClass !== fnClass && strClass !== genClass && !/^\[object HTML/.test(strClass)) return false;
			return tryFunctionObject(value);
		};
	} });
	var require_for_each = __commonJS({ "../../../node_modules/.pnpm/for-each@0.3.5/node_modules/for-each/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var isCallable = require_is_callable();
		var toStr = Object.prototype.toString;
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		var forEachArray = function forEachArray2(array, iterator, receiver) {
			for (var i = 0, len = array.length; i < len; i++) if (hasOwnProperty.call(array, i)) if (receiver == null) iterator(array[i], i, array);
			else iterator.call(receiver, array[i], i, array);
		};
		var forEachString = function forEachString2(string, iterator, receiver) {
			for (var i = 0, len = string.length; i < len; i++) if (receiver == null) iterator(string.charAt(i), i, string);
			else iterator.call(receiver, string.charAt(i), i, string);
		};
		var forEachObject = function forEachObject2(object, iterator, receiver) {
			for (var k in object) if (hasOwnProperty.call(object, k)) if (receiver == null) iterator(object[k], k, object);
			else iterator.call(receiver, object[k], k, object);
		};
		function isArray(x) {
			return toStr.call(x) === "[object Array]";
		}
		module2.exports = function forEach(list, iterator, thisArg) {
			if (!isCallable(iterator)) throw new TypeError("iterator must be a function");
			var receiver;
			if (arguments.length >= 3) receiver = thisArg;
			if (isArray(list)) forEachArray(list, iterator, receiver);
			else if (typeof list === "string") forEachString(list, iterator, receiver);
			else forEachObject(list, iterator, receiver);
		};
	} });
	var require_possible_typed_array_names = __commonJS({ "../../../node_modules/.pnpm/possible-typed-array-names@1.1.0/node_modules/possible-typed-array-names/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = [
			"Float16Array",
			"Float32Array",
			"Float64Array",
			"Int8Array",
			"Int16Array",
			"Int32Array",
			"Uint8Array",
			"Uint8ClampedArray",
			"Uint16Array",
			"Uint32Array",
			"BigInt64Array",
			"BigUint64Array"
		];
	} });
	var require_available_typed_arrays = __commonJS({ "../../../node_modules/.pnpm/available-typed-arrays@1.0.7/node_modules/available-typed-arrays/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var possibleNames = require_possible_typed_array_names();
		var g = typeof globalThis === "undefined" ? globalThis : globalThis;
		module2.exports = function availableTypedArrays() {
			var out = [];
			for (var i = 0; i < possibleNames.length; i++) if (typeof g[possibleNames[i]] === "function") out[out.length] = possibleNames[i];
			return out;
		};
	} });
	var require_define_data_property = __commonJS({ "../../../node_modules/.pnpm/define-data-property@1.1.4/node_modules/define-data-property/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var $defineProperty = require_es_define_property();
		var $SyntaxError = require_syntax();
		var $TypeError = require_type();
		var gopd = require_gopd();
		module2.exports = function defineDataProperty(obj, property, value) {
			if (!obj || typeof obj !== "object" && typeof obj !== "function") throw new $TypeError("`obj` must be an object or a function`");
			if (typeof property !== "string" && typeof property !== "symbol") throw new $TypeError("`property` must be a string or a symbol`");
			if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null) throw new $TypeError("`nonEnumerable`, if provided, must be a boolean or null");
			if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null) throw new $TypeError("`nonWritable`, if provided, must be a boolean or null");
			if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null) throw new $TypeError("`nonConfigurable`, if provided, must be a boolean or null");
			if (arguments.length > 6 && typeof arguments[6] !== "boolean") throw new $TypeError("`loose`, if provided, must be a boolean");
			var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
			var nonWritable = arguments.length > 4 ? arguments[4] : null;
			var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
			var loose = arguments.length > 6 ? arguments[6] : false;
			var desc = !!gopd && gopd(obj, property);
			if ($defineProperty) $defineProperty(obj, property, {
				configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
				enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
				value,
				writable: nonWritable === null && desc ? desc.writable : !nonWritable
			});
			else if (loose || !nonEnumerable && !nonWritable && !nonConfigurable) obj[property] = value;
			else throw new $SyntaxError("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
		};
	} });
	var require_has_property_descriptors = __commonJS({ "../../../node_modules/.pnpm/has-property-descriptors@1.0.2/node_modules/has-property-descriptors/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var $defineProperty = require_es_define_property();
		var hasPropertyDescriptors = function hasPropertyDescriptors2() {
			return !!$defineProperty;
		};
		hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
			if (!$defineProperty) return null;
			try {
				return $defineProperty([], "length", { value: 1 }).length !== 1;
			} catch (e) {
				return true;
			}
		};
		module2.exports = hasPropertyDescriptors;
	} });
	var require_set_function_length = __commonJS({ "../../../node_modules/.pnpm/set-function-length@1.2.2/node_modules/set-function-length/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var GetIntrinsic = require_get_intrinsic();
		var define = require_define_data_property();
		var hasDescriptors = require_has_property_descriptors()();
		var gOPD = require_gopd();
		var $TypeError = require_type();
		var $floor = GetIntrinsic("%Math.floor%");
		module2.exports = function setFunctionLength(fn, length) {
			if (typeof fn !== "function") throw new $TypeError("`fn` is not a function");
			if (typeof length !== "number" || length < 0 || length > 4294967295 || $floor(length) !== length) throw new $TypeError("`length` must be a positive 32-bit integer");
			var loose = arguments.length > 2 && !!arguments[2];
			var functionLengthIsConfigurable = true;
			var functionLengthIsWritable = true;
			if ("length" in fn && gOPD) {
				var desc = gOPD(fn, "length");
				if (desc && !desc.configurable) functionLengthIsConfigurable = false;
				if (desc && !desc.writable) functionLengthIsWritable = false;
			}
			if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) if (hasDescriptors) define(
				/** @type {Parameters<define>[0]} */
				fn,
				"length",
				length,
				true,
				true
			);
			else define(
				/** @type {Parameters<define>[0]} */
				fn,
				"length",
				length
			);
			return fn;
		};
	} });
	var require_applyBind = __commonJS({ "../../../node_modules/.pnpm/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/applyBind.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var bind = require_function_bind();
		var $apply = require_functionApply();
		var actualApply = require_actualApply();
		module2.exports = function applyBind() {
			return actualApply(bind, $apply, arguments);
		};
	} });
	var require_call_bind = __commonJS({ "../../../node_modules/.pnpm/call-bind@1.0.9/node_modules/call-bind/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var setFunctionLength = require_set_function_length();
		var $defineProperty = require_es_define_property();
		var callBindBasic = require_call_bind_apply_helpers();
		var applyBind = require_applyBind();
		module2.exports = function callBind(originalFunction) {
			var func = callBindBasic(arguments);
			var adjustedLength = 1 + originalFunction.length - (arguments.length - 1);
			return setFunctionLength(func, adjustedLength > 0 ? adjustedLength : 0, true);
		};
		if ($defineProperty) $defineProperty(module2.exports, "apply", { value: applyBind });
		else module2.exports.apply = applyBind;
	} });
	var require_which_typed_array = __commonJS({ "../../../node_modules/.pnpm/which-typed-array@1.1.22/node_modules/which-typed-array/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var forEach = require_for_each();
		var availableTypedArrays = require_available_typed_arrays();
		var callBind = require_call_bind();
		var callBound = require_call_bound();
		var gOPD = require_gopd();
		var getProto = require_get_proto();
		var $toString = callBound("Object.prototype.toString");
		var hasToStringTag = require_shams2()();
		var g = typeof globalThis === "undefined" ? globalThis : globalThis;
		var typedArrays = availableTypedArrays();
		var $slice = callBound("String.prototype.slice");
		var $indexOf = callBound("Array.prototype.indexOf", true) || function indexOf(array, value) {
			for (var i = 0; i < array.length; i += 1) if (array[i] === value) return i;
			return -1;
		};
		var cache = { __proto__: null };
		if (hasToStringTag && gOPD && getProto) forEach(typedArrays, function(typedArray) {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr && getProto) {
				var proto = getProto(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor && proto) descriptor = gOPD(getProto(proto), Symbol.toStringTag);
				if (descriptor && descriptor.get) {
					var bound = callBind(descriptor.get);
					cache["$" + typedArray] = bound;
				}
			}
		});
		else forEach(typedArrays, function(typedArray) {
			var arr = new g[typedArray]();
			var fn = arr.slice || arr.set;
			if (fn) {
				var bound = callBind(fn);
				cache["$" + typedArray] = bound;
			}
		});
		function tryTypedArrays(value) {
			var found = false;
			forEach(
				/** @type {Record<`$${TypedArrayName}`, Getter>} */
				cache,
				/** @param {Getter} getter @param {`$${TypedArrayName}`} typedArray */
				function(getter, typedArray) {
					if (!found) try {
						if ("$" + getter(value) === typedArray) found = $slice(typedArray, 1);
					} catch (e) {}
				}
			);
			return found;
		}
		function trySlices(value) {
			var found = false;
			forEach(
				/** @type {Record<`$${TypedArrayName}`, Getter>} */
				cache,
				/** @param {Getter} getter @param {`$${TypedArrayName}`} name */
				function(getter, name) {
					if (!found) try {
						getter(value);
						found = $slice(name, 1);
					} catch (e) {}
				}
			);
			return found;
		}
		function isTATag(tag) {
			return $indexOf(typedArrays, tag) > -1;
		}
		module2.exports = function whichTypedArray(value) {
			if (!value || typeof value !== "object") return false;
			if (!hasToStringTag) {
				var tag = $slice($toString(value), 8, -1);
				if (isTATag(tag)) return tag;
				if (tag !== "Object") return false;
				return trySlices(value);
			}
			if (!gOPD) return null;
			return tryTypedArrays(value);
		};
	} });
	var require_is_typed_array = __commonJS({ "../../../node_modules/.pnpm/is-typed-array@1.1.15/node_modules/is-typed-array/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var whichTypedArray = require_which_typed_array();
		module2.exports = function isTypedArray(value) {
			return !!whichTypedArray(value);
		};
	} });
	var require_types = __commonJS({ "../../../node_modules/.pnpm/util@0.12.5/node_modules/util/support/types.js"(exports2) {
		"use strict";
		init_browser_globals();
		var isArgumentsObject = require_is_arguments();
		var isGeneratorFunction = require_is_generator_function();
		var whichTypedArray = require_which_typed_array();
		var isTypedArray = require_is_typed_array();
		function uncurryThis(f) {
			return f.call.bind(f);
		}
		var BigIntSupported = typeof BigInt !== "undefined";
		var SymbolSupported = typeof Symbol !== "undefined";
		var ObjectToString = uncurryThis(Object.prototype.toString);
		var numberValue = uncurryThis(Number.prototype.valueOf);
		var stringValue = uncurryThis(String.prototype.valueOf);
		var booleanValue = uncurryThis(Boolean.prototype.valueOf);
		if (BigIntSupported) bigIntValue = uncurryThis(BigInt.prototype.valueOf);
		var bigIntValue;
		if (SymbolSupported) symbolValue = uncurryThis(Symbol.prototype.valueOf);
		var symbolValue;
		function checkBoxedPrimitive(value, prototypeValueOf) {
			if (typeof value !== "object") return false;
			try {
				prototypeValueOf(value);
				return true;
			} catch (e) {
				return false;
			}
		}
		exports2.isArgumentsObject = isArgumentsObject;
		exports2.isGeneratorFunction = isGeneratorFunction;
		exports2.isTypedArray = isTypedArray;
		function isPromise(input) {
			return typeof Promise !== "undefined" && input instanceof Promise || input !== null && typeof input === "object" && typeof input.then === "function" && typeof input.catch === "function";
		}
		exports2.isPromise = isPromise;
		function isArrayBufferView(value) {
			if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) return ArrayBuffer.isView(value);
			return isTypedArray(value) || isDataView(value);
		}
		exports2.isArrayBufferView = isArrayBufferView;
		function isUint8Array(value) {
			return whichTypedArray(value) === "Uint8Array";
		}
		exports2.isUint8Array = isUint8Array;
		function isUint8ClampedArray(value) {
			return whichTypedArray(value) === "Uint8ClampedArray";
		}
		exports2.isUint8ClampedArray = isUint8ClampedArray;
		function isUint16Array(value) {
			return whichTypedArray(value) === "Uint16Array";
		}
		exports2.isUint16Array = isUint16Array;
		function isUint32Array(value) {
			return whichTypedArray(value) === "Uint32Array";
		}
		exports2.isUint32Array = isUint32Array;
		function isInt8Array(value) {
			return whichTypedArray(value) === "Int8Array";
		}
		exports2.isInt8Array = isInt8Array;
		function isInt16Array(value) {
			return whichTypedArray(value) === "Int16Array";
		}
		exports2.isInt16Array = isInt16Array;
		function isInt32Array(value) {
			return whichTypedArray(value) === "Int32Array";
		}
		exports2.isInt32Array = isInt32Array;
		function isFloat32Array(value) {
			return whichTypedArray(value) === "Float32Array";
		}
		exports2.isFloat32Array = isFloat32Array;
		function isFloat64Array(value) {
			return whichTypedArray(value) === "Float64Array";
		}
		exports2.isFloat64Array = isFloat64Array;
		function isBigInt64Array(value) {
			return whichTypedArray(value) === "BigInt64Array";
		}
		exports2.isBigInt64Array = isBigInt64Array;
		function isBigUint64Array(value) {
			return whichTypedArray(value) === "BigUint64Array";
		}
		exports2.isBigUint64Array = isBigUint64Array;
		function isMapToString(value) {
			return ObjectToString(value) === "[object Map]";
		}
		isMapToString.working = typeof Map !== "undefined" && isMapToString(/* @__PURE__ */ new Map());
		function isMap(value) {
			if (typeof Map === "undefined") return false;
			return isMapToString.working ? isMapToString(value) : value instanceof Map;
		}
		exports2.isMap = isMap;
		function isSetToString(value) {
			return ObjectToString(value) === "[object Set]";
		}
		isSetToString.working = typeof Set !== "undefined" && isSetToString(/* @__PURE__ */ new Set());
		function isSet(value) {
			if (typeof Set === "undefined") return false;
			return isSetToString.working ? isSetToString(value) : value instanceof Set;
		}
		exports2.isSet = isSet;
		function isWeakMapToString(value) {
			return ObjectToString(value) === "[object WeakMap]";
		}
		isWeakMapToString.working = typeof WeakMap !== "undefined" && isWeakMapToString(/* @__PURE__ */ new WeakMap());
		function isWeakMap(value) {
			if (typeof WeakMap === "undefined") return false;
			return isWeakMapToString.working ? isWeakMapToString(value) : value instanceof WeakMap;
		}
		exports2.isWeakMap = isWeakMap;
		function isWeakSetToString(value) {
			return ObjectToString(value) === "[object WeakSet]";
		}
		isWeakSetToString.working = typeof WeakSet !== "undefined" && isWeakSetToString(/* @__PURE__ */ new WeakSet());
		function isWeakSet(value) {
			return isWeakSetToString(value);
		}
		exports2.isWeakSet = isWeakSet;
		function isArrayBufferToString(value) {
			return ObjectToString(value) === "[object ArrayBuffer]";
		}
		isArrayBufferToString.working = typeof ArrayBuffer !== "undefined" && isArrayBufferToString(/* @__PURE__ */ new ArrayBuffer());
		function isArrayBuffer(value) {
			if (typeof ArrayBuffer === "undefined") return false;
			return isArrayBufferToString.working ? isArrayBufferToString(value) : value instanceof ArrayBuffer;
		}
		exports2.isArrayBuffer = isArrayBuffer;
		function isDataViewToString(value) {
			return ObjectToString(value) === "[object DataView]";
		}
		isDataViewToString.working = typeof ArrayBuffer !== "undefined" && typeof DataView !== "undefined" && isDataViewToString(new DataView(/* @__PURE__ */ new ArrayBuffer(1), 0, 1));
		function isDataView(value) {
			if (typeof DataView === "undefined") return false;
			return isDataViewToString.working ? isDataViewToString(value) : value instanceof DataView;
		}
		exports2.isDataView = isDataView;
		var SharedArrayBufferCopy = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : void 0;
		function isSharedArrayBufferToString(value) {
			return ObjectToString(value) === "[object SharedArrayBuffer]";
		}
		function isSharedArrayBuffer(value) {
			if (typeof SharedArrayBufferCopy === "undefined") return false;
			if (typeof isSharedArrayBufferToString.working === "undefined") isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
			return isSharedArrayBufferToString.working ? isSharedArrayBufferToString(value) : value instanceof SharedArrayBufferCopy;
		}
		exports2.isSharedArrayBuffer = isSharedArrayBuffer;
		function isAsyncFunction(value) {
			return ObjectToString(value) === "[object AsyncFunction]";
		}
		exports2.isAsyncFunction = isAsyncFunction;
		function isMapIterator(value) {
			return ObjectToString(value) === "[object Map Iterator]";
		}
		exports2.isMapIterator = isMapIterator;
		function isSetIterator(value) {
			return ObjectToString(value) === "[object Set Iterator]";
		}
		exports2.isSetIterator = isSetIterator;
		function isGeneratorObject(value) {
			return ObjectToString(value) === "[object Generator]";
		}
		exports2.isGeneratorObject = isGeneratorObject;
		function isWebAssemblyCompiledModule(value) {
			return ObjectToString(value) === "[object WebAssembly.Module]";
		}
		exports2.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;
		function isNumberObject(value) {
			return checkBoxedPrimitive(value, numberValue);
		}
		exports2.isNumberObject = isNumberObject;
		function isStringObject(value) {
			return checkBoxedPrimitive(value, stringValue);
		}
		exports2.isStringObject = isStringObject;
		function isBooleanObject(value) {
			return checkBoxedPrimitive(value, booleanValue);
		}
		exports2.isBooleanObject = isBooleanObject;
		function isBigIntObject(value) {
			return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
		}
		exports2.isBigIntObject = isBigIntObject;
		function isSymbolObject(value) {
			return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
		}
		exports2.isSymbolObject = isSymbolObject;
		function isBoxedPrimitive(value) {
			return isNumberObject(value) || isStringObject(value) || isBooleanObject(value) || isBigIntObject(value) || isSymbolObject(value);
		}
		exports2.isBoxedPrimitive = isBoxedPrimitive;
		function isAnyArrayBuffer(value) {
			return typeof Uint8Array !== "undefined" && (isArrayBuffer(value) || isSharedArrayBuffer(value));
		}
		exports2.isAnyArrayBuffer = isAnyArrayBuffer;
		[
			"isProxy",
			"isExternal",
			"isModuleNamespaceObject"
		].forEach(function(method) {
			Object.defineProperty(exports2, method, {
				enumerable: false,
				value: function() {
					throw new Error(method + " is not supported in userland");
				}
			});
		});
	} });
	var require_isBufferBrowser = __commonJS({ "../../../node_modules/.pnpm/util@0.12.5/node_modules/util/support/isBufferBrowser.js"(exports2, module2) {
		init_browser_globals();
		module2.exports = function isBuffer(arg) {
			return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
		};
	} });
	var require_inherits_browser = __commonJS({ "../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js"(exports2, module2) {
		init_browser_globals();
		if (typeof Object.create === "function") module2.exports = function inherits(ctor, superCtor) {
			if (superCtor) {
				ctor.super_ = superCtor;
				ctor.prototype = Object.create(superCtor.prototype, { constructor: {
					value: ctor,
					enumerable: false,
					writable: true,
					configurable: true
				} });
			}
		};
		else module2.exports = function inherits(ctor, superCtor) {
			if (superCtor) {
				ctor.super_ = superCtor;
				var TempCtor = function() {};
				TempCtor.prototype = superCtor.prototype;
				ctor.prototype = new TempCtor();
				ctor.prototype.constructor = ctor;
			}
		};
	} });
	var require_util = __commonJS({ "../../../node_modules/.pnpm/util@0.12.5/node_modules/util/util.js"(exports2) {
		init_browser_globals();
		var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors2(obj) {
			var keys = Object.keys(obj);
			var descriptors = {};
			for (var i = 0; i < keys.length; i++) descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
			return descriptors;
		};
		var formatRegExp = /%[sdj%]/g;
		exports2.format = function(f) {
			if (!isString(f)) {
				var objects = [];
				for (var i = 0; i < arguments.length; i++) objects.push(inspect(arguments[i]));
				return objects.join(" ");
			}
			var i = 1;
			var args = arguments;
			var len = args.length;
			var str = String(f).replace(formatRegExp, function(x2) {
				if (x2 === "%%") return "%";
				if (i >= len) return x2;
				switch (x2) {
					case "%s": return String(args[i++]);
					case "%d": return Number(args[i++]);
					case "%j": try {
						return JSON.stringify(args[i++]);
					} catch (_) {
						return "[Circular]";
					}
					default: return x2;
				}
			});
			for (var x = args[i]; i < len; x = args[++i]) if (isNull(x) || !isObject(x)) str += " " + x;
			else str += " " + inspect(x);
			return str;
		};
		exports2.deprecate = function(fn, msg) {
			if (typeof import_browser.default !== "undefined" && import_browser.default.noDeprecation === true) return fn;
			if (typeof import_browser.default === "undefined") return function() {
				return exports2.deprecate(fn, msg).apply(this, arguments);
			};
			var warned = false;
			function deprecated() {
				if (!warned) {
					if (import_browser.default.throwDeprecation) throw new Error(msg);
					else if (import_browser.default.traceDeprecation) console.trace(msg);
					else console.error(msg);
					warned = true;
				}
				return fn.apply(this, arguments);
			}
			return deprecated;
		};
		var debugs = {};
		var debugEnvRegex = /^$/;
		if (import_browser.default.env.NODE_DEBUG) {
			debugEnv = import_browser.default.env.NODE_DEBUG;
			debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase();
			debugEnvRegex = new RegExp("^" + debugEnv + "$", "i");
		}
		var debugEnv;
		exports2.debuglog = function(set) {
			set = set.toUpperCase();
			if (!debugs[set]) if (debugEnvRegex.test(set)) {
				var pid = import_browser.default.pid;
				debugs[set] = function() {
					var msg = exports2.format.apply(exports2, arguments);
					console.error("%s %d: %s", set, pid, msg);
				};
			} else debugs[set] = function() {};
			return debugs[set];
		};
		function inspect(obj, opts) {
			var ctx = {
				seen: [],
				stylize: stylizeNoColor
			};
			if (arguments.length >= 3) ctx.depth = arguments[2];
			if (arguments.length >= 4) ctx.colors = arguments[3];
			if (isBoolean(opts)) ctx.showHidden = opts;
			else if (opts) exports2._extend(ctx, opts);
			if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
			if (isUndefined(ctx.depth)) ctx.depth = 2;
			if (isUndefined(ctx.colors)) ctx.colors = false;
			if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
			if (ctx.colors) ctx.stylize = stylizeWithColor;
			return formatValue(ctx, obj, ctx.depth);
		}
		exports2.inspect = inspect;
		inspect.colors = {
			"bold": [1, 22],
			"italic": [3, 23],
			"underline": [4, 24],
			"inverse": [7, 27],
			"white": [37, 39],
			"grey": [90, 39],
			"black": [30, 39],
			"blue": [34, 39],
			"cyan": [36, 39],
			"green": [32, 39],
			"magenta": [35, 39],
			"red": [31, 39],
			"yellow": [33, 39]
		};
		inspect.styles = {
			"special": "cyan",
			"number": "yellow",
			"boolean": "yellow",
			"undefined": "grey",
			"null": "bold",
			"string": "green",
			"date": "magenta",
			"regexp": "red"
		};
		function stylizeWithColor(str, styleType) {
			var style = inspect.styles[styleType];
			if (style) return "\x1B[" + inspect.colors[style][0] + "m" + str + "\x1B[" + inspect.colors[style][1] + "m";
			else return str;
		}
		function stylizeNoColor(str, styleType) {
			return str;
		}
		function arrayToHash(array) {
			var hash = {};
			array.forEach(function(val, idx) {
				hash[val] = true;
			});
			return hash;
		}
		function formatValue(ctx, value, recurseTimes) {
			if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports2.inspect && !(value.constructor && value.constructor.prototype === value)) {
				var ret = value.inspect(recurseTimes, ctx);
				if (!isString(ret)) ret = formatValue(ctx, ret, recurseTimes);
				return ret;
			}
			var primitive = formatPrimitive(ctx, value);
			if (primitive) return primitive;
			var keys = Object.keys(value);
			var visibleKeys = arrayToHash(keys);
			if (ctx.showHidden) keys = Object.getOwnPropertyNames(value);
			if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) return formatError(value);
			if (keys.length === 0) {
				if (isFunction(value)) {
					var name = value.name ? ": " + value.name : "";
					return ctx.stylize("[Function" + name + "]", "special");
				}
				if (isRegExp(value)) return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
				if (isDate(value)) return ctx.stylize(Date.prototype.toString.call(value), "date");
				if (isError(value)) return formatError(value);
			}
			var base = "", array = false, braces = ["{", "}"];
			if (isArray(value)) {
				array = true;
				braces = ["[", "]"];
			}
			if (isFunction(value)) base = " [Function" + (value.name ? ": " + value.name : "") + "]";
			if (isRegExp(value)) base = " " + RegExp.prototype.toString.call(value);
			if (isDate(value)) base = " " + Date.prototype.toUTCString.call(value);
			if (isError(value)) base = " " + formatError(value);
			if (keys.length === 0 && (!array || value.length == 0)) return braces[0] + base + braces[1];
			if (recurseTimes < 0) if (isRegExp(value)) return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
			else return ctx.stylize("[Object]", "special");
			ctx.seen.push(value);
			var output;
			if (array) output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
			else output = keys.map(function(key) {
				return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
			});
			ctx.seen.pop();
			return reduceToSingleString(output, base, braces);
		}
		function formatPrimitive(ctx, value) {
			if (isUndefined(value)) return ctx.stylize("undefined", "undefined");
			if (isString(value)) {
				var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, "\"") + "'";
				return ctx.stylize(simple, "string");
			}
			if (isNumber(value)) return ctx.stylize("" + value, "number");
			if (isBoolean(value)) return ctx.stylize("" + value, "boolean");
			if (isNull(value)) return ctx.stylize("null", "null");
		}
		function formatError(value) {
			return "[" + Error.prototype.toString.call(value) + "]";
		}
		function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
			var output = [];
			for (var i = 0, l = value.length; i < l; ++i) if (hasOwnProperty(value, String(i))) output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
			else output.push("");
			keys.forEach(function(key) {
				if (!key.match(/^\d+$/)) output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
			});
			return output;
		}
		function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
			var name, str, desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
			if (desc.get) if (desc.set) str = ctx.stylize("[Getter/Setter]", "special");
			else str = ctx.stylize("[Getter]", "special");
			else if (desc.set) str = ctx.stylize("[Setter]", "special");
			if (!hasOwnProperty(visibleKeys, key)) name = "[" + key + "]";
			if (!str) if (ctx.seen.indexOf(desc.value) < 0) {
				if (isNull(recurseTimes)) str = formatValue(ctx, desc.value, null);
				else str = formatValue(ctx, desc.value, recurseTimes - 1);
				if (str.indexOf("\n") > -1) if (array) str = str.split("\n").map(function(line) {
					return "  " + line;
				}).join("\n").slice(2);
				else str = "\n" + str.split("\n").map(function(line) {
					return "   " + line;
				}).join("\n");
			} else str = ctx.stylize("[Circular]", "special");
			if (isUndefined(name)) {
				if (array && key.match(/^\d+$/)) return str;
				name = JSON.stringify("" + key);
				if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
					name = name.slice(1, -1);
					name = ctx.stylize(name, "name");
				} else {
					name = name.replace(/'/g, "\\'").replace(/\\"/g, "\"").replace(/(^"|"$)/g, "'");
					name = ctx.stylize(name, "string");
				}
			}
			return name + ": " + str;
		}
		function reduceToSingleString(output, base, braces) {
			var numLinesEst = 0;
			if (output.reduce(function(prev, cur) {
				numLinesEst++;
				if (cur.indexOf("\n") >= 0) numLinesEst++;
				return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
			}, 0) > 60) return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
			return braces[0] + base + " " + output.join(", ") + " " + braces[1];
		}
		exports2.types = require_types();
		function isArray(ar) {
			return Array.isArray(ar);
		}
		exports2.isArray = isArray;
		function isBoolean(arg) {
			return typeof arg === "boolean";
		}
		exports2.isBoolean = isBoolean;
		function isNull(arg) {
			return arg === null;
		}
		exports2.isNull = isNull;
		function isNullOrUndefined(arg) {
			return arg == null;
		}
		exports2.isNullOrUndefined = isNullOrUndefined;
		function isNumber(arg) {
			return typeof arg === "number";
		}
		exports2.isNumber = isNumber;
		function isString(arg) {
			return typeof arg === "string";
		}
		exports2.isString = isString;
		function isSymbol(arg) {
			return typeof arg === "symbol";
		}
		exports2.isSymbol = isSymbol;
		function isUndefined(arg) {
			return arg === void 0;
		}
		exports2.isUndefined = isUndefined;
		function isRegExp(re) {
			return isObject(re) && objectToString(re) === "[object RegExp]";
		}
		exports2.isRegExp = isRegExp;
		exports2.types.isRegExp = isRegExp;
		function isObject(arg) {
			return typeof arg === "object" && arg !== null;
		}
		exports2.isObject = isObject;
		function isDate(d) {
			return isObject(d) && objectToString(d) === "[object Date]";
		}
		exports2.isDate = isDate;
		exports2.types.isDate = isDate;
		function isError(e) {
			return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
		}
		exports2.isError = isError;
		exports2.types.isNativeError = isError;
		function isFunction(arg) {
			return typeof arg === "function";
		}
		exports2.isFunction = isFunction;
		function isPrimitive(arg) {
			return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
		}
		exports2.isPrimitive = isPrimitive;
		exports2.isBuffer = require_isBufferBrowser();
		function objectToString(o) {
			return Object.prototype.toString.call(o);
		}
		function pad(n) {
			return n < 10 ? "0" + n.toString(10) : n.toString(10);
		}
		var months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		];
		function timestamp() {
			var d = /* @__PURE__ */ new Date();
			var time = [
				pad(d.getHours()),
				pad(d.getMinutes()),
				pad(d.getSeconds())
			].join(":");
			return [
				d.getDate(),
				months[d.getMonth()],
				time
			].join(" ");
		}
		exports2.log = function() {
			console.log("%s - %s", timestamp(), exports2.format.apply(exports2, arguments));
		};
		exports2.inherits = require_inherits_browser();
		exports2._extend = function(origin, add) {
			if (!add || !isObject(add)) return origin;
			var keys = Object.keys(add);
			var i = keys.length;
			while (i--) origin[keys[i]] = add[keys[i]];
			return origin;
		};
		function hasOwnProperty(obj, prop) {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		}
		var kCustomPromisifiedSymbol = typeof Symbol !== "undefined" ? /* @__PURE__ */ Symbol("util.promisify.custom") : void 0;
		exports2.promisify = function promisify(original) {
			if (typeof original !== "function") throw new TypeError("The \"original\" argument must be of type Function");
			if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
				var fn = original[kCustomPromisifiedSymbol];
				if (typeof fn !== "function") throw new TypeError("The \"util.promisify.custom\" argument must be of type Function");
				Object.defineProperty(fn, kCustomPromisifiedSymbol, {
					value: fn,
					enumerable: false,
					writable: false,
					configurable: true
				});
				return fn;
			}
			function fn() {
				var promiseResolve, promiseReject;
				var promise = new Promise(function(resolve, reject) {
					promiseResolve = resolve;
					promiseReject = reject;
				});
				var args = [];
				for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
				args.push(function(err, value) {
					if (err) promiseReject(err);
					else promiseResolve(value);
				});
				try {
					original.apply(this, args);
				} catch (err) {
					promiseReject(err);
				}
				return promise;
			}
			Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
			if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
				value: fn,
				enumerable: false,
				writable: false,
				configurable: true
			});
			return Object.defineProperties(fn, getOwnPropertyDescriptors(original));
		};
		exports2.promisify.custom = kCustomPromisifiedSymbol;
		function callbackifyOnRejected(reason, cb) {
			if (!reason) {
				var newReason = /* @__PURE__ */ new Error("Promise was rejected with a falsy value");
				newReason.reason = reason;
				reason = newReason;
			}
			return cb(reason);
		}
		function callbackify(original) {
			if (typeof original !== "function") throw new TypeError("The \"original\" argument must be of type Function");
			function callbackified() {
				var args = [];
				for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
				var maybeCb = args.pop();
				if (typeof maybeCb !== "function") throw new TypeError("The last argument must be of type Function");
				var self2 = this;
				var cb = function() {
					return maybeCb.apply(self2, arguments);
				};
				original.apply(this, args).then(function(ret) {
					import_browser.default.nextTick(cb.bind(null, null, ret));
				}, function(rej) {
					import_browser.default.nextTick(callbackifyOnRejected.bind(null, rej, cb));
				});
			}
			Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
			Object.defineProperties(callbackified, getOwnPropertyDescriptors(original));
			return callbackified;
		}
		exports2.callbackify = callbackify;
	} });
	var require_utils = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/lib/utils.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var buffer = require_buffer();
		var crypto = require_crypto();
		var util2 = require_util();
		var Buffer3 = buffer.Buffer;
		var POOL = new BufferPool(4096);
		var NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
		var f = util2.format;
		function newBuffer(size) {
			if (typeof Buffer3.alloc == "function") return Buffer3.alloc(size);
			else return new Buffer3(size);
		}
		function newSlowBuffer(size) {
			if (typeof Buffer3.allocUnsafeSlow == "function") return Buffer3.allocUnsafeSlow(size);
			else return new buffer.SlowBuffer(size);
		}
		function bufferFrom(data, enc) {
			if (typeof Buffer3.from == "function") return Buffer3.from(data, enc);
			else return new Buffer3(data, enc);
		}
		function capitalize(s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
		}
		function compare(n1, n2) {
			return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
		}
		function getOption(opts, key, def) {
			var value = opts[key];
			return value === void 0 ? def : value;
		}
		function getHash(str, algorithm) {
			algorithm = algorithm || "md5";
			var hash = crypto.createHash(algorithm);
			hash.end(str);
			return hash.read();
		}
		function singleIndexOf(arr, v) {
			var pos = -1;
			var i, l;
			if (!arr) return -1;
			for (i = 0, l = arr.length; i < l; i++) if (arr[i] === v) {
				if (pos >= 0) return -2;
				pos = i;
			}
			return pos;
		}
		function toMap(arr, fn) {
			var obj = {};
			var i, elem;
			for (i = 0; i < arr.length; i++) {
				elem = arr[i];
				obj[fn(elem)] = elem;
			}
			return obj;
		}
		function objectValues(obj) {
			return Object.keys(obj).map(function(key) {
				return obj[key];
			});
		}
		function hasDuplicates(arr, fn) {
			var obj = /* @__PURE__ */ Object.create(null);
			var i, l, elem;
			for (i = 0, l = arr.length; i < l; i++) {
				elem = arr[i];
				if (fn) elem = fn(elem);
				if (obj[elem]) return true;
				obj[elem] = true;
			}
			return false;
		}
		function copyOwnProperties(src, dst, overwrite) {
			var names = Object.getOwnPropertyNames(src);
			var i, l, name;
			for (i = 0, l = names.length; i < l; i++) {
				name = names[i];
				if (!dst.hasOwnProperty(name) || overwrite) {
					var descriptor = Object.getOwnPropertyDescriptor(src, name);
					Object.defineProperty(dst, name, descriptor);
				}
			}
			return dst;
		}
		function isValidName(str) {
			return NAME_PATTERN.test(str);
		}
		function qualify(name, namespace) {
			if (~name.indexOf(".")) name = name.replace(/^\./, "");
			else if (namespace) name = namespace + "." + name;
			name.split(".").forEach(function(part) {
				if (!isValidName(part)) throw new Error(f("invalid name: %j", name));
			});
			return name;
		}
		function unqualify(name) {
			var parts = name.split(".");
			return parts[parts.length - 1];
		}
		function impliedNamespace(name) {
			var match = /^(.*)\.[^.]+$/.exec(name);
			return match ? match[1] : void 0;
		}
		function jsonEnd(str, pos) {
			pos = pos | 0;
			var c = str.charAt(pos++);
			if (/[\d-]/.test(c)) {
				while (/[eE\d.+-]/.test(str.charAt(pos))) pos++;
				return pos;
			} else if (/true|null/.test(str.slice(pos - 1, pos + 3))) return pos + 3;
			else if (/false/.test(str.slice(pos - 1, pos + 4))) return pos + 4;
			var depth = 0;
			var literal = false;
			do
				switch (c) {
					case "{":
					case "[":
						if (!literal) depth++;
						break;
					case "}":
					case "]":
						if (!literal && !--depth) return pos;
						break;
					case "\"":
						literal = !literal;
						if (!depth && !literal) return pos;
						break;
					case "\\": pos++;
				}
			while (c = str.charAt(pos++));
			return -1;
		}
		function abstractFunction() {
			throw new Error("abstract");
		}
		function addDeprecatedGetters(obj, props) {
			var proto = obj.prototype;
			var i, l, prop, getter;
			for (i = 0, l = props.length; i < l; i++) {
				prop = props[i];
				getter = "get" + capitalize(prop);
				proto[getter] = util2.deprecate(createGetter(prop), "use `." + prop + "` instead of `." + getter + "()`");
			}
			function createGetter(prop2) {
				return function() {
					var delegate = this[prop2];
					return typeof delegate == "function" ? delegate.apply(this, arguments) : delegate;
				};
			}
		}
		function BufferPool(len) {
			this._len = len | 0;
			this._pos = 0;
			this._slab = newBuffer(this._len);
		}
		BufferPool.prototype.alloc = function(len) {
			if (len < 0) throw new Error("negative length");
			var maxLen = this._len;
			if (len > maxLen) return newBuffer(len);
			if (this._pos + len > maxLen) {
				this._slab = newBuffer(maxLen);
				this._pos = 0;
			}
			return this._slab.slice(this._pos, this._pos += len);
		};
		function Lcg(seed) {
			var a = 1103515245;
			var c = 12345;
			var m = Math.pow(2, 31);
			var state = Math.floor(seed || Math.random() * (m - 1));
			this._max = m;
			this._nextInt = function() {
				return state = (a * state + c) % m;
			};
		}
		Lcg.prototype.nextBoolean = function() {
			return !!(this._nextInt() % 2);
		};
		Lcg.prototype.nextInt = function(start, end) {
			if (end === void 0) {
				end = start;
				start = 0;
			}
			end = end === void 0 ? this._max : end;
			return start + Math.floor(this.nextFloat() * (end - start));
		};
		Lcg.prototype.nextFloat = function(start, end) {
			if (end === void 0) {
				end = start;
				start = 0;
			}
			end = end === void 0 ? 1 : end;
			return start + (end - start) * this._nextInt() / this._max;
		};
		Lcg.prototype.nextString = function(len, flags) {
			len |= 0;
			flags = flags || "aA";
			var mask = "";
			if (flags.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
			if (flags.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			if (flags.indexOf("#") > -1) mask += "0123456789";
			if (flags.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
			var result = [];
			for (var i = 0; i < len; i++) result.push(this.choice(mask));
			return result.join("");
		};
		Lcg.prototype.nextBuffer = function(len) {
			var arr = [];
			var i;
			for (i = 0; i < len; i++) arr.push(this.nextInt(256));
			return bufferFrom(arr);
		};
		Lcg.prototype.choice = function(arr) {
			var len = arr.length;
			if (!len) throw new Error("choosing from empty array");
			return arr[this.nextInt(len)];
		};
		function OrderedQueue() {
			this._index = 0;
			this._items = [];
		}
		OrderedQueue.prototype.push = function(item) {
			var items = this._items;
			var i = items.length | 0;
			var j;
			items.push(item);
			while (i > 0 && items[i].index < items[j = i - 1 >> 1].index) {
				item = items[i];
				items[i] = items[j];
				items[j] = item;
				i = j;
			}
		};
		OrderedQueue.prototype.pop = function() {
			var items = this._items;
			var len = items.length - 1 | 0;
			var first = items[0];
			if (!first || first.index > this._index) return null;
			this._index++;
			if (!len) {
				items.pop();
				return first;
			}
			items[0] = items.pop();
			var mid = len >> 1;
			var i = 0;
			var i1, i2, j, item, c, c1, c2;
			while (i < mid) {
				item = items[i];
				i1 = (i << 1) + 1;
				i2 = i + 1 << 1;
				c1 = items[i1];
				c2 = items[i2];
				if (!c2 || c1.index <= c2.index) {
					c = c1;
					j = i1;
				} else {
					c = c2;
					j = i2;
				}
				if (c.index >= item.index) break;
				items[j] = item;
				items[i] = c;
				i = j;
			}
			return first;
		};
		function Tap(buf, pos) {
			this.buf = buf;
			this.pos = pos | 0;
			if (this.pos < 0) throw new Error("negative offset");
		}
		Tap.prototype.isValid = function() {
			return this.pos <= this.buf.length;
		};
		Tap.prototype._invalidate = function() {
			this.pos = this.buf.length + 1;
		};
		Tap.prototype.readBoolean = function() {
			return !!this.buf[this.pos++];
		};
		Tap.prototype.skipBoolean = function() {
			this.pos++;
		};
		Tap.prototype.writeBoolean = function(b) {
			this.buf[this.pos++] = !!b;
		};
		Tap.prototype.readInt = Tap.prototype.readLong = function() {
			var n = 0;
			var k = 0;
			var buf = this.buf;
			var b, h, f2, fk;
			do {
				b = buf[this.pos++];
				h = b & 128;
				n |= (b & 127) << k;
				k += 7;
			} while (h && k < 28);
			if (h) {
				f2 = n;
				fk = 268435456;
				do {
					b = buf[this.pos++];
					f2 += (b & 127) * fk;
					fk *= 128;
				} while (b & 128);
				return (f2 % 2 ? -(f2 + 1) : f2) / 2;
			}
			return n >> 1 ^ -(n & 1);
		};
		Tap.prototype.skipInt = Tap.prototype.skipLong = function() {
			var buf = this.buf;
			while (buf[this.pos++] & 128);
		};
		Tap.prototype.writeInt = Tap.prototype.writeLong = function(n) {
			var buf = this.buf;
			var f2, m;
			if (n >= -1073741824 && n < 1073741824) {
				m = n >= 0 ? n << 1 : ~n << 1 | 1;
				do {
					buf[this.pos] = m & 127;
					m >>= 7;
				} while (m && (buf[this.pos++] |= 128));
			} else {
				f2 = n >= 0 ? n * 2 : -n * 2 - 1;
				do {
					buf[this.pos] = f2 & 127;
					f2 /= 128;
				} while (f2 >= 1 && (buf[this.pos++] |= 128));
			}
			this.pos++;
		};
		Tap.prototype.readFloat = function() {
			var buf = this.buf;
			var pos = this.pos;
			this.pos += 4;
			if (this.pos > buf.length) return 0;
			return this.buf.readFloatLE(pos);
		};
		Tap.prototype.skipFloat = function() {
			this.pos += 4;
		};
		Tap.prototype.writeFloat = function(f2) {
			var buf = this.buf;
			var pos = this.pos;
			this.pos += 4;
			if (this.pos > buf.length) return;
			return this.buf.writeFloatLE(f2, pos);
		};
		Tap.prototype.readDouble = function() {
			var buf = this.buf;
			var pos = this.pos;
			this.pos += 8;
			if (this.pos > buf.length) return 0;
			return this.buf.readDoubleLE(pos);
		};
		Tap.prototype.skipDouble = function() {
			this.pos += 8;
		};
		Tap.prototype.writeDouble = function(d) {
			var buf = this.buf;
			var pos = this.pos;
			this.pos += 8;
			if (this.pos > buf.length) return;
			return this.buf.writeDoubleLE(d, pos);
		};
		Tap.prototype.readFixed = function(len) {
			var pos = this.pos;
			this.pos += len;
			if (this.pos > this.buf.length) return;
			var fixed = POOL.alloc(len);
			this.buf.copy(fixed, 0, pos, pos + len);
			return fixed;
		};
		Tap.prototype.skipFixed = function(len) {
			this.pos += len;
		};
		Tap.prototype.writeFixed = function(buf, len) {
			len = len || buf.length;
			var pos = this.pos;
			this.pos += len;
			if (this.pos > this.buf.length) return;
			buf.copy(this.buf, pos, 0, len);
		};
		Tap.prototype.readBytes = function() {
			var len = this.readLong();
			if (len < 0) {
				this._invalidate();
				return;
			}
			return this.readFixed(len);
		};
		Tap.prototype.skipBytes = function() {
			var len = this.readLong();
			if (len < 0) {
				this._invalidate();
				return;
			}
			this.pos += len;
		};
		Tap.prototype.writeBytes = function(buf) {
			var len = buf.length;
			this.writeLong(len);
			this.writeFixed(buf, len);
		};
		if (typeof Buffer3.prototype.utf8Slice == "function") Tap.prototype.readString = function() {
			var len = this.readLong();
			if (len < 0) {
				this._invalidate();
				return "";
			}
			var pos = this.pos;
			var buf = this.buf;
			this.pos += len;
			if (this.pos > buf.length) return;
			return this.buf.utf8Slice(pos, pos + len);
		};
		else Tap.prototype.readString = function() {
			var len = this.readLong();
			if (len < 0) {
				this._invalidate();
				return "";
			}
			var pos = this.pos;
			var buf = this.buf;
			this.pos += len;
			if (this.pos > buf.length) return;
			return this.buf.slice(pos, pos + len).toString();
		};
		Tap.prototype.skipString = function() {
			var len = this.readLong();
			if (len < 0) {
				this._invalidate();
				return;
			}
			this.pos += len;
		};
		Tap.prototype.writeString = function(s) {
			var len = Buffer3.byteLength(s);
			var buf = this.buf;
			this.writeLong(len);
			var pos = this.pos;
			this.pos += len;
			if (this.pos > buf.length) return;
			if (len > 64 && typeof Buffer3.prototype.utf8Write == "function") buf.utf8Write(s, pos, len);
			else {
				var i, l, c1, c2;
				for (i = 0, l = len; i < l; i++) {
					c1 = s.charCodeAt(i);
					if (c1 < 128) buf[pos++] = c1;
					else if (c1 < 2048) {
						buf[pos++] = c1 >> 6 | 192;
						buf[pos++] = c1 & 63 | 128;
					} else if ((c1 & 64512) === 55296 && ((c2 = s.charCodeAt(i + 1)) & 64512) === 56320) {
						c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
						i++;
						buf[pos++] = c1 >> 18 | 240;
						buf[pos++] = c1 >> 12 & 63 | 128;
						buf[pos++] = c1 >> 6 & 63 | 128;
						buf[pos++] = c1 & 63 | 128;
					} else {
						buf[pos++] = c1 >> 12 | 224;
						buf[pos++] = c1 >> 6 & 63 | 128;
						buf[pos++] = c1 & 63 | 128;
					}
				}
			}
		};
		if (typeof Buffer3.prototype.latin1Write == "function") Tap.prototype.writeBinary = function(str, len) {
			var pos = this.pos;
			this.pos += len;
			if (this.pos > this.buf.length) return;
			this.buf.latin1Write(str, pos, len);
		};
		else if (typeof Buffer3.prototype.binaryWrite == "function") Tap.prototype.writeBinary = function(str, len) {
			var pos = this.pos;
			this.pos += len;
			if (this.pos > this.buf.length) return;
			this.buf.binaryWrite(str, pos, len);
		};
		else Tap.prototype.writeBinary = function(s, len) {
			var pos = this.pos;
			this.pos += len;
			if (this.pos > this.buf.length) return;
			this.buf.write(s, pos, len, "binary");
		};
		Tap.prototype.matchBoolean = function(tap) {
			return this.buf[this.pos++] - tap.buf[tap.pos++];
		};
		Tap.prototype.matchInt = Tap.prototype.matchLong = function(tap) {
			var n1 = this.readLong();
			var n2 = tap.readLong();
			return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
		};
		Tap.prototype.matchFloat = function(tap) {
			var n1 = this.readFloat();
			var n2 = tap.readFloat();
			return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
		};
		Tap.prototype.matchDouble = function(tap) {
			var n1 = this.readDouble();
			var n2 = tap.readDouble();
			return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
		};
		Tap.prototype.matchFixed = function(tap, len) {
			return this.readFixed(len).compare(tap.readFixed(len));
		};
		Tap.prototype.matchBytes = Tap.prototype.matchString = function(tap) {
			var l1 = this.readLong();
			var p1 = this.pos;
			this.pos += l1;
			var l2 = tap.readLong();
			var p2 = tap.pos;
			tap.pos += l2;
			var b1 = this.buf.slice(p1, this.pos);
			var b2 = tap.buf.slice(p2, tap.pos);
			return b1.compare(b2);
		};
		Tap.prototype.unpackLongBytes = function() {
			var res = newBuffer(8);
			var n = 0;
			var i = 0;
			var j = 6;
			var buf = this.buf;
			var b = buf[this.pos++], neg = b & 1;
			res.fill(0);
			n |= (b & 127) >> 1;
			while (b & 128) {
				b = buf[this.pos++];
				n |= (b & 127) << j;
				j += 7;
				if (j >= 8) {
					j -= 8;
					res[i++] = n;
					n >>= 8;
				}
			}
			res[i] = n;
			if (neg) invert(res, 8);
			return res;
		};
		Tap.prototype.packLongBytes = function(buf) {
			var neg = (buf[7] & 128) >> 7;
			var res = this.buf;
			var j = 1;
			var k = 0;
			var m = 3;
			var n;
			if (neg) {
				invert(buf, 8);
				n = 1;
			} else n = 0;
			var parts = [
				buf.readUIntLE(0, 3),
				buf.readUIntLE(3, 3),
				buf.readUIntLE(6, 2)
			];
			while (m && !parts[--m]);
			while (k < m) {
				n |= parts[k++] << j;
				j += 24;
				while (j > 7) {
					res[this.pos++] = n & 127 | 128;
					n >>= 7;
					j -= 7;
				}
			}
			n |= parts[m] << j;
			do {
				res[this.pos] = n & 127;
				n >>= 7;
			} while (n && (res[this.pos++] |= 128));
			this.pos++;
			if (neg) invert(buf, 8);
		};
		function invert(buf, len) {
			while (len--) buf[len] = ~buf[len];
		}
		module2.exports = {
			abstractFunction,
			addDeprecatedGetters,
			bufferFrom,
			capitalize,
			copyOwnProperties,
			getHash,
			compare,
			getOption,
			impliedNamespace,
			isValidName,
			jsonEnd,
			newBuffer,
			newSlowBuffer,
			objectValues,
			qualify,
			toMap,
			singleIndexOf,
			hasDuplicates,
			unqualify,
			BufferPool,
			Lcg,
			OrderedQueue,
			Tap
		};
	} });
	var require_types2 = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/lib/types.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var utils2 = require_utils();
		var buffer = require_buffer();
		var util2 = require_util();
		var Buffer3 = buffer.Buffer;
		var Tap = utils2.Tap;
		var debug = util2.debuglog("avsc:types");
		var f = util2.format;
		var TYPES = {
			"array": ArrayType,
			"boolean": BooleanType,
			"bytes": BytesType,
			"double": DoubleType,
			"enum": EnumType,
			"error": RecordType,
			"fixed": FixedType,
			"float": FloatType,
			"int": IntType,
			"long": LongType,
			"map": MapType,
			"null": NullType,
			"record": RecordType,
			"string": StringType
		};
		var RANDOM = new utils2.Lcg();
		var TAP = new Tap(utils2.newSlowBuffer(1024));
		var LOGICAL_TYPE = null;
		var UNDERLYING_TYPES = [];
		function Type(schema, opts) {
			var type;
			if (LOGICAL_TYPE) {
				type = LOGICAL_TYPE;
				UNDERLYING_TYPES.push([LOGICAL_TYPE, this]);
				LOGICAL_TYPE = null;
			} else type = this;
			this._hash = new Hash();
			this.name = void 0;
			this.aliases = void 0;
			this.doc = schema && schema.doc ? "" + schema.doc : void 0;
			if (schema) {
				var name = schema.name;
				var namespace = schema.namespace === void 0 ? opts && opts.namespace : schema.namespace;
				if (name !== void 0) {
					name = maybeQualify(name, namespace);
					if (isPrimitive(name)) throw new Error(f("cannot rename primitive type: %j", name));
					var registry = opts && opts.registry;
					if (registry) {
						if (registry[name] !== void 0) throw new Error(f("duplicate type name: %s", name));
						registry[name] = type;
					}
				} else if (opts && opts.noAnonymousTypes) throw new Error(f("missing name property in schema: %j", schema));
				this.name = name;
				this.aliases = schema.aliases ? schema.aliases.map(function(s) {
					return maybeQualify(s, namespace);
				}) : [];
			}
		}
		Type.forSchema = function(schema, opts) {
			opts = opts || {};
			opts.registry = opts.registry || {};
			var UnionType2 = (function(wrapUnions) {
				if (wrapUnions === true) wrapUnions = "always";
				else if (wrapUnions === false) wrapUnions = "never";
				else if (wrapUnions === void 0) wrapUnions = "auto";
				else if (typeof wrapUnions == "string") wrapUnions = wrapUnions.toLowerCase();
				switch (wrapUnions) {
					case "always": return WrappedUnionType;
					case "never": return UnwrappedUnionType;
					case "auto": return;
					default: throw new Error(f("invalid wrap unions option: %j", wrapUnions));
				}
			})(opts.wrapUnions);
			if (schema === null) throw new Error("invalid type: null (did you mean \"null\"?)");
			if (Type.isType(schema)) return schema;
			var type;
			if (opts.typeHook && (type = opts.typeHook(schema, opts))) {
				if (!Type.isType(type)) throw new Error(f("invalid typehook return value: %j", type));
				return type;
			}
			if (typeof schema == "string") {
				schema = maybeQualify(schema, opts.namespace);
				type = opts.registry[schema];
				if (type) return type;
				if (isPrimitive(schema)) return opts.registry[schema] = Type.forSchema({ type: schema }, opts);
				throw new Error(f("undefined type name: %s", schema));
			}
			if (schema.logicalType && opts.logicalTypes && !LOGICAL_TYPE) {
				var DerivedType = opts.logicalTypes[schema.logicalType];
				if (DerivedType) {
					var namespace = opts.namespace;
					var registry = {};
					Object.keys(opts.registry).forEach(function(key) {
						registry[key] = opts.registry[key];
					});
					try {
						debug("instantiating logical type for %s", schema.logicalType);
						return new DerivedType(schema, opts);
					} catch (err) {
						debug("failed to instantiate logical type for %s", schema.logicalType);
						if (opts.assertLogicalTypes) throw err;
						LOGICAL_TYPE = null;
						opts.namespace = namespace;
						opts.registry = registry;
					}
				}
			}
			if (Array.isArray(schema)) {
				var logicalType = LOGICAL_TYPE;
				LOGICAL_TYPE = null;
				var types = schema.map(function(obj) {
					return Type.forSchema(obj, opts);
				});
				if (!UnionType2) UnionType2 = isAmbiguous(types) ? WrappedUnionType : UnwrappedUnionType;
				LOGICAL_TYPE = logicalType;
				type = new UnionType2(types, opts);
			} else type = (function(typeName) {
				var Type2 = TYPES[typeName];
				if (Type2 === void 0) throw new Error(f("unknown type: %j", typeName));
				return new Type2(schema, opts);
			})(schema.type);
			return type;
		};
		Type.forValue = function(val, opts) {
			opts = opts || {};
			opts.emptyArrayType = opts.emptyArrayType || Type.forSchema({
				type: "array",
				items: "null"
			});
			if (opts.valueHook) {
				var type = opts.valueHook(val, opts);
				if (type !== void 0) {
					if (!Type.isType(type)) throw new Error(f("invalid value hook return value: %j", type));
					return type;
				}
			}
			switch (typeof val) {
				case "string": return Type.forSchema("string", opts);
				case "boolean": return Type.forSchema("boolean", opts);
				case "number":
					if ((val | 0) === val) return Type.forSchema("int", opts);
					else if (Math.abs(val) < 9007199254740991) return Type.forSchema("float", opts);
					return Type.forSchema("double", opts);
				case "object":
					if (val === null) return Type.forSchema("null", opts);
					else if (Array.isArray(val)) {
						if (!val.length) return opts.emptyArrayType;
						return Type.forSchema({
							type: "array",
							items: Type.forTypes(val.map(function(v) {
								return Type.forValue(v, opts);
							}), opts)
						}, opts);
					} else if (Buffer3.isBuffer(val)) return Type.forSchema("bytes", opts);
					var fieldNames = Object.keys(val);
					if (fieldNames.some(function(s) {
						return !utils2.isValidName(s);
					})) return Type.forSchema({
						type: "map",
						values: Type.forTypes(fieldNames.map(function(s) {
							return Type.forValue(val[s], opts);
						}), opts)
					}, opts);
					return Type.forSchema({
						type: "record",
						fields: fieldNames.map(function(s) {
							return {
								name: s,
								type: Type.forValue(val[s], opts)
							};
						})
					}, opts);
				default: throw new Error(f("cannot infer type from: %j", val));
			}
		};
		Type.forTypes = function(types, opts) {
			if (!types.length) throw new Error("no types to combine");
			if (types.length === 1) return types[0];
			opts = opts || {};
			var expanded = [];
			var numWrappedUnions = 0;
			var isValidWrappedUnion = true;
			types.forEach(function(type) {
				switch (type.typeName) {
					case "union:unwrapped":
						isValidWrappedUnion = false;
						expanded = expanded.concat(type.types);
						break;
					case "union:wrapped":
						numWrappedUnions++;
						expanded = expanded.concat(type.types);
						break;
					case "null":
						expanded.push(type);
						break;
					default:
						isValidWrappedUnion = false;
						expanded.push(type);
				}
			});
			if (numWrappedUnions) {
				if (!isValidWrappedUnion) throw new Error("cannot combine wrapped union");
				var branchTypes = {};
				expanded.forEach(function(type) {
					var name = type.branchName;
					var branchType = branchTypes[name];
					if (!branchType) branchTypes[name] = type;
					else if (!type.equals(branchType)) throw new Error("inconsistent branch type");
				});
				var wrapUnions = opts.wrapUnions;
				var unionType;
				opts.wrapUnions = true;
				try {
					unionType = Type.forSchema(Object.keys(branchTypes).map(function(name) {
						return branchTypes[name];
					}), opts);
				} catch (err) {
					opts.wrapUnions = wrapUnions;
					throw err;
				}
				opts.wrapUnions = wrapUnions;
				return unionType;
			}
			var bucketized = {};
			expanded.forEach(function(type) {
				var bucket = getTypeBucket(type);
				var bucketTypes = bucketized[bucket];
				if (!bucketTypes) bucketized[bucket] = bucketTypes = [];
				bucketTypes.push(type);
			});
			var augmented = Object.keys(bucketized).map(function(bucket) {
				var bucketTypes = bucketized[bucket];
				if (bucketTypes.length === 1) return bucketTypes[0];
				else switch (bucket) {
					case "null":
					case "boolean": return bucketTypes[0];
					case "number": return combineNumbers(bucketTypes);
					case "string": return combineStrings(bucketTypes, opts);
					case "buffer": return combineBuffers(bucketTypes, opts);
					case "array":
						bucketTypes = bucketTypes.filter(function(t) {
							return t !== opts.emptyArrayType;
						});
						if (!bucketTypes.length) return opts.emptyArrayType;
						return Type.forSchema({
							type: "array",
							items: Type.forTypes(bucketTypes.map(function(t) {
								return t.itemsType;
							}), opts)
						}, opts);
					default: return combineObjects(bucketTypes, opts);
				}
			});
			if (augmented.length === 1) return augmented[0];
			else return Type.forSchema(augmented, opts);
		};
		Type.isType = function() {
			var l = arguments.length;
			if (!l) return false;
			var any = arguments[0];
			if (!any || typeof any._update != "function" || typeof any.fingerprint != "function") return false;
			if (l === 1) return true;
			var typeName = any.typeName;
			var i;
			for (i = 1; i < l; i++) if (typeName.indexOf(arguments[i]) === 0) return true;
			return false;
		};
		Type.__reset = function(size) {
			debug("resetting type buffer to %d", size);
			TAP.buf = utils2.newSlowBuffer(size);
		};
		Object.defineProperty(Type.prototype, "branchName", {
			enumerable: true,
			get: function() {
				var type = Type.isType(this, "logical") ? this.underlyingType : this;
				if (type.name) return type.name;
				if (Type.isType(type, "abstract")) return type._concreteTypeName;
				return Type.isType(type, "union") ? void 0 : type.typeName;
			}
		});
		Type.prototype.clone = function(val, opts) {
			if (opts) {
				opts = {
					coerce: !!opts.coerceBuffers | 0,
					fieldHook: opts.fieldHook,
					qualifyNames: !!opts.qualifyNames,
					skip: !!opts.skipMissingFields,
					wrap: !!opts.wrapUnions | 0
				};
				return this._copy(val, opts);
			} else return this.fromBuffer(this.toBuffer(val));
		};
		Type.prototype.compare = utils2.abstractFunction;
		Type.prototype.compareBuffers = function(buf1, buf2) {
			return this._match(new Tap(buf1), new Tap(buf2));
		};
		Type.prototype.createResolver = function(type, opts) {
			if (!Type.isType(type)) throw new Error(f("not a type: %j", type));
			if (!Type.isType(this, "union", "logical") && Type.isType(type, "logical")) return this.createResolver(type.underlyingType, opts);
			opts = opts || {};
			opts.registry = opts.registry || {};
			var resolver, key;
			if (Type.isType(this, "record", "error") && Type.isType(type, "record", "error")) {
				key = this.name + ":" + type.name;
				resolver = opts.registry[key];
				if (resolver) return resolver;
			}
			resolver = new Resolver(this);
			if (key) opts.registry[key] = resolver;
			if (Type.isType(type, "union")) {
				var resolvers = type.types.map(function(t) {
					return this.createResolver(t, opts);
				}, this);
				resolver._read = function(tap) {
					var index = tap.readLong();
					if (resolvers[index] === void 0) throw new Error(f("invalid union index: %s", index));
					return resolvers[index]._read(tap);
				};
			} else this._update(resolver, type, opts);
			if (!resolver._read) throw new Error(f("cannot read %s as %s", type, this));
			return Object.freeze(resolver);
		};
		Type.prototype.decode = function(buf, pos, resolver) {
			var tap = new Tap(buf, pos);
			var val = readValue(this, tap, resolver);
			if (!tap.isValid()) return {
				value: void 0,
				offset: -1
			};
			return {
				value: val,
				offset: tap.pos
			};
		};
		Type.prototype.encode = function(val, buf, pos) {
			var tap = new Tap(buf, pos);
			this._write(tap, val);
			if (!tap.isValid()) return buf.length - tap.pos;
			return tap.pos;
		};
		Type.prototype.equals = function(type, opts) {
			var canon = Type.isType(type) && this.fingerprint().equals(type.fingerprint());
			if (!canon || !(opts && opts.strict)) return canon;
			return JSON.stringify(this.schema({ exportAttrs: true })) === JSON.stringify(type.schema({ exportAttrs: true }));
		};
		Type.prototype.fingerprint = function(algorithm) {
			if (!algorithm) {
				if (!this._hash.str) {
					var schemaStr = JSON.stringify(this.schema());
					this._hash.str = utils2.getHash(schemaStr).toString("binary");
				}
				return utils2.bufferFrom(this._hash.str, "binary");
			} else return utils2.getHash(JSON.stringify(this.schema()), algorithm);
		};
		Type.prototype.fromBuffer = function(buf, resolver, noCheck) {
			var tap = new Tap(buf);
			var val = readValue(this, tap, resolver, noCheck);
			if (!tap.isValid()) throw new Error("truncated buffer");
			if (!noCheck && tap.pos < buf.length) throw new Error("trailing data");
			return val;
		};
		Type.prototype.fromString = function(str) {
			return this._copy(JSON.parse(str), { coerce: 2 });
		};
		Type.prototype.inspect = function() {
			var typeName = this.typeName;
			var className = getClassName(typeName);
			if (isPrimitive(typeName)) return f("<%s>", className);
			else {
				var obj = this.schema({
					exportAttrs: true,
					noDeref: true
				});
				if (typeof obj == "object" && !Type.isType(this, "logical")) obj.type = void 0;
				return f("<%s %j>", className, obj);
			}
		};
		Type.prototype.isValid = function(val, opts) {
			var flags = (opts && opts.noUndeclaredFields) | 0;
			var errorHook = opts && opts.errorHook;
			var hook, path;
			if (errorHook) {
				path = [];
				hook = function(any, type) {
					errorHook.call(this, path.slice(), any, type, val);
				};
			}
			return this._check(val, flags, hook, path);
		};
		Type.prototype.random = utils2.abstractFunction;
		Type.prototype.schema = function(opts) {
			return this._attrs({
				exportAttrs: !!(opts && opts.exportAttrs),
				noDeref: !!(opts && opts.noDeref)
			});
		};
		Type.prototype.toBuffer = function(val) {
			TAP.pos = 0;
			this._write(TAP, val);
			var buf = utils2.newBuffer(TAP.pos);
			if (TAP.isValid()) TAP.buf.copy(buf, 0, 0, TAP.pos);
			else this._write(new Tap(buf), val);
			return buf;
		};
		Type.prototype.toJSON = function() {
			return this.schema({ exportAttrs: true });
		};
		Type.prototype.toString = function(val) {
			if (val === void 0) return JSON.stringify(this.schema({ noDeref: true }));
			return JSON.stringify(this._copy(val, { coerce: 3 }));
		};
		Type.prototype.wrap = function(val) {
			var Branch = this._branchConstructor;
			return Branch === null ? null : new Branch(val);
		};
		Type.prototype._attrs = function(opts) {
			opts.derefed = opts.derefed || {};
			var name = this.name;
			if (name !== void 0) {
				if (opts.noDeref || opts.derefed[name]) return name;
				opts.derefed[name] = true;
			}
			var schema = {};
			if (this.name !== void 0) schema.name = name;
			schema.type = this.typeName;
			var derefedSchema = this._deref(schema, opts);
			if (derefedSchema !== void 0) schema = derefedSchema;
			if (opts.exportAttrs) {
				if (this.aliases && this.aliases.length) schema.aliases = this.aliases;
				if (this.doc !== void 0) schema.doc = this.doc;
			}
			return schema;
		};
		Type.prototype._createBranchConstructor = function() {
			var name = this.branchName;
			if (name === "null") return null;
			var attr = ~name.indexOf(".") ? "this['" + name + "']" : "this." + name;
			var body = "return function Branch$(val) { " + attr + " = val; };";
			var Branch = new Function(body)();
			Branch.type = this;
			Branch.prototype.unwrap = new Function("return " + attr + ";");
			Branch.prototype.unwrapped = Branch.prototype.unwrap;
			return Branch;
		};
		Type.prototype._peek = function(tap) {
			var pos = tap.pos;
			var val = this._read(tap);
			tap.pos = pos;
			return val;
		};
		Type.prototype._check = utils2.abstractFunction;
		Type.prototype._copy = utils2.abstractFunction;
		Type.prototype._deref = utils2.abstractFunction;
		Type.prototype._match = utils2.abstractFunction;
		Type.prototype._read = utils2.abstractFunction;
		Type.prototype._skip = utils2.abstractFunction;
		Type.prototype._update = utils2.abstractFunction;
		Type.prototype._write = utils2.abstractFunction;
		Type.prototype.getAliases = function() {
			return this.aliases;
		};
		Type.prototype.getFingerprint = Type.prototype.fingerprint;
		Type.prototype.getName = function(asBranch) {
			return this.name || !asBranch ? this.name : this.branchName;
		};
		Type.prototype.getSchema = Type.prototype.schema;
		Type.prototype.getTypeName = function() {
			return this.typeName;
		};
		function PrimitiveType(noFreeze) {
			Type.call(this);
			this._branchConstructor = this._createBranchConstructor();
			if (!noFreeze) Object.freeze(this);
		}
		util2.inherits(PrimitiveType, Type);
		PrimitiveType.prototype._update = function(resolver, type) {
			if (type.typeName === this.typeName) resolver._read = this._read;
		};
		PrimitiveType.prototype._copy = function(val) {
			this._check(val, void 0, throwInvalidError);
			return val;
		};
		PrimitiveType.prototype._deref = function() {
			return this.typeName;
		};
		PrimitiveType.prototype.compare = utils2.compare;
		function NullType() {
			PrimitiveType.call(this);
		}
		util2.inherits(NullType, PrimitiveType);
		NullType.prototype._check = function(val, flags, hook) {
			var b = val === null;
			if (!b && hook) hook(val, this);
			return b;
		};
		NullType.prototype._read = function() {
			return null;
		};
		NullType.prototype._skip = function() {};
		NullType.prototype._write = function(tap, val) {
			if (val !== null) throwInvalidError(val, this);
		};
		NullType.prototype._match = function() {
			return 0;
		};
		NullType.prototype.compare = NullType.prototype._match;
		NullType.prototype.typeName = "null";
		NullType.prototype.random = NullType.prototype._read;
		function BooleanType() {
			PrimitiveType.call(this);
		}
		util2.inherits(BooleanType, PrimitiveType);
		BooleanType.prototype._check = function(val, flags, hook) {
			var b = typeof val == "boolean";
			if (!b && hook) hook(val, this);
			return b;
		};
		BooleanType.prototype._read = function(tap) {
			return tap.readBoolean();
		};
		BooleanType.prototype._skip = function(tap) {
			tap.skipBoolean();
		};
		BooleanType.prototype._write = function(tap, val) {
			if (typeof val != "boolean") throwInvalidError(val, this);
			tap.writeBoolean(val);
		};
		BooleanType.prototype._match = function(tap1, tap2) {
			return tap1.matchBoolean(tap2);
		};
		BooleanType.prototype.typeName = "boolean";
		BooleanType.prototype.random = function() {
			return RANDOM.nextBoolean();
		};
		function IntType() {
			PrimitiveType.call(this);
		}
		util2.inherits(IntType, PrimitiveType);
		IntType.prototype._check = function(val, flags, hook) {
			var b = val === (val | 0);
			if (!b && hook) hook(val, this);
			return b;
		};
		IntType.prototype._read = function(tap) {
			return tap.readInt();
		};
		IntType.prototype._skip = function(tap) {
			tap.skipInt();
		};
		IntType.prototype._write = function(tap, val) {
			if (val !== (val | 0)) throwInvalidError(val, this);
			tap.writeInt(val);
		};
		IntType.prototype._match = function(tap1, tap2) {
			return tap1.matchInt(tap2);
		};
		IntType.prototype.typeName = "int";
		IntType.prototype.random = function() {
			return RANDOM.nextInt(1e3) | 0;
		};
		function LongType() {
			PrimitiveType.call(this);
		}
		util2.inherits(LongType, PrimitiveType);
		LongType.prototype._check = function(val, flags, hook) {
			var b = typeof val == "number" && val % 1 === 0 && isSafeLong(val);
			if (!b && hook) hook(val, this);
			return b;
		};
		LongType.prototype._read = function(tap) {
			var n = tap.readLong();
			if (!isSafeLong(n)) throw new Error("potential precision loss");
			return n;
		};
		LongType.prototype._skip = function(tap) {
			tap.skipLong();
		};
		LongType.prototype._write = function(tap, val) {
			if (typeof val != "number" || val % 1 || !isSafeLong(val)) throwInvalidError(val, this);
			tap.writeLong(val);
		};
		LongType.prototype._match = function(tap1, tap2) {
			return tap1.matchLong(tap2);
		};
		LongType.prototype._update = function(resolver, type) {
			switch (type.typeName) {
				case "int":
					resolver._read = type._read;
					break;
				case "abstract:long":
				case "long": resolver._read = this._read;
			}
		};
		LongType.prototype.typeName = "long";
		LongType.prototype.random = function() {
			return RANDOM.nextInt();
		};
		LongType.__with = function(methods, noUnpack) {
			methods = methods || {};
			var mapping = {
				toBuffer: "_toBuffer",
				fromBuffer: "_fromBuffer",
				fromJSON: "_fromJSON",
				toJSON: "_toJSON",
				isValid: "_isValid",
				compare: "compare"
			};
			var type = new AbstractLongType(noUnpack);
			Object.keys(mapping).forEach(function(name) {
				if (methods[name] === void 0) throw new Error(f("missing method implementation: %s", name));
				type[mapping[name]] = methods[name];
			});
			return Object.freeze(type);
		};
		function FloatType() {
			PrimitiveType.call(this);
		}
		util2.inherits(FloatType, PrimitiveType);
		FloatType.prototype._check = function(val, flags, hook) {
			var b = typeof val == "number";
			if (!b && hook) hook(val, this);
			return b;
		};
		FloatType.prototype._read = function(tap) {
			return tap.readFloat();
		};
		FloatType.prototype._skip = function(tap) {
			tap.skipFloat();
		};
		FloatType.prototype._write = function(tap, val) {
			if (typeof val != "number") throwInvalidError(val, this);
			tap.writeFloat(val);
		};
		FloatType.prototype._match = function(tap1, tap2) {
			return tap1.matchFloat(tap2);
		};
		FloatType.prototype._update = function(resolver, type) {
			switch (type.typeName) {
				case "float":
				case "int":
					resolver._read = type._read;
					break;
				case "abstract:long":
				case "long": resolver._read = function(tap) {
					return tap.readLong();
				};
			}
		};
		FloatType.prototype.typeName = "float";
		FloatType.prototype.random = function() {
			return RANDOM.nextFloat(1e3);
		};
		function DoubleType() {
			PrimitiveType.call(this);
		}
		util2.inherits(DoubleType, PrimitiveType);
		DoubleType.prototype._check = function(val, flags, hook) {
			var b = typeof val == "number";
			if (!b && hook) hook(val, this);
			return b;
		};
		DoubleType.prototype._read = function(tap) {
			return tap.readDouble();
		};
		DoubleType.prototype._skip = function(tap) {
			tap.skipDouble();
		};
		DoubleType.prototype._write = function(tap, val) {
			if (typeof val != "number") throwInvalidError(val, this);
			tap.writeDouble(val);
		};
		DoubleType.prototype._match = function(tap1, tap2) {
			return tap1.matchDouble(tap2);
		};
		DoubleType.prototype._update = function(resolver, type) {
			switch (type.typeName) {
				case "double":
				case "float":
				case "int":
					resolver._read = type._read;
					break;
				case "abstract:long":
				case "long": resolver._read = function(tap) {
					return tap.readLong();
				};
			}
		};
		DoubleType.prototype.typeName = "double";
		DoubleType.prototype.random = function() {
			return RANDOM.nextFloat();
		};
		function StringType() {
			PrimitiveType.call(this);
		}
		util2.inherits(StringType, PrimitiveType);
		StringType.prototype._check = function(val, flags, hook) {
			var b = typeof val == "string";
			if (!b && hook) hook(val, this);
			return b;
		};
		StringType.prototype._read = function(tap) {
			return tap.readString();
		};
		StringType.prototype._skip = function(tap) {
			tap.skipString();
		};
		StringType.prototype._write = function(tap, val) {
			if (typeof val != "string") throwInvalidError(val, this);
			tap.writeString(val);
		};
		StringType.prototype._match = function(tap1, tap2) {
			return tap1.matchString(tap2);
		};
		StringType.prototype._update = function(resolver, type) {
			switch (type.typeName) {
				case "bytes":
				case "string": resolver._read = this._read;
			}
		};
		StringType.prototype.typeName = "string";
		StringType.prototype.random = function() {
			return RANDOM.nextString(RANDOM.nextInt(32));
		};
		function BytesType() {
			PrimitiveType.call(this);
		}
		util2.inherits(BytesType, PrimitiveType);
		BytesType.prototype._check = function(val, flags, hook) {
			var b = Buffer3.isBuffer(val);
			if (!b && hook) hook(val, this);
			return b;
		};
		BytesType.prototype._read = function(tap) {
			return tap.readBytes();
		};
		BytesType.prototype._skip = function(tap) {
			tap.skipBytes();
		};
		BytesType.prototype._write = function(tap, val) {
			if (!Buffer3.isBuffer(val)) throwInvalidError(val, this);
			tap.writeBytes(val);
		};
		BytesType.prototype._match = function(tap1, tap2) {
			return tap1.matchBytes(tap2);
		};
		BytesType.prototype._update = StringType.prototype._update;
		BytesType.prototype._copy = function(obj, opts) {
			var buf;
			switch ((opts && opts.coerce) | 0) {
				case 3:
					this._check(obj, void 0, throwInvalidError);
					return obj.toString("binary");
				case 2:
					if (typeof obj != "string") throw new Error(f("cannot coerce to buffer: %j", obj));
					buf = utils2.bufferFrom(obj, "binary");
					this._check(buf, void 0, throwInvalidError);
					return buf;
				case 1:
					if (!isJsonBuffer(obj)) throw new Error(f("cannot coerce to buffer: %j", obj));
					buf = utils2.bufferFrom(obj.data);
					this._check(buf, void 0, throwInvalidError);
					return buf;
				default:
					this._check(obj, void 0, throwInvalidError);
					return utils2.bufferFrom(obj);
			}
		};
		BytesType.prototype.compare = Buffer3.compare;
		BytesType.prototype.typeName = "bytes";
		BytesType.prototype.random = function() {
			return RANDOM.nextBuffer(RANDOM.nextInt(32));
		};
		function UnionType(schema, opts) {
			Type.call(this);
			if (!Array.isArray(schema)) throw new Error(f("non-array union schema: %j", schema));
			if (!schema.length) throw new Error("empty union");
			this.types = Object.freeze(schema.map(function(obj) {
				return Type.forSchema(obj, opts);
			}));
			this._branchIndices = {};
			this.types.forEach(function(type, i) {
				if (Type.isType(type, "union")) throw new Error("unions cannot be directly nested");
				var branch = type.branchName;
				if (this._branchIndices[branch] !== void 0) throw new Error(f("duplicate union branch name: %j", branch));
				this._branchIndices[branch] = i;
			}, this);
		}
		util2.inherits(UnionType, Type);
		UnionType.prototype._branchConstructor = function() {
			throw new Error("unions cannot be directly wrapped");
		};
		UnionType.prototype._skip = function(tap) {
			this.types[tap.readLong()]._skip(tap);
		};
		UnionType.prototype._match = function(tap1, tap2) {
			var n1 = tap1.readLong();
			var n2 = tap2.readLong();
			if (n1 === n2) return this.types[n1]._match(tap1, tap2);
			else return n1 < n2 ? -1 : 1;
		};
		UnionType.prototype._deref = function(schema, opts) {
			return this.types.map(function(t) {
				return t._attrs(opts);
			});
		};
		UnionType.prototype.getTypes = function() {
			return this.types;
		};
		function UnwrappedUnionType(schema, opts) {
			UnionType.call(this, schema, opts);
			this._dynamicBranches = null;
			this._bucketIndices = {};
			this.types.forEach(function(type, index) {
				if (Type.isType(type, "abstract", "logical")) {
					if (!this._dynamicBranches) this._dynamicBranches = [];
					this._dynamicBranches.push({
						index,
						type
					});
				} else {
					var bucket = getTypeBucket(type);
					if (this._bucketIndices[bucket] !== void 0) throw new Error(f("ambiguous unwrapped union: %j", this));
					this._bucketIndices[bucket] = index;
				}
			}, this);
			Object.freeze(this);
		}
		util2.inherits(UnwrappedUnionType, UnionType);
		UnwrappedUnionType.prototype._getIndex = function(val) {
			var index = this._bucketIndices[getValueBucket(val)];
			if (this._dynamicBranches) index = this._getBranchIndex(val, index);
			return index;
		};
		UnwrappedUnionType.prototype._getBranchIndex = function(any, index) {
			var logicalBranches = this._dynamicBranches;
			var i, l, branch;
			for (i = 0, l = logicalBranches.length; i < l; i++) {
				branch = logicalBranches[i];
				if (branch.type._check(any)) if (index === void 0) index = branch.index;
				else throw new Error("ambiguous conversion");
			}
			return index;
		};
		UnwrappedUnionType.prototype._check = function(val, flags, hook, path) {
			var index = this._getIndex(val);
			var b = index !== void 0;
			if (b) return this.types[index]._check(val, flags, hook, path);
			if (hook) hook(val, this);
			return b;
		};
		UnwrappedUnionType.prototype._read = function(tap) {
			var index = tap.readLong();
			var branchType = this.types[index];
			if (branchType) return branchType._read(tap);
			else throw new Error(f("invalid union index: %s", index));
		};
		UnwrappedUnionType.prototype._write = function(tap, val) {
			var index = this._getIndex(val);
			if (index === void 0) throwInvalidError(val, this);
			tap.writeLong(index);
			if (val !== null) this.types[index]._write(tap, val);
		};
		UnwrappedUnionType.prototype._update = function(resolver, type, opts) {
			var i, l, typeResolver;
			for (i = 0, l = this.types.length; i < l; i++) {
				try {
					typeResolver = this.types[i].createResolver(type, opts);
				} catch (err) {
					continue;
				}
				resolver._read = function(tap) {
					return typeResolver._read(tap);
				};
				return;
			}
		};
		UnwrappedUnionType.prototype._copy = function(val, opts) {
			var coerce = opts && opts.coerce | 0;
			var wrap = opts && opts.wrap | 0;
			var index;
			if (wrap === 2) index = 0;
			else {
				switch (coerce) {
					case 1:
						if (isJsonBuffer(val) && this._bucketIndices.buffer !== void 0) index = this._bucketIndices.buffer;
						else index = this._getIndex(val);
						break;
					case 2:
						if (val === null) index = this._bucketIndices["null"];
						else if (typeof val === "object") {
							var keys = Object.keys(val);
							if (keys.length === 1) {
								index = this._branchIndices[keys[0]];
								val = val[keys[0]];
							}
						}
						break;
					default: index = this._getIndex(val);
				}
				if (index === void 0) throwInvalidError(val, this);
			}
			var type = this.types[index];
			if (val === null || wrap === 3) return type._copy(val, opts);
			else switch (coerce) {
				case 3:
					var obj = {};
					obj[type.branchName] = type._copy(val, opts);
					return obj;
				default: return type._copy(val, opts);
			}
		};
		UnwrappedUnionType.prototype.compare = function(val1, val2) {
			var index1 = this._getIndex(val1);
			var index2 = this._getIndex(val2);
			if (index1 === void 0) throwInvalidError(val1, this);
			else if (index2 === void 0) throwInvalidError(val2, this);
			else if (index1 === index2) return this.types[index1].compare(val1, val2);
			else return utils2.compare(index1, index2);
		};
		UnwrappedUnionType.prototype.typeName = "union:unwrapped";
		UnwrappedUnionType.prototype.random = function() {
			var index = RANDOM.nextInt(this.types.length);
			return this.types[index].random();
		};
		function WrappedUnionType(schema, opts) {
			UnionType.call(this, schema, opts);
			Object.freeze(this);
		}
		util2.inherits(WrappedUnionType, UnionType);
		WrappedUnionType.prototype._check = function(val, flags, hook, path) {
			var b = false;
			if (val === null) b = this._branchIndices["null"] !== void 0;
			else if (typeof val == "object") {
				var keys = Object.keys(val);
				if (keys.length === 1) {
					var name = keys[0];
					var index = this._branchIndices[name];
					if (index !== void 0) if (hook) {
						path.push(name);
						b = this.types[index]._check(val[name], flags, hook, path);
						path.pop();
						return b;
					} else return this.types[index]._check(val[name], flags);
				}
			}
			if (!b && hook) hook(val, this);
			return b;
		};
		WrappedUnionType.prototype._read = function(tap) {
			var type = this.types[tap.readLong()];
			if (!type) throw new Error(f("invalid union index"));
			var Branch = type._branchConstructor;
			if (Branch === null) return null;
			else return new Branch(type._read(tap));
		};
		WrappedUnionType.prototype._write = function(tap, val) {
			var index, keys, name;
			if (val === null) {
				index = this._branchIndices["null"];
				if (index === void 0) throwInvalidError(val, this);
				tap.writeLong(index);
			} else {
				keys = Object.keys(val);
				if (keys.length === 1) {
					name = keys[0];
					index = this._branchIndices[name];
				}
				if (index === void 0) throwInvalidError(val, this);
				tap.writeLong(index);
				this.types[index]._write(tap, val[name]);
			}
		};
		WrappedUnionType.prototype._update = function(resolver, type, opts) {
			var i, l, typeResolver, Branch;
			for (i = 0, l = this.types.length; i < l; i++) {
				try {
					typeResolver = this.types[i].createResolver(type, opts);
				} catch (err) {
					continue;
				}
				Branch = this.types[i]._branchConstructor;
				if (Branch) resolver._read = function(tap) {
					return new Branch(typeResolver._read(tap));
				};
				else resolver._read = function() {
					return null;
				};
				return;
			}
		};
		WrappedUnionType.prototype._copy = function(val, opts) {
			var wrap = opts && opts.wrap | 0;
			if (wrap === 2) {
				var firstType = this.types[0];
				if (val === null && firstType.typeName === "null") return null;
				return new firstType._branchConstructor(firstType._copy(val, opts));
			}
			if (val === null && this._branchIndices["null"] !== void 0) return null;
			var i, l, obj;
			if (typeof val == "object") {
				var keys = Object.keys(val);
				if (keys.length === 1) {
					var name = keys[0];
					i = this._branchIndices[name];
					if (i === void 0 && opts.qualifyNames) {
						var j, type;
						for (j = 0, l = this.types.length; j < l; j++) {
							type = this.types[j];
							if (type.name && name === utils2.unqualify(type.name)) {
								i = j;
								break;
							}
						}
					}
					if (i !== void 0) obj = this.types[i]._copy(val[name], opts);
				}
			}
			if (wrap === 1 && obj === void 0) {
				i = 0;
				l = this.types.length;
				while (i < l && obj === void 0) try {
					obj = this.types[i]._copy(val, opts);
				} catch (err) {
					i++;
				}
			}
			if (obj !== void 0) return wrap === 3 ? obj : new this.types[i]._branchConstructor(obj);
			throwInvalidError(val, this);
		};
		WrappedUnionType.prototype.compare = function(val1, val2) {
			var name1 = val1 === null ? "null" : Object.keys(val1)[0];
			var name2 = val2 === null ? "null" : Object.keys(val2)[0];
			var index = this._branchIndices[name1];
			if (name1 === name2) return name1 === "null" ? 0 : this.types[index].compare(val1[name1], val2[name1]);
			else return utils2.compare(index, this._branchIndices[name2]);
		};
		WrappedUnionType.prototype.typeName = "union:wrapped";
		WrappedUnionType.prototype.random = function() {
			var index = RANDOM.nextInt(this.types.length);
			var type = this.types[index];
			var Branch = type._branchConstructor;
			if (!Branch) return null;
			return new Branch(type.random());
		};
		function EnumType(schema, opts) {
			Type.call(this, schema, opts);
			if (!Array.isArray(schema.symbols) || !schema.symbols.length) throw new Error(f("invalid enum symbols: %j", schema.symbols));
			this.symbols = Object.freeze(schema.symbols.slice());
			this._indices = {};
			this.symbols.forEach(function(symbol, i) {
				if (!utils2.isValidName(symbol)) throw new Error(f("invalid %s symbol: %j", this, symbol));
				if (this._indices[symbol] !== void 0) throw new Error(f("duplicate %s symbol: %j", this, symbol));
				this._indices[symbol] = i;
			}, this);
			this.default = schema.default;
			if (this.default !== void 0 && this._indices[this.default] === void 0) throw new Error(f("invalid %s default: %j", this, this.default));
			this._branchConstructor = this._createBranchConstructor();
			Object.freeze(this);
		}
		util2.inherits(EnumType, Type);
		EnumType.prototype._check = function(val, flags, hook) {
			var b = this._indices[val] !== void 0;
			if (!b && hook) hook(val, this);
			return b;
		};
		EnumType.prototype._read = function(tap) {
			var index = tap.readLong();
			var symbol = this.symbols[index];
			if (symbol === void 0) throw new Error(f("invalid %s enum index: %s", this.name, index));
			return symbol;
		};
		EnumType.prototype._skip = function(tap) {
			tap.skipLong();
		};
		EnumType.prototype._write = function(tap, val) {
			var index = this._indices[val];
			if (index === void 0) throwInvalidError(val, this);
			tap.writeLong(index);
		};
		EnumType.prototype._match = function(tap1, tap2) {
			return tap1.matchLong(tap2);
		};
		EnumType.prototype.compare = function(val1, val2) {
			return utils2.compare(this._indices[val1], this._indices[val2]);
		};
		EnumType.prototype._update = function(resolver, type, opts) {
			var symbols = this.symbols;
			if (type.typeName === "enum" && hasCompatibleName(this, type, !opts.ignoreNamespaces) && (type.symbols.every(function(s) {
				return ~symbols.indexOf(s);
			}) || this.default !== void 0)) {
				resolver.symbols = type.symbols.map(function(s) {
					return this._indices[s] === void 0 ? this.default : s;
				}, this);
				resolver._read = type._read;
			}
		};
		EnumType.prototype._copy = function(val) {
			this._check(val, void 0, throwInvalidError);
			return val;
		};
		EnumType.prototype._deref = function(schema) {
			schema.symbols = this.symbols;
		};
		EnumType.prototype.getSymbols = function() {
			return this.symbols;
		};
		EnumType.prototype.typeName = "enum";
		EnumType.prototype.random = function() {
			return RANDOM.choice(this.symbols);
		};
		function FixedType(schema, opts) {
			Type.call(this, schema, opts);
			if (schema.size !== (schema.size | 0) || schema.size < 0) throw new Error(f("invalid %s size", this.branchName));
			this.size = schema.size | 0;
			this._branchConstructor = this._createBranchConstructor();
			Object.freeze(this);
		}
		util2.inherits(FixedType, Type);
		FixedType.prototype._check = function(val, flags, hook) {
			var b = Buffer3.isBuffer(val) && val.length === this.size;
			if (!b && hook) hook(val, this);
			return b;
		};
		FixedType.prototype._read = function(tap) {
			return tap.readFixed(this.size);
		};
		FixedType.prototype._skip = function(tap) {
			tap.skipFixed(this.size);
		};
		FixedType.prototype._write = function(tap, val) {
			if (!Buffer3.isBuffer(val) || val.length !== this.size) throwInvalidError(val, this);
			tap.writeFixed(val, this.size);
		};
		FixedType.prototype._match = function(tap1, tap2) {
			return tap1.matchFixed(tap2, this.size);
		};
		FixedType.prototype.compare = Buffer3.compare;
		FixedType.prototype._update = function(resolver, type, opts) {
			if (type.typeName === "fixed" && this.size === type.size && hasCompatibleName(this, type, !opts.ignoreNamespaces)) {
				resolver.size = this.size;
				resolver._read = this._read;
			}
		};
		FixedType.prototype._copy = BytesType.prototype._copy;
		FixedType.prototype._deref = function(schema) {
			schema.size = this.size;
		};
		FixedType.prototype.getSize = function() {
			return this.size;
		};
		FixedType.prototype.typeName = "fixed";
		FixedType.prototype.random = function() {
			return RANDOM.nextBuffer(this.size);
		};
		function MapType(schema, opts) {
			Type.call(this);
			if (!schema.values) throw new Error(f("missing map values: %j", schema));
			this.valuesType = Type.forSchema(schema.values, opts);
			this._branchConstructor = this._createBranchConstructor();
			Object.freeze(this);
		}
		util2.inherits(MapType, Type);
		MapType.prototype._check = function(val, flags, hook, path) {
			if (!val || typeof val != "object" || Array.isArray(val)) {
				if (hook) hook(val, this);
				return false;
			}
			var keys = Object.keys(val);
			var b = true;
			var i, l, j, key;
			if (hook) {
				j = path.length;
				path.push("");
				for (i = 0, l = keys.length; i < l; i++) {
					key = path[j] = keys[i];
					if (!this.valuesType._check(val[key], flags, hook, path)) b = false;
				}
				path.pop();
			} else for (i = 0, l = keys.length; i < l; i++) if (!this.valuesType._check(val[keys[i]], flags)) return false;
			return b;
		};
		MapType.prototype._read = function(tap) {
			var values = this.valuesType;
			var val = {};
			var n;
			while (n = readArraySize(tap)) while (n--) {
				var key = tap.readString();
				val[key] = values._read(tap);
			}
			return val;
		};
		MapType.prototype._skip = function(tap) {
			var values = this.valuesType;
			var len, n;
			while (n = tap.readLong()) if (n < 0) {
				len = tap.readLong();
				tap.pos += len;
			} else while (n--) {
				tap.skipString();
				values._skip(tap);
			}
		};
		MapType.prototype._write = function(tap, val) {
			if (!val || typeof val != "object" || Array.isArray(val)) throwInvalidError(val, this);
			var values = this.valuesType;
			var keys = Object.keys(val);
			var n = keys.length;
			var i, key;
			if (n) {
				tap.writeLong(n);
				for (i = 0; i < n; i++) {
					key = keys[i];
					tap.writeString(key);
					values._write(tap, val[key]);
				}
			}
			tap.writeLong(0);
		};
		MapType.prototype._match = function() {
			throw new Error("maps cannot be compared");
		};
		MapType.prototype._update = function(rsv, type, opts) {
			if (type.typeName === "map") {
				rsv.valuesType = this.valuesType.createResolver(type.valuesType, opts);
				rsv._read = this._read;
			}
		};
		MapType.prototype._copy = function(val, opts) {
			if (val && typeof val == "object" && !Array.isArray(val)) {
				var values = this.valuesType;
				var keys = Object.keys(val);
				var i, l, key;
				var copy = {};
				for (i = 0, l = keys.length; i < l; i++) {
					key = keys[i];
					copy[key] = values._copy(val[key], opts);
				}
				return copy;
			}
			throwInvalidError(val, this);
		};
		MapType.prototype.compare = MapType.prototype._match;
		MapType.prototype.typeName = "map";
		MapType.prototype.getValuesType = function() {
			return this.valuesType;
		};
		MapType.prototype.random = function() {
			var val = {};
			var i, l;
			for (i = 0, l = RANDOM.nextInt(10); i < l; i++) val[RANDOM.nextString(RANDOM.nextInt(20))] = this.valuesType.random();
			return val;
		};
		MapType.prototype._deref = function(schema, opts) {
			schema.values = this.valuesType._attrs(opts);
		};
		function ArrayType(schema, opts) {
			Type.call(this);
			if (!schema.items) throw new Error(f("missing array items: %j", schema));
			this.itemsType = Type.forSchema(schema.items, opts);
			this._branchConstructor = this._createBranchConstructor();
			Object.freeze(this);
		}
		util2.inherits(ArrayType, Type);
		ArrayType.prototype._check = function(val, flags, hook, path) {
			if (!Array.isArray(val)) {
				if (hook) hook(val, this);
				return false;
			}
			var items = this.itemsType;
			var b = true;
			var i, l, j;
			if (hook) {
				j = path.length;
				path.push("");
				for (i = 0, l = val.length; i < l; i++) {
					path[j] = "" + i;
					if (!items._check(val[i], flags, hook, path)) b = false;
				}
				path.pop();
			} else for (i = 0, l = val.length; i < l; i++) if (!items._check(val[i], flags)) return false;
			return b;
		};
		ArrayType.prototype._read = function(tap) {
			var items = this.itemsType;
			var i = 0;
			var val, n;
			while (n = tap.readLong()) {
				if (n < 0) {
					n = -n;
					tap.skipLong();
				}
				val = val || new Array(n);
				while (n--) val[i++] = items._read(tap);
			}
			return val || [];
		};
		ArrayType.prototype._skip = function(tap) {
			var items = this.itemsType;
			var len, n;
			while (n = tap.readLong()) if (n < 0) {
				len = tap.readLong();
				tap.pos += len;
			} else while (n--) items._skip(tap);
		};
		ArrayType.prototype._write = function(tap, val) {
			if (!Array.isArray(val)) throwInvalidError(val, this);
			var items = this.itemsType;
			var n = val.length;
			var i;
			if (n) {
				tap.writeLong(n);
				for (i = 0; i < n; i++) items._write(tap, val[i]);
			}
			tap.writeLong(0);
		};
		ArrayType.prototype._match = function(tap1, tap2) {
			var n1 = tap1.readLong();
			var n2 = tap2.readLong();
			var f2;
			while (n1 && n2) {
				f2 = this.itemsType._match(tap1, tap2);
				if (f2) return f2;
				if (!--n1) n1 = readArraySize(tap1);
				if (!--n2) n2 = readArraySize(tap2);
			}
			return utils2.compare(n1, n2);
		};
		ArrayType.prototype._update = function(resolver, type, opts) {
			if (type.typeName === "array") {
				resolver.itemsType = this.itemsType.createResolver(type.itemsType, opts);
				resolver._read = this._read;
			}
		};
		ArrayType.prototype._copy = function(val, opts) {
			if (!Array.isArray(val)) throwInvalidError(val, this);
			var items = new Array(val.length);
			var i, l;
			for (i = 0, l = val.length; i < l; i++) items[i] = this.itemsType._copy(val[i], opts);
			return items;
		};
		ArrayType.prototype._deref = function(schema, opts) {
			schema.items = this.itemsType._attrs(opts);
		};
		ArrayType.prototype.compare = function(val1, val2) {
			var n1 = val1.length;
			var n2 = val2.length;
			var i, l, f2;
			for (i = 0, l = Math.min(n1, n2); i < l; i++) if (f2 = this.itemsType.compare(val1[i], val2[i])) return f2;
			return utils2.compare(n1, n2);
		};
		ArrayType.prototype.getItemsType = function() {
			return this.itemsType;
		};
		ArrayType.prototype.typeName = "array";
		ArrayType.prototype.random = function() {
			var arr = [];
			var i, l;
			for (i = 0, l = RANDOM.nextInt(10); i < l; i++) arr.push(this.itemsType.random());
			return arr;
		};
		function RecordType(schema, opts) {
			opts = opts || {};
			var namespace = opts.namespace;
			if (schema.namespace !== void 0) opts.namespace = schema.namespace;
			else if (schema.name) {
				var ns = utils2.impliedNamespace(schema.name);
				if (ns !== void 0) opts.namespace = ns;
			}
			Type.call(this, schema, opts);
			if (!Array.isArray(schema.fields)) throw new Error(f("non-array record fields: %j", schema.fields));
			if (utils2.hasDuplicates(schema.fields, function(f2) {
				return f2.name;
			})) throw new Error(f("duplicate field name: %j", schema.fields));
			this._fieldsByName = {};
			this.fields = Object.freeze(schema.fields.map(function(f2) {
				var field = new Field(f2, opts);
				this._fieldsByName[field.name] = field;
				return field;
			}, this));
			this._branchConstructor = this._createBranchConstructor();
			this._isError = schema.type === "error";
			this.recordConstructor = this._createConstructor(opts.errorStackTraces, opts.omitRecordMethods);
			this._read = this._createReader();
			this._skip = this._createSkipper();
			this._write = this._createWriter();
			this._check = this._createChecker();
			opts.namespace = namespace;
			Object.freeze(this);
		}
		util2.inherits(RecordType, Type);
		RecordType.prototype._getConstructorName = function() {
			return this.name ? utils2.capitalize(utils2.unqualify(this.name)) : this._isError ? "Error$" : "Record$";
		};
		RecordType.prototype._createConstructor = function(errorStack, plainRecords) {
			var outerArgs = [];
			var innerArgs = [];
			var ds = [];
			var innerBody = "";
			var i, l, field, name, defaultValue, hasDefault, stackField;
			for (i = 0, l = this.fields.length; i < l; i++) {
				field = this.fields[i];
				defaultValue = field.defaultValue;
				hasDefault = defaultValue() !== void 0;
				name = field.name;
				if (errorStack && this._isError && name === "stack" && Type.isType(field.type, "string") && !hasDefault) stackField = field;
				innerArgs.push("v" + i);
				innerBody += "  ";
				if (!hasDefault) innerBody += "this." + name + " = v" + i + ";\n";
				else {
					innerBody += "if (v" + i + " === undefined) { ";
					innerBody += "this." + name + " = d" + ds.length + "(); ";
					innerBody += "} else { this." + name + " = v" + i + "; }\n";
					outerArgs.push("d" + ds.length);
					ds.push(defaultValue);
				}
			}
			if (stackField) {
				innerBody += "  if (this.stack === undefined) { ";
				if (typeof Error.captureStackTrace == "function") innerBody += "Error.captureStackTrace(this, this.constructor);";
				else innerBody += "this.stack = Error().stack;";
				innerBody += " }\n";
			}
			var outerBody = "return function " + this._getConstructorName() + "(";
			outerBody += innerArgs.join() + ") {\n" + innerBody + "};";
			var Record = new Function(outerArgs.join(), outerBody).apply(void 0, ds);
			if (plainRecords) return Record;
			var self2 = this;
			Record.getType = function() {
				return self2;
			};
			Record.type = self2;
			if (this._isError) {
				util2.inherits(Record, Error);
				Record.prototype.name = this._getConstructorName();
			}
			Record.prototype.clone = function(o) {
				return self2.clone(this, o);
			};
			Record.prototype.compare = function(v) {
				return self2.compare(this, v);
			};
			Record.prototype.isValid = function(o) {
				return self2.isValid(this, o);
			};
			Record.prototype.toBuffer = function() {
				return self2.toBuffer(this);
			};
			Record.prototype.toString = function() {
				return self2.toString(this);
			};
			Record.prototype.wrap = function() {
				return self2.wrap(this);
			};
			Record.prototype.wrapped = Record.prototype.wrap;
			return Record;
		};
		RecordType.prototype._createChecker = function() {
			var names = [];
			var values = [];
			var body = "return function check" + this._getConstructorName() + "(v, f, h, p) {\n";
			body += "  if (\n";
			body += "    v === null ||\n";
			body += "    typeof v != 'object' ||\n";
			body += "    (f && !this._checkFields(v))\n";
			body += "  ) {\n";
			body += "    if (h) { h(v, this); }\n";
			body += "    return false;\n";
			body += "  }\n";
			if (!this.fields.length) body += "  return true;\n";
			else {
				for (i = 0, l = this.fields.length; i < l; i++) {
					field = this.fields[i];
					names.push("t" + i);
					values.push(field.type);
					if (field.defaultValue() !== void 0) body += "  var v" + i + " = v." + field.name + ";\n";
				}
				body += "  if (h) {\n";
				body += "    var b = 1;\n";
				body += "    var j = p.length;\n";
				body += "    p.push('');\n";
				var i, l, field;
				for (i = 0, l = this.fields.length; i < l; i++) {
					field = this.fields[i];
					body += "    p[j] = '" + field.name + "';\n";
					body += "    b &= ";
					if (field.defaultValue() === void 0) body += "t" + i + "._check(v." + field.name + ", f, h, p);\n";
					else {
						body += "v" + i + " === undefined || ";
						body += "t" + i + "._check(v" + i + ", f, h, p);\n";
					}
				}
				body += "    p.pop();\n";
				body += "    return !!b;\n";
				body += "  } else {\n    return (\n      ";
				body += this.fields.map(function(field2, i2) {
					return field2.defaultValue() === void 0 ? "t" + i2 + "._check(v." + field2.name + ", f)" : "(v" + i2 + " === undefined || t" + i2 + "._check(v" + i2 + ", f))";
				}).join(" &&\n      ");
				body += "\n    );\n  }\n";
			}
			body += "};";
			return new Function(names.join(), body).apply(void 0, values);
		};
		RecordType.prototype._createReader = function() {
			var names = [];
			var values = [this.recordConstructor];
			var i, l;
			for (i = 0, l = this.fields.length; i < l; i++) {
				names.push("t" + i);
				values.push(this.fields[i].type);
			}
			var name = this._getConstructorName();
			var body = "return function read" + name + "(t) {\n";
			body += "  return new " + name + "(\n    ";
			body += names.map(function(s) {
				return s + "._read(t)";
			}).join(",\n    ");
			body += "\n  );\n};";
			names.unshift(name);
			return new Function(names.join(), body).apply(void 0, values);
		};
		RecordType.prototype._createSkipper = function() {
			var args = [];
			var body = "return function skip" + this._getConstructorName() + "(t) {\n";
			var values = [];
			var i, l;
			for (i = 0, l = this.fields.length; i < l; i++) {
				args.push("t" + i);
				values.push(this.fields[i].type);
				body += "  t" + i + "._skip(t);\n";
			}
			body += "}";
			return new Function(args.join(), body).apply(void 0, values);
		};
		RecordType.prototype._createWriter = function() {
			var args = [];
			var body = "return function write" + this._getConstructorName() + "(t, v) {\n";
			var values = [];
			var i, l, field, value;
			for (i = 0, l = this.fields.length; i < l; i++) {
				field = this.fields[i];
				args.push("t" + i);
				values.push(field.type);
				body += "  ";
				if (field.defaultValue() === void 0) body += "t" + i + "._write(t, v." + field.name + ");\n";
				else {
					value = field.type.toBuffer(field.defaultValue()).toString("binary");
					args.push("d" + i);
					values.push(value);
					body += "var v" + i + " = v." + field.name + ";\n";
					body += "if (v" + i + " === undefined) {\n";
					body += "    t.writeBinary(d" + i + ", " + value.length + ");\n";
					body += "  } else {\n    t" + i + "._write(t, v" + i + ");\n  }\n";
				}
			}
			body += "}";
			return new Function(args.join(), body).apply(void 0, values);
		};
		RecordType.prototype._update = function(resolver, type, opts) {
			if (!hasCompatibleName(this, type, !opts.ignoreNamespaces)) throw new Error(f("no alias found for %s", type.name));
			var rFields = this.fields;
			var wFields = type.fields;
			var wFieldsMap = utils2.toMap(wFields, function(f2) {
				return f2.name;
			});
			var innerArgs = [];
			var resolvers = {};
			var i, j, field, name, names, matches, fieldResolver;
			for (i = 0; i < rFields.length; i++) {
				field = rFields[i];
				names = getAliases(field);
				matches = [];
				for (j = 0; j < names.length; j++) {
					name = names[j];
					if (wFieldsMap[name]) matches.push(name);
				}
				if (matches.length > 1) throw new Error(f("ambiguous aliasing for %s.%s (%s)", type.name, field.name, matches));
				if (!matches.length) {
					if (field.defaultValue() === void 0) throw new Error(f("no matching field for default-less %s.%s", type.name, field.name));
					innerArgs.push("undefined");
				} else {
					name = matches[0];
					fieldResolver = {
						resolver: field.type.createResolver(wFieldsMap[name].type, opts),
						name: "_" + field.name
					};
					if (!resolvers[name]) resolvers[name] = [fieldResolver];
					else resolvers[name].push(fieldResolver);
					innerArgs.push(fieldResolver.name);
				}
			}
			var lazyIndex = -1;
			i = wFields.length;
			while (i && resolvers[wFields[--i].name] === void 0) lazyIndex = i;
			var uname = this._getConstructorName();
			var args = [uname];
			var values = [this.recordConstructor];
			var body = "  return function read" + uname + "(t, b) {\n";
			for (i = 0; i < wFields.length; i++) {
				if (i === lazyIndex) body += "  if (!b) {\n";
				field = type.fields[i];
				name = field.name;
				if (resolvers[name] === void 0) {
					body += ~lazyIndex && i >= lazyIndex ? "    " : "  ";
					args.push("r" + i);
					values.push(field.type);
					body += "r" + i + "._skip(t);\n";
				} else {
					j = resolvers[name].length;
					while (j--) {
						body += ~lazyIndex && i >= lazyIndex ? "    " : "  ";
						args.push("r" + i + "f" + j);
						fieldResolver = resolvers[name][j];
						values.push(fieldResolver.resolver);
						body += "var " + fieldResolver.name + " = ";
						body += "r" + i + "f" + j + "._" + (j ? "peek" : "read") + "(t);\n";
					}
				}
			}
			if (~lazyIndex) body += "  }\n";
			body += "  return new " + uname + "(" + innerArgs.join() + ");\n};";
			resolver._read = new Function(args.join(), body).apply(void 0, values);
		};
		RecordType.prototype._match = function(tap1, tap2) {
			var fields = this.fields;
			var i, l, field, order, type;
			for (i = 0, l = fields.length; i < l; i++) {
				field = fields[i];
				order = field._order;
				type = field.type;
				if (order) {
					order *= type._match(tap1, tap2);
					if (order) return order;
				} else {
					type._skip(tap1);
					type._skip(tap2);
				}
			}
			return 0;
		};
		RecordType.prototype._checkFields = function(obj) {
			var keys = Object.keys(obj);
			var i, l;
			for (i = 0, l = keys.length; i < l; i++) if (!this._fieldsByName[keys[i]]) return false;
			return true;
		};
		RecordType.prototype._copy = function(val, opts) {
			var hook = opts && opts.fieldHook;
			var values = [void 0];
			var i, l, field, value;
			for (i = 0, l = this.fields.length; i < l; i++) {
				field = this.fields[i];
				value = val[field.name];
				if (value === void 0 && field.hasOwnProperty("defaultValue")) value = field.defaultValue();
				if (opts && !opts.skip || value !== void 0) value = field.type._copy(value, opts);
				if (hook) value = hook(field, value, this);
				values.push(value);
			}
			var Record = this.recordConstructor;
			return new (Record.bind.apply(Record, values))();
		};
		RecordType.prototype._deref = function(schema, opts) {
			schema.fields = this.fields.map(function(field) {
				var fieldType = field.type;
				var fieldSchema = {
					name: field.name,
					type: fieldType._attrs(opts)
				};
				if (opts.exportAttrs) {
					var val = field.defaultValue();
					if (val !== void 0) fieldSchema["default"] = fieldType._copy(val, {
						coerce: 3,
						wrap: 3
					});
					var fieldOrder = field.order;
					if (fieldOrder !== "ascending") fieldSchema.order = fieldOrder;
					var fieldAliases = field.aliases;
					if (fieldAliases.length) fieldSchema.aliases = fieldAliases;
					var fieldDoc = field.doc;
					if (fieldDoc !== void 0) fieldSchema.doc = fieldDoc;
				}
				return fieldSchema;
			});
		};
		RecordType.prototype.compare = function(val1, val2) {
			var fields = this.fields;
			var i, l, field, name, order, type;
			for (i = 0, l = fields.length; i < l; i++) {
				field = fields[i];
				name = field.name;
				order = field._order;
				type = field.type;
				if (order) {
					order *= type.compare(val1[name], val2[name]);
					if (order) return order;
				}
			}
			return 0;
		};
		RecordType.prototype.random = function() {
			var fields = this.fields.map(function(f2) {
				return f2.type.random();
			});
			fields.unshift(void 0);
			var Record = this.recordConstructor;
			return new (Record.bind.apply(Record, fields))();
		};
		RecordType.prototype.field = function(name) {
			return this._fieldsByName[name];
		};
		RecordType.prototype.getField = RecordType.prototype.field;
		RecordType.prototype.getFields = function() {
			return this.fields;
		};
		RecordType.prototype.getRecordConstructor = function() {
			return this.recordConstructor;
		};
		Object.defineProperty(RecordType.prototype, "typeName", {
			enumerable: true,
			get: function() {
				return this._isError ? "error" : "record";
			}
		});
		function LogicalType(schema, opts) {
			this._logicalTypeName = schema.logicalType;
			Type.call(this);
			LOGICAL_TYPE = this;
			try {
				this._underlyingType = Type.forSchema(schema, opts);
			} finally {
				LOGICAL_TYPE = null;
				var l = UNDERLYING_TYPES.length;
				if (l && UNDERLYING_TYPES[l - 1][0] === this) UNDERLYING_TYPES.pop();
			}
			if (Type.isType(this.underlyingType, "union")) this._branchConstructor = this.underlyingType._branchConstructor;
			else this._branchConstructor = this.underlyingType._createBranchConstructor();
		}
		util2.inherits(LogicalType, Type);
		Object.defineProperty(LogicalType.prototype, "typeName", {
			enumerable: true,
			get: function() {
				return "logical:" + this._logicalTypeName;
			}
		});
		Object.defineProperty(LogicalType.prototype, "underlyingType", {
			enumerable: true,
			get: function() {
				if (this._underlyingType) return this._underlyingType;
				var i, l, arr;
				for (i = 0, l = UNDERLYING_TYPES.length; i < l; i++) {
					arr = UNDERLYING_TYPES[i];
					if (arr[0] === this) return arr[1];
				}
			}
		});
		LogicalType.prototype.getUnderlyingType = function() {
			return this.underlyingType;
		};
		LogicalType.prototype._read = function(tap) {
			return this._fromValue(this.underlyingType._read(tap));
		};
		LogicalType.prototype._write = function(tap, any) {
			this.underlyingType._write(tap, this._toValue(any));
		};
		LogicalType.prototype._check = function(any, flags, hook, path) {
			try {
				var val = this._toValue(any);
			} catch (err) {}
			if (val === void 0) {
				if (hook) hook(any, this);
				return false;
			}
			return this.underlyingType._check(val, flags, hook, path);
		};
		LogicalType.prototype._copy = function(any, opts) {
			var type = this.underlyingType;
			switch (opts && opts.coerce) {
				case 3: return type._copy(this._toValue(any), opts);
				case 2: return this._fromValue(type._copy(any, opts));
				default: return this._fromValue(type._copy(this._toValue(any), opts));
			}
		};
		LogicalType.prototype._update = function(resolver, type, opts) {
			var _fromValue = this._resolve(type, opts);
			if (_fromValue) resolver._read = function(tap) {
				return _fromValue(type._read(tap));
			};
		};
		LogicalType.prototype.compare = function(obj1, obj2) {
			var val1 = this._toValue(obj1);
			var val2 = this._toValue(obj2);
			return this.underlyingType.compare(val1, val2);
		};
		LogicalType.prototype.random = function() {
			return this._fromValue(this.underlyingType.random());
		};
		LogicalType.prototype._deref = function(schema, opts) {
			var type = this.underlyingType;
			var isVisited = type.name !== void 0 && opts.derefed[type.name];
			schema = type._attrs(opts);
			if (!isVisited && opts.exportAttrs) {
				if (typeof schema == "string") schema = { type: schema };
				schema.logicalType = this._logicalTypeName;
				this._export(schema);
			}
			return schema;
		};
		LogicalType.prototype._skip = function(tap) {
			this.underlyingType._skip(tap);
		};
		LogicalType.prototype._export = function() {};
		LogicalType.prototype._fromValue = utils2.abstractFunction;
		LogicalType.prototype._toValue = utils2.abstractFunction;
		LogicalType.prototype._resolve = utils2.abstractFunction;
		function AbstractLongType(noUnpack) {
			this._concreteTypeName = "long";
			PrimitiveType.call(this, true);
			this._noUnpack = !!noUnpack;
		}
		util2.inherits(AbstractLongType, LongType);
		AbstractLongType.prototype.typeName = "abstract:long";
		AbstractLongType.prototype._check = function(val, flags, hook) {
			var b = this._isValid(val);
			if (!b && hook) hook(val, this);
			return b;
		};
		AbstractLongType.prototype._read = function(tap) {
			var buf, pos;
			if (this._noUnpack) {
				pos = tap.pos;
				tap.skipLong();
				buf = tap.buf.slice(pos, tap.pos);
			} else buf = tap.unpackLongBytes(tap);
			if (tap.isValid()) return this._fromBuffer(buf);
		};
		AbstractLongType.prototype._write = function(tap, val) {
			if (!this._isValid(val)) throwInvalidError(val, this);
			var buf = this._toBuffer(val);
			if (this._noUnpack) tap.writeFixed(buf);
			else tap.packLongBytes(buf);
		};
		AbstractLongType.prototype._copy = function(val, opts) {
			switch (opts && opts.coerce) {
				case 3: return this._toJSON(val);
				case 2: return this._fromJSON(val);
				default: return this._fromJSON(this._toJSON(val));
			}
		};
		AbstractLongType.prototype._deref = function() {
			return "long";
		};
		AbstractLongType.prototype._update = function(resolver, type) {
			var self2 = this;
			switch (type.typeName) {
				case "int":
					resolver._read = function(tap) {
						return self2._fromJSON(type._read(tap));
					};
					break;
				case "abstract:long":
				case "long": resolver._read = function(tap) {
					return self2._read(tap);
				};
			}
		};
		AbstractLongType.prototype.random = function() {
			return this._fromJSON(LongType.prototype.random());
		};
		AbstractLongType.prototype._fromBuffer = utils2.abstractFunction;
		AbstractLongType.prototype._toBuffer = utils2.abstractFunction;
		AbstractLongType.prototype._fromJSON = utils2.abstractFunction;
		AbstractLongType.prototype._toJSON = utils2.abstractFunction;
		AbstractLongType.prototype._isValid = utils2.abstractFunction;
		AbstractLongType.prototype.compare = utils2.abstractFunction;
		function Field(schema, opts) {
			var name = schema.name;
			if (typeof name != "string" || !utils2.isValidName(name)) throw new Error(f("invalid field name: %s", name));
			this.name = name;
			this.type = Type.forSchema(schema.type, opts);
			this.aliases = schema.aliases || [];
			this.doc = schema.doc !== void 0 ? "" + schema.doc : void 0;
			this._order = (function(order) {
				switch (order) {
					case "ascending": return 1;
					case "descending": return -1;
					case "ignore": return 0;
					default: throw new Error(f("invalid order: %j", order));
				}
			})(schema.order === void 0 ? "ascending" : schema.order);
			var value = schema["default"];
			if (value !== void 0) {
				var type = this.type;
				var val;
				try {
					val = type._copy(value, {
						coerce: 2,
						wrap: 2
					});
				} catch (err) {
					var msg = f("incompatible field default %j (%s)", value, err.message);
					if (Type.isType(type, "union")) msg += f(", union defaults must match the first branch's type (%j)", type.types[0]);
					throw new Error(msg);
				}
				if (isPrimitive(type.typeName) && type.typeName !== "bytes") this.defaultValue = function() {
					return val;
				};
				else this.defaultValue = function() {
					return type._copy(val);
				};
			}
			Object.freeze(this);
		}
		Field.prototype.defaultValue = function() {};
		Object.defineProperty(Field.prototype, "order", {
			enumerable: true,
			get: function() {
				return [
					"descending",
					"ignore",
					"ascending"
				][this._order + 1];
			}
		});
		Field.prototype.getAliases = function() {
			return this.aliases;
		};
		Field.prototype.getDefault = Field.prototype.defaultValue;
		Field.prototype.getName = function() {
			return this.name;
		};
		Field.prototype.getOrder = function() {
			return this.order;
		};
		Field.prototype.getType = function() {
			return this.type;
		};
		function Resolver(readerType) {
			this._readerType = readerType;
			this._read = null;
			this.itemsType = null;
			this.size = 0;
			this.symbols = null;
			this.valuesType = null;
		}
		Resolver.prototype._peek = Type.prototype._peek;
		Resolver.prototype.inspect = function() {
			return "<Resolver>";
		};
		function Hash() {
			this.str = void 0;
		}
		function readValue(type, tap, resolver, lazy) {
			if (resolver) {
				if (resolver._readerType !== type) throw new Error("invalid resolver");
				return resolver._read(tap, lazy);
			} else return type._read(tap);
		}
		function getAliases(obj) {
			var names = {};
			if (obj.name) names[obj.name] = true;
			var aliases = obj.aliases;
			var i, l;
			for (i = 0, l = aliases.length; i < l; i++) names[aliases[i]] = true;
			return Object.keys(names);
		}
		function hasCompatibleName(reader, writer, strict) {
			if (!writer.name) return true;
			var name = strict ? writer.name : utils2.unqualify(writer.name);
			var aliases = getAliases(reader);
			var i, l, alias;
			for (i = 0, l = aliases.length; i < l; i++) {
				alias = aliases[i];
				if (!strict) alias = utils2.unqualify(alias);
				if (alias === name) return true;
			}
			return false;
		}
		function isPrimitive(typeName) {
			var type = TYPES[typeName];
			return type && type.prototype instanceof PrimitiveType;
		}
		function getClassName(typeName) {
			if (typeName === "error") typeName = "record";
			else {
				var match = /^([^:]+):(.*)$/.exec(typeName);
				if (match) if (match[1] === "union") typeName = match[2] + "Union";
				else typeName = match[1];
			}
			return utils2.capitalize(typeName) + "Type";
		}
		function readArraySize(tap) {
			var n = tap.readLong();
			if (n < 0) {
				n = -n;
				tap.skipLong();
			}
			return n;
		}
		function isSafeLong(n) {
			return n >= -9007199254740990 && n <= 9007199254740990;
		}
		function isJsonBuffer(obj) {
			return obj && obj.type === "Buffer" && Array.isArray(obj.data);
		}
		function throwInvalidError(val, type) {
			throw new Error(f("invalid %j: %j", type.schema(), val));
		}
		function maybeQualify(name, ns) {
			var unqualified = utils2.unqualify(name);
			return isPrimitive(unqualified) ? unqualified : utils2.qualify(name, ns);
		}
		function getTypeBucket(type) {
			var typeName = type.typeName;
			switch (typeName) {
				case "double":
				case "float":
				case "int":
				case "long": return "number";
				case "bytes":
				case "fixed": return "buffer";
				case "enum": return "string";
				case "map":
				case "error":
				case "record": return "object";
				default: return typeName;
			}
		}
		function getValueBucket(val) {
			if (val === null) return "null";
			var bucket = typeof val;
			if (bucket === "object") {
				if (Array.isArray(val)) return "array";
				else if (Buffer3.isBuffer(val)) return "buffer";
			}
			return bucket;
		}
		function isAmbiguous(types) {
			var buckets = {};
			var i, l, bucket, type;
			for (i = 0, l = types.length; i < l; i++) {
				type = types[i];
				if (!Type.isType(type, "logical")) {
					bucket = getTypeBucket(type);
					if (buckets[bucket]) return true;
					buckets[bucket] = true;
				}
			}
			return false;
		}
		function combineNumbers(types) {
			var typeNames = [
				"int",
				"long",
				"float",
				"double"
			];
			var superIndex = -1;
			var superType = null;
			var i, l, type, index;
			for (i = 0, l = types.length; i < l; i++) {
				type = types[i];
				index = typeNames.indexOf(type.typeName);
				if (index > superIndex) {
					superIndex = index;
					superType = type;
				}
			}
			return superType;
		}
		function combineStrings(types, opts) {
			var symbols = {};
			var i, l, type, typeSymbols;
			for (i = 0, l = types.length; i < l; i++) {
				type = types[i];
				if (type.typeName === "string") return type;
				typeSymbols = type.symbols;
				var j, m;
				for (j = 0, m = typeSymbols.length; j < m; j++) symbols[typeSymbols[j]] = true;
			}
			return Type.forSchema({
				type: "enum",
				symbols: Object.keys(symbols)
			}, opts);
		}
		function combineBuffers(types, opts) {
			var size = -1;
			var i, l, type;
			for (i = 0, l = types.length; i < l; i++) {
				type = types[i];
				if (type.typeName === "bytes") return type;
				if (size === -1) size = type.size;
				else if (type.size !== size) size = -2;
			}
			return size < 0 ? Type.forSchema("bytes", opts) : types[0];
		}
		function combineObjects(types, opts) {
			var allTypes = [];
			var fieldTypes = {};
			var fieldDefaults = {};
			var isValidRecord = true;
			var i, l, type, fields;
			for (i = 0, l = types.length; i < l; i++) {
				type = types[i];
				if (type.typeName === "map") {
					isValidRecord = false;
					allTypes.push(type.valuesType);
				} else {
					fields = type.fields;
					var j, m, field, fieldDefault, fieldName, fieldType;
					for (j = 0, m = fields.length; j < m; j++) {
						field = fields[j];
						fieldName = field.name;
						fieldType = field.type;
						allTypes.push(fieldType);
						if (isValidRecord) {
							if (!fieldTypes[fieldName]) fieldTypes[fieldName] = [];
							fieldTypes[fieldName].push(fieldType);
							fieldDefault = field.defaultValue();
							if (fieldDefault !== void 0) fieldDefaults[fieldName] = fieldDefault;
						}
					}
				}
			}
			if (isValidRecord) {
				var fieldNames = Object.keys(fieldTypes);
				for (i = 0, l = fieldNames.length; i < l; i++) {
					fieldName = fieldNames[i];
					if (fieldTypes[fieldName].length < types.length && fieldDefaults[fieldName] === void 0) if (opts && opts.strictDefaults) isValidRecord = false;
					else {
						fieldTypes[fieldName].unshift(Type.forSchema("null", opts));
						fieldDefaults[fieldName] = null;
					}
				}
			}
			var schema;
			if (isValidRecord) schema = {
				type: "record",
				fields: fieldNames.map(function(s) {
					var fieldType2 = Type.forTypes(fieldTypes[s], opts);
					var fieldDefault2 = fieldDefaults[s];
					if (fieldDefault2 !== void 0 && ~fieldType2.typeName.indexOf("union")) {
						var unionTypes = fieldType2.types.slice();
						var i2, l2;
						for (i2 = 0, l2 = unionTypes.length; i2 < l2; i2++) if (unionTypes[i2].isValid(fieldDefault2)) break;
						if (i2 > 0) {
							var unionType = unionTypes[0];
							unionTypes[0] = unionTypes[i2];
							unionTypes[i2] = unionType;
							fieldType2 = Type.forSchema(unionTypes, opts);
						}
					}
					return {
						name: s,
						type: fieldType2,
						"default": fieldDefaults[s]
					};
				})
			};
			else schema = {
				type: "map",
				values: Type.forTypes(allTypes, opts)
			};
			return Type.forSchema(schema, opts);
		}
		module2.exports = {
			Type,
			getTypeBucket,
			getValueBucket,
			isPrimitive,
			builtins: (function() {
				var types = {
					LogicalType,
					UnwrappedUnionType,
					WrappedUnionType
				};
				var typeNames = Object.keys(TYPES);
				var i, l, typeName;
				for (i = 0, l = typeNames.length; i < l; i++) {
					typeName = typeNames[i];
					types[getClassName(typeName)] = TYPES[typeName];
				}
				return types;
			})()
		};
	} });
	var require_avsc_types = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/etc/browser/avsc-types.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var types = require_types2();
		function parse(any, opts) {
			var schema;
			if (typeof any == "string") try {
				schema = JSON.parse(any);
			} catch (err) {
				schema = any;
			}
			else schema = any;
			return types.Type.forSchema(schema, opts);
		}
		module2.exports = {
			Type: types.Type,
			parse,
			types: types.builtins,
			combine: types.Type.forTypes,
			infer: types.Type.forValue
		};
	} });
	var require_events = __commonJS({ "../../../node_modules/.pnpm/events@3.3.0/node_modules/events/events.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var R = typeof Reflect === "object" ? Reflect : null;
		var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
			return Function.prototype.apply.call(target, receiver, args);
		};
		var ReflectOwnKeys;
		if (R && typeof R.ownKeys === "function") ReflectOwnKeys = R.ownKeys;
		else if (Object.getOwnPropertySymbols) ReflectOwnKeys = function ReflectOwnKeys2(target) {
			return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
		};
		else ReflectOwnKeys = function ReflectOwnKeys2(target) {
			return Object.getOwnPropertyNames(target);
		};
		function ProcessEmitWarning(warning) {
			if (console && console.warn) console.warn(warning);
		}
		var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
			return value !== value;
		};
		function EventEmitter() {
			EventEmitter.init.call(this);
		}
		module2.exports = EventEmitter;
		module2.exports.once = once;
		EventEmitter.EventEmitter = EventEmitter;
		EventEmitter.prototype._events = void 0;
		EventEmitter.prototype._eventsCount = 0;
		EventEmitter.prototype._maxListeners = void 0;
		var defaultMaxListeners = 10;
		function checkListener(listener) {
			if (typeof listener !== "function") throw new TypeError("The \"listener\" argument must be of type Function. Received type " + typeof listener);
		}
		Object.defineProperty(EventEmitter, "defaultMaxListeners", {
			enumerable: true,
			get: function() {
				return defaultMaxListeners;
			},
			set: function(arg) {
				if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) throw new RangeError("The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received " + arg + ".");
				defaultMaxListeners = arg;
			}
		});
		EventEmitter.init = function() {
			if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
				this._events = /* @__PURE__ */ Object.create(null);
				this._eventsCount = 0;
			}
			this._maxListeners = this._maxListeners || void 0;
		};
		EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
			if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) throw new RangeError("The value of \"n\" is out of range. It must be a non-negative number. Received " + n + ".");
			this._maxListeners = n;
			return this;
		};
		function _getMaxListeners(that) {
			if (that._maxListeners === void 0) return EventEmitter.defaultMaxListeners;
			return that._maxListeners;
		}
		EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
			return _getMaxListeners(this);
		};
		EventEmitter.prototype.emit = function emit(type) {
			var args = [];
			for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
			var doError = type === "error";
			var events = this._events;
			if (events !== void 0) doError = doError && events.error === void 0;
			else if (!doError) return false;
			if (doError) {
				var er;
				if (args.length > 0) er = args[0];
				if (er instanceof Error) throw er;
				var err = /* @__PURE__ */ new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
				err.context = er;
				throw err;
			}
			var handler = events[type];
			if (handler === void 0) return false;
			if (typeof handler === "function") ReflectApply(handler, this, args);
			else {
				var len = handler.length;
				var listeners = arrayClone(handler, len);
				for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
			}
			return true;
		};
		function _addListener(target, type, listener, prepend) {
			var m;
			var events;
			var existing;
			checkListener(listener);
			events = target._events;
			if (events === void 0) {
				events = target._events = /* @__PURE__ */ Object.create(null);
				target._eventsCount = 0;
			} else {
				if (events.newListener !== void 0) {
					target.emit("newListener", type, listener.listener ? listener.listener : listener);
					events = target._events;
				}
				existing = events[type];
			}
			if (existing === void 0) {
				existing = events[type] = listener;
				++target._eventsCount;
			} else {
				if (typeof existing === "function") existing = events[type] = prepend ? [listener, existing] : [existing, listener];
				else if (prepend) existing.unshift(listener);
				else existing.push(listener);
				m = _getMaxListeners(target);
				if (m > 0 && existing.length > m && !existing.warned) {
					existing.warned = true;
					var w = /* @__PURE__ */ new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
					w.name = "MaxListenersExceededWarning";
					w.emitter = target;
					w.type = type;
					w.count = existing.length;
					ProcessEmitWarning(w);
				}
			}
			return target;
		}
		EventEmitter.prototype.addListener = function addListener(type, listener) {
			return _addListener(this, type, listener, false);
		};
		EventEmitter.prototype.on = EventEmitter.prototype.addListener;
		EventEmitter.prototype.prependListener = function prependListener(type, listener) {
			return _addListener(this, type, listener, true);
		};
		function onceWrapper() {
			if (!this.fired) {
				this.target.removeListener(this.type, this.wrapFn);
				this.fired = true;
				if (arguments.length === 0) return this.listener.call(this.target);
				return this.listener.apply(this.target, arguments);
			}
		}
		function _onceWrap(target, type, listener) {
			var state = {
				fired: false,
				wrapFn: void 0,
				target,
				type,
				listener
			};
			var wrapped = onceWrapper.bind(state);
			wrapped.listener = listener;
			state.wrapFn = wrapped;
			return wrapped;
		}
		EventEmitter.prototype.once = function once2(type, listener) {
			checkListener(listener);
			this.on(type, _onceWrap(this, type, listener));
			return this;
		};
		EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
			checkListener(listener);
			this.prependListener(type, _onceWrap(this, type, listener));
			return this;
		};
		EventEmitter.prototype.removeListener = function removeListener(type, listener) {
			var list, events, position, i, originalListener;
			checkListener(listener);
			events = this._events;
			if (events === void 0) return this;
			list = events[type];
			if (list === void 0) return this;
			if (list === listener || list.listener === listener) if (--this._eventsCount === 0) this._events = /* @__PURE__ */ Object.create(null);
			else {
				delete events[type];
				if (events.removeListener) this.emit("removeListener", type, list.listener || listener);
			}
			else if (typeof list !== "function") {
				position = -1;
				for (i = list.length - 1; i >= 0; i--) if (list[i] === listener || list[i].listener === listener) {
					originalListener = list[i].listener;
					position = i;
					break;
				}
				if (position < 0) return this;
				if (position === 0) list.shift();
				else spliceOne(list, position);
				if (list.length === 1) events[type] = list[0];
				if (events.removeListener !== void 0) this.emit("removeListener", type, originalListener || listener);
			}
			return this;
		};
		EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
		EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
			var listeners, events = this._events, i;
			if (events === void 0) return this;
			if (events.removeListener === void 0) {
				if (arguments.length === 0) {
					this._events = /* @__PURE__ */ Object.create(null);
					this._eventsCount = 0;
				} else if (events[type] !== void 0) if (--this._eventsCount === 0) this._events = /* @__PURE__ */ Object.create(null);
				else delete events[type];
				return this;
			}
			if (arguments.length === 0) {
				var keys = Object.keys(events);
				var key;
				for (i = 0; i < keys.length; ++i) {
					key = keys[i];
					if (key === "removeListener") continue;
					this.removeAllListeners(key);
				}
				this.removeAllListeners("removeListener");
				this._events = /* @__PURE__ */ Object.create(null);
				this._eventsCount = 0;
				return this;
			}
			listeners = events[type];
			if (typeof listeners === "function") this.removeListener(type, listeners);
			else if (listeners !== void 0) for (i = listeners.length - 1; i >= 0; i--) this.removeListener(type, listeners[i]);
			return this;
		};
		function _listeners(target, type, unwrap) {
			var events = target._events;
			if (events === void 0) return [];
			var evlistener = events[type];
			if (evlistener === void 0) return [];
			if (typeof evlistener === "function") return unwrap ? [evlistener.listener || evlistener] : [evlistener];
			return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
		}
		EventEmitter.prototype.listeners = function listeners(type) {
			return _listeners(this, type, true);
		};
		EventEmitter.prototype.rawListeners = function rawListeners(type) {
			return _listeners(this, type, false);
		};
		EventEmitter.listenerCount = function(emitter, type) {
			if (typeof emitter.listenerCount === "function") return emitter.listenerCount(type);
			else return listenerCount.call(emitter, type);
		};
		EventEmitter.prototype.listenerCount = listenerCount;
		function listenerCount(type) {
			var events = this._events;
			if (events !== void 0) {
				var evlistener = events[type];
				if (typeof evlistener === "function") return 1;
				else if (evlistener !== void 0) return evlistener.length;
			}
			return 0;
		}
		EventEmitter.prototype.eventNames = function eventNames() {
			return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
		};
		function arrayClone(arr, n) {
			var copy = new Array(n);
			for (var i = 0; i < n; ++i) copy[i] = arr[i];
			return copy;
		}
		function spliceOne(list, index) {
			for (; index + 1 < list.length; index++) list[index] = list[index + 1];
			list.pop();
		}
		function unwrapListeners(arr) {
			var ret = new Array(arr.length);
			for (var i = 0; i < ret.length; ++i) ret[i] = arr[i].listener || arr[i];
			return ret;
		}
		function once(emitter, name) {
			return new Promise(function(resolve, reject) {
				function errorListener(err) {
					emitter.removeListener(name, resolver);
					reject(err);
				}
				function resolver() {
					if (typeof emitter.removeListener === "function") emitter.removeListener("error", errorListener);
					resolve([].slice.call(arguments));
				}
				eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
				if (name !== "error") addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
			});
		}
		function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
			if (typeof emitter.on === "function") eventTargetAgnosticAddListener(emitter, "error", handler, flags);
		}
		function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
			if (typeof emitter.on === "function") if (flags.once) emitter.once(name, listener);
			else emitter.on(name, listener);
			else if (typeof emitter.addEventListener === "function") emitter.addEventListener(name, function wrapListener(arg) {
				if (flags.once) emitter.removeEventListener(name, wrapListener);
				listener(arg);
			});
			else throw new TypeError("The \"emitter\" argument must be of type EventEmitter. Received type " + typeof emitter);
		}
	} });
	var require_stream_browser = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/stream-browser.js"(exports2, module2) {
		init_browser_globals();
		module2.exports = require_events().EventEmitter;
	} });
	var require_buffer_list = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/buffer_list.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function ownKeys(object, enumerableOnly) {
			var keys = Object.keys(object);
			if (Object.getOwnPropertySymbols) {
				var symbols = Object.getOwnPropertySymbols(object);
				enumerableOnly && (symbols = symbols.filter(function(sym) {
					return Object.getOwnPropertyDescriptor(object, sym).enumerable;
				})), keys.push.apply(keys, symbols);
			}
			return keys;
		}
		function _objectSpread(target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = null != arguments[i] ? arguments[i] : {};
				i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
					_defineProperty(target, key, source[key]);
				}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
					Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
				});
			}
			return target;
		}
		function _defineProperty(obj, key, value) {
			key = _toPropertyKey(key);
			if (key in obj) Object.defineProperty(obj, key, {
				value,
				enumerable: true,
				configurable: true,
				writable: true
			});
			else obj[key] = value;
			return obj;
		}
		function _classCallCheck(instance, Constructor) {
			if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
		}
		function _defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
			}
		}
		function _createClass(Constructor, protoProps, staticProps) {
			if (protoProps) _defineProperties(Constructor.prototype, protoProps);
			if (staticProps) _defineProperties(Constructor, staticProps);
			Object.defineProperty(Constructor, "prototype", { writable: false });
			return Constructor;
		}
		function _toPropertyKey(arg) {
			var key = _toPrimitive(arg, "string");
			return typeof key === "symbol" ? key : String(key);
		}
		function _toPrimitive(input, hint) {
			if (typeof input !== "object" || input === null) return input;
			var prim = input[Symbol.toPrimitive];
			if (prim !== void 0) {
				var res = prim.call(input, hint || "default");
				if (typeof res !== "object") return res;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return (hint === "string" ? String : Number)(input);
		}
		var Buffer3 = require_buffer().Buffer;
		var inspect = require_util().inspect;
		var custom = inspect && inspect.custom || "inspect";
		function copyBuffer(src, target, offset) {
			Buffer3.prototype.copy.call(src, target, offset);
		}
		module2.exports = /* @__PURE__ */ (function() {
			function BufferList() {
				_classCallCheck(this, BufferList);
				this.head = null;
				this.tail = null;
				this.length = 0;
			}
			_createClass(BufferList, [
				{
					key: "push",
					value: function push(v) {
						var entry = {
							data: v,
							next: null
						};
						if (this.length > 0) this.tail.next = entry;
						else this.head = entry;
						this.tail = entry;
						++this.length;
					}
				},
				{
					key: "unshift",
					value: function unshift(v) {
						var entry = {
							data: v,
							next: this.head
						};
						if (this.length === 0) this.tail = entry;
						this.head = entry;
						++this.length;
					}
				},
				{
					key: "shift",
					value: function shift() {
						if (this.length === 0) return;
						var ret = this.head.data;
						if (this.length === 1) this.head = this.tail = null;
						else this.head = this.head.next;
						--this.length;
						return ret;
					}
				},
				{
					key: "clear",
					value: function clear() {
						this.head = this.tail = null;
						this.length = 0;
					}
				},
				{
					key: "join",
					value: function join(s) {
						if (this.length === 0) return "";
						var p = this.head;
						var ret = "" + p.data;
						while (p = p.next) ret += s + p.data;
						return ret;
					}
				},
				{
					key: "concat",
					value: function concat(n) {
						if (this.length === 0) return Buffer3.alloc(0);
						var ret = Buffer3.allocUnsafe(n >>> 0);
						var p = this.head;
						var i = 0;
						while (p) {
							copyBuffer(p.data, ret, i);
							i += p.data.length;
							p = p.next;
						}
						return ret;
					}
				},
				{
					key: "consume",
					value: function consume(n, hasStrings) {
						var ret;
						if (n < this.head.data.length) {
							ret = this.head.data.slice(0, n);
							this.head.data = this.head.data.slice(n);
						} else if (n === this.head.data.length) ret = this.shift();
						else ret = hasStrings ? this._getString(n) : this._getBuffer(n);
						return ret;
					}
				},
				{
					key: "first",
					value: function first() {
						return this.head.data;
					}
				},
				{
					key: "_getString",
					value: function _getString(n) {
						var p = this.head;
						var c = 1;
						var ret = p.data;
						n -= ret.length;
						while (p = p.next) {
							var str = p.data;
							var nb = n > str.length ? str.length : n;
							if (nb === str.length) ret += str;
							else ret += str.slice(0, n);
							n -= nb;
							if (n === 0) {
								if (nb === str.length) {
									++c;
									if (p.next) this.head = p.next;
									else this.head = this.tail = null;
								} else {
									this.head = p;
									p.data = str.slice(nb);
								}
								break;
							}
							++c;
						}
						this.length -= c;
						return ret;
					}
				},
				{
					key: "_getBuffer",
					value: function _getBuffer(n) {
						var ret = Buffer3.allocUnsafe(n);
						var p = this.head;
						var c = 1;
						p.data.copy(ret);
						n -= p.data.length;
						while (p = p.next) {
							var buf = p.data;
							var nb = n > buf.length ? buf.length : n;
							buf.copy(ret, ret.length - n, 0, nb);
							n -= nb;
							if (n === 0) {
								if (nb === buf.length) {
									++c;
									if (p.next) this.head = p.next;
									else this.head = this.tail = null;
								} else {
									this.head = p;
									p.data = buf.slice(nb);
								}
								break;
							}
							++c;
						}
						this.length -= c;
						return ret;
					}
				},
				{
					key: custom,
					value: function value(_, options) {
						return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
							depth: 0,
							customInspect: false
						}));
					}
				}
			]);
			return BufferList;
		})();
	} });
	var require_destroy = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function destroy(err, cb) {
			var _this = this;
			var readableDestroyed = this._readableState && this._readableState.destroyed;
			var writableDestroyed = this._writableState && this._writableState.destroyed;
			if (readableDestroyed || writableDestroyed) {
				if (cb) cb(err);
				else if (err) {
					if (!this._writableState) import_browser.default.nextTick(emitErrorNT, this, err);
					else if (!this._writableState.errorEmitted) {
						this._writableState.errorEmitted = true;
						import_browser.default.nextTick(emitErrorNT, this, err);
					}
				}
				return this;
			}
			if (this._readableState) this._readableState.destroyed = true;
			if (this._writableState) this._writableState.destroyed = true;
			this._destroy(err || null, function(err2) {
				if (!cb && err2) if (!_this._writableState) import_browser.default.nextTick(emitErrorAndCloseNT, _this, err2);
				else if (!_this._writableState.errorEmitted) {
					_this._writableState.errorEmitted = true;
					import_browser.default.nextTick(emitErrorAndCloseNT, _this, err2);
				} else import_browser.default.nextTick(emitCloseNT, _this);
				else if (cb) {
					import_browser.default.nextTick(emitCloseNT, _this);
					cb(err2);
				} else import_browser.default.nextTick(emitCloseNT, _this);
			});
			return this;
		}
		function emitErrorAndCloseNT(self2, err) {
			emitErrorNT(self2, err);
			emitCloseNT(self2);
		}
		function emitCloseNT(self2) {
			if (self2._writableState && !self2._writableState.emitClose) return;
			if (self2._readableState && !self2._readableState.emitClose) return;
			self2.emit("close");
		}
		function undestroy() {
			if (this._readableState) {
				this._readableState.destroyed = false;
				this._readableState.reading = false;
				this._readableState.ended = false;
				this._readableState.endEmitted = false;
			}
			if (this._writableState) {
				this._writableState.destroyed = false;
				this._writableState.ended = false;
				this._writableState.ending = false;
				this._writableState.finalCalled = false;
				this._writableState.prefinished = false;
				this._writableState.finished = false;
				this._writableState.errorEmitted = false;
			}
		}
		function emitErrorNT(self2, err) {
			self2.emit("error", err);
		}
		function errorOrDestroy(stream2, err) {
			var rState = stream2._readableState;
			var wState = stream2._writableState;
			if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream2.destroy(err);
			else stream2.emit("error", err);
		}
		module2.exports = {
			destroy,
			undestroy,
			errorOrDestroy
		};
	} });
	var require_errors_browser = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/errors-browser.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function _inheritsLoose(subClass, superClass) {
			subClass.prototype = Object.create(superClass.prototype);
			subClass.prototype.constructor = subClass;
			subClass.__proto__ = superClass;
		}
		var codes = {};
		function createErrorType(code, message, Base) {
			if (!Base) Base = Error;
			function getMessage(arg1, arg2, arg3) {
				if (typeof message === "string") return message;
				else return message(arg1, arg2, arg3);
			}
			var NodeError = /* @__PURE__ */ (function(_Base) {
				_inheritsLoose(NodeError2, _Base);
				function NodeError2(arg1, arg2, arg3) {
					return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
				}
				return NodeError2;
			})(Base);
			NodeError.prototype.name = Base.name;
			NodeError.prototype.code = code;
			codes[code] = NodeError;
		}
		function oneOf(expected, thing) {
			if (Array.isArray(expected)) {
				var len = expected.length;
				expected = expected.map(function(i) {
					return String(i);
				});
				if (len > 2) return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(", "), ", or ") + expected[len - 1];
				else if (len === 2) return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
				else return "of ".concat(thing, " ").concat(expected[0]);
			} else return "of ".concat(thing, " ").concat(String(expected));
		}
		function startsWith(str, search, pos) {
			return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
		}
		function endsWith(str, search, this_len) {
			if (this_len === void 0 || this_len > str.length) this_len = str.length;
			return str.substring(this_len - search.length, this_len) === search;
		}
		function includes(str, search, start) {
			if (typeof start !== "number") start = 0;
			if (start + search.length > str.length) return false;
			else return str.indexOf(search, start) !== -1;
		}
		createErrorType("ERR_INVALID_OPT_VALUE", function(name, value) {
			return "The value \"" + value + "\" is invalid for option \"" + name + "\"";
		}, TypeError);
		createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
			var determiner;
			if (typeof expected === "string" && startsWith(expected, "not ")) {
				determiner = "must not be";
				expected = expected.replace(/^not /, "");
			} else determiner = "must be";
			var msg;
			if (endsWith(name, " argument")) msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
			else {
				var type = includes(name, ".") ? "property" : "argument";
				msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
			}
			msg += ". Received type ".concat(typeof actual);
			return msg;
		}, TypeError);
		createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
		createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function(name) {
			return "The " + name + " method is not implemented";
		});
		createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
		createErrorType("ERR_STREAM_DESTROYED", function(name) {
			return "Cannot call " + name + " after a stream was destroyed";
		});
		createErrorType("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
		createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
		createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end");
		createErrorType("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
		createErrorType("ERR_UNKNOWN_ENCODING", function(arg) {
			return "Unknown encoding: " + arg;
		}, TypeError);
		createErrorType("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
		module2.exports.codes = codes;
	} });
	var require_state = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/state.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var ERR_INVALID_OPT_VALUE = require_errors_browser().codes.ERR_INVALID_OPT_VALUE;
		function highWaterMarkFrom(options, isDuplex, duplexKey) {
			return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
		}
		function getHighWaterMark(state, options, duplexKey, isDuplex) {
			var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
			if (hwm != null) {
				if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) throw new ERR_INVALID_OPT_VALUE(isDuplex ? duplexKey : "highWaterMark", hwm);
				return Math.floor(hwm);
			}
			return state.objectMode ? 16 : 16384;
		}
		module2.exports = { getHighWaterMark };
	} });
	var require_browser2 = __commonJS({ "../../../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/browser.js"(exports2, module2) {
		init_browser_globals();
		module2.exports = deprecate;
		function deprecate(fn, msg) {
			if (config("noDeprecation")) return fn;
			var warned = false;
			function deprecated() {
				if (!warned) {
					if (config("throwDeprecation")) throw new Error(msg);
					else if (config("traceDeprecation")) console.trace(msg);
					else console.warn(msg);
					warned = true;
				}
				return fn.apply(this, arguments);
			}
			return deprecated;
		}
		function config(name) {
			try {
				if (!globalThis.localStorage) return false;
			} catch (_) {
				return false;
			}
			var val = globalThis.localStorage[name];
			if (null == val) return false;
			return String(val).toLowerCase() === "true";
		}
	} });
	var require_stream_writable = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Writable;
		function CorkedRequest(state) {
			var _this = this;
			this.next = null;
			this.entry = null;
			this.finish = function() {
				onCorkedFinish(_this, state);
			};
		}
		var Duplex;
		Writable.WritableState = WritableState;
		var internalUtil = { deprecate: require_browser2() };
		var Stream = require_stream_browser();
		var Buffer3 = require_buffer().Buffer;
		var OurUint8Array = (typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {};
		function _uint8ArrayToBuffer(chunk) {
			return Buffer3.from(chunk);
		}
		function _isUint8Array(obj) {
			return Buffer3.isBuffer(obj) || obj instanceof OurUint8Array;
		}
		var destroyImpl = require_destroy();
		var getHighWaterMark = require_state().getHighWaterMark;
		var _require$codes = require_errors_browser().codes;
		var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
		var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
		var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
		var ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE;
		var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
		var ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES;
		var ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END;
		var ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
		var errorOrDestroy = destroyImpl.errorOrDestroy;
		require_inherits_browser()(Writable, Stream);
		function nop() {}
		function WritableState(options, stream2, isDuplex) {
			Duplex = Duplex || require_stream_duplex();
			options = options || {};
			if (typeof isDuplex !== "boolean") isDuplex = stream2 instanceof Duplex;
			this.objectMode = !!options.objectMode;
			if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
			this.highWaterMark = getHighWaterMark(this, options, "writableHighWaterMark", isDuplex);
			this.finalCalled = false;
			this.needDrain = false;
			this.ending = false;
			this.ended = false;
			this.finished = false;
			this.destroyed = false;
			var noDecode = options.decodeStrings === false;
			this.decodeStrings = !noDecode;
			this.defaultEncoding = options.defaultEncoding || "utf8";
			this.length = 0;
			this.writing = false;
			this.corked = 0;
			this.sync = true;
			this.bufferProcessing = false;
			this.onwrite = function(er) {
				onwrite(stream2, er);
			};
			this.writecb = null;
			this.writelen = 0;
			this.bufferedRequest = null;
			this.lastBufferedRequest = null;
			this.pendingcb = 0;
			this.prefinished = false;
			this.errorEmitted = false;
			this.emitClose = options.emitClose !== false;
			this.autoDestroy = !!options.autoDestroy;
			this.bufferedRequestCount = 0;
			this.corkedRequestsFree = new CorkedRequest(this);
		}
		WritableState.prototype.getBuffer = function getBuffer() {
			var current = this.bufferedRequest;
			var out = [];
			while (current) {
				out.push(current);
				current = current.next;
			}
			return out;
		};
		(function() {
			try {
				Object.defineProperty(WritableState.prototype, "buffer", { get: internalUtil.deprecate(function writableStateBufferGetter() {
					return this.getBuffer();
				}, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003") });
			} catch (_) {}
		})();
		var realHasInstance;
		if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
			realHasInstance = Function.prototype[Symbol.hasInstance];
			Object.defineProperty(Writable, Symbol.hasInstance, { value: function value(object) {
				if (realHasInstance.call(this, object)) return true;
				if (this !== Writable) return false;
				return object && object._writableState instanceof WritableState;
			} });
		} else realHasInstance = function realHasInstance2(object) {
			return object instanceof this;
		};
		function Writable(options) {
			Duplex = Duplex || require_stream_duplex();
			var isDuplex = this instanceof Duplex;
			if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
			this._writableState = new WritableState(options, this, isDuplex);
			this.writable = true;
			if (options) {
				if (typeof options.write === "function") this._write = options.write;
				if (typeof options.writev === "function") this._writev = options.writev;
				if (typeof options.destroy === "function") this._destroy = options.destroy;
				if (typeof options.final === "function") this._final = options.final;
			}
			Stream.call(this);
		}
		Writable.prototype.pipe = function() {
			errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
		};
		function writeAfterEnd(stream2, cb) {
			var er = new ERR_STREAM_WRITE_AFTER_END();
			errorOrDestroy(stream2, er);
			import_browser.default.nextTick(cb, er);
		}
		function validChunk(stream2, state, chunk, cb) {
			var er;
			if (chunk === null) er = new ERR_STREAM_NULL_VALUES();
			else if (typeof chunk !== "string" && !state.objectMode) er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer"], chunk);
			if (er) {
				errorOrDestroy(stream2, er);
				import_browser.default.nextTick(cb, er);
				return false;
			}
			return true;
		}
		Writable.prototype.write = function(chunk, encoding, cb) {
			var state = this._writableState;
			var ret = false;
			var isBuf = !state.objectMode && _isUint8Array(chunk);
			if (isBuf && !Buffer3.isBuffer(chunk)) chunk = _uint8ArrayToBuffer(chunk);
			if (typeof encoding === "function") {
				cb = encoding;
				encoding = null;
			}
			if (isBuf) encoding = "buffer";
			else if (!encoding) encoding = state.defaultEncoding;
			if (typeof cb !== "function") cb = nop;
			if (state.ending) writeAfterEnd(this, cb);
			else if (isBuf || validChunk(this, state, chunk, cb)) {
				state.pendingcb++;
				ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
			}
			return ret;
		};
		Writable.prototype.cork = function() {
			this._writableState.corked++;
		};
		Writable.prototype.uncork = function() {
			var state = this._writableState;
			if (state.corked) {
				state.corked--;
				if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
			}
		};
		Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
			if (typeof encoding === "string") encoding = encoding.toLowerCase();
			if (!([
				"hex",
				"utf8",
				"utf-8",
				"ascii",
				"binary",
				"base64",
				"ucs2",
				"ucs-2",
				"utf16le",
				"utf-16le",
				"raw"
			].indexOf((encoding + "").toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
			this._writableState.defaultEncoding = encoding;
			return this;
		};
		Object.defineProperty(Writable.prototype, "writableBuffer", {
			enumerable: false,
			get: function get() {
				return this._writableState && this._writableState.getBuffer();
			}
		});
		function decodeChunk(state, chunk, encoding) {
			if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") chunk = Buffer3.from(chunk, encoding);
			return chunk;
		}
		Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
			enumerable: false,
			get: function get() {
				return this._writableState.highWaterMark;
			}
		});
		function writeOrBuffer(stream2, state, isBuf, chunk, encoding, cb) {
			if (!isBuf) {
				var newChunk = decodeChunk(state, chunk, encoding);
				if (chunk !== newChunk) {
					isBuf = true;
					encoding = "buffer";
					chunk = newChunk;
				}
			}
			var len = state.objectMode ? 1 : chunk.length;
			state.length += len;
			var ret = state.length < state.highWaterMark;
			if (!ret) state.needDrain = true;
			if (state.writing || state.corked) {
				var last = state.lastBufferedRequest;
				state.lastBufferedRequest = {
					chunk,
					encoding,
					isBuf,
					callback: cb,
					next: null
				};
				if (last) last.next = state.lastBufferedRequest;
				else state.bufferedRequest = state.lastBufferedRequest;
				state.bufferedRequestCount += 1;
			} else doWrite(stream2, state, false, len, chunk, encoding, cb);
			return ret;
		}
		function doWrite(stream2, state, writev, len, chunk, encoding, cb) {
			state.writelen = len;
			state.writecb = cb;
			state.writing = true;
			state.sync = true;
			if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED("write"));
			else if (writev) stream2._writev(chunk, state.onwrite);
			else stream2._write(chunk, encoding, state.onwrite);
			state.sync = false;
		}
		function onwriteError(stream2, state, sync, er, cb) {
			--state.pendingcb;
			if (sync) {
				import_browser.default.nextTick(cb, er);
				import_browser.default.nextTick(finishMaybe, stream2, state);
				stream2._writableState.errorEmitted = true;
				errorOrDestroy(stream2, er);
			} else {
				cb(er);
				stream2._writableState.errorEmitted = true;
				errorOrDestroy(stream2, er);
				finishMaybe(stream2, state);
			}
		}
		function onwriteStateUpdate(state) {
			state.writing = false;
			state.writecb = null;
			state.length -= state.writelen;
			state.writelen = 0;
		}
		function onwrite(stream2, er) {
			var state = stream2._writableState;
			var sync = state.sync;
			var cb = state.writecb;
			if (typeof cb !== "function") throw new ERR_MULTIPLE_CALLBACK();
			onwriteStateUpdate(state);
			if (er) onwriteError(stream2, state, sync, er, cb);
			else {
				var finished = needFinish(state) || stream2.destroyed;
				if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(stream2, state);
				if (sync) import_browser.default.nextTick(afterWrite, stream2, state, finished, cb);
				else afterWrite(stream2, state, finished, cb);
			}
		}
		function afterWrite(stream2, state, finished, cb) {
			if (!finished) onwriteDrain(stream2, state);
			state.pendingcb--;
			cb();
			finishMaybe(stream2, state);
		}
		function onwriteDrain(stream2, state) {
			if (state.length === 0 && state.needDrain) {
				state.needDrain = false;
				stream2.emit("drain");
			}
		}
		function clearBuffer(stream2, state) {
			state.bufferProcessing = true;
			var entry = state.bufferedRequest;
			if (stream2._writev && entry && entry.next) {
				var l = state.bufferedRequestCount;
				var buffer = new Array(l);
				var holder = state.corkedRequestsFree;
				holder.entry = entry;
				var count = 0;
				var allBuffers = true;
				while (entry) {
					buffer[count] = entry;
					if (!entry.isBuf) allBuffers = false;
					entry = entry.next;
					count += 1;
				}
				buffer.allBuffers = allBuffers;
				doWrite(stream2, state, true, state.length, buffer, "", holder.finish);
				state.pendingcb++;
				state.lastBufferedRequest = null;
				if (holder.next) {
					state.corkedRequestsFree = holder.next;
					holder.next = null;
				} else state.corkedRequestsFree = new CorkedRequest(state);
				state.bufferedRequestCount = 0;
			} else {
				while (entry) {
					var chunk = entry.chunk;
					var encoding = entry.encoding;
					var cb = entry.callback;
					doWrite(stream2, state, false, state.objectMode ? 1 : chunk.length, chunk, encoding, cb);
					entry = entry.next;
					state.bufferedRequestCount--;
					if (state.writing) break;
				}
				if (entry === null) state.lastBufferedRequest = null;
			}
			state.bufferedRequest = entry;
			state.bufferProcessing = false;
		}
		Writable.prototype._write = function(chunk, encoding, cb) {
			cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
		};
		Writable.prototype._writev = null;
		Writable.prototype.end = function(chunk, encoding, cb) {
			var state = this._writableState;
			if (typeof chunk === "function") {
				cb = chunk;
				chunk = null;
				encoding = null;
			} else if (typeof encoding === "function") {
				cb = encoding;
				encoding = null;
			}
			if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
			if (state.corked) {
				state.corked = 1;
				this.uncork();
			}
			if (!state.ending) endWritable(this, state, cb);
			return this;
		};
		Object.defineProperty(Writable.prototype, "writableLength", {
			enumerable: false,
			get: function get() {
				return this._writableState.length;
			}
		});
		function needFinish(state) {
			return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
		}
		function callFinal(stream2, state) {
			stream2._final(function(err) {
				state.pendingcb--;
				if (err) errorOrDestroy(stream2, err);
				state.prefinished = true;
				stream2.emit("prefinish");
				finishMaybe(stream2, state);
			});
		}
		function prefinish(stream2, state) {
			if (!state.prefinished && !state.finalCalled) if (typeof stream2._final === "function" && !state.destroyed) {
				state.pendingcb++;
				state.finalCalled = true;
				import_browser.default.nextTick(callFinal, stream2, state);
			} else {
				state.prefinished = true;
				stream2.emit("prefinish");
			}
		}
		function finishMaybe(stream2, state) {
			var need = needFinish(state);
			if (need) {
				prefinish(stream2, state);
				if (state.pendingcb === 0) {
					state.finished = true;
					stream2.emit("finish");
					if (state.autoDestroy) {
						var rState = stream2._readableState;
						if (!rState || rState.autoDestroy && rState.endEmitted) stream2.destroy();
					}
				}
			}
			return need;
		}
		function endWritable(stream2, state, cb) {
			state.ending = true;
			finishMaybe(stream2, state);
			if (cb) if (state.finished) import_browser.default.nextTick(cb);
			else stream2.once("finish", cb);
			state.ended = true;
			stream2.writable = false;
		}
		function onCorkedFinish(corkReq, state, err) {
			var entry = corkReq.entry;
			corkReq.entry = null;
			while (entry) {
				var cb = entry.callback;
				state.pendingcb--;
				cb(err);
				entry = entry.next;
			}
			state.corkedRequestsFree.next = corkReq;
		}
		Object.defineProperty(Writable.prototype, "destroyed", {
			enumerable: false,
			get: function get() {
				if (this._writableState === void 0) return false;
				return this._writableState.destroyed;
			},
			set: function set(value) {
				if (!this._writableState) return;
				this._writableState.destroyed = value;
			}
		});
		Writable.prototype.destroy = destroyImpl.destroy;
		Writable.prototype._undestroy = destroyImpl.undestroy;
		Writable.prototype._destroy = function(err, cb) {
			cb(err);
		};
	} });
	var require_stream_duplex = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var objectKeys = Object.keys || function(obj) {
			var keys2 = [];
			for (var key in obj) keys2.push(key);
			return keys2;
		};
		module2.exports = Duplex;
		var Readable = require_stream_readable();
		var Writable = require_stream_writable();
		require_inherits_browser()(Duplex, Readable);
		keys = objectKeys(Writable.prototype);
		for (v = 0; v < keys.length; v++) {
			method = keys[v];
			if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
		}
		var keys;
		var method;
		var v;
		function Duplex(options) {
			if (!(this instanceof Duplex)) return new Duplex(options);
			Readable.call(this, options);
			Writable.call(this, options);
			this.allowHalfOpen = true;
			if (options) {
				if (options.readable === false) this.readable = false;
				if (options.writable === false) this.writable = false;
				if (options.allowHalfOpen === false) {
					this.allowHalfOpen = false;
					this.once("end", onend);
				}
			}
		}
		Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
			enumerable: false,
			get: function get() {
				return this._writableState.highWaterMark;
			}
		});
		Object.defineProperty(Duplex.prototype, "writableBuffer", {
			enumerable: false,
			get: function get() {
				return this._writableState && this._writableState.getBuffer();
			}
		});
		Object.defineProperty(Duplex.prototype, "writableLength", {
			enumerable: false,
			get: function get() {
				return this._writableState.length;
			}
		});
		function onend() {
			if (this._writableState.ended) return;
			import_browser.default.nextTick(onEndNT, this);
		}
		function onEndNT(self2) {
			self2.end();
		}
		Object.defineProperty(Duplex.prototype, "destroyed", {
			enumerable: false,
			get: function get() {
				if (this._readableState === void 0 || this._writableState === void 0) return false;
				return this._readableState.destroyed && this._writableState.destroyed;
			},
			set: function set(value) {
				if (this._readableState === void 0 || this._writableState === void 0) return;
				this._readableState.destroyed = value;
				this._writableState.destroyed = value;
			}
		});
	} });
	var require_safe_buffer = __commonJS({ "../../../node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js"(exports2, module2) {
		init_browser_globals();
		var buffer = require_buffer();
		var Buffer3 = buffer.Buffer;
		function copyProps(src, dst) {
			for (var key in src) dst[key] = src[key];
		}
		if (Buffer3.from && Buffer3.alloc && Buffer3.allocUnsafe && Buffer3.allocUnsafeSlow) module2.exports = buffer;
		else {
			copyProps(buffer, exports2);
			exports2.Buffer = SafeBuffer;
		}
		function SafeBuffer(arg, encodingOrOffset, length) {
			return Buffer3(arg, encodingOrOffset, length);
		}
		SafeBuffer.prototype = Object.create(Buffer3.prototype);
		copyProps(Buffer3, SafeBuffer);
		SafeBuffer.from = function(arg, encodingOrOffset, length) {
			if (typeof arg === "number") throw new TypeError("Argument must not be a number");
			return Buffer3(arg, encodingOrOffset, length);
		};
		SafeBuffer.alloc = function(size, fill, encoding) {
			if (typeof size !== "number") throw new TypeError("Argument must be a number");
			var buf = Buffer3(size);
			if (fill !== void 0) if (typeof encoding === "string") buf.fill(fill, encoding);
			else buf.fill(fill);
			else buf.fill(0);
			return buf;
		};
		SafeBuffer.allocUnsafe = function(size) {
			if (typeof size !== "number") throw new TypeError("Argument must be a number");
			return Buffer3(size);
		};
		SafeBuffer.allocUnsafeSlow = function(size) {
			if (typeof size !== "number") throw new TypeError("Argument must be a number");
			return buffer.SlowBuffer(size);
		};
	} });
	var require_string_decoder = __commonJS({ "../../../node_modules/.pnpm/string_decoder@1.3.0/node_modules/string_decoder/lib/string_decoder.js"(exports2) {
		"use strict";
		init_browser_globals();
		var Buffer3 = require_safe_buffer().Buffer;
		var isEncoding = Buffer3.isEncoding || function(encoding) {
			encoding = "" + encoding;
			switch (encoding && encoding.toLowerCase()) {
				case "hex":
				case "utf8":
				case "utf-8":
				case "ascii":
				case "binary":
				case "base64":
				case "ucs2":
				case "ucs-2":
				case "utf16le":
				case "utf-16le":
				case "raw": return true;
				default: return false;
			}
		};
		function _normalizeEncoding(enc) {
			if (!enc) return "utf8";
			var retried;
			while (true) switch (enc) {
				case "utf8":
				case "utf-8": return "utf8";
				case "ucs2":
				case "ucs-2":
				case "utf16le":
				case "utf-16le": return "utf16le";
				case "latin1":
				case "binary": return "latin1";
				case "base64":
				case "ascii":
				case "hex": return enc;
				default:
					if (retried) return;
					enc = ("" + enc).toLowerCase();
					retried = true;
			}
		}
		function normalizeEncoding(enc) {
			var nenc = _normalizeEncoding(enc);
			if (typeof nenc !== "string" && (Buffer3.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
			return nenc || enc;
		}
		exports2.StringDecoder = StringDecoder;
		function StringDecoder(encoding) {
			this.encoding = normalizeEncoding(encoding);
			var nb;
			switch (this.encoding) {
				case "utf16le":
					this.text = utf16Text;
					this.end = utf16End;
					nb = 4;
					break;
				case "utf8":
					this.fillLast = utf8FillLast;
					nb = 4;
					break;
				case "base64":
					this.text = base64Text;
					this.end = base64End;
					nb = 3;
					break;
				default:
					this.write = simpleWrite;
					this.end = simpleEnd;
					return;
			}
			this.lastNeed = 0;
			this.lastTotal = 0;
			this.lastChar = Buffer3.allocUnsafe(nb);
		}
		StringDecoder.prototype.write = function(buf) {
			if (buf.length === 0) return "";
			var r;
			var i;
			if (this.lastNeed) {
				r = this.fillLast(buf);
				if (r === void 0) return "";
				i = this.lastNeed;
				this.lastNeed = 0;
			} else i = 0;
			if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
			return r || "";
		};
		StringDecoder.prototype.end = utf8End;
		StringDecoder.prototype.text = utf8Text;
		StringDecoder.prototype.fillLast = function(buf) {
			if (this.lastNeed <= buf.length) {
				buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
				return this.lastChar.toString(this.encoding, 0, this.lastTotal);
			}
			buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
			this.lastNeed -= buf.length;
		};
		function utf8CheckByte(byte) {
			if (byte <= 127) return 0;
			else if (byte >> 5 === 6) return 2;
			else if (byte >> 4 === 14) return 3;
			else if (byte >> 3 === 30) return 4;
			return byte >> 6 === 2 ? -1 : -2;
		}
		function utf8CheckIncomplete(self2, buf, i) {
			var j = buf.length - 1;
			if (j < i) return 0;
			var nb = utf8CheckByte(buf[j]);
			if (nb >= 0) {
				if (nb > 0) self2.lastNeed = nb - 1;
				return nb;
			}
			if (--j < i || nb === -2) return 0;
			nb = utf8CheckByte(buf[j]);
			if (nb >= 0) {
				if (nb > 0) self2.lastNeed = nb - 2;
				return nb;
			}
			if (--j < i || nb === -2) return 0;
			nb = utf8CheckByte(buf[j]);
			if (nb >= 0) {
				if (nb > 0) if (nb === 2) nb = 0;
				else self2.lastNeed = nb - 3;
				return nb;
			}
			return 0;
		}
		function utf8CheckExtraBytes(self2, buf, p) {
			if ((buf[0] & 192) !== 128) {
				self2.lastNeed = 0;
				return "�";
			}
			if (self2.lastNeed > 1 && buf.length > 1) {
				if ((buf[1] & 192) !== 128) {
					self2.lastNeed = 1;
					return "�";
				}
				if (self2.lastNeed > 2 && buf.length > 2) {
					if ((buf[2] & 192) !== 128) {
						self2.lastNeed = 2;
						return "�";
					}
				}
			}
		}
		function utf8FillLast(buf) {
			var p = this.lastTotal - this.lastNeed;
			var r = utf8CheckExtraBytes(this, buf, p);
			if (r !== void 0) return r;
			if (this.lastNeed <= buf.length) {
				buf.copy(this.lastChar, p, 0, this.lastNeed);
				return this.lastChar.toString(this.encoding, 0, this.lastTotal);
			}
			buf.copy(this.lastChar, p, 0, buf.length);
			this.lastNeed -= buf.length;
		}
		function utf8Text(buf, i) {
			var total = utf8CheckIncomplete(this, buf, i);
			if (!this.lastNeed) return buf.toString("utf8", i);
			this.lastTotal = total;
			var end = buf.length - (total - this.lastNeed);
			buf.copy(this.lastChar, 0, end);
			return buf.toString("utf8", i, end);
		}
		function utf8End(buf) {
			var r = buf && buf.length ? this.write(buf) : "";
			if (this.lastNeed) return r + "�";
			return r;
		}
		function utf16Text(buf, i) {
			if ((buf.length - i) % 2 === 0) {
				var r = buf.toString("utf16le", i);
				if (r) {
					var c = r.charCodeAt(r.length - 1);
					if (c >= 55296 && c <= 56319) {
						this.lastNeed = 2;
						this.lastTotal = 4;
						this.lastChar[0] = buf[buf.length - 2];
						this.lastChar[1] = buf[buf.length - 1];
						return r.slice(0, -1);
					}
				}
				return r;
			}
			this.lastNeed = 1;
			this.lastTotal = 2;
			this.lastChar[0] = buf[buf.length - 1];
			return buf.toString("utf16le", i, buf.length - 1);
		}
		function utf16End(buf) {
			var r = buf && buf.length ? this.write(buf) : "";
			if (this.lastNeed) {
				var end = this.lastTotal - this.lastNeed;
				return r + this.lastChar.toString("utf16le", 0, end);
			}
			return r;
		}
		function base64Text(buf, i) {
			var n = (buf.length - i) % 3;
			if (n === 0) return buf.toString("base64", i);
			this.lastNeed = 3 - n;
			this.lastTotal = 3;
			if (n === 1) this.lastChar[0] = buf[buf.length - 1];
			else {
				this.lastChar[0] = buf[buf.length - 2];
				this.lastChar[1] = buf[buf.length - 1];
			}
			return buf.toString("base64", i, buf.length - n);
		}
		function base64End(buf) {
			var r = buf && buf.length ? this.write(buf) : "";
			if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
			return r;
		}
		function simpleWrite(buf) {
			return buf.toString(this.encoding);
		}
		function simpleEnd(buf) {
			return buf && buf.length ? this.write(buf) : "";
		}
	} });
	var require_end_of_stream = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/end-of-stream.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var ERR_STREAM_PREMATURE_CLOSE = require_errors_browser().codes.ERR_STREAM_PREMATURE_CLOSE;
		function once(callback) {
			var called = false;
			return function() {
				if (called) return;
				called = true;
				for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
				callback.apply(this, args);
			};
		}
		function noop() {}
		function isRequest(stream2) {
			return stream2.setHeader && typeof stream2.abort === "function";
		}
		function eos(stream2, opts, callback) {
			if (typeof opts === "function") return eos(stream2, null, opts);
			if (!opts) opts = {};
			callback = once(callback || noop);
			var readable = opts.readable || opts.readable !== false && stream2.readable;
			var writable = opts.writable || opts.writable !== false && stream2.writable;
			var onlegacyfinish = function onlegacyfinish2() {
				if (!stream2.writable) onfinish();
			};
			var writableEnded = stream2._writableState && stream2._writableState.finished;
			var onfinish = function onfinish2() {
				writable = false;
				writableEnded = true;
				if (!readable) callback.call(stream2);
			};
			var readableEnded = stream2._readableState && stream2._readableState.endEmitted;
			var onend = function onend2() {
				readable = false;
				readableEnded = true;
				if (!writable) callback.call(stream2);
			};
			var onerror = function onerror2(err) {
				callback.call(stream2, err);
			};
			var onclose = function onclose2() {
				var err;
				if (readable && !readableEnded) {
					if (!stream2._readableState || !stream2._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
					return callback.call(stream2, err);
				}
				if (writable && !writableEnded) {
					if (!stream2._writableState || !stream2._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
					return callback.call(stream2, err);
				}
			};
			var onrequest = function onrequest2() {
				stream2.req.on("finish", onfinish);
			};
			if (isRequest(stream2)) {
				stream2.on("complete", onfinish);
				stream2.on("abort", onclose);
				if (stream2.req) onrequest();
				else stream2.on("request", onrequest);
			} else if (writable && !stream2._writableState) {
				stream2.on("end", onlegacyfinish);
				stream2.on("close", onlegacyfinish);
			}
			stream2.on("end", onend);
			stream2.on("finish", onfinish);
			if (opts.error !== false) stream2.on("error", onerror);
			stream2.on("close", onclose);
			return function() {
				stream2.removeListener("complete", onfinish);
				stream2.removeListener("abort", onclose);
				stream2.removeListener("request", onrequest);
				if (stream2.req) stream2.req.removeListener("finish", onfinish);
				stream2.removeListener("end", onlegacyfinish);
				stream2.removeListener("close", onlegacyfinish);
				stream2.removeListener("finish", onfinish);
				stream2.removeListener("end", onend);
				stream2.removeListener("error", onerror);
				stream2.removeListener("close", onclose);
			};
		}
		module2.exports = eos;
	} });
	var require_async_iterator = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/async_iterator.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var _Object$setPrototypeO;
		function _defineProperty(obj, key, value) {
			key = _toPropertyKey(key);
			if (key in obj) Object.defineProperty(obj, key, {
				value,
				enumerable: true,
				configurable: true,
				writable: true
			});
			else obj[key] = value;
			return obj;
		}
		function _toPropertyKey(arg) {
			var key = _toPrimitive(arg, "string");
			return typeof key === "symbol" ? key : String(key);
		}
		function _toPrimitive(input, hint) {
			if (typeof input !== "object" || input === null) return input;
			var prim = input[Symbol.toPrimitive];
			if (prim !== void 0) {
				var res = prim.call(input, hint || "default");
				if (typeof res !== "object") return res;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return (hint === "string" ? String : Number)(input);
		}
		var finished = require_end_of_stream();
		var kLastResolve = /* @__PURE__ */ Symbol("lastResolve");
		var kLastReject = /* @__PURE__ */ Symbol("lastReject");
		var kError = /* @__PURE__ */ Symbol("error");
		var kEnded = /* @__PURE__ */ Symbol("ended");
		var kLastPromise = /* @__PURE__ */ Symbol("lastPromise");
		var kHandlePromise = /* @__PURE__ */ Symbol("handlePromise");
		var kStream = /* @__PURE__ */ Symbol("stream");
		function createIterResult(value, done) {
			return {
				value,
				done
			};
		}
		function readAndResolve(iter) {
			var resolve = iter[kLastResolve];
			if (resolve !== null) {
				var data = iter[kStream].read();
				if (data !== null) {
					iter[kLastPromise] = null;
					iter[kLastResolve] = null;
					iter[kLastReject] = null;
					resolve(createIterResult(data, false));
				}
			}
		}
		function onReadable(iter) {
			import_browser.default.nextTick(readAndResolve, iter);
		}
		function wrapForNext(lastPromise, iter) {
			return function(resolve, reject) {
				lastPromise.then(function() {
					if (iter[kEnded]) {
						resolve(createIterResult(void 0, true));
						return;
					}
					iter[kHandlePromise](resolve, reject);
				}, reject);
			};
		}
		var AsyncIteratorPrototype = Object.getPrototypeOf(function() {});
		var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
			get stream() {
				return this[kStream];
			},
			next: function next() {
				var _this = this;
				var error = this[kError];
				if (error !== null) return Promise.reject(error);
				if (this[kEnded]) return Promise.resolve(createIterResult(void 0, true));
				if (this[kStream].destroyed) return new Promise(function(resolve, reject) {
					import_browser.default.nextTick(function() {
						if (_this[kError]) reject(_this[kError]);
						else resolve(createIterResult(void 0, true));
					});
				});
				var lastPromise = this[kLastPromise];
				var promise;
				if (lastPromise) promise = new Promise(wrapForNext(lastPromise, this));
				else {
					var data = this[kStream].read();
					if (data !== null) return Promise.resolve(createIterResult(data, false));
					promise = new Promise(this[kHandlePromise]);
				}
				this[kLastPromise] = promise;
				return promise;
			}
		}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function() {
			return this;
		}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
			var _this2 = this;
			return new Promise(function(resolve, reject) {
				_this2[kStream].destroy(null, function(err) {
					if (err) {
						reject(err);
						return;
					}
					resolve(createIterResult(void 0, true));
				});
			});
		}), _Object$setPrototypeO), AsyncIteratorPrototype);
		module2.exports = function createReadableStreamAsyncIterator2(stream2) {
			var _Object$create;
			var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
				value: stream2,
				writable: true
			}), _defineProperty(_Object$create, kLastResolve, {
				value: null,
				writable: true
			}), _defineProperty(_Object$create, kLastReject, {
				value: null,
				writable: true
			}), _defineProperty(_Object$create, kError, {
				value: null,
				writable: true
			}), _defineProperty(_Object$create, kEnded, {
				value: stream2._readableState.endEmitted,
				writable: true
			}), _defineProperty(_Object$create, kHandlePromise, {
				value: function value(resolve, reject) {
					var data = iterator[kStream].read();
					if (data) {
						iterator[kLastPromise] = null;
						iterator[kLastResolve] = null;
						iterator[kLastReject] = null;
						resolve(createIterResult(data, false));
					} else {
						iterator[kLastResolve] = resolve;
						iterator[kLastReject] = reject;
					}
				},
				writable: true
			}), _Object$create));
			iterator[kLastPromise] = null;
			finished(stream2, function(err) {
				if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
					var reject = iterator[kLastReject];
					if (reject !== null) {
						iterator[kLastPromise] = null;
						iterator[kLastResolve] = null;
						iterator[kLastReject] = null;
						reject(err);
					}
					iterator[kError] = err;
					return;
				}
				var resolve = iterator[kLastResolve];
				if (resolve !== null) {
					iterator[kLastPromise] = null;
					iterator[kLastResolve] = null;
					iterator[kLastReject] = null;
					resolve(createIterResult(void 0, true));
				}
				iterator[kEnded] = true;
			});
			stream2.on("readable", onReadable.bind(null, iterator));
			return iterator;
		};
	} });
	var require_from_browser = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/from-browser.js"(exports2, module2) {
		init_browser_globals();
		module2.exports = function() {
			throw new Error("Readable.from is not available in the browser");
		};
	} });
	var require_stream_readable = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Readable;
		var Duplex;
		Readable.ReadableState = ReadableState;
		require_events().EventEmitter;
		var EElistenerCount = function EElistenerCount2(emitter, type) {
			return emitter.listeners(type).length;
		};
		var Stream = require_stream_browser();
		var Buffer3 = require_buffer().Buffer;
		var OurUint8Array = (typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {};
		function _uint8ArrayToBuffer(chunk) {
			return Buffer3.from(chunk);
		}
		function _isUint8Array(obj) {
			return Buffer3.isBuffer(obj) || obj instanceof OurUint8Array;
		}
		var debugUtil = require_util();
		var debug;
		if (debugUtil && debugUtil.debuglog) debug = debugUtil.debuglog("stream");
		else debug = function debug2() {};
		var BufferList = require_buffer_list();
		var destroyImpl = require_destroy();
		var getHighWaterMark = require_state().getHighWaterMark;
		var _require$codes = require_errors_browser().codes;
		var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
		var ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF;
		var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
		var ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
		var StringDecoder;
		var createReadableStreamAsyncIterator;
		var from;
		require_inherits_browser()(Readable, Stream);
		var errorOrDestroy = destroyImpl.errorOrDestroy;
		var kProxyEvents = [
			"error",
			"close",
			"destroy",
			"pause",
			"resume"
		];
		function prependListener(emitter, event, fn) {
			if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
			if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
			else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
			else emitter._events[event] = [fn, emitter._events[event]];
		}
		function ReadableState(options, stream2, isDuplex) {
			Duplex = Duplex || require_stream_duplex();
			options = options || {};
			if (typeof isDuplex !== "boolean") isDuplex = stream2 instanceof Duplex;
			this.objectMode = !!options.objectMode;
			if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
			this.highWaterMark = getHighWaterMark(this, options, "readableHighWaterMark", isDuplex);
			this.buffer = new BufferList();
			this.length = 0;
			this.pipes = null;
			this.pipesCount = 0;
			this.flowing = null;
			this.ended = false;
			this.endEmitted = false;
			this.reading = false;
			this.sync = true;
			this.needReadable = false;
			this.emittedReadable = false;
			this.readableListening = false;
			this.resumeScheduled = false;
			this.paused = true;
			this.emitClose = options.emitClose !== false;
			this.autoDestroy = !!options.autoDestroy;
			this.destroyed = false;
			this.defaultEncoding = options.defaultEncoding || "utf8";
			this.awaitDrain = 0;
			this.readingMore = false;
			this.decoder = null;
			this.encoding = null;
			if (options.encoding) {
				if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
				this.decoder = new StringDecoder(options.encoding);
				this.encoding = options.encoding;
			}
		}
		function Readable(options) {
			Duplex = Duplex || require_stream_duplex();
			if (!(this instanceof Readable)) return new Readable(options);
			var isDuplex = this instanceof Duplex;
			this._readableState = new ReadableState(options, this, isDuplex);
			this.readable = true;
			if (options) {
				if (typeof options.read === "function") this._read = options.read;
				if (typeof options.destroy === "function") this._destroy = options.destroy;
			}
			Stream.call(this);
		}
		Object.defineProperty(Readable.prototype, "destroyed", {
			enumerable: false,
			get: function get() {
				if (this._readableState === void 0) return false;
				return this._readableState.destroyed;
			},
			set: function set(value) {
				if (!this._readableState) return;
				this._readableState.destroyed = value;
			}
		});
		Readable.prototype.destroy = destroyImpl.destroy;
		Readable.prototype._undestroy = destroyImpl.undestroy;
		Readable.prototype._destroy = function(err, cb) {
			cb(err);
		};
		Readable.prototype.push = function(chunk, encoding) {
			var state = this._readableState;
			var skipChunkCheck;
			if (!state.objectMode) {
				if (typeof chunk === "string") {
					encoding = encoding || state.defaultEncoding;
					if (encoding !== state.encoding) {
						chunk = Buffer3.from(chunk, encoding);
						encoding = "";
					}
					skipChunkCheck = true;
				}
			} else skipChunkCheck = true;
			return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
		};
		Readable.prototype.unshift = function(chunk) {
			return readableAddChunk(this, chunk, null, true, false);
		};
		function readableAddChunk(stream2, chunk, encoding, addToFront, skipChunkCheck) {
			debug("readableAddChunk", chunk);
			var state = stream2._readableState;
			if (chunk === null) {
				state.reading = false;
				onEofChunk(stream2, state);
			} else {
				var er;
				if (!skipChunkCheck) er = chunkInvalid(state, chunk);
				if (er) errorOrDestroy(stream2, er);
				else if (state.objectMode || chunk && chunk.length > 0) {
					if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer3.prototype) chunk = _uint8ArrayToBuffer(chunk);
					if (addToFront) if (state.endEmitted) errorOrDestroy(stream2, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
					else addChunk(stream2, state, chunk, true);
					else if (state.ended) errorOrDestroy(stream2, new ERR_STREAM_PUSH_AFTER_EOF());
					else if (state.destroyed) return false;
					else {
						state.reading = false;
						if (state.decoder && !encoding) {
							chunk = state.decoder.write(chunk);
							if (state.objectMode || chunk.length !== 0) addChunk(stream2, state, chunk, false);
							else maybeReadMore(stream2, state);
						} else addChunk(stream2, state, chunk, false);
					}
				} else if (!addToFront) {
					state.reading = false;
					maybeReadMore(stream2, state);
				}
			}
			return !state.ended && (state.length < state.highWaterMark || state.length === 0);
		}
		function addChunk(stream2, state, chunk, addToFront) {
			if (state.flowing && state.length === 0 && !state.sync) {
				state.awaitDrain = 0;
				stream2.emit("data", chunk);
			} else {
				state.length += state.objectMode ? 1 : chunk.length;
				if (addToFront) state.buffer.unshift(chunk);
				else state.buffer.push(chunk);
				if (state.needReadable) emitReadable(stream2);
			}
			maybeReadMore(stream2, state);
		}
		function chunkInvalid(state, chunk) {
			var er;
			if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) er = new ERR_INVALID_ARG_TYPE("chunk", [
				"string",
				"Buffer",
				"Uint8Array"
			], chunk);
			return er;
		}
		Readable.prototype.isPaused = function() {
			return this._readableState.flowing === false;
		};
		Readable.prototype.setEncoding = function(enc) {
			if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
			var decoder = new StringDecoder(enc);
			this._readableState.decoder = decoder;
			this._readableState.encoding = this._readableState.decoder.encoding;
			var p = this._readableState.buffer.head;
			var content = "";
			while (p !== null) {
				content += decoder.write(p.data);
				p = p.next;
			}
			this._readableState.buffer.clear();
			if (content !== "") this._readableState.buffer.push(content);
			this._readableState.length = content.length;
			return this;
		};
		var MAX_HWM = 1073741824;
		function computeNewHighWaterMark(n) {
			if (n >= MAX_HWM) n = MAX_HWM;
			else {
				n--;
				n |= n >>> 1;
				n |= n >>> 2;
				n |= n >>> 4;
				n |= n >>> 8;
				n |= n >>> 16;
				n++;
			}
			return n;
		}
		function howMuchToRead(n, state) {
			if (n <= 0 || state.length === 0 && state.ended) return 0;
			if (state.objectMode) return 1;
			if (n !== n) if (state.flowing && state.length) return state.buffer.head.data.length;
			else return state.length;
			if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
			if (n <= state.length) return n;
			if (!state.ended) {
				state.needReadable = true;
				return 0;
			}
			return state.length;
		}
		Readable.prototype.read = function(n) {
			debug("read", n);
			n = parseInt(n, 10);
			var state = this._readableState;
			var nOrig = n;
			if (n !== 0) state.emittedReadable = false;
			if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
				debug("read: emitReadable", state.length, state.ended);
				if (state.length === 0 && state.ended) endReadable(this);
				else emitReadable(this);
				return null;
			}
			n = howMuchToRead(n, state);
			if (n === 0 && state.ended) {
				if (state.length === 0) endReadable(this);
				return null;
			}
			var doRead = state.needReadable;
			debug("need readable", doRead);
			if (state.length === 0 || state.length - n < state.highWaterMark) {
				doRead = true;
				debug("length less than watermark", doRead);
			}
			if (state.ended || state.reading) {
				doRead = false;
				debug("reading or ended", doRead);
			} else if (doRead) {
				debug("do read");
				state.reading = true;
				state.sync = true;
				if (state.length === 0) state.needReadable = true;
				this._read(state.highWaterMark);
				state.sync = false;
				if (!state.reading) n = howMuchToRead(nOrig, state);
			}
			var ret;
			if (n > 0) ret = fromList(n, state);
			else ret = null;
			if (ret === null) {
				state.needReadable = state.length <= state.highWaterMark;
				n = 0;
			} else {
				state.length -= n;
				state.awaitDrain = 0;
			}
			if (state.length === 0) {
				if (!state.ended) state.needReadable = true;
				if (nOrig !== n && state.ended) endReadable(this);
			}
			if (ret !== null) this.emit("data", ret);
			return ret;
		};
		function onEofChunk(stream2, state) {
			debug("onEofChunk");
			if (state.ended) return;
			if (state.decoder) {
				var chunk = state.decoder.end();
				if (chunk && chunk.length) {
					state.buffer.push(chunk);
					state.length += state.objectMode ? 1 : chunk.length;
				}
			}
			state.ended = true;
			if (state.sync) emitReadable(stream2);
			else {
				state.needReadable = false;
				if (!state.emittedReadable) {
					state.emittedReadable = true;
					emitReadable_(stream2);
				}
			}
		}
		function emitReadable(stream2) {
			var state = stream2._readableState;
			debug("emitReadable", state.needReadable, state.emittedReadable);
			state.needReadable = false;
			if (!state.emittedReadable) {
				debug("emitReadable", state.flowing);
				state.emittedReadable = true;
				import_browser.default.nextTick(emitReadable_, stream2);
			}
		}
		function emitReadable_(stream2) {
			var state = stream2._readableState;
			debug("emitReadable_", state.destroyed, state.length, state.ended);
			if (!state.destroyed && (state.length || state.ended)) {
				stream2.emit("readable");
				state.emittedReadable = false;
			}
			state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
			flow(stream2);
		}
		function maybeReadMore(stream2, state) {
			if (!state.readingMore) {
				state.readingMore = true;
				import_browser.default.nextTick(maybeReadMore_, stream2, state);
			}
		}
		function maybeReadMore_(stream2, state) {
			while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
				var len = state.length;
				debug("maybeReadMore read 0");
				stream2.read(0);
				if (len === state.length) break;
			}
			state.readingMore = false;
		}
		Readable.prototype._read = function(n) {
			errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
		};
		Readable.prototype.pipe = function(dest, pipeOpts) {
			var src = this;
			var state = this._readableState;
			switch (state.pipesCount) {
				case 0:
					state.pipes = dest;
					break;
				case 1:
					state.pipes = [state.pipes, dest];
					break;
				default: state.pipes.push(dest);
			}
			state.pipesCount += 1;
			debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
			var endFn = (!pipeOpts || pipeOpts.end !== false) && dest !== import_browser.default.stdout && dest !== import_browser.default.stderr ? onend : unpipe;
			if (state.endEmitted) import_browser.default.nextTick(endFn);
			else src.once("end", endFn);
			dest.on("unpipe", onunpipe);
			function onunpipe(readable, unpipeInfo) {
				debug("onunpipe");
				if (readable === src) {
					if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
						unpipeInfo.hasUnpiped = true;
						cleanup();
					}
				}
			}
			function onend() {
				debug("onend");
				dest.end();
			}
			var ondrain = pipeOnDrain(src);
			dest.on("drain", ondrain);
			var cleanedUp = false;
			function cleanup() {
				debug("cleanup");
				dest.removeListener("close", onclose);
				dest.removeListener("finish", onfinish);
				dest.removeListener("drain", ondrain);
				dest.removeListener("error", onerror);
				dest.removeListener("unpipe", onunpipe);
				src.removeListener("end", onend);
				src.removeListener("end", unpipe);
				src.removeListener("data", ondata);
				cleanedUp = true;
				if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
			}
			src.on("data", ondata);
			function ondata(chunk) {
				debug("ondata");
				var ret = dest.write(chunk);
				debug("dest.write", ret);
				if (ret === false) {
					if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
						debug("false write response, pause", state.awaitDrain);
						state.awaitDrain++;
					}
					src.pause();
				}
			}
			function onerror(er) {
				debug("onerror", er);
				unpipe();
				dest.removeListener("error", onerror);
				if (EElistenerCount(dest, "error") === 0) errorOrDestroy(dest, er);
			}
			prependListener(dest, "error", onerror);
			function onclose() {
				dest.removeListener("finish", onfinish);
				unpipe();
			}
			dest.once("close", onclose);
			function onfinish() {
				debug("onfinish");
				dest.removeListener("close", onclose);
				unpipe();
			}
			dest.once("finish", onfinish);
			function unpipe() {
				debug("unpipe");
				src.unpipe(dest);
			}
			dest.emit("pipe", src);
			if (!state.flowing) {
				debug("pipe resume");
				src.resume();
			}
			return dest;
		};
		function pipeOnDrain(src) {
			return function pipeOnDrainFunctionResult() {
				var state = src._readableState;
				debug("pipeOnDrain", state.awaitDrain);
				if (state.awaitDrain) state.awaitDrain--;
				if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
					state.flowing = true;
					flow(src);
				}
			};
		}
		Readable.prototype.unpipe = function(dest) {
			var state = this._readableState;
			var unpipeInfo = { hasUnpiped: false };
			if (state.pipesCount === 0) return this;
			if (state.pipesCount === 1) {
				if (dest && dest !== state.pipes) return this;
				if (!dest) dest = state.pipes;
				state.pipes = null;
				state.pipesCount = 0;
				state.flowing = false;
				if (dest) dest.emit("unpipe", this, unpipeInfo);
				return this;
			}
			if (!dest) {
				var dests = state.pipes;
				var len = state.pipesCount;
				state.pipes = null;
				state.pipesCount = 0;
				state.flowing = false;
				for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, { hasUnpiped: false });
				return this;
			}
			var index = indexOf(state.pipes, dest);
			if (index === -1) return this;
			state.pipes.splice(index, 1);
			state.pipesCount -= 1;
			if (state.pipesCount === 1) state.pipes = state.pipes[0];
			dest.emit("unpipe", this, unpipeInfo);
			return this;
		};
		Readable.prototype.on = function(ev, fn) {
			var res = Stream.prototype.on.call(this, ev, fn);
			var state = this._readableState;
			if (ev === "data") {
				state.readableListening = this.listenerCount("readable") > 0;
				if (state.flowing !== false) this.resume();
			} else if (ev === "readable") {
				if (!state.endEmitted && !state.readableListening) {
					state.readableListening = state.needReadable = true;
					state.flowing = false;
					state.emittedReadable = false;
					debug("on readable", state.length, state.reading);
					if (state.length) emitReadable(this);
					else if (!state.reading) import_browser.default.nextTick(nReadingNextTick, this);
				}
			}
			return res;
		};
		Readable.prototype.addListener = Readable.prototype.on;
		Readable.prototype.removeListener = function(ev, fn) {
			var res = Stream.prototype.removeListener.call(this, ev, fn);
			if (ev === "readable") import_browser.default.nextTick(updateReadableListening, this);
			return res;
		};
		Readable.prototype.removeAllListeners = function(ev) {
			var res = Stream.prototype.removeAllListeners.apply(this, arguments);
			if (ev === "readable" || ev === void 0) import_browser.default.nextTick(updateReadableListening, this);
			return res;
		};
		function updateReadableListening(self2) {
			var state = self2._readableState;
			state.readableListening = self2.listenerCount("readable") > 0;
			if (state.resumeScheduled && !state.paused) state.flowing = true;
			else if (self2.listenerCount("data") > 0) self2.resume();
		}
		function nReadingNextTick(self2) {
			debug("readable nexttick read 0");
			self2.read(0);
		}
		Readable.prototype.resume = function() {
			var state = this._readableState;
			if (!state.flowing) {
				debug("resume");
				state.flowing = !state.readableListening;
				resume(this, state);
			}
			state.paused = false;
			return this;
		};
		function resume(stream2, state) {
			if (!state.resumeScheduled) {
				state.resumeScheduled = true;
				import_browser.default.nextTick(resume_, stream2, state);
			}
		}
		function resume_(stream2, state) {
			debug("resume", state.reading);
			if (!state.reading) stream2.read(0);
			state.resumeScheduled = false;
			stream2.emit("resume");
			flow(stream2);
			if (state.flowing && !state.reading) stream2.read(0);
		}
		Readable.prototype.pause = function() {
			debug("call pause flowing=%j", this._readableState.flowing);
			if (this._readableState.flowing !== false) {
				debug("pause");
				this._readableState.flowing = false;
				this.emit("pause");
			}
			this._readableState.paused = true;
			return this;
		};
		function flow(stream2) {
			var state = stream2._readableState;
			debug("flow", state.flowing);
			while (state.flowing && stream2.read() !== null);
		}
		Readable.prototype.wrap = function(stream2) {
			var _this = this;
			var state = this._readableState;
			var paused = false;
			stream2.on("end", function() {
				debug("wrapped end");
				if (state.decoder && !state.ended) {
					var chunk = state.decoder.end();
					if (chunk && chunk.length) _this.push(chunk);
				}
				_this.push(null);
			});
			stream2.on("data", function(chunk) {
				debug("wrapped data");
				if (state.decoder) chunk = state.decoder.write(chunk);
				if (state.objectMode && (chunk === null || chunk === void 0)) return;
				else if (!state.objectMode && (!chunk || !chunk.length)) return;
				if (!_this.push(chunk)) {
					paused = true;
					stream2.pause();
				}
			});
			for (var i in stream2) if (this[i] === void 0 && typeof stream2[i] === "function") this[i] = /* @__PURE__ */ (function methodWrap(method) {
				return function methodWrapReturnFunction() {
					return stream2[method].apply(stream2, arguments);
				};
			})(i);
			for (var n = 0; n < kProxyEvents.length; n++) stream2.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
			this._read = function(n2) {
				debug("wrapped _read", n2);
				if (paused) {
					paused = false;
					stream2.resume();
				}
			};
			return this;
		};
		if (typeof Symbol === "function") Readable.prototype[Symbol.asyncIterator] = function() {
			if (createReadableStreamAsyncIterator === void 0) createReadableStreamAsyncIterator = require_async_iterator();
			return createReadableStreamAsyncIterator(this);
		};
		Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
			enumerable: false,
			get: function get() {
				return this._readableState.highWaterMark;
			}
		});
		Object.defineProperty(Readable.prototype, "readableBuffer", {
			enumerable: false,
			get: function get() {
				return this._readableState && this._readableState.buffer;
			}
		});
		Object.defineProperty(Readable.prototype, "readableFlowing", {
			enumerable: false,
			get: function get() {
				return this._readableState.flowing;
			},
			set: function set(state) {
				if (this._readableState) this._readableState.flowing = state;
			}
		});
		Readable._fromList = fromList;
		Object.defineProperty(Readable.prototype, "readableLength", {
			enumerable: false,
			get: function get() {
				return this._readableState.length;
			}
		});
		function fromList(n, state) {
			if (state.length === 0) return null;
			var ret;
			if (state.objectMode) ret = state.buffer.shift();
			else if (!n || n >= state.length) {
				if (state.decoder) ret = state.buffer.join("");
				else if (state.buffer.length === 1) ret = state.buffer.first();
				else ret = state.buffer.concat(state.length);
				state.buffer.clear();
			} else ret = state.buffer.consume(n, state.decoder);
			return ret;
		}
		function endReadable(stream2) {
			var state = stream2._readableState;
			debug("endReadable", state.endEmitted);
			if (!state.endEmitted) {
				state.ended = true;
				import_browser.default.nextTick(endReadableNT, state, stream2);
			}
		}
		function endReadableNT(state, stream2) {
			debug("endReadableNT", state.endEmitted, state.length);
			if (!state.endEmitted && state.length === 0) {
				state.endEmitted = true;
				stream2.readable = false;
				stream2.emit("end");
				if (state.autoDestroy) {
					var wState = stream2._writableState;
					if (!wState || wState.autoDestroy && wState.finished) stream2.destroy();
				}
			}
		}
		if (typeof Symbol === "function") Readable.from = function(iterable, opts) {
			if (from === void 0) from = require_from_browser();
			return from(Readable, iterable, opts);
		};
		function indexOf(xs, x) {
			for (var i = 0, l = xs.length; i < l; i++) if (xs[i] === x) return i;
			return -1;
		}
	} });
	var require_stream_transform = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = Transform;
		var _require$codes = require_errors_browser().codes;
		var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
		var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
		var ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING;
		var ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
		var Duplex = require_stream_duplex();
		require_inherits_browser()(Transform, Duplex);
		function afterTransform(er, data) {
			var ts = this._transformState;
			ts.transforming = false;
			var cb = ts.writecb;
			if (cb === null) return this.emit("error", new ERR_MULTIPLE_CALLBACK());
			ts.writechunk = null;
			ts.writecb = null;
			if (data != null) this.push(data);
			cb(er);
			var rs = this._readableState;
			rs.reading = false;
			if (rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
		}
		function Transform(options) {
			if (!(this instanceof Transform)) return new Transform(options);
			Duplex.call(this, options);
			this._transformState = {
				afterTransform: afterTransform.bind(this),
				needTransform: false,
				transforming: false,
				writecb: null,
				writechunk: null,
				writeencoding: null
			};
			this._readableState.needReadable = true;
			this._readableState.sync = false;
			if (options) {
				if (typeof options.transform === "function") this._transform = options.transform;
				if (typeof options.flush === "function") this._flush = options.flush;
			}
			this.on("prefinish", prefinish);
		}
		function prefinish() {
			var _this = this;
			if (typeof this._flush === "function" && !this._readableState.destroyed) this._flush(function(er, data) {
				done(_this, er, data);
			});
			else done(this, null, null);
		}
		Transform.prototype.push = function(chunk, encoding) {
			this._transformState.needTransform = false;
			return Duplex.prototype.push.call(this, chunk, encoding);
		};
		Transform.prototype._transform = function(chunk, encoding, cb) {
			cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
		};
		Transform.prototype._write = function(chunk, encoding, cb) {
			var ts = this._transformState;
			ts.writecb = cb;
			ts.writechunk = chunk;
			ts.writeencoding = encoding;
			if (!ts.transforming) {
				var rs = this._readableState;
				if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
			}
		};
		Transform.prototype._read = function(n) {
			var ts = this._transformState;
			if (ts.writechunk !== null && !ts.transforming) {
				ts.transforming = true;
				this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
			} else ts.needTransform = true;
		};
		Transform.prototype._destroy = function(err, cb) {
			Duplex.prototype._destroy.call(this, err, function(err2) {
				cb(err2);
			});
		};
		function done(stream2, er, data) {
			if (er) return stream2.emit("error", er);
			if (data != null) stream2.push(data);
			if (stream2._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
			if (stream2._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
			return stream2.push(null);
		}
	} });
	var require_stream_passthrough = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_passthrough.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = PassThrough;
		var Transform = require_stream_transform();
		require_inherits_browser()(PassThrough, Transform);
		function PassThrough(options) {
			if (!(this instanceof PassThrough)) return new PassThrough(options);
			Transform.call(this, options);
		}
		PassThrough.prototype._transform = function(chunk, encoding, cb) {
			cb(null, chunk);
		};
	} });
	var require_pipeline = __commonJS({ "../../../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/pipeline.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var eos;
		function once(callback) {
			var called = false;
			return function() {
				if (called) return;
				called = true;
				callback.apply(void 0, arguments);
			};
		}
		var _require$codes = require_errors_browser().codes;
		var ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS;
		var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
		function noop(err) {
			if (err) throw err;
		}
		function isRequest(stream2) {
			return stream2.setHeader && typeof stream2.abort === "function";
		}
		function destroyer(stream2, reading, writing, callback) {
			callback = once(callback);
			var closed = false;
			stream2.on("close", function() {
				closed = true;
			});
			if (eos === void 0) eos = require_end_of_stream();
			eos(stream2, {
				readable: reading,
				writable: writing
			}, function(err) {
				if (err) return callback(err);
				closed = true;
				callback();
			});
			var destroyed = false;
			return function(err) {
				if (closed) return;
				if (destroyed) return;
				destroyed = true;
				if (isRequest(stream2)) return stream2.abort();
				if (typeof stream2.destroy === "function") return stream2.destroy();
				callback(err || new ERR_STREAM_DESTROYED("pipe"));
			};
		}
		function call(fn) {
			fn();
		}
		function pipe(from, to) {
			return from.pipe(to);
		}
		function popCallback(streams) {
			if (!streams.length) return noop;
			if (typeof streams[streams.length - 1] !== "function") return noop;
			return streams.pop();
		}
		function pipeline() {
			for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) streams[_key] = arguments[_key];
			var callback = popCallback(streams);
			if (Array.isArray(streams[0])) streams = streams[0];
			if (streams.length < 2) throw new ERR_MISSING_ARGS("streams");
			var error;
			var destroys = streams.map(function(stream2, i) {
				var reading = i < streams.length - 1;
				return destroyer(stream2, reading, i > 0, function(err) {
					if (!error) error = err;
					if (err) destroys.forEach(call);
					if (reading) return;
					destroys.forEach(call);
					callback(error);
				});
			});
			return streams.reduce(pipe);
		}
		module2.exports = pipeline;
	} });
	var require_stream_browserify = __commonJS({ "../../../node_modules/.pnpm/stream-browserify@3.0.0/node_modules/stream-browserify/index.js"(exports2, module2) {
		init_browser_globals();
		module2.exports = Stream;
		var EE = require_events().EventEmitter;
		require_inherits_browser()(Stream, EE);
		Stream.Readable = require_stream_readable();
		Stream.Writable = require_stream_writable();
		Stream.Duplex = require_stream_duplex();
		Stream.Transform = require_stream_transform();
		Stream.PassThrough = require_stream_passthrough();
		Stream.finished = require_end_of_stream();
		Stream.pipeline = require_pipeline();
		Stream.Stream = Stream;
		function Stream() {
			EE.call(this);
		}
		Stream.prototype.pipe = function(dest, options) {
			var source = this;
			function ondata(chunk) {
				if (dest.writable) {
					if (false === dest.write(chunk) && source.pause) source.pause();
				}
			}
			source.on("data", ondata);
			function ondrain() {
				if (source.readable && source.resume) source.resume();
			}
			dest.on("drain", ondrain);
			if (!dest._isStdio && (!options || options.end !== false)) {
				source.on("end", onend);
				source.on("close", onclose);
			}
			var didOnEnd = false;
			function onend() {
				if (didOnEnd) return;
				didOnEnd = true;
				dest.end();
			}
			function onclose() {
				if (didOnEnd) return;
				didOnEnd = true;
				if (typeof dest.destroy === "function") dest.destroy();
			}
			function onerror(er) {
				cleanup();
				if (EE.listenerCount(this, "error") === 0) throw er;
			}
			source.on("error", onerror);
			dest.on("error", onerror);
			function cleanup() {
				source.removeListener("data", ondata);
				dest.removeListener("drain", ondrain);
				source.removeListener("end", onend);
				source.removeListener("close", onclose);
				source.removeListener("error", onerror);
				dest.removeListener("error", onerror);
				source.removeListener("end", cleanup);
				source.removeListener("close", cleanup);
				dest.removeListener("close", cleanup);
			}
			source.on("end", cleanup);
			source.on("close", cleanup);
			dest.on("close", cleanup);
			dest.emit("pipe", source);
			return dest;
		};
	} });
	var require_services = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/lib/services.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var types = require_types2();
		var utils2 = require_utils();
		var buffer = require_buffer();
		var events = require_events();
		var stream2 = require_stream_browserify();
		var util2 = require_util();
		var Buffer3 = buffer.Buffer;
		var Tap = utils2.Tap;
		var Type = types.Type;
		var debug = util2.debuglog("avsc:services");
		var f = util2.format;
		var OPTS = { namespace: "org.apache.avro.ipc" };
		var BOOLEAN_TYPE = Type.forSchema("boolean", OPTS);
		var MAP_BYTES_TYPE = Type.forSchema({
			type: "map",
			values: "bytes"
		}, OPTS);
		var STRING_TYPE = Type.forSchema("string", OPTS);
		var HANDSHAKE_REQUEST_TYPE = Type.forSchema({
			name: "HandshakeRequest",
			type: "record",
			fields: [
				{
					name: "clientHash",
					type: {
						name: "MD5",
						type: "fixed",
						size: 16
					}
				},
				{
					name: "clientProtocol",
					type: ["null", "string"],
					"default": null
				},
				{
					name: "serverHash",
					type: "MD5"
				},
				{
					name: "meta",
					type: ["null", MAP_BYTES_TYPE],
					"default": null
				}
			]
		}, OPTS);
		var HANDSHAKE_RESPONSE_TYPE = Type.forSchema({
			name: "HandshakeResponse",
			type: "record",
			fields: [
				{
					name: "match",
					type: {
						name: "HandshakeMatch",
						type: "enum",
						symbols: [
							"BOTH",
							"CLIENT",
							"NONE"
						]
					}
				},
				{
					name: "serverProtocol",
					type: ["null", "string"],
					"default": null
				},
				{
					name: "serverHash",
					type: ["null", "MD5"],
					"default": null
				},
				{
					name: "meta",
					type: ["null", MAP_BYTES_TYPE],
					"default": null
				}
			]
		}, OPTS);
		var PREFIX_LENGTH = 16;
		var PING_MESSAGE = new Message("", Type.forSchema({
			name: "PingRequest",
			type: "record",
			fields: []
		}, OPTS), Type.forSchema(["string"], OPTS), Type.forSchema("null", OPTS));
		function Message(name, reqType, errType, resType, oneWay, doc) {
			this.name = name;
			if (!Type.isType(reqType, "record")) throw new Error("invalid request type");
			this.requestType = reqType;
			if (!Type.isType(errType, "union") || !Type.isType(errType.getTypes()[0], "string")) throw new Error("invalid error type");
			this.errorType = errType;
			if (oneWay) {
				if (!Type.isType(resType, "null") || errType.getTypes().length > 1) throw new Error("inapplicable one-way parameter");
			}
			this.responseType = resType;
			this.oneWay = !!oneWay;
			this.doc = doc !== void 0 ? "" + doc : void 0;
			Object.freeze(this);
		}
		Message.forSchema = function(name, schema, opts) {
			opts = opts || {};
			if (!utils2.isValidName(name)) throw new Error(f("invalid message name: %s", name));
			if (!Array.isArray(schema.request)) throw new Error(f("invalid message request: %s", name));
			var recordName = f("%s.%sRequest", OPTS.namespace, utils2.capitalize(name));
			var reqType = Type.forSchema({
				name: recordName,
				type: "record",
				namespace: opts.namespace || "",
				fields: schema.request
			}, opts);
			delete opts.registry[recordName];
			if (!schema.response) throw new Error(f("invalid message response: %s", name));
			var resType = Type.forSchema(schema.response, opts);
			if (schema.errors !== void 0 && !Array.isArray(schema.errors)) throw new Error(f("invalid message errors: %s", name));
			return new Message(name, reqType, Type.forSchema(["string"].concat(schema.errors || []), opts), resType, !!schema["one-way"], schema.doc);
		};
		Message.prototype.schema = Type.prototype.getSchema;
		Message.prototype._attrs = function(opts) {
			var schema = {
				request: this.requestType._attrs(opts).fields,
				response: this.responseType._attrs(opts)
			};
			var msgDoc = this.doc;
			if (msgDoc !== void 0) schema.doc = msgDoc;
			var errSchema = this.errorType._attrs(opts);
			if (errSchema.length > 1) schema.errors = errSchema.slice(1);
			if (this.oneWay) schema["one-way"] = true;
			return schema;
		};
		utils2.addDeprecatedGetters(Message, [
			"name",
			"errorType",
			"requestType",
			"responseType"
		]);
		Message.prototype.isOneWay = util2.deprecate(function() {
			return this.oneWay;
		}, "use `.oneWay` directly instead of `.isOneWay()`");
		function Service(name, messages, types2, ptcl, server) {
			if (typeof name != "string") return Service.forProtocol(name, messages);
			this.name = name;
			this._messagesByName = messages || {};
			this.messages = Object.freeze(utils2.objectValues(this._messagesByName));
			this._typesByName = types2 || {};
			this.types = Object.freeze(utils2.objectValues(this._typesByName));
			this.protocol = ptcl;
			this._hashStr = utils2.getHash(JSON.stringify(ptcl)).toString("binary");
			this.doc = ptcl.doc ? "" + ptcl.doc : void 0;
			this._server = server || this.createServer({ silent: true });
			Object.freeze(this);
		}
		Service.Client = Client;
		Service.Server = Server;
		Service.compatible = function(clientSvc, serverSvc) {
			try {
				createReaders(clientSvc, serverSvc);
			} catch (err) {
				return false;
			}
			return true;
		};
		Service.forProtocol = function(ptcl, opts) {
			opts = opts || {};
			var name = ptcl.protocol;
			if (!name) throw new Error("missing protocol name");
			if (ptcl.namespace !== void 0) opts.namespace = ptcl.namespace;
			else {
				var match = /^(.*)\.[^.]+$/.exec(name);
				if (match) opts.namespace = match[1];
			}
			name = utils2.qualify(name, opts.namespace);
			if (ptcl.types) ptcl.types.forEach(function(obj) {
				Type.forSchema(obj, opts);
			});
			var msgs;
			if (ptcl.messages) {
				msgs = {};
				Object.keys(ptcl.messages).forEach(function(key) {
					msgs[key] = Message.forSchema(key, ptcl.messages[key], opts);
				});
			}
			return new Service(name, msgs, opts.registry, ptcl);
		};
		Service.isService = function(any) {
			return !!any && any.hasOwnProperty("_hashStr");
		};
		Service.prototype.createClient = function(opts) {
			var client = new Client(this, opts);
			import_browser.default.nextTick(function() {
				if (opts && opts.server) {
					var obj = { objectMode: true };
					var pts = [new stream2.PassThrough(obj), new stream2.PassThrough(obj)];
					opts.server.createChannel({
						readable: pts[0],
						writable: pts[1]
					}, obj);
					client.createChannel({
						readable: pts[1],
						writable: pts[0]
					}, obj);
				} else if (opts && opts.transport) client.createChannel(opts.transport);
			});
			return client;
		};
		Service.prototype.createServer = function(opts) {
			return new Server(this, opts);
		};
		Object.defineProperty(Service.prototype, "hash", {
			enumerable: true,
			get: function() {
				return utils2.bufferFrom(this._hashStr, "binary");
			}
		});
		Service.prototype.message = function(name) {
			return this._messagesByName[name];
		};
		Service.prototype.type = function(name) {
			return this._typesByName[name];
		};
		Service.prototype.inspect = function() {
			return f("<Service %j>", this.name);
		};
		utils2.addDeprecatedGetters(Service, [
			"message",
			"messages",
			"name",
			"type",
			"types"
		]);
		Service.prototype.createEmitter = util2.deprecate(function(transport, opts) {
			opts = opts || {};
			var client = this.createClient({
				cache: opts.cache,
				buffering: false,
				strictTypes: opts.strictErrors,
				timeout: opts.timeout
			});
			var channel = client.createChannel(transport, opts);
			forwardErrors(client, channel);
			return channel;
		}, "use `.createClient()` instead of `.createEmitter()`");
		Service.prototype.createListener = util2.deprecate(function(transport, opts) {
			if (opts && opts.strictErrors) throw new Error("use `.createServer()` to support strict errors");
			return this._server.createChannel(transport, opts);
		}, "use `.createServer().createChannel()` instead of `.createListener()`");
		Service.prototype.emit = util2.deprecate(function(name, req, channel, cb) {
			if (!channel || !this.equals(channel.client._svc$)) throw new Error("invalid emitter");
			var client = channel.client;
			Client.prototype.emitMessage.call(client, name, req, cb && cb.bind(this));
			return channel.getPending();
		}, "create a client via `.createClient()` to emit messages instead of `.emit()`");
		Service.prototype.equals = util2.deprecate(function(any) {
			return Service.isService(any) && this.getFingerprint().equals(any.getFingerprint());
		}, "equality testing is deprecated, compare the `.protocol`s instead");
		Service.prototype.getFingerprint = util2.deprecate(function(algorithm) {
			return utils2.getHash(JSON.stringify(this.protocol), algorithm);
		}, "use `.hash` instead of `.getFingerprint()`");
		Service.prototype.getSchema = util2.deprecate(Type.prototype.getSchema, "use `.protocol` instead of `.getSchema()`");
		Service.prototype.on = util2.deprecate(function(name, handler) {
			var self2 = this;
			this._server.onMessage(name, function(req, cb) {
				return handler.call(self2, req, this.channel, cb);
			});
			return this;
		}, "use `.createServer().onMessage()` instead of `.on()`");
		Service.prototype.subprotocol = util2.deprecate(function() {
			var parent = this._server;
			var opts = {
				strictTypes: parent._strict,
				cache: parent._cache
			};
			var server = new Server(parent.service, opts);
			server._handlers = Object.create(parent._handlers);
			return new Service(this.name, this._messagesByName, this._typesByName, this.protocol, server);
		}, "`.subprotocol()` will be removed in 5.1");
		Service.prototype._attrs = function(opts) {
			var ptcl = { protocol: this.name };
			var types2 = [];
			this.types.forEach(function(t) {
				if (t.getName() === void 0) return;
				var typeSchema = t._attrs(opts);
				if (typeof typeSchema != "string") types2.push(typeSchema);
			});
			if (types2.length) ptcl.types = types2;
			var msgNames = Object.keys(this._messagesByName);
			if (msgNames.length) {
				ptcl.messages = {};
				msgNames.forEach(function(name) {
					ptcl.messages[name] = this._messagesByName[name]._attrs(opts);
				}, this);
			}
			if (opts && opts.exportAttrs && this.doc !== void 0) ptcl.doc = this.doc;
			return ptcl;
		};
		function discoverProtocol(transport, opts, cb) {
			if (cb === void 0 && typeof opts == "function") {
				cb = opts;
				opts = void 0;
			}
			var svc = new Service({ protocol: "Empty" }, OPTS);
			var ptclStr;
			svc.createClient({ timeout: opts && opts.timeout }).createChannel(transport, {
				scope: opts && opts.scope,
				endWritable: typeof transport == "function"
			}).once("handshake", function(hreq, hres) {
				ptclStr = hres.serverProtocol;
				this.destroy(true);
			}).once("eot", function(pending, err) {
				if (err && !/interrupted/.test(err)) cb(err);
				else cb(null, JSON.parse(ptclStr));
			});
		}
		function Client(svc, opts) {
			opts = opts || {};
			events.EventEmitter.call(this);
			this._svc$ = svc;
			this._channels$ = [];
			this._fns$ = [];
			this._buffering$ = !!opts.buffering;
			this._cache$ = opts.cache || {};
			this._policy$ = opts.channelPolicy;
			this._strict$ = !!opts.strictTypes;
			this._timeout$ = utils2.getOption(opts, "timeout", 1e4);
			if (opts.remoteProtocols) insertRemoteProtocols(this._cache$, opts.remoteProtocols, svc, true);
			this._svc$.messages.forEach(function(msg) {
				this[msg.name] = this._createMessageHandler$(msg);
			}, this);
		}
		util2.inherits(Client, events.EventEmitter);
		Client.prototype.activeChannels = function() {
			return this._channels$.slice();
		};
		Client.prototype.createChannel = function(transport, opts) {
			var objectMode = opts && opts.objectMode;
			var channel;
			if (typeof transport == "function") {
				var writableFactory;
				if (objectMode) writableFactory = transport;
				else writableFactory = function(cb) {
					var encoder2 = new FrameEncoder();
					var writable2 = transport(function(err, readable2) {
						if (err) {
							cb(err);
							return;
						}
						var decoder2 = new FrameDecoder().once("error", function(err2) {
							channel.destroy(err2);
						});
						cb(null, readable2.pipe(decoder2));
					});
					if (writable2) {
						encoder2.pipe(writable2);
						return encoder2;
					}
				};
				channel = new StatelessClientChannel(this, writableFactory, opts);
			} else {
				var readable, writable;
				if (isStream(transport)) readable = writable = transport;
				else {
					readable = transport.readable;
					writable = transport.writable;
				}
				if (!objectMode) {
					var decoder = new NettyDecoder();
					readable = readable.pipe(decoder);
					var encoder = new NettyEncoder();
					encoder.pipe(writable);
					writable = encoder;
				}
				channel = new StatefulClientChannel(this, readable, writable, opts);
				if (!objectMode) {
					channel.once("eot", function() {
						readable.unpipe(decoder);
						encoder.unpipe(writable);
					});
					decoder.once("error", function(err) {
						channel.destroy(err);
					});
				}
			}
			var channels = this._channels$;
			channels.push(channel);
			channel.once("_drain", function() {
				channels.splice(channels.indexOf(this), 1);
			});
			this._buffering$ = false;
			this.emit("channel", channel);
			return channel;
		};
		Client.prototype.destroyChannels = function(opts) {
			this._channels$.forEach(function(channel) {
				channel.destroy(opts && opts.noWait);
			});
		};
		Client.prototype.emitMessage = function(name, req, opts, cb) {
			var wreq = new WrappedRequest(getExistingMessage(this._svc$, name), {}, req);
			this._emitMessage$(wreq, opts, cb);
		};
		Client.prototype.remoteProtocols = function() {
			return getRemoteProtocols(this._cache$, true);
		};
		Object.defineProperty(Client.prototype, "service", {
			enumerable: true,
			get: function() {
				return this._svc$;
			}
		});
		Client.prototype.use = function() {
			var i, l, fn;
			for (i = 0, l = arguments.length; i < l; i++) {
				fn = arguments[i];
				this._fns$.push(fn.length < 3 ? fn(this) : fn);
			}
			return this;
		};
		Client.prototype._emitMessage$ = function(wreq, opts, cb) {
			if (!cb && typeof opts === "function") {
				cb = opts;
				opts = void 0;
			}
			var self2 = this;
			var channels = this._channels$;
			var numChannels = channels.length;
			if (!numChannels) {
				if (this._buffering$) {
					debug("no active client channels, buffering call");
					this.once("channel", function() {
						this._emitMessage$(wreq, opts, cb);
					});
				} else {
					var err = /* @__PURE__ */ new Error("no active channels");
					import_browser.default.nextTick(function() {
						if (cb) cb.call(new CallContext(wreq._msg), err);
						else self2.emit("error", err);
					});
				}
				return;
			}
			opts = opts || {};
			if (opts.timeout === void 0) opts.timeout = this._timeout$;
			var channel;
			if (numChannels === 1) channel = channels[0];
			else if (this._policy$) {
				channel = this._policy$(this._channels$.slice());
				if (!channel) {
					debug("policy returned no channel, skipping call");
					return;
				}
			} else channel = channels[Math.floor(Math.random() * numChannels)];
			channel._emit(wreq, opts, function(err2, wres) {
				var ctx = this;
				var errType = ctx.message.errorType;
				if (err2) {
					if (self2._strict$) err2 = errType.clone(err2.message, { wrapUnions: true });
					done(err2);
					return;
				}
				if (!wres) {
					done();
					return;
				}
				err2 = wres.error;
				if (!self2._strict$) {
					if (err2 === void 0) err2 = null;
					else if (Type.isType(errType, "union:unwrapped")) {
						if (typeof err2 == "string") err2 = new Error(err2);
					} else if (err2 && err2.string && typeof err2.string == "string") err2 = new Error(err2.string);
				}
				done(err2, wres.response);
				function done(err3, res) {
					if (cb) cb.call(ctx, err3, res);
					else if (err3) self2.emit("error", err3);
				}
			});
		};
		Client.prototype._createMessageHandler$ = function(msg) {
			var names = msg.requestType.getFields().map(function(f2) {
				return f2.getName();
			});
			var body = "return function " + msg.name + "(";
			if (names.length) body += names.join(", ") + ", ";
			body += "opts, cb) {\n";
			body += "  var req = {";
			body += names.map(function(n) {
				return n + ": " + n;
			}).join(", ");
			body += "};\n";
			body += "  return this.emitMessage('" + msg.name + "', req, opts, cb);\n";
			body += "};";
			return new Function(body)();
		};
		function Server(svc, opts) {
			opts = opts || {};
			events.EventEmitter.call(this);
			this.service = svc;
			this._handlers = {};
			this._fns = [];
			this._channels = {};
			this._nextChannelId = 1;
			this._cache = opts.cache || {};
			this._defaultHandler = opts.defaultHandler;
			this._sysErrFormatter = opts.systemErrorFormatter;
			this._silent = !!opts.silent;
			this._strict = !!opts.strictTypes;
			if (opts.remoteProtocols) insertRemoteProtocols(this._cache, opts.remoteProtocols, svc, false);
			svc.messages.forEach(function(msg) {
				var name = msg.name;
				if (!opts.noCapitalize) name = utils2.capitalize(name);
				this["on" + name] = this._createMessageHandler(msg);
			}, this);
		}
		util2.inherits(Server, events.EventEmitter);
		Server.prototype.activeChannels = function() {
			return utils2.objectValues(this._channels);
		};
		Server.prototype.createChannel = function(transport, opts) {
			var objectMode = opts && opts.objectMode;
			var channel;
			if (typeof transport == "function") {
				var readableFactory;
				if (objectMode) readableFactory = transport;
				else readableFactory = function(cb) {
					var decoder2 = new FrameDecoder().once("error", function(err) {
						channel.destroy(err);
					});
					return transport(function(err, writable2) {
						if (err) {
							cb(err);
							return;
						}
						var encoder2 = new FrameEncoder();
						encoder2.pipe(writable2);
						cb(null, encoder2);
					}).pipe(decoder2);
				};
				channel = new StatelessServerChannel(this, readableFactory, opts);
			} else {
				var readable, writable;
				if (isStream(transport)) readable = writable = transport;
				else {
					readable = transport.readable;
					writable = transport.writable;
				}
				if (!objectMode) {
					var decoder = new NettyDecoder();
					readable = readable.pipe(decoder);
					var encoder = new NettyEncoder();
					encoder.pipe(writable);
					writable = encoder;
				}
				channel = new StatefulServerChannel(this, readable, writable, opts);
				if (!objectMode) {
					channel.once("eot", function() {
						readable.unpipe(decoder);
						encoder.unpipe(writable);
					});
					decoder.once("error", function(err) {
						channel.destroy(err);
					});
				}
			}
			if (!this.listeners("error").length) this.on("error", this._onError);
			var channelId = this._nextChannelId++;
			var channels = this._channels;
			channels[channelId] = channel.once("eot", function() {
				delete channels[channelId];
			});
			this.emit("channel", channel);
			return channel;
		};
		Server.prototype.onMessage = function(name, handler) {
			getExistingMessage(this.service, name);
			this._handlers[name] = handler;
			return this;
		};
		Server.prototype.remoteProtocols = function() {
			return getRemoteProtocols(this._cache, false);
		};
		Server.prototype.use = function() {
			var i, l, fn;
			for (i = 0, l = arguments.length; i < l; i++) {
				fn = arguments[i];
				this._fns.push(fn.length < 3 ? fn(this) : fn);
			}
			return this;
		};
		Server.prototype._createMessageHandler = function(msg) {
			var name = msg.name;
			var fields = msg.requestType.fields;
			var numArgs = fields.length;
			var args = fields.length ? ", " + fields.map(function(f2) {
				return "req." + f2.name;
			}).join(", ") : "";
			var body = "return function (handler) {\n";
			body += "  if (handler.length > " + numArgs + ") {\n";
			body += "    return this.onMessage('" + name + "', function (req, cb) {\n";
			body += "      return handler.call(this" + args + ", cb);\n";
			body += "    });\n";
			body += "  } else {\n";
			body += "    return this.onMessage('" + name + "', function (req) {\n";
			body += "      return handler.call(this" + args + ");\n";
			body += "    });\n";
			body += "  }\n";
			body += "};\n";
			return new Function(body)();
		};
		Server.prototype._onError = function(err) {
			if (!this._silent && err.rpcCode !== "UNKNOWN_PROTOCOL") {
				console.error();
				if (err.rpcCode) {
					console.error(err.rpcCode);
					console.error(err.cause);
				} else {
					console.error("INTERNAL_SERVER_ERROR");
					console.error(err);
				}
			}
		};
		function ClientChannel(client, opts) {
			opts = opts || {};
			events.EventEmitter.call(this);
			this.client = client;
			this.timeout = utils2.getOption(opts, "timeout", client._timeout$);
			this._endWritable = !!utils2.getOption(opts, "endWritable", true);
			this._prefix = normalizedPrefix(opts.scope);
			var cache = client._cache$;
			var clientSvc = client._svc$;
			var hash = opts.serverHash;
			if (!hash) hash = clientSvc.hash;
			var adapter = cache[hash];
			if (!adapter) {
				hash = clientSvc.hash;
				adapter = cache[hash] = new Adapter(clientSvc, clientSvc, hash);
			}
			this._adapter = adapter;
			this._registry = new Registry(this, PREFIX_LENGTH);
			this.pending = 0;
			this.destroyed = false;
			this.draining = false;
			this.once("_eot", function(pending, err) {
				debug("client channel EOT");
				this.destroyed = true;
				this.emit("eot", pending, err);
			});
		}
		util2.inherits(ClientChannel, events.EventEmitter);
		ClientChannel.prototype.destroy = function(noWait) {
			debug("destroying client channel");
			if (!this.draining) {
				this.draining = true;
				this.emit("_drain");
			}
			var registry = this._registry;
			var pending = this.pending;
			if (noWait) registry.clear();
			if (noWait || !pending) if (isError(noWait)) {
				debug("fatal client channel error: %s", noWait);
				this.emit("_eot", pending, noWait);
			} else this.emit("_eot", pending);
			else debug("client channel entering drain mode (%s pending)", pending);
		};
		ClientChannel.prototype.ping = function(timeout, cb) {
			if (!cb && typeof timeout == "function") {
				cb = timeout;
				timeout = void 0;
			}
			var self2 = this;
			var wreq = new WrappedRequest(PING_MESSAGE);
			this._emit(wreq, { timeout }, function(err) {
				if (cb) cb.call(self2, err);
				else if (err) self2.destroy(err);
			});
		};
		ClientChannel.prototype._createHandshakeRequest = function(adapter, noSvc) {
			var svc = this.client._svc$;
			return {
				clientHash: svc.hash,
				clientProtocol: noSvc ? null : JSON.stringify(svc.protocol),
				serverHash: adapter._hash
			};
		};
		ClientChannel.prototype._emit = function(wreq, opts, cb) {
			var msg = wreq._msg;
			var wres = msg.oneWay ? void 0 : new WrappedResponse(msg, {});
			var ctx = new CallContext(msg, this);
			var self2 = this;
			this.pending++;
			import_browser.default.nextTick(function() {
				if (!msg.name) onTransition(wreq, wres, onCompletion);
				else {
					self2.emit("outgoingCall", ctx, opts);
					var fns = self2.client._fns$;
					debug("starting client middleware chain (%s middleware)", fns.length);
					chainMiddleware({
						fns,
						ctx,
						wreq,
						wres,
						onTransition,
						onCompletion,
						onError
					});
				}
			});
			function onTransition(wreq2, wres2, prev) {
				var err, reqBuf;
				if (self2.destroyed) err = /* @__PURE__ */ new Error("channel destroyed");
				else try {
					reqBuf = wreq2.toBuffer();
				} catch (cause) {
					err = serializationError(f("invalid %j request", msg.name), wreq2, [{
						name: "headers",
						type: MAP_BYTES_TYPE
					}, {
						name: "request",
						type: msg.requestType
					}]);
				}
				if (err) {
					prev(err);
					return;
				}
				var timeout = opts && opts.timeout !== void 0 ? opts.timeout : self2.timeout;
				var id = self2._registry.add(timeout, function(err2, resBuf, adapter) {
					if (!err2 && !msg.oneWay) try {
						adapter._decodeResponse(resBuf, wres2, msg);
					} catch (cause) {
						err2 = cause;
					}
					prev(err2);
				});
				id |= self2._prefix;
				debug("sending message %s", id);
				self2._send(id, reqBuf, !!msg && msg.oneWay);
			}
			function onCompletion(err) {
				self2.pending--;
				cb.call(ctx, err, wres);
				if (self2.draining && !self2.destroyed && !self2.pending) self2.destroy();
			}
			function onError(err) {
				self2.client.emit("error", err, self2);
			}
		};
		ClientChannel.prototype._getAdapter = function(hres) {
			var hash = hres.serverHash;
			var cache = this.client._cache$;
			var adapter = cache[hash];
			if (adapter) return adapter;
			var ptcl = JSON.parse(hres.serverProtocol);
			var serverSvc = Service.forProtocol(ptcl);
			adapter = new Adapter(this.client._svc$, serverSvc, hash, true);
			return cache[hash] = adapter;
		};
		ClientChannel.prototype._matchesPrefix = function(id) {
			return matchesPrefix(id, this._prefix);
		};
		ClientChannel.prototype._send = utils2.abstractFunction;
		utils2.addDeprecatedGetters(ClientChannel, ["pending", "timeout"]);
		ClientChannel.prototype.getCache = util2.deprecate(function() {
			return this.client._cache$;
		}, "use `.remoteProtocols()` instead of `.getCache()`");
		ClientChannel.prototype.getProtocol = util2.deprecate(function() {
			return this.client._svc$;
		}, "use `.service` instead or `.getProtocol()`");
		ClientChannel.prototype.isDestroyed = util2.deprecate(function() {
			return this.destroyed;
		}, "use `.destroyed` instead of `.isDestroyed`");
		function StatelessClientChannel(client, writableFactory, opts) {
			ClientChannel.call(this, client, opts);
			this._writableFactory = writableFactory;
			if (!opts || !opts.noPing) {
				debug("emitting ping request");
				this.ping();
			}
		}
		util2.inherits(StatelessClientChannel, ClientChannel);
		StatelessClientChannel.prototype._send = function(id, reqBuf) {
			var cb = this._registry.get(id);
			var adapter = this._adapter;
			var self2 = this;
			import_browser.default.nextTick(emit);
			return true;
			function emit(retry) {
				if (self2.destroyed) return;
				var hreq = self2._createHandshakeRequest(adapter, !retry);
				var writable = self2._writableFactory.call(self2, function(err, readable) {
					if (err) {
						cb(err);
						return;
					}
					readable.on("data", function(obj) {
						debug("received response %s", obj.id);
						var buf = Buffer3.concat(obj.payload);
						try {
							var parts = readHead(HANDSHAKE_RESPONSE_TYPE, buf);
							var hres = parts.head;
							if (hres.serverHash) adapter = self2._getAdapter(hres);
						} catch (cause) {
							cb(cause);
							return;
						}
						var match = hres.match;
						debug("handshake match: %s", match);
						self2.emit("handshake", hreq, hres);
						if (match === "NONE") import_browser.default.nextTick(function() {
							emit(true);
						});
						else {
							self2._adapter = adapter;
							cb(null, parts.tail, adapter);
						}
					});
				});
				if (!writable) {
					cb(/* @__PURE__ */ new Error("invalid writable stream"));
					return;
				}
				writable.write({
					id,
					payload: [HANDSHAKE_REQUEST_TYPE.toBuffer(hreq), reqBuf]
				});
				if (self2._endWritable) writable.end();
			}
		};
		function StatefulClientChannel(client, readable, writable, opts) {
			ClientChannel.call(this, client, opts);
			this._readable = readable;
			this._writable = writable;
			this._connected = !!(opts && opts.noPing);
			this._readable.on("end", onEnd);
			this._writable.on("finish", onFinish);
			var self2 = this;
			var timer = null;
			this.once("eot", function() {
				if (timer) {
					clearTimeout(timer);
					timer = null;
				}
				if (!self2._connected) self2.emit("_ready");
				this._writable.removeListener("finish", onFinish);
				if (this._endWritable) {
					debug("ending transport");
					this._writable.end();
				}
				this._readable.removeListener("data", onPing).removeListener("data", onMessage).removeListener("end", onEnd);
			});
			var hreq;
			if (this._connected) this._readable.on("data", onMessage);
			else {
				this._readable.on("data", onPing);
				import_browser.default.nextTick(ping);
				if (self2.timeout) timer = setTimeout(function() {
					self2.destroy(/* @__PURE__ */ new Error("timeout"));
				}, self2.timeout);
			}
			function ping(retry) {
				if (self2.destroyed) return;
				hreq = self2._createHandshakeRequest(self2._adapter, !retry);
				var payload = [HANDSHAKE_REQUEST_TYPE.toBuffer(hreq), utils2.bufferFrom([0, 0])];
				self2._writable.write({
					id: self2._prefix,
					payload
				});
			}
			function onPing(obj) {
				if (!self2._matchesPrefix(obj.id)) {
					debug("discarding unscoped response %s (still connecting)", obj.id);
					return;
				}
				var buf = Buffer3.concat(obj.payload);
				try {
					var hres = readHead(HANDSHAKE_RESPONSE_TYPE, buf).head;
					if (hres.serverHash) self2._adapter = self2._getAdapter(hres);
				} catch (cause) {
					self2.destroy(cause);
					return;
				}
				var match = hres.match;
				debug("handshake match: %s", match);
				self2.emit("handshake", hreq, hres);
				if (match === "NONE") import_browser.default.nextTick(function() {
					ping(true);
				});
				else {
					debug("successfully connected");
					if (timer) {
						clearTimeout(timer);
						timer = null;
					}
					self2._readable.removeListener("data", onPing).on("data", onMessage);
					self2._connected = true;
					self2.emit("_ready");
					hreq = null;
				}
			}
			function onMessage(obj) {
				var id = obj.id;
				if (!self2._matchesPrefix(id)) {
					debug("discarding unscoped message %s", id);
					return;
				}
				var cb = self2._registry.get(id);
				if (cb) import_browser.default.nextTick(function() {
					debug("received message %s", id);
					cb(null, Buffer3.concat(obj.payload), self2._adapter);
				});
			}
			function onEnd() {
				self2.destroy(true);
			}
			function onFinish() {
				self2.destroy();
			}
		}
		util2.inherits(StatefulClientChannel, ClientChannel);
		StatefulClientChannel.prototype._emit = function() {
			if (this._connected || this.draining) ClientChannel.prototype._emit.apply(this, arguments);
			else {
				debug("queuing request");
				var args = [];
				var i, l;
				for (i = 0, l = arguments.length; i < l; i++) args.push(arguments[i]);
				this.once("_ready", function() {
					this._emit.apply(this, args);
				});
			}
		};
		StatefulClientChannel.prototype._send = function(id, reqBuf, oneWay) {
			if (oneWay) {
				var self2 = this;
				import_browser.default.nextTick(function() {
					self2._registry.get(id)(null, utils2.bufferFrom([
						0,
						0,
						0
					]), self2._adapter);
				});
			}
			return this._writable.write({
				id,
				payload: [reqBuf]
			});
		};
		function ServerChannel(server, opts) {
			opts = opts || {};
			events.EventEmitter.call(this);
			this.server = server;
			this._endWritable = !!utils2.getOption(opts, "endWritable", true);
			this._prefix = normalizedPrefix(opts.scope);
			var cache = server._cache;
			var svc = server.service;
			var hash = svc.hash;
			if (!cache[hash]) cache[hash] = new Adapter(svc, svc, hash);
			this._adapter = null;
			this.destroyed = false;
			this.draining = false;
			this.pending = 0;
			this.once("_eot", function(pending, err) {
				debug("server channel EOT");
				this.emit("eot", pending, err);
			});
		}
		util2.inherits(ServerChannel, events.EventEmitter);
		ServerChannel.prototype.destroy = function(noWait) {
			if (!this.draining) {
				this.draining = true;
				this.emit("_drain");
			}
			if (noWait || !this.pending) {
				this.destroyed = true;
				if (isError(noWait)) {
					debug("fatal server channel error: %s", noWait);
					this.emit("_eot", this.pending, noWait);
				} else this.emit("_eot", this.pending);
			}
		};
		ServerChannel.prototype._createHandshakeResponse = function(err, hreq) {
			var svc = this.server.service;
			var buf = svc.hash;
			var serverMatch = hreq && hreq.serverHash.equals(buf);
			return {
				match: err ? "NONE" : serverMatch ? "BOTH" : "CLIENT",
				serverProtocol: serverMatch ? null : JSON.stringify(svc.protocol),
				serverHash: serverMatch ? null : buf
			};
		};
		ServerChannel.prototype._getAdapter = function(hreq) {
			var hash = hreq.clientHash;
			var adapter = this.server._cache[hash];
			if (adapter) return adapter;
			if (!hreq.clientProtocol) throw toRpcError("UNKNOWN_PROTOCOL");
			var ptcl = JSON.parse(hreq.clientProtocol);
			adapter = new Adapter(Service.forProtocol(ptcl), this.server.service, hash, true);
			return this.server._cache[hash] = adapter;
		};
		ServerChannel.prototype._matchesPrefix = function(id) {
			return matchesPrefix(id, this._prefix);
		};
		ServerChannel.prototype._receive = function(reqBuf, adapter, cb) {
			var self2 = this;
			var wreq;
			try {
				wreq = adapter._decodeRequest(reqBuf);
			} catch (cause) {
				cb(self2._encodeSystemError(toRpcError("INVALID_REQUEST", cause)));
				return;
			}
			var msg = wreq._msg;
			var wres = new WrappedResponse(msg, {});
			if (!msg.name) {
				wres.response = null;
				cb(wres.toBuffer(), false);
				return;
			}
			var ctx = new CallContext(msg, this);
			self2.emit("incomingCall", ctx);
			var fns = this.server._fns;
			debug("starting server middleware chain (%s middleware)", fns.length);
			self2.pending++;
			chainMiddleware({
				fns,
				ctx,
				wreq,
				wres,
				onTransition,
				onCompletion,
				onError
			});
			function onTransition(wreq2, wres2, prev) {
				var handler = self2.server._handlers[msg.name];
				if (!handler) {
					var defaultHandler = self2.server._defaultHandler;
					if (defaultHandler) defaultHandler.call(ctx, wreq2, wres2, prev);
					else prev(toRpcError("NOT_IMPLEMENTED", new Error(f("no handler for %s", msg.name))));
				} else {
					var pending = !msg.oneWay;
					try {
						if (pending) handler.call(ctx, wreq2.request, function(err, res) {
							pending = false;
							wres2.error = err;
							wres2.response = res;
							prev();
						});
						else {
							handler.call(ctx, wreq2.request);
							prev();
						}
					} catch (err) {
						if (pending) {
							pending = false;
							prev(err);
						} else onError(err);
					}
				}
			}
			function onCompletion(err) {
				self2.pending--;
				var server = self2.server;
				var resBuf;
				if (!err) {
					var resErr = wres.error;
					if (!server._strict) {
						if (isError(resErr)) wres.error = msg.errorType.clone(resErr.message, { wrapUnions: true });
						else if (resErr === null) resErr = wres.error = void 0;
						if (resErr === void 0 && wres.response === void 0 && msg.responseType.isValid(null)) wres.response = null;
					}
					try {
						resBuf = wres.toBuffer();
					} catch (cause) {
						if (wres.error !== void 0) err = serializationError(f("invalid %j error", msg.name), wres, [{
							name: "headers",
							type: MAP_BYTES_TYPE
						}, {
							name: "error",
							type: msg.errorType
						}]);
						else err = serializationError(f("invalid %j response", msg.name), wres, [{
							name: "headers",
							type: MAP_BYTES_TYPE
						}, {
							name: "response",
							type: msg.responseType
						}]);
					}
				}
				if (!resBuf) resBuf = self2._encodeSystemError(err, wres.headers);
				else if (resErr !== void 0) server.emit("error", toRpcError("APPLICATION_ERROR", resErr));
				cb(resBuf, msg.oneWay);
				if (self2.draining && !self2.pending) self2.destroy();
			}
			function onError(err) {
				self2.server.emit("error", err, self2);
			}
		};
		utils2.addDeprecatedGetters(ServerChannel, ["pending"]);
		ServerChannel.prototype.getCache = util2.deprecate(function() {
			return this.server._cache;
		}, "use `.remoteProtocols()` instead of `.getCache()`");
		ServerChannel.prototype.getProtocol = util2.deprecate(function() {
			return this.server.service;
		}, "use `.service` instead of `.getProtocol()`");
		ServerChannel.prototype.isDestroyed = util2.deprecate(function() {
			return this.destroyed;
		}, "use `.destroyed` instead of `.isDestroyed`");
		ServerChannel.prototype._encodeSystemError = function(err, header) {
			var server = this.server;
			server.emit("error", err, this);
			var errStr;
			if (server._sysErrFormatter) errStr = server._sysErrFormatter.call(this, err);
			else if (err.rpcCode) errStr = err.message;
			var hdrBuf;
			if (header) try {
				hdrBuf = MAP_BYTES_TYPE.toBuffer(header);
			} catch (cause) {
				server.emit("error", cause, this);
			}
			return Buffer3.concat([
				hdrBuf || utils2.bufferFrom([0]),
				utils2.bufferFrom([1, 0]),
				STRING_TYPE.toBuffer(errStr || "internal server error")
			]);
		};
		function StatelessServerChannel(server, readableFactory, opts) {
			ServerChannel.call(this, server, opts);
			this._writable = void 0;
			var self2 = this;
			var readable;
			import_browser.default.nextTick(function() {
				readable = readableFactory.call(self2, function(err, writable) {
					import_browser.default.nextTick(function() {
						if (err) {
							onFinish(err);
							return;
						}
						self2._writable = writable.on("finish", onFinish);
						self2.emit("_writable");
					});
				}).on("data", onRequest).on("end", onEnd);
			});
			function onRequest(obj) {
				var id = obj.id;
				var buf = Buffer3.concat(obj.payload);
				var err;
				try {
					var parts = readHead(HANDSHAKE_REQUEST_TYPE, buf);
					var hreq = parts.head;
					var adapter = self2._getAdapter(hreq);
				} catch (cause) {
					err = toRpcError("INVALID_HANDSHAKE_REQUEST", cause);
				}
				var hres = self2._createHandshakeResponse(err, hreq);
				self2.emit("handshake", hreq, hres);
				if (err) done(self2._encodeSystemError(err));
				else self2._receive(parts.tail, adapter, done);
				function done(resBuf) {
					if (!self2.destroyed) {
						if (!self2._writable) {
							self2.once("_writable", function() {
								done(resBuf);
							});
							return;
						}
						self2._writable.write({
							id,
							payload: [HANDSHAKE_RESPONSE_TYPE.toBuffer(hres), resBuf]
						});
					}
					if (self2._writable && self2._endWritable) self2._writable.end();
				}
			}
			function onEnd() {
				self2.destroy();
			}
			function onFinish(err) {
				readable.removeListener("data", onRequest).removeListener("end", onEnd);
				self2.destroy(err || true);
			}
		}
		util2.inherits(StatelessServerChannel, ServerChannel);
		function StatefulServerChannel(server, readable, writable, opts) {
			ServerChannel.call(this, server, opts);
			this._adapter = void 0;
			this._writable = writable.on("finish", onFinish);
			this._readable = readable.on("data", onHandshake).on("end", onEnd);
			this.once("_drain", function() {
				this._readable.removeListener("data", onHandshake).removeListener("data", onRequest).removeListener("end", onEnd);
			}).once("eot", function() {
				this._writable.removeListener("finish", onFinish);
				if (this._endWritable) this._writable.end();
			});
			var self2 = this;
			function onHandshake(obj) {
				var id = obj.id;
				if (!self2._matchesPrefix(id)) return;
				var buf = Buffer3.concat(obj.payload);
				var err;
				try {
					var parts = readHead(HANDSHAKE_REQUEST_TYPE, buf);
					var hreq = parts.head;
					self2._adapter = self2._getAdapter(hreq);
				} catch (cause) {
					err = toRpcError("INVALID_HANDSHAKE_REQUEST", cause);
				}
				var hres = self2._createHandshakeResponse(err, hreq);
				self2.emit("handshake", hreq, hres);
				if (err) done(self2._encodeSystemError(err));
				else {
					self2._readable.removeListener("data", onHandshake).on("data", onRequest);
					self2._receive(parts.tail, self2._adapter, done);
				}
				function done(resBuf) {
					if (self2.destroyed) return;
					self2._writable.write({
						id,
						payload: [HANDSHAKE_RESPONSE_TYPE.toBuffer(hres), resBuf]
					});
				}
			}
			function onRequest(obj) {
				var id = obj.id;
				if (!self2._matchesPrefix(id)) return;
				var reqBuf = Buffer3.concat(obj.payload);
				self2._receive(reqBuf, self2._adapter, function(resBuf, oneWay) {
					if (self2.destroyed || oneWay) return;
					self2._writable.write({
						id,
						payload: [resBuf]
					});
				});
			}
			function onEnd() {
				self2.destroy();
			}
			function onFinish() {
				self2.destroy(true);
			}
		}
		util2.inherits(StatefulServerChannel, ServerChannel);
		function WrappedRequest(msg, hdrs, req) {
			this._msg = msg;
			this.headers = hdrs || {};
			this.request = req || {};
		}
		WrappedRequest.prototype.toBuffer = function() {
			var msg = this._msg;
			return Buffer3.concat([
				MAP_BYTES_TYPE.toBuffer(this.headers),
				STRING_TYPE.toBuffer(msg.name),
				msg.requestType.toBuffer(this.request)
			]);
		};
		function WrappedResponse(msg, hdr, err, res) {
			this._msg = msg;
			this.headers = hdr;
			this.error = err;
			this.response = res;
		}
		WrappedResponse.prototype.toBuffer = function() {
			var hdr = MAP_BYTES_TYPE.toBuffer(this.headers);
			var hasError = this.error !== void 0;
			return Buffer3.concat([
				hdr,
				BOOLEAN_TYPE.toBuffer(hasError),
				hasError ? this._msg.errorType.toBuffer(this.error) : this._msg.responseType.toBuffer(this.response)
			]);
		};
		function CallContext(msg, channel) {
			this.channel = channel;
			this.locals = {};
			this.message = msg;
			Object.freeze(this);
		}
		function Registry(ctx, prefixLength) {
			this._ctx = ctx;
			this._mask = -1 >>> (prefixLength | 0);
			this._id = 0;
			this._n = 0;
			this._cbs = {};
		}
		Registry.prototype.get = function(id) {
			return this._cbs[id & this._mask];
		};
		Registry.prototype.add = function(timeout, fn) {
			this._id = this._id + 1 & this._mask;
			var self2 = this;
			var id = this._id;
			var timer;
			if (timeout > 0) timer = setTimeout(function() {
				cb(/* @__PURE__ */ new Error("timeout"));
			}, timeout);
			this._cbs[id] = cb;
			this._n++;
			return id;
			function cb() {
				if (!self2._cbs[id]) return;
				delete self2._cbs[id];
				self2._n--;
				if (timer) clearTimeout(timer);
				fn.apply(self2._ctx, arguments);
			}
		};
		Registry.prototype.clear = function() {
			Object.keys(this._cbs).forEach(function(id) {
				this._cbs[id](/* @__PURE__ */ new Error("interrupted"));
			}, this);
		};
		function Adapter(clientSvc, serverSvc, hash, isRemote) {
			this._clientSvc = clientSvc;
			this._serverSvc = serverSvc;
			this._hash = hash;
			this._isRemote = !!isRemote;
			this._readers = createReaders(clientSvc, serverSvc);
		}
		Adapter.prototype._decodeRequest = function(buf) {
			var tap = new Tap(buf);
			var hdr = MAP_BYTES_TYPE._read(tap);
			var name = STRING_TYPE._read(tap);
			var msg, req;
			if (name) {
				msg = this._serverSvc.message(name);
				req = this._readers[name + "?"]._read(tap);
			} else msg = PING_MESSAGE;
			if (!tap.isValid()) throw new Error(f("truncated %s request", name || "ping$"));
			return new WrappedRequest(msg, hdr, req);
		};
		Adapter.prototype._decodeResponse = function(buf, wres, msg) {
			var tap = new Tap(buf);
			utils2.copyOwnProperties(MAP_BYTES_TYPE._read(tap), wres.headers, true);
			var isError2 = BOOLEAN_TYPE._read(tap);
			var name = msg.name;
			if (name) {
				var reader = this._readers[name + (isError2 ? "*" : "!")];
				msg = this._clientSvc.message(name);
				if (isError2) wres.error = reader._read(tap);
				else wres.response = reader._read(tap);
				if (!tap.isValid()) throw new Error(f("truncated %s response", name));
			} else msg = PING_MESSAGE;
		};
		function FrameDecoder() {
			stream2.Transform.call(this, { readableObjectMode: true });
			this._id = void 0;
			this._buf = utils2.newBuffer(0);
			this._bufs = [];
			this.on("finish", function() {
				this.push(null);
			});
		}
		util2.inherits(FrameDecoder, stream2.Transform);
		FrameDecoder.prototype._transform = function(buf, encoding, cb) {
			buf = Buffer3.concat([this._buf, buf]);
			var frameLength;
			while (buf.length >= 4 && buf.length >= (frameLength = buf.readInt32BE(0)) + 4) {
				if (frameLength) this._bufs.push(buf.slice(4, frameLength + 4));
				else {
					var bufs = this._bufs;
					this._bufs = [];
					this.push({
						id: null,
						payload: bufs
					});
				}
				buf = buf.slice(frameLength + 4);
			}
			this._buf = buf;
			cb();
		};
		FrameDecoder.prototype._flush = function(cb) {
			if (this._buf.length || this._bufs.length) {
				var bufs = this._bufs.slice();
				bufs.unshift(this._buf);
				var err = toRpcError("TRAILING_DATA");
				err.trailingData = Buffer3.concat(bufs).toString();
				this.emit("error", err);
			}
			cb();
		};
		function FrameEncoder() {
			stream2.Transform.call(this, { writableObjectMode: true });
			this.on("finish", function() {
				this.push(null);
			});
		}
		util2.inherits(FrameEncoder, stream2.Transform);
		FrameEncoder.prototype._transform = function(obj, encoding, cb) {
			var bufs = obj.payload;
			var i, l, buf;
			for (i = 0, l = bufs.length; i < l; i++) {
				buf = bufs[i];
				this.push(intBuffer(buf.length));
				this.push(buf);
			}
			this.push(intBuffer(0));
			cb();
		};
		function NettyDecoder() {
			stream2.Transform.call(this, { readableObjectMode: true });
			this._id = void 0;
			this._frameCount = 0;
			this._buf = utils2.newBuffer(0);
			this._bufs = [];
			this.on("finish", function() {
				this.push(null);
			});
		}
		util2.inherits(NettyDecoder, stream2.Transform);
		NettyDecoder.prototype._transform = function(buf, encoding, cb) {
			buf = Buffer3.concat([this._buf, buf]);
			while (true) {
				if (this._id === void 0) {
					if (buf.length < 8) {
						this._buf = buf;
						cb();
						return;
					}
					this._id = buf.readInt32BE(0);
					this._frameCount = buf.readInt32BE(4);
					buf = buf.slice(8);
				}
				var frameLength;
				while (this._frameCount && buf.length >= 4 && buf.length >= (frameLength = buf.readInt32BE(0)) + 4) {
					this._frameCount--;
					this._bufs.push(buf.slice(4, frameLength + 4));
					buf = buf.slice(frameLength + 4);
				}
				if (this._frameCount) {
					this._buf = buf;
					cb();
					return;
				} else {
					var obj = {
						id: this._id,
						payload: this._bufs
					};
					this._bufs = [];
					this._id = void 0;
					this.push(obj);
				}
			}
		};
		NettyDecoder.prototype._flush = FrameDecoder.prototype._flush;
		function NettyEncoder() {
			stream2.Transform.call(this, { writableObjectMode: true });
			this.on("finish", function() {
				this.push(null);
			});
		}
		util2.inherits(NettyEncoder, stream2.Transform);
		NettyEncoder.prototype._transform = function(obj, encoding, cb) {
			var bufs = obj.payload;
			var l = bufs.length;
			var buf = utils2.newBuffer(8);
			buf.writeInt32BE(obj.id, 0);
			buf.writeInt32BE(l, 4);
			this.push(buf);
			var i;
			for (i = 0; i < l; i++) {
				buf = bufs[i];
				this.push(intBuffer(buf.length));
				this.push(buf);
			}
			cb();
		};
		function intBuffer(n) {
			var buf = utils2.newBuffer(4);
			buf.writeInt32BE(n);
			return buf;
		}
		function readHead(type, buf) {
			var tap = new Tap(buf);
			var head = type._read(tap);
			if (!tap.isValid()) throw new Error(f("truncated %j", type.schema()));
			return {
				head,
				tail: tap.buf.slice(tap.pos)
			};
		}
		function createReader(rtype, wtype) {
			return rtype.equals(wtype) ? rtype : rtype.createResolver(wtype);
		}
		function createReaders(clientSvc, serverSvc) {
			var obj = {};
			clientSvc.messages.forEach(function(c) {
				var n = c.name;
				var s = serverSvc.message(n);
				try {
					if (!s) throw new Error(f("missing server message: %s", n));
					if (s.oneWay !== c.oneWay) throw new Error(f("inconsistent one-way message: %s", n));
					obj[n + "?"] = createReader(s.requestType, c.requestType);
					obj[n + "*"] = createReader(c.errorType, s.errorType);
					obj[n + "!"] = createReader(c.responseType, s.responseType);
				} catch (cause) {
					throw toRpcError("INCOMPATIBLE_PROTOCOL", cause);
				}
			});
			return obj;
		}
		function insertRemoteProtocols(cache, ptcls, svc, isClient) {
			Object.keys(ptcls).forEach(function(hash) {
				var ptcl = ptcls[hash];
				var clientSvc, serverSvc;
				if (isClient) {
					clientSvc = svc;
					serverSvc = Service.forProtocol(ptcl);
				} else {
					clientSvc = Service.forProtocol(ptcl);
					serverSvc = svc;
				}
				cache[hash] = new Adapter(clientSvc, serverSvc, hash, true);
			});
		}
		function getRemoteProtocols(cache, isClient) {
			var ptcls = {};
			Object.keys(cache).forEach(function(hs) {
				var adapter = cache[hs];
				if (adapter._isRemote) ptcls[hs] = (isClient ? adapter._serverSvc : adapter._clientSvc).protocol;
			});
			return ptcls;
		}
		function isError(any) {
			return !!any && Object.prototype.toString.call(any) === "[object Error]";
		}
		function forwardErrors(src, dst) {
			return src.on("error", function(err) {
				dst.emit("error", err, src);
			});
		}
		function toError(msg, cause) {
			var err = new Error(msg);
			err.cause = cause;
			return err;
		}
		function toRpcError(rpcCode, cause) {
			var err = toError(rpcCode.toLowerCase().replace(/_/g, " "), cause);
			err.rpcCode = cause && cause.rpcCode ? cause.rpcCode : rpcCode;
			return err;
		}
		function serializationError(msg, obj, fields) {
			var details = [];
			var i, l, field;
			for (i = 0, l = fields.length; i < l; i++) {
				field = fields[i];
				field.type.isValid(obj[field.name], { errorHook });
			}
			var detailsStr = details.map(function(obj2) {
				return f("%s = %j but expected %s", obj2.path, obj2.value, obj2.type);
			}).join(", ");
			var err = new Error(f("%s (%s)", msg, detailsStr));
			err.details = details;
			return err;
			function errorHook(parts, any, type) {
				var strs = [];
				var i2, l2, part;
				for (i2 = 0, l2 = parts.length; i2 < l2; i2++) {
					part = parts[i2];
					if (isNaN(part)) strs.push("." + part);
					else strs.push("[" + part + "]");
				}
				details.push({
					path: field.name + strs.join(""),
					value: any,
					type
				});
			}
		}
		function normalizedPrefix(scope) {
			return scope ? utils2.getHash(scope).readInt16BE(0) << 32 - PREFIX_LENGTH : 0;
		}
		function matchesPrefix(id, prefix) {
			return (id ^ prefix) >> 32 - PREFIX_LENGTH === 0;
		}
		function isStream(any) {
			return !!(any && any.pipe);
		}
		function getExistingMessage(svc, name) {
			var msg = svc.message(name);
			if (!msg) throw new Error(f("unknown message: %s", name));
			return msg;
		}
		function chainMiddleware(params) {
			var args = [params.wreq, params.wres];
			var cbs = [];
			var cause;
			forward(0);
			function forward(pos) {
				var isDone = false;
				if (pos < params.fns.length) params.fns[pos].apply(params.ctx, args.concat(function(err, cb) {
					if (isDone) {
						params.onError(toError("duplicate forward middleware call", err));
						return;
					}
					isDone = true;
					if (err || params.wres && (params.wres.error !== void 0 || params.wres.response !== void 0)) {
						cause = err;
						backward();
						return;
					}
					if (cb) cbs.push(cb);
					forward(++pos);
				}));
				else params.onTransition.apply(params.ctx, args.concat(function(err) {
					if (isDone) {
						params.onError(toError("duplicate handler call", err));
						return;
					}
					isDone = true;
					cause = err;
					import_browser.default.nextTick(backward);
				}));
			}
			function backward() {
				var cb = cbs.pop();
				if (cb) {
					var isDone = false;
					cb.call(params.ctx, cause, function(err) {
						if (isDone) {
							params.onError(toError("duplicate backward middleware call", err));
							return;
						}
						cause = err;
						isDone = true;
						backward();
					});
				} else params.onCompletion.call(params.ctx, cause);
			}
		}
		module2.exports = {
			Adapter,
			HANDSHAKE_REQUEST_TYPE,
			HANDSHAKE_RESPONSE_TYPE,
			Message,
			Registry,
			Service,
			discoverProtocol,
			streams: {
				FrameDecoder,
				FrameEncoder,
				NettyDecoder,
				NettyEncoder
			}
		};
	} });
	var require_files = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/etc/browser/lib/files.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function createError() {
			return /* @__PURE__ */ new Error("unsupported in the browser");
		}
		function createImportHook() {
			return function(fpath, kind, cb) {
				cb(createError());
			};
		}
		function createSyncImportHook() {
			return function() {
				throw createError();
			};
		}
		module2.exports = {
			createImportHook,
			createSyncImportHook,
			existsSync: function() {
				return false;
			},
			readFileSync: function() {
				throw createError();
			}
		};
	} });
	var require_path_browserify = __commonJS({ "../../../node_modules/.pnpm/path-browserify@1.0.1/node_modules/path-browserify/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function assertPath(path) {
			if (typeof path !== "string") throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
		}
		function normalizeStringPosix(path, allowAboveRoot) {
			var res = "";
			var lastSegmentLength = 0;
			var lastSlash = -1;
			var dots = 0;
			var code;
			for (var i = 0; i <= path.length; ++i) {
				if (i < path.length) code = path.charCodeAt(i);
				else if (code === 47) break;
				else code = 47;
				if (code === 47) {
					if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
						if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
							if (res.length > 2) {
								var lastSlashIndex = res.lastIndexOf("/");
								if (lastSlashIndex !== res.length - 1) {
									if (lastSlashIndex === -1) {
										res = "";
										lastSegmentLength = 0;
									} else {
										res = res.slice(0, lastSlashIndex);
										lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
									}
									lastSlash = i;
									dots = 0;
									continue;
								}
							} else if (res.length === 2 || res.length === 1) {
								res = "";
								lastSegmentLength = 0;
								lastSlash = i;
								dots = 0;
								continue;
							}
						}
						if (allowAboveRoot) {
							if (res.length > 0) res += "/..";
							else res = "..";
							lastSegmentLength = 2;
						}
					} else {
						if (res.length > 0) res += "/" + path.slice(lastSlash + 1, i);
						else res = path.slice(lastSlash + 1, i);
						lastSegmentLength = i - lastSlash - 1;
					}
					lastSlash = i;
					dots = 0;
				} else if (code === 46 && dots !== -1) ++dots;
				else dots = -1;
			}
			return res;
		}
		function _format(sep, pathObject) {
			var dir = pathObject.dir || pathObject.root;
			var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
			if (!dir) return base;
			if (dir === pathObject.root) return dir + base;
			return dir + sep + base;
		}
		var posix = {
			resolve: function resolve() {
				var resolvedPath = "";
				var resolvedAbsolute = false;
				var cwd;
				for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
					var path;
					if (i >= 0) path = arguments[i];
					else {
						if (cwd === void 0) cwd = import_browser.default.cwd();
						path = cwd;
					}
					assertPath(path);
					if (path.length === 0) continue;
					resolvedPath = path + "/" + resolvedPath;
					resolvedAbsolute = path.charCodeAt(0) === 47;
				}
				resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
				if (resolvedAbsolute) if (resolvedPath.length > 0) return "/" + resolvedPath;
				else return "/";
				else if (resolvedPath.length > 0) return resolvedPath;
				else return ".";
			},
			normalize: function normalize(path) {
				assertPath(path);
				if (path.length === 0) return ".";
				var isAbsolute = path.charCodeAt(0) === 47;
				var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
				path = normalizeStringPosix(path, !isAbsolute);
				if (path.length === 0 && !isAbsolute) path = ".";
				if (path.length > 0 && trailingSeparator) path += "/";
				if (isAbsolute) return "/" + path;
				return path;
			},
			isAbsolute: function isAbsolute(path) {
				assertPath(path);
				return path.length > 0 && path.charCodeAt(0) === 47;
			},
			join: function join() {
				if (arguments.length === 0) return ".";
				var joined;
				for (var i = 0; i < arguments.length; ++i) {
					var arg = arguments[i];
					assertPath(arg);
					if (arg.length > 0) if (joined === void 0) joined = arg;
					else joined += "/" + arg;
				}
				if (joined === void 0) return ".";
				return posix.normalize(joined);
			},
			relative: function relative(from, to) {
				assertPath(from);
				assertPath(to);
				if (from === to) return "";
				from = posix.resolve(from);
				to = posix.resolve(to);
				if (from === to) return "";
				var fromStart = 1;
				for (; fromStart < from.length; ++fromStart) if (from.charCodeAt(fromStart) !== 47) break;
				var fromEnd = from.length;
				var fromLen = fromEnd - fromStart;
				var toStart = 1;
				for (; toStart < to.length; ++toStart) if (to.charCodeAt(toStart) !== 47) break;
				var toLen = to.length - toStart;
				var length = fromLen < toLen ? fromLen : toLen;
				var lastCommonSep = -1;
				var i = 0;
				for (; i <= length; ++i) {
					if (i === length) {
						if (toLen > length) {
							if (to.charCodeAt(toStart + i) === 47) return to.slice(toStart + i + 1);
							else if (i === 0) return to.slice(toStart + i);
						} else if (fromLen > length) {
							if (from.charCodeAt(fromStart + i) === 47) lastCommonSep = i;
							else if (i === 0) lastCommonSep = 0;
						}
						break;
					}
					var fromCode = from.charCodeAt(fromStart + i);
					if (fromCode !== to.charCodeAt(toStart + i)) break;
					else if (fromCode === 47) lastCommonSep = i;
				}
				var out = "";
				for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) if (i === fromEnd || from.charCodeAt(i) === 47) if (out.length === 0) out += "..";
				else out += "/..";
				if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
				else {
					toStart += lastCommonSep;
					if (to.charCodeAt(toStart) === 47) ++toStart;
					return to.slice(toStart);
				}
			},
			_makeLong: function _makeLong(path) {
				return path;
			},
			dirname: function dirname(path) {
				assertPath(path);
				if (path.length === 0) return ".";
				var code = path.charCodeAt(0);
				var hasRoot = code === 47;
				var end = -1;
				var matchedSlash = true;
				for (var i = path.length - 1; i >= 1; --i) {
					code = path.charCodeAt(i);
					if (code === 47) {
						if (!matchedSlash) {
							end = i;
							break;
						}
					} else matchedSlash = false;
				}
				if (end === -1) return hasRoot ? "/" : ".";
				if (hasRoot && end === 1) return "//";
				return path.slice(0, end);
			},
			basename: function basename(path, ext) {
				if (ext !== void 0 && typeof ext !== "string") throw new TypeError("\"ext\" argument must be a string");
				assertPath(path);
				var start = 0;
				var end = -1;
				var matchedSlash = true;
				var i;
				if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
					if (ext.length === path.length && ext === path) return "";
					var extIdx = ext.length - 1;
					var firstNonSlashEnd = -1;
					for (i = path.length - 1; i >= 0; --i) {
						var code = path.charCodeAt(i);
						if (code === 47) {
							if (!matchedSlash) {
								start = i + 1;
								break;
							}
						} else {
							if (firstNonSlashEnd === -1) {
								matchedSlash = false;
								firstNonSlashEnd = i + 1;
							}
							if (extIdx >= 0) if (code === ext.charCodeAt(extIdx)) {
								if (--extIdx === -1) end = i;
							} else {
								extIdx = -1;
								end = firstNonSlashEnd;
							}
						}
					}
					if (start === end) end = firstNonSlashEnd;
					else if (end === -1) end = path.length;
					return path.slice(start, end);
				} else {
					for (i = path.length - 1; i >= 0; --i) if (path.charCodeAt(i) === 47) {
						if (!matchedSlash) {
							start = i + 1;
							break;
						}
					} else if (end === -1) {
						matchedSlash = false;
						end = i + 1;
					}
					if (end === -1) return "";
					return path.slice(start, end);
				}
			},
			extname: function extname(path) {
				assertPath(path);
				var startDot = -1;
				var startPart = 0;
				var end = -1;
				var matchedSlash = true;
				var preDotState = 0;
				for (var i = path.length - 1; i >= 0; --i) {
					var code = path.charCodeAt(i);
					if (code === 47) {
						if (!matchedSlash) {
							startPart = i + 1;
							break;
						}
						continue;
					}
					if (end === -1) {
						matchedSlash = false;
						end = i + 1;
					}
					if (code === 46) {
						if (startDot === -1) startDot = i;
						else if (preDotState !== 1) preDotState = 1;
					} else if (startDot !== -1) preDotState = -1;
				}
				if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) return "";
				return path.slice(startDot, end);
			},
			format: function format(pathObject) {
				if (pathObject === null || typeof pathObject !== "object") throw new TypeError("The \"pathObject\" argument must be of type Object. Received type " + typeof pathObject);
				return _format("/", pathObject);
			},
			parse: function parse(path) {
				assertPath(path);
				var ret = {
					root: "",
					dir: "",
					base: "",
					ext: "",
					name: ""
				};
				if (path.length === 0) return ret;
				var code = path.charCodeAt(0);
				var isAbsolute = code === 47;
				var start;
				if (isAbsolute) {
					ret.root = "/";
					start = 1;
				} else start = 0;
				var startDot = -1;
				var startPart = 0;
				var end = -1;
				var matchedSlash = true;
				var i = path.length - 1;
				var preDotState = 0;
				for (; i >= start; --i) {
					code = path.charCodeAt(i);
					if (code === 47) {
						if (!matchedSlash) {
							startPart = i + 1;
							break;
						}
						continue;
					}
					if (end === -1) {
						matchedSlash = false;
						end = i + 1;
					}
					if (code === 46) {
						if (startDot === -1) startDot = i;
						else if (preDotState !== 1) preDotState = 1;
					} else if (startDot !== -1) preDotState = -1;
				}
				if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
					if (end !== -1) if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);
					else ret.base = ret.name = path.slice(startPart, end);
				} else {
					if (startPart === 0 && isAbsolute) {
						ret.name = path.slice(1, startDot);
						ret.base = path.slice(1, end);
					} else {
						ret.name = path.slice(startPart, startDot);
						ret.base = path.slice(startPart, end);
					}
					ret.ext = path.slice(startDot, end);
				}
				if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
				else if (isAbsolute) ret.dir = "/";
				return ret;
			},
			sep: "/",
			delimiter: ":",
			win32: null,
			posix: null
		};
		posix.posix = posix;
		module2.exports = posix;
	} });
	var require_specs = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/lib/specs.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var files = require_files();
		var utils2 = require_utils();
		var path = require_path_browserify();
		var f = require_util().format;
		var TYPE_REFS = {
			date: {
				type: "int",
				logicalType: "date"
			},
			decimal: {
				type: "bytes",
				logicalType: "decimal"
			},
			time_ms: {
				type: "long",
				logicalType: "time-millis"
			},
			timestamp_ms: {
				type: "long",
				logicalType: "timestamp-millis"
			}
		};
		function assembleProtocol(fpath, opts, cb) {
			if (!cb && typeof opts == "function") {
				cb = opts;
				opts = void 0;
			}
			opts = opts || {};
			if (!opts.importHook) opts.importHook = files.createImportHook();
			importFile(fpath, function(err, protocol) {
				if (err) {
					cb(err);
					return;
				}
				if (!protocol) {
					cb(/* @__PURE__ */ new Error("empty root import"));
					return;
				}
				var schemas = protocol.types;
				if (schemas) {
					var namespace = protocolNamespace(protocol) || "";
					schemas.forEach(function(schema) {
						if (schema.namespace === namespace) delete schema.namespace;
					});
				}
				cb(null, protocol);
			});
			function importFile(fpath2, cb2) {
				opts.importHook(fpath2, "idl", function(err, str) {
					if (err) {
						cb2(err);
						return;
					}
					if (str === void 0) {
						cb2();
						return;
					}
					try {
						var obj = new Reader(str, opts)._readProtocol(str, opts);
					} catch (err2) {
						err2.path = fpath2;
						cb2(err2);
						return;
					}
					fetchImports(obj.protocol, obj.imports, path.dirname(fpath2), cb2);
				});
			}
			function fetchImports(protocol, imports, dpath, cb2) {
				var importedProtocols = [];
				next();
				function next() {
					var info = imports.shift();
					if (!info) {
						importedProtocols.reverse();
						try {
							importedProtocols.forEach(function(imported) {
								mergeImport(protocol, imported);
							});
						} catch (err) {
							cb2(err);
							return;
						}
						cb2(null, protocol);
						return;
					}
					var importPath = path.join(dpath, info.name);
					if (info.kind === "idl") importFile(importPath, function(err, imported) {
						if (err) {
							cb2(err);
							return;
						}
						if (imported) importedProtocols.push(imported);
						next();
					});
					else opts.importHook(importPath, info.kind, function(err, str) {
						if (err) {
							cb2(err);
							return;
						}
						switch (info.kind) {
							case "protocol":
							case "schema":
								if (str === void 0) {
									next();
									return;
								}
								try {
									var obj = JSON.parse(str);
								} catch (err2) {
									err2.path = importPath;
									cb2(err2);
									return;
								}
								var imported = info.kind === "schema" ? { types: [obj] } : obj;
								importedProtocols.push(imported);
								next();
								return;
							default: cb2(new Error(f("invalid import kind: %s", info.kind)));
						}
					});
				}
			}
			function mergeImport(protocol, imported) {
				var schemas = imported.types || [];
				schemas.reverse();
				schemas.forEach(function(schema) {
					if (!protocol.types) protocol.types = [];
					if (schema.namespace === void 0) schema.namespace = protocolNamespace(imported) || "";
					protocol.types.unshift(schema);
				});
				Object.keys(imported.messages || {}).forEach(function(name) {
					if (!protocol.messages) protocol.messages = {};
					if (protocol.messages[name]) throw new Error(f("duplicate message: %s", name));
					protocol.messages[name] = imported.messages[name];
				});
			}
		}
		function read(str) {
			var schema;
			if (typeof str == "string" && ~str.indexOf(path.sep) && files.existsSync(str)) {
				var contents = files.readFileSync(str, { encoding: "utf8" });
				try {
					return JSON.parse(contents);
				} catch (err) {
					assembleProtocol(str, { importHook: files.createSyncImportHook() }, function(err2, protocolSchema) {
						schema = err2 ? contents : protocolSchema;
					});
				}
			} else schema = str;
			if (typeof schema != "string" || schema === "null") return schema;
			try {
				return JSON.parse(schema);
			} catch (err) {
				try {
					return Reader.readProtocol(schema);
				} catch (err2) {
					try {
						return Reader.readSchema(schema);
					} catch (err3) {
						return schema;
					}
				}
			}
		}
		function Reader(str, opts) {
			opts = opts || {};
			this._tk = new Tokenizer(str);
			this._ackVoidMessages = !!opts.ackVoidMessages;
			this._implicitTags = !opts.delimitedCollections;
			this._typeRefs = opts.typeRefs || TYPE_REFS;
		}
		Reader.readProtocol = function(str, opts) {
			var protocol = new Reader(str, opts)._readProtocol();
			if (protocol.imports.length) throw new Error("unresolvable import");
			return protocol.protocol;
		};
		Reader.readSchema = function(str, opts) {
			var reader = new Reader(str, opts);
			var doc = reader._readJavadoc();
			var schema = reader._readType(doc === void 0 ? {} : { doc }, true);
			reader._tk.next({ id: "(eof)" });
			return schema;
		};
		Reader.prototype._readProtocol = function() {
			var tk = this._tk;
			var imports = [];
			var types = [];
			var messages = {};
			var pos;
			this._readImports(imports);
			var protocolSchema = {};
			var protocolJavadoc = this._readJavadoc();
			if (protocolJavadoc !== void 0) protocolSchema.doc = protocolJavadoc;
			this._readAnnotations(protocolSchema);
			tk.next({ val: "protocol" });
			if (!tk.next({
				val: "{",
				silent: true
			})) {
				protocolSchema.protocol = tk.next({ id: "name" }).val;
				tk.next({ val: "{" });
			}
			while (!tk.next({
				val: "}",
				silent: true
			})) if (!this._readImports(imports)) {
				var javadoc = this._readJavadoc();
				var typeSchema = this._readType({}, true);
				var numImports = this._readImports(imports, true);
				var message = void 0;
				pos = tk.pos;
				if (!numImports && (message = this._readMessage(typeSchema))) {
					if (javadoc !== void 0 && message.schema.doc === void 0) message.schema.doc = javadoc;
					var oneWay = false;
					if (message.schema.response === "void" || message.schema.response.type === "void") {
						oneWay = !this._ackVoidMessages && !message.schema.errors;
						if (message.schema.response === "void") message.schema.response = "null";
						else message.schema.response.type = "null";
					}
					if (oneWay) message.schema["one-way"] = true;
					if (messages[message.name]) throw new Error(f("duplicate message: %s", message.name));
					messages[message.name] = message.schema;
				} else {
					if (javadoc) {
						if (typeof typeSchema == "string") typeSchema = {
							doc: javadoc,
							type: typeSchema
						};
						else if (typeSchema.doc === void 0) typeSchema.doc = javadoc;
					}
					types.push(typeSchema);
					tk.pos = pos;
					tk.next({
						val: ";",
						silent: true
					});
				}
				javadoc = void 0;
			}
			tk.next({ id: "(eof)" });
			if (types.length) protocolSchema.types = types;
			if (Object.keys(messages).length) protocolSchema.messages = messages;
			return {
				protocol: protocolSchema,
				imports
			};
		};
		Reader.prototype._readAnnotations = function(schema) {
			var tk = this._tk;
			while (tk.next({
				val: "@",
				silent: true
			})) {
				var parts = [];
				while (!tk.next({
					val: "(",
					silent: true
				})) parts.push(tk.next().val);
				schema[parts.join("")] = tk.next({ id: "json" }).val;
				tk.next({ val: ")" });
			}
		};
		Reader.prototype._readMessage = function(responseSchema) {
			var tk = this._tk;
			var schema = {
				request: [],
				response: responseSchema
			};
			this._readAnnotations(schema);
			var name = tk.next().val;
			if (tk.next().val !== "(") return;
			if (!tk.next({
				val: ")",
				silent: true
			})) do
				schema.request.push(this._readField());
			while (!tk.next({
				val: ")",
				silent: true
			}) && tk.next({ val: "," }));
			var token = tk.next();
			switch (token.val) {
				case "throws":
					schema.errors = [];
					do
						schema.errors.push(this._readType());
					while (!tk.next({
						val: ";",
						silent: true
					}) && tk.next({ val: "," }));
					break;
				case "oneway":
					schema["one-way"] = true;
					tk.next({ val: ";" });
					break;
				case ";": break;
				default: throw tk.error("invalid message suffix", token);
			}
			return {
				name,
				schema
			};
		};
		Reader.prototype._readJavadoc = function() {
			var token = this._tk.next({
				id: "javadoc",
				emitJavadoc: true,
				silent: true
			});
			if (token) return token.val;
		};
		Reader.prototype._readField = function() {
			var tk = this._tk;
			var javadoc = this._readJavadoc();
			var schema = { type: this._readType() };
			if (javadoc !== void 0 && schema.doc === void 0) schema.doc = javadoc;
			this._readAnnotations(schema);
			schema.name = tk.next({ id: "name" }).val;
			if (tk.next({
				val: "=",
				silent: true
			})) schema["default"] = tk.next({ id: "json" }).val;
			return schema;
		};
		Reader.prototype._readType = function(schema, top) {
			schema = schema || {};
			this._readAnnotations(schema);
			schema.type = this._tk.next({ id: "name" }).val;
			switch (schema.type) {
				case "record":
				case "error": return this._readRecord(schema);
				case "fixed": return this._readFixed(schema);
				case "enum": return this._readEnum(schema, top);
				case "map": return this._readMap(schema);
				case "array": return this._readArray(schema);
				case "union":
					if (Object.keys(schema).length > 1) throw new Error("union annotations are not supported");
					return this._readUnion();
				default:
					var ref = this._typeRefs[schema.type];
					if (ref) {
						delete schema.type;
						utils2.copyOwnProperties(ref, schema);
					}
					return Object.keys(schema).length > 1 ? schema : schema.type;
			}
		};
		Reader.prototype._readFixed = function(schema) {
			var tk = this._tk;
			if (!tk.next({
				val: "(",
				silent: true
			})) {
				schema.name = tk.next({ id: "name" }).val;
				tk.next({ val: "(" });
			}
			schema.size = parseInt(tk.next({ id: "number" }).val);
			tk.next({ val: ")" });
			return schema;
		};
		Reader.prototype._readMap = function(schema) {
			var tk = this._tk;
			var silent = this._implicitTags;
			var implicitTags = tk.next({
				val: "<",
				silent
			}) === void 0;
			schema.values = this._readType();
			tk.next({
				val: ">",
				silent: implicitTags
			});
			return schema;
		};
		Reader.prototype._readArray = function(schema) {
			var tk = this._tk;
			var silent = this._implicitTags;
			var implicitTags = tk.next({
				val: "<",
				silent
			}) === void 0;
			schema.items = this._readType();
			tk.next({
				val: ">",
				silent: implicitTags
			});
			return schema;
		};
		Reader.prototype._readEnum = function(schema, top) {
			var tk = this._tk;
			if (!tk.next({
				val: "{",
				silent: true
			})) {
				schema.name = tk.next({ id: "name" }).val;
				tk.next({ val: "{" });
			}
			schema.symbols = [];
			do
				schema.symbols.push(tk.next().val);
			while (!tk.next({
				val: "}",
				silent: true
			}) && tk.next({ val: "," }));
			if (top && tk.next({
				val: "=",
				silent: true
			})) {
				schema.default = tk.next().val;
				tk.next({ val: ";" });
			}
			return schema;
		};
		Reader.prototype._readUnion = function() {
			var tk = this._tk;
			var arr = [];
			tk.next({ val: "{" });
			do
				arr.push(this._readType());
			while (!tk.next({
				val: "}",
				silent: true
			}) && tk.next({ val: "," }));
			return arr;
		};
		Reader.prototype._readRecord = function(schema) {
			var tk = this._tk;
			if (!tk.next({
				val: "{",
				silent: true
			})) {
				schema.name = tk.next({ id: "name" }).val;
				tk.next({ val: "{" });
			}
			schema.fields = [];
			while (!tk.next({
				val: "}",
				silent: true
			})) {
				schema.fields.push(this._readField());
				tk.next({ val: ";" });
			}
			return schema;
		};
		Reader.prototype._readImports = function(imports, maybeMessage) {
			var tk = this._tk;
			var numImports = 0;
			var pos = tk.pos;
			while (tk.next({
				val: "import",
				silent: true
			})) {
				if (!numImports && maybeMessage && tk.next({
					val: "(",
					silent: true
				})) {
					tk.pos = pos;
					return;
				}
				var kind = tk.next({ id: "name" }).val;
				var fname = JSON.parse(tk.next({ id: "string" }).val);
				tk.next({ val: ";" });
				imports.push({
					kind,
					name: fname
				});
				numImports++;
			}
			return numImports;
		};
		function Tokenizer(str) {
			this._str = str;
			this.pos = 0;
		}
		Tokenizer.prototype.next = function(opts) {
			var token = {
				pos: this.pos,
				id: void 0,
				val: void 0
			};
			var javadoc = this._skip(opts && opts.emitJavadoc);
			if (typeof javadoc == "string") {
				token.id = "javadoc";
				token.val = javadoc;
			} else {
				var pos = this.pos;
				var str = this._str;
				var c = str.charAt(pos);
				if (!c) token.id = "(eof)";
				else {
					if (opts && opts.id === "json") {
						token.id = "json";
						this.pos = this._endOfJson();
					} else if (c === "\"") {
						token.id = "string";
						this.pos = this._endOfString();
					} else if (/[0-9]/.test(c)) {
						token.id = "number";
						this.pos = this._endOf(/[0-9]/);
					} else if (/[`A-Za-z_.]/.test(c)) {
						token.id = "name";
						this.pos = this._endOf(/[`A-Za-z0-9_.]/);
					} else {
						token.id = "operator";
						this.pos = pos + 1;
					}
					token.val = str.slice(pos, this.pos);
					if (token.id === "json") try {
						token.val = JSON.parse(token.val);
					} catch (err2) {
						throw this.error("invalid JSON", token);
					}
					else if (token.id === "name") token.val = token.val.replace(/`/g, "");
				}
			}
			var err;
			if (opts && opts.id && opts.id !== token.id) err = this.error(f("expected ID %s", opts.id), token);
			else if (opts && opts.val && opts.val !== token.val) err = this.error(f("expected value %s", opts.val), token);
			if (!err) return token;
			else if (opts && opts.silent) {
				this.pos = token.pos;
				return;
			} else throw err;
		};
		Tokenizer.prototype.error = function(reason, context) {
			var isToken = typeof context != "number";
			var pos = isToken ? context.pos : context;
			var str = this._str;
			var lineNum = 1;
			var lineStart = 0;
			var i;
			for (i = 0; i < pos; i++) if (str.charAt(i) === "\n") {
				lineNum++;
				lineStart = i;
			}
			var msg = isToken ? f("invalid token %j: %s", context, reason) : reason;
			var err = new Error(msg);
			err.token = isToken ? context : void 0;
			err.lineNum = lineNum;
			err.colNum = pos - lineStart;
			return err;
		};
		Tokenizer.prototype._skip = function(emitJavadoc) {
			var str = this._str;
			var isJavadoc = false;
			var pos, c;
			while ((c = str.charAt(this.pos)) && /\s/.test(c)) this.pos++;
			pos = this.pos;
			if (c === "/") switch (str.charAt(this.pos + 1)) {
				case "/":
					this.pos += 2;
					while ((c = str.charAt(this.pos)) && c !== "\n") this.pos++;
					return this._skip(emitJavadoc);
				case "*":
					this.pos += 2;
					if (str.charAt(this.pos) === "*") isJavadoc = true;
					while (c = str.charAt(this.pos++)) if (c === "*" && str.charAt(this.pos) === "/") {
						this.pos++;
						if (isJavadoc && emitJavadoc) return extractJavadoc(str.slice(pos + 3, this.pos - 2));
						return this._skip(emitJavadoc);
					}
					throw this.error("unterminated comment", pos);
			}
		};
		Tokenizer.prototype._endOf = function(pat) {
			var pos = this.pos;
			var str = this._str;
			while (pat.test(str.charAt(pos))) pos++;
			return pos;
		};
		Tokenizer.prototype._endOfString = function() {
			var pos = this.pos + 1;
			var str = this._str;
			var c;
			while (c = str.charAt(pos)) {
				if (c === "\"") return pos + 1;
				if (c === "\\") pos += 2;
				else pos++;
			}
			throw this.error("unterminated string", pos - 1);
		};
		Tokenizer.prototype._endOfJson = function() {
			var pos = utils2.jsonEnd(this._str, this.pos);
			if (pos < 0) throw this.error("invalid JSON", pos);
			return pos;
		};
		function extractJavadoc(str) {
			var lines = str.replace(/^[ \t]+|[ \t]+$/g, "").split("\n").map(function(line, i) {
				return i ? line.replace(/^\s*\*\s?/, "") : line;
			});
			while (lines.length && !lines[0]) lines.shift();
			while (lines.length && !lines[lines.length - 1]) lines.pop();
			return lines.join("\n");
		}
		function protocolNamespace(protocol) {
			if (protocol.namespace) return protocol.namespace;
			var match = /^(.*)\.[^.]+$/.exec(protocol.protocol);
			return match ? match[1] : void 0;
		}
		module2.exports = {
			Tokenizer,
			assembleProtocol,
			read,
			readProtocol: Reader.readProtocol,
			readSchema: Reader.readSchema
		};
	} });
	var require_avsc_services = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/etc/browser/avsc-services.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var avroTypes = require_avsc_types();
		var services = require_services();
		var specs = require_specs();
		var utils2 = require_utils();
		function parse(any, opts) {
			var schemaOrProtocol = specs.read(any);
			return schemaOrProtocol.protocol ? services.Service.forProtocol(schemaOrProtocol, opts) : avroTypes.Type.forSchema(schemaOrProtocol, opts);
		}
		module2.exports = {
			Service: services.Service,
			assembleProtocol: specs.assembleProtocol,
			discoverProtocol: services.discoverProtocol,
			parse,
			readProtocol: specs.readProtocol,
			readSchema: specs.readSchema
		};
		utils2.copyOwnProperties(avroTypes, module2.exports);
	} });
	var require_errors = __commonJS({ "../../../node_modules/.pnpm/assert@2.1.0/node_modules/assert/build/internal/errors.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function _typeof(o) {
			"@babel/helpers - typeof";
			return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
				return typeof o2;
			} : function(o2) {
				return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
			}, _typeof(o);
		}
		function _defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
			}
		}
		function _createClass(Constructor, protoProps, staticProps) {
			if (protoProps) _defineProperties(Constructor.prototype, protoProps);
			if (staticProps) _defineProperties(Constructor, staticProps);
			Object.defineProperty(Constructor, "prototype", { writable: false });
			return Constructor;
		}
		function _toPropertyKey(arg) {
			var key = _toPrimitive(arg, "string");
			return _typeof(key) === "symbol" ? key : String(key);
		}
		function _toPrimitive(input, hint) {
			if (_typeof(input) !== "object" || input === null) return input;
			var prim = input[Symbol.toPrimitive];
			if (prim !== void 0) {
				var res = prim.call(input, hint || "default");
				if (_typeof(res) !== "object") return res;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return (hint === "string" ? String : Number)(input);
		}
		function _classCallCheck(instance, Constructor) {
			if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
		}
		function _inherits(subClass, superClass) {
			if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function");
			subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
				value: subClass,
				writable: true,
				configurable: true
			} });
			Object.defineProperty(subClass, "prototype", { writable: false });
			if (superClass) _setPrototypeOf(subClass, superClass);
		}
		function _setPrototypeOf(o, p) {
			_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
				o2.__proto__ = p2;
				return o2;
			};
			return _setPrototypeOf(o, p);
		}
		function _createSuper(Derived) {
			var hasNativeReflectConstruct = _isNativeReflectConstruct();
			return function _createSuperInternal() {
				var Super = _getPrototypeOf(Derived), result;
				if (hasNativeReflectConstruct) {
					var NewTarget = _getPrototypeOf(this).constructor;
					result = Reflect.construct(Super, arguments, NewTarget);
				} else result = Super.apply(this, arguments);
				return _possibleConstructorReturn(this, result);
			};
		}
		function _possibleConstructorReturn(self2, call) {
			if (call && (_typeof(call) === "object" || typeof call === "function")) return call;
			else if (call !== void 0) throw new TypeError("Derived constructors may only return object or undefined");
			return _assertThisInitialized(self2);
		}
		function _assertThisInitialized(self2) {
			if (self2 === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
			return self2;
		}
		function _isNativeReflectConstruct() {
			if (typeof Reflect === "undefined" || !Reflect.construct) return false;
			if (Reflect.construct.sham) return false;
			if (typeof Proxy === "function") return true;
			try {
				Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
				return true;
			} catch (e) {
				return false;
			}
		}
		function _getPrototypeOf(o) {
			_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
				return o2.__proto__ || Object.getPrototypeOf(o2);
			};
			return _getPrototypeOf(o);
		}
		var codes = {};
		var assert;
		var util2;
		function createErrorType(code, message, Base) {
			if (!Base) Base = Error;
			function getMessage(arg1, arg2, arg3) {
				if (typeof message === "string") return message;
				else return message(arg1, arg2, arg3);
			}
			codes[code] = /* @__PURE__ */ (function(_Base) {
				_inherits(NodeError2, _Base);
				var _super = _createSuper(NodeError2);
				function NodeError2(arg1, arg2, arg3) {
					var _this;
					_classCallCheck(this, NodeError2);
					_this = _super.call(this, getMessage(arg1, arg2, arg3));
					_this.code = code;
					return _this;
				}
				return _createClass(NodeError2);
			})(Base);
		}
		function oneOf(expected, thing) {
			if (Array.isArray(expected)) {
				var len = expected.length;
				expected = expected.map(function(i) {
					return String(i);
				});
				if (len > 2) return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(", "), ", or ") + expected[len - 1];
				else if (len === 2) return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
				else return "of ".concat(thing, " ").concat(expected[0]);
			} else return "of ".concat(thing, " ").concat(String(expected));
		}
		function startsWith(str, search, pos) {
			return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
		}
		function endsWith(str, search, this_len) {
			if (this_len === void 0 || this_len > str.length) this_len = str.length;
			return str.substring(this_len - search.length, this_len) === search;
		}
		function includes(str, search, start) {
			if (typeof start !== "number") start = 0;
			if (start + search.length > str.length) return false;
			else return str.indexOf(search, start) !== -1;
		}
		createErrorType("ERR_AMBIGUOUS_ARGUMENT", "The \"%s\" argument is ambiguous. %s", TypeError);
		createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
			if (assert === void 0) assert = require_assert();
			assert(typeof name === "string", "'name' must be a string");
			var determiner;
			if (typeof expected === "string" && startsWith(expected, "not ")) {
				determiner = "must not be";
				expected = expected.replace(/^not /, "");
			} else determiner = "must be";
			var msg;
			if (endsWith(name, " argument")) msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
			else {
				var type = includes(name, ".") ? "property" : "argument";
				msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
			}
			msg += ". Received type ".concat(_typeof(actual));
			return msg;
		}, TypeError);
		createErrorType("ERR_INVALID_ARG_VALUE", function(name, value) {
			var reason = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "is invalid";
			if (util2 === void 0) util2 = require_util();
			var inspected = util2.inspect(value);
			if (inspected.length > 128) inspected = "".concat(inspected.slice(0, 128), "...");
			return "The argument '".concat(name, "' ").concat(reason, ". Received ").concat(inspected);
		}, TypeError, RangeError);
		createErrorType("ERR_INVALID_RETURN_VALUE", function(input, name, value) {
			var type;
			if (value && value.constructor && value.constructor.name) type = "instance of ".concat(value.constructor.name);
			else type = "type ".concat(_typeof(value));
			return "Expected ".concat(input, " to be returned from the \"").concat(name, "\"") + " function but got ".concat(type, ".");
		}, TypeError);
		createErrorType("ERR_MISSING_ARGS", function() {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			if (assert === void 0) assert = require_assert();
			assert(args.length > 0, "At least one arg needs to be specified");
			var msg = "The ";
			var len = args.length;
			args = args.map(function(a) {
				return "\"".concat(a, "\"");
			});
			switch (len) {
				case 1:
					msg += "".concat(args[0], " argument");
					break;
				case 2:
					msg += "".concat(args[0], " and ").concat(args[1], " arguments");
					break;
				default:
					msg += args.slice(0, len - 1).join(", ");
					msg += ", and ".concat(args[len - 1], " arguments");
			}
			return "".concat(msg, " must be specified");
		}, TypeError);
		module2.exports.codes = codes;
	} });
	var require_assertion_error = __commonJS({ "../../../node_modules/.pnpm/assert@2.1.0/node_modules/assert/build/internal/assert/assertion_error.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function ownKeys(e, r) {
			var t = Object.keys(e);
			if (Object.getOwnPropertySymbols) {
				var o = Object.getOwnPropertySymbols(e);
				r && (o = o.filter(function(r2) {
					return Object.getOwnPropertyDescriptor(e, r2).enumerable;
				})), t.push.apply(t, o);
			}
			return t;
		}
		function _objectSpread(e) {
			for (var r = 1; r < arguments.length; r++) {
				var t = null != arguments[r] ? arguments[r] : {};
				r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
					_defineProperty(e, r2, t[r2]);
				}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
					Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
				});
			}
			return e;
		}
		function _defineProperty(obj, key, value) {
			key = _toPropertyKey(key);
			if (key in obj) Object.defineProperty(obj, key, {
				value,
				enumerable: true,
				configurable: true,
				writable: true
			});
			else obj[key] = value;
			return obj;
		}
		function _classCallCheck(instance, Constructor) {
			if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
		}
		function _defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
			}
		}
		function _createClass(Constructor, protoProps, staticProps) {
			if (protoProps) _defineProperties(Constructor.prototype, protoProps);
			if (staticProps) _defineProperties(Constructor, staticProps);
			Object.defineProperty(Constructor, "prototype", { writable: false });
			return Constructor;
		}
		function _toPropertyKey(arg) {
			var key = _toPrimitive(arg, "string");
			return _typeof(key) === "symbol" ? key : String(key);
		}
		function _toPrimitive(input, hint) {
			if (_typeof(input) !== "object" || input === null) return input;
			var prim = input[Symbol.toPrimitive];
			if (prim !== void 0) {
				var res = prim.call(input, hint || "default");
				if (_typeof(res) !== "object") return res;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return (hint === "string" ? String : Number)(input);
		}
		function _inherits(subClass, superClass) {
			if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function");
			subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
				value: subClass,
				writable: true,
				configurable: true
			} });
			Object.defineProperty(subClass, "prototype", { writable: false });
			if (superClass) _setPrototypeOf(subClass, superClass);
		}
		function _createSuper(Derived) {
			var hasNativeReflectConstruct = _isNativeReflectConstruct();
			return function _createSuperInternal() {
				var Super = _getPrototypeOf(Derived), result;
				if (hasNativeReflectConstruct) {
					var NewTarget = _getPrototypeOf(this).constructor;
					result = Reflect.construct(Super, arguments, NewTarget);
				} else result = Super.apply(this, arguments);
				return _possibleConstructorReturn(this, result);
			};
		}
		function _possibleConstructorReturn(self2, call) {
			if (call && (_typeof(call) === "object" || typeof call === "function")) return call;
			else if (call !== void 0) throw new TypeError("Derived constructors may only return object or undefined");
			return _assertThisInitialized(self2);
		}
		function _assertThisInitialized(self2) {
			if (self2 === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
			return self2;
		}
		function _wrapNativeSuper(Class) {
			var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
			_wrapNativeSuper = function _wrapNativeSuper2(Class2) {
				if (Class2 === null || !_isNativeFunction(Class2)) return Class2;
				if (typeof Class2 !== "function") throw new TypeError("Super expression must either be null or a function");
				if (typeof _cache !== "undefined") {
					if (_cache.has(Class2)) return _cache.get(Class2);
					_cache.set(Class2, Wrapper);
				}
				function Wrapper() {
					return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
				}
				Wrapper.prototype = Object.create(Class2.prototype, { constructor: {
					value: Wrapper,
					enumerable: false,
					writable: true,
					configurable: true
				} });
				return _setPrototypeOf(Wrapper, Class2);
			};
			return _wrapNativeSuper(Class);
		}
		function _construct(Parent, args, Class) {
			if (_isNativeReflectConstruct()) _construct = Reflect.construct.bind();
			else _construct = function _construct2(Parent2, args2, Class2) {
				var a = [null];
				a.push.apply(a, args2);
				var instance = new (Function.bind.apply(Parent2, a))();
				if (Class2) _setPrototypeOf(instance, Class2.prototype);
				return instance;
			};
			return _construct.apply(null, arguments);
		}
		function _isNativeReflectConstruct() {
			if (typeof Reflect === "undefined" || !Reflect.construct) return false;
			if (Reflect.construct.sham) return false;
			if (typeof Proxy === "function") return true;
			try {
				Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
				return true;
			} catch (e) {
				return false;
			}
		}
		function _isNativeFunction(fn) {
			return Function.toString.call(fn).indexOf("[native code]") !== -1;
		}
		function _setPrototypeOf(o, p) {
			_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
				o2.__proto__ = p2;
				return o2;
			};
			return _setPrototypeOf(o, p);
		}
		function _getPrototypeOf(o) {
			_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
				return o2.__proto__ || Object.getPrototypeOf(o2);
			};
			return _getPrototypeOf(o);
		}
		function _typeof(o) {
			"@babel/helpers - typeof";
			return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
				return typeof o2;
			} : function(o2) {
				return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
			}, _typeof(o);
		}
		var inspect = require_util().inspect;
		var ERR_INVALID_ARG_TYPE = require_errors().codes.ERR_INVALID_ARG_TYPE;
		function endsWith(str, search, this_len) {
			if (this_len === void 0 || this_len > str.length) this_len = str.length;
			return str.substring(this_len - search.length, this_len) === search;
		}
		function repeat(str, count) {
			count = Math.floor(count);
			if (str.length == 0 || count == 0) return "";
			var maxCount = str.length * count;
			count = Math.floor(Math.log(count) / Math.log(2));
			while (count) {
				str += str;
				count--;
			}
			str += str.substring(0, maxCount - str.length);
			return str;
		}
		var blue = "";
		var green = "";
		var red = "";
		var white = "";
		var kReadableOperator = {
			deepStrictEqual: "Expected values to be strictly deep-equal:",
			strictEqual: "Expected values to be strictly equal:",
			strictEqualObject: "Expected \"actual\" to be reference-equal to \"expected\":",
			deepEqual: "Expected values to be loosely deep-equal:",
			equal: "Expected values to be loosely equal:",
			notDeepStrictEqual: "Expected \"actual\" not to be strictly deep-equal to:",
			notStrictEqual: "Expected \"actual\" to be strictly unequal to:",
			notStrictEqualObject: "Expected \"actual\" not to be reference-equal to \"expected\":",
			notDeepEqual: "Expected \"actual\" not to be loosely deep-equal to:",
			notEqual: "Expected \"actual\" to be loosely unequal to:",
			notIdentical: "Values identical but not reference-equal:"
		};
		var kMaxShortLength = 10;
		function copyError(source) {
			var keys = Object.keys(source);
			var target = Object.create(Object.getPrototypeOf(source));
			keys.forEach(function(key) {
				target[key] = source[key];
			});
			Object.defineProperty(target, "message", { value: source.message });
			return target;
		}
		function inspectValue(val) {
			return inspect(val, {
				compact: false,
				customInspect: false,
				depth: 1e3,
				maxArrayLength: Infinity,
				showHidden: false,
				breakLength: Infinity,
				showProxy: false,
				sorted: true,
				getters: true
			});
		}
		function createErrDiff(actual, expected, operator) {
			var other = "";
			var res = "";
			var lastPos = 0;
			var end = "";
			var skipped = false;
			var actualInspected = inspectValue(actual);
			var actualLines = actualInspected.split("\n");
			var expectedLines = inspectValue(expected).split("\n");
			var i = 0;
			var indicator = "";
			if (operator === "strictEqual" && _typeof(actual) === "object" && _typeof(expected) === "object" && actual !== null && expected !== null) operator = "strictEqualObject";
			if (actualLines.length === 1 && expectedLines.length === 1 && actualLines[0] !== expectedLines[0]) {
				var inputLength = actualLines[0].length + expectedLines[0].length;
				if (inputLength <= kMaxShortLength) {
					if ((_typeof(actual) !== "object" || actual === null) && (_typeof(expected) !== "object" || expected === null) && (actual !== 0 || expected !== 0)) return "".concat(kReadableOperator[operator], "\n\n") + "".concat(actualLines[0], " !== ").concat(expectedLines[0], "\n");
				} else if (operator !== "strictEqualObject") {
					if (inputLength < (import_browser.default.stderr && import_browser.default.stderr.isTTY ? import_browser.default.stderr.columns : 80)) {
						while (actualLines[0][i] === expectedLines[0][i]) i++;
						if (i > 2) {
							indicator = "\n  ".concat(repeat(" ", i), "^");
							i = 0;
						}
					}
				}
			}
			var a = actualLines[actualLines.length - 1];
			var b = expectedLines[expectedLines.length - 1];
			while (a === b) {
				if (i++ < 2) end = "\n  ".concat(a).concat(end);
				else other = a;
				actualLines.pop();
				expectedLines.pop();
				if (actualLines.length === 0 || expectedLines.length === 0) break;
				a = actualLines[actualLines.length - 1];
				b = expectedLines[expectedLines.length - 1];
			}
			var maxLines = Math.max(actualLines.length, expectedLines.length);
			if (maxLines === 0) {
				var _actualLines = actualInspected.split("\n");
				if (_actualLines.length > 30) {
					_actualLines[26] = "".concat(blue, "...").concat(white);
					while (_actualLines.length > 27) _actualLines.pop();
				}
				return "".concat(kReadableOperator.notIdentical, "\n\n").concat(_actualLines.join("\n"), "\n");
			}
			if (i > 3) {
				end = "\n".concat(blue, "...").concat(white).concat(end);
				skipped = true;
			}
			if (other !== "") {
				end = "\n  ".concat(other).concat(end);
				other = "";
			}
			var printedLines = 0;
			var msg = kReadableOperator[operator] + "\n".concat(green, "+ actual").concat(white, " ").concat(red, "- expected").concat(white);
			var skippedMsg = " ".concat(blue, "...").concat(white, " Lines skipped");
			for (i = 0; i < maxLines; i++) {
				var cur = i - lastPos;
				if (actualLines.length < i + 1) {
					if (cur > 1 && i > 2) {
						if (cur > 4) {
							res += "\n".concat(blue, "...").concat(white);
							skipped = true;
						} else if (cur > 3) {
							res += "\n  ".concat(expectedLines[i - 2]);
							printedLines++;
						}
						res += "\n  ".concat(expectedLines[i - 1]);
						printedLines++;
					}
					lastPos = i;
					other += "\n".concat(red, "-").concat(white, " ").concat(expectedLines[i]);
					printedLines++;
				} else if (expectedLines.length < i + 1) {
					if (cur > 1 && i > 2) {
						if (cur > 4) {
							res += "\n".concat(blue, "...").concat(white);
							skipped = true;
						} else if (cur > 3) {
							res += "\n  ".concat(actualLines[i - 2]);
							printedLines++;
						}
						res += "\n  ".concat(actualLines[i - 1]);
						printedLines++;
					}
					lastPos = i;
					res += "\n".concat(green, "+").concat(white, " ").concat(actualLines[i]);
					printedLines++;
				} else {
					var expectedLine = expectedLines[i];
					var actualLine = actualLines[i];
					var divergingLines = actualLine !== expectedLine && (!endsWith(actualLine, ",") || actualLine.slice(0, -1) !== expectedLine);
					if (divergingLines && endsWith(expectedLine, ",") && expectedLine.slice(0, -1) === actualLine) {
						divergingLines = false;
						actualLine += ",";
					}
					if (divergingLines) {
						if (cur > 1 && i > 2) {
							if (cur > 4) {
								res += "\n".concat(blue, "...").concat(white);
								skipped = true;
							} else if (cur > 3) {
								res += "\n  ".concat(actualLines[i - 2]);
								printedLines++;
							}
							res += "\n  ".concat(actualLines[i - 1]);
							printedLines++;
						}
						lastPos = i;
						res += "\n".concat(green, "+").concat(white, " ").concat(actualLine);
						other += "\n".concat(red, "-").concat(white, " ").concat(expectedLine);
						printedLines += 2;
					} else {
						res += other;
						other = "";
						if (cur === 1 || i === 0) {
							res += "\n  ".concat(actualLine);
							printedLines++;
						}
					}
				}
				if (printedLines > 20 && i < maxLines - 2) return "".concat(msg).concat(skippedMsg, "\n").concat(res, "\n").concat(blue, "...").concat(white).concat(other, "\n") + "".concat(blue, "...").concat(white);
			}
			return "".concat(msg).concat(skipped ? skippedMsg : "", "\n").concat(res).concat(other).concat(end).concat(indicator);
		}
		module2.exports = /* @__PURE__ */ (function(_Error, _inspect$custom) {
			_inherits(AssertionError2, _Error);
			var _super = _createSuper(AssertionError2);
			function AssertionError2(options) {
				var _this;
				_classCallCheck(this, AssertionError2);
				if (_typeof(options) !== "object" || options === null) throw new ERR_INVALID_ARG_TYPE("options", "Object", options);
				var message = options.message, operator = options.operator, stackStartFn = options.stackStartFn;
				var actual = options.actual, expected = options.expected;
				var limit = Error.stackTraceLimit;
				Error.stackTraceLimit = 0;
				if (message != null) _this = _super.call(this, String(message));
				else {
					if (import_browser.default.stderr && import_browser.default.stderr.isTTY) if (import_browser.default.stderr && import_browser.default.stderr.getColorDepth && import_browser.default.stderr.getColorDepth() !== 1) {
						blue = "\x1B[34m";
						green = "\x1B[32m";
						white = "\x1B[39m";
						red = "\x1B[31m";
					} else {
						blue = "";
						green = "";
						white = "";
						red = "";
					}
					if (_typeof(actual) === "object" && actual !== null && _typeof(expected) === "object" && expected !== null && "stack" in actual && actual instanceof Error && "stack" in expected && expected instanceof Error) {
						actual = copyError(actual);
						expected = copyError(expected);
					}
					if (operator === "deepStrictEqual" || operator === "strictEqual") _this = _super.call(this, createErrDiff(actual, expected, operator));
					else if (operator === "notDeepStrictEqual" || operator === "notStrictEqual") {
						var base = kReadableOperator[operator];
						var res = inspectValue(actual).split("\n");
						if (operator === "notStrictEqual" && _typeof(actual) === "object" && actual !== null) base = kReadableOperator.notStrictEqualObject;
						if (res.length > 30) {
							res[26] = "".concat(blue, "...").concat(white);
							while (res.length > 27) res.pop();
						}
						if (res.length === 1) _this = _super.call(this, "".concat(base, " ").concat(res[0]));
						else _this = _super.call(this, "".concat(base, "\n\n").concat(res.join("\n"), "\n"));
					} else {
						var _res = inspectValue(actual);
						var other = "";
						var knownOperators = kReadableOperator[operator];
						if (operator === "notDeepEqual" || operator === "notEqual") {
							_res = "".concat(kReadableOperator[operator], "\n\n").concat(_res);
							if (_res.length > 1024) _res = "".concat(_res.slice(0, 1021), "...");
						} else {
							other = "".concat(inspectValue(expected));
							if (_res.length > 512) _res = "".concat(_res.slice(0, 509), "...");
							if (other.length > 512) other = "".concat(other.slice(0, 509), "...");
							if (operator === "deepEqual" || operator === "equal") _res = "".concat(knownOperators, "\n\n").concat(_res, "\n\nshould equal\n\n");
							else other = " ".concat(operator, " ").concat(other);
						}
						_this = _super.call(this, "".concat(_res).concat(other));
					}
				}
				Error.stackTraceLimit = limit;
				_this.generatedMessage = !message;
				Object.defineProperty(_assertThisInitialized(_this), "name", {
					value: "AssertionError [ERR_ASSERTION]",
					enumerable: false,
					writable: true,
					configurable: true
				});
				_this.code = "ERR_ASSERTION";
				_this.actual = actual;
				_this.expected = expected;
				_this.operator = operator;
				if (Error.captureStackTrace) Error.captureStackTrace(_assertThisInitialized(_this), stackStartFn);
				_this.stack;
				_this.name = "AssertionError";
				return _possibleConstructorReturn(_this);
			}
			_createClass(AssertionError2, [{
				key: "toString",
				value: function toString() {
					return "".concat(this.name, " [").concat(this.code, "]: ").concat(this.message);
				}
			}, {
				key: _inspect$custom,
				value: function value(recurseTimes, ctx) {
					return inspect(this, _objectSpread(_objectSpread({}, ctx), {}, {
						customInspect: false,
						depth: 0
					}));
				}
			}]);
			return AssertionError2;
		})(/* @__PURE__ */ _wrapNativeSuper(Error), inspect.custom);
	} });
	var require_isArguments = __commonJS({ "../../../node_modules/.pnpm/object-keys@1.1.1/node_modules/object-keys/isArguments.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var toStr = Object.prototype.toString;
		module2.exports = function isArguments(value) {
			var str = toStr.call(value);
			var isArgs = str === "[object Arguments]";
			if (!isArgs) isArgs = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && toStr.call(value.callee) === "[object Function]";
			return isArgs;
		};
	} });
	var require_implementation2 = __commonJS({ "../../../node_modules/.pnpm/object-keys@1.1.1/node_modules/object-keys/implementation.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var keysShim;
		if (!Object.keys) {
			has = Object.prototype.hasOwnProperty;
			toStr = Object.prototype.toString;
			isArgs = require_isArguments();
			isEnumerable = Object.prototype.propertyIsEnumerable;
			hasDontEnumBug = !isEnumerable.call({ toString: null }, "toString");
			hasProtoEnumBug = isEnumerable.call(function() {}, "prototype");
			dontEnums = [
				"toString",
				"toLocaleString",
				"valueOf",
				"hasOwnProperty",
				"isPrototypeOf",
				"propertyIsEnumerable",
				"constructor"
			];
			equalsConstructorPrototype = function(o) {
				var ctor = o.constructor;
				return ctor && ctor.prototype === o;
			};
			excludedKeys = {
				$applicationCache: true,
				$console: true,
				$external: true,
				$frame: true,
				$frameElement: true,
				$frames: true,
				$innerHeight: true,
				$innerWidth: true,
				$onmozfullscreenchange: true,
				$onmozfullscreenerror: true,
				$outerHeight: true,
				$outerWidth: true,
				$pageXOffset: true,
				$pageYOffset: true,
				$parent: true,
				$scrollLeft: true,
				$scrollTop: true,
				$scrollX: true,
				$scrollY: true,
				$self: true,
				$webkitIndexedDB: true,
				$webkitStorageInfo: true,
				$window: true
			};
			hasAutomationEqualityBug = (function() {
				if (typeof window === "undefined") return false;
				for (var k in window) try {
					if (!excludedKeys["$" + k] && has.call(window, k) && window[k] !== null && typeof window[k] === "object") try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				} catch (e) {
					return true;
				}
				return false;
			})();
			equalsConstructorPrototypeIfNotBuggy = function(o) {
				if (typeof window === "undefined" || !hasAutomationEqualityBug) return equalsConstructorPrototype(o);
				try {
					return equalsConstructorPrototype(o);
				} catch (e) {
					return false;
				}
			};
			keysShim = function keys(object) {
				var isObject = object !== null && typeof object === "object";
				var isFunction = toStr.call(object) === "[object Function]";
				var isArguments = isArgs(object);
				var isString = isObject && toStr.call(object) === "[object String]";
				var theKeys = [];
				if (!isObject && !isFunction && !isArguments) throw new TypeError("Object.keys called on a non-object");
				var skipProto = hasProtoEnumBug && isFunction;
				if (isString && object.length > 0 && !has.call(object, 0)) for (var i = 0; i < object.length; ++i) theKeys.push(String(i));
				if (isArguments && object.length > 0) for (var j = 0; j < object.length; ++j) theKeys.push(String(j));
				else for (var name in object) if (!(skipProto && name === "prototype") && has.call(object, name)) theKeys.push(String(name));
				if (hasDontEnumBug) {
					var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
					for (var k = 0; k < dontEnums.length; ++k) if (!(skipConstructor && dontEnums[k] === "constructor") && has.call(object, dontEnums[k])) theKeys.push(dontEnums[k]);
				}
				return theKeys;
			};
		}
		var has;
		var toStr;
		var isArgs;
		var isEnumerable;
		var hasDontEnumBug;
		var hasProtoEnumBug;
		var dontEnums;
		var equalsConstructorPrototype;
		var excludedKeys;
		var hasAutomationEqualityBug;
		var equalsConstructorPrototypeIfNotBuggy;
		module2.exports = keysShim;
	} });
	var require_object_keys = __commonJS({ "../../../node_modules/.pnpm/object-keys@1.1.1/node_modules/object-keys/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var slice = Array.prototype.slice;
		var isArgs = require_isArguments();
		var origKeys = Object.keys;
		var keysShim = origKeys ? function keys(o) {
			return origKeys(o);
		} : require_implementation2();
		var originalKeys = Object.keys;
		keysShim.shim = function shimObjectKeys() {
			if (Object.keys) {
				if (!(function() {
					var args = Object.keys(arguments);
					return args && args.length === arguments.length;
				})(1, 2)) Object.keys = function keys(object) {
					if (isArgs(object)) return originalKeys(slice.call(object));
					return originalKeys(object);
				};
			} else Object.keys = keysShim;
			return Object.keys || keysShim;
		};
		module2.exports = keysShim;
	} });
	var require_implementation3 = __commonJS({ "../../../node_modules/.pnpm/object.assign@4.1.7/node_modules/object.assign/implementation.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var objectKeys = require_object_keys();
		var hasSymbols = require_shams()();
		var callBound = require_call_bound();
		var $Object = require_es_object_atoms();
		var $push = callBound("Array.prototype.push");
		var $propIsEnumerable = callBound("Object.prototype.propertyIsEnumerable");
		var originalGetSymbols = hasSymbols ? $Object.getOwnPropertySymbols : null;
		module2.exports = function assign(target, source1) {
			if (target == null) throw new TypeError("target must be an object");
			var to = $Object(target);
			if (arguments.length === 1) return to;
			for (var s = 1; s < arguments.length; ++s) {
				var from = $Object(arguments[s]);
				var keys = objectKeys(from);
				var getSymbols = hasSymbols && ($Object.getOwnPropertySymbols || originalGetSymbols);
				if (getSymbols) {
					var syms = getSymbols(from);
					for (var j = 0; j < syms.length; ++j) {
						var key = syms[j];
						if ($propIsEnumerable(from, key)) $push(keys, key);
					}
				}
				for (var i = 0; i < keys.length; ++i) {
					var nextKey = keys[i];
					if ($propIsEnumerable(from, nextKey)) to[nextKey] = from[nextKey];
				}
			}
			return to;
		};
	} });
	var require_polyfill = __commonJS({ "../../../node_modules/.pnpm/object.assign@4.1.7/node_modules/object.assign/polyfill.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var implementation = require_implementation3();
		var lacksProperEnumerationOrder = function() {
			if (!Object.assign) return false;
			var str = "abcdefghijklmnopqrst";
			var letters = str.split("");
			var map = {};
			for (var i = 0; i < letters.length; ++i) map[letters[i]] = letters[i];
			var obj = Object.assign({}, map);
			var actual = "";
			for (var k in obj) actual += k;
			return str !== actual;
		};
		var assignHasPendingExceptions = function() {
			if (!Object.assign || !Object.preventExtensions) return false;
			var thrower = Object.preventExtensions({ 1: 2 });
			try {
				Object.assign(thrower, "xy");
			} catch (e) {
				return thrower[1] === "y";
			}
			return false;
		};
		module2.exports = function getPolyfill() {
			if (!Object.assign) return implementation;
			if (lacksProperEnumerationOrder()) return implementation;
			if (assignHasPendingExceptions()) return implementation;
			return Object.assign;
		};
	} });
	var require_implementation4 = __commonJS({ "../../../node_modules/.pnpm/object-is@1.1.6/node_modules/object-is/implementation.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var numberIsNaN = function(value) {
			return value !== value;
		};
		module2.exports = function is(a, b) {
			if (a === 0 && b === 0) return 1 / a === 1 / b;
			if (a === b) return true;
			if (numberIsNaN(a) && numberIsNaN(b)) return true;
			return false;
		};
	} });
	var require_polyfill2 = __commonJS({ "../../../node_modules/.pnpm/object-is@1.1.6/node_modules/object-is/polyfill.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var implementation = require_implementation4();
		module2.exports = function getPolyfill() {
			return typeof Object.is === "function" ? Object.is : implementation;
		};
	} });
	var require_callBound = __commonJS({ "../../../node_modules/.pnpm/call-bind@1.0.9/node_modules/call-bind/callBound.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var GetIntrinsic = require_get_intrinsic();
		var callBind = require_call_bind();
		var $indexOf = callBind(GetIntrinsic("String.prototype.indexOf"));
		module2.exports = function callBoundIntrinsic(name, allowMissing) {
			var intrinsic = GetIntrinsic(name, !!allowMissing);
			if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) return callBind(intrinsic);
			return intrinsic;
		};
	} });
	var require_define_properties = __commonJS({ "../../../node_modules/.pnpm/define-properties@1.2.1/node_modules/define-properties/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var keys = require_object_keys();
		var hasSymbols = typeof Symbol === "function" && typeof /* @__PURE__ */ Symbol("foo") === "symbol";
		var toStr = Object.prototype.toString;
		var concat = Array.prototype.concat;
		var defineDataProperty = require_define_data_property();
		var isFunction = function(fn) {
			return typeof fn === "function" && toStr.call(fn) === "[object Function]";
		};
		var supportsDescriptors = require_has_property_descriptors()();
		var defineProperty = function(object, name, value, predicate) {
			if (name in object) {
				if (predicate === true) {
					if (object[name] === value) return;
				} else if (!isFunction(predicate) || !predicate()) return;
			}
			if (supportsDescriptors) defineDataProperty(object, name, value, true);
			else defineDataProperty(object, name, value);
		};
		var defineProperties = function(object, map) {
			var predicates = arguments.length > 2 ? arguments[2] : {};
			var props = keys(map);
			if (hasSymbols) props = concat.call(props, Object.getOwnPropertySymbols(map));
			for (var i = 0; i < props.length; i += 1) defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
		};
		defineProperties.supportsDescriptors = !!supportsDescriptors;
		module2.exports = defineProperties;
	} });
	var require_shim = __commonJS({ "../../../node_modules/.pnpm/object-is@1.1.6/node_modules/object-is/shim.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var getPolyfill = require_polyfill2();
		var define = require_define_properties();
		module2.exports = function shimObjectIs() {
			var polyfill = getPolyfill();
			define(Object, { is: polyfill }, { is: function testObjectIs() {
				return Object.is !== polyfill;
			} });
			return polyfill;
		};
	} });
	var require_object_is = __commonJS({ "../../../node_modules/.pnpm/object-is@1.1.6/node_modules/object-is/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var define = require_define_properties();
		var callBind = require_call_bind();
		var implementation = require_implementation4();
		var getPolyfill = require_polyfill2();
		var shim = require_shim();
		var polyfill = callBind(getPolyfill(), Object);
		define(polyfill, {
			getPolyfill,
			implementation,
			shim
		});
		module2.exports = polyfill;
	} });
	var require_implementation5 = __commonJS({ "../../../node_modules/.pnpm/is-nan@1.3.2/node_modules/is-nan/implementation.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = function isNaN2(value) {
			return value !== value;
		};
	} });
	var require_polyfill3 = __commonJS({ "../../../node_modules/.pnpm/is-nan@1.3.2/node_modules/is-nan/polyfill.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var implementation = require_implementation5();
		module2.exports = function getPolyfill() {
			if (Number.isNaN && !Number.isNaN("a")) return Number.isNaN;
			return implementation;
		};
	} });
	var require_shim2 = __commonJS({ "../../../node_modules/.pnpm/is-nan@1.3.2/node_modules/is-nan/shim.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var define = require_define_properties();
		var getPolyfill = require_polyfill3();
		module2.exports = function shimNumberIsNaN() {
			var polyfill = getPolyfill();
			define(Number, { isNaN: polyfill }, { isNaN: function testIsNaN() {
				return Number.isNaN !== polyfill;
			} });
			return polyfill;
		};
	} });
	var require_is_nan = __commonJS({ "../../../node_modules/.pnpm/is-nan@1.3.2/node_modules/is-nan/index.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var callBind = require_call_bind();
		var define = require_define_properties();
		var implementation = require_implementation5();
		var getPolyfill = require_polyfill3();
		var shim = require_shim2();
		var polyfill = callBind(getPolyfill(), Number);
		define(polyfill, {
			getPolyfill,
			implementation,
			shim
		});
		module2.exports = polyfill;
	} });
	var require_comparisons = __commonJS({ "../../../node_modules/.pnpm/assert@2.1.0/node_modules/assert/build/internal/util/comparisons.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function _slicedToArray(arr, i) {
			return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
		}
		function _nonIterableRest() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		function _unsupportedIterableToArray(o, minLen) {
			if (!o) return;
			if (typeof o === "string") return _arrayLikeToArray(o, minLen);
			var n = Object.prototype.toString.call(o).slice(8, -1);
			if (n === "Object" && o.constructor) n = o.constructor.name;
			if (n === "Map" || n === "Set") return Array.from(o);
			if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
		}
		function _arrayLikeToArray(arr, len) {
			if (len == null || len > arr.length) len = arr.length;
			for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
			return arr2;
		}
		function _iterableToArrayLimit(r, l) {
			var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
			if (null != t) {
				var e, n, i, u, a = [], f = true, o = false;
				try {
					if (i = (t = t.call(r)).next, 0 === l) {
						if (Object(t) !== t) return;
						f = false;
					} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true);
				} catch (r2) {
					o = true, n = r2;
				} finally {
					try {
						if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
					} finally {
						if (o) throw n;
					}
				}
				return a;
			}
		}
		function _arrayWithHoles(arr) {
			if (Array.isArray(arr)) return arr;
		}
		function _typeof(o) {
			"@babel/helpers - typeof";
			return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
				return typeof o2;
			} : function(o2) {
				return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
			}, _typeof(o);
		}
		var regexFlagsSupported = /a/g.flags !== void 0;
		var arrayFromSet = function arrayFromSet2(set) {
			var array = [];
			set.forEach(function(value) {
				return array.push(value);
			});
			return array;
		};
		var arrayFromMap = function arrayFromMap2(map) {
			var array = [];
			map.forEach(function(value, key) {
				return array.push([key, value]);
			});
			return array;
		};
		var objectIs = Object.is ? Object.is : require_object_is();
		var objectGetOwnPropertySymbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols : function() {
			return [];
		};
		var numberIsNaN = Number.isNaN ? Number.isNaN : require_is_nan();
		function uncurryThis(f) {
			return f.call.bind(f);
		}
		var hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
		var propertyIsEnumerable = uncurryThis(Object.prototype.propertyIsEnumerable);
		var objectToString = uncurryThis(Object.prototype.toString);
		var _require$types = require_util().types;
		var isAnyArrayBuffer = _require$types.isAnyArrayBuffer;
		var isArrayBufferView = _require$types.isArrayBufferView;
		var isDate = _require$types.isDate;
		var isMap = _require$types.isMap;
		var isRegExp = _require$types.isRegExp;
		var isSet = _require$types.isSet;
		var isNativeError = _require$types.isNativeError;
		var isBoxedPrimitive = _require$types.isBoxedPrimitive;
		var isNumberObject = _require$types.isNumberObject;
		var isStringObject = _require$types.isStringObject;
		var isBooleanObject = _require$types.isBooleanObject;
		var isBigIntObject = _require$types.isBigIntObject;
		var isSymbolObject = _require$types.isSymbolObject;
		var isFloat32Array = _require$types.isFloat32Array;
		var isFloat64Array = _require$types.isFloat64Array;
		function isNonIndex(key) {
			if (key.length === 0 || key.length > 10) return true;
			for (var i = 0; i < key.length; i++) {
				var code = key.charCodeAt(i);
				if (code < 48 || code > 57) return true;
			}
			return key.length === 10 && key >= Math.pow(2, 32);
		}
		function getOwnNonIndexProperties(value) {
			return Object.keys(value).filter(isNonIndex).concat(objectGetOwnPropertySymbols(value).filter(Object.prototype.propertyIsEnumerable.bind(value)));
		}
		function compare(a, b) {
			if (a === b) return 0;
			var x = a.length;
			var y = b.length;
			for (var i = 0, len = Math.min(x, y); i < len; ++i) if (a[i] !== b[i]) {
				x = a[i];
				y = b[i];
				break;
			}
			if (x < y) return -1;
			if (y < x) return 1;
			return 0;
		}
		var ONLY_ENUMERABLE = void 0;
		var kStrict = true;
		var kLoose = false;
		var kNoIterator = 0;
		var kIsArray = 1;
		var kIsSet = 2;
		var kIsMap = 3;
		function areSimilarRegExps(a, b) {
			return regexFlagsSupported ? a.source === b.source && a.flags === b.flags : RegExp.prototype.toString.call(a) === RegExp.prototype.toString.call(b);
		}
		function areSimilarFloatArrays(a, b) {
			if (a.byteLength !== b.byteLength) return false;
			for (var offset = 0; offset < a.byteLength; offset++) if (a[offset] !== b[offset]) return false;
			return true;
		}
		function areSimilarTypedArrays(a, b) {
			if (a.byteLength !== b.byteLength) return false;
			return compare(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), new Uint8Array(b.buffer, b.byteOffset, b.byteLength)) === 0;
		}
		function areEqualArrayBuffers(buf1, buf2) {
			return buf1.byteLength === buf2.byteLength && compare(new Uint8Array(buf1), new Uint8Array(buf2)) === 0;
		}
		function isEqualBoxedPrimitive(val1, val2) {
			if (isNumberObject(val1)) return isNumberObject(val2) && objectIs(Number.prototype.valueOf.call(val1), Number.prototype.valueOf.call(val2));
			if (isStringObject(val1)) return isStringObject(val2) && String.prototype.valueOf.call(val1) === String.prototype.valueOf.call(val2);
			if (isBooleanObject(val1)) return isBooleanObject(val2) && Boolean.prototype.valueOf.call(val1) === Boolean.prototype.valueOf.call(val2);
			if (isBigIntObject(val1)) return isBigIntObject(val2) && BigInt.prototype.valueOf.call(val1) === BigInt.prototype.valueOf.call(val2);
			return isSymbolObject(val2) && Symbol.prototype.valueOf.call(val1) === Symbol.prototype.valueOf.call(val2);
		}
		function innerDeepEqual(val1, val2, strict, memos) {
			if (val1 === val2) {
				if (val1 !== 0) return true;
				return strict ? objectIs(val1, val2) : true;
			}
			if (strict) {
				if (_typeof(val1) !== "object") return typeof val1 === "number" && numberIsNaN(val1) && numberIsNaN(val2);
				if (_typeof(val2) !== "object" || val1 === null || val2 === null) return false;
				if (Object.getPrototypeOf(val1) !== Object.getPrototypeOf(val2)) return false;
			} else {
				if (val1 === null || _typeof(val1) !== "object") {
					if (val2 === null || _typeof(val2) !== "object") return val1 == val2;
					return false;
				}
				if (val2 === null || _typeof(val2) !== "object") return false;
			}
			var val1Tag = objectToString(val1);
			if (val1Tag !== objectToString(val2)) return false;
			if (Array.isArray(val1)) {
				if (val1.length !== val2.length) return false;
				var keys1 = getOwnNonIndexProperties(val1, ONLY_ENUMERABLE);
				var keys2 = getOwnNonIndexProperties(val2, ONLY_ENUMERABLE);
				if (keys1.length !== keys2.length) return false;
				return keyCheck(val1, val2, strict, memos, kIsArray, keys1);
			}
			if (val1Tag === "[object Object]") {
				if (!isMap(val1) && isMap(val2) || !isSet(val1) && isSet(val2)) return false;
			}
			if (isDate(val1)) {
				if (!isDate(val2) || Date.prototype.getTime.call(val1) !== Date.prototype.getTime.call(val2)) return false;
			} else if (isRegExp(val1)) {
				if (!isRegExp(val2) || !areSimilarRegExps(val1, val2)) return false;
			} else if (isNativeError(val1) || val1 instanceof Error) {
				if (val1.message !== val2.message || val1.name !== val2.name) return false;
			} else if (isArrayBufferView(val1)) {
				if (!strict && (isFloat32Array(val1) || isFloat64Array(val1))) {
					if (!areSimilarFloatArrays(val1, val2)) return false;
				} else if (!areSimilarTypedArrays(val1, val2)) return false;
				var _keys = getOwnNonIndexProperties(val1, ONLY_ENUMERABLE);
				var _keys2 = getOwnNonIndexProperties(val2, ONLY_ENUMERABLE);
				if (_keys.length !== _keys2.length) return false;
				return keyCheck(val1, val2, strict, memos, kNoIterator, _keys);
			} else if (isSet(val1)) {
				if (!isSet(val2) || val1.size !== val2.size) return false;
				return keyCheck(val1, val2, strict, memos, kIsSet);
			} else if (isMap(val1)) {
				if (!isMap(val2) || val1.size !== val2.size) return false;
				return keyCheck(val1, val2, strict, memos, kIsMap);
			} else if (isAnyArrayBuffer(val1)) {
				if (!areEqualArrayBuffers(val1, val2)) return false;
			} else if (isBoxedPrimitive(val1) && !isEqualBoxedPrimitive(val1, val2)) return false;
			return keyCheck(val1, val2, strict, memos, kNoIterator);
		}
		function getEnumerables(val, keys) {
			return keys.filter(function(k) {
				return propertyIsEnumerable(val, k);
			});
		}
		function keyCheck(val1, val2, strict, memos, iterationType, aKeys) {
			if (arguments.length === 5) {
				aKeys = Object.keys(val1);
				var bKeys = Object.keys(val2);
				if (aKeys.length !== bKeys.length) return false;
			}
			var i = 0;
			for (; i < aKeys.length; i++) if (!hasOwnProperty(val2, aKeys[i])) return false;
			if (strict && arguments.length === 5) {
				var symbolKeysA = objectGetOwnPropertySymbols(val1);
				if (symbolKeysA.length !== 0) {
					var count = 0;
					for (i = 0; i < symbolKeysA.length; i++) {
						var key = symbolKeysA[i];
						if (propertyIsEnumerable(val1, key)) {
							if (!propertyIsEnumerable(val2, key)) return false;
							aKeys.push(key);
							count++;
						} else if (propertyIsEnumerable(val2, key)) return false;
					}
					var symbolKeysB = objectGetOwnPropertySymbols(val2);
					if (symbolKeysA.length !== symbolKeysB.length && getEnumerables(val2, symbolKeysB).length !== count) return false;
				} else {
					var _symbolKeysB = objectGetOwnPropertySymbols(val2);
					if (_symbolKeysB.length !== 0 && getEnumerables(val2, _symbolKeysB).length !== 0) return false;
				}
			}
			if (aKeys.length === 0 && (iterationType === kNoIterator || iterationType === kIsArray && val1.length === 0 || val1.size === 0)) return true;
			if (memos === void 0) memos = {
				val1: /* @__PURE__ */ new Map(),
				val2: /* @__PURE__ */ new Map(),
				position: 0
			};
			else {
				var val2MemoA = memos.val1.get(val1);
				if (val2MemoA !== void 0) {
					var val2MemoB = memos.val2.get(val2);
					if (val2MemoB !== void 0) return val2MemoA === val2MemoB;
				}
				memos.position++;
			}
			memos.val1.set(val1, memos.position);
			memos.val2.set(val2, memos.position);
			var areEq = objEquiv(val1, val2, strict, aKeys, memos, iterationType);
			memos.val1.delete(val1);
			memos.val2.delete(val2);
			return areEq;
		}
		function setHasEqualElement(set, val1, strict, memo) {
			var setValues = arrayFromSet(set);
			for (var i = 0; i < setValues.length; i++) {
				var val2 = setValues[i];
				if (innerDeepEqual(val1, val2, strict, memo)) {
					set.delete(val2);
					return true;
				}
			}
			return false;
		}
		function findLooseMatchingPrimitives(prim) {
			switch (_typeof(prim)) {
				case "undefined": return null;
				case "object": return;
				case "symbol": return false;
				case "string": prim = +prim;
				case "number": if (numberIsNaN(prim)) return false;
			}
			return true;
		}
		function setMightHaveLoosePrim(a, b, prim) {
			var altValue = findLooseMatchingPrimitives(prim);
			if (altValue != null) return altValue;
			return b.has(altValue) && !a.has(altValue);
		}
		function mapMightHaveLoosePrim(a, b, prim, item, memo) {
			var altValue = findLooseMatchingPrimitives(prim);
			if (altValue != null) return altValue;
			var curB = b.get(altValue);
			if (curB === void 0 && !b.has(altValue) || !innerDeepEqual(item, curB, false, memo)) return false;
			return !a.has(altValue) && innerDeepEqual(item, curB, false, memo);
		}
		function setEquiv(a, b, strict, memo) {
			var set = null;
			var aValues = arrayFromSet(a);
			for (var i = 0; i < aValues.length; i++) {
				var val = aValues[i];
				if (_typeof(val) === "object" && val !== null) {
					if (set === null) set = /* @__PURE__ */ new Set();
					set.add(val);
				} else if (!b.has(val)) {
					if (strict) return false;
					if (!setMightHaveLoosePrim(a, b, val)) return false;
					if (set === null) set = /* @__PURE__ */ new Set();
					set.add(val);
				}
			}
			if (set !== null) {
				var bValues = arrayFromSet(b);
				for (var _i = 0; _i < bValues.length; _i++) {
					var _val = bValues[_i];
					if (_typeof(_val) === "object" && _val !== null) {
						if (!setHasEqualElement(set, _val, strict, memo)) return false;
					} else if (!strict && !a.has(_val) && !setHasEqualElement(set, _val, strict, memo)) return false;
				}
				return set.size === 0;
			}
			return true;
		}
		function mapHasEqualEntry(set, map, key1, item1, strict, memo) {
			var setValues = arrayFromSet(set);
			for (var i = 0; i < setValues.length; i++) {
				var key2 = setValues[i];
				if (innerDeepEqual(key1, key2, strict, memo) && innerDeepEqual(item1, map.get(key2), strict, memo)) {
					set.delete(key2);
					return true;
				}
			}
			return false;
		}
		function mapEquiv(a, b, strict, memo) {
			var set = null;
			var aEntries = arrayFromMap(a);
			for (var i = 0; i < aEntries.length; i++) {
				var _aEntries$i = _slicedToArray(aEntries[i], 2), key = _aEntries$i[0], item1 = _aEntries$i[1];
				if (_typeof(key) === "object" && key !== null) {
					if (set === null) set = /* @__PURE__ */ new Set();
					set.add(key);
				} else {
					var item2 = b.get(key);
					if (item2 === void 0 && !b.has(key) || !innerDeepEqual(item1, item2, strict, memo)) {
						if (strict) return false;
						if (!mapMightHaveLoosePrim(a, b, key, item1, memo)) return false;
						if (set === null) set = /* @__PURE__ */ new Set();
						set.add(key);
					}
				}
			}
			if (set !== null) {
				var bEntries = arrayFromMap(b);
				for (var _i2 = 0; _i2 < bEntries.length; _i2++) {
					var _bEntries$_i = _slicedToArray(bEntries[_i2], 2), _key = _bEntries$_i[0], item = _bEntries$_i[1];
					if (_typeof(_key) === "object" && _key !== null) {
						if (!mapHasEqualEntry(set, a, _key, item, strict, memo)) return false;
					} else if (!strict && (!a.has(_key) || !innerDeepEqual(a.get(_key), item, false, memo)) && !mapHasEqualEntry(set, a, _key, item, false, memo)) return false;
				}
				return set.size === 0;
			}
			return true;
		}
		function objEquiv(a, b, strict, keys, memos, iterationType) {
			var i = 0;
			if (iterationType === kIsSet) {
				if (!setEquiv(a, b, strict, memos)) return false;
			} else if (iterationType === kIsMap) {
				if (!mapEquiv(a, b, strict, memos)) return false;
			} else if (iterationType === kIsArray) for (; i < a.length; i++) if (hasOwnProperty(a, i)) {
				if (!hasOwnProperty(b, i) || !innerDeepEqual(a[i], b[i], strict, memos)) return false;
			} else if (hasOwnProperty(b, i)) return false;
			else {
				var keysA = Object.keys(a);
				for (; i < keysA.length; i++) {
					var key = keysA[i];
					if (!hasOwnProperty(b, key) || !innerDeepEqual(a[key], b[key], strict, memos)) return false;
				}
				if (keysA.length !== Object.keys(b).length) return false;
				return true;
			}
			for (i = 0; i < keys.length; i++) {
				var _key2 = keys[i];
				if (!innerDeepEqual(a[_key2], b[_key2], strict, memos)) return false;
			}
			return true;
		}
		function isDeepEqual(val1, val2) {
			return innerDeepEqual(val1, val2, kLoose);
		}
		function isDeepStrictEqual(val1, val2) {
			return innerDeepEqual(val1, val2, kStrict);
		}
		module2.exports = {
			isDeepEqual,
			isDeepStrictEqual
		};
	} });
	var require_assert = __commonJS({ "../../../node_modules/.pnpm/assert@2.1.0/node_modules/assert/build/assert.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function _typeof(o) {
			"@babel/helpers - typeof";
			return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
				return typeof o2;
			} : function(o2) {
				return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
			}, _typeof(o);
		}
		function _defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
			}
		}
		function _createClass(Constructor, protoProps, staticProps) {
			if (protoProps) _defineProperties(Constructor.prototype, protoProps);
			if (staticProps) _defineProperties(Constructor, staticProps);
			Object.defineProperty(Constructor, "prototype", { writable: false });
			return Constructor;
		}
		function _toPropertyKey(arg) {
			var key = _toPrimitive(arg, "string");
			return _typeof(key) === "symbol" ? key : String(key);
		}
		function _toPrimitive(input, hint) {
			if (_typeof(input) !== "object" || input === null) return input;
			var prim = input[Symbol.toPrimitive];
			if (prim !== void 0) {
				var res = prim.call(input, hint || "default");
				if (_typeof(res) !== "object") return res;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return (hint === "string" ? String : Number)(input);
		}
		function _classCallCheck(instance, Constructor) {
			if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
		}
		var _require$codes = require_errors().codes;
		var ERR_AMBIGUOUS_ARGUMENT = _require$codes.ERR_AMBIGUOUS_ARGUMENT;
		var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
		var ERR_INVALID_ARG_VALUE = _require$codes.ERR_INVALID_ARG_VALUE;
		var ERR_INVALID_RETURN_VALUE = _require$codes.ERR_INVALID_RETURN_VALUE;
		var ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS;
		var AssertionError = require_assertion_error();
		var inspect = require_util().inspect;
		var _require$types = require_util().types;
		var isPromise = _require$types.isPromise;
		var isRegExp = _require$types.isRegExp;
		var objectAssign = require_polyfill()();
		var objectIs = require_polyfill2()();
		var RegExpPrototypeTest = require_callBound()("RegExp.prototype.test");
		var isDeepEqual;
		var isDeepStrictEqual;
		function lazyLoadComparison() {
			var comparison = require_comparisons();
			isDeepEqual = comparison.isDeepEqual;
			isDeepStrictEqual = comparison.isDeepStrictEqual;
		}
		var warned = false;
		var assert = module2.exports = ok;
		var NO_EXCEPTION_SENTINEL = {};
		function innerFail(obj) {
			if (obj.message instanceof Error) throw obj.message;
			throw new AssertionError(obj);
		}
		function fail(actual, expected, message, operator, stackStartFn) {
			var argsLen = arguments.length;
			var internalMessage;
			if (argsLen === 0) internalMessage = "Failed";
			else if (argsLen === 1) {
				message = actual;
				actual = void 0;
			} else {
				if (warned === false) {
					warned = true;
					(import_browser.default.emitWarning ? import_browser.default.emitWarning : console.warn.bind(console))("assert.fail() with more than one argument is deprecated. Please use assert.strictEqual() instead or only pass a message.", "DeprecationWarning", "DEP0094");
				}
				if (argsLen === 2) operator = "!=";
			}
			if (message instanceof Error) throw message;
			var errArgs = {
				actual,
				expected,
				operator: operator === void 0 ? "fail" : operator,
				stackStartFn: stackStartFn || fail
			};
			if (message !== void 0) errArgs.message = message;
			var err = new AssertionError(errArgs);
			if (internalMessage) {
				err.message = internalMessage;
				err.generatedMessage = true;
			}
			throw err;
		}
		assert.fail = fail;
		assert.AssertionError = AssertionError;
		function innerOk(fn, argLen, value, message) {
			if (!value) {
				var generatedMessage = false;
				if (argLen === 0) {
					generatedMessage = true;
					message = "No value argument passed to `assert.ok()`";
				} else if (message instanceof Error) throw message;
				var err = new AssertionError({
					actual: value,
					expected: true,
					message,
					operator: "==",
					stackStartFn: fn
				});
				err.generatedMessage = generatedMessage;
				throw err;
			}
		}
		function ok() {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			innerOk.apply(void 0, [ok, args.length].concat(args));
		}
		assert.ok = ok;
		assert.equal = function equal(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (actual != expected) innerFail({
				actual,
				expected,
				message,
				operator: "==",
				stackStartFn: equal
			});
		};
		assert.notEqual = function notEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (actual == expected) innerFail({
				actual,
				expected,
				message,
				operator: "!=",
				stackStartFn: notEqual
			});
		};
		assert.deepEqual = function deepEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (isDeepEqual === void 0) lazyLoadComparison();
			if (!isDeepEqual(actual, expected)) innerFail({
				actual,
				expected,
				message,
				operator: "deepEqual",
				stackStartFn: deepEqual
			});
		};
		assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (isDeepEqual === void 0) lazyLoadComparison();
			if (isDeepEqual(actual, expected)) innerFail({
				actual,
				expected,
				message,
				operator: "notDeepEqual",
				stackStartFn: notDeepEqual
			});
		};
		assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (isDeepEqual === void 0) lazyLoadComparison();
			if (!isDeepStrictEqual(actual, expected)) innerFail({
				actual,
				expected,
				message,
				operator: "deepStrictEqual",
				stackStartFn: deepStrictEqual
			});
		};
		assert.notDeepStrictEqual = notDeepStrictEqual;
		function notDeepStrictEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (isDeepEqual === void 0) lazyLoadComparison();
			if (isDeepStrictEqual(actual, expected)) innerFail({
				actual,
				expected,
				message,
				operator: "notDeepStrictEqual",
				stackStartFn: notDeepStrictEqual
			});
		}
		assert.strictEqual = function strictEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (!objectIs(actual, expected)) innerFail({
				actual,
				expected,
				message,
				operator: "strictEqual",
				stackStartFn: strictEqual
			});
		};
		assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
			if (arguments.length < 2) throw new ERR_MISSING_ARGS("actual", "expected");
			if (objectIs(actual, expected)) innerFail({
				actual,
				expected,
				message,
				operator: "notStrictEqual",
				stackStartFn: notStrictEqual
			});
		};
		var Comparison = /* @__PURE__ */ _createClass(function Comparison2(obj, keys, actual) {
			var _this = this;
			_classCallCheck(this, Comparison2);
			keys.forEach(function(key) {
				if (key in obj) if (actual !== void 0 && typeof actual[key] === "string" && isRegExp(obj[key]) && RegExpPrototypeTest(obj[key], actual[key])) _this[key] = actual[key];
				else _this[key] = obj[key];
			});
		});
		function compareExceptionKey(actual, expected, key, message, keys, fn) {
			if (!(key in actual) || !isDeepStrictEqual(actual[key], expected[key])) {
				if (!message) {
					var err = new AssertionError({
						actual: new Comparison(actual, keys),
						expected: new Comparison(expected, keys, actual),
						operator: "deepStrictEqual",
						stackStartFn: fn
					});
					err.actual = actual;
					err.expected = expected;
					err.operator = fn.name;
					throw err;
				}
				innerFail({
					actual,
					expected,
					message,
					operator: fn.name,
					stackStartFn: fn
				});
			}
		}
		function expectedException(actual, expected, msg, fn) {
			if (typeof expected !== "function") {
				if (isRegExp(expected)) return RegExpPrototypeTest(expected, actual);
				if (arguments.length === 2) throw new ERR_INVALID_ARG_TYPE("expected", ["Function", "RegExp"], expected);
				if (_typeof(actual) !== "object" || actual === null) {
					var err = new AssertionError({
						actual,
						expected,
						message: msg,
						operator: "deepStrictEqual",
						stackStartFn: fn
					});
					err.operator = fn.name;
					throw err;
				}
				var keys = Object.keys(expected);
				if (expected instanceof Error) keys.push("name", "message");
				else if (keys.length === 0) throw new ERR_INVALID_ARG_VALUE("error", expected, "may not be an empty object");
				if (isDeepEqual === void 0) lazyLoadComparison();
				keys.forEach(function(key) {
					if (typeof actual[key] === "string" && isRegExp(expected[key]) && RegExpPrototypeTest(expected[key], actual[key])) return;
					compareExceptionKey(actual, expected, key, msg, keys, fn);
				});
				return true;
			}
			if (expected.prototype !== void 0 && actual instanceof expected) return true;
			if (Error.isPrototypeOf(expected)) return false;
			return expected.call({}, actual) === true;
		}
		function getActual(fn) {
			if (typeof fn !== "function") throw new ERR_INVALID_ARG_TYPE("fn", "Function", fn);
			try {
				fn();
			} catch (e) {
				return e;
			}
			return NO_EXCEPTION_SENTINEL;
		}
		function checkIsPromise(obj) {
			return isPromise(obj) || obj !== null && _typeof(obj) === "object" && typeof obj.then === "function" && typeof obj.catch === "function";
		}
		function waitForActual(promiseFn) {
			return Promise.resolve().then(function() {
				var resultPromise;
				if (typeof promiseFn === "function") {
					resultPromise = promiseFn();
					if (!checkIsPromise(resultPromise)) throw new ERR_INVALID_RETURN_VALUE("instance of Promise", "promiseFn", resultPromise);
				} else if (checkIsPromise(promiseFn)) resultPromise = promiseFn;
				else throw new ERR_INVALID_ARG_TYPE("promiseFn", ["Function", "Promise"], promiseFn);
				return Promise.resolve().then(function() {
					return resultPromise;
				}).then(function() {
					return NO_EXCEPTION_SENTINEL;
				}).catch(function(e) {
					return e;
				});
			});
		}
		function expectsError(stackStartFn, actual, error, message) {
			if (typeof error === "string") {
				if (arguments.length === 4) throw new ERR_INVALID_ARG_TYPE("error", [
					"Object",
					"Error",
					"Function",
					"RegExp"
				], error);
				if (_typeof(actual) === "object" && actual !== null) {
					if (actual.message === error) throw new ERR_AMBIGUOUS_ARGUMENT("error/message", "The error message \"".concat(actual.message, "\" is identical to the message."));
				} else if (actual === error) throw new ERR_AMBIGUOUS_ARGUMENT("error/message", "The error \"".concat(actual, "\" is identical to the message."));
				message = error;
				error = void 0;
			} else if (error != null && _typeof(error) !== "object" && typeof error !== "function") throw new ERR_INVALID_ARG_TYPE("error", [
				"Object",
				"Error",
				"Function",
				"RegExp"
			], error);
			if (actual === NO_EXCEPTION_SENTINEL) {
				var details = "";
				if (error && error.name) details += " (".concat(error.name, ")");
				details += message ? ": ".concat(message) : ".";
				var fnType = stackStartFn.name === "rejects" ? "rejection" : "exception";
				innerFail({
					actual: void 0,
					expected: error,
					operator: stackStartFn.name,
					message: "Missing expected ".concat(fnType).concat(details),
					stackStartFn
				});
			}
			if (error && !expectedException(actual, error, message, stackStartFn)) throw actual;
		}
		function expectsNoError(stackStartFn, actual, error, message) {
			if (actual === NO_EXCEPTION_SENTINEL) return;
			if (typeof error === "string") {
				message = error;
				error = void 0;
			}
			if (!error || expectedException(actual, error)) {
				var details = message ? ": ".concat(message) : ".";
				var fnType = stackStartFn.name === "doesNotReject" ? "rejection" : "exception";
				innerFail({
					actual,
					expected: error,
					operator: stackStartFn.name,
					message: "Got unwanted ".concat(fnType).concat(details, "\n") + "Actual message: \"".concat(actual && actual.message, "\""),
					stackStartFn
				});
			}
			throw actual;
		}
		assert.throws = function throws(promiseFn) {
			for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
			expectsError.apply(void 0, [throws, getActual(promiseFn)].concat(args));
		};
		assert.rejects = function rejects(promiseFn) {
			for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
			return waitForActual(promiseFn).then(function(result) {
				return expectsError.apply(void 0, [rejects, result].concat(args));
			});
		};
		assert.doesNotThrow = function doesNotThrow(fn) {
			for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) args[_key4 - 1] = arguments[_key4];
			expectsNoError.apply(void 0, [doesNotThrow, getActual(fn)].concat(args));
		};
		assert.doesNotReject = function doesNotReject(fn) {
			for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) args[_key5 - 1] = arguments[_key5];
			return waitForActual(fn).then(function(result) {
				return expectsNoError.apply(void 0, [doesNotReject, result].concat(args));
			});
		};
		assert.ifError = function ifError(err) {
			if (err !== null && err !== void 0) {
				var message = "ifError got unwanted exception: ";
				if (_typeof(err) === "object" && typeof err.message === "string") if (err.message.length === 0 && err.constructor) message += err.constructor.name;
				else message += err.message;
				else message += inspect(err);
				var newErr = new AssertionError({
					actual: err,
					expected: null,
					operator: "ifError",
					message,
					stackStartFn: ifError
				});
				var origStack = err.stack;
				if (typeof origStack === "string") {
					var tmp2 = origStack.split("\n");
					tmp2.shift();
					var tmp1 = newErr.stack.split("\n");
					for (var i = 0; i < tmp2.length; i++) {
						var pos = tmp1.indexOf(tmp2[i]);
						if (pos !== -1) {
							tmp1 = tmp1.slice(0, pos);
							break;
						}
					}
					newErr.stack = "".concat(tmp1.join("\n"), "\n").concat(tmp2.join("\n"));
				}
				throw newErr;
			}
		};
		function internalMatch(string, regexp, message, fn, fnName) {
			if (!isRegExp(regexp)) throw new ERR_INVALID_ARG_TYPE("regexp", "RegExp", regexp);
			var match = fnName === "match";
			if (typeof string !== "string" || RegExpPrototypeTest(regexp, string) !== match) {
				if (message instanceof Error) throw message;
				var generatedMessage = !message;
				message = message || (typeof string !== "string" ? "The \"string\" argument must be of type string. Received type " + "".concat(_typeof(string), " (").concat(inspect(string), ")") : (match ? "The input did not match the regular expression " : "The input was expected to not match the regular expression ") + "".concat(inspect(regexp), ". Input:\n\n").concat(inspect(string), "\n"));
				var err = new AssertionError({
					actual: string,
					expected: regexp,
					message,
					operator: fnName,
					stackStartFn: fn
				});
				err.generatedMessage = generatedMessage;
				throw err;
			}
		}
		assert.match = function match(string, regexp, message) {
			internalMatch(string, regexp, message, match, "match");
		};
		assert.doesNotMatch = function doesNotMatch(string, regexp, message) {
			internalMatch(string, regexp, message, doesNotMatch, "doesNotMatch");
		};
		function strict() {
			for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) args[_key6] = arguments[_key6];
			innerOk.apply(void 0, [strict, args.length].concat(args));
		}
		assert.strict = objectAssign(strict, assert, {
			equal: assert.strictEqual,
			deepEqual: assert.deepStrictEqual,
			notEqual: assert.notStrictEqual,
			notDeepEqual: assert.notDeepStrictEqual
		});
		assert.strict.strict = assert.strict;
	} });
	var require_zstream = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/zstream.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function ZStream() {
			this.input = null;
			this.next_in = 0;
			this.avail_in = 0;
			this.total_in = 0;
			this.output = null;
			this.next_out = 0;
			this.avail_out = 0;
			this.total_out = 0;
			this.msg = "";
			this.state = null;
			this.data_type = 2;
			this.adler = 0;
		}
		module2.exports = ZStream;
	} });
	var require_common = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/utils/common.js"(exports2) {
		"use strict";
		init_browser_globals();
		var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
		function _has(obj, key) {
			return Object.prototype.hasOwnProperty.call(obj, key);
		}
		exports2.assign = function(obj) {
			var sources = Array.prototype.slice.call(arguments, 1);
			while (sources.length) {
				var source = sources.shift();
				if (!source) continue;
				if (typeof source !== "object") throw new TypeError(source + "must be non-object");
				for (var p in source) if (_has(source, p)) obj[p] = source[p];
			}
			return obj;
		};
		exports2.shrinkBuf = function(buf, size) {
			if (buf.length === size) return buf;
			if (buf.subarray) return buf.subarray(0, size);
			buf.length = size;
			return buf;
		};
		var fnTyped = {
			arraySet: function(dest, src, src_offs, len, dest_offs) {
				if (src.subarray && dest.subarray) {
					dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
					return;
				}
				for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
			},
			flattenChunks: function(chunks) {
				var i, l, len = 0, pos, chunk, result;
				for (i = 0, l = chunks.length; i < l; i++) len += chunks[i].length;
				result = new Uint8Array(len);
				pos = 0;
				for (i = 0, l = chunks.length; i < l; i++) {
					chunk = chunks[i];
					result.set(chunk, pos);
					pos += chunk.length;
				}
				return result;
			}
		};
		var fnUntyped = {
			arraySet: function(dest, src, src_offs, len, dest_offs) {
				for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
			},
			flattenChunks: function(chunks) {
				return [].concat.apply([], chunks);
			}
		};
		exports2.setTyped = function(on) {
			if (on) {
				exports2.Buf8 = Uint8Array;
				exports2.Buf16 = Uint16Array;
				exports2.Buf32 = Int32Array;
				exports2.assign(exports2, fnTyped);
			} else {
				exports2.Buf8 = Array;
				exports2.Buf16 = Array;
				exports2.Buf32 = Array;
				exports2.assign(exports2, fnUntyped);
			}
		};
		exports2.setTyped(TYPED_OK);
	} });
	var require_trees = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/trees.js"(exports2) {
		"use strict";
		init_browser_globals();
		var utils2 = require_common();
		var Z_FIXED = 4;
		var Z_BINARY = 0;
		var Z_TEXT = 1;
		var Z_UNKNOWN = 2;
		function zero(buf) {
			var len = buf.length;
			while (--len >= 0) buf[len] = 0;
		}
		var STORED_BLOCK = 0;
		var STATIC_TREES = 1;
		var DYN_TREES = 2;
		var MIN_MATCH = 3;
		var MAX_MATCH = 258;
		var LENGTH_CODES = 29;
		var LITERALS = 256;
		var L_CODES = LITERALS + 1 + LENGTH_CODES;
		var D_CODES = 30;
		var BL_CODES = 19;
		var HEAP_SIZE = 2 * L_CODES + 1;
		var MAX_BITS = 15;
		var Buf_size = 16;
		var MAX_BL_BITS = 7;
		var END_BLOCK = 256;
		var REP_3_6 = 16;
		var REPZ_3_10 = 17;
		var REPZ_11_138 = 18;
		var extra_lbits = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			2,
			2,
			2,
			2,
			3,
			3,
			3,
			3,
			4,
			4,
			4,
			4,
			5,
			5,
			5,
			5,
			0
		];
		var extra_dbits = [
			0,
			0,
			0,
			0,
			1,
			1,
			2,
			2,
			3,
			3,
			4,
			4,
			5,
			5,
			6,
			6,
			7,
			7,
			8,
			8,
			9,
			9,
			10,
			10,
			11,
			11,
			12,
			12,
			13,
			13
		];
		var extra_blbits = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			2,
			3,
			7
		];
		var bl_order = [
			16,
			17,
			18,
			0,
			8,
			7,
			9,
			6,
			10,
			5,
			11,
			4,
			12,
			3,
			13,
			2,
			14,
			1,
			15
		];
		var DIST_CODE_LEN = 512;
		var static_ltree = new Array((L_CODES + 2) * 2);
		zero(static_ltree);
		var static_dtree = new Array(D_CODES * 2);
		zero(static_dtree);
		var _dist_code = new Array(DIST_CODE_LEN);
		zero(_dist_code);
		var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
		zero(_length_code);
		var base_length = new Array(LENGTH_CODES);
		zero(base_length);
		var base_dist = new Array(D_CODES);
		zero(base_dist);
		function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
			this.static_tree = static_tree;
			this.extra_bits = extra_bits;
			this.extra_base = extra_base;
			this.elems = elems;
			this.max_length = max_length;
			this.has_stree = static_tree && static_tree.length;
		}
		var static_l_desc;
		var static_d_desc;
		var static_bl_desc;
		function TreeDesc(dyn_tree, stat_desc) {
			this.dyn_tree = dyn_tree;
			this.max_code = 0;
			this.stat_desc = stat_desc;
		}
		function d_code(dist) {
			return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
		}
		function put_short(s, w) {
			s.pending_buf[s.pending++] = w & 255;
			s.pending_buf[s.pending++] = w >>> 8 & 255;
		}
		function send_bits(s, value, length) {
			if (s.bi_valid > Buf_size - length) {
				s.bi_buf |= value << s.bi_valid & 65535;
				put_short(s, s.bi_buf);
				s.bi_buf = value >> Buf_size - s.bi_valid;
				s.bi_valid += length - Buf_size;
			} else {
				s.bi_buf |= value << s.bi_valid & 65535;
				s.bi_valid += length;
			}
		}
		function send_code(s, c, tree) {
			send_bits(s, tree[c * 2], tree[c * 2 + 1]);
		}
		function bi_reverse(code, len) {
			var res = 0;
			do {
				res |= code & 1;
				code >>>= 1;
				res <<= 1;
			} while (--len > 0);
			return res >>> 1;
		}
		function bi_flush(s) {
			if (s.bi_valid === 16) {
				put_short(s, s.bi_buf);
				s.bi_buf = 0;
				s.bi_valid = 0;
			} else if (s.bi_valid >= 8) {
				s.pending_buf[s.pending++] = s.bi_buf & 255;
				s.bi_buf >>= 8;
				s.bi_valid -= 8;
			}
		}
		function gen_bitlen(s, desc) {
			var tree = desc.dyn_tree;
			var max_code = desc.max_code;
			var stree = desc.stat_desc.static_tree;
			var has_stree = desc.stat_desc.has_stree;
			var extra = desc.stat_desc.extra_bits;
			var base = desc.stat_desc.extra_base;
			var max_length = desc.stat_desc.max_length;
			var h;
			var n, m;
			var bits;
			var xbits;
			var f;
			var overflow = 0;
			for (bits = 0; bits <= MAX_BITS; bits++) s.bl_count[bits] = 0;
			tree[s.heap[s.heap_max] * 2 + 1] = 0;
			for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
				n = s.heap[h];
				bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
				if (bits > max_length) {
					bits = max_length;
					overflow++;
				}
				tree[n * 2 + 1] = bits;
				if (n > max_code) continue;
				s.bl_count[bits]++;
				xbits = 0;
				if (n >= base) xbits = extra[n - base];
				f = tree[n * 2];
				s.opt_len += f * (bits + xbits);
				if (has_stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
			}
			if (overflow === 0) return;
			do {
				bits = max_length - 1;
				while (s.bl_count[bits] === 0) bits--;
				s.bl_count[bits]--;
				s.bl_count[bits + 1] += 2;
				s.bl_count[max_length]--;
				overflow -= 2;
			} while (overflow > 0);
			for (bits = max_length; bits !== 0; bits--) {
				n = s.bl_count[bits];
				while (n !== 0) {
					m = s.heap[--h];
					if (m > max_code) continue;
					if (tree[m * 2 + 1] !== bits) {
						s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
						tree[m * 2 + 1] = bits;
					}
					n--;
				}
			}
		}
		function gen_codes(tree, max_code, bl_count) {
			var next_code = new Array(MAX_BITS + 1);
			var code = 0;
			var bits;
			var n;
			for (bits = 1; bits <= MAX_BITS; bits++) next_code[bits] = code = code + bl_count[bits - 1] << 1;
			for (n = 0; n <= max_code; n++) {
				var len = tree[n * 2 + 1];
				if (len === 0) continue;
				tree[n * 2] = bi_reverse(next_code[len]++, len);
			}
		}
		function tr_static_init() {
			var n;
			var bits;
			var length;
			var code;
			var dist;
			var bl_count = new Array(MAX_BITS + 1);
			length = 0;
			for (code = 0; code < LENGTH_CODES - 1; code++) {
				base_length[code] = length;
				for (n = 0; n < 1 << extra_lbits[code]; n++) _length_code[length++] = code;
			}
			_length_code[length - 1] = code;
			dist = 0;
			for (code = 0; code < 16; code++) {
				base_dist[code] = dist;
				for (n = 0; n < 1 << extra_dbits[code]; n++) _dist_code[dist++] = code;
			}
			dist >>= 7;
			for (; code < D_CODES; code++) {
				base_dist[code] = dist << 7;
				for (n = 0; n < 1 << extra_dbits[code] - 7; n++) _dist_code[256 + dist++] = code;
			}
			for (bits = 0; bits <= MAX_BITS; bits++) bl_count[bits] = 0;
			n = 0;
			while (n <= 143) {
				static_ltree[n * 2 + 1] = 8;
				n++;
				bl_count[8]++;
			}
			while (n <= 255) {
				static_ltree[n * 2 + 1] = 9;
				n++;
				bl_count[9]++;
			}
			while (n <= 279) {
				static_ltree[n * 2 + 1] = 7;
				n++;
				bl_count[7]++;
			}
			while (n <= 287) {
				static_ltree[n * 2 + 1] = 8;
				n++;
				bl_count[8]++;
			}
			gen_codes(static_ltree, L_CODES + 1, bl_count);
			for (n = 0; n < D_CODES; n++) {
				static_dtree[n * 2 + 1] = 5;
				static_dtree[n * 2] = bi_reverse(n, 5);
			}
			static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
			static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
			static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
		}
		function init_block(s) {
			var n;
			for (n = 0; n < L_CODES; n++) s.dyn_ltree[n * 2] = 0;
			for (n = 0; n < D_CODES; n++) s.dyn_dtree[n * 2] = 0;
			for (n = 0; n < BL_CODES; n++) s.bl_tree[n * 2] = 0;
			s.dyn_ltree[END_BLOCK * 2] = 1;
			s.opt_len = s.static_len = 0;
			s.last_lit = s.matches = 0;
		}
		function bi_windup(s) {
			if (s.bi_valid > 8) put_short(s, s.bi_buf);
			else if (s.bi_valid > 0) s.pending_buf[s.pending++] = s.bi_buf;
			s.bi_buf = 0;
			s.bi_valid = 0;
		}
		function copy_block(s, buf, len, header) {
			bi_windup(s);
			if (header) {
				put_short(s, len);
				put_short(s, ~len);
			}
			utils2.arraySet(s.pending_buf, s.window, buf, len, s.pending);
			s.pending += len;
		}
		function smaller(tree, n, m, depth) {
			var _n2 = n * 2;
			var _m2 = m * 2;
			return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
		}
		function pqdownheap(s, tree, k) {
			var v = s.heap[k];
			var j = k << 1;
			while (j <= s.heap_len) {
				if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) j++;
				if (smaller(tree, v, s.heap[j], s.depth)) break;
				s.heap[k] = s.heap[j];
				k = j;
				j <<= 1;
			}
			s.heap[k] = v;
		}
		function compress_block(s, ltree, dtree) {
			var dist;
			var lc;
			var lx = 0;
			var code;
			var extra;
			if (s.last_lit !== 0) do {
				dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
				lc = s.pending_buf[s.l_buf + lx];
				lx++;
				if (dist === 0) send_code(s, lc, ltree);
				else {
					code = _length_code[lc];
					send_code(s, code + LITERALS + 1, ltree);
					extra = extra_lbits[code];
					if (extra !== 0) {
						lc -= base_length[code];
						send_bits(s, lc, extra);
					}
					dist--;
					code = d_code(dist);
					send_code(s, code, dtree);
					extra = extra_dbits[code];
					if (extra !== 0) {
						dist -= base_dist[code];
						send_bits(s, dist, extra);
					}
				}
			} while (lx < s.last_lit);
			send_code(s, END_BLOCK, ltree);
		}
		function build_tree(s, desc) {
			var tree = desc.dyn_tree;
			var stree = desc.stat_desc.static_tree;
			var has_stree = desc.stat_desc.has_stree;
			var elems = desc.stat_desc.elems;
			var n, m;
			var max_code = -1;
			var node;
			s.heap_len = 0;
			s.heap_max = HEAP_SIZE;
			for (n = 0; n < elems; n++) if (tree[n * 2] !== 0) {
				s.heap[++s.heap_len] = max_code = n;
				s.depth[n] = 0;
			} else tree[n * 2 + 1] = 0;
			while (s.heap_len < 2) {
				node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
				tree[node * 2] = 1;
				s.depth[node] = 0;
				s.opt_len--;
				if (has_stree) s.static_len -= stree[node * 2 + 1];
			}
			desc.max_code = max_code;
			for (n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
			node = elems;
			do {
				n = s.heap[1];
				s.heap[1] = s.heap[s.heap_len--];
				pqdownheap(s, tree, 1);
				m = s.heap[1];
				s.heap[--s.heap_max] = n;
				s.heap[--s.heap_max] = m;
				tree[node * 2] = tree[n * 2] + tree[m * 2];
				s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
				tree[n * 2 + 1] = tree[m * 2 + 1] = node;
				s.heap[1] = node++;
				pqdownheap(s, tree, 1);
			} while (s.heap_len >= 2);
			s.heap[--s.heap_max] = s.heap[1];
			gen_bitlen(s, desc);
			gen_codes(tree, max_code, s.bl_count);
		}
		function scan_tree(s, tree, max_code) {
			var n;
			var prevlen = -1;
			var curlen;
			var nextlen = tree[1];
			var count = 0;
			var max_count = 7;
			var min_count = 4;
			if (nextlen === 0) {
				max_count = 138;
				min_count = 3;
			}
			tree[(max_code + 1) * 2 + 1] = 65535;
			for (n = 0; n <= max_code; n++) {
				curlen = nextlen;
				nextlen = tree[(n + 1) * 2 + 1];
				if (++count < max_count && curlen === nextlen) continue;
				else if (count < min_count) s.bl_tree[curlen * 2] += count;
				else if (curlen !== 0) {
					if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
					s.bl_tree[REP_3_6 * 2]++;
				} else if (count <= 10) s.bl_tree[REPZ_3_10 * 2]++;
				else s.bl_tree[REPZ_11_138 * 2]++;
				count = 0;
				prevlen = curlen;
				if (nextlen === 0) {
					max_count = 138;
					min_count = 3;
				} else if (curlen === nextlen) {
					max_count = 6;
					min_count = 3;
				} else {
					max_count = 7;
					min_count = 4;
				}
			}
		}
		function send_tree(s, tree, max_code) {
			var n;
			var prevlen = -1;
			var curlen;
			var nextlen = tree[1];
			var count = 0;
			var max_count = 7;
			var min_count = 4;
			if (nextlen === 0) {
				max_count = 138;
				min_count = 3;
			}
			for (n = 0; n <= max_code; n++) {
				curlen = nextlen;
				nextlen = tree[(n + 1) * 2 + 1];
				if (++count < max_count && curlen === nextlen) continue;
				else if (count < min_count) do
					send_code(s, curlen, s.bl_tree);
				while (--count !== 0);
				else if (curlen !== 0) {
					if (curlen !== prevlen) {
						send_code(s, curlen, s.bl_tree);
						count--;
					}
					send_code(s, REP_3_6, s.bl_tree);
					send_bits(s, count - 3, 2);
				} else if (count <= 10) {
					send_code(s, REPZ_3_10, s.bl_tree);
					send_bits(s, count - 3, 3);
				} else {
					send_code(s, REPZ_11_138, s.bl_tree);
					send_bits(s, count - 11, 7);
				}
				count = 0;
				prevlen = curlen;
				if (nextlen === 0) {
					max_count = 138;
					min_count = 3;
				} else if (curlen === nextlen) {
					max_count = 6;
					min_count = 3;
				} else {
					max_count = 7;
					min_count = 4;
				}
			}
		}
		function build_bl_tree(s) {
			var max_blindex;
			scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
			scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
			build_tree(s, s.bl_desc);
			for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) break;
			s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
			return max_blindex;
		}
		function send_all_trees(s, lcodes, dcodes, blcodes) {
			var rank;
			send_bits(s, lcodes - 257, 5);
			send_bits(s, dcodes - 1, 5);
			send_bits(s, blcodes - 4, 4);
			for (rank = 0; rank < blcodes; rank++) send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
			send_tree(s, s.dyn_ltree, lcodes - 1);
			send_tree(s, s.dyn_dtree, dcodes - 1);
		}
		function detect_data_type(s) {
			var black_mask = 4093624447;
			var n;
			for (n = 0; n <= 31; n++, black_mask >>>= 1) if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) return Z_BINARY;
			if (s.dyn_ltree[18] !== 0 || s.dyn_ltree[20] !== 0 || s.dyn_ltree[26] !== 0) return Z_TEXT;
			for (n = 32; n < LITERALS; n++) if (s.dyn_ltree[n * 2] !== 0) return Z_TEXT;
			return Z_BINARY;
		}
		var static_init_done = false;
		function _tr_init(s) {
			if (!static_init_done) {
				tr_static_init();
				static_init_done = true;
			}
			s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
			s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
			s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
			s.bi_buf = 0;
			s.bi_valid = 0;
			init_block(s);
		}
		function _tr_stored_block(s, buf, stored_len, last) {
			send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
			copy_block(s, buf, stored_len, true);
		}
		function _tr_align(s) {
			send_bits(s, STATIC_TREES << 1, 3);
			send_code(s, END_BLOCK, static_ltree);
			bi_flush(s);
		}
		function _tr_flush_block(s, buf, stored_len, last) {
			var opt_lenb, static_lenb;
			var max_blindex = 0;
			if (s.level > 0) {
				if (s.strm.data_type === Z_UNKNOWN) s.strm.data_type = detect_data_type(s);
				build_tree(s, s.l_desc);
				build_tree(s, s.d_desc);
				max_blindex = build_bl_tree(s);
				opt_lenb = s.opt_len + 3 + 7 >>> 3;
				static_lenb = s.static_len + 3 + 7 >>> 3;
				if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
			} else opt_lenb = static_lenb = stored_len + 5;
			if (stored_len + 4 <= opt_lenb && buf !== -1) _tr_stored_block(s, buf, stored_len, last);
			else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
				send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
				compress_block(s, static_ltree, static_dtree);
			} else {
				send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
				send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
				compress_block(s, s.dyn_ltree, s.dyn_dtree);
			}
			init_block(s);
			if (last) bi_windup(s);
		}
		function _tr_tally(s, dist, lc) {
			s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
			s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
			s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
			s.last_lit++;
			if (dist === 0) s.dyn_ltree[lc * 2]++;
			else {
				s.matches++;
				dist--;
				s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
				s.dyn_dtree[d_code(dist) * 2]++;
			}
			return s.last_lit === s.lit_bufsize - 1;
		}
		exports2._tr_init = _tr_init;
		exports2._tr_stored_block = _tr_stored_block;
		exports2._tr_flush_block = _tr_flush_block;
		exports2._tr_tally = _tr_tally;
		exports2._tr_align = _tr_align;
	} });
	var require_adler32 = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/adler32.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function adler32(adler, buf, len, pos) {
			var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
			while (len !== 0) {
				n = len > 2e3 ? 2e3 : len;
				len -= n;
				do {
					s1 = s1 + buf[pos++] | 0;
					s2 = s2 + s1 | 0;
				} while (--n);
				s1 %= 65521;
				s2 %= 65521;
			}
			return s1 | s2 << 16 | 0;
		}
		module2.exports = adler32;
	} });
	var require_crc32 = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/crc32.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		function makeTable() {
			var c, table = [];
			for (var n = 0; n < 256; n++) {
				c = n;
				for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
				table[n] = c;
			}
			return table;
		}
		var crcTable = makeTable();
		function crc32(crc, buf, len, pos) {
			var t = crcTable, end = pos + len;
			crc ^= -1;
			for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
			return crc ^ -1;
		}
		module2.exports = crc32;
	} });
	var require_messages = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/messages.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = {
			2: "need dictionary",
			1: "stream end",
			0: "",
			"-1": "file error",
			"-2": "stream error",
			"-3": "data error",
			"-4": "insufficient memory",
			"-5": "buffer error",
			"-6": "incompatible version"
		};
	} });
	var require_deflate = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/deflate.js"(exports2) {
		"use strict";
		init_browser_globals();
		var utils2 = require_common();
		var trees = require_trees();
		var adler32 = require_adler32();
		var crc32 = require_crc32();
		var msg = require_messages();
		var Z_NO_FLUSH = 0;
		var Z_PARTIAL_FLUSH = 1;
		var Z_FULL_FLUSH = 3;
		var Z_FINISH = 4;
		var Z_BLOCK = 5;
		var Z_OK = 0;
		var Z_STREAM_END = 1;
		var Z_STREAM_ERROR = -2;
		var Z_DATA_ERROR = -3;
		var Z_BUF_ERROR = -5;
		var Z_DEFAULT_COMPRESSION = -1;
		var Z_FILTERED = 1;
		var Z_HUFFMAN_ONLY = 2;
		var Z_RLE = 3;
		var Z_FIXED = 4;
		var Z_DEFAULT_STRATEGY = 0;
		var Z_UNKNOWN = 2;
		var Z_DEFLATED = 8;
		var MAX_MEM_LEVEL = 9;
		var MAX_WBITS = 15;
		var DEF_MEM_LEVEL = 8;
		var L_CODES = 286;
		var D_CODES = 30;
		var BL_CODES = 19;
		var HEAP_SIZE = 2 * L_CODES + 1;
		var MAX_BITS = 15;
		var MIN_MATCH = 3;
		var MAX_MATCH = 258;
		var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
		var PRESET_DICT = 32;
		var INIT_STATE = 42;
		var EXTRA_STATE = 69;
		var NAME_STATE = 73;
		var COMMENT_STATE = 91;
		var HCRC_STATE = 103;
		var BUSY_STATE = 113;
		var FINISH_STATE = 666;
		var BS_NEED_MORE = 1;
		var BS_BLOCK_DONE = 2;
		var BS_FINISH_STARTED = 3;
		var BS_FINISH_DONE = 4;
		var OS_CODE = 3;
		function err(strm, errorCode) {
			strm.msg = msg[errorCode];
			return errorCode;
		}
		function rank(f) {
			return (f << 1) - (f > 4 ? 9 : 0);
		}
		function zero(buf) {
			var len = buf.length;
			while (--len >= 0) buf[len] = 0;
		}
		function flush_pending(strm) {
			var s = strm.state;
			var len = s.pending;
			if (len > strm.avail_out) len = strm.avail_out;
			if (len === 0) return;
			utils2.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
			strm.next_out += len;
			s.pending_out += len;
			strm.total_out += len;
			strm.avail_out -= len;
			s.pending -= len;
			if (s.pending === 0) s.pending_out = 0;
		}
		function flush_block_only(s, last) {
			trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
			s.block_start = s.strstart;
			flush_pending(s.strm);
		}
		function put_byte(s, b) {
			s.pending_buf[s.pending++] = b;
		}
		function putShortMSB(s, b) {
			s.pending_buf[s.pending++] = b >>> 8 & 255;
			s.pending_buf[s.pending++] = b & 255;
		}
		function read_buf(strm, buf, start, size) {
			var len = strm.avail_in;
			if (len > size) len = size;
			if (len === 0) return 0;
			strm.avail_in -= len;
			utils2.arraySet(buf, strm.input, strm.next_in, len, start);
			if (strm.state.wrap === 1) strm.adler = adler32(strm.adler, buf, len, start);
			else if (strm.state.wrap === 2) strm.adler = crc32(strm.adler, buf, len, start);
			strm.next_in += len;
			strm.total_in += len;
			return len;
		}
		function longest_match(s, cur_match) {
			var chain_length = s.max_chain_length;
			var scan = s.strstart;
			var match;
			var len;
			var best_len = s.prev_length;
			var nice_match = s.nice_match;
			var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
			var _win = s.window;
			var wmask = s.w_mask;
			var prev = s.prev;
			var strend = s.strstart + MAX_MATCH;
			var scan_end1 = _win[scan + best_len - 1];
			var scan_end = _win[scan + best_len];
			if (s.prev_length >= s.good_match) chain_length >>= 2;
			if (nice_match > s.lookahead) nice_match = s.lookahead;
			do {
				match = cur_match;
				if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) continue;
				scan += 2;
				match++;
				do				;
while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
				len = MAX_MATCH - (strend - scan);
				scan = strend - MAX_MATCH;
				if (len > best_len) {
					s.match_start = cur_match;
					best_len = len;
					if (len >= nice_match) break;
					scan_end1 = _win[scan + best_len - 1];
					scan_end = _win[scan + best_len];
				}
			} while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
			if (best_len <= s.lookahead) return best_len;
			return s.lookahead;
		}
		function fill_window(s) {
			var _w_size = s.w_size;
			var p, n, m, more, str;
			do {
				more = s.window_size - s.lookahead - s.strstart;
				if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
					utils2.arraySet(s.window, s.window, _w_size, _w_size, 0);
					s.match_start -= _w_size;
					s.strstart -= _w_size;
					s.block_start -= _w_size;
					n = s.hash_size;
					p = n;
					do {
						m = s.head[--p];
						s.head[p] = m >= _w_size ? m - _w_size : 0;
					} while (--n);
					n = _w_size;
					p = n;
					do {
						m = s.prev[--p];
						s.prev[p] = m >= _w_size ? m - _w_size : 0;
					} while (--n);
					more += _w_size;
				}
				if (s.strm.avail_in === 0) break;
				n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
				s.lookahead += n;
				if (s.lookahead + s.insert >= MIN_MATCH) {
					str = s.strstart - s.insert;
					s.ins_h = s.window[str];
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
					while (s.insert) {
						s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
						s.prev[str & s.w_mask] = s.head[s.ins_h];
						s.head[s.ins_h] = str;
						str++;
						s.insert--;
						if (s.lookahead + s.insert < MIN_MATCH) break;
					}
				}
			} while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
		}
		function deflate_stored(s, flush) {
			var max_block_size = 65535;
			if (max_block_size > s.pending_buf_size - 5) max_block_size = s.pending_buf_size - 5;
			for (;;) {
				if (s.lookahead <= 1) {
					fill_window(s);
					if (s.lookahead === 0 && flush === Z_NO_FLUSH) return BS_NEED_MORE;
					if (s.lookahead === 0) break;
				}
				s.strstart += s.lookahead;
				s.lookahead = 0;
				var max_start = s.block_start + max_block_size;
				if (s.strstart === 0 || s.strstart >= max_start) {
					s.lookahead = s.strstart - max_start;
					s.strstart = max_start;
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
				if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
			}
			s.insert = 0;
			if (flush === Z_FINISH) {
				flush_block_only(s, true);
				if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
				return BS_FINISH_DONE;
			}
			if (s.strstart > s.block_start) {
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			return BS_NEED_MORE;
		}
		function deflate_fast(s, flush) {
			var hash_head;
			var bflush;
			for (;;) {
				if (s.lookahead < MIN_LOOKAHEAD) {
					fill_window(s);
					if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
					if (s.lookahead === 0) break;
				}
				hash_head = 0;
				if (s.lookahead >= MIN_MATCH) {
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
					hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
					s.head[s.ins_h] = s.strstart;
				}
				if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) s.match_length = longest_match(s, hash_head);
				if (s.match_length >= MIN_MATCH) {
					bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
					s.lookahead -= s.match_length;
					if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
						s.match_length--;
						do {
							s.strstart++;
							s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
							hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
							s.head[s.ins_h] = s.strstart;
						} while (--s.match_length !== 0);
						s.strstart++;
					} else {
						s.strstart += s.match_length;
						s.match_length = 0;
						s.ins_h = s.window[s.strstart];
						s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
					}
				} else {
					bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
					s.lookahead--;
					s.strstart++;
				}
				if (bflush) {
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
			}
			s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
			if (flush === Z_FINISH) {
				flush_block_only(s, true);
				if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
				return BS_FINISH_DONE;
			}
			if (s.last_lit) {
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			return BS_BLOCK_DONE;
		}
		function deflate_slow(s, flush) {
			var hash_head;
			var bflush;
			var max_insert;
			for (;;) {
				if (s.lookahead < MIN_LOOKAHEAD) {
					fill_window(s);
					if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
					if (s.lookahead === 0) break;
				}
				hash_head = 0;
				if (s.lookahead >= MIN_MATCH) {
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
					hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
					s.head[s.ins_h] = s.strstart;
				}
				s.prev_length = s.match_length;
				s.prev_match = s.match_start;
				s.match_length = MIN_MATCH - 1;
				if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
					s.match_length = longest_match(s, hash_head);
					if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) s.match_length = MIN_MATCH - 1;
				}
				if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
					max_insert = s.strstart + s.lookahead - MIN_MATCH;
					bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
					s.lookahead -= s.prev_length - 1;
					s.prev_length -= 2;
					do
						if (++s.strstart <= max_insert) {
							s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
							hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
							s.head[s.ins_h] = s.strstart;
						}
					while (--s.prev_length !== 0);
					s.match_available = 0;
					s.match_length = MIN_MATCH - 1;
					s.strstart++;
					if (bflush) {
						flush_block_only(s, false);
						if (s.strm.avail_out === 0) return BS_NEED_MORE;
					}
				} else if (s.match_available) {
					bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
					if (bflush) flush_block_only(s, false);
					s.strstart++;
					s.lookahead--;
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				} else {
					s.match_available = 1;
					s.strstart++;
					s.lookahead--;
				}
			}
			if (s.match_available) {
				bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
				s.match_available = 0;
			}
			s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
			if (flush === Z_FINISH) {
				flush_block_only(s, true);
				if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
				return BS_FINISH_DONE;
			}
			if (s.last_lit) {
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			return BS_BLOCK_DONE;
		}
		function deflate_rle(s, flush) {
			var bflush;
			var prev;
			var scan, strend;
			var _win = s.window;
			for (;;) {
				if (s.lookahead <= MAX_MATCH) {
					fill_window(s);
					if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) return BS_NEED_MORE;
					if (s.lookahead === 0) break;
				}
				s.match_length = 0;
				if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
					scan = s.strstart - 1;
					prev = _win[scan];
					if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
						strend = s.strstart + MAX_MATCH;
						do						;
while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
						s.match_length = MAX_MATCH - (strend - scan);
						if (s.match_length > s.lookahead) s.match_length = s.lookahead;
					}
				}
				if (s.match_length >= MIN_MATCH) {
					bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
					s.lookahead -= s.match_length;
					s.strstart += s.match_length;
					s.match_length = 0;
				} else {
					bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
					s.lookahead--;
					s.strstart++;
				}
				if (bflush) {
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
			}
			s.insert = 0;
			if (flush === Z_FINISH) {
				flush_block_only(s, true);
				if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
				return BS_FINISH_DONE;
			}
			if (s.last_lit) {
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			return BS_BLOCK_DONE;
		}
		function deflate_huff(s, flush) {
			var bflush;
			for (;;) {
				if (s.lookahead === 0) {
					fill_window(s);
					if (s.lookahead === 0) {
						if (flush === Z_NO_FLUSH) return BS_NEED_MORE;
						break;
					}
				}
				s.match_length = 0;
				bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
				s.lookahead--;
				s.strstart++;
				if (bflush) {
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
			}
			s.insert = 0;
			if (flush === Z_FINISH) {
				flush_block_only(s, true);
				if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
				return BS_FINISH_DONE;
			}
			if (s.last_lit) {
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			return BS_BLOCK_DONE;
		}
		function Config(good_length, max_lazy, nice_length, max_chain, func) {
			this.good_length = good_length;
			this.max_lazy = max_lazy;
			this.nice_length = nice_length;
			this.max_chain = max_chain;
			this.func = func;
		}
		var configuration_table = [
			new Config(0, 0, 0, 0, deflate_stored),
			new Config(4, 4, 8, 4, deflate_fast),
			new Config(4, 5, 16, 8, deflate_fast),
			new Config(4, 6, 32, 32, deflate_fast),
			new Config(4, 4, 16, 16, deflate_slow),
			new Config(8, 16, 32, 32, deflate_slow),
			new Config(8, 16, 128, 128, deflate_slow),
			new Config(8, 32, 128, 256, deflate_slow),
			new Config(32, 128, 258, 1024, deflate_slow),
			new Config(32, 258, 258, 4096, deflate_slow)
		];
		function lm_init(s) {
			s.window_size = 2 * s.w_size;
			zero(s.head);
			s.max_lazy_match = configuration_table[s.level].max_lazy;
			s.good_match = configuration_table[s.level].good_length;
			s.nice_match = configuration_table[s.level].nice_length;
			s.max_chain_length = configuration_table[s.level].max_chain;
			s.strstart = 0;
			s.block_start = 0;
			s.lookahead = 0;
			s.insert = 0;
			s.match_length = s.prev_length = MIN_MATCH - 1;
			s.match_available = 0;
			s.ins_h = 0;
		}
		function DeflateState() {
			this.strm = null;
			this.status = 0;
			this.pending_buf = null;
			this.pending_buf_size = 0;
			this.pending_out = 0;
			this.pending = 0;
			this.wrap = 0;
			this.gzhead = null;
			this.gzindex = 0;
			this.method = Z_DEFLATED;
			this.last_flush = -1;
			this.w_size = 0;
			this.w_bits = 0;
			this.w_mask = 0;
			this.window = null;
			this.window_size = 0;
			this.prev = null;
			this.head = null;
			this.ins_h = 0;
			this.hash_size = 0;
			this.hash_bits = 0;
			this.hash_mask = 0;
			this.hash_shift = 0;
			this.block_start = 0;
			this.match_length = 0;
			this.prev_match = 0;
			this.match_available = 0;
			this.strstart = 0;
			this.match_start = 0;
			this.lookahead = 0;
			this.prev_length = 0;
			this.max_chain_length = 0;
			this.max_lazy_match = 0;
			this.level = 0;
			this.strategy = 0;
			this.good_match = 0;
			this.nice_match = 0;
			this.dyn_ltree = new utils2.Buf16(HEAP_SIZE * 2);
			this.dyn_dtree = new utils2.Buf16((2 * D_CODES + 1) * 2);
			this.bl_tree = new utils2.Buf16((2 * BL_CODES + 1) * 2);
			zero(this.dyn_ltree);
			zero(this.dyn_dtree);
			zero(this.bl_tree);
			this.l_desc = null;
			this.d_desc = null;
			this.bl_desc = null;
			this.bl_count = new utils2.Buf16(MAX_BITS + 1);
			this.heap = new utils2.Buf16(2 * L_CODES + 1);
			zero(this.heap);
			this.heap_len = 0;
			this.heap_max = 0;
			this.depth = new utils2.Buf16(2 * L_CODES + 1);
			zero(this.depth);
			this.l_buf = 0;
			this.lit_bufsize = 0;
			this.last_lit = 0;
			this.d_buf = 0;
			this.opt_len = 0;
			this.static_len = 0;
			this.matches = 0;
			this.insert = 0;
			this.bi_buf = 0;
			this.bi_valid = 0;
		}
		function deflateResetKeep(strm) {
			var s;
			if (!strm || !strm.state) return err(strm, Z_STREAM_ERROR);
			strm.total_in = strm.total_out = 0;
			strm.data_type = Z_UNKNOWN;
			s = strm.state;
			s.pending = 0;
			s.pending_out = 0;
			if (s.wrap < 0) s.wrap = -s.wrap;
			s.status = s.wrap ? INIT_STATE : BUSY_STATE;
			strm.adler = s.wrap === 2 ? 0 : 1;
			s.last_flush = Z_NO_FLUSH;
			trees._tr_init(s);
			return Z_OK;
		}
		function deflateReset(strm) {
			var ret = deflateResetKeep(strm);
			if (ret === Z_OK) lm_init(strm.state);
			return ret;
		}
		function deflateSetHeader(strm, head) {
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			if (strm.state.wrap !== 2) return Z_STREAM_ERROR;
			strm.state.gzhead = head;
			return Z_OK;
		}
		function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
			if (!strm) return Z_STREAM_ERROR;
			var wrap = 1;
			if (level === Z_DEFAULT_COMPRESSION) level = 6;
			if (windowBits < 0) {
				wrap = 0;
				windowBits = -windowBits;
			} else if (windowBits > 15) {
				wrap = 2;
				windowBits -= 16;
			}
			if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) return err(strm, Z_STREAM_ERROR);
			if (windowBits === 8) windowBits = 9;
			var s = new DeflateState();
			strm.state = s;
			s.strm = strm;
			s.wrap = wrap;
			s.gzhead = null;
			s.w_bits = windowBits;
			s.w_size = 1 << s.w_bits;
			s.w_mask = s.w_size - 1;
			s.hash_bits = memLevel + 7;
			s.hash_size = 1 << s.hash_bits;
			s.hash_mask = s.hash_size - 1;
			s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
			s.window = new utils2.Buf8(s.w_size * 2);
			s.head = new utils2.Buf16(s.hash_size);
			s.prev = new utils2.Buf16(s.w_size);
			s.lit_bufsize = 1 << memLevel + 6;
			s.pending_buf_size = s.lit_bufsize * 4;
			s.pending_buf = new utils2.Buf8(s.pending_buf_size);
			s.d_buf = 1 * s.lit_bufsize;
			s.l_buf = 3 * s.lit_bufsize;
			s.level = level;
			s.strategy = strategy;
			s.method = method;
			return deflateReset(strm);
		}
		function deflateInit(strm, level) {
			return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
		}
		function deflate(strm, flush) {
			var old_flush, s;
			var beg, val;
			if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
			s = strm.state;
			if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
			s.strm = strm;
			old_flush = s.last_flush;
			s.last_flush = flush;
			if (s.status === INIT_STATE) if (s.wrap === 2) {
				strm.adler = 0;
				put_byte(s, 31);
				put_byte(s, 139);
				put_byte(s, 8);
				if (!s.gzhead) {
					put_byte(s, 0);
					put_byte(s, 0);
					put_byte(s, 0);
					put_byte(s, 0);
					put_byte(s, 0);
					put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
					put_byte(s, OS_CODE);
					s.status = BUSY_STATE;
				} else {
					put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
					put_byte(s, s.gzhead.time & 255);
					put_byte(s, s.gzhead.time >> 8 & 255);
					put_byte(s, s.gzhead.time >> 16 & 255);
					put_byte(s, s.gzhead.time >> 24 & 255);
					put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
					put_byte(s, s.gzhead.os & 255);
					if (s.gzhead.extra && s.gzhead.extra.length) {
						put_byte(s, s.gzhead.extra.length & 255);
						put_byte(s, s.gzhead.extra.length >> 8 & 255);
					}
					if (s.gzhead.hcrc) strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
					s.gzindex = 0;
					s.status = EXTRA_STATE;
				}
			} else {
				var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
				var level_flags = -1;
				if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) level_flags = 0;
				else if (s.level < 6) level_flags = 1;
				else if (s.level === 6) level_flags = 2;
				else level_flags = 3;
				header |= level_flags << 6;
				if (s.strstart !== 0) header |= PRESET_DICT;
				header += 31 - header % 31;
				s.status = BUSY_STATE;
				putShortMSB(s, header);
				if (s.strstart !== 0) {
					putShortMSB(s, strm.adler >>> 16);
					putShortMSB(s, strm.adler & 65535);
				}
				strm.adler = 1;
			}
			if (s.status === EXTRA_STATE) if (s.gzhead.extra) {
				beg = s.pending;
				while (s.gzindex < (s.gzhead.extra.length & 65535)) {
					if (s.pending === s.pending_buf_size) {
						if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
						flush_pending(strm);
						beg = s.pending;
						if (s.pending === s.pending_buf_size) break;
					}
					put_byte(s, s.gzhead.extra[s.gzindex] & 255);
					s.gzindex++;
				}
				if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
				if (s.gzindex === s.gzhead.extra.length) {
					s.gzindex = 0;
					s.status = NAME_STATE;
				}
			} else s.status = NAME_STATE;
			if (s.status === NAME_STATE) if (s.gzhead.name) {
				beg = s.pending;
				do {
					if (s.pending === s.pending_buf_size) {
						if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
						flush_pending(strm);
						beg = s.pending;
						if (s.pending === s.pending_buf_size) {
							val = 1;
							break;
						}
					}
					if (s.gzindex < s.gzhead.name.length) val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
					else val = 0;
					put_byte(s, val);
				} while (val !== 0);
				if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
				if (val === 0) {
					s.gzindex = 0;
					s.status = COMMENT_STATE;
				}
			} else s.status = COMMENT_STATE;
			if (s.status === COMMENT_STATE) if (s.gzhead.comment) {
				beg = s.pending;
				do {
					if (s.pending === s.pending_buf_size) {
						if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
						flush_pending(strm);
						beg = s.pending;
						if (s.pending === s.pending_buf_size) {
							val = 1;
							break;
						}
					}
					if (s.gzindex < s.gzhead.comment.length) val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
					else val = 0;
					put_byte(s, val);
				} while (val !== 0);
				if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
				if (val === 0) s.status = HCRC_STATE;
			} else s.status = HCRC_STATE;
			if (s.status === HCRC_STATE) if (s.gzhead.hcrc) {
				if (s.pending + 2 > s.pending_buf_size) flush_pending(strm);
				if (s.pending + 2 <= s.pending_buf_size) {
					put_byte(s, strm.adler & 255);
					put_byte(s, strm.adler >> 8 & 255);
					strm.adler = 0;
					s.status = BUSY_STATE;
				}
			} else s.status = BUSY_STATE;
			if (s.pending !== 0) {
				flush_pending(strm);
				if (strm.avail_out === 0) {
					s.last_flush = -1;
					return Z_OK;
				}
			} else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) return err(strm, Z_BUF_ERROR);
			if (s.status === FINISH_STATE && strm.avail_in !== 0) return err(strm, Z_BUF_ERROR);
			if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
				var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
				if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) s.status = FINISH_STATE;
				if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
					if (strm.avail_out === 0) s.last_flush = -1;
					return Z_OK;
				}
				if (bstate === BS_BLOCK_DONE) {
					if (flush === Z_PARTIAL_FLUSH) trees._tr_align(s);
					else if (flush !== Z_BLOCK) {
						trees._tr_stored_block(s, 0, 0, false);
						if (flush === Z_FULL_FLUSH) {
							zero(s.head);
							if (s.lookahead === 0) {
								s.strstart = 0;
								s.block_start = 0;
								s.insert = 0;
							}
						}
					}
					flush_pending(strm);
					if (strm.avail_out === 0) {
						s.last_flush = -1;
						return Z_OK;
					}
				}
			}
			if (flush !== Z_FINISH) return Z_OK;
			if (s.wrap <= 0) return Z_STREAM_END;
			if (s.wrap === 2) {
				put_byte(s, strm.adler & 255);
				put_byte(s, strm.adler >> 8 & 255);
				put_byte(s, strm.adler >> 16 & 255);
				put_byte(s, strm.adler >> 24 & 255);
				put_byte(s, strm.total_in & 255);
				put_byte(s, strm.total_in >> 8 & 255);
				put_byte(s, strm.total_in >> 16 & 255);
				put_byte(s, strm.total_in >> 24 & 255);
			} else {
				putShortMSB(s, strm.adler >>> 16);
				putShortMSB(s, strm.adler & 65535);
			}
			flush_pending(strm);
			if (s.wrap > 0) s.wrap = -s.wrap;
			return s.pending !== 0 ? Z_OK : Z_STREAM_END;
		}
		function deflateEnd(strm) {
			var status;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			status = strm.state.status;
			if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) return err(strm, Z_STREAM_ERROR);
			strm.state = null;
			return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
		}
		function deflateSetDictionary(strm, dictionary) {
			var dictLength = dictionary.length;
			var s;
			var str, n;
			var wrap;
			var avail;
			var next;
			var input;
			var tmpDict;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			s = strm.state;
			wrap = s.wrap;
			if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) return Z_STREAM_ERROR;
			if (wrap === 1) strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
			s.wrap = 0;
			if (dictLength >= s.w_size) {
				if (wrap === 0) {
					zero(s.head);
					s.strstart = 0;
					s.block_start = 0;
					s.insert = 0;
				}
				tmpDict = new utils2.Buf8(s.w_size);
				utils2.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
				dictionary = tmpDict;
				dictLength = s.w_size;
			}
			avail = strm.avail_in;
			next = strm.next_in;
			input = strm.input;
			strm.avail_in = dictLength;
			strm.next_in = 0;
			strm.input = dictionary;
			fill_window(s);
			while (s.lookahead >= MIN_MATCH) {
				str = s.strstart;
				n = s.lookahead - (MIN_MATCH - 1);
				do {
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
					s.prev[str & s.w_mask] = s.head[s.ins_h];
					s.head[s.ins_h] = str;
					str++;
				} while (--n);
				s.strstart = str;
				s.lookahead = MIN_MATCH - 1;
				fill_window(s);
			}
			s.strstart += s.lookahead;
			s.block_start = s.strstart;
			s.insert = s.lookahead;
			s.lookahead = 0;
			s.match_length = s.prev_length = MIN_MATCH - 1;
			s.match_available = 0;
			strm.next_in = next;
			strm.input = input;
			strm.avail_in = avail;
			s.wrap = wrap;
			return Z_OK;
		}
		exports2.deflateInit = deflateInit;
		exports2.deflateInit2 = deflateInit2;
		exports2.deflateReset = deflateReset;
		exports2.deflateResetKeep = deflateResetKeep;
		exports2.deflateSetHeader = deflateSetHeader;
		exports2.deflate = deflate;
		exports2.deflateEnd = deflateEnd;
		exports2.deflateSetDictionary = deflateSetDictionary;
		exports2.deflateInfo = "pako deflate (from Nodeca project)";
	} });
	var require_inffast = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inffast.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var BAD = 30;
		var TYPE = 12;
		module2.exports = function inflate_fast(strm, start) {
			var state;
			var _in;
			var last;
			var _out;
			var beg;
			var end;
			var dmax;
			var wsize;
			var whave;
			var wnext;
			var s_window;
			var hold;
			var bits;
			var lcode;
			var dcode;
			var lmask;
			var dmask;
			var here;
			var op;
			var len;
			var dist;
			var from;
			var from_source;
			var input, output;
			state = strm.state;
			_in = strm.next_in;
			input = strm.input;
			last = _in + (strm.avail_in - 5);
			_out = strm.next_out;
			output = strm.output;
			beg = _out - (start - strm.avail_out);
			end = _out + (strm.avail_out - 257);
			dmax = state.dmax;
			wsize = state.wsize;
			whave = state.whave;
			wnext = state.wnext;
			s_window = state.window;
			hold = state.hold;
			bits = state.bits;
			lcode = state.lencode;
			dcode = state.distcode;
			lmask = (1 << state.lenbits) - 1;
			dmask = (1 << state.distbits) - 1;
			top: do {
				if (bits < 15) {
					hold += input[_in++] << bits;
					bits += 8;
					hold += input[_in++] << bits;
					bits += 8;
				}
				here = lcode[hold & lmask];
				dolen: for (;;) {
					op = here >>> 24;
					hold >>>= op;
					bits -= op;
					op = here >>> 16 & 255;
					if (op === 0) output[_out++] = here & 65535;
					else if (op & 16) {
						len = here & 65535;
						op &= 15;
						if (op) {
							if (bits < op) {
								hold += input[_in++] << bits;
								bits += 8;
							}
							len += hold & (1 << op) - 1;
							hold >>>= op;
							bits -= op;
						}
						if (bits < 15) {
							hold += input[_in++] << bits;
							bits += 8;
							hold += input[_in++] << bits;
							bits += 8;
						}
						here = dcode[hold & dmask];
						dodist: for (;;) {
							op = here >>> 24;
							hold >>>= op;
							bits -= op;
							op = here >>> 16 & 255;
							if (op & 16) {
								dist = here & 65535;
								op &= 15;
								if (bits < op) {
									hold += input[_in++] << bits;
									bits += 8;
									if (bits < op) {
										hold += input[_in++] << bits;
										bits += 8;
									}
								}
								dist += hold & (1 << op) - 1;
								if (dist > dmax) {
									strm.msg = "invalid distance too far back";
									state.mode = BAD;
									break top;
								}
								hold >>>= op;
								bits -= op;
								op = _out - beg;
								if (dist > op) {
									op = dist - op;
									if (op > whave) {
										if (state.sane) {
											strm.msg = "invalid distance too far back";
											state.mode = BAD;
											break top;
										}
									}
									from = 0;
									from_source = s_window;
									if (wnext === 0) {
										from += wsize - op;
										if (op < len) {
											len -= op;
											do
												output[_out++] = s_window[from++];
											while (--op);
											from = _out - dist;
											from_source = output;
										}
									} else if (wnext < op) {
										from += wsize + wnext - op;
										op -= wnext;
										if (op < len) {
											len -= op;
											do
												output[_out++] = s_window[from++];
											while (--op);
											from = 0;
											if (wnext < len) {
												op = wnext;
												len -= op;
												do
													output[_out++] = s_window[from++];
												while (--op);
												from = _out - dist;
												from_source = output;
											}
										}
									} else {
										from += wnext - op;
										if (op < len) {
											len -= op;
											do
												output[_out++] = s_window[from++];
											while (--op);
											from = _out - dist;
											from_source = output;
										}
									}
									while (len > 2) {
										output[_out++] = from_source[from++];
										output[_out++] = from_source[from++];
										output[_out++] = from_source[from++];
										len -= 3;
									}
									if (len) {
										output[_out++] = from_source[from++];
										if (len > 1) output[_out++] = from_source[from++];
									}
								} else {
									from = _out - dist;
									do {
										output[_out++] = output[from++];
										output[_out++] = output[from++];
										output[_out++] = output[from++];
										len -= 3;
									} while (len > 2);
									if (len) {
										output[_out++] = output[from++];
										if (len > 1) output[_out++] = output[from++];
									}
								}
							} else if ((op & 64) === 0) {
								here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
								continue dodist;
							} else {
								strm.msg = "invalid distance code";
								state.mode = BAD;
								break top;
							}
							break;
						}
					} else if ((op & 64) === 0) {
						here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
						continue dolen;
					} else if (op & 32) {
						state.mode = TYPE;
						break top;
					} else {
						strm.msg = "invalid literal/length code";
						state.mode = BAD;
						break top;
					}
					break;
				}
			} while (_in < last && _out < end);
			len = bits >> 3;
			_in -= len;
			bits -= len << 3;
			hold &= (1 << bits) - 1;
			strm.next_in = _in;
			strm.next_out = _out;
			strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
			strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
			state.hold = hold;
			state.bits = bits;
		};
	} });
	var require_inftrees = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inftrees.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var utils2 = require_common();
		var MAXBITS = 15;
		var ENOUGH_LENS = 852;
		var ENOUGH_DISTS = 592;
		var CODES = 0;
		var LENS = 1;
		var DISTS = 2;
		var lbase = [
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10,
			11,
			13,
			15,
			17,
			19,
			23,
			27,
			31,
			35,
			43,
			51,
			59,
			67,
			83,
			99,
			115,
			131,
			163,
			195,
			227,
			258,
			0,
			0
		];
		var lext = [
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			17,
			17,
			17,
			17,
			18,
			18,
			18,
			18,
			19,
			19,
			19,
			19,
			20,
			20,
			20,
			20,
			21,
			21,
			21,
			21,
			16,
			72,
			78
		];
		var dbase = [
			1,
			2,
			3,
			4,
			5,
			7,
			9,
			13,
			17,
			25,
			33,
			49,
			65,
			97,
			129,
			193,
			257,
			385,
			513,
			769,
			1025,
			1537,
			2049,
			3073,
			4097,
			6145,
			8193,
			12289,
			16385,
			24577,
			0,
			0
		];
		var dext = [
			16,
			16,
			16,
			16,
			17,
			17,
			18,
			18,
			19,
			19,
			20,
			20,
			21,
			21,
			22,
			22,
			23,
			23,
			24,
			24,
			25,
			25,
			26,
			26,
			27,
			27,
			28,
			28,
			29,
			29,
			64,
			64
		];
		module2.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
			var bits = opts.bits;
			var len = 0;
			var sym = 0;
			var min = 0, max = 0;
			var root = 0;
			var curr = 0;
			var drop = 0;
			var left = 0;
			var used = 0;
			var huff = 0;
			var incr;
			var fill;
			var low;
			var mask;
			var next;
			var base = null;
			var base_index = 0;
			var end;
			var count = new utils2.Buf16(MAXBITS + 1);
			var offs = new utils2.Buf16(MAXBITS + 1);
			var extra = null;
			var extra_index = 0;
			var here_bits, here_op, here_val;
			for (len = 0; len <= MAXBITS; len++) count[len] = 0;
			for (sym = 0; sym < codes; sym++) count[lens[lens_index + sym]]++;
			root = bits;
			for (max = MAXBITS; max >= 1; max--) if (count[max] !== 0) break;
			if (root > max) root = max;
			if (max === 0) {
				table[table_index++] = 20971520;
				table[table_index++] = 20971520;
				opts.bits = 1;
				return 0;
			}
			for (min = 1; min < max; min++) if (count[min] !== 0) break;
			if (root < min) root = min;
			left = 1;
			for (len = 1; len <= MAXBITS; len++) {
				left <<= 1;
				left -= count[len];
				if (left < 0) return -1;
			}
			if (left > 0 && (type === CODES || max !== 1)) return -1;
			offs[1] = 0;
			for (len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + count[len];
			for (sym = 0; sym < codes; sym++) if (lens[lens_index + sym] !== 0) work[offs[lens[lens_index + sym]]++] = sym;
			if (type === CODES) {
				base = extra = work;
				end = 19;
			} else if (type === LENS) {
				base = lbase;
				base_index -= 257;
				extra = lext;
				extra_index -= 257;
				end = 256;
			} else {
				base = dbase;
				extra = dext;
				end = -1;
			}
			huff = 0;
			sym = 0;
			len = min;
			next = table_index;
			curr = root;
			drop = 0;
			low = -1;
			used = 1 << root;
			mask = used - 1;
			if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
			for (;;) {
				here_bits = len - drop;
				if (work[sym] < end) {
					here_op = 0;
					here_val = work[sym];
				} else if (work[sym] > end) {
					here_op = extra[extra_index + work[sym]];
					here_val = base[base_index + work[sym]];
				} else {
					here_op = 96;
					here_val = 0;
				}
				incr = 1 << len - drop;
				fill = 1 << curr;
				min = fill;
				do {
					fill -= incr;
					table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
				} while (fill !== 0);
				incr = 1 << len - 1;
				while (huff & incr) incr >>= 1;
				if (incr !== 0) {
					huff &= incr - 1;
					huff += incr;
				} else huff = 0;
				sym++;
				if (--count[len] === 0) {
					if (len === max) break;
					len = lens[lens_index + work[sym]];
				}
				if (len > root && (huff & mask) !== low) {
					if (drop === 0) drop = root;
					next += min;
					curr = len - drop;
					left = 1 << curr;
					while (curr + drop < max) {
						left -= count[curr + drop];
						if (left <= 0) break;
						curr++;
						left <<= 1;
					}
					used += 1 << curr;
					if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
					low = huff & mask;
					table[low] = root << 24 | curr << 16 | next - table_index | 0;
				}
			}
			if (huff !== 0) table[next + huff] = len - drop << 24 | 4194304;
			opts.bits = root;
			return 0;
		};
	} });
	var require_inflate = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inflate.js"(exports2) {
		"use strict";
		init_browser_globals();
		var utils2 = require_common();
		var adler32 = require_adler32();
		var crc32 = require_crc32();
		var inflate_fast = require_inffast();
		var inflate_table = require_inftrees();
		var CODES = 0;
		var LENS = 1;
		var DISTS = 2;
		var Z_FINISH = 4;
		var Z_BLOCK = 5;
		var Z_TREES = 6;
		var Z_OK = 0;
		var Z_STREAM_END = 1;
		var Z_NEED_DICT = 2;
		var Z_STREAM_ERROR = -2;
		var Z_DATA_ERROR = -3;
		var Z_MEM_ERROR = -4;
		var Z_BUF_ERROR = -5;
		var Z_DEFLATED = 8;
		var HEAD = 1;
		var FLAGS = 2;
		var TIME = 3;
		var OS = 4;
		var EXLEN = 5;
		var EXTRA = 6;
		var NAME = 7;
		var COMMENT = 8;
		var HCRC = 9;
		var DICTID = 10;
		var DICT = 11;
		var TYPE = 12;
		var TYPEDO = 13;
		var STORED = 14;
		var COPY_ = 15;
		var COPY = 16;
		var TABLE = 17;
		var LENLENS = 18;
		var CODELENS = 19;
		var LEN_ = 20;
		var LEN = 21;
		var LENEXT = 22;
		var DIST = 23;
		var DISTEXT = 24;
		var MATCH = 25;
		var LIT = 26;
		var CHECK = 27;
		var LENGTH = 28;
		var DONE = 29;
		var BAD = 30;
		var MEM = 31;
		var SYNC = 32;
		var ENOUGH_LENS = 852;
		var ENOUGH_DISTS = 592;
		var DEF_WBITS = 15;
		function zswap32(q) {
			return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
		}
		function InflateState() {
			this.mode = 0;
			this.last = false;
			this.wrap = 0;
			this.havedict = false;
			this.flags = 0;
			this.dmax = 0;
			this.check = 0;
			this.total = 0;
			this.head = null;
			this.wbits = 0;
			this.wsize = 0;
			this.whave = 0;
			this.wnext = 0;
			this.window = null;
			this.hold = 0;
			this.bits = 0;
			this.length = 0;
			this.offset = 0;
			this.extra = 0;
			this.lencode = null;
			this.distcode = null;
			this.lenbits = 0;
			this.distbits = 0;
			this.ncode = 0;
			this.nlen = 0;
			this.ndist = 0;
			this.have = 0;
			this.next = null;
			this.lens = new utils2.Buf16(320);
			this.work = new utils2.Buf16(288);
			this.lendyn = null;
			this.distdyn = null;
			this.sane = 0;
			this.back = 0;
			this.was = 0;
		}
		function inflateResetKeep(strm) {
			var state;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			state = strm.state;
			strm.total_in = strm.total_out = state.total = 0;
			strm.msg = "";
			if (state.wrap) strm.adler = state.wrap & 1;
			state.mode = HEAD;
			state.last = 0;
			state.havedict = 0;
			state.dmax = 32768;
			state.head = null;
			state.hold = 0;
			state.bits = 0;
			state.lencode = state.lendyn = new utils2.Buf32(ENOUGH_LENS);
			state.distcode = state.distdyn = new utils2.Buf32(ENOUGH_DISTS);
			state.sane = 1;
			state.back = -1;
			return Z_OK;
		}
		function inflateReset(strm) {
			var state;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			state = strm.state;
			state.wsize = 0;
			state.whave = 0;
			state.wnext = 0;
			return inflateResetKeep(strm);
		}
		function inflateReset2(strm, windowBits) {
			var wrap;
			var state;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			state = strm.state;
			if (windowBits < 0) {
				wrap = 0;
				windowBits = -windowBits;
			} else {
				wrap = (windowBits >> 4) + 1;
				if (windowBits < 48) windowBits &= 15;
			}
			if (windowBits && (windowBits < 8 || windowBits > 15)) return Z_STREAM_ERROR;
			if (state.window !== null && state.wbits !== windowBits) state.window = null;
			state.wrap = wrap;
			state.wbits = windowBits;
			return inflateReset(strm);
		}
		function inflateInit2(strm, windowBits) {
			var ret;
			var state;
			if (!strm) return Z_STREAM_ERROR;
			state = new InflateState();
			strm.state = state;
			state.window = null;
			ret = inflateReset2(strm, windowBits);
			if (ret !== Z_OK) strm.state = null;
			return ret;
		}
		function inflateInit(strm) {
			return inflateInit2(strm, DEF_WBITS);
		}
		var virgin = true;
		var lenfix;
		var distfix;
		function fixedtables(state) {
			if (virgin) {
				var sym;
				lenfix = new utils2.Buf32(512);
				distfix = new utils2.Buf32(32);
				sym = 0;
				while (sym < 144) state.lens[sym++] = 8;
				while (sym < 256) state.lens[sym++] = 9;
				while (sym < 280) state.lens[sym++] = 7;
				while (sym < 288) state.lens[sym++] = 8;
				inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
				sym = 0;
				while (sym < 32) state.lens[sym++] = 5;
				inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
				virgin = false;
			}
			state.lencode = lenfix;
			state.lenbits = 9;
			state.distcode = distfix;
			state.distbits = 5;
		}
		function updatewindow(strm, src, end, copy) {
			var dist;
			var state = strm.state;
			if (state.window === null) {
				state.wsize = 1 << state.wbits;
				state.wnext = 0;
				state.whave = 0;
				state.window = new utils2.Buf8(state.wsize);
			}
			if (copy >= state.wsize) {
				utils2.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
				state.wnext = 0;
				state.whave = state.wsize;
			} else {
				dist = state.wsize - state.wnext;
				if (dist > copy) dist = copy;
				utils2.arraySet(state.window, src, end - copy, dist, state.wnext);
				copy -= dist;
				if (copy) {
					utils2.arraySet(state.window, src, end - copy, copy, 0);
					state.wnext = copy;
					state.whave = state.wsize;
				} else {
					state.wnext += dist;
					if (state.wnext === state.wsize) state.wnext = 0;
					if (state.whave < state.wsize) state.whave += dist;
				}
			}
			return 0;
		}
		function inflate(strm, flush) {
			var state;
			var input, output;
			var next;
			var put;
			var have, left;
			var hold;
			var bits;
			var _in, _out;
			var copy;
			var from;
			var from_source;
			var here = 0;
			var here_bits, here_op, here_val;
			var last_bits, last_op, last_val;
			var len;
			var ret;
			var hbuf = new utils2.Buf8(4);
			var opts;
			var n;
			var order = [
				16,
				17,
				18,
				0,
				8,
				7,
				9,
				6,
				10,
				5,
				11,
				4,
				12,
				3,
				13,
				2,
				14,
				1,
				15
			];
			if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) return Z_STREAM_ERROR;
			state = strm.state;
			if (state.mode === TYPE) state.mode = TYPEDO;
			put = strm.next_out;
			output = strm.output;
			left = strm.avail_out;
			next = strm.next_in;
			input = strm.input;
			have = strm.avail_in;
			hold = state.hold;
			bits = state.bits;
			_in = have;
			_out = left;
			ret = Z_OK;
			inf_leave: for (;;) switch (state.mode) {
				case HEAD:
					if (state.wrap === 0) {
						state.mode = TYPEDO;
						break;
					}
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (state.wrap & 2 && hold === 35615) {
						state.check = 0;
						hbuf[0] = hold & 255;
						hbuf[1] = hold >>> 8 & 255;
						state.check = crc32(state.check, hbuf, 2, 0);
						hold = 0;
						bits = 0;
						state.mode = FLAGS;
						break;
					}
					state.flags = 0;
					if (state.head) state.head.done = false;
					if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
						strm.msg = "incorrect header check";
						state.mode = BAD;
						break;
					}
					if ((hold & 15) !== Z_DEFLATED) {
						strm.msg = "unknown compression method";
						state.mode = BAD;
						break;
					}
					hold >>>= 4;
					bits -= 4;
					len = (hold & 15) + 8;
					if (state.wbits === 0) state.wbits = len;
					else if (len > state.wbits) {
						strm.msg = "invalid window size";
						state.mode = BAD;
						break;
					}
					state.dmax = 1 << len;
					strm.adler = state.check = 1;
					state.mode = hold & 512 ? DICTID : TYPE;
					hold = 0;
					bits = 0;
					break;
				case FLAGS:
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.flags = hold;
					if ((state.flags & 255) !== Z_DEFLATED) {
						strm.msg = "unknown compression method";
						state.mode = BAD;
						break;
					}
					if (state.flags & 57344) {
						strm.msg = "unknown header flags set";
						state.mode = BAD;
						break;
					}
					if (state.head) state.head.text = hold >> 8 & 1;
					if (state.flags & 512) {
						hbuf[0] = hold & 255;
						hbuf[1] = hold >>> 8 & 255;
						state.check = crc32(state.check, hbuf, 2, 0);
					}
					hold = 0;
					bits = 0;
					state.mode = TIME;
				case TIME:
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (state.head) state.head.time = hold;
					if (state.flags & 512) {
						hbuf[0] = hold & 255;
						hbuf[1] = hold >>> 8 & 255;
						hbuf[2] = hold >>> 16 & 255;
						hbuf[3] = hold >>> 24 & 255;
						state.check = crc32(state.check, hbuf, 4, 0);
					}
					hold = 0;
					bits = 0;
					state.mode = OS;
				case OS:
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (state.head) {
						state.head.xflags = hold & 255;
						state.head.os = hold >> 8;
					}
					if (state.flags & 512) {
						hbuf[0] = hold & 255;
						hbuf[1] = hold >>> 8 & 255;
						state.check = crc32(state.check, hbuf, 2, 0);
					}
					hold = 0;
					bits = 0;
					state.mode = EXLEN;
				case EXLEN:
					if (state.flags & 1024) {
						while (bits < 16) {
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						state.length = hold;
						if (state.head) state.head.extra_len = hold;
						if (state.flags & 512) {
							hbuf[0] = hold & 255;
							hbuf[1] = hold >>> 8 & 255;
							state.check = crc32(state.check, hbuf, 2, 0);
						}
						hold = 0;
						bits = 0;
					} else if (state.head) state.head.extra = null;
					state.mode = EXTRA;
				case EXTRA:
					if (state.flags & 1024) {
						copy = state.length;
						if (copy > have) copy = have;
						if (copy) {
							if (state.head) {
								len = state.head.extra_len - state.length;
								if (!state.head.extra) state.head.extra = new Array(state.head.extra_len);
								utils2.arraySet(state.head.extra, input, next, copy, len);
							}
							if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
							have -= copy;
							next += copy;
							state.length -= copy;
						}
						if (state.length) break inf_leave;
					}
					state.length = 0;
					state.mode = NAME;
				case NAME:
					if (state.flags & 2048) {
						if (have === 0) break inf_leave;
						copy = 0;
						do {
							len = input[next + copy++];
							if (state.head && len && state.length < 65536) state.head.name += String.fromCharCode(len);
						} while (len && copy < have);
						if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
						have -= copy;
						next += copy;
						if (len) break inf_leave;
					} else if (state.head) state.head.name = null;
					state.length = 0;
					state.mode = COMMENT;
				case COMMENT:
					if (state.flags & 4096) {
						if (have === 0) break inf_leave;
						copy = 0;
						do {
							len = input[next + copy++];
							if (state.head && len && state.length < 65536) state.head.comment += String.fromCharCode(len);
						} while (len && copy < have);
						if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
						have -= copy;
						next += copy;
						if (len) break inf_leave;
					} else if (state.head) state.head.comment = null;
					state.mode = HCRC;
				case HCRC:
					if (state.flags & 512) {
						while (bits < 16) {
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						if (hold !== (state.check & 65535)) {
							strm.msg = "header crc mismatch";
							state.mode = BAD;
							break;
						}
						hold = 0;
						bits = 0;
					}
					if (state.head) {
						state.head.hcrc = state.flags >> 9 & 1;
						state.head.done = true;
					}
					strm.adler = state.check = 0;
					state.mode = TYPE;
					break;
				case DICTID:
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					strm.adler = state.check = zswap32(hold);
					hold = 0;
					bits = 0;
					state.mode = DICT;
				case DICT:
					if (state.havedict === 0) {
						strm.next_out = put;
						strm.avail_out = left;
						strm.next_in = next;
						strm.avail_in = have;
						state.hold = hold;
						state.bits = bits;
						return Z_NEED_DICT;
					}
					strm.adler = state.check = 1;
					state.mode = TYPE;
				case TYPE: if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
				case TYPEDO:
					if (state.last) {
						hold >>>= bits & 7;
						bits -= bits & 7;
						state.mode = CHECK;
						break;
					}
					while (bits < 3) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.last = hold & 1;
					hold >>>= 1;
					bits -= 1;
					switch (hold & 3) {
						case 0:
							state.mode = STORED;
							break;
						case 1:
							fixedtables(state);
							state.mode = LEN_;
							if (flush === Z_TREES) {
								hold >>>= 2;
								bits -= 2;
								break inf_leave;
							}
							break;
						case 2:
							state.mode = TABLE;
							break;
						case 3:
							strm.msg = "invalid block type";
							state.mode = BAD;
					}
					hold >>>= 2;
					bits -= 2;
					break;
				case STORED:
					hold >>>= bits & 7;
					bits -= bits & 7;
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
						strm.msg = "invalid stored block lengths";
						state.mode = BAD;
						break;
					}
					state.length = hold & 65535;
					hold = 0;
					bits = 0;
					state.mode = COPY_;
					if (flush === Z_TREES) break inf_leave;
				case COPY_: state.mode = COPY;
				case COPY:
					copy = state.length;
					if (copy) {
						if (copy > have) copy = have;
						if (copy > left) copy = left;
						if (copy === 0) break inf_leave;
						utils2.arraySet(output, input, next, copy, put);
						have -= copy;
						next += copy;
						left -= copy;
						put += copy;
						state.length -= copy;
						break;
					}
					state.mode = TYPE;
					break;
				case TABLE:
					while (bits < 14) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.nlen = (hold & 31) + 257;
					hold >>>= 5;
					bits -= 5;
					state.ndist = (hold & 31) + 1;
					hold >>>= 5;
					bits -= 5;
					state.ncode = (hold & 15) + 4;
					hold >>>= 4;
					bits -= 4;
					if (state.nlen > 286 || state.ndist > 30) {
						strm.msg = "too many length or distance symbols";
						state.mode = BAD;
						break;
					}
					state.have = 0;
					state.mode = LENLENS;
				case LENLENS:
					while (state.have < state.ncode) {
						while (bits < 3) {
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						state.lens[order[state.have++]] = hold & 7;
						hold >>>= 3;
						bits -= 3;
					}
					while (state.have < 19) state.lens[order[state.have++]] = 0;
					state.lencode = state.lendyn;
					state.lenbits = 7;
					opts = { bits: state.lenbits };
					ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
					state.lenbits = opts.bits;
					if (ret) {
						strm.msg = "invalid code lengths set";
						state.mode = BAD;
						break;
					}
					state.have = 0;
					state.mode = CODELENS;
				case CODELENS:
					while (state.have < state.nlen + state.ndist) {
						for (;;) {
							here = state.lencode[hold & (1 << state.lenbits) - 1];
							here_bits = here >>> 24;
							here_op = here >>> 16 & 255;
							here_val = here & 65535;
							if (here_bits <= bits) break;
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						if (here_val < 16) {
							hold >>>= here_bits;
							bits -= here_bits;
							state.lens[state.have++] = here_val;
						} else {
							if (here_val === 16) {
								n = here_bits + 2;
								while (bits < n) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								hold >>>= here_bits;
								bits -= here_bits;
								if (state.have === 0) {
									strm.msg = "invalid bit length repeat";
									state.mode = BAD;
									break;
								}
								len = state.lens[state.have - 1];
								copy = 3 + (hold & 3);
								hold >>>= 2;
								bits -= 2;
							} else if (here_val === 17) {
								n = here_bits + 3;
								while (bits < n) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								hold >>>= here_bits;
								bits -= here_bits;
								len = 0;
								copy = 3 + (hold & 7);
								hold >>>= 3;
								bits -= 3;
							} else {
								n = here_bits + 7;
								while (bits < n) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								hold >>>= here_bits;
								bits -= here_bits;
								len = 0;
								copy = 11 + (hold & 127);
								hold >>>= 7;
								bits -= 7;
							}
							if (state.have + copy > state.nlen + state.ndist) {
								strm.msg = "invalid bit length repeat";
								state.mode = BAD;
								break;
							}
							while (copy--) state.lens[state.have++] = len;
						}
					}
					if (state.mode === BAD) break;
					if (state.lens[256] === 0) {
						strm.msg = "invalid code -- missing end-of-block";
						state.mode = BAD;
						break;
					}
					state.lenbits = 9;
					opts = { bits: state.lenbits };
					ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
					state.lenbits = opts.bits;
					if (ret) {
						strm.msg = "invalid literal/lengths set";
						state.mode = BAD;
						break;
					}
					state.distbits = 6;
					state.distcode = state.distdyn;
					opts = { bits: state.distbits };
					ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
					state.distbits = opts.bits;
					if (ret) {
						strm.msg = "invalid distances set";
						state.mode = BAD;
						break;
					}
					state.mode = LEN_;
					if (flush === Z_TREES) break inf_leave;
				case LEN_: state.mode = LEN;
				case LEN:
					if (have >= 6 && left >= 258) {
						strm.next_out = put;
						strm.avail_out = left;
						strm.next_in = next;
						strm.avail_in = have;
						state.hold = hold;
						state.bits = bits;
						inflate_fast(strm, _out);
						put = strm.next_out;
						output = strm.output;
						left = strm.avail_out;
						next = strm.next_in;
						input = strm.input;
						have = strm.avail_in;
						hold = state.hold;
						bits = state.bits;
						if (state.mode === TYPE) state.back = -1;
						break;
					}
					state.back = 0;
					for (;;) {
						here = state.lencode[hold & (1 << state.lenbits) - 1];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (here_op && (here_op & 240) === 0) {
						last_bits = here_bits;
						last_op = here_op;
						last_val = here_val;
						for (;;) {
							here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
							here_bits = here >>> 24;
							here_op = here >>> 16 & 255;
							here_val = here & 65535;
							if (last_bits + here_bits <= bits) break;
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						hold >>>= last_bits;
						bits -= last_bits;
						state.back += last_bits;
					}
					hold >>>= here_bits;
					bits -= here_bits;
					state.back += here_bits;
					state.length = here_val;
					if (here_op === 0) {
						state.mode = LIT;
						break;
					}
					if (here_op & 32) {
						state.back = -1;
						state.mode = TYPE;
						break;
					}
					if (here_op & 64) {
						strm.msg = "invalid literal/length code";
						state.mode = BAD;
						break;
					}
					state.extra = here_op & 15;
					state.mode = LENEXT;
				case LENEXT:
					if (state.extra) {
						n = state.extra;
						while (bits < n) {
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						state.length += hold & (1 << state.extra) - 1;
						hold >>>= state.extra;
						bits -= state.extra;
						state.back += state.extra;
					}
					state.was = state.length;
					state.mode = DIST;
				case DIST:
					for (;;) {
						here = state.distcode[hold & (1 << state.distbits) - 1];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if ((here_op & 240) === 0) {
						last_bits = here_bits;
						last_op = here_op;
						last_val = here_val;
						for (;;) {
							here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
							here_bits = here >>> 24;
							here_op = here >>> 16 & 255;
							here_val = here & 65535;
							if (last_bits + here_bits <= bits) break;
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						hold >>>= last_bits;
						bits -= last_bits;
						state.back += last_bits;
					}
					hold >>>= here_bits;
					bits -= here_bits;
					state.back += here_bits;
					if (here_op & 64) {
						strm.msg = "invalid distance code";
						state.mode = BAD;
						break;
					}
					state.offset = here_val;
					state.extra = here_op & 15;
					state.mode = DISTEXT;
				case DISTEXT:
					if (state.extra) {
						n = state.extra;
						while (bits < n) {
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						state.offset += hold & (1 << state.extra) - 1;
						hold >>>= state.extra;
						bits -= state.extra;
						state.back += state.extra;
					}
					if (state.offset > state.dmax) {
						strm.msg = "invalid distance too far back";
						state.mode = BAD;
						break;
					}
					state.mode = MATCH;
				case MATCH:
					if (left === 0) break inf_leave;
					copy = _out - left;
					if (state.offset > copy) {
						copy = state.offset - copy;
						if (copy > state.whave) {
							if (state.sane) {
								strm.msg = "invalid distance too far back";
								state.mode = BAD;
								break;
							}
						}
						if (copy > state.wnext) {
							copy -= state.wnext;
							from = state.wsize - copy;
						} else from = state.wnext - copy;
						if (copy > state.length) copy = state.length;
						from_source = state.window;
					} else {
						from_source = output;
						from = put - state.offset;
						copy = state.length;
					}
					if (copy > left) copy = left;
					left -= copy;
					state.length -= copy;
					do
						output[put++] = from_source[from++];
					while (--copy);
					if (state.length === 0) state.mode = LEN;
					break;
				case LIT:
					if (left === 0) break inf_leave;
					output[put++] = state.length;
					left--;
					state.mode = LEN;
					break;
				case CHECK:
					if (state.wrap) {
						while (bits < 32) {
							if (have === 0) break inf_leave;
							have--;
							hold |= input[next++] << bits;
							bits += 8;
						}
						_out -= left;
						strm.total_out += _out;
						state.total += _out;
						if (_out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
						_out = left;
						if ((state.flags ? hold : zswap32(hold)) !== state.check) {
							strm.msg = "incorrect data check";
							state.mode = BAD;
							break;
						}
						hold = 0;
						bits = 0;
					}
					state.mode = LENGTH;
				case LENGTH:
					if (state.wrap && state.flags) {
						while (bits < 32) {
							if (have === 0) break inf_leave;
							have--;
							hold += input[next++] << bits;
							bits += 8;
						}
						if (hold !== (state.total & 4294967295)) {
							strm.msg = "incorrect length check";
							state.mode = BAD;
							break;
						}
						hold = 0;
						bits = 0;
					}
					state.mode = DONE;
				case DONE:
					ret = Z_STREAM_END;
					break inf_leave;
				case BAD:
					ret = Z_DATA_ERROR;
					break inf_leave;
				case MEM: return Z_MEM_ERROR;
				case SYNC:
				default: return Z_STREAM_ERROR;
			}
			strm.next_out = put;
			strm.avail_out = left;
			strm.next_in = next;
			strm.avail_in = have;
			state.hold = hold;
			state.bits = bits;
			if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
				if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
					state.mode = MEM;
					return Z_MEM_ERROR;
				}
			}
			_in -= strm.avail_in;
			_out -= strm.avail_out;
			strm.total_in += _in;
			strm.total_out += _out;
			state.total += _out;
			if (state.wrap && _out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
			strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
			if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) ret = Z_BUF_ERROR;
			return ret;
		}
		function inflateEnd(strm) {
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			var state = strm.state;
			if (state.window) state.window = null;
			strm.state = null;
			return Z_OK;
		}
		function inflateGetHeader(strm, head) {
			var state;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			state = strm.state;
			if ((state.wrap & 2) === 0) return Z_STREAM_ERROR;
			state.head = head;
			head.done = false;
			return Z_OK;
		}
		function inflateSetDictionary(strm, dictionary) {
			var dictLength = dictionary.length;
			var state;
			var dictid;
			var ret;
			if (!strm || !strm.state) return Z_STREAM_ERROR;
			state = strm.state;
			if (state.wrap !== 0 && state.mode !== DICT) return Z_STREAM_ERROR;
			if (state.mode === DICT) {
				dictid = 1;
				dictid = adler32(dictid, dictionary, dictLength, 0);
				if (dictid !== state.check) return Z_DATA_ERROR;
			}
			ret = updatewindow(strm, dictionary, dictLength, dictLength);
			if (ret) {
				state.mode = MEM;
				return Z_MEM_ERROR;
			}
			state.havedict = 1;
			return Z_OK;
		}
		exports2.inflateReset = inflateReset;
		exports2.inflateReset2 = inflateReset2;
		exports2.inflateResetKeep = inflateResetKeep;
		exports2.inflateInit = inflateInit;
		exports2.inflateInit2 = inflateInit2;
		exports2.inflate = inflate;
		exports2.inflateEnd = inflateEnd;
		exports2.inflateGetHeader = inflateGetHeader;
		exports2.inflateSetDictionary = inflateSetDictionary;
		exports2.inflateInfo = "pako inflate (from Nodeca project)";
	} });
	var require_constants = __commonJS({ "../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/constants.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		module2.exports = {
			Z_NO_FLUSH: 0,
			Z_PARTIAL_FLUSH: 1,
			Z_SYNC_FLUSH: 2,
			Z_FULL_FLUSH: 3,
			Z_FINISH: 4,
			Z_BLOCK: 5,
			Z_TREES: 6,
			Z_OK: 0,
			Z_STREAM_END: 1,
			Z_NEED_DICT: 2,
			Z_ERRNO: -1,
			Z_STREAM_ERROR: -2,
			Z_DATA_ERROR: -3,
			Z_BUF_ERROR: -5,
			Z_NO_COMPRESSION: 0,
			Z_BEST_SPEED: 1,
			Z_BEST_COMPRESSION: 9,
			Z_DEFAULT_COMPRESSION: -1,
			Z_FILTERED: 1,
			Z_HUFFMAN_ONLY: 2,
			Z_RLE: 3,
			Z_FIXED: 4,
			Z_DEFAULT_STRATEGY: 0,
			Z_BINARY: 0,
			Z_TEXT: 1,
			Z_UNKNOWN: 2,
			Z_DEFLATED: 8
		};
	} });
	var require_binding = __commonJS({ "../../../node_modules/.pnpm/browserify-zlib@0.2.0/node_modules/browserify-zlib/lib/binding.js"(exports2) {
		"use strict";
		init_browser_globals();
		var assert = require_assert();
		var Zstream = require_zstream();
		var zlib_deflate = require_deflate();
		var zlib_inflate = require_inflate();
		var constants = require_constants();
		for (key in constants) exports2[key] = constants[key];
		var key;
		exports2.NONE = 0;
		exports2.DEFLATE = 1;
		exports2.INFLATE = 2;
		exports2.GZIP = 3;
		exports2.GUNZIP = 4;
		exports2.DEFLATERAW = 5;
		exports2.INFLATERAW = 6;
		exports2.UNZIP = 7;
		var GZIP_HEADER_ID1 = 31;
		var GZIP_HEADER_ID2 = 139;
		function Zlib(mode) {
			if (typeof mode !== "number" || mode < exports2.DEFLATE || mode > exports2.UNZIP) throw new TypeError("Bad argument");
			this.dictionary = null;
			this.err = 0;
			this.flush = 0;
			this.init_done = false;
			this.level = 0;
			this.memLevel = 0;
			this.mode = mode;
			this.strategy = 0;
			this.windowBits = 0;
			this.write_in_progress = false;
			this.pending_close = false;
			this.gzip_id_bytes_read = 0;
		}
		Zlib.prototype.close = function() {
			if (this.write_in_progress) {
				this.pending_close = true;
				return;
			}
			this.pending_close = false;
			assert(this.init_done, "close before init");
			assert(this.mode <= exports2.UNZIP);
			if (this.mode === exports2.DEFLATE || this.mode === exports2.GZIP || this.mode === exports2.DEFLATERAW) zlib_deflate.deflateEnd(this.strm);
			else if (this.mode === exports2.INFLATE || this.mode === exports2.GUNZIP || this.mode === exports2.INFLATERAW || this.mode === exports2.UNZIP) zlib_inflate.inflateEnd(this.strm);
			this.mode = exports2.NONE;
			this.dictionary = null;
		};
		Zlib.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {
			return this._write(true, flush, input, in_off, in_len, out, out_off, out_len);
		};
		Zlib.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
			return this._write(false, flush, input, in_off, in_len, out, out_off, out_len);
		};
		Zlib.prototype._write = function(async, flush, input, in_off, in_len, out, out_off, out_len) {
			assert.equal(arguments.length, 8);
			assert(this.init_done, "write before init");
			assert(this.mode !== exports2.NONE, "already finalized");
			assert.equal(false, this.write_in_progress, "write already in progress");
			assert.equal(false, this.pending_close, "close is pending");
			this.write_in_progress = true;
			assert.equal(false, flush === void 0, "must provide flush value");
			this.write_in_progress = true;
			if (flush !== exports2.Z_NO_FLUSH && flush !== exports2.Z_PARTIAL_FLUSH && flush !== exports2.Z_SYNC_FLUSH && flush !== exports2.Z_FULL_FLUSH && flush !== exports2.Z_FINISH && flush !== exports2.Z_BLOCK) throw new Error("Invalid flush value");
			if (input == null) {
				input = import_buffer.Buffer.alloc(0);
				in_len = 0;
				in_off = 0;
			}
			this.strm.avail_in = in_len;
			this.strm.input = input;
			this.strm.next_in = in_off;
			this.strm.avail_out = out_len;
			this.strm.output = out;
			this.strm.next_out = out_off;
			this.flush = flush;
			if (!async) {
				this._process();
				if (this._checkError()) return this._afterSync();
				return;
			}
			var self2 = this;
			import_browser.default.nextTick(function() {
				self2._process();
				self2._after();
			});
			return this;
		};
		Zlib.prototype._afterSync = function() {
			var avail_out = this.strm.avail_out;
			var avail_in = this.strm.avail_in;
			this.write_in_progress = false;
			return [avail_in, avail_out];
		};
		Zlib.prototype._process = function() {
			var next_expected_header_byte = null;
			switch (this.mode) {
				case exports2.DEFLATE:
				case exports2.GZIP:
				case exports2.DEFLATERAW:
					this.err = zlib_deflate.deflate(this.strm, this.flush);
					break;
				case exports2.UNZIP:
					if (this.strm.avail_in > 0) next_expected_header_byte = this.strm.next_in;
					switch (this.gzip_id_bytes_read) {
						case 0:
							if (next_expected_header_byte === null) break;
							if (this.strm.input[next_expected_header_byte] === GZIP_HEADER_ID1) {
								this.gzip_id_bytes_read = 1;
								next_expected_header_byte++;
								if (this.strm.avail_in === 1) break;
							} else {
								this.mode = exports2.INFLATE;
								break;
							}
						case 1:
							if (next_expected_header_byte === null) break;
							if (this.strm.input[next_expected_header_byte] === GZIP_HEADER_ID2) {
								this.gzip_id_bytes_read = 2;
								this.mode = exports2.GUNZIP;
							} else this.mode = exports2.INFLATE;
							break;
						default: throw new Error("invalid number of gzip magic number bytes read");
					}
				case exports2.INFLATE:
				case exports2.GUNZIP:
				case exports2.INFLATERAW:
					this.err = zlib_inflate.inflate(this.strm, this.flush);
					if (this.err === exports2.Z_NEED_DICT && this.dictionary) {
						this.err = zlib_inflate.inflateSetDictionary(this.strm, this.dictionary);
						if (this.err === exports2.Z_OK) this.err = zlib_inflate.inflate(this.strm, this.flush);
						else if (this.err === exports2.Z_DATA_ERROR) this.err = exports2.Z_NEED_DICT;
					}
					while (this.strm.avail_in > 0 && this.mode === exports2.GUNZIP && this.err === exports2.Z_STREAM_END && this.strm.next_in[0] !== 0) {
						this.reset();
						this.err = zlib_inflate.inflate(this.strm, this.flush);
					}
					break;
				default: throw new Error("Unknown mode " + this.mode);
			}
		};
		Zlib.prototype._checkError = function() {
			switch (this.err) {
				case exports2.Z_OK:
				case exports2.Z_BUF_ERROR:
					if (this.strm.avail_out !== 0 && this.flush === exports2.Z_FINISH) {
						this._error("unexpected end of file");
						return false;
					}
					break;
				case exports2.Z_STREAM_END: break;
				case exports2.Z_NEED_DICT:
					if (this.dictionary == null) this._error("Missing dictionary");
					else this._error("Bad dictionary");
					return false;
				default:
					this._error("Zlib error");
					return false;
			}
			return true;
		};
		Zlib.prototype._after = function() {
			if (!this._checkError()) return;
			var avail_out = this.strm.avail_out;
			var avail_in = this.strm.avail_in;
			this.write_in_progress = false;
			this.callback(avail_in, avail_out);
			if (this.pending_close) this.close();
		};
		Zlib.prototype._error = function(message) {
			if (this.strm.msg) message = this.strm.msg;
			this.onerror(message, this.err);
			this.write_in_progress = false;
			if (this.pending_close) this.close();
		};
		Zlib.prototype.init = function(windowBits, level, memLevel, strategy, dictionary) {
			assert(arguments.length === 4 || arguments.length === 5, "init(windowBits, level, memLevel, strategy, [dictionary])");
			assert(windowBits >= 8 && windowBits <= 15, "invalid windowBits");
			assert(level >= -1 && level <= 9, "invalid compression level");
			assert(memLevel >= 1 && memLevel <= 9, "invalid memlevel");
			assert(strategy === exports2.Z_FILTERED || strategy === exports2.Z_HUFFMAN_ONLY || strategy === exports2.Z_RLE || strategy === exports2.Z_FIXED || strategy === exports2.Z_DEFAULT_STRATEGY, "invalid strategy");
			this._init(level, windowBits, memLevel, strategy, dictionary);
			this._setDictionary();
		};
		Zlib.prototype.params = function() {
			throw new Error("deflateParams Not supported");
		};
		Zlib.prototype.reset = function() {
			this._reset();
			this._setDictionary();
		};
		Zlib.prototype._init = function(level, windowBits, memLevel, strategy, dictionary) {
			this.level = level;
			this.windowBits = windowBits;
			this.memLevel = memLevel;
			this.strategy = strategy;
			this.flush = exports2.Z_NO_FLUSH;
			this.err = exports2.Z_OK;
			if (this.mode === exports2.GZIP || this.mode === exports2.GUNZIP) this.windowBits += 16;
			if (this.mode === exports2.UNZIP) this.windowBits += 32;
			if (this.mode === exports2.DEFLATERAW || this.mode === exports2.INFLATERAW) this.windowBits = -1 * this.windowBits;
			this.strm = new Zstream();
			switch (this.mode) {
				case exports2.DEFLATE:
				case exports2.GZIP:
				case exports2.DEFLATERAW:
					this.err = zlib_deflate.deflateInit2(this.strm, this.level, exports2.Z_DEFLATED, this.windowBits, this.memLevel, this.strategy);
					break;
				case exports2.INFLATE:
				case exports2.GUNZIP:
				case exports2.INFLATERAW:
				case exports2.UNZIP:
					this.err = zlib_inflate.inflateInit2(this.strm, this.windowBits);
					break;
				default: throw new Error("Unknown mode " + this.mode);
			}
			if (this.err !== exports2.Z_OK) this._error("Init error");
			this.dictionary = dictionary;
			this.write_in_progress = false;
			this.init_done = true;
		};
		Zlib.prototype._setDictionary = function() {
			if (this.dictionary == null) return;
			this.err = exports2.Z_OK;
			switch (this.mode) {
				case exports2.DEFLATE:
				case exports2.DEFLATERAW: this.err = zlib_deflate.deflateSetDictionary(this.strm, this.dictionary);
			}
			if (this.err !== exports2.Z_OK) this._error("Failed to set dictionary");
		};
		Zlib.prototype._reset = function() {
			this.err = exports2.Z_OK;
			switch (this.mode) {
				case exports2.DEFLATE:
				case exports2.DEFLATERAW:
				case exports2.GZIP:
					this.err = zlib_deflate.deflateReset(this.strm);
					break;
				case exports2.INFLATE:
				case exports2.INFLATERAW:
				case exports2.GUNZIP: this.err = zlib_inflate.inflateReset(this.strm);
			}
			if (this.err !== exports2.Z_OK) this._error("Failed to reset stream");
		};
		exports2.Zlib = Zlib;
	} });
	var require_lib = __commonJS({ "../../../node_modules/.pnpm/browserify-zlib@0.2.0/node_modules/browserify-zlib/lib/index.js"(exports2) {
		"use strict";
		init_browser_globals();
		var Buffer3 = require_buffer().Buffer;
		var Transform = require_stream_browserify().Transform;
		var binding = require_binding();
		var util2 = require_util();
		var assert = require_assert().ok;
		var kMaxLength = require_buffer().kMaxLength;
		var kRangeErrorMessage = "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes";
		binding.Z_MIN_WINDOWBITS = 8;
		binding.Z_MAX_WINDOWBITS = 15;
		binding.Z_DEFAULT_WINDOWBITS = 15;
		binding.Z_MIN_CHUNK = 64;
		binding.Z_MAX_CHUNK = Infinity;
		binding.Z_DEFAULT_CHUNK = 16384;
		binding.Z_MIN_MEMLEVEL = 1;
		binding.Z_MAX_MEMLEVEL = 9;
		binding.Z_DEFAULT_MEMLEVEL = 8;
		binding.Z_MIN_LEVEL = -1;
		binding.Z_MAX_LEVEL = 9;
		binding.Z_DEFAULT_LEVEL = binding.Z_DEFAULT_COMPRESSION;
		var bkeys = Object.keys(binding);
		for (bk = 0; bk < bkeys.length; bk++) {
			bkey = bkeys[bk];
			if (bkey.match(/^Z/)) Object.defineProperty(exports2, bkey, {
				enumerable: true,
				value: binding[bkey],
				writable: false
			});
		}
		var bkey;
		var bk;
		var codes = {
			Z_OK: binding.Z_OK,
			Z_STREAM_END: binding.Z_STREAM_END,
			Z_NEED_DICT: binding.Z_NEED_DICT,
			Z_ERRNO: binding.Z_ERRNO,
			Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
			Z_DATA_ERROR: binding.Z_DATA_ERROR,
			Z_MEM_ERROR: binding.Z_MEM_ERROR,
			Z_BUF_ERROR: binding.Z_BUF_ERROR,
			Z_VERSION_ERROR: binding.Z_VERSION_ERROR
		};
		var ckeys = Object.keys(codes);
		for (ck = 0; ck < ckeys.length; ck++) {
			ckey = ckeys[ck];
			codes[codes[ckey]] = ckey;
		}
		var ckey;
		var ck;
		Object.defineProperty(exports2, "codes", {
			enumerable: true,
			value: Object.freeze(codes),
			writable: false
		});
		exports2.Deflate = Deflate;
		exports2.Inflate = Inflate;
		exports2.Gzip = Gzip;
		exports2.Gunzip = Gunzip;
		exports2.DeflateRaw = DeflateRaw;
		exports2.InflateRaw = InflateRaw;
		exports2.Unzip = Unzip;
		exports2.createDeflate = function(o) {
			return new Deflate(o);
		};
		exports2.createInflate = function(o) {
			return new Inflate(o);
		};
		exports2.createDeflateRaw = function(o) {
			return new DeflateRaw(o);
		};
		exports2.createInflateRaw = function(o) {
			return new InflateRaw(o);
		};
		exports2.createGzip = function(o) {
			return new Gzip(o);
		};
		exports2.createGunzip = function(o) {
			return new Gunzip(o);
		};
		exports2.createUnzip = function(o) {
			return new Unzip(o);
		};
		exports2.deflate = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new Deflate(opts), buffer, callback);
		};
		exports2.deflateSync = function(buffer, opts) {
			return zlibBufferSync(new Deflate(opts), buffer);
		};
		exports2.gzip = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new Gzip(opts), buffer, callback);
		};
		exports2.gzipSync = function(buffer, opts) {
			return zlibBufferSync(new Gzip(opts), buffer);
		};
		exports2.deflateRaw = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new DeflateRaw(opts), buffer, callback);
		};
		exports2.deflateRawSync = function(buffer, opts) {
			return zlibBufferSync(new DeflateRaw(opts), buffer);
		};
		exports2.unzip = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new Unzip(opts), buffer, callback);
		};
		exports2.unzipSync = function(buffer, opts) {
			return zlibBufferSync(new Unzip(opts), buffer);
		};
		exports2.inflate = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new Inflate(opts), buffer, callback);
		};
		exports2.inflateSync = function(buffer, opts) {
			return zlibBufferSync(new Inflate(opts), buffer);
		};
		exports2.gunzip = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new Gunzip(opts), buffer, callback);
		};
		exports2.gunzipSync = function(buffer, opts) {
			return zlibBufferSync(new Gunzip(opts), buffer);
		};
		exports2.inflateRaw = function(buffer, opts, callback) {
			if (typeof opts === "function") {
				callback = opts;
				opts = {};
			}
			return zlibBuffer(new InflateRaw(opts), buffer, callback);
		};
		exports2.inflateRawSync = function(buffer, opts) {
			return zlibBufferSync(new InflateRaw(opts), buffer);
		};
		function zlibBuffer(engine, buffer, callback) {
			var buffers = [];
			var nread = 0;
			engine.on("error", onError);
			engine.on("end", onEnd);
			engine.end(buffer);
			flow();
			function flow() {
				var chunk;
				while (null !== (chunk = engine.read())) {
					buffers.push(chunk);
					nread += chunk.length;
				}
				engine.once("readable", flow);
			}
			function onError(err) {
				engine.removeListener("end", onEnd);
				engine.removeListener("readable", flow);
				callback(err);
			}
			function onEnd() {
				var buf;
				var err = null;
				if (nread >= kMaxLength) err = new RangeError(kRangeErrorMessage);
				else buf = Buffer3.concat(buffers, nread);
				buffers = [];
				engine.close();
				callback(err, buf);
			}
		}
		function zlibBufferSync(engine, buffer) {
			if (typeof buffer === "string") buffer = Buffer3.from(buffer);
			if (!Buffer3.isBuffer(buffer)) throw new TypeError("Not a string or buffer");
			var flushFlag = engine._finishFlushFlag;
			return engine._processChunk(buffer, flushFlag);
		}
		function Deflate(opts) {
			if (!(this instanceof Deflate)) return new Deflate(opts);
			Zlib.call(this, opts, binding.DEFLATE);
		}
		function Inflate(opts) {
			if (!(this instanceof Inflate)) return new Inflate(opts);
			Zlib.call(this, opts, binding.INFLATE);
		}
		function Gzip(opts) {
			if (!(this instanceof Gzip)) return new Gzip(opts);
			Zlib.call(this, opts, binding.GZIP);
		}
		function Gunzip(opts) {
			if (!(this instanceof Gunzip)) return new Gunzip(opts);
			Zlib.call(this, opts, binding.GUNZIP);
		}
		function DeflateRaw(opts) {
			if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
			Zlib.call(this, opts, binding.DEFLATERAW);
		}
		function InflateRaw(opts) {
			if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
			Zlib.call(this, opts, binding.INFLATERAW);
		}
		function Unzip(opts) {
			if (!(this instanceof Unzip)) return new Unzip(opts);
			Zlib.call(this, opts, binding.UNZIP);
		}
		function isValidFlushFlag(flag) {
			return flag === binding.Z_NO_FLUSH || flag === binding.Z_PARTIAL_FLUSH || flag === binding.Z_SYNC_FLUSH || flag === binding.Z_FULL_FLUSH || flag === binding.Z_FINISH || flag === binding.Z_BLOCK;
		}
		function Zlib(opts, mode) {
			var _this = this;
			this._opts = opts = opts || {};
			this._chunkSize = opts.chunkSize || exports2.Z_DEFAULT_CHUNK;
			Transform.call(this, opts);
			if (opts.flush && !isValidFlushFlag(opts.flush)) throw new Error("Invalid flush flag: " + opts.flush);
			if (opts.finishFlush && !isValidFlushFlag(opts.finishFlush)) throw new Error("Invalid flush flag: " + opts.finishFlush);
			this._flushFlag = opts.flush || binding.Z_NO_FLUSH;
			this._finishFlushFlag = typeof opts.finishFlush !== "undefined" ? opts.finishFlush : binding.Z_FINISH;
			if (opts.chunkSize) {
				if (opts.chunkSize < exports2.Z_MIN_CHUNK || opts.chunkSize > exports2.Z_MAX_CHUNK) throw new Error("Invalid chunk size: " + opts.chunkSize);
			}
			if (opts.windowBits) {
				if (opts.windowBits < exports2.Z_MIN_WINDOWBITS || opts.windowBits > exports2.Z_MAX_WINDOWBITS) throw new Error("Invalid windowBits: " + opts.windowBits);
			}
			if (opts.level) {
				if (opts.level < exports2.Z_MIN_LEVEL || opts.level > exports2.Z_MAX_LEVEL) throw new Error("Invalid compression level: " + opts.level);
			}
			if (opts.memLevel) {
				if (opts.memLevel < exports2.Z_MIN_MEMLEVEL || opts.memLevel > exports2.Z_MAX_MEMLEVEL) throw new Error("Invalid memLevel: " + opts.memLevel);
			}
			if (opts.strategy) {
				if (opts.strategy != exports2.Z_FILTERED && opts.strategy != exports2.Z_HUFFMAN_ONLY && opts.strategy != exports2.Z_RLE && opts.strategy != exports2.Z_FIXED && opts.strategy != exports2.Z_DEFAULT_STRATEGY) throw new Error("Invalid strategy: " + opts.strategy);
			}
			if (opts.dictionary) {
				if (!Buffer3.isBuffer(opts.dictionary)) throw new Error("Invalid dictionary: it should be a Buffer instance");
			}
			this._handle = new binding.Zlib(mode);
			var self2 = this;
			this._hadError = false;
			this._handle.onerror = function(message, errno) {
				_close(self2);
				self2._hadError = true;
				var error = new Error(message);
				error.errno = errno;
				error.code = exports2.codes[errno];
				self2.emit("error", error);
			};
			var level = exports2.Z_DEFAULT_COMPRESSION;
			if (typeof opts.level === "number") level = opts.level;
			var strategy = exports2.Z_DEFAULT_STRATEGY;
			if (typeof opts.strategy === "number") strategy = opts.strategy;
			this._handle.init(opts.windowBits || exports2.Z_DEFAULT_WINDOWBITS, level, opts.memLevel || exports2.Z_DEFAULT_MEMLEVEL, strategy, opts.dictionary);
			this._buffer = Buffer3.allocUnsafe(this._chunkSize);
			this._offset = 0;
			this._level = level;
			this._strategy = strategy;
			this.once("end", this.close);
			Object.defineProperty(this, "_closed", {
				get: function() {
					return !_this._handle;
				},
				configurable: true,
				enumerable: true
			});
		}
		util2.inherits(Zlib, Transform);
		Zlib.prototype.params = function(level, strategy, callback) {
			if (level < exports2.Z_MIN_LEVEL || level > exports2.Z_MAX_LEVEL) throw new RangeError("Invalid compression level: " + level);
			if (strategy != exports2.Z_FILTERED && strategy != exports2.Z_HUFFMAN_ONLY && strategy != exports2.Z_RLE && strategy != exports2.Z_FIXED && strategy != exports2.Z_DEFAULT_STRATEGY) throw new TypeError("Invalid strategy: " + strategy);
			if (this._level !== level || this._strategy !== strategy) {
				var self2 = this;
				this.flush(binding.Z_SYNC_FLUSH, function() {
					assert(self2._handle, "zlib binding closed");
					self2._handle.params(level, strategy);
					if (!self2._hadError) {
						self2._level = level;
						self2._strategy = strategy;
						if (callback) callback();
					}
				});
			} else import_browser.default.nextTick(callback);
		};
		Zlib.prototype.reset = function() {
			assert(this._handle, "zlib binding closed");
			return this._handle.reset();
		};
		Zlib.prototype._flush = function(callback) {
			this._transform(Buffer3.alloc(0), "", callback);
		};
		Zlib.prototype.flush = function(kind, callback) {
			var _this2 = this;
			var ws = this._writableState;
			if (typeof kind === "function" || kind === void 0 && !callback) {
				callback = kind;
				kind = binding.Z_FULL_FLUSH;
			}
			if (ws.ended) {
				if (callback) import_browser.default.nextTick(callback);
			} else if (ws.ending) {
				if (callback) this.once("end", callback);
			} else if (ws.needDrain) {
				if (callback) this.once("drain", function() {
					return _this2.flush(kind, callback);
				});
			} else {
				this._flushFlag = kind;
				this.write(Buffer3.alloc(0), "", callback);
			}
		};
		Zlib.prototype.close = function(callback) {
			_close(this, callback);
			import_browser.default.nextTick(emitCloseNT, this);
		};
		function _close(engine, callback) {
			if (callback) import_browser.default.nextTick(callback);
			if (!engine._handle) return;
			engine._handle.close();
			engine._handle = null;
		}
		function emitCloseNT(self2) {
			self2.emit("close");
		}
		Zlib.prototype._transform = function(chunk, encoding, cb) {
			var flushFlag;
			var ws = this._writableState;
			var last = (ws.ending || ws.ended) && (!chunk || ws.length === chunk.length);
			if (chunk !== null && !Buffer3.isBuffer(chunk)) return cb(/* @__PURE__ */ new Error("invalid input"));
			if (!this._handle) return cb(/* @__PURE__ */ new Error("zlib binding closed"));
			if (last) flushFlag = this._finishFlushFlag;
			else {
				flushFlag = this._flushFlag;
				if (chunk.length >= ws.length) this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
			}
			this._processChunk(chunk, flushFlag, cb);
		};
		Zlib.prototype._processChunk = function(chunk, flushFlag, cb) {
			var availInBefore = chunk && chunk.length;
			var availOutBefore = this._chunkSize - this._offset;
			var inOff = 0;
			var self2 = this;
			var async = typeof cb === "function";
			if (!async) {
				var buffers = [];
				var nread = 0;
				var error;
				this.on("error", function(er) {
					error = er;
				});
				assert(this._handle, "zlib binding closed");
				do
					var res = this._handle.writeSync(flushFlag, chunk, inOff, availInBefore, this._buffer, this._offset, availOutBefore);
				while (!this._hadError && callback(res[0], res[1]));
				if (this._hadError) throw error;
				if (nread >= kMaxLength) {
					_close(this);
					throw new RangeError(kRangeErrorMessage);
				}
				var buf = Buffer3.concat(buffers, nread);
				_close(this);
				return buf;
			}
			assert(this._handle, "zlib binding closed");
			var req = this._handle.write(flushFlag, chunk, inOff, availInBefore, this._buffer, this._offset, availOutBefore);
			req.buffer = chunk;
			req.callback = callback;
			function callback(availInAfter, availOutAfter) {
				if (this) {
					this.buffer = null;
					this.callback = null;
				}
				if (self2._hadError) return;
				var have = availOutBefore - availOutAfter;
				assert(have >= 0, "have should not go down");
				if (have > 0) {
					var out = self2._buffer.slice(self2._offset, self2._offset + have);
					self2._offset += have;
					if (async) self2.push(out);
					else {
						buffers.push(out);
						nread += out.length;
					}
				}
				if (availOutAfter === 0 || self2._offset >= self2._chunkSize) {
					availOutBefore = self2._chunkSize;
					self2._offset = 0;
					self2._buffer = Buffer3.allocUnsafe(self2._chunkSize);
				}
				if (availOutAfter === 0) {
					inOff += availInBefore - availInAfter;
					availInBefore = availInAfter;
					if (!async) return true;
					var newReq = self2._handle.write(flushFlag, chunk, inOff, availInBefore, self2._buffer, self2._offset, self2._chunkSize);
					newReq.callback = callback;
					newReq.buffer = chunk;
					return;
				}
				if (!async) return false;
				cb();
			}
		};
		util2.inherits(Deflate, Zlib);
		util2.inherits(Inflate, Zlib);
		util2.inherits(Gzip, Zlib);
		util2.inherits(Gunzip, Zlib);
		util2.inherits(DeflateRaw, Zlib);
		util2.inherits(InflateRaw, Zlib);
		util2.inherits(Unzip, Zlib);
	} });
	var require_containers = __commonJS({ "../../../node_modules/.pnpm/avsc@5.7.9/node_modules/avsc/lib/containers.js"(exports2, module2) {
		"use strict";
		init_browser_globals();
		var types = require_types2();
		var utils2 = require_utils();
		var buffer = require_buffer();
		var stream2 = require_stream_browserify();
		var util2 = require_util();
		var zlib = require_lib();
		var Buffer3 = buffer.Buffer;
		var OPTS = { namespace: "org.apache.avro.file" };
		var LONG_TYPE = types.Type.forSchema("long", OPTS);
		var MAP_BYTES_TYPE = types.Type.forSchema({
			type: "map",
			values: "bytes"
		}, OPTS);
		var HEADER_TYPE = types.Type.forSchema({
			name: "Header",
			type: "record",
			fields: [
				{
					name: "magic",
					type: {
						type: "fixed",
						name: "Magic",
						size: 4
					}
				},
				{
					name: "meta",
					type: MAP_BYTES_TYPE
				},
				{
					name: "sync",
					type: {
						type: "fixed",
						name: "Sync",
						size: 16
					}
				}
			]
		}, OPTS);
		var BLOCK_TYPE = types.Type.forSchema({
			name: "Block",
			type: "record",
			fields: [
				{
					name: "count",
					type: "long"
				},
				{
					name: "data",
					type: "bytes"
				},
				{
					name: "sync",
					type: "Sync"
				}
			]
		}, OPTS);
		var MAGIC_BYTES = utils2.bufferFrom("Obj");
		var f = util2.format;
		var Tap = utils2.Tap;
		function RawDecoder(schema, opts) {
			opts = opts || {};
			var noDecode = !!opts.noDecode;
			stream2.Duplex.call(this, {
				readableObjectMode: !noDecode,
				allowHalfOpen: false
			});
			this._type = types.Type.forSchema(schema);
			this._tap = new Tap(utils2.newBuffer(0));
			this._writeCb = null;
			this._needPush = false;
			this._readValue = createReader(noDecode, this._type);
			this._finished = false;
			this.on("finish", function() {
				this._finished = true;
				this._read();
			});
		}
		util2.inherits(RawDecoder, stream2.Duplex);
		RawDecoder.prototype._write = function(chunk, encoding, cb) {
			this._writeCb = cb;
			var tap = this._tap;
			tap.buf = Buffer3.concat([tap.buf.slice(tap.pos), chunk]);
			tap.pos = 0;
			if (this._needPush) {
				this._needPush = false;
				this._read();
			}
		};
		RawDecoder.prototype._read = function() {
			this._needPush = false;
			var tap = this._tap;
			var pos = tap.pos;
			var val = this._readValue(tap);
			if (tap.isValid()) this.push(val);
			else if (!this._finished) {
				tap.pos = pos;
				this._needPush = true;
				if (this._writeCb) this._writeCb();
			} else this.push(null);
		};
		function BlockDecoder(opts) {
			opts = opts || {};
			var noDecode = !!opts.noDecode;
			stream2.Duplex.call(this, {
				allowHalfOpen: true,
				readableObjectMode: !noDecode
			});
			this._rType = opts.readerSchema !== void 0 ? types.Type.forSchema(opts.readerSchema) : void 0;
			this._wType = null;
			this._codecs = opts.codecs;
			this._codec = void 0;
			this._parseHook = opts.parseHook;
			this._tap = new Tap(utils2.newBuffer(0));
			this._blockTap = new Tap(utils2.newBuffer(0));
			this._syncMarker = null;
			this._readValue = null;
			this._noDecode = noDecode;
			this._queue = new utils2.OrderedQueue();
			this._decompress = null;
			this._index = 0;
			this._remaining = void 0;
			this._needPush = false;
			this._finished = false;
			this.on("finish", function() {
				this._finished = true;
				if (this._needPush) this._read();
			});
		}
		util2.inherits(BlockDecoder, stream2.Duplex);
		BlockDecoder.defaultCodecs = function() {
			return {
				"null": function(buf, cb) {
					cb(null, buf);
				},
				"deflate": zlib.inflateRaw
			};
		};
		BlockDecoder.getDefaultCodecs = BlockDecoder.defaultCodecs;
		BlockDecoder.prototype._decodeHeader = function() {
			var tap = this._tap;
			if (tap.buf.length < MAGIC_BYTES.length) return false;
			if (!MAGIC_BYTES.equals(tap.buf.slice(0, MAGIC_BYTES.length))) {
				this.emit("error", /* @__PURE__ */ new Error("invalid magic bytes"));
				return false;
			}
			var header = HEADER_TYPE._read(tap);
			if (!tap.isValid()) return false;
			this._codec = (header.meta["avro.codec"] || "null").toString();
			var codecs = this._codecs || BlockDecoder.getDefaultCodecs();
			this._decompress = codecs[this._codec];
			if (!this._decompress) {
				this.emit("error", new Error(f("unknown codec: %s", this._codec)));
				return;
			}
			try {
				var schema = JSON.parse(header.meta["avro.schema"].toString());
				if (this._parseHook) schema = this._parseHook(schema);
				this._wType = types.Type.forSchema(schema);
			} catch (err) {
				this.emit("error", err);
				return;
			}
			try {
				this._readValue = createReader(this._noDecode, this._wType, this._rType);
			} catch (err) {
				this.emit("error", err);
				return;
			}
			this._syncMarker = header.sync;
			this.emit("metadata", this._wType, this._codec, header);
			return true;
		};
		BlockDecoder.prototype._write = function(chunk, encoding, cb) {
			var tap = this._tap;
			tap.buf = Buffer3.concat([tap.buf, chunk]);
			tap.pos = 0;
			if (!this._decodeHeader()) {
				import_browser.default.nextTick(cb);
				return;
			}
			this._write = this._writeChunk;
			this._write(utils2.newBuffer(0), encoding, cb);
		};
		BlockDecoder.prototype._writeChunk = function(chunk, encoding, cb) {
			var tap = this._tap;
			tap.buf = Buffer3.concat([tap.buf.slice(tap.pos), chunk]);
			tap.pos = 0;
			var nBlocks = 1;
			var block;
			while (block = tryReadBlock(tap)) {
				if (!this._syncMarker.equals(block.sync)) {
					this.emit("error", /* @__PURE__ */ new Error("invalid sync marker"));
					return;
				}
				nBlocks++;
				this._decompress(block.data, this._createBlockCallback(block.data.length, block.count, chunkCb));
			}
			chunkCb();
			function chunkCb() {
				if (!--nBlocks) cb();
			}
		};
		BlockDecoder.prototype._createBlockCallback = function(size, count, cb) {
			var self2 = this;
			var index = this._index++;
			return function(cause, data) {
				if (cause) {
					var err = new Error(f("%s codec decompression error", self2._codec));
					err.cause = cause;
					self2.emit("error", err);
					cb();
				} else {
					self2.emit("block", new BlockInfo(count, data.length, size));
					self2._queue.push(new BlockData(index, data, cb, count));
					if (self2._needPush) self2._read();
				}
			};
		};
		BlockDecoder.prototype._read = function() {
			this._needPush = false;
			var tap = this._blockTap;
			if (!this._remaining) {
				var data = this._queue.pop();
				if (!data || !data.count) {
					if (this._finished) this.push(null);
					else this._needPush = true;
					if (data) data.cb();
					return;
				}
				data.cb();
				this._remaining = data.count;
				tap.buf = data.buf;
				tap.pos = 0;
			}
			this._remaining--;
			var val;
			try {
				val = this._readValue(tap);
				if (!tap.isValid()) throw new Error("truncated block");
			} catch (err) {
				this._remaining = 0;
				this.emit("error", err);
				return;
			}
			this.push(val);
		};
		function RawEncoder(schema, opts) {
			opts = opts || {};
			stream2.Transform.call(this, {
				writableObjectMode: true,
				allowHalfOpen: false
			});
			this._type = types.Type.forSchema(schema);
			this._writeValue = function(tap, val) {
				try {
					this._type._write(tap, val);
				} catch (err) {
					this.emit("typeError", err, val, this._type);
				}
			};
			this._tap = new Tap(utils2.newBuffer(opts.batchSize || 65536));
			this.on("typeError", function(err) {
				this.emit("error", err);
			});
		}
		util2.inherits(RawEncoder, stream2.Transform);
		RawEncoder.prototype._transform = function(val, encoding, cb) {
			var tap = this._tap;
			var buf = tap.buf;
			var pos = tap.pos;
			this._writeValue(tap, val);
			if (!tap.isValid()) {
				if (pos) this.push(copyBuffer(tap.buf, 0, pos));
				var len = tap.pos - pos;
				if (len > buf.length) tap.buf = utils2.newBuffer(2 * len);
				tap.pos = 0;
				this._writeValue(tap, val);
			}
			cb();
		};
		RawEncoder.prototype._flush = function(cb) {
			var tap = this._tap;
			var pos = tap.pos;
			if (pos) this.push(tap.buf.slice(0, pos));
			cb();
		};
		function BlockEncoder(schema, opts) {
			opts = opts || {};
			stream2.Duplex.call(this, {
				allowHalfOpen: true,
				writableObjectMode: true
			});
			var type;
			if (types.Type.isType(schema)) {
				type = schema;
				schema = void 0;
			} else type = types.Type.forSchema(schema);
			this._schema = schema;
			this._type = type;
			this._writeValue = function(tap, val) {
				try {
					this._type._write(tap, val);
				} catch (err) {
					this.emit("typeError", err, val, this._type);
					return false;
				}
				return true;
			};
			this._blockSize = opts.blockSize || 65536;
			this._tap = new Tap(utils2.newBuffer(this._blockSize));
			this._codecs = opts.codecs;
			this._codec = opts.codec || "null";
			this._blockCount = 0;
			this._syncMarker = opts.syncMarker || new utils2.Lcg().nextBuffer(16);
			this._queue = new utils2.OrderedQueue();
			this._pending = 0;
			this._finished = false;
			this._needHeader = false;
			this._needPush = false;
			this._metadata = opts.metadata || {};
			if (!MAP_BYTES_TYPE.isValid(this._metadata)) throw new Error("invalid metadata");
			var codec = this._codec;
			this._compress = (this._codecs || BlockEncoder.getDefaultCodecs())[codec];
			if (!this._compress) throw new Error(f("unsupported codec: %s", codec));
			if (opts.omitHeader !== void 0) opts.writeHeader = opts.omitHeader ? "never" : "auto";
			switch (opts.writeHeader) {
				case false:
				case "never": break;
				case void 0:
				case "auto":
					this._needHeader = true;
					break;
				default: this._writeHeader();
			}
			this.on("finish", function() {
				this._finished = true;
				if (this._blockCount) this._flushChunk();
				else if (this._finished && this._needPush) this.push(null);
			});
			this.on("typeError", function(err) {
				this.emit("error", err);
			});
		}
		util2.inherits(BlockEncoder, stream2.Duplex);
		BlockEncoder.defaultCodecs = function() {
			return {
				"null": function(buf, cb) {
					cb(null, buf);
				},
				"deflate": zlib.deflateRaw
			};
		};
		BlockEncoder.getDefaultCodecs = BlockEncoder.defaultCodecs;
		BlockEncoder.prototype._writeHeader = function() {
			var schema = JSON.stringify(this._schema ? this._schema : this._type.getSchema({ exportAttrs: true }));
			var meta = utils2.copyOwnProperties(this._metadata, {
				"avro.schema": utils2.bufferFrom(schema),
				"avro.codec": utils2.bufferFrom(this._codec)
			}, true);
			var header = new (HEADER_TYPE.getRecordConstructor())(MAGIC_BYTES, meta, this._syncMarker);
			this.push(header.toBuffer());
		};
		BlockEncoder.prototype._write = function(val, encoding, cb) {
			if (this._needHeader) {
				this._writeHeader();
				this._needHeader = false;
			}
			var tap = this._tap;
			var pos = tap.pos;
			var flushing = false;
			if (this._writeValue(tap, val)) {
				if (!tap.isValid()) {
					if (pos) {
						this._flushChunk(pos, cb);
						flushing = true;
					}
					var len = tap.pos - pos;
					if (len > this._blockSize) this._blockSize = len * 2;
					tap.buf = utils2.newBuffer(this._blockSize);
					tap.pos = 0;
					this._writeValue(tap, val);
				}
				this._blockCount++;
			} else tap.pos = pos;
			if (!flushing) cb();
		};
		BlockEncoder.prototype._flushChunk = function(pos, cb) {
			var tap = this._tap;
			pos = pos || tap.pos;
			this._compress(tap.buf.slice(0, pos), this._createBlockCallback(pos, cb));
			this._blockCount = 0;
		};
		BlockEncoder.prototype._read = function() {
			var self2 = this;
			var data = this._queue.pop();
			if (!data) {
				if (this._finished && !this._pending) import_browser.default.nextTick(function() {
					self2.push(null);
				});
				else this._needPush = true;
				return;
			}
			this.push(LONG_TYPE.toBuffer(data.count, true));
			this.push(LONG_TYPE.toBuffer(data.buf.length, true));
			this.push(data.buf);
			this.push(this._syncMarker);
			if (!this._finished) data.cb();
		};
		BlockEncoder.prototype._createBlockCallback = function(size, cb) {
			var self2 = this;
			var index = this._index++;
			var count = this._blockCount;
			this._pending++;
			return function(cause, data) {
				if (cause) {
					var err = new Error(f("%s codec compression error", self2._codec));
					err.cause = cause;
					self2.emit("error", err);
					return;
				}
				self2._pending--;
				self2.emit("block", new BlockInfo(count, size, data.length));
				self2._queue.push(new BlockData(index, data, cb, count));
				if (self2._needPush) {
					self2._needPush = false;
					self2._read();
				}
			};
		};
		function BlockInfo(count, raw, compressed) {
			this.valueCount = count;
			this.rawDataLength = raw;
			this.compressedDataLength = compressed;
		}
		function BlockData(index, buf, cb, count) {
			this.index = index;
			this.buf = buf;
			this.cb = cb;
			this.count = count | 0;
		}
		function tryReadBlock(tap) {
			var pos = tap.pos;
			var block = BLOCK_TYPE._read(tap);
			if (!tap.isValid()) {
				tap.pos = pos;
				return null;
			}
			return block;
		}
		function createReader(noDecode, writerType, readerType) {
			if (noDecode) return /* @__PURE__ */ (function(skipper) {
				return function(tap) {
					var pos = tap.pos;
					skipper(tap);
					return tap.buf.slice(pos, tap.pos);
				};
			})(writerType._skip);
			else if (readerType) {
				var resolver = readerType.createResolver(writerType);
				return function(tap) {
					return resolver._read(tap);
				};
			} else return function(tap) {
				return writerType._read(tap);
			};
		}
		function copyBuffer(buf, pos, len) {
			var copy = utils2.newBuffer(len);
			buf.copy(copy, 0, pos, pos + len);
			return copy;
		}
		module2.exports = {
			BLOCK_TYPE,
			HEADER_TYPE,
			MAGIC_BYTES,
			streams: {
				BlockDecoder,
				BlockEncoder,
				RawDecoder,
				RawEncoder
			}
		};
	} });
	init_browser_globals();
	var avroServices = require_avsc_services();
	var containers = require_containers();
	var utils = require_utils();
	var stream = require_stream_browserify();
	var util = require_util();
	function BlobReader(blob, opts) {
		stream.Readable.call(this);
		opts = opts || {};
		this._batchSize = opts.batchSize || 65536;
		this._blob = blob;
		this._pos = 0;
	}
	util.inherits(BlobReader, stream.Readable);
	BlobReader.prototype._read = function() {
		var pos = this._pos;
		if (pos >= this._blob.size) {
			this.push(null);
			return;
		}
		this._pos += this._batchSize;
		var blob = this._blob.slice(pos, this._pos, this._blob.type);
		var reader = new FileReader();
		var self2 = this;
		reader.addEventListener("loadend", function cb(evt) {
			reader.removeEventListener("loadend", cb, false);
			if (evt.error) self2.emit("error", evt.error);
			else self2.push(utils.bufferFrom(reader.result));
		}, false);
		reader.readAsArrayBuffer(blob);
	};
	function BlobWriter() {
		stream.Transform.call(this, { readableObjectMode: true });
		this._bufs = [];
	}
	util.inherits(BlobWriter, stream.Transform);
	BlobWriter.prototype._transform = function(buf, encoding, cb) {
		this._bufs.push(buf);
		cb();
	};
	BlobWriter.prototype._flush = function(cb) {
		this.push(new Blob(this._bufs, { type: "application/octet-binary" }));
		cb();
	};
	function createBlobDecoder(blob, opts) {
		return new BlobReader(blob).pipe(new containers.streams.BlockDecoder(opts));
	}
	function createBlobEncoder(schema, opts) {
		var encoder = new containers.streams.BlockEncoder(schema, opts);
		var builder = new BlobWriter();
		encoder.pipe(builder);
		return new stream.Duplex({
			objectMode: true,
			read: function() {
				var val = builder.read();
				if (val) done(val);
				else builder.once("readable", done);
				var self2 = this;
				function done(val2) {
					self2.push(val2 || builder.read());
					self2.push(null);
				}
			},
			write: function(val, encoding, cb) {
				return encoder.write(val, encoding, cb);
			}
		}).on("finish", function() {
			encoder.end();
		});
	}
	module.exports = {
		createBlobDecoder,
		createBlobEncoder,
		streams: containers.streams
	};
	utils.copyOwnProperties(avroServices, module.exports);
}));
/*! Bundled license information:

ieee754/index.js:
(*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
(*!
* The buffer module from node.js, for the browser.
*
* @author   Feross Aboukhadijeh <https://feross.org>
* @license  MIT
*)

safe-buffer/index.js:
(*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

assert/build/internal/util/comparisons.js:
(*!
* The buffer module from node.js, for the browser.
*
* @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
* @license  MIT
*)
*/
//#endregion
export { renderFileViewerData as a, dataRendererDefinition as i, renderPsdAsset as n, renderDataAsset as o, dataRenderer as r, require_avsc as t };
