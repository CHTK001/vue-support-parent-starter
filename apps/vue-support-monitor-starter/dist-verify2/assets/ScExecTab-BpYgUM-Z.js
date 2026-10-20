import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import "./src-DDwlSqPX.js";
import { t as CronExpression } from "./CronExpression-B7SGssoE.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { A as runJobNow, P as saveJob, b as getJobs, c as delJob, h as getExecLogs, k as queryHosts } from "./api-CRz4q4qT.js";
//#region ../../pages/server/src/views/ScExecTab.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "exec-tab" };
var _hoisted_2 = {
	key: 0,
	class: "ex-card"
};
var _hoisted_3 = { class: "ex-head" };
var _hoisted_4 = { class: "ex-head__desc" };
var _hoisted_5 = { class: "ex-card ex-card--jobs" };
var _hoisted_6 = { class: "ex-head" };
var _hoisted_7 = { class: "ex-head__tools" };
var _hoisted_8 = { class: "ex-layout-toggle" };
var _hoisted_9 = { class: "ex-mono" };
var _hoisted_10 = { class: "ex-mono" };
var _hoisted_11 = ["onClick"];
var _hoisted_12 = ["onClick"];
var _hoisted_13 = ["onClick"];
var _hoisted_14 = ["onClick"];
var _hoisted_15 = { class: "ex-jobcard__meta" };
var _hoisted_16 = { class: "ex-jobcard__row" };
var _hoisted_17 = { class: "ex-mono" };
var _hoisted_18 = { class: "ex-jobcard__row" };
var _hoisted_19 = { class: "ex-jobcard__row" };
var _hoisted_20 = { class: "ex-mono ex-jobcard__cmd" };
var _hoisted_21 = { class: "ex-jobcard__foot" };
var _hoisted_22 = { class: "ex-jobcard__ops" };
var _hoisted_23 = ["onClick"];
var _hoisted_24 = ["onClick"];
var _hoisted_25 = ["onClick"];
var _hoisted_26 = ["onClick"];
var _hoisted_27 = { class: "ex-runhint" };
var _hoisted_28 = { class: "ex-pill is-cron" };
var _hoisted_29 = { class: "ex-logfilter" };
var _hoisted_30 = { class: "ex-pill" };
var JOB_LAYOUT_KEY = "exec-job-layout";
//#endregion
//#region ../../pages/server/src/views/ScExecTab.vue
var ScExecTab_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScExecTab",
	setup(__props) {
		/**
		* 批量作业 —— 计划任务 / 最近执行结果
		*
		* 计划任务以 ReTable 呈现，支持「表格 / 卡片」布局切换（默认表格，偏好持久化）；
		* 任务分「定时(CRON)」与「脚本(NONE)」两类，定时任务由后端逐任务 CronTrigger 调度。
		* 操作列：执行（弹窗选择同类型服务器，选择主机后才会执行）/ 全部日志 / 编辑 / 删除。
		* 目标主机不再常驻页面，统一收敛到「执行」弹窗内选择；批量命令与文件分发已移除
		* （文件分发移至「文件资产」）。视觉走 koi 变量（--el-*）。
		*
		* @author CH
		* @since 4.0.0
		*/
		const hosts = ref([]);
		const lastResults = ref([]);
		const jobs = ref([]);
		const jobFormVisible = ref(false);
		const editingJobId = ref(null);
		const jobForm = ref({
			msExecJobName: "",
			msExecJobType: "CRON",
			msExecJobCron: "0 0 3 * * ?",
			msExecJobCommand: "",
			hostIdText: "",
			msExecJobTimeout: 60
		});
		/** 计划任务布局：table（默认）/ card，持久化偏好 */
		const jobLayout = ref(localStorage.getItem(JOB_LAYOUT_KEY) === "card" ? "card" : "table");
		/**
		* 切换计划任务布局
		*
		* @param layout 布局
		*/
		function setJobLayout(layout) {
			jobLayout.value = layout;
			try {
				localStorage.setItem(JOB_LAYOUT_KEY, layout);
			} catch {}
		}
		const runDialogVisible = ref(false);
		const runJobRow = ref(null);
		const runHostIds = ref([]);
		const logDrawerVisible = ref(false);
		const historyLogs = ref([]);
		const historyType = ref("");
		const logJobId = ref(null);
		const logJobName = ref("");
		watch(logDrawerVisible, (show) => {
			if (show) loadHistory();
		});
		onMounted(async () => {
			try {
				const [hostList, jobList] = await Promise.all([queryHosts(), getJobs()]);
				hosts.value = (hostList ?? []).map((h) => ({
					id: h.id,
					serverHostName: h.serverHostName,
					serverHostAddress: h.serverHostAddress,
					serverHostOsType: h.serverHostOsType
				}));
				jobs.value = jobList ?? [];
			} catch (e) {
				message.error(e.message);
			}
		});
		/**
		* 加载历史执行日志(抽屉打开、类型切换或按任务过滤时调用)
		*/
		async function loadHistory() {
			try {
				historyLogs.value = await getExecLogs(historyType.value || void 0, void 0, logJobId.value ?? void 0);
			} catch (e) {
				message.error(e.message);
			}
		}
		/** 打开「全部日志」抽屉（按任务过滤） */
		function openJobLogs(row) {
			logJobId.value = row.id;
			logJobName.value = row.msExecJobName;
			if (logDrawerVisible.value) loadHistory();
			else logDrawerVisible.value = true;
		}
		/** 打开「执行日志」抽屉（全部日志，不带任务过滤） */
		function openAllLogs() {
			logJobId.value = null;
			logJobName.value = "";
			if (logDrawerVisible.value) loadHistory();
			else logDrawerVisible.value = true;
		}
		/**
		* 主机 OS 类型（大写）
		*
		* @param h 主机
		*/
		function hostOs(h) {
			return (h.serverHostOsType || "").toUpperCase();
		}
		/**
		* 解析任务配置的主机 ID 集合
		*
		* @param row 任务
		*/
		function jobHostIds(row) {
			if (!row.msExecJobHostIds) return [];
			try {
				return JSON.parse(row.msExecJobHostIds);
			} catch {
				return [];
			}
		}
		/**
		* 任务的目标 OS 类型（取首个可识别主机）
		*
		* @param row 任务
		*/
		function jobOsType(row) {
			if (!row) return "";
			for (const id of jobHostIds(row)) {
				const h = hosts.value.find((x) => x.id === id);
				if (h && hostOs(h)) return hostOs(h);
			}
			return "";
		}
		/** OS 类型展示名 */
		function osLabel(type) {
			if (!type) return "全部类型";
			return {
				LINUX: "Linux",
				WINDOWS: "Windows",
				MACOS: "macOS",
				UNIX: "Unix"
			}[type] || type;
		}
		/** 执行弹窗可选主机：与任务同类型（任务无类型时不过滤） */
		const runHostOptions = computed(() => {
			const type = jobOsType(runJobRow.value);
			return (type ? hosts.value.filter((h) => hostOs(h) === type) : hosts.value).map((h) => ({
				label: `${h.serverHostName} (${h.serverHostAddress})`,
				value: h.id
			}));
		});
		/**
		* 打开「选择服务器（相同类型）」执行弹窗
		*
		* @param row 任务
		*/
		function openRunDialog(row) {
			runJobRow.value = row;
			jobOsType(row);
			const configured = jobHostIds(row);
			const allowed = new Set(runHostOptions.value.map((o) => o.value));
			const preset = configured.filter((id) => allowed.has(id));
			runHostIds.value = preset.length ? preset : [...allowed];
			runDialogVisible.value = true;
		}
		/** 确认执行：按所选服务器触发任务 */
		async function confirmRun() {
			const row = runJobRow.value;
			if (!row) return;
			if (!runHostIds.value.length) {
				message.warning("请至少选择一台服务器");
				return;
			}
			try {
				const logs = await runJobNow(row.id, runHostIds.value);
				lastResults.value = normalizeLogs(logs);
				runDialogVisible.value = false;
				message.success("已触发，结果见下方");
			} catch (e) {
				message.error(e.message);
			}
		}
		/** 任务类型显示名 */
		function jobTypeText(row) {
			return (row.msExecJobType || "CRON").toUpperCase() === "NONE" ? "脚本" : "定时";
		}
		/** 任务类型样式类 */
		function jobTypeClass(row) {
			return (row.msExecJobType || "CRON").toUpperCase() === "NONE" ? "is-none" : "is-cron";
		}
		/** 任务 cron 展示（脚本任务无 cron） */
		function jobCronText(row) {
			return jobTypeText(row) === "脚本" ? "—" : row.msExecJobCron || "-";
		}
		/**
		* 打开任务表单
		*
		* @param row 编辑中的任务，null 表示新增
		*/
		function openJobForm(row) {
			editingJobId.value = row?.id ?? null;
			const ids = row ? jobHostIds(row).join(",") : "";
			jobForm.value = {
				msExecJobName: row?.msExecJobName ?? "",
				msExecJobType: (row?.msExecJobType || "CRON").toUpperCase() === "NONE" ? "NONE" : "CRON",
				msExecJobCron: row?.msExecJobCron ?? "0 0 3 * * ?",
				msExecJobCommand: row?.msExecJobCommand ?? "",
				hostIdText: ids,
				msExecJobTimeout: row?.msExecJobTimeout ?? 60
			};
			jobFormVisible.value = true;
		}
		/**
		* 提交任务表单（含 cron 前端预校验，复用 @repo/utils CronExpression）
		*/
		async function submitJob() {
			const form = jobForm.value;
			if (!form.msExecJobName.trim() || !form.msExecJobCommand.trim()) {
				message.warning("任务名称与命令均不能为空");
				return;
			}
			if (!form.hostIdText.trim()) {
				message.warning("目标主机ID不能为空");
				return;
			}
			if (form.msExecJobType === "CRON") try {
				new CronExpression(form.msExecJobCron.trim());
			} catch {
				message.warning(`cron 表达式非法: ${form.msExecJobCron}`);
				return;
			}
			try {
				await saveJob(editingJobId.value, {
					...editingJobId.value ? { id: editingJobId.value } : {},
					msExecJobName: form.msExecJobName,
					msExecJobType: form.msExecJobType,
					msExecJobCron: form.msExecJobType === "CRON" ? form.msExecJobCron : "",
					msExecJobCommand: form.msExecJobCommand,
					msExecJobHostIds: JSON.stringify(form.hostIdText.split(",").map((v) => Number(v.trim())).filter((v) => Number.isFinite(v) && v > 0)),
					msExecJobTimeout: form.msExecJobTimeout,
					msExecJobEnabled: 1
				});
				message.success("已保存");
				jobFormVisible.value = false;
				jobs.value = await getJobs();
			} catch (e) {
				message.error(e.message);
			}
		}
		/**
		* 删除任务
		*
		* @param row 任务
		*/
		async function onDeleteJob(row) {
			try {
				await message.confirm(`确认删除任务 ${row.msExecJobName}?`, "删除");
			} catch {
				return;
			}
			try {
				await delJob(row.id);
				jobs.value = await getJobs();
				message.success("已删除");
			} catch (e) {
				message.error(e.message);
			}
		}
		/**
		* 归一化后端日志为表格数据
		*
		* @param logs 后端日志数组
		*/
		function normalizeLogs(logs) {
			return (logs ?? []).map((l) => ({ ...l }));
		}
		return (_ctx, _cache) => {
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReRadioButton = resolveComponent("ReRadioButton");
			const _component_ReRadioGroup = resolveComponent("ReRadioGroup");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReDrawer = resolveComponent("ReDrawer");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				lastResults.value.length ? (openBlock(), createElementBlock("section", _hoisted_2, [createBaseVNode("header", _hoisted_3, [createBaseVNode("div", null, [_cache[17] || (_cache[17] = createBaseVNode("h3", { class: "ex-head__title" }, "最近执行结果", -1)), createBaseVNode("p", _hoisted_4, toDisplayString(lastResults.value.length) + " 台主机", 1)])]), createVNode(_component_ReTable, {
					class: "ex-table",
					data: lastResults.value,
					pagination: false,
					toolbar: false,
					"layout-table": {
						minHeight: 0,
						maxHeight: 260
					}
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							prop: "msExecLogHostName",
							label: "主机",
							width: "150",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							label: "状态",
							width: "96"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["ex-status", row.msExecLogStatus === "SUCCESS" ? "is-ok" : "is-fail"]) }, [_cache[18] || (_cache[18] = createBaseVNode("i", { class: "ex-status__dot" }, null, -1)), createTextVNode(toDisplayString(row.msExecLogStatus === "SUCCESS" ? "成功" : "失败"), 1)], 2)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msExecLogOutput",
							label: "输出",
							"min-width": "220",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msExecLogError",
							label: "错误",
							"min-width": "160",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msExecLogCostMs",
							label: "耗时(ms)",
							width: "96"
						})
					]),
					_: 1
				}, 8, ["data"])])) : createCommentVNode("", true),
				createBaseVNode("section", _hoisted_5, [createBaseVNode("header", _hoisted_6, [_cache[21] || (_cache[21] = createBaseVNode("div", null, [createBaseVNode("h3", { class: "ex-head__title" }, "计划任务"), createBaseVNode("p", { class: "ex-head__desc" }, "定时任务按 cron 后台执行；脚本任务仅手动执行")], -1)), createBaseVNode("div", _hoisted_7, [
					createVNode(_component_ReButton, {
						"show-text": "",
						icon: "Document",
						onClick: openAllLogs
					}, {
						default: withCtx(() => [..._cache[19] || (_cache[19] = [createTextVNode("执行日志", -1)])]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_8, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["ex-layout-btn", { "is-active": jobLayout.value === "table" }]),
						title: "表格布局",
						onClick: _cache[0] || (_cache[0] = ($event) => setJobLayout("table"))
					}, [createVNode(_component_ReIcon, { name: "Grid" })], 2), createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["ex-layout-btn", { "is-active": jobLayout.value === "card" }]),
						title: "卡片布局",
						onClick: _cache[1] || (_cache[1] = ($event) => setJobLayout("card"))
					}, [createVNode(_component_ReIcon, { name: "Postcard" })], 2)]),
					createVNode(_component_ReButton, {
						"show-text": "",
						icon: "Plus",
						type: "primary",
						onClick: _cache[2] || (_cache[2] = ($event) => openJobForm())
					}, {
						default: withCtx(() => [..._cache[20] || (_cache[20] = [createTextVNode("新增任务", -1)])]),
						_: 1
					})
				])]), createVNode(_component_ReTable, {
					class: "ex-table",
					data: jobs.value,
					layout: jobLayout.value,
					"layout-card": {
						columns: 3,
						minWidth: 320,
						gap: 12,
						fields: [{
							prop: "msExecJobName",
							title: true
						}]
					},
					pagination: false,
					toolbar: false,
					"empty-text": "暂无计划任务，点击右上角「新增任务」创建"
				}, {
					card: withCtx(({ row }) => [createBaseVNode("div", _hoisted_15, [
						createBaseVNode("span", _hoisted_16, [_cache[24] || (_cache[24] = createBaseVNode("i", null, "cron", -1)), createBaseVNode("b", _hoisted_17, toDisplayString(jobCronText(row)), 1)]),
						createBaseVNode("span", _hoisted_18, [_cache[25] || (_cache[25] = createBaseVNode("i", null, "下次运行", -1)), createBaseVNode("b", null, toDisplayString(row.msExecJobNextRunTime || "-"), 1)]),
						createBaseVNode("span", _hoisted_19, [_cache[26] || (_cache[26] = createBaseVNode("i", null, "命令", -1)), createBaseVNode("b", _hoisted_20, toDisplayString(row.msExecJobCommand), 1)])
					]), createBaseVNode("div", _hoisted_21, [createBaseVNode("span", { class: normalizeClass(["ex-status", row.msExecJobEnabled === 1 ? "is-ok" : "is-off"]) }, [_cache[27] || (_cache[27] = createBaseVNode("i", { class: "ex-status__dot" }, null, -1)), createTextVNode(toDisplayString(row.msExecJobEnabled === 1 ? "启用" : "停用"), 1)], 2), createBaseVNode("div", _hoisted_22, [
						createBaseVNode("button", {
							class: "ex-link",
							type: "button",
							onClick: ($event) => openRunDialog(row)
						}, [..._cache[28] || (_cache[28] = [createBaseVNode("i", { class: "ex-link__dot" }, null, -1), createTextVNode("执行", -1)])], 8, _hoisted_23),
						createBaseVNode("button", {
							class: "ex-link",
							type: "button",
							onClick: ($event) => openJobLogs(row)
						}, "全部日志", 8, _hoisted_24),
						createBaseVNode("button", {
							class: "ex-link",
							type: "button",
							onClick: ($event) => openJobForm(row)
						}, "编辑", 8, _hoisted_25),
						createBaseVNode("button", {
							class: "ex-link is-danger",
							type: "button",
							onClick: ($event) => onDeleteJob(row)
						}, "删除", 8, _hoisted_26)
					])])]),
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							prop: "msExecJobName",
							label: "名称",
							"min-width": "150",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							label: "类型",
							width: "92"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["ex-pill", jobTypeClass(row)]) }, toDisplayString(jobTypeText(row)), 3)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "cron",
							width: "130"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_9, toDisplayString(jobCronText(row)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msExecJobCommand",
							label: "命令",
							"min-width": "200",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_10, toDisplayString(row.msExecJobCommand), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							prop: "msExecJobNextRunTime",
							label: "下次运行",
							width: "168"
						}),
						createVNode(_component_ReTableColumn, {
							label: "启用",
							width: "96"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["ex-status", row.msExecJobEnabled === 1 ? "is-ok" : "is-off"]) }, [_cache[22] || (_cache[22] = createBaseVNode("i", { class: "ex-status__dot" }, null, -1)), createTextVNode(toDisplayString(row.msExecJobEnabled === 1 ? "启用" : "停用"), 1)], 2)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "270"
						}, {
							default: withCtx(({ row }) => [
								createBaseVNode("button", {
									class: "ex-link",
									type: "button",
									onClick: ($event) => openRunDialog(row)
								}, [..._cache[23] || (_cache[23] = [createBaseVNode("i", { class: "ex-link__dot" }, null, -1), createTextVNode("执行", -1)])], 8, _hoisted_11),
								createBaseVNode("button", {
									class: "ex-link",
									type: "button",
									onClick: ($event) => openJobLogs(row)
								}, "全部日志", 8, _hoisted_12),
								createBaseVNode("button", {
									class: "ex-link",
									type: "button",
									onClick: ($event) => openJobForm(row)
								}, "编辑", 8, _hoisted_13),
								createBaseVNode("button", {
									class: "ex-link is-danger",
									type: "button",
									onClick: ($event) => onDeleteJob(row)
								}, "删除", 8, _hoisted_14)
							]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data", "layout"])]),
				createVNode(_component_ReDialog, {
					modelValue: jobFormVisible.value,
					"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => jobFormVisible.value = $event),
					title: editingJobId.value ? "编辑任务" : "新增任务",
					width: "600",
					height: 500,
					"confirm-text": "保存",
					"cancel-text": "取消",
					"footer-hidden": false,
					onConfirm: submitJob,
					onCancel: _cache[10] || (_cache[10] = ($event) => jobFormVisible.value = false)
				}, {
					default: withCtx(() => [createVNode(_component_ReForm, {
						"label-width": "100px",
						"label-position": "right"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReFormItem, {
								label: "任务名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: jobForm.value.msExecJobName,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => jobForm.value.msExecJobName = $event),
									placeholder: "如 每日清理临时文件"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "任务类型",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReRadioGroup, {
									modelValue: jobForm.value.msExecJobType,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => jobForm.value.msExecJobType = $event),
									button: "",
									capsule: ""
								}, {
									default: withCtx(() => [createVNode(_component_ReRadioButton, { value: "CRON" }, {
										default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("定时", -1)])]),
										_: 1
									}), createVNode(_component_ReRadioButton, { value: "NONE" }, {
										default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("脚本", -1)])]),
										_: 1
									})]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							}),
							jobForm.value.msExecJobType === "CRON" ? (openBlock(), createBlock(_component_ReFormItem, {
								key: 0,
								label: "cron 表达式",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: jobForm.value.msExecJobCron,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => jobForm.value.msExecJobCron = $event),
									placeholder: "6 域：秒 分 时 日 月 周，如 0 0 3 * * ?"
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(_component_ReFormItem, {
								label: "命令",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: jobForm.value.msExecJobCommand,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => jobForm.value.msExecJobCommand = $event),
									type: "textarea",
									rows: 3
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "目标主机ID",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: jobForm.value.hostIdText,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => jobForm.value.hostIdText = $event),
									placeholder: "逗号分隔，如 1,2,3"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "超时(秒)" }, {
								default: withCtx(() => [createVNode(_component_ReInputNumber, {
									modelValue: jobForm.value.msExecJobTimeout,
									"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => jobForm.value.msExecJobTimeout = $event),
									min: 5,
									max: 3600
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: runDialogVisible.value,
					"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => runDialogVisible.value = $event),
					title: "选择服务器（相同类型）",
					width: "560",
					"confirm-text": "执行",
					"cancel-text": "取消",
					"footer-hidden": false,
					onConfirm: confirmRun,
					onCancel: _cache[13] || (_cache[13] = ($event) => runDialogVisible.value = false)
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_27, [
						_cache[31] || (_cache[31] = createTextVNode(" 任务「", -1)),
						createBaseVNode("b", null, toDisplayString(runJobRow.value?.msExecJobName), 1),
						_cache[32] || (_cache[32] = createTextVNode("」目标类型 ", -1)),
						createBaseVNode("span", _hoisted_28, toDisplayString(osLabel(jobOsType(runJobRow.value))), 1),
						_cache[33] || (_cache[33] = createTextVNode(" —— 仅可选择与该类型一致的服务器。 ", -1))
					]), createVNode(_component_ReSelect, {
						modelValue: runHostIds.value,
						"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => runHostIds.value = $event),
						multiple: "",
						filterable: "",
						"collapse-tags": "",
						placeholder: "选择服务器",
						data: runHostOptions.value,
						class: "ex-full"
					}, null, 8, ["modelValue", "data"])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(_component_ReDrawer, {
					modelValue: logDrawerVisible.value,
					"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => logDrawerVisible.value = $event),
					title: logJobId.value ? `执行日志 · ${logJobName.value}` : "执行日志",
					direction: "rtl",
					size: "62%",
					"footer-hidden": true,
					"close-only": "",
					onCancel: _cache[16] || (_cache[16] = ($event) => logDrawerVisible.value = false)
				}, {
					content: withCtx(() => [createBaseVNode("div", _hoisted_29, [createVNode(_component_ReRadioGroup, {
						modelValue: historyType.value,
						"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => historyType.value = $event),
						button: "",
						capsule: "",
						onChange: loadHistory
					}, {
						default: withCtx(() => [
							createVNode(_component_ReRadioButton, { value: "" }, {
								default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("全部", -1)])]),
								_: 1
							}),
							createVNode(_component_ReRadioButton, { value: "COMMAND" }, {
								default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode("命令", -1)])]),
								_: 1
							}),
							createVNode(_component_ReRadioButton, { value: "FILE" }, {
								default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("文件", -1)])]),
								_: 1
							}),
							createVNode(_component_ReRadioButton, { value: "JOB" }, {
								default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode("计划任务", -1)])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["modelValue"])]), createVNode(_component_ReTable, {
						class: "ex-table",
						data: historyLogs.value,
						pagination: false,
						toolbar: false,
						"layout-table": {
							minHeight: 0,
							maxHeight: "calc(100vh - 200px)"
						},
						"empty-text": "暂无执行日志"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReTableColumn, {
								prop: "msExecLogHostName",
								label: "主机",
								width: "130",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_ReTableColumn, {
								label: "类型",
								width: "90"
							}, {
								default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_30, toDisplayString(row.msExecLogType), 1)]),
								_: 1
							}),
							createVNode(_component_ReTableColumn, {
								prop: "msExecLogCommand",
								label: "命令/路径",
								"min-width": "170",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_ReTableColumn, {
								label: "状态",
								width: "96"
							}, {
								default: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["ex-status", row.msExecLogStatus === "SUCCESS" ? "is-ok" : "is-fail"]) }, [_cache[38] || (_cache[38] = createBaseVNode("i", { class: "ex-status__dot" }, null, -1)), createTextVNode(toDisplayString(row.msExecLogStatus === "SUCCESS" ? "成功" : "失败"), 1)], 2)]),
								_: 1
							}),
							createVNode(_component_ReTableColumn, {
								prop: "msExecLogOutput",
								label: "输出",
								"min-width": "200",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_ReTableColumn, {
								prop: "msExecLogError",
								label: "错误",
								"min-width": "150",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_ReTableColumn, {
								prop: "msExecLogEndTime",
								label: "结束时间",
								width: "168"
							}),
							createVNode(_component_ReTableColumn, {
								prop: "msExecLogCostMs",
								label: "耗时(ms)",
								width: "96"
							})
						]),
						_: 1
					}, 8, ["data"])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-786f5a4b"]]);
//#endregion
export { ScExecTab_default as default };
