import { $ as mergeModels, $n as normalizeClass, D as createVNode, Ft as useModel, Ht as watch, On as unref, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, o as Fragment, rr as toDisplayString, tt as nextTick, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReIp/ReIp.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-ip__separator"
};
//#endregion
//#region ../../packages/ui/src/components/ReIp/ReIp.vue
var ReIp_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReIp",
	inheritAttrs: true,
	__name: "ReIp",
	props: /*@__PURE__*/ mergeModels({
		version: { default: "ipv4" },
		placeholder: { default: "" },
		disabled: {
			type: Boolean,
			default: false
		},
		readonly: {
			type: Boolean,
			default: false
		},
		clearable: {
			type: Boolean,
			default: false
		},
		size: { default: "default" }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props, { expose: __expose }) {
		/**
		* ReIp —— IP 地址输入组件
		*
		* 支持 IPv4 / IPv6 双模式：
		*   <ReIp v-model="ip" />
		*   <ReIp v-model="ip" version="ipv6" />
		*   <ReIp :model-value="raw" @update:model-value="onChange" />
		*
		* 内部以分段 el-input 形式呈现：
		*   - ipv4: 4 段十进制，每段 0~255
		*   - ipv6: 8 组 16 进制，每组 0~ffff
		*
		* 支持自动跳段（输入满长度自动聚焦下一段）、退格跳回上一段、整体粘贴自动切分。
		* 暴露 validate() 方法供父组件主动校验。
		*/
		/** IP 版本 */
		const props = __props;
		const model = useModel(__props, "modelValue");
		/** 当前版本对应的分段数 */
		const segmentCount = computed(() => props.version === "ipv4" ? 4 : 8);
		/** 每段最大长度（字符数） */
		const segmentMaxLength = computed(() => props.version === "ipv4" ? 3 : 4);
		/** 每段允许的字符正则 */
		const segmentPattern = computed(() => props.version === "ipv4" ? /^[0-9]*$/ : /^[0-9a-fA-F]*$/);
		/** 分隔符：ipv4 用 ".", ipv6 用 ":" */
		const separator = computed(() => props.version === "ipv4" ? "." : ":");
		/** 分段输入框的 ref 数组 */
		const inputRefs = ref([]);
		/** 当前各段的值 */
		const segments = ref([]);
		/** 整体初始化（外部 v-model → 内部 segments） */
		function parseToSegments(value) {
			const count = segmentCount.value;
			if (!value) return new Array(count).fill("");
			const parts = value.split(separator.value);
			const result = new Array(count).fill("");
			for (let i = 0; i < count; i++) result[i] = (parts[i] ?? "").slice(0, segmentMaxLength.value);
			return result;
		}
		/** 段值合法性：ipv4 数字 0~255，ipv6 十六进制 0~ffff（允许空） */
		function isValidSegment(value) {
			if (value === "") return true;
			if (!segmentPattern.value.test(value)) return false;
			if (props.version === "ipv4") {
				const n = Number(value);
				return n >= 0 && n <= 255;
			}
			const n = parseInt(value, 16);
			return n >= 0 && n <= 65535;
		}
		/** 段值是否已"满"（达到最大长度或已是最大值） */
		function isSegmentFull(value) {
			if (!value) return false;
			if (value.length >= segmentMaxLength.value) return true;
			if (props.version === "ipv4" && value.length === 3) return Number(value) > 25;
			if (props.version === "ipv6" && value.length === 4) return parseInt(value, 16) >= 4095;
			return false;
		}
		/** 同步内部 segments → model */
		function syncModel() {
			const joined = segments.value.join(separator.value);
			model.value = joined;
		}
		/** 聚焦到指定段 */
		async function focusSegment(index) {
			await nextTick();
			const inst = inputRefs.value[index];
			if (!inst) return;
			const inputEl = inst.ref?.input;
			inputEl?.focus();
			inputEl?.select?.();
		}
		/** 单段输入 */
		function onSegmentInput(index, raw) {
			let value = String(raw ?? "");
			value = value.replace(props.version === "ipv4" ? /[^0-9]/g : /[^0-9a-fA-F]/g, "");
			if (value.length > segmentMaxLength.value) value = value.slice(0, segmentMaxLength.value);
			if (props.version === "ipv4" && value !== "" && Number(value) > 255) value = "255";
			segments.value[index] = value;
			syncModel();
			if (isSegmentFull(value) && index < segmentCount.value - 1) focusSegment(index + 1);
		}
		/** 单段键盘事件：退格到空段时跳回上一段；方向键导航；粘贴整体 */
		function onSegmentKeydown(index, event) {
			const key = event.key;
			if ((key === "v" || key === "V") && (event.ctrlKey || event.metaKey)) return;
			if (key === "Backspace" && segments.value[index] === "" && index > 0) {
				event.preventDefault();
				focusSegment(index - 1);
				return;
			}
			if (key === "ArrowLeft" && index > 0) {
				event.preventDefault();
				focusSegment(index - 1);
				return;
			}
			if (key === "ArrowRight" && index < segmentCount.value - 1) {
				event.preventDefault();
				focusSegment(index + 1);
				return;
			}
			if (key === "." || key === ":") {
				event.preventDefault();
				if (index < segmentCount.value - 1) focusSegment(index + 1);
				return;
			}
		}
		/** 单段粘贴：尝试把整段 IP 拆分布置 */
		function onSegmentPaste(index, event) {
			const text = event.clipboardData?.getData("text") ?? "";
			if (!text || !text.includes(separator.value)) return;
			event.preventDefault();
			const parts = text.split(separator.value);
			const newSegments = parseToSegments("");
			for (let i = 0; i < segmentCount.value; i++) newSegments[i] = (parts[i] ?? "").slice(0, segmentMaxLength.value);
			segments.value = newSegments;
			syncModel();
		}
		/** 清空按钮 */
		function onClear() {
			segments.value = new Array(segmentCount.value).fill("");
			syncModel();
			focusSegment(0);
		}
		/** 整体合法性 */
		const isValid = computed(() => {
			if (segments.value.every((s) => s === "")) return false;
			if (!segments.value.every(isValidSegment)) return false;
			return segments.value.every((s) => s.length > 0);
		});
		/** 版本切换或外部值变化时重新切分 */
		watch(() => [props.version, model.value], ([version, value]) => {
			if (segments.value.length !== (version === "ipv4" ? 4 : 8)) {
				segments.value = parseToSegments(value);
				return;
			}
			const expected = parseToSegments(value);
			const current = segments.value.join(separator.value);
			if (expected.join(separator.value) !== current) segments.value = expected;
		}, { immediate: true });
		/** 暴露给父组件的方法 */
		__expose({
			/** 主动校验 */
			validate() {
				return isValid.value;
			},
			/** 主动聚焦第一段 */
			focus() {
				focusSegment(0);
			},
			/** 主动清空 */
			clear() {
				onClear();
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-ip", { "re-ip--disabled": __props.disabled }]) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(segmentCount.value, (_, index) => {
				return openBlock(), createElementBlock(Fragment, { key: index }, [createVNode(unref(ElInput), {
					ref_for: true,
					ref: (el) => inputRefs.value[index] = el,
					"model-value": segments.value[index] ?? "",
					maxlength: segmentMaxLength.value,
					disabled: __props.disabled,
					readonly: __props.readonly,
					size: __props.size,
					placeholder: __props.placeholder || (index === 0 ? __props.version === "ipv4" ? "192" : "2001" : ""),
					class: "re-ip__segment",
					"onUpdate:modelValue": (v) => onSegmentInput(index, v),
					onKeydown: (e) => onSegmentKeydown(index, e),
					onPaste: (e) => onSegmentPaste(index, e)
				}, null, 8, [
					"model-value",
					"maxlength",
					"disabled",
					"readonly",
					"size",
					"placeholder",
					"onUpdate:modelValue",
					"onKeydown",
					"onPaste"
				]), index < segmentCount.value - 1 ? (openBlock(), createElementBlock("span", _hoisted_1, toDisplayString(separator.value), 1)) : createCommentVNode("", true)], 64);
			}), 128)), __props.clearable && !__props.disabled && !__props.readonly && segments.value.some((s) => s !== "") ? (openBlock(), createElementBlock("button", {
				key: 0,
				type: "button",
				class: "re-ip__clear",
				"aria-label": "清空",
				onClick: onClear
			}, " × ")) : createCommentVNode("", true)], 2);
		};
	}
}), [["__scopeId", "data-v-7a11f04c"]]);
//#endregion
//#region ../../packages/ui/src/components/ReIp/index.ts
var plugin = { install(app) {
	app.component("ReIp", ReIp_default$1);
} };
var ReIp_default = ReIp_default$1;
//#endregion
export { ReIp_default as default, plugin as install };
