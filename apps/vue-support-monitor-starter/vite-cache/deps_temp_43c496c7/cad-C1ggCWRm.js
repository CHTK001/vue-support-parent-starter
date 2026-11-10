import { $ as createFileViewerViewStateChangeEmitter, G as isFileViewerSnapshotDownloadPermitted, Gt as resolveFileViewerCadAssetUrls, Q as createFileViewerViewStateChange, dn as resolveFileViewerRuntimeAssetBaseUrl } from "./dist-B6GcL3C6.js";
import { _ as unregisterFileViewerZoomProvider, g as unregisterFileViewerViewStateProvider, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter, p as registerFileViewerViewStateProvider } from "./fit-BmeG0j2O.js";
import { n as normalizeFileViewerWatermark, t as buildFileViewerWatermarkSvg } from "./watermark-Ou1OXRlC.js";
import { n as resolveFileViewerLocale, t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { a as resolveFileViewerCadMonochromeColor, i as resolveFileViewerCadCanvasOptions, n as normalizeFileViewerCadColorMode, o as supportsCadViewerColorMode, r as resolveCadViewerSourceDocument, t as applyCadViewerColorMode } from "./colorMode-D888rtAS.js";
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/output/canvasImage.js
var loadImage = (document, source) => new Promise((resolve, reject) => {
	const image = document.createElement("img");
	const timer = setTimeout(() => finish(/* @__PURE__ */ new Error("Image export resource timed out.")), 3e4);
	const finish = (error) => {
		clearTimeout(timer);
		image.onload = image.onerror = null;
		if (error) reject(error);
		else resolve(image);
	};
	image.crossOrigin = "anonymous";
	image.onload = () => finish();
	image.onerror = () => finish(/* @__PURE__ */ new Error("Unable to render the export watermark."));
	image.src = source;
});
/** Encodes a detached snapshot without mutating the renderer or omitting its watermark. */
async function createFileViewerCanvasImageBlob(snapshot, format, watermark, pixelRatio = 1) {
	if (!["png", "jpeg"].includes(format)) throw new Error("Unsupported image export format.");
	if (!(snapshot.width > 0 && snapshot.height > 0) || snapshot.width * snapshot.height > 64e6) throw new Error("The image export size is empty or exceeds 64 million pixels.");
	const document = snapshot.ownerDocument;
	const canvas = document.createElement("canvas");
	canvas.width = snapshot.width;
	canvas.height = snapshot.height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("A Canvas 2D context is required for image export.");
	if (format === "jpeg") {
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, canvas.width, canvas.height);
	}
	context.drawImage(snapshot, 0, 0);
	let normalized = normalizeFileViewerWatermark(watermark);
	if (normalized) {
		if (normalized.image) {
			const image = await loadImage(document, normalized.image);
			const tile = document.createElement("canvas");
			tile.width = image.naturalWidth;
			tile.height = image.naturalHeight;
			if (!tile.width || !tile.height || tile.width * tile.height > 16e6) throw new Error("The watermark image size is invalid.");
			const tileContext = tile.getContext("2d");
			if (!tileContext) throw new Error("Unable to render the export watermark.");
			tileContext.drawImage(image, 0, 0);
			normalized = {
				...normalized,
				image: tile.toDataURL("image/png")
			};
		}
		const tile = await loadImage(document, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildFileViewerWatermarkSvg(normalized))}`);
		const pattern = context.createPattern(tile, "repeat");
		if (!pattern) throw new Error("Unable to render the export watermark.");
		const scale = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
		context.save();
		context.scale(scale, scale);
		context.fillStyle = pattern;
		context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
		context.restore();
	}
	const mime = `image/${format}`;
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if ((blob === null || blob === void 0 ? void 0 : blob.type) === mime && blob.size > 0) resolve(blob);
			else reject(/* @__PURE__ */ new Error(`Unable to encode ${format.toUpperCase()} output.`));
		}, mime, .92);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/types.js
function diag(level, code, message, source) {
	return source === void 0 ? {
		level,
		code,
		message
	} : {
		level,
		code,
		message,
		source
	};
}
function actionableDiagnostics(diagnostics) {
	return (diagnostics ?? []).filter((d) => d.level !== "info");
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/inflate.js
function getDecompressionStreamCtor() {
	return globalThis.DecompressionStream;
}
var BrowserInflateProvider = class {
	async inflateRaw(data) {
		const DS = getDecompressionStreamCtor();
		if (!DS) throw new Error("This browser does not expose DecompressionStream. Provide a custom InflateProvider, or pre-bundle a WASM/JS inflater.");
		try {
			return await decompressWithFormat(data, "deflate-raw", DS);
		} catch (rawError) {
			try {
				return await decompressWithFormat(data, "deflate", DS);
			} catch {
				throw rawError instanceof Error ? rawError : new Error(String(rawError));
			}
		}
	}
};
async function decompressWithFormat(data, format, DS) {
	const decompressedStream = new Blob([data]).stream().pipeThrough(new DS(format));
	const ab = await new Response(decompressedStream).arrayBuffer();
	return new Uint8Array(ab);
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/util.js
var textDecoder = new TextDecoder("utf-8");
new TextDecoder("ascii");
function decodeUtf8(bytes) {
	return textDecoder.decode(bytes);
}
function normalizePath(path) {
	const parts = [];
	const normalized = path.replace(/\\/g, "/");
	for (const part of normalized.split("/")) {
		if (!part || part === ".") continue;
		if (part === "..") parts.pop();
		else parts.push(part);
	}
	return parts.join("/");
}
function dirname(path) {
	const n = normalizePath(path);
	const i = n.lastIndexOf("/");
	return i < 0 ? "" : n.slice(0, i);
}
function resolvePart(basePath, target) {
	if (!target) return normalizePath(basePath);
	if (target.startsWith("/")) return normalizePath(target.slice(1));
	const baseDir = dirname(basePath);
	return normalizePath((baseDir ? baseDir + "/" : "") + target);
}
function stripNamespace(name) {
	const i = name.indexOf(":");
	return i >= 0 ? name.slice(i + 1) : name;
}
function localName(el) {
	return stripNamespace(el.localName || el.nodeName);
}
function getAttr(el, name) {
	return el.getAttribute(name) ?? el.getAttributeNS(null, name) ?? void 0;
}
function childElements(el) {
	return Array.from(el.childNodes).filter((n) => n.nodeType === 1);
}
function parseXml(xml, source = "document.xml") {
	const strict = tryParseXmlWithDomParser(xml);
	if (strict) return strict;
	const repaired = repairAutodeskXml(xml);
	if (repaired !== xml) {
		const strictRepaired = tryParseXmlWithDomParser(repaired);
		if (strictRepaired) return strictRepaired;
	}
	try {
		return parseXmlFallback(repaired);
	} catch (err) {
		throw new Error(`XML parse error in ${source}: ${String(err)}`);
	}
}
function tryParseXmlWithDomParser(xml) {
	if (typeof DOMParser === "undefined") return void 0;
	try {
		const doc = new DOMParser().parseFromString(xml, "application/xml");
		return doc.getElementsByTagName("parsererror")[0] ? void 0 : doc;
	} catch {
		return;
	}
}
function repairAutodeskXml(xml) {
	let out = xml;
	out = out.replace(/\s+xmlns:(?:schemaLocation|noNamespaceSchemaLocation)\s*=\s*("[^"]*"|'[^']*')/g, "");
	if (/\s+xsi:schemaLocation\s*=/.test(out) && !/\s+xmlns:xsi\s*=/.test(out)) out = out.replace(/<([A-Za-z_][\w.:-]*)(?=\s|>|\/)/, "<$1 xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"");
	return out;
}
var SimpleXmlElement = class SimpleXmlElement {
	constructor(name, attrs) {
		this.nodeType = 1;
		this.childNodes = [];
		this.nodeName = name;
		this.localName = stripNamespace(name);
		this.attributes = attrs;
	}
	get textContent() {
		return this.childNodes.map((n) => n.textContent ?? "").join("");
	}
	get children() {
		return this.childNodes.filter((n) => n instanceof SimpleXmlElement);
	}
	getAttribute(name) {
		return this.attributes.find((a) => a.name === name || a.nodeName === name)?.value ?? null;
	}
	getAttributeNS(_ns, name) {
		return this.attributes.find((a) => a.localName === name)?.value ?? null;
	}
	getElementsByTagName(name) {
		const out = [];
		const visit = (el) => {
			if (name === "*" || el.nodeName === name || el.localName === name) out.push(el);
			for (const child of el.childNodes) if (child instanceof SimpleXmlElement) visit(child);
		};
		for (const child of this.childNodes) if (child instanceof SimpleXmlElement) visit(child);
		return out;
	}
};
var SimpleXmlText = class {
	constructor(textContent) {
		this.textContent = textContent;
		this.nodeType = 3;
	}
};
var SimpleXmlDocument = class {
	constructor() {
		this.nodeType = 9;
		this.childNodes = [];
	}
	get textContent() {
		return this.childNodes.map((n) => n.textContent ?? "").join("");
	}
	get children() {
		return this.childNodes.filter((n) => n instanceof SimpleXmlElement);
	}
	get documentElement() {
		return this.children[0];
	}
	getElementsByTagName(name) {
		const out = [];
		const visit = (el) => {
			if (name === "*" || el.nodeName === name || el.localName === name) out.push(el);
			for (const child of el.childNodes) if (child instanceof SimpleXmlElement) visit(child);
		};
		for (const child of this.childNodes) if (child instanceof SimpleXmlElement) visit(child);
		return out;
	}
};
function parseXmlFallback(xml) {
	const doc = new SimpleXmlDocument();
	const stack = [doc];
	let pos = 0;
	while (pos < xml.length) {
		const lt = xml.indexOf("<", pos);
		if (lt < 0) {
			appendText(stack[stack.length - 1], xml.slice(pos));
			break;
		}
		if (lt > pos) appendText(stack[stack.length - 1], xml.slice(pos, lt));
		if (xml.startsWith("<!--", lt)) {
			const end = xml.indexOf("-->", lt + 4);
			if (end < 0) throw new Error("Unclosed XML comment.");
			pos = end + 3;
			continue;
		}
		if (xml.startsWith("<![CDATA[", lt)) {
			const end = xml.indexOf("]]>", lt + 9);
			if (end < 0) throw new Error("Unclosed XML CDATA section.");
			appendText(stack[stack.length - 1], xml.slice(lt + 9, end));
			pos = end + 3;
			continue;
		}
		if (xml.startsWith("<?", lt)) {
			const end = xml.indexOf("?>", lt + 2);
			if (end < 0) throw new Error("Unclosed XML processing instruction.");
			pos = end + 2;
			continue;
		}
		if (xml.startsWith("<!", lt)) {
			const end = xml.indexOf(">", lt + 2);
			if (end < 0) throw new Error("Unclosed XML declaration.");
			pos = end + 1;
			continue;
		}
		const gt = findTagEnd(xml, lt + 1);
		if (gt < 0) throw new Error("Unclosed XML tag.");
		let tag = xml.slice(lt + 1, gt).trim();
		pos = gt + 1;
		if (!tag) continue;
		if (tag[0] === "/") {
			const name = tag.slice(1).trim().split(/\s+/)[0] ?? "";
			let popped = stack.pop();
			while (popped && popped instanceof SimpleXmlElement && popped.nodeName !== name && popped.localName !== stripNamespace(name) && stack.length > 0) popped = stack.pop();
			if (stack.length === 0) stack.push(doc);
			continue;
		}
		const selfClosing = tag.endsWith("/");
		if (selfClosing) tag = tag.slice(0, -1).trim();
		const space = tag.search(/\s/);
		const el = new SimpleXmlElement(space < 0 ? tag : tag.slice(0, space), parseAttrs(space < 0 ? "" : tag.slice(space + 1)));
		const parent = stack[stack.length - 1];
		el.parentNode = parent;
		parent.childNodes.push(el);
		if (!selfClosing) stack.push(el);
	}
	return doc;
}
function appendText(parent, raw) {
	if (!raw) return;
	const text = decodeXmlEntities(raw);
	if (text.trim().length === 0) return;
	parent.childNodes.push(new SimpleXmlText(text));
}
function findTagEnd(xml, start) {
	let quote = "";
	for (let i = start; i < xml.length; i++) {
		const c = xml[i];
		if (quote) {
			if (c === quote) quote = "";
		} else if (c === "\"" || c === "'") quote = c;
		else if (c === ">") return i;
	}
	return -1;
}
function parseAttrs(input) {
	const attrs = [];
	const re = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
	let m;
	while (m = re.exec(input)) {
		const name = m[1];
		const value = decodeXmlEntities(m[2] ?? m[3] ?? "");
		attrs.push({
			name,
			nodeName: name,
			localName: stripNamespace(name),
			value
		});
	}
	return attrs;
}
function decodeXmlEntities(input) {
	return input.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_m, ent) => {
		if (ent === "amp") return "&";
		if (ent === "lt") return "<";
		if (ent === "gt") return ">";
		if (ent === "quot") return "\"";
		if (ent === "apos") return "'";
		if (ent.startsWith("#x")) return String.fromCodePoint(Number.parseInt(ent.slice(2), 16));
		if (ent.startsWith("#")) return String.fromCodePoint(Number.parseInt(ent.slice(1), 10));
		return _m;
	});
}
function bytesLookTextual(bytes, sampleLength = 2048) {
	const n = Math.min(sampleLength, bytes.length);
	if (n === 0) return true;
	let printable = 0;
	let control = 0;
	for (let i = 0; i < n; i++) {
		const b = bytes[i];
		if (b === 0) return false;
		if (b === 9 || b === 10 || b === 13 || b >= 32 && b <= 126 || b >= 160) printable++;
		else control++;
	}
	return printable / n > .85 && control < 20;
}
function extname(path) {
	const clean = path.split(/[?#]/)[0] ?? path;
	const slash = clean.lastIndexOf("/");
	const dot = clean.lastIndexOf(".");
	return dot > slash ? clean.slice(dot + 1).toLowerCase() : "";
}
function mimeFromPath(path) {
	switch (extname(path)) {
		case "png": return "image/png";
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "gif": return "image/gif";
		case "bmp": return "image/bmp";
		case "tif":
		case "tiff": return "image/tiff";
		case "w2d": return "application/x-dwf-w2d";
		case "hsf": return "model/vnd.hsf";
		case "fpage": return "application/vnd.ms-package.xps-fixeddocumentsequence+xml";
		case "fdseq": return "application/vnd.ms-package.xps-fixeddocumentsequence+xml";
		case "fdoc": return "application/vnd.ms-package.xps-fixeddocument+xml";
		default: return;
	}
}
async function blobToImage(bytes, type) {
	const blob = new Blob([bytes], { type });
	if ("createImageBitmap" in globalThis) return await createImageBitmap(blob);
	return await new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(/* @__PURE__ */ new Error("Failed to decode image"));
		};
		img.src = url;
	});
}
function parseNumberList(input) {
	const matches = input.match(/[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/g);
	return matches ? matches.map(Number).filter(Number.isFinite) : [];
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/zip.js
var SIG_EOCD = 101010256;
var SIG_CENTRAL = 33639248;
var SIG_LOCAL = 67324752;
var ZipPackage = class ZipPackage {
	constructor(bytes, entries, archiveBase, inflater) {
		this.entryMap = /* @__PURE__ */ new Map();
		this.cache = /* @__PURE__ */ new Map();
		this.bytes = bytes;
		this.entries = entries;
		this.archiveBase = archiveBase;
		this.inflater = inflater ?? new BrowserInflateProvider();
		for (const e of entries) this.entryMap.set(normalizePath(e.name), e);
	}
	static open(bytes, inflater) {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const eocdOffset = findEocd(view);
		if (eocdOffset < 0) throw new Error("ZIP end-of-central-directory record was not found. This is not a DWF 6+/DWFx ZIP package.");
		const diskNo = u16(view, eocdOffset + 4);
		const cdDiskNo = u16(view, eocdOffset + 6);
		if (diskNo !== 0 || cdDiskNo !== 0) throw new Error("Multi-disk ZIP archives are not supported.");
		const entryCount = u16(view, eocdOffset + 10);
		const centralSize = u32(view, eocdOffset + 12);
		const centralOffset = u32(view, eocdOffset + 16);
		let archiveBase = 0;
		let centralAbs = centralOffset;
		if (u32(view, centralAbs) !== SIG_CENTRAL) {
			const maxShift = Math.max(0, eocdOffset - centralSize - 1048576);
			let found = -1;
			for (let p = eocdOffset - centralSize; p >= maxShift; p--) if (p >= 0 && u32(view, p) === SIG_CENTRAL) {
				found = p;
				break;
			}
			if (found < 0) throw new Error("ZIP central directory could not be located.");
			centralAbs = found;
			archiveBase = centralAbs - centralOffset;
		}
		const entries = [];
		let ptr = centralAbs;
		for (let i = 0; i < entryCount; i++) {
			if (u32(view, ptr) !== SIG_CENTRAL) throw new Error(`Bad central directory signature at ${ptr}.`);
			const flags = u16(view, ptr + 8);
			const method = u16(view, ptr + 10);
			const lastModTime = u16(view, ptr + 12);
			const lastModDate = u16(view, ptr + 14);
			const crc32 = u32(view, ptr + 16);
			const compressedSize = u32(view, ptr + 20);
			const uncompressedSize = u32(view, ptr + 24);
			const nameLen = u16(view, ptr + 28);
			const extraLen = u16(view, ptr + 30);
			const commentLen = u16(view, ptr + 32);
			const localHeaderOffset = u32(view, ptr + 42);
			const nameBytes = bytes.subarray(ptr + 46, ptr + 46 + nameLen);
			const commentBytes = bytes.subarray(ptr + 46 + nameLen + extraLen, ptr + 46 + nameLen + extraLen + commentLen);
			const name = normalizePath(decodeFileName(nameBytes, flags));
			const comment = decodeFileName(commentBytes, flags);
			if (!name.endsWith("/")) entries.push({
				name,
				compressedSize,
				uncompressedSize,
				compressionMethod: method,
				crc32,
				localHeaderOffset,
				centralHeaderOffset: ptr - archiveBase,
				flags,
				lastModTime,
				lastModDate,
				comment
			});
			ptr += 46 + nameLen + extraLen + commentLen;
		}
		return new ZipPackage(bytes, entries, archiveBase, inflater);
	}
	has(name) {
		return this.entryMap.has(normalizePath(name));
	}
	get(name) {
		return this.entryMap.get(normalizePath(name));
	}
	find(predicate) {
		return this.entries.find(predicate);
	}
	findAll(predicate) {
		return this.entries.filter(predicate);
	}
	async read(entryOrName) {
		const entry = typeof entryOrName === "string" ? this.get(entryOrName) : entryOrName;
		if (!entry) throw new Error(`ZIP entry not found: ${entryOrName}`);
		const cached = this.cache.get(entry.name);
		if (cached) return cached;
		const view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
		const localAbs = this.archiveBase + entry.localHeaderOffset;
		if (u32(view, localAbs) !== SIG_LOCAL) throw new Error(`Bad local header signature for ${entry.name}.`);
		const nameLen = u16(view, localAbs + 26);
		const extraLen = u16(view, localAbs + 28);
		const dataStart = localAbs + 30 + nameLen + extraLen;
		const compressed = this.bytes.subarray(dataStart, dataStart + entry.compressedSize);
		let out;
		if (entry.compressionMethod === 0) out = compressed.slice();
		else if (entry.compressionMethod === 8) out = await this.inflater.inflateRaw(compressed);
		else throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.name}.`);
		if (entry.uncompressedSize !== 0 && out.byteLength !== entry.uncompressedSize) {
			if (entry.uncompressedSize < 4294967295) throw new Error(`ZIP entry size mismatch for ${entry.name}: expected ${entry.uncompressedSize}, got ${out.byteLength}.`);
		}
		this.cache.set(entry.name, out);
		return out;
	}
};
function looksLikeZip(bytes) {
	if (bytes.byteLength < 22) return false;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (u32(view, 0) === SIG_LOCAL) return true;
	return findEocd(view) >= 0;
}
function findEocd(view) {
	const min = Math.max(0, view.byteLength - 65535 - 22);
	for (let p = view.byteLength - 22; p >= min; p--) if (u32(view, p) === SIG_EOCD) return p;
	return -1;
}
function decodeFileName(bytes, flags) {
	if ((flags & 2048) !== 0) return decodeUtf8(bytes);
	return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
}
function u16(view, offset) {
	return view.getUint16(offset, true);
}
function u32(view, offset) {
	return view.getUint32(offset, true);
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/opc.js
async function createOpcView(zip) {
	const contentTypes = /* @__PURE__ */ new Map();
	const defaults = /* @__PURE__ */ new Map();
	const overrides = [];
	if (zip.has("[Content_Types].xml")) {
		const doc = parseXml(decodeUtf8(await zip.read("[Content_Types].xml")), "[Content_Types].xml");
		for (const el of Array.from(doc.documentElement.children)) {
			const name = localName(el);
			if (name === "Default") {
				const ext = el.getAttribute("Extension")?.toLowerCase();
				const ct = el.getAttribute("ContentType");
				if (ext && ct) defaults.set(ext, ct);
			} else if (name === "Override") {
				const partName = normalizePath((el.getAttribute("PartName") ?? "").replace(/^\//, ""));
				const ct = el.getAttribute("ContentType");
				if (partName && ct) {
					contentTypes.set(partName, ct);
					overrides.push({
						partName,
						contentType: ct
					});
				}
			}
		}
	}
	const relationships = /* @__PURE__ */ new Map();
	return {
		zip,
		contentTypes,
		defaults,
		overrides,
		relationships,
		resources: zip.entries.map((e) => ({
			path: e.name,
			mediaType: getContentTypeFor(contentTypes, defaults, e.name),
			size: e.uncompressedSize
		})),
		readText: async (path) => decodeUtf8(await zip.read(normalizePath(path))),
		readBytes: async (path) => zip.read(normalizePath(path)),
		getContentType: (path) => getContentTypeFor(contentTypes, defaults, path),
		getRelationships: async (sourcePath = "") => {
			const key = normalizePath(sourcePath);
			const existing = relationships.get(key);
			if (existing) return existing;
			const relsPath = relationshipPartName(key);
			if (!zip.has(relsPath)) {
				relationships.set(key, []);
				return [];
			}
			const doc = parseXml(decodeUtf8(await zip.read(relsPath)), relsPath);
			const rels = [];
			for (const el of Array.from(doc.documentElement.children)) {
				if (localName(el) !== "Relationship") continue;
				const id = el.getAttribute("Id") ?? "";
				const type = el.getAttribute("Type") ?? "";
				const target = el.getAttribute("Target") ?? "";
				const targetMode = el.getAttribute("TargetMode") ?? void 0;
				if (!id || !target) continue;
				rels.push({
					id,
					type,
					target,
					targetMode,
					source: key,
					resolvedTarget: targetMode === "External" ? target : resolvePart(key, target)
				});
			}
			relationships.set(key, rels);
			return rels;
		}
	};
}
function relationshipPartName(sourcePath) {
	const source = normalizePath(sourcePath);
	if (!source) return "_rels/.rels";
	const slash = source.lastIndexOf("/");
	if (slash < 0) return `_rels/${source}.rels`;
	return `${source.slice(0, slash)}/_rels/${source.slice(slash + 1)}.rels`;
}
function getContentTypeFor(overrides, defaults, path) {
	const n = normalizePath(path);
	const o = overrides.get(n);
	if (o) return o;
	const dot = n.lastIndexOf(".");
	if (dot >= 0) return defaults.get(n.slice(dot + 1).toLowerCase());
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/document.js
function makeLoadedDocument(base, pageData, zip, opc) {
	return {
		...base,
		pages: pageData.map((p) => ({
			id: p.id,
			name: p.name,
			kind: p.kind,
			width: p.width,
			height: p.height,
			sourcePath: p.sourcePath,
			diagnostics: p.diagnostics
		})),
		pageData,
		zip,
		opc
	};
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/w3d.js
var TKSH_COMPRESSED_POINTS = 1;
var TKSH_TRISTRIPS = 4;
var TKSH_FIRSTPASS = 16;
var TKSH_BOUNDING_ONLY = 32;
var TKSH_EXPANDED = 128;
var TKSH2_HAS_NEGATIVE_FACES = 4;
var TKSH2_GLOBAL_QUANTIZATION = 8;
var CS_TRIVIAL = 1;
var CS_NONE = 4;
var CS_EDGEBREAKER = 5;
var MTABLE_HAS_LENGTHS = 1;
var MTABLE_HAS_M2STACKOFFSETS = 2;
var MTABLE_HAS_M2GATEOFFSETS = 4;
var MTABLE_HAS_DUMMIES = 8;
var MTABLE_HAS_PATCHES = 16;
var MTABLE_HAS_BOUNDING = 32;
var MTABLE_HAS_QUANTIZATION = 64;
var MTABLE_HAS_QUANTIZATION_NORMALS = 128;
var CASE_C = 0;
var CASE_L = 1;
var CASE_E = 2;
var CASE_R = 3;
var CASE_S = 4;
var CASE_M = 5;
var CASE_M2 = 6;
var GARBAGE_EDGE = -2139062144;
var POINTMAP_DUMMY = -2139062145;
var POINTMAP_ALIAS = -2139062146;
async function parseW3dModel(bytes, options = {}) {
	const diagnostics = [];
	const stream = await inflateW3dStream(bytes, diagnostics, options.sourcePath);
	const meshes = [];
	const seen = /* @__PURE__ */ new Set();
	const maxMeshes = options.maxMeshes ?? 1e4;
	const maxTriangles = options.maxTriangles ?? 1e7;
	let unsupportedEdgebreaker = 0;
	let falseShellCandidates = 0;
	let triangles = 0;
	for (let pos = 0; pos < stream.length && meshes.length < maxMeshes && triangles < maxTriangles; pos++) {
		if (stream[pos] !== 83) continue;
		try {
			const parsed = parseShellCandidate(stream, pos, meshes.length + 1);
			if (!parsed) continue;
			const key = `${parsed.sourceStart}:${parsed.sourceEnd}`;
			if (seen.has(key)) continue;
			seen.add(key);
			meshes.push(parsed);
			triangles += parsed.triangleCount;
			pos = Math.max(pos, parsed.sourceEnd - 1);
		} catch (err) {
			const msg = String(err);
			if (/edgebreaker/i.test(msg)) unsupportedEdgebreaker++;
			else falseShellCandidates++;
		}
	}
	if (unsupportedEdgebreaker > 0) diagnostics.push(diag("warning", "W3D_EDGEBREAKER_PARTIAL", `${unsupportedEdgebreaker} connectivity-compressed shell candidate(s) were skipped.`, options.sourcePath));
	if (meshes.length === 0) diagnostics.push(diag("error", "W3D_NO_MESHES", "No renderable W3D shell meshes were decoded.", options.sourcePath));
	const bounds = computeModelBounds(meshes);
	return {
		kind: "w3d-model",
		title: options.title ?? "3D Model",
		meshes,
		bounds,
		diagnostics,
		sourcePath: options.sourcePath,
		stats: {
			meshCount: meshes.length,
			vertexCount: meshes.reduce((s, m) => s + m.vertexCount, 0),
			triangleCount: meshes.reduce((s, m) => s + m.triangleCount, 0),
			decodedBytes: stream.byteLength,
			edgeCount: meshes.reduce((s, m) => s + Math.floor((m.edgeIndices?.length ?? 0) / 2), 0),
			materialCount: 0,
			textureCount: 0,
			pmiCount: 0,
			nodeCount: 0
		}
	};
}
async function inflateW3dStream(bytes, diagnostics, sourcePath) {
	const inflater = new BrowserInflateProvider();
	for (let p = 0; p + 6 < bytes.length; p++) {
		if (bytes[p] !== 120) continue;
		const b = bytes[p + 1];
		if (b !== 1 && b !== 94 && b !== 156 && b !== 218) continue;
		const zlibCandidate = bytes.subarray(p);
		const trimmed = trimTrailingNulPadding(zlibCandidate);
		const attempts = [];
		if (trimmed.length > 6) attempts.push({
			label: "raw-deflate-body",
			data: trimmed.subarray(2, trimmed.length - 4)
		});
		if (zlibCandidate.length > 2) attempts.push({
			label: "raw-deflate-body-with-trailer",
			data: zlibCandidate.subarray(2)
		});
		attempts.push({
			label: "zlib-trimmed",
			data: trimmed
		});
		if (trimmed.length !== zlibCandidate.length) attempts.push({
			label: "zlib-with-padding",
			data: zlibCandidate
		});
		for (const attempt of attempts) try {
			return await inflater.inflateRaw(attempt.data);
		} catch {}
	}
	return bytes;
}
function trimTrailingNulPadding(data) {
	let end = data.length;
	while (end > 0 && data[end - 1] === 0) end--;
	return end === data.length ? data : data.subarray(0, end);
}
function parseShellCandidate(bytes, start, ordinal) {
	const r = reader(bytes, start + 1);
	const subop = getU8(r);
	let subop2 = 0;
	if ((subop & TKSH_EXPANDED) !== 0) subop2 = getU16(r);
	if ((subop & TKSH_BOUNDING_ONLY) !== 0) return void 0;
	if ((subop & TKSH_FIRSTPASS) === 0) getI32(r);
	getU8(r);
	if ((subop2 & 3) !== 0) return void 0;
	const scheme = (subop & 65) !== 0 ? getU8(r) : CS_NONE;
	let positions;
	let indices;
	let decodeKind;
	if (scheme === CS_EDGEBREAKER) {
		const len = getI32(r);
		if (len <= 0 || r.pos + len > bytes.length || len > 1e8) throw new Error("Bad edgebreaker block length.");
		r.pos;
		const eb = bytes.subarray(r.pos, r.pos + len);
		r.pos += len;
		const ebDecoded = decodeEdgebreaker(eb);
		if ((subop & TKSH_COMPRESSED_POINTS) === 0) {
			const pointFloats = ebDecoded.pointCount * 3;
			if (r.pos + pointFloats * 4 > bytes.length) throw new Error("Edgebreaker shell has no following full-resolution vertex array.");
			positions = readFloat32Array(bytes, r.pos, pointFloats);
			r.pos += pointFloats * 4;
		} else throw new Error("edgebreaker quantized-point reconstruction is not enabled for this shell.");
		indices = indexArrayFor(ebDecoded.faces, ebDecoded.pointCount);
		decodeKind = `edgebreaker-v${eb[0] ?? 0}`;
		if (indices.length < 3) throw new Error("Empty edgebreaker face list.");
	} else if (scheme === CS_NONE) {
		const pointCount = getI32(r);
		if (pointCount <= 0 || pointCount > 1e7) throw new Error("Bad uncompressed shell point count.");
		positions = readFloat32Array(bytes, r.pos, pointCount * 3);
		r.pos += pointCount * 3 * 4;
		indices = indexArrayFor(readCompressedFaceList(r, pointCount, (subop & TKSH_TRISTRIPS) !== 0, false).indices, pointCount);
		decodeKind = "uncompressed";
	} else if (scheme === CS_TRIVIAL) {
		const pointCount = getI32(r);
		if (pointCount <= 0 || pointCount > 1e7) throw new Error("Bad compressed shell point count.");
		const bounds = (subop2 & TKSH2_GLOBAL_QUANTIZATION) === 0 ? readFloatTuple(r, 6) : [
			0,
			0,
			0,
			1,
			1,
			1
		];
		const bitsPerSample = getU8(r);
		const dataLen = getI32(r);
		if (dataLen <= 0 || r.pos + dataLen > bytes.length) throw new Error("Bad compressed shell point payload length.");
		positions = decodeQuantizedPoints(bytes.subarray(r.pos, r.pos + dataLen), pointCount, bitsPerSample, bounds);
		r.pos += dataLen;
		indices = indexArrayFor(readCompressedFaceList(r, pointCount, (subop & TKSH_TRISTRIPS) !== 0, (subop2 & TKSH2_HAS_NEGATIVE_FACES) !== 0).indices, pointCount);
		decodeKind = `quantized-${bitsPerSample}`;
	} else throw new Error(`Unsupported W3D shell compression scheme ${scheme}.`);
	if (indices.length < 3 || positions.length < 9) return void 0;
	const normals = computeVertexNormals(positions, indices);
	const edgeIndices = computeFeatureEdges(positions, indices);
	const bounds = boundsFromPositions(positions);
	return {
		id: `w3d-mesh-${ordinal}`,
		name: `Mesh ${ordinal}`,
		positions,
		normals,
		indices,
		edgeIndices,
		vertexCount: Math.floor(positions.length / 3),
		triangleCount: Math.floor(indices.length / 3),
		bounds,
		color: colorForOrdinal(ordinal),
		sourceStart: start,
		sourceEnd: r.pos,
		decodeKind
	};
}
function decodeEdgebreaker(block) {
	if (block.byteLength < 24) throw new Error("Edgebreaker block is too short.");
	const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
	const scheme = block[0];
	const mtableScheme = block[1];
	const pointsScheme = block[2];
	const normalsScheme = block[3];
	const opsLen = view.getInt32(4, true);
	const mtableLen = view.getInt32(8, true);
	view.getInt32(12, true);
	const pointCount = view.getInt32(16, true);
	view.getInt32(20, true);
	if (scheme < 0 || scheme > 2 || mtableScheme !== 0 || pointsScheme < 0 || pointsScheme > 3 || normalsScheme < 0 || normalsScheme > 3) throw new Error("Unsupported edgebreaker header.");
	if (opsLen <= 0 || mtableLen < 0 || pointCount <= 0) throw new Error("Invalid edgebreaker sizes.");
	let p = scheme >= 1 ? 24 : 20;
	const ops = block.subarray(p, p + opsLen);
	p += opsLen + toNext4(p + opsLen);
	if (p + mtableLen > block.length) throw new Error("Invalid edgebreaker MTable offset.");
	const mtable = unpackMTable(block.subarray(p, p + mtableLen));
	p += mtableLen + toNext4(p + mtableLen);
	const processed = processEdgebreakerOpcodes(ops, mtable);
	const patched = patchEdgebreakerFaces(processed.opcodePointCount, mtable, processed.faces);
	const faces = [];
	for (const f of patched) faces.push(f[1], f[2], f[3]);
	const maxIndex = faces.reduce((m, v) => Math.max(m, v), -1);
	const minIndex = faces.reduce((m, v) => Math.min(m, v), pointCount);
	if (minIndex < 0 || maxIndex >= pointCount) throw new Error(`Edgebreaker face index range ${minIndex}..${maxIndex} is outside point count ${pointCount}.`);
	return {
		pointCount,
		faces,
		triangleCount: faces.length / 3,
		diagnostics: []
	};
}
function unpackMTable(buf) {
	const r = reader(buf, 0);
	const flags = getI32(r);
	const mlengthsUsed = (flags & MTABLE_HAS_LENGTHS) !== 0 ? getI32(r) : 0;
	const m2stackUsed = (flags & MTABLE_HAS_M2STACKOFFSETS) !== 0 ? getI32(r) : 0;
	const m2gateUsed = (flags & MTABLE_HAS_M2GATEOFFSETS) !== 0 ? m2stackUsed : 0;
	const dummiesUsed = (flags & MTABLE_HAS_DUMMIES) !== 0 ? getI32(r) : 0;
	const patchesUsed = (flags & MTABLE_HAS_PATCHES) !== 0 ? getI32(r) : 0;
	const mlengths = readIntArray(r, mlengthsUsed);
	const m2stackoffsets = readIntArray(r, m2stackUsed);
	const m2gateoffsets = readIntArray(r, m2gateUsed);
	const dummies = [];
	let prev = 0;
	for (let i = 0; i < dummiesUsed; i++) {
		prev += getI32(r);
		dummies.push(prev);
	}
	const patches = [];
	const patchMap = /* @__PURE__ */ new Map();
	prev = 0;
	for (let i = 0; i < patchesUsed; i += 2) {
		const oldVertex = getI32(r) + prev;
		prev = oldVertex;
		const newVertex = getI32(r);
		patches.push(oldVertex, newVertex);
		patchMap.set(oldVertex, newVertex);
	}
	return {
		flags,
		mlengths,
		m2stackoffsets,
		m2gateoffsets,
		dummies,
		patches,
		patchMap,
		bounding: (flags & MTABLE_HAS_BOUNDING) !== 0 ? readFloatTuple(r, 6) : void 0,
		quantization: (flags & MTABLE_HAS_QUANTIZATION) !== 0 ? [
			getI32(r),
			getI32(r),
			getI32(r)
		] : [
			11,
			11,
			11
		],
		normalQuantization: (flags & MTABLE_HAS_QUANTIZATION_NORMALS) !== 0 ? [
			getI32(r),
			getI32(r),
			getI32(r)
		] : [
			11,
			11,
			11
		]
	};
}
function processEdgebreakerOpcodes(opsBytes, mtable) {
	const ops = Array.from(opsBytes);
	const faces = [];
	let v = 0;
	let i = 0;
	while (i < ops.length) {
		const { ecount, offsets } = preprocessEdgebreakerOps(ops, i, mtable);
		if (ecount <= 0) throw new Error(`Invalid edgebreaker boundary loop length ${ecount}.`);
		const N = [];
		const P = [];
		const start = [];
		const twin = [];
		const edges = [];
		for (let j = 0; j < ecount; j++) {
			P[j] = j - 1;
			N[j] = j + 1;
			start[j] = v++;
			twin[j] = GARBAGE_EDGE;
		}
		P[0] = ecount - 1;
		N[ecount - 1] = 0;
		let gi = 0;
		let scount = 0;
		let hashUsed = ecount;
		const gateStack = [];
		const availableEdges = [];
		for (;;) {
			if (availableEdges.length === 0) availableEdges.push(hashUsed++);
			while (hashUsed + 2 >= N.length) {
				N.push(0);
				P.push(0);
				start.push(0);
				twin.push(GARBAGE_EDGE);
			}
			const ei = edges.length;
			edges.push({
				start: 0,
				twin: GARBAGE_EDGE
			}, {
				start: 0,
				twin: GARBAGE_EDGE
			}, {
				start: 0,
				twin: GARBAGE_EDGE
			});
			const face = [
				3,
				start[gi],
				start[N[gi]],
				-1
			];
			if (twin[gi] !== GARBAGE_EDGE && twin[gi] >= 0 && twin[gi] < edges.length) edges[twin[gi]].twin = ei;
			edges[ei].twin = twin[gi];
			edges[ei].start = start[gi];
			edges[ei + 1].start = start[N[gi]];
			const op = ops[i++];
			if (op === CASE_C) {
				face[3] = v;
				edges[ei + 1].twin = GARBAGE_EDGE;
				edges[ei + 2].twin = GARBAGE_EDGE;
				edges[ei + 2].start = v;
				const hi = availableEdges.pop();
				N[P[gi]] = hi;
				P[hi] = P[gi];
				N[hi] = gi;
				P[gi] = hi;
				start[hi] = start[gi];
				start[gi] = v;
				twin[gi] = ei + 1;
				twin[hi] = ei + 2;
				v++;
			} else if (op === CASE_L) {
				face[3] = start[P[gi]];
				edges[ei + 1].twin = GARBAGE_EDGE;
				edges[ei + 2].twin = twin[P[gi]];
				if (twin[P[gi]] !== GARBAGE_EDGE && twin[P[gi]] >= 0 && twin[P[gi]] < edges.length) edges[twin[P[gi]]].twin = ei + 2;
				edges[ei + 2].start = start[P[gi]];
				start[gi] = start[P[gi]];
				availableEdges.push(P[gi]);
				P[gi] = P[P[gi]];
				N[P[gi]] = gi;
				twin[gi] = ei + 1;
			} else if (op === CASE_E) {
				face[3] = start[P[gi]];
				edges[ei + 1].twin = twin[N[gi]];
				if (twin[N[gi]] !== GARBAGE_EDGE && twin[N[gi]] >= 0 && twin[N[gi]] < edges.length) edges[twin[N[gi]]].twin = ei + 1;
				edges[ei + 2].twin = twin[P[gi]];
				if (twin[P[gi]] !== GARBAGE_EDGE && twin[P[gi]] >= 0 && twin[P[gi]] < edges.length) edges[twin[P[gi]]].twin = ei + 2;
				edges[ei + 2].start = start[P[gi]];
				availableEdges.push(gi, P[gi], N[gi]);
				if (isValidFace(face)) faces.push(face);
				if (gateStack.length > 0) gi = gateStack.pop();
				else break;
			} else if (op === CASE_R) {
				face[3] = start[N[N[gi]]];
				edges[ei + 1].twin = twin[N[gi]];
				if (twin[N[gi]] !== GARBAGE_EDGE && twin[N[gi]] >= 0 && twin[N[gi]] < edges.length) edges[twin[N[gi]]].twin = ei + 1;
				edges[ei + 2].twin = GARBAGE_EDGE;
				edges[ei + 2].start = start[N[N[gi]]];
				availableEdges.push(N[gi]);
				N[gi] = N[N[gi]];
				P[N[gi]] = gi;
				twin[gi] = ei + 2;
			} else if (op === CASE_S) {
				let bi = gi;
				const nSteps = (offsets[scount] ?? 0) + 1;
				for (let k = 0; k < nSteps; k++) bi = N[bi];
				face[3] = start[N[bi]];
				edges[ei + 1].twin = GARBAGE_EDGE;
				edges[ei + 2].twin = GARBAGE_EDGE;
				edges[ei + 2].start = start[N[bi]];
				scount++;
				const hi = availableEdges.pop();
				gateStack.push(hi);
				N[P[gi]] = hi;
				P[hi] = P[gi];
				N[hi] = N[bi];
				P[N[bi]] = hi;
				twin[hi] = ei + 2;
				start[hi] = start[gi];
				start[gi] = start[N[bi]];
				twin[gi] = ei + 1;
				P[gi] = bi;
				N[bi] = gi;
			} else throw new Error(`Unsupported edgebreaker opcode ${op}.`);
			if (op !== CASE_E) if (isValidFace(face)) faces.push(face);
			else throw new Error("Invalid edgebreaker triangle.");
			if (i >= ops.length) break;
		}
	}
	return {
		faces,
		opcodePointCount: v
	};
}
function preprocessEdgebreakerOps(ops, start, mtable) {
	let ecount = 0;
	let scount = 0;
	let mcount = 0;
	let m2count = 0;
	const eStack = [];
	const sStack = [];
	const offsets = [];
	for (let i = start; i < ops.length; i++) {
		const op = ops[i];
		if (op === CASE_C) ecount -= 1;
		else if (op === CASE_L) ecount += 1;
		else if (op === CASE_E) {
			ecount += 3;
			if (eStack.length > 0) {
				const s = sStack.pop();
				offsets[s] = ecount - 2 - eStack.pop();
			} else break;
		} else if (op === CASE_R) ecount += 1;
		else if (op === CASE_S) {
			ecount -= 1;
			sStack.push(scount);
			eStack.push(ecount);
			offsets[scount] = 0;
			scount++;
		} else if (op === CASE_M) {
			const length = mtable.mlengths[mcount++] ?? 0;
			ecount -= length + 1;
		} else if (op === CASE_M2) {
			mtable.mlengths[m2count];
			ecount -= 1;
			m2count++;
		} else throw new Error(`Bad edgebreaker opcode ${op}.`);
	}
	return {
		ecount,
		offsets
	};
}
function patchEdgebreakerFaces(opcodePointCount, mtable, faces) {
	const pointMap = new Int32Array(opcodePointCount);
	for (const d of mtable.dummies) if (d >= 0 && d < opcodePointCount) pointMap[d] = POINTMAP_DUMMY;
	for (let i = 0; i + 1 < mtable.patches.length; i += 2) {
		const oldVertex = mtable.patches[i];
		if (oldVertex >= 0 && oldVertex < opcodePointCount && pointMap[oldVertex] !== POINTMAP_DUMMY) pointMap[oldVertex] = POINTMAP_ALIAS;
	}
	let shift = 0;
	for (let i = 0; i < opcodePointCount; i++) if (pointMap[i] < 0) shift++;
	else pointMap[i] = shift;
	const out = [];
	for (const f of faces) {
		const a = f[1], b = f[2], c = f[3];
		if (isDummyOrOutOfRange(a, pointMap) || isDummyOrOutOfRange(b, pointMap) || isDummyOrOutOfRange(c, pointMap)) continue;
		const mapped = [
			3,
			mapPatchedVertex(a, pointMap, mtable),
			mapPatchedVertex(b, pointMap, mtable),
			mapPatchedVertex(c, pointMap, mtable)
		];
		if (isValidFace(mapped)) out.push(mapped);
	}
	return out;
}
function mapPatchedVertex(v, pointMap, mtable) {
	return pointMap[v] === POINTMAP_ALIAS ? mtable.patchMap.get(v) ?? v : v - pointMap[v];
}
function isDummyOrOutOfRange(v, pointMap) {
	return v < 0 || v >= pointMap.length || pointMap[v] === POINTMAP_DUMMY;
}
function isValidFace(face) {
	return face[1] !== face[2] && face[2] !== face[3] && face[3] !== face[1] && face[1] >= 0 && face[2] >= 0 && face[3] >= 0;
}
function readCompressedFaceList(r, pointCount, tristrips, signed) {
	getU8(r);
	const len = getI32(r);
	if (len <= 0 || r.pos + len > r.bytes.length) throw new Error("Bad compressed face-list payload length.");
	const payload = r.bytes.subarray(r.pos, r.pos + len);
	r.pos += len;
	const values = decodeTrivialFaceList(payload, signed);
	return {
		indices: triangulateFaceList(values, pointCount, tristrips),
		values
	};
}
function decodeTrivialFaceList(payload, signed) {
	if (payload.length < 2) throw new Error("Face payload is too short.");
	const bits = payload[0];
	const bytesPerSample = bits / 8;
	if (bytesPerSample !== 1 && bytesPerSample !== 2 && bytesPerSample !== 4) throw new Error(`Unsupported face-list sample width ${bits}.`);
	const out = [];
	const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
	for (let p = 1; p + bytesPerSample <= payload.length; p += bytesPerSample) if (bytesPerSample === 1) out.push(signed ? view.getInt8(p) : view.getUint8(p));
	else if (bytesPerSample === 2) out.push(signed ? view.getInt16(p, true) : view.getUint16(p, true));
	else out.push(signed ? view.getInt32(p, true) : view.getUint32(p, true));
	return out;
}
function triangulateFaceList(values, pointCount, tristrips) {
	const out = [];
	let i = 0;
	while (i < values.length) {
		const rawCount = values[i++];
		const count = Math.abs(rawCount);
		if (count < 3 || i + count > values.length) throw new Error("Invalid face list run.");
		const verts = values.slice(i, i + count);
		i += count;
		if (verts.some((v) => v < 0 || v >= pointCount)) throw new Error("Face index out of range.");
		if (tristrips) if (rawCount > 0) for (let k = 2; k < verts.length; k++) if ((k & 1) === 0) out.push(verts[k - 2], verts[k - 1], verts[k]);
		else out.push(verts[k - 1], verts[k - 2], verts[k]);
		else for (let k = 2; k < verts.length; k++) out.push(verts[0], verts[k - 1], verts[k]);
		else if (rawCount > 0) for (let k = 2; k < verts.length; k++) out.push(verts[0], verts[k - 1], verts[k]);
	}
	return out;
}
function decodeQuantizedPoints(payload, count, bitsPerSample, bounds) {
	if (bitsPerSample === 8) {
		if (payload.length < count * 3) throw new Error("Short 8-bit quantized point payload.");
		const out = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) for (let a = 0; a < 3; a++) {
			const v = payload[i * 3 + a];
			const lo = bounds[a];
			const hi = bounds[a + 3];
			out[i * 3 + a] = v === 255 ? hi : lo + (hi - lo) * (v / 255);
		}
		return out;
	}
	const out = new Float32Array(count * 3);
	let bit = 0;
	const max = (1 << bitsPerSample) - 1;
	for (let i = 0; i < count * 3; i++) {
		let raw = 0;
		for (let k = 0; k < bitsPerSample; k++) {
			const b = payload[bit >> 3] ?? 0;
			raw = raw << 1 | b >> 7 - (bit & 7) & 1;
			bit++;
		}
		const a = i % 3;
		const lo = bounds[a];
		const hi = bounds[a + 3];
		out[i] = raw === max ? hi : lo + (hi - lo) * (raw / max);
	}
	return out;
}
function indexArrayFor(indices, vertexCount) {
	if (vertexCount <= 65535) return new Uint16Array(indices);
	return new Uint32Array(indices);
}
function computeVertexNormals(positions, indices) {
	const normals = new Float32Array(positions.length);
	for (let i = 0; i + 2 < indices.length; i += 3) {
		const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3;
		const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
		const bx = positions[ib], by = positions[ib + 1], bz = positions[ib + 2];
		const cx = positions[ic], cy = positions[ic + 1], cz = positions[ic + 2];
		const abx = bx - ax, aby = by - ay, abz = bz - az;
		const acx = cx - ax, acy = cy - ay, acz = cz - az;
		const nx = aby * acz - abz * acy;
		const ny = abz * acx - abx * acz;
		const nz = abx * acy - aby * acx;
		normals[ia] = (normals[ia] ?? 0) + nx;
		normals[ia + 1] = (normals[ia + 1] ?? 0) + ny;
		normals[ia + 2] = (normals[ia + 2] ?? 0) + nz;
		normals[ib] = (normals[ib] ?? 0) + nx;
		normals[ib + 1] = (normals[ib + 1] ?? 0) + ny;
		normals[ib + 2] = (normals[ib + 2] ?? 0) + nz;
		normals[ic] = (normals[ic] ?? 0) + nx;
		normals[ic + 1] = (normals[ic + 1] ?? 0) + ny;
		normals[ic + 2] = (normals[ic + 2] ?? 0) + nz;
	}
	for (let i = 0; i < normals.length; i += 3) {
		const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
		const len = Math.hypot(nx, ny, nz) || 1;
		normals[i] = nx / len;
		normals[i + 1] = ny / len;
		normals[i + 2] = nz / len;
	}
	return normals;
}
function computeFeatureEdges(positions, indices, creaseAngleRadians = Math.PI / 5) {
	if (indices.length < 3) return void 0;
	const triNormals = [];
	const edges = /* @__PURE__ */ new Map();
	for (let i = 0, tri = 0; i + 2 < indices.length; i += 3, tri++) {
		const a = indices[i], b = indices[i + 1], c = indices[i + 2];
		const n = faceNormal(positions, a, b, c);
		triNormals.push(n);
		addEdge(edges, a, b, tri);
		addEdge(edges, b, c, tri);
		addEdge(edges, c, a, tri);
	}
	const threshold = Math.cos(creaseAngleRadians);
	const out = [];
	for (const e of edges.values()) if (e.tris.length === 1) out.push(e.a, e.b);
	else if (e.tris.length >= 2) {
		let sharp = false;
		for (let i = 0; i < e.tris.length && !sharp; i++) for (let j = i + 1; j < e.tris.length; j++) {
			const na = triNormals[e.tris[i]];
			const nb = triNormals[e.tris[j]];
			if (na[0] * nb[0] + na[1] * nb[1] + na[2] * nb[2] < threshold) {
				sharp = true;
				break;
			}
		}
		if (sharp) out.push(e.a, e.b);
	}
	if (out.length === 0) return void 0;
	return indexArrayFor(out, Math.floor(positions.length / 3));
}
function faceNormal(positions, a, b, c) {
	const ia = a * 3, ib = b * 3, ic = c * 3;
	const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
	const bx = positions[ib], by = positions[ib + 1], bz = positions[ib + 2];
	const cx = positions[ic], cy = positions[ic + 1], cz = positions[ic + 2];
	const abx = bx - ax, aby = by - ay, abz = bz - az;
	const acx = cx - ax, acy = cy - ay, acz = cz - az;
	let nx = aby * acz - abz * acy;
	let ny = abz * acx - abx * acz;
	let nz = abx * acy - aby * acx;
	const len = Math.hypot(nx, ny, nz) || 1;
	nx /= len;
	ny /= len;
	nz /= len;
	return [
		nx,
		ny,
		nz
	];
}
function addEdge(edges, a, b, tri) {
	const x = Math.min(a, b), y = Math.max(a, b);
	const key = `${x}:${y}`;
	let e = edges.get(key);
	if (!e) {
		e = {
			a: x,
			b: y,
			tris: []
		};
		edges.set(key, e);
	}
	e.tris.push(tri);
}
function computeModelBounds(meshes) {
	if (meshes.length === 0) return {
		min: [
			0,
			0,
			0
		],
		max: [
			1,
			1,
			1
		],
		center: [
			.5,
			.5,
			.5
		],
		radius: 1
	};
	const min = [
		Infinity,
		Infinity,
		Infinity
	];
	const max = [
		-Infinity,
		-Infinity,
		-Infinity
	];
	for (const mesh of meshes) for (let a = 0; a < 3; a++) {
		min[a] = Math.min(min[a], mesh.bounds.min[a]);
		max[a] = Math.max(max[a], mesh.bounds.max[a]);
	}
	const center = [
		(min[0] + max[0]) / 2,
		(min[1] + max[1]) / 2,
		(min[2] + max[2]) / 2
	];
	return {
		min,
		max,
		center,
		radius: Math.max(1e-6, Math.hypot(max[0] - center[0], max[1] - center[1], max[2] - center[2]))
	};
}
function boundsFromPositions(positions) {
	const min = [
		Infinity,
		Infinity,
		Infinity
	];
	const max = [
		-Infinity,
		-Infinity,
		-Infinity
	];
	for (let i = 0; i < positions.length; i += 3) {
		const x = positions[i], y = positions[i + 1], z = positions[i + 2];
		if (x < min[0]) min[0] = x;
		if (y < min[1]) min[1] = y;
		if (z < min[2]) min[2] = z;
		if (x > max[0]) max[0] = x;
		if (y > max[1]) max[1] = y;
		if (z > max[2]) max[2] = z;
	}
	return {
		min,
		max
	};
}
function colorForOrdinal(i) {
	const hue = i * .61803398875 % 1;
	const s = .34, l = .62;
	const q = .96 - l * s;
	const p = 2 * l - q;
	return [
		hue2rgb(p, q, hue + 1 / 3),
		hue2rgb(p, q, hue),
		hue2rgb(p, q, hue - 1 / 3)
	];
}
function hue2rgb(p, q, t) {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}
function readFloat32Array(bytes, offset, count) {
	if (offset + count * 4 > bytes.length) throw new Error("Float array exceeds W3D stream length.");
	const out = new Float32Array(count);
	const view = new DataView(bytes.buffer, bytes.byteOffset + offset, count * 4);
	for (let i = 0; i < count; i++) out[i] = view.getFloat32(i * 4, true);
	return out;
}
function readFloatTuple(r, count) {
	const out = [];
	for (let i = 0; i < count; i++) out.push(getF32(r));
	return out;
}
function readIntArray(r, count) {
	const out = [];
	for (let i = 0; i < count; i++) out.push(getI32(r));
	return out;
}
function reader(bytes, pos = 0) {
	return {
		bytes,
		pos,
		view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	};
}
function getU8(r) {
	if (r.pos >= r.bytes.length) throw new Error("Unexpected end of W3D stream.");
	return r.bytes[r.pos++];
}
function getU16(r) {
	const v = r.view.getUint16(r.pos, true);
	r.pos += 2;
	return v;
}
function getI32(r) {
	const v = r.view.getInt32(r.pos, true);
	r.pos += 4;
	return v;
}
function getF32(r) {
	const v = r.view.getFloat32(r.pos, true);
	r.pos += 4;
	return v;
}
function toNext4(i) {
	return 3 - (i - 1) % 4;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/emodelMetadata.js
async function enrichW3dModelFromEModelResources(model, resources, opc) {
	const diagnostics = model.diagnostics;
	model.metadata ?? (model.metadata = {});
	model.materials ?? (model.materials = []);
	model.textures ?? (model.textures = []);
	model.sceneTree ?? (model.sceneTree = []);
	model.pmi ?? (model.pmi = []);
	model.views ?? (model.views = []);
	model.animations ?? (model.animations = []);
	await collectTextures(model, resources, opc, diagnostics);
	const descriptor = resources.find((r) => /descriptor/i.test(r.role ?? "") || /descriptor\.xml$/i.test(r.path));
	if (descriptor && opc.zip.has(descriptor.path)) try {
		parseDescriptor(model, decodeUtf8(await opc.readBytes(descriptor.path)), descriptor.path);
	} catch (err) {
		diagnostics.push(diag("warning", "EMODEL_DESCRIPTOR_PARSE_FAILED", `Failed to parse eModel descriptor: ${String(err)}`, descriptor.path));
	}
	const contentDef = resources.find((r) => /content\s+definition/i.test(r.role ?? ""));
	const instanceInfos = contentDef && opc.zip.has(contentDef.path) ? parseContentDefinitionSafe(model, decodeUtf8(await opc.readBytes(contentDef.path)), contentDef.path, diagnostics) : [];
	const presentation = resources.find((r) => /content\s+presentation/i.test(r.role ?? ""));
	const labelByContentRef = /* @__PURE__ */ new Map();
	let instanceMaterials = /* @__PURE__ */ new Map();
	if (presentation && opc.zip.has(presentation.path)) try {
		const { nodes, pmi, views, animations, materials } = parseContentPresentation(decodeUtf8(await opc.readBytes(presentation.path)), presentation.path, labelByContentRef);
		instanceMaterials = materials;
		model.sceneTree = nodes;
		model.pmi = pmi;
		model.views = mergeViews(model.views ?? [], views);
		model.animations = animations;
		const existing = new Map((model.materials ?? []).map((m) => [m.id, m]));
		for (const mat of materials.values()) existing.set(mat.id, bindTextureByName(mat, model.textures ?? []));
		model.materials = Array.from(existing.values());
	} catch (err) {
		diagnostics.push(diag("warning", "EMODEL_PRESENTATION_PARSE_FAILED", `Failed to parse eModel presentation: ${String(err)}`, presentation.path));
	}
	attachSelectionMetadata(model, instanceInfos, labelByContentRef, instanceMaterials);
	const nodeCount = countSceneNodes(model.sceneTree ?? []);
	if ((model.views?.length ?? 0) > 0 && !model.initialView) model.initialView = model.views[0];
	model.stats.materialCount = model.materials?.length ?? 0;
	model.stats.textureCount = model.textures?.length ?? 0;
	model.stats.pmiCount = model.pmi?.length ?? 0;
	model.stats.nodeCount = nodeCount;
}
async function collectTextures(model, resources, opc, diagnostics) {
	const textures = [];
	for (const r of resources.filter((x) => /texture/i.test(x.role ?? "") || /texture/i.test(x.title ?? ""))) {
		if (!opc.zip.has(r.path)) continue;
		let width;
		let height;
		try {
			const size = imageSizeFromBytes$1(await opc.readBytes(r.path));
			width = size?.width;
			height = size?.height;
		} catch (err) {
			diagnostics.push(diag("warning", "EMODEL_TEXTURE_SIZE_FAILED", `Failed to read texture size: ${String(err)}`, r.path));
		}
		textures.push({
			id: r.path,
			name: cleanTitle(r.title) ?? basename$2(r.path),
			path: r.path,
			mediaType: r.mediaType,
			width,
			height,
			role: r.role
		});
	}
	model.textures = textures;
	if (textures.length > 0) {
		const tex = textures.find((t) => /thread/i.test(t.name ?? "")) ?? textures.find((t) => !/environment/i.test(t.name ?? "")) ?? textures[0];
		if (tex) model.materials = [{
			id: "dwfx-default-textured",
			name: "DWFx default material",
			color: [
				.72,
				.74,
				.78
			],
			textureId: tex.id,
			roughness: .6,
			metalness: .03,
			doubleSided: true,
			source: tex.path
		}];
	}
}
function parseDescriptor(model, xml, sourcePath) {
	const doc = parseXml(xml, sourcePath);
	const root = doc.documentElement;
	if (root) {
		const unitType = Array.from(root.getElementsByTagName("*")).find((e) => localName(e) === "Units")?.getAttribute("type");
		if (unitType) model.metadata.units = unitType;
		const spaceName = root.getAttribute("name");
		if (spaceName) model.metadata.spaceName = spaceName;
	}
	for (const prop of Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "Property")) {
		const name = prop.getAttribute("name");
		const value = prop.getAttribute("value");
		if (name && value) model.metadata[name] = value;
	}
	const home = makeViewFromDescriptorProperties(model.metadata);
	if (home) {
		model.views = mergeViews(model.views ?? [], [home]);
		model.initialView = home;
	}
}
function makeViewFromDescriptorProperties(meta) {
	const position = vector3(meta._ViewCubeHomeCameraPosition);
	const target = vector3(meta._ViewCubeHomeCameraTarget);
	const up = vector3(meta._ViewCubeHomeCameraUpVector);
	const field = vector3(meta._ViewCubeHomeCameraField);
	if (!position && !target && !up) return void 0;
	return {
		id: "descriptor-home-view",
		label: "Home",
		camera: {
			position,
			target,
			up,
			field,
			projection: meta._ViewCubeHomeCameraProjection === "1" ? "perspective" : "orthographic"
		}
	};
}
function parseContentDefinitionSafe(model, xml, sourcePath, diagnostics) {
	try {
		const doc = parseXml(xml, sourcePath);
		const instances = [];
		for (const el of Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "Instance")) {
			const id = el.getAttribute("id") ?? "";
			if (!id) continue;
			instances.push({
				id,
				renderableRef: el.getAttribute("renderableRef") ?? void 0,
				node: el.getAttribute("node") ?? void 0,
				geometricVariation: el.getAttribute("geometricVariation") ?? void 0
			});
		}
		model.metadata.contentInstanceCount = String(instances.length);
		return instances;
	} catch (err) {
		diagnostics.push(diag("warning", "EMODEL_CONTENTDEF_PARSE_FAILED", `Failed to parse eModel content definition: ${String(err)}`, sourcePath));
		return [];
	}
}
function parseContentPresentation(xml, sourcePath, labelByContentRef) {
	const doc = parseXml(xml, sourcePath);
	const topContainers = Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "View");
	const nodes = [];
	for (const view of topContainers) {
		const viewNodes = nodeChildrenUnder(view);
		for (const n of viewNodes) nodes.push(parseSceneNode(n, labelByContentRef));
	}
	if (nodes.length === 0) for (const n of Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "ReferenceNode" && !hasAncestorReferenceNode(e))) nodes.push(parseSceneNode(n, labelByContentRef));
	const views = [];
	for (const modelView of Array.from(doc.getElementsByTagName("*")).filter((e) => /ModelViewNode|View/i.test(localName(e)))) {
		const id = modelView.getAttribute("id") ?? `view-${views.length + 1}`;
		const label = modelView.getAttribute("label") ?? modelView.getAttribute("name") ?? id;
		const camEl = directChildren(modelView).find((e) => localName(e) === "Camera") ?? Array.from(modelView.getElementsByTagName("*")).find((e) => localName(e) === "Camera");
		const camera = camEl ? cameraFromElement(camEl) : void 0;
		if (camera || /ModelViewNode/i.test(localName(modelView))) views.push({
			id,
			label,
			camera
		});
	}
	const pmi = [];
	for (const el of Array.from(doc.getElementsByTagName("*"))) {
		const ln = localName(el);
		if (!/PMI|Markup|Dimension|Annotation|Callout|Leader|Note/i.test(ln)) continue;
		pmi.push({
			id: el.getAttribute("id") ?? `pmi-${pmi.length + 1}`,
			type: /Leader/i.test(ln) ? "leader" : /Text|Note|Dimension/i.test(ln) ? "text" : "markup",
			label: el.getAttribute("label") ?? el.getAttribute("name") ?? ln,
			text: el.getAttribute("text") ?? el.textContent?.trim() ?? void 0,
			targetRef: el.getAttribute("contentElementRefs") ?? el.getAttribute("target") ?? void 0,
			properties: attributesToRecord(el)
		});
	}
	const animations = [];
	for (const el of Array.from(doc.getElementsByTagName("*")).filter((e) => /Animation|Sequence|Timeline/i.test(localName(e)))) animations.push({
		id: el.getAttribute("id") ?? `animation-${animations.length + 1}`,
		name: el.getAttribute("label") ?? el.getAttribute("name") ?? localName(el),
		targetRef: el.getAttribute("target") ?? void 0
	});
	const materials = parseInstanceMaterials(doc);
	return {
		nodes,
		pmi,
		views: dedupeViews(views),
		animations,
		materials
	};
}
function parseInstanceMaterials(doc) {
	const out = /* @__PURE__ */ new Map();
	for (const inst of Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "InstanceAttributes")) {
		const id = inst.getAttribute("id");
		if (!id) continue;
		const colorEl = directChildren(inst).find((e) => localName(e) === "Color") ?? Array.from(inst.getElementsByTagName("*")).find((e) => localName(e) === "Color");
		if (!colorEl) continue;
		const diffuse = Array.from(colorEl.getElementsByTagName("*")).find((e) => localName(e) === "Channel" && /diffuse/i.test(e.getAttribute("type") ?? ""));
		const env = Array.from(colorEl.getElementsByTagName("*")).find((e) => localName(e) === "Channel" && /environment/i.test(e.getAttribute("type") ?? ""));
		const red = Number(diffuse?.getAttribute("red"));
		const green = Number(diffuse?.getAttribute("green"));
		const blue = Number(diffuse?.getAttribute("blue"));
		if (![
			red,
			green,
			blue
		].every(Number.isFinite)) continue;
		const gloss = Number(colorEl.getAttribute("gloss"));
		const textureName = cleanTitle(env?.getAttribute("name") ?? void 0);
		out.set(id, {
			id: `material-${id}`,
			name: `Material ${id}`,
			color: [
				red,
				green,
				blue
			],
			opacity: 1,
			roughness: Number.isFinite(gloss) ? Math.max(.12, Math.min(.92, 1 - gloss / 128)) : .58,
			metalness: .03,
			textureName,
			doubleSided: true,
			source: "content-presentation"
		});
	}
	return out;
}
function bindTextureByName(material, textures) {
	if (material.textureId || !material.textureName) return material;
	const norm = normalizeMaterialName(material.textureName);
	const match = textures.find((t) => normalizeMaterialName(t.name ?? "").includes(norm) || norm.includes(normalizeMaterialName(t.name ?? "")));
	return match ? {
		...material,
		textureId: match.id
	} : material;
}
function normalizeMaterialName(s) {
	return s.replace(/&quot;/g, "").replace(/["{}]/g, "").toLowerCase();
}
function parseSceneNode(el, labelByContentRef) {
	const refs = splitRefs(el.getAttribute("contentElementRefs") ?? el.getAttribute("contentRefs") ?? "");
	const node = {
		id: el.getAttribute("id") ?? `node-${Math.random().toString(36).slice(2)}`,
		label: el.getAttribute("label") ?? el.getAttribute("name") ?? localName(el),
		contentRefs: refs,
		meshIds: [],
		children: [],
		properties: attributesToRecord(el)
	};
	for (const ref of refs) labelByContentRef.set(ref, node);
	for (const child of nodeChildrenUnder(el)) node.children.push(parseSceneNode(child, labelByContentRef));
	return node;
}
function attachSelectionMetadata(model, instances, labelByContentRef, instanceMaterials) {
	const labelForRef = new Map(labelByContentRef);
	const canBindMaterialsByOrdinal = instances.length === model.meshes.length;
	instances.forEach((inst, i) => {
		const mesh = model.meshes[i];
		if (!mesh) return;
		const refs = [inst.renderableRef, inst.id].filter(Boolean);
		mesh.selectionRefs = refs;
		mesh.nodeId = inst.node;
		const mat = instanceMaterials.get(inst.id) ?? (inst.renderableRef ? instanceMaterials.get(inst.renderableRef) : void 0);
		if (mat && canBindMaterialsByOrdinal) {
			mesh.materialId = mat.id;
			mesh.color = mat.color;
		}
		for (const ref of refs) {
			const node = labelForRef.get(ref);
			if (node) {
				mesh.name = node.label || mesh.name;
				node.meshIds.push(mesh.id);
				break;
			}
		}
	});
}
function cameraFromElement(el) {
	return {
		position: attrsVector3(el, "positionX", "positionY", "positionZ"),
		target: attrsVector3(el, "targetX", "targetY", "targetZ"),
		up: attrsVector3(el, "upVectorX", "upVectorY", "upVectorZ"),
		field: attrsVector3(el, "fieldWidth", "fieldHeight", "fieldDepth"),
		projection: el.getAttribute("projectionType") ?? void 0
	};
}
function attrsVector3(el, x, y, z) {
	const nums = [
		Number(el.getAttribute(x)),
		Number(el.getAttribute(y)),
		Number(el.getAttribute(z))
	];
	return nums.every(Number.isFinite) ? nums : void 0;
}
function vector3(raw) {
	if (!raw) return void 0;
	const n = raw.trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
	return n.length >= 3 ? [
		n[0],
		n[1],
		n[2]
	] : void 0;
}
function directChildren(el) {
	return Array.from(el.children);
}
function nodeChildrenUnder(el) {
	const out = [];
	for (const child of directChildren(el)) {
		const ln = localName(child);
		if (ln.endsWith("Node")) out.push(child);
		else if (ln === "Nodes" || ln === "Views") {
			for (const grand of directChildren(child)) if (localName(grand).endsWith("Node")) out.push(grand);
		}
	}
	return out;
}
function hasAncestorReferenceNode(el) {
	let p = parentElementOf(el);
	while (p) {
		if (localName(p) === "ReferenceNode") return true;
		p = parentElementOf(p);
	}
	return false;
}
function parentElementOf(el) {
	return (el.parentElement ?? el.parentNode) || void 0;
}
function attributesToRecord(el) {
	const out = {};
	for (const a of Array.from(el.attributes)) out[a.localName || a.name] = a.value;
	return out;
}
function splitRefs(raw) {
	return raw.trim().split(/[\s,]+/).filter(Boolean);
}
function mergeViews(a, b) {
	return dedupeViews([...a, ...b]);
}
function dedupeViews(views) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const v of views) {
		const key = v.id || v.label;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(v);
	}
	return out;
}
function countSceneNodes(nodes) {
	let n = 0;
	for (const node of nodes) n += 1 + countSceneNodes(node.children);
	return n;
}
function basename$2(path) {
	const i = path.lastIndexOf("/");
	return i >= 0 ? path.slice(i + 1) : path;
}
function cleanTitle(raw) {
	if (!raw) return void 0;
	return raw.replace(/^"|"$/g, "").replace(/&quot;/g, "\"");
}
function imageSizeFromBytes$1(bytes) {
	if (bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return {
		width: be32$1(bytes, 16),
		height: be32$1(bytes, 20)
	};
	if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
		let p = 2;
		while (p + 9 < bytes.length) {
			if (bytes[p] !== 255) {
				p++;
				continue;
			}
			const marker = bytes[p + 1];
			p += 2;
			while (bytes[p] === 255) p++;
			if (marker === 217 || marker === 218) break;
			if (p + 2 > bytes.length) break;
			const len = bytes[p] << 8 | bytes[p + 1];
			if (len < 2 || p + len > bytes.length) break;
			if (marker >= 192 && marker <= 195 || marker >= 197 && marker <= 199 || marker >= 201 && marker <= 203 || marker >= 205 && marker <= 207) return {
				width: bytes[p + 5] << 8 | bytes[p + 6],
				height: bytes[p + 3] << 8 | bytes[p + 4]
			};
			p += len;
		}
	}
}
function be32$1(bytes, offset) {
	return (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/dwfx.js
var XPS_FIXED_REP_TYPES = /* @__PURE__ */ new Set(["http://schemas.microsoft.com/xps/2005/06/fixedrepresentation", "http://schemas.openxps.org/oxps/v1.0/fixedrepresentation"]);
async function openDwfx(zip) {
	const opc = await createOpcView(zip);
	const diagnostics = [];
	const pageData = [];
	const manifestSections = await collectDwfxManifestPages(opc, pageData, diagnostics);
	if (pageData.length === 0) {
		const fdseqs = await findFixedDocumentSequences(opc, diagnostics);
		for (const fdseqPath of fdseqs) try {
			const fdseqDoc = parseXml(await opc.readText(fdseqPath), fdseqPath);
			const docRefs = Array.from(fdseqDoc.getElementsByTagName("*")).filter((e) => localName(e) === "DocumentReference");
			if (docRefs.length === 0) diagnostics.push(diag("warning", "DWFX_NO_DOCREF", `No DocumentReference elements found in ${fdseqPath}.`, fdseqPath));
			for (const docRef of docRefs) {
				const source = docRef.getAttribute("Source");
				if (!source) continue;
				await collectFixedDocumentPages(opc, resolvePart(fdseqPath, source), pageData, diagnostics);
			}
		} catch (err) {
			diagnostics.push(diag("warning", "DWFX_FDSEQ_READ_FAILED", `Failed to read fixed document sequence: ${String(err)}`, fdseqPath));
		}
	}
	if (pageData.length === 0) {
		const fpages = zip.entries.filter((e) => /\.fpage$/i.test(e.name));
		for (const [index, entry] of fpages.entries()) {
			const size = await readFixedPageSize(opc, entry.name, diagnostics);
			pageData.push({
				id: `page-${index + 1}`,
				name: entry.name.split("/").pop() ?? `Page ${index + 1}`,
				kind: "xps-fixed-page",
				sourcePath: entry.name,
				width: size.width,
				height: size.height,
				diagnostics: []
			});
		}
	}
	if (pageData.length === 0) {
		const has3d = zip.entries.some((e) => /\.(w3d|hsf)$/i.test(e.name)) || manifestSections.some((s) => /emodel/i.test(s.type));
		pageData.push({
			id: "unsupported-1",
			name: has3d ? "Unsupported 3D DWFx package" : "Unsupported DWFx package",
			kind: "unsupported",
			width: 1e3,
			height: 1e3,
			reason: has3d ? "This DWFx package contains 3D eModel/W3D content but no supported 2D FixedPage or preview image resource was found." : "No XPS FixedPage parts or supported DWF manifest preview resources were found.",
			diagnostics: [diag("error", "DWFX_NO_PAGES", "No supported renderable page was found in this DWFx package.")]
		});
	}
	return makeLoadedDocument({
		kind: "dwfx",
		pages: [],
		resources: opc.resources,
		diagnostics,
		packageEntries: zip.entries.map((e) => e.name)
	}, pageData, zip, opc);
}
function isProbablyDwfx(zip) {
	return zip.has("[Content_Types].xml") && (zip.has("_rels/.rels") || zip.entries.some((e) => /\.(fpage|dwfseq)$/i.test(e.name)));
}
async function collectDwfxManifestPages(opc, pageData, diagnostics) {
	const manifestPaths = await findDwfManifestPaths(opc, diagnostics);
	const allSections = [];
	for (const manifestPath of manifestPaths) try {
		const sections = parseDwfManifestSections(await opc.readText(manifestPath), manifestPath);
		allSections.push(...sections);
		diagnostics.push(diag("info", "DWFX_DWF_MANIFEST_FOUND", `Found DWFx DWF manifest with ${sections.length} section(s).`, manifestPath));
	} catch (err) {
		diagnostics.push(diag("warning", "DWFX_DWF_MANIFEST_PARSE_FAILED", `Failed to parse DWFx DWF manifest: ${String(err)}`, manifestPath));
	}
	for (const section of allSections.filter((s) => isEPlotSection(s))) {
		const fixedPage = resourceByRole$1(section, /2d\s+streaming\s+graphics/i) ?? section.resources.find((r) => /\.fpage$/i.test(r.path));
		if (!fixedPage || !/\.fpage$/i.test(stripQuery(fixedPage.path))) continue;
		const pagePath = stripQuery(fixedPage.path);
		if (!opc.zip.has(pagePath)) continue;
		const size = await readFixedPageSize(opc, pagePath, diagnostics);
		pageData.push({
			id: `page-${pageData.length + 1}`,
			name: section.title || fixedPage.title || basename$1(pagePath),
			kind: "xps-fixed-page",
			sourcePath: pagePath,
			width: Number.isFinite(size.width) && size.width > 0 ? size.width : 1e3,
			height: Number.isFinite(size.height) && size.height > 0 ? size.height : 1e3,
			diagnostics: []
		});
	}
	if (pageData.length > 0) return allSections;
	for (const section of allSections.filter((s) => isEModelSection(s))) {
		const preview = chooseSectionPreviewResource(section, opc.zip);
		const w3d = resourceByRole$1(section, /3d\s+streaming\s+graphics/i) ?? section.resources.find((r) => /\.(w3d|hsf)$/i.test(r.path));
		if (w3d && opc.zip.has(w3d.path)) try {
			const model = await parseW3dModel(await opc.zip.read(w3d.path), {
				title: section.title || w3d.title || basename$1(w3d.path),
				sourcePath: w3d.path
			});
			await enrichW3dModelFromEModelResources(model, section.resources, opc);
			if (model.meshes.length > 0) {
				pageData.push({
					id: `w3d-${pageData.length + 1}`,
					name: section.title || w3d.title || basename$1(w3d.path),
					kind: "w3d-model",
					sourcePath: w3d.path,
					width: 1e3,
					height: 1e3,
					model,
					diagnostics: model.diagnostics
				});
				continue;
			}
			pageData.push({
				id: `unsupported-3d-${pageData.length + 1}`,
				name: section.title || "Unsupported 3D eModel",
				kind: "unsupported",
				width: 1e3,
				height: 1e3,
				sourcePath: w3d.path,
				reason: "A W3D/HSF 3D stream exists, but no renderable shell geometry was decoded.  The package is intentionally not shown as a thumbnail so this failure is visible during production validation.",
				diagnostics: [...model.diagnostics, diag("warning", "DWFX_3D_W3D_UNSUPPORTED", "Detected a 3D W3D resource, but no renderable shell geometry was decoded.", w3d.path)]
			});
			continue;
		} catch (err) {
			pageData.push({
				id: `unsupported-3d-${pageData.length + 1}`,
				name: section.title || "Unsupported 3D eModel",
				kind: "unsupported",
				width: 1e3,
				height: 1e3,
				sourcePath: w3d.path,
				reason: `A W3D/HSF 3D stream exists, but geometry parsing failed: ${String(err)}`,
				diagnostics: [diag("warning", "DWFX_W3D_PARSE_FAILED", `Failed to parse W3D geometry: ${String(err)}`, w3d.path)]
			});
			continue;
		}
		if (preview && opc.zip.has(preview.path)) {
			const size = imageSizeFromBytes(await opc.zip.read(preview.path)) ?? {
				width: 1e3,
				height: 1e3
			};
			pageData.push({
				id: `image-${pageData.length + 1}`,
				name: section.title || preview.title || basename$1(preview.path),
				kind: "image",
				sourcePath: preview.path,
				mediaType: preview.mediaType ?? mimeFromPath(preview.path) ?? "image/png",
				width: size.width,
				height: size.height,
				diagnostics: [diag("info", "DWFX_3D_PREVIEW_ONLY", "No W3D/HSF geometry stream was declared; showing the embedded section preview image.", preview.path)]
			});
		}
	}
	return allSections;
}
async function findDwfManifestPaths(opc, diagnostics) {
	const out = /* @__PURE__ */ new Set();
	const add = (p) => {
		if (p) out.add(normalizePath(stripQuery(p)));
	};
	const dwfseqs = /* @__PURE__ */ new Set();
	try {
		const rootRels = await opc.getRelationships("");
		for (const rel of rootRels) {
			if (/documentsequence/i.test(rel.type) || /\.dwfseq$/i.test(rel.resolvedTarget)) dwfseqs.add(normalizePath(rel.resolvedTarget));
			if (/document$/i.test(rel.type) && /manifest\.xml$/i.test(rel.resolvedTarget)) add(rel.resolvedTarget);
		}
	} catch (err) {
		diagnostics.push(diag("warning", "DWFX_DWFSEQ_RELS_FAILED", `Failed to inspect DWFx package relationships: ${String(err)}`));
	}
	for (const e of opc.zip.entries) if (/\.dwfseq$/i.test(e.name)) dwfseqs.add(e.name);
	for (const dwfseqPath of dwfseqs) {
		if (!opc.zip.has(dwfseqPath)) continue;
		try {
			const doc = parseXml(await opc.readText(dwfseqPath), dwfseqPath);
			const refs = Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "ManifestReference");
			for (const ref of refs) add(ref.getAttribute("Source") ?? ref.getAttribute("source") ?? void 0);
			const rels = await opc.getRelationships(dwfseqPath).catch(() => []);
			for (const rel of rels) if (/document/i.test(rel.type) || /manifest\.xml$/i.test(rel.resolvedTarget)) add(rel.resolvedTarget);
		} catch (err) {
			diagnostics.push(diag("warning", "DWFX_DWFSEQ_READ_FAILED", `Failed to read DWFDocumentSequence ${dwfseqPath}: ${String(err)}`, dwfseqPath));
		}
	}
	for (const e of opc.zip.entries) if (/^dwf\/documents\/.*\/manifest\.xml$/i.test(e.name)) add(e.name);
	return Array.from(out).filter((p) => opc.zip.has(p));
}
async function findFixedDocumentSequences(opc, diagnostics) {
	const out = /* @__PURE__ */ new Set();
	try {
		const rootRels = await opc.getRelationships("");
		for (const rel of rootRels) if (XPS_FIXED_REP_TYPES.has(rel.type) || /fixedrepresentation/i.test(rel.type) || /\.fdseq$/i.test(rel.resolvedTarget)) out.add(normalizePath(rel.resolvedTarget));
	} catch (err) {
		diagnostics.push(diag("warning", "DWFX_ROOT_RELS_FAILED", `Failed to read package relationships: ${String(err)}`));
	}
	for (const o of opc.overrides) if (/fixeddocumentsequence/i.test(o.contentType) || /\.fdseq$/i.test(o.partName)) out.add(o.partName);
	for (const e of opc.zip.entries) if (/\.fdseq$/i.test(e.name)) out.add(e.name);
	return Array.from(out);
}
async function collectFixedDocumentPages(opc, fdocPath, pageData, diagnostics) {
	let xml;
	try {
		xml = await opc.readText(fdocPath);
	} catch (err) {
		diagnostics.push(diag("warning", "DWFX_FDOC_READ_FAILED", `Failed to read fixed document ${fdocPath}: ${String(err)}`, fdocPath));
		return;
	}
	const doc = parseXml(xml, fdocPath);
	const pageContents = Array.from(doc.getElementsByTagName("*")).filter((e) => localName(e) === "PageContent");
	for (const pageContent of pageContents) {
		const source = pageContent.getAttribute("Source");
		if (!source) continue;
		let pagePath = resolvePart(fdocPath, stripQuery(source));
		const relId = source.startsWith("#") ? source.slice(1) : void 0;
		if (relId) {
			const rel = (await opc.getRelationships(fdocPath)).find((r) => r.id === relId);
			if (rel) pagePath = rel.resolvedTarget;
		}
		pagePath = stripQuery(pagePath);
		const widthAttr = pageContent.getAttribute("Width");
		const heightAttr = pageContent.getAttribute("Height");
		const size = widthAttr && heightAttr ? {
			width: Number(widthAttr),
			height: Number(heightAttr)
		} : await readFixedPageSize(opc, pagePath, diagnostics);
		const index = pageData.length + 1;
		pageData.push({
			id: `page-${index}`,
			name: `Page ${index}`,
			kind: "xps-fixed-page",
			sourcePath: pagePath,
			width: Number.isFinite(size.width) && size.width > 0 ? size.width : 1e3,
			height: Number.isFinite(size.height) && size.height > 0 ? size.height : 1e3,
			diagnostics: []
		});
	}
}
async function readFixedPageSize(opc, pagePath, diagnostics) {
	try {
		const clean = stripQuery(pagePath);
		const doc = parseXml(decodeUtf8(await opc.readBytes(clean)), clean);
		const root = doc.documentElement ?? Array.from(doc.getElementsByTagName("*"))[0];
		return {
			width: Number(root?.getAttribute("Width") ?? 1e3),
			height: Number(root?.getAttribute("Height") ?? 1e3)
		};
	} catch (err) {
		diagnostics.push(diag("warning", "DWFX_PAGE_SIZE_FAILED", `Failed to read FixedPage size: ${String(err)}`, pagePath));
		return {
			width: 1e3,
			height: 1e3
		};
	}
}
function parseDwfManifestSections(xml, sourcePath) {
	const doc = parseXml(xml, sourcePath);
	return Array.from(doc.getElementsByTagName("*")).filter((el) => localName(el) === "Section").map((section, index) => {
		const name = attrAny$1(section, "name") ?? `section-${index + 1}`;
		const title = attrAny$1(section, "title") ?? name;
		return {
			type: attrAny$1(section, "type") ?? "",
			name,
			title,
			resources: Array.from(section.getElementsByTagName("*")).filter((el) => localName(el).endsWith("Resource") || localName(el) === "Resource").map((el) => {
				return {
					path: normalizePath(stripQuery(attrAny$1(el, "href") ?? "")),
					role: attrAny$1(el, "role"),
					mediaType: attrAny$1(el, "mime"),
					title: attrAny$1(el, "title"),
					size: numberAttr(el, "size")
				};
			}).filter((r) => r.path.length > 0)
		};
	}).filter((s) => s.resources.length > 0 || s.type.length > 0);
}
function isEPlotSection(section) {
	return /(^|\.)ePlot$/i.test(section.type) || /com\.autodesk\.dwf\.ePlot$/i.test(section.type);
}
function isEModelSection(section) {
	return /(^|\.)eModel$/i.test(section.type) || /com\.autodesk\.dwf\.eModel$/i.test(section.type);
}
function chooseSectionPreviewResource(section, zip) {
	const candidates = section.resources.filter((r) => /^(image\/|application\/octet-stream)/i.test(r.mediaType ?? "") || /\.(png|jpe?g|gif|bmp)$/i.test(r.path));
	const thumbnails = candidates.filter((r) => /thumbnail|preview/i.test(r.role ?? "") || /thumbnail|preview/i.test(r.title ?? ""));
	const pool = thumbnails.length > 0 ? thumbnails : candidates.filter((r) => !/texture/i.test(r.role ?? ""));
	return (pool.length > 0 ? pool : candidates).filter((r) => zip.has(r.path)).sort((a, b) => scorePreview(b) - scorePreview(a))[0];
}
function scorePreview(r) {
	let s = r.size ?? 0;
	if (/thumbnail/i.test(r.role ?? "")) s += 5e6;
	if (/preview/i.test(r.role ?? "")) s += 4e6;
	if (/icon/i.test(r.role ?? "")) s -= 2e6;
	if (/texture/i.test(r.role ?? "")) s -= 3e6;
	return s;
}
function attrAny$1(el, name) {
	return el.getAttribute(name) ?? el.getAttribute(`dwf:${name}`) ?? el.getAttribute(`ePlot:${name}`) ?? el.getAttribute(`eModel:${name}`) ?? Array.from(el.attributes).find((a) => a.localName === name)?.value ?? void 0;
}
function numberAttr(el, name) {
	const raw = attrAny$1(el, name);
	if (raw === void 0) return void 0;
	const n = Number(raw);
	return Number.isFinite(n) ? n : void 0;
}
function resourceByRole$1(section, re) {
	return section.resources.find((r) => re.test(r.role ?? ""));
}
function stripQuery(path) {
	return normalizePath((path.split(/[?#]/)[0] ?? path).replace(/^\//, ""));
}
function basename$1(path) {
	const clean = stripQuery(path);
	const i = clean.lastIndexOf("/");
	return i >= 0 ? clean.slice(i + 1) : clean;
}
function imageSizeFromBytes(bytes) {
	if (bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return {
		width: be32(bytes, 16),
		height: be32(bytes, 20)
	};
	if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
		let p = 2;
		while (p + 9 < bytes.length) {
			if (bytes[p] !== 255) {
				p++;
				continue;
			}
			const marker = bytes[p + 1];
			p += 2;
			while (bytes[p] === 255) p++;
			if (marker === 217 || marker === 218) break;
			if (p + 2 > bytes.length) break;
			const len = bytes[p] << 8 | bytes[p + 1];
			if (len < 2 || p + len > bytes.length) break;
			if (marker >= 192 && marker <= 195 || marker >= 197 && marker <= 199 || marker >= 201 && marker <= 203 || marker >= 205 && marker <= 207) return {
				width: bytes[p + 5] << 8 | bytes[p + 6],
				height: bytes[p + 3] << 8 | bytes[p + 4]
			};
			p += len;
		}
	}
}
function be32(bytes, offset) {
	return (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/xpsPath.js
function parsePathData(data) {
	const tokens = tokenizePath(data);
	const commands = [];
	let i = 0;
	let cmd = "";
	let cx = 0, cy = 0, sx = 0, sy = 0;
	let lastC;
	let lastQ;
	const hasNum = () => i < tokens.length && tokens[i]?.kind === "num";
	const readNum = () => {
		const t = tokens[i++];
		if (!t || t.kind !== "num") throw new Error(`Expected number in path data near token ${i}.`);
		return t.value;
	};
	const readFlag = () => readNum() !== 0;
	while (i < tokens.length) {
		const t = tokens[i];
		if (!t) break;
		if (t.kind === "cmd") {
			cmd = t.value;
			i++;
			if (cmd === "F" || cmd === "f") {
				if (hasNum()) readNum();
				continue;
			}
		} else if (!cmd) {
			i++;
			continue;
		}
		const rel = cmd === cmd.toLowerCase();
		const up = cmd.toUpperCase();
		const absX = (x) => rel ? cx + x : x;
		const absY = (y) => rel ? cy + y : y;
		if (up === "M") {
			if (!hasNum()) continue;
			const x = absX(readNum());
			const y = absY(readNum());
			commands.push({
				type: "M",
				x,
				y
			});
			cx = sx = x;
			cy = sy = y;
			lastC = lastQ = void 0;
			while (hasNum()) {
				const lx = absX(readNum());
				const ly = absY(readNum());
				commands.push({
					type: "L",
					x: lx,
					y: ly
				});
				cx = lx;
				cy = ly;
			}
		} else if (up === "L") while (hasNum()) {
			const x = absX(readNum());
			const y = absY(readNum());
			commands.push({
				type: "L",
				x,
				y
			});
			cx = x;
			cy = y;
			lastC = lastQ = void 0;
		}
		else if (up === "H") while (hasNum()) {
			const x = absX(readNum());
			commands.push({
				type: "L",
				x,
				y: cy
			});
			cx = x;
			lastC = lastQ = void 0;
		}
		else if (up === "V") while (hasNum()) {
			const y = absY(readNum());
			commands.push({
				type: "L",
				x: cx,
				y
			});
			cy = y;
			lastC = lastQ = void 0;
		}
		else if (up === "C") while (hasNum()) {
			const x1 = absX(readNum()), y1 = absY(readNum());
			const x2 = absX(readNum()), y2 = absY(readNum());
			const x = absX(readNum()), y = absY(readNum());
			commands.push({
				type: "C",
				x1,
				y1,
				x2,
				y2,
				x,
				y
			});
			cx = x;
			cy = y;
			lastC = {
				x: x2,
				y: y2
			};
			lastQ = void 0;
		}
		else if (up === "S") while (hasNum()) {
			const reflected = lastC ? {
				x: 2 * cx - lastC.x,
				y: 2 * cy - lastC.y
			} : {
				x: cx,
				y: cy
			};
			const x2 = absX(readNum()), y2 = absY(readNum());
			const x = absX(readNum()), y = absY(readNum());
			commands.push({
				type: "C",
				x1: reflected.x,
				y1: reflected.y,
				x2,
				y2,
				x,
				y
			});
			cx = x;
			cy = y;
			lastC = {
				x: x2,
				y: y2
			};
			lastQ = void 0;
		}
		else if (up === "Q") while (hasNum()) {
			const x1 = absX(readNum()), y1 = absY(readNum());
			const x = absX(readNum()), y = absY(readNum());
			commands.push({
				type: "Q",
				x1,
				y1,
				x,
				y
			});
			cx = x;
			cy = y;
			lastQ = {
				x: x1,
				y: y1
			};
			lastC = void 0;
		}
		else if (up === "T") while (hasNum()) {
			const reflected = lastQ ? {
				x: 2 * cx - lastQ.x,
				y: 2 * cy - lastQ.y
			} : {
				x: cx,
				y: cy
			};
			const x = absX(readNum()), y = absY(readNum());
			commands.push({
				type: "Q",
				x1: reflected.x,
				y1: reflected.y,
				x,
				y
			});
			cx = x;
			cy = y;
			lastQ = reflected;
			lastC = void 0;
		}
		else if (up === "A") while (hasNum()) {
			const rx = Math.abs(readNum()), ry = Math.abs(readNum());
			const rotation = readNum();
			const largeArc = readFlag();
			const sweep = readFlag();
			const x = absX(readNum()), y = absY(readNum());
			commands.push({
				type: "A",
				rx,
				ry,
				rotation,
				largeArc,
				sweep,
				x,
				y
			});
			cx = x;
			cy = y;
			lastC = lastQ = void 0;
		}
		else if (up === "Z") {
			commands.push({ type: "Z" });
			cx = sx;
			cy = sy;
			lastC = lastQ = void 0;
		} else i++;
	}
	return commands;
}
function applyPathToCanvas(ctx, commands) {
	let cx = 0, cy = 0, sx = 0, sy = 0;
	for (const c of commands) switch (c.type) {
		case "M":
			ctx.moveTo(c.x, c.y);
			cx = sx = c.x;
			cy = sy = c.y;
			break;
		case "L":
			ctx.lineTo(c.x, c.y);
			cx = c.x;
			cy = c.y;
			break;
		case "C":
			ctx.bezierCurveTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y);
			cx = c.x;
			cy = c.y;
			break;
		case "Q":
			ctx.quadraticCurveTo(c.x1, c.y1, c.x, c.y);
			cx = c.x;
			cy = c.y;
			break;
		case "A": {
			const pts = arcToPoints(cx, cy, c.rx, c.ry, c.rotation, c.largeArc, c.sweep, c.x, c.y, 32);
			for (const [x, y] of pts) ctx.lineTo(x, y);
			cx = c.x;
			cy = c.y;
			break;
		}
		case "Z":
			ctx.closePath();
			cx = sx;
			cy = sy;
	}
}
function flattenPath(commands, tolerance = .75) {
	const paths = [];
	let current;
	let cx = 0, cy = 0, sx = 0, sy = 0;
	const ensure = () => {
		if (!current) {
			current = {
				points: [],
				closed: false
			};
			paths.push(current);
		}
		return current;
	};
	const push = (x, y) => {
		const p = ensure();
		const n = p.points.length;
		if (n >= 2 && Math.abs(p.points[n - 2] - x) < 1e-9 && Math.abs(p.points[n - 1] - y) < 1e-9) return;
		p.points.push(x, y);
	};
	for (const c of commands) switch (c.type) {
		case "M":
			current = {
				points: [c.x, c.y],
				closed: false
			};
			paths.push(current);
			cx = sx = c.x;
			cy = sy = c.y;
			break;
		case "L":
			push(c.x, c.y);
			cx = c.x;
			cy = c.y;
			break;
		case "C": {
			const steps = curveSteps(cx, cy, c.x, c.y, tolerance);
			for (let i = 1; i <= steps; i++) {
				const t = i / steps;
				push(cubic(cx, c.x1, c.x2, c.x, t), cubic(cy, c.y1, c.y2, c.y, t));
			}
			cx = c.x;
			cy = c.y;
			break;
		}
		case "Q": {
			const steps = curveSteps(cx, cy, c.x, c.y, tolerance);
			for (let i = 1; i <= steps; i++) {
				const t = i / steps;
				push(quad(cx, c.x1, c.x, t), quad(cy, c.y1, c.y, t));
			}
			cx = c.x;
			cy = c.y;
			break;
		}
		case "A": {
			const pts = arcToPoints(cx, cy, c.rx, c.ry, c.rotation, c.largeArc, c.sweep, c.x, c.y, Math.max(8, Math.ceil(24 / Math.max(tolerance, .1))));
			for (const [x, y] of pts) push(x, y);
			cx = c.x;
			cy = c.y;
			break;
		}
		case "Z":
			if (current) {
				push(sx, sy);
				current.closed = true;
			}
			cx = sx;
			cy = sy;
	}
	return paths.filter((p) => p.points.length >= 2);
}
function tokenizePath(data) {
	const tokens = [];
	const re = /([MmLlHhVvCcSsQqTtAaZzFf])|([-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
	let m;
	while ((m = re.exec(data)) !== null) if (m[1]) tokens.push({
		kind: "cmd",
		value: m[1]
	});
	else if (m[2]) tokens.push({
		kind: "num",
		value: Number(m[2])
	});
	return tokens;
}
function curveSteps(x0, y0, x1, y1, tolerance) {
	const d = Math.hypot(x1 - x0, y1 - y0);
	return Math.max(4, Math.min(96, Math.ceil(d / Math.max(1.5, tolerance * 6))));
}
function cubic(a, b, c, d, t) {
	const mt = 1 - t;
	return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
}
function quad(a, b, c, t) {
	const mt = 1 - t;
	return mt * mt * a + 2 * mt * t * b + t * t * c;
}
function arcToPoints(x1, y1, rx, ry, angleDeg, largeArc, sweep, x2, y2, maxSegments) {
	if (rx === 0 || ry === 0 || Math.abs(x1 - x2) < 1e-9 && Math.abs(y1 - y2) < 1e-9) return [[x2, y2]];
	const phi = angleDeg * Math.PI / 180;
	const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
	const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
	let x1p = cosPhi * dx + sinPhi * dy;
	let y1p = -sinPhi * dx + cosPhi * dy;
	rx = Math.abs(rx);
	ry = Math.abs(ry);
	const lambda = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
	if (lambda > 1) {
		const s = Math.sqrt(lambda);
		rx *= s;
		ry *= s;
	}
	const rx2 = rx * rx, ry2 = ry * ry, x1p2 = x1p * x1p, y1p2 = y1p * y1p;
	let factor = (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2);
	factor = Math.max(0, factor);
	const coef = (largeArc === sweep ? -1 : 1) * Math.sqrt(factor);
	const cxp = coef * (rx * y1p / ry);
	const cyp = coef * (-ry * x1p / rx);
	const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
	const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
	const v1x = (x1p - cxp) / rx, v1y = (y1p - cyp) / ry;
	const v2x = (-x1p - cxp) / rx, v2y = (-y1p - cyp) / ry;
	let theta1 = Math.atan2(v1y, v1x);
	let delta = Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y);
	if (!sweep && delta > 0) delta -= 2 * Math.PI;
	if (sweep && delta < 0) delta += 2 * Math.PI;
	const segs = Math.max(2, Math.min(maxSegments, Math.ceil(Math.abs(delta) / (Math.PI / 16))));
	const pts = [];
	for (let i = 1; i <= segs; i++) {
		const t = theta1 + delta * i / segs;
		const x = cosPhi * rx * Math.cos(t) - sinPhi * ry * Math.sin(t) + cx;
		const y = sinPhi * rx * Math.cos(t) + cosPhi * ry * Math.sin(t) + cy;
		pts.push([x, y]);
	}
	return pts;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/legacyAsciiDwf.js
var MAX_POINT_COUNT = 1e6;
var LEGACY_HEADER = /^\uFEFF?\s*\(DWF\s+V\d{2}\.\d{2}(?:\s|\))/i;
/** Returns true for the pre-DWF-6 readable WHIP!/W2D stream produced by tools such as AutoCAD R14. */
function isLegacyAsciiDwf(text) {
	return LEGACY_HEADER.test(text);
}
/**
* Parses the readable single-byte WHIP!/W2D opcode form used by early DWF files.
*
* The format is a stream rather than a line-oriented language: counted point sets can
* wrap across physical lines, and extended ASCII operands can contain nested parentheses.
* A cursor-based scanner is therefore required for correct parsing and bounded O(n) work.
*/
function parseLegacyAsciiDwf(text, sourcePath) {
	const scanner = new LegacyAsciiScanner(text);
	const diagnostics = [];
	const primitives = [];
	const colors = [];
	const operationCounts = /* @__PURE__ */ new Map();
	const unsupportedOpcodes = /* @__PURE__ */ new Set();
	let version;
	let background;
	let pendingBackgroundIndex;
	let currentColorIndex = 0;
	let currentColor = "#000000";
	let fill = false;
	let visible = true;
	let lineWidth = 1;
	let markerSize = 1;
	let hiddenGeometry = 0;
	let ended = false;
	let fatal = false;
	const countOperation = (name) => {
		operationCounts.set(name, (operationCounts.get(name) ?? 0) + 1);
	};
	const resolveIndexedColor = (index) => {
		if (!Number.isInteger(index) || index < 0) return void 0;
		return colors[index];
	};
	const readCountedPoints = (opcode) => {
		const count = scanner.readInteger();
		if (count === void 0 || count < 1 || count > MAX_POINT_COUNT) {
			diagnostics.push(diag("error", "LEGACY_ASCII_DWF_INVALID_POINT_COUNT", `Opcode ${opcode} has an invalid point count at byte ${scanner.position}.`, sourcePath));
			fatal = true;
			return;
		}
		const points = new Array(count * 2);
		for (let i = 0; i < count; i++) {
			const point = scanner.readPoint();
			if (!point) {
				diagnostics.push(diag("error", "LEGACY_ASCII_DWF_TRUNCATED_POINT_SET", `Opcode ${opcode} ended before point ${i + 1} of ${count} at byte ${scanner.position}.`, sourcePath));
				fatal = true;
				return;
			}
			points[i * 2] = point[0];
			points[i * 2 + 1] = point[1];
		}
		return points;
	};
	while (!scanner.eof && !ended && !fatal) {
		scanner.skipWhitespace();
		if (scanner.eof) break;
		const start = scanner.position;
		const token = scanner.peek();
		if (token === "(") {
			const body = scanner.readExtendedAscii();
			if (body === void 0) {
				diagnostics.push(diag("error", "LEGACY_ASCII_DWF_UNTERMINATED_EXTENDED_OPCODE", `Unterminated extended ASCII opcode at byte ${start}.`, sourcePath));
				break;
			}
			const extended = splitExtendedOpcode(body);
			if (!extended) continue;
			const name = extended.name.toLowerCase();
			countOperation(`(${extended.name})`);
			if (name === "dwf") version = extended.operands.match(/\bV\d{2}\.\d{2}\b/i)?.[0]?.toUpperCase();
			else if (name === "colormap") {
				const values = parseNumbers(extended.operands);
				const declaredCount = values[0];
				if (declaredCount === void 0 || !Number.isInteger(declaredCount) || declaredCount < 1) diagnostics.push(diag("warning", "LEGACY_ASCII_DWF_INVALID_COLORMAP", "The legacy DWF ColorMap does not declare a valid color count.", sourcePath));
				else {
					const availableCount = Math.floor((values.length - 1) / 4);
					const count = Math.min(declaredCount, availableCount);
					colors.length = 0;
					for (let i = 0; i < count; i++) {
						const offset = 1 + i * 4;
						colors.push(toCssColor$1(values[offset], values[offset + 1], values[offset + 2], values[offset + 3]));
					}
					if (availableCount < declaredCount) diagnostics.push(diag("warning", "LEGACY_ASCII_DWF_TRUNCATED_COLORMAP", `ColorMap declares ${declaredCount} colors but contains ${availableCount}.`, sourcePath));
					if (currentColorIndex !== void 0) currentColor = resolveIndexedColor(currentColorIndex) ?? currentColor;
					if (pendingBackgroundIndex !== void 0) background = resolveIndexedColor(pendingBackgroundIndex) ?? background;
				}
			} else if (name === "background") {
				const values = parseNumbers(extended.operands);
				if (values.length === 1 && Number.isInteger(values[0])) {
					pendingBackgroundIndex = values[0];
					background = resolveIndexedColor(values[0]) ?? background;
				} else if (values.length >= 3) {
					background = toCssColor$1(values[0], values[1], values[2], values[3] ?? 255);
					pendingBackgroundIndex = void 0;
				}
			} else if (name === "color") {
				const values = parseNumbers(extended.operands);
				if (values.length === 1 && Number.isInteger(values[0])) {
					currentColorIndex = values[0];
					currentColor = resolveIndexedColor(values[0]) ?? currentColor;
				} else if (values.length >= 3) {
					currentColor = toCssColor$1(values[0], values[1], values[2], values[3] ?? 255);
					currentColorIndex = void 0;
				}
			} else if (name === "lineweight") {
				const value = parseNumbers(extended.operands)[0];
				if (value !== void 0 && Number.isFinite(value)) lineWidth = Math.max(.2, Math.abs(value));
			} else if (name === "markersize") {
				const value = parseNumbers(extended.operands)[0];
				if (value !== void 0 && Number.isFinite(value)) markerSize = Math.max(1, Math.abs(value));
			} else if (name === "visibility") {
				const value = extended.operands.trim().toLowerCase();
				const number = parseNumbers(value)[0];
				visible = number !== void 0 ? number !== 0 : !/^(?:off|false|hidden)\b/.test(value);
			} else if (name === "endofdwf") ended = true;
			continue;
		}
		if (!token || !isAsciiLetter(token)) {
			scanner.skipLine();
			continue;
		}
		scanner.advance();
		countOperation(token);
		switch (token) {
			case "C": {
				const index = scanner.readInteger();
				if (index === void 0) {
					diagnostics.push(diag("error", "LEGACY_ASCII_DWF_INVALID_COLOR_INDEX", `Color opcode C is missing its palette index at byte ${scanner.position}.`, sourcePath));
					fatal = true;
					break;
				}
				currentColorIndex = index;
				const resolved = resolveIndexedColor(index);
				if (resolved) currentColor = resolved;
				break;
			}
			case "F":
				fill = true;
				break;
			case "f":
				fill = false;
				break;
			case "V":
				visible = true;
				break;
			case "v":
				visible = false;
				break;
			case "L": {
				const first = scanner.readPoint();
				const second = scanner.readPoint();
				if (!first || !second) {
					diagnostics.push(diag("error", "LEGACY_ASCII_DWF_TRUNCATED_LINE", `Line opcode L is missing coordinates at byte ${scanner.position}.`, sourcePath));
					fatal = true;
					break;
				}
				if (visible) primitives.push({
					type: "polyline",
					points: [
						first[0],
						first[1],
						second[0],
						second[1]
					],
					stroke: currentColor,
					lineWidth
				});
				else hiddenGeometry++;
				break;
			}
			case "P": {
				const points = readCountedPoints(token);
				if (!points) break;
				if (!visible) hiddenGeometry++;
				else if (fill && points.length >= 6) primitives.push({
					type: "polygon",
					points,
					fill: currentColor
				});
				else primitives.push({
					type: "polyline",
					points,
					stroke: currentColor,
					lineWidth
				});
				break;
			}
			case "T": {
				const points = readCountedPoints(token);
				if (!points) break;
				if (!visible) {
					hiddenGeometry++;
					break;
				}
				appendTriangleStrip(primitives, points, currentColor);
				break;
			}
			case "M": {
				const points = readCountedPoints(token);
				if (!points) break;
				if (!visible) {
					hiddenGeometry++;
					break;
				}
				const size = Math.max(1, markerSize, lineWidth);
				for (let i = 0; i + 1 < points.length; i += 2) primitives.push({
					type: "rect",
					x: points[i] - size / 2,
					y: points[i + 1] - size / 2,
					width: size,
					height: size,
					fill: currentColor
				});
				break;
			}
			default:
				unsupportedOpcodes.add(printableOpcode(token));
				scanner.skipLine();
		}
		if (scanner.position <= start) scanner.advance();
	}
	const bounds = computeBounds$3(primitives);
	const geometryPrimitiveCount = primitives.length;
	const versionLabel = version ?? "legacy ASCII DWF";
	if (geometryPrimitiveCount === 0) diagnostics.push(diag("warning", "LEGACY_ASCII_DWF_NO_GEOMETRY", `${versionLabel} contained no supported visible geometry.`, sourcePath));
	else {
		const counts = [
			"L",
			"P",
			"T",
			"M"
		].map((opcode) => `${opcode}=${operationCounts.get(opcode) ?? 0}`).join(", ");
		const hiddenText = hiddenGeometry > 0 ? `; skipped ${hiddenGeometry} hidden geometry operation(s)` : "";
		diagnostics.push(diag("info", "LEGACY_ASCII_DWF_PARSED", `Parsed ${versionLabel} readable WHIP!/W2D stream (${counts}) into ${geometryPrimitiveCount} geometry primitive(s)${hiddenText}.`, sourcePath));
	}
	if (unsupportedOpcodes.size > 0) diagnostics.push(diag("warning", "LEGACY_ASCII_DWF_UNSUPPORTED_OPCODES", `Ignored unsupported readable WHIP!/W2D opcode(s): ${Array.from(unsupportedOpcodes).sort().join(", ")}.`, sourcePath));
	if (!ended) diagnostics.push(diag("warning", "LEGACY_ASCII_DWF_MISSING_END", "The readable WHIP!/W2D stream did not contain a complete (EndOfDWF) marker.", sourcePath));
	if (background && bounds) primitives.unshift({
		type: "rect",
		x: bounds.minX,
		y: bounds.minY,
		width: Math.max(1, bounds.maxX - bounds.minX),
		height: Math.max(1, bounds.maxY - bounds.minY),
		fill: background
	});
	return {
		primitives,
		diagnostics,
		bounds,
		version,
		background
	};
}
function appendTriangleStrip(primitives, points, color) {
	const pointCount = Math.floor(points.length / 2);
	for (let i = 2; i < pointCount; i++) {
		const firstIndex = i % 2 === 0 ? i - 2 : i - 1;
		const secondIndex = i % 2 === 0 ? i - 1 : i - 2;
		const ax = points[firstIndex * 2];
		const ay = points[firstIndex * 2 + 1];
		const bx = points[secondIndex * 2];
		const by = points[secondIndex * 2 + 1];
		const cx = points[i * 2];
		const cy = points[i * 2 + 1];
		if ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax) === 0) continue;
		primitives.push({
			type: "polygon",
			points: [
				ax,
				ay,
				bx,
				by,
				cx,
				cy
			],
			fill: color
		});
	}
}
function computeBounds$3(primitives) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const add = (x, y) => {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};
	for (const primitive of primitives) if ("points" in primitive) for (let i = 0; i + 1 < primitive.points.length; i += 2) add(primitive.points[i], primitive.points[i + 1]);
	else if (primitive.type === "rect") {
		add(primitive.x, primitive.y);
		add(primitive.x + primitive.width, primitive.y + primitive.height);
	} else if (primitive.type === "text") {
		const size = primitive.size ?? 12;
		add(primitive.x, primitive.y);
		add(primitive.x + primitive.text.length * size * .6, primitive.y + size);
	} else if (primitive.type === "path") for (const command of primitive.commands) {
		if ("x" in command && "y" in command && typeof command.x === "number" && typeof command.y === "number") add(command.x, command.y);
		if ("x1" in command && "y1" in command && typeof command.x1 === "number" && typeof command.y1 === "number") add(command.x1, command.y1);
		if ("x2" in command && "y2" in command && typeof command.x2 === "number" && typeof command.y2 === "number") add(command.x2, command.y2);
	}
	return Number.isFinite(minX) ? {
		minX,
		minY,
		maxX,
		maxY
	} : void 0;
}
function splitExtendedOpcode(body) {
	const trimmed = body.trimStart();
	const match = trimmed.match(/^([^\s()]+)/);
	if (!match?.[1]) return void 0;
	return {
		name: match[1],
		operands: trimmed.slice(match[1].length)
	};
}
function parseNumbers(value) {
	return Array.from(value.matchAll(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g), (match) => Number(match[0]));
}
function toCssColor$1(red, green, blue, alpha = 255) {
	const r = clampByte(red);
	const g = clampByte(green);
	const b = clampByte(blue);
	const a = clampByte(alpha);
	if (a === 255) return `rgb(${r}, ${g}, ${b})`;
	return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(4))})`;
}
function clampByte(value) {
	return Math.max(0, Math.min(255, Math.round(value)));
}
function isAsciiLetter(value) {
	const code = value.charCodeAt(0);
	return code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function printableOpcode(value) {
	const code = value.charCodeAt(0);
	return code >= 32 && code <= 126 ? value : `0x${code.toString(16).padStart(2, "0")}`;
}
var LegacyAsciiScanner = class {
	constructor(source) {
		this.source = source;
		this.position = 0;
	}
	get eof() {
		return this.position >= this.source.length;
	}
	peek() {
		return this.source[this.position];
	}
	advance() {
		if (!this.eof) this.position++;
	}
	skipWhitespace() {
		while (!this.eof) {
			const code = this.source.charCodeAt(this.position);
			if (code !== 32 && code !== 9 && code !== 10 && code !== 13 && code !== 12) break;
			this.position++;
		}
	}
	skipLine() {
		while (!this.eof) if (this.source.charCodeAt(this.position++) === 10) break;
	}
	readInteger() {
		const value = this.readNumber();
		return value !== void 0 && Number.isInteger(value) ? value : void 0;
	}
	readPoint() {
		const start = this.position;
		const x = this.readNumber();
		if (x === void 0) {
			this.position = start;
			return;
		}
		this.skipWhitespace();
		if (this.source[this.position] !== ",") {
			this.position = start;
			return;
		}
		this.position++;
		const y = this.readNumber();
		if (y === void 0) {
			this.position = start;
			return;
		}
		return [x, y];
	}
	readNumber() {
		this.skipWhitespace();
		const start = this.position;
		if (this.source[this.position] === "+" || this.source[this.position] === "-") this.position++;
		let digits = 0;
		while (!this.eof && isDigitCode(this.source.charCodeAt(this.position))) {
			this.position++;
			digits++;
		}
		if (this.source[this.position] === ".") {
			this.position++;
			while (!this.eof && isDigitCode(this.source.charCodeAt(this.position))) {
				this.position++;
				digits++;
			}
		}
		if (digits === 0) {
			this.position = start;
			return;
		}
		if (this.source[this.position] === "e" || this.source[this.position] === "E") {
			const exponentStart = this.position;
			this.position++;
			if (this.source[this.position] === "+" || this.source[this.position] === "-") this.position++;
			let exponentDigits = 0;
			while (!this.eof && isDigitCode(this.source.charCodeAt(this.position))) {
				this.position++;
				exponentDigits++;
			}
			if (exponentDigits === 0) this.position = exponentStart;
		}
		const value = Number(this.source.slice(start, this.position));
		if (!Number.isFinite(value)) {
			this.position = start;
			return;
		}
		return value;
	}
	readExtendedAscii() {
		if (this.source[this.position] !== "(") return void 0;
		const start = this.position++;
		let depth = 1;
		let quote;
		let escaped = false;
		while (!this.eof) {
			const value = this.source[this.position++];
			if (quote) {
				if (escaped) escaped = false;
				else if (value === "\\") escaped = true;
				else if (value === quote) quote = void 0;
				continue;
			}
			if (value === "'" || value === "\"") quote = value;
			else if (value === "(") depth++;
			else if (value === ")") {
				depth--;
				if (depth === 0) return this.source.slice(start + 1, this.position - 1);
			}
		}
	}
};
function isDigitCode(code) {
	return code >= 48 && code <= 57;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/w2dText.js
function parseW2dText(bytes, sourcePath) {
	const text = decodeUtf8(bytes);
	if (isLegacyAsciiDwf(text)) return {
		format: "legacy-ascii-dwf",
		...parseLegacyAsciiDwf(text, sourcePath)
	};
	const diagnostics = [];
	const primitives = [];
	let stroke = "#000000";
	let fill;
	let lineWidth = 1;
	let parsedLines = 0;
	if (/<svg[\s>]/i.test(text)) {
		const pathMatches = text.matchAll(/<path\b[^>]*\bd=["']([^"']+)["'][^>]*>/gi);
		for (const m of pathMatches) {
			const tag = m[0];
			const d = m[1];
			primitives.push({
				type: "path",
				commands: parsePathData(d),
				stroke: attr(tag, "stroke") ?? stroke,
				fill: attr(tag, "fill") ?? void 0,
				lineWidth: Number(attr(tag, "stroke-width") ?? lineWidth)
			});
			parsedLines++;
		}
		const polyMatches = text.matchAll(/<(polyline|polygon)\b[^>]*\bpoints=["']([^"']+)["'][^>]*>/gi);
		for (const m of polyMatches) {
			const tag = m[0];
			const nums = parseNumberList(m[2]);
			if (nums.length >= 4) primitives.push({
				type: m[1].toLowerCase() === "polygon" ? "polygon" : "polyline",
				points: nums,
				stroke: attr(tag, "stroke") ?? stroke,
				fill: attr(tag, "fill") ?? void 0,
				lineWidth: Number(attr(tag, "stroke-width") ?? lineWidth)
			});
			parsedLines++;
		}
	}
	const lines = text.split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#") || line.startsWith("//")) continue;
		const lower = line.toLowerCase();
		const nums = parseNumberList(line);
		if (/^(color|stroke|pen|wt_color)\b/i.test(line)) {
			stroke = parseColorToken(line) ?? stroke;
			parsedLines++;
			continue;
		}
		if (/^(fill|brush|wt_fill)\b/i.test(line)) {
			fill = parseColorToken(line) ?? fill ?? "#000000";
			parsedLines++;
			continue;
		}
		if (/^(nofill|fillnone)\b/i.test(line)) {
			fill = void 0;
			parsedLines++;
			continue;
		}
		if (/^(linewidth|lineweight|weight|wt_line_weight)\b/i.test(line) && nums.length >= 1) {
			lineWidth = Math.max(.2, nums[0]);
			parsedLines++;
			continue;
		}
		if ((/^path\b/i.test(line) || /\bPath\s*Data\b/.test(line)) && /[MmLlCcQqAaZz]/.test(line)) {
			const d = line.replace(/^path\b[:=]?/i, "").replace(/^.*?Data\s*=\s*/i, "").replace(/^['"]|['"]$/g, "");
			primitives.push({
				type: "path",
				commands: parsePathData(d),
				stroke,
				fill,
				lineWidth
			});
			parsedLines++;
			continue;
		}
		if (/^(line|wt_line)\b/i.test(line) && nums.length >= 4) {
			primitives.push({
				type: "polyline",
				points: nums.slice(0, 4),
				stroke,
				lineWidth
			});
			parsedLines++;
			continue;
		}
		if ((/^(polyline|wt_polyline|pline)\b/i.test(line) || /\bPolyline\b/i.test(line)) && nums.length >= 4) {
			primitives.push({
				type: "polyline",
				points: normalizePointList(nums),
				stroke,
				lineWidth
			});
			parsedLines++;
			continue;
		}
		if ((/^(polygon|wt_polygon)\b/i.test(line) || /\bPolygon\b/i.test(line)) && nums.length >= 6) {
			primitives.push({
				type: "polygon",
				points: normalizePointList(nums),
				stroke,
				fill: fill ?? "#000000",
				lineWidth
			});
			parsedLines++;
			continue;
		}
		if (/^(rect|rectangle|wt_rectangle)\b/i.test(line) && nums.length >= 4) {
			primitives.push({
				type: "rect",
				x: nums[0],
				y: nums[1],
				width: nums[2],
				height: nums[3],
				stroke,
				fill,
				lineWidth
			});
			parsedLines++;
			continue;
		}
		if (/^(circle|ellipse)\b/i.test(line) && nums.length >= 3) {
			const [x, y, r] = nums;
			const segments = 72;
			const pts = [];
			for (let i = 0; i <= segments; i++) {
				const a = Math.PI * 2 * i / segments;
				pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
			}
			primitives.push({
				type: "polygon",
				points: pts,
				stroke,
				fill,
				lineWidth
			});
			parsedLines++;
			continue;
		}
		if (/^(text|wt_text)\b/i.test(line) && nums.length >= 2) {
			const x = nums[0], y = nums[1];
			const size = nums.length >= 3 ? nums[2] : 12;
			const textPayload = line.match(/["']([^"']+)["']/)?.[1] ?? line.replace(/^(text|wt_text)\b/i, "").replace(/[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/g, "").trim();
			primitives.push({
				type: "text",
				x,
				y,
				size,
				text: textPayload || "Text",
				fill: stroke
			});
			parsedLines++;
			continue;
		}
		if (lower.includes("wt_") || lower.includes("whip") || lower.includes("dwf")) parsedLines++;
	}
	const bounds = computeBounds$2(primitives);
	if (primitives.length === 0) diagnostics.push(diag("warning", "W2D_TEXT_NO_GEOMETRY", `Textual W2D parser did not find supported geometry commands in ${sourcePath}.`, sourcePath));
	else diagnostics.push(diag("info", "W2D_TEXT_PARSED", `Parsed ${primitives.length} supported vector primitives from ${sourcePath}.`, sourcePath));
	if (parsedLines === 0) diagnostics.push(diag("warning", "W2D_TEXT_UNKNOWN_DIALECT", "The file is textual, but does not look like the supported WHIP/W2D textual subset.", sourcePath));
	return {
		format: "generic-text",
		primitives,
		diagnostics,
		bounds
	};
}
function normalizePointList(nums) {
	if (nums.length >= 5 && Number.isInteger(nums[0]) && nums.length - 1 === nums[0] * 2) return nums.slice(1);
	return nums;
}
function attr(tag, name) {
	return tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1];
}
function parseColorToken(line) {
	const hex = line.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i)?.[0];
	if (hex) return hex;
	const nums = parseNumberList(line);
	if (nums.length >= 3) return `rgb(${Math.max(0, Math.min(255, nums[0]))}, ${Math.max(0, Math.min(255, nums[1]))}, ${Math.max(0, Math.min(255, nums[2]))})`;
	return line.match(/\b(black|white|red|green|blue|yellow|cyan|magenta|gray|grey)\b/i)?.[1];
}
function computeBounds$2(primitives) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const add = (x, y) => {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};
	for (const p of primitives) if ("points" in p) for (let i = 0; i + 1 < p.points.length; i += 2) add(p.points[i], p.points[i + 1]);
	else if (p.type === "rect") {
		add(p.x, p.y);
		add(p.x + p.width, p.y + p.height);
	} else if (p.type === "text") {
		add(p.x, p.y);
		add(p.x + p.text.length * (p.size ?? 12) * .6, p.y + (p.size ?? 12));
	} else if (p.type === "path") for (const c of p.commands) {
		if ("x" in c && "y" in c && typeof c.x === "number" && typeof c.y === "number") add(c.x, c.y);
		if ("x1" in c && "y1" in c && typeof c.x1 === "number" && typeof c.y1 === "number") add(c.x1, c.y1);
		if ("x2" in c && "y2" in c && typeof c.x2 === "number" && typeof c.y2 === "number") add(c.x2, c.y2);
	}
	return Number.isFinite(minX) ? {
		minX,
		minY,
		maxX,
		maxY
	} : void 0;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/w2dBinary.js
var FONT_NAME_BIT = 1;
var FONT_CHARSET_BIT = 2;
var FONT_PITCH_BIT = 4;
var FONT_FAMILY_BIT = 8;
var FONT_STYLE_BIT = 16;
var FONT_HEIGHT_BIT = 32;
var FONT_ROTATION_BIT = 64;
var FONT_WIDTH_SCALE_BIT = 128;
var FONT_SPACING_BIT = 256;
var FONT_OBLIQUE_BIT = 512;
var FONT_FLAGS_BIT = 1024;
function parseW2dBinary(bytes, sourcePath) {
	return new BinaryW2dParser(bytes, sourcePath).parse();
}
var BinaryW2dParser = class {
	constructor(bytes, sourcePath) {
		this.bytes = bytes;
		this.sourcePath = sourcePath;
		this.pos = 0;
		this.current = {
			x: 0,
			y: 0
		};
		this.primitives = [];
		this.diagnostics = [];
		this.unsupportedOpcodes = [];
		this.opcodes = 0;
		this.decimalRevision = 600;
		this.state = {
			stroke: "#000000",
			fill: void 0,
			fillOn: false,
			visible: true,
			lineWidth: 1,
			fontHeight: 120,
			fontRotation: 0,
			fontName: "sans-serif"
		};
		this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	}
	parse() {
		while (this.pos < this.bytes.length) {
			this.eatWhitespace();
			if (this.pos >= this.bytes.length) break;
			const offset = this.pos;
			const opcode = this.u8();
			this.opcodes++;
			try {
				if (opcode === 40) {
					this.pos = offset;
					this.parseExtendedAscii(offset);
					continue;
				}
				if (opcode === 123) {
					if (!this.parseExtendedBinary(offset)) break;
					continue;
				}
				if (this.parseSingleByteOpcode(opcode)) continue;
				this.unsupportedOpcodes.push({
					offset,
					opcode,
					message: `Unsupported/unknown W2D single-byte opcode 0x${opcode.toString(16).padStart(2, "0")}.`
				});
				break;
			} catch (err) {
				this.unsupportedOpcodes.push({
					offset,
					opcode,
					message: `Failed while decoding W2D opcode 0x${opcode.toString(16)}: ${String(err)}`
				});
				break;
			}
		}
		if (this.primitives.length > 0) this.diagnostics.push(diag("info", "W2D_BINARY_PARSED", `Parsed ${this.primitives.length} vector primitives from binary WHIP!/W2D stream (${this.opcodes} opcodes).`, this.sourcePath));
		else this.diagnostics.push(diag("warning", "W2D_BINARY_NO_GEOMETRY", "Binary WHIP!/W2D parser did not emit supported geometry.", this.sourcePath));
		if (this.unsupportedOpcodes.length > 0) {
			const first = this.unsupportedOpcodes[0];
			this.diagnostics.push(diag("warning", "W2D_BINARY_PARTIAL", `${this.unsupportedOpcodes.length} unsupported opcode(s); first at byte ${first.offset}: ${first.message}`, this.sourcePath));
		}
		return {
			primitives: this.primitives,
			diagnostics: this.diagnostics,
			bounds: computeBounds$1(this.primitives),
			opcodes: this.opcodes,
			unsupportedOpcodes: this.unsupportedOpcodes
		};
	}
	parseSingleByteOpcode(opcode) {
		switch (opcode) {
			case 0: return true;
			case 3: {
				const r = this.u8();
				const g = this.u8();
				const b = this.u8();
				const a = this.u8();
				this.state.stroke = rgba$2(r, g, b, a);
				if (this.state.fillOn) this.state.fill = this.state.stroke;
				return true;
			}
			case 6:
				this.readBinaryFont();
				return true;
			case 12: {
				const pts = [this.point16Relative(), this.point16Relative()];
				this.polyline(pts);
				return true;
			}
			case 16: {
				const pts = this.pointSet16Relative();
				this.pointSetPrimitive(pts);
				return true;
			}
			case 18: {
				const center = this.point16Relative();
				const radius = this.u16();
				this.ellipsePrimitive(center, radius, radius, 0, 0, 0);
				return true;
			}
			case 20:
				this.polytriangles(this.pointSet16Relative());
				return true;
			case 23:
				this.state.lineWidth = Math.max(.2, Math.abs(this.i32()));
				return true;
			case 24: {
				const p = this.point32Relative();
				const text = cleanW2dText(this.readWhipString());
				this.text(p, text);
				this.skipComplexTextOptions();
				return true;
			}
			case 146: {
				const center = this.point32Relative();
				const radius = this.u32();
				const start = this.u16();
				const end = this.u16();
				this.ellipsePrimitive(center, radius, radius, start, end, 0, false);
				return true;
			}
			case 172:
				this.readCount();
				return true;
			case 204:
				this.readCount();
				return true;
			case 228:
				this.readCount();
				return true;
		}
		switch (String.fromCharCode(opcode)) {
			case "B":
				this.polyline(this.pointSet32Relative());
				return true;
			case "C":
				this.state.stroke = aciColor(this.readAsciiInteger());
				if (this.state.fillOn) this.state.fill = this.state.stroke;
				return true;
			case "c":
				this.state.stroke = aciColor(this.u8());
				if (this.state.fillOn) this.state.fill = this.state.stroke;
				return true;
			case "E": {
				const center = this.readAsciiPoint();
				const axes = this.readAsciiPoint();
				this.ellipsePrimitive(center, axes.x, axes.y, 0, 0, 0);
				return true;
			}
			case "e": {
				const center = this.point32Relative();
				const major = this.u32();
				const minor = this.u32();
				const start = this.u16();
				const end = this.u16();
				const tilt = this.u16();
				this.ellipsePrimitive(center, major, minor, start, end, tilt);
				return true;
			}
			case "F":
				this.state.fillOn = true;
				this.state.fill = this.state.stroke;
				return true;
			case "f":
				this.state.fillOn = false;
				this.state.fill = void 0;
				return true;
			case "L": {
				const pts = [this.readAsciiPoint(), this.readAsciiPoint()];
				this.polyline(pts);
				return true;
			}
			case "l": {
				const pts = [this.point32Relative(), this.point32Relative()];
				this.polyline(pts);
				return true;
			}
			case "N":
				this.i32();
				return true;
			case "n":
				this.u16();
				return true;
			case "O":
				this.current = {
					x: this.i32(),
					y: this.i32()
				};
				return true;
			case "P":
				this.pointSetPrimitive(this.pointSetAscii());
				return true;
			case "p":
				this.pointSetPrimitive(this.pointSet32Relative());
				return true;
			case "R": {
				const center = this.readAsciiPoint();
				const radius = this.readAsciiInteger();
				this.ellipsePrimitive(center, radius, radius, 0, 0, 0);
				return true;
			}
			case "r": {
				const center = this.point32Relative();
				const radius = this.u32();
				this.ellipsePrimitive(center, radius, radius, 0, 0, 0);
				return true;
			}
			case "T":
				this.polytriangles(this.pointSetAscii());
				return true;
			case "t":
				this.polytriangles(this.pointSet32Relative());
				return true;
			case "V":
				this.state.visible = true;
				return true;
			case "v":
				this.state.visible = false;
				return true;
			case "x": {
				const p = this.point32Relative();
				const text = cleanW2dText(this.readWhipString());
				this.text(p, text);
				return true;
			}
		}
		return false;
	}
	parseExtendedAscii(start) {
		const { token, expr } = this.readBalancedExpression(start);
		switch (token) {
			case "(W2D": {
				const m = expr.match(/V(\d+)\.(\d+)/i);
				if (m) this.decimalRevision = Number(m[1]) * 100 + Number(m[2]);
				break;
			}
			case "(Color": {
				const nums = numbers(expr);
				if (nums.length >= 3) this.state.stroke = rgb(nums[0], nums[1], nums[2]);
				break;
			}
			case "(LineWeight": {
				const nums = numbers(expr);
				if (nums.length >= 1) this.state.lineWidth = Math.max(.2, Math.abs(nums[0]));
				break;
			}
			case "(Font": {
				const height = expr.match(/\(Height\s+(-?\d+)/i)?.[1];
				const rotation = expr.match(/\(Rotation\s+(-?\d+)/i)?.[1];
				const name = expr.match(/\(Name\s+(['"])(.*?)\1/i)?.[2];
				if (height) this.state.fontHeight = Math.max(1, Math.abs(Number(height)));
				if (rotation) this.state.fontRotation = Number(rotation) || 0;
				if (name) this.state.fontName = name;
				break;
			}
			case "(EndOfDWF": this.pos = this.bytes.length;
		}
	}
	parseExtendedBinary(start) {
		if (this.remaining() < 6) return false;
		const size = this.u32();
		const opcode = this.u16();
		if (opcode === 17 || opcode === 16 || opcode === 291) {
			this.unsupportedOpcodes.push({
				offset: start,
				opcode: `{${opcode.toString(16)}}`,
				message: "Embedded compressed WHIP block detected. This build renders uncompressed binary W2D streams and manifest markup XML; compressed nested blocks are skipped."
			});
			this.pos = size > 0 && this.pos + size <= this.bytes.length ? this.pos + size : this.bytes.length;
			return true;
		}
		if (size > 0 && this.pos + size <= this.bytes.length) {
			this.pos += size;
			return true;
		}
		this.unsupportedOpcodes.push({
			offset: start,
			opcode: `{${opcode.toString(16)}}`,
			message: "Unsupported extended binary WHIP object with unknown payload size."
		});
		return false;
	}
	readBinaryFont() {
		const fields = this.u16();
		if (fields & FONT_NAME_BIT) this.state.fontName = this.readWhipString() || this.state.fontName;
		if (fields & FONT_CHARSET_BIT) this.u8();
		if (fields & FONT_PITCH_BIT) this.u8();
		if (fields & FONT_FAMILY_BIT) this.u8();
		if (fields & FONT_STYLE_BIT) this.u8();
		if (fields & FONT_HEIGHT_BIT) this.state.fontHeight = Math.max(1, Math.abs(this.i32()));
		if (fields & FONT_ROTATION_BIT) this.state.fontRotation = this.u16();
		if (fields & FONT_WIDTH_SCALE_BIT) this.u16();
		if (fields & FONT_SPACING_BIT) this.u16();
		if (fields & FONT_OBLIQUE_BIT) this.u16();
		if (fields & FONT_FLAGS_BIT) this.i32();
	}
	skipComplexTextOptions() {
		this.skipScoringOption();
		this.skipScoringOption();
		for (let i = 0; i < 4; i++) {
			this.i32();
			this.i32();
		}
		if (this.decimalRevision >= 600 && this.pos < this.bytes.length) {
			const count = Math.max(0, this.readCount() - 1);
			for (let i = 0; i < count; i++) this.readCount();
		}
	}
	skipScoringOption() {
		const count = Math.max(0, this.readCount() - 1);
		for (let i = 0; i < count; i++) this.readCount();
	}
	pointSetPrimitive(pts) {
		if (this.state.fillOn) this.polygon(pts, this.state.fill ?? this.state.stroke, this.state.stroke);
		else this.polyline(pts);
	}
	polytriangles(pts) {
		if (!this.state.visible || pts.length < 3) return;
		for (let i = 0; i + 2 < pts.length; i++) this.polygon([
			pts[i],
			pts[i + 1],
			pts[i + 2]
		], this.state.stroke, void 0);
	}
	polyline(pts) {
		if (!this.state.visible || pts.length < 2) return;
		this.primitives.push({
			type: "polyline",
			points: flattenPoints(pts),
			stroke: this.state.stroke,
			lineWidth: this.state.lineWidth
		});
	}
	polygon(pts, fill, stroke) {
		if (!this.state.visible || pts.length < 3) return;
		this.primitives.push({
			type: "polygon",
			points: flattenPoints(pts),
			fill,
			stroke,
			lineWidth: this.state.lineWidth
		});
	}
	ellipsePrimitive(center, major, minor, start, end, tilt, filled = this.state.fillOn) {
		const pts = ellipsePoints(center, major, minor, start, end, tilt);
		if (filled) this.polygon(pts, this.state.fill ?? this.state.stroke, this.state.stroke);
		else this.polyline(pts);
	}
	text(p, text) {
		if (!this.state.visible || !text.trim()) return;
		this.primitives.push({
			type: "text",
			x: p.x,
			y: p.y,
			text,
			size: Math.max(10, Math.abs(this.state.fontHeight)),
			fill: this.state.stroke
		});
	}
	pointSet32Relative() {
		const count = this.readCount();
		const pts = [];
		for (let i = 0; i < count; i++) pts.push(this.point32Relative());
		return pts;
	}
	pointSet16Relative() {
		const count = this.readCount();
		const pts = [];
		for (let i = 0; i < count; i++) pts.push(this.point16Relative());
		return pts;
	}
	pointSetAscii() {
		const count = this.readAsciiInteger();
		const pts = [];
		for (let i = 0; i < count; i++) pts.push(this.readAsciiPoint());
		return pts;
	}
	point32Relative() {
		const dx = this.i32();
		const dy = this.i32();
		this.current = {
			x: this.current.x + dx,
			y: this.current.y + dy
		};
		return { ...this.current };
	}
	point16Relative() {
		const dx = this.i16();
		const dy = this.i16();
		this.current = {
			x: this.current.x + dx,
			y: this.current.y + dy
		};
		return { ...this.current };
	}
	readAsciiPoint() {
		const x = this.readAsciiInteger();
		if (this.peek() === 44) this.pos++;
		return {
			x,
			y: this.readAsciiInteger()
		};
	}
	readAsciiInteger() {
		this.eatWhitespace();
		const start = this.pos;
		if (this.peek() === 43 || this.peek() === 45) this.pos++;
		while (this.pos < this.bytes.length && isDigit(this.bytes[this.pos])) this.pos++;
		const raw = ascii(this.bytes.subarray(start, this.pos));
		const n = Number.parseInt(raw, 10);
		return Number.isFinite(n) ? n : 0;
	}
	readWhipString() {
		this.eatWhitespace();
		const lead = this.peek();
		if (lead === 123) {
			this.pos++;
			const length = this.i32();
			const byteLength = Math.max(0, length * 2);
			if (this.pos + byteLength > this.bytes.length) throw new Error("Truncated binary WHIP string.");
			const s = new TextDecoder("utf-16le").decode(this.bytes.subarray(this.pos, this.pos + byteLength));
			this.pos += byteLength;
			if (this.peek() === 125) this.pos++;
			return s;
		}
		if (lead === 34 || lead === 39) {
			const quote = this.u8();
			const out = [];
			let escaped = false;
			while (this.pos < this.bytes.length) {
				const c = this.u8();
				if (escaped) {
					out.push(c);
					escaped = false;
				} else if (c === 92) {
					out.push(c);
					escaped = true;
				} else if (c === quote) break;
				else out.push(c);
			}
			return ascii(new Uint8Array(out));
		}
		const start = this.pos;
		while (this.pos < this.bytes.length) {
			const c = this.bytes[this.pos];
			if (c === 32 || c === 9 || c === 10 || c === 13 || c === 41) break;
			this.pos++;
		}
		return ascii(this.bytes.subarray(start, this.pos));
	}
	readBalancedExpression(start) {
		this.pos = start;
		let depth = 0;
		let quote = 0;
		let escaped = false;
		while (this.pos < this.bytes.length) {
			const c = this.u8();
			if (quote) {
				if (escaped) escaped = false;
				else if (c === 92) escaped = true;
				else if (c === quote) quote = 0;
			} else if (c === 34 || c === 39) quote = c;
			else if (c === 40) depth++;
			else if (c === 41) {
				depth--;
				if (depth <= 0) break;
			}
		}
		const raw = ascii(this.bytes.subarray(start, this.pos));
		return {
			token: raw.match(/^\([^\s()]+/)?.[0] ?? "(",
			expr: raw
		};
	}
	readCount() {
		const c = this.u8();
		return c !== 0 ? c : 256 + this.u16();
	}
	eatWhitespace() {
		while (this.pos < this.bytes.length) {
			const b = this.bytes[this.pos];
			if (b === 32 || b === 9 || b === 10 || b === 13) this.pos++;
			else break;
		}
	}
	remaining() {
		return this.bytes.length - this.pos;
	}
	peek() {
		return this.pos < this.bytes.length ? this.bytes[this.pos] : void 0;
	}
	u8() {
		if (this.remaining() < 1) throw new Error("Unexpected EOF");
		return this.view.getUint8(this.pos++);
	}
	i16() {
		if (this.remaining() < 2) throw new Error("Unexpected EOF");
		const n = this.view.getInt16(this.pos, true);
		this.pos += 2;
		return n;
	}
	u16() {
		if (this.remaining() < 2) throw new Error("Unexpected EOF");
		const n = this.view.getUint16(this.pos, true);
		this.pos += 2;
		return n;
	}
	i32() {
		if (this.remaining() < 4) throw new Error("Unexpected EOF");
		const n = this.view.getInt32(this.pos, true);
		this.pos += 4;
		return n;
	}
	u32() {
		if (this.remaining() < 4) throw new Error("Unexpected EOF");
		const n = this.view.getUint32(this.pos, true);
		this.pos += 4;
		return n;
	}
};
function flattenPoints(pts) {
	const out = [];
	for (const p of pts) out.push(p.x, p.y);
	return out;
}
function ellipsePoints(center, major, minor, start, end, tilt) {
	let s = start;
	let e = end;
	if (s === 0 && e === 0) e = 65536;
	else if (e <= s) e += 65536;
	const sweep = e - s;
	const segs = Math.max(16, Math.min(144, Math.ceil(Math.abs(sweep) / 65536 * 96)));
	const tiltRad = tilt * Math.PI * 2 / 65536;
	const ct = Math.cos(tiltRad), st = Math.sin(tiltRad);
	const pts = [];
	for (let i = 0; i <= segs; i++) {
		const a = (s + sweep * i / segs) * Math.PI * 2 / 65536;
		const x = Math.cos(a) * major;
		const y = Math.sin(a) * minor;
		pts.push({
			x: center.x + x * ct - y * st,
			y: center.y + x * st + y * ct
		});
	}
	return pts;
}
function cleanW2dText(text) {
	return text.replace(/\\P/gi, "\n").replace(/\\L|\\l/g, "").replace(/\\O|\\o/g, "").replace(/\\H[-+]?\d*\.?\d+x;/gi, "").replace(/\\S([^;]+);/gi, "$1").replace(/\\[A-Za-z][^;]*;/g, "").replace(/\\~/g, " ").replace(/\\\\/g, "\\").trim();
}
function computeBounds$1(primitives) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const add = (x, y) => {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};
	for (const p of primitives) if ("points" in p) for (let i = 0; i + 1 < p.points.length; i += 2) add(p.points[i], p.points[i + 1]);
	else if (p.type === "rect") {
		add(p.x, p.y);
		add(p.x + p.width, p.y + p.height);
	} else if (p.type === "text") {
		const size = p.size ?? 12;
		add(p.x, p.y);
		add(p.x, p.y + size);
	} else if (p.type === "path") for (const c of p.commands) {
		if ("x" in c && "y" in c) add(c.x, c.y);
		if ("x1" in c && "y1" in c) add(c.x1, c.y1);
		if ("x2" in c && "y2" in c) add(c.x2, c.y2);
	}
	return Number.isFinite(minX) ? {
		minX,
		minY,
		maxX,
		maxY
	} : void 0;
}
function isDigit(b) {
	return b >= 48 && b <= 57;
}
function ascii(bytes) {
	return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
}
function rgb(r, g, b) {
	return `rgb(${clamp8(r)}, ${clamp8(g)}, ${clamp8(b)})`;
}
function rgba$2(r, g, b, a) {
	return `rgba(${clamp8(r)}, ${clamp8(g)}, ${clamp8(b)}, ${Math.max(0, Math.min(1, a / 255))})`;
}
function clamp8(n) {
	return Math.max(0, Math.min(255, Math.round(n)));
}
function numbers(s) {
	return (s.match(/[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number).filter(Number.isFinite);
}
function aciColor(index) {
	return [
		"#000000",
		"#ff0000",
		"#ffff00",
		"#00ff00",
		"#00ffff",
		"#0000ff",
		"#ff00ff",
		"#000000",
		"#808080",
		"#c0c0c0"
	][index] ?? "#000000";
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/dwf.js
function isProbablyClassicDwf(zip) {
	return zip.entries.some((e) => /\.w2d$/i.test(e.name) || /manifest\.xml$/i.test(e.name) || /descriptor\.xml$/i.test(e.name) || /\.hsf$/i.test(e.name));
}
async function openClassicDwf(zip) {
	const diagnostics = [];
	const pageData = [];
	const resources = zip.entries.map((e) => ({
		path: e.name,
		mediaType: mimeFromPath(e.name),
		size: e.uncompressedSize
	}));
	const manifestEntry = zip.entries.find((e) => /(^|\/)manifest\.xml$/i.test(e.name));
	let manifestSections = [];
	if (manifestEntry) try {
		manifestSections = parseManifestSections(decodeUtf8(await zip.read(manifestEntry)), manifestEntry.name);
		diagnostics.push(diag("info", "DWF_MANIFEST_FOUND", `Found DWF manifest with ${manifestSections.length} section(s).`, manifestEntry.name));
	} catch (err) {
		diagnostics.push(diag("warning", "DWF_MANIFEST_PARSE_FAILED", `Failed to parse DWF manifest: ${String(err)}`, manifestEntry.name));
	}
	else diagnostics.push(diag("info", "DWF_NO_MANIFEST", "No manifest.xml was found; falling back to resource discovery."));
	if (manifestSections.length > 0) for (const section of manifestSections) {
		const mainGraphic = resourceByRole(section, /2d\s+streaming\s+graphics/i) ?? section.resources.find((r) => /\.w2d$/i.test(r.path));
		if (!mainGraphic) continue;
		const descriptorResource = resourceByRole(section, /^descriptor$/i) ?? { path: normalizePath(section.name + "/descriptor.xml") };
		let descriptor = {};
		if (descriptorResource && zip.has(descriptorResource.path)) try {
			descriptor = parseDescriptorInfo(decodeUtf8(await zip.read(descriptorResource.path)), mainGraphic.path);
		} catch (err) {
			diagnostics.push(diag("warning", "DWF_DESCRIPTOR_PARSE_FAILED", `Failed to parse descriptor for ${section.title}: ${String(err)}`, descriptorResource.path));
		}
		const pageDiagnostics = [];
		const primitives = [];
		try {
			const parsed = await parseW2dResource(zip, mainGraphic.path);
			primitives.push(...parsed.primitives);
			pageDiagnostics.push(...parsed.diagnostics);
		} catch (err) {
			pageDiagnostics.push(diag("warning", "DWF_W2D_READ_FAILED", `Failed to read or parse ${mainGraphic.path}: ${String(err)}`, mainGraphic.path));
		}
		for (const markupXml of section.resources.filter((r) => /markup\s+private/i.test(r.role ?? "") && /\.xml$/i.test(r.path))) {
			if (!zip.has(markupXml.path)) continue;
			try {
				const parsed = parseMarkupPrivateXml(decodeUtf8(await zip.read(markupXml.path)), markupXml.path, descriptor.w2dTransform);
				primitives.push(...parsed.primitives);
				pageDiagnostics.push(...parsed.diagnostics);
			} catch (err) {
				pageDiagnostics.push(diag("warning", "DWF_MARKUP_XML_PARSE_FAILED", `Failed to parse markup private XML: ${String(err)}`, markupXml.path));
			}
		}
		if (primitives.length > 0) {
			const bounds = computeBounds(primitives);
			const width = bounds ? Math.max(1, bounds.maxX - bounds.minX) : descriptor.paperWidth ?? 1e3;
			const height = bounds ? Math.max(1, bounds.maxY - bounds.minY) : descriptor.paperHeight ?? 1e3;
			pageData.push({
				id: `page-${pageData.length + 1}`,
				name: section.title || mainGraphic.title || basename(mainGraphic.path),
				kind: "w2d-text",
				sourcePath: mainGraphic.path,
				width,
				height,
				primitives,
				bounds,
				diagnostics: pageDiagnostics
			});
		} else {
			const thumb = resourceByRole(section, /thumbnail|preview/i) ?? section.resources.find((r) => /\.(png|jpe?g|gif|bmp)$/i.test(r.path));
			if (thumb && zip.has(thumb.path)) pageData.push({
				id: `image-${pageData.length + 1}`,
				name: section.title || basename(thumb.path),
				kind: "image",
				sourcePath: thumb.path,
				mediaType: thumb.mediaType ?? mimeFromPath(thumb.path) ?? "image/png",
				width: 1e3,
				height: 1e3,
				diagnostics: [...pageDiagnostics, diag("warning", "DWF_IMAGE_FALLBACK", "Vector stream did not produce geometry; using section thumbnail as fallback.", thumb.path)]
			});
		}
	}
	if (pageData.length === 0) await discoverW2dResources(zip, pageData, diagnostics);
	const hsfEntries = zip.entries.filter((e) => /\.hsf$/i.test(e.name));
	if (hsfEntries.length > 0) {
		diagnostics.push(diag("warning", "DWF_3D_HSF_DETECTED", `Detected ${hsfEntries.length} HSF/3D resource(s). This frontend build reports them but does not render 3D HSF.`, hsfEntries[0]?.name));
		if (pageData.length === 0) pageData.push({
			id: "unsupported-3d",
			name: "Unsupported 3D DWF",
			kind: "unsupported",
			width: 1e3,
			height: 1e3,
			sourcePath: hsfEntries[0]?.name,
			reason: "3D HSF resource detected; not implemented in this pure frontend native renderer build.",
			diagnostics: [diag("warning", "DWF_3D_HSF_UNSUPPORTED", "3D HSF rendering is not implemented in this build.", hsfEntries[0]?.name)]
		});
	}
	if (pageData.length === 0) {
		const imageEntry = chooseBestImage(zip);
		if (imageEntry) pageData.push({
			id: "image-1",
			name: basename(imageEntry.name),
			kind: "image",
			sourcePath: imageEntry.name,
			mediaType: mimeFromPath(imageEntry.name) ?? "image/png",
			width: 1e3,
			height: 1e3,
			diagnostics: [diag("info", "DWF_IMAGE_FALLBACK", "No supported vector page was found; using an embedded preview/image resource.", imageEntry.name)]
		});
	}
	if (pageData.length === 0) pageData.push({
		id: "unsupported-1",
		name: "Unsupported DWF package",
		kind: "unsupported",
		width: 1e3,
		height: 1e3,
		reason: "No supported W2D, XPS FixedPage, or preview image resource was found.",
		diagnostics: [diag("error", "DWF_NO_SUPPORTED_PAGE", "No supported renderable DWF resource was found.")]
	});
	return makeLoadedDocument({
		kind: "dwf",
		pages: [],
		resources,
		diagnostics,
		packageEntries: zip.entries.map((e) => e.name)
	}, pageData, zip, void 0);
}
async function discoverW2dResources(zip, pageData, diagnostics) {
	const w2dEntries = zip.entries.filter((e) => /\.w2d$/i.test(e.name));
	for (const entry of w2dEntries) try {
		const parsed = await parseW2dResource(zip, entry.name);
		const bounds = parsed.bounds;
		const width = bounds ? Math.max(1, bounds.maxX - bounds.minX) : 1e3;
		const height = bounds ? Math.max(1, bounds.maxY - bounds.minY) : 1e3;
		if (parsed.primitives.length > 0) pageData.push({
			id: `page-${pageData.length + 1}`,
			name: basename(entry.name),
			kind: "w2d-text",
			sourcePath: entry.name,
			width,
			height,
			primitives: parsed.primitives,
			bounds,
			diagnostics: parsed.diagnostics
		});
	} catch (err) {
		diagnostics.push(diag("warning", "DWF_W2D_READ_FAILED", `Failed to read ${entry.name}: ${String(err)}`, entry.name));
	}
}
async function parseW2dResource(zip, path) {
	const bytes = await zip.read(path);
	if (bytesLookTextual(bytes)) return parseW2dText(bytes, path);
	return parseW2dBinary(bytes, path);
}
function parseManifestSections(xml, sourcePath) {
	const doc = parseXml(xml, sourcePath);
	return Array.from(doc.getElementsByTagName("*")).filter((el) => local(el) === "Section").map((section, index) => {
		const name = attrAny(section, "name") ?? `section-${index + 1}`;
		return {
			name,
			title: attrAny(section, "title") ?? name,
			resources: Array.from(section.getElementsByTagName("*")).filter((el) => local(el).endsWith("Resource") || local(el) === "Resource").map((el) => ({
				path: normalizePath(attrAny(el, "href") ?? ""),
				role: attrAny(el, "role"),
				mediaType: attrAny(el, "mime"),
				title: attrAny(el, "title")
			})).filter((r) => r.path.length > 0)
		};
	}).filter((s) => s.resources.length > 0);
}
function parseDescriptorInfo(xml, mainGraphicPath) {
	const doc = parseXml(xml, "descriptor.xml");
	const paper = Array.from(doc.getElementsByTagName("*")).find((el) => local(el) === "Paper");
	const info = {};
	if (paper) {
		info.paperWidth = numAttr(paper, "width");
		info.paperHeight = numAttr(paper, "height");
		const clip = attrAny(paper, "clip");
		if (clip) info.clip = parseNumberList(clip);
	}
	const graphics = Array.from(doc.getElementsByTagName("*")).filter((el) => /GraphicResource$/i.test(local(el)) || local(el) === "GraphicResource");
	const main = graphics.find((el) => normalizePath(attrAny(el, "href") ?? "") === normalizePath(mainGraphicPath)) ?? graphics.find((el) => /2d\s+streaming\s+graphics/i.test(attrAny(el, "role") ?? ""));
	const transform = main ? parseNumberList(attrAny(main, "transform") ?? "") : [];
	if (transform.length >= 14) info.w2dTransform = {
		sx: transform[0] || 1,
		sy: transform[5] || transform[0] || 1,
		tx: transform[12] || 0,
		ty: transform[13] || 0
	};
	return info;
}
function parseMarkupPrivateXml(xml, sourcePath, transform) {
	const doc = parseXml(xml, sourcePath);
	const primitives = [];
	const toLogical = (x, y) => transform ? {
		x: (x - transform.tx) / transform.sx,
		y: (y - transform.ty) / transform.sy
	} : {
		x,
		y
	};
	const pointsAttr = (el) => parseNumberList(attrAny(el, "Points") ?? attrAny(el, "points") ?? "");
	for (const el of Array.from(doc.getElementsByTagName("*"))) {
		const name = local(el);
		if (name === "Polyline2D" || name === "Leader") {
			const nums = pointsAttr(el);
			if (nums.length >= 4) {
				const pts = [];
				for (let i = 0; i + 1 < nums.length; i += 2) {
					const p = toLogical(nums[i], nums[i + 1]);
					pts.push(p.x, p.y);
				}
				const style = styleFromMarkup(el);
				primitives.push({
					type: "polyline",
					points: pts,
					stroke: style.stroke,
					lineWidth: style.lineWidth
				});
			}
		} else if (name === "Tag" || name === "Target") {
			const cx = numAttr(el, "CenterX"), cy = numAttr(el, "CenterY"), w = numAttr(el, "Width"), h = numAttr(el, "Height");
			if ([
				cx,
				cy,
				w,
				h
			].every((n) => n !== void 0)) {
				const p1 = toLogical(cx - w / 2, cy - h / 2);
				const p2 = toLogical(cx + w / 2, cy - h / 2);
				const p3 = toLogical(cx + w / 2, cy + h / 2);
				const p4 = toLogical(cx - w / 2, cy + h / 2);
				const style = styleFromMarkup(el);
				primitives.push({
					type: "polygon",
					points: [
						p1.x,
						p1.y,
						p2.x,
						p2.y,
						p3.x,
						p3.y,
						p4.x,
						p4.y
					],
					stroke: style.stroke,
					fill: style.fill,
					lineWidth: style.lineWidth
				});
			}
		} else if (name === "Text") {
			const x = numAttr(el, "X"), y = numAttr(el, "Y");
			if (x !== void 0 && y !== void 0) {
				const phrases = Array.from(el.getElementsByTagName("*")).filter((child) => local(child) === "TextPhrase");
				const text = phrases.map((p) => attrAny(p, "String") ?? "").filter(Boolean).join("\n");
				if (text) {
					const p = toLogical(x, y);
					const heightPaper = numAttr(el, "Height");
					const fontHeight = phrases.length ? numAttr(phrases[0], "FontHeight") : void 0;
					const size = transform && heightPaper ? Math.max(10, Math.abs(heightPaper / transform.sy)) : fontHeight ?? 12;
					const colorAttr = phrases.length ? attrAny(phrases[0], "Color") : void 0;
					primitives.push({
						type: "text",
						x: p.x,
						y: p.y,
						text,
						size,
						fill: colorAttr ? signedIntColor(colorAttr) : styleFromMarkup(el).stroke
					});
				}
			}
		}
	}
	const diagnostics = [];
	if (primitives.length > 0) diagnostics.push(diag("info", "DWF_MARKUP_XML_PARSED", `Parsed ${primitives.length} markup primitive(s) from markup private XML.`, sourcePath));
	return {
		primitives,
		diagnostics
	};
}
function styleFromMarkup(el) {
	let stroke = "#0000ff";
	let fill;
	let lineWidth = 1;
	const props = Array.from(el.getElementsByTagName("*")).filter((e) => local(e) === "FormatProperty");
	for (const p of props) {
		const name = (attrAny(p, "Name") ?? "").toUpperCase();
		const enabled = (attrAny(p, "Enabled") ?? "true").toLowerCase() !== "false";
		const value = attrAny(p, "ModifierUIntVal") ?? attrAny(p, "UIntValue") ?? attrAny(p, "DblValue") ?? attrAny(p, "IntValue");
		if (!enabled || value === void 0) continue;
		if (name === "LINECOLOR") stroke = signedIntColor(value);
		if (name === "FILLCOLOR") fill = signedIntColor(value);
		if (name === "LINEWEIGHT") lineWidth = Math.max(1, Number(value) || lineWidth);
		if (name === "NOFILL" && /true/i.test(attrAny(p, "BoolValue") ?? "")) fill = void 0;
	}
	return {
		stroke,
		fill,
		lineWidth
	};
}
function signedIntColor(value) {
	const n = Number(value);
	if (!Number.isFinite(n)) return "#000000";
	const u = n >>> 0;
	return `rgb(${u >>> 16 & 255}, ${u >>> 8 & 255}, ${u & 255})`;
}
function computeBounds(primitives) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const add = (x, y) => {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};
	for (const p of primitives) if ("points" in p) for (let i = 0; i + 1 < p.points.length; i += 2) add(p.points[i], p.points[i + 1]);
	else if (p.type === "rect") {
		add(p.x, p.y);
		add(p.x + p.width, p.y + p.height);
	} else if (p.type === "text") {
		const size = p.size ?? 12;
		add(p.x, p.y);
		add(p.x, p.y + size);
	} else if (p.type === "path") for (const c of p.commands) {
		if ("x" in c && "y" in c) add(c.x, c.y);
		if ("x1" in c && "y1" in c) add(c.x1, c.y1);
		if ("x2" in c && "y2" in c) add(c.x2, c.y2);
	}
	return Number.isFinite(minX) ? {
		minX,
		minY,
		maxX,
		maxY
	} : void 0;
}
function resourceByRole(section, re) {
	return section.resources.find((r) => re.test(r.role ?? ""));
}
function attrAny(el, name) {
	return el.getAttribute(name) ?? el.getAttribute(`dwf:${name}`) ?? el.getAttribute(`ePlot:${name}`) ?? Array.from(el.attributes).find((a) => a.localName === name)?.value ?? void 0;
}
function local(el) {
	const n = el.localName || el.nodeName;
	const i = n.indexOf(":");
	return i >= 0 ? n.slice(i + 1) : n;
}
function numAttr(el, name) {
	const raw = attrAny(el, name);
	if (raw === void 0) return void 0;
	const n = Number(raw);
	return Number.isFinite(n) ? n : void 0;
}
function basename(path) {
	const i = path.lastIndexOf("/");
	return i >= 0 ? path.slice(i + 1) : path;
}
function chooseBestImage(zip) {
	const images = zip.entries.filter((e) => /\.(png|jpe?g|gif|bmp)$/i.test(e.name));
	if (images.length === 0) return void 0;
	return images.sort((a, b) => scoreImage(b.name, b.uncompressedSize) - scoreImage(a.name, a.uncompressedSize))[0];
}
function scoreImage(path, size) {
	let s = Math.min(size, 1e7) / 1e3;
	if (/thumbnail|preview/i.test(path)) s += 5e3;
	if (extname(path) === "png") s += 100;
	return s;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/format/open.js
async function openDwfDocument(input, options = {}) {
	const bytes = await toBytes(input);
	const fileName = options.fileName ?? (input instanceof File ? input.name : void 0) ?? "document.dwf";
	if (looksLikeZip(bytes)) {
		const zip = ZipPackage.open(bytes, options.inflater);
		if (isProbablyDwfx(zip)) return await openDwfx(zip);
		if (isProbablyClassicDwf(zip)) return await openClassicDwf(zip);
		if (zip.entries.some((e) => /\.fpage$/i.test(e.name))) return await openDwfx(zip);
		return await openClassicDwf(zip);
	}
	if (bytesLookTextual(bytes)) {
		const parsed = parseW2dText(bytes, fileName);
		const isLegacyAsciiDwf = parsed.format === "legacy-ascii-dwf";
		const pageData = [{
			id: "page-1",
			name: fileName,
			kind: "w2d-text",
			width: parsed.bounds ? Math.max(1, parsed.bounds.maxX - parsed.bounds.minX) : 1e3,
			height: parsed.bounds ? Math.max(1, parsed.bounds.maxY - parsed.bounds.minY) : 1e3,
			sourcePath: fileName,
			primitives: parsed.primitives,
			bounds: parsed.bounds,
			diagnostics: parsed.diagnostics
		}];
		return makeLoadedDocument({
			kind: isLegacyAsciiDwf ? "dwf" : "unknown",
			pages: [],
			resources: [{
				path: fileName,
				mediaType: isLegacyAsciiDwf ? "model/vnd.dwf" : "text/plain",
				size: bytes.byteLength
			}],
			diagnostics: isLegacyAsciiDwf ? [diag("info", "LEGACY_ASCII_DWF_MODE", `Opened ${parsed.version ?? "legacy"} readable WHIP!/W2D stream as a classic DWF document.`, fileName)] : [diag("warning", "RAW_TEXT_W2D_MODE", "Input is not a DWF ZIP package; opened it as a textual W2D-like vector stream.", fileName)],
			packageEntries: [fileName]
		}, pageData);
	}
	const unsupported = {
		id: "unsupported-raw",
		name: fileName,
		kind: "unsupported",
		width: 1e3,
		height: 1e3,
		sourcePath: fileName,
		reason: "Input is neither a ZIP-based DWF/DWFx package nor a supported textual W2D stream.",
		diagnostics: [diag("error", "UNSUPPORTED_RAW_FORMAT", "Unsupported raw DWF input. DWF 6+/DWFx ZIP packages or readable legacy WHIP!/W2D streams are required for this build.", fileName)]
	};
	return makeLoadedDocument({
		kind: "unknown",
		pages: [],
		resources: [{
			path: fileName,
			size: bytes.byteLength
		}],
		diagnostics: unsupported.diagnostics,
		packageEntries: [fileName]
	}, [unsupported]);
}
async function toBytes(input) {
	if (input instanceof Uint8Array) return input;
	if (input instanceof ArrayBuffer) return new Uint8Array(input);
	return new Uint8Array(await input.arrayBuffer());
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/style.js
var IDENTITY = {
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
};
function multiplyMatrix(m1, m2) {
	return {
		a: m1.a * m2.a + m1.c * m2.b,
		b: m1.b * m2.a + m1.d * m2.b,
		c: m1.a * m2.c + m1.c * m2.d,
		d: m1.b * m2.c + m1.d * m2.d,
		e: m1.a * m2.e + m1.c * m2.f + m1.e,
		f: m1.b * m2.e + m1.d * m2.f + m1.f
	};
}
function transformPoint(m, x, y) {
	return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}
function parseMatrix(input) {
	if (!input) return { ...IDENTITY };
	const nums = parseNumberList(input);
	if (nums.length >= 6) return {
		a: nums[0],
		b: nums[1],
		c: nums[2],
		d: nums[3],
		e: nums[4],
		f: nums[5]
	};
	return { ...IDENTITY };
}
function parseBrushColor(input, opacity = 1) {
	if (!input || input === "Transparent" || input === "{x:Null}") return void 0;
	let s = input.trim();
	if (s.startsWith("{") || s.includes("Brush")) return void 0;
	const known = namedColor(s);
	if (known) s = known;
	if (s.startsWith("sc#")) {
		const nums = parseNumberList(s);
		if (nums.length >= 3) {
			const offset = nums.length >= 4 ? 1 : 0;
			const a = nums.length >= 4 ? nums[0] : 1;
			return rgba$1(Math.round((nums[offset] ?? 0) * 255), Math.round((nums[offset + 1] ?? 0) * 255), Math.round((nums[offset + 2] ?? 0) * 255), a * opacity);
		}
	}
	if (s.startsWith("#")) {
		const hex = s.slice(1);
		if (hex.length === 3) return rgba$1(parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), opacity);
		if (hex.length === 6) return rgba$1(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), opacity);
		if (hex.length === 8) {
			const a = parseInt(hex.slice(0, 2), 16) / 255;
			return rgba$1(parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), parseInt(hex.slice(6, 8), 16), a * opacity);
		}
	}
	if (/^rgba?\(/i.test(s)) return s;
	return s;
}
function colorToRgba32(css, fallback = 4278190080) {
	if (!css) return fallback;
	const s = css.trim();
	const rgbaMatch = s.match(/^rgba?\(([^)]+)\)/i);
	if (rgbaMatch) {
		const parts = rgbaMatch[1].split(",").map((x) => x.trim());
		const r = Number(parts[0] ?? 0), g = Number(parts[1] ?? 0), b = Number(parts[2] ?? 0);
		const a = parts[3] === void 0 ? 1 : Number(parts[3]);
		return packRgba(r, g, b, Math.round(a * 255));
	}
	if (s.startsWith("#")) {
		const hex = s.slice(1);
		if (hex.length === 6) return packRgba(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), 255);
		if (hex.length === 8) return packRgba(parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), parseInt(hex.slice(6, 8), 16), parseInt(hex.slice(0, 2), 16));
	}
	const known = namedColor(s);
	return known ? colorToRgba32(known, fallback) : fallback;
}
function packRgba(r, g, b, a) {
	r = clamp255$1(r);
	g = clamp255$1(g);
	b = clamp255$1(b);
	a = clamp255$1(a);
	return r & 255 | (g & 255) << 8 | (b & 255) << 16 | (a & 255) << 24;
}
function rgba$1(r, g, b, a) {
	return `rgba(${clamp255$1(r)}, ${clamp255$1(g)}, ${clamp255$1(b)}, ${Math.max(0, Math.min(1, a))})`;
}
function clamp255$1(v) {
	return Math.max(0, Math.min(255, Math.round(v)));
}
function namedColor(s) {
	switch (s.toLowerCase()) {
		case "black": return "#000000";
		case "white": return "#ffffff";
		case "red": return "#ff0000";
		case "green": return "#008000";
		case "blue": return "#0000ff";
		case "yellow": return "#ffff00";
		case "cyan": return "#00ffff";
		case "magenta": return "#ff00ff";
		case "gray":
		case "grey": return "#808080";
		case "transparent": return "#00000000";
		default: return;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/viewport.js
function fitPageMatrix(opts) {
	const margin = opts.margin ?? 24;
	const usableW = Math.max(1, opts.canvasWidth - margin * 2);
	const usableH = Math.max(1, opts.canvasHeight - margin * 2);
	const scale = Math.min(usableW / Math.max(1, opts.pageWidth), usableH / Math.max(1, opts.pageHeight)) * (opts.zoom ?? 1);
	return {
		a: scale,
		b: 0,
		c: 0,
		d: scale,
		e: (opts.canvasWidth - opts.pageWidth * scale) / 2 + (opts.panX ?? 0) - (opts.sourceMinX ?? 0) * scale,
		f: (opts.canvasHeight - opts.pageHeight * scale) / 2 + (opts.panY ?? 0) - (opts.sourceMinY ?? 0) * scale
	};
}
function matrixForW2d(page, canvasWidth, canvasHeight, zoom = 1, panX = 0, panY = 0) {
	const b = page.bounds;
	const minX = b?.minX ?? 0;
	b?.minY;
	const maxY = b?.maxY ?? page.height;
	const pageWidth = b ? Math.max(1, b.maxX - b.minX) : page.width;
	const pageHeight = b ? Math.max(1, b.maxY - b.minY) : page.height;
	const usableW = Math.max(1, canvasWidth - 48);
	const usableH = Math.max(1, canvasHeight - 48);
	const scale = Math.min(usableW / Math.max(1, pageWidth), usableH / Math.max(1, pageHeight)) * zoom;
	const left = (canvasWidth - pageWidth * scale) / 2 + panX;
	const top = (canvasHeight - pageHeight * scale) / 2 + panY;
	return {
		a: scale,
		b: 0,
		c: 0,
		d: -scale,
		e: left - minX * scale,
		f: top + maxY * scale
	};
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/cadLineStyle.js
function estimateMatrixScale(m) {
	const sx = Math.hypot(m.a, m.b);
	const sy = Math.hypot(m.c, m.d);
	return Math.max(1e-12, (sx + sy) * .5);
}
function canvasDpr(canvas) {
	const rect = canvas.getBoundingClientRect?.();
	const cssW = rect && rect.width > 0 ? rect.width : Number(canvas.style.width?.replace("px", "")) || canvas.width;
	return Math.max(1, canvas.width / Math.max(1, cssW));
}
function adaptiveStrokeUserWidth(sourceWidth, matrix, opts = {}, runtime) {
	const scale = estimateMatrixScale(matrix);
	const physicalDevicePx = Math.max(0, Math.abs(sourceWidth || 0) * scale);
	const mode = opts.lineWeightMode ?? "adaptive";
	if (mode === "physical") return Math.max(1e-6, Math.abs(sourceWidth || 1));
	const dpr = Math.max(1, runtime.dpr || 1);
	const minDevicePx = Math.max(.25, (opts.minStrokeCssPx ?? .55) * dpr);
	if (mode === "hairline") return minDevicePx / scale;
	const zoom = Math.max(.05, runtime.zoom ?? 1);
	const overviewMaxCss = opts.maxOverviewStrokeCssPx ?? 1.15;
	const adaptiveMaxCss = zoom <= 1 ? overviewMaxCss : Math.min(24, overviewMaxCss * (1 + Math.log2(zoom) * 1.6));
	const maxDevicePx = Math.max(minDevicePx, adaptiveMaxCss * dpr);
	return Math.max(minDevicePx, Math.min(physicalDevicePx, maxDevicePx)) / scale;
}
function shouldDrawTextByPixelSize(fontSizeSourceUnits, matrix, opts = {}, runtime) {
	if ((opts.lineWeightMode ?? "adaptive") === "physical") return true;
	const dpr = Math.max(1, runtime.dpr || 1);
	const minCss = opts.minTextCssPx ?? 3.5;
	return Math.abs(fontSizeSourceUnits * estimateMatrixScale(matrix)) >= minCss * dpr;
}
function shouldDrawFilledBounds(bounds, matrix, opts = {}, runtime) {
	if (!bounds || (opts.lineWeightMode ?? "adaptive") === "physical") return true;
	const dpr = Math.max(1, runtime.dpr || 1);
	const minArea = Math.max(0, opts.minFilledAreaCssPx ?? .12) * dpr * dpr;
	if (minArea <= 0) return true;
	const p1 = transform(matrix, bounds.minX, bounds.minY);
	const p2 = transform(matrix, bounds.maxX, bounds.minY);
	const p3 = transform(matrix, bounds.maxX, bounds.maxY);
	const p4 = transform(matrix, bounds.minX, bounds.maxY);
	const xs = [
		p1[0],
		p2[0],
		p3[0],
		p4[0]
	];
	const ys = [
		p1[1],
		p2[1],
		p3[1],
		p4[1]
	];
	return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) >= minArea;
}
function transform(m, x, y) {
	return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/wasm/WasmRasterBackend.js
var WasmRasterBackend = class {
	constructor(options = {}) {
		this.fbPtr = 0;
		this.fbBytes = 0;
		this.width = 0;
		this.height = 0;
		this.wasmUrl = options.wasmUrl ?? "./public/dwfv-render.wasm";
	}
	async init() {
		if (this.exports) return;
		const response = await fetch(this.wasmUrl);
		if (!response.ok) throw new Error(`Failed to load WASM raster backend: ${response.status} ${response.statusText}`);
		const bytes = await response.arrayBuffer();
		const instance = await WebAssembly.instantiate(bytes, {});
		this.exports = instance.instance.exports;
	}
	begin(width, height, backgroundCss = "#ffffff") {
		const e = this.requireExports();
		this.width = Math.max(1, Math.floor(width));
		this.height = Math.max(1, Math.floor(height));
		this.fbBytes = this.width * this.height * 4;
		e.dwfv_reset_heap();
		this.fbPtr = e.dwfv_alloc(this.fbBytes);
		this.ensureMemory(this.fbPtr + this.fbBytes);
		e.dwfv_clear(this.fbPtr, this.width, this.height, colorToRgba32(backgroundCss, 4294967295));
	}
	drawPolyline(points, matrix, strokeCss, thickness = 1) {
		const e = this.requireExports();
		if (points.length < 4 || !strokeCss) return;
		const count = Math.floor(points.length / 2);
		const ptr = this.allocF32(count * 2);
		const heap = new Float32Array(e.memory.buffer, ptr, count * 2);
		for (let i = 0; i < count; i++) {
			const [x, y] = transformPoint(matrix, points[i * 2], points[i * 2 + 1]);
			heap[i * 2] = x;
			heap[i * 2 + 1] = y;
		}
		e.dwfv_draw_polyline(this.fbPtr, this.width, this.height, ptr, count, colorToRgba32(strokeCss, 4278190080), Math.max(1, thickness));
	}
	drawPolygon(points, matrix, fillCss) {
		const e = this.requireExports();
		if (points.length < 6 || !fillCss) return;
		const count = Math.floor(points.length / 2);
		const ptr = this.allocF32(count * 2);
		const heap = new Float32Array(e.memory.buffer, ptr, count * 2);
		for (let i = 0; i < count; i++) {
			const [x, y] = transformPoint(matrix, points[i * 2], points[i * 2 + 1]);
			heap[i * 2] = x;
			heap[i * 2 + 1] = y;
		}
		e.dwfv_draw_polygon(this.fbPtr, this.width, this.height, ptr, count, colorToRgba32(fillCss, 4278190080));
	}
	toImageData() {
		const e = this.requireExports();
		const src = new Uint8ClampedArray(e.memory.buffer, this.fbPtr, this.fbBytes);
		return new ImageData(new Uint8ClampedArray(src), this.width, this.height);
	}
	allocF32(floatCount) {
		const e = this.requireExports();
		const byteCount = floatCount * 4;
		const ptr = e.dwfv_alloc(byteCount);
		this.ensureMemory(ptr + byteCount);
		return ptr;
	}
	ensureMemory(requiredBytes) {
		const e = this.requireExports();
		const page = 65536;
		const current = e.memory.buffer.byteLength;
		if (requiredBytes > current) e.memory.grow(Math.ceil((requiredBytes - current) / page));
	}
	requireExports() {
		if (!this.exports) throw new Error("WASM backend is not initialized. Call init() first.");
		return this.exports;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/WebGlXpsBackend.js
var VERTEX_STRIDE$1 = 12;
var DEFAULT_MAX_GPU_CACHE_BYTES$1 = 134217728;
var DEFAULT_MAX_CACHED_SCENES$1 = 4;
var IDENTITY_MATRIX$1 = {
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
};
var WebGlXpsBackend = class {
	constructor(canvas) {
		this.scenes = /* @__PURE__ */ new Map();
		this.gpuBytes = 0;
		this.tick = 0;
		this.canvas = canvas ?? document.createElement("canvas");
		const gl = this.canvas.getContext("webgl", {
			alpha: false,
			antialias: true,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: true,
			powerPreference: "high-performance"
		});
		if (!gl) throw new Error("WebGLRenderingContext is not available.");
		this.gl = gl;
		this.program = createProgram$1(gl, VERTEX_SHADER$1, FRAGMENT_SHADER$1);
		this.aPos = gl.getAttribLocation(this.program, "a_pos");
		this.aColor = gl.getAttribLocation(this.program, "a_color");
		const matrix = gl.getUniformLocation(this.program, "u_matrix");
		const viewport = gl.getUniformLocation(this.program, "u_viewport");
		if (this.aPos < 0 || this.aColor < 0 || !matrix || !viewport) throw new Error("Failed to resolve WebGL shader locations.");
		this.uMatrix = matrix;
		this.uViewport = viewport;
	}
	render(page, root, targetCanvas, options = {}) {
		const warnings = [];
		if (targetCanvas.width <= 0 || targetCanvas.height <= 0) return {
			commands: 0,
			warnings,
			gpuBytes: this.gpuBytes,
			vertexCount: 0,
			pathCount: 0,
			cacheHit: true
		};
		this.resize(targetCanvas.width, targetCanvas.height);
		const pageMatrix = fitPageMatrix({
			canvasWidth: this.canvas.width,
			canvasHeight: this.canvas.height,
			pageWidth: page.width,
			pageHeight: page.height,
			zoom: options.zoom,
			panX: options.panX,
			panY: options.panY
		});
		const runtime = {
			dpr: canvasDpr(targetCanvas),
			zoom: options.zoom ?? 1
		};
		const key = sceneKey$1(page, pageMatrix, options);
		let scene = this.scenes.get(key);
		const cacheHit = !!scene;
		if (!scene) {
			const vectors = collectVectorPaths(root);
			scene = this.compileScene(page, key, vectors, pageMatrix, options, runtime);
			this.scenes.set(key, scene);
			this.gpuBytes += scene.gpuBytes;
			this.evictIfNeeded(options);
			scene = this.scenes.get(key) ?? scene;
		}
		scene.lastUsed = ++this.tick;
		const gl = this.gl;
		const bg = rgba01$1(options.background ?? "#ffffff");
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(this.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffer);
		gl.enableVertexAttribArray(this.aPos);
		gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, VERTEX_STRIDE$1, 0);
		gl.enableVertexAttribArray(this.aColor);
		gl.vertexAttribPointer(this.aColor, 4, gl.UNSIGNED_BYTE, true, VERTEX_STRIDE$1, 8);
		gl.uniform4f(this.uMatrix, pageMatrix.a, pageMatrix.b, pageMatrix.c, pageMatrix.d);
		gl.uniform4f(this.uViewport, pageMatrix.e, pageMatrix.f, this.canvas.width, this.canvas.height);
		gl.drawArrays(gl.TRIANGLES, 0, scene.vertexCount);
		if (options.compositeToTarget ?? true) {
			const ctx = targetCanvas.getContext("2d");
			if (!ctx) throw new Error("CanvasRenderingContext2D is not available for WebGL compositing.");
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
			ctx.drawImage(this.canvas, 0, 0);
			ctx.restore();
		}
		if (scene.vertexCount === 0) warnings.push(diag("warning", "WEBGL_XPS_EMPTY_SCENE", "WebGL XPS scene contained no drawable vector geometry; Canvas/WASM fallback may be required.", page.sourcePath));
		return {
			commands: scene.pathCount,
			warnings,
			gpuBytes: this.gpuBytes,
			vertexCount: scene.vertexCount,
			pathCount: scene.pathCount,
			cacheHit
		};
	}
	dispose() {
		for (const scene of this.scenes.values()) this.gl.deleteBuffer(scene.buffer);
		this.scenes.clear();
		this.gpuBytes = 0;
	}
	resize(width, height) {
		if (this.canvas.width !== width || this.canvas.height !== height) {
			this.canvas.width = width;
			this.canvas.height = height;
		}
	}
	compileScene(page, key, vectors, pageMatrix, options, runtime) {
		const writer = new VertexWriter$1();
		let pathCount = 0;
		for (const vector of vectors) {
			pathCount++;
			appendVectorPath(writer, vector, pageMatrix, options, runtime);
		}
		const bufferBytes = writer.byteLength;
		const maxBytes = options.maxGpuCacheBytes ?? DEFAULT_MAX_GPU_CACHE_BYTES$1;
		if (bufferBytes > maxBytes) throw new Error(`WebGL XPS scene buffer would require ${formatBytes$2(bufferBytes)}, exceeding maxGpuCacheBytes=${formatBytes$2(maxBytes)}.`);
		const gl = this.gl;
		const buffer = gl.createBuffer();
		if (!buffer) throw new Error("Failed to allocate WebGLBuffer.");
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, writer.toArrayBuffer(), gl.STATIC_DRAW);
		const err = gl.getError();
		if (err !== gl.NO_ERROR) {
			gl.deleteBuffer(buffer);
			throw new Error(`WebGL XPS buffer upload failed: 0x${err.toString(16)} for ${page.sourcePath}.`);
		}
		return {
			key,
			buffer,
			vertexCount: writer.vertexCount,
			gpuBytes: bufferBytes,
			pathCount,
			lastUsed: ++this.tick
		};
	}
	evictIfNeeded(options) {
		const maxBytes = options.maxGpuCacheBytes ?? DEFAULT_MAX_GPU_CACHE_BYTES$1;
		const maxScenes = options.maxCachedScenes ?? DEFAULT_MAX_CACHED_SCENES$1;
		while (this.scenes.size > Math.max(1, maxScenes) || this.gpuBytes > maxBytes) {
			let oldest;
			for (const scene of this.scenes.values()) if (!oldest || scene.lastUsed < oldest.lastUsed) oldest = scene;
			if (!oldest) break;
			this.scenes.delete(oldest.key);
			this.gl.deleteBuffer(oldest.buffer);
			this.gpuBytes -= oldest.gpuBytes;
		}
	}
};
function collectVectorPaths(root) {
	const out = [];
	walk(root, IDENTITY_MATRIX$1, 1, out);
	return out;
}
function walk(el, matrix, opacity, out) {
	const name = localName(el);
	const composed = multiplyMatrix(matrix, elementMatrix$1(el));
	const ownOpacity = opacity * parseOpacity$1(getAttr(el, "Opacity"));
	if (name === "Path") {
		const commands = extractPathCommands$1(el);
		if (commands.length > 0) {
			const fill = extractBrush$1(el, "Fill", ownOpacity);
			const stroke = extractBrush$1(el, "Stroke", ownOpacity);
			const thickness = Number(getAttr(el, "StrokeThickness") ?? 1);
			if (fill || stroke && thickness > 0) out.push({
				commands,
				matrix: composed,
				opacity: ownOpacity,
				fill,
				stroke,
				thickness: Number.isFinite(thickness) ? thickness : 1,
				lineStyle: extractLineStyle(el),
				fillRule: fillRule$1(el),
				bounds: pathBounds$1(commands)
			});
		}
	}
	for (const child of childElements(el)) {
		if (localName(child).includes(".")) continue;
		walk(child, composed, ownOpacity, out);
	}
}
function appendVectorPath(writer, vector, pageMatrix, options, runtime) {
	const fullMatrix = multiplyMatrix(pageMatrix, vector.matrix);
	const localScale = estimateMatrixScale(vector.matrix);
	const sourceWidth = Math.max(1e-6, vector.thickness || 1);
	const width = Math.max(.01, adaptiveStrokeUserWidth(sourceWidth, fullMatrix, options, runtime) * localScale);
	const subs = flattenPath(vector.commands, .5);
	const fill = vector.fill ? rgbaBytes$1(vector.fill) : void 0;
	const stroke = vector.stroke ? rgbaBytes$1(vector.stroke) : void 0;
	if (fill && shouldDrawFilledBounds(vector.bounds, fullMatrix, options, runtime)) {
		for (const sub of subs) if (sub.closed || sub.points.length >= 6) appendPolygonFan$1(writer, transformPointsArray$1(sub.points, vector.matrix), fill);
	}
	if (stroke && vector.thickness > 0) for (const sub of subs) {
		const pts = transformPointsArray$1(sub.points, vector.matrix);
		const drawPts = sub.closed ? closePoints$2(pts) : pts;
		if (vector.lineStyle.dash.length > 0) appendDashedPolyline(writer, drawPts, width, vector.lineStyle, stroke);
		else appendPolyline$1(writer, drawPts, width, stroke);
	}
}
var VertexWriter$1 = class {
	constructor() {
		this.buffer = /* @__PURE__ */ new ArrayBuffer(65536);
		this.view = new DataView(this.buffer);
		this.vertexCount = 0;
	}
	get byteLength() {
		return this.vertexCount * VERTEX_STRIDE$1;
	}
	push(x, y, color) {
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;
		const offset = this.byteLength;
		this.ensure(VERTEX_STRIDE$1);
		this.view.setFloat32(offset, x, true);
		this.view.setFloat32(offset + 4, y, true);
		this.view.setUint8(offset + 8, color.r);
		this.view.setUint8(offset + 9, color.g);
		this.view.setUint8(offset + 10, color.b);
		this.view.setUint8(offset + 11, color.a);
		this.vertexCount++;
	}
	toArrayBuffer() {
		return this.buffer.slice(0, this.byteLength);
	}
	ensure(extraBytes) {
		const needed = this.byteLength + extraBytes;
		if (needed <= this.buffer.byteLength) return;
		let next = this.buffer.byteLength;
		while (next < needed) next *= 2;
		const newBuffer = new ArrayBuffer(next);
		new Uint8Array(newBuffer).set(new Uint8Array(this.buffer, 0, this.byteLength));
		this.buffer = newBuffer;
		this.view = new DataView(this.buffer);
	}
};
function appendPolygonFan$1(writer, pts, color) {
	if (pts.length < 3) return;
	const p0 = pts[0];
	for (let i = 1; i + 1 < pts.length; i++) {
		const p1 = pts[i];
		const p2 = pts[i + 1];
		if (triangleAreaAbs$1(p0, p1, p2) < 1e-6) continue;
		writer.push(p0.x, p0.y, color);
		writer.push(p1.x, p1.y, color);
		writer.push(p2.x, p2.y, color);
	}
}
function appendPolyline$1(writer, pts, width, color) {
	if (pts.length < 2) return;
	const half = Math.max(.05, width * .5);
	for (let i = 0; i + 1 < pts.length; i++) appendLineSegment$1(writer, pts[i], pts[i + 1], half, color);
}
function appendDashedPolyline(writer, pts, width, style, color) {
	if (pts.length < 2 || style.dash.length === 0) return;
	const pattern = style.dash.map((v) => Math.max(.01, v * width));
	const total = pattern.reduce((a, b) => a + b, 0);
	if (total <= .01) {
		appendPolyline$1(writer, pts, width, color);
		return;
	}
	let patternIndex = 0;
	let remaining = pattern[0];
	let draw = true;
	let offset = (style.dashOffset * width % total + total) % total;
	while (offset > remaining) {
		offset -= remaining;
		patternIndex = (patternIndex + 1) % pattern.length;
		remaining = pattern[patternIndex];
		draw = !draw;
	}
	remaining -= offset;
	for (let i = 0; i + 1 < pts.length; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.hypot(dx, dy);
		if (len <= 1e-9) continue;
		let consumed = 0;
		while (consumed < len - 1e-9) {
			const step = Math.min(remaining, len - consumed);
			if (draw && step > 1e-9) {
				const t0 = consumed / len;
				const t1 = (consumed + step) / len;
				appendLineSegment$1(writer, {
					x: a.x + dx * t0,
					y: a.y + dy * t0
				}, {
					x: a.x + dx * t1,
					y: a.y + dy * t1
				}, Math.max(.05, width * .5), color);
			}
			consumed += step;
			remaining -= step;
			if (remaining <= 1e-9) {
				patternIndex = (patternIndex + 1) % pattern.length;
				remaining = pattern[patternIndex];
				draw = !draw;
			}
		}
	}
}
function appendLineSegment$1(writer, p0, p1, half, color) {
	const dx = p1.x - p0.x;
	const dy = p1.y - p0.y;
	const len = Math.hypot(dx, dy);
	if (len <= 1e-9) return;
	const nx = -dy / len * half;
	const ny = dx / len * half;
	const ax = p0.x + nx, ay = p0.y + ny;
	const bx = p0.x - nx, by = p0.y - ny;
	const cx = p1.x - nx, cy = p1.y - ny;
	const dx2 = p1.x + nx, dy2 = p1.y + ny;
	writer.push(ax, ay, color);
	writer.push(bx, by, color);
	writer.push(cx, cy, color);
	writer.push(ax, ay, color);
	writer.push(cx, cy, color);
	writer.push(dx2, dy2, color);
}
function transformPointsArray$1(points, m) {
	const out = [];
	for (let i = 0; i + 1 < points.length; i += 2) {
		const [x, y] = transformPoint(m, points[i] ?? 0, points[i + 1] ?? 0);
		out.push({
			x,
			y
		});
	}
	return out;
}
function closePoints$2(pts) {
	if (pts.length < 2) return pts;
	const first = pts[0];
	const last = pts[pts.length - 1];
	if (first.x === last.x && first.y === last.y) return pts;
	return [...pts, {
		x: first.x,
		y: first.y
	}];
}
function triangleAreaAbs$1(a, b, c) {
	return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}
function sceneKey$1(page, pageMatrix, options) {
	const mode = options.lineWeightMode ?? "adaptive";
	const scaleBucket = mode === "physical" ? "physical" : String(Math.round(Math.log2(Math.max(1e-12, estimateMatrixScale(pageMatrix))) * 8));
	return `${page.id}|${page.sourcePath}|${page.width}x${page.height}|lw:${mode}:${scaleBucket}`;
}
function elementMatrix$1(el) {
	let m = parseMatrix(getAttr(el, "RenderTransform") ?? getAttr(el, "Transform"));
	for (const child of childElements(el)) {
		const name = localName(child);
		if (name.endsWith(".RenderTransform") || name.endsWith(".Transform")) {
			const matrixEl = childElements(child).find((c) => localName(c) === "MatrixTransform");
			if (matrixEl) m = multiplyMatrix(m, parseMatrix(getAttr(matrixEl, "Matrix")));
		}
	}
	const left = Number(getAttr(el, "Canvas.Left") ?? 0);
	const top = Number(getAttr(el, "Canvas.Top") ?? 0);
	if (left || top) m = multiplyMatrix({
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: left,
		f: top
	}, m);
	return m;
}
function extractPathCommands$1(pathEl) {
	const data = getAttr(pathEl, "Data");
	if (data) return parsePathData(data);
	for (const prop of childElements(pathEl)) {
		if (localName(prop) !== "Path.Data") continue;
		for (const geom of childElements(prop)) {
			const figures = getAttr(geom, "Figures");
			if (figures) return parsePathData(figures);
		}
	}
	return [];
}
function extractBrush$1(el, prop, opacity) {
	const direct = getAttr(el, prop);
	if (direct) return parseBrushColor(direct, opacity);
	const solid = findPropertyBrush$1(el, prop, "SolidColorBrush");
	if (solid) return parseBrushColor(getAttr(solid, "Color"), opacity * parseOpacity$1(getAttr(solid, "Opacity")));
}
function findPropertyBrush$1(el, prop, brushLocalName) {
	const propName = `${localName(el)}.${prop}`;
	for (const child of childElements(el)) {
		if (localName(child) !== propName) continue;
		return childElements(child).find((c) => localName(c) === brushLocalName);
	}
}
function parseOpacity$1(value) {
	if (!value) return 1;
	const n = Number(value);
	return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
}
function fillRule$1(el) {
	const data = getAttr(el, "Data") ?? "";
	return /F0/.test(data) ? "nonzero" : "evenodd";
}
function extractLineStyle(el) {
	const start = (getAttr(el, "StrokeStartLineCap") ?? "").toLowerCase();
	const end = (getAttr(el, "StrokeEndLineCap") ?? "").toLowerCase();
	const dashCap = (getAttr(el, "StrokeDashCap") ?? "").toLowerCase();
	const cap = start === "round" || end === "round" || dashCap === "round" ? "round" : start === "square" || end === "square" || dashCap === "square" ? "square" : "butt";
	const joinAttr = (getAttr(el, "StrokeLineJoin") ?? "").toLowerCase();
	const join = joinAttr === "round" ? "round" : joinAttr === "bevel" ? "bevel" : "miter";
	const miter = Number(getAttr(el, "StrokeMiterLimit") ?? 10);
	return {
		cap,
		join,
		miterLimit: Number.isFinite(miter) && miter > 0 ? miter : 10,
		dash: parseNumberList(getAttr(el, "StrokeDashArray") ?? "").filter((v) => Number.isFinite(v) && v > 0),
		dashOffset: Number(getAttr(el, "StrokeDashOffset") ?? 0) || 0
	};
}
function pathBounds$1(commands) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const add = (x, y) => {
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};
	for (const c of commands) if (c.type === "M" || c.type === "L") add(c.x, c.y);
	else if (c.type === "C") {
		add(c.x1, c.y1);
		add(c.x2, c.y2);
		add(c.x, c.y);
	} else if (c.type === "Q") {
		add(c.x1, c.y1);
		add(c.x, c.y);
	} else if (c.type === "A") {
		add(c.x - c.rx, c.y - c.ry);
		add(c.x + c.rx, c.y + c.ry);
	}
	return Number.isFinite(minX) ? {
		minX,
		minY,
		maxX,
		maxY
	} : void 0;
}
function rgbaBytes$1(css) {
	const packed = colorToRgba32(css, 4278190080);
	return {
		r: packed & 255,
		g: packed >>> 8 & 255,
		b: packed >>> 16 & 255,
		a: packed >>> 24 & 255
	};
}
function rgba01$1(css) {
	const c = rgbaBytes$1(css);
	return [
		c.r / 255,
		c.g / 255,
		c.b / 255,
		c.a / 255
	];
}
function formatBytes$2(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}
function createProgram$1(gl, vertexSource, fragmentSource) {
	const vertex = compileShader$2(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compileShader$2(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	if (!program) throw new Error("Failed to create WebGLProgram.");
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program) ?? "unknown link error";
		gl.deleteProgram(program);
		throw new Error(`WebGL program link failed: ${log}`);
	}
	return program;
}
function compileShader$2(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("Failed to create WebGLShader.");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader) ?? "unknown shader compile error";
		gl.deleteShader(shader);
		throw new Error(`WebGL shader compile failed: ${log}`);
	}
	return shader;
}
var VERTEX_SHADER$1 = `
attribute vec2 a_pos;
attribute vec4 a_color;
uniform vec4 u_matrix;
uniform vec4 u_viewport;
varying vec4 v_color;
void main() {
  float x = u_matrix.x * a_pos.x + u_matrix.z * a_pos.y + u_viewport.x;
  float y = u_matrix.y * a_pos.x + u_matrix.w * a_pos.y + u_viewport.y;
  vec2 clip = vec2((x / u_viewport.z) * 2.0 - 1.0, 1.0 - (y / u_viewport.w) * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_color = a_color;
}
`;
var FRAGMENT_SHADER$1 = `
precision mediump float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/XpsRenderer.js
var XpsRenderer = class {
	constructor(document) {
		this.document = document;
		this.fontCache = /* @__PURE__ */ new Map();
		this.xmlCache = /* @__PURE__ */ new Map();
	}
	async render(page, canvas, options = {}) {
		if (!this.document.opc) throw new Error("XPS page requires an OPC package view.");
		const warnings = actionableDiagnostics(page.diagnostics);
		const root = (await this.getXmlDocument(page.sourcePath)).documentElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("CanvasRenderingContext2D is not available.");
		const bg = options.background ?? "#ffffff";
		const runtime = {
			dpr: canvasDpr(canvas),
			zoom: options.zoom ?? 1
		};
		const pageMatrix = fitPageMatrix({
			canvasWidth: canvas.width,
			canvasHeight: canvas.height,
			pageWidth: page.width,
			pageHeight: page.height,
			zoom: options.zoom,
			panX: options.panX,
			panY: options.panY
		});
		let commands = 0;
		if (options.preferWebgl ?? true) try {
			const backend = this.getWebGlBackend(options.webglCanvas);
			if (options.webglCanvas) options.webglCanvas.style.visibility = "visible";
			const stats = backend.render(page, root, canvas, {
				...options,
				compositeToTarget: !options.webglCanvas
			});
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.restore();
			commands += stats.commands;
			commands += await this.renderElementToCanvas(root, ctx, page.sourcePath, pageMatrix, 1, warnings, {
				vectors: false,
				overlays: true
			}, options, runtime);
			warnings.push(...stats.warnings);
			return {
				backend: "webgl-xps",
				commands,
				warnings
			};
		} catch (err) {
			if (options.webglCanvas) options.webglCanvas.style.visibility = "hidden";
			warnings.push(diag("warning", "WEBGL_XPS_BACKEND_FALLBACK", `WebGL XPS vector path failed, falling back to ${options.preferWasm ? "WASM raster" : "Canvas2D"}: ${String(err)}`, page.sourcePath));
		}
		if (options.webglCanvas) options.webglCanvas.style.visibility = "hidden";
		if (options.preferWasm) try {
			this.wasm ?? (this.wasm = new WasmRasterBackend({ wasmUrl: options.wasmUrl }));
			await this.wasm.init();
			this.wasm.begin(canvas.width, canvas.height, bg);
			commands += this.renderElementToWasm(root, pageMatrix, 1, warnings, options, runtime);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.putImageData(this.wasm.toImageData(), 0, 0);
			commands += await this.renderElementToCanvas(root, ctx, page.sourcePath, pageMatrix, 1, warnings, {
				vectors: false,
				overlays: true
			}, options, runtime);
			return {
				backend: "wasm-raster",
				commands,
				warnings
			};
		} catch (err) {
			warnings.push(diag("warning", "WASM_BACKEND_FALLBACK", `WASM raster path failed, falling back to Canvas2D: ${String(err)}`));
		}
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
		commands += await this.renderElementToCanvas(root, ctx, page.sourcePath, pageMatrix, 1, warnings, {
			vectors: true,
			overlays: true
		}, options, runtime);
		return {
			backend: "canvas2d",
			commands,
			warnings
		};
	}
	getWebGlBackend(canvas) {
		if (!this.webgl || this.webglCanvas !== canvas) {
			this.webgl?.dispose();
			this.webgl = new WebGlXpsBackend(canvas);
			this.webglCanvas = canvas;
		}
		return this.webgl;
	}
	getXmlDocument(part) {
		let cached = this.xmlCache.get(part);
		if (!cached) {
			cached = this.document.opc.readText(part).then((xml) => parseXml(xml, part));
			this.xmlCache.set(part, cached);
		}
		return cached;
	}
	dispose() {
		this.webgl?.dispose();
		this.webgl = void 0;
		this.webglCanvas = void 0;
		this.xmlCache.clear();
		this.fontCache.clear();
	}
	async renderElementToCanvas(el, ctx, pagePath, matrix, opacity, warnings, mode, options, runtime) {
		const name = localName(el);
		const composed = multiplyMatrix(matrix, elementMatrix(el));
		const ownOpacity = opacity * parseOpacity(getAttr(el, "Opacity"));
		let commands = 0;
		if (name === "Path" && mode.vectors) {
			const path = extractPathCommands(el);
			if (path.length > 0) {
				ctx.save();
				ctx.setTransform(composed.a, composed.b, composed.c, composed.d, composed.e, composed.f);
				ctx.globalAlpha = ownOpacity;
				const clip = getAttr(el, "Clip");
				if (clip) {
					ctx.beginPath();
					applyPathToCanvas(ctx, parsePathData(clip));
					ctx.clip();
				}
				ctx.beginPath();
				applyPathToCanvas(ctx, path);
				const fill = extractBrush(el, "Fill", ownOpacity);
				const stroke = extractBrush(el, "Stroke", ownOpacity);
				const thickness = Number(getAttr(el, "StrokeThickness") ?? 1);
				const bounds = pathBounds(path);
				if (fill && shouldDrawFilledBounds(bounds, composed, options, runtime)) {
					ctx.fillStyle = fill;
					ctx.fill(fillRule(el));
				}
				if (stroke && thickness > 0) {
					ctx.strokeStyle = stroke;
					ctx.lineWidth = adaptiveStrokeUserWidth(thickness, composed, options, runtime);
					applyStrokeStyle(ctx, el, ctx.lineWidth);
					ctx.stroke();
				}
				ctx.restore();
				commands++;
			}
		} else if (name === "Glyphs" && mode.overlays) commands += await this.drawGlyphs(ctx, pagePath, el, composed, ownOpacity, warnings, options, runtime);
		else if (name === "Image" && mode.overlays) {
			const source = getAttr(el, "Source") ?? getAttr(el, "ImageSource");
			if (source) try {
				await this.drawImageResource(ctx, pagePath, source, composed, ownOpacity, el);
				commands++;
			} catch (err) {
				warnings.push(diag("warning", "XPS_IMAGE_DRAW_FAILED", `Failed to draw image ${source}: ${String(err)}`, pagePath));
			}
		} else if (name === "Canvas" || name === "FixedPage" || name.endsWith(".RenderTransform") || name.endsWith(".Resources")) {}
		if (name === "Path" && mode.overlays) {
			const imageBrush = findPropertyBrush(el, "Fill", "ImageBrush");
			const imageSource = imageBrush ? getAttr(imageBrush, "ImageSource") : void 0;
			if (imageBrush && imageSource) try {
				await this.drawImageBrush(ctx, pagePath, imageSource, composed, ownOpacity, el, imageBrush);
				commands++;
			} catch (err) {
				warnings.push(diag("warning", "XPS_IMAGEBRUSH_FAILED", `Failed to draw ImageBrush ${imageSource}: ${String(err)}`, pagePath));
			}
		}
		for (const child of childElements(el)) {
			if (localName(child).includes(".")) continue;
			commands += await this.renderElementToCanvas(child, ctx, pagePath, composed, ownOpacity, warnings, mode, options, runtime);
		}
		return commands;
	}
	renderElementToWasm(el, matrix, opacity, warnings, options, runtime) {
		if (!this.wasm) return 0;
		const name = localName(el);
		const composed = multiplyMatrix(matrix, elementMatrix(el));
		const ownOpacity = opacity * parseOpacity(getAttr(el, "Opacity"));
		let commands = 0;
		if (name === "Path") {
			const path = extractPathCommands(el);
			if (path.length > 0) {
				const fill = extractBrush(el, "Fill", ownOpacity);
				const stroke = extractBrush(el, "Stroke", ownOpacity);
				const thickness = Number(getAttr(el, "StrokeThickness") ?? 1);
				const screenThickness = adaptiveStrokeUserWidth(thickness, composed, options, runtime) * Math.max(1e-12, Math.hypot(composed.a, composed.b));
				const subs = flattenPath(path, .5);
				if (fill) {
					for (const sub of subs) if (sub.closed || sub.points.length >= 6) this.wasm.drawPolygon(sub.points, composed, fill);
				}
				if (stroke && thickness > 0) for (const sub of subs) this.wasm.drawPolyline(sub.points, composed, stroke, screenThickness);
				commands++;
			}
		}
		for (const child of childElements(el)) {
			if (localName(child).includes(".")) continue;
			commands += this.renderElementToWasm(child, composed, ownOpacity, warnings, options, runtime);
		}
		return commands;
	}
	async drawGlyphs(ctx, pagePath, el, matrix, opacity, warnings, options, runtime) {
		const text = getAttr(el, "UnicodeString") ?? "";
		if (!text) return 0;
		const x = Number(getAttr(el, "OriginX") ?? 0);
		const y = Number(getAttr(el, "OriginY") ?? 0);
		const size = Number(getAttr(el, "FontRenderingEmSize") ?? 12);
		if (!shouldDrawTextByPixelSize(size, matrix, options, runtime)) return 0;
		const fill = extractBrush(el, "Fill", opacity) ?? "#000000";
		const family = await this.fontFamilyForGlyphs(pagePath, el, warnings) ?? "sans-serif";
		ctx.save();
		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
		ctx.globalAlpha = opacity;
		ctx.fillStyle = fill;
		ctx.font = `${size}px "${family}"`;
		ctx.textBaseline = "alphabetic";
		const indices = getAttr(el, "Indices");
		if (indices) drawGlyphRunWithIndices(ctx, text, indices, x, y, size);
		else ctx.fillText(text, x, y);
		ctx.restore();
		return 1;
	}
	async fontFamilyForGlyphs(pagePath, el, warnings) {
		const uri = getAttr(el, "FontUri");
		if (!uri) return void 0;
		const part = resolvePart(pagePath, uri.replace(/^\//, ""));
		let cached = this.fontCache.get(part);
		if (!cached) {
			cached = this.loadFontFace(part).catch((err) => {
				warnings.push(diag("warning", "XPS_FONT_LOAD_FAILED", `Failed to load embedded XPS font ${part}: ${String(err)}`, pagePath));
			});
			this.fontCache.set(part, cached);
		}
		return cached;
	}
	async loadFontFace(part) {
		const FontFaceCtor = globalThis.FontFace;
		const fontSet = document.fonts;
		if (!FontFaceCtor || !fontSet) return void 0;
		let bytes = await this.document.opc.readBytes(part);
		let mime = mimeFromPath(part) ?? "font/ttf";
		if (/\.odttf$/i.test(part)) {
			bytes = deobfuscateOdttf(part, bytes);
			mime = "font/ttf";
		}
		const family = `dwfv_xps_${hashString(part)}`;
		const blob = new Blob([bytes], { type: mime });
		const url = URL.createObjectURL(blob);
		const face = new FontFaceCtor(family, `url("${url}")`);
		try {
			await face.load();
			fontSet.add(face);
			URL.revokeObjectURL(url);
			return family;
		} catch (err) {
			URL.revokeObjectURL(url);
			throw err;
		}
	}
	async drawImageResource(ctx, pagePath, source, matrix, opacity, el) {
		const opc = this.document.opc;
		const src = resolvePart(pagePath, source.replace(/^\//, ""));
		const image = await blobToImage(await opc.readBytes(src), opc.getContentType(src) ?? mimeFromPath(src) ?? "image/png");
		const width = Number(getAttr(el, "Width") ?? ("width" in image ? image.width : 0));
		const height = Number(getAttr(el, "Height") ?? ("height" in image ? image.height : 0));
		const x = Number(getAttr(el, "Canvas.Left") ?? getAttr(el, "X") ?? 0);
		const y = Number(getAttr(el, "Canvas.Top") ?? getAttr(el, "Y") ?? 0);
		ctx.save();
		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
		ctx.globalAlpha = opacity;
		ctx.drawImage(image, x, y, width || image.width, height || image.height);
		ctx.restore();
	}
	async drawImageBrush(ctx, pagePath, source, matrix, opacity, pathEl, brushEl) {
		const opc = this.document.opc;
		const src = resolvePart(pagePath, source.replace(/^\//, ""));
		const image = await blobToImage(await opc.readBytes(src), opc.getContentType(src) ?? mimeFromPath(src) ?? "image/png");
		const viewport = parseRect(getAttr(brushEl, "Viewport")) ?? parseRect(getAttr(brushEl, "Viewbox")) ?? [
			0,
			0,
			Number(image.width ?? 1),
			Number(image.height ?? 1)
		];
		const path = extractPathCommands(pathEl);
		ctx.save();
		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
		ctx.globalAlpha = opacity;
		if (path.length > 0) {
			ctx.beginPath();
			applyPathToCanvas(ctx, path);
			ctx.clip();
		}
		ctx.drawImage(image, viewport[0], viewport[1], viewport[2], viewport[3]);
		ctx.restore();
	}
};
function applyStrokeStyle(ctx, el, userLineWidth) {
	const start = (getAttr(el, "StrokeStartLineCap") ?? "").toLowerCase();
	const end = (getAttr(el, "StrokeEndLineCap") ?? "").toLowerCase();
	const dashCap = (getAttr(el, "StrokeDashCap") ?? "").toLowerCase();
	if (start === "round" || end === "round" || dashCap === "round") ctx.lineCap = "round";
	else if (start === "square" || end === "square" || dashCap === "square") ctx.lineCap = "square";
	else ctx.lineCap = "butt";
	const join = (getAttr(el, "StrokeLineJoin") ?? "").toLowerCase();
	ctx.lineJoin = join === "round" ? "round" : join === "bevel" ? "bevel" : "miter";
	const miter = Number(getAttr(el, "StrokeMiterLimit") ?? 10);
	if (Number.isFinite(miter) && miter > 0) ctx.miterLimit = miter;
	const dash = parseNumberList(getAttr(el, "StrokeDashArray") ?? "");
	if (dash.length > 0) {
		const offset = Number(getAttr(el, "StrokeDashOffset") ?? 0);
		ctx.setLineDash(dash.map((v) => Math.max(0, v * userLineWidth)));
		ctx.lineDashOffset = Number.isFinite(offset) ? offset * userLineWidth : 0;
	} else {
		ctx.setLineDash([]);
		ctx.lineDashOffset = 0;
	}
}
function pathBounds(commands) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const add = (x, y) => {
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	};
	for (const c of commands) if (c.type === "M" || c.type === "L") add(c.x, c.y);
	else if (c.type === "C") {
		add(c.x1, c.y1);
		add(c.x2, c.y2);
		add(c.x, c.y);
	} else if (c.type === "Q") {
		add(c.x1, c.y1);
		add(c.x, c.y);
	} else if (c.type === "A") {
		add(c.x - c.rx, c.y - c.ry);
		add(c.x + c.rx, c.y + c.ry);
	}
	return Number.isFinite(minX) ? {
		minX,
		minY,
		maxX,
		maxY
	} : void 0;
}
function drawGlyphRunWithIndices(ctx, text, indices, x, y, emSize) {
	const specs = indices.split(";");
	let cursor = x;
	let charIndex = 0;
	for (const spec of specs) {
		const raw = spec.trim();
		if (!raw) continue;
		const parts = raw.split(",");
		const advance = Number(parts[1] ?? "");
		const dx = Number(parts[3] ?? 0);
		const dy = Number(parts[4] ?? 0);
		const ch = text[charIndex++] ?? "";
		if (ch) ctx.fillText(ch, cursor + (Number.isFinite(dx) ? dx : 0), y + (Number.isFinite(dy) ? dy : 0));
		if (Number.isFinite(advance) && advance > 0) cursor += advance * emSize / 100;
		else cursor += ctx.measureText(ch || " ").width;
	}
	if (charIndex < text.length) ctx.fillText(text.slice(charIndex), cursor, y);
}
function deobfuscateOdttf(part, bytes) {
	const guid = (part.split("/").pop() ?? "").replace(/\.odttf$/i, "").replace(/[^0-9a-fA-F]/g, "");
	if (guid.length !== 32 || bytes.length < 32) return bytes;
	const key = /* @__PURE__ */ new Uint8Array(16);
	for (let i = 0; i < 16; i++) key[i] = parseInt(guid.slice(i * 2, i * 2 + 2), 16);
	const out = new Uint8Array(bytes);
	for (let i = 0; i < Math.min(32, out.length); i++) out[i] = (out[i] ?? 0) ^ key[15 - i % 16];
	if (!looksLikeSfnt(out)) {
		const altKey = guidLittleEndianBytes(guid);
		const alt = new Uint8Array(bytes);
		for (let i = 0; i < Math.min(32, alt.length); i++) alt[i] = (alt[i] ?? 0) ^ altKey[15 - i % 16];
		if (looksLikeSfnt(alt)) return alt;
	}
	return out;
}
function guidLittleEndianBytes(hex) {
	const b = /* @__PURE__ */ new Uint8Array(16);
	const raw = /* @__PURE__ */ new Uint8Array(16);
	for (let i = 0; i < 16; i++) raw[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	b[0] = raw[3];
	b[1] = raw[2];
	b[2] = raw[1];
	b[3] = raw[0];
	b[4] = raw[5];
	b[5] = raw[4];
	b[6] = raw[7];
	b[7] = raw[6];
	for (let i = 8; i < 16; i++) b[i] = raw[i];
	return b;
}
function looksLikeSfnt(bytes) {
	if (bytes.length < 4) return false;
	const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
	return tag === "OTTO" || tag === "true" || tag === "typ1" || tag === "ttcf" || bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0;
}
function hashString(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(36);
}
function elementMatrix(el) {
	let m = parseMatrix(getAttr(el, "RenderTransform") ?? getAttr(el, "Transform"));
	for (const child of childElements(el)) {
		const name = localName(child);
		if (name.endsWith(".RenderTransform") || name.endsWith(".Transform")) {
			const matrixEl = childElements(child).find((c) => localName(c) === "MatrixTransform");
			if (matrixEl) m = multiplyMatrix(m, parseMatrix(getAttr(matrixEl, "Matrix")));
		}
	}
	const left = Number(getAttr(el, "Canvas.Left") ?? 0);
	const top = Number(getAttr(el, "Canvas.Top") ?? 0);
	if (left || top) m = multiplyMatrix({
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: left,
		f: top
	}, m);
	return m;
}
function extractPathCommands(pathEl) {
	const data = getAttr(pathEl, "Data");
	if (data) return parsePathData(data);
	for (const prop of childElements(pathEl)) {
		if (localName(prop) !== "Path.Data") continue;
		for (const geom of childElements(prop)) {
			const figures = getAttr(geom, "Figures");
			if (figures) return parsePathData(figures);
			if (localName(geom) === "PathGeometry") {
				const built = buildPathGeometry(geom);
				if (built) return parsePathData(built);
			}
		}
	}
	return [];
}
function buildPathGeometry(geom) {
	const parts = [];
	for (const figure of childElements(geom).filter((e) => localName(e) === "PathFigure")) {
		const start = parseNumberList(getAttr(figure, "StartPoint") ?? "");
		if (start.length >= 2) parts.push(`M ${start[0]} ${start[1]}`);
		for (const seg of childElements(figure)) {
			const name = localName(seg);
			if (name === "LineSegment") {
				const p = parseNumberList(getAttr(seg, "Point") ?? "");
				if (p.length >= 2) parts.push(`L ${p[0]} ${p[1]}`);
			} else if (name === "PolyLineSegment") {
				const nums = parseNumberList(getAttr(seg, "Points") ?? "");
				for (let i = 0; i + 1 < nums.length; i += 2) parts.push(`L ${nums[i]} ${nums[i + 1]}`);
			} else if (name === "BezierSegment") {
				const nums = parseNumberList(getAttr(seg, "Point1") + " " + getAttr(seg, "Point2") + " " + getAttr(seg, "Point3"));
				if (nums.length >= 6) parts.push(`C ${nums.slice(0, 6).join(" ")}`);
			} else if (name === "PolyBezierSegment") {
				const nums = parseNumberList(getAttr(seg, "Points") ?? "");
				for (let i = 0; i + 5 < nums.length; i += 6) parts.push(`C ${nums.slice(i, i + 6).join(" ")}`);
			}
		}
		if (getAttr(figure, "IsClosed") === "true") parts.push("Z");
	}
	return parts.length ? parts.join(" ") : void 0;
}
function extractBrush(el, prop, opacity) {
	const direct = getAttr(el, prop);
	if (direct) return parseBrushColor(direct, opacity);
	const solid = findPropertyBrush(el, prop, "SolidColorBrush");
	if (solid) return parseBrushColor(getAttr(solid, "Color"), opacity * parseOpacity(getAttr(solid, "Opacity")));
}
function findPropertyBrush(el, prop, brushLocalName) {
	const propName = `${localName(el)}.${prop}`;
	for (const child of childElements(el)) {
		if (localName(child) !== propName) continue;
		return childElements(child).find((c) => localName(c) === brushLocalName);
	}
}
function parseOpacity(value) {
	if (!value) return 1;
	const n = Number(value);
	return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
}
function fillRule(el) {
	const data = getAttr(el, "Data") ?? "";
	return /F0/.test(data) ? "nonzero" : "evenodd";
}
function parseRect(s) {
	if (!s) return void 0;
	const nums = parseNumberList(s);
	if (nums.length >= 4) return [
		nums[0],
		nums[1],
		nums[2],
		nums[3]
	];
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/WebGlW2dBackend.js
var VERTEX_STRIDE = 12;
var DEFAULT_MAX_GPU_CACHE_BYTES = 100663296;
var DEFAULT_MAX_CACHED_SCENES = 3;
var WebGlW2dBackend = class {
	constructor(canvas) {
		this.scenes = /* @__PURE__ */ new Map();
		this.gpuBytes = 0;
		this.tick = 0;
		this.canvas = canvas ?? document.createElement("canvas");
		const gl = this.canvas.getContext("webgl", {
			alpha: false,
			antialias: true,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: true,
			powerPreference: "high-performance"
		});
		if (!gl) throw new Error("WebGLRenderingContext is not available.");
		this.gl = gl;
		this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
		this.aPos = gl.getAttribLocation(this.program, "a_pos");
		this.aColor = gl.getAttribLocation(this.program, "a_color");
		const matrix = gl.getUniformLocation(this.program, "u_matrix");
		const viewport = gl.getUniformLocation(this.program, "u_viewport");
		if (this.aPos < 0 || this.aColor < 0 || !matrix || !viewport) throw new Error("Failed to resolve WebGL shader locations.");
		this.uMatrix = matrix;
		this.uViewport = viewport;
	}
	render(page, targetCanvas, options = {}) {
		const warnings = [];
		if (targetCanvas.width <= 0 || targetCanvas.height <= 0) return {
			commands: 0,
			warnings,
			gpuBytes: this.gpuBytes,
			vertexCount: 0,
			textCount: 0,
			cacheHit: true
		};
		this.resize(targetCanvas.width, targetCanvas.height);
		const pageMatrix = matrixForW2d(page, this.canvas.width, this.canvas.height, options.zoom, options.panX, options.panY);
		const runtime = {
			dpr: canvasDpr(targetCanvas),
			zoom: options.zoom ?? 1
		};
		const key = sceneKey(page, pageMatrix, options);
		let scene = this.scenes.get(key);
		const cacheHit = !!scene;
		if (!scene) {
			scene = this.compileScene(page, key, options, pageMatrix, runtime);
			this.scenes.set(key, scene);
			this.gpuBytes += scene.gpuBytes;
			this.evictIfNeeded(options);
			scene = this.scenes.get(key) ?? scene;
		}
		scene.lastUsed = ++this.tick;
		const gl = this.gl;
		const bg = rgba01(options.background ?? "#ffffff");
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(this.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffer);
		gl.enableVertexAttribArray(this.aPos);
		gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, VERTEX_STRIDE, 0);
		gl.enableVertexAttribArray(this.aColor);
		gl.vertexAttribPointer(this.aColor, 4, gl.UNSIGNED_BYTE, true, VERTEX_STRIDE, 8);
		gl.uniform4f(this.uMatrix, pageMatrix.a, pageMatrix.b, pageMatrix.c, pageMatrix.d);
		gl.uniform4f(this.uViewport, pageMatrix.e, pageMatrix.f, this.canvas.width, this.canvas.height);
		gl.drawArrays(gl.TRIANGLES, 0, scene.vertexCount);
		const ctx = targetCanvas.getContext("2d");
		if (!ctx) throw new Error("CanvasRenderingContext2D is not available for WebGL text overlay.");
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
		if (options.compositeToTarget ?? true) ctx.drawImage(this.canvas, 0, 0);
		this.drawTextOverlay(ctx, page, pageMatrix);
		ctx.restore();
		if (scene.vertexCount === 0 && page.primitives.some((p) => p.type !== "text")) warnings.push(diag("warning", "WEBGL_EMPTY_SCENE", "WebGL scene contained no drawable geometry; Canvas/WASM fallback may be required.", page.sourcePath));
		return {
			commands: scene.primitiveCount,
			warnings,
			gpuBytes: this.gpuBytes,
			vertexCount: scene.vertexCount,
			textCount: scene.textCount,
			cacheHit
		};
	}
	dispose() {
		for (const scene of this.scenes.values()) this.gl.deleteBuffer(scene.buffer);
		this.scenes.clear();
		this.gpuBytes = 0;
	}
	resize(width, height) {
		if (this.canvas.width !== width || this.canvas.height !== height) {
			this.canvas.width = width;
			this.canvas.height = height;
		}
	}
	compileScene(page, key, options, pageMatrix, runtime) {
		const writer = new VertexWriter();
		let primitiveCount = 0;
		let textCount = 0;
		for (const p of page.primitives) {
			if (p.type === "text") {
				textCount++;
				continue;
			}
			primitiveCount++;
			appendPrimitive(writer, p, pageMatrix, options, runtime);
		}
		const bufferBytes = writer.byteLength;
		const maxBytes = options.maxGpuCacheBytes ?? DEFAULT_MAX_GPU_CACHE_BYTES;
		if (bufferBytes > maxBytes) throw new Error(`WebGL scene buffer would require ${formatBytes$1(bufferBytes)}, exceeding maxGpuCacheBytes=${formatBytes$1(maxBytes)}.`);
		const gl = this.gl;
		const buffer = gl.createBuffer();
		if (!buffer) throw new Error("Failed to allocate WebGLBuffer.");
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, writer.toArrayBuffer(), gl.STATIC_DRAW);
		const err = gl.getError();
		if (err !== gl.NO_ERROR) {
			gl.deleteBuffer(buffer);
			throw new Error(`WebGL buffer upload failed: 0x${err.toString(16)}.`);
		}
		return {
			key,
			buffer,
			vertexCount: writer.vertexCount,
			gpuBytes: bufferBytes,
			primitiveCount,
			textCount,
			lastUsed: ++this.tick
		};
	}
	evictIfNeeded(options) {
		const maxBytes = options.maxGpuCacheBytes ?? DEFAULT_MAX_GPU_CACHE_BYTES;
		const maxScenes = options.maxCachedScenes ?? DEFAULT_MAX_CACHED_SCENES;
		while (this.scenes.size > Math.max(1, maxScenes) || this.gpuBytes > maxBytes) {
			let oldest;
			for (const scene of this.scenes.values()) if (!oldest || scene.lastUsed < oldest.lastUsed) oldest = scene;
			if (!oldest) break;
			this.scenes.delete(oldest.key);
			this.gl.deleteBuffer(oldest.buffer);
			this.gpuBytes -= oldest.gpuBytes;
		}
	}
	drawTextOverlay(ctx, page, pageMatrix) {
		const canvasW = this.canvas.width;
		const canvasH = this.canvas.height;
		for (const p of page.primitives) {
			if (p.type !== "text") continue;
			const matrix = multiplyMatrix(pageMatrix, p.matrix ?? IDENTITY_MATRIX);
			const [x, y] = transformPoint(matrix, p.x, p.y);
			const scale = estimateScale$1(matrix);
			const screenSize = Math.max(2, Math.min(768, Math.abs((p.size ?? 12) * scale)));
			if (screenSize < 2.5) continue;
			const lines = p.text.split(/\n/);
			const longest = lines.reduce((m, line) => Math.max(m, line.length), 0);
			const roughWidth = Math.max(24, longest * screenSize * .65);
			const roughHeight = Math.max(screenSize, lines.length * screenSize * 1.15);
			if (x + roughWidth < -64 || x > canvasW + 64 || y + roughHeight < -64 || y - roughHeight > canvasH + 64) continue;
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.fillStyle = p.fill ?? p.stroke ?? "#000000";
			ctx.font = `${screenSize}px sans-serif`;
			ctx.textBaseline = "alphabetic";
			for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i] ?? "", x, y + i * screenSize * 1.15);
			ctx.restore();
		}
	}
};
var IDENTITY_MATRIX = {
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
};
function sceneKey(page, pageMatrix, options) {
	const mode = options.lineWeightMode ?? "adaptive";
	const scaleBucket = mode === "physical" ? "physical" : String(Math.round(Math.log2(Math.max(1e-12, estimateMatrixScale(pageMatrix))) * 8));
	return `${page.id}|${page.sourcePath}|${page.primitives.length}|lw:${mode}:${scaleBucket}`;
}
var VertexWriter = class {
	constructor() {
		this.buffer = /* @__PURE__ */ new ArrayBuffer(65536);
		this.view = new DataView(this.buffer);
		this.vertexCount = 0;
	}
	get byteLength() {
		return this.vertexCount * VERTEX_STRIDE;
	}
	push(x, y, color) {
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;
		const offset = this.byteLength;
		this.ensure(VERTEX_STRIDE);
		this.view.setFloat32(offset, x, true);
		this.view.setFloat32(offset + 4, y, true);
		this.view.setUint8(offset + 8, color.r);
		this.view.setUint8(offset + 9, color.g);
		this.view.setUint8(offset + 10, color.b);
		this.view.setUint8(offset + 11, color.a);
		this.vertexCount++;
	}
	toArrayBuffer() {
		return this.buffer.slice(0, this.byteLength);
	}
	ensure(extraBytes) {
		const needed = this.byteLength + extraBytes;
		if (needed <= this.buffer.byteLength) return;
		let next = this.buffer.byteLength;
		while (next < needed) next *= 2;
		const newBuffer = new ArrayBuffer(next);
		new Uint8Array(newBuffer).set(new Uint8Array(this.buffer, 0, this.byteLength));
		this.buffer = newBuffer;
		this.view = new DataView(this.buffer);
	}
};
function appendPrimitive(writer, p, pageMatrix, options, runtime) {
	const m = p.matrix ?? IDENTITY_MATRIX;
	const matrixScale = estimateScale$1(m);
	const fullMatrix = multiplyMatrix(pageMatrix, m);
	const lineWidth = Math.max(.01, adaptiveStrokeUserWidth(p.lineWidth ?? 1, fullMatrix, options, runtime) * matrixScale);
	if (p.type === "polyline") {
		const color = rgbaBytes(p.stroke ?? "#000000");
		appendPolyline(writer, transformPointsArray(p.points, m), lineWidth, color);
	} else if (p.type === "polygon") {
		const pts = transformPointsArray(p.points, m);
		if (p.fill) appendPolygonFan(writer, pts, rgbaBytes(p.fill));
		if (p.stroke) appendPolyline(writer, closePoints$1(pts), lineWidth, rgbaBytes(p.stroke));
	} else if (p.type === "rect") {
		const pts = transformPointsArray([
			p.x,
			p.y,
			p.x + p.width,
			p.y,
			p.x + p.width,
			p.y + p.height,
			p.x,
			p.y + p.height
		], m);
		if (p.fill) appendPolygonFan(writer, pts, rgbaBytes(p.fill));
		if (p.stroke) appendPolyline(writer, closePoints$1(pts), lineWidth, rgbaBytes(p.stroke));
	} else if (p.type === "path") {
		const subs = flattenPath(p.commands, .5);
		const fill = p.fill ? rgbaBytes(p.fill) : void 0;
		const stroke = p.stroke ? rgbaBytes(p.stroke) : void 0;
		for (const sub of subs) {
			const pts = transformPointsArray(sub.points, m);
			if (fill && (sub.closed || pts.length >= 6)) appendPolygonFan(writer, pts, fill);
			if (stroke) appendPolyline(writer, pts, lineWidth, stroke);
		}
	}
}
function transformPointsArray(points, m) {
	const out = [];
	for (let i = 0; i + 1 < points.length; i += 2) {
		const [x, y] = transformPoint(m, points[i] ?? 0, points[i + 1] ?? 0);
		out.push({
			x,
			y
		});
	}
	return out;
}
function appendPolygonFan(writer, pts, color) {
	if (pts.length < 3) return;
	const p0 = pts[0];
	for (let i = 1; i + 1 < pts.length; i++) {
		const p1 = pts[i];
		const p2 = pts[i + 1];
		if (triangleAreaAbs(p0, p1, p2) < 1e-6) continue;
		writer.push(p0.x, p0.y, color);
		writer.push(p1.x, p1.y, color);
		writer.push(p2.x, p2.y, color);
	}
}
function appendPolyline(writer, pts, width, color) {
	if (pts.length < 2) return;
	const half = Math.max(.05, width * .5);
	for (let i = 0; i + 1 < pts.length; i++) appendLineSegment(writer, pts[i], pts[i + 1], half, color);
}
function appendLineSegment(writer, p0, p1, half, color) {
	const dx = p1.x - p0.x;
	const dy = p1.y - p0.y;
	const len = Math.hypot(dx, dy);
	if (len <= 1e-9) return;
	const nx = -dy / len * half;
	const ny = dx / len * half;
	const ax = p0.x + nx, ay = p0.y + ny;
	const bx = p0.x - nx, by = p0.y - ny;
	const cx = p1.x - nx, cy = p1.y - ny;
	const dx2 = p1.x + nx, dy2 = p1.y + ny;
	writer.push(ax, ay, color);
	writer.push(bx, by, color);
	writer.push(cx, cy, color);
	writer.push(ax, ay, color);
	writer.push(cx, cy, color);
	writer.push(dx2, dy2, color);
}
function closePoints$1(pts) {
	if (pts.length < 2) return pts;
	const first = pts[0];
	const last = pts[pts.length - 1];
	if (first.x === last.x && first.y === last.y) return pts;
	return [...pts, {
		x: first.x,
		y: first.y
	}];
}
function triangleAreaAbs(a, b, c) {
	return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}
function estimateScale$1(m) {
	const sx = Math.hypot(m.a, m.b);
	const sy = Math.hypot(m.c, m.d);
	return Math.max(1e-9, (sx + sy) * .5);
}
function rgbaBytes(css) {
	const packed = colorToRgba32(css, 4278190080);
	return {
		r: packed & 255,
		g: packed >>> 8 & 255,
		b: packed >>> 16 & 255,
		a: packed >>> 24 & 255
	};
}
function rgba01(css) {
	const c = rgbaBytes(css);
	return [
		c.r / 255,
		c.g / 255,
		c.b / 255,
		c.a / 255
	];
}
function formatBytes$1(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}
function createProgram(gl, vertexSource, fragmentSource) {
	const vertex = compileShader$1(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compileShader$1(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	if (!program) throw new Error("Failed to create WebGLProgram.");
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program) ?? "unknown link error";
		gl.deleteProgram(program);
		throw new Error(`WebGL program link failed: ${log}`);
	}
	return program;
}
function compileShader$1(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("Failed to create WebGLShader.");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader) ?? "unknown shader compile error";
		gl.deleteShader(shader);
		throw new Error(`WebGL shader compile failed: ${log}`);
	}
	return shader;
}
var VERTEX_SHADER = `
attribute vec2 a_pos;
attribute vec4 a_color;
uniform vec4 u_matrix;
uniform vec4 u_viewport;
varying vec4 v_color;
void main() {
  float x = u_matrix.x * a_pos.x + u_matrix.z * a_pos.y + u_viewport.x;
  float y = u_matrix.y * a_pos.x + u_matrix.w * a_pos.y + u_viewport.y;
  vec2 clip = vec2((x / u_viewport.z) * 2.0 - 1.0, 1.0 - (y / u_viewport.w) * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_color = a_color;
}
`;
var FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/W2dRenderer.js
var W2dRenderer = class {
	async render(page, canvas, options = {}) {
		const warnings = actionableDiagnostics(page.diagnostics);
		const bg = options.background ?? "#ffffff";
		if (options.preferWebgl ?? true) try {
			const backend = this.getWebGlBackend(options.webglCanvas);
			if (options.webglCanvas) options.webglCanvas.style.visibility = "visible";
			const stats = backend.render(page, canvas, {
				...options,
				compositeToTarget: !options.webglCanvas
			});
			const mem = formatBytes(stats.gpuBytes);
			const cacheText = stats.cacheHit ? "cache hit" : "cache upload";
			warnings.push(diag("info", "WEBGL_W2D_RENDERED", `WebGL rendered ${stats.vertexCount} vertices, ${stats.textCount} text item(s), GPU cache ${mem}, ${cacheText}.`, page.sourcePath));
			warnings.push(...stats.warnings);
			return {
				backend: "webgl",
				commands: stats.commands,
				warnings
			};
		} catch (err) {
			warnings.push(diag("warning", "WEBGL_BACKEND_FALLBACK", `WebGL vector path failed, falling back to ${options.preferWasm ? "WASM raster" : "Canvas2D"}: ${String(err)}`, page.sourcePath));
		}
		if (options.webglCanvas) options.webglCanvas.style.visibility = "hidden";
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("CanvasRenderingContext2D is not available.");
		const pageMatrix = matrixForW2d(page, canvas.width, canvas.height, options.zoom, options.panX, options.panY);
		const runtime = {
			dpr: canvasDpr(canvas),
			zoom: options.zoom ?? 1
		};
		let commands = 0;
		if (options.preferWasm) try {
			this.wasm ?? (this.wasm = new WasmRasterBackend({ wasmUrl: options.wasmUrl }));
			await this.wasm.init();
			this.wasm.begin(canvas.width, canvas.height, bg);
			for (const p of page.primitives) commands += this.drawPrimitiveWasm(p, pageMatrix, options, runtime);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.putImageData(this.wasm.toImageData(), 0, 0);
			for (const p of page.primitives.filter((p) => p.type === "text")) commands += this.drawPrimitiveCanvas(ctx, p, pageMatrix, options, runtime);
			return {
				backend: "wasm-raster",
				commands,
				warnings
			};
		} catch (err) {
			warnings.push(diag("warning", "WASM_BACKEND_FALLBACK", `WASM raster path failed, falling back to Canvas2D: ${String(err)}`, page.sourcePath));
		}
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
		for (const p of page.primitives) commands += this.drawPrimitiveCanvas(ctx, p, pageMatrix, options, runtime);
		return {
			backend: "canvas2d",
			commands,
			warnings
		};
	}
	dispose() {
		this.webgl?.dispose();
		this.webgl = void 0;
		this.webglCanvas = void 0;
	}
	getWebGlBackend(canvas) {
		if (!this.webgl || this.webglCanvas !== canvas) {
			this.webgl?.dispose();
			this.webgl = new WebGlW2dBackend(canvas);
			this.webglCanvas = canvas;
		}
		return this.webgl;
	}
	drawPrimitiveCanvas(ctx, p, pageMatrix, options, runtime) {
		const matrix = multiplyMatrix(pageMatrix, p.matrix ?? {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: 0,
			f: 0
		});
		const stroke = parseBrushColor(p.stroke ?? "#000000") ?? "#000000";
		const fill = parseBrushColor(p.fill);
		if (p.type === "text") {
			const [x, y] = transformPoint(matrix, p.x, p.y);
			const screenSize = Math.max(1, Math.abs((p.size ?? 12) * estimateScale(matrix)));
			if (!shouldDrawTextByPixelSize(p.size ?? 12, matrix, options, runtime) || x > ctx.canvas.width + 64 || y > ctx.canvas.height + 64 || x < -ctx.canvas.width || y < -ctx.canvas.height) return 0;
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.fillStyle = fill ?? stroke;
			ctx.font = `${Math.min(768, screenSize)}px sans-serif`;
			ctx.textBaseline = "alphabetic";
			for (const [i, line] of p.text.split(/\n/).entries()) ctx.fillText(line, x, y + i * screenSize * 1.15);
			ctx.restore();
			return 1;
		}
		ctx.save();
		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
		ctx.lineWidth = adaptiveStrokeUserWidth(p.lineWidth ?? 1, matrix, options, runtime);
		if (p.type === "polyline") {
			if (p.points.length >= 4) {
				ctx.beginPath();
				ctx.moveTo(p.points[0], p.points[1]);
				for (let i = 2; i + 1 < p.points.length; i += 2) ctx.lineTo(p.points[i], p.points[i + 1]);
				ctx.strokeStyle = stroke;
				ctx.stroke();
			}
		} else if (p.type === "polygon") {
			if (p.points.length >= 6) {
				ctx.beginPath();
				ctx.moveTo(p.points[0], p.points[1]);
				for (let i = 2; i + 1 < p.points.length; i += 2) ctx.lineTo(p.points[i], p.points[i + 1]);
				ctx.closePath();
				if (fill) {
					ctx.fillStyle = fill;
					ctx.fill();
				}
				if (p.stroke) {
					ctx.strokeStyle = stroke;
					ctx.stroke();
				}
			}
		} else if (p.type === "rect") {
			if (fill) {
				ctx.fillStyle = fill;
				ctx.fillRect(p.x, p.y, p.width, p.height);
			}
			if (p.stroke) {
				ctx.strokeStyle = stroke;
				ctx.strokeRect(p.x, p.y, p.width, p.height);
			}
		} else if (p.type === "path") {
			ctx.beginPath();
			applyPathToCanvas(ctx, p.commands);
			if (fill) {
				ctx.fillStyle = fill;
				ctx.fill();
			}
			if (p.stroke) {
				ctx.strokeStyle = stroke;
				ctx.stroke();
			}
		}
		ctx.restore();
		return 1;
	}
	drawPrimitiveWasm(p, pageMatrix, options, runtime) {
		if (!this.wasm || p.type === "text") return 0;
		const matrix = multiplyMatrix(pageMatrix, p.matrix ?? {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: 0,
			f: 0
		});
		const scale = estimateMatrixScale(matrix);
		const screenStroke = (w) => adaptiveStrokeUserWidth(w ?? 1, matrix, options, runtime) * scale;
		if (p.type === "polyline") this.wasm.drawPolyline(p.points, matrix, parseBrushColor(p.stroke ?? "#000000"), screenStroke(p.lineWidth));
		else if (p.type === "polygon") {
			this.wasm.drawPolygon(p.points, matrix, parseBrushColor(p.fill));
			if (p.stroke) this.wasm.drawPolyline(closePoints(p.points), matrix, parseBrushColor(p.stroke), screenStroke(p.lineWidth));
		} else if (p.type === "rect") {
			const pts = [
				p.x,
				p.y,
				p.x + p.width,
				p.y,
				p.x + p.width,
				p.y + p.height,
				p.x,
				p.y + p.height,
				p.x,
				p.y
			];
			if (p.fill) this.wasm.drawPolygon(pts, matrix, parseBrushColor(p.fill));
			if (p.stroke) this.wasm.drawPolyline(pts, matrix, parseBrushColor(p.stroke), screenStroke(p.lineWidth));
		} else if (p.type === "path") {
			const subs = flattenPath(p.commands, .5);
			const fill = parseBrushColor(p.fill);
			const stroke = parseBrushColor(p.stroke);
			if (fill) {
				for (const s of subs) if (s.closed || s.points.length >= 6) this.wasm.drawPolygon(s.points, matrix, fill);
			}
			if (stroke) for (const s of subs) this.wasm.drawPolyline(s.points, matrix, stroke, screenStroke(p.lineWidth));
		}
		return 1;
	}
};
function closePoints(points) {
	if (points.length < 4) return points;
	const x0 = points[0], y0 = points[1];
	const xn = points[points.length - 2], yn = points[points.length - 1];
	return x0 === xn && y0 === yn ? points : [
		...points,
		x0,
		y0
	];
}
function estimateScale(m) {
	return Math.max(1e-9, (Math.hypot(m.a, m.b) + Math.hypot(m.c, m.d)) * .5);
}
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/ThreeW3dRenderer.js
var ThreeW3dRenderer = class {
	constructor() {
		this.cache = /* @__PURE__ */ new Map();
	}
	async render(page, overlayCanvas, options = {}) {
		const canvas = options.webglCanvas ?? overlayCanvas;
		if (options.webglCanvas) options.webglCanvas.style.visibility = "visible";
		clearOverlay(overlayCanvas);
		const gl = this.ensureContext(canvas);
		const program = this.ensureProgram(gl);
		const edgeProgram = this.ensureEdgeProgram(gl);
		const scene = this.ensureScene(gl, page);
		this.evictScenes(gl, options.maxCachedScenes ?? 2, options.maxGpuCacheBytes ?? 167772160);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.clearColor(.97, .98, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.useProgram(program.program);
		const camera = makeCamera(page, canvas, options);
		gl.uniformMatrix4fv(program.uMvp, false, camera.mvp);
		gl.uniformMatrix4fv(program.uModel, false, identity4());
		gl.uniform3f(program.uLight0, .35, .65, .68);
		gl.uniform3f(program.uLight1, -.75, .4, -.5);
		gl.uniform1f(program.uAmbient, .28);
		let drawCalls = 0;
		gl.enable(gl.POLYGON_OFFSET_FILL);
		gl.polygonOffset(1, 1);
		for (const gm of scene.meshes) {
			const color = gm.mesh.color ?? [
				.72,
				.74,
				.78
			];
			gl.uniform3f(program.uColor, color[0], color[1], color[2]);
			if (gm.vao && "bindVertexArray" in gl) gl.bindVertexArray(gm.vao);
			else bindMesh(gl, program, gm);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gm.index);
			gl.drawElements(gl.TRIANGLES, gm.indexCount, gm.indexType, 0);
			drawCalls++;
		}
		gl.disable(gl.POLYGON_OFFSET_FILL);
		if (isWebGL2(gl)) gl.bindVertexArray(null);
		gl.useProgram(edgeProgram.program);
		gl.uniformMatrix4fv(edgeProgram.uMvp, false, camera.mvp);
		gl.uniform3f(edgeProgram.uColor, .035, .04, .045);
		gl.enable(gl.DEPTH_TEST);
		for (const gm of scene.meshes) {
			if (!gm.edgeIndex || !gm.edgeIndexCount) continue;
			gl.bindBuffer(gl.ARRAY_BUFFER, gm.pos);
			gl.enableVertexAttribArray(edgeProgram.aPosition);
			gl.vertexAttribPointer(edgeProgram.aPosition, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gm.edgeIndex);
			gl.drawElements(gl.LINES, gm.edgeIndexCount, gm.edgeIndexType ?? gm.indexType, 0);
			drawCalls++;
		}
		return {
			backend: "threejs-webgl",
			commands: drawCalls,
			warnings: actionableDiagnostics(page.diagnostics)
		};
	}
	dispose() {
		if (this.gl) for (const scene of this.cache.values()) disposeScene(this.gl, scene);
		this.cache.clear();
		this.program = void 0;
		this.edgeProgram = void 0;
	}
	ensureContext(canvas) {
		if (this.gl && this.currentCanvas === canvas) return this.gl;
		const gl = canvas.getContext("webgl2", {
			antialias: true,
			alpha: false
		}) ?? canvas.getContext("webgl", {
			antialias: true,
			alpha: false
		});
		if (!gl) throw new Error("WebGL is not available for 3D W3D rendering.");
		if (this.gl && this.currentCanvas !== canvas) {
			for (const scene of this.cache.values()) disposeScene(this.gl, scene);
			this.cache.clear();
		}
		this.gl = gl;
		this.currentCanvas = canvas;
		this.program = void 0;
		this.edgeProgram = void 0;
		return gl;
	}
	ensureProgram(gl) {
		if (this.program) return this.program;
		const program = linkProgram(gl, compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec3 a_position;
      attribute vec3 a_normal;
      uniform mat4 u_mvp;
      uniform mat4 u_model;
      varying vec3 v_normal;
      void main() {
        v_normal = normalize((u_model * vec4(a_normal, 0.0)).xyz);
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }
    `), compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 v_normal;
      uniform vec3 u_color;
      uniform vec3 u_light0;
      uniform vec3 u_light1;
      uniform float u_ambient;
      void main() {
        vec3 n = normalize(v_normal);
        float d0 = max(dot(n, normalize(u_light0)), 0.0);
        float d1 = max(dot(n, normalize(u_light1)), 0.0) * 0.45;
        vec3 color = u_color * (u_ambient + d0 * 0.78 + d1);
        gl_FragColor = vec4(color, 1.0);
      }
    `));
		const info = {
			program,
			aPosition: gl.getAttribLocation(program, "a_position"),
			aNormal: gl.getAttribLocation(program, "a_normal"),
			uMvp: mustUniform(gl, program, "u_mvp"),
			uModel: mustUniform(gl, program, "u_model"),
			uColor: mustUniform(gl, program, "u_color"),
			uLight0: mustUniform(gl, program, "u_light0"),
			uLight1: mustUniform(gl, program, "u_light1"),
			uAmbient: mustUniform(gl, program, "u_ambient")
		};
		this.program = info;
		return info;
	}
	ensureEdgeProgram(gl) {
		if (this.edgeProgram) return this.edgeProgram;
		const program = linkProgram(gl, compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec3 a_position;
      uniform mat4 u_mvp;
      void main() {
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }
    `), compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform vec3 u_color;
      void main() {
        gl_FragColor = vec4(u_color, 0.9);
      }
    `));
		this.edgeProgram = {
			program,
			aPosition: gl.getAttribLocation(program, "a_position"),
			uMvp: mustUniform(gl, program, "u_mvp"),
			uColor: mustUniform(gl, program, "u_color")
		};
		return this.edgeProgram;
	}
	evictScenes(gl, maxScenes, maxBytes) {
		let bytes = Array.from(this.cache.values()).reduce((sum, s) => sum + s.bytes, 0);
		while (this.cache.size > Math.max(1, maxScenes) || bytes > maxBytes) {
			const first = this.cache.entries().next().value;
			if (!first) break;
			this.cache.delete(first[0]);
			disposeScene(gl, first[1]);
			bytes -= first[1].bytes;
		}
	}
	ensureScene(gl, page) {
		const cached = this.cache.get(page);
		if (cached) return cached;
		const meshes = [];
		let bytes = 0;
		const program = this.ensureProgram(gl);
		const hasVao = typeof gl.createVertexArray === "function";
		for (const mesh of page.model.meshes) {
			const pos = createBuffer(gl, gl.ARRAY_BUFFER, mesh.positions);
			const normals = mesh.normals ?? new Float32Array(mesh.positions.length);
			const gm = {
				mesh,
				pos,
				normal: createBuffer(gl, gl.ARRAY_BUFFER, normals),
				index: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices),
				edgeIndex: mesh.edgeIndices ? createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.edgeIndices) : void 0,
				indexType: mesh.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
				edgeIndexType: mesh.edgeIndices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
				indexCount: mesh.indices.length,
				edgeIndexCount: mesh.edgeIndices?.length,
				bytes: mesh.positions.byteLength + normals.byteLength + mesh.indices.byteLength + (mesh.edgeIndices?.byteLength ?? 0)
			};
			if ((mesh.indices instanceof Uint32Array || mesh.edgeIndices instanceof Uint32Array) && !isWebGL2(gl)) {
				if (!gl.getExtension("OES_element_index_uint")) throw new Error("This WebGL implementation does not support 32-bit element indices.");
			}
			if (hasVao) {
				const gl2 = gl;
				const vao = gl2.createVertexArray();
				gl2.bindVertexArray(vao);
				bindMesh(gl, program, gm);
				gl2.bindVertexArray(null);
				gm.vao = vao;
			}
			meshes.push(gm);
			bytes += gm.bytes;
		}
		const scene = {
			page,
			meshes,
			bytes
		};
		this.cache.set(page, scene);
		return scene;
	}
};
function disposeScene(gl, scene) {
	for (const gm of scene.meshes) {
		gl.deleteBuffer(gm.pos);
		gl.deleteBuffer(gm.normal);
		gl.deleteBuffer(gm.index);
		if (gm.edgeIndex) gl.deleteBuffer(gm.edgeIndex);
		if (gm.vao && isWebGL2(gl)) gl.deleteVertexArray(gm.vao);
	}
}
function createBuffer(gl, target, data) {
	const buf = gl.createBuffer();
	if (!buf) throw new Error("Failed to create WebGL buffer.");
	gl.bindBuffer(target, buf);
	gl.bufferData(target, data, gl.STATIC_DRAW);
	return buf;
}
function bindMesh(gl, program, gm) {
	gl.bindBuffer(gl.ARRAY_BUFFER, gm.pos);
	gl.enableVertexAttribArray(program.aPosition);
	gl.vertexAttribPointer(program.aPosition, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, gm.normal);
	gl.enableVertexAttribArray(program.aNormal);
	gl.vertexAttribPointer(program.aNormal, 3, gl.FLOAT, false, 0, 0);
}
function clearOverlay(canvas) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("Failed to create WebGL shader.");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader) ?? "unknown shader error";
		gl.deleteShader(shader);
		throw new Error(log);
	}
	return shader;
}
function linkProgram(gl, vs, fs) {
	const program = gl.createProgram();
	if (!program) throw new Error("Failed to create WebGL program.");
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program) ?? "unknown program link error";
		gl.deleteProgram(program);
		throw new Error(log);
	}
	return program;
}
function mustUniform(gl, program, name) {
	const loc = gl.getUniformLocation(program, name);
	if (!loc) throw new Error(`Missing shader uniform ${name}.`);
	return loc;
}
function makeCamera(page, canvas, options) {
	const b = page.model.bounds;
	const aspect = Math.max(1e-6, canvas.width / Math.max(1, canvas.height));
	const yaw = options.yaw ?? -.78;
	const pitch = clamp(options.pitch ?? .55, -1.45, 1.45);
	const zoom = Math.max(.05, Math.min(100, options.zoom ?? 1));
	const radius = Math.max(1e-4, b.radius);
	const distance = radius * 2.55 / zoom;
	const cp = Math.cos(pitch);
	const dir = [
		Math.sin(yaw) * cp,
		Math.sin(pitch),
		Math.cos(yaw) * cp
	];
	const baseCenter = b.center;
	const right = [
		Math.cos(yaw),
		0,
		-Math.sin(yaw)
	];
	const camUp = [
		right[1] * dir[2] - right[2] * dir[1],
		right[2] * dir[0] - right[0] * dir[2],
		right[0] * dir[1] - right[1] * dir[0]
	];
	const panScale = radius * 2 / Math.max(1, Math.min(canvas.width, canvas.height)) / Math.max(.1, zoom);
	const px = (options.panX ?? 0) * panScale;
	const py = (options.panY ?? 0) * panScale;
	const center = [
		baseCenter[0] - right[0] * px + camUp[0] * py,
		baseCenter[1] - right[1] * px + camUp[1] * py,
		baseCenter[2] - right[2] * px + camUp[2] * py
	];
	const view = lookAt([
		center[0] + dir[0] * distance,
		center[1] + dir[1] * distance,
		center[2] + dir[2] * distance
	], center, [
		0,
		1,
		0
	]);
	return { mvp: multiply4(perspective(Math.PI / 4, aspect, Math.max(.001, distance - radius * 2.2), distance + radius * 3.2), view) };
}
function identity4() {
	return new Float32Array([
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1
	]);
}
function perspective(fovy, aspect, near, far) {
	const f = 1 / Math.tan(fovy / 2);
	const nf = 1 / (near - far);
	return new Float32Array([
		f / aspect,
		0,
		0,
		0,
		0,
		f,
		0,
		0,
		0,
		0,
		(far + near) * nf,
		-1,
		0,
		0,
		2 * far * near * nf,
		0
	]);
}
function lookAt(eye, target, up) {
	let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
	let len = Math.hypot(zx, zy, zz) || 1;
	zx /= len;
	zy /= len;
	zz /= len;
	let xx = up[1] * zz - up[2] * zy;
	let xy = up[2] * zx - up[0] * zz;
	let xz = up[0] * zy - up[1] * zx;
	len = Math.hypot(xx, xy, xz) || 1;
	xx /= len;
	xy /= len;
	xz /= len;
	const yx = zy * xz - zz * xy;
	const yy = zz * xx - zx * xz;
	const yz = zx * xy - zy * xx;
	return new Float32Array([
		xx,
		yx,
		zx,
		0,
		xy,
		yy,
		zy,
		0,
		xz,
		yz,
		zz,
		0,
		-(xx * eye[0] + xy * eye[1] + xz * eye[2]),
		-(yx * eye[0] + yy * eye[1] + yz * eye[2]),
		-(zx * eye[0] + zy * eye[1] + zz * eye[2]),
		1
	]);
}
function multiply4(a, b) {
	const out = /* @__PURE__ */ new Float32Array(16);
	for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) out[col * 4 + row] = a[0 + row] * b[col * 4 + 0] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
	return out;
}
function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}
function isWebGL2(gl) {
	return typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/PageRenderer.js
var PageRenderer = class {
	constructor(document) {
		this.document = document;
	}
	async render(pageIndex, canvas, options = {}) {
		const page = this.document.pageData[pageIndex];
		if (!page) throw new Error(`Page index out of range: ${pageIndex}`);
		if (page.kind !== "w2d-text" && page.kind !== "w3d-model" && options.webglCanvas) options.webglCanvas.style.visibility = "hidden";
		if (page.kind === "xps-fixed-page") {
			this.xps ?? (this.xps = new XpsRenderer(this.document));
			return await this.xps.render(page, canvas, options);
		}
		if (page.kind === "w2d-text") {
			this.w2d ?? (this.w2d = new W2dRenderer());
			return await this.w2d.render(page, canvas, options);
		}
		if (page.kind === "w3d-model") {
			this.w3d ?? (this.w3d = new ThreeW3dRenderer());
			return await this.w3d.render(page, canvas, options);
		}
		if (page.kind === "image") return await this.renderImage(page, canvas, options);
		return this.renderUnsupported(page, canvas, options);
	}
	dispose() {
		this.xps?.dispose();
		this.w2d?.dispose();
		this.w3d?.dispose();
	}
	async renderImage(page, canvas, options) {
		const zip = this.document.zip;
		if (!zip) throw new Error("Image page requires a ZIP package.");
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("CanvasRenderingContext2D is not available.");
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = options.background ?? "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
		const image = await blobToImage(await zip.read(page.sourcePath), page.mediaType);
		const iw = "width" in image ? image.width : image.naturalWidth;
		const ih = "height" in image ? image.height : image.naturalHeight;
		const scale = Math.min(canvas.width / Math.max(1, iw), canvas.height / Math.max(1, ih)) * (options.zoom ?? 1);
		const w = iw * scale, h = ih * scale;
		const x = (canvas.width - w) / 2 + (options.panX ?? 0);
		const y = (canvas.height - h) / 2 + (options.panY ?? 0);
		ctx.drawImage(image, x, y, w, h);
		return {
			backend: "image",
			commands: 1,
			warnings: actionableDiagnostics(page.diagnostics)
		};
	}
	renderUnsupported(page, canvas, options) {
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("CanvasRenderingContext2D is not available.");
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = options.background ?? "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#111827";
		ctx.font = "16px sans-serif";
		wrapText(ctx, page.name, 32, 48, canvas.width - 64, 24);
		ctx.font = "13px sans-serif";
		ctx.fillStyle = "#92400e";
		wrapText(ctx, page.reason, 32, 88, canvas.width - 64, 20);
		ctx.restore();
		return {
			backend: "unsupported",
			commands: 0,
			warnings: [...page.diagnostics, diag("warning", "PAGE_UNSUPPORTED", page.reason, page.sourcePath)]
		};
	}
};
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
	const words = text.split(/\s+/);
	let line = "";
	for (const word of words) {
		const test = line ? `${line} ${word}` : word;
		if (ctx.measureText(test).width > maxWidth && line) {
			ctx.fillText(line, x, y);
			line = word;
			y += lineHeight;
		} else line = test;
	}
	if (line) ctx.fillText(line, x, y);
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/viewer/DwfViewerBase.js
var DwfViewer$1 = class {
	constructor(container, options = {}) {
		this.pageIndex = 0;
		this.zoom = 1;
		this.panX = 0;
		this.panY = 0;
		this.yaw = -.78;
		this.pitch = .55;
		this.rendering = false;
		this.renderAgain = false;
		this.renderRaf = 0;
		this.renderSeq = 0;
		this.currentDpr = 1;
		this.preferWebgl = options.preferWebgl ?? true;
		this.preferWasm = options.preferWasm ?? true;
		this.wasmUrl = options.wasmUrl;
		this.background = options.background ?? "#ffffff";
		this.maxDevicePixelRatio = options.maxDevicePixelRatio ?? 2;
		this.maxCanvasPixels = options.maxCanvasPixels ?? 16777216;
		this.maxGpuCacheBytes = options.maxGpuCacheBytes;
		this.maxCachedScenes = options.maxCachedScenes;
		this.lineWeightMode = options.lineWeightMode ?? "adaptive";
		this.minStrokeCssPx = options.minStrokeCssPx;
		this.maxOverviewStrokeCssPx = options.maxOverviewStrokeCssPx;
		this.minTextCssPx = options.minTextCssPx;
		this.minFilledAreaCssPx = options.minFilledAreaCssPx;
		this.root = document.createElement("div");
		this.root.className = "dwfv-root";
		const toolbar = document.createElement("div");
		toolbar.className = "dwfv-toolbar";
		this.pageSelect = document.createElement("select");
		this.zoomOutButton = button("−");
		this.zoomInButton = button("+");
		this.resetButton = button("适应");
		this.status = document.createElement("span");
		this.status.className = "dwfv-status";
		toolbar.append("页: ", this.pageSelect, this.zoomOutButton, this.zoomInButton, this.resetButton, this.status);
		const workspace = document.createElement("div");
		workspace.className = "dwfv-workspace";
		this.treePanel = document.createElement("div");
		this.treePanel.className = "dwfv-tree";
		this.treePanel.style.display = "none";
		const stage = document.createElement("div");
		stage.className = "dwfv-stage";
		this.webglCanvas = document.createElement("canvas");
		this.webglCanvas.className = "dwfv-canvas dwfv-webgl-canvas";
		this.webglCanvas.style.visibility = "hidden";
		this.canvas = document.createElement("canvas");
		this.canvas.className = "dwfv-canvas dwfv-overlay-canvas";
		this.canvas.style.touchAction = "none";
		stage.append(this.webglCanvas, this.canvas);
		workspace.append(this.treePanel, stage);
		this.root.append(toolbar, workspace);
		container.replaceChildren(this.root);
		this.pageSelect.addEventListener("change", () => {
			this.pageIndex = this.pageSelect.selectedIndex;
			this.resetView();
			this.populateModelTree();
			this.requestRender();
		});
		this.zoomOutButton.addEventListener("click", () => {
			this.zoomAtCenter(.8);
			this.requestRender();
		});
		this.zoomInButton.addEventListener("click", () => {
			this.zoomAtCenter(1.25);
			this.requestRender();
		});
		this.resetButton.addEventListener("click", () => {
			this.resetView();
			this.requestRender();
		});
		this.canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
		this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
		window.addEventListener("pointermove", (e) => this.onPointerMove(e));
		window.addEventListener("pointerup", () => {
			this.drag = void 0;
		});
		this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
		new ResizeObserver(() => this.requestRender()).observe(stage);
		this.setStatus("选择 .dwf/.dwfx 文件");
	}
	setPreferWebgl(value) {
		this.preferWebgl = value;
		this.requestRender();
	}
	setPreferWasm(value) {
		this.preferWasm = value;
		this.requestRender();
	}
	setLineWeightMode(value) {
		this.lineWeightMode = value;
		this.renderer?.dispose();
		this.requestRender();
	}
	async load(input, options = {}) {
		this.setStatus("解析文件中…");
		this.renderer?.dispose();
		this.doc = await openDwfDocument(input, { fileName: options.fileName });
		this.renderer = new PageRenderer(this.doc);
		this.pageIndex = options.pageIndex ?? 0;
		this.zoom = 1;
		this.panX = this.panY = 0;
		this.yaw = -.78;
		this.pitch = .55;
		this.preferWebgl = options.preferWebgl ?? this.preferWebgl;
		this.preferWasm = options.preferWasm ?? this.preferWasm;
		this.wasmUrl = options.wasmUrl ?? this.wasmUrl;
		this.background = options.background ?? this.background;
		this.maxGpuCacheBytes = options.maxGpuCacheBytes ?? this.maxGpuCacheBytes;
		this.maxCachedScenes = options.maxCachedScenes ?? this.maxCachedScenes;
		this.lineWeightMode = options.lineWeightMode ?? this.lineWeightMode;
		this.minStrokeCssPx = options.minStrokeCssPx ?? this.minStrokeCssPx;
		this.maxOverviewStrokeCssPx = options.maxOverviewStrokeCssPx ?? this.maxOverviewStrokeCssPx;
		this.minTextCssPx = options.minTextCssPx ?? this.minTextCssPx;
		this.minFilledAreaCssPx = options.minFilledAreaCssPx ?? this.minFilledAreaCssPx;
		this.populatePages();
		this.populateModelTree();
		await this.render();
	}
	async render() {
		if (!this.renderer || !this.doc) return void 0;
		if (this.rendering) {
			this.renderAgain = true;
			return this.pendingRender;
		}
		this.rendering = true;
		try {
			this.resizeCanvasToDisplaySize();
			const page = this.doc.pageData[this.pageIndex];
			if (!page) return void 0;
			const seq = ++this.renderSeq;
			const task = this.renderer.render(this.pageIndex, this.canvas, {
				zoom: this.zoom,
				panX: this.panX,
				panY: this.panY,
				preferWebgl: this.preferWebgl,
				preferWasm: this.preferWasm,
				wasmUrl: this.wasmUrl,
				background: this.background,
				maxGpuCacheBytes: this.maxGpuCacheBytes,
				maxCachedScenes: this.maxCachedScenes,
				webglCanvas: this.webglCanvas,
				yaw: this.yaw,
				pitch: this.pitch,
				lineWeightMode: this.lineWeightMode,
				minStrokeCssPx: this.minStrokeCssPx,
				maxOverviewStrokeCssPx: this.maxOverviewStrokeCssPx,
				minTextCssPx: this.minTextCssPx,
				minFilledAreaCssPx: this.minFilledAreaCssPx
			});
			this.pendingRender = task;
			try {
				const stats = await task;
				if (this.pendingRender === task && seq === this.renderSeq) {
					const warnCount = stats.warnings.filter((w) => w.level !== "info").length;
					const dprText = this.currentDpr > 1 ? ` · DPR ${this.currentDpr.toFixed(2)}` : "";
					this.setStatus(`${this.doc.kind.toUpperCase()} · ${page.kind} · ${stats.backend} · ${stats.commands} ops${dprText}${warnCount ? ` · ${warnCount} 警告` : ""}`, warnCount > 0);
				}
				return stats;
			} catch (err) {
				if (seq === this.renderSeq) this.setStatus(`渲染失败：${String(err)}`, true);
				throw err;
			}
		} finally {
			this.rendering = false;
			if (this.renderAgain) {
				this.renderAgain = false;
				this.requestRender();
			}
		}
	}
	getDocument() {
		return this.doc;
	}
	fit() {
		this.resetView();
		this.requestRender();
	}
	dispose() {
		if (this.renderRaf) cancelAnimationFrame(this.renderRaf);
		this.renderRaf = 0;
		this.renderer?.dispose();
		this.renderer = void 0;
		this.doc = void 0;
		this.root.replaceChildren();
	}
	requestRender() {
		if (this.renderRaf) return;
		this.renderRaf = requestAnimationFrame(() => {
			this.renderRaf = 0;
			this.render();
		});
	}
	populatePages() {
		this.pageSelect.replaceChildren();
		const pages = this.doc?.pageData ?? [];
		for (const [i, p] of pages.entries()) {
			const opt = document.createElement("option");
			opt.value = String(i);
			opt.textContent = `${i + 1}. ${p.name} (${p.kind})`;
			this.pageSelect.append(opt);
		}
		this.pageSelect.selectedIndex = Math.max(0, Math.min(this.pageIndex, pages.length - 1));
	}
	populateModelTree() {
		const page = this.doc?.pageData[this.pageIndex];
		if (!page || page.kind !== "w3d-model" || !page.model.sceneTree?.length) {
			this.treePanel.style.display = "none";
			this.treePanel.replaceChildren();
			return;
		}
		this.treePanel.style.display = "";
		const header = document.createElement("div");
		header.className = "dwfv-tree-header";
		header.textContent = `模型结构 · ${page.model.stats.nodeCount ?? 0} 节点`;
		const stats = document.createElement("div");
		stats.className = "dwfv-tree-stats";
		stats.textContent = `${page.model.stats.meshCount} meshes · ${page.model.stats.triangleCount} triangles · ${page.model.stats.textureCount ?? 0} textures`;
		const content = document.createElement("div");
		content.className = "dwfv-tree-content";
		for (const node of page.model.sceneTree) content.append(renderTreeNode(node));
		this.treePanel.replaceChildren(header, stats, content);
	}
	resizeCanvasToDisplaySize() {
		const rect = this.canvas.getBoundingClientRect();
		const cssW = Math.max(1, rect.width);
		const cssH = Math.max(1, rect.height);
		let dpr = Math.max(1, Math.min(this.maxDevicePixelRatio, window.devicePixelRatio || 1));
		const pixels = cssW * cssH * dpr * dpr;
		if (pixels > this.maxCanvasPixels) dpr *= Math.sqrt(this.maxCanvasPixels / pixels);
		this.currentDpr = dpr;
		const w = Math.max(1, Math.floor(cssW * dpr));
		const h = Math.max(1, Math.floor(cssH * dpr));
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
		}
		if (this.webglCanvas.width !== w || this.webglCanvas.height !== h) {
			this.webglCanvas.width = w;
			this.webglCanvas.height = h;
		}
	}
	resetView() {
		this.zoom = 1;
		this.panX = 0;
		this.panY = 0;
		this.yaw = -.78;
		this.pitch = .55;
		const page = this.doc?.pageData[this.pageIndex];
		if (page?.kind === "w3d-model") {
			const cam = page.model.initialView?.camera;
			const pos = cam?.position;
			const target = cam?.target;
			if (pos && target) {
				const dx = pos[0] - target[0];
				const dy = pos[1] - target[1];
				const dz = pos[2] - target[2];
				const dist = Math.hypot(dx, dy, dz);
				if (dist > 1e-6) {
					this.pitch = Math.max(-1.45, Math.min(1.45, Math.asin(dy / dist)));
					this.yaw = Math.atan2(dx, dz);
					const radius = Math.max(1e-6, page.model.bounds.radius);
					this.zoom = Math.max(.05, Math.min(100, radius * 2.55 / dist));
				}
			}
		}
	}
	zoomAtCenter(factor) {
		this.resizeCanvasToDisplaySize();
		if (this.is3dPage()) {
			this.zoom = Math.max(.05, Math.min(100, this.zoom * factor));
			return;
		}
		const cx = this.canvas.width / 2;
		const cy = this.canvas.height / 2;
		this.zoomAroundPoint(factor, cx, cy);
	}
	zoomAroundPoint(factor, cx, cy) {
		const oldZoom = this.zoom;
		const nextZoom = Math.max(.05, Math.min(64, oldZoom * factor));
		if (nextZoom === oldZoom) return;
		const anchoredPoint = this.pagePointAtCanvasPoint(cx, cy, oldZoom, this.panX, this.panY);
		if (anchoredPoint) {
			const baseMatrix = this.pageMatrixAt(nextZoom, 0, 0);
			if (baseMatrix) {
				const [sx, sy] = transformPoint(baseMatrix, anchoredPoint.x, anchoredPoint.y);
				this.panX = cx - sx;
				this.panY = cy - sy;
				this.zoom = nextZoom;
				return;
			}
		}
		const ratio = nextZoom / oldZoom;
		this.panX = cx - (cx - this.panX) * ratio;
		this.panY = cy - (cy - this.panY) * ratio;
		this.zoom = nextZoom;
	}
	onWheel(e) {
		if (!this.doc) return;
		e.preventDefault();
		this.resizeCanvasToDisplaySize();
		const rect = this.canvas.getBoundingClientRect();
		const cx = (e.clientX - rect.left) * this.currentDpr;
		const cy = (e.clientY - rect.top) * this.currentDpr;
		const delta = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? e.deltaY * Math.max(1, rect.height) : e.deltaY;
		const factor = Math.exp(-delta * .0015);
		if (this.is3dPage()) this.zoom = Math.max(.05, Math.min(100, this.zoom * factor));
		else this.zoomAroundPoint(factor, cx, cy);
		this.requestRender();
	}
	onPointerDown(e) {
		this.canvas.setPointerCapture?.(e.pointerId);
		if (this.is3dPage()) e.preventDefault();
		const mode = this.is3dPage() ? e.button === 2 || e.shiftKey ? "pan3d" : "rotate3d" : "pan2d";
		this.drag = {
			x: e.clientX,
			y: e.clientY,
			panX: this.panX,
			panY: this.panY,
			yaw: this.yaw,
			pitch: this.pitch,
			mode
		};
	}
	onPointerMove(e) {
		if (!this.drag) return;
		const dx = e.clientX - this.drag.x;
		const dy = e.clientY - this.drag.y;
		if (this.drag.mode === "rotate3d") {
			this.yaw = this.drag.yaw + dx * .008;
			this.pitch = Math.max(-1.45, Math.min(1.45, this.drag.pitch + dy * .008));
		} else {
			this.panX = this.drag.panX + dx * this.currentDpr;
			this.panY = this.drag.panY + dy * this.currentDpr;
		}
		this.requestRender();
	}
	is3dPage() {
		return (this.doc?.pageData[this.pageIndex])?.kind === "w3d-model";
	}
	pagePointAtCanvasPoint(cx, cy, zoom, panX, panY) {
		const m = this.pageMatrixAt(zoom, panX, panY);
		if (!m) return void 0;
		const det = m.a * m.d - m.b * m.c;
		if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return void 0;
		const dx = cx - m.e;
		const dy = cy - m.f;
		return {
			x: (m.d * dx - m.c * dy) / det,
			y: (-m.b * dx + m.a * dy) / det
		};
	}
	pageMatrixAt(zoom, panX, panY) {
		const page = this.doc?.pageData[this.pageIndex];
		if (!page) return void 0;
		const canvasWidth = Math.max(1, this.canvas.width);
		const canvasHeight = Math.max(1, this.canvas.height);
		if (page.kind === "w2d-text") return matrixForW2d(page, canvasWidth, canvasHeight, zoom, panX, panY);
		if (page.kind === "xps-fixed-page") return fitPageMatrix({
			canvasWidth,
			canvasHeight,
			pageWidth: Math.max(1, page.width),
			pageHeight: Math.max(1, page.height),
			zoom,
			panX,
			panY
		});
		if (page.kind === "image") return fitPageMatrix({
			canvasWidth,
			canvasHeight,
			pageWidth: Math.max(1, page.width),
			pageHeight: Math.max(1, page.height),
			zoom,
			panX,
			panY,
			margin: 0
		});
	}
	setStatus(text, warn = false) {
		this.status.textContent = text;
		this.status.classList.toggle("dwfv-warn", warn);
	}
};
function button(text) {
	const b = document.createElement("button");
	b.type = "button";
	b.textContent = text;
	return b;
}
function renderTreeNode(node) {
	const details = document.createElement("details");
	details.open = node.children.length > 0 && node.children.length < 20;
	const summary = document.createElement("summary");
	summary.textContent = node.label || node.id;
	if (node.meshIds.length > 0) summary.title = `${node.meshIds.length} mesh(es)`;
	details.append(summary);
	if (node.contentRefs.length > 0) {
		const meta = document.createElement("div");
		meta.className = "dwfv-tree-meta";
		meta.textContent = node.contentRefs.slice(0, 3).join(", ");
		details.append(meta);
	}
	for (const child of node.children) details.append(renderTreeNode(child));
	return details;
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/contrast.js
var pageCache$1 = /* @__PURE__ */ new WeakMap();
function rgba(source) {
	const match = parseBrushColor(source)?.match(/^rgba?\(([^)]+)\)$/i);
	if (!match) return void 0;
	const values = match[1].split(",").map(Number);
	if (values.length < 3 || !values.every(Number.isFinite)) return void 0;
	return [
		values[0],
		values[1],
		values[2],
		values[3] ?? 1
	];
}
function luminance(rgb) {
	return rgb.slice(0, 3).reduce((sum, channel, index) => {
		const value = Math.max(0, Math.min(255, channel)) / 255;
		return sum + (value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4) * [
			.2126,
			.7152,
			.0722
		][index];
	}, 0);
}
/** Adjusts only colors too close to the background, retaining alpha and hue. */
function adaptiveContrastColor(source, options) {
	if (options.contrastMode !== "adaptive") return source;
	const color = rgba(source);
	const background = rgba(options.background ?? "#ffffff");
	if (!color || !background || color[3] === 0) return source;
	const bg = luminance(background);
	const contrast = (rgb) => {
		const value = luminance(rgb);
		return (Math.max(value, bg) + .05) / (Math.min(value, bg) + .05);
	};
	const requested = options.minColorContrast ?? 2.4;
	const minimum = Number.isFinite(requested) ? Math.max(1, Math.min(21, requested)) : 2.4;
	if (contrast(color) >= minimum) return source;
	const target = 1.05 / (bg + .05) >= (bg + .05) / .05 ? 255 : 0;
	const mix = (ratio) => color.slice(0, 3).map((channel) => Math.round(channel + (target - channel) * ratio));
	let low = 0, high = 1;
	for (let step = 0; step < 16; step++) {
		const middle = (low + high) / 2;
		if (contrast(mix(middle)) >= minimum) high = middle;
		else low = middle;
	}
	return `rgba(${mix(high).join(", ")}, ${color[3]})`;
}
function contrastPolicyKey(options) {
	return JSON.stringify([
		options.contrastMode ?? "preserve",
		options.background ?? "#ffffff",
		options.minColorContrast ?? 2.4
	]);
}
function createContrastPage(page, options) {
	if (page.kind !== "w2d-text" || options.contrastMode !== "adaptive") return page;
	const key = contrastPolicyKey(options);
	let policies = pageCache$1.get(page);
	if (!policies) pageCache$1.set(page, policies = /* @__PURE__ */ new Map());
	const cached = policies.get(key);
	if (cached) return cached;
	const transformed = {
		...page,
		primitives: page.primitives.map((primitive) => {
			const next = { ...primitive };
			if (primitive.stroke !== void 0) next.stroke = adaptiveContrastColor(primitive.stroke, options);
			if (primitive.fill !== void 0) next.fill = adaptiveContrastColor(primitive.fill, options);
			if (primitive.type === "polyline" && primitive.stroke === void 0) next.stroke = adaptiveContrastColor("#000000", options);
			if (primitive.type === "text" && primitive.fill === void 0 && primitive.stroke === void 0) next.fill = adaptiveContrastColor("#000000", options);
			return next;
		})
	};
	if (policies.size >= 8) policies.delete(policies.keys().next().value);
	policies.set(key, transformed);
	return transformed;
}
function applyXpsContrastXml(xml, options) {
	if (options.contrastMode !== "adaptive") return xml;
	return xml.replace(/(\b(?:Fill|Stroke|Color)\s*=\s*)(["'])([^"']*)\2/gi, (match, prefix, quote, source) => {
		const color = adaptiveContrastColor(source, options);
		return color === source ? match : `${prefix}${quote}${color}${quote}`;
	});
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/render/monochrome.js
var pageCache = /* @__PURE__ */ new WeakMap();
var NAMED_COLORS = {
	black: {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	},
	white: {
		r: 255,
		g: 255,
		b: 255,
		a: 1
	},
	red: {
		r: 255,
		g: 0,
		b: 0,
		a: 1
	},
	green: {
		r: 0,
		g: 128,
		b: 0,
		a: 1
	},
	blue: {
		r: 0,
		g: 0,
		b: 255,
		a: 1
	},
	yellow: {
		r: 255,
		g: 255,
		b: 0,
		a: 1
	},
	cyan: {
		r: 0,
		g: 255,
		b: 255,
		a: 1
	},
	magenta: {
		r: 255,
		g: 0,
		b: 255,
		a: 1
	},
	gray: {
		r: 128,
		g: 128,
		b: 128,
		a: 1
	},
	grey: {
		r: 128,
		g: 128,
		b: 128,
		a: 1
	},
	transparent: {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	}
};
/**
* Normalizes the supported fixed color forms to one renderer-safe CSS value.
* Empty or non-color values disable the monochrome override.
*/
function normalizeMonochromeColor(value) {
	if (typeof value !== "string") return void 0;
	const parsed = parseColor(value);
	return parsed ? toCssColor(parsed) : void 0;
}
/**
* Returns a page view with vector/text/material colors replaced while keeping
* geometry, line weights, source diagnostics, images and source objects intact.
*/
function createMonochromePage(page, color) {
	const normalized = normalizeMonochromeColor(color);
	if (!normalized) return page;
	if (page.kind !== "w2d-text" && page.kind !== "w3d-model") return page;
	let colors = pageCache.get(page);
	if (!colors) {
		colors = /* @__PURE__ */ new Map();
		pageCache.set(page, colors);
	}
	const cached = colors.get(normalized);
	if (cached) return cached;
	let transformed;
	if (page.kind === "w2d-text") transformed = {
		...page,
		primitives: page.primitives.map((primitive) => monochromePrimitive(primitive, normalized))
	};
	else {
		const target = parseColor(normalized) ?? NAMED_COLORS.black;
		const rgb = [
			target.r / 255,
			target.g / 255,
			target.b / 255
		];
		transformed = {
			...page,
			model: {
				...page.model,
				meshes: page.model.meshes.map((mesh) => ({
					...mesh,
					color: [
						rgb[0],
						rgb[1],
						rgb[2]
					]
				})),
				materials: page.model.materials?.map((material) => ({
					...material,
					color: [
						rgb[0],
						rgb[1],
						rgb[2]
					]
				}))
			}
		};
	}
	colors.set(normalized, transformed);
	return transformed;
}
/**
* Rewrites only direct XPS color attributes. Resource references and image
* brushes are left untouched; referenced SolidColorBrush/GradientStop colors
* are rewritten when their XML resource part is read.
*/
function applyXpsMonochromeXml(xml, color) {
	const normalized = normalizeMonochromeColor(color);
	if (!normalized || !xml) return xml;
	return xml.replace(/(\b(?:Fill|Stroke|Color)\s*=\s*)(["'])([^"']*)\2/gi, (match, prefix, quote, source) => {
		if (!parseColor(source)) return match;
		return `${prefix}${quote}${monochromeColorWithAlpha(normalized, source)}${quote}`;
	});
}
/** Preserves source brush alpha and combines it with an optional target alpha. */
function monochromeColorWithAlpha(color, sourceColor) {
	const target = parseColor(color) ?? NAMED_COLORS.black;
	const source = sourceColor ? parseColor(sourceColor) : void 0;
	return toCssColor({
		r: target.r,
		g: target.g,
		b: target.b,
		a: clamp01(target.a * (source?.a ?? 1))
	});
}
function monochromePrimitive(primitive, color) {
	const next = { ...primitive };
	if (primitive.stroke !== void 0) next.stroke = monochromeColorWithAlpha(color, primitive.stroke);
	if (primitive.fill !== void 0) next.fill = monochromeColorWithAlpha(color, primitive.fill);
	if (primitive.type === "polyline" && primitive.stroke === void 0) next.stroke = color;
	if (primitive.type === "text" && primitive.stroke === void 0 && primitive.fill === void 0) next.fill = color;
	return next;
}
function parseColor(value) {
	const source = value.trim();
	if (!source) return void 0;
	const named = NAMED_COLORS[source.toLowerCase()];
	if (named) return { ...named };
	if (/^#[0-9a-f]{3}$/i.test(source)) return {
		r: parseInt(source[1] + source[1], 16),
		g: parseInt(source[2] + source[2], 16),
		b: parseInt(source[3] + source[3], 16),
		a: 1
	};
	if (/^#[0-9a-f]{4}$/i.test(source)) return {
		r: parseInt(source[1] + source[1], 16),
		g: parseInt(source[2] + source[2], 16),
		b: parseInt(source[3] + source[3], 16),
		a: parseInt(source[4] + source[4], 16) / 255
	};
	if (/^#[0-9a-f]{6}$/i.test(source)) return {
		r: parseInt(source.slice(1, 3), 16),
		g: parseInt(source.slice(3, 5), 16),
		b: parseInt(source.slice(5, 7), 16),
		a: 1
	};
	if (/^#[0-9a-f]{8}$/i.test(source)) return {
		r: parseInt(source.slice(3, 5), 16),
		g: parseInt(source.slice(5, 7), 16),
		b: parseInt(source.slice(7, 9), 16),
		a: parseInt(source.slice(1, 3), 16) / 255
	};
	if (/^sc#/i.test(source)) {
		const values = source.slice(3).split(",").map((item) => Number(item.trim()));
		if (values.length === 3 && values.every(Number.isFinite)) return {
			r: values[0] * 255,
			g: values[1] * 255,
			b: values[2] * 255,
			a: 1
		};
		if (values.length === 4 && values.every(Number.isFinite)) return {
			r: values[1] * 255,
			g: values[2] * 255,
			b: values[3] * 255,
			a: clamp01(values[0])
		};
	}
	const rgb = source.match(/^rgba?\(([^)]+)\)$/i);
	if (rgb) {
		const parts = rgb[1].split(",").map((item) => item.trim());
		if (parts.length === 3 || parts.length === 4) {
			const channels = parts.slice(0, 3).map(parseChannel);
			const alpha = parts[3] === void 0 ? 1 : parseAlpha(parts[3]);
			if (channels.every((item) => item !== void 0) && alpha !== void 0) return {
				r: channels[0],
				g: channels[1],
				b: channels[2],
				a: alpha
			};
		}
	}
}
function parseChannel(value) {
	const percent = value.endsWith("%");
	const number = Number(percent ? value.slice(0, -1) : value);
	if (!Number.isFinite(number)) return void 0;
	return clamp255(percent ? number * 2.55 : number);
}
function parseAlpha(value) {
	const percent = value.endsWith("%");
	const number = Number(percent ? value.slice(0, -1) : value);
	if (!Number.isFinite(number)) return void 0;
	return clamp01(percent ? number / 100 : number);
}
function toCssColor(color) {
	const r = clamp255(color.r);
	const g = clamp255(color.g);
	const b = clamp255(color.b);
	const a = clamp01(color.a);
	return a >= .999999 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1e6) / 1e6})`;
}
function clamp255(value) {
	return Math.max(0, Math.min(255, Math.round(value)));
}
function clamp01(value) {
	return Math.max(0, Math.min(1, value));
}
//#endregion
//#region ../../node_modules/.pnpm/dwf-viewer@0.6.7_three@0.185.1/node_modules/dwf-viewer/dist/viewer/DwfViewer.js
/**
* Adds a non-destructive monochrome plot-style view on top of the native DWF
* renderer. The parsed document remains source-colored for metadata consumers.
*/
var DwfViewer = class extends DwfViewer$1 {
	constructor(container, options = {}) {
		super(container, options);
		this.monochromeColor = normalizeMonochromeColor(options.monochromeColor);
		this.contrastOptions = {
			contrastMode: options.contrastMode,
			minColorContrast: options.minColorContrast
		};
	}
	async load(input, options = {}) {
		if (Object.prototype.hasOwnProperty.call(options, "monochromeColor")) this.updateMonochromeColor(options.monochromeColor, false);
		if (options.contrastMode !== void 0) this.contrastOptions.contrastMode = options.contrastMode;
		if (options.minColorContrast !== void 0) this.contrastOptions.minColorContrast = options.minColorContrast;
		await super.load(input, options);
	}
	/** Switches between source colors (undefined) and a fixed plot color. */
	setMonochromeColor(value) {
		this.updateMonochromeColor(value, true);
	}
	getMonochromeColor() {
		return this.monochromeColor;
	}
	setContrastOptions(options) {
		this.contrastOptions = {
			...this.contrastOptions,
			...options
		};
		this.requestRender();
	}
	async render() {
		const internals = this;
		if (internals.rendering) return super.render();
		const renderer = internals.renderer;
		const color = this.monochromeColor;
		const contrast = {
			...this.contrastOptions,
			background: internals.background
		};
		const policy = color || contrastPolicyKey(contrast);
		if (renderer) {
			if (this.preparedRenderer === renderer && this.preparedColor !== policy) renderer.dispose();
			this.preparedRenderer = renderer;
			this.preparedColor = policy;
		}
		const doc = internals.doc;
		const pageIndex = internals.pageIndex;
		const sourcePage = doc?.pageData[pageIndex];
		if (!color && contrast.contrastMode !== "adaptive" || !doc || !sourcePage) return super.render();
		const renderedPage = color ? createMonochromePage(sourcePage, color) : createContrastPage(sourcePage, contrast);
		doc.pageData[pageIndex] = renderedPage;
		const opc = doc.opc;
		const sourceReadText = opc?.readText;
		if (opc && sourceReadText) opc.readText = async (path) => {
			const xml = await sourceReadText.call(opc, path);
			return color ? applyXpsMonochromeXml(xml, color) : applyXpsContrastXml(xml, contrast);
		};
		try {
			return await super.render();
		} finally {
			if (doc.pageData[pageIndex] === renderedPage) doc.pageData[pageIndex] = sourcePage;
			if (opc && sourceReadText) opc.readText = sourceReadText;
		}
	}
	dispose() {
		this.preparedRenderer = void 0;
		this.preparedColor = void 0;
		super.dispose();
	}
	updateMonochromeColor(value, requestRender) {
		const normalized = normalizeMonochromeColor(value);
		if (normalized === this.monochromeColor) return;
		this.monochromeColor = normalized;
		if (requestRender) this.requestRender();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@flyfish-dev+cad-viewer@0.8.2_three@0.185.1/node_modules/@flyfish-dev/cad-viewer/dist/cad-viewer.es.js
var Mr = Object.defineProperty;
var Tr = (t, e, n) => e in t ? Mr(t, e, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : t[e] = n;
var S = (t, e, n) => Tr(t, typeof e != "symbol" ? e + "" : e, n);
async function it(t) {
	if (t.buffer instanceof Uint8Array) return t.buffer;
	if (t.buffer instanceof ArrayBuffer) return new Uint8Array(t.buffer);
	if (t.file) return new Uint8Array(await t.file.arrayBuffer());
	throw new Error("CadLoadInput requires a File, ArrayBuffer, or Uint8Array.");
}
function Lr(t) {
	return t.byteOffset === 0 && t.byteLength === t.buffer.byteLength ? t.buffer : t.slice().buffer;
}
function Fe(t) {
	var s, i, o;
	const e = (o = (i = t.fileName) != null ? i : (s = t.file) == null ? void 0 : s.name) != null ? o : "", n = e.lastIndexOf(".");
	return n >= 0 ? e.slice(n + 1).toLowerCase() : "";
}
function Oe(t, e) {
	const n = Fe(t);
	if (n === "dwg") return "dwg";
	if (n === "dxf") return "dxf";
	if (n === "dwfx") return "dwfx";
	if (n === "xps") return "xps";
	if (n === "dwf") return "dwf";
	if (e && e.byteLength >= 6) {
		const s = Fi(e.slice(0, 6));
		if (/^AC10/.test(s)) return "dwg";
		if (e[0] === 80 && e[1] === 75) return "dwfx";
		const i = Fi(e.slice(0, Math.min(e.byteLength, 2048))).toUpperCase();
		if (i.includes("SECTION") && i.includes("ENTITIES")) return "dxf";
		if (i.includes("DWF")) return "dwf";
	}
	return "unknown";
}
function Fi(t) {
	return Array.from(t, (e) => e >= 32 && e <= 126 ? String.fromCharCode(e) : " ").join("");
}
var Ir = class {
	constructor(e = []) {
		S(this, "loaders", []);
		for (const n of e) this.register(n);
	}
	register(e) {
		const n = this.loaders.findIndex((s) => s.id === e.id);
		return n >= 0 ? this.loaders.splice(n, 1, e) : this.loaders.push(e), this;
	}
	unregister(e) {
		const n = this.loaders.findIndex((s) => s.id === e);
		return n >= 0 && this.loaders.splice(n, 1), this;
	}
	list() {
		return [...this.loaders];
	}
	async detect(e) {
		const n = await it(e), s = Oe(e, n), i = this.loaders.find((r) => r.formats.includes(s) && r.accepts(e, n));
		if (i) return {
			loader: i,
			bytes: n,
			format: s
		};
		const o = this.loaders.find((r) => r.accepts(e, n));
		if (o) return {
			loader: o,
			bytes: n,
			format: s
		};
		throw new Error(`No CAD loader registered for ${s === "unknown" ? "this file" : s.toUpperCase()}.`);
	}
	async load(e, n = {}) {
		const { loader: s, bytes: i } = await this.detect(e);
		return s.load({
			...e,
			buffer: i
		}, n);
	}
};
var Dr = "wasm/dwg-worker.js";
var Br = class {
	constructor() {
		S(this, "worker");
		S(this, "sequence", 0);
		S(this, "pending", /* @__PURE__ */ new Map());
	}
	load(e, n, s = {}) {
		var l, h, u, f, d;
		if (!Zt()) throw new Error("Web Worker is not available in this runtime.");
		const i = this.ensureWorker(s), o = ++this.sequence, r = Math.max(0, Number((l = s.workerTimeoutMs) != null ? l : 0)), a = (f = (h = s.fileName) != null ? h : n.fileName) != null ? f : (u = n.file) == null ? void 0 : u.name, c = Fr(e, n, s);
		return (d = s.onProgress) == null || d.call(s, {
			phase: "worker-start",
			format: "dwg",
			message: "Dispatching DWG parse to worker…",
			total: e.byteLength
		}), new Promise((m, p) => {
			var b;
			if ((b = s.signal) != null && b.aborted) {
				p(yt());
				return;
			}
			const g = {
				resolve: m,
				reject: p,
				onProgress: s.onProgress,
				signal: s.signal
			};
			r > 0 && (g.timer = setTimeout(() => {
				this.pending.delete(o), this.resetWorker(), p(/* @__PURE__ */ new Error(`DWG worker timed out after ${r} ms.`));
			}, r)), s.signal && (g.abortHandler = () => {
				this.pending.delete(o), this.resetWorker(), p(yt());
			}, s.signal.addEventListener("abort", g.abortHandler, { once: !0 })), this.pending.set(o, g);
			try {
				i.postMessage({
					type: "load",
					requestId: o,
					bytes: c,
					fileName: a,
					options: Oi(s)
				}, [c]);
			} catch (y) {
				this.pending.delete(o), bt(g), p(y instanceof Error ? y : new Error(String(y)));
			}
		});
	}
	preload(e = {}) {
		var o, r;
		if (!Zt()) return Promise.reject(/* @__PURE__ */ new Error("Web Worker is not available in this runtime."));
		const n = this.ensureWorker(e), s = ++this.sequence, i = Math.max(0, Number((o = e.workerTimeoutMs) != null ? o : 0));
		return (r = e.onProgress) == null || r.call(e, {
			phase: "worker-start",
			format: "dwg",
			message: "Starting DWG worker warmup…"
		}), new Promise((a, c) => {
			var h;
			if ((h = e.signal) != null && h.aborted) {
				c(yt());
				return;
			}
			const l = {
				resolve: () => a(),
				reject: c,
				onProgress: e.onProgress,
				signal: e.signal
			};
			i > 0 && (l.timer = setTimeout(() => {
				this.pending.delete(s), this.resetWorker(), c(/* @__PURE__ */ new Error(`DWG worker warmup timed out after ${i} ms.`));
			}, i)), e.signal && (l.abortHandler = () => {
				this.pending.delete(s), this.resetWorker(), c(yt());
			}, e.signal.addEventListener("abort", l.abortHandler, { once: !0 })), this.pending.set(s, l);
			try {
				n.postMessage({
					type: "warmup",
					requestId: s,
					options: Oi(e)
				});
			} catch (u) {
				this.pending.delete(s), bt(l), c(u instanceof Error ? u : new Error(String(u)));
			}
		});
	}
	terminate() {
		this.resetWorker();
	}
	ensureWorker(e) {
		return this.worker || (this.worker = Rr(e), this.worker.onmessage = (n) => this.handleMessage(n.data), this.worker.onerror = (n) => {
			const s = n.message || "DWG worker failed.";
			this.rejectAll(new Error(s)), this.resetWorker(!1);
		}, this.worker.onmessageerror = () => {
			this.rejectAll(/* @__PURE__ */ new Error("DWG worker returned a message that could not be cloned.")), this.resetWorker(!1);
		}), this.worker;
	}
	handleMessage(e) {
		var i, o;
		if (e.type === "ready") return;
		const n = this.pending.get(e.requestId);
		if (!n) return;
		if (e.type === "progress") {
			(i = n.onProgress) == null || i.call(n, e.progress);
			return;
		}
		if (this.pending.delete(e.requestId), bt(n), e.type === "result") {
			n.resolve(e.result);
			return;
		}
		if (e.type === "warmup-result") {
			(o = n.onProgress) == null || o.call(n, {
				phase: "worker-ready",
				format: "dwg",
				message: "DWG worker warmup complete.",
				percent: 100,
				elapsedMs: e.elapsedMs
			}), n.resolve(void 0);
			return;
		}
		const s = new Error(e.error.message);
		s.name = e.error.name || "DwgWorkerError", e.error.stack && (s.stack = e.error.stack), n.reject(s);
	}
	rejectAll(e) {
		for (const [, n] of this.pending) bt(n), n.reject(e);
		this.pending.clear();
	}
	resetWorker(e = !0) {
		var n;
		e && this.rejectAll(/* @__PURE__ */ new Error("DWG worker was terminated.")), (n = this.worker) == null || n.terminate(), this.worker = void 0;
	}
};
function Zt() {
	return typeof Worker != "undefined" && typeof URL != "undefined";
}
function Rr(t) {
	return t.workerFactory ? t.workerFactory() : new Worker(_r(t.workerUrl), {
		type: "module",
		name: "lightweight-cad-dwg-loader"
	});
}
function Oi(t) {
	return {
		wasmPath: Or(t.wasmPath),
		includePaperSpace: t.includePaperSpace,
		maxInsertDepth: t.maxInsertDepth,
		keepRaw: !!t.keepRaw
	};
}
function Fr(t, e, n) {
	return !!e.file || n.transferInputBuffer === !0 ? Lr(t) : t.slice().buffer;
}
function bt(t) {
	t.timer && clearTimeout(t.timer), t.signal && t.abortHandler && t.signal.removeEventListener("abort", t.abortHandler);
}
function yt() {
	if (typeof DOMException != "undefined") return new DOMException("DWG loading was aborted.", "AbortError");
	const t = /* @__PURE__ */ new Error("DWG loading was aborted.");
	return t.name = "AbortError", t;
}
function Or(t) {
	const e = ((t == null ? void 0 : t.trim()) || "/wasm").replace(/\/+$/, "");
	return e === "" ? _i() : Eo(e) ? e : e.startsWith("/") ? `${_i()}${e}` : new URL(e, mn()).href.replace(/\/+$/, "");
}
function _r(t) {
	if (t instanceof URL) return t;
	const e = (t == null ? void 0 : t.trim()) || Dr;
	return Eo(e) ? e : new URL(e, mn()).href;
}
function mn() {
	return typeof document != "undefined" && document.baseURI ? document.baseURI : typeof location != "undefined" && location.href ? location.href : "http://localhost/";
}
function _i() {
	return typeof location != "undefined" && location.origin ? location.origin : new URL(mn()).origin;
}
function Eo(t) {
	return /^[a-z][a-z0-9+.-]*:/i.test(t);
}
var $r = class {
	constructor(e = {}) {
		S(this, "id", "dwg");
		S(this, "label", "DWG / LibreDWG WebAssembly");
		S(this, "formats", ["dwg"]);
		S(this, "defaults");
		S(this, "workerClient", new Br());
		this.defaults = {
			useWorker: !0,
			...e
		};
	}
	accepts(e, n) {
		return Fe(e) === "dwg" ? !0 : Oe(e, n) === "dwg";
	}
	async load(e, n = {}) {
		var r, a, c;
		const s = {
			...this.defaults,
			...n
		};
		(r = s.onProgress) == null || r.call(s, {
			phase: "read",
			format: "dwg",
			message: "Reading DWG bytes…"
		});
		const i = await it(e), o = (c = e.fileName) != null ? c : (a = e.file) == null ? void 0 : a.name;
		if (s.useWorker === !1) throw new Error("DWG main-thread parsing is intentionally not bundled by the default viewer. Keep useWorker enabled, or register a custom DWG loader for non-browser runtimes.");
		if (!Zt()) throw new Error("DWG loading requires Web Worker support in this build. Provide a custom loader for this runtime.");
		try {
			return await this.workerClient.load(i, e, {
				...s,
				fileName: o
			});
		} catch (l) {
			throw Xr(l) ? l : Wr(l);
		}
	}
	terminateWorker() {
		this.workerClient.terminate();
	}
	preload(e = {}) {
		const n = {
			...this.defaults,
			...e
		};
		return n.useWorker === !1 ? Promise.reject(/* @__PURE__ */ new Error("DWG preload requires worker mode in the default viewer.")) : this.workerClient.preload(n);
	}
};
function Xr(t) {
	return t instanceof Error && t.name === "AbortError";
}
function Wr(t) {
	const e = t instanceof Error ? t.message : String(t), n = /worker|fetch|wasm|magic word|mime|network|404|failed to initialize/i.test(e), s = /* @__PURE__ */ new Error(`${e}${n ? " If the worker asset cannot be resolved by your bundler/CDN, pass workerUrl or workerFactory to CadViewer." : ""}`);
	return t instanceof Error && (s.name = t.name, s.stack = t.stack), s;
}
function pn(t) {
	var e, n, s, i, o, r, a;
	return {
		format: t.format,
		sourceName: t.sourceName,
		units: t.units,
		header: (e = t.header) != null ? e : {},
		layers: (n = t.layers) != null ? n : {},
		lineTypes: (s = t.lineTypes) != null ? s : {},
		blocks: (i = t.blocks) != null ? i : {},
		entities: (o = t.entities) != null ? o : [],
		pages: t.pages,
		savedView: t.savedView,
		dataLinks: t.dataLinks,
		dataTables: t.dataTables,
		xrecords: t.xrecords,
		dictionaries: t.dictionaries,
		metadata: (r = t.metadata) != null ? r : {},
		warnings: (a = t.warnings) != null ? a : [],
		raw: t.raw
	};
}
function ot(t) {
	switch (String(t != null ? t : "").toUpperCase()) {
		case "LINE": return "line";
		case "CIRCLE": return "circle";
		case "ARC": return "arc";
		case "LWPOLYLINE":
		case "POLYLINE":
		case "POLYLINE_2D":
		case "POLYLINE2D":
		case "POLYLINE_3D":
		case "POLYLINE3D":
		case "LEADER":
		case "MULTILEADER": return "polyline";
		case "ELLIPSE": return "ellipse";
		case "TEXT":
		case "MTEXT":
		case "ATTRIB":
		case "ATTDEF":
		case "DIMENSION": return "text";
		case "POINT": return "point";
		case "INSERT":
		case "MINSERT": return "insert";
		case "SOLID":
		case "TRACE":
		case "3DFACE": return "solid";
		case "HATCH": return "hatch";
		case "SPLINE": return "spline";
		case "PATH":
		case "XPS_PATH":
		case "DWF_PATH": return "path";
		case "IMAGE":
		case "RASTER_IMAGE":
		case "DWF_IMAGE": return "image";
		case "VIEWPORT": return "viewport";
		case "TABLE":
		case "ACAD_TABLE":
		case "ACDBTABLE": return "table";
		default: return "unsupported";
	}
}
function ut(t, e, n = {}) {
	var v, x, w, C, N, B, D, I, P, M, T, A, F, _, X, R, O, W, H, G, Q, se, he, pe, ge, be, ye, xe, ve, we, Ce, Ve, je, Ge, qe, Ke, ce, ue, Ne, Mn, Tn, An, En, Ln, In, Dn, Bn, Rn, Fn, On, _n, $n, Xn, Wn, Un, zn, Yn, Hn, Vn, jn, Gn, qn, Kn, Zn, Jn, Qn, es, ts, ns, ss, is, os, rs, as, cs, ls, hs, us, fs, ds, ms, ps, gs, bs, ys, xs, vs, ws, Cs, Ss, ks, Ns, Ps, Ms, Ts, As, Es, Ls, Is, Ds, Bs, Rs, Fs, Os, _s, $s, Xs, Ws, Us, zs, Ys, Hs, Vs, js, Gs, qs, Ks, Zs, Js, Qs, ei, ti, ni, si, ii, oi, ri, ai, ci, li, hi, ui, fi, di, mi, pi, gi, bi, yi, xi, vi, wi, Ci, Si, ki, Ni, Pi, Mi, Ti, Ai, Ei, Li, Ii, Di, Bi;
	const s = e != null ? e : String((w = (x = (v = t.type) != null ? v : t.entityType) != null ? x : t.objectName) != null ? w : "UNKNOWN").toUpperCase(), i = n.includeUnknownProperties === !1 ? {
		type: s,
		kind: ot(s)
	} : {
		...t,
		type: s,
		kind: ot(s)
	};
	n.keepRaw && (i.raw = t), i.handle = E((C = t.handle) != null ? C : t.id), i.layer = E((N = t.layer) != null ? N : t.layerName), i.lineType = E((B = t.lineType) != null ? B : t.linetype), i.lineTypeScale = (P = k((I = (D = t.lineTypeScale) != null ? D : t.linetypeScale) != null ? I : t.ltscale)) != null ? P : i.lineTypeScale, i.flag = (T = k((M = t.flag) != null ? M : t.flags)) != null ? T : i.flag, i.constantWidth = (_ = k((F = (A = t.constantWidth) != null ? A : t.constWidth) != null ? F : t.const_width)) != null ? _ : i.constantWidth, i.thickness = (X = k(t.thickness)) != null ? X : i.thickness;
	const o = t.isClosed === !0 || t.closed === !0 || t.shape === !0, r = /^(POLYLINE|POLYLINE_2D|POLYLINE2D|POLYLINE_3D|POLYLINE3D|SPLINE)$/.test(s), a = s === "LWPOLYLINE";
	(o || r && (Number((R = i.flag) != null ? R : 0) & 1) === 1 || a && (Number((O = i.flag) != null ? O : 0) & 512) === 512) && (i.isClosed = !0);
	const c = (W = n.numericColorMode) != null ? W : "auto", l = k(t.color), h = k((se = (Q = (G = (H = t.colorIndex) != null ? H : t.colorNumber) != null ? G : t.aci) != null ? Q : t.aciColor) != null ? se : t.color_index);
	i.colorIndex = h != null ? h : c !== "rgb" && l !== void 0 && Math.abs(l) <= 257 ? l : void 0;
	const u = (xe = (ye = (be = (ge = (pe = (he = t.trueColor) != null ? he : t.true_color) != null ? pe : t.truecolor) != null ? ge : t.colorRGB) != null ? be : t.colorRgb) != null ? ye : t.rgbColor) != null ? xe : t.rgb;
	i.trueColor = u != null ? u : l !== void 0 && l >= 0 && l <= 16777215 && (c === "rgb" || c === "auto" && Math.abs(l) > 257) ? l : void 0, (typeof t.color == "string" || typeof t.color == "number") && (i.color = t.color), i.colorNumber = (ve = k(t.colorNumber)) != null ? ve : i.colorNumber, i.colorName = (Ce = E((we = t.colorName) != null ? we : t.color_name)) != null ? Ce : i.colorName, i.fillColor = (Ve = t.fillColor) != null ? Ve : t.fill_color, i.fillColorIndex = (qe = k((Ge = (je = t.fillColorIndex) != null ? je : t.fill_color_index) != null ? Ge : t.fillColorNumber)) != null ? qe : i.fillColorIndex, i.opacity = (ce = k((Ke = t.opacity) != null ? Ke : t.alpha)) != null ? ce : i.opacity, i.lineweight = k((ue = t.lineweight) != null ? ue : t.lineWeight), i.isVisible = !(t.isVisible === !1 || t.visible === !1);
	const d = ie(t.text);
	i.startPoint = (En = V((An = (Tn = (Mn = (Ne = t.startPoint) != null ? Ne : d == null ? void 0 : d.startPoint) != null ? Mn : t.start) != null ? Tn : t.p0) != null ? An : t.from)) != null ? En : i.startPoint, i.endPoint = (Rn = V((Bn = (Dn = (In = (Ln = t.endPoint) != null ? Ln : d == null ? void 0 : d.endPoint) != null ? In : t.end) != null ? Dn : t.p1) != null ? Bn : t.to)) != null ? Rn : i.endPoint, i.center = (On = V((Fn = t.center) != null ? Fn : t.centerPoint)) != null ? On : i.center, i.insertionPoint = (zn = V((Un = (Wn = (Xn = ($n = (_n = t.insertionPoint) != null ? _n : d == null ? void 0 : d.startPoint) != null ? $n : t.position) != null ? Xn : t.location) != null ? Wn : t.point) != null ? Un : t.basePoint)) != null ? zn : i.insertionPoint, i.radius = (Yn = k(t.radius)) != null ? Yn : i.radius, i.startAngle = (Vn = k((Hn = t.startAngle) != null ? Hn : t.start_angle)) != null ? Vn : i.startAngle, i.endAngle = (Gn = k((jn = t.endAngle) != null ? jn : t.end_angle)) != null ? Gn : i.endAngle, i.majorAxisEndPoint = (Zn = V((Kn = (qn = t.majorAxisEndPoint) != null ? qn : t.majorAxis) != null ? Kn : t.major)) != null ? Zn : i.majorAxisEndPoint, i.axisRatio = (Qn = k((Jn = t.axisRatio) != null ? Jn : t.ratio)) != null ? Qn : i.axisRatio, i.height = (ns = k((ts = (es = t.height) != null ? es : t.textHeight) != null ? ts : d == null ? void 0 : d.textHeight)) != null ? ns : i.height, i.textHeight = (os = k((is = (ss = t.textHeight) != null ? ss : t.height) != null ? is : d == null ? void 0 : d.textHeight)) != null ? os : i.textHeight, i.xScale = (cs = k((as = (rs = t.xScale) != null ? rs : t.widthFactor) != null ? as : d == null ? void 0 : d.xScale)) != null ? cs : i.xScale, i.generationFlag = (us = k((hs = (ls = t.generationFlag) != null ? ls : t.textGenerationFlag) != null ? hs : d == null ? void 0 : d.generationFlag)) != null ? us : i.generationFlag, i.halign = (ms = k((ds = (fs = t.halign) != null ? fs : t.horizontalAlignment) != null ? ds : d == null ? void 0 : d.halign)) != null ? ms : i.halign, i.valign = (bs = k((gs = (ps = t.valign) != null ? ps : t.verticalAlignment) != null ? gs : d == null ? void 0 : d.valign)) != null ? bs : i.valign, i.extrusionDirection = (vs = V((xs = (ys = t.extrusionDirection) != null ? ys : t.extrusion) != null ? xs : d == null ? void 0 : d.extrusionDirection)) != null ? vs : i.extrusionDirection, i.rotation = (Ss = k((Cs = (ws = t.rotation) != null ? ws : t.angle) != null ? Cs : d == null ? void 0 : d.rotation)) != null ? Ss : i.rotation, i.text = (Es = E((As = (Ts = (Ms = (Ps = (Ns = (ks = d == null ? void 0 : d.text) != null ? ks : t.text) != null ? Ns : t.value) != null ? Ps : t.string) != null ? Ms : t.contents) != null ? Ts : t.defaultValue) != null ? As : t.default_value)) != null ? Es : i.text, i.value = (Os = E((Fs = (Rs = (Bs = (Ds = (Is = (Ls = t.value) != null ? Ls : d == null ? void 0 : d.text) != null ? Is : t.text) != null ? Ds : t.string) != null ? Bs : t.contents) != null ? Rs : t.defaultValue) != null ? Fs : t.default_value)) != null ? Os : i.value, i.name = ($s = E((_s = t.name) != null ? _s : t.blockName)) != null ? $s : i.name, i.blockName = (Ws = E((Xs = t.blockName) != null ? Xs : t.name)) != null ? Ws : i.blockName, i.effectiveBlockName = (Hs = E((Ys = (zs = (Us = t.effectiveBlockName) != null ? Us : t.effectiveName) != null ? zs : t.dynamicBlockName) != null ? Ys : t.originalBlockName)) != null ? Hs : i.effectiveBlockName, i.extensionDictionaryHandle = (qs = rt((Gs = (js = (Vs = t.extensionDictionaryHandle) != null ? Vs : t.ownerDictionaryHardId) != null ? js : t.ownerdictionaryHardId) != null ? Gs : t.xdicobjhandle)) != null ? qs : i.extensionDictionaryHandle, i.ownerBlockRecordHandle = (Js = rt((Zs = (Ks = t.ownerBlockRecordHandle) != null ? Ks : t.ownerBlockRecordSoftId) != null ? Zs : t.ownerHandle)) != null ? Js : i.ownerBlockRecordHandle, i.attributeTag = (ni = E((ti = (ei = (Qs = t.attributeTag) != null ? Qs : t.tag) != null ? ei : t.tagString) != null ? ti : t.attrTag)) != null ? ni : i.attributeTag, i.attributePrompt = (oi = E((ii = (si = t.attributePrompt) != null ? si : t.prompt) != null ? ii : t.promptString)) != null ? oi : i.attributePrompt, i.attributeFlags = (ci = k((ai = (ri = t.attributeFlags) != null ? ri : t.flags) != null ? ai : t.flag)) != null ? ci : i.attributeFlags, (s === "INSERT" || s === "MINSERT") && (i.insertRowCount = (fi = Se((ui = (hi = (li = t.insertRowCount) != null ? li : t.rowCount) != null ? hi : t.numRows) != null ? ui : t.num_rows)) != null ? fi : i.insertRowCount, i.insertColumnCount = (bi = Se((gi = (pi = (mi = (di = t.insertColumnCount) != null ? di : t.columnCount) != null ? mi : t.numColumns) != null ? pi : t.numCols) != null ? gi : t.num_cols)) != null ? bi : i.insertColumnCount, i.insertRowSpacing = (vi = k((xi = (yi = t.insertRowSpacing) != null ? yi : t.rowSpacing) != null ? xi : t.row_spacing)) != null ? vi : i.insertRowSpacing, i.insertColumnSpacing = (Si = k((Ci = (wi = t.insertColumnSpacing) != null ? wi : t.columnSpacing) != null ? Ci : t.col_spacing)) != null ? Si : i.insertColumnSpacing);
	const m = Fo((Ni = (ki = t.xdata) != null ? ki : t.extendedData) != null ? Ni : t.xData);
	if (m.length > 0 && (i.xdata = m), s === "INSERT" || s === "MINSERT") {
		const Pe = V(t.scale);
		if (Pe) i.scale = Pe;
		else {
			const gt = k((Pi = t.scaleX) != null ? Pi : t.xScale), _t = (Ti = k((Mi = t.scaleY) != null ? Mi : t.yScale)) != null ? Ti : gt, Ri = k((Ai = t.scaleZ) != null ? Ai : t.zScale);
			gt !== void 0 && _t !== void 0 && (i.scale = Ri === void 0 ? {
				x: gt,
				y: _t
			} : {
				x: gt,
				y: _t,
				z: Ri
			});
		}
	}
	const p = $t((Ei = t.vertices) != null ? Ei : t.points);
	p.length > 0 && (i.vertices = p);
	const g = $t((Li = t.controlPoints) != null ? Li : t.control_points);
	g.length > 0 && (i.controlPoints = g);
	const b = $t((Ii = t.fitPoints) != null ? Ii : t.fit_points);
	b.length > 0 && (i.fitPoints = b);
	const y = (Bi = (Di = t.attribs) != null ? Di : t.attributes) != null ? Bi : t.attributeEntities;
	return Array.isArray(y) && (i.attribs = y.filter((Pe) => !!Pe && typeof Pe == "object").map((Pe) => ut(Pe, void 0, n))), (s === "TABLE" || s === "ACAD_TABLE" || s === "ACDBTABLE") && (i.table = Ur(t)), i;
}
function Ur(t) {
	var l, h, u, f, d, m, p, g, b, y, v, x, w, C, N, B, D, I, P, M, T, A, F, _, X, R, O, W, H, G, Q;
	const e = ie((l = t.ldata) != null ? l : t.linkedData), n = ie((h = t.tdata) != null ? h : t.linkedTableData), s = (g = Se((p = (m = (d = (f = (u = t.rowCount) != null ? u : t.rowsCount) != null ? f : t.numRows) != null ? d : t.num_rows) != null ? m : n == null ? void 0 : n.numRows) != null ? p : n == null ? void 0 : n.num_rows)) != null ? g : 0, i = (B = Se((N = (C = (w = (x = (v = (y = (b = t.columnCount) != null ? b : t.columnsCount) != null ? y : t.numColumns) != null ? v : t.numCols) != null ? x : t.num_cols) != null ? w : n == null ? void 0 : n.numColumns) != null ? C : n == null ? void 0 : n.numCols) != null ? N : n == null ? void 0 : n.num_cols)) != null ? B : 0, o = Bo((M = (P = (I = (D = t.cells) != null ? D : t.tableCells) != null ? I : t.cellValues) != null ? P : n == null ? void 0 : n.rows) != null ? M : t.data), r = i || Hr(o), a = s || (r > 0 ? Math.ceil(o.length / r) : 0), c = o.map(({ cell: se, index: he }) => Vr(se, he, r));
	return {
		name: E((F = (A = (T = t.tableName) != null ? T : t.name) != null ? A : e == null ? void 0 : e.name) != null ? F : e == null ? void 0 : e.description),
		rowCount: a,
		columnCount: r,
		cells: c,
		rowHeights: $i((X = (_ = t.rowHeights) != null ? _ : t.rowHeightArr) != null ? X : t.row_heights),
		columnWidths: $i((O = (R = t.columnWidths) != null ? R : t.columnWidthArr) != null ? O : t.col_widths),
		dataLinkHandle: rt((H = (W = t.dataLinkHandle) != null ? W : t.dataLink) != null ? H : t.data_link),
		titleSuppressed: At((G = t.titleSuppressed) != null ? G : t.title_suppressed),
		headerSuppressed: At((Q = t.headerSuppressed) != null ? Q : t.header_suppressed)
	};
}
function V(t) {
	var r, a, c, l, h, u;
	if (!t || typeof t != "object") return;
	const e = t, n = Number((a = (r = e.x) != null ? r : e.X) != null ? a : e[0]), s = Number((l = (c = e.y) != null ? c : e.Y) != null ? l : e[1]), i = (u = (h = e.z) != null ? h : e.Z) != null ? u : e[2], o = i === void 0 ? void 0 : Number(i);
	if (!(!Number.isFinite(n) || !Number.isFinite(s))) return Number.isFinite(o) ? {
		x: n,
		y: s,
		z: o
	} : {
		x: n,
		y: s
	};
}
function $t(t) {
	var n, s;
	if (!Array.isArray(t)) return [];
	const e = [];
	for (const i of t) {
		const o = V(i);
		if (!o) continue;
		const r = i, a = o, c = k(r.bulge);
		c !== void 0 && (a.bulge = c);
		const l = k((n = r.startWidth) != null ? n : r.start_width);
		l !== void 0 && (a.startWidth = l);
		const h = k((s = r.endWidth) != null ? s : r.end_width);
		h !== void 0 && (a.endWidth = h), e.push(a);
	}
	return e;
}
function Ze(t) {
	var n, s, i, o;
	const e = {};
	for (const r of t.entities) {
		const a = String((n = r.type) != null ? n : "UNKNOWN").toUpperCase();
		e[a] = ((s = e[a]) != null ? s : 0) + 1;
	}
	return {
		format: t.format,
		sourceName: t.sourceName,
		entityCount: t.entities.length,
		layerCount: Object.keys(t.layers).length,
		blockCount: Object.keys(t.blocks).length,
		pageCount: (o = (i = t.pages) == null ? void 0 : i.length) != null ? o : 0,
		byType: e,
		warnings: [...t.warnings]
	};
}
function Lo(t) {
	var l, h, u;
	if (t.isClosed === !0) return !0;
	const e = String((l = t.type) != null ? l : "").toUpperCase(), n = Number((h = t.flag) != null ? h : 0), s = e === "LWPOLYLINE", i = /^(POLYLINE|POLYLINE_2D|POLYLINE2D|POLYLINE_3D|POLYLINE3D)$/.test(e);
	if (s && (n & 512) === 512 || i && (n & 1) === 1) return !0;
	if (!s && !i) return !1;
	const o = (u = t.vertices) != null ? u : t.points;
	if (!Array.isArray(o) || o.length < 3) return !1;
	const r = o[0], a = o[o.length - 1];
	if (!r || !a) return !1;
	const c = o.reduce((f, d) => Math.max(f, Math.abs(d.x), Math.abs(d.y)), 1);
	return Math.hypot(r.x - a.x, r.y - a.y) <= Math.max(1e-9, c * 1e-12);
}
function Io(t) {
	var n;
	let e = Xt(t.constantWidth);
	for (const s of (n = t.vertices) != null ? n : []) e = Math.max(e, Xt(s.startWidth), Xt(s.endWidth));
	return e;
}
function Jt(t, e) {
	e.name && (t[e.name] = e, t[e.name.toLowerCase()] = e);
}
function Do(t, e) {
	e.name && (t[e.name] = e, t[e.name.toLowerCase()] = e);
}
function Yr(t) {
	return t != null && t.length ? t.flatMap((e) => e.entities.map((n) => ({
		...n,
		pageIndex: e.index
	}))) : [];
}
function k(t) {
	const e = Number(t);
	return Number.isFinite(e) ? e : void 0;
}
function E(t) {
	if (typeof t != "string" && typeof t != "number") return;
	const e = String(t);
	return e.length > 0 ? e : void 0;
}
function ie(t) {
	return t && typeof t == "object" && !Array.isArray(t) ? t : void 0;
}
function Se(t) {
	const e = k(t);
	if (!(e === void 0 || e <= 0)) return Math.max(1, Math.trunc(e));
}
function At(t) {
	if (typeof t == "boolean") return t;
	if (t === 0 || t === "0") return !1;
	if (t === 1 || t === "1") return !0;
}
function $i(t) {
	if (!Array.isArray(t)) return;
	const e = t.map(k).filter((n) => n !== void 0);
	return e.length > 0 ? e : void 0;
}
function rt(t) {
	var e, n, s, i, o, r;
	if (Array.isArray(t)) return E((n = (e = t[3]) != null ? e : t[2]) != null ? n : t[t.length - 1]);
	if (t && typeof t == "object") {
		const a = t;
		return E((r = (o = (i = (s = a.absolute_ref) != null ? s : a.absoluteRef) != null ? i : a.handle) != null ? o : a.id) != null ? r : a.value);
	}
	return E(t);
}
function Bo(t) {
	var s, i, o;
	if (!Array.isArray(t)) {
		const r = ie(t), a = (i = (s = r == null ? void 0 : r.rows) != null ? s : r == null ? void 0 : r.values) != null ? i : r == null ? void 0 : r.cells;
		return Array.isArray(a) ? Bo(a) : [];
	}
	const e = [];
	let n = 0;
	for (const r of t) {
		if (Array.isArray(r)) {
			for (const l of r) e.push({
				cell: l,
				index: n++
			});
			continue;
		}
		const a = ie(r), c = (o = a == null ? void 0 : a.cells) != null ? o : a == null ? void 0 : a.values;
		if (Array.isArray(c) && !("text" in (a != null ? a : {})) && !("value" in (a != null ? a : {}))) {
			for (const l of c) e.push({
				cell: l,
				index: n++
			});
			continue;
		}
		e.push({
			cell: r,
			index: n++
		});
	}
	return e;
}
function Hr(t) {
	var n, s, i;
	let e = -1;
	for (const { cell: o } of t) {
		const r = ie(o), a = k((i = (s = (n = r == null ? void 0 : r.column) != null ? n : r == null ? void 0 : r.columnIndex) != null ? s : r == null ? void 0 : r.col) != null ? i : r == null ? void 0 : r.column_index);
		a !== void 0 && (e = Math.max(e, Math.trunc(a)));
	}
	return e >= 0 ? e + 1 : 0;
}
function Vr(t, e, n) {
	var u, f, d, m, p, g, b, y, v, x, w, C, N, B, D, I, P, M, T, A, F, _, X, R, O, W, H, G, Q, se, he, pe, ge, be, ye, xe, ve, we, Ce;
	const s = ie(t), i = s ? jr(s) : me(t), o = E(s ? (p = (m = (d = (f = (u = s.text) != null ? u : s.textValue) != null ? f : s.text_value) != null ? d : s.valueString) != null ? m : s.value_string) != null ? p : s.displayValue : t), r = o != null ? o : Ro(i), a = Math.max(0, Math.trunc((y = k((b = (g = s == null ? void 0 : s.row) != null ? g : s == null ? void 0 : s.rowIndex) != null ? b : s == null ? void 0 : s.row_index)) != null ? y : n > 0 ? Math.floor(e / n) : e)), c = Math.max(0, Math.trunc((C = k((w = (x = (v = s == null ? void 0 : s.column) != null ? v : s == null ? void 0 : s.columnIndex) != null ? x : s == null ? void 0 : s.col) != null ? w : s == null ? void 0 : s.column_index)) != null ? C : n > 0 ? e % n : 0)), l = E((N = s == null ? void 0 : s.attrText) != null ? N : s == null ? void 0 : s.attributeText), h = l ? { value: l } : Gr((B = s == null ? void 0 : s.blockAttributes) != null ? B : s == null ? void 0 : s.attributes);
	return {
		row: a,
		column: c,
		text: r,
		...i !== void 0 ? { value: i } : {},
		...E((D = s == null ? void 0 : s.dataType) != null ? D : s == null ? void 0 : s.typeName) || k((I = s == null ? void 0 : s.cellType) != null ? I : s == null ? void 0 : s.type) !== void 0 ? { dataType: (T = E((P = s == null ? void 0 : s.dataType) != null ? P : s == null ? void 0 : s.typeName)) != null ? T : k((M = s == null ? void 0 : s.cellType) != null ? M : s == null ? void 0 : s.type) } : {},
		...E((A = s == null ? void 0 : s.formula) != null ? A : s == null ? void 0 : s.expression) ? { formula: E((F = s == null ? void 0 : s.formula) != null ? F : s == null ? void 0 : s.expression) } : {},
		...Se((X = (_ = s == null ? void 0 : s.rowSpan) != null ? _ : s == null ? void 0 : s.mergedHeight) != null ? X : s == null ? void 0 : s.merged_height_flag) ? { rowSpan: Se((O = (R = s == null ? void 0 : s.rowSpan) != null ? R : s == null ? void 0 : s.mergedHeight) != null ? O : s == null ? void 0 : s.merged_height_flag) } : {},
		...Se((H = (W = s == null ? void 0 : s.columnSpan) != null ? W : s == null ? void 0 : s.mergedWidth) != null ? H : s == null ? void 0 : s.merged_width_flag) ? { columnSpan: Se((Q = (G = s == null ? void 0 : s.columnSpan) != null ? G : s == null ? void 0 : s.mergedWidth) != null ? Q : s == null ? void 0 : s.merged_width_flag) } : {},
		...At((he = (se = s == null ? void 0 : s.isMerged) != null ? se : s == null ? void 0 : s.mergedValue) != null ? he : s == null ? void 0 : s.is_merged_value) !== void 0 ? { isMerged: At((ge = (pe = s == null ? void 0 : s.isMerged) != null ? pe : s == null ? void 0 : s.mergedValue) != null ? ge : s == null ? void 0 : s.is_merged_value) } : {},
		...k((be = s == null ? void 0 : s.textHeight) != null ? be : s == null ? void 0 : s.text_height) !== void 0 ? { textHeight: k((ye = s == null ? void 0 : s.textHeight) != null ? ye : s == null ? void 0 : s.text_height) } : {},
		...rt((ve = (xe = s == null ? void 0 : s.blockTableRecordId) != null ? xe : s == null ? void 0 : s.blockRecordHandle) != null ? ve : s == null ? void 0 : s.block_handle) ? { blockTableRecordId: rt((Ce = (we = s == null ? void 0 : s.blockTableRecordId) != null ? we : s == null ? void 0 : s.blockRecordHandle) != null ? Ce : s == null ? void 0 : s.block_handle) } : {},
		...h && Object.keys(h).length > 0 ? { blockAttributes: h } : {}
	};
}
function jr(t) {
	const e = ie(t.value), n = [
		e == null ? void 0 : e.valueString,
		e == null ? void 0 : e.value_string,
		e == null ? void 0 : e.dataString,
		e == null ? void 0 : e.data_string,
		e == null ? void 0 : e.dataLong,
		e == null ? void 0 : e.data_long,
		e == null ? void 0 : e.dataDouble,
		e == null ? void 0 : e.data_double,
		e == null ? void 0 : e.dataDate,
		e == null ? void 0 : e.data_date,
		e == null ? void 0 : e.dataPoint,
		e == null ? void 0 : e.data_point,
		e == null ? void 0 : e.data3dPoint,
		e == null ? void 0 : e.data_3dpoint,
		t.rawValue,
		t.value
	];
	for (const s of n) {
		const i = me(s);
		if (i !== void 0 && i !== "") return i;
	}
}
function Ro(t) {
	if (t == null) return "";
	if (typeof t == "string" || typeof t == "number" || typeof t == "boolean") return String(t);
	if (!Array.isArray(t) && typeof t == "object" && "x" in t && "y" in t) {
		const e = t;
		return [
			e.x,
			e.y,
			e.z
		].filter((n) => n !== void 0).join(", ");
	}
	try {
		return JSON.stringify(t);
	} catch (e) {
		return String(t);
	}
}
function Gr(t) {
	var s;
	const e = ie(t);
	if (!e) return;
	const n = {};
	for (const [i, o] of Object.entries(e)) {
		const r = (s = E(o)) != null ? s : Ro(me(o));
		r && (n[i] = r);
	}
	return Object.keys(n).length > 0 ? n : void 0;
}
function Fo(t) {
	var r, a, c, l, h, u;
	if (!t) return [];
	if (Array.isArray(t)) {
		if (t.some((d) => {
			var m, p;
			return ((m = ie(d)) == null ? void 0 : m.appName) !== void 0 || ((p = ie(d)) == null ? void 0 : p.applicationName) !== void 0;
		})) return t.flatMap((d) => Fo(d));
		const f = t.map(xt).filter((d) => !!d);
		return f.length > 0 ? [{ entries: f }] : [];
	}
	const e = ie(t);
	if (!e) return [];
	const n = E((a = (r = e.appName) != null ? r : e.applicationName) != null ? a : e.app), s = Array.isArray(e.customStrings) ? e.customStrings.map((f) => ({
		code: 1e3,
		value: f
	})) : void 0, i = (u = (h = (l = (c = e.entries) != null ? c : e.value) != null ? l : e.values) != null ? h : e.data) != null ? u : s;
	if (Array.isArray(i)) {
		const f = i.map(xt).filter((d) => !!d);
		return f.length > 0 ? [{
			appName: n,
			entries: f
		}] : [];
	}
	if (n) {
		const f = xt(i);
		return f ? [{
			appName: n,
			entries: [f]
		}] : [];
	}
	const o = [];
	for (const [f, d] of Object.entries(e)) {
		const m = (Array.isArray(d) ? d : [d]).map(xt).filter((p) => !!p);
		m.length > 0 && o.push({
			appName: f,
			entries: m
		});
	}
	return o;
}
function xt(t) {
	var s, i, o, r, a, c, l;
	const e = ie(t);
	if (e) {
		const h = me((o = (i = (s = e.value) != null ? s : e.data) != null ? i : e.text) != null ? o : e);
		return h === void 0 ? void 0 : {
			...k((r = e.code) != null ? r : e.groupCode) !== void 0 ? { code: k((a = e.code) != null ? a : e.groupCode) } : {},
			...E((c = e.name) != null ? c : e.key) ? { name: E((l = e.name) != null ? l : e.key) } : {},
			value: h
		};
	}
	const n = me(t);
	return n === void 0 ? void 0 : { value: n };
}
function me(t, e = 0, n = /* @__PURE__ */ new WeakSet()) {
	if (t === null) return null;
	if (typeof t == "string" || typeof t == "boolean") return t;
	if (typeof t == "number") return Number.isFinite(t) ? t : String(t);
	if (typeof t == "bigint") return t.toString();
	if (t instanceof Date) return t.toISOString();
	if (ArrayBuffer.isView(t)) return Array.from(new Uint8Array(t.buffer, t.byteOffset, Math.min(t.byteLength, 65536)));
	if (e >= 12 || !t || typeof t != "object") return;
	if (n.has(t)) return "[Circular]";
	if (n.add(t), Array.isArray(t)) {
		const i = t.slice(0, 1e5).map((o) => me(o, e + 1, n)).filter((o) => o !== void 0);
		return n.delete(t), i;
	}
	const s = {};
	for (const [i, o] of Object.entries(t).slice(0, 1e4)) {
		const r = me(o, e + 1, n);
		r !== void 0 && (s[i] = r);
	}
	return n.delete(t), s;
}
function Xt(t) {
	const e = Math.abs(Number(t));
	return Number.isFinite(e) ? e : 0;
}
function fe() {
	return {
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity
	};
}
function ae(t) {
	return Number.isFinite(t.minX) && Number.isFinite(t.minY) && Number.isFinite(t.maxX) && Number.isFinite(t.maxY) && t.maxX >= t.minX && t.maxY >= t.minY;
}
function K(t, e) {
	L(e) && (t.minX = Math.min(t.minX, e.x), t.minY = Math.min(t.minY, e.y), t.maxX = Math.max(t.maxX, e.x), t.maxY = Math.max(t.maxY, e.y));
}
function qr(t, e, n) {
	if (!L(e) || !Number.isFinite(n)) return;
	const s = Math.abs(n);
	K(t, {
		x: e.x - s,
		y: e.y - s
	}), K(t, {
		x: e.x + s,
		y: e.y + s
	});
}
function Oo(t, e) {
	ae(e) && (K(t, {
		x: e.minX,
		y: e.minY
	}), K(t, {
		x: e.maxX,
		y: e.maxY
	}));
}
function _o(t, e = .02, n = 1e-6) {
	if (!ae(t)) return {
		minX: -10,
		minY: -10,
		maxX: 10,
		maxY: 10
	};
	const s = Math.max((t.maxX - t.minX) * e, n), i = Math.max((t.maxY - t.minY) * e, n);
	return {
		minX: t.minX - s,
		minY: t.minY - i,
		maxX: t.maxX + s,
		maxY: t.maxY + i
	};
}
function L(t) {
	return !!t && typeof t == "object" && Number.isFinite(t.x) && Number.isFinite(t.y);
}
function j(t) {
	return {
		x: t.x,
		y: t.y
	};
}
function Le(t) {
	return t * Math.PI / 180;
}
function at(t, e, n, s, i = !0, o = 64) {
	if (!L(t) || !Number.isFinite(e)) return [];
	let r = n, a = s;
	if (!Number.isFinite(r) || !Number.isFinite(a)) return [];
	(Math.abs(r) > Math.PI * 2 + 1e-6 || Math.abs(a) > Math.PI * 2 + 1e-6) && (r = Le(r), a = Le(a)), i && a < r && (a += Math.PI * 2), !i && r < a && (r += Math.PI * 2);
	const c = a - r, l = Math.max(8, Math.min(256, Math.ceil(Math.abs(c) / (Math.PI * 2) * o))), h = [];
	for (let u = 0; u <= l; u++) {
		const f = r + c * (u / l);
		h.push({
			x: t.x + Math.cos(f) * e,
			y: t.y + Math.sin(f) * e
		});
	}
	return h;
}
function gn(t, e, n = 1, s = 0, i = Math.PI * 2, o = 96) {
	if (!L(t) || !L(e)) return [];
	const r = Math.hypot(e.x, e.y);
	if (!Number.isFinite(r) || r <= 0) return [];
	const a = r * (Number.isFinite(n) && n > 0 ? n : 1), c = Math.atan2(e.y, e.x);
	let l = Number.isFinite(s) ? s : 0, h = Number.isFinite(i) ? i : Math.PI * 2;
	(Math.abs(l) > Math.PI * 2 + 1e-6 || Math.abs(h) > Math.PI * 2 + 1e-6) && (l = Le(l), h = Le(h)), h < l && (h += Math.PI * 2);
	const u = Math.max(12, Math.min(256, Math.ceil(Math.abs(h - l) / (Math.PI * 2) * o))), f = [], d = Math.cos(c), m = Math.sin(c);
	for (let p = 0; p <= u; p++) {
		const g = l + (h - l) * (p / u), b = Math.cos(g) * r, y = Math.sin(g) * a;
		f.push({
			x: t.x + b * d - y * m,
			y: t.y + b * m + y * d
		});
	}
	return f;
}
function $o(t, e, n = 0, s = 16) {
	if (!Number.isFinite(n) || Math.abs(n) < 1e-12) return [j(t), j(e)];
	const i = Math.hypot(e.x - t.x, e.y - t.y);
	if (i <= 1e-12) return [j(t), j(e)];
	const o = 4 * Math.atan(n), r = Math.abs(i / (2 * Math.sin(o / 2))), a = {
		x: (t.x + e.x) / 2,
		y: (t.y + e.y) / 2
	}, c = (e.x - t.x) / i, l = (e.y - t.y) / i, h = n >= 0 ? 1 : -1, u = Math.sqrt(Math.max(r * r - (i / 2) ** 2, 0)), f = {
		x: a.x - h * l * u,
		y: a.y + h * c * u
	};
	return at(f, r, Math.atan2(t.y - f.y, t.x - f.x), Math.atan2(e.y - f.y, e.x - f.x), n >= 0, s);
}
function Xo(t) {
	return t.replace(/\\P/g, `
`).replace(/\\~|\\ /g, " ").replace(/\\[A-Za-z][^;]*;/g, "").replace(/[{}]/g, "").replace(/\\[A-Za-z]/g, "").trim();
}
function Re(t, e, n) {
	return Math.min(n, Math.max(e, t));
}
var Xi = 134217728;
var Wt = 2e6;
var Wi = 5e5;
var Ut = 1048576;
var Kr = 256;
var Zr = 2e4;
var zt = 1e5;
function Jr(t) {
	var p;
	const e = [], n = ta(ea(t, e), e), s = [], i = /* @__PURE__ */ new Map(), o = [], r = [], a = [], c = [], l = [], h = [];
	let u, f, d = "";
	const m = /* @__PURE__ */ new Map();
	for (const g of n) {
		const b = Qt(g.section, g.blockName), y = va(g, b, m), v = (p = Z(g.pairs, 5)) != null ? p : Z(g.pairs, 105), x = la(g.pairs, e, `${g.type}${v ? ` ${v}` : ""}`);
		if (v && x.length > 0 && i.set(ee(v), x), y && x.length > 0 && o.push({
			handle: v,
			locator: y,
			groups: x
		}), g.section === "ENTITIES" || g.section === "BLOCKS") {
			if (g.type === "INSERT" || g.type === "MINSERT") u = v, f = y, d = b;
			else if (g.type === "ATTRIB") {
				const w = b === d && u ? u : ba(g.pairs), C = b === d ? f : void 0;
				s.push({
					ownerHandle: w,
					ownerLocator: C,
					attribute: na(g, x)
				});
			} else g.type, u = void 0, f = void 0;
			(g.type === "ACAD_TABLE" || g.type === "TABLE") && r.push({
				blockName: g.blockName,
				locator: y,
				entity: sa(g, x)
			});
			continue;
		}
		if (g.section === "OBJECTS") switch (g.type) {
			case "DICTIONARY":
			case "ACDBDICTIONARYWDFLT":
				a.push(ia(g));
				break;
			case "XRECORD":
				c.push(oa(g, e));
				break;
			case "DATALINK":
				l.push(ra(g));
				break;
			case "DATATABLE":
				h.push(aa(g));
				break;
			case "TABLECONTENT": {
				const w = ca(g);
				w && h.push(w);
				break;
			}
		}
	}
	return ha(a, c), {
		attributes: s,
		xdataByHandle: i,
		xdataByLocator: o,
		tables: r,
		dictionaries: a,
		xrecords: c,
		dataLinks: l,
		dataTables: h,
		warnings: e
	};
}
function Qr(t, e) {
	var o, r, a, c, l, h, u, f;
	const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), i = new Set(Object.values(t.blocks));
	zi(t.entities, Qt("ENTITIES"), n, s);
	for (const d of i) zi(d.entities, Qt("BLOCKS", d.name), n, s);
	for (const { ownerHandle: d, ownerLocator: m, attribute: p } of e.attributes) {
		const g = (o = d ? n.get(ee(d)) : void 0) != null ? o : m ? s.get(Pt(m)) : void 0;
		if (!g || g.kind !== "insert" && !/^(INSERT|MINSERT)$/i.test(g.type)) {
			t.warnings.push(`DXF ATTRIB ${(a = (r = p.handle) != null ? r : p.attributeTag) != null ? a : "(unknown)"} could not be matched to its INSERT${d ? ` ${d}` : ""}.`);
			continue;
		}
		const b = (c = g.attribs) != null ? c : g.attribs = [];
		b.some((y) => wa(y, p)) || b.push(p);
	}
	for (const [d, m] of e.xdataByHandle) {
		const p = n.get(d);
		p && (p.xdata = m);
	}
	for (const { handle: d, locator: m, groups: p } of e.xdataByLocator) {
		const g = s.get(Pt(m));
		if (g) g.xdata = p;
		else {
			if (d && n.has(ee(d))) continue;
			t.warnings.push(`DXF XDATA on ${d ? `${m.type} ${d}` : `handleless ${m.type} #${m.ordinal + 1}`} could not be matched to a normalized entity.`);
		}
	}
	for (const { blockName: d, locator: m, entity: p } of e.tables) {
		const g = (l = p.handle ? n.get(ee(p.handle)) : void 0) != null ? l : m ? s.get(Pt(m)) : void 0;
		if (g) {
			g.kind = "table", g.table = p.table, g.xdata = (h = p.xdata) != null ? h : g.xdata;
			continue;
		}
		if (d) {
			const b = (u = t.blocks[d]) != null ? u : t.blocks[d.toLocaleLowerCase()];
			b ? b.entities.push(p) : t.warnings.push(`DXF table ${(f = p.handle) != null ? f : "(unknown)"} belongs to missing block ${d}.`);
		} else t.entities.push(p);
		Yo(p, n);
	}
	e.dictionaries.length > 0 && (t.dictionaries = vt(t.dictionaries, e.dictionaries)), e.xrecords.length > 0 && (t.xrecords = vt(t.xrecords, e.xrecords)), e.dataLinks.length > 0 && (t.dataLinks = vt(t.dataLinks, e.dataLinks)), e.dataTables.length > 0 && (t.dataTables = vt(t.dataTables, e.dataTables)), t.warnings.push(...e.warnings), t.metadata.dxfBusinessData = {
		attributes: e.attributes.length,
		nativeTables: e.tables.length,
		dataTables: e.dataTables.length,
		dataLinks: e.dataLinks.length,
		xrecords: e.xrecords.length
	};
}
function ea(t, e) {
	const n = Math.min(t.length, Xi);
	t.length > n && e.push(`DXF BOM metadata scan was capped at ${Xi.toLocaleString()} characters.`);
	const s = [];
	let i = 0, o = !1;
	const r = () => {
		if (i >= n) return;
		const a = i;
		for (; i < n && t.charCodeAt(i) !== 10 && t.charCodeAt(i) !== 13;) i += 1;
		const c = t.slice(a, i);
		return i < n && t.charCodeAt(i) === 13 && (i += 1), i < n && t.charCodeAt(i) === 10 && (i += 1), c;
	};
	for (; s.length < Wt;) {
		const a = r(), c = r();
		if (a === void 0 || c === void 0) break;
		const l = Number(a.trim());
		if (!Number.isInteger(l)) continue;
		const h = c.length > Ut ? c.slice(0, Ut) : c;
		h.length !== c.length && (o = !0), s.push({
			code: l,
			value: h.trimEnd()
		});
	}
	return s.length >= Wt && i < n && e.push(`DXF BOM metadata scan was capped at ${Wt.toLocaleString()} group-code pairs.`), o && e.push(`One or more DXF metadata values were capped at ${Ut.toLocaleString()} characters.`), s;
}
function ta(t, e) {
	var c;
	const n = [];
	let s = "", i = [], o = !1;
	const r = () => {
		if (i.length === 0 || s === "") {
			i = [];
			return;
		}
		n.length < Wi ? n.push({
			section: s,
			type: i[0].value.trim().toUpperCase(),
			pairs: i
		}) : o = !0, i = [];
	};
	for (let l = 0; l < t.length; l += 1) {
		const h = t[l];
		if (h.code === 0 && h.value.trim().toUpperCase() === "SECTION") {
			r();
			const u = t[l + 1];
			s = (u == null ? void 0 : u.code) === 2 ? u.value.trim().toUpperCase() : "", (u == null ? void 0 : u.code) === 2 && (l += 1);
			continue;
		}
		if (h.code === 0 && h.value.trim().toUpperCase() === "ENDSEC") {
			r(), s = "";
			continue;
		}
		s && (h.code === 0 && r(), i.push(h));
	}
	r(), o && e.push(`DXF BOM metadata scan was capped at ${Wi.toLocaleString()} records.`);
	let a;
	for (const l of n) l.section === "BLOCKS" && (l.type === "BLOCK" ? (a = (c = J(l.pairs, 2)) != null ? c : J(l.pairs, 3), l.blockName = a) : l.type === "ENDBLK" ? (l.blockName = a, a = void 0) : l.blockName = a);
	return n;
}
function na(t, e) {
	var s;
	return ut({
		type: "ATTRIB",
		handle: Z(t.pairs, 5),
		layer: (s = J(t.pairs, 8)) != null ? s : "0",
		text: q(ya(t.pairs, [3, 1])),
		tag: q(J(t.pairs, 2)),
		prompt: q(J(t.pairs, 3)),
		attributeFlags: Y(t.pairs, 70),
		insertionPoint: Uo(t.pairs, 10),
		textHeight: Y(t.pairs, 40),
		rotation: Sa(Y(t.pairs, 50)),
		isVisible: Y(t.pairs, 60) !== 1,
		xdata: e
	}, "ATTRIB", { includeUnknownProperties: !1 });
}
function sa(t, e) {
	var l, h;
	const n = ke(t.pairs, "AcDbTable"), s = ct(Y(n, 91), 5e3), i = ct(Y(n, 92), 5e3), o = Math.min(1e6, s * i), r = [];
	for (let u = 0; u < n.length; u += 1) n[u].code === 171 && r.push(u);
	const a = [];
	if (r.length > 0) for (let u = 0; u < Math.min(o || r.length, r.length); u += 1) {
		const f = n.slice(r[u], (l = r[u + 1]) != null ? l : n.length), d = ga(f);
		a.push({
			row: i > 0 ? Math.floor(u / i) : u,
			column: i > 0 ? u % i : 0,
			text: d,
			dataType: Y(f, 171),
			formula: q(J(f, 300)),
			isMerged: Y(f, 173) === 1,
			blockTableRecordId: Z(f, 340)
		});
	}
	return ut({
		type: "ACAD_TABLE",
		handle: Z(t.pairs, 5),
		layer: (h = J(t.pairs, 8)) != null ? h : "0",
		insertionPoint: Uo(t.pairs, 10),
		blockName: J(ke(t.pairs, "AcDbBlockReference"), 2),
		rowCount: s,
		columnCount: i,
		rowHeights: Ui(n, 141).slice(0, s),
		columnWidths: Ui(n, 142).slice(0, i),
		cells: a,
		xdata: e
	}, "ACAD_TABLE", { includeUnknownProperties: !1 });
}
function ia(t) {
	var n, s;
	const e = [];
	for (let i = 0; i < t.pairs.length; i += 1) {
		if (t.pairs[i].code !== 3) continue;
		const o = t.pairs.slice(i + 1).find((r) => r.code === 350 || r.code === 360 || r.code === 3);
		o && o.code !== 3 && o.value && e.push({
			name: (n = q(t.pairs[i].value)) != null ? n : t.pairs[i].value,
			handle: o.value
		});
	}
	return {
		handle: (s = Z(t.pairs, 5)) != null ? s : Z(t.pairs, 105),
		ownerHandle: Wo(t.pairs),
		entries: e
	};
}
function oa(t, e) {
	var o, r;
	const n = ke(t.pairs, "AcDbXrecord"), s = n.findIndex((a) => a.code === 280), i = n.filter((a, c) => c !== s);
	return i.length > zt && e.push(`DXF XRECORD ${(o = Z(t.pairs, 5)) != null ? o : "(handleless)"} was capped at ${zt.toLocaleString()} values.`), {
		handle: (r = Z(t.pairs, 5)) != null ? r : Z(t.pairs, 105),
		ownerHandle: Wo(t.pairs),
		cloning: Y(n, 280),
		data: i.slice(0, zt).map((a) => ({
			code: a.code,
			value: zo(a)
		}))
	};
}
function ra(t) {
	var h, u, f, d, m;
	const e = ke(t.pairs, "AcDbDataLink"), n = Y(e, 170), s = Y(e, 171), i = Y(e, 172), o = (h = Y(e, 173)) != null ? h : 0, r = (u = Y(e, 174)) != null ? u : 0, a = (f = Y(e, 175)) != null ? f : 0, c = (d = Y(e, 176)) != null ? d : 0, l = n && s && i ? ka(n, s, i, o, r, a, c) : void 0;
	return {
		handle: (m = Z(t.pairs, 5)) != null ? m : Z(t.pairs, 105),
		dataAdapter: q(J(e, 1)),
		description: q(J(e, 300)),
		tooltip: q(J(e, 301)),
		connectionString: q(J(e, 302)),
		updateOption: Y(e, 91),
		pathOption: Y(e, 177),
		updateStatus: q(J(e, 304)),
		lastUpdated: l
	};
}
function aa(t) {
	var r, a, c;
	const e = ke(t.pairs, "AcDbDataTable", "ACDBDATATABLE"), n = ct(Y(e, 90), 1e5), s = ct(Y(e, 91), 1e6), i = [], o = [];
	for (let l = 0; l < e.length; l += 1) e[l].code === 92 && o.push(l);
	for (let l = 0; l < Math.min(n || o.length, o.length); l += 1) {
		const h = e.slice(o[l], (r = o[l + 1]) != null ? r : e.length), u = (a = q(J(h, 2))) != null ? a : `Column ${l + 1}`, f = h.findIndex((p) => p.code === 2), d = ua(h.slice(f + 1)), m = s > 0 ? d.slice(0, s) : d;
		i.push({
			name: u,
			type: Y(h, 92),
			values: m
		});
	}
	return {
		handle: (c = Z(t.pairs, 5)) != null ? c : Z(t.pairs, 105),
		name: q(J(e, 1)),
		rowCount: s || Math.max(0, ...i.map((l) => l.values.length)),
		columnCount: n || i.length,
		columns: i
	};
}
function ca(t) {
	var c;
	const e = ke(t.pairs, "AcDbLinkedTableData");
	if (e.length === 0) return;
	const n = q(J(ke(t.pairs, "AcDbLinkedData"), 1)), s = [];
	for (let l = 0; l < e.length; l += 1) {
		if (e[l].code !== 300 || e[l].value.trim().toUpperCase() !== "VALUE") continue;
		const h = pa(e, l + 1, ["CELLCONTENT_END", "FORMATTEDCELLCONTENT_BEGIN"]), u = ma(e.slice(l + 1, h));
		s.push(u != null ? u : ""), l = Math.max(l, h - 1);
	}
	if (s.length === 0) return;
	const i = fa(e), o = Math.max(1, i.length || da(e, s.length)), r = Math.max(1, Math.ceil(s.length / o)), a = Array.from({ length: o }, (l, h) => {
		var u;
		return {
			name: (u = i[h]) != null ? u : `Column ${h + 1}`,
			values: Array.from({ length: r }, (f, d) => {
				var m;
				return (m = s[d * o + h]) != null ? m : "";
			})
		};
	});
	return {
		handle: (c = Z(t.pairs, 5)) != null ? c : Z(t.pairs, 105),
		name: n,
		rowCount: r,
		columnCount: o,
		columns: a
	};
}
function la(t, e, n) {
	var a, c, l;
	const s = [];
	let i, o = 0, r = !1;
	for (let h = 0; h < t.length; h += 1) {
		const u = t[h];
		if (u.code === 1001) {
			if (s.length >= Kr) {
				i = void 0, r = !0;
				continue;
			}
			i = {
				appName: (a = q(u.value)) != null ? a : u.value,
				entries: []
			}, s.push(i);
		} else if (i && u.code >= 1e3 && u.code <= 1071) {
			if (o >= Zr) {
				r = !0;
				continue;
			}
			let f = zo(u);
			if (u.code >= 1010 && u.code <= 1013) {
				const m = ((c = t[h + 1]) == null ? void 0 : c.code) === u.code + 10 ? t[h + 1] : void 0, p = ((l = t[h + (m ? 2 : 1)]) == null ? void 0 : l.code) === u.code + 20 ? t[h + (m ? 2 : 1)] : void 0, g = Number(u.value), b = Number(m == null ? void 0 : m.value), y = Number(p == null ? void 0 : p.value);
				Number.isFinite(g) && Number.isFinite(b) && (f = Number.isFinite(y) ? {
					x: g,
					y: b,
					z: y
				} : {
					x: g,
					y: b
				}), m && (h += 1), p && (h += 1);
			}
			const d = {
				code: u.code,
				value: f
			};
			i.entries.push(d), o += 1;
		}
	}
	return r && e.push(`DXF XDATA on ${n} exceeded its safe metadata limit and was truncated.`), s.filter((h) => h.entries.length > 0);
}
function ha(t, e) {
	var i;
	const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
	for (const o of t) {
		o.handle && n.set(ee(o.handle), o);
		for (const r of o.entries) s.set(ee(r.handle), {
			name: r.name,
			dictionary: o
		});
	}
	for (const o of e) {
		if (!o.handle) continue;
		const r = s.get(ee(o.handle));
		if (!r) continue;
		o.entryName = r.name;
		const a = [r.name];
		let c = r.dictionary;
		const l = /* @__PURE__ */ new Set();
		for (; c != null && c.handle && !l.has(ee(c.handle));) {
			l.add(ee(c.handle));
			const h = s.get(ee(c.handle));
			if (!h) break;
			a.unshift(h.name), c = n.get(ee((i = h.dictionary.handle) != null ? i : ""));
		}
		o.dictionaryPath = a;
	}
}
function ua(t) {
	var n, s, i;
	const e = [];
	for (let o = 0; o < t.length; o += 1) {
		const r = t[o];
		if (r.code === 71) e.push(r.value.trim() !== "0");
		else if (r.code === 93 || r.code === 40) e.push(jo(r.value));
		else if (r.code === 3) e.push((n = q(r.value)) != null ? n : r.value);
		else if ([
			331,
			360,
			350,
			340,
			330
		].includes(r.code)) e.push(r.value);
		else if (r.code === 10 || r.code === 11) {
			const a = ((s = t[o + 1]) == null ? void 0 : s.code) === r.code + 10 ? t[o + 1] : void 0, c = ((i = t[o + (a ? 2 : 1)]) == null ? void 0 : i.code) === r.code + 20 ? t[o + (a ? 2 : 1)] : void 0, l = Number(r.value), h = Number(a == null ? void 0 : a.value), u = Number(c == null ? void 0 : c.value);
			Number.isFinite(l) && Number.isFinite(h) && e.push(Number.isFinite(u) ? {
				x: l,
				y: h,
				z: u
			} : {
				x: l,
				y: h
			}), a && (o += 1), c && (o += 1);
		}
	}
	return e;
}
function fa(t) {
	var n;
	const e = [];
	for (let s = 0; s < t.length - 1; s += 1) {
		if (t[s].code !== 300) continue;
		const i = t[s + 1];
		i.code === 1 && i.value.trim().toUpperCase() === "LINKEDTABLEDATACOLUMN_BEGIN" && e.push((n = q(t[s].value)) != null ? n : t[s].value);
	}
	return e;
}
function da(t, e) {
	const n = t.find((i, o) => {
		var r;
		return i.code === 90 && ((r = t[o - 1]) == null ? void 0 : r.value) !== "VALUE";
	}), s = ct(n ? Number(n.value) : void 0, 1e5);
	return s > 0 ? Math.min(s, Math.max(1, e)) : 1;
}
function ma(t) {
	var e;
	for (const n of t) if (!(n.code === 300 && /^(VALUE|CONTENTFORMAT|CELLCONTENT)/i.test(n.value))) {
		if ([
			1,
			2,
			3,
			300,
			301,
			302,
			303,
			304
		].includes(n.code)) return (e = q(n.value)) != null ? e : n.value;
		if (n.code >= 10 && n.code <= 59 || n.code >= 90 && n.code <= 99 || n.code >= 170 && n.code <= 179 || n.code >= 270 && n.code <= 299) return jo(n.value);
		if (n.code >= 310 && n.code <= 369) return n.value;
	}
}
function pa(t, e, n) {
	const s = new Set(n.map((i) => i.toUpperCase()));
	for (let i = e; i < t.length; i += 1) if (s.has(t[i].value.trim().toUpperCase())) return i;
	return t.length;
}
function ga(t) {
	var s;
	const e = t.filter((i) => i.code === 302).map((i) => i.value), n = t.filter((i) => i.code === 303 || i.code === 1).map((i) => i.value);
	return (s = q((n.length > 0 ? n : e).join(""))) != null ? s : "";
}
function ke(t, ...e) {
	const n = new Set(e.map((i) => i.toUpperCase()));
	let s = -1;
	for (let i = 0; i < t.length; i += 1) t[i].code === 100 && n.has(t[i].value.trim().toUpperCase()) && (s = i + 1);
	return s >= 0 ? t.slice(s) : t;
}
function ba(t) {
	var n;
	return (n = Z(ke(t, "AcDbAttribute"), 330)) != null ? n : Z(t, 330);
}
function Wo(t) {
	var s, i, o;
	const e = t.findIndex((r) => r.code === 100);
	return (o = (s = t.slice(0, e >= 0 ? e : t.length).filter((r) => r.code === 330).at(-1)) == null ? void 0 : s.value) != null ? o : (i = t.find((r) => r.code === 330)) == null ? void 0 : i.value;
}
function J(t, e) {
	var n;
	return E((n = t.find((s) => s.code === e)) == null ? void 0 : n.value);
}
function ya(t, e) {
	const n = t.filter((s) => e.includes(s.code)).map((s) => s.value);
	return n.length > 0 ? n.join("") : void 0;
}
function Z(t, e) {
	const n = J(t, e);
	return (n == null ? void 0 : n.trim()) || void 0;
}
function Y(t, e) {
	const n = t.find((i) => i.code === e);
	if (!n) return;
	const s = Number(n.value);
	return Number.isFinite(s) ? s : void 0;
}
function Ui(t, e) {
	return t.filter((n) => n.code === e).map((n) => Number(n.value)).filter(Number.isFinite);
}
function Uo(t, e) {
	const n = Y(t, e), s = Y(t, e + 10), i = Y(t, e + 20);
	if (!(n === void 0 || s === void 0)) return i === void 0 ? {
		x: n,
		y: s
	} : {
		x: n,
		y: s,
		z: i
	};
}
function zo(t) {
	var n;
	if (t.code === 290) return t.value.trim() !== "0";
	if (xa(t.code)) return (n = q(t.value)) != null ? n : t.value;
	const e = Number(t.value);
	return Number.isFinite(e) ? e : t.value;
}
function xa(t) {
	return t >= 0 && t <= 9 || t === 100 || t === 101 || t === 102 || t === 105 || t >= 300 && t <= 369 || t >= 390 && t <= 399 || t >= 410 && t <= 419 || t >= 430 && t <= 439 || t >= 470 && t <= 481 || t >= 999 && t <= 1009;
}
function q(t) {
	const e = E(t);
	if (e !== void 0) return e.replace(/\\U\+([0-9a-fA-F]{4,6})/g, (n, s) => {
		const i = Number.parseInt(s, 16);
		return Number.isFinite(i) && i <= 1114111 ? String.fromCodePoint(i) : n;
	}).replace(/%%[cC]/g, "∅").replace(/%%[dD]/g, "°").replace(/%%[pP]/g, "±").replace(/\\P/g, `
`);
}
function Yo(t, e) {
	t.handle && e.set(ee(t.handle), t);
}
function zi(t, e, n, s) {
	var o;
	const i = /* @__PURE__ */ new Map();
	for (const r of t) {
		Yo(r, n);
		const a = Ho(r.type);
		if (!Vo(a)) continue;
		const c = (o = i.get(a)) != null ? o : 0;
		i.set(a, c + 1), s.set(Pt({
			context: e,
			type: a,
			ordinal: c
		}), r);
	}
}
function va(t, e, n) {
	var r;
	if (t.section !== "ENTITIES" && t.section !== "BLOCKS") return;
	const s = Ho(t.type);
	if (!Vo(s)) return;
	const i = `${e}\0${s}`, o = (r = n.get(i)) != null ? r : 0;
	return n.set(i, o + 1), {
		context: e,
		type: s,
		ordinal: o
	};
}
function Ho(t) {
	const e = t.trim().toUpperCase();
	return e === "MINSERT" ? "INSERT" : /^POLYLINE(?:2D|3D|_2D|_3D)?$/.test(e) ? "POLYLINE" : e === "ACAD_TABLE" || e === "ACDBTABLE" ? "TABLE" : e;
}
function Vo(t) {
	return ![
		"",
		"ATTRIB",
		"SEQEND",
		"VERTEX",
		"BLOCK",
		"ENDBLK"
	].includes(t);
}
function Qt(t, e) {
	var n;
	return `${t.trim().toUpperCase()}\0${(n = e == null ? void 0 : e.trim().toUpperCase()) != null ? n : ""}`;
}
function Pt(t) {
	return `${t.context}\0${t.type}\0${t.ordinal}`;
}
function wa(t, e) {
	var n, s, i, o, r, a;
	return t.handle && e.handle ? ee(t.handle) === ee(e.handle) : ((n = t.attributeTag) != null ? n : "").trim().toLocaleUpperCase() === ((s = e.attributeTag) != null ? s : "").trim().toLocaleUpperCase() && ((o = (i = t.text) != null ? i : t.value) != null ? o : "") === ((a = (r = e.text) != null ? r : e.value) != null ? a : "") && Ca(t.insertionPoint, e.insertionPoint);
}
function Ca(t, e) {
	var n, s;
	return !t || !e ? t === e : t.x === e.x && t.y === e.y && ((n = t.z) != null ? n : 0) === ((s = e.z) != null ? s : 0);
}
function ee(t) {
	return t.trim().toUpperCase();
}
function ct(t, e) {
	return !Number.isFinite(t) || t === void 0 || t <= 0 ? 0 : Math.min(e, Math.trunc(t));
}
function Sa(t) {
	return t === void 0 ? void 0 : t * Math.PI / 180;
}
function jo(t) {
	const e = Number(t);
	return Number.isFinite(e) ? e : t;
}
function ka(t, e, n, s, i, o, r) {
	const a = new Date(Date.UTC(t, e - 1, n, s, i, o, r));
	return Number.isNaN(a.getTime()) ? void 0 : a.toISOString();
}
function vt(t, e) {
	const n = [...t != null ? t : []], s = /* @__PURE__ */ new Map();
	n.forEach((i, o) => {
		i.handle && s.set(ee(i.handle), o);
	});
	for (const i of e) {
		const o = i.handle ? ee(i.handle) : void 0, r = o ? s.get(o) : void 0;
		r === void 0 ? (o && s.set(o, n.length), n.push(i)) : n[r] = i;
	}
	return n;
}
var Na = class {
	constructor(e = {}) {
		S(this, "id", "dxf");
		S(this, "label", "DXF / JavaScript parser");
		S(this, "formats", ["dxf"]);
		S(this, "defaults");
		this.defaults = e;
	}
	accepts(e, n) {
		return Fe(e) === "dxf" || Oe(e, n) === "dxf";
	}
	async load(e, n = {}) {
		var u, f;
		const s = {
			...this.defaults,
			...n
		}, i = performance.now(), o = await it(e), r = Da(o, s.dxfEncoding), a = [];
		let c;
		try {
			c = await Pa(r);
		} catch (d) {
			a.push(`dxf-parser failed, using built-in fallback parser: ${d instanceof Error ? d.message : String(d)}`), c = $a(r);
		}
		const l = Ma(c, (f = e.fileName) != null ? f : (u = e.file) == null ? void 0 : u.name, a);
		Qr(l, Jr(r));
		const h = performance.now() - i;
		return {
			document: l,
			raw: c,
			bytes: o.byteLength,
			elapsedMs: h,
			format: "dxf",
			warnings: l.warnings
		};
	}
};
async function Pa(t) {
	var s;
	const e = await import("./dist-CkkLRjQu.js"), n = (s = e.default) != null ? s : e.DxfParser;
	if (!n) throw new Error("dxf-parser did not expose a parser constructor.");
	return new n().parseSync(t);
}
function Ma(t, e, n = []) {
	const s = t && typeof t == "object" ? t : {}, i = Ta(s), o = Aa(s), a = (Array.isArray(s.entities) ? s.entities : []).filter((l) => !!l && typeof l == "object").map((l) => bn(l)), c = pn({
		format: "dxf",
		sourceName: e,
		header: s.header && typeof s.header == "object" ? s.header : {},
		layers: i,
		blocks: o,
		entities: a,
		metadata: { parser: "dxf-parser + cad-viewer normalizer" },
		warnings: n,
		raw: t
	});
	return a.length === 0 && c.warnings.push("DXF file did not expose any ENTITIES."), c;
}
function bn(t) {
	var o, r, a, c, l, h, u, f, d, m, p, g, b, y, v, x, w, C, N, B, D, I, P, M, T, A, F, _, X, R, O, W, H, G, Q, se, he, pe, ge, be, ye, xe, ve, we, Ce, Ve, je, Ge, qe, Ke;
	const e = String((r = (o = t.type) != null ? o : t.entityType) != null ? r : "UNKNOWN").toUpperCase(), n = ut(t, e), s = k((c = (a = t.colorIndex) != null ? a : t.colorNumber) != null ? c : t.aci), i = k(t.color);
	if (n.colorIndex = s != null ? s : i !== void 0 && Math.abs(i) <= 257 ? i : void 0, n.trueColor = (f = (u = (h = (l = t.trueColor) != null ? l : t.true_color) != null ? h : t.colorRGB) != null ? u : t.trueColorValue) != null ? f : i !== void 0 && Math.abs(i) > 257 ? i : void 0, n.layer = (m = E((d = t.layer) != null ? d : t.layerName)) != null ? m : "0", n.isClosed = !!((g = (p = t.shape) != null ? p : t.closed) != null ? g : t.isClosed) || (Number((y = (b = t.flag) != null ? b : t.flags) != null ? y : 0) & 1) === 1, e === "LINE" && (n.startPoint = (B = (C = n.startPoint) != null ? C : V({
		x: (v = t.x1) != null ? v : t.x,
		y: (x = t.y1) != null ? x : t.y,
		z: (w = t.z1) != null ? w : t.z
	})) != null ? B : (N = n.vertices) == null ? void 0 : N[0], n.endPoint = (P = (D = n.endPoint) != null ? D : V({
		x: t.x2,
		y: t.y2,
		z: t.z2
	})) != null ? P : (I = n.vertices) == null ? void 0 : I[1]), (e === "TEXT" || e === "MTEXT" || e === "ATTRIB" || e === "ATTDEF") && (n.insertionPoint = (A = V((T = (M = t.startPoint) != null ? M : t.position) != null ? T : t.insertionPoint)) != null ? A : n.insertionPoint, n.text = (X = _a((_ = (F = t.text) != null ? F : t.string) != null ? _ : t.value)) != null ? X : n.text, n.textHeight = (O = k((R = t.textHeight) != null ? R : t.height)) != null ? O : n.textHeight, n.rotation = Hi((W = t.rotation) != null ? W : t.angle)), (e === "ARC" || e === "ELLIPSE") && (n.startAngle = Vi((H = t.startAngle) != null ? H : t.start_angle), n.endAngle = Vi((G = t.endAngle) != null ? G : t.end_angle)), e === "INSERT") {
		n.blockName = (se = E((Q = t.name) != null ? Q : t.blockName)) != null ? se : n.blockName, n.insertionPoint = (ge = V((pe = (he = t.position) != null ? he : t.insertionPoint) != null ? pe : t.point)) != null ? ge : n.insertionPoint;
		const ce = k((ye = (be = t.xScale) != null ? be : t.scaleX) != null ? ye : t.xscale), ue = k((ve = (xe = t.yScale) != null ? xe : t.scaleY) != null ? ve : t.yscale), Ne = k((Ce = (we = t.zScale) != null ? we : t.scaleZ) != null ? Ce : t.zscale);
		(ce !== void 0 || ue !== void 0 || Ne !== void 0) && (n.scale = {
			x: ce != null ? ce : 1,
			y: (Ve = ue != null ? ue : ce) != null ? Ve : 1,
			z: Ne != null ? Ne : 1
		}), n.rotation = Hi((je = t.rotation) != null ? je : t.angle);
	}
	if (e === "SPLINE") {
		const ce = Et((qe = (Ge = t.controlPoints) != null ? Ge : t.control_points) != null ? qe : t.points);
		ce.length && (n.controlPoints = ce);
		const ue = Et((Ke = t.fitPoints) != null ? Ke : t.fit_points);
		ue.length && (n.fitPoints = ue);
	}
	return e === "HATCH" && (n.loops = Ia(t), n.fillColorIndex = n.colorIndex), (e === "SOLID" || e === "TRACE" || e === "3DFACE") && (n.vertices = La(t), n.fillColorIndex = n.colorIndex), n;
}
function Ta(t) {
	var o, r, a, c, l, h, u, f, d, m, p, g;
	const e = {}, n = t.tables, i = Ea((a = (r = (o = t.layers) != null ? o : n == null ? void 0 : n.layer) != null ? r : n == null ? void 0 : n.LAYER) != null ? a : n == null ? void 0 : n.layers);
	for (const b of i) {
		const y = b, v = E((c = y.name) != null ? c : y.layerName);
		v && Jt(e, {
			name: v,
			color: (h = (l = y.color) != null ? l : y.colorNumber) != null ? h : y.colorIndex,
			colorIndex: k((f = (u = y.colorNumber) != null ? u : y.colorIndex) != null ? f : y.color),
			lineType: E((d = y.lineType) != null ? d : y.linetype),
			isVisible: Number((g = (p = (m = y.colorNumber) != null ? m : y.colorIndex) != null ? p : y.color) != null ? g : 1) >= 0,
			isFrozen: !!y.frozen,
			isLocked: !!y.locked,
			raw: y
		});
	}
	return e[0] || Jt(e, {
		name: "0",
		colorIndex: 7,
		isVisible: !0
	}), e;
}
function Aa(t) {
	const e = {}, n = t.blocks;
	if (!n || typeof n != "object") return e;
	if (Array.isArray(n)) for (const s of n) Yi(e, s);
	else for (const [s, i] of Object.entries(n)) Yi(e, i, s);
	return e;
}
function Yi(t, e, n) {
	var a, c, l, h;
	if (!e || typeof e != "object") return;
	const s = e, i = E((c = (a = s.name) != null ? a : s.blockName) != null ? c : n);
	if (!i) return;
	const r = (Array.isArray(s.entities) ? s.entities : []).filter((u) => !!u && typeof u == "object").map((u) => bn(u));
	Do(t, {
		name: i,
		basePoint: (h = V((l = s.basePoint) != null ? l : s.position)) != null ? h : {
			x: 0,
			y: 0
		},
		entities: r,
		raw: s
	});
}
function Ea(t) {
	if (!t) return [];
	if (Array.isArray(t)) return t;
	if (typeof t != "object") return [];
	const e = t;
	return Array.isArray(e.entries) ? e.entries : Array.isArray(e.records) ? e.records : Array.isArray(e.layers) ? e.layers : Object.values(e).filter((n) => n && typeof n == "object");
}
function Et(t) {
	return Array.isArray(t) ? t.map(V).filter((e) => !!e) : [];
}
function La(t) {
	var s, i, o, r;
	const e = Et((s = t.vertices) != null ? s : t.points);
	if (e.length) return e;
	const n = [];
	for (let a = 0; a < 4; a++) {
		const c = V({
			x: (i = t[`x${a}`]) != null ? i : t[`x${a + 1}`],
			y: (o = t[`y${a}`]) != null ? o : t[`y${a + 1}`],
			z: (r = t[`z${a}`]) != null ? r : t[`z${a + 1}`]
		});
		c && n.push(c);
	}
	return n;
}
function Ia(t) {
	var n, s;
	const e = (s = (n = t.boundaryLoops) != null ? n : t.loops) != null ? s : t.paths;
	if (Array.isArray(e)) return e.map((i) => {
		var a;
		const o = i;
		return {
			vertices: Et((a = o.vertices) != null ? a : o.points),
			isClosed: !0
		};
	}).filter((i) => i.vertices && i.vertices.length > 0);
}
function Hi(t) {
	const e = k(t);
	if (e !== void 0) return Math.abs(e) > Math.PI * 2 + 1e-6 ? Le(e) : e;
}
function Vi(t) {
	const e = k(t);
	if (e !== void 0) return Math.abs(e) > Math.PI * 2 + 1e-6 ? Le(e) : e;
}
function Da(t, e) {
	const n = en(e);
	if (n) return Te(t, n);
	const s = Ba(t);
	if (s) return Te(t, s);
	const i = en(Ra(t));
	if (i) return Te(t, i);
	const o = Te(t, "utf-8");
	return o.includes("�") ? Fa(t) : o;
}
var ji = {
	ANSI_874: "windows-874",
	ANSI_932: "shift_jis",
	ANSI_936: "gb18030",
	ANSI_949: "euc-kr",
	ANSI_950: "big5",
	ANSI_1250: "windows-1250",
	ANSI_1251: "windows-1251",
	ANSI_1252: "windows-1252",
	ANSI_1253: "windows-1253",
	ANSI_1254: "windows-1254",
	ANSI_1255: "windows-1255",
	ANSI_1256: "windows-1256",
	ANSI_1257: "windows-1257",
	ANSI_1258: "windows-1258",
	BIG5: "big5",
	CP874: "windows-874",
	CP932: "shift_jis",
	CP936: "gb18030",
	CP949: "euc-kr",
	CP950: "big5",
	CP1250: "windows-1250",
	CP1251: "windows-1251",
	CP1252: "windows-1252",
	CP1253: "windows-1253",
	CP1254: "windows-1254",
	CP1255: "windows-1255",
	CP1256: "windows-1256",
	CP1257: "windows-1257",
	CP1258: "windows-1258",
	GB18030: "gb18030",
	GB2312: "gb18030",
	GBK: "gb18030",
	SHIFT_JIS: "shift_jis",
	SHIFTJIS: "shift_jis",
	SJIS: "shift_jis",
	UTF8: "utf-8",
	UTF_8: "utf-8",
	UTF16: "utf-16le",
	UTF_16: "utf-16le",
	UTF16LE: "utf-16le",
	UTF_16LE: "utf-16le",
	UTF16BE: "utf-16be",
	UTF_16BE: "utf-16be"
};
function Ba(t) {
	if (t.length >= 3 && t[0] === 239 && t[1] === 187 && t[2] === 191) return "utf-8";
	if (t.length >= 2 && t[0] === 255 && t[1] === 254) return "utf-16le";
	if (t.length >= 2 && t[0] === 254 && t[1] === 255) return "utf-16be";
}
function Ra(t) {
	var s, i, o, r;
	const n = Te(t.subarray(0, Math.min(t.byteLength, 131072)), "iso-8859-1").replace(/\r\n/g, `
`).replace(/\r/g, `
`).split(`
`);
	for (let a = 0; a < n.length - 3; a++) if (!(((s = n[a]) == null ? void 0 : s.trim()) !== "9" || ((i = n[a + 1]) == null ? void 0 : i.trim().toUpperCase()) !== "$DWGCODEPAGE")) for (let c = a + 2; c < Math.min(a + 10, n.length - 1); c += 2) {
		const l = (o = n[c]) == null ? void 0 : o.trim(), h = (r = n[c + 1]) == null ? void 0 : r.trim();
		if (l === "3" && h) return h;
	}
}
function en(t) {
	const e = t == null ? void 0 : t.trim();
	if (!e) return;
	const n = e.replace(/[-\s]+/g, "_").toUpperCase();
	if (ji[n]) return ji[n];
	const s = /^ANSI_(\d{3,4})$/.exec(n);
	if (s) return en(`cp${s[1]}`);
	const i = /^CP(\d{3,4})$/.exec(n);
	return i ? i[1] === "936" ? "gb18030" : i[1] === "950" ? "big5" : i[1] === "932" ? "shift_jis" : i[1] === "949" ? "euc-kr" : `windows-${i[1]}` : e;
}
function Te(t, e) {
	try {
		return new TextDecoder(e, { fatal: !1 }).decode(t);
	} catch (n) {
		return new TextDecoder("utf-8", { fatal: !1 }).decode(t);
	}
}
function Fa(t) {
	const e = [
		"windows-1252",
		"gb18030",
		"big5",
		"shift_jis",
		"euc-kr",
		"iso-8859-1"
	];
	let n = "", s = Number.POSITIVE_INFINITY;
	for (const i of e) {
		const o = Te(t, i), r = Oa(o, i);
		r < s && (s = r, n = o);
	}
	return n || Te(t, "utf-8");
}
function Oa(t, e) {
	const n = Yt(t, /\uFFFD/g), s = Yt(t, /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g), i = Yt(t, /[\u3400-\u9FFF\uF900-\uFAFF]/g), o = t.includes("SECTION") && (t.includes("ENTITIES") || t.includes("HEADER"));
	let r = n * 1e4 + s * 1e3;
	return o && (r -= 500), e === "windows-1252" && (r -= 2), e === "gb18030" && i >= 2 && (r -= 50 + Math.min(i, 200) * 2), r;
}
function Yt(t, e) {
	var n, s;
	return (s = (n = t.match(e)) == null ? void 0 : n.length) != null ? s : 0;
}
function _a(t) {
	const e = E(t);
	if (e !== void 0) return e.replace(/\\U\+([0-9a-fA-F]{4,6})/g, (n, s) => {
		const i = Number.parseInt(s, 16);
		return Number.isFinite(i) && i >= 0 && i <= 1114111 ? String.fromCodePoint(i) : n;
	}).replace(/%%[cC]/g, "∅").replace(/%%[dD]/g, "°").replace(/%%[pP]/g, "±").replace(/\\P/g, `
`);
}
function $a(t) {
	var l, h, u;
	const e = t.replace(/\r\n/g, `
`).replace(/\r/g, `
`).split(`
`), n = [];
	for (let f = 0; f < e.length - 1; f += 2) {
		const d = Number((l = e[f]) == null ? void 0 : l.trim()), m = (h = e[f + 1]) != null ? h : "";
		Number.isFinite(d) && n.push({
			code: d,
			value: m.trimEnd()
		});
	}
	const s = [], i = {};
	let o = "", r = [], a;
	for (let f = 0; f < n.length; f++) {
		const d = n[f];
		if (d.code === 0 && d.value === "SECTION") {
			o = ((u = n[f + 1]) == null ? void 0 : u.code) === 2 ? n[f + 1].value.toUpperCase() : "", f++;
			continue;
		}
		if (d.code === 0 && d.value === "ENDSEC") {
			c(), o = "";
			continue;
		}
		o === "ENTITIES" && (d.code === 0 ? (c(), r = [d]) : r.push(d));
	}
	return c(), {
		header: {},
		tables: {},
		entities: s,
		blocks: i
	};
	function c() {
		var m, p;
		if (!r.length) return;
		const f = (m = r[0]) == null ? void 0 : m.value.toUpperCase();
		if (f === "VERTEX" && a) {
			const g = ne(r, 10, 20, 30);
			g && ((p = a.vertices) != null ? p : a.vertices = []).push({
				...g,
				bulge: $(r, 42)
			}), r = [];
			return;
		}
		if (f === "SEQEND") {
			a && s.push(a), a = void 0, r = [];
			return;
		}
		if (a && (s.push(a), a = void 0), !f || f === "EOF") {
			r = [];
			return;
		}
		const d = Xa(f, r);
		f === "POLYLINE" ? a = d : s.push(d), r = [];
	}
}
function Xa(t, e) {
	var s, i, o, r, a, c, l, h;
	const n = {
		type: t,
		handle: Je(e, 5),
		layer: (s = Je(e, 8)) != null ? s : "0",
		colorIndex: $(e, 62),
		trueColor: $(e, 420),
		lineType: Je(e, 6),
		lineweight: $(e, 370)
	};
	switch (t) {
		case "LINE":
			Object.assign(n, {
				startPoint: ne(e, 10, 20, 30),
				endPoint: ne(e, 11, 21, 31)
			});
			break;
		case "CIRCLE":
			Object.assign(n, {
				center: ne(e, 10, 20, 30),
				radius: $(e, 40)
			});
			break;
		case "ARC":
			Object.assign(n, {
				center: ne(e, 10, 20, 30),
				radius: $(e, 40),
				startAngle: wt($(e, 50)),
				endAngle: wt($(e, 51))
			});
			break;
		case "POINT":
			Object.assign(n, { point: ne(e, 10, 20, 30) });
			break;
		case "TEXT":
		case "MTEXT":
			Object.assign(n, {
				insertionPoint: ne(e, 10, 20, 30),
				text: za(e),
				textHeight: $(e, 40),
				rotation: wt($(e, 50))
			});
			break;
		case "LWPOLYLINE":
			Object.assign(n, {
				vertices: Ua(e),
				flag: $(e, 70),
				isClosed: (Number((i = $(e, 70)) != null ? i : 0) & 1) === 1
			});
			break;
		case "POLYLINE":
			Object.assign(n, {
				vertices: [],
				flag: $(e, 70),
				isClosed: (Number((o = $(e, 70)) != null ? o : 0) & 1) === 1
			});
			break;
		case "ELLIPSE":
			Object.assign(n, {
				center: ne(e, 10, 20, 30),
				majorAxisEndPoint: ne(e, 11, 21, 31),
				axisRatio: $(e, 40),
				startAngle: $(e, 41),
				endAngle: $(e, 42)
			});
			break;
		case "SPLINE":
			Object.assign(n, {
				controlPoints: Wa(e, 10, 20, 30),
				degree: $(e, 71),
				isClosed: (Number((r = $(e, 70)) != null ? r : 0) & 1) === 1
			});
			break;
		case "INSERT":
			Object.assign(n, {
				name: Je(e, 2),
				blockName: Je(e, 2),
				insertionPoint: ne(e, 10, 20, 30),
				rotation: wt($(e, 50)),
				scale: {
					x: (a = $(e, 41)) != null ? a : 1,
					y: (l = (c = $(e, 42)) != null ? c : $(e, 41)) != null ? l : 1,
					z: (h = $(e, 43)) != null ? h : 1
				}
			});
			break;
		case "SOLID":
		case "TRACE":
		case "3DFACE": Object.assign(n, { vertices: [
			ne(e, 10, 20, 30),
			ne(e, 11, 21, 31),
			ne(e, 12, 22, 32),
			ne(e, 13, 23, 33)
		].filter(Boolean) });
	}
	return bn(n);
}
function $(t, e) {
	var i;
	const n = (i = t.find((o) => o.code === e)) == null ? void 0 : i.value, s = Number(n);
	return Number.isFinite(s) ? s : void 0;
}
function Je(t, e) {
	var s;
	const n = (s = t.find((i) => i.code === e)) == null ? void 0 : s.value;
	return n && n.length > 0 ? n : void 0;
}
function ne(t, e, n, s) {
	const i = $(t, e), o = $(t, n), r = $(t, s);
	if (!(i === void 0 || o === void 0)) return r === void 0 ? {
		x: i,
		y: o
	} : {
		x: i,
		y: o,
		z: r
	};
}
function Wa(t, e, n, s) {
	const i = [];
	for (let o = 0; o < t.length; o++) {
		if (t[o].code !== e) continue;
		const r = Number(t[o].value), a = t.slice(o + 1).find((u) => u.code === n), c = t.slice(o + 1).find((u) => u.code === s), l = Number(a == null ? void 0 : a.value), h = Number(c == null ? void 0 : c.value);
		Number.isFinite(r) && Number.isFinite(l) && i.push(Number.isFinite(h) ? {
			x: r,
			y: l,
			z: h
		} : {
			x: r,
			y: l
		});
	}
	return i;
}
function Ua(t) {
	const e = [];
	for (let n = 0; n < t.length; n++) {
		if (t[n].code !== 10) continue;
		const s = Number(t[n].value);
		let i, o;
		for (let r = n + 1; r < t.length && t[r].code !== 10; r++) t[r].code === 20 && (i = Number(t[r].value)), t[r].code === 42 && (o = Number(t[r].value));
		Number.isFinite(s) && Number.isFinite(i) && e.push({
			x: s,
			y: i,
			bulge: Number.isFinite(o) ? o : void 0
		});
	}
	return e;
}
function za(t) {
	const e = t.filter((n) => n.code === 1 || n.code === 3).map((n) => n.value);
	return e.length ? e.join("") : void 0;
}
function wt(t) {
	return typeof t == "number" && Number.isFinite(t) ? Le(t) : void 0;
}
function yn(t) {
	const e = t[0];
	if (!e || !e.width || !e.height) throw new Error("CAD canvas is not ready for capture.");
	const n = e.ownerDocument.createElement("canvas");
	n.width = e.width, n.height = e.height;
	const s = n.getContext("2d");
	if (!s) throw new Error("Canvas 2D is required for CAD capture.");
	for (const i of t) s.drawImage(i, 0, 0, n.width, n.height);
	return n;
}
var Ya = class {
	constructor(e = {}) {
		S(this, "id", "dwf");
		S(this, "label", "DWF/DWFx native viewer powered by dwf-viewer");
		S(this, "formats", [
			"dwf",
			"dwfx",
			"xps"
		]);
		S(this, "nativeRenderer", !0);
		S(this, "defaults");
		S(this, "native");
		S(this, "host");
		S(this, "lastStats");
		this.defaults = e;
	}
	accepts(e, n) {
		const s = Fe(e);
		if (s === "dwf" || s === "dwfx" || s === "xps") return !0;
		const i = Oe(e, n);
		return i === "dwf" || i === "dwfx" || i === "xps";
	}
	async load(e, n = {}) {
		var u, f, d, m, p;
		const s = {
			...this.defaults,
			...n
		}, i = performance.now(), o = (f = e.fileName) != null ? f : (u = e.file) == null ? void 0 : u.name, r = await it(e), a = Ki(Oe(e, r), Fe(e));
		(d = s.onProgress) == null || d.call(s, {
			phase: "parse",
			format: a,
			message: "Opening DWF/DWFx with dwf-viewer…",
			percent: 48
		});
		const c = await openDwfDocument(r, { fileName: o });
		(m = s.onProgress) == null || m.call(s, {
			phase: "normalize",
			format: a,
			message: "Reading DWF pages, sheets and model metadata…",
			percent: 76
		});
		const l = Gi(c, o, a, s.keepRaw === !0), h = performance.now() - i;
		return (p = s.onProgress) == null || p.call(s, {
			phase: "done",
			format: l.format,
			message: "DWF/DWFx document ready.",
			percent: 100,
			elapsedMs: h
		}), {
			document: l,
			raw: s.keepRaw ? c : void 0,
			bytes: r.byteLength,
			elapsedMs: h,
			format: l.format,
			warnings: l.warnings
		};
	}
	async mount(e, n, s = {}) {
		var g, b, y, v, x, w;
		const i = {
			...this.defaults,
			...s
		}, o = performance.now(), r = (b = e.fileName) != null ? b : (g = e.file) == null ? void 0 : g.name, a = await it(e), c = Ki(Oe(e, a), Fe(e)), l = qa(i), h = Zi(i), u = Ka(i, l, h), f = qo(i, l, h);
		(y = i.onProgress) == null || y.call(i, {
			phase: "native-render",
			format: c,
			message: "Mounting native DWF renderer…",
			percent: 28
		}), this.unmount(), this.host = n, n.replaceChildren(), this.native = new DwfViewer(n, u), (v = i.onProgress) == null || v.call(i, {
			phase: "parse",
			format: c,
			message: "Parsing DWF package and page streams…",
			percent: 58
		}), await this.native.load(a, {
			fileName: r,
			...f
		}), (x = i.onProgress) == null || x.call(i, {
			phase: "render",
			format: c,
			message: "Rendering DWF/DWFx with dwf-viewer…",
			percent: 88
		}), this.lastStats = await this.native.render();
		const d = this.native.getDocument(), m = Gi(d, r, c, i.keepRaw === !0);
		m.metadata.loaderMode = "Native DWF", m.metadata.nativeRenderer = "dwf-viewer", m.metadata.nativeRenderStats = this.lastStats ? {
			...this.lastStats,
			warnings: this.lastStats.warnings.length
		} : void 0;
		const p = performance.now() - o;
		return (w = i.onProgress) == null || w.call(i, {
			phase: "done",
			format: m.format,
			message: "DWF/DWFx rendered.",
			percent: 100,
			elapsedMs: p
		}), {
			document: m,
			raw: i.keepRaw ? d : void 0,
			bytes: a.byteLength,
			elapsedMs: p,
			format: m.format,
			warnings: m.warnings
		};
	}
	unmount() {
		var e;
		(e = this.native) == null || e.dispose(), this.native = void 0, this.lastStats = void 0, this.host && this.host.replaceChildren();
	}
	fit() {
		var e;
		(e = this.native) == null || e.fit();
	}
	zoomIn() {
		var n;
		((n = this.native) == null ? void 0 : n.zoomInButton)?.click();
	}
	zoomOut() {
		var n;
		((n = this.native) == null ? void 0 : n.zoomOutButton)?.click();
	}
	resize() {
		var e;
		(e = this.native) == null || e.render();
	}
	setNativeOptions(e) {
		var s, i, o, r, a, c;
		const n = this.native;
		if (n) {
			if (typeof e.dwfBackground == "string") n.background = e.dwfBackground;
			else {
				const l = Zi(e);
				l && (n.background = l);
			}
			typeof e.dwfPreferWebgl == "boolean" && ((s = n.setPreferWebgl) == null || s.call(n, e.dwfPreferWebgl)), typeof e.dwfPreferWasm == "boolean" && ((i = n.setPreferWasm) == null || i.call(n, e.dwfPreferWasm)), e.dwfLineWeightMode && ((o = n.setLineWeightMode) == null || o.call(n, e.dwfLineWeightMode)), (r = n.setMonochromeColor) == null || r.call(n, xn(e)), (a = n.setContrastOptions) == null || a.call(n, Go(e)), Ct(n, "minStrokeCssPx", e.dwfMinStrokeCssPx), Ct(n, "maxOverviewStrokeCssPx", e.dwfMaxOverviewStrokeCssPx), Ct(n, "minTextCssPx", e.dwfMinTextCssPx), Ct(n, "minFilledAreaCssPx", e.dwfMinFilledAreaCssPx), (c = n.render) == null || c.call(n);
		}
	}
	getLastNativeStats() {
		return this.lastStats;
	}
	async captureCanvas() {
		const e = this.native;
		if (!e) throw new Error("No DWF document is loaded.");
		if (await e.render(), await e.render(), this.native !== e) throw new Error("DWF document changed during capture.");
		return yn([e.webglCanvas, e.canvas].filter((s) => {
			var o;
			const i = (o = s.ownerDocument.defaultView) == null ? void 0 : o.getComputedStyle(s);
			return (i == null ? void 0 : i.display) !== "none" && (i == null ? void 0 : i.visibility) !== "hidden";
		}));
	}
};
function Gi(t, e, n, s) {
	var a, c, l, h, u, f, d, m, p;
	const i = qi((a = t == null ? void 0 : t.diagnostics) != null ? a : []), o = ((c = t == null ? void 0 : t.pageData) != null ? c : []).map((g, b) => Ha(g, b));
	for (const g of (l = t == null ? void 0 : t.pageData) != null ? l : []) i.push(...qi(g.diagnostics));
	const r = {
		parser: "dwf-viewer",
		nativeRenderer: "dwf-viewer",
		dwfKind: t == null ? void 0 : t.kind,
		packageEntries: (u = (h = t == null ? void 0 : t.packageEntries) == null ? void 0 : h.length) != null ? u : 0,
		resources: (d = (f = t == null ? void 0 : t.resources) == null ? void 0 : f.length) != null ? d : 0,
		pageKinds: Qa(((m = t == null ? void 0 : t.pageData) != null ? m : []).map((g) => g.kind)),
		pageNames: ((p = t == null ? void 0 : t.pages) != null ? p : []).map((g) => g.name)
	};
	return pn({
		format: n,
		sourceName: e,
		layers: {},
		blocks: {},
		pages: o,
		entities: Yr(o),
		metadata: r,
		warnings: ec(i),
		raw: s ? t : void 0
	});
}
function Ha(t, e) {
	const n = Va(t, e);
	return {
		index: e,
		name: t.name || t.sourcePath || `${e + 1}`,
		width: t.width || 1e3,
		height: t.height || 1e3,
		entities: n
	};
}
function Va(t, e) {
	return t.kind === "w2d-text" ? t.primitives.flatMap((n, s) => ja(n, e, s)) : t.kind === "image" ? [{
		type: "DWF_IMAGE_PAGE",
		kind: "image",
		pageIndex: e,
		width: t.width,
		height: t.height,
		imageSource: t.sourcePath
	}] : t.kind === "w3d-model" ? t.model.meshes.map((n, s) => ({
		id: n.id,
		type: "W3D_MESH",
		kind: "solid",
		pageIndex: e,
		color: n.color ? Ja(n.color) : void 0,
		name: n.name || `mesh-${s + 1}`,
		raw: {
			vertexCount: n.vertexCount,
			triangleCount: n.triangleCount,
			materialId: n.materialId
		}
	})) : t.kind === "xps-fixed-page" ? [{
		type: "XPS_FIXED_PAGE",
		kind: "viewport",
		pageIndex: e,
		width: t.width,
		height: t.height,
		raw: { sourcePath: t.sourcePath }
	}] : [{
		type: "DWF_PAGE",
		kind: "viewport",
		pageIndex: e,
		width: t.width,
		height: t.height,
		raw: { sourcePath: t.sourcePath }
	}];
}
function ja(t, e, n) {
	const s = {
		id: `dwf-${e}-${n}`,
		pageIndex: e,
		color: t.stroke,
		fillColor: t.fill,
		lineweight: t.lineWidth,
		raw: { matrix: t.matrix }
	};
	if (t.type === "polyline" || t.type === "polygon") return [{
		...s,
		type: t.type === "polygon" ? "DWF_POLYGON" : "DWF_POLYLINE",
		kind: "polyline",
		vertices: Ga(t.points),
		isClosed: t.type === "polygon"
	}];
	if (t.type === "path") return [{
		...s,
		type: "DWF_PATH",
		kind: "path",
		commands: t.commands
	}];
	if (t.type === "text") return [{
		...s,
		type: "DWF_TEXT",
		kind: "text",
		insertionPoint: {
			x: t.x,
			y: t.y,
			z: 0
		},
		text: t.text,
		textHeight: t.size
	}];
	if (t.type === "rect") {
		const i = t.x, o = t.y, r = t.width, a = t.height;
		return [{
			...s,
			type: "DWF_RECT",
			kind: "polyline",
			isClosed: !0,
			vertices: [
				{
					x: i,
					y: o,
					z: 0
				},
				{
					x: i + r,
					y: o,
					z: 0
				},
				{
					x: i + r,
					y: o + a,
					z: 0
				},
				{
					x: i,
					y: o + a,
					z: 0
				}
			]
		}];
	}
	return [];
}
function Ga(t) {
	const e = [];
	for (let n = 0; n + 1 < t.length; n += 2) e.push({
		x: t[n],
		y: t[n + 1],
		z: 0
	});
	return e;
}
function qi(t) {
	return t.filter((e) => e.level !== "info").map((e) => `${e.code}: ${e.message}${e.source ? ` (${e.source})` : ""}`);
}
function Ki(t, e) {
	return e === "dwf" || e === "dwfx" || e === "xps" ? e : t === "dwf" || t === "dwfx" || t === "xps" ? t : "dwf";
}
function qa(t) {
	if (t.dwfWasmUrl) return t.dwfWasmUrl;
	if (typeof document == "undefined") return;
	const e = t.wasmPath ? new URL(Za(t.wasmPath), document.baseURI).href : new URL("wasm/", document.baseURI).href;
	return new URL("dwfv-render.wasm", e).href;
}
function Zi(t) {
	var n;
	if (t.dwfBackground) return t.dwfBackground;
	const e = t.canvasOptions;
	return (n = e == null ? void 0 : e.background) != null ? n : "#05070d";
}
function xn(t) {
	var s, i, o;
	const e = t;
	return e.colorMode !== "monochrome" ? void 0 : ((s = e.monochromeColor) == null ? void 0 : s.trim()) || ((o = (i = e.canvasOptions) == null ? void 0 : i.foreground) == null ? void 0 : o.trim()) || "#ffffff";
}
function Go(t) {
	var n, s;
	const e = t.canvasOptions;
	return {
		contrastMode: (n = e == null ? void 0 : e.contrastMode) != null ? n : "adaptive",
		minColorContrast: (s = e == null ? void 0 : e.minColorContrast) != null ? s : 2.4
	};
}
function Ka(t, e, n) {
	var i, o;
	const s = xn(t);
	return {
		...qo(t, e, n),
		maxDevicePixelRatio: (i = t.dwfMaxDevicePixelRatio) != null ? i : 2,
		maxCanvasPixels: (o = t.dwfMaxCanvasPixels) != null ? o : 16777216,
		...s ? { monochromeColor: s } : {}
	};
}
function qo(t, e, n) {
	var i, o, r, a, c;
	const s = xn(t);
	return {
		wasmUrl: e,
		preferWebgl: (i = t.dwfPreferWebgl) != null ? i : !0,
		preferWasm: (o = t.dwfPreferWasm) != null ? o : !0,
		background: n,
		...Go(t),
		maxGpuCacheBytes: (r = t.dwfMaxGpuCacheBytes) != null ? r : 167772160,
		maxCachedScenes: (a = t.dwfMaxCachedScenes) != null ? a : 2,
		lineWeightMode: (c = t.dwfLineWeightMode) != null ? c : "adaptive",
		minStrokeCssPx: t.dwfMinStrokeCssPx,
		maxOverviewStrokeCssPx: t.dwfMaxOverviewStrokeCssPx,
		minTextCssPx: t.dwfMinTextCssPx,
		minFilledAreaCssPx: t.dwfMinFilledAreaCssPx,
		...s ? { monochromeColor: s } : {}
	};
}
function Ct(t, e, n) {
	typeof n == "number" && Number.isFinite(n) && (t[e] = n);
}
function Za(t) {
	return t.endsWith("/") ? t : `${t}/`;
}
function Ja(t) {
	const [e, n, s] = t.map((i) => Math.max(0, Math.min(255, Math.round(i * 255))));
	return `#${Ht(e)}${Ht(n)}${Ht(s)}`;
}
function Ht(t) {
	return t.toString(16).padStart(2, "0");
}
function Qa(t) {
	var n;
	const e = {};
	for (const s of t) e[s] = ((n = e[s]) != null ? n : 0) + 1;
	return e;
}
function ec(t) {
	return Array.from(new Set(t));
}
function tc(t = {}) {
	return new Ir([
		new $r(t),
		new Na(t),
		new Ya(t)
	]);
}
var Ko = [
	"block-attributes",
	"native-table",
	"data-table",
	"xdata",
	"xrecord",
	"text-table"
];
var nc = Ko.filter((t) => t !== "xdata" && t !== "xrecord");
var sc = 1e6;
function ic(t, e = {}) {
	var a;
	const n = oc(e), s = {
		document: t,
		options: n,
		tables: [],
		warnings: [],
		visitedEntities: 0,
		seenEntities: /* @__PURE__ */ new WeakSet(),
		emittedRows: 0,
		stopped: !1
	};
	if (n.sources.has("block-attributes") && De(s, ac(s)), n.sources.has("native-table")) for (const c of cc(s)) De(s, c);
	if (n.sources.has("data-table")) for (const c of hc(s)) De(s, c);
	if (n.sources.has("xdata")) for (const c of fc(s)) De(s, c);
	if (n.sources.has("xrecord")) for (const c of dc(s)) De(s, c);
	if (n.sources.has("text-table") && n.textTables !== !1) for (const c of mc(s)) De(s, c);
	!["dwg", "dxf"].includes(t.format) && s.tables.length === 0 && s.warnings.push({
		code: "unsupported-format",
		message: `${t.format.toUpperCase()} does not expose a normalized component/property model for BOM extraction.`
	});
	const i = {};
	for (const c of s.tables) i[c.source] = ((a = i[c.source]) != null ? a : 0) + 1;
	const o = s.tables.filter((c) => c.source === "block-attributes"), r = on([...s.warnings, ...s.tables.flatMap((c) => c.warnings)]);
	return {
		schemaVersion: 1,
		sourceName: t.sourceName,
		format: t.format,
		tables: s.tables,
		summary: {
			tableCount: s.tables.length,
			rowCount: s.tables.reduce((c, l) => c + l.rows.length, 0),
			sourceCounts: i,
			blockItemCount: o.reduce((c, l) => c + l.rows.length, 0),
			blockQuantity: o.reduce((c, l) => l.rows.reduce((h, u) => {
				var f;
				return Qo(h, (f = u.quantity) != null ? f : 1);
			}, c), 0)
		},
		warnings: r
	};
}
function oc(t) {
	var e, n, s;
	return {
		sources: new Set((n = (e = t.sources) == null ? void 0 : e.filter((i) => Ko.includes(i))) != null ? n : nc),
		textTables: (s = t.textTables) != null ? s : "auto",
		recursiveBlocks: t.recursiveBlocks !== !1,
		aggregateBlocks: t.aggregateBlocks !== !1,
		includeInvisible: t.includeInvisible !== !1,
		includePaperSpace: t.includePaperSpace === !0,
		includeAnonymousBlocks: t.includeAnonymousBlocks === !0,
		maxDepth: Be(t.maxDepth, 16, 1, 128),
		maxEntities: Be(t.maxEntities, 25e4, 1, 2e6),
		maxRows: Be(t.maxRows, 1e5, 1, 1e6),
		maxCells: Be(t.maxCells, 1e6, 1, 5e6),
		minTextTableRows: Be(t.minTextTableRows, 3, 2, 100),
		minTextTableColumns: Be(t.minTextTableColumns, 2, 2, 100),
		textRowTolerance: to(t.textRowTolerance),
		textColumnTolerance: to(t.textColumnTolerance)
	};
}
function De(t, e) {
	if (!e || e.rows.length === 0) return;
	e.warnings = on(e.warnings);
	const n = t.options.maxRows - t.emittedRows;
	if (n <= 0) {
		rc(t, e.source);
		return;
	}
	if (e.rows.length > n) {
		e.rows = e.rows.slice(0, n);
		const s = {
			code: "max-rows",
			source: e.source,
			message: `BOM extraction stopped at the configured ${t.options.maxRows.toLocaleString()} row limit.`
		};
		e.warnings.push(s), t.warnings.push(s), t.stopped = !0;
	}
	e.warnings = on(e.warnings), t.emittedRows += e.rows.length, t.tables.push(e);
}
function Ie(t, e = 0) {
	return Math.max(0, t.options.maxRows - t.emittedRows - e);
}
function rc(t, e) {
	t.stopped || (t.stopped = !0, t.warnings.push({
		code: "max-rows",
		source: e,
		message: `BOM extraction stopped at the configured ${t.options.maxRows.toLocaleString()} row limit.`
	}));
}
function ac(t) {
	const e = [], n = /* @__PURE__ */ new Map(), s = vn(t.document, t.options.includePaperSpace), i = (p, g, b, y) => {
		var T;
		if (t.stopped || !Bt(p, t.options) || !Rt(t, "block-attributes", p) || p.kind !== "insert" && !/^(INSERT|MINSERT)$/i.test(p.type)) return;
		const v = oe((T = p.blockName) != null ? T : p.name) || "(unnamed block)", x = oe(p.effectiveBlockName) || v;
		if (Cc(v) || /^\*/.test(v) && !Sc(v) && !t.options.includeAnonymousBlocks && x === v) return;
		const C = wc(t.document.blocks, v), N = yc(p, C, t.warnings), D = tn(g, kc(p.insertRowCount, p.insertColumnCount)), I = Object.fromEntries(Object.keys(N).map((A) => [wn(A), A])), P = {
			blockName: v,
			effectiveName: x,
			attributes: Nc(N),
			attributeLabels: I,
			quantity: D,
			layers: new Set(p.layer ? [p.layer] : []),
			handles: new Set(p.handle ? [p.handle] : [])
		};
		if (t.options.aggregateBlocks) {
			const A = nn([x.toLocaleUpperCase(), P.attributes]), F = n.get(A);
			if (F) {
				F.quantity = tn(F.quantity, D, !0);
				for (const _ of P.layers) F.layers.add(_);
				for (const _ of P.handles) F.handles.add(_);
			} else n.set(A, P);
		} else e.push(P);
		if (!t.options.recursiveBlocks || !C) {
			t.options.recursiveBlocks && !C && v !== "(unnamed block)" && t.warnings.push({
				code: "missing-block",
				source: "block-attributes",
				blockName: v,
				handle: p.handle,
				message: `Block definition ${v} is missing; the reference is still included.`
			});
			return;
		}
		if (y >= t.options.maxDepth) {
			t.warnings.push({
				code: "max-depth",
				source: "block-attributes",
				blockName: v,
				message: `Stopped recursive block traversal at depth ${t.options.maxDepth}.`
			});
			return;
		}
		const M = C.name.toLocaleUpperCase();
		if (b.includes(M)) {
			t.warnings.push({
				code: "cyclic-block",
				source: "block-attributes",
				blockName: v,
				message: `Skipped cyclic block reference ${[...b, M].join(" → ")}.`
			});
			return;
		}
		for (const A of C.entities) i(A, D, [...b, M], y + 1);
	};
	for (const p of s) i(p, 1, [], 0);
	const o = t.options.aggregateBlocks ? [...n.values()] : e, r = Ie(t), a = o.slice(0, r);
	if (a.length === 0) return;
	const c = /* @__PURE__ */ new Map();
	for (const p of a) for (const [g, b] of Object.entries(p.attributeLabels)) c.has(g) || c.set(g, b);
	const l = [...c.entries()].sort(([p], [g]) => p.localeCompare(g)), h = /* @__PURE__ */ new Set([
		"item",
		"block",
		"quantity",
		"layers"
	]), u = l.map(([p, g]) => ({
		key: ft(Ue(g), h),
		label: g,
		dataType: "string",
		sourceKey: p
	})), f = [
		{
			key: "item",
			label: "Item",
			dataType: "string"
		},
		{
			key: "block",
			label: "Source block",
			dataType: "string"
		},
		{
			key: "quantity",
			label: "Quantity",
			dataType: "number"
		},
		{
			key: "layers",
			label: "Layers",
			dataType: "string"
		},
		...u
	], d = a.sort((p, g) => p.effectiveName.localeCompare(g.effectiveName, void 0, { numeric: !0 })).map((p, g) => {
		var y;
		const b = {
			item: p.effectiveName,
			block: p.blockName,
			quantity: p.quantity,
			layers: [...p.layers].sort().join(", ")
		};
		for (const v of u) b[v.key] = (y = p.attributes[v.sourceKey]) != null ? y : "";
		return {
			id: `block-${g + 1}`,
			cells: b,
			quantity: p.quantity,
			sourceHandles: [...p.handles],
			blockName: p.blockName,
			effectiveBlockName: p.effectiveName,
			layer: [...p.layers].sort().join(", ")
		};
	}), m = [];
	return a.length < o.length && m.push({
		code: "max-rows",
		source: "block-attributes",
		message: `Block BOM rows were capped at the configured ${t.options.maxRows.toLocaleString()} row limit.`
	}), {
		id: "block-attributes",
		name: "Block attributes",
		source: "block-attributes",
		confidence: 1,
		columns: f,
		rows: d,
		warnings: m
	};
}
function cc(t) {
	var o, r;
	const e = [], n = Zo(t.document, t.options.includePaperSpace);
	let s = 0, i = 0;
	for (const a of n) {
		if (t.stopped) break;
		const c = Ie(t, i);
		if (c <= 0) break;
		if (!Bt(a, t.options) || a.kind !== "table" && !/^(TABLE|ACAD_TABLE|ACDBTABLE)$/i.test(a.type)) continue;
		if (s += 1, !Rt(t, "native-table", a)) break;
		const l = a.table;
		if (!l || l.cells.length === 0) {
			const f = {
				code: "empty-native-table",
				source: "native-table",
				handle: a.handle,
				message: `Native table ${(o = a.handle) != null ? o : s} has no cached cells. Modern TABLECONTENT or its external DataLink may not be exposed by the DWG parser.`
			};
			t.warnings.push(f);
			continue;
		}
		const h = [];
		if (l.cells.length > t.options.maxCells) {
			const f = {
				code: "max-cells",
				source: "native-table",
				handle: a.handle,
				message: `Native table cells were capped at ${t.options.maxCells.toLocaleString()} values.`
			};
			h.push(f);
		}
		const u = lc(a, s, (r = t.document.dataLinks) != null ? r : [], h, c, t.options.maxCells);
		u.rows.length > 0 && (i += u.rows.length, e.push(u));
	}
	return e;
}
function lc(t, e, n, s, i, o) {
	var A, F, _, X;
	const r = t.table, a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = Math.max(1, Math.min(o, i + 2));
	let h = 0, u = 0;
	for (let R = 0; R < r.cells.length && R < o; R += 1) {
		const O = r.cells[R];
		if (!eo(O.row) || !eo(O.column)) {
			h += 1;
			continue;
		}
		if (!a.has(O.row) && a.size >= l) {
			u += 1;
			continue;
		}
		const W = (A = a.get(O.row)) != null ? A : /* @__PURE__ */ new Map();
		(!W.has(O.column) || !((F = W.get(O.column)) != null && F.text) && O.text) && W.set(O.column, O), a.set(O.row, W), et(O) !== "" && c.add(O.column);
	}
	h > 0 && s.push({
		code: "invalid-table-cell",
		source: "native-table",
		handle: t.handle,
		message: `Ignored ${h.toLocaleString()} native table cell${h === 1 ? "" : "s"} with invalid or extreme coordinates.`
	}), u > 0 && s.push({
		code: "max-rows",
		source: "native-table",
		handle: t.handle,
		message: `Native table rows were capped at the configured ${i.toLocaleString()} row limit.`
	});
	const f = [...a.keys()].sort((R, O) => R - O);
	let d = oe(r.name) || `Native table ${e}`, m = f[0];
	const p = m === void 0 ? void 0 : a.get(m);
	if (p) {
		const R = [...p.values()].filter((O) => et(O) !== "");
		r.titleSuppressed !== !0 && R.length === 1 && f.length > 1 && (d = et(R[0]) || d, m = f[1]);
	}
	const g = Math.max(0, f.indexOf(m)), b = f[g], y = b === void 0 ? void 0 : a.get(b), v = f.slice(g + 1), x = r.headerSuppressed !== !0 && !!y && (r.headerSuppressed === !1 || Mc(y, v.map((R) => a.get(R)))), w = x ? v : f.slice(g), C = w.slice(0, Math.min(i, o)), N = [...c].sort((R, O) => R - O), B = Math.max(1, Math.floor(o / Math.max(1, C.length))), D = N.slice(0, B);
	w.length > C.length && s.push({
		code: "max-rows",
		source: "native-table",
		handle: t.handle,
		message: `Native table rows were capped at the configured ${i.toLocaleString()} row limit.`
	}), D.length < N.length && s.push({
		code: "max-cells",
		source: "native-table",
		handle: t.handle,
		message: `Native table output was capped at ${o.toLocaleString()} cells.`
	});
	const I = /* @__PURE__ */ new Set(), P = D.map((R, O) => {
		const H = (x ? et(y == null ? void 0 : y.get(R)) : "") || `Column ${O + 1}`;
		return {
			key: ft(Ue(H), I),
			label: H,
			dataType: Cn(C.map((G) => {
				var Q;
				return sn((Q = a.get(G)) == null ? void 0 : Q.get(R));
			})),
			sourceKey: String(R)
		};
	}), M = [];
	for (const R of C) {
		if (M.length >= i) break;
		const O = a.get(R), W = {};
		let H = !1;
		for (const G of P) {
			const se = sn(O.get(Number(G.sourceKey)));
			W[G.key] = se, se !== "" && (H = !0);
		}
		H && M.push({
			id: `native-${(_ = t.handle) != null ? _ : e}-${R}`,
			cells: W,
			sourceHandles: t.handle ? [t.handle] : void 0
		});
	}
	const T = r.dataLinkHandle ? n.find((R) => Dc(R.handle, r.dataLinkHandle)) : void 0;
	return r.dataLinkHandle && !T && s.push({
		code: "external-data-unavailable",
		source: "native-table",
		handle: t.handle,
		message: `Table references DataLink ${r.dataLinkHandle}, but no link metadata or external workbook was embedded. Cached cells are returned without network access.`
	}), {
		id: `native-table-${(X = t.handle) != null ? X : e}`,
		name: d,
		source: "native-table",
		confidence: 1,
		columns: P,
		rows: M,
		handle: t.handle,
		dataLink: T,
		warnings: s
	};
}
function hc(t) {
	var s, i;
	const e = [];
	let n = 0;
	for (let o = 0; o < ((i = (s = t.document.dataTables) == null ? void 0 : s.length) != null ? i : 0); o += 1) {
		const r = Ie(t, n);
		if (t.stopped || r <= 0) break;
		const a = uc(t.document.dataTables[o], o, r, t.options.maxCells);
		a.rows.length > 0 && (n += a.rows.length, e.push(a));
	}
	return e;
}
function uc(t, e, n, s) {
	var u, f, d;
	const i = t.columns.slice(0, s);
	let o = 0;
	for (const m of i) o = Math.max(o, m.values.length);
	const r = i.length > 0 ? Math.min(n, s, o) : 0, a = /* @__PURE__ */ new Set(), c = i.map((m, p) => ({
		key: ft(Ue(m.name || `Column ${p + 1}`), a),
		label: m.name || `Column ${p + 1}`,
		dataType: Ac(m.values, r),
		sourceKey: String(p)
	})), l = [];
	for (let m = 0; m < r; m += 1) {
		const p = {};
		let g = !1;
		for (let b = 0; b < c.length; b += 1) {
			const y = dt((u = i[b]) == null ? void 0 : u.values[m]);
			p[c[b].key] = y, y !== "" && (g = !0);
		}
		g && l.push({
			id: `data-${(f = t.handle) != null ? f : e}-${m}`,
			cells: p,
			sourceHandles: t.handle ? [t.handle] : void 0
		});
	}
	const h = [];
	return (i.length < t.columns.length || s < Math.min(n, o)) && h.push({
		code: "max-cells",
		source: "data-table",
		handle: t.handle,
		message: `DataTable columns and values per column were capped at ${s.toLocaleString()} entries.`
	}), r < Math.min(s, o) && h.push({
		code: "max-rows",
		source: "data-table",
		handle: t.handle,
		message: "DataTable rows were capped at the configured BOM row limit."
	}), {
		id: `data-table-${(d = t.handle) != null ? d : e + 1}`,
		name: oe(t.name) || `Data table ${e + 1}`,
		source: "data-table",
		confidence: 1,
		columns: c,
		rows: l,
		handle: t.handle,
		warnings: h
	};
}
function fc(t) {
	var o, r, a;
	const e = /* @__PURE__ */ new Map();
	for (const c of Zo(t.document, t.options.includePaperSpace)) {
		if (t.stopped || !Rt(t, "xdata", c)) break;
		if (Bt(c, t.options)) for (let l = 0; l < ((r = (o = c.xdata) == null ? void 0 : o.length) != null ? r : 0); l += 1) {
			const h = c.xdata[l];
			if (h.entries.length === 0) continue;
			const u = oe(h.appName) || "Unscoped XDATA", f = (a = e.get(u)) != null ? a : [];
			f.push({
				entity: c,
				group: h,
				sequence: l
			}), e.set(u, f);
		}
	}
	const n = [], s = /* @__PURE__ */ new Set();
	let i = 0;
	for (const [c, l] of e) {
		const h = Ie(t, i);
		if (h <= 0) break;
		const u = l.slice(0, h), f = u.map(({ group: x }) => xc(x)), d = [...new Set(f.flatMap((x) => Object.keys(x)))].sort((x, w) => x.localeCompare(w, void 0, { numeric: !0 })), m = /* @__PURE__ */ new Set([
			"entity",
			"type",
			"block",
			"layer"
		]), p = d.map((x) => ({
			key: ft(Ue(x), m),
			label: x,
			dataType: Cn(f.map((w) => {
				var C;
				return (C = w[x]) != null ? C : "";
			})),
			sourceKey: x
		})), g = [
			{
				key: "entity",
				label: "Entity",
				dataType: "string"
			},
			{
				key: "type",
				label: "Type",
				dataType: "string"
			},
			{
				key: "block",
				label: "Block",
				dataType: "string"
			},
			{
				key: "layer",
				label: "Layer",
				dataType: "string"
			},
			...p
		], b = Pc(`xdata-${Ue(c)}`, s), y = u.map(({ entity: x, sequence: w }, C) => {
			var B, D, I, P, M;
			const N = {
				entity: (B = x.handle) != null ? B : String(C + 1),
				type: x.type,
				block: (I = (D = x.effectiveBlockName) != null ? D : x.blockName) != null ? I : "",
				layer: (P = x.layer) != null ? P : ""
			};
			for (const T of p) N[T.key] = (M = f[C][T.sourceKey]) != null ? M : "";
			return {
				id: `${b}-${C}-${w}`,
				cells: N,
				sourceHandles: x.handle ? [x.handle] : void 0
			};
		}), v = [];
		u.length < l.length && v.push({
			code: "max-rows",
			source: "xdata",
			message: "XDATA rows were capped at the configured BOM row limit."
		}), i += y.length, n.push({
			id: b,
			name: c,
			source: "xdata",
			confidence: 1,
			columns: g,
			rows: y,
			warnings: v
		});
	}
	return n;
}
function dc(t) {
	var s, i, o, r, a, c, l;
	const e = [];
	let n = 0;
	for (let h = 0; h < ((i = (s = t.document.xrecords) == null ? void 0 : s.length) != null ? i : 0); h += 1) {
		const u = Ie(t, n);
		if (t.stopped || u <= 0) break;
		const f = t.document.xrecords[h];
		if (f.data.length === 0) continue;
		const d = Math.min(f.data.length, t.options.maxCells, u), m = [];
		t.options.maxCells < Math.min(f.data.length, u) && m.push({
			code: "max-cells",
			source: "xrecord",
			handle: f.handle,
			message: `XRecord groups were capped at ${t.options.maxCells.toLocaleString()} values.`
		}), u < Math.min(f.data.length, t.options.maxCells) && m.push({
			code: "max-rows",
			source: "xrecord",
			handle: f.handle,
			message: "XRecord rows were capped at the configured BOM row limit."
		});
		const p = [];
		for (let b = 0; b < d; b += 1) {
			const y = f.data[b];
			p.push({
				id: `xrecord-${(o = f.handle) != null ? o : h}-${b}`,
				cells: {
					index: b + 1,
					code: (r = y.code) != null ? r : "",
					value: dt(y.value)
				},
				sourceHandles: f.handle ? [f.handle] : void 0
			});
		}
		const g = (a = f.dictionaryPath) == null ? void 0 : a.join(" / ");
		e.push({
			id: `xrecord-${(c = f.handle) != null ? c : h + 1}`,
			name: g || f.entryName || `XRecord ${(l = f.handle) != null ? l : h + 1}`,
			source: "xrecord",
			confidence: 1,
			columns: [
				{
					key: "index",
					label: "#",
					dataType: "number"
				},
				{
					key: "code",
					label: "Group code",
					dataType: "mixed"
				},
				{
					key: "value",
					label: "Value",
					dataType: "mixed"
				}
			],
			rows: p,
			handle: f.handle,
			warnings: m
		}), n += p.length;
	}
	return e;
}
function Ji(t, e, n = Number.POSITIVE_INFINITY) {
	let s = 0, i = t.length;
	for (; s < i;) {
		const r = s + i >>> 1;
		t[r].x < e ? s = r + 1 : i = r;
	}
	let o;
	for (const r of [s - 1, s]) {
		if (r < 0 || r >= t.length) continue;
		const a = Math.abs(t[r].x - e);
		a <= n && (!o || a < o.distance) && (o = {
			column: r,
			distance: a
		});
	}
	return o;
}
function mc(t) {
	var r, a, c, l, h, u, f;
	const e = /* @__PURE__ */ new Map();
	let n = 0;
	for (const d of vn(t.document, t.options.includePaperSpace)) {
		if (t.stopped || !Rt(t, "text-table", d)) break;
		if (!Bt(d, t.options) || !/^(TEXT|MTEXT)$/i.test(d.type)) continue;
		const m = (r = d.insertionPoint) != null ? r : d.startPoint, p = Ec(d.text);
		if (!m || !p || !Lc(d.rotation)) continue;
		if (n >= t.options.maxCells) {
			t.warnings.push({
				code: "max-cells",
				source: "text-table",
				message: `Text-table candidates were capped at ${t.options.maxCells.toLocaleString()} entities.`
			});
			break;
		}
		const g = (a = d.layer) != null ? a : "0", b = (c = e.get(g)) != null ? c : [];
		b.push({
			entity: d,
			text: p,
			x: m.x,
			y: m.y,
			height: Math.max(1e-9, Math.abs((h = (l = d.textHeight) != null ? l : d.height) != null ? h : 1))
		}), e.set(g, b), n += 1;
	}
	const s = [];
	let i = 0, o = 0;
	for (const [d, m] of e) {
		if (Ie(t, o) <= 0) break;
		if (m.length < t.options.minTextTableRows * t.options.minTextTableColumns) continue;
		const g = tt(m.map((x) => x.height)) || 1, b = (u = t.options.textRowTolerance) != null ? u : g * .7, y = (f = t.options.textColumnTolerance) != null ? f : g * 2.2, v = pc(m, b);
		for (const x of gc(v, b)) {
			const w = Ie(t, o);
			if (w <= 0) break;
			const C = bc(x, d, y, t.options, i + 1, w);
			C && (i += 1, o += C.rows.length, s.push(C));
		}
	}
	return s;
}
function pc(t, e) {
	const n = [];
	for (const s of [...t].sort((i, o) => o.y - i.y || i.x - o.x)) {
		let i = n[n.length - 1];
		(!i || Math.abs(i.y - s.y) > e) && (i = {
			y: s.y,
			cells: []
		}, n.push(i));
		const o = i.cells.length;
		i.cells.push(s), i.y = (i.y * o + s.y) / (o + 1);
	}
	return n.map((s) => ({
		...s,
		cells: s.cells.sort((i, o) => i.x - o.x)
	}));
}
function gc(t, e) {
	if (t.length < 2) return t.length ? [t] : [];
	const s = tt(t.slice(1).map((r, a) => Math.abs(t[a].y - r.y)).filter((r) => r > e)) || e * 2, i = Math.max(e * 5, s * 2.6), o = [[]];
	for (let r = 0; r < t.length; r += 1) r > 0 && Math.abs(t[r - 1].y - t[r].y) > i && o.push([]), o[o.length - 1].push(t[r]);
	return o;
}
function bc(t, e, n, s, i, o) {
	if (t.length < s.minTextTableRows || o <= 0) return;
	const r = t.slice(0, Math.max(s.minTextTableRows, o + 1)), a = [], c = r.flatMap((M) => M.cells).sort((M, T) => M.x - T.x);
	for (const M of c) {
		const T = a[a.length - 1];
		T && Math.abs(T.x - M.x) <= n ? (T.x = (T.x * T.count + M.x) / (T.count + 1), T.count += 1) : a.push({
			x: M.x,
			count: 1
		});
	}
	const l = a.filter((M) => M.count >= Math.max(2, Math.ceil(r.length * .45)));
	if (l.length < s.minTextTableColumns) return;
	const h = r.map((M) => {
		var A;
		const T = /* @__PURE__ */ new Map();
		for (const F of M.cells) {
			const _ = Ji(l, F.x, n * 1.5);
			if (!_) continue;
			const X = (A = T.get(_.column)) != null ? A : [];
			X.push(F), T.set(_.column, X);
		}
		return T;
	}), f = h.reduce((M, T) => M + T.size, 0) / Math.max(1, r.length * l.length), d = r.flatMap((M) => M.cells.map((T) => {
		var A, F;
		return (F = (A = Ji(l, T.x)) == null ? void 0 : A.distance) != null ? F : n;
	})), m = 1 - Math.min(1, (tt(d) || 0) / Math.max(n, 1e-9)), p = l.map((M, T) => St(h[0].get(T))), b = Tc(p, h.slice(1).flatMap((M) => l.map((T, A) => St(M.get(A))))), y = tt(h.map((M) => M.size)) || l.length, v = 1 - Math.min(1, tt(h.map((M) => Math.abs(M.size - y))) / Math.max(1, l.length)), x = Ic(f * .42 + m * .28 + v * .15 + b * .15);
	if (x < (s.textTables === !0 ? .48 : .82)) return;
	const C = b >= .56 && r.length > s.minTextTableRows, N = /* @__PURE__ */ new Set(), B = l.map((M, T) => {
		const A = C ? p[T] || `Column ${T + 1}` : `Column ${T + 1}`, F = h.slice(C ? 1 : 0).map((_) => It(St(_.get(T))));
		return {
			key: ft(Ue(A), N),
			label: A,
			dataType: Cn(F),
			sourceKey: String(T)
		};
	}), D = h.slice(C ? 1 : 0), I = [];
	for (let M = 0; M < D.length && !(I.length >= o); M += 1) {
		const T = D[M], A = {}, F = /* @__PURE__ */ new Set();
		let _ = !1;
		for (const X of B) {
			const R = T.get(Number(X.sourceKey)), O = It(St(R));
			A[X.key] = O, O !== "" && (_ = !0);
			for (const W of R != null ? R : []) W.entity.handle && F.add(W.entity.handle);
		}
		_ && I.push({
			id: `text-${i}-${M}`,
			cells: A,
			sourceHandles: [...F]
		});
	}
	const P = [];
	return x < .82 && P.push({
		code: "low-confidence-text-table",
		source: "text-table",
		message: `Text table reconstruction confidence is ${Math.round(x * 100)}%; verify column alignment before using it as a manufacturing BOM.`
	}), (I.length < D.length || r.length < t.length) && P.push({
		code: "max-rows",
		source: "text-table",
		message: "Text table rows were capped at the configured BOM row limit."
	}), {
		id: `text-table-${i}`,
		name: e === "0" ? `Text table ${i}` : `${e} text table`,
		source: "text-table",
		confidence: x,
		columns: B,
		rows: I,
		warnings: P
	};
}
function yc(t, e, n) {
	var r, a;
	const s = /* @__PURE__ */ new Map(), i = (c, l) => {
		var m, p, g, b;
		const h = oe(c.attributeTag);
		if (!h) return;
		const u = wn(h), f = oe((m = c.text) != null ? m : c.value), d = s.get(u);
		d != null && d.instance && l && d.handle && d.handle !== c.handle && n.push({
			code: "duplicate-attribute",
			source: "block-attributes",
			blockName: t.blockName,
			handle: t.handle,
			message: `Duplicate attribute tag ${h} on block ${(g = (p = t.blockName) != null ? p : t.name) != null ? g : "(unnamed)"}. The last instance value is used.`
		}), (!d || l || f) && s.set(u, {
			label: (b = d == null ? void 0 : d.label) != null ? b : h,
			value: f,
			handle: c.handle,
			instance: l
		});
	};
	for (const c of (r = e == null ? void 0 : e.entities) != null ? r : []) /^ATTDEF$/i.test(c.type) && i(c, !1);
	const o = /* @__PURE__ */ new Set();
	for (const c of (a = t.attribs) != null ? a : []) c.handle && o.has(c.handle) || (c.handle && o.add(c.handle), i(c, !0));
	return Object.fromEntries([...s.values()].map(({ label: c, value: l }) => [c, l]));
}
function xc(t) {
	const e = {}, n = (s, i) => {
		if (s === null || typeof s == "string" || typeof s == "number" || typeof s == "boolean") {
			vc(e, i, s);
			return;
		}
		if (Array.isArray(s)) {
			s.forEach((o, r) => n(o, `${i}.${r + 1}`));
			return;
		}
		for (const [o, r] of Object.entries(s)) n(r, `${i}.${o}`);
	};
	return t.entries.forEach((s, i) => {
		const o = oe(s.name) || (s.code !== void 0 ? String(s.code) : `Value ${i + 1}`);
		n(s.value, o);
	}), e;
}
function vc(t, e, n) {
	let s = e, i = 2;
	for (; s in t;) s = `${e} ${i++}`;
	t[s] = n;
}
function vn(t, e) {
	var s;
	const n = [...t.entities];
	if (e) for (const i of (s = t.pages) != null ? s : []) n.push(...i.entities);
	return Jo(n);
}
function Zo(t, e) {
	const n = vn(t, e), s = /* @__PURE__ */ new Set();
	for (const i of Object.values(t.blocks)) s.has(i) || (s.add(i), n.push(...i.entities));
	return Jo(n);
}
function Jo(t) {
	const e = [], n = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
	for (const i of t) {
		if (s.has(i)) continue;
		s.add(i);
		const o = oe(i.handle);
		o && n.has(o.toLocaleUpperCase()) || (o && n.add(o.toLocaleUpperCase()), e.push(i));
	}
	return e;
}
function Bt(t, e) {
	return !(!e.includeInvisible && t.isVisible === !1 || !e.includePaperSpace && t.isInPaperSpace === !0);
}
function Rt(t, e, n) {
	return t.seenEntities.has(n) || (t.seenEntities.add(n), t.visitedEntities += 1, t.visitedEntities <= t.options.maxEntities) ? !0 : (t.warnings.some((s) => s.code === "max-entities") || t.warnings.push({
		code: "max-entities",
		source: e,
		message: `BOM traversal stopped at ${t.options.maxEntities.toLocaleString()} unique entities.`
	}), t.stopped = !0, !1);
}
function wc(t, e) {
	var n, s;
	return (s = (n = t[e]) != null ? n : t[e.toLocaleLowerCase()]) != null ? s : Object.values(t).find((i) => i.name.localeCompare(e, void 0, { sensitivity: "accent" }) === 0);
}
function Cc(t) {
	return /^\*?(MODEL|PAPER)_SPACE(?:\d+)?$/i.test(t) || /^\$(MODEL|PAPER)_SPACE/i.test(t);
}
function Sc(t) {
	return /^\*U/i.test(t);
}
function kc(t, e) {
	return tn(Lt(t), Lt(e));
}
function tn(t, e, n = !1) {
	const s = Lt(t), i = Lt(e);
	return n ? Qo(s, i) : s > Number.MAX_SAFE_INTEGER / i ? Number.MAX_SAFE_INTEGER : s * i;
}
function Qo(t, e) {
	const n = Qi(t), s = Qi(e);
	return n > Number.MAX_SAFE_INTEGER - s ? Number.MAX_SAFE_INTEGER : n + s;
}
function Lt(t) {
	return Number.isFinite(t) ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(t))) : t === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : 1;
}
function Qi(t) {
	return Number.isFinite(t) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(t))) : t === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : 0;
}
function wn(t) {
	return t.trim().toLocaleUpperCase();
}
function Nc(t) {
	return Object.fromEntries(Object.entries(t).map(([e, n]) => [wn(e), n.trim()]).sort(([e], [n]) => e.localeCompare(n)));
}
function nn(t) {
	return t === null || typeof t != "object" ? JSON.stringify(t) : Array.isArray(t) ? `[${t.map(nn).join(",")}]` : `{${Object.entries(t).sort(([e], [n]) => e.localeCompare(n)).map(([e, n]) => `${JSON.stringify(e)}:${nn(n)}`).join(",")}}`;
}
function Ue(t) {
	return t.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "column";
}
function ft(t, e) {
	let n = t, s = 2;
	for (; e.has(n);) n = `${t}_${s++}`;
	return e.add(n), n;
}
function Pc(t, e) {
	let n = t, s = 2;
	for (; e.has(n);) n = `${t}-${s++}`;
	return e.add(n), n;
}
function eo(t) {
	return Number.isSafeInteger(t) && t >= 0 && t <= sc;
}
function et(t) {
	return t ? oe(t.text) || oe(dt(t.value)) : "";
}
function sn(t) {
	if (!t) return "";
	const e = dt(t.value);
	return e === "" ? It(t.text) : e;
}
function Mc(t, e) {
	const n = [...t.values()].map(et).filter(Boolean);
	if (n.length < 2 || new Set(n.map((r) => r.toLocaleUpperCase())).size !== n.length) return !1;
	const s = n.filter((r) => typeof It(r) == "string").length / n.length, i = e.slice(0, 12).flatMap((r) => [...r.values()].map(sn)).filter((r) => r !== ""), o = i.filter((r) => typeof r == "number" || typeof r == "boolean").length / Math.max(1, i.length);
	return s >= .8 && (o >= .15 || n.some(er));
}
function Tc(t, e) {
	const n = t.filter((a) => a !== "");
	if (n.length < 2) return 0;
	const s = new Set(n.map((a) => String(a).toLocaleUpperCase())).size / n.length, i = n.filter((a) => typeof a == "string").length / n.length, o = n.filter((a) => er(String(a))).length / n.length, r = e.filter((a) => a !== "" && (typeof a == "number" || typeof a == "boolean")).length / Math.max(1, e.filter((a) => a !== "").length);
	return Math.min(1, s * .25 + i * .25 + o * .3 + r * .2);
}
function er(t) {
	return /^(item|part|part\s*no|number|no\.?|name|description|material|qty|quantity|count|unit|规格|型号|名称|材料|数量|序号|代号|图号)$/i.test(t.trim());
}
function Cn(t) {
	const e = new Set(t.filter((n) => n !== "" && n !== null).map((n) => typeof n));
	return e.size === 0 || e.size === 1 && e.has("string") ? "string" : e.size === 1 && e.has("number") ? "number" : e.size === 1 && e.has("boolean") ? "boolean" : "mixed";
}
function Ac(t, e) {
	const n = /* @__PURE__ */ new Set(), s = Math.min(t.length, e);
	for (let i = 0; i < s; i += 1) {
		const o = dt(t[i]);
		if (o !== "" && o !== null && n.add(typeof o), n.size > 1) return "mixed";
	}
	return n.size === 0 || n.has("string") ? "string" : n.has("number") ? "number" : n.has("boolean") ? "boolean" : "mixed";
}
function dt(t) {
	if (t == null) return t != null ? t : "";
	if (typeof t == "string" || typeof t == "number" || typeof t == "boolean") return t;
	try {
		return JSON.stringify(t);
	} catch (e) {
		return String(t);
	}
}
function It(t) {
	const e = oe(t);
	if (!e) return "";
	if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(e)) {
		const n = Number(e);
		if (Number.isFinite(n)) return n;
	}
	return /^(true|false)$/i.test(e) ? e.toLocaleLowerCase() === "true" : e;
}
function Ec(t) {
	return oe(t).replace(/\\P/gi, " ").replace(/\{\\[^;{}]+;([^{}]*)\}/g, "$1").replace(/%%[dpc]/gi, " ").replace(/\s+/g, " ").trim();
}
function St(t) {
	return (t != null ? t : []).sort((e, n) => e.x - n.x).map((e) => e.text).join(" ").trim();
}
function Lc(t) {
	if (!Number.isFinite(t)) return !0;
	const e = Math.abs(Number(t) % Math.PI);
	return Math.min(e, Math.abs(Math.PI - e)) <= .06;
}
function tt(t) {
	const e = t.filter(Number.isFinite).sort((s, i) => s - i);
	if (e.length === 0) return 0;
	const n = Math.floor(e.length / 2);
	return e.length % 2 ? e[n] : (e[n - 1] + e[n]) / 2;
}
function Ic(t) {
	return Math.round(Math.max(0, Math.min(1, t)) * 1e3) / 1e3;
}
function Dc(t, e) {
	return !!t && !!e && t.trim().toLocaleUpperCase() === e.trim().toLocaleUpperCase();
}
function oe(t) {
	return typeof t == "string" || typeof t == "number" ? String(t).trim() : "";
}
function to(t) {
	const e = Number(t);
	return Number.isFinite(e) && e > 0 ? e : void 0;
}
function Be(t, e, n, s) {
	const i = Number(t);
	return Number.isFinite(i) ? Math.max(n, Math.min(s, Math.trunc(i))) : e;
}
function on(t) {
	var s, i, o;
	const e = [], n = /* @__PURE__ */ new Set();
	for (const r of t) {
		const a = [
			r.code,
			(s = r.source) != null ? s : "",
			(i = r.handle) != null ? i : "",
			(o = r.blockName) != null ? o : "",
			r.message
		].join("\0");
		n.has(a) || (n.add(a), e.push(r));
	}
	return e;
}
var rn = "cadColorMode";
var Mt = "cadMonochromeColor";
function Rc(t, e = {}) {
	var r;
	const n = (r = e.mode) != null ? r : "source", s = Sn(t), i = tr(e.monochromeColor);
	if (s.mode === n && s.monochromeColor === i) return t;
	const o = { ...t.metadata };
	return n === "monochrome" ? (o[rn] = n, i ? o[Mt] = i : delete o[Mt]) : (delete o[rn], delete o[Mt]), {
		...t,
		metadata: o
	};
}
function Sn(t) {
	const e = t == null ? void 0 : t.metadata, n = (e == null ? void 0 : e[rn]) === "monochrome" ? "monochrome" : "source", s = tr(e == null ? void 0 : e[Mt]);
	return s ? {
		mode: n,
		monochromeColor: s
	} : { mode: n };
}
function tr(t) {
	return typeof t != "string" ? void 0 : t.trim() || void 0;
}
var te = class {
	/**
	* Converts an unsigned byte to a signed byte as used in SHX format.
	* Values > 127 are converted to their signed equivalent (-128 to -1).
	* @param value - The unsigned byte value to convert
	* @returns The signed byte value
	*/
	static byteToSByte(e) {
		return (e & 127) - (e & 128 ? 128 : 0);
	}
	/**
	* Creates a new ShxFileReader instance.
	* @param arraybuffer - The ArrayBuffer to read from
	*/
	constructor(e) {
		this.position = 0, this.data = new DataView(e);
	}
	/**
	* Reads a specified number of bytes from the current position.
	* @param length - Number of bytes to read (optional)
	* @returns A Uint8Array containing the read bytes
	* @throws Error if reading beyond buffer bounds
	*/
	readBytes(e = 1) {
		this.data.byteLength < this.position + e && this.throwOutOfRangeError(this.position + e);
		const n = new Uint8Array(this.data.buffer, this.position, e);
		return this.position += e, n;
	}
	/**
	* Skips a specified number of bytes from the current position.
	* @param length - Number of bytes to skip
	* @throws Error if skipping beyond buffer bounds
	*/
	skip(e) {
		this.data.byteLength < this.position + e && this.throwOutOfRangeError(this.position + e), this.position += e;
	}
	/**
	* Reads an unsigned 8-bit integer.
	* @returns The read uint8 value
	* @throws Error if reading beyond buffer bounds
	*/
	readUint8() {
		this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
		const e = this.data.getUint8(this.position);
		return this.position += 1, e;
	}
	/**
	* Reads a signed 8-bit integer.
	* @returns The read int8 value
	* @throws Error if reading beyond buffer bounds
	*/
	readInt8() {
		this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
		const e = this.data.getInt8(this.position);
		return this.position += 1, e;
	}
	/**
	* Reads an unsigned 16-bit integer.
	* @param littleEndian If false, a big-endian value should be read.
	* @returns The read uint16 value
	* @throws Error if reading beyond buffer bounds
	*/
	readUint16(e = !0) {
		this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
		const n = this.data.getUint16(this.position, e);
		return this.position += 2, n;
	}
	/**
	* Reads a signed 16-bit integer.
	* @returns The read int16 value
	* @throws Error if reading beyond buffer bounds
	*/
	readInt16() {
		this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
		const e = this.data.getInt16(this.position, !0);
		return this.position += 2, e;
	}
	/**
	* Reads an unsigned 32-bit integer.
	* @returns The read uint32 value
	* @throws Error if reading beyond buffer bounds
	*/
	readUint32() {
		this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
		const e = this.data.getUint32(this.position, !0);
		return this.position += 4, e;
	}
	/**
	* Reads a signed 32-bit integer.
	* @returns The read int32 value
	* @throws Error if reading beyond buffer bounds
	*/
	readInt32() {
		this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
		const e = this.data.getInt32(this.position, !0);
		return this.position += 4, e;
	}
	/**
	* Reads a 32-bit floating point number.
	* @returns The read float32 value
	* @throws Error if reading beyond buffer bounds
	*/
	readFloat32() {
		this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
		const e = this.data.getFloat32(this.position, !0);
		return this.position += 4, e;
	}
	/**
	* Reads a 64-bit floating point number.
	* @returns The read float64 value
	* @throws Error if reading beyond buffer bounds
	*/
	readFloat64() {
		this.data.byteLength < this.position + 8 && this.throwOutOfRangeError(this.position + 8);
		const e = this.data.getFloat64(this.position, !0);
		return this.position += 8, e;
	}
	/**
	* Sets the current read position in the buffer.
	* @param position - The new position to set
	*/
	setPosition(e) {
		this.data.byteLength < e && this.throwOutOfRangeError(e), this.position = e;
	}
	/**
	* Checks if the current position is at the end of the buffer.
	* @returns True if at the end of the buffer, false otherwise
	*/
	isEnd() {
		return this.position === this.data.byteLength - 1;
	}
	/**
	* Gets the current position in the buffer.
	* @returns The current position
	*/
	get currentPosition() {
		return this.position;
	}
	/**
	* Gets the total length of the buffer.
	* @returns The buffer length in bytes
	*/
	get length() {
		return this.data.byteLength;
	}
	/**
	* Throws an error when attempting to read beyond buffer bounds.
	* @param position - The position that caused the error
	* @throws Error with details about the out of range access
	*/
	throwOutOfRangeError(e) {
		throw new Error(`Position ${e} is out of range for the data length ${this.data.byteLength}!`);
	}
};
var U = /* @__PURE__ */ ((t) => (t.SHAPES = "shapes", t.BIGFONT = "bigfont", t.UNIFONT = "unifont", t))(U || {});
var Fc = class {
	parse(e) {
		const n = this.parseHeader(e).split(" "), s = n[1].toLocaleLowerCase();
		if (!Object.values(U).includes(s)) throw new Error(`Invalid font type: ${s}`);
		return {
			fileHeader: n[0],
			fontType: s,
			fileVersion: n[2]
		};
	}
	parseHeader(e) {
		let n = "", s = 0;
		for (; e.currentPosition < e.length - 2 && s < 1024;) {
			const i = e.readUint8();
			if (i === 13) {
				const o = e.currentPosition, r = e.readUint8(), a = e.readUint8();
				if (r === 10 && a === 26) break;
				e.setPosition(o), n += String.fromCharCode(i);
			} else n += String.fromCharCode(i);
			s++;
		}
		return n.trim();
	}
};
var ze = 10;
var Oc = [
	13,
	10,
	0
];
function nr(t, e) {
	if (e === 0) {
		t.orientation = "horizontal";
		return;
	}
	if (e === 2) {
		t.orientation = "horizontal", t.dualOrientation = !0;
		return;
	}
	t.orientation = "vertical";
}
function sr(t) {
	const e = {};
	for (const [n, s] of Object.entries(t)) e[s] = n;
	return e;
}
function ir(t) {
	const e = t.indexOf(0);
	return e < 0 ? {
		name: null,
		bytecode: t
	} : {
		name: e > 0 ? new TextDecoder("ascii").decode(t.subarray(0, e)) : null,
		bytecode: t.subarray(e + 1)
	};
}
var _c = class {
	parse(e) {
		try {
			e.readBytes(4);
			const n = e.readInt16();
			if (n <= 0) throw new Error("Invalid shape count in font file");
			const s = [];
			for (let c = 0; c < n; c++) {
				const l = e.readUint16(), h = e.readUint16();
				h > 0 && s.push({
					code: l,
					length: h
				});
			}
			const i = {};
			for (const c of s) try {
				const l = e.readBytes(c.length);
				l.length === c.length && (i[c.code] = l);
			} catch (l) {
				console.warn(`Failed to read shape data for code ${c.code}`);
			}
			const o = {}, r = {};
			for (const [c, l] of Object.entries(i)) {
				const h = Number(c);
				if (h === 0) {
					o[h] = l;
					continue;
				}
				const { name: u, bytecode: f } = ir(l);
				o[h] = f, u && (r[u] = h);
			}
			const a = {
				data: o,
				names: Object.keys(r).length > 0 ? r : void 0,
				codeToName: Object.keys(r).length > 0 ? sr(r) : void 0,
				info: "",
				baseUp: 8,
				baseDown: 2,
				height: ze,
				width: ze,
				orientation: "horizontal",
				isExtended: !1
			};
			if (0 in o) {
				const c = o[0];
				try {
					const l = new TextDecoder().decode(c);
					let h = c.findIndex((u) => Oc.includes(u));
					h >= 0 && (a.info = l.substring(0, h), h + 3 < c.length && (a.baseUp = c[h + 1], a.baseDown = c[h + 2], a.height = a.baseDown + a.baseUp, a.width = a.height, nr(a, c[h + 3])));
				} catch (l) {
					console.warn("Failed to parse font info block");
				}
			}
			return a;
		} catch (n) {
			const s = n instanceof Error ? n.message : String(n);
			throw new Error(`Failed to parse shape font: ${s}`);
		}
	}
};
var $c = class {
	parse(e) {
		try {
			e.readInt16();
			const n = e.readInt16(), s = e.readInt16();
			if (n <= 0) throw new Error("Invalid character count in font file");
			e.skip(s * 4);
			const i = [];
			for (let a = 0; a < n; a++) {
				const c = e.readUint16(), l = e.readUint16(), h = e.readUint32();
				(c !== 0 || l !== 0 || h !== 0) && i.push({
					code: c,
					length: l,
					offset: h
				});
			}
			const o = {};
			for (const a of i) try {
				e.setPosition(a.offset);
				const c = e.readBytes(a.length);
				c.length === a.length && (o[a.code] = c);
			} catch (c) {
				console.warn(`Failed to read bigfont data for code ${a.code}`);
			}
			const r = {
				data: o,
				info: "",
				baseUp: 8,
				baseDown: 2,
				height: ze,
				width: ze,
				orientation: "horizontal",
				isExtended: !1
			};
			if (0 in o) {
				const a = o[0];
				try {
					const c = this.utf8ArrayToStr(a);
					if (c.pos >= 0) {
						let l = c.text;
						for (; l.length > 0 && l.charCodeAt(l.length - 1) === 0;) l = l.slice(0, -1);
						r.info = l;
						const h = this.parseBigfontMetrics(a, c.pos + 1);
						h && Object.assign(r, h);
					}
				} catch (c) {
					console.warn("Failed to parse bigfont info block");
				}
			}
			return r;
		} catch (n) {
			const s = n instanceof Error ? n.message : String(n);
			throw new Error(`Failed to parse big font: ${s}`);
		}
	}
	parseBigfontMetrics(e, n) {
		let s = n;
		for (; s < e.length && e[s] === 0;) s++;
		const i = e.length - s;
		if (i <= 0) return null;
		const o = (r) => r === 0 ? "horizontal" : "vertical";
		if (i >= 5) {
			const r = e[s++];
			s++;
			const a = o(e[s++]);
			return {
				baseUp: r,
				baseDown: 0,
				height: r,
				width: e[s++],
				orientation: a,
				isExtended: !0
			};
		}
		if (i === 4 && e[s + 1] === 0 && e[s + 3] > 0 && e[s + 3] !== e[s]) {
			const r = e[s++];
			s++;
			const a = o(e[s++]);
			return {
				baseUp: r,
				baseDown: 0,
				height: r,
				width: e[s],
				orientation: a,
				isExtended: !0
			};
		}
		if (i === 4) {
			const r = e[s++], a = e[s++], c = o(e[s++]);
			return {
				baseUp: r,
				baseDown: a,
				height: r + a,
				width: r + a,
				orientation: c,
				isExtended: !1
			};
		}
		if (i === 3) {
			const r = e[s++], a = e[s++], c = o(a), l = a === 2;
			return {
				baseUp: r,
				baseDown: 0,
				height: r,
				width: r,
				orientation: c,
				isExtended: l,
				verticalDualMode: l
			};
		}
		return null;
	}
	utf8ArrayToStr(e) {
		let n = "", s = 0;
		for (; s < e.length;) {
			const i = e[s];
			switch (i >> 4) {
				case 0:
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				case 7:
					n += String.fromCharCode(i);
					break;
				case 12:
				case 13: {
					const o = e[s++];
					n += String.fromCharCode((i & 31) << 6 | o & 63);
					break;
				}
				case 14: {
					const o = e[s++], r = e[s++];
					n += String.fromCharCode((i & 15) << 12 | (o & 63) << 6 | (r & 63) << 0);
					break;
				}
			}
			if (n.charCodeAt(n.length - 1) === 0) break;
			s++;
		}
		return {
			text: n,
			pos: s
		};
	}
};
var Xc = class {
	parse(e) {
		try {
			const n = e.readInt32();
			if (n <= 0) throw new Error("Invalid character count in font file");
			const s = e.readInt16(), i = e.readBytes(s), o = {
				data: {},
				info: "",
				baseUp: 8,
				baseDown: 2,
				height: ze,
				width: ze,
				orientation: "horizontal",
				isExtended: !1
			};
			try {
				const c = new TextDecoder().decode(i);
				let l = c.indexOf("\0");
				l >= 0 && (o.info = c.substring(0, l), l + 3 < i.length && (o.baseUp = i[l + 1], o.baseDown = i[l + 2], o.height = o.baseUp + o.baseDown, o.width = o.height, nr(o, i[l + 3])));
			} catch (c) {
				console.warn("Failed to parse unifont info block");
			}
			const r = {}, a = {};
			for (let c = 0; c < n - 1; c++) try {
				const l = e.readUint16(), h = e.readUint16();
				if (h > 0) {
					const u = e.readBytes(h);
					if (u.length === h) {
						const { name: f, bytecode: d } = ir(u);
						d.length > 0 && (r[l] = d, f && (a[f] = l));
					}
				}
			} catch (l) {
				console.warn("Failed to read unifont character data");
				break;
			}
			return o.data = r, o.names = Object.keys(a).length > 0 ? a : void 0, o.codeToName = Object.keys(a).length > 0 ? sr(a) : void 0, o;
		} catch (n) {
			const s = n instanceof Error ? n.message : String(n);
			throw new Error(`Failed to parse unifont: ${s}`);
		}
	}
};
var Wc = class {
	static createParser(e) {
		switch (e) {
			case U.SHAPES: return new _c();
			case U.BIGFONT: return new $c();
			case U.UNIFONT: return new Xc();
			default: throw new Error(`Unsupported font type: ${e}`);
		}
	}
};
var no = .2;
var Uc = class {
	/**
	* Whether the aligned glyph should store the resolved advance as explicit.
	* When false, {@link ShxShape.hasExplicitAdvance} is preserved from the source glyph.
	*/
	markAlignedAdvanceExplicit(e) {
		return !1;
	}
};
var mt = new class Dt extends Uc {
	constructor(e = no) {
		super(), this.cellWidthFactor = e;
	}
	/**
	* True when ink extends left of the glyph origin (UNIFONT center-cell encoding).
	*/
	static isCenterOriginGlyph(e) {
		return e.bbox.minX < -1e-6;
	}
	/**
	* Resolves ink-based advance for a glyph at a scaled cell width.
	*
	* Left-origin glyphs (`minX >= 0`): `maxX + cellWidth * factor`.
	* Center-origin glyphs (`minX < 0`): advance to the right cell edge
	* (`max(maxX, cellWidth / 2)`) plus padding, so narrow centered punctuation
	* keeps trailing whitespace instead of colliding with the next glyph.
	*/
	static computeAdvance(e, n, s = no) {
		if (!e.polylines.some((r) => r.length >= 2)) return n * s;
		const i = n * s, { maxX: o } = e.bbox;
		return Dt.isCenterOriginGlyph(e) ? Math.max(o, n / 2) + i : o + i;
	}
	resolve(e, n) {
		var i;
		var s;
		return e.hasExplicitAdvance ? (i = (s = e.lastPoint) == null ? void 0 : s.x) != null ? i : 0 : Dt.computeAdvance(e, n, this.cellWidthFactor);
	}
	markAlignedAdvanceExplicit(e) {
		return !0;
	}
}();
var z = class z {
	/**
	* Creates a new Point instance.
	* @param x - The x-coordinate (defaults to 0)
	* @param y - The y-coordinate (defaults to 0)
	*/
	constructor(e = 0, n = 0) {
		this.x = e, this.y = n;
	}
	/**
	* Sets the coordinates of the point.
	* @param x - The new x-coordinate
	* @param y - The new y-coordinate
	* @returns The point instance for method chaining
	*/
	set(e, n) {
		return this.x = e, this.y = n, this;
	}
	/**
	* Calculates the length (magnitude) of the vector from origin to this point.
	* @returns The length of the vector
	*/
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	/**
	* Normalizes the point vector to have a length of 1.
	* @returns The point instance for method chaining
	*/
	normalize() {
		const e = this.length();
		return e !== 0 && (this.x /= e, this.y /= e), this;
	}
	/**
	* Creates a new Point instance with the same coordinates.
	* @returns A new Point instance with the same x and y values
	*/
	clone() {
		return new z(this.x, this.y);
	}
	/**
	* Adds another point's coordinates to this point.
	* @param point - The point to add
	* @returns The point instance for method chaining
	*/
	add(e) {
		return this.x += e.x, this.y += e.y, this;
	}
	/**
	* Subtracts another point's coordinates from this point.
	* @param point - The point to subtract
	* @returns The point instance for method chaining
	*/
	subtract(e) {
		return this.x -= e.x, this.y -= e.y, this;
	}
	/**
	* Multiplies both coordinates by a scalar value.
	* @param scalar - The scalar value to multiply by
	* @returns The point instance for method chaining
	*/
	multiply(e) {
		return this.x *= e, this.y *= e, this;
	}
	/**
	* Divides both coordinates by a scalar value.
	* @param scalar - The scalar value to divide by
	* @returns The point instance for method chaining
	*/
	divide(e) {
		return e !== 0 && (this.x /= e, this.y /= e), this;
	}
	/**
	* Multiplies x and y coordinates by different scalar values.
	* @param xScalar - The scalar value to multiply x-coordinate by
	* @param yScalar - The scalar value to multiply y-coordinate by
	* @returns The point instance for method chaining
	*/
	multiplyScalars(e, n) {
		return this.x *= e, this.y *= n, this;
	}
	/**
	* Divides x and y coordinates by different scalar values.
	* @param xScalar - The scalar value to divide x-coordinate by
	* @param yScalar - The scalar value to divide y-coordinate by
	* @returns The point instance for method chaining
	*/
	divideScalars(e, n) {
		return e !== 0 && (this.x /= e), n !== 0 && (this.y /= n), this;
	}
	/**
	* Calculates the Euclidean distance to another point.
	* @param point - The point to calculate distance to
	* @returns The distance between the two points
	*/
	distanceTo(e) {
		const n = this.x - e.x, s = this.y - e.y;
		return Math.sqrt(n * n + s * s);
	}
};
function or(t) {
	const { width: e, capHeight: n, descenderHeight: s, origin: i = "baseline" } = t, o = n + s;
	return i === "top" ? {
		minX: -e / 2,
		maxX: e / 2,
		minY: -o,
		maxY: 0
	} : {
		minX: 0,
		maxX: e,
		minY: -s,
		maxY: n
	};
}
function zc(t) {
	return [
		t.minX,
		t.minY,
		t.maxX,
		t.maxY
	].every(Number.isFinite);
}
function Yc(t, e, n = 1e-6) {
	return e.minX >= t.minX - n && e.maxX <= t.maxX + n && e.minY >= t.minY - n && e.maxY <= t.maxY + n;
}
function Hc(t, e) {
	return {
		minX: Math.min(t.minX, e.minX),
		minY: Math.min(t.minY, e.minY),
		maxX: Math.max(t.maxX, e.maxX),
		maxY: Math.max(t.maxY, e.maxY)
	};
}
function Vc(t, e, n) {
	const s = t.maxX - t.minX, i = t.maxY - t.minY;
	return `<rect x="${t.minX}" y="${-t.maxY}" width="${s}" height="${i}" fill="none" stroke="${e}" stroke-width="${n}"/>`;
}
function so(t, e) {
	const n = t.maxX - t.minX, s = t.maxY - t.minY;
	return `<rect x="${t.minX}" y="${-t.maxY}" width="${n}" height="${s}" fill="${e}"/>`;
}
function jc(t, e, n, s, i, o, r) {
	const a = ` stroke-dasharray="${r}"`;
	return `<line x1="${t}" y1="${-e}" x2="${n}" y2="${-s}" stroke="${i}" stroke-width="${o}"${a}/>`;
}
function Gc(t, e, n) {
	const { capHeight: s, descenderHeight: i, origin: o = "baseline" } = t, r = s + i, a = or(t);
	let c, l, h;
	o === "top" ? (s > 0 && (c = {
		minX: a.minX,
		maxX: a.maxX,
		minY: -s,
		maxY: 0
	}), i > 0 && (l = {
		minX: a.minX,
		maxX: a.maxX,
		minY: -r,
		maxY: -s
	}), h = -s) : (s > 0 && (c = {
		minX: a.minX,
		maxX: a.maxX,
		minY: 0,
		maxY: s
	}), i > 0 && (l = {
		minX: a.minX,
		maxX: a.maxX,
		minY: -i,
		maxY: 0
	}), h = 0);
	const u = [
		c ? so(c, "rgba(255, 0, 0, 0.06)") : "",
		l ? so(l, "rgba(255, 0, 0, 0.14)") : "",
		Vc(a, e, n)
	];
	return h !== void 0 && i > 0 && s > 0 && u.push(jc(a.minX, h, a.maxX, h, e, n, "4 2")), `<g>${u.join("")}</g>`;
}
var _e = class _e {
	constructor(e, n = [], s = !1) {
		this.lastPoint = e, this.polylines = n, this.hasExplicitAdvance = s;
	}
	/**
	* Get the bounding box of the shape
	* @returns Bounding box of the shape
	*/
	get bbox() {
		if (this._bbox) return this._bbox;
		let e = Infinity, n = -Infinity, s = Infinity, i = -Infinity;
		return this.polylines.forEach((o) => {
			o.forEach((r) => {
				e = Math.min(e, r.x), n = Math.max(n, r.x), s = Math.min(s, r.y), i = Math.max(i, r.y);
			});
		}), this._bbox = {
			minX: e,
			minY: s,
			maxX: n,
			maxY: i
		}, this._bbox;
	}
	/**
	* Offset the shape by a point
	* @param p The point to offset the shape by
	* @param isNewInstance Whether to return a new instance of the shape or modify the current instance
	* @returns The offset shape
	*/
	offset(e, n = !0) {
		var s, i;
		return n ? new _e((s = this.lastPoint) == null ? void 0 : s.clone().add(e), this.polylines.map((o) => o.map((r) => r.clone().add(e))), this.hasExplicitAdvance) : ((i = this.lastPoint) == null || i.add(e), this.polylines.forEach((o) => o.forEach((r) => r.add(e))), this._bbox && (this._bbox.maxX += e.x, this._bbox.minX += e.x, this._bbox.maxY += e.y, this._bbox.minY += e.y), this);
	}
	/**
	* Normalizes a shape so that its bounding box’s bottom-left corner moves to the origin (0,0).
	* It doesn’t change the size or orientation, only repositions the shape.
	* @param isNewInstance Whether to return a new instance of the shape or modify the current instance
	* @returns The offset shape
	*/
	normalizeToOrigin(e = !1) {
		const n = this.bbox;
		return this.offset(new z(-n.minX, -n.minY), e);
	}
	/**
	* Converts the shape to an SVG string
	* @param options SVG rendering options
	* @returns SVG string
	*/
	toSVG(e = {}) {
		const { strokeWidth: n = "0.5%", strokeColor: s = "black", isAutoFit: i = !1, fontCell: o } = e;
		let r, a;
		const c = (l) => this.polylines.map((h) => {
			let u = "";
			return h.forEach((f, d) => {
				const { x: m, y: p } = l(f);
				u += d === 0 ? `M ${m} ${p} ` : `L ${m} ${p} `;
			}), `<path d="${u}" stroke="${s}" stroke-width="${n}" fill="none"/>`;
		}).join("");
		if (o) {
			const { padding: l = .1, expandToFit: h = !1, showFrame: u = !1, frameColor: f = "red", frameStrokeWidth: d = "0.5%" } = o, m = or(o), p = this.bbox;
			let g = m;
			h && zc(p) && !Yc(m, p) && (g = Hc(m, p));
			const b = g.maxX - g.minX, y = g.maxY - g.minY, v = b * l, x = y * l, w = g.minX - v, C = g.maxX + v, N = g.minY - x, B = g.maxY + x;
			a = c((I) => ({
				x: I.x,
				y: -I.y
			}));
			const D = u ? Gc(o, f, d) : "";
			return r = `${w} ${-B} ${C - w} ${B - N}`, `<svg width="100%" height="100%" viewBox="${r}" preserveAspectRatio="xMidYMid meet">${D}${a}</svg>`;
		} else if (i) {
			const l = this.bbox, h = .2, u = l.maxX - l.minX, f = l.maxY - l.minY, d = u === 0 ? f : u, m = f === 0 ? u : f, p = l.minX - d * h, g = l.maxX + d * h, b = l.minY - m * h, y = l.maxY + m * h;
			a = c((v) => ({
				x: v.x,
				y: -v.y
			})), r = `${p} ${-y} ${g - p} ${y - b}`;
		} else r = "0 0 20 20", a = c((l) => ({
			x: l.x + 5,
			y: -l.y + 15
		}));
		return `<svg width="100%" height="100%" viewBox="${r}" preserveAspectRatio="xMidYMid meet">${a}</svg>`;
	}
};
var io = 8;
var oo = 48;
var qc = .4;
var Kc = [
	52164,
	45795,
	49829,
	50150,
	54992,
	47610,
	54754,
	46532,
	51906,
	53947,
	49332,
	51706,
	46532,
	54224,
	52946,
	52714,
	52219,
	45755,
	51403,
	46532,
	53947,
	50410,
	49332,
	52219,
	52141,
	46532,
	50150,
	51120,
	50150,
	54992,
	51663,
	50119,
	53186,
	46532,
	46525,
	51365,
	52149,
	47016,
	46532,
	51889,
	51706,
	46025,
	47037,
	55031,
	48122,
	50935,
	47531,
	48122,
	51965,
	55e3
];
function Ft(t, e) {
	const { height: n, width: s, baseUp: i, baseDown: o } = t, r = n > 0 ? e / n : 1, a = r * i, c = r * o;
	return {
		size: e,
		capHeight: a,
		descenderHeight: c,
		cellWidth: r * s,
		totalHeight: a + c
	};
}
function Zc(t, e, n) {
	if (t.header.fontType !== U.SHAPES || !(0 in t.content.data)) return !1;
	const s = -(n.descenderHeight + n.capHeight * .2);
	return e.bbox.minY < s;
}
function rr(t, e) {
	const n = -(e.descenderHeight + e.capHeight * .05);
	return !(t.bbox.minY < n || t.bbox.maxY - t.bbox.minY < e.capHeight * .05);
}
function Jc(t, e, n) {
	if (t.header.fontType !== U.BIGFONT || t.content.baseDown > 0) return 0;
	const { height: s } = t.content;
	if (s <= 0) return 0;
	const i = s * qc, o = [], r = /* @__PURE__ */ new Set(), a = (l) => {
		if (r.has(l) || l <= 255 || !(l in t.content.data)) return;
		r.add(l);
		const h = e(l);
		if (!h) return;
		const u = h.bbox.minY;
		u > 0 && u <= i && o.push(u);
	};
	for (const l of Kc) if (a(l), o.length >= oo) break;
	if (o.length < io) {
		for (const l of Object.keys(t.content.data)) if (a(Number(l)), o.length >= oo) break;
	}
	if (o.length < io) return 0;
	o.sort((l, h) => l - h);
	const c = Math.floor(o.length / 2);
	return o.length % 2 === 0 ? (o[c - 1] + o[c]) / 2 : o[c];
}
function Qc(t, e, n) {
	if (t.header.fontType !== U.UNIFONT) return !1;
	if (t.content.dualOrientation) return !0;
	const s = Ft(t.content, n);
	for (const i of [
		48,
		65,
		78,
		49
	]) {
		if (!(i in t.content.data)) continue;
		const o = e(i);
		if (o && rr(o, s)) return !0;
	}
	return !1;
}
function el(t, e, n, s = mt, i = !1, o = 0) {
	var h;
	var r;
	let a = t;
	if (e.header.fontType === U.BIGFONT && o > 0) {
		const u = e.content.height > 0 ? n.size / e.content.height : 1;
		a = a.offset(new z(0, -o * u), !0);
	}
	if (e.header.fontType === U.UNIFONT || Zc(e, t, n)) {
		const u = e.header.fontType === U.UNIFONT && (i || e.content.dualOrientation || rr(t, n));
		(e.header.fontType !== U.UNIFONT || !u) && (a = a.offset(new z(0, n.capHeight), !0));
	}
	const c = s.resolve(a, n.cellWidth), l = s.markAlignedAdvanceExplicit(a) ? !0 : a.hasExplicitAdvance;
	return new _e(new z(c, (h = (r = a.lastPoint) == null ? void 0 : r.y) != null ? h : 0), a.polylines, l);
}
function tl(t, e, n, s = mt, i = !1, o = 0) {
	return el(t, e, Ft(e.content, n), s, i, o);
}
var ro = Math.PI / 4;
var lt = class lt {
	/**
	* Creates a bulge-defined arc
	* @param start Start point
	* @param end End point
	* @param bulge Bulge factor (-1 to 1, where 1 is a semicircle)
	*/
	static fromBulge(e, n, s) {
		return new lt({
			start: e,
			end: n,
			bulge: Math.max(-1, Math.min(1, s))
		});
	}
	/**
	* Creates an octant-defined arc
	* @param center Center point of the arc
	* @param radius Radius of the arc
	* @param startOctant Starting octant (0-7)
	* @param octantCount Number of octants to span (0-8, where 0 means 8 octants)
	* @param isClockwise Whether the arc goes clockwise
	*/
	static fromOctant(e, n, s, i, o) {
		return new lt({
			center: e,
			radius: n,
			startOctant: s,
			octantCount: i,
			isClockwise: o
		});
	}
	constructor(e) {
		if (e.start && e.end && e.bulge !== void 0) {
			this.start = e.start.clone(), this.end = e.end.clone(), this.bulge = e.bulge, this.isClockwise = e.bulge < 0;
			const n = this.end.clone().subtract(this.start), s = n.length();
			if (Math.abs(this.bulge) * s / 2 === 0) {
				this.radius = 0, this.center = this.start.clone(), this.startAngle = Math.atan2(n.y, n.x), this.endAngle = this.startAngle;
				return;
			}
			const i = 4 * Math.atan(Math.abs(this.bulge));
			this.radius = s / (2 * Math.sin(i / 2));
			const o = this.start.clone().add(n.clone().divide(2)), r = new z(-n.y, n.x);
			r.normalize(), r.multiply(Math.abs(this.radius * Math.cos(i / 2))), this.center = o.clone(), this.isClockwise ? this.center.subtract(r) : this.center.add(r), this.startAngle = Math.atan2(this.start.y - this.center.y, this.start.x - this.center.x), this.endAngle = Math.atan2(this.end.y - this.center.y, this.end.x - this.center.x), this.isClockwise ? this.endAngle >= this.startAngle && (this.endAngle -= 2 * Math.PI) : this.endAngle <= this.startAngle && (this.endAngle += 2 * Math.PI);
		} else if (e.center && e.radius !== void 0 && e.startOctant !== void 0 && e.octantCount !== void 0 && e.isClockwise !== void 0) {
			this.center = e.center.clone(), this.radius = e.radius, this.isClockwise = e.isClockwise, this.startAngle = e.startOctant * ro;
			const n = (e.octantCount === 0 ? 8 : e.octantCount) * ro;
			this.endAngle = this.startAngle + (this.isClockwise ? -n : n), this.start = this.center.clone().add(new z(this.radius * Math.cos(this.startAngle), this.radius * Math.sin(this.startAngle))), this.end = this.center.clone().add(new z(this.radius * Math.cos(this.endAngle), this.radius * Math.sin(this.endAngle)));
		} else throw new Error("Invalid arc parameters");
	}
	/**
	* Tessellates the arc into a series of points that approximate the arc.
	* @param circleSpan The angle span between tessellated points (default Math.PI / 18)
	* @returns Array of points representing the tessellated arc
	*/
	tessellate(e = Math.PI / 18) {
		if (this.radius === 0) return [this.start.clone(), this.end.clone()];
		const n = [this.start.clone()], s = Math.abs(this.endAngle - this.startAngle), i = Math.max(1, Math.floor(s / e));
		for (let o = 1; o < i; o++) {
			const r = o / i, a = this.isClockwise ? this.startAngle - r * s : this.startAngle + r * s;
			n.push(this.center.clone().add(new z(this.radius * Math.cos(a), this.radius * Math.sin(a))));
		}
		return n.push(this.end ? this.end.clone() : this.center.clone().add(new z(this.radius * Math.cos(this.endAngle), this.radius * Math.sin(this.endAngle)))), n;
	}
};
var nl = Math.PI / 18;
var sl = 1e-6;
var il = class {
	constructor(e) {
		this.shapeCache = /* @__PURE__ */ new Map(), this.subshapeCache = /* @__PURE__ */ new Map(), this.shapeData = /* @__PURE__ */ new Map(), this.fontData = e;
	}
	/**
	* Releases parsed shapes and cached shapes
	*/
	release() {
		this.shapeCache.clear(), this.subshapeCache.clear(), this.shapeData.clear();
	}
	/**
	* Parses a character's shape with the given font size.
	* @param code - The character code
	* @param size - The font size
	* @returns The parsed shape or undefined if the character is not found
	*/
	getCharShape(e, n) {
		const s = this.fontData.header.fontType === U.SHAPES && !(0 in this.fontData.content.data) ? n : n / this.fontData.content.height;
		return this.parseAndScale(e, { factor: s });
	}
	/**
	* Parses a character's shape with scaling options
	* @param code - The character code
	* @param options - Scaling options (factor or height/width)
	* @returns The parsed shape or undefined if the character is not found
	*/
	parseAndScale(e, n) {
		var i;
		if (e === 0) return;
		let s;
		if (this.shapeCache.has(e)) s = this.shapeCache.get(e);
		else {
			const o = this.fontData.content.data;
			if (o[e]) {
				const r = this.prepareBigfontGlyphBytecode(e, o[e]), a = this.fontData.header.fontType !== U.BIGFONT;
				s = this.parseShape(r, {
					flushOnEnd: !0,
					initialPenDown: a
				}), this.shapeData.set(e, s), this.shapeCache.set(e, s);
			}
		}
		if (s) {
			if (n.factor !== void 0) return this.scaleShapeByFactor(s, n.factor);
			if (n.height !== void 0) {
				const o = (i = n.width) != null ? i : n.height;
				return this.scaleShapeByHeightAndWidth(s, n.height, o);
			} else return s;
		}
	}
	/** Strips the embedded character-code prefix from dual-byte BIGFONT parent glyphs. */
	prepareBigfontGlyphBytecode(e, n) {
		if (this.fontData.header.fontType !== U.BIGFONT || e <= 255) return n;
		const s = e >> 8 & 255, i = e & 255;
		if (n.length >= 2 && n[0] === s && n[1] === i) {
			let o = 2;
			return n[o] === 0 && o++, n.slice(o);
		}
		return n;
	}
	/**
	* Dual-orientation vertical BIGFONT files (e.g. gbcbig.shx) use 0x8e/0x8f markers on
	* code 7 instead of real subshapes. Only the marker byte is skipped; following setup
	* commands (push / pen up / xy origin) are executed normally.
	*/
	isVerticalDualBigfontMarker(e, n, s) {
		return this.fontData.content.verticalDualMode ? s === "open" ? e[n] === 142 : e[n] === 143 : !1;
	}
	/**
	* Scales a shape according to the given scale factor
	* @param shape - The shape to scale
	* @param factor - The scale factor
	* @returns The scaled shape
	*/
	scaleShapeByFactor(e, n) {
		var s;
		return new _e((s = e.lastPoint) == null ? void 0 : s.clone().multiply(n), e.polylines.map((i) => i.map((o) => o.clone().multiply(n))), e.hasExplicitAdvance);
	}
	/**
	* Scales a shape according to the given height and width
	* @param shape - The shape to scale
	* @param height - The target height
	* @param width - The target width
	* @returns The scaled shape
	*/
	scaleShapeByHeightAndWidth(e, n, s) {
		var i;
		const o = e.bbox, r = o.maxY - o.minY, a = o.maxX - o.minX, c = r > 0 ? n / r : 1, l = a > 0 ? s / a : 1, h = (i = e.lastPoint) == null ? void 0 : i.clone();
		h && (h.x *= l, h.y *= c);
		return new _e(h, e.polylines.map((f) => f.map((d) => {
			const m = d.clone();
			return m.x *= l, m.y *= c, m;
		})), e.hasExplicitAdvance);
	}
	/**
	* Whether code 14 (0x0E) should skip the following command for the current layout.
	* Defaults to horizontal text layout when no orientation is supplied.
	*/
	shouldSkipVerticalFlagCommand(e = !1) {
		const { content: n, header: s } = this.fontData;
		return s.fontType === U.BIGFONT ? !n.verticalDualMode : n.dualOrientation ? !e : n.orientation === "horizontal";
	}
	/** Marks that bytecode explicitly defines horizontal advance. */
	markAdvanceDefined(e) {
		e.hasExplicitAdvance = !0;
	}
	/** Records a terminal pen-up XY move (codes 8/9). */
	notePenUpPositioning(e) {
		e.pendingTerminalAdvance = !0;
	}
	/** Clears a pending advance when later bytecode supersedes the prior XY move. */
	clearPendingAdvance(e) {
		e.pendingTerminalAdvance = !1;
	}
	stateHasInk(e) {
		return e.currentPolyline.length > 1 ? !0 : e.polylines.some((n) => n.length >= 2);
	}
	/**
	* Confirms terminal pen-up XY (codes 8/9) as advance definition.
	* Ignores closure moves that return to the origin after drawing (e.g. txt `A`).
	*/
	finalizeAdvanceFlag(e) {
		if (!e.pendingTerminalAdvance) return;
		const n = e.currentPoint.x;
		if (Math.abs(n) > sl) {
			e.hasExplicitAdvance = !0;
			return;
		}
		this.stateHasInk(e) || (e.hasExplicitAdvance = !0);
	}
	/**
	* Parses the shape of a character.
	* @param data - The data of the character
	* @param options - Optional parse settings
	* @returns The parsed shape
	*/
	parseShape(e, n = {}) {
		var l, h;
		let s = new z();
		const i = [];
		let o = [];
		const r = [];
		let a = (l = n.initialPenDown) != null ? l : !1;
		a && o.push(s.clone());
		const c = {
			currentPoint: s,
			polylines: i,
			currentPolyline: o,
			sp: r,
			isPenDown: a,
			scale: 1,
			flushEndPolyline: (h = n.flushOnEnd) != null ? h : !1,
			hasExplicitAdvance: !1,
			pendingTerminalAdvance: !1
		};
		for (let u = 0; u < e.length; u++) {
			const f = e[u];
			f <= 15 ? u = this.handleSpecialCommand(f, e, u, c) : (this.clearPendingAdvance(c), this.handleVectorCommand(f, c));
		}
		return this.finalizeAdvanceFlag(c), this.buildShapeFromState(c);
	}
	/** Builds a shape result, including any trailing pen-down polyline. */
	buildShapeFromState(e) {
		const n = e.polylines.map((s) => s.map((i) => i.clone()));
		return e.currentPolyline.length > 1 && n.push(e.currentPolyline.map((s) => s.clone())), new _e(e.currentPoint.clone(), n, e.hasExplicitAdvance);
	}
	/**
	* Please refer to special codes reference in the following link for more information.
	* https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-06832147-16BE-4A66-A6D0-3ADF98DC8228
	* @param command - The command byte
	* @param data - The data of the character
	* @param index - The index of the command byte
	* @param state - The state of the parser
	* @returns The index of the next command byte
	*/
	handleSpecialCommand(e, n, s, i) {
		var r;
		let o = s;
		switch (e) {
			case 0:
				this.finalizeAdvanceFlag(i), i.flushEndPolyline && i.currentPolyline.length > 1 ? (i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = []) : i.flushEndPolyline && (i.currentPolyline = []), i.isPenDown = !1;
				break;
			case 1:
				this.clearPendingAdvance(i), i.isPenDown || i.currentPolyline.push(i.currentPoint.clone()), i.isPenDown = !0;
				break;
			case 2:
				i.isPenDown = !1, i.currentPolyline.length > 1 && i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = [];
				break;
			case 3:
				this.clearPendingAdvance(i), o++, i.scale /= n[o];
				break;
			case 4:
				this.clearPendingAdvance(i), o++, i.scale *= n[o];
				break;
			case 5:
				if (this.clearPendingAdvance(i), i.sp.length === 4) throw new Error("The position stack is only four locations deep");
				i.sp.push(i.currentPoint.clone());
				break;
			case 6:
				this.clearPendingAdvance(i), i.currentPoint = (r = i.sp.pop()) != null ? r : i.currentPoint, i.currentPolyline.length > 1 && (i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = []), i.isPenDown && i.currentPolyline.push(i.currentPoint.clone());
				break;
			case 7:
				this.clearPendingAdvance(i), o = this.handleSubshapeCommand(n, o, i);
				break;
			case 8:
				o = this.handleXYDisplacement(n, o, i);
				break;
			case 9:
				o = this.handleMultipleXYDisplacements(n, o, i);
				break;
			case 10:
				this.clearPendingAdvance(i), o = this.handleOctantArc(n, o, i);
				break;
			case 11:
				this.clearPendingAdvance(i), o = this.handleFractionalArc(n, o, i);
				break;
			case 12:
				this.clearPendingAdvance(i), o = this.handleBulgeArc(n, o, i);
				break;
			case 13:
				this.clearPendingAdvance(i), o = this.handleMultipleBulgeArcs(n, o, i);
				break;
			case 14: this.clearPendingAdvance(i), this.shouldSkipVerticalFlagCommand() && (o = this.skipCode(n, ++o));
		}
		return o;
	}
	handleVectorCommand(e, n) {
		const s = (e & 240) >> 4, i = e & 15, o = this.getVectorForDirection(i);
		n.currentPoint.add(o.multiply(s * n.scale)), n.isPenDown && n.currentPolyline.push(n.currentPoint.clone());
	}
	/**
	* Get the vector for the given direction code. Please refer to the following link for more information.
	* https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-0A8E12A1-F4AB-44AD-8A9B-2140E0D5FD23
	* @param dir - The direction code of the vector
	* @returns Returns the vector for the given direction code
	*/
	getVectorForDirection(e) {
		const n = new z();
		switch (e) {
			case 0:
				n.x = 1;
				break;
			case 1:
				n.x = 1, n.y = .5;
				break;
			case 2:
				n.x = 1, n.y = 1;
				break;
			case 3:
				n.x = .5, n.y = 1;
				break;
			case 4:
				n.y = 1;
				break;
			case 5:
				n.x = -.5, n.y = 1;
				break;
			case 6:
				n.x = -1, n.y = 1;
				break;
			case 7:
				n.x = -1, n.y = .5;
				break;
			case 8:
				n.x = -1;
				break;
			case 9:
				n.x = -1, n.y = -.5;
				break;
			case 10:
				n.x = -1, n.y = -1;
				break;
			case 11:
				n.x = -.5, n.y = -1;
				break;
			case 12:
				n.y = -1;
				break;
			case 13:
				n.x = .5, n.y = -1;
				break;
			case 14:
				n.x = 1, n.y = -1;
				break;
			case 15: n.x = 1, n.y = -.5;
		}
		return n;
	}
	handleSubshapeCommand(e, n, s) {
		let i = n, o = 0, r, a = s.scale * this.fontData.content.baseUp, c = a;
		const l = s.currentPoint.clone();
		switch (s.currentPolyline.length > 1 && (s.polylines.push(s.currentPolyline.slice()), s.currentPolyline = []), this.fontData.header.fontType) {
			case U.SHAPES:
				i++, o = e[i];
				break;
			case U.BIGFONT:
				if (i++, this.isVerticalDualBigfontMarker(e, i, "open")) return i;
				if (this.isVerticalDualBigfontMarker(e, i, "close")) return i + 1;
				o = e[i], o === 0 && (i++, o = e[i++] << 8 | e[i++], l.x = te.byteToSByte(e[i++]) * s.scale, l.y = te.byteToSByte(e[i++]) * s.scale, this.fontData.content.isExtended ? (c = e[i++] * s.scale, a = e[i] * s.scale) : (a = e[i] * s.scale, c = a));
				break;
			case U.UNIFONT: i++, o = e[i++] << 8 | e[i++], i--;
		}
		if (o !== 0) if (this.fontData.header.fontType === U.UNIFONT) {
			const h = s.isPenDown;
			r = this.getScaledSubshapeAtInsertPoint(o, c, a, l, h), r != null && r.polylines.some((u) => u.length >= 2) && (s.polylines.push(...r.polylines.slice()), r.lastPoint && (s.currentPoint = r.lastPoint.clone()), s.currentPolyline = [], s.isPenDown && s.currentPolyline.push(s.currentPoint.clone()));
		} else if (this.fontData.header.fontType === U.SHAPES) r = this.getScaledSubshapeAtInsertPoint(o, c, a, l), r && (s.polylines.push(...r.polylines.slice()), r.lastPoint && (s.currentPoint = r.lastPoint.clone(), r.hasExplicitAdvance && this.markAdvanceDefined(s))), s.currentPolyline = [], s.isPenDown && s.currentPolyline.push(s.currentPoint.clone());
		else {
			if (r = this.getScaledSubshapeAtInsertPoint(o, c, a, l), r && (s.polylines.push(...r.polylines.slice()), o === 2 && r.lastPoint)) {
				const h = r.lastPoint.x - l.x;
				h > s.currentPoint.x && (s.currentPoint.x = h), this.markAdvanceDefined(s);
			}
			s.currentPolyline = [];
		}
		return i;
	}
	handleXYDisplacement(e, n, s) {
		let i = n;
		const o = new z();
		return o.x = te.byteToSByte(e[++i]), o.y = te.byteToSByte(e[++i]), s.currentPoint.add(o.multiply(s.scale)), s.isPenDown ? s.currentPolyline.push(s.currentPoint.clone()) : this.notePenUpPositioning(s), i;
	}
	handleMultipleXYDisplacements(e, n, s) {
		let i = n;
		for (; !(i + 1 >= e.length);) {
			const o = new z();
			if (o.x = te.byteToSByte(e[++i]), o.y = te.byteToSByte(e[++i]), o.x === 0 && o.y === 0) break;
			s.currentPoint.add(o.multiply(s.scale)), s.isPenDown ? s.currentPolyline.push(s.currentPoint.clone()) : this.notePenUpPositioning(s);
		}
		return i;
	}
	handleOctantArc(e, n, s) {
		let i = n;
		const o = e[++i] * s.scale, r = te.byteToSByte(e[++i]), a = (r & 112) >> 4;
		let c = r & 7;
		const l = r < 0, h = Math.PI / 4 * a, u = s.currentPoint.clone().subtract(new z(Math.cos(h) * o, Math.sin(h) * o)), f = lt.fromOctant(u, o, a, c, l).tessellate();
		return s.isPenDown && (s.currentPolyline.pop(), s.currentPolyline.push(...f.slice())), s.currentPoint = f[f.length - 1].clone(), i;
	}
	handleFractionalArc(e, n, s) {
		let i = n;
		const o = e[++i], r = e[++i], a = e[++i], c = e[++i], l = (a * 255 + c) * s.scale, h = te.byteToSByte(e[++i]), u = (h & 112) >> 4;
		let f = h & 7;
		f === 0 && (f = 8), r !== 0 && f--;
		const d = Math.PI / 4;
		let m = d * f, p = nl, g = 1;
		h < 0 && (p = -p, m = -m, g = -1);
		let b = d * u, y = b + m;
		b += d * o / 256 * g, y += d * r / 256 * g;
		const v = s.currentPoint.clone().subtract(new z(l * Math.cos(b), l * Math.sin(b)));
		if (s.currentPoint = v.clone().add(new z(l * Math.cos(y), l * Math.sin(y))), s.isPenDown) {
			let x = b;
			const w = [];
			if (w.push(v.clone().add(new z(l * Math.cos(x), l * Math.sin(x)))), p > 0) for (; x + p < y;) x += p, w.push(v.clone().add(new z(l * Math.cos(x), l * Math.sin(x))));
			else for (; x + p > y;) x += p, w.push(v.clone().add(new z(l * Math.cos(x), l * Math.sin(x))));
			w.push(v.clone().add(new z(l * Math.cos(y), l * Math.sin(y)))), s.currentPolyline.push(...w);
		}
		return i;
	}
	handleBulgeArc(e, n, s) {
		let i = n;
		const o = new z();
		o.x = te.byteToSByte(e[++i]), o.y = te.byteToSByte(e[++i]);
		const r = te.byteToSByte(e[++i]);
		return s.currentPoint = this.handleArcSegment(s.currentPoint, o, r, s.scale, s.isPenDown, s.currentPolyline), i;
	}
	handleMultipleBulgeArcs(e, n, s) {
		let i = n;
		for (; !(i + 1 >= e.length);) {
			const o = new z();
			if (o.x = te.byteToSByte(e[++i]), o.y = te.byteToSByte(e[++i]), o.x === 0 && o.y === 0 || i + 1 >= e.length) break;
			const r = te.byteToSByte(e[++i]);
			s.currentPoint = this.handleArcSegment(s.currentPoint, o, r, s.scale, s.isPenDown, s.currentPolyline);
		}
		return i;
	}
	skipCode(e, n) {
		switch (e[n]) {
			case 0: break;
			case 1: break;
			case 2: break;
			case 3:
			case 4:
				n++;
				break;
			case 5: break;
			case 6: break;
			case 7:
				switch (this.fontData.header.fontType) {
					case U.SHAPES:
						n++;
						break;
					case U.BIGFONT:
						n++, this.isVerticalDualBigfontMarker(e, n, "open") ? n++ : this.isVerticalDualBigfontMarker(e, n, "close") ? n += 2 : e[n] === 0 && (n += this.fontData.content.isExtended ? 6 : 5);
						break;
					case U.UNIFONT: n += 2;
				}
				break;
			case 8:
				n += 2;
				break;
			case 9:
				for (; n++, !(n >= e.length);) {
					const s = e[n];
					if (n++, n >= e.length) break;
					const i = e[n];
					if (s === 0 && i === 0) break;
				}
				break;
			case 10:
				n += 2;
				break;
			case 11:
				n += 5;
				break;
			case 12:
				n += 3;
				break;
			case 13: for (; n++, !(n >= e.length);) {
				const s = e[n];
				if (n++, n >= e.length) break;
				const i = e[n];
				if (s === 0 && i === 0) break;
				n++;
			}
		}
		return n;
	}
	getScaledSubshapeAtInsertPoint(e, n, s, i, o = !1) {
		let r;
		if (o) {
			const l = this.fontData.content.data[e];
			if (!l) return;
			r = this.parseShape(l, {
				initialPenDown: !0,
				flushOnEnd: !0
			});
		} else if (r = this.subshapeCache.get(e), !r) {
			const l = this.fontData.content.data[e];
			if (!l) return;
			const h = this.fontData.header.fontType !== U.BIGFONT;
			r = this.parseShape(l, {
				flushOnEnd: !1,
				initialPenDown: h
			}), this.shapeData.set(e, r), this.subshapeCache.set(e, r);
		}
		const a = this.fontData.header.fontType === U.BIGFONT ? void 0 : s / this.fontData.content.baseUp, c = r.polylines.some((l) => l.length > 0);
		return (a !== void 0 ? this.scaleShapeByFactor(r, a) : this.scaleShapeByHeightAndWidth(c ? r.normalizeToOrigin(!0) : r, s, n)).offset(i, !1);
	}
	/**
	* Handles drawing an arc segment with the given vector and bulge
	* @param currentPoint The starting point of the arc
	* @param vec The displacement vector
	* @param bulge The bulge value (will be normalized by 127.0)
	* @param scale The current scale factor
	* @param isPenDown Whether the pen is currently down (drawing)
	* @param currentPolyline The current polyline being built
	* @returns The new current point after the arc
	*/
	handleArcSegment(e, n, s, i, o, r) {
		n.x *= i, n.y *= i, s < -127 && (s = -127);
		const a = e.clone();
		if (o) if (s === 0) r.push(a.clone().add(n));
		else {
			const c = a.clone().add(n), l = lt.fromBulge(a, c, s / 127).tessellate();
			r.push(...l.slice(1));
		}
		return a.add(n), a;
	}
};
var ol = class {
	/**
	* Creates a new ShxFont instance.
	* @param data - Either raw binary data of the SHX font file (ArrayBuffer) or pre-parsed font data (ShxFontData)
	* @throws {Error} If the font data is invalid or cannot be parsed
	*/
	constructor(e) {
		if (e instanceof ArrayBuffer) {
			const n = new te(e), s = new Fc().parse(n), i = Wc.createParser(s.fontType).parse(n);
			this.fontData = {
				header: s,
				content: i
			};
		} else this.fontData = e;
		this.shapeParser = new il(this.fontData);
	}
	/**
	* Return true if this font contains glyph of the specified character. Otherwise, return false.
	* @param char - The character to check
	* @returns True if this font contains glyph of the specified character. Otherwise, return false.
	*/
	hasChar(e) {
		return this.fontData.content.data[e] !== void 0;
	}
	/**
	* Return true if this font contains a shape with the specified name. Otherwise, return false.
	* Shape names are matched case-insensitively.
	* @param name - The shape name to check (for example, "GRS")
	* @returns True if this font contains the named shape. Otherwise, return false.
	*/
	hasShape(e) {
		return this.getShapeCode(e) !== void 0;
	}
	/**
	* Gets the character code for a named shape.
	* @param name - The shape name to look up
	* @returns The character code, or undefined if the shape is not found
	*/
	getShapeCode(e) {
		const n = this.fontData.content.names;
		if (n) return n[e.toUpperCase()];
	}
	/**
	* Gets the shape name for a character code, if one is defined.
	* @param code - The character code to look up
	* @returns The shape name, or undefined if the code has no name
	*/
	getShapeName(e) {
		var n;
		const s = (n = this.fontData.content.codeToName) == null ? void 0 : n[e];
		if (s !== void 0) return s;
		const i = this.fontData.content.names;
		if (i) {
			for (const [o, r] of Object.entries(i)) if (r === e) return o;
		}
	}
	/**
	* Returns scaled font metrics for a target render size.
	* @param size - Target font size in drawing units
	*/
	getFontMetrics(e) {
		return Ft(this.fontData.content, e);
	}
	/**
	* Returns a layout-ready glyph: scaled geometry with baseline alignment applied.
	*
	* Prefer this over {@link ShxFont.getCharShape} when placing text for display.
	*
	* @param code - The character code to get the shape for
	* @param size - The desired font size
	*/
	getLayoutCharShape(e, n, s = mt) {
		const i = this.getCharShape(e, n);
		if (i) return tl(i, this.fontData, n, s, this.usesUnifontBaselineOriginFont(n), this.getBigfontBaselineInkPaddingNative());
	}
	/**
	* Returns the cached median baseline ink padding for BIGFONT layout normalization.
	*
	* @returns Padding in native font units from shape #0 height, or 0 when not applicable
	*/
	getBigfontBaselineInkPaddingNative() {
		if (this.bigfontBaselineInkPaddingNative === void 0) {
			const e = this.fontData.content.height;
			this.bigfontBaselineInkPaddingNative = Jc(this.fontData, (n) => this.getCharShape(n, e));
		}
		return this.bigfontBaselineInkPaddingNative;
	}
	/**
	* Returns whether this UNIFONT encodes horizontal glyphs with baseline at y = 0.
	*
	* The result is computed once via {@link detectUnifontBaselineOriginFont} and cached,
	* because baseline-origin detection is independent of render size.
	*
	* @param size - Font size used when sampling glyph geometry for detection
	* @returns True when baseline-origin UNIFONT shifting should be skipped during layout
	*/
	usesUnifontBaselineOriginFont(e) {
		return this.unifontBaselineOriginFont === void 0 && (this.unifontBaselineOriginFont = Qc(this.fontData, (n) => this.getCharShape(n, e), e)), this.unifontBaselineOriginFont;
	}
	/**
	* Gets the shape data for a named shape at a given font size.
	* Shape names are matched case-insensitively.
	* @param name - The shape name to get the shape for
	* @param size - The desired font size
	* @returns The shape data for the named shape, or undefined if it is not found in the font
	*/
	getShapeByName(e, n) {
		const s = this.getShapeCode(e);
		if (s !== void 0) return this.getCharShape(s, n);
	}
	/**
	* Gets the scaled shape geometry for a character code.
	*
	* Returns the glyph as encoded in the SHX file, scaled to `size`. Vertical placement
	* and mixed-font baseline alignment are the responsibility of the text renderer;
	* see the `textLayout` module and {@link ShxFont.getFontMetrics}.
	*
	* @param code - The character code to get the shape for
	* @param size - The desired font size
	* @returns The shape data for the character, or undefined if the character is not found in the font
	*/
	getCharShape(e, n) {
		return this.shapeParser.getCharShape(e, n);
	}
	/**
	* Releases resources used by the font.
	* This should be called when the font is no longer needed to free up memory.
	*/
	release() {
		this.shapeParser.release();
	}
};
function rl(t, e, n, s = mt) {
	const i = Ft(e.content, n);
	return s.resolve(t, i.cellWidth);
}
function al(t, e, n = 0) {
	return t.offset(new z(e, n), !0);
}
function cl(t, e = 0, n = {}) {
	var r;
	const s = (r = n.advance) != null ? r : mt;
	let i = 0;
	const o = [];
	for (const { font: a, code: c, size: l } of t) {
		const h = a.getLayoutCharShape(c, l, s);
		h && (o.push({
			shape: al(h, i, e),
			x: i
		}), i += rl(h, a.fontData, l, s));
	}
	return o;
}
var ar = Object.freeze({
	resolveShape: () => {},
	resolveText: () => {}
});
var ao = "Complex SHX linetype glyphs";
var ll = class {
	constructor() {
		S(this, "fonts", /* @__PURE__ */ new Map());
		S(this, "requirements", []);
	}
	async add(e) {
		var c, l;
		const n = an((l = e.fileName) != null ? l : (c = e.file) == null ? void 0 : c.name);
		if (!n) throw new Error("A fileName is required when adding an SHX reference buffer.");
		if (!/\.shx$/i.test(n)) throw new Error(`${n} is not an SHX reference file.`);
		if (!e.file && !e.buffer) throw new Error(`No file content was provided for ${n}.`);
		const s = e.file ? new Uint8Array(await e.file.arrayBuffer()) : hl(e.buffer);
		if (s.byteLength === 0) throw new Error(`${n} is empty.`);
		let i;
		try {
			i = new ol(ul(s));
		} catch (h) {
			const u = h instanceof Error ? h.message : String(h);
			throw new Error(`Unable to parse SHX reference ${n}: ${u}`);
		}
		const o = de(n), r = this.fonts.get(o), a = {
			kind: "shx",
			fileName: n,
			bytes: s.byteLength,
			fontType: i.fontData.header.fontType,
			glyphCount: Object.keys(i.fontData.content.data).length
		};
		return this.fonts.set(o, {
			key: o,
			font: i,
			info: a,
			shapeCache: /* @__PURE__ */ new Map(),
			textCache: /* @__PURE__ */ new Map()
		}), r?.font.release(), { ...a };
	}
	setDocument(e) {
		var a, c;
		if (!e) {
			this.requirements = [];
			return;
		}
		const n = /* @__PURE__ */ new Map(), s = (l) => {
			const h = an(l), u = h ? de(h) : "*";
			let f = n.get(u);
			return f || (f = {
				fileName: h || void 0,
				shapeNumbers: /* @__PURE__ */ new Set(),
				texts: /* @__PURE__ */ new Set()
			}, n.set(u, f)), f;
		};
		for (const l of new Set(Object.values((a = e.lineTypes) != null ? a : {}))) for (const h of l.pattern) {
			const u = Number((c = h.elementTypeFlag) != null ? c : 0);
			if (u === 0) continue;
			const f = s(h.fontName), d = Math.trunc(Number(h.shapeNumber));
			(u & 4) === 4 && Number.isFinite(d) && f.shapeNumbers.add(d), (u & 2) === 2 && h.text && f.texts.add(h.text);
		}
		const i = Array.isArray(e.metadata.requiredShxFonts) ? e.metadata.requiredShxFonts : [];
		for (const l of i) s(String(l));
		const o = n.get("*"), r = [...n.entries()].filter(([l]) => l !== "*");
		if (o && r.length === 1) {
			const l = r[0][1];
			for (const h of o.shapeNumbers) l.shapeNumbers.add(h);
			for (const h of o.texts) l.texts.add(h);
			n.delete("*");
		}
		this.requirements = [...n.values()];
	}
	has(e) {
		return this.fonts.has(de(e));
	}
	remove(e) {
		const n = de(e), s = this.fonts.get(n);
		return s ? (s.font.release(), this.fonts.delete(n), !0) : !1;
	}
	clear() {
		for (const e of this.fonts.values()) e.font.release();
		this.fonts.clear();
	}
	getState() {
		const e = [];
		for (const n of this.requirements) {
			if (n.fileName) {
				const i = this.fonts.get(de(n.fileName));
				i ? ho(i.font, n) || e.push({
					kind: "shx",
					fileName: n.fileName,
					identified: !0,
					reason: "incompatible"
				}) : e.push({
					kind: "shx",
					fileName: n.fileName,
					identified: !0,
					reason: "not-loaded"
				});
				continue;
			}
			[...this.fonts.values()].some((i) => ho(i.font, n)) || e.push({
				kind: "shx",
				fileName: "External SHX font",
				identified: !1,
				reason: this.fonts.size ? "incompatible" : "not-loaded"
			});
		}
		return {
			missing: e,
			loaded: [...this.fonts.values()].map(({ info: n }) => ({ ...n })).sort((n, s) => n.fileName.localeCompare(s.fileName))
		};
	}
	resolveShape(e, n) {
		const s = Math.trunc(Number(e));
		if (!Number.isFinite(s) || s < 0) return;
		const i = this.resolveFont(n, (a) => a.hasChar(s));
		if (!i) return;
		const o = i.shapeCache.get(s);
		if (o !== void 0) return o != null ? o : void 0;
		let r;
		try {
			const a = i.font.getCharShape(s, 1);
			r = a ? lo(a.polylines) : void 0;
		} catch (a) {
			r = void 0;
		}
		return i.shapeCache.set(s, r != null ? r : null), r;
	}
	resolveText(e, n) {
		if (!e) return;
		const s = Array.from(e, (a) => {
			var c;
			return (c = a.codePointAt(0)) != null ? c : 0;
		}), i = this.resolveFont(n, (a) => s.every((c) => a.hasChar(c)));
		if (!i) return;
		const o = i.textCache.get(e);
		if (o !== void 0) return o != null ? o : void 0;
		let r;
		try {
			r = lo(cl(s.map((c) => ({
				font: i.font,
				code: c,
				size: 1
			}))).flatMap(({ shape: c }) => c.polylines));
		} catch (a) {
			r = void 0;
		}
		return i.textCache.set(e, r != null ? r : null), r;
	}
	resolveFont(e, n) {
		if (e) {
			const o = this.fonts.get(de(e));
			return o && n(o.font) ? o : void 0;
		}
		const s = this.requirements.map(({ fileName: o }) => o ? this.fonts.get(de(o)) : void 0).filter((o) => o !== void 0 && n(o.font));
		if (s.length === 1) return s[0];
		const i = [...this.fonts.values()].filter((o) => n(o.font));
		return i.length === 1 ? i[0] : void 0;
	}
};
function co(t, e) {
	const n = Array.isArray(t.metadata.requiredShxFonts) ? t.metadata.requiredShxFonts.map(String) : [];
	t.metadata.missingReferences = e.missing.map((i) => ({ ...i })), t.metadata.loadedReferences = e.loaded.map((i) => ({ ...i })), t.metadata.loadedShxFonts = n.filter((i) => e.loaded.some((o) => de(o.fileName) === de(i)));
	for (let i = t.warnings.length - 1; i >= 0; i--) t.warnings[i].startsWith(ao) && t.warnings.splice(i, 1);
	if (e.missing.length === 0) return;
	const s = e.missing.map(({ fileName: i, reason: o }) => o === "incompatible" ? `${i} (missing required glyphs)` : i);
	t.warnings.push(`${ao} are using a dash/dot fallback until the missing reference${s.length === 1 ? " is" : "s are"} supplied: ${s.join(", ")}.`);
}
function an(t) {
	var e;
	return (e = String(t != null ? t : "").trim().split(/[\\/]/).filter(Boolean).pop()) != null ? e : "";
}
function de(t) {
	return an(t).toLocaleLowerCase("en-US");
}
function lo(t) {
	const e = t.map((n) => n.filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y)).map((s) => ({
		x: s.x,
		y: s.y
	}))).filter((n) => n.length >= 2);
	return e.length > 0 ? { polylines: e } : void 0;
}
function ho(t, e) {
	var n;
	for (const s of e.shapeNumbers) if (!t.hasChar(s)) return !1;
	for (const s of e.texts) for (const i of s) if (!t.hasChar((n = i.codePointAt(0)) != null ? n : 0)) return !1;
	return !0;
}
function hl(t) {
	return t instanceof Uint8Array ? t.slice() : new Uint8Array(t.slice(0));
}
function ul(t) {
	return t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength);
}
function fl(t) {
	const e = t;
	return e.nativeRenderer === !0 && typeof e.mount == "function";
}
var dl = {
	1: "#ff0000",
	2: "#ffff00",
	3: "#00ff00",
	4: "#00ffff",
	5: "#0000ff",
	6: "#ff00ff",
	8: "#808080",
	9: "#c0c0c0",
	10: "#ff0000",
	11: "#ff7f7f",
	12: "#a50000",
	13: "#a55252",
	14: "#7f0000",
	15: "#7f3f3f",
	16: "#4c0000",
	17: "#4c2626",
	18: "#260000",
	19: "#261313",
	20: "#ff3f00",
	21: "#ff9f7f",
	22: "#a52900",
	23: "#a56752",
	24: "#7f1f00",
	25: "#7f4f3f",
	26: "#4c1300",
	27: "#4c2f26",
	28: "#260900",
	29: "#261713",
	30: "#ff7f00",
	31: "#ffbf7f",
	32: "#a55200",
	33: "#a57c52",
	34: "#7f3f00",
	35: "#7f5f3f",
	36: "#4c2600",
	37: "#4c3926",
	38: "#261300",
	39: "#261c13",
	40: "#ffbf00",
	41: "#ffdf7f",
	42: "#a57c00",
	43: "#a59152",
	44: "#7f5f00",
	45: "#7f6f3f",
	46: "#4c3900",
	47: "#4c4226",
	48: "#261c00",
	49: "#262113",
	50: "#ffff00",
	51: "#ffff7f",
	52: "#a5a500",
	53: "#a5a552",
	54: "#7f7f00",
	55: "#7f7f3f",
	56: "#4c4c00",
	57: "#4c4c26",
	58: "#262600",
	59: "#262613",
	60: "#bfff00",
	61: "#dfff7f",
	62: "#7ca500",
	63: "#91a552",
	64: "#5f7f00",
	65: "#6f7f3f",
	66: "#394c00",
	67: "#424c26",
	68: "#1c2600",
	69: "#212613",
	70: "#7fff00",
	71: "#bfff7f",
	72: "#52a500",
	73: "#7ca552",
	74: "#3f7f00",
	75: "#5f7f3f",
	76: "#264c00",
	77: "#394c26",
	78: "#132600",
	79: "#1c2613",
	80: "#3fff00",
	81: "#9fff7f",
	82: "#29a500",
	83: "#67a552",
	84: "#1f7f00",
	85: "#4f7f3f",
	86: "#134c00",
	87: "#2f4c26",
	88: "#092600",
	89: "#172613",
	90: "#00ff00",
	91: "#7fff7f",
	92: "#00a500",
	93: "#52a552",
	94: "#007f00",
	95: "#3f7f3f",
	96: "#004c00",
	97: "#264c26",
	98: "#002600",
	99: "#132613",
	100: "#00ff3f",
	101: "#7fff9f",
	102: "#00a529",
	103: "#52a567",
	104: "#007f1f",
	105: "#3f7f4f",
	106: "#004c13",
	107: "#264c2f",
	108: "#002609",
	109: "#132617",
	110: "#00ff7f",
	111: "#7fffbf",
	112: "#00a552",
	113: "#52a57c",
	114: "#007f3f",
	115: "#3f7f5f",
	116: "#004c26",
	117: "#264c39",
	118: "#002613",
	119: "#13261c",
	120: "#00ffbf",
	121: "#7fffdf",
	122: "#00a57c",
	123: "#52a591",
	124: "#007f5f",
	125: "#3f7f6f",
	126: "#004c39",
	127: "#264c42",
	128: "#00261c",
	129: "#132621",
	130: "#00ffff",
	131: "#7fffff",
	132: "#00a5a5",
	133: "#52a5a5",
	134: "#007f7f",
	135: "#3f7f7f",
	136: "#004c4c",
	137: "#264c4c",
	138: "#002626",
	139: "#132626",
	140: "#00bfff",
	141: "#7fdfff",
	142: "#007ca5",
	143: "#5291a5",
	144: "#005f7f",
	145: "#3f6f7f",
	146: "#00394c",
	147: "#26424c",
	148: "#001c26",
	149: "#132126",
	150: "#007fff",
	151: "#7fbfff",
	152: "#0052a5",
	153: "#527ca5",
	154: "#003f7f",
	155: "#3f5f7f",
	156: "#00264c",
	157: "#26394c",
	158: "#001326",
	159: "#131c26",
	160: "#003fff",
	161: "#7f9fff",
	162: "#0029a5",
	163: "#5267a5",
	164: "#001f7f",
	165: "#3f4f7f",
	166: "#00134c",
	167: "#262f4c",
	168: "#000926",
	169: "#131726",
	170: "#0000ff",
	171: "#7f7fff",
	172: "#0000a5",
	173: "#5252a5",
	174: "#00007f",
	175: "#3f3f7f",
	176: "#00004c",
	177: "#26264c",
	178: "#000026",
	179: "#131326",
	180: "#3f00ff",
	181: "#9f7fff",
	182: "#2900a5",
	183: "#6752a5",
	184: "#1f007f",
	185: "#4f3f7f",
	186: "#13004c",
	187: "#2f264c",
	188: "#090026",
	189: "#171326",
	190: "#7f00ff",
	191: "#bf7fff",
	192: "#5200a5",
	193: "#7c52a5",
	194: "#3f007f",
	195: "#5f3f7f",
	196: "#26004c",
	197: "#39264c",
	198: "#130026",
	199: "#1c1326",
	200: "#bf00ff",
	201: "#df7fff",
	202: "#7c00a5",
	203: "#9152a5",
	204: "#5f007f",
	205: "#6f3f7f",
	206: "#39004c",
	207: "#42264c",
	208: "#1c0026",
	209: "#211326",
	210: "#ff00ff",
	211: "#ff7fff",
	212: "#a500a5",
	213: "#a552a5",
	214: "#7f007f",
	215: "#7f3f7f",
	216: "#4c004c",
	217: "#4c264c",
	218: "#260026",
	219: "#261326",
	220: "#ff00bf",
	221: "#ff7fdf",
	222: "#a5007c",
	223: "#a55291",
	224: "#7f005f",
	225: "#7f3f6f",
	226: "#4c0039",
	227: "#4c2642",
	228: "#26001c",
	229: "#261321",
	230: "#ff007f",
	231: "#ff7fbf",
	232: "#a50052",
	233: "#a5527c",
	234: "#7f003f",
	235: "#7f3f5f",
	236: "#4c0026",
	237: "#4c2639",
	238: "#260013",
	239: "#26131c",
	240: "#ff003f",
	241: "#ff7f9f",
	242: "#a50029",
	243: "#a55267",
	244: "#7f001f",
	245: "#7f3f4f",
	246: "#4c0013",
	247: "#4c262f",
	248: "#260009",
	249: "#261317",
	250: "#333333",
	251: "#505050",
	252: "#696969",
	253: "#828282",
	254: "#bebebe",
	255: "#ffffff"
};
function Ae(t, e = "#ffffff", n = e) {
	var i;
	if (typeof t != "number" || Number.isNaN(t)) return e;
	const s = Math.abs(Math.trunc(t));
	return s === 0 || s === 256 || s === 257 ? e : s === 7 ? n : (i = dl[s]) != null ? i : e;
}
function ht(t, e = "rgb") {
	const n = Math.max(0, Math.trunc(t)) & 16777215, s = n >> 16 & 255, i = n >> 8 & 255, o = n & 255;
	return `rgb(${e === "rgb" ? s : o}, ${i}, ${e === "rgb" ? o : s})`;
}
function Ee(t) {
	var e, n, s, i, o, r;
	if (typeof t == "string") {
		const a = t.trim();
		return a ? /^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(a) ? (e = ml(a)) != null ? e : a : {
			red: "#ff0000",
			yellow: "#ffff00",
			green: "#00ff00",
			cyan: "#00ffff",
			blue: "#0000ff",
			magenta: "#ff00ff",
			white: "#ffffff",
			black: "#000000",
			grey: "#808080",
			gray: "#808080"
		}[a.toLowerCase()] : void 0;
	}
	if (t && typeof t == "object") {
		const a = t, c = Number((n = a.r) != null ? n : a.red), l = Number((s = a.g) != null ? s : a.green), h = Number((i = a.b) != null ? i : a.blue), u = Number((r = (o = a.a) != null ? o : a.alpha) != null ? r : 1);
		if ([
			c,
			l,
			h
		].every(Number.isFinite)) return Number.isFinite(u) && u >= 0 && u < 1 ? `rgba(${c}, ${l}, ${h}, ${u})` : `rgb(${c}, ${l}, ${h})`;
	}
}
function ml(t) {
	if (!t) return;
	const e = t.trim();
	if (/^#[0-9a-f]{8}$/i.test(e)) {
		const n = parseInt(e.slice(1, 3), 16) / 255, s = parseInt(e.slice(3, 5), 16), i = parseInt(e.slice(5, 7), 16), o = parseInt(e.slice(7, 9), 16);
		return n >= .999 ? `rgb(${s}, ${i}, ${o})` : `rgba(${s}, ${i}, ${o}, ${un(n)})`;
	}
	if (/^#[0-9a-f]{6}$/i.test(e) || /^#[0-9a-f]{3}$/i.test(e)) return e;
	if (/^sc#/i.test(e)) {
		const n = e.slice(3).split(",").map((a) => Number(a.trim())), [s, i, o, r] = n.length === 4 ? n : [1, ...n];
		if ([
			s,
			i,
			o,
			r
		].every(Number.isFinite)) return `rgba(${Math.round(i * 255)}, ${Math.round(o * 255)}, ${Math.round(r * 255)}, ${un(s)})`;
	}
}
function $e(t, e, n = {}) {
	var a, c, l, h, u;
	const s = (a = n.foreground) != null ? a : "#ffffff", i = s;
	let o;
	const r = (l = (c = Ee(t.trueColor)) != null ? c : Ee(t.color)) != null ? l : Ee(t.colorName);
	if (r && (o = r), !o) {
		const f = Cl(t, [
			"trueColor",
			"true_color",
			"truecolor",
			"colorRGB",
			"colorRgb",
			"rgbColor",
			"rgb"
		]);
		typeof f == "number" && f >= 0 && f <= 16777215 && (o = ht(f, (h = n.trueColorByteOrder) != null ? h : "rgb"));
	}
	if (!o) {
		const f = ur(t.colorIndex, t.colorNumber, t.aci);
		typeof f == "number" && Math.abs(f) <= 257 && f !== 256 && f !== 0 && f !== 257 && (o = Ae(f, i, s));
	}
	if (!o && typeof t.color == "number") {
		const f = Number(t.color);
		Math.abs(f) <= 257 ? f !== 0 && f !== 256 && f !== 257 && (o = Ae(f, i, s)) : o = ht(f, (u = n.trueColorByteOrder) != null ? u : "rgb");
	}
	if (!o) o = yl(wl(e, t.layer), n);
	return cr(o != null ? o : i, e, n);
}
function cn(t, e, n = {}) {
	var o, r, a, c, l;
	let s;
	const i = Ee(t.fillColor);
	if (i && (s = i), !s && typeof t.fillColor == "number") {
		const h = t.fillColor;
		s = Math.abs(h) <= 257 ? Ae(h, (o = n.foreground) != null ? o : "#ffffff", (r = n.foreground) != null ? r : "#ffffff") : ht(h, (a = n.trueColorByteOrder) != null ? a : "rgb");
	}
	return !s && typeof t.fillColorIndex == "number" && (s = Ae(t.fillColorIndex, (c = n.foreground) != null ? c : "#ffffff", (l = n.foreground) != null ? l : "#ffffff")), s ? cr(s, e, n) : void 0;
}
function pl(t, e, n = {}) {
	var c, l, h, u, f;
	const s = Sn(e);
	if (((c = n.colorMode) != null ? c : s.mode) !== "monochrome") return t;
	const o = Ee((u = (h = (l = n.monochromeColor) != null ? l : s.monochromeColor) != null ? h : n.foreground) != null ? u : "#000000");
	if (!o) return t;
	const r = nt(o);
	if (!r) return o;
	const a = nt(t);
	return hn({
		r: r.r,
		g: r.g,
		b: r.b,
		a: r.a * ((f = a == null ? void 0 : a.a) != null ? f : 1)
	});
}
function cr(t, e, n) {
	var r;
	const s = Sn(e), i = (r = n.colorMode) != null ? r : s.mode, o = pl(t, e, n);
	return i === "monochrome" ? o : gl(o, n);
}
function gl(t, e = {}) {
	var i, o, r;
	if (e.contrastMode !== "adaptive") return t;
	return bl(t, (i = e.background) != null ? i : "#0b1020", (o = e.foreground) != null ? o : "#ffffff", (r = e.minColorContrast) != null ? r : 2.4);
}
function bl(t, e, n, s = 2.4) {
	var h, u;
	const i = (h = nt(n)) != null ? h : {
		r: 255,
		g: 255,
		b: 255,
		a: 1
	}, o = (u = nt(e)) != null ? u : {
		r: 11,
		g: 16,
		b: 32,
		a: 1
	}, r = nt(t);
	if (!r) return t;
	if (Vt(uo(r, o), o) >= s) return t;
	const c = ln(o), l = c < .5 ? {
		r: 255,
		g: 255,
		b: 255,
		a: r.a
	} : {
		r: 0,
		g: 0,
		b: 0,
		a: r.a
	};
	for (const f of [
		.25,
		.4,
		.55,
		.7,
		.85,
		1
	]) {
		const d = Sl(r, l, f);
		if (Vt(uo(d, o), o) >= s) return hn(d);
	}
	return Vt(i, o) >= s ? hn(i) : c < .5 ? "#ffffff" : "#000000";
}
function lr(t) {
	return t ? t.isVisible !== !1 && t.isFrozen !== !0 : !0;
}
function yl(t, e) {
	var o, r, a;
	if (!t) return;
	const n = (o = e.foreground) != null ? o : "#ffffff", s = Ee(t.trueColor);
	if (s) return s;
	if (typeof t.trueColor == "number" && t.trueColor >= 0 && t.trueColor <= 16777215) return ht(t.trueColor, (r = e.trueColorByteOrder) != null ? r : "rgb");
	const i = Ee(t.color);
	if (i) return i;
	if (vl(t.colorIndex)) return Ae(t.colorIndex, n, n);
	if (typeof t.color == "number") {
		const c = Number(t.color);
		return Math.abs(c) <= 257 ? Ae(c, n, n) : ht(c, (a = e.trueColorByteOrder) != null ? a : "rgb");
	}
	if (typeof t.colorIndex == "number") return Ae(t.colorIndex, n, n);
}
function xl(t) {
	return ur(t.colorIndex, t.colorNumber, t.aci) === 0 ? !0 : t.trueColor === void 0 && t.color === 0;
}
function hr(t, e, n, s = {}) {
	if (!xl(t)) return t;
	const i = $e(e, n, {
		...s,
		colorMode: "source"
	});
	return {
		...t,
		color: i,
		trueColor: void 0,
		colorIndex: void 0,
		colorNumber: void 0
	};
}
function vl(t) {
	return typeof t == "number" && Number.isFinite(t) && Math.abs(Math.trunc(t)) >= 1 && Math.abs(Math.trunc(t)) <= 255;
}
function wl(t, e) {
	var n, s;
	if (!(!t || !e)) return (s = (n = t.layers[e]) != null ? n : t.layers[e.toLowerCase()]) != null ? s : Object.values(t.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
}
function ur(...t) {
	for (const e of t) if (typeof e == "number" && Number.isFinite(e)) return e;
}
function Cl(t, e) {
	const n = t;
	for (const s of e) {
		const i = n[s];
		if (typeof i == "number" && Number.isFinite(i)) return i;
	}
}
function nt(t) {
	const e = t.trim().toLowerCase();
	if (/^#[0-9a-f]{3}$/i.test(e)) return {
		r: parseInt(e[1] + e[1], 16),
		g: parseInt(e[2] + e[2], 16),
		b: parseInt(e[3] + e[3], 16),
		a: 1
	};
	if (/^#[0-9a-f]{6}$/i.test(e)) return {
		r: parseInt(e.slice(1, 3), 16),
		g: parseInt(e.slice(3, 5), 16),
		b: parseInt(e.slice(5, 7), 16),
		a: 1
	};
	const n = e.match(/^rgba?\(([^)]+)\)$/i);
	if (n) {
		const s = n[1].split(/[,\s/]+/).filter(Boolean).map((i) => Number(i.replace("%", "")));
		if (s.length >= 3 && s.slice(0, 3).every(Number.isFinite)) {
			const i = /%/.test(n[1]);
			return {
				r: Xe(i ? s[0] * 2.55 : s[0]),
				g: Xe(i ? s[1] * 2.55 : s[1]),
				b: Xe(i ? s[2] * 2.55 : s[2]),
				a: Number.isFinite(s[3]) ? Math.max(0, Math.min(1, s[3])) : 1
			};
		}
	}
}
function uo(t, e) {
	const n = t.a + e.a * (1 - t.a);
	return n <= 0 ? {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	} : {
		r: (t.r * t.a + e.r * e.a * (1 - t.a)) / n,
		g: (t.g * t.a + e.g * e.a * (1 - t.a)) / n,
		b: (t.b * t.a + e.b * e.a * (1 - t.a)) / n,
		a: n
	};
}
function Sl(t, e, n) {
	const s = Math.max(0, Math.min(1, n));
	return {
		r: t.r + (e.r - t.r) * s,
		g: t.g + (e.g - t.g) * s,
		b: t.b + (e.b - t.b) * s,
		a: t.a
	};
}
function ln(t) {
	const e = [
		t.r,
		t.g,
		t.b
	].map((n) => {
		const s = n / 255;
		return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
	});
	return .2126 * e[0] + .7152 * e[1] + .0722 * e[2];
}
function Vt(t, e) {
	const n = ln(t), s = ln(e), i = Math.max(n, s), o = Math.min(n, s);
	return (i + .05) / (o + .05);
}
function hn(t) {
	const e = Xe(t.r), n = Xe(t.g), s = Xe(t.b);
	return t.a < .999 ? `rgba(${e}, ${n}, ${s}, ${un(t.a)})` : `rgb(${e}, ${n}, ${s})`;
}
function Xe(t) {
	return Math.max(0, Math.min(255, Math.round(t)));
}
function un(t) {
	return Math.round(t * 1e3) / 1e3;
}
var kl = {
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
};
function Tt(t, e) {
	return {
		a: t.a * e.a + t.c * e.b,
		b: t.b * e.a + t.d * e.b,
		c: t.a * e.c + t.c * e.d,
		d: t.b * e.c + t.d * e.d,
		e: t.a * e.e + t.c * e.f + t.e,
		f: t.b * e.e + t.d * e.f + t.f
	};
}
function fo(t, e) {
	return {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: t,
		f: e
	};
}
function fr(t) {
	const e = Math.cos(t), n = Math.sin(t);
	return {
		a: e,
		b: n,
		c: -n,
		d: e,
		e: 0,
		f: 0
	};
}
function Nl(t, e = t) {
	return {
		a: t,
		b: 0,
		c: 0,
		d: e,
		e: 0,
		f: 0
	};
}
function re(t, e) {
	return {
		x: t.x * e.a + t.y * e.c + e.e,
		y: t.x * e.b + t.y * e.d + e.f,
		z: "z" in t ? t.z : void 0
	};
}
function mo(t, e) {
	if (t) return t.map((n) => ({
		cmd: n.cmd,
		points: n.points.map((s) => re(s, e))
	}));
}
function kn(t, e = {
	x: 0,
	y: 0
}) {
	var c, l, h, u, f, d;
	const n = (c = t.insertionPoint) != null ? c : {
		x: 0,
		y: 0
	}, s = t.scale, i = Number(typeof s == "object" && s ? (l = s.x) != null ? l : 1 : (h = t.scaleX) != null ? h : 1), o = Number(typeof s == "object" && s ? (u = s.y) != null ? u : i : (f = t.scaleY) != null ? f : i), r = Number((d = t.rotation) != null ? d : 0);
	let a = fo(n.x, n.y);
	return a = Tt(a, fr(Number.isFinite(r) ? r : 0)), a = Tt(a, Nl(Number.isFinite(i) ? i : 1, Number.isFinite(o) ? o : 1)), a = Tt(a, fo(-e.x, -e.y)), a;
}
function Ye(t, e) {
	var l, h, u;
	const n = { ...t }, s = e.a * e.d - e.b * e.c, i = Math.sqrt(Math.abs(s)), o = Math.hypot(e.a, e.b), r = Math.hypot(e.c, e.d);
	if (t.startPoint && (n.startPoint = re(t.startPoint, e)), t.endPoint && (n.endPoint = re(t.endPoint, e)), t.center && (n.center = re(t.center, e)), t.insertionPoint && (n.insertionPoint = re(t.insertionPoint, e)), t.majorAxisEndPoint) {
		const f = re({
			x: 0,
			y: 0
		}, e), d = re(t.majorAxisEndPoint, e);
		n.majorAxisEndPoint = {
			x: d.x - f.x,
			y: d.y - f.y,
			z: d.z
		};
	}
	t.vertices && (n.vertices = t.vertices.map((f) => ({
		...re(f, e),
		bulge: f.bulge,
		startWidth: po(f.startWidth, i),
		endWidth: po(f.endWidth, i)
	}))), t.points && (n.points = t.points.map((f) => re(f, e))), t.controlPoints && (n.controlPoints = t.controlPoints.map((f) => re(f, e))), t.fitPoints && (n.fitPoints = t.fitPoints.map((f) => re(f, e))), t.attribs && (n.attribs = t.attribs.map((f) => Ye(f, e))), t.commands && (n.commands = mo(t.commands, e)), t.loops && (n.loops = t.loops.map((f) => {
		var d;
		return {
			...f,
			vertices: (d = f.vertices) == null ? void 0 : d.map((m) => re(m, e)),
			commands: mo(f.commands, e)
		};
	})), typeof t.radius == "number" && Number.isFinite(i) && (n.radius = t.radius * i), typeof t.constantWidth == "number" && Number.isFinite(i) && (n.constantWidth = t.constantWidth * i), typeof t.thickness == "number" && Number.isFinite(i) && (n.thickness = t.thickness * i), typeof t.lineTypeScale == "number" && Number.isFinite(i) && (n.lineTypeScale = t.lineTypeScale * i), (t.kind === "text" || /^(TEXT|MTEXT|ATTRIB|ATTDEF|DIMENSION)$/i.test(String((l = t.type) != null ? l : ""))) && (typeof t.textHeight == "number" && Number.isFinite(r) && (n.textHeight = t.textHeight * r), typeof t.height == "number" && Number.isFinite(r) && (n.height = t.height * r), typeof t.xScale == "number" && r > 1e-14 && Number.isFinite(o) && (n.xScale = t.xScale * o / r));
	const a = Math.atan2(e.b, e.a), c = t.kind === "ellipse" || String((h = t.type) != null ? h : "").toUpperCase() === "ELLIPSE";
	return (typeof t.rotation == "number" || t.kind === "text" || t.kind === "insert") && (n.rotation = Pl(Number((u = t.rotation) != null ? u : 0) + (Number.isFinite(a) ? a : 0))), Number.isFinite(a) && Math.abs(a) > 1e-14 && (!c && typeof t.startAngle == "number" && (n.startAngle = t.startAngle + a), !c && typeof t.endAngle == "number" && (n.endAngle = t.endAngle + a)), s < 0 && n.vertices && (n.vertices = n.vertices.map((f) => ({
		...f,
		bulge: typeof f.bulge == "number" ? -f.bulge : void 0
	}))), n;
}
function po(t, e) {
	return typeof t == "number" && Number.isFinite(e) ? t * e : t;
}
function Pl(t) {
	if (!Number.isFinite(t)) return t;
	const e = Math.PI * 2, n = ((t + Math.PI) % e + e) % e - Math.PI;
	return Math.abs(n) <= 1e-12 ? 0 : n;
}
var Ml = 16;
var Tl = 96;
var Al = .01;
function dr(t, e = {}) {
	var i;
	const n = fe();
	for (const o of (i = t.pages) != null ? i : []) K(n, {
		x: 0,
		y: 0
	}), K(n, {
		x: o.width,
		y: o.height
	});
	const s = pr(t, e);
	for (const o of t.entities) Oo(n, gr(o, s));
	return _o(n);
}
function mr(t, e, n = "auto", s = {}) {
	if (n === "extents") return e;
	const i = El(t);
	if (!i) return e;
	if (n === "saved-view") return i;
	const o = fe(), r = pr(t, s);
	let a = 0;
	for (const c of t.entities) {
		const l = Dl(gr(c, r), i);
		l && (a++, Oo(o, l));
	}
	return a === 0 || !Bl(o, i) ? i : _o(o);
}
function El(t) {
	const e = t.savedView;
	if (!e || e.source !== "vport" || e.sceneTransformApplied !== !0 || !L(e.center)) return;
	const n = Number(e.viewHeight), s = Number(e.aspectRatio);
	if (!Number.isFinite(n) || n <= 1e-9 || !Number.isFinite(s) || s <= 1e-9) return;
	const i = n * s;
	return {
		minX: e.center.x - i / 2,
		minY: e.center.y - n / 2,
		maxX: e.center.x + i / 2,
		maxY: e.center.y + n / 2
	};
}
function pr(t, e) {
	var n, s;
	return {
		document: t,
		maxInsertDepth: Math.max(0, Math.floor((n = e.maxInsertDepth) != null ? n : Ml)),
		maxCurveSegments: Math.max(12, Math.floor((s = e.maxCurveSegments) != null ? s : Tl))
	};
}
function gr(t, e, n = 0) {
	const s = fe();
	return br(s, t, e, n), s;
}
function br(t, e, n, s) {
	var r, a, c, l, h, u, f, d, m, p, g, b, y, v, x;
	const i = String((r = e.type) != null ? r : "").toUpperCase(), o = (a = e.kind) != null ? a : ot(i);
	if (o === "insert") {
		const w = Il(n.document, (c = e.blockName) != null ? c : e.name);
		if (w && s < n.maxInsertDepth) {
			const C = kn(e, (l = w.basePoint) != null ? l : {
				x: 0,
				y: 0
			});
			for (const N of w.entities) br(t, Ye(N, C), n, s + 1);
			return;
		}
	}
	if (o === "line") L(e.startPoint) && K(t, e.startPoint), L(e.endPoint) && K(t, e.endPoint);
	else if (o === "circle" || o === "arc") L(e.center) && Number.isFinite(e.radius) && qr(t, e.center, Number(e.radius));
	else if (o === "polyline" || o === "solid" || o === "spline") for (const w of [
		...(h = e.vertices) != null ? h : [],
		...(u = e.points) != null ? u : [],
		...(f = e.controlPoints) != null ? f : [],
		...(d = e.fitPoints) != null ? d : []
	]) L(w) && K(t, w);
	else if (o === "ellipse") {
		if (L(e.center) && L(e.majorAxisEndPoint)) for (const w of gn(e.center, e.majorAxisEndPoint, Number((m = e.axisRatio) != null ? m : 1), Number((p = e.startAngle) != null ? p : 0), Number((g = e.endAngle) != null ? g : Math.PI * 2), n.maxCurveSegments)) K(t, w);
	} else if (o === "path") for (const w of (b = e.commands) != null ? b : []) for (const C of w.points) K(t, C);
	else if (o === "hatch") for (const w of (y = e.loops) != null ? y : []) {
		for (const C of (v = w.vertices) != null ? v : []) K(t, C);
		for (const C of (x = w.commands) != null ? x : []) for (const N of C.points) K(t, N);
	}
	else {
		const w = Ll(e);
		w && K(t, w);
	}
}
function Ll(t) {
	for (const e of [
		"startPoint",
		"insertionPoint",
		"center",
		"point",
		"location"
	]) {
		const n = t[e];
		if (L(n)) return n;
	}
	if (Array.isArray(t.vertices) && L(t.vertices[0])) return t.vertices[0];
	if (Array.isArray(t.commands)) {
		const e = t.commands.find((n) => n.points.length > 0);
		if (e) return e.points[0];
	}
}
function Il(t, e) {
	var n, s;
	if (e) return (s = (n = t.blocks[e]) != null ? n : t.blocks[e.toLowerCase()]) != null ? s : Object.values(t.blocks).find((i) => i.name.toLowerCase() === e.toLowerCase());
}
function Dl(t, e) {
	if (!ae(t) || !ae(e)) return;
	const n = {
		minX: Math.max(t.minX, e.minX),
		minY: Math.max(t.minY, e.minY),
		maxX: Math.min(t.maxX, e.maxX),
		maxY: Math.min(t.maxY, e.maxY)
	};
	return ae(n) ? n : void 0;
}
function Bl(t, e) {
	if (!ae(t) || !ae(e)) return !1;
	const n = Math.hypot(t.maxX - t.minX, t.maxY - t.minY), s = Math.hypot(e.maxX - e.minX, e.maxY - e.minY);
	return s > 1e-9 && n / s >= Al;
}
var go = 1e5;
var yr = /* @__PURE__ */ new Set([
	"",
	"bylayer",
	"15"
]);
var Nn = /* @__PURE__ */ new Set(["byblock", "14"]);
var Rl = /* @__PURE__ */ new Set(["continuous", "16"]);
var We = (t) => String(t != null ? t : "").trim().toLowerCase();
function Fl(t) {
	return Nn.has(We(t));
}
function xr(t, e, n) {
	if (!Fl(t.lineType)) return t;
	const s = vr(e, n);
	return {
		...t,
		lineType: s || "Continuous",
		lineTypeScale: st(t.lineTypeScale, 1) * st(e.lineTypeScale, 1)
	};
}
function vr(t, e) {
	var i, o, r;
	let n = String((i = t.lineType) != null ? i : "").trim();
	const s = We(n);
	return yr.has(s) ? n = (r = (o = Wl(e, t.layer)) == null ? void 0 : o.lineType) != null ? r : "Continuous" : Nn.has(s) && (n = "Continuous"), n || "Continuous";
}
function fn(t, e) {
	var u, f;
	if (!e) return;
	const n = vr(t, e), s = We(n);
	if (Rl.has(s) || yr.has(s) || Nn.has(s)) return;
	const i = Xl(e, n);
	if (!(i != null && i.pattern.length)) return;
	const o = st(t.lineTypeScale, st((u = e.header) == null ? void 0 : u.CELTSCALE, 1)), a = Ol(i, st((f = e.header) == null ? void 0 : f.LTSCALE, 1) * o), c = a.reduce((d, m) => d + m.length, 0);
	if (!Number.isFinite(c) || c <= 1e-9) return;
	const l = a.some((d) => !d.draw && d.length > 1e-12), h = a.some((d) => d.marker);
	if (!(!l && !h)) return {
		name: i.name,
		segments: $l(a, l),
		runs: a,
		period: c
	};
}
function Pn(t, e, n, s = go) {
	const i = t.filter((b) => Number.isFinite(b.x) && Number.isFinite(b.y));
	if (i.length < 2 || n.runs.length === 0) return {
		segments: [],
		dots: []
	};
	const o = [];
	for (let b = 0; b < i.length - 1; b++) o.push([i[b], i[b + 1]]);
	e && o.push([i[i.length - 1], i[0]]);
	const r = Number.isFinite(s) ? Math.max(1, Math.floor(s)) : go, a = o.reduce((b, [y, v]) => b + Math.hypot(v.x - y.x, v.y - y.y), 0), l = (n.period > 1e-12 ? a / n.period : Number.POSITIVE_INFINITY) * Math.max(1, n.runs.length);
	if (!Number.isFinite(l) || l > r) return {
		segments: o,
		dots: []
	};
	const h = {
		segments: [],
		dots: []
	};
	let u = 0, f = n.runs[0].length, d = !0;
	const m = (b) => {
		const y = h.dots[h.dots.length - 1];
		y && Math.hypot(y.x - b.x, y.y - b.y) <= 1e-10 || h.dots.push(b);
	}, p = () => {
		u = (u + 1) % n.runs.length, f = n.runs[u].length, d = !0;
	}, g = (b, y, v, x, w) => {
		var N;
		const C = _l(b, y, v / w, x / w);
		m(y), C && ((N = h.markers) != null ? N : h.markers = []).push(C);
	};
	for (const [b, y] of o) {
		const v = y.x - b.x, x = y.y - b.y, w = Math.hypot(v, x);
		if (w <= 1e-14) continue;
		let C = 0;
		for (; C < w - 1e-12;) {
			let N = 0;
			for (; f <= 1e-12 && N < n.runs.length;) {
				const I = n.runs[u];
				if (d && I.marker) {
					const P = C / w, M = {
						x: b.x + v * P,
						y: b.y + x * P
					};
					bo(I) ? g(I, M, v, x, w) : m(M);
				}
				p(), N++;
			}
			if (f <= 1e-12) break;
			const B = n.runs[u];
			if (d) {
				if (B.marker) {
					const I = C / w, P = {
						x: b.x + v * I,
						y: b.y + x * I
					};
					bo(B) ? g(B, P, v, x, w) : m(P);
				}
				d = !1;
			}
			const D = Math.min(f, w - C);
			if (B.draw && D > 1e-12) {
				const I = C / w, P = (C + D) / w;
				h.segments.push([{
					x: b.x + v * I,
					y: b.y + x * I
				}, {
					x: b.x + v * P,
					y: b.y + x * P
				}]);
			}
			C += D, f -= D, f <= 1e-12 && p();
		}
	}
	return h;
}
function Ol(t, e) {
	var s;
	const n = [];
	for (const i of t.pattern) {
		const o = Number(i.length), r = Number((s = i.elementTypeFlag) != null ? s : 0) !== 0;
		Number.isFinite(o) && n.push({
			draw: o >= 0,
			length: Math.abs(o) * e,
			marker: o >= 0 && (o === 0 || r),
			element: i,
			globalScale: e
		});
	}
	return n;
}
function wr(t, e) {
	const n = Math.cos(t.angle), s = Math.sin(t.angle);
	return e.polylines.map((i) => i.map((o) => {
		const r = o.x * t.scale, a = o.y * t.scale;
		return {
			x: t.point.x + r * n - a * s,
			y: t.point.y + r * s + a * n
		};
	}));
}
function bo(t) {
	var e, n;
	return Number((n = (e = t.element) == null ? void 0 : e.elementTypeFlag) != null ? n : 0) !== 0;
}
function _l(t, e, n, s) {
	var d;
	const i = t.element, o = Number((d = i == null ? void 0 : i.elementTypeFlag) != null ? d : 0);
	if (!i || o === 0) return;
	const r = kt(i.offsetX, 0) * t.globalScale, a = kt(i.offsetY, 0) * t.globalScale, c = kt(i.rotation, 0), l = Math.atan2(s, n), u = {
		fallbackPoint: e,
		point: {
			x: e.x + n * r - s * a,
			y: e.y + s * r + n * a
		},
		angle: (o & 1) === 1 ? c : l + c,
		scale: Math.abs(kt(i.scale, 1) * t.globalScale),
		fontName: i.fontName
	}, f = Number(i.shapeNumber);
	if ((o & 4) === 4 && Number.isFinite(f)) return {
		...u,
		kind: "shape",
		shapeNumber: Math.trunc(f)
	};
	if ((o & 2) === 2 && i.text) return {
		...u,
		kind: "text",
		text: i.text
	};
}
function $l(t, e) {
	if (!e) return [];
	const n = [];
	for (const i of t) {
		if (i.length <= 1e-12) continue;
		const o = n[n.length - 1];
		(o == null ? void 0 : o.draw) === i.draw ? o.length += i.length : n.push({
			draw: i.draw,
			length: i.length
		});
	}
	const s = [];
	for (const i of n) {
		const o = s.length % 2 === 0;
		i.draw !== o && s.push(1e-9), s.push(i.length);
	}
	return s.length % 2 === 1 && s.push(1e-9), s;
}
function Xl(t, e) {
	var i, o, r;
	const n = We(e), s = (i = t.lineTypes) != null ? i : {};
	return (r = (o = s[e]) != null ? o : s[n]) != null ? r : Object.values(s).find((a) => We(a.name) === n || We(a.handle) === n);
}
function Wl(t, e) {
	var n, s;
	if (!(!t || !e)) return (s = (n = t.layers[e]) != null ? n : t.layers[e.toLowerCase()]) != null ? s : Object.values(t.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
}
function st(t, e) {
	const n = Number(t);
	return Number.isFinite(n) && n > 0 ? n : e;
}
function kt(t, e) {
	const n = Number(t);
	return Number.isFinite(n) ? n : e;
}
var Ul = (t) => Math.abs(t.a - 1) < 1e-12 && Math.abs(t.b) < 1e-12 && Math.abs(t.c) < 1e-12 && Math.abs(t.d - 1) < 1e-12 && Math.abs(t.e) < 1e-9 && Math.abs(t.f) < 1e-9;
function Cr(t) {
	var n, s, i, o;
	if (t.metadata.sceneTransformApplied === !0 || ((n = t.savedView) == null ? void 0 : n.sceneTransformApplied) === !1) return t;
	const e = (i = (s = t.savedView) == null ? void 0 : s.sceneTransform) != null ? i : kl;
	return Ul(e) ? t : {
		...t,
		entities: t.entities.map((r) => Ye(r, e)),
		pages: (o = t.pages) == null ? void 0 : o.map((r) => ({
			...r,
			entities: r.entities.map((a) => Ye(a, e))
		})),
		metadata: {
			...t.metadata,
			sceneTransformApplied: !0
		}
	};
}
var zl = {
	background: "#0b1020",
	foreground: "#ffffff",
	showUnsupportedMarkers: !1,
	showImagePlaceholders: !0,
	showPageBounds: !0,
	minScale: 1e-9,
	maxScale: 1e9,
	wheelZoomFactor: 1.14,
	trueColorByteOrder: "rgb",
	maxInsertDepth: 16,
	fitMode: "auto",
	contrastMode: "adaptive",
	minColorContrast: 2.4,
	maxCurveSegments: 96,
	spatialIndexCellCount: 72,
	maxVerticesPerBatch: 65536,
	textMinPixelHeight: 4,
	maxVisibleTextLabels: 2500,
	powerPreference: "high-performance",
	antialias: !0,
	preserveDrawingBuffer: !1,
	enableSpatialIndex: !0,
	shxGlyphResolver: ar
};
var yo = class {
	constructor(e, n = {}) {
		S(this, "canvas");
		S(this, "ctx");
		S(this, "opts");
		S(this, "sourceDocument");
		S(this, "document");
		S(this, "bounds", fe());
		S(this, "view", {
			centerX: 0,
			centerY: 0,
			scale: 1
		});
		S(this, "fitScale", 1);
		S(this, "dpr", 1);
		S(this, "isDragging", !1);
		S(this, "lastPointer");
		S(this, "resizeObserver");
		S(this, "imageCache", /* @__PURE__ */ new Map());
		S(this, "stats", {
			total: 0,
			drawn: 0,
			skipped: 0,
			byType: {},
			unsupported: {},
			renderElapsedMs: 0,
			backend: "canvas2d"
		});
		S(this, "onStats");
		S(this, "onViewChange");
		const s = e.getContext("2d");
		if (!s) throw new Error("Canvas 2D context is not available.");
		this.canvas = e, this.ctx = s, this.opts = {
			...zl,
			...n
		}, this.canvas.classList.add("cad-viewer-canvas"), this.bindEvents(), typeof ResizeObserver != "undefined" && (this.resizeObserver = new ResizeObserver(() => this.resize()), this.resizeObserver.observe(e)), this.resize();
	}
	captureCanvas() {
		return this.render(), yn([this.canvas]);
	}
	destroy() {
		var e;
		(e = this.resizeObserver) == null || e.disconnect();
	}
	clear() {
		this.sourceDocument = void 0, this.document = void 0, this.bounds = fe(), this.view = {
			centerX: 0,
			centerY: 0,
			scale: 1
		}, this.fitScale = 1, this.render(), this.emitViewChange();
	}
	setDocument(e) {
		this.sourceDocument = e, this.document = Cr(e), this.bounds = dr(this.document, this.boundsOptions()), this.fitToView();
	}
	refreshReferences() {
		this.render(), this.emitViewChange();
	}
	getDocument() {
		return this.document;
	}
	getSourceDocument() {
		return this.sourceDocument;
	}
	setOptions(e) {
		const n = e.fitMode !== void 0 && e.fitMode !== this.opts.fitMode;
		if (Object.assign(this.opts, e), n && this.document) {
			this.fitToView();
			return;
		}
		this.render(), this.emitViewChange();
	}
	getOptions() {
		return { ...this.opts };
	}
	fitToView(e = .92, n = this.opts.fitMode) {
		const s = this.document ? mr(this.document, this.bounds, n, this.boundsOptions()) : this.bounds;
		if (!ae(s)) {
			this.view = {
				centerX: 0,
				centerY: 0,
				scale: 1
			}, this.fitScale = 1, this.render(), this.emitViewChange();
			return;
		}
		const i = Math.max(1, this.cssWidth), o = Math.max(1, this.cssHeight), r = Math.max(s.maxX - s.minX, 1e-9), a = Math.max(s.maxY - s.minY, 1e-9), c = this.clampScale(Math.min(i / r, o / a) * e);
		this.fitScale = c, this.view = {
			centerX: (s.minX + s.maxX) / 2,
			centerY: (s.minY + s.maxY) / 2,
			scale: c
		}, this.render(), this.emitViewChange();
	}
	resize() {
		this.dpr = Math.max(1, window.devicePixelRatio || 1);
		const e = Math.max(1, Math.floor(this.cssWidth * this.dpr)), n = Math.max(1, Math.floor(this.cssHeight * this.dpr));
		(this.canvas.width !== e || this.canvas.height !== n) && (this.canvas.width = e, this.canvas.height = n), this.render(), this.emitViewChange();
	}
	zoom(e, n) {
		if (!Number.isFinite(e) || e <= 0) return;
		const s = n != null ? n : {
			x: this.cssWidth / 2,
			y: this.cssHeight / 2
		}, i = this.screenToWorld(s);
		this.view.scale = this.clampScale(this.view.scale * e);
		const o = this.screenToWorld(s);
		this.view.centerX += i.x - o.x, this.view.centerY += i.y - o.y, this.render(), this.emitViewChange();
	}
	zoomIn() {
		this.zoom(this.opts.wheelZoomFactor);
	}
	zoomOut() {
		this.zoom(1 / this.opts.wheelZoomFactor);
	}
	panByScreenDelta(e, n) {
		!Number.isFinite(e) || !Number.isFinite(n) || (this.view.centerX -= e / this.view.scale, this.view.centerY += n / this.view.scale, this.render(), this.emitViewChange());
	}
	setViewState(e) {
		if (![
			e.centerX,
			e.centerY,
			e.scale
		].every(Number.isFinite)) throw new Error("Invalid view state.");
		this.view = {
			...e,
			scale: this.clampScale(e.scale)
		}, this.render(), this.emitViewChange();
	}
	getViewState() {
		return { ...this.view };
	}
	getBounds() {
		return { ...this.bounds };
	}
	getStats() {
		return Yl(this.stats);
	}
	getZoomRatio() {
		return Math.abs(this.fitScale) < 1e-12 ? 1 : this.view.scale / this.fitScale;
	}
	getZoomPercent() {
		return this.getZoomRatio() * 100;
	}
	worldToScreen(e) {
		return {
			x: this.cssWidth / 2 + (e.x - this.view.centerX) * this.view.scale,
			y: this.cssHeight / 2 - (e.y - this.view.centerY) * this.view.scale
		};
	}
	screenToWorld(e) {
		return {
			x: this.view.centerX + (e.x - this.cssWidth / 2) / this.view.scale,
			y: this.view.centerY - (e.y - this.cssHeight / 2) / this.view.scale
		};
	}
	render() {
		var n, s;
		const e = performance.now();
		if (this.stats = {
			total: 0,
			drawn: 0,
			skipped: 0,
			byType: {},
			unsupported: {},
			renderElapsedMs: 0,
			backend: "canvas2d"
		}, this.clearCanvas(), this.document) {
			this.opts.showPageBounds && (n = this.document.pages) != null && n.length && this.drawPageBounds(this.document);
			for (const i of this.document.entities) this.drawEntityTracked(i, 0);
		}
		return this.stats.renderElapsedMs = performance.now() - e, (s = this.onStats) == null || s.call(this, this.getStats()), this.getStats();
	}
	get cssWidth() {
		return this.canvas.clientWidth || 1;
	}
	get cssHeight() {
		return this.canvas.clientHeight || 1;
	}
	bindEvents() {
		this.canvas.addEventListener("wheel", (n) => {
			n.preventDefault();
			const s = n.deltaY < 0 ? this.opts.wheelZoomFactor : 1 / this.opts.wheelZoomFactor;
			this.zoom(s, {
				x: n.offsetX,
				y: n.offsetY
			});
		}, { passive: !1 }), this.canvas.addEventListener("pointerdown", (n) => {
			this.canvas.setPointerCapture(n.pointerId), this.isDragging = !0, this.lastPointer = {
				x: n.clientX,
				y: n.clientY
			}, this.canvas.classList.add("is-dragging");
		}), this.canvas.addEventListener("pointermove", (n) => {
			!this.isDragging || !this.lastPointer || (this.panByScreenDelta(n.clientX - this.lastPointer.x, n.clientY - this.lastPointer.y), this.lastPointer = {
				x: n.clientX,
				y: n.clientY
			});
		});
		const e = (n) => {
			n && this.canvas.hasPointerCapture(n.pointerId) && this.canvas.releasePointerCapture(n.pointerId), this.isDragging = !1, this.lastPointer = void 0, this.canvas.classList.remove("is-dragging");
		};
		this.canvas.addEventListener("pointerup", e), this.canvas.addEventListener("pointercancel", () => e());
	}
	clearCanvas() {
		const e = this.ctx;
		e.save(), e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.cssWidth, this.cssHeight), e.fillStyle = this.opts.background, e.fillRect(0, 0, this.cssWidth, this.cssHeight), e.restore();
	}
	drawPageBounds(e) {
		var s;
		const n = this.ctx;
		n.save(), n.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), n.strokeStyle = "rgba(148, 163, 184, 0.35)", n.lineWidth = 1, n.setLineDash([8, 6]);
		for (const i of (s = e.pages) != null ? s : []) {
			const o = this.worldToScreen({
				x: 0,
				y: 0
			}), r = this.worldToScreen({
				x: i.width,
				y: i.height
			});
			n.strokeRect(Math.min(o.x, r.x), Math.min(o.y, r.y), Math.abs(r.x - o.x), Math.abs(r.y - o.y));
		}
		n.restore();
	}
	drawEntityTracked(e, n) {
		var o, r;
		this.stats.total++;
		const s = String((o = e.type) != null ? o : "UNKNOWN").toUpperCase();
		this.stats.byType[s] = ((r = this.stats.byType[s]) != null ? r : 0) + 1;
		const i = this.lookupLayer(e.layer);
		if (e.isVisible === !1 || !lr(i)) {
			this.stats.skipped++;
			return;
		}
		this.drawEntity(e, s, n);
	}
	drawEntity(e, n, s) {
		var o, r;
		switch ((o = e.kind) != null ? o : ot(n)) {
			case "line": return this.drawLine(e);
			case "circle": return this.drawCircle(e);
			case "arc": return this.drawArc(e);
			case "polyline": return this.drawPolyline(e);
			case "ellipse": return this.drawEllipse(e);
			case "text": return this.drawText(e);
			case "point": return this.drawPoint(e);
			case "insert": return this.drawInsert(e, s);
			case "solid": return this.drawSolid(e);
			case "hatch": return this.drawHatch(e);
			case "spline": return this.drawSpline(e);
			case "path": return this.drawPath(e);
			case "image": return this.drawImage(e);
			case "viewport": return this.markSkipped(n);
			default: this.stats.unsupported[n] = ((r = this.stats.unsupported[n]) != null ? r : 0) + 1, this.stats.skipped++, this.opts.showUnsupportedMarkers && this.drawUnsupportedMarker(e);
		}
	}
	beginStyledPath(e, n = !1, s = !0) {
		var h, u;
		const i = this.ctx;
		i.save(), i.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		const o = $e(e, this.document, {
			foreground: this.opts.foreground,
			background: this.opts.background,
			trueColorByteOrder: this.opts.trueColorByteOrder,
			contrastMode: this.opts.contrastMode,
			minColorContrast: this.opts.minColorContrast
		}), r = (h = cn(e, this.document, {
			foreground: this.opts.foreground,
			background: this.opts.background,
			trueColorByteOrder: this.opts.trueColorByteOrder,
			contrastMode: this.opts.contrastMode,
			minColorContrast: this.opts.minColorContrast
		})) != null ? h : o;
		i.strokeStyle = o, i.fillStyle = n ? r : o, i.globalAlpha = Re(Number((u = e.opacity) != null ? u : 1), 0, 1), i.lineCap = "round", i.lineJoin = "round";
		const a = typeof e.lineweight == "number" && e.lineweight > 0 ? e.lineweight / 30 : 1, c = Io(e) * Math.abs(this.view.scale);
		i.lineWidth = Math.max(1, Math.min(256, Math.max(a, Number.isFinite(c) ? c : 0)));
		const l = s ? fn(e, this.document) : void 0;
		i.setLineDash(l ? l.segments.map((f) => Math.max(.05, f * this.view.scale)) : []), i.beginPath();
	}
	finishStroke() {
		this.ctx.stroke(), this.ctx.restore(), this.stats.drawn++;
	}
	finishFillStroke(e = !1) {
		e && this.ctx.fill(), this.ctx.stroke(), this.ctx.restore(), this.stats.drawn++;
	}
	drawLine(e) {
		const n = e.startPoint, s = e.endPoint;
		if (!L(n) || !L(s)) return this.markSkipped("LINE");
		this.strokeWorldPolyline(e, [n, s], !1);
	}
	drawCircle(e) {
		const n = e.center, s = Number(e.radius);
		if (!L(n) || !Number.isFinite(s)) return this.markSkipped("CIRCLE");
		this.strokeWorldPolyline(e, at(j(n), s, 0, Math.PI * 2, !0), !0);
	}
	drawArc(e) {
		const n = e.center, s = Number(e.radius), i = Number(e.startAngle), o = Number(e.endAngle);
		if (!L(n) || !Number.isFinite(s) || !Number.isFinite(i) || !Number.isFinite(o)) return this.markSkipped("ARC");
		this.strokeWorldPolyline(e, at(j(n), s, i, o, !0), !1);
	}
	drawPolyline(e) {
		var r, a;
		const n = (r = e.vertices) != null ? r : e.points;
		if (!Array.isArray(n) || n.length < 2) return this.markSkipped(String(e.type));
		const s = Lo(e), i = [], o = s ? n.length : n.length - 1;
		for (let c = 0; c < o; c++) {
			const l = n[c], h = n[(c + 1) % n.length];
			if (!L(l) || !L(h)) continue;
			const u = $o(l, h, Number((a = l.bulge) != null ? a : 0));
			i.length > 0 && u.shift(), i.push(...u);
		}
		this.strokeWorldPolyline(e, i, s);
	}
	drawEllipse(e) {
		var a, c, l, h, u;
		const n = e.center, s = e.majorAxisEndPoint, i = Number((a = e.axisRatio) != null ? a : 1);
		if (!L(n) || !L(s)) return this.markSkipped("ELLIPSE");
		const o = gn(n, s, i, Number((c = e.startAngle) != null ? c : 0), Number((l = e.endAngle) != null ? l : Math.PI * 2)), r = Math.abs(Number((h = e.endAngle) != null ? h : Math.PI * 2) - Number((u = e.startAngle) != null ? u : 0)) >= Math.PI * 2 - 1e-6;
		this.strokeWorldPolyline(e, o, r);
	}
	drawPoint(e) {
		var i, o, r;
		const n = (r = (o = (i = e.point) != null ? i : e.location) != null ? o : e.center) != null ? r : e.insertionPoint;
		if (!L(n)) return this.markSkipped("POINT");
		const s = this.worldToScreen(n);
		this.beginStyledPath(e), this.ctx.moveTo(s.x - 3, s.y), this.ctx.lineTo(s.x + 3, s.y), this.ctx.moveTo(s.x, s.y - 3), this.ctx.lineTo(s.x, s.y + 3), this.finishStroke();
	}
	drawText(e) {
		var r, a, c, l, h, u, f, d, m;
		const s = (Number((r = e.halign) != null ? r : 0) !== 0 || Number((a = e.valign) != null ? a : 0) !== 0) && L(e.endPoint) ? e.endPoint : (l = (c = e.insertionPoint) != null ? c : e.startPoint) != null ? l : e.center, i = Xo(String((u = (h = e.text) != null ? h : e.value) != null ? u : "")), o = Number((d = (f = e.textHeight) != null ? f : e.height) != null ? d : 1);
		if (!L(s) || !i) return this.markSkipped(String(e.type));
		this.drawTextAt(e, s, i, o, Number((m = e.rotation) != null ? m : 0));
	}
	drawInsert(e, n) {
		var a, c;
		const s = this.lookupBlock((a = e.blockName) != null ? a : e.name);
		if (s && n < this.opts.maxInsertDepth) {
			const l = kn(e, (c = s.basePoint) != null ? c : {
				x: 0,
				y: 0
			});
			for (const h of s.entities) {
				const f = xr(hr(h, e, this.document, {
					foreground: this.opts.foreground,
					background: this.opts.background,
					trueColorByteOrder: this.opts.trueColorByteOrder,
					contrastMode: this.opts.contrastMode,
					minColorContrast: this.opts.minColorContrast
				}), e, this.document);
				this.drawEntityTracked(Ye(f, l), n + 1);
			}
			return;
		}
		const i = e.insertionPoint;
		if (!L(i)) return this.markSkipped("INSERT");
		const o = this.worldToScreen(i);
		this.beginStyledPath(e);
		const r = 5;
		if (this.ctx.rect(o.x - r, o.y - r, 10, 10), this.finishStroke(), Array.isArray(e.attribs)) for (const l of e.attribs) this.drawText(l);
	}
	drawSolid(e) {
		var i;
		const n = (i = e.vertices) != null ? i : e.points;
		if (!Array.isArray(n) || n.length < 3) return this.markSkipped(String(e.type));
		this.beginStyledPath(e, !0);
		const s = this.worldToScreen(n[0]);
		this.ctx.moveTo(s.x, s.y);
		for (const o of n.slice(1)) {
			if (!L(o)) continue;
			const r = this.worldToScreen(o);
			this.ctx.lineTo(r.x, r.y);
		}
		this.ctx.closePath(), this.finishFillStroke(!0);
	}
	drawHatch(e) {
		var s, i;
		const n = e.loops;
		if (!Array.isArray(n) || n.length === 0) return this.markSkipped("HATCH");
		this.beginStyledPath(e, !0);
		for (const o of n) if ((s = o.commands) != null && s.length) this.addPathCommands(o.commands);
		else if ((i = o.vertices) != null && i.length) {
			const r = this.worldToScreen(o.vertices[0]);
			this.ctx.moveTo(r.x, r.y);
			for (const a of o.vertices.slice(1)) {
				const c = this.worldToScreen(a);
				this.ctx.lineTo(c.x, c.y);
			}
			this.ctx.closePath();
		}
		this.finishFillStroke(!!cn(e, this.document, {
			foreground: this.opts.foreground,
			background: this.opts.background,
			trueColorByteOrder: this.opts.trueColorByteOrder,
			contrastMode: this.opts.contrastMode,
			minColorContrast: this.opts.minColorContrast
		}));
	}
	drawSpline(e) {
		var s;
		const n = (s = e.fitPoints) != null && s.length ? e.fitPoints : e.controlPoints;
		if (!n || n.length < 2) return this.markSkipped("SPLINE");
		this.strokeWorldPolyline(e, n, !!e.isClosed);
	}
	drawPath(e) {
		var n;
		if (!((n = e.commands) != null && n.length)) return this.markSkipped(String(e.type));
		this.beginStyledPath(e, !!e.fillColor), this.addPathCommands(e.commands), this.finishFillStroke(!!e.fillColor);
	}
	addPathCommands(e) {
		for (const n of e) if (n.cmd === "M") {
			const s = this.worldToScreen(n.points[0]);
			this.ctx.moveTo(s.x, s.y);
		} else if (n.cmd === "L") {
			const s = this.worldToScreen(n.points[0]);
			this.ctx.lineTo(s.x, s.y);
		} else if (n.cmd === "C") {
			const [s, i, o] = n.points.map((r) => this.worldToScreen(r));
			this.ctx.bezierCurveTo(s.x, s.y, i.x, i.y, o.x, o.y);
		} else if (n.cmd === "Q") {
			const [s, i] = n.points.map((o) => this.worldToScreen(o));
			this.ctx.quadraticCurveTo(s.x, s.y, i.x, i.y);
		} else n.cmd === "Z" && this.ctx.closePath();
	}
	drawImage(e) {
		var f, d;
		const n = e.insertionPoint;
		if (!L(n)) return this.markSkipped(String(e.type));
		const s = Number((f = e.width) != null ? f : 32), i = Number((d = e.height) != null ? d : 32), o = this.worldToScreen(n), r = this.worldToScreen({
			x: n.x + s,
			y: n.y - i
		}), a = Math.min(o.x, r.x), c = Math.min(o.y, r.y), l = Math.abs(r.x - o.x), h = Math.abs(r.y - o.y), u = e.imageDataUrl;
		if (u) {
			const m = this.getImage(u);
			if (m.complete && m.naturalWidth > 0) {
				this.ctx.save(), this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.ctx.drawImage(m, a, c, l, h), this.ctx.restore(), this.stats.drawn++;
				return;
			}
			m.onload = () => this.render();
		}
		if (!this.opts.showImagePlaceholders) return this.markSkipped(String(e.type));
		this.beginStyledPath(e), this.ctx.rect(a, c, l, h), this.ctx.moveTo(a, c), this.ctx.lineTo(a + l, c + h), this.ctx.moveTo(a + l, c), this.ctx.lineTo(a, c + h), this.finishStroke();
	}
	getImage(e) {
		let n = this.imageCache.get(e);
		return n || (n = new Image(), n.src = e, this.imageCache.set(e, n)), n;
	}
	drawUnsupportedMarker(e) {
		const n = this.entityAnchor(e);
		if (!n) return;
		const s = this.worldToScreen(n);
		this.beginStyledPath(e), this.ctx.moveTo(s.x - 4, s.y - 4), this.ctx.lineTo(s.x + 4, s.y + 4), this.ctx.moveTo(s.x + 4, s.y - 4), this.ctx.lineTo(s.x - 4, s.y + 4), this.finishStroke();
	}
	drawTextAt(e, n, s, i, o) {
		var d, m, p, g, b;
		const r = this.ctx, a = this.worldToScreen(n);
		r.save(), r.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), r.translate(a.x, a.y), r.rotate(-o);
		const c = Number((d = e.generationFlag) != null ? d : 0), l = Number((m = e.xScale) != null ? m : 1);
		r.scale((c & 2 ? -1 : 1) * (Number.isFinite(l) && Math.abs(l) > 1e-9 ? Math.abs(l) : 1), c & 4 ? -1 : 1);
		const h = Math.max(4, Math.min(256, Math.abs(i) * this.view.scale));
		r.font = `${h}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`, r.fillStyle = $e(e, this.document, {
			foreground: this.opts.foreground,
			background: this.opts.background,
			trueColorByteOrder: this.opts.trueColorByteOrder,
			contrastMode: this.opts.contrastMode,
			minColorContrast: this.opts.minColorContrast
		}), r.globalAlpha = Re(Number((p = e.opacity) != null ? p : 1), 0, 1);
		const u = Number((g = e.halign) != null ? g : 0), f = Number((b = e.valign) != null ? b : 0);
		r.textAlign = u === 1 || u === 4 ? "center" : u === 2 ? "right" : "left", r.textBaseline = f === 1 ? "bottom" : f === 2 ? "middle" : f === 3 ? "top" : "alphabetic";
		for (const [y, v] of s.split(/\r?\n/g).entries()) r.fillText(v, 0, y * h * 1.22);
		r.restore(), this.stats.drawn++;
	}
	strokeWorldPolyline(e, n, s) {
		var a;
		const i = n.filter(L);
		if (i.length < 2) return this.markSkipped(String(e.type));
		const o = fn(e, this.document);
		if (o) {
			const c = Pn(i, s, o), l = [...c.dots];
			this.beginStyledPath(e, !1, !1);
			for (const [h, u] of c.segments) {
				const f = this.worldToScreen(h), d = this.worldToScreen(u);
				this.ctx.moveTo(f.x, f.y), this.ctx.lineTo(d.x, d.y);
			}
			for (const h of (a = c.markers) != null ? a : []) {
				const u = this.resolveLineTypeGlyph(h);
				if (u) {
					Hl(l, h.fallbackPoint);
					for (const f of wr(h, u)) {
						if (f.length < 2) continue;
						const d = this.worldToScreen(f[0]);
						this.ctx.moveTo(d.x, d.y);
						for (const m of f.slice(1)) {
							const p = this.worldToScreen(m);
							this.ctx.lineTo(p.x, p.y);
						}
					}
				}
			}
			if (this.ctx.stroke(), l.length > 0) {
				this.ctx.setLineDash([]), this.ctx.beginPath();
				const h = Math.max(.5, this.ctx.lineWidth / 2);
				for (const u of l) {
					const f = this.worldToScreen(u);
					this.ctx.moveTo(f.x + h, f.y), this.ctx.arc(f.x, f.y, h, 0, Math.PI * 2);
				}
				this.ctx.fillStyle = this.ctx.strokeStyle, this.ctx.fill();
			}
			this.ctx.restore(), this.stats.drawn++;
			return;
		}
		this.beginStyledPath(e);
		const r = this.worldToScreen(i[0]);
		this.ctx.moveTo(r.x, r.y);
		for (const c of i.slice(1)) {
			const l = this.worldToScreen(c);
			this.ctx.lineTo(l.x, l.y);
		}
		s && this.ctx.closePath(), this.finishStroke();
	}
	resolveLineTypeGlyph(e) {
		var n;
		return e.kind === "shape" ? this.opts.shxGlyphResolver.resolveShape(Number(e.shapeNumber), e.fontName) : this.opts.shxGlyphResolver.resolveText(String((n = e.text) != null ? n : ""), e.fontName);
	}
	markSkipped(e) {
		var n;
		this.stats.skipped++, this.stats.unsupported[e] = (n = this.stats.unsupported[e]) != null ? n : 0;
	}
	entityAnchor(e) {
		for (const n of [
			"startPoint",
			"insertionPoint",
			"center",
			"point",
			"location"
		]) {
			const s = e[n];
			if (L(s)) return j(s);
		}
		if (Array.isArray(e.vertices) && L(e.vertices[0])) return j(e.vertices[0]);
		if (Array.isArray(e.commands) && e.commands.length) {
			const n = e.commands.find((s) => s.points.length > 0);
			if (n) return j(n.points[0]);
		}
	}
	lookupLayer(e) {
		var n, s;
		if (!(!this.document || !e)) return (s = (n = this.document.layers[e]) != null ? n : this.document.layers[e.toLowerCase()]) != null ? s : Object.values(this.document.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
	}
	lookupBlock(e) {
		var n, s;
		if (!(!this.document || !e)) return (s = (n = this.document.blocks[e]) != null ? n : this.document.blocks[e.toLowerCase()]) != null ? s : Object.values(this.document.blocks).find((i) => i.name.toLowerCase() === e.toLowerCase());
	}
	clampScale(e) {
		return Math.min(this.opts.maxScale, Math.max(this.opts.minScale, e));
	}
	boundsOptions() {
		return {
			maxInsertDepth: this.opts.maxInsertDepth,
			maxCurveSegments: this.opts.maxCurveSegments
		};
	}
	emitViewChange() {
		var e;
		(e = this.onViewChange) == null || e.call(this, {
			view: this.getViewState(),
			fitScale: this.fitScale,
			zoomRatio: this.getZoomRatio(),
			zoomPercent: this.getZoomPercent(),
			bounds: this.getBounds()
		});
	}
};
function Yl(t) {
	return {
		total: t.total,
		drawn: t.drawn,
		skipped: t.skipped,
		byType: { ...t.byType },
		unsupported: { ...t.unsupported },
		renderElapsedMs: t.renderElapsedMs,
		backend: t.backend,
		primitiveCount: t.primitiveCount,
		visiblePrimitiveCount: t.visiblePrimitiveCount,
		culledPrimitiveCount: t.culledPrimitiveCount,
		gpuMemoryBytes: t.gpuMemoryBytes,
		buildElapsedMs: t.buildElapsedMs
	};
}
function Hl(t, e) {
	const n = Math.max(1, Math.abs(e.x), Math.abs(e.y)), s = Math.max(1e-9, n * 1e-12), i = t.findIndex((o) => Math.hypot(o.x - e.x, o.y - e.y) <= s);
	i >= 0 && t.splice(i, 1);
}
var Vl = {
	background: "#0b1020",
	foreground: "#ffffff",
	showUnsupportedMarkers: !1,
	showImagePlaceholders: !0,
	showPageBounds: !0,
	minScale: 1e-9,
	maxScale: 1e9,
	wheelZoomFactor: 1.14,
	trueColorByteOrder: "rgb",
	maxInsertDepth: 16,
	fitMode: "auto",
	contrastMode: "adaptive",
	minColorContrast: 2.4,
	maxCurveSegments: 96,
	spatialIndexCellCount: 72,
	maxVerticesPerBatch: 65536,
	textMinPixelHeight: 4,
	maxVisibleTextLabels: 2500,
	powerPreference: "high-performance",
	antialias: !0,
	preserveDrawingBuffer: !1,
	enableSpatialIndex: !0,
	shxGlyphResolver: ar
};
var xo = class {
	constructor(e, n = {}) {
		S(this, "canvas");
		S(this, "backend", "webgl");
		S(this, "gl");
		S(this, "program");
		S(this, "eventController", new AbortController());
		S(this, "imageCache", /* @__PURE__ */ new Map());
		S(this, "opts");
		S(this, "sourceDocument");
		S(this, "document");
		S(this, "bounds", fe());
		S(this, "view", {
			centerX: 0,
			centerY: 0,
			scale: 1
		});
		S(this, "fitScale", 1);
		S(this, "dpr", 1);
		S(this, "isDragging", !1);
		S(this, "lastPointer");
		S(this, "resizeObserver");
		S(this, "overlayCanvas");
		S(this, "overlayCtx");
		S(this, "scene");
		S(this, "stats", {
			total: 0,
			drawn: 0,
			skipped: 0,
			byType: {},
			unsupported: {},
			renderElapsedMs: 0,
			backend: "webgl",
			primitiveCount: 0,
			visiblePrimitiveCount: 0,
			culledPrimitiveCount: 0,
			gpuMemoryBytes: 0,
			buildElapsedMs: 0
		});
		S(this, "rafHandle", 0);
		S(this, "onStats");
		S(this, "onViewChange");
		const s = jl(e, n);
		if (!s) throw new Error("WebGL is not available. Use renderer: \"canvas2d\" to force the Canvas2D fallback.");
		this.canvas = e, this.gl = s, this.program = Gl(s), this.opts = {
			...Vl,
			...n
		}, this.canvas.classList.add("cad-viewer-canvas", "cad-viewer-webgl-canvas"), this.createOverlayCanvas(), this.bindEvents(), typeof ResizeObserver != "undefined" && (this.resizeObserver = new ResizeObserver(() => this.resize()), this.resizeObserver.observe(e)), this.resize();
	}
	captureCanvas() {
		return this.render(), yn([this.canvas, ...this.overlayCanvas ? [this.overlayCanvas] : []]);
	}
	static isSupported() {
		return Sr();
	}
	destroy() {
		var e, n;
		this.eventController.abort(), (e = this.resizeObserver) == null || e.disconnect(), this.cancelScheduledRender(), this.disposeScene(), (n = this.overlayCanvas) == null || n.remove();
	}
	clear() {
		this.sourceDocument = void 0, this.document = void 0, this.bounds = fe(), this.view = {
			centerX: 0,
			centerY: 0,
			scale: 1
		}, this.fitScale = 1, this.disposeScene(), this.render(), this.emitViewChange();
	}
	setDocument(e) {
		this.sourceDocument = e, this.document = Cr(e), this.bounds = dr(this.document, this.boundsOptions()), this.disposeScene();
		const n = So(this.document, this.opts, this.bounds);
		this.scene = wo(this.gl, n), this.stats = Po(this.scene, 0), this.fitToView();
	}
	refreshReferences() {
		if (!this.document) return;
		const e = { ...this.view }, n = this.fitScale;
		this.disposeScene();
		const s = So(this.document, this.opts, this.bounds);
		this.scene = wo(this.gl, s), this.stats = Po(this.scene, 0), this.view = e, this.fitScale = n, this.render(), this.emitViewChange();
	}
	getDocument() {
		return this.document;
	}
	getSourceDocument() {
		return this.sourceDocument;
	}
	setOptions(e) {
		var i, o;
		const n = eh(this.opts, e), s = e.fitMode !== void 0 && e.fitMode !== this.opts.fitMode;
		if (this.opts = {
			...this.opts,
			...e
		}, n && ((i = this.sourceDocument) != null ? i : this.document)) {
			this.setDocument((o = this.sourceDocument) != null ? o : this.document);
			return;
		}
		if (s && this.document) {
			this.fitToView();
			return;
		}
		this.render(), this.emitViewChange();
	}
	getOptions() {
		return { ...this.opts };
	}
	fitToView(e = .92, n = this.opts.fitMode) {
		const s = this.document ? mr(this.document, this.bounds, n, this.boundsOptions()) : this.bounds;
		if (!ae(s)) {
			this.view = {
				centerX: 0,
				centerY: 0,
				scale: 1
			}, this.fitScale = 1, this.render(), this.emitViewChange();
			return;
		}
		const i = Math.max(1, this.cssWidth), o = Math.max(1, this.cssHeight), r = Math.max(s.maxX - s.minX, 1e-9), a = Math.max(s.maxY - s.minY, 1e-9), c = this.clampScale(Math.min(i / r, o / a) * e);
		this.fitScale = c, this.view = {
			centerX: (s.minX + s.maxX) / 2,
			centerY: (s.minY + s.maxY) / 2,
			scale: c
		}, this.render(), this.emitViewChange();
	}
	resize() {
		this.dpr = Math.max(1, window.devicePixelRatio || 1);
		const e = Math.max(1, Math.floor(this.cssWidth * this.dpr)), n = Math.max(1, Math.floor(this.cssHeight * this.dpr));
		(this.canvas.width !== e || this.canvas.height !== n) && (this.canvas.width = e, this.canvas.height = n), this.resizeOverlay(e, n), this.render(), this.emitViewChange();
	}
	zoom(e, n) {
		if (!Number.isFinite(e) || e <= 0) return;
		const s = n != null ? n : {
			x: this.cssWidth / 2,
			y: this.cssHeight / 2
		}, i = this.screenToWorld(s);
		this.view.scale = this.clampScale(this.view.scale * e);
		const o = this.screenToWorld(s);
		this.view.centerX += i.x - o.x, this.view.centerY += i.y - o.y, this.scheduleRender(), this.emitViewChange();
	}
	zoomIn() {
		this.zoom(this.opts.wheelZoomFactor);
	}
	zoomOut() {
		this.zoom(1 / this.opts.wheelZoomFactor);
	}
	panByScreenDelta(e, n) {
		!Number.isFinite(e) || !Number.isFinite(n) || (this.view.centerX -= e / this.view.scale, this.view.centerY += n / this.view.scale, this.scheduleRender(), this.emitViewChange());
	}
	setViewState(e) {
		if (![
			e.centerX,
			e.centerY,
			e.scale
		].every(Number.isFinite)) throw new Error("Invalid view state.");
		this.view = {
			...e,
			scale: this.clampScale(e.scale)
		}, this.render(), this.emitViewChange();
	}
	getViewState() {
		return { ...this.view };
	}
	getBounds() {
		return { ...this.bounds };
	}
	getStats() {
		return th(this.stats);
	}
	getZoomRatio() {
		return Math.abs(this.fitScale) < 1e-12 ? 1 : this.view.scale / this.fitScale;
	}
	getZoomPercent() {
		return this.getZoomRatio() * 100;
	}
	worldToScreen(e) {
		return {
			x: this.cssWidth / 2 + (e.x - this.view.centerX) * this.view.scale,
			y: this.cssHeight / 2 - (e.y - this.view.centerY) * this.view.scale
		};
	}
	screenToWorld(e) {
		return {
			x: this.view.centerX + (e.x - this.cssWidth / 2) / this.view.scale,
			y: this.view.centerY - (e.y - this.cssHeight / 2) / this.view.scale
		};
	}
	render() {
		return this.cancelScheduledRender(), this.renderNow();
	}
	renderNow() {
		var l;
		const e = performance.now(), n = this.gl;
		n.viewport(0, 0, this.canvas.width, this.canvas.height);
		const s = dn(this.opts.background, [
			11,
			16,
			32,
			255
		]);
		n.clearColor(s[0] / 255, s[1] / 255, s[2] / 255, s[3] / 255), n.clear(n.COLOR_BUFFER_BIT), n.disable(n.DEPTH_TEST), n.enable(n.BLEND), n.blendFunc(n.SRC_ALPHA, n.ONE_MINUS_SRC_ALPHA);
		let i = 0, o = 0;
		const r = this.scene, a = this.visibleWorldBounds();
		if (r) {
			n.useProgram(this.program.program), n.uniform2f(this.program.uViewCenter, this.view.centerX - r.origin.x, this.view.centerY - r.origin.y), n.uniform1f(this.program.uScale, this.view.scale * this.dpr), n.uniform2f(this.program.uViewport, this.canvas.width, this.canvas.height), n.uniform1f(this.program.uPointSize, Math.max(1, this.dpr));
			const h = this.drawBatches(r.lineBatches, n.LINES, a);
			i += h.visible, o += h.culled;
			const u = this.drawBatches(r.triangleBatches, n.TRIANGLES, a);
			i += u.visible, o += u.culled;
			const f = this.drawBatches(r.lineTypePointBatches, n.POINTS, a);
			i += f.visible, o += f.culled, n.uniform1f(this.program.uPointSize, Math.max(2, Math.min(12, 4 * this.dpr)));
			const d = this.drawBatches(r.pointBatches, n.POINTS, a);
			i += d.visible, o += d.culled;
		}
		this.renderOverlay(a);
		const c = performance.now() - e;
		return this.stats = r ? {
			...r.stats,
			renderElapsedMs: c,
			backend: "webgl",
			primitiveCount: r.primitiveCount,
			visiblePrimitiveCount: i,
			culledPrimitiveCount: o,
			gpuMemoryBytes: r.gpuMemoryBytes,
			buildElapsedMs: r.buildElapsedMs
		} : {
			total: 0,
			drawn: 0,
			skipped: 0,
			byType: {},
			unsupported: {},
			renderElapsedMs: c,
			backend: "webgl",
			primitiveCount: 0,
			visiblePrimitiveCount: 0,
			culledPrimitiveCount: 0,
			gpuMemoryBytes: 0,
			buildElapsedMs: 0
		}, (l = this.onStats) == null || l.call(this, this.getStats()), this.getStats();
	}
	drawBatches(e, n, s) {
		const i = this.gl;
		let o = 0, r = 0;
		for (const a of e) {
			if (!Gt(a.bounds, s)) {
				r += a.primitiveCount;
				continue;
			}
			i.bindBuffer(i.ARRAY_BUFFER, a.positionBuffer), i.enableVertexAttribArray(this.program.aPosition), i.vertexAttribPointer(this.program.aPosition, 2, i.FLOAT, !1, 0, 0), i.bindBuffer(i.ARRAY_BUFFER, a.colorBuffer), i.enableVertexAttribArray(this.program.aColor), i.vertexAttribPointer(this.program.aColor, 4, i.UNSIGNED_BYTE, !0, 0, 0), i.drawArrays(n, 0, a.vertexCount), o += a.primitiveCount;
		}
		return {
			visible: o,
			culled: r
		};
	}
	scheduleRender() {
		this.rafHandle || (this.rafHandle = window.requestAnimationFrame(() => {
			this.rafHandle = 0, this.renderNow();
		}));
	}
	cancelScheduledRender() {
		this.rafHandle && (window.cancelAnimationFrame(this.rafHandle), this.rafHandle = 0);
	}
	renderOverlay(e) {
		var i, o;
		const n = this.overlayCtx, s = this.overlayCanvas;
		!n || !s || (n.save(), n.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), n.clearRect(0, 0, this.cssWidth, this.cssHeight), this.opts.showPageBounds && (o = (i = this.document) == null ? void 0 : i.pages) != null && o.length && this.drawPageBoundsOverlay(n), this.scene && (this.drawImagesOverlay(n, this.scene.imageItems, e), this.drawTextOverlay(n, this.scene.textItems, e)), n.restore());
	}
	drawPageBoundsOverlay(e) {
		var n, s;
		if ((s = (n = this.document) == null ? void 0 : n.pages) != null && s.length) {
			e.save(), e.strokeStyle = "rgba(148, 163, 184, 0.34)", e.lineWidth = 1, e.setLineDash([8, 6]);
			for (const i of this.document.pages) {
				const o = this.worldToScreen({
					x: 0,
					y: 0
				}), r = this.worldToScreen({
					x: i.width,
					y: i.height
				});
				e.strokeRect(Math.min(o.x, r.x), Math.min(o.y, r.y), Math.abs(r.x - o.x), Math.abs(r.y - o.y));
			}
			e.restore();
		}
	}
	drawTextOverlay(e, n, s) {
		const i = this.opts.maxVisibleTextLabels;
		let o = 0;
		for (const r of n) {
			if (o >= i) break;
			if (!Gt(r.bounds, s)) continue;
			const a = Math.abs(r.height) * this.view.scale;
			if (a < this.opts.textMinPixelHeight) continue;
			const c = this.worldToScreen(r.point);
			if (c.x < -512 || c.y < -512 || c.x > this.cssWidth + 512 || c.y > this.cssHeight + 512) continue;
			e.save(), e.translate(c.x, c.y), e.rotate(-r.rotation), e.scale((r.generationFlag & 2 ? -1 : 1) * r.xScale, r.generationFlag & 4 ? -1 : 1);
			const l = Math.max(4, Math.min(256, a));
			e.font = `${l}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`, e.fillStyle = r.color, e.globalAlpha = r.opacity, e.textAlign = r.halign === 1 || r.halign === 4 ? "center" : r.halign === 2 ? "right" : "left", e.textBaseline = r.valign === 1 ? "bottom" : r.valign === 2 ? "middle" : r.valign === 3 ? "top" : "alphabetic";
			for (const [h, u] of r.text.split(/\r?\n/g).entries()) e.fillText(u, 0, h * l * 1.22);
			e.restore(), o++;
		}
	}
	drawImagesOverlay(e, n, s) {
		for (const i of n) {
			if (!Gt(i.bounds, s)) continue;
			const o = this.worldToScreen(i.point), r = this.worldToScreen({
				x: i.point.x + i.width,
				y: i.point.y - i.height
			}), a = Math.min(o.x, r.x), c = Math.min(o.y, r.y), l = Math.abs(r.x - o.x), h = Math.abs(r.y - o.y);
			if (!(l < 1 || h < 1)) {
				if (i.source) {
					const u = this.getImage(i.source);
					if (u.complete && u.naturalWidth > 0) {
						e.save(), e.globalAlpha = i.opacity, e.drawImage(u, a, c, l, h), e.restore();
						continue;
					}
					u.onload = () => this.scheduleRender();
				}
				this.opts.showImagePlaceholders && (e.save(), e.strokeStyle = i.color, e.globalAlpha = i.opacity, e.lineWidth = 1, e.strokeRect(a, c, l, h), e.beginPath(), e.moveTo(a, c), e.lineTo(a + l, c + h), e.moveTo(a + l, c), e.lineTo(a, c + h), e.stroke(), e.restore());
			}
		}
	}
	getImage(e) {
		let n = this.imageCache.get(e);
		return n || (n = new Image(), n.src = e, this.imageCache.set(e, n)), n;
	}
	createOverlayCanvas() {
		const e = this.canvas.parentElement;
		if (!e || typeof document == "undefined") return;
		window.getComputedStyle(e).position === "static" && (e.style.position = "relative");
		const s = document.createElement("canvas");
		s.className = "cad-viewer-text-overlay", s.setAttribute("aria-hidden", "true"), s.style.position = "absolute", s.style.inset = "0", s.style.width = "100%", s.style.height = "100%", s.style.pointerEvents = "none", s.style.zIndex = "1";
		const i = s.getContext("2d");
		i && (e.appendChild(s), this.overlayCanvas = s, this.overlayCtx = i);
	}
	resizeOverlay(e, n) {
		this.overlayCanvas && (this.overlayCanvas.width !== e || this.overlayCanvas.height !== n) && (this.overlayCanvas.width = e, this.overlayCanvas.height = n);
	}
	bindEvents() {
		const e = this.eventController.signal;
		this.canvas.addEventListener("wheel", (s) => {
			s.preventDefault();
			const i = s.deltaY < 0 ? this.opts.wheelZoomFactor : 1 / this.opts.wheelZoomFactor;
			this.zoom(i, {
				x: s.offsetX,
				y: s.offsetY
			});
		}, {
			passive: !1,
			signal: e
		}), this.canvas.addEventListener("pointerdown", (s) => {
			this.canvas.setPointerCapture(s.pointerId), this.isDragging = !0, this.lastPointer = {
				x: s.clientX,
				y: s.clientY
			}, this.canvas.classList.add("is-dragging");
		}, { signal: e }), this.canvas.addEventListener("pointermove", (s) => {
			!this.isDragging || !this.lastPointer || (this.panByScreenDelta(s.clientX - this.lastPointer.x, s.clientY - this.lastPointer.y), this.lastPointer = {
				x: s.clientX,
				y: s.clientY
			});
		}, { signal: e });
		const n = (s) => {
			s && this.canvas.hasPointerCapture(s.pointerId) && this.canvas.releasePointerCapture(s.pointerId), this.isDragging = !1, this.lastPointer = void 0, this.canvas.classList.remove("is-dragging");
		};
		this.canvas.addEventListener("pointerup", n, { signal: e }), this.canvas.addEventListener("pointercancel", () => n(), { signal: e }), this.canvas.addEventListener("webglcontextlost", (s) => {
			s.preventDefault(), this.cancelScheduledRender();
		}, { signal: e });
	}
	visibleWorldBounds() {
		const e = this.cssWidth / Math.max(this.view.scale, 1e-12) / 2, n = this.cssHeight / Math.max(this.view.scale, 1e-12) / 2;
		return {
			minX: this.view.centerX - e,
			maxX: this.view.centerX + e,
			minY: this.view.centerY - n,
			maxY: this.view.centerY + n
		};
	}
	get cssWidth() {
		return this.canvas.clientWidth || 1;
	}
	get cssHeight() {
		return this.canvas.clientHeight || 1;
	}
	clampScale(e) {
		return Math.min(this.opts.maxScale, Math.max(this.opts.minScale, e));
	}
	boundsOptions() {
		return {
			maxInsertDepth: this.opts.maxInsertDepth,
			maxCurveSegments: this.opts.maxCurveSegments
		};
	}
	disposeScene() {
		if (!this.scene) return;
		const e = this.gl;
		for (const n of [
			...this.scene.lineBatches,
			...this.scene.triangleBatches,
			...this.scene.lineTypePointBatches,
			...this.scene.pointBatches
		]) e.deleteBuffer(n.positionBuffer), e.deleteBuffer(n.colorBuffer);
		this.scene = void 0;
	}
	emitViewChange() {
		var e;
		(e = this.onViewChange) == null || e.call(this, {
			view: this.getViewState(),
			fitScale: this.fitScale,
			zoomRatio: this.getZoomRatio(),
			zoomPercent: this.getZoomPercent(),
			bounds: this.getBounds()
		});
	}
};
function Sr() {
	var e, n;
	if (typeof document == "undefined") return !1;
	const t = document.createElement("canvas");
	return !!((n = (e = t.getContext("webgl2")) != null ? e : t.getContext("webgl")) != null ? n : t.getContext("experimental-webgl"));
}
function jl(t, e) {
	var s, i, o, r, a, c;
	const n = {
		alpha: !1,
		antialias: (s = e.antialias) != null ? s : !0,
		depth: !1,
		stencil: !1,
		preserveDrawingBuffer: (i = e.preserveDrawingBuffer) != null ? i : !1,
		powerPreference: (o = e.powerPreference) != null ? o : "high-performance"
	};
	return (c = (a = (r = t.getContext("webgl2", n)) != null ? r : t.getContext("webgl", n)) != null ? a : t.getContext("experimental-webgl", n)) != null ? c : void 0;
}
function Gl(t) {
	var h;
	const e = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_viewCenter;
    uniform float u_scale;
    uniform vec2 u_viewport;
    uniform float u_pointSize;
    varying vec4 v_color;
    void main() {
      vec2 screen = vec2(
        u_viewport.x * 0.5 + (a_position.x - u_viewCenter.x) * u_scale,
        u_viewport.y * 0.5 - (a_position.y - u_viewCenter.y) * u_scale
      );
      vec2 clip = vec2(screen.x / u_viewport.x * 2.0 - 1.0, 1.0 - screen.y / u_viewport.y * 2.0);
      gl_Position = vec4(clip, 0.0, 1.0);
      gl_PointSize = u_pointSize;
      v_color = a_color;
    }
  `, n = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
  `, s = vo(t, t.VERTEX_SHADER, e), i = vo(t, t.FRAGMENT_SHADER, n), o = t.createProgram();
	if (!o) throw new Error("Failed to create WebGL program.");
	if (t.attachShader(o, s), t.attachShader(o, i), t.linkProgram(o), !t.getProgramParameter(o, t.LINK_STATUS)) {
		const u = (h = t.getProgramInfoLog(o)) != null ? h : "Unknown WebGL program link error.";
		throw t.deleteProgram(o), new Error(u);
	}
	t.deleteShader(s), t.deleteShader(i);
	const r = t.getUniformLocation(o, "u_viewCenter"), a = t.getUniformLocation(o, "u_scale"), c = t.getUniformLocation(o, "u_viewport"), l = t.getUniformLocation(o, "u_pointSize");
	if (!r || !a || !c || !l) throw new Error("Failed to resolve WebGL shader uniforms.");
	return {
		program: o,
		aPosition: t.getAttribLocation(o, "a_position"),
		aColor: t.getAttribLocation(o, "a_color"),
		uViewCenter: r,
		uScale: a,
		uViewport: c,
		uPointSize: l
	};
}
function vo(t, e, n) {
	var i;
	const s = t.createShader(e);
	if (!s) throw new Error("Failed to create WebGL shader.");
	if (t.shaderSource(s, n), t.compileShader(s), !t.getShaderParameter(s, t.COMPILE_STATUS)) {
		const o = (i = t.getShaderInfoLog(s)) != null ? i : "Unknown WebGL shader compile error.";
		throw t.deleteShader(s), new Error(o);
	}
	return s;
}
function wo(t, e) {
	let n = 0;
	const s = (c) => c.map((l) => {
		const h = Co(t, l.positions), u = Co(t, l.colors), f = l.positions.byteLength + l.colors.byteLength;
		return n += f, {
			positionBuffer: h,
			colorBuffer: u,
			vertexCount: l.positions.length / 2,
			primitiveCount: l.primitiveCount,
			bounds: l.bounds,
			gpuBytes: f
		};
	}), i = s(e.lineBatches), o = s(e.triangleBatches), r = s(e.lineTypePointBatches), a = s(e.pointBatches);
	return {
		origin: e.origin,
		lineBatches: i,
		triangleBatches: o,
		lineTypePointBatches: r,
		pointBatches: a,
		textItems: e.textItems,
		imageItems: e.imageItems,
		stats: e.stats,
		primitiveCount: e.primitiveCount,
		gpuMemoryBytes: n,
		buildElapsedMs: e.buildElapsedMs
	};
}
function Co(t, e) {
	const n = t.createBuffer();
	if (!n) throw new Error("Failed to create WebGL buffer.");
	return t.bindBuffer(t.ARRAY_BUFFER, n), t.bufferData(t.ARRAY_BUFFER, e, t.STATIC_DRAW), n;
}
function So(t, e, n) {
	const s = performance.now(), o = new ql(t, e, n, ae(n) ? {
		x: (n.minX + n.maxX) / 2,
		y: (n.minY + n.maxY) / 2
	} : {
		x: 0,
		y: 0
	});
	for (const a of t.entities) o.addEntityTracked(a, 0);
	const r = o.finalize();
	return r.buildElapsedMs = performance.now() - s, r;
}
var ql = class {
	constructor(e, n, s, i) {
		S(this, "document");
		S(this, "opts");
		S(this, "bounds");
		S(this, "origin");
		S(this, "lineBuckets", /* @__PURE__ */ new Map());
		S(this, "triangleBuckets", /* @__PURE__ */ new Map());
		S(this, "lineTypePointBuckets", /* @__PURE__ */ new Map());
		S(this, "pointBuckets", /* @__PURE__ */ new Map());
		S(this, "textItems", []);
		S(this, "imageItems", []);
		S(this, "stats", {
			total: 0,
			drawn: 0,
			skipped: 0,
			byType: {},
			unsupported: {},
			backend: "webgl",
			primitiveCount: 0,
			visiblePrimitiveCount: 0,
			culledPrimitiveCount: 0,
			gpuMemoryBytes: 0,
			buildElapsedMs: 0
		});
		S(this, "tileSize");
		S(this, "maxVerticesPerBatch");
		S(this, "primitiveCount", 0);
		this.document = e, this.opts = n, this.bounds = s, this.origin = i;
		const o = ae(s) ? Math.max(s.maxX - s.minX, s.maxY - s.minY, 1e-9) : 1;
		this.tileSize = n.enableSpatialIndex ? o / Math.max(8, n.spatialIndexCellCount) : Number.POSITIVE_INFINITY, this.maxVerticesPerBatch = Math.max(4096, Math.floor(n.maxVerticesPerBatch));
	}
	addEntityTracked(e, n) {
		var o, r;
		this.stats.total++;
		const s = String((o = e.type) != null ? o : "UNKNOWN").toUpperCase();
		this.stats.byType[s] = ((r = this.stats.byType[s]) != null ? r : 0) + 1;
		const i = this.lookupLayer(e.layer);
		if (e.isVisible === !1 || !lr(i)) {
			this.stats.skipped++;
			return;
		}
		this.addEntity(e, s, n);
	}
	finalize() {
		const e = Nt(this.lineBuckets, this.maxVerticesPerBatch), n = Nt(this.triangleBuckets, this.maxVerticesPerBatch), s = Nt(this.lineTypePointBuckets, this.maxVerticesPerBatch), i = Nt(this.pointBuckets, this.maxVerticesPerBatch);
		return this.stats.primitiveCount = this.primitiveCount, {
			origin: this.origin,
			lineBatches: e,
			triangleBatches: n,
			lineTypePointBatches: s,
			pointBatches: i,
			textItems: this.textItems,
			imageItems: this.imageItems,
			stats: this.stats,
			primitiveCount: this.primitiveCount,
			buildElapsedMs: 0
		};
	}
	addEntity(e, n, s) {
		var o, r;
		switch ((o = e.kind) != null ? o : ot(n)) {
			case "line": return this.addLineEntity(e);
			case "circle": return this.addCircleEntity(e);
			case "arc": return this.addArcEntity(e);
			case "polyline": return this.addPolylineEntity(e);
			case "ellipse": return this.addEllipseEntity(e);
			case "text": return this.addTextEntity(e);
			case "point": return this.addPointEntity(e);
			case "insert": return this.addInsertEntity(e, s);
			case "solid": return this.addSolidEntity(e);
			case "hatch": return this.addHatchEntity(e);
			case "spline": return this.addSplineEntity(e);
			case "path": return this.addPathEntity(e);
			case "image": return this.addImageEntity(e);
			case "viewport": return this.markSkipped(n);
			default: this.stats.unsupported[n] = ((r = this.stats.unsupported[n]) != null ? r : 0) + 1, this.stats.skipped++, this.opts.showUnsupportedMarkers && this.addUnsupportedMarker(e);
		}
	}
	addLineEntity(e) {
		if (!L(e.startPoint) || !L(e.endPoint)) return this.markSkipped("LINE");
		this.addPolyline([e.startPoint, e.endPoint], !1, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addCircleEntity(e) {
		const n = e.center, s = Number(e.radius);
		if (!L(n) || !Number.isFinite(s)) return this.markSkipped("CIRCLE");
		const i = Math.max(16, Math.min(this.opts.maxCurveSegments, Math.ceil(Math.sqrt(Math.abs(s)) * 12))), o = at(n, s, 0, Math.PI * 2, !0, i);
		this.addPolyline(o, !0, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addArcEntity(e) {
		const n = e.center, s = Number(e.radius), i = Number(e.startAngle), o = Number(e.endAngle);
		if (!L(n) || !Number.isFinite(s) || !Number.isFinite(i) || !Number.isFinite(o)) return this.markSkipped("ARC");
		this.addPolyline(at(n, s, i, o, !0, this.opts.maxCurveSegments), !1, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addPolylineEntity(e) {
		var r, a;
		const n = (r = e.vertices) != null ? r : e.points;
		if (!Array.isArray(n) || n.length < 2) return this.markSkipped(String(e.type));
		const s = Lo(e), i = [], o = s ? n.length : n.length - 1;
		for (let c = 0; c < o; c++) {
			const l = n[c], h = n[(c + 1) % n.length];
			if (!L(l) || !L(h)) continue;
			const u = $o(l, h, Number((a = l.bulge) != null ? a : 0), Math.max(4, Math.min(24, this.opts.maxCurveSegments / 4)));
			i.length > 0 && u.shift(), i.push(...u);
		}
		if (i.length < 2) return this.markSkipped(String(e.type));
		this.addPolyline(i, s, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addEllipseEntity(e) {
		var i, o, r, a, c;
		if (!L(e.center) || !L(e.majorAxisEndPoint)) return this.markSkipped("ELLIPSE");
		const n = gn(e.center, e.majorAxisEndPoint, Number((i = e.axisRatio) != null ? i : 1), Number((o = e.startAngle) != null ? o : 0), Number((r = e.endAngle) != null ? r : Math.PI * 2), this.opts.maxCurveSegments), s = Math.abs(Number((a = e.endAngle) != null ? a : Math.PI * 2) - Number((c = e.startAngle) != null ? c : 0)) >= Math.PI * 2 - 1e-6;
		this.addPolyline(n, s, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addTextEntity(e) {
		var d, m, p, g, b, y, v, x, w, C, N, B;
		const n = Number((d = e.halign) != null ? d : 0), s = Number((m = e.valign) != null ? m : 0), o = (n !== 0 || s !== 0) && L(e.endPoint) ? e.endPoint : (g = (p = e.insertionPoint) != null ? p : e.startPoint) != null ? g : e.center, r = Xo(String((y = (b = e.text) != null ? b : e.value) != null ? y : "")), a = Number((x = (v = e.textHeight) != null ? v : e.height) != null ? x : 1);
		if (!L(o) || !r || !Number.isFinite(a)) return this.markSkipped(String(e.type));
		const c = j(o), l = Number((w = e.xScale) != null ? w : 1), h = Number.isFinite(l) && Math.abs(l) > 1e-9 ? Math.abs(l) : 1, u = Math.max(1, r.split(/\r?\n/g).reduce((D, I) => Math.max(D, I.length), 0)) * Math.abs(a) * .62 * h, f = Math.max(1, r.split(/\r?\n/g).length) * Math.abs(a) * 1.22;
		this.textItems.push({
			point: c,
			text: r,
			height: a,
			rotation: Number((C = e.rotation) != null ? C : 0),
			xScale: h,
			generationFlag: Number((N = e.generationFlag) != null ? N : 0),
			halign: n,
			valign: s,
			color: $e(e, this.document, this.colorOptions()),
			opacity: Re(Number((B = e.opacity) != null ? B : 1), 0, 1),
			bounds: {
				minX: c.x - u,
				minY: c.y - f,
				maxX: c.x + u,
				maxY: c.y + f
			}
		}), this.stats.drawn++;
	}
	addPointEntity(e) {
		var s, i, o;
		const n = (o = (i = (s = e.point) != null ? s : e.location) != null ? i : e.center) != null ? o : e.insertionPoint;
		if (!L(n)) return this.markSkipped("POINT");
		this.addPoint(n, this.strokeBytes(e)), this.stats.drawn++;
	}
	addInsertEntity(e, n) {
		var o, r;
		const s = this.lookupBlock((o = e.blockName) != null ? o : e.name);
		if (s && n < this.opts.maxInsertDepth) {
			const a = kn(e, (r = s.basePoint) != null ? r : {
				x: 0,
				y: 0
			});
			for (const c of s.entities) {
				const h = xr(hr(c, e, this.document, this.colorOptions()), e, this.document);
				this.addEntityTracked(Ye(h, a), n + 1);
			}
			return;
		}
		const i = e.insertionPoint;
		if (!L(i)) return this.markSkipped("INSERT");
		if (this.addPoint(i, this.strokeBytes(e)), Array.isArray(e.attribs)) for (const a of e.attribs) this.addTextEntity(a);
		this.stats.drawn++;
	}
	addSolidEntity(e) {
		var o, r;
		const n = (o = e.vertices) != null ? o : e.points;
		if (!Array.isArray(n) || n.length < 3) return this.markSkipped(String(e.type));
		const s = n.filter(L).map(j);
		if (s.length < 3) return this.markSkipped(String(e.type));
		const i = (r = this.fillBytes(e)) != null ? r : this.strokeBytes(e);
		this.addTriangleFan(s, i), this.addPolyline(s, !0, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addHatchEntity(e) {
		var r, a;
		const n = e.loops;
		if (!Array.isArray(n) || n.length === 0) return this.markSkipped("HATCH");
		const s = this.strokeBytes(e), i = this.fillBytes(e);
		let o = !1;
		for (const c of n) {
			const l = (r = c.commands) != null && r.length ? ko(c.commands, this.opts.maxCurveSegments) : ((a = c.vertices) != null ? a : []).filter(L).map(j);
			l.length < 2 || (this.addPolyline(l, !0, s, e), i && l.length >= 3 && this.addTriangleFan(l, i), o = !0);
		}
		if (!o) return this.markSkipped("HATCH");
		this.stats.drawn++;
	}
	addSplineEntity(e) {
		var s;
		const n = (s = e.fitPoints) != null && s.length ? e.fitPoints : e.controlPoints;
		if (!n || n.length < 2) return this.markSkipped("SPLINE");
		this.addPolyline(n.filter(L).map(j), !!e.isClosed, this.strokeBytes(e), e), this.stats.drawn++;
	}
	addPathEntity(e) {
		var i;
		if (!((i = e.commands) != null && i.length)) return this.markSkipped(String(e.type));
		const n = ko(e.commands, this.opts.maxCurveSegments);
		if (n.length < 2) return this.markSkipped(String(e.type));
		this.addPolyline(n, !1, this.strokeBytes(e), e);
		const s = this.fillBytes(e);
		s && n.length >= 3 && this.addTriangleFan(n, s), this.stats.drawn++;
	}
	addImageEntity(e) {
		var a, c, l, h;
		const n = e.insertionPoint;
		if (!L(n)) return this.markSkipped(String(e.type));
		const s = Number((a = e.width) != null ? a : 32), i = Number((c = e.height) != null ? c : 32);
		if (!Number.isFinite(s) || !Number.isFinite(i)) return this.markSkipped(String(e.type));
		const o = j(n), r = jt([o, {
			x: o.x + s,
			y: o.y - i
		}]);
		this.imageItems.push({
			point: o,
			width: s,
			height: i,
			source: (l = e.imageDataUrl) != null ? l : e.imageSource,
			color: $e(e, this.document, this.colorOptions()),
			opacity: Re(Number((h = e.opacity) != null ? h : 1), 0, 1),
			bounds: r
		}), this.stats.drawn++;
	}
	addUnsupportedMarker(e) {
		const n = Jl(e);
		n && this.addPoint(n, this.strokeBytes(e));
	}
	addPolyline(e, n, s, i) {
		var c;
		const o = e.filter(L).map(j);
		if (o.length < 2 || (n && kr(o[0], o[o.length - 1]) && o.pop(), o.length < 2)) return;
		const r = i ? Io(i) : 0, a = i ? fn(i, this.document) : void 0;
		if (a) {
			const l = Pn(o, n, a), h = [...l.dots];
			for (const [u, f] of l.segments) this.addSegment(u, f, s), r > 1e-9 && this.addWideSegment(u, f, r, s, !0);
			for (const u of (c = l.markers) != null ? c : []) {
				const f = this.resolveLineTypeGlyph(u);
				if (!f) continue;
				Ql(h, u.fallbackPoint);
				let d = !1;
				for (const m of wr(u, f)) for (let p = 0; p < m.length - 1; p++) this.addSegment(m[p], m[p + 1], s), d = !0;
				d || h.push(u.point);
			}
			for (const u of h) this.addLineTypePoint(u, s);
			return;
		}
		for (let l = 0; l < o.length - 1; l++) this.addSegment(o[l], o[l + 1], s);
		n && this.addSegment(o[o.length - 1], o[0], s), r > 1e-9 && this.addWidePolyline(o, n, r, s);
	}
	addWidePolyline(e, n, s, i) {
		for (let o = 0; o < e.length - 1; o++) this.addWideSegment(e[o], e[o + 1], s, i, !1);
		n && this.addWideSegment(e[e.length - 1], e[0], s, i, !1);
		for (const o of e) this.addWideDisc(o, s / 2, i);
	}
	addWideSegment(e, n, s, i, o) {
		const r = n.x - e.x, a = n.y - e.y, c = Math.hypot(r, a);
		if (!Number.isFinite(c) || c <= 1e-14) return;
		const l = Math.abs(s) / 2, h = -a / c * l, u = r / c * l;
		this.addTriangleFan([
			{
				x: e.x + h,
				y: e.y + u
			},
			{
				x: n.x + h,
				y: n.y + u
			},
			{
				x: n.x - h,
				y: n.y - u
			},
			{
				x: e.x - h,
				y: e.y - u
			}
		], i), o && (this.addWideDisc(e, l, i), this.addWideDisc(n, l, i));
	}
	addWideDisc(e, n, s) {
		if (!Number.isFinite(n) || n <= 1e-9) return;
		const i = [], o = 8;
		for (let r = 0; r < o; r++) {
			const a = r / o * Math.PI * 2;
			i.push({
				x: e.x + Math.cos(a) * n,
				y: e.y + Math.sin(a) * n
			});
		}
		this.addTriangleFan([
			e,
			...i,
			i[0]
		], s);
	}
	addSegment(e, n, s) {
		if (!L(e) || !L(n) || Math.hypot(e.x - n.x, e.y - n.y) <= 1e-14) return;
		const i = this.batchFor(this.lineBuckets, jt([e, n]));
		Me(i, e, s, this.origin), Me(i, n, s, this.origin), i.primitiveCount++, this.primitiveCount++;
	}
	addPoint(e, n) {
		const s = this.batchFor(this.pointBuckets, No(e));
		Me(s, e, n, this.origin), s.primitiveCount++, this.primitiveCount++;
	}
	addLineTypePoint(e, n) {
		const s = this.batchFor(this.lineTypePointBuckets, No(e));
		Me(s, e, n, this.origin), s.primitiveCount++, this.primitiveCount++;
	}
	resolveLineTypeGlyph(e) {
		var n;
		return e.kind === "shape" ? this.opts.shxGlyphResolver.resolveShape(Number(e.shapeNumber), e.fontName) : this.opts.shxGlyphResolver.resolveText(String((n = e.text) != null ? n : ""), e.fontName);
	}
	addTriangleFan(e, n) {
		const s = e.filter(L).map(j);
		if (s.length < 3) return;
		const i = jt(s), o = this.batchFor(this.triangleBuckets, i);
		for (let r = 1; r < s.length - 1; r++) Me(o, s[0], n, this.origin), Me(o, s[r], n, this.origin), Me(o, s[r + 1], n, this.origin), o.primitiveCount++, this.primitiveCount++;
	}
	batchFor(e, n) {
		const s = this.bucketKey(n);
		let i = e.get(s);
		return i || (i = Kl(), e.set(s, i)), K(i.bounds, {
			x: n.minX,
			y: n.minY
		}), K(i.bounds, {
			x: n.maxX,
			y: n.maxY
		}), i;
	}
	bucketKey(e) {
		if (!Number.isFinite(this.tileSize)) return "all";
		const n = (e.minX + e.maxX) / 2, s = (e.minY + e.maxY) / 2;
		return `${Math.floor((n - this.bounds.minX) / this.tileSize)}:${Math.floor((s - this.bounds.minY) / this.tileSize)}`;
	}
	strokeBytes(e) {
		var n;
		return dn($e(e, this.document, this.colorOptions()), [
			255,
			255,
			255,
			255
		], Re(Number((n = e.opacity) != null ? n : 1), 0, 1));
	}
	fillBytes(e) {
		var s;
		const n = cn(e, this.document, this.colorOptions());
		return n ? dn(n, [
			255,
			255,
			255,
			255
		], Re(Number((s = e.opacity) != null ? s : 1), 0, 1)) : void 0;
	}
	colorOptions() {
		return {
			foreground: this.opts.foreground,
			background: this.opts.background,
			trueColorByteOrder: this.opts.trueColorByteOrder,
			contrastMode: this.opts.contrastMode,
			minColorContrast: this.opts.minColorContrast
		};
	}
	markSkipped(e) {
		var n;
		this.stats.skipped++, this.stats.unsupported[e] = (n = this.stats.unsupported[e]) != null ? n : 0;
	}
	lookupLayer(e) {
		var n, s;
		if (e) return (s = (n = this.document.layers[e]) != null ? n : this.document.layers[e.toLowerCase()]) != null ? s : Object.values(this.document.layers).find((i) => i.name.toLowerCase() === e.toLowerCase());
	}
	lookupBlock(e) {
		var n, s;
		if (e) return (s = (n = this.document.blocks[e]) != null ? n : this.document.blocks[e.toLowerCase()]) != null ? s : Object.values(this.document.blocks).find((i) => i.name.toLowerCase() === e.toLowerCase());
	}
};
function Kl() {
	return {
		positions: [],
		colors: [],
		bounds: fe(),
		primitiveCount: 0
	};
}
function Me(t, e, n, s) {
	t.positions.push(e.x - s.x, e.y - s.y), t.colors.push(n[0], n[1], n[2], n[3]);
}
function Nt(t, e) {
	const n = [];
	for (const s of t.values()) {
		const i = s.positions.length / 2;
		if (i <= 0 || !ae(s.bounds)) continue;
		if (i <= e) {
			n.push({
				positions: new Float32Array(s.positions),
				colors: new Uint8Array(s.colors),
				bounds: { ...s.bounds },
				primitiveCount: s.primitiveCount
			});
			continue;
		}
		const o = Zl(s), r = Math.max(o, Math.floor(e / o) * o);
		for (let a = 0; a < i; a += r) {
			const c = Math.min(i, a + r), l = s.positions.slice(a * 2, c * 2), h = s.colors.slice(a * 4, c * 4), u = fe();
			for (let f = 0; f < l.length; f += 2) K(u, {
				x: l[f],
				y: l[f + 1]
			});
			n.push({
				positions: new Float32Array(l),
				colors: new Uint8Array(h),
				bounds: { ...s.bounds },
				primitiveCount: Math.floor((c - a) / o)
			});
		}
	}
	return n;
}
function Zl(t) {
	const e = t.positions.length / 2;
	return e === t.primitiveCount ? 1 : e === t.primitiveCount * 3 ? 3 : 2;
}
function ko(t, e) {
	const n = [];
	let s, i;
	const o = (r) => {
		(!n.length || Math.hypot(n[n.length - 1].x - r.x, n[n.length - 1].y - r.y) > 1e-12) && n.push(j(r)), s = j(r);
	};
	for (const r of t) if (r.cmd === "M") s = j(r.points[0]), i = s, o(s);
	else if (r.cmd === "L") o(r.points[0]);
	else if (r.cmd === "Q" && s && r.points.length >= 2) {
		const a = s, [c, l] = r.points, h = Math.max(4, Math.min(e, 24));
		for (let u = 1; u <= h; u++) {
			const f = u / h, d = 1 - f;
			o({
				x: d * d * a.x + 2 * d * f * c.x + f * f * l.x,
				y: d * d * a.y + 2 * d * f * c.y + f * f * l.y
			});
		}
	} else if (r.cmd === "C" && s && r.points.length >= 3) {
		const a = s, [c, l, h] = r.points, u = Math.max(6, Math.min(e, 32));
		for (let f = 1; f <= u; f++) {
			const d = f / u, m = 1 - d;
			o({
				x: m ** 3 * a.x + 3 * m * m * d * c.x + 3 * m * d * d * l.x + d ** 3 * h.x,
				y: m ** 3 * a.y + 3 * m * m * d * c.y + 3 * m * d * d * l.y + d ** 3 * h.y
			});
		}
	} else r.cmd === "Z" && i && o(i);
	return n;
}
function Jl(t) {
	for (const e of [
		"startPoint",
		"insertionPoint",
		"center",
		"point",
		"location"
	]) {
		const n = t[e];
		if (L(n)) return j(n);
	}
	if (Array.isArray(t.vertices) && L(t.vertices[0])) return j(t.vertices[0]);
	if (Array.isArray(t.commands) && t.commands.length) {
		const e = t.commands.find((n) => n.points.length > 0);
		if (e) return j(e.points[0]);
	}
}
function jt(t) {
	const e = fe();
	for (const n of t) K(e, n);
	return e;
}
function kr(t, e) {
	const n = Math.max(1, Math.abs(t.x), Math.abs(t.y), Math.abs(e.x), Math.abs(e.y));
	return Math.hypot(t.x - e.x, t.y - e.y) <= Math.max(1e-9, n * 1e-12);
}
function Ql(t, e) {
	const n = t.findIndex((s) => kr(s, e));
	n >= 0 && t.splice(n, 1);
}
function No(t) {
	return {
		minX: t.x,
		minY: t.y,
		maxX: t.x,
		maxY: t.y
	};
}
function Gt(t, e) {
	return t.minX <= e.maxX && t.maxX >= e.minX && t.minY <= e.maxY && t.maxY >= e.minY;
}
function eh(t, e) {
	return e.trueColorByteOrder !== void 0 && e.trueColorByteOrder !== t.trueColorByteOrder || e.contrastMode !== void 0 && e.contrastMode !== t.contrastMode || e.minColorContrast !== void 0 && e.minColorContrast !== t.minColorContrast || e.foreground !== void 0 && e.foreground !== t.foreground || e.background !== void 0 && e.background !== t.background || e.maxInsertDepth !== void 0 && e.maxInsertDepth !== t.maxInsertDepth || e.maxCurveSegments !== void 0 && e.maxCurveSegments !== t.maxCurveSegments || e.spatialIndexCellCount !== void 0 && e.spatialIndexCellCount !== t.spatialIndexCellCount || e.maxVerticesPerBatch !== void 0 && e.maxVerticesPerBatch !== t.maxVerticesPerBatch || e.enableSpatialIndex !== void 0 && e.enableSpatialIndex !== t.enableSpatialIndex || e.shxGlyphResolver !== void 0 && e.shxGlyphResolver !== t.shxGlyphResolver;
}
function Po(t, e) {
	return {
		...t.stats,
		renderElapsedMs: e,
		backend: "webgl",
		primitiveCount: t.primitiveCount,
		visiblePrimitiveCount: 0,
		culledPrimitiveCount: 0,
		gpuMemoryBytes: t.gpuMemoryBytes,
		buildElapsedMs: t.buildElapsedMs
	};
}
function th(t) {
	return {
		total: t.total,
		drawn: t.drawn,
		skipped: t.skipped,
		byType: { ...t.byType },
		unsupported: { ...t.unsupported },
		renderElapsedMs: t.renderElapsedMs,
		backend: t.backend,
		primitiveCount: t.primitiveCount,
		visiblePrimitiveCount: t.visiblePrimitiveCount,
		culledPrimitiveCount: t.culledPrimitiveCount,
		gpuMemoryBytes: t.gpuMemoryBytes,
		buildElapsedMs: t.buildElapsedMs
	};
}
function dn(t, e, n = 1) {
	const s = t.trim().toLowerCase();
	let i;
	if (/^#[0-9a-f]{3}$/i.test(s)) i = [
		parseInt(s[1] + s[1], 16),
		parseInt(s[2] + s[2], 16),
		parseInt(s[3] + s[3], 16),
		255
	];
	else if (/^#[0-9a-f]{6}$/i.test(s)) i = [
		parseInt(s.slice(1, 3), 16),
		parseInt(s.slice(3, 5), 16),
		parseInt(s.slice(5, 7), 16),
		255
	];
	else {
		const r = s.match(/^rgba?\(([^)]+)\)$/i);
		if (r) {
			const a = r[1].split(/[\s,\/]+/).filter(Boolean), c = a.slice(0, 3).some((h) => h.includes("%")), l = a.map((h) => Number(h.replace("%", "")));
			l.length >= 3 && l.slice(0, 3).every(Number.isFinite) && (i = [
				Qe(c ? l[0] * 2.55 : l[0]),
				Qe(c ? l[1] * 2.55 : l[1]),
				Qe(c ? l[2] * 2.55 : l[2]),
				Qe((Number.isFinite(l[3]) ? l[3] : 1) * 255)
			]);
		}
	}
	const o = i != null ? i : e;
	return [
		o[0],
		o[1],
		o[2],
		Qe(o[3] * n)
	];
}
function Qe(t) {
	return Math.max(0, Math.min(255, Math.round(t)));
}
var nh = class {
	constructor(e = {}) {
		S(this, "canvas");
		S(this, "renderer");
		S(this, "registry");
		S(this, "nativeHost");
		S(this, "options");
		S(this, "referenceRegistry", new ll());
		S(this, "shxGlyphResolver");
		S(this, "externalShxGlyphResolver");
		S(this, "lastResult");
		S(this, "activeNativeLoader");
		var n, s, i, o, r, a;
		if (this.options = {
			autoFit: !0,
			colorMode: "source",
			...e
		}, this.externalShxGlyphResolver = (n = e.canvasOptions) == null ? void 0 : n.shxGlyphResolver, this.shxGlyphResolver = {
			resolveShape: (c, l) => {
				var h, u;
				return (u = this.referenceRegistry.resolveShape(c, l)) != null ? u : (h = this.externalShxGlyphResolver) == null ? void 0 : h.resolveShape(c, l);
			},
			resolveText: (c, l) => {
				var h, u;
				return (u = this.referenceRegistry.resolveText(c, l)) != null ? u : (h = this.externalShxGlyphResolver) == null ? void 0 : h.resolveText(c, l);
			}
		}, this.registry = (s = e.registry) != null ? s : tc(e), e.loaders) for (const c of e.loaders) this.registry.register(c);
		if (this.canvas = (i = e.canvas) != null ? i : document.createElement("canvas"), this.canvas.classList.add("cad-viewer-canvas"), e.container) e.container.classList.add("cad-viewer-container"), e.canvas || (this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.display = "block", e.container.appendChild(this.canvas)), this.nativeHost = (o = e.nativeHost) != null ? o : document.createElement("div"), this.nativeHost.classList.add("cad-viewer-native-host"), e.nativeHost || e.container.appendChild(this.nativeHost);
		else if (e.nativeHost) this.nativeHost = e.nativeHost, this.nativeHost.classList.add("cad-viewer-native-host");
		else if ((r = e.canvas) != null && r.parentElement) {
			e.canvas.parentElement.classList.add("cad-viewer-container");
			const c = document.createElement("div");
			c.classList.add("cad-viewer-native-host"), e.canvas.parentElement.appendChild(c), this.nativeHost = c;
		}
		this.renderer = sh((a = e.renderer) != null ? a : "auto", this.canvas, {
			...e.canvasOptions,
			shxGlyphResolver: this.shxGlyphResolver
		}), this.renderer.onStats = (c) => {
			var l, h;
			return (h = (l = this.options).onRenderStats) == null ? void 0 : h.call(l, c);
		}, this.renderer.onViewChange = (c) => {
			var l, h;
			return (h = (l = this.options).onViewChange) == null ? void 0 : h.call(l, c);
		};
	}
	registerLoader(e) {
		return this.registry.register(e), this;
	}
	async loadFile(e, n = {}) {
		var s, i;
		return (i = (s = this.options).onLoadStart) == null || i.call(s, e), this.loadThroughRegistry({
			file: e,
			fileName: e.name
		}, n, e.name);
	}
	async loadBuffer(e, n, s = {}) {
		var i, o;
		return (o = (i = this.options).onLoadStart) == null || o.call(i, e), this.loadThroughRegistry({
			buffer: e,
			fileName: n
		}, s, n);
	}
	async load(e, n = {}) {
		var s, i, o, r;
		return (i = (s = this.options).onLoadStart) == null || i.call(s, e), this.loadThroughRegistry(e, n, (r = e.fileName) != null ? r : (o = e.file) == null ? void 0 : o.name);
	}
	async addReference(e) {
		var n, s;
		try {
			const i = await this.referenceRegistry.add(e);
			return this.refreshCurrentReferences(), i;
		} catch (i) {
			const o = To(i);
			throw (s = (n = this.options).onError) == null || s.call(n, o), o;
		}
	}
	async addReferenceFile(e) {
		return this.addReference({
			file: e,
			fileName: e.name
		});
	}
	async addReferenceBuffer(e, n) {
		return this.addReference({
			buffer: e,
			fileName: n
		});
	}
	removeReference(e) {
		const n = this.referenceRegistry.remove(e);
		return n && this.refreshCurrentReferences(), n;
	}
	clearReferences() {
		this.referenceRegistry.clear(), this.refreshCurrentReferences();
	}
	getReferenceState() {
		return this.referenceRegistry.getState();
	}
	getMissingReferences() {
		return this.getReferenceState().missing;
	}
	getLoadedReferences() {
		return this.getReferenceState().loaded;
	}
	setDocument(e, n) {
		var i, o;
		this.deactivateNativeRenderer(), this.activateDocumentReferences(e);
		const s = {
			document: e,
			raw: e.raw,
			bytes: 0,
			elapsedMs: 0,
			format: e.format,
			warnings: e.warnings,
			summary: Ze(e),
			fileName: n
		};
		return this.renderer.setDocument(this.createRenderDocument(e)), this.options.autoFit || this.renderer.render(), this.lastResult = s, (o = (i = this.options).onLoad) == null || o.call(i, s), s;
	}
	fit(e) {
		var n, s;
		this.activeNativeLoader ? (s = (n = this.activeNativeLoader).fit) == null || s.call(n) : this.renderer.fitToView(.92, e);
	}
	zoomIn() {
		var e, n;
		this.activeNativeLoader ? (n = (e = this.activeNativeLoader).zoomIn) == null || n.call(e) : this.renderer.zoomIn();
	}
	zoomOut() {
		var e, n;
		this.activeNativeLoader ? (n = (e = this.activeNativeLoader).zoomOut) == null || n.call(e) : this.renderer.zoomOut();
	}
	resize() {
		var e, n;
		this.activeNativeLoader ? (n = (e = this.activeNativeLoader).resize) == null || n.call(e) : this.renderer.resize();
	}
	/**
	* Switches the active viewer between authored colors and a fixed plot color.
	* The parsed document is never rewritten. Existing pan/zoom state is retained.
	*/
	setColorMode(e, n = this.options.monochromeColor) {
		const s = e === "monochrome" ? "monochrome" : "source", i = Mo(n);
		s === this.getColorMode() && i === this.getMonochromeColor() || (this.options.colorMode = s, this.options.monochromeColor = i, this.refreshColorPolicy());
	}
	getColorMode() {
		return this.options.colorMode === "monochrome" ? "monochrome" : "source";
	}
	getMonochromeColor() {
		return Mo(this.options.monochromeColor);
	}
	setCanvasOptions(e) {
		var n, s, i, o;
		this.options.canvasOptions = {
			...(n = this.options.canvasOptions) != null ? n : {},
			...e
		}, e.shxGlyphResolver && (this.externalShxGlyphResolver = e.shxGlyphResolver), this.renderer.setOptions({
			...e,
			shxGlyphResolver: this.shxGlyphResolver
		}), this.activeNativeLoader && ((o = (i = this.activeNativeLoader).setNativeOptions) == null || o.call(i, {
			...this.mergeLoadOptions({}),
			dwfBackground: (s = e.background) != null ? s : this.options.dwfBackground
		}));
	}
	async preloadDwg(e = {}) {
		const n = this.registry.list().find((s) => s.id === "dwg");
		if (!(n != null && n.preload)) throw new Error("The registered DWG loader does not support preload().");
		return n.preload(this.mergeLoadOptions(e));
	}
	clear() {
		this.lastResult = void 0, this.deactivateNativeRenderer(), this.renderer.clear(), this.referenceRegistry.setDocument(void 0), this.emitReferenceState();
	}
	destroy() {
		var e, n, s;
		this.deactivateNativeRenderer();
		for (const i of this.registry.list()) {
			const o = i;
			(e = o.terminateWorker) == null || e.call(o), (n = o.unmount) == null || n.call(o), (s = o.destroy) == null || s.call(o);
		}
		this.referenceRegistry.clear(), this.renderer.destroy();
	}
	getLoadResult() {
		return this.lastResult;
	}
	getDocument() {
		var e;
		return this.activeNativeLoader ? (e = this.lastResult) == null ? void 0 : e.document : this.renderer.getDocument();
	}
	getSourceDocument() {
		var e;
		return (e = this.lastResult) == null ? void 0 : e.document;
	}
	/** Returns a fresh BOM derived from the parser-owned WCS document, or undefined before a file is loaded. */
	getBom(e = {}) {
		const n = this.getSourceDocument();
		return n ? ic(n, e) : void 0;
	}
	getZoomPercent() {
		return this.activeNativeLoader ? 100 : this.renderer.getZoomPercent();
	}
	isNativeRendererActive() {
		return !!this.activeNativeLoader;
	}
	/** Captures the current view, including text overlays, without changing source data or pan/zoom. */
	async captureCanvas() {
		if (!this.lastResult) throw new Error("No CAD document is loaded.");
		if (this.activeNativeLoader) {
			if (!this.activeNativeLoader.captureCanvas) throw new Error("The native loader does not support capture.");
			return this.activeNativeLoader.captureCanvas();
		}
		return this.renderer.captureCanvas();
	}
	async loadThroughRegistry(e, n, s) {
		var i, o;
		try {
			const r = this.mergeLoadOptions(n);
			qt(r.signal);
			const a = await this.registry.detect(e), c = {
				...e,
				buffer: a.bytes
			};
			if (fl(a.loader)) return await this.applyNativeLoadResult(a.loader, c, r, s);
			const l = await a.loader.load(c, r);
			return this.applyLoadResult(l, s);
		} catch (r) {
			const a = To(r);
			throw (o = (i = this.options).onError) == null || o.call(i, a), a;
		}
	}
	applyLoadResult(e, n) {
		var i, o, r, a;
		this.deactivateNativeRenderer(), (o = (i = this.options).onLoadProgress) == null || o.call(i, {
			phase: "render",
			format: e.format,
			message: "Rendering normalized CAD scene…",
			percent: 96
		}), this.activateDocumentReferences(e.document), e.warnings = e.document.warnings, this.renderer.setDocument(this.createRenderDocument(e.document)), this.options.autoFit || this.renderer.render();
		const s = {
			...e,
			fileName: n,
			summary: Ze(e.document)
		};
		return this.lastResult = s, (a = (r = this.options).onLoad) == null || a.call(r, s), s;
	}
	async applyNativeLoadResult(e, n, s, i) {
		var o, r, a;
		if (!this.nativeHost) throw new Error("Native DWF rendering requires CadViewerOptions.container, nativeHost, or a canvas parent element.");
		qt(s.signal), this.renderer.clear(), (o = this.activeNativeLoader) == null || o.unmount(), this.activeNativeLoader = e, this.canvas.style.display = "none", this.nativeHost.classList.add("is-active");
		try {
			const c = await e.mount(n, this.nativeHost, s);
			qt(s.signal), this.activateDocumentReferences(c.document), c.warnings = c.document.warnings;
			const l = {
				...c,
				fileName: i,
				summary: Ze(c.document)
			};
			return this.lastResult = l, this.emitNativeRenderStats(c), (a = (r = this.options).onLoad) == null || a.call(r, l), l;
		} catch (c) {
			throw this.deactivateNativeRenderer(), c;
		}
	}
	deactivateNativeRenderer() {
		var e, n;
		if (!this.activeNativeLoader && !((e = this.nativeHost) != null && e.classList.contains("is-active"))) {
			this.canvas.style.display = "";
			return;
		}
		(n = this.activeNativeLoader) == null || n.unmount(), this.activeNativeLoader = void 0, this.nativeHost && (this.nativeHost.classList.remove("is-active"), this.nativeHost.replaceChildren()), this.canvas.style.display = "";
	}
	emitNativeRenderStats(e) {
		var r, a, c, l, h, u, f;
		const n = e.document.metadata, s = Number((c = (a = (r = n.nativeRenderStats) == null ? void 0 : r.commands) != null ? a : e.document.entities.length) != null ? c : 0), o = String((h = (l = n.nativeRenderStats) == null ? void 0 : l.backend) != null ? h : "webgl").includes("webgl") ? "webgl" : "canvas2d";
		(f = (u = this.options).onRenderStats) == null || f.call(u, {
			total: s,
			drawn: s,
			skipped: 0,
			byType: Ze(e.document).byType,
			unsupported: {},
			renderElapsedMs: e.elapsedMs,
			backend: o,
			primitiveCount: s,
			visiblePrimitiveCount: s,
			culledPrimitiveCount: 0,
			gpuMemoryBytes: void 0,
			buildElapsedMs: e.elapsedMs
		});
	}
	mergeLoadOptions(e) {
		const n = this.options.onProgress, s = e.onProgress;
		return {
			...this.options,
			...e,
			onProgress: (i) => {
				var o, r;
				(r = (o = this.options).onLoadProgress) == null || r.call(o, i), n?.(i), s && s !== n && s(i);
			}
		};
	}
	createRenderDocument(e) {
		return Rc(e, {
			mode: this.getColorMode(),
			monochromeColor: this.getMonochromeColor()
		});
	}
	refreshColorPolicy() {
		var s, i, o;
		if (this.activeNativeLoader) {
			(i = (s = this.activeNativeLoader).setNativeOptions) == null || i.call(s, this.mergeLoadOptions({}));
			return;
		}
		const e = (o = this.lastResult) == null ? void 0 : o.document;
		if (!e) return;
		const n = this.renderer.getViewState();
		this.renderer.setDocument(this.createRenderDocument(e)), this.renderer.setViewState(n);
	}
	activateDocumentReferences(e) {
		this.referenceRegistry.setDocument(e), co(e, this.referenceRegistry.getState()), this.emitReferenceState();
	}
	refreshCurrentReferences() {
		var n;
		const e = (n = this.lastResult) == null ? void 0 : n.document;
		e && (this.referenceRegistry.setDocument(e), co(e, this.referenceRegistry.getState()), this.lastResult.warnings = e.warnings, this.lastResult.summary = Ze(e), this.activeNativeLoader || this.renderer.refreshReferences()), this.emitReferenceState();
	}
	emitReferenceState() {
		var e, n;
		(n = (e = this.options).onReferenceStateChange) == null || n.call(e, this.referenceRegistry.getState());
	}
};
function Mo(t) {
	return typeof t != "string" ? void 0 : t.trim() || void 0;
}
function To(t) {
	return t instanceof Error ? t : new Error(String(t));
}
function qt(t) {
	if (t != null && t.aborted) throw new DOMException("Loading cancelled.", "AbortError");
}
function sh(t, e, n = {}) {
	if (t === "canvas2d") return new yo(e, n);
	if (t === "webgl") return new xo(e, n);
	if (Sr()) try {
		return new xo(e, n);
	} catch (s) {}
	return new yo(e, n);
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-cad@3.1.2_three@0.185.1/node_modules/@file-viewer/renderer-cad/dist/export.js
async function captureFileViewerCadCanvas(getViewer) {
	const viewer = getViewer();
	if (!(viewer === null || viewer === void 0 ? void 0 : viewer.captureCanvas)) throw new Error("The CAD engine does not support canvas snapshots.");
	const snapshot = await viewer.captureCanvas();
	if (getViewer() !== viewer) throw new Error("The CAD document changed during export.");
	return snapshot;
}
function createFileViewerCadExportAdapter(getViewer, filename = "CAD drawing", getPage) {
	return {
		includeDocumentStyles: false,
		getPrintMaskPages: getPage ? () => [getPage()] : void 0,
		async toHtml() {
			const snapshot = await captureFileViewerCadCanvas(getViewer);
			const image = snapshot.ownerDocument.createElement("img");
			image.src = snapshot.toDataURL("image/png");
			image.alt = filename;
			image.width = snapshot.width;
			image.height = snapshot.height;
			image.style.cssText = "display:block;max-width:100%;height:auto;margin:0 auto;";
			const page = snapshot.ownerDocument.createElement("div");
			page.dataset.viewerPrintPageIndex = "0";
			page.appendChild(image);
			return page.outerHTML;
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-cad@3.1.2_three@0.185.1/node_modules/@file-viewer/renderer-cad/dist/cad.js
var CAD_WORKER_TIMEOUT = 12e4;
var CAD_DEFAULT_FIT_PADDING = .92;
var CAD_BOUNDS_EPSILON = 1e-9;
var CAD_BEST_FIT_OUTLIER_RATIO = 8;
var CAD_NATIVE_MIN_ZOOM_RATIO = .05;
var CAD_NATIVE_MAX_ZOOM_RATIO = 64;
var cadStyle = `
.cad-shell{display:flex;height:100%;min-height:100%;flex-direction:column;background:#f5f7fb;color:#142335;container-type:inline-size;container-name:file-viewer-cad}
.cad-shell *{box-sizing:border-box}
.cad-toolbar{display:flex;flex-shrink:0;min-height:48px;align-items:center;justify-content:space-between;gap:16px;padding:0 14px;border-bottom:1px solid rgba(15,23,42,.08);background:#fff}
.cad-tools,.cad-meta{display:flex;align-items:center;gap:8px}
.cad-tools{flex-wrap:wrap;padding:6px 0}
.cad-tools button.cad-export-image{min-width:44px;min-height:40px;padding:0 10px;white-space:nowrap}
.cad-tools button[hidden]{display:none}
.cad-tools button:disabled{cursor:not-allowed;opacity:.46}
.cad-export-error{margin:0;padding:6px 14px;background:#fff4ed;color:#b42318;font-size:12px}
.cad-export-error[hidden]{display:none}
.cad-tools button{min-width:34px;min-height:30px;border:0;border-radius:8px;background:rgba(15,23,42,.06);color:#25344c;cursor:pointer;font-weight:800;letter-spacing:0;transition:background-color .18s ease,color .18s ease}
.cad-tools button:hover{background:rgba(31,150,110,.14);color:#0f8f62}
.cad-tools button.cad-color-mode{min-width:52px;padding:0 10px;font-size:12px}
.cad-tools button.cad-color-mode[aria-pressed='true']{background:#0f172a;color:#fff}
.cad-tools button.cad-color-mode:disabled{cursor:not-allowed;opacity:.46}
.cad-zoom,.cad-meta span{color:#64748b;font-size:12px;font-weight:800;letter-spacing:0}
.cad-meta span{border-radius:999px;padding:5px 9px;background:rgba(15,23,42,.06)}
.cad-body{display:grid;min-height:0;flex:1;grid-template-columns:minmax(176px,236px) minmax(0,1fr) minmax(142px,176px);background:#eef2f7}
.cad-body.without-layers{grid-template-columns:minmax(0,1fr) minmax(142px,176px)}
.cad-layers,.cad-inspector{min-height:0;overflow:auto;border-right:1px solid rgba(15,23,42,.08);background:#fff}
.cad-layers[hidden]{display:none}
.cad-inspector{border-right:0;border-left:1px solid rgba(15,23,42,.08);padding:14px}
.cad-layers-head{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 12px 9px;border-bottom:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.96);color:#1f2a3d;font-size:12px;z-index:1}
.cad-layers-head span{color:#7b8ca5;font-size:11px;font-weight:800;white-space:nowrap}
.cad-layers-list{display:flex;flex-direction:column;gap:2px;padding:7px 8px 10px}
.cad-layers button{display:grid;width:100%;min-height:30px;grid-template-columns:14px minmax(0,1fr);align-items:center;gap:7px;border:0;border-radius:6px;background:transparent;color:#25344c;cursor:pointer;font-size:12px;font-weight:700;text-align:left}
.cad-layers button:hover{background:#f1f5f9}
.cad-layers button.muted{color:#94a3b8}
.cad-layers button span:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cad-layer-color{width:8px;height:8px;justify-self:center;border-radius:50%;background:#1f966e;box-shadow:0 0 0 1px rgba(15,23,42,.12),0 0 0 3px rgba(31,150,110,.1)}
.cad-canvas-wrap{position:relative;min-width:0;min-height:0;overflow:hidden;background:linear-gradient(90deg,rgba(15,23,42,.04) 1px,transparent 1px),linear-gradient(180deg,rgba(15,23,42,.04) 1px,transparent 1px),#f8fafc;background-size:28px 28px}
.cad-stage{position:relative;width:100%;height:100%;min-height:420px;overflow:hidden}
.cad-stage canvas{position:absolute;inset:0;display:block;width:100%!important;height:100%!important}
.cad-native-stage{position:absolute;inset:0;z-index:2;display:none;overflow:hidden}
.cad-native-stage:not(:empty),.cad-native-stage.is-active{display:block}
.cad-native-stage *{box-sizing:border-box}
.dwfv-root{height:100%;min-height:0;display:grid;grid-template-rows:auto 1fr;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#111827}
.dwfv-toolbar{display:flex;gap:8px;align-items:center;padding:8px 12px;background:#fff;border-bottom:1px solid #e5e7eb}
.dwfv-toolbar button,.dwfv-toolbar select{font:inherit}
.dwfv-workspace{min-height:0;display:grid;grid-template-columns:minmax(220px,300px) 1fr}
.dwfv-tree{overflow:auto;border-right:1px solid #d6d8dd;background:#fff;font-size:12px;padding:8px}
.dwfv-tree[style*="display: none"]+.dwfv-stage{grid-column:1/-1}
.dwfv-tree-header{font-weight:700;margin-bottom:4px}
.dwfv-tree-stats{color:#6b7280;margin-bottom:8px}
.dwfv-tree details{margin-left:8px}
.dwfv-tree summary{cursor:pointer;padding:2px 0}
.dwfv-tree-meta{color:#6b7280;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;padding-left:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dwfv-stage{position:relative;overflow:hidden;background:#e5e7eb}
.dwfv-canvas{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%}
.dwfv-webgl-canvas{pointer-events:none}
.dwfv-overlay-canvas{pointer-events:auto;touch-action:none;cursor:grab}
.dwfv-overlay-canvas:active{cursor:grabbing}
.dwfv-status{margin-left:auto;font-size:12px;color:#4b5563}
.dwfv-warn{color:#92400e}
.cad-viewer-container{position:relative;overflow:hidden;min-width:0;min-height:0}
.cad-viewer-canvas{display:block;width:100%;height:100%;cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none}
.cad-viewer-canvas.is-dragging{cursor:grabbing}
.cad-viewer-webgl-canvas{position:relative;z-index:0}
.cad-viewer-text-overlay{display:block;contain:strict;-webkit-user-select:none;user-select:none}
.cad-viewer-native-host{position:absolute;top:0;right:0;bottom:0;left:0;display:none;z-index:2;min-width:0;min-height:0;background:#05070d}
.cad-viewer-native-host.is-active{display:block}
.cad-viewer-native-host .dwfv-root{height:100%;min-height:0;color:#dbeafe;background:#05070d}
.cad-viewer-native-host .dwfv-toolbar{min-height:34px;padding:5px 8px;gap:6px;border-bottom:1px solid rgba(71,85,105,.65);background:#0f172af5;color:#e5e7eb}
.cad-viewer-native-host .dwfv-toolbar button,.cad-viewer-native-host .dwfv-toolbar select{height:24px;border:1px solid rgba(100,116,139,.75);border-radius:6px;background:#111827;color:#e5e7eb;font-size:12px}
.cad-viewer-native-host .dwfv-toolbar button{padding:0 8px;cursor:pointer}
.cad-viewer-native-host .dwfv-toolbar button:hover,.cad-viewer-native-host .dwfv-toolbar select:hover{border-color:#60a5fa;color:#bfdbfe}
.cad-viewer-native-host .dwfv-status{color:#93c5fd;font-size:12px}
.cad-viewer-native-host .dwfv-workspace{min-height:0;background:#05070d}
.cad-viewer-native-host .dwfv-stage{background:#05070d}
.cad-viewer-native-host .dwfv-tree{border-right:1px solid rgba(71,85,105,.7);background:#0f172a;color:#dbeafe}
.cad-viewer-native-host .dwfv-tree-stats,.cad-viewer-native-host .dwfv-tree-meta{color:#94a3b8}
.cad-viewer-native-host .dwfv-warn{color:#fbbf24}
.cad-native-stage .dwfv-root,.cad-native-stage .dwfv-workspace,.cad-native-stage .dwfv-stage{width:100%;min-width:0;min-height:0}
.cad-native-stage .dwfv-root{height:100%}
.cad-state{position:absolute;inset:50% auto auto 50%;max-width:min(520px,calc(100% - 48px));transform:translate(-50%,-50%);border-radius:12px;padding:14px 18px;background:rgba(255,255,255,.92);box-shadow:0 14px 38px rgba(15,23,42,.12);color:#53637a;font-size:13px;font-weight:800;text-align:center}
.cad-state[hidden]{display:none!important}
.cad-state.error{color:#b42318}
.cad-inspector strong{display:block;margin-bottom:12px;color:#1f2a3d;font-size:13px}
.cad-inspector dl{display:grid;gap:8px;margin:0}
.cad-inspector dl div{display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:8px;padding:8px 10px;background:#f8fafc}
.cad-inspector dt,.cad-inspector dd{margin:0;font-size:12px}
.cad-inspector dt{color:#7b8ca5;font-weight:700}
.cad-inspector dd{color:#20304a;font-weight:900}
.cad-warning{margin:12px 0 0;border-radius:8px;padding:10px;background:rgba(245,158,11,.13);color:#92400e;font-size:12px;line-height:1.55}
[data-viewer-theme='dark'] .cad-shell{background:#111827;color:#e5edf6}
[data-viewer-theme='dark'] .cad-body{background:#0d1117}
[data-viewer-theme='dark'] .cad-toolbar,[data-viewer-theme='dark'] .cad-layers,[data-viewer-theme='dark'] .cad-inspector{border-color:rgba(139,148,158,.2);background:#111827;color:#e5edf6}
[data-viewer-theme='dark'] .cad-layers-head{border-color:rgba(139,148,158,.2);background:rgba(17,24,39,.96);color:#f8fafc}
[data-viewer-theme='dark'] .cad-tools button,[data-viewer-theme='dark'] .cad-meta span,[data-viewer-theme='dark'] .cad-inspector dl div{background:#1f2937;color:#cbd5e1}
[data-viewer-theme='dark'] .cad-layers button,[data-viewer-theme='dark'] .cad-inspector strong,[data-viewer-theme='dark'] .cad-inspector dd{color:#e5edf6}
[data-viewer-theme='dark'] .cad-layers button:hover{background:#1f2937}
[data-viewer-theme='dark'] .cad-zoom,[data-viewer-theme='dark'] .cad-meta span,[data-viewer-theme='dark'] .cad-inspector dt,[data-viewer-theme='dark'] .cad-layers-head span{color:#94a3b8}
[data-viewer-theme='dark'] .cad-canvas-wrap{background:linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(180deg,rgba(148,163,184,.08) 1px,transparent 1px),#090d14;background-size:28px 28px}
[data-viewer-theme='dark'] .cad-state{background:rgba(15,23,42,.92);color:#cbd5e1;box-shadow:0 18px 44px rgba(0,0,0,.34)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .cad-shell{background:#111827;color:#e5edf6}[data-viewer-theme='system'] .cad-body{background:#0d1117}[data-viewer-theme='system'] .cad-toolbar,[data-viewer-theme='system'] .cad-layers,[data-viewer-theme='system'] .cad-inspector{border-color:rgba(139,148,158,.2);background:#111827;color:#e5edf6}[data-viewer-theme='system'] .cad-layers-head{border-color:rgba(139,148,158,.2);background:rgba(17,24,39,.96);color:#f8fafc}[data-viewer-theme='system'] .cad-tools button,[data-viewer-theme='system'] .cad-meta span,[data-viewer-theme='system'] .cad-inspector dl div{background:#1f2937;color:#cbd5e1}[data-viewer-theme='system'] .cad-layers button,[data-viewer-theme='system'] .cad-inspector strong,[data-viewer-theme='system'] .cad-inspector dd{color:#e5edf6}[data-viewer-theme='system'] .cad-layers button:hover{background:#1f2937}[data-viewer-theme='system'] .cad-zoom,[data-viewer-theme='system'] .cad-meta span,[data-viewer-theme='system'] .cad-inspector dt,[data-viewer-theme='system'] .cad-layers-head span{color:#94a3b8}[data-viewer-theme='system'] .cad-canvas-wrap{background:linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(180deg,rgba(148,163,184,.08) 1px,transparent 1px),#090d14;background-size:28px 28px}[data-viewer-theme='system'] .cad-state{background:rgba(15,23,42,.92);color:#cbd5e1;box-shadow:0 18px 44px rgba(0,0,0,.34)}}
@media (max-width:860px){.cad-body,.cad-body.without-layers{grid-template-columns:minmax(0,1fr)}.cad-layers,.cad-inspector,.cad-meta{display:none}.cad-tools{flex:1}.cad-tools button{min-width:44px;min-height:40px}}
@container file-viewer-cad (max-width:600px){.cad-meta{display:none}.cad-tools{flex:1}.cad-tools button{min-width:44px;min-height:40px}}
`;
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = cadStyle;
	return style;
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var normalizeType = (type) => {
	return (type || "dxf").toLowerCase();
};
var normalizeLayerKey = (name) => name.trim().toLocaleLowerCase();
var getLayerNameScore = (name) => {
	const letters = name.replace(/[^a-z]/gi, "");
	if (!letters) return 0;
	const isUpper = letters === letters.toLocaleUpperCase();
	const isLower = letters === letters.toLocaleLowerCase();
	if (!isUpper && !isLower) return 3;
	return isUpper ? 2 : 1;
};
var shouldPreferLayerName = (candidate, current) => {
	const nextScore = getLayerNameScore(candidate);
	const currentScore = getLayerNameScore(current);
	if (nextScore !== currentScore) return nextScore > currentScore;
	if (candidate.length !== current.length) return candidate.length > current.length;
	return candidate.localeCompare(current, void 0, { sensitivity: "base" }) < 0;
};
var addLayerSourceName = (layer, name) => {
	if (typeof name !== "string" && typeof name !== "number") return;
	const nextName = String(name);
	if (!nextName || layer.sourceNames.includes(nextName)) return;
	layer.sourceNames.push(nextName);
};
var collectLayers = (result) => {
	if (!result) return [];
	const groups = /* @__PURE__ */ new Map();
	Object.entries(result.document.layers).forEach(([key, layer]) => {
		var _a, _b, _c, _d, _e;
		const sourceName = typeof layer.name === "string" && layer.name ? layer.name : key;
		const groupKey = normalizeLayerKey(sourceName || key);
		const current = groups.get(groupKey);
		if (!current) {
			groups.set(groupKey, {
				...layer,
				name: sourceName || key,
				sourceNames: Array.from(new Set([key, sourceName].filter((name) => typeof name === "string" && name.length > 0))),
				duplicateCount: 1
			});
			return;
		}
		current.duplicateCount += 1;
		addLayerSourceName(current, key);
		addLayerSourceName(current, sourceName);
		current.isVisible = current.isVisible !== false || layer.isVisible !== false;
		current.isFrozen = !!current.isFrozen && !!layer.isFrozen;
		current.isLocked = !!current.isLocked || !!layer.isLocked;
		current.color = (_a = current.color) !== null && _a !== void 0 ? _a : layer.color;
		current.colorIndex = (_b = current.colorIndex) !== null && _b !== void 0 ? _b : layer.colorIndex;
		current.trueColor = (_c = current.trueColor) !== null && _c !== void 0 ? _c : layer.trueColor;
		current.lineType = (_d = current.lineType) !== null && _d !== void 0 ? _d : layer.lineType;
		current.lineweight = (_e = current.lineweight) !== null && _e !== void 0 ? _e : layer.lineweight;
		if (shouldPreferLayerName(sourceName, current.name)) current.name = sourceName;
	});
	return Array.from(groups.values()).sort((left, right) => left.name.localeCompare(right.name, void 0, {
		numeric: true,
		sensitivity: "base"
	}));
};
var formatNumber = (value, locale = "zh-CN") => {
	if (!Number.isFinite(value)) return "0";
	return new Intl.NumberFormat(locale).format(Math.round(value || 0));
};
var getCadDocumentBaseUrl = (target) => {
	return target.ownerDocument ? resolveFileViewerRuntimeAssetBaseUrl(target.ownerDocument) : "file:///";
};
var CAD_DWG_WORKER_FILENAME = "file-viewer-input.dwg";
var getCadPinchSnapshot = (points) => {
	const [first, second] = Array.from(points.values());
	if (!first || !second) return null;
	return {
		center: {
			x: (first.x + second.x) / 2,
			y: (first.y + second.y) / 2
		},
		distance: Math.hypot(second.x - first.x, second.y - first.y)
	};
};
/**
* The bundled CAD engines currently treat every touch pointer as the same
* drag. Coordinate two touch pointers before their target listeners run so a
* pinch becomes one anchored zoom operation instead of two competing pans.
*/
var registerCadPinchZoom = (surface, onStart, onZoom) => {
	const points = /* @__PURE__ */ new Map();
	let previous = null;
	let suppressDragUntilRelease = false;
	const suppressPointerEvent = (event) => {
		event.preventDefault();
		event.stopImmediatePropagation();
	};
	const handlePointerDown = (event) => {
		if (event.pointerType !== "touch") return;
		points.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY
		});
		try {
			surface.setPointerCapture(event.pointerId);
		} catch {}
		if (points.size < 2) return;
		suppressDragUntilRelease = true;
		previous = getCadPinchSnapshot(points);
		onStart();
		suppressPointerEvent(event);
	};
	const handlePointerMove = (event) => {
		if (event.pointerType !== "touch" || !points.has(event.pointerId)) return;
		points.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY
		});
		if (!suppressDragUntilRelease) return;
		if (points.size >= 2) {
			const current = getCadPinchSnapshot(points);
			if (previous && current && previous.distance > 0 && current.distance > 0) onZoom({
				center: current.center,
				deltaX: current.center.x - previous.center.x,
				deltaY: current.center.y - previous.center.y,
				factor: Math.min(2, Math.max(.5, current.distance / previous.distance))
			});
			previous = current;
		}
		suppressPointerEvent(event);
	};
	const handlePointerEnd = (event) => {
		if (event.pointerType !== "touch" || !points.has(event.pointerId)) return;
		points.delete(event.pointerId);
		previous = points.size >= 2 ? getCadPinchSnapshot(points) : null;
		if (points.size === 0) suppressDragUntilRelease = false;
		try {
			if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
		} catch {}
	};
	surface.addEventListener("pointerdown", handlePointerDown, { capture: true });
	surface.addEventListener("pointermove", handlePointerMove, { capture: true });
	surface.addEventListener("pointerup", handlePointerEnd, { capture: true });
	surface.addEventListener("pointercancel", handlePointerEnd, { capture: true });
	return () => {
		surface.removeEventListener("pointerdown", handlePointerDown, { capture: true });
		surface.removeEventListener("pointermove", handlePointerMove, { capture: true });
		surface.removeEventListener("pointerup", handlePointerEnd, { capture: true });
		surface.removeEventListener("pointercancel", handlePointerEnd, { capture: true });
		points.clear();
	};
};
var createEmptyCadBounds = () => ({
	minX: Number.POSITIVE_INFINITY,
	minY: Number.POSITIVE_INFINITY,
	maxX: Number.NEGATIVE_INFINITY,
	maxY: Number.NEGATIVE_INFINITY
});
var isCadBoundsValid = (bounds) => {
	return !!bounds && Number.isFinite(bounds.minX) && Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxX) && Number.isFinite(bounds.maxY) && bounds.maxX >= bounds.minX && bounds.maxY >= bounds.minY;
};
var getCadBoundsWidth = (bounds) => bounds.maxX - bounds.minX;
var getCadBoundsHeight = (bounds) => bounds.maxY - bounds.minY;
var isCadBoundsMeaningful = (bounds) => {
	return getCadBoundsWidth(bounds) > CAD_BOUNDS_EPSILON || getCadBoundsHeight(bounds) > CAD_BOUNDS_EPSILON;
};
var isCadPoint = (value) => {
	return !!value && typeof value === "object" && Number.isFinite(value.x) && Number.isFinite(value.y);
};
var addCadPointToBounds = (bounds, point) => {
	if (!isCadPoint(point)) return;
	bounds.minX = Math.min(bounds.minX, point.x);
	bounds.minY = Math.min(bounds.minY, point.y);
	bounds.maxX = Math.max(bounds.maxX, point.x);
	bounds.maxY = Math.max(bounds.maxY, point.y);
};
var addCadBounds = (target, source) => {
	if (!isCadBoundsValid(source)) return;
	addCadPointToBounds(target, {
		x: source.minX,
		y: source.minY
	});
	addCadPointToBounds(target, {
		x: source.maxX,
		y: source.maxY
	});
};
var unionCadBounds = (boundsList) => {
	const union = createEmptyCadBounds();
	boundsList.forEach((bounds) => addCadBounds(union, bounds));
	return isCadBoundsValid(union) ? union : null;
};
var getCadBoundsArea = (bounds) => {
	return Math.max(getCadBoundsWidth(bounds), CAD_BOUNDS_EPSILON) * Math.max(getCadBoundsHeight(bounds), CAD_BOUNDS_EPSILON);
};
var addCadCircleBounds = (bounds, center, radius) => {
	const value = Number(radius);
	if (!isCadPoint(center) || !Number.isFinite(value)) return;
	const nextRadius = Math.abs(value);
	addCadPointToBounds(bounds, {
		x: center.x - nextRadius,
		y: center.y - nextRadius
	});
	addCadPointToBounds(bounds, {
		x: center.x + nextRadius,
		y: center.y + nextRadius
	});
};
var addCadPointListToBounds = (bounds, points) => {
	if (!Array.isArray(points)) return;
	points.forEach((point) => addCadPointToBounds(bounds, point));
};
var addCadPathCommandsToBounds = (bounds, commands) => {
	if (!Array.isArray(commands)) return;
	commands.forEach((command) => {
		const points = command.points;
		addCadPointListToBounds(bounds, points);
	});
};
var addCadTextBounds = (bounds, entity) => {
	var _a, _b, _c, _d;
	const anchor = entity.insertionPoint || entity.startPoint || entity.center;
	if (!isCadPoint(anchor)) return;
	const text = String((_b = (_a = entity.text) !== null && _a !== void 0 ? _a : entity.value) !== null && _b !== void 0 ? _b : "");
	const height = Math.abs(Number((_d = (_c = entity.textHeight) !== null && _c !== void 0 ? _c : entity.height) !== null && _d !== void 0 ? _d : 1));
	const lines = text.split(/\r?\n/g);
	const width = Math.max(1, ...lines.map((line) => line.length)) * Math.max(height, 1) * .62;
	const blockHeight = Math.max(1, lines.length) * Math.max(height, 1) * 1.22;
	addCadPointToBounds(bounds, anchor);
	addCadPointToBounds(bounds, {
		x: anchor.x + width,
		y: anchor.y - blockHeight
	});
};
var getCadEntityAnchor = (entity) => {
	var _a;
	for (const key of [
		"startPoint",
		"insertionPoint",
		"center",
		"point",
		"location"
	]) {
		const point = entity[key];
		if (isCadPoint(point)) return point;
	}
	const vertices = entity.vertices || entity.points;
	if (Array.isArray(vertices) && isCadPoint(vertices[0])) return vertices[0];
	const command = (_a = entity.commands) === null || _a === void 0 ? void 0 : _a.find((item) => item.points.length > 0);
	return command === null || command === void 0 ? void 0 : command.points[0];
};
var getCadEntityLocalBounds = (entity) => {
	var _a, _b, _c, _d, _e;
	const bounds = createEmptyCadBounds();
	const type = String((_a = entity.type) !== null && _a !== void 0 ? _a : "").toUpperCase();
	const kind = entity.kind || ot(type);
	if (kind === "viewport") return null;
	if (kind === "line") {
		addCadPointToBounds(bounds, entity.startPoint);
		addCadPointToBounds(bounds, entity.endPoint);
	} else if (kind === "circle" || kind === "arc") addCadCircleBounds(bounds, entity.center, entity.radius);
	else if (kind === "polyline" || kind === "solid" || kind === "spline") {
		addCadPointListToBounds(bounds, entity.vertices);
		addCadPointListToBounds(bounds, entity.points);
		addCadPointListToBounds(bounds, entity.controlPoints);
		addCadPointListToBounds(bounds, entity.fitPoints);
	} else if (kind === "ellipse") {
		const center = entity.center;
		const major = entity.majorAxisEndPoint;
		if (isCadPoint(center) && isCadPoint(major)) {
			const majorRadius = Math.hypot(major.x, major.y);
			const minorRadius = majorRadius * Math.abs(Number((_b = entity.axisRatio) !== null && _b !== void 0 ? _b : 1));
			addCadCircleBounds(bounds, center, Math.max(majorRadius, minorRadius));
		}
	} else if (kind === "text") addCadTextBounds(bounds, entity);
	else if (kind === "path") addCadPathCommandsToBounds(bounds, entity.commands);
	else if (kind === "hatch") (_c = entity.loops) === null || _c === void 0 || _c.forEach((loop) => {
		addCadPointListToBounds(bounds, loop.vertices);
		addCadPathCommandsToBounds(bounds, loop.commands);
	});
	else if (kind === "image") {
		const point = entity.insertionPoint;
		const width = Number((_d = entity.width) !== null && _d !== void 0 ? _d : 32);
		const height = Number((_e = entity.height) !== null && _e !== void 0 ? _e : 32);
		if (isCadPoint(point) && Number.isFinite(width) && Number.isFinite(height)) {
			addCadPointToBounds(bounds, point);
			addCadPointToBounds(bounds, {
				x: point.x + width,
				y: point.y - height
			});
		}
	} else addCadPointToBounds(bounds, getCadEntityAnchor(entity));
	return isCadBoundsValid(bounds) ? bounds : null;
};
var identityCadMatrix = () => ({
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
});
var translateCadMatrix = (x, y) => ({
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: x,
	f: y
});
var scaleCadMatrix = (x, y) => ({
	a: x,
	b: 0,
	c: 0,
	d: y,
	e: 0,
	f: 0
});
var rotateCadMatrix = (rotation) => {
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);
	return {
		a: cos,
		b: sin,
		c: -sin,
		d: cos,
		e: 0,
		f: 0
	};
};
var multiplyCadMatrix = (left, right) => ({
	a: left.a * right.a + left.c * right.b,
	b: left.b * right.a + left.d * right.b,
	c: left.a * right.c + left.c * right.d,
	d: left.b * right.c + left.d * right.d,
	e: left.a * right.e + left.c * right.f + left.e,
	f: left.b * right.e + left.d * right.f + left.f
});
var transformCadPoint = (point, matrix) => ({
	x: point.x * matrix.a + point.y * matrix.c + matrix.e,
	y: point.x * matrix.b + point.y * matrix.d + matrix.f
});
var transformCadBounds = (bounds, matrix) => {
	const next = createEmptyCadBounds();
	[
		{
			x: bounds.minX,
			y: bounds.minY
		},
		{
			x: bounds.minX,
			y: bounds.maxY
		},
		{
			x: bounds.maxX,
			y: bounds.minY
		},
		{
			x: bounds.maxX,
			y: bounds.maxY
		}
	].forEach((point) => addCadPointToBounds(next, transformCadPoint(point, matrix)));
	return isCadBoundsValid(next) ? next : null;
};
var createCadInsertMatrix = (entity, blockBasePoint = {
	x: 0,
	y: 0
}) => {
	var _a, _b, _c, _d, _e;
	const insertion = entity.insertionPoint || {
		x: 0,
		y: 0
	};
	const scale = entity.scale;
	const scaleX = Number(typeof scale === "object" && scale ? (_a = scale.x) !== null && _a !== void 0 ? _a : 1 : (_b = entity.scaleX) !== null && _b !== void 0 ? _b : 1);
	const scaleY = Number(typeof scale === "object" && scale ? (_c = scale.y) !== null && _c !== void 0 ? _c : scaleX : (_d = entity.scaleY) !== null && _d !== void 0 ? _d : scaleX);
	const rotation = Number((_e = entity.rotation) !== null && _e !== void 0 ? _e : 0);
	let matrix = translateCadMatrix(isCadPoint(insertion) ? insertion.x : 0, isCadPoint(insertion) ? insertion.y : 0);
	matrix = multiplyCadMatrix(matrix, rotateCadMatrix(Number.isFinite(rotation) ? rotation : 0));
	matrix = multiplyCadMatrix(matrix, scaleCadMatrix(Number.isFinite(scaleX) ? scaleX : 1, Number.isFinite(scaleY) ? scaleY : 1));
	matrix = multiplyCadMatrix(matrix, translateCadMatrix(-blockBasePoint.x, -blockBasePoint.y));
	return matrix;
};
var findCadLayer = (document, name) => {
	if (typeof name !== "string" && typeof name !== "number") return;
	const key = String(name);
	return document.layers[key] || document.layers[key.toLocaleLowerCase()] || Object.values(document.layers).find((layer) => normalizeLayerKey(layer.name) === normalizeLayerKey(key));
};
var findCadBlock = (document, name) => {
	if (typeof name !== "string" && typeof name !== "number") return;
	const key = String(name);
	return document.blocks[key] || document.blocks[key.toLocaleLowerCase()] || Object.values(document.blocks).find((block) => normalizeLayerKey(block.name) === normalizeLayerKey(key));
};
var isCadEntityVisible = (document, entity) => {
	if (entity.isVisible === false) return false;
	const layer = findCadLayer(document, entity.layer);
	return layer ? layer.isVisible !== false && !layer.isFrozen : true;
};
var collectCadVisibleEntityBounds = (document, maxInsertDepth) => {
	const boundsList = [];
	const visit = (entity, depth, matrix) => {
		var _a, _b;
		if (!isCadEntityVisible(document, entity)) return;
		const type = String((_a = entity.type) !== null && _a !== void 0 ? _a : "").toUpperCase();
		if ((entity.kind || ot(type)) === "insert") {
			const block = findCadBlock(document, (_b = entity.blockName) !== null && _b !== void 0 ? _b : entity.name);
			if (block && depth < maxInsertDepth) {
				const nextMatrix = multiplyCadMatrix(matrix, createCadInsertMatrix(entity, block.basePoint || {
					x: 0,
					y: 0
				}));
				block.entities.forEach((child) => visit(child, depth + 1, nextMatrix));
				return;
			}
		}
		const localBounds = getCadEntityLocalBounds(entity);
		if (!localBounds) return;
		const nextBounds = transformCadBounds(localBounds, matrix);
		if (nextBounds) boundsList.push(nextBounds);
	};
	document.entities.forEach((entity) => visit(entity, 0, identityCadMatrix()));
	return boundsList;
};
var inflateCadDegenerateBounds = (bounds) => {
	const width = getCadBoundsWidth(bounds);
	const height = getCadBoundsHeight(bounds);
	if (width > CAD_BOUNDS_EPSILON && height > CAD_BOUNDS_EPSILON) return bounds;
	const centerX = (bounds.minX + bounds.maxX) / 2;
	const centerY = (bounds.minY + bounds.maxY) / 2;
	const pad = Math.max(width, height, 1) * .5;
	return {
		minX: centerX - (width > CAD_BOUNDS_EPSILON ? width / 2 : pad),
		maxX: centerX + (width > CAD_BOUNDS_EPSILON ? width / 2 : pad),
		minY: centerY - (height > CAD_BOUNDS_EPSILON ? height / 2 : pad),
		maxY: centerY + (height > CAD_BOUNDS_EPSILON ? height / 2 : pad)
	};
};
var selectCadBestFitBounds = (boundsList) => {
	let candidates = boundsList.filter(isCadBoundsValid);
	const meaningful = candidates.filter(isCadBoundsMeaningful);
	if (meaningful.length > 0) candidates = meaningful;
	const globalBounds = unionCadBounds(candidates);
	if (!globalBounds || candidates.length < 8) return globalBounds ? inflateCadDegenerateBounds(globalBounds) : null;
	const centers = candidates.map((bounds) => ({
		bounds,
		x: (bounds.minX + bounds.maxX) / 2,
		y: (bounds.minY + bounds.maxY) / 2
	}));
	const trim = Math.max(1, Math.floor(centers.length * .05));
	const sortedX = [...centers].sort((left, right) => left.x - right.x);
	const sortedY = [...centers].sort((left, right) => left.y - right.y);
	const minX = sortedX[Math.min(trim, sortedX.length - 1)].x;
	const maxX = sortedX[Math.max(sortedX.length - 1 - trim, 0)].x;
	const minY = sortedY[Math.min(trim, sortedY.length - 1)].y;
	const maxY = sortedY[Math.max(sortedY.length - 1 - trim, 0)].y;
	const trimmed = centers.filter((item) => item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY).map((item) => item.bounds);
	const minKeep = Math.max(4, Math.floor(candidates.length * .55));
	const trimmedBounds = trimmed.length >= minKeep ? unionCadBounds(trimmed) : null;
	if (!trimmedBounds) return inflateCadDegenerateBounds(globalBounds);
	const globalSpan = Math.max(getCadBoundsWidth(globalBounds), getCadBoundsHeight(globalBounds), CAD_BOUNDS_EPSILON);
	const trimmedSpan = Math.max(getCadBoundsWidth(trimmedBounds), getCadBoundsHeight(trimmedBounds), CAD_BOUNDS_EPSILON);
	const areaRatio = getCadBoundsArea(globalBounds) / getCadBoundsArea(trimmedBounds);
	if (globalSpan / trimmedSpan >= CAD_BEST_FIT_OUTLIER_RATIO || areaRatio >= CAD_BEST_FIT_OUTLIER_RATIO ** 2) return inflateCadDegenerateBounds(trimmedBounds);
	return inflateCadDegenerateBounds(globalBounds);
};
var resolveCadFitPadding = (options) => {
	const padding = Number(options.fitPadding);
	if (!Number.isFinite(padding) || padding <= 0) return CAD_DEFAULT_FIT_PADDING;
	return Math.min(1, Math.max(.2, padding));
};
var resolveCadFitBounds = (document, rendererBounds, options) => {
	var _a;
	if (!document || options.fitMode === "native") return rendererBounds && isCadBoundsValid(rendererBounds) ? inflateCadDegenerateBounds(rendererBounds) : null;
	const configuredDepth = Number((_a = options.maxInsertDepth) !== null && _a !== void 0 ? _a : 16);
	return selectCadBestFitBounds(collectCadVisibleEntityBounds(document, Number.isFinite(configuredDepth) ? Math.max(0, configuredDepth) : 16)) || (rendererBounds && isCadBoundsValid(rendererBounds) ? inflateCadDegenerateBounds(rendererBounds) : null);
};
var resolveLayerSourceNames = (document, layer) => {
	const normalized = normalizeLayerKey(layer.name);
	const names = new Set(layer.sourceNames);
	Object.entries(document.layers).forEach(([key, source]) => {
		if (normalizeLayerKey(key) === normalized || normalizeLayerKey(source.name) === normalized) {
			names.add(key);
			names.add(source.name);
		}
	});
	return Array.from(names);
};
async function renderCad(buffer, target, type = "dxf", context) {
	var _a, _b;
	const normalizedType = normalizeType(type);
	const options = ((_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.cad) || {};
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const locale = resolveFileViewerLocale(context === null || context === void 0 ? void 0 : context.options);
	const monochromeColor = resolveFileViewerCadMonochromeColor(options.monochromeColor);
	let colorMode = normalizeFileViewerCadColorMode(options.colorMode);
	let status = "loading";
	let progressMessage = t("cad.state.loadingViewer");
	let errorMessage = "";
	let loadResult = null;
	let renderStats = null;
	let viewState = null;
	let layers = [];
	let viewer = null;
	let resizeObserver = null;
	let abortController = null;
	let disposeCadPinch = null;
	let disposeNativeInteractions = null;
	let fitViewActive = true;
	let nativeZoomRatio = 1;
	let disposed = false;
	let exportingImage = false;
	const style = createStyle();
	const shell = createElement("div", "cad-shell");
	shell.dataset.viewerZoomProvider = "cad";
	const toolbar = createElement("div", "cad-toolbar");
	const tools = createElement("div", "cad-tools");
	const fitButton = createElement("button", void 0, t("cad.toolbar.fit"));
	const zoomOutButton = createElement("button", void 0, "-");
	const zoomText = createElement("span", "cad-zoom", "100%");
	const zoomInButton = createElement("button", void 0, "+");
	const colorModeButton = createElement("button", "cad-color-mode");
	colorModeButton.hidden = options.showColorModeToggle === false;
	const meta = createElement("div", "cad-meta");
	const typeMeta = createElement("span", void 0, normalizedType.toUpperCase());
	const backendMeta = createElement("span", void 0, "AUTO");
	[
		fitButton,
		zoomOutButton,
		zoomInButton,
		colorModeButton
	].forEach((button) => {
		button.type = "button";
	});
	fitButton.title = t("cad.toolbar.fit");
	zoomOutButton.title = t("cad.toolbar.zoomOut");
	zoomInButton.title = t("cad.toolbar.zoomIn");
	tools.append(fitButton, zoomOutButton, zoomText, zoomInButton, colorModeButton);
	const imageButtons = ["png", "jpeg"].map((format) => {
		const button = createElement("button", `cad-export-image cad-export-${format}`, format.toUpperCase());
		button.type = "button";
		button.title = t("cad.toolbar.exportImage", { format: format.toUpperCase() });
		button.setAttribute("aria-label", button.title);
		button.hidden = !(context === null || context === void 0 ? void 0 : context.requestSnapshotDownload) || options.showImageExport === false || !isFileViewerSnapshotDownloadPermitted(context === null || context === void 0 ? void 0 : context.options);
		button.addEventListener("click", async () => {
			var _a;
			if (disposed || status !== "ready" || exportingImage) return;
			exportingImage = true;
			exportError.hidden = true;
			syncState();
			try {
				await ((_a = context === null || context === void 0 ? void 0 : context.requestSnapshotDownload) === null || _a === void 0 ? void 0 : _a.call(context, async (watermark) => {
					const snapshot = await captureFileViewerCadCanvas(() => viewer);
					return {
						blob: await createFileViewerCanvasImageBlob(snapshot, format, watermark, snapshot.width / stage.clientWidth),
						filename: `${buildFileName().replace(/\.[^.]+$/, "") || "drawing"}.${format === "jpeg" ? "jpg" : "png"}`
					};
				}));
			} catch (error) {
				if (!disposed) {
					exportError.textContent = t("cad.error.exportFailed", { message: error instanceof Error ? error.message : String(error) });
					exportError.hidden = false;
					console.error(error);
				}
			} finally {
				exportingImage = false;
				if (!disposed) syncState();
			}
		});
		tools.append(button);
		return button;
	});
	meta.append(typeMeta, backendMeta);
	toolbar.append(tools, meta);
	const exportError = createElement("p", "cad-export-error");
	exportError.setAttribute("role", "alert");
	exportError.hidden = true;
	const body = createElement("div", "cad-body without-layers");
	const layersPanel = createElement("aside", "cad-layers");
	layersPanel.hidden = true;
	const layersHead = createElement("div", "cad-layers-head");
	const layersCount = createElement("span", void 0, t("cad.layers.count", { count: 0 }));
	layersHead.append(createElement("strong", void 0, t("cad.layers.title")), layersCount);
	const layersList = createElement("div", "cad-layers-list");
	layersPanel.append(layersHead, layersList);
	const canvasWrap = createElement("div", "cad-canvas-wrap");
	const stage = createElement("div", "cad-stage");
	const nativeHost = createElement("div", "cad-native-stage");
	stage.append(nativeHost);
	const state = createElement("div", "cad-state", progressMessage);
	canvasWrap.append(stage, state);
	const inspector = createElement("aside", "cad-inspector");
	const inspectorTitle = createElement("strong", void 0, t("cad.inspector.title"));
	const inspectorList = createElement("dl");
	const warningText = createElement("p", "cad-warning");
	warningText.hidden = true;
	inspector.append(inspectorTitle, inspectorList, warningText);
	body.append(layersPanel, canvasWrap, inspector);
	shell.append(toolbar, exportError, body);
	target.replaceChildren(style, shell);
	const buildFileName = () => {
		return (context === null || context === void 0 ? void 0 : context.filename) || `drawing.${normalizedType}`;
	};
	const buildWorkerFileName = () => {
		return normalizedType === "dwg" ? CAD_DWG_WORKER_FILENAME : buildFileName();
	};
	const restoreLoadResultSourceName = (result) => {
		result.document.sourceName = buildFileName();
		return result;
	};
	const getWarnings = () => (loadResult === null || loadResult === void 0 ? void 0 : loadResult.warnings) || (loadResult === null || loadResult === void 0 ? void 0 : loadResult.document.warnings) || [];
	const getZoomPercent = () => {
		var _a, _b, _c, _d;
		if ((_a = viewer === null || viewer === void 0 ? void 0 : viewer.isNativeRendererActive) === null || _a === void 0 ? void 0 : _a.call(viewer)) return Math.round(nativeZoomRatio * 100);
		const zoom = (_d = (_b = viewState === null || viewState === void 0 ? void 0 : viewState.zoomPercent) !== null && _b !== void 0 ? _b : (_c = viewer === null || viewer === void 0 ? void 0 : viewer.getZoomPercent) === null || _c === void 0 ? void 0 : _c.call(viewer)) !== null && _d !== void 0 ? _d : 100;
		return Number.isFinite(zoom) ? Math.round(zoom) : 100;
	};
	const getCadZoomState = () => {
		const ready = status === "ready" && !!viewer;
		const zoomPercent = getZoomPercent();
		return {
			scale: zoomPercent / 100,
			label: `${zoomPercent}%`,
			canZoomIn: ready,
			canZoomOut: ready,
			canReset: ready,
			minScale: .05,
			maxScale: 16
		};
	};
	const cadZoomEmitter = createFileViewerZoomChangeEmitter();
	const cadViewStateEmitter = createFileViewerViewStateChangeEmitter();
	const getCadViewState = () => ({
		renderer: "cad",
		scale: getCadZoomState().scale,
		zoom: getCadZoomState(),
		extra: {
			status,
			view: viewState ? { ...viewState } : null,
			backend: renderStats === null || renderStats === void 0 ? void 0 : renderStats.backend,
			colorMode,
			monochromeColor: colorMode === "monochrome" ? monochromeColor : void 0,
			layerCount: layers.length,
			visibleLayers: layers.filter((layer) => layer.isVisible !== false && !layer.isFrozen).map((layer) => layer.name)
		}
	});
	const emitCadViewStateChange = (action, source = "viewer") => {
		const state = getCadViewState();
		if (!disposed) cadViewStateEmitter.emit(createFileViewerViewStateChange(state, {
			action,
			source
		}));
		return state;
	};
	const clampNativeZoomRatio = (ratio) => {
		return Math.min(CAD_NATIVE_MAX_ZOOM_RATIO, Math.max(CAD_NATIVE_MIN_ZOOM_RATIO, ratio));
	};
	const notifyNativeZoomChange = (action) => {
		cadZoomEmitter.emit();
		syncState();
		emitCadViewStateChange(action, "user");
	};
	const bindNativeCadInteractions = () => {
		disposeNativeInteractions === null || disposeNativeInteractions === void 0 || disposeNativeInteractions();
		disposeNativeInteractions = null;
		const surface = nativeHost.querySelector(".dwfv-overlay-canvas");
		if (!surface) return;
		let notificationQueued = false;
		const queueNativeZoomChange = (action) => {
			if (notificationQueued) return;
			notificationQueued = true;
			queueMicrotask(() => {
				var _a;
				notificationQueued = false;
				if (!disposed && ((_a = viewer === null || viewer === void 0 ? void 0 : viewer.isNativeRendererActive) === null || _a === void 0 ? void 0 : _a.call(viewer))) notifyNativeZoomChange(action);
			});
		};
		const applyNativeZoomFactor = (factor, action) => {
			if (!Number.isFinite(factor) || factor <= 0) return;
			nativeZoomRatio = clampNativeZoomRatio(nativeZoomRatio * factor);
			queueNativeZoomChange(action);
		};
		const handleNativeClick = (event) => {
			const eventTarget = event.target;
			const button = eventTarget instanceof Element ? eventTarget.closest("button") : null;
			if (!button || !nativeHost.contains(button)) return;
			const label = (button.textContent || "").trim();
			if (label === "+") applyNativeZoomFactor(1.25, "zoom-in");
			else if (label === "-" || label === "−") applyNativeZoomFactor(.8, "zoom-out");
			else if (/适应|fit|reset/i.test(label)) {
				nativeZoomRatio = 1;
				queueNativeZoomChange("zoom-reset");
			}
		};
		const handleNativeWheel = (event) => {
			const rect = surface.getBoundingClientRect();
			const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * Math.max(1, rect.height) : event.deltaY;
			applyNativeZoomFactor(Math.exp(-delta * .0015), "cad-view-change");
		};
		const handleNativePageChange = (event) => {
			if (event.target instanceof HTMLSelectElement && nativeHost.contains(event.target)) {
				nativeZoomRatio = 1;
				queueNativeZoomChange("zoom-reset");
			}
		};
		const disposePinch = registerCadPinchZoom(surface, () => {
			fitViewActive = false;
		}, ({ center, factor }) => {
			const deltaY = -Math.log(factor) / .0015;
			surface.dispatchEvent(new WheelEvent("wheel", {
				bubbles: true,
				cancelable: true,
				clientX: center.x,
				clientY: center.y,
				deltaMode: WheelEvent.DOM_DELTA_PIXEL,
				deltaY
			}));
		});
		nativeHost.addEventListener("click", handleNativeClick);
		nativeHost.addEventListener("change", handleNativePageChange);
		surface.addEventListener("wheel", handleNativeWheel);
		disposeNativeInteractions = () => {
			disposePinch();
			nativeHost.removeEventListener("click", handleNativeClick);
			nativeHost.removeEventListener("change", handleNativePageChange);
			surface.removeEventListener("wheel", handleNativeWheel);
		};
	};
	const syncInspector = () => {
		const summary = loadResult === null || loadResult === void 0 ? void 0 : loadResult.summary;
		const rows = [
			[t("cad.inspector.entities"), formatNumber(summary === null || summary === void 0 ? void 0 : summary.entityCount, locale)],
			[t("cad.inspector.blocks"), formatNumber(summary === null || summary === void 0 ? void 0 : summary.blockCount, locale)],
			[t("cad.inspector.pages"), formatNumber(summary === null || summary === void 0 ? void 0 : summary.pageCount, locale)],
			[t("cad.inspector.drawn"), formatNumber(renderStats === null || renderStats === void 0 ? void 0 : renderStats.drawn, locale)]
		];
		inspectorList.replaceChildren(...rows.map(([label, value]) => {
			const row = createElement("div");
			row.append(createElement("dt", void 0, label), createElement("dd", void 0, value));
			return row;
		}));
		const warning = getWarnings()[0];
		warningText.textContent = warning || "";
		warningText.hidden = !warning;
	};
	const syncLayers = () => {
		layersCount.textContent = t("cad.layers.count", { count: layers.length });
		layersPanel.hidden = layers.length === 0;
		body.classList.toggle("without-layers", layers.length === 0);
		layersList.replaceChildren(...layers.map((layer) => {
			const button = createElement("button");
			button.type = "button";
			const layerVisible = layer.isVisible !== false && !layer.isFrozen;
			button.classList.toggle("muted", !layerVisible);
			button.title = layer.duplicateCount > 1 ? t("cad.layers.merged", {
				name: layer.name,
				count: layer.duplicateCount
			}) : layer.name;
			button.setAttribute("aria-pressed", String(layerVisible));
			const color = createElement("span", "cad-layer-color");
			if (colorMode === "monochrome") color.style.background = monochromeColor;
			else if (typeof layer.color === "string") color.style.background = layer.color;
			button.append(color, createElement("span", void 0, layer.name));
			button.addEventListener("click", () => {
				const document = resolveCadViewerSourceDocument(viewer);
				if (!document) return;
				const nextVisible = !layerVisible;
				resolveLayerSourceNames(document, layer).forEach((sourceName) => {
					const current = document.layers[sourceName] || findCadLayer(document, sourceName);
					if (current) current.isVisible = nextVisible;
				});
				loadResult = (viewer === null || viewer === void 0 ? void 0 : viewer.setDocument(document, buildFileName())) || null;
				layers = collectLayers(loadResult);
				syncUi();
				queueMicrotask(() => {
					fitViewActive = true;
					applyCadFit();
					cadZoomEmitter.emit();
					emitCadViewStateChange("layer-toggle", "user");
				});
			});
			return button;
		}));
	};
	const syncState = () => {
		imageButtons.forEach((button) => {
			button.disabled = status !== "ready" || exportingImage || !viewer || typeof viewer.captureCanvas !== "function";
		});
		zoomText.textContent = `${getZoomPercent()}%`;
		backendMeta.textContent = ((renderStats === null || renderStats === void 0 ? void 0 : renderStats.backend) || "auto").toUpperCase();
		const colorModeSupported = supportsCadViewerColorMode(viewer);
		colorModeButton.disabled = status !== "ready" || !colorModeSupported;
		colorModeButton.setAttribute("aria-pressed", String(colorMode === "monochrome"));
		colorModeButton.textContent = t(colorMode === "monochrome" ? "cad.toolbar.monochrome" : "cad.toolbar.colorSource");
		colorModeButton.title = t(colorMode === "monochrome" ? "cad.toolbar.colorSource" : "cad.toolbar.monochrome");
		state.hidden = status === "ready";
		state.classList.toggle("error", status === "error");
		if (status === "loading") state.textContent = progressMessage;
		else if (status === "error") state.textContent = errorMessage;
	};
	const syncUi = () => {
		syncState();
		syncLayers();
		syncInspector();
	};
	const updateProgress = (progress) => {
		const prefix = progress.format ? `${progress.format.toUpperCase()} ` : "";
		const percent = Number.isFinite(progress.percent) ? ` ${Math.round(progress.percent || 0)}%` : "";
		progressMessage = `${prefix}${progress.message}${percent}`;
		syncState();
	};
	const applyCadFit = () => {
		var _a, _b, _c, _d;
		if (!viewer) return false;
		if ((_a = viewer.isNativeRendererActive) === null || _a === void 0 ? void 0 : _a.call(viewer)) {
			nativeZoomRatio = 1;
			viewer.fit();
			return true;
		}
		const renderer = viewer.renderer;
		const rendererBounds = (_b = renderer.getBounds) === null || _b === void 0 ? void 0 : _b.call(renderer);
		const fitBounds = resolveCadFitBounds(viewer.getDocument(), rendererBounds, options);
		if (!fitBounds || !renderer.setViewState) {
			viewer.fit();
			return true;
		}
		const width = Math.max(1, stage.clientWidth || viewer.canvas.clientWidth || target.clientWidth);
		const height = Math.max(1, stage.clientHeight || viewer.canvas.clientHeight || target.clientHeight);
		const boundsWidth = Math.max(getCadBoundsWidth(fitBounds), CAD_BOUNDS_EPSILON);
		const boundsHeight = Math.max(getCadBoundsHeight(fitBounds), CAD_BOUNDS_EPSILON);
		const canvasOptions = options.canvasOptions || {};
		const minScale = Number((_c = canvasOptions.minScale) !== null && _c !== void 0 ? _c : CAD_BOUNDS_EPSILON);
		const maxScale = Number((_d = canvasOptions.maxScale) !== null && _d !== void 0 ? _d : 1e9);
		const unclampedScale = Math.min(width / boundsWidth, height / boundsHeight) * resolveCadFitPadding(options);
		const nextScale = Math.min(Number.isFinite(maxScale) ? maxScale : 1e9, Math.max(Number.isFinite(minScale) ? minScale : CAD_BOUNDS_EPSILON, unclampedScale));
		const nextView = {
			centerX: (fitBounds.minX + fitBounds.maxX) / 2,
			centerY: (fitBounds.minY + fitBounds.maxY) / 2,
			scale: nextScale
		};
		renderer.fitScale = nextScale;
		renderer.setViewState(nextView);
		return true;
	};
	const fitToView = (source = "user", action = "zoom-reset") => {
		fitViewActive = true;
		applyCadFit();
		cadZoomEmitter.emit();
		syncState();
		emitCadViewStateChange(action, source);
	};
	const applyCadFitRequest = (request) => {
		fitViewActive = true;
		if (!applyCadFit()) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "not-ready",
			provider: "view-state"
		};
		cadZoomEmitter.emit();
		syncState();
		const state = emitCadViewStateChange("fit", request.source);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: state.scale,
			source: request.source,
			provider: "view-state",
			state
		};
	};
	const zoomIn = () => {
		fitViewActive = false;
		viewer === null || viewer === void 0 || viewer.zoomIn();
		cadZoomEmitter.emit();
		syncState();
		emitCadViewStateChange("zoom-in", "user");
	};
	const zoomOut = () => {
		fitViewActive = false;
		viewer === null || viewer === void 0 || viewer.zoomOut();
		cadZoomEmitter.emit();
		syncState();
		emitCadViewStateChange("zoom-out", "user");
	};
	registerFileViewerZoomProvider(shell, {
		zoomIn: () => {
			zoomIn();
			return getCadZoomState();
		},
		zoomOut: () => {
			zoomOut();
			return getCadZoomState();
		},
		resetZoom: () => {
			fitToView();
			return getCadZoomState();
		},
		fit: applyCadFitRequest,
		getState: getCadZoomState,
		subscribe: cadZoomEmitter.subscribe
	});
	registerFileViewerViewStateProvider(shell, {
		getState: getCadViewState,
		async applyState(_state, applyOptions = {}) {
			const source = applyOptions.source || "api";
			const action = applyOptions.action || "restore";
			if (applyOptions.notify !== false) return emitCadViewStateChange(action, source);
			return getCadViewState();
		},
		fit: applyCadFitRequest,
		subscribe: cadViewStateEmitter.subscribe
	});
	fitButton.addEventListener("click", () => fitToView());
	zoomInButton.addEventListener("click", zoomIn);
	zoomOutButton.addEventListener("click", zoomOut);
	colorModeButton.addEventListener("click", () => {
		const previousMode = colorMode;
		colorMode = colorMode === "monochrome" ? "source" : "monochrome";
		if (!applyCadViewerColorMode(viewer, colorMode, monochromeColor, options)) {
			colorMode = previousMode;
			syncState();
			return;
		}
		syncUi();
		emitCadViewStateChange("cad-view-change", "user");
	});
	const createViewer = () => {
		var _a, _b, _c, _d, _e, _f, _g;
		const { wasmPath, workerUrl, dwfWasmUrl } = resolveFileViewerCadAssetUrls(options, getCadDocumentBaseUrl(target));
		const canvasOptions = resolveFileViewerCadCanvasOptions(options, colorMode);
		const nextViewer = new nh({
			container: stage,
			nativeHost,
			renderer: options.renderer || "auto",
			wasmPath,
			workerUrl,
			dwfWasmUrl,
			dxfEncoding: options.dxfEncoding,
			useWorker: (_a = options.useWorker) !== null && _a !== void 0 ? _a : true,
			workerTimeoutMs: (_b = options.workerTimeoutMs) !== null && _b !== void 0 ? _b : CAD_WORKER_TIMEOUT,
			preferDwgWasm: (_c = options.preferDwgWasm) !== null && _c !== void 0 ? _c : true,
			includePaperSpace: (_d = options.includePaperSpace) !== null && _d !== void 0 ? _d : true,
			maxInsertDepth: options.maxInsertDepth,
			keepRaw: (_e = options.keepRaw) !== null && _e !== void 0 ? _e : false,
			dwfPreferWebgl: (_f = options.dwfPreferWebgl) !== null && _f !== void 0 ? _f : true,
			dwfPreferWasm: (_g = options.dwfPreferWasm) !== null && _g !== void 0 ? _g : true,
			dwfBackground: options.dwfBackground,
			dwfMaxDevicePixelRatio: options.dwfMaxDevicePixelRatio,
			dwfMaxCanvasPixels: options.dwfMaxCanvasPixels,
			dwfMaxGpuCacheBytes: options.dwfMaxGpuCacheBytes,
			dwfMaxCachedScenes: options.dwfMaxCachedScenes,
			dwfLineWeightMode: options.dwfLineWeightMode,
			dwfMinStrokeCssPx: options.dwfMinStrokeCssPx,
			dwfMaxOverviewStrokeCssPx: options.dwfMaxOverviewStrokeCssPx,
			dwfMinTextCssPx: options.dwfMinTextCssPx,
			dwfMinFilledAreaCssPx: options.dwfMinFilledAreaCssPx,
			colorMode,
			monochromeColor,
			autoFit: true,
			canvasOptions,
			onLoadProgress: updateProgress,
			onRenderStats: (stats) => {
				renderStats = stats;
				syncState();
				syncInspector();
			},
			onViewChange: (event) => {
				viewState = event;
				cadZoomEmitter.emit();
				emitCadViewStateChange("cad-view-change", "user");
				syncState();
			},
			onLoad: (result) => {
				loadResult = restoreLoadResultSourceName(result);
				layers = collectLayers(result);
				syncUi();
			},
			onError: (error) => {
				errorMessage = error.message || t("cad.error.parseFailed");
				syncState();
			}
		});
		disposeCadPinch === null || disposeCadPinch === void 0 || disposeCadPinch();
		const renderer = nextViewer.renderer;
		disposeCadPinch = registerCadPinchZoom(nextViewer.canvas, () => {
			fitViewActive = false;
		}, ({ center, deltaX, deltaY, factor }) => {
			var _a, _b;
			const rect = nextViewer.canvas.getBoundingClientRect();
			(_a = renderer.panByScreenDelta) === null || _a === void 0 || _a.call(renderer, deltaX, deltaY);
			(_b = renderer.zoom) === null || _b === void 0 || _b.call(renderer, factor, {
				x: center.x - rect.left,
				y: center.y - rect.top
			});
		});
		if (options.preloadDwg !== false && normalizedType === "dwg") nextViewer.preloadDwg({
			wasmPath,
			workerUrl
		}).catch(() => {});
		return nextViewer;
	};
	const loadCad = async () => {
		var _a;
		status = "loading";
		progressMessage = t("cad.state.parsing");
		errorMessage = "";
		loadResult = null;
		renderStats = null;
		viewState = null;
		layers = [];
		fitViewActive = true;
		nativeZoomRatio = 1;
		disposeNativeInteractions === null || disposeNativeInteractions === void 0 || disposeNativeInteractions();
		disposeNativeInteractions = null;
		syncUi();
		abortController === null || abortController === void 0 || abortController.abort();
		const controller = new AbortController();
		abortController = controller;
		try {
			viewer === null || viewer === void 0 || viewer.destroy();
			viewer = createViewer();
			const cadAssets = resolveFileViewerCadAssetUrls(options, getCadDocumentBaseUrl(target));
			const result = await viewer.loadBuffer(buffer.slice(0), buildWorkerFileName(), {
				signal: controller.signal,
				transferInputBuffer: false,
				dxfEncoding: options.dxfEncoding,
				wasmPath: cadAssets.wasmPath,
				workerUrl: cadAssets.workerUrl,
				dwfWasmUrl: cadAssets.dwfWasmUrl
			});
			if (disposed || controller.signal.aborted) return;
			loadResult = restoreLoadResultSourceName(result);
			layers = collectLayers(result);
			status = "ready";
			if ((_a = viewer.isNativeRendererActive) === null || _a === void 0 ? void 0 : _a.call(viewer)) bindNativeCadInteractions();
			syncUi();
			queueMicrotask(() => {
				applyCadFit();
				cadZoomEmitter.emit();
				emitCadViewStateChange("init", "viewer");
				syncState();
			});
		} catch (reason) {
			if (disposed || controller.signal.aborted) return;
			console.error(reason);
			status = "error";
			errorMessage = reason instanceof Error ? reason.message : t("cad.error.parseFailed");
			syncUi();
		}
	};
	if (typeof ResizeObserver !== "undefined") {
		resizeObserver = new ResizeObserver(() => {
			viewer === null || viewer === void 0 || viewer.resize();
			if (fitViewActive) requestAnimationFrame(() => {
				if (!disposed && fitViewActive) {
					applyCadFit();
					cadZoomEmitter.emit();
					syncState();
				}
			});
		});
		resizeObserver.observe(stage);
	}
	syncUi();
	(_b = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _b === void 0 || _b.call(context, createFileViewerCadExportAdapter(() => viewer, context.filename, () => stage.querySelector(".dwfv-stage") || stage));
	loadCad();
	return {
		$el: shell,
		unmount() {
			var _a;
			disposed = true;
			(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
			unregisterFileViewerViewStateProvider(shell);
			unregisterFileViewerZoomProvider(shell);
			abortController === null || abortController === void 0 || abortController.abort();
			abortController = null;
			disposeCadPinch === null || disposeCadPinch === void 0 || disposeCadPinch();
			disposeCadPinch = null;
			disposeNativeInteractions === null || disposeNativeInteractions === void 0 || disposeNativeInteractions();
			disposeNativeInteractions = null;
			resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
			resizeObserver = null;
			viewer === null || viewer === void 0 || viewer.destroy();
			viewer = null;
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderCad as default };
