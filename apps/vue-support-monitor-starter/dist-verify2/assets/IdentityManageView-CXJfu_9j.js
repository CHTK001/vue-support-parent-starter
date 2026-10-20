import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { D as connection_default, E as collection_default, Ot as postcard_default, an as user_default, ft as lock_default, nn as unlock_default, st as key_default, vt as monitor_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as useDialogPrerender } from "./dialogPrerender-D19FeHAd.js";
import { D as listBoundIdentities, F as saveKey, J as unbindIdentity, N as saveIdentity, O as listMailbox, S as getMailboxMessage, k as queryHosts, l as delKey, p as generateKeyPair, s as delIdentity, t as bindIdentity, x as getKeys, y as getIdentities } from "./api-CRz4q4qT.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { t as component } from "./ReStatCard-BGjVHdD2.js";
//#region src/views/IdentityManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "im tel-page" };
var _hoisted_2 = { class: "tabs" };
var _hoisted_3 = { class: "im-kpis" };
var _hoisted_4 = { class: "card im-card" };
var _hoisted_5 = { class: "im-toolbar" };
var _hoisted_6 = { class: "im-toolbar__meta" };
var _hoisted_7 = { class: "im-ops" };
var _hoisted_8 = {
	key: 0,
	class: "mono dim"
};
var _hoisted_9 = {
	key: 1,
	class: "dim"
};
var _hoisted_10 = ["onClick"];
var _hoisted_11 = {
	key: 0,
	class: "host-preview dim"
};
var _hoisted_12 = { key: 0 };
var _hoisted_13 = {
	key: 1,
	class: "dim"
};
var _hoisted_14 = { class: "op-cell" };
var _hoisted_15 = {
	key: 0,
	class: "sel-bar"
};
var _hoisted_16 = { class: "im-kpis" };
var _hoisted_17 = { class: "card im-card" };
var _hoisted_18 = { class: "im-toolbar" };
var _hoisted_19 = { class: "im-toolbar__meta im-toolbar__meta--only" };
var _hoisted_20 = { class: "im-ops" };
var _hoisted_21 = { class: "mono dim" };
var _hoisted_22 = { class: "op-cell" };
var _hoisted_23 = {
	key: 0,
	class: "dim",
	style: {
		"padding": "20px 0",
		"text-align": "center"
	}
};
var _hoisted_24 = {
	class: "muted",
	style: { "margin-bottom": "8px" }
};
var _hoisted_25 = {
	key: 0,
	class: "host-chips"
};
var _hoisted_26 = { class: "mono dim" };
var _hoisted_27 = {
	key: 1,
	class: "dim",
	style: { "padding": "8px 0" }
};
var _hoisted_28 = {
	class: "muted",
	style: { "margin": "14px 0 8px" }
};
var _hoisted_29 = {
	key: 2,
	class: "host-chips"
};
var _hoisted_30 = { class: "mono dim" };
var _hoisted_31 = {
	key: 3,
	class: "dim",
	style: { "padding": "8px 0" }
};
var _hoisted_32 = {
	key: 0,
	class: "mail-loading"
};
var _hoisted_33 = {
	key: 0,
	class: "mail-layout"
};
var _hoisted_34 = { class: "mail-side" };
var _hoisted_35 = { class: "mail-side-header" };
var _hoisted_36 = { class: "mail-side-count" };
var _hoisted_37 = { class: "mail-list" };
var _hoisted_38 = ["onClick"];
var _hoisted_39 = { class: "mail-item-top" };
var _hoisted_40 = { class: "mail-avatar" };
var _hoisted_41 = { class: "mail-from mono" };
var _hoisted_42 = { class: "mail-date dim" };
var _hoisted_43 = { class: "mail-subject" };
var _hoisted_44 = {
	key: 0,
	class: "mail-snippet dim"
};
var _hoisted_45 = { class: "mail-pane" };
var _hoisted_46 = { class: "mail-pane-header" };
var _hoisted_47 = { class: "mail-pane-subject" };
var _hoisted_48 = { class: "mail-pane-meta" };
var _hoisted_49 = { class: "mono" };
var _hoisted_50 = { class: "mail-pane-meta" };
var _hoisted_51 = { class: "mono" };
var _hoisted_52 = {
	key: 0,
	class: "mail-pane-meta"
};
var _hoisted_53 = { class: "mono" };
var _hoisted_54 = { class: "mail-body" };
var _hoisted_55 = { key: 0 };
var _hoisted_56 = {
	key: 1,
	class: "dim"
};
var _hoisted_57 = { class: "mail-pane-foot" };
var _hoisted_58 = {
	key: 1,
	class: "mail-pane-empty"
};
var _hoisted_59 = {
	key: 1,
	class: "mail-empty"
};
//#endregion
//#region src/views/IdentityManageView.vue
var IdentityManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "IdentityManageView",
	setup(__props) {
		/**
		* 账号管理 —— 登录身份（账号密码 / SSH 私钥 / 邮箱 / Token 等）统一维护
		* 数据源：@pages/server 身份接口（getIdentities / saveIdentity / delIdentity）
		* 主机连接 / 编辑时从该列表选择身份
		*
		* 视觉（对齐「代理管理」页）：顶部 hero 已删除——页面标题由外壳面包屑承担，
		* hero 上的「导出 / 刷新」与分区头里的操作按钮合并到筛选行右侧，统一改成
		* 图标 + tip（ReButton square 布局自带 el-tooltip），单行内完成筛选与全部操作。
		* 每个 tab 一排 ReStatCard 统计卡（紧凑档横排），下方卡片吃满剩余高度、
		* 表体内部滚动。
		*
		* 说明：筛选是前端实时计算（{@code filteredList} + ReFilter 的 @change），
		* 没有服务端查询，所以不设「查询」按钮——加一个点了不起的按钮比不加更糟。
		*
		* @author CH
		* @since 4.0.0
		*/
		const tab = ref("identity");
		/** 公钥指纹（取 SHA256 前 16 位，便于识别） */
		function keyFingerprint(pub) {
			if (!pub) return "";
			try {
				const raw = Uint8Array.from(pub, (c) => c.charCodeAt(0));
				return Array.from(raw.slice(0, 16)).map((b) => b.toString(16).padStart(2, "0")).join(":");
			} catch {
				return pub.slice(0, 16);
			}
		}
		function keyTypeLabel(t) {
			return t ? t.toUpperCase() : "RSA";
		}
		const columns = [
			{
				prop: "msServerIdentityName",
				label: "名称",
				minWidth: 140
			},
			{
				prop: "auth",
				label: "类型",
				width: 130,
				slot: "auth"
			},
			{
				prop: "msServerIdentityUsername",
				label: "登录用户",
				minWidth: 140
			},
			{
				prop: "key",
				label: "密钥",
				width: 130,
				slot: "key"
			},
			{
				prop: "hosts",
				label: "绑定主机",
				width: 120,
				slot: "hosts"
			},
			{
				prop: "msServerIdentityRemark",
				label: "备注",
				minWidth: 140
			},
			{
				prop: "id",
				label: "操作",
				width: 220,
				slot: "actions",
				align: "right",
				fixed: "right"
			}
		];
		const keyColumns = [
			{
				prop: "msServerKeyName",
				label: "名称",
				minWidth: 160
			},
			{
				prop: "type",
				label: "类型",
				width: 90,
				slot: "type"
			},
			{
				prop: "fp",
				label: "公钥指纹",
				minWidth: 180,
				slot: "fp"
			},
			{
				prop: "msServerKeyRemark",
				label: "备注",
				minWidth: 140
			},
			{
				prop: "id",
				label: "操作",
				width: 120,
				slot: "actions",
				align: "right",
				fixed: "right"
			}
		];
		const list = ref([]);
		const keys = ref([]);
		const hosts = ref([]);
		/** 绑定关系缓存：identityId → hostId[] */
		const bindCache = ref({});
		const loading = ref(false);
		const selection = ref([]);
		ref(1);
		const pageSize = ref(10);
		async function load() {
			loading.value = true;
			try {
				const [idList, keyList, hostList] = await Promise.all([
					getIdentities(),
					getKeys().catch(() => []),
					queryHosts().catch(() => [])
				]);
				list.value = idList ?? [];
				keys.value = keyList ?? [];
				hosts.value = hostList ?? [];
				const map = {};
				try {
					const results = await Promise.all((hostList ?? []).map(async (h) => {
						try {
							const ids = await listBoundIdentities(h.id) ?? [];
							return {
								hostId: h.id,
								identityIds: ids
							};
						} catch {
							return {
								hostId: h.id,
								identityIds: []
							};
						}
					}));
					for (const r of results) for (const id of r.identityIds) (map[id] ??= []).push(r.hostId);
				} catch {}
				bindCache.value = map;
			} catch (e) {
				message.error(`加载失败: ${String(e?.message ?? e)}`);
			} finally {
				loading.value = false;
			}
		}
		onMounted(load);
		/** 身份绑定的主机列表 */
		function boundHostsOf(identityId) {
			return (bindCache.value[identityId] ?? []).map((id) => hosts.value.find((h) => h.id === id)).filter(Boolean);
		}
		function boundHostCountOf(identityId) {
			return (bindCache.value[identityId] ?? []).length;
		}
		/** 密钥名映射（PUBLIC_KEY 引用 msServerKeyId → 密钥库名称） */
		function keyNameOf(i) {
			if (i.msServerIdentityAuthType !== "PUBLIC_KEY" || i.msServerIdentityKeyId == null) return "";
			return keys.value.find((k) => k.id === i.msServerIdentityKeyId)?.msServerKeyName ?? `#${i.msServerIdentityKeyId}`;
		}
		const keyLoading = ref(false);
		ref([]);
		const keyFormVisible = ref(false);
		useDialogPrerender(keyFormVisible);
		const keySaving = ref(false);
		const editingKeyId = ref(null);
		const isGenerateKey = ref(false);
		const keyForm = ref({
			msServerKeyName: "",
			msServerKeyType: "RSA",
			msServerKeyPublicKey: "",
			msServerKeyPrivateKey: "",
			msServerKeyPassword: "",
			msServerKeyRemark: ""
		});
		const KEY_TYPE_OPTIONS = [
			{
				label: "RSA (4096位)",
				value: "RSA"
			},
			{
				label: "ED25519",
				value: "ED25519"
			},
			{
				label: "ECDSA (P-256)",
				value: "ECDSA"
			}
		];
		async function loadKeys() {
			keyLoading.value = true;
			try {
				keys.value = await getKeys() ?? [];
			} catch (e) {
				message.error(`密钥加载失败: ${String(e?.message ?? e)}`);
			} finally {
				keyLoading.value = false;
			}
		}
		function openKeyAdd() {
			editingKeyId.value = null;
			isGenerateKey.value = true;
			keyForm.value = {
				msServerKeyName: "",
				msServerKeyType: "RSA",
				msServerKeyPublicKey: "",
				msServerKeyPrivateKey: "",
				msServerKeyPassword: "",
				msServerKeyRemark: ""
			};
			keyFormVisible.value = true;
		}
		function openKeyManual() {
			editingKeyId.value = null;
			isGenerateKey.value = false;
			keyForm.value = {
				msServerKeyName: "",
				msServerKeyType: "RSA",
				msServerKeyPublicKey: "",
				msServerKeyPrivateKey: "",
				msServerKeyPassword: "",
				msServerKeyRemark: ""
			};
			keyFormVisible.value = true;
		}
		function openKeyEdit(row) {
			editingKeyId.value = row.id;
			isGenerateKey.value = false;
			keyForm.value = {
				msServerKeyName: row.msServerKeyName,
				msServerKeyType: row.msServerKeyType || "RSA",
				msServerKeyPublicKey: row.msServerKeyPublicKey ?? "",
				msServerKeyPrivateKey: "",
				msServerKeyPassword: "",
				msServerKeyRemark: row.msServerKeyRemark ?? ""
			};
			keyFormVisible.value = true;
		}
		async function submitKey() {
			if (!keyForm.value.msServerKeyName?.trim()) {
				message.warning("请输入密钥名称");
				return;
			}
			keySaving.value = true;
			try {
				await saveKey(editingKeyId.value, {
					msServerKeyName: keyForm.value.msServerKeyName.trim(),
					msServerKeyType: keyForm.value.msServerKeyType,
					msServerKeyPublicKey: keyForm.value.msServerKeyPublicKey || void 0,
					msServerKeyPrivateKey: keyForm.value.msServerKeyPrivateKey || void 0,
					msServerKeyPassword: keyForm.value.msServerKeyPassword || void 0,
					msServerKeyRemark: keyForm.value.msServerKeyRemark
				});
				message.success(editingKeyId.value != null ? "密钥已更新" : "密钥已创建");
				keyFormVisible.value = false;
				await loadKeys();
				await load();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				keySaving.value = false;
			}
		}
		async function removeKey(row) {
			await ElMessageBox.confirm(`删除密钥「${row.msServerKeyName}」？被引用的身份将受影响`, "删除确认", { type: "warning" });
			try {
				await delKey(row.id);
				message.success("已删除");
				await loadKeys();
				await load();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		/** 生成密钥对 */
		async function generateKey() {
			if (!keyForm.value.msServerKeyName?.trim()) {
				message.warning("请输入密钥名称");
				return;
			}
			keySaving.value = true;
			try {
				await generateKeyPair(keyForm.value.msServerKeyName.trim(), keyForm.value.msServerKeyType, keyForm.value.msServerKeyPassword || void 0, keyForm.value.msServerKeyRemark);
				message.success("密钥对已生成并保存");
				keyFormVisible.value = false;
				await loadKeys();
			} catch (e) {
				message.error(`生成失败: ${String(e?.message ?? e)}`);
			} finally {
				keySaving.value = false;
			}
		}
		async function remove(i) {
			await ElMessageBox.confirm(`删除身份「${i.msServerIdentityName}」？`, "删除确认", { type: "warning" });
			try {
				await delIdentity(i.id);
				message.success("已删除");
				await load();
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		const bindVisible = ref(false);
		const bindTarget = ref(null);
		const bindLoading = ref(false);
		const bindHosts = ref([]);
		const bindAllHosts = ref([]);
		async function openBind(row) {
			bindTarget.value = row;
			bindVisible.value = true;
			bindLoading.value = true;
			bindHosts.value = boundHostsOf(row.id);
			const bound = new Set(boundHostsOf(row.id).map((h) => h.id));
			bindAllHosts.value = hosts.value.filter((h) => !bound.has(h.id));
			bindLoading.value = false;
		}
		async function doBind(hostId) {
			if (!bindTarget.value) return;
			try {
				await bindIdentity(hostId, bindTarget.value.id);
				message.success("已绑定");
				await openBind(bindTarget.value);
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		async function doUnbind(hostId) {
			if (!bindTarget.value) return;
			try {
				await unbindIdentity(hostId, bindTarget.value.id);
				message.success("已解绑");
				await openBind(bindTarget.value);
			} catch (e) {
				message.error(String(e?.message ?? e));
			}
		}
		const mailVisible = ref(false);
		const mailTarget = ref(null);
		const mailLoading = ref(false);
		const mails = ref([]);
		const activeMailIndex = ref(-1);
		const activeMail = computed(() => activeMailIndex.value >= 0 ? mails.value[activeMailIndex.value] : null);
		/** 发件人短名（取 <...> 前或前 20 字符） */
		function mailFromShort(from) {
			if (!from) return "未知发件人";
			return (from.match(/^([^<@]+@[^>]+)/)?.[1] ?? from).slice(0, 22);
		}
		/** 日期格式化 */
		function formatMailDate(d) {
			if (!d) return "";
			return d.slice(0, 16).replace("T", " ");
		}
		/** 大小格式化 */
		function formatSize(n) {
			if (n == null) return "—";
			if (n < 1024) return `${n} B`;
			if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
			return `${(n / 1024 / 1024).toFixed(1)} MB`;
		}
		async function openMail(row) {
			mailTarget.value = row;
			mailVisible.value = true;
			activeMailIndex.value = -1;
			mailLoading.value = true;
			try {
				const list = await listMailbox(row.id, "INBOX", 20) ?? [];
				mails.value = list;
			} catch (e) {
				mails.value = [];
				message.error(`加载邮件失败: ${String(e?.message ?? e)}`);
			} finally {
				mailLoading.value = false;
			}
		}
		/** 选中邮件并加载详情 */
		async function selectMail(m, idx) {
			activeMailIndex.value = idx;
			if (!mailTarget.value) return;
			try {
				const d = await getMailboxMessage(mailTarget.value.id, "INBOX", m.subject);
				const detail = typeof d === "string" ? d : JSON.stringify(d ?? "", null, 2);
				mails.value[idx] = {
					...mails.value[idx],
					content: detail
				};
				if (activeMailIndex.value === idx) mails.value = [...mails.value];
			} catch (e) {
				mails.value[idx] = {
					...mails.value[idx],
					content: `读取邮件内容失败: ${String(e?.message ?? e)}`
				};
				mails.value = [...mails.value];
			}
		}
		/**
		* 下载密钥公钥。
		*
		* <p>后端 {@code ServerCredentialController} 约定「私钥、口令永不出现在响应体中」，
		* 私钥仅加密留存于密钥库，因此此处只支持公钥导出。
		*
		* @param row 密钥行
		*/
		function downloadPublicKey(row) {
			const content = row.msServerKeyPublicKey ?? "";
			if (!content) {
				message.warning("该密钥暂无公钥内容");
				return;
			}
			const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `${row.msServerKeyName}.pub`;
			a.click();
			URL.revokeObjectURL(a.href);
		}
		/** 批量删除（ReTable toolbar batchDelete handler） */
		async function batchDelete(rows) {
			let ok = 0;
			for (const r of rows) {
				const id = Number(r.id);
				if (!id) continue;
				try {
					await delIdentity(id);
					ok++;
				} catch (e) {
					console.error("删除失败:", e);
				}
			}
			message.success(`删除 ${ok}/${rows.length} 条`);
			selection.value = [];
			await load();
		}
		/** 导出当前过滤结果为 CSV */
		function exportCsv() {
			const rows = filteredList.value;
			if (!rows.length) {
				message.warning("没有可导出的数据");
				return;
			}
			const csv = [[
				"名称",
				"类型",
				"登录用户",
				"密钥",
				"备注"
			], ...rows.map((i) => [
				i.msServerIdentityName,
				authTypeLabel(i.msServerIdentityAuthType),
				i.msServerIdentityUsername,
				keyNameOf(i),
				i.msServerIdentityRemark ?? ""
			])].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
			const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `账号身份-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(a.href);
			message.success(`已导出 ${rows.length} 条`);
		}
		const authTypeOptions = [
			{
				value: "PASSWORD",
				label: "密码登录",
				group: "主机"
			},
			{
				value: "PUBLIC_KEY",
				label: "公钥登录",
				group: "主机"
			},
			{
				value: "MAILBOX",
				label: "邮箱账号",
				group: "通用"
			},
			{
				value: "TOKEN",
				label: "Token",
				group: "通用"
			},
			{
				value: "API_KEY",
				label: "API Key",
				group: "通用"
			},
			{
				value: "OAUTH2",
				label: "OAuth 2.0",
				group: "通用"
			},
			{
				value: "COOKIE",
				label: "Cookie",
				group: "通用"
			},
			{
				value: "ACCOUNT",
				label: "账号密码",
				group: "通用"
			}
		];
		/** 认证类型展示名（未知类型显示原值） */
		const authTypeLabel = (t) => {
			if (!t) return "-";
			const hit = authTypeOptions.find((o) => o.value === t);
			return hit ? hit.label : t;
		};
		/** 认证类型标签色 */
		const authTypeTagType = (t) => {
			if (t === "PUBLIC_KEY") return "warning";
			if (t === "MAILBOX") return "success";
			if (t === "PASSWORD") return "info";
			return "primary";
		};
		const filterState = ref({
			keyword: "",
			type: ""
		});
		function onFilterChange(prop, value) {
			filterState.value[prop] = value;
		}
		function onFilterReset() {
			filterState.value = {
				keyword: "",
				type: ""
			};
		}
		/** 主机类身份数（口令 / 公钥两种主机登录方式） */
		const hostCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PASSWORD" || i.msServerIdentityAuthType === "PUBLIC_KEY").length);
		/** 非主机类身份数（邮箱 / Token 等） */
		const genericCount = computed(() => list.value.length - hostCount.value);
		/** 走公钥登录的身份数 */
		const keyCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PUBLIC_KEY").length);
		/** 已引用密钥库中某个密钥的身份数（引用关系存在密钥主键上） */
		const keyRefCount = computed(() => list.value.filter((i) => i.msServerIdentityKeyId != null).length);
		/** 已绑定至少一台主机的身份数 */
		const boundIdentityCount = computed(() => Object.keys(bindCache.value).filter((id) => (bindCache.value[Number(id)]?.length ?? 0) > 0).length);
		/** RSA 密钥数（类型缺省按 RSA 计，与 keyTypeLabel 的兜底保持一致） */
		const rsaCount = computed(() => keys.value.filter((k) => keyTypeLabel(k.msServerKeyType) === "RSA").length);
		/**
		* 统计卡定义。
		*
		* <p>{@code icon} 必须是组件（ReStatCard 内部走 {@code <component :is="icon" />}），
		* 所以直接引用 @element-plus/icons-vue 的组件，不传图标名字符串；
		* {@code iconColor} 用 koi 令牌，不写死品牌色。</p>
		*/
		const identityKpis = computed(() => [
			{
				key: "total",
				title: "身份总数",
				value: list.value.length,
				desc: boundIdentityCount.value ? `已绑定主机 ${boundIdentityCount.value}` : "尚未绑定主机",
				icon: user_default,
				iconColor: "var(--brand-500, var(--el-color-primary))"
			},
			{
				key: "host",
				title: "主机登录",
				value: hostCount.value,
				desc: "口令 + 公钥",
				icon: monitor_default,
				iconColor: "var(--metric-cpu, var(--el-color-primary))"
			},
			{
				key: "publickey",
				title: "公钥登录",
				value: keyCount.value,
				desc: keyRefCount.value ? `已引用密钥 ${keyRefCount.value}` : "未引用密钥库",
				icon: key_default,
				iconColor: "var(--el-color-success)"
			},
			{
				key: "generic",
				title: "通用凭据",
				value: genericCount.value,
				desc: "邮箱 / Token 等",
				icon: postcard_default,
				iconColor: "var(--metric-disk, var(--el-color-warning))"
			}
		]);
		/** 「SSH 密钥库」tab 的统计卡 */
		const keyKpis = computed(() => [
			{
				key: "total",
				title: "密钥总数",
				value: keys.value.length,
				desc: "供公钥登录身份引用",
				icon: collection_default,
				iconColor: "var(--brand-500, var(--el-color-primary))"
			},
			{
				key: "rsa",
				title: "RSA",
				value: rsaCount.value,
				desc: "类型缺省按 RSA 计",
				icon: lock_default,
				iconColor: "var(--metric-cpu, var(--el-color-primary))"
			},
			{
				key: "other",
				title: "其他类型",
				value: keys.value.length - rsaCount.value,
				desc: "ECDSA / ED25519 等",
				icon: unlock_default,
				iconColor: "var(--el-color-warning)"
			},
			{
				key: "ref",
				title: "已被引用",
				value: keyRefCount.value,
				desc: keyRefCount.value ? "对应身份已绑定密钥" : "暂无身份引用",
				icon: connection_default,
				iconColor: "var(--el-color-success)"
			}
		]);
		/** 当前 tab 展示的统计卡 */
		const activeKpis = computed(() => tab.value === "identity" ? identityKpis.value : keyKpis.value);
		const filterItems = computed(() => [{
			prop: "keyword",
			label: "名称/用户",
			type: "input",
			placeholder: "搜索名称 / 登录用户 / 备注",
			clearable: true,
			always: true
		}, {
			prop: "type",
			label: "类型",
			type: "select",
			placeholder: "全部类型",
			clearable: true,
			options: authTypeOptions.map((o) => ({
				label: o.label,
				value: o.value
			})),
			always: true
		}]);
		/** 过滤后的列表 */
		const filteredList = computed(() => {
			let items = list.value;
			const kw = String(filterState.value.keyword ?? "").toLowerCase().trim();
			if (kw) items = items.filter((i) => i.msServerIdentityName.toLowerCase().includes(kw) || (i.msServerIdentityUsername ?? "").toLowerCase().includes(kw) || (i.msServerIdentityRemark ?? "").toLowerCase().includes(kw));
			const type = String(filterState.value.type ?? "");
			if (type) items = items.filter((i) => i.msServerIdentityAuthType === type);
			return items;
		});
		/** 复制用户名到剪贴板 */
		async function copyUsername(i) {
			try {
				await navigator.clipboard.writeText(i.msServerIdentityUsername || "");
				message.success("用户名已复制");
			} catch {
				message.info(i.msServerIdentityUsername || "");
			}
		}
		const addVisible = ref(false);
		useDialogPrerender(addVisible);
		const addSaving = ref(false);
		const editingId = ref(null);
		const addForm = ref({
			msServerIdentityName: "",
			msServerIdentityAuthType: "PASSWORD",
			msServerIdentityUsername: "",
			msServerIdentityPassword: "",
			msServerIdentityKeyId: null,
			msServerIdentityRemark: ""
		});
		/**
		* 打开新建身份弹窗
		*/
		function openAdd() {
			editingId.value = null;
			addForm.value = {
				msServerIdentityName: "",
				msServerIdentityAuthType: "PASSWORD",
				msServerIdentityUsername: "",
				msServerIdentityPassword: "",
				msServerIdentityKeyId: null,
				msServerIdentityRemark: ""
			};
			addVisible.value = true;
		}
		/**
		* 打开编辑身份弹窗
		* @param row 身份行
		*/
		function openEdit(row) {
			editingId.value = row.id;
			addForm.value = {
				msServerIdentityName: row.msServerIdentityName,
				msServerIdentityAuthType: row.msServerIdentityAuthType,
				msServerIdentityUsername: row.msServerIdentityUsername,
				msServerIdentityPassword: "",
				msServerIdentityKeyId: row.msServerIdentityKeyId ?? null,
				msServerIdentityRemark: row.msServerIdentityRemark ?? ""
			};
			addVisible.value = true;
		}
		async function submitAdd() {
			if (!addForm.value.msServerIdentityName?.trim()) {
				message.warning("请输入身份名称");
				return;
			}
			if (!addForm.value.msServerIdentityUsername?.trim()) {
				message.warning("请输入登录用户名");
				return;
			}
			addSaving.value = true;
			try {
				await saveIdentity(editingId.value, {
					...addForm.value,
					msServerIdentityPassword: addForm.value.msServerIdentityPassword || void 0
				});
				message.success(editingId.value != null ? "身份已更新" : "身份已创建");
				addVisible.value = false;
				await load();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				addSaving.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReFilter = resolveComponent("ReFilter");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_ReIcon = resolveComponent("ReIcon");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("button", {
					class: normalizeClass(["tab-btn", { active: tab.value === "identity" }]),
					onClick: _cache[0] || (_cache[0] = ($event) => tab.value = "identity")
				}, "登录身份", 2), createBaseVNode("button", {
					class: normalizeClass(["tab-btn", { active: tab.value === "key" }]),
					onClick: _cache[1] || (_cache[1] = ($event) => tab.value = "key")
				}, "SSH 密钥库", 2)]),
				tab.value === "identity" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("section", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(activeKpis.value, (k) => {
					return openBlock(), createBlock(unref(component), {
						key: k.key,
						size: "compact",
						title: k.title,
						value: k.value,
						desc: k.desc,
						icon: k.icon,
						"icon-color": k.iconColor
					}, null, 8, [
						"title",
						"value",
						"desc",
						"icon",
						"icon-color"
					]);
				}), 128))]), createBaseVNode("section", _hoisted_4, [
					createVNode(_component_ReSectionHead, { description: "身份即登录凭据；主机可绑定多个身份，连接时按所选身份建连" }, {
						title: withCtx(() => [..._cache[24] || (_cache[24] = [createTextVNode("登录身份", -1)])]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_5, [
						createVNode(_component_ReFilter, {
							items: filterItems.value,
							columns: 2,
							collapsible: false,
							"show-actions": false,
							onChange: onFilterChange,
							onReset: onFilterReset,
							class: "im-toolbar__filter"
						}, null, 8, ["items"]),
						createBaseVNode("span", _hoisted_6, toDisplayString(filteredList.value.length) + " / " + toDisplayString(list.value.length) + " 条", 1),
						createBaseVNode("div", _hoisted_7, [
							createVNode(_component_ReButton, {
								icon: "Plus",
								layout: "square",
								type: "primary",
								tip: "新增身份",
								onClick: openAdd
							}),
							createVNode(_component_ReButton, {
								icon: "Download",
								layout: "square",
								tip: "导出 CSV",
								onClick: exportCsv
							}),
							createVNode(_component_ReButton, {
								icon: "RefreshRight",
								layout: "square",
								tip: "刷新",
								loading: loading.value,
								onClick: load
							}, null, 8, ["loading"])
						])
					]),
					createVNode(_component_ReTable, {
						data: filteredList.value,
						columns,
						loading: loading.value,
						"table-id": "identity-list",
						pagination: true,
						"page-size": pageSize.value,
						"empty-text": "暂无身份",
						toolbar: true,
						"toolbar-config": {
							position: "top",
							refresh: true,
							columnSettings: true,
							tableSettings: true
						},
						onSelectionChange: _cache[2] || (_cache[2] = ($event) => selection.value = $event)
					}, {
						"col-auth": withCtx(({ row }) => [createVNode(_component_ReTag, { type: authTypeTagType(row.msServerIdentityAuthType) }, {
							default: withCtx(() => [createTextVNode(toDisplayString(authTypeLabel(row.msServerIdentityAuthType)), 1)]),
							_: 2
						}, 1032, ["type"])]),
						"col-key": withCtx(({ row }) => [keyNameOf(row) ? (openBlock(), createElementBlock("span", _hoisted_8, toDisplayString(keyNameOf(row)), 1)) : (openBlock(), createElementBlock("span", _hoisted_9, "—"))]),
						"col-hosts": withCtx(({ row }) => [boundHostCountOf(row.id) > 0 ? (openBlock(), createElementBlock("div", {
							key: 0,
							class: "host-count",
							onClick: ($event) => openBind(row)
						}, [createVNode(_component_ReTag, {
							effect: "plain",
							type: "primary"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(boundHostCountOf(row.id)) + " 台", 1)]),
							_: 2
						}, 1024), boundHostsOf(row.id).length > 0 ? (openBlock(), createElementBlock("span", _hoisted_11, [createTextVNode(toDisplayString(boundHostsOf(row.id).slice(0, 2).map((h) => h.serverHostName).join(", ")) + " ", 1), boundHostsOf(row.id).length > 2 ? (openBlock(), createElementBlock("span", _hoisted_12, "...")) : createCommentVNode("", true)])) : createCommentVNode("", true)], 8, _hoisted_10)) : (openBlock(), createElementBlock("span", _hoisted_13, "未绑定"))]),
						"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_14, [
							createVNode(_component_ReButton, {
								icon: "EditPen",
								layout: "square",
								title: "编辑",
								onClick: ($event) => openEdit(row)
							}, null, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "Connection",
								layout: "square",
								title: "绑定主机",
								onClick: ($event) => openBind(row)
							}, null, 8, ["onClick"]),
							row.msServerIdentityAuthType === "MAILBOX" ? (openBlock(), createBlock(_component_ReButton, {
								key: 0,
								icon: "Message",
								layout: "square",
								title: "收件箱",
								onClick: ($event) => openMail(row)
							}, null, 8, ["onClick"])) : createCommentVNode("", true),
							createVNode(_component_ReButton, {
								icon: "CopyDocument",
								layout: "square",
								title: "复制用户名",
								onClick: ($event) => copyUsername(row)
							}, null, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "Delete",
								layout: "square",
								type: "danger",
								title: "删除",
								onClick: ($event) => remove(row)
							}, null, 8, ["onClick"])
						])]),
						_: 1
					}, 8, [
						"data",
						"loading",
						"page-size"
					]),
					selection.value.length ? (openBlock(), createElementBlock("div", _hoisted_15, [createVNode(_component_ReTag, {
						type: "primary",
						effect: "plain"
					}, {
						default: withCtx(() => [createTextVNode("已选 " + toDisplayString(selection.value.length) + " 项", 1)]),
						_: 1
					}), createVNode(_component_ReButton, {
						icon: "Delete",
						type: "danger",
						"show-text": true,
						onClick: _cache[3] || (_cache[3] = ($event) => batchDelete(selection.value))
					}, {
						default: withCtx(() => [..._cache[25] || (_cache[25] = [createTextVNode("批量删除", -1)])]),
						_: 1
					})])) : createCommentVNode("", true)
				])], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("section", _hoisted_16, [(openBlock(true), createElementBlock(Fragment, null, renderList(activeKpis.value, (k) => {
					return openBlock(), createBlock(unref(component), {
						key: k.key,
						size: "compact",
						title: k.title,
						value: k.value,
						desc: k.desc,
						icon: k.icon,
						"icon-color": k.iconColor
					}, null, 8, [
						"title",
						"value",
						"desc",
						"icon",
						"icon-color"
					]);
				}), 128))]), createBaseVNode("section", _hoisted_17, [
					createVNode(_component_ReSectionHead, { description: "SSH 密钥库：密钥名称 / 类型 / 公钥指纹；身份选「公钥登录」时引用密钥" }, {
						title: withCtx(() => [..._cache[26] || (_cache[26] = [createTextVNode("SSH 密钥库", -1)])]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_18, [createBaseVNode("span", _hoisted_19, toDisplayString(keys.value.length) + " 个密钥", 1), createBaseVNode("div", _hoisted_20, [
						createVNode(_component_ReButton, {
							icon: "MagicStick",
							layout: "square",
							tip: "生成密钥对",
							onClick: openKeyAdd
						}),
						createVNode(_component_ReButton, {
							icon: "Plus",
							layout: "square",
							type: "primary",
							tip: "新增密钥",
							onClick: openKeyManual
						}),
						createVNode(_component_ReButton, {
							icon: "RefreshRight",
							layout: "square",
							tip: "刷新密钥库",
							loading: keyLoading.value,
							onClick: loadKeys
						}, null, 8, ["loading"])
					])]),
					createVNode(_component_ReTable, {
						data: keys.value,
						columns: keyColumns,
						loading: keyLoading.value,
						"table-id": "ssh-key-list",
						pagination: true,
						"page-size": 10,
						"empty-text": "暂无密钥",
						toolbar: true,
						"toolbar-config": {
							position: "top",
							refresh: true,
							columnSettings: true,
							tableSettings: true
						}
					}, {
						"col-type": withCtx(({ row }) => [createVNode(_component_ReTag, {
							type: row.msServerKeyType === "RSA" ? "warning" : "primary",
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(keyTypeLabel(row.msServerKeyType)), 1)]),
							_: 2
						}, 1032, ["type"])]),
						"col-fp": withCtx(({ row }) => [createBaseVNode("span", _hoisted_21, toDisplayString(keyFingerprint(row.msServerKeyPublicKey)), 1)]),
						"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_22, [
							createVNode(_component_ReButton, {
								icon: "EditPen",
								layout: "square",
								title: "编辑",
								onClick: ($event) => openKeyEdit(row)
							}, null, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "Download",
								layout: "square",
								title: "下载公钥",
								onClick: ($event) => downloadPublicKey(row)
							}, null, 8, ["onClick"]),
							createVNode(_component_ReButton, {
								icon: "Key",
								layout: "square",
								title: "私钥不出库",
								disabled: ""
							}),
							createVNode(_component_ReButton, {
								icon: "Delete",
								layout: "square",
								type: "danger",
								title: "删除",
								onClick: ($event) => removeKey(row)
							}, null, 8, ["onClick"])
						])]),
						_: 1
					}, 8, ["data", "loading"])
				])], 64)),
				createVNode(_component_ReDialog, {
					modelValue: addVisible.value,
					"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => addVisible.value = $event),
					title: editingId.value != null ? "编辑身份" : "新增身份",
					width: "520px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[9] || (_cache[9] = ($event) => addVisible.value = false) }, {
						default: withCtx(() => [..._cache[27] || (_cache[27] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: addSaving.value,
						icon: "Check",
						"show-text": true,
						onClick: submitAdd
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(editingId.value != null ? "保存" : "创建"), 1)]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(_component_ReForm, {
						model: addForm.value,
						"label-position": "top"
					}, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "名称" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: addForm.value.msServerIdentityName,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => addForm.value.msServerIdentityName = $event),
									placeholder: "如 root-prod",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "类型" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: addForm.value.msServerIdentityAuthType,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => addForm.value.msServerIdentityAuthType = $event),
									style: { "width": "100%" },
									filterable: "",
									"allow-create": "",
									"default-first-option": "",
									placeholder: "选择或输入类型",
									options: authTypeOptions
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "登录用户名" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: addForm.value.msServerIdentityUsername,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => addForm.value.msServerIdentityUsername = $event),
									placeholder: "如 root / ubuntu",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							addForm.value.msServerIdentityAuthType === "PASSWORD" ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 0,
								label: "登录密码"
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: addForm.value.msServerIdentityPassword,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => addForm.value.msServerIdentityPassword = $event),
									type: "password",
									"show-password": "",
									placeholder: "SSH 口令",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(unref(ReFormItem), { label: "备注" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: addForm.value.msServerIdentityRemark,
									"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => addForm.value.msServerIdentityRemark = $event),
									placeholder: "用途说明（可选）",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["model"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: keyFormVisible.value,
					"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => keyFormVisible.value = $event),
					title: editingKeyId.value != null ? "编辑密钥" : isGenerateKey.value ? "生成密钥对" : "新增密钥",
					width: "560px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[17] || (_cache[17] = ($event) => keyFormVisible.value = false) }, {
						default: withCtx(() => [..._cache[28] || (_cache[28] = [createTextVNode("取消", -1)])]),
						_: 1
					}), isGenerateKey.value && editingKeyId.value == null ? (openBlock(), createBlock(_component_ReButton, {
						key: 0,
						type: "primary",
						loading: keySaving.value,
						icon: "MagicStick",
						"show-text": true,
						onClick: generateKey
					}, {
						default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("生成", -1)])]),
						_: 1
					}, 8, ["loading"])) : (openBlock(), createBlock(_component_ReButton, {
						key: 1,
						type: "primary",
						loading: keySaving.value,
						icon: "Check",
						"show-text": true,
						onClick: submitKey
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(editingKeyId.value != null ? "保存" : "创建"), 1)]),
						_: 1
					}, 8, ["loading"]))]),
					default: withCtx(() => [createVNode(_component_ReForm, {
						model: keyForm.value,
						"label-position": "top"
					}, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "密钥名称" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: keyForm.value.msServerKeyName,
									"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => keyForm.value.msServerKeyName = $event),
									placeholder: "如 prod-rsa-2026",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "密钥类型" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: keyForm.value.msServerKeyType,
									"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => keyForm.value.msServerKeyType = $event),
									style: { "width": "100%" },
									options: KEY_TYPE_OPTIONS,
									disabled: editingKeyId.value != null
								}, null, 8, ["modelValue", "disabled"])]),
								_: 1
							}),
							!isGenerateKey.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ReFormItem), { label: "公钥" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: keyForm.value.msServerKeyPublicKey,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => keyForm.value.msServerKeyPublicKey = $event),
									type: "textarea",
									rows: 3,
									placeholder: "粘贴公钥内容（可选）",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}), createVNode(unref(ReFormItem), { label: "私钥" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: keyForm.value.msServerKeyPrivateKey,
									"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => keyForm.value.msServerKeyPrivateKey = $event),
									type: "textarea",
									rows: 3,
									placeholder: editingKeyId.value != null ? "留空保持不变" : "粘贴私钥内容（可选）",
									style: { "width": "100%" }
								}, null, 8, ["modelValue", "placeholder"])]),
								_: 1
							})], 64)) : createCommentVNode("", true),
							isGenerateKey.value ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 1,
								label: "私钥口令"
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: keyForm.value.msServerKeyPassword,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => keyForm.value.msServerKeyPassword = $event),
									type: "password",
									"show-password": "",
									placeholder: "私钥加密口令（可空）",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(unref(ReFormItem), { label: "备注" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: keyForm.value.msServerKeyRemark,
									"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => keyForm.value.msServerKeyRemark = $event),
									placeholder: "用途说明（可选）",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["model"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: bindVisible.value,
					"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => bindVisible.value = $event),
					title: `绑定主机：${bindTarget.value?.msServerIdentityName ?? ""}`,
					width: "640px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[19] || (_cache[19] = ($event) => bindVisible.value = false) }, {
						default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [bindLoading.value ? (openBlock(), createElementBlock("div", _hoisted_23, "加载中...")) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", _hoisted_24, "已绑定主机（" + toDisplayString(bindHosts.value.length) + "）", 1),
						bindHosts.value.length ? (openBlock(), createElementBlock("div", _hoisted_25, [(openBlock(true), createElementBlock(Fragment, null, renderList(bindHosts.value, (h) => {
							return openBlock(), createElementBlock("div", {
								key: h.id,
								class: "host-chip"
							}, [
								createVNode(_component_ReTag, {
									type: h.serverHostOnline === 1 ? "success" : "info",
									effect: "plain"
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(h.serverHostOnline === 1 ? "在线" : "离线"), 1)]),
									_: 2
								}, 1032, ["type"]),
								createBaseVNode("b", null, toDisplayString(h.serverHostName), 1),
								createBaseVNode("span", _hoisted_26, toDisplayString(h.serverHostAddress) + ":" + toDisplayString(h.serverHostPort), 1),
								createVNode(_component_ReButton, {
									icon: "Unlink",
									layout: "square",
									type: "danger",
									title: "解绑",
									onClick: ($event) => doUnbind(h.id)
								}, null, 8, ["onClick"])
							]);
						}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_27, "未绑定任何主机")),
						createBaseVNode("div", _hoisted_28, "可绑定主机（" + toDisplayString(bindAllHosts.value.length) + "）", 1),
						bindAllHosts.value.length ? (openBlock(), createElementBlock("div", _hoisted_29, [(openBlock(true), createElementBlock(Fragment, null, renderList(bindAllHosts.value, (h) => {
							return openBlock(), createElementBlock("div", {
								key: h.id,
								class: "host-chip"
							}, [
								createBaseVNode("b", null, toDisplayString(h.serverHostName), 1),
								createBaseVNode("span", _hoisted_30, toDisplayString(h.serverHostAddress) + ":" + toDisplayString(h.serverHostPort), 1),
								createVNode(_component_ReButton, {
									icon: "Link",
									layout: "square",
									type: "primary",
									title: "绑定",
									onClick: ($event) => doBind(h.id)
								}, null, 8, ["onClick"])
							]);
						}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_31, "已全部绑定"))
					], 64))]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: mailVisible.value,
					"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => mailVisible.value = $event),
					title: `收件箱：${mailTarget.value?.msServerIdentityName ?? ""}`,
					width: "820px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[22] || (_cache[22] = ($event) => mailVisible.value = false) }, {
						default: withCtx(() => [..._cache[39] || (_cache[39] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [mailLoading.value ? (openBlock(), createElementBlock("div", _hoisted_32, [..._cache[31] || (_cache[31] = [createBaseVNode("span", { class: "spinner" }, null, -1), createBaseVNode("span", null, "正在读取邮件...", -1)])])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [mails.value.length ? (openBlock(), createElementBlock("div", _hoisted_33, [createBaseVNode("div", _hoisted_34, [createBaseVNode("div", _hoisted_35, [createBaseVNode("span", _hoisted_36, toDisplayString(mails.value.length) + " 封", 1), _cache[32] || (_cache[32] = createBaseVNode("span", { class: "mail-side-hint" }, "点击查看内容", -1))]), createBaseVNode("div", _hoisted_37, [(openBlock(true), createElementBlock(Fragment, null, renderList(mails.value, (m, idx) => {
						return openBlock(), createElementBlock("div", {
							key: m.id ?? idx,
							class: normalizeClass(["mail-item", { active: activeMailIndex.value === idx }]),
							onClick: ($event) => selectMail(m, idx)
						}, [
							createBaseVNode("div", _hoisted_39, [
								createBaseVNode("span", _hoisted_40, toDisplayString((m.from || "?").charAt(0).toUpperCase()), 1),
								createBaseVNode("span", _hoisted_41, toDisplayString(mailFromShort(m.from)), 1),
								createBaseVNode("span", _hoisted_42, toDisplayString(formatMailDate(m.date)), 1)
							]),
							createBaseVNode("div", _hoisted_43, toDisplayString(m.subject || "(无主题)"), 1),
							m.snippet ? (openBlock(), createElementBlock("div", _hoisted_44, toDisplayString(m.snippet), 1)) : createCommentVNode("", true)
						], 10, _hoisted_38);
					}), 128))])]), createBaseVNode("div", _hoisted_45, [activeMail.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						createBaseVNode("div", _hoisted_46, [
							createBaseVNode("div", _hoisted_47, toDisplayString(activeMail.value.subject || "(无主题)"), 1),
							createBaseVNode("div", _hoisted_48, [createVNode(_component_ReTag, { effect: "plain" }, {
								default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("发件人", -1)])]),
								_: 1
							}), createBaseVNode("span", _hoisted_49, toDisplayString(activeMail.value.from || "—"), 1)]),
							createBaseVNode("div", _hoisted_50, [createVNode(_component_ReTag, { effect: "plain" }, {
								default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("时间", -1)])]),
								_: 1
							}), createBaseVNode("span", _hoisted_51, toDisplayString(activeMail.value.date || "—"), 1)]),
							activeMail.value.size != null ? (openBlock(), createElementBlock("div", _hoisted_52, [createVNode(_component_ReTag, { effect: "plain" }, {
								default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode("大小", -1)])]),
								_: 1
							}), createBaseVNode("span", _hoisted_53, toDisplayString(formatSize(activeMail.value.size)), 1)])) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_54, [activeMail.value.content ? (openBlock(), createElementBlock("pre", _hoisted_55, toDisplayString(activeMail.value.content), 1)) : (openBlock(), createElementBlock("div", _hoisted_56, "（该邮件暂无正文预览，点击下方查看原始内容）"))]),
						createBaseVNode("div", _hoisted_57, [createVNode(_component_ReButton, {
							icon: "RefreshLeft",
							"show-text": true,
							onClick: _cache[21] || (_cache[21] = ($event) => openMail(mailTarget.value))
						}, {
							default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("刷新", -1)])]),
							_: 1
						})])
					], 64)) : (openBlock(), createElementBlock("div", _hoisted_58, [createVNode(_component_ReIcon, {
						name: "Message",
						size: 40,
						color: "var(--text-tertiary)"
					}), _cache[37] || (_cache[37] = createBaseVNode("span", null, "选择左侧邮件查看详情", -1))]))])])) : (openBlock(), createElementBlock("div", _hoisted_59, [createVNode(_component_ReIcon, {
						name: "Inbox",
						size: 40,
						color: "var(--text-tertiary)"
					}), _cache[38] || (_cache[38] = createBaseVNode("span", null, "收件箱为空", -1))]))], 64))]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-f430424c"]]);
//#endregion
export { IdentityManageView_default as default };
