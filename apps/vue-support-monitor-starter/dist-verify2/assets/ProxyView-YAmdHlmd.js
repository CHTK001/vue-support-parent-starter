import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { N as data_analysis_default, Ot as postcard_default, Zt as tickets_default, v as circle_check_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReStatCard-BGjVHdD2.js";
//#region src/views/ProxyView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "px" };
var _hoisted_2 = { class: "px-kpis" };
var _hoisted_3 = { class: "px-panel px-filter" };
var _hoisted_4 = { class: "px-field px-field--search" };
var _hoisted_5 = { class: "px-field" };
var _hoisted_6 = { class: "px-field" };
var _hoisted_7 = { class: "px-filter__meta" };
var _hoisted_8 = { class: "px-toolbar-ops" };
var _hoisted_9 = { class: "px-panel px-table-card" };
var _hoisted_10 = {
	key: 0,
	class: "px-fetching"
};
var _hoisted_11 = {
	key: 1,
	class: "px-table-empty"
};
var _hoisted_12 = { class: "px-addr mono" };
var _hoisted_13 = { class: "px-addr__port" };
var _hoisted_14 = {
	key: 1,
	class: "px-dash"
};
var _hoisted_15 = { class: "px-status" };
var _hoisted_16 = { class: "px-status__text" };
var _hoisted_17 = {
	key: 0,
	class: "px-time mono"
};
var _hoisted_18 = {
	key: 1,
	class: "px-dash"
};
var _hoisted_19 = { class: "px-ops" };
var _hoisted_20 = { class: "proxy-form" };
var _hoisted_21 = {
	key: 0,
	class: "px-hint"
};
var BASE = "/ms/server/proxy";
/** 读取窗口：覆盖一个抓取批次（500 条），超出时页面显式提示被截断 */
var LIST_LIMIT = 100;
//#endregion
//#region src/views/ProxyView.vue
var ProxyView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ProxyView",
	setup(__props) {
		/**
		* 代理管理 —— 免费代理（业务）
		* 后台代理表 ms_proxy（每次获取免费代理时清空重录——自研抓取 databay 源）；
		* 页面免费代理从数据表读取（/ms/server/proxy/list——快）；
		* 获取免费代理走 /ms/server/proxy/free（抓取→清空→录入——较慢）。
		*
		* 视觉：4 张 ReStatCard 统计卡（紧凑档横排）+ 筛选/操作合并条 + 吃满剩余高度的表格卡。
		* 顶部原先的大标题 hero 已删除——页面标题由外壳面包屑承担（「监控管理 / 代理管理」），
		* hero 上的 4 个操作按钮已合并到「查询」按钮右侧，改成图标 + tip（ReButton square 布局），
		* 单行内完成筛选与全部操作，不再额外占一整块纵向空间。
		* 样式统一使用 koi/Element Plus 变量（--el-*、--el-radius-*、--metric-*），不写死品牌色。
		*
		* 说明：已移除「当前代理」卡片——当前代理 = 代理表第一条（host:port），
		* 由系统自动管理、无业务消费方（代理仅用于抓取/刷新），页面展示无操作价值；
		* 后端 /ms/server/proxy/current 端点保留（供其他业务方调用）。
		* @author CH
		* @since 4.0.0
		*/
		const PROTOCOL_OPTIONS = [
			{
				label: "Http",
				value: "Http"
			},
			{
				label: "Https",
				value: "Https"
			},
			{
				label: "Socks4",
				value: "Socks4"
			},
			{
				label: "Socks5",
				value: "Socks5"
			}
		];
		/** 探测状态下拉（值与后端 ProxyService.STATUS_* 对齐；留空 = 全部，走 placeholder） */
		const STATUS_OPTIONS = [
			{
				label: "未检测",
				value: "unchecked"
			},
			{
				label: "可达",
				value: "reachable"
			},
			{
				label: "不可达",
				value: "unreachable"
			}
		];
		const freeList = ref([]);
		const fetching = ref(false);
		const checking = ref(false);
		const loading = ref(false);
		const filters = reactive({
			protocol: "",
			status: "",
			keyword: ""
		});
		const formVisible = ref(false);
		const saving = ref(false);
		const editingId = ref(null);
		const form = reactive({
			host: "",
			port: 80,
			protocol: "Http",
			source: ""
		});
		/** 总代理数 */
		const kpiTotal = computed(() => freeList.value.length);
		/** Http 家族数量（Http + Https） */
		const kpiHttp = computed(() => freeList.value.filter((p) => (p.protocol ?? "Http").toLowerCase().startsWith("http")).length);
		/** Socks 家族数量（Socks4 + Socks5） */
		const kpiSocks = computed(() => freeList.value.filter((p) => (p.protocol ?? "").toLowerCase().startsWith("socks")).length);
		/** 已检测数量（以探测时间为准） */
		const checkedCount = computed(() => freeList.value.filter((p) => p.checkTime != null).length);
		/** 待检测数量（总代理数卡的描述） */
		const uncheckedCount = computed(() => kpiTotal.value - checkedCount.value);
		/** 已检测且可达的数量 */
		const reachableCount = computed(() => freeList.value.filter((p) => p.checkTime != null && p.reachable).length);
		/** 可用率：已检测中可达占比（未检测不参与分母，避免拉取后长期显示 0%） */
		const kpiAvailability = computed(() => {
			if (!checkedCount.value) return "0%";
			return `${Math.round(reachableCount.value / checkedCount.value * 100)}%`;
		});
		/**
		* KPI 卡片定义。
		*
		* <p>{@code icon} 必须是组件（ReStatCard 内部走 {@code <component :is="icon" />}），
		* 所以这里直接引用 @element-plus/icons-vue 的组件，不再传图标名字符串；
		* {@code iconColor} 沿用原有的 koi 令牌（原先散在样式区的 --tile 值上移到数据里，
		* 不写死品牌色）。</p>
		*/
		const kpis = computed(() => [
			{
				key: "total",
				title: "总代理数",
				value: kpiTotal.value,
				desc: `待检 ${uncheckedCount.value}`,
				icon: tickets_default,
				iconColor: "var(--brand-500, var(--el-color-primary))"
			},
			{
				key: "http",
				title: "Http",
				value: kpiHttp.value,
				desc: "Http + Https",
				icon: postcard_default,
				iconColor: "var(--metric-cpu, var(--el-color-primary))"
			},
			{
				key: "socks",
				title: "Socks5",
				value: kpiSocks.value,
				desc: "含 Socks4",
				icon: circle_check_default,
				iconColor: "var(--el-color-success)"
			},
			{
				key: "availability",
				title: "可用率",
				value: kpiAvailability.value,
				desc: `可达 ${reachableCount.value} / 已检 ${checkedCount.value}`,
				icon: data_analysis_default,
				iconColor: "var(--metric-disk, var(--el-color-warning))"
			}
		]);
		/**
		* 统一 GET 请求（本页自行提示错误，故关掉全局 toast 以免重复）
		* @param path 子路径
		* @param params 查询参数
		* @param timeout 超时毫秒
		*/
		async function get(path, params, timeout) {
			let req = http().get(BASE + path).noToast(true);
			if (params) req = req.query(params);
			if (timeout) req = req.timeout(timeout);
			return unwrapResult(await req);
		}
		/** 加载代理列表（按当前筛选条件读表） */
		async function loadList() {
			loading.value = true;
			try {
				const list = await get("/list", {
					protocol: filters.protocol || void 0,
					status: filters.status || void 0,
					keyword: filters.keyword.trim() || void 0,
					limit: LIST_LIMIT
				}) ?? [];
				freeList.value = list.map((p) => ({
					...p,
					protocol: p.protocol || "Http",
					source: p.source || "databay"
				}));
			} catch (e) {
				message.error(`加载代理列表失败: ${errText(e)}`);
			} finally {
				loading.value = false;
			}
		}
		/** 获取免费代理（后端抓取→清空表→录入——较慢——加载等待动画） */
		async function fetchFree() {
			fetching.value = true;
			try {
				const fetched = await get("/free", void 0, 12e4) ?? [];
				await loadList();
				if (!fetched.length) message.warning("暂未获取到免费代理（外部代理源可能超时，代理表已保留）");
				else message.success(`获取到 ${fetched.length} 个免费代理（已录入代理表）`);
			} catch (e) {
				message.error(`获取失败: ${errText(e)}`);
			} finally {
				fetching.value = false;
			}
		}
		/** 批量检测（后端并发探测、全部收敛后才返回） */
		async function checkAll() {
			if (!freeList.value.length) {
				message.warning("代理表为空，请先获取免费代理或手工新增");
				return;
			}
			checking.value = true;
			try {
				const msg = await get("/check", void 0, 3e5);
				message.success(msg || "批量检测完成");
				await loadList();
			} catch (e) {
				message.error(`批量检测失败: ${errText(e)}`);
			} finally {
				checking.value = false;
			}
		}
		/**
		* 检测单个代理
		* @param row 代理行
		*/
		async function checkOne(row) {
			if (row.id == null) {
				message.error("该行缺少代理主键，无法检测");
				return;
			}
			try {
				await get(`/check/${row.id}`, void 0, 6e4);
				message.success(`${row.host}:${row.port} 检测完成`);
				loadList();
			} catch (e) {
				message.error(`检测失败: ${errText(e)}`);
			}
		}
		/** 打开新增弹窗 */
		function openCreate() {
			editingId.value = null;
			Object.assign(form, {
				host: "",
				port: 80,
				protocol: "Http",
				source: ""
			});
			formVisible.value = true;
		}
		/**
		* 打开编辑弹窗
		* @param row 代理行
		*/
		function openEdit(row) {
			editingId.value = row.id;
			Object.assign(form, {
				host: row.host,
				port: row.port,
				protocol: row.protocol || "Http",
				source: row.source ?? ""
			});
			formVisible.value = true;
		}
		/** 保存新增/编辑 */
		async function saveForm() {
			if (!form.host.trim()) {
				message.warning("请填写代理主机");
				return;
			}
			if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
				message.warning("代理端口必须是 1~65535 之间的整数");
				return;
			}
			saving.value = true;
			const body = {
				host: form.host.trim(),
				port: form.port,
				protocol: form.protocol,
				source: form.source.trim()
			};
			try {
				const req = editingId.value == null ? http().post(BASE).noToast(true).data(body) : http().put(`${BASE}/${editingId.value}`).noToast(true).data(body);
				const saved = unwrapResult(await req);
				message.success(editingId.value == null ? "已新增代理" : "已更新代理（探测结果已重置）");
				formVisible.value = false;
				await loadList();
				if (saved) checkOne(saved);
			} catch (e) {
				message.error(`保存失败: ${errText(e)}`);
			} finally {
				saving.value = false;
			}
		}
		/**
		* 删除单条代理
		* @param row 代理行
		*/
		async function removeOne(row) {
			try {
				await ElMessageBox.confirm(`删除代理「${row.host}:${row.port}」？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				unwrapResult(await http().delete(`${BASE}/${row.id}`).noToast(true));
				message.success("已删除");
				loadList();
			} catch (e) {
				message.error(`删除失败: ${errText(e)}`);
			}
		}
		/** 清空代理表 */
		async function clearAll() {
			try {
				await ElMessageBox.confirm("清空整张代理表？该操作不可撤销（可重新获取免费代理）", "清空确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				const removed = unwrapResult(await http().delete(BASE).noToast(true));
				message.success(`已清空 ${removed ?? 0} 条代理`);
				loadList();
			} catch (e) {
				message.error(`清空失败: ${errText(e)}`);
			}
		}
		/**
		* 把异常还原成可读文案（拦截器以 {code,msg} 纯对象 reject，业务提示在 msg 上）
		* @param e 异常
		*/
		function errText(e) {
			const err = e;
			return err?.msg || err?.message || String(e);
		}
		/**
		* 探测状态文案（未检测以探测时间为准，不能拿数据库缺省的 0 当「不可达」）
		* @param row 代理行
		*/
		function statusText(row) {
			if (row.checkTime == null) return "未检测";
			if (!row.reachable) return "不可达";
			return row.delay != null && row.delay > 1e3 ? "延迟高" : "可达";
		}
		/**
		* 探测状态圆点样式（koi 语义色：success / warning / danger / placeholder）
		* @param row 代理行
		*/
		function statusClass(row) {
			const text = statusText(row);
			if (text === "未检测") return "is-unknown";
			if (text === "可达") return "is-ok";
			if (text === "延迟高") return "is-warn";
			return "is-error";
		}
		/**
		* 协议胶囊样式（Http 家族主色淡底，Socks/其它中性）
		* @param row 代理行
		*/
		function protocolClass(row) {
			const proto = (row.protocol ?? "Http").toLowerCase();
			if (proto.startsWith("http")) return "is-http";
			if (proto.startsWith("socks")) return "is-socks";
			return "is-other";
		}
		/**
		* 延迟着色（<1s 好 / <3s 偏高 / 其余差）
		* @param row 代理行
		*/
		function delayClass(row) {
			if (row.delay == null) return "";
			if (row.delay < 1e3) return "is-good";
			if (row.delay < 3e3) return "is-warn";
			return "is-bad";
		}
		/**
		* 最近检测时间
		* @param row 代理行
		*/
		function checkTimeText(row) {
			if (row.checkTime == null) return "";
			return new Date(row.checkTime).toLocaleString("zh-CN", { hour12: false });
		}
		onMounted(loadList);
		return (_ctx, _cache) => {
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_Loading = resolveComponent("Loading");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("section", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(kpis.value, (k) => {
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
				}), 128))]),
				createBaseVNode("section", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createVNode(_component_ReInput, {
						modelValue: filters.keyword,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => filters.keyword = $event),
						placeholder: "搜索代理主机...",
						clearable: "",
						"prefix-icon": "Search",
						onKeyup: withKeys(loadList, ["enter"])
					}, null, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_5, [createVNode(_component_ReSelect, {
						modelValue: filters.protocol,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filters.protocol = $event),
						placeholder: "全部协议",
						clearable: "",
						options: PROTOCOL_OPTIONS,
						onChange: loadList
					}, null, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_6, [createVNode(_component_ReSelect, {
						modelValue: filters.status,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => filters.status = $event),
						placeholder: "请选择",
						clearable: "",
						options: STATUS_OPTIONS,
						onChange: loadList
					}, null, 8, ["modelValue"])]),
					createBaseVNode("span", _hoisted_7, [createTextVNode(toDisplayString(freeList.value.length) + " 条", 1), freeList.value.length >= LIST_LIMIT ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("（已达窗口上限，请缩小筛选）")], 64)) : createCommentVNode("", true)]),
					createVNode(_component_ReButton, {
						icon: "Search",
						"show-text": true,
						type: "primary",
						loading: loading.value,
						onClick: loadList
					}, {
						default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("查询", -1)])]),
						_: 1
					}, 8, ["loading"]),
					createBaseVNode("div", _hoisted_8, [
						createVNode(_component_ReButton, {
							icon: "Plus",
							layout: "square",
							tip: "新增代理",
							onClick: openCreate
						}),
						createVNode(_component_ReButton, {
							icon: "MagicStick",
							layout: "square",
							type: "primary",
							tip: "获取免费代理（抓取外部源并清空重录）",
							loading: fetching.value,
							onClick: fetchFree
						}, null, 8, ["loading"]),
						createVNode(_component_ReButton, {
							icon: "Monitor",
							layout: "square",
							tip: "批量检测",
							loading: checking.value,
							onClick: checkAll
						}, null, 8, ["loading"]),
						createVNode(_component_ReButton, {
							icon: "Delete",
							layout: "square",
							type: "danger",
							tip: "清空代理表",
							disabled: !freeList.value.length,
							onClick: clearAll
						}, null, 8, ["disabled"])
					])
				]),
				createBaseVNode("section", _hoisted_9, [fetching.value ? (openBlock(), createElementBlock("div", _hoisted_10, [createVNode(_component_el_icon, { class: "is-loading" }, {
					default: withCtx(() => [createVNode(_component_Loading)]),
					_: 1
				}), _cache[10] || (_cache[10] = createBaseVNode("span", null, "正在获取免费代理…（抓取外部源较慢，请稍候）", -1))])) : !freeList.value.length ? (openBlock(), createElementBlock("div", _hoisted_11, [createVNode(_component_ReEmpty, {
					description: "暂无代理，点击「获取免费代理」拉取代理源或「新增代理」手工录入",
					"image-size": 80
				})])) : (openBlock(), createBlock(_component_ReTable, {
					key: 2,
					data: freeList.value,
					loading: loading.value,
					columns: [
						{
							prop: "addr",
							label: "代理地址",
							minWidth: 220,
							slot: "addr"
						},
						{
							prop: "protocol",
							label: "协议",
							width: 130,
							slot: "protocol"
						},
						{
							prop: "source",
							label: "来源",
							minWidth: 130
						},
						{
							prop: "delay",
							label: "延迟",
							width: 110,
							slot: "delay"
						},
						{
							prop: "reachable",
							label: "状态",
							width: 140,
							slot: "reachable"
						},
						{
							prop: "checkTime",
							label: "最近检测",
							width: 190,
							slot: "checkTime"
						},
						{
							prop: "actions",
							label: "操作",
							width: 170,
							slot: "actions"
						}
					],
					size: "default",
					border: false,
					stripe: false,
					"table-id": "proxy-list",
					class: "proxy-table"
				}, {
					"col-addr": withCtx(({ row }) => [createBaseVNode("span", _hoisted_12, [createTextVNode(toDisplayString(row.host) + ":", 1), createBaseVNode("span", _hoisted_13, toDisplayString(row.port), 1)])]),
					"col-protocol": withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["proto-pill", protocolClass(row)]) }, toDisplayString(row.protocol || "Http"), 3)]),
					"col-delay": withCtx(({ row }) => [row.delay != null && row.reachable ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: normalizeClass(["px-delay", delayClass(row)])
					}, toDisplayString(row.delay) + "ms", 3)) : (openBlock(), createElementBlock("span", _hoisted_14, "—"))]),
					"col-reachable": withCtx(({ row }) => [createBaseVNode("span", _hoisted_15, [createBaseVNode("span", { class: normalizeClass(["px-status__dot", statusClass(row)]) }, null, 2), createBaseVNode("span", _hoisted_16, toDisplayString(statusText(row)), 1)])]),
					"col-checkTime": withCtx(({ row }) => [row.checkTime != null ? (openBlock(), createElementBlock("span", _hoisted_17, toDisplayString(checkTimeText(row)), 1)) : (openBlock(), createElementBlock("span", _hoisted_18, "—"))]),
					"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_19, [
						createVNode(_component_ReButton, {
							icon: "Connection",
							layout: "square",
							title: "检测",
							disabled: row.id == null,
							class: "px-op px-op--check",
							onClick: ($event) => checkOne(row)
						}, null, 8, ["disabled", "onClick"]),
						createVNode(_component_ReButton, {
							icon: "EditPen",
							layout: "square",
							title: "编辑",
							class: "px-op px-op--edit",
							onClick: ($event) => openEdit(row)
						}, null, 8, ["onClick"]),
						createVNode(_component_ReButton, {
							icon: "Delete",
							layout: "square",
							title: "删除",
							class: "px-op px-op--delete",
							onClick: ($event) => removeOne(row)
						}, null, 8, ["onClick"])
					])]),
					_: 1
				}, 8, ["data", "loading"]))]),
				createVNode(_component_ReDialog, {
					modelValue: formVisible.value,
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => formVisible.value = $event),
					title: editingId.value == null ? "新增代理" : "编辑代理",
					width: "480px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[7] || (_cache[7] = ($event) => formVisible.value = false) }, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: saving.value,
						onClick: saveForm
					}, {
						default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_20, [
						createVNode(_component_ReFormItem, {
							label: "代理主机",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.host,
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.host = $event),
								placeholder: "如 127.0.0.1 或 proxy.example.com"
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, {
							label: "代理端口",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_ReInputNumber, {
								modelValue: form.port,
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.port = $event),
								min: 1,
								max: 65535,
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, {
							label: "协议",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_ReSelect, {
								modelValue: form.protocol,
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.protocol = $event),
								style: { "width": "100%" },
								options: PROTOCOL_OPTIONS
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, { label: "来源" }, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.source,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.source = $event),
								placeholder: "留空记为 manual"
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						editingId.value != null ? (openBlock(), createElementBlock("p", _hoisted_21, "保存后探测结论会重置为未检测，需要时再点击行内「检测」。")) : createCommentVNode("", true)
					])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-c3f33b12"]]);
//#endregion
export { ProxyView_default as default };
