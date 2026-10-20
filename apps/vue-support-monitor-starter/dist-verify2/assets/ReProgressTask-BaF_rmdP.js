import { $n as normalizeClass, D as createVNode, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReProgress/ReProgress.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = ["aria-valuenow"];
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgress.vue
var ReProgress_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProgress",
	inheritAttrs: true,
	__name: "ReProgress",
	props: {
		progress: { default: 0 },
		color: { default: "primary" },
		status: { default: "running" },
		showText: {
			type: Boolean,
			default: false
		},
		height: { default: 6 },
		stripe: {
			type: Boolean,
			default: true
		}
	},
	setup(__props) {
		/**
		* ReProgress —— 单个进度条（纯展示，支持自定义颜色 / 状态）
		*
		* 设计要点：
		*   - 玻璃质感 + 渐变填充
		*   - 实时平滑动画（cubic-bezier 250ms）
		*   - 流光效果（实时模式 stripe 动画）
		*   - 状态色彩：primary / success / warning / danger / info
		*   - 失败抖动震动
		*/
		const props = __props;
		const percent = computed(() => Math.round(Math.max(0, Math.min(1, props.progress)) * 100));
		const fillClass = computed(() => ({
			"re-progress__fill--primary": props.color === "primary",
			"re-progress__fill--success": props.color === "success",
			"re-progress__fill--warning": props.color === "warning",
			"re-progress__fill--danger": props.color === "danger",
			"re-progress__fill--info": props.color === "info",
			"re-progress__fill--pending": props.status === "pending",
			"re-progress__fill--indeterminate": props.status === "running" && props.progress === 0,
			"re-progress__fill--shaking": props.status === "failed"
		}));
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({
				class: ["re-progress", `re-progress--${__props.status}`],
				style: { height: __props.height + "px" },
				role: "progressbar",
				"aria-valuenow": percent.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, _ctx.$attrs), [createBaseVNode("div", {
				class: normalizeClass([
					"re-progress__fill",
					fillClass.value,
					{ "re-progress__fill--stripe": __props.stripe && __props.status === "running" }
				]),
				style: normalizeStyle({ width: `${Math.max(0, Math.min(100, percent.value))}%` })
			}, null, 6)], 16, _hoisted_1$1);
		};
	}
}), [["__scopeId", "data-v-3d4cd9c3"]]);
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressTask.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-progress-task__main" };
var _hoisted_2 = { class: "re-progress-task__title-row" };
var _hoisted_3 = { class: "re-progress-task__title" };
var _hoisted_4 = { class: "re-progress-task__percent" };
var _hoisted_5 = {
	key: 0,
	class: "re-progress-task__summary"
};
var _hoisted_6 = { class: "re-progress-task__status" };
var _hoisted_7 = {
	key: 0,
	class: "re-progress-task__elapsed"
};
var _hoisted_8 = {
	key: 1,
	class: "re-progress-task__remaining"
};
var _hoisted_9 = {
	key: 2,
	class: "re-progress-task__speed"
};
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressTask.vue
var ReProgressTask_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProgressTask",
	inheritAttrs: true,
	__name: "ReProgressTask",
	props: {
		task: {},
		collapsed: {
			type: Boolean,
			default: false
		}
	},
	emits: ["remove", "retry"],
	setup(__props, { emit: __emit }) {
		/**
		* ReProgressTask —— 单任务卡片（展开模式）
		*
		* 包含进度条 + 状态标题 + 概要信息（速率、剩余时间、已加载等）
		* 支持折叠 / 展开切换
		*/
		const props = __props;
		const emit = __emit;
		const folded = ref(props.collapsed);
		const statusText = computed(() => {
			switch (props.task.status) {
				case "pending": return "等待中";
				case "running": return props.task.text ?? "进行中";
				case "success": return "已完成";
				case "failed": return props.task.error ?? "失败";
				case "cancelled": return "已取消";
				default: return "";
			}
		});
		const statusIcon = computed(() => {
			switch (props.task.status) {
				case "pending": return "○";
				case "running": return "◐";
				case "success": return "✓";
				case "failed": return "✕";
				case "cancelled": return "–";
				default: return "•";
			}
		});
		const statusColor = computed(() => {
			switch (props.task.status) {
				case "success": return "success";
				case "failed": return "danger";
				case "cancelled": return "info";
				case "pending": return "info";
				case "running": return props.task.color ?? "primary";
				default: return "primary";
			}
		});
		/** 已用时间 */
		const elapsed = computed(() => {
			const start = props.task.startedAt ?? props.task.createdAt;
			const end = props.task.finishedAt ?? Date.now();
			const s = Math.floor((end - start) / 1e3);
			if (s < 60) return `${s}s`;
			return `${Math.floor(s / 60)}m ${s % 60}s`;
		});
		/** 预计剩余时间 */
		const remaining = computed(() => {
			if (props.task.status !== "running") return "";
			if (props.task.progress <= 0) return "";
			const elapsed = Date.now() - (props.task.startedAt ?? props.task.createdAt);
			const left = elapsed / props.task.progress - elapsed;
			if (left <= 0) return "";
			const s = Math.floor(left / 1e3);
			if (s < 60) return `还剩 ${s}s`;
			return `还剩 ${Math.floor(s / 60)}m ${s % 60}s`;
		});
		/** 加载速度（模拟：MB/s） */
		const speed = computed(() => {
			if (props.task.status !== "running") return "";
			return "1.2 MB/s";
		});
		const isFinished = computed(() => props.task.status === "success" || props.task.status === "failed" || props.task.status === "cancelled");
		function onToggle() {
			folded.value = !folded.value;
		}
		function onRemove() {
			emit("remove", props.task.id);
		}
		function onRetry() {
			emit("retry", props.task.id);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({ class: [
				"re-progress-task",
				`re-progress-task--status-${__props.task.status}`,
				{ "re-progress-task--folded": folded.value }
			] }, _ctx.$attrs), [createBaseVNode("div", {
				class: "re-progress-task__head",
				onClick: onToggle
			}, [
				createBaseVNode("span", { class: normalizeClass(["re-progress-task__icon", `re-progress-task__icon--${statusColor.value}`]) }, toDisplayString(statusIcon.value), 3),
				createBaseVNode("div", _hoisted_1, [
					createBaseVNode("div", _hoisted_2, [createBaseVNode("span", _hoisted_3, toDisplayString(__props.task.title), 1), createBaseVNode("span", _hoisted_4, toDisplayString(Math.round(__props.task.progress * 100)) + "%", 1)]),
					createVNode(ReProgress_default, {
						progress: __props.task.progress,
						color: statusColor.value,
						status: __props.task.status,
						stripe: __props.task.status === "running",
						height: 4
					}, null, 8, [
						"progress",
						"color",
						"status",
						"stripe"
					]),
					!folded.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
						createBaseVNode("span", _hoisted_6, toDisplayString(statusText.value), 1),
						__props.task.history.length > 1 ? (openBlock(), createElementBlock("span", _hoisted_7, "· " + toDisplayString(elapsed.value), 1)) : createCommentVNode("", true),
						remaining.value ? (openBlock(), createElementBlock("span", _hoisted_8, toDisplayString(remaining.value), 1)) : createCommentVNode("", true),
						speed.value && __props.task.status === "running" ? (openBlock(), createElementBlock("span", _hoisted_9, toDisplayString(speed.value), 1)) : createCommentVNode("", true)
					])) : createCommentVNode("", true)
				]),
				createBaseVNode("div", {
					class: "re-progress-task__actions",
					onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
				}, [__props.task.status === "failed" && __props.task.closable !== false ? (openBlock(), createElementBlock("button", {
					key: 0,
					class: "re-progress-task__btn",
					type: "button",
					title: "重试",
					onClick: onRetry
				}, [..._cache[1] || (_cache[1] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("path", { d: "M3 12a9 9 0 1 0 3-6.7L3 8" }), createBaseVNode("path", { d: "M3 3v5h5" })], -1)])])) : createCommentVNode("", true), __props.task.closable !== false && isFinished.value ? (openBlock(), createElementBlock("button", {
					key: 1,
					class: "re-progress-task__btn re-progress-task__btn--close",
					type: "button",
					title: "关闭",
					onClick: onRemove
				}, [..._cache[2] || (_cache[2] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("path", { d: "M18 6L6 18M6 6l12 12" })], -1)])])) : createCommentVNode("", true)])
			])], 16);
		};
	}
}), [["__scopeId", "data-v-f689710e"]]);
//#endregion
export { ReProgress_default as n, ReProgressTask_default as t };
