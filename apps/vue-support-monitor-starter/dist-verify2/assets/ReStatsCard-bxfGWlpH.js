import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReStatCard-BGjVHdD2.js";
//#region ../../packages/ui/src/components/ReStatsCard/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	class: "re-stats-card__typed",
	"aria-hidden": true
};
var _hoisted_2 = {
	key: 0,
	class: "re-stats-card__unit"
};
var _hoisted_3 = {
	key: 1,
	class: "re-stats-card__sr"
};
var _hoisted_4 = ["aria-label"];
var _hoisted_5 = { class: "re-stats-card__ring-inner" };
var _hoisted_6 = ["id"];
var _hoisted_7 = ["stop-color"];
var _hoisted_8 = ["stop-color"];
var _hoisted_9 = ["points", "fill"];
var _hoisted_10 = ["points", "stroke"];
//#endregion
//#region ../../packages/ui/src/components/ReStatsCard/index.vue
var ReStatsCard_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		list: {},
		columns: { default: "auto" },
		clickable: {
			type: Boolean,
			default: true
		},
		duration: { default: 600 }
	},
	emits: ["item-click"],
	setup(__props, { emit: __emit }) {
		/**
		* ReStatsCard —— 统计卡片列表（传入数组直接渲染）
		*
		*   <ReStatsCard :list="[{ title, value, desc, icon }]" @item-click="..." />
		*
		* 增强点：
		*   1. 告警态：item.level 驱动卡片描边/底色/角标，warn、danger 一眼可辨
		*   2. 趋势线：item.series 渲染 sparkline（含渐变面积），作为底部背景层
		*   3. 环内数值：进度环中心显示百分比，补齐 52px 的信息空档
		*   4. 打字机平滑：数字逐位滚动浮现，图标模糊缩放入场（typeit 观感，纯 CSS 实现）
		*   5. 类型补全：补 level / sub / series / animate / duration / precision
		*   6. 无障碍：role/tabindex/aria-label 齐备，支持 Enter 与 Space 触发
		*   7. prefers-reduced-motion：动画与过渡统一降级
		*
		* 插槽：
		*   - #card：整卡接管渲染（传入即优先），仍会下发告警类名/数值/环/趋势等计算结果
		*   - #card-extra：内置骨架下追加内容（告警徽标、底部说明等）
		*   - 其余经由内部 ReStatCard 透传 #value / #icon
		*/
		const props = __props;
		const emit = __emit;
		const gridStyle = computed(() => {
			if (props.columns === "auto" || !props.columns) return void 0;
			return { gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` };
		});
		function onClick(item) {
			if (!props.clickable) return;
			emit("item-click", item, props.list.indexOf(item));
		}
		/** 各级别对应的主题色与色板 */
		const LEVEL_TOKENS = {
			ok: {
				color: "var(--el-color-success)",
				label: "正常"
			},
			info: {
				color: "var(--el-color-info)",
				label: "提示"
			},
			warn: {
				color: "var(--el-color-warning)",
				label: "警告"
			},
			danger: {
				color: "var(--el-color-danger)",
				label: "严重"
			}
		};
		/** 卡片附加类名：承载描边色、底色与角标 */
		function levelClass(item) {
			return item.level && item.level !== "ok" ? [`is-${item.level}`] : [];
		}
		/** 无障碍文案：把标题、数值、单位、告警级别串成一句可读描述 */
		function ariaLabel(item) {
			const parts = [item.title];
			if (item.value !== void 0 && item.value !== null && item.value !== "") parts.push(`${item.value}${item.unit ?? ""}`);
			if (item.level && item.level !== "ok") parts.push(LEVEL_TOKENS[item.level].label);
			if (item.desc) parts.push(item.desc);
			return parts.join(" ");
		}
		/** 取有效序列（至少 2 个点才画线） */
		function seriesOf(item) {
			const s = item.series;
			if (!Array.isArray(s) || s.length < 2) return [];
			return s.map((n) => Number.isFinite(Number(n)) ? Number(n) : 0);
		}
		/** 折线路径（viewBox 100x32） */
		function sparkPoints(item) {
			const s = seriesOf(item);
			if (s.length < 2) return "";
			const min = Math.min(...s);
			const span = Math.max(...s) - min || 1;
			const step = 100 / (s.length - 1);
			return s.map((v, i) => `${(i * step).toFixed(2)},${(30 - (v - min) / span * 28 + 1).toFixed(2)}`).join(" ");
		}
		/** 面积路径：折线 + 回到基线闭合，形成渐变填充 */
		function sparkAreaPoints(item) {
			const line = sparkPoints(item);
			return line ? `0,32 ${line} 100,32` : "";
		}
		/** 线条/渐变取色：优先用条目色，其次按告警级别 */
		function trendColor(item) {
			if (item.valueColor) return item.valueColor;
			if (item.level) return LEVEL_TOKENS[item.level].color;
			return "var(--el-color-primary)";
		}
		/** 线条颜色随告警升级（ok/info 用主色，warn/danger 用告警色） */
		function sparkStyle(item) {
			return { color: trendColor(item) };
		}
		/** 渐变 id 需唯一，用 key 或下标兜底 */
		function sparkGradientId(item) {
			return `re-stats-spark-${String(item.key ?? item.title).replace(/[^\w-]/g, "")}`;
		}
		function hasRing(item) {
			return item.ringPercent !== void 0 && item.ringPercent !== null;
		}
		function ringPercent(item) {
			return Math.max(0, Math.min(100, Math.round(Number(item.ringPercent ?? 0))));
		}
		/** 展示值：非数字或关闭动画时直接用原值；否则走 count-up */
		const animated = ref({});
		let raf = 0;
		function isNumeric(item) {
			return item.value !== void 0 && item.value !== null && item.value !== "" && !Number.isNaN(Number(item.value));
		}
		function displayValue(item) {
			const numeric = isNumeric(item);
			const animate = item.animate ?? true;
			if (!numeric || !animate) return formatValue(item);
			const key = String(item.key ?? item.title);
			const target = Number(item.value);
			const current = animated.value[key];
			if (current === void 0) return formatValue(item, target);
			return formatValue(item, current);
		}
		function formatValue(item, n) {
			if (n === void 0) return item.value === void 0 || item.value === null ? "" : String(item.value);
			const p = item.precision;
			return p === void 0 ? String(round(n)) : n.toFixed(p);
		}
		function round(n) {
			return Math.round(n * 100) / 100;
		}
		/** 监听数值变化，启动 count-up */
		watch(() => props.list.map((i) => isNumeric(i) ? Number(i.value) : null), (next, prev) => {
			next.forEach((target, idx) => {
				if (target === null) return;
				const key = String(props.list[idx]?.key ?? props.list[idx]?.title ?? idx);
				const from = animated.value[key];
				if (from === void 0 || !props.list[idx]?.animate) {
					animated.value = {
						...animated.value,
						[key]: target
					};
					return;
				}
				const dur = props.list[idx]?.duration ?? props.duration;
				if (from === target || dur <= 0) {
					animated.value = {
						...animated.value,
						[key]: target
					};
					return;
				}
				cancelAnimationFrame(raf);
				const t0 = performance.now();
				const step = (now) => {
					const p = Math.min(1, (now - t0) / dur);
					const eased = 1 - Math.pow(1 - p, 3);
					const cur = from + (target - from) * eased;
					if (p >= 1) animated.value = {
						...animated.value,
						[key]: target
					};
					else {
						animated.value = {
							...animated.value,
							[key]: cur
						};
						raf = requestAnimationFrame(step);
					}
				};
				raf = requestAnimationFrame(step);
			});
		}, { deep: false });
		onBeforeUnmount(() => cancelAnimationFrame(raf));
		/** 关闭动效时（prefers-reduced-motion）直接落终态，不做逐位动画 */
		const reducedMotion = ref(false);
		if (typeof window !== "undefined" && window.matchMedia) {
			const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
			reducedMotion.value = mq.matches;
			const onChange = (e) => {
				reducedMotion.value = e.matches;
			};
			if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
			else if (typeof mq.addListener === "function") mq.addListener(onChange);
		}
		/** 是否启用打字机效果：条目未显式关闭且用户未要求减少动效 */
		function typedEnabled(item) {
			return (item.animate ?? true) && !reducedMotion.value;
		}
		/** 是否正在动画中（动画期间为读屏补充完整值） */
		function typedActive(item) {
			if (!typedEnabled(item)) return false;
			const key = String(item.key ?? item.title);
			const target = Number(item.value);
			const cur = animated.value[key];
			return cur !== void 0 && cur !== target;
		}
		/**
		* 把当前展示值拆成逐位字符数组，供 v-for 渲染打字机效果。
		*
		* <p>数字与文本统一处理：非数字（"运行中"等）也逐字显现，观感一致。</p>
		*/
		function typedChars(item) {
			return Array.from(displayValue(item));
		}
		/**
		* 逐位错峰延迟：最后一位先落定，越靠后延迟越短，形成"从右往左点亮"的节奏。
		*
		* @param index 字符下标
		* @returns 行内 style
		*/
		function charDelay(index) {
			return { animationDelay: `${index * 28}ms` };
		}
		/** 图标圆底色（供进度环轨道复用）：按 iconColor 的 12%~14% 透明度混入 */
		function softBg(color) {
			const c = color || "var(--el-color-primary)";
			if (c.startsWith("var(")) return `color-mix(in srgb, ${c} 12%, transparent)`;
			return `color-mix(in srgb, ${c} 14%, transparent)`;
		}
		/** 图标圆：渐变实底 + 白色图标 + 同色柔和投影（与 ReStatCard 一致的"柔和层次感"） */
		function iconStyle(item) {
			const c = item.iconColor || "var(--el-color-primary)";
			return {
				background: `linear-gradient(140deg, color-mix(in srgb, ${c} 72%, var(--el-color-white)) 0%, ${c} 100%)`,
				color: "var(--el-color-white)",
				boxShadow: `0 10px 18px -8px color-mix(in srgb, ${c} 55%, transparent)`
			};
		}
		/** 右侧粗环：conic-gradient + mask 挖空，颜色跟随主题/业务色 */
		function ringStyle(item) {
			const p = hasRing(item) ? ringPercent(item) : 0;
			const c = item.ringColor || item.valueColor || "var(--el-color-primary)";
			const track = softBg(c);
			return {
				"--ring-p": `${p * 3.6}deg`,
				"--ring-c": c,
				"--ring-track": track
			};
		}
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["re-stats-card", { "is-clickable": __props.clickable }]),
				style: normalizeStyle(gridStyle.value)
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.list, (item, index) => {
				return openBlock(), createElementBlock(Fragment, { key: item.key ?? index }, [_ctx.$slots.card ? renderSlot(_ctx.$slots, "card", {
					item,
					index,
					levelClass: levelClass(item),
					ariaLabel: ariaLabel(item),
					displayValue: displayValue(item),
					ringPercent: ringPercent(item),
					hasRing: hasRing(item),
					iconStyle: iconStyle(item),
					ringStyle: ringStyle(item),
					sparkPoints: sparkPoints(item),
					sparkAreaPoints: sparkAreaPoints(item),
					sparkColor: trendColor(item),
					sparkGradientId: sparkGradientId(item),
					onClick: ($event) => onClick(item),
					onKeydown: [withKeys(withModifiers(($event) => onClick(item), ["prevent"]), ["enter"]), withKeys(withModifiers(($event) => onClick(item), ["prevent"]), ["space"])]
				}, void 0, true, 0) : (openBlock(), createBlock(unref(component), {
					key: 1,
					class: normalizeClass(["re-stats-card__item", levelClass(item)]),
					title: item.title,
					desc: item.desc,
					icon: item.icon,
					"icon-color": item.iconColor,
					role: __props.clickable ? "button" : void 0,
					tabindex: __props.clickable ? 0 : void 0,
					"aria-label": ariaLabel(item),
					"aria-disabled": __props.clickable ? void 0 : "true",
					onClick: ($event) => onClick(item),
					onKeydown: [withKeys(withModifiers(($event) => onClick(item), ["prevent"]), ["enter"]), withKeys(withModifiers(($event) => onClick(item), ["prevent"]), ["space"])]
				}, {
					value: withCtx(() => [createBaseVNode("span", {
						class: "re-stats-card__value",
						style: normalizeStyle(item.valueColor ? { color: item.valueColor } : void 0)
					}, [
						createBaseVNode("span", _hoisted_1, [(openBlock(true), createElementBlock(Fragment, null, renderList(typedChars(item), (ch, ci) => {
							return openBlock(), createElementBlock("span", {
								key: `${item.key ?? item.title}-c${ci}`,
								class: "re-stats-card__char",
								style: normalizeStyle(charDelay(ci))
							}, toDisplayString(ch), 5);
						}), 128))]),
						item.unit ? (openBlock(), createElementBlock("small", _hoisted_2, toDisplayString(item.unit), 1)) : createCommentVNode("", true),
						typedActive(item) ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(displayValue(item)), 1)) : createCommentVNode("", true)
					], 4)]),
					icon: withCtx(() => [hasRing(item) ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "re-stats-card__ring-box",
						style: normalizeStyle(ringStyle(item)),
						role: "img",
						"aria-label": `${item.title} ${ringPercent(item)}%`
					}, [_cache[1] || (_cache[1] = createBaseVNode("span", { class: "re-stats-card__ring" }, null, -1)), createBaseVNode("span", _hoisted_5, [createTextVNode(toDisplayString(ringPercent(item)), 1), _cache[0] || (_cache[0] = createBaseVNode("i", null, "%", -1))])], 12, _hoisted_4)) : item.icon ? (openBlock(), createElementBlock("span", {
						key: 1,
						class: "re-stats-card__icon",
						style: normalizeStyle(iconStyle(item))
					}, [createVNode(_component_el_icon, {
						size: 24,
						class: "re-stats-card__icon-glyph"
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(item.icon)))]),
						_: 2
					}, 1024)], 4)) : createCommentVNode("", true)]),
					default: withCtx(() => [sparkPoints(item) ? (openBlock(), createElementBlock("svg", {
						key: 0,
						class: "re-stats-card__spark",
						style: normalizeStyle(sparkStyle(item)),
						viewBox: "0 0 100 32",
						preserveAspectRatio: "none",
						"aria-hidden": "true"
					}, [
						createBaseVNode("defs", null, [createBaseVNode("linearGradient", {
							id: sparkGradientId(item),
							x1: "0",
							y1: "0",
							x2: "0",
							y2: "1"
						}, [createBaseVNode("stop", {
							offset: "0%",
							"stop-color": trendColor(item),
							"stop-opacity": "0.28"
						}, null, 8, _hoisted_7), createBaseVNode("stop", {
							offset: "100%",
							"stop-color": trendColor(item),
							"stop-opacity": "0"
						}, null, 8, _hoisted_8)], 8, _hoisted_6)]),
						createBaseVNode("polygon", {
							points: sparkAreaPoints(item),
							fill: `url(#${sparkGradientId(item)})`
						}, null, 8, _hoisted_9),
						createBaseVNode("polyline", {
							points: sparkPoints(item),
							fill: "none",
							stroke: trendColor(item),
							"stroke-width": "1.6",
							"stroke-linecap": "round",
							"stroke-linejoin": "round",
							"vector-effect": "non-scaling-stroke"
						}, null, 8, _hoisted_10)
					], 4)) : createCommentVNode("", true), renderSlot(_ctx.$slots, "card-extra", {
						item,
						index
					}, void 0, true)]),
					_: 2
				}, 1032, [
					"class",
					"title",
					"desc",
					"icon",
					"icon-color",
					"role",
					"tabindex",
					"aria-label",
					"aria-disabled",
					"onClick",
					"onKeydown"
				]))], 64);
			}), 128))], 6);
		};
	}
}), [["__scopeId", "data-v-995fba23"]]);
//#endregion
//#region ../../packages/ui/src/components/ReStatsCard/index.ts
var plugin = { install(app) {
	app.component("ReStatsCard", ReStatsCard_default$1);
} };
var ReStatsCard_default = ReStatsCard_default$1;
//#endregion
export { ReStatsCard_default as default, plugin as install };
