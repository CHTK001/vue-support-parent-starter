import { Ht as watch, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReTypeIt/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { key: 0 };
var _hoisted_2 = ["innerHTML"];
var _hoisted_3 = ["innerHTML"];
//#endregion
//#region ../../packages/ui/src/components/ReTypeIt/index.vue
var ReTypeIt_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		strings: { default: () => [] },
		text: {},
		speed: { default: 80 },
		deleteSpeed: { default: 50 },
		pause: { default: 1500 },
		loop: {
			type: Boolean,
			default: false
		},
		html: {
			type: Boolean,
			default: false
		},
		tag: { default: "span" },
		cursorChar: { default: "|" },
		cursor: {
			type: Boolean,
			default: true
		},
		autoplay: {
			type: Boolean,
			default: true
		},
		startDelay: { default: 0 },
		startIndex: { default: 0 },
		preDelete: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"start",
		"typed",
		"completed",
		"loop"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReTypeIt —— 打字机效果组件
		*
		* 自实现，无依赖。支持逐字/逐词打印、循环、删除、回调
		*   <ReTypeIt :strings="['Hello', 'World']" :loop="true" />
		*/
		const props = __props;
		const emit = __emit;
		const root = ref(null);
		const displayed = ref("");
		const displayedHtml = ref("");
		const status = ref("idle");
		let timer = null;
		let started = false;
		let currentStringIndex = 0;
		let currentCharIndex = 0;
		const queue = computed(() => {
			return props.text ? [props.text] : props.strings;
		});
		const cursorStyle = computed(() => ({ animation: "re-typeit-blink 1s step-start infinite" }));
		const clearTimer = () => {
			if (timer !== null) {
				window.clearTimeout(timer);
				timer = null;
			}
		};
		const schedule = (cb, delay) => {
			clearTimer();
			timer = window.setTimeout(cb, delay);
		};
		const updateDisplay = (str) => {
			if (props.html) displayedHtml.value = str;
			else displayed.value = str;
		};
		const typeNextChar = () => {
			const current = queue.value[currentStringIndex];
			if (!current) {
				finishOrLoop();
				return;
			}
			if (currentCharIndex < current.length) {
				const ch = current[currentCharIndex];
				const next = (props.html ? displayedHtml.value : displayed.value) + ch;
				updateDisplay(next);
				currentCharIndex++;
				emit("typed", ch, currentCharIndex);
				schedule(typeNextChar, props.speed);
			} else {
				if (status.value === "idle") emit("start");
				status.value = "pausing";
				schedule(() => {
					if (props.preDelete) startDelete();
					else nextString();
				}, props.pause);
			}
		};
		const startDelete = () => {
			status.value = "deleting";
			const deleteStep = () => {
				const current = props.html ? displayedHtml.value : displayed.value;
				if (current.length > 0) {
					updateDisplay(current.slice(0, -1));
					schedule(deleteStep, props.deleteSpeed);
				} else nextString();
			};
			schedule(deleteStep, props.deleteSpeed);
		};
		const nextString = () => {
			currentStringIndex++;
			if (currentStringIndex >= queue.value.length) if (props.loop) {
				currentStringIndex = 0;
				currentCharIndex = 0;
				emit("loop");
				schedule(typeNextChar, props.speed);
			} else {
				status.value = "done";
				emit("completed");
			}
			else {
				currentCharIndex = 0;
				schedule(typeNextChar, props.speed);
			}
		};
		const finishOrLoop = () => {
			if (props.loop) {
				currentStringIndex = 0;
				currentCharIndex = 0;
				emit("loop");
				schedule(typeNextChar, props.speed);
			} else {
				status.value = "done";
				emit("completed");
			}
		};
		const start = () => {
			if (started) return;
			started = true;
			currentStringIndex = props.startIndex;
			currentCharIndex = 0;
			status.value = "typing";
			updateDisplay("");
			schedule(typeNextChar, props.startDelay);
		};
		const stop = () => {
			clearTimer();
			started = false;
			status.value = "done";
		};
		watch(() => [props.text, props.strings], () => {
			stop();
			if (props.autoplay) start();
		}, { deep: true });
		onMounted(() => {
			if (props.autoplay) start();
		});
		onBeforeUnmount(() => {
			clearTimer();
		});
		__expose({
			start,
			stop
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
				ref_key: "root",
				ref: root,
				class: "re-typeit"
			}, {
				default: withCtx(() => [!__props.html ? (openBlock(), createElementBlock("span", _hoisted_1, [createBaseVNode("span", null, toDisplayString(displayed.value), 1), __props.cursor && status.value !== "done" ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: "re-typeit__cursor",
					style: normalizeStyle(cursorStyle.value)
				}, toDisplayString(__props.cursorChar), 5)) : createCommentVNode("", true)])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("span", { innerHTML: displayedHtml.value }, null, 8, _hoisted_2), __props.cursor && status.value !== "done" ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: "re-typeit__cursor",
					style: normalizeStyle(cursorStyle.value),
					innerHTML: __props.cursorChar
				}, null, 12, _hoisted_3)) : createCommentVNode("", true)], 64))]),
				_: 1
			}, 512);
		};
	}
}), [["__scopeId", "data-v-7554c0f6"]]);
//#endregion
//#region ../../packages/ui/src/components/ReTypeIt/index.ts
var plugin = { install(app) {
	app.component("ReTypeIt", ReTypeIt_default$1);
} };
var ReTypeIt_default = ReTypeIt_default$1;
//#endregion
export { ReTypeIt_default as default, plugin as install };
