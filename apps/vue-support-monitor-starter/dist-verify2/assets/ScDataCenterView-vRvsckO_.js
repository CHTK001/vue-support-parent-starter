import { k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ScDataSourceView_default } from "./ScDataSourceView-CdeDcCHp.js";
//#endregion
//#region src/views/ScDataCenterView.vue
var ScDataCenterView_default = /* @__PURE__ */ defineComponent({
	__name: "ScDataCenterView",
	setup(__props) {
		/**
		* 数据源中心（监控台宿主视图）
		*
		* 数据源中心本体是共享包 @pages/datasource 的 ScDataSourceView，采集台也在用。
		* 独立路由 /db-manager 保留：外链、书签、其它系统的深链仍指向它。
		* 本视图不再向 ScDataSourceView 注入「数据表」页签。
		*
		* @author CH
		* @since 4.0.0.42
		*/
		return (_ctx, _cache) => {
			return openBlock(), createBlock(ScDataSourceView_default);
		};
	}
});
//#endregion
export { ScDataCenterView_default as default };
