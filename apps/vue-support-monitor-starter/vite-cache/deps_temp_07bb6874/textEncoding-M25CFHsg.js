//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/source/textEncoding.js
var normalizeEncoding = (encoding) => {
	const normalized = String(encoding || "auto").trim().toLowerCase().replace("_", "-");
	if (normalized === "utf8" || normalized === "utf-8") return "utf-8";
	if (normalized === "utf16" || normalized === "utf-16" || normalized === "utf16le" || normalized === "utf-16le") return "utf-16le";
	if (normalized === "utf16be" || normalized === "utf-16be") return "utf-16be";
	if (normalized === "gbk" || normalized === "cp936" || normalized === "gb2312") return "gbk";
	if (normalized === "gb18030") return "gb18030";
	return "auto";
};
var isContinuationByte = (value) => {
	return value !== void 0 && value >= 128 && value <= 191;
};
var isValidFileViewerUtf8 = (bytes) => {
	for (let index = 0; index < bytes.length;) {
		const first = bytes[index];
		if (first === void 0) return false;
		if (first <= 127) {
			index += 1;
			continue;
		}
		const second = bytes[index + 1];
		const third = bytes[index + 2];
		const fourth = bytes[index + 3];
		if (first >= 194 && first <= 223 && isContinuationByte(second)) {
			index += 2;
			continue;
		}
		if (first === 224 && second !== void 0 && second >= 160 && second <= 191 && isContinuationByte(third)) {
			index += 3;
			continue;
		}
		if ((first >= 225 && first <= 236 || first >= 238 && first <= 239) && isContinuationByte(second) && isContinuationByte(third)) {
			index += 3;
			continue;
		}
		if (first === 237 && second !== void 0 && second >= 128 && second <= 159 && isContinuationByte(third)) {
			index += 3;
			continue;
		}
		if (first === 240 && second !== void 0 && second >= 144 && second <= 191 && isContinuationByte(third) && isContinuationByte(fourth)) {
			index += 4;
			continue;
		}
		if (first >= 241 && first <= 243 && isContinuationByte(second) && isContinuationByte(third) && isContinuationByte(fourth)) {
			index += 4;
			continue;
		}
		if (first === 244 && second !== void 0 && second >= 128 && second <= 143 && isContinuationByte(third) && isContinuationByte(fourth)) {
			index += 4;
			continue;
		}
		return false;
	}
	return true;
};
var inferBomlessUtf16 = (bytes) => {
	const sampleLength = Math.min(bytes.length - bytes.length % 2, 4096);
	if (sampleLength < 4) return null;
	let evenNulls = 0;
	let oddNulls = 0;
	for (let index = 0; index < sampleLength; index += 2) {
		evenNulls += bytes[index] === 0 ? 1 : 0;
		oddNulls += bytes[index + 1] === 0 ? 1 : 0;
	}
	const pairs = sampleLength / 2;
	if (oddNulls / pairs >= .3 && evenNulls / pairs <= .05) return "utf-16le";
	if (evenNulls / pairs >= .3 && oddNulls / pairs <= .05) return "utf-16be";
	return null;
};
var resolveFileViewerTextEncoding = (bytes, encoding = "auto") => {
	const normalized = normalizeEncoding(encoding);
	if (normalized !== "auto") return {
		encoding: normalized === "gbk" ? "gb18030" : normalized,
		bomLength: normalized === "utf-8" && bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191 ? 3 : normalized === "utf-16le" && bytes[0] === 255 && bytes[1] === 254 || normalized === "utf-16be" && bytes[0] === 254 && bytes[1] === 255 ? 2 : 0
	};
	if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) return {
		encoding: "utf-8",
		bomLength: 3
	};
	if (bytes[0] === 255 && bytes[1] === 254) return {
		encoding: "utf-16le",
		bomLength: 2
	};
	if (bytes[0] === 254 && bytes[1] === 255) return {
		encoding: "utf-16be",
		bomLength: 2
	};
	const utf16 = inferBomlessUtf16(bytes);
	if (utf16) return {
		encoding: utf16,
		bomLength: 0
	};
	return isValidFileViewerUtf8(bytes) ? {
		encoding: "utf-8",
		bomLength: 0
	} : {
		encoding: "gb18030",
		bomLength: 0
	};
};
var createFileViewerTextDecoder = (encoding) => {
	if (typeof TextDecoder === "undefined") throw new Error("Text decoding requires the browser TextDecoder API.");
	try {
		return new TextDecoder(encoding);
	} catch (error) {
		if (encoding === "gb18030" && error instanceof RangeError) throw Object.assign(/* @__PURE__ */ new Error("This browser does not provide GB18030 text decoding. Use a current browser or select UTF-8 explicitly."), { cause: error });
		throw error;
	}
};
var decodeFileViewerTextBuffer = (data, encoding = "auto") => {
	const bytes = new Uint8Array(data);
	const resolved = resolveFileViewerTextEncoding(bytes, encoding);
	return {
		text: createFileViewerTextDecoder(resolved.encoding).decode(bytes.subarray(resolved.bomLength)),
		encoding: resolved.encoding
	};
};
//#endregion
export { decodeFileViewerTextBuffer as n, resolveFileViewerTextEncoding as r, createFileViewerTextDecoder as t };
