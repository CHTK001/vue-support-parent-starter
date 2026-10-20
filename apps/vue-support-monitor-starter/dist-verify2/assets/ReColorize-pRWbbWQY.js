import { D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { I as delete_default, U as download_default, dt as loading_default, rn as upload_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElUpload } from "./upload-CGPttwA9.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReColorize/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-colorize" };
var _hoisted_2 = { class: "re-colorize__upload" };
var _hoisted_3 = {
	key: 0,
	class: "re-colorize__loading"
};
var _hoisted_4 = {
	key: 1,
	class: "re-colorize__result"
};
var _hoisted_5 = { class: "re-colorize__compare" };
var _hoisted_6 = ["src"];
var _hoisted_7 = ["src"];
var _hoisted_8 = { class: "re-colorize__actions" };
//#endregion
//#region ../../packages/ui/src/components/ReColorize/index.vue
var ReColorize_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		baseUrl: { default: "/v2/ai/colorize" },
		headers: {}
	},
	setup(__props) {
		const props = __props;
		const generating = ref(false);
		const originalImage = ref("");
		const result = ref("");
		const uploadUrl = computed(() => `${props.baseUrl}/upload`);
		const handleUploadSuccess = (response) => {
			if (response.code === 200) {
				originalImage.value = response.data.original;
				result.value = response.data.result;
			} else message.error(response.message || "上色失败");
		};
		const handleUploadError = () => message.error("上传失败");
		const handleDownload = () => {
			if (!result.value) return;
			const a = document.createElement("a");
			a.href = result.value;
			a.download = "colorized.png";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		};
		const reset = () => {
			originalImage.value = "";
			result.value = "";
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createVNode(unref(ElUpload), {
					action: uploadUrl.value,
					headers: __props.headers,
					"on-success": handleUploadSuccess,
					"on-error": handleUploadError,
					"show-file-list": false,
					accept: "image/*",
					drag: ""
				}, {
					default: withCtx(() => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(upload_default))]),
						_: 1
					}), _cache[0] || (_cache[0] = createBaseVNode("div", null, "点击或拖拽上传图片", -1))]),
					_: 1
				}, 8, ["action", "headers"])]),
				generating.value ? (openBlock(), createElementBlock("div", _hoisted_3, [createVNode(unref(ElIcon), { class: "is-loading" }, {
					default: withCtx(() => [createVNode(unref(loading_default))]),
					_: 1
				}), _cache[1] || (_cache[1] = createBaseVNode("span", null, "上色中...", -1))])) : createCommentVNode("", true),
				result.value ? (openBlock(), createElementBlock("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [createBaseVNode("div", null, [createBaseVNode("img", {
					src: originalImage.value,
					alt: "原图"
				}, null, 8, _hoisted_6), _cache[2] || (_cache[2] = createBaseVNode("span", null, "原图", -1))]), createBaseVNode("div", null, [createBaseVNode("img", {
					src: result.value,
					alt: "上色结果"
				}, null, 8, _hoisted_7), _cache[3] || (_cache[3] = createBaseVNode("span", null, "结果", -1))])]), createBaseVNode("div", _hoisted_8, [createVNode(unref(ElButton), { onClick: handleDownload }, {
					default: withCtx(() => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(download_default))]),
						_: 1
					}), _cache[4] || (_cache[4] = createTextVNode("下载", -1))]),
					_: 1
				}), createVNode(unref(ElButton), { onClick: reset }, {
					default: withCtx(() => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(delete_default))]),
						_: 1
					}), _cache[5] || (_cache[5] = createTextVNode("清除", -1))]),
					_: 1
				})])])) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-b56a32b7"]]);
//#endregion
//#region ../../packages/ui/src/components/ReColorize/index.ts
var plugin = { install(app) {
	app.component("ReColorize", ReColorize_default$1);
} };
var ReColorize_default = ReColorize_default$1;
//#endregion
export { ReColorize_default as default, plugin as install };
