import { B as h, D as createVNode, Fn as hyphenate, Hn as isObject, Jn as isString, Tn as toRefs, Yt as withDirectives, gn as reactive, k as defineComponent, qt as withCtx, tt as nextTick, un as isRef, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, i as createApp, t as Transition } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { a as removeClass, r as getStyle, t as addClass } from "./style-D30oR_2q.js";
import { n as useGlobalComponentSettings } from "./use-global-config-CwtC64sR.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/loading/src/loading.mjs
function createLoadingComponent(options, appContext) {
	let afterLeaveTimer;
	const afterLeaveFlag = ref(false);
	const data = reactive({
		...options,
		originalPosition: "",
		originalOverflow: "",
		visible: false
	});
	function setText(text) {
		data.text = text;
	}
	function destroySelf() {
		const target = data.parent;
		const ns = vm.ns;
		if (!target.vLoadingAddClassList) {
			let loadingNumber = target.getAttribute("loading-number");
			loadingNumber = Number.parseInt(loadingNumber) - 1;
			if (!loadingNumber) {
				removeClass(target, ns.bm("parent", "relative"));
				target.removeAttribute("loading-number");
			} else target.setAttribute("loading-number", loadingNumber.toString());
			removeClass(target, ns.bm("parent", "hidden"));
		}
		removeElLoadingChild();
		loadingInstance.unmount();
	}
	function removeElLoadingChild() {
		vm.$el?.parentNode?.removeChild(vm.$el);
	}
	function close() {
		if (options.beforeClose && !options.beforeClose()) return;
		afterLeaveFlag.value = true;
		clearTimeout(afterLeaveTimer);
		afterLeaveTimer = setTimeout(handleAfterLeave, 400);
		data.visible = false;
		options.closed?.();
	}
	function handleAfterLeave() {
		if (!afterLeaveFlag.value) return;
		const target = data.parent;
		afterLeaveFlag.value = false;
		target.vLoadingAddClassList = void 0;
		destroySelf();
	}
	const loadingInstance = createApp(defineComponent({
		name: "ElLoading",
		setup(_, { expose }) {
			const { ns, zIndex } = useGlobalComponentSettings("loading");
			expose({
				ns,
				zIndex
			});
			return () => {
				const svg = data.spinner || data.svg;
				const spinner = h("svg", {
					class: "circular",
					viewBox: data.svgViewBox ? data.svgViewBox : "0 0 50 50",
					...svg ? { innerHTML: svg } : {}
				}, [h("circle", {
					class: "path",
					cx: "25",
					cy: "25",
					r: "20",
					fill: "none"
				})]);
				const spinnerText = data.text ? h("p", { class: ns.b("text") }, [data.text]) : void 0;
				return h(Transition, {
					name: ns.b("fade"),
					onAfterLeave: handleAfterLeave
				}, { default: withCtx(() => [withDirectives(createVNode("div", {
					style: { backgroundColor: data.background || "" },
					class: [
						ns.b("mask"),
						data.customClass,
						ns.is("fullscreen", data.fullscreen)
					]
				}, [h("div", { class: ns.b("spinner") }, [spinner, spinnerText])]), [[vShow, data.visible]])]) });
			};
		}
	}));
	Object.assign(loadingInstance._context, appContext ?? {});
	const vm = loadingInstance.mount(document.createElement("div"));
	return {
		...toRefs(data),
		setText,
		removeElLoadingChild,
		close,
		handleAfterLeave,
		vm,
		get $el() {
			return vm.$el;
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/loading/src/service.mjs
var fullscreenInstance = void 0;
var Loading = function(options = {}, context) {
	if (!isClient) return void 0;
	const resolved = resolveOptions(options);
	if (resolved.fullscreen && fullscreenInstance) return fullscreenInstance;
	const instance = createLoadingComponent({
		...resolved,
		closed: () => {
			resolved.closed?.();
			if (resolved.fullscreen) fullscreenInstance = void 0;
		}
	}, context ?? Loading._context);
	addStyle(resolved, resolved.parent, instance);
	addClassList(resolved, resolved.parent, instance);
	resolved.parent.vLoadingAddClassList = () => addClassList(resolved, resolved.parent, instance);
	/**
	* add loading-number to parent.
	* because if a fullscreen loading is triggered when somewhere
	* a v-loading.body was triggered before and it's parent is
	* document.body which with a margin , the fullscreen loading's
	* destroySelf function will remove 'el-loading-parent--relative',
	* and then the position of v-loading.body will be error.
	*/
	let loadingNumber = resolved.parent.getAttribute("loading-number");
	if (!loadingNumber) loadingNumber = "1";
	else loadingNumber = `${Number.parseInt(loadingNumber) + 1}`;
	resolved.parent.setAttribute("loading-number", loadingNumber);
	resolved.parent.appendChild(instance.$el);
	nextTick(() => instance.visible.value = resolved.visible);
	if (resolved.fullscreen) fullscreenInstance = instance;
	return instance;
};
var resolveOptions = (options) => {
	let target;
	if (isString(options.target)) target = document.querySelector(options.target) ?? document.body;
	else target = options.target || document.body;
	return {
		parent: target === document.body || options.body ? document.body : target,
		background: options.background || "",
		svg: options.svg || "",
		svgViewBox: options.svgViewBox || "",
		spinner: options.spinner || false,
		text: options.text || "",
		fullscreen: target === document.body && (options.fullscreen ?? true),
		lock: options.lock ?? false,
		customClass: options.customClass || "",
		visible: options.visible ?? true,
		beforeClose: options.beforeClose,
		closed: options.closed,
		target
	};
};
var addStyle = async (options, parent, instance) => {
	const { nextZIndex } = instance.vm.zIndex || instance.vm._.exposed.zIndex;
	const maskStyle = {};
	if (options.fullscreen) {
		instance.originalPosition.value = getStyle(document.body, "position");
		instance.originalOverflow.value = getStyle(document.body, "overflow");
		maskStyle.zIndex = nextZIndex();
	} else if (options.parent === document.body) {
		instance.originalPosition.value = getStyle(document.body, "position");
		/**
		* await dom render when visible is true in init,
		* because some component's height maybe 0.
		* e.g. el-table.
		*/
		await nextTick();
		for (const property of ["top", "left"]) {
			const scroll = property === "top" ? "scrollTop" : "scrollLeft";
			maskStyle[property] = `${options.target.getBoundingClientRect()[property] + document.body[scroll] + document.documentElement[scroll] - Number.parseInt(getStyle(document.body, `margin-${property}`), 10)}px`;
		}
		for (const property of ["height", "width"]) maskStyle[property] = `${options.target.getBoundingClientRect()[property]}px`;
	} else instance.originalPosition.value = getStyle(parent, "position");
	for (const [key, value] of Object.entries(maskStyle)) instance.$el.style[key] = value;
};
var addClassList = (options, parent, instance) => {
	const ns = instance.vm.ns || instance.vm._.exposed.ns;
	if (![
		"absolute",
		"fixed",
		"sticky"
	].includes(instance.originalPosition.value)) addClass(parent, ns.bm("parent", "relative"));
	else removeClass(parent, ns.bm("parent", "relative"));
	if (options.fullscreen && options.lock) addClass(parent, ns.bm("parent", "hidden"));
	else removeClass(parent, ns.bm("parent", "hidden"));
};
Loading._context = null;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/loading/src/directive.mjs
var INSTANCE_KEY = Symbol("ElLoading");
var getAttributeName = (name) => {
	return `element-loading-${hyphenate(name)}`;
};
var createInstance = (el, binding) => {
	const vm = binding.instance;
	const getBindingProp = (key) => isObject(binding.value) ? binding.value[key] : void 0;
	const resolveExpression = (key) => {
		return ref(isString(key) && vm?.[key] || key);
	};
	const getProp = (name) => resolveExpression(getBindingProp(name) || el.getAttribute(getAttributeName(name)));
	const fullscreen = getBindingProp("fullscreen") ?? binding.modifiers.fullscreen;
	const options = {
		text: getProp("text"),
		svg: getProp("svg"),
		svgViewBox: getProp("svgViewBox"),
		spinner: getProp("spinner"),
		background: getProp("background"),
		customClass: getProp("customClass"),
		fullscreen,
		target: getBindingProp("target") ?? (fullscreen ? void 0 : el),
		body: getBindingProp("body") ?? binding.modifiers.body,
		lock: getBindingProp("lock") ?? binding.modifiers.lock
	};
	const instance = Loading(options);
	instance._context = vLoading._context;
	el[INSTANCE_KEY] = {
		options,
		instance
	};
};
var updateOptions = (originalOptions, newOptions) => {
	for (const key of Object.keys(originalOptions)) if (isRef(originalOptions[key])) originalOptions[key].value = newOptions[key];
};
var vLoading = {
	mounted(el, binding) {
		if (binding.value) createInstance(el, binding);
	},
	updated(el, binding) {
		const instance = el[INSTANCE_KEY];
		if (!binding.value) {
			instance?.instance.close();
			el[INSTANCE_KEY] = null;
			return;
		}
		if (!instance) createInstance(el, binding);
		else updateOptions(instance.options, isObject(binding.value) ? binding.value : {
			text: el.getAttribute(getAttributeName("text")),
			svg: el.getAttribute(getAttributeName("svg")),
			svgViewBox: el.getAttribute(getAttributeName("svgViewBox")),
			spinner: el.getAttribute(getAttributeName("spinner")),
			background: el.getAttribute(getAttributeName("background")),
			customClass: el.getAttribute(getAttributeName("customClass"))
		});
	},
	unmounted(el) {
		el[INSTANCE_KEY]?.instance.close();
		el[INSTANCE_KEY] = null;
	}
};
vLoading._context = null;
//#endregion
export { Loading as n, vLoading as t };
