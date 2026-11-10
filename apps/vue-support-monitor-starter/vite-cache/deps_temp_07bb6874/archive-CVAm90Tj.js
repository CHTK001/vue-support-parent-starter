import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { B as installFileViewerRendererPlugins, Ht as resolveFileViewerArchiveWasmUrl, R as collectFileViewerRendererPlugins, U as resolveFileViewerRendererPresetInputs, Ut as resolveFileViewerArchiveWorkerUrl, V as listFileViewerAutoRendererPresets, d as createFileViewerCoreRendererRegistry, dn as resolveFileViewerRuntimeAssetBaseUrl, i as normalizeFileViewerUiDensity, it as normalizeSource, p as createFileRenderHandlerLoader, st as DEFAULT_SUPPORTED_EXTENSIONS, y as disposeFileViewerRendered, z as createRendererRegistry } from "./dist-B6GcL3C6.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/archiveShared.js
var ARCHIVE_PREVIEWABLE_EXTENSIONS = DEFAULT_SUPPORTED_EXTENSIONS;
var getArchiveEntryExtension = (name) => {
	const clean = name.split(/[?#]/)[0] || name;
	const dot = clean.lastIndexOf(".");
	return dot === -1 ? "" : clean.slice(dot + 1).toLowerCase();
};
var ARCHIVE_SYSTEM_METADATA_FILENAMES = /* @__PURE__ */ new Set([
	".ds_store",
	"desktop.ini",
	"thumbs.db"
]);
var isArchiveSystemMetadataPath = (path) => {
	var _a;
	const parts = path.replace(/^\/+/, "").replace(/\\/g, "/").split("/").filter(Boolean);
	const filename = ((_a = parts[parts.length - 1]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
	return parts.some((part) => part === "__MACOSX" || part.startsWith("._")) || ARCHIVE_SYSTEM_METADATA_FILENAMES.has(filename);
};
var isPreviewableArchiveEntry = (name) => {
	const extension = getArchiveEntryExtension(name);
	return ARCHIVE_PREVIEWABLE_EXTENSIONS.includes(extension);
};
var formatArchiveBytes = (value) => {
	if (!Number.isFinite(value) || value < 0) return "-";
	if (value < 1024) return `${value} B`;
	const units = [
		"KB",
		"MB",
		"GB"
	];
	let next = value / 1024;
	for (const unit of units) {
		if (next < 1024 || unit === units[units.length - 1]) return `${next.toFixed(next < 10 ? 1 : 0)} ${unit}`;
		next /= 1024;
	}
	return `${value} B`;
};
var isCompressedFile = (value) => {
	return typeof value === "object" && value !== null && "extract" in value && typeof value.extract === "function";
};
var flattenArchiveObject = (input, prefix = "") => {
	const entries = [];
	Object.entries(input).forEach(([key, value]) => {
		const path = prefix ? `${prefix}/${key}` : key;
		if (isArchiveSystemMetadataPath(path)) return;
		if (isCompressedFile(value)) {
			const name = value.name || key;
			const extension = getArchiveEntryExtension(name);
			entries.push({
				id: path,
				path,
				name,
				extension,
				size: value.size || 0,
				lastModified: value.lastModified,
				depth: path.split("/").length - 1,
				previewable: isPreviewableArchiveEntry(name),
				compressedFile: value
			});
			return;
		}
		if (value && typeof value === "object") entries.push(...flattenArchiveObject(value, path));
	});
	return entries;
};
var createArchiveCacheKey = (archiveName, archiveSize, entry) => {
	return [
		"archive-entry",
		archiveName || "archive",
		archiveSize,
		entry.path,
		entry.size,
		entry.lastModified || 0
	].join(":");
};
var createArchiveEntryActionContext = (entry) => ({
	path: entry.path,
	name: entry.name,
	extension: entry.extension,
	size: entry.size,
	lastModified: entry.lastModified,
	depth: entry.depth,
	previewable: entry.previewable
});
var isArchiveEntryDownloadAllowed = (entry, archiveOptions) => {
	var _a;
	const policy = (_a = archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.entryActions) === null || _a === void 0 ? void 0 : _a.download;
	if (policy === void 0) return true;
	if (typeof policy === "boolean") return policy;
	try {
		return policy(createArchiveEntryActionContext(entry)) !== false;
	} catch {
		return false;
	}
};
var buildNestedOptions = (context, archiveOptions) => ({
	...(context === null || context === void 0 ? void 0 : context.options) || {},
	archive: archiveOptions
});
var buildArchiveNestedRenderContext = (context, entry, archiveOptions) => ({
	...context,
	filename: entry.name,
	url: void 0,
	streamUrl: void 0,
	options: buildNestedOptions(context, archiveOptions)
});
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/archiveCache.js
var DB_NAME = "flyfish-file-viewer-cache";
var STORE_NAME = "archiveEntries";
var DB_VERSION = 1;
var MAX_CACHE_ENTRY_BYTES = 25165824;
var MAX_CACHE_TOTAL_BYTES = 100663296;
var dbPromise = null;
var canUseIndexedDB = () => typeof indexedDB !== "undefined";
var openCacheDb = () => {
	if (!canUseIndexedDB()) return Promise.reject(/* @__PURE__ */ new Error("IndexedDB 不可用"));
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "key" }).createIndex("updatedAt", "updatedAt");
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	return dbPromise;
};
var runStore = async (mode, runner) => {
	const db = await openCacheDb();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, mode);
		const request = runner(transaction.objectStore(STORE_NAME));
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		transaction.onerror = () => reject(transaction.error);
	});
};
var readArchiveCache = async (key) => {
	try {
		return await runStore("readonly", (store) => store.get(key)) || null;
	} catch {
		return null;
	}
};
var pruneArchiveCache = async () => {
	try {
		const db = await openCacheDb();
		await new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index("updatedAt");
			const entries = [];
			let total = 0;
			index.openCursor().onsuccess = (event) => {
				const cursor = event.target.result;
				if (!cursor) {
					while (total > MAX_CACHE_TOTAL_BYTES && entries.length) {
						const entry = entries.shift();
						if (entry) {
							total -= entry.size;
							store.delete(entry.key);
						}
					}
					return;
				}
				const value = cursor.value;
				total += value.size || 0;
				entries.push({
					key: value.key,
					size: value.size || 0
				});
				cursor.continue();
			};
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	} catch {}
};
var writeArchiveCache = async (entry) => {
	if (entry.size > MAX_CACHE_ENTRY_BYTES) return;
	try {
		await runStore("readwrite", (store) => store.put({
			...entry,
			updatedAt: Date.now()
		}));
		await pruneArchiveCache();
	} catch {}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/archiveFallback.js
var ZIP_LIKE_EXTENSIONS = /* @__PURE__ */ new Set([
	"zip",
	"zipx",
	"jar",
	"war",
	"ear",
	"apk",
	"cbz"
]);
var TAR_LIKE_EXTENSIONS = /* @__PURE__ */ new Set([
	"tar",
	"tgz",
	"gz",
	"gzip"
]);
var TAR_BLOCK_SIZE = 512;
var ZIP_CENTRAL_FILE_HEADER = 33639248;
var ZIP_LOCAL_FILE_HEADER = 67324752;
var ZIP_GENERAL_PURPOSE_ENCRYPTED_FLAG = 1;
var ZIP_GENERAL_PURPOSE_UTF8_FLAG = 2048;
var UTF8_DECODER = new TextDecoder("utf-8");
var UTF8_FATAL_DECODER = new TextDecoder("utf-8", { fatal: true });
var CJK_TEXT_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
var isJSZipLike = (value) => {
	return !!value && (typeof value === "object" || typeof value === "function") && typeof value.loadAsync === "function";
};
var createTextDecoder = (label) => {
	try {
		return new TextDecoder(label);
	} catch {
		return null;
	}
};
var GBK_DECODER = createTextDecoder("gbk") || createTextDecoder("gb18030");
var decodeUtf8Strict = (bytes) => {
	try {
		return UTF8_FATAL_DECODER.decode(bytes);
	} catch {
		return null;
	}
};
var decodeGbk = (bytes) => {
	try {
		return (GBK_DECODER === null || GBK_DECODER === void 0 ? void 0 : GBK_DECODER.decode(bytes)) || null;
	} catch {
		return null;
	}
};
var decodeZipFilename = (bytes) => {
	const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	const utf8 = decodeUtf8Strict(data);
	if (utf8 !== null) return utf8;
	const gbk = decodeGbk(data);
	if (gbk && CJK_TEXT_PATTERN.test(gbk)) return gbk;
	return UTF8_DECODER.decode(data);
};
var resolveJSZip = (module) => {
	const record = module;
	const defaultRecord = record === null || record === void 0 ? void 0 : record.default;
	const JSZip = [
		record === null || record === void 0 ? void 0 : record.default,
		defaultRecord === null || defaultRecord === void 0 ? void 0 : defaultRecord.default,
		record === null || record === void 0 ? void 0 : record.JSZip,
		module
	].find(isJSZipLike);
	if (!JSZip) throw new Error("JSZip module does not expose loadAsync.");
	return JSZip;
};
var toArrayBuffer = (bytes) => {
	const output = new Uint8Array(bytes.byteLength);
	output.set(bytes);
	return output.buffer;
};
var decompressBytes = async (bytes, format) => {
	if (typeof DecompressionStream === "undefined") return null;
	const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream(format));
	return new Uint8Array(await new Response(stream).arrayBuffer());
};
var normalizeArchivePath$1 = (path) => {
	return path.replace(/^\/+/, "").replace(/\\/g, "/");
};
var getPathName = (path) => {
	const parts = normalizeArchivePath$1(path).split("/");
	return parts[parts.length - 1] || path;
};
var getPathDepth = (path) => {
	return Math.max(0, normalizeArchivePath$1(path).split("/").length - 1);
};
var createEntryView = (source) => {
	const path = normalizeArchivePath$1(source.path);
	const name = getPathName(path);
	return {
		id: path,
		path,
		name,
		extension: getArchiveEntryExtension(name),
		size: source.size,
		lastModified: source.lastModified,
		depth: getPathDepth(path),
		previewable: isPreviewableArchiveEntry(name),
		compressedFile: {
			name,
			size: source.size,
			lastModified: source.lastModified,
			async extract() {
				const buffer = await source.load();
				return new File([buffer], name, {
					type: "application/octet-stream",
					lastModified: source.lastModified || Date.now()
				});
			}
		}
	};
};
var parseOctal = (bytes, start, length) => {
	const text = new TextDecoder("ascii").decode(bytes.slice(start, start + length)).replace(/\0.*$/, "").trim();
	return text ? Number.parseInt(text, 8) || 0 : 0;
};
var readTarName = (bytes, offset) => {
	const decoder = new TextDecoder("utf-8");
	const name = decoder.decode(bytes.slice(offset, offset + 100)).replace(/\0.*$/, "");
	const prefix = decoder.decode(bytes.slice(offset + 345, offset + 500)).replace(/\0.*$/, "");
	return normalizeArchivePath$1(prefix ? `${prefix}/${name}` : name);
};
var parseTarEntries = (bytes) => {
	const entries = [];
	let offset = 0;
	while (offset + TAR_BLOCK_SIZE <= bytes.length) {
		if (bytes.slice(offset, offset + TAR_BLOCK_SIZE).every((value) => value === 0)) break;
		const path = readTarName(bytes, offset);
		const size = parseOctal(bytes, offset + 124, 12);
		const typeFlag = String.fromCharCode(bytes[offset + 156] || 0);
		const dataOffset = offset + TAR_BLOCK_SIZE;
		const nextOffset = dataOffset + Math.ceil(size / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
		if (path && typeFlag !== "5" && !isArchiveSystemMetadataPath(path)) {
			const fileBytes = bytes.slice(dataOffset, dataOffset + size);
			entries.push(createEntryView({
				path,
				size,
				load: async () => toArrayBuffer(fileBytes)
			}));
		}
		offset = nextOffset;
	}
	return entries;
};
var getArchiveExtension = (filename) => {
	const lower = filename.toLowerCase();
	if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) return "tgz";
	return getArchiveEntryExtension(filename);
};
var readUint16 = (view, offset) => {
	return offset + 2 <= view.byteLength ? view.getUint16(offset, true) : 0;
};
var readUint32 = (view, offset) => {
	return offset + 4 <= view.byteLength ? view.getUint32(offset, true) : 0;
};
var hasEncryptedZipEntries = (data) => {
	const view = new DataView(data);
	for (let offset = 0; offset + 12 <= view.byteLength; offset += 1) {
		const signature = readUint32(view, offset);
		if (signature !== ZIP_CENTRAL_FILE_HEADER && signature !== ZIP_LOCAL_FILE_HEADER) continue;
		if ((readUint16(view, signature === ZIP_CENTRAL_FILE_HEADER ? offset + 8 : offset + 6) & ZIP_GENERAL_PURPOSE_ENCRYPTED_FLAG) !== 0) return true;
	}
	return false;
};
var hasLikelyGbkZipFilenames = (data, filename) => {
	const extension = getArchiveExtension(filename);
	if (!ZIP_LIKE_EXTENSIONS.has(extension)) return false;
	const view = new DataView(data);
	for (let offset = 0; offset + 46 <= view.byteLength; offset += 1) {
		if (readUint32(view, offset) !== ZIP_CENTRAL_FILE_HEADER) continue;
		const flag = readUint16(view, offset + 8);
		const nameLength = readUint16(view, offset + 28);
		const extraLength = readUint16(view, offset + 30);
		const commentLength = readUint16(view, offset + 32);
		const nameStart = offset + 46;
		const nameEnd = nameStart + nameLength;
		if (nameEnd > view.byteLength) return false;
		if ((flag & ZIP_GENERAL_PURPOSE_UTF8_FLAG) === 0) {
			const decoded = decodeZipFilename(new Uint8Array(data, nameStart, nameLength));
			if (CJK_TEXT_PATTERN.test(decoded)) return true;
		}
		offset = nameEnd + extraLength + commentLength - 1;
	}
	return false;
};
var isLikelyEncryptedArchive = (data, filename) => {
	const extension = getArchiveExtension(filename);
	if (ZIP_LIKE_EXTENSIONS.has(extension)) return hasEncryptedZipEntries(data);
	return false;
};
var getGzipEntryName = (filename) => {
	const lower = filename.toLowerCase();
	if (lower.endsWith(".gzip")) return filename.slice(0, -5) || "archive";
	if (lower.endsWith(".gz")) return filename.slice(0, -3) || "archive";
	return `${filename || "archive"}.bin`;
};
var loadZipEntries = async (data) => {
	const zip = await resolveJSZip(await import("./jszip.min-GBnLsJAC.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1))).loadAsync(data, { decodeFileName: decodeZipFilename });
	const entries = [];
	zip.forEach((relativePath, file) => {
		var _a, _b;
		if (file.dir) return;
		const metadata = file;
		const normalizedPath = normalizeArchivePath$1(relativePath);
		if (isArchiveSystemMetadataPath(normalizedPath)) return;
		entries.push(createEntryView({
			path: normalizedPath,
			size: ((_a = metadata._data) === null || _a === void 0 ? void 0 : _a.uncompressedSize) || 0,
			lastModified: (_b = file.date) === null || _b === void 0 ? void 0 : _b.getTime(),
			load: async () => file.async("arraybuffer")
		}));
	});
	return entries;
};
var loadTarEntries = async (data, filename, extension) => {
	const source = new Uint8Array(data);
	const bytes = extension === "tar" ? source : await decompressBytes(source, "gzip");
	if (!bytes) return null;
	if (extension === "gz" || extension === "gzip") {
		const lower = filename.toLowerCase();
		if (!(lower.endsWith(".tar.gz") || lower.endsWith(".tgz"))) return [createEntryView({
			path: getGzipEntryName(filename),
			size: bytes.byteLength,
			load: async () => toArrayBuffer(bytes)
		})];
	}
	return parseTarEntries(bytes);
};
/**
* Worker fallback for constrained browsers, temporary local servers, and
* mobile WebViews. The main libarchive path still covers broader formats;
* this covers common ZIP/TAR/GZIP archives without an extra static Worker.
*/
var loadArchiveEntriesWithoutWorker = async (data, filename) => {
	const extension = getArchiveExtension(filename);
	if (ZIP_LIKE_EXTENSIONS.has(extension)) {
		if (isLikelyEncryptedArchive(data, filename)) return null;
		return loadZipEntries(data);
	}
	if (TAR_LIKE_EXTENSIONS.has(extension)) return loadTarEntries(data, filename, extension);
	return null;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/comicBook.js
var COMIC_IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
	"avif",
	"bmp",
	"gif",
	"heic",
	"heif",
	"jpe",
	"jpeg",
	"jpg",
	"jxl",
	"png",
	"tif",
	"tiff",
	"webp"
]);
var comicBookStyle = `
.archive-comic-page{min-width:64px;color:#64748b!important;text-align:center;font-variant-numeric:tabular-nums}
.archive-comic-nav:disabled{cursor:not-allowed;opacity:.42}
`;
var isComicBookExtension = (extension) => {
	const normalized = extension.trim().toLowerCase();
	return normalized === "cbz" || normalized === "cbr";
};
var isComicBookPage = (entry) => COMIC_IMAGE_EXTENSIONS.has(entry.extension.toLowerCase());
var naturalComicPageCompare = (left, right) => left.path.localeCompare(right.path, void 0, {
	numeric: true,
	sensitivity: "base"
});
var getComicBookPages = (entries) => entries.filter(isComicBookPage).sort(naturalComicPageCompare);
var clampComicPageIndex = (index, pageCount) => Math.max(0, Math.min(index, Math.max(0, pageCount - 1)));
var createButton = (documentRef, text, title) => {
	const button = documentRef.createElement("button");
	button.type = "button";
	button.className = "archive-comic-nav";
	button.textContent = text;
	button.title = title;
	button.setAttribute("aria-label", title);
	return button;
};
var createComicBookController = (options) => {
	const enabled = isComicBookExtension(options.extension);
	const previousButton = createButton(options.document, "‹", options.previousLabel);
	const pageText = options.document.createElement("span");
	pageText.className = "archive-comic-page";
	pageText.setAttribute("role", "status");
	pageText.setAttribute("aria-live", "polite");
	pageText.setAttribute("aria-atomic", "true");
	const nextButton = createButton(options.document, "›", options.nextLabel);
	const toolbarElements = [
		previousButton,
		pageText,
		nextButton
	];
	const cleanups = [];
	const timers = /* @__PURE__ */ new Set();
	let pageIndex = -1;
	let pointerStartX = null;
	toolbarElements.forEach((element) => {
		element.hidden = !enabled;
	});
	if (enabled) options.root.tabIndex = 0;
	const pages = () => getComicBookPages(options.getEntries());
	const openPage = (index) => {
		const currentPages = pages();
		if (!currentPages.length) return;
		pageIndex = clampComicPageIndex(index, currentPages.length);
		options.openEntry(currentPages[pageIndex]);
	};
	const listen = (element, event, listener) => {
		element.addEventListener(event, listener);
		cleanups.push(() => element.removeEventListener(event, listener));
	};
	if (enabled) {
		listen(previousButton, "click", () => openPage(pageIndex - 1));
		listen(nextButton, "click", () => openPage(pageIndex + 1));
		listen(options.root, "keydown", (event) => {
			const eventTarget = event.target;
			if (eventTarget === null || eventTarget === void 0 ? void 0 : eventTarget.closest("input, button, select, textarea, [contenteditable=\"true\"]")) return;
			if (event.key === "ArrowLeft" || event.key === "PageUp") {
				event.preventDefault();
				openPage(pageIndex - 1);
			} else if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
				event.preventDefault();
				openPage(pageIndex + 1);
			} else if (event.key === "Home") {
				event.preventDefault();
				openPage(0);
			} else if (event.key === "End") {
				event.preventDefault();
				openPage(pages().length - 1);
			}
		});
		listen(options.stage, "pointerdown", (event) => {
			if (event.isPrimary) {
				options.root.focus({ preventScroll: true });
				pointerStartX = event.clientX;
			}
		});
		listen(options.stage, "pointerup", (event) => {
			if (pointerStartX === null || !event.isPrimary) {
				pointerStartX = null;
				return;
			}
			const distance = event.clientX - pointerStartX;
			pointerStartX = null;
			if (Math.abs(distance) >= 56) openPage(pageIndex + (distance < 0 ? 1 : -1));
		});
		listen(options.stage, "pointercancel", () => {
			pointerStartX = null;
		});
	}
	return {
		enabled,
		badge: enabled ? options.extension.toUpperCase() : "ARCHIVE",
		toolbarElements,
		getVisibleEntries: (entries) => enabled ? getComicBookPages(entries) : [...entries],
		sortEntries: (entries) => entries.sort(enabled ? naturalComicPageCompare : (left, right) => left.path.localeCompare(right.path)),
		onEntriesReady() {
			var _a;
			if (!enabled || !pages().length) return;
			const timer = (_a = options.document.defaultView) === null || _a === void 0 ? void 0 : _a.setTimeout(() => {
				timers.delete(timer || 0);
				openPage(0);
			}, 0);
			if (timer !== void 0) timers.add(timer);
		},
		onEntrySelected(entry) {
			if (enabled) pageIndex = pages().findIndex((page) => page.id === entry.id);
		},
		sync() {
			if (!enabled) return;
			const pageCount = pages().length;
			pageText.textContent = pageCount ? `${pageIndex + 1} / ${pageCount}` : "0 / 0";
			previousButton.disabled = pageIndex <= 0;
			nextButton.disabled = pageIndex < 0 || pageIndex >= pageCount - 1;
		},
		dispose() {
			cleanups.splice(0).forEach((cleanup) => cleanup());
			timers.forEach((timer) => {
				var _a;
				return (_a = options.document.defaultView) === null || _a === void 0 ? void 0 : _a.clearTimeout(timer);
			});
			timers.clear();
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/shapefileBundle.js
var SHAPEFILE_COMPONENT_EXTENSIONS = /* @__PURE__ */ new Set([
	"shp",
	"shx",
	"dbf",
	"prj",
	"cpg"
]);
var SHAPEFILE_COMPONENT_ORDER = /* @__PURE__ */ new Map([
	["shp", 0],
	["dbf", 1],
	["shx", 2],
	["prj", 3],
	["cpg", 4]
]);
var normalizeArchivePath = (path) => path.replace(/^\/+/, "").replace(/\\/g, "/");
var getArchivePathParts = (path) => {
	const normalized = normalizeArchivePath(path);
	const slash = normalized.lastIndexOf("/");
	const directory = slash === -1 ? "" : normalized.slice(0, slash);
	const filename = slash === -1 ? normalized : normalized.slice(slash + 1);
	const extension = getArchiveEntryExtension(filename);
	const stem = extension ? filename.slice(0, -(extension.length + 1)) : filename;
	return {
		directory: directory.toLowerCase(),
		filename,
		stem: stem.toLowerCase(),
		extension
	};
};
var resolveJSZipWriter = (module) => {
	const record = module;
	const defaultRecord = record === null || record === void 0 ? void 0 : record.default;
	const constructor = [
		record === null || record === void 0 ? void 0 : record.default,
		defaultRecord === null || defaultRecord === void 0 ? void 0 : defaultRecord.default,
		record === null || record === void 0 ? void 0 : record.JSZip,
		module
	].find((candidate) => typeof candidate === "function");
	if (!constructor) throw new Error("JSZip module does not expose a constructor.");
	return constructor;
};
/**
* Finds the files that form the selected Shapefile dataset. Shapefile
* sidecars are matched case-insensitively by directory and basename so an
* archive containing multiple datasets never leaks attributes or projection
* metadata from a neighbouring dataset into the preview.
*/
var getShapefileBundleEntries = (entries, selectedEntry) => {
	const selected = getArchivePathParts(selectedEntry.path);
	if (selected.extension !== "shp") return [];
	return entries.filter((entry) => {
		const candidate = getArchivePathParts(entry.path);
		return candidate.directory === selected.directory && candidate.stem === selected.stem && SHAPEFILE_COMPONENT_EXTENSIONS.has(candidate.extension);
	}).sort((left, right) => {
		var _a, _b;
		const leftExtension = getArchivePathParts(left.path).extension;
		const rightExtension = getArchivePathParts(right.path).extension;
		return ((_a = SHAPEFILE_COMPONENT_ORDER.get(leftExtension)) !== null && _a !== void 0 ? _a : Number.MAX_SAFE_INTEGER) - ((_b = SHAPEFILE_COMPONENT_ORDER.get(rightExtension)) !== null && _b !== void 0 ? _b : Number.MAX_SAFE_INTEGER);
	});
};
/**
* shpjs accepts an ArrayBuffer ZIP for a complete Shapefile dataset. Archive
* previews normally extract one entry at a time, so rebuild a small STORE-only
* ZIP from the selected .shp and its sidecars before delegating to the existing
* geospatial renderer. STORE avoids wasting CPU recompressing already
* compressed archive data.
*/
var createShapefileBundleArchive = async (entries, readEntry) => {
	const zip = new (resolveJSZipWriter(await import("./jszip.min-GBnLsJAC.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1))))();
	for (const entry of entries) {
		const { filename } = getArchivePathParts(entry.path);
		zip.file(filename || entry.name, await readEntry(entry));
	}
	return zip.generateAsync({
		type: "arraybuffer",
		compression: "STORE"
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-archive@3.1.2/node_modules/@file-viewer/renderer-archive/dist/archive.js
var DEFAULT_MAX_ARCHIVE_SIZE = 335544320;
var DEFAULT_MAX_ENTRY_PREVIEW_SIZE = 67108864;
var DEFAULT_WORKER_TIMEOUT_MS = 3e4;
var MAX_LISTED_ENTRIES = 5e3;
var ArchivePasswordCancelledError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "ArchivePasswordCancelledError";
	}
};
var archiveStyle = `
	${comicBookStyle}
	.archive-shell,.archive-viewer{position:relative;box-sizing:border-box;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;display:grid;grid-template-columns:var(--archive-sidebar-track) minmax(0,1fr);grid-template-rows:minmax(0,1fr);--archive-sidebar-track:clamp(248px,30%,420px);--archive-sidebar-gap:8px;--archive-sidebar-padding:10px;--archive-head-gap:8px;--archive-eyebrow-size:10px;--archive-title-margin:2px;--archive-title-size:15px;--archive-stats-margin:4px;--archive-stats-size:11px;--archive-stats-line:1.35;--archive-toggle-size:32px;--archive-toggle-radius:9px;--archive-notice-padding:7px 9px;--archive-notice-radius:9px;--archive-notice-size:11px;--archive-search-height:36px;--archive-search-padding:0 10px;--archive-search-radius:9px;--archive-search-font-size:12px;--archive-list-gap:4px;--archive-list-padding:3px;--archive-entry-min-height:48px;--archive-entry-icon-column:34px;--archive-entry-gap:7px;--archive-entry-padding-y:5px;--archive-entry-padding-x:7px;--archive-entry-depth-step:8px;--archive-entry-depth-max:40px;--archive-entry-radius:9px;--archive-entry-ext-height:28px;--archive-entry-ext-radius:7px;--archive-entry-ext-size:9px;--archive-entry-name-size:13px;--archive-entry-name-line:1.25;--archive-entry-meta-size:11px;--archive-entry-meta-line:1.3;--archive-entry-size-width:64px;--archive-preview-toolbar-min-height:56px;--archive-preview-toolbar-gap:10px;--archive-preview-toolbar-padding:10px 12px;--archive-preview-button-height:32px;--archive-preview-button-padding:0 10px;--archive-preview-button-radius:9px;--archive-empty-padding:24px;--archive-state-gap:10px;--archive-state-padding:14px;--archive-state-radius:14px;background:#edf2f7;color:#172033;font-family:Aptos,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
	.archive-shell *,.archive-viewer *{box-sizing:border-box}
	.archive-shell[data-viewer-density='compact'],.archive-viewer[data-viewer-density='compact'],.file-viewer[data-viewer-density='compact'] .archive-shell,.file-viewer[data-viewer-density='compact'] .archive-viewer,.file-viewer-web-shell[data-viewer-density='compact'] .archive-shell,.file-viewer-web-shell[data-viewer-density='compact'] .archive-viewer{--archive-sidebar-track:clamp(224px,27%,360px);--archive-sidebar-gap:4px;--archive-sidebar-padding:6px;--archive-head-gap:5px;--archive-eyebrow-size:9px;--archive-title-margin:1px;--archive-title-size:14px;--archive-stats-margin:2px;--archive-stats-size:10px;--archive-toggle-size:28px;--archive-toggle-radius:7px;--archive-notice-padding:4px 6px;--archive-notice-radius:7px;--archive-notice-size:10px;--archive-search-height:30px;--archive-search-padding:0 7px;--archive-search-radius:7px;--archive-search-font-size:11px;--archive-list-gap:3px;--archive-list-padding:2px;--archive-entry-min-height:40px;--archive-entry-icon-column:28px;--archive-entry-gap:5px;--archive-entry-padding-y:3px;--archive-entry-padding-x:5px;--archive-entry-depth-step:6px;--archive-entry-depth-max:32px;--archive-entry-radius:7px;--archive-entry-ext-height:24px;--archive-entry-ext-radius:6px;--archive-entry-ext-size:8px;--archive-entry-name-size:12px;--archive-entry-meta-size:10px;--archive-entry-size-width:54px;--archive-preview-toolbar-min-height:38px;--archive-preview-toolbar-gap:5px;--archive-preview-toolbar-padding:4px 5px;--archive-preview-button-height:28px;--archive-preview-button-padding:0 5px;--archive-preview-button-radius:7px;--archive-empty-padding:18px;--archive-state-gap:5px;--archive-state-padding:5px;--archive-state-radius:10px}
	@media (pointer:coarse){.archive-shell[data-viewer-density='compact'],.archive-viewer[data-viewer-density='compact'],.file-viewer[data-viewer-density='compact'] .archive-shell,.file-viewer[data-viewer-density='compact'] .archive-viewer,.file-viewer-web-shell[data-viewer-density='compact'] .archive-shell,.file-viewer-web-shell[data-viewer-density='compact'] .archive-viewer{--archive-toggle-size:34px;--archive-search-height:36px;--archive-entry-min-height:50px;--archive-entry-ext-height:30px;--archive-preview-toolbar-min-height:48px;--archive-preview-button-height:34px}}
	.archive-sidebar{grid-column:1;grid-row:1;min-width:0;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:var(--archive-sidebar-gap);padding:var(--archive-sidebar-padding);border-right:1px solid rgba(23,32,51,.08);background:rgba(255,255,255,.72);transition:opacity .18s ease,padding .18s ease,border-color .18s ease}
.archive-shell.archive-sidebar-collapsed,.archive-viewer.archive-sidebar-collapsed{grid-template-columns:0 minmax(0,1fr)}
.archive-sidebar-collapsed .archive-sidebar{display:none;width:0;max-width:0;padding:0;border-color:transparent;opacity:0;pointer-events:none}
.archive-sidebar-collapsed .archive-sidebar>*{visibility:hidden}
	.archive-head{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:var(--archive-head-gap);align-items:start}
	.archive-head-main{min-width:0}
	.archive-head span,.archive-preview-toolbar span{color:#6c7c90;font-size:var(--archive-eyebrow-size);font-weight:800;letter-spacing:.02em}
	.archive-head strong,.archive-preview-toolbar strong{display:block;margin-top:var(--archive-title-margin);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--archive-title-size);line-height:1.25}
	.archive-head p{min-width:0;margin:var(--archive-stats-margin) 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#69798b;font-size:var(--archive-stats-size);line-height:var(--archive-stats-line);font-variant-numeric:tabular-nums}
	.archive-sidebar-toggle{width:var(--archive-toggle-size);height:var(--archive-toggle-size);flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(23,32,51,.1);border-radius:var(--archive-toggle-radius);background:#fff;color:#1f7a58;font:inherit;font-size:17px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 6px 16px rgba(23,32,51,.07)}
	.archive-sidebar-toggle:hover{border-color:rgba(31,122,88,.32);background:#f0fdf4}
	.archive-warning,.archive-info,.archive-error{border-radius:var(--archive-notice-radius);padding:var(--archive-notice-padding);background:#fff7e8;color:#8a4b00;font-size:var(--archive-notice-size);line-height:1.4}
	.archive-info{background:#ecfdf5;color:#166534}
	.archive-search{width:100%;height:var(--archive-search-height);padding:var(--archive-search-padding);border-radius:var(--archive-search-radius);border:1px solid rgba(23,32,51,.1);outline:none;background:#fff;color:#172033;font-family:inherit;font-size:var(--archive-search-font-size);line-height:1.2}
	.archive-list{flex:1;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;display:flex;flex-direction:column;gap:var(--archive-list-gap);padding-right:var(--archive-list-padding)}
	.archive-entry{width:100%;min-width:0;min-height:var(--archive-entry-min-height);display:grid;grid-template-columns:var(--archive-entry-icon-column) minmax(0,1fr) minmax(40px,auto);gap:var(--archive-entry-gap);align-items:center;padding:var(--archive-entry-padding-y) var(--archive-entry-padding-x) var(--archive-entry-padding-y) calc(var(--archive-entry-padding-x) + clamp(0px,calc(var(--entry-depth,0) * var(--archive-entry-depth-step)),var(--archive-entry-depth-max)));border:1px solid rgba(23,32,51,.07);border-radius:var(--archive-entry-radius);background:rgba(255,255,255,.86);color:inherit;text-align:left;cursor:pointer;font-family:inherit;font-size:var(--archive-entry-name-size);line-height:var(--archive-entry-name-line)}
	.archive-entry:hover,.archive-entry.active{border-color:rgba(33,129,95,.28);box-shadow:0 10px 22px rgba(23,32,51,.08)}
	.entry-ext{min-width:0;height:var(--archive-entry-ext-height);display:inline-flex;align-items:center;justify-content:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 3px;border-radius:var(--archive-entry-ext-radius);background:rgba(33,129,95,.12);color:#1d7a56;font-size:var(--archive-entry-ext-size);font-weight:900;line-height:1;text-transform:uppercase}
	.entry-copy{min-width:0}
	.entry-copy strong,.entry-copy em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
	.entry-copy strong{font-size:var(--archive-entry-name-size);font-weight:650;line-height:var(--archive-entry-name-line)}
	.entry-copy em,.archive-entry small{color:#718096;font-size:var(--archive-entry-meta-size);font-style:normal;line-height:var(--archive-entry-meta-line)}
	.archive-entry small{min-width:0;max-width:var(--archive-entry-size-width);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
.archive-preview{grid-column:2;grid-row:1;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;display:flex;flex-direction:column}
	.archive-preview-toolbar{min-width:0;min-height:var(--archive-preview-toolbar-min-height);display:flex;align-items:center;gap:var(--archive-preview-toolbar-gap);padding:var(--archive-preview-toolbar-padding);border-bottom:1px solid rgba(23,32,51,.08);background:rgba(255,255,255,.76)}
	.archive-preview-toolbar button{height:var(--archive-preview-button-height);border:0;border-radius:var(--archive-preview-button-radius);padding:var(--archive-preview-button-padding);background:#1f7a58;color:#fff;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.archive-preview-toolbar .archive-sidebar-toggle{background:#fff;color:#1f7a58;border:1px solid rgba(23,32,51,.1);padding:0}
.archive-preview-title{min-width:0;flex:1}
.archive-preview-toolbar span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.archive-preview-toolbar .archive-download-button{flex:0 0 auto}
.archive-nested-target{position:relative;flex:1;min-height:0;overflow:auto}
.archive-nested-content{width:100%;height:100%;min-height:420px}
	.archive-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--archive-empty-padding);text-align:center;color:#64748b}
.archive-empty strong{color:#172033;font-size:18px}
.archive-state{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(241,245,249,.82);backdrop-filter:blur(8px);z-index:4}
	.archive-state>div{display:flex;align-items:center;gap:var(--archive-state-gap);width:min(92%,430px);padding:var(--archive-state-padding);border-radius:var(--archive-state-radius);background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.14)}
.archive-state p{margin:4px 0 0;color:#64748b}
.archive-spinner{width:34px;height:34px;flex-shrink:0;border-radius:999px;border:3px solid rgba(31,122,88,.16);border-top-color:#1f7a58;animation:archive-spin .9s linear infinite}
.archive-error{position:absolute;right:18px;bottom:18px;width:min(460px,calc(100% - 36px));box-shadow:0 16px 36px rgba(23,32,51,.14);z-index:5}
.archive-password-dialog{position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(15,23,42,.42);backdrop-filter:blur(10px)}
.archive-password-card{width:min(420px,100%);display:flex;flex-direction:column;gap:14px;padding:20px;border-radius:18px;background:#fff;color:#172033;box-shadow:0 24px 56px rgba(15,23,42,.24)}
.archive-password-card h3{margin:0;font-size:19px;line-height:1.25}
.archive-password-card p{margin:0;color:#64748b;font-size:13px;line-height:1.55}
.archive-password-card input{width:100%;height:44px;border-radius:12px;border:1px solid rgba(23,32,51,.12);outline:none;padding:0 12px;background:#fff;color:#172033;font:inherit}
.archive-password-card input:focus{border-color:rgba(31,122,88,.48);box-shadow:0 0 0 3px rgba(31,122,88,.12)}
.archive-password-error{min-height:18px;color:#b42318!important}
.archive-password-actions{display:flex;justify-content:flex-end;gap:10px}
.archive-password-actions button{height:38px;border:0;border-radius:10px;padding:0 14px;font:inherit;font-weight:800;cursor:pointer}
.archive-password-cancel{background:#eef2f7;color:#334155}
.archive-password-submit{background:#1f7a58;color:#fff}
.archive-hidden{display:none!important}
[data-viewer-theme='dark'] .archive-shell,[data-viewer-theme='dark'] .archive-viewer{background:#101820;color:#e6edf3}
[data-viewer-theme='dark'] .archive-sidebar,[data-viewer-theme='dark'] .archive-preview-toolbar{border-color:rgba(139,148,158,.2);background:rgba(21,27,35,.82)}
[data-viewer-theme='dark'] .archive-entry,[data-viewer-theme='dark'] .archive-search,[data-viewer-theme='dark'] .archive-state>div{background:#151b23;color:#e6edf3;border-color:rgba(139,148,158,.2)}
[data-viewer-theme='dark'] .archive-head span,[data-viewer-theme='dark'] .archive-preview-toolbar span,[data-viewer-theme='dark'] .archive-head p,[data-viewer-theme='dark'] .entry-copy em,[data-viewer-theme='dark'] .archive-entry small{color:#9cacc0}
[data-viewer-theme='dark'] .archive-password-card{background:#151b23;color:#e6edf3}
[data-viewer-theme='dark'] .archive-password-card input{background:#0d1117;color:#e6edf3;border-color:rgba(139,148,158,.24)}
[data-viewer-theme='dark'] .archive-password-cancel{background:#212a35;color:#d7dee8}
[data-viewer-theme='dark'] .archive-empty strong{color:#f8fafc}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .archive-shell,[data-viewer-theme='system'] .archive-viewer{background:#101820;color:#e6edf3}[data-viewer-theme='system'] .archive-sidebar,[data-viewer-theme='system'] .archive-preview-toolbar{border-color:rgba(139,148,158,.2);background:rgba(21,27,35,.82)}[data-viewer-theme='system'] .archive-entry,[data-viewer-theme='system'] .archive-search,[data-viewer-theme='system'] .archive-state>div{background:#151b23;color:#e6edf3;border-color:rgba(139,148,158,.2)}[data-viewer-theme='system'] .archive-head span,[data-viewer-theme='system'] .archive-preview-toolbar span,[data-viewer-theme='system'] .archive-head p,[data-viewer-theme='system'] .entry-copy em,[data-viewer-theme='system'] .archive-entry small{color:#9cacc0}[data-viewer-theme='system'] .archive-password-card{background:#151b23;color:#e6edf3}[data-viewer-theme='system'] .archive-password-card input{background:#0d1117;color:#e6edf3;border-color:rgba(139,148,158,.24)}[data-viewer-theme='system'] .archive-password-cancel{background:#212a35;color:#d7dee8}[data-viewer-theme='system'] .archive-empty strong{color:#f8fafc}}
@keyframes archive-spin{to{transform:rotate(360deg)}}
@media (max-width:860px){.archive-shell,.archive-viewer{grid-template-columns:1fr;grid-template-rows:minmax(200px,34%) minmax(0,1fr);--archive-sidebar-gap:6px;--archive-sidebar-padding:8px;--archive-title-size:14px;--archive-stats-size:10px;--archive-search-height:38px;--archive-search-font-size:16px;--archive-list-gap:3px;--archive-entry-min-height:44px;--archive-entry-icon-column:30px;--archive-entry-gap:6px;--archive-entry-padding-y:4px;--archive-entry-padding-x:6px;--archive-entry-depth-step:6px;--archive-entry-depth-max:24px;--archive-entry-ext-height:26px;--archive-entry-name-size:12px;--archive-entry-meta-size:10px;--archive-entry-size-width:52px}.archive-shell.archive-sidebar-collapsed,.archive-viewer.archive-sidebar-collapsed{grid-template-columns:1fr;grid-template-rows:0 minmax(0,1fr)}.archive-sidebar{grid-column:1;grid-row:1;border-right:0;border-bottom:1px solid rgba(23,32,51,.08)}.archive-preview{grid-column:1;grid-row:2}.archive-preview-toolbar{min-height:52px;padding:8px 10px}.archive-preview-toolbar strong{font-size:15px}.archive-entry{grid-template-columns:var(--archive-entry-icon-column) minmax(0,1fr) minmax(40px,auto)}}
`;
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = archiveStyle;
	return style;
};
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var normalizeWorkerError = (reason) => {
	if (reason instanceof Error) return reason.message;
	return typeof reason === "string" ? reason : JSON.stringify(reason);
};
var isArchivePasswordError = (reason) => {
	const message = normalizeWorkerError(reason).toLowerCase();
	return /passphrase|password|encrypted|decrypt|crypto|wrong key|incorrect/i.test(message);
};
var resolveAutoRenderersEnabled = (options = {}) => {
	const setting = options.autoRenderers;
	if (typeof setting === "boolean") return setting;
	if ((setting === null || setting === void 0 ? void 0 : setting.enabled) !== void 0) return setting.enabled;
	return (options.rendererMode || "extend") !== "replace";
};
var createNestedRendererRegistry = async (context) => {
	const options = (context === null || context === void 0 ? void 0 : context.options) || {};
	const registry = options.rendererMode === "replace" ? createRendererRegistry([]) : createFileViewerCoreRendererRegistry({ builtinRenderers: options.builtinRenderers }).registry;
	const rendererInputs = [];
	if (resolveAutoRenderersEnabled(options)) rendererInputs.push(...listFileViewerAutoRendererPresets());
	rendererInputs.push(...resolveFileViewerRendererPresetInputs(options.preset), ...resolveFileViewerRendererPresetInputs(options.presets));
	if (options.renderers) rendererInputs.push(options.renderers);
	const plugins = collectFileViewerRendererPlugins(rendererInputs);
	if (!plugins.length) return registry;
	await installFileViewerRendererPlugins({
		registry,
		plugins,
		registerHandler: (registration) => {
			const definition = registry.getById(registration.rendererId);
			if (!definition) return;
			registry.register({
				...definition,
				load: createFileRenderHandlerLoader({
					handler: registration.handler,
					getTarget: (loadContext) => loadContext.surface.container
				})
			});
		}
	});
	return registry;
};
var createNestedRenderedInstance = (target, session) => ({
	$el: target,
	destroy: () => {
		var _a;
		return (_a = session.destroy) === null || _a === void 0 ? void 0 : _a.call(session);
	}
});
var withTimeout = async (promise, timeout, message, targetWindow) => {
	let timer = 0;
	const timerWindow = targetWindow || (typeof window !== "undefined" ? window : void 0);
	try {
		return await Promise.race([promise, new Promise((_, reject) => {
			timer = (timerWindow === null || timerWindow === void 0 ? void 0 : timerWindow.setTimeout) ? timerWindow.setTimeout(() => reject(new Error(message)), timeout) : setTimeout(() => reject(new Error(message)), timeout);
		})]);
	} finally {
		if (timerWindow === null || timerWindow === void 0 ? void 0 : timerWindow.clearTimeout) timerWindow.clearTimeout(timer);
		else clearTimeout(timer);
	}
};
var getDocumentBaseUrl = (documentRef) => {
	return documentRef.baseURI || documentRef.URL || "file:///";
};
var getWorkerConstructor = (documentRef) => {
	var _a;
	const WorkerCtor = ((_a = documentRef.defaultView) === null || _a === void 0 ? void 0 : _a.Worker) || (typeof Worker !== "undefined" ? Worker : void 0);
	if (!WorkerCtor) throw new Error("Web Worker is not supported by this browser.");
	return WorkerCtor;
};
var getFileConstructor = (documentRef) => {
	var _a;
	return ((_a = documentRef.defaultView) === null || _a === void 0 ? void 0 : _a.File) || (typeof File !== "undefined" ? File : void 0);
};
var createArchiveFile = (documentRef, buffer, filename) => {
	const FileCtor = getFileConstructor(documentRef);
	if (FileCtor) return new FileCtor([buffer], filename || "archive.bin", { type: "application/octet-stream" });
	return Object.assign(new Blob([buffer], { type: "application/octet-stream" }), { name: filename || "archive.bin" });
};
var probeWorkerUrl = async (url) => {
	try {
		const response = await fetch(url, {
			method: "HEAD",
			cache: "no-cache"
		});
		const contentType = response.headers.get("content-type") || "";
		if (response.ok && /javascript|ecmascript|octet-stream/i.test(contentType)) return true;
		if (response.status && response.status !== 405) return false;
	} catch {}
	try {
		const response = await fetch(url, {
			method: "GET",
			cache: "no-cache",
			headers: { Range: "bytes=0-0" }
		});
		const contentType = response.headers.get("content-type") || "";
		return response.ok && /javascript|ecmascript|octet-stream/i.test(contentType);
	} catch {
		return false;
	}
};
var patchLibarchiveWorkerSource = (source, wasmUrl) => {
	const wasmLiteral = JSON.stringify(wasmUrl);
	return source.replace(/new URL\((['"])libarchive\.wasm\1\s*,\s*import\.meta\.url\)\.href/g, wasmLiteral);
};
var prepareWorkerUrl = async (candidate, objectUrls) => {
	if (!candidate.wasmUrl) return candidate.workerUrl;
	const response = await fetch(candidate.workerUrl, { cache: "no-cache" });
	if (!response.ok) throw new Error(`Unable to read libarchive Worker: ${response.status}`);
	const source = await response.text();
	const workerUrl = URL.createObjectURL(new Blob([patchLibarchiveWorkerSource(source, candidate.wasmUrl)], { type: "application/javascript" }));
	objectUrls.push(workerUrl);
	return workerUrl;
};
var resolveWorkerCandidates = async (documentRef, options) => {
	const candidates = [];
	const baseUrl = resolveFileViewerRuntimeAssetBaseUrl(documentRef) || getDocumentBaseUrl(documentRef);
	const wasmUrl = (options === null || options === void 0 ? void 0 : options.wasmUrl) ? resolveFileViewerArchiveWasmUrl(options, "", baseUrl) : void 0;
	if (options === null || options === void 0 ? void 0 : options.workerUrl) {
		candidates.push({
			label: "custom libarchive Worker",
			workerUrl: resolveFileViewerArchiveWorkerUrl(options, baseUrl),
			wasmUrl
		});
		return candidates;
	}
	const publicWorkerUrl = resolveFileViewerArchiveWorkerUrl(void 0, baseUrl);
	if (await probeWorkerUrl(publicWorkerUrl)) candidates.push({
		label: "static libarchive Worker",
		workerUrl: publicWorkerUrl,
		wasmUrl
	});
	return candidates;
};
var renderNestedWithCurrentOptions = async (buffer, type, target, context) => {
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const renderer = (await createNestedRendererRegistry(context)).getByExtension(type);
	if (!(renderer === null || renderer === void 0 ? void 0 : renderer.load)) {
		target.textContent = t("archive.error.nestedUnsupported", { type });
		return;
	}
	return createNestedRenderedInstance(target, await renderer.load({
		source: normalizeSource({
			buffer,
			filename: (context === null || context === void 0 ? void 0 : context.filename) || `preview.${type}`,
			type,
			url: context === null || context === void 0 ? void 0 : context.url
		}),
		surface: { container: target },
		options: (context === null || context === void 0 ? void 0 : context.options) || {},
		registerExportAdapter: context === null || context === void 0 ? void 0 : context.registerExportAdapter,
		renderContext: {
			...context,
			renderNestedBuffer: (context === null || context === void 0 ? void 0 : context.renderNestedBuffer) || renderNestedWithCurrentOptions
		}
	}));
};
var renderNestedEntry = (buffer, type, target, context) => {
	return ((context === null || context === void 0 ? void 0 : context.renderNestedBuffer) || renderNestedWithCurrentOptions)(buffer, type, target, {
		...context,
		renderNestedBuffer: (context === null || context === void 0 ? void 0 : context.renderNestedBuffer) || renderNestedWithCurrentOptions
	});
};
async function renderArchive(buffer, target, _type, context) {
	var _a, _b, _c;
	const documentRef = target.ownerDocument;
	const targetWindow = documentRef.defaultView || null;
	const archiveOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.archive;
	const filename = (context === null || context === void 0 ? void 0 : context.filename) || "archive.bin";
	const sourceExtension = (_type || getArchiveEntryExtension(filename)).toLowerCase();
	const maxArchiveSize = (archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.maxArchiveSize) || DEFAULT_MAX_ARCHIVE_SIZE;
	const maxEntryPreviewSize = (archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.maxEntryPreviewSize) || DEFAULT_MAX_ENTRY_PREVIEW_SIZE;
	const cacheEnabled = (archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.cache) !== false;
	const workerTimeoutMs = (archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.workerTimeoutMs) || DEFAULT_WORKER_TIMEOUT_MS;
	const hasLegacyGbkZipFilenames = hasLikelyGbkZipFilenames(buffer, filename);
	const objectUrls = [];
	const cleanups = [];
	let archiveReader = null;
	let entries = [];
	let selectedEntry = null;
	let nestedRendered;
	let loading = false;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	let loadingText = t("archive.loading.readingDirectory");
	let loadingHint = t("archive.loading.readingDirectoryHint");
	let errorText = "";
	let archiveNotice = "";
	let encrypted = null;
	let filterText = "";
	let passwordAttempt = 0;
	let passwordResolver = null;
	let sidebarCollapsed = false;
	let previewSequence = 0;
	const style = createStyle(documentRef);
	const root = createElement(documentRef, "section", "archive-shell archive-viewer");
	root.dataset.viewerDensity = normalizeFileViewerUiDensity((_c = (_b = context === null || context === void 0 ? void 0 : context.options) === null || _b === void 0 ? void 0 : _b.ui) === null || _c === void 0 ? void 0 : _c.density);
	const sidebar = createElement(documentRef, "aside", "archive-sidebar");
	const head = createElement(documentRef, "div", "archive-head");
	const headMain = createElement(documentRef, "div", "archive-head-main");
	const badge = createElement(documentRef, "span", void 0, "ARCHIVE");
	const title = createElement(documentRef, "strong", void 0, filename);
	title.title = filename;
	const stats = createElement(documentRef, "p");
	stats.setAttribute("role", "status");
	stats.setAttribute("aria-live", "polite");
	const sidebarHideButton = createElement(documentRef, "button", "archive-sidebar-toggle");
	sidebarHideButton.type = "button";
	headMain.append(badge, title, stats);
	head.append(headMain, sidebarHideButton);
	const warning = createElement(documentRef, "div", "archive-warning");
	const info = createElement(documentRef, "div", "archive-info");
	const search = createElement(documentRef, "input", "archive-search");
	search.type = "search";
	search.placeholder = t("archive.search.placeholder");
	const list = createElement(documentRef, "div", "archive-list");
	list.setAttribute("role", "list");
	sidebar.append(head, warning, info, search, list);
	const preview = createElement(documentRef, "main", "archive-preview");
	const toolbar = createElement(documentRef, "div", "archive-preview-toolbar");
	const sidebarShowButton = createElement(documentRef, "button", "archive-sidebar-toggle");
	sidebarShowButton.type = "button";
	const toolbarTitle = createElement(documentRef, "div", "archive-preview-title");
	toolbarTitle.append(createElement(documentRef, "span", void 0, t("archive.preview.title")), createElement(documentRef, "strong", void 0, t("archive.preview.chooseFile")));
	const downloadButton = createElement(documentRef, "button", "archive-download-button", t("archive.preview.downloadFile"));
	downloadButton.type = "button";
	const nestedTarget = createElement(documentRef, "div", "archive-nested-target");
	const comicBook = createComicBookController({
		document: documentRef,
		extension: sourceExtension,
		root,
		stage: nestedTarget,
		previousLabel: t("epub.previousPage"),
		nextLabel: t("epub.nextPage"),
		getEntries: () => entries,
		openEntry: (entry) => void previewEntry(entry)
	});
	badge.textContent = comicBook.badge;
	toolbar.append(sidebarShowButton, toolbarTitle, ...comicBook.toolbarElements, downloadButton);
	preview.append(toolbar, nestedTarget);
	root.append(sidebar, preview);
	const state = createElement(documentRef, "div", "archive-state");
	const stateContent = createElement(documentRef, "div");
	const spinner = createElement(documentRef, "span", "archive-spinner");
	const stateCopy = createElement(documentRef, "div");
	const stateTitle = createElement(documentRef, "strong", void 0, loadingText);
	const stateHint = createElement(documentRef, "p", void 0, loadingHint);
	stateCopy.append(stateTitle, stateHint);
	stateContent.append(spinner, stateCopy);
	state.append(stateContent);
	root.append(state);
	const error = createElement(documentRef, "div", "archive-error");
	const errorTitle = createElement(documentRef, "strong", void 0, t("archive.error.title"));
	const errorMessage = createElement(documentRef, "p");
	error.append(errorTitle, errorMessage);
	root.append(error);
	const passwordDialog = createElement(documentRef, "div", "archive-password-dialog archive-hidden");
	passwordDialog.setAttribute("role", "dialog");
	passwordDialog.setAttribute("aria-modal", "true");
	const passwordCard = createElement(documentRef, "form", "archive-password-card");
	const passwordTitle = createElement(documentRef, "h3", void 0, t("archive.password.title"));
	const passwordDescription = createElement(documentRef, "p", void 0, t("archive.password.description"));
	const passwordInput = createElement(documentRef, "input");
	passwordInput.type = "password";
	passwordInput.autocomplete = "current-password";
	passwordInput.placeholder = t("archive.password.placeholder");
	const passwordError = createElement(documentRef, "p", "archive-password-error");
	const passwordActions = createElement(documentRef, "div", "archive-password-actions");
	const passwordCancelButton = createElement(documentRef, "button", "archive-password-cancel", t("archive.password.cancel"));
	passwordCancelButton.type = "button";
	const passwordSubmitButton = createElement(documentRef, "button", "archive-password-submit", t("archive.password.confirm"));
	passwordSubmitButton.type = "submit";
	passwordActions.append(passwordCancelButton, passwordSubmitButton);
	passwordCard.append(passwordTitle, passwordDescription, passwordInput, passwordError, passwordActions);
	passwordDialog.append(passwordCard);
	root.append(passwordDialog);
	target.replaceChildren(style, root);
	const listen = (element, event, listener) => {
		element.addEventListener(event, listener);
		cleanups.push(() => element.removeEventListener(event, listener));
	};
	const closePasswordDialog = (password) => {
		passwordDialog.classList.add("archive-hidden");
		const resolve = passwordResolver;
		passwordResolver = null;
		resolve === null || resolve === void 0 || resolve(password);
	};
	const requestPasswordWithDialog = async (reason, previousError) => {
		const wasLoading = loading;
		if (wasLoading) {
			loading = false;
			syncState();
			renderEmptyState();
		}
		passwordDescription.textContent = t("archive.password.description");
		passwordError.textContent = previousError || reason === "invalid-password" ? t("archive.password.invalid") : "";
		passwordInput.value = "";
		passwordDialog.classList.remove("archive-hidden");
		targetWindow === null || targetWindow === void 0 || targetWindow.setTimeout(() => passwordInput.focus(), 0);
		return new Promise((resolve) => {
			passwordResolver = (password) => {
				if (wasLoading && password !== null) {
					loading = true;
					syncState();
					renderEmptyState();
				}
				resolve(password);
			};
		});
	};
	const requestArchivePassword = async (reason, entry, previousError) => {
		passwordAttempt += 1;
		const contextPayload = {
			filename,
			entryName: entry === null || entry === void 0 ? void 0 : entry.name,
			attempt: passwordAttempt,
			reason,
			error: previousError
		};
		if ((archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.password) && passwordAttempt === 1 && !previousError) return archiveOptions.password;
		if (archiveOptions === null || archiveOptions === void 0 ? void 0 : archiveOptions.requestPassword) {
			const customPassword = await archiveOptions.requestPassword(contextPayload);
			return customPassword !== null && customPassword !== void 0 ? customPassword : null;
		}
		return requestPasswordWithDialog(reason, previousError);
	};
	const applyArchivePassword = async (password) => {
		var _a;
		await ((_a = archiveReader === null || archiveReader === void 0 ? void 0 : archiveReader.usePassword) === null || _a === void 0 ? void 0 : _a.call(archiveReader, password));
	};
	const requestAndApplyPassword = async (reason, entry, previousError) => {
		const password = await requestArchivePassword(reason, entry, previousError);
		if (password === null) throw new ArchivePasswordCancelledError(t("archive.error.passwordRequired"));
		await applyArchivePassword(password);
	};
	listen(passwordCard, "submit", (event) => {
		event.preventDefault();
		const password = passwordInput.value;
		if (!password) {
			passwordError.textContent = t("archive.password.required");
			passwordInput.focus();
			return;
		}
		closePasswordDialog(password);
	});
	listen(passwordCancelButton, "click", () => {
		closePasswordDialog(null);
	});
	listen(passwordDialog, "keydown", (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			closePasswordDialog(null);
		}
	});
	listen(sidebarHideButton, "click", () => {
		sidebarCollapsed = true;
		syncState();
	});
	listen(sidebarShowButton, "click", () => {
		sidebarCollapsed = !sidebarCollapsed;
		syncState();
	});
	const getArchiveStats = () => {
		const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
		const previewableCount = entries.filter((entry) => entry.previewable).length;
		return {
			count: entries.length,
			totalSize,
			previewableCount
		};
	};
	const getFilteredEntries = () => {
		const keyword = filterText.trim().toLowerCase();
		const visibleEntries = comicBook.getVisibleEntries(entries);
		return (keyword ? visibleEntries.filter((entry) => entry.path.toLowerCase().includes(keyword)) : visibleEntries).slice(0, MAX_LISTED_ENTRIES);
	};
	const clearNestedPreview = async () => {
		await disposeFileViewerRendered(nestedRendered);
		nestedRendered = void 0;
		nestedTarget.replaceChildren();
	};
	const closeArchive = async () => {
		var _a;
		await ((_a = archiveReader === null || archiveReader === void 0 ? void 0 : archiveReader.close) === null || _a === void 0 ? void 0 : _a.call(archiveReader));
		archiveReader = null;
	};
	const syncSidebarToggleState = () => {
		const showLabel = t("archive.sidebar.show");
		const hideLabel = t("archive.sidebar.hide");
		const activeLabel = sidebarCollapsed ? showLabel : hideLabel;
		root.classList.toggle("archive-sidebar-collapsed", sidebarCollapsed);
		sidebarHideButton.textContent = "‹";
		sidebarShowButton.textContent = sidebarCollapsed ? "☰" : "‹";
		sidebarHideButton.title = hideLabel;
		sidebarShowButton.title = activeLabel;
		sidebarHideButton.setAttribute("aria-label", hideLabel);
		sidebarShowButton.setAttribute("aria-label", activeLabel);
		sidebarHideButton.setAttribute("aria-expanded", String(!sidebarCollapsed));
		sidebarShowButton.setAttribute("aria-expanded", String(!sidebarCollapsed));
	};
	const syncState = () => {
		const archiveStats = getArchiveStats();
		const statsText = t("archive.stats.summary", {
			count: archiveStats.count,
			size: formatArchiveBytes(archiveStats.totalSize),
			previewable: archiveStats.previewableCount
		});
		stats.textContent = statsText;
		stats.title = statsText;
		stats.setAttribute("aria-label", statsText);
		warning.textContent = t("archive.warning.encrypted");
		warning.classList.toggle("archive-hidden", !encrypted);
		info.textContent = archiveNotice;
		info.classList.toggle("archive-hidden", !archiveNotice);
		state.classList.toggle("archive-hidden", !loading);
		stateTitle.textContent = loadingText;
		stateHint.textContent = loadingHint;
		error.classList.toggle("archive-hidden", !errorText);
		errorMessage.textContent = errorText;
		const downloadAllowed = selectedEntry ? isArchiveEntryDownloadAllowed(selectedEntry, archiveOptions) : false;
		downloadButton.hidden = !downloadAllowed;
		downloadButton.disabled = !downloadAllowed;
		const activeTitle = toolbarTitle.querySelector("strong");
		if (activeTitle) {
			activeTitle.textContent = (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.name) || t("archive.preview.chooseFile");
			activeTitle.setAttribute("title", (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.path) || (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.name) || "");
		}
		comicBook.sync();
		syncSidebarToggleState();
	};
	const renderEmptyState = () => {
		if (selectedEntry || loading || nestedTarget.childElementCount) return;
		const empty = createElement(documentRef, "div", "archive-empty");
		empty.append(createElement(documentRef, "strong", void 0, t("archive.empty.title")), createElement(documentRef, "p", void 0, t("archive.empty.message")));
		nestedTarget.replaceChildren(empty);
	};
	const renderEntryList = () => {
		list.replaceChildren();
		getFilteredEntries().forEach((entry) => {
			const button = createElement(documentRef, "button", "archive-entry");
			button.type = "button";
			button.style.setProperty("--entry-depth", String(entry.depth));
			button.classList.toggle("active", (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.id) === entry.id);
			const icon = createElement(documentRef, "span", "entry-ext", entry.extension || "file");
			icon.title = entry.extension || "file";
			const copy = createElement(documentRef, "span", "entry-copy");
			const nameNode = createElement(documentRef, "strong", void 0, entry.name);
			const pathNode = createElement(documentRef, "em", void 0, entry.path);
			const sizeText = formatArchiveBytes(entry.size);
			const sizeNode = createElement(documentRef, "small", void 0, sizeText);
			nameNode.title = entry.name;
			pathNode.title = entry.path;
			sizeNode.title = sizeText;
			button.title = entry.path;
			copy.append(nameNode, pathNode);
			button.append(icon, copy, sizeNode);
			button.addEventListener("click", () => {
				previewEntry(entry);
			});
			list.append(button);
		});
	};
	const setLoading = (next, text, hint) => {
		loading = next;
		if (text) loadingText = text;
		if (hint) loadingHint = hint;
		syncState();
		renderEmptyState();
	};
	const setError = (message) => {
		errorText = message;
		syncState();
	};
	const terminateWorkers = (workers) => {
		workers.forEach((worker) => worker.terminate());
		workers.length = 0;
	};
	const readArchiveDirectoryWithPassword = async (archive, candidate) => {
		for (;;) try {
			return await withTimeout(archive.getFilesObject(), workerTimeoutMs, t("archive.error.candidateReadTimeout", { label: candidate.label }), targetWindow);
		} catch (reason) {
			if (!encrypted && !isArchivePasswordError(reason)) throw reason;
			await requestAndApplyPassword(encrypted ? "invalid-password" : "read-failed", void 0, reason);
		}
	};
	const tryOpenArchiveWithWorker = async (Archive, candidate) => {
		const createdWorkers = [];
		const workerUrl = await prepareWorkerUrl(candidate, objectUrls);
		const WorkerCtor = getWorkerConstructor(documentRef);
		try {
			Archive.init({ getWorker: () => {
				const worker = new WorkerCtor(workerUrl, { type: "module" });
				createdWorkers.push(worker);
				return worker;
			} });
			setLoading(true, t("archive.loading.initializingCandidate", { label: candidate.label }), t("archive.loading.initializingCandidateHint"));
			const archiveFile = createArchiveFile(documentRef, buffer, filename);
			const archive = await withTimeout(Archive.open(archiveFile), workerTimeoutMs, t("archive.error.candidateInitTimeout", { label: candidate.label }), targetWindow);
			archiveReader = archive;
			if (hasLegacyGbkZipFilenames && typeof archive.setLocale === "function") await archive.setLocale("zh_CN.GBK").catch(() => void 0);
			encrypted = await withTimeout(archive.hasEncryptedData(), workerTimeoutMs, t("archive.error.encryptedCheckTimeout", { label: candidate.label }), targetWindow).catch(() => null);
			if (encrypted) await requestAndApplyPassword("encrypted");
			setLoading(true, t("archive.loading.readingDirectory"), t("archive.loading.directoryReadyHint"));
			const fileTree = await readArchiveDirectoryWithPassword(archive, candidate);
			entries = comicBook.sortEntries(flattenArchiveObject(fileTree));
			syncState();
			renderEntryList();
			renderEmptyState();
			comicBook.onEntriesReady();
			return true;
		} catch (reason) {
			if (!archiveReader) terminateWorkers(createdWorkers);
			throw reason;
		}
	};
	const tryOpenArchiveWithFallback = async (options = {}) => {
		const showWorkerFallbackNotice = options.showWorkerFallbackNotice !== false;
		setLoading(true, showWorkerFallbackNotice ? t("archive.loading.workerFallback") : t("archive.loading.readingDirectory"), showWorkerFallbackNotice ? t("archive.loading.workerFallbackHint") : t("archive.loading.directoryReadyHint"));
		const fallbackEntries = await loadArchiveEntriesWithoutWorker(buffer, filename);
		if (!fallbackEntries) return false;
		entries = comicBook.sortEntries(fallbackEntries);
		encrypted = null;
		archiveNotice = showWorkerFallbackNotice ? t("archive.notice.workerFallback") : "";
		syncState();
		renderEntryList();
		renderEmptyState();
		comicBook.onEntriesReady();
		return true;
	};
	const openArchive = async () => {
		if (buffer.byteLength > maxArchiveSize) {
			setError(t("archive.error.tooLarge", {
				size: formatArchiveBytes(buffer.byteLength),
				limit: formatArchiveBytes(maxArchiveSize)
			}));
			return;
		}
		setLoading(true, t("archive.loading.initializingWorker"), t("archive.loading.initializingWorkerHint"));
		setError("");
		archiveNotice = "";
		try {
			if (hasLegacyGbkZipFilenames && !isLikelyEncryptedArchive(buffer, filename)) {
				if (await tryOpenArchiveWithFallback({ showWorkerFallbackNotice: false })) return;
			}
			const [{ Archive }, candidates] = await Promise.all([import("./libarchive-DMKyjLjH.js"), resolveWorkerCandidates(documentRef, archiveOptions)]);
			const errors = [];
			for (const candidate of candidates) try {
				await closeArchive();
				await tryOpenArchiveWithWorker(Archive, candidate);
				return;
			} catch (reason) {
				if (reason instanceof ArchivePasswordCancelledError) throw reason;
				errors.push(`${candidate.label}: ${normalizeWorkerError(reason)}`);
			}
			await closeArchive();
			if (isLikelyEncryptedArchive(buffer, filename)) {
				encrypted = true;
				syncState();
				throw new Error(t("archive.error.encryptedRequiresWorker"));
			}
			if (await tryOpenArchiveWithFallback()) return;
			throw new Error(errors.join("; ") || t("archive.error.workerInitFailed"));
		} catch (nextError) {
			console.error(nextError);
			setError(nextError instanceof Error ? nextError.message : String(nextError));
		} finally {
			setLoading(false);
		}
	};
	const renderEntryBuffer = async (entry, entryBuffer, requestId) => {
		await clearNestedPreview();
		if (requestId !== previewSequence) return;
		const child = createElement(documentRef, "div", "archive-nested-content");
		nestedTarget.append(child);
		const nestedContext = buildArchiveNestedRenderContext(context, entry, archiveOptions);
		const rendered = await renderNestedEntry(entryBuffer, entry.extension, child, nestedContext);
		if (requestId !== previewSequence) {
			await disposeFileViewerRendered(rendered);
			child.remove();
			return;
		}
		nestedRendered = rendered;
	};
	const extractEntryBuffer = async (entry) => {
		const cacheKey = createArchiveCacheKey(filename, buffer.byteLength, entry);
		if (cacheEnabled) {
			const cached = await readArchiveCache(cacheKey);
			if (cached) return cached.buffer;
		}
		let file;
		for (;;) try {
			file = await entry.compressedFile.extract();
			break;
		} catch (reason) {
			if (!archiveReader || !isArchivePasswordError(reason)) throw reason;
			encrypted = true;
			syncState();
			await requestAndApplyPassword("extract-failed", entry, reason);
		}
		const entryBuffer = await file.arrayBuffer();
		if (cacheEnabled) await writeArchiveCache({
			key: cacheKey,
			filename: entry.name,
			size: entryBuffer.byteLength,
			updatedAt: Date.now(),
			buffer: entryBuffer
		});
		return entryBuffer;
	};
	async function previewEntry(entry) {
		const requestId = ++previewSequence;
		selectedEntry = entry;
		comicBook.onEntrySelected(entry);
		renderEntryList();
		syncState();
		const shapefileEntries = getShapefileBundleEntries(entries, entry);
		const previewSize = shapefileEntries.length ? shapefileEntries.reduce((sum, component) => sum + component.size, 0) : entry.size;
		if (previewSize > maxEntryPreviewSize) {
			setError(t("archive.error.entryTooLarge", {
				name: entry.name,
				size: formatArchiveBytes(previewSize),
				limit: formatArchiveBytes(maxEntryPreviewSize)
			}));
			return;
		}
		setLoading(true, t("archive.loading.extracting", { name: entry.name }));
		setError("");
		try {
			const entryBuffer = shapefileEntries.length ? await createShapefileBundleArchive(shapefileEntries, extractEntryBuffer) : await extractEntryBuffer(entry);
			if (requestId !== previewSequence) return;
			setLoading(true, t("archive.loading.rendering", { name: entry.name }));
			await renderEntryBuffer(entry, entryBuffer, requestId);
		} catch (nextError) {
			if (requestId === previewSequence) {
				console.error(nextError);
				setError(nextError instanceof Error ? nextError.message : String(nextError));
			}
		} finally {
			if (requestId === previewSequence) setLoading(false);
		}
	}
	const downloadEntry = async (entry) => {
		setLoading(true, t("archive.loading.exporting", { name: entry.name }));
		try {
			const entryBuffer = await extractEntryBuffer(entry);
			const url = URL.createObjectURL(new Blob([entryBuffer]));
			objectUrls.push(url);
			const link = documentRef.createElement("a");
			link.href = url;
			link.download = entry.name;
			documentRef.body.append(link);
			link.click();
			link.remove();
		} finally {
			setLoading(false);
		}
	};
	listen(search, "input", () => {
		filterText = search.value;
		renderEntryList();
	});
	listen(downloadButton, "click", () => {
		if (selectedEntry && isArchiveEntryDownloadAllowed(selectedEntry, archiveOptions)) downloadEntry(selectedEntry);
	});
	syncState();
	renderEmptyState();
	openArchive();
	return {
		$el: root,
		async unmount() {
			closePasswordDialog(null);
			comicBook.dispose();
			cleanups.splice(0).forEach((cleanup) => cleanup());
			await clearNestedPreview();
			await closeArchive();
			objectUrls.forEach((url) => URL.revokeObjectURL(url));
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderArchive as default };
