import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, T as createStaticVNode, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, u as Teleport, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, t as Transition, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElTooltip } from "./tooltip-DEX5DBfd.js";
import { $t as top_default, Bt as search_default, C as close_bold_default, Ct as operation_default, D as connection_default, G as edit_pen_default, I as delete_default, Nt as refresh_default, U as download_default, W as edit_default, X as folder_add_default, Zt as tickets_default, a as arrow_right_default, b as circle_close_default, dn as view_default, dt as loading_default, et as grid_default, f as caret_bottom_default, ht as menu_default, i as arrow_left_default, it as home_filled_default, k as cpu_default, l as box_default, p as caret_right_default, rn as upload_default, st as key_default, v as circle_check_default, vt as monitor_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { n as ElDropdownItem, r as ElDropdownMenu, t as ElDropdown } from "./dropdown-C0jOPTGL.js";
import { t as ElProgress } from "./progress-BYZHa216.js";
import { y as useSocketService, yt as message } from "./src-CEonioA3.js";
import { t as ElPopover } from "./popover-BedfGaMS.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { A as restartService, B as submitAgentAction, D as readHostFileContent, E as mkdirHostFile, H as uploadHostFile, I as sectionRows, L as setHostEnvVar, O as renameHostFile, P as saveHostPerms, R as startService, T as killProcess, U as writeHostFileContent, _ as fetchHostFiles, b as fetchHostProfileSection, c as deleteHostFile, k as restartHostProcess, l as downloadHostFile, r as closeNetProcess, s as deleteHostEnvVar, v as fetchHostPerms, y as fetchHostProfile, z as stopService } from "./monitorApi-CwY9j0MY.js";
import { t as useDialogPrerender } from "./dialogPrerender-D19FeHAd.js";
import { D as listBoundIdentities, J as unbindIdentity, M as saveHost, R as scanPorts, _ as getGroups, f as fetchLocalAddress, k as queryHosts, o as delHost, q as testPrometheusHost, t as bindIdentity, v as getHost, y as getIdentities } from "./api-CRz4q4qT.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { t as osIconSvg } from "./osIcon-CfmjFf8B.js";
import { D as init } from "./echarts-compat-C1tiQKE2.js";
import { t as HostNetworkAdapters_default } from "./HostNetworkAdapters-BYa3R-uu.js";
import { t as ReProgressTask_default } from "./ReProgressTask-BaF_rmdP.js";
import { t as component$1 } from "./ReStatCard-BGjVHdD2.js";
//#region src/views/HostFormDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$7 = { class: "form-grid" };
var _hoisted_2$6 = {
	key: 0,
	class: "addr-hint"
};
var _hoisted_3$6 = { class: "os-picker" };
var _hoisted_4$6 = ["innerHTML"];
var _hoisted_5$6 = ["onClick"];
var _hoisted_6$4 = ["innerHTML"];
var _hoisted_7$4 = { class: "os-picker-label" };
var _hoisted_8$4 = { class: "switch-row" };
var _hoisted_9$4 = { class: "switch-extra-label" };
var _hoisted_10$4 = { class: "switch-row" };
var _hoisted_11$3 = {
	key: 0,
	class: "switch-extra"
};
var _hoisted_12$3 = { class: "switch-row" };
var _hoisted_13$3 = {
	key: 0,
	class: "switch-extra"
};
var _hoisted_14$3 = { class: "switch-row" };
var _hoisted_15$3 = {
	key: 0,
	class: "switch-extra"
};
var _hoisted_16$3 = { class: "switch-row" };
var _hoisted_17$3 = { class: "switch-extra-label" };
var _hoisted_18$3 = { style: {
	"display": "flex",
	"gap": "8px",
	"align-items": "center"
} };
var _hoisted_19$3 = {
	key: 0,
	style: { "color": "#67c23a" }
};
var _hoisted_20$3 = {
	key: 1,
	style: { "color": "#909399" }
};
var _hoisted_21$3 = { style: {
	"display": "flex",
	"gap": "8px"
} };
var _hoisted_22$3 = { style: {
	"display": "flex",
	"gap": "8px",
	"align-items": "center"
} };
var _hoisted_23$3 = {
	key: 0,
	style: { "color": "#67c23a" }
};
var _hoisted_24$3 = {
	key: 1,
	style: { "color": "#909399" }
};
var _hoisted_25$3 = { style: {
	"display": "flex",
	"gap": "8px",
	"align-items": "center"
} };
//#endregion
//#region src/views/HostFormDialog.vue
var HostFormDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "HostFormDialog",
	props: {
		modelValue: { type: Boolean },
		isEdit: { type: Boolean },
		host: {},
		identityOptions: {},
		groupOptions: {}
	},
	emits: [
		"update:modelValue",
		"saved",
		"deploy-agent"
	],
	setup(__props, { emit: __emit }) {
		/**
		* 主机新增/编辑弹窗（独立子组件）
		* 从 AssetsView 拆出：弹窗打开/渲染只在自身组件内进行，不再触发 AssetsView 巨型组件全量 diff
		* @author CH
		* @since 4.0.0
		*/
		const props = __props;
		const router = useRouter();
		const emit = __emit;
		const formSaving = ref(false);
		/** 标签编辑用文本（逗号分隔），提交时写成 serverHostTags */
		const tagsText = ref("");
		const form = ref({
			serverHostName: "",
			serverHostAddress: "",
			serverHostPort: 22,
			serverHostOsType: "LINUX",
			serverHostSshEnabled: 1,
			serverHostCollectMode: "AGENT"
		});
		/** 平台选项（只表达操作系统；图标统一走 utils/osIcon 的常规单色图标） */
		const osOptions = [
			{
				label: "Linux",
				value: "LINUX"
			},
			{
				label: "Windows",
				value: "WINDOWS"
			},
			{
				label: "macOS",
				value: "MACOS"
			}
		];
		/** 认证方式 */
		const formAuthMethod = ref("IDENTITY");
		/** 从身份列表选择 */
		const formIdentityId = ref(null);
		const formIdentityChanged = ref(false);
		/** 登录凭据（瞬态） */
		const formAccount = ref("");
		const formPassword = ref("");
		const formPrivateKey = ref("");
		const hostBoundIdentities = ref([]);
		/** Prometheus 凭据校验 */
		const promVerifying = ref(false);
		const promVerified = ref(false);
		/** 分组下拉：末尾追加「+ 添加分组」哨兵项（value=-1），点击跳转分组管理页 */
		const groupOptionsWithAdd = computed(() => [...props.groupOptions, {
			label: "+ 添加分组",
			value: -1
		}]);
		/** 分组变更：选中「+ 添加分组」时重置并跳转分组管理页 */
		function onGroupChange(v) {
			if (v === -1) {
				form.value.msServerGroupId = null;
				router.push("/groups");
			}
		}
		/** Prometheus 凭据校验：调用后端 /metrics 连通性测试 */
		async function verifyPrometheus() {
			if (!form.value.id) {
				message.warning("请先保存主机后再校验 Prometheus");
				return;
			}
			promVerifying.value = true;
			try {
				const msg = await testPrometheusHost(form.value.id);
				promVerified.value = true;
				message.success(msg || "校验成功");
			} catch (e) {
				promVerified.value = false;
				message.error(String(e?.message ?? e));
			} finally {
				promVerifying.value = false;
			}
		}
		const authMethods = [
			{
				label: "默认身份（绑定）",
				value: "IDENTITY"
			},
			{
				label: "账号密码",
				value: "PASSWORD"
			},
			{
				label: "SSH 私钥",
				value: "PUBLIC_KEY"
			}
		];
		const collectModes = [
			{
				label: "不采集",
				value: "NONE"
			},
			{
				label: "OpenSSH采集",
				value: "OPENSSH"
			},
			{
				label: "Agent采集",
				value: "AGENT"
			},
			{
				label: "Prometheus采集",
				value: "PROMETHEUS"
			},
			{
				label: "本机自采集(OSHI)",
				value: "LOCAL"
			}
		];
		/** 本机自采集：被管对象就是服务端所在机器，平台由后端按本机操作系统判定 */
		const isLocalCollect = computed(() => form.value.serverHostCollectMode === "LOCAL");
		/**
		* 平台选择：本机切到 LOCAL 采集（真实平台由后端按本机 OS 覆盖、地址识别物理网卡 IP），
		* 其余为真实操作系统。
		* @param value 平台值
		*/
		function selectPlatform(value) {
			if (value === "LOCAL") {
				form.value.serverHostCollectMode = "LOCAL";
				form.value.serverHostRemoteProtocol = "VNC";
				loadLocalAddress();
				return;
			}
			form.value.serverHostOsType = value;
			form.value.serverHostSshEnabled = value === "WINDOWS" ? 0 : 1;
			if (form.value.serverHostCollectMode === "LOCAL") form.value.serverHostCollectMode = "AGENT";
		}
		/**
		* 平台项是否选中：本机以采集方式判定，其余以操作系统判定。
		* @param value 平台值
		*/
		function platformActive(value) {
			if (value === "LOCAL") return isLocalCollect.value;
			return !isLocalCollect.value && form.value.serverHostOsType === value;
		}
		/** 远控协议：空值表示按平台推断（Windows→RDP，macOS→VNC，其余 SSH） */
		const remoteProtocols = [
			{
				label: "自动（按平台）",
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
		/** 本机采集方式仅「不采集 / 本机自采集」，其余主机显示全部 */
		const collectModeOptions = computed(() => isLocalCollect.value ? collectModes.filter((m) => m.value === "NONE" || m.value === "LOCAL") : collectModes);
		/** 本机远控仅支持 VNC，其余主机显示全部协议 */
		const remoteProtocolOptions = computed(() => isLocalCollect.value ? [{
			label: "VNC",
			value: "VNC"
		}] : remoteProtocols);
		/** 识别本机首选网卡 IP（远控不使用回环），写入地址字段 */
		async function loadLocalAddress() {
			try {
				const ip = await fetchLocalAddress();
				if (ip) form.value.serverHostAddress = ip;
			} catch {}
		}
		watch(isLocalCollect, (local) => {
			if (local) {
				form.value.serverHostRemoteProtocol = "VNC";
				loadLocalAddress();
			}
		});
		/** 远控通道：GUACD 走 guacd 中转；DIRECT 由平台自身协议客户端直连（SSH/VNC）；NONE 不经平台通道 */
		const remoteModes = [
			{
				label: "Guacd 中转",
				value: "GUACD"
			},
			{
				label: "平台直连",
				value: "DIRECT"
			},
			{
				label: "无需通道",
				value: "NONE"
			}
		];
		/** 生效协议（含按平台推断），决定默认端口与口令字段 */
		const effectiveRemoteProtocol = computed(() => {
			const p = (form.value.serverHostRemoteProtocol ?? "").toUpperCase();
			if (p === "SSH" || p === "RDP" || p === "VNC") return p;
			const os = (form.value.serverHostOsType ?? "").toUpperCase();
			if (os.includes("WIN")) return "RDP";
			if (os.includes("MAC")) return "VNC";
			return "SSH";
		});
		/** 各协议默认端口 */
		const REMOTE_DEFAULT_PORT = {
			SSH: 22,
			RDP: 3389,
			VNC: 5900
		};
		/** 端口占位提示（留空即按默认端口连接） */
		const remotePortPlaceholder = computed(() => `默认 ${REMOTE_DEFAULT_PORT[effectiveRemoteProtocol.value]}`);
		/** 平台自研直连通道覆盖 SSH（MINA SSHD）与 VNC（RFB）；RDP 必须经 guacd */
		const DIRECT_SUPPORTED = ["SSH", "VNC"];
		const directSupported = computed(() => DIRECT_SUPPORTED.includes(effectiveRemoteProtocol.value));
		/** RDP 只能由 guacd 渲染，通道锁定不可选 */
		const channelEditable = computed(() => effectiveRemoteProtocol.value !== "RDP");
		/** 当前协议下可选通道 */
		const channelOptions = computed(() => remoteModes.filter((m) => m.value !== "DIRECT" || directSupported.value));
		watch(effectiveRemoteProtocol, (protocol) => {
			if (protocol === "RDP") form.value.serverHostRemoteMode = "GUACD";
			else if (form.value.serverHostRemoteMode === "DIRECT" && !DIRECT_SUPPORTED.includes(protocol)) form.value.serverHostRemoteMode = "GUACD";
		});
		const verifying = ref(false);
		const deploying = ref(false);
		const credVerified = ref(false);
		async function verifyCredentials() {
			if (!form.value.id) {
				message.warning("请先保存主机后再校验凭据");
				return;
			}
			verifying.value = true;
			try {
				const detected = await http().post(`/ms/server/host/${form.value.id}/detect`).timeout(12e4).then((r) => unwrapResult(r));
				if (detected && typeof detected === "object") form.value = {
					...form.value,
					...detected
				};
				credVerified.value = true;
				message.success("凭据校验成功");
			} catch (e) {
				credVerified.value = false;
				message.error("凭据校验失败：" + String(e?.message ?? e));
			} finally {
				verifying.value = false;
			}
		}
		async function testAgentConnection() {
			try {
				const r = await http().get(`/ms/monitor/host/agent/test/${form.value.id}`).then((r) => unwrapResult(r));
				if (r?.available) {
					form.value.serverHostAgentInstalled = 1;
					message.success("Agent 连接成功，已标记为已安装");
				} else message.error("Agent 连接失败：" + (r?.msg || "无法连接"));
			} catch (e) {
				message.error("Agent 连接测试失败");
			}
		}
		async function deployAgent() {
			deploying.value = true;
			try {
				const hostId = form.value.id;
				if (!hostId) {
					message.warning("请先保存主机信息");
					return;
				}
				emit("update:modelValue", false);
				emit("deploy-agent", {
					id: hostId,
					serverHostName: form.value.serverHostName ?? "",
					action: "install"
				});
				message.success("Agent 部署已启动");
			} catch (e) {
				message.error("Agent 部署失败");
			} finally {
				deploying.value = false;
			}
		}
		async function resolvePackagePath(configKey, fallback) {
			try {
				const p = (await http().get("/ms/server/config/map").then((r) => unwrapResult(r)))?.[configKey];
				if (typeof p === "string" && p) {
					if (p.startsWith("http://") || p.startsWith("https://")) return p;
					return "/" + p.replace(/^\/+/, "");
				}
			} catch {}
			return "/" + fallback;
		}
		function downloadAgent() {
			resolvePackagePath("agent.package.path", "monitor-agent/monitor-agent.tar.gz").then((url) => window.open(url, "_blank"));
		}
		function downloadPrometheus() {
			resolvePackagePath("prometheus.package.path", "prometheus/prometheus.tar.gz").then((url) => window.open(url, "_blank"));
		}
		/**
		* 逗号分隔标签拆分为数组
		* @param tags 标签字符串
		*/
		function splitTags(tags) {
			if (!tags) return [];
			return tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
		}
		/**
		* 重置表单
		*/
		function resetForm() {
			form.value = {
				serverHostName: "",
				serverHostAddress: "",
				serverHostPort: 22,
				serverHostOsType: "LINUX",
				serverHostSshEnabled: 1,
				serverHostCollectMode: "AGENT",
				msServerGroupId: null,
				serverHostTags: "",
				serverHostDescription: "",
				serverHostCode: "",
				serverHostCollectEnabled: 1,
				serverHostCollectInterval: 15,
				serverHostOnlineEnabled: 1,
				serverHostOnlineInterval: 60,
				serverHostRemoteEnabled: 1,
				serverHostRemoteProtocol: "",
				serverHostRemoteMode: "GUACD",
				serverHostRemotePort: null,
				serverHostVncPassword: "",
				serverHostAgentEnabled: 0,
				serverHostDelayEnabled: 1,
				serverHostDelayInterval: 60
			};
			tagsText.value = "";
			formAuthMethod.value = "IDENTITY";
			formIdentityId.value = null;
			formIdentityChanged.value = false;
			formAccount.value = "";
			formPassword.value = "";
			formPrivateKey.value = "";
			hostBoundIdentities.value = [];
		}
		/**
		* 校验表单必填项
		*/
		function validForm() {
			if (!form.value.serverHostName?.trim()) {
				message.warning("请输入主机名");
				return false;
			}
			if (!form.value.serverHostAddress?.trim()) {
				message.warning("请输入地址");
				return false;
			}
			if (!form.value.serverHostPort) {
				message.warning("请输入端口");
				return false;
			}
			return true;
		}
		async function submitForm() {
			if (!validForm()) return;
			form.value.serverHostTags = tagsText.value.split(",").map((t) => t.trim()).filter(Boolean).join(",");
			form.value.serverHostCollectEnabled = form.value.serverHostCollectEnabled ? 1 : 0;
			form.value.serverHostOnlineEnabled = form.value.serverHostOnlineEnabled ? 1 : 0;
			form.value.serverHostRemoteEnabled = form.value.serverHostRemoteEnabled ? 1 : 0;
			form.value.serverHostAgentEnabled = form.value.serverHostAgentEnabled ? 1 : 0;
			form.value.serverHostDelayEnabled = form.value.serverHostDelayEnabled ? 1 : 0;
			const remoteProtocol = (form.value.serverHostRemoteProtocol || "").toUpperCase() || null;
			form.value.serverHostRemoteProtocol = remoteProtocol;
			if (effectiveRemoteProtocol.value === "RDP" || form.value.serverHostRemoteMode === "DIRECT" && !directSupported.value) form.value.serverHostRemoteMode = "GUACD";
			if (!form.value.serverHostRemoteMode) form.value.serverHostRemoteMode = "GUACD";
			if (remoteProtocol && remoteProtocol !== "VNC") form.value.serverHostVncPassword = null;
			if (form.value.serverHostRemotePort === 0) form.value.serverHostRemotePort = null;
			if (formAuthMethod.value === "PASSWORD") {
				form.value.serverHostAccount = formAccount.value || null;
				form.value.serverHostPassword = formPassword.value || null;
				form.value.serverHostPrivateKey = null;
			} else if (formAuthMethod.value === "PUBLIC_KEY") {
				form.value.serverHostAccount = formAccount.value || null;
				form.value.serverHostPassword = null;
				form.value.serverHostPrivateKey = formPrivateKey.value || null;
			} else {
				form.value.serverHostAccount = null;
				form.value.serverHostPassword = null;
				form.value.serverHostPrivateKey = null;
			}
			formSaving.value = true;
			try {
				const res = await saveHost(props.isEdit ? form.value.id ?? null : null, form.value);
				const savedId = props.isEdit ? form.value.id : res?.id ?? null;
				let hostId = props.isEdit ? form.value.id : null;
				if (!hostId && savedId) hostId = Number(savedId);
				if (hostId && formIdentityChanged.value && formIdentityId.value != null) await bindIdentity(hostId, formIdentityId.value);
				message.success(props.isEdit ? "已更新" : "已新增");
				emit("update:modelValue", false);
				emit("saved");
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				formSaving.value = false;
			}
		}
		watch(() => props.modelValue, (v) => {
			if (!v) return;
			if (props.isEdit && props.host) {
				form.value = { ...props.host };
				if (form.value.serverHostCollectEnabled == null) form.value.serverHostCollectEnabled = 1;
				if (form.value.serverHostOnlineEnabled == null) form.value.serverHostOnlineEnabled = 1;
				if (form.value.serverHostRemoteEnabled == null) form.value.serverHostRemoteEnabled = 1;
				if (form.value.serverHostDelayEnabled == null) form.value.serverHostDelayEnabled = 1;
				if (form.value.serverHostAgentEnabled == null) form.value.serverHostAgentEnabled = 0;
				if (form.value.serverHostSshEnabled == null) form.value.serverHostSshEnabled = (form.value.serverHostOsType || "").toUpperCase() === "WINDOWS" ? 0 : 1;
				if (!form.value.serverHostRemoteMode) form.value.serverHostRemoteMode = "GUACD";
				if (!form.value.serverHostCollectMode) form.value.serverHostCollectMode = "AGENT";
				tagsText.value = splitTags(form.value.serverHostTags).join(", ");
				formAuthMethod.value = "IDENTITY";
				formAccount.value = "";
				formPassword.value = "";
				formPrivateKey.value = "";
				formIdentityChanged.value = false;
				formIdentityId.value = null;
				hostBoundIdentities.value = [];
				Promise.all([getHost(props.host.id).catch(() => props.host), listBoundIdentities(props.host.id).catch(() => [])]).then(([full, bound]) => {
					if (!props.modelValue) return;
					form.value = {
						...form.value,
						...full ?? {}
					};
					tagsText.value = splitTags(form.value.serverHostTags).join(", ");
					const bindList = Array.isArray(bound) ? bound : [];
					if (formIdentityId.value == null && bindList.length > 0) formIdentityId.value = bindList[0];
					hostBoundIdentities.value = bindList;
					if (isLocalCollect.value) {
						form.value.serverHostRemoteProtocol = "VNC";
						loadLocalAddress();
					}
				});
			} else resetForm();
		});
		return (_ctx, _cache) => {
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createBlock(_component_ReDialog, {
				"model-value": props.modelValue,
				"onUpdate:modelValue": _cache[29] || (_cache[29] = (v) => emit("update:modelValue", v)),
				title: props.isEdit ? "编辑主机" : "新增主机",
				width: "880px",
				height: 900,
				"close-on-click-modal": false
			}, {
				footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[28] || (_cache[28] = ($event) => emit("update:modelValue", false)) }, {
					default: withCtx(() => [..._cache[50] || (_cache[50] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(_component_ReButton, {
					type: "primary",
					loading: formSaving.value,
					onClick: submitForm,
					icon: "Check",
					"show-text": true
				}, {
					default: withCtx(() => [..._cache[51] || (_cache[51] = [createTextVNode("保存", -1)])]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [createVNode(_component_ReForm, {
					model: form.value,
					"label-position": "top",
					class: "form-vertical"
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_1$7, [
						_cache[45] || (_cache[45] = createBaseVNode("div", { class: "form-section full" }, "基本信息", -1)),
						createVNode(unref(ReFormItem), {
							label: "主机名称",
							class: "col-span-2",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.value.serverHostName,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.value.serverHostName = $event),
								placeholder: "如 prod-nginx-01",
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), {
							label: "主机地址",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.value.serverHostAddress,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.value.serverHostAddress = $event),
								placeholder: "IP 或域名",
								style: { "width": "100%" }
							}, null, 8, ["modelValue"]), isLocalCollect.value ? (openBlock(), createElementBlock("div", _hoisted_2$6, "本机地址由系统识别（物理网卡 IP），远控不使用回环地址")) : createCommentVNode("", true)]),
							_: 1
						}),
						createVNode(unref(ReFormItem), { label: "端口" }, {
							default: withCtx(() => [createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostPort,
								"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.serverHostPort = $event),
								min: 1,
								max: 65535,
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), {
							label: "平台",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_3$6, [createBaseVNode("div", {
								class: normalizeClass(["os-picker-item", { active: platformActive("LOCAL") }]),
								onClick: _cache[3] || (_cache[3] = ($event) => selectPlatform("LOCAL"))
							}, [createBaseVNode("span", {
								class: "os-picker-ico",
								innerHTML: unref(osIconSvg)("LOCAL")
							}, null, 8, _hoisted_4$6), _cache[30] || (_cache[30] = createBaseVNode("span", { class: "os-picker-label" }, "本机", -1))], 2), (openBlock(), createElementBlock(Fragment, null, renderList(osOptions, (opt) => {
								return createBaseVNode("div", {
									key: opt.value,
									class: normalizeClass(["os-picker-item", { active: platformActive(opt.value) }]),
									onClick: ($event) => selectPlatform(opt.value)
								}, [createBaseVNode("span", {
									class: "os-picker-ico",
									innerHTML: unref(osIconSvg)(opt.value)
								}, null, 8, _hoisted_6$4), createBaseVNode("span", _hoisted_7$4, toDisplayString(opt.label), 1)], 10, _hoisted_5$6);
							}), 64))])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), {
							label: "主机编码",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.value.serverHostCode,
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.serverHostCode = $event),
								placeholder: "唯一编码（可选）",
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						!isLocalCollect.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
							_cache[31] || (_cache[31] = createBaseVNode("div", { class: "form-section full" }, "认证方式", -1)),
							createVNode(unref(ReFormItem), { label: "登录方式" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: formAuthMethod.value,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => formAuthMethod.value = $event),
									style: { "width": "100%" },
									options: authMethods
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							formAuthMethod.value === "IDENTITY" ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 0,
								label: "绑定身份",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: formIdentityId.value,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => formIdentityId.value = $event),
									placeholder: "使用默认凭据",
									clearable: "",
									style: { "width": "100%" },
									options: props.identityOptions
								}, null, 8, ["modelValue", "options"])]),
								_: 1
							})) : createCommentVNode("", true),
							formAuthMethod.value === "PASSWORD" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [createVNode(unref(ReFormItem), { label: "登录账号" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formAccount.value,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => formAccount.value = $event),
									placeholder: "如 root / ubuntu",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}), createVNode(unref(ReFormItem), {
								label: "登录密码",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formPassword.value,
									"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => formPassword.value = $event),
									type: "password",
									"show-password": "",
									placeholder: "SSH 口令",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})], 64)) : createCommentVNode("", true),
							formAuthMethod.value === "PUBLIC_KEY" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [createVNode(unref(ReFormItem), { label: "登录账号" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formAccount.value,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => formAccount.value = $event),
									placeholder: "如 root / ubuntu",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}), createVNode(unref(ReFormItem), {
								label: "SSH 私钥",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: formPrivateKey.value,
									"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => formPrivateKey.value = $event),
									type: "textarea",
									rows: 3,
									placeholder: "粘贴 PEM 格式私钥内容",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})], 64)) : createCommentVNode("", true)
						], 64)) : createCommentVNode("", true),
						_cache[46] || (_cache[46] = createBaseVNode("div", { class: "form-section full" }, "分组与标签", -1)),
						createVNode(unref(ReFormItem), { label: "分组" }, {
							default: withCtx(() => [createVNode(_component_ReSelect, {
								modelValue: form.value.msServerGroupId,
								"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.value.msServerGroupId = $event),
								clearable: "",
								placeholder: "未分组",
								style: { "width": "100%" },
								options: groupOptionsWithAdd.value,
								onChange: onGroupChange
							}, null, 8, ["modelValue", "options"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), { label: "标签" }, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: tagsText.value,
								"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => tagsText.value = $event),
								placeholder: "逗号分隔，如 prod,db,linux",
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), {
							label: "描述",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.value.serverHostDescription,
								"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.value.serverHostDescription = $event),
								type: "textarea",
								rows: 1,
								placeholder: "主机用途 / 备注（可选）",
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						_cache[47] || (_cache[47] = createBaseVNode("div", { class: "form-section full" }, "执行通道", -1)),
						createVNode(unref(ReFormItem), {
							label: "开启 SSH",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_8$4, [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostSshEnabled,
								"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => form.value.serverHostSshEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"]), createBaseVNode("span", _hoisted_9$4, toDisplayString(form.value.serverHostSshEnabled === 1 ? "发布/命令执行等基于 OpenSSH 的能力可用" : "未开启 SSH（Windows 需先启用 OpenSSH）"), 1)])]),
							_: 1
						}),
						_cache[48] || (_cache[48] = createBaseVNode("div", { class: "form-section full" }, "采集配置", -1)),
						createVNode(unref(ReFormItem), {
							label: "采集方式",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createVNode(_component_ReSelect, {
								modelValue: form.value.serverHostCollectMode,
								"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.value.serverHostCollectMode = $event),
								style: { "width": "100%" },
								options: collectModeOptions.value
							}, null, 8, ["modelValue", "options"])]),
							_: 1
						}),
						form.value.serverHostCollectMode !== "NONE" ? (openBlock(), createBlock(unref(ReFormItem), {
							key: 1,
							label: "自动采集",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_10$4, [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostCollectEnabled,
								"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => form.value.serverHostCollectEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"]), form.value.serverHostCollectEnabled === 1 ? (openBlock(), createElementBlock("div", _hoisted_11$3, [_cache[32] || (_cache[32] = createBaseVNode("span", { class: "switch-extra-label" }, "间隔(秒)", -1)), createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostCollectInterval,
								"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => form.value.serverHostCollectInterval = $event),
								min: 5,
								max: 86400,
								style: { "width": "180px" }
							}, null, 8, ["modelValue"])])) : createCommentVNode("", true)])]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(unref(ReFormItem), {
							label: "在线检测",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_12$3, [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostOnlineEnabled,
								"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => form.value.serverHostOnlineEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"]), form.value.serverHostOnlineEnabled === 1 ? (openBlock(), createElementBlock("div", _hoisted_13$3, [_cache[33] || (_cache[33] = createBaseVNode("span", { class: "switch-extra-label" }, "间隔(秒)", -1)), createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostOnlineInterval,
								"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => form.value.serverHostOnlineInterval = $event),
								min: 5,
								max: 3600,
								style: { "width": "180px" }
							}, null, 8, ["modelValue"])])) : createCommentVNode("", true)])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), {
							label: "延迟检测",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_14$3, [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostDelayEnabled,
								"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => form.value.serverHostDelayEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"]), form.value.serverHostDelayEnabled === 1 ? (openBlock(), createElementBlock("div", _hoisted_15$3, [_cache[34] || (_cache[34] = createBaseVNode("span", { class: "switch-extra-label" }, "间隔(秒)", -1)), createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostDelayInterval,
								"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => form.value.serverHostDelayInterval = $event),
								min: 5,
								max: 3600,
								style: { "width": "180px" }
							}, null, 8, ["modelValue"])])) : createCommentVNode("", true)])]),
							_: 1
						}),
						_cache[49] || (_cache[49] = createBaseVNode("div", { class: "form-section full" }, "远控配置", -1)),
						createVNode(unref(ReFormItem), {
							label: "远程控制",
							class: "col-span-2"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_16$3, [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostRemoteEnabled,
								"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => form.value.serverHostRemoteEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"]), createBaseVNode("span", _hoisted_17$3, toDisplayString(form.value.serverHostRemoteEnabled === 1 ? "允许从资产页发起远控" : "禁止远控"), 1)])]),
							_: 1
						}),
						form.value.serverHostRemoteEnabled === 1 ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
							createVNode(unref(ReFormItem), { label: "远控协议" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.serverHostRemoteProtocol,
									"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => form.value.serverHostRemoteProtocol = $event),
									style: { "width": "100%" },
									options: remoteProtocolOptions.value
								}, null, 8, ["modelValue", "options"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "远控通道" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.serverHostRemoteMode,
									"onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => form.value.serverHostRemoteMode = $event),
									style: { "width": "100%" },
									disabled: !channelEditable.value,
									options: channelOptions.value
								}, null, 8, [
									"modelValue",
									"disabled",
									"options"
								])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "远控端口" }, {
								default: withCtx(() => [createVNode(_component_ReInputNumber, {
									modelValue: form.value.serverHostRemotePort,
									"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => form.value.serverHostRemotePort = $event),
									min: 1,
									max: 65535,
									placeholder: remotePortPlaceholder.value,
									style: { "width": "100%" }
								}, null, 8, ["modelValue", "placeholder"])]),
								_: 1
							}),
							effectiveRemoteProtocol.value === "VNC" ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 0,
								label: "VNC 密码"
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.serverHostVncPassword,
									"onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => form.value.serverHostVncPassword = $event),
									type: "password",
									"show-password": "",
									placeholder: "VNC 服务端口令",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(unref(ReFormItem), {
								class: "col-span-2",
								label: " "
							}, {
								default: withCtx(() => [..._cache[35] || (_cache[35] = [createBaseVNode("span", { class: "remote-tip" }, " Guacd 中转：网页端经 guacd 渲染；平台直连：由平台自研客户端连接（当前仅 SSH、VNC）；无需通道：平台不做任何中转，网页端只显示本机客户端的连接地址，SSH 用系统终端、VNC 用本机客户端。RDP 必须经 guacd 中转。端口留空按协议默认（SSH 22 / RDP 3389 / VNC 5900）。 ", -1)])]),
								_: 1
							})
						], 64)) : createCommentVNode("", true),
						form.value.serverHostCollectMode === "AGENT" ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
							_cache[41] || (_cache[41] = createBaseVNode("div", { class: "form-section full" }, "凭据校验与 Agent", -1)),
							createVNode(unref(ReFormItem), { label: "Agent 端口" }, {
								default: withCtx(() => [createVNode(_component_ReInputNumber, {
									modelValue: form.value.serverHostAgentPort,
									"onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => form.value.serverHostAgentPort = $event),
									min: 1,
									max: 65535,
									style: { "width": "100%" },
									placeholder: "默认 19876"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "凭据状态" }, {
								default: withCtx(() => [createBaseVNode("div", _hoisted_18$3, [createVNode(_component_ReButton, {
									onClick: verifyCredentials,
									loading: verifying.value
								}, {
									default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("校验凭据", -1)])]),
									_: 1
								}, 8, ["loading"]), credVerified.value ? (openBlock(), createElementBlock("span", _hoisted_19$3, "✓ 校验成功")) : (openBlock(), createElementBlock("span", _hoisted_20$3, "未校验"))])]),
								_: 1
							}),
							credVerified.value ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 0,
								label: "Agent 部署",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createBaseVNode("div", _hoisted_21$3, [
									createVNode(_component_ReButton, {
										type: "primary",
										onClick: deployAgent,
										loading: deploying.value
									}, {
										default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode("自动部署 Agent", -1)])]),
										_: 1
									}, 8, ["loading"]),
									createVNode(_component_ReButton, { onClick: downloadAgent }, {
										default: withCtx(() => [..._cache[38] || (_cache[38] = [createTextVNode("下载 Agent 包", -1)])]),
										_: 1
									}),
									createVNode(_component_ReButton, {
										type: "success",
										onClick: testAgentConnection
									}, {
										default: withCtx(() => [..._cache[39] || (_cache[39] = [createTextVNode("测试 Agent 连接", -1)])]),
										_: 1
									})
								])]),
								_: 1
							})) : (openBlock(), createBlock(unref(ReFormItem), {
								key: 1,
								label: "Agent 包下载",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createVNode(_component_ReButton, { onClick: downloadAgent }, {
									default: withCtx(() => [..._cache[40] || (_cache[40] = [createTextVNode("下载 Agent 包", -1)])]),
									_: 1
								})]),
								_: 1
							}))
						], 64)) : createCommentVNode("", true),
						form.value.serverHostCollectMode === "PROMETHEUS" ? (openBlock(), createElementBlock(Fragment, { key: 4 }, [
							_cache[44] || (_cache[44] = createBaseVNode("div", { class: "form-section full" }, "凭据校验与 Prometheus", -1)),
							createVNode(unref(ReFormItem), {
								label: "凭据状态",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createBaseVNode("div", _hoisted_22$3, [createVNode(_component_ReButton, {
									type: "primary",
									loading: promVerifying.value,
									onClick: verifyPrometheus
								}, {
									default: withCtx(() => [..._cache[42] || (_cache[42] = [createTextVNode("凭据校验", -1)])]),
									_: 1
								}, 8, ["loading"]), promVerified.value ? (openBlock(), createElementBlock("span", _hoisted_23$3, "✓ 校验成功")) : (openBlock(), createElementBlock("span", _hoisted_24$3, "未校验"))])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "Prometheus 包",
								class: "col-span-2"
							}, {
								default: withCtx(() => [createBaseVNode("div", _hoisted_25$3, [createVNode(_component_ReButton, { onClick: downloadPrometheus }, {
									default: withCtx(() => [..._cache[43] || (_cache[43] = [createTextVNode("下载 Prometheus 包", -1)])]),
									_: 1
								})])]),
								_: 1
							})
						], 64)) : createCommentVNode("", true)
					])]),
					_: 1
				}, 8, ["model"])]),
				_: 1
			}, 8, ["model-value", "title"]);
		};
	}
}), [["__scopeId", "data-v-acf68242"]]);
//#endregion
//#region src/views/HostConfigDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$6 = { class: "delay-view" };
var _hoisted_2$5 = { key: 0 };
var _hoisted_3$5 = {
	key: 1,
	class: "bad"
};
var _hoisted_4$5 = { key: 2 };
var _hoisted_5$5 = {
	key: 3,
	class: "dim"
};
//#endregion
//#region src/views/HostConfigDialog.vue
var HostConfigDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "HostConfigDialog",
	props: {
		modelValue: { type: Boolean },
		host: {},
		mode: {}
	},
	emits: ["update:modelValue", "saved"],
	setup(__props, { emit: __emit }) {
		/**
		* 主机「更多」配置弹窗（表格行操作入口）
		* mode:
		*  - online —— 在离线检测（serverHostOnlineEnabled / serverHostOnlineInterval）
		*  - metric —— 指标采集（serverHostCollectMode / serverHostCollectInterval / serverHostAgentEnabled）
		*  - delay  —— 延迟检测（serverHostDelayEnabled / serverHostDelayInterval，RTT 由后台 delayTick 回写）
		* 三类检测均由后台 HostOnlineScheduler 驱动，保存走 saveHost。
		* @author CH
		* @since 4.0.0
		*/
		const MODE_TITLE = {
			online: "在离线检测",
			metric: "指标采集",
			delay: "延迟检测"
		};
		const props = __props;
		const emit = __emit;
		const saving = ref(false);
		const form = ref({
			serverHostOnlineEnabled: 1,
			serverHostOnlineInterval: 60,
			serverHostCollectMode: "SCHEDULED",
			serverHostCollectInterval: 3600,
			serverHostAgentEnabled: 0,
			serverHostDelayEnabled: 1,
			serverHostDelayInterval: 60
		});
		/** 当前延迟（只读展示，后台 delayTick 回写） */
		const lastDelayMs = ref(void 0);
		const collectModes = [
			{
				label: "不采集",
				value: "NONE"
			},
			{
				label: "OpenSSH采集",
				value: "OPENSSH"
			},
			{
				label: "定时采集",
				value: "SCHEDULED"
			},
			{
				label: "Agent采集",
				value: "AGENT"
			},
			{
				label: "HTTP采集",
				value: "HTTP"
			},
			{
				label: "Prometheus采集",
				value: "PROMETHEUS"
			},
			{
				label: "本机自采集(OSHI)",
				value: "LOCAL"
			}
		];
		const title = computed(() => `${MODE_TITLE[props.mode]} · ${props.host?.serverHostName ?? ""}`);
		/**
		* 用主机数据回填表单
		* @param source 主机数据
		*/
		function fillFrom(source) {
			form.value = {
				serverHostOnlineEnabled: source.serverHostOnlineEnabled ?? 1,
				serverHostOnlineInterval: source.serverHostOnlineInterval ?? 60,
				serverHostCollectMode: source.serverHostCollectMode || "SCHEDULED",
				serverHostCollectInterval: source.serverHostCollectInterval ?? 3600,
				serverHostAgentEnabled: source.serverHostAgentEnabled ?? 0,
				serverHostDelayEnabled: source.serverHostDelayEnabled ?? 1,
				serverHostDelayInterval: source.serverHostDelayInterval ?? 60
			};
			lastDelayMs.value = source.serverHostDelayMs;
		}
		watch(() => [props.modelValue, props.mode], async ([v]) => {
			if (!v || !props.host) return;
			fillFrom(props.host);
			lastDelayMs.value = props.host.serverHostDelayMs;
			try {
				const full = await getHost(props.host.id);
				if (full && props.modelValue) fillFrom(full);
			} catch {}
		});
		async function save() {
			if (!props.host) return;
			saving.value = true;
			try {
				await saveHost(props.host.id, {
					...props.host,
					...form.value
				});
				message.success(`${MODE_TITLE[props.mode]}已保存`);
				emit("update:modelValue", false);
				emit("saved");
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				saving.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createBlock(_component_ReDialog, {
				"model-value": props.modelValue,
				"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => emit("update:modelValue", $event)),
				title: title.value,
				width: "420px",
				"close-on-click-modal": false
			}, {
				footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[7] || (_cache[7] = ($event) => emit("update:modelValue", false)) }, {
					default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(_component_ReButton, {
					type: "primary",
					loading: saving.value,
					icon: "Check",
					"show-text": true,
					onClick: save
				}, {
					default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("保存", -1)])]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [props.mode === "online" ? (openBlock(), createBlock(_component_ReForm, {
					key: 0,
					model: form.value,
					"label-position": "top"
				}, {
					default: withCtx(() => [
						createVNode(unref(ReFormItem), { label: "在离线检测" }, {
							default: withCtx(() => [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostOnlineEnabled,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.value.serverHostOnlineEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), { label: "检测间隔(秒)" }, {
							default: withCtx(() => [createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostOnlineInterval,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.value.serverHostOnlineInterval = $event),
								min: 10,
								max: 3600,
								step: 10,
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						_cache[9] || (_cache[9] = createBaseVNode("p", { class: "hint" }, "后台按间隔 TCP 探测主机端口，不可达自动标记离线。", -1))
					]),
					_: 1
				}, 8, ["model"])) : props.mode === "metric" ? (openBlock(), createBlock(_component_ReForm, {
					key: 1,
					model: form.value,
					"label-position": "top"
				}, {
					default: withCtx(() => [
						createVNode(unref(ReFormItem), { label: "采集方式" }, {
							default: withCtx(() => [createVNode(_component_ReSelect, {
								modelValue: form.value.serverHostCollectMode,
								"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.serverHostCollectMode = $event),
								style: { "width": "100%" },
								options: collectModes
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), { label: "采集间隔(秒)" }, {
							default: withCtx(() => [createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostCollectInterval,
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.value.serverHostCollectInterval = $event),
								min: 60,
								max: 86400,
								step: 60,
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						form.value.serverHostCollectMode === "AGENT" ? (openBlock(), createBlock(unref(ReFormItem), {
							key: 0,
							label: "Agent上报"
						}, {
							default: withCtx(() => [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostAgentEnabled,
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.serverHostAgentEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"])]),
							_: 1
						})) : createCommentVNode("", true),
						_cache[10] || (_cache[10] = createBaseVNode("p", { class: "hint" }, "后台按采集方式（定时/Agent/HTTP/Prometheus）周期抓取主机硬件指标。", -1))
					]),
					_: 1
				}, 8, ["model"])) : (openBlock(), createBlock(_component_ReForm, {
					key: 2,
					model: form.value,
					"label-position": "top"
				}, {
					default: withCtx(() => [
						createVNode(unref(ReFormItem), { label: "延迟检测" }, {
							default: withCtx(() => [createVNode(_component_ReSwitch, {
								layout: "square",
								modelValue: form.value.serverHostDelayEnabled,
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.serverHostDelayEnabled = $event),
								"active-value": 1,
								"inactive-value": 0
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), { label: "检测间隔(秒)" }, {
							default: withCtx(() => [createVNode(_component_ReInputNumber, {
								modelValue: form.value.serverHostDelayInterval,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.value.serverHostDelayInterval = $event),
								min: 10,
								max: 3600,
								step: 10,
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(unref(ReFormItem), { label: "最近延迟" }, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_1$6, [lastDelayMs.value == null ? (openBlock(), createElementBlock("b", _hoisted_2$5, "—")) : lastDelayMs.value < 0 ? (openBlock(), createElementBlock("b", _hoisted_3$5, "不可达")) : (openBlock(), createElementBlock("b", _hoisted_4$5, toDisplayString(lastDelayMs.value) + " ms", 1)), props.host?.serverHostLastDelayTime ? (openBlock(), createElementBlock("span", _hoisted_5$5, "（" + toDisplayString(props.host.serverHostLastDelayTime) + "）", 1)) : createCommentVNode("", true)])]),
							_: 1
						}),
						_cache[11] || (_cache[11] = createBaseVNode("p", { class: "hint" }, "后台按间隔 TCP 建连测 RTT，结果回写「最近延迟」列。", -1))
					]),
					_: 1
				}, 8, ["model"]))]),
				_: 1
			}, 8, ["model-value", "title"]);
		};
	}
}), [["__scopeId", "data-v-0ccedcff"]]);
//#endregion
//#region src/utils/processIcon.ts
/**
* 进程 / 服务 图标 —— 常见程序的可识别单色图形（离线、零外部依赖）
*
* 设计：24x24 视口、currentColor 描色（外层色块里以白色呈现），
* 按可执行文件名归类到「浏览器 / 终端 / 代码 / 数据库 / JVM / 容器 / 服务 / 脚本 / 系统」等图形；
* 识别不到的程序返回空串，由调用方回退到「首字母」色块，保证永不空白。
*/
/** 名称 → 图形分类（先具体后通用，全部小写匹配） */
var CATEGORY = [
	[/chrome|msedge|firefox|safari|brave|browser/i, "browser"],
	[/windowsterminal|cmd\.exe|powershell|pwsh|conhost|terminal|putty|bash|zsh|sh$|ssh|telnet/i, "terminal"],
	[/\bcode\b|idea|webstorm|pycharm|goland|phpstorm|rubymine|clion|eclipse|sublime|devenv|notepad\+\+/i, "code"],
	[/mysqld|mariadb|postgres|redis-server|redis\.exe|mongod|oracle|sqlservr|mssql|clickhouse|influxd|memcached/i, "database"],
	[/java|javaw|jdk|jvm|jre/i, "coffee"],
	[/docker|containerd|dockerd|kube|etcd|container/i, "container"],
	[/nginx|httpd|apache|tomcat|caddy|traefik/i, "server"],
	[/node|deno|bun/i, "hex"],
	[/python|pythonw|perl|ruby|php|lua/i, "script"],
	[/svchost|services\.exe|lsass|wininit|csrss|smss|system|registry|kernel|systemd|init\b/i, "gear"]
];
/** 分类 → SVG 内部图形（描边 currentColor） */
var GLYPH = {
	browser: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3.2 12h17.6M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18\"/>",
	terminal: "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 9l3 3-3 3M12.5 15H17\"/>",
	code: "<path d=\"M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5.5l-3 13\"/>",
	database: "<ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5\"/><path d=\"M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3\"/>",
	coffee: "<path d=\"M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z\"/><path d=\"M17 9h2a2.5 2.5 0 0 1 0 5h-2\"/><path d=\"M8 2.6c-.6 1 .6 1.7 0 2.8M12 2.6c-.6 1 .6 1.7 0 2.8\"/>",
	container: "<rect x=\"3\" y=\"10\" width=\"5\" height=\"4\"/><rect x=\"9\" y=\"10\" width=\"5\" height=\"4\"/><rect x=\"15\" y=\"10\" width=\"5\" height=\"4\"/><rect x=\"6\" y=\"5\" width=\"5\" height=\"4\"/><rect x=\"12\" y=\"5\" width=\"5\" height=\"4\"/><path d=\"M2 15c0 3 4.5 4 10 4s10-1 10-4\"/>",
	server: "<rect x=\"3\" y=\"4\" width=\"18\" height=\"6.5\" rx=\"1.6\"/><rect x=\"3\" y=\"13.5\" width=\"18\" height=\"6.5\" rx=\"1.6\"/><circle cx=\"7\" cy=\"7.2\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"7\" cy=\"16.8\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>",
	hex: "<path d=\"M12 2.5l8.2 4.7v9.6L12 21.5l-8.2-4.7V7.2z\"/><path d=\"M9 14.5c1 1.4 5 1.4 6 0\"/>",
	script: "<path d=\"M7 3h7.5L19 7.5V21H7z\"/><path d=\"M14 3v4.5H19\"/><path d=\"M9.5 13l-2 2 2 2M14.5 13l2 2-2 2\"/>",
	gear: "<circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8\"/>"
};
/**
* 进程图标内联 SVG（v-html 渲染）
*
* @param name 进程/服务名（可含 .exe）
* @returns 完整 svg；识别不到返回空串
*/
function processGlyph(name) {
	const n = String(name ?? "").trim();
	if (!n) return "";
	for (const [re, cat] of CATEGORY) if (re.test(n) && GLYPH[cat]) return "<svg viewBox=\"0 0 24 24\" width=\"17\" height=\"17\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + GLYPH[cat] + "</svg>";
	return "";
}
//#endregion
//#region src/utils/processBrand.ts
/**
* 进程 / 服务 官方品牌图标 —— 常见程序的保真简化彩色 Logo（离线、零外部依赖）
*
* 设计：24x24 视口、全彩，几何上尽量贴近官方标志（可做适度简化但不偏离识别特征）；
* 彩色 Logo 衬在中性白色圆角块内呈现。识别不到返回空串，
* 由调用方依次回退到「单色线性图形 processGlyph」→「首字母色块」，保证永不空白。
*/
/** 品牌 Logo 内部图形（viewBox 0 0 24 24，透明底） */
var LOGO = {
	chrome: "<path fill=\"#EA4335\" d=\"M12 12 3.34 7A10 10 0 0 1 20.66 7z\"/><path fill=\"#FBBC05\" d=\"M12 12l8.66-5A10 10 0 0 1 12 22z\"/><path fill=\"#34A853\" d=\"M12 12 12 22A10 10 0 0 1 3.34 7z\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\" fill=\"#fff\"/><circle cx=\"12\" cy=\"12\" r=\"3.7\" fill=\"#4285F4\"/>",
	edge: "<circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#0E88DE\"/><path fill=\"#3BD4E8\" d=\"M12 4a8 8 0 0 0-8 8c0 .9.2 1.8.5 2.6C6 12 9 9.6 13 9.6c2.4 0 4.6 1 6 2.6A8 8 0 0 0 12 4z\"/><path fill=\"#7BE492\" d=\"M5.2 15.3C7 13 10 11.4 13 11.4c2 0 3.8.7 5.2 1.8-.6 2.6-3 4.8-6.2 4.8-2.8 0-5.2-1.4-6.8-2.7z\"/>",
	firefox: "<circle cx=\"12\" cy=\"12\" r=\"6.4\" fill=\"#4E9BE8\"/><path d=\"M8.6 7.4A6.6 6.6 0 1 0 16.8 7\" fill=\"none\" stroke=\"#FF7139\" stroke-width=\"3.3\" stroke-linecap=\"round\"/><circle cx=\"17.5\" cy=\"6.3\" r=\"1.5\" fill=\"#FF8C4A\"/><path fill=\"#FF7139\" d=\"M16.3 5.2 17 3.4l.5 1.8zM18.3 5.2l1.6-.9-.6 1.7z\"/>",
	safari: "<circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#2AA6F5\"/><circle cx=\"12\" cy=\"12\" r=\"7.3\" fill=\"#F4F8FC\"/><path fill=\"#FA4B47\" d=\"M12 12 16.6 7.4 13.4 10.6z\"/><path fill=\"#D8DEE8\" d=\"M12 12 7.4 16.6 10.6 13.4z\"/><circle cx=\"12\" cy=\"12\" r=\"1.05\" fill=\"#3A86C8\"/>",
	java: "<path d=\"M9 3.5c-.7 1 .7 1.7 0 3M12 3.2c-.7 1 .7 1.7 0 3\" fill=\"none\" stroke=\"#F4A13A\" stroke-width=\"1.5\" stroke-linecap=\"round\"/><path fill=\"#E76F00\" d=\"M6.5 9h8.2v4.6a4.1 4.1 0 0 1-8.2 0z\"/><path fill=\"#E76F00\" d=\"M14.7 10h1.1a1.7 1.7 0 0 1 0 3.4h-1.1v-1.4h1a.35.35 0 0 0 0-.7h-1z\"/><ellipse cx=\"10.6\" cy=\"18.4\" rx=\"5\" ry=\"1.3\" fill=\"#C9510B\"/>",
	node: "<path fill=\"#68A063\" d=\"M12 2l8.7 5v10L12 22l-8.7-5V7z\"/><path d=\"M12 5.5l5.4 3.1v6.2L12 18l-5.4-3.2V8.6z\" fill=\"none\" stroke=\"#3C7540\" stroke-width=\"1.1\"/>",
	python: "<path fill=\"#3776AB\" d=\"M12 2.8c-2.7 0-3.4 1.2-3.4 2.9v1.5h6.8v.5H7.2c-1.9 0-3.5 1.1-3.5 3.3 0 2.1 1.2 3.3 3.1 3.3h1.2v-1.7c0-1.9 1.6-3.5 3.5-3.5h3.4c1.7 0 2.6-.9 2.6-2.6V5.7c0-1.7-1.4-2.9-3.4-2.9z\"/><circle cx=\"10.4\" cy=\"5.5\" r=\".95\" fill=\"#fff\"/><path fill=\"#FFD43B\" d=\"M12 21.2c2.7 0 3.4-1.2 3.4-2.9v-1.5H8.6v-.5h8.2c1.9 0 3.5-1.1 3.5-3.3 0-2.1-1.2-3.3-3.1-3.3h-1.2v1.7c0 1.9-1.6 3.5-3.5 3.5H9.1c-1.6 0-2.8 1.3-2.8 2.9v1.2c0 1.7 1.4 2.9 3.4 2.9z\"/><circle cx=\"13.6\" cy=\"18.5\" r=\".95\" fill=\"#fff\"/>",
	docker: "<g fill=\"#fff\"><rect x=\"4\" y=\"10.1\" width=\"2.3\" height=\"2.3\"/><rect x=\"6.8\" y=\"10.1\" width=\"2.3\" height=\"2.3\"/><rect x=\"9.6\" y=\"10.1\" width=\"2.3\" height=\"2.3\"/><rect x=\"12.4\" y=\"10.1\" width=\"2.3\" height=\"2.3\"/><rect x=\"15.2\" y=\"10.1\" width=\"2.3\" height=\"2.3\"/><rect x=\"6.8\" y=\"7.5\" width=\"2.3\" height=\"2.3\"/><rect x=\"9.6\" y=\"7.5\" width=\"2.3\" height=\"2.3\"/><rect x=\"12.4\" y=\"7.5\" width=\"2.3\" height=\"2.3\"/><rect x=\"9.6\" y=\"4.9\" width=\"2.3\" height=\"2.3\"/></g><path fill=\"#2496ED\" d=\"M3 12.7h15.2c1 2.7-1.1 5.6-5.2 6.1-3.5.4-7.2-.7-8.6-3.4C3.7 14.2 3 13.3 3 12.7z\"/><path fill=\"#1B7BC4\" d=\"M18.4 13.6c1.4-.2 2.4-.9 2.6-1.8.5 1.2-.3 2.7-1.9 3.2z\"/>",
	redis: "<path fill=\"#F08A7C\" d=\"M12 4.2l3.9 1.8L12 7.8 8.1 6z\"/><path fill=\"#E5604F\" d=\"M12 8.3l5.5 2.5L12 13.3 6.5 10.8z\"/><path fill=\"#DC382D\" d=\"M12 13.8l7 3.1-7 3.1-7-3.1z\"/><path fill=\"#A8261C\" d=\"M5 16.9v1.9L12 22l7-3.2v-1.9L12 20z\"/>",
	mongodb: "<path fill=\"#15994E\" d=\"M12 2.4c2.8 3.6 4.3 7.2 4.3 10.6A4.3 4.3 0 0 1 12 17.3a4.3 4.3 0 0 1-4.3-4.3C7.7 9.6 9.2 6 12 2.4z\"/><path d=\"M12 4v11.4\" stroke=\"#0C7A3D\" stroke-width=\"1\"/><path fill=\"#0C7A3D\" d=\"M10.8 17.5h2.4v1.5c0 .6-.5 1-1.2 1s-1.2-.4-1.2-1z\"/>",
	nginx: "<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"4.5\" fill=\"#009639\"/><path d=\"M8.2 16V8l7.6 8V8\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
	mysql: "<path fill=\"#00758F\" d=\"M3.6 14.2c3-.9 5-2.9 5.9-5.9 1.2 2 3.1 3 6.1 3-1.5 1-2.6 2-3 3.4 1.5.3 3-.2 4-1.5.6 2-1.5 4-4 4-2 0-3-.6-4-1.4-1.6 1-3.5 1.4-5 1z\"/><circle cx=\"14.6\" cy=\"10.6\" r=\".7\" fill=\"#fff\"/>",
	postgres: "<path fill=\"#336791\" d=\"M8.2 3.8c-2.1 0-3.2 1.7-3.2 4.1 0 1 .3 1.9.7 2.5C4.7 11.4 4 12.6 4 14c0 2 1.2 3.1 2.7 3.1.6 0 1-.2 1.4-.5v3h2v-3.5c.6.2 1.2.4 2 .4 2.4 0 4-1.8 4-4.7 0-3-2-5.4-4.4-6-.6-.9-1.8-1.4-3.5-1.4z\"/><circle cx=\"12.4\" cy=\"8.6\" r=\".8\" fill=\"#fff\"/>"
};
/** 名称 → 品牌（先具体后通用，全部小写匹配） */
var MATCH = [
	[/chrome/i, "chrome"],
	[/msedge|^edge/i, "edge"],
	[/firefox/i, "firefox"],
	[/safari/i, "safari"],
	[/java|javaw|jdk|jvm|jre/i, "java"],
	[/\bnode|nodejs/i, "node"],
	[/python|pythonw/i, "python"],
	[/docker|dockerd/i, "docker"],
	[/redis-server|redis\.exe|redis-sentinel|\bredis/i, "redis"],
	[/mongod|mongos/i, "mongodb"],
	[/nginx/i, "nginx"],
	[/mysqld|mariadb/i, "mysql"],
	[/postgres|postmaster/i, "postgres"]
];
/**
* 进程品牌彩色图标内联 SVG（v-html 渲染）
*
* @param name 进程/服务名（可含 .exe）
* @returns 完整 svg；识别不到返回空串
*/
function processBrandIcon(name) {
	const n = String(name ?? "").trim();
	if (!n) return "";
	for (const [re, key] of MATCH) if (re.test(n) && LOGO[key]) return "<svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" aria-hidden=\"true\">" + LOGO[key] + "</svg>";
	return "";
}
//#endregion
//#region src/components/HostFileManager.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "we-bar" };
var _hoisted_2$4 = { class: "we-nav" };
var _hoisted_3$4 = ["disabled"];
var _hoisted_4$4 = ["disabled"];
var _hoisted_5$4 = ["disabled"];
var _hoisted_6$3 = { class: "we-address" };
var _hoisted_7$3 = { class: "we-search" };
var _hoisted_8$3 = ["placeholder"];
var _hoisted_9$3 = { class: "we-actions" };
var _hoisted_10$3 = { class: "we-body" };
var _hoisted_11$2 = { class: "we-pane" };
var _hoisted_12$2 = {
	key: 0,
	class: "we-pane-children"
};
var _hoisted_13$2 = ["onClick"];
var _hoisted_14$2 = ["innerHTML"];
var _hoisted_15$2 = { class: "we-drive-label" };
var _hoisted_16$2 = {
	key: 0,
	class: "we-col-list"
};
var _hoisted_17$2 = ["onClick"];
var _hoisted_18$2 = ["innerHTML"];
var _hoisted_19$2 = { class: "we-col-name" };
var _hoisted_20$2 = {
	key: 0,
	class: "we-col-caret"
};
var _hoisted_21$2 = {
	key: 0,
	class: "we-col-empty we-col-error"
};
var _hoisted_22$2 = {
	key: 1,
	class: "we-col-empty"
};
var _hoisted_23$2 = {
	key: 1,
	class: "we-col-preview"
};
var _hoisted_24$2 = ["src"];
var _hoisted_25$2 = ["innerHTML"];
var _hoisted_26$2 = { class: "we-col-preview-name" };
var _hoisted_27$2 = { class: "we-col-preview-meta" };
var _hoisted_28$2 = {
	key: 1,
	class: "we-icons"
};
var _hoisted_29$2 = [
	"onClick",
	"onDblclick",
	"onContextmenu",
	"onDragstart",
	"onDragover",
	"onDragleave",
	"onDrop"
];
var _hoisted_30$2 = ["innerHTML"];
var _hoisted_31$2 = { class: "we-icon-label" };
var _hoisted_32$2 = ["innerHTML"];
var _hoisted_33$2 = {
	key: 2,
	class: "we-list"
};
var _hoisted_34$2 = [
	"onClick",
	"onDblclick",
	"onContextmenu",
	"onDragstart",
	"onDragover",
	"onDragleave",
	"onDrop"
];
var _hoisted_35$2 = ["innerHTML"];
var _hoisted_36$2 = { class: "we-list-label" };
var _hoisted_37$2 = {
	key: 3,
	class: "we-details"
};
var _hoisted_38$2 = { class: "we-table" };
var _hoisted_39$2 = [
	"onClick",
	"onDblclick",
	"onContextmenu",
	"onDragover",
	"onDragleave",
	"onDrop"
];
var _hoisted_40$2 = { class: "col-name" };
var _hoisted_41$2 = { class: "we-name-inner" };
var _hoisted_42$2 = ["innerHTML"];
var _hoisted_43$2 = { class: "we-table-name" };
var _hoisted_44$2 = { class: "col-date" };
var _hoisted_45$2 = { class: "col-type" };
var _hoisted_46$2 = { class: "we-type-tag" };
var _hoisted_47$2 = { class: "col-size" };
var _hoisted_48$2 = {
	key: 0,
	class: "we-transfers"
};
var _hoisted_49$2 = { class: "we-tr-name" };
var _hoisted_50$2 = { class: "we-tr-state" };
var _hoisted_51$2 = {
	key: 1,
	class: "we-drop"
};
var _hoisted_52$2 = {
	key: 0,
	class: "we-menu-divider"
};
var _hoisted_53$2 = ["onClick"];
var _hoisted_54$2 = { class: "we-preview" };
var _hoisted_55$2 = ["src", "alt"];
var _hoisted_56$2 = { class: "we-preview-meta dim" };
var _hoisted_57$2 = { class: "we-perm-owner" };
var _hoisted_58$2 = { class: "we-perm-table" };
var _hoisted_59$2 = { class: "we-perm-mode" };
var _hoisted_60$2 = { class: "mono" };
var _hoisted_61$2 = { class: "we-status" };
var _hoisted_62$1 = { class: "we-status-count" };
var _hoisted_63$1 = { key: 0 };
var _hoisted_64$1 = { class: "we-status-views" };
//#endregion
//#region src/components/HostFileManager.vue
var HostFileManager_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "HostFileManager",
	props: {
		hostId: {},
		initialPath: { default: "" },
		platform: { default: "LINUX" }
	},
	setup(__props) {
		const props = __props;
		const isWindows = computed(() => "WINDOWS" === (props.platform || "").toUpperCase());
		const sep = computed(() => isWindows.value ? "\\" : "/");
		const defaultRoot = computed(() => isWindows.value ? "C:\\" : "/");
		const homePath = computed(() => defaultRoot.value);
		const currentPath = ref(props.initialPath || defaultRoot.value);
		const pathInput = ref(currentPath.value);
		const files = ref([]);
		const loading = ref(false);
		/** 当前目录的加载失败原因：非空表示「读不到」，不能显示成「此文件夹为空」 */
		const loadError = ref("");
		const selected = ref("");
		const filterText = ref("");
		const viewMode = ref("icons");
		const navExpanded = ref(true);
		const drives = ref([]);
		const colStack = ref([]);
		async function loadColFiles(col) {
			col.loading = true;
			col.error = "";
			try {
				col.files = await fetchHostFiles(props.hostId, col.path);
			} catch (e) {
				col.files = [];
				col.error = e?.message || String(e);
			} finally {
				col.loading = false;
			}
		}
		/** 从指定路径开始重建列栈（单列） */
		function startColumns(path) {
			colStack.value = [{
				path,
				files: [],
				loading: false,
				selected: ""
			}];
			loadColFiles(colStack.value[0]);
		}
		/** 列内文件：文件夹优先、名称排序 */
		function colSorted(col) {
			return [...col.files].sort((a, b) => a.isDir !== b.isDir ? a.isDir ? -1 : 1 : a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
		}
		/** 在某列点选：文件夹→截断并追加下一列；文件→追加预览列 */
		async function onColPick(colIndex, file) {
			colStack.value = colStack.value.slice(0, colIndex + 1);
			const col = colStack.value[colIndex];
			col.selected = file.name;
			const full = join(col.path, file.name);
			if (file.isDir) {
				const next = {
					path: full,
					files: [],
					loading: false,
					selected: ""
				};
				colStack.value.push(next);
				await loadColFiles(colStack.value[colStack.value.length - 1]);
				return;
			}
			const image = isImageLike(file.name);
			const preview = {
				path: full,
				files: [],
				loading: false,
				selected: "",
				file,
				previewLoading: image
			};
			colStack.value.push(preview);
			if (image) {
				const colRef = colStack.value[colStack.value.length - 1];
				try {
					const blob = await downloadHostFile(props.hostId, full);
					colRef.previewUrl = URL.createObjectURL(blob);
				} catch {
					colRef.previewUrl = "";
				} finally {
					colRef.previewLoading = false;
				}
			}
		}
		const transfers = ref([]);
		let dragCounter = 0;
		const dragging = ref(false);
		const fileInput = ref();
		/** 内部拖拽移动：被拖动的文件（外部拖入上传时该值为空） */
		const moveFile = ref(null);
		/** 拖拽悬停的目标文件夹名，用于高亮 */
		const moveOver = ref("");
		const menu = ref({
			visible: false,
			x: 0,
			y: 0,
			items: []
		});
		/** 右键菜单已 teleport 到 body，组件外（左栏/命令栏/弹窗外）的左键点击也要能关闭 */
		function onDocPointerDown(e) {
			if (!menu.value.visible) return;
			const t = e.target;
			if (t && t.closest && t.closest(".we-menu")) return;
			menu.value.visible = false;
		}
		function onDocKeydown(e) {
			if (e.key === "Escape") menu.value.visible = false;
		}
		function onDocScroll() {
			if (menu.value.visible) menu.value.visible = false;
		}
		onMounted(() => {
			document.addEventListener("mousedown", onDocPointerDown, true);
			document.addEventListener("keydown", onDocKeydown);
			window.addEventListener("resize", closeMenu);
			document.addEventListener("scroll", onDocScroll, true);
		});
		onBeforeUnmount(() => {
			document.removeEventListener("mousedown", onDocPointerDown, true);
			document.removeEventListener("keydown", onDocKeydown);
			window.removeEventListener("resize", closeMenu);
			document.removeEventListener("scroll", onDocScroll, true);
		});
		const mkdirVisible = ref(false);
		const newName = ref("");
		const editorVisible = ref(false);
		const editorName = ref("");
		const editorContent = ref("");
		const saving = ref(false);
		const previewVisible = ref(false);
		const previewName = ref("");
		const previewSize = ref(0);
		const previewUrl = ref("");
		const previewLoading = ref(false);
		async function openImagePreview(file) {
			previewName.value = file.name;
			previewSize.value = file.size;
			previewVisible.value = true;
			previewLoading.value = true;
			if (previewUrl.value) {
				URL.revokeObjectURL(previewUrl.value);
				previewUrl.value = "";
			}
			try {
				const blob = await downloadHostFile(props.hostId, join(currentPath.value, file.name));
				previewUrl.value = URL.createObjectURL(blob);
			} catch (e) {
				message.error("加载图片失败: " + (e?.message || e));
			} finally {
				previewLoading.value = false;
			}
		}
		function closePreview() {
			previewVisible.value = false;
			if (previewUrl.value) {
				URL.revokeObjectURL(previewUrl.value);
				previewUrl.value = "";
			}
		}
		const permVisible = ref(false);
		const permPath = ref("");
		const permOwner = ref("");
		const permGroup = ref("");
		const permLoading = ref(false);
		const permSaving = ref(false);
		/** 三组（所有者/组/其他）× 三位（r/w/x） */
		const permBits = ref([
			[
				false,
				false,
				false
			],
			[
				false,
				false,
				false
			],
			[
				false,
				false,
				false
			]
		]);
		const PERM_GROUPS = [
			"所有者",
			"组",
			"其他"
		];
		const PERM_BITS = [
			"读取",
			"写入",
			"执行"
		];
		const permMode = computed(() => permBits.value.map((g) => (g[0] ? 4 : 0) + (g[1] ? 2 : 0) + (g[2] ? 1 : 0)).join(""));
		async function openPerms(file) {
			const full = join(currentPath.value, file.name);
			permPath.value = full;
			permVisible.value = true;
			permLoading.value = true;
			try {
				const p = await fetchHostPerms(props.hostId, full);
				const digits = String(p.mode).padStart(3, "0").slice(-3).split("").map(Number);
				permBits.value = digits.map((d) => [
					!!(d & 4),
					!!(d & 2),
					!!(d & 1)
				]);
				permOwner.value = p.owner;
				permGroup.value = p.group;
			} catch (e) {
				message.error("读取权限失败: " + (e?.message || e));
			} finally {
				permLoading.value = false;
			}
		}
		async function savePerms() {
			permSaving.value = true;
			try {
				await saveHostPerms(props.hostId, permPath.value, permMode.value);
				message.success("权限已更新");
				permVisible.value = false;
				load();
			} catch (e) {
				message.error("更新权限失败: " + (e?.message || e));
			} finally {
				permSaving.value = false;
			}
		}
		const hist = ref([currentPath.value]);
		const hIdx = ref(0);
		const canBack = computed(() => hIdx.value > 0);
		const canForward = computed(() => hIdx.value < hist.value.length - 1);
		const canGoUp = computed(() => {
			const p = currentPath.value;
			if (!p) return false;
			if (isWindows.value) return !/^[a-zA-Z]:\\?$/.test(p);
			return p !== "/";
		});
		const currentName = computed(() => {
			const p = currentPath.value;
			if (isWindows.value && /^[a-zA-Z]:\\?$/.test(p)) return "此电脑";
			if (!isWindows.value && p === "/") return "根目录";
			const parts = p.split(/[\\/]/).filter(Boolean);
			return parts[parts.length - 1] || "";
		});
		function join(base, name) {
			if (!base) return name;
			return (base.endsWith("/") || base.endsWith("\\") ? base.slice(0, -1) : base) + sep.value + name;
		}
		function parentOf(p) {
			if (isWindows.value) {
				const trimmed = p.endsWith("\\") ? p.slice(0, -1) : p;
				const idx = trimmed.lastIndexOf("\\");
				if (idx <= 2) return trimmed.substring(0, 3);
				return trimmed.substring(0, idx);
			}
			const idx = p.lastIndexOf("/");
			if (idx <= 0) return "/";
			return p.substring(0, idx);
		}
		function normalize(p) {
			let s = (p || "").trim().replace(/[\\/]+$/, "");
			if (isWindows.value) {
				s = s.replace(/\//g, "\\");
				if (/^[a-zA-Z]:$/.test(s)) s += "\\";
			} else {
				s = s.replace(/\\/g, "/");
				if (!s.startsWith("/")) s = "/" + s;
			}
			return s;
		}
		function isSamePath(a, b) {
			return normalize(a).toLowerCase() === normalize(b).toLowerCase();
		}
		function driveLetter(d) {
			const m = String(d.name || d.mount || "").match(/([A-Za-z]):/);
			if (m) return m[1].toUpperCase() + ":";
			return String(d.mount || d.name || "");
		}
		function driveLabel(d) {
			const letter = driveLetter(d);
			if (/^[A-Za-z]:$/.test(letter)) {
				const mm = String(d.name || "").match(/^(.+?)\s*\([A-Za-z]:\)/);
				return `${mm ? mm[1].trim() : "本地磁盘"} (${letter})`;
			}
			return String(d.name || d.mount || "");
		}
		function driveRoot(d) {
			const letter = driveLetter(d);
			if (/^[A-Za-z]:$/.test(letter)) return letter + "\\";
			return String(d.mount || d.name || "/");
		}
		async function loadDrives() {
			try {
				drives.value = await sectionRows(await fetchHostProfileSection(props.hostId, "disks"));
			} catch {
				drives.value = [];
			}
		}
		const emptyHint = computed(() => {
			if (loadError.value) return "无法打开此文件夹：" + loadError.value;
			return filterText.value ? "没有匹配的项目" : "此文件夹为空";
		});
		const displayFiles = computed(() => {
			const kw = filterText.value.trim().toLowerCase();
			let list = files.value;
			if (kw) list = list.filter((f) => f.name.toLowerCase().includes(kw));
			return [...list].sort((a, b) => {
				if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			});
		});
		async function load() {
			loading.value = true;
			selected.value = "";
			try {
				files.value = await fetchHostFiles(props.hostId, currentPath.value);
				loadError.value = "";
			} catch (e) {
				message.error("加载目录失败: " + (e?.message || e));
				files.value = [];
				loadError.value = e?.message || String(e);
			} finally {
				loading.value = false;
			}
		}
		function navigate(path, push = true) {
			const target = (path || "").trim();
			if (!target) return;
			currentPath.value = target;
			pathInput.value = target;
			filterText.value = "";
			if (push) {
				hist.value = hist.value.slice(0, hIdx.value + 1);
				hist.value.push(target);
				hIdx.value = hist.value.length - 1;
			}
			load();
		}
		function goBack() {
			if (!canBack.value) return;
			hIdx.value--;
			const p = hist.value[hIdx.value];
			currentPath.value = p;
			pathInput.value = p;
			load();
		}
		function goForward() {
			if (!canForward.value) return;
			hIdx.value++;
			const p = hist.value[hIdx.value];
			currentPath.value = p;
			pathInput.value = p;
			load();
		}
		function goUp() {
			if (!canGoUp.value) return;
			navigate(parentOf(currentPath.value));
		}
		function onOpen(file) {
			const full = join(currentPath.value, file.name);
			if (file.isDir) {
				navigate(full);
				return;
			}
			if (isImageLike(file.name)) {
				openImagePreview(file);
				return;
			}
			if (isTextLike(file.name)) openEditor(file.name, full);
			else doDownload(file.name, full);
		}
		function isImageLike(name) {
			return /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(name);
		}
		function isTextLike(name) {
			const n = name.toLowerCase();
			return /\.(txt|md|log|yml|yaml|json|js|ts|vue|java|py|sh|bash|conf|cfg|ini|properties|xml|html|css|sql|env|service)$/.test(n) || n.endsWith("rc");
		}
		function fileCategory(name) {
			const n = name.toLowerCase();
			const ext = ((n.split(".").pop() || "").replace(/[^a-z0-9]/g, "").slice(0, 4) || "file").toUpperCase();
			let color = "#8a93a6";
			if (/\.(png|jpe?g|gif|svg|webp|bmp|ico)$/.test(n)) color = "#a855f7";
			else if (/\.(zip|tar|gz|rar|7z|bz2|xz)$/.test(n)) color = "#d97706";
			else if (/\.(exe|bat|cmd|msi|sh|bin)$/.test(n)) color = "#2563eb";
			else if (/\.(txt|log|md|csv)$/.test(n)) color = "#64748b";
			else if (/\.(js|ts|vue|java|py|go|c|cpp|html|css|json|xml|yml|yaml|sql|sh)$/.test(n)) color = "#0ea5e9";
			return {
				ext,
				color
			};
		}
		const TYPE_MAP = {
			TXT: "文本文档",
			LOG: "文本文档",
			MD: "Markdown 文件",
			ZIP: "压缩(zipped)文件夹",
			RAR: "WinRAR 压缩文件",
			GZ: "压缩文件",
			TAR: "压缩文件",
			"7Z": "压缩文件",
			EXE: "应用程序",
			BAT: "Windows 批处理文件",
			MSI: "安装程序包",
			SH: "Shell 脚本",
			JPG: "JPG 图像文件",
			PNG: "PNG 图像文件",
			GIF: "GIF 图像文件",
			SVG: "SVG 文件",
			PDF: "PDF 文档",
			DOC: "Word 文档",
			XLS: "Excel 工作表",
			JSON: "JSON 文件",
			JS: "JavaScript 文件",
			TS: "TypeScript 文件",
			JAVA: "Java 源文件",
			PY: "Python 文件",
			YML: "YAML 文件",
			YAML: "YAML 文件",
			XML: "XML 文档",
			HTML: "HTML 文档",
			CSS: "CSS 文件",
			SQL: "SQL 文件"
		};
		function typeLabel(file) {
			if (file.isDir) return "文件夹";
			const rawExt = (file.name.toLowerCase().split(".").pop() || "").toUpperCase();
			return TYPE_MAP[rawExt] || (rawExt ? `${rawExt} 文件` : "文件");
		}
		function formatSize(bytes) {
			const b = Number(bytes) || 0;
			if (b < 1024) return b + " B";
			if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
			if (b < 1073741824) return (b / 1024 / 1024).toFixed(2) + " MB";
			return (b / 1024 / 1024 / 1024).toFixed(2) + " GB";
		}
		/** 紧凑日期：YYYY-MM-DD HH:mm，无法解析则原样返回 */
		function formatDateShort(s) {
			if (!s) return "";
			const d = new Date(s);
			if (isNaN(d.getTime())) return s;
			const p = (n) => String(n).padStart(2, "0");
			return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
		}
		function esc(s) {
			return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
		function folderSvg(px) {
			return `<svg width="${px}" height="${px}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="wef" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffd873"/><stop offset="1" stop-color="#f0b90b"/>
  </linearGradient></defs>
  <path d="M5 13c0-1.7 1.3-3 3-3h11l4 4h17c1.7 0 3 1.3 3 3v1c0 .6-.4 1-1 1H4v-2c0-.6.4-1 1-1z" fill="#e0a800"/>
  <path d="M4 16h40c.6 0 1 .4 1 1v17c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4V17c0-.6.4-1 1-1z" fill="url(#wef)"/>
</svg>`;
		}
		function driveSvg(px) {
			return `<svg width="${px}" height="${px}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wedb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcfdff"/><stop offset=".55" stop-color="#edf0f5"/><stop offset="1" stop-color="#d6dbe4"/>
    </linearGradient>
  </defs>
  <rect x="4" y="15" width="40" height="20" rx="4.5" fill="url(#wedb)" stroke="#b4bac7" stroke-width="1"/>
  <rect x="4" y="15" width="40" height="7.6" fill="#eef1f7"/>
  <line x1="4.5" y1="22.6" x2="43.5" y2="22.6" stroke="#c4cad4" stroke-width=".9"/>
  <circle cx="39.4" cy="18.8" r="2.7" fill="#7ed957" opacity=".28"/>
  <circle cx="39.4" cy="18.8" r="1.5" fill="#57b834"/>
  <line x1="9" y1="30.4" x2="25" y2="30.4" stroke="#c0c6d1" stroke-width=".9" stroke-linecap="round"/>
</svg>`;
		}
		function fileSvg(px, name) {
			const cat = fileCategory(name);
			const fs = px * .62;
			const label = cat.ext.slice(0, 4);
			return `<svg width="${px}" height="${px}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4h18l10 10v26c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4z" fill="#ffffff" stroke="#c4cad4" stroke-width="1"/>
  <path d="M30 4l10 10h-10z" fill="#e6eaf1"/>
  <rect x="8" y="33" width="32" height="9" rx="1.5" fill="${cat.color}"/>
  <text x="24" y="39.6" font-size="${fs > 20 ? 7.5 : 6}" text-anchor="middle" fill="#ffffff" font-weight="700" font-family="Segoe UI, Arial" font-size-adjust="0.5">${esc(label)}</text>
</svg>`;
		}
		function iconSvg(file, px) {
			return file.isDir ? folderSvg(px) : fileSvg(px, file.name);
		}
		async function openEditor(name, full) {
			editorName.value = name;
			editorContent.value = "";
			editorVisible.value = true;
			try {
				editorContent.value = await readHostFileContent(props.hostId, full);
			} catch (e) {
				message.error("读取文件失败: " + (e?.message || e));
			}
		}
		async function saveEditor() {
			const full = join(currentPath.value, editorName.value);
			saving.value = true;
			try {
				await writeHostFileContent(props.hostId, full, editorContent.value);
				message.success("已保存");
				editorVisible.value = false;
			} catch (e) {
				message.error("保存失败: " + (e?.message || e));
			} finally {
				saving.value = false;
			}
		}
		async function doDownload(name, full, isDir = false) {
			try {
				const blob = await downloadHostFile(props.hostId, full);
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = isDir ? name + ".zip" : name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} catch (e) {
				message.error("下载失败: " + (e?.message || e));
			}
		}
		function openMkdir() {
			newName.value = "";
			mkdirVisible.value = true;
		}
		async function confirmMkdir() {
			const name = newName.value.trim();
			if (!name) return;
			try {
				await mkdirHostFile(props.hostId, join(currentPath.value, name));
				message.success("已创建");
				mkdirVisible.value = false;
				load();
			} catch (e) {
				message.error("创建失败: " + (e?.message || e));
			}
		}
		async function confirmDelete(file) {
			try {
				await ElMessageBox.confirm(`确定删除 “${file.name}” ？`, "删除确认", {
					type: "warning",
					confirmButtonText: "删除",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			try {
				await deleteHostFile(props.hostId, join(currentPath.value, file.name));
				message.success("已删除");
				load();
			} catch (e) {
				message.error("删除失败: " + (e?.message || e));
			}
		}
		async function confirmRename(file) {
			let value;
			try {
				const { value: v } = await ElMessageBox.prompt("新名称", `重命名 - ${file.name}`, {
					confirmButtonText: "确定",
					cancelButtonText: "取消",
					inputValue: file.name
				});
				value = v;
			} catch {
				return;
			}
			const target = (value || "").trim();
			if (!target || target === file.name) return;
			try {
				await renameHostFile(props.hostId, join(currentPath.value, file.name), join(currentPath.value, target));
				message.success("已重命名");
				load();
			} catch (e) {
				message.error("重命名失败: " + (e?.message || e));
			}
		}
		async function uploadFiles(fileList) {
			for (const file of fileList) {
				transfers.value.push({
					name: file.name,
					state: "doing"
				});
				const idx = transfers.value.length - 1;
				try {
					await uploadHostFile(props.hostId, currentPath.value, file);
					transfers.value[idx].state = "done";
				} catch {
					transfers.value[idx].state = "error";
				}
			}
			load();
			setTimeout(() => {
				transfers.value = transfers.value.filter((t) => t.state === "doing");
			}, 8e3);
		}
		function pickFiles() {
			fileInput.value?.click();
		}
		function onFilePicked(e) {
			const input = e.target;
			if (input.files && input.files.length) uploadFiles(Array.from(input.files));
			input.value = "";
		}
		function onDragEnter() {
			dragCounter++;
			dragging.value = true;
		}
		function onDragLeave() {
			dragCounter--;
			if (dragCounter <= 0) {
				dragging.value = false;
				dragCounter = 0;
			}
		}
		function onDrop(e) {
			dragging.value = false;
			dragCounter = 0;
			if (e.dataTransfer?.files?.length) uploadFiles(Array.from(e.dataTransfer.files));
		}
		function onRowDragStart(e, file) {
			moveFile.value = file;
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = "move";
				try {
					e.dataTransfer.setData("text/x-we-move", file.name);
				} catch {}
			}
		}
		function onRowDragEnd() {
			moveFile.value = null;
			moveOver.value = "";
		}
		function onFolderDragOver(e, folder) {
			if (!moveFile.value || !folder.isDir) return;
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
			moveOver.value = folder.name;
		}
		function onFolderDragLeave(folder) {
			if (moveOver.value === folder.name) moveOver.value = "";
		}
		async function onFolderDrop(e, folder) {
			e.stopPropagation();
			const file = moveFile.value;
			moveOver.value = "";
			moveFile.value = null;
			if (!file || !folder.isDir || file.name === folder.name) return;
			const from = join(currentPath.value, file.name);
			const to = join(join(currentPath.value, folder.name), file.name);
			try {
				await renameHostFile(props.hostId, from, to);
				message.success(`已移动到 ${folder.name}`);
				load();
			} catch (err) {
				message.error("移动失败: " + (err?.message || err));
			}
		}
		function stateText(state) {
			if (state === "done") return "完成";
			if (state === "error") return "失败";
			return "上传中…";
		}
		function closeMenu() {
			menu.value.visible = false;
		}
		function onFileContextMenu(e, file) {
			const full = () => join(currentPath.value, file.name);
			const items = [{
				label: "打开",
				icon: view_default,
				action: () => {
					closeMenu();
					onOpen(file);
				}
			}];
			if (!file.isDir) {
				if (isTextLike(file.name)) items.push({
					label: "编辑",
					icon: edit_default,
					action: () => {
						closeMenu();
						openEditor(file.name, full());
					}
				});
				items.push({
					label: "下载",
					icon: download_default,
					action: () => {
						closeMenu();
						doDownload(file.name, full(), false);
					}
				});
			} else items.push({
				label: "打包下载(zip)",
				icon: download_default,
				action: () => {
					closeMenu();
					doDownload(file.name, full(), true);
				}
			});
			if (!isWindows.value) items.push({
				label: "权限",
				icon: key_default,
				action: () => {
					closeMenu();
					openPerms(file);
				}
			});
			items.push({ divider: true });
			items.push({
				label: "重命名",
				icon: edit_pen_default,
				action: () => {
					closeMenu();
					confirmRename(file);
				}
			});
			items.push({
				label: "删除",
				icon: delete_default,
				danger: true,
				action: () => {
					closeMenu();
					confirmDelete(file);
				}
			});
			menu.value = {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				items
			};
		}
		function onEmptyContextMenu(e) {
			menu.value = {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				items: [
					{
						label: "刷新",
						icon: refresh_default,
						action: () => {
							closeMenu();
							load();
						}
					},
					{
						label: "新建文件夹",
						icon: folder_add_default,
						action: () => {
							closeMenu();
							openMkdir();
						}
					},
					{ divider: true },
					{
						label: "上传文件",
						icon: upload_default,
						action: () => {
							closeMenu();
							pickFiles();
						}
					}
				]
			};
		}
		watch(() => [props.hostId, props.initialPath], () => {
			const p = props.initialPath || defaultRoot.value;
			currentPath.value = p;
			pathInput.value = p;
			hist.value = [p];
			hIdx.value = 0;
			load();
			loadDrives();
		});
		watch(viewMode, (m) => {
			if (m === "columns" && !colStack.value.length) startColumns(currentPath.value);
		});
		watch(currentPath, (p) => {
			if (viewMode.value === "columns") startColumns(p);
		});
		load();
		loadDrives();
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_checkbox = resolveComponent("el-checkbox");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", {
				class: "we",
				onDragover: _cache[22] || (_cache[22] = withModifiers(() => {}, ["prevent"])),
				onDragenter: withModifiers(onDragEnter, ["prevent"]),
				onDragleave: onDragLeave,
				onDrop: withModifiers(onDrop, ["prevent"])
			}, [
				createBaseVNode("div", _hoisted_1$5, [
					createBaseVNode("div", _hoisted_2$4, [
						createBaseVNode("button", {
							class: "we-btn",
							title: "后退",
							disabled: !canBack.value,
							onClick: goBack
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(arrow_left_default))]),
							_: 1
						})], 8, _hoisted_3$4),
						createBaseVNode("button", {
							class: "we-btn",
							title: "前进",
							disabled: !canForward.value,
							onClick: goForward
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(arrow_right_default))]),
							_: 1
						})], 8, _hoisted_4$4),
						createBaseVNode("button", {
							class: "we-btn",
							title: "向上",
							disabled: !canGoUp.value,
							onClick: goUp
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(top_default))]),
							_: 1
						})], 8, _hoisted_5$4)
					]),
					createBaseVNode("div", _hoisted_6$3, [createVNode(_component_el_icon, { class: "we-address-ico" }, {
						default: withCtx(() => [createVNode(unref(monitor_default))]),
						_: 1
					}), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => pathInput.value = $event),
						class: "we-address-input",
						spellcheck: "false",
						onKeyup: _cache[1] || (_cache[1] = withKeys(($event) => navigate(pathInput.value), ["enter"]))
					}, null, 544), [[vModelText, pathInput.value]])]),
					createBaseVNode("div", _hoisted_7$3, [createVNode(_component_el_icon, { class: "we-search-ico" }, {
						default: withCtx(() => [createVNode(unref(search_default))]),
						_: 1
					}), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => filterText.value = $event),
						class: "we-search-input",
						placeholder: "搜索 " + currentName.value,
						spellcheck: "false"
					}, null, 8, _hoisted_8$3), [[vModelText, filterText.value]])])
				]),
				createBaseVNode("div", _hoisted_9$3, [
					createBaseVNode("button", {
						class: "we-action",
						onClick: openMkdir
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(folder_add_default))]),
						_: 1
					}), _cache[23] || (_cache[23] = createBaseVNode("span", null, "新建文件夹", -1))]),
					createBaseVNode("button", {
						class: "we-action",
						onClick: pickFiles
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(upload_default))]),
						_: 1
					}), _cache[24] || (_cache[24] = createBaseVNode("span", null, "上传", -1))]),
					createBaseVNode("button", {
						class: "we-action",
						onClick: load
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(refresh_default))]),
						_: 1
					}), _cache[25] || (_cache[25] = createBaseVNode("span", null, "刷新", -1))]),
					createBaseVNode("input", {
						ref_key: "fileInput",
						ref: fileInput,
						type: "file",
						multiple: "",
						class: "we-file-input",
						onChange: onFilePicked
					}, null, 544)
				]),
				createBaseVNode("div", _hoisted_10$3, [createBaseVNode("aside", _hoisted_11$2, [
					_cache[28] || (_cache[28] = createBaseVNode("div", { class: "we-pane-sec" }, "快速访问", -1)),
					createBaseVNode("div", {
						class: "we-pane-item",
						onClick: _cache[3] || (_cache[3] = ($event) => navigate(homePath.value))
					}, [createVNode(_component_el_icon, { class: "we-pane-ico we-pane-ico--home" }, {
						default: withCtx(() => [createVNode(unref(home_filled_default))]),
						_: 1
					}), _cache[26] || (_cache[26] = createBaseVNode("span", null, "主页", -1))]),
					createBaseVNode("div", {
						class: "we-pane-sec we-pane-sec--tree",
						onClick: _cache[4] || (_cache[4] = ($event) => navExpanded.value = !navExpanded.value)
					}, [
						createVNode(_component_el_icon, { class: "we-caret" }, {
							default: withCtx(() => [navExpanded.value ? (openBlock(), createBlock(unref(caret_bottom_default), { key: 0 })) : (openBlock(), createBlock(unref(caret_right_default), { key: 1 }))]),
							_: 1
						}),
						createVNode(_component_el_icon, { class: "we-pane-ico we-pane-ico--pc" }, {
							default: withCtx(() => [createVNode(unref(monitor_default))]),
							_: 1
						}),
						_cache[27] || (_cache[27] = createBaseVNode("span", null, "此电脑", -1))
					]),
					navExpanded.value ? (openBlock(), createElementBlock("div", _hoisted_12$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(drives.value, (d, i) => {
						return openBlock(), createElementBlock("div", {
							key: i,
							class: normalizeClass(["we-pane-item we-pane-item--drive", { active: isSamePath(currentPath.value, driveRoot(d)) }]),
							onClick: ($event) => navigate(driveRoot(d))
						}, [createBaseVNode("span", {
							class: "we-drive-ico",
							innerHTML: driveSvg(17)
						}, null, 8, _hoisted_14$2), createBaseVNode("span", _hoisted_15$2, toDisplayString(driveLabel(d)), 1)], 10, _hoisted_13$2);
					}), 128))])) : createCommentVNode("", true)
				]), createBaseVNode("section", {
					class: "we-content",
					onClick: _cache[6] || (_cache[6] = ($event) => {
						selected.value = "";
						closeMenu();
					}),
					onContextmenu: _cache[7] || (_cache[7] = withModifiers(($event) => onEmptyContextMenu($event), ["prevent"]))
				}, [viewMode.value === "columns" ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "we-columns",
					onClick: _cache[5] || (_cache[5] = withModifiers(() => {}, ["stop"]))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(colStack.value, (col, ci) => {
					return openBlock(), createElementBlock("div", {
						key: ci,
						class: "we-col"
					}, [!col.file ? withDirectives((openBlock(), createElementBlock("div", _hoisted_16$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(colSorted(col), (f) => {
						return openBlock(), createElementBlock("button", {
							key: f.name,
							class: normalizeClass(["we-col-row", { selected: col.selected === f.name }]),
							onClick: withModifiers(($event) => onColPick(ci, f), ["stop"])
						}, [
							createBaseVNode("span", {
								class: "we-col-glyph",
								innerHTML: iconSvg(f, 17)
							}, null, 8, _hoisted_18$2),
							createBaseVNode("span", _hoisted_19$2, toDisplayString(f.name), 1),
							f.isDir ? (openBlock(), createElementBlock("span", _hoisted_20$2, "›")) : createCommentVNode("", true)
						], 10, _hoisted_17$2);
					}), 128)), !col.loading && col.error ? (openBlock(), createElementBlock("div", _hoisted_21$2, toDisplayString(col.error), 1)) : !col.loading && !col.files.length ? (openBlock(), createElementBlock("div", _hoisted_22$2, "空文件夹")) : createCommentVNode("", true)])), [[_directive_loading, col.loading]]) : withDirectives((openBlock(), createElementBlock("div", _hoisted_23$2, [
						col.previewUrl ? (openBlock(), createElementBlock("img", {
							key: 0,
							src: col.previewUrl,
							class: "we-col-preview-img"
						}, null, 8, _hoisted_24$2)) : (openBlock(), createElementBlock("span", {
							key: 1,
							class: "we-col-preview-icon",
							innerHTML: iconSvg(col.file, 72)
						}, null, 8, _hoisted_25$2)),
						createBaseVNode("b", _hoisted_26$2, toDisplayString(col.file.name), 1),
						createBaseVNode("div", _hoisted_27$2, [
							createBaseVNode("div", null, [_cache[29] || (_cache[29] = createBaseVNode("span", null, "类型", -1)), createTextVNode(toDisplayString(typeLabel(col.file)), 1)]),
							createBaseVNode("div", null, [_cache[30] || (_cache[30] = createBaseVNode("span", null, "大小", -1)), createTextVNode(toDisplayString(col.file.isDir ? "—" : formatSize(col.file.size)), 1)]),
							createBaseVNode("div", null, [_cache[31] || (_cache[31] = createBaseVNode("span", null, "修改日期", -1)), createTextVNode(toDisplayString(formatDateShort(col.file.modified)), 1)])
						])
					])), [[_directive_loading, col.previewLoading]])]);
				}), 128))])) : viewMode.value === "icons" ? withDirectives((openBlock(), createElementBlock("div", _hoisted_28$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(displayFiles.value, (file) => {
					return openBlock(), createElementBlock("button", {
						key: file.name,
						class: normalizeClass(["we-icon-cell", {
							selected: selected.value === file.name,
							"move-over": moveOver.value === file.name
						}]),
						draggable: "true",
						onClick: withModifiers(($event) => selected.value = file.name, ["stop"]),
						onDblclick: withModifiers(($event) => onOpen(file), ["stop"]),
						onContextmenu: withModifiers(($event) => onFileContextMenu($event, file), ["prevent", "stop"]),
						onDragstart: ($event) => onRowDragStart($event, file),
						onDragend: onRowDragEnd,
						onDragover: ($event) => onFolderDragOver($event, file),
						onDragleave: ($event) => onFolderDragLeave(file),
						onDrop: ($event) => onFolderDrop($event, file)
					}, [createBaseVNode("span", {
						class: "we-icon-glyph",
						innerHTML: iconSvg(file, 46)
					}, null, 8, _hoisted_30$2), createBaseVNode("span", _hoisted_31$2, toDisplayString(file.name), 1)], 42, _hoisted_29$2);
				}), 128)), !loading.value && displayFiles.value.length === 0 ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(["we-empty", { "we-empty--error": !!loadError.value }])
				}, [createBaseVNode("span", { innerHTML: folderSvg(44) }, null, 8, _hoisted_32$2), createBaseVNode("p", null, toDisplayString(emptyHint.value), 1)], 2)) : createCommentVNode("", true)])), [[_directive_loading, loading.value]]) : viewMode.value === "list" ? withDirectives((openBlock(), createElementBlock("div", _hoisted_33$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(displayFiles.value, (file) => {
					return openBlock(), createElementBlock("button", {
						key: file.name,
						class: normalizeClass(["we-list-cell", {
							selected: selected.value === file.name,
							"move-over": moveOver.value === file.name
						}]),
						draggable: "true",
						onClick: withModifiers(($event) => selected.value = file.name, ["stop"]),
						onDblclick: withModifiers(($event) => onOpen(file), ["stop"]),
						onContextmenu: withModifiers(($event) => onFileContextMenu($event, file), ["prevent", "stop"]),
						onDragstart: ($event) => onRowDragStart($event, file),
						onDragend: onRowDragEnd,
						onDragover: ($event) => onFolderDragOver($event, file),
						onDragleave: ($event) => onFolderDragLeave(file),
						onDrop: ($event) => onFolderDrop($event, file)
					}, [createBaseVNode("span", {
						class: "we-list-glyph",
						innerHTML: iconSvg(file, 16)
					}, null, 8, _hoisted_35$2), createBaseVNode("span", _hoisted_36$2, toDisplayString(file.name), 1)], 42, _hoisted_34$2);
				}), 128)), !loading.value && displayFiles.value.length === 0 ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(["we-empty we-empty--small", { "we-empty--error": !!loadError.value }])
				}, toDisplayString(emptyHint.value), 3)) : createCommentVNode("", true)])), [[_directive_loading, loading.value]]) : withDirectives((openBlock(), createElementBlock("div", _hoisted_37$2, [createBaseVNode("table", _hoisted_38$2, [_cache[32] || (_cache[32] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
					createBaseVNode("th", { class: "col-name" }, "名称"),
					createBaseVNode("th", { class: "col-date" }, "修改日期"),
					createBaseVNode("th", { class: "col-type" }, "类型"),
					createBaseVNode("th", { class: "col-size" }, "大小")
				])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(displayFiles.value, (file) => {
					return openBlock(), createElementBlock("tr", {
						key: file.name,
						class: normalizeClass({
							selected: selected.value === file.name,
							"move-over": moveOver.value === file.name
						}),
						onClick: withModifiers(($event) => selected.value = file.name, ["stop"]),
						onDblclick: withModifiers(($event) => onOpen(file), ["stop"]),
						onContextmenu: withModifiers(($event) => onFileContextMenu($event, file), ["prevent", "stop"]),
						onDragover: ($event) => onFolderDragOver($event, file),
						onDragleave: ($event) => onFolderDragLeave(file),
						onDrop: ($event) => onFolderDrop($event, file)
					}, [
						createBaseVNode("td", _hoisted_40$2, [createBaseVNode("div", _hoisted_41$2, [createBaseVNode("span", {
							class: "we-list-glyph",
							innerHTML: iconSvg(file, 17)
						}, null, 8, _hoisted_42$2), createBaseVNode("span", _hoisted_43$2, toDisplayString(file.name), 1)])]),
						createBaseVNode("td", _hoisted_44$2, toDisplayString(formatDateShort(file.modified)), 1),
						createBaseVNode("td", _hoisted_45$2, [createBaseVNode("span", _hoisted_46$2, toDisplayString(typeLabel(file)), 1)]),
						createBaseVNode("td", _hoisted_47$2, toDisplayString(file.isDir ? "" : formatSize(file.size)), 1)
					], 42, _hoisted_39$2);
				}), 128))])]), !loading.value && displayFiles.value.length === 0 ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(["we-empty we-empty--small", { "we-empty--error": !!loadError.value }])
				}, toDisplayString(emptyHint.value), 3)) : createCommentVNode("", true)])), [[_directive_loading, loading.value]])], 32)]),
				transfers.value.length ? (openBlock(), createElementBlock("div", _hoisted_48$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(transfers.value, (t, i) => {
					return openBlock(), createElementBlock("div", {
						key: i,
						class: "we-tr"
					}, [
						createVNode(_component_el_icon, { class: "we-tr-ico" }, {
							default: withCtx(() => [t.state === "done" ? (openBlock(), createBlock(unref(circle_check_default), { key: 0 })) : t.state === "error" ? (openBlock(), createBlock(unref(circle_close_default), { key: 1 })) : (openBlock(), createBlock(unref(loading_default), { key: 2 }))]),
							_: 2
						}, 1024),
						createBaseVNode("span", _hoisted_49$2, toDisplayString(t.name), 1),
						createBaseVNode("span", _hoisted_50$2, toDisplayString(stateText(t.state)), 1)
					]);
				}), 128))])) : createCommentVNode("", true),
				dragging.value ? (openBlock(), createElementBlock("div", _hoisted_51$2, [createVNode(_component_el_icon, { size: 46 }, {
					default: withCtx(() => [createVNode(unref(upload_default))]),
					_: 1
				}), _cache[33] || (_cache[33] = createBaseVNode("p", null, "松开以上传到当前文件夹", -1))])) : createCommentVNode("", true),
				(openBlock(), createBlock(Teleport, { to: "body" }, [menu.value.visible ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "we-menu",
					style: normalizeStyle({
						left: menu.value.x + "px",
						top: menu.value.y + "px"
					}),
					onClick: _cache[8] || (_cache[8] = withModifiers(() => {}, ["stop"]))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(menu.value.items, (item, i) => {
					return openBlock(), createElementBlock(Fragment, { key: i }, [item.divider ? (openBlock(), createElementBlock("div", _hoisted_52$2)) : (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass(["we-menu-item", { danger: item.danger }]),
						onClick: item.action
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(item.icon)))]),
						_: 2
					}, 1024), createBaseVNode("span", null, toDisplayString(item.label), 1)], 10, _hoisted_53$2))], 64);
				}), 128))], 4)) : createCommentVNode("", true)])),
				createVNode(unref(component), {
					modelValue: mkdirVisible.value,
					"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => mkdirVisible.value = $event),
					title: "新建文件夹",
					width: "340px",
					"append-to-body": "",
					class: "we-mini-dialog"
				}, {
					footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[10] || (_cache[10] = ($event) => mkdirVisible.value = false) }, {
						default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						disabled: !newName.value.trim(),
						onClick: confirmMkdir
					}, {
						default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode(" 创建 ", -1)])]),
						_: 1
					}, 8, ["disabled"])]),
					default: withCtx(() => [createVNode(_component_el_input, {
						modelValue: newName.value,
						"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => newName.value = $event),
						placeholder: "文件夹名称",
						autofocus: "",
						onKeyup: withKeys(confirmMkdir, ["enter"])
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: editorVisible.value,
					"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => editorVisible.value = $event),
					title: "编辑 - " + (editorName.value || ""),
					width: "70%",
					"append-to-body": "",
					class: "we-editor-dialog"
				}, {
					footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[13] || (_cache[13] = ($event) => editorVisible.value = false) }, {
						default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("关闭", -1)])]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						loading: saving.value,
						onClick: saveEditor
					}, {
						default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode(" 保存 ", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(_component_el_input, {
						modelValue: editorContent.value,
						"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => editorContent.value = $event),
						type: "textarea",
						rows: 20,
						class: "we-editor-area"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: previewVisible.value,
					"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => previewVisible.value = $event),
					title: "预览 - " + previewName.value,
					width: "78%",
					top: "6vh",
					"append-to-body": "",
					"destroy-on-close": "",
					class: "we-preview-dialog",
					onClose: closePreview
				}, {
					footer: withCtx(() => [createBaseVNode("span", _hoisted_56$2, toDisplayString(previewName.value) + " · " + toDisplayString(formatSize(previewSize.value)), 1), createVNode(_component_el_button, { onClick: closePreview }, {
						default: withCtx(() => [..._cache[38] || (_cache[38] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", _hoisted_54$2, [previewUrl.value ? (openBlock(), createElementBlock("img", {
						key: 0,
						src: previewUrl.value,
						alt: previewName.value,
						class: "we-preview-img"
					}, null, 8, _hoisted_55$2)) : createCommentVNode("", true)])), [[_directive_loading, previewLoading.value]])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: permVisible.value,
					"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => permVisible.value = $event),
					title: "权限",
					width: "430px",
					"append-to-body": "",
					"destroy-on-close": "",
					class: "we-perm-dialog"
				}, {
					footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[16] || (_cache[16] = ($event) => permVisible.value = false) }, {
						default: withCtx(() => [..._cache[43] || (_cache[43] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						loading: permSaving.value,
						onClick: savePerms
					}, {
						default: withCtx(() => [..._cache[44] || (_cache[44] = [createTextVNode("应用", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", null, [
						createBaseVNode("div", _hoisted_57$2, [createBaseVNode("span", null, [_cache[39] || (_cache[39] = createTextVNode("所有者：", -1)), createBaseVNode("b", null, toDisplayString(permOwner.value), 1)]), createBaseVNode("span", null, [_cache[40] || (_cache[40] = createTextVNode("组：", -1)), createBaseVNode("b", null, toDisplayString(permGroup.value), 1)])]),
						createBaseVNode("table", _hoisted_58$2, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [_cache[41] || (_cache[41] = createBaseVNode("th", null, null, -1)), (openBlock(), createElementBlock(Fragment, null, renderList(PERM_BITS, (b) => {
							return createBaseVNode("th", { key: b }, toDisplayString(b), 1);
						}), 64))])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(permBits.value, (g, gi) => {
							return openBlock(), createElementBlock("tr", { key: gi }, [createBaseVNode("th", null, toDisplayString(PERM_GROUPS[gi]), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(g, (v, bi) => {
								return openBlock(), createElementBlock("td", { key: bi }, [createVNode(_component_el_checkbox, {
									modelValue: permBits.value[gi][bi],
									"onUpdate:modelValue": ($event) => permBits.value[gi][bi] = $event
								}, null, 8, ["modelValue", "onUpdate:modelValue"])]);
							}), 128))]);
						}), 128))])]),
						createBaseVNode("div", _hoisted_59$2, [_cache[42] || (_cache[42] = createTextVNode(" 数字模式：", -1)), createBaseVNode("b", _hoisted_60$2, toDisplayString(permMode.value), 1)])
					])), [[_directive_loading, permLoading.value]])]),
					_: 1
				}, 8, ["modelValue"]),
				createBaseVNode("div", _hoisted_61$2, [createBaseVNode("span", _hoisted_62$1, [createTextVNode(toDisplayString(displayFiles.value.length) + " 个项目", 1), selected.value ? (openBlock(), createElementBlock("span", _hoisted_63$1, "　已选择 1 项")) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_64$1, [
					createBaseVNode("button", {
						class: normalizeClass(["we-status-btn", { on: viewMode.value === "icons" }]),
						title: "大图标",
						onClick: _cache[18] || (_cache[18] = ($event) => viewMode.value = "icons")
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(grid_default))]),
						_: 1
					})], 2),
					createBaseVNode("button", {
						class: normalizeClass(["we-status-btn", { on: viewMode.value === "list" }]),
						title: "列表",
						onClick: _cache[19] || (_cache[19] = ($event) => viewMode.value = "list")
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(menu_default))]),
						_: 1
					})], 2),
					createBaseVNode("button", {
						class: normalizeClass(["we-status-btn", { on: viewMode.value === "details" }]),
						title: "详细信息",
						onClick: _cache[20] || (_cache[20] = ($event) => viewMode.value = "details")
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(tickets_default))]),
						_: 1
					})], 2),
					createBaseVNode("button", {
						class: normalizeClass(["we-status-btn", { on: viewMode.value === "columns" }]),
						title: "列状（macOS）",
						onClick: _cache[21] || (_cache[21] = ($event) => viewMode.value = "columns")
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(operation_default))]),
						_: 1
					})], 2)
				])])
			], 32);
		};
	}
}), [["__scopeId", "data-v-5c54dab6"]]);
//#endregion
//#region src/views/HostProfileView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = { class: "profile" };
var _hoisted_2$3 = { class: "profile-rail" };
var _hoisted_3$3 = { class: "rail-head" };
var _hoisted_4$3 = { class: "rail-count" };
var _hoisted_5$3 = ["onClick"];
var _hoisted_6$2 = { class: "ri-os" };
var _hoisted_7$2 = ["innerHTML"];
var _hoisted_8$2 = { class: "ri-meta" };
var _hoisted_9$2 = { class: "ri-name" };
var _hoisted_10$2 = { class: "ri-addr mono" };
var _hoisted_11$1 = {
	key: 0,
	class: "rail-empty"
};
var _hoisted_12$1 = {
	key: 1,
	class: "rail-summary"
};
var _hoisted_13$1 = { class: "rs-hero" };
var _hoisted_14$1 = { class: "rs-os" };
var _hoisted_15$1 = ["innerHTML"];
var _hoisted_16$1 = { class: "rs-name" };
var _hoisted_17$1 = { class: "rs-addr mono" };
var _hoisted_18$1 = { class: "rs-pills" };
var _hoisted_19$1 = { class: "rs-rows" };
var _hoisted_20$1 = { class: "rs-label" };
var _hoisted_21$1 = {
	key: 1,
	class: "rs-gone"
};
var _hoisted_22$1 = { class: "profile-detail" };
var _hoisted_23$1 = {
	key: 0,
	class: "detail-empty"
};
var _hoisted_24$1 = { class: "profile-head" };
var _hoisted_25$1 = { class: "ph-os" };
var _hoisted_26$1 = ["innerHTML"];
var _hoisted_27$1 = { class: "ph-name-wrap" };
var _hoisted_28$1 = { class: "ph-name" };
var _hoisted_29$1 = { class: "ph-addr mono" };
var _hoisted_30$1 = { class: "ph-pills" };
var _hoisted_31$1 = {
	key: 0,
	class: "pill pill-agent"
};
var _hoisted_32$1 = {
	key: 1,
	class: "pill pill-bad"
};
var _hoisted_33$1 = { class: "ph-actions" };
var _hoisted_34$1 = { class: "auto-switch" };
var _hoisted_35$1 = {
	key: 0,
	class: "alert alert-error"
};
var _hoisted_36$1 = { class: "dim" };
var _hoisted_37$1 = {
	key: 1,
	class: "alert alert-warn"
};
var _hoisted_38$1 = { class: "gauges" };
var _hoisted_39$1 = { class: "gauge-top" };
var _hoisted_40$1 = { class: "gauge-label" };
var _hoisted_41$1 = { class: "gauge-bar" };
var _hoisted_42$1 = { class: "gauge-sub mono" };
var _hoisted_43$1 = { class: "seg" };
var _hoisted_44$1 = ["onClick"];
var _hoisted_45$1 = { class: "seg-body" };
var _hoisted_46$1 = {
	key: 0,
	class: "sec-bar"
};
var _hoisted_47$1 = { class: "dim" };
var _hoisted_48$1 = { class: "sec-pager" };
var _hoisted_49$1 = { class: "mono page-no" };
var _hoisted_50$1 = {
	key: 1,
	class: "alert alert-error"
};
var _hoisted_51$1 = {
	key: 2,
	class: "dim sec-loading"
};
var _hoisted_52$1 = {
	key: 3,
	class: "dim sec-loading"
};
var _hoisted_53$1 = {
	key: 4,
	class: "win-drives"
};
var _hoisted_54$1 = ["onClick", "onDblclick"];
var _hoisted_55$1 = { class: "drive-ico" };
var _hoisted_56$1 = { class: "drive-badge" };
var _hoisted_57$1 = { class: "drive-info" };
var _hoisted_58$1 = { class: "drive-name" };
var _hoisted_59$1 = {
	key: 0,
	class: "drive-fs dim"
};
var _hoisted_60$1 = { class: "drive-track" };
var _hoisted_61$1 = { class: "drive-hint dim" };
var _hoisted_62 = {
	key: 5,
	class: "net-wrap"
};
var _hoisted_63 = {
	key: 0,
	class: "tbl-toolbar"
};
var _hoisted_64 = { class: "tbl-scroll" };
var _hoisted_65 = { class: "tbl" };
var _hoisted_66 = {
	key: 0,
	class: "th-lead",
	style: { "width": "46px" }
};
var _hoisted_67 = ["onClick"];
var _hoisted_68 = { class: "th-label" };
var _hoisted_69 = {
	key: 0,
	class: "th-sort"
};
var _hoisted_70 = {
	key: 0,
	class: "sort-arrow"
};
var _hoisted_71 = {
	key: 1,
	class: "sort-idle"
};
var _hoisted_72 = {
	key: 1,
	class: "th-act"
};
var _hoisted_73 = {
	key: 0,
	class: "td-lead"
};
var _hoisted_74 = ["innerHTML"];
var _hoisted_75 = ["innerHTML"];
var _hoisted_76 = { class: "cell-ellipsis" };
var _hoisted_77 = { class: "cell-ellipsis" };
var _hoisted_78 = {
	key: 1,
	class: "dim"
};
var _hoisted_79 = ["innerHTML"];
var _hoisted_80 = { class: "cell-ellipsis" };
var _hoisted_81 = {
	key: 1,
	class: "dim"
};
var _hoisted_82 = {
	key: 1,
	class: "td-act"
};
var _hoisted_83 = { class: "td-act-in" };
var _hoisted_84 = {
	key: 1,
	class: "analyze-pane"
};
var _hoisted_85 = { class: "sub-form" };
/** 分区定义（各分区走对应采集端点） */
var AUTO_REFRESH_MILLIS = 1e4;
//#endregion
//#region src/views/HostProfileView.vue
var HostProfileView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "HostProfileView",
	props: {
		hosts: {},
		groups: {},
		liveDelay: { default: () => ({}) },
		liveOnline: { default: () => ({}) },
		initialHostId: { default: null },
		initialTab: { default: null },
		openSeq: { default: 0 }
	},
	emits: [
		"connect",
		"edit",
		"detail",
		"deploy-agent",
		"refreshed"
	],
	setup(__props, { emit: __emit }) {
		/**
		* 主机画像 —— master-detail 布局（数据全部来自目标机 Agent）
		* 左侧：主机列表（OS 图标 + 名称 + 地址 + 在线状态），点选切换
		* 右侧：概览条 + 资源仪表 + 分段区（概览 / 监听端口 / 进程 / 服务 / 磁盘 / 网络 / 环境变量）
		*
		* 约定：
		*  - 每一项远端数据都经 /ms/monitor/host/profile/** 由后端转发到主机上的 Agent，页面不再自己走 SSH/WinRM；
		*  - Agent 不可达时必须把原因显式呈现在页面上，不能留一片空白让人以为「这台机器没数据」。
		* @author CH
		* @since 4.0.0
		*/
		const props = __props;
		const emit = __emit;
		/** 画像分区（概要信息已移到左侧，右侧只保留明细分区，默认磁盘） */
		const sections = [
			{
				name: "ports",
				label: "监听端口"
			},
			{
				name: "processes",
				label: "进程"
			},
			{
				name: "services",
				label: "服务"
			},
			{
				name: "disks",
				label: "磁盘"
			},
			{
				name: "network",
				label: "网络"
			},
			{
				name: "env",
				label: "环境变量"
			},
			{
				name: "firewall",
				label: "防火墙"
			}
		];
		/** 各分区的列定义 */
		const COLUMNS = {
			ports: [
				{
					key: "protocol",
					label: "协议",
					width: "72px"
				},
				{
					key: "local",
					label: "监听地址",
					width: "170px"
				},
				{
					key: "port",
					label: "端口",
					width: "88px"
				},
				{
					key: "state",
					label: "状态",
					width: "120px"
				},
				{
					key: "pid",
					label: "PID",
					width: "88px"
				},
				{
					key: "process",
					label: "进程"
				}
			],
			processes: [
				{
					key: "pid",
					label: "PID",
					width: "88px"
				},
				{
					key: "name",
					label: "进程名",
					width: "220px"
				},
				{
					key: "cpu",
					label: "CPU%",
					width: "88px"
				},
				{
					key: "memory",
					label: "内存(MB)",
					width: "110px"
				},
				{
					key: "threads",
					label: "线程",
					width: "88px"
				},
				{
					key: "command",
					label: "命令行"
				}
			],
			services: [
				{
					key: "name",
					label: "服务名",
					width: "280px"
				},
				{
					key: "displayName",
					label: "显示名",
					width: "240px"
				},
				{
					key: "state",
					label: "状态",
					width: "140px"
				},
				{
					key: "startType",
					label: "启动类型",
					width: "120px"
				},
				{
					key: "pid",
					label: "PID",
					width: "100px"
				}
			],
			disks: [
				{
					key: "mount",
					label: "挂载点",
					width: "170px"
				},
				{
					key: "name",
					label: "名称",
					width: "200px"
				},
				{
					key: "fsType",
					label: "类型",
					width: "110px"
				},
				{
					key: "totalGb",
					label: "容量(GB)",
					width: "110px"
				},
				{
					key: "usedGb",
					label: "已用(GB)",
					width: "110px"
				},
				{
					key: "availGb",
					label: "可用(GB)",
					width: "110px"
				},
				{
					key: "usage",
					label: "使用率%",
					width: "96px"
				}
			],
			network: [
				{
					key: "name",
					label: "网卡",
					width: "150px"
				},
				{
					key: "status",
					label: "状态",
					width: "110px"
				},
				{
					key: "mac",
					label: "MAC",
					width: "170px"
				},
				{
					key: "ipv4",
					label: "IPv4"
				},
				{
					key: "ipv6",
					label: "IPv6"
				},
				{
					key: "mtu",
					label: "MTU",
					width: "90px"
				},
				{
					key: "speed",
					label: "速率",
					width: "110px"
				}
			],
			env: [{
				key: "name",
				label: "变量",
				width: "260px"
			}, {
				key: "value",
				label: "值"
			}],
			firewall: [
				{
					key: "name",
					label: "规则名",
					width: "220px"
				},
				{
					key: "direction",
					label: "方向",
					width: "80px"
				},
				{
					key: "action",
					label: "动作",
					width: "80px"
				},
				{
					key: "protocol",
					label: "协议",
					width: "80px"
				},
				{
					key: "localPort",
					label: "端口",
					width: "88px"
				},
				{
					key: "profile",
					label: "配置",
					width: "120px"
				},
				{
					key: "chain",
					label: "链",
					width: "80px"
				}
			]
		};
		/** 自动刷新周期（毫秒） */
		const selectedId = ref(null);
		/** 左侧视图：主机列表 / 选中主机的概要 */
		const railView = ref("list");
		function backToList() {
			railView.value = "list";
		}
		/** 左侧搜索关键词 */
		const search = ref("");
		/** 当前分区 */
		const active = ref("disks");
		/** 分页（仅进程/服务生效） */
		const page = ref(1);
		const pageSize = ref(10);
		/** 进程/服务的检索关键字：后端跨页匹配 PID/名称/用户/命令行 */
		const sectionKeyword = ref("");
		/** 进程/服务表头排序状态（key=列名，dir=asc/desc，null=不排序） */
		const sortState = ref(null);
		/** 页码与关键字是同一套定位状态，切换主机/分区时必须一起归零 */
		function resetPager() {
			page.value = 1;
			sectionKeyword.value = "";
			sortState.value = null;
		}
		/** 提交一次检索：回到第一页重新拉取 */
		function applyKeyword() {
			page.value = 1;
			loadSection();
		}
		const info = ref({});
		const metrics = ref({});
		const snapshot = ref({});
		/**
		* 左侧概要的持久化快照：只在「手动刷新」或切换到新主机时更新，
		* 周期性自动刷新不覆盖（数据来源是主机表持久化列）。
		*/
		const persisted = ref({});
		const persistedHostId = ref(null);
		const agentPort = ref(0);
		const osMismatch = ref("");
		const rows = ref([]);
		const loadingProfile = ref(false);
		const loadingSection = ref(false);
		const profileError = ref("");
		const sectionError = ref("");
		const autoRefresh = ref(false);
		let timer;
		/** 异步加载请求代次：切换主机 / 分区 / 重开时 +1，迟到的旧响应据此丢弃，避免慢通道覆盖新数据 */
		let profileReq = 0;
		let sectionReq = 0;
		const selectedHost = computed(() => props.hosts.find((h) => h.id === selectedId.value) ?? null);
		const agentReady = computed(() => String(info.value.agentVersion || "").trim() !== "" || Number(snapshot.value.serverHostAgentInstalled ?? 0) === 1);
		const agentVersion = computed(() => String(info.value.agentVersion || snapshot.value.serverHostAgentVersion || ""));
		const isAgentMode = computed(() => String(selectedHost.value?.serverHostCollectMode ?? "").toUpperCase() === "AGENT");
		/** 当前分区的列定义 */
		const columns = computed(() => COLUMNS[active.value] ?? []);
		/** 监听端口 / 进程 / 服务 / 环境变量 分区带写动作 */
		const hasActions = computed(() => active.value === "ports" || active.value === "processes" || active.value === "services" || active.value === "env");
		/** 进程 / 服务 / 监听端口 均由后端分页（后台只返回当前页） */
		const pagedSection = computed(() => active.value === "processes" || active.value === "services" || active.value === "ports" || active.value === "firewall");
		/** 各分区检索框的命中字段提示 */
		const KEYWORD_HINTS = {
			processes: "PID / 进程名 / 用户 / 命令行",
			services: "服务名 / 显示名 / 状态",
			ports: "端口 / 地址 / 状态 / 进程名",
			disks: "盘符 / 卷标 / 文件系统",
			firewall: "规则名 / 链 / 方向 / 动作 / 协议 / 端口"
		};
		const keywordPlaceholder = computed(() => KEYWORD_HINTS[active.value] ?? "关键字过滤");
		/** 后端不分页的分区在前端过滤：任一字段的值命中关键字即保留 */
		const visibleRows = computed(() => {
			const kw = sectionKeyword.value.trim().toLowerCase();
			if (!kw || pagedSection.value) return rows.value;
			return rows.value.filter((r) => Object.values(r).some((v) => v !== null && v !== void 0 && String(v).toLowerCase().includes(kw)));
		});
		/** 进程/服务在前端按表头点击排序（数值列）；其它分区保持原序 */
		const tableRows = computed(() => {
			const s = sortState.value;
			const base = visibleRows.value;
			if (!s || active.value !== "processes" && active.value !== "services") return base;
			const key = s.key;
			const arr = [...base].sort((a, b) => {
				const va = Number(a?.[key]);
				const vb = Number(b?.[key]);
				return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
			});
			return s.dir === "desc" ? arr.reverse() : arr;
		});
		/** 当前分区可排序的列（服务 cpu/内存恒不采集，仅 PID 有意义） */
		function sortableColumns() {
			if (active.value === "processes") return [
				"pid",
				"cpu",
				"memory"
			];
			if (active.value === "services") return ["pid"];
			if (active.value === "firewall") return [
				"name",
				"direction",
				"action"
			];
			return [];
		}
		function isSortable(key) {
			return sortableColumns().includes(key);
		}
		/** 点击表头切换排序：未排→降序→升序→取消 */
		function onHeaderSort(key) {
			const cur = sortState.value;
			if (!cur || cur.key !== key) sortState.value = {
				key,
				dir: "desc"
			};
			else if (cur.dir === "desc") sortState.value = {
				key,
				dir: "asc"
			};
			else sortState.value = null;
		}
		const visibleHosts = computed(() => {
			const kw = search.value.toLowerCase();
			if (!kw) return props.hosts;
			return props.hosts.filter((h) => h.serverHostName.toLowerCase().includes(kw) || h.serverHostAddress.toLowerCase().includes(kw));
		});
		function selectHost(id) {
			if (selectedId.value === id) {
				railView.value = "summary";
				return;
			}
			selectedId.value = id;
			railView.value = "summary";
			rows.value = [];
			sectionError.value = "";
			resetPager();
			loadProfile();
			loadSection();
		}
		function pickSection(name) {
			active.value = name;
			resetPager();
			sortState.value = null;
			rows.value = [];
			loadSection();
		}
		watch(visibleHosts, (list) => {
			if (!list.length) return;
			const requested = props.initialHostId;
			if (requested != null && list.some((h) => h.id === requested)) {
				if (selectedId.value !== requested) focusRequested();
				return;
			}
			if (!list.some((h) => h.id === selectedId.value)) selectHost(list[0].id);
		}, { immediate: true });
		watch([() => props.openSeq, () => props.initialHostId], () => focusRequested());
		/** 父组件请求定位到某台主机（重复打开同一台也要重新拉数据） */
		function focusRequested() {
			const id = props.initialHostId;
			if (id == null || !props.hosts.some((h) => h.id === id)) return;
			const target = mapTab(props.initialTab) ?? "disks";
			selectedId.value = id;
			railView.value = "summary";
			active.value = target;
			resetPager();
			rows.value = [];
			sectionError.value = "";
			loadProfile();
			loadSection();
			if (autoRefresh.value && !timer) restartTimer();
		}
		/** 兼容旧入口传来的分区名（原「系统管理」那套 key） */
		function mapTab(tab) {
			if (!tab) return null;
			const key = tab.trim().toLowerCase();
			if (key.startsWith("network-interface") || key.startsWith("network-connection")) return "network";
			if (key === "partition" || key === "disk") return "disks";
			if (key === "process") return "processes";
			if (key === "service" || key === "system-service") return "services";
			if (key === "online" || key === "delay" || key === "metric") return "disks";
			return sections.some((s) => s.name === key) ? key : "disks";
		}
		/**
		* 拉取概览与实时指标。
		*
		* @param manual 是否用户主动刷新（只有主动刷新才回通知父组件重载列表，避免自动刷新把整表反复拉下来）
		*/
		async function loadProfile(manual = false) {
			const host = selectedHost.value;
			if (!host) return;
			const req = ++profileReq;
			const hid = host.id;
			if (persistedHostId.value !== hid) {
				info.value = {};
				metrics.value = {};
				snapshot.value = {};
				persisted.value = {};
			}
			loadingProfile.value = true;
			profileError.value = "";
			try {
				const data = await fetchHostProfile(hid, {
					live: manual,
					persist: true
				});
				if (req !== profileReq || selectedId.value !== hid) return;
				info.value = data?.info ?? {};
				metrics.value = data?.metrics ?? {};
				snapshot.value = data?.host ?? {};
				if (manual || persistedHostId.value !== hid) {
					persisted.value = data?.host ?? {};
					persistedHostId.value = hid;
				}
				agentPort.value = Number(data?.port) || 0;
				osMismatch.value = data?.osMismatch ?? "";
				if (manual) emit("refreshed");
			} catch (e) {
				if (req !== profileReq || selectedId.value !== hid) return;
				profileError.value = String(e?.message ?? e);
				info.value = {};
				metrics.value = {};
			} finally {
				if (req === profileReq) loadingProfile.value = false;
			}
		}
		async function loadSection() {
			const host = selectedHost.value;
			if (!host) return;
			const req = ++sectionReq;
			const hid = host.id;
			const sec = active.value;
			loadingSection.value = true;
			sectionError.value = "";
			try {
				const paged = sec === "processes" || sec === "services" || sec === "ports" || sec === "firewall";
				const res = await fetchHostProfileSection(hid, sec, paged ? page.value : void 0, paged ? pageSize.value : void 0, paged ? sectionKeyword.value.trim() : void 0);
				if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
				rows.value = res.rows ?? [];
			} catch (e) {
				if (req !== sectionReq || selectedId.value !== hid || active.value !== sec) return;
				sectionError.value = String(e?.message ?? e);
			} finally {
				if (req === sectionReq) loadingSection.value = false;
			}
		}
		/** IPv4 配置下发后：重新采集并刷新概要与网卡列表 */
		function onNetworkApplied() {
			loadProfile(true);
			loadSection();
		}
		function changePage(delta) {
			const next = page.value + delta;
			if (next < 1) return;
			page.value = next;
			loadSection();
		}
		/** 正在执行动作的行键，用于禁用同行按钮（同一时刻只允许一个远端写操作） */
		const busyRow = ref("");
		/** 当前主机 ID：动作端点据此路由通道，undefined 表示管控机本机 */
		function actionHostId() {
			const id = selectedHost.value?.id;
			return typeof id === "number" ? id : void 0;
		}
		/**
		* 执行一次远端写操作：成功回显后端文案并重拉分区；失败提示由传输层统一负责，这里只返回 false。
		*
		* @param key  行键，用于 loading
		* @param task 后端调用
		* @returns 是否成功
		*/
		async function runAction(key, task) {
			busyRow.value = key;
			try {
				const msg = await task;
				message.success(String(msg || "操作已完成"));
				await loadSection();
				return true;
			} catch {
				return false;
			} finally {
				busyRow.value = "";
			}
		}
		/**
		* 破坏性动作前的确认。用户取消返回 false。
		*
		* @param message 确认文案
		* @returns 是否继续
		*/
		async function confirmAction(message) {
			try {
				await ElMessageBox.confirm(message, "操作确认", {
					type: "warning",
					confirmButtonText: "确定",
					cancelButtonText: "取消"
				});
				return true;
			} catch {
				return false;
			}
		}
		/** 结束进程 */
		async function onKillProcess(row) {
			if (!await confirmAction(`确定结束进程 ${row.name ?? ""}（PID ${row.pid}）？该操作不可恢复。`)) return;
			await runAction(`kill-${row.pid}`, killProcess(Number(row.pid), actionHostId()));
		}
		/** 重启进程（后端读取原命令行与工作目录后重新拉起） */
		async function onRestartProcess(row) {
			if (!await confirmAction(`确定重启进程 ${row.name ?? ""}（PID ${row.pid}）？`)) return;
			await runAction(`restart-${row.pid}`, restartHostProcess(Number(row.pid), actionHostId()));
		}
		/** 服务是否处于未运行态（决定给「启动」还是「停止/重启」） */
		function isStoppedService(row) {
			const s = String(row.state ?? "").trim().toLowerCase();
			return !s || s === "stopped" || s === "inactive" || s === "failed" || s === "unknown";
		}
		/** 服务启停 */
		async function onServiceAction(row, action) {
			if (action !== "start" && !await confirmAction(`确定${action === "start" ? "启动" : action === "stop" ? "停止" : "重启"}服务 ${row.displayName || row.name}？`)) return;
			const call = action === "start" ? startService : action === "stop" ? stopService : restartService;
			await runAction(`service-${action}-${row.name}`, call(String(row.name), actionHostId()));
		}
		/** 关闭占用端口的进程 */
		async function onClosePortProcess(row) {
			if (!await confirmAction(`确定结束 PID ${row.pid}？它正占用 ${row.protocol ?? ""} ${row.port}。`)) return;
			await runAction(`netproc-${row.pid}-${row.port}`, closeNetProcess(Number(row.pid), Number(row.port) || void 0, actionHostId()));
		}
		/** 环境变量新增弹窗 */
		const envDialog = ref(false);
		const envForm = ref({
			name: "",
			value: ""
		});
		function openEnvDialog() {
			envForm.value = {
				name: "",
				value: ""
			};
			envDialog.value = true;
		}
		/** 提交环境变量 */
		async function submitEnv() {
			const name = envForm.value.name.trim();
			if (!name) {
				message.warning("请填写变量名");
				return;
			}
			if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
				message.warning("变量名只能包含字母、数字、下划线，且不能以数字开头");
				return;
			}
			const hid = actionHostId();
			if (hid == null) return;
			if (await runAction(`env-set-${name}`, setHostEnvVar(hid, name, envForm.value.value))) envDialog.value = false;
		}
		/** 删除环境变量 */
		async function onDeleteEnv(row) {
			const name = String(row.name ?? "");
			if (!await confirmAction(`确定删除系统级环境变量 ${name}？`)) return;
			const hid = actionHostId();
			if (hid == null) return;
			await runAction(`env-del-${name}`, deleteHostEnvVar(hid, name));
		}
		const analyzeVisible = ref(false);
		const treemapRef = ref(null);
		let treemap = null;
		let resizeObserver = null;
		/** 仅进程分区可分析；切换分区时 showAnalyze 变 false 自动销毁图表 */
		const showAnalyze = computed(() => active.value === "processes" && analyzeVisible.value);
		/** 读取 CSS 变量颜色（带兜底），矩形树图随主题着色，不硬编码 */
		function themeColor(name, fallback) {
			return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
		}
		/** 矩形树图数据：当前页进程按内存(MB)，按占用分档着色（与进程行阈值口径接近） */
		function treemapData() {
			const primary = themeColor("--el-color-primary", "#6d5dfc");
			const warning = themeColor("--el-color-warning", "#e6a23c");
			const danger = themeColor("--el-color-danger", "#e5534b");
			return tableRows.value.map((r) => {
				const mem = Number(r.memory);
				const value = Number.isFinite(mem) && mem > 0 ? mem : 0;
				const color = value >= 500 ? danger : value >= 150 ? warning : primary;
				return {
					name: String(r.name ?? "?"),
					pid: Number(r.pid),
					value,
					itemStyle: { color }
				};
			}).filter((d) => d.value > 0);
		}
		function buildTreemapOption() {
			const border = themeColor("--el-bg-color", "#ffffff");
			return {
				tooltip: { formatter: (p) => `${p.data.name}（PID ${p.data.pid}）<br/>内存：${p.value} MB` },
				series: [{
					type: "treemap",
					roam: false,
					nodeClick: false,
					breadcrumb: { show: false },
					width: "100%",
					height: "100%",
					label: {
						show: true,
						color: themeColor("--el-color-white", "#ffffff"),
						fontSize: 11,
						formatter: (p) => {
							const n = String(p.data.name ?? "");
							return n.length > 14 ? `${n.slice(0, 13)}…` : n;
						}
					},
					upperLabel: { show: false },
					itemStyle: {
						borderColor: border,
						borderWidth: 2,
						gapWidth: 2
					},
					data: treemapData()
				}]
			};
		}
		function renderTreemap() {
			if (!treemapRef.value) return;
			if (!treemap) {
				treemap = init(treemapRef.value);
				resizeObserver = new ResizeObserver(() => treemap && treemap.resize());
				resizeObserver.observe(treemapRef.value);
			}
			treemap.setOption(buildTreemapOption(), true);
		}
		function toggleAnalyze() {
			analyzeVisible.value = !analyzeVisible.value;
		}
		watch(showAnalyze, async (on) => {
			if (on) {
				await nextTick();
				renderTreemap();
				await nextTick();
				treemapRef.value?.scrollIntoView({ block: "nearest" });
			} else {
				if (resizeObserver) {
					resizeObserver.disconnect();
					resizeObserver = null;
				}
				if (treemap) {
					treemap.dispose();
					treemap = null;
				}
			}
		});
		watch(tableRows, () => {
			if (showAnalyze.value && treemap) treemap.setOption(buildTreemapOption(), true);
		});
		onBeforeUnmount(() => {
			if (resizeObserver) resizeObserver.disconnect();
			if (treemap) treemap.dispose();
		});
		function restartTimer() {
			if (timer) {
				window.clearInterval(timer);
				timer = void 0;
			}
			if (!autoRefresh.value) return;
			timer = window.setInterval(() => {
				if (!selectedHost.value || document.hidden) return;
				loadProfile();
				loadSection();
			}, AUTO_REFRESH_MILLIS);
		}
		watch(autoRefresh, restartTimer);
		watch(selectedId, () => {
			if (autoRefresh.value && !timer) restartTimer();
		});
		onBeforeUnmount(() => {
			if (timer) window.clearInterval(timer);
		});
		/** 常见进程品牌色（关键字命中即取，未命中按名称哈希兜底色） */
		const PROCESS_BRAND = [
			[/java|javaw|corretto|graal/i, "#b07219"],
			[/chrome/i, "#4285f4"],
			[/msedge|^edge/i, "#0ea5e9"],
			[/firefox/i, "#e64a19"],
			[/feishu|lark/i, "#3370ff"],
			[/doubao/i, "#4f46e5"],
			[/powershell|pwsh|cmd|conhost|windowsterminal/i, "#2b6cb0"],
			[/nginx/i, "#2e9d54"],
			[/node|npm|pnpm|yarn/i, "#3c873a"],
			[/python|py/i, "#3776ab"],
			[/mysqld|mariadb/i, "#00758f"],
			[/redis/i, "#d82c20"],
			[/postgres/i, "#336791"],
			[/explorer/i, "#f0a020"],
			[/docker|containerd/i, "#0db7ed"],
			[/sshd|ssh/i, "#5f6b7a"],
			[/system|svchost|services|smss|csrss|wininit/i, "#7a869a"]
		];
		/** 名称 → 头像（首字母 + 品牌色） */
		function logoOf(name) {
			const n = String(name ?? "");
			for (const [re, color] of PROCESS_BRAND) if (re.test(n)) return {
				letter: n.charAt(0).toUpperCase() || "?",
				color
			};
			let h = 0;
			for (let i = 0; i < n.length; i++) h = h * 31 + n.charCodeAt(i) >>> 0;
			return {
				letter: n.charAt(0).toUpperCase() || "?",
				color: `hsl(${h % 360} 48% 46%)`
			};
		}
		/** 服务头像：运行中取品牌色，已停止置灰 */
		function serviceLogo(r) {
			const base = logoOf(r?.name);
			return String(r?.state ?? "").trim().toUpperCase() === "RUNNING" ? base : {
				letter: base.letter,
				color: "#b6bcc7"
			};
		}
		/**
		* 前置图标列的统一渲染：
		*  1) 进程 / 运行中的服务 命中官方品牌 → 彩色 Logo（衬白色块）；
		*  2) 否则回退到「品牌色块 + 单色线性图形」；
		*  3) 再否则「品牌色块 + 首字母」。已停止的服务不显示彩色 Logo。
		*/
		function leadTile(section, r) {
			const brand = (section === "services" ? String(r?.state ?? "").trim().toUpperCase() === "RUNNING" : true) ? processBrandIcon(r?.name) : "";
			if (brand) return {
				brand,
				bg: "",
				glyph: "",
				letter: ""
			};
			const logo = section === "processes" ? logoOf(r?.name) : serviceLogo(r);
			return {
				brand: "",
				bg: logo.color,
				glyph: processGlyph(r?.name),
				letter: logo.letter
			};
		}
		/** 进程行阈值级别：CPU/内存超阈值整行变黄/红（Idle pid=0 排除） */
		function procLevel(r) {
			if (Number(r?.pid) === 0) return "";
			const cpu = Number(r?.cpu) || 0;
			const mem = Number(r?.memory) || 0;
			if (cpu >= 85 || mem >= 4096) return "row-danger";
			if (cpu >= 50 || mem >= 1024) return "row-warn";
			return "";
		}
		/** 服务/端口状态 → 图标（颜色 + 小图形），原始状态词交给 el-tooltip 展示 */
		function stateMeta(state) {
			const raw = String(state ?? "").trim();
			const s = raw.toLowerCase();
			let kind = "square";
			let c = "var(--el-text-color-secondary)";
			if (s === "running" || s === "active" || s === "listen" || s === "listening") {
				kind = "dot";
				c = "var(--el-color-success)";
			} else if (s === "failed" || s === "error") {
				kind = "warn";
				c = "var(--el-color-danger)";
			} else if (s === "stopped" || s === "inactive" || s === "dead" || s === "paused") {
				kind = "square";
				c = "var(--el-text-color-secondary)";
			} else if (s.includes("pending") || s === "activating" || s === "deactivating") {
				kind = "dot";
				c = "var(--el-color-warning)";
			} else if (s === "unconn") {
				kind = "hollow";
				c = "var(--el-text-color-secondary)";
			}
			return {
				svg: `<svg viewBox="0 0 16 16" width="15" height="15" style="color:${c}">${{
					dot: "<circle cx=\"8\" cy=\"8\" r=\"4.4\" fill=\"currentColor\"/>",
					hollow: "<circle cx=\"8\" cy=\"8\" r=\"4.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/>",
					square: "<rect x=\"3.6\" y=\"3.6\" width=\"8.8\" height=\"8.8\" rx=\"2\" fill=\"currentColor\"/>",
					warn: "<path d=\"M8 2.6 L13.6 12.2 H2.4 Z\" fill=\"currentColor\"/><rect x=\"7.3\" y=\"5.8\" width=\"1.4\" height=\"3.2\" rx=\".7\" fill=\"#fff\"/><circle cx=\"8\" cy=\"10.5\" r=\".8\" fill=\"#fff\"/>"
				}[kind]}</svg>`,
				tip: raw || "—"
			};
		}
		function onlineState(h) {
			return props.liveOnline[h.id] ?? h.serverHostOnline;
		}
		function delayOf(h) {
			const v = props.liveDelay[h.id];
			if (v != null) return v;
			return h.serverHostDelayMs ?? null;
		}
		function delayText(ms) {
			if (ms == null) return "—";
			if (ms < 0) return "不可达";
			return ms + " ms";
		}
		function delayBad(ms) {
			return ms != null && (ms < 0 || ms > 200);
		}
		function protocolOf(h) {
			const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
			if (configured === "SSH" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
			const s = (h.serverHostOsType ?? "").toUpperCase();
			if (s.includes("WIN")) return "rdp";
			if (s.includes("MAC")) return "vnc";
			return "ssh";
		}
		function groupName(id) {
			if (!id) return "—";
			return props.groups.find((g) => g.id === id)?.msServerGroupName ?? "组#" + id;
		}
		function show(v, fallback = "—") {
			if (v === null || v === void 0) return fallback;
			const text = String(v).trim();
			return text === "" ? fallback : text;
		}
		function num(v) {
			const n = Number(v);
			return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
		}
		function fmtNum(v) {
			const n = Number(v);
			return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "—";
		}
		function humanUptime(sec) {
			if (!sec || sec <= 0) return "—";
			const d = Math.floor(sec / 86400);
			const h = Math.floor(sec % 86400 / 3600);
			const m = Math.floor(sec % 3600 / 60);
			if (d > 0) return `${d} 天 ${h} 小时`;
			if (h > 0) return `${h} 小时 ${m} 分`;
			return `${m} 分`;
		}
		computed(() => humanUptime(Number(metrics.value.uptimeSec ?? info.value.uptimeSec ?? 0)));
		const fmtRate = (v) => {
			const n = num(v);
			if (n >= 1024) return `${(n / 1024).toFixed(1)} MB/s`;
			return `${n.toFixed(0)} KB/s`;
		};
		const gauges = computed(() => {
			const m = metrics.value;
			const cpu = num(m.cpuPercent);
			const memPct = num(m.memoryPercent);
			const diskPct = num(m.diskPercent);
			const netPct = num(m.networkPercent);
			return [
				{
					label: "CPU",
					percent: cpu,
					detail: `${m.processCount ?? "—"} 进程 · ${m.threadCount ?? "—"} 线程`,
					bad: cpu >= 85
				},
				{
					label: "内存",
					percent: memPct,
					detail: `${fmtNum(m.memoryUsedMb)} / ${fmtNum(m.memoryTotalMb)} MB`,
					bad: memPct >= 90
				},
				{
					label: "磁盘",
					percent: diskPct,
					detail: `${fmtNum(m.diskUsedGb)} / ${fmtNum(m.diskTotalGb)} GB`,
					bad: diskPct >= 90
				},
				{
					label: "网络",
					percent: netPct,
					detail: `↓ ${fmtRate(m.networkRxKb)} / ↑ ${fmtRate(m.networkTxKb)}`,
					bad: netPct >= 85
				}
			];
		});
		/** Windows 驱动器磁贴辅助 */
		const driveLetter = (d) => {
			const n = String(d.name || d.mount || "");
			const m = n.match(/([A-Za-z]):/);
			return m ? m[1].toUpperCase() + ":" : n.slice(0, 2);
		};
		const driveUsedPct = (d) => {
			const total = Number(d.totalGb ?? 0);
			if (total > 0) return Math.max(0, Math.min(100, Number(d.usedGb ?? 0) / total * 100));
			return Math.max(0, Math.min(100, Number(d.usage ?? 0)));
		};
		const driveLow = (d) => {
			const total = Number(d.totalGb ?? 0);
			if (total <= 0) return false;
			return Number(d.availGb ?? 0) / total < .1;
		};
		/** 驱动器根路径：Windows 为盘符根（C:\），Linux 为挂载点 */
		const driveRoot = (d) => {
			const letter = driveLetter(d);
			if (/^[A-Za-z]:$/.test(letter)) return letter + "\\";
			return String(d.mount || d.name || "/");
		};
		/** 文件管理器弹窗 */
		const fileManagerVisible = ref(false);
		const fileManagerPath = ref("");
		const fileManagerPlatform = computed(() => String(selectedHost.value?.serverHostOsType || "LINUX"));
		function openFileManager(d) {
			fileManagerPath.value = driveRoot(d);
			fileManagerVisible.value = true;
		}
		/** 任一通道（Agent / SSH / 本机）拿到真实指标即展示明细，不再仅以 agent 就绪为准 */
		const hasMetrics = computed(() => !profileError.value && (Number(metrics.value.memoryTotalMb ?? 0) > 0 || Number(metrics.value.diskTotalGb ?? 0) > 0));
		const overviewRows = computed(() => {
			const i = info.value;
			const h = selectedHost.value;
			const p = persisted.value || {};
			const upSec = Number(p.serverHostUptimeSec ?? i.uptimeSec ?? 0);
			return [
				{
					label: "主机名",
					value: show(p.serverHostOsHostname ?? p.serverHostName ?? i.hostname)
				},
				{
					label: "操作系统",
					value: show(p.serverHostOsType ?? i.osName ?? i.os)
				},
				{
					label: "主机版本",
					value: show(p.serverHostOsVersion ?? i.osVersion)
				},
				{
					label: "架构",
					value: show(p.serverHostOsArch ?? i.arch)
				},
				{
					label: "CPU 核数",
					value: show(p.serverHostCpuCores ?? i.cpuCores)
				},
				{
					label: "显卡",
					value: show(i.gpu)
				},
				{
					label: "内存",
					value: p.serverHostMemoryMb ? `${fmtNum(p.serverHostMemoryMb)} MB` : i.memoryMb ? `${fmtNum(i.memoryMb)} MB` : "—"
				},
				{
					label: "磁盘总量",
					value: p.serverHostDiskGb ? `${fmtNum(p.serverHostDiskGb)} GB` : i.diskTotalGb ? `${fmtNum(i.diskTotalGb)} GB` : "—"
				},
				{
					label: "内网 IP",
					value: show(p.serverHostPrivateIp ?? i.privateIp),
					mono: true
				},
				{
					label: "公网 IP",
					value: show(p.serverHostPublicIp ?? i.publicIp),
					mono: true
				},
				{
					label: "网卡 MAC",
					value: show(p.serverHostMac ?? i.mac),
					mono: true
				},
				{
					label: "运行时长",
					value: humanUptime(upSec)
				},
				{
					label: "Java 版本",
					value: show(p.serverHostJavaVersion ?? i.javaVersion)
				},
				{
					label: "主机编码",
					value: show(h?.serverHostCode ?? p.serverHostCode),
					mono: true
				},
				{
					label: "最后采集",
					value: show(p.serverHostLastCollectTime)
				},
				{
					label: "分组",
					value: groupName(h?.msServerGroupId ?? p.msServerGroupId)
				},
				{
					label: "备注",
					value: show(h?.serverHostDescription ?? p.serverHostDescription)
				}
			];
		});
		return (_ctx, _cache) => {
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReStatusIndicator = resolveComponent("ReStatusIndicator");
			const _component_ReScrollbar = resolveComponent("ReScrollbar");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			const _component_el_input = resolveComponent("el-input");
			return openBlock(), createElementBlock("div", _hoisted_1$4, [
				createBaseVNode("aside", _hoisted_2$3, [railView.value === "list" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
					createBaseVNode("div", _hoisted_3$3, [_cache[18] || (_cache[18] = createBaseVNode("span", { class: "rail-title" }, "主机画像", -1)), createBaseVNode("span", _hoisted_4$3, toDisplayString(__props.hosts.length), 1)]),
					createVNode(_component_ReInput, {
						modelValue: search.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => search.value = $event),
						placeholder: "搜索名称 / IP",
						clearable: "",
						class: "rail-search"
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReScrollbar, { class: "rail-list" }, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(visibleHosts.value, (h) => {
							return openBlock(), createElementBlock("div", {
								key: h.id,
								class: normalizeClass(["rail-item", { active: selectedId.value === h.id }]),
								onClick: ($event) => selectHost(h.id)
							}, [
								createBaseVNode("span", _hoisted_6$2, [createBaseVNode("span", { innerHTML: unref(osIconSvg)(h.serverHostOsType) }, null, 8, _hoisted_7$2)]),
								createBaseVNode("div", _hoisted_8$2, [createBaseVNode("b", _hoisted_9$2, toDisplayString(h.serverHostName), 1), createBaseVNode("span", _hoisted_10$2, toDisplayString(h.serverHostAddress), 1)]),
								createVNode(_component_ReStatusIndicator, { type: onlineState(h) === 1 ? "success" : "danger" }, null, 8, ["type"])
							], 10, _hoisted_5$3);
						}), 128)), visibleHosts.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_11$1, "无匹配主机")) : createCommentVNode("", true)]),
						_: 1
					})
				], 64)) : (openBlock(), createElementBlock("div", _hoisted_12$1, [createBaseVNode("button", {
					class: "rs-back",
					onClick: backToList
				}, [..._cache[19] || (_cache[19] = [createBaseVNode("span", { class: "rs-back-arrow" }, "←", -1), createTextVNode(" 主机列表 ", -1)])]), selectedHost.value ? (openBlock(), createBlock(_component_ReScrollbar, {
					key: 0,
					class: "rs-scroll"
				}, {
					default: withCtx(() => [
						createBaseVNode("div", _hoisted_13$1, [
							createBaseVNode("span", _hoisted_14$1, [createBaseVNode("span", { innerHTML: unref(osIconSvg)(selectedHost.value?.serverHostOsType) }, null, 8, _hoisted_15$1)]),
							createBaseVNode("b", _hoisted_16$1, toDisplayString(selectedHost.value?.serverHostName), 1),
							createBaseVNode("span", _hoisted_17$1, toDisplayString(selectedHost.value?.serverHostAddress) + ":" + toDisplayString(selectedHost.value?.serverHostPort), 1),
							createBaseVNode("div", _hoisted_18$1, [createBaseVNode("span", { class: normalizeClass(["pill", onlineState(selectedHost.value) === 1 ? "pill-ok" : "pill-bad"]) }, toDisplayString(onlineState(selectedHost.value) === 1 ? "在线" : "离线"), 3), createBaseVNode("span", { class: normalizeClass(["pill", delayBad(delayOf(selectedHost.value)) ? "pill-warn" : "pill-mute"]) }, toDisplayString(delayText(delayOf(selectedHost.value))), 3)])
						]),
						_cache[20] || (_cache[20] = createBaseVNode("div", { class: "rs-section-title" }, "概要信息", -1)),
						createBaseVNode("div", _hoisted_19$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(overviewRows.value, (row) => {
							return openBlock(), createElementBlock("div", {
								key: row.label,
								class: "rs-row"
							}, [createBaseVNode("span", _hoisted_20$1, toDisplayString(row.label), 1), createBaseVNode("span", { class: normalizeClass(["rs-val", {
								mono: row.mono,
								dim: row.value === "—"
							}]) }, toDisplayString(row.value), 3)]);
						}), 128))])
					]),
					_: 1
				})) : (openBlock(), createElementBlock("div", _hoisted_21$1, "主机不可用，请返回列表重选"))]))]),
				createBaseVNode("section", _hoisted_22$1, [!selectedHost.value ? (openBlock(), createElementBlock("div", _hoisted_23$1, [createVNode(_component_ReEmpty, { description: "从左侧选择一台主机查看画像" })])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
					createBaseVNode("div", _hoisted_24$1, [
						createBaseVNode("span", _hoisted_25$1, [createBaseVNode("span", { innerHTML: unref(osIconSvg)(selectedHost.value.serverHostOsType) }, null, 8, _hoisted_26$1)]),
						createBaseVNode("div", _hoisted_27$1, [createBaseVNode("b", _hoisted_28$1, toDisplayString(selectedHost.value.serverHostName), 1), createBaseVNode("span", _hoisted_29$1, toDisplayString(selectedHost.value.serverHostAddress) + ":" + toDisplayString(selectedHost.value.serverHostPort) + " · " + toDisplayString(protocolOf(selectedHost.value).toUpperCase()) + " · Agent :" + toDisplayString(agentPort.value || "—"), 1)]),
						createBaseVNode("div", _hoisted_30$1, [
							createBaseVNode("span", { class: normalizeClass(["pill", onlineState(selectedHost.value) === 1 ? "pill-ok" : "pill-bad"]) }, toDisplayString(onlineState(selectedHost.value) === 1 ? "在线" : "离线"), 3),
							createBaseVNode("span", { class: normalizeClass(["pill", delayBad(delayOf(selectedHost.value)) ? "pill-warn" : "pill-mute"]) }, toDisplayString(delayText(delayOf(selectedHost.value))), 3),
							isAgentMode.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [agentReady.value ? (openBlock(), createElementBlock("span", _hoisted_31$1, "Agent v" + toDisplayString(agentVersion.value || "?"), 1)) : (openBlock(), createElementBlock("span", _hoisted_32$1, "Agent 未就绪"))], 64)) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_33$1, [
							createVNode(_component_ReButton, {
								icon: "Refresh",
								layout: "square",
								type: "primary",
								loading: loadingProfile.value,
								onClick: _cache[1] || (_cache[1] = ($event) => loadProfile(true))
							}, {
								default: withCtx(() => [..._cache[21] || (_cache[21] = [createTextVNode("刷新主机", -1)])]),
								_: 1
							}, 8, ["loading"]),
							isAgentMode.value && !agentReady.value ? (openBlock(), createBlock(_component_ReButton, {
								key: 0,
								icon: "Download",
								layout: "square",
								type: "success",
								onClick: _cache[2] || (_cache[2] = ($event) => emit("deploy-agent", selectedHost.value))
							}, {
								default: withCtx(() => [..._cache[22] || (_cache[22] = [createTextVNode("安装 Agent", -1)])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(_component_ReButton, {
								icon: "Connection",
								layout: "square",
								onClick: _cache[3] || (_cache[3] = ($event) => emit("connect", selectedHost.value))
							}, {
								default: withCtx(() => [..._cache[23] || (_cache[23] = [createTextVNode("连接", -1)])]),
								_: 1
							}),
							createVNode(_component_ReButton, {
								icon: "TrendCharts",
								layout: "square",
								onClick: _cache[4] || (_cache[4] = ($event) => emit("detail", selectedHost.value))
							}, {
								default: withCtx(() => [..._cache[24] || (_cache[24] = [createTextVNode("监控详情", -1)])]),
								_: 1
							}),
							createVNode(_component_ReButton, {
								icon: "EditPen",
								layout: "square",
								onClick: _cache[5] || (_cache[5] = ($event) => emit("edit", selectedHost.value))
							}, {
								default: withCtx(() => [..._cache[25] || (_cache[25] = [createTextVNode("编辑", -1)])]),
								_: 1
							}),
							createBaseVNode("label", _hoisted_34$1, [createVNode(_component_ReSwitch, {
								modelValue: autoRefresh.value,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => autoRefresh.value = $event)
							}, null, 8, ["modelValue"]), _cache[26] || (_cache[26] = createBaseVNode("span", null, "10s 自动刷新", -1))])
						])
					]),
					profileError.value ? (openBlock(), createElementBlock("div", _hoisted_35$1, [
						_cache[27] || (_cache[27] = createBaseVNode("b", null, "通道读取失败：", -1)),
						createTextVNode(toDisplayString(profileError.value) + " ", 1),
						createBaseVNode("div", _hoisted_36$1, " 画像各分区都依赖采集通道（Agent / SSH / WinRM / 本机）。主机台账记录的最近错误：" + toDisplayString(show(snapshot.value.serverHostAgentError, "无")) + "； 未安装时可点右上「安装 Agent」。 ", 1)
					])) : osMismatch.value ? (openBlock(), createElementBlock("div", _hoisted_37$1, toDisplayString(osMismatch.value), 1)) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_38$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(gauges.value, (g) => {
						return openBlock(), createElementBlock("div", {
							key: g.label,
							class: "gauge"
						}, [
							createBaseVNode("div", _hoisted_39$1, [createBaseVNode("span", _hoisted_40$1, toDisplayString(g.label), 1), createBaseVNode("span", { class: normalizeClass(["gauge-val", { bad: g.bad }]) }, toDisplayString(g.percent) + "%", 3)]),
							createBaseVNode("div", _hoisted_41$1, [createBaseVNode("i", {
								class: normalizeClass({ bad: g.bad }),
								style: normalizeStyle({ width: Math.min(100, g.percent) + "%" })
							}, null, 6)]),
							createBaseVNode("div", _hoisted_42$1, toDisplayString(hasMetrics.value ? g.detail : "等待通道数据"), 1)
						]);
					}), 128))]),
					createBaseVNode("div", _hoisted_43$1, [(openBlock(), createElementBlock(Fragment, null, renderList(sections, (s) => {
						return createBaseVNode("button", {
							key: s.name,
							class: normalizeClass(["seg-item", { active: active.value === s.name }]),
							onClick: ($event) => pickSection(s.name)
						}, toDisplayString(s.label), 11, _hoisted_44$1);
					}), 64))]),
					createBaseVNode("div", _hoisted_45$1, [active.value !== "network" ? (openBlock(), createElementBlock("div", _hoisted_46$1, [createBaseVNode("span", _hoisted_47$1, [createTextVNode(toDisplayString(sectionKeyword.value.trim() ? `命中 ${visibleRows.value.length} 条` : active.value === "disks" ? `共 ${visibleRows.value.length} 个驱动器` : `共 ${visibleRows.value.length} 条`) + " ", 1), pagedSection.value && page.value > 1 ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("（第 " + toDisplayString(page.value) + " 页）", 1)], 64)) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_48$1, [
						createVNode(_component_ReInput, {
							modelValue: sectionKeyword.value,
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => sectionKeyword.value = $event),
							class: "sec-search",
							placeholder: keywordPlaceholder.value,
							clearable: "",
							onKeyup: _cache[8] || (_cache[8] = withKeys(($event) => pagedSection.value && applyKeyword(), ["enter"])),
							onClear: _cache[9] || (_cache[9] = ($event) => pagedSection.value && applyKeyword())
						}, null, 8, ["modelValue", "placeholder"]),
						pagedSection.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
							createVNode(_component_ReButton, {
								disabled: loadingSection.value,
								onClick: applyKeyword
							}, {
								default: withCtx(() => [..._cache[28] || (_cache[28] = [createTextVNode("搜索", -1)])]),
								_: 1
							}, 8, ["disabled"]),
							createVNode(_component_ReButton, {
								disabled: page.value <= 1 || loadingSection.value,
								onClick: _cache[10] || (_cache[10] = ($event) => changePage(-1))
							}, {
								default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("上一页", -1)])]),
								_: 1
							}, 8, ["disabled"]),
							createBaseVNode("span", _hoisted_49$1, toDisplayString(page.value), 1),
							createVNode(_component_ReButton, {
								disabled: loadingSection.value || rows.value.length < pageSize.value,
								onClick: _cache[11] || (_cache[11] = ($event) => changePage(1))
							}, {
								default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("下一页", -1)])]),
								_: 1
							}, 8, ["disabled"])
						], 64)) : createCommentVNode("", true),
						createVNode(_component_ReButton, {
							type: "primary",
							layout: "square",
							icon: "Refresh",
							loading: loadingSection.value,
							onClick: loadSection
						}, {
							default: withCtx(() => [..._cache[31] || (_cache[31] = [createTextVNode("刷新", -1)])]),
							_: 1
						}, 8, ["loading"]),
						active.value === "processes" ? (openBlock(), createBlock(_component_ReButton, {
							key: 1,
							layout: "square",
							icon: "DataAnalysis",
							type: analyzeVisible.value ? "primary" : "",
							onClick: toggleAnalyze
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(analyzeVisible.value ? "收起分析" : "分析"), 1)]),
							_: 1
						}, 8, ["type"])) : createCommentVNode("", true)
					])])) : createCommentVNode("", true), sectionError.value ? (openBlock(), createElementBlock("div", _hoisted_50$1, toDisplayString(sectionError.value), 1)) : loadingSection.value && !rows.value.length ? (openBlock(), createElementBlock("div", _hoisted_51$1, "正在拉取…")) : !visibleRows.value.length ? (openBlock(), createElementBlock("div", _hoisted_52$1, toDisplayString(sectionKeyword.value.trim() ? "关键字未命中任何一行" : "该分区无数据"), 1)) : active.value === "disks" ? (openBlock(), createElementBlock("div", _hoisted_53$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(visibleRows.value, (d, idx) => {
						return openBlock(), createElementBlock("div", {
							key: idx,
							class: "drive",
							onClick: ($event) => openFileManager(d),
							onDblclick: ($event) => openFileManager(d)
						}, [createBaseVNode("div", _hoisted_55$1, [_cache[32] || (_cache[32] = createStaticVNode("<svg viewBox=\"0 0 48 48\" width=\"46\" height=\"46\" data-v-f1d1b8e2><defs data-v-f1d1b8e2><linearGradient id=\"driveBody\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-f1d1b8e2><stop offset=\"0\" stop-color=\"#fcfdff\" data-v-f1d1b8e2></stop><stop offset=\"0.55\" stop-color=\"#edf0f5\" data-v-f1d1b8e2></stop><stop offset=\"1\" stop-color=\"#d6dbe4\" data-v-f1d1b8e2></stop></linearGradient><linearGradient id=\"driveTop\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-f1d1b8e2><stop offset=\"0\" stop-color=\"#ffffff\" data-v-f1d1b8e2></stop><stop offset=\"1\" stop-color=\"#e6eaf1\" data-v-f1d1b8e2></stop></linearGradient><clipPath id=\"driveClip\" data-v-f1d1b8e2><rect x=\"4\" y=\"15\" width=\"40\" height=\"20\" rx=\"4.5\" data-v-f1d1b8e2></rect></clipPath></defs><rect x=\"4\" y=\"15\" width=\"40\" height=\"20\" rx=\"4.5\" fill=\"url(#driveBody)\" stroke=\"#b4bac7\" stroke-width=\"1\" data-v-f1d1b8e2></rect><rect x=\"4\" y=\"15\" width=\"40\" height=\"7.6\" fill=\"url(#driveTop)\" clip-path=\"url(#driveClip)\" data-v-f1d1b8e2></rect><line x1=\"4.5\" y1=\"22.6\" x2=\"43.5\" y2=\"22.6\" stroke=\"#c4cad4\" stroke-width=\"0.9\" data-v-f1d1b8e2></line><circle cx=\"39.4\" cy=\"18.8\" r=\"2.7\" fill=\"#7ed957\" opacity=\"0.28\" data-v-f1d1b8e2></circle><circle cx=\"39.4\" cy=\"18.8\" r=\"1.5\" fill=\"#57b834\" data-v-f1d1b8e2></circle><line x1=\"9\" y1=\"30.4\" x2=\"25\" y2=\"30.4\" stroke=\"#c0c6d1\" stroke-width=\"0.9\" stroke-linecap=\"round\" data-v-f1d1b8e2></line></svg>", 1)), createBaseVNode("span", _hoisted_56$1, toDisplayString(driveLetter(d)), 1)]), createBaseVNode("div", _hoisted_57$1, [
							createBaseVNode("b", _hoisted_58$1, [createTextVNode(toDisplayString(d.name || d.mount), 1), d.fsType ? (openBlock(), createElementBlock("span", _hoisted_59$1, " · " + toDisplayString(d.fsType), 1)) : createCommentVNode("", true)]),
							createBaseVNode("div", _hoisted_60$1, [createBaseVNode("i", {
								class: normalizeClass({ low: driveLow(d) }),
								style: normalizeStyle({ width: driveUsedPct(d) + "%" })
							}, null, 6)]),
							createBaseVNode("span", _hoisted_61$1, "已用 " + toDisplayString(fmtNum(d.usedGb)) + " GB · 共 " + toDisplayString(fmtNum(d.totalGb)) + " GB", 1)
						])], 40, _hoisted_54$1);
					}), 128))])) : active.value === "network" ? (openBlock(), createElementBlock("div", _hoisted_62, [createVNode(HostNetworkAdapters_default, {
						"host-id": selectedHost.value.id,
						rows: rows.value,
						platform: selectedHost.value.serverHostOsType,
						onApplied: onNetworkApplied
					}, null, 8, [
						"host-id",
						"rows",
						"platform"
					])])) : (openBlock(), createElementBlock("div", {
						key: 6,
						class: normalizeClass(["tbl-wrap", { "analyze-split": showAnalyze.value }])
					}, [
						active.value === "env" ? (openBlock(), createElementBlock("div", _hoisted_63, [createVNode(_component_ReButton, {
							type: "primary",
							layout: "square",
							icon: "Plus",
							onClick: _cache[12] || (_cache[12] = ($event) => openEnvDialog())
						}, {
							default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode(" 新增变量 ", -1)])]),
							_: 1
						})])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_64, [createBaseVNode("table", _hoisted_65, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [
							active.value === "processes" || active.value === "services" ? (openBlock(), createElementBlock("th", _hoisted_66)) : createCommentVNode("", true),
							(openBlock(true), createElementBlock(Fragment, null, renderList(columns.value, (col) => {
								return openBlock(), createElementBlock("th", {
									key: col.key,
									style: normalizeStyle(col.width ? { width: col.width } : {}),
									class: normalizeClass({
										sortable: isSortable(col.key),
										"sort-on": sortState.value?.key === col.key
									}),
									onClick: ($event) => isSortable(col.key) && onHeaderSort(col.key)
								}, [createBaseVNode("span", _hoisted_68, toDisplayString(col.label), 1), isSortable(col.key) ? (openBlock(), createElementBlock("span", _hoisted_69, [sortState.value?.key === col.key ? (openBlock(), createElementBlock("span", _hoisted_70, toDisplayString(sortState.value.dir === "desc" ? "▼" : "▲"), 1)) : (openBlock(), createElementBlock("span", _hoisted_71, "⇅"))])) : createCommentVNode("", true)], 14, _hoisted_67);
							}), 128)),
							hasActions.value ? (openBlock(), createElementBlock("th", _hoisted_72, "操作")) : createCommentVNode("", true)
						])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(tableRows.value, (r, idx) => {
							return openBlock(), createElementBlock("tr", {
								key: idx,
								class: normalizeClass(active.value === "processes" ? procLevel(r) : "")
							}, [
								active.value === "processes" || active.value === "services" ? (openBlock(), createElementBlock("td", _hoisted_73, [leadTile(active.value, r).brand ? (openBlock(), createElementBlock("span", {
									key: 0,
									class: "cell-brand cell-brand--lead",
									innerHTML: leadTile(active.value, r).brand
								}, null, 8, _hoisted_74)) : (openBlock(), createElementBlock("span", {
									key: 1,
									class: "cell-logo cell-logo--lead",
									style: normalizeStyle({ background: leadTile(active.value, r).bg })
								}, [leadTile(active.value, r).glyph ? (openBlock(), createElementBlock("span", {
									key: 0,
									class: "lead-glyph",
									innerHTML: leadTile(active.value, r).glyph
								}, null, 8, _hoisted_75)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(leadTile(active.value, r).letter), 1)], 64))], 4))])) : createCommentVNode("", true),
								(openBlock(true), createElementBlock(Fragment, null, renderList(columns.value, (col) => {
									return openBlock(), createElementBlock("td", { key: col.key }, [col.key === "name" ? (openBlock(), createBlock(_component_el_tooltip, {
										key: 0,
										content: String(r.name ?? ""),
										placement: "top",
										"show-after": 200
									}, {
										default: withCtx(() => [createBaseVNode("span", _hoisted_76, toDisplayString(r.name), 1)]),
										_: 2
									}, 1032, ["content"])) : col.key === "command" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [String(r.command ?? "").trim() ? (openBlock(), createBlock(_component_el_tooltip, {
										key: 0,
										content: String(r.command),
										placement: "top-start",
										"show-after": 200,
										"popper-class": "cmd-tip"
									}, {
										default: withCtx(() => [createBaseVNode("span", _hoisted_77, toDisplayString(r.command), 1)]),
										_: 2
									}, 1032, ["content"])) : (openBlock(), createElementBlock("span", _hoisted_78, "—"))], 64)) : col.key === "state" ? (openBlock(), createBlock(_component_el_tooltip, {
										key: 2,
										content: stateMeta(r.state).tip,
										placement: "top",
										"show-after": 150
									}, {
										default: withCtx(() => [createBaseVNode("span", {
											class: "state-ico",
											innerHTML: stateMeta(r.state).svg
										}, null, 8, _hoisted_79)]),
										_: 2
									}, 1032, ["content"])) : (openBlock(), createElementBlock(Fragment, { key: 3 }, [String(r[col.key] ?? "").trim() ? (openBlock(), createBlock(_component_el_tooltip, {
										key: 0,
										content: String(r[col.key]),
										placement: "top",
										"show-after": 200
									}, {
										default: withCtx(() => [createBaseVNode("span", _hoisted_80, toDisplayString(show(r[col.key], "")), 1)]),
										_: 2
									}, 1032, ["content"])) : (openBlock(), createElementBlock("span", _hoisted_81, "—"))], 64))]);
								}), 128)),
								hasActions.value ? (openBlock(), createElementBlock("td", _hoisted_82, [createBaseVNode("div", _hoisted_83, [active.value === "processes" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(_component_ReButton, {
									layout: "square",
									icon: "RefreshRight",
									loading: busyRow.value === `restart-${r.pid}`,
									disabled: !Number(r.pid) || !String(r.command ?? "").trim(),
									title: String(r.command ?? "").trim() ? "" : "该进程读不到命令行，无法按原样重启",
									onClick: ($event) => onRestartProcess(r)
								}, {
									default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("重启", -1)])]),
									_: 1
								}, 8, [
									"loading",
									"disabled",
									"title",
									"onClick"
								]), createVNode(_component_ReButton, {
									type: "danger",
									layout: "square",
									icon: "CircleClose",
									loading: busyRow.value === `kill-${r.pid}`,
									disabled: !Number(r.pid),
									onClick: ($event) => onKillProcess(r)
								}, {
									default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode("结束", -1)])]),
									_: 1
								}, 8, [
									"loading",
									"disabled",
									"onClick"
								])], 64)) : active.value === "services" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [isStoppedService(r) ? (openBlock(), createBlock(_component_ReButton, {
									key: 0,
									type: "primary",
									layout: "square",
									icon: "VideoPlay",
									loading: busyRow.value === `service-start-${r.name}`,
									onClick: ($event) => onServiceAction(r, "start")
								}, {
									default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("启动", -1)])]),
									_: 1
								}, 8, ["loading", "onClick"])) : (openBlock(), createBlock(_component_ReButton, {
									key: 1,
									layout: "square",
									icon: "RefreshRight",
									loading: busyRow.value === `service-restart-${r.name}`,
									onClick: ($event) => onServiceAction(r, "restart")
								}, {
									default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode("重启", -1)])]),
									_: 1
								}, 8, ["loading", "onClick"])), !isStoppedService(r) ? (openBlock(), createBlock(_component_ReButton, {
									key: 2,
									type: "danger",
									layout: "square",
									icon: "VideoPause",
									loading: busyRow.value === `service-stop-${r.name}`,
									onClick: ($event) => onServiceAction(r, "stop")
								}, {
									default: withCtx(() => [..._cache[38] || (_cache[38] = [createTextVNode("停止", -1)])]),
									_: 1
								}, 8, ["loading", "onClick"])) : createCommentVNode("", true)], 64)) : active.value === "env" ? (openBlock(), createBlock(_component_ReButton, {
									key: 2,
									type: "danger",
									layout: "square",
									icon: "Delete",
									loading: busyRow.value === `env-del-${r.name}`,
									onClick: ($event) => onDeleteEnv(r)
								}, {
									default: withCtx(() => [..._cache[39] || (_cache[39] = [createTextVNode("删除", -1)])]),
									_: 1
								}, 8, ["loading", "onClick"])) : (openBlock(), createBlock(_component_ReButton, {
									key: 3,
									type: "danger",
									layout: "square",
									icon: "CircleClose",
									loading: busyRow.value === `netproc-${r.pid}-${r.port}`,
									disabled: !Number(r.pid),
									title: Number(r.pid) ? "" : "该端口无归属进程，无法结束",
									onClick: ($event) => onClosePortProcess(r)
								}, {
									default: withCtx(() => [..._cache[40] || (_cache[40] = [createTextVNode("结束", -1)])]),
									_: 1
								}, 8, [
									"loading",
									"disabled",
									"title",
									"onClick"
								]))])])) : createCommentVNode("", true)
							], 2);
						}), 128))])])]),
						showAnalyze.value ? (openBlock(), createElementBlock("div", _hoisted_84, [_cache[41] || (_cache[41] = createBaseVNode("div", { class: "analyze-head" }, [createBaseVNode("span", null, "内存占用矩形树图"), createBaseVNode("small", { class: "dim" }, "单位 MB · 随当前页数据刷新")], -1)), createBaseVNode("div", {
							ref_key: "treemapRef",
							ref: treemapRef,
							class: "analyze-chart"
						}, null, 512)])) : createCommentVNode("", true)
					], 2))])
				], 64))]),
				createVNode(unref(component), {
					modelValue: fileManagerVisible.value,
					"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => fileManagerVisible.value = $event),
					title: "文件管理 - " + (selectedHost.value?.serverHostName || ""),
					width: "86%",
					top: "6vh",
					"append-to-body": "",
					"destroy-on-close": "",
					class: "host-fm-dialog"
				}, {
					default: withCtx(() => [selectedHost.value ? (openBlock(), createBlock(HostFileManager_default, {
						key: 0,
						"host-id": selectedHost.value.id,
						"initial-path": fileManagerPath.value,
						platform: fileManagerPlatform.value
					}, null, 8, [
						"host-id",
						"initial-path",
						"platform"
					])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: envDialog.value,
					"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => envDialog.value = $event),
					title: "新增系统级环境变量",
					width: "520px",
					"append-to-body": "",
					class: "host-sub-dialog"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[16] || (_cache[16] = ($event) => envDialog.value = false) }, {
						default: withCtx(() => [..._cache[44] || (_cache[44] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: busyRow.value.startsWith("env-set"),
						onClick: submitEnv
					}, {
						default: withCtx(() => [..._cache[45] || (_cache[45] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_85, [
						_cache[42] || (_cache[42] = createBaseVNode("label", { class: "sub-label" }, "变量名", -1)),
						createVNode(_component_el_input, {
							modelValue: envForm.value.name,
							"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => envForm.value.name = $event),
							placeholder: "如 JAVA_HOME，字母/数字/下划线",
							spellcheck: "false"
						}, null, 8, ["modelValue"]),
						_cache[43] || (_cache[43] = createBaseVNode("label", { class: "sub-label" }, "变量值", -1)),
						createVNode(_component_el_input, {
							modelValue: envForm.value.value,
							"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => envForm.value.value = $event),
							type: "textarea",
							rows: 4,
							placeholder: "系统级持久化：Windows 写入 Machine，Linux 写入 /etc/environment",
							spellcheck: "false"
						}, null, 8, ["modelValue"])
					])]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-f1d1b8e2"]]);
//#endregion
//#region src/views/HostProfileDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "profile-host" };
//#endregion
//#region src/views/HostProfileDialog.vue
var HostProfileDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "HostProfileDialog",
	inheritAttrs: false,
	__name: "HostProfileDialog",
	props: {
		modelValue: { type: Boolean },
		hosts: {},
		groups: {},
		liveDelay: {},
		liveOnline: {},
		initialHostId: {},
		initialTab: {},
		openSeq: {}
	},
	emits: [
		"update:modelValue",
		"connect",
		"edit",
		"detail",
		"deploy-agent",
		"refreshed"
	],
	setup(__props, { emit: __emit }) {
		/**
		* 主机画像弹窗（独立子组件）
		* 近全屏 ReDialog 承载 HostProfileView：左主机列表 + 右分区详情。
		* 显式 :model-value / @update:model-value 写法对齐 HostFormDialog。
		*/
		const props = __props;
		const emit = __emit;
		return (_ctx, _cache) => {
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createBlock(_component_ReDialog, {
				"model-value": props.modelValue,
				"onUpdate:modelValue": _cache[5] || (_cache[5] = (v) => emit("update:modelValue", v)),
				title: "主机画像",
				width: "94%",
				top: "3vh",
				"footer-hidden": true,
				"close-on-click-modal": false
			}, {
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$3, [createVNode(HostProfileView_default, {
					hosts: __props.hosts,
					groups: __props.groups,
					"live-delay": __props.liveDelay,
					"live-online": __props.liveOnline,
					"initial-host-id": __props.initialHostId,
					"initial-tab": __props.initialTab,
					"open-seq": __props.openSeq,
					onConnect: _cache[0] || (_cache[0] = (h) => emit("connect", h)),
					onEdit: _cache[1] || (_cache[1] = (h) => emit("edit", h)),
					onDetail: _cache[2] || (_cache[2] = (h) => emit("detail", h)),
					onDeployAgent: _cache[3] || (_cache[3] = (h) => emit("deploy-agent", h)),
					onRefreshed: _cache[4] || (_cache[4] = ($event) => emit("refreshed"))
				}, null, 8, [
					"hosts",
					"groups",
					"live-delay",
					"live-online",
					"initial-host-id",
					"initial-tab",
					"open-seq"
				])])]),
				_: 1
			}, 8, ["model-value"]);
		};
	}
}), [["__scopeId", "data-v-c60d3c0b"]]);
//#endregion
//#region src/components/ReMaskDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "rmd-header" };
var _hoisted_2$2 = { class: "rmd-title" };
var _hoisted_3$2 = { class: "rmd-actions" };
var _hoisted_4$2 = { class: "rmd-body" };
var _hoisted_5$2 = {
	key: 0,
	class: "rmd-footer"
};
//#endregion
//#region src/components/ReMaskDialog.vue
var ReMaskDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReMaskDialog",
	props: {
		modelValue: { type: Boolean },
		title: {},
		width: {},
		closable: { type: Boolean },
		closeOnClickMask: { type: Boolean }
	},
	emits: ["update:modelValue", "close"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		function close() {
			emit("update:modelValue", false);
			emit("close");
		}
		function onMaskClick() {
			if (props.closeOnClickMask) close();
		}
		function settleAnimations(el, finish) {
			const node = el;
			if (typeof node.getAnimations !== "function") return;
			node.getAnimations().forEach((a) => {
				let touchesOpacity = true;
				try {
					touchesOpacity = a.effect.getKeyframes().some((k) => k.opacity !== void 0 && k.opacity !== "");
				} catch {
					touchesOpacity = true;
				}
				if (!touchesOpacity) return;
				try {
					if (finish) a.finish();
					else a.cancel();
				} catch {
					try {
						a.cancel();
					} catch {}
				}
			});
		}
		let enterTimer;
		function onEnter(el) {
			if (enterTimer) clearTimeout(enterTimer);
			enterTimer = setTimeout(() => settleAnimations(el, true), 320);
		}
		function onAfterEnter(el) {
			if (enterTimer) {
				clearTimeout(enterTimer);
				enterTimer = void 0;
			}
			settleAnimations(el, true);
		}
		function onLeave() {
			if (enterTimer) {
				clearTimeout(enterTimer);
				enterTimer = void 0;
			}
		}
		function onAfterLeave(el) {
			settleAnimations(el, false);
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Teleport, { to: "body" }, [createVNode(Transition, {
				name: "mask-fade",
				onEnter,
				onAfterEnter,
				onLeave,
				onAfterLeave,
				onLeaveCancelled: onAfterLeave
			}, {
				default: withCtx(() => [__props.modelValue ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "rmd-mask",
					onClick: withModifiers(onMaskClick, ["self"])
				}, [createBaseVNode("div", {
					class: "rmd-dialog",
					style: normalizeStyle({ width: __props.width })
				}, [
					createBaseVNode("div", _hoisted_1$2, [createBaseVNode("span", _hoisted_2$2, toDisplayString(__props.title), 1), createBaseVNode("div", _hoisted_3$2, [renderSlot(_ctx.$slots, "actions", {}, void 0, true), __props.closable ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "rmd-close",
						onClick: close
					}, "✕")) : createCommentVNode("", true)])]),
					createBaseVNode("div", _hoisted_4$2, [renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
					_ctx.$slots.footer ? (openBlock(), createElementBlock("div", _hoisted_5$2, [renderSlot(_ctx.$slots, "footer", {}, void 0, true)])) : createCommentVNode("", true)
				], 4)])) : createCommentVNode("", true)]),
				_: 3
			})]);
		};
	}
}), [["__scopeId", "data-v-cdb64005"]]);
//#endregion
//#region src/components/AgentDeployDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "agent-deploy-float__icon" };
var _hoisted_2$1 = { class: "agent-deploy-float__info" };
var _hoisted_3$1 = { class: "agent-deploy-float__title" };
var _hoisted_4$1 = { class: "agent-deploy-float__progress" };
var _hoisted_5$1 = { class: "agent-deploy-container" };
var _hoisted_6$1 = { class: "agent-deploy-header" };
var _hoisted_7$1 = { class: "agent-deploy-log" };
var _hoisted_8$1 = { class: "agent-deploy-log__time" };
var _hoisted_9$1 = { class: "agent-deploy-log__msg" };
var _hoisted_10$1 = { class: "agent-deploy-status" };
//#endregion
//#region src/components/AgentDeployDialog.vue
var AgentDeployDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "AgentDeployDialog",
	props: {
		modelValue: { type: Boolean },
		task: {},
		logs: {},
		minimized: { type: Boolean }
	},
	emits: ["update:modelValue", "update:minimized"],
	setup(__props, { emit: __emit }) {
		/**
		* AgentDeployDialog —— Agent 部署进度弹窗
		*
		* 特性：
		*   - 拖拽移动
		*   - 最小化到右下角悬浮窗
		*   - 支持断点续传（刷新页面后恢复）
		*   - socket 实时推送进度和日志
		*/
		const props = __props;
		const emit = __emit;
		const visible = computed({
			get: () => props.modelValue,
			set: (v) => emit("update:modelValue", v)
		});
		const minimized = computed({
			get: () => props.minimized ?? false,
			set: (v) => emit("update:minimized", v)
		});
		const statusClass = computed(() => {
			switch (props.task.status) {
				case "success": return "success";
				case "failed": return "danger";
				case "running": return "primary";
				default: return "info";
			}
		});
		const statusText = computed(() => {
			switch (props.task.status) {
				case "pending": return "等待中";
				case "running": return "进行中";
				case "success": return "已完成";
				case "failed": return "失败";
				default: return "";
			}
		});
		const isFinished = computed(() => {
			return props.task.status === "success" || props.task.status === "failed";
		});
		const floatStyle = computed(() => ({
			right: "24px",
			bottom: "24px"
		}));
		function toggleMinimize() {
			minimized.value = !minimized.value;
			if (!minimized.value) visible.value = true;
		}
		function restoreFromStorage() {
			try {
				const saved = localStorage.getItem("agent-deploy-state");
				if (saved) {
					const state = JSON.parse(saved);
					if (state.task && state.logs) console.log("[agent-deploy] 恢复部署状态", state);
				}
			} catch (e) {}
		}
		watch([() => props.task, () => props.logs], ([task, logs]) => {
			try {
				localStorage.setItem("agent-deploy-state", JSON.stringify({
					task,
					logs,
					savedAt: Date.now()
				}));
			} catch (e) {}
		}, { deep: true });
		restoreFromStorage();
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			return minimized.value ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: "agent-deploy-float",
				style: normalizeStyle(floatStyle.value),
				onClick: toggleMinimize
			}, [createBaseVNode("div", _hoisted_1$1, [createBaseVNode("span", { class: normalizeClass(["agent-deploy-float__dot", statusClass.value]) }, null, 2)]), createBaseVNode("div", _hoisted_2$1, [createBaseVNode("div", _hoisted_3$1, toDisplayString(__props.task.title), 1), createBaseVNode("div", _hoisted_4$1, toDisplayString(Math.round(__props.task.progress * 100)) + "%", 1)])], 4)) : (openBlock(), createBlock(ReMaskDialog_default, {
				key: 1,
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => visible.value = $event),
				title: `Agent 部署 - ${__props.task.title}`,
				width: "560px"
			}, {
				footer: withCtx(() => [
					createVNode(_component_ReButton, { onClick: toggleMinimize }, {
						default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("最小化", -1)])]),
						_: 1
					}),
					!isFinished.value ? (openBlock(), createBlock(_component_ReButton, {
						key: 0,
						type: "danger",
						onClick: _cache[0] || (_cache[0] = ($event) => visible.value = false)
					}, {
						default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode(" 取消 ", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					isFinished.value ? (openBlock(), createBlock(_component_ReButton, {
						key: 1,
						type: "primary",
						onClick: _cache[1] || (_cache[1] = ($event) => visible.value = false)
					}, {
						default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode(" 关闭 ", -1)])]),
						_: 1
					})) : createCommentVNode("", true)
				]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_5$1, [
					createBaseVNode("div", _hoisted_6$1, [createVNode(ReProgressTask_default, { task: __props.task }, null, 8, ["task"])]),
					createBaseVNode("div", _hoisted_7$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.logs, (log, i) => {
						return openBlock(), createElementBlock("div", {
							key: i,
							class: "agent-deploy-log__line"
						}, [createBaseVNode("span", _hoisted_8$1, toDisplayString(log.time), 1), createBaseVNode("span", _hoisted_9$1, toDisplayString(log.msg), 1)]);
					}), 128))]),
					createBaseVNode("div", _hoisted_10$1, [createBaseVNode("span", { class: normalizeClass(["agent-deploy-status__badge", statusClass.value]) }, toDisplayString(statusText.value), 3)])
				])]),
				_: 1
			}, 8, ["modelValue", "title"]));
		};
	}
}), [["__scopeId", "data-v-69248b97"]]);
//#endregion
//#region src/views/AssetsView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "as" };
var _hoisted_2 = {
	key: 0,
	class: "as-error"
};
var _hoisted_3 = { class: "host-kpis" };
var _hoisted_4 = { class: "kpi-title" };
var _hoisted_5 = { class: "kpi-title__text" };
var _hoisted_6 = { class: "health-strip" };
var _hoisted_7 = { class: "health-strip__title" };
var _hoisted_8 = { class: "health-strip__items" };
var _hoisted_9 = { class: "health-metric" };
var _hoisted_10 = { class: "health-metric__bar" };
var _hoisted_11 = { class: "health-metric" };
var _hoisted_12 = { class: "health-metric__bar" };
var _hoisted_13 = { class: "health-metric" };
var _hoisted_14 = { class: "health-metric__bar" };
var _hoisted_15 = { class: "as-panel as-filter" };
var _hoisted_16 = { class: "filter" };
var _hoisted_17 = {
	key: 0,
	style: {
		"display": "flex",
		"align-items": "center",
		"gap": "4px",
		"flex-wrap": "wrap"
	}
};
var _hoisted_18 = {
	key: 0,
	class: "muted"
};
var _hoisted_19 = { class: "view-toggle" };
var _hoisted_20 = { class: "filter-ops" };
var _hoisted_21 = { class: "color-switch" };
var _hoisted_22 = { class: "hc-head" };
var _hoisted_23 = ["innerHTML"];
var _hoisted_24 = { class: "hc-name-wrap" };
var _hoisted_25 = { class: "hc-title-row" };
var _hoisted_26 = { class: "hc-name" };
var _hoisted_27 = ["title"];
var _hoisted_28 = { class: "hc-addr mono" };
var _hoisted_29 = {
	key: 0,
	class: "hc-ip mono"
};
var _hoisted_30 = { key: 0 };
var _hoisted_31 = {
	key: 1,
	class: "hc-ip-sep"
};
var _hoisted_32 = { key: 2 };
var _hoisted_33 = { class: "hc-chips" };
var _hoisted_34 = { class: "hc-chip" };
var _hoisted_35 = { class: "hc-chip" };
var _hoisted_36 = { class: "hc-chip" };
var _hoisted_37 = { class: "hc-chip" };
var _hoisted_38 = {
	key: 0,
	class: "hc-bars"
};
var _hoisted_39 = { class: "hc-bar-row" };
var _hoisted_40 = { class: "hc-bar-val" };
var _hoisted_41 = { class: "hc-bar-row" };
var _hoisted_42 = { class: "hc-bar-val" };
var _hoisted_43 = { class: "hc-bar-row" };
var _hoisted_44 = { class: "hc-bar-val" };
var _hoisted_45 = {
	key: 1,
	class: "hc-tags"
};
var _hoisted_46 = {
	key: 2,
	class: "hc-ports"
};
var _hoisted_47 = { class: "ports-pop-list" };
var _hoisted_48 = { class: "hc-actions" };
var _hoisted_49 = { class: "h-os" };
var _hoisted_50 = ["innerHTML"];
var _hoisted_51 = { style: {
	"vertical-align": "middle",
	"margin-left": "6px"
} };
var _hoisted_52 = { class: "mono" };
var _hoisted_53 = {
	key: 0,
	style: {
		"display": "flex",
		"gap": "4px",
		"flex-wrap": "wrap"
	}
};
var _hoisted_54 = {
	key: 1,
	class: "dim"
};
var _hoisted_55 = { class: "st-cell" };
var _hoisted_56 = { class: "ports-pop-list" };
var _hoisted_57 = {
	key: 1,
	class: "dim"
};
var _hoisted_58 = { class: "op-cell" };
var _hoisted_59 = { key: 0 };
var _hoisted_60 = {
	class: "muted",
	style: { "margin-top": "0" }
};
var _hoisted_61 = { style: {
	"display": "flex",
	"gap": "8px",
	"margin-top": "10px",
	"flex-wrap": "wrap",
	"align-items": "center"
} };
var CTX_MENU_W = 208;
var CTX_MENU_H = 380;
//#endregion
//#region src/views/AssetsView.vue
var AssetsView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "AssetsView",
	setup(__props) {
		/**
		* 主机资产 v2 —— 对齐 prototype.html §4.2
		* KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
		* @author CH
		* @since 4.0.0
		*/
		const router = useRouter();
		const hosts = ref([]);
		const groups = ref([]);
		const identities = ref([]);
		const loading = ref(false);
		const loadError = ref("");
		/** fetchAll 序号：并发触发时只采用最新一次结果，丢弃过期响应 */
		let fetchSeq = 0;
		const selection = ref([]);
		/** 实时延迟（hostId → delayMs，socket host-delay 推送更新；-1 表不可达） */
		const liveDelay = ref({});
		/** 实时在线状态（hostId → 1/0，socket host-online 推送翻转） */
		const liveOnline = ref({});
		let unsubDelay;
		let unsubOnline;
		let unsubMetrics;
		let unsubDeploy;
		let unsubPortScan;
		/** 视图模式：card（默认，卡片网格）/ table（表格） */
		const viewMode = ref("card");
		/** ReFilter 过滤状态（由 ReFilter 组件统一驱动，替代手写 keyword/status/group 三个 ref） */
		const filterState = ref({
			keyword: "",
			status: "",
			group: "",
			tag: ""
		});
		/**
		* ReFilter 过滤项变更
		* @param prop 过滤属性名
		* @param value 过滤值
		*/
		/**
		* ReFilter 过滤项变更
		* @param prop 过滤属性名
		* @param value 过滤值
		*/
		function onFilterChange(prop, value) {
			filterState.value[prop] = value;
		}
		/**
		* 重置全部过滤条件
		*/
		function onFilterReset() {
			filterState.value = {
				keyword: "",
				status: "",
				group: "",
				tag: ""
			};
		}
		/** 空态卡片里的「重置筛选」按钮：复用同一套重置逻辑，不再另写一份 */
		function resetFilters() {
			onFilterReset();
		}
		/** ReFilter 筛选项配置（"标签"项仅在存在标签数据时显示，避免空的筛选项） */
		const filterItems = computed(() => {
			const items = [
				{
					prop: "keyword",
					label: "名称/IP",
					type: "input",
					placeholder: "搜索名称 / IP",
					clearable: true,
					always: true
				},
				{
					prop: "status",
					label: "状态",
					type: "select",
					placeholder: "状态",
					clearable: true,
					options: [
						{
							label: "在线",
							value: "online"
						},
						{
							label: "离线",
							value: "offline"
						},
						{
							label: "远控启用",
							value: "remote"
						}
					],
					always: true
				},
				{
					prop: "group",
					label: "分组",
					type: "select",
					placeholder: "分组",
					clearable: true,
					options: groups.value.map((g) => ({
						label: g.msServerGroupName,
						value: g.id
					})),
					always: true
				}
			];
			if (allTags.value.length > 0) items.push({
				prop: "tag",
				label: "标签",
				type: "slot",
				always: false
			});
			return items;
		});
		/** 弹窗内 ReSelect 选项（computed 缓存，避免每次渲染重算） */
		const identityOptions = computed(() => identities.value.map((i) => ({
			label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）${i.msServerIdentityAuthType === "PUBLIC_KEY" ? "私钥" : "密码"}`,
			value: i.id
		})));
		const groupOptions = computed(() => groups.value.map((g) => ({
			label: g.msServerGroupName,
			value: g.id
		})));
		/** 标签集合（用于筛选/展示） */
		const allTags = computed(() => {
			const s = /* @__PURE__ */ new Set();
			for (const h of hosts.value) for (const t of splitTags(h.serverHostTags)) s.add(t);
			return [...s];
		});
		/**
		* 逗号分隔标签拆分为数组
		* @param tags 标签字符串
		*/
		function splitTags(tags) {
			if (!tags || !tags.trim()) return [];
			return tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
		}
		/** 端口扫描结果项 */
		function parsePorts(raw) {
			if (!raw) return [];
			try {
				const arr = JSON.parse(raw);
				return Array.isArray(arr) ? arr : [];
			} catch {
				return [];
			}
		}
		/** 端口文案：22/tcp ssh */
		function portText(p) {
			const parts = [`${p.port}${p.protocol ? "/" + p.protocol : ""}`];
			if (p.service) parts.push(p.service);
			return parts.join(" ");
		}
		/** 端口扫描（后台异步，完成后由 host-portscan socket 事件回填，不阻塞/轮询） */
		async function scanHostPorts(h) {
			try {
				const r = await scanPorts(h.id);
				message.success(r?.msg || `端口扫描已开始，完成后自动更新 ${h.serverHostAddress}`);
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		/**
		* 分组 ID 查名称
		* @param id 分组 ID
		*/
		function groupName(id) {
			if (!id) return "未分组";
			return groups.value.find((g) => g.id === id)?.msServerGroupName ?? "组#" + id;
		}
		ref(true);
		const realtimeEnabled = ref(localStorage.getItem("assets-realtime-enabled") !== "false");
		const rtMetrics = reactive({});
		function barColor(pct) {
			if (pct >= 90) return "var(--el-color-danger)";
			if (pct >= 70) return "var(--el-color-warning)";
			return "var(--el-color-success)";
		}
		function onRealtimeToggle(v) {
			localStorage.setItem("assets-realtime-enabled", String(v));
			if (!v) {
				Object.keys(rtMetrics).forEach((k) => delete rtMetrics[Number(k)]);
				return;
			}
			syncRtFromHosts();
		}
		/**
		* 用主机台账里最近一次采集/上报的使用率铺首帧
		* <p>socket 推送只覆盖「推送之后」的时间窗，列表每次刷新都要按落库值重算，
		* 否则刷新页面要等一个采集周期才有指标。</p>
		*/
		function syncRtFromHosts() {
			if (!realtimeEnabled.value) return;
			for (const h of hosts.value) {
				if (h.serverHostCpuUsage == null && h.serverHostMemUsage == null && h.serverHostDiskUsage == null) continue;
				const prev = rtMetrics[h.id];
				rtMetrics[h.id] = {
					cpu: Math.round((Number(h.serverHostCpuUsage) || 0) * 10) / 10,
					mem: Math.round((Number(h.serverHostMemUsage) || 0) * 10) / 10,
					disk: Math.round((Number(h.serverHostDiskUsage) || 0) * 10) / 10,
					tx: prev?.tx ?? "—",
					rx: prev?.rx ?? "—"
				};
			}
		}
		/**
		* 生效远控协议：主机配置优先，未配置时按平台推断
		* @param h 主机
		*/
		function protocolOf(h) {
			const p = (h.serverHostRemoteProtocol ?? "").toUpperCase();
			if (p === "SSH" || p === "RDP" || p === "VNC") return p.toLowerCase();
			const s = (h.serverHostOsType ?? "").toUpperCase();
			if (s.includes("WIN")) return "rdp";
			if (s.includes("MAC")) return "vnc";
			return "ssh";
		}
		/**
		* 生效远控端口：主机配置优先，SSH 沿用端口字段，其余按协议默认
		* @param h 主机
		*/
		function remotePortOf(h) {
			if (h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
			const p = protocolOf(h);
			if (p === "ssh") return h.serverHostPort || 22;
			return p === "rdp" ? 3389 : 5900;
		}
		const onlineCount = computed(() => hosts.value.filter((h) => h.serverHostOnline === 1).length);
		const remoteCount = computed(() => hosts.value.filter((h) => h.serverHostRemoteEnabled === 1).length);
		const offlineCount = computed(() => hosts.value.length - onlineCount.value);
		/**
		* 统计卡定义。
		*
		* <p>与「账号管理 / 代理管理」同口径：{@code icon} 必须是组件
		* （ReStatCard 内部走 {@code <component :is="icon" />}），所以引用
		* @element-plus/icons-vue 的组件而不是图标名字符串；{@code iconColor}
		* 用 koi 令牌，不写死品牌色。</p>
		*/
		const hostKpis = computed(() => [
			{
				key: "total",
				title: "可远控目标",
				value: hosts.value.length,
				desc: "共注册可远控目标",
				icon: monitor_default,
				iconColor: "var(--brand-500, var(--el-color-primary))"
			},
			{
				key: "online",
				title: "可连接资产",
				value: `${onlineCount.value} / ${hosts.value.length}`,
				desc: "当前在线可连接",
				icon: connection_default,
				iconColor: "var(--el-color-success)"
			},
			{
				key: "offline",
				title: "需关注处理",
				value: offlineCount.value,
				desc: "离线或采集异常",
				icon: close_bold_default,
				iconColor: "var(--el-color-danger)"
			},
			{
				key: "remote",
				title: "支持远程连接",
				value: remoteCount.value,
				desc: "已开启远控协议",
				icon: download_default,
				iconColor: "var(--metric-cpu, var(--el-color-primary))"
			}
		]);
		/** CPU/Mem/Disk 平均利用率（用于健康度展示） */
		const avgMetrics = computed(() => {
			const active = hosts.value.filter((h) => h.serverHostCpuUsage != null);
			const avgCpu = active.length ? active.reduce((s, h) => s + (h.serverHostCpuUsage ?? 0), 0) / active.length : 0;
			const avgMem = active.length ? active.reduce((s, h) => s + (h.serverHostMemUsage ?? 0), 0) / active.length : 0;
			const avgDisk = active.length ? active.reduce((s, h) => s + (h.serverHostDiskUsage ?? 0), 0) / active.length : 0;
			return {
				cpu: Math.round(avgCpu),
				mem: Math.round(avgMem),
				disk: Math.round(avgDisk)
			};
		});
		function metricColor(v) {
			const n = Number(v) || 0;
			if (n >= 80) return "var(--el-color-danger)";
			if (n >= 60) return "var(--el-color-warning)";
			return "var(--el-color-success)";
		}
		const filtered = computed(() => {
			const fs = filterState.value;
			let list = hosts.value;
			const status = String(fs.status ?? "");
			if (status === "online") list = list.filter((h) => h.serverHostOnline === 1);
			else if (status === "offline") list = list.filter((h) => h.serverHostOnline !== 1);
			else if (status === "remote") list = list.filter((h) => h.serverHostRemoteEnabled === 1);
			if (fs.group != null && fs.group !== "" && fs.group !== 0) {
				const gid = String(fs.group);
				list = list.filter((h) => String(h.msServerGroupId ?? "") === gid);
			}
			if (typeof fs.tag === "string" && fs.tag) {
				const tag = fs.tag;
				list = list.filter((h) => splitTags(h.serverHostTags).includes(tag));
			}
			const kw = typeof fs.keyword === "string" ? fs.keyword.toLowerCase() : "";
			if (kw) list = list.filter((h) => (h.serverHostName ?? "").toLowerCase().includes(kw) || (h.serverHostAddress ?? "").toLowerCase().includes(kw));
			return list;
		});
		/**
		* 注解数据：每张 KPI 卡的统计口径。
		*
		* <p>KPI 卡的 {@code desc} 只有四五个字（「离线或采集异常」），读者并不知道
		* 「离线」是心跳超时还是 Agent 掉线、「需关注」到底合并了哪几类。
		* 这里把口径写全，与 {@link hostKpis} 同 key 对应，改卡片时不会漏改注解。</p>
		*
		* <p>呈现方式：挂在各卡标题旁的 tip（见模板里的 #title 插槽）。
		* 早先是页面底部一张常驻的 ElCard，四行说明固定占掉约 120px 高度 ——
		* 而这四条注解绝大多数人一辈子不会点开，纯属白占版面。改成按需浮层后零占位，
		* 且注解紧贴它所属的那张卡，不用上下对照。</p>
		*/
		const hostKpiNotes = computed(() => [
			{
				key: "total",
				title: "可远控目标",
				note: "台账中登记的全部主机，含离线与停用采集的；右键可编辑、删除、绑定身份。"
			},
			{
				key: "online",
				title: "可连接资产",
				note: "分子为当前在线（近一次心跳 / 探测正常），分母为台账总数；网络不可达时计数不增长。"
			},
			{
				key: "offline",
				title: "需关注处理",
				note: "合并三类：心跳超时、采集通道异常、远端凭证失效。任一类命中即计入，需要逐台排查。"
			},
			{
				key: "remote",
				title: "支持远程连接",
				note: "已开启 SSH / RDP / VNC 之一且填写了协议端口的主机；未开启的不出现在远控入口。"
			}
		]);
		/**
		* 按 key 取该 KPI 卡的口径说明，供标题旁的 tip 使用。
		*
		* @param key 与 {@link hostKpis} 对应的卡标识
		* @return 说明文本；该卡没有注解时返回空串（此时不渲染 tip 图标）
		*/
		function noteOf(key) {
			return hostKpiNotes.value.find((n) => n.key === key)?.note ?? "";
		}
		/**
		* 是否存在主机（与筛选结果无关）。
		*
		* <p>用于区分空态的两种情况：库里一台都没有 vs. 筛选把结果清空了。
		* 这两种情况给同一个「暂无主机」文案，用户会以为系统坏了而不是自己筛得太严。</p>
		*/
		const hasHosts = computed(() => hosts.value.length > 0);
		/**
		* 空态文案。
		*
		* <p>三种情况刻意分开，不能压缩成两种：加载失败时 {@code hosts} 也是空数组，
		* 若只按「有没有主机」判，就会把「没读到」显示成「暂无主机」——
		* 用户照着提示去点「新增主机」，增完刷新还是空的，完全被带偏。</p>
		*/
		const emptyDescription = computed(() => {
			if (loadError.value) return "数据加载失败，请重试";
			return hasHosts.value ? "当前筛选条件下没有匹配的主机" : "暂无主机";
		});
		/** ReTable 列定义 */
		const tableColumns = computed(() => [
			{
				prop: "serverHostName",
				label: "名称",
				minWidth: 150,
				slot: "name"
			},
			{
				prop: "serverHostAddress",
				label: "地址",
				width: 150,
				slot: "addr"
			},
			{
				prop: "msServerGroupId",
				label: "分组",
				width: 92,
				slot: "group"
			},
			{
				prop: "serverHostTags",
				label: "标签",
				minWidth: 120,
				slot: "tags"
			},
			{
				prop: "serverHostOsType",
				label: "协议",
				width: 100,
				slot: "proto"
			},
			{
				prop: "serverHostOnline",
				label: "状态",
				width: 84,
				slot: "status"
			},
			{
				prop: "serverHostDelayMs",
				label: "延迟",
				width: 84,
				slot: "delay"
			},
			{
				prop: "serverHostCollectMode",
				label: "采集模式",
				width: 100,
				formatter: (_, __, v) => collectModeLabel(String(v ?? ""))
			},
			{
				prop: "serverHostPorts",
				label: "端口",
				minWidth: 140,
				slot: "ports"
			},
			{
				prop: "serverHostAgentEnabled",
				label: "Agent",
				width: 90,
				slot: "agent"
			},
			{
				prop: "id",
				label: "操作",
				width: 140,
				fixed: "right",
				slot: "actions"
			}
		]);
		computed(() => ({
			enabled: true,
			confirmMessage: `确认批量删除选中的 ${selection.value.length} 台主机？`,
			handler: async (rows) => {
				for (const r of rows) {
					const id = Number(r.id);
					if (id) try {
						await delHost(id);
					} catch {}
				}
				selection.value = [];
				await fetchAll();
			}
		}));
		async function fetchAll() {
			const seq = ++fetchSeq;
			loading.value = true;
			loadError.value = "";
			try {
				const [h, g, i] = await Promise.all([
					queryHosts(),
					getGroups(),
					getIdentities()
				]);
				if (seq !== fetchSeq) return;
				hosts.value = Array.isArray(h) ? h.sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0)) : [];
				groups.value = g ?? [];
				identities.value = i ?? [];
				syncRtFromHosts();
			} catch (e) {
				if (seq === fetchSeq) loadError.value = String(e?.message ?? e);
			} finally {
				if (seq === fetchSeq) loading.value = false;
			}
		}
		function openDetail(h) {
			router.push(`/host/${h.id}`);
		}
		/** 认证方式/采集方式选项已随弹窗拆入 HostFormDialog 子组件 */
		const formVisible = ref(false);
		useDialogPrerender(formVisible);
		const formIsEdit = ref(false);
		/** 编辑时的行数据（传给弹窗子组件，打开后由子组件异步回填详情） */
		const editHost = ref(null);
		function collectModeLabel(m) {
			return {
				NONE: "不采集",
				OPENSSH: "OpenSSH采集",
				SCHEDULED: "定时采集",
				WINRM: "WinRM采集",
				AGENT: "Agent采集",
				LOCAL: "本机自采集",
				PROMETHEUS: "Prometheus采集",
				HTTP: "HTTP采集"
			}[m ?? ""] ?? m ?? "—";
		}
		const connectVisible = ref(false);
		useDialogPrerender(connectVisible);
		const connectTarget = ref(null);
		const connectIdentityId = ref(null);
		const hostBoundIdentities = ref([]);
		function openConnect(h) {
			connectTarget.value = h;
			connectIdentityId.value = null;
			connectVisible.value = true;
			listBoundIdentities(h.id).then((list) => {
				hostBoundIdentities.value = list ?? [];
			}).catch(() => {
				hostBoundIdentities.value = [];
			});
		}
		function doConnect() {
			const h = connectTarget.value;
			if (!h) return;
			const identityId = connectIdentityId.value;
			router.push({
				path: "/terminal",
				query: {
					hostId: String(h.id),
					protocol: protocolOf(h),
					...identityId != null ? { identityId: String(identityId) } : {}
				}
			});
			connectVisible.value = false;
		}
		/** 身份管理（新增/删除）已统一迁至左侧「账号管理」页（/account）；
		*  本页仅保留身份选择（连接弹窗）与绑定/解绑 */
		/** 在连接弹窗里绑定/解绑身份 */
		async function toggleBind(hostId, identityId, bind) {
			try {
				if (bind) await bindIdentity(hostId, identityId);
				else await unbindIdentity(hostId, identityId);
				message.success(bind ? "已绑定该身份" : "已解绑");
				const list = await listBoundIdentities(hostId);
				hostBoundIdentities.value = list ?? [];
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		const configVisible = ref(false);
		useDialogPrerender(configVisible);
		const configHost = ref(null);
		const configMode = ref("metric");
		const profileHostId = ref(null);
		const profileTab = ref("overview");
		/** 每次打开自增，保证重复打开同一台主机也会重新定位并刷新 */
		const profileSeq = ref(0);
		const profileVisible = ref(false);
		const deployDialogVisible = ref(false);
		const deployProgress = ref(0);
		const deployMessage = ref("");
		const deployStatus = ref("info");
		const deployInfo = reactive({
			hostId: 0,
			hostName: "",
			action: ""
		});
		const deployMinimized = ref(false);
		const deployLogs = ref([]);
		const deployTask = ref({
			id: "agent-deploy",
			title: "Agent 部署",
			progress: 0,
			status: "running",
			text: "准备中...",
			createdAt: Date.now(),
			startedAt: Date.now(),
			history: []
		});
		useDialogPrerender(profileVisible);
		function openSysMgr(type, row) {
			profileHostId.value = row.id;
			profileTab.value = type;
			profileSeq.value++;
			profileVisible.value = true;
		}
		function openAdd() {
			formIsEdit.value = false;
			editHost.value = null;
			formVisible.value = true;
		}
		function openEdit(h) {
			formIsEdit.value = true;
			editHost.value = h;
			formVisible.value = true;
		}
		/** Agent 动作文案 */
		const AGENT_ACTION_LABEL = {
			install: "安装",
			reinstall: "重装",
			upgrade: "升级",
			uninstall: "卸载"
		};
		async function openDeploy(h, action) {
			let hostId, hostName, act;
			if (action) {
				hostId = h.id;
				hostName = h.serverHostName || "";
				act = action;
			} else {
				hostId = h.id;
				hostName = h.serverHostName || "";
				act = h.action || "install";
			}
			if (act === "uninstall") try {
				await ElMessageBox.confirm(`卸载主机「${hostName}」上的 Agent？卸载后主机画像、实时指标与远程控制将全部停用，需要重新安装才能恢复。`, "卸载确认", {
					type: "warning",
					confirmButtonText: "卸载",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			deployInfo.hostId = hostId;
			deployInfo.hostName = hostName;
			deployInfo.action = act;
			deployProgress.value = 0;
			deployMessage.value = "准备中...";
			deployStatus.value = "info";
			deployDialogVisible.value = true;
			const label = AGENT_ACTION_LABEL[act] ?? act;
			deployLogs.value = [`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] 开始${label} Agent...`];
			deployTask.value = {
				id: "agent-deploy",
				title: `${label} Agent - ${hostName}`,
				progress: .05,
				status: "running",
				text: "准备中...",
				createdAt: Date.now(),
				startedAt: Date.now(),
				history: [{
					time: Date.now(),
					progress: .05,
					status: "running"
				}]
			};
			try {
				await submitAgentAction(hostId, act);
			} catch (e) {
				deployStatus.value = "error";
				deployMessage.value = "请求失败: " + (e?.message ?? e);
				deployTask.value = {
					...deployTask.value,
					status: "failed",
					text: "请求失败"
				};
			}
		}
		async function removeHost(h) {
			await ElMessageBox.confirm(`删除主机「${h.serverHostName}」？`, "删除确认", { type: "warning" });
			try {
				if (await delHost(h.id) === false) {
					message.warning("删除未生效（可能仍有绑定）");
					return;
				}
				message.success("已删除");
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		/** 采集模式是否为 Agent（决定 Agent 生命周期入口显隐） */
		function isAgentMode(h) {
			return h.serverHostCollectMode === "AGENT";
		}
		/** Agent 是否已安装 */
		function isAgentInstalled(h) {
			return h.serverHostAgentInstalled === 1;
		}
		/**
		* 表格「更多」下拉命令分发
		* @param cmd 下拉项 command
		* @param h 当前行主机
		*/
		function runRowCommand(cmd, h) {
			switch (cmd) {
				case "detail":
					openDetail(h);
					break;
				case "scan":
					scanHostPorts(h);
					break;
				case "profile":
					openSysMgr("disk", h);
					break;
				case "edit":
					openEdit(h);
					break;
				case "agent-install":
					openDeploy(h, "install");
					break;
				case "agent-reinstall":
					openDeploy(h, "reinstall");
					break;
				case "agent-upgrade":
					openDeploy(h, "upgrade");
					break;
				case "agent-uninstall":
					openDeploy(h, "uninstall");
					break;
				case "delete": removeHost(h);
			}
		}
		/** 右键上下文菜单状态 */
		const ctxMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			host: null
		});
		/** 菜单估算尺寸，用于边缘翻转避免超出视口 */
		function openCtxMenu(event, h) {
			event.preventDefault();
			let x = event.clientX;
			let y = event.clientY;
			if (x + CTX_MENU_W > window.innerWidth - 8) x = window.innerWidth - CTX_MENU_W - 8;
			if (y + CTX_MENU_H > window.innerHeight - 8) y = window.innerHeight - CTX_MENU_H - 8;
			ctxMenu.host = h;
			ctxMenu.x = Math.max(8, x);
			ctxMenu.y = Math.max(8, y);
			ctxMenu.visible = true;
		}
		/** 关闭右键菜单 */
		function closeCtxMenu() {
			ctxMenu.visible = false;
			ctxMenu.host = null;
		}
		/** 右键菜单命令分发（连接/编辑直连本组件方法，其余走行命令） */
		function ctxCommand(cmd) {
			const h = ctxMenu.host;
			closeCtxMenu();
			if (!h) return;
			if (cmd === "connect") {
				openConnect(h);
				return;
			}
			if (cmd === "edit") {
				openEdit(h);
				return;
			}
			runRowCommand(cmd, h);
		}
		/** 表格根上的原生右键：把 <tr> 按行序号映射回主机并打开统一菜单（主表体/固定列同序）
		*
		* <p>选择器必须**同时**认两套引擎的行类名：本页 ReTable 未传 engine，当前走默认的
		* element 引擎（{@code tr.el-table__row}）；一旦该表格改用 {@code engine="vxe"}，
		* 行会变成 {@code tr.vxe-body--row}，只写 element 那支时 closest 返回 null、
		* 这里直接 return，右键菜单**静默失效且不报错**，排查成本很高。</p>
		*
		* <p>固定列（element 的 fixed / vxe 的 fixed-right wrapper）会各自渲染一份同序、
		* 同数量的行，所以在任一 tbody 内取 :scope 直接子行，序号都与 filtered 对齐。</p>
		*/
		function onTableContextMenu(event) {
			const tr = event.target?.closest?.("tr.el-table__row, tr.vxe-body--row");
			if (!tr) return;
			const tbody = tr.parentElement;
			if (!tbody) return;
			const idx = Array.from(tbody.querySelectorAll(":scope > tr.el-table__row, :scope > tr.vxe-body--row")).indexOf(tr);
			const h = filtered.value[idx];
			if (h) openCtxMenu(event, h);
		}
		async function batchDelete() {
			if (selection.value.length === 0) return;
			await ElMessageBox.confirm(`批量删除 ${selection.value.length} 台主机？`, "批量删除", { type: "warning" });
			let ok = 0;
			for (const h of selection.value) try {
				await delHost(h.id);
				ok++;
			} catch {}
			message.success(`删除 ${ok}/${selection.value.length}`);
			selection.value = [];
			await fetchAll();
		}
		onMounted(() => {
			fetchAll();
			const socket = useSocketService();
			unsubDelay = socket?.subscribe("monitor", "host-delay", (msg) => {
				try {
					const d = msg.data ?? msg;
					if (d && d.hostId != null) liveDelay.value[d.hostId] = d.delayMs ?? -1;
				} catch {}
			});
			unsubOnline = socket?.subscribe("monitor", "host-online", (msg) => {
				try {
					const d = msg.data ?? msg;
					if (d && d.hostId != null) liveOnline.value[d.hostId] = d.online ? 1 : 0;
				} catch {}
			});
			unsubDeploy = socket?.subscribe("monitor", "agent-deploy", (msg) => {
				try {
					const d = msg.data ?? msg;
					if (d && d.hostId === deployInfo.hostId) {
						const pct = (d.progress ?? 0) / 100;
						deployProgress.value = d.progress ?? 0;
						deployMessage.value = d.message ?? "";
						const s = d.status;
						deployStatus.value = s === "success" || s === "warn" || s === "error" ? s : "info";
						deployLogs.value.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${d.message} (${d.progress}%)`);
						deployTask.value = {
							...deployTask.value,
							progress: pct,
							status: d.status === "success" ? "success" : d.status === "error" ? "failed" : "running",
							text: d.message ?? "",
							history: [...deployTask.value.history, {
								time: Date.now(),
								progress: pct,
								status: d.status === "success" ? "success" : d.status === "error" ? "failed" : "running"
							}]
						};
						if (d.status === "success" || d.status === "error") fetchAll();
					}
				} catch {}
			});
			unsubMetrics = socket?.subscribe("monitor", "host-metrics", (msg) => {
				try {
					const d = msg.data ?? msg;
					if (!realtimeEnabled.value) return;
					if (d && d.hostId != null) rtMetrics[d.hostId] = {
						cpu: Math.round((Number(d.cpu) || 0) * 10) / 10,
						mem: Math.round((Number(d.mem) || 0) * 10) / 10,
						disk: Math.round((Number(d.disk) || 0) * 10) / 10,
						tx: "—",
						rx: "—"
					};
				} catch {}
			});
			unsubPortScan = socket?.subscribe("monitor", "host-portscan", (msg) => {
				try {
					const d = msg.data ?? msg;
					if (!d || d.hostId == null) return;
					const target = hosts.value.find((h) => h.id === d.hostId);
					if (target) {
						target.serverHostPorts = d.portsJson ?? "[]";
						target.serverHostLastPortScanTime = d.scanTime ?? null;
					}
					if (d.success) message.success(`端口扫描完成：发现 ${d.openCount ?? 0} 个开放端口（耗时 ${d.elapsedSeconds ?? 0}s）`);
					else message.error(`端口扫描失败：${d.error ?? "未知错误"}`);
				} catch {}
			});
		});
		onBeforeUnmount(() => {
			unsubDelay?.();
			unsubOnline?.();
			unsubMetrics?.();
			unsubDeploy?.();
			unsubPortScan?.();
		});
		/** 实时在线状态（socket 优先，回退 host.serverHostOnline；本机恒在线） */
		function liveOnlineState(h) {
			if (h.serverHostCollectMode === "LOCAL") return 1;
			return liveOnline.value[h.id] ?? h.serverHostOnline;
		}
		/** 实时延迟（socket 优先，回退 host.serverHostDelayMs；本机恒 0ms） */
		function liveDelayMs(h) {
			if (h.serverHostCollectMode === "LOCAL") return 0;
			const v = liveDelay.value[h.id];
			if (v != null) return v;
			return h.serverHostDelayMs ?? null;
		}
		/** 延迟显示文案 */
		function delayText(ms) {
			if (ms == null) return "—";
			if (ms < 0) return "不可达";
			return ms + " ms";
		}
		/** 延迟是否异常（高延迟红色） */
		function delayBad(ms) {
			return ms != null && (ms < 0 || ms > 200);
		}
		/**
		* OS 图标底纹类（按系统类型给卡片图标一个品牌语义淡底）
		* @param h 主机
		*/
		function osTileClass(h) {
			const os = (h.serverHostOsType ?? "").toLowerCase();
			if (os.includes("win")) return "is-windows";
			if (os.includes("mac") || os.includes("darwin")) return "is-macos";
			if (os.includes("linux") || os.includes("ubuntu") || os.includes("centos") || os.includes("red hat") || os.includes("unix")) return "is-linux";
			return "is-other";
		}
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReFilter = resolveComponent("ReFilter");
			const _component_el_switch = resolveComponent("el-switch");
			const _component_ElCard = resolveComponent("ElCard");
			const _component_ElEmpty = resolveComponent("ElEmpty");
			const _component_ReStatusIndicator = resolveComponent("ReStatusIndicator");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("div", _hoisted_1, [
					loadError.value ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("span", null, "数据加载失败：" + toDisplayString(loadError.value), 1), createVNode(_component_ReButton, {
						icon: "RefreshRight",
						type: "primary",
						"show-text": true,
						onClick: fetchAll
					}, {
						default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("重试", -1)])]),
						_: 1
					})])) : createCommentVNode("", true),
					createBaseVNode("section", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(hostKpis.value, (k) => {
						return openBlock(), createBlock(unref(component$1), {
							key: k.key,
							size: "compact",
							title: k.title,
							value: k.value,
							desc: k.desc,
							icon: k.icon,
							"icon-color": k.iconColor
						}, {
							title: withCtx(() => [createBaseVNode("span", _hoisted_4, [createBaseVNode("span", _hoisted_5, toDisplayString(k.title), 1), noteOf(k.key) ? (openBlock(), createBlock(unref(ElTooltip), {
								key: 0,
								content: noteOf(k.key),
								placement: "top",
								"show-after": 200
							}, {
								default: withCtx(() => [createBaseVNode("span", {
									class: "kpi-title__tip",
									onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
								}, [createVNode(_component_ReIcon, {
									name: "QuestionFilled",
									size: 12
								})])]),
								_: 1
							}, 8, ["content"])) : createCommentVNode("", true)])]),
							_: 2
						}, 1032, [
							"title",
							"value",
							"desc",
							"icon",
							"icon-color"
						]);
					}), 128)), createBaseVNode("div", _hoisted_6, [createBaseVNode("div", _hoisted_7, [createVNode(_component_ReIcon, {
						name: "DataBoard",
						size: 13
					}), _cache[30] || (_cache[30] = createTextVNode(" 全局健康度 ", -1))]), createBaseVNode("div", _hoisted_8, [
						createBaseVNode("div", _hoisted_9, [
							createVNode(unref(cpu_default), { class: "health-metric__ico" }),
							_cache[31] || (_cache[31] = createBaseVNode("span", { class: "health-metric__label" }, "CPU", -1)),
							createBaseVNode("div", _hoisted_10, [createBaseVNode("div", {
								class: "health-metric__fill",
								style: normalizeStyle({
									width: avgMetrics.value.cpu + "%",
									background: metricColor(avgMetrics.value.cpu)
								})
							}, null, 4)]),
							createBaseVNode("span", {
								class: "health-metric__val",
								style: normalizeStyle({ color: metricColor(avgMetrics.value.cpu) })
							}, toDisplayString(avgMetrics.value.cpu) + "%", 5)
						]),
						createBaseVNode("div", _hoisted_11, [
							createVNode(unref(cpu_default), { class: "health-metric__ico" }),
							_cache[32] || (_cache[32] = createBaseVNode("span", { class: "health-metric__label" }, "内存", -1)),
							createBaseVNode("div", _hoisted_12, [createBaseVNode("div", {
								class: "health-metric__fill",
								style: normalizeStyle({
									width: avgMetrics.value.mem + "%",
									background: metricColor(avgMetrics.value.mem)
								})
							}, null, 4)]),
							createBaseVNode("span", {
								class: "health-metric__val",
								style: normalizeStyle({ color: metricColor(avgMetrics.value.mem) })
							}, toDisplayString(avgMetrics.value.mem) + "%", 5)
						]),
						createBaseVNode("div", _hoisted_13, [
							createVNode(unref(box_default), { class: "health-metric__ico" }),
							_cache[33] || (_cache[33] = createBaseVNode("span", { class: "health-metric__label" }, "磁盘", -1)),
							createBaseVNode("div", _hoisted_14, [createBaseVNode("div", {
								class: "health-metric__fill",
								style: normalizeStyle({
									width: avgMetrics.value.disk + "%",
									background: metricColor(avgMetrics.value.disk)
								})
							}, null, 4)]),
							createBaseVNode("span", {
								class: "health-metric__val",
								style: normalizeStyle({ color: metricColor(avgMetrics.value.disk) })
							}, toDisplayString(avgMetrics.value.disk) + "%", 5)
						])
					])])]),
					createBaseVNode("div", _hoisted_15, [createBaseVNode("div", _hoisted_16, [
						createVNode(_component_ReFilter, {
							items: filterItems.value,
							columns: 3,
							collapsible: false,
							"show-actions": false,
							onChange: onFilterChange,
							onReset: onFilterReset,
							style: {
								"flex": "1",
								"min-width": "0"
							}
						}, {
							tag: withCtx(() => [allTags.value.length ? (openBlock(), createElementBlock("div", _hoisted_17, [_cache[34] || (_cache[34] = createBaseVNode("span", { class: "muted" }, "标签:", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(allTags.value, (t) => {
								return openBlock(), createBlock(_component_ReTag, {
									key: t,
									class: normalizeClass(["chip", { active: filterState.value.tag === t }]),
									onClick: ($event) => filterState.value.tag = filterState.value.tag === t ? "" : t
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(t), 1)]),
									_: 2
								}, 1032, ["class", "onClick"]);
							}), 128))])) : createCommentVNode("", true)]),
							_: 1
						}, 8, ["items"]),
						filtered.value.length !== hosts.value.length ? (openBlock(), createElementBlock("span", _hoisted_18, toDisplayString(filtered.value.length) + " / " + toDisplayString(hosts.value.length), 1)) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_19, [createBaseVNode("button", {
							class: normalizeClass(["vt-btn", { active: viewMode.value === "card" }]),
							onClick: _cache[1] || (_cache[1] = ($event) => viewMode.value = "card")
						}, [createVNode(_component_ReIcon, {
							name: "Grid",
							size: 14
						}), _cache[35] || (_cache[35] = createTextVNode("卡片 ", -1))], 2), createBaseVNode("button", {
							class: normalizeClass(["vt-btn", { active: viewMode.value === "table" }]),
							onClick: _cache[2] || (_cache[2] = ($event) => viewMode.value = "table")
						}, [createVNode(_component_ReIcon, {
							name: "Menu",
							size: 14
						}), _cache[36] || (_cache[36] = createTextVNode("列表 ", -1))], 2)]),
						createBaseVNode("div", _hoisted_20, [
							createBaseVNode("label", _hoisted_21, [_cache[37] || (_cache[37] = createBaseVNode("span", null, "实时监控", -1)), createVNode(_component_el_switch, {
								modelValue: realtimeEnabled.value,
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => realtimeEnabled.value = $event),
								onChange: onRealtimeToggle
							}, null, 8, ["modelValue"])]),
							createVNode(_component_ReButton, {
								icon: "RefreshRight",
								layout: "square",
								tip: "刷新",
								loading: loading.value,
								onClick: fetchAll
							}, null, 8, ["loading"]),
							createVNode(_component_ReButton, {
								icon: "Plus",
								layout: "square",
								type: "primary",
								tip: "新增资产",
								onClick: openAdd
							})
						])
					])]),
					viewMode.value === "card" ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass(["host-card-grid", { "host-card-grid--empty": filtered.value.length === 0 }])
					}, [(openBlock(true), createElementBlock(Fragment, null, renderList(filtered.value, (h) => {
						return openBlock(), createBlock(_component_ElCard, {
							key: h.id,
							"body-style": {
								paddingTop: "10px",
								paddingBottom: "10px"
							},
							onContextmenu: ($event) => openCtxMenu($event, h)
						}, {
							header: withCtx(() => [createBaseVNode("div", _hoisted_22, [createBaseVNode("span", { class: normalizeClass(["hc-os", osTileClass(h)]) }, [createBaseVNode("span", { innerHTML: unref(osIconSvg)(h.serverHostOsType) }, null, 8, _hoisted_23)], 2), createBaseVNode("div", _hoisted_24, [
								createBaseVNode("div", _hoisted_25, [
									createBaseVNode("b", _hoisted_26, toDisplayString(h.serverHostName), 1),
									h.serverHostOsType ? (openBlock(), createElementBlock("span", {
										key: 0,
										class: "hc-os-tag",
										title: h.serverHostOsVersion || h.serverHostOsType
									}, toDisplayString(h.serverHostOsType), 9, _hoisted_27)) : createCommentVNode("", true),
									createBaseVNode("span", { class: normalizeClass(["hc-online", liveOnlineState(h) === 1 ? "is-on" : "is-off"]) }, [_cache[38] || (_cache[38] = createBaseVNode("i", { class: "hc-dot" }, null, -1)), createTextVNode(toDisplayString(liveOnlineState(h) === 1 ? "在线" : "离线"), 1)], 2)
								]),
								createBaseVNode("div", _hoisted_28, toDisplayString(h.serverHostAddress) + ":" + toDisplayString(h.serverHostPort), 1),
								h.serverHostPublicIp || h.serverHostPrivateIp ? (openBlock(), createElementBlock("div", _hoisted_29, [
									h.serverHostPublicIp ? (openBlock(), createElementBlock("span", _hoisted_30, "公网 " + toDisplayString(h.serverHostPublicIp), 1)) : createCommentVNode("", true),
									h.serverHostPublicIp && h.serverHostPrivateIp ? (openBlock(), createElementBlock("span", _hoisted_31, "·")) : createCommentVNode("", true),
									h.serverHostPrivateIp ? (openBlock(), createElementBlock("span", _hoisted_32, "内网 " + toDisplayString(h.serverHostPrivateIp), 1)) : createCommentVNode("", true)
								])) : createCommentVNode("", true)
							])])]),
							footer: withCtx(() => [createBaseVNode("div", _hoisted_48, [
								createVNode(_component_ReButton, {
									icon: "Connection",
									"show-text": true,
									type: "primary",
									onClick: ($event) => openConnect(h)
								}, {
									default: withCtx(() => [..._cache[46] || (_cache[46] = [createTextVNode("远控", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "TrendCharts",
									"show-text": true,
									onClick: ($event) => openDetail(h)
								}, {
									default: withCtx(() => [..._cache[47] || (_cache[47] = [createTextVNode("监控", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "Aim",
									"show-text": true,
									onClick: ($event) => scanHostPorts(h)
								}, {
									default: withCtx(() => [..._cache[48] || (_cache[48] = [createTextVNode("扫描", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(unref(ElDropdown), {
									trigger: "click",
									placement: "bottom-end",
									onCommand: (cmd) => runRowCommand(cmd, h)
								}, {
									dropdown: withCtx(() => [createVNode(unref(ElDropdownMenu), null, {
										default: withCtx(() => [
											createVNode(unref(ElDropdownItem), { command: "profile" }, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "Histogram" }), _cache[50] || (_cache[50] = createTextVNode("主机画像", -1))]),
												_: 1
											}),
											createVNode(unref(ElDropdownItem), { command: "edit" }, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "EditPen" }), _cache[51] || (_cache[51] = createTextVNode("编辑主机", -1))]),
												_: 1
											}),
											isAgentMode(h) && !isAgentInstalled(h) ? (openBlock(), createBlock(unref(ElDropdownItem), {
												key: 0,
												command: "agent-install",
												divided: ""
											}, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "Download" }), _cache[52] || (_cache[52] = createTextVNode("安装 Agent", -1))]),
												_: 1
											})) : isAgentMode(h) ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
												createVNode(unref(ElDropdownItem), {
													command: "agent-reinstall",
													divided: ""
												}, {
													default: withCtx(() => [createVNode(_component_ReIcon, { name: "RefreshRight" }), _cache[53] || (_cache[53] = createTextVNode("重装 Agent", -1))]),
													_: 1
												}),
												createVNode(unref(ElDropdownItem), { command: "agent-upgrade" }, {
													default: withCtx(() => [createVNode(_component_ReIcon, { name: "Top" }), _cache[54] || (_cache[54] = createTextVNode("升级 Agent", -1))]),
													_: 1
												}),
												createVNode(unref(ElDropdownItem), { command: "agent-uninstall" }, {
													default: withCtx(() => [createVNode(_component_ReIcon, { name: "DeleteFilled" }), _cache[55] || (_cache[55] = createTextVNode("卸载 Agent", -1))]),
													_: 1
												})
											], 64)) : createCommentVNode("", true),
											createVNode(unref(ElDropdownItem), {
												command: "delete",
												divided: "",
												style: { "color": "var(--el-color-danger,#f56c6c)" }
											}, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "Delete" }), _cache[56] || (_cache[56] = createTextVNode("删除主机", -1))]),
												_: 1
											})
										]),
										_: 2
									}, 1024)]),
									default: withCtx(() => [createVNode(_component_ReButton, {
										icon: "MoreFilled",
										"show-text": true
									}, {
										default: withCtx(() => [..._cache[49] || (_cache[49] = [createTextVNode("更多", -1)])]),
										_: 1
									})]),
									_: 2
								}, 1032, ["onCommand"])
							])]),
							default: withCtx(() => [
								createBaseVNode("div", _hoisted_33, [
									createBaseVNode("span", _hoisted_34, [_cache[39] || (_cache[39] = createBaseVNode("i", null, "延迟", -1)), createBaseVNode("b", { class: normalizeClass(["mono", { bad: delayBad(liveDelayMs(h)) }]) }, toDisplayString(delayText(liveDelayMs(h))), 3)]),
									createBaseVNode("span", _hoisted_35, [_cache[40] || (_cache[40] = createBaseVNode("i", null, "采集", -1)), createBaseVNode("b", null, toDisplayString(collectModeLabel(h.serverHostCollectMode)), 1)]),
									createBaseVNode("span", _hoisted_36, [_cache[41] || (_cache[41] = createBaseVNode("i", null, "协议", -1)), createBaseVNode("b", null, toDisplayString(protocolOf(h).toUpperCase()), 1)]),
									createBaseVNode("span", _hoisted_37, [_cache[42] || (_cache[42] = createBaseVNode("i", null, "Agent", -1)), createBaseVNode("b", null, toDisplayString(h.serverHostAgentEnabled === 1 ? "已注册" : "未注册"), 1)])
								]),
								realtimeEnabled.value && rtMetrics[h.id] ? (openBlock(), createElementBlock("div", _hoisted_38, [
									createBaseVNode("div", _hoisted_39, [
										_cache[43] || (_cache[43] = createBaseVNode("span", { class: "hc-bar-label" }, "CPU", -1)),
										createVNode(unref(ElProgress), {
											percentage: Math.round(rtMetrics[h.id].cpu ?? 0),
											color: barColor(rtMetrics[h.id].cpu),
											"stroke-width": 16,
											"show-text": false,
											class: "hc-bar-progress"
										}, null, 8, ["percentage", "color"]),
										createBaseVNode("span", _hoisted_40, toDisplayString((rtMetrics[h.id].cpu ?? 0).toFixed(1)) + "%", 1)
									]),
									createBaseVNode("div", _hoisted_41, [
										_cache[44] || (_cache[44] = createBaseVNode("span", { class: "hc-bar-label" }, "内存", -1)),
										createVNode(unref(ElProgress), {
											percentage: Math.round(rtMetrics[h.id].mem ?? 0),
											color: barColor(rtMetrics[h.id].mem),
											"stroke-width": 16,
											"show-text": false,
											class: "hc-bar-progress"
										}, null, 8, ["percentage", "color"]),
										createBaseVNode("span", _hoisted_42, toDisplayString((rtMetrics[h.id].mem ?? 0).toFixed(1)) + "%", 1)
									]),
									createBaseVNode("div", _hoisted_43, [
										_cache[45] || (_cache[45] = createBaseVNode("span", { class: "hc-bar-label" }, "磁盘", -1)),
										createVNode(unref(ElProgress), {
											percentage: Math.round(rtMetrics[h.id].disk ?? 0),
											color: barColor(rtMetrics[h.id].disk),
											"stroke-width": 16,
											"show-text": false,
											class: "hc-bar-progress"
										}, null, 8, ["percentage", "color"]),
										createBaseVNode("span", _hoisted_44, toDisplayString((rtMetrics[h.id].disk ?? 0).toFixed(1)) + "%", 1)
									])
								])) : createCommentVNode("", true),
								h.msServerGroupId || splitTags(h.serverHostTags).length ? (openBlock(), createElementBlock("div", _hoisted_45, [h.msServerGroupId ? (openBlock(), createBlock(_component_ReTag, {
									key: 0,
									value: String(h.msServerGroupId),
									"tag-options": [{
										dictValue: String(h.msServerGroupId),
										dictLabel: groupName(h.msServerGroupId),
										dictTag: "primary"
									}]
								}, null, 8, ["value", "tag-options"])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(splitTags(h.serverHostTags), (t) => {
									return openBlock(), createBlock(_component_ReTag, {
										key: t,
										value: t,
										"tag-options": [{
											dictValue: t,
											dictLabel: t,
											dictTag: "info"
										}]
									}, null, 8, ["value", "tag-options"]);
								}), 128))])) : createCommentVNode("", true),
								parsePorts(h.serverHostPorts).length ? (openBlock(), createElementBlock("div", _hoisted_46, [createVNode(unref(ElPopover), {
									trigger: "hover",
									placement: "top-start",
									width: 260,
									"popper-class": "ports-popover"
								}, {
									reference: withCtx(() => [createVNode(_component_ReTag, {
										effect: "plain",
										type: "info"
									}, {
										default: withCtx(() => [createTextVNode("端口 " + toDisplayString(parsePorts(h.serverHostPorts).length), 1)]),
										_: 2
									}, 1024)]),
									default: withCtx(() => [createBaseVNode("div", _hoisted_47, [(openBlock(true), createElementBlock(Fragment, null, renderList(parsePorts(h.serverHostPorts), (p) => {
										return openBlock(), createElementBlock("div", {
											key: p.port,
											class: "ports-pop-item mono"
										}, toDisplayString(portText(p)), 1);
									}), 128))])]),
									_: 2
								}, 1024)])) : createCommentVNode("", true)
							]),
							_: 2
						}, 1032, ["onContextmenu"]);
					}), 128)), filtered.value.length === 0 ? (openBlock(), createBlock(_component_ElCard, {
						key: 0,
						class: "hc-empty-card",
						shadow: "never"
					}, {
						default: withCtx(() => [createVNode(_component_ElEmpty, {
							description: emptyDescription.value,
							"image-size": 120
						}, {
							default: withCtx(() => [loadError.value ? (openBlock(), createBlock(_component_ReButton, {
								key: 0,
								icon: "RefreshRight",
								type: "primary",
								"show-text": true,
								onClick: fetchAll
							}, {
								default: withCtx(() => [..._cache[57] || (_cache[57] = [createTextVNode("重试", -1)])]),
								_: 1
							})) : hasHosts.value ? (openBlock(), createBlock(_component_ReButton, {
								key: 1,
								icon: "Refresh",
								"show-text": true,
								onClick: resetFilters
							}, {
								default: withCtx(() => [..._cache[58] || (_cache[58] = [createTextVNode("重置筛选", -1)])]),
								_: 1
							})) : (openBlock(), createBlock(_component_ReButton, {
								key: 2,
								type: "primary",
								icon: "Plus",
								"show-text": true,
								onClick: openAdd
							}, {
								default: withCtx(() => [..._cache[59] || (_cache[59] = [createTextVNode("新增主机", -1)])]),
								_: 1
							}))]),
							_: 1
						}, 8, ["description"])]),
						_: 1
					})) : createCommentVNode("", true)], 2)) : (openBlock(), createBlock(_component_ReTable, {
						key: 2,
						data: filtered.value.map((h) => ({ ...h })),
						columns: tableColumns.value,
						loading: loading.value,
						"table-id": "asset-host-list",
						border: "",
						style: { "width": "100%" },
						"empty-text": "暂无主机",
						toolbar: true,
						"toolbar-config": {
							position: "top",
							refresh: true,
							columnSettings: true,
							tableSettings: true,
							batchSelect: {
								enabled: true,
								tip: "批量选择"
							},
							batchDelete: {
								enabled: true,
								confirmMessage: "确认批量删除选中的主机？",
								handler: batchDelete
							}
						},
						onSelectionChange: _cache[4] || (_cache[4] = ($event) => selection.value = $event),
						onContextmenu: onTableContextMenu
					}, {
						"col-name": withCtx(({ row }) => [createBaseVNode("span", _hoisted_49, [createBaseVNode("span", { innerHTML: unref(osIconSvg)(row.serverHostOsType) }, null, 8, _hoisted_50)]), createBaseVNode("b", _hoisted_51, toDisplayString(row.serverHostName), 1)]),
						"col-addr": withCtx(({ row }) => [createBaseVNode("span", _hoisted_52, toDisplayString(row.serverHostAddress) + ":" + toDisplayString(row.serverHostPort), 1)]),
						"col-group": withCtx(({ row }) => [row.msServerGroupId ? (openBlock(), createBlock(_component_ReTag, {
							key: 0,
							value: String(row.msServerGroupId),
							"tag-options": [{
								dictValue: String(row.msServerGroupId),
								dictLabel: groupName(row.msServerGroupId),
								dictTag: "primary"
							}]
						}, null, 8, ["value", "tag-options"])) : createCommentVNode("", true)]),
						"col-tags": withCtx(({ row }) => [splitTags(row.serverHostTags).length ? (openBlock(), createElementBlock("div", _hoisted_53, [(openBlock(true), createElementBlock(Fragment, null, renderList(splitTags(row.serverHostTags), (t) => {
							return openBlock(), createBlock(_component_ReTag, {
								key: t,
								value: t,
								"tag-options": [{
									dictValue: t,
									dictLabel: t,
									dictTag: "info"
								}]
							}, null, 8, ["value", "tag-options"]);
						}), 128))])) : (openBlock(), createElementBlock("span", _hoisted_54, "—"))]),
						"col-proto": withCtx(({ row }) => [createVNode(_component_ReTag, {
							value: protocolOf(row),
							"tag-options": [
								{
									dictValue: "ssh",
									dictLabel: "SSH",
									dictTag: "primary"
								},
								{
									dictValue: "rdp",
									dictLabel: "RDP",
									dictTag: "warning"
								},
								{
									dictValue: "vnc",
									dictLabel: "VNC",
									dictTag: "info"
								}
							]
						}, null, 8, ["value"])]),
						"col-status": withCtx(({ row }) => [createBaseVNode("span", _hoisted_55, [createVNode(_component_ReStatusIndicator, { type: liveOnlineState(row) === 1 ? "success" : "danger" }, null, 8, ["type"]), createTextVNode(toDisplayString(liveOnlineState(row) === 1 ? "在线" : "离线"), 1)])]),
						"col-delay": withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["delay-live", { bad: delayBad(liveDelayMs(row)) }]) }, toDisplayString(delayText(liveDelayMs(row))), 3)]),
						"col-agent": withCtx(({ row }) => [createVNode(_component_ReTag, {
							value: row.serverHostAgentEnabled === 1 ? "on" : "off",
							"tag-options": [{
								dictValue: "on",
								dictLabel: "已注册",
								dictTag: "success"
							}, {
								dictValue: "off",
								dictLabel: "未注册",
								dictTag: "info"
							}]
						}, null, 8, ["value"])]),
						"col-ports": withCtx(({ row }) => [parsePorts(row.serverHostPorts).length ? (openBlock(), createBlock(unref(ElPopover), {
							key: 0,
							trigger: "hover",
							placement: "top-start",
							width: 260,
							"popper-class": "ports-popover"
						}, {
							reference: withCtx(() => [createVNode(_component_ReTag, {
								effect: "plain",
								type: "info"
							}, {
								default: withCtx(() => [createTextVNode("端口 " + toDisplayString(parsePorts(row.serverHostPorts).length), 1)]),
								_: 2
							}, 1024)]),
							default: withCtx(() => [createBaseVNode("div", _hoisted_56, [(openBlock(true), createElementBlock(Fragment, null, renderList(parsePorts(row.serverHostPorts), (p) => {
								return openBlock(), createElementBlock("div", {
									key: p.port,
									class: "ports-pop-item mono"
								}, toDisplayString(portText(p)), 1);
							}), 128))])]),
							_: 2
						}, 1024)) : (openBlock(), createElementBlock("span", _hoisted_57, "未扫描"))]),
						"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_58, [
							createVNode(_component_ReButton, {
								icon: "Connection",
								layout: "square",
								type: "primary",
								onClick: ($event) => openConnect(row)
							}, {
								default: withCtx(() => [..._cache[60] || (_cache[60] = [createTextVNode("连接", -1)])]),
								_: 1
							}, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "EditPen",
								layout: "square",
								onClick: ($event) => openEdit(row)
							}, {
								default: withCtx(() => [..._cache[61] || (_cache[61] = [createTextVNode("编辑", -1)])]),
								_: 1
							}, 8, ["onClick"]),
							createVNode(unref(ElDropdown), {
								trigger: "click",
								placement: "bottom-end",
								onCommand: (cmd) => runRowCommand(cmd, row)
							}, {
								dropdown: withCtx(() => [createVNode(unref(ElDropdownMenu), null, {
									default: withCtx(() => [
										createVNode(unref(ElDropdownItem), { command: "detail" }, {
											default: withCtx(() => [createVNode(_component_ReIcon, { name: "TrendCharts" }), _cache[62] || (_cache[62] = createTextVNode("监控", -1))]),
											_: 1
										}),
										createVNode(unref(ElDropdownItem), { command: "scan" }, {
											default: withCtx(() => [createVNode(_component_ReIcon, { name: "Search" }), _cache[63] || (_cache[63] = createTextVNode("端口扫描", -1))]),
											_: 1
										}),
										createVNode(unref(ElDropdownItem), { command: "profile" }, {
											default: withCtx(() => [createVNode(_component_ReIcon, { name: "Histogram" }), _cache[64] || (_cache[64] = createTextVNode("主机画像", -1))]),
											_: 1
										}),
										isAgentMode(row) && !isAgentInstalled(row) ? (openBlock(), createBlock(unref(ElDropdownItem), {
											key: 0,
											command: "agent-install",
											divided: ""
										}, {
											default: withCtx(() => [createVNode(_component_ReIcon, { name: "Download" }), _cache[65] || (_cache[65] = createTextVNode("安装 Agent", -1))]),
											_: 1
										})) : isAgentMode(row) ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
											createVNode(unref(ElDropdownItem), {
												command: "agent-reinstall",
												divided: ""
											}, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "RefreshRight" }), _cache[66] || (_cache[66] = createTextVNode("重装 Agent", -1))]),
												_: 1
											}),
											createVNode(unref(ElDropdownItem), { command: "agent-upgrade" }, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "Top" }), _cache[67] || (_cache[67] = createTextVNode("升级 Agent", -1))]),
												_: 1
											}),
											createVNode(unref(ElDropdownItem), { command: "agent-uninstall" }, {
												default: withCtx(() => [createVNode(_component_ReIcon, { name: "DeleteFilled" }), _cache[68] || (_cache[68] = createTextVNode("卸载 Agent", -1))]),
												_: 1
											})
										], 64)) : createCommentVNode("", true),
										createVNode(unref(ElDropdownItem), {
											command: "delete",
											divided: "",
											style: { "color": "var(--el-color-danger,#f56c6c)" }
										}, {
											default: withCtx(() => [createVNode(_component_ReIcon, { name: "Delete" }), _cache[69] || (_cache[69] = createTextVNode("删除", -1))]),
											_: 1
										})
									]),
									_: 2
								}, 1024)]),
								default: withCtx(() => [createVNode(_component_ReButton, {
									icon: "MoreFilled",
									layout: "square",
									"aria-label": "更多"
								})]),
								_: 2
							}, 1032, ["onCommand"])
						])]),
						_: 1
					}, 8, [
						"data",
						"columns",
						"loading",
						"toolbar-config"
					])),
					createVNode(HostFormDialog_default, {
						modelValue: formVisible.value,
						"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => formVisible.value = $event),
						"is-edit": formIsEdit.value,
						host: editHost.value,
						"identity-options": identityOptions.value,
						"group-options": groupOptions.value,
						onSaved: fetchAll,
						onDeployAgent: openDeploy
					}, null, 8, [
						"modelValue",
						"is-edit",
						"host",
						"identity-options",
						"group-options"
					]),
					createVNode(_component_ReDialog, {
						modelValue: connectVisible.value,
						"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => connectVisible.value = $event),
						title: `连接 ${connectTarget.value?.serverHostName ?? ""}`,
						width: "460px"
					}, {
						footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[8] || (_cache[8] = ($event) => connectVisible.value = false) }, {
							default: withCtx(() => [..._cache[72] || (_cache[72] = [createTextVNode("取消", -1)])]),
							_: 1
						}), createVNode(_component_ReButton, {
							type: "primary",
							icon: "Connection",
							"show-text": true,
							onClick: doConnect
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(connectIdentityId.value ? "以此身份连接" : "默认凭据连接"), 1)]),
							_: 1
						})]),
						default: withCtx(() => [!connectTarget.value ? (openBlock(), createElementBlock("div", _hoisted_59)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
							createBaseVNode("p", _hoisted_60, toDisplayString(connectTarget.value.serverHostAddress) + ":" + toDisplayString(remotePortOf(connectTarget.value)) + " · " + toDisplayString(protocolOf(connectTarget.value).toUpperCase()), 1),
							_cache[71] || (_cache[71] = createBaseVNode("div", {
								class: "muted",
								style: { "margin-bottom": "8px" }
							}, "登录身份（账号密码 / 私钥）", -1)),
							createVNode(_component_ReSelect, {
								modelValue: connectIdentityId.value,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => connectIdentityId.value = $event),
								placeholder: "使用默认凭据",
								clearable: "",
								style: { "width": "100%" },
								options: [...hostBoundIdentities.value.map((b) => ({
									label: `${identities.value.find((i) => i.id === b)?.msServerIdentityName ?? ""}（${identities.value.find((i) => i.id === b)?.msServerIdentityUsername ?? ""}）`,
									value: b,
									group: "已绑定"
								})), ...identities.value.filter((x) => !hostBoundIdentities.value.includes(x.id)).map((i) => ({
									label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）`,
									value: i.id,
									group: "全部身份"
								}))]
							}, null, 8, ["modelValue", "options"]),
							createBaseVNode("div", _hoisted_61, [createVNode(_component_ReButton, {
								icon: "Key",
								"show-text": true,
								plain: "",
								title: "统一在左侧「账号管理」维护",
								onClick: _cache[7] || (_cache[7] = ($event) => unref(router).push("/account"))
							}, {
								default: withCtx(() => [..._cache[70] || (_cache[70] = [createTextVNode("账号管理", -1)])]),
								_: 1
							}), (openBlock(true), createElementBlock(Fragment, null, renderList(hostBoundIdentities.value, (b) => {
								return openBlock(), createBlock(_component_ReButton, {
									key: b,
									icon: "Unlink",
									"show-text": true,
									type: "warning",
									plain: "",
									title: `解绑 ${identities.value.find((i) => i.id === b)?.msServerIdentityName ?? ""}`,
									onClick: ($event) => toggleBind(connectTarget.value.id, b, false)
								}, {
									default: withCtx(() => [createTextVNode("解绑 " + toDisplayString(identities.value.find((i) => i.id === b)?.msServerIdentityName), 1)]),
									_: 2
								}, 1032, ["title", "onClick"]);
							}), 128))])
						], 64))]),
						_: 1
					}, 8, ["modelValue", "title"]),
					createVNode(HostConfigDialog_default, {
						modelValue: configVisible.value,
						"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => configVisible.value = $event),
						host: configHost.value,
						mode: configMode.value,
						onSaved: fetchAll
					}, null, 8, [
						"modelValue",
						"host",
						"mode"
					]),
					createVNode(HostProfileDialog_default, {
						modelValue: profileVisible.value,
						"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => profileVisible.value = $event),
						hosts: hosts.value,
						groups: groups.value,
						"live-delay": liveDelay.value,
						"live-online": liveOnline.value,
						"initial-host-id": profileHostId.value,
						"initial-tab": profileTab.value,
						"open-seq": profileSeq.value,
						onConnect: _cache[12] || (_cache[12] = (h) => openConnect(h)),
						onEdit: _cache[13] || (_cache[13] = (h) => openEdit(h)),
						onDetail: _cache[14] || (_cache[14] = (h) => openDetail(h)),
						onDeployAgent: _cache[15] || (_cache[15] = (h) => openDeploy(h, "install")),
						onRefreshed: fetchAll
					}, null, 8, [
						"modelValue",
						"hosts",
						"groups",
						"live-delay",
						"live-online",
						"initial-host-id",
						"initial-tab",
						"open-seq"
					])
				]),
				createVNode(AgentDeployDialog_default, {
					modelValue: deployDialogVisible.value,
					"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => deployDialogVisible.value = $event),
					minimized: deployMinimized.value,
					"onUpdate:minimized": _cache[17] || (_cache[17] = ($event) => deployMinimized.value = $event),
					task: deployTask.value,
					logs: deployLogs.value.map((l) => ({
						time: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
						msg: l
					}))
				}, null, 8, [
					"modelValue",
					"minimized",
					"task",
					"logs"
				]),
				(openBlock(), createBlock(Teleport, { to: "body" }, [ctxMenu.visible ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "host-ctx-backdrop",
					onClick: closeCtxMenu,
					onContextmenu: withModifiers(closeCtxMenu, ["prevent"])
				}, null, 32)) : createCommentVNode("", true), ctxMenu.visible && ctxMenu.host ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: "host-ctx-menu",
					style: normalizeStyle({
						left: ctxMenu.x + "px",
						top: ctxMenu.y + "px"
					}),
					onContextmenu: _cache[28] || (_cache[28] = withModifiers(() => {}, ["prevent"]))
				}, [
					createBaseVNode("div", {
						class: "host-ctx-item",
						onClick: _cache[18] || (_cache[18] = ($event) => ctxCommand("connect"))
					}, [createVNode(_component_ReIcon, { name: "Connection" }), _cache[73] || (_cache[73] = createBaseVNode("span", null, "连接远控", -1))]),
					createBaseVNode("div", {
						class: "host-ctx-item",
						onClick: _cache[19] || (_cache[19] = ($event) => ctxCommand("detail"))
					}, [createVNode(_component_ReIcon, { name: "TrendCharts" }), _cache[74] || (_cache[74] = createBaseVNode("span", null, "监控详情", -1))]),
					createBaseVNode("div", {
						class: "host-ctx-item",
						onClick: _cache[20] || (_cache[20] = ($event) => ctxCommand("profile"))
					}, [createVNode(_component_ReIcon, { name: "Histogram" }), _cache[75] || (_cache[75] = createBaseVNode("span", null, "主机画像", -1))]),
					createBaseVNode("div", {
						class: "host-ctx-item",
						onClick: _cache[21] || (_cache[21] = ($event) => ctxCommand("scan"))
					}, [createVNode(_component_ReIcon, { name: "Aim" }), _cache[76] || (_cache[76] = createBaseVNode("span", null, "端口扫描", -1))]),
					_cache[84] || (_cache[84] = createBaseVNode("div", { class: "host-ctx-sep" }, null, -1)),
					createBaseVNode("div", {
						class: "host-ctx-item",
						onClick: _cache[22] || (_cache[22] = ($event) => ctxCommand("edit"))
					}, [createVNode(_component_ReIcon, { name: "EditPen" }), _cache[77] || (_cache[77] = createBaseVNode("span", null, "编辑主机", -1))]),
					ctxMenu.host && isAgentMode(ctxMenu.host) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [_cache[82] || (_cache[82] = createBaseVNode("div", { class: "host-ctx-sep" }, null, -1)), !isAgentInstalled(ctxMenu.host) ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: "host-ctx-item",
						onClick: _cache[23] || (_cache[23] = ($event) => ctxCommand("agent-install"))
					}, [createVNode(_component_ReIcon, { name: "Download" }), _cache[78] || (_cache[78] = createBaseVNode("span", null, "安装 Agent", -1))])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", {
							class: "host-ctx-item",
							onClick: _cache[24] || (_cache[24] = ($event) => ctxCommand("agent-reinstall"))
						}, [createVNode(_component_ReIcon, { name: "RefreshRight" }), _cache[79] || (_cache[79] = createBaseVNode("span", null, "重装 Agent", -1))]),
						createBaseVNode("div", {
							class: "host-ctx-item",
							onClick: _cache[25] || (_cache[25] = ($event) => ctxCommand("agent-upgrade"))
						}, [createVNode(_component_ReIcon, { name: "Top" }), _cache[80] || (_cache[80] = createBaseVNode("span", null, "升级 Agent", -1))]),
						createBaseVNode("div", {
							class: "host-ctx-item is-danger",
							onClick: _cache[26] || (_cache[26] = ($event) => ctxCommand("agent-uninstall"))
						}, [createVNode(_component_ReIcon, { name: "DeleteFilled" }), _cache[81] || (_cache[81] = createBaseVNode("span", null, "卸载 Agent", -1))])
					], 64))], 64)) : createCommentVNode("", true),
					_cache[85] || (_cache[85] = createBaseVNode("div", { class: "host-ctx-sep" }, null, -1)),
					createBaseVNode("div", {
						class: "host-ctx-item is-danger",
						onClick: _cache[27] || (_cache[27] = ($event) => ctxCommand("delete"))
					}, [createVNode(_component_ReIcon, { name: "Delete" }), _cache[83] || (_cache[83] = createBaseVNode("span", null, "删除主机", -1))])
				], 36)) : createCommentVNode("", true)]))
			], 64);
		};
	}
}), [["__scopeId", "data-v-6eede0c7"]]);
//#endregion
export { AssetsView_default as default };
