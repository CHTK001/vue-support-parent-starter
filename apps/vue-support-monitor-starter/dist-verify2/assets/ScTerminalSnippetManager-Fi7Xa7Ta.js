import { D as createVNode, E as createTextVNode, Ht as watch, St as resolveComponent, b as createElementBlock, ct as onMounted, k as defineComponent, mt as openBlock, qt as withCtx, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { L as saveSnippet, T as getSnippets, Y as updateSnippet, d as delSnippet } from "./api-CRz4q4qT.js";
//#region ../../pages/server/src/views/ScTerminalSnippetManager.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "snippet-manager fade-in sc-page" };
//#endregion
//#region ../../pages/server/src/views/ScTerminalSnippetManager.vue
var ScTerminalSnippetManager_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTerminalSnippetManager",
	setup(__props) {
		const snippets = ref([]);
		const dialogVisible = ref(false);
		const editing = ref(false);
		const editingId = ref(null);
		const formData = ref({
			msTerminalSnippetName: "",
			msTerminalSnippetContent: "",
			msTerminalSnippetRemark: ""
		});
		const selectedRow = ref(null);
		const filterName = ref("");
		const allSnippets = ref([]);
		watch(filterName, () => {
			const kw = filterName.value.trim().toLowerCase();
			snippets.value = kw ? allSnippets.value.filter((s) => (s.msTerminalSnippetName || "").toLowerCase().includes(kw)) : allSnippets.value;
		});
		async function loadSnippets() {
			try {
				const data = await getSnippets();
				allSnippets.value = data ?? [];
				const kw = filterName.value.trim().toLowerCase();
				snippets.value = kw ? allSnippets.value.filter((s) => (s.msTerminalSnippetName || "").toLowerCase().includes(kw)) : allSnippets.value;
			} catch (e) {
				message.error(e.message);
			}
		}
		function editRow(row) {
			editing.value = !!row;
			editingId.value = row?.id ?? null;
			if (row) {
				formData.value = {
					msTerminalSnippetName: row.msTerminalSnippetName ?? "",
					msTerminalSnippetContent: row.msTerminalSnippetContent ?? "",
					msTerminalSnippetRemark: row.msTerminalSnippetRemark ?? ""
				};
				selectedRow.value = row;
			} else {
				formData.value = {
					msTerminalSnippetName: "",
					msTerminalSnippetContent: "",
					msTerminalSnippetRemark: ""
				};
				selectedRow.value = null;
			}
			dialogVisible.value = true;
		}
		async function save() {
			if (!formData.value.msTerminalSnippetName.trim()) {
				message.warning("片段名称不能为空");
				return;
			}
			try {
				const payload = {
					msTerminalSnippetName: formData.value.msTerminalSnippetName.trim(),
					msTerminalSnippetContent: formData.value.msTerminalSnippetContent ?? "",
					msTerminalSnippetRemark: formData.value.msTerminalSnippetRemark ?? ""
				};
				if (editingId.value) await updateSnippet(editingId.value, payload);
				else await saveSnippet(payload);
				message.success("已保存");
				dialogVisible.value = false;
				loadSnippets();
			} catch (e) {
				message.error(e.message);
			}
		}
		function selectRow(row) {
			selectedRow.value = row;
		}
		async function deleteRow(row) {
			try {
				if (await message.confirm(`确认删除片段 "${row.msTerminalSnippetName}"?`, "删除")) {
					await delSnippet(row.id);
					message.success("已删除");
					loadSnippets();
				}
			} catch (e) {
				message.error(e.message);
			}
		}
		function handleDelete() {
			if (!selectedRow.value) {
				message.warning("请先选择一行");
				return;
			}
			deleteRow(selectedRow.value);
		}
		onMounted(loadSnippets);
		return (_ctx, _cache) => {
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(_component_ReSectionHead, {
					class: "page-head",
					title: "片段管理",
					description: "常用终端命令片段，可在批量作业中快捷填充"
				}, {
					actions: withCtx(() => [
						createVNode(_component_ReInput, {
							modelValue: filterName.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => filterName.value = $event),
							placeholder: "搜索片段名",
							"prefix-icon": "Search",
							style: { "width": "200px" },
							clearable: ""
						}, null, 8, ["modelValue"]),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Delete",
							type: "danger",
							disabled: !selectedRow.value,
							onClick: handleDelete
						}, {
							default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("删除", -1)])]),
							_: 1
						}, 8, ["disabled"]),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Plus",
							type: "primary",
							onClick: _cache[1] || (_cache[1] = ($event) => editRow())
						}, {
							default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("新增片段", -1)])]),
							_: 1
						})
					]),
					_: 1
				}),
				createVNode(_component_ReTable, {
					data: snippets.value,
					border: "",
					pagination: false,
					toolbar: false,
					"highlight-current-row": "",
					"empty-text": "暂无命令片段，点击右上角「新增片段」创建",
					onRowClick: selectRow
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							prop: "id",
							label: "编号",
							width: "60"
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msTerminalSnippetName",
							label: "片段名称",
							"min-width": "150"
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msTerminalSnippetRemark",
							label: "备注",
							"min-width": "200"
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "140"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReButton, {
								link: "",
								onClick: ($event) => editRow(row)
							}, {
								default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("编辑", -1)])]),
								_: 1
							}, 8, ["onClick"]), createVNode(_component_ReButton, {
								link: "",
								type: "danger",
								onClick: ($event) => deleteRow(row)
							}, {
								default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("删除", -1)])]),
								_: 1
							}, 8, ["onClick"])]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data"]),
				createVNode(_component_ReDialog, {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => dialogVisible.value = $event),
					title: editing.value ? "编辑片段" : "新增片段",
					width: "520",
					height: 380,
					"confirm-text": "保存",
					"cancel-text": "取消",
					"footer-hidden": false,
					onConfirm: save,
					onCancel: _cache[6] || (_cache[6] = ($event) => dialogVisible.value = false)
				}, {
					default: withCtx(() => [createVNode(_component_ReForm, {
						model: formData.value,
						"label-width": "100px",
						"label-position": "right"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReFormItem, {
								label: "片段名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formData.value.msTerminalSnippetName,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => formData.value.msTerminalSnippetName = $event)
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "片段内容" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formData.value.msTerminalSnippetContent,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => formData.value.msTerminalSnippetContent = $event),
									type: "textarea",
									rows: 4
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "备注" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formData.value.msTerminalSnippetRemark,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => formData.value.msTerminalSnippetRemark = $event)
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["model"])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-5af0be12"]]);
//#endregion
export { ScTerminalSnippetManager_default as default };
