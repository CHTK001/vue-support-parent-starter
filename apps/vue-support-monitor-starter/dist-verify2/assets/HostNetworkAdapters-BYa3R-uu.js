import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, St as resolveComponent, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { F as saveIPv4Config, d as fetchAdapters, u as fetchAdapterDetail, x as fetchIPv4Config } from "./monitorApi-CwY9j0MY.js";
//#region src/components/NetAdapterGlyph.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = ["width", "height"];
//#endregion
//#region src/components/NetAdapterGlyph.vue
var NetAdapterGlyph_default = /* @__PURE__ */ defineComponent({
	name: "NetAdapterGlyph",
	__name: "NetAdapterGlyph",
	props: {
		kind: { default: "ethernet" },
		size: { default: 26 }
	},
	setup(__props) {
		/**
		* 网卡类型图标。
		*
		* <p>统一替代原先「板卡 + 锯齿」在小尺寸下像通用图片占位符的内联 SVG：
		* 以太网显示 RJ45 水晶头、无线显示 Wi-Fi 弧线、回环显示环形箭头。</p>
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("svg", {
				viewBox: "0 0 48 48",
				width: __props.size,
				height: __props.size,
				"aria-hidden": "true"
			}, [__props.kind === "ethernet" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [_cache[0] || (_cache[0] = createStaticVNode("<path d=\"M24 3 V10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.4\" stroke-linecap=\"round\"></path><path d=\"M15 12 l-2.6 -5 h23.2 L33 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path><rect x=\"13\" y=\"10\" width=\"22\" height=\"19\" rx=\"2.6\" fill=\"currentColor\" opacity=\"0.12\" stroke=\"currentColor\" stroke-width=\"2\"></rect><rect x=\"11.5\" y=\"26\" width=\"25\" height=\"10\" rx=\"2\" fill=\"currentColor\" opacity=\"0.22\" stroke=\"currentColor\" stroke-width=\"2\"></rect><g stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"><line x1=\"15\" y1=\"28.4\" x2=\"15\" y2=\"33.6\"></line><line x1=\"17.9\" y1=\"28.4\" x2=\"17.9\" y2=\"33.6\"></line><line x1=\"20.7\" y1=\"28.4\" x2=\"20.7\" y2=\"33.6\"></line><line x1=\"23.6\" y1=\"28.4\" x2=\"23.6\" y2=\"33.6\"></line><line x1=\"26.4\" y1=\"28.4\" x2=\"26.4\" y2=\"33.6\"></line><line x1=\"29.3\" y1=\"28.4\" x2=\"29.3\" y2=\"33.6\"></line><line x1=\"32.1\" y1=\"28.4\" x2=\"32.1\" y2=\"33.6\"></line><line x1=\"35\" y1=\"28.4\" x2=\"35\" y2=\"33.6\"></line></g>", 5))], 64)) : __props.kind === "wifi" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
				_cache[1] || (_cache[1] = createBaseVNode("path", {
					d: "M6.5 16 a25 25 0 0 1 35 0",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.6",
					"stroke-linecap": "round"
				}, null, -1)),
				_cache[2] || (_cache[2] = createBaseVNode("path", {
					d: "M11.5 22 a18 18 0 0 1 25 0",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.6",
					"stroke-linecap": "round"
				}, null, -1)),
				_cache[3] || (_cache[3] = createBaseVNode("path", {
					d: "M16.5 28 a11 11 0 0 1 15 0",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.6",
					"stroke-linecap": "round"
				}, null, -1)),
				_cache[4] || (_cache[4] = createBaseVNode("circle", {
					cx: "24",
					cy: "35",
					r: "3.2",
					fill: "currentColor"
				}, null, -1))
			], 64)) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [_cache[5] || (_cache[5] = createBaseVNode("path", {
				d: "M14 26 a10 10 0 1 1 2.6 7.4",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2.6",
				"stroke-linecap": "round"
			}, null, -1)), _cache[6] || (_cache[6] = createBaseVNode("path", {
				d: "M12 27 l2.4 6.2 6 -2.8",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2.6",
				"stroke-linecap": "round",
				"stroke-linejoin": "round"
			}, null, -1))], 64))], 8, _hoisted_1$1);
		};
	}
});
//#endregion
//#region src/components/HostNetworkAdapters.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "hna" };
var _hoisted_2 = {
	key: 0,
	class: "ncpa-grid"
};
var _hoisted_3 = { class: "nt-icon" };
var _hoisted_4 = { class: "nt-meta" };
var _hoisted_5 = { class: "nt-name" };
var _hoisted_6 = { class: "nt-status" };
var _hoisted_7 = {
	key: 0,
	class: "nt-ip mono"
};
var _hoisted_8 = { class: "nt-actions" };
var _hoisted_9 = {
	key: 1,
	class: "hna-tbl"
};
var _hoisted_10 = {
	key: 0,
	class: "hna-loading"
};
var _hoisted_11 = {
	key: 1,
	class: "kv-list"
};
var _hoisted_12 = { class: "kv-label" };
var _hoisted_13 = { class: "props-box" };
var _hoisted_14 = ["onDblclick"];
var _hoisted_15 = { class: "pi-name" };
var _hoisted_16 = {
	key: 0,
	class: "hna-loading"
};
var _hoisted_17 = {
	key: 1,
	class: "ipv4"
};
var _hoisted_18 = {
	key: 0,
	class: "ip-fields"
};
var _hoisted_19 = { class: "ipf" };
var _hoisted_20 = { class: "ipf" };
var _hoisted_21 = { class: "ipf-wrap" };
var _hoisted_22 = { class: "ipf-hint mono" };
var _hoisted_23 = { class: "ipf" };
var _hoisted_24 = {
	key: 1,
	class: "ip-fields"
};
var _hoisted_25 = { class: "ipf" };
var _hoisted_26 = { class: "ipf" };
//#endregion
//#region src/components/HostNetworkAdapters.vue
var HostNetworkAdapters_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "HostNetworkAdapters",
	props: {
		hostId: {},
		rows: {},
		platform: {}
	},
	emits: ["applied"],
	setup(__props, { emit: __emit }) {
		/**
		* 主机网络（网卡）—— Windows「网络连接(ncpa.cpl)」风格
		*  - Windows：网卡磁贴（图标 + 名称 + 状态），支持「状态 / 属性」
		*  - 属性里「Internet 协议版本 4 (TCP/IPv4)」可编辑：DHCP / 静态 IP、前缀、网关、首选/备用 DNS
		*  - 非 Windows：退回通用表格
		* 数据经后端按采集通道（本机 / agent / SSH / WinRM）下发 PowerShell 读取与配置。
		*/
		const props = __props;
		const emit = __emit;
		/** 是否 Windows（决定磁贴视图） */
		const isWindows = computed(() => String(props.platform || "").toUpperCase().includes("WIN"));
		/** Windows 系统网卡列表（名称与 Get-NetAdapter 一致），加载失败回退分区 rows */
		const winRows = ref([]);
		const winLoaded = ref(false);
		async function loadWinAdapters() {
			if (!isWindows.value) return;
			try {
				const list = await fetchAdapters(props.hostId);
				winRows.value = (list ?? []).map((d) => ({
					name: d.name,
					status: d.status,
					ipv4: (d.ipv4Addresses ?? []).join(", "),
					mac: d.macAddress ?? "",
					description: d.description ?? "",
					linkSpeed: d.linkSpeed ?? ""
				}));
				winLoaded.value = true;
			} catch {
				winLoaded.value = false;
			}
		}
		/** 归一化 MAC：小写并去掉 - : 等分隔符，便于跨来源比对 */
		function normMac(s) {
			return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
		}
		/**
		* 磁贴数据源：通用网络枚举（props.rows，全接口含虚拟/回环/隧道）与系统网卡列表
		* （Get-NetAdapter，慢、物理网卡为主，带状态/速率/描述）合并。
		*
		* <p>两来源命名不同（通用枚举是 eth4/net4，系统列表是「以太网」），改用 MAC（归一化）
		* 与 IPv4 关联：匹配上的用系统网卡的可读名与 Up 状态富集，匹配不上的（如 ISATAP 隧道
		* net4）原样保留 —— 慢加载只补字段、不再整体替换或新增重复卡，任何网卡都不消失。</p>
		*/
		const tiles = computed(() => {
			if (!isWindows.value) return props.rows;
			const map = /* @__PURE__ */ new Map();
			const macIdx = /* @__PURE__ */ new Map();
			const ipIdx = /* @__PURE__ */ new Map();
			for (const r of props.rows) {
				const key = String(r.name);
				map.set(key, {
					...r,
					mac: r.mac || ""
				});
				const m = normMac(r.mac);
				if (m) macIdx.set(m, key);
				String(r.ipv4 || "").split(/[,\s]+/).filter(Boolean).forEach((ip) => ipIdx.set(ip, key));
			}
			for (const w of winRows.value) {
				const wm = normMac(w.mac);
				const wips = String(w.ipv4 || "").split(/[,\s]+/).filter(Boolean);
				const hitKey = (wm ? macIdx.get(wm) : void 0) || wips.map((ip) => ipIdx.get(ip)).find(Boolean);
				if (hitKey) {
					const ex = map.get(hitKey);
					if (ex) {
						const merged = {
							...ex,
							name: w.name,
							status: w.status || ex.status,
							ipv4: w.ipv4 || ex.ipv4,
							mac: ex.mac || w.mac,
							description: w.description || ex.description,
							linkSpeed: w.linkSpeed || ex.linkSpeed
						};
						map.delete(hitKey);
						map.set(w.name, merged);
						if (wm) macIdx.set(wm, w.name);
						wips.forEach((ip) => ipIdx.set(ip, w.name));
					}
				} else map.set(w.name, { ...w });
			}
			return [...map.values()];
		});
		onMounted(loadWinAdapters);
		watch(() => [props.hostId, props.platform], () => {
			if (!winLoaded.value) loadWinAdapters();
		});
		/** 网卡是否处于连接（Up） */
		function isUp(r) {
			const s = String(r.status ?? "").toLowerCase();
			return s.includes("up") || s.includes("connected") || s.includes("已连接");
		}
		/** 按网卡名 / 描述判定图标类型：无线 → wifi，回环 → loopback，其余以太网 */
		function adapterKind(r) {
			const text = `${r.name ?? ""} ${r.description ?? ""}`.toLowerCase();
			if (/wi-?fi|wlan|wireless|802\.11/.test(text)) return "wifi";
			if (/loopback|^\s*lo\b/.test(text)) return "loopback";
			return "ethernet";
		}
		/** Windows 风格状态文案 */
		function statusText(r) {
			const s = String(r.status ?? "").toLowerCase();
			if (s.includes("disabled") || s.includes("禁用")) return "已禁用";
			if (s.includes("up") || s.includes("connected")) return "已连接";
			if (s.includes("disconnect") || s.includes("拔出")) return "网络电缆被拔出";
			return s ? r.status : "—";
		}
		const statusVisible = ref(false);
		const statusLoading = ref(false);
		const detail = ref(null);
		const detailRows = computed(() => {
			const d = detail.value;
			if (!d) return [];
			const join = (a) => a && a.length ? a.join("，") : "—";
			return [
				{
					label: "连接状态",
					value: d.status || "—"
				},
				{
					label: "网卡描述",
					value: d.description || "—"
				},
				{
					label: "链路速率",
					value: d.linkSpeed || "—"
				},
				{
					label: "物理地址 (MAC)",
					value: d.macAddress || "—",
					mono: true
				},
				{
					label: "MTU",
					value: d.mtu ? String(d.mtu) : "—",
					mono: true
				},
				{
					label: "地址获取方式",
					value: d.dhcpEnabled ? "DHCP 自动获取" : "静态地址"
				},
				{
					label: "IPv4 地址",
					value: join(d.ipv4Addresses),
					mono: true
				},
				{
					label: "IPv6 地址",
					value: join(d.ipv6Addresses),
					mono: true
				},
				{
					label: "默认网关",
					value: join(d.gateways),
					mono: true
				},
				{
					label: "DNS 服务器",
					value: join(d.dnsServers),
					mono: true
				}
			];
		});
		async function openStatus(r) {
			statusVisible.value = true;
			statusLoading.value = true;
			detail.value = null;
			try {
				detail.value = await fetchAdapterDetail(props.hostId, String(r.name));
			} finally {
				statusLoading.value = false;
			}
		}
		const propsVisible = ref(false);
		const activeAdapter = ref(null);
		/** 属性列表（模拟 Windows 网卡属性「网络」选项卡，仅 IPv4 可编辑） */
		const propertyItems = [
			{
				name: "Microsoft 网络客户端",
				editable: false
			},
			{
				name: "Microsoft 网络的文件和打印机共享",
				editable: false
			},
			{
				name: "QoS 数据包计划程序",
				editable: false
			},
			{
				name: "Internet 协议版本 4 (TCP/IPv4)",
				editable: true
			},
			{
				name: "Internet 协议版本 6 (TCP/IPv6)",
				editable: false
			},
			{
				name: "链路层拓扑发现映射器 I/O 驱动程序",
				editable: false
			},
			{
				name: "链路层拓扑发现响应程序",
				editable: false
			}
		];
		function openProps(r) {
			activeAdapter.value = r;
			propsVisible.value = true;
		}
		const ipv4Visible = ref(false);
		const ipv4Loading = ref(false);
		const ipv4Saving = ref(false);
		const ipv4 = ref({
			dhcp: true,
			dnsDhcp: true,
			prefixLength: 24
		});
		/** 由前缀长度推导点分子网掩码（仅用于提示） */
		function prefixToMask(prefix) {
			const p = Number(prefix);
			if (!Number.isInteger(p) || p < 0 || p > 32) return "—";
			const mask = 4294967295 << 32 - p >>> 0;
			return [
				24,
				16,
				8,
				0
			].map((s) => mask >>> s & 255).join(".");
		}
		const maskHint = computed(() => prefixToMask(ipv4.value.prefixLength));
		async function openIPv4() {
			if (!activeAdapter.value) return;
			ipv4Visible.value = true;
			ipv4Loading.value = true;
			try {
				const cfg = await fetchIPv4Config(props.hostId, String(activeAdapter.value.name));
				ipv4.value = {
					adapterName: cfg.adapterName ?? String(activeAdapter.value.name),
					ifIndex: cfg.ifIndex,
					dhcp: cfg.dhcp ?? true,
					address: cfg.address ?? "",
					prefixLength: cfg.prefixLength ?? 24,
					gateway: cfg.gateway ?? "",
					dnsDhcp: cfg.dnsDhcp ?? true,
					dnsPreferred: cfg.dnsPreferred ?? "",
					dnsAlternate: cfg.dnsAlternate ?? ""
				};
			} finally {
				ipv4Loading.value = false;
			}
		}
		async function saveIPv4() {
			const cfg = ipv4.value;
			if (!cfg.adapterName) return;
			if (!cfg.dhcp && !String(cfg.address ?? "").trim()) return;
			if (!cfg.dnsDhcp && !String(cfg.dnsPreferred ?? "").trim()) return;
			ipv4Saving.value = true;
			try {
				await saveIPv4Config(props.hostId, {
					...cfg,
					prefixLength: Number(cfg.prefixLength) || 24
				});
				ipv4Visible.value = false;
				propsVisible.value = false;
				emit("applied");
			} finally {
				ipv4Saving.value = false;
			}
		}
		/** 表格列（非 Windows 回退） */
		const tableColumns = [
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
		];
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_el_checkbox = resolveComponent("el-checkbox");
			const _component_el_alert = resolveComponent("el-alert");
			const _component_el_radio = resolveComponent("el-radio");
			const _component_el_radio_group = resolveComponent("el-radio-group");
			const _component_ReInput = resolveComponent("ReInput");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				isWindows.value ? (openBlock(), createElementBlock("div", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(tiles.value, (r, i) => {
					return openBlock(), createElementBlock("div", {
						key: i,
						class: normalizeClass(["ncpa-tile", { off: !isUp(r) }])
					}, [
						createBaseVNode("div", _hoisted_3, [createVNode(NetAdapterGlyph_default, {
							kind: adapterKind(r),
							size: 44
						}, null, 8, ["kind"])]),
						createBaseVNode("div", _hoisted_4, [
							createBaseVNode("b", _hoisted_5, toDisplayString(r.name), 1),
							createBaseVNode("span", _hoisted_6, toDisplayString(statusText(r)), 1),
							isUp(r) && r.ipv4 ? (openBlock(), createElementBlock("span", _hoisted_7, toDisplayString(r.ipv4), 1)) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_8, [createVNode(_component_ReButton, {
							layout: "square",
							onClick: ($event) => openStatus(r)
						}, {
							default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("状态", -1)])]),
							_: 1
						}, 8, ["onClick"]), createVNode(_component_ReButton, {
							layout: "square",
							onClick: ($event) => openProps(r)
						}, {
							default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("属性", -1)])]),
							_: 1
						}, 8, ["onClick"])])
					], 2);
				}), 128))])) : (openBlock(), createElementBlock("table", _hoisted_9, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [(openBlock(), createElementBlock(Fragment, null, renderList(tableColumns, (c) => {
					return createBaseVNode("th", {
						key: c.key,
						style: normalizeStyle(c.width ? { width: c.width } : {})
					}, toDisplayString(c.label), 5);
				}), 64))])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (r, i) => {
					return openBlock(), createElementBlock("tr", { key: i }, [(openBlock(), createElementBlock(Fragment, null, renderList(tableColumns, (c) => {
						return createBaseVNode("td", { key: c.key }, [c.key === "name" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("span", { class: normalizeClass(["tb-net-ico", { off: !isUp(r) }]) }, [createVNode(NetAdapterGlyph_default, {
							kind: adapterKind(r),
							size: 26
						}, null, 8, ["kind"])], 2), createTextVNode(" " + toDisplayString(r.name), 1)], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(r[c.key] ?? ""), 1)], 64))]);
					}), 64))]);
				}), 128))])])),
				createVNode(_component_ReDialog, {
					modelValue: statusVisible.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => statusVisible.value = $event),
					title: `状态：${activeAdapter.value?.name ?? ""}`,
					width: "460px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, {
						type: "primary",
						onClick: _cache[0] || (_cache[0] = ($event) => statusVisible.value = false)
					}, {
						default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [statusLoading.value ? (openBlock(), createElementBlock("div", _hoisted_10, "正在读取网卡状态…")) : (openBlock(), createElementBlock("div", _hoisted_11, [(openBlock(true), createElementBlock(Fragment, null, renderList(detailRows.value, (row) => {
						return openBlock(), createElementBlock("div", {
							key: row.label,
							class: "kv-row"
						}, [createBaseVNode("span", _hoisted_12, toDisplayString(row.label), 1), createBaseVNode("span", { class: normalizeClass(["kv-val", { mono: row.mono }]) }, toDisplayString(row.value), 3)]);
					}), 128))]))]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: propsVisible.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => propsVisible.value = $event),
					title: `属性：${activeAdapter.value?.name ?? ""}`,
					width: "480px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[3] || (_cache[3] = ($event) => propsVisible.value = false) }, {
						default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [_cache[19] || (_cache[19] = createBaseVNode("div", { class: "props-hint" }, "此连接使用下列项目：", -1)), createBaseVNode("div", _hoisted_13, [(openBlock(), createElementBlock(Fragment, null, renderList(propertyItems, (item) => {
						return createBaseVNode("div", {
							key: item.name,
							class: normalizeClass(["props-item", { clickable: item.editable }]),
							onDblclick: ($event) => item.editable ? openIPv4() : void 0
						}, [
							createVNode(_component_el_checkbox, {
								"model-value": true,
								disabled: ""
							}),
							createBaseVNode("span", _hoisted_15, toDisplayString(item.name), 1),
							item.editable ? (openBlock(), createBlock(_component_ReButton, {
								key: 0,
								layout: "square",
								onClick: _cache[2] || (_cache[2] = ($event) => openIPv4())
							}, {
								default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("属性", -1)])]),
								_: 1
							})) : createCommentVNode("", true)
						], 42, _hoisted_14);
					}), 64))])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: ipv4Visible.value,
					"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => ipv4Visible.value = $event),
					title: "Internet 协议版本 4 (TCP/IPv4) 属性",
					width: "460px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[12] || (_cache[12] = ($event) => ipv4Visible.value = false) }, {
						default: withCtx(() => [..._cache[32] || (_cache[32] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: ipv4Saving.value,
						onClick: saveIPv4
					}, {
						default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("确定", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [ipv4Loading.value ? (openBlock(), createElementBlock("div", _hoisted_16, "正在读取 IPv4 配置…")) : (openBlock(), createElementBlock("div", _hoisted_17, [
						createVNode(_component_el_alert, {
							type: "warning",
							closable: false,
							"show-icon": "",
							class: "ipv4-warn"
						}, {
							default: withCtx(() => [..._cache[20] || (_cache[20] = [createTextVNode(" 修改 IP / 网关可能导致该主机网络中断；若正通过该网卡远程连接，请谨慎操作。 ", -1)])]),
							_: 1
						}),
						_cache[30] || (_cache[30] = createBaseVNode("div", { class: "ip-sec-title" }, "IP 设置", -1)),
						createVNode(_component_el_radio_group, {
							modelValue: ipv4.value.dhcp,
							"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => ipv4.value.dhcp = $event),
							class: "ip-mode"
						}, {
							default: withCtx(() => [createVNode(_component_el_radio, { value: true }, {
								default: withCtx(() => [..._cache[21] || (_cache[21] = [createTextVNode("自动获得 IP 地址（DHCP）", -1)])]),
								_: 1
							}), createVNode(_component_el_radio, { value: false }, {
								default: withCtx(() => [..._cache[22] || (_cache[22] = [createTextVNode("使用下面的 IP 地址", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["modelValue"]),
						!ipv4.value.dhcp ? (openBlock(), createElementBlock("div", _hoisted_18, [
							createBaseVNode("div", _hoisted_19, [_cache[23] || (_cache[23] = createBaseVNode("label", null, "IP 地址", -1)), createVNode(_component_ReInput, {
								modelValue: ipv4.value.address,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => ipv4.value.address = $event),
								placeholder: "192.168.200.33"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_20, [_cache[24] || (_cache[24] = createBaseVNode("label", null, "子网前缀", -1)), createBaseVNode("div", _hoisted_21, [createVNode(_component_ReInput, {
								modelValue: ipv4.value.prefixLength,
								"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => ipv4.value.prefixLength = $event),
								type: "number",
								placeholder: "24"
							}, null, 8, ["modelValue"]), createBaseVNode("small", _hoisted_22, "掩码 " + toDisplayString(maskHint.value), 1)])]),
							createBaseVNode("div", _hoisted_23, [_cache[25] || (_cache[25] = createBaseVNode("label", null, "默认网关", -1)), createVNode(_component_ReInput, {
								modelValue: ipv4.value.gateway,
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => ipv4.value.gateway = $event),
								placeholder: "192.168.200.1"
							}, null, 8, ["modelValue"])])
						])) : createCommentVNode("", true),
						_cache[31] || (_cache[31] = createBaseVNode("div", { class: "ip-sec-title" }, "DNS 设置", -1)),
						createVNode(_component_el_radio_group, {
							modelValue: ipv4.value.dnsDhcp,
							"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => ipv4.value.dnsDhcp = $event),
							class: "ip-mode"
						}, {
							default: withCtx(() => [createVNode(_component_el_radio, { value: true }, {
								default: withCtx(() => [..._cache[26] || (_cache[26] = [createTextVNode("自动获得 DNS 服务器地址", -1)])]),
								_: 1
							}), createVNode(_component_el_radio, { value: false }, {
								default: withCtx(() => [..._cache[27] || (_cache[27] = [createTextVNode("使用下面的 DNS 服务器地址", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["modelValue"]),
						!ipv4.value.dnsDhcp ? (openBlock(), createElementBlock("div", _hoisted_24, [createBaseVNode("div", _hoisted_25, [_cache[28] || (_cache[28] = createBaseVNode("label", null, "首选 DNS", -1)), createVNode(_component_ReInput, {
							modelValue: ipv4.value.dnsPreferred,
							"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => ipv4.value.dnsPreferred = $event),
							placeholder: "114.114.114.114"
						}, null, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_26, [_cache[29] || (_cache[29] = createBaseVNode("label", null, "备用 DNS", -1)), createVNode(_component_ReInput, {
							modelValue: ipv4.value.dnsAlternate,
							"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => ipv4.value.dnsAlternate = $event),
							placeholder: "可选"
						}, null, 8, ["modelValue"])])])) : createCommentVNode("", true)
					]))]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-c6cea6ae"]]);
//#endregion
export { HostNetworkAdapters_default as t };
