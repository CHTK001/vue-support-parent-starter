import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
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
	const container = (await import("./cfb-DPnV0WO_.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1))).parse(toBytes(buffer), { type: "array" });
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
export { createEdaLayoutWebglBatch as n, parseEdaFile as t };
