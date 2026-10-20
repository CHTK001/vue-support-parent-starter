import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, w as createSlots, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { V as document_default, in as upload_filled_default, rn as upload_default } from "./dist-DogtK295.js";
import { in as http, yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReUploadChunk/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-upload-chunk" };
var _hoisted_2 = { class: "re-upload-chunk__drag-content" };
var _hoisted_3 = { class: "re-upload-chunk__drag-text" };
var _hoisted_4 = { class: "re-upload-chunk__drag-hint" };
var _hoisted_5 = {
	key: 1,
	class: "re-upload-chunk__list"
};
var _hoisted_6 = { class: "re-upload-chunk__item-info" };
var _hoisted_7 = { class: "re-upload-chunk__item-main" };
var _hoisted_8 = { class: "re-upload-chunk__item-name" };
var _hoisted_9 = { class: "re-upload-chunk__item-meta" };
var _hoisted_10 = { key: 0 };
var _hoisted_11 = { key: 1 };
var _hoisted_12 = {
	key: 2,
	class: "re-upload-chunk__item-error"
};
var _hoisted_13 = { key: 3 };
var _hoisted_14 = { class: "re-upload-chunk__item-actions" };
//#endregion
//#region ../../packages/ui/src/components/ReUploadChunk/index.vue
var ReUploadChunk_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		modelValue: { default: () => [] },
		baseUrl: {},
		headers: {},
		storageType: { default: "local" },
		bucket: { default: "default" },
		chunkSize: { default: 5242880 },
		accept: { default: "" },
		multiple: {
			type: Boolean,
			default: false
		},
		drag: {
			type: Boolean,
			default: false
		},
		triggerText: { default: "选择文件" },
		dragText: { default: "将文件拖到此处，或点击上传" },
		dragHint: { default: "支持大文件分片上传" },
		disabled: { type: Boolean },
		hideTrigger: { type: Boolean }
	},
	emits: [
		"update:modelValue",
		"change",
		"success",
		"error",
		"progress"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReUploadChunk —— 分片上传组件
		*
		* 适配后端分片上传接口：
		*   POST /chunk/create          初始化
		*   POST /chunk/{id}/part       上传分片
		*   POST /chunk/{id}/complete  完成
		*   DELETE /chunk/{id}          取消
		*   GET /chunk/{id}/progress    进度
		*
		*   <ReUploadChunk v-model="files" base-url="/api/filesystem" />
		*/
		const props = __props;
		const emit = __emit;
		/**
		* 内部维护的浅响应式列表，保证修改字段能触发模板更新。
		* 外部 v-model 变化通过 watch 同步进来。
		*/
		const internalList = shallowRef([]);
		watch(() => props.modelValue, (val) => {
			internalList.value = [...val];
		}, {
			immediate: true,
			deep: true
		});
		const formatSize = (bytes) => {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
			return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
		};
		const syncList = () => {
			const snapshot = [...internalList.value];
			internalList.value = snapshot;
			emit("update:modelValue", snapshot);
			emit("change", snapshot);
		};
		const fetchJson = async (url, init = {}) => {
			return await (await fetch(url, {
				credentials: "include",
				...init,
				headers: {
					...props.headers ?? {},
					...init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {},
					...init.headers ?? {}
				}
			})).json();
		};
		const createTask = async (file) => {
			const url = `${props.baseUrl}/chunk/create`;
			const formData = new FormData();
			formData.append("fileName", file.name);
			formData.append("fileSize", String(file.size));
			formData.append("chunkSize", String(props.chunkSize));
			formData.append("storageType", props.storageType);
			formData.append("bucket", props.bucket);
			const result = await fetchJson(url, {
				method: "POST",
				body: formData
			});
			if (result.code !== 200) throw new Error(result.message || "初始化分片上传失败");
			return result.data;
		};
		const uploadPart = async (uploadId, partNumber, blob) => {
			const url = `${props.baseUrl}/chunk/${uploadId}/part?partNumber=${partNumber}`;
			const formData = new FormData();
			formData.append("file", blob);
			const result = await fetchJson(url, {
				method: "POST",
				body: formData
			});
			if (result.code !== 200) throw new Error(result.message || "分片上传失败");
			return result.data;
		};
		const completeTask = async (uploadId) => {
			const url = `${props.baseUrl}/chunk/${uploadId}/complete`;
			const result = await fetchJson(url, { method: "POST" });
			if (result.code !== 200) throw new Error(result.message || "完成分片上传失败");
			return result.data;
		};
		const cancelTask = async (uploadId) => {
			await http().delete(`${props.baseUrl}/chunk/${uploadId}`).headers(props.headers ?? {});
		};
		const handleBeforeUpload = (file) => {
			addFile(file);
			return false;
		};
		const addFile = (file) => {
			const newList = [...internalList.value];
			newList.push({
				file,
				name: file.name,
				size: file.size,
				status: "pending"
			});
			internalList.value = newList;
			syncList();
			const target = newList[newList.length - 1];
			startUpload(target);
		};
		const startUpload = async (file) => {
			try {
				file.status = "uploading";
				file.percent = 0;
				file.error = void 0;
				syncList();
				const init = await createTask(file);
				file.uploadId = init.uploadId;
				file.totalChunks = init.totalChunks;
				file.chunkSize = init.chunkSize;
				file.key = init.key;
				file.uploadedChunks = 0;
				syncList();
				const total = init.totalChunks;
				for (let partNumber = 1; partNumber <= total; partNumber++) {
					const start = (partNumber - 1) * init.chunkSize;
					const end = Math.min(file.size, start + init.chunkSize);
					const chunk = file.file.slice(start, end);
					await uploadPart(init.uploadId, partNumber, chunk);
					file.uploadedChunks = partNumber;
					file.percent = Math.round(partNumber / total * 100);
					emit("progress", file);
					syncList();
				}
				file.url = (await completeTask(init.uploadId)).url;
				file.status = "success";
				file.percent = 100;
				emit("progress", file);
				emit("success", file);
				syncList();
			} catch (err) {
				file.status = "fail";
				file.error = err.message || "上传失败";
				emit("error", file, err);
				syncList();
			}
		};
		const handleCancel = async (file) => {
			if (file.uploadId) try {
				await cancelTask(file.uploadId);
			} catch {}
			file.status = "cancelled";
			syncList();
		};
		const handleRetry = (file) => {
			startUpload(file);
		};
		const handleRemove = (index) => {
			const newList = [...internalList.value];
			newList.splice(index, 1);
			internalList.value = newList;
			syncList();
		};
		const handleCopy = (url) => {
			if (navigator.clipboard) {
				navigator.clipboard.writeText(url);
				message.success("链接已复制");
			}
		};
		const uploadFile = (file) => addFile(file);
		__expose({ uploadFile });
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_upload = resolveComponent("el-upload");
			const _component_el_progress = resolveComponent("el-progress");
			return openBlock(), createElementBlock("div", _hoisted_1, [!__props.hideTrigger ? (openBlock(), createBlock(_component_el_upload, {
				key: 0,
				multiple: __props.multiple,
				accept: __props.accept,
				drag: __props.drag,
				"show-file-list": false,
				"before-upload": handleBeforeUpload,
				disabled: __props.disabled
			}, createSlots({ _: 2 }, [__props.drag ? {
				name: "default",
				fn: withCtx(() => [createBaseVNode("div", _hoisted_2, [
					createVNode(_component_el_icon, { class: "re-upload-chunk__drag-icon" }, {
						default: withCtx(() => [createVNode(unref(upload_filled_default))]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_3, toDisplayString(__props.dragText), 1),
					createBaseVNode("div", _hoisted_4, toDisplayString(__props.dragHint), 1)
				])]),
				key: "0"
			} : {
				name: "default",
				fn: withCtx(() => [createVNode(_component_el_button, { disabled: __props.disabled }, {
					default: withCtx(() => [createVNode(_component_el_icon, { style: { "margin-right": "4px" } }, {
						default: withCtx(() => [createVNode(unref(upload_default))]),
						_: 1
					}), createTextVNode(" " + toDisplayString(__props.triggerText), 1)]),
					_: 1
				}, 8, ["disabled"])]),
				key: "1"
			}]), 1032, [
				"multiple",
				"accept",
				"drag",
				"disabled"
			])) : createCommentVNode("", true), internalList.value.length ? (openBlock(), createElementBlock("ul", _hoisted_5, [(openBlock(true), createElementBlock(Fragment, null, renderList(internalList.value, (item, index) => {
				return openBlock(), createElementBlock("li", {
					key: index,
					class: normalizeClass(["re-upload-chunk__item", `is-${item.status}`])
				}, [createBaseVNode("div", _hoisted_6, [createVNode(_component_el_icon, { class: "re-upload-chunk__item-icon" }, {
					default: withCtx(() => [createVNode(unref(document_default))]),
					_: 1
				}), createBaseVNode("div", _hoisted_7, [
					createBaseVNode("div", _hoisted_8, toDisplayString(item.name), 1),
					createBaseVNode("div", _hoisted_9, [createBaseVNode("span", null, toDisplayString(formatSize(item.size)), 1), item.status === "uploading" ? (openBlock(), createElementBlock("span", _hoisted_10, toDisplayString(item.uploadedChunks || 0) + " / " + toDisplayString(item.totalChunks || 1) + " 分片 · " + toDisplayString(item.percent || 0) + "% ", 1)) : item.status === "success" ? (openBlock(), createElementBlock("span", _hoisted_11, "上传成功")) : item.status === "fail" ? (openBlock(), createElementBlock("span", _hoisted_12, toDisplayString(item.error || "上传失败"), 1)) : item.status === "cancelled" ? (openBlock(), createElementBlock("span", _hoisted_13, "已取消")) : createCommentVNode("", true)]),
					item.status === "uploading" ? (openBlock(), createBlock(_component_el_progress, {
						key: 0,
						percentage: item.percent || 0,
						"show-text": false,
						"stroke-width": 2,
						class: "re-upload-chunk__progress"
					}, null, 8, ["percentage"])) : createCommentVNode("", true)
				])]), createBaseVNode("div", _hoisted_14, [
					item.status === "uploading" ? (openBlock(), createBlock(_component_el_button, {
						key: 0,
						link: "",
						type: "danger",
						onClick: ($event) => handleCancel(item)
					}, {
						default: withCtx(() => [..._cache[0] || (_cache[0] = [createTextVNode(" 取消 ", -1)])]),
						_: 1
					}, 8, ["onClick"])) : createCommentVNode("", true),
					item.status === "fail" || item.status === "cancelled" ? (openBlock(), createBlock(_component_el_button, {
						key: 1,
						link: "",
						type: "primary",
						onClick: ($event) => handleRetry(item)
					}, {
						default: withCtx(() => [..._cache[1] || (_cache[1] = [createTextVNode(" 重试 ", -1)])]),
						_: 1
					}, 8, ["onClick"])) : createCommentVNode("", true),
					item.status === "success" && item.url ? (openBlock(), createBlock(_component_el_button, {
						key: 2,
						link: "",
						type: "primary",
						onClick: ($event) => handleCopy(item.url)
					}, {
						default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode(" 复制链接 ", -1)])]),
						_: 1
					}, 8, ["onClick"])) : createCommentVNode("", true),
					createVNode(_component_el_button, {
						link: "",
						type: "danger",
						onClick: ($event) => handleRemove(index)
					}, {
						default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode(" 删除 ", -1)])]),
						_: 1
					}, 8, ["onClick"])
				])], 2);
			}), 128))])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-315cb567"]]);
//#endregion
export { ReUploadChunk_default as t };
