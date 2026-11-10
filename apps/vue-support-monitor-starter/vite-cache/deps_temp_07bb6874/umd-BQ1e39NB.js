import "./dist-B6GcL3C6.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { c as inflate_1, s as inflateRaw_1 } from "./pako.esm-C6nSMvmu.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/umd/parser.js
var UMD_MAGIC = 3734674313;
var SECTION_MARKER = 35;
var DATA_MARKER = 36;
var MAX_SECTION_HEADER_SIZE = 5;
var SECTION = {
	VERSION: 1,
	TITLE: 2,
	AUTHOR: 3,
	YEAR: 4,
	MONTH: 5,
	DAY: 6,
	CATEGORY: 7,
	PUBLISHER: 8,
	VENDOR: 9,
	CID: 10,
	CONTENT_LENGTH: 11,
	IMAGE: 14,
	MIXED_IMAGE: 15,
	TEXT_SEGMENT_INDEX: 129,
	COVER: 130,
	CHAPTER_OFFSETS: 131,
	CHAPTER_TITLES: 132,
	PAGE_OFFSETS: 135,
	SPLASH: 241
};
var UmdCursor = class {
	constructor(buffer) {
		this.offset = 0;
		this.bytes = new Uint8Array(buffer);
		this.view = new DataView(buffer);
	}
	get remaining() {
		return this.bytes.length - this.offset;
	}
	peek() {
		return this.remaining > 0 ? this.bytes[this.offset] : void 0;
	}
	readUint8() {
		this.ensure(1);
		const value = this.view.getUint8(this.offset);
		this.offset += 1;
		return value;
	}
	readUint16() {
		this.ensure(2);
		const value = this.view.getUint16(this.offset, true);
		this.offset += 2;
		return value;
	}
	readUint32() {
		this.ensure(4);
		const value = this.view.getUint32(this.offset, true);
		this.offset += 4;
		return value;
	}
	readBytes(length) {
		const safeLength = Math.max(0, Math.min(length, this.remaining));
		const start = this.offset;
		this.offset += safeLength;
		return this.bytes.slice(start, start + safeLength);
	}
	ensure(size) {
		if (this.remaining < size) throw new Error("UMD 文件结构不完整，读取时遇到意外结尾");
	}
};
var readUint32From = (bytes, offset = 0) => {
	if (bytes.length < offset + 4) return 0;
	return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
};
var decodeUtf16 = (bytes) => {
	if (!bytes.length) return "";
	if (typeof TextDecoder === "function") return new TextDecoder("utf-16le").decode(bytes);
	let output = "";
	for (let index = 0; index + 1 < bytes.length; index += 2) output += String.fromCharCode(bytes[index] | bytes[index + 1] << 8);
	return output;
};
var decodeMetadata = (bytes) => {
	return decodeUtf16(bytes).replace(/\u0000+$/g, "").trim();
};
var normalizeContent = (value) => {
	return value.replace(/\u0000+$/g, "").replace(/\u2029/g, "\n").replace(/\r\n?/g, "\n");
};
var joinByteArrays = (parts, expectedLength = 0) => {
	const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
	const length = expectedLength > 0 ? Math.min(expectedLength, totalLength) : totalLength;
	const result = new Uint8Array(length);
	let offset = 0;
	for (const part of parts) {
		if (offset >= length) break;
		const next = part.subarray(0, Math.min(part.length, length - offset));
		result.set(next, offset);
		offset += next.length;
	}
	return result;
};
var inflateSegment = (bytes) => {
	try {
		return inflate_1(bytes);
	} catch {
		return inflateRaw_1(bytes);
	}
};
var parseChapterTitles = (bytes) => {
	const titles = [];
	let offset = 0;
	while (offset < bytes.length) {
		const length = bytes[offset];
		offset += 1;
		if (!length || offset + length > bytes.length) break;
		titles.push(decodeMetadata(bytes.subarray(offset, offset + length)));
		offset += length;
	}
	return titles;
};
var parseOffsets = (bytes) => {
	const offsets = [];
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	for (let offset = 0; offset + 4 <= bytes.length; offset += 4) offsets.push(view.getUint32(offset, true));
	return offsets;
};
var detectImage = (bytes) => {
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return {
		extension: "png",
		mimeType: "image/png"
	};
	if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return {
		extension: "jpg",
		mimeType: "image/jpeg"
	};
	if (bytes.length >= 6 && bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) return {
		extension: "gif",
		mimeType: "image/gif"
	};
	if (bytes.length >= 2 && bytes[0] === 66 && bytes[1] === 77) return {
		extension: "bmp",
		mimeType: "image/bmp"
	};
	if (bytes.length >= 12 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) return {
		extension: "webp",
		mimeType: "image/webp"
	};
	return {
		extension: "bin",
		mimeType: "application/octet-stream"
	};
};
var createImage = (bytes, prefix, index) => {
	const { extension, mimeType } = detectImage(bytes);
	return {
		bytes,
		extension,
		id: `${prefix}-${index}-${bytes.length}`,
		mimeType
	};
};
var toBookKind = (rawType) => {
	if (rawType === 1) return "text";
	if (rawType === 2) return "comic";
	if (rawType === 3) return "mixed";
	return "unknown";
};
var formatPublishedAt = ({ day, month, year }) => {
	return [
		year,
		month,
		day
	].filter(Boolean).join("-");
};
var createTextChapters = (textBytes, chapterOffsets, titles) => {
	if (!textBytes.length) return [];
	const safeOffsets = (chapterOffsets.length ? chapterOffsets : [0]).map((offset) => Math.max(0, Math.min(offset, textBytes.length))).filter((offset, index, list) => index === 0 || offset > list[index - 1]);
	return safeOffsets.map((start, index) => {
		const end = index + 1 < safeOffsets.length ? safeOffsets[index + 1] : textBytes.length;
		const alignedStart = start - start % 2;
		const alignedEnd = end - end % 2;
		return {
			content: normalizeContent(decodeUtf16(textBytes.subarray(alignedStart, alignedEnd))),
			end: alignedEnd,
			id: `chapter-${index}-${alignedStart}`,
			images: [],
			start: alignedStart,
			title: titles[index] || `章节 ${index + 1}`
		};
	});
};
var createImageChapters = (images, chapterOffsets, titles) => {
	if (!images.length) return [];
	const safeOffsets = (chapterOffsets.length ? chapterOffsets : [0]).map((offset) => Math.max(0, Math.min(offset, images.length))).filter((offset, index, list) => index === 0 || offset > list[index - 1]);
	return safeOffsets.map((start, index) => {
		const end = index + 1 < safeOffsets.length ? safeOffsets[index + 1] : images.length;
		return {
			content: "",
			end,
			id: `image-chapter-${index}-${start}`,
			images: images.slice(start, end),
			start,
			title: titles[index] || `图集 ${index + 1}`
		};
	});
};
var createEmptyChapters = (titles) => {
	return titles.map((title, index) => ({
		content: "",
		end: index,
		id: `empty-chapter-${index}`,
		images: [],
		start: index,
		title: title || `章节 ${index + 1}`
	}));
};
var parseUmdBook = (buffer) => {
	const cursor = new UmdCursor(buffer);
	const metadata = {
		author: "",
		category: "",
		day: "",
		month: "",
		publishedAt: "",
		publisher: "",
		title: "",
		vendor: "",
		year: ""
	};
	const sectionChecks = /* @__PURE__ */ new Map();
	const warnings = [];
	const textSegments = [];
	const images = [];
	let activeSection = 0;
	let chapterOffsets = [];
	let chapterTitles = [];
	let contentLength = 0;
	let cover;
	let rawType = 0;
	if (cursor.readUint32() !== UMD_MAGIC) throw new Error("不是有效的 UMD 电子书文件");
	while (cursor.remaining > 0) {
		if (cursor.peek() !== SECTION_MARKER) break;
		cursor.readUint8();
		const sectionType = cursor.readUint16();
		const sectionFlag = cursor.readUint8();
		const sectionLength = Math.max(0, cursor.readUint8() - MAX_SECTION_HEADER_SIZE);
		const payload = cursor.readBytes(sectionLength);
		const dataSection = sectionType === SECTION.CID || sectionType === SECTION.SPLASH ? activeSection : sectionType;
		switch (sectionType) {
			case SECTION.VERSION:
				rawType = payload[0] || sectionFlag;
				break;
			case SECTION.TITLE:
				metadata.title = decodeMetadata(payload);
				break;
			case SECTION.AUTHOR:
				metadata.author = decodeMetadata(payload);
				break;
			case SECTION.YEAR:
				metadata.year = decodeMetadata(payload);
				break;
			case SECTION.MONTH:
				metadata.month = decodeMetadata(payload);
				break;
			case SECTION.DAY:
				metadata.day = decodeMetadata(payload);
				break;
			case SECTION.CATEGORY:
				metadata.category = decodeMetadata(payload);
				break;
			case SECTION.PUBLISHER:
				metadata.publisher = decodeMetadata(payload);
				break;
			case SECTION.VENDOR:
				metadata.vendor = decodeMetadata(payload);
				break;
			case SECTION.CONTENT_LENGTH:
				contentLength = readUint32From(payload);
				break;
			case SECTION.TEXT_SEGMENT_INDEX:
			case SECTION.CHAPTER_OFFSETS:
			case SECTION.CHAPTER_TITLES:
			case SECTION.PAGE_OFFSETS:
				sectionChecks.set(sectionType, readUint32From(payload));
				break;
			case SECTION.COVER:
				sectionChecks.set(sectionType, readUint32From(payload, 1));
				break;
			case SECTION.IMAGE:
			case SECTION.MIXED_IMAGE: rawType = rawType || (sectionType === SECTION.MIXED_IMAGE ? 3 : 2);
		}
		activeSection = dataSection || activeSection;
		while (cursor.peek() === DATA_MARKER) {
			cursor.readUint8();
			const check = cursor.readUint32();
			const dataLength = Math.max(0, cursor.readUint32() - 9);
			const data = cursor.readBytes(dataLength);
			switch (dataSection) {
				case SECTION.COVER:
					cover = createImage(data, "cover", check);
					break;
				case SECTION.CHAPTER_OFFSETS:
					chapterOffsets = parseOffsets(data);
					break;
				case SECTION.CHAPTER_TITLES:
					if (check === sectionChecks.get(SECTION.CHAPTER_TITLES)) chapterTitles = parseChapterTitles(data);
					else textSegments.push(data);
					break;
				case SECTION.IMAGE:
				case SECTION.MIXED_IMAGE: images.push(createImage(data, "image", images.length));
			}
		}
	}
	const joinedText = joinByteArrays(textSegments.map((segment) => {
		try {
			return inflateSegment(segment);
		} catch (error) {
			warnings.push(error instanceof Error ? error.message : String(error));
			return /* @__PURE__ */ new Uint8Array();
		}
	}), contentLength);
	if (contentLength > joinedText.length && textSegments.length) warnings.push("UMD 正文长度小于声明长度，文件可能不完整");
	let chapters = createTextChapters(joinedText, chapterOffsets, chapterTitles);
	if (!chapters.length) chapters = createImageChapters(images, chapterOffsets, chapterTitles);
	else if (images.length && rawType !== 1) chapters = createImageChapters(images, chapterOffsets, chapterTitles);
	if (!chapters.length && chapterTitles.length) chapters = createEmptyChapters(chapterTitles);
	metadata.publishedAt = formatPublishedAt(metadata);
	return {
		author: metadata.author,
		category: metadata.category,
		chapters,
		contentLength: contentLength || joinedText.length,
		cover,
		kind: toBookKind(rawType),
		publishedAt: metadata.publishedAt,
		publisher: metadata.publisher,
		rawType,
		title: metadata.title || "UMD 电子书",
		vendor: metadata.vendor,
		warnings
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/umd.js
var umdStyle = `
.umd-viewer{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:var(--file-viewer-render-surface-background,#eef1f4);color:#172033;box-sizing:border-box}
.umd-toolbar{flex-shrink:0;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.94);box-sizing:border-box}
.umd-title{min-width:0;display:flex;flex-direction:column;gap:3px}
.umd-title strong,.umd-title span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.umd-title strong{font-size:14px}.umd-title span{color:#64748b;font-size:12px}
.umd-icon-button,.umd-button{height:36px;border:1px solid rgba(15,23,42,.08);background:#fff;color:#172033;font:inherit;cursor:pointer}
.umd-icon-button{width:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}
.umd-icon-button span,.umd-icon-button span::before,.umd-icon-button span::after{width:16px;height:2px;display:block;border-radius:999px;background:currentColor}
.umd-icon-button span{position:relative}.umd-icon-button span::before,.umd-icon-button span::after{content:'';position:absolute;left:0}.umd-icon-button span::before{top:-5px}.umd-icon-button span::after{top:5px}
.umd-icon-button.active{border-color:rgba(2,132,199,.24);background:rgba(2,132,199,.08);color:#0369a1}
.umd-actions{display:flex;align-items:center;gap:8px}.umd-button{min-width:68px;padding:0 12px;border-radius:8px;font-size:13px;font-weight:700}.umd-button:disabled{color:#94a3b8;cursor:not-allowed}
.umd-progress{min-width:58px;color:#64748b;font-size:12px;text-align:center}
.umd-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(180px,240px) minmax(0,1fr)}
.umd-viewer--toc-hidden .umd-body{grid-template-columns:minmax(0,1fr)}
.umd-toc{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.82)}
.umd-viewer--toc-hidden .umd-toc{display:none}
.umd-toc-head{flex-shrink:0;display:flex;justify-content:space-between;gap:8px;padding:12px;color:#172033;font-size:13px}.umd-toc-head span{color:#64748b}
.umd-toc-list{flex:1;min-height:0;overflow:auto;padding:0 8px 10px}
.umd-toc-item{width:100%;min-height:34px;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:#475569;font:inherit;font-size:12px;text-align:left;cursor:pointer}
.umd-toc-item:hover,.umd-toc-item.active{background:rgba(2,132,199,.08);color:#0369a1}
.umd-stage-wrap{position:relative;min-width:0;min-height:0;padding:18px;overflow:hidden;box-sizing:border-box}
.umd-stage{width:100%;height:100%;overflow:auto;border-radius:8px;background:#fffef8;box-shadow:0 18px 45px rgba(15,23,42,.12),inset 0 0 0 1px rgba(15,23,42,.06);box-sizing:border-box}
.umd-book-head{display:flex;gap:20px;max-width:820px;margin:0 auto;padding:32px 34px 8px;box-sizing:border-box}.umd-book-head img{width:96px;max-height:136px;object-fit:cover;border-radius:6px;box-shadow:0 12px 26px rgba(15,23,42,.16)}.umd-book-head div{min-width:0}
.umd-book-head h1{margin:0;color:#111827;font-size:24px;line-height:1.3}.umd-book-head p{margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.6}
.umd-chapter{max-width:820px;margin:0 auto;padding:28px 34px 56px;box-sizing:border-box}.umd-chapter h2{margin:0 0 22px;color:#111827;font-size:22px;line-height:1.35}
.umd-text{color:#1f2937;font-family:Georgia,'Times New Roman','Songti SC',SimSun,serif;font-size:17px;line-height:1.86;white-space:pre-wrap;word-break:break-word}
.umd-image-list{display:grid;gap:18px}.umd-image-list figure{margin:0;text-align:center}.umd-image-list img{max-width:100%;height:auto;border-radius:6px;box-shadow:0 10px 24px rgba(15,23,42,.12)}
.umd-empty,.umd-warning{color:#64748b;font-size:14px;line-height:1.7}.umd-warning{max-width:820px;margin:-28px auto 36px;padding:0 34px;color:#b45309;box-sizing:border-box}
.umd-state{position:absolute;inset:18px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(255,255,255,.92);color:#64748b;font-size:14px}.umd-state[hidden]{display:none!important}.umd-state.error{color:#b42318}
[data-viewer-theme='dark'] .umd-viewer{background:var(--file-viewer-render-surface-background,#101820);color:#e5edf6}[data-viewer-theme='dark'] .umd-toolbar,[data-viewer-theme='dark'] .umd-toc{background:rgba(15,23,42,.92);border-color:rgba(148,163,184,.18)}
[data-viewer-theme='dark'] .umd-stage{background:#111827;box-shadow:0 18px 45px rgba(0,0,0,.35),inset 0 0 0 1px rgba(148,163,184,.16)}
[data-viewer-theme='dark'] .umd-book-head h1,[data-viewer-theme='dark'] .umd-chapter h2,[data-viewer-theme='dark'] .umd-text,[data-viewer-theme='dark'] .umd-toc-head{color:#e5edf6}
[data-viewer-theme='dark'] .umd-title span,[data-viewer-theme='dark'] .umd-book-head p,[data-viewer-theme='dark'] .umd-toc-head span,[data-viewer-theme='dark'] .umd-progress{color:#94a3b8}
[data-viewer-theme='dark'] .umd-button,[data-viewer-theme='dark'] .umd-icon-button{background:#172033;color:#e5edf6;border-color:rgba(148,163,184,.18)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .umd-viewer{background:var(--file-viewer-render-surface-background,#101820);color:#e5edf6}[data-viewer-theme='system'] .umd-toolbar,[data-viewer-theme='system'] .umd-toc{background:rgba(15,23,42,.92);border-color:rgba(148,163,184,.18)}[data-viewer-theme='system'] .umd-stage{background:#111827;box-shadow:0 18px 45px rgba(0,0,0,.35),inset 0 0 0 1px rgba(148,163,184,.16)}[data-viewer-theme='system'] .umd-book-head h1,[data-viewer-theme='system'] .umd-chapter h2,[data-viewer-theme='system'] .umd-text,[data-viewer-theme='system'] .umd-toc-head{color:#e5edf6}[data-viewer-theme='system'] .umd-title span,[data-viewer-theme='system'] .umd-book-head p,[data-viewer-theme='system'] .umd-toc-head span,[data-viewer-theme='system'] .umd-progress{color:#94a3b8}[data-viewer-theme='system'] .umd-button,[data-viewer-theme='system'] .umd-icon-button{background:#172033;color:#e5edf6;border-color:rgba(148,163,184,.18)}}
@media (max-width:720px){.umd-toolbar{grid-template-columns:40px minmax(0,1fr)}.umd-actions{grid-column:1/-1;justify-content:space-between}.umd-body{position:relative;grid-template-columns:minmax(0,1fr)}.umd-toc{position:absolute;z-index:5;top:0;bottom:0;left:0;width:min(82vw,280px);box-shadow:18px 0 40px rgba(15,23,42,.16)}.umd-stage-wrap{padding:12px}.umd-book-head{padding:24px 20px 0}.umd-chapter{padding:24px 20px 42px}}
`;
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = umdStyle;
	return style;
};
var appendText = (parent, tag, text, className) => {
	const element = document.createElement(tag);
	if (className) element.className = className;
	element.textContent = text;
	parent.appendChild(element);
	return element;
};
var createButton = (label, className) => {
	const button = document.createElement("button");
	button.type = "button";
	button.className = className;
	button.textContent = label;
	return button;
};
var buildMetaLine = (book, readingText, chapter) => {
	if (!book) return (chapter === null || chapter === void 0 ? void 0 : chapter.title) || readingText;
	return [
		book.author,
		book.category,
		book.publishedAt
	].filter(Boolean).join(" / ") || (chapter === null || chapter === void 0 ? void 0 : chapter.title) || readingText;
};
var createUmdTextLocalizer = (t) => {
	const localize = (value) => {
		if (value === "UMD 电子书") return t("umd.title");
		const chapterMatch = /^章节\s+(\d+)$/.exec(value);
		if (chapterMatch) return t("umd.chapterFallback", { index: chapterMatch[1] });
		const galleryMatch = /^图集\s+(\d+)$/.exec(value);
		if (galleryMatch) return t("umd.galleryFallback", { index: galleryMatch[1] });
		if (value === "UMD 正文长度小于声明长度，文件可能不完整") return t("umd.warningBodyTooShort");
		if (value === "UMD 文件结构不完整，读取时遇到意外结尾") return t("umd.error.unexpectedEnd");
		if (value === "不是有效的 UMD 电子书文件") return t("umd.error.invalidFile");
		return value;
	};
	return {
		localize,
		localizeJoinedWarnings(warnings) {
			return warnings.filter(Boolean).map(localize).join("；");
		}
	};
};
var copyImageBytes = (image) => {
	const copy = new Uint8Array(image.bytes.byteLength);
	copy.set(image.bytes);
	return copy;
};
async function renderUmd(buffer, target, context) {
	var _a;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const { localize, localizeJoinedWarnings } = createUmdTextLocalizer(t);
	const objectUrls = /* @__PURE__ */ new Map();
	let book = null;
	let activeIndex = 0;
	let tocOpen = true;
	let disposed = false;
	const style = createStyle();
	const root = document.createElement("div");
	root.className = "umd-viewer";
	const toolbar = document.createElement("div");
	toolbar.className = "umd-toolbar";
	const tocButton = document.createElement("button");
	tocButton.type = "button";
	tocButton.className = "umd-icon-button active";
	tocButton.title = t("ebook.toc");
	tocButton.appendChild(document.createElement("span"));
	const title = document.createElement("div");
	title.className = "umd-title";
	const titleText = appendText(title, "strong", t("umd.title"));
	const metaText = appendText(title, "span", t("ebook.reading"));
	const actions = document.createElement("div");
	actions.className = "umd-actions";
	const prevButton = createButton(t("umd.previousChapter"), "umd-button");
	const progress = document.createElement("span");
	progress.className = "umd-progress";
	progress.textContent = "0/0";
	const nextButton = createButton(t("umd.nextChapter"), "umd-button");
	actions.append(prevButton, progress, nextButton);
	toolbar.append(tocButton, title, actions);
	const body = document.createElement("div");
	body.className = "umd-body";
	const toc = document.createElement("aside");
	toc.className = "umd-toc";
	const tocHead = document.createElement("div");
	tocHead.className = "umd-toc-head";
	appendText(tocHead, "strong", t("ebook.toc"));
	const tocCount = appendText(tocHead, "span", t("ebook.itemCount", { count: 0 }));
	const tocList = document.createElement("div");
	tocList.className = "umd-toc-list";
	toc.append(tocHead, tocList);
	const stageWrap = document.createElement("main");
	stageWrap.className = "umd-stage-wrap";
	const stage = document.createElement("article");
	stage.className = "umd-stage";
	const state = document.createElement("div");
	state.className = "umd-state";
	state.textContent = t("umd.loading");
	stageWrap.append(stage, state);
	body.append(toc, stageWrap);
	root.append(toolbar, body);
	target.replaceChildren(style, root);
	const revokeImageUrls = () => {
		objectUrls.forEach((url) => URL.revokeObjectURL(url));
		objectUrls.clear();
	};
	const getImageUrl = (image) => {
		if (!image) return "";
		const existing = objectUrls.get(image.id);
		if (existing) return existing;
		const url = URL.createObjectURL(new Blob([copyImageBytes(image)], { type: image.mimeType }));
		objectUrls.set(image.id, url);
		return url;
	};
	const getCurrentChapter = () => book === null || book === void 0 ? void 0 : book.chapters[activeIndex];
	const updateChrome = () => {
		const chapter = getCurrentChapter();
		const total = (book === null || book === void 0 ? void 0 : book.chapters.length) || 0;
		titleText.textContent = (book === null || book === void 0 ? void 0 : book.title) ? localize(book.title) : t("umd.title");
		metaText.textContent = localize(buildMetaLine(book, t("ebook.reading"), chapter));
		progress.textContent = total ? `${activeIndex + 1}/${total}` : "0/0";
		prevButton.disabled = !book || activeIndex <= 0;
		nextButton.disabled = !book || !total || activeIndex >= total - 1;
		tocButton.classList.toggle("active", tocOpen);
		root.classList.toggle("umd-viewer--toc-hidden", !tocOpen);
		tocCount.textContent = t("ebook.itemCount", { count: total });
	};
	const scrollToTop = () => {
		stage.scrollTo({ top: 0 });
	};
	const renderToc = () => {
		tocList.replaceChildren();
		book === null || book === void 0 || book.chapters.forEach((chapter, index) => {
			const item = createButton(localize(chapter.title), "umd-toc-item");
			item.classList.toggle("active", index === activeIndex);
			item.addEventListener("click", () => {
				activeIndex = index;
				tocOpen = false;
				renderReady();
				scrollToTop();
			});
			tocList.appendChild(item);
		});
	};
	const renderBookHead = (host) => {
		if (!book) return;
		const coverUrl = getImageUrl(book.cover);
		const metaLine = buildMetaLine(book, t("ebook.reading"));
		if (!coverUrl && !metaLine) return;
		const head = document.createElement("header");
		head.className = "umd-book-head";
		if (coverUrl) {
			const image = document.createElement("img");
			image.src = coverUrl;
			image.alt = localize(book.title);
			head.appendChild(image);
		}
		const info = document.createElement("div");
		appendText(info, "h1", localize(book.title));
		if (metaLine) appendText(info, "p", metaLine);
		const publisher = [book.publisher, book.vendor].filter(Boolean).join(" / ");
		if (publisher) appendText(info, "p", publisher);
		head.appendChild(info);
		host.appendChild(head);
	};
	const renderChapter = (chapter) => {
		const section = document.createElement("section");
		section.className = "umd-chapter";
		section.dataset.viewerAnchorId = chapter.id;
		appendText(section, "h2", localize(chapter.title));
		if (chapter.images.length) {
			const images = document.createElement("div");
			images.className = "umd-image-list";
			chapter.images.forEach((image) => {
				const figure = document.createElement("figure");
				const img = document.createElement("img");
				img.src = getImageUrl(image);
				img.alt = localize(chapter.title);
				figure.appendChild(img);
				images.appendChild(figure);
			});
			section.appendChild(images);
		}
		if (chapter.content) appendText(section, "div", chapter.content, "umd-text");
		else if (!chapter.images.length) appendText(section, "div", t("umd.emptyContent"), "umd-empty");
		return section;
	};
	const renderReady = () => {
		updateChrome();
		renderToc();
		state.hidden = true;
		stage.replaceChildren();
		renderBookHead(stage);
		const chapter = getCurrentChapter();
		if (chapter) stage.appendChild(renderChapter(chapter));
		const warningText = book ? localizeJoinedWarnings(book.warnings) : "";
		if (warningText) appendText(stage, "div", warningText, "umd-warning");
	};
	const renderError = (message) => {
		updateChrome();
		state.hidden = false;
		state.classList.add("error");
		state.textContent = message;
	};
	const toggleToc = () => {
		tocOpen = !tocOpen;
		updateChrome();
	};
	const goPrev = () => {
		if (!book || activeIndex <= 0) return;
		activeIndex -= 1;
		renderReady();
		scrollToTop();
	};
	const goNext = () => {
		const total = (book === null || book === void 0 ? void 0 : book.chapters.length) || 0;
		if (!book || activeIndex >= total - 1) return;
		activeIndex += 1;
		renderReady();
		scrollToTop();
	};
	tocButton.addEventListener("click", toggleToc);
	prevButton.addEventListener("click", goPrev);
	nextButton.addEventListener("click", goNext);
	try {
		book = parseUmdBook(buffer.slice(0));
		if (!disposed) {
			activeIndex = 0;
			renderReady();
		}
	} catch (error) {
		if (!disposed) {
			console.error(error);
			renderError(error instanceof Error ? localize(error.message) : String(error));
		}
	}
	(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, {
		captureSource: "embedded",
		capture: () => (book === null || book === void 0 ? void 0 : book.cover) ? new Blob([copyImageBytes(book.cover)], { type: book.cover.mimeType }) : null,
		getTarget: () => stage.querySelector(".umd-book-head, .umd-chapter") || stage
	});
	return {
		$el: target,
		unmount() {
			var _a;
			disposed = true;
			(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
			tocButton.removeEventListener("click", toggleToc);
			prevButton.removeEventListener("click", goPrev);
			nextButton.removeEventListener("click", goNext);
			revokeImageUrls();
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderUmd as default };
