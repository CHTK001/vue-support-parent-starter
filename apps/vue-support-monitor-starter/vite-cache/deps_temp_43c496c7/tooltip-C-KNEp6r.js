import { Ft as onMounted, K as createCommentVNode, Kn as ref, Ot as nextTick, U as computed, Wn as reactive, a as createApp, gn as watch, jt as onBeforeUnmount, nt as defineComponent, pt as h } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { X as index_esm_default, t as VxeUI } from "./index.esm-B3_zc1t1.js";
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/ui/src/comp.js
var defineVxeComponent = defineComponent;
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/dynamics/index.js
var dynamicContainerElem;
var refTooltip = ref();
var dynamicStore = reactive({
	modals: [],
	drawers: [],
	globalLoading: null,
	globalWatermark: null,
	globalContextMenu: null,
	globalTooltip: null,
	isTipInit: false
});
var VxeDynamics = defineVxeComponent({ setup() {
	const VxeUIModalComponent = VxeUI.getComponent("vxe-modal");
	const VxeUIDrawerComponent = VxeUI.getComponent("vxe-drawer");
	const VxeUILoadingComponent = VxeUI.getComponent("vxe-loading");
	const VxeUIWatermarkComponent = VxeUI.getComponent("vxe-watermark");
	const VxeUIContextMenuComponent = VxeUI.getComponent("vxe-context-menu");
	const VxeUITooltipComponent = VxeUI.getComponent("vxe-tooltip");
	return () => {
		const { modals, drawers, globalWatermark, globalLoading, globalContextMenu, globalTooltip } = dynamicStore;
		let cmOpts = globalContextMenu;
		if (globalContextMenu) {
			const { optionClick, show, hide } = globalContextMenu.events || {};
			cmOpts = Object.assign({}, globalContextMenu, {
				key: "cm",
				onShow(params) {
					if (show) show(params);
				},
				onHide(params) {
					if (hide) hide(params);
					dynamicStore.globalContextMenu = null;
				},
				onOptionClick(params) {
					if (optionClick) optionClick(params);
				}
			}, { events: void 0 });
		}
		let tpOpts = globalTooltip || {};
		if (globalTooltip) tpOpts = Object.assign({}, globalTooltip, { "onUpdate:modelValue"(value) {
			globalTooltip.modelValue = value;
		} });
		return [
			modals.length ? h("div", {
				key: "ml",
				class: "vxe-dynamics--modal"
			}, modals.map((item) => h(VxeUIModalComponent, item))) : createCommentVNode(),
			drawers.length ? h("div", {
				key: "dr",
				class: "vxe-dynamics--drawer"
			}, drawers.map((item) => h(VxeUIDrawerComponent, item))) : createCommentVNode(),
			globalWatermark ? h(VxeUIWatermarkComponent, globalWatermark) : createCommentVNode(),
			globalLoading ? h(VxeUILoadingComponent, globalLoading) : createCommentVNode(),
			globalContextMenu ? h(VxeUIContextMenuComponent, cmOpts) : createCommentVNode(),
			dynamicStore.isTipInit ? h(VxeUITooltipComponent, {
				ref: refTooltip,
				...tpOpts
			}) : createCommentVNode()
		];
	};
} });
var dynamicApp = createApp(VxeDynamics);
function checkDynamic() {
	if (!dynamicContainerElem) {
		dynamicContainerElem = document.createElement("div");
		dynamicContainerElem.className = "vxe-dynamics";
		document.body.appendChild(dynamicContainerElem);
		dynamicApp.mount(dynamicContainerElem);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/ui/src/vn.js
function getOnName(type) {
	return "on" + type.substring(0, 1).toLocaleUpperCase() + type.substring(1);
}
function getModelEvent(renderOpts) {
	switch (renderOpts.name) {
		case "input":
		case "textarea": return "input";
		case "select": return "change";
	}
	return "update:modelValue";
}
function getChangeEvent(renderOpts) {
	switch (renderOpts.name) {
		case "input":
		case "textarea":
		case "VxeInput":
		case "VxeTextarea":
		case "$input":
		case "$textarea": return "input";
	}
	return "change";
}
function getSlotVNs(vns) {
	if (index_esm_default.isArray(vns)) return vns;
	return vns ? [vns] : [];
}
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/ui/src/dom.js
var tpImgEl;
function initTpImg() {
	if (!tpImgEl) {
		tpImgEl = new Image();
		tpImgEl.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
	}
	return tpImgEl;
}
function getTpImg() {
	if (!tpImgEl) return initTpImg();
	return tpImgEl;
}
function getPropClass(property, params) {
	return property ? (index_esm_default.isFunction(property) ? property(params) : property) || "" : "";
}
var reClsMap = {};
function getClsRE(cls) {
	if (!reClsMap[cls]) reClsMap[cls] = new RegExp(`(?:^|\\s)${cls}(?!\\S)`, "g");
	return reClsMap[cls];
}
function getNodeOffset(elem, container, rest) {
	if (elem) {
		const parentElem = elem.parentNode;
		rest.top += elem.offsetTop;
		rest.left += elem.offsetLeft;
		if (parentElem && parentElem !== document.documentElement && parentElem !== document.body) {
			rest.top -= parentElem.scrollTop;
			rest.left -= parentElem.scrollLeft;
		}
		if (container && (elem === container || elem.offsetParent === container) ? 0 : elem.offsetParent) return getNodeOffset(elem.offsetParent, container, rest);
	}
	return rest;
}
function isScale(val) {
	return val && /^\d+(\.\d+)?%$/.test(val);
}
function hasClass(elem, cls) {
	if (elem) {
		if (elem.classList) return elem.classList.contains(cls);
		return !!(elem.className && elem.className.match && elem.className.match(getClsRE(cls)));
	}
	return false;
}
function removeClass(elem, cls) {
	if (elem && hasClass(elem, cls)) elem.className = elem.className.replace(getClsRE(cls), "");
}
function addClass(elem, cls) {
	if (elem && !hasClass(elem, cls)) {
		removeClass(elem, cls);
		elem.className = `${elem.className} ${cls}`;
	}
}
function hasControlKey(evnt) {
	return evnt.ctrlKey || evnt.metaKey;
}
function toCssUnit(val, unit = "px") {
	if (index_esm_default.isNumber(val) || /^\d+$/.test(`${val}`)) return `${val}${unit}`;
	return `${val || ""}`;
}
function getDomNode() {
	const documentElement = document.documentElement;
	const bodyElem = document.body;
	return {
		scrollTop: documentElement.scrollTop || bodyElem.scrollTop,
		scrollLeft: documentElement.scrollLeft || bodyElem.scrollLeft,
		visibleHeight: documentElement.clientHeight || bodyElem.clientHeight,
		visibleWidth: documentElement.clientWidth || bodyElem.clientWidth
	};
}
function getEventTargetNode(evnt, container, queryCls, queryMethod) {
	let targetElem;
	let target = evnt.target.shadowRoot && evnt.composed ? evnt.composedPath()[0] || evnt.target : evnt.target;
	while (target && target.nodeType && target !== document) {
		if (queryCls && hasClass(target, queryCls) && (!queryMethod || queryMethod(target))) targetElem = target;
		else if (target === container) return {
			flag: queryCls ? !!targetElem : true,
			container,
			targetElem
		};
		target = target.parentNode;
	}
	return { flag: false };
}
function getOffsetPos(elem, container) {
	return getNodeOffset(elem, container, {
		left: 0,
		top: 0
	});
}
function getAbsolutePos(elem) {
	const bounding = elem.getBoundingClientRect();
	const boundingTop = bounding.top;
	const boundingLeft = bounding.left;
	const { scrollTop, scrollLeft, visibleHeight, visibleWidth } = getDomNode();
	return {
		boundingTop,
		top: scrollTop + boundingTop,
		boundingLeft,
		left: scrollLeft + boundingLeft,
		visibleHeight,
		visibleWidth
	};
}
function getPaddingTopBottomSize(elem) {
	if (elem) {
		const computedStyle = getComputedStyle(elem);
		return index_esm_default.toNumber(computedStyle.paddingTop) + index_esm_default.toNumber(computedStyle.paddingBottom);
	}
	return 0;
}
var scrollIntoViewIfNeeded = "scrollIntoViewIfNeeded";
var scrollIntoView = "scrollIntoView";
function scrollToView(elem) {
	if (elem) {
		if (elem[scrollIntoViewIfNeeded]) elem[scrollIntoViewIfNeeded]();
		else if (elem[scrollIntoView]) elem[scrollIntoView]();
	}
}
function updatePanelPlacement(targetElem, panelElem, options) {
	const { defaultTop, defaultLeft, placement, defaultPlacement, appendTo, teleportTo, marginSize, isMinWidth } = Object.assign({
		appendTo: "",
		teleportTo: false,
		marginSize: 18,
		isMinWidth: true
	}, options);
	let panelPlacement = "bottom";
	let top = "";
	let bottom = "";
	let left = 0;
	let minWidth = "";
	let arrowLeft = "";
	const stys = {};
	if (panelElem && targetElem) {
		const bodyEl = document.body;
		const parentWrapperEl = getPopupWrapperElement(teleportTo ? getPopupAppendElement(appendTo) : panelElem);
		if (parentWrapperEl) {
			const targetWidth = targetElem.offsetWidth;
			const targetHeight = targetElem.offsetHeight;
			const panelWidth = panelElem.offsetWidth;
			const panelHeight = panelElem.offsetHeight;
			const parentWrapperRect = parentWrapperEl.getBoundingClientRect();
			const panelRect = panelElem.getBoundingClientRect();
			const targetRect = targetElem.getBoundingClientRect();
			const visibleHeight = bodyEl.clientHeight;
			const visibleWidth = bodyEl.clientWidth;
			const parentWrapperScrollLeft = parentWrapperEl.scrollLeft;
			const parentWrapperScrollTop = parentWrapperEl.scrollTop;
			const parentWrapperOffsetLeft = parentWrapperRect.left;
			const parentWrapperOffsetTop = parentWrapperRect.top;
			const targetLeft = targetRect.left;
			const targetTop = targetRect.top;
			minWidth = targetElem.offsetWidth;
			if (teleportTo) {
				left = (defaultLeft || targetLeft - (panelWidth - targetWidth) / 2) - parentWrapperScrollLeft;
				top = (defaultTop || targetTop + targetHeight) - parentWrapperScrollTop;
				if (placement === "top") {
					panelPlacement = "top";
					top = targetTop - panelHeight;
				} else if (!placement) if (defaultPlacement === "top") {
					panelPlacement = "top";
					if (!defaultTop) top = targetTop - panelHeight;
					if (top < marginSize) {
						panelPlacement = "bottom";
						top = targetTop + targetHeight;
					}
					if (top + panelHeight + marginSize > visibleHeight) {
						panelPlacement = "top";
						top = targetTop - panelHeight;
					}
				} else {
					if (top + panelHeight + marginSize > visibleHeight) {
						panelPlacement = "top";
						top = targetTop - panelHeight;
					}
					if (top < marginSize) {
						panelPlacement = "bottom";
						top = targetTop + targetHeight;
					}
				}
				if (left + panelWidth + marginSize > visibleWidth) left -= left + panelWidth + marginSize - visibleWidth;
				if (left < marginSize) left = marginSize;
				top -= parentWrapperOffsetTop;
				left -= parentWrapperOffsetLeft;
			} else {
				if (placement === "top") {
					panelPlacement = "top";
					bottom = targetHeight;
				} else if (!placement) {
					top = targetHeight;
					if (targetTop + targetHeight + panelHeight + marginSize > visibleHeight) {
						if (targetTop - targetHeight - panelHeight > marginSize) {
							panelPlacement = "top";
							top = "";
							bottom = targetHeight;
						}
					}
				}
				if (panelRect.left + panelRect.width + marginSize > visibleWidth) left = -(panelRect.left + panelRect.width + marginSize - visibleWidth);
			}
			if (index_esm_default.isNumber(top)) stys.top = toCssUnit(top);
			if (index_esm_default.isNumber(bottom)) stys.bottom = toCssUnit(bottom);
			if (index_esm_default.isNumber(left)) stys.left = toCssUnit(left);
			if (isMinWidth && index_esm_default.isNumber(minWidth)) stys.minWidth = toCssUnit(minWidth);
			if (left === targetLeft) {
				if (targetWidth <= panelWidth) arrowLeft = targetWidth / 2;
			} else if (left < targetLeft) if (left + panelWidth > targetLeft + targetWidth) arrowLeft = targetLeft - left + targetWidth / 2;
			else arrowLeft = targetLeft - left + (panelWidth - (targetLeft - left)) / 2;
		}
	}
	return {
		top: top || 0,
		bottom: bottom || 0,
		left: left || 0,
		arrowLeft: arrowLeft || 0,
		style: stys,
		placement: panelPlacement
	};
}
function getPopupWrapperElement(panelElem) {
	if (!panelElem) return null;
	const bodyEl = document.body;
	const parentEl = panelElem.parentElement;
	return (parentEl === bodyEl ? document.documentElement : parentEl) || null;
}
function getPopupContainer(appendTo) {
	return (appendTo && index_esm_default.isFunction(appendTo) ? appendTo({}) : appendTo) || "body";
}
function getPopupAppendElement(appendTo) {
	const selectElem = getPopupContainer(appendTo);
	if (index_esm_default.isString(selectElem)) return document.querySelector(selectElem) || document.body;
	return selectElem;
}
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/ui/src/utils.js
var { zIndex, getConfig: getConfig$3 } = VxeUI;
function isEnableConf(conf) {
	return conf && conf.enabled !== false;
}
function hasEnableConf(conf, opts) {
	return opts && (conf ? opts.enabled !== false : opts.enabled);
}
function nextZIndex() {
	return zIndex.next();
}
function getLastZIndex() {
	return zIndex.getLast();
}
function nextSubZIndex() {
	return zIndex.nextSub();
}
function getSubLastZIndex() {
	return zIndex.getSubLast();
}
function getGlobalDefaultConfig(value, globalValue) {
	if (index_esm_default.eqNull(value)) return globalValue;
	return value;
}
function getFuncText(content, args) {
	if (index_esm_default.eqNull(content)) return "";
	const translate = getConfig$3().translate;
	return `${translate ? translate("" + content, args) : content}`;
}
function getText(content) {
	if (index_esm_default.eqNull(content)) return "";
	return "" + content;
}
function eqEmptyValue(cellValue) {
	return cellValue === null || cellValue === void 0 || cellValue === "";
}
function handleBooleanDefaultValue(value) {
	return index_esm_default.isBoolean(value) ? value : null;
}
function enModelValue(nodeid) {
	return index_esm_default.eqNull(nodeid) ? "" : encodeURIComponent(`${nodeid}`);
}
function deModelValue(nodeid) {
	return nodeid ? decodeURIComponent(`${nodeid}`) : nodeid;
}
function getDefaultConfig(val1, def1) {
	return index_esm_default.eqNull(val1) ? def1 : val1;
}
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/loading/src/loading.js
var { getConfig: getConfig$2, getIcon, getI18n, createEvent: createEvent$2, useFns: useFns$2, renderEmptyElement: renderEmptyElement$1 } = VxeUI;
var loading_default$1 = defineVxeComponent({
	name: "VxeLoading",
	props: {
		modelValue: Boolean,
		icon: {
			type: String,
			default: () => getConfig$2().loading.icon
		},
		showIcon: {
			type: Boolean,
			default: () => getConfig$2().loading.showIcon
		},
		text: {
			type: String,
			default: () => getConfig$2().loading.text
		},
		showText: {
			type: Boolean,
			default: () => getConfig$2().loading.showText
		},
		status: String,
		size: {
			type: String,
			default: () => getConfig$2().loading.size || getConfig$2().size
		}
	},
	setup(props, context) {
		const { slots, emit } = context;
		const xID = index_esm_default.uniqueId();
		const { computeSize } = useFns$2.useSize(props);
		const reactData = reactive({ initialized: false });
		const computeMaps = { computeSize };
		const $xeLoading = {
			xID,
			props,
			context,
			reactData,
			getComputeMaps: () => computeMaps
		};
		const computeLoadingIcon = computed(() => {
			return props.icon || getIcon().LOADING;
		});
		const computeLoadingText = computed(() => {
			const { text } = props;
			return index_esm_default.isString(text) ? text : getI18n("vxe.loading.text");
		});
		const handleInit = () => {
			if (!reactData.initialized) reactData.initialized = !!reactData.initialized;
		};
		const dispatchEvent = (type, params, evnt) => {
			emit(type, createEvent$2(evnt, { $loading: $xeLoading }, params));
		};
		Object.assign($xeLoading, { dispatchEvent }, {});
		const renderVN = () => {
			const { modelValue, showIcon, status } = props;
			const { initialized } = reactData;
			const vSize = computeSize.value;
			const defaultSlot = slots.default;
			const textSlot = slots.text;
			const iconSlot = slots.icon;
			const loadingIcon = computeLoadingIcon.value;
			const loadingText = computeLoadingText.value;
			if (!initialized && !modelValue) return renderEmptyElement$1($xeLoading);
			return h("div", { class: ["vxe-loading", {
				[`size--${vSize}`]: vSize,
				[`theme--${status}`]: status,
				"is--visible": modelValue
			}] }, defaultSlot ? [h("div", { class: "vxe-loading--wrapper" }, getSlotVNs(defaultSlot({})))] : [h("div", { class: "vxe-loading--chunk" }, [showIcon && (iconSlot || loadingIcon) ? h("div", { class: "vxe-loading--icon" }, iconSlot ? getSlotVNs(iconSlot({})) : [h("i", { class: loadingIcon })]) : h("div", { class: "vxe-loading--spinner" }), textSlot || loadingText ? h("div", { class: "vxe-loading--text" }, textSlot ? getSlotVNs(textSlot({})) : `${loadingText}`) : null])]);
		};
		watch(() => props.modelValue, () => {
			handleInit();
		});
		handleInit();
		$xeLoading.renderVN = renderVN;
		return $xeLoading;
	},
	render() {
		return this.renderVN();
	}
});
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/loading/index.js
var VxeLoading = Object.assign({}, loading_default$1, { install(app) {
	app.component(loading_default$1.name, loading_default$1);
} });
var LoadingController = {
	open(options) {
		const opts = Object.assign({}, options);
		dynamicStore.globalLoading = Object.assign({
			modelValue: true,
			text: opts.text,
			icon: opts.icon
		}, { key: "gl" });
		checkDynamic();
		return Promise.resolve();
	},
	close() {
		dynamicStore.globalLoading = null;
		return Promise.resolve();
	}
};
dynamicApp.use(VxeLoading);
VxeUI.component(loading_default$1);
VxeUI.loading = LoadingController;
var Loading = VxeLoading;
var loading_default = VxeLoading;
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/scrollbar/src/scrollbar.js
var { getConfig: getConfig$1, createEvent: createEvent$1, useFns: useFns$1, domUtils, globalResize, globalEvents: globalEvents$1, renderEmptyElement } = VxeUI;
function createReactData$1() {
	return {
		yThumbHeight: 0,
		xThumbWidth: 0
	};
}
function createInternalData$1() {
	return {
		thumbDragOffset: 0,
		yThumbTop: 0,
		xThumbLeft: 0,
		lastScrollTop: 0,
		lastScrollLeft: 0
	};
}
var scrollbar_default$1 = defineVxeComponent({
	name: "VxeScrollbar",
	props: {
		id: [String, Number],
		viewId: [String, Number],
		theme: {
			type: String,
			default: () => getConfig$1().scrollbar.theme
		},
		width: [String, Number],
		height: [String, Number],
		minWidth: [String, Number],
		minHeight: [String, Number],
		maxWidth: [String, Number],
		maxHeight: [String, Number],
		loading: Boolean,
		native: {
			type: Boolean,
			default: () => getConfig$1().scrollbar.native
		},
		fluentOverlay: {
			type: Boolean,
			default: () => getConfig$1().scrollbar.fluentOverlay
		},
		padding: {
			type: Boolean,
			default: () => getConfig$1().scrollbar.padding
		},
		autoHide: {
			type: Boolean,
			default: () => getConfig$1().scrollbar.autoHide
		},
		visible: {
			type: Boolean,
			default: () => getConfig$1().scrollbar.visible
		},
		xConfig: Object,
		yConfig: Object,
		className: {
			type: String,
			default: () => getConfig$1().scrollbar.className
		},
		viewAttrs: {
			type: Object,
			default: () => getConfig$1().scrollbar.viewAttrs
		},
		viewStyle: {
			type: Object,
			default: () => getConfig$1().scrollbar.viewStyle
		},
		viewClassName: {
			type: String,
			default: () => getConfig$1().scrollbar.viewClassName
		},
		viewInnerClassName: {
			type: String,
			default: () => getConfig$1().scrollbar.viewInnerClassName
		},
		size: {
			type: String,
			default: () => getConfig$1().scrollbar.size || getConfig$1().size
		},
		/**
		* 已废弃
		* @deprecated
		*/
		autoResize: {
			type: Boolean,
			default: () => getConfig$1().scrollbar.autoResize
		},
		/**
		* 已废弃
		* @deprecated
		*/
		syncResize: [
			Boolean,
			String,
			Number
		]
	},
	emits: ["scroll", "scroll-boundary"],
	setup(props, context) {
		const { emit, slots } = context;
		const xID = index_esm_default.uniqueId();
		const refElem = ref();
		const refViewElem = ref();
		const refViewInnerElem = ref();
		const reactData = reactive(createReactData$1());
		const internalData = createInternalData$1();
		const { computeSize } = useFns$1.useSize(props);
		const computeWrapperStyle = computed(() => {
			const { width, height, minWidth, minHeight, maxWidth, maxHeight } = props;
			const barWidth = computeYWidth.value;
			const barHeight = computeXHeight.value;
			const stys = {};
			if (width) stys.width = toCssUnit(width);
			if (height) stys.height = toCssUnit(height);
			if (minWidth) stys.minWidth = toCssUnit(minWidth);
			if (minHeight) stys.minHeight = toCssUnit(minHeight);
			if (maxWidth) stys.maxWidth = toCssUnit(maxWidth);
			if (maxHeight) stys.maxHeight = toCssUnit(maxHeight);
			if (barWidth || barHeight) {
				stys["--vxe-ui-scrollbar-y-width"] = toCssUnit(barWidth || barHeight);
				stys["--vxe-ui-scrollbar-x-height"] = toCssUnit(barHeight || barWidth);
			}
			return stys;
		});
		const computeXHeight = computed(() => {
			return computeXOpts.value.height;
		});
		const computeYWidth = computed(() => {
			return computeYOpts.value.width;
		});
		const computeXVisible = computed(() => {
			const { visible } = props;
			const xOpts = computeXOpts.value;
			return getDefaultConfig(xOpts.visible, visible);
		});
		const computeYVisible = computed(() => {
			const { visible } = props;
			const yOpts = computeYOpts.value;
			return getDefaultConfig(yOpts.visible, visible);
		});
		const computeXAutoHide = computed(() => {
			const { autoHide } = props;
			const xOpts = computeXOpts.value;
			return getDefaultConfig(xOpts.autoHide, autoHide);
		});
		const computeYAutoHide = computed(() => {
			const { autoHide } = props;
			const yOpts = computeYOpts.value;
			return getDefaultConfig(yOpts.autoHide, autoHide);
		});
		const computeWrapperClss = computed(() => {
			const { native, theme, className, padding, fluentOverlay } = props;
			const { yThumbHeight, xThumbWidth } = reactData;
			const vSize = computeSize.value;
			const xToTop = computeXToTop.value;
			const yToLeft = computeYToLeft.value;
			const xVisible = computeXVisible.value;
			const yVisible = computeYVisible.value;
			const xAutoHide = computeXAutoHide.value;
			const yAutoHide = computeYAutoHide.value;
			return domUtils.buildClass([
				"vxe-scrollbar",
				vSize ? `size--${vSize}` : "",
				theme ? `theme--${theme}` : "",
				fluentOverlay ? "is--fluent-overlay" : "is--default-mode",
				`ov-x--${xVisible === false ? "hidden" : "visible"}`,
				`ov-y--${yVisible === false ? "hidden" : "visible"}`,
				`sx-pos--${xToTop ? "top" : "bottom"}`,
				`sy-pos--${yToLeft ? "left" : "right"}`,
				native ? "is--native" : "is--virtual",
				className
			], {
				"is--padding": padding,
				"ov-x--auto-hide": xAutoHide,
				"ov-y--auto-hide": yAutoHide,
				"overflow-y": yThumbHeight,
				"overflow-x": xThumbWidth
			});
		});
		const computeViewClss = computed(() => {
			const { viewClassName } = props;
			return domUtils.buildClass(["vxe-scrollbar--view", viewClassName]);
		});
		const computeViewInnerClss = computed(() => {
			const { viewInnerClassName } = props;
			return domUtils.buildClass(["vxe-scrollbar--view-inner", viewInnerClassName]);
		});
		const computeXOpts = computed(() => {
			return Object.assign({}, getConfig$1().scrollbar.xConfig, props.xConfig);
		});
		const computeYOpts = computed(() => {
			return Object.assign({}, getConfig$1().scrollbar.yConfig, props.yConfig);
		});
		const computeXToTop = computed(() => {
			return computeXOpts.value.position === "top";
		});
		const computeYToLeft = computed(() => {
			return computeYOpts.value.position === "left";
		});
		const refMaps = { refElem };
		const computeMaps = {};
		const $xeScrollbar = {
			xID,
			props,
			context,
			reactData,
			internalData,
			getRefMaps: () => refMaps,
			getComputeMaps: () => computeMaps
		};
		const { refTrackXElem, refTrackYElem, refThumbXElem, refThumbYElem, updateThumbSize, updateThumbOffset, clickTrackXEvent, clickTrackYEvent, pointerdownThumbXEvent, pointermoveThumbXEvent, cleatPointerThumbEvent, pointerdownThumbYEvent, pointermoveThumbYEvent } = useFns$1.useInitVScrollbar($xeScrollbar);
		const dispatchEvent = (type, params, evnt) => {
			emit(type, createEvent$1(evnt, { $scrollbar: $xeScrollbar }, params));
		};
		const scrollbarMethods = {
			dispatchEvent,
			getScrollViewElem() {
				return refViewElem.value || null;
			},
			getScrollViewInnerElem() {
				return refViewInnerElem.value || null;
			},
			scrollTo(left, top) {
				const viewEl = refViewElem.value;
				if (viewEl) if (index_esm_default.isNumber(left)) viewEl.scrollTo(left, top || 0);
				else viewEl.scrollTo(left);
			},
			scrollIntoView() {
				const viewEl = refViewElem.value;
				if (viewEl) viewEl.scrollIntoView();
			},
			setScrollTop(top) {
				const viewEl = refViewElem.value;
				if (viewEl) viewEl.scrollTop = top;
			},
			setScrollLeft(left) {
				const viewEl = refViewElem.value;
				if (viewEl) viewEl.scrollLeft = left;
			},
			getScrollTop() {
				const viewEl = refViewElem.value;
				if (viewEl) return viewEl.scrollTop;
				return 0;
			},
			getScrollLeft() {
				const viewEl = refViewElem.value;
				if (viewEl) return viewEl.scrollLeft;
				return 0;
			},
			clearScroll() {
				const viewEl = refViewElem.value;
				if (viewEl) {
					viewEl.scrollTop = 0;
					viewEl.scrollLeft = 0;
				}
			},
			recalculate() {
				updateThumbSize();
				updateThumbOffset();
				return nextTick();
			}
		};
		const scrollEvent = (evnt) => {
			const { xThumbWidth, yThumbHeight } = reactData;
			const { lastScrollTop, lastScrollLeft } = internalData;
			const xOpts = computeXOpts.value;
			const yOpts = computeYOpts.value;
			const { scrollTop, scrollLeft, clientWidth, clientHeight, scrollHeight, scrollWidth } = evnt.currentTarget;
			let direction = "";
			let isTopBoundary = false;
			let isBottomBoundary = false;
			let isLeftBoundary = false;
			let isRightBoundary = false;
			if (lastScrollTop !== scrollTop) {
				const yThreshold = index_esm_default.toNumber(yOpts.threshold) || 1;
				if (lastScrollTop < scrollTop) {
					direction = "bottom";
					if (yThumbHeight > 0 && scrollTop + clientHeight >= scrollHeight - yThreshold) isBottomBoundary = true;
				} else {
					direction = "top";
					if (yThumbHeight > 0 && scrollTop <= yThreshold) isTopBoundary = true;
				}
			}
			if (lastScrollLeft !== scrollLeft) {
				const xThreshold = index_esm_default.toNumber(xOpts.threshold) || 1;
				if (lastScrollLeft < scrollLeft) {
					direction = "right";
					if (xThumbWidth > 0 && scrollLeft + clientWidth >= scrollWidth - xThreshold) isRightBoundary = true;
				} else {
					direction = "left";
					if (xThumbWidth > 0 && scrollLeft <= xThreshold) isLeftBoundary = true;
				}
			}
			updateThumbOffset();
			internalData.lastScrollTop = scrollTop;
			internalData.lastScrollLeft = scrollLeft;
			if (isBottomBoundary || isTopBoundary || isRightBoundary || isLeftBoundary) dispatchEvent("scroll-boundary", {
				direction,
				isTop: isTopBoundary,
				isBottom: isBottomBoundary,
				isLeft: isLeftBoundary,
				isRight: isRightBoundary,
				scrollTop,
				scrollLeft,
				clientWidth,
				clientHeight,
				scrollHeight,
				scrollWidth
			}, evnt);
			dispatchEvent("scroll", {
				direction,
				isTop: yThumbHeight > 0 && scrollTop <= 0,
				isBottom: yThumbHeight > 0 && scrollTop + clientHeight >= scrollHeight,
				isLeft: xThumbWidth > 0 && scrollLeft <= 0,
				isRight: xThumbWidth > 0 && scrollLeft + clientWidth >= scrollWidth,
				scrollTop,
				scrollLeft,
				clientWidth,
				clientHeight,
				scrollHeight,
				scrollWidth
			}, evnt);
		};
		Object.assign($xeScrollbar, scrollbarMethods, {});
		const renderVN = () => {
			const { id, native, loading, viewId, viewAttrs, viewStyle } = props;
			const wrapperStyle = computeWrapperStyle.value;
			const wrapperClss = computeWrapperClss.value;
			const viewClss = computeViewClss.value;
			const viewInnerClss = computeViewInnerClss.value;
			const xVisible = computeXVisible.value;
			const yVisible = computeYVisible.value;
			const defaultSlot = slots.default;
			return h("div", {
				ref: refElem,
				id: id || null,
				class: wrapperClss,
				style: wrapperStyle
			}, [
				h("div", {
					ref: refViewElem,
					class: viewClss,
					onScroll: scrollEvent,
					id: viewId || null,
					style: viewStyle,
					...viewAttrs
				}, [h("div", {
					key: "vi",
					ref: refViewInnerElem,
					class: viewInnerClss
				}, defaultSlot ? defaultSlot({}) : [])]),
				native || xVisible === false ? renderEmptyElement($xeScrollbar) : h("div", {
					ref: refTrackXElem,
					class: "vxe-scrollbar--track-x",
					onClick: clickTrackXEvent
				}, [h("div", {
					ref: refThumbXElem,
					class: "vxe-scrollbar--thumb-x",
					onPointerdown: pointerdownThumbXEvent,
					onPointermove: pointermoveThumbXEvent,
					onPointerup: cleatPointerThumbEvent,
					onPointercancel: cleatPointerThumbEvent,
					onLostpointercapture: cleatPointerThumbEvent
				})]),
				native || yVisible === false ? renderEmptyElement($xeScrollbar) : h("div", {
					ref: refTrackYElem,
					class: "vxe-scrollbar--track-y",
					onClick: clickTrackYEvent
				}, [h("div", {
					ref: refThumbYElem,
					class: "vxe-scrollbar--thumb-y",
					onPointerdown: pointerdownThumbYEvent,
					onPointermove: pointermoveThumbYEvent,
					onPointerup: cleatPointerThumbEvent,
					onPointercancel: cleatPointerThumbEvent,
					onLostpointercapture: cleatPointerThumbEvent
				})]),
				h(loading_default, {
					class: "vxe-scrollbar--loading",
					modelValue: loading
				})
			]);
		};
		const reFlag = ref(0);
		watch(() => props.height, () => {
			reFlag.value++;
		});
		watch(() => props.width, () => {
			reFlag.value++;
		});
		watch(() => props.minHeight, () => {
			reFlag.value++;
		});
		watch(() => props.minWidth, () => {
			reFlag.value++;
		});
		watch(() => props.maxHeight, () => {
			reFlag.value++;
		});
		watch(() => props.maxWidth, () => {
			reFlag.value++;
		});
		watch(() => props.native, () => {
			reFlag.value++;
		});
		watch(() => props.syncResize, () => {
			reFlag.value++;
		});
		watch(computeYWidth, () => {
			reFlag.value++;
		});
		watch(computeXHeight, () => {
			reFlag.value++;
		});
		watch(computeXVisible, () => {
			nextTick(() => {
				reFlag.value++;
			});
		});
		watch(computeYVisible, () => {
			nextTick(() => {
				reFlag.value++;
			});
		});
		watch(reFlag, () => {
			$xeScrollbar.recalculate().then(() => {
				$xeScrollbar.recalculate();
			});
		});
		onMounted(() => {
			const { autoResize } = props;
			const viewEl = refViewElem.value;
			const viewInnerEl = refViewInnerElem.value;
			if (autoResize) {
				const scrollObserver = globalResize.create(() => {
					if (props.autoResize) reFlag.value++;
				});
				if (viewEl) scrollObserver.observe(viewEl);
				if (viewInnerEl) scrollObserver.observe(viewInnerEl);
				internalData.scrollObserver = scrollObserver;
			}
			reFlag.value++;
			globalEvents$1.on($xeScrollbar, "resize", () => {
				reFlag.value++;
			});
		});
		onBeforeUnmount(() => {
			const { scrollObserver } = internalData;
			if (scrollObserver) scrollObserver.disconnect();
			globalEvents$1.off($xeScrollbar, "resize");
		});
		$xeScrollbar.renderVN = renderVN;
		return $xeScrollbar;
	},
	render() {
		return this.renderVN();
	}
});
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/scrollbar/index.js
var VxeScrollbar = Object.assign({}, scrollbar_default$1, { install(app) {
	app.component(scrollbar_default$1.name, scrollbar_default$1);
} });
dynamicApp.use(VxeScrollbar);
VxeUI.component(scrollbar_default$1);
var Scrollbar = VxeScrollbar;
var scrollbar_default = VxeScrollbar;
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/tooltip/src/tooltip.js
var { baseUtils, useFns, getConfig, createEvent, globalEvents } = VxeUI;
var { getDefVal } = baseUtils;
function createReactData() {
	return {
		target: null,
		isUpdate: false,
		visible: false,
		tipPos: null,
		tipContent: "",
		tipActive: false,
		tipTarget: null,
		tipZindex: 0,
		tipStore: {
			style: {},
			placement: "",
			arrowStyle: {}
		}
	};
}
function createInternalData() {
	return {};
}
var tooltip_default$1 = defineVxeComponent({
	name: "VxeTooltip",
	props: {
		modelValue: Boolean,
		size: {
			type: String,
			default: () => getConfig().tooltip.size || getConfig().size
		},
		selector: [String, Element],
		trigger: {
			type: String,
			default: () => getConfig().tooltip.trigger || "hover"
		},
		theme: {
			type: String,
			default: () => getConfig().tooltip.theme || "dark"
		},
		content: {
			type: [String, Number],
			default: null
		},
		useHtml: {
			type: Boolean,
			default: () => index_esm_default.isBoolean(getConfig().tooltip.useHtml) ? getConfig().tooltip.useHtml : null
		},
		useHTML: {
			type: Boolean,
			default: () => getConfig().tooltip.useHTML
		},
		zIndex: [String, Number],
		popupClassName: [String, Function],
		width: {
			type: [String, Number],
			default: () => getConfig().tooltip.Width
		},
		height: {
			type: [String, Number],
			default: () => getConfig().tooltip.height
		},
		minWidth: {
			type: [String, Number],
			default: () => getConfig().tooltip.minWidth
		},
		minHeight: {
			type: [String, Number],
			default: () => getConfig().tooltip.minHeight
		},
		maxWidth: {
			type: [String, Number],
			default: () => getConfig().tooltip.maxWidth
		},
		maxHeight: {
			type: [String, Number],
			default: () => getConfig().tooltip.maxHeight
		},
		placement: {
			type: String,
			default: () => getConfig().tooltip.placement
		},
		defaultPlacement: {
			type: String,
			default: () => getConfig().tooltip.defaultPlacement
		},
		isArrow: {
			type: Boolean,
			default: () => getConfig().tooltip.isArrow
		},
		enterable: {
			type: Boolean,
			default: () => getConfig().tooltip.enterable
		},
		enterDelay: {
			type: Number,
			default: () => getConfig().tooltip.enterDelay
		},
		leaveDelay: {
			type: Number,
			default: () => getConfig().tooltip.leaveDelay
		},
		appendTo: {
			type: [String, Function],
			default: () => getConfig().tooltip.appendTo
		},
		useScrollbar: {
			type: Boolean,
			default: () => getDefVal(getConfig().tooltip.useScrollbar, getConfig().useScrollbar)
		},
		scrollbarConfig: Object
	},
	emits: [
		"update:modelValue",
		"show",
		"hide"
	],
	setup(props, context) {
		const { slots, emit } = context;
		const xID = index_esm_default.uniqueId();
		const { computeSize } = useFns.useSize(props);
		const { computeIsVScrollbar } = useFns.useVScrollbar(props);
		const reactData = reactive(createReactData());
		const internalData = createInternalData();
		const refElem = ref();
		const contentScrollbar = ref();
		const contentWrapperElem = ref();
		const computeWrapperStyle = computed(() => {
			const { width, height, minHeight, minWidth, maxHeight, maxWidth } = props;
			const stys = {};
			if (width) stys.width = toCssUnit(width);
			if (height) stys.height = toCssUnit(height);
			if (minWidth) stys.minWidth = toCssUnit(minWidth);
			if (minHeight) stys.minHeight = toCssUnit(minHeight);
			if (maxWidth) stys.maxWidth = toCssUnit(maxWidth);
			if (maxHeight) stys.maxHeight = toCssUnit(maxHeight);
			return stys;
		});
		const refMaps = { refElem };
		const $xeTooltip = {
			xID,
			props,
			context,
			reactData,
			internalData,
			getRefMaps: () => refMaps
		};
		const dispatchEvent = (type, params, evnt) => {
			emit(type, createEvent(evnt, { $tooltip: $xeTooltip }, params));
		};
		const updateValue = (value) => {
			if (value !== reactData.visible) {
				reactData.visible = value;
				reactData.isUpdate = true;
				emit("update:modelValue", value);
			}
		};
		const updateZIndex = () => {
			const { zIndex } = props;
			if (zIndex) reactData.tipZindex = index_esm_default.toNumber(zIndex);
			else if (reactData.tipZindex < getLastZIndex()) reactData.tipZindex = nextZIndex();
		};
		const clickEvent = () => {
			if (reactData.visible) $xeTooltip.close();
			else handleVisible(reactData.target || getSelectorEl(), props.content);
		};
		const targetMouseenterEvent = () => {
			handleVisible(reactData.target || getSelectorEl(), props.content);
		};
		const targetMouseleaveEvent = () => {
			const { trigger, enterable, leaveDelay } = props;
			reactData.tipActive = false;
			if (enterable && trigger === "hover") setTimeout(() => {
				if (!reactData.tipActive) $xeTooltip.close();
			}, leaveDelay);
			else $xeTooltip.close();
		};
		const wrapperMouseenterEvent = () => {
			reactData.tipActive = true;
		};
		const wrapperMouseleaveEvent = () => {
			const { trigger, enterable, leaveDelay } = props;
			reactData.tipActive = false;
			if (enterable && trigger === "hover") setTimeout(() => {
				if (!reactData.tipActive) $xeTooltip.close();
			}, leaveDelay);
		};
		const showTip = () => {
			const { appendTo } = props;
			const { tipStore } = reactData;
			const panelElem = refElem.value;
			if (panelElem) {
				if (!panelElem.parentNode) getPopupAppendElement(appendTo).appendChild(panelElem);
			}
			updateValue(true);
			updateZIndex();
			tipStore.placement = "top";
			tipStore.style = {
				width: "auto",
				left: 0,
				top: 0,
				zIndex: props.zIndex || reactData.tipZindex
			};
			tipStore.arrowStyle = { left: "50%" };
			return $xeTooltip.updatePlacement().then(() => {
				return $xeTooltip.updatePlacement();
			});
		};
		const handleDelayFn = () => {
			internalData.showDelayTip = index_esm_default.debounce(() => {
				if (reactData.tipActive) showTip();
			}, props.enterDelay, {
				leading: false,
				trailing: true
			});
		};
		const handleVisible = (target, content, evnt) => {
			if (!slots.content && (content === "" || index_esm_default.eqNull(content))) return nextTick();
			if (target) {
				const { showDelayTip } = internalData;
				const { trigger, enterDelay } = props;
				if (evnt) reactData.tipPos = {
					x: evnt.clientX,
					y: evnt.clientY,
					oLeft: evnt.offsetX,
					oTop: evnt.offsetY
				};
				else reactData.tipPos = null;
				reactData.tipActive = true;
				reactData.tipTarget = target;
				reactData.tipContent = content;
				if (reactData.visible) return $xeTooltip.updatePlacement();
				if (enterDelay && trigger === "hover") {
					if (showDelayTip) showDelayTip();
					dispatchEvent("show", {}, evnt || null);
				} else {
					const rest = showTip();
					dispatchEvent("show", {}, evnt || null);
					return rest;
				}
			}
			return nextTick();
		};
		const getSelectorEl = () => {
			const { selector } = props;
			if (selector) {
				if (index_esm_default.isElement(selector)) return selector;
				if (index_esm_default.isString(selector)) return document.querySelector(selector);
			}
			return null;
		};
		const updateTipStyle = () => {
			const { placement, defaultPlacement, appendTo, isArrow } = props;
			const { tipTarget: targetElem, tipStore, tipPos, tipZindex } = reactData;
			const panelElem = refElem.value;
			if (!targetElem || !panelElem) return nextTick();
			const targetRect = targetElem.getBoundingClientRect();
			const targetWidth = targetElem.offsetWidth;
			const targetHeight = targetElem.offsetHeight;
			const panelWidth = panelElem.offsetWidth;
			const targetLeft = targetRect.left;
			const targetTop = targetRect.top;
			let left = 0;
			let top = 0;
			if (tipPos && (tipPos.oLeft || tipPos.oTop)) {
				left = targetLeft;
				top = targetTop + targetHeight;
				if (isArrow) left = left + Math.max(8, Math.min(targetWidth - 8, tipPos.oLeft)) - panelWidth / 2;
				else {
					left = tipPos.x + 1;
					top = tipPos.y + 1;
				}
			}
			const ppObj = updatePanelPlacement(targetElem, panelElem, {
				defaultTop: top,
				defaultLeft: left,
				placement,
				defaultPlacement,
				appendTo,
				isMinWidth: false,
				teleportTo: true
			});
			const panelStyle = Object.assign(ppObj.style, { zIndex: tipZindex });
			tipStore.placement = ppObj.placement;
			tipStore.style = panelStyle;
			tipStore.arrowStyle.left = ppObj.arrowLeft ? `${ppObj.arrowLeft}px` : "";
			return nextTick();
		};
		const tooltipMethods = {
			dispatchEvent,
			openByEvent(evnt, target, content) {
				return handleVisible(target || reactData.target || getSelectorEl(), content, evnt);
			},
			open(target, content) {
				return handleVisible(target || reactData.target || getSelectorEl(), content);
			},
			close() {
				reactData.tipPos = null;
				reactData.tipTarget = null;
				reactData.tipActive = false;
				Object.assign(reactData.tipStore, {
					style: {},
					placement: "",
					arrowStyle: null
				});
				updateValue(false);
				dispatchEvent("hide", {}, null);
				return nextTick();
			},
			toVisible(target, content) {
				return handleVisible(target, content);
			},
			updatePlacement() {
				return updateTipStyle().then(() => {
					return updateTipStyle();
				}).then(() => {
					return updateTipStyle();
				});
			},
			isActived() {
				return reactData.tipActive;
			},
			setActived(active) {
				reactData.tipActive = !!active;
			}
		};
		const wheelEvent = (evnt) => {
			evnt.stopPropagation();
		};
		const handleGlobalScrollEvent = () => {
			if (reactData.visible) $xeTooltip.updatePlacement();
		};
		const handleGlobalBlurEvent = () => {
			$xeTooltip.close();
		};
		Object.assign($xeTooltip, tooltipMethods, { handleCloseEvent: targetMouseleaveEvent });
		const renderContent = () => {
			const { theme, useHtml, useHTML } = props;
			const { tipContent } = reactData;
			const isVScrollbar = computeIsVScrollbar.value;
			const wrapperStyle = computeWrapperStyle.value;
			const contentSlot = slots.content;
			const contVNs = [];
			if (contentSlot) contVNs.push(h("div", { key: "ct" }, getSlotVNs(contentSlot({}))));
			else if (index_esm_default.isBoolean(useHtml) ? useHtml : useHTML) contVNs.push(h("div", {
				key: "ch",
				innerHTML: tipContent
			}));
			else contVNs.push(h("span", { key: "cd" }, `${tipContent}`));
			if (isVScrollbar) return h(scrollbar_default, {
				key: 5,
				ref: contentScrollbar,
				class: "vxe-tooltip--scrollbar-content",
				theme,
				viewClassName: "vxe-tooltip--scrollbar-content-view",
				viewInnerClassName: "vxe-tooltip--scrollbar-content-inner",
				viewStyle: wrapperStyle
			}, { default: () => contVNs });
			return h("div", {
				key: 3,
				ref: contentWrapperElem,
				class: "vxe-tooltip--content",
				style: wrapperStyle
			}, contVNs);
		};
		const renderVN = () => {
			const { popupClassName, theme, isArrow, enterable } = props;
			const { tipActive, visible, tipStore } = reactData;
			const defaultSlot = slots.default;
			const vSize = computeSize.value;
			let ons;
			if (enterable) ons = {
				onMouseenter: wrapperMouseenterEvent,
				onMouseleave: wrapperMouseleaveEvent
			};
			return h("div", {
				ref: refElem,
				class: [
					"vxe-tooltip--wrapper",
					`theme--${theme}`,
					popupClassName ? index_esm_default.isFunction(popupClassName) ? popupClassName({ $tooltip: $xeTooltip }) : popupClassName : "",
					{
						[`size--${vSize}`]: vSize,
						[`placement--${tipStore.placement}`]: tipStore.placement,
						"is--enterable": enterable,
						"is--visible": visible,
						"is--arrow": isArrow,
						"is--active": tipActive
					}
				],
				style: tipStore.style,
				...ons
			}, [h("div", {
				key: "tby",
				class: "vxe-tooltip--body"
			}, [renderContent(), h("div", {
				class: "vxe-tooltip--arrow",
				style: tipStore.arrowStyle
			})]), ...defaultSlot ? getSlotVNs(defaultSlot({})) : []]);
		};
		watch(() => props.enterDelay, () => {
			handleDelayFn();
		});
		watch(() => props.content, (val) => {
			reactData.tipContent = val;
		});
		watch(() => props.modelValue, (val) => {
			if (!reactData.isUpdate) if (val) handleVisible(reactData.target || getSelectorEl(), props.content);
			else $xeTooltip.close();
			reactData.isUpdate = false;
		});
		handleDelayFn();
		onMounted(() => {
			const $scrollbar = contentScrollbar.value;
			if ($scrollbar) {
				const viewEl = $scrollbar.getScrollViewElem();
				if (viewEl) {
					viewEl.addEventListener("wheel", wheelEvent, { passive: false });
					internalData.scrollbarViewEl = viewEl;
				}
			}
			const contentWrapperfEl = contentWrapperElem.value;
			if (contentWrapperfEl) contentWrapperfEl.addEventListener("wheel", wheelEvent, { passive: false });
			nextTick(() => {
				const { trigger, content } = props;
				const panelElem = refElem.value;
				if (panelElem) {
					const parentNode = panelElem.parentNode;
					if (parentNode) {
						reactData.tipContent = content;
						reactData.tipZindex = nextZIndex();
						index_esm_default.arrayEach(panelElem.children, (elem, index) => {
							if (index) {
								parentNode.insertBefore(elem, panelElem);
								if (!reactData.target) reactData.target = elem;
							}
						});
						parentNode.removeChild(panelElem);
						const { target } = reactData;
						if (target) {
							if (trigger === "hover") {
								target.onmouseenter = targetMouseenterEvent;
								target.onmouseleave = targetMouseleaveEvent;
							} else if (trigger === "click") target.onclick = clickEvent;
						}
						if (props.modelValue) handleVisible(target || getSelectorEl(), content);
					}
				}
			});
			globalEvents.on($xeTooltip, "blur", handleGlobalBlurEvent);
			globalEvents.on($xeTooltip, "scroll", handleGlobalScrollEvent);
		});
		onBeforeUnmount(() => {
			const { target } = reactData;
			const { scrollbarViewEl } = internalData;
			const panelElem = refElem.value;
			if (target) {
				target.onmouseenter = null;
				target.onmouseleave = null;
				target.onclick = null;
			}
			const contentWrapperfEl = contentWrapperElem.value;
			if (contentWrapperfEl) contentWrapperfEl.removeEventListener("wheel", wheelEvent);
			if (scrollbarViewEl) scrollbarViewEl.removeEventListener("wheel", wheelEvent);
			if (panelElem) {
				const parentNode = panelElem.parentNode;
				if (parentNode) parentNode.removeChild(panelElem);
			}
			globalEvents.off($xeTooltip, "blur");
			globalEvents.off($xeTooltip, "scroll");
			index_esm_default.assign(reactData, createReactData());
			index_esm_default.assign(internalData, createInternalData());
		});
		$xeTooltip.renderVN = renderVN;
		return $xeTooltip;
	},
	render() {
		return this.renderVN();
	}
});
//#endregion
//#region ../../node_modules/.pnpm/vxe-pc-ui@4.20.39_vue@3.5.45_typescript@5.9.3_/node_modules/vxe-pc-ui/es/tooltip/index.js
var VxeTooltip = Object.assign({}, tooltip_default$1, { install(app) {
	app.component(tooltip_default$1.name, tooltip_default$1);
} });
var TooltipController = {
	open(target, options) {
		const opts = Object.assign({}, options, {
			key: "tip",
			modelValue: true,
			trigger: "hover",
			selector: target,
			appendTo: null
		});
		const $tooltip = refTooltip.value;
		dynamicStore.globalTooltip = opts;
		if ($tooltip) $tooltip.open(target, opts.content);
		else {
			dynamicStore.isTipInit = true;
			checkDynamic();
		}
		return Promise.resolve();
	},
	close() {
		const { globalTooltip } = dynamicStore;
		if (!globalTooltip || !globalTooltip.modelValue) return Promise.resolve();
		const $tooltip = refTooltip.value;
		if ($tooltip) $tooltip.handleCloseEvent();
		else if (globalTooltip) globalTooltip.modelValue = false;
		return Promise.resolve();
	},
	destroy() {
		const { globalTooltip } = dynamicStore;
		if (!globalTooltip || !globalTooltip.modelValue) return Promise.resolve();
		const $tooltip = refTooltip.value;
		if ($tooltip) return $tooltip.close().then(() => {
			dynamicStore.globalTooltip = null;
			dynamicStore.isTipInit = false;
		});
		if (globalTooltip) globalTooltip.modelValue = false;
		return Promise.resolve();
	}
};
dynamicApp.use(VxeTooltip);
VxeUI.component(tooltip_default$1);
VxeUI.tooltip = TooltipController;
var Tooltip = VxeTooltip;
var tooltip_default = VxeTooltip;
//#endregion
export { getOffsetPos as A, removeClass as B, isEnableConf as C, getAbsolutePos as D, addClass as E, getTpImg as F, getModelEvent as G, toCssUnit as H, hasClass as I, checkDynamic as J, getOnName as K, hasControlKey as L, getPopupContainer as M, getPopupWrapperElement as N, getDomNode as O, getPropClass as P, initTpImg as R, hasEnableConf as S, nextZIndex as T, updatePanelPlacement as U, scrollToView as V, getChangeEvent as W, dynamicStore as X, dynamicApp as Y, defineVxeComponent as Z, getGlobalDefaultConfig as _, Scrollbar as a, getText as b, Loading as c, loading_default as d, deModelValue as f, getFuncText as g, getDefaultConfig as h, tooltip_default as i, getPaddingTopBottomSize as j, getEventTargetNode as k, LoadingController as l, eqEmptyValue as m, TooltipController as n, VxeScrollbar as o, enModelValue as p, getSlotVNs as q, VxeTooltip as r, scrollbar_default as s, Tooltip as t, VxeLoading as u, getLastZIndex as v, nextSubZIndex as w, handleBooleanDefaultValue as x, getSubLastZIndex as y, isScale as z };
