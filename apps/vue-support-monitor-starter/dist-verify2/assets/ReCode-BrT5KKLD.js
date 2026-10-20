import { $n as normalizeClass, E as createTextVNode, T as createStaticVNode, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, ft as onUnmounted, g as computed, mt as openBlock, o as Fragment, tt as nextTick, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReCode/index.vue
var _hoisted_1 = { class: "modern-otp-container" };
var _hoisted_2 = { class: "modern-otp-form" };
var _hoisted_3 = { class: "verification-container" };
var _hoisted_4 = [
	"onUpdate:modelValue",
	"disabled",
	"onInput",
	"onKeydown",
	"onFocus",
	"onBlur"
];
var _hoisted_5 = { class: "otp-footer" };
var _hoisted_6 = { class: "otp-actions" };
var _hoisted_7 = ["disabled"];
var ReCode_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default({
	__name: "index",
	props: { disabled: {
		type: Boolean,
		default: false
	} },
	emits: ["complete", "change"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const verificationCodes = ref([
			"",
			"",
			"",
			"",
			"",
			""
		]);
		const activeIndex = ref(-1);
		const hasError = ref(false);
		const inputRefs = ref([]);
		const emit = __emit;
		const hasValue = computed(() => {
			return verificationCodes.value.some((code) => code !== "");
		});
		const handlePaste = (e) => {
			e.preventDefault();
			let text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").substring(0, 6);
			verificationCodes.value = [
				"",
				"",
				"",
				"",
				"",
				""
			];
			for (let i = 0; i < text.length; i++) verificationCodes.value[i] = text[i];
			const _value = verificationCodes.value.join("");
			emit("onChange", _value);
			if (_value.length === 6) {
				emit("onComplete", _value);
				if (inputRefs.value[5]) inputRefs.value[5].blur();
			} else if (text.length > 0) {
				const nextEmptyIndex = text.length < 6 ? text.length : 5;
				if (inputRefs.value[nextEmptyIndex]) inputRefs.value[nextEmptyIndex].focus();
			}
		};
		const handleInput = (index, event) => {
			if (props.disabled) return;
			const value = event.target.value.replace(/\D/g, "");
			if (value.length > 1) {
				const chars = value.split("");
				for (let i = 0; i < Math.min(chars.length, 6 - index); i++) if (index + i < 6) verificationCodes.value[index + i] = chars[i];
				const nextIndex = Math.min(index + chars.length, 5);
				if (inputRefs.value[nextIndex]) nextTick(() => {
					inputRefs.value[nextIndex].focus();
				});
			} else {
				verificationCodes.value[index] = value;
				if (value && index < 5) nextTick(() => {
					if (inputRefs.value[index + 1]) inputRefs.value[index + 1].focus();
				});
			}
			const _value = verificationCodes.value.join("");
			emit("onChange", _value);
			if (_value.length === 6) {
				emit("onComplete", _value);
				nextTick(() => {
					if (inputRefs.value[5]) inputRefs.value[5].blur();
				});
			}
			if (hasError.value) hasError.value = false;
		};
		const handleKeyDown = (index, event) => {
			if (event.key === "Backspace") {
				if (!verificationCodes.value[index] && index > 0) {
					verificationCodes.value[index - 1] = "";
					nextTick(() => {
						if (inputRefs.value[index - 1]) inputRefs.value[index - 1].focus();
					});
				} else verificationCodes.value[index] = "";
				const _value = verificationCodes.value.join("");
				emit("onChange", _value);
			}
			if (event.key === "ArrowLeft" && index > 0) nextTick(() => {
				if (inputRefs.value[index - 1]) inputRefs.value[index - 1].focus();
			});
			if (event.key === "ArrowRight" && index < 5) nextTick(() => {
				if (inputRefs.value[index + 1]) inputRefs.value[index + 1].focus();
			});
		};
		const handleFocus = (index) => {
			activeIndex.value = index;
			nextTick(() => {
				if (inputRefs.value[index]) inputRefs.value[index].select();
			});
		};
		const handleBlur = (index) => {
			activeIndex.value = -1;
		};
		const clearAll = () => {
			verificationCodes.value = [
				"",
				"",
				"",
				"",
				"",
				""
			];
			hasError.value = false;
			const _value = verificationCodes.value.join("");
			emit("onChange", _value);
			nextTick(() => {
				if (inputRefs.value[0]) inputRefs.value[0].focus();
			});
		};
		const clear = () => {
			clearAll();
		};
		const setError = (error = true) => {
			hasError.value = error;
		};
		onMounted(() => {
			inputRefs.value.forEach((input) => {
				if (input) input.addEventListener("paste", handlePaste);
			});
			nextTick(() => {
				if (inputRefs.value[0]) inputRefs.value[0].focus();
			});
		});
		onUnmounted(() => {
			inputRefs.value.forEach((input) => {
				if (input) input.removeEventListener("paste", handlePaste);
			});
		});
		__expose({
			clear,
			clearAll,
			setError
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[2] || (_cache[2] = createStaticVNode("<div class=\"otp-header\" data-v-e565f495><div class=\"otp-icon\" data-v-e565f495><svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" data-v-e565f495><path d=\"M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" data-v-e565f495></path><path d=\"M9 12L11 14L15 10\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" data-v-e565f495></path></svg></div><h3 class=\"otp-title\" data-v-e565f495>请输入验证码</h3><p class=\"otp-description\" data-v-e565f495>请输入您收到的6位数字验证码</p></div>", 1)),
				createBaseVNode("form", _hoisted_2, [createBaseVNode("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(verificationCodes.value, (code, index) => {
					return withDirectives((openBlock(), createElementBlock("input", {
						key: index,
						ref_for: true,
						ref: (el) => inputRefs.value[index] = el,
						"onUpdate:modelValue": ($event) => verificationCodes.value[index] = $event,
						disabled: props.disabled,
						maxlength: "1",
						class: normalizeClass(["modern-otp-input", {
							active: activeIndex.value === index,
							filled: verificationCodes.value[index],
							error: hasError.value,
							disabled: props.disabled
						}]),
						type: "text",
						inputmode: "numeric",
						onInput: ($event) => handleInput(index, $event),
						pattern: "[0-9]*",
						onKeydown: ($event) => handleKeyDown(index, $event),
						autocomplete: "one-time-code",
						onFocus: ($event) => handleFocus(index),
						onBlur: ($event) => handleBlur(index)
					}, null, 42, _hoisted_4)), [[vModelText, verificationCodes.value[index]]]);
				}), 128))])]),
				createBaseVNode("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [createBaseVNode("button", {
					type: "button",
					class: "clear-button",
					disabled: !hasValue.value || props.disabled,
					onClick: clearAll
				}, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg"
				}, [createBaseVNode("path", {
					d: "M3 6H5H21",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}), createBaseVNode("path", {
					d: "M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), createTextVNode(" 清空 ", -1)])], 8, _hoisted_7), _cache[1] || (_cache[1] = createBaseVNode("div", { class: "paste-hint" }, [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg"
				}, [createBaseVNode("path", {
					d: "M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}), createBaseVNode("rect", {
					x: "8",
					y: "2",
					width: "8",
					height: "4",
					rx: "1",
					ry: "1",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})]), createTextVNode(" 支持粘贴验证码 ")], -1))])])
			]);
		};
	}
}, [["__scopeId", "data-v-e565f495"]]);
//#endregion
//#region ../../packages/ui/src/components/ReCode/index.ts
var plugin = { install(app) {
	app.component("ReCode", ReCode_default$1);
} };
var ReCode_default = ReCode_default$1;
//#endregion
export { ReCode_default as default, plugin as install };
