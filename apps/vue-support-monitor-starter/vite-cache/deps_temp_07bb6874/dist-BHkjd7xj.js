import { t as purify } from "./purify.es-CB-mAamt.js";
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/chart.js
var chartLibraryLoader = null;
var registerPptxChartLibraryLoader = (loader) => {
	chartLibraryLoader = loader;
};
var asChartQueue = (charts) => {
	return Array.isArray(charts === null || charts === void 0 ? void 0 : charts.MsgQueue) ? charts.MsgQueue : [];
};
var findPptxChartTarget = (root, chartID) => {
	const rootElement = root;
	if (rootElement.id === chartID) return rootElement;
	return Array.from(root.querySelectorAll("[id]")).find((element) => element.id === chartID) || null;
};
var getNumericBulletText = (type, index) => {
	switch (type) {
		case "arabicPeriod": return `${index}. `;
		case "arabicParenR": return `${index}) `;
		case "alphaLcParenR": return `${String.fromCharCode(index + 96)}) `;
		case "alphaLcPeriod": return `${String.fromCharCode(index + 96)}. `;
		case "alphaUcParenR": return `${String.fromCharCode(index + 64)}) `;
		case "alphaUcPeriod": return `${String.fromCharCode(index + 64)}. `;
		default: return String(index);
	}
};
var restoreNumericBullets = (root) => {
	const scopes = [...Array.from(root.querySelectorAll(".block")), ...Array.from(root.querySelectorAll("table td"))];
	for (const scope of scopes) {
		const bullets = Array.from(scope.querySelectorAll(".numeric-bullet-style"));
		const counters = /* @__PURE__ */ new Map();
		for (const bullet of bullets) {
			const type = String(bullet.dataset.bulltname || "arabicPeriod");
			const key = `${String(bullet.dataset.bulltlvl || "0")}:${type}`;
			const nextIndex = (counters.get(key) || 0) + 1;
			counters.set(key, nextIndex);
			bullet.textContent = getNumericBulletText(type, nextIndex);
		}
	}
};
var TEXT_FIT_MIN_SCALE = .7;
var TEXT_FIT_MAX_PASSES = 8;
var TEXT_FIT_TOLERANCE = 1;
var getFitDataKey = (property) => `pptxFit${property.charAt(0).toUpperCase()}${property.slice(1)}`;
var readOriginalPx = (element, property, computed = getComputedStyle(element)) => {
	const key = getFitDataKey(property);
	const existing = Number(element.dataset[key]);
	if (Number.isFinite(existing) && existing > 0) return existing;
	const value = parseFloat(computed[property]);
	if (!Number.isFinite(value) || value <= 0) return;
	element.dataset[key] = String(value);
	return value;
};
var setScaledPx = (element, property, scale, computed = getComputedStyle(element)) => {
	const original = readOriginalPx(element, property, computed);
	if (original === void 0) return;
	element.style[property] = `${original * scale}px`;
};
var collectTextFitElements = (block) => {
	const elements = /* @__PURE__ */ new Set();
	block.querySelectorAll(".text-block, .numeric-bullet-style").forEach((element) => {
		elements.add(element);
	});
	block.querySelectorAll(".slide-prgrph").forEach((paragraph) => {
		Array.from(paragraph.children).forEach((child) => {
			if (!(child instanceof HTMLElement) || child.querySelector(".text-block")) return;
			const computed = getComputedStyle(child);
			const fontSize = parseFloat(computed.fontSize);
			if (Number.isFinite(fontSize) && fontSize > 0) elements.add(child);
		});
	});
	return elements;
};
var applyTextFitScale = (block, scale) => {
	block.dataset.pptxTextFitScale = String(scale);
	for (const element of collectTextFitElements(block)) {
		const computed = getComputedStyle(element);
		setScaledPx(element, "fontSize", scale, computed);
		setScaledPx(element, "lineHeight", scale, computed);
		setScaledPx(element, "paddingLeft", scale, computed);
		setScaledPx(element, "paddingRight", scale, computed);
	}
	block.querySelectorAll(".slide-prgrph").forEach((paragraph) => {
		const computed = getComputedStyle(paragraph);
		setScaledPx(paragraph, "lineHeight", scale, computed);
		setScaledPx(paragraph, "marginTop", scale, computed);
		setScaledPx(paragraph, "marginBottom", scale, computed);
		setScaledPx(paragraph, "paddingTop", scale, computed);
		setScaledPx(paragraph, "paddingBottom", scale, computed);
	});
	block.querySelectorAll(".slide-prgrph > *").forEach((child) => {
		const computed = getComputedStyle(child);
		setScaledPx(child, "marginLeft", scale, computed);
		setScaledPx(child, "marginRight", scale, computed);
		setScaledPx(child, "paddingLeft", scale, computed);
		setScaledPx(child, "paddingRight", scale, computed);
	});
};
var hasTextOverflow = (block, fitWidth = true) => block.scrollHeight > block.clientHeight + TEXT_FIT_TOLERANCE || fitWidth && block.scrollWidth > block.clientWidth + TEXT_FIT_TOLERANCE;
var fitOverflowingTextBlock = (block, fitWidth = true) => {
	if (!block.querySelector(".text-block") || block.clientWidth <= 0 || block.clientHeight <= 0) return;
	let scale = Number(block.dataset.pptxTextFitScale) || 1;
	if (!hasTextOverflow(block, fitWidth)) return;
	for (let pass = 0; pass < TEXT_FIT_MAX_PASSES && hasTextOverflow(block, fitWidth); pass += 1) {
		const heightRatio = block.scrollHeight > 0 ? Math.min(1, block.clientHeight / block.scrollHeight) : 1;
		const widthRatio = fitWidth && block.scrollWidth > 0 ? Math.min(1, block.clientWidth / block.scrollWidth) : 1;
		const nextScale = Math.max(TEXT_FIT_MIN_SCALE, scale * Math.max(Math.min(heightRatio, widthRatio, .98), .95));
		if (nextScale >= scale - .002) scale = Math.max(TEXT_FIT_MIN_SCALE, scale * .97);
		else scale = nextScale;
		applyTextFitScale(block, scale);
		if (scale <= TEXT_FIT_MIN_SCALE && hasTextOverflow(block, fitWidth)) break;
	}
};
var fitOverflowingTextBlocks = (root) => {
	root.querySelectorAll(".slide div.content, .slide div.content-rtl").forEach((block) => fitOverflowingTextBlock(block));
	root.querySelectorAll(".slide .pptx-table-cell-content").forEach((block) => fitOverflowingTextBlock(block, false));
};
var renderChart = async (message, root) => {
	var _a;
	const payload = message.data;
	if (!(payload === null || payload === void 0 ? void 0 : payload.chartID) || !payload.chartType || !payload.chartData) return;
	const chartTarget = findPptxChartTarget(root, payload.chartID);
	if (!chartTarget) return;
	if (!chartLibraryLoader) {
		chartTarget.dataset.fileViewerMissingCapability = "pptx-charts";
		chartTarget.setAttribute("title", "PPTX chart rendering requires @file-viewer/capability-pptx-charts. Run `npx file-viewer-cli add pptx-charts --write`, then `npx file-viewer-cli install --yes`.");
		console.warn("[file-viewer] PPTX chart rendering requires @file-viewer/capability-pptx-charts. Run `npx file-viewer-cli add pptx-charts --write`, then `npx file-viewer-cli install --yes`.");
		return;
	}
	const { billboard, d3Format } = await chartLibraryLoader();
	const bb = billboard.default || billboard;
	const { area, bar, line, pie, scatter } = billboard;
	const chart = { bindto: chartTarget };
	const chartData = payload.chartData;
	const axis = { x: { tick: { format(index) {
		var _a, _b, _c;
		return (_c = (_b = (_a = chartData[0]) === null || _a === void 0 ? void 0 : _a.xlabels) === null || _b === void 0 ? void 0 : _b[index]) !== null && _c !== void 0 ? _c : index;
	} } } };
	switch (payload.chartType) {
		case "lineChart":
			Object.assign(chart, {
				data: {
					columns: chartData.map((item) => [item.key, ...item.values.map(({ y }) => y)]),
					type: line()
				},
				axis,
				interaction: { enabled: true }
			});
			break;
		case "barChart":
			Object.assign(chart, {
				data: {
					columns: chartData.map((item) => [item.key, ...item.values.map(({ y }) => y)]),
					type: bar()
				},
				axis: {
					rotated: payload.barDirection === "bar",
					x: { tick: {
						multiline: true,
						format(index) {
							var _a, _b, _c;
							return (_c = (_b = (_a = chartData[0]) === null || _a === void 0 ? void 0 : _a.xlabels) === null || _b === void 0 ? void 0 : _b[index]) !== null && _c !== void 0 ? _c : index;
						}
					} }
				}
			});
			break;
		case "pieChart":
		case "pie3DChart":
			Object.assign(chart, { data: {
				columns: Object.values(((_a = chartData[0]) === null || _a === void 0 ? void 0 : _a.xlabels) || {}).map((value, index) => {
					var _a, _b, _c;
					return [value, (_c = (_b = (_a = chartData[0]) === null || _a === void 0 ? void 0 : _a.values) === null || _b === void 0 ? void 0 : _b[index]) === null || _c === void 0 ? void 0 : _c.y];
				}),
				type: pie()
			} });
			break;
		case "areaChart":
			Object.assign(chart, {
				data: {
					columns: chartData.map((item) => [item.key, ...item.values.map(({ y }) => y)]),
					type: area()
				},
				axis,
				interaction: { enabled: true }
			});
			break;
		case "scatterChart":
			Object.assign(chart, {
				data: {
					xs: { y: "x" },
					columns: chartData.map((item, index) => [index ? "y" : "x", ...item]),
					type: scatter()
				},
				axis: {
					x: {
						label: "X",
						showDist: true,
						tick: { format: d3Format.format(".02f") }
					},
					y: {
						label: "Y",
						showDist: true,
						tick: { format: d3Format.format(".02f") }
					}
				}
			});
			break;
		default: return;
	}
	if (chart.data) return bb.generate(chart);
};
var renderPptxPostProcessing = async (charts, root) => {
	restoreNumericBullets(root);
	fitOverflowingTextBlocks(root);
	const queue = asChartQueue(charts);
	const chartInstances = [];
	if (queue.length) {
		const results = await Promise.allSettled(queue.map((message) => renderChart(message, root)));
		for (const result of results) if (result.status === "fulfilled") {
			if (result.value) chartInstances.push(result.value);
		} else console.warn("PPTX chart rendering skipped:", result.reason);
	}
	let destroyed = false;
	return { destroy() {
		var _a;
		if (destroyed) return;
		destroyed = true;
		for (const chart of chartInstances) try {
			(_a = chart.destroy) === null || _a === void 0 || _a.call(chart);
		} catch {}
		chartInstances.length = 0;
	} };
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/options.js
var RECOMMENDED_ZIP_LIMITS = { maxFileBytes: 167772160 };
var createDefaultPptxOptions = () => ({
	slidesScale: "",
	slideMode: false,
	slideType: "divs2slidesjs",
	revealjsPath: "",
	keyBoardShortCut: false,
	mediaProcess: true,
	jsZipV2: false,
	themeProcess: true,
	incSlide: {
		width: 0,
		height: 0
	},
	slideModeConfig: {
		first: 1,
		nav: true,
		navTxtColor: "black",
		keyBoardShortCut: true,
		showSlideNum: true,
		showTotalSlideNum: true,
		autoSlide: true,
		randomAutoSlide: false,
		loop: false,
		background: false,
		transition: "default",
		transitionTime: 1
	},
	revealjsConfig: {}
});
var resolvePptxEngineOptions = (options) => {
	var _a, _b, _c, _d, _e, _f, _g, _h;
	const defaults = createDefaultPptxOptions();
	return {
		...defaults,
		...options,
		incSlide: {
			width: (_d = (_b = (_a = options === null || options === void 0 ? void 0 : options.incSlide) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : (_c = defaults.incSlide) === null || _c === void 0 ? void 0 : _c.width) !== null && _d !== void 0 ? _d : 0,
			height: (_h = (_f = (_e = options === null || options === void 0 ? void 0 : options.incSlide) === null || _e === void 0 ? void 0 : _e.height) !== null && _f !== void 0 ? _f : (_g = defaults.incSlide) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : 0
		},
		slideModeConfig: {
			...defaults.slideModeConfig,
			...options === null || options === void 0 ? void 0 : options.slideModeConfig
		},
		revealjsConfig: {
			...defaults.revealjsConfig,
			...options === null || options === void 0 ? void 0 : options.revealjsConfig
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/presentation.js
var clamp$1 = (value, min, max) => Math.min(Math.max(value, min), max);
/**
* Full-screen slideshow for a rendered PPTX deck.
*
* The slides stay where the viewer put them: the whole scale box is moved into an overlay and the
* inactive slots are hidden with CSS, so the engine's scoped `.flyfish-pptx-content .slide` rules
* keep applying and no node is cloned. A placeholder marks the original position so exiting puts
* everything back exactly where it was.
*/
var PptxPresentation = class {
	constructor(viewer, labels = {}, fullscreen = true) {
		this.overlay = null;
		this.stage = null;
		this.counter = null;
		this.placeholder = null;
		this.listeners = [];
		this.layoutFrame = 0;
		this.ownsFullscreen = false;
		this.current = 1;
		this.viewer = viewer;
		this.labels = labels;
		this.fullscreen = fullscreen;
	}
	get active() {
		return Boolean(this.overlay);
	}
	get slideNumber() {
		return this.current;
	}
	get state() {
		return {
			active: this.active,
			slideNumber: this.current,
			total: this.viewer.slideCount
		};
	}
	async enter(slideNumber = this.current) {
		var _a, _b;
		if (this.active || this.viewer.slideCount === 0) return;
		const documentRef = this.viewer.target.ownerDocument || document;
		const overlay = documentRef.createElement("div");
		overlay.className = "flyfish-pptx-presentation";
		overlay.tabIndex = -1;
		overlay.setAttribute("role", "region");
		overlay.setAttribute("aria-label", this.labels.hint || "Slideshow");
		const stage = documentRef.createElement("div");
		stage.className = "flyfish-pptx-presentation-stage";
		const counter = documentRef.createElement("div");
		counter.className = "flyfish-pptx-presentation-counter";
		const hint = documentRef.createElement("div");
		hint.className = "flyfish-pptx-presentation-hint";
		hint.textContent = this.labels.hint || "";
		hint.hidden = !this.labels.hint;
		const exit = documentRef.createElement("button");
		exit.type = "button";
		exit.className = "flyfish-pptx-presentation-exit";
		exit.textContent = "✕";
		exit.setAttribute("aria-label", this.labels.exit || "Exit slideshow");
		exit.addEventListener("click", (event) => {
			event.stopPropagation();
			this.exit();
		});
		overlay.append(stage, counter, hint, exit);
		this.overlay = overlay;
		this.stage = stage;
		this.counter = counter;
		this.viewer.presentationRoot.appendChild(overlay);
		this.placeholder = documentRef.createComment("flyfish-pptx-presentation");
		this.viewer.saveScrollPosition();
		this.viewer.scaleBox.replaceWith(this.placeholder);
		stage.appendChild(this.viewer.scaleBox);
		this.viewer.content.classList.add("is-presenting");
		this.attach(documentRef, overlay);
		this.goTo(slideNumber);
		if (this.fullscreen) try {
			await ((_a = overlay.requestFullscreen) === null || _a === void 0 ? void 0 : _a.call(overlay));
			this.ownsFullscreen = this.isFullscreenElement(overlay);
		} catch {
			this.ownsFullscreen = false;
		}
		if (this.overlay !== overlay) {
			if (this.ownsFullscreen) (_b = documentRef.exitFullscreen) === null || _b === void 0 || _b.call(documentRef).catch(() => void 0);
			this.ownsFullscreen = false;
			return;
		}
		overlay.focus({ preventScroll: true });
		this.scheduleLayout();
		this.notify();
	}
	exit() {
		var _a, _b;
		const overlay = this.overlay;
		if (!overlay) return;
		const documentRef = this.viewer.target.ownerDocument || document;
		const shouldExitFullscreen = this.ownsFullscreen && this.isFullscreenElement(overlay);
		this.detach();
		if (this.layoutFrame) {
			(documentRef.defaultView || window).cancelAnimationFrame(this.layoutFrame);
			this.layoutFrame = 0;
		}
		this.viewer.content.classList.remove("is-presenting");
		for (const container of this.slideContainers()) container.classList.remove("is-active-slide");
		if ((_a = this.placeholder) === null || _a === void 0 ? void 0 : _a.parentNode) this.placeholder.replaceWith(this.viewer.scaleBox);
		else this.viewer.target.appendChild(this.viewer.scaleBox);
		this.placeholder = null;
		overlay.remove();
		this.overlay = null;
		this.stage = null;
		this.counter = null;
		if (shouldExitFullscreen) (_b = documentRef.exitFullscreen) === null || _b === void 0 || _b.call(documentRef).catch(() => void 0);
		this.ownsFullscreen = false;
		this.viewer.restoreScrollPosition();
		this.notify();
	}
	async toggle(slideNumber) {
		if (this.active) {
			this.exit();
			return;
		}
		await this.enter(slideNumber);
	}
	goTo(slideNumber) {
		const total = this.viewer.slideCount;
		if (total === 0) return;
		this.current = clamp$1(Math.round(slideNumber) || 1, 1, total);
		this.viewer.ensureSlideRendered(this.current);
		this.viewer.ensureSlideRendered(this.current + 1);
		const containers = this.slideContainers();
		const byNumber = containers.some((container) => Boolean(container.dataset.slideNumber));
		containers.forEach((container, index) => {
			const isActive = byNumber ? Number(container.dataset.slideNumber) === this.current : index === this.current - 1;
			container.classList.toggle("is-active-slide", isActive);
		});
		if (this.counter) this.counter.textContent = `${this.current} / ${total}`;
		if (this.active) {
			this.scheduleLayout();
			this.notify();
		}
	}
	next() {
		if (this.current < this.viewer.slideCount) this.goTo(this.current + 1);
	}
	previous() {
		if (this.current > 1) this.goTo(this.current - 1);
	}
	/** Scale the active slide to fit the overlay, letterboxing whichever axis has slack. */
	layout() {
		const overlay = this.overlay;
		if (!overlay) return;
		const container = this.slideContainers().find((item, index) => {
			if (item.dataset.slideNumber) return Number(item.dataset.slideNumber) === this.current;
			return index === this.current - 1;
		});
		const slide = container && container.classList.contains("flyfish-pptx-slide-slot") ? container.firstElementChild : container;
		const size = this.viewer.slideDimensions;
		const slideWidth = (slide === null || slide === void 0 ? void 0 : slide.offsetWidth) || (size === null || size === void 0 ? void 0 : size.width) || 0;
		const slideHeight = (slide === null || slide === void 0 ? void 0 : slide.offsetHeight) || (size === null || size === void 0 ? void 0 : size.height) || 0;
		if (!slideWidth || !slideHeight) return;
		const viewWidth = overlay.clientWidth;
		const viewHeight = overlay.clientHeight;
		const scale = Math.min(viewWidth / slideWidth, viewHeight / slideHeight);
		const offsetX = Math.max(0, (viewWidth - slideWidth * scale) / 2);
		const offsetY = Math.max(0, (viewHeight - slideHeight * scale) / 2);
		const content = this.viewer.content;
		content.style.width = `${slideWidth}px`;
		content.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
		const scaleBox = this.viewer.scaleBox;
		scaleBox.style.width = "100%";
		scaleBox.style.height = "100%";
		scaleBox.style.minHeight = "";
	}
	destroy() {
		this.exit();
	}
	slots() {
		return Array.from(this.viewer.content.querySelectorAll(":scope > .flyfish-pptx-slide-slot"));
	}
	/**
	* The nodes the slideshow toggles between. Windowed decks wrap each slide in a
	* slot; the default (non-windowed) deck appends slides directly to the content
	* node, so those are the containers there.
	*/
	slideContainers() {
		const slots = this.slots();
		if (slots.length > 0) return slots;
		return Array.from(this.viewer.content.querySelectorAll(":scope > .slide"));
	}
	/**
	* Chromium reports the fullscreen element of a shadow root on the shadow root
	* itself while document.fullscreenElement stays on the host, so both have to
	* be checked before deciding who owns fullscreen.
	*/
	isFullscreenElement(overlay) {
		const documentRef = this.viewer.target.ownerDocument || document;
		if (documentRef.fullscreenElement === overlay) return true;
		const root = overlay.getRootNode();
		if (root !== documentRef && "fullscreenElement" in root) return root.fullscreenElement === overlay;
		return false;
	}
	scheduleLayout() {
		const view = this.viewer.target.ownerDocument.defaultView || window;
		if (this.layoutFrame) view.cancelAnimationFrame(this.layoutFrame);
		this.layoutFrame = view.requestAnimationFrame(() => {
			this.layoutFrame = 0;
			this.layout();
		});
	}
	notify() {
		this.viewer.emitPresentationChange(this.state);
	}
	on(target, type, listener) {
		target.addEventListener(type, listener);
		this.listeners.push({
			target,
			type,
			listener
		});
	}
	attach(documentRef, overlay) {
		const view = documentRef.defaultView || window;
		this.on(documentRef, "keydown", (event) => this.handleKey(event));
		this.on(overlay, "click", (event) => this.handleClick(event));
		this.on(overlay, "contextmenu", (event) => {
			event.preventDefault();
			this.previous();
		});
		this.on(view, "resize", () => this.scheduleLayout());
		this.on(documentRef, "fullscreenchange", () => {
			if (this.ownsFullscreen && !this.isFullscreenElement(overlay)) {
				this.ownsFullscreen = false;
				this.exit();
			}
		});
	}
	detach() {
		for (const { target, type, listener } of this.listeners) target.removeEventListener(type, listener);
		this.listeners = [];
	}
	handleClick(event) {
		var _a;
		const overlay = this.overlay;
		if (!overlay || ((_a = event.target) === null || _a === void 0 ? void 0 : _a.closest(".flyfish-pptx-presentation-exit"))) return;
		const bounds = overlay.getBoundingClientRect();
		if ((event.clientX - bounds.left) / (bounds.width || 1) < .2) this.previous();
		else this.next();
	}
	handleKey(event) {
		if (!this.active || event.altKey || event.metaKey || event.ctrlKey) return;
		const target = event.target;
		if (target && typeof target.closest === "function" && target.closest("button, a, input, textarea, select, [contenteditable=\"true\"], [contenteditable=\"\"]")) return;
		if (target && typeof target.closest === "function") {
			const otherOverlay = target.closest(".flyfish-pptx-presentation");
			if (otherOverlay && otherOverlay !== this.overlay) return;
		}
		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
			case "PageDown":
			case " ":
			case "Enter":
				event.preventDefault();
				this.next();
				break;
			case "ArrowLeft":
			case "ArrowUp":
			case "PageUp":
			case "Backspace":
				event.preventDefault();
				this.previous();
				break;
			case "Home":
				event.preventDefault();
				this.goTo(1);
				break;
			case "End":
				event.preventDefault();
				this.goTo(this.viewer.slideCount);
				break;
			case "Escape":
				event.preventDefault();
				this.exit();
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/sanitize.js
var PPTX_CONTENT_STYLE_SCOPE$1 = ".flyfish-pptx-content";
var GENERATED_STYLE_RULE = /\s*(\._(?:css|svg_css|tbl_cell_css)_[A-Za-z0-9_-]+)\s*\{([^{}]*)\}/y;
var purifierByDocument = /* @__PURE__ */ new WeakMap();
var createSafeFallbackFragment = (documentRef) => {
	const fragment = documentRef.createDocumentFragment();
	const fallback = documentRef.createElement("section");
	fallback.className = "slide flyfish-pptx-slide-error";
	fallback.textContent = "This slide could not be displayed safely.";
	fragment.append(fallback);
	return fragment;
};
var getPurifier = (documentRef) => {
	const cached = purifierByDocument.get(documentRef);
	if (cached) return cached;
	const windowRef = documentRef.defaultView;
	if (!windowRef) return null;
	const purifier = purify(windowRef);
	if (!purifier.isSupported) return null;
	purifierByDocument.set(documentRef, purifier);
	return purifier;
};
var isAllowedCssUrl = (value) => {
	const target = value.trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2").trim();
	if (/^#[A-Za-z0-9_.:-]+$/.test(target)) return true;
	return /^data:image\/[A-Za-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/i.test(target);
};
var isSafeEmbeddedResourceUrl = (value, allowFragment) => {
	const normalized = value.trim();
	if (allowFragment && /^#[A-Za-z0-9_.:-]+$/.test(normalized)) return true;
	if (/^blob:/i.test(normalized)) return true;
	return /^data:image\/[A-Za-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/i.test(normalized);
};
var isSafeCssValue = (value) => {
	const normalized = value.replace(/\/\*[\s\S]*?\*\//g, "").trim();
	if (/(?:expression|image(?:-set)?|paint|var)\s*\(/i.test(normalized) || /(?:javascript|vbscript)\s*:/i.test(normalized) || /(?:^|[^-])behavior\s*:/i.test(normalized) || /-moz-binding/i.test(normalized) || normalized.includes("\\")) return false;
	let unsafeUrl = false;
	const withoutUrls = normalized.replace(/url\(\s*([^)]*?)\s*\)/gi, (_match, target) => {
		if (!isAllowedCssUrl(target)) unsafeUrl = true;
		return "";
	});
	return !unsafeUrl && !/url\s*\(/i.test(withoutUrls);
};
var sanitizeStyleDeclaration = (documentRef, cssText) => {
	const probe = documentRef.createElement("span");
	probe.setAttribute("style", cssText);
	const style = probe.style;
	const propertyNames = Array.from({ length: style.length }, (_, index) => style.item(index));
	for (const propertyName of propertyNames) {
		const value = style.getPropertyValue(propertyName);
		if (!propertyName || propertyName.startsWith("--") || propertyName === "behavior" || propertyName === "-moz-binding" || propertyName === "position" && /^(?:fixed|sticky)$/i.test(value.trim()) || !isSafeCssValue(value)) style.removeProperty(propertyName);
	}
	return style.cssText;
};
var sanitizeStyleAttributes = (documentRef, root) => {
	root.querySelectorAll("[style]").forEach((element) => {
		const sanitized = sanitizeStyleDeclaration(documentRef, element.getAttribute("style") || "");
		if (sanitized) element.setAttribute("style", sanitized);
		else element.removeAttribute("style");
	});
};
var sanitizeEmbeddedResourceUrls = (root) => {
	root.querySelectorAll("[src],[srcset],[poster],[href],[xlink\\:href]").forEach((element) => {
		for (const attributeName of [
			"src",
			"srcset",
			"poster",
			"href",
			"xlink:href"
		]) {
			if (!element.hasAttribute(attributeName)) continue;
			if (element.namespaceURI === "http://www.w3.org/1999/xhtml" && element.localName === "a" && attributeName === "href") continue;
			const allowFragment = element.namespaceURI === "http://www.w3.org/2000/svg" && (attributeName === "href" || attributeName === "xlink:href");
			if (!isSafeEmbeddedResourceUrl(element.getAttribute(attributeName) || "", allowFragment)) element.removeAttribute(attributeName);
		}
	});
};
var sanitizeSvgUrlAttributes = (root) => {
	root.querySelectorAll("svg, svg *").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) {
			const value = attribute.value;
			if (/url\s*\(/i.test(value) && !isSafeCssValue(value)) element.removeAttribute(attribute.name);
		}
	});
};
var sanitizePptxCss = (documentRef, cssText) => {
	const rules = [];
	let offset = 0;
	while (offset < cssText.length) {
		if (!cssText.slice(offset).trim()) break;
		GENERATED_STYLE_RULE.lastIndex = offset;
		const match = GENERATED_STYLE_RULE.exec(cssText);
		if (!match) return "";
		const declarations = sanitizeStyleDeclaration(documentRef, match[2]);
		if (declarations) rules.push(`${PPTX_CONTENT_STYLE_SCOPE$1} ${match[1]}{${declarations}}`);
		offset = GENERATED_STYLE_RULE.lastIndex;
	}
	return rules.join("\n");
};
var sanitizePptxMarkup = (documentRef, html) => {
	const purifier = getPurifier(documentRef);
	if (!purifier) return createSafeFallbackFragment(documentRef);
	const fragment = purifier.sanitize(html, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: {
			html: true,
			svg: true,
			svgFilters: true
		},
		ADD_ATTR: ["target"],
		FORBID_TAGS: [
			"script",
			"style",
			"iframe",
			"object",
			"embed",
			"form"
		],
		FORBID_ATTR: ["srcdoc"]
	});
	sanitizeStyleAttributes(documentRef, fragment);
	sanitizeEmbeddedResourceUrls(fragment);
	sanitizeSvgUrlAttributes(fragment);
	fragment.querySelectorAll("a[target]").forEach((anchor) => {
		if ((anchor.getAttribute("target") || "").trim().toLowerCase() === "_blank") anchor.rel = "noopener noreferrer";
	});
	return fragment;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/styles.js
var legacyPptxCss = `
.slide{position:relative;border:0;border-radius:0;overflow:hidden;margin-bottom:50px;margin-left:auto;margin-right:auto;z-index:100}
.slide div.block{position:absolute;top:0;left:0;width:100%;line-height:1}
.slide div.content{display:flex;flex-direction:column}
.slide div.diagram-content{display:flex;flex-direction:column}
.slide div.content-rtl{display:flex;flex-direction:column;direction:rtl}
.slide .pregraph-rtl{direction:rtl}
.slide .pregraph-ltr{direction:ltr}
.slide .pregraph-inherit{direction:inherit}
.slide .slide-prgrph{width:100%}
.slide .line-break-br::before{content:"\\A";white-space:pre}
.slide div.v-up{justify-content:flex-start}
.slide div.v-mid{justify-content:center}
.slide div.v-down{justify-content:flex-end}
.slide div.h-left{justify-content:flex-start;align-items:flex-start;text-align:left}
.slide div.h-left-rtl{justify-content:flex-end;align-items:flex-end;text-align:left}
.slide div.h-mid{justify-content:center;align-items:center;text-align:center}
.slide div.h-right{justify-content:flex-end;align-items:flex-end;text-align:right}
.slide div.h-right-rtl{justify-content:flex-start;align-items:flex-start;text-align:right}
.slide div.h-just,.slide div.h-dist{text-align:justify}
.slide div.up-left{justify-content:flex-start;align-items:flex-start;text-align:left}
.slide div.up-center{justify-content:flex-start;align-items:center}
.slide div.up-right{justify-content:flex-start;align-items:flex-end}
.slide div.center-left{justify-content:center;align-items:flex-start;text-align:left}
.slide div.center-center{justify-content:center;align-items:center}
.slide div.center-right{justify-content:center;align-items:flex-end}
.slide div.down-left{justify-content:flex-end;align-items:flex-start;text-align:left}
.slide div.down-center{justify-content:flex-end;align-items:center}
.slide div.down-right{justify-content:flex-end;align-items:flex-end}
.slide li.slide{margin:10px 0;font-size:18px}
.slide table{position:absolute;table-layout:fixed;box-sizing:border-box;overflow:hidden}
.slide table tr,.slide table td{box-sizing:border-box;min-width:0;overflow:hidden}
.slide .pptx-table-cell-content{box-sizing:border-box;min-height:0;overflow:hidden}
.slide svg.drawing{position:absolute;overflow:visible}
`;
var PPTX_CONTENT_STYLE_SCOPE = ".flyfish-pptx-content";
/**
* The legacy engine emits class-only selector lists. Prefix each top-level
* class rule so light-DOM consumers do not inherit generic `.slide` or
* generated `._css_*` rules from a renderer-local style element.
*/
var scopePptxContentStyleText = (cssText) => cssText.replace(/(^|})\s*(\.[^{}]+)\{/g, (_match, boundary, selectorList) => {
	return `${boundary}${selectorList.split(",").map((selector) => `${PPTX_CONTENT_STYLE_SCOPE} ${selector.trim()}`).join(",")}{`;
});
var pptxViewerCss = `
.flyfish-pptx-scale-box{position:relative;box-sizing:border-box;max-width:100%;margin:0 auto;min-width:0}
.flyfish-pptx-content{position:absolute;top:0;left:0;box-sizing:border-box;max-width:none;min-width:0;transform-origin:top left;will-change:transform}
.flyfish-pptx-content[data-render-state="loading"]{opacity:.82}
.flyfish-pptx-slide-slot{display:flow-root;box-sizing:border-box;width:100%;min-width:0}
.flyfish-pptx-slide-error{display:flex;align-items:center;justify-content:center;background:#fff7ed!important;color:#9a3412}
.flyfish-pptx-slide-error-card{display:grid;gap:10px;max-width:70%;padding:24px;border:1px solid #fdba74;border-radius:12px;background:#fff;text-align:center;font:14px/1.5 system-ui,sans-serif}
.flyfish-pptx-slide-error-card strong{font-size:18px}
.flyfish-pptx-content .slide{background:#fff;box-shadow:0 18px 36px rgba(18,35,52,.12)}
.flyfish-pptx-thumbnail{display:block;box-sizing:border-box;width:min(960px,100%);height:auto;margin:0 auto 28px;border-radius:12px;background:#fff;box-shadow:0 18px 36px rgba(18,35,52,.14)}
${scopePptxContentStyleText(legacyPptxCss)}
.flyfish-pptx-content > .slide:last-of-type{margin-bottom:0}
.flyfish-pptx-slide-slot:last-of-type > .slide{margin-bottom:0}
.flyfish-pptx-presentation{position:fixed;inset:0;z-index:2147483000;display:block;overflow:hidden;background:#000;cursor:default;user-select:none;-webkit-user-select:none}
.flyfish-pptx-presentation:focus{outline:none}
.flyfish-pptx-presentation-stage{position:absolute;inset:0;overflow:hidden}
.flyfish-pptx-presentation .flyfish-pptx-scale-box{position:absolute;inset:0;width:100%;height:100%;margin:0}
.flyfish-pptx-presentation .flyfish-pptx-thumbnail{display:none}
.flyfish-pptx-content.is-presenting > .flyfish-pptx-slide-slot{display:none;min-height:0}
.flyfish-pptx-content.is-presenting > .flyfish-pptx-slide-slot.is-active-slide{display:flow-root}
.flyfish-pptx-content.is-presenting > .slide{display:none}
.flyfish-pptx-content.is-presenting > .slide.is-active-slide{display:block}
.flyfish-pptx-content.is-presenting .slide{margin:0!important;box-shadow:none}
.flyfish-pptx-presentation-counter{position:absolute;right:18px;bottom:14px;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font:13px/1.4 system-ui,sans-serif;letter-spacing:.02em;pointer-events:none}
.flyfish-pptx-presentation-hint{position:absolute;left:18px;bottom:14px;color:rgba(255,255,255,.55);font:12px/1.4 system-ui,sans-serif;pointer-events:none}
.flyfish-pptx-presentation-hint[hidden]{display:none}
.flyfish-pptx-presentation-exit{position:absolute;top:14px;right:14px;width:34px;height:34px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-size:15px;line-height:1;cursor:pointer}
.flyfish-pptx-presentation-exit:hover{background:rgba(255,255,255,.26)}
.flyfish-pptx-presentation-exit:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media (prefers-reduced-motion:no-preference){.flyfish-pptx-content.is-presenting > .flyfish-pptx-slide-slot.is-active-slide,.flyfish-pptx-content.is-presenting > .slide.is-active-slide{animation:flyfish-pptx-slide-in 140ms ease-out}}
@keyframes flyfish-pptx-slide-in{from{opacity:.35}to{opacity:1}}
`;
var PPTX_STYLE_ID = "flyfish-pptx-native-style";
var ensurePptxViewerStyles = (documentRef, root = documentRef) => {
	if (root instanceof Document && root.getElementById(PPTX_STYLE_ID)) return;
	if (!(root instanceof Document) && root.querySelector(`#${PPTX_STYLE_ID}`)) return;
	const style = documentRef.createElement("style");
	style.id = PPTX_STYLE_ID;
	style.textContent = pptxViewerCss;
	if (root instanceof Document) {
		(root.head || root.documentElement).appendChild(style);
		return;
	}
	root.appendChild(style);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/worker-location.js
/** Distinguish an emitted asset from an untouched dependency-relative URL. */
var isResolvedPptxWorkerLocation = (moduleUrl, assetUrl) => {
	const relativePath = ["worker", "pptx.worker.js"].join("/");
	const dependencyRelativeUrl = new URL(relativePath, moduleUrl);
	return assetUrl.href !== dependencyRelativeUrl.href || /\/dist\/worker\.[cm]?js$/.test(moduleUrl.pathname);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/worker.js
var viteOptimizedWorkerPathPattern = /\/\.?vite\/deps\/worker\/pptx\.worker\.js$/;
var viteSourceWorkerModulePattern = /\/src\/worker\.[cm]?[jt]s$/;
var angularCachePath = "/.angular/cache/";
var viteOptimizedPptxSourcePattern = /\/\/\s+(node_modules\/(?:\.pnpm\/[^\n]+?\/node_modules\/)?@file-viewer\/pptx\/dist\/worker\.js)\b/;
var resolveBundledPptxWorkerUrl = () => {
	const moduleUrl = new URL(import.meta.url);
	if (viteSourceWorkerModulePattern.test(moduleUrl.pathname)) return new URL("../dist/worker/pptx.worker.js", moduleUrl);
	return new URL("../../../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/worker/pptx.worker.js", import.meta.url);
};
var resolveAngularVitePptxWorkerUrl = (baseUrl, workerPath) => {
	const cacheIndex = baseUrl.pathname.indexOf(angularCachePath);
	if (cacheIndex < 0) return null;
	const workerUrl = new URL(baseUrl.href);
	workerUrl.pathname = `${workerUrl.pathname.slice(0, cacheIndex)}/${workerPath}`;
	workerUrl.search = "";
	workerUrl.hash = "";
	return workerUrl;
};
var resolveViteOptimizedPptxWorkerUrl = (defaultPptxWorkerUrl) => {
	if (typeof XMLHttpRequest === "undefined") return null;
	try {
		const request = new XMLHttpRequest();
		request.open("GET", import.meta.url, false);
		request.send(null);
		if (request.status > 0 && request.status < 200 || request.status >= 400) return null;
		const match = viteOptimizedPptxSourcePattern.exec(request.responseText || "");
		if (!match) return null;
		const workerPath = match[1].replace(/dist\/worker\.js$/, "dist/worker/pptx.worker.js");
		const angularWorkerUrl = resolveAngularVitePptxWorkerUrl(defaultPptxWorkerUrl, workerPath);
		if (angularWorkerUrl) return angularWorkerUrl;
		return `${typeof location !== "undefined" && location.origin ? location.origin : defaultPptxWorkerUrl.origin}/${workerPath}`;
	} catch {
		return null;
	}
};
var resolvePptxWorkerUrl = (allowDependencyRelativeUrl) => {
	try {
		const moduleUrl = new URL(import.meta.url);
		const workerUrl = resolveBundledPptxWorkerUrl();
		if (isResolvedPptxWorkerLocation(moduleUrl, workerUrl)) return workerUrl.href;
		if (viteOptimizedWorkerPathPattern.test(workerUrl.pathname)) {
			const optimizedUrl = resolveViteOptimizedPptxWorkerUrl(workerUrl);
			return optimizedUrl ? String(optimizedUrl) : void 0;
		}
		return allowDependencyRelativeUrl ? workerUrl.href : void 0;
	} catch {}
};
/** Returns only a Worker URL that the active bundler has emitted or serves directly. */
var resolvePptxPackageWorkerUrl = () => {
	return resolvePptxWorkerUrl(false);
};
var createPptxWorker = (options = {}) => {
	var _a;
	if (options.workerFactory) return options.workerFactory();
	if (options.workerUrl) return new Worker(options.workerUrl, { type: (_a = options.workerType) !== null && _a !== void 0 ? _a : "module" });
	const workerUrl = resolvePptxWorkerUrl(true);
	if (!workerUrl) throw new Error("PPTX Worker URL is unavailable. Run file-viewer-copy-assets or provide workerUrl.");
	return new Worker(workerUrl, { type: "module" });
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+pptx@3.1.2/node_modules/@file-viewer/pptx/dist/viewer.js
var clamp = (value, min, max) => {
	return Math.min(max, Math.max(min, value));
};
var toPercent = (value) => {
	return clamp(typeof value === "number" && Number.isFinite(value) ? value : 100, 25, 300);
};
var stringifyErrorDetail = (error) => {
	if (error === void 0 || error === null) return "";
	if (typeof error === "string") return error;
	if (error instanceof Error && error.message) return error.message;
	try {
		const serialized = JSON.stringify(error);
		return serialized && serialized !== "{}" ? serialized : String(error);
	} catch {
		return String(error);
	}
};
var createPptxDiagnosticError = (code, stage, message, detailOrError, hint) => ({
	name: "PptxDiagnosticError",
	code,
	stage,
	message,
	detail: stringifyErrorDetail(detailOrError),
	hint
});
var ensureZipWithinLimits = (buffer, options) => {
	const limits = {
		...RECOMMENDED_ZIP_LIMITS,
		...options.zipLimits
	};
	if (limits.maxFileBytes && buffer.byteLength > limits.maxFileBytes) throw createPptxDiagnosticError("PPTX_FILE_TOO_LARGE", "preflight", "PPTX 文件超过浏览器安全预览体积限制。", `${buffer.byteLength} bytes > ${limits.maxFileBytes} bytes`, "请压缩图片、拆分演示文稿，或在业务侧提高 zipLimits.maxFileBytes 后再预览。");
};
var appendHtml = (container, html) => {
	const fragment = sanitizePptxMarkup(container.ownerDocument, html);
	const nodes = Array.from(fragment.children);
	container.append(fragment);
	return nodes[0] || null;
};
var escapeHtml = (value) => String(value !== null && value !== void 0 ? value : "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var buildSlideErrorHtml = (slideNumber, error) => {
	const diagnostic = error && typeof error === "object" ? error : null;
	return `<section class="slide flyfish-pptx-slide-error" data-slide-index="${slideNumber}"><div class="flyfish-pptx-slide-error-card" role="status"><strong>Slide ${slideNumber}</strong><span>${escapeHtml((diagnostic === null || diagnostic === void 0 ? void 0 : diagnostic.message) || stringifyErrorDetail(error) || "This slide could not be rendered.")}</span></div></section>`;
};
var DEFAULT_INITIAL_SLIDES = 3;
var DEFAULT_BATCH_SIZE = 4;
var DEFAULT_OVERSCAN_VIEWPORTS = 1.5;
var DEFAULT_SLIDE_HEIGHT = 540;
var DEFAULT_SLIDE_GAP = 50;
var toPositiveInteger = (value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) => {
	return clamp(typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback, min, max);
};
var toPositiveNumber = (value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) => {
	return clamp(typeof value === "number" && Number.isFinite(value) ? value : fallback, min, max);
};
var PptxViewer = class PptxViewer {
	static async open(buffer, target, options = {}) {
		const viewer = new PptxViewer(buffer, target, options);
		await viewer.open();
		return viewer;
	}
	constructor(buffer, target, options) {
		this.worker = null;
		this.resizeObserver = null;
		this.resizeFrame = 0;
		this.fitScale = 1;
		this.userZoomPercent = 100;
		this.currentZoomPercent = 100;
		this.thumbnailElement = null;
		this.previewThumbnailDataUrl = null;
		this.slideSize = null;
		this.slideRecords = [];
		this.totalSlides = 0;
		this.savedScroll = null;
		this.pendingScrollRestore = null;
		this.slideWindowTarget = null;
		this.slideWindowListeners = [];
		this.slideWindowFrame = 0;
		this.charts = null;
		this.chartHandles = /* @__PURE__ */ new Set();
		this.mediaRecords = /* @__PURE__ */ new Map();
		this.disposed = false;
		this.completed = false;
		this.presentation = null;
		this.handleSlideWindowChange = () => this.scheduleSlideWindowUpdate();
		this.buffer = buffer;
		this.target = target;
		this.options = options;
		this.userZoomPercent = toPercent(options.zoomPercent);
		this.currentZoomPercent = this.userZoomPercent;
		const documentRef = target.ownerDocument || document;
		this.scaleBox = documentRef.createElement("div");
		this.scaleBox.className = "flyfish-pptx-scale-box";
		this.content = documentRef.createElement("div");
		this.content.className = "flyfish-pptx-content";
		this.content.dataset.renderState = "loading";
		this.scaleBox.append(this.content);
	}
	get zoomPercent() {
		return Math.round(this.currentZoomPercent);
	}
	get thumbnailDataUrl() {
		return this.previewThumbnailDataUrl;
	}
	get slideCount() {
		return this.totalSlides;
	}
	get slideDimensions() {
		var _a, _b;
		const width = Number((_a = this.slideSize) === null || _a === void 0 ? void 0 : _a.width);
		const height = Number((_b = this.slideSize) === null || _b === void 0 ? void 0 : _b.height);
		return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 ? {
			width,
			height
		} : null;
	}
	get presenting() {
		var _a;
		return Boolean((_a = this.presentation) === null || _a === void 0 ? void 0 : _a.active);
	}
	get presentationSlideNumber() {
		var _a, _b;
		return (_b = (_a = this.presentation) === null || _a === void 0 ? void 0 : _a.slideNumber) !== null && _b !== void 0 ? _b : 1;
	}
	get styleRoot() {
		var _a;
		if (this.options.styleRoot) return this.options.styleRoot;
		const documentRef = this.target.ownerDocument || document;
		const root = this.target.getRootNode();
		const ShadowRootCtor = (_a = documentRef.defaultView) === null || _a === void 0 ? void 0 : _a.ShadowRoot;
		return ShadowRootCtor && root instanceof ShadowRootCtor ? root : documentRef;
	}
	/**
	* Where the slideshow overlay is mounted. It has to share a root with the injected slide styles,
	* or the engine's scoped CSS stops applying once the slides move into the overlay.
	*/
	get presentationRoot() {
		const documentRef = this.target.ownerDocument || document;
		const styleRoot = this.styleRoot;
		if (styleRoot !== documentRef) return styleRoot;
		return documentRef.body || documentRef.documentElement;
	}
	/** Force a slide out of the virtualized window so the slideshow can show it immediately. */
	ensureSlideRendered(slideNumber) {
		const record = this.slideRecords.find((item) => item.slideNumber === slideNumber);
		if (!record) return null;
		if (!record.rendered) this.renderSlideRecord(record);
		return record.element;
	}
	refreshLayout() {
		this.scheduleResize();
	}
	/**
	* Remember where the deck was scrolled before the slideshow moves the scale
	* box into the overlay. Moving it collapses the scroller and clamps scrollTop
	* to zero, so the position has to be captured up front and restored on exit.
	*/
	saveScrollPosition() {
		const view = this.target.ownerDocument.defaultView || window;
		const HTMLElementCtor = view.HTMLElement;
		const scroller = this.slideWindowTarget || this.findSlideWindowTarget();
		if (scroller instanceof HTMLElementCtor) this.savedScroll = {
			top: scroller.scrollTop,
			left: scroller.scrollLeft
		};
		else this.savedScroll = {
			top: view.scrollY,
			left: view.scrollX
		};
	}
	restoreScrollPosition() {
		if (this.savedScroll) {
			this.pendingScrollRestore = this.savedScroll;
			this.savedScroll = null;
		}
		this.scheduleResize();
	}
	emitPresentationChange(state) {
		var _a, _b;
		(_b = (_a = this.options).onPresentationChange) === null || _b === void 0 || _b.call(_a, state);
	}
	async enterPresentation(slideNumber) {
		if (this.disposed || this.totalSlides === 0) return;
		this.presentation || (this.presentation = new PptxPresentation(this, this.options.presentationLabels, this.options.presentationFullscreen));
		await this.presentation.enter(slideNumber);
	}
	exitPresentation() {
		var _a;
		(_a = this.presentation) === null || _a === void 0 || _a.exit();
	}
	async togglePresentation(slideNumber) {
		if (this.presenting) {
			this.exitPresentation();
			return;
		}
		await this.enterPresentation(slideNumber);
	}
	async open() {
		ensureZipWithinLimits(this.buffer, this.options);
		ensurePptxViewerStyles(this.target.ownerDocument || document, this.styleRoot);
		this.target.replaceChildren(this.scaleBox);
		this.attachResizeObserver();
		this.attachSlideWindowListeners();
		this.startWorker();
	}
	async setZoom(percent) {
		const desiredEffectivePercent = toPercent(percent);
		this.userZoomPercent = clamp(desiredEffectivePercent / Math.max(this.fitScale, .01), 25, 600);
		this.scheduleResize();
	}
	destroy() {
		var _a, _b, _c, _d, _e;
		this.disposed = true;
		(_a = this.presentation) === null || _a === void 0 || _a.destroy();
		this.presentation = null;
		this.previewThumbnailDataUrl = null;
		this.releaseCharts();
		this.releaseMedia();
		(_b = this.worker) === null || _b === void 0 || _b.terminate();
		this.worker = null;
		(_c = this.resizeObserver) === null || _c === void 0 || _c.disconnect();
		this.resizeObserver = null;
		if (this.resizeFrame) (_d = this.target.ownerDocument.defaultView) === null || _d === void 0 || _d.cancelAnimationFrame(this.resizeFrame);
		if (this.slideWindowFrame) (_e = this.target.ownerDocument.defaultView) === null || _e === void 0 || _e.cancelAnimationFrame(this.slideWindowFrame);
		this.detachSlideWindowListeners();
		this.target.replaceChildren();
	}
	startWorker() {
		var _a;
		(_a = this.worker) === null || _a === void 0 || _a.terminate();
		this.releaseCharts();
		this.releaseMedia();
		this.completed = false;
		this.charts = null;
		this.previewThumbnailDataUrl = null;
		this.slideSize = null;
		this.slideRecords = [];
		this.totalSlides = 0;
		this.content.replaceChildren();
		this.content.dataset.renderState = "loading";
		try {
			this.worker = createPptxWorker(this.options);
		} catch (error) {
			throw createPptxDiagnosticError("PPTX_WORKER_FAILED", "start-worker", "PPTX Worker 启动失败。", error, "请检查 presentation.workerUrl、Worker 文件是否 200 返回、MIME/CSP/跨域策略是否允许加载。");
		}
		this.worker.addEventListener("message", (event) => this.processMessage(event.data));
		this.worker.addEventListener("error", (event) => this.fail(createPptxDiagnosticError("PPTX_WORKER_FAILED", "worker-runtime", "PPTX Worker 运行失败。", event.error || event.message, "请检查 Worker 脚本是否完整、浏览器控制台是否有 CSP/MIME/跨域或语法错误。")));
		try {
			this.worker.postMessage({
				type: "processPPTX",
				data: this.buffer,
				IE11: false,
				options: resolvePptxEngineOptions(this.options.engineOptions)
			});
		} catch (error) {
			throw createPptxDiagnosticError("PPTX_WORKER_FAILED", "post-worker-message", "PPTX 数据发送到 Worker 失败。", error, "请确认浏览器支持 Worker 消息传递，并避免传入已被释放或不可克隆的数据。");
		}
	}
	processMessage(message) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
		if (this.disposed || this.completed) return;
		switch (message.type) {
			case "slide":
				this.clearThumbnail();
				this.totalSlides += 1;
				if (this.shouldWindowSlides()) this.appendWindowedSlide(String(message.data || ""), Number(message.slide_num || 0));
				else {
					const element = appendHtml(this.content, String(message.data || ""));
					this.hydrateMedia(element);
					this.scheduleResize();
					(_b = (_a = this.options).onSlideRendered) === null || _b === void 0 || _b.call(_a, Number(message.slide_num || 0), element);
				}
				break;
			case "media":
				this.storeMedia(message.data);
				break;
			case "slide-error": {
				const slideNumber = Number(message.slide_num || 0);
				const error = message.data;
				const html = buildSlideErrorHtml(slideNumber, error);
				this.clearThumbnail();
				this.totalSlides += 1;
				if (this.shouldWindowSlides()) this.appendWindowedSlide(html, slideNumber);
				else {
					const element = appendHtml(this.content, html);
					this.scheduleResize();
					(_d = (_c = this.options).onSlideRendered) === null || _d === void 0 || _d.call(_c, slideNumber, element);
				}
				(_f = (_e = this.options).onSlideError) === null || _f === void 0 || _f.call(_e, slideNumber, error);
				(_h = (_g = this.options).onWarning) === null || _h === void 0 || _h.call(_g, error);
				break;
			}
			case "pptx-thumb":
				this.showThumbnail(String(message.data || ""));
				(_k = (_j = this.options).onThumbnail) === null || _k === void 0 || _k.call(_j, String(message.data || ""));
				break;
			case "slideSize":
				this.slideSize = message.data || {};
				this.syncWindowedPlaceholderHeights();
				(_m = (_l = this.options).onSlideSize) === null || _m === void 0 || _m.call(_l, message.data || {});
				break;
			case "globalCSS":
				this.appendGlobalCss(String(message.data || ""));
				break;
			case "progress-update":
				(_p = (_o = this.options).onProgress) === null || _p === void 0 || _p.call(_o, Number(message.data || 0), message);
				break;
			case "ExecutionTime":
			case "Done":
				this.complete(message.charts).catch((error) => this.fail(createPptxDiagnosticError("PPTX_PARSE_FAILED", "post-process", "PPTX 渲染后处理失败。", error)));
				break;
			case "WARN":
				(_r = (_q = this.options).onWarning) === null || _r === void 0 || _r.call(_q, message.data);
				break;
			case "ERROR": this.fail(message.data);
		}
	}
	appendGlobalCss(css) {
		const sanitized = sanitizePptxCss(this.target.ownerDocument, css);
		if (!sanitized) return;
		const style = this.target.ownerDocument.createElement("style");
		style.textContent = sanitized;
		this.content.append(style);
	}
	showThumbnail(base64Jpeg) {
		if (!base64Jpeg) return;
		this.previewThumbnailDataUrl = `data:image/jpeg;base64,${base64Jpeg}`;
		if (this.content.children.length > 0) return;
		const image = this.target.ownerDocument.createElement("img");
		image.className = "flyfish-pptx-thumbnail";
		image.alt = "PPTX preview thumbnail";
		image.src = this.previewThumbnailDataUrl;
		this.thumbnailElement = image;
		this.scaleBox.insertBefore(image, this.content);
	}
	clearThumbnail() {
		var _a;
		(_a = this.thumbnailElement) === null || _a === void 0 || _a.remove();
		this.thumbnailElement = null;
	}
	shouldWindowSlides() {
		var _a;
		return Boolean(this.options.lazySlides || ((_a = this.options.listOptions) === null || _a === void 0 ? void 0 : _a.windowed));
	}
	getSlideWindowOptions() {
		const listOptions = this.options.listOptions || {};
		return {
			initialSlides: toPositiveInteger(listOptions.initialSlides, DEFAULT_INITIAL_SLIDES, 1, 20),
			batchSize: toPositiveInteger(listOptions.batchSize, DEFAULT_BATCH_SIZE, 1, 20),
			overscanViewport: toPositiveNumber(listOptions.overscanViewport, DEFAULT_OVERSCAN_VIEWPORTS, .25, 6)
		};
	}
	getEstimatedSlideHeight() {
		var _a, _b;
		const sizeHeight = Number((_a = this.slideSize) === null || _a === void 0 ? void 0 : _a.height);
		const measuredHeight = (_b = this.slideRecords.find((record) => record.estimatedHeight > 0)) === null || _b === void 0 ? void 0 : _b.estimatedHeight;
		return Math.ceil(Number.isFinite(sizeHeight) && sizeHeight > 0 ? sizeHeight + DEFAULT_SLIDE_GAP : measuredHeight || 590);
	}
	appendWindowedSlide(html, slideNumber) {
		const record = this.createWindowedSlideRecord(html, slideNumber || this.slideRecords.length + 1);
		this.slideRecords.push(record);
		this.content.append(record.slot);
		if (this.slideRecords.length <= this.getSlideWindowOptions().initialSlides) this.renderSlideRecord(record);
		this.scheduleResize();
		this.scheduleSlideWindowUpdate();
	}
	createWindowedSlideRecord(html, slideNumber) {
		const slot = this.target.ownerDocument.createElement("div");
		const estimatedHeight = this.getEstimatedSlideHeight();
		slot.className = "flyfish-pptx-slide-slot";
		slot.dataset.slideNumber = String(slideNumber);
		slot.style.minHeight = `${estimatedHeight}px`;
		return {
			slideNumber,
			html,
			slot,
			element: null,
			estimatedHeight,
			rendered: false,
			notified: false,
			postProcessed: false,
			postProcessPromise: null,
			postProcessVersion: 0,
			chartHandle: null
		};
	}
	getDesignerCanvases(record) {
		return Array.from(record.slot.children).filter((element) => element.classList.contains("fv-print-mask-canvas"));
	}
	renderSlideRecord(record) {
		var _a, _b;
		if (record.rendered || this.disposed) return;
		const designerCanvases = this.getDesignerCanvases(record);
		record.slot.replaceChildren();
		record.element = appendHtml(record.slot, record.html);
		this.hydrateMedia(record.element);
		record.slot.append(...designerCanvases);
		record.rendered = true;
		record.postProcessed = false;
		record.postProcessVersion += 1;
		this.updateMeasuredSlideHeight(record);
		if (!record.notified) {
			record.notified = true;
			(_b = (_a = this.options).onSlideRendered) === null || _b === void 0 || _b.call(_a, record.slideNumber, record.element);
		}
		if (this.completed) this.postProcessSlideRecord(record).finally(() => this.scheduleResize());
		this.scheduleResize();
	}
	unmountSlideRecord(record) {
		if (!record.rendered || this.getDesignerCanvases(record).length > 0) return;
		this.updateMeasuredSlideHeight(record);
		this.releaseChartHandle(record.chartHandle);
		record.chartHandle = null;
		record.postProcessVersion += 1;
		record.slot.replaceChildren();
		record.element = null;
		record.rendered = false;
		record.postProcessed = false;
		record.postProcessPromise = null;
	}
	updateMeasuredSlideHeight(record) {
		var _a;
		const HTMLElementCtor = ((_a = this.target.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.HTMLElement) || HTMLElement;
		if (!(record.element instanceof HTMLElementCtor)) return;
		const computed = (this.target.ownerDocument.defaultView || window).getComputedStyle(record.element);
		const marginTop = parseFloat(computed.marginTop) || 0;
		const marginBottom = parseFloat(computed.marginBottom) || 0;
		const measuredHeight = Math.ceil(record.element.offsetHeight + marginTop + marginBottom);
		const nextHeight = Math.max(measuredHeight, record.estimatedHeight, 1);
		record.estimatedHeight = nextHeight;
		record.slot.style.minHeight = `${nextHeight}px`;
	}
	syncWindowedPlaceholderHeights() {
		if (!this.shouldWindowSlides() || !this.slideRecords.length) return;
		const estimatedHeight = this.getEstimatedSlideHeight();
		for (const record of this.slideRecords) if (!record.rendered && record.estimatedHeight < estimatedHeight) {
			record.estimatedHeight = estimatedHeight;
			record.slot.style.minHeight = `${estimatedHeight}px`;
		}
		this.scheduleResize();
	}
	scheduleSlideWindowUpdate() {
		if (!this.shouldWindowSlides() || this.disposed) return;
		const view = this.target.ownerDocument.defaultView || window;
		if (this.slideWindowFrame) view.cancelAnimationFrame(this.slideWindowFrame);
		this.slideWindowFrame = view.requestAnimationFrame(() => this.updateSlideWindow());
	}
	updateSlideWindow() {
		this.slideWindowFrame = 0;
		if (!this.shouldWindowSlides() || !this.slideRecords.length || this.disposed) return;
		const windowOptions = this.getSlideWindowOptions();
		const indexesToRender = this.getWindowedSlideIndexes(windowOptions);
		const presentation = this.presentation;
		if (presentation === null || presentation === void 0 ? void 0 : presentation.active) {
			const activeIndex = this.slideRecords.findIndex((record) => record.slideNumber === presentation.slideNumber);
			if (activeIndex >= 0) {
				indexesToRender.add(activeIndex);
				if (activeIndex + 1 < this.slideRecords.length) indexesToRender.add(activeIndex + 1);
			}
		}
		let changed = false;
		this.slideRecords.forEach((record, index) => {
			if (indexesToRender.has(index)) {
				const wasRendered = record.rendered;
				this.renderSlideRecord(record);
				changed || (changed = !wasRendered);
			} else if (record.rendered) {
				this.unmountSlideRecord(record);
				changed = true;
			}
		});
		if (changed) this.scheduleResize();
	}
	getWindowedSlideIndexes(windowOptions) {
		const viewport = this.getSlideViewport();
		const maxMountedSlides = Math.max(windowOptions.initialSlides, windowOptions.initialSlides + windowOptions.batchSize * 4, 12);
		const selected = /* @__PURE__ */ new Set();
		for (let index = 0; index < Math.min(windowOptions.initialSlides, this.slideRecords.length); index += 1) selected.add(index);
		const candidates = this.slideRecords.map((record, index) => ({
			index,
			distance: this.getDistanceFromViewport(record, viewport, windowOptions.overscanViewport)
		})).filter((candidate) => candidate.distance !== Number.POSITIVE_INFINITY).sort((a, b) => a.distance - b.distance || a.index - b.index);
		const closestFallback = candidates[0];
		for (const candidate of candidates) {
			if (candidate.distance > 0 && selected.size >= windowOptions.initialSlides) continue;
			selected.add(candidate.index);
		}
		if (closestFallback) selected.add(closestFallback.index);
		if (selected.size <= maxMountedSlides) return selected;
		const capped = /* @__PURE__ */ new Set();
		for (let index = 0; index < Math.min(windowOptions.initialSlides, this.slideRecords.length); index += 1) capped.add(index);
		for (const candidate of candidates) {
			if (capped.size >= maxMountedSlides) break;
			capped.add(candidate.index);
		}
		return capped;
	}
	getDistanceFromViewport(record, viewport, overscanViewport) {
		const rect = record.slot.getBoundingClientRect();
		const overscan = viewport.height * overscanViewport;
		const top = viewport.top - overscan;
		const bottom = viewport.bottom + overscan;
		if (rect.bottom >= top && rect.top <= bottom) return 0;
		if (rect.bottom < top) return top - rect.bottom;
		if (rect.top > bottom) return rect.top - bottom;
		return Number.POSITIVE_INFINITY;
	}
	getSlideViewport() {
		const view = this.target.ownerDocument.defaultView || window;
		const HTMLElementCtor = view.HTMLElement;
		if (this.slideWindowTarget instanceof HTMLElementCtor) {
			const rect = this.slideWindowTarget.getBoundingClientRect();
			const height = Math.max(1, rect.height || this.slideWindowTarget.clientHeight || view.innerHeight || 1);
			return {
				top: rect.top,
				bottom: rect.top + height,
				height
			};
		}
		const height = Math.max(1, view.innerHeight || this.target.ownerDocument.documentElement.clientHeight || DEFAULT_SLIDE_HEIGHT);
		return {
			top: 0,
			bottom: height,
			height
		};
	}
	attachSlideWindowListeners() {
		if (!this.shouldWindowSlides()) return;
		this.detachSlideWindowListeners();
		const view = this.target.ownerDocument.defaultView || window;
		this.slideWindowTarget = this.findSlideWindowTarget();
		this.addSlideWindowListener(view, "scroll");
		this.addSlideWindowListener(view, "resize");
		if (this.slideWindowTarget && this.slideWindowTarget !== view) this.addSlideWindowListener(this.slideWindowTarget, "scroll");
	}
	addSlideWindowListener(target, type) {
		target.addEventListener(type, this.handleSlideWindowChange, { passive: true });
		this.slideWindowListeners.push({
			target,
			type,
			listener: this.handleSlideWindowChange
		});
	}
	detachSlideWindowListeners() {
		for (const { target, type, listener } of this.slideWindowListeners) target.removeEventListener(type, listener);
		this.slideWindowListeners = [];
		this.slideWindowTarget = null;
	}
	findSlideWindowTarget() {
		const view = this.target.ownerDocument.defaultView || window;
		let element = this.target.parentElement;
		while (element && element !== this.target.ownerDocument.body && element !== this.target.ownerDocument.documentElement) {
			const style = view.getComputedStyle(element);
			if (/(auto|scroll|overlay)/.test(`${style.overflowY} ${style.overflow}`)) return element;
			element = element.parentElement;
		}
		return view;
	}
	async postProcessRenderedContent(charts) {
		if (!this.shouldWindowSlides()) {
			const handle = await renderPptxPostProcessing(charts, this.content);
			this.trackChartHandle(handle);
			return;
		}
		await Promise.all(this.slideRecords.filter((record) => record.rendered).map((record) => this.postProcessSlideRecord(record)));
	}
	async postProcessSlideRecord(record) {
		if (!record.rendered || record.postProcessed || this.disposed) return;
		if (!record.postProcessPromise) {
			const version = record.postProcessVersion;
			const postProcessPromise = (async () => {
				const handle = await renderPptxPostProcessing(this.charts, record.slot);
				if (this.disposed || !record.rendered || record.postProcessVersion !== version) {
					handle === null || handle === void 0 || handle.destroy();
					return;
				}
				this.releaseChartHandle(record.chartHandle);
				record.chartHandle = handle;
				this.trackChartHandle(handle);
				record.postProcessed = true;
				this.updateMeasuredSlideHeight(record);
			})().finally(() => {
				if (record.postProcessPromise === postProcessPromise) record.postProcessPromise = null;
			});
			record.postProcessPromise = postProcessPromise;
		}
		await record.postProcessPromise;
	}
	/** Materializes every lazy slide only for the duration of an export snapshot. */
	async cloneForExport() {
		if (!this.shouldWindowSlides()) return this.target.cloneNode(true);
		const previouslyRendered = new Set(this.slideRecords.filter((record) => record.rendered));
		try {
			this.slideRecords.forEach((record) => this.renderSlideRecord(record));
			await Promise.all(this.slideRecords.map((record) => this.postProcessSlideRecord(record)));
			return this.target.cloneNode(true);
		} finally {
			this.slideRecords.forEach((record) => {
				if (!previouslyRendered.has(record)) this.unmountSlideRecord(record);
			});
			this.scheduleSlideWindowUpdate();
			this.scheduleResize();
		}
	}
	async complete(charts) {
		var _a, _b, _c;
		if (this.disposed || this.completed) return;
		this.completed = true;
		this.charts = charts;
		this.content.dataset.renderState = "ready";
		(_a = this.worker) === null || _a === void 0 || _a.terminate();
		this.worker = null;
		this.scheduleSlideWindowUpdate();
		this.scheduleResize();
		await this.postProcessRenderedContent(charts);
		if (this.disposed) return;
		this.scheduleResize();
		(_c = (_b = this.options).onRenderComplete) === null || _c === void 0 || _c.call(_b);
	}
	fail(error) {
		var _a, _b, _c;
		if (this.disposed) return;
		this.completed = true;
		(_a = this.worker) === null || _a === void 0 || _a.terminate();
		this.worker = null;
		this.releaseCharts();
		this.releaseMedia();
		this.content.dataset.renderState = "error";
		(_c = (_b = this.options).onError) === null || _c === void 0 || _c.call(_b, error);
	}
	trackChartHandle(handle) {
		if (!handle) return;
		if (this.disposed) {
			handle.destroy();
			return;
		}
		this.chartHandles.add(handle);
	}
	releaseChartHandle(handle) {
		if (!handle) return;
		this.chartHandles.delete(handle);
		handle.destroy();
	}
	releaseCharts() {
		for (const handle of this.chartHandles) handle.destroy();
		this.chartHandles.clear();
		for (const record of this.slideRecords) record.chartHandle = null;
	}
	storeMedia(data) {
		if (!data || typeof data !== "object") return;
		const media = data;
		if (typeof media.id !== "string" || !media.id || typeof media.mimeType !== "string" || !(media.buffer instanceof ArrayBuffer)) return;
		this.releaseMedia(media.id);
		this.mediaRecords.set(media.id, {
			buffer: media.buffer,
			mimeType: media.mimeType,
			objectUrl: null,
			revokeObjectUrl: null
		});
		this.hydrateMedia(this.content);
	}
	hydrateMedia(root) {
		var _a;
		if (!root) return;
		const elements = Array.from(root.querySelectorAll("[data-pptx-media-id]"));
		if (root.matches("[data-pptx-media-id]")) elements.unshift(root);
		for (const element of elements) {
			const mediaId = element.dataset.pptxMediaId;
			const record = mediaId ? this.mediaRecords.get(mediaId) : void 0;
			if (!record) continue;
			if (!record.objectUrl) {
				const view = this.target.ownerDocument.defaultView;
				const BlobCtor = (view === null || view === void 0 ? void 0 : view.Blob) || globalThis.Blob;
				const UrlApi = (view === null || view === void 0 ? void 0 : view.URL) || globalThis.URL;
				if (typeof BlobCtor !== "function" || typeof (UrlApi === null || UrlApi === void 0 ? void 0 : UrlApi.createObjectURL) !== "function") continue;
				const objectUrl = UrlApi.createObjectURL(new BlobCtor([record.buffer], { type: record.mimeType }));
				record.objectUrl = objectUrl;
				record.revokeObjectUrl = () => UrlApi.revokeObjectURL(objectUrl);
			}
			if (element.src !== record.objectUrl) {
				element.src = record.objectUrl;
				(_a = element.load) === null || _a === void 0 || _a.call(element);
			}
		}
	}
	releaseMedia(mediaId) {
		var _a, _b;
		if (mediaId) {
			const record = this.mediaRecords.get(mediaId);
			(_a = record === null || record === void 0 ? void 0 : record.revokeObjectUrl) === null || _a === void 0 || _a.call(record);
			this.mediaRecords.delete(mediaId);
			return;
		}
		for (const record of this.mediaRecords.values()) (_b = record.revokeObjectUrl) === null || _b === void 0 || _b.call(record);
		this.mediaRecords.clear();
	}
	attachResizeObserver() {
		if (typeof ResizeObserver === "undefined") return;
		this.resizeObserver = new ResizeObserver(() => {
			this.scheduleResize();
			this.scheduleSlideWindowUpdate();
		});
		this.resizeObserver.observe(this.target);
		if (this.target.parentElement) this.resizeObserver.observe(this.target.parentElement);
	}
	scheduleResize() {
		const view = this.target.ownerDocument.defaultView || window;
		if (this.resizeFrame) view.cancelAnimationFrame(this.resizeFrame);
		this.resizeFrame = view.requestAnimationFrame(() => this.resize());
	}
	resize() {
		var _a, _b, _c;
		if ((_a = this.presentation) === null || _a === void 0 ? void 0 : _a.active) {
			this.presentation.layout();
			return;
		}
		const slides = this.getMountedSlideElements();
		const sizeWidth = Number((_b = this.slideSize) === null || _b === void 0 ? void 0 : _b.width);
		const fallbackWidth = Number.isFinite(sizeWidth) && sizeWidth > 0 ? sizeWidth : 0;
		const slideWidth = Math.max(...slides.map((slide) => slide.offsetWidth), fallbackWidth);
		if (!slideWidth) return;
		const viewportWidth = this.target.clientWidth || ((_c = this.target.parentElement) === null || _c === void 0 ? void 0 : _c.clientWidth) || slideWidth;
		this.fitScale = this.options.fitMode === "none" ? 1 : Math.min(1, viewportWidth / slideWidth);
		const effectiveScale = clamp(this.fitScale * (this.userZoomPercent / 100), .25, 3);
		this.currentZoomPercent = effectiveScale * 100;
		this.content.style.width = `${slideWidth}px`;
		this.content.style.transform = `scale(${effectiveScale})`;
		this.scaleBox.style.width = `${Math.ceil(slideWidth * effectiveScale)}px`;
		this.scaleBox.style.height = `${Math.ceil(this.content.scrollHeight * effectiveScale)}px`;
		this.scaleBox.style.minHeight = "";
		if (this.pendingScrollRestore) {
			const { top, left } = this.pendingScrollRestore;
			this.pendingScrollRestore = null;
			const view = this.target.ownerDocument.defaultView || window;
			const HTMLElementCtor = view.HTMLElement;
			const scroller = this.slideWindowTarget || this.findSlideWindowTarget();
			if (scroller instanceof HTMLElementCtor) {
				scroller.scrollTop = top;
				scroller.scrollLeft = left;
			} else view.scrollTo(left, top);
		}
	}
	getMountedSlideElements() {
		var _a;
		const HTMLElementCtor = ((_a = this.target.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.HTMLElement) || HTMLElement;
		const slides = [];
		for (const child of Array.from(this.content.children)) {
			if (!(child instanceof HTMLElementCtor)) continue;
			if (this.isSlideElement(child)) {
				slides.push(child);
				continue;
			}
			if (!child.classList.contains("flyfish-pptx-slide-slot")) continue;
			const firstChild = child.firstElementChild;
			if (firstChild instanceof HTMLElementCtor && this.isSlideElement(firstChild)) slides.push(firstChild);
		}
		return slides;
	}
	isSlideElement(element) {
		return element.classList.contains("slide") || element.tagName === "SECTION";
	}
};
//#endregion
export { registerPptxChartLibraryLoader as i, resolvePptxPackageWorkerUrl as n, RECOMMENDED_ZIP_LIMITS as r, PptxViewer as t };
