import { g as normalizeChmPath, h as decodeChmText, m as assertChmSvgSourceSafety, p as MAX_CHM_TOPIC_RESOURCE_PATHS, t as ChmWorkerClient, u as MAX_CHM_CSS_RESOURCE_PATHS, v as sanitizeChmCss, y as sanitizeChmHtmlDocument } from "./workerClient-BH8s3f4M.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/style.js
var chmViewerStyle = `
.chm-viewer{position:relative;width:100%;height:100%;min-height:480px;display:flex;flex-direction:column;overflow:hidden;background:#edf2f6;color:#182233;font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box}
.chm-viewer *{box-sizing:border-box}
.chm-header{min-height:62px;display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(24,34,51,.1);background:rgba(255,255,255,.94)}
.chm-sidebar-toggle{display:none;width:36px;height:36px;border:0;border-radius:10px;background:#e8f3ee;color:#08785c;font:inherit;font-size:19px;cursor:pointer}
.chm-heading{min-width:0;flex:1}.chm-heading h2{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px;line-height:1.35}.chm-heading p{margin:2px 0 0;color:#667085;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chm-badges{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}.chm-badge{padding:4px 8px;border-radius:999px;background:#e8f3ee;color:#08785c;font-size:11px;font-weight:750}.chm-badge.is-muted{background:#eef1f4;color:#596579}
.chm-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(230px,300px) minmax(0,1fr)}
.chm-sidebar{min-height:0;display:flex;flex-direction:column;border-right:1px solid rgba(24,34,51,.1);background:#f8fafb}
.chm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:8px;border-bottom:1px solid rgba(24,34,51,.08)}
.chm-tab{height:34px;border:0;border-radius:8px;background:transparent;color:#647084;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.chm-tab:hover{background:#eef3f5}.chm-tab.is-active{background:#fff;color:#08785c;box-shadow:0 1px 5px rgba(24,34,51,.12)}
.chm-sidebar-panels{flex:1;min-height:0;position:relative}.chm-panel{position:absolute;inset:0;overflow:auto;padding:8px}.chm-panel[hidden]{display:none}
.chm-navigation,.chm-navigation ul{margin:0;padding:0;list-style:none}.chm-navigation ul{padding-left:14px;border-left:1px solid rgba(24,34,51,.09)}
.chm-nav-button,.chm-search-result{width:100%;display:block;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.chm-nav-button{min-height:32px;padding:6px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-nav-button:hover,.chm-nav-button.is-active{background:#e7f3ee;color:#08785c}.chm-nav-label{min-height:28px;padding:5px 8px;color:#526073;font-weight:650}
.chm-panel-note{margin:10px;padding:9px 10px;border-radius:8px;background:#fff6df;color:#845a00;font-size:12px}
.chm-search-box{position:sticky;top:-8px;z-index:1;padding:8px 2px;background:#f8fafb}.chm-search-box input{width:100%;height:36px;padding:0 11px;border:1px solid rgba(24,34,51,.16);border-radius:9px;background:#fff;color:inherit;font:inherit;outline:none}.chm-search-box input:focus{border-color:#0a8b68;box-shadow:0 0 0 3px rgba(10,139,104,.12)}
.chm-search-meta{margin:7px 4px;color:#6b7688;font-size:11px}.chm-search-results{display:flex;flex-direction:column;gap:5px}.chm-search-result{padding:9px;background:#fff;border:1px solid rgba(24,34,51,.08)}.chm-search-result:hover{border-color:rgba(10,139,104,.35);box-shadow:0 5px 16px rgba(24,34,51,.07)}.chm-search-result strong,.chm-search-result span{display:block}.chm-search-result strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-search-result span{margin-top:3px;color:#677386;font-size:11px;line-height:1.4}.chm-search-result mark{background:#fff1a6;color:inherit}
.chm-topic{min-width:0;min-height:0;display:flex;flex-direction:column;background:#dfe5ea}.chm-topic-bar{min-height:42px;display:flex;align-items:center;gap:8px;padding:7px 12px;background:rgba(255,255,255,.88);border-bottom:1px solid rgba(24,34,51,.08)}.chm-topic-bar strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-topic-path{margin-left:auto;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6b7688;font-size:11px}
.chm-topic-frame{display:block;flex:1;min-height:0;width:100%;border:0;background:#fff}
.chm-state{position:absolute;inset:62px 0 0;z-index:6;display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(237,242,246,.88);backdrop-filter:blur(2px)}.chm-state[hidden]{display:none}.chm-spinner{width:32px;height:32px;border:3px solid rgba(8,120,92,.16);border-top-color:#08785c;border-radius:999px;animation:chm-spin .85s linear infinite}.chm-state p{margin:0;color:#435168;font-weight:650}
.chm-error{position:absolute;inset:82px 18px auto;z-index:8;width:min(560px,calc(100% - 36px));margin:auto;padding:16px;border:1px solid rgba(190,91,0,.22);border-radius:14px;background:#fff8e9;color:#743f00;box-shadow:0 18px 48px rgba(24,34,51,.18)}.chm-error[hidden]{display:none}.chm-error strong{display:block;font-size:15px}.chm-error p{margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
@keyframes chm-spin{to{transform:rotate(360deg)}}
[data-viewer-theme=dark] .chm-viewer{background:#111827;color:#e6edf6}[data-viewer-theme=dark] .chm-header,[data-viewer-theme=dark] .chm-topic-bar{background:#151d2b;border-color:rgba(148,163,184,.18)}[data-viewer-theme=dark] .chm-heading p,[data-viewer-theme=dark] .chm-topic-path{color:#94a3b8}[data-viewer-theme=dark] .chm-sidebar,[data-viewer-theme=dark] .chm-search-box{background:#121a27;border-color:rgba(148,163,184,.18)}[data-viewer-theme=dark] .chm-tab.is-active,[data-viewer-theme=dark] .chm-search-result,[data-viewer-theme=dark] .chm-search-box input{background:#1c2635;color:#e6edf6}[data-viewer-theme=dark] .chm-topic{background:#0b1019}[data-viewer-theme=dark] .chm-state{background:rgba(17,24,39,.88);color:#dbe5f1}
@media(prefers-color-scheme:dark){[data-viewer-theme=system] .chm-viewer{background:#111827;color:#e6edf6}[data-viewer-theme=system] .chm-header,[data-viewer-theme=system] .chm-topic-bar{background:#151d2b;border-color:rgba(148,163,184,.18)}[data-viewer-theme=system] .chm-heading p,[data-viewer-theme=system] .chm-topic-path{color:#94a3b8}[data-viewer-theme=system] .chm-sidebar,[data-viewer-theme=system] .chm-search-box{background:#121a27;border-color:rgba(148,163,184,.18)}[data-viewer-theme=system] .chm-tab.is-active,[data-viewer-theme=system] .chm-search-result,[data-viewer-theme=system] .chm-search-box input{background:#1c2635;color:#e6edf6}[data-viewer-theme=system] .chm-topic{background:#0b1019}[data-viewer-theme=system] .chm-state{background:rgba(17,24,39,.88);color:#dbe5f1}}
@media(max-width:760px){.chm-sidebar-toggle{display:inline-flex;align-items:center;justify-content:center}.chm-body{grid-template-columns:1fr}.chm-sidebar{position:absolute;z-index:5;top:62px;bottom:0;left:0;width:min(88vw,310px);box-shadow:16px 0 36px rgba(24,34,51,.18);transform:translateX(-105%);transition:transform .2s ease}.chm-viewer.is-sidebar-open .chm-sidebar{transform:translateX(0)}.chm-badges .chm-badge.is-muted{display:none}.chm-topic-path{display:none}}
`;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/chm.js
var MAX_RENDERED_NAVIGATION_ITEMS = 12e3;
var MAX_LOADED_RESOURCE_PATHS = 4096;
var HTML_EXTENSIONS = /* @__PURE__ */ new Set([
	"htm",
	"html",
	"xhtml",
	"shtml"
]);
var messages = {
	"zh-CN": {
		contents: "目录",
		index: "索引",
		search: "搜索",
		searchPlaceholder: "搜索主题和正文",
		loading: "正在打开 CHM…",
		wasm: "正在加载本地 WASM…",
		directory: "正在读取 CHM 目录…",
		manifest: "正在构建帮助目录…",
		searching: "正在搜索…",
		noContents: "没有可显示的目录。",
		noIndex: "没有可显示的关键词索引。",
		searchHint: "输入至少两个字符搜索当前 CHM。",
		noResults: "没有找到匹配内容。",
		truncated: "结果已按安全与性能上限截断。",
		error: "CHM 预览失败",
		topics: "个主题",
		ready: "离线安全预览",
		binaryToc: "二进制目录",
		fullText: "全文索引",
		menu: "目录",
		opening: "正在打开主题…",
		unavailable: "没有找到可打开的主题。"
	},
	"en-US": {
		contents: "Contents",
		index: "Index",
		search: "Search",
		searchPlaceholder: "Search topics and text",
		loading: "Opening CHM…",
		wasm: "Loading local WASM…",
		directory: "Reading the CHM directory…",
		manifest: "Building help navigation…",
		searching: "Searching…",
		noContents: "No table of contents is available.",
		noIndex: "No keyword index is available.",
		searchHint: "Enter at least two characters to search this CHM.",
		noResults: "No matching content was found.",
		truncated: "Results were truncated at the configured safety limit.",
		error: "CHM preview failed",
		topics: "topics",
		ready: "Safe offline preview",
		binaryToc: "Binary TOC",
		fullText: "Full-text index",
		menu: "Menu",
		opening: "Opening topic…",
		unavailable: "No readable topic was found."
	}
};
var resolveLocale = (context) => {
	var _a;
	const configured = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.locale;
	return (configured && configured !== "auto" ? configured : typeof navigator === "undefined" ? "en-US" : navigator.language).toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
};
var createElement = (tag, className, text) => {
	const element = document.createElement(tag);
	if (className) element.className = className;
	if (text != null) element.textContent = text;
	return element;
};
var extensionOf = (path) => {
	const filename = path.split("/").pop() || "";
	const index = filename.lastIndexOf(".");
	return index >= 0 ? filename.slice(index + 1).toLowerCase() : "";
};
var mimeTypeForPath = (path) => {
	return {
		css: "text/css;charset=utf-8",
		gif: "image/gif",
		jpeg: "image/jpeg",
		jpg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		avif: "image/avif",
		bmp: "image/bmp",
		ico: "image/x-icon",
		svg: "image/svg+xml",
		mp3: "audio/mpeg",
		wav: "audio/wav",
		ogg: "audio/ogg",
		mp4: "video/mp4",
		webm: "video/webm",
		woff: "font/woff",
		woff2: "font/woff2",
		ttf: "font/ttf",
		otf: "font/otf"
	}[extensionOf(path)] || "application/octet-stream";
};
var sanitizeEmbeddedSvgCss = (value) => sanitizeChmCss(value, "/", 0).css;
var sanitizeSvg = (source) => {
	assertChmSvgSourceSafety(source);
	const document = new DOMParser().parseFromString(source, "image/svg+xml");
	if (document.querySelector("parsererror")) return "";
	document.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((element) => element.remove());
	document.querySelectorAll("style").forEach((style) => {
		style.textContent = sanitizeEmbeddedSvgCss(style.textContent || "");
	});
	document.querySelectorAll("*").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			const value = attribute.value.trim();
			if (name.startsWith("on")) {
				element.removeAttribute(attribute.name);
				continue;
			}
			if ((name === "href" || name === "xlink:href") && !value.startsWith("#") && !/^data:image\/(?:avif|bmp|gif|jpeg|png|webp);/i.test(value)) {
				element.removeAttribute(attribute.name);
				continue;
			}
			if (name !== "href" && name !== "xlink:href" && /(?:url\s*\(|@import\b|expression\s*\(|behavior\s*:|-moz-binding|\\|\/\*)/i.test(value)) element.setAttribute(attribute.name, sanitizeEmbeddedSvgCss(value));
		}
	});
	return new XMLSerializer().serializeToString(document.documentElement);
};
var INTERNAL_CSS_RESOURCE_PATTERN = /url\("chm-internal:([^"]+)"\)/g;
var loadResourceMap = async (paths, loadResource, ancestry, maxResourcePaths = MAX_CHM_CSS_RESOURCE_PATHS) => {
	const uniquePaths = Array.from(new Set(paths)).slice(0, maxResourcePaths);
	const replacements = /* @__PURE__ */ new Map();
	let cursor = 0;
	const runners = Array.from({ length: Math.min(8, uniquePaths.length) }, async () => {
		while (cursor < uniquePaths.length) {
			const path = uniquePaths[cursor++];
			const normalized = normalizeChmPath(path);
			const url = normalized && normalized !== "/" ? await loadResource(normalized, ancestry) : null;
			if (normalized) replacements.set(normalized.toLocaleLowerCase(), url || "");
		}
	});
	await Promise.all(runners);
	return replacements;
};
var replaceInternalCssResourceUrls = (css, replacements) => css.replace(INTERNAL_CSS_RESOURCE_PATTERN, (_match, encoded) => {
	let path = "";
	try {
		path = decodeURIComponent(encoded);
	} catch {
		return "url(\"\")";
	}
	const normalized = normalizeChmPath(path);
	return `url("${normalized ? replacements.get(normalized.toLocaleLowerCase()) || "" : ""}")`;
});
var replaceCssResourceUrls = async (css, resourcePaths, loadResource, ancestry) => replaceInternalCssResourceUrls(css, await loadResourceMap(resourcePaths, loadResource, ancestry));
var flatNavigation = (nodes) => {
	const output = [];
	const stack = nodes.slice().reverse().map((node) => ({
		node,
		depth: 0
	}));
	while (stack.length && output.length < MAX_RENDERED_NAVIGATION_ITEMS) {
		const current = stack.pop();
		if (!current) continue;
		output.push(current);
		for (let index = current.node.children.length - 1; index >= 0; index -= 1) stack.push({
			node: current.node.children[index],
			depth: current.depth + 1
		});
	}
	return output;
};
var highlightSnippet = (target, text, query) => {
	const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
	if (index < 0) {
		target.textContent = text;
		return;
	}
	target.append(document.createTextNode(text.slice(0, index)), createElement("mark", void 0, text.slice(index, index + query.length)), document.createTextNode(text.slice(index + query.length)));
};
async function renderChm(buffer, target, _type, context) {
	var _a, _b, _c, _d;
	const locale = resolveLocale(context);
	const t = (key) => messages[locale][key];
	const options = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.chm;
	const abortController = new AbortController();
	const objectUrls = /* @__PURE__ */ new Set();
	const resourceUrls = /* @__PURE__ */ new Map();
	const listeners = [];
	let client;
	let destroyed = false;
	let manifest;
	let entries = [];
	let entryLookup = /* @__PURE__ */ new Map();
	let currentHtml = "";
	let topicGeneration = 0;
	let searchGeneration = 0;
	let searchTimer;
	const style = createElement("style");
	style.textContent = chmViewerStyle;
	const root = createElement("section", "chm-viewer");
	root.dataset.chmReady = "false";
	const theme = ((_b = context === null || context === void 0 ? void 0 : context.options) === null || _b === void 0 ? void 0 : _b.theme) || "light";
	target.dataset.viewerTheme = theme;
	const header = createElement("header", "chm-header");
	const sidebarToggle = createElement("button", "chm-sidebar-toggle", "☰");
	sidebarToggle.type = "button";
	sidebarToggle.title = t("menu");
	sidebarToggle.setAttribute("aria-label", t("menu"));
	const heading = createElement("div", "chm-heading");
	const title = createElement("h2", void 0, (context === null || context === void 0 ? void 0 : context.filename) || "CHM");
	const subtitle = createElement("p", void 0, t("loading"));
	heading.append(title, subtitle);
	const badges = createElement("div", "chm-badges");
	header.append(sidebarToggle, heading, badges);
	const body = createElement("div", "chm-body");
	const sidebar = createElement("aside", "chm-sidebar");
	const tabs = createElement("div", "chm-tabs");
	const panels = createElement("div", "chm-sidebar-panels");
	const contentsPanel = createElement("section", "chm-panel");
	contentsPanel.dataset.chmPanel = "contents";
	const indexPanel = createElement("section", "chm-panel");
	indexPanel.dataset.chmPanel = "index";
	indexPanel.hidden = true;
	const searchPanel = createElement("section", "chm-panel chm-search");
	searchPanel.dataset.chmPanel = "search";
	searchPanel.hidden = true;
	const searchBox = createElement("div", "chm-search-box");
	const searchInput = createElement("input");
	searchInput.type = "search";
	searchInput.placeholder = t("searchPlaceholder");
	searchInput.setAttribute("aria-label", t("search"));
	const searchMeta = createElement("div", "chm-search-meta", t("searchHint"));
	const searchResults = createElement("div", "chm-search-results");
	searchBox.append(searchInput);
	searchPanel.append(searchBox, searchMeta, searchResults);
	panels.append(contentsPanel, indexPanel, searchPanel);
	sidebar.append(tabs, panels);
	const topic = createElement("main", "chm-topic");
	const topicBar = createElement("div", "chm-topic-bar");
	const topicTitle = createElement("strong", void 0, t("loading"));
	const topicPath = createElement("span", "chm-topic-path");
	topicBar.append(topicTitle, topicPath);
	const frame = createElement("iframe", "chm-topic-frame");
	frame.setAttribute("sandbox", "allow-same-origin");
	frame.setAttribute("referrerpolicy", "no-referrer");
	frame.title = (context === null || context === void 0 ? void 0 : context.filename) || "CHM topic";
	topic.append(topicBar, frame);
	body.append(sidebar, topic);
	const state = createElement("div", "chm-state");
	const spinner = createElement("span", "chm-spinner");
	const stateText = createElement("p", void 0, t("loading"));
	state.append(spinner, stateText);
	const errorPanel = createElement("div", "chm-error");
	errorPanel.hidden = true;
	errorPanel.append(createElement("strong", void 0, t("error")), createElement("p"));
	root.append(header, body, state);
	target.replaceChildren(style, root);
	const listen = (node, type, handler) => {
		node.addEventListener(type, handler);
		listeners.push(() => node.removeEventListener(type, handler));
	};
	const showState = (text, visible = true) => {
		stateText.textContent = text;
		state.hidden = !visible;
	};
	const showError = (error) => {
		showState("", false);
		const paragraph = errorPanel.querySelector("p");
		if (paragraph) paragraph.textContent = error instanceof Error ? error.message : String(error);
		errorPanel.hidden = false;
		if (!errorPanel.isConnected) root.append(errorPanel);
	};
	const onProgress = (progress) => {
		if (root.dataset.chmReady === "true") {
			if (progress.phase === "search") searchMeta.textContent = t("searching");
			return;
		}
		if (progress.phase === "wasm") showState(t("wasm"));
		else if (progress.phase === "directory") showState(t("directory"));
		else if (progress.phase === "manifest") showState(t("manifest"));
	};
	const resolveEntryPath = (path) => {
		const normalized = normalizeChmPath(path);
		if (!normalized) return null;
		return entryLookup.get(normalized.toLocaleLowerCase()) || null;
	};
	const loadResource = async (path, ancestry = /* @__PURE__ */ new Set()) => {
		const actualPath = resolveEntryPath(path);
		if (!actualPath || !client || destroyed) return null;
		const key = actualPath.toLocaleLowerCase();
		if (ancestry.has(key)) return null;
		const cached = resourceUrls.get(key);
		if (cached) return cached;
		if (resourceUrls.size >= MAX_LOADED_RESOURCE_PATHS) return null;
		const promise = (async () => {
			try {
				const bytes = await (client === null || client === void 0 ? void 0 : client.read(actualPath, abortController.signal));
				if (!bytes || bytes.byteLength > ((client === null || client === void 0 ? void 0 : client.options.maxEntryBytes) || 0)) return null;
				const extension = extensionOf(actualPath);
				let blob;
				if (extension === "css") {
					if (ancestry.size > 0) return null;
					if (bytes.byteLength > 4194304) return null;
					const nextAncestry = new Set(ancestry);
					nextAncestry.add(key);
					const sanitizedCss = sanitizeChmCss(decodeChmText(bytes, manifest === null || manifest === void 0 ? void 0 : manifest.encoding), actualPath);
					const css = await replaceCssResourceUrls(sanitizedCss.css, sanitizedCss.resourcePaths, loadResource, nextAncestry);
					blob = new Blob([css], { type: "text/css;charset=utf-8" });
				} else if (extension === "svg") {
					if (bytes.byteLength > 8388608) return null;
					const svg = sanitizeSvg(decodeChmText(bytes, "utf-8"));
					if (!svg) return null;
					blob = new Blob([svg], { type: "image/svg+xml" });
				} else {
					const copy = new Uint8Array(bytes.byteLength);
					copy.set(bytes);
					blob = new Blob([copy.buffer], { type: mimeTypeForPath(actualPath) });
				}
				const url = URL.createObjectURL(blob);
				objectUrls.add(url);
				return url;
			} catch {
				return null;
			}
		})();
		resourceUrls.set(key, promise);
		return promise;
	};
	const hydrateTopic = async (html, basePath) => {
		const sanitized = sanitizeChmHtmlDocument(html, basePath, false);
		const { document } = sanitized;
		const replacements = await loadResourceMap(sanitized.resourcePaths, loadResource, /* @__PURE__ */ new Set(), MAX_CHM_TOPIC_RESOURCE_PATHS);
		for (const attribute of [
			"src",
			"poster",
			"href",
			"xlink-href",
			"background",
			"lowsrc",
			"dynsrc"
		]) document.querySelectorAll(`[data-chm-resource-${attribute}]`).forEach((element) => {
			const dataAttribute = `data-chm-resource-${attribute}`;
			const path = normalizeChmPath(element.getAttribute(dataAttribute) || "");
			const url = path ? replacements.get(path.toLocaleLowerCase()) : "";
			element.removeAttribute(dataAttribute);
			if (!url) return;
			if (attribute === "xlink-href") element.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
			else element.setAttribute(attribute, url);
		});
		for (const style of Array.from(document.querySelectorAll("style"))) style.textContent = replaceInternalCssResourceUrls(style.textContent || "", replacements);
		for (const element of Array.from(document.querySelectorAll("[style]"))) element.setAttribute("style", replaceInternalCssResourceUrls(element.getAttribute("style") || "", replacements));
		return {
			html: `<!doctype html>${document.documentElement.outerHTML}`,
			title: sanitized.title
		};
	};
	const syncActiveNavigation = (path) => {
		root.querySelectorAll("[data-chm-path].is-active").forEach((element) => element.classList.remove("is-active"));
		const folded = path.toLocaleLowerCase();
		root.querySelectorAll("[data-chm-path]").forEach((element) => {
			if ((element.dataset.chmPath || "").toLocaleLowerCase() === folded) element.classList.add("is-active");
		});
	};
	const scrollToFragment = (fragment) => {
		if (!fragment) return;
		const document = frame.contentDocument;
		const target = (document === null || document === void 0 ? void 0 : document.getElementById(fragment)) || (document === null || document === void 0 ? void 0 : document.getElementsByName(fragment)[0]);
		target === null || target === void 0 || target.scrollIntoView({ block: "start" });
	};
	const openTopic = async (path, fragment) => {
		var _a, _b;
		const generation = ++topicGeneration;
		const actualPath = resolveEntryPath(path);
		if (!actualPath || !client) throw new Error(`CHM_ENTRY_NOT_FOUND: ${path}`);
		showState(t("opening"));
		try {
			const bytes = await client.read(actualPath, abortController.signal);
			if (bytes.byteLength > client.options.maxHtmlBytes) throw new Error(`CHM_LIMIT_EXCEEDED: topic ${actualPath} is too large to render safely.`);
			const hydrated = await hydrateTopic(decodeChmText(bytes, manifest === null || manifest === void 0 ? void 0 : manifest.encoding), actualPath);
			if (destroyed || generation !== topicGeneration) return;
			currentHtml = hydrated.html;
			const canonicalPath = normalizeChmPath(actualPath) || actualPath;
			topicTitle.textContent = hydrated.title || ((_a = manifest === null || manifest === void 0 ? void 0 : manifest.topics.find((item) => {
				var _a;
				return ((_a = normalizeChmPath(item.path)) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === canonicalPath.toLocaleLowerCase();
			})) === null || _a === void 0 ? void 0 : _a.title) || actualPath;
			topicPath.textContent = canonicalPath;
			frame.srcdoc = hydrated.html;
			frame.onload = () => {
				if (destroyed || generation !== topicGeneration) return;
				const frameDocument = frame.contentDocument;
				if (frameDocument) frameDocument.addEventListener("click", (event) => {
					const eventTarget = event.target;
					const anchor = eventTarget instanceof Element ? eventTarget.closest("a[data-chm-link-kind],area[data-chm-link-kind]") : null;
					if (!anchor) return;
					event.preventDefault();
					const kind = anchor.dataset.chmLinkKind;
					const nextPath = anchor.dataset.chmPath;
					const nextFragment = anchor.dataset.chmFragment;
					if (kind === "fragment") scrollToFragment(nextFragment);
					else if (kind === "internal" && nextPath) openTopic(nextPath, nextFragment).catch(showError);
				});
				scrollToFragment(fragment);
			};
			syncActiveNavigation(canonicalPath);
			root.classList.remove("is-sidebar-open");
			errorPanel.remove();
			errorPanel.hidden = true;
			showState("", false);
			(_b = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _b === void 0 || _b.call(context);
		} catch (error) {
			if (generation === topicGeneration && !destroyed) showError(error);
			throw error;
		}
	};
	const appendNavigation = (panel, nodes, emptyText) => {
		panel.replaceChildren();
		const flattened = flatNavigation(nodes);
		if (!flattened.length) {
			panel.append(createElement("p", "chm-panel-note", emptyText));
			return;
		}
		const list = createElement("ul", "chm-navigation");
		const parentByDepth = /* @__PURE__ */ new Map([[0, list]]);
		for (const { node, depth } of flattened) {
			const parent = parentByDepth.get(depth) || list;
			const item = createElement("li");
			const normalizedPath = node.path ? normalizeChmPath(node.path) : null;
			const label = normalizedPath ? createElement("button", "chm-nav-button", node.title || normalizedPath) : createElement("div", "chm-nav-label", node.title);
			if (label instanceof HTMLButtonElement && normalizedPath) {
				label.type = "button";
				label.dataset.chmPath = normalizedPath;
			}
			item.append(label);
			if (node.children.length) {
				const children = createElement("ul");
				item.append(children);
				parentByDepth.set(depth + 1, children);
			} else parentByDepth.delete(depth + 1);
			parent.append(item);
		}
		panel.append(list);
		if (flattened.length >= MAX_RENDERED_NAVIGATION_ITEMS) panel.append(createElement("p", "chm-panel-note", t("truncated")));
	};
	const selectTab = (name) => {
		tabs.querySelectorAll(".chm-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.chmTab === name));
		panels.querySelectorAll(".chm-panel").forEach((panel) => {
			panel.hidden = panel.dataset.chmPanel !== name;
		});
		if (name === "search") searchInput.focus();
	};
	[
		"contents",
		"index",
		"search"
	].forEach((name, index) => {
		const button = createElement("button", `chm-tab${index === 0 ? " is-active" : ""}`, t(name));
		button.type = "button";
		button.dataset.chmTab = name;
		button.setAttribute("aria-label", t(name));
		tabs.append(button);
	});
	const renderSearchHits = (hits, query, truncated) => {
		searchResults.replaceChildren();
		if (!hits.length) {
			searchMeta.textContent = t("noResults");
			return;
		}
		searchMeta.textContent = truncated ? `${hits.length} · ${t("truncated")}` : String(hits.length);
		for (const hit of hits) {
			const button = createElement("button", "chm-search-result");
			button.type = "button";
			button.dataset.chmSearchResult = "true";
			button.dataset.chmPath = hit.path;
			const heading = createElement("strong");
			highlightSnippet(heading, hit.title, query);
			const snippet = createElement("span");
			highlightSnippet(snippet, hit.snippet || hit.path, query);
			button.append(heading, snippet);
			searchResults.append(button);
		}
	};
	const runSearch = async () => {
		const query = searchInput.value.trim();
		const generation = ++searchGeneration;
		if (query.length < 2 || !client) {
			searchResults.replaceChildren();
			searchMeta.textContent = t("searchHint");
			return;
		}
		searchMeta.textContent = t("searching");
		try {
			const result = await client.search(query, abortController.signal);
			if (!destroyed && generation === searchGeneration) renderSearchHits(result.hits, query, result.truncated);
		} catch (error) {
			if (!destroyed && generation === searchGeneration) searchMeta.textContent = error instanceof Error ? error.message : String(error);
		}
	};
	listen(sidebarToggle, "click", () => root.classList.toggle("is-sidebar-open"));
	listen(tabs, "click", (event) => {
		const button = event.target instanceof Element ? event.target.closest("[data-chm-tab]") : null;
		const name = button === null || button === void 0 ? void 0 : button.dataset.chmTab;
		if (name === "contents" || name === "index" || name === "search") selectTab(name);
	});
	listen(panels, "click", (event) => {
		const button = event.target instanceof Element ? event.target.closest("[data-chm-path]") : null;
		if (button === null || button === void 0 ? void 0 : button.dataset.chmPath) openTopic(button.dataset.chmPath).catch(() => void 0);
	});
	listen(searchInput, "input", () => {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => void runSearch(), 350);
	});
	const destroy = () => {
		var _a;
		if (destroyed) return;
		destroyed = true;
		topicGeneration += 1;
		searchGeneration += 1;
		if (searchTimer) clearTimeout(searchTimer);
		abortController.abort();
		frame.onload = null;
		listeners.splice(0).forEach((dispose) => dispose());
		client === null || client === void 0 || client.destroy();
		client = void 0;
		for (const url of objectUrls) URL.revokeObjectURL(url);
		objectUrls.clear();
		resourceUrls.clear();
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
		root.remove();
		style.remove();
	};
	const abortFromContext = () => destroy();
	(_c = context === null || context === void 0 ? void 0 : context.signal) === null || _c === void 0 || _c.addEventListener("abort", abortFromContext, { once: true });
	listeners.push(() => {
		var _a;
		return (_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.removeEventListener("abort", abortFromContext);
	});
	(_d = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _d === void 0 || _d.call(context, {
		print: true,
		exportHtml: true,
		includeDocumentStyles: true,
		toHtml: () => currentHtml || root.outerHTML,
		printStyle: ".chm-sidebar,.chm-header,.chm-topic-bar{display:none!important}.chm-topic-frame{height:auto!important}"
	});
	try {
		client = new ChmWorkerClient(options, onProgress);
		const result = await client.open(buffer, abortController.signal);
		if (destroyed) return {
			$el: root,
			destroy
		};
		manifest = result.manifest;
		entries = result.entries;
		entryLookup = new Map(entries.flatMap((entry) => {
			const normalized = normalizeChmPath(entry.path);
			return normalized ? [[normalized.toLocaleLowerCase(), entry.path]] : [];
		}));
		title.textContent = manifest.title || (context === null || context === void 0 ? void 0 : context.filename) || "CHM";
		subtitle.textContent = `${manifest.topics.length} ${t("topics")}`;
		badges.replaceChildren(createElement("span", "chm-badge", t("ready")));
		if (manifest.hasBinaryToc) badges.append(createElement("span", "chm-badge is-muted", t("binaryToc")));
		if (manifest.hasFullTextIndex) badges.append(createElement("span", "chm-badge is-muted", t("fullText")));
		const fallbackContents = manifest.topics.map((item) => ({
			title: item.title,
			path: item.path,
			children: []
		}));
		appendNavigation(contentsPanel, manifest.contents.length ? manifest.contents : fallbackContents, t("noContents"));
		appendNavigation(indexPanel, manifest.index, t("noIndex"));
		const homePath = [
			manifest.homePath,
			...manifest.topics.map((item) => item.path),
			...entries.filter((entry) => HTML_EXTENSIONS.has(extensionOf(entry.path))).map((entry) => entry.path)
		].find((candidate) => Boolean(candidate && resolveEntryPath(candidate)));
		if (!homePath) throw new Error(`CHM_NO_TOPIC: ${t("unavailable")}`);
		await openTopic(homePath);
		if (destroyed) return {
			$el: root,
			destroy
		};
		root.dataset.chmReady = "true";
		errorPanel.remove();
		errorPanel.hidden = true;
		root.dispatchEvent(new CustomEvent("file-viewer:chm-ready", {
			bubbles: true,
			composed: true,
			detail: {
				title: manifest.title,
				homePath: normalizeChmPath(homePath),
				topicCount: manifest.topics.length
			}
		}));
	} catch (error) {
		if (!destroyed) showError(error);
	}
	return {
		$el: root,
		destroy
	};
}
//#endregion
export { renderChm as default };
