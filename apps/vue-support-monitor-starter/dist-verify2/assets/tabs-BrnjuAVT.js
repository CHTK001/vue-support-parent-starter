import { $n as normalizeClass, B as h, D as createVNode, Dn as triggerRef, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Lt as useSlots, On as unref, Yt as withDirectives, Z as isVNode, at as onBeforeUpdate, b as createElementBlock, ct as onMounted, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, pt as onUpdated, tt as nextTick, vn as ref, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { r as UPDATE_MODEL_EVENT } from "./event-CeZgVnv0.js";
import { t as clamp } from "./clamp--xaQdoQg.js";
import { a as throwError, c as definePropType, f as isNumber, h as isUndefined, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as omit } from "./omit-nJwLfQRJ.js";
import { t as isUndefined$1 } from "./isUndefined-DfHYomSZ.js";
import { _ as useWindowFocus, h as useResizeObserver, l as useElementSize, s as useDocumentVisibility } from "./dist-Clzx2YUA.js";
import { n as isFirefox } from "./browser-DVA6k_z5.js";
import { o as capitalize, t as flattedChildren } from "./vnode-6UdpuL7k.js";
import { n as rAF, t as cAF } from "./raf-Ck-OXP6t.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { Et as plus_default, a as arrow_right_default, i as arrow_left_default, w as close_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as mutable } from "./typescript-CMUKtCBO.js";
import { t as isGreaterThan } from "./numbers-I--Pu7qj.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-ordered-children/index.mjs
var getOrderedChildren = (vm, childComponentName, children) => {
	return flattedChildren(vm.subTree).filter((n) => isVNode(n) && n.type?.name === childComponentName && !!n.component).map((n) => n.component.uid).map((uid) => children[uid]).filter((p) => !!p);
};
var useOrderedChildren = (vm, childComponentName) => {
	const children = shallowRef({});
	const orderedChildren = shallowRef([]);
	const nodesMap = /* @__PURE__ */ new WeakMap();
	const addChild = (child) => {
		children.value[child.uid] = child;
		triggerRef(children);
		onMounted(() => {
			const childNode = child.getVnode().el;
			const parentNode = childNode.parentNode;
			if (!nodesMap.has(parentNode)) {
				nodesMap.set(parentNode, []);
				const originalFn = parentNode.insertBefore.bind(parentNode);
				parentNode.insertBefore = (node, anchor) => {
					if (nodesMap.get(parentNode).some((el) => node === el || anchor === el)) triggerRef(children);
					return originalFn(node, anchor);
				};
			}
			nodesMap.get(parentNode).push(childNode);
		});
	};
	const removeChild = (child) => {
		delete children.value[child.uid];
		triggerRef(children);
		const childNode = child.getVnode().el;
		const parentNode = childNode.parentNode;
		const childNodes = nodesMap.get(parentNode);
		const index = childNodes.indexOf(childNode);
		childNodes.splice(index, 1);
	};
	const sortChildren = () => {
		orderedChildren.value = getOrderedChildren(vm, childComponentName, children.value);
	};
	const IsolatedRenderer = (props) => {
		return props.render();
	};
	return {
		children: orderedChildren,
		addChild,
		removeChild,
		ChildrenSorter: defineComponent({ setup(_, { slots }) {
			return () => {
				sortChildren();
				return slots.default ? h(IsolatedRenderer, { render: slots.default }) : null;
			};
		} })
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/hooks/use-wheel.mjs
var useWheel = ({ atEndEdge, atStartEdge, layout }, onWheelDelta) => {
	let frameHandle;
	let offset = 0;
	const hasReachedEdge = (offset) => {
		return offset < 0 && atStartEdge.value || offset > 0 && atEndEdge.value;
	};
	const onWheel = (e) => {
		cAF(frameHandle);
		let { deltaX, deltaY } = e;
		if (e.shiftKey && deltaY !== 0) {
			deltaX = deltaY;
			deltaY = 0;
		}
		const newOffset = layout.value === "horizontal" ? deltaX : deltaY;
		if (hasReachedEdge(newOffset)) return;
		offset += newOffset;
		if (!isFirefox() && newOffset !== 0) e.preventDefault();
		frameHandle = rAF(() => {
			onWheelDelta(offset);
			offset = 0;
		});
	};
	return {
		hasReachedEdge,
		onWheel
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/dom/position.mjs
var getOffsetTop = (el) => {
	let offset = 0;
	let parent = el;
	while (parent) {
		offset += parent.offsetTop;
		parent = parent.offsetParent;
	}
	return offset;
};
var getOffsetTopDistance = (el, containerEl) => {
	return Math.abs(getOffsetTop(el) - getOffsetTop(containerEl));
};
var getClientXY = (event) => {
	let clientX;
	let clientY;
	if (event.type === "touchend") {
		clientY = event.changedTouches[0].clientY;
		clientX = event.changedTouches[0].clientX;
	} else if (event.type.startsWith("touch")) {
		clientY = event.touches[0].clientY;
		clientX = event.touches[0].clientX;
	} else {
		clientY = event.clientY;
		clientX = event.clientX;
	}
	return {
		clientX,
		clientY
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/constants.mjs
var tabsRootContextKey = Symbol("tabsRootContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-bar.mjs
/**
* @deprecated Removed after 3.0.0, Use `TabBarProps` instead.
*/
var tabBarProps = buildProps({
	tabs: {
		type: definePropType(Array),
		default: () => mutable([])
	},
	tabRefs: {
		type: definePropType(Object),
		default: () => mutable({})
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-bar.vue_vue_type_script_setup_true_lang.mjs
var COMPONENT_NAME$2 = "ElTabBar";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-bar2.mjs
var tab_bar_default = /* @__PURE__ */ defineComponent({
	name: COMPONENT_NAME$2,
	__name: "tab-bar",
	props: tabBarProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const rootTabs = inject(tabsRootContextKey);
		if (!rootTabs) throwError(COMPONENT_NAME$2, "<el-tabs><el-tab-bar /></el-tabs>");
		const ns = useNamespace("tabs");
		const barRef = ref();
		const barStyle = ref();
		/**
		* when defaultValue is not set, the bar is always shown.
		*
		* when defaultValue is set, the bar will be hidden until style is calculated
		* to avoid the bar showing in the wrong position on initial render.
		*/
		const renderActiveBar = computed(() => isUndefined(rootTabs.props.defaultValue) || Boolean(barStyle.value?.transform));
		const getBarStyle = () => {
			let offset = 0;
			let tabSize = 0;
			const sizeName = ["top", "bottom"].includes(rootTabs.props.tabPosition) ? "width" : "height";
			const sizeDir = sizeName === "width" ? "x" : "y";
			const position = sizeDir === "x" ? "left" : "top";
			props.tabs.every((tab) => {
				if (isUndefined(tab.paneName)) return false;
				const $el = props.tabRefs[tab.paneName];
				if (!$el) return false;
				if (!tab.active) return true;
				offset = $el[`offset${capitalize(position)}`];
				tabSize = $el[`client${capitalize(sizeName)}`];
				const tabStyles = window.getComputedStyle($el);
				if (sizeName === "width") {
					tabSize -= Number.parseFloat(tabStyles.paddingLeft) + Number.parseFloat(tabStyles.paddingRight);
					offset += Number.parseFloat(tabStyles.paddingLeft);
				}
				return false;
			});
			return {
				[sizeName]: `${tabSize}px`,
				transform: `translate${capitalize(sizeDir)}(${offset}px)`
			};
		};
		const update = () => barStyle.value = getBarStyle();
		const tabObservers = [];
		const observerTabs = () => {
			tabObservers.forEach((observer) => observer.stop());
			tabObservers.length = 0;
			Object.values(props.tabRefs).forEach((tab) => {
				tabObservers.push(useResizeObserver(tab, update));
			});
		};
		watch(() => props.tabs, async () => {
			await nextTick();
			update();
			observerTabs();
		}, { immediate: true });
		const barObserver = useResizeObserver(barRef, () => update());
		onBeforeUnmount(() => {
			tabObservers.forEach((observer) => observer.stop());
			tabObservers.length = 0;
			barObserver.stop();
		});
		__expose({
			/** @description tab root html element */
			ref: barRef,
			/** @description method to manually update tab bar style, return the updated style */
			update
		});
		return (_ctx, _cache) => {
			return renderActiveBar.value ? (openBlock(), createElementBlock("div", {
				key: 0,
				ref_key: "barRef",
				ref: barRef,
				class: normalizeClass([unref(ns).e("active-bar"), unref(ns).is(unref(rootTabs).props.tabPosition)]),
				style: normalizeStyle(barStyle.value)
			}, null, 6)) : createCommentVNode("v-if", true);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/composables/use-tab-nav-touch.mjs
var TOUCH_SCROLL_THRESHOLD = 5;
var useTabNavTouch = ({ scrollable, navOffset, navSize, navContainerSize, isHorizontal }) => {
	const isTouchScrolling = ref(false);
	const maxOffset = computed(() => Math.max(navSize.value - navContainerSize.value, 0));
	let touchState;
	let isMainAxisTouch;
	const handleTouchStart = (event) => {
		if (!scrollable.value || event.touches.length !== 1) return;
		const { clientX, clientY } = getClientXY(event);
		touchState = {
			startX: clientX,
			startY: clientY,
			startOffset: navOffset.value
		};
		isMainAxisTouch = void 0;
	};
	const handleTouchMove = (event) => {
		if (!touchState || !scrollable.value) return;
		if (event.touches.length !== 1) {
			handleTouchEnd();
			return;
		}
		const { clientX, clientY } = getClientXY(event);
		const deltaX = touchState.startX - clientX;
		const deltaY = touchState.startY - clientY;
		const mainAxisDelta = isHorizontal.value ? deltaX : deltaY;
		const crossAxisDelta = isHorizontal.value ? deltaY : deltaX;
		const mainAxisDistance = Math.abs(mainAxisDelta);
		const crossAxisDistance = Math.abs(crossAxisDelta);
		if (isUndefined$1(isMainAxisTouch)) {
			if (Math.max(mainAxisDistance, crossAxisDistance) <= TOUCH_SCROLL_THRESHOLD) return;
			isMainAxisTouch = mainAxisDistance > crossAxisDistance;
		}
		if (!isMainAxisTouch) return;
		const nextOffset = clamp(touchState.startOffset + mainAxisDelta, 0, maxOffset.value);
		if (maxOffset.value <= 0 || nextOffset === navOffset.value || !event.cancelable) return;
		event.preventDefault();
		isTouchScrolling.value = true;
		navOffset.value = nextOffset;
	};
	const handleTouchEnd = () => {
		touchState = void 0;
		isMainAxisTouch = void 0;
		isTouchScrolling.value = false;
	};
	return {
		isTouchScrolling,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-nav.mjs
var tabNavProps = buildProps({
	panes: {
		type: definePropType(Array),
		default: () => mutable([])
	},
	currentName: {
		type: [String, Number],
		default: ""
	},
	editable: Boolean,
	type: {
		type: String,
		values: [
			"card",
			"border-card",
			""
		],
		default: ""
	},
	stretch: Boolean,
	/**
	* @description tab-nav tabindex
	*/
	tabindex: {
		type: [String, Number],
		default: void 0
	}
});
var tabNavEmits = {
	tabClick: (tab, tabName, ev) => ev instanceof Event,
	tabRemove: (tab, ev) => ev instanceof Event
};
var COMPONENT_NAME$1 = "ElTabNav";
var TabNav = /* @__PURE__ */ defineComponent({
	name: COMPONENT_NAME$1,
	props: tabNavProps,
	emits: tabNavEmits,
	setup(props, { expose, emit }) {
		const rootTabs = inject(tabsRootContextKey);
		if (!rootTabs) throwError(COMPONENT_NAME$1, `<el-tabs><tab-nav /></el-tabs>`);
		const ns = useNamespace("tabs");
		const visibility = useDocumentVisibility();
		const focused = useWindowFocus();
		const navScroll$ = ref();
		const nav$ = ref();
		const el$ = ref();
		const tabRefsMap = ref({});
		const tabBarRef = ref();
		const scrollable = ref(false);
		const navOffset = ref(0);
		const isFocus = ref(false);
		const focusable = ref(true);
		const isWheelScrolling = ref(false);
		const tracker = shallowRef();
		const isHorizontal = computed(() => ["top", "bottom"].includes(rootTabs.props.tabPosition));
		const sizeName = computed(() => isHorizontal.value ? "width" : "height");
		const navStyle = computed(() => {
			const dir = sizeName.value === "width" ? "X" : "Y";
			return {
				transition: isWheelScrolling.value || isTouchScrolling.value ? "none" : void 0,
				transform: `translate${dir}(-${navOffset.value}px)`
			};
		});
		const { width: navContainerWidth, height: navContainerHeight } = useElementSize(navScroll$);
		const { width: navWidth, height: navHeight } = useElementSize(nav$, {
			width: 0,
			height: 0
		}, { box: "border-box" });
		const navContainerSize = computed(() => isHorizontal.value ? navContainerWidth.value : navContainerHeight.value);
		const navSize = computed(() => isHorizontal.value ? navWidth.value : navHeight.value);
		const { onWheel } = useWheel({
			atStartEdge: computed(() => navOffset.value <= 0),
			atEndEdge: computed(() => navSize.value - navOffset.value <= navContainerSize.value),
			layout: computed(() => isHorizontal.value ? "horizontal" : "vertical")
		}, (offset) => {
			navOffset.value = clamp(navOffset.value + offset, 0, navSize.value - navContainerSize.value);
		});
		const handleWheel = (event) => {
			isWheelScrolling.value = true;
			onWheel(event);
			rAF(() => {
				isWheelScrolling.value = false;
			});
		};
		const { isTouchScrolling, handleTouchStart, handleTouchMove, handleTouchEnd } = useTabNavTouch({
			scrollable,
			navOffset,
			navSize,
			navContainerSize,
			isHorizontal
		});
		const scrollPrev = () => {
			if (!navScroll$.value) return;
			const containerSize = navScroll$.value.getBoundingClientRect()[sizeName.value];
			const currentOffset = navOffset.value;
			if (!currentOffset) return;
			navOffset.value = currentOffset > containerSize ? currentOffset - containerSize : 0;
		};
		const scrollNext = () => {
			if (!navScroll$.value || !nav$.value) return;
			const navSize = nav$.value.getBoundingClientRect()[sizeName.value];
			const containerSize = navScroll$.value.getBoundingClientRect()[sizeName.value];
			const currentOffset = navOffset.value;
			if (!isGreaterThan(navSize - currentOffset, containerSize)) return;
			navOffset.value = navSize - currentOffset > containerSize * 2 ? currentOffset + containerSize : navSize - containerSize;
		};
		const scrollToActiveTab = async () => {
			const nav = nav$.value;
			if (!scrollable.value || !el$.value || !navScroll$.value || !nav) return;
			await nextTick();
			const activeTab = tabRefsMap.value[props.currentName];
			if (!activeTab) return;
			const navScroll = navScroll$.value;
			const activeTabBounding = activeTab.getBoundingClientRect();
			const navScrollBounding = navScroll.getBoundingClientRect();
			const navScrollLeft = navScrollBounding.left + 1;
			const navScrollRight = navScrollBounding.right - 1;
			const navBounding = nav.getBoundingClientRect();
			const maxOffset = isHorizontal.value ? navBounding.width - navScrollBounding.width : navBounding.height - navScrollBounding.height;
			const currentOffset = navOffset.value;
			let newOffset = currentOffset;
			if (isHorizontal.value) {
				if (activeTabBounding.left < navScrollLeft) newOffset = currentOffset - (navScrollLeft - activeTabBounding.left);
				if (activeTabBounding.right > navScrollRight) newOffset = currentOffset + activeTabBounding.right - navScrollRight;
			} else {
				if (activeTabBounding.top < navScrollBounding.top) newOffset = currentOffset - (navScrollBounding.top - activeTabBounding.top);
				if (activeTabBounding.bottom > navScrollBounding.bottom) newOffset = currentOffset + (activeTabBounding.bottom - navScrollBounding.bottom);
			}
			newOffset = Math.max(newOffset, 0);
			navOffset.value = Math.min(newOffset, maxOffset);
		};
		const update = () => {
			if (!nav$.value || !navScroll$.value) return;
			props.stretch && tabBarRef.value?.update();
			const navSize = nav$.value.getBoundingClientRect()[sizeName.value];
			const containerSize = navScroll$.value.getBoundingClientRect()[sizeName.value];
			const currentOffset = navOffset.value;
			if (containerSize < navSize) {
				scrollable.value = scrollable.value || {};
				scrollable.value.prev = currentOffset;
				scrollable.value.next = isGreaterThan(navSize, currentOffset + containerSize);
				if (isGreaterThan(containerSize, navSize - currentOffset)) navOffset.value = navSize - containerSize;
			} else {
				scrollable.value = false;
				if (currentOffset > 0) navOffset.value = 0;
			}
		};
		const changeTab = (event) => {
			const code = getEventCode(event);
			let step = 0;
			switch (code) {
				case EVENT_CODE.left:
				case EVENT_CODE.up:
					step = -1;
					break;
				case EVENT_CODE.right:
				case EVENT_CODE.down:
					step = 1;
					break;
				default: return;
			}
			const tabList = Array.from(event.currentTarget.querySelectorAll("[role=tab]:not(.is-disabled)"));
			let nextIndex = tabList.indexOf(event.target) + step;
			if (nextIndex < 0) nextIndex = tabList.length - 1;
			else if (nextIndex >= tabList.length) nextIndex = 0;
			tabList[nextIndex].focus({ preventScroll: true });
			tabList[nextIndex].click();
			setFocus();
		};
		const setFocus = () => {
			if (focusable.value) isFocus.value = true;
		};
		const removeFocus = () => isFocus.value = false;
		const setRefs = (el, key) => {
			tabRefsMap.value[key] = el;
		};
		const focusActiveTab = async () => {
			await nextTick();
			tabRefsMap.value[props.currentName]?.focus({ preventScroll: true });
		};
		watch(visibility, (visibility) => {
			if (visibility === "hidden") focusable.value = false;
			else if (visibility === "visible") setTimeout(() => focusable.value = true, 50);
		});
		watch(focused, (focused) => {
			if (focused) setTimeout(() => focusable.value = true, 50);
			else focusable.value = false;
		});
		useResizeObserver(el$, () => {
			rAF(update);
		});
		onMounted(() => setTimeout(() => scrollToActiveTab(), 0));
		onUpdated(() => update());
		expose({
			scrollToActiveTab,
			removeFocus,
			focusActiveTab,
			tabListRef: nav$,
			tabBarRef,
			scheduleRender: () => triggerRef(tracker)
		});
		return () => {
			const scrollBtn = scrollable.value ? [createVNode("span", {
				"class": [ns.e("nav-prev"), ns.is("disabled", !scrollable.value.prev)],
				"onClick": scrollPrev
			}, [createVNode(ElIcon, null, { default: () => [createVNode(arrow_left_default, null, null)] })]), createVNode("span", {
				"class": [ns.e("nav-next"), ns.is("disabled", !scrollable.value.next)],
				"onClick": scrollNext
			}, [createVNode(ElIcon, null, { default: () => [createVNode(arrow_right_default, null, null)] })])] : null;
			const tabs = props.panes.map((pane, index) => {
				const uid = pane.uid;
				const disabled = pane.props.disabled;
				const tabName = pane.props.name ?? pane.index ?? `${index}`;
				const closable = !disabled && (pane.isClosable || pane.props.closable !== false && props.editable);
				pane.index = `${index}`;
				const btnClose = closable ? createVNode(ElIcon, {
					"class": "is-icon-close",
					"onClick": (ev) => emit("tabRemove", pane, ev)
				}, { default: () => [createVNode(close_default, null, null)] }) : null;
				const tabLabelContent = pane.slots.label?.() || pane.props.label;
				const tabindex = !disabled && pane.active ? props.tabindex ?? rootTabs.props.tabindex : -1;
				return createVNode("div", {
					"ref": (el) => setRefs(el, tabName),
					"class": [
						ns.e("item"),
						ns.is(rootTabs.props.tabPosition),
						ns.is("active", pane.active),
						ns.is("disabled", disabled),
						ns.is("closable", closable),
						ns.is("focus", isFocus.value)
					],
					"id": `tab-${tabName}`,
					"key": `tab-${uid}`,
					"aria-controls": `pane-${tabName}`,
					"role": "tab",
					"aria-selected": pane.active,
					"tabindex": tabindex,
					"onFocus": () => setFocus(),
					"onBlur": () => removeFocus(),
					"onClick": (ev) => {
						removeFocus();
						emit("tabClick", pane, tabName, ev);
					},
					"onKeydown": (ev) => {
						const code = getEventCode(ev);
						if (closable && (code === EVENT_CODE.delete || code === EVENT_CODE.backspace)) emit("tabRemove", pane, ev);
					}
				}, [...[tabLabelContent, btnClose]]);
			});
			tracker.value;
			return createVNode("div", {
				"ref": el$,
				"class": [
					ns.e("nav-wrap"),
					ns.is("scrollable", !!scrollable.value),
					ns.is(rootTabs.props.tabPosition)
				]
			}, [scrollBtn, createVNode("div", {
				"class": ns.e("nav-scroll"),
				"ref": navScroll$
			}, [props.panes.length > 0 ? createVNode("div", {
				"class": [
					ns.e("nav"),
					ns.is(rootTabs.props.tabPosition),
					ns.is("stretch", props.stretch && ["top", "bottom"].includes(rootTabs.props.tabPosition))
				],
				"ref": nav$,
				"style": navStyle.value,
				"role": "tablist",
				"onKeydown": changeTab,
				"onWheel": handleWheel,
				"onTouchstart": handleTouchStart,
				"onTouchmove": handleTouchMove,
				"onTouchend": handleTouchEnd,
				"onTouchcancel": handleTouchEnd
			}, [...[!props.type ? createVNode(tab_bar_default, {
				"ref": tabBarRef,
				"tabs": [...props.panes],
				"tabRefs": tabRefsMap.value
			}, null) : null, tabs]]) : null])]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tabs.mjs
var tabsProps = buildProps({
	/**
	* @description type of Tab
	*/
	type: {
		type: String,
		values: [
			"card",
			"border-card",
			""
		],
		default: ""
	},
	/**
	* @description whether Tab is closable
	*/
	closable: Boolean,
	/**
	* @description whether Tab is addable
	*/
	addable: Boolean,
	/**
	* @description binding value, name of the selected tab
	*/
	modelValue: { type: [String, Number] },
	/**
	* @description initial value when `model-value` is not set
	*/
	defaultValue: { type: [String, Number] },
	/**
	* @description whether Tab is addable and closable
	*/
	editable: Boolean,
	/**
	* @description position of tabs
	*/
	tabPosition: {
		type: String,
		values: [
			"top",
			"right",
			"bottom",
			"left"
		],
		default: "top"
	},
	/**
	* @description hook function before switching tab. If `false` is returned or a `Promise` is returned and then is rejected, switching will be prevented
	*/
	beforeLeave: {
		type: definePropType(Function),
		default: () => true
	},
	/**
	* @description whether width of tab automatically fits its container
	*/
	stretch: Boolean,
	/**
	* @description tabs tabindex
	*/
	tabindex: {
		type: [String, Number],
		default: 0
	}
});
var isPaneName = (value) => isString(value) || isNumber(value);
var Tabs = /* @__PURE__ */ defineComponent({
	name: "ElTabs",
	props: tabsProps,
	emits: {
		[UPDATE_MODEL_EVENT]: (name) => isPaneName(name),
		tabClick: (pane, ev) => ev instanceof Event,
		tabChange: (name) => isPaneName(name),
		edit: (paneName, action) => ["remove", "add"].includes(action),
		tabRemove: (name) => isPaneName(name),
		tabAdd: () => true
	},
	setup(props, { emit, slots, expose }) {
		const ns = useNamespace("tabs");
		const isVertical = computed(() => ["left", "right"].includes(props.tabPosition));
		const { children: panes, addChild: registerPane, removeChild: unregisterPane, ChildrenSorter: PanesSorter } = useOrderedChildren(getCurrentInstance(), "ElTabPane");
		const nav$ = ref();
		const currentName = ref((isUndefined(props.modelValue) ? props.defaultValue : props.modelValue) ?? "0");
		const setCurrentName = async (value, trigger = false) => {
			if (currentName.value === value || isUndefined(value)) return;
			try {
				let canLeave;
				if (props.beforeLeave) {
					const result = props.beforeLeave(value, currentName.value);
					canLeave = result instanceof Promise ? await result : result;
				} else canLeave = true;
				if (canLeave !== false) {
					const isFocusInsidePane = panes.value.find((item) => item.paneName === currentName.value)?.isFocusInsidePane();
					currentName.value = value;
					if (trigger) {
						emit(UPDATE_MODEL_EVENT, value);
						emit("tabChange", value);
					}
					nav$.value?.removeFocus?.();
					if (isFocusInsidePane) nav$.value?.focusActiveTab();
				}
			} catch {}
		};
		const handleTabClick = (tab, tabName, event) => {
			if (tab.props.disabled) return;
			emit("tabClick", tab, event);
			setCurrentName(tabName, true);
		};
		const handleTabRemove = (pane, ev) => {
			if (pane.props.disabled || isUndefined(pane.props.name)) return;
			ev.stopPropagation();
			emit("edit", pane.props.name, "remove");
			emit("tabRemove", pane.props.name);
		};
		const handleTabAdd = () => {
			emit("edit", void 0, "add");
			emit("tabAdd");
		};
		const handleKeydown = (event) => {
			const code = getEventCode(event);
			if ([EVENT_CODE.enter, EVENT_CODE.numpadEnter].includes(code)) handleTabAdd();
		};
		const swapChildren = (vnode) => {
			const actualFirstChild = vnode.el.firstChild;
			const firstChild = ["bottom", "right"].includes(props.tabPosition) ? vnode.children[0].el : vnode.children[1].el;
			if (actualFirstChild !== firstChild) actualFirstChild.before(firstChild);
		};
		watch(() => props.modelValue, (modelValue) => setCurrentName(modelValue));
		watch(currentName, async () => {
			await nextTick();
			nav$.value?.scrollToActiveTab();
		});
		provide(tabsRootContextKey, {
			props,
			currentName,
			registerPane,
			unregisterPane,
			nav$
		});
		expose({
			currentName,
			get tabNavRef() {
				return omit(nav$.value, ["scheduleRender"]);
			}
		});
		return () => {
			const addSlot = slots["add-icon"];
			const newButton = props.editable || props.addable ? createVNode("div", {
				"class": [ns.e("new-tab"), isVertical.value && ns.e("new-tab-vertical")],
				"tabindex": props.tabindex,
				"onClick": handleTabAdd,
				"onKeydown": handleKeydown
			}, [addSlot ? renderSlot(slots, "add-icon") : createVNode(ElIcon, { "class": ns.is("icon-plus") }, { default: () => [createVNode(plus_default, null, null)] })]) : null;
			const tabNav = () => createVNode(TabNav, {
				"ref": nav$,
				"currentName": currentName.value,
				"editable": props.editable,
				"type": props.type,
				"panes": panes.value,
				"stretch": props.stretch,
				"onTabClick": handleTabClick,
				"onTabRemove": handleTabRemove
			}, null);
			const header = createVNode("div", { "class": [
				ns.e("header"),
				isVertical.value && ns.e("header-vertical"),
				ns.is(props.tabPosition)
			] }, [createVNode(PanesSorter, null, {
				default: tabNav,
				$stable: true
			}), newButton]);
			const panels = createVNode("div", { "class": ns.e("content") }, [renderSlot(slots, "default")]);
			return createVNode("div", {
				"class": [
					ns.b(),
					ns.m(props.tabPosition),
					{
						[ns.m("card")]: props.type === "card",
						[ns.m("border-card")]: props.type === "border-card"
					}
				],
				"onVnodeMounted": swapChildren,
				"onVnodeUpdated": swapChildren
			}, [panels, header]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-pane.mjs
/**
* @deprecated Removed after 3.0.0, Use `TabPaneProps` instead.
*/
var tabPaneProps = buildProps({
	/**
	* @description title of the tab
	*/
	label: {
		type: String,
		default: ""
	},
	/**
	* @description identifier corresponding to the name of Tabs, representing the alias of the tab-pane, the default is ordinal number of the tab-pane in the sequence, e.g. the first tab-pane is '0'
	*/
	name: { type: [String, Number] },
	/**
	* @description whether Tab is closable
	*/
	closable: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether Tab is disabled
	*/
	disabled: Boolean,
	/**
	* @description whether Tab is lazily rendered
	*/
	lazy: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-pane.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"id",
	"aria-hidden",
	"aria-labelledby"
];
var COMPONENT_NAME = "ElTabPane";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/src/tab-pane2.mjs
var tab_pane_default = /* @__PURE__ */ defineComponent({
	name: COMPONENT_NAME,
	__name: "tab-pane",
	props: tabPaneProps,
	setup(__props) {
		const props = __props;
		const instance = getCurrentInstance();
		const slots = useSlots();
		const tabsRoot = inject(tabsRootContextKey);
		if (!tabsRoot) throwError(COMPONENT_NAME, "usage: <el-tabs><el-tab-pane /></el-tabs/>");
		const ns = useNamespace("tab-pane");
		const paneRef = ref();
		const index = ref();
		const isClosable = computed(() => props.closable ?? tabsRoot.props.closable);
		const active = computed(() => tabsRoot.currentName.value === (props.name ?? index.value));
		const loaded = ref(active.value);
		const paneName = computed(() => props.name ?? index.value);
		const shouldBeRender = computed(() => !props.lazy || loaded.value || active.value);
		const isFocusInsidePane = () => {
			return paneRef.value?.contains(document.activeElement);
		};
		watch(active, (val) => {
			if (val) loaded.value = true;
		});
		const pane = reactive({
			uid: instance.uid,
			getVnode: () => instance.vnode,
			slots,
			props,
			paneName,
			active,
			index,
			isClosable,
			isFocusInsidePane
		});
		tabsRoot.registerPane(pane);
		onBeforeUnmount(() => {
			tabsRoot.unregisterPane(pane);
		});
		onBeforeUpdate(() => {
			if (slots.label) tabsRoot.nav$.value?.scheduleRender();
		});
		return (_ctx, _cache) => {
			return shouldBeRender.value ? withDirectives((openBlock(), createElementBlock("div", {
				key: 0,
				id: `pane-${paneName.value}`,
				ref_key: "paneRef",
				ref: paneRef,
				class: normalizeClass(unref(ns).b()),
				role: "tabpanel",
				"aria-hidden": !active.value,
				"aria-labelledby": `tab-${paneName.value}`
			}, [renderSlot(_ctx.$slots, "default")], 10, _hoisted_1)), [[vShow, active.value]]) : createCommentVNode("v-if", true);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tabs/index.mjs
var ElTabs = withInstall(Tabs, { TabPane: tab_pane_default });
var ElTabPane = withNoopInstall(tab_pane_default);
//#endregion
export { useWheel as a, getOffsetTopDistance as i, ElTabs as n, useOrderedChildren as o, getClientXY as r, ElTabPane as t };
