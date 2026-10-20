import { Ht as watch, St as resolveComponent, ct as onMounted, et as mergeProps, it as onBeforeUnmount, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, vn as ref, w as createSlots, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
//#endregion
//#region ../../packages/ui/src/components/ReBadge/ReBadge.vue
var ReBadge_default$1 = /* @__PURE__ */ defineComponent({
	name: "ReBadge",
	inheritAttrs: true,
	__name: "ReBadge",
	props: {
		value: { default: "" },
		max: { default: 99 },
		isDot: {
			type: Boolean,
			default: false
		},
		hidden: {
			type: Boolean,
			default: false
		},
		type: { default: "danger" },
		showZero: {
			type: Boolean,
			default: true
		},
		color: { default: "" },
		offset: { default: () => [0, 0] },
		badgeStyle: {
			type: [
				String,
				Boolean,
				Object,
				Array
			],
			default: void 0
		},
		badgeClass: { default: "" },
		breath: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* ReBadge —— 徽标组件
		*
		* 透传 el-badge 全部能力，封装统一前缀 re-badge：
		*   - value / max / isDot / hidden / type / showZero / color
		*   - offset / badgeStyle / badgeClass
		*   - 默认插槽与 content 插槽
		*   - breath：是否开启呼吸动画（仅对 is-dot 红点生效，添加脉冲光圈）
		*
		* 说明：原 `layout` 变体（"modern" / "pill" / "status"，对应 layouts/ 三个文件）
		* 经审计确认全仓无人使用，已随统一表面方案移除；需要时从
		* backups/ui-unused-layouts-retire-20260926/ 取回。
		*/
		const props = __props;
		/** 根节点引用 */
		const root = ref(null);
		/** 当前正在监听的目标 dot 元素（用于清除 MutationObserver） */
		let observed = null;
		let observer = null;
		/**
		* 为当前根节点内的 .el-badge__dot 元素添加 re-badge--breath 类，
		* 使用 MutationObserver 监听 dot 元素的出现/消失（el-badge 会按需挂载）。
		*/
		function applyBreath() {
			if (!root.value) return;
			const dot = root.value.querySelector(".el-badge__dot");
			if (dot === observed) return;
			if (observer && observed) {
				observer.disconnect();
				observed.classList.remove("re-badge--breath");
			}
			observed = dot;
			if (!dot) {
				observer = null;
				return;
			}
			if (props.breath && props.isDot) dot.classList.add("re-badge--breath");
			observer = new MutationObserver(applyBreath);
			observer.observe(root.value, {
				childList: true,
				subtree: true
			});
		}
		/** 同步 breath 类到当前 dot 元素 */
		function syncBreathClass() {
			if (!observed) return;
			observed.classList.toggle("re-badge--breath", !!props.breath && !!props.isDot);
		}
		watch(() => [props.breath, props.isDot], () => {
			syncBreathClass();
			applyBreath();
		});
		onMounted(() => {
			applyBreath();
		});
		onBeforeUnmount(() => {
			if (observer) observer.disconnect();
			if (observed) observed.classList.remove("re-badge--breath");
			observer = null;
			observed = null;
		});
		return (_ctx, _cache) => {
			const _component_el_badge = resolveComponent("el-badge");
			return openBlock(), createBlock(_component_el_badge, mergeProps({
				ref_key: "root",
				ref: root
			}, _ctx.$attrs, {
				value: __props.value,
				max: __props.max,
				"is-dot": __props.isDot,
				hidden: __props.hidden,
				type: __props.type,
				"show-zero": __props.showZero,
				color: __props.color,
				offset: __props.offset,
				"badge-style": __props.badgeStyle,
				"badge-class": __props.badgeClass,
				class: ["re-badge", __props.breath && __props.isDot ? "re-badge--breath-host" : null]
			}), createSlots({ _: 2 }, [_ctx.$slots.default ? {
				name: "default",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				key: "0"
			} : void 0, _ctx.$slots.content ? {
				name: "content",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "content")]),
				key: "1"
			} : void 0]), 1040, [
				"value",
				"max",
				"is-dot",
				"hidden",
				"type",
				"show-zero",
				"color",
				"offset",
				"badge-style",
				"badge-class",
				"class"
			]);
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReBadge/index.ts
var plugin = { install(app) {
	app.component("ReBadge", ReBadge_default$1);
} };
var ReBadge_default = ReBadge_default$1;
//#endregion
export { ReBadge_default as default, plugin as install };
