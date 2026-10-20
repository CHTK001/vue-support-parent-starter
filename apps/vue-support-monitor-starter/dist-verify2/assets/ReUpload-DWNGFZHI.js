import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, vn as ref, w as createSlots, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Et as plus_default, in as upload_filled_default, rn as upload_default } from "./dist-DogtK295.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/ui/src/components/ReUpload/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-upload__image-trigger" };
var _hoisted_2 = { class: "re-upload__image-text" };
var _hoisted_3 = { class: "re-upload__drag-content" };
var _hoisted_4 = { class: "re-upload__drag-text" };
var _hoisted_5 = { class: "re-upload__drag-hint" };
var _hoisted_6 = { class: "re-upload__tip" };
var _hoisted_7 = ["src"];
//#endregion
//#region ../../packages/ui/src/components/ReUpload/index.vue
var ReUpload_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		modelValue: { default: () => [] },
		action: {},
		headers: {},
		data: {},
		name: { default: "file" },
		accept: { default: "" },
		type: { default: "default" },
		drag: {
			type: Boolean,
			default: false
		},
		multiple: {
			type: Boolean,
			default: false
		},
		listType: { default: "text" },
		showFileList: {
			type: Boolean,
			default: true
		},
		limit: { default: void 0 },
		maxSize: { default: 10 },
		triggerText: { default: "点击上传" },
		dragText: { default: "将文件拖到此处，或点击上传" },
		dragHint: { default: "支持单个或批量上传" },
		tipText: { default: "" },
		disabled: { type: Boolean },
		responseUrlPath: { default: "data.url" },
		fileName: { default: "" }
	},
	emits: [
		"update:modelValue",
		"change",
		"success",
		"error",
		"exceed",
		"remove"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReUpload —— 通用上传组件
		*
		* 基于 Element Plus Upload，支持拖拽/图片列表/多文件/限制
		*   <ReUpload v-model="files" :action="'/api/upload'" :type="'image'" />
		*/
		const props = __props;
		const emit = __emit;
		const previewVisible = ref(false);
		const previewUrl = ref("");
		const previewTitle = ref("");
		const fileList = computed({
			get: () => props.modelValue,
			set: (val) => {
				emit("update:modelValue", val);
				emit("change", val);
			}
		});
		const extractUrl = (obj) => {
			if (typeof obj === "string") return obj;
			if (!obj || typeof obj !== "object") return "";
			const path = props.responseUrlPath.split(".");
			let current = obj;
			for (const key of path) if (current && typeof current === "object" && key in current) current = current[key];
			else return "";
			return typeof current === "string" ? current : "";
		};
		const handleBeforeUpload = (file) => {
			if (file.size > props.maxSize * 1024 * 1024) {
				message.error(`文件大小不能超过 ${props.maxSize}MB`);
				return false;
			}
			return true;
		};
		const handleSuccess = (response, file) => {
			const url = extractUrl(response);
			if (url) file.url = url;
			emit("success", response, file, fileList.value);
			emit("update:modelValue", fileList.value);
			emit("change", fileList.value);
		};
		const handleError = (err, file) => {
			emit("error", err, file);
			message.error(`${file.name} 上传失败`);
		};
		const handleExceed = (files) => {
			emit("exceed", files, fileList.value);
			message.warning(`文件数量超出限制`);
		};
		const handleRemove = (file, list) => {
			emit("remove", file, list);
			emit("update:modelValue", list);
			emit("change", list);
		};
		const handlePreview = (file) => {
			if (props.type === "image" || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name)) {
				previewUrl.value = file.url;
				previewTitle.value = file.name;
				previewVisible.value = true;
			} else window.open(file.url);
		};
		watch(() => props.modelValue, (val) => {
			if (val !== fileList.value) fileList.value = val;
		}, { deep: true });
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_upload = resolveComponent("el-upload");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-upload", [`re-upload--${__props.type}`, { "is-disabled": __props.disabled }]]) }, [createVNode(_component_el_upload, mergeProps({
				action: __props.action,
				headers: __props.headers,
				data: __props.data,
				name: __props.name,
				multiple: __props.multiple,
				accept: __props.accept,
				drag: __props.drag,
				"list-type": __props.listType,
				"show-file-list": __props.showFileList,
				limit: __props.limit,
				"before-upload": handleBeforeUpload,
				"on-success": handleSuccess,
				"on-error": handleError,
				"on-exceed": handleExceed,
				"on-remove": handleRemove,
				"on-preview": handlePreview,
				disabled: __props.disabled,
				"file-list": fileList.value
			}, _ctx.$attrs), createSlots({ _: 2 }, [__props.type === "image" && !__props.drag ? {
				name: "default",
				fn: withCtx(() => [createBaseVNode("div", _hoisted_1, [createVNode(_component_el_icon, { class: "re-upload__image-icon" }, {
					default: withCtx(() => [createVNode(unref(plus_default))]),
					_: 1
				}), createBaseVNode("span", _hoisted_2, toDisplayString(__props.triggerText), 1)])]),
				key: "0"
			} : __props.drag ? {
				name: "default",
				fn: withCtx(() => [createBaseVNode("div", _hoisted_3, [
					createVNode(_component_el_icon, { class: "re-upload__drag-icon" }, {
						default: withCtx(() => [createVNode(unref(upload_filled_default))]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_4, toDisplayString(__props.dragText), 1),
					createBaseVNode("div", _hoisted_5, toDisplayString(__props.dragHint), 1)
				])]),
				key: "1"
			} : {
				name: "default",
				fn: withCtx(() => [createVNode(_component_el_button, { disabled: __props.disabled }, {
					default: withCtx(() => [createVNode(_component_el_icon, { style: { "margin-right": "4px" } }, {
						default: withCtx(() => [createVNode(unref(upload_default))]),
						_: 1
					}), createTextVNode(" " + toDisplayString(__props.triggerText), 1)]),
					_: 1
				}, 8, ["disabled"])]),
				key: "2"
			}, __props.type === "image" && !__props.drag ? {
				name: "tip",
				fn: withCtx(() => [createBaseVNode("div", _hoisted_6, toDisplayString(__props.tipText), 1)]),
				key: "3"
			} : void 0]), 1040, [
				"action",
				"headers",
				"data",
				"name",
				"multiple",
				"accept",
				"drag",
				"list-type",
				"show-file-list",
				"limit",
				"disabled",
				"file-list"
			]), createVNode(unref(component), {
				modelValue: previewVisible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => previewVisible.value = $event),
				title: previewTitle.value,
				width: "600px",
				"append-to-body": ""
			}, {
				default: withCtx(() => [previewUrl.value ? (openBlock(), createElementBlock("img", {
					key: 0,
					src: previewUrl.value,
					class: "re-upload__preview-img"
				}, null, 8, _hoisted_7)) : createCommentVNode("", true)]),
				_: 1
			}, 8, ["modelValue", "title"])], 2);
		};
	}
}), [["__scopeId", "data-v-bcac8084"]]);
//#endregion
//#region ../../packages/ui/src/components/ReUpload/index.ts
var plugin = { install(app) {
	app.component("ReUpload", ReUpload_default$1);
} };
var ReUpload_default = ReUpload_default$1;
//#endregion
export { ReUpload_default as default, plugin as install };
