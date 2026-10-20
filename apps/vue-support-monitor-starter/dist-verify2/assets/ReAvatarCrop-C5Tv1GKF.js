import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { t as ReCropper_default } from "./ReCropper-DzzyKGce.js";
//#region ../../packages/ui/src/components/ReAvatarCrop/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-avatar-crop__trigger" };
var _hoisted_2 = {
	key: 0,
	class: "re-avatar-crop__preview"
};
var _hoisted_3 = ["src", "alt"];
var _hoisted_4 = { class: "re-avatar-crop__mask" };
var _hoisted_5 = { class: "re-avatar-crop__text" };
var _hoisted_6 = {
	key: 1,
	class: "re-avatar-crop__placeholder"
};
var _hoisted_7 = { class: "re-avatar-crop__text" };
var _hoisted_8 = { class: "re-avatar-crop__wrap" };
var _hoisted_9 = { class: "re-avatar-crop__footer" };
var _hoisted_10 = { class: "re-avatar-crop__hint" };
var _hoisted_11 = { class: "re-avatar-crop__actions" };
//#endregion
//#region ../../packages/ui/src/components/ReAvatarCrop/index.vue
var ReAvatarCrop_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		modelValue: {},
		action: {},
		headers: {},
		data: {},
		name: { default: "file" },
		accept: { default: "image/*" },
		aspectRatio: { default: 1 },
		compress: { default: .92 },
		outputType: { default: "image/jpeg" },
		fileName: { default: "avatar.jpg" },
		triggerText: { default: "上传头像" },
		dialogTitle: { default: "裁剪头像" },
		hintText: { default: "拖动图片调整位置，滚轮缩放" },
		cancelText: { default: "取消" },
		confirmText: { default: "确定上传" },
		alt: {},
		disabled: { type: Boolean },
		maxSize: { default: 5 },
		responseUrlPath: { default: "data.url" }
	},
	emits: [
		"update:modelValue",
		"change",
		"success",
		"error",
		"crop"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReAvatarCrop —— 头像裁剪上传组件
		*
		* 基于 Element Plus Upload + ReCropper，支持裁剪后上传/预览
		*   <ReAvatarCrop v-model="avatar" :action="'/api/upload'" />
		*/
		const props = __props;
		const emit = __emit;
		const dialogVisible = ref(false);
		const sourceUrl = ref("");
		const cropperRef = ref(null);
		const uploading = ref(false);
		const handleBeforeUpload = (file) => {
			if (file.size > props.maxSize * 1024 * 1024) {
				message.error(`文件大小不能超过 ${props.maxSize}MB`);
				return false;
			}
			const reader = new FileReader();
			reader.onload = (e) => {
				sourceUrl.value = e.target?.result;
				dialogVisible.value = true;
			};
			reader.readAsDataURL(file);
			return false;
		};
		const handleCancel = () => {
			dialogVisible.value = false;
			sourceUrl.value = "";
		};
		const handleConfirm = async () => {
			if (!cropperRef.value) return;
			cropperRef.value.getCropFile(async (blob) => {
				emit("crop", blob);
				uploading.value = true;
				try {
					const formData = new FormData();
					const file = new File([blob], props.fileName, { type: props.outputType });
					formData.append(props.name, file);
					if (props.data) Object.entries(props.data).forEach(([key, value]) => {
						formData.append(key, String(value));
					});
					const response = await fetch(props.action, {
						method: "POST",
						headers: props.headers ?? {},
						body: formData
					});
					if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
					const result = await response.json();
					const url = extractUrl(result);
					emit("update:modelValue", url);
					emit("change", url);
					emit("success", result, url);
					dialogVisible.value = false;
					sourceUrl.value = "";
				} catch (err) {
					emit("error", err);
					message.error("上传失败");
				} finally {
					uploading.value = false;
				}
			}, props.outputType);
		};
		const extractUrl = (obj) => {
			if (typeof obj === "string") return obj;
			if (!obj || typeof obj !== "object") return "";
			const path = props.responseUrlPath.split(".");
			let current = obj;
			for (const key of path) if (current && typeof current === "object" && key in current) current = current[key];
			else return "";
			return typeof current === "string" ? current : "";
		};
		const handleUploadSuccess = (response) => {
			const url = extractUrl(response);
			if (url) {
				emit("update:modelValue", url);
				emit("change", url);
				emit("success", response, url);
			}
		};
		const handleUploadError = (err) => {
			emit("error", err);
			message.error("上传失败");
		};
		return (_ctx, _cache) => {
			const _component_el_upload = resolveComponent("el-upload");
			const _component_el_button = resolveComponent("el-button");
			return openBlock(), createElementBlock(Fragment, null, [createVNode(_component_el_upload, {
				class: normalizeClass(["re-avatar-crop", { "is-disabled": __props.disabled }]),
				action: __props.action,
				headers: __props.headers,
				data: __props.data,
				name: __props.name,
				"show-file-list": false,
				accept: __props.accept,
				"before-upload": handleBeforeUpload,
				"on-success": handleUploadSuccess,
				"on-error": handleUploadError,
				disabled: __props.disabled
			}, {
				default: withCtx(() => [createBaseVNode("div", _hoisted_1, [renderSlot(_ctx.$slots, "default", { url: __props.modelValue }, () => [__props.modelValue ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("img", {
					src: __props.modelValue,
					alt: __props.alt
				}, null, 8, _hoisted_3), createBaseVNode("div", _hoisted_4, [_cache[1] || (_cache[1] = createBaseVNode("span", { class: "re-avatar-crop__icon" }, [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [
					createBaseVNode("path", {
						d: "M3 7h4l2-3h6l2 3h4v13H3V7z",
						"stroke-linejoin": "round"
					}),
					createBaseVNode("circle", {
						cx: "12",
						cy: "13",
						r: "4"
					}),
					createBaseVNode("path", {
						d: "M9.5 13.5l2 2 3.5-3.5",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					})
				])], -1)), createBaseVNode("span", _hoisted_5, toDisplayString(__props.triggerText), 1)])])) : (openBlock(), createElementBlock("div", _hoisted_6, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "re-avatar-crop__icon" }, [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [
					createBaseVNode("path", {
						d: "M3 7h4l2-3h6l2 3h4v13H3V7z",
						"stroke-linejoin": "round"
					}),
					createBaseVNode("circle", {
						cx: "12",
						cy: "13",
						r: "4"
					}),
					createBaseVNode("path", {
						d: "M9.5 13.5l2 2 3.5-3.5",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					})
				])], -1)), createBaseVNode("span", _hoisted_7, toDisplayString(__props.triggerText), 1)]))], true)])]),
				_: 3
			}, 8, [
				"class",
				"action",
				"headers",
				"data",
				"name",
				"accept",
				"disabled"
			]), createVNode(unref(component), {
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => dialogVisible.value = $event),
				title: __props.dialogTitle,
				width: "640px",
				"close-on-click-modal": false,
				"close-on-press-escape": false,
				"append-to-body": "",
				"destroy-on-close": "",
				class: "re-avatar-crop__dialog"
			}, {
				footer: withCtx(() => [createBaseVNode("div", _hoisted_9, [createBaseVNode("span", _hoisted_10, toDisplayString(__props.hintText), 1), createBaseVNode("div", _hoisted_11, [createVNode(_component_el_button, { onClick: handleCancel }, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.cancelText), 1)]),
					_: 1
				}), createVNode(_component_el_button, {
					type: "primary",
					loading: uploading.value,
					onClick: handleConfirm
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.confirmText), 1)]),
					_: 1
				}, 8, ["loading"])])])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_8, [dialogVisible.value ? (openBlock(), createBlock(ReCropper_default, {
					key: 0,
					ref_key: "cropperRef",
					ref: cropperRef,
					src: sourceUrl.value,
					compress: __props.compress,
					"aspect-ratio": __props.aspectRatio
				}, null, 8, [
					"src",
					"compress",
					"aspect-ratio"
				])) : createCommentVNode("", true)])]),
				_: 1
			}, 8, ["modelValue", "title"])], 64);
		};
	}
}), [["__scopeId", "data-v-ad8a922d"]]);
//#endregion
//#region ../../packages/ui/src/components/ReAvatarCrop/index.ts
var plugin = { install(app) {
	app.component("ReAvatarCrop", ReAvatarCrop_default$1);
} };
var ReAvatarCrop_default = ReAvatarCrop_default$1;
//#endregion
export { ReAvatarCrop_default as default, plugin as install };
