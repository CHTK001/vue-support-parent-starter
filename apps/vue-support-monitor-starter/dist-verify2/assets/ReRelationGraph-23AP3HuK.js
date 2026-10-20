import { et as mergeProps, k as defineComponent, mt as openBlock, v as createBlock, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as G6Graph_default } from "./G6Graph-B9sMX7ab.js";
//#endregion
//#region ../../packages/ui/src/components/ReRelationGraph/theme/koi/ReRelationGraph.vue
var ReRelationGraph_default = /* @__PURE__ */ defineComponent({
	name: "ReRelationGraph",
	inheritAttrs: false,
	__name: "ReRelationGraph",
	setup(__props, { expose: __expose }) {
		/**
		* ReRelationGraph · koi 主题
		*
		* <p>与 default 主题共用同一个 G6 核心；差异只体现在类名与主题变量上，
		* 保证「换主题不改行为」。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const core = ref(null);
		__expose(new Proxy({}, {
			get: (_t, key) => core.value?.[key],
			has: (_t, key) => key in (core.value ?? {})
		}));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(G6Graph_default, mergeProps({
				ref_key: "core",
				ref: core
			}, _ctx.$attrs, { class: "rrg-theme-koi" }), null, 16);
		};
	}
});
//#endregion
export { ReRelationGraph_default as default };
