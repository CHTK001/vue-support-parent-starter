import { Cn as toRaw, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, et as mergeProps, fn as markRaw, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { R as dist_exports, ht as menu_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { i as loadAnimatedIcon, n as ANIMATED_ICON_PREFIX, r as isAnimatedIconName } from "./registry-Dp44ioVs.js";
//#region ../../packages/ui/src/components/ReIcon/theme/koi/ReIcon.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["xlink:href"];
var SVG_PREFIX = "koi-";
//#endregion
//#region ../../packages/ui/src/components/ReIcon/theme/koi/ReIcon.vue
var ReIcon_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReIcon",
	inheritAttrs: true,
	__name: "ReIcon",
	props: {
		name: { default: "Sunny" },
		size: { default: 18 },
		color: { default: "" }
	},
	setup(__props) {
		/**
		* ReIcon koi 主题 —— 图标组件（KoiSvgIcon / KoiGlobalIcon 移植）
		*
		* 渲染规则（按优先级）：
		*  - name 以 `anim:` 开头：icons-animated 动画图标（`anim:<lib>:<icon>`，懒加载独立 chunk）
		*  - name 以 `koi-` 开头：本地 svg symbol（#icon-xxx use 引用）
		*  - name 以 `ep:` 开头：解包为 element-plus 图标组件（ep:menu -> Menu）
		*  - name 以 `ri:`/`mdi:`/`carbon:`/`humbleicons:` 等 iconify 前缀开头：
		*    使用全局注册的 Iconify 渲染器（createContextApp 注册到 window.__reIcon.iconify）
		*  - 其余：element-plus 图标组件（支持 PascalCase / kebab-case 兼容）
		* 样式走主题令牌（--theme-* 变量）。
		*/
		/** 本地 svg 前缀（与 koi 主题约定一致，koi- 开头的图标走 svg sprite） */
		const iconifyReg = /^[a-z]{2,}:/;
		const props = __props;
		const safeName = computed(() => typeof props.name === "string" ? props.name : "");
		/** 动画图标命名空间：`anim:<lib>:<icon>`（是否已注册另判断） */
		const isAnimated = computed(() => safeName.value.startsWith(ANIMATED_ICON_PREFIX));
		/** 该名字是否真的在注册表里（决定渲染动画组件还是走兜底） */
		const hasAnimatedIcon = computed(() => isAnimatedIconName(safeName.value));
		const isLocalSvg = computed(() => safeName.value.startsWith(SVG_PREFIX));
		/** 本地 svg symbol 引用路径：svg sprite 的 id 为 icon-{文件名}（文件名已含 koi- 前缀） */
		const localHref = computed(() => `#icon-${safeName.value}`);
		/** 是否走 iconify 在线渲染（ri:/mdi:/carbon: 等，ep:/anim: 除外） */
		const isIconify = computed(() => {
			if (isLocalSvg.value) return false;
			if (isAnimated.value) return false;
			if (safeName.value.startsWith("ep:")) return false;
			return iconifyReg.test(safeName.value);
		});
		/** element-plus 图标组件：ep:xxx 解包 + PascalCase/kebab 兼容 */
		const elementIcon = computed(() => {
			const icons = dist_exports;
			const raw = isLocalSvg.value ? "" : safeName.value;
			if (!raw) return null;
			let name = raw.startsWith("ep:") ? raw.slice(3) : raw;
			if (iconifyReg.test(name)) return null;
			if (icons[name]) return icons[name];
			return icons[name.split(/[-_\s]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")] ?? null;
		});
		/** Iconify 渲染器（未注册时用占位，避免空白） */
		const iconifyRenderer = computed(() => {
			if (!isIconify.value) return null;
			const reg = (typeof window !== "undefined" ? window : void 0)?.__reIcon;
			return reg?.iconify ? markRaw(toRaw(reg.iconify)) : null;
		});
		/** 动画组件缓存：同一图标只解析一次，切换回来不再重复请求 chunk */
		const animatedCache = /* @__PURE__ */ new Map();
		const animatedComponent = shallowRef(null);
		watch(() => isAnimatedIconName(safeName.value) ? safeName.value : "", async (name, _previous, onCleanup) => {
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
		/** 全局兜底图标：任何图标加载失败/不存在时，显示Menu图标，永远不空白 */
		const fallbackIcon = computed(() => {
			if (isLocalSvg.value) return null;
			if (hasAnimatedIcon.value) return null;
			if (isIconify.value && iconifyRenderer.value) return null;
			if (elementIcon.value) return null;
			return menu_default;
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElIcon), mergeProps({
				size: __props.size,
				color: __props.color
			}, _ctx.$attrs), {
				default: withCtx(() => [isAnimated.value && hasAnimatedIcon.value ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: "re-icon__anim",
					style: normalizeStyle({
						width: `${animatedSize.value}px`,
						height: `${animatedSize.value}px`
					})
				}, [animatedComponent.value ? (openBlock(), createBlock(resolveDynamicComponent(animatedComponent.value), {
					key: 0,
					size: animatedSize.value
				}, null, 8, ["size"])) : createCommentVNode("", true)], 4)) : isLocalSvg.value ? (openBlock(), createElementBlock("svg", {
					key: 1,
					"aria-hidden": "true",
					class: "re-icon__local",
					style: normalizeStyle({
						width: `${__props.size}px`,
						height: `${__props.size}px`
					})
				}, [createBaseVNode("use", { "xlink:href": localHref.value }, null, 8, _hoisted_1)], 4)) : isIconify.value && iconifyRenderer.value ? (openBlock(), createBlock(resolveDynamicComponent(iconifyRenderer.value), {
					key: 2,
					icon: props.name
				}, null, 8, ["icon"])) : (openBlock(), createBlock(resolveDynamicComponent(elementIcon.value || fallbackIcon.value), { key: 3 }))]),
				_: 1
			}, 16, ["size", "color"]);
		};
	}
}), [["__scopeId", "data-v-1f507ed1"]]);
//#endregion
export { ReIcon_default as t };
