import { t as purify } from "./purify.es-CB-mAamt.js";
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/core/utils.js
var globalBuffer = globalThis.Buffer;
var uniqueIdCounter = 0;
function escapeHtml(text) {
	return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function uniqueId(prefix = "id") {
	uniqueIdCounter += 1;
	return `${prefix}-${uniqueIdCounter}`;
}
function alignEven(value) {
	return value % 2 === 0 ? value : value + 1;
}
function bytesToBase64(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (globalBuffer) return globalBuffer.from(view).toString("base64");
	let binary = "";
	const chunk = 32768;
	for (let i = 0; i < view.length; i += chunk) binary += String.fromCharCode(...view.subarray(i, Math.min(i + chunk, view.length)));
	return btoa(binary);
}
function dataUrlFromBytes(bytes, mime = "application/octet-stream") {
	return `data:${mime};base64,${bytesToBase64(bytes)}`;
}
function slugify(text) {
	return String(text ?? "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-/, "").replace(/-$/, "") || "item";
}
function shallowEqual(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const key of aKeys) if (a[key] !== b[key]) return false;
	return true;
}
function pushWarning(target, message, extra) {
	const warning = extra ? {
		message,
		...extra
	} : { message };
	target.push(warning);
	return warning;
}
function twipsToPx(twips, pxPerInch = 96) {
	if (twips == null || Number.isNaN(twips)) return void 0;
	return twips / 1440 * pxPerInch;
}
function cleanTextControlChars(text) {
	return String(text ?? "").replace(/\u000b/g, "\n").replace(/\u000c/g, "\n");
}
function textDecoder(label = "utf-8") {
	return new TextDecoder(label, { fatal: false });
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/core/binary.js
var utf16leDecoder = textDecoder("utf-16le");
var latin1Decoder = typeof TextDecoder !== "undefined" ? textDecoder("windows-1252") : textDecoder("latin1");
/**
* Lightweight little-endian binary reader used across the MS-DOC parser.
* The implementation intentionally returns neutral defaults for out-of-range
* reads so upper layers can stay resilient to slightly malformed documents.
*/
var BinaryReader = class {
	bytes;
	view;
	length;
	constructor(input) {
		if (input instanceof Uint8Array) this.bytes = input;
		else if (input instanceof ArrayBuffer) this.bytes = new Uint8Array(input);
		else if (ArrayBuffer.isView(input)) this.bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
		else throw new TypeError("BinaryReader expects ArrayBuffer or Uint8Array");
		this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
		this.length = this.bytes.byteLength;
	}
	ensure(offset, size = 1) {
		return offset >= 0 && offset + size <= this.length;
	}
	u8(offset) {
		return this.ensure(offset, 1) ? this.view.getUint8(offset) : 0;
	}
	i8(offset) {
		return this.ensure(offset, 1) ? this.view.getInt8(offset) : 0;
	}
	u16(offset) {
		return this.ensure(offset, 2) ? this.view.getUint16(offset, true) : 0;
	}
	i16(offset) {
		return this.ensure(offset, 2) ? this.view.getInt16(offset, true) : 0;
	}
	u32(offset) {
		return this.ensure(offset, 4) ? this.view.getUint32(offset, true) : 0;
	}
	i32(offset) {
		return this.ensure(offset, 4) ? this.view.getInt32(offset, true) : 0;
	}
	u64(offset) {
		const lo = this.u32(offset);
		return this.u32(offset + 4) * 4294967296 + lo;
	}
	slice(offset, length) {
		if (!this.ensure(offset, length)) return /* @__PURE__ */ new Uint8Array(0);
		return this.bytes.subarray(offset, offset + length);
	}
	array(offset, count, readFn) {
		const out = [];
		const width = readFn.byteWidth ?? 1;
		for (let i = 0; i < count; i += 1) out.push(readFn.call(this, offset + i * width));
		return out;
	}
	utf16le(offset, byteLength) {
		if (!this.ensure(offset, byteLength)) return "";
		return utf16leDecoder.decode(this.slice(offset, byteLength));
	}
	latin1(offset, byteLength) {
		if (!this.ensure(offset, byteLength)) return "";
		return latin1Decoder.decode(this.slice(offset, byteLength));
	}
	ascii(offset, byteLength) {
		if (!this.ensure(offset, byteLength)) return "";
		let out = "";
		const view = this.slice(offset, byteLength);
		for (let i = 0; i < view.length; i += 1) out += String.fromCharCode(view[i] ?? 0);
		return out;
	}
	utf16z(offset, byteLength) {
		const raw = this.slice(offset, byteLength);
		let end = raw.length;
		for (let i = 0; i + 1 < raw.length; i += 2) if (raw[i] === 0 && raw[i + 1] === 0) {
			end = i;
			break;
		}
		return utf16leDecoder.decode(raw.subarray(0, end));
	}
};
BinaryReader.prototype.u8.byteWidth = 1;
BinaryReader.prototype.i8.byteWidth = 1;
BinaryReader.prototype.u16.byteWidth = 2;
BinaryReader.prototype.i16.byteWidth = 2;
BinaryReader.prototype.u32.byteWidth = 4;
BinaryReader.prototype.i32.byteWidth = 4;
function toUint8Array(input) {
	if (input instanceof Uint8Array) return input;
	if (input instanceof ArrayBuffer) return new Uint8Array(input);
	if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
	throw new TypeError("Unsupported binary input");
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/core/cfb.js
var CFB_SIGNATURE = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
var FREESECT = 4294967295;
var ENDOFCHAIN = 4294967294;
var FATSECT = 4294967293;
var DIFSECT = 4294967292;
var MAX_CHAIN_SECTORS = 1 << 20;
var MINI_STREAM_CUTOFF = 4096;
function isSpecialSectorId(sid) {
	return sid === FREESECT || sid === ENDOFCHAIN || sid === FATSECT || sid === DIFSECT;
}
function readSectorAbsolute(bytes, sectorSize, sid) {
	const start = 512 + sid * sectorSize;
	const end = start + sectorSize;
	if (start < 0 || start >= bytes.length) throw new Error(`Sector ${sid} is out of bounds`);
	if (end <= bytes.length) return bytes.subarray(start, end);
	const sector = new Uint8Array(sectorSize);
	sector.set(bytes.subarray(start));
	return sector;
}
function collectChain(startSid, nextSectorFn, limit = MAX_CHAIN_SECTORS) {
	const chain = [];
	const seen = /* @__PURE__ */ new Set();
	let sid = startSid;
	let guard = 0;
	while (sid !== ENDOFCHAIN && sid !== FREESECT && sid >= 0) {
		if (seen.has(sid)) throw new Error(`Detected sector loop at ${sid}`);
		seen.add(sid);
		chain.push(sid);
		sid = nextSectorFn(sid);
		guard += 1;
		if (guard > limit) throw new Error("Sector chain exceeds safe limit");
	}
	return chain;
}
function readChainBytes(bytes, sectorSize, startSid, fat, expectedSize = null) {
	if (startSid === ENDOFCHAIN || startSid === FREESECT || startSid < 0) return /* @__PURE__ */ new Uint8Array(0);
	const chain = collectChain(startSid, (sid) => fat[sid] ?? ENDOFCHAIN);
	const out = new Uint8Array(chain.length * sectorSize);
	let offset = 0;
	for (const sid of chain) {
		out.set(readSectorAbsolute(bytes, sectorSize, sid), offset);
		offset += sectorSize;
	}
	return expectedSize == null ? out : out.subarray(0, Math.min(expectedSize, out.length));
}
function parseDirectoryTree(entries) {
	function walkSiblings(entryId, out) {
		if (entryId < 0 || entryId >= entries.length) return;
		const entry = entries[entryId];
		if (!entry) return;
		walkSiblings(entry.leftSiblingId, out);
		out.push(entryId);
		walkSiblings(entry.rightSiblingId, out);
	}
	function attachChildren(storageId) {
		const storage = entries[storageId];
		if (!storage || storage.childId < 0) return;
		const childIds = [];
		walkSiblings(storage.childId, childIds);
		storage.children = childIds;
		for (const childId of childIds) {
			const child = entries[childId];
			if (!child) continue;
			child.parentId = storageId;
			attachChildren(childId);
		}
	}
	const root = entries.find((entry) => entry.objectType === 5);
	if (!root) throw new Error("CFB root storage not found");
	attachChildren(root.id);
	return root;
}
function buildPathMap(entries) {
	const map = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		if (!entry || !entry.name) continue;
		const parts = [];
		let current = entry;
		while (current) {
			if (current.objectType !== 5) parts.push(current.name);
			current = current.parentId != null ? entries[current.parentId] ?? null : null;
		}
		const path = `/${parts.reverse().join("/")}`;
		entry.path = path === "/" ? `/${entry.name}` : path;
		map.set(entry.path, entry);
	}
	return map;
}
function normalizeName(name) {
	return name.replace(/\u0000+$/, "");
}
/**
* Parses the CFB/OLE container that wraps a legacy `.doc` file.
* The returned object exposes stream helpers so higher layers can focus on
* Word-specific structures instead of low-level sector navigation.
*/
function parseCFB(input, _options = {}) {
	const bytes = toUint8Array(input);
	const reader = new BinaryReader(bytes);
	const warnings = [];
	for (let i = 0; i < CFB_SIGNATURE.length; i += 1) if (reader.u8(i) !== CFB_SIGNATURE[i]) throw new Error("Not a Compound File Binary document");
	const majorVersion = reader.u16(26);
	const sectorShift = reader.u16(30);
	const miniSectorShift = reader.u16(32);
	const sectorSize = 1 << sectorShift;
	const miniSectorSize = 1 << miniSectorShift;
	const numDirSectors = reader.u32(40);
	const numFatSectors = reader.u32(44);
	const firstDirSector = reader.i32(48);
	const transactionSignature = reader.u32(52);
	const miniStreamCutoffSize = reader.u32(56);
	const firstMiniFatSector = reader.i32(60);
	const numMiniFatSectors = reader.u32(64);
	const firstDifatSector = reader.i32(68);
	const numDifatSectors = reader.u32(72);
	if (miniStreamCutoffSize !== MINI_STREAM_CUTOFF) pushWarning(warnings, `Unexpected mini stream cutoff size ${miniStreamCutoffSize}`);
	const headerDifat = [];
	for (let i = 0; i < 109; i += 1) {
		const sid = reader.i32(76 + i * 4);
		if (!isSpecialSectorId(sid) && sid >= 0) headerDifat.push(sid);
	}
	const difat = [...headerDifat];
	let difatSid = firstDifatSector;
	let difatCount = 0;
	while (difatSid !== ENDOFCHAIN && difatSid !== FREESECT && difatSid >= 0) {
		const sectorReader = new BinaryReader(readSectorAbsolute(bytes, sectorSize, difatSid));
		const entriesPerDifatSector = sectorSize / 4 - 1;
		for (let i = 0; i < entriesPerDifatSector; i += 1) {
			const sid = sectorReader.i32(i * 4);
			if (!isSpecialSectorId(sid) && sid >= 0) difat.push(sid);
		}
		difatSid = sectorReader.i32(sectorSize - 4);
		difatCount += 1;
		if (difatCount > numDifatSectors + 4) {
			pushWarning(warnings, "DIFAT chain exceeded declared sector count; stopping early");
			break;
		}
	}
	if (numFatSectors && difat.length < numFatSectors) pushWarning(warnings, `FAT sector count mismatch: header says ${numFatSectors}, found ${difat.length}`);
	const fat = [];
	for (const fatSid of difat) {
		const fatReader = new BinaryReader(readSectorAbsolute(bytes, sectorSize, fatSid));
		for (let i = 0; i < sectorSize / 4; i += 1) fat.push(fatReader.i32(i * 4));
	}
	const directoryBytes = readChainBytes(bytes, sectorSize, firstDirSector, fat);
	const directoryReader = new BinaryReader(directoryBytes);
	const entries = [];
	for (let offset = 0, id = 0; offset + 128 <= directoryBytes.length; offset += 128, id += 1) {
		const nameLength = directoryReader.u16(offset + 64);
		const name = normalizeName(directoryReader.utf16le(offset, Math.max(0, nameLength - 2)));
		if (!name && directoryReader.u8(offset + 66) === 0) continue;
		entries.push({
			id,
			name,
			objectType: directoryReader.u8(offset + 66),
			colorFlag: directoryReader.u8(offset + 67),
			leftSiblingId: directoryReader.i32(offset + 68),
			rightSiblingId: directoryReader.i32(offset + 72),
			childId: directoryReader.i32(offset + 76),
			clsid: directoryReader.slice(offset + 80, 16),
			stateBits: directoryReader.u32(offset + 96),
			creationTime: directoryReader.u64(offset + 100),
			modifiedTime: directoryReader.u64(offset + 108),
			startSector: directoryReader.i32(offset + 116),
			streamSize: majorVersion === 3 ? directoryReader.u32(offset + 120) : directoryReader.u64(offset + 120),
			children: [],
			parentId: null
		});
	}
	const root = parseDirectoryTree(entries);
	const pathMap = buildPathMap(entries);
	const miniFat = [];
	if (numMiniFatSectors && firstMiniFatSector >= 0) {
		const miniFatBytes = readChainBytes(bytes, sectorSize, firstMiniFatSector, fat);
		const miniFatReader = new BinaryReader(miniFatBytes);
		for (let i = 0; i + 4 <= miniFatBytes.length; i += 4) miniFat.push(miniFatReader.i32(i));
	}
	const rootStreamBytes = readChainBytes(bytes, sectorSize, root.startSector, fat, root.streamSize);
	function readMiniStream(entry) {
		if (entry.startSector < 0) return /* @__PURE__ */ new Uint8Array(0);
		const chain = collectChain(entry.startSector, (sid) => miniFat[sid] ?? ENDOFCHAIN);
		const out = new Uint8Array(chain.length * miniSectorSize);
		let offset = 0;
		for (const miniSid of chain) {
			const start = miniSid * miniSectorSize;
			const end = start + miniSectorSize;
			if (end > rootStreamBytes.length) throw new Error(`Mini sector ${miniSid} is out of bounds`);
			out.set(rootStreamBytes.subarray(start, end), offset);
			offset += miniSectorSize;
		}
		return out.subarray(0, Math.min(entry.streamSize, out.length));
	}
	function getStream(identifier) {
		const entry = typeof identifier === "string" ? pathMap.get(identifier) ?? null : identifier;
		if (!entry) return null;
		if (entry.objectType !== 2 && entry.objectType !== 5) return null;
		if (entry.objectType === 5) return rootStreamBytes;
		if (entry.streamSize < miniStreamCutoffSize && entry.startSector >= 0 && miniFat.length) return readMiniStream(entry);
		return readChainBytes(bytes, sectorSize, entry.startSector, fat, entry.streamSize);
	}
	function listChildren(path) {
		const entry = typeof path === "string" ? pathMap.get(path) ?? null : path;
		if (!entry) return [];
		return (entry.children || []).map((id) => entries[id]).filter((child) => Boolean(child));
	}
	return {
		bytes,
		majorVersion,
		sectorSize,
		miniSectorSize,
		numDirSectors,
		numFatSectors,
		firstDirSector,
		transactionSignature,
		miniStreamCutoffSize,
		warnings,
		entries,
		root,
		pathMap,
		getEntry(path) {
			return pathMap.get(path) ?? null;
		},
		getStream,
		listChildren,
		findByName(name, startPath = "/") {
			const start = startPath === "/" ? root : pathMap.get(startPath) ?? null;
			if (!start) return null;
			const stack = [start];
			while (stack.length) {
				const entry = stack.pop();
				if (!entry) continue;
				if (entry.name === name) return entry;
				for (const childId of entry.children || []) {
					const child = entries[childId];
					if (child) stack.push(child);
				}
			}
			return null;
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/clx.js
var REPLACEMENTS = {
	"": "‚",
	"": "ƒ",
	"": "„",
	"": "…",
	"": "†",
	"": "‡",
	"": "ˆ",
	"": "‰",
	"": "Š",
	"": "‹",
	"": "Œ",
	"": "‘",
	"": "’",
	"": "“",
	"": "”",
	"": "•",
	"": "–",
	"": "—",
	"": "˜",
	"": "™",
	"": "š",
	"": "›",
	"": "œ",
	"": "Ÿ"
};
function fixCompressedText(str) {
	return str.replace(/[\x82-\x8C\x91-\x9C\x9F]/g, (ch) => REPLACEMENTS[ch] || ch);
}
function decodeCompressed(bytes) {
	let text = "";
	for (let i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i] ?? 0);
	return fixCompressedText(text);
}
function decodeUnicode(bytes) {
	return new TextDecoder("utf-16le").decode(bytes);
}
function parseClx(tableBytes, fibRgFcLcb) {
	const fcClx = fibRgFcLcb.fcClx;
	const lcbClx = fibRgFcLcb.lcbClx;
	if (fcClx == null || lcbClx == null || lcbClx <= 0) throw new Error("FIB does not point to a CLX structure");
	const clxBytes = tableBytes.subarray(fcClx, fcClx + lcbClx);
	const reader = new BinaryReader(clxBytes);
	let offset = 0;
	const prcs = [];
	while (offset < clxBytes.length && reader.u8(offset) === 1) {
		const cbGrpprl = reader.u16(offset + 1);
		prcs.push({
			type: 1,
			cbGrpprl,
			bytes: reader.slice(offset + 3, cbGrpprl)
		});
		offset += 3 + cbGrpprl;
	}
	if (reader.u8(offset) !== 2) throw new Error("CLX does not contain a Pcdt marker");
	const lcb = reader.u32(offset + 1);
	return {
		prcs,
		pcdt: {
			lcb,
			pieceTable: parsePlcPcd(reader.slice(offset + 5, lcb))
		}
	};
}
function parsePlcPcd(bytes) {
	if (!bytes.length) throw new Error("Empty PlcPcd");
	const reader = new BinaryReader(bytes);
	const pcdCount = (bytes.length - 4) / 12;
	if (!Number.isInteger(pcdCount) || pcdCount < 0) throw new Error("Invalid PlcPcd size");
	const cps = [];
	for (let i = 0; i < pcdCount + 1; i += 1) cps.push(reader.u32(i * 4));
	const pieces = [];
	let offset = (pcdCount + 1) * 4;
	for (let i = 0; i < pcdCount; i += 1) {
		const descriptor = reader.u16(offset);
		const fcRaw = reader.u32(offset + 2) >>> 0;
		const prm = reader.u16(offset + 6);
		const compressed = Boolean(fcRaw & 1073741824);
		const fc = fcRaw & 1073741823;
		const cpStart = cps[i] ?? 0;
		const cpEnd = cps[i + 1] ?? cpStart;
		const actualByteStart = compressed ? Math.floor(fc / 2) : fc;
		const byteLength = compressed ? cpEnd - cpStart : (cpEnd - cpStart) * 2;
		pieces.push({
			index: i,
			descriptor,
			fNoParaLast: Boolean(descriptor & 1),
			fRaw: Boolean(descriptor & 2),
			prm,
			compressed,
			fcRaw,
			fc,
			cpStart,
			cpEnd,
			actualByteStart,
			byteLength,
			actualByteEnd: actualByteStart + byteLength
		});
		offset += 8;
	}
	return {
		cps,
		pieces
	};
}
function extractPieceText(wordBytes, piece) {
	const bytes = wordBytes.subarray(piece.actualByteStart, piece.actualByteEnd);
	return piece.compressed ? decodeCompressed(bytes) : decodeUnicode(bytes);
}
function buildPieceTextCache(wordBytes, clx) {
	return clx.pcdt.pieceTable.pieces.map((piece) => extractPieceText(wordBytes, piece));
}
function fcToCp(clx, fcRawOrActual, explicitCompressed = null) {
	const pieces = clx.pcdt.pieceTable.pieces;
	const hintedCompressed = explicitCompressed == null ? Boolean(fcRawOrActual & 1073741824) : explicitCompressed;
	const fc = explicitCompressed == null ? fcRawOrActual & 1073741823 : fcRawOrActual;
	const actual = hintedCompressed ? Math.floor(fc / 2) : fc;
	for (const piece of pieces) {
		if (actual < piece.actualByteStart) continue;
		if (actual > piece.actualByteEnd) continue;
		const delta = actual - piece.actualByteStart;
		const cp = piece.cpStart + Math.floor(delta / (piece.compressed ? 1 : 2));
		if (cp >= piece.cpStart && cp <= piece.cpEnd) return cp;
	}
	for (const piece of pieces) {
		if (fcRawOrActual < piece.actualByteStart) continue;
		if (fcRawOrActual > piece.actualByteEnd) continue;
		const delta = fcRawOrActual - piece.actualByteStart;
		const cp = piece.cpStart + Math.floor(delta / (piece.compressed ? 1 : 2));
		if (cp >= piece.cpStart && cp <= piece.cpEnd) return cp;
	}
	return null;
}
function getTextByCp(_wordBytes, clx, pieceTexts, cpStart, cpEnd) {
	if (cpEnd <= cpStart) return "";
	const out = [];
	for (let i = 0; i < clx.pcdt.pieceTable.pieces.length; i += 1) {
		const piece = clx.pcdt.pieceTable.pieces[i];
		if (piece.cpEnd <= cpStart) continue;
		if (piece.cpStart >= cpEnd) break;
		const localStart = Math.max(cpStart, piece.cpStart) - piece.cpStart;
		const localEnd = Math.min(cpEnd, piece.cpEnd) - piece.cpStart;
		out.push((pieceTexts[i] ?? "").slice(localStart, localEnd));
	}
	return out.join("");
}
function splitParagraphRanges(documentText) {
	const ranges = [];
	let start = 0;
	for (let i = 0; i < documentText.length; i += 1) {
		const ch = documentText[i];
		if (ch === "\r" || ch === "\x07") {
			ranges.push({
				cpStart: start,
				cpEnd: i + 1,
				terminator: ch
			});
			start = i + 1;
		}
	}
	if (start < documentText.length) ranges.push({
		cpStart: start,
		cpEnd: documentText.length,
		terminator: ""
	});
	return ranges;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/constants.js
var DOC_CONTROL = {
	paragraph: "\r",
	cellMark: "\x07",
	picture: "",
	textBoxPlaceholder: "\b",
	fieldStart: "",
	fieldSeparator: "",
	fieldEnd: "",
	annotationRef: "",
	hardLineBreak: "\v",
	pageBreak: "\f",
	nonBreakingHyphen: "",
	nonRequiredHyphen: ""
};
var UNDERLINE_MAP = {
	0: "none",
	1: "single",
	2: "word",
	3: "double",
	4: "dotted",
	5: "hidden",
	6: "thick",
	7: "dash",
	9: "dot-dash",
	10: "dot-dot-dash",
	11: "wave",
	16: "dotted-heavy",
	17: "dashed-heavy",
	18: "dash-long",
	19: "dash-long-heavy",
	20: "dot-dash-heavy",
	21: "dot-dot-dash-heavy",
	22: "wavy-heavy",
	23: "wavy-double"
};
var JC_MAP = {
	0: "left",
	1: "center",
	2: "right",
	3: "justify",
	4: "distributed"
};
var VERTICAL_ALIGN_MAP = {
	0: "top",
	1: "center",
	2: "bottom"
};
var HIGHLIGHT_COLORS = {
	1: "#000000",
	2: "#0000ff",
	3: "#00ffff",
	4: "#00ff00",
	5: "#ff00ff",
	6: "#ff0000",
	7: "#ffff00",
	8: "#ffffff",
	9: "#000080",
	10: "#008080",
	11: "#008000",
	12: "#800080",
	13: "#800000",
	14: "#808000",
	15: "#808080",
	16: "#c0c0c0"
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/fib.js
var FIB_FC_LCB_NAMES = [
	"StshfOrig",
	"Stshf",
	"PlcffndRef",
	"PlcffndTxt",
	"PlcfandRef",
	"PlcfandTxt",
	"PlcfSed",
	"PlcPad",
	"PlcfPhe",
	"SttbfGlsy",
	"PlcfGlsy",
	"PlcfHdd",
	"PlcfBteChpx",
	"PlcfBtePapx",
	"PlcfSea",
	"SttbfFfn",
	"PlcfFldMom",
	"PlcfFldHdr",
	"PlcfFldFtn",
	"PlcfFldAtn",
	"PlcfFldMcr",
	"SttbfBkmk",
	"PlcfBkf",
	"PlcfBkl",
	"Cmds",
	"Unused1",
	"SttbfMcr",
	"PrDrvr",
	"PrEnvPort",
	"PrEnvLand",
	"Wss",
	"Dop",
	"SttbfAssoc",
	"Clx",
	"PlcfPgdFtn",
	"AutosaveSource",
	"GrpXstAtnOwners",
	"SttbfAtnBkmk",
	"Unused2",
	"Unused3",
	"PlcSpaMom",
	"PlcSpaHdr",
	"PlcfAtnBkf",
	"PlcfAtnBkl",
	"Pms",
	"FormFldSttbs",
	"PlcfendRef",
	"PlcfendTxt",
	"PlcfFldEdn",
	"Unused4",
	"DggInfo",
	"SttbfRMark",
	"SttbfCaption",
	"SttbfAutoCaption",
	"PlcfWkb",
	"PlcfSpl",
	"PlcftxbxTxt",
	"PlcfFldTxbx",
	"PlcfHdrtxbxTxt",
	"PlcffldHdrTxbx",
	"StwUser",
	"SttbTtmbd",
	"CookieData",
	"PgdMotherOldOld",
	"BkdMotherOldOld",
	"PgdFtnOldOld",
	"BkdFtnOldOld",
	"PgdEdnOldOld",
	"BkdEdnOldOld",
	"SttbfIntlFld",
	"RouteSlip",
	"SttbSavedBy",
	"SttbFnm",
	"PlfLst",
	"PlfLfo",
	"PlcfTxbxBkd",
	"PlcfTxbxHdrBkd",
	"DocUndoWord9",
	"RgbUse",
	"Usp",
	"Uskf",
	"PlcupcRgbUse",
	"PlcupcUsp",
	"SttbGlsyStyle",
	"Plgosl",
	"Plcocx",
	"PlcfBteLvc",
	"dwLowDateTime",
	"dwHighDateTime",
	"PlcfLvcPre10",
	"PlcfAsumy",
	"PlcfGram",
	"SttbListNames",
	"SttbfUssr"
];
function parseFib(wordBytes) {
	const reader = new BinaryReader(wordBytes);
	const base = parseFibBase(reader);
	let offset = 32;
	const csw = reader.u16(offset);
	offset += 2;
	const fibRgWBytes = reader.slice(offset, csw * 2);
	offset += csw * 2;
	const cslw = reader.u16(offset);
	offset += 2;
	const fibRgLwBytes = reader.slice(offset, cslw * 4);
	offset += cslw * 4;
	const cbRgFcLcb = reader.u16(offset);
	offset += 2;
	const fibRgFcLcbBytes = reader.slice(offset, cbRgFcLcb * 8);
	offset += cbRgFcLcb * 8;
	const cswNew = reader.ensure(offset, 2) ? reader.u16(offset) : 0;
	if (reader.ensure(offset, 2)) offset += 2;
	const fibRgCswNewBytes = cswNew ? reader.slice(offset, cswNew * 2) : /* @__PURE__ */ new Uint8Array(0);
	const fibRgLw = parseFibRgLw(fibRgLwBytes);
	const fibRgFcLcb = parseFibRgFcLcb(fibRgFcLcbBytes, cbRgFcLcb);
	return {
		base,
		csw,
		cslw,
		cbRgFcLcb,
		cswNew,
		nFibNew: cswNew ? new BinaryReader(fibRgCswNewBytes).u16(0) : 0,
		fibRgWBytes,
		fibRgLwBytes,
		fibRgFcLcbBytes,
		fibRgCswNewBytes,
		fibRgLw,
		fibRgFcLcb
	};
}
function parseFibBase(reader) {
	const wIdent = reader.u16(0);
	const nFib = reader.u16(2);
	const lid = reader.u16(6);
	const pnNext = reader.u16(8);
	const flags = reader.u16(10);
	const envFlags = reader.u16(18);
	return {
		wIdent,
		nFib,
		lid,
		pnNext,
		flags,
		envFlags,
		fDot: Boolean(flags & 1),
		fGlsy: Boolean(flags & 2),
		fComplex: Boolean(flags & 4),
		fHasPic: Boolean(flags & 8),
		cQuickSaves: flags >> 4 & 15,
		fEncrypted: Boolean(flags & 256),
		fWhichTblStm: flags & 512 ? 1 : 0,
		fReadOnlyRecommended: Boolean(flags & 1024),
		fWriteReservation: Boolean(flags & 2048),
		fExtChar: Boolean(flags & 4096),
		fLoadOverride: Boolean(flags & 8192),
		fFarEast: Boolean(flags & 16384),
		fObfuscated: Boolean(flags & 32768),
		nFibBack: reader.u16(12),
		lKey: reader.u32(14),
		envr: reader.u8(18),
		fMac: Boolean(envFlags & 1),
		fEmptySpecial: Boolean(envFlags & 2),
		fLoadOverridePage: Boolean(envFlags & 4)
	};
}
function parseFibRgLw(bytes) {
	const reader = new BinaryReader(bytes);
	const dwords = [];
	for (let i = 0; i + 4 <= bytes.length; i += 4) dwords.push(reader.i32(i));
	return {
		raw: dwords,
		cbMac: dwords[0] ?? 0,
		ccpText: dwords[3] ?? 0,
		ccpFtn: dwords[4] ?? 0,
		ccpHdd: dwords[5] ?? 0,
		ccpMcr: dwords[6] ?? 0,
		ccpAtn: dwords[7] ?? 0,
		ccpEdn: dwords[8] ?? 0,
		ccpTxbx: dwords[9] ?? 0,
		ccpHdrTxbx: dwords[10] ?? 0
	};
}
function parseFibRgFcLcb(bytes, count) {
	const reader = new BinaryReader(bytes);
	const fields = { _pairs: [] };
	const pairs = [];
	for (let i = 0; i < count && i * 8 + 8 <= bytes.length; i += 1) {
		const fc = reader.u32(i * 8);
		const lcb = reader.u32(i * 8 + 4);
		const name = FIB_FC_LCB_NAMES[i] || `Field${i}`;
		fields[`fc${name}`] = fc;
		fields[`lcb${name}`] = lcb;
		pairs.push({
			name,
			fc,
			lcb,
			index: i
		});
	}
	fields._pairs = pairs;
	return fields;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/sprm.js
var SprmCodes = {
	sprmCFRMarkDel: 2048,
	sprmCFRMark: 2049,
	sprmCFFldVanish: 2050,
	sprmCPicLocation: 27139,
	sprmCIbstRMark: 18436,
	sprmCDttmRMark: 26629,
	sprmCFData: 2054,
	sprmCFOle2: 2058,
	sprmCHighlight: 10764,
	sprmCIstd: 18992,
	sprmCPlain: 10803,
	sprmCFBold: 2101,
	sprmCFItalic: 2102,
	sprmCFStrike: 2103,
	sprmCFOutline: 2104,
	sprmCFShadow: 2105,
	sprmCFSmallCaps: 2106,
	sprmCFCaps: 2107,
	sprmCFVanish: 2108,
	sprmCKul: 10814,
	sprmCDxaSpace: 34880,
	sprmCIco: 10818,
	sprmCHps: 19011,
	sprmCHpsPos: 18501,
	sprmCSymbol: 27145,
	sprmCHpsKern: 18507,
	sprmCRgFtc0: 19023,
	sprmCRgFtc1: 19024,
	sprmCRgFtc2: 19025,
	sprmCCharScale: 18514,
	sprmCFDStrike: 10835,
	sprmCFImprint: 2132,
	sprmCFSpec: 2133,
	sprmCFObj: 2134,
	sprmCFEmboss: 2136,
	sprmCFBiDi: 2138,
	sprmCFBoldBi: 2140,
	sprmCFItalicBi: 2141,
	sprmCFtcBi: 19038,
	sprmCIcoBi: 19040,
	sprmCHpsBi: 19041,
	sprmPIstd: 17920,
	sprmPIstdPermute: 50689,
	sprmPIncLvl: 9730,
	sprmPJc80: 9219,
	sprmPFKeep: 9221,
	sprmPFKeepFollow: 9222,
	sprmPFPageBreakBefore: 9223,
	sprmPIlvl: 9738,
	sprmPIlfo: 17931,
	sprmPChgTabsPapx: 50701,
	sprmPDxaRight80: 33806,
	sprmPDxaLeft80: 33807,
	sprmPNest80: 17936,
	sprmPDxaLeft180: 33809,
	sprmPDyaLine: 25618,
	sprmPDyaBefore: 42003,
	sprmPDyaAfter: 42004,
	sprmPChgTabs: 50709,
	sprmPFInTable: 9238,
	sprmPFTtp: 9239,
	sprmPDxaAbs: 33816,
	sprmPDyaAbs: 33817,
	sprmPDxaWidth: 33818,
	sprmPPc: 9755,
	sprmPWr: 9251,
	sprmPBrcTop80: 25636,
	sprmPBrcLeft80: 25637,
	sprmPBrcBottom80: 25638,
	sprmPBrcRight80: 25639,
	sprmPBrcBetween80: 25640,
	sprmPBrcBar80: 26153,
	sprmPWHeightAbs: 17451,
	sprmPDcs: 17452,
	sprmPShd80: 17453,
	sprmPDyaFromText: 33838,
	sprmPDxaFromText: 33839,
	sprmPFLocked: 9264,
	sprmPFWidowControl: 9265,
	sprmPFBiDi: 9281,
	sprmPHugePapx: 26182,
	sprmPFAdjustRight: 9288,
	sprmPItap: 26185,
	sprmPDtap: 26186,
	sprmPFInnerTableCell: 9291,
	sprmPFInnerTtp: 9292,
	sprmPShd: 50765,
	sprmPBrcTop: 50766,
	sprmPBrcLeft: 50767,
	sprmPBrcBottom: 50768,
	sprmPBrcRight: 50769,
	sprmPBrcBetween: 50770,
	sprmPBrcBar: 50771,
	sprmPDxcRight: 17493,
	sprmPDxcLeft: 17494,
	sprmPDxcLeft1: 17495,
	sprmPDylBefore: 17496,
	sprmPDylAfter: 17497,
	sprmPFDyaBeforeAuto: 9307,
	sprmPFDyaAfterAuto: 9308,
	sprmPDxaRight: 33885,
	sprmPDxaLeft: 33886,
	sprmPNest: 18015,
	sprmPDxaLeft1: 33888,
	sprmPJc: 9313,
	sprmTJc90: 21504,
	sprmTDxaLeft: 38401,
	sprmTDxaGapHalf: 38402,
	sprmTFCantSplit90: 13315,
	sprmTTableHeader: 13316,
	sprmTTableBorders80: 54789,
	sprmTDyaRowHeight: 37895,
	sprmTDefTable: 54792,
	sprmTDefTableShd80: 54793,
	sprmTTlp: 29706,
	sprmTFBiDi: 22027,
	sprmTDefTableShd3rd: 54796,
	sprmTPc: 13837,
	sprmTDxaAbs: 37902,
	sprmTDyaAbs: 37903,
	sprmTDxaFromText: 37904,
	sprmTDyaFromText: 37905,
	sprmTDefTableShd: 54802,
	sprmTTableBorders: 54803,
	sprmTTableWidth: 62996,
	sprmTFAutofit: 13845,
	sprmTDefTableShd2nd: 54806,
	sprmTWidthBefore: 62999,
	sprmTWidthAfter: 63e3,
	sprmTSetBrc80: 54816,
	sprmTInsert: 30241,
	sprmTDelete: 22050,
	sprmTDxaCol: 30243,
	sprmTMerge: 22052,
	sprmTSplit: 22053,
	sprmTTextFlow: 30249,
	sprmTVertMerge: 54827,
	sprmTVertAlign: 54828,
	sprmTSetShd: 54829,
	sprmTSetShdOdd: 54830,
	sprmTSetBrc: 54831,
	sprmTCellPadding: 54834,
	sprmTCellSpacingDefault: 54835,
	sprmTCellPaddingDefault: 54836,
	sprmTCellWidth: 54837,
	sprmTFitText: 63030,
	sprmTFCellNoWrap: 54841,
	sprmTIstd: 22074,
	sprmTDefTableShdRaw: 54896,
	sprmTDefTableShdRaw2nd: 54897,
	sprmTDefTableShdRaw3rd: 54898
};
var VARIABLE_OPERAND_CODES = /* @__PURE__ */ new Set([
	SprmCodes.sprmPChgTabs,
	SprmCodes.sprmPChgTabsPapx,
	SprmCodes.sprmTDefTable,
	SprmCodes.sprmTTableBorders80,
	SprmCodes.sprmTTableBorders,
	SprmCodes.sprmTDefTableShd,
	SprmCodes.sprmTDefTableShd80,
	SprmCodes.sprmTDefTableShd3rd,
	SprmCodes.sprmTDefTableShd2nd,
	SprmCodes.sprmTDefTableShdRaw,
	SprmCodes.sprmTDefTableShdRaw2nd,
	SprmCodes.sprmTDefTableShdRaw3rd,
	SprmCodes.sprmTSetBrc80,
	SprmCodes.sprmTSetBrc,
	SprmCodes.sprmTSetShd,
	SprmCodes.sprmTSetShdOdd,
	SprmCodes.sprmTCellPadding,
	SprmCodes.sprmTCellSpacingDefault,
	SprmCodes.sprmTCellPaddingDefault,
	SprmCodes.sprmTCellWidth,
	SprmCodes.sprmTVertAlign,
	SprmCodes.sprmTVertMerge
]);
function getSprmGroup(sprm) {
	return sprm >> 13 & 7;
}
function u16$1(bytes, offset = 0) {
	if (offset + 2 > bytes.length) return 0;
	return (bytes[offset] ?? 0) | (bytes[offset + 1] ?? 0) << 8;
}
function i16(bytes, offset = 0) {
	const value = u16$1(bytes, offset);
	return value > 32767 ? value - 65536 : value;
}
function u32$2(bytes, offset = 0) {
	if (offset + 4 > bytes.length) return 0;
	return ((bytes[offset] ?? 0) | (bytes[offset + 1] ?? 0) << 8 | (bytes[offset + 2] ?? 0) << 16 | (bytes[offset + 3] ?? 0) << 24 >>> 0) >>> 0;
}
function parseItcFirstLim(bytes, offset = 0) {
	return {
		first: bytes[offset] ?? 0,
		lim: bytes[offset + 1] ?? 0
	};
}
function parseBrc80(bytes, offset = 0) {
	if (offset + 4 > bytes.length) return null;
	const brc = u32$2(bytes, offset) >>> 0;
	if (brc === 4294967295) return {
		raw: brc,
		nil: true
	};
	const lineWidth = brc & 255;
	const borderType = brc >> 8 & 255;
	const color = brc >> 16 & 255;
	const flags = brc >>> 24 & 255;
	return {
		raw: brc,
		lineWidth,
		borderType,
		color,
		space: flags & 31,
		shadow: Boolean(flags & 32),
		frame: Boolean(flags & 64)
	};
}
function parseBrc(bytes, offset = 0) {
	if (offset + 8 > bytes.length) return null;
	const colorRef = u32$2(bytes, offset) >>> 0;
	const packed = u32$2(bytes, offset + 4) >>> 0;
	if (packed === 4294967295) return {
		raw: packed,
		colorRef,
		nil: true
	};
	return {
		raw: packed,
		colorRef,
		lineWidth: packed & 255,
		borderType: packed >>> 8 & 255,
		space: packed >>> 16 & 31,
		shadow: Boolean(packed & 1 << 21),
		frame: Boolean(packed & 1 << 22)
	};
}
function parseTcgrf(bytes, offset = 0) {
	const value = u16$1(bytes, offset);
	return {
		raw: value,
		horzMerge: value & 3,
		textFlow: value >> 2 & 7,
		vertMerge: value >> 5 & 3,
		vertAlign: value >> 7 & 3,
		ftsWidth: value >> 9 & 7,
		fitText: Boolean(value & 4096),
		noWrap: Boolean(value & 8192),
		hideMark: Boolean(value & 16384)
	};
}
function parseTc80(bytes, offset = 0) {
	if (offset + 20 > bytes.length) return null;
	return {
		tcgrf: parseTcgrf(bytes, offset),
		wWidth: u16$1(bytes, offset + 2),
		borders: {
			top: parseBrc80(bytes, offset + 4) || {},
			left: parseBrc80(bytes, offset + 8) || {},
			bottom: parseBrc80(bytes, offset + 12) || {},
			right: parseBrc80(bytes, offset + 16) || {}
		}
	};
}
function parseShd80(bytes, offset = 0) {
	if (offset + 2 > bytes.length) return null;
	const raw = u16$1(bytes, offset);
	const foregroundColorIndex = raw & 31;
	const backgroundColorIndex = raw >>> 5 & 31;
	const pattern = raw >>> 10 & 63;
	return {
		foregroundColorIndex,
		backgroundColorIndex,
		pattern,
		auto: pattern === 0,
		nil: raw === 65535,
		legacy: true
	};
}
function parseShd(bytes, offset = 0) {
	if (offset + 10 > bytes.length) return null;
	const foregroundColorRef = u32$2(bytes, offset) >>> 0;
	const backgroundColorRef = u32$2(bytes, offset + 4) >>> 0;
	const pattern = u16$1(bytes, offset + 8);
	return {
		foregroundColorRef,
		backgroundColorRef,
		pattern,
		auto: pattern === 0,
		nil: pattern === 65535
	};
}
function parseTableBorders(bytes, legacy) {
	const borderSize = legacy ? 4 : 8;
	if (!bytes.length || bytes.length < 1 + borderSize * 6) return null;
	const parse = legacy ? parseBrc80 : parseBrc;
	const names = [
		"top",
		"left",
		"bottom",
		"right",
		"horizontalInside",
		"verticalInside"
	];
	const borders = {};
	names.forEach((name, index) => {
		const border = parse(bytes, 1 + index * borderSize);
		if (border) borders[name] = border;
	});
	return borders;
}
function parseDefaultShading(bytes, start, legacy) {
	const size = legacy ? 2 : 10;
	const count = Math.floor(Math.min(bytes[0] ?? 0, Math.max(0, bytes.length - 1)) / size);
	const values = [];
	for (let index = 0; index < count; index += 1) {
		const shading = legacy ? parseShd80(bytes, 1 + index * size) : parseShd(bytes, 1 + index * size);
		if (shading) values.push(shading);
	}
	return {
		start,
		values
	};
}
function parseTDefTableOperand(bytes) {
	if (bytes.length < 3) return null;
	const cb = u16$1(bytes, 0);
	const numberOfColumns = bytes[2] ?? 0;
	let offset = 3;
	const rgdxaCenter = [];
	for (let i = 0; i < numberOfColumns + 1 && offset + 2 <= bytes.length; i += 1) {
		rgdxaCenter.push(i16(bytes, offset));
		offset += 2;
	}
	const cells = [];
	for (let i = 0; i < numberOfColumns && offset + 20 <= bytes.length; i += 1) {
		const cell = parseTc80(bytes, offset);
		if (cell) cells.push(cell);
		offset += 20;
	}
	return {
		cb,
		numberOfColumns,
		rgdxaCenter,
		cells
	};
}
function parseRangeValueOperand(bytes) {
	if (!bytes.length) return null;
	return {
		cb: bytes[0] ?? 0,
		range: parseItcFirstLim(bytes, 1),
		value: bytes[3] ?? 0,
		extra: bytes.subarray(4)
	};
}
function parseRangeWidthOperand(bytes) {
	if (!bytes.length) return null;
	const cb = bytes[0] ?? 0;
	const width = u16$1(bytes, 4);
	return {
		cb,
		range: parseItcFirstLim(bytes, 1),
		ftsWidth: bytes[3] ?? 0,
		width,
		wWidth: width
	};
}
function parseCssaOperand(bytes) {
	if (bytes.length < 7) return null;
	const width = u16$1(bytes, 5);
	return {
		cb: bytes[0] ?? 0,
		range: parseItcFirstLim(bytes, 1),
		sides: bytes[3] ?? 0,
		ftsWidth: bytes[4] ?? 0,
		width,
		wWidth: width
	};
}
function parseRangeBrcOperand(bytes) {
	if (bytes.length < 8) return null;
	return {
		cb: bytes[0] ?? 0,
		range: parseItcFirstLim(bytes, 1),
		bordersToApply: bytes[3] ?? 0,
		border: parseBrc80(bytes, 4) || { nil: true },
		extra: bytes.subarray(8)
	};
}
function parseRangeBrcOperand97(bytes) {
	if (bytes.length < 12) return null;
	return {
		cb: bytes[0] ?? 0,
		range: parseItcFirstLim(bytes, 1),
		bordersToApply: bytes[3] ?? 0,
		border: parseBrc(bytes, 4) || { nil: true },
		extra: bytes.subarray(12)
	};
}
function parseTableShadeOperand(bytes, odd = false) {
	if (bytes.length < 13) return null;
	return {
		cb: bytes[0] ?? 0,
		range: parseItcFirstLim(bytes, 1),
		shading: parseShd(bytes, 3),
		odd
	};
}
function parseVertMergeOperand(bytes) {
	if (bytes.length < 3) return null;
	return {
		cb: bytes[0] ?? 0,
		index: bytes[1] ?? 0,
		value: bytes[2] ?? 0
	};
}
function parseFixedRangeValueOperand(bytes) {
	if (bytes.length < 3) return null;
	return {
		range: parseItcFirstLim(bytes, 0),
		value: bytes[2] ?? 0
	};
}
function parseFixedRangeWidthOperand(bytes) {
	if (bytes.length < 4) return null;
	const width = i16(bytes, 2);
	return {
		range: parseItcFirstLim(bytes, 0),
		width,
		wWidth: width
	};
}
function parseTTableWidth(bytes) {
	if (!bytes.length) return null;
	const width = u16$1(bytes, 1);
	return {
		ftsWidth: bytes[0] ?? 0,
		width,
		wWidth: width
	};
}
function parseTInsertOperand(bytes) {
	if (bytes.length < 4) return null;
	return {
		itcFirst: bytes[0] ?? 0,
		ctc: bytes[1] ?? 0,
		dxaCol: u16$1(bytes, 2)
	};
}
function getSprmOperandLength(buffer, offset, sprm) {
	const spra = sprm >> 13 & 7;
	if (offset >= buffer.length) return 0;
	if (sprm === SprmCodes.sprmTDefTable) {
		const cb = u16$1(buffer, offset);
		return cb ? cb + 1 : 0;
	}
	if (VARIABLE_OPERAND_CODES.has(sprm)) return (buffer[offset] ?? 0) + 1;
	switch (spra) {
		case 0: return 1;
		case 1: return 1;
		case 2: return 2;
		case 3: return 4;
		case 4: return 2;
		case 5: return 2;
		case 6: return (buffer[offset] ?? 0) + 1;
		case 7: return 3;
		default: return 0;
	}
}
function boolValue(bytes) {
	return Boolean(bytes[0] ?? 0);
}
function setMeta(kind, name, value, raw, bytes) {
	return {
		kind,
		name,
		value,
		raw,
		operandBytes: bytes
	};
}
function decodeSprm(sprm, operandBytes) {
	const group = getSprmGroup(sprm);
	const bytes = operandBytes;
	const raw = sprm;
	switch (sprm) {
		case SprmCodes.sprmCFRMarkDel: return setMeta("char", "revisionDeleted", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFRMark: return setMeta("char", "revisionInserted", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCPicLocation: return setMeta("char", "pictureOffset", u32$2(bytes, 0) >>> 0, raw, bytes);
		case SprmCodes.sprmCFData: return setMeta("char", "data", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFOle2: return setMeta("char", "ole2", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCIstd: return setMeta("char", "charStyleId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCPlain: return setMeta("char", "plain", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFBold: return setMeta("char", "bold", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFItalic: return setMeta("char", "italic", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFStrike: return setMeta("char", "strike", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFOutline: return setMeta("char", "outline", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFShadow: return setMeta("char", "shadow", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFSmallCaps: return setMeta("char", "smallCaps", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFCaps: return setMeta("char", "caps", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFVanish: return setMeta("char", "hidden", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCKul: return setMeta("char", "underline", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmCDxaSpace: return setMeta("char", "spacing", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmCIco:
		case SprmCodes.sprmCIcoBi: return setMeta("char", "colorIndex", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmCHighlight: {
			const index = bytes[0] ?? 0;
			return setMeta("char", "highlight", {
				index,
				color: HIGHLIGHT_COLORS[index]
			}, raw, bytes);
		}
		case SprmCodes.sprmCHps:
		case SprmCodes.sprmCHpsBi: return setMeta("char", "fontSizeHalfPoints", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCHpsPos: return setMeta("char", "positionHalfPoints", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmCSymbol: return setMeta("char", "symbol", {
			font: u16$1(bytes, 0),
			charCode: u16$1(bytes, 2)
		}, raw, bytes);
		case SprmCodes.sprmCRgFtc0: return setMeta("char", "fontFamilyId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCRgFtc1: return setMeta("char", "fontFamilyEastAsiaId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCRgFtc2: return setMeta("char", "fontFamilyOtherId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCFtcBi: return setMeta("char", "fontFamilyBiId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCCharScale: return setMeta("char", "scale", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmCFDStrike: return setMeta("char", "doubleStrike", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFImprint: return setMeta("char", "imprint", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFSpec: return setMeta("char", "special", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFObj: return setMeta("char", "object", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFEmboss: return setMeta("char", "emboss", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFBiDi: return setMeta("char", "rtl", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFBoldBi: return setMeta("char", "boldBi", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmCFItalicBi: return setMeta("char", "italicBi", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPIstd: return setMeta("para", "styleId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmPJc80:
		case SprmCodes.sprmPJc: return setMeta("para", "alignment", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmPFKeep: return setMeta("para", "keepLines", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFKeepFollow: return setMeta("para", "keepNext", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFPageBreakBefore: return setMeta("para", "pageBreakBefore", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPIlvl: return setMeta("para", "listLevel", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmPIlfo: return setMeta("para", "listId", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDxaRight80:
		case SprmCodes.sprmPDxaRight: return setMeta("para", "rightIndent", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDxaLeft80:
		case SprmCodes.sprmPDxaLeft: return setMeta("para", "leftIndent", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDxaLeft180:
		case SprmCodes.sprmPDxaLeft1: return setMeta("para", "firstLineIndent", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDyaLine: return setMeta("para", "lineSpacing", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDyaBefore: return setMeta("para", "spacingBefore", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDyaAfter: return setMeta("para", "spacingAfter", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPFInTable: return setMeta("para", "inTable", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFTtp: return setMeta("para", "tableRowEnd", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPDxaAbs: return setMeta("para", "frameLeft", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDyaAbs: return setMeta("para", "frameTop", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDxaWidth: return setMeta("para", "frameWidth", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPPc: return setMeta("para", "framePosition", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmPWr: return setMeta("para", "frameWrap", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmPBrcTop80: return setMeta("para", "borderTop", parseBrc80(bytes, 0), raw, bytes);
		case SprmCodes.sprmPBrcTop: return setMeta("para", "borderTop", parseBrc(bytes, 1), raw, bytes);
		case SprmCodes.sprmPBrcLeft80: return setMeta("para", "borderLeft", parseBrc80(bytes, 0), raw, bytes);
		case SprmCodes.sprmPBrcLeft: return setMeta("para", "borderLeft", parseBrc(bytes, 1), raw, bytes);
		case SprmCodes.sprmPBrcBottom80: return setMeta("para", "borderBottom", parseBrc80(bytes, 0), raw, bytes);
		case SprmCodes.sprmPBrcBottom: return setMeta("para", "borderBottom", parseBrc(bytes, 1), raw, bytes);
		case SprmCodes.sprmPBrcRight80: return setMeta("para", "borderRight", parseBrc80(bytes, 0), raw, bytes);
		case SprmCodes.sprmPBrcRight: return setMeta("para", "borderRight", parseBrc(bytes, 1), raw, bytes);
		case SprmCodes.sprmPBrcBetween80: return setMeta("para", "borderBetween", parseBrc80(bytes, 0), raw, bytes);
		case SprmCodes.sprmPBrcBetween: return setMeta("para", "borderBetween", parseBrc(bytes, 1), raw, bytes);
		case SprmCodes.sprmPBrcBar80: return setMeta("para", "borderBar", parseBrc80(bytes, 0), raw, bytes);
		case SprmCodes.sprmPBrcBar: return setMeta("para", "borderBar", parseBrc(bytes, 1), raw, bytes);
		case SprmCodes.sprmPWHeightAbs: return setMeta("para", "frameHeight", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPShd80:
		case SprmCodes.sprmPShd: return setMeta("para", "shading", bytes.slice(), raw, bytes);
		case SprmCodes.sprmPDyaFromText: return setMeta("para", "distanceFromTextY", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDxaFromText: return setMeta("para", "distanceFromTextX", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmPFLocked: return setMeta("para", "locked", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFWidowControl: return setMeta("para", "widowControl", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFBiDi: return setMeta("para", "rtlPara", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFAdjustRight: return setMeta("para", "adjustRight", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPItap: return setMeta("para", "itap", u32$2(bytes, 0), raw, bytes);
		case SprmCodes.sprmPDtap: return setMeta("para", "dtap", u32$2(bytes, 0), raw, bytes);
		case SprmCodes.sprmPFInnerTableCell: return setMeta("para", "innerTableCell", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFInnerTtp: return setMeta("para", "innerTableRowEnd", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFDyaBeforeAuto: return setMeta("para", "spacingBeforeAuto", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmPFDyaAfterAuto: return setMeta("para", "spacingAfterAuto", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmTJc90: return setMeta("table", "alignment", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDxaLeft: return setMeta("table", "leftIndent", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDxaGapHalf: return setMeta("table", "gapHalf", u16$1(bytes, 0), raw, bytes);
		case SprmCodes.sprmTFCantSplit90: return setMeta("table", "cantSplit", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmTTableHeader: return setMeta("table", "header", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmTDyaRowHeight: return setMeta("table", "rowHeight", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDefTable: return setMeta("table", "defTable", parseTDefTableOperand(bytes), raw, bytes);
		case SprmCodes.sprmTTableBorders80: return setMeta("table", "tableBorders", parseTableBorders(bytes, true), raw, bytes);
		case SprmCodes.sprmTTableBorders: return setMeta("table", "tableBorders", parseTableBorders(bytes, false), raw, bytes);
		case SprmCodes.sprmTDefTableShd80: return setMeta("table", "defaultShading", parseDefaultShading(bytes, 0, true), raw, bytes);
		case SprmCodes.sprmTDefTableShd:
		case SprmCodes.sprmTDefTableShdRaw: return setMeta("table", "defaultShading", parseDefaultShading(bytes, 0, false), raw, bytes);
		case SprmCodes.sprmTDefTableShd2nd:
		case SprmCodes.sprmTDefTableShdRaw2nd: return setMeta("table", "defaultShading", parseDefaultShading(bytes, 22, false), raw, bytes);
		case SprmCodes.sprmTDefTableShd3rd:
		case SprmCodes.sprmTDefTableShdRaw3rd: return setMeta("table", "defaultShading", parseDefaultShading(bytes, 44, false), raw, bytes);
		case SprmCodes.sprmTFBiDi: return setMeta("table", "rtl", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmTPc: return setMeta("table", "positionCode", bytes[0] ?? 0, raw, bytes);
		case SprmCodes.sprmTDxaAbs: return setMeta("table", "absLeft", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDyaAbs: return setMeta("table", "absTop", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDxaFromText: return setMeta("table", "distanceLeft", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDyaFromText: return setMeta("table", "distanceTop", i16(bytes, 0), raw, bytes);
		case SprmCodes.sprmTTableWidth: return setMeta("table", "tableWidth", parseTTableWidth(bytes), raw, bytes);
		case SprmCodes.sprmTFAutofit: return setMeta("table", "autoFit", boolValue(bytes), raw, bytes);
		case SprmCodes.sprmTWidthBefore: return setMeta("table", "widthBefore", parseTTableWidth(bytes), raw, bytes);
		case SprmCodes.sprmTWidthAfter: return setMeta("table", "widthAfter", parseTTableWidth(bytes), raw, bytes);
		case SprmCodes.sprmTInsert: return setMeta("table", "insertCells", parseTInsertOperand(bytes), raw, bytes);
		case SprmCodes.sprmTDelete: return setMeta("table", "deleteCells", parseItcFirstLim(bytes, 0), raw, bytes);
		case SprmCodes.sprmTDxaCol: return setMeta("table", "columnWidth", parseFixedRangeWidthOperand(bytes), raw, bytes);
		case SprmCodes.sprmTMerge: return setMeta("table", "merge", parseItcFirstLim(bytes, 0), raw, bytes);
		case SprmCodes.sprmTSplit: return setMeta("table", "split", parseItcFirstLim(bytes, 0), raw, bytes);
		case SprmCodes.sprmTTextFlow: return setMeta("table", "textFlow", {
			range: parseItcFirstLim(bytes, 0),
			value: u16$1(bytes, 2)
		}, raw, bytes);
		case SprmCodes.sprmTVertMerge: return setMeta("table", "vertMerge", parseVertMergeOperand(bytes), raw, bytes);
		case SprmCodes.sprmTVertAlign: return setMeta("table", "vertAlign", parseRangeValueOperand(bytes), raw, bytes);
		case SprmCodes.sprmTSetShd: return setMeta("table", "setShading", parseTableShadeOperand(bytes), raw, bytes);
		case SprmCodes.sprmTSetShdOdd: return setMeta("table", "setShading", parseTableShadeOperand(bytes, true), raw, bytes);
		case SprmCodes.sprmTSetBrc80: return setMeta("table", "setBorder", parseRangeBrcOperand(bytes), raw, bytes);
		case SprmCodes.sprmTSetBrc: return setMeta("table", "setBorder", parseRangeBrcOperand97(bytes), raw, bytes);
		case SprmCodes.sprmTCellPadding:
		case SprmCodes.sprmTCellPaddingDefault: return setMeta("table", "cellPadding", parseCssaOperand(bytes), raw, bytes);
		case SprmCodes.sprmTCellSpacingDefault: return setMeta("table", "cellSpacing", parseCssaOperand(bytes), raw, bytes);
		case SprmCodes.sprmTCellWidth: return setMeta("table", "cellWidth", parseRangeWidthOperand(bytes), raw, bytes);
		case SprmCodes.sprmTFitText: return setMeta("table", "fitText", parseFixedRangeValueOperand(bytes), raw, bytes);
		case SprmCodes.sprmTFCellNoWrap: return setMeta("table", "cellNoWrap", parseRangeValueOperand(bytes), raw, bytes);
		case SprmCodes.sprmTIstd: return setMeta("table", "styleId", u16$1(bytes, 0), raw, bytes);
		default: return {
			kind: group === 1 ? "para" : group === 2 ? "char" : group === 5 ? "table" : "unknown",
			name: `sprm_${sprm.toString(16)}`,
			value: bytes,
			raw: sprm,
			operandBytes: bytes
		};
	}
}
function decodeGrpprl(buffer, startOffset, endOffset) {
	const properties = [];
	let offset = startOffset;
	while (offset + 2 <= endOffset) {
		const sprm = u16$1(buffer, offset);
		offset += 2;
		const operandLength = getSprmOperandLength(buffer, offset, sprm);
		if (!operandLength || offset + operandLength > endOffset) break;
		const bytes = buffer.subarray(offset, offset + operandLength);
		offset += operandLength;
		properties.push(decodeSprm(sprm, bytes));
	}
	return properties;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/fkp.js
function u32$1(bytes, offset = 0) {
	if (offset + 4 > bytes.length) return 0;
	return ((bytes[offset] ?? 0) | (bytes[offset + 1] ?? 0) << 8 | (bytes[offset + 2] ?? 0) << 16 | (bytes[offset + 3] ?? 0) << 24 >>> 0) >>> 0;
}
function readPlcBte(tableBytes, fc, lcb) {
	if (fc == null || lcb == null || lcb <= 0) return {
		aFC: [],
		pages: []
	};
	const reader = new BinaryReader(tableBytes.subarray(fc, fc + lcb));
	const count = Math.floor((lcb - 4) / 8);
	if (count <= 0) return {
		aFC: [],
		pages: []
	};
	const aFC = [];
	for (let i = 0; i <= count; i += 1) aFC.push(reader.u32(i * 4) >>> 0);
	const pages = [];
	const pnOffset = (count + 1) * 4;
	for (let i = 0; i < count; i += 1) pages.push(reader.u32(pnOffset + i * 4) & 4194303);
	return {
		aFC,
		pages
	};
}
function readChpxFkp(wordBytes, pn) {
	const offset = pn * 512;
	const page = wordBytes.subarray(offset, offset + 512);
	if (page.length < 512) return null;
	const reader = new BinaryReader(page);
	const crun = reader.u8(511);
	if (!crun || crun > 100) return null;
	const rgfc = [];
	for (let i = 0; i <= crun; i += 1) rgfc.push(reader.u32(i * 4) >>> 0);
	const rgb = [];
	const chpxOffsets = [];
	const rgbStart = (crun + 1) * 4;
	for (let i = 0; i < crun; i += 1) {
		const b = reader.u8(rgbStart + i);
		rgb.push(b);
		chpxOffsets.push(b ? offset + b * 2 : 0);
	}
	return {
		crun,
		rgfc,
		rgb,
		chpxOffsets
	};
}
function readPapxFkp(wordBytes, pn) {
	const offset = pn * 512;
	const page = wordBytes.subarray(offset, offset + 512);
	if (page.length < 512) return null;
	const reader = new BinaryReader(page);
	const cpara = reader.u8(511);
	if (cpara > 29) return null;
	const rgfc = [];
	for (let i = 0; i <= cpara; i += 1) rgfc.push(reader.u32(i * 4) >>> 0);
	const bxStart = (cpara + 1) * 4;
	const bOffsets = [];
	const papxOffsets = [];
	for (let i = 0; i < cpara; i += 1) {
		const bOffset = reader.u8(bxStart + i * 13);
		bOffsets.push(bOffset);
		papxOffsets.push(bOffset ? offset + bOffset * 2 : 0);
	}
	return {
		cpara,
		rgfc,
		bOffsets,
		papxOffsets
	};
}
function readChpxRuns(wordBytes, tableBytes, fib, clx) {
	const fcPlcfBteChpx = fib.fibRgFcLcb.fcPlcfBteChpx;
	const lcbPlcfBteChpx = fib.fibRgFcLcb.lcbPlcfBteChpx;
	const plc = readPlcBte(tableBytes, fcPlcfBteChpx, lcbPlcfBteChpx);
	const runs = [];
	for (const pn of plc.pages) {
		const fkp = readChpxFkp(wordBytes, pn);
		if (!fkp) continue;
		for (let i = 0; i < fkp.crun; i += 1) {
			const fcStart = fkp.rgfc[i] ?? 0;
			const fcEnd = fkp.rgfc[i + 1] ?? fcStart;
			const cpStart = fcToCp(clx, fcStart);
			const cpEnd = fcToCp(clx, fcEnd);
			if (cpStart == null || cpEnd == null || cpEnd <= cpStart) continue;
			const properties = fkp.chpxOffsets[i] ? readChpxProperties(wordBytes, fkp.chpxOffsets[i]) : [];
			runs.push({
				cpStart,
				cpEnd,
				fcStart,
				fcEnd,
				properties
			});
		}
	}
	runs.sort((a, b) => a.cpStart - b.cpStart || a.cpEnd - b.cpEnd);
	return runs;
}
function readPapxRuns(wordBytes, tableBytes, fib, clx, dataBytes) {
	const fcPlcfBtePapx = fib.fibRgFcLcb.fcPlcfBtePapx;
	const lcbPlcfBtePapx = fib.fibRgFcLcb.lcbPlcfBtePapx;
	const plc = readPlcBte(tableBytes, fcPlcfBtePapx, lcbPlcfBtePapx);
	const runs = [];
	for (const pn of plc.pages) {
		const fkp = readPapxFkp(wordBytes, pn);
		if (!fkp) continue;
		for (let i = 0; i < fkp.cpara; i += 1) {
			const fcStart = fkp.rgfc[i] ?? 0;
			const fcEnd = fkp.rgfc[i + 1] ?? fcStart;
			const cpStart = fcToCp(clx, fcStart);
			const cpEnd = fcToCp(clx, fcEnd);
			if (cpStart == null || cpEnd == null || cpEnd < cpStart) continue;
			const papx = fkp.papxOffsets[i] ? readPapxProperties(wordBytes, fkp.papxOffsets[i], dataBytes) : {
				styleId: 0,
				properties: []
			};
			runs.push({
				cpStart,
				cpEnd,
				fcStart,
				fcEnd,
				styleId: papx.styleId,
				properties: papx.properties,
				rawOffset: fkp.papxOffsets[i] ?? 0
			});
		}
	}
	runs.sort((a, b) => a.cpStart - b.cpStart || a.cpEnd - b.cpEnd);
	return runs;
}
function readChpxProperties(wordBytes, offset) {
	if (offset == null || offset < 0 || offset >= wordBytes.length) return [];
	const cb = wordBytes[offset] ?? 0;
	if (!cb) return [];
	const start = offset + 1;
	return decodeGrpprl(wordBytes, start, Math.min(wordBytes.length, start + cb));
}
function readHugePapxProperties(dataBytes, offset) {
	if (offset < 0 || offset + 2 > dataBytes.length) return [];
	const cb = (dataBytes[offset] ?? 0) | (dataBytes[offset + 1] ?? 0) << 8;
	if (!cb || offset + 2 + cb > dataBytes.length) return [];
	return decodeGrpprl(dataBytes, offset + 2, offset + 2 + cb);
}
function expandHugePapxProperties(properties, dataBytes) {
	if (!dataBytes?.length) return properties;
	const expanded = [];
	for (const property of properties) {
		if (property.raw !== SprmCodes.sprmPHugePapx) {
			expanded.push(property);
			continue;
		}
		const operandBytes = property.operandBytes || (property.value instanceof Uint8Array ? property.value : null);
		if (!operandBytes || operandBytes.length < 4) {
			expanded.push(property);
			continue;
		}
		const hugeProperties = readHugePapxProperties(dataBytes, u32$1(operandBytes));
		expanded.push(...hugeProperties.length ? hugeProperties : [property]);
	}
	return expanded;
}
function readPapxProperties(wordBytes, offset, dataBytes) {
	if (offset == null || offset < 0 || offset >= wordBytes.length) return {
		styleId: 0,
		properties: []
	};
	const reader = new BinaryReader(wordBytes);
	const cb = reader.u8(offset);
	if (cb === 0 && !reader.ensure(offset + 1, 1)) return {
		styleId: 0,
		properties: []
	};
	let bodyStart;
	let bodySize;
	if (cb === 0) {
		bodySize = reader.u8(offset + 1) * 2;
		bodyStart = offset + 2;
	} else {
		bodySize = cb * 2 - 1;
		bodyStart = offset + 1;
	}
	if (bodySize < 2 || !reader.ensure(bodyStart, Math.max(2, bodySize))) return {
		styleId: 0,
		properties: []
	};
	return {
		styleId: reader.u16(bodyStart),
		properties: expandHugePapxProperties(decodeGrpprl(wordBytes, bodyStart + 2, Math.min(wordBytes.length, bodyStart + bodySize)), dataBytes)
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/fonts.js
function decodeUtf16Z(bytes, offset) {
	let end = offset;
	while (end + 1 < bytes.length) {
		if (bytes[end] === 0 && bytes[end + 1] === 0) break;
		end += 2;
	}
	return {
		value: new TextDecoder("utf-16le").decode(bytes.subarray(offset, end)),
		nextOffset: Math.min(bytes.length, end + 2)
	};
}
function parseFfn(recordBytes, index) {
	if (!recordBytes.length) return null;
	const reader = new BinaryReader(recordBytes);
	const cbFfnM1 = reader.u8(0);
	const ffid = reader.u8(1);
	const wWeight = reader.u16(2);
	const chs = reader.u8(4);
	const ixchSzAlt = reader.u8(5);
	const panose = reader.slice(6, 10);
	const fontSignature = reader.slice(16, 24);
	const namesOffset = 40;
	let name = "";
	let altName = "";
	if (recordBytes.length > namesOffset) {
		const parts = new TextDecoder("utf-16le").decode(recordBytes.subarray(namesOffset)).split("\0").filter(Boolean);
		name = parts[0] || "";
		altName = parts[1] || "";
		if (!altName && ixchSzAlt) {
			const altOffset = namesOffset + ixchSzAlt * 2;
			if (altOffset + 2 <= recordBytes.length) altName = decodeUtf16Z(recordBytes, altOffset).value;
		}
	}
	return {
		index,
		cbFfnM1,
		ffid,
		weight: wWeight,
		charset: chs,
		ixchSzAlt,
		panose,
		fontSignature,
		name,
		altName
	};
}
function parseFonts(tableBytes, fibRgFcLcb) {
	const fcSttbfFfn = fibRgFcLcb.fcSttbfFfn;
	const lcbSttbfFfn = fibRgFcLcb.lcbSttbfFfn;
	if (fcSttbfFfn == null || lcbSttbfFfn == null || lcbSttbfFfn <= 0) return {
		header: null,
		fonts: [],
		byIndex(index) {
			return index == null ? null : null;
		}
	};
	const bytes = tableBytes.subarray(fcSttbfFfn, fcSttbfFfn + lcbSttbfFfn);
	const reader = new BinaryReader(bytes);
	const cData = reader.u16(0);
	const cbExtra = reader.u16(2);
	let offset = 4;
	const fonts = [];
	for (let i = 0; i < cData && offset < bytes.length; i += 1) {
		const recordLength = reader.u8(offset) + 1;
		const font = parseFfn(bytes.subarray(offset, Math.min(offset + recordLength, bytes.length)), i);
		if (font) fonts.push(font);
		offset += recordLength + cbExtra;
	}
	return {
		header: {
			cData,
			cbExtra
		},
		fonts,
		byIndex(index) {
			if (index == null || index < 0) return null;
			return fonts[index] || null;
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/properties.js
function charPropsToState(properties) {
	const state = {
		bold: false,
		italic: false,
		strike: false,
		underline: 0,
		fontSizeHalfPoints: void 0,
		fontFamilyId: void 0,
		colorIndex: void 0,
		highlight: void 0,
		spacing: 0,
		positionHalfPoints: 0,
		scale: 100,
		hidden: false,
		smallCaps: false,
		caps: false,
		outline: false,
		shadow: false,
		emboss: false,
		imprint: false,
		rtl: false,
		pictureOffset: void 0,
		data: false,
		ole2: false,
		object: false,
		special: false,
		charStyleId: void 0
	};
	for (const prop of properties || []) switch (prop.name) {
		case "plain":
			if (prop.value) {
				state.bold = false;
				state.italic = false;
				state.strike = false;
				state.underline = 0;
				state.smallCaps = false;
				state.caps = false;
			}
			break;
		case "bold":
		case "revisionDeleted":
		case "revisionInserted":
		case "italic":
		case "strike":
		case "hidden":
		case "smallCaps":
		case "caps":
		case "outline":
		case "shadow":
		case "emboss":
		case "imprint":
		case "rtl":
		case "data":
		case "ole2":
		case "object":
		case "special":
			state[prop.name] = Boolean(prop.value);
			break;
		case "underline":
			state.underline = prop.value ?? 0;
			break;
		case "fontSizeHalfPoints":
			state.fontSizeHalfPoints = prop.value;
			break;
		case "fontFamilyId":
			state.fontFamilyId = prop.value;
			break;
		case "colorIndex":
			state.colorIndex = prop.value;
			break;
		case "highlight":
			state.highlight = prop.value;
			break;
		case "spacing":
			state.spacing = prop.value || 0;
			break;
		case "positionHalfPoints":
			state.positionHalfPoints = prop.value || 0;
			break;
		case "scale":
			state.scale = prop.value || 100;
			break;
		case "pictureOffset":
			state.pictureOffset = prop.value;
			break;
		case "charStyleId":
			state.charStyleId = prop.value;
			break;
		default: state[prop.name] = prop.value;
	}
	return state;
}
function paraPropsToState(properties) {
	const state = {
		styleId: 0,
		alignment: 0,
		spacingBefore: 0,
		spacingAfter: 0,
		lineSpacing: 0,
		lineSpacingRule: "auto",
		leftIndent: 0,
		rightIndent: 0,
		firstLineIndent: 0,
		keepLines: false,
		keepNext: false,
		pageBreakBefore: false,
		widowControl: false,
		inTable: false,
		tableRowEnd: false,
		innerTableCell: false,
		innerTableRowEnd: false,
		itap: 0,
		dtap: 0,
		listLevel: void 0,
		listId: void 0,
		rtlPara: false,
		adjustRight: false,
		frameLeft: void 0,
		frameTop: void 0,
		frameWidth: void 0,
		frameHeight: void 0,
		framePosition: void 0,
		frameWrap: void 0,
		borders: {},
		shading: void 0
	};
	for (const prop of properties || []) switch (prop.name) {
		case "styleId":
			state.styleId = prop.value || 0;
			break;
		case "alignment":
			state.alignment = prop.value ?? 0;
			break;
		case "spacingBefore":
			state.spacingBefore = prop.value || 0;
			break;
		case "spacingAfter":
			state.spacingAfter = prop.value || 0;
			break;
		case "lineSpacing": {
			state.lineSpacing = prop.value || 0;
			const bytes = prop.operandBytes;
			state.lineSpacingRule = (bytes && bytes.length >= 4 ? bytes[2] === 0 && bytes[3] === 0 : state.lineSpacing < 0) ? state.lineSpacing < 0 ? "exact" : "atLeast" : "auto";
			break;
		}
		case "leftIndent":
			state.leftIndent = prop.value || 0;
			break;
		case "rightIndent":
			state.rightIndent = prop.value || 0;
			break;
		case "firstLineIndent":
			state.firstLineIndent = prop.value || 0;
			break;
		case "keepLines":
		case "keepNext":
		case "pageBreakBefore":
		case "widowControl":
		case "inTable":
		case "tableRowEnd":
		case "innerTableCell":
		case "innerTableRowEnd":
		case "rtlPara":
		case "adjustRight":
			state[prop.name] = Boolean(prop.value);
			break;
		case "itap":
			state.itap = prop.value || 0;
			break;
		case "dtap":
			state.dtap = prop.value || 0;
			break;
		case "listLevel":
			state.listLevel = prop.value;
			break;
		case "listId":
			state.listId = prop.value;
			break;
		case "frameLeft":
			state.frameLeft = prop.value;
			break;
		case "frameTop":
			state.frameTop = prop.value;
			break;
		case "frameWidth":
			state.frameWidth = prop.value;
			break;
		case "frameHeight":
			state.frameHeight = prop.value;
			break;
		case "framePosition":
			state.framePosition = prop.value;
			break;
		case "frameWrap":
			state.frameWrap = prop.value;
			break;
		case "borderTop":
			state.borders.top = prop.value;
			break;
		case "borderLeft":
			state.borders.left = prop.value;
			break;
		case "borderBottom":
			state.borders.bottom = prop.value;
			break;
		case "borderRight":
			state.borders.right = prop.value;
			break;
		case "borderBetween":
			state.borders.between = prop.value;
			break;
		case "borderBar":
			state.borders.bar = prop.value;
			break;
		case "shading":
			state.shading = prop.value;
			break;
		default: state[prop.name] = prop.value;
	}
	return state;
}
function tablePropsToState(properties) {
	const state = {
		styleId: void 0,
		alignment: 0,
		leftIndent: 0,
		gapHalf: 0,
		cantSplit: false,
		header: false,
		rowHeight: 0,
		rtl: false,
		positionCode: void 0,
		absLeft: void 0,
		absTop: void 0,
		distanceLeft: void 0,
		distanceTop: void 0,
		tableWidth: void 0,
		autoFit: void 0,
		widthBefore: void 0,
		widthAfter: void 0,
		borders: {},
		defTable: void 0,
		operations: []
	};
	for (const prop of properties || []) switch (prop.name) {
		case "styleId":
			state.styleId = prop.value;
			break;
		case "alignment":
			state.alignment = prop.value ?? 0;
			break;
		case "leftIndent":
			state.leftIndent = prop.value || 0;
			break;
		case "gapHalf":
			state.gapHalf = prop.value || 0;
			break;
		case "cantSplit":
		case "header":
		case "rtl":
			state[prop.name] = Boolean(prop.value);
			break;
		case "rowHeight":
			state.rowHeight = prop.value || 0;
			break;
		case "positionCode":
			state.positionCode = prop.value;
			break;
		case "absLeft":
			state.absLeft = prop.value;
			break;
		case "absTop":
			state.absTop = prop.value;
			break;
		case "distanceLeft":
			state.distanceLeft = prop.value;
			break;
		case "distanceTop":
			state.distanceTop = prop.value;
			break;
		case "tableWidth":
			state.tableWidth = prop.value;
			break;
		case "autoFit":
			state.autoFit = prop.value;
			break;
		case "widthBefore":
			state.widthBefore = prop.value;
			break;
		case "widthAfter":
			state.widthAfter = prop.value;
			break;
		case "tableBorders":
			state.borders = prop.value || {};
			break;
		case "defTable":
			state.defTable = prop.value;
			break;
		default: state.operations.push(prop);
	}
	return state;
}
function getTableDepth(paraState) {
	if (!paraState?.inTable) return 0;
	return Math.max(1, paraState.itap || (paraState.dtap ? paraState.dtap : 1));
}
function cssTextAlign(value) {
	return JC_MAP[value] || "left";
}
function cssUnderline(value) {
	return UNDERLINE_MAP[value] || (value ? "single" : "none");
}
function cssVerticalAlign(value) {
	return VERTICAL_ALIGN_MAP[value] || "top";
}
function rangeApply(list, range, callback) {
	if (!range) return;
	const first = Math.max(0, range.first || 0);
	const lim = Math.max(first, range.lim || first);
	for (let i = first; i < lim && i < list.length; i += 1) callback(list[i], i);
}
function applyTableStateToCells(tableState) {
	const def = tableState?.defTable;
	const cells = (def?.cells || []).map((cell, index) => ({
		index,
		width: def?.rgdxaCenter?.[index + 1] != null && def?.rgdxaCenter?.[index] != null ? Math.max(0, def.rgdxaCenter[index + 1] - def.rgdxaCenter[index]) : cell?.wWidth,
		ftsWidth: cell?.tcgrf?.ftsWidth,
		borders: cell?.borders || {},
		merge: cell?.tcgrf?.horzMerge || 0,
		vertMerge: cell?.tcgrf?.vertMerge || 0,
		vertAlign: cell?.tcgrf?.vertAlign || 0,
		fitText: Boolean(cell?.tcgrf?.fitText),
		noWrap: Boolean(cell?.tcgrf?.noWrap),
		hideMark: Boolean(cell?.tcgrf?.hideMark),
		textFlow: cell?.tcgrf?.textFlow || 0,
		rightBoundary: def?.rgdxaCenter?.[index + 1],
		leftBoundary: def?.rgdxaCenter?.[index]
	}));
	let geometryChanged = false;
	const initialLeftBoundary = cells[0]?.leftBoundary || 0;
	for (const op of tableState.operations || []) switch (op.name) {
		case "insertCells": {
			if (def?.cells?.length) break;
			const value = op.value;
			const first = Math.min(cells.length, Math.max(0, value?.itcFirst || 0));
			const count = Math.min(63 - cells.length, Math.max(0, value?.ctc || 0));
			const width = Math.max(0, value?.dxaCol || 0);
			if (count) {
				cells.splice(first, 0, ...Array.from({ length: count }, (_, offset) => ({
					index: first + offset,
					width,
					borders: {},
					merge: 0,
					vertMerge: 0,
					vertAlign: 0,
					fitText: false,
					noWrap: false,
					hideMark: false,
					textFlow: 0
				})));
				geometryChanged = true;
			}
			break;
		}
		case "deleteCells": {
			const range = op.value;
			if (range) {
				const first = Math.max(0, range.first || 0);
				const count = Math.max(0, (range.lim || first) - first);
				if (count) {
					cells.splice(first, count);
					geometryChanged = true;
				}
			}
			break;
		}
		case "merge":
			rangeApply(cells, op.value, (cell, idx) => {
				if (idx === op.value.first) cell.merge = 2;
				else cell.merge = 1;
			});
			break;
		case "split":
			rangeApply(cells, op.value, (cell) => {
				cell.merge = 0;
			});
			break;
		case "cellWidth":
			rangeApply(cells, op.value.range, (cell) => {
				const value = op.value;
				cell.ftsWidth = value.ftsWidth;
				if ((value.ftsWidth === 2 || value.ftsWidth === 3) && value.width != null) cell.width = value.width;
			});
			break;
		case "columnWidth":
			rangeApply(cells, op.value.range, (cell) => {
				cell.width = Math.max(0, op.value.width || 0);
				geometryChanged = true;
			});
			break;
		case "vertMerge": {
			const value = op.value;
			const cell = value?.index != null ? cells[value.index] : void 0;
			if (cell) cell.vertMerge = value?.value || 0;
			break;
		}
		case "vertAlign":
			rangeApply(cells, op.value.range, (cell) => {
				cell.vertAlign = op.value.value;
			});
			break;
		case "setBorder":
			rangeApply(cells, op.value.range, (cell) => {
				const value = op.value;
				const borders = { ...cell.borders || {} };
				if (value.bordersToApply & 1) borders.top = value.border;
				if (value.bordersToApply & 2) borders.left = value.border;
				if (value.bordersToApply & 4) borders.bottom = value.border;
				if (value.bordersToApply & 8) borders.right = value.border;
				if (value.bordersToApply & 16) borders.diagonalDown = value.border;
				if (value.bordersToApply & 32) borders.diagonalUp = value.border;
				cell.borders = borders;
			});
			break;
		case "setShading":
			rangeApply(cells, op.value.range, (cell, index) => {
				const value = op.value;
				if (!value.odd || (index - value.range.first) % 2 === 0) cell.shading = value.shading;
			});
			break;
		case "cellPadding":
		case "cellSpacing": {
			const value = op.value;
			const isTwips = value?.ftsWidth === 3 || op.name === "cellSpacing" && value?.ftsWidth === 19;
			if (!value?.range || !isTwips || value.width == null) break;
			rangeApply(cells, value.range, (cell) => {
				const key = op.name === "cellPadding" ? "paddingTwips" : "spacingTwips";
				const sides = { ...cell[key] || {} };
				if ((value.sides || 0) & 1) sides.top = value.width;
				if ((value.sides || 0) & 2) sides.left = value.width;
				if ((value.sides || 0) & 4) sides.bottom = value.width;
				if ((value.sides || 0) & 8) sides.right = value.width;
				cell[key] = sides;
			});
			break;
		}
		case "defaultShading": {
			const value = op.value;
			(value?.values || []).forEach((shading, offset) => {
				const cell = cells[(value?.start || 0) + offset];
				if (cell) cell.shading = shading;
			});
			break;
		}
		case "fitText":
			rangeApply(cells, op.value.range, (cell) => {
				cell.fitText = Boolean(op.value.value);
			});
			break;
		case "cellNoWrap":
			rangeApply(cells, op.value.range, (cell) => {
				cell.noWrap = Boolean(op.value.value);
			});
			break;
		case "textFlow": rangeApply(cells, op.value.range, (cell) => {
			cell.textFlow = op.value.value;
		});
	}
	if (geometryChanged) {
		let boundary = initialLeftBoundary;
		cells.forEach((cell) => {
			const width = Math.max(0, cell.width || 0);
			cell.leftBoundary = boundary;
			boundary += width;
			cell.rightBoundary = boundary;
		});
	}
	cells.forEach((cell, index) => {
		cell.index = index;
	});
	return cells;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/html-word.js
var HTML_PREFIX_RE = /^(?:<!doctype\s+html\b|<html\b|<body\b)/i;
var HTML_BREAK_TAGS = /* @__PURE__ */ new Set(["br"]);
var HTML_PARAGRAPH_TAGS = /* @__PURE__ */ new Set([
	"div",
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"li",
	"pre",
	"blockquote",
	"tr"
]);
var HTML_BLOCK_TAGS = /* @__PURE__ */ new Set([
	"div",
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"li",
	"pre",
	"blockquote",
	"tr",
	"table"
]);
var HTML_CELL_TAGS = /* @__PURE__ */ new Set(["td", "th"]);
var HTML_SKIPPED_CONTENT_TAGS = /* @__PURE__ */ new Set([
	"script",
	"style",
	"noscript",
	"iframe",
	"object",
	"embed",
	"svg"
]);
function asciiPreview(bytes, length = 1024) {
	return Array.from(bytes.subarray(0, Math.min(length, bytes.length)), (byte) => byte === 0 ? "" : String.fromCharCode(byte)).join("");
}
function isHtmlWordDocumentStream(bytes) {
	const preview = asciiPreview(bytes).replace(/^\uFEFF/, "").trimStart();
	return HTML_PREFIX_RE.test(preview);
}
function decodeWith(bytes, label, fatal = false) {
	try {
		return new TextDecoder(label, { fatal }).decode(bytes);
	} catch {
		return null;
	}
}
function decodeHtmlWordDocument(bytes) {
	let end = bytes.length;
	while (end > 0 && bytes[end - 1] === 0) end -= 1;
	const content = bytes.subarray(0, end);
	const preview = asciiPreview(content, 4096);
	const declared = /charset\s*=\s*["']?([a-z0-9._-]+)/i.exec(preview)?.[1]?.toLowerCase();
	const declaredEncoding = declared === "gb2312" || declared === "gbk" ? "gb18030" : declared;
	if (declaredEncoding) {
		const decoded = decodeWith(content, declaredEncoding);
		if (decoded != null) return decoded;
	}
	const utf8 = decodeWith(content, "utf-8", true);
	if (utf8 != null) return utf8;
	return decodeWith(content, "gb18030") ?? decodeWith(content, "utf-8") ?? "";
}
function decodeEntities(value) {
	const named = {
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		nbsp: "\xA0",
		quot: "\""
	};
	return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi, (match, entity) => {
		if (entity[0] === "#") {
			const hexadecimal = entity[1]?.toLowerCase() === "x";
			const parsed = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
			if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1114111) try {
				return String.fromCodePoint(parsed);
			} catch {
				return match;
			}
			return match;
		}
		return named[entity.toLowerCase()] ?? match;
	});
}
function findHtmlTagEnd(value, start) {
	let quote = "";
	for (let index = start + 1; index < value.length; index += 1) {
		const character = value[index] || "";
		if (quote) {
			if (character === quote) quote = "";
			continue;
		}
		if (character === "\"" || character === "'") quote = character;
		else if (character === ">") return index;
	}
	return -1;
}
function readHtmlTag(value, start, end) {
	let cursor = start + 1;
	while (cursor < end && /\s/.test(value[cursor] || "")) cursor += 1;
	const closing = value[cursor] === "/";
	if (closing) cursor += 1;
	while (cursor < end && /\s/.test(value[cursor] || "")) cursor += 1;
	const nameStart = cursor;
	while (cursor < end && /[A-Za-z0-9]/.test(value[cursor] || "")) cursor += 1;
	return {
		closing,
		name: value.slice(nameStart, cursor).toLowerCase(),
		attributes: closing ? "" : value.slice(cursor, end),
		selfClosing: !closing && /\/\s*$/.test(value.slice(cursor, end))
	};
}
function skipHtmlElementContent(value, lowerValue, tagName, start) {
	const closingPrefix = `</${tagName}`;
	let cursor = start;
	while (cursor < value.length) {
		const closingStart = lowerValue.indexOf(closingPrefix, cursor);
		if (closingStart < 0) return value.length;
		const boundary = lowerValue[closingStart + closingPrefix.length] || "";
		if (boundary && !/[\s>]/.test(boundary)) {
			cursor = closingStart + closingPrefix.length;
			continue;
		}
		const closingEnd = findHtmlTagEnd(value, closingStart);
		return closingEnd < 0 ? value.length : closingEnd + 1;
	}
	return value.length;
}
function htmlFragmentToText(fragment) {
	const chunks = [];
	const lowerFragment = fragment.toLowerCase();
	let cursor = 0;
	while (cursor < fragment.length) {
		const tagStart = fragment.indexOf("<", cursor);
		if (tagStart < 0) {
			chunks.push(fragment.slice(cursor));
			break;
		}
		chunks.push(fragment.slice(cursor, tagStart));
		if (fragment.startsWith("<!--", tagStart)) {
			const commentEnd = fragment.indexOf("-->", tagStart + 4);
			cursor = commentEnd < 0 ? fragment.length : commentEnd + 3;
			continue;
		}
		const tagEnd = findHtmlTagEnd(fragment, tagStart);
		if (tagEnd < 0) {
			chunks.push(fragment.slice(tagStart));
			break;
		}
		const tag = readHtmlTag(fragment, tagStart, tagEnd);
		if (!tag.closing && HTML_SKIPPED_CONTENT_TAGS.has(tag.name)) {
			cursor = skipHtmlElementContent(fragment, lowerFragment, tag.name, tagEnd + 1);
			continue;
		}
		if (HTML_BREAK_TAGS.has(tag.name) || tag.closing && HTML_BLOCK_TAGS.has(tag.name)) chunks.push("\n");
		else if (HTML_CELL_TAGS.has(tag.name)) chunks.push("	");
		cursor = tagEnd + 1;
	}
	return chunks.join("").replace(/\u0000/g, "");
}
function fragmentToText(fragment) {
	return decodeEntities(htmlFragmentToText(fragment)).replace(/\r\n?/g, "\n").replace(/[\t\f\v ]+/g, " ").replace(/ *\n */g, "\n").trim();
}
function extractParagraphs(html) {
	const paragraphs = [];
	const lowerHtml = html.toLowerCase();
	let active = null;
	let cursor = 0;
	const appendParagraph = (attributes, content) => {
		const text = fragmentToText(content);
		if (text) paragraphs.push({
			text,
			attributes,
			content
		});
	};
	while (cursor < html.length) {
		const tagStart = html.indexOf("<", cursor);
		if (tagStart < 0) break;
		if (html.startsWith("<!--", tagStart)) {
			const commentEnd = html.indexOf("-->", tagStart + 4);
			cursor = commentEnd < 0 ? html.length : commentEnd + 3;
			continue;
		}
		const tagEnd = findHtmlTagEnd(html, tagStart);
		if (tagEnd < 0) break;
		const tag = readHtmlTag(html, tagStart, tagEnd);
		if (!tag.closing && HTML_SKIPPED_CONTENT_TAGS.has(tag.name)) {
			cursor = skipHtmlElementContent(html, lowerHtml, tag.name, tagEnd + 1);
			continue;
		}
		if (HTML_PARAGRAPH_TAGS.has(tag.name) && !tag.selfClosing) {
			if (!tag.closing) {
				if (!active) active = {
					attributes: tag.attributes,
					contentStart: tagEnd + 1,
					name: tag.name,
					sameNameDepth: 0
				};
				else if (active.name === tag.name) active.sameNameDepth += 1;
			} else if (active?.name === tag.name) if (active.sameNameDepth > 0) active.sameNameDepth -= 1;
			else {
				appendParagraph(active.attributes, html.slice(active.contentStart, tagStart));
				active = null;
			}
		}
		cursor = tagEnd + 1;
	}
	if (active) appendParagraph(active.attributes, html.slice(active.contentStart));
	if (paragraphs.length) return paragraphs;
	const text = fragmentToText(html);
	return text ? [{
		text,
		attributes: "",
		content: html
	}] : [];
}
function readStyle(attributes) {
	return /\bstyle\s*=\s*(["'])([\s\S]*?)\1/i.exec(attributes)?.[2] || "";
}
function createParagraph(source, index) {
	const paraState = paraPropsToState([]);
	const charState = charPropsToState([]);
	const style = readStyle(source.attributes);
	const alignment = /text-align\s*:\s*(center|right|justify)/i.exec(style)?.[1]?.toLowerCase();
	if (alignment === "center") paraState.alignment = 1;
	if (alignment === "right") paraState.alignment = 2;
	if (alignment === "justify") paraState.alignment = 3;
	const indentPoints = Number.parseFloat(/text-indent\s*:\s*([\d.]+)pt/i.exec(style)?.[1] || "");
	if (Number.isFinite(indentPoints)) paraState.firstLineIndent = Math.round(indentPoints * 20);
	const fontSizePoints = Number.parseFloat(/font-size\s*:\s*([\d.]+)pt/i.exec(style)?.[1] || "");
	if (Number.isFinite(fontSizePoints)) charState.fontSizeHalfPoints = Math.round(Math.min(96, Math.max(8, fontSizePoints)) * 2);
	if (/font-weight\s*:\s*(?:bold|[6-9]00)/i.test(style) || /<(?:b|strong)\b/i.test(source.content)) charState.bold = true;
	if (/font-style\s*:\s*italic/i.test(style) || /<(?:i|em)\b/i.test(source.content)) charState.italic = true;
	const inlines = source.text.split("\n").flatMap((line, lineIndex) => [...lineIndex ? [{ type: "lineBreak" }] : [], ...line ? [{
		type: "text",
		text: line,
		style: { ...charState }
	}] : []]);
	return {
		type: "paragraph",
		id: `html-word-paragraph-${index + 1}`,
		styleId: 0,
		styleName: "Normal",
		paraState,
		inlines,
		text: source.text
	};
}
function parseHtmlWordDocumentStream(bytes) {
	if (!isHtmlWordDocumentStream(bytes)) return null;
	const paragraphs = extractParagraphs(decodeHtmlWordDocument(bytes));
	if (!paragraphs.length) return null;
	const blocks = paragraphs.map(createParagraph);
	return {
		kind: "msdoc",
		version: 1,
		warnings: [{
			message: "Recovered an HTML document stored inside the legacy WordDocument stream.",
			code: "MSDOC_HTML_WORDDOCUMENT_RECOVERED"
		}],
		meta: {
			fib: {
				wIdent: 0,
				nFib: 0,
				fWhichTblStm: 0,
				fComplex: false,
				fEncrypted: false,
				ccpText: paragraphs.reduce((total, paragraph) => total + paragraph.text.length, 0)
			},
			counts: {
				paragraphs: blocks.length,
				blocks: blocks.length,
				assets: 0,
				styles: 0,
				fonts: 0
			}
		},
		fonts: [],
		styles: [],
		blocks,
		assets: []
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/core/inflate.js
/**
* Small RFC1950/zlib + RFC1951/DEFLATE inflater.
*
* OfficeArt stores EMF/WMF BLIPs behind OfficeArtMetafileHeader.compression=0x00
* using the zlib wrapper defined by RFC1950. Keeping this inflater dependency-free
* preserves the browser-only build while still allowing the synchronous MS-DOC
* parser to expose browser-displayable SVG assets.
*/
var InflateError = class extends Error {
	name = "InflateError";
};
var BitReader = class {
	bytes;
	byteOffset = 0;
	bitBuffer = 0;
	bitCount = 0;
	constructor(bytes) {
		this.bytes = bytes;
	}
	readBits(count) {
		if (count < 0 || count > 24) throw new InflateError("Invalid bit count");
		while (this.bitCount < count) {
			if (this.byteOffset >= this.bytes.length) throw new InflateError("Unexpected end of deflate stream");
			this.bitBuffer |= (this.bytes[this.byteOffset++] ?? 0) << this.bitCount;
			this.bitCount += 8;
		}
		const mask = count === 0 ? 0 : (1 << count) - 1;
		const value = this.bitBuffer & mask;
		this.bitBuffer >>>= count;
		this.bitCount -= count;
		return value;
	}
	readBit() {
		return this.readBits(1);
	}
	alignToByte() {
		this.bitBuffer = 0;
		this.bitCount = 0;
	}
	readByte() {
		return this.readBits(8);
	}
};
var ByteSink = class {
	buffer;
	length = 0;
	constructor(initialCapacity = 32768) {
		this.buffer = new Uint8Array(initialCapacity);
	}
	reserve(extra) {
		const required = this.length + extra;
		if (required <= this.buffer.length) return;
		let next = this.buffer.length;
		while (next < required) next *= 2;
		const grown = new Uint8Array(next);
		grown.set(this.buffer.subarray(0, this.length));
		this.buffer = grown;
	}
	push(value) {
		this.reserve(1);
		this.buffer[this.length++] = value & 255;
	}
	pushBytes(bytes) {
		this.reserve(bytes.length);
		this.buffer.set(bytes, this.length);
		this.length += bytes.length;
	}
	copyFromBack(distance, length) {
		if (distance <= 0 || distance > this.length) throw new InflateError("Invalid back-reference distance");
		this.reserve(length);
		for (let i = 0; i < length; i += 1) {
			this.buffer[this.length] = this.buffer[this.length - distance] ?? 0;
			this.length += 1;
		}
	}
	toUint8Array(expectedLength) {
		const out = this.buffer.slice(0, this.length);
		if (expectedLength != null && expectedLength >= 0 && out.length !== expectedLength) return out;
		return out;
	}
};
function buildHuffmanTable(lengths) {
	const maxBits = Math.max(0, ...lengths);
	if (maxBits === 0) throw new InflateError("Empty Huffman table");
	const blCount = new Array(maxBits + 1).fill(0);
	for (const length of lengths) {
		if (length < 0 || length > maxBits) throw new InflateError("Invalid code length");
		if (length) blCount[length] += 1;
	}
	const nextCode = new Array(maxBits + 1).fill(0);
	let code = 0;
	for (let bits = 1; bits <= maxBits; bits += 1) {
		code = code + (blCount[bits - 1] ?? 0) << 1;
		nextCode[bits] = code;
	}
	const maps = Array.from({ length: maxBits + 1 }, () => /* @__PURE__ */ new Map());
	for (let symbol = 0; symbol < lengths.length; symbol += 1) {
		const length = lengths[symbol] ?? 0;
		if (!length) continue;
		const canonical = nextCode[length] ?? 0;
		nextCode[length] = canonical + 1;
		maps[length].set(canonical, symbol);
	}
	return {
		maps,
		maxBits
	};
}
function decodeSymbol(reader, table) {
	let code = 0;
	for (let length = 1; length <= table.maxBits; length += 1) {
		code = code << 1 | reader.readBit();
		const hit = table.maps[length]?.get(code);
		if (hit != null) return hit;
	}
	throw new InflateError("Invalid Huffman code");
}
var LENGTH_BASE = [
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
	258
];
var LENGTH_EXTRA = [
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
var DISTANCE_BASE = [
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
	24577
];
var DISTANCE_EXTRA = [
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
var fixedLiteralLengthTable = null;
var fixedDistanceTable = null;
function getFixedTables() {
	if (!fixedLiteralLengthTable) {
		const lengths = new Array(288).fill(0);
		for (let i = 0; i <= 143; i += 1) lengths[i] = 8;
		for (let i = 144; i <= 255; i += 1) lengths[i] = 9;
		for (let i = 256; i <= 279; i += 1) lengths[i] = 7;
		for (let i = 280; i <= 287; i += 1) lengths[i] = 8;
		fixedLiteralLengthTable = buildHuffmanTable(lengths);
		fixedDistanceTable = buildHuffmanTable(new Array(32).fill(5));
	}
	return {
		literalLength: fixedLiteralLengthTable,
		distance: fixedDistanceTable
	};
}
var CODE_LENGTH_ORDER = [
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
function readDynamicTables(reader) {
	const hlit = reader.readBits(5) + 257;
	const hdist = reader.readBits(5) + 1;
	const hclen = reader.readBits(4) + 4;
	const codeLengthLengths = new Array(19).fill(0);
	for (let i = 0; i < hclen; i += 1) codeLengthLengths[CODE_LENGTH_ORDER[i]] = reader.readBits(3);
	const codeLengthTable = buildHuffmanTable(codeLengthLengths);
	const lengths = [];
	while (lengths.length < hlit + hdist) {
		const symbol = decodeSymbol(reader, codeLengthTable);
		if (symbol <= 15) lengths.push(symbol);
		else if (symbol === 16) {
			if (!lengths.length) throw new InflateError("Repeat code length without previous value");
			const repeat = reader.readBits(2) + 3;
			const previous = lengths[lengths.length - 1] ?? 0;
			for (let i = 0; i < repeat; i += 1) lengths.push(previous);
		} else if (symbol === 17) {
			const repeat = reader.readBits(3) + 3;
			for (let i = 0; i < repeat; i += 1) lengths.push(0);
		} else if (symbol === 18) {
			const repeat = reader.readBits(7) + 11;
			for (let i = 0; i < repeat; i += 1) lengths.push(0);
		} else throw new InflateError("Invalid code length symbol");
	}
	const literalLengths = lengths.slice(0, hlit);
	const distanceLengths = lengths.slice(hlit, hlit + hdist);
	if (!literalLengths[256]) throw new InflateError("Missing end-of-block code");
	if (!distanceLengths.some(Boolean)) distanceLengths[0] = 1;
	return {
		literalLength: buildHuffmanTable(literalLengths),
		distance: buildHuffmanTable(distanceLengths)
	};
}
function inflateHuffmanBlock(reader, sink, literalLength, distance) {
	for (;;) {
		const symbol = decodeSymbol(reader, literalLength);
		if (symbol < 256) {
			sink.push(symbol);
			continue;
		}
		if (symbol === 256) return;
		if (symbol < 257 || symbol > 285) throw new InflateError("Invalid length symbol");
		const lengthIndex = symbol - 257;
		let length = LENGTH_BASE[lengthIndex] ?? 0;
		const lengthExtra = LENGTH_EXTRA[lengthIndex] ?? 0;
		if (lengthExtra) length += reader.readBits(lengthExtra);
		const distSymbol = decodeSymbol(reader, distance);
		if (distSymbol < 0 || distSymbol >= DISTANCE_BASE.length) throw new InflateError("Invalid distance symbol");
		let dist = DISTANCE_BASE[distSymbol] ?? 0;
		const distExtra = DISTANCE_EXTRA[distSymbol] ?? 0;
		if (distExtra) dist += reader.readBits(distExtra);
		sink.copyFromBack(dist, length);
	}
}
function inflateDeflate(deflateBytes, expectedLength) {
	const reader = new BitReader(deflateBytes);
	const sink = new ByteSink(expectedLength && expectedLength > 0 ? expectedLength : void 0);
	let final = false;
	while (!final) {
		final = reader.readBit() === 1;
		const type = reader.readBits(2);
		if (type === 0) {
			reader.alignToByte();
			const len = reader.readByte() | reader.readByte() << 8;
			const nlen = reader.readByte() | reader.readByte() << 8;
			if (((len ^ 65535) & 65535) !== nlen) throw new InflateError("Invalid stored block length");
			const chunk = new Uint8Array(len);
			for (let i = 0; i < len; i += 1) chunk[i] = reader.readByte();
			sink.pushBytes(chunk);
		} else if (type === 1) {
			const fixed = getFixedTables();
			inflateHuffmanBlock(reader, sink, fixed.literalLength, fixed.distance);
		} else if (type === 2) {
			const dynamic = readDynamicTables(reader);
			inflateHuffmanBlock(reader, sink, dynamic.literalLength, dynamic.distance);
		} else throw new InflateError("Reserved deflate block type");
	}
	return sink.toUint8Array(expectedLength);
}
function adler32(bytes) {
	let a = 1;
	let b = 0;
	for (const byte of bytes) {
		a = (a + byte) % 65521;
		b = (b + a) % 65521;
	}
	return (b << 16 | a) >>> 0;
}
function inflateZlib(bytes, expectedLength) {
	if (bytes.length < 6) return null;
	const cmf = bytes[0] ?? 0;
	const flg = bytes[1] ?? 0;
	if ((cmf & 15) !== 8) return null;
	if (cmf >>> 4 > 7) return null;
	if (((cmf << 8) + flg) % 31 !== 0) return null;
	if (flg & 32) return null;
	try {
		const inflated = inflateDeflate(bytes.subarray(2, Math.max(2, bytes.length - 4)), expectedLength);
		const expectedAdler = (bytes[bytes.length - 4] ?? 0) << 24 | (bytes[bytes.length - 3] ?? 0) << 16 | (bytes[bytes.length - 2] ?? 0) << 8 | (bytes[bytes.length - 1] ?? 0);
		if (expectedAdler >>> 0) {
			if (adler32(inflated) !== expectedAdler >>> 0) return null;
		}
		return inflated;
	} catch {
		return null;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/officeart.js
var OFFICEART_CONTAINER$1 = 15;
var OFFICEART_SP_CONTAINER = 61444;
var OFFICEART_SP = 61450;
var OFFICEART_FOPT = 61451;
var OFFICEART_SECONDARY_FOPT = 61729;
var OFFICEART_TERTIARY_FOPT = 61730;
var PROP_PIB = 260;
var PROP_FILL_BLIP = 390;
var PROP_PIB_NAME = 261;
var PROP_SHAPE_NAME = 896;
var PROP_ALT_TEXT = 897;
function u16(bytes, offset) {
	if (offset + 2 > bytes.length) return 0;
	return (bytes[offset] ?? 0) | (bytes[offset + 1] ?? 0) << 8;
}
function u32(bytes, offset) {
	if (offset + 4 > bytes.length) return 0;
	return ((bytes[offset] ?? 0) | (bytes[offset + 1] ?? 0) << 8 | (bytes[offset + 2] ?? 0) << 16 | (bytes[offset + 3] ?? 0) << 24 >>> 0) >>> 0;
}
function decodeUtf16LeText(bytes) {
	if (!bytes?.length) return void 0;
	try {
		return new TextDecoder("utf-16le").decode(bytes).replace(/\0+$/g, "").trim() || void 0;
	} catch {
		return;
	}
}
function decodeAnsiText(bytes) {
	if (!bytes?.length) return void 0;
	try {
		return new TextDecoder("windows-1252").decode(bytes).replace(/\0+$/g, "").trim() || void 0;
	} catch {
		return;
	}
}
function decodeComplexText(bytes) {
	return decodeUtf16LeText(bytes) || decodeAnsiText(bytes);
}
function detectMimeFromBlipType(blipType) {
	switch (blipType) {
		case 2: return "image/emf";
		case 3: return "image/wmf";
		case 4: return "image/pict";
		case 5: return "image/jpeg";
		case 6: return "image/png";
		case 7: return "image/dib";
		case 17: return "image/tiff";
		case 18: return "image/jpeg";
		default: return null;
	}
}
function parseOfficeArtRecordHeader$1(bytes, offset) {
	if (offset < 0 || offset + 8 > bytes.length) return null;
	const reader = new BinaryReader(bytes);
	const versionAndInstance = reader.u16(offset);
	const recType = reader.u16(offset + 2);
	const recLen = reader.u32(offset + 4);
	const size = 8 + recLen;
	if (recType < 61440 || recType > 65535) return null;
	if (recLen > bytes.length || offset + size > bytes.length) return null;
	return {
		recVer: versionAndInstance & 15,
		recInstance: versionAndInstance >>> 4,
		recType,
		recLen,
		size
	};
}
function parseOfficeArtFopt(bytes, offset, propertyCount) {
	const payloadOffset = offset + 8;
	if (payloadOffset + propertyCount * 6 > bytes.length) return [];
	const properties = [];
	let propOffset = payloadOffset;
	let complexOffset = payloadOffset + propertyCount * 6;
	for (let index = 0; index < propertyCount; index += 1) {
		const opid = u16(bytes, propOffset);
		const value = u32(bytes, propOffset + 2);
		propOffset += 6;
		const propertyId = opid & 16383;
		const isBlipId = Boolean(opid >> 14 & 1);
		const isComplex = Boolean(opid >> 15 & 1);
		let complexData;
		if (isComplex) {
			if (complexOffset + value > bytes.length) break;
			complexData = bytes.subarray(complexOffset, complexOffset + value);
			complexOffset += value;
		}
		properties.push({
			propertyId,
			isBlipId,
			isComplex,
			value,
			complexData
		});
	}
	return properties;
}
function scanRecords(bytes, start, end, visitor) {
	let cursor = Math.max(0, start);
	const limit = Math.min(end, bytes.length);
	while (cursor + 8 <= limit) {
		const header = parseOfficeArtRecordHeader$1(bytes, cursor);
		if (!header || cursor + header.size > limit) {
			cursor += 1;
			continue;
		}
		if (visitor(cursor, header) === true) return true;
		if (header.recVer === OFFICEART_CONTAINER$1) {
			if (scanRecords(bytes, cursor + 8, cursor + header.size, visitor)) return true;
		}
		cursor += header.size;
	}
	return false;
}
/**
* Inline picture characters often carry a miniature OfficeArt container that
* points at the BLIP used by the picture. We only need a compact subset of the
* shape metadata so the higher-level parser can annotate extracted assets with
* source shape ids and BLIP indices.
*/
function parseInlineOfficeArtShape(bytes, startOffset = 0) {
	let result = null;
	scanRecords(bytes, startOffset, bytes.length, (offset, header) => {
		if (header.recType !== OFFICEART_SP_CONTAINER || header.recVer !== OFFICEART_CONTAINER$1) return false;
		const end = offset + header.size;
		let cursor = offset + 8;
		let shapeId = 0;
		let blipIndex;
		let name;
		let description;
		while (cursor + 8 <= end) {
			const child = parseOfficeArtRecordHeader$1(bytes, cursor);
			if (!child || cursor + child.size > end) break;
			if (child.recType === OFFICEART_SP && child.recLen >= 8) shapeId = u32(bytes, cursor + 8);
			else if (child.recType === OFFICEART_FOPT || child.recType === OFFICEART_SECONDARY_FOPT || child.recType === OFFICEART_TERTIARY_FOPT) {
				const properties = parseOfficeArtFopt(bytes, cursor, child.recInstance);
				for (const property of properties) if ((property.isBlipId || property.propertyId === PROP_PIB || property.propertyId === PROP_FILL_BLIP) && property.value > 0) blipIndex = property.value;
				else if (property.propertyId === PROP_SHAPE_NAME) name = decodeComplexText(property.complexData) || name;
				else if (property.propertyId === PROP_ALT_TEXT || property.propertyId === PROP_PIB_NAME) description = decodeComplexText(property.complexData) || description;
			}
			cursor += child.size;
		}
		if (!shapeId) return false;
		result = {
			shapeId,
			blipIndex,
			name,
			description
		};
		return true;
	});
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/vector.js
var DEFAULT_PEN = {
	color: "#000000",
	width: 1
};
var DEFAULT_BRUSH = {
	color: "#ffffff",
	none: true
};
var DEFAULT_FONT = {
	family: "sans-serif",
	size: 12
};
var IDENTITY_MATRIX = {
	m11: 1,
	m12: 0,
	m21: 0,
	m22: 1,
	dx: 0,
	dy: 0
};
var PLACEABLE_WMF_KEY = 2596720087;
var WMF_HEADER_SIZE = 18;
var WMF_RECORD = {
	META_EOF: 0,
	META_SETBKMODE: 258,
	META_SETPOLYFILLMODE: 262,
	META_SETBKCOLOR: 513,
	META_SETTEXTCOLOR: 521,
	META_SETWINDOWORG: 523,
	META_SETWINDOWEXT: 524,
	META_SETVIEWPORTORG: 525,
	META_SETVIEWPORTEXT: 526,
	META_OFFSETWINDOWORG: 527,
	META_OFFSETVIEWPORTORG: 529,
	META_LINETO: 531,
	META_MOVETO: 532,
	META_POLYGON: 804,
	META_POLYLINE: 805,
	META_TEXTOUT: 1313,
	META_POLYPOLYGON: 1336,
	META_ELLIPSE: 1048,
	META_RECTANGLE: 1051,
	META_ROUNDRECT: 1564,
	META_CREATEBRUSHINDIRECT: 764,
	META_CREATEPENINDIRECT: 762,
	META_CREATEFONTINDIRECT: 763,
	META_SELECTOBJECT: 301,
	META_DELETEOBJECT: 496
};
var EMF_RECORD = {
	EMR_HEADER: 1,
	EMR_POLYBEZIER: 2,
	EMR_POLYGON: 3,
	EMR_POLYLINE: 4,
	EMR_POLYBEZIERTO: 5,
	EMR_POLYLINETO: 6,
	EMR_POLYPOLYLINE: 7,
	EMR_POLYPOLYGON: 8,
	EMR_SETWINDOWEXTEX: 9,
	EMR_SETWINDOWORGEX: 10,
	EMR_SETVIEWPORTEXTEX: 11,
	EMR_SETVIEWPORTORGEX: 12,
	EMR_EOF: 14,
	EMR_SETBKMODE: 18,
	EMR_SETPOLYFILLMODE: 19,
	EMR_SETTEXTALIGN: 22,
	EMR_SETTEXTCOLOR: 24,
	EMR_SETBKCOLOR: 25,
	EMR_MOVETOEX: 27,
	EMR_SAVEDC: 33,
	EMR_RESTOREDC: 34,
	EMR_SETWORLDTRANSFORM: 35,
	EMR_MODIFYWORLDTRANSFORM: 36,
	EMR_SELECTOBJECT: 37,
	EMR_CREATEPEN: 38,
	EMR_CREATEBRUSHINDIRECT: 39,
	EMR_DELETEOBJECT: 40,
	EMR_ELLIPSE: 42,
	EMR_RECTANGLE: 43,
	EMR_ROUNDRECT: 44,
	EMR_BEGINPATH: 59,
	EMR_ENDPATH: 60,
	EMR_CLOSEFIGURE: 61,
	EMR_FILLPATH: 62,
	EMR_STROKEANDFILLPATH: 63,
	EMR_STROKEPATH: 64,
	EMR_SELECTCLIPPATH: 67,
	EMR_LINETO: 54,
	EMR_BITBLT: 76,
	EMR_STRETCHBLT: 77,
	EMR_STRETCHDIBITS: 81,
	EMR_EXTCREATEFONTINDIRECTW: 82,
	EMR_EXTTEXTOUTA: 83,
	EMR_EXTTEXTOUTW: 84,
	EMR_POLYBEZIER16: 85,
	EMR_POLYGON16: 86,
	EMR_POLYLINE16: 87,
	EMR_POLYBEZIERTO16: 88,
	EMR_POLYLINETO16: 89,
	EMR_POLYPOLYLINE16: 90,
	EMR_POLYPOLYGON16: 91,
	EMR_EXTCREATEPEN: 95,
	EMR_SMALLTEXTOUT: 108,
	EMR_ALPHABLEND: 114
};
var STOCK_OBJECT = {
	WHITE_BRUSH: 2147483648,
	LTGRAY_BRUSH: 2147483649,
	GRAY_BRUSH: 2147483650,
	DKGRAY_BRUSH: 2147483651,
	BLACK_BRUSH: 2147483652,
	NULL_BRUSH: 2147483653,
	WHITE_PEN: 2147483654,
	BLACK_PEN: 2147483655,
	NULL_PEN: 2147483656
};
var MODIFY_WORLD_TRANSFORM = {
	MWT_IDENTITY: 1,
	MWT_LEFTMULTIPLY: 2,
	MWT_RIGHTMULTIPLY: 3,
	MWT_SET: 4
};
function numberCss(value) {
	const rounded = Math.round(value * 100) / 100;
	return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
function rectWidth(rect) {
	return Math.max(1, rect.right - rect.left || 0);
}
function rectHeight(rect) {
	return Math.max(1, rect.bottom - rect.top || 0);
}
function normalizeRect(rect) {
	return {
		left: Math.min(rect.left, rect.right),
		top: Math.min(rect.top, rect.bottom),
		right: Math.max(rect.left, rect.right),
		bottom: Math.max(rect.top, rect.bottom)
	};
}
function updateBounds(ctx, points) {
	for (const point of points) {
		if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
		if (!ctx.contentBounds) {
			ctx.contentBounds = {
				left: point.x,
				top: point.y,
				right: point.x,
				bottom: point.y
			};
			continue;
		}
		ctx.contentBounds.left = Math.min(ctx.contentBounds.left, point.x);
		ctx.contentBounds.top = Math.min(ctx.contentBounds.top, point.y);
		ctx.contentBounds.right = Math.max(ctx.contentBounds.right, point.x);
		ctx.contentBounds.bottom = Math.max(ctx.contentBounds.bottom, point.y);
	}
}
function colorRefToCss$1(colorRef) {
	const red = colorRef & 255;
	const green = colorRef >>> 8 & 255;
	const blue = colorRef >>> 16 & 255;
	return `#${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
}
function createBitmapFileHeader$1(pixelOffset, fileSize) {
	const header = /* @__PURE__ */ new Uint8Array(14);
	const view = new DataView(header.buffer);
	header[0] = 66;
	header[1] = 77;
	view.setUint32(2, fileSize >>> 0, true);
	view.setUint32(10, pixelOffset >>> 0, true);
	return header;
}
function bitmapInfoToBmp(bmi, bits) {
	if (bmi.length < 12 || !bits.length) return null;
	const pixelOffset = 14 + bmi.length;
	const fileSize = pixelOffset + bits.length;
	const out = new Uint8Array(fileSize);
	out.set(createBitmapFileHeader$1(pixelOffset, fileSize), 0);
	out.set(bmi, 14);
	out.set(bits, pixelOffset);
	return out;
}
function penStyleFromCode(style, width, color) {
	const normalizedWidth = Math.max(1, Math.abs(width) || 1);
	const base = {
		color,
		width: normalizedWidth
	};
	switch (style & 15) {
		case 1: return {
			...base,
			dasharray: `${normalizedWidth * 4} ${normalizedWidth * 2}`
		};
		case 2: return {
			...base,
			dasharray: `${normalizedWidth} ${normalizedWidth * 2}`
		};
		case 3: return {
			...base,
			dasharray: `${normalizedWidth * 4} ${normalizedWidth * 2} ${normalizedWidth} ${normalizedWidth * 2}`
		};
		case 4: return {
			...base,
			dasharray: `${normalizedWidth * 4} ${normalizedWidth * 2} ${normalizedWidth} ${normalizedWidth * 2} ${normalizedWidth} ${normalizedWidth * 2}`
		};
		case 5: return {
			...base,
			none: true
		};
		default: return base;
	}
}
function brushStyleFromCode(style, color) {
	if (style === 1) return {
		color,
		none: true
	};
	return { color };
}
function cloneGraphicsState(state) {
	return {
		...state,
		windowOrg: { ...state.windowOrg },
		windowExt: { ...state.windowExt },
		viewportOrg: { ...state.viewportOrg },
		viewportExt: { ...state.viewportExt },
		worldTransform: { ...state.worldTransform },
		currentPosition: { ...state.currentPosition },
		pen: { ...state.pen },
		brush: { ...state.brush },
		font: { ...state.font }
	};
}
function readXForm(reader, offset) {
	const view = reader.view;
	return {
		m11: reader.ensure(offset, 4) ? view.getFloat32(offset, true) : 1,
		m12: reader.ensure(offset + 4, 4) ? view.getFloat32(offset + 4, true) : 0,
		m21: reader.ensure(offset + 8, 4) ? view.getFloat32(offset + 8, true) : 0,
		m22: reader.ensure(offset + 12, 4) ? view.getFloat32(offset + 12, true) : 1,
		dx: reader.ensure(offset + 16, 4) ? view.getFloat32(offset + 16, true) : 0,
		dy: reader.ensure(offset + 20, 4) ? view.getFloat32(offset + 20, true) : 0
	};
}
function multiplyMatrix(left, right) {
	return {
		m11: left.m11 * right.m11 + left.m12 * right.m21,
		m12: left.m11 * right.m12 + left.m12 * right.m22,
		m21: left.m21 * right.m11 + left.m22 * right.m21,
		m22: left.m21 * right.m12 + left.m22 * right.m22,
		dx: left.dx * right.m11 + left.dy * right.m21 + right.dx,
		dy: left.dx * right.m12 + left.dy * right.m22 + right.dy
	};
}
function transformPoint(matrix, point) {
	return {
		x: point.x * matrix.m11 + point.y * matrix.m21 + matrix.dx,
		y: point.x * matrix.m12 + point.y * matrix.m22 + matrix.dy
	};
}
function transformVector(matrix, vector) {
	return {
		x: vector.x * matrix.m11 + vector.y * matrix.m21,
		y: vector.x * matrix.m12 + vector.y * matrix.m22
	};
}
function defaultContext(width, height, viewBox) {
	return {
		width,
		height,
		viewBox,
		recordCount: 0,
		contentBounds: null,
		nodes: [],
		stateStack: [],
		capturePath: false,
		pathData: [],
		pathPoints: [],
		objects: [],
		state: {
			windowOrg: {
				x: viewBox.left,
				y: viewBox.top
			},
			windowExt: {
				x: rectWidth(viewBox),
				y: rectHeight(viewBox)
			},
			viewportOrg: {
				x: viewBox.left,
				y: viewBox.top
			},
			viewportExt: {
				x: rectWidth(viewBox),
				y: rectHeight(viewBox)
			},
			worldTransform: { ...IDENTITY_MATRIX },
			currentPosition: {
				x: 0,
				y: 0
			},
			pen: { ...DEFAULT_PEN },
			brush: { ...DEFAULT_BRUSH },
			font: { ...DEFAULT_FONT },
			textColor: "#000000",
			bkColor: "#ffffff",
			bkMode: 1,
			textAlign: 0,
			polygonFillMode: 1
		}
	};
}
function mapPoint(ctx, point) {
	const transformed = transformPoint(ctx.state.worldTransform, point);
	const windowExtX = ctx.state.windowExt.x || rectWidth(ctx.viewBox) || 1;
	const windowExtY = ctx.state.windowExt.y || rectHeight(ctx.viewBox) || 1;
	const viewportExtX = ctx.state.viewportExt.x || rectWidth(ctx.viewBox) || 1;
	const viewportExtY = ctx.state.viewportExt.y || rectHeight(ctx.viewBox) || 1;
	return {
		x: ctx.state.viewportOrg.x + (transformed.x - ctx.state.windowOrg.x) * viewportExtX / windowExtX,
		y: ctx.state.viewportOrg.y + (transformed.y - ctx.state.windowOrg.y) * viewportExtY / windowExtY
	};
}
function mapVector(ctx, vector) {
	const transformed = transformVector(ctx.state.worldTransform, vector);
	const windowExtX = ctx.state.windowExt.x || rectWidth(ctx.viewBox) || 1;
	const windowExtY = ctx.state.windowExt.y || rectHeight(ctx.viewBox) || 1;
	const viewportExtX = ctx.state.viewportExt.x || rectWidth(ctx.viewBox) || 1;
	const viewportExtY = ctx.state.viewportExt.y || rectHeight(ctx.viewBox) || 1;
	return {
		x: transformed.x * viewportExtX / windowExtX,
		y: transformed.y * viewportExtY / windowExtY
	};
}
function mapRect(ctx, rect) {
	const points = [
		mapPoint(ctx, {
			x: rect.left,
			y: rect.top
		}),
		mapPoint(ctx, {
			x: rect.right,
			y: rect.top
		}),
		mapPoint(ctx, {
			x: rect.right,
			y: rect.bottom
		}),
		mapPoint(ctx, {
			x: rect.left,
			y: rect.bottom
		})
	];
	return normalizeRect({
		left: Math.min(...points.map((point) => point.x)),
		top: Math.min(...points.map((point) => point.y)),
		right: Math.max(...points.map((point) => point.x)),
		bottom: Math.max(...points.map((point) => point.y))
	});
}
function pointAttr(point) {
	return `${numberCss(point.x)},${numberCss(point.y)}`;
}
function effectivePenWidth(ctx, pen) {
	const width = Math.max(1, Math.abs(pen.width) || 1);
	const vx = mapVector(ctx, {
		x: width,
		y: 0
	});
	const vy = mapVector(ctx, {
		x: 0,
		y: width
	});
	const scaled = (Math.hypot(vx.x, vx.y) + Math.hypot(vy.x, vy.y)) / 2;
	if (!Number.isFinite(scaled) || scaled <= 0) return width;
	return Math.max(.5, scaled);
}
function scaledDashArray(ctx, pen) {
	if (!pen.dasharray) return void 0;
	const baseWidth = Math.max(1, Math.abs(pen.width) || 1);
	const scale = effectivePenWidth(ctx, pen) / baseWidth;
	return pen.dasharray.split(/\s+/).map((part) => Number(part)).filter((value) => Number.isFinite(value) && value > 0).map((value) => numberCss(value * scale)).join(" ") || void 0;
}
function strokeAttributes(ctx, pen) {
	if (pen.none) return "stroke=\"none\"";
	const attrs = [
		`stroke="${escapeHtml(pen.color)}"`,
		`stroke-width="${numberCss(effectivePenWidth(ctx, pen))}"`,
		"fill=\"none\""
	];
	const dasharray = scaledDashArray(ctx, pen);
	if (dasharray) attrs.push(`stroke-dasharray="${escapeHtml(dasharray)}"`);
	return attrs.join(" ");
}
function fillAttributes(ctx) {
	const attrs = [ctx.state.pen.none ? "stroke=\"none\"" : `stroke="${escapeHtml(ctx.state.pen.color)}"`, ctx.state.pen.none ? "" : `stroke-width="${numberCss(effectivePenWidth(ctx, ctx.state.pen))}"`].filter(Boolean);
	const dasharray = scaledDashArray(ctx, ctx.state.pen);
	if (dasharray && !ctx.state.pen.none) attrs.push(`stroke-dasharray="${escapeHtml(dasharray)}"`);
	attrs.push(ctx.state.brush.none ? "fill=\"none\"" : `fill="${escapeHtml(ctx.state.brush.color)}"`);
	attrs.push(`fill-rule="${ctx.state.polygonFillMode === 2 ? "nonzero" : "evenodd"}"`);
	return attrs.join(" ");
}
function fillOnlyAttributes(ctx) {
	const attrs = ["stroke=\"none\""];
	attrs.push(ctx.state.brush.none ? "fill=\"none\"" : `fill="${escapeHtml(ctx.state.brush.color)}"`);
	attrs.push(`fill-rule="${ctx.state.polygonFillMode === 2 ? "nonzero" : "evenodd"}"`);
	return attrs.join(" ");
}
function ensureObjectSlot(objects) {
	const free = objects.findIndex((item) => item == null);
	if (free >= 0) return free;
	objects.push(null);
	return objects.length - 1;
}
function setObject(objects, index, value) {
	while (objects.length <= index) objects.push(null);
	objects[index] = value;
}
function selectStockObject(ctx, index) {
	switch (index >>> 0) {
		case STOCK_OBJECT.WHITE_BRUSH:
			ctx.state.brush = { color: "#ffffff" };
			return true;
		case STOCK_OBJECT.LTGRAY_BRUSH:
			ctx.state.brush = { color: "#c0c0c0" };
			return true;
		case STOCK_OBJECT.GRAY_BRUSH:
			ctx.state.brush = { color: "#808080" };
			return true;
		case STOCK_OBJECT.DKGRAY_BRUSH:
			ctx.state.brush = { color: "#404040" };
			return true;
		case STOCK_OBJECT.BLACK_BRUSH:
			ctx.state.brush = { color: "#000000" };
			return true;
		case STOCK_OBJECT.NULL_BRUSH:
			ctx.state.brush = {
				color: "none",
				none: true
			};
			return true;
		case STOCK_OBJECT.WHITE_PEN:
			ctx.state.pen = {
				color: "#ffffff",
				width: 1
			};
			return true;
		case STOCK_OBJECT.BLACK_PEN:
			ctx.state.pen = {
				color: "#000000",
				width: 1
			};
			return true;
		case STOCK_OBJECT.NULL_PEN:
			ctx.state.pen = {
				color: "none",
				width: 1,
				none: true
			};
			return true;
		default: return false;
	}
}
function selectObject(ctx, index) {
	if (selectStockObject(ctx, index)) return;
	const object = ctx.objects[index] || null;
	if (!object) return;
	if (object.kind === "pen") ctx.state.pen = { ...object.value };
	if (object.kind === "brush") ctx.state.brush = { ...object.value };
	if (object.kind === "font") ctx.state.font = { ...object.value };
}
function addNode(ctx, svg, points) {
	ctx.nodes.push(svg);
	updateBounds(ctx, points);
}
function addPathFragment(ctx, fragment, points) {
	if (!fragment) return;
	ctx.pathData.push(fragment);
	ctx.pathPoints.push(...points);
}
function flushPath(ctx, attrs) {
	if (!ctx.pathData.length) return;
	addNode(ctx, `<path d="${ctx.pathData.join(" ")}" ${attrs} />`, ctx.pathPoints);
	ctx.pathData = [];
	ctx.pathPoints = [];
	ctx.capturePath = false;
}
function addLine(ctx, start, end) {
	const a = mapPoint(ctx, start);
	const b = mapPoint(ctx, end);
	ctx.state.currentPosition = { ...end };
	if (ctx.capturePath) {
		addPathFragment(ctx, `${ctx.pathData.length ? "" : `M ${pointAttr(a)}`} L ${pointAttr(b)}`.trim(), [a, b]);
		return;
	}
	addNode(ctx, `<line x1="${numberCss(a.x)}" y1="${numberCss(a.y)}" x2="${numberCss(b.x)}" y2="${numberCss(b.y)}" ${strokeAttributes(ctx, ctx.state.pen)} />`, [a, b]);
}
function addPolyline(ctx, points, closed) {
	if (!points.length) return;
	const mapped = points.map((point) => mapPoint(ctx, point));
	ctx.state.currentPosition = { ...points[points.length - 1] };
	const attr = mapped.map(pointAttr).join(" ");
	if (ctx.capturePath) {
		const commands = [`M ${pointAttr(mapped[0])}`, ...mapped.slice(1).map((point) => `L ${pointAttr(point)}`)];
		if (closed) commands.push("Z");
		addPathFragment(ctx, commands.join(" "), mapped);
		return;
	}
	addNode(ctx, `<${closed ? "polygon" : "polyline"} points="${attr}" ${closed ? fillAttributes(ctx) : strokeAttributes(ctx, ctx.state.pen)} />`, mapped);
}
function addBezierPath(ctx, points, relativeToCurrent = false) {
	const logical = [];
	if (relativeToCurrent) logical.push({ ...ctx.state.currentPosition });
	logical.push(...points);
	if (logical.length < 4) return;
	const mapped = logical.map((point) => mapPoint(ctx, point));
	let path = `M ${pointAttr(mapped[0])}`;
	for (let i = 1; i + 2 < mapped.length; i += 3) path += ` C ${pointAttr(mapped[i])} ${pointAttr(mapped[i + 1])} ${pointAttr(mapped[i + 2])}`;
	ctx.state.currentPosition = { ...logical[logical.length - 1] };
	if (ctx.capturePath) {
		addPathFragment(ctx, path, mapped);
		return;
	}
	addNode(ctx, `<path d="${path}" ${strokeAttributes(ctx, ctx.state.pen)} />`, mapped);
}
function addRect(ctx, rect, radius) {
	const mapped = mapRect(ctx, rect);
	const attrs = [
		`x="${numberCss(mapped.left)}"`,
		`y="${numberCss(mapped.top)}"`,
		`width="${numberCss(rectWidth(mapped))}"`,
		`height="${numberCss(rectHeight(mapped))}"`
	];
	if (radius) {
		const r = mapPoint(ctx, {
			x: radius.x,
			y: radius.y
		});
		attrs.push(`rx="${numberCss(Math.abs(r.x - ctx.state.viewportOrg.x))}"`);
		attrs.push(`ry="${numberCss(Math.abs(r.y - ctx.state.viewportOrg.y))}"`);
	}
	if (ctx.capturePath) {
		addPathFragment(ctx, `M ${numberCss(mapped.left)},${numberCss(mapped.top)} L ${numberCss(mapped.right)},${numberCss(mapped.top)} L ${numberCss(mapped.right)},${numberCss(mapped.bottom)} L ${numberCss(mapped.left)},${numberCss(mapped.bottom)} Z`, [{
			x: mapped.left,
			y: mapped.top
		}, {
			x: mapped.right,
			y: mapped.bottom
		}]);
		return;
	}
	addNode(ctx, `<rect ${attrs.join(" ")} ${fillAttributes(ctx)} />`, [{
		x: mapped.left,
		y: mapped.top
	}, {
		x: mapped.right,
		y: mapped.bottom
	}]);
}
function addEllipse(ctx, rect) {
	const mapped = mapRect(ctx, rect);
	const cx = (mapped.left + mapped.right) / 2;
	const cy = (mapped.top + mapped.bottom) / 2;
	const rx = rectWidth(mapped) / 2;
	const ry = rectHeight(mapped) / 2;
	if (ctx.capturePath) {
		addPathFragment(ctx, `M ${numberCss(cx - rx)},${numberCss(cy)} A ${numberCss(rx)},${numberCss(ry)} 0 1 0 ${numberCss(cx + rx)},${numberCss(cy)} A ${numberCss(rx)},${numberCss(ry)} 0 1 0 ${numberCss(cx - rx)},${numberCss(cy)} Z`, [{
			x: mapped.left,
			y: mapped.top
		}, {
			x: mapped.right,
			y: mapped.bottom
		}]);
		return;
	}
	addNode(ctx, `<ellipse cx="${numberCss(cx)}" cy="${numberCss(cy)}" rx="${numberCss(rx)}" ry="${numberCss(ry)}" ${fillAttributes(ctx)} />`, [{
		x: mapped.left,
		y: mapped.top
	}, {
		x: mapped.right,
		y: mapped.bottom
	}]);
}
function addRasterImage(ctx, rect, bmpBytes) {
	if (!bmpBytes.length) return;
	const mapped = mapRect(ctx, rect);
	const width = rectWidth(mapped);
	const height = rectHeight(mapped);
	const href = dataUrlFromBytes(bmpBytes, "image/bmp");
	addNode(ctx, `<image x="${numberCss(mapped.left)}" y="${numberCss(mapped.top)}" width="${numberCss(width)}" height="${numberCss(height)}" href="${href}" preserveAspectRatio="none" />`, [{
		x: mapped.left,
		y: mapped.top
	}, {
		x: mapped.right,
		y: mapped.bottom
	}]);
}
function decodeAnsi(bytes) {
	return new TextDecoder("windows-1252").decode(bytes).replace(/\0+$/g, "");
}
function decodeUtf16(bytes) {
	return new TextDecoder("utf-16le").decode(bytes).replace(/\0+$/g, "");
}
function textAnchor(textAlign) {
	const horizontal = textAlign & 6;
	if (horizontal === 2) return "end";
	if (horizontal === 6) return "middle";
	return "start";
}
function dominantBaseline(textAlign) {
	const vertical = textAlign & 24;
	if (vertical === 8) return "text-after-edge";
	if (vertical === 24) return "alphabetic";
	return "text-before-edge";
}
function addText(ctx, point, text) {
	if (!text) return;
	const mapped = mapPoint(ctx, point);
	const mappedSize = mapVector(ctx, {
		x: 0,
		y: Math.abs(ctx.state.font.size) || 12
	});
	const scaledSize = Math.hypot(mappedSize.x, mappedSize.y);
	const fontSize = Math.max(1, Number.isFinite(scaledSize) && scaledSize > 0 ? scaledSize : Math.abs(ctx.state.font.size) || 12);
	const family = String(ctx.state.font.family || "sans-serif").replace(/\s+(?:Baltic|CE|Cyr|Greek|Tur|Vietnamese|Hebrew|Arabic|Thai|Symbol)$/i, "") || "sans-serif";
	const attrs = [
		`x="${numberCss(mapped.x)}"`,
		`y="${numberCss(mapped.y)}"`,
		`fill="${escapeHtml(ctx.state.textColor)}"`,
		`font-size="${numberCss(fontSize)}"`,
		`font-family="${escapeHtml(family)}"`,
		`text-anchor="${textAnchor(ctx.state.textAlign)}"`,
		`dominant-baseline="${dominantBaseline(ctx.state.textAlign)}"`
	];
	if (ctx.state.font.weight && ctx.state.font.weight >= 600) attrs.push("font-weight=\"700\"");
	if (ctx.state.font.italic) attrs.push("font-style=\"italic\"");
	const decorations = [ctx.state.font.underline ? "underline" : "", ctx.state.font.strike ? "line-through" : ""].filter(Boolean);
	if (decorations.length) attrs.push(`text-decoration="${decorations.join(" ")}"`);
	if (ctx.state.font.escapement) attrs.push(`transform="rotate(${numberCss(ctx.state.font.escapement / 10)}, ${numberCss(mapped.x)}, ${numberCss(mapped.y)})"`);
	addNode(ctx, `<text ${attrs.join(" ")}>${escapeHtml(text)}</text>`, [mapped]);
}
function finalizeSvg(ctx, sourceMime) {
	if (!ctx.nodes.length) return null;
	const fallback = ctx.contentBounds ? normalizeRect(ctx.contentBounds) : normalizeRect(ctx.viewBox);
	const viewBox = normalizeRect({
		left: Number.isFinite(ctx.viewBox.left) ? ctx.viewBox.left : fallback.left,
		top: Number.isFinite(ctx.viewBox.top) ? ctx.viewBox.top : fallback.top,
		right: Number.isFinite(ctx.viewBox.right) ? ctx.viewBox.right : fallback.right,
		bottom: Number.isFinite(ctx.viewBox.bottom) ? ctx.viewBox.bottom : fallback.bottom
	});
	const width = Math.max(1, Math.round(rectWidth(viewBox)));
	const height = Math.max(1, Math.round(rectHeight(viewBox)));
	const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${numberCss(viewBox.left)} ${numberCss(viewBox.top)} ${numberCss(rectWidth(viewBox))} ${numberCss(rectHeight(viewBox))}" preserveAspectRatio="xMinYMin meet">\n${ctx.nodes.join("\n")}\n</svg>`;
	const encoded = new TextEncoder().encode(svg);
	return {
		mime: "image/svg+xml",
		bytes: encoded,
		dataUrl: dataUrlFromBytes(encoded, "image/svg+xml"),
		width,
		height,
		sourceMime,
		recordCount: ctx.recordCount
	};
}
function parseWmf(bytes) {
	const reader = new BinaryReader(bytes);
	let offset = 0;
	let placeableBounds = null;
	if (reader.u32(0) === PLACEABLE_WMF_KEY && bytes.length >= 22) {
		placeableBounds = normalizeRect({
			left: reader.i16(6),
			top: reader.i16(8),
			right: reader.i16(10),
			bottom: reader.i16(12)
		});
		offset = 22;
	}
	if (offset + WMF_HEADER_SIZE > bytes.length) return null;
	const header = new BinaryReader(bytes.subarray(offset));
	const headerSizeWords = header.u16(2);
	const numberOfObjects = header.u16(10);
	const recordOffset = offset + headerSizeWords * 2;
	if (recordOffset > bytes.length) return null;
	const viewBox = placeableBounds || {
		left: 0,
		top: 0,
		right: 1e3,
		bottom: 1e3
	};
	const ctx = defaultContext(rectWidth(viewBox), rectHeight(viewBox), viewBox);
	ctx.objects = new Array(Math.max(0, numberOfObjects)).fill(null);
	if (placeableBounds) {
		ctx.state.windowOrg = {
			x: placeableBounds.left,
			y: placeableBounds.top
		};
		ctx.state.windowExt = {
			x: rectWidth(placeableBounds),
			y: rectHeight(placeableBounds)
		};
		ctx.state.viewportOrg = {
			x: placeableBounds.left,
			y: placeableBounds.top
		};
		ctx.state.viewportExt = {
			x: rectWidth(placeableBounds),
			y: rectHeight(placeableBounds)
		};
	}
	let cursor = recordOffset;
	while (cursor + 6 <= bytes.length) {
		const recordReader = new BinaryReader(bytes.subarray(cursor));
		const recordSize = recordReader.u32(0) * 2;
		if (recordSize < 6 || cursor + recordSize > bytes.length) break;
		const fn = recordReader.u16(4);
		ctx.recordCount += 1;
		switch (fn) {
			case WMF_RECORD.META_EOF:
				cursor += recordSize;
				return finalizeSvg(ctx, "image/wmf");
			case WMF_RECORD.META_SETWINDOWORG:
				ctx.state.windowOrg = {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_SETWINDOWEXT:
				ctx.state.windowExt = {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_SETVIEWPORTORG:
				ctx.state.viewportOrg = {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_SETVIEWPORTEXT:
				ctx.state.viewportExt = {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_OFFSETWINDOWORG:
				ctx.state.windowOrg = {
					x: ctx.state.windowOrg.x + recordReader.i16(8),
					y: ctx.state.windowOrg.y + recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_OFFSETVIEWPORTORG:
				ctx.state.viewportOrg = {
					x: ctx.state.viewportOrg.x + recordReader.i16(8),
					y: ctx.state.viewportOrg.y + recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_SETBKMODE:
				ctx.state.bkMode = recordReader.u16(6);
				break;
			case WMF_RECORD.META_SETPOLYFILLMODE:
				ctx.state.polygonFillMode = recordReader.u16(6);
				break;
			case WMF_RECORD.META_SETBKCOLOR:
				ctx.state.bkColor = colorRefToCss$1(recordReader.u32(6));
				break;
			case WMF_RECORD.META_SETTEXTCOLOR:
				ctx.state.textColor = colorRefToCss$1(recordReader.u32(6));
				break;
			case WMF_RECORD.META_MOVETO:
				ctx.state.currentPosition = {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				};
				break;
			case WMF_RECORD.META_LINETO: {
				const end = {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				};
				addLine(ctx, ctx.state.currentPosition, end);
				break;
			}
			case WMF_RECORD.META_POLYLINE:
			case WMF_RECORD.META_POLYGON: {
				const count = recordReader.u16(6);
				const points = [];
				let pointOffset = 8;
				for (let i = 0; i < count && pointOffset + 4 <= recordSize; i += 1) {
					points.push({
						x: recordReader.i16(pointOffset),
						y: recordReader.i16(pointOffset + 2)
					});
					pointOffset += 4;
				}
				addPolyline(ctx, points, fn === WMF_RECORD.META_POLYGON);
				break;
			}
			case WMF_RECORD.META_POLYPOLYGON: {
				const polygons = recordReader.u16(6);
				const counts = [];
				let dataOffset = 8;
				for (let i = 0; i < polygons && dataOffset + 2 <= recordSize; i += 1) {
					counts.push(recordReader.u16(dataOffset));
					dataOffset += 2;
				}
				for (const count of counts) {
					const points = [];
					for (let i = 0; i < count && dataOffset + 4 <= recordSize; i += 1) {
						points.push({
							x: recordReader.i16(dataOffset),
							y: recordReader.i16(dataOffset + 2)
						});
						dataOffset += 4;
					}
					addPolyline(ctx, points, true);
				}
				break;
			}
			case WMF_RECORD.META_RECTANGLE:
				addRect(ctx, {
					left: recordReader.i16(12),
					top: recordReader.i16(10),
					right: recordReader.i16(8),
					bottom: recordReader.i16(6)
				});
				break;
			case WMF_RECORD.META_ELLIPSE:
				addEllipse(ctx, {
					left: recordReader.i16(12),
					top: recordReader.i16(10),
					right: recordReader.i16(8),
					bottom: recordReader.i16(6)
				});
				break;
			case WMF_RECORD.META_ROUNDRECT:
				addRect(ctx, {
					left: recordReader.i16(16),
					top: recordReader.i16(14),
					right: recordReader.i16(12),
					bottom: recordReader.i16(10)
				}, {
					x: recordReader.i16(8),
					y: recordReader.i16(6)
				});
				break;
			case WMF_RECORD.META_TEXTOUT: {
				const length = recordReader.u16(6);
				const textOffset = 8;
				const paddedLength = length + length % 2;
				const text = decodeAnsi(recordReader.slice(textOffset, Math.min(length, Math.max(0, recordSize - textOffset - 4))));
				const yOffset = textOffset + paddedLength;
				const y = recordReader.i16(yOffset);
				addText(ctx, {
					x: recordReader.i16(yOffset + 2),
					y
				}, text);
				break;
			}
			case WMF_RECORD.META_CREATEPENINDIRECT: {
				const style = recordReader.u16(6);
				const width = recordReader.i16(8);
				const color = colorRefToCss$1(recordReader.u32(12));
				const index = ensureObjectSlot(ctx.objects);
				setObject(ctx.objects, index, {
					kind: "pen",
					value: penStyleFromCode(style, width, color)
				});
				break;
			}
			case WMF_RECORD.META_CREATEBRUSHINDIRECT: {
				const style = recordReader.u16(6);
				const color = colorRefToCss$1(recordReader.u32(8));
				const index = ensureObjectSlot(ctx.objects);
				setObject(ctx.objects, index, {
					kind: "brush",
					value: brushStyleFromCode(style, color)
				});
				break;
			}
			case WMF_RECORD.META_CREATEFONTINDIRECT: {
				const height = Math.abs(recordReader.i16(6));
				const escapement = recordReader.i16(10);
				const weight = recordReader.u16(14);
				const italic = Boolean(recordReader.u8(16));
				const underline = Boolean(recordReader.u8(17));
				const strike = Boolean(recordReader.u8(18));
				const faceName = decodeAnsi(recordReader.slice(24, Math.max(0, recordSize - 24))).split("\0")[0] || "sans-serif";
				const index = ensureObjectSlot(ctx.objects);
				setObject(ctx.objects, index, {
					kind: "font",
					value: {
						family: faceName,
						size: height || 12,
						weight,
						italic,
						underline,
						strike,
						escapement
					}
				});
				break;
			}
			case WMF_RECORD.META_SELECTOBJECT:
				selectObject(ctx, recordReader.u16(6));
				break;
			case WMF_RECORD.META_DELETEOBJECT: {
				const index = recordReader.u16(6);
				if (index >= 0 && index < ctx.objects.length) ctx.objects[index] = null;
				break;
			}
		}
		cursor += recordSize;
	}
	return finalizeSvg(ctx, "image/wmf");
}
function readEmfPointArray(reader, offset, count, pointSize) {
	const points = [];
	for (let i = 0; i < count; i += 1) {
		const pointOffset = offset + i * pointSize;
		if (pointSize === 8) points.push({
			x: reader.i32(pointOffset),
			y: reader.i32(pointOffset + 4)
		});
		else points.push({
			x: reader.i16(pointOffset),
			y: reader.i16(pointOffset + 2)
		});
	}
	return points;
}
function parseEmfText(reader, unicode) {
	if (!reader.ensure(36, 40)) return null;
	const point = {
		x: reader.i32(36),
		y: reader.i32(40)
	};
	const chars = reader.u32(44);
	const offString = reader.u32(48);
	if (!chars || !offString || offString >= reader.length) return null;
	const byteLength = unicode ? chars * 2 : chars;
	const bytes = reader.slice(offString, byteLength);
	return {
		point,
		text: unicode ? decodeUtf16(bytes) : decodeAnsi(bytes)
	};
}
function parseSmallEmfText(reader) {
	if (!reader.ensure(8, 24)) return null;
	const point = {
		x: reader.i32(8),
		y: reader.i32(12)
	};
	const chars = reader.u32(16);
	const options = reader.u32(20);
	let textOffset = 36;
	if (options & 2) textOffset += 16;
	if (!chars || !reader.ensure(textOffset, chars)) return null;
	return {
		point,
		text: decodeAnsi(reader.slice(textOffset, chars))
	};
}
function readEmfEmbeddedBmp(record, offBmiOffset, cbBmiOffset, offBitsOffset, cbBitsOffset) {
	const offBmi = record.u32(offBmiOffset);
	const cbBmi = record.u32(cbBmiOffset);
	const offBits = record.u32(offBitsOffset);
	const cbBits = record.u32(cbBitsOffset);
	if (!offBmi || !cbBmi || !offBits || !cbBits) return null;
	if (!record.ensure(offBmi, cbBmi) || !record.ensure(offBits, cbBits)) return null;
	return bitmapInfoToBmp(record.slice(offBmi, cbBmi), record.slice(offBits, cbBits));
}
function addEmfStretchDibits(ctx, record) {
	if (!record.ensure(24, 56)) return;
	const bmp = readEmfEmbeddedBmp(record, 48, 52, 56, 60);
	if (!bmp) return;
	addRasterImage(ctx, {
		left: record.i32(24),
		top: record.i32(28),
		right: record.i32(24) + record.i32(72),
		bottom: record.i32(28) + record.i32(76)
	}, bmp);
}
function addEmfBltBitmap(ctx, record) {
	if (!record.ensure(24, 76)) return;
	const bmp = readEmfEmbeddedBmp(record, 84, 88, 92, 96);
	if (!bmp) return;
	addRasterImage(ctx, {
		left: record.i32(24),
		top: record.i32(28),
		right: record.i32(24) + record.i32(32),
		bottom: record.i32(28) + record.i32(36)
	}, bmp);
}
function closeCurrentPathFigure(ctx) {
	if (!ctx.pathData.length) return;
	ctx.pathData.push("Z");
}
function parseEmf(bytes) {
	const reader = new BinaryReader(bytes);
	if (!reader.ensure(0, 52) || reader.u32(0) !== EMF_RECORD.EMR_HEADER) return null;
	const bounds = normalizeRect({
		left: reader.i32(8),
		top: reader.i32(12),
		right: reader.i32(16),
		bottom: reader.i32(20)
	});
	const viewBox = rectWidth(bounds) > 0 && rectHeight(bounds) > 0 ? bounds : {
		left: 0,
		top: 0,
		right: 1e3,
		bottom: 1e3
	};
	const ctx = defaultContext(rectWidth(viewBox), rectHeight(viewBox), viewBox);
	ctx.state.windowOrg = {
		x: viewBox.left,
		y: viewBox.top
	};
	ctx.state.windowExt = {
		x: rectWidth(viewBox),
		y: rectHeight(viewBox)
	};
	ctx.state.viewportOrg = {
		x: viewBox.left,
		y: viewBox.top
	};
	ctx.state.viewportExt = {
		x: rectWidth(viewBox),
		y: rectHeight(viewBox)
	};
	let cursor = 0;
	while (cursor + 8 <= bytes.length) {
		const record = new BinaryReader(bytes.subarray(cursor));
		const type = record.u32(0);
		const size = record.u32(4);
		if (size < 8 || cursor + size > bytes.length) break;
		ctx.recordCount += 1;
		switch (type) {
			case EMF_RECORD.EMR_EOF:
				cursor += size;
				return finalizeSvg(ctx, "image/emf");
			case EMF_RECORD.EMR_SETWINDOWORGEX:
				ctx.state.windowOrg = {
					x: record.i32(8),
					y: record.i32(12)
				};
				break;
			case EMF_RECORD.EMR_SETWINDOWEXTEX:
				ctx.state.windowExt = {
					x: record.i32(8),
					y: record.i32(12)
				};
				break;
			case EMF_RECORD.EMR_SETVIEWPORTORGEX:
				ctx.state.viewportOrg = {
					x: record.i32(8),
					y: record.i32(12)
				};
				break;
			case EMF_RECORD.EMR_SETVIEWPORTEXTEX:
				ctx.state.viewportExt = {
					x: record.i32(8),
					y: record.i32(12)
				};
				break;
			case EMF_RECORD.EMR_SETBKMODE:
				ctx.state.bkMode = record.u32(8);
				break;
			case EMF_RECORD.EMR_SETPOLYFILLMODE:
				ctx.state.polygonFillMode = record.u32(8);
				break;
			case EMF_RECORD.EMR_SETTEXTALIGN:
				ctx.state.textAlign = record.u32(8);
				break;
			case EMF_RECORD.EMR_SETTEXTCOLOR:
				ctx.state.textColor = colorRefToCss$1(record.u32(8));
				break;
			case EMF_RECORD.EMR_SETBKCOLOR:
				ctx.state.bkColor = colorRefToCss$1(record.u32(8));
				break;
			case EMF_RECORD.EMR_SAVEDC:
				ctx.stateStack.push(cloneGraphicsState(ctx.state));
				break;
			case EMF_RECORD.EMR_RESTOREDC: {
				const saved = record.i32(8);
				if (saved < 0) {
					const steps = Math.min(ctx.stateStack.length, Math.abs(saved));
					for (let i = 0; i < steps - 1; i += 1) ctx.stateStack.pop();
					const state = ctx.stateStack.pop();
					if (state) ctx.state = cloneGraphicsState(state);
				} else if (saved > 0 && saved <= ctx.stateStack.length) {
					const state = ctx.stateStack[saved - 1];
					ctx.stateStack.length = saved - 1;
					if (state) ctx.state = cloneGraphicsState(state);
				}
				break;
			}
			case EMF_RECORD.EMR_SETWORLDTRANSFORM:
				ctx.state.worldTransform = readXForm(record, 8);
				break;
			case EMF_RECORD.EMR_MODIFYWORLDTRANSFORM: {
				const xform = readXForm(record, 8);
				const mode = record.u32(32);
				if (mode === MODIFY_WORLD_TRANSFORM.MWT_IDENTITY) ctx.state.worldTransform = { ...IDENTITY_MATRIX };
				else if (mode === MODIFY_WORLD_TRANSFORM.MWT_SET) ctx.state.worldTransform = xform;
				else if (mode === MODIFY_WORLD_TRANSFORM.MWT_LEFTMULTIPLY) ctx.state.worldTransform = multiplyMatrix(xform, ctx.state.worldTransform);
				else if (mode === MODIFY_WORLD_TRANSFORM.MWT_RIGHTMULTIPLY) ctx.state.worldTransform = multiplyMatrix(ctx.state.worldTransform, xform);
				break;
			}
			case EMF_RECORD.EMR_MOVETOEX:
				ctx.state.currentPosition = {
					x: record.i32(8),
					y: record.i32(12)
				};
				break;
			case EMF_RECORD.EMR_LINETO: {
				const end = {
					x: record.i32(8),
					y: record.i32(12)
				};
				addLine(ctx, ctx.state.currentPosition, end);
				break;
			}
			case EMF_RECORD.EMR_POLYLINE:
			case EMF_RECORD.EMR_POLYGON:
			case EMF_RECORD.EMR_POLYLINE16:
			case EMF_RECORD.EMR_POLYGON16:
				addPolyline(ctx, readEmfPointArray(record, 28, record.u32(24), type === EMF_RECORD.EMR_POLYLINE16 || type === EMF_RECORD.EMR_POLYGON16 ? 4 : 8), type === EMF_RECORD.EMR_POLYGON || type === EMF_RECORD.EMR_POLYGON16);
				break;
			case EMF_RECORD.EMR_POLYBEZIER:
			case EMF_RECORD.EMR_POLYBEZIER16:
				addBezierPath(ctx, readEmfPointArray(record, 28, record.u32(24), type === EMF_RECORD.EMR_POLYBEZIER16 ? 4 : 8), false);
				break;
			case EMF_RECORD.EMR_POLYBEZIERTO:
			case EMF_RECORD.EMR_POLYBEZIERTO16:
				addBezierPath(ctx, readEmfPointArray(record, 28, record.u32(24), type === EMF_RECORD.EMR_POLYBEZIERTO16 ? 4 : 8), true);
				break;
			case EMF_RECORD.EMR_POLYLINETO:
			case EMF_RECORD.EMR_POLYLINETO16: {
				const points = readEmfPointArray(record, 28, record.u32(24), type === EMF_RECORD.EMR_POLYLINETO16 ? 4 : 8);
				addPolyline(ctx, [{ ...ctx.state.currentPosition }, ...points], false);
				break;
			}
			case EMF_RECORD.EMR_POLYPOLYLINE:
			case EMF_RECORD.EMR_POLYPOLYGON:
			case EMF_RECORD.EMR_POLYPOLYLINE16:
			case EMF_RECORD.EMR_POLYPOLYGON16: {
				const polygonCount = record.u32(24);
				const pointCount = record.u32(28);
				const countsOffset = 32;
				const pointSize = type === EMF_RECORD.EMR_POLYPOLYLINE16 || type === EMF_RECORD.EMR_POLYPOLYGON16 ? 4 : 8;
				const pointsOffset = countsOffset + polygonCount * 4;
				const counts = [];
				for (let i = 0; i < polygonCount; i += 1) counts.push(record.u32(countsOffset + i * 4));
				const points = readEmfPointArray(record, pointsOffset, pointCount, pointSize);
				let index = 0;
				for (const count of counts) {
					addPolyline(ctx, points.slice(index, index + count), type === EMF_RECORD.EMR_POLYPOLYGON || type === EMF_RECORD.EMR_POLYPOLYGON16);
					index += count;
				}
				break;
			}
			case EMF_RECORD.EMR_RECTANGLE:
				addRect(ctx, {
					left: record.i32(8),
					top: record.i32(12),
					right: record.i32(16),
					bottom: record.i32(20)
				});
				break;
			case EMF_RECORD.EMR_ELLIPSE:
				addEllipse(ctx, {
					left: record.i32(8),
					top: record.i32(12),
					right: record.i32(16),
					bottom: record.i32(20)
				});
				break;
			case EMF_RECORD.EMR_ROUNDRECT:
				addRect(ctx, {
					left: record.i32(8),
					top: record.i32(12),
					right: record.i32(16),
					bottom: record.i32(20)
				}, {
					x: record.i32(24),
					y: record.i32(28)
				});
				break;
			case EMF_RECORD.EMR_BEGINPATH:
				ctx.capturePath = true;
				ctx.pathData = [];
				ctx.pathPoints = [];
				break;
			case EMF_RECORD.EMR_ENDPATH:
				ctx.capturePath = false;
				break;
			case EMF_RECORD.EMR_CLOSEFIGURE:
				closeCurrentPathFigure(ctx);
				break;
			case EMF_RECORD.EMR_FILLPATH:
				flushPath(ctx, fillOnlyAttributes(ctx));
				break;
			case EMF_RECORD.EMR_STROKEANDFILLPATH:
				flushPath(ctx, fillAttributes(ctx));
				break;
			case EMF_RECORD.EMR_STROKEPATH:
				flushPath(ctx, strokeAttributes(ctx, ctx.state.pen));
				break;
			case EMF_RECORD.EMR_SELECTCLIPPATH:
				ctx.capturePath = false;
				ctx.pathData = [];
				ctx.pathPoints = [];
				break;
			case EMF_RECORD.EMR_CREATEPEN: {
				const index = record.u32(8);
				const style = record.u32(12);
				const width = record.i32(16);
				const color = colorRefToCss$1(record.u32(24));
				setObject(ctx.objects, index, {
					kind: "pen",
					value: penStyleFromCode(style, width, color)
				});
				break;
			}
			case EMF_RECORD.EMR_CREATEBRUSHINDIRECT: {
				const index = record.u32(8);
				const style = record.u32(12);
				const color = colorRefToCss$1(record.u32(16));
				setObject(ctx.objects, index, {
					kind: "brush",
					value: brushStyleFromCode(style, color)
				});
				break;
			}
			case EMF_RECORD.EMR_EXTCREATEPEN: {
				const index = record.u32(8);
				const style = record.u32(28);
				const width = record.i32(32);
				const brushStyle = record.u32(36);
				const color = brushStyle === 1 ? "none" : colorRefToCss$1(record.u32(40));
				setObject(ctx.objects, index, {
					kind: "pen",
					value: brushStyle === 1 ? {
						color,
						width,
						none: true
					} : penStyleFromCode(style, width, color)
				});
				break;
			}
			case EMF_RECORD.EMR_EXTCREATEFONTINDIRECTW: {
				const index = record.u32(8);
				const height = Math.abs(record.i32(12));
				const escapement = record.i32(20);
				const weight = record.i32(28);
				const italic = Boolean(record.u8(32));
				const underline = Boolean(record.u8(33));
				const strike = Boolean(record.u8(34));
				const faceName = decodeUtf16(record.slice(40, 64)).split("\0")[0] || "sans-serif";
				setObject(ctx.objects, index, {
					kind: "font",
					value: {
						family: faceName,
						size: height || 12,
						weight,
						italic,
						underline,
						strike,
						escapement
					}
				});
				break;
			}
			case EMF_RECORD.EMR_SELECTOBJECT:
				selectObject(ctx, record.u32(8));
				break;
			case EMF_RECORD.EMR_DELETEOBJECT: {
				const index = record.u32(8);
				if (index >= 0 && index < ctx.objects.length) ctx.objects[index] = null;
				break;
			}
			case EMF_RECORD.EMR_EXTTEXTOUTA: {
				const parsed = parseEmfText(record, false);
				if (parsed) addText(ctx, parsed.point, parsed.text);
				break;
			}
			case EMF_RECORD.EMR_EXTTEXTOUTW: {
				const parsed = parseEmfText(record, true);
				if (parsed) addText(ctx, parsed.point, parsed.text);
				break;
			}
			case EMF_RECORD.EMR_SMALLTEXTOUT: {
				const parsed = parseSmallEmfText(record);
				if (parsed) addText(ctx, parsed.point, parsed.text);
				break;
			}
			case EMF_RECORD.EMR_STRETCHDIBITS:
				addEmfStretchDibits(ctx, record);
				break;
			case EMF_RECORD.EMR_BITBLT:
			case EMF_RECORD.EMR_STRETCHBLT:
			case EMF_RECORD.EMR_ALPHABLEND: addEmfBltBitmap(ctx, record);
		}
		cursor += size;
	}
	return finalizeSvg(ctx, "image/emf");
}
function convertMetafileToSvg(mime, bytes) {
	if (!bytes.length) return null;
	if (/image\/emf/i.test(mime)) return parseEmf(bytes);
	if (/image\/wmf/i.test(mime)) return parseWmf(bytes);
	return null;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/objects.js
var DEFAULT_MAX_PICTURE_BYTES = 8388608;
var PICF_HEADER_SIZE = 68;
var MM_SHAPEFILE = 102;
var OFFICEART_CONTAINER = 15;
var OFFICEART_FBSE = 61447;
var OFFICEART_BLIP_EMF = 61466;
var OFFICEART_BLIP_WMF = 61467;
var OFFICEART_BLIP_PICT = 61468;
var OFFICEART_BLIP_JPEG = 61469;
var OFFICEART_BLIP_PNG = 61470;
var OFFICEART_BLIP_DIB = 61471;
var OFFICEART_BLIP_TIFF = 61481;
var OFFICEART_BLIP_JPEG_ALT = 61482;
function startsWith(bytes, signature, offset = 0) {
	if (offset + signature.length > bytes.length) return false;
	for (let i = 0; i < signature.length; i += 1) if (bytes[offset + i] !== signature[i]) return false;
	return true;
}
function isPrintableAnsi(bytes) {
	for (let i = 0; i < bytes.length; i += 1) {
		const value = bytes[i] ?? 0;
		if (value === 0 || value === 9 || value === 10 || value === 13) continue;
		if (value < 32 || value === 127) return false;
	}
	return true;
}
function trimTrailingNullCharacters(value) {
	let end = value.length;
	while (end > 0 && value.charCodeAt(end - 1) === 0) end -= 1;
	return end === value.length ? value : value.slice(0, end);
}
function isProbablyPicturePath(value) {
	const normalized = value.trim();
	if (!normalized) return false;
	if (/^(?:file|https?|data|blob):/i.test(normalized)) return true;
	if (/^(?:\\\\|[a-zA-Z]:[\\/]|\/)/.test(normalized)) return true;
	return /\.(?:png|apng|jpe?g|gif|bmp|dib|tiff?|emf|wmf|pict|svg)(?:$|[?#])/i.test(normalized);
}
function isLocalExternalPath(value) {
	return /^file:/i.test(value) || /^(?:\\\\|[a-zA-Z]:[\\/]|\/)/.test(value);
}
function detectMimeFromPath(path) {
	const normalized = path.toLowerCase();
	if (normalized.includes(".png")) return "image/png";
	if (normalized.includes(".jpg") || normalized.includes(".jpeg")) return "image/jpeg";
	if (normalized.includes(".gif")) return "image/gif";
	if (normalized.includes(".bmp")) return "image/bmp";
	if (normalized.includes(".dib")) return "image/bmp";
	if (normalized.includes(".tif")) return "image/tiff";
	if (normalized.includes(".emf")) return "image/emf";
	if (normalized.includes(".wmf")) return "image/wmf";
	if (normalized.includes(".pict") || normalized.includes(".pct") || normalized.includes(".pic")) return "image/pict";
	if (normalized.includes(".svg")) return "image/svg+xml";
	return null;
}
function isBrowserDisplayableMime(mime) {
	return /^(?:image\/png|image\/jpeg|image\/gif|image\/bmp|image\/webp|image\/svg\+xml|image\/tiff)$/i.test(mime);
}
function detectAttachmentMime(name) {
	const normalized = name.toLowerCase();
	if (normalized.endsWith(".doc")) return "application/msword";
	if (normalized.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	if (normalized.endsWith(".xls")) return "application/vnd.ms-excel";
	if (normalized.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	if (normalized.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
	if (normalized.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
	if (normalized.endsWith(".pdf")) return "application/pdf";
	if (normalized.endsWith(".png")) return "image/png";
	if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
	if (normalized.endsWith(".gif")) return "image/gif";
	if (normalized.endsWith(".bmp")) return "image/bmp";
	if (normalized.endsWith(".zip")) return "application/zip";
	if (normalized.endsWith(".txt")) return "text/plain";
	return "application/octet-stream";
}
function detectImageSegment(bytes) {
	const sigs = [
		{
			mime: "image/png",
			magic: [
				137,
				80,
				78,
				71
			],
			end: findPngEnd
		},
		{
			mime: "image/jpeg",
			magic: [
				255,
				216,
				255
			],
			end: findJpegEnd
		},
		{
			mime: "image/gif",
			magic: [
				71,
				73,
				70,
				56
			],
			end: findGifEnd
		},
		{
			mime: "image/bmp",
			magic: [66, 77],
			end: findBmpEnd
		},
		{
			mime: "image/tiff",
			magic: [
				73,
				73,
				42,
				0
			],
			end: null
		},
		{
			mime: "image/tiff",
			magic: [
				77,
				77,
				0,
				42
			],
			end: null
		},
		{
			mime: "image/emf",
			magic: [
				1,
				0,
				0,
				0
			],
			end: findEmfEnd
		},
		{
			mime: "image/wmf",
			magic: [
				215,
				205,
				198,
				154
			],
			end: null
		}
	];
	for (let i = 0; i < bytes.length - 4; i += 1) for (const sig of sigs) if (startsWith(bytes, sig.magic, i)) {
		if (sig.mime === "image/emf" && findEmfEnd(bytes, i) === bytes.length) continue;
		const end = sig.end ? sig.end(bytes, i) : bytes.length;
		return {
			mime: sig.mime,
			start: i,
			end: end || bytes.length
		};
	}
	return null;
}
function findPngEnd(bytes, start) {
	for (let i = start + 8; i + 8 < bytes.length; i += 1) if (startsWith(bytes, [
		73,
		69,
		78,
		68
	], i)) return i + 8;
	return bytes.length;
}
function findJpegEnd(bytes, start) {
	for (let i = start + 2; i + 1 < bytes.length; i += 1) if (bytes[i] === 255 && bytes[i + 1] === 217) return i + 2;
	return bytes.length;
}
function findGifEnd(bytes, start) {
	for (let i = start + 6; i < bytes.length; i += 1) if (bytes[i] === 59) return i + 1;
	return bytes.length;
}
function findBmpEnd(bytes, start) {
	if (start + 6 <= bytes.length) {
		const size = new BinaryReader(bytes.subarray(start)).u32(2);
		if (size > 0 && start + size <= bytes.length) return start + size;
	}
	return bytes.length;
}
function findEmfEnd(bytes, start) {
	if (start + 52 > bytes.length) return bytes.length;
	const reader = new BinaryReader(bytes.subarray(start));
	const iType = reader.u32(0);
	const signature = reader.u32(40);
	const nBytes = reader.u32(48);
	if (iType !== 1 || signature !== 1179469088) return bytes.length;
	if (nBytes > 0 && start + nBytes <= bytes.length) return start + nBytes;
	return bytes.length;
}
function parsePicfHeader(bytes) {
	if (bytes.length < PICF_HEADER_SIZE) return null;
	const reader = new BinaryReader(bytes);
	const dxaGoalTwips = reader.i16(28);
	const dyaGoalTwips = reader.i16(30);
	const scaleXPermille = reader.u16(32);
	const scaleYPermille = reader.u16(34);
	const displayWidthTwips = dxaGoalTwips > 0 && scaleXPermille > 0 ? Math.max(15, Math.min(31680, Math.round(dxaGoalTwips * scaleXPermille / 1e3))) : void 0;
	const displayHeightTwips = dyaGoalTwips > 0 && scaleYPermille > 0 ? Math.max(15, Math.min(31680, Math.round(dyaGoalTwips * scaleYPermille / 1e3))) : void 0;
	return {
		lcb: reader.i32(0),
		cbHeader: reader.u16(4),
		mm: reader.u16(6),
		xExt: reader.i16(8),
		yExt: reader.i16(10),
		dxaGoalTwips: dxaGoalTwips > 0 ? dxaGoalTwips : void 0,
		dyaGoalTwips: dyaGoalTwips > 0 ? dyaGoalTwips : void 0,
		scaleXPermille: scaleXPermille || void 0,
		scaleYPermille: scaleYPermille || void 0,
		displayWidthTwips,
		displayHeightTwips
	};
}
/**
* PICFAndOfficeArtData can optionally carry a length-prefixed ANSI path right after
* the 68-byte PICF header. The spec ties this to MM_SHAPEFILE, but real-world files
* are not always perfectly spec-compliant, so we also accept clearly path-like data.
*/
function readOptionalPictureName(pictureChunk, picf) {
	const offset = Math.min(picf.cbHeader || PICF_HEADER_SIZE, pictureChunk.length);
	if (offset >= pictureChunk.length) return null;
	const length = pictureChunk[offset] ?? 0;
	if (!length || offset + 1 + length > pictureChunk.length) return null;
	const raw = pictureChunk.subarray(offset + 1, offset + 1 + length);
	if (!isPrintableAnsi(raw)) return null;
	const value = trimTrailingNullCharacters(new TextDecoder("windows-1252").decode(raw));
	if (!isProbablyPicturePath(value)) {
		if (picf.mm !== MM_SHAPEFILE) return null;
	}
	return {
		value,
		nextOffset: offset + 1 + length
	};
}
/**
* OfficeArt records all start with the common 8-byte OfficeArtRecordHeader.
* Parsing this explicitly lets us walk inline shape containers instead of guessing
* image payloads by magic bytes, which was the root cause of the broken image output.
*/
function parseOfficeArtRecordHeader(bytes, offset) {
	if (offset < 0 || offset + 8 > bytes.length) return null;
	const reader = new BinaryReader(bytes);
	const versionAndInstance = reader.u16(offset);
	const recType = reader.u16(offset + 2);
	const recLen = reader.u32(offset + 4);
	if (recType < 61440 || recType > 65535) return null;
	const size = 8 + recLen;
	if (recLen > bytes.length || offset + size > bytes.length) return null;
	return {
		recVer: versionAndInstance & 15,
		recInstance: versionAndInstance >>> 4,
		recType,
		recLen,
		size
	};
}
function createBitmapFileHeader(pixelOffset, totalSize) {
	const header = /* @__PURE__ */ new Uint8Array(14);
	const view = new DataView(header.buffer);
	view.setUint8(0, 66);
	view.setUint8(1, 77);
	view.setUint32(2, totalSize, true);
	view.setUint16(6, 0, true);
	view.setUint16(8, 0, true);
	view.setUint32(10, pixelOffset, true);
	return header;
}
function dibToBmp(dibBytes) {
	if (dibBytes.length < 12) return null;
	const reader = new BinaryReader(dibBytes);
	const headerSize = reader.u32(0);
	if (headerSize < 12 || headerSize > dibBytes.length) return null;
	let bitsPerPixel = 0;
	let compression = 0;
	let colorsUsed = 0;
	let paletteEntrySize = 4;
	if (headerSize === 12) {
		bitsPerPixel = reader.u16(10);
		paletteEntrySize = 3;
	} else {
		bitsPerPixel = reader.u16(14);
		compression = reader.u32(16);
		colorsUsed = reader.u32(32);
	}
	let paletteSize = (colorsUsed || (bitsPerPixel > 0 && bitsPerPixel <= 8 ? 1 << bitsPerPixel : 0)) * paletteEntrySize;
	if (compression === 3 && headerSize >= 40) paletteSize += 12;
	const pixelOffset = 14 + headerSize + paletteSize;
	if (pixelOffset > 14 + dibBytes.length) return null;
	const bmpHeader = createBitmapFileHeader(pixelOffset, 14 + dibBytes.length);
	const out = new Uint8Array(14 + dibBytes.length);
	out.set(bmpHeader, 0);
	out.set(dibBytes, 14);
	return out;
}
/**
* OfficeArtBStoreContainerFileBlock can wrap an OfficeArtFBSE record instead of a
* BLIP atom directly. In that case the actual image payload sits in the FBSE
* embeddedBlip field after the fixed 36-byte FBSE header and optional nameData.
*/
function extractEmbeddedBlipFromFbse(bytes, offset, header) {
	const payloadOffset = offset + 8;
	const payloadEnd = payloadOffset + header.recLen;
	if (payloadEnd > bytes.length || header.recLen < 36) return null;
	const reader = new BinaryReader(bytes);
	const btWin32 = reader.u8(payloadOffset);
	const btMacOS = reader.u8(payloadOffset + 1);
	const tag = reader.u16(payloadOffset + 18);
	const size = reader.u32(payloadOffset + 20);
	const cRef = reader.u32(payloadOffset + 24);
	const foDelay = reader.u32(payloadOffset + 28);
	const cbName = reader.u8(payloadOffset + 33);
	const nameOffset = payloadOffset + 36;
	const embeddedBlipOffset = nameOffset + cbName;
	if (embeddedBlipOffset + 8 > payloadEnd) return null;
	const embeddedHeader = parseOfficeArtRecordHeader(bytes, embeddedBlipOffset);
	if (!embeddedHeader) return null;
	const candidate = extractBlipPayload(bytes, embeddedBlipOffset, embeddedHeader);
	if (!candidate) return null;
	const fbseName = cbName > 0 && nameOffset + cbName <= payloadEnd ? trimTrailingNullCharacters(new TextDecoder("utf-16le").decode(bytes.subarray(nameOffset, nameOffset + Math.max(0, cbName - 2)))) : "";
	return {
		...candidate,
		meta: {
			...candidate.meta || {},
			fbseBlipType: btWin32 || btMacOS,
			fbseMime: detectMimeFromBlipType(btWin32 || btMacOS),
			fbseTag: tag,
			fbseSize: size,
			fbseRefCount: cRef,
			fbseDelayOffset: foDelay,
			fbseName
		}
	};
}
function extractBlipPayload(bytes, offset, header) {
	const payloadOffset = offset + 8;
	const uidBytes = ((header.recInstance & 1) === 1 ? 2 : 1) * 16;
	const atom = bytes.subarray(payloadOffset, payloadOffset + header.recLen);
	if (header.recType === OFFICEART_BLIP_PNG || header.recType === OFFICEART_BLIP_JPEG || header.recType === OFFICEART_BLIP_JPEG_ALT || header.recType === OFFICEART_BLIP_DIB || header.recType === OFFICEART_BLIP_TIFF) {
		const infoSize = uidBytes + 1;
		if (atom.length < infoSize) return null;
		let mime = "application/octet-stream";
		let payload = atom.subarray(infoSize);
		if (header.recType === OFFICEART_BLIP_PNG) mime = "image/png";
		else if (header.recType === OFFICEART_BLIP_JPEG || header.recType === OFFICEART_BLIP_JPEG_ALT) mime = "image/jpeg";
		else if (header.recType === OFFICEART_BLIP_TIFF) mime = "image/tiff";
		else if (header.recType === OFFICEART_BLIP_DIB) {
			const bmp = dibToBmp(payload);
			if (bmp) {
				payload = bmp;
				mime = "image/bmp";
			} else mime = "image/dib";
		}
		return {
			mime,
			bytes: payload,
			displayable: isBrowserDisplayableMime(mime),
			kind: "officeArt",
			meta: {
				recType: header.recType,
				recInstance: header.recInstance
			}
		};
	}
	if (header.recType === OFFICEART_BLIP_EMF || header.recType === OFFICEART_BLIP_WMF || header.recType === OFFICEART_BLIP_PICT) {
		const infoSize = uidBytes + 34;
		if (atom.length < infoSize) return null;
		const metaReader = new BinaryReader(atom);
		const metafileUncompressedSize = metaReader.u32(uidBytes);
		const metafileCompressedSize = metaReader.u32(uidBytes + 28);
		const metafileCompression = atom[uidBytes + 32] ?? 255;
		const metafileFilter = atom[uidBytes + 33] ?? 255;
		const rawPayload = atom.subarray(infoSize);
		let payload = rawPayload;
		let metafileDecompressed = false;
		let metafileCompressed = metafileCompression !== 254;
		if (metafileCompression === 0) {
			const inflated = inflateZlib(rawPayload, metafileUncompressedSize || void 0);
			if (inflated) {
				payload = inflated;
				metafileDecompressed = true;
				metafileCompressed = false;
			}
		}
		const mime = header.recType === OFFICEART_BLIP_EMF ? "image/emf" : header.recType === OFFICEART_BLIP_WMF ? "image/wmf" : "image/pict";
		return {
			mime,
			bytes: payload,
			displayable: isBrowserDisplayableMime(mime),
			kind: "officeArt",
			meta: {
				recType: header.recType,
				recInstance: header.recInstance,
				metafileUncompressedSize,
				metafileCompressedSize,
				metafileCompression,
				metafileFilter,
				metafileCompressed,
				metafileDecompressed,
				metafileOriginalByteLength: rawPayload.length,
				fbseSize: metafileCompressedSize
			}
		};
	}
	return null;
}
function collectOfficeArtCandidates(bytes, offset, end, out) {
	let cursor = offset;
	while (cursor + 8 <= end) {
		const header = parseOfficeArtRecordHeader(bytes, cursor);
		if (!header) break;
		const next = cursor + header.size;
		if (next > end) break;
		if (header.recVer === OFFICEART_CONTAINER) collectOfficeArtCandidates(bytes, cursor + 8, next, out);
		else if (header.recType === OFFICEART_FBSE) {
			const candidate = extractEmbeddedBlipFromFbse(bytes, cursor, header);
			if (candidate) out.push(candidate);
		} else {
			const candidate = extractBlipPayload(bytes, cursor, header);
			if (candidate) out.push(candidate);
		}
		cursor = next;
	}
}
/**
* The `picture` field of PICFAndOfficeArtData is an OfficeArtInlineSpContainer.
* We recursively walk nested OfficeArt containers until we reach actual BLIP atoms
* (PNG/JPEG/DIB/TIFF/EMF/WMF/PICT) and then extract the payload according to the
* BLIP record-specific layout from MS-ODRAW.
*/
function findOfficeArtCandidates(pictureChunk, startOffset) {
	if (startOffset < 0 || startOffset + 8 > pictureChunk.length) return [];
	const candidates = [];
	collectOfficeArtCandidates(pictureChunk, startOffset, pictureChunk.length, candidates);
	return candidates;
}
function rankPictureCandidate(candidate) {
	switch (candidate.mime) {
		case "image/png": return 100;
		case "image/jpeg": return 90;
		case "image/gif": return 80;
		case "image/bmp": return 70;
		case "image/tiff": return 60;
		case "image/svg+xml": return 50;
		case "image/emf": return 40;
		case "image/wmf": return 30;
		case "image/pict": return 20;
		default: return 0;
	}
}
function pickBestPictureCandidate(candidates) {
	let best = null;
	for (const candidate of candidates) if (!best || rankPictureCandidate(candidate) > rankPictureCandidate(best)) best = candidate;
	return best;
}
function maybeConvertVectorCandidate(candidate) {
	if (!/^(?:image\/emf|image\/wmf)$/i.test(candidate.mime)) return candidate;
	if (!candidate.bytes.length) return candidate;
	if (candidate.meta?.metafileCompressed) return candidate;
	const converted = convertMetafileToSvg(candidate.mime, candidate.bytes);
	if (!converted) return candidate;
	return {
		...candidate,
		mime: converted.mime,
		bytes: converted.bytes,
		displayable: true,
		meta: {
			...candidate.meta || {},
			vectorConverted: true,
			vectorSourceMime: converted.sourceMime,
			vectorWidth: converted.width,
			vectorHeight: converted.height,
			vectorRecordCount: converted.recordCount
		}
	};
}
function createImageAsset(candidate, pictureOffset, picf, linkedPath, inlineShape) {
	const sourceUrl = candidate.sourceUrl;
	const localExternal = sourceUrl ? isLocalExternalPath(sourceUrl) : false;
	const meta = {
		pictureOffset,
		lcb: picf.lcb,
		cbHeader: picf.cbHeader,
		mm: picf.mm,
		xExt: picf.xExt,
		yExt: picf.yExt,
		dxaGoalTwips: picf.dxaGoalTwips,
		dyaGoalTwips: picf.dyaGoalTwips,
		scaleXPermille: picf.scaleXPermille,
		scaleYPermille: picf.scaleYPermille,
		displayWidthTwips: picf.displayWidthTwips,
		displayHeightTwips: picf.displayHeightTwips,
		linkedPath,
		sourceKind: candidate.kind === "officeArt" ? "embedded" : candidate.kind,
		localExternal,
		browserRenderable: candidate.displayable,
		blipIndex: inlineShape?.blipIndex,
		sourceShapeId: inlineShape?.shapeId,
		...candidate.meta || {}
	};
	return {
		id: uniqueId("asset-img"),
		type: "image",
		mime: candidate.mime,
		bytes: candidate.bytes,
		dataUrl: sourceUrl ? "" : dataUrlFromBytes(candidate.bytes, candidate.mime),
		sourceUrl,
		displayable: candidate.displayable && !localExternal,
		meta
	};
}
/**
* Resolves a picture character (U+0001 + sprmCPicLocation) to an HTML-friendly asset.
* The happy path is: PICF -> optional linked picture name -> OfficeArtInlineSpContainer
* -> OfficeArtBlip*. When no structured BLIP can be found we still fall back to a
* signature scan so slightly malformed files remain usable.
*/
function extractPictureAsset(dataStreamBytes, pictureOffset, options = {}) {
	if (!dataStreamBytes || pictureOffset == null || pictureOffset < 0 || pictureOffset + PICF_HEADER_SIZE > dataStreamBytes.length) return null;
	const lcb = new BinaryReader(dataStreamBytes).i32(pictureOffset);
	const total = lcb > 0 && pictureOffset + lcb <= dataStreamBytes.length ? lcb : Math.min(dataStreamBytes.length - pictureOffset, options.maxPictureBytes || DEFAULT_MAX_PICTURE_BYTES);
	const pictureChunk = dataStreamBytes.subarray(pictureOffset, pictureOffset + total);
	const picf = parsePicfHeader(pictureChunk);
	if (!picf) return null;
	let pictureDataOffset = Math.min(picf.cbHeader || PICF_HEADER_SIZE, pictureChunk.length);
	const pictureName = readOptionalPictureName(pictureChunk, picf);
	const linkedPath = pictureName?.value;
	if (pictureName) pictureDataOffset = pictureName.nextOffset;
	const inlineShape = parseInlineOfficeArtShape(pictureChunk, pictureDataOffset);
	const officeArtCandidate = pickBestPictureCandidate(findOfficeArtCandidates(pictureChunk, pictureDataOffset));
	if (officeArtCandidate) return createImageAsset(maybeConvertVectorCandidate(officeArtCandidate), pictureOffset, picf, linkedPath, inlineShape);
	if (linkedPath) {
		const mime = detectMimeFromPath(linkedPath) || "application/octet-stream";
		const isLocalFileReference = isLocalExternalPath(linkedPath);
		return createImageAsset({
			mime,
			bytes: /* @__PURE__ */ new Uint8Array(0),
			sourceUrl: linkedPath,
			displayable: isBrowserDisplayableMime(mime) && !isLocalFileReference,
			kind: "linked",
			meta: { linkedPath }
		}, pictureOffset, picf, linkedPath, inlineShape);
	}
	const bodyStart = Math.min(picf.cbHeader || PICF_HEADER_SIZE, pictureChunk.length);
	const segment = detectImageSegment(pictureChunk.subarray(bodyStart));
	if (!segment) return {
		id: uniqueId("asset-img"),
		type: "image",
		mime: "application/octet-stream",
		bytes: pictureChunk,
		dataUrl: dataUrlFromBytes(pictureChunk, "application/octet-stream"),
		displayable: false,
		meta: {
			pictureOffset,
			lcb: picf.lcb,
			cbHeader: picf.cbHeader,
			mm: picf.mm,
			xExt: picf.xExt,
			yExt: picf.yExt,
			dxaGoalTwips: picf.dxaGoalTwips,
			dyaGoalTwips: picf.dyaGoalTwips,
			scaleXPermille: picf.scaleXPermille,
			scaleYPermille: picf.scaleYPermille,
			displayWidthTwips: picf.displayWidthTwips,
			displayHeightTwips: picf.displayHeightTwips,
			sourceKind: "fallback",
			browserRenderable: false,
			blipIndex: inlineShape?.blipIndex,
			sourceShapeId: inlineShape?.shapeId
		}
	};
	const start = bodyStart + segment.start;
	const end = Math.min(bodyStart + segment.end, pictureChunk.length);
	const imageBytes = pictureChunk.subarray(start, end);
	const fallbackCandidate = maybeConvertVectorCandidate({
		mime: segment.mime,
		bytes: imageBytes,
		displayable: isBrowserDisplayableMime(segment.mime),
		kind: "fallback",
		meta: {
			pictureOffset,
			lcb: picf.lcb,
			cbHeader: picf.cbHeader,
			mm: picf.mm,
			xExt: picf.xExt,
			yExt: picf.yExt,
			dxaGoalTwips: picf.dxaGoalTwips,
			dyaGoalTwips: picf.dyaGoalTwips,
			scaleXPermille: picf.scaleXPermille,
			scaleYPermille: picf.scaleYPermille,
			displayWidthTwips: picf.displayWidthTwips,
			displayHeightTwips: picf.displayHeightTwips,
			sourceKind: "fallback",
			browserRenderable: isBrowserDisplayableMime(segment.mime)
		}
	});
	return {
		id: uniqueId("asset-img"),
		type: "image",
		mime: fallbackCandidate.mime,
		bytes: fallbackCandidate.bytes,
		dataUrl: dataUrlFromBytes(fallbackCandidate.bytes, fallbackCandidate.mime),
		displayable: fallbackCandidate.displayable,
		meta: {
			pictureOffset,
			lcb: picf.lcb,
			cbHeader: picf.cbHeader,
			mm: picf.mm,
			xExt: picf.xExt,
			yExt: picf.yExt,
			dxaGoalTwips: picf.dxaGoalTwips,
			dyaGoalTwips: picf.dyaGoalTwips,
			scaleXPermille: picf.scaleXPermille,
			scaleYPermille: picf.scaleYPermille,
			displayWidthTwips: picf.displayWidthTwips,
			displayHeightTwips: picf.displayHeightTwips,
			sourceKind: "fallback",
			browserRenderable: Boolean(fallbackCandidate.displayable),
			blipIndex: inlineShape?.blipIndex,
			sourceShapeId: inlineShape?.shapeId,
			...fallbackCandidate.meta || {}
		}
	};
}
function readCString(bytes, offset) {
	let end = offset;
	while (end < bytes.length && bytes[end] !== 0) end += 1;
	return {
		value: new TextDecoder("windows-1252").decode(bytes.subarray(offset, end)),
		nextOffset: end + 1
	};
}
function parseOle10Native(streamBytes) {
	const reader = new BinaryReader(streamBytes);
	for (const start of [4, 6]) try {
		let offset = start;
		const label = readCString(streamBytes, offset);
		offset = label.nextOffset;
		const originalPath = readCString(streamBytes, offset);
		offset = originalPath.nextOffset;
		const tempPath = readCString(streamBytes, offset);
		offset = tempPath.nextOffset;
		if (offset + 4 > streamBytes.length) continue;
		const dataSize = reader.u32(offset);
		offset += 4;
		if (dataSize > 0 && offset + dataSize <= streamBytes.length) {
			const bytes = streamBytes.subarray(offset, offset + dataSize);
			return {
				label: label.value,
				originalPath: originalPath.value,
				tempPath: tempPath.value,
				dataSize,
				bytes
			};
		}
	} catch {}
	return null;
}
function readObjectStorage(cfb, entry) {
	const streams = cfb.listChildren(entry).filter((child) => child.objectType === 2 || child.objectType === 5);
	const lower = new Map(streams.map((child) => [child.name.toLowerCase(), child]));
	const objInfo = lower.get("objinfo") || lower.get("objinfo") || lower.get(String.fromCharCode(3) + "objinfo");
	const ole10 = lower.get("ole10native") || lower.get("ole10native") || lower.get(String.fromCharCode(1) + "ole10native");
	const packageStream = lower.get("package") || lower.get("contents") || lower.get("content");
	const info = {
		entry,
		streams,
		displayName: entry.name,
		attachment: null,
		objectData: null
	};
	if (ole10) {
		const nativeInfo = parseOle10Native(cfb.getStream(ole10) || /* @__PURE__ */ new Uint8Array(0));
		if (nativeInfo) {
			const name = nativeInfo.label || nativeInfo.originalPath.split(/[\\/]/).pop() || `${entry.name}.bin`;
			const mime = detectAttachmentMime(name);
			const attachmentMeta = {
				...nativeInfo,
				sourceKind: "ole10-native"
			};
			info.attachment = {
				id: uniqueId("asset-ole"),
				type: "attachment",
				name,
				mime,
				bytes: nativeInfo.bytes,
				dataUrl: dataUrlFromBytes(nativeInfo.bytes, mime),
				meta: attachmentMeta
			};
			return info;
		}
	}
	if (packageStream) {
		const bytes = cfb.getStream(packageStream) || /* @__PURE__ */ new Uint8Array(0);
		const name = `${slugify(entry.name)}.bin`;
		const mime = detectAttachmentMime(name);
		info.attachment = {
			id: uniqueId("asset-pkg"),
			type: "attachment",
			name,
			mime,
			bytes,
			dataUrl: dataUrlFromBytes(bytes, mime),
			meta: {
				stream: packageStream.name,
				sourceKind: "package"
			}
		};
	}
	if (objInfo) info.objectData = cfb.getStream(objInfo) || /* @__PURE__ */ new Uint8Array(0);
	return info;
}
function extractObjectPool(cfb) {
	const objectPoolEntry = cfb.getEntry("/ObjectPool");
	if (!objectPoolEntry) return /* @__PURE__ */ new Map();
	const storages = cfb.listChildren(objectPoolEntry).filter((entry) => entry.objectType === 1);
	const map = /* @__PURE__ */ new Map();
	for (const storage of storages) map.set(storage.name, readObjectStorage(cfb, storage));
	return map;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/styles.js
var REPEATABLE_TABLE_PROPERTIES = /* @__PURE__ */ new Set([
	"insertCells",
	"deleteCells",
	"columnWidth",
	"merge",
	"split",
	"textFlow",
	"vertMerge",
	"vertAlign",
	"setShading",
	"defaultShading",
	"setBorder",
	"cellPadding",
	"cellSpacing",
	"cellWidth",
	"fitText",
	"cellNoWrap"
]);
function mergePropertyArrays(...arrays) {
	const map = /* @__PURE__ */ new Map();
	let sequence = 0;
	for (const array of arrays) for (const prop of array || []) {
		const repeatable = prop.kind === "table" && REPEATABLE_TABLE_PROPERTIES.has(prop.name);
		map.set(repeatable ? `${prop.kind}:${prop.name}:${sequence++}` : `${prop.kind}:${prop.name}`, prop);
	}
	return Array.from(map.values());
}
function splitPropertiesByKind(properties) {
	const out = {
		para: [],
		char: [],
		table: []
	};
	for (const prop of properties || []) if (prop.kind === "para") out.para.push(prop);
	else if (prop.kind === "char") out.char.push(prop);
	else if (prop.kind === "table") out.table.push(prop);
	return out;
}
function parseXstz(bytes, offset) {
	const reader = new BinaryReader(bytes);
	const cch = reader.u16(offset);
	const charsOffset = offset + 2;
	const byteLength = cch * 2;
	const text = reader.utf16le(charsOffset, byteLength);
	const end = charsOffset + byteLength + 2;
	return {
		value: text.replace(/\u0000+$/, ""),
		nextOffset: end
	};
}
function parseStdfBase(bytes, offset) {
	const reader = new BinaryReader(bytes);
	const w1 = reader.u16(offset);
	const w2 = reader.u16(offset + 2);
	const w3 = reader.u16(offset + 4);
	return {
		sti: w1 & 4095,
		flags1: w1 >> 12,
		stk: w2 & 15,
		istdBase: w2 >> 4 & 4095,
		cupx: w3 & 15,
		istdNext: w3 >> 4 & 4095,
		bchUpe: reader.u16(offset + 6),
		grfstd: reader.u16(offset + 8)
	};
}
function parseLpUpxPapx(bytes, offset) {
	const cbUpx = new BinaryReader(bytes).u16(offset);
	const start = offset + 2;
	const end = start + cbUpx;
	const papx = bytes.subarray(start, Math.min(end, bytes.length));
	let styleId = 0;
	let properties = [];
	if (papx.length >= 2) {
		styleId = papx[0] | (papx[1] ?? 0) << 8;
		properties = decodeGrpprl(papx, 2, papx.length);
	}
	return {
		cbUpx,
		styleId,
		properties,
		nextOffset: alignEven(end)
	};
}
function parseLpUpxChpx(bytes, offset) {
	const cbUpx = new BinaryReader(bytes).u16(offset);
	const start = offset + 2;
	const end = start + cbUpx;
	const chpx = bytes.subarray(start, Math.min(end, bytes.length));
	return {
		cbUpx,
		properties: decodeGrpprl(chpx, 0, chpx.length),
		nextOffset: alignEven(end)
	};
}
function parseLpUpxTapx(bytes, offset) {
	const cbUpx = new BinaryReader(bytes).u16(offset);
	const start = offset + 2;
	const end = start + cbUpx;
	const tapx = bytes.subarray(start, Math.min(end, bytes.length));
	return {
		cbUpx,
		properties: decodeGrpprl(tapx, 0, tapx.length),
		nextOffset: alignEven(end)
	};
}
function parseStyleStd(stdBytes, cbSTDBaseInFile, istd) {
	if (!stdBytes.length) return {
		istd,
		empty: true,
		name: "",
		stdfBase: {
			istdBase: 4095,
			istdNext: 0,
			stk: 1,
			cupx: 0
		},
		paraProps: [],
		charProps: [],
		tableProps: []
	};
	const baseSize = Math.max(10, Math.min(cbSTDBaseInFile || 10, stdBytes.length));
	const stdfBase = parseStdfBase(stdBytes, 0);
	let offset = baseSize;
	const nameInfo = parseXstz(stdBytes, offset);
	offset = nameInfo.nextOffset;
	let paraProps = [];
	let charProps = [];
	let tableProps = [];
	try {
		if (stdfBase.stk === 1) {
			if (stdfBase.cupx >= 1 && offset + 2 <= stdBytes.length) {
				const papx = parseLpUpxPapx(stdBytes, offset);
				paraProps = papx.properties;
				offset = papx.nextOffset;
			}
			if (stdfBase.cupx >= 2 && offset + 2 <= stdBytes.length) charProps = parseLpUpxChpx(stdBytes, offset).properties;
		} else if (stdfBase.stk === 2) {
			if (offset + 2 <= stdBytes.length) charProps = parseLpUpxChpx(stdBytes, offset).properties;
		} else if (stdfBase.stk === 3) {
			if (stdfBase.cupx >= 1 && offset + 2 <= stdBytes.length) {
				const tapx = parseLpUpxTapx(stdBytes, offset);
				tableProps = tapx.properties;
				offset = tapx.nextOffset;
			}
			if (stdfBase.cupx >= 2 && offset + 2 <= stdBytes.length) {
				const papx = parseLpUpxPapx(stdBytes, offset);
				paraProps = papx.properties;
				offset = papx.nextOffset;
			}
			if (stdfBase.cupx >= 3 && offset + 2 <= stdBytes.length) charProps = parseLpUpxChpx(stdBytes, offset).properties;
		}
	} catch {}
	return {
		istd,
		name: nameInfo.value,
		stdfBase,
		paraProps,
		charProps,
		tableProps,
		empty: false
	};
}
function parseStyles(tableBytes, fibRgFcLcb) {
	const fcStshf = fibRgFcLcb.fcStshf;
	const lcbStshf = fibRgFcLcb.lcbStshf;
	if (fcStshf == null || lcbStshf == null || lcbStshf <= 0) return {
		styles: /* @__PURE__ */ new Map(),
		header: null,
		resolveStyle(istd) {
			return resolveStyle(/* @__PURE__ */ new Map(), istd);
		}
	};
	const bytes = tableBytes.subarray(fcStshf, fcStshf + lcbStshf);
	const reader = new BinaryReader(bytes);
	const cbStshi = reader.u16(0);
	const stshiOffset = 2;
	const cstd = reader.u16(2);
	const cbSTDBaseInFile = reader.u16(4);
	const fontAt = (offset) => cbStshi >= offset + 2 && bytes.length >= stshiOffset + offset + 2 ? reader.i16(stshiOffset + offset) : -1;
	const header = {
		cbStshi,
		cstd,
		cbSTDBaseInFile,
		ftcAsci: fontAt(12),
		ftcFE: fontAt(14),
		ftcOther: fontAt(16)
	};
	let offset = 2 + cbStshi;
	const styles = /* @__PURE__ */ new Map();
	for (let istd = 0; istd < cstd && offset + 2 <= bytes.length; istd += 1) {
		const cbStd = reader.u16(offset);
		const stdStart = offset + 2;
		const stdEnd = stdStart + cbStd;
		if (cbStd === 0) {
			styles.set(istd, {
				istd,
				empty: true,
				name: "",
				stdfBase: {
					istdBase: 4095,
					istdNext: 0,
					stk: 1,
					cupx: 0
				},
				paraProps: [],
				charProps: [],
				tableProps: []
			});
			offset = alignEven(stdEnd);
			continue;
		}
		const style = parseStyleStd(bytes.subarray(stdStart, Math.min(stdEnd, bytes.length)), cbSTDBaseInFile, istd);
		styles.set(istd, style);
		offset = alignEven(stdEnd);
	}
	return {
		header,
		styles,
		resolveStyle(istd) {
			return resolveStyle(styles, istd);
		}
	};
}
function resolveStyle(styleMap, istd, seen = /* @__PURE__ */ new Set()) {
	if (istd == null || istd === 4095 || seen.has(istd)) return {
		paraProps: [],
		charProps: [],
		tableProps: [],
		styleIds: []
	};
	const style = styleMap.get(istd);
	if (!style || style.empty) return {
		paraProps: [],
		charProps: [],
		tableProps: [],
		styleIds: []
	};
	seen.add(istd);
	const baseResolved = resolveStyle(styleMap, style.stdfBase?.istdBase, seen);
	return {
		styleIds: [...baseResolved.styleIds, istd],
		paraProps: mergePropertyArrays(baseResolved.paraProps, style.paraProps),
		charProps: mergePropertyArrays(baseResolved.charProps, style.charProps),
		tableProps: mergePropertyArrays(baseResolved.tableProps, style.tableProps)
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/msdoc/parser.js
function getOverlappingRuns(runs, cpStart, cpEnd, cursorRef) {
	let cursor = cursorRef?.index || 0;
	while (cursor < runs.length && runs[cursor].cpEnd <= cpStart) cursor += 1;
	if (cursorRef) cursorRef.index = cursor;
	const list = [];
	let i = cursor;
	while (i < runs.length && runs[i].cpStart < cpEnd) {
		if (runs[i].cpEnd > cpStart) list.push(runs[i]);
		i += 1;
	}
	return list;
}
function normalizeTextStyleName(name) {
	return String(name || "").trim();
}
function decodeFieldInstruction(instruction) {
	const normalized = String(instruction || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
	if (!normalized) return null;
	const upper = normalized.toUpperCase();
	if (upper.startsWith("HYPERLINK")) {
		const body = normalized.slice(9).trim();
		const href = body.match(/"([^"]+)"/)?.[1] || body.split(/\s+/)[0] || "";
		return href ? {
			type: "hyperlink",
			href
		} : null;
	}
	if (upper.startsWith("INCLUDEPICTURE")) {
		const body = normalized.slice(14).trim();
		return {
			type: "includePicture",
			target: body.match(/"([^"]+)"/)?.[1] || body.split(/\s+/)[0] || ""
		};
	}
	if (upper.startsWith("EMBED")) return {
		type: "embed",
		raw: normalized
	};
	if (upper.startsWith("LINK")) return {
		type: "link",
		raw: normalized
	};
	return {
		type: "unknown",
		raw: normalized
	};
}
function mergeTextNode(target, node) {
	if (!node.text) return;
	const last = target[target.length - 1];
	if (last && last.type === "text" && last.href === node.href && shallowEqual(last.style, node.style)) {
		last.text += node.text;
		return;
	}
	target.push(node);
}
function emitInline(targetStack, output, node) {
	if (!node) return;
	const target = targetStack.length ? targetStack[targetStack.length - 1].nodes : output;
	if (node.type === "text") mergeTextNode(target, node);
	else target.push(node);
}
function getObjectPoolInfo(objectPool, pictureOffset) {
	const candidates = [
		`_${pictureOffset}`,
		`_${String(pictureOffset)}`,
		`_${pictureOffset.toString(16)}`,
		`_${pictureOffset.toString(16).toUpperCase()}`
	];
	for (const key of candidates) if (objectPool.has(key)) return objectPool.get(key) || null;
	return null;
}
function createAssetResolver(dataBytes, objectPool, assets, usedAttachmentNames, assetCache, options = {}) {
	return function resolveAsset(charState) {
		const pictureOffset = charState?.pictureOffset;
		if (pictureOffset == null) return null;
		if (assetCache.has(pictureOffset)) return assetCache.get(pictureOffset) || null;
		let asset = null;
		const objectInfo = getObjectPoolInfo(objectPool, pictureOffset);
		if ((charState.ole2 || charState.object || charState.data) && objectInfo?.attachment) {
			asset = objectInfo.attachment;
			usedAttachmentNames.add(objectInfo.entry.name);
		}
		if (!asset && dataBytes?.length) {
			const extracted = extractPictureAsset(dataBytes, pictureOffset, options);
			if (extracted && extracted.mime !== "application/octet-stream") asset = extracted;
			else if (!asset && objectInfo?.attachment) {
				asset = objectInfo.attachment;
				usedAttachmentNames.add(objectInfo.entry.name);
			} else if (extracted) asset = extracted;
		}
		if (!asset && objectInfo?.attachment) {
			asset = objectInfo.attachment;
			usedAttachmentNames.add(objectInfo.entry.name);
		}
		if (asset) assets.push(asset);
		assetCache.set(pictureOffset, asset);
		return asset;
	};
}
function normalizePlainTextChar(ch) {
	switch (ch) {
		case DOC_CONTROL.nonBreakingHyphen: return "-";
		case DOC_CONTROL.nonRequiredHyphen:
		case DOC_CONTROL.annotationRef:
		case DOC_CONTROL.textBoxPlaceholder: return "";
		default: return ch;
	}
}
function normalizeParagraphText(text) {
	return text.replaceAll(DOC_CONTROL.textBoxPlaceholder, "");
}
function getDocumentStoryRanges(fib, documentLength) {
	const storyLengths = [
		["main", fib.fibRgLw.ccpText],
		["footnote", fib.fibRgLw.ccpFtn],
		["header", fib.fibRgLw.ccpHdd],
		["macro", fib.fibRgLw.ccpMcr],
		["annotation", fib.fibRgLw.ccpAtn],
		["endnote", fib.fibRgLw.ccpEdn],
		["textbox", fib.fibRgLw.ccpTxbx],
		["header-textbox", fib.fibRgLw.ccpHdrTxbx]
	];
	if (!storyLengths.some(([, length]) => length > 0)) return [{
		kind: "main",
		cpStart: 0,
		cpEnd: documentLength
	}];
	const ranges = [];
	let cp = 0;
	for (const [kind, rawLength] of storyLengths) {
		const length = Math.max(0, rawLength || 0);
		const cpStart = Math.min(cp, documentLength);
		cp += length;
		const cpEnd = Math.min(cp, documentLength);
		ranges.push({
			kind,
			cpStart,
			cpEnd
		});
	}
	return ranges;
}
function buildStoryParagraphRanges(story, documentText, papxRuns) {
	if (story.cpEnd <= story.cpStart) return [];
	const runs = papxRuns.filter((run) => run.cpStart < story.cpEnd && run.cpEnd > story.cpStart);
	if (runs.length) return runs.map((run) => {
		const cpStart = Math.max(story.cpStart, run.cpStart);
		const cpEnd = Math.min(story.cpEnd, run.cpEnd);
		return {
			cpStart,
			cpEnd,
			terminator: documentText[cpEnd - 1] || "",
			styleId: run.styleId,
			properties: run.properties,
			storyKind: story.kind
		};
	}).filter((range) => range.cpEnd > range.cpStart);
	return splitParagraphRanges(documentText.slice(story.cpStart, story.cpEnd)).map((range) => ({
		...range,
		cpStart: range.cpStart + story.cpStart,
		cpEnd: range.cpEnd + story.cpStart,
		styleId: 0,
		properties: [],
		storyKind: story.kind
	}));
}
function buildInlineNodes(segments, resolveAsset) {
	const output = [];
	const fieldStack = [];
	for (const segment of segments) {
		if (!segment.text || segment.state.hidden) continue;
		for (const rawCh of segment.text) {
			const ch = normalizePlainTextChar(rawCh);
			if (ch === DOC_CONTROL.fieldStart) {
				fieldStack.push({
					instruction: "",
					parsed: null,
					readingInstruction: true,
					nodes: []
				});
				continue;
			}
			if (ch === DOC_CONTROL.fieldSeparator) {
				const current = fieldStack[fieldStack.length - 1];
				if (current) {
					current.parsed = decodeFieldInstruction(current.instruction);
					current.readingInstruction = false;
				}
				continue;
			}
			if (ch === DOC_CONTROL.fieldEnd) {
				const current = fieldStack.pop();
				if (!current) continue;
				let nodes = current.nodes;
				if (current.readingInstruction) current.parsed = decodeFieldInstruction(current.instruction);
				if (current.parsed?.type === "hyperlink") {
					const href = current.parsed.href;
					nodes = nodes.map((node) => {
						if (node.type === "lineBreak" || node.type === "pageBreak") return node;
						return {
							...node,
							href
						};
					});
				}
				for (const node of nodes) emitInline(fieldStack, output, node);
				continue;
			}
			const currentField = fieldStack[fieldStack.length - 1];
			if (currentField?.readingInstruction) {
				currentField.instruction += ch;
				continue;
			}
			if (ch === DOC_CONTROL.hardLineBreak) {
				emitInline(fieldStack, output, {
					type: "lineBreak",
					style: segment.state
				});
				continue;
			}
			if (ch === DOC_CONTROL.pageBreak) {
				emitInline(fieldStack, output, {
					type: "pageBreak",
					style: segment.state
				});
				continue;
			}
			if (ch === DOC_CONTROL.picture) {
				const asset = resolveAsset(segment.state);
				if (asset?.type === "image") emitInline(fieldStack, output, {
					type: "image",
					asset,
					style: segment.state
				});
				else if (asset?.type === "attachment") emitInline(fieldStack, output, {
					type: "attachment",
					asset,
					style: segment.state
				});
				continue;
			}
			emitInline(fieldStack, output, {
				type: "text",
				text: cleanTextControlChars(ch),
				style: segment.state
			});
		}
	}
	while (fieldStack.length) {
		const current = fieldStack.pop();
		for (const node of current.nodes) emitInline(fieldStack, output, node);
	}
	return output;
}
function resolveCharacterFonts(state, resolveFont, defaults) {
	for (const [id, name, fallback] of [
		[
			"fontFamilyId",
			"fontFamily",
			defaults?.ftcAsci
		],
		[
			"fontFamilyEastAsiaId",
			"fontFamilyEastAsia",
			defaults?.ftcFE
		],
		[
			"fontFamilyOtherId",
			"fontFamilyOther",
			defaults?.ftcOther
		],
		[
			"fontFamilyBiId",
			"fontFamilyBi",
			void 0
		]
	]) {
		const index = state[id] ?? fallback;
		const font = resolveFont(index);
		if (font) {
			state[id] = index;
			state[name] = font.name || font.altName || void 0;
		}
	}
}
function buildCharSegments(range, paragraphText, chpxRuns, styles, baseCharProps, resolveFont, cursorRef, forceReadableColors = false) {
	const overlaps = getOverlappingRuns(chpxRuns, range.cpStart, range.cpEnd, cursorRef);
	const boundaries = /* @__PURE__ */ new Set([range.cpStart, range.cpEnd]);
	for (const run of overlaps) {
		boundaries.add(Math.max(range.cpStart, run.cpStart));
		boundaries.add(Math.min(range.cpEnd, run.cpEnd));
	}
	const points = Array.from(boundaries).sort((a, b) => a - b);
	const segments = [];
	for (let i = 0; i < points.length - 1; i += 1) {
		const cpStart = points[i];
		const cpEnd = points[i + 1];
		if (cpEnd <= cpStart) continue;
		const directProps = overlaps.find((run) => run.cpStart <= cpStart && run.cpEnd >= cpEnd)?.properties || [];
		const directState = charPropsToState(directProps);
		const state = charPropsToState(mergePropertyArrays(baseCharProps, directState.charStyleId != null ? styles.resolveStyle(directState.charStyleId).charProps : [], directProps));
		if (forceReadableColors && state.colorIndex === 8) state.colorIndex = 1;
		resolveCharacterFonts(state, resolveFont, styles.header);
		const localStart = cpStart - range.cpStart;
		const localEnd = cpEnd - range.cpStart;
		const text = paragraphText.slice(localStart, localEnd);
		if (!text) continue;
		const last = segments[segments.length - 1];
		if (last && shallowEqual(last.state, state)) {
			last.text += text;
			last.cpEnd = cpEnd;
			continue;
		}
		segments.push({
			cpStart,
			cpEnd,
			text,
			state
		});
	}
	if (!segments.length && paragraphText) {
		const state = charPropsToState(baseCharProps);
		if (forceReadableColors && state.colorIndex === 8) state.colorIndex = 1;
		resolveCharacterFonts(state, resolveFont, styles.header);
		segments.push({
			cpStart: range.cpStart,
			cpEnd: range.cpEnd,
			text: paragraphText,
			state
		});
	}
	return segments;
}
function buildParagraphModel(range, paragraphText, styles, fonts, chpxRuns, resolveAsset, chpxCursor) {
	const directSplit = splitPropertiesByKind(range.properties || []);
	const paraStyleId = range.styleId || directSplit.para.find((item) => item.name === "styleId")?.value || 0;
	const paraStyle = styles.resolveStyle(paraStyleId);
	const paraProps = mergePropertyArrays(paraStyle.paraProps, directSplit.para);
	const paraState = paraPropsToState(paraProps);
	const directTableState = tablePropsToState(directSplit.table);
	const tableProps = mergePropertyArrays(directTableState.styleId != null ? styles.resolveStyle(directTableState.styleId).tableProps : [], directSplit.table);
	const tableState = tablePropsToState(tableProps);
	const baseCharProps = paraStyle.charProps;
	const resolveFont = (fontId) => fonts.byIndex(fontId);
	const segments = buildCharSegments(range, paragraphText, chpxRuns, styles, baseCharProps, resolveFont, chpxCursor, range.storyKind === "textbox" || range.storyKind === "header-textbox");
	const inlines = buildInlineNodes(segments, resolveAsset);
	const markState = range.terminator === DOC_CONTROL.paragraph ? buildCharSegments({
		...range,
		cpStart: range.cpEnd - 1
	}, range.terminator, chpxRuns, styles, baseCharProps, resolveFont, { index: chpxCursor.index })[0]?.state : void 0;
	return {
		id: uniqueId("para"),
		cpStart: range.cpStart,
		cpEnd: range.cpEnd,
		terminator: range.terminator || "",
		paragraphMark: markState && {
			revisionDeleted: markState.revisionDeleted,
			revisionInserted: markState.revisionInserted
		},
		storyKind: range.storyKind,
		text: paragraphText,
		rawProperties: range.properties || [],
		styleId: paraStyleId,
		styleName: normalizeTextStyleName(styles.styles.get(paraStyleId)?.name),
		paraProps,
		paraState,
		tableProps,
		tableState,
		segments,
		inlines
	};
}
function finalizeTableGrid(rows) {
	for (const row of rows) {
		row.cells.forEach((cell, index) => {
			cell.colIndex = index;
			cell.colspan = 1;
			cell.rowspan = 1;
			cell.hidden = false;
		});
		for (let i = 0; i < row.cells.length; i += 1) {
			const cell = row.cells[i];
			const merge = cell.meta?.merge || 0;
			if (merge === 1) continue;
			if (merge > 1) {
				let j = i + 1;
				while (j < row.cells.length && (row.cells[j].meta?.merge || 0) === 1) {
					row.cells[j].hidden = true;
					cell.colspan = (cell.colspan || 1) + 1;
					j += 1;
				}
				const lastCell = row.cells[j - 1];
				if (cell.meta && lastCell?.meta && lastCell !== cell) {
					cell.meta.rightBoundary = lastCell.meta.rightBoundary;
					if (cell.meta.leftBoundary != null && cell.meta.rightBoundary != null) cell.meta.width = Math.max(0, cell.meta.rightBoundary - cell.meta.leftBoundary);
					const rightBorder = lastCell.meta.borders?.right;
					if (rightBorder) cell.meta.borders = {
						...cell.meta.borders || {},
						right: rightBorder
					};
				}
			}
		}
	}
	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const row = rows[rowIndex];
		for (const cell of row.cells) {
			if (cell.hidden) continue;
			const vertMerge = cell.meta?.vertMerge || 0;
			if (vertMerge === 1) continue;
			if (vertMerge > 1) {
				let nextIndex = rowIndex + 1;
				while (nextIndex < rows.length) {
					let canMerge = true;
					for (let col = cell.colIndex || 0; col < (cell.colIndex || 0) + (cell.colspan || 1); col += 1) {
						const nextCell = rows[nextIndex].cells[col];
						if (!nextCell || (nextCell.meta?.vertMerge || 0) !== 1) {
							canMerge = false;
							break;
						}
					}
					if (!canMerge) break;
					for (let col = cell.colIndex || 0; col < (cell.colIndex || 0) + (cell.colspan || 1); col += 1) rows[nextIndex].cells[col].hidden = true;
					cell.rowspan = (cell.rowspan || 1) + 1;
					nextIndex += 1;
				}
				const bottomCell = rows[nextIndex - 1]?.cells[cell.colIndex || 0];
				const bottomBorder = bottomCell?.meta?.borders?.bottom;
				if (cell.meta && bottomCell?.meta && bottomCell !== cell && bottomBorder) cell.meta.borders = {
					...cell.meta.borders || {},
					bottom: bottomBorder
				};
			}
		}
	}
	const boundaries = Array.from(new Set(rows.flatMap((row) => row.cells.flatMap((cell) => {
		return [cell.meta?.leftBoundary, cell.meta?.rightBoundary].filter((value) => value != null);
	})))).sort((left, right) => left - right);
	if (boundaries.length > 1) for (const row of rows) for (const cell of row.cells) {
		if (!cell.meta) continue;
		const leftIndex = boundaries.indexOf(cell.meta.leftBoundary ?? NaN);
		const rightIndex = boundaries.indexOf(cell.meta.rightBoundary ?? NaN);
		if (leftIndex >= 0) cell.colIndex = leftIndex;
		if (!cell.hidden && leftIndex >= 0 && rightIndex > leftIndex) cell.colspan = rightIndex - leftIndex;
	}
}
function resolveTableGridBorders(rows) {
	const hasOwnBorder = (borders, side) => Object.prototype.hasOwnProperty.call(borders, side) && (() => {
		const border = borders[side];
		return Boolean(border?.nil || border?.borderType);
	})();
	rows.forEach((row, rowIndex) => {
		row.cells.forEach((cell) => {
			if (cell.hidden || !cell.meta) return;
			const explicit = { ...cell.meta.borders || {} };
			const table = row.state.borders || {};
			const startColumn = cell.colIndex || 0;
			const endColumn = startColumn + (cell.colspan || 1);
			const endRow = rowIndex + (cell.rowspan || 1);
			const assignFallback = (side, border) => {
				if (!hasOwnBorder(explicit, side) && border) explicit[side] = border;
			};
			assignFallback("top", rowIndex === 0 ? table.top : table.horizontalInside);
			assignFallback("bottom", endRow >= rows.length ? table.bottom : table.horizontalInside);
			assignFallback("left", startColumn === 0 ? table.left : table.verticalInside);
			assignFallback("right", endColumn >= row.cells.length ? table.right : table.verticalInside);
			cell.meta.borders = explicit;
		});
	});
}
function paragraphToBlock(paragraph) {
	return {
		type: "paragraph",
		id: paragraph.id,
		styleId: paragraph.styleId,
		styleName: paragraph.styleName,
		paraState: paragraph.paraState,
		inlines: paragraph.inlines,
		text: paragraph.text,
		paragraphMark: paragraph.paragraphMark,
		storyKind: paragraph.storyKind
	};
}
function tableGridSignature(paragraph) {
	const cells = applyTableStateToCells(paragraph.tableState);
	if (!cells.length) return "";
	const state = paragraph.tableState;
	const border = (side) => {
		const value = state.borders?.[side];
		return `${value?.borderType ?? ""}:${value?.lineWidth ?? ""}:${value?.nil ? 1 : 0}`;
	};
	return [
		cells[0]?.leftBoundary ?? "",
		cells[cells.length - 1]?.rightBoundary ?? "",
		state.alignment ?? "",
		state.leftIndent ?? "",
		state.gapHalf ?? "",
		state.rtl ? 1 : 0,
		border("top"),
		border("left"),
		border("bottom"),
		border("right"),
		border("horizontalInside"),
		border("verticalInside")
	].join("|");
}
function inheritRowEndTableState(paragraph, rowEnd) {
	paragraph.paraState.inTable = true;
	paragraph.paraState.itap = Math.max(rowEnd.paraState.itap || 1, paragraph.paraState.itap || 0);
	paragraph.tableState = rowEnd.tableState;
	paragraph.tableProps = rowEnd.tableProps;
}
function normalizeRowEndOnlyTables(paragraphs) {
	for (let index = 0; index < paragraphs.length; index += 1) {
		const rowEnd = paragraphs[index];
		const cellCount = applyTableStateToCells(rowEnd.tableState).length;
		if (!rowEnd.paraState.tableRowEnd || !cellCount) continue;
		rowEnd.paraState.inTable = true;
		rowEnd.paraState.itap = Math.max(1, rowEnd.paraState.itap || 0);
		let remainingCells = cellCount;
		let cursor = index - 1;
		const rowParagraphs = [];
		for (; cursor >= 0 && remainingCells > 0; cursor -= 1) {
			const paragraph = paragraphs[cursor];
			if (paragraph.paraState.tableRowEnd || paragraph.paraState.innerTableRowEnd) break;
			rowParagraphs.push(paragraph);
			if (paragraph.terminator === DOC_CONTROL.cellMark) remainingCells -= 1;
		}
		if (remainingCells > 0) continue;
		let previousRowEndIndex = cursor;
		while (previousRowEndIndex >= 0 && !paragraphs[previousRowEndIndex].paraState.tableRowEnd && !paragraphs[previousRowEndIndex].paraState.innerTableRowEnd && paragraphs[previousRowEndIndex].terminator !== DOC_CONTROL.cellMark) previousRowEndIndex -= 1;
		const previousRowEnd = paragraphs[previousRowEndIndex];
		if (previousRowEnd?.paraState.tableRowEnd && tableGridSignature(previousRowEnd) === tableGridSignature(rowEnd)) for (let leading = previousRowEndIndex + 1; leading < index; leading += 1) {
			const paragraph = paragraphs[leading];
			if (!rowParagraphs.includes(paragraph)) rowParagraphs.push(paragraph);
		}
		rowParagraphs.forEach((paragraph) => inheritRowEndTableState(paragraph, rowEnd));
	}
}
function buildTableBlock(tableParagraphs) {
	const rows = [];
	let pendingRow = { cells: [] };
	let pendingCellParagraphs = [];
	for (const paragraph of tableParagraphs) {
		pendingCellParagraphs.push(paragraph);
		if (paragraph.terminator === DOC_CONTROL.cellMark) {
			pendingRow.cells.push({
				id: uniqueId("cell"),
				paragraphs: pendingCellParagraphs.map(paragraphToBlock),
				meta: null
			});
			pendingCellParagraphs = [];
			if (paragraph.paraState.tableRowEnd || paragraph.paraState.innerTableRowEnd) {
				const cellDefs = applyTableStateToCells(paragraph.tableState);
				while (cellDefs.length && pendingRow.cells.length > cellDefs.length && pendingRow.cells[pendingRow.cells.length - 1].paragraphs.every((block) => !block.text && !(block.inlines || []).length)) pendingRow.cells.pop();
				pendingRow.cells.forEach((cell, index) => {
					cell.meta = cellDefs[index] || { index };
				});
				const gridWidthTwips = cellDefs.length ? (cellDefs[cellDefs.length - 1].rightBoundary || 0) - (cellDefs[0].leftBoundary || 0) : 0;
				rows.push({
					id: uniqueId("row"),
					cells: pendingRow.cells,
					state: paragraph.tableState,
					gridWidthTwips
				});
				pendingRow = { cells: [] };
			}
		}
	}
	if (pendingCellParagraphs.length) pendingRow.cells.push({
		id: uniqueId("cell"),
		paragraphs: pendingCellParagraphs.map(paragraphToBlock),
		meta: null
	});
	if (pendingRow.cells.length) rows.push({
		id: uniqueId("row"),
		cells: pendingRow.cells,
		state: tableParagraphs[0]?.tableState || tablePropsToState([]),
		gridWidthTwips: 0
	});
	finalizeTableGrid(rows);
	resolveTableGridBorders(rows);
	const gridWidthTwips = rows.find((row) => row.gridWidthTwips)?.gridWidthTwips || 0;
	const depth = Math.max(...tableParagraphs.map((paragraph) => getTableDepth(paragraph.paraState)), 1);
	return {
		type: "table",
		id: uniqueId("table"),
		depth,
		rows,
		state: rows[0]?.state || tablePropsToState([]),
		gridWidthTwips
	};
}
function buildBlocks(paragraphs) {
	const blocks = [];
	let index = 0;
	while (index < paragraphs.length) {
		const paragraph = paragraphs[index];
		if (getTableDepth(paragraph.paraState) <= 0) {
			blocks.push(paragraphToBlock(paragraph));
			index += 1;
			continue;
		}
		const tableParagraphs = [];
		while (index < paragraphs.length && getTableDepth(paragraphs[index].paraState) > 0) {
			tableParagraphs.push(paragraphs[index]);
			index += 1;
		}
		blocks.push(buildTableBlock(tableParagraphs));
	}
	return blocks;
}
/**
* Main MS-DOC entry point.
* It parses the OLE container, restores text through the piece table, resolves
* paragraph/character/table properties, and finally produces a normalized AST
* that the HTML renderer can consume.
*/
function parseMsDoc(input, options = {}) {
	const warnings = [];
	const cfb = parseCFB(input, options);
	warnings.push(...cfb.warnings || []);
	const wordBytes = cfb.getStream("/WordDocument");
	if (!wordBytes) throw new Error("Missing WordDocument stream");
	const htmlDocument = parseHtmlWordDocumentStream(wordBytes);
	if (htmlDocument) {
		htmlDocument.warnings.unshift(...cfb.warnings || []);
		return htmlDocument;
	}
	const fib = parseFib(wordBytes);
	if (fib.base.wIdent !== 42476) pushWarning(warnings, `Unexpected FIB identifier: 0x${fib.base.wIdent.toString(16)}`);
	if (fib.base.fEncrypted) throw new Error("Encrypted .doc files are not supported yet");
	const tableBytes = cfb.getStream(fib.base.fWhichTblStm ? "/1Table" : "/0Table");
	if (!tableBytes) throw new Error("Missing table stream");
	const dataBytes = cfb.getStream("/Data") || /* @__PURE__ */ new Uint8Array(0);
	const clx = parseClx(tableBytes, fib.fibRgFcLcb);
	const pieceTexts = buildPieceTextCache(wordBytes, clx);
	const documentText = pieceTexts.join("");
	const stories = getDocumentStoryRanges(fib, documentText.length);
	const mainStory = stories.find((story) => story.kind === "main") || {
		kind: "main",
		cpStart: 0,
		cpEnd: documentText.length
	};
	const supplementalTextStories = stories.filter((story) => (story.kind === "textbox" || story.kind === "header-textbox") && normalizeParagraphText(documentText.slice(story.cpStart, story.cpEnd)).replace(/[\r\u0007]/g, "").trim().length > 0);
	const styles = parseStyles(tableBytes, fib.fibRgFcLcb);
	const fonts = parseFonts(tableBytes, fib.fibRgFcLcb);
	const relevantStoryEnd = Math.max(mainStory.cpEnd, ...supplementalTextStories.map((story) => story.cpEnd));
	const chpxRuns = readChpxRuns(wordBytes, tableBytes, fib, clx).filter((run) => run.cpStart < relevantStoryEnd).map((run) => ({
		...run,
		cpEnd: Math.min(run.cpEnd, relevantStoryEnd)
	}));
	const papxRuns = readPapxRuns(wordBytes, tableBytes, fib, clx, dataBytes).filter((run) => run.cpStart < relevantStoryEnd).map((run) => ({
		...run,
		cpEnd: Math.min(run.cpEnd, relevantStoryEnd)
	}));
	const ranges = [mainStory, ...supplementalTextStories].flatMap((story) => buildStoryParagraphRanges(story, documentText, papxRuns));
	if (supplementalTextStories.length) pushWarning(warnings, "Recovered text from a legacy Word text-box story; text-box positioning is unavailable, so the content was linearized after the main story.", {
		code: "MSDOC_TEXTBOX_STORY_LINEARIZED",
		storyCount: supplementalTextStories.length
	});
	const objectPool = extractObjectPool(cfb);
	const assets = [];
	const usedAttachmentNames = /* @__PURE__ */ new Set();
	const resolveAsset = createAssetResolver(dataBytes, objectPool, assets, usedAttachmentNames, /* @__PURE__ */ new Map(), options);
	const chpxCursor = { index: 0 };
	const paragraphs = ranges.flatMap((range) => {
		const rawParagraphText = getTextByCp(wordBytes, clx, pieceTexts, range.cpStart, range.cpEnd);
		const terminator = range.terminator === DOC_CONTROL.paragraph || range.terminator === DOC_CONTROL.cellMark ? range.terminator : "";
		const rawContent = terminator && rawParagraphText.endsWith(terminator) ? rawParagraphText.slice(0, -1) : rawParagraphText;
		const paragraphText = normalizeParagraphText(rawContent);
		const isTextBoxStory = range.storyKind === "textbox" || range.storyKind === "header-textbox";
		if ((rawContent.includes(DOC_CONTROL.textBoxPlaceholder) || isTextBoxStory) && !paragraphText.trim()) return [];
		return [buildParagraphModel({
			...range,
			terminator
		}, paragraphText, styles, fonts, chpxRuns, resolveAsset, chpxCursor)];
	});
	normalizeRowEndOnlyTables(paragraphs);
	const blocks = buildBlocks(paragraphs);
	const trailingAttachments = Array.from(objectPool.values()).filter((item) => item?.attachment && !usedAttachmentNames.has(item.entry.name)).map((item) => item.attachment);
	for (const attachment of trailingAttachments) assets.push(attachment);
	if (trailingAttachments.length) blocks.push({
		type: "attachments",
		id: uniqueId("attachments"),
		items: trailingAttachments
	});
	return {
		kind: "msdoc",
		version: 1,
		warnings,
		meta: {
			fib: {
				wIdent: fib.base.wIdent,
				nFib: fib.base.nFib,
				fWhichTblStm: fib.base.fWhichTblStm,
				fComplex: fib.base.fComplex,
				fEncrypted: fib.base.fEncrypted,
				ccpText: fib.fibRgLw.ccpText
			},
			counts: {
				paragraphs: paragraphs.length,
				blocks: blocks.length,
				assets: assets.length,
				styles: styles.styles.size,
				fonts: fonts.fonts.length
			}
		},
		fonts: fonts.fonts,
		styles: Array.from(styles.styles.values()).map((style) => ({
			istd: style.istd,
			name: style.name,
			type: style.stdfBase?.stk,
			basedOn: style.stdfBase?.istdBase,
			next: style.stdfBase?.istdNext
		})),
		blocks,
		assets
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/render/fonts.js
var EAST_ASIAN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303f\uff00-\uffef]/u;
var INHERIT_FONT = /[\p{Mark}\u200c\u200d]/u;
function textFontRuns(text, style) {
	if (!text) return [];
	if (style.rtl && style.fontFamilyBi) return [{
		text,
		fontFamily: style.fontFamilyBi
	}];
	const base = style.fontFamily;
	const eastAsia = style.fontFamilyEastAsia || base;
	const other = style.fontFamilyOther || base;
	if (eastAsia === base && other === base) return [{
		text,
		fontFamily: base
	}];
	const runs = [];
	for (const character of text) {
		const previous = runs[runs.length - 1];
		const fontFamily = previous && INHERIT_FONT.test(character) ? previous.fontFamily : EAST_ASIAN.test(character) ? eastAsia : character.codePointAt(0) < 128 ? base : other;
		if (previous && previous.fontFamily === fontFamily) previous.text += character;
		else runs.push({
			text: character,
			fontFamily
		});
	}
	return runs;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/render/html.js
var COLOR_INDEX_MAP = {
	1: "#000000",
	2: "#0000ff",
	3: "#00ffff",
	4: "#00ff00",
	5: "#ff00ff",
	6: "#ff0000",
	7: "#ffff00",
	8: "#ffffff",
	9: "#000080",
	10: "#008080",
	11: "#008000",
	12: "#800080",
	13: "#800000",
	14: "#808000",
	15: "#808080",
	16: "#c0c0c0"
};
function styleObjectToCss(style) {
	return Object.entries(style).filter(([, value]) => value != null && value !== "").map(([key, value]) => `${key}:${escapeHtml(value)}`).join(";");
}
function quoteCssString(value) {
	return `'${String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\n\r\f]/g, " ").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")}'`;
}
/**
* Normalizes a document-provided hyperlink before it reaches generated HTML.
* Internal bookmarks always remain available. External navigation is opt-in
* and is still restricted to browser-safe schemes and relative paths.
*/
function sanitizeMsDocLinkHref(href, policy = "block") {
	const value = String(href ?? "").replace(/[\u0000-\u0020\u007f-\u009f]/g, "").trim();
	if (!value) return null;
	if (value.startsWith("#")) return value;
	if (policy !== "allow") return null;
	if (/^(?:https?:|mailto:|tel:)/i.test(value)) return value;
	if (value.startsWith("//") || value.includes("\\")) return null;
	if (/^(?:\/|\.\/|\.\.\/)/.test(value) && !value.startsWith("//")) return value;
	if (!/^[a-z][a-z\d+.-]*:/i.test(value)) return value;
	return null;
}
function renderLink(content, href) {
	if (!href) return content;
	const escapedHref = escapeHtml(href);
	if (href.startsWith("#")) return `<a class="msdoc-link" href="${escapedHref}">${content}</a>`;
	return `<a class="msdoc-link" href="${escapedHref}" target="_blank" rel="noreferrer noopener">${content}</a>`;
}
function borderToCss(border) {
	if (!border || border.nil) return null;
	const borderType = border.borderType;
	if (!borderType) return null;
	const lineWidth = Math.max(2, border.lineWidth || 0);
	const widthPoints = borderType >= 64 ? lineWidth : lineWidth / 8;
	const width = Math.max(1, Math.round(widthPoints * (96 / 72)));
	const style = borderType === 3 ? "double" : borderType === 6 ? "dotted" : [
		7,
		8,
		9
	].includes(borderType) ? "dashed" : "solid";
	const colorIndex = border.color;
	return `${width}px ${style} ${border.colorRef != null ? colorRefToCss(border.colorRef) : COLOR_INDEX_MAP[colorIndex || 1] || "#000000"}`;
}
function colorRefToCss(colorRef) {
	if (colorRef == null || colorRef >>> 24 === 255) return "#000000";
	return `#${[
		colorRef & 255,
		colorRef >>> 8 & 255,
		colorRef >>> 16 & 255
	].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
var SHADING_PERCENT = {
	2: 5,
	3: 10,
	4: 20,
	5: 25,
	6: 30,
	7: 40,
	8: 50,
	9: 60,
	10: 70,
	11: 75,
	12: 80,
	13: 90
};
function mixHexColors(foreground, background, percent) {
	const channel = (color, offset) => Number.parseInt(color.slice(offset, offset + 2), 16);
	const ratio = Math.max(0, Math.min(100, percent)) / 100;
	return `#${[
		1,
		3,
		5
	].map((offset) => Math.round(channel(foreground, offset) * ratio + channel(background, offset) * (1 - ratio))).map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
function shadingToCss(shading) {
	if (!shading || shading.nil || shading.auto || shading.pattern === 0) return {};
	const foreground = shading.foregroundColorRef != null ? colorRefToCss(shading.foregroundColorRef) : COLOR_INDEX_MAP[shading.foregroundColorIndex || 1] || "#000000";
	const background = shading.backgroundColorRef != null ? colorRefToCss(shading.backgroundColorRef) : COLOR_INDEX_MAP[shading.backgroundColorIndex || 8] || "#ffffff";
	if (shading.pattern === 1) return { "background-color": foreground };
	if (SHADING_PERCENT[shading.pattern] != null) return { "background-color": mixHexColors(foreground, background, SHADING_PERCENT[shading.pattern]) };
	const stripe = shading.pattern === 14 || shading.pattern === 20 ? `repeating-linear-gradient(0deg,${foreground} 0 1px,transparent 1px 4px)` : shading.pattern === 15 || shading.pattern === 21 ? `repeating-linear-gradient(90deg,${foreground} 0 1px,transparent 1px 4px)` : shading.pattern === 16 || shading.pattern === 22 ? `repeating-linear-gradient(45deg,${foreground} 0 1px,transparent 1px 5px)` : shading.pattern === 17 || shading.pattern === 23 ? `repeating-linear-gradient(-45deg,${foreground} 0 1px,transparent 1px 5px)` : null;
	return stripe ? {
		"background-color": background,
		"background-image": stripe
	} : { "background-color": background };
}
function paragraphStyleToCss(paraState) {
	const style = { "text-align": cssTextAlign(paraState.alignment) };
	const marginTop = twipsToPx(paraState.spacingBefore);
	const marginBottom = twipsToPx(paraState.spacingAfter);
	const marginLeft = twipsToPx(paraState.leftIndent);
	const marginRight = twipsToPx(paraState.rightIndent);
	const textIndent = twipsToPx(paraState.firstLineIndent);
	if (marginTop) style["margin-top"] = `${marginTop}px`;
	if (marginBottom) style["margin-bottom"] = `${marginBottom}px`;
	if (marginLeft) style["margin-left"] = `${marginLeft}px`;
	if (marginRight) style["margin-right"] = `${marginRight}px`;
	if (textIndent) style["text-indent"] = `${textIndent}px`;
	if (paraState.lineSpacing) if (paraState.lineSpacingRule === "exact" || paraState.lineSpacingRule === "atLeast") style["line-height"] = `${twipsToPx(Math.abs(paraState.lineSpacing))}px`;
	else {
		const multiple = Math.abs(paraState.lineSpacing) / 240;
		style["line-height"] = multiple === 1 ? "normal" : String(multiple);
	}
	if (paraState.keepLines) style["break-inside"] = "avoid";
	if (paraState.keepNext) style["break-after"] = "avoid";
	if (paraState.pageBreakBefore) style["break-before"] = "page";
	if (paraState.rtlPara) style.direction = "rtl";
	const top = borderToCss(paraState.borders?.top);
	const right = borderToCss(paraState.borders?.right);
	const bottom = borderToCss(paraState.borders?.bottom);
	const left = borderToCss(paraState.borders?.left);
	if (top) style["border-top"] = top;
	if (right) style["border-inline-end"] = right;
	if (bottom) style["border-bottom"] = bottom;
	if (left) style["border-inline-start"] = left;
	return style;
}
function buildUnderlineStyle(underline) {
	const wordStyle = cssUnderline(underline);
	if (!underline || wordStyle === "none") return {};
	const css = { "text-decoration-line": "underline" };
	if (wordStyle === "double" || wordStyle === "wavy-double") css["text-decoration-style"] = "double";
	else if (wordStyle.includes("dot") || wordStyle === "dotted-heavy") css["text-decoration-style"] = "dotted";
	else if (wordStyle.includes("dash")) css["text-decoration-style"] = "dashed";
	else if (wordStyle.includes("wave") || wordStyle.includes("wavy")) css["text-decoration-style"] = "wavy";
	else css["text-decoration-style"] = "solid";
	return css;
}
function inlineStyleToCss(styleState) {
	const style = {};
	if (styleState.bold || styleState.boldBi) style["font-weight"] = "700";
	if (styleState.italic || styleState.italicBi) style["font-style"] = "italic";
	if (styleState.strike || styleState.doubleStrike) style["text-decoration-line"] = `${style["text-decoration-line"] ? `${style["text-decoration-line"]} ` : ""}line-through`;
	Object.assign(style, buildUnderlineStyle(styleState.underline));
	if (styleState.fontSizeHalfPoints) style["font-size"] = `${styleState.fontSizeHalfPoints / 2}pt`;
	if (styleState.fontFamily) style["font-family"] = `${quoteCssString(styleState.fontFamily)},sans-serif`;
	if (styleState.colorIndex && COLOR_INDEX_MAP[styleState.colorIndex]) style.color = COLOR_INDEX_MAP[styleState.colorIndex];
	const highlightIndex = typeof styleState.highlight === "number" ? styleState.highlight : styleState.highlight?.index;
	if (highlightIndex && HIGHLIGHT_COLORS[highlightIndex]) style["background-color"] = HIGHLIGHT_COLORS[highlightIndex];
	if (styleState.smallCaps) style["font-variant-caps"] = "small-caps";
	if (styleState.caps) style["text-transform"] = "uppercase";
	if (styleState.scale && styleState.scale !== 100) {
		style.display = "inline-block";
		style.transform = `scaleX(${styleState.scale / 100})`;
		style["transform-origin"] = "left center";
	}
	if (styleState.positionHalfPoints > 0) style["vertical-align"] = "super";
	if (styleState.positionHalfPoints < 0) style["vertical-align"] = "sub";
	if (styleState.outline) style["text-shadow"] = "0 0 0.02em currentColor";
	if (styleState.shadow || styleState.emboss || styleState.imprint) style["text-shadow"] = style["text-shadow"] ? `${style["text-shadow"]}, 0.06em 0.06em 0.08em rgba(0,0,0,.25)` : "0.06em 0.06em 0.08em rgba(0,0,0,.25)";
	if (styleState.rtl) style.direction = "rtl";
	return style;
}
function renderTextNode(node, context) {
	if (context.reviewMode === "final" && node.style.revisionDeleted) return "";
	if (context.reviewMode === "original" && node.style.revisionInserted) return "";
	const content = textFontRuns(node.text, node.style).map((run) => {
		const text = escapeHtml(run.text);
		if (!run.fontFamily || run.fontFamily === node.style.fontFamily) return text;
		return `<span style="${styleObjectToCss({ "font-family": `${quoteCssString(run.fontFamily)},sans-serif` })}">${text}</span>`;
	}).join("");
	const inlineStyle = inlineStyleToCss(node.style);
	inlineStyle["white-space"] = "break-spaces";
	const revision = context.reviewMode === "all" ? node.style.revisionDeleted ? "delete" : node.style.revisionInserted ? "insert" : null : null;
	if (revision) {
		inlineStyle.color = "#c62828";
		inlineStyle["text-decoration-line"] = revision === "delete" ? "line-through" : "underline";
	}
	const style = styleObjectToCss(inlineStyle);
	const tag = revision === "delete" ? "del" : revision === "insert" ? "ins" : "span";
	return renderLink(`<${tag}${revision ? ` data-msdoc-change="${revision}"` : ""}${style ? ` style="${style}"` : ""}>${content}</${tag}>`, sanitizeMsDocLinkHref(node.href, context.externalLinkPolicy));
}
function inlineImageDisplaySizePx(asset) {
	const widthPx = twipsToPx(asset.meta?.displayWidthTwips);
	const heightPx = twipsToPx(asset.meta?.displayHeightTwips);
	return {
		widthPx: widthPx && widthPx > 0 ? widthPx : void 0,
		heightPx: heightPx && heightPx > 0 ? heightPx : void 0
	};
}
function applyInlineImageDisplaySize(style, asset) {
	const { widthPx, heightPx } = inlineImageDisplaySizePx(asset);
	if (!widthPx && !heightPx) return;
	if (widthPx) style.width = `${widthPx}px`;
	if (heightPx) style.height = `${heightPx}px`;
}
var SAFE_RASTER_IMAGE_DATA_URL = /^data:image\/(?:avif|bmp|gif|jpeg|png|webp|x-icon);base64,[a-z\d+/=]+$/i;
function decodeBase64Text(value) {
	try {
		const bufferCtor = globalThis.Buffer;
		if (bufferCtor) return bufferCtor.from(value, "base64").toString("utf8");
		if (typeof atob !== "function") return null;
		const binary = atob(value);
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	} catch {
		return null;
	}
}
function isSafeSvgImageDataUrl(value) {
	const match = /^data:image\/svg\+xml;base64,([a-z\d+/=]+)$/i.exec(value);
	if (!match || match[1].length > 8388608) return false;
	const svg = decodeBase64Text(match[1]);
	if (!svg || !/^\s*<svg(?:\s|>)/i.test(svg)) return false;
	if (/<\/?(?:script|style|foreignObject|iframe|object|embed|form|link)\b/i.test(svg)) return false;
	if (/<!\s*(?:doctype|entity)\b/i.test(svg) || /\son[a-z\d_-]+\s*=/i.test(svg)) return false;
	if (svg.includes("\\") || svg.includes("/*") || /@import\b/i.test(svg)) return false;
	if (/url\s*\(\s*(?!["']?#[A-Za-z0-9_.:-]+["']?\s*\))/i.test(svg)) return false;
	for (const resource of svg.matchAll(/\s(?:href|xlink:href|src)\s*=\s*(["'])([\s\S]*?)\1/gi)) {
		const target = String(resource[2] || "").replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
		if (!/^#[A-Za-z0-9_.:-]+$/.test(target) && !SAFE_RASTER_IMAGE_DATA_URL.test(target)) return false;
	}
	return true;
}
function sanitizeImageSource(src, policy, allowGeneratedVector = false) {
	const value = String(src || "").replace(/[\u0000-\u0020\u007f-\u009f]/g, "").trim();
	if (!value) return null;
	if (SAFE_RASTER_IMAGE_DATA_URL.test(value)) return value;
	if (allowGeneratedVector && isSafeSvgImageDataUrl(value)) return value;
	if (/^blob:/i.test(value)) return value;
	if (policy !== "allow") return null;
	if (/^https?:/i.test(value)) return value;
	if (value.startsWith("//") || value.startsWith("\\")) return null;
	if (!/^[a-z][a-z\d+.-]*:/i.test(value) && !value.startsWith("\\")) return value;
	return null;
}
function sanitizeDownloadHref(href) {
	const value = String(href ?? "").trim();
	if (!value) return null;
	const dataUrl = /^data:([^;,]+);base64,([a-z\d+/=\s]+)$/i.exec(value);
	if (!dataUrl) return null;
	const mimeType = dataUrl[1].trim().toLowerCase();
	if (/^(?:text\/(?:html|javascript)|application\/(?:javascript|xhtml\+xml|xml)|image\/svg\+xml)$/.test(mimeType)) return null;
	if (mimeType.endsWith("+xml")) return null;
	return value;
}
function sanitizeAssetHref(href, context) {
	const downloadHref = sanitizeDownloadHref(href);
	if (downloadHref) return downloadHref;
	const value = sanitizeMsDocLinkHref(href, context.externalLinkPolicy);
	if (value && !value.startsWith("#")) return value;
	return null;
}
function renderImageNode(node, context) {
	const allowGeneratedVector = node.asset.meta?.vectorConverted === true;
	const src = sanitizeImageSource(node.asset.sourceUrl, context.externalResourcePolicy, allowGeneratedVector) || sanitizeImageSource(node.asset.dataUrl, context.externalResourcePolicy, allowGeneratedVector);
	const baseStyle = inlineStyleToCss(node.style);
	const displaySize = inlineImageDisplaySizePx(node.asset);
	if (displaySize.widthPx || displaySize.heightPx) {
		applyInlineImageDisplaySize(baseStyle, node.asset);
		baseStyle["max-width"] = "none";
		if (!displaySize.heightPx) baseStyle.height = "auto";
	} else {
		baseStyle["max-width"] = "100%";
		baseStyle.height = "auto";
	}
	if (!src || node.asset.displayable === false) {
		const fallbackHref = sanitizeAssetHref(node.asset.dataUrl, context) || sanitizeAssetHref(node.asset.sourceUrl, context);
		const label = escapeHtml(String(node.asset.meta?.linkedPath || node.asset.mime || "image"));
		return renderLink(fallbackHref ? `<a class="msdoc-attachment msdoc-image-fallback" href="${escapeHtml(fallbackHref)}" target="_blank" rel="noreferrer noopener">🖼 ${label}</a>` : `<span class="msdoc-image-fallback">🖼 ${label}</span>`, sanitizeMsDocLinkHref(node.href, context.externalLinkPolicy));
	}
	return renderLink(`<img class="msdoc-image" src="${escapeHtml(src)}" alt="" style="${styleObjectToCss(baseStyle)}">`, sanitizeMsDocLinkHref(node.href, context.externalLinkPolicy));
}
function renderAttachmentNode(node, context) {
	const label = escapeHtml(node.asset.name || "embedded-file");
	const downloadHref = sanitizeDownloadHref(node.asset.dataUrl);
	const inner = downloadHref ? `<a class="msdoc-attachment" href="${escapeHtml(downloadHref)}" download="${label}">📎 ${label}</a>` : `<span class="msdoc-attachment">📎 ${label}</span>`;
	const href = sanitizeMsDocLinkHref(node.href, context.externalLinkPolicy);
	return href ? `<span class="msdoc-inline-group">${inner}${renderLink("↗", href)}</span>` : inner;
}
function renderInlineNodes(nodes, context) {
	return nodes.map((node) => {
		if (hiddenRevision(node.style, context)) return "";
		if (node.type === "text") return renderTextNode(node, context);
		if (node.type === "image") return renderImageNode(node, context);
		if (node.type === "attachment") return renderAttachmentNode(node, context);
		if (node.type === "lineBreak") return "<br>";
		if (node.type === "pageBreak") return "<span class=\"msdoc-page-break\"></span>";
		return "";
	}).join("");
}
function hiddenRevision(revision, context) {
	return !!(context.reviewMode === "final" && revision?.revisionDeleted || context.reviewMode === "original" && revision?.revisionInserted);
}
function reviewParagraphs(paragraphs, context) {
	const result = [];
	for (const paragraph of paragraphs) {
		const previous = result[result.length - 1];
		if (previous && previous.storyKind === paragraph.storyKind && hiddenRevision(previous.paragraphMark, context)) result[result.length - 1] = {
			...paragraph,
			inlines: [...previous.inlines, ...paragraph.inlines],
			text: previous.text + paragraph.text
		};
		else result.push(paragraph);
	}
	return result;
}
function renderParagraphBlock(block, context, options = {}) {
	const tag = options.inline ? "div" : "p";
	const style = styleObjectToCss(paragraphStyleToCss(block.paraState));
	const empty = renderInlineNodes(block.inlines || [], context) || "<br>";
	const classNames = ["msdoc-paragraph"];
	if (block.paraState.lineSpacingRule === "atLeast") classNames.push("msdoc-line-at-least");
	if (block.styleName) classNames.push(`msdoc-style-${slugify(block.styleName)}`);
	return `<${tag} class="${classNames.join(" ")}"${style ? ` style="${style}"` : ""}>${empty}</${tag}>`;
}
function cellStyle(cell) {
	const style = {};
	const widthPx = twipsToPx(cell.meta?.rightBoundary != null && cell.meta?.leftBoundary != null ? cell.meta.rightBoundary - cell.meta.leftBoundary : cell.meta?.width);
	if (widthPx) style.width = `${widthPx}px`;
	if (cell.meta?.noWrap) style["white-space"] = "nowrap";
	if (cell.meta?.fitText) style["text-align"] = "justify";
	if (cell.meta?.vertAlign != null) style["vertical-align"] = cssVerticalAlign(cell.meta.vertAlign);
	const borders = cell.meta?.borders || {};
	const borderAll = borderToCss(borders.all);
	const borderForSide = (side) => Object.prototype.hasOwnProperty.call(borders, side) ? borderToCss(borders[side]) : borderAll;
	const top = borderForSide("top");
	const right = borderForSide("right");
	const bottom = borderForSide("bottom");
	const left = borderForSide("left");
	if (top) style["border-top"] = top;
	if (right) style["border-inline-end"] = right;
	if (bottom) style["border-bottom"] = bottom;
	if (left) style["border-inline-start"] = left;
	const padding = cell.meta?.paddingTwips;
	if (padding?.top != null) style["padding-top"] = `${twipsToPx(padding.top)}px`;
	if (padding?.right != null) style["padding-inline-end"] = `${twipsToPx(padding.right)}px`;
	if (padding?.bottom != null) style["padding-bottom"] = `${twipsToPx(padding.bottom)}px`;
	if (padding?.left != null) style["padding-inline-start"] = `${twipsToPx(padding.left)}px`;
	Object.assign(style, shadingToCss(cell.meta?.shading));
	return style;
}
function tableStyle(block) {
	const style = {};
	const widthPx = twipsToPx(block.gridWidthTwips || block.state?.tableWidth?.wWidth);
	if (widthPx) style.width = `${widthPx}px`;
	else style.width = "100%";
	const marginLeft = twipsToPx(block.state?.leftIndent);
	if (marginLeft) style["margin-inline-start"] = `${marginLeft}px`;
	if (block.state?.rtl) style.direction = "rtl";
	const spacing = block.rows.flatMap((row) => row.cells).reduce((maximum, cell) => {
		const value = cell.meta?.spacingTwips;
		if (!value) return maximum;
		return {
			horizontal: Math.max(maximum.horizontal, value.left || 0, value.right || 0),
			vertical: Math.max(maximum.vertical, value.top || 0, value.bottom || 0)
		};
	}, {
		horizontal: 0,
		vertical: 0
	});
	if (spacing.horizontal || spacing.vertical) {
		style["border-collapse"] = "separate";
		style["border-spacing"] = `${twipsToPx(spacing.horizontal)}px ${twipsToPx(spacing.vertical)}px`;
	} else style["border-collapse"] = "collapse";
	style["table-layout"] = "fixed";
	return style;
}
function renderTableBlock(block, context) {
	const rows = block.rows.map((row) => {
		const rowHeight = row.state?.rowHeight ? twipsToPx(Math.abs(row.state.rowHeight)) : null;
		return `<tr class="msdoc-row"${rowHeight ? ` style="height:${rowHeight}px"` : ""}>${row.cells.filter((cell) => !cell.hidden).map((cell) => {
			const attrs = [];
			if ((cell.colspan ?? 1) > 1) attrs.push(` colspan="${cell.colspan}"`);
			if ((cell.rowspan ?? 1) > 1) attrs.push(` rowspan="${cell.rowspan}"`);
			const style = styleObjectToCss(cellStyle(cell));
			const body = reviewParagraphs(cell.paragraphs, context).map((paragraph) => renderParagraphBlock(paragraph, context, { inline: true })).join("");
			return `<td class="msdoc-cell"${attrs.join("")}${style ? ` style="${style}"` : ""}>${body || "<div class=\"msdoc-paragraph\"><br></div>"}</td>`;
		}).join("")}</tr>`;
	}).join("");
	return `<table class="msdoc-table msdoc-table-depth-${block.depth}" style="${styleObjectToCss(tableStyle(block))}"><tbody>${rows}</tbody></table>`;
}
function renderAttachmentsBlock(block) {
	return `<section class="msdoc-attachments"><div class="msdoc-attachments-title">Embedded attachments</div><ul>${block.items.map((item) => {
		const label = escapeHtml(item.name || "embedded-file");
		const downloadHref = sanitizeDownloadHref(item.dataUrl);
		return `<li>${downloadHref ? `<a class="msdoc-attachment" href="${escapeHtml(downloadHref)}" download="${label}">📎 ${label}</a>` : `<span class="msdoc-attachment">📎 ${label}</span>`}</li>`;
	}).join("")}</ul></section>`;
}
function defaultMsDocCss() {
	return `
.msdoc-root{box-sizing:border-box;max-width:100%;padding:24px;background:#fff;color:#111;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.msdoc-root *{box-sizing:border-box}
.msdoc-paragraph{margin:0 0 8px;white-space:normal;word-break:break-word;overflow-wrap:anywhere}
.msdoc-line-at-least span,.msdoc-line-at-least ins,.msdoc-line-at-least del{line-height:normal}
.msdoc-paragraph:last-child{margin-bottom:0}
.msdoc-table{margin:12px 0;border-collapse:collapse;border-spacing:0;max-width:100%}
.msdoc-cell{padding:6px 8px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
.msdoc-link{color:#1a73e8;text-decoration:none}
.msdoc-link:hover{text-decoration:underline}
.msdoc-image{display:inline-block;vertical-align:middle}
.msdoc-image-fallback{display:inline-flex;align-items:center;gap:6px}
.msdoc-attachment{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid #d0d7de;border-radius:6px;background:#f6f8fa;color:#0969da;text-decoration:none}
.msdoc-attachments{margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb}
.msdoc-attachments-title{font-weight:600;margin-bottom:8px}
.msdoc-page-break{display:block;height:0;border-top:1px dashed #cbd5e1;margin:16px 0}
`;
}
/**
* Converts the parsed AST into HTML and a companion CSS string.
* Keeping rendering separate from parsing makes it easier for downstream apps
* to customize styles or consume the AST directly.
*/
function renderMsDoc(parsed, options = {}) {
	const css = options.css ?? defaultMsDocCss();
	const context = {
		reviewMode: options.reviewMode ?? "all",
		externalLinkPolicy: options.externalLinkPolicy ?? "block",
		externalResourcePolicy: options.externalResourcePolicy ?? "block"
	};
	const parts = [];
	let paragraphs = [];
	const flushParagraphs = () => {
		parts.push(...reviewParagraphs(paragraphs, context).map((block) => renderParagraphBlock(block, context)));
		paragraphs = [];
	};
	for (const block of parsed.blocks) {
		if (block.type === "paragraph") {
			paragraphs.push(block);
			continue;
		}
		flushParagraphs();
		if (block.type === "table") parts.push(renderTableBlock(block, context));
		if (block.type === "attachments") parts.push(renderAttachmentsBlock(block));
	}
	flushParagraphs();
	return {
		html: parts.join(""),
		css,
		warnings: parsed.warnings || [],
		meta: parsed.meta,
		assets: parsed.assets || [],
		parsed
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+doc@3.1.2/node_modules/@file-viewer/doc/dist/viewer.js
var purifierByWindow = /* @__PURE__ */ new WeakMap();
var trustedTypesPolicyByWindow = /* @__PURE__ */ new WeakMap();
var getDocumentPurifier = (targetWindow) => {
	const cached = purifierByWindow.get(targetWindow);
	if (cached) return cached;
	const purifier = purify(targetWindow);
	if (!purifier.isSupported) return null;
	purifierByWindow.set(targetWindow, purifier);
	return purifier;
};
var getDocumentTrustedTypesPolicy = (targetWindow) => {
	const cached = trustedTypesPolicyByWindow.get(targetWindow);
	if (cached) return cached;
	const trustedTypes = targetWindow.trustedTypes;
	if (!trustedTypes?.createPolicy) return null;
	try {
		const policy = trustedTypes.createPolicy("file-viewer-document-sanitizer", {
			createHTML: (value) => value,
			createScriptURL: (value) => value
		});
		trustedTypesPolicyByWindow.set(targetWindow, policy);
		return policy;
	} catch {
		return null;
	}
};
/**
* Shared DOC/RTF DOMPurify boundary. A per-window purifier and Trusted Types
* policy avoid duplicate policy creation when several Word formats are opened
* in the same host document.
*/
function sanitizeFileViewerDocumentMarkup(html, targetWindow, config) {
	const purifier = getDocumentPurifier(targetWindow);
	if (!purifier) return null;
	const policy = getDocumentTrustedTypesPolicy(targetWindow);
	try {
		return purifier.sanitize(html, {
			...config,
			...policy ? { TRUSTED_TYPES_POLICY: policy } : {}
		});
	} catch {
		return null;
	}
}
async function normalizeInput(input) {
	if (input instanceof ArrayBuffer) return input;
	if (ArrayBuffer.isView(input)) {
		const bytes = new Uint8Array(input.byteLength);
		bytes.set(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
		return bytes.buffer;
	}
	if (typeof Blob !== "undefined" && input instanceof Blob) return await input.arrayBuffer();
	if (typeof input === "string") {
		const response = await fetch(input);
		if (!response.ok) throw new Error(`Failed to fetch document: ${response.status}`);
		return await response.arrayBuffer();
	}
	throw new TypeError("Unsupported input type");
}
function sanitizeMsDocHtml(html, targetWindow) {
	const sanitized = sanitizeFileViewerDocumentMarkup(html, targetWindow, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: { html: true },
		FORBID_TAGS: [
			"base",
			"embed",
			"form",
			"iframe",
			"object",
			"script",
			"style",
			"template"
		],
		FORBID_ATTR: [
			"action",
			"formaction",
			"srcdoc"
		]
	});
	if (sanitized?.nodeType === 11) return sanitized;
	const fallback = targetWindow.document.createDocumentFragment();
	fallback.append(targetWindow.document.createTextNode(html));
	return fallback;
}
async function parseMsDocToHtml(input, options = {}) {
	const buffer = await normalizeInput(input);
	if (options.workerClient) return options.workerClient.parseToHtml(buffer, {
		parseOptions: options.parseOptions || {},
		renderOptions: options.renderOptions || {}
	});
	return renderMsDoc(parseMsDoc(buffer, options.parseOptions || {}), options.renderOptions || {});
}
//#endregion
export { sanitizeMsDocLinkHref as a, defaultMsDocCss as i, sanitizeFileViewerDocumentMarkup as n, sanitizeMsDocHtml as r, parseMsDocToHtml as t };
