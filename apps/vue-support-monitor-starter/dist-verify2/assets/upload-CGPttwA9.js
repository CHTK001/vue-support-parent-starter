import { $n as normalizeClass, An as NOOP, Bn as isFunction, D as createVNode, Ht as watch, J as inject, Jn as isString, On as unref, Rn as isArray, Wn as isPlainObject, _ as createBaseVNode, b as createElementBlock, bt as renderList, et as mergeProps, g as computed, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, w as createSlots, wn as toRef, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, n as TransitionGroup, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { n as flatten } from "./_flatRest-CP5Zoeqo.js";
import { t as cloneDeep } from "./cloneDeep-BJ4zGpri.js";
import { _ as isNil, a as throwError, c as definePropType, i as debugWarn, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { t as entriesOf } from "./objects-BYkkqs6t.js";
import { g as useVModel } from "./dist-Clzx2YUA.js";
import { t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { I as delete_default, V as document_default, _ as check_default, mn as zoom_in_default, v as circle_check_default, w as close_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as mutable } from "./typescript-CMUKtCBO.js";
import { t as ElProgress } from "./progress-BYZHa216.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/ajax.mjs
var SCOPE$1 = "ElUpload";
var UploadAjaxError = class extends Error {
	constructor(message, status, method, url) {
		super(message);
		this.name = "UploadAjaxError";
		this.status = status;
		this.method = method;
		this.url = url;
	}
};
function getError(action, option, xhr) {
	let msg;
	if (xhr.response) msg = `${xhr.response.error || xhr.response}`;
	else if (xhr.responseText) msg = `${xhr.responseText}`;
	else msg = `fail to ${option.method} ${action} ${xhr.status}`;
	return new UploadAjaxError(msg, xhr.status, option.method, action);
}
function getBody(xhr) {
	const text = xhr.responseText || xhr.response;
	if (!text) return text;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
var ajaxUpload = (option) => {
	if (typeof XMLHttpRequest === "undefined") throwError(SCOPE$1, "XMLHttpRequest is undefined");
	const xhr = new XMLHttpRequest();
	const action = option.action;
	if (xhr.upload) xhr.upload.addEventListener("progress", (evt) => {
		const progressEvt = evt;
		progressEvt.percent = evt.total > 0 ? evt.loaded / evt.total * 100 : 0;
		option.onProgress(progressEvt);
	});
	const formData = new FormData();
	if (option.data) for (const [key, value] of Object.entries(option.data)) if (isArray(value)) if (value.length === 2 && value[0] instanceof Blob && isString(value[1])) formData.append(key, value[0], value[1]);
	else value.forEach((item) => {
		formData.append(key, item);
	});
	else formData.append(key, value);
	formData.append(option.filename, option.file, option.file.name);
	xhr.addEventListener("error", () => {
		option.onError(getError(action, option, xhr));
	});
	xhr.addEventListener("load", () => {
		if (xhr.status < 200 || xhr.status >= 300) return option.onError(getError(action, option, xhr));
		option.onSuccess(getBody(xhr));
	});
	xhr.open(option.method, action, true);
	if (option.withCredentials && "withCredentials" in xhr) xhr.withCredentials = true;
	const headers = option.headers || {};
	if (headers instanceof Headers) headers.forEach((value, key) => xhr.setRequestHeader(key, value));
	else for (const [key, value] of Object.entries(headers)) {
		if (isNil(value)) continue;
		xhr.setRequestHeader(key, String(value));
	}
	xhr.send(formData);
	return xhr;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload.mjs
/**
* @deprecated Removed after 3.0.0, Use `UploadProps` instead.
*/
var uploadListTypes = [
	"text",
	"picture",
	"picture-card"
];
var fileId = 1;
var genFileId = () => Date.now() + fileId++;
/**
* @deprecated Removed after 3.0.0, Use `UploadBaseProps` instead.
*/
var uploadBaseProps = buildProps({
	/**
	* @description request URL
	*/
	action: {
		type: String,
		default: "#"
	},
	/**
	* @description request headers
	*/
	headers: { type: definePropType(Object) },
	/**
	* @description set upload request method
	*/
	method: {
		type: String,
		default: "post"
	},
	/**
	* @description additions options of request
	*/
	data: {
		type: definePropType([
			Object,
			Function,
			Promise
		]),
		default: () => mutable({})
	},
	/**
	* @description whether uploading multiple files is permitted
	*/
	multiple: Boolean,
	/**
	* @description key name for uploaded file
	*/
	name: {
		type: String,
		default: "file"
	},
	/**
	* @description whether to activate drag and drop mode
	*/
	drag: Boolean,
	/**
	* @description whether cookies are sent
	*/
	withCredentials: Boolean,
	/**
	* @description whether to show the uploaded file list
	*/
	showFileList: {
		type: Boolean,
		default: true
	},
	/**
	* @description accepted [file types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept), will not work when `thumbnail-mode === true`
	*/
	accept: {
		type: String,
		default: ""
	},
	/**
	* @description default uploaded files
	*/
	fileList: {
		type: definePropType(Array),
		default: () => mutable([])
	},
	/**
	* @description whether to auto upload file
	*/
	autoUpload: {
		type: Boolean,
		default: true
	},
	/**
	* @description type of file list
	*/
	listType: {
		type: String,
		values: uploadListTypes,
		default: "text"
	},
	/**
	* @description override default xhr behavior, allowing you to implement your own upload-file's request
	*/
	httpRequest: {
		type: definePropType(Function),
		default: ajaxUpload
	},
	/**
	* @description whether to disable upload
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description maximum number of uploads allowed
	*/
	limit: Number,
	/**
	* @description whether to support uploading directory
	*/
	directory: Boolean
});
/**
* @deprecated Removed after 3.0.0, Use `UploadProps` instead.
*/
var uploadProps = buildProps({
	...uploadBaseProps,
	/**
	* @description hook function before uploading with the file to be uploaded as its parameter. If `false` is returned or a `Promise` is returned and then is rejected, uploading will be aborted
	*/
	beforeUpload: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function before removing a file with the file and file list as its parameters. If `false` is returned or a `Promise` is returned and then is rejected, removing will be aborted
	*/
	beforeRemove: { type: definePropType(Function) },
	/**
	* @description hook function when files are removed
	*/
	onRemove: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function when select file or upload file success or upload file fail
	*/
	onChange: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function when clicking the uploaded files
	*/
	onPreview: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function when uploaded successfully
	*/
	onSuccess: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function when some progress occurs
	*/
	onProgress: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function when some errors occurs
	*/
	onError: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description hook function when limit is exceeded
	*/
	onExceed: {
		type: definePropType(Function),
		default: NOOP
	},
	/**
	* @description set HTML attribute: crossorigin.
	*/
	crossorigin: { type: definePropType(String) }
});
var uploadBasePropsDefaults = {
	action: "#",
	method: "post",
	data: () => mutable({}),
	name: "file",
	showFileList: true,
	accept: "",
	fileList: () => mutable([]),
	autoUpload: true,
	listType: "text",
	httpRequest: ajaxUpload,
	disabled: void 0
};
({ ...uploadBasePropsDefaults });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/constants.mjs
var uploadContextKey = Symbol("uploadContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-list.mjs
/**
* @deprecated Removed after 3.0.0, Use `UploadListProps` instead.
*/
var uploadListProps = buildProps({
	files: {
		type: definePropType(Array),
		default: () => mutable([])
	},
	disabled: {
		type: Boolean,
		default: void 0
	},
	handlePreview: {
		type: definePropType(Function),
		default: NOOP
	},
	listType: {
		type: String,
		values: uploadListTypes,
		default: "text"
	},
	/**
	* @description set HTML attribute: crossorigin.
	*/
	crossorigin: { type: definePropType(String) }
});
var uploadListEmits = { remove: (file) => !!file };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-content.mjs
/**
* @deprecated Removed after 3.0.0, Use `UploadContentProps` instead.
*/
var uploadContentProps = buildProps({
	...uploadBaseProps,
	beforeUpload: {
		type: definePropType(Function),
		default: NOOP
	},
	onRemove: {
		type: definePropType(Function),
		default: NOOP
	},
	onStart: {
		type: definePropType(Function),
		default: NOOP
	},
	onSuccess: {
		type: definePropType(Function),
		default: NOOP
	},
	onProgress: {
		type: definePropType(Function),
		default: NOOP
	},
	onError: {
		type: definePropType(Function),
		default: NOOP
	},
	onExceed: {
		type: definePropType(Function),
		default: NOOP
	}
});
({ ...uploadBasePropsDefaults });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-dragger.mjs
/**
* @deprecated Removed after 3.0.0, Use `UploadDraggerProps` instead.
*/
var uploadDraggerProps = buildProps({
	disabled: {
		type: Boolean,
		default: void 0
	},
	directory: Boolean
});
var uploadDraggerEmits = { file: (file) => isArray(file) };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-list.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = [
	"tabindex",
	"aria-disabled",
	"onKeydown"
];
var _hoisted_2$1 = ["src", "crossorigin"];
var _hoisted_3 = ["onClick"];
var _hoisted_4 = ["title"];
var _hoisted_5 = ["onClick"];
var _hoisted_6 = ["onClick"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-list2.mjs
var upload_list_default = /* @__PURE__ */ defineComponent({
	name: "ElUploadList",
	__name: "upload-list",
	props: uploadListProps,
	emits: uploadListEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { t } = useLocale();
		const nsUpload = useNamespace("upload");
		const nsIcon = useNamespace("icon");
		const nsList = useNamespace("list");
		const disabled = useFormDisabled();
		const focusing = ref(false);
		const containerKls = computed(() => [
			nsUpload.b("list"),
			nsUpload.bm("list", props.listType),
			nsUpload.is("disabled", disabled.value)
		]);
		const handleRemove = (file) => {
			emit("remove", file);
		};
		return (_ctx, _cache) => {
			return openBlock(), createBlock(TransitionGroup, {
				tag: "ul",
				class: normalizeClass(containerKls.value),
				name: unref(nsList).b()
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.files, (file, index) => {
					return openBlock(), createElementBlock("li", {
						key: file.uid || file.name,
						class: normalizeClass([
							unref(nsUpload).be("list", "item"),
							unref(nsUpload).is(file.status),
							{ focusing: focusing.value }
						]),
						tabindex: unref(disabled) ? void 0 : 0,
						"aria-disabled": unref(disabled),
						role: "button",
						onKeydown: withKeys(($event) => !unref(disabled) && handleRemove(file), ["delete"]),
						onFocus: _cache[0] || (_cache[0] = ($event) => focusing.value = true),
						onBlur: _cache[1] || (_cache[1] = ($event) => focusing.value = false),
						onClick: _cache[2] || (_cache[2] = ($event) => focusing.value = false)
					}, [renderSlot(_ctx.$slots, "default", {
						file,
						index
					}, () => [
						__props.listType === "picture" || file.status !== "uploading" && __props.listType === "picture-card" ? (openBlock(), createElementBlock("img", {
							key: 0,
							class: normalizeClass(unref(nsUpload).be("list", "item-thumbnail")),
							src: file.url,
							crossorigin: __props.crossorigin,
							alt: ""
						}, null, 10, _hoisted_2$1)) : createCommentVNode("v-if", true),
						file.status === "uploading" || __props.listType !== "picture-card" ? (openBlock(), createElementBlock("div", {
							key: 1,
							class: normalizeClass(unref(nsUpload).be("list", "item-info"))
						}, [createBaseVNode("a", {
							class: normalizeClass(unref(nsUpload).be("list", "item-name")),
							onClick: withModifiers(($event) => __props.handlePreview(file), ["prevent"])
						}, [createVNode(unref(ElIcon), { class: normalizeClass(unref(nsIcon).m("document")) }, {
							default: withCtx(() => [createVNode(unref(document_default))]),
							_: 1
						}, 8, ["class"]), createBaseVNode("span", {
							class: normalizeClass(unref(nsUpload).be("list", "item-file-name")),
							title: file.name
						}, toDisplayString(file.name), 11, _hoisted_4)], 10, _hoisted_3), file.status === "uploading" ? (openBlock(), createBlock(unref(ElProgress), {
							key: 0,
							type: __props.listType === "picture-card" ? "circle" : "line",
							"stroke-width": __props.listType === "picture-card" ? 6 : 2,
							percentage: Number(file.percentage),
							style: normalizeStyle(__props.listType === "picture-card" ? "" : "margin-top: 0.5rem")
						}, null, 8, [
							"type",
							"stroke-width",
							"percentage",
							"style"
						])) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true),
						createBaseVNode("label", { class: normalizeClass(unref(nsUpload).be("list", "item-status-label")) }, [__props.listType === "text" ? (openBlock(), createBlock(unref(ElIcon), {
							key: 0,
							class: normalizeClass([unref(nsIcon).m("upload-success"), unref(nsIcon).m("circle-check")])
						}, {
							default: withCtx(() => [createVNode(unref(circle_check_default))]),
							_: 1
						}, 8, ["class"])) : ["picture-card", "picture"].includes(__props.listType) ? (openBlock(), createBlock(unref(ElIcon), {
							key: 1,
							class: normalizeClass([unref(nsIcon).m("upload-success"), unref(nsIcon).m("check")])
						}, {
							default: withCtx(() => [createVNode(unref(check_default))]),
							_: 1
						}, 8, ["class"])) : createCommentVNode("v-if", true)], 2),
						!unref(disabled) ? (openBlock(), createBlock(unref(ElIcon), {
							key: 2,
							class: normalizeClass(unref(nsIcon).m("close")),
							"aria-label": unref(t)("el.upload.delete"),
							role: "button",
							tabindex: "0",
							onClick: ($event) => handleRemove(file),
							onKeydown: withKeys(withModifiers(($event) => handleRemove(file), ["prevent"]), ["enter", "space"])
						}, {
							default: withCtx(() => [createVNode(unref(close_default))]),
							_: 1
						}, 8, [
							"class",
							"aria-label",
							"onClick",
							"onKeydown"
						])) : createCommentVNode("v-if", true),
						!unref(disabled) ? (openBlock(), createElementBlock("i", {
							key: 3,
							class: normalizeClass(unref(nsIcon).m("close-tip"))
						}, toDisplayString(unref(t)("el.upload.deleteTip")), 3)) : createCommentVNode("v-if", true),
						__props.listType === "picture-card" ? (openBlock(), createElementBlock("span", {
							key: 4,
							class: normalizeClass(unref(nsUpload).be("list", "item-actions"))
						}, [createBaseVNode("span", {
							class: normalizeClass(unref(nsUpload).be("list", "item-preview")),
							onClick: ($event) => __props.handlePreview(file)
						}, [createVNode(unref(ElIcon), { class: normalizeClass(unref(nsIcon).m("zoom-in")) }, {
							default: withCtx(() => [createVNode(unref(zoom_in_default))]),
							_: 1
						}, 8, ["class"])], 10, _hoisted_5), !unref(disabled) ? (openBlock(), createElementBlock("span", {
							key: 0,
							class: normalizeClass(unref(nsUpload).be("list", "item-delete")),
							onClick: ($event) => handleRemove(file)
						}, [createVNode(unref(ElIcon), { class: normalizeClass(unref(nsIcon).m("delete")) }, {
							default: withCtx(() => [createVNode(unref(delete_default))]),
							_: 1
						}, 8, ["class"])], 10, _hoisted_6)) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true)
					])], 42, _hoisted_1$1);
				}), 128)), renderSlot(_ctx.$slots, "append")]),
				_: 3
			}, 8, ["class", "name"]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-dragger.vue_vue_type_script_setup_true_lang.mjs
var COMPONENT_NAME = "ElUploadDrag";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-dragger2.mjs
var upload_dragger_default = /* @__PURE__ */ defineComponent({
	name: COMPONENT_NAME,
	__name: "upload-dragger",
	props: uploadDraggerProps,
	emits: uploadDraggerEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		if (!inject(uploadContextKey)) throwError(COMPONENT_NAME, "usage: <el-upload><el-upload-dragger /></el-upload>");
		const ns = useNamespace("upload");
		const dragover = ref(false);
		const disabled = useFormDisabled();
		const getFile = (entry) => {
			return new Promise((resolve, reject) => entry.file(resolve, reject));
		};
		const getAllFiles = async (entry) => {
			try {
				if (entry.isFile) {
					const file = await getFile(entry);
					file.isDirectory = false;
					return [file];
				}
				if (entry.isDirectory) {
					const dirReader = entry.createReader();
					const getEntries = () => {
						return new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
					};
					const entries = [];
					let readEntries = await getEntries();
					/**
					* In Chromium-based browsers, readEntries() will only return the first 100 FileSystemEntry instances.
					* https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries#:~:text=In%20Chromium%2Dbased%20browsers%2C%20readEntries()%20will%20only%20return%20the%20first%20100%20FileSystemEntry%20instances.%20In%20order%20to%20obtain%20all%20of%20the%20instances%2C%20readEntries()%20must%20be%20called%20multiple%20times.
					*/
					while (readEntries.length > 0) {
						entries.push(...readEntries);
						readEntries = await getEntries();
					}
					const filePromises = entries.map((entry) => getAllFiles(entry).catch(() => []));
					return flatten(await Promise.all(filePromises));
				}
			} catch {
				return [];
			}
			return [];
		};
		const onDrop = async (e) => {
			if (disabled.value) return;
			dragover.value = false;
			e.stopPropagation();
			const files = Array.from(e.dataTransfer.files);
			const items = e.dataTransfer.items || [];
			if (props.directory) {
				const entries = Array.from(items).map((item) => item?.webkitGetAsEntry?.()).filter((entry) => entry);
				emit("file", flatten(await Promise.all(entries.map(getAllFiles))));
				return;
			}
			files.forEach((file, index) => {
				const entry = items[index]?.webkitGetAsEntry?.();
				if (entry) file.isDirectory = entry.isDirectory;
			});
			emit("file", files);
		};
		const onDragover = () => {
			if (!disabled.value) dragover.value = true;
		};
		const onDragleave = (e) => {
			if (!e.currentTarget.contains(e.relatedTarget)) dragover.value = false;
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([unref(ns).b("dragger"), unref(ns).is("dragover", dragover.value)]),
				onDrop: withModifiers(onDrop, ["prevent"]),
				onDragover: withModifiers(onDragover, ["prevent"]),
				onDragleave: withModifiers(onDragleave, ["prevent"])
			}, [renderSlot(_ctx.$slots, "default")], 34);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-content.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"tabindex",
	"aria-disabled",
	"onKeydown"
];
var _hoisted_2 = [
	"name",
	"disabled",
	"multiple",
	"accept",
	"webkitdirectory"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/upload-content2.mjs
var upload_content_default = /* @__PURE__ */ defineComponent({
	name: "ElUploadContent",
	inheritAttrs: false,
	__name: "upload-content",
	props: uploadContentProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const ns = useNamespace("upload");
		const disabled = useFormDisabled();
		const requests = shallowRef({});
		const inputRef = shallowRef();
		const uploadFiles = (files) => {
			if (files.length === 0) return;
			const { autoUpload, limit, fileList, multiple, onStart, onExceed } = props;
			if (limit && fileList.length + files.length > limit) {
				onExceed(files, fileList);
				return;
			}
			if (!multiple) files = files.slice(0, 1);
			for (const file of files) {
				const rawFile = file;
				rawFile.uid = genFileId();
				onStart(rawFile);
				if (autoUpload) upload(rawFile);
			}
		};
		const upload = async (rawFile) => {
			inputRef.value.value = "";
			if (!props.beforeUpload) return doUpload(rawFile);
			let hookResult;
			let beforeData = {};
			try {
				const originData = props.data;
				const beforeUploadPromise = props.beforeUpload(rawFile);
				beforeData = isPlainObject(props.data) ? cloneDeep(props.data) : props.data;
				hookResult = await beforeUploadPromise;
				if (isPlainObject(props.data) && isEqual(originData, beforeData)) beforeData = cloneDeep(props.data);
			} catch {
				hookResult = false;
			}
			if (hookResult === false) {
				props.onRemove(rawFile);
				return;
			}
			let file = rawFile;
			if (hookResult instanceof Blob) if (hookResult instanceof File) file = hookResult;
			else file = new File([hookResult], rawFile.name, { type: rawFile.type });
			doUpload(Object.assign(file, { uid: rawFile.uid }), beforeData);
		};
		const resolveData = async (data, rawFile) => {
			if (isFunction(data)) return data(rawFile);
			return data;
		};
		const doUpload = async (rawFile, beforeData) => {
			const { headers, data, method, withCredentials, name: filename, action, onProgress, onSuccess, onError, httpRequest } = props;
			try {
				beforeData = await resolveData(beforeData ?? data, rawFile);
			} catch {
				props.onRemove(rawFile);
				return;
			}
			const { uid } = rawFile;
			const options = {
				headers: headers || {},
				withCredentials,
				file: rawFile,
				data: beforeData,
				method,
				filename,
				action,
				onProgress: (evt) => {
					onProgress(evt, rawFile);
				},
				onSuccess: (res) => {
					onSuccess(res, rawFile);
					delete requests.value[uid];
				},
				onError: (err) => {
					onError(err, rawFile);
					delete requests.value[uid];
				}
			};
			const request = httpRequest(options);
			requests.value[uid] = request;
			if (request instanceof Promise) request.then(options.onSuccess, options.onError);
		};
		const handleChange = (e) => {
			const files = e.target.files;
			if (!files) return;
			uploadFiles(Array.from(files));
		};
		const handleClick = () => {
			if (!disabled.value) {
				inputRef.value.value = "";
				inputRef.value.click();
			}
		};
		const handleKeydown = () => {
			handleClick();
		};
		const abort = (file) => {
			entriesOf(requests.value).filter(file ? ([uid]) => String(file.uid) === uid : () => true).forEach(([uid, req]) => {
				if (req instanceof XMLHttpRequest) req.abort();
				delete requests.value[uid];
			});
		};
		__expose({
			abort,
			upload
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([
					unref(ns).b(),
					unref(ns).m(__props.listType),
					unref(ns).is("drag", __props.drag),
					unref(ns).is("disabled", unref(disabled))
				]),
				tabindex: unref(disabled) ? void 0 : 0,
				"aria-disabled": unref(disabled),
				role: "button",
				onClick: handleClick,
				onKeydown: withKeys(withModifiers(handleKeydown, ["self"]), ["enter", "space"])
			}, [__props.drag ? (openBlock(), createBlock(upload_dragger_default, {
				key: 0,
				disabled: unref(disabled),
				directory: __props.directory,
				onFile: uploadFiles
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 8, ["disabled", "directory"])) : renderSlot(_ctx.$slots, "default", { key: 1 }), createBaseVNode("input", {
				ref_key: "inputRef",
				ref: inputRef,
				class: normalizeClass(unref(ns).e("input")),
				name: __props.name,
				disabled: unref(disabled),
				multiple: __props.multiple,
				accept: __props.accept,
				webkitdirectory: __props.directory || void 0,
				type: "file",
				onChange: handleChange,
				onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
			}, null, 42, _hoisted_2)], 42, _hoisted_1);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/src/use-handlers.mjs
var SCOPE = "ElUpload";
var revokeFileObjectURL = (file) => {
	if (file.url?.startsWith("blob:")) URL.revokeObjectURL(file.url);
};
var useHandlers = (props, uploadRef) => {
	const uploadFiles = useVModel(props, "fileList", void 0, { passive: true });
	const getFile = (rawFile) => uploadFiles.value.find((file) => file.uid === rawFile.uid);
	function abort(file) {
		uploadRef.value?.abort(file);
	}
	function clearFiles(states = [
		"ready",
		"uploading",
		"success",
		"fail"
	]) {
		uploadFiles.value = uploadFiles.value.filter((row) => !states.includes(row.status));
	}
	function removeFile(file) {
		uploadFiles.value = uploadFiles.value.filter((uploadFile) => uploadFile.uid !== file.uid);
	}
	const emitChange = (file) => {
		nextTick(() => props.onChange(file, uploadFiles.value));
	};
	const handleError = (err, rawFile) => {
		const file = getFile(rawFile);
		if (!file) return;
		console.error(err);
		file.status = "fail";
		removeFile(file);
		props.onError(err, file, uploadFiles.value);
		emitChange(file);
	};
	const handleProgress = (evt, rawFile) => {
		const file = getFile(rawFile);
		if (!file) return;
		props.onProgress(evt, file, uploadFiles.value);
		file.status = "uploading";
		file.percentage = Math.round(evt.percent);
	};
	const handleSuccess = (response, rawFile) => {
		const file = getFile(rawFile);
		if (!file) return;
		file.status = "success";
		file.response = response;
		props.onSuccess(response, file, uploadFiles.value);
		emitChange(file);
	};
	const handleStart = (file) => {
		if (isNil(file.uid)) file.uid = genFileId();
		const uploadFile = {
			name: file.name,
			percentage: 0,
			status: "ready",
			size: file.size,
			raw: file,
			uid: file.uid
		};
		if (props.listType === "picture-card" || props.listType === "picture") try {
			uploadFile.url = URL.createObjectURL(file);
		} catch (err) {
			debugWarn(SCOPE, err.message);
			props.onError(err, uploadFile, uploadFiles.value);
		}
		uploadFiles.value = [...uploadFiles.value, uploadFile];
		emitChange(uploadFile);
	};
	const handleRemove = async (file) => {
		const uploadFile = file instanceof File ? getFile(file) : file;
		if (!uploadFile) throwError(SCOPE, "file to be removed not found");
		const doRemove = (file) => {
			abort(file);
			removeFile(file);
			props.onRemove(file, uploadFiles.value);
			revokeFileObjectURL(file);
		};
		if (props.beforeRemove) {
			if (await props.beforeRemove(uploadFile, uploadFiles.value) !== false) doRemove(uploadFile);
		} else doRemove(uploadFile);
	};
	function submit() {
		uploadFiles.value.filter(({ status }) => status === "ready").forEach(({ raw }) => raw && uploadRef.value?.upload(raw));
	}
	watch(() => props.listType, (val) => {
		if (val !== "picture-card" && val !== "picture") return;
		uploadFiles.value = uploadFiles.value.map((file) => {
			const { raw, url } = file;
			if (!url && raw) try {
				file.url = URL.createObjectURL(raw);
			} catch (err) {
				props.onError(err, file, uploadFiles.value);
			}
			return file;
		});
	});
	watch(uploadFiles, (files) => {
		for (const file of files) {
			file.uid ||= genFileId();
			file.status ||= "success";
		}
	}, {
		immediate: true,
		deep: true
	});
	return {
		/** @description two-way binding ref from props `fileList` */
		uploadFiles,
		abort,
		clearFiles,
		handleError,
		handleProgress,
		handleStart,
		handleSuccess,
		handleRemove,
		submit,
		revokeFileObjectURL
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/upload/index.mjs
var ElUpload = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElUpload",
	__name: "upload",
	props: uploadProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const disabled = useFormDisabled();
		const uploadRef = shallowRef();
		const { abort, submit, clearFiles, uploadFiles, handleStart, handleError, handleRemove, handleSuccess, handleProgress, revokeFileObjectURL } = useHandlers(props, uploadRef);
		const isPictureCard = computed(() => props.listType === "picture-card");
		const uploadContentProps = computed(() => ({
			...props,
			fileList: uploadFiles.value,
			onStart: handleStart,
			onProgress: handleProgress,
			onSuccess: handleSuccess,
			onError: handleError,
			onRemove: handleRemove
		}));
		onBeforeUnmount(() => {
			uploadFiles.value.forEach(revokeFileObjectURL);
		});
		provide(uploadContextKey, { accept: toRef(props, "accept") });
		__expose({
			/** @description cancel upload request */
			abort,
			/** @description upload the file list manually */
			submit,
			/** @description clear the file list  */
			clearFiles,
			/** @description select the file manually */
			handleStart,
			/** @description remove the file manually */
			handleRemove
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", null, [
				isPictureCard.value && __props.showFileList ? (openBlock(), createBlock(upload_list_default, {
					key: 0,
					disabled: unref(disabled),
					"list-type": __props.listType,
					files: unref(uploadFiles),
					crossorigin: __props.crossorigin,
					"handle-preview": __props.onPreview,
					onRemove: unref(handleRemove)
				}, createSlots({
					append: withCtx(() => [createVNode(upload_content_default, mergeProps({
						ref_key: "uploadRef",
						ref: uploadRef
					}, uploadContentProps.value), {
						default: withCtx(() => [_ctx.$slots.trigger ? renderSlot(_ctx.$slots, "trigger", { key: 0 }) : createCommentVNode("v-if", true), !_ctx.$slots.trigger && _ctx.$slots.default ? renderSlot(_ctx.$slots, "default", { key: 1 }) : createCommentVNode("v-if", true)]),
						_: 3
					}, 16)]),
					_: 2
				}, [_ctx.$slots.file ? {
					name: "default",
					fn: withCtx(({ file, index }) => [renderSlot(_ctx.$slots, "file", {
						file,
						index
					})]),
					key: "0"
				} : void 0]), 1032, [
					"disabled",
					"list-type",
					"files",
					"crossorigin",
					"handle-preview",
					"onRemove"
				])) : createCommentVNode("v-if", true),
				!isPictureCard.value || isPictureCard.value && !__props.showFileList ? (openBlock(), createBlock(upload_content_default, mergeProps({
					key: 1,
					ref_key: "uploadRef",
					ref: uploadRef
				}, uploadContentProps.value), {
					default: withCtx(() => [_ctx.$slots.trigger ? renderSlot(_ctx.$slots, "trigger", { key: 0 }) : createCommentVNode("v-if", true), !_ctx.$slots.trigger && _ctx.$slots.default ? renderSlot(_ctx.$slots, "default", { key: 1 }) : createCommentVNode("v-if", true)]),
					_: 3
				}, 16)) : createCommentVNode("v-if", true),
				_ctx.$slots.trigger ? renderSlot(_ctx.$slots, "default", { key: 2 }) : createCommentVNode("v-if", true),
				renderSlot(_ctx.$slots, "tip"),
				!isPictureCard.value && __props.showFileList ? (openBlock(), createBlock(upload_list_default, {
					key: 3,
					disabled: unref(disabled),
					"list-type": __props.listType,
					files: unref(uploadFiles),
					crossorigin: __props.crossorigin,
					"handle-preview": __props.onPreview,
					onRemove: unref(handleRemove)
				}, createSlots({ _: 2 }, [_ctx.$slots.file ? {
					name: "default",
					fn: withCtx(({ file, index }) => [renderSlot(_ctx.$slots, "file", {
						file,
						index
					})]),
					key: "0"
				} : void 0]), 1032, [
					"disabled",
					"list-type",
					"files",
					"crossorigin",
					"handle-preview",
					"onRemove"
				])) : createCommentVNode("v-if", true)
			]);
		};
	}
}));
//#endregion
export { ElUpload as t };
