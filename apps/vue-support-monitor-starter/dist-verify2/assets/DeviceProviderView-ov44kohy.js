import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { t as component$1 } from "./ReStatCard-BGjVHdD2.js";
import { C as plus_default, D as share_default, _ as info_filled_default, g as grid_default, i as bell_default, k as timer_default, p as download_default, s as circle_check_default } from "./dist-Axt1Prff.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { t as ReSkeleton_default } from "./ReSkeleton-Doy9_0TU.js";
import { t as deviceApi } from "./deviceApi-Dqp1FtpS.js";
//#region ../../pages/device/src/views/DeviceProviderView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dpv" };
var _hoisted_2 = { class: "dpv-kpis" };
var _hoisted_3 = { class: "dpv-filter" };
var _hoisted_4 = { class: "dpv-field dpv-field--vendor" };
var _hoisted_5 = { class: "dpv-field" };
var _hoisted_6 = { class: "dpv-field dpv-field--search" };
var _hoisted_7 = { class: "dpv-filter__meta" };
var _hoisted_8 = { class: "dpv-toolbar-ops" };
var _hoisted_9 = { class: "dpv-hintbar" };
var _hoisted_10 = {
	key: 0,
	class: "dpv-error"
};
var _hoisted_11 = { class: "dpv-grid" };
var _hoisted_12 = {
	key: 0,
	class: "pcard pcard--ghost"
};
var _hoisted_13 = { class: "pcard__head" };
var _hoisted_14 = { class: "pcard__title" };
var _hoisted_15 = { class: "pcard__name" };
var _hoisted_16 = { class: "pcard__sub" };
var _hoisted_17 = { class: "pcard__info" };
var _hoisted_18 = { class: "pcard__row" };
var _hoisted_19 = { class: "pcard__mono" };
var _hoisted_20 = { class: "pcard__row" };
var _hoisted_21 = { class: "pcard__mono pcard__secret" };
var _hoisted_22 = {
	key: 0,
	class: "pcard__row"
};
var _hoisted_23 = { class: "pcard__mono" };
var _hoisted_24 = {
	key: 1,
	class: "pcard__row"
};
var _hoisted_25 = { class: "pcard__mono" };
var _hoisted_26 = { class: "pcard__row" };
var _hoisted_27 = { class: "pcard__mono" };
var _hoisted_28 = { class: "pcard__row" };
var _hoisted_29 = { class: "pcard__extra" };
var _hoisted_30 = { class: "pcard__extra-text" };
var _hoisted_31 = {
	key: 1,
	class: "pcard__reserve"
};
var _hoisted_32 = { class: "pcard__foot" };
var _hoisted_33 = { class: "pcard__ops" };
var _hoisted_34 = {
	key: 1,
	class: "pcard pcard--ghost"
};
var _hoisted_35 = { class: "pcard__head" };
var _hoisted_36 = { class: "pcard__title" };
var _hoisted_37 = { class: "pcard__name" };
var _hoisted_38 = { class: "pcard__sub" };
var _hoisted_39 = { class: "pcard__add-icon" };
var _hoisted_40 = { class: "dpv-vendor" };
var _hoisted_41 = { class: "pcard__title" };
var _hoisted_42 = { class: "pcard__name" };
var _hoisted_43 = { class: "pcard__sub" };
var _hoisted_44 = { class: "dpv-advanced" };
var _hoisted_45 = { class: "dpv-advanced__grid" };
var _hoisted_46 = { class: "acard" };
var _hoisted_47 = { class: "acard__head" };
var _hoisted_48 = { class: "acard__icon" };
var _hoisted_49 = { class: "acard__row" };
var _hoisted_50 = {
	key: 0,
	class: "acard__meta"
};
var _hoisted_51 = { class: "dpv-advanced" };
var _hoisted_52 = { class: "dpv-advanced__grid dpv-advanced__grid--two" };
var _hoisted_53 = { class: "acard" };
var _hoisted_54 = { class: "acard__head" };
var _hoisted_55 = { class: "acard__icon" };
var _hoisted_56 = { class: "acard__row" };
var _hoisted_57 = { class: "acard" };
var _hoisted_58 = { class: "acard__head" };
var _hoisted_59 = { class: "acard__icon" };
var _hoisted_60 = { class: "acard__row" };
var ADVANCED_KEY = "device:provider-advanced";
//#endregion
//#region ../../pages/device/src/views/DeviceProviderView.vue
var DeviceProviderView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DeviceProviderView",
	setup(__props) {
		/**
		* 提供商配置 —— 厂商自定义的 AK/SK 等接入参数，用卡牌呈现。
		*
		* 数据来自 device-starter 的 `/api/device/provider-credential/*`，落库表
		* `device_provider_credential`。同一 (厂商, 平台类型) 可登记**多套**凭据
		* （如多个海康账号分属不同区域），**没有「默认套」**：设备可以来自多套凭据，
		* 离线阈值、自动同步都按套生效。
		*
		* 可选平台类型直接对应后台 SPI 的实现：
		*   - hikvision：cloud-yao 云耀 / cloud-eye 云眸 / secure-platform 安防平台（另有 SDK 局域网直连）
		*   - dahua   ：dahua-cloud 云睿 / lechange 乐橙（另有 SDK 局域网直连）
		* SDK 直连走 IP+账号密码，不需要 AK/SK，故平台类型留空。
		*
		* 本轮交互要点：
		*   1. 表单统一 `label-position="top"`（标签在上、控件在下），不再左右布局；
		*   2. 启用/停用开关用方形开关（ReSwitch layout="square"，表单里用 layout="radio"）；
		*   3. 凭据区**始终**是卡牌：有数据是凭据卡，没数据是提示卡 + 新增卡，不再用整块空状态图；
		*   4. 凭据卡右键 = 手动同步设备 / 手动同步组织 / 高级设置 / 启停 / 编辑 / 删除；
		*   5. 离线检测与设备、组织自动同步收进「高级设置」，按凭据套保存。
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const VENDOR_LABELS = {
			hikvision: "海康威视",
			dahua: "大华"
		};
		/** 各厂商支持的平台类型（取自后台 SPI：HikvisionProvider / DahuaProvider 的 connect 分支） */
		const VENDOR_PLATFORMS = {
			hikvision: [
				{
					value: "cloud-yao",
					label: "云耀"
				},
				{
					value: "cloud-eye",
					label: "云眸"
				},
				{
					value: "secure-platform",
					label: "安防平台"
				}
			],
			dahua: [{
				value: "dahua-cloud",
				label: "云睿"
			}, {
				value: "lechange",
				label: "乐橙"
			}]
		};
		/** 平台类型留空 = SDK 局域网直连（IP + 账号密码，不需要 AK/SK） */
		const SDK_PLATFORM = {
			value: "",
			label: "SDK 直连"
		};
		/** 厂商卡牌配色（仅用于卡牌左上角的字母块） */
		const VENDOR_TINTS = {
			hikvision: {
				color: "var(--el-color-primary)",
				bg: "var(--el-color-primary-light-9)"
			},
			dahua: {
				color: "var(--el-color-success)",
				bg: "var(--el-color-success-light-9)"
			}
		};
		/** 自动同步配置（预留：后端只有 POST /org/sync 手动接口，先落本机 localStorage） */
		const DEFAULT_ADVANCED = {
			deviceSync: false,
			deviceInterval: 30,
			orgSync: true,
			orgInterval: 60
		};
		function loadAdvancedMap() {
			try {
				const raw = localStorage.getItem(ADVANCED_KEY);
				return raw ? JSON.parse(raw) : {};
			} catch {
				return {};
			}
		}
		const rows = ref([]);
		const loading = ref(false);
		const loadError = ref("");
		/** 筛选 */
		const filters = reactive({
			vendor: "",
			platform: "",
			keyword: ""
		});
		/** 已展开明文的 SK 卡牌 id 集合 */
		const revealed = ref(/* @__PURE__ */ new Set());
		/** 自动同步配置（按凭据套 id 存本机） */
		const advancedMap = ref(loadAdvancedMap());
		/** 新增/编辑弹窗 */
		const dialogVisible = ref(false);
		const dialogSaving = ref(false);
		const editingId = ref(null);
		const form = reactive({
			deviceCredentialVendor: "hikvision",
			deviceCredentialPlatformType: "cloud-yao",
			deviceCredentialName: "",
			deviceCredentialAppKey: "",
			deviceCredentialAppSecret: "",
			deviceCredentialProductCode: "",
			deviceCredentialProjectId: "",
			deviceCredentialBaseUrl: "",
			deviceCredentialOfflineThreshold: 60,
			deviceCredentialEnabled: true,
			deviceCredentialRemark: ""
		});
		/** 高级设置弹窗（按凭据套配置：设备可来自多套，不再有「默认套」） */
		const advancedVisible = ref(false);
		const advancedSaving = ref(false);
		const advancedRow = ref(null);
		const advancedThreshold = ref();
		const advancedForm = reactive({ ...DEFAULT_ADVANCED });
		const syncing = ref(false);
		const vendorOptions = Object.entries(VENDOR_LABELS).map(([value, label]) => ({
			value,
			label
		}));
		/** 当前所选厂商支持的平台类型 */
		const platformOptions = computed(() => VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? []);
		/** 凭据名称必填；平台模式下 AK/SK 必填 */
		const nameInvalid = computed(() => !form.deviceCredentialName.trim());
		const isPlatformMode = computed(() => !!form.deviceCredentialPlatformType);
		const akSkInvalid = computed(() => isPlatformMode.value && (!form.deviceCredentialAppKey.trim() || !form.deviceCredentialAppSecret.trim()));
		/** 云曜除 AK/SK 外还需要产品编码 + 项目 ID */
		const isCloudYao = computed(() => form.deviceCredentialVendor === "hikvision" && form.deviceCredentialPlatformType === "cloud-yao");
		const cloudYaoInvalid = computed(() => isCloudYao.value && (!form.deviceCredentialProductCode.trim() || !form.deviceCredentialProjectId.trim()));
		const filteredRows = computed(() => {
			const kw = filters.keyword.trim().toLowerCase();
			return rows.value.filter((r) => {
				if (filters.vendor && r.deviceCredentialVendor !== filters.vendor) return false;
				if (filters.platform && (r.deviceCredentialPlatformType || "") !== filters.platform) return false;
				if (!kw) return true;
				return [
					r.deviceCredentialName,
					r.deviceCredentialAppKey,
					r.deviceCredentialRemark
				].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw));
			});
		});
		const enabledCount = computed(() => rows.value.filter((r) => r.deviceCredentialEnabled).length);
		/** 对接平台数（SDK 直连单独算一档） */
		const platformCount = computed(() => new Set(rows.value.map((r) => r.deviceCredentialPlatformType || "sdk")).size);
		const kpis = computed(() => [
			{
				key: "vendors",
				title: "接入厂商",
				value: new Set(rows.value.map((r) => r.deviceCredentialVendor)).size,
				desc: `当前筛选 ${filteredRows.value.length} 套`,
				icon: share_default,
				iconColor: "var(--el-color-primary)"
			},
			{
				key: "total",
				title: "凭据套数",
				value: rows.value.length,
				desc: "设备可来自多套凭据",
				icon: grid_default,
				iconColor: "var(--el-color-info)"
			},
			{
				key: "enabled",
				title: "已启用",
				value: enabledCount.value,
				desc: "停用的套不参与建连",
				icon: circle_check_default,
				iconColor: "var(--el-color-success)"
			},
			{
				key: "platforms",
				title: "对接平台",
				value: platformCount.value,
				desc: "含 SDK 直连，互不干扰",
				icon: bell_default,
				iconColor: "var(--el-color-warning)"
			}
		]);
		function vendorLabel(vendor) {
			if (!vendor) return "—";
			return VENDOR_LABELS[vendor] || vendor;
		}
		/** 卡牌字母块：厂商中文首字 */
		function vendorInitial(vendor) {
			const label = vendorLabel(vendor);
			return label && label !== "—" ? label.slice(0, 1) : "?";
		}
		function vendorColor(vendor) {
			return VENDOR_TINTS[vendor || ""]?.color || "var(--el-text-color-regular)";
		}
		function vendorBg(vendor) {
			return VENDOR_TINTS[vendor || ""]?.bg || "color-mix(in srgb, var(--el-text-color-primary) 6%, transparent)";
		}
		function platformLabel(platform) {
			if (!platform) return "SDK 直连";
			const hit = Object.values(VENDOR_PLATFORMS).flat().find((p) => p.value === platform);
			return hit ? hit.label : platform;
		}
		/** SK 默认掩码展示，点一下明文/掩码切换 */
		function secretOf(row) {
			const id = row.deviceCredentialId || "";
			const raw = row.deviceCredentialAppSecret || "";
			if (!raw) return "—";
			if (revealed.value.has(id)) return raw;
			return `${raw.slice(0, 2)}${"*".repeat(Math.max(4, Math.min(10, raw.length - 2)))}${raw.slice(-2)}`;
		}
		function toggleSecret(row) {
			const id = row.deviceCredentialId || "";
			const next = new Set(revealed.value);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			revealed.value = next;
		}
		function errText(e) {
			return e?.msg || (e instanceof Error ? e.message : String(e));
		}
		async function fetchList() {
			loading.value = true;
			loadError.value = "";
			try {
				rows.value = await deviceApi.listCredentials() || [];
			} catch (e) {
				rows.value = [];
				loadError.value = errText(e);
				ElMessage.error(`凭据加载失败：${loadError.value}`);
			} finally {
				loading.value = false;
			}
		}
		function openCreate() {
			editingId.value = null;
			Object.assign(form, {
				deviceCredentialVendor: "hikvision",
				deviceCredentialPlatformType: "cloud-yao",
				deviceCredentialName: "",
				deviceCredentialAppKey: "",
				deviceCredentialAppSecret: "",
				deviceCredentialProductCode: "",
				deviceCredentialProjectId: "",
				deviceCredentialBaseUrl: "",
				deviceCredentialOfflineThreshold: 60,
				deviceCredentialEnabled: true,
				deviceCredentialRemark: ""
			});
			dialogVisible.value = true;
		}
		function openEdit(row) {
			editingId.value = row.deviceCredentialId ?? null;
			Object.assign(form, {
				deviceCredentialVendor: row.deviceCredentialVendor,
				deviceCredentialPlatformType: row.deviceCredentialPlatformType || "",
				deviceCredentialName: row.deviceCredentialName || "",
				deviceCredentialAppKey: row.deviceCredentialAppKey || "",
				deviceCredentialAppSecret: row.deviceCredentialAppSecret || "",
				deviceCredentialProductCode: row.deviceCredentialProductCode || "",
				deviceCredentialProjectId: row.deviceCredentialProjectId || "",
				deviceCredentialBaseUrl: row.deviceCredentialBaseUrl || "",
				deviceCredentialOfflineThreshold: row.deviceCredentialOfflineThreshold ?? 60,
				deviceCredentialEnabled: row.deviceCredentialEnabled ?? true,
				deviceCredentialRemark: row.deviceCredentialRemark || ""
			});
			dialogVisible.value = true;
		}
		/** 切换厂商时把平台类型重置为该厂商的首个平台，避免留下不匹配的组合 */
		function onVendorChange() {
			const opts = VENDOR_PLATFORMS[form.deviceCredentialVendor] ?? [];
			if (!opts.some((o) => o.value === form.deviceCredentialPlatformType)) form.deviceCredentialPlatformType = opts[0]?.value ?? "";
		}
		async function onSubmit() {
			if (nameInvalid.value) {
				ElMessage.warning("请填写凭据名称");
				return;
			}
			if (akSkInvalid.value) {
				ElMessage.warning("平台接入需要填写 AppKey / AppSecret");
				return;
			}
			if (cloudYaoInvalid.value) {
				ElMessage.warning("云曜平台还需要填写 ProductCode / ProjectID");
				return;
			}
			if (form.deviceCredentialOfflineThreshold <= 0) {
				ElMessage.warning("离线阈值需大于 0 秒");
				return;
			}
			dialogSaving.value = true;
			try {
				const payload = { ...form };
				if (editingId.value) {
					await deviceApi.updateCredential(editingId.value, payload);
					ElMessage.success("凭据已更新");
				} else {
					await deviceApi.createCredential(payload);
					ElMessage.success("凭据已新增");
				}
				dialogVisible.value = false;
				await fetchList();
			} catch (e) {
				ElMessage.error(`保存失败：${errText(e)}`);
			} finally {
				dialogSaving.value = false;
			}
		}
		async function onDelete(row) {
			try {
				await ElMessageBox.confirm(`确认删除凭据「${row.deviceCredentialName}」？删除后该套不再参与建连。`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deviceApi.deleteCredential(row.deviceCredentialId);
				ElMessage.success("凭据已删除");
				await fetchList();
			} catch (e) {
				ElMessage.error(`删除失败：${errText(e)}`);
			}
		}
		/** 启用/停用（方形开关与右键菜单共用） */
		async function onToggleEnabled(row, next) {
			try {
				await deviceApi.updateCredentialEnabled(row.deviceCredentialId, next);
			} catch {
				try {
					await deviceApi.updateCredential(row.deviceCredentialId, {
						...row,
						deviceCredentialEnabled: next
					});
				} catch (e) {
					ElMessage.error(`操作失败：${errText(e)}`);
					return;
				}
			}
			ElMessage.success(next ? "凭据套已启用" : "凭据套已停用");
			await fetchList();
		}
		/**
		* 手动同步设备：后端只有「单台 refresh-status」与「组织 sync」，没有厂商级设备同步接口，
		* 这里按厂商过滤设备后逐台刷新，等价于「从厂商侧把设备状态拉一遍」。
		* 待后端补 POST /api/device/provider/sync 后换成一次调用即可。
		*/
		async function onSyncDevices(row) {
			const vendor = row.deviceCredentialVendor;
			try {
				const targets = (await deviceApi.list() || []).filter((d) => d.deviceInfoVendor === vendor);
				if (!targets.length) {
					ElMessage.warning(`${vendorLabel(vendor)} 下暂无设备可同步`);
					return;
				}
				const ok = (await Promise.allSettled(targets.map((d) => deviceApi.refreshStatus(d.deviceInfoId)))).filter((r) => r.status === "fulfilled").length;
				if (ok === 0) ElMessage.error("同步失败：厂商侧未返回可用设备");
				else ElMessage.success(`已同步 ${ok}/${targets.length} 台设备（${vendorLabel(vendor)}）`);
			} catch (e) {
				ElMessage.error(`同步设备失败：${errText(e)}`);
			}
		}
		/** 手动同步组织（POST /api/device/org/sync） */
		async function onSyncOrg() {
			syncing.value = true;
			try {
				await deviceApi.syncOrg();
				ElMessage.success("组织架构已从厂商侧同步");
			} catch (e) {
				ElMessage.error(`同步组织失败：${errText(e)}`);
			} finally {
				syncing.value = false;
			}
		}
		function onCardCommand(cmd, row) {
			if (cmd === "sync-devices") return void onSyncDevices(row);
			if (cmd === "sync-org") return void onSyncOrg();
			if (cmd === "advanced") return openAdvanced(row);
			if (cmd === "toggle-enabled") return void onToggleEnabled(row, !row.deviceCredentialEnabled);
			if (cmd === "edit") return openEdit(row);
			if (cmd === "delete") return void onDelete(row);
		}
		function onResetFilters() {
			filters.vendor = "";
			filters.platform = "";
			filters.keyword = "";
		}
		function openAdvanced(row) {
			advancedRow.value = row;
			advancedThreshold.value = row.deviceCredentialOfflineThreshold ?? 60;
			Object.assign(advancedForm, advancedMap.value[row.deviceCredentialId || ""] ?? { ...DEFAULT_ADVANCED });
			advancedVisible.value = true;
		}
		async function onSaveAdvanced() {
			const row = advancedRow.value;
			const credentialId = row?.deviceCredentialId;
			if (!row || !credentialId) return;
			advancedSaving.value = true;
			try {
				const threshold = advancedThreshold.value;
				if (threshold && threshold > 0 && threshold !== row.deviceCredentialOfflineThreshold) await deviceApi.updateCredential(credentialId, {
					...row,
					deviceCredentialOfflineThreshold: threshold
				});
				advancedMap.value = {
					...advancedMap.value,
					[credentialId]: { ...advancedForm }
				};
				try {
					localStorage.setItem(ADVANCED_KEY, JSON.stringify(advancedMap.value));
				} catch {}
				ElMessage.success("高级设置已保存");
				advancedVisible.value = false;
				await fetchList();
			} catch (e) {
				ElMessage.error(`保存失败：${errText(e)}`);
			} finally {
				advancedSaving.value = false;
			}
		}
		onMounted(() => {
			fetchList();
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_dropdown_item = resolveComponent("el-dropdown-item");
			const _component_el_dropdown_menu = resolveComponent("el-dropdown-menu");
			const _component_el_dropdown = resolveComponent("el-dropdown");
			const _component_el_form = resolveComponent("el-form");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("section", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(kpis.value, (k) => {
					return openBlock(), createBlock(unref(component$1), {
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
				}), 128))]),
				createBaseVNode("section", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createVNode(unref(ReSelect_default), {
						modelValue: filters.vendor,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => filters.vendor = $event),
						placeholder: "全部厂商",
						clearable: "",
						options: unref(vendorOptions)
					}, null, 8, ["modelValue", "options"])]),
					createBaseVNode("div", _hoisted_5, [createVNode(unref(ReSelect_default), {
						modelValue: filters.platform,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filters.platform = $event),
						placeholder: "全部平台",
						clearable: "",
						options: [...Object.values(VENDOR_PLATFORMS).flat(), SDK_PLATFORM]
					}, null, 8, ["modelValue", "options"])]),
					createBaseVNode("div", _hoisted_6, [createVNode(unref(ReInput_default), {
						modelValue: filters.keyword,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => filters.keyword = $event),
						placeholder: "搜索名称 / AK / 备注...",
						clearable: "",
						"prefix-icon": "Search"
					}, null, 8, ["modelValue"])]),
					createBaseVNode("span", _hoisted_7, toDisplayString(filteredRows.value.length) + " / " + toDisplayString(rows.value.length) + " 套", 1),
					createVNode(unref(ReButton_default), {
						icon: "Search",
						"show-text": true,
						type: "primary",
						loading: loading.value,
						onClick: fetchList
					}, {
						default: withCtx(() => [..._cache[23] || (_cache[23] = [createTextVNode("查询", -1)])]),
						_: 1
					}, 8, ["loading"]),
					createBaseVNode("div", _hoisted_8, [
						createVNode(unref(ReButton_default), {
							icon: "Plus",
							layout: "square",
							type: "primary",
							tip: "新增凭据套",
							onClick: openCreate
						}),
						createVNode(unref(ReButton_default), {
							icon: "RefreshRight",
							layout: "square",
							tip: "重新加载",
							loading: loading.value,
							onClick: fetchList
						}, null, 8, ["loading"]),
						createVNode(unref(ReButton_default), {
							icon: "Delete",
							layout: "square",
							tip: "重置筛选条件",
							onClick: onResetFilters
						})
					])
				]),
				createBaseVNode("div", _hoisted_9, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(info_filled_default))]),
					_: 1
				}), _cache[24] || (_cache[24] = createBaseVNode("span", null, "凭据卡上的「更多」可手动同步设备 / 组织，并进入「高级设置」配置离线检测与自动同步。", -1))]),
				loadError.value ? (openBlock(), createElementBlock("div", _hoisted_10, [createBaseVNode("span", null, toDisplayString(loadError.value), 1), createVNode(unref(ReButton_default), {
					icon: "RefreshRight",
					layout: "square",
					tip: "重试",
					loading: loading.value,
					onClick: fetchList
				}, null, 8, ["loading"])])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_11, [
					loading.value && !rows.value.length ? (openBlock(), createElementBlock("article", _hoisted_12, [createVNode(unref(ReSkeleton_default), {
						rows: 4,
						animated: ""
					})])) : createCommentVNode("", true),
					(openBlock(true), createElementBlock(Fragment, null, renderList(filteredRows.value, (row) => {
						return openBlock(), createElementBlock("article", {
							key: row.deviceCredentialId,
							class: normalizeClass(["pcard", { "is-off": !row.deviceCredentialEnabled }])
						}, [
							createBaseVNode("header", _hoisted_13, [
								createBaseVNode("span", {
									class: "pcard__logo",
									style: normalizeStyle({
										color: vendorColor(row.deviceCredentialVendor),
										background: vendorBg(row.deviceCredentialVendor)
									})
								}, toDisplayString(vendorInitial(row.deviceCredentialVendor)), 5),
								createBaseVNode("div", _hoisted_14, [createBaseVNode("span", _hoisted_15, toDisplayString(row.deviceCredentialName || "未命名凭据"), 1), createBaseVNode("span", _hoisted_16, toDisplayString(vendorLabel(row.deviceCredentialVendor)) + " · " + toDisplayString(platformLabel(row.deviceCredentialPlatformType)), 1)]),
								createVNode(unref(ReSwitch_default), {
									"model-value": row.deviceCredentialEnabled,
									layout: "square",
									size: "small",
									icon: "Power",
									"active-icon": "CircleCheck",
									title: row.deviceCredentialEnabled ? "已启用，点击停用" : "已停用，点击启用",
									"aria-label": row.deviceCredentialEnabled ? "停用该凭据套" : "启用该凭据套",
									"onUpdate:modelValue": (v) => onToggleEnabled(row, v === true)
								}, null, 8, [
									"model-value",
									"title",
									"aria-label",
									"onUpdate:modelValue"
								])
							]),
							createBaseVNode("dl", _hoisted_17, [
								createBaseVNode("div", _hoisted_18, [_cache[25] || (_cache[25] = createBaseVNode("dt", null, "AppKey", -1)), createBaseVNode("dd", _hoisted_19, toDisplayString(row.deviceCredentialAppKey || "—"), 1)]),
								createBaseVNode("div", _hoisted_20, [_cache[26] || (_cache[26] = createBaseVNode("dt", null, "AppSecret", -1)), createBaseVNode("dd", _hoisted_21, [createBaseVNode("span", null, toDisplayString(secretOf(row)), 1), row.deviceCredentialAppSecret ? (openBlock(), createBlock(unref(ReButton_default), {
									key: 0,
									icon: revealed.value.has(row.deviceCredentialId || "") ? "Hide" : "View",
									layout: "square",
									tip: revealed.value.has(row.deviceCredentialId || "") ? "隐藏 SK" : "显示 SK",
									onClick: ($event) => toggleSecret(row)
								}, null, 8, [
									"icon",
									"tip",
									"onClick"
								])) : createCommentVNode("", true)])]),
								row.deviceCredentialProductCode ? (openBlock(), createElementBlock("div", _hoisted_22, [_cache[27] || (_cache[27] = createBaseVNode("dt", null, "ProductCode", -1)), createBaseVNode("dd", _hoisted_23, toDisplayString(row.deviceCredentialProductCode), 1)])) : createCommentVNode("", true),
								row.deviceCredentialProjectId ? (openBlock(), createElementBlock("div", _hoisted_24, [_cache[28] || (_cache[28] = createBaseVNode("dt", null, "ProjectID", -1)), createBaseVNode("dd", _hoisted_25, toDisplayString(row.deviceCredentialProjectId), 1)])) : createCommentVNode("", true),
								createBaseVNode("div", _hoisted_26, [_cache[29] || (_cache[29] = createBaseVNode("dt", null, "Endpoint", -1)), createBaseVNode("dd", _hoisted_27, toDisplayString(row.deviceCredentialBaseUrl || "内置默认地址"), 1)]),
								createBaseVNode("div", _hoisted_28, [_cache[30] || (_cache[30] = createBaseVNode("dt", null, "离线阈值", -1)), createBaseVNode("dd", null, toDisplayString(row.deviceCredentialOfflineThreshold ?? "—") + " 秒", 1)])
							]),
							createBaseVNode("div", _hoisted_29, [row.deviceCredentialRemark ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [_cache[31] || (_cache[31] = createBaseVNode("span", { class: "pcard__extra-label" }, "备注", -1)), createBaseVNode("span", _hoisted_30, toDisplayString(row.deviceCredentialRemark), 1)], 64)) : (openBlock(), createElementBlock("span", _hoisted_31, "＋ 预留信息位"))]),
							createBaseVNode("footer", _hoisted_32, [
								createVNode(unref(ReButton_default), {
									icon: "EditPen",
									"show-text": true,
									onClick: ($event) => openEdit(row)
								}, {
									default: withCtx(() => [..._cache[32] || (_cache[32] = [createTextVNode("编辑", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									icon: "Setting",
									"show-text": true,
									onClick: ($event) => openAdvanced(row)
								}, {
									default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("高级", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createBaseVNode("div", _hoisted_33, [createVNode(_component_el_dropdown, {
									trigger: "click",
									placement: "bottom-end",
									onCommand: (cmd) => onCardCommand(cmd, row)
								}, {
									dropdown: withCtx(() => [createVNode(_component_el_dropdown_menu, null, {
										default: withCtx(() => [
											createVNode(_component_el_dropdown_item, { command: "sync-devices" }, {
												default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode("手动同步设备", -1)])]),
												_: 1
											}),
											createVNode(_component_el_dropdown_item, { command: "sync-org" }, {
												default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("手动同步组织", -1)])]),
												_: 1
											}),
											createVNode(_component_el_dropdown_item, {
												command: "advanced",
												divided: ""
											}, {
												default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode("高级设置（离线 / 自动同步）", -1)])]),
												_: 1
											}),
											createVNode(_component_el_dropdown_item, { command: "toggle-enabled" }, {
												default: withCtx(() => [createTextVNode(toDisplayString(row.deviceCredentialEnabled ? "停用凭据套" : "启用凭据套"), 1)]),
												_: 2
											}, 1024),
											createVNode(_component_el_dropdown_item, { command: "edit" }, {
												default: withCtx(() => [..._cache[38] || (_cache[38] = [createTextVNode("编辑凭据", -1)])]),
												_: 1
											}),
											createVNode(_component_el_dropdown_item, {
												command: "delete",
												divided: ""
											}, {
												default: withCtx(() => [..._cache[39] || (_cache[39] = [createTextVNode("删除凭据", -1)])]),
												_: 1
											})
										]),
										_: 2
									}, 1024)]),
									default: withCtx(() => [createVNode(unref(ReButton_default), {
										icon: "MoreFilled",
										"show-text": true
									}, {
										default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("更多", -1)])]),
										_: 1
									})]),
									_: 2
								}, 1032, ["onCommand"]), createVNode(unref(ReButton_default), {
									icon: "Delete",
									layout: "square",
									tip: "删除凭据套",
									onClick: ($event) => onDelete(row)
								}, null, 8, ["onClick"])])
							])
						], 2);
					}), 128)),
					!loading.value && !filteredRows.value.length ? (openBlock(), createElementBlock("article", _hoisted_34, [createBaseVNode("div", _hoisted_35, [_cache[40] || (_cache[40] = createBaseVNode("span", { class: "pcard__logo pcard__logo--ghost" }, "?", -1)), createBaseVNode("div", _hoisted_36, [createBaseVNode("span", _hoisted_37, toDisplayString(rows.value.length ? "没有匹配的凭据套" : "还没有接入厂商凭据"), 1), createBaseVNode("span", _hoisted_38, toDisplayString(rows.value.length ? "换个厂商 / 平台或清空关键字再试" : "登记厂商开放平台的 AK/SK 后即可接入设备"), 1)])]), _cache[41] || (_cache[41] = createBaseVNode("p", { class: "pcard__ghost-text" }, " 同一 (厂商, 平台类型) 可登记多套凭据，例如按区域拆分的多个海康账号；设备可以来自多套凭据， 离线阈值与自动同步都按套生效，互不干扰。 ", -1))])) : createCommentVNode("", true),
					createBaseVNode("article", {
						class: "pcard pcard--add",
						onClick: openCreate
					}, [
						createBaseVNode("span", _hoisted_39, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(plus_default))]),
							_: 1
						})]),
						_cache[42] || (_cache[42] = createBaseVNode("span", { class: "pcard__add-title" }, "新增凭据套", -1)),
						_cache[43] || (_cache[43] = createBaseVNode("span", { class: "pcard__add-sub" }, "海康云耀 / 云眸 / 安防平台 · 大华云睿 / 乐橙 · SDK 直连", -1))
					])
				]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => dialogVisible.value = $event),
					title: editingId.value ? "编辑凭据套" : "新增凭据套",
					width: "560px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[14] || (_cache[14] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[47] || (_cache[47] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: dialogSaving.value,
						onClick: onSubmit
					}, {
						default: withCtx(() => [..._cache[48] || (_cache[48] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(_component_el_form, {
						"label-position": "top",
						class: "dpv-form"
					}, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), {
								label: "厂商",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReSelect_default), {
									modelValue: form.deviceCredentialVendor,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.deviceCredentialVendor = $event),
									options: unref(vendorOptions),
									style: { "width": "100%" },
									disabled: !!editingId.value,
									onChange: onVendorChange
								}, null, 8, [
									"modelValue",
									"options",
									"disabled"
								])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "平台类型",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReSelect_default), {
									modelValue: form.deviceCredentialPlatformType,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.deviceCredentialPlatformType = $event),
									options: [...platformOptions.value, SDK_PLATFORM],
									style: { "width": "100%" },
									disabled: !!editingId.value
								}, null, 8, [
									"modelValue",
									"options",
									"disabled"
								])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "凭据名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.deviceCredentialName,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.deviceCredentialName = $event),
									placeholder: "如「华东区账号」"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							isPlatformMode.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
								createVNode(unref(ReFormItem), {
									label: "AppKey (AK)",
									required: ""
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.deviceCredentialAppKey,
										"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.deviceCredentialAppKey = $event),
										placeholder: "厂商开放平台分配的 AppKey"
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(unref(ReFormItem), {
									label: "AppSecret (SK)",
									required: ""
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.deviceCredentialAppSecret,
										"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.deviceCredentialAppSecret = $event),
										type: "password",
										"show-password": "",
										placeholder: "厂商开放平台分配的 AppSecret"
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								form.deviceCredentialPlatformType === "cloud-yao" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ReFormItem), {
									label: "产品编码 ProductCode",
									required: ""
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.deviceCredentialProductCode,
										"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.deviceCredentialProductCode = $event),
										placeholder: "例如 1685925205802552"
									}, null, 8, ["modelValue"]), _cache[44] || (_cache[44] = createBaseVNode("span", { class: "dpv-hint" }, "云曜按产品维度隔离设备，取流 / 云台 / 门禁接口都会带上", -1))]),
									_: 1
								}), createVNode(unref(ReFormItem), {
									label: "项目 ID ProjectID",
									required: ""
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.deviceCredentialProjectId,
										"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.deviceCredentialProjectId = $event),
										placeholder: "例如 422328139543160"
									}, null, 8, ["modelValue"])]),
									_: 1
								})], 64)) : createCommentVNode("", true)
							], 64)) : (openBlock(), createBlock(unref(ReFormItem), {
								key: 1,
								label: "说明"
							}, {
								default: withCtx(() => [..._cache[45] || (_cache[45] = [createBaseVNode("span", { class: "dpv-hint" }, "SDK 局域网直连使用设备自身的 IP + 账号密码，无需 AK/SK", -1)])]),
								_: 1
							})),
							createVNode(unref(ReFormItem), { label: "Endpoint" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.deviceCredentialBaseUrl,
									"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.deviceCredentialBaseUrl = $event),
									placeholder: "留空使用内置默认地址"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "离线阈值",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
									modelValue: form.deviceCredentialOfflineThreshold,
									"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.deviceCredentialOfflineThreshold = $event),
									min: 1,
									max: 86400,
									style: { "width": "100%" }
								}, null, 8, ["modelValue"]), _cache[46] || (_cache[46] = createBaseVNode("span", { class: "dpv-hint" }, "单位：秒；阈值按套生效，只用这套接入的设备按此判定离线", -1))]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "启用" }, {
								default: withCtx(() => [createVNode(unref(ReSwitch_default), {
									modelValue: form.deviceCredentialEnabled,
									"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.deviceCredentialEnabled = $event),
									layout: "radio",
									"radio-on-label": "启用",
									"radio-off-label": "停用"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "备注" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.deviceCredentialRemark,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.deviceCredentialRemark = $event),
									placeholder: "选填，展示在卡牌的扩展信息位"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: advancedVisible.value,
					"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => advancedVisible.value = $event),
					title: "高级设置",
					width: "620px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [
						createVNode(unref(ReButton_default), { onClick: _cache[21] || (_cache[21] = ($event) => advancedVisible.value = false) }, {
							default: withCtx(() => [..._cache[59] || (_cache[59] = [createTextVNode("取消", -1)])]),
							_: 1
						}),
						createVNode(unref(ReButton_default), {
							icon: "Refresh",
							"show-text": true,
							loading: syncing.value,
							onClick: onSyncOrg
						}, {
							default: withCtx(() => [..._cache[60] || (_cache[60] = [createTextVNode("立即同步组织", -1)])]),
							_: 1
						}, 8, ["loading"]),
						createVNode(unref(ReButton_default), {
							type: "primary",
							loading: advancedSaving.value,
							onClick: onSaveAdvanced
						}, {
							default: withCtx(() => [..._cache[61] || (_cache[61] = [createTextVNode("保存", -1)])]),
							_: 1
						}, 8, ["loading"])
					]),
					default: withCtx(() => [createVNode(_component_el_form, {
						"label-position": "top",
						class: "dpv-form"
					}, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "凭据套" }, {
								default: withCtx(() => [createBaseVNode("div", _hoisted_40, [createBaseVNode("span", {
									class: "pcard__logo",
									style: normalizeStyle({
										color: vendorColor(advancedRow.value?.deviceCredentialVendor),
										background: vendorBg(advancedRow.value?.deviceCredentialVendor)
									})
								}, toDisplayString(vendorInitial(advancedRow.value?.deviceCredentialVendor)), 5), createBaseVNode("div", _hoisted_41, [createBaseVNode("span", _hoisted_42, toDisplayString(advancedRow.value?.deviceCredentialName || "未命名凭据"), 1), createBaseVNode("span", _hoisted_43, toDisplayString(vendorLabel(advancedRow.value?.deviceCredentialVendor)) + " · " + toDisplayString(platformLabel(advancedRow.value?.deviceCredentialPlatformType)) + " · 配置按套生效 ", 1)])])]),
								_: 1
							}),
							createBaseVNode("div", _hoisted_44, [_cache[51] || (_cache[51] = createBaseVNode("div", { class: "dpv-advanced__head" }, [createBaseVNode("span", { class: "dpv-panel__bar" }), createBaseVNode("span", null, "离线检测")], -1)), createBaseVNode("div", _hoisted_45, [createBaseVNode("article", _hoisted_46, [createBaseVNode("header", _hoisted_47, [createBaseVNode("span", _hoisted_48, [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(timer_default))]),
								_: 1
							})]), _cache[49] || (_cache[49] = createBaseVNode("div", { class: "acard__text" }, [createBaseVNode("span", { class: "acard__name" }, "本套离线阈值"), createBaseVNode("span", { class: "acard__sub" }, "只用这套凭据接入的设备按此判定离线")], -1))]), createBaseVNode("div", _hoisted_49, [
								createVNode(unref(ReInputNumber_default), {
									modelValue: advancedThreshold.value,
									"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => advancedThreshold.value = $event),
									min: 5,
									max: 86400,
									step: 5,
									style: { "width": "140px" },
									placeholder: "未配置"
								}, null, 8, ["modelValue"]),
								_cache[50] || (_cache[50] = createBaseVNode("span", { class: "acard__unit" }, "秒", -1)),
								advancedRow.value ? (openBlock(), createElementBlock("span", _hoisted_50, " 当前：" + toDisplayString(advancedRow.value.deviceCredentialOfflineThreshold ?? "未配置"), 1)) : createCommentVNode("", true)
							])])])]),
							createBaseVNode("div", _hoisted_51, [_cache[58] || (_cache[58] = createBaseVNode("div", { class: "dpv-advanced__head" }, [
								createBaseVNode("span", { class: "dv-panel__bar" }),
								createBaseVNode("span", null, "自动同步"),
								createBaseVNode("span", { class: "dpv-advanced__hint" }, "预留：后端暂无自动同步接口，当前配置只保存在本机")
							], -1)), createBaseVNode("div", _hoisted_52, [createBaseVNode("article", _hoisted_53, [createBaseVNode("header", _hoisted_54, [
								createBaseVNode("span", _hoisted_55, [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(download_default))]),
									_: 1
								})]),
								_cache[52] || (_cache[52] = createBaseVNode("div", { class: "acard__text" }, [createBaseVNode("span", { class: "acard__name" }, "设备自动同步"), createBaseVNode("span", { class: "acard__sub" }, "定时从厂商平台拉取设备列表")], -1)),
								createVNode(unref(ReSwitch_default), {
									"model-value": advancedForm.deviceSync,
									layout: "square",
									size: "small",
									icon: "Power",
									"active-icon": "CircleCheck",
									title: advancedForm.deviceSync ? "已开启" : "已关闭",
									"onUpdate:modelValue": _cache[17] || (_cache[17] = (v) => advancedForm.deviceSync = v === true)
								}, null, 8, ["model-value", "title"])
							]), createBaseVNode("div", _hoisted_56, [
								_cache[53] || (_cache[53] = createBaseVNode("span", { class: "acard__label" }, "间隔", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: advancedForm.deviceInterval,
									"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => advancedForm.deviceInterval = $event),
									min: 1,
									max: 1440,
									disabled: !advancedForm.deviceSync,
									style: { "width": "130px" }
								}, null, 8, ["modelValue", "disabled"]),
								_cache[54] || (_cache[54] = createBaseVNode("span", { class: "acard__unit" }, "分钟", -1))
							])]), createBaseVNode("article", _hoisted_57, [createBaseVNode("header", _hoisted_58, [
								createBaseVNode("span", _hoisted_59, [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(share_default))]),
									_: 1
								})]),
								_cache[55] || (_cache[55] = createBaseVNode("div", { class: "acard__text" }, [createBaseVNode("span", { class: "acard__name" }, "组织自动同步"), createBaseVNode("span", { class: "acard__sub" }, "定时同步厂商侧组织架构")], -1)),
								createVNode(unref(ReSwitch_default), {
									"model-value": advancedForm.orgSync,
									layout: "square",
									size: "small",
									icon: "Power",
									"active-icon": "CircleCheck",
									title: advancedForm.orgSync ? "已开启" : "已关闭",
									"onUpdate:modelValue": _cache[19] || (_cache[19] = (v) => advancedForm.orgSync = v === true)
								}, null, 8, ["model-value", "title"])
							]), createBaseVNode("div", _hoisted_60, [
								_cache[56] || (_cache[56] = createBaseVNode("span", { class: "acard__label" }, "间隔", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: advancedForm.orgInterval,
									"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => advancedForm.orgInterval = $event),
									min: 1,
									max: 1440,
									disabled: !advancedForm.orgSync,
									style: { "width": "130px" }
								}, null, 8, ["modelValue", "disabled"]),
								_cache[57] || (_cache[57] = createBaseVNode("span", { class: "acard__unit" }, "分钟", -1))
							])])])])
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-6aa598ae"]]);
//#endregion
export { DeviceProviderView_default as default };
