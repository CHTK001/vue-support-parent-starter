import "./dist-B6GcL3C6.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/epub-viewport-media.js
var resolveEpubOrientationMedia = (query, portrait) => {
	return query.replace(/\(\s*orientation\s*:\s*(portrait|landscape)\s*\)/gi, (_, orientation) => {
		return orientation.toLowerCase() === "portrait" === portrait ? "(min-width: 0px)" : "(width: 0px)";
	});
};
/** Keep orientation independent of an iframe whose height follows its content. */
var bindEpubViewportMedia = (rendition, viewport) => {
	const originals = /* @__PURE__ */ new WeakMap();
	const updateContents = ({ document }) => {
		const { clientWidth: width, clientHeight: height } = viewport;
		if (!width || !height) return;
		const portrait = height >= width;
		const visited = /* @__PURE__ */ new Set();
		const updateMedia = (media) => {
			var _a;
			const original = (_a = originals.get(media)) !== null && _a !== void 0 ? _a : media.mediaText;
			const resolved = resolveEpubOrientationMedia(original, portrait);
			if (resolved !== original) {
				originals.set(media, original);
				if (media.mediaText !== resolved) media.mediaText = resolved;
			}
		};
		const visitRules = (rules) => {
			for (const rule of Array.from(rules)) {
				if ("media" in rule) updateMedia(rule.media);
				if ("styleSheet" in rule) {
					const sheet = rule.styleSheet;
					if (sheet) visitSheet(sheet);
				} else if ("cssRules" in rule) visitRules(rule.cssRules);
			}
		};
		const visitSheet = (sheet) => {
			if (visited.has(sheet)) return;
			visited.add(sheet);
			updateMedia(sheet.media);
			try {
				visitRules(sheet.cssRules);
			} catch (error) {
				if (!error || error.name !== "SecurityError") throw error;
			}
		};
		Array.from(document.styleSheets).forEach(visitSheet);
	};
	const update = () => rendition.getContents().forEach(updateContents);
	rendition.hooks.content.register(updateContents);
	const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(update);
	observer === null || observer === void 0 || observer.observe(viewport);
	const hostWindow = viewport.ownerDocument.defaultView;
	if (!observer) hostWindow === null || hostWindow === void 0 || hostWindow.addEventListener("resize", update);
	return () => {
		observer === null || observer === void 0 || observer.disconnect();
		if (!observer) hostWindow === null || hostWindow === void 0 || hostWindow.removeEventListener("resize", update);
		rendition.hooks.content.deregister(updateContents);
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/epub.js
var isEpubFactory = (value) => {
	return typeof value === "function";
};
var resolveEpubJs = (module) => {
	const record = module;
	const defaultRecord = record === null || record === void 0 ? void 0 : record.default;
	const ePub = [
		defaultRecord === null || defaultRecord === void 0 ? void 0 : defaultRecord.default,
		record === null || record === void 0 ? void 0 : record.default,
		module
	].find(isEpubFactory);
	if (!ePub) throw new Error("epubjs module does not expose a callable factory.");
	return ePub;
};
var epubStyle = `
.epub-viewer{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:var(--file-viewer-render-surface-background,#eef1f4);color:#172033;box-sizing:border-box}
.epub-viewer *{box-sizing:border-box}
.epub-toolbar{flex-shrink:0;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.92)}
.epub-title{min-width:0;display:flex;flex-direction:column;gap:3px}
.epub-title strong,.epub-title span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.epub-title strong{font-size:14px}
.epub-title span{color:#64748b;font-size:12px}
.epub-icon-button,.epub-button{height:36px;border:1px solid rgba(15,23,42,.08);background:#fff;color:#172033;font:inherit;cursor:pointer}
.epub-icon-button{width:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}
.epub-icon-button span,.epub-icon-button span::before,.epub-icon-button span::after{width:16px;height:2px;display:block;border-radius:999px;background:currentColor}
.epub-icon-button span{position:relative}
.epub-icon-button span::before,.epub-icon-button span::after{content:'';position:absolute;left:0}
.epub-icon-button span::before{top:-5px}
.epub-icon-button span::after{top:5px}
.epub-icon-button.active{border-color:rgba(37,99,235,.24);background:rgba(37,99,235,.08);color:#1d4ed8}
.epub-actions{display:flex;align-items:center;gap:8px}
.epub-button{min-width:68px;padding:0 12px;border-radius:8px;font-size:13px;font-weight:700}
.epub-button:disabled{color:#94a3b8;cursor:not-allowed}
.epub-progress{min-width:58px;color:#64748b;font-size:12px;text-align:center}
.epub-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(180px,240px) minmax(0,1fr)}
.epub-viewer--toc-hidden .epub-body{grid-template-columns:minmax(0,1fr)}
.epub-toc{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.8)}
.epub-toc[hidden]{display:none}
.epub-toc-head{flex-shrink:0;display:flex;justify-content:space-between;gap:8px;padding:12px;color:#172033;font-size:13px}
.epub-toc-head span{color:#64748b}
.epub-toc-list{flex:1;min-height:0;overflow:auto;padding:0 8px 10px}
.epub-toc-item{width:100%;min-height:34px;border:0;border-radius:8px;background:transparent;color:#475569;font:inherit;font-size:12px;text-align:left;cursor:pointer}
.epub-toc-item:hover,.epub-toc-item.active{background:rgba(37,99,235,.08);color:#1d4ed8}
.epub-stage-wrap{position:relative;min-width:0;min-height:0;padding:18px;overflow:hidden}
.epub-stage{width:100%;height:100%;overflow-x:hidden;overflow-y:auto;border-radius:8px;background:#fff;box-shadow:0 18px 45px rgba(15,23,42,.12),inset 0 0 0 1px rgba(15,23,42,.06)}
/* epub.js already compensates scroll position when it prepends or resizes chapters. */
.epub-stage .epub-container{width:100%!important;max-width:100%;overflow-x:hidden!important;overflow-y:auto!important;overflow-anchor:none}
.epub-stage iframe{max-width:100%}
.epub-state{position:absolute;inset:18px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(255,255,255,.92);color:#64748b;font-size:14px}
.epub-state[hidden]{display:none!important}
.epub-state.error{color:#b42318}
[data-viewer-theme='dark'] .epub-viewer{background:var(--file-viewer-render-surface-background,#172033);color:#e5eef8}
[data-viewer-theme='dark'] .epub-toolbar,[data-viewer-theme='dark'] .epub-toc,[data-viewer-theme='dark'] .epub-stage{background:#fff;color:#172033}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .epub-viewer{background:var(--file-viewer-render-surface-background,#172033);color:#e5eef8}[data-viewer-theme='system'] .epub-toolbar,[data-viewer-theme='system'] .epub-toc,[data-viewer-theme='system'] .epub-stage{background:#fff;color:#172033}}
@media (max-width:720px){.epub-toolbar{grid-template-columns:40px minmax(0,1fr)}.epub-actions{grid-column:1/-1;justify-content:space-between}.epub-body{position:relative;grid-template-columns:minmax(0,1fr)}.epub-toc{position:absolute;z-index:5;top:0;bottom:0;left:0;width:min(82vw,280px);box-shadow:18px 0 40px rgba(15,23,42,.16)}.epub-stage-wrap{padding:12px}}
`;
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = epubStyle;
	return style;
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var normalizeLabel = (value, fallback) => {
	if (typeof value === "string" && value.trim()) return value.trim();
	return fallback;
};
var flattenToc = (items, fallbackLabel, depth = 0) => {
	if (!Array.isArray(items)) return [];
	return items.flatMap((item, index) => {
		const node = item;
		const href = typeof node.href === "string" ? node.href : "";
		const label = normalizeLabel(node.label || node.title, fallbackLabel(index + 1));
		const subitems = flattenToc(node.subitems || node.children, fallbackLabel, depth + 1);
		if (!href) return subitems;
		return [{
			depth,
			href,
			id: `${depth}-${index}-${href}`,
			label
		}, ...subitems];
	});
};
var pickInitialHref = (items) => {
	var _a;
	const chapterLike = items.find((item) => {
		const label = item.label.toLowerCase();
		return /(^|\s)(chapter|part|book|prologue|preface|introduction)\b/.test(label) || /第[一二三四五六七八九十百千0-9]+[章节回部卷篇]/.test(item.label);
	});
	if (chapterLike) return chapterLike.href;
	const readable = items.find((item) => {
		const text = `${item.label} ${item.href}`.toLowerCase();
		return !/(cover|titlepage|title-page|copyright|license|toc|contents|nav|table-of-contents|wrap0000)/.test(text);
	});
	return (readable === null || readable === void 0 ? void 0 : readable.href) || ((_a = items[0]) === null || _a === void 0 ? void 0 : _a.href);
};
var splitEpubHref = (href) => {
	const separatorIndex = href.search(/[?#]/);
	if (separatorIndex === -1) return {
		pathname: href,
		suffix: ""
	};
	return {
		pathname: href.slice(0, separatorIndex),
		suffix: href.slice(separatorIndex)
	};
};
var normalizeEpubArchivePath = (pathname) => {
	const segments = [];
	pathname.replace(/\\/g, "/").split("/").forEach((segment) => {
		if (!segment || segment === ".") return;
		if (segment === "..") {
			segments.pop();
			return;
		}
		segments.push(segment);
	});
	return segments.join("/");
};
var isExternalEpubHref = (href) => {
	return href.startsWith("/") || href.startsWith("//") || /^[a-z][a-z\\d+.-]*:/i.test(href);
};
/**
* epub.js exposes nav/NCX links relative to the navigation document, while its
* spine lookup is relative to the OPF. Only rewrite a link when the resolved
* archive path is an actual spine entry, preserving already-normalized links.
*/
var resolveEpubNavigationHref = (href, navigationPath, spineHrefs) => {
	const source = href.trim();
	if (!source || isExternalEpubHref(source)) return source;
	const { pathname, suffix } = splitEpubHref(source);
	const knownSpinePaths = new Set(spineHrefs.map((value) => normalizeEpubArchivePath(splitEpubHref(value).pathname)).filter(Boolean));
	const rawPath = normalizeEpubArchivePath(pathname);
	if (rawPath && knownSpinePaths.has(rawPath)) return `${rawPath}${suffix}`;
	const navigation = navigationPath === null || navigationPath === void 0 ? void 0 : navigationPath.trim();
	if (!navigation) return source;
	const resolvedPath = normalizeEpubArchivePath(`${normalizeEpubArchivePath(splitEpubHref(navigation).pathname).split("/").slice(0, -1).join("/")}/${pathname}`);
	if (resolvedPath && knownSpinePaths.has(resolvedPath)) return `${resolvedPath}${suffix}`;
	return source;
};
var getEpubNavigationPath = (book) => {
	const packageData = book.packaging || book.package;
	return [packageData === null || packageData === void 0 ? void 0 : packageData.navPath, packageData === null || packageData === void 0 ? void 0 : packageData.ncxPath].find((value) => typeof value === "string" && Boolean(value.trim()));
};
var normalizeEpubTocHrefs = (items, book) => {
	var _a, _b;
	const navigationPath = getEpubNavigationPath(book);
	const spineHrefs = ((_b = (_a = book.spine) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.flatMap((item) => typeof item.href === "string" ? [item.href] : [])) || [];
	return items.map((item) => ({
		...item,
		href: resolveEpubNavigationHref(item.href, navigationPath, spineHrefs)
	}));
};
async function renderEpub(buffer, target, context) {
	var _a;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	let book;
	let rendition;
	let disposed = false;
	let tocOpen = true;
	let status = "loading";
	let title = t("epub.title");
	let author = "";
	let tocItems = [];
	let currentHref = "";
	let progress = null;
	let atStart = true;
	let atEnd = false;
	const timers = /* @__PURE__ */ new Set();
	const cleanups = [];
	const root = createElement("div", "epub-viewer");
	const toolbar = createElement("div", "epub-toolbar");
	const tocButton = createElement("button", "epub-icon-button");
	tocButton.type = "button";
	tocButton.title = t("ebook.toc");
	tocButton.append(createElement("span"));
	const titleRoot = createElement("div", "epub-title");
	const titleText = createElement("strong", void 0, title);
	const subtitleText = createElement("span", void 0, t("ebook.reading"));
	titleRoot.append(titleText, subtitleText);
	const actions = createElement("div", "epub-actions");
	const prevButton = createElement("button", "epub-button", t("epub.previousPage"));
	const progressText = createElement("span", "epub-progress", t("ebook.reading"));
	const nextButton = createElement("button", "epub-button", t("epub.nextPage"));
	prevButton.type = "button";
	nextButton.type = "button";
	actions.append(prevButton, progressText, nextButton);
	toolbar.append(tocButton, titleRoot, actions);
	const body = createElement("div", "epub-body");
	const toc = createElement("aside", "epub-toc");
	const tocHead = createElement("div", "epub-toc-head");
	const tocCount = createElement("span", void 0, t("ebook.itemCount", { count: 0 }));
	tocHead.append(createElement("strong", void 0, t("ebook.toc")), tocCount);
	const tocList = createElement("div", "epub-toc-list");
	toc.append(tocHead, tocList);
	const stageWrap = createElement("main", "epub-stage-wrap");
	const stage = createElement("div", "epub-stage");
	const state = createElement("div", "epub-state", t("epub.loading"));
	stageWrap.append(stage, state);
	body.append(toc, stageWrap);
	root.append(toolbar, body);
	target.replaceChildren(createStyle(), root);
	const listen = (element, event, listener) => {
		element.addEventListener(event, listener);
		cleanups.push(() => element.removeEventListener(event, listener));
	};
	const currentChapter = () => {
		var _a;
		if (!currentHref) return "";
		const exact = tocItems.find((item) => item.href === currentHref);
		if (exact) return exact.label;
		return ((_a = tocItems.find((item) => currentHref.includes(item.href.split("#")[0]))) === null || _a === void 0 ? void 0 : _a.label) || "";
	};
	const progressLabel = () => {
		if (typeof progress === "number") return `${progress}%`;
		return currentChapter() || t("ebook.reading");
	};
	const syncUi = () => {
		root.classList.toggle("epub-viewer--toc-hidden", !tocOpen);
		toc.hidden = !tocOpen;
		tocButton.classList.toggle("active", tocOpen);
		titleText.textContent = title;
		subtitleText.textContent = author || progressLabel();
		progressText.textContent = progressLabel();
		prevButton.disabled = status !== "ready" || atStart;
		nextButton.disabled = status !== "ready" || atEnd;
		state.hidden = status === "ready";
		state.classList.toggle("error", status === "error");
		tocCount.textContent = t("ebook.itemCount", { count: tocItems.length });
		Array.from(tocList.querySelectorAll(".epub-toc-item")).forEach((button) => {
			var _a;
			const itemPath = (_a = button.dataset.href) === null || _a === void 0 ? void 0 : _a.split("#")[0];
			const currentPath = currentHref.split("#")[0];
			button.classList.toggle("active", Boolean(itemPath) && itemPath === currentPath);
		});
	};
	const showRenditionError = (error) => {
		if (disposed) return;
		console.error(error);
		status = "error";
		state.textContent = error instanceof Error ? error.message : String(error);
		syncUi();
	};
	const runRenditionAction = (action) => {
		try {
			action().catch(showRenditionError);
		} catch (error) {
			showRenditionError(error);
		}
	};
	const renderToc = () => {
		tocList.replaceChildren();
		tocItems.forEach((item) => {
			const button = createElement("button", "epub-toc-item", item.label);
			button.type = "button";
			button.dataset.href = item.href;
			button.style.paddingLeft = `${12 + item.depth * 14}px`;
			listen(button, "click", () => {
				runRenditionAction(() => (rendition === null || rendition === void 0 ? void 0 : rendition.display(item.href)) || Promise.resolve());
				tocOpen = false;
				syncUi();
			});
			tocList.append(button);
		});
		syncUi();
	};
	const updateLocation = (epubLocation) => {
		var _a, _b;
		atStart = Boolean(epubLocation === null || epubLocation === void 0 ? void 0 : epubLocation.atStart);
		atEnd = Boolean(epubLocation === null || epubLocation === void 0 ? void 0 : epubLocation.atEnd);
		currentHref = ((_a = epubLocation === null || epubLocation === void 0 ? void 0 : epubLocation.start) === null || _a === void 0 ? void 0 : _a.href) || "";
		if (typeof ((_b = epubLocation === null || epubLocation === void 0 ? void 0 : epubLocation.start) === null || _b === void 0 ? void 0 : _b.percentage) === "number") progress = Math.round(epubLocation.start.percentage * 100);
		syncUi();
	};
	const wait = (ms) => new Promise((resolve) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			resolve(void 0);
		}, ms);
		timers.add(timer);
	});
	const hasReadableFrame = () => {
		var _a;
		try {
			const iframe = stage.querySelector("iframe");
			const frameBody = (_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body;
			if (!frameBody) return false;
			return Boolean(frameBody.innerText.trim() || frameBody.querySelector("img, svg, canvas"));
		} catch {
			return false;
		}
	};
	const waitForReadableFrame = async () => {
		for (let index = 0; index < 20; index += 1) {
			if (disposed || hasReadableFrame()) return hasReadableFrame();
			await wait(100);
		}
		return hasReadableFrame();
	};
	const openBook = async () => {
		status = "loading";
		state.textContent = t("epub.loading");
		syncUi();
		try {
			const ePub = resolveEpubJs(await import("./epubjs-BwJGEcMi.js"));
			if (disposed) return;
			book = ePub(buffer.slice(0), {
				openAs: "binary",
				replacements: "blobUrl"
			});
			rendition = book.renderTo(stage, {
				allowScriptedContent: false,
				flow: "scrolled",
				height: "100%",
				manager: "continuous",
				resizeOnOrientationChange: true,
				spread: "none",
				width: "100%"
			});
			cleanups.push(bindEpubViewportMedia(rendition, stage));
			rendition.themes.default({
				body: {
					color: "#172033",
					fontFamily: "Georgia, \"Times New Roman\", serif",
					lineHeight: "1.72",
					padding: "0 8px"
				},
				img: { maxWidth: "100%" },
				html: {
					height: "auto",
					overflow: "auto"
				}
			});
			rendition.on("relocated", updateLocation);
			await book.ready;
			const metadata = await book.loaded.metadata.catch(() => void 0);
			title = normalizeLabel(metadata === null || metadata === void 0 ? void 0 : metadata.title, title);
			author = normalizeLabel(metadata === null || metadata === void 0 ? void 0 : metadata.creator, "");
			const navigation = await book.loaded.navigation.catch(() => void 0);
			tocItems = normalizeEpubTocHrefs(flattenToc(navigation === null || navigation === void 0 ? void 0 : navigation.toc, (index) => t("epub.chapterFallback", { index })), book);
			renderToc();
			await rendition.display(pickInitialHref(tocItems));
			if (!await waitForReadableFrame()) throw new Error(t("epub.renderIncomplete"));
			if (disposed) return;
			status = "ready";
			syncUi();
			book.locations.generate(1200).catch(() => void 0);
		} catch (error) {
			showRenditionError(error);
		}
	};
	listen(tocButton, "click", () => {
		tocOpen = !tocOpen;
		syncUi();
	});
	listen(prevButton, "click", () => {
		runRenditionAction(() => (rendition === null || rendition === void 0 ? void 0 : rendition.prev()) || Promise.resolve());
	});
	listen(nextButton, "click", () => {
		runRenditionAction(() => (rendition === null || rendition === void 0 ? void 0 : rendition.next()) || Promise.resolve());
	});
	syncUi();
	(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, {
		captureSource: "embedded",
		beforeCapture: async ({ signal }) => {
			while (status === "loading" && !disposed) {
				if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw signal.reason;
				await wait(16);
			}
			if (status === "error") throw new Error(state.textContent || t("epub.renderIncomplete"));
		},
		capture: async () => {
			var _a;
			const coverUrl = await ((_a = book === null || book === void 0 ? void 0 : book.coverUrl) === null || _a === void 0 ? void 0 : _a.call(book).catch(() => null));
			if (!coverUrl) return null;
			return fetch(coverUrl).then((response) => response.ok ? response.blob() : null).catch(() => null);
		},
		getTarget: () => {
			var _a, _b;
			return ((_b = (_a = stage.querySelector("iframe")) === null || _a === void 0 ? void 0 : _a.contentDocument) === null || _b === void 0 ? void 0 : _b.body) || stage;
		}
	});
	openBook();
	return {
		$el: root,
		unmount() {
			var _a;
			disposed = true;
			(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
			timers.forEach((timer) => window.clearTimeout(timer));
			timers.clear();
			cleanups.splice(0).forEach((cleanup) => cleanup());
			if (rendition) {
				rendition.off("relocated", updateLocation);
				rendition.destroy();
				rendition = void 0;
			}
			book === null || book === void 0 || book.destroy();
			book = void 0;
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderEpub as default };
