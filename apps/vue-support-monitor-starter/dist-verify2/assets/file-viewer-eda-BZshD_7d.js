const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cfb-ljR0FFZq.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-drawing-DeKTjxNF.js"])))=>i.map(i=>d[i]);
import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { ud as __vitePreload, vo as resolveFileViewerLocale, wc as DEFAULT_RENDERER_DEFINITIONS } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@file-viewer+eda-layout@3.1.2/node_modules/@file-viewer/eda-layout/dist/index.js
var MAX_LAYOUT_ELEMENTS = 2500;
var GDS_RECORD = {
	BGNLIB: 1,
	LIBNAME: 2,
	UNITS: 3,
	BGNSTR: 5,
	STRNAME: 6,
	ENDSTR: 7,
	BOUNDARY: 8,
	PATH: 9,
	SREF: 10,
	AREF: 11,
	TEXT: 12,
	LAYER: 13,
	DATATYPE: 14,
	WIDTH: 15,
	XY: 16,
	ENDEL: 17,
	SNAME: 18,
	COLROW: 19,
	TEXTTYPE: 22,
	STRING: 25
};
var DEFAULT_WEBGL_PALETTE = [
	"#5eead4",
	"#93c5fd",
	"#c4b5fd",
	"#f9a8d4",
	"#fde68a",
	"#86efac",
	"#fdba74",
	"#67e8f9"
];
var cleanupText = (text) => {
	return text.replace(/\u0000/g, "").replace(/[^\S\r\n]+/g, " ").replace(/\r\n/g, "\n").trim();
};
var readGdsInt16 = (bytes, offset) => {
	const value = bytes[offset] << 8 | bytes[offset + 1];
	return value & 32768 ? value - 65536 : value;
};
var readGdsInt32 = (bytes, offset) => {
	return bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3] | 0;
};
var readGdsString = (bytes, offset, length) => {
	return cleanupText(new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(offset, offset + length)).replace(/\u0000+$/g, ""));
};
var isMostlyPrintableText = (bytes) => {
	const sample = bytes.slice(0, Math.min(bytes.length, 4096));
	if (!sample.length) return false;
	let printable = 0;
	for (const byte of sample) if (byte === 9 || byte === 10 || byte === 13 || byte >= 32 && byte <= 126) printable += 1;
	return printable / sample.length > .9;
};
var parseNumberToken = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : void 0;
};
var parseQuotedText = (line) => {
	var _a;
	return ((_a = line.match(/"([^"]+)"/)) === null || _a === void 0 ? void 0 : _a[1]) || line.split(/\s+/).slice(3).join(" ");
};
var readGdsReal8 = (bytes, offset) => {
	const first = bytes[offset];
	if (!first) return 0;
	const sign = first & 128 ? -1 : 1;
	const exponent = (first & 127) - 64;
	let mantissa = 0;
	for (let index = 1; index < 8; index += 1) mantissa += bytes[offset + index] / 256 ** index;
	return sign * mantissa * 16 ** exponent;
};
var readGdsPoints = (bytes, offset, length) => {
	const points = [];
	for (let cursor = offset; cursor + 7 < offset + length; cursor += 8) points.push({
		x: readGdsInt32(bytes, cursor),
		y: readGdsInt32(bytes, cursor + 4)
	});
	return points;
};
var updateLayoutBounds = (bounds, points) => {
	let next = bounds;
	points.forEach((point) => {
		if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
		if (!next) {
			next = {
				minX: point.x,
				minY: point.y,
				maxX: point.x,
				maxY: point.y
			};
			return;
		}
		next.minX = Math.min(next.minX, point.x);
		next.minY = Math.min(next.minY, point.y);
		next.maxX = Math.max(next.maxX, point.x);
		next.maxY = Math.max(next.maxY, point.y);
	});
	return next;
};
var normalizeHexColor = (value) => {
	const normalized = value.trim().replace(/^#/, "");
	if (/^[0-9a-f]{3}$/i.test(normalized)) return normalized.split("").map((part) => `${part}${part}`).join("");
	return /^[0-9a-f]{6}$/i.test(normalized) ? normalized : "5eead4";
};
var colorForLayer = (layer, palette) => {
	const color = normalizeHexColor(palette[(Number.isFinite(layer) ? Math.abs(Number(layer)) : 0) % palette.length] || DEFAULT_WEBGL_PALETTE[0]);
	return {
		r: parseInt(color.slice(0, 2), 16) / 255,
		g: parseInt(color.slice(2, 4), 16) / 255,
		b: parseInt(color.slice(4, 6), 16) / 255
	};
};
var withoutClosingPoint = (points) => {
	if (points.length < 2) return [...points];
	const first = points[0];
	const last = points[points.length - 1];
	return first.x === last.x && first.y === last.y ? points.slice(0, -1) : [...points];
};
var parseGdsLayout = (bytes) => {
	const structures = [];
	const elements = [];
	const warnings = [];
	let libraryName = "";
	let userUnit;
	let databaseUnit;
	let currentStructure = "";
	let currentElement = null;
	let bounds;
	const pushElement = () => {
		if (!currentElement || !currentElement.xy.length) {
			currentElement = null;
			return;
		}
		if (elements.length < MAX_LAYOUT_ELEMENTS) {
			elements.push(currentElement);
			bounds = updateLayoutBounds(bounds, currentElement.xy);
		} else if (!warnings.length) warnings.push(`Layout contains more than ${MAX_LAYOUT_ELEMENTS} elements; only the first ${MAX_LAYOUT_ELEMENTS} are rendered to protect browser memory.`);
		currentElement = null;
	};
	for (let offset = 0; offset + 3 < bytes.length;) {
		const length = bytes[offset] << 8 | bytes[offset + 1];
		const recordType = bytes[offset + 2];
		if (length < 4 || offset + length > bytes.length) {
			warnings.push(`GDSII record has an invalid length at offset ${offset}; geometry parsing stopped safely.`);
			break;
		}
		const dataOffset = offset + 4;
		const dataLength = length - 4;
		switch (recordType) {
			case GDS_RECORD.BGNLIB:
				currentStructure = "";
				break;
			case GDS_RECORD.LIBNAME:
				libraryName = readGdsString(bytes, dataOffset, dataLength);
				break;
			case GDS_RECORD.UNITS:
				if (dataLength >= 16) {
					userUnit = readGdsReal8(bytes, dataOffset);
					databaseUnit = readGdsReal8(bytes, dataOffset + 8);
				}
				break;
			case GDS_RECORD.BGNSTR:
				pushElement();
				currentStructure = "";
				break;
			case GDS_RECORD.STRNAME:
				currentStructure = readGdsString(bytes, dataOffset, dataLength);
				if (currentStructure && !structures.includes(currentStructure)) structures.push(currentStructure);
				break;
			case GDS_RECORD.ENDSTR:
				pushElement();
				currentStructure = "";
				break;
			case GDS_RECORD.BOUNDARY:
				pushElement();
				currentElement = {
					kind: "boundary",
					structure: currentStructure || "STRUCTURE",
					xy: []
				};
				break;
			case GDS_RECORD.PATH:
				pushElement();
				currentElement = {
					kind: "path",
					structure: currentStructure || "STRUCTURE",
					xy: []
				};
				break;
			case GDS_RECORD.TEXT:
				pushElement();
				currentElement = {
					kind: "text",
					structure: currentStructure || "STRUCTURE",
					xy: []
				};
				break;
			case GDS_RECORD.SREF:
				pushElement();
				currentElement = {
					kind: "sref",
					structure: currentStructure || "STRUCTURE",
					xy: []
				};
				break;
			case GDS_RECORD.AREF:
				pushElement();
				currentElement = {
					kind: "aref",
					structure: currentStructure || "STRUCTURE",
					xy: []
				};
				break;
			case GDS_RECORD.LAYER:
				if (currentElement && dataLength >= 2) currentElement.layer = readGdsInt16(bytes, dataOffset);
				break;
			case GDS_RECORD.DATATYPE:
			case GDS_RECORD.TEXTTYPE:
				if (currentElement && dataLength >= 2) currentElement.datatype = readGdsInt16(bytes, dataOffset);
				break;
			case GDS_RECORD.WIDTH:
				if (currentElement && dataLength >= 4) currentElement.width = Math.abs(readGdsInt32(bytes, dataOffset));
				break;
			case GDS_RECORD.XY:
				if (currentElement) currentElement.xy = readGdsPoints(bytes, dataOffset, dataLength);
				break;
			case GDS_RECORD.SNAME:
				if (currentElement) currentElement.reference = readGdsString(bytes, dataOffset, dataLength);
				break;
			case GDS_RECORD.STRING:
				if (currentElement) currentElement.text = readGdsString(bytes, dataOffset, dataLength);
				break;
			case GDS_RECORD.COLROW:
				if (currentElement && dataLength >= 4) currentElement.text = `${currentElement.text || ""} ${readGdsInt16(bytes, dataOffset)}x${readGdsInt16(bytes, dataOffset + 2)}`.trim();
				break;
			case GDS_RECORD.ENDEL: pushElement();
		}
		offset += length;
	}
	pushElement();
	if (!structures.length && !elements.length && !libraryName) return;
	return {
		format: "gdsii",
		libraryName,
		userUnit,
		databaseUnit,
		structureCount: structures.length,
		structures,
		elements,
		bounds,
		warnings
	};
};
var parseOasisTextLayout = (bytes) => {
	if (!isMostlyPrintableText(bytes)) return;
	const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
	if (!/%SEMI-OASIS/i.test(text) && !/\bOASIS\b/i.test(text)) return;
	const structures = [];
	const elements = [];
	const warnings = ["Parsed an ASCII OASIS-like structure fixture. Full SEMI binary OASIS geometry requires the dedicated layout kernel path."];
	const state = { structure: "TOP" };
	let userUnit;
	let bounds;
	const pushElement = (element) => {
		elements.push(element);
		bounds = updateLayoutBounds(bounds, element.xy);
	};
	text.split(/\r?\n/).forEach((rawLine) => {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) return;
		const parts = line.split(/\s+/);
		const command = (parts[0] || "").toUpperCase();
		if (command === "START") {
			const unitMatch = line.match(/\bunit=([0-9.eE+-]+)/);
			userUnit = parseNumberToken(unitMatch === null || unitMatch === void 0 ? void 0 : unitMatch[1]);
			return;
		}
		if (command === "CELL") {
			state.structure = parts[1] || `CELL_${structures.length + 1}`;
			if (!structures.includes(state.structure)) structures.push(state.structure);
			return;
		}
		if (command === "LAYER") {
			state.layer = parseNumberToken(parts[1]);
			const datatypeIndex = parts.findIndex((part) => part.toUpperCase() === "DATATYPE");
			state.datatype = parseNumberToken(parts[datatypeIndex + 1]);
			return;
		}
		if (command === "RECT") {
			const x = parseNumberToken(parts[1]);
			const y = parseNumberToken(parts[2]);
			const width = parseNumberToken(parts[3]);
			const height = parseNumberToken(parts[4]);
			if ([
				x,
				y,
				width,
				height
			].some((value) => value === void 0)) {
				warnings.push(`Skipped malformed RECT record: ${line}`);
				return;
			}
			pushElement({
				kind: "boundary",
				structure: state.structure,
				layer: state.layer,
				datatype: state.datatype,
				xy: [
					{
						x,
						y
					},
					{
						x: x + width,
						y
					},
					{
						x: x + width,
						y: y + height
					},
					{
						x,
						y: y + height
					},
					{
						x,
						y
					}
				]
			});
			return;
		}
		if (command === "PATH" || command === "POLYGON") {
			const values = parts.slice(1).map(parseNumberToken);
			if (values.length < 4 || values.some((value) => value === void 0)) {
				warnings.push(`Skipped malformed ${command} record: ${line}`);
				return;
			}
			const xy = [];
			for (let index = 0; index + 1 < values.length; index += 2) xy.push({
				x: values[index],
				y: values[index + 1]
			});
			if (command === "POLYGON" && xy.length >= 3) xy.push({ ...xy[0] });
			pushElement({
				kind: command === "PATH" ? "path" : "boundary",
				structure: state.structure,
				layer: state.layer,
				datatype: state.datatype,
				xy
			});
			return;
		}
		if (command === "TEXT") {
			const x = parseNumberToken(parts[1]);
			const y = parseNumberToken(parts[2]);
			if (x === void 0 || y === void 0) {
				warnings.push(`Skipped malformed TEXT record: ${line}`);
				return;
			}
			pushElement({
				kind: "text",
				structure: state.structure,
				layer: state.layer,
				datatype: state.datatype,
				text: cleanupText(parseQuotedText(line)),
				xy: [{
					x,
					y
				}]
			});
		}
	});
	if (!elements.length && !structures.length) return;
	return {
		format: "oasis",
		libraryName: "OASIS text fixture",
		userUnit,
		structureCount: structures.length || 1,
		structures: structures.length ? structures : [state.structure],
		elements,
		bounds,
		warnings
	};
};
var createEdaLayoutWebglBatch = (layout, options = {}) => {
	var _a, _b, _c;
	const warnings = [];
	const triangleVertices = [];
	const lineVertices = [];
	const pointVertices = [];
	const labels = [];
	const palette = ((_a = options.palette) === null || _a === void 0 ? void 0 : _a.length) ? options.palette : DEFAULT_WEBGL_PALETTE;
	const maxElements = (_b = options.maxElements) !== null && _b !== void 0 ? _b : 18e3;
	const maxLabels = (_c = options.maxLabels) !== null && _c !== void 0 ? _c : 600;
	const bounds = layout.bounds;
	if (layout.format !== "gdsii" || !bounds) return {
		format: "gdsii",
		elementCount: 0,
		triangleVertices: /* @__PURE__ */ new Float32Array(),
		lineVertices: /* @__PURE__ */ new Float32Array(),
		pointVertices: /* @__PURE__ */ new Float32Array(),
		labels,
		bounds,
		warnings: ["WebGL batches are currently generated for parsed GDSII geometry only."]
	};
	const rawWidth = Math.max(1, bounds.maxX - bounds.minX);
	const rawHeight = Math.max(1, bounds.maxY - bounds.minY);
	const toClip = (point) => ({
		x: (point.x - bounds.minX) / rawWidth * 2 - 1,
		y: (point.y - bounds.minY) / rawHeight * 2 - 1
	});
	const pushVertex = (target, point, color) => {
		const mapped = toClip(point);
		target.push(mapped.x, mapped.y, color.r, color.g, color.b);
	};
	const pushLine = (from, to, color) => {
		pushVertex(lineVertices, from, color);
		pushVertex(lineVertices, to, color);
	};
	const elements = layout.elements.slice(0, maxElements);
	if (layout.elements.length > maxElements) warnings.push(`Layout contains ${layout.elements.length} elements; WebGL preview batched the first ${maxElements} elements to protect browser memory.`);
	elements.forEach((element) => {
		const color = colorForLayer(element.layer, palette);
		const points = withoutClosingPoint(element.xy);
		if ((element.kind === "boundary" || element.kind === "aref") && points.length >= 3) {
			for (let index = 1; index < points.length - 1; index += 1) {
				pushVertex(triangleVertices, points[0], color);
				pushVertex(triangleVertices, points[index], color);
				pushVertex(triangleVertices, points[index + 1], color);
			}
			for (let index = 0; index < points.length; index += 1) pushLine(points[index], points[(index + 1) % points.length], color);
			return;
		}
		if (element.kind === "path" && points.length >= 2) {
			for (let index = 0; index < points.length - 1; index += 1) pushLine(points[index], points[index + 1], color);
			return;
		}
		const anchor = points[0];
		if (!anchor) return;
		pushVertex(pointVertices, anchor, color);
		const label = element.text || element.reference;
		if (label && labels.length < maxLabels) {
			const mapped = toClip(anchor);
			labels.push({
				text: label,
				layer: element.layer,
				x: anchor.x,
				y: anchor.y,
				clipX: mapped.x,
				clipY: mapped.y
			});
		}
	});
	if (labels.length >= maxLabels) warnings.push(`Only the first ${maxLabels} layout labels are shown in the WebGL overlay.`);
	return {
		format: "gdsii",
		elementCount: elements.length,
		triangleVertices: new Float32Array(triangleVertices),
		lineVertices: new Float32Array(lineVertices),
		pointVertices: new Float32Array(pointVertices),
		labels,
		bounds,
		warnings
	};
};
var inspectOasisLayout = (bytes) => {
	const magicFound = new TextDecoder("ascii", { fatal: false }).decode(bytes.slice(0, Math.min(24, bytes.length))).includes("OASIS");
	return {
		format: "oasis",
		magicFound,
		byteLength: bytes.byteLength,
		warnings: [magicFound ? "OASIS header detected. Full cell repetition expansion and geometry rendering is reserved for the dedicated WASM/WebGL layout engine boundary." : "OASIS header was not detected in the first bytes. The file may be wrapped, compressed, encrypted, or use a proprietary exchange container."]
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+eda-orcad@3.1.2/node_modules/@file-viewer/eda-orcad/dist/index.js
var ORCAD_CFB_MAGIC = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
var MAX_SAMPLE_BYTES = 4096;
var MAX_HEX_BYTES = 192;
var isOrcadCompoundFile = (bytes) => {
	return ORCAD_CFB_MAGIC.every((value, index) => bytes[index] === value);
};
var cleanupOrcadText = (text) => {
	return text.replace(/\u0000/g, "").replace(/[^\S\r\n]+/g, " ").replace(/\r\n/g, "\n").trim();
};
var looksLikeOrcadText = (bytes) => {
	if (!bytes.length) return false;
	const sample = bytes.slice(0, Math.min(bytes.length, MAX_SAMPLE_BYTES));
	let printable = 0;
	let zeroBytes = 0;
	for (const byte of sample) {
		if (byte === 0) zeroBytes += 1;
		if (byte === 9 || byte === 10 || byte === 13 || byte >= 32 && byte <= 126 || byte >= 128) printable += 1;
	}
	return printable / sample.length > .82 || zeroBytes / sample.length > .25;
};
var decodeOrcadSample = (bytes) => {
	const sample = bytes.slice(0, Math.min(bytes.length, MAX_SAMPLE_BYTES));
	if (!sample.length) return "";
	try {
		let zeroOdd = 0;
		let zeroEven = 0;
		for (let index = 0; index < sample.length; index += 1) {
			if (sample[index] !== 0) continue;
			if (index % 2 === 0) zeroEven += 1;
			else zeroOdd += 1;
		}
		return cleanupOrcadText((zeroOdd > sample.length / 5 && zeroOdd > zeroEven * 2 ? new TextDecoder("utf-16le", { fatal: false }) : new TextDecoder("utf-8", { fatal: false })).decode(sample));
	} catch {
		return "";
	}
};
var createOrcadHexPreview = (bytes) => {
	const sample = bytes.slice(0, Math.min(bytes.length, MAX_HEX_BYTES));
	const lines = [];
	for (let offset = 0; offset < sample.length; offset += 16) {
		const row = sample.slice(offset, offset + 16);
		const hex = Array.from(row).map((byte) => byte.toString(16).padStart(2, "0")).join(" ");
		const ascii = Array.from(row).map((byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".").join("");
		lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(47)}  ${ascii}`);
	}
	return lines.join("\n");
};
var extractOrcadAsciiStrings = (bytes) => {
	const result = [];
	let current = "";
	for (const byte of bytes) {
		if (byte >= 32 && byte <= 126) {
			current += String.fromCharCode(byte);
			continue;
		}
		if (current.length >= 4) result.push(current);
		current = "";
	}
	if (current.length >= 4) result.push(current);
	return result;
};
var extractOrcadUtf16Strings = (bytes) => {
	const result = [];
	let current = "";
	for (let index = 0; index + 1 < bytes.length; index += 2) {
		const low = bytes[index];
		if (bytes[index + 1] === 0 && low >= 32 && low <= 126) {
			current += String.fromCharCode(low);
			continue;
		}
		if (current.length >= 4) result.push(current);
		current = "";
	}
	if (current.length >= 4) result.push(current);
	return result;
};
var collectOrcadStrings = (chunks, maxStrings = 180) => {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	chunks.forEach((chunk) => {
		[...extractOrcadAsciiStrings(chunk), ...extractOrcadUtf16Strings(chunk)].forEach((item) => {
			const cleaned = cleanupOrcadText(item);
			if (!cleaned || cleaned.length < 4 || seen.has(cleaned) || result.length >= maxStrings) return;
			seen.add(cleaned);
			result.push(cleaned);
		});
	});
	return result;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-eda@3.1.2/node_modules/@file-viewer/renderer-eda/dist/edaParser.js
var MAX_STREAMS = 200;
var MAX_STREAM_STRINGS = 24;
var MAX_PROPERTIES = 420;
var EDA_PARSER_TEXT = {
	"zh-CN": {
		oasisFixture: "已识别为 OASIS 文本结构夹具，并在浏览器端解析几何预览和结构索引；真实 SEMI 二进制 OASIS 仍走安全索引与后续独立内核路线。",
		gdsLayout: "已识别为标准 GDSII 二进制版图记录，并在浏览器端解析几何预览和结构索引。",
		cfbContainer: "已识别为 Microsoft Compound File / OLE2 复合文档容器，并在浏览器端解析目录与流。",
		binaryIndex: "未识别为 CFB 容器，已使用二进制字符串索引模式展示可读信息。",
		coverage: "已索引 {streams} 个条目、{strings} 个可读字符串、{entities} 个 EDA 结构候选。",
		layout: "已解析 {layout}: {structures} 个 structure、{elements} 个几何/引用/文本元素，可在版图预览面板中拖动查看。",
		layoutOasisName: "OASIS 文本结构",
		layoutGdsName: "GDSII 版图",
		titleOrcadSymbolLibrary: "OrCAD Capture 元件符号库",
		titleOlbBinaryLibrary: "OLB 二进制库",
		titleOrcadDrawingLibrary: "OrCAD / Allegro 图纸库",
		titleDraBinaryDrawing: "DRA 二进制图纸",
		titleLayoutStructure: "{type} 版图结构",
		noSymbol: "未发现明确的元件符号候选，文件可能使用了私有二进制编码或需要专业工具导出 ASCII/XML 后再检查。",
		noFootprint: "未发现明确的封装、图形或 padstack 候选，文件可能使用了私有二进制数据库编码。",
		noGds: "未发现明确的 GDSII 版图结构候选。文件可能不是标准 GDSII 二进制或使用了专有封装。",
		noOasis: "未发现明确的 OASIS 版图结构候选。OASIS 完整几何浏览通常需要专业版图库或独立 WASM/TS 内核，当前前端包会安全展示头部、字符串、属性和二进制结构线索。",
		maxStreams: "仅展示前 {count} 个 CFB 项，完整文件仍可下载后在专业 EDA 工具中打开。",
		binaryFallback: "该文件不是标准 CFB 容器，已退化为安全的二进制字符串索引预览。"
	},
	"en-US": {
		oasisFixture: "Detected an OASIS text fixture and parsed geometry preview plus structure indexes in the browser. Full SEMI binary OASIS still follows the safe index and dedicated-kernel path.",
		gdsLayout: "Detected standard GDSII binary layout records and parsed geometry preview plus structure indexes in the browser.",
		cfbContainer: "Detected a Microsoft Compound File / OLE2 container and parsed its directory and streams in the browser.",
		binaryIndex: "This file is not recognized as a CFB container, so readable information is shown through a safe binary string index.",
		coverage: "Indexed {streams} entries, {strings} readable strings, and {entities} EDA structure candidates.",
		layout: "Parsed {layout}: {structures} structures and {elements} geometry/reference/text elements. Drag the layout preview panel to inspect it.",
		layoutOasisName: "OASIS text fixture",
		layoutGdsName: "GDSII layout",
		titleOrcadSymbolLibrary: "OrCAD Capture Symbol Library",
		titleOlbBinaryLibrary: "OLB Binary Library",
		titleOrcadDrawingLibrary: "OrCAD / Allegro Drawing Library",
		titleDraBinaryDrawing: "DRA Binary Drawing",
		titleLayoutStructure: "{type} Layout Structure",
		noSymbol: "No clear component-symbol candidates were found. The file may use private binary encoding or need ASCII/XML export from a professional tool.",
		noFootprint: "No clear footprint, drawing, or padstack candidates were found. The file may use private binary database encoding.",
		noGds: "No clear GDSII layout structure candidates were found. The file may not be standard GDSII binary or may use a proprietary wrapper.",
		noOasis: "No clear OASIS layout structure candidates were found. Full OASIS geometry browsing usually needs a professional layout library or dedicated WASM/TS kernel; this frontend package safely exposes headers, strings, properties, and binary clues.",
		maxStreams: "Only the first {count} CFB entries are shown. Download the full file and open it in a professional EDA tool for complete inspection.",
		binaryFallback: "This file is not a standard CFB container, so it falls back to a safe binary string index preview."
	},
	"ja-JP": {
		oasisFixture: "OASIS テキスト fixture を認識し、ブラウザー内で幾何プレビューと構造索引を解析しました。完全な SEMI バイナリ OASIS は安全な索引と専用カーネルの経路を使用します。",
		gdsLayout: "標準 GDSII バイナリレイアウトレコードを認識し、ブラウザー内で幾何プレビューと構造索引を解析しました。",
		cfbContainer: "Microsoft Compound File / OLE2 コンテナーを認識し、ブラウザー内でディレクトリとストリームを解析しました。",
		binaryIndex: "CFB コンテナーとして認識できなかったため、安全なバイナリ文字列索引で可読情報を表示します。",
		coverage: "{streams} 件の項目、{strings} 件の可読文字列、{entities} 件の EDA 構造候補を索引化しました。",
		layout: "{layout} を解析しました：構造 {structures} 件、幾何・参照・テキスト要素 {elements} 件。レイアウトプレビューパネルをドラッグして確認できます。",
		layoutOasisName: "OASIS テキスト構造",
		layoutGdsName: "GDSII レイアウト",
		titleOrcadSymbolLibrary: "OrCAD Capture シンボルライブラリ",
		titleOlbBinaryLibrary: "OLB バイナリライブラリ",
		titleOrcadDrawingLibrary: "OrCAD / Allegro 図面ライブラリ",
		titleDraBinaryDrawing: "DRA バイナリ図面",
		titleLayoutStructure: "{type} レイアウト構造",
		noSymbol: "明確なコンポーネントシンボル候補を検出できませんでした。独自バイナリエンコーディングの可能性があるため、専門ツールから ASCII/XML を書き出して確認してください。",
		noFootprint: "明確なフットプリント、図形、Padstack 候補を検出できませんでした。独自バイナリデータベース形式の可能性があります。",
		noGds: "明確な GDSII レイアウト構造候補を検出できませんでした。標準 GDSII バイナリではないか、独自ラッパーを使用している可能性があります。",
		noOasis: "明確な OASIS レイアウト構造候補を検出できませんでした。完全な OASIS 幾何プレビューには専門ライブラリまたは専用 WASM/TS カーネルが必要です。このフロントエンドパッケージはヘッダー、文字列、プロパティ、バイナリ構造の手掛かりを安全に表示します。",
		maxStreams: "安全上の理由から、先頭 {count} 件の CFB 項目だけを表示します。完全な確認にはファイルをダウンロードして専門 EDA ツールで開いてください。",
		binaryFallback: "標準 CFB コンテナーではないため、安全なバイナリ文字列索引プレビューへ切り替えました。"
	},
	"de-DE": {
		oasisFixture: "Eine OASIS-Textstruktur wurde erkannt; Geometrievorschau und Strukturindex wurden im Browser verarbeitet. Vollständiges binäres SEMI OASIS verwendet weiterhin den sicheren Index- und den eigenen Kernel-Pfad.",
		gdsLayout: "Standardmäßige binäre GDSII-Layoutdatensätze wurden erkannt; Geometrievorschau und Strukturindex wurden im Browser verarbeitet.",
		cfbContainer: "Ein Microsoft-Compound-File-/OLE2-Container wurde erkannt; Verzeichnis und Datenströme wurden im Browser verarbeitet.",
		binaryIndex: "Die Datei wurde nicht als CFB-Container erkannt. Lesbare Informationen werden über einen sicheren Binärzeichenfolgenindex angezeigt.",
		coverage: "{streams} Einträge, {strings} lesbare Zeichenfolgen und {entities} EDA-Strukturkandidaten wurden indiziert.",
		layout: "{layout} verarbeitet: {structures} Strukturen und {elements} Geometrie-, Referenz- oder Textelemente. Ziehen Sie die Layoutvorschau, um sie zu prüfen.",
		layoutOasisName: "OASIS-Textstruktur",
		layoutGdsName: "GDSII-Layout",
		titleOrcadSymbolLibrary: "OrCAD-Capture-Symbolbibliothek",
		titleOlbBinaryLibrary: "Binäre OLB-Bibliothek",
		titleOrcadDrawingLibrary: "OrCAD-/Allegro-Zeichnungsbibliothek",
		titleDraBinaryDrawing: "Binäre DRA-Zeichnung",
		titleLayoutStructure: "{type}-Layoutstruktur",
		noSymbol: "Es wurden keine eindeutigen Bauteilsymbole gefunden. Die Datei verwendet möglicherweise eine private Binärcodierung oder muss mit einem Fachwerkzeug als ASCII/XML exportiert werden.",
		noFootprint: "Es wurden keine eindeutigen Footprint-, Zeichnungs- oder Padstack-Kandidaten gefunden. Die Datei verwendet möglicherweise eine private binäre Datenbankcodierung.",
		noGds: "Es wurden keine eindeutigen GDSII-Layoutstrukturen gefunden. Die Datei ist möglicherweise kein standardmäßiges GDSII-Binärformat oder verwendet einen proprietären Container.",
		noOasis: "Es wurden keine eindeutigen OASIS-Layoutstrukturen gefunden. Für die vollständige OASIS-Geometrie ist üblicherweise eine Fachbibliothek oder ein eigener WASM/TS-Kernel erforderlich; dieses Frontend zeigt Header, Zeichenfolgen, Eigenschaften und binäre Hinweise sicher an.",
		maxStreams: "Nur die ersten {count} CFB-Einträge werden angezeigt. Laden Sie die vollständige Datei für die Prüfung in einem EDA-Fachwerkzeug herunter.",
		binaryFallback: "Die Datei ist kein standardmäßiger CFB-Container. Deshalb wird eine sichere Vorschau des Binärzeichenfolgenindex angezeigt."
	}
};
var getEdaParserText = (locale, key, params = {}) => {
	const template = EDA_PARSER_TEXT[locale]?.[key] || EDA_PARSER_TEXT["en-US"][key] || key;
	return Object.entries(params).reduce((message, [name, value]) => message.replace(new RegExp(`\\{${name}\\}`, "g"), String(value)), template);
};
var toBytes = (buffer) => new Uint8Array(buffer);
var normalizeBytes = (value) => {
	return value instanceof Uint8Array ? value : new Uint8Array(value);
};
var normalizeSearchText = (value) => {
	return cleanupOrcadText(value).toLowerCase();
};
var lastPathPart = (path) => {
	const parts = path.split("/").filter(Boolean);
	return parts[parts.length - 1] || path || "/";
};
var stripExtension = (value) => {
	return value.replace(/\.[a-z0-9]+$/i, "");
};
var uniquePush = (target, value, max = Number.POSITIVE_INFINITY) => {
	const cleaned = cleanupOrcadText(value);
	if (!cleaned || target.includes(cleaned) || target.length >= max) return;
	target.push(cleaned);
};
var PROPERTY_RE = /^\s*([A-Za-z][A-Za-z0-9_. /#-]{1,56})\s*[:=]\s*(.{1,240})\s*$/;
var INLINE_PROPERTY_RE = /\b([A-Za-z][A-Za-z0-9_. /#-]{1,56})\s*=\s*([^;\n\r|]{1,240})/g;
var normalizePropertyKey = (key) => {
	return cleanupOrcadText(key).replace(/\s+/g, " ");
};
var addProperty = (target, seen, key, value, source) => {
	if (target.length >= MAX_PROPERTIES) return;
	const normalizedKey = normalizePropertyKey(key);
	const normalizedValue = cleanupOrcadText(value);
	if (!normalizedKey || !normalizedValue) return;
	const identity = `${source}\u0000${normalizedKey.toLowerCase()}\u0000${normalizedValue}`;
	if (seen.has(identity)) return;
	seen.add(identity);
	target.push({
		key: normalizedKey,
		value: normalizedValue,
		source
	});
};
var extractProperties = (text, strings, source) => {
	const properties = [];
	const seen = /* @__PURE__ */ new Set();
	[text, ...strings].filter(Boolean).forEach((chunk) => {
		cleanupOrcadText(chunk).split(/\n|[|;]/).forEach((line) => {
			const match = line.match(PROPERTY_RE);
			if (match) addProperty(properties, seen, match[1], match[2], source);
		});
		for (const match of chunk.matchAll(INLINE_PROPERTY_RE)) addProperty(properties, seen, match[1], match[2], source);
	});
	return properties;
};
var hasProperty = (properties, keys) => {
	const normalized = keys.map((key) => key.toLowerCase());
	return properties.some((property) => normalized.includes(property.key.toLowerCase()));
};
var getPropertyValue = (properties, keys) => {
	const normalized = keys.map((key) => key.toLowerCase());
	return properties.find((property) => normalized.includes(property.key.toLowerCase()))?.value;
};
var roleFromText = (type, path, name, sample, strings, properties, kind) => {
	const haystack = normalizeSearchText(`${path}\n${name}\n${sample}\n${strings.join("\n")}`);
	if (haystack === "/" || path === "/") return "root";
	if (kind === "storage" && /(^|\/)(library|libraries)(\/|$)/i.test(path)) return "library";
	if (/(header|version|source|author|metadata|property|properties)/.test(haystack)) return hasProperty(properties, [
		"Name",
		"Pins",
		"Footprint",
		"Padstack"
	]) ? "property" : "metadata";
	if (type === "olb") {
		if (/(^|\/)(symbols?|parts?)(\/|$)/.test(haystack) || hasProperty(properties, [
			"Pins",
			"Footprint",
			"PCB Footprint",
			"Part Number"
		])) return "symbol";
		if (/(^|\/)(library|capture|orcad)(\/|$)/.test(haystack)) return "library";
	}
	if (type === "dra") {
		if (/(padstack|pad stack|thermal|antipad|drill)/.test(haystack) || hasProperty(properties, ["Padstack", "Drill"])) return "padstack";
		if (/(footprint|package|psm|bsm|fsm|ssm|symbol)/.test(haystack)) return "footprint";
		if (/(route|net|via|ratsnest)/.test(haystack)) return "net";
		if (/(line |arc |circle|shape|outline|silk|place_bound|assembly|soldermask|pastemask)/.test(haystack)) return "geometry";
		if (/(drawing|units|layers?|constraint|allegro)/.test(haystack) || hasProperty(properties, ["Units", "Layers"])) return "drawing";
	}
	if (type === "gds" || type === "oas" || type === "oasis") {
		if (/(cell|structure|strname|sref|aref|boundary|path|polygon|layer|datatype|text|xy|gds|oas|oasis|layout)/.test(haystack)) return "geometry";
		if (/(library|libname|units|precision|technology|property|properties)/.test(haystack)) return "metadata";
	}
	if (properties.length) return "property";
	return kind === "storage" ? "library" : "unknown";
};
var buildStreamView = (type, path, name, size, kind, bytes) => {
	if (kind === "storage" || !bytes) return {
		path,
		name,
		size,
		kind,
		role: roleFromText(type, path, name, "", [], [], kind),
		strings: [],
		properties: []
	};
	const sample = looksLikeOrcadText(bytes) ? decodeOrcadSample(bytes) : "";
	const strings = collectOrcadStrings([bytes], MAX_STREAM_STRINGS);
	const properties = extractProperties(sample, strings, path);
	const role = roleFromText(type, path, name, sample, strings, properties, sample ? "text" : "binary");
	return {
		path,
		name,
		size,
		kind: sample ? "text" : "binary",
		role,
		sample,
		hex: sample ? void 0 : createOrcadHexPreview(bytes),
		strings,
		properties
	};
};
var sortTree = (node) => {
	node.children.sort((left, right) => {
		if (left.children.length !== right.children.length) return right.children.length - left.children.length;
		return left.name.localeCompare(right.name);
	});
	node.children.forEach(sortTree);
};
var buildTree = (streams, type) => {
	const root = {
		id: `${type}:root`,
		path: "/",
		name: type.toUpperCase(),
		kind: "storage",
		role: "root",
		size: 0,
		children: []
	};
	const nodes = /* @__PURE__ */ new Map([["/", root]]);
	streams.forEach((stream) => {
		const parts = stream.path.split("/").filter(Boolean);
		let parent = root;
		let currentPath = "";
		parts.forEach((part, index) => {
			currentPath += `/${part}`;
			const isLeaf = index === parts.length - 1;
			let node = nodes.get(currentPath);
			if (!node) {
				node = {
					id: `${type}:${currentPath}`,
					path: currentPath,
					name: part,
					kind: isLeaf ? stream.kind : "storage",
					role: isLeaf ? stream.role : roleFromText(type, currentPath, part, "", [], [], "storage"),
					size: isLeaf ? stream.size : 0,
					children: []
				};
				nodes.set(currentPath, node);
				parent.children.push(node);
			}
			if (isLeaf) {
				node.kind = stream.kind;
				node.role = stream.role;
				node.size = stream.size;
			}
			parent = node;
		});
	});
	sortTree(root);
	return root.children;
};
var splitListValue = (value) => {
	if (!value) return [];
	const result = [];
	value.split(/[,/;| ]+/).forEach((item) => {
		if (/^[A-Za-z0-9_.+-]+$/.test(item)) uniquePush(result, item, 64);
	});
	return result;
};
var entityRoleForStream = (stream, type) => {
	if (type === "olb") return stream.role === "symbol" && stream.kind !== "storage" ? "symbol" : null;
	if (type === "gds" || type === "oas" || type === "oasis") return stream.role === "geometry" || stream.role === "metadata" ? "drawing" : null;
	if (stream.role === "padstack") return "padstack";
	if (stream.role === "footprint" || stream.role === "geometry" && /\/footprint\//i.test(stream.path)) return "footprint";
	if (stream.role === "drawing") return "drawing";
	return null;
};
var streamEntityPath = (stream, role) => {
	if (role === "footprint") return stream.path.match(/^(.+?\/Footprint)(?:\/|$)/i)?.[1] || stream.path;
	if (role === "drawing") return stream.path.match(/^(.+?\/Drawing)(?:\/|$)/i)?.[1] || stream.path;
	return stream.path;
};
var inferEntityName = (stream, role, entityPath) => {
	const propertyName = getPropertyValue(stream.properties, [
		"Name",
		"Part",
		"Part Name",
		"Symbol",
		"Device",
		"Footprint",
		"PCB Footprint",
		"Package",
		"Padstack",
		"Pad Stack",
		"Drawing"
	]);
	if (propertyName) return propertyName;
	const pathName = stripExtension(lastPathPart(entityPath));
	if (pathName && pathName !== "/") return pathName;
	return role.toUpperCase();
};
var roleKeywords = (stream, role) => {
	const keywords = [];
	const text = `${stream.path}\n${stream.sample || ""}\n${stream.strings.join("\n")}`.toLowerCase();
	(role === "symbol" ? [
		"pins",
		"footprint",
		"pspice",
		"part",
		"symbol"
	] : [
		"units",
		"layers",
		"padstack",
		"drill",
		"outline",
		"route",
		"constraint",
		"shape",
		"place_bound"
	]).forEach((word) => {
		if (text.includes(word)) uniquePush(keywords, word, 12);
	});
	return keywords;
};
var appendUniqueProperties = (target, properties) => {
	const seen = new Set(target.map((property) => `${property.key.toLowerCase()}\u0000${property.value}`));
	properties.forEach((property) => {
		const identity = `${property.key.toLowerCase()}\u0000${property.value}`;
		if (seen.has(identity)) return;
		seen.add(identity);
		target.push(property);
	});
};
var collectEntities = (streams, type) => {
	const entities = /* @__PURE__ */ new Map();
	streams.forEach((stream) => {
		const role = entityRoleForStream(stream, type);
		if (!role) return;
		const entityPath = streamEntityPath(stream, role);
		const key = `${role}:${entityPath.toLowerCase()}`;
		const entity = entities.get(key) || {
			id: key,
			name: inferEntityName(stream, role, entityPath),
			role,
			path: entityPath,
			streamCount: 0,
			byteLength: 0,
			properties: [],
			pins: [],
			layers: [],
			keywords: []
		};
		entity.streamCount += 1;
		entity.byteLength += stream.size;
		appendUniqueProperties(entity.properties, stream.properties);
		splitListValue(getPropertyValue(stream.properties, [
			"Pins",
			"Pin",
			"Pin Numbers"
		])).forEach((pin) => uniquePush(entity.pins, pin, 96));
		splitListValue(getPropertyValue(stream.properties, ["Layers", "Layer"])).forEach((layer) => uniquePush(entity.layers, layer, 64));
		roleKeywords(stream, role).forEach((keyword) => uniquePush(entity.keywords, keyword, 16));
		entity.description ||= getPropertyValue(entity.properties, ["Description", "Desc"]);
		entity.footprint ||= getPropertyValue(entity.properties, [
			"Footprint",
			"PCB Footprint",
			"Package"
		]);
		entities.set(key, entity);
	});
	return Array.from(entities.values()).sort((left, right) => {
		const roleOrder = {
			symbol: 0,
			footprint: 1,
			padstack: 2,
			drawing: 3
		};
		return (roleOrder[left.role] ?? 9) - (roleOrder[right.role] ?? 9) || left.name.localeCompare(right.name);
	});
};
var collectMetadata = (streams) => {
	const metadata = [];
	streams.forEach((stream) => {
		if (stream.role === "metadata" || stream.role === "library" || stream.role === "drawing") appendUniqueProperties(metadata, stream.properties);
	});
	return metadata.slice(0, 80);
};
var buildStats = (streams, entities, strings, parser, layout) => {
	const stats = {
		textStreams: streams.filter((stream) => stream.kind === "text").length,
		binaryStreams: streams.filter((stream) => stream.kind === "binary").length,
		storageEntries: streams.filter((stream) => stream.kind === "storage").length,
		propertyCount: streams.reduce((sum, stream) => sum + stream.properties.length, 0),
		stringCount: strings.length,
		symbolCount: entities.filter((entity) => entity.role === "symbol").length,
		footprintCount: entities.filter((entity) => entity.role === "footprint").length,
		padstackCount: entities.filter((entity) => entity.role === "padstack").length,
		confidence: "low"
	};
	if (layout?.elements.length) stats.confidence = "high";
	else if (parser === "cfb" && entities.length && stats.propertyCount) stats.confidence = "high";
	else if (parser === "cfb" || strings.length || stats.propertyCount) stats.confidence = "medium";
	return stats;
};
var buildDiagnostics = (type, parser, streams, entities, strings, warnings, layout, locale) => {
	const diagnostics = warnings.map((message, index) => ({
		level: "warning",
		code: `warning-${index + 1}`,
		message
	}));
	diagnostics.push({
		level: "info",
		code: "parser",
		message: layout ? layout.format === "oasis" ? getEdaParserText(locale, "oasisFixture") : getEdaParserText(locale, "gdsLayout") : parser === "cfb" ? getEdaParserText(locale, "cfbContainer") : getEdaParserText(locale, "binaryIndex")
	});
	diagnostics.push({
		level: "info",
		code: "coverage",
		message: getEdaParserText(locale, "coverage", {
			streams: streams.length,
			strings: strings.length,
			entities: entities.length
		})
	});
	if (layout) diagnostics.push({
		level: "info",
		code: `${layout.format}-layout`,
		message: getEdaParserText(locale, "layout", {
			layout: getEdaParserText(locale, layout.format === "oasis" ? "layoutOasisName" : "layoutGdsName"),
			structures: layout.structureCount,
			elements: layout.elements.length
		})
	});
	const needsSymbol = type === "olb" && !entities.some((entity) => entity.role === "symbol");
	const needsFootprint = type === "dra" && !entities.some((entity) => entity.role === "footprint" || entity.role === "padstack");
	const needsLayout = (type === "gds" || type === "oas" || type === "oasis") && !layout && !entities.some((entity) => entity.role === "drawing");
	if (needsSymbol || needsFootprint || needsLayout) diagnostics.push({
		level: "warning",
		code: "domain-candidates",
		message: type === "olb" ? getEdaParserText(locale, "noSymbol") : type === "dra" ? getEdaParserText(locale, "noFootprint") : type === "gds" ? getEdaParserText(locale, "noGds") : getEdaParserText(locale, "noOasis")
	});
	return diagnostics;
};
var assembleResult = (buffer, type, parser, streamCount, streams, strings, warnings, layout, locale) => {
	const totalStreamBytes = streams.reduce((sum, stream) => sum + stream.size, 0);
	const entities = collectEntities(streams, type);
	const metadata = collectMetadata(streams);
	const diagnostics = buildDiagnostics(type, parser, streams, entities, strings, warnings, layout, locale);
	return {
		type,
		parser,
		title: type === "olb" ? getEdaParserText(locale, parser === "cfb" ? "titleOrcadSymbolLibrary" : "titleOlbBinaryLibrary") : type === "dra" ? getEdaParserText(locale, parser === "cfb" ? "titleOrcadDrawingLibrary" : "titleDraBinaryDrawing") : getEdaParserText(locale, "titleLayoutStructure", { type: type.toUpperCase() }),
		byteLength: buffer.byteLength,
		streamCount,
		totalStreamBytes,
		streams,
		tree: buildTree(streams, type),
		entities,
		metadata,
		strings,
		warnings,
		diagnostics,
		stats: buildStats(streams, entities, strings, parser, layout),
		layout
	};
};
var parseCfbContainer = async (buffer, type, locale) => {
	const container = (await __vitePreload(() => import("./cfb-ljR0FFZq.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1)), __vite__mapDeps([0,1,2,3,4]))).parse(toBytes(buffer), { type: "array" });
	const streamEntries = container.FileIndex.map((entry, index) => ({
		entry,
		path: container.FullPaths[index] || entry.name
	})).filter((item) => item.entry.type !== 5 && item.path !== "/" && item.entry.name).slice(0, MAX_STREAMS);
	const byteChunks = [];
	const streams = streamEntries.map(({ entry, path }) => {
		if (entry.type === 1) return buildStreamView(type, path, entry.name, entry.size || 0, "storage");
		const content = normalizeBytes(entry.content || []);
		byteChunks.push(content);
		return buildStreamView(type, path, entry.name, entry.size || content.byteLength || 0, "binary", content);
	});
	const warnings = streamEntries.length >= MAX_STREAMS ? [getEdaParserText(locale, "maxStreams", { count: MAX_STREAMS })] : [];
	return assembleResult(buffer, type, "cfb", container.FileIndex.length, streams, collectOrcadStrings(byteChunks), warnings, void 0, locale);
};
var parseBinaryFallback = (buffer, type, locale) => {
	const bytes = toBytes(buffer);
	const stream = buildStreamView(type, `${type}.${type}`, `${type}.${type}`, buffer.byteLength, "binary", bytes);
	const layout = type === "gds" ? parseGdsLayout(bytes) : type === "oas" || type === "oasis" ? parseOasisTextLayout(bytes) : void 0;
	const oasis = type === "oas" || type === "oasis" ? inspectOasisLayout(bytes) : void 0;
	const warnings = layout ? layout.warnings : oasis ? oasis.warnings : [getEdaParserText(locale, "binaryFallback")];
	return assembleResult(buffer, type, "binary", 1, [stream], collectOrcadStrings([bytes]), warnings, layout, locale);
};
var parseEdaFile = async (buffer, type = "olb", options = {}) => {
	const locale = options.locale || "zh-CN";
	const normalizedType = type === "dra" ? "dra" : type === "gds" || type === "oas" || type === "oasis" ? type : "olb";
	if (!isOrcadCompoundFile(toBytes(buffer))) return parseBinaryFallback(buffer, normalizedType, locale);
	try {
		return await parseCfbContainer(buffer, normalizedType, locale);
	} catch (error) {
		const fallback = parseBinaryFallback(buffer, normalizedType, locale);
		fallback.warnings.unshift(error instanceof Error ? error.message : String(error));
		fallback.diagnostics.unshift({
			level: "warning",
			code: "cfb-parse-failed",
			message: error instanceof Error ? error.message : String(error)
		});
		return fallback;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-eda@3.1.2/node_modules/@file-viewer/renderer-eda/dist/eda.js
var EDA_UI_TEXT = {
	"zh-CN": {
		"role.root": "根",
		"role.library": "库",
		"role.symbol": "元件符号",
		"role.footprint": "封装",
		"role.padstack": "Padstack",
		"role.drawing": "图纸",
		"role.metadata": "元数据",
		"role.property": "属性",
		"role.geometry": "几何",
		"role.net": "网络",
		"role.unknown": "未知",
		"confidence.high": "高",
		"confidence.medium": "中",
		"confidence.low": "低",
		"kind.storage": "目录",
		"kind.text": "文本",
		"kind.binary": "二进制",
		"panel.layout": "版图预览",
		"empty.noGeometry.title": "没有可绘制几何",
		"empty.noGeometry.description": "已读取 {layout} 头部和 structure 信息，但未发现 boundary、path、text 或 reference 元素。",
		"stats.textStreams": "文本流",
		"stats.binaryStreams": "二进制流",
		"stats.storageEntries": "目录",
		"stats.properties": "属性",
		"stats.symbols": "符号",
		"stats.footprints": "封装",
		"stats.confidence": "可信度",
		"group.symbol": "元件符号",
		"group.footprint": "封装图形",
		"group.drawing": "图纸信息",
		"state.loading": "正在解析 {type}...",
		"state.errorTitle": "EDA 预览提示",
		"header.format": "格式",
		"header.size": "大小",
		"header.entries": "条目",
		"summary.layoutReady": "{layout} 属于芯片版图工程文件。预览器已在浏览器端解析可识别几何，小图生成 SVG，大图自动切换 WebGL canvas，同时保留结构、字符串和诊断索引。",
		"summary.layoutSafe": "GDSII / OASIS 属于芯片版图工程文件。预览器优先索引结构、属性、可读字符串和二进制线索，并在纯前端安全退化。",
		"summary.orcadSafe": "OLB / DRA 属于 OrCAD / Allegro 生态的私有设计数据。预览器优先解析 CFB 结构、对象候选、属性和可读文本，并在纯前端安全退化。",
		"search.placeholder": "筛选路径、角色、属性或文本",
		"selection.title": "当前条目",
		"selection.none": "未选择",
		"selection.storageTitle": "目录条目",
		"selection.storageDescription": "该节点用于组织下级流，没有可直接展示的文本或十六进制片段。",
		"selection.localStrings": "当前条目字符串",
		"panel.overview": "解析概览",
		"panel.tree": "结构树",
		"panel.objects": "EDA 对象",
		"panel.strings": "可读字符串",
		"panel.diagnostics": "诊断",
		"panel.nodeCount": "{count} 节点",
		"panel.itemCount": "{count} 项",
		"panel.entryCount": "{count} 条目",
		"empty.noObjects.title": "没有明确对象候选",
		"empty.noObjects.description": "仍可从结构树、属性和字符串索引中查看可读内容。",
		"meta.renderer": "渲染器",
		"meta.library": "库",
		"meta.userUnit": "用户单位",
		"meta.dbUnit": "数据库单位",
		"layout.summary": "{structures} 个结构 · {elements} 个元素",
		"layout.webglSummary": "WebGL · {elements} 个元素",
		"layout.aria": "{layout} 版图预览",
		"header.cfbViewer": "CFB 结构预览器",
		"header.binaryViewer": "二进制结构预览器"
	},
	"en-US": {
		"role.root": "Root",
		"role.library": "Library",
		"role.symbol": "Symbol",
		"role.footprint": "Footprint",
		"role.padstack": "Padstack",
		"role.drawing": "Drawing",
		"role.metadata": "Metadata",
		"role.property": "Property",
		"role.geometry": "Geometry",
		"role.net": "Net",
		"role.unknown": "Unknown",
		"confidence.high": "High",
		"confidence.medium": "Medium",
		"confidence.low": "Low",
		"kind.storage": "Directory",
		"kind.text": "Text",
		"kind.binary": "Binary",
		"panel.layout": "Layout preview",
		"empty.noGeometry.title": "No drawable geometry",
		"empty.noGeometry.description": "{layout} headers and structure metadata were read, but no boundary, path, text, or reference elements were found.",
		"stats.textStreams": "Text streams",
		"stats.binaryStreams": "Binary streams",
		"stats.storageEntries": "Directories",
		"stats.properties": "Properties",
		"stats.symbols": "Symbols",
		"stats.footprints": "Footprints",
		"stats.confidence": "Confidence",
		"group.symbol": "Component symbols",
		"group.footprint": "Footprint graphics",
		"group.drawing": "Drawing information",
		"state.loading": "Parsing {type}...",
		"state.errorTitle": "EDA preview notice",
		"header.format": "Format",
		"header.size": "Size",
		"header.entries": "Entries",
		"summary.layoutReady": "{layout} is an IC layout engineering file. Recognizable geometry is parsed in the browser, small drawings use SVG, large drawings switch to WebGL canvas, and structure, strings, and diagnostics remain indexed.",
		"summary.layoutSafe": "GDSII / OASIS are IC layout engineering files. The viewer prioritizes structure, properties, readable strings, and binary clues, then degrades safely in the frontend.",
		"summary.orcadSafe": "OLB / DRA are private OrCAD / Allegro design assets. The viewer prioritizes CFB structure, object candidates, properties, and readable text with safe frontend degradation.",
		"search.placeholder": "Filter paths, roles, properties, or text",
		"selection.title": "Current entry",
		"selection.none": "Not selected",
		"selection.storageTitle": "Directory entry",
		"selection.storageDescription": "This node organizes child streams and has no directly displayable text or hex fragment.",
		"selection.localStrings": "Current entry strings",
		"panel.overview": "Parse overview",
		"panel.tree": "Structure tree",
		"panel.objects": "EDA objects",
		"panel.strings": "Readable strings",
		"panel.diagnostics": "Diagnostics",
		"panel.nodeCount": "{count} nodes",
		"panel.itemCount": "{count} items",
		"panel.entryCount": "{count} entries",
		"empty.noObjects.title": "No clear object candidates",
		"empty.noObjects.description": "Readable content is still available from the structure tree, properties, and string index.",
		"meta.renderer": "Renderer",
		"meta.library": "Library",
		"meta.userUnit": "User unit",
		"meta.dbUnit": "DB unit",
		"layout.summary": "{structures} structures · {elements} elements",
		"layout.webglSummary": "WebGL · {elements} elements",
		"layout.aria": "{layout} layout preview",
		"header.cfbViewer": "CFB structure viewer",
		"header.binaryViewer": "Binary structure viewer"
	},
	"ja-JP": {
		"role.root": "ルート",
		"role.library": "ライブラリ",
		"role.symbol": "シンボル",
		"role.footprint": "フットプリント",
		"role.padstack": "Padstack",
		"role.drawing": "図面",
		"role.metadata": "メタデータ",
		"role.property": "プロパティ",
		"role.geometry": "幾何",
		"role.net": "ネット",
		"role.unknown": "不明",
		"confidence.high": "高",
		"confidence.medium": "中",
		"confidence.low": "低",
		"kind.storage": "ディレクトリ",
		"kind.text": "テキスト",
		"kind.binary": "バイナリ",
		"panel.layout": "レイアウトプレビュー",
		"empty.noGeometry.title": "描画可能な幾何要素がありません",
		"empty.noGeometry.description": "{layout} のヘッダーと構造情報を読み込みましたが、boundary、path、text、reference 要素は見つかりませんでした。",
		"stats.textStreams": "テキストストリーム",
		"stats.binaryStreams": "バイナリストリーム",
		"stats.storageEntries": "ディレクトリ",
		"stats.properties": "プロパティ",
		"stats.symbols": "シンボル",
		"stats.footprints": "フットプリント",
		"stats.confidence": "信頼度",
		"group.symbol": "コンポーネントシンボル",
		"group.footprint": "フットプリント図形",
		"group.drawing": "図面情報",
		"state.loading": "{type} を解析しています...",
		"state.errorTitle": "EDA プレビューのお知らせ",
		"header.format": "形式",
		"header.size": "サイズ",
		"header.entries": "項目",
		"summary.layoutReady": "{layout} は IC レイアウトの工学ファイルです。認識可能な幾何要素をブラウザー内で解析し、小規模図面は SVG、大規模図面は WebGL canvas で表示します。構造、文字列、診断索引も保持します。",
		"summary.layoutSafe": "GDSII / OASIS は IC レイアウトの工学ファイルです。構造、プロパティ、可読文字列、バイナリ構造の手掛かりを優先的に索引化し、フロントエンド内で安全にフォールバックします。",
		"summary.orcadSafe": "OLB / DRA は OrCAD / Allegro 系の独自設計データです。CFB 構造、オブジェクト候補、プロパティ、可読テキストを優先的に解析し、フロントエンド内で安全にフォールバックします。",
		"search.placeholder": "パス、役割、プロパティ、テキストを絞り込み",
		"selection.title": "現在の項目",
		"selection.none": "未選択",
		"selection.storageTitle": "ディレクトリ項目",
		"selection.storageDescription": "このノードは下位ストリームを整理するためのもので、直接表示できるテキストや 16 進断片はありません。",
		"selection.localStrings": "現在の項目の文字列",
		"panel.overview": "解析概要",
		"panel.tree": "構造ツリー",
		"panel.objects": "EDA オブジェクト",
		"panel.strings": "可読文字列",
		"panel.diagnostics": "診断",
		"panel.nodeCount": "{count} ノード",
		"panel.itemCount": "{count} 件",
		"panel.entryCount": "{count} 項目",
		"empty.noObjects.title": "明確なオブジェクト候補がありません",
		"empty.noObjects.description": "構造ツリー、プロパティ、文字列索引から可読内容を確認できます。",
		"meta.renderer": "レンダラー",
		"meta.library": "ライブラリ",
		"meta.userUnit": "ユーザー単位",
		"meta.dbUnit": "データベース単位",
		"layout.summary": "構造 {structures} 件 · 要素 {elements} 件",
		"layout.webglSummary": "WebGL · 要素 {elements} 件",
		"layout.aria": "{layout} レイアウトプレビュー",
		"header.cfbViewer": "CFB 構造ビューアー",
		"header.binaryViewer": "バイナリ構造ビューアー"
	},
	"de-DE": {
		"role.root": "Wurzel",
		"role.library": "Bibliothek",
		"role.symbol": "Symbol",
		"role.footprint": "Footprint",
		"role.padstack": "Padstack",
		"role.drawing": "Zeichnung",
		"role.metadata": "Metadaten",
		"role.property": "Eigenschaft",
		"role.geometry": "Geometrie",
		"role.net": "Netz",
		"role.unknown": "Unbekannt",
		"confidence.high": "Hoch",
		"confidence.medium": "Mittel",
		"confidence.low": "Niedrig",
		"kind.storage": "Verzeichnis",
		"kind.text": "Text",
		"kind.binary": "Binär",
		"panel.layout": "Layoutvorschau",
		"empty.noGeometry.title": "Keine darstellbare Geometrie",
		"empty.noGeometry.description": "Header und Strukturinformationen von {layout} wurden gelesen, aber es wurden keine Boundary-, Path-, Text- oder Referenzelemente gefunden.",
		"stats.textStreams": "Textdatenströme",
		"stats.binaryStreams": "Binärdatenströme",
		"stats.storageEntries": "Verzeichnisse",
		"stats.properties": "Eigenschaften",
		"stats.symbols": "Symbole",
		"stats.footprints": "Footprints",
		"stats.confidence": "Verlässlichkeit",
		"group.symbol": "Bauteilsymbole",
		"group.footprint": "Footprint-Grafiken",
		"group.drawing": "Zeichnungsinformationen",
		"state.loading": "{type} wird verarbeitet...",
		"state.errorTitle": "Hinweis zur EDA-Vorschau",
		"header.format": "Format",
		"header.size": "Größe",
		"header.entries": "Einträge",
		"summary.layoutReady": "{layout} ist eine IC-Layoutdatei. Erkannte Geometrie wird im Browser verarbeitet; kleine Zeichnungen verwenden SVG, große WebGL. Struktur, Zeichenfolgen und Diagnosen bleiben indiziert.",
		"summary.layoutSafe": "GDSII / OASIS sind IC-Layoutdateien. Der Viewer priorisiert Struktur, Eigenschaften, lesbare Zeichenfolgen und binäre Hinweise und fällt im Frontend sicher zurück.",
		"summary.orcadSafe": "OLB / DRA sind private OrCAD-/Allegro-Designdaten. Der Viewer priorisiert CFB-Struktur, Objektkandidaten, Eigenschaften und lesbaren Text und fällt im Frontend sicher zurück.",
		"search.placeholder": "Pfade, Rollen, Eigenschaften oder Text filtern",
		"selection.title": "Aktueller Eintrag",
		"selection.none": "Nicht ausgewählt",
		"selection.storageTitle": "Verzeichniseintrag",
		"selection.storageDescription": "Dieser Knoten organisiert untergeordnete Datenströme und enthält keinen direkt darstellbaren Text- oder Hexadezimalabschnitt.",
		"selection.localStrings": "Zeichenfolgen des aktuellen Eintrags",
		"panel.overview": "Verarbeitungsübersicht",
		"panel.tree": "Strukturbaum",
		"panel.objects": "EDA-Objekte",
		"panel.strings": "Lesbare Zeichenfolgen",
		"panel.diagnostics": "Diagnosen",
		"panel.nodeCount": "{count} Knoten",
		"panel.itemCount": "{count} Elemente",
		"panel.entryCount": "{count} Einträge",
		"empty.noObjects.title": "Keine eindeutigen Objektkandidaten",
		"empty.noObjects.description": "Lesbare Inhalte sind weiterhin im Strukturbaum, in den Eigenschaften und im Zeichenfolgenindex verfügbar.",
		"meta.renderer": "Renderer",
		"meta.library": "Bibliothek",
		"meta.userUnit": "Benutzereinheit",
		"meta.dbUnit": "Datenbankeinheit",
		"layout.summary": "{structures} Strukturen · {elements} Elemente",
		"layout.webglSummary": "WebGL · {elements} Elemente",
		"layout.aria": "{layout}-Layoutvorschau",
		"header.cfbViewer": "CFB-Strukturansicht",
		"header.binaryViewer": "Binärstrukturansicht"
	}
};
var formatEdaUiText = (locale, key, params = {}) => {
	const template = EDA_UI_TEXT[locale]?.[key] || EDA_UI_TEXT["en-US"][key] || key;
	return Object.entries(params).reduce((message, [name, value]) => message.replace(new RegExp(`\\{${name}\\}`, "g"), String(value)), template);
};
var edaStyle = `
.eda-viewer{position:relative;height:100%;min-height:0;display:flex;flex-direction:column;background:#edf1f5;color:#172033;box-sizing:border-box}
.eda-viewer *{box-sizing:border-box}
.eda-header{min-height:84px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 176px 18px 22px;border-bottom:1px solid rgba(23,32,51,.08);background:#fff}
.eda-header span,.eda-panel-head span{color:#0b7480;font-size:12px;font-weight:900;letter-spacing:0}
.eda-header h2{margin:4px 0 0;font-size:22px;line-height:1.2}
.eda-header dl{display:grid;grid-template-columns:repeat(4,minmax(70px,auto));gap:10px;margin:0}
.eda-header dt,.eda-header dd,.eda-entity-group dl,.eda-entity-group dt,.eda-entity-group dd{margin:0}
.eda-header dt{color:#718096;font-size:12px}
.eda-header dd{color:#172033;font-weight:900}
.eda-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(300px,32%) minmax(0,1fr)}
.eda-sidebar{min-height:0;display:flex;flex-direction:column;gap:12px;padding:16px;border-right:1px solid rgba(23,32,51,.08);background:rgba(255,255,255,.74)}
.eda-summary,.eda-warning,.eda-panel,.eda-error{border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px rgba(23,32,51,.06)}
.eda-summary,.eda-warning{padding:12px}
.eda-summary strong{display:block;color:#172033}
.eda-summary p,.eda-warning p,.eda-empty p,.eda-entity-group p{margin:6px 0 0;color:#64748b;line-height:1.55}
.eda-mini-grid,.eda-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.eda-mini-grid div,.eda-stat-grid div{min-width:0;padding:10px;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1px rgba(23,32,51,.06)}
.eda-mini-grid span,.eda-stat-grid span{display:block;color:#718096;font-size:12px}
.eda-mini-grid strong,.eda-stat-grid strong{display:block;margin-top:4px;overflow:hidden;color:#172033;font-size:18px;text-overflow:ellipsis;white-space:nowrap}
.eda-warning{background:#fff7e8;color:#8a4b00}
.eda-search{height:42px;padding:0 12px;border-radius:12px;border:1px solid rgba(23,32,51,.1);outline:none;background:#fff;font:inherit}
.eda-stream-list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:8px}
.eda-stream{min-height:78px;display:grid;grid-template-columns:74px minmax(0,1fr);gap:8px 10px;align-items:center;padding:10px;border:1px solid rgba(23,32,51,.08);border-radius:13px;background:#fff;color:inherit;font:inherit;text-align:left;cursor:pointer}
.eda-stream:hover,.eda-stream.active,.eda-tree button:hover,.eda-tree button.active,.eda-entity-group button:hover{border-color:rgba(11,116,128,.3);box-shadow:0 10px 22px rgba(23,32,51,.08)}
.eda-stream span{grid-row:span 3;min-height:40px;display:inline-flex;align-items:center;justify-content:center;padding:0 8px;border-radius:10px;background:rgba(11,116,128,.12);color:#0b7480;font-size:11px;font-weight:900}
.eda-stream span[data-role='symbol']{background:rgba(34,134,90,.14);color:#1d7a52}
.eda-stream span[data-role='footprint'],.eda-stream span[data-role='padstack']{background:rgba(111,87,190,.14);color:#5c47a5}
.eda-stream strong,.eda-stream em,.eda-tree strong,.eda-tree em,.eda-tree small,.eda-entity-group strong,.eda-entity-group span,.eda-entity-group dd{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.eda-stream em,.eda-stream small{color:#718096;font-size:12px;font-style:normal}
.eda-preview{min-width:0;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:14px;padding:16px}
.eda-panel{min-height:0;overflow:hidden}
.eda-panel-head{min-height:54px;padding:12px 14px;border-bottom:1px solid rgba(23,32,51,.08)}
.eda-panel-head strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.eda-panel--compact .eda-panel-head{min-height:auto}
.eda-stat-grid{padding:14px}
.eda-stat-grid div{background:#f6f9fb}
.eda-topology,.eda-bottom{min-height:300px;display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:14px}
.eda-topology>.eda-panel{min-height:360px;max-height:min(58vh,620px);display:flex;flex-direction:column}
.eda-tree,.eda-entities,.eda-diagnostics,.eda-string-grid{min-height:0;max-height:380px;overflow:auto;overscroll-behavior:contain}
.eda-tree{flex:1;max-height:none;padding:10px}
.eda-entities{flex:1;max-height:none;padding:12px}
.eda-tree button{width:100%;min-height:42px;display:grid;grid-template-columns:minmax(22px,auto) minmax(0,1fr) minmax(72px,auto) minmax(72px,auto);gap:8px;align-items:center;margin-bottom:6px;padding:8px;border:1px solid rgba(23,32,51,.06);border-radius:10px;background:#f8fafc;color:inherit;font:inherit;text-align:left;cursor:pointer}
.eda-tree span{color:#0b7480;font-weight:900}
.eda-tree em,.eda-tree small{color:#718096;font-size:12px;font-style:normal}
.eda-entity-group+.eda-entity-group{margin-top:16px}
.eda-entity-group h3{margin:0 0 8px;color:#172033;font-size:14px}
.eda-entity-group button{width:100%;display:block;margin-bottom:8px;padding:12px;border:1px solid rgba(23,32,51,.08);border-radius:12px;background:#f8fafc;color:inherit;font:inherit;text-align:left;cursor:pointer}
.eda-entity-group button>span{display:block;margin-top:4px;color:#718096;font-size:12px}
.eda-entity-group dl{display:grid;gap:6px;margin-top:10px}
.eda-entity-group dl div{min-width:0;display:grid;grid-template-columns:90px minmax(0,1fr);gap:8px;color:#475569;font-size:12px}
.eda-entity-group dt{color:#718096;font-weight:800}
.eda-selected-meta,.eda-property-grid,.eda-local-strings{display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px 0}
.eda-selected-meta span,.eda-property-grid div,.eda-local-strings span{min-width:0;display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:#eef6f7;color:#0b7480;font-size:12px;font-weight:800}
.eda-selected-meta span,.eda-local-strings span{padding:6px 10px}
.eda-property-grid div{max-width:100%;padding:6px 10px}
.eda-property-grid span{color:#64748b;font-weight:700}
.eda-property-grid strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.eda-panel pre{min-height:220px;max-height:440px;margin:12px 0 0;overflow:auto;padding:16px;border-top:1px solid rgba(23,32,51,.08);background:#101725;color:#d9e7ff;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.eda-layout-panel{min-height:360px;display:flex;flex-direction:column}
.eda-layout-meta{display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(23,32,51,.08)}
.eda-layout-meta span{border-radius:999px;padding:6px 10px;background:#eef6f7;color:#0b7480;font-size:12px;font-weight:800}
.eda-layout-canvas{flex:1;min-height:320px;overflow:auto;background:#111827}
.eda-layout-svg{display:block;min-width:860px;min-height:420px;background:#111827}
.eda-layout-webgl-wrap{position:relative;display:inline-block;min-width:860px;min-height:420px;background:#111827}
.eda-layout-webgl{display:block;background:#111827}
.eda-layout-label-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.eda-layout-label-layer span{position:absolute;max-width:220px;transform:translate(8px,-18px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d9f99d;text-shadow:0 1px 3px #020617;font:700 12px ui-sans-serif,system-ui,sans-serif}
.eda-layout-svg polygon{fill-opacity:.28;stroke-width:1.4;vector-effect:non-scaling-stroke}
.eda-layout-svg polyline{fill:none;stroke-width:2;vector-effect:non-scaling-stroke}
.eda-layout-svg circle{stroke-width:1.4;vector-effect:non-scaling-stroke}
.eda-layout-svg text{paint-order:stroke;stroke:#111827;stroke-width:3px;stroke-linejoin:round;font:700 13px ui-sans-serif,system-ui,sans-serif}
.eda-empty{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
.eda-string-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));align-content:start;gap:8px;padding:14px}
.eda-string-grid span{min-width:0;padding:8px 10px;border-radius:10px;background:#f6f9fb;color:#334155;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.eda-diagnostics{padding:14px}
.eda-diagnostics p{margin:0 0 8px;padding:10px;border-radius:10px;background:#f6f9fb;color:#475569;line-height:1.5}
.eda-diagnostics p[data-level='warning']{background:#fff7e8;color:#8a4b00}
.eda-diagnostics span{display:inline-flex;margin-right:8px;color:#0b7480;font-size:11px;font-weight:900;text-transform:uppercase}
.eda-local-strings{padding-bottom:14px}
.eda-local-strings strong{width:100%;color:#172033;font-size:13px}
.eda-state{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(237,241,245,.9);z-index:2}
.eda-state span{width:32px;height:32px;border-radius:999px;border:3px solid rgba(11,116,128,.16);border-top-color:#0b7480;animation:eda-spin .9s linear infinite}
.eda-error{position:absolute;right:18px;bottom:18px;width:min(440px,calc(100% - 36px));padding:14px;background:#fff7e8;color:#8a4b00;z-index:3}
@keyframes eda-spin{to{transform:rotate(360deg)}}
[data-viewer-theme='dark'] .eda-viewer{background:#172033;color:#e5eef8}
[data-viewer-theme='dark'] .eda-header,[data-viewer-theme='dark'] .eda-summary,[data-viewer-theme='dark'] .eda-panel,[data-viewer-theme='dark'] .eda-sidebar{border-color:rgba(139,148,158,.2);background:#111827;color:#e5eef8;box-shadow:inset 0 0 0 1px rgba(139,148,158,.12)}
[data-viewer-theme='dark'] .eda-header dd,[data-viewer-theme='dark'] .eda-summary strong,[data-viewer-theme='dark'] .eda-mini-grid strong,[data-viewer-theme='dark'] .eda-stat-grid strong,[data-viewer-theme='dark'] .eda-entity-group h3,[data-viewer-theme='dark'] .eda-local-strings strong{color:#f8fafc}
[data-viewer-theme='dark'] .eda-header dt,[data-viewer-theme='dark'] .eda-summary p,[data-viewer-theme='dark'] .eda-mini-grid span,[data-viewer-theme='dark'] .eda-stat-grid span,[data-viewer-theme='dark'] .eda-stream em,[data-viewer-theme='dark'] .eda-stream small,[data-viewer-theme='dark'] .eda-tree em,[data-viewer-theme='dark'] .eda-tree small,[data-viewer-theme='dark'] .eda-entity-group button>span,[data-viewer-theme='dark'] .eda-entity-group dl div,[data-viewer-theme='dark'] .eda-entity-group dt{color:#94a3b8}
[data-viewer-theme='dark'] .eda-mini-grid div,[data-viewer-theme='dark'] .eda-stat-grid div,[data-viewer-theme='dark'] .eda-stream,[data-viewer-theme='dark'] .eda-tree button,[data-viewer-theme='dark'] .eda-entity-group button,[data-viewer-theme='dark'] .eda-string-grid span,[data-viewer-theme='dark'] .eda-diagnostics p{border-color:rgba(139,148,158,.2);background:#1f2937;color:#e5eef8;box-shadow:none}
[data-viewer-theme='dark'] .eda-search{border-color:rgba(139,148,158,.24);background:#0d1117;color:#e6edf3}
[data-viewer-theme='dark'] .eda-selected-meta span,[data-viewer-theme='dark'] .eda-property-grid div,[data-viewer-theme='dark'] .eda-local-strings span,[data-viewer-theme='dark'] .eda-layout-meta span{background:rgba(45,212,191,.12);color:#5eead4}
[data-viewer-theme='dark'] .eda-state{background:rgba(13,17,23,.9);color:#cbd5e1}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .eda-viewer{background:#172033;color:#e5eef8}[data-viewer-theme='system'] .eda-header,[data-viewer-theme='system'] .eda-summary,[data-viewer-theme='system'] .eda-panel,[data-viewer-theme='system'] .eda-sidebar{border-color:rgba(139,148,158,.2);background:#111827;color:#e5eef8;box-shadow:inset 0 0 0 1px rgba(139,148,158,.12)}[data-viewer-theme='system'] .eda-header dd,[data-viewer-theme='system'] .eda-summary strong,[data-viewer-theme='system'] .eda-mini-grid strong,[data-viewer-theme='system'] .eda-stat-grid strong,[data-viewer-theme='system'] .eda-entity-group h3,[data-viewer-theme='system'] .eda-local-strings strong{color:#f8fafc}[data-viewer-theme='system'] .eda-header dt,[data-viewer-theme='system'] .eda-summary p,[data-viewer-theme='system'] .eda-mini-grid span,[data-viewer-theme='system'] .eda-stat-grid span,[data-viewer-theme='system'] .eda-stream em,[data-viewer-theme='system'] .eda-stream small,[data-viewer-theme='system'] .eda-tree em,[data-viewer-theme='system'] .eda-tree small,[data-viewer-theme='system'] .eda-entity-group button>span,[data-viewer-theme='system'] .eda-entity-group dl div,[data-viewer-theme='system'] .eda-entity-group dt{color:#94a3b8}[data-viewer-theme='system'] .eda-mini-grid div,[data-viewer-theme='system'] .eda-stat-grid div,[data-viewer-theme='system'] .eda-stream,[data-viewer-theme='system'] .eda-tree button,[data-viewer-theme='system'] .eda-entity-group button,[data-viewer-theme='system'] .eda-string-grid span,[data-viewer-theme='system'] .eda-diagnostics p{border-color:rgba(139,148,158,.2);background:#1f2937;color:#e5eef8;box-shadow:none}[data-viewer-theme='system'] .eda-search{border-color:rgba(139,148,158,.24);background:#0d1117;color:#e6edf3}[data-viewer-theme='system'] .eda-selected-meta span,[data-viewer-theme='system'] .eda-property-grid div,[data-viewer-theme='system'] .eda-local-strings span,[data-viewer-theme='system'] .eda-layout-meta span{background:rgba(45,212,191,.12);color:#5eead4}[data-viewer-theme='system'] .eda-state{background:rgba(13,17,23,.9);color:#cbd5e1}}
@media (max-width:980px){.eda-header,.eda-body,.eda-topology,.eda-bottom{grid-template-columns:1fr}.eda-header{align-items:flex-start;flex-direction:column;padding-right:22px}.eda-body{display:flex;flex-direction:column}.eda-sidebar{max-height:42vh;border-right:0;border-bottom:1px solid rgba(23,32,51,.08)}}
@media (max-width:640px){.eda-header dl,.eda-mini-grid,.eda-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.eda-tree button{grid-template-columns:minmax(22px,auto) minmax(0,1fr)}.eda-tree em,.eda-tree small{display:none}}
`;
var formatBytes = (value) => {
	if (!Number.isFinite(value) || value < 0) return "-";
	if (value < 1024) return `${value} B`;
	const mb = value / 1024 / 1024;
	if (mb >= 1) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
	return `${(value / 1024).toFixed(value < 10240 ? 1 : 0)} KB`;
};
var roleLabel = (role, locale) => {
	return formatEdaUiText(locale, `role.${role}`) || role;
};
var confidenceLabel = (confidence, locale) => formatEdaUiText(locale, `confidence.${confidence}`);
var kindLabel = (kind, locale) => {
	return formatEdaUiText(locale, `kind.${kind}`);
};
var normalizePath = (value) => value.replace(/^\/+/, "").toLowerCase();
var flattenTree = (nodes, depth = 0) => {
	return nodes.flatMap((node) => [{
		...node,
		depth
	}, ...flattenTree(node.children, depth + 1)]);
};
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = edaStyle;
	return style;
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var appendDefinition = (list, label, value) => {
	const item = document.createElement("div");
	item.append(createElement("dt", void 0, label), createElement("dd", void 0, value));
	list.append(item);
};
var appendPanelHead = (panel, title, value) => {
	const head = createElement("div", "eda-panel-head");
	head.append(createElement("span", void 0, title), createElement("strong", void 0, value));
	panel.append(head);
};
var SVG_NS = "http://www.w3.org/2000/svg";
var layoutPalette = [
	"#5eead4",
	"#93c5fd",
	"#c4b5fd",
	"#f9a8d4",
	"#fde68a",
	"#86efac",
	"#fdba74",
	"#67e8f9"
];
var WEBGL_LAYOUT_ELEMENT_THRESHOLD = 360;
var WEBGL_LAYOUT_VERTEX_THRESHOLD = 1800;
var WEBGL_FLOATS_PER_VERTEX = 5;
var layoutColor = (element) => {
	const layer = Number.isFinite(element.layer) ? Number(element.layer) : 0;
	return layoutPalette[Math.abs(layer) % layoutPalette.length];
};
var countLayoutVertices = (layout) => {
	return layout.elements.reduce((total, element) => total + element.xy.length, 0);
};
var shouldUseWebglLayoutPreview = (layout) => {
	return layout.format === "gdsii" && (layout.elements.length >= WEBGL_LAYOUT_ELEMENT_THRESHOLD || countLayoutVertices(layout) >= WEBGL_LAYOUT_VERTEX_THRESHOLD);
};
var formatOptionalNumber = (value) => {
	if (!Number.isFinite(value)) return "-";
	return Math.abs(Number(value)) < .001 ? Number(value).toExponential(2) : String(value);
};
var createSvgElement = (tagName, attributes) => {
	const element = document.createElementNS(SVG_NS, tagName);
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, String(value));
	});
	return element;
};
var createWebglShader = (gl, type, source) => {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
};
var createWebglProgram = (gl) => {
	const vertexShader = createWebglShader(gl, gl.VERTEX_SHADER, `
    attribute vec2 a_position;
    attribute vec3 a_color;
    varying vec3 v_color;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      gl_PointSize = 5.0;
      v_color = a_color;
    }
  `);
	const fragmentShader = createWebglShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 v_color;
    uniform float u_alpha;
    void main() {
      gl_FragColor = vec4(v_color, u_alpha);
    }
  `);
	if (!vertexShader || !fragmentShader) return null;
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return null;
	}
	return program;
};
var drawWebglVertices = (gl, program, vertices, mode, alpha) => {
	if (!vertices.length) return;
	const buffer = gl.createBuffer();
	if (!buffer) return;
	const stride = WEBGL_FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;
	const positionLocation = gl.getAttribLocation(program, "a_position");
	const colorLocation = gl.getAttribLocation(program, "a_color");
	const alphaLocation = gl.getUniformLocation(program, "u_alpha");
	if (positionLocation < 0 || colorLocation < 0 || !alphaLocation) {
		gl.deleteBuffer(buffer);
		return;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
	gl.enableVertexAttribArray(colorLocation);
	gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
	gl.uniform1f(alphaLocation, alpha);
	gl.drawArrays(mode, 0, vertices.length / WEBGL_FLOATS_PER_VERTEX);
	gl.deleteBuffer(buffer);
};
var renderWebglBatch = (gl, batch, width, height) => {
	const program = createWebglProgram(gl);
	if (!program) return false;
	gl.viewport(0, 0, width, height);
	gl.clearColor(.066, .094, .153, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	drawWebglVertices(gl, program, batch.triangleVertices, gl.TRIANGLES, .32);
	drawWebglVertices(gl, program, batch.lineVertices, gl.LINES, .92);
	drawWebglVertices(gl, program, batch.pointVertices, gl.POINTS, .98);
	gl.deleteProgram(program);
	return true;
};
var createWebglLayoutPreview = (layout, width, height) => {
	const batch = createEdaLayoutWebglBatch(layout, { palette: layoutPalette });
	const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	const wrap = createElement("div", "eda-layout-webgl-wrap");
	wrap.style.width = `${width}px`;
	wrap.style.height = `${height}px`;
	const canvas = document.createElement("canvas");
	canvas.className = "eda-layout-webgl";
	canvas.width = Math.max(1, Math.round(width * devicePixelRatio));
	canvas.height = Math.max(1, Math.round(height * devicePixelRatio));
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	const gl = canvas.getContext("webgl", {
		alpha: false,
		antialias: true,
		preserveDrawingBuffer: true
	}) || canvas.getContext("experimental-webgl");
	if (!gl || !renderWebglBatch(gl, batch, canvas.width, canvas.height)) return null;
	if (batch.labels.length) {
		const labelLayer = createElement("div", "eda-layout-label-layer");
		batch.labels.forEach((label) => {
			const item = createElement("span", void 0, label.text);
			item.title = label.text;
			item.style.left = `${(label.clipX + 1) / 2 * width}px`;
			item.style.top = `${(1 - label.clipY) / 2 * height}px`;
			labelLayer.append(item);
		});
		wrap.append(canvas, labelLayer);
	} else wrap.append(canvas);
	return {
		element: wrap,
		batch
	};
};
var createLayoutPreview = (layout, locale) => {
	const panel = createElement("section", "eda-panel eda-layout-panel");
	const layoutLabel = layout.format === "oasis" ? "OASIS" : "GDSII";
	appendPanelHead(panel, formatEdaUiText(locale, "panel.layout"), `${layoutLabel} · ${formatEdaUiText(locale, "layout.summary", {
		structures: layout.structureCount || layout.structures.length,
		elements: layout.elements.length
	})}`);
	const meta = createElement("div", "eda-layout-meta");
	[
		`${formatEdaUiText(locale, "meta.library")}: ${layout.libraryName || "-"}`,
		`${formatEdaUiText(locale, "meta.userUnit")}: ${formatOptionalNumber(layout.userUnit)}`,
		`${formatEdaUiText(locale, "meta.dbUnit")}: ${formatOptionalNumber(layout.databaseUnit)}`
	].forEach((item) => meta.append(createElement("span", void 0, item)));
	panel.append(meta);
	if (!layout.bounds || !layout.elements.length) {
		panel.append(createEmpty(formatEdaUiText(locale, "empty.noGeometry.title"), formatEdaUiText(locale, "empty.noGeometry.description", { layout: layoutLabel })));
		return panel;
	}
	const bounds = layout.bounds;
	const rawWidth = Math.max(1, bounds.maxX - bounds.minX);
	const rawHeight = Math.max(1, bounds.maxY - bounds.minY);
	const targetHeight = Math.max(460, Math.min(1100, Math.round(1200 * rawHeight / rawWidth)));
	const padding = 40;
	const scale = Math.min(1120 / rawWidth, (targetHeight - 80) / rawHeight);
	const svgWidth = Math.max(860, Math.round(rawWidth * scale + 80));
	const svgHeight = Math.max(420, Math.round(rawHeight * scale + 80));
	const mapPoint = (point) => ({
		x: (point.x - bounds.minX) * scale + padding,
		y: (bounds.maxY - point.y) * scale + padding
	});
	const pointList = (points) => points.map((point) => {
		const mapped = mapPoint(point);
		return `${mapped.x.toFixed(2)},${mapped.y.toFixed(2)}`;
	}).join(" ");
	const canvas = createElement("div", "eda-layout-canvas");
	const webglPreview = shouldUseWebglLayoutPreview(layout) ? createWebglLayoutPreview(layout, svgWidth, svgHeight) : null;
	if (webglPreview) {
		meta.append(createElement("span", void 0, `${formatEdaUiText(locale, "meta.renderer")}: ${formatEdaUiText(locale, "layout.webglSummary", { elements: webglPreview.batch.elementCount })}`));
		webglPreview.batch.warnings.forEach((item) => {
			const warning = createElement("div", "eda-warning");
			warning.append(createElement("p", void 0, item));
			panel.append(warning);
		});
		canvas.append(webglPreview.element);
		panel.append(canvas);
		return panel;
	}
	meta.append(createElement("span", void 0, `${formatEdaUiText(locale, "meta.renderer")}: SVG`));
	const svg = createSvgElement("svg", {
		class: "eda-layout-svg",
		width: svgWidth,
		height: svgHeight,
		viewBox: `0 0 ${svgWidth} ${svgHeight}`,
		role: "img",
		"aria-label": formatEdaUiText(locale, "layout.aria", { layout: layoutLabel })
	});
	svg.append(createSvgElement("rect", {
		x: 0,
		y: 0,
		width: svgWidth,
		height: svgHeight,
		fill: "#111827"
	}));
	layout.elements.forEach((element) => {
		const color = layoutColor(element);
		if ((element.kind === "boundary" || element.kind === "aref") && element.xy.length >= 3) {
			svg.append(createSvgElement("polygon", {
				points: pointList(element.xy),
				fill: color,
				stroke: color
			}));
			return;
		}
		if (element.kind === "path" && element.xy.length >= 2) {
			const strokeWidth = Math.max(1.4, Math.min(10, (element.width || rawWidth / 500) * scale));
			svg.append(createSvgElement("polyline", {
				points: pointList(element.xy),
				stroke: color,
				"stroke-width": strokeWidth
			}));
			return;
		}
		const anchor = element.xy[0];
		if (!anchor) return;
		const mapped = mapPoint(anchor);
		svg.append(createSvgElement("circle", {
			cx: mapped.x,
			cy: mapped.y,
			r: 4.5,
			fill: "#111827",
			stroke: color
		}));
		const label = element.text || element.reference || element.kind.toUpperCase();
		if (label) {
			const text = createSvgElement("text", {
				x: mapped.x + 8,
				y: mapped.y - 8,
				fill: color
			});
			text.append(document.createTextNode(label));
			svg.append(text);
		}
	});
	canvas.append(svg);
	panel.append(canvas);
	return panel;
};
var buildStatsCards = (parsed, locale) => {
	const stats = parsed.stats;
	return [
		{
			label: formatEdaUiText(locale, "stats.textStreams"),
			value: stats.textStreams
		},
		{
			label: formatEdaUiText(locale, "stats.binaryStreams"),
			value: stats.binaryStreams
		},
		{
			label: formatEdaUiText(locale, "stats.storageEntries"),
			value: stats.storageEntries
		},
		{
			label: formatEdaUiText(locale, "stats.properties"),
			value: stats.propertyCount
		},
		{
			label: formatEdaUiText(locale, "stats.symbols"),
			value: stats.symbolCount
		},
		{
			label: formatEdaUiText(locale, "stats.footprints"),
			value: stats.footprintCount
		},
		{
			label: "Padstack",
			value: stats.padstackCount
		},
		{
			label: formatEdaUiText(locale, "stats.confidence"),
			value: confidenceLabel(stats.confidence, locale)
		}
	];
};
var buildEntityGroups = (entities, locale) => {
	const groups = [
		{
			role: "symbol",
			label: formatEdaUiText(locale, "group.symbol"),
			items: []
		},
		{
			role: "footprint",
			label: formatEdaUiText(locale, "group.footprint"),
			items: []
		},
		{
			role: "padstack",
			label: "Padstack",
			items: []
		},
		{
			role: "drawing",
			label: formatEdaUiText(locale, "group.drawing"),
			items: []
		}
	];
	groups.forEach((group) => {
		group.items = entities.filter((entity) => entity.role === group.role);
	});
	return groups.filter((group) => group.items.length);
};
var appendStatGrid = (target, items, className) => {
	const grid = createElement("div", className);
	items.forEach((item) => {
		const cell = document.createElement("div");
		cell.append(createElement("span", void 0, item.label), createElement("strong", void 0, String(item.value)));
		grid.append(cell);
	});
	target.append(grid);
};
var createEmpty = (title, description) => {
	const empty = createElement("div", "eda-empty");
	empty.append(createElement("strong", void 0, title), createElement("p", void 0, description));
	return empty;
};
async function renderEda(buffer, target, type = "olb", context) {
	const normalizedType = [
		"dra",
		"gds",
		"oas",
		"oasis"
	].includes(type) ? type : "olb";
	const locale = resolveFileViewerLocale(context?.options);
	const filename = context?.filename || `preview.${normalizedType}`;
	const root = createElement("section", "eda-viewer");
	const style = createStyle();
	const cleanups = [];
	let selectedStream = null;
	target.replaceChildren(style, root);
	const listen = (element, event, listener) => {
		element.addEventListener(event, listener);
		cleanups.push(() => element.removeEventListener(event, listener));
	};
	const showLoading = () => {
		const state = createElement("div", "eda-state");
		state.append(createElement("span"), createElement("strong", void 0, formatEdaUiText(locale, "state.loading", { type: normalizedType.toUpperCase() })));
		root.append(state);
		return state;
	};
	const showError = (message) => {
		const error = createElement("div", "eda-error");
		error.append(createElement("strong", void 0, formatEdaUiText(locale, "state.errorTitle")), createElement("p", void 0, message));
		root.append(error);
	};
	const renderParsed = (parsed) => {
		selectedStream = parsed.streams.find((stream) => stream.properties.length) || parsed.streams.find((stream) => stream.kind === "text") || parsed.streams[0] || null;
		const statsCards = buildStatsCards(parsed, locale);
		const treeRows = flattenTree(parsed.tree);
		const entityGroups = buildEntityGroups(parsed.entities, locale);
		root.replaceChildren();
		const header = createElement("header", "eda-header");
		const headerTitle = document.createElement("div");
		headerTitle.append(createElement("span", void 0, parsed.parser === "cfb" ? formatEdaUiText(locale, "header.cfbViewer") : formatEdaUiText(locale, "header.binaryViewer")), createElement("h2", void 0, filename));
		const headerStats = document.createElement("dl");
		appendDefinition(headerStats, formatEdaUiText(locale, "header.format"), parsed.type.toUpperCase());
		appendDefinition(headerStats, formatEdaUiText(locale, "header.size"), formatBytes(parsed.byteLength));
		appendDefinition(headerStats, formatEdaUiText(locale, "header.entries"), String(parsed.streamCount));
		appendDefinition(headerStats, formatEdaUiText(locale, "stats.confidence"), confidenceLabel(parsed.stats.confidence, locale));
		header.append(headerTitle, headerStats);
		const body = createElement("div", "eda-body");
		const sidebar = createElement("aside", "eda-sidebar");
		const summary = createElement("div", "eda-summary");
		summary.append(createElement("strong", void 0, parsed.title), createElement("p", void 0, parsed.type === "gds" || parsed.type === "oas" || parsed.type === "oasis" ? parsed.layout ? formatEdaUiText(locale, "summary.layoutReady", { layout: parsed.layout.format === "oasis" ? "OASIS" : "GDSII" }) : formatEdaUiText(locale, "summary.layoutSafe") : formatEdaUiText(locale, "summary.orcadSafe")));
		sidebar.append(summary);
		appendStatGrid(sidebar, statsCards.slice(0, 4), "eda-mini-grid");
		if (parsed.warnings.length) {
			const warning = createElement("div", "eda-warning");
			parsed.warnings.forEach((item) => warning.append(createElement("p", void 0, item)));
			sidebar.append(warning);
		}
		const search = createElement("input", "eda-search");
		search.type = "search";
		search.placeholder = formatEdaUiText(locale, "search.placeholder");
		sidebar.append(search);
		const streamList = createElement("div", "eda-stream-list");
		const preview = createElement("main", "eda-preview");
		let streamButtons = [];
		const currentPanel = createElement("section", "eda-panel");
		const selectedHead = createElement("div", "eda-panel-head");
		const selectedTitle = createElement("span", void 0, formatEdaUiText(locale, "selection.title"));
		const selectedPath = createElement("strong", void 0, formatEdaUiText(locale, "selection.none"));
		selectedHead.append(selectedTitle, selectedPath);
		const selectedMeta = createElement("div", "eda-selected-meta");
		const selectedProperties = createElement("div", "eda-property-grid");
		const selectedPreviewContainer = document.createElement("div");
		currentPanel.append(selectedHead, selectedMeta, selectedProperties, selectedPreviewContainer);
		const localStrings = createElement("div", "eda-local-strings");
		const syncSelection = () => {
			streamButtons.forEach(({ path, button }) => {
				button.classList.toggle("active", normalizePath(path) === normalizePath(selectedStream?.path || ""));
			});
			selectedPath.textContent = selectedStream?.path || formatEdaUiText(locale, "selection.none");
			selectedMeta.replaceChildren();
			selectedProperties.replaceChildren();
			selectedPreviewContainer.replaceChildren();
			localStrings.replaceChildren();
			if (!selectedStream) {
				selectedPreviewContainer.append(createEmpty(formatEdaUiText(locale, "selection.storageTitle"), formatEdaUiText(locale, "selection.storageDescription")));
				return;
			}
			selectedMeta.append(createElement("span", void 0, roleLabel(selectedStream.role, locale)), createElement("span", void 0, kindLabel(selectedStream.kind, locale)), createElement("span", void 0, formatBytes(selectedStream.size)));
			selectedStream.properties.forEach((property) => {
				const item = document.createElement("div");
				item.append(createElement("span", void 0, property.key), createElement("strong", void 0, property.value));
				selectedProperties.append(item);
			});
			const previewText = selectedStream.sample || selectedStream.hex || "";
			if (previewText) selectedPreviewContainer.append(createElement("pre", void 0, previewText));
			else selectedPreviewContainer.append(createEmpty(formatEdaUiText(locale, "selection.storageTitle"), formatEdaUiText(locale, "selection.storageDescription")));
			if (selectedStream.strings.length) {
				localStrings.append(createElement("strong", void 0, formatEdaUiText(locale, "selection.localStrings")));
				selectedStream.strings.forEach((item) => localStrings.append(createElement("span", void 0, item)));
			}
		};
		const selectStream = (stream) => {
			selectedStream = stream;
			syncSelection();
		};
		const selectTreeRow = (row) => {
			const rowPath = normalizePath(row.path);
			const stream = parsed.streams.find((item) => normalizePath(item.path) === rowPath);
			if (stream) selectStream(stream);
		};
		const selectEntity = (entity) => {
			const entityPath = normalizePath(entity.path);
			const stream = parsed.streams.find((item) => {
				const streamPath = normalizePath(item.path);
				return streamPath === entityPath || streamPath.startsWith(`${entityPath}/`);
			});
			if (stream) selectStream(stream);
		};
		const matchesFilter = (stream, keyword) => {
			if (!keyword) return true;
			const propertyText = stream.properties.map((property) => `${property.key}=${property.value}`).join("\n");
			return `${stream.path}\n${stream.name}\n${stream.kind}\n${stream.role}\n${stream.sample || ""}\n${stream.strings.join("\n")}\n${propertyText}`.toLowerCase().includes(keyword);
		};
		const renderStreams = () => {
			const keyword = search.value.trim().toLowerCase();
			streamList.replaceChildren();
			streamButtons = [];
			parsed.streams.filter((stream) => matchesFilter(stream, keyword)).forEach((stream) => {
				const button = createElement("button", "eda-stream");
				button.type = "button";
				const role = createElement("span", void 0, roleLabel(stream.role, locale));
				role.dataset.role = stream.role;
				button.append(role, createElement("strong", void 0, stream.name || stream.path), createElement("em", void 0, stream.path), createElement("small", void 0, `${kindLabel(stream.kind, locale)} · ${formatBytes(stream.size)}`));
				listen(button, "click", () => selectStream(stream));
				streamButtons.push({
					path: stream.path,
					button
				});
				streamList.append(button);
			});
			syncSelection();
		};
		listen(search, "input", renderStreams);
		sidebar.append(streamList);
		const overview = createElement("section", "eda-panel eda-panel--compact");
		appendPanelHead(overview, formatEdaUiText(locale, "panel.overview"), `${parsed.parser.toUpperCase()} · ${formatBytes(parsed.totalStreamBytes)}`);
		appendStatGrid(overview, statsCards, "eda-stat-grid");
		const topology = createElement("section", "eda-topology");
		const treePanel = createElement("div", "eda-panel");
		appendPanelHead(treePanel, formatEdaUiText(locale, "panel.tree"), formatEdaUiText(locale, "panel.nodeCount", { count: treeRows.length }));
		const tree = createElement("div", "eda-tree");
		treeRows.forEach((row) => {
			const button = createElement("button");
			button.type = "button";
			const twist = createElement("span", void 0, row.children.length ? "▸" : "•");
			twist.style.paddingLeft = `${row.depth * 14}px`;
			button.append(twist, createElement("strong", void 0, row.name), createElement("em", void 0, roleLabel(row.role, locale)), createElement("small", void 0, row.size ? formatBytes(row.size) : kindLabel(row.kind, locale)));
			listen(button, "click", () => selectTreeRow(row));
			tree.append(button);
		});
		treePanel.append(tree);
		const entityPanel = createElement("div", "eda-panel");
		appendPanelHead(entityPanel, formatEdaUiText(locale, "panel.objects"), formatEdaUiText(locale, "panel.itemCount", { count: parsed.entities.length }));
		if (entityGroups.length) {
			const entityRoot = createElement("div", "eda-entities");
			entityGroups.forEach((group) => {
				const groupRoot = createElement("div", "eda-entity-group");
				groupRoot.append(createElement("h3", void 0, group.label));
				group.items.forEach((entity) => {
					const button = createElement("button");
					button.type = "button";
					button.append(createElement("strong", void 0, entity.name), createElement("span", void 0, `${formatBytes(entity.byteLength)} · ${formatEdaUiText(locale, "panel.entryCount", { count: entity.streamCount })}`));
					if (entity.description) button.append(createElement("p", void 0, entity.description));
					const detail = document.createElement("dl");
					const addDetail = (label, values) => {
						const normalized = Array.isArray(values) ? values.join(", ") : values;
						if (!normalized) return;
						appendDefinition(detail, label, normalized);
					};
					addDetail("Footprint", entity.footprint);
					addDetail("Pins", entity.pins);
					addDetail("Layers", entity.layers);
					addDetail("Keywords", entity.keywords);
					button.append(detail);
					listen(button, "click", () => selectEntity(entity));
					groupRoot.append(button);
				});
				entityRoot.append(groupRoot);
			});
			entityPanel.append(entityRoot);
		} else entityPanel.append(createEmpty(formatEdaUiText(locale, "empty.noObjects.title"), formatEdaUiText(locale, "empty.noObjects.description")));
		topology.append(treePanel, entityPanel);
		const bottom = createElement("section", "eda-bottom");
		const stringsPanel = createElement("div", "eda-panel");
		appendPanelHead(stringsPanel, formatEdaUiText(locale, "panel.strings"), formatEdaUiText(locale, "panel.itemCount", { count: parsed.strings.length }));
		const stringGrid = createElement("div", "eda-string-grid");
		parsed.strings.forEach((item) => stringGrid.append(createElement("span", void 0, item)));
		stringsPanel.append(stringGrid);
		const diagnosticsPanel = createElement("div", "eda-panel");
		appendPanelHead(diagnosticsPanel, formatEdaUiText(locale, "panel.diagnostics"), formatEdaUiText(locale, "panel.itemCount", { count: parsed.diagnostics.length }));
		const diagnostics = createElement("div", "eda-diagnostics");
		parsed.diagnostics.forEach((diagnostic) => {
			const item = createElement("p");
			item.dataset.level = diagnostic.level;
			item.append(createElement("span", void 0, diagnostic.level), document.createTextNode(diagnostic.message));
			diagnostics.append(item);
		});
		diagnosticsPanel.append(diagnostics, localStrings);
		bottom.append(stringsPanel, diagnosticsPanel);
		if (parsed.layout) preview.append(createLayoutPreview(parsed.layout, locale));
		preview.append(overview, topology, currentPanel, bottom);
		body.append(sidebar, preview);
		root.append(header, body);
		renderStreams();
	};
	const loading = showLoading();
	try {
		renderParsed(await parseEdaFile(buffer, normalizedType, { locale }));
	} catch (nextError) {
		console.error(nextError);
		root.replaceChildren();
		showError(nextError instanceof Error ? nextError.message : String(nextError));
	} finally {
		loading.remove();
	}
	return {
		$el: root,
		unmount() {
			cleanups.splice(0).forEach((cleanup) => cleanup());
			selectedStream = null;
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-eda@3.1.2/node_modules/@file-viewer/renderer-eda/dist/index.js
var edaDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "eda");
if (!edaDefinition) throw new Error("@file-viewer/renderer-eda could not locate the shared EDA renderer definition.");
var edaRendererDefinition = edaDefinition;
var renderFileViewerEda = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderEda } = await import("./eda--V3pP7oG.js");
	return { default: renderEda };
}, []).then(({ default: renderEda }) => renderEda(buffer, target, type, context));
var edaRenderer = {
	id: "file-viewer-renderer-eda",
	label: "Flyfish File Viewer EDA renderer",
	definitions: [edaRendererDefinition],
	handlers: [{
		rendererId: edaRendererDefinition.id,
		handler: renderFileViewerEda
	}]
};
//#endregion
export { parseEdaFile as a, renderEda as i, edaRendererDefinition as n, renderFileViewerEda as r, edaRenderer as t };
