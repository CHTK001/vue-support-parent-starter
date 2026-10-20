import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { Nt as refresh_default, Q as folder_opened_default, U as download_default, V as document_default, lt as link_default, st as key_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { k as queryHosts } from "./api-CRz4q4qT.js";
//#region src/api/acmeApi.ts
/**
* ACME 证书管理 API
*
* 独立 ACME 后端（spring-api-support-monitor-starter）默认上下文 /monitor/api。
* 页面通过 vite 代理 /monitor/api/* 转发，生产环境由部署网关做同样的前缀转发。
*
* @author CH
* @since 4.0.0.42
*/
var BASE = "/monitor/api/v1/cert";
var unwrap = (res) => unwrapResult(res);
/**
* 统一解包分页结果。
*
* 后端分页响应可能有两层形态，取决于 http() 的 then 是否已经把 AxiosResponse 剥离：
*   A) {code:"00000", data:{code:0,msg:"success",data:{pageNo,totalPages,total,data:[...]}}}
*   B) {code:0,msg:"success",data:{pageNo,totalPages,total,data:[...]}}
*   C) 已是 PageResult：{pageNo,totalPages,total,data:[...]}
* 这里循环下钻，直到找到「带数组 data（或 records）+ 数值 total」的那一层，避免多剥/少剥一层。
*/
var unwrapPage = (res) => {
	let node = unwrap(res);
	for (let i = 0; i < 4 && node && typeof node === "object"; i++) {
		const rows = node.data ?? node.records;
		if (Array.isArray(rows)) return {
			records: rows,
			total: Number(node.total ?? rows.length),
			pageNo: node.pageNo,
			pageSize: node.pageSize,
			totalPage: node.totalPages
		};
		if (node.data && typeof node.data === "object") {
			node = node.data;
			continue;
		}
		break;
	}
	return {
		records: [],
		total: 0
	};
};
var getAccountPage = (params = {}) => http().get(`${BASE}/account/page`).query({
	page: params.page ?? 1,
	pageSize: params.pageSize ?? 20,
	...params
}).then((r) => unwrapPage(r));
var getAccountList = () => http().get(`${BASE}/account/list`).then((r) => unwrap(r));
var saveAccount = (data) => http().post(`${BASE}/account/save`).data(data).then((r) => unwrap(r));
var deleteAccount = (accountId) => http().delete(`${BASE}/account/${accountId}`).then((r) => unwrap(r));
var getCertPage = (params = {}) => http().get(`${BASE}/page`).query({
	page: params.page ?? 1,
	pageSize: params.pageSize ?? 20,
	...params
}).then((r) => unwrapPage(r));
var getCertDetail = (certId) => http().get(`${BASE}/${certId}`).then((r) => unwrap(r));
var applyCert = (data) => http().post(`${BASE}/apply`).data(data).then((r) => unwrap(r));
var renewCert = (certId) => http().post(`${BASE}/${certId}/renew`).then((r) => unwrap(r));
var revokeCert = (certId) => http().post(`${BASE}/${certId}/revoke`).then((r) => unwrap(r));
var deleteCert = (certId) => http().delete(`${BASE}/${certId}`).then((r) => unwrap(r));
var retryValidation = (certId) => http().post(`${BASE}/${certId}/retry-validation`).then((r) => unwrap(r));
var triggerRenewCheck = () => http().post(`${BASE}/renew-check`).then((r) => unwrap(r));
var getCertStats = () => http().get(`${BASE}/stats`).then((r) => unwrap(r));
/** 下载证书，走统一请求管线以携带鉴权头 */
var downloadCertFile = async (certId, fileType = "cert") => {
	const res = await http().get(`${BASE}/${certId}/download`).query({ fileType }).responseType("blob");
	const disposition = String(res.headers?.["content-disposition"] ?? "");
	return {
		fileName: /filename="?([^";]+)"?/.exec(disposition)?.[1] || `${certId}_${fileType}.pem`,
		content: res.data
	};
};
var ACME_SERVER_GROUPS = [
	{
		label: "免费证书",
		options: [
			{
				label: "Let's Encrypt (生产)",
				value: "https://acme-v02.api.letsencrypt.org/directory"
			},
			{
				label: "Let's Encrypt (测试)",
				value: "https://acme-staging-v02.api.letsencrypt.org/directory"
			},
			{
				label: "ZeroSSL",
				value: "https://acme.zerossl.com/v2/DV90",
				eab: true
			},
			{
				label: "Buypass (生产)",
				value: "https://api.buypass.com/acme/directory"
			},
			{
				label: "Buypass (测试)",
				value: "https://api.test4.buypass.no/acme/directory"
			}
		]
	},
	{
		label: "Google",
		options: [{
			label: "Google Trust Services",
			value: "https://dv.acme-v02.api.pki.goog/directory",
			eab: true
		}, {
			label: "Google Trust Services (测试)",
			value: "https://dv.acme-v02.test-api.pki.goog/directory",
			eab: true
		}]
	},
	{
		label: "商业证书",
		options: [
			{
				label: "SSL.com (RSA)",
				value: "https://acme.ssl.com/sslcom-dv-rsa",
				eab: true
			},
			{
				label: "SSL.com (ECC)",
				value: "https://acme.ssl.com/sslcom-dv-ecc",
				eab: true
			},
			{
				label: "DigiCert",
				value: "https://acme.digicert.com/v2/acme/directory"
			},
			{
				label: "Sectigo",
				value: "https://acme.sectigo.com/v2/DV"
			}
		]
	},
	{
		label: "国内推荐",
		options: [{
			label: "HiCA",
			value: "https://acme.hi.cn/directory",
			eab: true
		}]
	}
];
var ACME_SERVERS = ACME_SERVER_GROUPS.flatMap((g) => g.options);
var isEabRequired = (serverUrl) => ACME_SERVERS.some((s) => s.value === serverUrl && s.eab);
var CHALLENGE_TYPES = [{
	label: "HTTP-01（HTTP 验证）",
	value: "HTTP-01"
}, {
	label: "DNS-01（DNS 验证）",
	value: "DNS-01"
}];
var DEPLOY_MODES = [
	{
		label: "手动部署",
		value: "manual"
	},
	{
		label: "本机部署",
		value: "local"
	},
	{
		label: "SSH 远程部署",
		value: "ssh"
	}
];
var CERT_STATUS_MAP = {
	pending: {
		label: "待处理",
		type: "warning"
	},
	validating: {
		label: "验证中",
		type: "warning"
	},
	valid: {
		label: "有效",
		type: "success"
	},
	expired: {
		label: "已过期",
		type: "danger"
	},
	revoked: {
		label: "已吊销",
		type: "info"
	},
	failed: {
		label: "失败",
		type: "danger"
	}
};
var ACCOUNT_STATUS_MAP = {
	valid: {
		label: "有效",
		type: "success"
	},
	deactivated: {
		label: "已停用",
		type: "warning"
	},
	revoked: {
		label: "已吊销",
		type: "danger"
	}
};
var certStatusInfo = (status) => CERT_STATUS_MAP[String(status ?? "")] ?? {
	label: status || "未知",
	type: "info"
};
var accountStatusInfo = (status) => ACCOUNT_STATUS_MAP[String(status ?? "")] ?? {
	label: status || "未知",
	type: "info"
};
var serverLabel = (url) => (ACME_SERVERS.find((s) => s.value === url)?.label ?? url) || "—";
//#endregion
//#region src/views/acme/components/ApplyCertDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = {
	key: 0,
	class: "field-hint"
};
//#endregion
//#region src/views/acme/components/ApplyCertDialog.vue
var ApplyCertDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ApplyCertDialog",
	props: {
		modelValue: { type: Boolean },
		initData: {},
		host: {}
	},
	emits: [
		"update:modelValue",
		"success",
		"view-cert"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const dialogVisible = computed({
			get: () => props.modelValue,
			set: (v) => emit("update:modelValue", v)
		});
		const accounts = ref([]);
		const accountLoading = ref(false);
		const submitting = ref(false);
		/** 主机列表（用于 SSH 部署时选择） */
		const hostOptions = ref([]);
		const hostLoading = ref(false);
		const hostSelectValue = ref(null);
		const form = reactive({
			acmeAccountId: void 0,
			primaryDomain: "",
			sanDomains: [],
			challengeType: "HTTP-01",
			deployMode: "manual",
			webrootPath: "/var/www/html",
			sshHost: "",
			sshPort: 22,
			sshUsername: "",
			sshPassword: "",
			remark: ""
		});
		const hostLabel = computed(() => {
			const p = props.host;
			if (!p) return "";
			return p.hostName || p.domain || (p.hostId ? `主机 #${p.hostId}` : "");
		});
		async function loadAccounts() {
			accountLoading.value = true;
			try {
				accounts.value = await getAccountList() ?? [];
			} catch (e) {
				accounts.value = [];
				message.error(`ACME 账户加载失败：${String(e?.message ?? e)}`);
			} finally {
				accountLoading.value = false;
			}
		}
		async function loadHosts() {
			hostLoading.value = true;
			try {
				hostOptions.value = await queryHosts() ?? [];
			} catch {
				hostOptions.value = [];
			} finally {
				hostLoading.value = false;
			}
		}
		function resetForm() {
			Object.assign(form, {
				acmeAccountId: void 0,
				primaryDomain: props.host?.domain ?? "",
				sanDomains: [],
				challengeType: "HTTP-01",
				deployMode: props.host && props.host.username ? "ssh" : "manual",
				webrootPath: "/var/www/html",
				sshHost: props.host?.domain ?? "",
				sshPort: props.host?.port || 22,
				sshUsername: props.host?.username ?? "",
				sshPassword: "",
				remark: props.host ? `从主机资产「${hostLabel.value}」发起申请` : ""
			});
			hostSelectValue.value = props.host?.hostId ?? null;
		}
		watch(dialogVisible, (v) => {
			if (v) {
				resetForm();
				loadAccounts();
				loadHosts();
			}
		});
		watch(() => form.challengeType, (t) => {
			if (t !== "HTTP-01") form.deployMode = "manual";
		});
		/** 主机选择变化 → 自动填入 SSH 信息 */
		watch(hostSelectValue, (hostId) => {
			if (!hostId) {
				form.sshHost = "";
				form.sshPort = 22;
				form.sshUsername = "";
				form.sshPassword = "";
				return;
			}
			const h = hostOptions.value.find((x) => x.id === hostId || x.msServerHostId === hostId);
			if (h) {
				form.sshHost = h.hostIp || h.domain || "";
				form.sshPort = h.sshPort || h.port || 22;
				form.sshUsername = h.sshUsername || h.osUsername || "";
				form.sshPassword = "";
			}
		});
		function validate() {
			if (!form.acmeAccountId) return "请选择 ACME 账户";
			if (!form.primaryDomain.trim()) return "请填写主域名";
			if (form.sanDomains.some((d) => !d.trim())) return "备用域名不能为空串";
			if (form.challengeType === "DNS-01" && form.primaryDomain.trim().startsWith("*.")) {}
			if (form.challengeType !== "DNS-01" && form.primaryDomain.trim().startsWith("*.")) return "通配符域名仅支持 DNS-01 验证";
			if (form.deployMode === "ssh" && form.challengeType === "HTTP-01") {
				if (!hostSelectValue.value && !form.sshHost.trim()) return "SSH 模式需要选择或填写服务器地址";
			}
			return "";
		}
		async function submit() {
			const err = validate();
			if (err) {
				message.warning(err);
				return;
			}
			submitting.value = true;
			try {
				const certId = await applyCert({
					acmeAccountId: form.acmeAccountId,
					primaryDomain: form.primaryDomain.trim(),
					sanDomains: form.sanDomains.map((s) => s.trim()).filter(Boolean),
					challengeType: form.challengeType,
					deployMode: form.deployMode,
					webrootPath: form.webrootPath,
					sshHost: form.deployMode === "ssh" ? form.sshHost.trim() : void 0,
					sshPort: form.deployMode === "ssh" ? Number(form.sshPort) || 22 : void 0,
					sshUsername: form.deployMode === "ssh" ? form.sshUsername.trim() : void 0,
					sshPassword: form.deployMode === "ssh" ? form.sshPassword : void 0
				});
				message.success("证书申请已提交，后台异步签发");
				dialogVisible.value = false;
				emit("success");
				if (certId) emit("view-cert", Number(certId));
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				submitting.value = false;
			}
		}
		const showEabTip = computed(() => {
			const selected = accounts.value.find((a) => a.acmeAccountId === form.acmeAccountId);
			return selected ? isEabRequired(selected.acmeAccountServer) : false;
		});
		return (_ctx, _cache) => {
			const _component_el_alert = resolveComponent("el-alert");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_radio_button = resolveComponent("el-radio-button");
			const _component_el_radio_group = resolveComponent("el-radio-group");
			const _component_el_divider = resolveComponent("el-divider");
			const _component_el_input_number = resolveComponent("el-input-number");
			const _component_el_form = resolveComponent("el-form");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_dialog = resolveComponent("el-dialog");
			return openBlock(), createBlock(_component_el_dialog, {
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => dialogVisible.value = $event),
				title: "申请 SSL/TLS 证书",
				width: "680px",
				"append-to-body": "",
				"close-on-click-modal": false
			}, {
				footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[11] || (_cache[11] = ($event) => dialogVisible.value = false) }, {
					default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(_component_el_button, {
					type: "primary",
					loading: submitting.value,
					onClick: submit
				}, {
					default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("提交申请", -1)])]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [createVNode(_component_el_form, { "label-width": "120px" }, {
					default: withCtx(() => [
						hostLabel.value ? (openBlock(), createBlock(_component_el_alert, {
							key: 0,
							type: "info",
							closable: false,
							class: "mb12"
						}, {
							title: withCtx(() => [createTextVNode("为「" + toDisplayString(hostLabel.value) + "」申请证书，已带入主机 SSH/部署信息", 1)]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(_component_el_form_item, {
							label: "ACME 账户",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_el_select, {
								modelValue: form.acmeAccountId,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.acmeAccountId = $event),
								filterable: "",
								placeholder: "请选择 ACME 账户",
								style: { "width": "100%" },
								loading: accountLoading.value
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(accounts.value, (a) => {
									return openBlock(), createBlock(_component_el_option, {
										key: a.acmeAccountId,
										value: a.acmeAccountId,
										label: `${a.acmeAccountEmail} · ${unref(serverLabel)(a.acmeAccountServer)}`
									}, null, 8, ["value", "label"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue", "loading"]), showEabTip.value ? (openBlock(), createElementBlock("div", _hoisted_1$3, "该 ACME 服务商需要 EAB 凭证，请在账户设置中补齐。")) : createCommentVNode("", true)]),
							_: 1
						}),
						createVNode(_component_el_form_item, {
							label: "主域名",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.primaryDomain,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.primaryDomain = $event),
								placeholder: "example.com 或 *.example.com"
							}, null, 8, ["modelValue"]), _cache[13] || (_cache[13] = createBaseVNode("div", { class: "field-hint" }, "通配符域名仅支持 DNS-01 验证。", -1))]),
							_: 1
						}),
						createVNode(_component_el_form_item, { label: "备用域名" }, {
							default: withCtx(() => [createVNode(_component_el_select, {
								modelValue: form.sanDomains,
								"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.sanDomains = $event),
								multiple: "",
								filterable: "",
								"allow-create": "",
								"default-first-option": "",
								placeholder: "输入域名后回车，可添加多个 SAN",
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(_component_el_form_item, {
							label: "验证类型",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_el_radio_group, {
								modelValue: form.challengeType,
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.challengeType = $event)
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(CHALLENGE_TYPES), (c) => {
									return openBlock(), createBlock(_component_el_radio_button, {
										key: c.value,
										value: c.value
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(c.label), 1)]),
										_: 2
									}, 1032, ["value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							_: 1
						}),
						form.challengeType === "HTTP-01" ? (openBlock(), createBlock(_component_el_form_item, {
							key: 1,
							label: "部署模式",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_el_radio_group, {
								modelValue: form.deployMode,
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.deployMode = $event)
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(DEPLOY_MODES), (m) => {
									return openBlock(), createBlock(_component_el_radio_button, {
										key: m.value,
										value: m.value
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(m.label), 1)]),
										_: 2
									}, 1032, ["value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							_: 1
						})) : createCommentVNode("", true),
						form.challengeType === "HTTP-01" && form.deployMode !== "manual" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [createVNode(_component_el_divider, { "content-position": "left" }, {
							default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("Webroot 验证文件目录", -1)])]),
							_: 1
						}), createVNode(_component_el_form_item, { label: "Webroot 路径" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.webrootPath,
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.webrootPath = $event),
								placeholder: "/var/www/html"
							}, null, 8, ["modelValue"]), _cache[15] || (_cache[15] = createBaseVNode("div", { class: "field-hint" }, [
								createTextVNode("系统会在该目录下创建 "),
								createBaseVNode("code", null, "/.well-known/acme-challenge/"),
								createTextVNode(" 验证文件。")
							], -1))]),
							_: 1
						})], 64)) : createCommentVNode("", true),
						form.challengeType === "HTTP-01" && form.deployMode === "ssh" ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
							createVNode(_component_el_divider, { "content-position": "left" }, {
								default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("SSH 远程部署", -1)])]),
								_: 1
							}),
							createVNode(_component_el_form_item, {
								label: "服务器地址",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.sshHost,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.sshHost = $event),
									placeholder: "域名指向的服务器 IP"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "SSH 端口" }, {
								default: withCtx(() => [createVNode(_component_el_input_number, {
									modelValue: form.sshPort,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.sshPort = $event),
									min: 1,
									max: 65535,
									style: { "width": "180px" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, {
								label: "用户名",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.sshUsername,
									"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.sshUsername = $event),
									placeholder: "root"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, {
								label: "密码",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.sshPassword,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.sshPassword = $event),
									type: "password",
									"show-password": "",
									placeholder: "SSH 密码"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						], 64)) : createCommentVNode("", true),
						createVNode(_component_el_form_item, { label: "备注" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.remark,
								"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.remark = $event),
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
			}, 8, ["modelValue"]);
		};
	}
}), [["__scopeId", "data-v-4dbbbfa5"]]);
//#endregion
//#region src/views/acme/components/AccountDialog.vue
var AccountDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "AccountDialog",
	props: {
		modelValue: { type: Boolean },
		account: {}
	},
	emits: ["update:modelValue", "success"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const dialogVisible = computed({
			get: () => props.modelValue,
			set: (v) => emit("update:modelValue", v)
		});
		const submitting = ref(false);
		const form = reactive({
			acmeAccountId: void 0,
			acmeAccountEmail: "",
			acmeAccountServer: "https://acme-v02.api.letsencrypt.org/directory",
			acmeAccountProviderType: "acme",
			acmeAccountEabKid: "",
			acmeAccountEabHmacKey: "",
			acmeAccountRemark: ""
		});
		const isEdit = computed(() => form.acmeAccountId != null);
		const showEab = computed(() => isEabRequired(form.acmeAccountServer || ""));
		watch(dialogVisible, (v) => {
			if (!v) return;
			const src = props.account;
			Object.assign(form, {
				acmeAccountId: src?.acmeAccountId,
				acmeAccountEmail: src?.acmeAccountEmail ?? "",
				acmeAccountServer: src?.acmeAccountServer || "https://acme-v02.api.letsencrypt.org/directory",
				acmeAccountProviderType: src?.acmeAccountProviderType || "acme",
				acmeAccountEabKid: src?.acmeAccountEabKid ?? "",
				acmeAccountEabHmacKey: src?.acmeAccountEabHmacKey ?? "",
				acmeAccountRemark: src?.acmeAccountRemark ?? ""
			});
		});
		function validate() {
			if (!form.acmeAccountEmail.trim()) return "请填写邮箱";
			if (!form.acmeAccountServer.trim()) return "请选择 ACME 服务商";
			if (showEab.value && (!form.acmeAccountEabKid?.trim() || !form.acmeAccountEabHmacKey?.trim())) return "该服务商需要 EAB Key ID 与 HMAC Key";
			return "";
		}
		async function submit() {
			const err = validate();
			if (err) {
				message.warning(err);
				return;
			}
			submitting.value = true;
			try {
				await saveAccount({
					...form,
					acmeAccountEmail: form.acmeAccountEmail.trim(),
					acmeAccountServer: form.acmeAccountServer.trim(),
					acmeAccountRemark: form.acmeAccountRemark?.trim() || void 0
				});
				message.success(isEdit.value ? "ACME 账户已更新" : "ACME 账户已创建");
				dialogVisible.value = false;
				emit("success");
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				submitting.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_el_input = resolveComponent("el-input");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_option_group = resolveComponent("el-option-group");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_alert = resolveComponent("el-alert");
			const _component_el_form = resolveComponent("el-form");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_dialog = resolveComponent("el-dialog");
			return openBlock(), createBlock(_component_el_dialog, {
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => dialogVisible.value = $event),
				title: isEdit.value ? "编辑 ACME 账户" : "添加 ACME 账户",
				width: "560px",
				"append-to-body": "",
				"close-on-click-modal": false
			}, {
				footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[5] || (_cache[5] = ($event) => dialogVisible.value = false) }, {
					default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(_component_el_button, {
					type: "primary",
					loading: submitting.value,
					onClick: submit
				}, {
					default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("保存", -1)])]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [createVNode(_component_el_form, { "label-width": "120px" }, {
					default: withCtx(() => [
						createVNode(_component_el_form_item, {
							label: "邮箱",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.acmeAccountEmail,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.acmeAccountEmail = $event),
								placeholder: "example@domain.com",
								disabled: isEdit.value
							}, null, 8, ["modelValue", "disabled"])]),
							_: 1
						}),
						createVNode(_component_el_form_item, {
							label: "ACME 服务商",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_el_select, {
								modelValue: form.acmeAccountServer,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.acmeAccountServer = $event),
								filterable: "",
								"allow-create": "",
								"default-first-option": "",
								placeholder: "选择或输入 ACME 目录",
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ACME_SERVER_GROUPS), (g) => {
									return openBlock(), createBlock(_component_el_option_group, {
										key: g.label,
										label: g.label
									}, {
										default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(g.options, (s) => {
											return openBlock(), createBlock(_component_el_option, {
												key: s.value,
												value: s.value,
												label: s.label
											}, {
												default: withCtx(() => [createBaseVNode("span", null, toDisplayString(s.label), 1), s.eab ? (openBlock(), createBlock(_component_el_tag, {
													key: 0,
													size: "small",
													type: "warning",
													effect: "plain",
													style: { "margin-left": "8px" }
												}, {
													default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("EAB", -1)])]),
													_: 1
												})) : createCommentVNode("", true)]),
												_: 2
											}, 1032, ["value", "label"]);
										}), 128))]),
										_: 2
									}, 1032, ["label"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							_: 1
						}),
						showEab.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
							createVNode(_component_el_alert, {
								type: "warning",
								closable: false,
								class: "mb12"
							}, {
								title: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("该服务商需要 EAB 凭证，请从服务商控制台获取后填写。", -1)])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "EAB Key ID" }, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.acmeAccountEabKid,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.acmeAccountEabKid = $event),
									placeholder: "EAB Key ID (KID)"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "EAB HMAC Key" }, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.acmeAccountEabHmacKey,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.acmeAccountEabHmacKey = $event),
									type: "password",
									"show-password": "",
									placeholder: "EAB HMAC Key (Base64)"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						], 64)) : createCommentVNode("", true),
						createVNode(_component_el_form_item, { label: "备注" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.acmeAccountRemark,
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.acmeAccountRemark = $event),
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
			}, 8, ["modelValue", "title"]);
		};
	}
}), [["__scopeId", "data-v-299bd413"]]);
//#endregion
//#region src/views/acme/components/CertDetailDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { key: 1 };
var _hoisted_2$1 = { class: "info-cards" };
var _hoisted_3$1 = { class: "info-card" };
var _hoisted_4$1 = { class: "ic-value" };
var _hoisted_5$1 = {
	key: 0,
	class: "ic-extra"
};
var _hoisted_6$1 = { class: "info-card" };
var _hoisted_7$1 = { class: "info-card" };
var _hoisted_8$1 = { class: "ic-value" };
var _hoisted_9$1 = { class: "ic-extra" };
var _hoisted_10$1 = { class: "info-card" };
var _hoisted_11$1 = { class: "ic-value" };
var _hoisted_12$1 = { class: "ic-extra" };
var _hoisted_13$1 = { class: "block" };
var _hoisted_14$1 = { class: "time-line" };
var _hoisted_15$1 = {
	key: 0,
	class: "block"
};
var _hoisted_16$1 = {
	key: 1,
	class: "block"
};
var _hoisted_17$1 = { class: "val-head" };
var _hoisted_18$1 = {
	key: 0,
	class: "val-row"
};
var _hoisted_19$1 = {
	key: 1,
	class: "val-row"
};
var _hoisted_20$1 = {
	key: 2,
	class: "block"
};
var _hoisted_21$1 = {
	key: 3,
	class: "block"
};
var _hoisted_22$1 = { class: "block" };
//#endregion
//#region src/views/acme/components/CertDetailDialog.vue
var CertDetailDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "CertDetailDialog",
	props: {
		modelValue: { type: Boolean },
		certId: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const dialogVisible = computed({
			get: () => props.modelValue,
			set: (v) => emit("update:modelValue", v)
		});
		const loading = ref(false);
		const detail = ref(null);
		const error = ref("");
		async function load() {
			if (!props.certId) return;
			loading.value = true;
			error.value = "";
			try {
				detail.value = await getCertDetail(props.certId);
			} catch (e) {
				detail.value = null;
				error.value = String(e?.message ?? e);
			} finally {
				loading.value = false;
			}
		}
		watch(dialogVisible, (v) => {
			if (v) load();
		});
		const status = computed(() => certStatusInfo(detail.value?.certificate?.acmeCertStatus));
		const sanCount = computed(() => {
			const san = detail.value?.certificate?.acmeCertSan;
			if (!san) return 0;
			return san.split(",").filter(Boolean).length;
		});
		const validationInfos = computed(() => {
			return (detail.value?.orders ?? []).flatMap((o) => {
				try {
					const arr = JSON.parse(o.acmeAuthzUrls || "[]");
					return Array.isArray(arr) ? arr : [];
				} catch {
					return [];
				}
			});
		});
		function expiryText() {
			const d = detail.value?.daysUntilExpiry;
			if (d == null) return "—";
			if (d < 0) return `已过期 ${-d} 天`;
			return `剩余 ${d} 天`;
		}
		function progressPercent() {
			const c = detail.value?.certificate;
			if (!c?.acmeCertNotBefore || !c?.acmeCertNotAfter) return 0;
			const start = new Date(c.acmeCertNotBefore.replace(" ", "T")).getTime();
			const end = new Date(c.acmeCertNotAfter.replace(" ", "T")).getTime();
			const now = Date.now();
			if (end <= start) return 100;
			const pct = (now - start) / (end - start) * 100;
			return Math.max(0, Math.min(100, Math.round(pct)));
		}
		return (_ctx, _cache) => {
			const _component_el_skeleton = resolveComponent("el-skeleton");
			const _component_el_alert = resolveComponent("el-alert");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_el_progress = resolveComponent("el-progress");
			const _component_el_table_column = resolveComponent("el-table-column");
			const _component_el_table = resolveComponent("el-table");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_dialog = resolveComponent("el-dialog");
			return openBlock(), createBlock(_component_el_dialog, {
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => dialogVisible.value = $event),
				title: `证书详情 · ${detail.value?.certificate?.acmeCertPrimaryDomain || "加载中..."}`,
				width: "780px",
				"append-to-body": ""
			}, {
				footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[0] || (_cache[0] = ($event) => dialogVisible.value = false) }, {
					default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("关闭", -1)])]),
					_: 1
				})]),
				default: withCtx(() => [loading.value ? (openBlock(), createBlock(_component_el_skeleton, {
					key: 0,
					rows: 6,
					animated: ""
				})) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [error.value ? (openBlock(), createBlock(_component_el_alert, {
					key: 0,
					type: "error",
					closable: false,
					class: "mb12",
					title: error.value
				}, null, 8, ["title"])) : detail.value ? (openBlock(), createElementBlock("div", _hoisted_1$2, [
					createBaseVNode("div", _hoisted_2$1, [
						createBaseVNode("div", _hoisted_3$1, [
							_cache[2] || (_cache[2] = createBaseVNode("div", { class: "ic-label" }, "主域名", -1)),
							createBaseVNode("div", _hoisted_4$1, toDisplayString(detail.value.certificate.acmeCertPrimaryDomain), 1),
							sanCount.value ? (openBlock(), createElementBlock("div", _hoisted_5$1, "+" + toDisplayString(sanCount.value) + " 个备用域名", 1)) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_6$1, [_cache[3] || (_cache[3] = createBaseVNode("div", { class: "ic-label" }, "状态", -1)), createVNode(_component_el_tag, {
							type: status.value.type,
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(status.value.label), 1)]),
							_: 1
						}, 8, ["type"])]),
						createBaseVNode("div", _hoisted_7$1, [
							_cache[4] || (_cache[4] = createBaseVNode("div", { class: "ic-label" }, "有效期", -1)),
							createBaseVNode("div", _hoisted_8$1, toDisplayString(expiryText()), 1),
							createBaseVNode("div", _hoisted_9$1, toDisplayString(detail.value.certificate.acmeCertNotAfter || "—"), 1)
						]),
						createBaseVNode("div", _hoisted_10$1, [
							_cache[5] || (_cache[5] = createBaseVNode("div", { class: "ic-label" }, "验证方式", -1)),
							createBaseVNode("div", _hoisted_11$1, toDisplayString(detail.value.certificate.acmeCertChallengeType || "—"), 1),
							createBaseVNode("div", _hoisted_12$1, toDisplayString(detail.value.account ? unref(serverLabel)(detail.value.account.acmeAccountServer) : ""), 1)
						])
					]),
					createBaseVNode("div", _hoisted_13$1, [
						_cache[6] || (_cache[6] = createBaseVNode("div", { class: "block-title" }, "有效期进度", -1)),
						createVNode(_component_el_progress, {
							percentage: progressPercent(),
							"stroke-width": 8
						}, null, 8, ["percentage"]),
						createBaseVNode("div", _hoisted_14$1, [createBaseVNode("span", null, toDisplayString(detail.value.certificate.acmeCertNotBefore || "—"), 1), createBaseVNode("span", null, toDisplayString(detail.value.certificate.acmeCertNotAfter || "—"), 1)])
					]),
					detail.value.certificate.acmeCertLastError ? (openBlock(), createElementBlock("div", _hoisted_15$1, [_cache[7] || (_cache[7] = createBaseVNode("div", { class: "block-title" }, "最近错误", -1)), createVNode(_component_el_alert, {
						type: "error",
						closable: false,
						title: detail.value.certificate.acmeCertLastError
					}, null, 8, ["title"])])) : createCommentVNode("", true),
					validationInfos.value.length ? (openBlock(), createElementBlock("div", _hoisted_16$1, [
						_cache[10] || (_cache[10] = createBaseVNode("div", { class: "block-title" }, "验证信息", -1)),
						createVNode(_component_el_alert, {
							type: "warning",
							closable: false,
							title: "请按以下信息完成域名验证，部署完成后点击「重新验证」。",
							class: "mb12"
						}),
						(openBlock(true), createElementBlock(Fragment, null, renderList(validationInfos.value, (info, idx) => {
							return openBlock(), createElementBlock("div", {
								key: idx,
								class: "val-item"
							}, [createBaseVNode("div", _hoisted_17$1, [createBaseVNode("b", null, toDisplayString(info.domain), 1), createVNode(_component_el_tag, {
								size: "small",
								type: info.type === "DNS-01" ? "success" : "primary"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(info.type), 1)]),
								_: 2
							}, 1032, ["type"])]), info.type === "HTTP-01" ? (openBlock(), createElementBlock("div", _hoisted_18$1, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "val-label" }, "验证地址", -1)), createBaseVNode("code", null, "http://" + toDisplayString(info.domain) + "/.well-known/acme-challenge/" + toDisplayString(info.token), 1)])) : info.type === "DNS-01" ? (openBlock(), createElementBlock("div", _hoisted_19$1, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "val-label" }, "DNS 记录", -1)), createBaseVNode("code", null, toDisplayString(info.dnsName) + " → " + toDisplayString(info.dnsValue), 1)])) : createCommentVNode("", true)]);
						}), 128))
					])) : createCommentVNode("", true),
					detail.value.curlCommands?.length ? (openBlock(), createElementBlock("div", _hoisted_20$1, [_cache[11] || (_cache[11] = createBaseVNode("div", { class: "block-title" }, "curl 自检命令", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(detail.value.curlCommands, (c, idx) => {
						return openBlock(), createElementBlock("div", {
							key: idx,
							class: "code-line"
						}, toDisplayString(c), 1);
					}), 128))])) : createCommentVNode("", true),
					detail.value.stepDescription ? (openBlock(), createElementBlock("div", _hoisted_21$1, [_cache[12] || (_cache[12] = createBaseVNode("div", { class: "block-title" }, "当前步骤", -1)), createVNode(_component_el_tag, { effect: "plain" }, {
						default: withCtx(() => [createTextVNode(toDisplayString(detail.value.currentStep || "") + " · " + toDisplayString(detail.value.stepDescription), 1)]),
						_: 1
					})])) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_22$1, [_cache[13] || (_cache[13] = createBaseVNode("div", { class: "block-title" }, "申请订单", -1)), createVNode(_component_el_table, {
						data: detail.value.orders ?? [],
						size: "small",
						border: ""
					}, {
						default: withCtx(() => [
							createVNode(_component_el_table_column, {
								prop: "acmeOrderId",
								label: "ID",
								width: "80"
							}),
							createVNode(_component_el_table_column, {
								prop: "acmeOrderStatus",
								label: "状态",
								width: "120"
							}, {
								default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.acmeOrderStatus || "—"), 1)]),
								_: 1
							}),
							createVNode(_component_el_table_column, {
								prop: "acmeOrderUrl",
								label: "订单 URL",
								"min-width": "220",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_el_table_column, {
								prop: "updateTime",
								label: "更新时间",
								width: "170"
							})
						]),
						_: 1
					}, 8, ["data"])])
				])) : createCommentVNode("", true)], 64))]),
				_: 1
			}, 8, ["modelValue", "title"]);
		};
	}
}), [["__scopeId", "data-v-ec8d1e21"]]);
//#endregion
//#region src/utils/zip.ts
/** CRC32 查表（ZIP 每个条目都需要校验值） */
var CRC_TABLE = (() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();
/**
* 计算 CRC32（ZIP 条目校验值）。
*
* @param buf 字节内容
* @returns 无符号 32 位 CRC
*/
function crc32(buf) {
	let c = 4294967295;
	for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
/**
* 把若干条目打成 zip。
*
* @param entries 条目列表（名称 + 内容）
* @returns application/zip 的 Blob
*/
function createZip(entries) {
	const enc = new TextEncoder();
	const now = /* @__PURE__ */ new Date();
	const dosTime = (now.getHours() << 11 | now.getMinutes() << 5 | now.getSeconds() >> 1) & 65535;
	const dosDate = (now.getFullYear() - 1980 << 9 | now.getMonth() + 1 << 5 | now.getDate()) & 65535;
	const parts = [];
	const central = [];
	let offset = 0;
	for (const entry of entries) {
		const nameBytes = enc.encode(entry.name);
		const crc = crc32(entry.data);
		const size = entry.data.length;
		const local = new Uint8Array(new ArrayBuffer(30 + nameBytes.length));
		const lv = new DataView(local.buffer);
		lv.setUint32(0, 67324752, true);
		lv.setUint16(4, 20, true);
		lv.setUint16(6, 0, true);
		lv.setUint16(8, 0, true);
		lv.setUint16(10, dosTime, true);
		lv.setUint16(12, dosDate, true);
		lv.setUint32(14, crc, true);
		lv.setUint32(18, size, true);
		lv.setUint32(22, size, true);
		lv.setUint16(26, nameBytes.length, true);
		lv.setUint16(28, 0, true);
		local.set(nameBytes, 30);
		parts.push(local, entry.data);
		const cd = new Uint8Array(new ArrayBuffer(46 + nameBytes.length));
		const cv = new DataView(cd.buffer);
		cv.setUint32(0, 33639248, true);
		cv.setUint16(4, 20, true);
		cv.setUint16(6, 20, true);
		cv.setUint16(8, 0, true);
		cv.setUint16(10, 0, true);
		cv.setUint16(12, dosTime, true);
		cv.setUint16(14, dosDate, true);
		cv.setUint32(16, crc, true);
		cv.setUint32(20, size, true);
		cv.setUint32(24, size, true);
		cv.setUint16(28, nameBytes.length, true);
		cv.setUint16(30, 0, true);
		cv.setUint16(32, 0, true);
		cv.setUint16(34, 0, true);
		cv.setUint16(36, 0, true);
		cv.setUint32(38, 0, true);
		cv.setUint32(42, offset, true);
		cd.set(nameBytes, 46);
		central.push(cd);
		offset += local.length + size;
	}
	const centralSize = central.reduce((sum, c) => sum + c.length, 0);
	const eocd = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(22));
	const ev = new DataView(eocd.buffer);
	ev.setUint32(0, 101010256, true);
	ev.setUint16(4, 0, true);
	ev.setUint16(6, 0, true);
	ev.setUint16(8, entries.length, true);
	ev.setUint16(10, entries.length, true);
	ev.setUint32(12, centralSize, true);
	ev.setUint32(16, offset, true);
	ev.setUint16(20, 0, true);
	return new Blob([
		...parts,
		...central,
		eocd
	], { type: "application/zip" });
}
//#endregion
//#region src/views/acme/components/DownloadDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "dlg-list" };
//#endregion
//#region src/views/acme/components/DownloadDialog.vue
var DownloadDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DownloadDialog",
	props: {
		modelValue: { type: Boolean },
		cert: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const dialogVisible = computed({
			get: () => props.modelValue,
			set: (v) => emit("update:modelValue", v)
		});
		const downloading = ref(false);
		async function handleDownload(fileType) {
			const certId = props.cert?.acmeCertId;
			if (!certId) return;
			downloading.value = true;
			try {
				const { fileName, content } = await downloadCertFile(certId, fileType);
				const url = URL.createObjectURL(content);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				a.click();
				window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
				message.success("已开始下载");
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				downloading.value = false;
			}
		}
		/** 证书安全域名（通配符转 wildcard，避免文件名非法字符） */
		const safeDomain = computed(() => String(props.cert?.acmeCertPrimaryDomain ?? "certificate").replace(/\*/g, "wildcard"));
		/** 一键把证书/私钥/证书链打成一个 zip 下载 */
		async function handleDownloadAll() {
			const certId = props.cert?.acmeCertId;
			if (!certId) return;
			downloading.value = true;
			try {
				const [cert, key, chain] = await Promise.all([
					downloadCertFile(certId, "cert"),
					downloadCertFile(certId, "key"),
					downloadCertFile(certId, "chain")
				]);
				const bytes = async (b) => new Uint8Array(await b.arrayBuffer());
				const readme = [
					`域名: ${props.cert?.acmeCertPrimaryDomain ?? ""}`,
					"",
					"文件说明：",
					`  ${cert.fileName}  —— 证书（含中间证书的 PEM 链，Nginx ssl_certificate 用它）`,
					`  ${key.fileName}   —— 私钥（PEM，Nginx ssl_certificate_key 用它）`,
					`  ${chain.fileName} —— 证书链（含中间/根，用于需要完整链的场景）`,
					"",
					"用法（Nginx）：",
					"  ssl_certificate     /path/to/<域名>.crt;",
					"  ssl_certificate_key /path/to/<域名>.key;"
				].join("\n");
				const zip = createZip([
					{
						name: cert.fileName,
						data: await bytes(cert.content)
					},
					{
						name: key.fileName,
						data: await bytes(key.content)
					},
					{
						name: chain.fileName,
						data: await bytes(chain.content)
					},
					{
						name: "README.txt",
						data: new TextEncoder().encode(readme)
					}
				]);
				const url = URL.createObjectURL(zip);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${safeDomain.value}-certs.zip`;
				a.click();
				window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
				message.success("已开始下载");
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				downloading.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_dialog = resolveComponent("el-dialog");
			return openBlock(), createBlock(_component_el_dialog, {
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => dialogVisible.value = $event),
				title: "下载证书",
				width: "480px",
				"append-to-body": ""
			}, {
				footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[3] || (_cache[3] = ($event) => dialogVisible.value = false) }, {
					default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("关闭", -1)])]),
					_: 1
				}), createVNode(_component_el_button, {
					type: "primary",
					loading: downloading.value,
					onClick: handleDownloadAll
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, { style: { "margin-right": "4px" } }, {
						default: withCtx(() => [createVNode(unref(folder_opened_default))]),
						_: 1
					}), _cache[9] || (_cache[9] = createTextVNode("打包下载全部（zip） ", -1))]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "dlg-tip" }, "选择要下载的文件，证书链与私钥均为 PEM 格式。", -1)), createBaseVNode("div", _hoisted_1$1, [
					createBaseVNode("div", {
						class: "dlg-item",
						onClick: _cache[0] || (_cache[0] = ($event) => handleDownload("cert"))
					}, [
						createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(document_default))]),
							_: 1
						}),
						_cache[5] || (_cache[5] = createBaseVNode("div", { class: "dlg-main" }, [createBaseVNode("b", null, "证书文件"), createBaseVNode("span", null, "domain.crt，PEM 格式证书链")], -1)),
						createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(download_default))]),
							_: 1
						})
					]),
					createBaseVNode("div", {
						class: "dlg-item",
						onClick: _cache[1] || (_cache[1] = ($event) => handleDownload("key"))
					}, [
						createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(key_default))]),
							_: 1
						}),
						_cache[6] || (_cache[6] = createBaseVNode("div", { class: "dlg-main" }, [createBaseVNode("b", null, "私钥文件"), createBaseVNode("span", null, "domain.key，PEM 格式私钥")], -1)),
						createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(download_default))]),
							_: 1
						})
					]),
					createBaseVNode("div", {
						class: "dlg-item",
						onClick: _cache[2] || (_cache[2] = ($event) => handleDownload("chain"))
					}, [
						createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(link_default))]),
							_: 1
						}),
						_cache[7] || (_cache[7] = createBaseVNode("div", { class: "dlg-main" }, [createBaseVNode("b", null, "证书链文件"), createBaseVNode("span", null, "domain_chain.crt，含中间证书与根证书")], -1)),
						createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(download_default))]),
							_: 1
						})
					])
				])]),
				_: 1
			}, 8, ["modelValue"]);
		};
	}
}), [["__scopeId", "data-v-0d418b4e"]]);
//#endregion
//#region src/views/acme/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "acme-page" };
var _hoisted_2 = { class: "card acme-hero" };
var _hoisted_3 = { class: "page-header" };
var _hoisted_4 = { class: "page-actions" };
var _hoisted_5 = { class: "stats-row" };
var _hoisted_6 = { class: "stat-card" };
var _hoisted_7 = { class: "stat-num" };
var _hoisted_8 = { class: "stat-card" };
var _hoisted_9 = { class: "stat-num" };
var _hoisted_10 = { class: "stat-card" };
var _hoisted_11 = { class: "stat-num warn" };
var _hoisted_12 = { class: "stat-card" };
var _hoisted_13 = { class: "stat-num info" };
var _hoisted_14 = { class: "stat-card" };
var _hoisted_15 = { class: "stat-num danger" };
var _hoisted_16 = { class: "card acme-main" };
var _hoisted_17 = { class: "tabs" };
var _hoisted_18 = { class: "filter-bar" };
var _hoisted_19 = { class: "filter-count" };
var _hoisted_20 = {
	key: 0,
	class: "san-tip"
};
var _hoisted_21 = { class: "op-cell" };
var _hoisted_22 = { class: "filter-bar" };
var _hoisted_23 = { class: "filter-count" };
var _hoisted_24 = { class: "op-cell" };
//#endregion
//#region src/views/acme/index.vue
var acme_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "AcmeCertManagement",
	__name: "index",
	setup(__props) {
		const route = useRoute();
		const activeTab = ref("certs");
		const certRows = ref([]);
		const certTotal = ref(0);
		const certPage = ref(1);
		const certPageSize = ref(20);
		const certLoading = ref(false);
		const accountRows = ref([]);
		const accountTotal = ref(0);
		const accountPage = ref(1);
		const accountPageSize = ref(20);
		const accountLoading = ref(false);
		const stats = ref({
			accountCount: 0,
			certCount: 0,
			validCount: 0,
			pendingCount: 0,
			expiringCount: 0,
			expiredCount: 0,
			revokedCount: 0,
			failedCount: 0
		});
		const filters = reactive({
			keyword: "",
			status: ""
		});
		const applyVisible = ref(false);
		const applyInit = ref(null);
		const hostPrefill = ref(null);
		const accountDialogVisible = ref(false);
		const currentAccount = ref(null);
		const detailVisible = ref(false);
		const currentCertId = ref(null);
		const downloadVisible = ref(false);
		const currentCert = ref(null);
		const renewingId = ref(null);
		const retryingId = ref(null);
		const renewCheckLoading = ref(false);
		async function loadStats() {
			try {
				const d = await getCertStats();
				stats.value = {
					...stats.value,
					...d ?? {}
				};
			} catch {}
		}
		async function loadCerts() {
			certLoading.value = true;
			try {
				const d = await getCertPage({
					page: certPage.value,
					pageSize: certPageSize.value,
					acmeCertPrimaryDomain: filters.keyword || void 0,
					acmeCertStatus: filters.status || void 0
				});
				certRows.value = d?.records ?? [];
				certTotal.value = Number(d?.total ?? 0);
			} catch (e) {
				message.error(`证书列表加载失败：${String(e?.message ?? e)}`);
				certRows.value = [];
				certTotal.value = 0;
			} finally {
				certLoading.value = false;
			}
		}
		async function loadAccounts() {
			accountLoading.value = true;
			try {
				const d = await getAccountPage({
					page: accountPage.value,
					pageSize: accountPageSize.value
				});
				accountRows.value = d?.records ?? [];
				accountTotal.value = Number(d?.total ?? 0);
			} catch (e) {
				message.error(`账户列表加载失败：${String(e?.message ?? e)}`);
				accountRows.value = [];
				accountTotal.value = 0;
			} finally {
				accountLoading.value = false;
			}
		}
		function searchCerts() {
			certPage.value = 1;
			loadCerts();
		}
		function resetSearch() {
			filters.keyword = "";
			filters.status = "";
			certPage.value = 1;
			loadCerts();
		}
		watch(activeTab, (tab) => {
			if (tab === "certs") loadCerts();
			else loadAccounts();
		});
		watch(certPage, () => void loadCerts());
		watch(certPageSize, () => {
			certPage.value = 1;
			loadCerts();
		});
		watch(accountPage, () => void loadAccounts());
		watch(accountPageSize, () => {
			accountPage.value = 1;
			loadAccounts();
		});
		onMounted(() => {
			loadStats();
			loadCerts();
			const q = route.query;
			const domain = String(q.domain ?? q.host ?? "");
			if (domain) {
				hostPrefill.value = {
					hostId: q.hostId ? Number(q.hostId) : void 0,
					hostName: String(q.hostName ?? ""),
					domain,
					port: q.port ? Number(q.port) : void 0,
					username: String(q.username ?? "")
				};
				if (String(q.autoApply ?? "") === "1") applyVisible.value = true;
			}
		});
		function openApply(row) {
			applyInit.value = row ?? null;
			applyVisible.value = true;
		}
		function handleApplySuccess() {
			loadStats();
			loadCerts();
		}
		function viewCert(certId) {
			currentCertId.value = certId;
			detailVisible.value = true;
		}
		function openDownload(row) {
			currentCert.value = row;
			downloadVisible.value = true;
		}
		async function confirmRenew(row) {
			try {
				await ElMessageBox.confirm(`确定续签证书「${row.acmeCertPrimaryDomain}」？`, "续签确认", {
					confirmButtonText: "续签",
					type: "warning"
				});
			} catch {
				return;
			}
			renewingId.value = row.acmeCertId ?? null;
			try {
				await renewCert(Number(row.acmeCertId));
				message.success("续签请求已受理");
				await loadCerts();
				await loadStats();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				renewingId.value = null;
			}
		}
		async function confirmRetry(row) {
			retryingId.value = row.acmeCertId ?? null;
			try {
				await retryValidation(Number(row.acmeCertId));
				message.success("已重新触发验证");
				await loadCerts();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				retryingId.value = null;
			}
		}
		async function confirmRevoke(row) {
			try {
				await ElMessageBox.confirm(`确定吊销证书「${row.acmeCertPrimaryDomain}」？该操作不可恢复。`, "吊销确认", {
					confirmButtonText: "吊销",
					type: "error"
				});
			} catch {
				return;
			}
			try {
				await revokeCert(Number(row.acmeCertId));
				message.success("证书已吊销");
				await loadCerts();
				await loadStats();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		async function confirmDelete(row) {
			try {
				await ElMessageBox.confirm(`确定删除证书「${row.acmeCertPrimaryDomain}」？关联订单会一并删除。`, "删除确认", {
					confirmButtonText: "删除",
					type: "error"
				});
			} catch {
				return;
			}
			try {
				await deleteCert(Number(row.acmeCertId));
				message.success("证书已删除");
				await loadCerts();
				await loadStats();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		async function renewCheckAll() {
			renewCheckLoading.value = true;
			try {
				const msg = await triggerRenewCheck();
				message.success(msg || "续签检查已触发");
				await loadCerts();
				await loadStats();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				renewCheckLoading.value = false;
			}
		}
		function addAccount() {
			currentAccount.value = null;
			accountDialogVisible.value = true;
		}
		function editAccount(row) {
			currentAccount.value = { ...row };
			accountDialogVisible.value = true;
		}
		function handleAccountSuccess() {
			loadStats();
			loadAccounts();
		}
		async function confirmDeleteAccount(row) {
			try {
				await ElMessageBox.confirm(`确定删除账户「${row.acmeAccountEmail}」？存在关联证书时后端会拒绝。`, "删除确认", {
					confirmButtonText: "删除",
					type: "warning"
				});
			} catch {
				return;
			}
			try {
				await deleteAccount(Number(row.acmeAccountId));
				message.success("账户已删除");
				await loadAccounts();
				await loadStats();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		const certColumns = computed(() => [
			{
				prop: "acmeCertPrimaryDomain",
				label: "主域名",
				minWidth: 200,
				slot: "domain"
			},
			{
				prop: "acmeCertChallengeType",
				label: "验证方式",
				width: 120,
				slot: "challenge"
			},
			{
				prop: "acmeCertStatus",
				label: "状态",
				width: 120,
				slot: "status"
			},
			{
				prop: "acmeCertNotBefore",
				label: "有效起",
				width: 170
			},
			{
				prop: "acmeCertNotAfter",
				label: "有效止",
				width: 170
			},
			{
				prop: "acmeCertSan",
				label: "SAN",
				minWidth: 140
			},
			{
				prop: "id",
				label: "操作",
				width: 300,
				fixed: "right",
				slot: "actions"
			}
		]);
		const certTableData = computed(() => certRows.value);
		const accountColumns = computed(() => [
			{
				prop: "acmeAccountEmail",
				label: "邮箱",
				minWidth: 220
			},
			{
				prop: "acmeAccountServer",
				label: "ACME 服务商",
				minWidth: 220,
				slot: "server"
			},
			{
				prop: "acmeAccountStatus",
				label: "状态",
				width: 120,
				slot: "status"
			},
			{
				prop: "updateTime",
				label: "更新时间",
				width: 170
			},
			{
				prop: "acmeAccountRemark",
				label: "备注",
				minWidth: 160
			},
			{
				prop: "op",
				label: "操作",
				width: 150,
				fixed: "right",
				slot: "ops"
			}
		]);
		const accountTableData = computed(() => accountRows.value);
		return (_ctx, _cache) => {
			const _component_el_button = resolveComponent("el-button");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			const _component_ReTable = resolveComponent("ReTable");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [_cache[16] || (_cache[16] = createBaseVNode("div", null, [createBaseVNode("h1", { class: "page-title" }, "ACME 证书"), createBaseVNode("p", { class: "page-desc" }, "账户 · 申请 · 续签 · 验证 · 吊销 · 下载")], -1)), createBaseVNode("div", _hoisted_4, [
					createVNode(_component_el_button, {
						loading: renewCheckLoading.value,
						onClick: renewCheckAll
					}, {
						default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("续签检查", -1)])]),
						_: 1
					}, 8, ["loading"]),
					createVNode(_component_el_button, { onClick: addAccount }, {
						default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("添加账户", -1)])]),
						_: 1
					}),
					createVNode(_component_el_button, {
						type: "primary",
						onClick: _cache[0] || (_cache[0] = ($event) => openApply())
					}, {
						default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("申请证书", -1)])]),
						_: 1
					})
				])])]),
				createBaseVNode("div", _hoisted_5, [
					createBaseVNode("div", _hoisted_6, [createBaseVNode("div", _hoisted_7, toDisplayString(stats.value.accountCount), 1), _cache[17] || (_cache[17] = createBaseVNode("div", { class: "stat-label" }, "ACME 账户", -1))]),
					createBaseVNode("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, toDisplayString(stats.value.validCount), 1), _cache[18] || (_cache[18] = createBaseVNode("div", { class: "stat-label" }, "有效证书", -1))]),
					createBaseVNode("div", _hoisted_10, [createBaseVNode("div", _hoisted_11, toDisplayString(stats.value.expiringCount), 1), _cache[19] || (_cache[19] = createBaseVNode("div", { class: "stat-label" }, "即将到期", -1))]),
					createBaseVNode("div", _hoisted_12, [createBaseVNode("div", _hoisted_13, toDisplayString(stats.value.pendingCount), 1), _cache[20] || (_cache[20] = createBaseVNode("div", { class: "stat-label" }, "处理中", -1))]),
					createBaseVNode("div", _hoisted_14, [createBaseVNode("div", _hoisted_15, toDisplayString(stats.value.expiredCount), 1), _cache[21] || (_cache[21] = createBaseVNode("div", { class: "stat-label" }, "已过期", -1))])
				]),
				createBaseVNode("div", _hoisted_16, [createBaseVNode("div", _hoisted_17, [createBaseVNode("button", {
					class: normalizeClass(["tab-btn", { active: activeTab.value === "certs" }]),
					onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "certs")
				}, "证书管理", 2), createBaseVNode("button", {
					class: normalizeClass(["tab-btn", { active: activeTab.value === "accounts" }]),
					onClick: _cache[2] || (_cache[2] = ($event) => activeTab.value = "accounts")
				}, "账户管理", 2)]), activeTab.value === "certs" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_18, [
					createVNode(_component_el_input, {
						modelValue: filters.keyword,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => filters.keyword = $event),
						placeholder: "主域名",
						clearable: "",
						style: { "width": "260px" },
						onKeyup: withKeys(searchCerts, ["enter"]),
						onClear: searchCerts
					}, null, 8, ["modelValue"]),
					createVNode(_component_el_select, {
						modelValue: filters.status,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => filters.status = $event),
						placeholder: "全部状态",
						clearable: "",
						style: { "width": "140px" },
						onChange: searchCerts
					}, {
						default: withCtx(() => [
							createVNode(_component_el_option, {
								label: "待处理",
								value: "pending"
							}),
							createVNode(_component_el_option, {
								label: "验证中",
								value: "validating"
							}),
							createVNode(_component_el_option, {
								label: "有效",
								value: "valid"
							}),
							createVNode(_component_el_option, {
								label: "已过期",
								value: "expired"
							}),
							createVNode(_component_el_option, {
								label: "已吊销",
								value: "revoked"
							}),
							createVNode(_component_el_option, {
								label: "失败",
								value: "failed"
							})
						]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(_component_el_button, {
						type: "primary",
						onClick: searchCerts
					}, {
						default: withCtx(() => [..._cache[22] || (_cache[22] = [createTextVNode("查询", -1)])]),
						_: 1
					}),
					createVNode(_component_el_button, { onClick: resetSearch }, {
						default: withCtx(() => [..._cache[23] || (_cache[23] = [createTextVNode("重置", -1)])]),
						_: 1
					}),
					createVNode(_component_el_button, {
						loading: certLoading.value,
						circle: "",
						onClick: loadCerts
					}, {
						default: withCtx(() => [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(refresh_default))]),
							_: 1
						})]),
						_: 1
					}, 8, ["loading"]),
					createBaseVNode("span", _hoisted_19, "共 " + toDisplayString(certTotal.value) + " 条", 1)
				]), createVNode(_component_ReTable, {
					data: certTableData.value,
					columns: certColumns.value,
					loading: certLoading.value,
					total: certTotal.value,
					page: certPage.value,
					"page-size": certPageSize.value,
					"page-sizes": [
						20,
						50,
						100
					],
					"server-data": "",
					"row-key": "acmeCertId",
					border: "",
					style: { "width": "100%" },
					"empty-text": "暂无证书",
					toolbar: false,
					"onUpdate:page": _cache[5] || (_cache[5] = ($event) => certPage.value = $event),
					"onUpdate:pageSize": _cache[6] || (_cache[6] = ($event) => certPageSize.value = $event)
				}, {
					"col-domain": withCtx(({ row }) => [createBaseVNode("b", null, toDisplayString(row.acmeCertPrimaryDomain), 1), row.acmeCertSan ? (openBlock(), createElementBlock("div", _hoisted_20, "+" + toDisplayString(String(row.acmeCertSan).split(",").filter(Boolean).length) + " 个 SAN", 1)) : createCommentVNode("", true)]),
					"col-challenge": withCtx(({ row }) => [createVNode(_component_el_tag, {
						effect: "plain",
						type: row.acmeCertChallengeType === "DNS-01" ? "success" : "primary"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(row.acmeCertChallengeType), 1)]),
						_: 2
					}, 1032, ["type"])]),
					"col-status": withCtx(({ row }) => [row.acmeCertStatus === "failed" && row.acmeCertLastError ? (openBlock(), createBlock(_component_el_tooltip, {
						key: 0,
						content: row.acmeCertLastError,
						placement: "top"
					}, {
						default: withCtx(() => [createVNode(_component_el_tag, {
							type: unref(certStatusInfo)(row.acmeCertStatus).type,
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(unref(certStatusInfo)(row.acmeCertStatus).label), 1)]),
							_: 2
						}, 1032, ["type"])]),
						_: 2
					}, 1032, ["content"])) : (openBlock(), createBlock(_component_el_tag, {
						key: 1,
						type: unref(certStatusInfo)(row.acmeCertStatus).type,
						effect: "plain"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(unref(certStatusInfo)(row.acmeCertStatus).label), 1)]),
						_: 2
					}, 1032, ["type"]))]),
					"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_21, [
						createVNode(_component_el_button, {
							size: "small",
							onClick: ($event) => viewCert(Number(row.acmeCertId))
						}, {
							default: withCtx(() => [..._cache[24] || (_cache[24] = [createTextVNode("详情", -1)])]),
							_: 1
						}, 8, ["onClick"]),
						createVNode(_component_el_button, {
							size: "small",
							loading: renewingId.value === row.acmeCertId,
							onClick: ($event) => confirmRenew(row)
						}, {
							default: withCtx(() => [..._cache[25] || (_cache[25] = [createTextVNode("续签", -1)])]),
							_: 1
						}, 8, ["loading", "onClick"]),
						row.acmeCertStatus === "validating" ? (openBlock(), createBlock(_component_el_button, {
							key: 0,
							size: "small",
							loading: retryingId.value === row.acmeCertId,
							type: "warning",
							plain: "",
							onClick: ($event) => confirmRetry(row)
						}, {
							default: withCtx(() => [..._cache[26] || (_cache[26] = [createTextVNode("重新验证", -1)])]),
							_: 1
						}, 8, ["loading", "onClick"])) : createCommentVNode("", true),
						createVNode(_component_el_button, {
							size: "small",
							onClick: ($event) => openDownload(row)
						}, {
							default: withCtx(() => [..._cache[27] || (_cache[27] = [createTextVNode("下载", -1)])]),
							_: 1
						}, 8, ["onClick"]),
						createVNode(_component_el_button, {
							size: "small",
							type: "danger",
							plain: "",
							onClick: ($event) => confirmRevoke(row)
						}, {
							default: withCtx(() => [..._cache[28] || (_cache[28] = [createTextVNode("吊销", -1)])]),
							_: 1
						}, 8, ["onClick"]),
						createVNode(_component_el_button, {
							size: "small",
							type: "danger",
							onClick: ($event) => confirmDelete(row)
						}, {
							default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("删除", -1)])]),
							_: 1
						}, 8, ["onClick"])
					])]),
					_: 1
				}, 8, [
					"data",
					"columns",
					"loading",
					"total",
					"page",
					"page-size"
				])], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("div", _hoisted_22, [createVNode(_component_el_button, {
					loading: accountLoading.value,
					circle: "",
					onClick: loadAccounts
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(refresh_default))]),
						_: 1
					})]),
					_: 1
				}, 8, ["loading"]), createBaseVNode("span", _hoisted_23, "共 " + toDisplayString(accountTotal.value) + " 条", 1)]), createVNode(_component_ReTable, {
					data: accountTableData.value,
					columns: accountColumns.value,
					loading: accountLoading.value,
					total: accountTotal.value,
					page: accountPage.value,
					"page-size": accountPageSize.value,
					"page-sizes": [
						20,
						50,
						100
					],
					"server-data": "",
					"row-key": "acmeAccountId",
					border: "",
					style: { "width": "100%" },
					"empty-text": "暂无账户",
					toolbar: false,
					"onUpdate:page": _cache[7] || (_cache[7] = ($event) => accountPage.value = $event),
					"onUpdate:pageSize": _cache[8] || (_cache[8] = ($event) => accountPageSize.value = $event)
				}, {
					"col-server": withCtx(({ row }) => [createTextVNode(toDisplayString(unref(serverLabel)(row.acmeAccountServer)), 1)]),
					"col-status": withCtx(({ row }) => [createVNode(_component_el_tag, {
						type: unref(accountStatusInfo)(row.acmeAccountStatus).type,
						effect: "plain"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(unref(accountStatusInfo)(row.acmeAccountStatus).label), 1)]),
						_: 2
					}, 1032, ["type"])]),
					"col-ops": withCtx(({ row }) => [createBaseVNode("div", _hoisted_24, [createVNode(_component_el_button, {
						size: "small",
						onClick: ($event) => editAccount(row)
					}, {
						default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("编辑", -1)])]),
						_: 1
					}, 8, ["onClick"]), createVNode(_component_el_button, {
						size: "small",
						type: "danger",
						onClick: ($event) => confirmDeleteAccount(row)
					}, {
						default: withCtx(() => [..._cache[31] || (_cache[31] = [createTextVNode("删除", -1)])]),
						_: 1
					}, 8, ["onClick"])])]),
					_: 1
				}, 8, [
					"data",
					"columns",
					"loading",
					"total",
					"page",
					"page-size"
				])], 64))]),
				createVNode(ApplyCertDialog_default, {
					modelValue: applyVisible.value,
					"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => applyVisible.value = $event),
					"init-data": applyInit.value,
					host: hostPrefill.value,
					onSuccess: handleApplySuccess,
					onViewCert: viewCert
				}, null, 8, [
					"modelValue",
					"init-data",
					"host"
				]),
				createVNode(AccountDialog_default, {
					modelValue: accountDialogVisible.value,
					"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => accountDialogVisible.value = $event),
					account: currentAccount.value,
					onSuccess: handleAccountSuccess
				}, null, 8, ["modelValue", "account"]),
				createVNode(CertDetailDialog_default, {
					modelValue: detailVisible.value,
					"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => detailVisible.value = $event),
					"cert-id": currentCertId.value
				}, null, 8, ["modelValue", "cert-id"]),
				createVNode(DownloadDialog_default, {
					modelValue: downloadVisible.value,
					"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => downloadVisible.value = $event),
					cert: currentCert.value
				}, null, 8, ["modelValue", "cert"])
			]);
		};
	}
}), [["__scopeId", "data-v-83dd2cb1"]]);
//#endregion
export { acme_default as default };
