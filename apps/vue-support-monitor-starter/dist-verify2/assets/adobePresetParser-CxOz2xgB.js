//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/adobeDescriptor.js
var multiply$1 = (left, right, label) => {
	const result = left * right;
	if (!Number.isSafeInteger(result) || result < 0) throw new Error(`${label} exceeds the safe integer range.`);
	return result;
};
var finite = (value, label) => {
	if (!Number.isFinite(value)) throw new Error(`${label} is not finite.`);
	return value;
};
var AdobeBinaryReader = class {
	bytes;
	view;
	offset = 0;
	constructor(buffer) {
		this.bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
		this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
	}
	get length() {
		return this.bytes.byteLength;
	}
	get remaining() {
		return this.length - this.offset;
	}
	ensure(length, end = this.length, label = "Adobe binary data") {
		if (!Number.isSafeInteger(length) || length < 0 || this.offset > end || length > end - this.offset) throw new Error(`${label} is truncated.`);
	}
	u8(end = this.length, label) {
		this.ensure(1, end, label);
		return this.view.getUint8(this.offset++);
	}
	u16(end = this.length, label) {
		this.ensure(2, end, label);
		const value = this.view.getUint16(this.offset, false);
		this.offset += 2;
		return value;
	}
	i16(end = this.length, label) {
		this.ensure(2, end, label);
		const value = this.view.getInt16(this.offset, false);
		this.offset += 2;
		return value;
	}
	u32(end = this.length, label) {
		this.ensure(4, end, label);
		const value = this.view.getUint32(this.offset, false);
		this.offset += 4;
		return value;
	}
	i32(end = this.length, label) {
		this.ensure(4, end, label);
		const value = this.view.getInt32(this.offset, false);
		this.offset += 4;
		return value;
	}
	i64(end = this.length, label) {
		this.ensure(8, end, label);
		const value = this.view.getBigInt64(this.offset, false);
		this.offset += 8;
		return value;
	}
	f64(end = this.length, label) {
		this.ensure(8, end, label);
		const value = this.view.getFloat64(this.offset, false);
		this.offset += 8;
		return finite(value, label || "Adobe double");
	}
	ascii(length, end = this.length, label = "Adobe ASCII data") {
		this.ensure(length, end, label);
		let value = "";
		for (let index = 0; index < length; index += 1) value += String.fromCharCode(this.bytes[this.offset + index]);
		this.offset += length;
		return value;
	}
	slice(length, end = this.length, label = "Adobe binary data") {
		this.ensure(length, end, label);
		const value = this.bytes.subarray(this.offset, this.offset + length);
		this.offset += length;
		return value;
	}
	skip(length, end = this.length, label = "Adobe binary data") {
		this.ensure(length, end, label);
		this.offset += length;
	}
};
var readUnicode = (reader, end, limits, label) => {
	const count = reader.u32(end, `${label} length`);
	if (count > limits.maxResourceNameCodeUnits + 1) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-code-unit safety limit.`);
	const bytes = reader.slice(multiply$1(count, 2, `${label} bytes`), end, label);
	let value = "";
	for (let index = 0; index < count; index += 1) {
		const code = bytes[index * 2] << 8 | bytes[index * 2 + 1];
		if (code === 0 && index === count - 1) continue;
		if (code >= 55296 && code <= 56319) {
			if (index + 1 >= count) throw new Error(`${label} ends with an unpaired UTF-16 surrogate.`);
			const low = bytes[(index + 1) * 2] << 8 | bytes[(index + 1) * 2 + 1];
			if (low < 56320 || low > 57343) throw new Error(`${label} contains an invalid UTF-16 surrogate pair.`);
			value += String.fromCodePoint(65536 + (code - 55296 << 10) + (low - 56320));
			index += 1;
		} else if (code >= 56320 && code <= 57343) throw new Error(`${label} contains an unpaired UTF-16 surrogate.`);
		else value += String.fromCharCode(code);
	}
	if (value.length > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-code-unit safety limit.`);
	return value;
};
var readId = (reader, end, limits, label) => {
	const declared = reader.u32(end, `${label} length`);
	const length = declared === 0 ? 4 : declared;
	if (length === 0 || length > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-byte safety limit.`);
	return reader.ascii(length, end, label);
};
var consume = (budget, count, label) => {
	if (!Number.isSafeInteger(count) || count < 0 || count > budget.maximum - budget.values) throw new Error(`${label} exceeds the ${budget.maximum}-value descriptor safety limit.`);
	budget.values += count;
};
var readClass = (reader, end, limits, label) => ({
	name: readUnicode(reader, end, limits, `${label} name`),
	classId: readId(reader, end, limits, `${label} id`)
});
var readReference = (reader, end, limits, budget) => {
	const count = reader.u32(end, "Adobe reference count");
	consume(budget, count, "Adobe reference count");
	const values = [];
	for (let index = 0; index < count; index += 1) {
		const form = reader.ascii(4, end, "Adobe reference form");
		const { name: className, classId } = readClass(reader, end, limits, "Adobe reference class");
		const value = {
			form,
			className,
			classId
		};
		if (form === "prop") value.property = readId(reader, end, limits, "Adobe reference property");
		else if (form === "Enmr") {
			value.enumType = readId(reader, end, limits, "Adobe reference enum type");
			value.enumValue = readId(reader, end, limits, "Adobe reference enum value");
		} else if (form === "rele" || form === "Idnt" || form === "indx") value.index = reader.i32(end, "Adobe reference index");
		else if (form === "name") value.name = readUnicode(reader, end, limits, "Adobe reference name");
		else if (form !== "Clss") throw new Error(`Unsupported Adobe reference form ${JSON.stringify(form)}.`);
		values.push(value);
	}
	return values;
};
var readPath = (reader, end, limits) => {
	const length = reader.u32(end, "Adobe descriptor path length");
	if (length > limits.maxDecodedBytes) throw new Error(`Adobe descriptor path exceeds the ${limits.maxDecodedBytes}-byte safety limit.`);
	reader.skip(length, end, "Adobe descriptor path");
	return {
		type: "path",
		length
	};
};
var readValue = (reader, end, type, limits, budget, depth) => {
	if (depth > limits.maxNestingDepth) throw new Error(`Adobe descriptor nesting exceeds the ${limits.maxNestingDepth}-level safety limit.`);
	switch (type) {
		case "bool": return {
			type: "boolean",
			value: reader.u8(end, "Adobe boolean") !== 0
		};
		case "long": return {
			type: "integer",
			value: reader.i32(end, "Adobe integer")
		};
		case "comp": return {
			type: "large-integer",
			value: reader.i64(end, "Adobe large integer")
		};
		case "doub": return {
			type: "double",
			value: reader.f64(end, "Adobe double")
		};
		case "UntF": return {
			type: "unit-double",
			unit: reader.ascii(4, end, "Adobe unit"),
			value: reader.f64(end, "Adobe unit double")
		};
		case "TEXT": return {
			type: "text",
			value: readUnicode(reader, end, limits, "Adobe descriptor text")
		};
		case "enum": return {
			type: "enum",
			enumType: readId(reader, end, limits, "Adobe enum type"),
			value: readId(reader, end, limits, "Adobe enum value")
		};
		case "Objc":
		case "GlbO": return {
			type: "object",
			value: readAdobeDescriptor(reader, end, limits, budget, depth + 1)
		};
		case "VlLs": {
			const count = reader.u32(end, "Adobe list count");
			consume(budget, count, "Adobe list count");
			const value = [];
			for (let index = 0; index < count; index += 1) value.push(readValue(reader, end, reader.ascii(4, end, "Adobe list value type"), limits, budget, depth + 1));
			return {
				type: "list",
				value
			};
		}
		case "alis":
		case "tdta": {
			const length = reader.u32(end, "Adobe raw data length");
			if (length > limits.maxDecodedBytes) throw new Error(`Adobe raw data exceeds the ${limits.maxDecodedBytes}-byte safety limit.`);
			reader.skip(length, end, "Adobe raw data");
			return {
				type: "raw",
				length,
				alias: type === "alis"
			};
		}
		case "type":
		case "GlbC": {
			const value = readClass(reader, end, limits, "Adobe class reference");
			return {
				type: "class",
				name: value.name,
				classId: value.classId
			};
		}
		case "UnFl": {
			const unit = reader.ascii(4, end, "Adobe unit-float-array unit");
			const count = reader.u32(end, "Adobe unit-float-array count");
			consume(budget, count, "Adobe unit-float-array count");
			return {
				type: "unit-double-array",
				unit,
				value: Array.from({ length: count }, () => reader.f64(end, "Adobe unit-float-array value"))
			};
		}
		case "ObAr": {
			const count = reader.u32(end, "Adobe object-array count");
			consume(budget, count, "Adobe object-array count");
			return {
				type: "object-array",
				count,
				value: readAdobeDescriptor(reader, end, limits, budget, depth + 1)
			};
		}
		case "obj ": return {
			type: "reference",
			value: readReference(reader, end, limits, budget)
		};
		case "Pth ": return readPath(reader, end, limits);
		default: throw new Error(`Unsupported Adobe descriptor value type ${JSON.stringify(type)}.`);
	}
};
var createAdobeDescriptorBudget = (limits) => {
	const items = Number.isSafeInteger(limits.maxResourceItems) && limits.maxResourceItems > 0 ? Math.min(1e6, limits.maxResourceItems) : 1;
	return {
		values: 0,
		maximum: items > 3906 ? 1e6 : items * 256
	};
};
var readAdobeDescriptor = (reader, end, limits, budget = createAdobeDescriptorBudget(limits), depth = 0) => {
	if (depth > limits.maxNestingDepth) throw new Error(`Adobe descriptor nesting exceeds the ${limits.maxNestingDepth}-level safety limit.`);
	const name = readUnicode(reader, end, limits, "Adobe descriptor name");
	const classId = readId(reader, end, limits, "Adobe descriptor class");
	const count = reader.u32(end, "Adobe descriptor item count");
	consume(budget, count, "Adobe descriptor item count");
	const entries = /* @__PURE__ */ new Map();
	const keys = [];
	for (let index = 0; index < count; index += 1) {
		const key = readId(reader, end, limits, "Adobe descriptor key");
		if (entries.has(key)) throw new Error(`Adobe descriptor contains duplicate key ${JSON.stringify(key)}.`);
		const type = reader.ascii(4, end, "Adobe descriptor value type");
		entries.set(key, readValue(reader, end, type, limits, budget, depth + 1));
		keys.push(key);
	}
	return {
		name,
		classId,
		entries,
		keys
	};
};
var descriptorValue = (descriptor, key) => descriptor?.entries.get(key);
var descriptorObject = (descriptor, key) => {
	const value = descriptorValue(descriptor, key);
	return value?.type === "object" ? value.value : void 0;
};
var descriptorText = (descriptor, key) => {
	const value = descriptorValue(descriptor, key);
	return value?.type === "text" ? value.value : void 0;
};
var descriptorEnum = (descriptor, key) => {
	const value = descriptorValue(descriptor, key);
	return value?.type === "enum" ? value.value : void 0;
};
var descriptorBoolean = (descriptor, key, fallback = false) => {
	const value = descriptorValue(descriptor, key);
	return value?.type === "boolean" ? value.value : fallback;
};
var descriptorNumber = (descriptor, key, fallback = 0) => {
	const value = descriptorValue(descriptor, key);
	if (!value) return fallback;
	if (value.type === "integer" || value.type === "double" || value.type === "unit-double") return value.value;
	if (value.type === "large-integer") return Number(value.value);
	return fallback;
};
var readAdobeUnicode = readUnicode;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/adobePresetParser.js
var limitKeys = [
	"maxFileBytes",
	"maxCanvasPixels",
	"maxCanvasDimension",
	"maxLayers",
	"maxNestingDepth",
	"maxLayerPixels",
	"maxDecodedBytes",
	"maxLayerCacheBytes",
	"maxResourceItems",
	"maxResourceNameCodeUnits",
	"maxResourcePreviewPixels"
];
var assertLimits = (limits) => {
	for (const key of limitKeys) {
		const value = limits[key];
		if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid Adobe preset safety limit ${key}.`);
	}
};
var align4 = (value) => value + 3 & -4;
var add = (left, right, label) => {
	const result = left + right;
	if (!Number.isSafeInteger(result) || result < 0) throw new Error(`${label} exceeds the safe integer range.`);
	return result;
};
var multiply = (left, right, label) => {
	const result = left * right;
	if (!Number.isSafeInteger(result) || result < 0) throw new Error(`${label} exceeds the safe integer range.`);
	return result;
};
var assertSource = (buffer, limits, format) => {
	if (buffer.byteLength > limits.maxFileBytes) throw new Error(`${format} source exceeds the ${limits.maxFileBytes}-byte safety limit.`);
	if (!buffer.byteLength) throw new Error(`${format} source is empty.`);
};
var usePreviewBudget = (budget, pixels, bytes, limits, label) => {
	budget.previewPixels = add(budget.previewPixels, pixels, `${label} preview pixels`);
	budget.decodedBytes = add(budget.decodedBytes, bytes, `${label} decoded bytes`);
	if (budget.previewPixels > limits.maxResourcePreviewPixels) throw new Error(`${label} exceeds the ${limits.maxResourcePreviewPixels}-pixel preview safety limit.`);
	if (budget.decodedBytes > limits.maxDecodedBytes) throw new Error(`${label} exceeds the ${limits.maxDecodedBytes}-byte decoded-data safety limit.`);
};
var readPascal = (reader, end, limits, label) => {
	const length = reader.u8(end, `${label} length`);
	if (length > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-byte safety limit.`);
	const value = reader.ascii(length, end, label);
	let contentEnd = value.length;
	while (contentEnd > 0 && value.charCodeAt(contentEnd - 1) === 0) contentEnd -= 1;
	return value.slice(0, contentEnd);
};
var decodePackBits = (reader, end, width, height, collect, label) => {
	const rowLengths = Array.from({ length: height }, (_, row) => reader.u16(end, `${label} row ${row} length`));
	const output = collect ? new Uint8Array(multiply(width, height, `${label} pixels`)) : void 0;
	for (let row = 0; row < height; row += 1) {
		const rowEnd = add(reader.offset, rowLengths[row], `${label} row ${row} end`);
		if (rowEnd > end) throw new Error(`${label} compressed row ${row} is truncated.`);
		let decoded = 0;
		while (reader.offset < rowEnd) {
			const header = reader.u8(rowEnd, `${label} PackBits header`);
			if (header <= 127) {
				const count = header + 1;
				const values = reader.slice(count, rowEnd, `${label} PackBits literal`);
				if (decoded + count > width) throw new Error(`${label} row ${row} expands beyond its declared width.`);
				if (output) output.set(values, row * width + decoded);
				decoded += count;
			} else if (header >= 129) {
				const count = 257 - header;
				const value = reader.u8(rowEnd, `${label} PackBits repeat value`);
				if (decoded + count > width) throw new Error(`${label} row ${row} expands beyond its declared width.`);
				output?.fill(value, row * width + decoded, row * width + decoded + count);
				decoded += count;
			}
		}
		if (decoded !== width) throw new Error(`${label} row ${row} expands to ${decoded} instead of ${width} pixels.`);
	}
	if (reader.offset !== end) throw new Error(`${label} has trailing compressed bytes.`);
	return output;
};
var decodePlane = (reader, end, width, height, compression, collect, label) => {
	const pixels = multiply(width, height, `${label} pixels`);
	if (compression === 0) {
		if (reader.offset + pixels !== end) throw new Error(`${label} raw byte length does not match its dimensions.`);
		return collect ? Uint8Array.from(reader.slice(pixels, end, label)) : (reader.skip(pixels, end, label), void 0);
	}
	if (compression === 1) return decodePackBits(reader, end, width, height, collect, label);
	throw new Error(`${label} uses unsupported compression mode ${compression}.`);
};
var putPlane = (rgba, canvas, plane, rectangle, channel, colorMode, palette, indices) => {
	for (let y = 0; y < rectangle.height; y += 1) for (let x = 0; x < rectangle.width; x += 1) {
		const source = y * rectangle.width + x;
		const destination = ((rectangle.top - canvas.top + y) * canvas.width + rectangle.left - canvas.left + x) * 4;
		const value = plane[source];
		if (colorMode === 1 && channel === 0) {
			rgba[destination] = value;
			rgba[destination + 1] = value;
			rgba[destination + 2] = value;
		} else if (colorMode === 2 && channel === 0 && palette) {
			rgba[destination] = palette[value * 3];
			rgba[destination + 1] = palette[value * 3 + 1];
			rgba[destination + 2] = palette[value * 3 + 2];
			if (indices) indices[(rectangle.top - canvas.top + y) * canvas.width + rectangle.left - canvas.left + x] = value;
		} else rgba[destination + channel] = value;
	}
};
var parsePatternRecord = (reader, end, limits, budget, standalone, index) => {
	if (reader.u32(end, `PAT pattern ${index} version`) !== 1) throw new Error(`PAT pattern ${index} uses an unsupported record version.`);
	const colorMode = reader.u32(end, `PAT pattern ${index} color mode`);
	if (colorMode !== 1 && colorMode !== 2 && colorMode !== 3) throw new Error(`PAT pattern ${index} uses unsupported color mode ${colorMode}; only 8-bit grayscale, indexed, and RGB tiles are decoded.`);
	const headerVertical = reader.i16(end, `PAT pattern ${index} vertical value`);
	const headerHorizontal = reader.i16(end, `PAT pattern ${index} horizontal value`);
	const name = readAdobeUnicode(reader, end, limits, `PAT pattern ${index} name`);
	const id = readPascal(reader, end, limits, `PAT pattern ${index} id`);
	if (!id) throw new Error(`PAT pattern ${index} has an empty unique id.`);
	let palette;
	let transparentIndex = 65535;
	if (colorMode === 2) {
		palette = Uint8Array.from(reader.slice(768, end, `PAT pattern ${index} indexed palette`));
		if (standalone) {
			reader.u16(end, `PAT pattern ${index} indexed color count`);
			transparentIndex = reader.u16(end, `PAT pattern ${index} transparent palette index`);
		} else reader.skip(4, end, `PAT pattern ${index} indexed footer`);
	}
	if (reader.u32(end, `PAT pattern ${index} VMAL version`) !== 3) throw new Error(`PAT pattern ${index} uses an unsupported VMAL version.`);
	const vmaLength = reader.u32(end, `PAT pattern ${index} VMAL length`);
	const vmaEnd = add(reader.offset, vmaLength, `PAT pattern ${index} VMAL end`);
	if (vmaEnd > end) throw new Error(`PAT pattern ${index} VMAL is truncated.`);
	const top = reader.i32(vmaEnd, `PAT pattern ${index} top`);
	const left = reader.i32(vmaEnd, `PAT pattern ${index} left`);
	const bottom = reader.i32(vmaEnd, `PAT pattern ${index} bottom`);
	const right = reader.i32(vmaEnd, `PAT pattern ${index} right`);
	const width = right - left;
	const height = bottom - top;
	const declaredChannels = reader.u32(vmaEnd, `PAT pattern ${index} channel count`);
	if (width <= 0 || height <= 0 || width > limits.maxCanvasDimension || height > limits.maxCanvasDimension) throw new Error(`PAT pattern ${index} dimensions exceed the ${limits.maxCanvasDimension}-pixel side safety limit.`);
	if (standalone && (headerHorizontal !== width || headerVertical !== height)) throw new Error(`PAT pattern ${index} header dimensions disagree with its decoded VMAL bounds.`);
	if (declaredChannels > 64) throw new Error(`PAT pattern ${index} channel count exceeds the 64-channel safety limit.`);
	const pixels = multiply(width, height, `PAT pattern ${index} pixels`);
	usePreviewBudget(budget, pixels, multiply(pixels, 4, `PAT pattern ${index} RGBA bytes`), limits, `PAT pattern ${index}`);
	const rgba = new Uint8Array(pixels * 4);
	for (let offset = 3; offset < rgba.length; offset += 4) rgba[offset] = 255;
	const indices = colorMode === 2 ? new Uint8Array(pixels) : void 0;
	const requiredColorPlanes = colorMode === 3 ? 3 : 1;
	const seenColorPlanes = /* @__PURE__ */ new Set();
	let hasAlphaPlane = false;
	const canvas = {
		top,
		left,
		width,
		height
	};
	for (let slot = 0; slot < declaredChannels + 2; slot += 1) {
		const present = reader.u32(vmaEnd, `PAT pattern ${index} channel ${slot} presence`);
		if (!present) continue;
		if (present !== 1) throw new Error(`PAT pattern ${index} channel ${slot} has an invalid presence marker.`);
		const length = reader.u32(vmaEnd, `PAT pattern ${index} channel ${slot} length`);
		if (length < 23) throw new Error(`PAT pattern ${index} channel ${slot} is shorter than its header.`);
		const channelEnd = add(reader.offset, length, `PAT pattern ${index} channel ${slot} end`);
		if (channelEnd > vmaEnd) throw new Error(`PAT pattern ${index} channel ${slot} is truncated.`);
		const depth = reader.u32(channelEnd, `PAT pattern ${index} channel ${slot} depth`);
		const channelTop = reader.i32(channelEnd, `PAT pattern ${index} channel ${slot} top`);
		const channelLeft = reader.i32(channelEnd, `PAT pattern ${index} channel ${slot} left`);
		const channelBottom = reader.i32(channelEnd, `PAT pattern ${index} channel ${slot} bottom`);
		const channelRight = reader.i32(channelEnd, `PAT pattern ${index} channel ${slot} right`);
		const depthCopy = reader.u16(channelEnd, `PAT pattern ${index} channel ${slot} depth copy`);
		const compression = reader.u8(channelEnd, `PAT pattern ${index} channel ${slot} compression`);
		if (depth !== 8 || depthCopy !== 8) throw new Error(`PAT pattern ${index} channel ${slot} is not 8-bit.`);
		if (channelTop < top || channelLeft < left || channelBottom > bottom || channelRight > right || channelBottom <= channelTop || channelRight <= channelLeft) throw new Error(`PAT pattern ${index} channel ${slot} bounds are outside the tile.`);
		const channelWidth = channelRight - channelLeft;
		const channelHeight = channelBottom - channelTop;
		const isColor = slot < requiredColorPlanes;
		const isAlpha = slot === declaredChannels + 1;
		const plane = decodePlane(reader, channelEnd, channelWidth, channelHeight, compression, isColor || isAlpha, `PAT pattern ${index} channel ${slot}`);
		if (plane && isColor) {
			seenColorPlanes.add(slot);
			putPlane(rgba, canvas, plane, {
				top: channelTop,
				left: channelLeft,
				width: channelWidth,
				height: channelHeight
			}, slot, colorMode, palette, indices);
		} else if (plane && isAlpha) {
			hasAlphaPlane = true;
			putPlane(rgba, canvas, plane, {
				top: channelTop,
				left: channelLeft,
				width: channelWidth,
				height: channelHeight
			}, 3, colorMode);
		}
	}
	if (reader.offset !== vmaEnd) throw new Error(`PAT pattern ${index} VMAL has trailing or unparsed bytes.`);
	if (seenColorPlanes.size !== requiredColorPlanes) throw new Error(`PAT pattern ${index} is missing one or more required color planes.`);
	if (colorMode === 2 && !hasAlphaPlane && transparentIndex < 256 && indices) {
		for (let pixel = 0; pixel < indices.length; pixel += 1) if (indices[pixel] === transparentIndex) rgba[pixel * 4 + 3] = 0;
	}
	let hasTransparency = false;
	for (let pixel = 0; pixel < pixels; pixel += 1) if (rgba[pixel * 4 + 3] !== 255) {
		hasTransparency = true;
		break;
	}
	return {
		name: name || `Pattern ${index}`,
		id,
		width,
		height,
		colorMode: colorMode === 1 ? "grayscale" : colorMode === 2 ? "indexed" : "rgb",
		rgba,
		hasTransparency
	};
};
var parsePatternBlock = (reader, end, limits, budget) => {
	const patterns = [];
	while (reader.offset < end) {
		if (patterns.length >= limits.maxResourceItems) throw new Error(`Embedded pattern count exceeds the ${limits.maxResourceItems}-item safety limit.`);
		const length = reader.u32(end, "Embedded PAT record length");
		const recordEnd = add(reader.offset, length, "Embedded PAT record end");
		const paddedEnd = add(reader.offset, align4(length), "Embedded PAT padded end");
		if (!length || recordEnd > end || paddedEnd > end) throw new Error("Embedded PAT record is truncated.");
		patterns.push(parsePatternRecord(reader, recordEnd, limits, budget, false, patterns.length + 1));
		if (reader.offset !== recordEnd) throw new Error(`Embedded PAT pattern ${patterns.length} length does not match its decoded payload.`);
		for (const value of reader.slice(paddedEnd - recordEnd, paddedEnd, "Embedded PAT padding")) if (value !== 0) throw new Error(`Embedded PAT pattern ${patterns.length} has non-zero alignment bytes.`);
	}
	if (reader.offset !== end) throw new Error("Embedded PAT block length is invalid.");
	return patterns;
};
var parsePat = (buffer, limits) => {
	assertSource(buffer, limits, "PAT");
	const reader = new AdobeBinaryReader(buffer);
	if (reader.ascii(4, reader.length, "PAT signature") !== "8BPT") throw new Error("Invalid Photoshop PAT signature.");
	if (reader.u16(reader.length, "PAT version") !== 1) throw new Error("Unsupported Photoshop PAT version; expected version 1.");
	const count = reader.u32(reader.length, "PAT pattern count");
	if (!count || count > limits.maxResourceItems) throw new Error(`PAT pattern count must be between 1 and ${limits.maxResourceItems}.`);
	const budget = {
		previewPixels: 0,
		decodedBytes: 0
	};
	const patterns = Array.from({ length: count }, (_, index) => parsePatternRecord(reader, reader.length, limits, budget, true, index + 1));
	parseOptionalHierarchy(reader, limits, createAdobeDescriptorBudget(limits), patterns.length);
	return {
		format: "pat",
		version: "1",
		engine: "file-viewer-native",
		fidelity: "decoded-pattern-tile",
		patterns,
		limitations: ["The renderer decodes Photoshop PAT v1 grayscale, indexed, and RGB tiles with 8-bit raw or PackBits planes; CMYK, Lab, multichannel, 16-bit, and 32-bit pattern records are rejected.", "Tile pixels and transparency are preserved. Photoshop pattern transforms, fills, layer blending, and color-management behavior are outside a standalone PAT library."]
	};
};
var clamp = (value, minimum, maximum, label) => {
	if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`${label} is outside ${minimum}…${maximum}.`);
	return value;
};
var byte = (value) => Math.max(0, Math.min(255, Math.round(value)));
var hsvToRgb = (hue, saturation, brightness) => {
	const h = (hue % 360 + 360) % 360 / 60;
	const s = Math.max(0, Math.min(1, saturation / 100));
	const v = Math.max(0, Math.min(1, brightness / 100));
	const chroma = v * s;
	const x = chroma * (1 - Math.abs(h % 2 - 1));
	const m = v - chroma;
	return (h < 1 ? [
		chroma,
		x,
		0
	] : h < 2 ? [
		x,
		chroma,
		0
	] : h < 3 ? [
		0,
		chroma,
		x
	] : h < 4 ? [
		0,
		x,
		chroma
	] : h < 5 ? [
		x,
		0,
		chroma
	] : [
		chroma,
		0,
		x
	]).map((value) => byte((value + m) * 255));
};
var labToRgb = (lightness, a, b) => {
	const delta = 6 / 29;
	const inverse = (value) => value > delta ? value ** 3 : 3 * delta * delta * (value - 4 / 29);
	const fy = (lightness + 16) / 116;
	const d50X = .96422 * inverse(fy + a / 500);
	const d50Y = inverse(fy);
	const d50Z = .82521 * inverse(fy - b / 200);
	const x = .9555766 * d50X - .0230393 * d50Y + .0631636 * d50Z;
	const y = -.0282895 * d50X + 1.0099416 * d50Y + .0210077 * d50Z;
	const z = .0122982 * d50X - .020483 * d50Y + 1.3299098 * d50Z;
	return [
		3.2404542 * x - 1.5371385 * y - .4985314 * z,
		-.969266 * x + 1.8760108 * y + .041556 * z,
		.0556434 * x - .2040259 * y + 1.0572252 * z
	].map((component) => byte((component <= .0031308 ? 12.92 * component : 1.055 * Math.max(0, component) ** (1 / 2.4) - .055) * 255));
};
var parseGradientColor = (descriptor) => {
	if (!descriptor) return {
		rgb: [
			0,
			0,
			0
		],
		colorSpace: "unknown"
	};
	if (descriptor.classId === "RGBC") return {
		rgb: [
			byte(descriptorNumber(descriptor, "Rd  ")),
			byte(descriptorNumber(descriptor, "Grn ")),
			byte(descriptorNumber(descriptor, "Bl  "))
		],
		colorSpace: "rgb"
	};
	if (descriptor.classId === "Grsc") {
		const gray = byte(clamp(descriptorNumber(descriptor, "Gry "), 0, 100, "GRD gray") * 2.55);
		return {
			rgb: [
				gray,
				gray,
				gray
			],
			colorSpace: "gray"
		};
	}
	if (descriptor.classId === "HSBC" || descriptor.classId === "HSBl") return {
		rgb: hsvToRgb(descriptorNumber(descriptor, "H   "), descriptorNumber(descriptor, "Strt"), descriptorNumber(descriptor, "Brgh")),
		colorSpace: "hsb"
	};
	if (descriptor.classId === "LbCl") return {
		rgb: labToRgb(descriptorNumber(descriptor, "Lmnc"), descriptorNumber(descriptor, "A   "), descriptorNumber(descriptor, "B   ")),
		colorSpace: "lab"
	};
	if (descriptor.classId === "CMYC") {
		const c = clamp(descriptorNumber(descriptor, "Cyn "), 0, 100, "GRD cyan") / 100;
		const m = clamp(descriptorNumber(descriptor, "Mgnt"), 0, 100, "GRD magenta") / 100;
		const y = clamp(descriptorNumber(descriptor, "Ylw "), 0, 100, "GRD yellow") / 100;
		const k = clamp(descriptorNumber(descriptor, "Blck"), 0, 100, "GRD black") / 100;
		return {
			rgb: [
				byte((1 - c) * (1 - k) * 255),
				byte((1 - m) * (1 - k) * 255),
				byte((1 - y) * (1 - k) * 255)
			],
			colorSpace: "cmyk"
		};
	}
	return {
		rgb: [
			0,
			0,
			0
		],
		colorSpace: "unknown"
	};
};
var listObjects = (value, label, maximum) => {
	if (!value || value.type !== "list") throw new Error(`${label} list is missing.`);
	if (value.value.length > maximum) throw new Error(`${label} exceeds the ${maximum}-item safety limit.`);
	return value.value.map((item, index) => {
		if (item.type !== "object") throw new Error(`${label} item ${index + 1} is not an object.`);
		return item.value;
	});
};
var midpointCurve = (value, midpoint) => value <= midpoint ? midpoint <= 0 ? .5 : .5 * value / midpoint : midpoint >= 1 ? .5 : .5 + .5 * (value - midpoint) / (1 - midpoint);
var interpolate = (stops, position, channels) => {
	if (position <= stops[0].location) return stops[0].value;
	if (position >= stops.at(-1).location) return stops.at(-1).value;
	const rightIndex = stops.findIndex((stop) => stop.location >= position);
	const left = stops[rightIndex - 1];
	const right = stops[rightIndex];
	const span = Math.max(1e-9, right.location - left.location);
	const progress = midpointCurve((position - left.location) / span, Math.max(.001, Math.min(.999, left.midpoint)));
	return Array.from({ length: channels }, (_, channel) => left.value[channel] + (right.value[channel] - left.value[channel]) * progress);
};
var renderSolidGradient = (colorStops, alphaStops) => {
	const output = /* @__PURE__ */ new Uint8Array(1024);
	const colors = colorStops.map((stop) => ({
		location: stop.location,
		midpoint: stop.midpoint,
		value: stop.rgb
	}));
	const alphas = alphaStops.map((stop) => ({
		location: stop.location,
		midpoint: stop.midpoint,
		value: [stop.opacity]
	}));
	for (let pixel = 0; pixel < 256; pixel += 1) {
		const position = pixel / 255;
		const rgb = interpolate(colors, position, 3);
		const alpha = interpolate(alphas, position, 1)[0];
		output.set([
			byte(rgb[0]),
			byte(rgb[1]),
			byte(rgb[2]),
			byte(alpha * 255)
		], pixel * 4);
	}
	return output;
};
var readIntegerRange = (descriptor, key, fallback) => {
	const value = descriptorValue(descriptor, key);
	const values = value?.type === "list" ? value.value : [];
	return [
		0,
		1,
		2,
		3
	].map((index) => {
		const item = values[index];
		return item?.type === "integer" ? clamp(item.value, 0, 100, `GRD ${key} range`) : fallback;
	});
};
var renderNoiseGradient = (seed, minimum, maximum, addTransparency) => {
	const output = /* @__PURE__ */ new Uint8Array(1024);
	let state = seed >>> 0 || 2654435769;
	const random = () => {
		state ^= state << 13;
		state ^= state >>> 17;
		state ^= state << 5;
		return (state >>> 0) / 4294967295;
	};
	for (let pixel = 0; pixel < 256; pixel += 1) {
		for (let channel = 0; channel < 3; channel += 1) output[pixel * 4 + channel] = byte((minimum[channel] + random() * (maximum[channel] - minimum[channel])) * 2.55);
		output[pixel * 4 + 3] = addTransparency ? byte((minimum[3] + random() * (maximum[3] - minimum[3])) * 2.55) : 255;
	}
	return output;
};
var resolveZString = (value) => {
	if (!value.startsWith("$$$/")) return value;
	const equals = value.lastIndexOf("=");
	if (equals >= 0 && equals + 1 < value.length) return value.slice(equals + 1);
	const slash = value.lastIndexOf("/");
	return slash >= 0 ? value.slice(slash + 1) : value;
};
var parseGradient = (wrapper, index, limits, previewBudget) => {
	usePreviewBudget(previewBudget, 256, 1024, limits, `GRD gradient ${index}`);
	const source = descriptorObject(wrapper, "Grad") || wrapper;
	const name = resolveZString(descriptorText(source, "Nm  ") || `Gradient ${index}`);
	const form = descriptorEnum(source, "GrdF") || "CstS";
	if (form === "ClNs") {
		const minimum = readIntegerRange(source, "Mnm ", 0);
		const maximum = readIntegerRange(source, "Mxm ", 100);
		maximum.forEach((value, channel) => {
			if (value < minimum[channel]) throw new Error(`${name}: noise maximum is below its minimum.`);
		});
		const seed = clamp(descriptorNumber(source, "RndS", 0), 0, 4294967295, `${name} random seed`);
		const roughness = clamp(descriptorNumber(source, "Smth", 2048), 0, 4096, `${name} roughness`);
		const colorModelValue = descriptorEnum(source, "ClrS") || "RGBC";
		const colorModel = colorModelValue === "HSBl" || colorModelValue === "HSBC" ? "hsb" : colorModelValue === "LbCl" || colorModelValue === "LABC" ? "lab" : "rgb";
		const addTransparency = descriptorBoolean(source, "ShTr", false);
		return {
			name,
			definition: {
				form: "noise",
				seed,
				roughness,
				colorModel,
				restrictColors: descriptorBoolean(source, "VctC", true),
				addTransparency,
				minimum,
				maximum
			},
			previewRgba: renderNoiseGradient(seed, minimum, maximum, addTransparency)
		};
	}
	if (form !== "CstS") throw new Error(`${name}: unsupported GRD gradient form ${JSON.stringify(form)}.`);
	const colorStops = listObjects(descriptorValue(source, "Clrs"), `${name} color stops`, Math.min(256, limits.maxResourceItems)).map((stop, stopIndex) => {
		const location = clamp(descriptorNumber(stop, "Lctn") / 4096, 0, 1, `${name} color stop ${stopIndex + 1} location`);
		const midpoint = clamp(descriptorNumber(stop, "Mdpn", 50) / 100, 0, 1, `${name} color stop ${stopIndex + 1} midpoint`);
		const type = descriptorEnum(stop, "Type") || "UsrS";
		const kind = type === "FrgC" ? "foreground" : type === "BckC" ? "background" : "user";
		const converted = kind === "foreground" ? {
			rgb: [
				0,
				0,
				0
			],
			colorSpace: "unknown"
		} : kind === "background" ? {
			rgb: [
				255,
				255,
				255
			],
			colorSpace: "unknown"
		} : parseGradientColor(descriptorObject(stop, "Clr "));
		if (kind === "user" && converted.colorSpace === "unknown") throw new Error(`${name} color stop ${stopIndex + 1} uses an unsupported color object.`);
		return {
			location,
			midpoint,
			kind,
			...converted
		};
	}).sort((left, right) => left.location - right.location);
	if (colorStops.length < 2) throw new Error(`${name} has fewer than two usable color stops.`);
	const transparency = descriptorValue(source, "Trns");
	const alphaStops = transparency ? listObjects(transparency, `${name} transparency stops`, Math.min(256, limits.maxResourceItems)).map((stop, stopIndex) => ({
		location: clamp(descriptorNumber(stop, "Lctn") / 4096, 0, 1, `${name} alpha stop ${stopIndex + 1} location`),
		midpoint: clamp(descriptorNumber(stop, "Mdpn", 50) / 100, 0, 1, `${name} alpha stop ${stopIndex + 1} midpoint`),
		opacity: clamp(descriptorNumber(stop, "Opct", 100) / 100, 0, 1, `${name} alpha stop ${stopIndex + 1} opacity`)
	})).sort((left, right) => left.location - right.location) : [{
		location: 0,
		midpoint: .5,
		opacity: 1
	}, {
		location: 1,
		midpoint: .5,
		opacity: 1
	}];
	if (!alphaStops.length) throw new Error(`${name} declares an empty transparency-stop list.`);
	return {
		name,
		definition: {
			form: "solid",
			smoothness: clamp(descriptorNumber(source, "Intr", 4096), 0, 4096, `${name} smoothness`),
			colorStops,
			alphaStops
		},
		previewRgba: renderSolidGradient(colorStops, alphaStops)
	};
};
var hierarchyFolders = (descriptor, count) => {
	const value = descriptorValue(descriptor, "hierarchy");
	if (!value || value.type !== "list") return Array.from({ length: count }, () => "");
	const folders = Array.from({ length: count }, () => "");
	const stack = [];
	let preset = 0;
	for (const item of value.value) {
		if (item.type !== "object") continue;
		if (item.value.classId === "Grup") stack.push(resolveZString(descriptorText(item.value, "Nm  ") || ""));
		else if (item.value.classId === "groupEnd") stack.pop();
		else if (item.value.classId === "preset" && preset < folders.length) folders[preset++] = stack.filter(Boolean).join(" / ");
	}
	return folders;
};
var parseOptionalHierarchy = (reader, limits, descriptorBudget, count) => {
	if (!reader.remaining) return Array.from({ length: count }, () => "");
	if (reader.remaining < 12 || reader.ascii(4, reader.length, "Adobe hierarchy signature") !== "8BIM" || reader.ascii(4, reader.length, "Adobe hierarchy key") !== "phry") throw new Error("Adobe preset file has unrecognized trailing data.");
	const length = reader.u32(reader.length, "Adobe hierarchy length");
	const end = add(reader.offset, length, "Adobe hierarchy end");
	if (end > reader.length) throw new Error("Adobe hierarchy data is truncated.");
	if (reader.u32(end, "Adobe hierarchy descriptor version") !== 16) throw new Error("Unsupported Adobe hierarchy descriptor version.");
	const descriptor = readAdobeDescriptor(reader, end, limits, descriptorBudget);
	if (reader.offset !== end) throw new Error("Adobe hierarchy descriptor has trailing bytes.");
	if (reader.remaining) throw new Error("Adobe preset file has bytes after its hierarchy data.");
	return hierarchyFolders(descriptor, count);
};
var parseGrd = (buffer, limits) => {
	assertSource(buffer, limits, "GRD");
	const reader = new AdobeBinaryReader(buffer);
	if (reader.ascii(4, reader.length, "GRD signature") !== "8BGR") throw new Error("Invalid Photoshop GRD signature.");
	if (reader.u16(reader.length, "GRD version") !== 5) throw new Error("Unsupported Photoshop GRD version; only descriptor-based version 5 is decoded.");
	if (reader.u32(reader.length, "GRD descriptor version") !== 16) throw new Error("Unsupported GRD Action Descriptor version.");
	const descriptorBudget = createAdobeDescriptorBudget(limits);
	const root = readAdobeDescriptor(reader, reader.length, limits, descriptorBudget);
	const previewBudget = {
		previewPixels: 0,
		decodedBytes: 0
	};
	const gradients = listObjects(descriptorValue(root, "GrdL"), "GRD gradients", limits.maxResourceItems).map((gradient, index) => parseGradient(gradient, index + 1, limits, previewBudget));
	if (!gradients.length) throw new Error("GRD file contains no gradients.");
	const folders = parseOptionalHierarchy(reader, limits, descriptorBudget, gradients.length);
	gradients.forEach((gradient, index) => {
		if (folders[index]) gradient.folder = folders[index];
	});
	return {
		format: "grd",
		version: "5",
		engine: "file-viewer-native",
		fidelity: "solid-stop-preview-noise-approximation",
		gradients,
		limitations: ["Solid-gradient stops, midpoint positions, transparency, names, and folders are preserved. Foreground/background stops use black/white because their final colors depend on Photoshop application state.", "Noise-gradient metadata is preserved, but the thumbnail is a deterministic approximation; Photoshop does not publish its exact noise synthesis and color-management pipeline."]
	};
};
var effectKeys = [
	{
		single: "DrSh",
		multi: "dropShadowMulti",
		kind: "drop-shadow"
	},
	{
		single: "IrSh",
		multi: "innerShadowMulti",
		kind: "inner-shadow"
	},
	{
		single: "OrGl",
		multi: "outerGlowMulti",
		kind: "outer-glow"
	},
	{
		single: "IrGl",
		multi: "innerGlowMulti",
		kind: "inner-glow"
	},
	{
		single: "ChFX",
		multi: "chromeFXMulti",
		kind: "satin"
	},
	{
		single: "ebbl",
		multi: "bevelEmbossMulti",
		kind: "bevel-emboss"
	},
	{
		single: "SoFi",
		multi: "solidFillMulti",
		kind: "color-overlay"
	},
	{
		single: "GrFl",
		multi: "gradientFillMulti",
		kind: "gradient-overlay"
	},
	{
		single: "patternFill",
		multi: "patternFillMulti",
		kind: "pattern-overlay"
	},
	{
		single: "FrFX",
		multi: "frameFXMulti",
		kind: "stroke"
	}
];
var summarizeEffects = (effects) => {
	if (!effects) return [];
	const output = [];
	for (const mapping of effectKeys) {
		const single = descriptorValue(effects, mapping.single);
		const multi = descriptorValue(effects, mapping.multi);
		const objects = [];
		if (single?.type === "object") objects.push(single.value);
		if (multi?.type === "list") {
			for (const item of multi.value) if (item.type === "object") objects.push(item.value);
		}
		if (objects.length) output.push({
			kind: mapping.kind,
			enabled: objects.some((object) => descriptorBoolean(object, "enab", true)),
			instances: objects.length
		});
	}
	return output;
};
var visitObjects = (value, callback) => {
	if (value.type === "object") {
		callback(value.value);
		for (const nested of value.value.entries.values()) visitObjects(nested, callback);
	} else if (value.type === "list") value.value.forEach((nested) => visitObjects(nested, callback));
	else if (value.type === "object-array") {
		callback(value.value);
		for (const nested of value.value.entries.values()) visitObjects(nested, callback);
	}
};
var referencedPatterns = (effects) => {
	const patterns = /* @__PURE__ */ new Map();
	if (!effects) return [];
	const collect = (descriptor) => {
		if (descriptor.classId !== "Ptrn" && !descriptor.entries.has("Idnt")) return;
		const id = descriptorText(descriptor, "Idnt") || "";
		const name = descriptorText(descriptor, "Nm  ") || "";
		if (id) patterns.set(id, {
			name,
			id
		});
	};
	collect(effects);
	for (const value of effects.entries.values()) visitObjects(value, collect);
	return [...patterns.values()];
};
var parseStyleRecord = (reader, end, limits, descriptorBudget, index) => {
	if (reader.u32(end, `ASL style ${index} identity descriptor version`) !== 16) throw new Error(`ASL style ${index} uses an unsupported identity descriptor version.`);
	const identity = readAdobeDescriptor(reader, end, limits, descriptorBudget);
	const name = resolveZString(descriptorText(identity, "Nm  ") || "");
	const id = descriptorText(identity, "Idnt") || "";
	if (!name || !id) throw new Error(`ASL style ${index} is missing its name or unique id.`);
	if (reader.u32(end, `ASL style ${index} effect descriptor version`) !== 16) throw new Error(`ASL style ${index} uses an unsupported effect descriptor version.`);
	const style = readAdobeDescriptor(reader, end, limits, descriptorBudget);
	const effects = descriptorObject(style, "Lefx");
	const blendOptions = descriptorObject(style, "blendOptions");
	const blendRanges = descriptorValue(blendOptions, "Blnd");
	const result = {
		name,
		id,
		effectsVisible: descriptorBoolean(effects, "masterFXSwitch", true),
		effects: summarizeEffects(effects),
		blendIfChannels: blendRanges?.type === "list" ? blendRanges.value.length : 0,
		referencedPatterns: referencedPatterns(effects)
	};
	const blendMode = descriptorEnum(blendOptions, "Md  ");
	if (blendMode) result.blendMode = blendMode;
	const opacity = descriptorValue(blendOptions, "Opct");
	if (opacity?.type === "unit-double" || opacity?.type === "double" || opacity?.type === "integer") result.opacity = clamp(opacity.value, 0, 100, `${name} opacity`);
	const fillOpacity = descriptorValue(blendOptions, "fillOpacity");
	if (fillOpacity?.type === "unit-double" || fillOpacity?.type === "double" || fillOpacity?.type === "integer") result.fillOpacity = clamp(fillOpacity.value, 0, 100, `${name} fill opacity`);
	if (!result.effects.length && !blendOptions) throw new Error(`${name} contains no supported effect graph or blending options.`);
	return result;
};
var parseAsl = (buffer, limits) => {
	assertSource(buffer, limits, "ASL");
	const reader = new AdobeBinaryReader(buffer);
	if (reader.u16(reader.length, "ASL version") !== 2) throw new Error("Unsupported Photoshop ASL version; expected version 2.");
	if (reader.ascii(4, reader.length, "ASL signature") !== "8BSL") throw new Error("Invalid Photoshop ASL signature.");
	if (reader.u16(reader.length, "ASL pattern section version") !== 3) throw new Error("Unsupported ASL embedded-pattern section version.");
	const patternLength = reader.u32(reader.length, "ASL embedded-pattern section length");
	const patternEnd = add(reader.offset, patternLength, "ASL embedded-pattern section end");
	if (patternEnd > reader.length) throw new Error("ASL embedded-pattern section is truncated.");
	const patterns = patternLength ? parsePatternBlock(reader, patternEnd, limits, {
		previewPixels: 0,
		decodedBytes: 0
	}) : [];
	const count = reader.u32(reader.length, "ASL style count");
	if (!count || count > limits.maxResourceItems) throw new Error(`ASL style count must be between 1 and ${limits.maxResourceItems}.`);
	const descriptorBudget = createAdobeDescriptorBudget(limits);
	const styles = [];
	for (let index = 0; index < count; index += 1) {
		const length = reader.u32(reader.length, `ASL style ${index + 1} length`);
		const recordEnd = add(reader.offset, length, `ASL style ${index + 1} end`);
		const paddedEnd = add(reader.offset, align4(length), `ASL style ${index + 1} padded end`);
		if (!length || recordEnd > reader.length || paddedEnd > reader.length) throw new Error(`ASL style ${index + 1} record is truncated.`);
		styles.push(parseStyleRecord(reader, recordEnd, limits, descriptorBudget, index + 1));
		for (const value of reader.slice(recordEnd - reader.offset, recordEnd, `ASL style ${index + 1} padding`)) if (value !== 0) throw new Error(`ASL style ${index + 1} has unparsed non-zero bytes.`);
		for (const value of reader.slice(paddedEnd - recordEnd, paddedEnd, `ASL style ${index + 1} alignment`)) if (value !== 0) throw new Error(`ASL style ${index + 1} has non-zero alignment bytes.`);
	}
	parseOptionalHierarchy(reader, limits, descriptorBudget, styles.length);
	return {
		format: "asl",
		version: "2",
		engine: "file-viewer-native",
		fidelity: "effect-graph-metadata-preview",
		styles,
		patterns,
		limitations: ["Names, ids, effect graph presence, multi-effect counts, blending options, pattern references, and embedded pattern tiles are decoded. The preview does not claim Photoshop layer rasterization.", "Exact layer-style appearance depends on Photoshop contours, blend modes, global light, color management, target-layer pixels, and undocumented renderer behavior; unsupported descriptor value types are rejected rather than ignored."]
	};
};
var parseAdobePresetResource = (buffer, format, limits) => {
	assertLimits(limits);
	if (format === "pat") return parsePat(buffer, limits);
	if (format === "grd") return parseGrd(buffer, limits);
	if (format === "asl") return parseAsl(buffer, limits);
	throw new Error(`Unsupported Adobe preset format ${JSON.stringify(format)}.`);
};
//#endregion
export { parseAdobePresetResource as t };
