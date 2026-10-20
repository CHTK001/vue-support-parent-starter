import { D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gt as provide, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
import { i as createNgxEmbedContext, o as fetchEmbedNginxDashboard } from "./api-5Dnrf3ch.js";
import { i as NGX_CTX_KEY, t as NgxCardRenderer_default, u as parseNgxLayout } from "./NgxCardRenderer-CM5mDifO.js";
//#region ../../pages/datasource/src/views/console/NginxEmbedView.vue?vue&type=script&setup=true&name=NginxEmbedView&lang.ts
var _hoisted_1 = { class: "nge" };
var _hoisted_2 = { class: "nge-head" };
var _hoisted_3 = { class: "nge-head-left" };
var _hoisted_4 = { class: "nge-title" };
var _hoisted_5 = { class: "nge-head-right" };
var _hoisted_6 = { class: "nge-time" };
var _hoisted_7 = {
	key: 0,
	class: "nge-center"
};
var _hoisted_8 = {
	key: 1,
	class: "nge-center nge-error"
};
var _hoisted_9 = {
	key: 2,
	class: "nge-center"
};
var _hoisted_10 = {
	key: 3,
	class: "nge-grid"
};
//#endregion
//#region ../../pages/datasource/src/views/console/NginxEmbedView.vue
var NginxEmbedView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxEmbedView",
	setup(__props) {
		/**
		* Nginx 看板嵌入页（公开只读）。
		*
		* <p>路径 {@code /nginx/embed/:token}，免登录访问（部署侧需把该路由与后端
		* {@code /ms/monitor/nginx/dashboard/embed/**} 加入白名单）。数据经令牌查询接口获取，
		* 不复用控制台登录态；页面自身可由任意系统 iframe 嵌入。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const route = useRoute();
		const token = computed(() => String(route.params.token || ""));
		const loading = ref(true);
		const error = ref("");
		const layout = ref({
			version: 1,
			widgets: [],
			grid: []
		});
		const dashboardName = ref("");
		const updatedAt = ref("");
		provide(NGX_CTX_KEY, createNgxEmbedContext(token.value));
		const widgets = computed(() => layout.value.widgets);
		/** 把网格坐标换算成 CSS Grid 定位（只渲染 grid 与 widgets 都存在的卡片） */
		const cells = computed(() => {
			const byId = new Map(layout.value.widgets.map((w) => [w.id, w]));
			return layout.value.grid.filter((g) => byId.has(g.i)).map((g) => ({
				...g,
				id: g.i,
				widget: byId.get(g.i)
			}));
		});
		const refreshKey = ref(0);
		async function load() {
			loading.value = true;
			error.value = "";
			try {
				if (!token.value) throw new Error("缺少嵌入令牌");
				const dashboard = await fetchEmbedNginxDashboard(token.value);
				dashboardName.value = dashboard?.name || "";
				layout.value = parseNgxLayout(dashboard?.config);
				updatedAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
			} catch (e) {
				error.value = `看板加载失败：${e?.message ?? e}`;
			} finally {
				loading.value = false;
			}
		}
		/** 刷新全部：靠 key 强制重建卡片（每张卡自带定时器与刷新按钮，无需逐个通知） */
		function refreshAll() {
			refreshKey.value += 1;
			updatedAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
		}
		onMounted(() => {
			load();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(unref(component), {
				name: "Connection",
				size: 16,
				class: "nge-icon"
			}), createBaseVNode("span", _hoisted_4, toDisplayString(dashboardName.value || "Nginx 看板"), 1)]), createBaseVNode("div", _hoisted_5, [createBaseVNode("span", _hoisted_6, toDisplayString(updatedAt.value), 1), createBaseVNode("button", {
				class: "nge-refresh",
				type: "button",
				"data-testid": "nge-btn-refresh",
				title: "刷新全部卡片",
				onClick: refreshAll
			}, [createVNode(unref(component), {
				name: "Refresh",
				size: 14
			})])])]), loading.value ? (openBlock(), createElementBlock("div", _hoisted_7, "看板加载中…")) : error.value ? (openBlock(), createElementBlock("div", _hoisted_8, toDisplayString(error.value), 1)) : !widgets.value.length ? (openBlock(), createElementBlock("div", _hoisted_9, "看板暂无卡片")) : (openBlock(), createElementBlock("div", _hoisted_10, [(openBlock(true), createElementBlock(Fragment, null, renderList(cells.value, (cell) => {
				return openBlock(), createElementBlock("div", {
					key: `${cell.id}-${refreshKey.value}`,
					class: "nge-cell",
					style: normalizeStyle({
						gridColumn: `${cell.x + 1} / span ${cell.w}`,
						gridRow: `${cell.y + 1} / span ${cell.h}`
					})
				}, [createVNode(NgxCardRenderer_default, { widget: cell.widget }, null, 8, ["widget"])], 4);
			}), 128))]))]);
		};
	}
}), [["__scopeId", "data-v-3c0afa13"]]);
//#endregion
export { NginxEmbedView_default as default };
