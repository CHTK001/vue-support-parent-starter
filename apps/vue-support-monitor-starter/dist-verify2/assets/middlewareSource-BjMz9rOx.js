import { D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { c as fetchDataSource, g as getDatasourceHubBase, u as fetchDataSources } from "./src-DW2Ffr17.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
//#region ../../pages/datasource/src/components/console/MiddlewareGap.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "mw-gap"
};
var _hoisted_2 = { class: "mw-gap-text" };
//#endregion
//#region ../../pages/datasource/src/components/console/MiddlewareGap.vue
var MiddlewareGap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "MiddlewareGap",
	props: { text: {} },
	emits: ["retry"],
	setup(__props) {
		/**
		* 中间件管理页的数据来源提示条：后端接口缺失或目标服务不可达时摊开原因。
		* @author CH
		* @since 4.0.0
		*/
		return (_ctx, _cache) => {
			return __props.text ? (openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(unref(component), {
					name: "WarningFilled",
					size: 14,
					class: "mw-gap-icon"
				}),
				createBaseVNode("span", _hoisted_2, toDisplayString(__props.text), 1),
				createVNode(unref(ReButton_default), {
					"show-text": true,
					onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("retry"))
				}, {
					icon: withCtx(() => [createVNode(unref(component), {
						name: "RefreshRight",
						size: 13
					})]),
					default: withCtx(() => [_cache[1] || (_cache[1] = createTextVNode("重试", -1))]),
					_: 1
				})
			])) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-74463102"]]);
//#endregion
//#region ../../pages/datasource/src/utils/middlewareSource.ts
/**
* 中间件管理页（InfluxDB / Neo4j / Nacos / ZooKeeper）共用逻辑
*
* <p>这四页只做一件事：把「数据源管理」里登记的连接配置读出来，再调用各自的后台接口取真实数据。
* 后台接口缺失或目标服务不可达时，把原因摊开给使用者，不再回退到任何内置演示数据。</p>
*
* <p>数据源解析有两种策略，由 {@link MiddlewareSourceOptions.strict} 选择：</p>
* <ul>
*   <li><b>宽松（默认）</b>：路由未带 {@code datasourceId} 时，自动挑选该类型的第一个数据源。
*       四个管理页的菜单项均 {@code showLink: false}，正常入口是从数据源中心点击进入，
*       但直接输地址栏访问时也能工作。</li>
*   <li><b>严格</b>：路由必须带合法 {@code datasourceId}，缺失或类型不匹配都直接给出原因。
*       适用于只能从数据源中心进入、不允许猜测的场景。</li>
* </ul>
*
* @author CH
* @since 4.0.0
*/
/**
* 创建中间件数据源状态。
*
* @param options 解析策略选项
* @returns 数据源状态与配套方法
*/
function useMiddlewareSource(options = {}) {
	const { strict = false } = options;
	const route = useRoute();
	const queryId = Number(route.query.datasourceId);
	const datasourceId = ref(Number.isFinite(queryId) && queryId > 0 ? queryId : void 0);
	const source = ref(null);
	const gap = ref("");
	/** 累积「后端未提供」的端点，避免并发加载互相覆盖 */
	const missing = /* @__PURE__ */ new Set();
	const clearGap = () => {
		missing.clear();
		gap.value = "";
	};
	/**
	* 读取数据源的展示字段，值为空时返回兜底文本。
	*
	* <p>数据源详情接口当前只返回 {@link DataSourceInfo} 上声明的平铺字段，
	* 没有额外的 config map，因此按字段名依次取第一个非空值；未来接口若新增扩展字段，
	* 只需在此处补一个取值分支。</p>
	*
	* @param datasource 数据源详情
	* @param keys       字段名，按优先级排列
	* @param fallback   未配置时的兜底文本
	* @returns 字段文本
	*/
	const readField = (datasource, keys, fallback = "-") => {
		if (!datasource) return fallback;
		const record = datasource;
		for (const key of keys) {
			const value = record[key];
			if (value !== void 0 && value !== null && String(value).trim() !== "") return String(value);
		}
		return fallback;
	};
	const bind = async (type) => {
		try {
			if (datasourceId.value) {
				const found = await fetchDataSource(datasourceId.value);
				if (found && found.type !== type) {
					gap.value = `数据源 #${datasourceId.value} 是 ${found.type} 类型，与本页 ${type} 管理不匹配`;
					return;
				}
				source.value = found;
				clearGap();
				return;
			}
			if (strict) {
				gap.value = `请先在「数据源管理」中新增一个 ${type} 数据源，再从列表点击进入本页面`;
				return;
			}
			const picked = (await fetchDataSources() || []).find((d) => d.type === type);
			if (!picked) {
				gap.value = `尚未登记 ${type} 数据源，请先在「数据源管理」新增后再回到本页`;
				return;
			}
			datasourceId.value = picked.id;
			source.value = picked;
			clearGap();
		} catch (e) {
			fail(e, `${getDatasourceHubBase()}/list`);
		}
	};
	const fail = (error, api) => {
		const msg = String(error?.message ?? error ?? "");
		if (/status code 404|No static resource|no handler|资源不存在/i.test(msg)) {
			missing.add(api);
			const listed = [...missing].slice(0, 3).join("、");
			gap.value = `后端未提供 ${listed}${missing.size > 3 ? " 等接口" : ""}（HTTP 404），本页无真实数据可显示`;
			return;
		}
		gap.value = `调用 ${api} 失败：${msg || "未知错误"}`;
	};
	const ready = () => {
		clearGap();
	};
	return {
		datasourceId,
		source,
		gap,
		bind,
		fail,
		ready,
		readField
	};
}
//#endregion
export { MiddlewareGap_default as n, useMiddlewareSource as t };
