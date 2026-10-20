import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as ElDropdownItem, r as ElDropdownMenu, t as ElDropdown } from "./dropdown-C0jOPTGL.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { k as queryHosts, n as closeSession, w as getSessions } from "./api-CRz4q4qT.js";
//#region ../../pages/server/src/views/ScSessionTab.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "session-audit" };
var _hoisted_2 = { class: "sa-card" };
var _hoisted_3 = { class: "sa-stats" };
var _hoisted_4 = { class: "sa-stat" };
var _hoisted_5 = { class: "sa-stat__main" };
var _hoisted_6 = { class: "sa-stat__value" };
var _hoisted_7 = { class: "sa-stat__icon" };
var _hoisted_8 = { class: "sa-stat" };
var _hoisted_9 = { class: "sa-stat__main" };
var _hoisted_10 = { class: "sa-stat__value" };
var _hoisted_11 = { class: "sa-stat__icon" };
var _hoisted_12 = { class: "sa-stat" };
var _hoisted_13 = { class: "sa-stat__main" };
var _hoisted_14 = { class: "sa-stat__value" };
var _hoisted_15 = { class: "sa-stat__icon" };
var _hoisted_16 = { class: "sa-segrow" };
var _hoisted_17 = {
	class: "sa-pill",
	role: "button",
	tabindex: "0"
};
var _hoisted_18 = { class: "sa-seg" };
var _hoisted_19 = { class: "sa-filters" };
var _hoisted_20 = ["onClick"];
var _hoisted_21 = ["onClick"];
var _hoisted_22 = {
	key: 1,
	class: "sa-drawer-actions"
};
//#endregion
//#region ../../pages/server/src/views/ScSessionTab.vue
var ScSessionTab_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScSessionTab",
	setup(__props) {
		const sessions = ref([]);
		/** 加载态 */
		const loading = ref(false);
		/** 主机名映射（主机名为空时兜底展示） */
		const hostMap = ref({});
		/** 筛选表单（编辑中） */
		const form = reactive({
			keyword: "",
			protocol: "",
			ip: "",
			status: ""
		});
		/** 已应用筛选（点「查询」或状态快捷筛选后生效） */
		const applied = reactive({
			keyword: "",
			protocol: "",
			ip: "",
			status: ""
		});
		/** 详情抽屉 */
		const detailVisible = ref(false);
		const detailSession = ref(null);
		/** 协议下拉 */
		const protocolOptions = [
			{
				label: "全部协议",
				value: ""
			},
			{
				label: "SSH",
				value: "SSH"
			},
			{
				label: "RDP",
				value: "RDP"
			},
			{
				label: "VNC",
				value: "VNC"
			}
		];
		/** 状态下拉 */
		const statusOptions = [
			{
				label: "全部",
				value: ""
			},
			{
				label: "进行中",
				value: "OPEN"
			},
			{
				label: "已结束",
				value: "CLOSED"
			}
		];
		/** 统计：总连接数 / 进行中 / 已结束 */
		const stats = computed(() => {
			const list = sessions.value;
			return {
				total: list.length,
				open: list.filter((s) => s.msTerminalSessionStatus === "OPEN").length,
				closed: list.filter((s) => s.msTerminalSessionStatus === "CLOSED").length
			};
		});
		/** 应用筛选后的会话列表 */
		const filteredSessions = computed(() => {
			const kw = applied.keyword.trim().toLowerCase();
			const ip = applied.ip.trim().toLowerCase();
			return sessions.value.filter((row) => {
				if (applied.status && row.msTerminalSessionStatus !== applied.status) return false;
				if (applied.protocol && (row.msTerminalSessionProtocol || "").toUpperCase() !== applied.protocol) return false;
				if (ip && !(row.msTerminalSessionClientIp || "").toLowerCase().includes(ip)) return false;
				if (kw) {
					if (![
						row.msTerminalSessionHostName,
						row.msTerminalSessionUser,
						row.msTerminalSessionClientIp,
						hostMap.value[row.msTerminalSessionHostId ?? 0]
					].filter(Boolean).join(" ").toLowerCase().includes(kw)) return false;
				}
				return true;
			});
		});
		/** 应用筛选（查询按钮） */
		function applyFilters() {
			Object.assign(applied, form);
		}
		/**
		* 状态快捷筛选：下拉 / 分段控件共用；重复点击当前项回到「全部」
		*
		* @param value 目标状态
		*/
		function setQuickStatus(value) {
			const next = form.status === value ? "" : value;
			form.status = next;
			applied.status = next;
		}
		/**
		* 状态下拉命令
		*
		* @param command 状态值
		*/
		function onStatusCommand(command) {
			form.status = command;
			applied.status = command;
		}
		/**
		* 协议显示名
		*
		* @param protocol 协议
		*/
		function protocolLabel(protocol) {
			return (protocol || "").toUpperCase() || "-";
		}
		/**
		* 协议 pill 样式类
		*
		* @param protocol 协议
		*/
		function protoClass(protocol) {
			const v = (protocol || "").toLowerCase();
			return v === "ssh" || v === "rdp" || v === "vnc" ? `is-${v}` : "is-unknown";
		}
		/**
		* 状态显示名
		*
		* @param status 状态
		*/
		function statusLabel(status) {
			if (status === "OPEN") return "进行中";
			if (status === "CLOSED") return "已结束";
			return "全部";
		}
		/**
		* 状态文本（表格单元格）
		*
		* @param status 状态
		*/
		function statusText(status) {
			if (status === "OPEN") return "进行中";
			if (status === "CLOSED") return "已结束";
			return status || "-";
		}
		/**
		* 时间格式化（统一 yyyy-MM-dd HH:mm:ss）
		*
		* @param t 时间字符串
		*/
		function fmtTime(t) {
			if (!t) return "-";
			const s = String(t);
			if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 19);
			const d = new Date(s);
			if (Number.isNaN(d.getTime())) return s;
			const p = (n) => String(n).padStart(2, "0");
			return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
		}
		/** 打开详情 */
		function openDetail(row) {
			detailSession.value = row;
			detailVisible.value = true;
		}
		/** 刷新会话记录 */
		async function refresh() {
			loading.value = true;
			try {
				const audit = await getSessions();
				sessions.value = audit ?? [];
			} catch (e) {
				message.error(e.message);
			} finally {
				loading.value = false;
			}
		}
		/**
		* 强制关闭会话
		*
		* @param row 会话
		*/
		async function onForceClose(row) {
			const name = row.msTerminalSessionHostName || row.msTerminalSessionClientIp || String(row.id);
			try {
				await message.confirm(`确认强制关闭「${name}」的会话？`, "强制关闭");
			} catch {
				return;
			}
			try {
				await closeSession(row.id);
				message.success("已关闭");
				await refresh();
			} catch (e) {
				message.error(e.message);
			}
		}
		onMounted(async () => {
			const hosts = await queryHosts().catch(() => []);
			for (const h of hosts ?? []) hostMap.value[h.id] = h.serverHostName;
			await refresh();
		});
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReDescriptionsItem = resolveComponent("ReDescriptionsItem");
			const _component_ReDescriptions = resolveComponent("ReDescriptions");
			const _component_ReDrawer = resolveComponent("ReDrawer");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("section", _hoisted_2, [
				createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "sa-stat__label" }, [createBaseVNode("i", { class: "sa-stat__dot" }), createTextVNode("总连接数")], -1)), createBaseVNode("span", _hoisted_6, toDisplayString(stats.value.total), 1)]), createBaseVNode("span", _hoisted_7, [createVNode(_component_ReIcon, { name: "Calendar" })])]),
					createBaseVNode("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "sa-stat__label" }, [createBaseVNode("i", { class: "sa-stat__dot" }), createTextVNode("进行中")], -1)), createBaseVNode("span", _hoisted_10, toDisplayString(stats.value.open), 1)]), createBaseVNode("span", _hoisted_11, [createVNode(_component_ReIcon, { name: "CircleCheck" })])]),
					createBaseVNode("div", _hoisted_12, [createBaseVNode("div", _hoisted_13, [_cache[10] || (_cache[10] = createBaseVNode("span", { class: "sa-stat__label" }, [createBaseVNode("i", { class: "sa-stat__dot" }), createTextVNode("已结束")], -1)), createBaseVNode("span", _hoisted_14, toDisplayString(stats.value.closed), 1)]), createBaseVNode("span", _hoisted_15, [createVNode(_component_ReIcon, { name: "User" })])])
				]),
				createBaseVNode("div", _hoisted_16, [
					createVNode(unref(ElDropdown), {
						trigger: "click",
						placement: "bottom-start",
						onCommand: onStatusCommand
					}, {
						dropdown: withCtx(() => [createVNode(unref(ElDropdownMenu), null, {
							default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(statusOptions, (o) => {
								return createVNode(unref(ElDropdownItem), {
									key: o.value,
									command: o.value
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(o.label), 1)]),
									_: 2
								}, 1032, ["command"]);
							}), 64))]),
							_: 1
						})]),
						default: withCtx(() => [createBaseVNode("span", _hoisted_17, [createBaseVNode("span", null, toDisplayString(statusLabel(form.status)), 1), createVNode(_component_ReIcon, { name: "ArrowDown" })])]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_18, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["sa-seg__btn", { "is-active": form.status === "OPEN" }]),
						onClick: _cache[0] || (_cache[0] = ($event) => setQuickStatus("OPEN"))
					}, "进行中", 2), createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["sa-seg__btn", { "is-active": form.status === "CLOSED" }]),
						onClick: _cache[1] || (_cache[1] = ($event) => setQuickStatus("CLOSED"))
					}, "已结束", 2)]),
					createBaseVNode("button", {
						class: normalizeClass(["sa-refresh", { "is-loading": loading.value }]),
						type: "button",
						title: "刷新",
						onClick: refresh
					}, [createVNode(_component_ReIcon, { name: "Refresh" }), _cache[11] || (_cache[11] = createBaseVNode("span", null, "刷新", -1))], 2)
				]),
				createBaseVNode("div", _hoisted_19, [
					createVNode(_component_ReInput, {
						modelValue: form.keyword,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.keyword = $event),
						class: "sa-filters__search",
						placeholder: "搜索主机/用户/IP",
						"prefix-icon": "Search",
						clearable: "",
						onKeyup: withKeys(applyFilters, ["enter"])
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReSelect, {
						modelValue: form.protocol,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.protocol = $event),
						class: "sa-filters__select",
						options: protocolOptions,
						placeholder: "协议"
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReInput, {
						modelValue: form.ip,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.ip = $event),
						class: "sa-filters__select",
						placeholder: "IP",
						clearable: "",
						onKeyup: withKeys(applyFilters, ["enter"])
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReSelect, {
						modelValue: form.status,
						"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.status = $event),
						class: "sa-filters__select",
						options: statusOptions,
						placeholder: "状态"
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReButton, {
						class: "sa-filters__query",
						type: "primary",
						onClick: applyFilters
					}, {
						default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("查询", -1)])]),
						_: 1
					})
				]),
				createVNode(_component_ReTable, {
					class: "sa-table",
					data: filteredSessions.value,
					loading: loading.value,
					pagination: true,
					"page-size": 15,
					toolbar: false,
					"empty-text": "暂无会话记录"
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							label: "主机",
							"min-width": "150",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.msTerminalSessionHostName || hostMap.value[row.msTerminalSessionHostId ?? 0] || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "协议",
							width: "84"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["sa-proto", protoClass(row.msTerminalSessionProtocol)]) }, toDisplayString(protocolLabel(row.msTerminalSessionProtocol)), 3)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "用户",
							"min-width": "150",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.msTerminalSessionUser || row.msTerminalSessionClientIp || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "连接时间",
							"min-width": "178"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(fmtTime(row.msTerminalSessionConnectTime)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "关闭时间",
							"min-width": "178"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(fmtTime(row.msTerminalSessionCloseTime)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "状态",
							width: "96"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["sa-status", { "is-open": row.msTerminalSessionStatus === "OPEN" }]) }, [_cache[13] || (_cache[13] = createBaseVNode("i", { class: "sa-status__dot" }, null, -1)), createTextVNode(toDisplayString(statusText(row.msTerminalSessionStatus)), 1)], 2)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "132"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("button", {
								class: "sa-link",
								type: "button",
								onClick: ($event) => openDetail(row)
							}, [..._cache[14] || (_cache[14] = [createBaseVNode("i", { class: "sa-link__dot" }, null, -1), createTextVNode("详情 ", -1)])], 8, _hoisted_20), row.msTerminalSessionStatus === "OPEN" ? (openBlock(), createElementBlock("button", {
								key: 0,
								class: "sa-link is-danger",
								type: "button",
								onClick: ($event) => onForceClose(row)
							}, "强制关闭", 8, _hoisted_21)) : createCommentVNode("", true)]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data", "loading"])
			]), createVNode(_component_ReDrawer, {
				modelValue: detailVisible.value,
				"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => detailVisible.value = $event),
				title: "会话详情",
				direction: "rtl",
				size: "460px",
				"destroy-on-close": "",
				"close-only": "",
				"footer-hidden": true
			}, {
				content: withCtx(() => [detailSession.value ? (openBlock(), createBlock(_component_ReDescriptions, {
					key: 0,
					column: 1,
					border: ""
				}, {
					default: withCtx(() => [
						createVNode(_component_ReDescriptionsItem, { label: "主机" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(detailSession.value.msTerminalSessionHostName || hostMap.value[detailSession.value.msTerminalSessionHostId ?? 0] || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "协议" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(protocolLabel(detailSession.value.msTerminalSessionProtocol)), 1)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "用户" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(detailSession.value.msTerminalSessionUser || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "客户端 IP" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(detailSession.value.msTerminalSessionClientIp || "-"), 1)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "连接时间" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(fmtTime(detailSession.value.msTerminalSessionConnectTime)), 1)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "关闭时间" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(fmtTime(detailSession.value.msTerminalSessionCloseTime)), 1)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "状态" }, {
							default: withCtx(() => [createBaseVNode("span", { class: normalizeClass(["sa-status", { "is-open": detailSession.value.msTerminalSessionStatus === "OPEN" }]) }, [_cache[15] || (_cache[15] = createBaseVNode("i", { class: "sa-status__dot" }, null, -1)), createTextVNode(toDisplayString(statusText(detailSession.value.msTerminalSessionStatus)), 1)], 2)]),
							_: 1
						}),
						createVNode(_component_ReDescriptionsItem, { label: "关闭原因" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(detailSession.value.msTerminalSessionCloseReason || "-"), 1)]),
							_: 1
						})
					]),
					_: 1
				})) : createCommentVNode("", true), detailSession.value?.msTerminalSessionStatus === "OPEN" ? (openBlock(), createElementBlock("div", _hoisted_22, [createVNode(_component_ReButton, {
					type: "danger",
					onClick: _cache[6] || (_cache[6] = ($event) => onForceClose(detailSession.value))
				}, {
					default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("强制关闭", -1)])]),
					_: 1
				})])) : createCommentVNode("", true)]),
				_: 1
			}, 8, ["modelValue"])]);
		};
	}
}), [["__scopeId", "data-v-5375f703"]]);
//#endregion
export { ScSessionTab_default as default };
