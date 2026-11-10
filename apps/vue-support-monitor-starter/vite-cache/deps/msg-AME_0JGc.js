import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { n as createEmailImageResource, r as normalizeEmailResourceId } from "./emailHtml-DgjLeXKX.js";
var END = 4294967294;
var FREE = 4294967295;
var MAX_DIRECTORY_ENTRIES = 32768;
var MAX_STORAGE_DEPTH = 24;
var MAGIC = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
function inspectMsgContainer(buffer) {
	const fail = (reason) => {
		throw new Error(`Invalid Outlook MSG: ${reason}`);
	};
	if (buffer.byteLength < 512 || buffer.byteLength > 134217728) fail("source size limit");
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);
	if (!MAGIC.every((value, index) => bytes[index] === value)) fail("missing CFB signature");
	const version = view.getUint16(26, true);
	const shift = view.getUint16(30, true);
	if (view.getUint16(28, true) !== 65534 || !(version === 3 && shift === 9 || version === 4 && shift === 12) || view.getUint16(32, true) !== 6) fail("unsupported CFB header");
	const sectorSize = 2 ** shift;
	if (bytes.length % sectorSize || bytes.length < sectorSize * 2) fail("truncated sector");
	const sectorCount = bytes.length / sectorSize - 1;
	const sectorOffset = (sector) => {
		if (!Number.isInteger(sector) || sector < 0 || sector >= sectorCount) fail("sector out of bounds");
		return (sector + 1) * sectorSize;
	};
	const fatCount = view.getUint32(44, true);
	const difatCount = view.getUint32(72, true);
	if (!fatCount || fatCount > sectorCount || difatCount > sectorCount) fail("invalid allocation table count");
	const reserved = /* @__PURE__ */ new Set();
	const fatSectors = [];
	const addFat = (sector) => {
		if (sector === FREE) return;
		sectorOffset(sector);
		if (reserved.has(sector)) fail("duplicate FAT/DIFAT sector");
		reserved.add(sector);
		fatSectors.push(sector);
	};
	for (let index = 0; index < 109; index++) addFat(view.getUint32(76 + index * 4, true));
	let difat = view.getUint32(68, true);
	for (let index = 0; index < difatCount; index++) {
		const start = sectorOffset(difat);
		if (reserved.has(difat)) fail("cyclic DIFAT");
		reserved.add(difat);
		for (let offset = 0; offset < sectorSize - 4; offset += 4) addFat(view.getUint32(start + offset, true));
		difat = view.getUint32(start + sectorSize - 4, true);
	}
	if (difatCount && difat !== END) fail("unterminated DIFAT");
	if (fatSectors.length !== fatCount || fatCount * (sectorSize / 4) < sectorCount) fail("incomplete FAT");
	const fat = new Uint32Array(fatCount * (sectorSize / 4));
	fatSectors.forEach((sector, index) => {
		const start = sectorOffset(sector);
		for (let offset = 0; offset < sectorSize / 4; offset++) fat[index * (sectorSize / 4) + offset] = view.getUint32(start + offset * 4, true);
	});
	const claimed = new Set(reserved);
	const chain = (start, table, limit, owners, maxLength = limit) => {
		const result = [];
		for (let sector = start; sector !== END;) {
			if (sector >= limit || sector >= table.length || owners.has(sector) || result.length >= maxLength) fail("cyclic, shared or out-of-range allocation chain");
			owners.add(sector);
			result.push(sector);
			sector = table[sector];
		}
		return result;
	};
	const directory = chain(view.getUint32(48, true), fat, sectorCount, claimed, Math.ceil(MAX_DIRECTORY_ENTRIES * 128 / sectorSize));
	if (!directory.length) fail("missing directory");
	const dirBytes = new Uint8Array(directory.length * sectorSize);
	directory.forEach((sector, index) => dirBytes.set(bytes.subarray(sectorOffset(sector), sectorOffset(sector) + sectorSize), index * sectorSize));
	const dir = new DataView(dirBytes.buffer);
	const count = dirBytes.length / 128;
	const decoder = new TextDecoder("utf-16le");
	const entries = Array.from({ length: count }, (_, id) => {
		const offset = id * 128;
		const type = dir.getUint8(offset + 66);
		const length = dir.getUint16(offset + 64, true);
		if (type && (![
			1,
			2,
			5
		].includes(type) || length < 2 || length > 64 || length % 2)) fail("invalid directory entry");
		const size = dir.getUint32(offset + 120, true) + (version === 4 ? dir.getUint32(offset + 124, true) : 0) * 2 ** 32;
		if ((type === 2 || type === 5) && size > 134217728) fail("stream size limit");
		return {
			id,
			type,
			size,
			name: type ? decoder.decode(dirBytes.subarray(offset, offset + length - 2)) : "",
			left: dir.getUint32(offset + 68, true),
			right: dir.getUint32(offset + 72, true),
			child: dir.getUint32(offset + 76, true),
			start: dir.getUint32(offset + 116, true)
		};
	});
	const root = entries[0];
	if (root.type !== 5) fail("missing root storage");
	const miniCount = view.getUint32(64, true);
	if (miniCount > sectorCount || view.getUint32(56, true) !== 4096) fail("invalid MiniFAT header");
	const miniFatChain = miniCount ? chain(view.getUint32(60, true), fat, sectorCount, claimed) : [];
	if (miniFatChain.length !== miniCount) fail("incomplete MiniFAT");
	const miniFat = new Uint32Array(miniCount * (sectorSize / 4));
	miniFatChain.forEach((sector, index) => {
		const start = sectorOffset(sector);
		for (let offset = 0; offset < sectorSize / 4; offset++) miniFat[index * (sectorSize / 4) + offset] = view.getUint32(start + offset * 4, true);
	});
	const miniStream = root.size ? chain(root.start, fat, sectorCount, claimed) : [];
	if (miniStream.length * sectorSize < root.size) fail("truncated mini stream");
	const miniClaimed = /* @__PURE__ */ new Set();
	const visited = /* @__PURE__ */ new Set([0]);
	const stack = [{
		id: root.child,
		depth: 1,
		parent: 0
	}];
	let properties;
	while (stack.length) {
		const next = stack.pop();
		if (next.id === FREE) continue;
		if (next.id >= count || visited.has(next.id) || next.depth > MAX_STORAGE_DEPTH) fail("cyclic directory or nested storage limit");
		visited.add(next.id);
		const item = entries[next.id];
		if (item.type !== 1 && item.type !== 2) fail("invalid child entry");
		stack.push({
			...next,
			id: item.left
		}, {
			...next,
			id: item.right
		});
		if (item.type === 1) {
			stack.push({
				id: item.child,
				depth: next.depth + 1,
				parent: item.id
			});
			continue;
		}
		const small = item.size < 4096;
		const sectors = item.size ? chain(item.start, small ? miniFat : fat, small ? Math.ceil(root.size / 64) : sectorCount, small ? miniClaimed : claimed) : [];
		const width = small ? 64 : sectorSize;
		if (sectors.length * width < item.size) fail("truncated property or attachment stream");
		if (small && sectors.some((sector, index) => sector * 64 + Math.min(64, Math.max(0, item.size - index * 64)) > root.size)) fail("property exceeds mini stream");
		if (next.parent === 0 && item.name === "__properties_version1.0") {
			if (item.size < 32 || item.size > 2097152 || (item.size - 32) % 16) fail("invalid message property stream");
			properties = new Uint8Array(item.size);
			sectors.forEach((sector, index) => {
				const offset = small ? sectorOffset(miniStream[Math.floor(sector * 64 / sectorSize)]) + sector * 64 % sectorSize : sectorOffset(sector);
				const length = Math.min(width, item.size - index * width);
				if (length > 0) properties.set(bytes.subarray(offset, offset + length), index * width);
			});
		}
	}
	if (!properties) fail("CFB is not an Outlook message");
	const props = new DataView(properties.buffer);
	for (let offset = 32; offset + 16 <= props.byteLength; offset += 16) if (props.getUint32(offset, true) === 1073545219) return { messageCodepage: props.getUint32(offset + 8, true) };
	return {};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/msgEncoding.js
var msgCodepageLabel = (codepage) => {
	if (codepage && codepage >= 28591 && codepage <= 28606) return `iso-8859-${codepage - 28590}`;
	if (codepage && codepage >= 1250 && codepage <= 1258) return `windows-${codepage}`;
	return {
		866: "ibm866",
		1e4: "macintosh",
		10007: "x-mac-cyrillic",
		38598: "iso-8859-8-i",
		50221: "iso-2022-jp",
		50222: "iso-2022-jp",
		65001: "utf-8",
		1200: "utf-16le",
		1201: "utf-16be",
		20127: "windows-1252",
		932: "shift_jis",
		936: "gbk",
		949: "euc-kr",
		950: "big5",
		54936: "gb18030",
		28591: "windows-1252",
		28592: "iso-8859-2",
		28605: "iso-8859-15",
		20866: "koi8-r",
		21866: "koi8-u",
		874: "windows-874",
		50220: "iso-2022-jp",
		51932: "euc-jp",
		51949: "euc-kr"
	}[codepage || 0];
};
/** PR_HTML is PtypBinary, whereas 1013001F (bodyHtml) is already Unicode. */
function decodeEmailHtmlBytes(value, internetCodepage, messageCodepage) {
	var _a;
	if (typeof value === "string") {
		if (value.length > 33554432) throw new Error("MSG HTML size limit exceeded.");
		return value.replace(/\0+$/, "");
	}
	const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
	if (!(bytes instanceof Uint8Array) || bytes.length > 33554432) throw new Error("Invalid or oversized MSG HTML body.");
	let label;
	if (bytes[0] === 255 && bytes[1] === 254) label = "utf-16le";
	else if (bytes[0] === 254 && bytes[1] === 255) label = "utf-16be";
	else if (bytes[0] === 60 && bytes[1] === 0 && bytes[3] === 0) label = "utf-16le";
	else if (bytes[0] === 0 && bytes[1] === 60 && bytes[2] === 0) label = "utf-16be";
	else if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) label = "utf-8";
	const prefix = new TextDecoder("windows-1252").decode(bytes.subarray(0, 4096));
	const declared = (_a = /<meta\b[^>]*\bcharset\s*=\s*["']?\s*([a-z0-9._-]+)/i.exec(prefix)) === null || _a === void 0 ? void 0 : _a[1];
	const candidates = [
		label,
		msgCodepageLabel(internetCodepage),
		declared,
		msgCodepageLabel(messageCodepage)
	].filter((item) => !!item);
	for (const candidate of candidates) try {
		return new TextDecoder(candidate).decode(bytes).replace(/\0+$/, "");
	} catch {}
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\0+$/, "");
	} catch {
		return new TextDecoder("windows-1252").decode(bytes).replace(/\0+$/, "");
	}
}
var SEED = "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx";
function rtfCrc32(bytes) {
	let crc = 0;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
	}
	return crc >>> 0;
}
function decompressMsgRtf(input) {
	const fail = (reason) => {
		throw new Error(`Invalid Outlook RTF: ${reason}`);
	};
	if (input.byteLength < 16 || input.byteLength > 33554448) fail("compressed size limit");
	const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
	const compressedSize = view.getUint32(0, true);
	const rawSize = view.getUint32(4, true);
	const magic = view.getUint32(8, true);
	if (compressedSize + 4 !== input.length || rawSize > 33554432) fail("size mismatch or expansion limit");
	const payload = input.subarray(16);
	if (magic === 1095517517) {
		if (payload.length !== rawSize) fail("truncated uncompressed body");
		return payload.slice();
	}
	if (magic !== 1967544908) fail("unknown compression type");
	if (rtfCrc32(payload) !== view.getUint32(12, true)) fail("CRC mismatch");
	const dictionary = /* @__PURE__ */ new Uint8Array(4096);
	const initialized = /* @__PURE__ */ new Uint8Array(4096);
	dictionary.set(new TextEncoder().encode(SEED));
	initialized.fill(1, 0, 207);
	const output = new Uint8Array(rawSize);
	let write = 207;
	let position = 0;
	let cursor = 0;
	let terminated = false;
	const put = (value) => {
		if (position >= rawSize) fail("decompressed size mismatch");
		output[position++] = value;
		dictionary[write] = value;
		initialized[write] = 1;
		write = write + 1 & 4095;
	};
	while (cursor < payload.length && !terminated) {
		const flags = payload[cursor++];
		for (let bit = 0; bit < 8 && !terminated; bit++) if (flags & 1 << bit) {
			if (cursor + 2 > payload.length) fail("truncated reference");
			const first = payload[cursor++];
			const second = payload[cursor++];
			let reference = first << 4 | second >>> 4;
			if (reference === write) {
				terminated = true;
				break;
			}
			const length = (second & 15) + 2;
			for (let index = 0; index < length; index++) {
				if (!initialized[reference]) fail("uninitialized dictionary reference");
				put(dictionary[reference]);
				reference = reference + 1 & 4095;
			}
		} else {
			if (cursor >= payload.length) fail("truncated literal");
			put(payload[cursor++]);
		}
	}
	if (!terminated || position !== rawSize) fail("missing terminator or incomplete body");
	return output;
}
var SKIPPED = /* @__PURE__ */ new Set([
	"fonttbl",
	"colortbl",
	"stylesheet",
	"info",
	"pict",
	"object",
	"objdata",
	"header",
	"headerl",
	"headerr",
	"footer",
	"footerl",
	"footerr",
	"filetbl",
	"listtable",
	"listoverridetable",
	"listtext",
	"pntext",
	"fldinst",
	"datastore",
	"themedata",
	"colorschememapping",
	"xmlnstbl",
	"generator"
]);
function extractMsgRtf(bytes, codepage) {
	if (bytes.length > 33554432) throw new Error("Outlook RTF exceeds the body limit.");
	let source = "";
	for (let offset = 0; offset < bytes.length; offset += 8192) source += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
	if (!/^\{\\rtf[1-9]/.test(source)) throw new Error("Invalid Outlook RTF document.");
	let state = {
		skip: false,
		htmlTag: false,
		htmlRtf: false,
		uc: 1,
		encoding: msgCodepageLabel(codepage) || "windows-1252",
		starred: false
	};
	const stack = [];
	const text = [];
	const html = [];
	const pending = [];
	let fallback = 0;
	let fromHtml = false;
	const emit = (value) => {
		if (state.skip) return;
		if (!state.htmlTag) text.push(value);
		if (!state.htmlRtf) html.push(value);
	};
	const flush = () => {
		if (!pending.length) return;
		emit(new TextDecoder(state.encoding).decode(new Uint8Array(pending)));
		pending.length = 0;
	};
	const byte = (value) => {
		if (fallback > 0) {
			fallback--;
			return;
		}
		pending.push(value);
	};
	let rootClosed = false;
	for (let cursor = 0; cursor < source.length;) {
		const char = source[cursor++];
		if (rootClosed) {
			if (!/[\s\0]/.test(char)) throw new Error("Unexpected content after Outlook RTF document.");
			continue;
		}
		if (char === "{") {
			flush();
			if (stack.length >= 128) throw new Error("Outlook RTF nesting limit exceeded.");
			stack.push({ ...state });
			state = {
				...state,
				starred: false
			};
			fallback = 0;
			continue;
		}
		if (char === "}") {
			flush();
			if (!stack.length) throw new Error("Unbalanced Outlook RTF document.");
			state = stack.pop();
			fallback = 0;
			rootClosed = stack.length === 0;
			continue;
		}
		if (char === "\r" || char === "\n") continue;
		if (char !== "\\") {
			byte(char.charCodeAt(0));
			continue;
		}
		const control = source[cursor++];
		if (control === "\\" || control === "{" || control === "}") {
			byte(control.charCodeAt(0));
			continue;
		}
		if (control === "'") {
			const hex = source.slice(cursor, cursor + 2);
			if (!/^[0-9a-f]{2}$/i.test(hex)) throw new Error("Invalid Outlook RTF hex escape.");
			byte(Number.parseInt(hex, 16));
			cursor += 2;
			continue;
		}
		flush();
		if (control === "*") {
			state.starred = true;
			continue;
		}
		if (control === "~" || control === "_" || control === "-") {
			if (fallback) fallback--;
			else emit(control === "~" ? "\xA0" : control === "_" ? "‑" : "­");
			continue;
		}
		if (!control || !/[a-z]/i.test(control)) continue;
		let word = control;
		while (cursor < source.length && /[a-z]/i.test(source[cursor])) word += source[cursor++];
		const start = cursor;
		if (source[cursor] === "-") cursor++;
		while (cursor < source.length && /[0-9]/.test(source[cursor])) cursor++;
		const raw = source.slice(start, cursor);
		const value = raw && raw !== "-" ? Number(raw) : void 0;
		if (source[cursor] === " ") cursor++;
		if (state.starred) {
			if (word !== "htmltag" && word !== "mhtmltag") state.skip = true;
			state.starred = false;
		}
		if (SKIPPED.has(word)) state.skip = true;
		if (word === "htmltag" || word === "mhtmltag") state.htmlTag = true;
		if (word === "htmlrtf") state.htmlRtf = value !== 0;
		if (word === "fromhtml" && value === 1) fromHtml = true;
		if (word === "ansicpg" && value !== void 0) state.encoding = msgCodepageLabel(value) || state.encoding;
		if (word === "uc" && value !== void 0) state.uc = Math.max(0, Math.min(16, value));
		if (word === "u" && value !== void 0) {
			emit(String.fromCharCode(value & 65535));
			fallback = state.uc;
		}
		if (word === "bin") {
			if (value === void 0 || !Number.isSafeInteger(value) || value < 0 || cursor + value > source.length) throw new Error("Invalid Outlook RTF binary block.");
			cursor += value;
		}
		const special = {
			par: "\n",
			line: "\n",
			tab: "	",
			cell: "	",
			row: "\n",
			emdash: "—",
			endash: "–",
			bullet: "•",
			lquote: "‘",
			rquote: "’",
			ldblquote: "“",
			rdblquote: "”"
		}[word];
		if (special) if (fallback) fallback--;
		else emit(special);
	}
	flush();
	if (stack.length || !rootClosed) throw new Error("Truncated Outlook RTF document.");
	return {
		text: text.join("").trim(),
		html: fromHtml ? html.join("").trim() : void 0
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/msg.js
var MAX_ATTACHMENTS = 1024;
var MAX_RECIPIENTS = 4096;
var MAX_BODY_CHARS = 33554432;
var MAX_INLINE_BYTES = 33554432;
var MAX_NESTED_MESSAGES = 24;
var MIME = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	avif: "image/avif",
	bmp: "image/bmp",
	tif: "image/tiff",
	tiff: "image/tiff",
	svg: "image/svg+xml",
	pdf: "application/pdf",
	txt: "text/plain",
	csv: "text/csv",
	html: "text/html",
	htm: "text/html",
	rtf: "application/rtf",
	msg: "application/vnd.ms-outlook",
	eml: "message/rfc822",
	zip: "application/zip",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};
var RASTER_MIME = /^image\/(?:png|jpeg|gif|webp|avif|bmp|x-ms-bmp)$/i;
var string = (value, max = MAX_BODY_CHARS) => {
	if (typeof value !== "string") return "";
	if (value.length > max) throw new Error("Outlook MSG text exceeds the safety limit.");
	return value.replace(/\0+$/, "");
};
function safeMsgAttachmentName(value, fallback) {
	const name = string(value, 32768).split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, "").replace(/[<>:"|?*]/g, "_").replace(/[. ]+$/, "").trim();
	return !name || name === "." || name === ".." ? fallback : name;
}
var recipient = (item) => ({
	name: string(item.name, 32768),
	address: string(item.smtpAddress || item.email, 32768)
});
var addressText = (items) => items.map((item) => item.name && item.address ? `${item.name} <${item.address}>` : item.address || item.name || "").join(", ");
var copy = (value) => {
	const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
	if (!(bytes instanceof Uint8Array) || bytes.length > 134217728) throw new Error("Invalid or oversized MSG attachment.");
	return new Uint8Array(bytes).buffer;
};
function assertFieldTree(root) {
	var _a, _b;
	const seen = /* @__PURE__ */ new Set();
	const pending = [{
		item: root,
		depth: 0
	}];
	let count = 0;
	while (pending.length) {
		const { item, depth } = pending.pop();
		if (depth > MAX_NESTED_MESSAGES || seen.has(item) || ++count > 32768) throw new Error("Outlook MSG nesting limit exceeded.");
		seen.add(item);
		if ((((_a = item.attachments) === null || _a === void 0 ? void 0 : _a.length) || 0) > MAX_ATTACHMENTS || (((_b = item.recipients) === null || _b === void 0 ? void 0 : _b.length) || 0) > MAX_RECIPIENTS) throw new Error("Outlook MSG recipient/attachment limit exceeded.");
		for (const attachment of item.attachments || []) if (attachment.innerMsgContentFields) pending.push({
			item: attachment.innerMsgContentFields,
			depth: depth + 1
		});
	}
}
/** Exported only from the internal module for deterministic normalization tests. */
async function normalizeMsg(reader, fields, filename, objectUrls, cidUrls, signal) {
	var _a, _b;
	signal === null || signal === void 0 || signal.throwIfAborted();
	if (fields.error || fields.dataType !== "msg") throw new Error(string(fields.error) || "The file does not contain a readable Outlook message.");
	assertFieldTree(fields);
	const warnings = [];
	const actualSender = {
		name: string(fields.senderName, 32768),
		address: string(fields.senderSmtpAddress || fields.senderEmail, 32768)
	};
	const represented = {
		name: string(fields.sentRepresentingName, 32768),
		address: string(fields.sentRepresentingSmtpAddress || fields.sentRepresentingEmail, 32768)
	};
	const hasRepresentation = !!(represented.name || represented.address);
	const from = [hasRepresentation ? represented : actualSender].filter((item) => item.name || item.address);
	const sender = hasRepresentation && (actualSender.address || actualSender.name) && (actualSender.address !== represented.address || actualSender.name !== represented.name) ? [actualSender] : [];
	const to = [];
	const cc = [];
	const bcc = [];
	for (const item of fields.recipients || []) {
		const address = recipient(item);
		if (!address.name && !address.address) continue;
		const kind = String((_a = item.recipType) !== null && _a !== void 0 ? _a : "to").toLowerCase();
		(kind === "cc" || kind === "2" ? cc : kind === "bcc" || kind === "3" ? bcc : to).push(address);
	}
	if (!to.length && fields.displayTo) to.push({ name: string(fields.displayTo, 32768) });
	if (!cc.length && fields.displayCc) cc.push({ name: string(fields.displayCc, 32768) });
	if (!bcc.length && fields.displayBcc) bcc.push({ name: string(fields.displayBcc, 32768) });
	let html = string(fields.bodyHtml);
	if (!html && fields.html) html = decodeEmailHtmlBytes(fields.html, fields.internetCodepage, fields.messageCodepage);
	let text = string(fields.body);
	let rtf;
	if ((_b = fields.compressedRtf) === null || _b === void 0 ? void 0 : _b.length) try {
		const uncompressed = decompressMsgRtf(fields.compressedRtf);
		const extracted = extractMsgRtf(uncompressed, fields.messageCodepage);
		text || (text = extracted.text);
		html || (html = extracted.html || "");
		rtf = copy(uncompressed);
	} catch (error) {
		if (!html && !text) throw error;
		warnings.push("email.msg.rtfUnavailable");
	}
	signal === null || signal === void 0 || signal.throwIfAborted();
	let inlineBytes = 0;
	const attachments = (fields.attachments || []).map((attachment, index) => {
		const fallback = `attachment-${index + 1}`;
		let name = safeMsgAttachmentName(attachment.fileName || attachment.fileNameShort || attachment.name, fallback);
		const extension = string(attachment.extension, 128).replace(/^\./, "");
		if (attachment.innerMsgContent && !/\.msg$/i.test(name)) name += ".msg";
		else if (!name.includes(".") && /^[a-z0-9]{1,16}$/i.test(extension)) name += `.${extension}`;
		const hint = string(attachment.attachMimeTag, 256).split(";")[0].trim().toLowerCase();
		const mimeType = attachment.innerMsgContent ? MIME.msg : /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(hint) ? hint : MIME[name.split(".").pop().toLowerCase()] || "application/octet-stream";
		const size = Number.isSafeInteger(attachment.contentLength) && attachment.contentLength >= 0 ? attachment.contentLength : -1;
		if (size > 134217728) throw new Error("Outlook MSG attachment exceeds the size limit.");
		const contentId = string(attachment.pidContentId, 32768);
		const contentLocation = string(attachment.contentLocation, 32768);
		const result = {
			id: `msg-${index}`,
			name,
			size,
			mimeType,
			contentId,
			contentLocation,
			inline: !!attachment.attachmentHidden || !!contentId,
			async load() {
				signal === null || signal === void 0 || signal.throwIfAborted();
				const extracted = reader.getAttachment(attachment);
				if (!extracted || !(extracted.content instanceof Uint8Array)) throw new Error(`Attachment data is not embedded: ${name}`);
				const buffer = copy(extracted.content);
				result.size = buffer.byteLength;
				signal === null || signal === void 0 || signal.throwIfAborted();
				return buffer;
			}
		};
		return result;
	});
	for (const attachment of attachments) {
		if (!!!(attachment.contentId || attachment.contentLocation || attachment.inline || html.includes(attachment.name)) || !RASTER_MIME.test(attachment.mimeType || "")) continue;
		signal === null || signal === void 0 || signal.throwIfAborted();
		try {
			if (inlineBytes + Math.max(0, attachment.size) > MAX_INLINE_BYTES) throw new Error("Inline image size limit exceeded.");
			const bytes = await attachment.load();
			inlineBytes += bytes.byteLength;
			if (inlineBytes > MAX_INLINE_BYTES) throw new Error("Inline image size limit exceeded.");
			signal === null || signal === void 0 || signal.throwIfAborted();
			const keys = [normalizeEmailResourceId(attachment.contentId || ""), attachment.contentLocation].filter((key) => !!key);
			if (attachments.filter((item) => item.name === attachment.name).length === 1) keys.push(attachment.name);
			const available = keys.map(normalizeEmailResourceId).filter((key) => !cidUrls.has(key));
			if (available.length) {
				const url = createEmailImageResource(bytes, attachment.mimeType, objectUrls);
				available.forEach((key) => cidUrls.set(key, url));
			}
		} catch (error) {
			if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw error;
			if (!warnings.includes("email.msg.inlineUnavailable")) warnings.push("email.msg.inlineUnavailable");
		}
	}
	const subject = string(fields.subject, 32768) || filename;
	const date = string(fields.clientSubmitTime || fields.messageDeliveryTime || fields.creationTime, 4096);
	const rawHeaders = string(fields.headers, 2097152);
	const headerLine = (key, value) => value ? `${key}: ${value.replace(/[\r\n\0]/g, " ")}` : "";
	const headers = rawHeaders || [
		"X-File-Viewer-Source: Outlook MAPI properties (not transport headers)",
		headerLine("Subject", subject),
		headerLine("From", addressText(from)),
		headerLine("Sender", addressText(sender)),
		headerLine("To", addressText(to)),
		headerLine("Cc", addressText(cc)),
		headerLine("Bcc", addressText(bcc)),
		headerLine("Date", date),
		headerLine("Message-ID", string(fields.messageId, 32768)),
		headerLine("Message-Class", string(fields.messageClass, 32768))
	].filter(Boolean).join("\r\n");
	if (!html && !text && !rtf) warnings.push("email.msg.noBody");
	if (/\.smime(?:\.|$)|rpmsg|protected/i.test(string(fields.messageClass, 32768))) warnings.push("email.msg.protected");
	return {
		kind: "msg",
		subject,
		from,
		sender,
		to,
		cc,
		bcc,
		date,
		text,
		html,
		rtf,
		headers,
		attachments,
		warnings
	};
}
/** Capture standard MAPI strings not named by the reader's default map. */
function captureMsgProperty(fields, tag, raw, codepage) {
	const name = {
		66: "sentRepresentingName",
		101: "sentRepresentingEmail",
		3588: "displayTo",
		3587: "displayCc",
		3586: "displayBcc",
		14099: "contentLocation"
	}[tag >>> 16];
	const type = tag & 65535;
	if (!name || !raw || type !== 31 && type !== 30) return;
	if (raw.length > 65536) throw new Error("Outlook MSG metadata exceeds the safety limit.");
	const value = decodeEmailHtmlBytes(raw, type === 31 ? 1200 : codepage || 1252);
	if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return;
	fields[name] = value;
}
async function parseMsg(buffer, filename, objectUrls, cidUrls, signal) {
	signal === null || signal === void 0 || signal.throwIfAborted();
	const { messageCodepage } = inspectMsgContainer(buffer);
	const module = await import("./lib-BJjCyvfl.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
	signal === null || signal === void 0 || signal.throwIfAborted();
	const exported = module.default;
	const constructor = typeof exported === "function" ? exported : exported === null || exported === void 0 ? void 0 : exported.default;
	if (typeof constructor !== "function") throw new Error("Outlook MSG parser failed to load.");
	const reader = new constructor(buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer).slice().buffer);
	const label = msgCodepageLabel(messageCodepage);
	reader.parserConfig = {
		...messageCodepage ? { ansiEncoding: {
			949: "cp949",
			936: "cp936",
			932: "cp932",
			950: "cp950"
		}[messageCodepage] || label || `cp${messageCodepage}` } : {},
		propertyObserver: (fields, tag, raw) => captureMsgProperty(fields, tag, raw, messageCodepage)
	};
	const initialUrls = objectUrls.length;
	const initialCids = new Map(cidUrls);
	try {
		return await normalizeMsg(reader, reader.getFileData(), filename, objectUrls, cidUrls, signal);
	} catch (error) {
		objectUrls.splice(initialUrls).forEach((url) => URL.revokeObjectURL(url));
		cidUrls.clear();
		initialCids.forEach((url, cid) => cidUrls.set(cid, url));
		throw error;
	}
}
//#endregion
export { parseMsg };
