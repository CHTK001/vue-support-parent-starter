import { B as h, Cn as toRaw, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, ct as onMounted, et as mergeProps, fn as markRaw, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { R as dist_exports, ht as menu_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { i as loadAnimatedIcon, n as ANIMATED_ICON_PREFIX, r as isAnimatedIconName } from "./registry-Dp44ioVs.js";
//#region ../../packages/ui/src/components/ReIcon/theme/default/ReIcon.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["src"];
var _hoisted_2 = ["xlink:href"];
//#endregion
//#region ../../packages/ui/src/components/ReIcon/theme/default/ReIcon.vue
var ReIcon_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReIcon",
	inheritAttrs: true,
	__name: "ReIcon",
	props: {
		name: { default: "" },
		size: { default: 16 },
		color: { default: "" },
		iconType: { default: "" },
		iconfontUrl: { default: "" },
		forceElement: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:name", "change"],
	setup(__props, { emit: __emit }) {
		/**
		* ReIcon —— 通用图标组件（v-model + 多源 + 可扩展）
		*
		* 支持的图标源（自动识别）：
		*   1) Element Plus：name="Search" 等 PascalCase（自动）
		*   2) ep:xxx          → 强制走 Element Plus（兼容未注册前缀）
		*   3) ri:xxx / mdi:xxx / carbon:xxx 等 → Iconify 三方库
		*      业务可注入 `IconifyIconOnline` 组件接管渲染（自动查找）
		*   4) HTTP URL         → name="https://..."
		*   5) iconfont class  → icon-type="iconfont" + iconfontUrl
		*   6) iconfont svg    → icon-type="svg" + iconfontUrl
		*   7) iconfont unicode → icon-type="uni" + iconfontUrl + 图标字典（注册 unicode）
		*
		* v-model:
		*   <ReIcon v-model="icon" />
		*
		* 扩展（通过 globalThis.__reIcon）：
		*   1) globalThis.__reIcon.iconify = Component    // 注册 Iconify 渲染组件（必填 props: { icon }）
		*   2) globalThis.__reIcon.iconfontUrls = string[] // 注册 iconfont CSS url 列表
		*   3) globalThis.__reIcon.iconfontDict = { [name]: unicode } // iconfont Unicode 字典
		*
		*   业务可在 main.ts：
		*     app.config.globalProperties.$reIcon = {
		*       iconify: IconifyIconOnline,
		*       iconfontUrls: ['//at.alicdn.com/t/c/font_xxx.css'],
		*       iconfontDict: { 'home': '&#xe600;' }
		*     }
		*/
		const props = __props;
		const emit = __emit;
		/** 全局注册表（业务可挂载） */
		function readIconReg() {
			return (typeof window !== "undefined" ? window : globalThis).__reIcon ?? {};
		}
		const iconReg = ref(readIconReg());
		/** 全局兜底Menu图标 */
		const fallbackMenuIcon = computed(() => menu_default);
		/** v-model 双向 */
		const localName = computed({
			get: () => props.name,
			set: (val) => {
				emit("update:name", val);
				emit("change", val);
			}
		});
		const effectiveName = computed(() => {
			const raw = localName.value;
			return typeof raw === "string" ? raw : "";
		});
		const httpReg = /^https?:\/\//;
		const iconifyReg = /^[a-z]{2,}:/;
		const epReg = /^[A-Z][a-zA-Z0-9]*$/;
		/** 动画图标命名空间：`anim:<lib>:<icon>`（是否已注册另判断） */
		const isAnimated = computed(() => effectiveName.value.startsWith(ANIMATED_ICON_PREFIX));
		/** 该名字是否真的在注册表里（决定渲染动画组件还是走兜底） */
		const hasAnimatedIcon = computed(() => isAnimatedIconName(effectiveName.value));
		const effectiveIcon = computed(() => {
			const raw = effectiveName.value;
			if (!raw) return "";
			if (httpReg.test(raw)) return "";
			if (iconifyReg.test(raw)) return raw;
			return raw;
		});
		const isHttp = computed(() => httpReg.test(effectiveName.value));
		const isIconify = computed(() => !isAnimated.value && iconifyReg.test(effectiveName.value));
		/** Element Plus 图标解析 */
		const elementIcon = computed(() => {
			const raw = effectiveName.value;
			if (!raw) return null;
			if (httpReg.test(raw)) return null;
			if (props.forceElement) return resolveElement(unwrapPrefix(raw));
			if (raw.startsWith("ep:")) return resolveElement(raw.slice(3));
			if (iconifyReg.test(raw)) return null;
			if (epReg.test(raw)) return resolveElement(raw);
			return null;
		});
		function unwrapPrefix(name) {
			if (name.startsWith("ep:")) return name.slice(3);
			return name;
		}
		function resolveElement(name) {
			if (!name) return null;
			const icons = dist_exports;
			if (icons[name]) return icons[name];
			return icons[name.split(/[-_\s]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")] ?? null;
		}
		/** Iconify 自定义渲染器（未注册时用占位组件） */
		const iconifyRenderer = computed(() => {
			const custom = iconReg.value.iconify;
			if (custom) return markRaw(toRaw(custom));
			return {
				name: "ReIconifyPlaceholder",
				props: { icon: {
					type: String,
					default: ""
				} },
				setup(props) {
					return () => h("span", {
						class: "re-icon__iconify-placeholder",
						"data-icon": props.icon || ""
					});
				}
			};
		});
		/** 动画组件缓存：同一图标只解析一次，切换回来不再重复请求 chunk */
		const animatedCache = /* @__PURE__ */ new Map();
		const animatedComponent = shallowRef(null);
		watch(() => isAnimatedIconName(effectiveName.value) ? effectiveName.value : "", async (name, _previous, onCleanup) => {
			if (!name) {
				animatedComponent.value = null;
				return;
			}
			const cached = animatedCache.get(name);
			if (cached) {
				animatedComponent.value = cached;
				return;
			}
			let alive = true;
			onCleanup(() => {
				alive = false;
			});
			const loader = loadAnimatedIcon(name);
			if (!loader) {
				animatedComponent.value = null;
				return;
			}
			const loaded = await loader();
			if (!alive) return;
			const component = markRaw(toRaw(loaded.default));
			animatedCache.set(name, component);
			animatedComponent.value = component;
		}, { immediate: true });
		/** 上游动画图标只接受数值尺寸（Number prop），字符串尺寸需解析 */
		const animatedSize = computed(() => {
			const value = props.size;
			if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
			const parsed = Number.parseFloat(String(value));
			return Number.isFinite(parsed) && parsed > 0 ? parsed : 18;
		});
		/** iconfont css 自动注入 */
		const linkInjected = ref(/* @__PURE__ */ new Set());
		function injectCss(url) {
			if (!url || linkInjected.value.has(url)) return;
			if (typeof document === "undefined") return;
			if (document.querySelector(`link[data-re-iconfont="${url}"]`)) {
				linkInjected.value.add(url);
				return;
			}
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = url;
			link.setAttribute("data-re-iconfont", url);
			document.head.appendChild(link);
			linkInjected.value.add(url);
		}
		function collectIconfontUrls() {
			const list = [];
			if (props.iconfontUrl) list.push(props.iconfontUrl);
			const all = (iconReg.value.iconfontUrls ?? []).slice();
			list.push(...all);
			return Array.from(new Set(list));
		}
		watch(() => collectIconfontUrls().join("|"), () => {
			for (const url of collectIconfontUrls()) injectCss(url);
		}, { immediate: true });
		onMounted(() => {
			for (const url of collectIconfontUrls()) injectCss(url);
		});
		/** iconfont Unicode 渲染 */
		const uniGlyph = computed(() => {
			if (props.iconType !== "uni") return "";
			const raw = effectiveIcon.value || effectiveName.value;
			if (/^&#x[0-9a-f]+;$/i.test(raw)) return raw;
			if (/^0x[0-9a-f]+$/i.test(raw)) return String.fromCharCode(parseInt(raw, 16));
			if (/^&#\d+;$/.test(raw)) return raw;
			const dict = iconReg.value.iconfontDict ?? {};
			if (dict[raw]) return dict[raw];
			return raw;
		});
		/** 监听全局注册表变化（业务动态注入） */
		if (typeof window !== "undefined") Object.defineProperty(window, "__reIcon", {
			configurable: true,
			get: () => iconReg.value,
			set: (val) => {
				iconReg.value = val ?? {};
				for (const url of collectIconfontUrls()) injectCss(url);
			}
		});
		return (_ctx, _cache) => {
			return isAnimated.value && hasAnimatedIcon.value ? (openBlock(), createElementBlock("span", mergeProps({
				key: 0,
				class: "re-icon re-icon__anim",
				style: {
					width: `${animatedSize.value}px`,
					height: `${animatedSize.value}px`,
					color: __props.color || void 0
				}
			}, _ctx.$attrs), [animatedComponent.value ? (openBlock(), createBlock(resolveDynamicComponent(animatedComponent.value), {
				key: 0,
				size: animatedSize.value
			}, null, 8, ["size"])) : createCommentVNode("", true)], 16)) : isHttp.value ? (openBlock(), createElementBlock("img", mergeProps({
				key: 1,
				src: effectiveName.value,
				alt: "icon",
				class: "re-icon re-icon--http",
				style: {
					width: typeof __props.size === "number" ? `${__props.size}px` : __props.size,
					height: typeof __props.size === "number" ? `${__props.size}px` : __props.size,
					color: __props.color || void 0
				}
			}, _ctx.$attrs), null, 16, _hoisted_1)) : __props.iconType === "svg" && effectiveIcon.value ? (openBlock(), createElementBlock("svg", mergeProps({
				key: 2,
				class: "icon-svg re-icon",
				"aria-hidden": "true",
				style: {
					width: typeof __props.size === "number" ? `${__props.size}px` : __props.size,
					height: typeof __props.size === "number" ? `${__props.size}px` : __props.size,
					color: __props.color || void 0
				}
			}, _ctx.$attrs), [createBaseVNode("use", { "xlink:href": `#${effectiveIcon.value}` }, null, 8, _hoisted_2)], 16)) : __props.iconType === "uni" && effectiveIcon.value ? (openBlock(), createElementBlock("i", mergeProps({
				key: 3,
				class: "re-icon iconfont",
				style: {
					fontSize: typeof __props.size === "number" ? `${__props.size}px` : __props.size,
					color: __props.color || void 0
				}
			}, _ctx.$attrs), toDisplayString(uniGlyph.value), 17)) : __props.iconType === "iconfont" && effectiveIcon.value ? (openBlock(), createElementBlock("i", mergeProps({
				key: 4,
				class: [
					"re-icon",
					"iconfont",
					`icon-${effectiveIcon.value}`
				],
				style: {
					fontSize: typeof __props.size === "number" ? `${__props.size}px` : __props.size,
					color: __props.color || void 0
				}
			}, _ctx.$attrs), null, 16)) : elementIcon.value ? (openBlock(), createBlock(unref(ElIcon), mergeProps({ key: 5 }, _ctx.$attrs, {
				size: __props.size,
				color: __props.color
			}), {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(elementIcon.value)))]),
				_: 1
			}, 16, ["size", "color"])) : isIconify.value ? (openBlock(), createBlock(unref(ElIcon), mergeProps({ key: 6 }, _ctx.$attrs, {
				size: __props.size,
				color: __props.color
			}), {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(iconifyRenderer.value), { icon: effectiveIcon.value }, null, 8, ["icon"]))]),
				_: 1
			}, 16, ["size", "color"])) : (openBlock(), createBlock(unref(ElIcon), mergeProps({ key: 7 }, _ctx.$attrs, {
				size: __props.size,
				color: __props.color
			}), {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(fallbackMenuIcon.value)))]),
				_: 1
			}, 16, ["size", "color"]));
		};
	}
}), [["__scopeId", "data-v-3c5f552b"]]);
//#endregion
export { ReIcon_default as t };
