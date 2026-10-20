import { et as mergeProps, k as defineComponent, mt as openBlock, v as createBlock, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as G6Graph_default } from "./G6Graph-B9sMX7ab.js";
//#endregion
//#region ../../packages/ui/src/components/ReRelationGraph/theme/default/ReRelationGraph.vue
var ReRelationGraph_default = /* @__PURE__ */ defineComponent({
	name: "ReRelationGraph",
	inheritAttrs: false,
	__name: "ReRelationGraph",
	setup(__props, { expose: __expose }) {
		/**
		* ReRelationGraph · default 主题
		*
		* <p>主题层只做两件事：给出主题标识类名、把 props/事件/API 原样透传给 G6 核心。
		* 外观差异一律走 CSS 变量，不在模板里分叉逻辑。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const core = ref(null);
		/**
		* 对外 API 代理：把核心实例的方法原样转发出去。
		*
		* <p>用 Proxy 是为了避免把二十来个方法再抄一遍——那些方法名与签名由
		* {@link RelationGraphApi} 约束，抄写只会带来漂移风险。</p>
		*/
		__expose(new Proxy({}, {
			get: (_t, key) => core.value?.[key],
			has: (_t, key) => key in (core.value ?? {})
		}));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(G6Graph_default, mergeProps({
				ref_key: "core",
				ref: core
			}, _ctx.$attrs, { class: "rrg-theme-default" }), null, 16);
		};
	}
});
//#endregion
export { ReRelationGraph_default as default };
