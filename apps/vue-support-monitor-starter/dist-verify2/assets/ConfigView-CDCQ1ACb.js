import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, ft as onUnmounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { M as saveAlarmRule, N as saveAlarmWindow, S as fetchMonitors, V as testAlarmRule, a as delAlarmRule, g as fetchAlarmWindows, h as fetchAlarmRules, i as delAlarmPolicy, j as saveAlarmPolicy, m as fetchAlarmPolicies, o as delAlarmWindow } from "./monitorApi-CwY9j0MY.js";
import { t as useDialogPrerender } from "./dialogPrerender-D19FeHAd.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
//#region src/views/ConfigView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "cf tel-page" };
var _hoisted_2 = { class: "page-header" };
var _hoisted_3 = { class: "page-actions" };
var _hoisted_4 = { class: "tabs" };
var _hoisted_5 = { class: "card-bar" };
var _hoisted_6 = {
	key: 1,
	class: "p-list"
};
var _hoisted_7 = { class: "p-main" };
var _hoisted_8 = { class: "p-name" };
var _hoisted_9 = { class: "p-hint" };
var _hoisted_10 = { class: "p-ops" };
var _hoisted_11 = { class: "card-bar" };
var _hoisted_12 = {
	key: 1,
	class: "r-list"
};
var _hoisted_13 = { class: "r-grp-title" };
var _hoisted_14 = { class: "r-main" };
var _hoisted_15 = { class: "r-metric mono" };
var _hoisted_16 = { class: "r-cond mono" };
var _hoisted_17 = { class: "r-meta" };
var _hoisted_18 = { class: "r-meta dim" };
var _hoisted_19 = { class: "r-ops" };
var _hoisted_20 = { class: "card-bar" };
var _hoisted_21 = {
	key: 1,
	class: "p-list"
};
var _hoisted_22 = { class: "p-main" };
var _hoisted_23 = { class: "p-name" };
var _hoisted_24 = { class: "r-meta mono" };
var _hoisted_25 = { class: "r-meta" };
var _hoisted_26 = { class: "p-hint" };
var _hoisted_27 = { class: "p-ops" };
var WINDOW_TICK_MS = 3e4;
//#endregion
//#region src/views/ConfigView.vue
var ConfigView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ConfigView",
	setup(__props) {
		/**
		* 监控配置 —— 告警策略 / 告警规则 管理（"设置推送"入口）
		* 基于后端 /ms/monitor/alarm/policy + /rule 的真实 CRUD。
		* 推送渠道(webhook/邮件) 依赖后端补推送渠道，此处先落策略/规则配置。
		* @author CH
		* @since 4.0.0
		*/
		const tab = ref("policy");
		const policies = ref([]);
		const rules = ref([]);
		const windows = ref([]);
		const monitors = ref([]);
		const loading = ref(false);
		const CONDITIONS = [
			{
				value: "GT",
				label: ">"
			},
			{
				value: "GE",
				label: "≥"
			},
			{
				value: "EQ",
				label: "="
			},
			{
				value: "LE",
				label: "≤"
			},
			{
				value: "LT",
				label: "<"
			}
		];
		const LEVELS = [
			"P0",
			"P1",
			"P2",
			"P3",
			"P4"
		];
		const METRICS = [
			"cpu_usage",
			"memory_usage",
			"disk_usage",
			"network_rx",
			"network_tx",
			"jvm_heap"
		];
		async function fetchAll() {
			loading.value = true;
			try {
				const [p, r, m, w] = await Promise.all([
					fetchAlarmPolicies(),
					fetchAlarmRules(),
					fetchMonitors(),
					fetchAlarmWindows()
				]);
				policies.value = p ?? [];
				rules.value = r ?? [];
				windows.value = w ?? [];
				monitors.value = (m ?? []).map((x) => ({
					id: x.id,
					monitorName: x.monitorName
				}));
			} catch (e) {
				message.error(`加载失败：${String(e?.message ?? e)}`);
			} finally {
				loading.value = false;
			}
		}
		const rulePolicyName = (pid) => policies.value.find((p) => p.id === pid)?.msMonitorAlarmPolicyName ?? `策略#${pid}`;
		/**
		* 告警条件表达式中文描述
		* @param c 条件表达式
		*/
		function condText(c) {
			return CONDITIONS.find((x) => x.value === c)?.label ?? c;
		}
		const ruleMonitorName = (mid) => {
			if (mid == null) return "全部目标";
			return monitors.value.find((m) => m.id === mid)?.monitorName ?? `目标#${mid}`;
		};
		/**
		* 策略启用状态文案
		* @param enabled 启用标记
		*/
		function policyStatus(enabled) {
			return enabled === 1 ? "运行中" : "已停用";
		}
		const policyVisible = ref(false);
		useDialogPrerender(policyVisible);
		const policySaving = ref(false);
		const policyForm = ref({
			msMonitorAlarmPolicyName: "",
			msMonitorAlarmPolicyEnabled: 1,
			msMonitorAlarmPolicyRemark: ""
		});
		/**
		* 打开新建策略弹窗
		*/
		function openPolicyAdd() {
			policyForm.value = {
				msMonitorAlarmPolicyName: "",
				msMonitorAlarmPolicyEnabled: 1,
				msMonitorAlarmPolicyRemark: ""
			};
			policyVisible.value = true;
		}
		/**
		* 打开编辑策略弹窗
		* @param p 策略
		*/
		function openPolicyEdit(p) {
			policyForm.value = { ...p };
			policyVisible.value = true;
		}
		async function submitPolicy() {
			if (!policyForm.value.msMonitorAlarmPolicyName?.trim()) {
				message.warning("请输入策略名称");
				return;
			}
			policySaving.value = true;
			try {
				await saveAlarmPolicy(policyForm.value.id ?? null, policyForm.value);
				message.success("保存成功");
				policyVisible.value = false;
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				policySaving.value = false;
			}
		}
		async function removePolicy(p) {
			await ElMessageBox.confirm(`删除策略「${p.msMonitorAlarmPolicyName}」将级联删除其所有规则，确认？`, "删除确认", { type: "warning" });
			try {
				await delAlarmPolicy(p.id);
				message.success("已删除");
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		const ruleVisible = ref(false);
		useDialogPrerender(ruleVisible);
		const ruleSaving = ref(false);
		const ruleTesting = ref(false);
		const ruleForm = ref({
			msMonitorAlarmRulePolicyId: void 0,
			msMonitorAlarmRuleMonitorId: null,
			msMonitorAlarmRuleMetricName: "cpu_usage",
			msMonitorAlarmRuleCondition: "GT",
			msMonitorAlarmRuleThreshold: 80,
			msMonitorAlarmRuleConsecutiveCount: 3,
			msMonitorAlarmRuleSilenceMinutes: 10,
			msMonitorAlarmRuleLevel: "P2",
			msMonitorAlarmRuleEnabled: 1
		});
		/**
		* 打开新建规则弹窗
		* @param policyId 所属策略 ID
		*/
		function openRuleAdd(policyId) {
			ruleForm.value = {
				msMonitorAlarmRulePolicyId: policyId ?? policies.value[0]?.id ?? 0,
				msMonitorAlarmRuleMonitorId: null,
				msMonitorAlarmRuleMetricName: "cpu_usage",
				msMonitorAlarmRuleCondition: "GT",
				msMonitorAlarmRuleThreshold: 80,
				msMonitorAlarmRuleConsecutiveCount: 3,
				msMonitorAlarmRuleSilenceMinutes: 10,
				msMonitorAlarmRuleLevel: "P2",
				msMonitorAlarmRuleEnabled: 1
			};
			ruleVisible.value = true;
		}
		/**
		* 打开编辑规则弹窗
		* @param r 规则
		*/
		function openRuleEdit(r) {
			ruleForm.value = { ...r };
			ruleVisible.value = true;
		}
		async function submitRule() {
			ruleSaving.value = true;
			try {
				await saveAlarmRule(ruleForm.value.id ?? null, ruleForm.value);
				message.success("保存成功");
				ruleVisible.value = false;
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				ruleSaving.value = false;
			}
		}
		async function removeRule(r) {
			await ElMessageBox.confirm(`删除该规则（${r.msMonitorAlarmRuleMetricName} ${condText(r.msMonitorAlarmRuleCondition)} ${r.msMonitorAlarmRuleThreshold}）？`, "删除确认", { type: "warning" });
			try {
				await delAlarmRule(r.id);
				message.success("已删除");
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		async function runRuleTest(r) {
			ruleTesting.value = true;
			try {
				const hit = await testAlarmRule(r.id, r.msMonitorAlarmRuleMetricName, Number(r.msMonitorAlarmRuleThreshold) + 1);
				message.success(hit ? `触发：模拟值 ${Number(r.msMonitorAlarmRuleThreshold) + 1} > 阈值，会告警` : "未触发（条件不满足）");
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				ruleTesting.value = false;
			}
		}
		const WEEKDAYS = [
			{
				value: "1",
				label: "周一"
			},
			{
				value: "2",
				label: "周二"
			},
			{
				value: "3",
				label: "周三"
			},
			{
				value: "4",
				label: "周四"
			},
			{
				value: "5",
				label: "周五"
			},
			{
				value: "6",
				label: "周六"
			},
			{
				value: "0",
				label: "周日"
			}
		];
		const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;
		const windowVisible = ref(false);
		useDialogPrerender(windowVisible);
		const windowSaving = ref(false);
		const windowForm = ref({});
		const windowDays = ref([]);
		/**
		* 打开新建维护窗口弹窗
		*/
		function openWindowAdd() {
			windowForm.value = {
				windowName: "",
				msMonitorAlarmMaintenanceWindowLevel: "P1",
				startTime: "00:00",
				endTime: "06:00",
				msMonitorAlarmMaintenanceWindowEnabled: 1,
				remark: ""
			};
			windowDays.value = [];
			windowVisible.value = true;
		}
		/**
		* 打开编辑维护窗口弹窗
		* @param w 维护窗口
		*/
		function openWindowEdit(w) {
			windowForm.value = { ...w };
			windowDays.value = (w.weekdays ?? "").split(",").map((s) => s.trim()).filter(Boolean);
			windowVisible.value = true;
		}
		async function submitWindow() {
			const f = windowForm.value;
			if (!f.windowName?.trim()) {
				message.warning("请输入窗口名称");
				return;
			}
			if (!HHMM.test(f.startTime ?? "") || !HHMM.test(f.endTime ?? "")) {
				message.warning("时段须为 HH:mm（如 22:00）");
				return;
			}
			windowSaving.value = true;
			try {
				await saveAlarmWindow(f.id ?? null, {
					...f,
					msMonitorAlarmMaintenanceWindowLevel: f.msMonitorAlarmMaintenanceWindowLevel ?? "",
					weekdays: windowDays.value.join(",")
				});
				message.success("保存成功");
				windowVisible.value = false;
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				windowSaving.value = false;
			}
		}
		async function removeWindow(w) {
			await ElMessageBox.confirm(`删除维护窗口「${w.windowName}」？删除后该时段将不再静默告警。`, "删除确认", { type: "warning" });
			try {
				await delAlarmWindow(w.id);
				message.success("已删除");
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		/**
		* 窗口的星期展示文本
		* @param w 维护窗口
		*/
		function windowDaysText(w) {
			const days = (w.weekdays ?? "").split(",").map((s) => s.trim()).filter(Boolean);
			if (days.length === 0) return "每天";
			return days.map((d) => WEEKDAYS.find((x) => x.value === d)?.label ?? `?${d}`).join("、");
		}
		/**
		* 窗口的级别展示文本（空级别为全局静默，命中任意级别的规则）
		* @param w 维护窗口
		*/
		function windowLevelText(w) {
			return w.msMonitorAlarmMaintenanceWindowLevel || "全局（所有级别）";
		}
		/** 窗口「当前生效」徽章的刷新节拍，避免长时间失真又不至于每分钟全量重渲染 */
		const now = ref(/* @__PURE__ */ new Date());
		let windowTimer;
		/**
		* 判定维护窗口此刻是否命中，口径与后端触发前的静默检查一致
		* @param w 维护窗口
		*/
		function windowActiveNow(w) {
			if (w.msMonitorAlarmMaintenanceWindowEnabled !== 1) return false;
			const d = now.value;
			const weekday = String(d.getDay());
			const days = (w.weekdays ?? "").split(",").map((s) => s.trim()).filter(Boolean);
			if (days.length > 0 && !days.includes(weekday)) return false;
			const [sh, sm] = (w.startTime ?? "").split(":").map(Number);
			const [eh, em] = (w.endTime ?? "").split(":").map(Number);
			if ([
				sh,
				sm,
				eh,
				em
			].some((n) => Number.isNaN(n))) return false;
			const cur = d.getHours() * 60 + d.getMinutes();
			const start = sh * 60 + sm;
			const end = eh * 60 + em;
			return start < end ? cur >= start && cur < end : cur >= start || cur < end;
		}
		const rulesGrouped = computed(() => {
			const map = /* @__PURE__ */ new Map();
			for (const r of rules.value) {
				if (!map.has(r.msMonitorAlarmRulePolicyId)) map.set(r.msMonitorAlarmRulePolicyId, []);
				map.get(r.msMonitorAlarmRulePolicyId).push(r);
			}
			return [...map.entries()];
		});
		onMounted(() => {
			fetchAll();
			windowTimer = window.setInterval(() => {
				now.value = /* @__PURE__ */ new Date();
			}, WINDOW_TICK_MS);
		});
		onUnmounted(() => {
			if (windowTimer !== void 0) window.clearInterval(windowTimer);
		});
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReStatusIndicator = resolveComponent("ReStatusIndicator");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReCard = resolveComponent("ReCard");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [_cache[30] || (_cache[30] = createBaseVNode("div", null, [createBaseVNode("h1", { class: "page-title" }, "监控配置"), createBaseVNode("p", { class: "page-desc" }, "告警策略 · 规则 · 维护窗口管理 · 通知渠道当前仅日志实现（webhook/邮件待补）")], -1)), createBaseVNode("div", _hoisted_3, [createVNode(_component_ReButton, {
					icon: "RefreshRight",
					"show-text": true,
					loading: loading.value,
					onClick: fetchAll
				}, {
					default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("刷新", -1)])]),
					_: 1
				}, 8, ["loading"])])]),
				createBaseVNode("div", _hoisted_4, [
					createVNode(_component_ReButton, {
						class: normalizeClass(["tab-btn", { active: tab.value === "policy" }]),
						"show-text": true,
						onClick: _cache[0] || (_cache[0] = ($event) => tab.value = "policy")
					}, {
						default: withCtx(() => [..._cache[31] || (_cache[31] = [createTextVNode("告警策略", -1)])]),
						_: 1
					}, 8, ["class"]),
					createVNode(_component_ReButton, {
						class: normalizeClass(["tab-btn", { active: tab.value === "rule" }]),
						"show-text": true,
						onClick: _cache[1] || (_cache[1] = ($event) => tab.value = "rule")
					}, {
						default: withCtx(() => [..._cache[32] || (_cache[32] = [createTextVNode("告警规则", -1)])]),
						_: 1
					}, 8, ["class"]),
					createVNode(_component_ReButton, {
						class: normalizeClass(["tab-btn", { active: tab.value === "window" }]),
						"show-text": true,
						onClick: _cache[2] || (_cache[2] = ($event) => tab.value = "window")
					}, {
						default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("维护窗口", -1)])]),
						_: 1
					}, 8, ["class"])
				]),
				tab.value === "policy" ? (openBlock(), createBlock(_component_ReCard, {
					key: 0,
					radius: 12,
					shadow: "never"
				}, {
					header: withCtx(() => [createBaseVNode("div", _hoisted_5, [_cache[35] || (_cache[35] = createBaseVNode("span", { class: "card-title" }, "策略总览", -1)), createVNode(_component_ReButton, {
						icon: "Plus",
						"show-text": true,
						type: "primary",
						onClick: openPolicyAdd
					}, {
						default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("新增策略", -1)])]),
						_: 1
					})])]),
					default: withCtx(() => [policies.value.length === 0 ? (openBlock(), createBlock(_component_ReEmpty, {
						key: 0,
						description: "暂无策略 —— 策略是规则的逻辑容器，停用即整组失效",
						style: { "padding": "36px 0" }
					})) : (openBlock(), createElementBlock("div", _hoisted_6, [(openBlock(true), createElementBlock(Fragment, null, renderList(policies.value, (p) => {
						return openBlock(), createElementBlock("div", {
							key: p.id,
							class: "p-row"
						}, [createBaseVNode("div", _hoisted_7, [
							createVNode(_component_ReStatusIndicator, {
								type: p.msMonitorAlarmPolicyEnabled === 1 ? "success" : "info",
								pulse: p.msMonitorAlarmPolicyEnabled === 1
							}, null, 8, ["type", "pulse"]),
							createBaseVNode("b", _hoisted_8, toDisplayString(p.msMonitorAlarmPolicyName), 1),
							createVNode(_component_ReTag, { type: p.msMonitorAlarmPolicyEnabled === 1 ? "success" : "info" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(policyStatus(p.msMonitorAlarmPolicyEnabled)), 1)]),
								_: 2
							}, 1032, ["type"]),
							createBaseVNode("span", _hoisted_9, toDisplayString(p.msMonitorAlarmPolicyRemark || "—"), 1)
						]), createBaseVNode("div", _hoisted_10, [
							createVNode(_component_ReButton, {
								icon: "Plus",
								layout: "square",
								title: "新增规则",
								onClick: ($event) => openRuleAdd(p.id)
							}, null, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "EditPen",
								layout: "square",
								title: "编辑策略",
								onClick: ($event) => openPolicyEdit(p)
							}, null, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "Delete",
								layout: "square",
								type: "danger",
								title: "删除策略",
								onClick: ($event) => removePolicy(p)
							}, null, 8, ["onClick"])
						])]);
					}), 128))]))]),
					_: 1
				})) : createCommentVNode("", true),
				tab.value === "rule" ? (openBlock(), createBlock(_component_ReCard, {
					key: 1,
					radius: 12,
					shadow: "never"
				}, {
					header: withCtx(() => [createBaseVNode("div", _hoisted_11, [_cache[37] || (_cache[37] = createBaseVNode("span", { class: "card-title" }, "规则总览", -1)), createVNode(_component_ReButton, {
						icon: "Plus",
						"show-text": true,
						type: "primary",
						onClick: _cache[3] || (_cache[3] = ($event) => openRuleAdd())
					}, {
						default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("新增规则", -1)])]),
						_: 1
					})])]),
					default: withCtx(() => [rules.value.length === 0 ? (openBlock(), createBlock(_component_ReEmpty, {
						key: 0,
						description: "暂无规则 —— 选指标 + 阈值 + 级别定义触发条件",
						style: { "padding": "36px 0" }
					})) : (openBlock(), createElementBlock("div", _hoisted_12, [(openBlock(true), createElementBlock(Fragment, null, renderList(rulesGrouped.value, ([pid, list]) => {
						return openBlock(), createElementBlock(Fragment, { key: pid }, [createBaseVNode("div", _hoisted_13, toDisplayString(rulePolicyName(pid)), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(list, (r) => {
							return openBlock(), createElementBlock("div", {
								key: r.id,
								class: "r-row"
							}, [createBaseVNode("div", _hoisted_14, [
								createVNode(_component_ReTag, {
									type: r.msMonitorAlarmRuleLevel === "P0" || r.msMonitorAlarmRuleLevel === "P1" ? "danger" : r.msMonitorAlarmRuleLevel === "P2" ? "warning" : "success",
									effect: "dark"
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(r.msMonitorAlarmRuleLevel), 1)]),
									_: 2
								}, 1032, ["type"]),
								createBaseVNode("span", _hoisted_15, toDisplayString(r.msMonitorAlarmRuleMetricName), 1),
								createBaseVNode("span", _hoisted_16, toDisplayString(condText(r.msMonitorAlarmRuleCondition)) + " " + toDisplayString(r.msMonitorAlarmRuleThreshold), 1),
								createBaseVNode("span", _hoisted_17, toDisplayString(ruleMonitorName(r.msMonitorAlarmRuleMonitorId)), 1),
								createBaseVNode("span", _hoisted_18, "连续 " + toDisplayString(r.msMonitorAlarmRuleConsecutiveCount) + " 次 · 静默 " + toDisplayString(r.msMonitorAlarmRuleSilenceMinutes) + "m", 1),
								createVNode(_component_ReTag, { type: r.msMonitorAlarmRuleEnabled === 1 ? "success" : "info" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(r.msMonitorAlarmRuleEnabled === 1 ? "启用" : "停用"), 1)]),
									_: 2
								}, 1032, ["type"])
							]), createBaseVNode("div", _hoisted_19, [
								createVNode(_component_ReButton, {
									icon: "VideoPlay",
									layout: "square",
									title: "测试规则",
									loading: ruleTesting.value,
									onClick: ($event) => runRuleTest(r)
								}, null, 8, ["loading", "onClick"]),
								createVNode(_component_ReButton, {
									icon: "EditPen",
									layout: "square",
									title: "编辑规则",
									onClick: ($event) => openRuleEdit(r)
								}, null, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "Delete",
									layout: "square",
									type: "danger",
									title: "删除规则",
									onClick: ($event) => removeRule(r)
								}, null, 8, ["onClick"])
							])]);
						}), 128))], 64);
					}), 128))]))]),
					_: 1
				})) : createCommentVNode("", true),
				tab.value === "window" ? (openBlock(), createBlock(_component_ReCard, {
					key: 2,
					radius: 12,
					shadow: "never"
				}, {
					header: withCtx(() => [createBaseVNode("div", _hoisted_20, [_cache[39] || (_cache[39] = createBaseVNode("span", { class: "card-title" }, "告警静默时段", -1)), createVNode(_component_ReButton, {
						icon: "Plus",
						"show-text": true,
						type: "primary",
						onClick: openWindowAdd
					}, {
						default: withCtx(() => [..._cache[38] || (_cache[38] = [createTextVNode("新增窗口", -1)])]),
						_: 1
					})])]),
					default: withCtx(() => [windows.value.length === 0 ? (openBlock(), createBlock(_component_ReEmpty, {
						key: 0,
						description: "暂无维护窗口 —— 命中窗口时段的告警不产生事件，用于发布/巡检静默",
						style: { "padding": "36px 0" }
					})) : (openBlock(), createElementBlock("div", _hoisted_21, [(openBlock(true), createElementBlock(Fragment, null, renderList(windows.value, (w) => {
						return openBlock(), createElementBlock("div", {
							key: w.id,
							class: "p-row"
						}, [createBaseVNode("div", _hoisted_22, [
							createVNode(_component_ReStatusIndicator, {
								type: w.msMonitorAlarmMaintenanceWindowEnabled === 1 ? "success" : "info",
								pulse: windowActiveNow(w)
							}, null, 8, ["type", "pulse"]),
							createBaseVNode("b", _hoisted_23, toDisplayString(w.windowName), 1),
							createVNode(_component_ReTag, {
								type: w.msMonitorAlarmMaintenanceWindowLevel ? "warning" : "info",
								effect: "dark"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(windowLevelText(w)), 1)]),
								_: 2
							}, 1032, ["type"]),
							createBaseVNode("span", _hoisted_24, toDisplayString(w.startTime || "—") + " ~ " + toDisplayString(w.endTime || "—"), 1),
							createBaseVNode("span", _hoisted_25, toDisplayString(windowDaysText(w)), 1),
							windowActiveNow(w) ? (openBlock(), createBlock(_component_ReTag, {
								key: 0,
								type: "success"
							}, {
								default: withCtx(() => [..._cache[40] || (_cache[40] = [createTextVNode("此刻生效", -1)])]),
								_: 1
							})) : createCommentVNode("", true),
							createBaseVNode("span", _hoisted_26, toDisplayString(w.remark || "—"), 1)
						]), createBaseVNode("div", _hoisted_27, [createVNode(_component_ReButton, {
							icon: "EditPen",
							layout: "square",
							title: "编辑窗口",
							onClick: ($event) => openWindowEdit(w)
						}, null, 8, ["onClick"]), createVNode(_component_ReButton, {
							icon: "Delete",
							layout: "square",
							type: "danger",
							title: "删除窗口",
							onClick: ($event) => removeWindow(w)
						}, null, 8, ["onClick"])])]);
					}), 128))]))]),
					_: 1
				})) : createCommentVNode("", true),
				createVNode(_component_ReDialog, {
					modelValue: policyVisible.value,
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => policyVisible.value = $event),
					title: policyForm.value.id ? "编辑策略" : "新增策略",
					width: "440px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[7] || (_cache[7] = ($event) => policyVisible.value = false) }, {
						default: withCtx(() => [..._cache[41] || (_cache[41] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						icon: "Check",
						"show-text": true,
						loading: policySaving.value,
						onClick: submitPolicy
					}, {
						default: withCtx(() => [..._cache[42] || (_cache[42] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(_component_ReForm, { "label-width": "80px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "名称" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: policyForm.value.msMonitorAlarmPolicyName,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => policyForm.value.msMonitorAlarmPolicyName = $event),
									placeholder: "如 服务器基础告警"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "状态" }, {
								default: withCtx(() => [createVNode(_component_ReSwitch, {
									modelValue: policyForm.value.msMonitorAlarmPolicyEnabled,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => policyForm.value.msMonitorAlarmPolicyEnabled = $event),
									"active-value": 1,
									"inactive-value": 0,
									"active-text": "启用",
									"inactive-text": "停用"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "备注" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: policyForm.value.msMonitorAlarmPolicyRemark,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => policyForm.value.msMonitorAlarmPolicyRemark = $event),
									type: "textarea",
									rows: 2,
									placeholder: "可选"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: ruleVisible.value,
					"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => ruleVisible.value = $event),
					title: ruleForm.value.id ? "编辑规则" : "新增规则",
					width: "520px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[18] || (_cache[18] = ($event) => ruleVisible.value = false) }, {
						default: withCtx(() => [..._cache[43] || (_cache[43] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						icon: "Check",
						"show-text": true,
						loading: ruleSaving.value,
						onClick: submitRule
					}, {
						default: withCtx(() => [..._cache[44] || (_cache[44] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(_component_ReForm, { "label-width": "96px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "所属策略" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: ruleForm.value.msMonitorAlarmRulePolicyId,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => ruleForm.value.msMonitorAlarmRulePolicyId = $event),
									style: { "width": "100%" },
									options: policies.value.map((p) => ({
										label: p.msMonitorAlarmPolicyName,
										value: p.id
									}))
								}, null, 8, ["modelValue", "options"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "目标" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: ruleForm.value.msMonitorAlarmRuleMonitorId,
									"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => ruleForm.value.msMonitorAlarmRuleMonitorId = $event),
									clearable: "",
									style: { "width": "100%" },
									options: [{
										label: "全部目标",
										value: null
									}, ...monitors.value.map((m) => ({
										label: m.monitorName,
										value: m.id
									}))]
								}, null, 8, ["modelValue", "options"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "指标" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: ruleForm.value.msMonitorAlarmRuleMetricName,
									"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => ruleForm.value.msMonitorAlarmRuleMetricName = $event),
									filterable: "",
									"allow-create": "",
									style: { "width": "100%" },
									options: METRICS.map((mt) => ({
										label: mt,
										value: mt
									}))
								}, null, 8, ["modelValue", "options"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "条件" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: ruleForm.value.msMonitorAlarmRuleCondition,
									"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => ruleForm.value.msMonitorAlarmRuleCondition = $event),
									style: { "width": "120px" },
									class: "mr",
									options: CONDITIONS.map((c) => ({
										label: c.label,
										value: c.value
									}))
								}, null, 8, ["modelValue", "options"]), createVNode(_component_ReInputNumber, {
									modelValue: ruleForm.value.msMonitorAlarmRuleThreshold,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => ruleForm.value.msMonitorAlarmRuleThreshold = $event),
									min: 0,
									step: 5,
									style: { "width": "140px" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "级别" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: ruleForm.value.msMonitorAlarmRuleLevel,
									"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => ruleForm.value.msMonitorAlarmRuleLevel = $event),
									style: { "width": "120px" },
									options: LEVELS.map((lv) => ({
										label: lv + " " + lv,
										value: lv
									}))
								}, null, 8, ["modelValue", "options"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "连续次数" }, {
								default: withCtx(() => [createVNode(_component_ReInputNumber, {
									modelValue: ruleForm.value.msMonitorAlarmRuleConsecutiveCount,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => ruleForm.value.msMonitorAlarmRuleConsecutiveCount = $event),
									min: 1,
									max: 20
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "静默(分钟)" }, {
								default: withCtx(() => [createVNode(_component_ReInputNumber, {
									modelValue: ruleForm.value.msMonitorAlarmRuleSilenceMinutes,
									"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => ruleForm.value.msMonitorAlarmRuleSilenceMinutes = $event),
									min: 0,
									max: 1440
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "状态" }, {
								default: withCtx(() => [createVNode(_component_ReSwitch, {
									modelValue: ruleForm.value.msMonitorAlarmRuleEnabled,
									"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => ruleForm.value.msMonitorAlarmRuleEnabled = $event),
									"active-value": 1,
									"inactive-value": 0,
									"active-text": "启用",
									"inactive-text": "停用"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: windowVisible.value,
					"onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => windowVisible.value = $event),
					title: windowForm.value.id ? "编辑维护窗口" : "新增维护窗口",
					width: "480px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[27] || (_cache[27] = ($event) => windowVisible.value = false) }, {
						default: withCtx(() => [..._cache[48] || (_cache[48] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						icon: "Check",
						"show-text": true,
						loading: windowSaving.value,
						onClick: submitWindow
					}, {
						default: withCtx(() => [..._cache[49] || (_cache[49] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(_component_ReForm, { "label-width": "92px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "名称" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: windowForm.value.windowName,
									"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => windowForm.value.windowName = $event),
									placeholder: "如 夜间发布静默"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "级别" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: windowForm.value.msMonitorAlarmMaintenanceWindowLevel,
									"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => windowForm.value.msMonitorAlarmMaintenanceWindowLevel = $event),
									clearable: "",
									style: { "width": "100%" },
									options: LEVELS.map((lv) => ({
										label: lv,
										value: lv
									}))
								}, null, 8, ["modelValue", "options"]), _cache[45] || (_cache[45] = createBaseVNode("div", { class: "w-hint" }, "只静默该级别的规则；留空表示全局静默（命中所有级别）", -1))]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "每日时段" }, {
								default: withCtx(() => [
									createVNode(_component_ReInput, {
										modelValue: windowForm.value.startTime,
										"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => windowForm.value.startTime = $event),
										placeholder: "22:00",
										style: { "width": "104px" },
										class: "mr"
									}, null, 8, ["modelValue"]),
									_cache[46] || (_cache[46] = createBaseVNode("span", { class: "w-sep" }, "至", -1)),
									createVNode(_component_ReInput, {
										modelValue: windowForm.value.endTime,
										"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => windowForm.value.endTime = $event),
										placeholder: "06:00",
										style: { "width": "104px" },
										class: "ml"
									}, null, 8, ["modelValue"]),
									_cache[47] || (_cache[47] = createBaseVNode("div", { class: "w-hint" }, "格式 HH:mm，支持跨午夜（22:00 ~ 06:00）；起止相同表示全天静默", -1))
								]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "星期" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: windowDays.value,
									"onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => windowDays.value = $event),
									multiple: "",
									clearable: "",
									"collapse-tags": "",
									style: { "width": "100%" },
									options: WEEKDAYS,
									placeholder: "不选表示每天"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "备注" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: windowForm.value.remark,
									"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => windowForm.value.remark = $event),
									type: "textarea",
									rows: 2,
									placeholder: "可选"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "状态" }, {
								default: withCtx(() => [createVNode(_component_ReSwitch, {
									modelValue: windowForm.value.msMonitorAlarmMaintenanceWindowEnabled,
									"onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => windowForm.value.msMonitorAlarmMaintenanceWindowEnabled = $event),
									"active-value": 1,
									"inactive-value": 0,
									"active-text": "启用",
									"inactive-text": "停用"
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
}), [["__scopeId", "data-v-bfb8558f"]]);
//#endregion
export { ConfigView_default as default };
