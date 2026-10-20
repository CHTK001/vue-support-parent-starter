import { D as createVNode, E as createTextVNode, St as resolveComponent, b as createElementBlock, ct as onMounted, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { C as getMaintenancePlans, I as saveMaintenancePlan, k as queryHosts, u as delMaintenancePlan } from "./api-CRz4q4qT.js";
//#region ../../pages/server/src/views/ScMaintenancePlan.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "plan-list sc-page" };
//#endregion
//#region ../../pages/server/src/views/ScMaintenancePlan.vue
var ScMaintenancePlan_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScMaintenancePlan",
	setup(__props) {
		const loading = ref(false);
		const plans = ref([]);
		const hosts = ref([]);
		const formVisible = ref(false);
		const editingId = ref(null);
		const form = ref({
			planName: "",
			planType: "MAINTENANCE",
			startTime: "",
			endTime: "",
			targetHostIds: [],
			description: ""
		});
		const planTypes = [
			{
				value: "MAINTENANCE",
				label: "维护"
			},
			{
				value: "UPGRADE",
				label: "升级"
			},
			{
				value: "BACKUP",
				label: "备份"
			},
			{
				value: "REBOOT",
				label: "重启"
			}
		];
		const statusMap = {
			PENDING: "待执行",
			RUNNING: "执行中",
			COMPLETED: "已完成",
			CANCELLED: "已取消"
		};
		const statusType = {
			PENDING: "info",
			RUNNING: "warning",
			COMPLETED: "success",
			CANCELLED: "danger"
		};
		const hostOptions = ref([]);
		onMounted(refresh);
		async function refresh() {
			loading.value = true;
			try {
				const [planList, hostList] = await Promise.all([getMaintenancePlans(), queryHosts().catch(() => [])]);
				plans.value = planList ?? [];
				hosts.value = hostList ?? [];
				hostOptions.value = (hostList ?? []).map((h) => ({
					label: `${h.serverHostName} (${h.serverHostAddress})`,
					value: h.id
				}));
			} catch (e) {
				message.error(e.message);
			} finally {
				loading.value = false;
			}
		}
		function openCreate() {
			editingId.value = null;
			form.value = {
				planName: "",
				planType: "MAINTENANCE",
				startTime: "",
				endTime: "",
				targetHostIds: [],
				description: ""
			};
			formVisible.value = true;
		}
		function openEdit(row) {
			editingId.value = row.id;
			const hostIds = [];
			if (row.targetHostIds) try {
				const parsed = JSON.parse(row.targetHostIds);
				if (Array.isArray(parsed)) hostIds.push(...parsed);
			} catch {}
			form.value = {
				planName: row.planName,
				planType: row.planType,
				startTime: row.startTime,
				endTime: row.endTime,
				targetHostIds: hostIds,
				description: row.description || ""
			};
			formVisible.value = true;
		}
		async function submitForm() {
			if (!form.value.planName.trim()) {
				message.warning("计划名称不能为空");
				return;
			}
			if (!form.value.startTime || !form.value.endTime) {
				message.warning("请选择开始和结束时间");
				return;
			}
			const payload = {
				...form.value,
				targetHostIds: JSON.stringify(form.value.targetHostIds)
			};
			await saveMaintenancePlan(editingId.value, payload);
			message.success("已保存");
			formVisible.value = false;
			refresh();
		}
		async function removePlan(row) {
			await message.confirm(`确认删除维护计划 ${row.planName}?`, "删除");
			await delMaintenancePlan(row.id);
			message.success("已删除");
			refresh();
		}
		function hostNames(ids) {
			if (!ids) return "-";
			try {
				return JSON.parse(ids).map((id) => hosts.value.find((h) => h.id === id)?.serverHostName ?? `#${id}`).join(", ");
			} catch {
				return ids;
			}
		}
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReDatePicker = resolveComponent("ReDatePicker");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(_component_ReSectionHead, {
					class: "page-head",
					title: "维护计划",
					description: "窗口期内的维护 / 升级 / 备份 / 重启安排"
				}, {
					actions: withCtx(() => [createVNode(_component_ReButton, {
						"show-text": "",
						icon: "Plus",
						type: "primary",
						onClick: openCreate
					}, {
						default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("新建计划", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						"show-text": "",
						icon: "Refresh",
						onClick: refresh
					}, {
						default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("刷新", -1)])]),
						_: 1
					})]),
					_: 1
				}),
				createVNode(_component_ReTable, {
					data: plans.value,
					loading: loading.value,
					border: "",
					stripe: "",
					size: "default",
					pagination: false,
					toolbar: false,
					"empty-text": "暂无维护计划，点击右上角「新建计划」创建"
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							prop: "planName",
							label: "计划名称",
							"min-width": "140",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							label: "类型",
							width: "90"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, null, {
								default: withCtx(() => [createTextVNode(toDisplayString(planTypes.find((t) => t.value === row.planType)?.label || row.planType), 1)]),
								_: 2
							}, 1024)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "状态",
							width: "80"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, { type: statusType[row.status] || "info" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(statusMap[row.status] || row.status), 1)]),
								_: 2
							}, 1032, ["type"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "开始时间",
							width: "160"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.startTime?.replace("T", " ") || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "结束时间",
							width: "160"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.endTime?.replace("T", " ") || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "目标主机",
							"min-width": "200",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(hostNames(row.targetHostIds)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							prop: "description",
							label: "描述",
							"min-width": "140",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "130",
							fixed: "right"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReButton, {
								link: "",
								onClick: ($event) => openEdit(row)
							}, {
								default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("编辑", -1)])]),
								_: 1
							}, 8, ["onClick"]), createVNode(_component_ReButton, {
								link: "",
								type: "danger",
								onClick: ($event) => removePlan(row)
							}, {
								default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("删除", -1)])]),
								_: 1
							}, 8, ["onClick"])]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data", "loading"]),
				createVNode(_component_ReDialog, {
					modelValue: formVisible.value,
					"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => formVisible.value = $event),
					title: editingId.value ? "编辑计划" : "新建计划",
					width: "560",
					height: 520,
					"confirm-text": "保存",
					"cancel-text": "取消",
					"footer-hidden": false,
					onConfirm: submitForm,
					onCancel: _cache[7] || (_cache[7] = ($event) => formVisible.value = false)
				}, {
					default: withCtx(() => [createVNode(_component_ReForm, {
						"label-width": "100px",
						"label-position": "right"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReFormItem, {
								label: "计划名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.planName,
									"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.value.planName = $event),
									placeholder: "如 核心服务升级"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "类型" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.planType,
									"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.value.planType = $event),
									data: planTypes,
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "开始时间",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReDatePicker, {
									modelValue: form.value.startTime,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.startTime = $event),
									type: "datetime",
									placeholder: "选择开始时间",
									style: { "width": "100%" },
									"value-format": "YYYY-MM-DDTHH:mm:ss"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "结束时间",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReDatePicker, {
									modelValue: form.value.endTime,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.value.endTime = $event),
									type: "datetime",
									placeholder: "选择结束时间",
									style: { "width": "100%" },
									"value-format": "YYYY-MM-DDTHH:mm:ss"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "目标主机" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.targetHostIds,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.targetHostIds = $event),
									multiple: "",
									filterable: "",
									data: hostOptions.value,
									style: { "width": "100%" }
								}, null, 8, ["modelValue", "data"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "描述" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.description,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.description = $event),
									type: "textarea",
									rows: 2
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-86a39bd2"]]);
//#endregion
export { ScMaintenancePlan_default as default };
