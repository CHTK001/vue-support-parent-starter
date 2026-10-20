import { $n as normalizeClass, D as createVNode, On as unref, St as resolveComponent, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, vn as ref, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as useI18n, r as translateConfigText } from "./src-BVnZQO9c.js";
import { at as info_filled_default } from "./dist-DogtK295.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/voxel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "voxel-page" };
var _hoisted_2 = {
	class: "voxel-world",
	"aria-hidden": "true"
};
var _hoisted_3 = { class: "voxel-particles" };
var _hoisted_4 = { class: "voxel-stage" };
var _hoisted_5 = { class: "voxel-content" };
var _hoisted_6 = { class: "voxel-panel" };
var _hoisted_7 = { class: "vp-head" };
var _hoisted_8 = { class: "vp-head-text" };
var _hoisted_9 = { class: "vp-title" };
var _hoisted_10 = { class: "vp-desc" };
var _hoisted_11 = { class: "vp-status" };
var _hoisted_12 = { class: "vp-bars" };
var _hoisted_13 = { class: "vp-status-label" };
var _hoisted_14 = { class: "vp-body" };
var _hoisted_15 = { class: "vp-base" };
var _hoisted_16 = { class: "base-markers" };
var _hoisted_17 = {
	key: 0,
	class: "voxel-legal"
};
var GRID = 20;
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/voxel.vue
var voxel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "voxel",
	setup(__props) {
		/**
		* 现代立体（voxel）
		*
		* 设计要点：
		*  1. 品牌与表单合并为同一块控制台卡片。原实现把品牌浮在顶部、表单另起一块，
		*     视觉上被割裂且浪费了下半屏；合并后中轴只有一列，构图完整。
		*  2. 标题只保留一处 —— 状态条用 menu.login.account 作为「分区标签」，
		*     ReLoginForm 传 show-header=false，避免与卡片标题叠成双标题。
		*  3. 两座体素结构分居左右、反向缓慢旋转，兼作前景框与景深，
		*     立方体不再被表单面板遮住。
		*  4. OTP 弹窗被 teleport 到 body，scoped 样式无法命中，
		*     故末尾保留一段全局样式，并用 body:has(.voxel-page) 严格限定只在本体生效。
		*/
		const loginConfig = toRef(getConfig(), "login");
		const { t } = useI18n();
		/** 结构旋转角（左右反向） */
		const sceneRotation = ref(0);
		const markerCount = ref(6);
		let raf = 0;
		/** 体素结构定义：坐标单位 20px */
		const sceneBlocks = [
			{
				k: "b0",
				x: 0,
				y: 0,
				z: 0,
				c: "a"
			},
			{
				k: "b1",
				x: 1,
				y: 0,
				z: 0,
				c: "a"
			},
			{
				k: "b2",
				x: 2,
				y: 0,
				z: 0,
				c: "a"
			},
			{
				k: "b3",
				x: 3,
				y: 0,
				z: 0,
				c: "a"
			},
			{
				k: "b4",
				x: 0,
				y: 0,
				z: 1,
				c: "a"
			},
			{
				k: "b5",
				x: 1,
				y: 0,
				z: 1,
				c: "a"
			},
			{
				k: "b6",
				x: 2,
				y: 0,
				z: 1,
				c: "a"
			},
			{
				k: "b7",
				x: 3,
				y: 0,
				z: 1,
				c: "a"
			},
			{
				k: "b8",
				x: 0,
				y: 0,
				z: 2,
				c: "a"
			},
			{
				k: "b9",
				x: 1,
				y: 0,
				z: 2,
				c: "a"
			},
			{
				k: "b10",
				x: 2,
				y: 0,
				z: 2,
				c: "a"
			},
			{
				k: "b11",
				x: 3,
				y: 0,
				z: 2,
				c: "a"
			},
			{
				k: "b12",
				x: 0,
				y: 1,
				z: 0,
				c: "b"
			},
			{
				k: "b13",
				x: 0,
				y: 2,
				z: 0,
				c: "b"
			},
			{
				k: "b14",
				x: 0,
				y: 3,
				z: 0,
				c: "b"
			},
			{
				k: "b15",
				x: 0,
				y: 1,
				z: 2,
				c: "b"
			},
			{
				k: "b16",
				x: 0,
				y: 2,
				z: 2,
				c: "b"
			},
			{
				k: "b17",
				x: 0,
				y: 3,
				z: 2,
				c: "b"
			},
			{
				k: "b18",
				x: 3,
				y: 1,
				z: 0,
				c: "b"
			},
			{
				k: "b19",
				x: 3,
				y: 2,
				z: 0,
				c: "b"
			},
			{
				k: "b20",
				x: 3,
				y: 3,
				z: 0,
				c: "b"
			},
			{
				k: "b21",
				x: 3,
				y: 1,
				z: 2,
				c: "b"
			},
			{
				k: "b22",
				x: 3,
				y: 2,
				z: 2,
				c: "b"
			},
			{
				k: "b23",
				x: 3,
				y: 3,
				z: 2,
				c: "b"
			},
			{
				k: "b24",
				x: 1,
				y: 1,
				z: 1,
				c: "c"
			},
			{
				k: "b25",
				x: 2,
				y: 1,
				z: 1,
				c: "c"
			},
			{
				k: "b26",
				x: 1,
				y: 2,
				z: 1,
				c: "c"
			},
			{
				k: "b27",
				x: 2,
				y: 2,
				z: 1,
				c: "c"
			},
			{
				k: "b28",
				x: 1,
				y: 3,
				z: 1,
				c: "c"
			},
			{
				k: "b29",
				x: 2,
				y: 3,
				z: 1,
				c: "c"
			},
			{
				k: "b30",
				x: 1,
				y: 4,
				z: 1,
				c: "c"
			},
			{
				k: "b31",
				x: 2,
				y: 4,
				z: 1,
				c: "c"
			},
			{
				k: "b32",
				x: 1,
				y: 5,
				z: 1,
				c: "d"
			},
			{
				k: "b33",
				x: 2,
				y: 5,
				z: 1,
				c: "d"
			},
			{
				k: "b34",
				x: 1,
				y: 5,
				z: 0,
				c: "d"
			},
			{
				k: "b35",
				x: 2,
				y: 5,
				z: 0,
				c: "d"
			},
			{
				k: "b36",
				x: 1,
				y: 5,
				z: 2,
				c: "d"
			},
			{
				k: "b37",
				x: 2,
				y: 5,
				z: 2,
				c: "d"
			},
			{
				k: "b38",
				x: -1,
				y: 2,
				z: -1,
				c: "e"
			},
			{
				k: "b39",
				x: 4,
				y: 3,
				z: 1,
				c: "e"
			},
			{
				k: "b40",
				x: 1,
				y: 6,
				z: -1,
				c: "e"
			},
			{
				k: "b41",
				x: 2,
				y: 6,
				z: 3,
				c: "e"
			}
		];
		/** 光柱：给结构加纵向光感 */
		const sceneBeams = [{
			k: "bm1",
			x1: 1.5,
			y1: 0,
			z1: 1.5,
			y2: 5,
			z2: 1.5,
			c: "a"
		}, {
			k: "bm2",
			x1: .5,
			y1: 0,
			z1: 1.5,
			y2: 0,
			z2: 1.5,
			c: "a"
		}];
		const blockStyle = (x, y, z) => ({
			left: `${x * GRID}px`,
			top: `${y * GRID}px`,
			transform: `translateZ(${z * GRID}px)`,
			animationDelay: `${((x + y + z) * .1).toFixed(2)}s`
		});
		/** 光柱定位 */
		const beamStyle = (b) => ({
			left: `${b.x1 * GRID}px`,
			top: `${b.y1 * GRID}px`,
			height: `${(b.y2 - b.y1) * GRID}px`,
			transform: `translateZ(${(b.z1 + (b.z2 - b.z1) / 2) * GRID}px)`
		});
		/** 左右两座结构的朝向：左侧反向旋转，形成向中轴汇聚的观感 */
		const structureStyle = (side) => ({ transform: `rotateX(-24deg) rotateY(${side === "left" ? -sceneRotation.value : sceneRotation.value}deg)` });
		/** 漂浮粒子 */
		const particle = (i) => ({
			left: `${i * 7 % 100}%`,
			top: `${i * 13 % 100}%`,
			width: `${2 + i % 3}px`,
			height: `${2 + i % 3}px`,
			background: i % 3 === 0 ? "var(--el-color-primary-light-5)" : i % 3 === 1 ? "var(--el-color-primary)" : "var(--el-color-primary-light-3)",
			animationDelay: `${-i * .7}s`,
			animationDuration: `${6 + i % 5 * 2}s`
		});
		onMounted(() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				markerCount.value = 8;
				return;
			}
			const start = performance.now();
			const animate = (ts) => {
				sceneRotation.value = (ts - start) / 1e3 * 14 % 360;
				raf = requestAnimationFrame(animate);
			};
			raf = requestAnimationFrame(animate);
		});
		onBeforeUnmount(() => {
			if (raf) cancelAnimationFrame(raf);
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [
				_cache[0] || (_cache[0] = createBaseVNode("div", { class: "voxel-bg" }, null, -1)),
				_cache[1] || (_cache[1] = createBaseVNode("div", { class: "voxel-grid-wall" }, null, -1)),
				_cache[2] || (_cache[2] = createBaseVNode("div", { class: "voxel-grid-floor" }, null, -1)),
				createBaseVNode("div", _hoisted_3, [(openBlock(), createElementBlock(Fragment, null, renderList(30, (i) => {
					return createBaseVNode("span", {
						key: "s" + i,
						class: "voxel-particle",
						style: normalizeStyle(particle(i))
					}, null, 4);
				}), 64))]),
				createBaseVNode("div", _hoisted_4, [(openBlock(), createElementBlock(Fragment, null, renderList(["left", "right"], (side) => {
					return createBaseVNode("div", {
						key: side,
						class: normalizeClass(["voxel-structure", `voxel-structure--${side}`]),
						style: normalizeStyle(structureStyle(side))
					}, [(openBlock(), createElementBlock(Fragment, null, renderList(sceneBlocks, (b) => {
						return createBaseVNode("div", {
							key: b.k,
							class: normalizeClass(["voxel-cube", "cube--" + b.c]),
							style: normalizeStyle(blockStyle(b.x, b.y, b.z))
						}, null, 6);
					}), 64)), (openBlock(), createElementBlock(Fragment, null, renderList(sceneBeams, (beam) => {
						return createBaseVNode("div", {
							key: beam.k,
							class: normalizeClass(["voxel-beam", "beam--" + beam.c]),
							style: normalizeStyle(beamStyle(beam))
						}, null, 6);
					}), 64))], 6);
				}), 64))]),
				_cache[3] || (_cache[3] = createBaseVNode("div", { class: "voxel-ring voxel-ring--a" }, null, -1)),
				_cache[4] || (_cache[4] = createBaseVNode("div", { class: "voxel-ring voxel-ring--b" }, null, -1)),
				_cache[5] || (_cache[5] = createBaseVNode("div", { class: "voxel-ring voxel-ring--c" }, null, -1))
			]), createBaseVNode("div", _hoisted_5, [createBaseVNode("section", _hoisted_6, [
				createBaseVNode("header", _hoisted_7, [_cache[6] || (_cache[6] = createStaticVNode("<div class=\"voxel-cube-logo\" data-v-546b98a8><div class=\"face f-top\" data-v-546b98a8></div><div class=\"face f-bottom\" data-v-546b98a8></div><div class=\"face f-left\" data-v-546b98a8></div><div class=\"face f-right\" data-v-546b98a8></div><div class=\"face f-front\" data-v-546b98a8></div><div class=\"face f-back\" data-v-546b98a8></div></div>", 1)), createBaseVNode("div", _hoisted_8, [createBaseVNode("h1", _hoisted_9, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1), createBaseVNode("p", _hoisted_10, toDisplayString(unref(translateConfigText)(loginConfig.value.description)), 1)])]),
				createBaseVNode("div", _hoisted_11, [
					createBaseVNode("div", _hoisted_12, [(openBlock(), createElementBlock(Fragment, null, renderList(6, (i) => {
						return createBaseVNode("span", {
							key: "bar" + i,
							class: "p-bar",
							style: normalizeStyle({ height: 10 + i * 7 % 22 + "px" })
						}, null, 4);
					}), 64))]),
					createBaseVNode("span", _hoisted_13, toDisplayString(unref(t)("menu.login.account")), 1),
					_cache[7] || (_cache[7] = createBaseVNode("div", { class: "vp-online" }, [createBaseVNode("span", { class: "dot" }), createBaseVNode("span", null, "ONLINE")], -1))
				]),
				createBaseVNode("div", _hoisted_14, [createVNode(ReLoginForm_default, {
					"show-mobile-brand": false,
					"show-header": false,
					"form-class": "voxel-form"
				})]),
				createBaseVNode("div", _hoisted_15, [_cache[8] || (_cache[8] = createBaseVNode("div", { class: "base-line" }, null, -1)), createBaseVNode("div", _hoisted_16, [(openBlock(), createElementBlock(Fragment, null, renderList(12, (i) => {
					return createBaseVNode("span", {
						key: "mk" + i,
						class: normalizeClass(["marker", { active: i <= markerCount.value }])
					}, null, 2);
				}), 64))])])
			]), loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("footer", _hoisted_17, [createVNode(_component_el_icon, { size: 12 }, {
				default: withCtx(() => [createVNode(unref(info_filled_default))]),
				_: 1
			}), createBaseVNode("span", null, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)])) : createCommentVNode("", true)])]);
		};
	}
}), [["__scopeId", "data-v-546b98a8"]]);
//#endregion
export { voxel_default as default };
