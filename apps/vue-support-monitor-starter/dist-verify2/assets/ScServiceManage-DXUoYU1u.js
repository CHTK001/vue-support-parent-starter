import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, St as resolveComponent, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, fn as markRaw, ft as onUnmounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { D as connection_default, ln as video_pause_default, vt as monitor_default, x as circle_close_filled_default, y as circle_check_filled_default } from "./dist-DogtK295.js";
import { yt as message } from "./src-CEonioA3.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { $ as getServerNode, X as createServerNode, Z as deleteServerNode, at as queryDiscoveryInstances, ct as stopServerNode, dt as updateServerNode, et as hotUpdateServerNode, it as listServerNodes, lt as toggleServerFilter, nt as listFilterTypes, ot as restartServerNode, rt as listProtocols, st as startServerNode, tt as listDiscoveryProtocols, ut as updateServerFilterParams } from "./api-CRz4q4qT.js";
//#region ../../pages/server/src/utils/filterDetail.ts
/**
* ServerFilter 深度查看入口解析（共享）。
*
* 深度页面有两种来源，必须分开处理，否则在未挂载目标页的宿主应用里会死链：
*   - node  —— 由插件自身的 HTTP 服务提供。典型是 FileStorageServerFilter 的 SYSTEM 布局：
*              它在 {serverUrl}{bucket} 上直接返回 classpath static/index.html（Vue 独立构建），
*              与宿主应用无关，新窗口直开节点地址即可，任何宿主都可用；
*   - route —— 由宿主应用托管，必须先 router.resolve(path).matched.length 校验再跳。
*
* 调用点：ScServiceManage.vue / ScServerDetailDrawer.vue / ScServerFormDrawer.vue。
*/
/**
* 兜底桶名（与 pages/filesystem 的 filestorageApi DEFAULT_BUCKET 对齐）。
* 仅在部署未配置 otherConfig.filestorage.bucket 时使用。
*/
var DEFAULT_BUCKET = "local";
/**
* 解析当前部署的主存储桶名。
*
* <p>桶名 = 容器中 FileStorage Bean 名，随部署而变（monitor 后端的本地桶叫
* {@code localFileStorage}，而模板默认是 {@code local}）。此前写死 {@code local}，
* 在 monitor 部署下「打开文件管理器」会落到一个不存在的桶（实测 404）。
* 取值口径与 pages/filesystem 的 {@code resolveBucket} 一致：部署配置
* {@code otherConfig.filestorage.bucket} 优先，{@link #DEFAULT_BUCKET} 只做兜底。</p>
*/
function resolveDefaultBucket() {
	try {
		return getConfig()?.other?.filestorage?.bucket || DEFAULT_BUCKET;
	} catch {
		return DEFAULT_BUCKET;
	}
}
/** 该插件是否提供深度查看入口（用于按钮显隐） */
function hasFilterDetail(meta) {
	return resolveFilterDetail(meta, null, null) !== null;
}
/**
* 解析某个过滤器实例的深度查看入口。
*
* @param meta   插件元数据
* @param filter 该实例的过滤器配置（node 型用于取 bucket 等参数）
* @param node   所属节点（node 型需要 serverUrl；表单态没有节点时传空）
* @returns 解析结果；`null` 表示该插件没有深度查看入口
*/
function resolveFilterDetail(meta, filter, node) {
	if (!meta) return null;
	const label = meta.detailLabel || "查看详情";
	const kind = meta.detailKind ?? (meta.detailPage ? "route" : void 0);
	if (kind === "node") {
		const base = node?.serverUrl;
		if (!base) return {
			kind: "unavailable",
			reason: node ? "服务未运行，启动后即可打开该插件的深度页面" : "请先保存并启动服务，再从服务详情页打开该插件的深度页面",
			label
		};
		const bucket = filter?.params?.bucket || resolveDefaultBucket();
		return {
			kind: "node",
			url: joinUrl(normalizeHost(base), bucket),
			label
		};
	}
	if (kind === "route" && meta.detailPage) return {
		kind: "route",
		path: meta.detailPage,
		label
	};
	return null;
}
/** 拼接节点访问地址与路径，避免出现双斜杠 */
function joinUrl(base, path) {
	return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
/**
* `0.0.0.0` / `::` 表示「监听全部网卡」，是服务端写法；浏览器直开会打不开，
* 统一换成回环地址。节点 host 留空时后端就按 `0.0.0.0` 生成 serverUrl。
*/
function normalizeHost(base) {
	return base.replace(/\/\/(0\.0\.0\.0|\[::\]|::)(?=[:/]|$)/, "//127.0.0.1");
}
//#endregion
//#region ../../pages/server/src/components/filters/ScFilterFieldRow.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$8 = { class: "fc-field" };
var _hoisted_2$7 = { class: "fc-label" };
var _hoisted_3$6 = { class: "fc-name" };
var _hoisted_4$6 = {
	key: 0,
	class: "fc-changed",
	title: "已修改（与默认值不同）"
};
var _hoisted_5$5 = {
	key: 0,
	class: "fc-hint"
};
//#endregion
//#region ../../pages/server/src/components/filters/ScFilterFieldRow.vue
var ScFilterFieldRow_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScFilterFieldRow",
	props: {
		field: {},
		value: {}
	},
	emits: ["update"],
	setup(__props, { emit: __emit }) {
		/**
		* ServerFilter 单个参数字段行 —— 按 schema 类型渲染控件。
		*
		* 抽成独立组件的原因：文件服务器 / 服务发现 / 通用 schema 三种面板都要渲染同一批控件，
		* 若各自内联一份 switch/select/input 标记，改一次控件行为要同步改三处。
		*
		* 取值语义与旧实现保持一致：参数缺省时回落到 schema 的 defaultValue，
		* 因此父组件只需回传当前值，不必先把默认值填满。
		*/
		const props = __props;
		const emit = __emit;
		/** 有效取值：优先实配值，其次 schema 默认值 */
		const effective = computed(() => {
			const v = props.value;
			if (v !== void 0 && v !== null) return v;
			return props.field.defaultValue ?? "";
		});
		/** 布尔判定：空值视为开（历史实现如此，保持兼容） */
		const asBool = computed(() => {
			const v = String(effective.value).trim().toLowerCase();
			return v === "" || v === "true" || v === "1" || v === "yes" || v === "on";
		});
		/** 枚举候选 */
		const options = computed(() => (props.field.options ?? []).map((o) => ({
			label: o,
			value: o
		})));
		/** 是否已偏离 schema 默认值（面板头部有总计数，字段级标记让「改了哪几项」一眼可见） */
		const changed = computed(() => {
			const v = props.value;
			if (v === void 0 || v === null || v === "") return false;
			return String(v) !== String(props.field.defaultValue ?? "");
		});
		return (_ctx, _cache) => {
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInput = resolveComponent("ReInput");
			return openBlock(), createElementBlock("div", _hoisted_1$8, [
				createBaseVNode("div", _hoisted_2$7, [createBaseVNode("span", _hoisted_3$6, toDisplayString(__props.field.name), 1), changed.value ? (openBlock(), createElementBlock("span", _hoisted_4$6, "已改")) : createCommentVNode("", true)]),
				__props.field.desc ? (openBlock(), createElementBlock("div", _hoisted_5$5, toDisplayString(__props.field.desc), 1)) : createCommentVNode("", true),
				__props.field.type === "boolean" ? (openBlock(), createBlock(_component_ReSwitch, {
					key: 1,
					class: "fc-control fc-control--switch",
					"model-value": asBool.value,
					onChange: _cache[0] || (_cache[0] = (v) => emit("update", v ? "true" : "false"))
				}, null, 8, ["model-value"])) : __props.field.type === "enum" && options.value.length ? (openBlock(), createBlock(_component_ReSelect, {
					key: 2,
					class: "fc-control",
					"model-value": effective.value,
					data: options.value,
					onChange: _cache[1] || (_cache[1] = (v) => emit("update", String(v)))
				}, null, 8, ["model-value", "data"])) : (openBlock(), createBlock(_component_ReInput, {
					key: 3,
					class: "fc-control",
					"model-value": effective.value,
					placeholder: __props.field.desc || __props.field.name,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = (v) => emit("update", String(v ?? "")))
				}, null, 8, ["model-value", "placeholder"]))
			]);
		};
	}
}), [["__scopeId", "data-v-78844a4c"]]);
//#endregion
//#region ../../pages/server/src/components/filters/ScFilterSectionCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$7 = { class: "fsc" };
var _hoisted_2$6 = { class: "fsc-head" };
var _hoisted_3$5 = { class: "fsc-titles" };
var _hoisted_4$5 = { class: "fsc-title" };
var _hoisted_5$4 = { class: "fsc-title-text" };
var _hoisted_6$4 = {
	key: 0,
	class: "fsc-count"
};
var _hoisted_7$4 = {
	key: 0,
	class: "fsc-desc"
};
var _hoisted_8$4 = { class: "fsc-body" };
//#endregion
//#region ../../pages/server/src/components/filters/ScFilterSectionCard.vue
var ScFilterSectionCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScFilterSectionCard",
	props: {
		title: {},
		desc: {},
		count: {}
	},
	setup(__props) {
		/**
		* ServerFilter 参数分区卡片 —— 各专用面板的语义分区容器。
		*
		* 为什么抽出这个组件：原先 `.fc-section` / `.fc-section-title` / `.fc-grid` 在
		* file-storage / discovery / generic 三个面板里各抄了一份（9 处同名样式），
		* 改一次栅格断点要同步三个文件，久了必然漂移成"每个插件排版都不一样"。
		* 现在语义分区卡片只有这一处实现，新增插件只声明「分区名 + 归属字段名」。
		*
		* 样式走 EP 语义令牌而非 pages/server/src/styles/page.css 的 `.panel`
		* （那份 tokens.css 只有 :root、无暗色变体，暗色模式下会停在亮色值）。
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("section", _hoisted_1$7, [createBaseVNode("header", _hoisted_2$6, [_cache[0] || (_cache[0] = createBaseVNode("span", {
				class: "fsc-bar",
				"aria-hidden": "true"
			}, null, -1)), createBaseVNode("div", _hoisted_3$5, [createBaseVNode("div", _hoisted_4$5, [createBaseVNode("span", _hoisted_5$4, toDisplayString(__props.title), 1), __props.count ? (openBlock(), createElementBlock("span", _hoisted_6$4, toDisplayString(__props.count), 1)) : createCommentVNode("", true)]), __props.desc ? (openBlock(), createElementBlock("div", _hoisted_7$4, toDisplayString(__props.desc), 1)) : createCommentVNode("", true)])]), createBaseVNode("div", _hoisted_8$4, [renderSlot(_ctx.$slots, "default", {}, void 0, true)])]);
		};
	}
}), [["__scopeId", "data-v-7487021d"]]);
//#endregion
//#region ../../pages/server/src/components/filters/ScFileStorageFilterPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$6 = { class: "fc-panels" };
//#endregion
//#region ../../pages/server/src/components/filters/ScFileStorageFilterPanel.vue
var ScFileStorageFilterPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScFileStorageFilterPanel",
	props: {
		meta: {},
		filterType: {},
		modelValue: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* ServerFilter 专用配置面板 —— FileStorageServerFilter（文件服务器）。
		*
		* 与通用 schema 表单的区别：把参数按「访问控制 / 目录列表页 / 图片与水印」分区编排，
		* 字段来源仍是后端 schema（新增字段会自动落到「其它参数」分区，不会丢配置）。
		*/
		const props = __props;
		const emit = __emit;
		/** 参数分区（字段名来自后端 schema） */
		const SECTIONS = [
			{
				title: "访问控制",
				desc: "决定哪些文件操作放行；关掉预览即无法在浏览器里看到图片",
				keys: [
					"openPreview",
					"openDownload",
					"openRange",
					"openRemoteFile",
					"openWebjars"
				]
			},
			{
				title: "目录列表页",
				desc: "目录页的展示形态与列信息",
				keys: [
					"layout",
					"layoutType",
					"showFormat",
					"showSize",
					"showTime"
				]
			},
			{
				title: "图片与水印",
				desc: "图片渲染处理与水印叠加",
				keys: [
					"imageFilter",
					"watermark",
					"openWatermark"
				]
			}
		];
		const schema = computed(() => props.meta?.params ?? []);
		/** 已归入分区的字段名 */
		const groupedKeys = computed(() => new Set(SECTIONS.flatMap((s) => s.keys)));
		/** 专属分区中 schema 实际声明了的字段（后端没声明的字段不渲染） */
		function fieldsOf(keys) {
			return keys.map((k) => schema.value.find((f) => f.name === k)).filter((f) => Boolean(f));
		}
		/** schema 里新增但未归入分区的字段 */
		const restFields = computed(() => schema.value.filter((f) => !groupedKeys.value.has(f.name)));
		/** 写入单个参数 */
		function set(name, value) {
			emit("update:modelValue", {
				...props.modelValue ?? {},
				[name]: value
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$6, [(openBlock(), createElementBlock(Fragment, null, renderList(SECTIONS, (section) => {
				return createVNode(ScFilterSectionCard_default, {
					key: section.title,
					title: section.title,
					desc: section.desc,
					count: fieldsOf(section.keys).length
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(fieldsOf(section.keys), (field) => {
						return openBlock(), createBlock(ScFilterFieldRow_default, {
							key: field.name,
							field,
							value: __props.modelValue?.[field.name],
							onUpdate: (v) => set(field.name, v)
						}, null, 8, [
							"field",
							"value",
							"onUpdate"
						]);
					}), 128))]),
					_: 2
				}, 1032, [
					"title",
					"desc",
					"count"
				]);
			}), 64)), restFields.value.length ? (openBlock(), createBlock(ScFilterSectionCard_default, {
				key: 0,
				title: "其它参数",
				desc: "后端新增、尚未归入语义分区的参数（不会丢配置）",
				count: restFields.value.length
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(restFields.value, (field) => {
					return openBlock(), createBlock(ScFilterFieldRow_default, {
						key: field.name,
						field,
						value: __props.modelValue?.[field.name],
						onUpdate: (v) => set(field.name, v)
					}, null, 8, [
						"field",
						"value",
						"onUpdate"
					]);
				}), 128))]),
				_: 1
			}, 8, ["count"])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-0de82aa5"]]);
//#endregion
//#region ../../pages/server/src/components/filters/ScDiscoveryFilterPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "fc-panels" };
var _hoisted_2$5 = { class: "fc-query" };
var _hoisted_3$4 = {
	key: 0,
	class: "dim"
};
var _hoisted_4$4 = { class: "mono" };
//#endregion
//#region ../../pages/server/src/components/filters/ScDiscoveryFilterPanel.vue
var ScDiscoveryFilterPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScDiscoveryFilterPanel",
	props: {
		meta: {},
		filterType: {},
		modelValue: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* ServerFilter 专用配置面板 —— ServiceDiscoveryServerFilter（服务发现）。
		*
		* 除了参数分区，还提供「服务实例（实时查询）」视图：走该插件自己的接口
		* /ms/monitor/discovery/{protocols,services}，与参数表单解耦，可反复查询。
		*/
		const props = __props;
		const emit = __emit;
		/** 参数分区（字段名来自后端 schema） */
		const SECTIONS = [{
			title: "发现源",
			desc: "从哪个注册中心发现实例；决定该过滤器能不能拿到候选节点",
			keys: [
				"discoveryName",
				"scatterId",
				"protocol"
			]
		}, {
			title: "路由与负载",
			desc: "路由表达式与转发策略；balance 决定多实例时的挑选方式",
			keys: [
				"routes",
				"balance",
				"excludeServerId"
			]
		}];
		const schema = computed(() => props.meta?.params ?? []);
		const groupedKeys = computed(() => new Set(SECTIONS.flatMap((s) => s.keys)));
		function fieldsOf(keys) {
			return keys.map((k) => schema.value.find((f) => f.name === k)).filter((f) => Boolean(f));
		}
		const restFields = computed(() => schema.value.filter((f) => !groupedKeys.value.has(f.name)));
		function set(name, value) {
			emit("update:modelValue", {
				...props.modelValue ?? {},
				[name]: value
			});
		}
		/** 可选发现协议 */
		const discoveryProtocols = ref([]);
		/** 查询协议 */
		const discoveryProtocol = ref("");
		/** 查询服务标识 */
		const discoveryUriSpec = ref("");
		/** 查询中 */
		const discoveryLoading = ref(false);
		/** 查询结果 */
		const discoveryInstances = ref([]);
		/** 结果说明（未启用 / 参数缺失等） */
		const discoveryMessage = ref("");
		/** 拉取已启用协议 */
		async function loadDiscoveryProtocols() {
			try {
				discoveryProtocols.value = await listDiscoveryProtocols() ?? [];
				if (!discoveryProtocol.value && discoveryProtocols.value.length) discoveryProtocol.value = discoveryProtocols.value[0];
			} catch {
				discoveryProtocols.value = [];
			}
		}
		/** 默认取 routes 参数里第一个 `name=uri` 的服务标识 */
		function syncUriSpecFromRoutes() {
			const routes = props.modelValue?.routes;
			if (!routes) return;
			const first = String(routes).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)[0];
			if (!first) return;
			const idx = first.indexOf("=");
			if (idx > 0 && idx < first.length - 1) discoveryUriSpec.value = first.substring(idx + 1).trim();
		}
		/** 按协议 + 服务标识查询实例 */
		async function loadDiscoveryInstances() {
			if (!discoveryProtocol.value && !discoveryUriSpec.value.trim()) {
				message.warning("请至少填写发现协议或服务标识");
				return;
			}
			discoveryLoading.value = true;
			try {
				const result = await queryDiscoveryInstances(discoveryProtocol.value || void 0, discoveryUriSpec.value.trim() || void 0);
				discoveryInstances.value = result?.instances ?? [];
				discoveryMessage.value = result?.message ?? "";
				if (!discoveryInstances.value.length && discoveryMessage.value && discoveryMessage.value !== "ok") message.info(discoveryMessage.value);
			} catch (e) {
				discoveryInstances.value = [];
				message.error(e.message);
			} finally {
				discoveryLoading.value = false;
			}
		}
		onMounted(() => {
			loadDiscoveryProtocols();
			syncUriSpecFromRoutes();
		});
		watch(() => props.modelValue?.routes, () => syncUriSpecFromRoutes());
		return (_ctx, _cache) => {
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReTable = resolveComponent("ReTable");
			return openBlock(), createElementBlock("div", _hoisted_1$5, [
				(openBlock(), createElementBlock(Fragment, null, renderList(SECTIONS, (section) => {
					return createVNode(ScFilterSectionCard_default, {
						key: section.title,
						title: section.title,
						desc: section.desc,
						count: fieldsOf(section.keys).length
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(fieldsOf(section.keys), (field) => {
							return openBlock(), createBlock(ScFilterFieldRow_default, {
								key: field.name,
								field,
								value: __props.modelValue?.[field.name],
								onUpdate: (v) => set(field.name, v)
							}, null, 8, [
								"field",
								"value",
								"onUpdate"
							]);
						}), 128))]),
						_: 2
					}, 1032, [
						"title",
						"desc",
						"count"
					]);
				}), 64)),
				restFields.value.length ? (openBlock(), createBlock(ScFilterSectionCard_default, {
					key: 0,
					title: "其它参数",
					desc: "后端新增、尚未归入语义分区的参数（不会丢配置）",
					count: restFields.value.length
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(restFields.value, (field) => {
						return openBlock(), createBlock(ScFilterFieldRow_default, {
							key: field.name,
							field,
							value: __props.modelValue?.[field.name],
							onUpdate: (v) => set(field.name, v)
						}, null, 8, [
							"field",
							"value",
							"onUpdate"
						]);
					}), 128))]),
					_: 1
				}, 8, ["count"])) : createCommentVNode("", true),
				createVNode(ScFilterSectionCard_default, {
					title: "服务实例（实时查询）",
					desc: "直查该插件自己的发现接口，不经参数表单，可反复查询"
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_2$5, [
						createVNode(_component_ReSelect, {
							modelValue: discoveryProtocol.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => discoveryProtocol.value = $event),
							placeholder: "发现协议",
							clearable: "",
							data: discoveryProtocols.value.map((p) => ({
								label: p,
								value: p
							}))
						}, null, 8, ["modelValue", "data"]),
						createVNode(_component_ReInput, {
							modelValue: discoveryUriSpec.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => discoveryUriSpec.value = $event),
							placeholder: "服务标识（如 order-service）",
							clearable: ""
						}, null, 8, ["modelValue"]),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Search",
							loading: discoveryLoading.value,
							onClick: loadDiscoveryInstances
						}, {
							default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode(" 查询实例 ", -1)])]),
							_: 1
						}, 8, ["loading"]),
						discoveryMessage.value && discoveryMessage.value !== "ok" ? (openBlock(), createElementBlock("span", _hoisted_3$4, toDisplayString(discoveryMessage.value), 1)) : createCommentVNode("", true)
					]), createVNode(_component_ReTable, {
						data: discoveryInstances.value,
						loading: discoveryLoading.value,
						border: "",
						pagination: false,
						toolbar: false,
						"empty-text": "暂无实例（请确认发现服务已启用，或调整协议 / 服务标识）",
						class: "fc-table"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReTableColumn, {
								prop: "host",
								label: "主机",
								"min-width": "140",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_ReTableColumn, {
								prop: "port",
								label: "端口",
								width: "80"
							}),
							createVNode(_component_ReTableColumn, {
								label: "协议",
								width: "90"
							}, {
								default: withCtx(({ row }) => [createVNode(_component_ReTag, null, {
									default: withCtx(() => [createTextVNode(toDisplayString(row.protocol), 1)]),
									_: 2
								}, 1024)]),
								_: 1
							}),
							createVNode(_component_ReTableColumn, {
								prop: "weight",
								label: "权重",
								width: "70"
							}),
							createVNode(_component_ReTableColumn, {
								prop: "env",
								label: "环境",
								width: "90"
							}),
							createVNode(_component_ReTableColumn, {
								prop: "uriSpec",
								label: "服务标识",
								"min-width": "130",
								"show-overflow-tooltip": ""
							}),
							createVNode(_component_ReTableColumn, {
								label: "实例 ID",
								"min-width": "150",
								"show-overflow-tooltip": ""
							}, {
								default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_4$4, toDisplayString(row.id || "-"), 1)]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["data", "loading"])]),
					_: 1
				})
			]);
		};
	}
}), [["__scopeId", "data-v-e8ecca65"]]);
//#endregion
//#region ../../pages/server/src/components/filters/ScGenericFilterPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = { class: "fc-panels" };
var _hoisted_2$4 = {
	key: 0,
	class: "fsc fsc--empty"
};
//#endregion
//#region ../../pages/server/src/components/filters/ScGenericFilterPanel.vue
var ScGenericFilterPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScGenericFilterPanel",
	props: {
		meta: {},
		filterType: {},
		modelValue: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* ServerFilter 通用配置面板 —— 未注册专用组件的过滤器走这里。
		*
		* 完全由后端 /filters 下发的 params schema 驱动：
		* boolean → 开关，enum → 下拉，string → 输入框。
		* 因此新增插件无需改前端（在 filters/index.ts 注册专用组件才会走专属页面）。
		*/
		const props = __props;
		const emit = __emit;
		/** 参数 schema */
		const schema = computed(() => props.meta?.params ?? []);
		/**
		* 按字段语义类型的分区定义。
		*
		* 专用面板（file-storage / service-discovery）按字段名声明分区，因为它们的字段集是已知的；
		* 通用面板面对的是尚未注册的插件，字段名无从预知，但字段 type 一定可判定，
		* 故按 type 分区 —— 任意新插件进来都能得到一份排版整齐的表单。
		*/
		const TYPE_GROUPS = [
			{
				title: "开关类",
				desc: "布尔开关，留空视为开",
				types: ["boolean"]
			},
			{
				title: "枚举选择",
				desc: "schema 限定了候选值，从下拉选择",
				types: ["enum"]
			},
			{
				title: "文本与数值",
				desc: "自由填写，按 schema 默认值生效",
				types: [
					"string",
					"number",
					"text"
				]
			}
		];
		/** 取属于指定语义类型的字段（保留 schema 原顺序） */
		function fieldsOfType(types) {
			return schema.value.filter((f) => types.includes(String(f.type)));
		}
		/** 未被任何分区认领的字段（schema 声明了未知 type） */
		const restFields = computed(() => {
			const known = TYPE_GROUPS.flatMap((g) => g.types);
			return schema.value.filter((f) => !known.includes(String(f.type)));
		});
		/** 写入单个参数 */
		function set(name, value) {
			emit("update:modelValue", {
				...props.modelValue ?? {},
				[name]: value
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$4, [!schema.value.length ? (openBlock(), createElementBlock("div", _hoisted_2$4, [..._cache[0] || (_cache[0] = [createBaseVNode("div", { class: "fsc-empty-text" }, " 该插件未声明参数 schema，可直接保存；如需传参请改用「ServerFilter 全限定类名」并在参数中补充。 ", -1)])])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [(openBlock(), createElementBlock(Fragment, null, renderList(TYPE_GROUPS, (group) => {
				return createVNode(ScFilterSectionCard_default, {
					key: group.title,
					title: group.title,
					desc: group.desc,
					count: fieldsOfType(group.types).length
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(fieldsOfType(group.types), (field) => {
						return openBlock(), createBlock(ScFilterFieldRow_default, {
							key: field.name,
							field,
							value: __props.modelValue?.[field.name],
							onUpdate: (v) => set(field.name, v)
						}, null, 8, [
							"field",
							"value",
							"onUpdate"
						]);
					}), 128))]),
					_: 2
				}, 1032, [
					"title",
					"desc",
					"count"
				]);
			}), 64)), restFields.value.length ? (openBlock(), createBlock(ScFilterSectionCard_default, {
				key: 0,
				title: "其它参数",
				desc: "schema 声明了未识别类型的字段，按文本处理",
				count: restFields.value.length
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(restFields.value, (field) => {
					return openBlock(), createBlock(ScFilterFieldRow_default, {
						key: field.name,
						field,
						value: __props.modelValue?.[field.name],
						onUpdate: (v) => set(field.name, v)
					}, null, 8, [
						"field",
						"value",
						"onUpdate"
					]);
				}), 128))]),
				_: 1
			}, 8, ["count"])) : createCommentVNode("", true)], 64))]);
		};
	}
}), [["__scopeId", "data-v-da615f96"]]);
//#endregion
//#region ../../pages/server/src/components/filters/index.ts
/**
* ServerFilter 配置组件注册表。
*
* 规格：每个 ServerFilter 在前端都有对应的**特定组件**，配置面板按类型分派；
* 没有专用实现的过滤器回退到 schema 驱动的通用表单（因此新增插件零改动也能用）。
*
* 新增一个带专属页面的过滤器只需两步：
*   1. 在 components/filters/ 下新建面板组件（props 用 FilterPanel 契约）；
*   2. 在下方 REGISTRY 里加一行 `'<插件类型>': markRaw(YourPanel)`。
*
* 与 filterDetail.ts 的元数据驱动思路一致：后端 /filters 仍是参数与能力的唯一事实来源，
* 这里只决定「用哪个组件渲染」。
*/
/**
* 类型别名归一：后端历史上给过 fileStorage 这类别名，
* 注册表按规范名（连字符）查找，避免同插件出现两套配置页。
*/
var ALIAS = {
	fileStorage: "file-storage",
	file_storage: "file-storage",
	serviceDiscovery: "service-discovery",
	service_discovery: "service-discovery"
};
/** 专用面板注册表（规范名 → 组件） */
var REGISTRY = {
	"file-storage": markRaw(ScFileStorageFilterPanel_default),
	"service-discovery": markRaw(ScDiscoveryFilterPanel_default)
};
/**
* 归一化过滤器类型
*
* @param type 后端给出的过滤器类型
* @returns 规范名；无法归一时返回去空格后的原值
*/
function normalizeFilterType(type) {
	const t = (type ?? "").trim();
	return ALIAS[t] ?? t;
}
/**
* 解析该过滤器类型应使用的配置组件
*
* @param type 后端给出的过滤器类型
* @returns 专用组件；未注册时返回通用 schema 表单
*/
function resolveFilterPanel(type) {
	return REGISTRY[normalizeFilterType(type)] ?? ScGenericFilterPanel_default;
}
//#endregion
//#region ../../pages/server/src/components/ScFilterConfigPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "filter-config" };
var _hoisted_2$3 = { class: "fc-head" };
var _hoisted_3$3 = { class: "fc-title" };
var _hoisted_4$3 = { class: "fc-name" };
var _hoisted_5$3 = { class: "fc-desc" };
var _hoisted_6$3 = {
	key: 0,
	class: "fc-require"
};
var _hoisted_7$3 = { class: "fc-meta" };
var _hoisted_8$3 = { class: "dim" };
var _hoisted_9$3 = { class: "fc-actions" };
//#endregion
//#region ../../pages/server/src/components/ScFilterConfigPanel.vue
var ScFilterConfigPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScFilterConfigPanel",
	props: {
		meta: {},
		filterType: {},
		modelValue: {},
		live: { type: Boolean },
		applying: { type: Boolean }
	},
	emits: [
		"update:modelValue",
		"apply",
		"open-detail-page"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ServerFilter 配置面板 —— 按过滤器类型分派到各自的专用组件。
		*
		* 本组件只负责三件事：
		*   1. 插件头部（元数据 / 前提 / 已调整项数 / 深度查看入口）；
		*   2. 按 filterType 从注册表解析配置组件（filters/index.ts），未注册则用通用 schema 表单；
		*   3. 底部「热更新参数」——运行中调用后端 /filters/{index}/params 就地生效，服务不中断。
		*
		* 各过滤器的专属表单在 components/filters/ 下，新增插件 = 新增一个面板 + 注册表加一行，
		* 不再往本文件里加 if/else 分支（原先 file-storage 与 service-discovery 是硬编码在此）。
		*
		* props / emits 契约保持不变，调用方（ScServerFormDrawer、ScServerDetailDrawer）无需改动。
		*/
		const props = __props;
		const emit = __emit;
		/** 参数 schema（头部计数与兜底文案用） */
		const schema = computed(() => props.meta?.params ?? []);
		/** 当前类型对应的配置组件 */
		const panel = computed(() => resolveFilterPanel(props.filterType));
		/** 已配置项数量（与默认值不同的参数） */
		const configuredCount = computed(() => schema.value.filter((f) => {
			const v = props.modelValue?.[f.name];
			return v !== void 0 && v !== null && String(v) !== String(f.defaultValue ?? "");
		}).length);
		/** 热更新：未运行时提示随下次启动生效，不发请求 */
		function onApply() {
			if (!props.live) {
				message.info("服务未运行，参数将随下次启动生效");
				return;
			}
			emit("apply");
		}
		return (_ctx, _cache) => {
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReButton = resolveComponent("ReButton");
			return openBlock(), createElementBlock("div", _hoisted_1$3, [
				createBaseVNode("div", _hoisted_2$3, [
					createBaseVNode("div", _hoisted_3$3, [
						createVNode(_component_ReTag, { type: __props.meta?.spi ? "success" : "primary" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(__props.meta?.spi ? "SPI 插件" : "内置预设"), 1)]),
							_: 1
						}, 8, ["type"]),
						createBaseVNode("span", _hoisted_4$3, toDisplayString(__props.filterType), 1),
						__props.meta?.group ? (openBlock(), createBlock(_component_ReTag, {
							key: 0,
							type: "info"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(__props.meta.group), 1)]),
							_: 1
						})) : createCommentVNode("", true)
					]),
					createBaseVNode("div", _hoisted_5$3, toDisplayString(__props.meta?.desc || "未找到该插件的元数据，按通用参数渲染"), 1),
					__props.meta?.require ? (openBlock(), createElementBlock("div", _hoisted_6$3, "前提：" + toDisplayString(__props.meta.require), 1)) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_7$3, [createBaseVNode("span", _hoisted_8$3, "共 " + toDisplayString(schema.value.length) + " 个参数，已调整 " + toDisplayString(configuredCount.value) + " 项", 1), unref(hasFilterDetail)(__props.meta) ? (openBlock(), createBlock(_component_ReButton, {
						key: 0,
						icon: "TopRight",
						layout: "square",
						type: "primary",
						tip: __props.meta?.detailLabel || "查看详情",
						onClick: _cache[0] || (_cache[0] = ($event) => emit("open-detail-page"))
					}, null, 8, ["tip"])) : createCommentVNode("", true)])
				]),
				(openBlock(), createBlock(resolveDynamicComponent(panel.value), {
					meta: __props.meta,
					"filter-type": __props.filterType,
					"model-value": __props.modelValue,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = (v) => emit("update:modelValue", v))
				}, null, 8, [
					"meta",
					"filter-type",
					"model-value"
				])),
				createBaseVNode("div", _hoisted_9$3, [createVNode(_component_ReButton, {
					"show-text": "",
					icon: "Lightning",
					type: "primary",
					loading: __props.applying,
					onClick: onApply
				}, {
					default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode("热更新参数", -1)])]),
					_: 1
				}, 8, ["loading"]), _cache[3] || (_cache[3] = createBaseVNode("span", { class: "dim" }, "运行中调用过滤器 updateConfig 就地生效，服务不中断；未运行时随下次启动生效", -1))])
			]);
		};
	}
}), [["__scopeId", "data-v-0f4a252f"]]);
//#endregion
//#region ../../pages/server/src/utils/serverNodeForm.ts
/**
* 校验节点表单。
*
* @param form  表单模型
* @param facts 协议元数据事实
* @param existingNames 列表中已存在的其他节点名称（用于名称重复校验）；传入空数组则跳过
* @returns 校验结果；{@code ok=false} 时 {@code message} 可直接提示给用户
*/
function validateServerNodeForm(form, facts, existingNames) {
	const name = String(form.name ?? "").trim();
	if (!name) return {
		ok: false,
		message: "请填写服务名称"
	};
	if (!form.protocol) return {
		ok: false,
		message: "请选择协议类型"
	};
	if (form.port == null) return {
		ok: false,
		message: "请填写监听端口"
	};
	if (form.port < 1 || form.port > 65535) return {
		ok: false,
		message: "端口必须在 1-65535 范围内"
	};
	if (facts.requiresBackend) {
		const host = form.config?.backendHost;
		const port = form.config?.backendPort;
		if (!isFilled(host) || !isFilled(port)) return {
			ok: false,
			message: "代理类服务必须填写后端地址与后端端口"
		};
	}
	const names = form.filters.map((f) => f.name);
	if (new Set(names).size !== names.length) return {
		ok: false,
		message: "过滤器名称存在重复，请调整后再保存"
	};
	const emptyType = form.filters.find((f) => !String(f.type ?? "").trim());
	if (emptyType) return {
		ok: false,
		message: `插件 ${emptyType.name} 缺少类型，请重新添加`
	};
	if (existingNames?.length && existingNames.includes(name)) return {
		ok: false,
		message: `服务名称「${name}」已存在，请换一个`
	};
	return { ok: true };
}
/**
* 组装创建/更新/热更新的请求体。
*
* @param form 表单模型
* @returns 后端 {@code ServerNodeRequest} 结构
*/
function buildServerNodePayload(form) {
	return {
		name: form.name.trim(),
		protocol: form.protocol,
		engine: form.engine,
		host: form.host || "0.0.0.0",
		port: form.port,
		enabled: form.enabled,
		remark: form.remark,
		config: form.config || {},
		filters: form.filters.map((f) => ({
			name: f.name,
			type: f.type,
			order: f.order,
			enabled: f.enabled !== false,
			params: f.params || {}
		}))
	};
}
/**
* 值是否算"已填写"（0 与 false 是合法值，不能被当成空）。
*
* @param value 原始值
* @returns 是否已填写
*/
function isFilled(value) {
	if (value === null || value === void 0) return false;
	return String(value).trim().length > 0;
}
//#endregion
//#region ../../pages/server/src/components/ScServerFormDrawer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = {
	key: 0,
	class: "server-form"
};
var _hoisted_2$2 = {
	key: 0,
	class: "form-hint"
};
var _hoisted_3$2 = {
	key: 0,
	class: "spi-badge"
};
var _hoisted_4$2 = { class: "cfg-grid" };
var _hoisted_5$2 = { class: "cfg-label" };
var _hoisted_6$2 = {
	class: "form-hint",
	style: { "margin-left": "8px" }
};
var _hoisted_7$2 = { class: "picker" };
var _hoisted_8$2 = { class: "picker-col picker-left" };
var _hoisted_9$2 = { class: "picker-head" };
var _hoisted_10$2 = { class: "picker-body" };
var _hoisted_11$2 = { class: "picker-group-title" };
var _hoisted_12$2 = ["onClick", "onKeydown"];
var _hoisted_13$1 = { class: "pi-main" };
var _hoisted_14$1 = { class: "pi-type" };
var _hoisted_15$1 = { class: "pi-desc" };
var _hoisted_16$1 = {
	key: 0,
	class: "picker-empty"
};
var _hoisted_17$1 = { class: "picker-col picker-right" };
var _hoisted_18$1 = { class: "picker-head" };
var _hoisted_19$1 = { class: "dim" };
var _hoisted_20$1 = { class: "picker-body" };
var _hoisted_21$1 = {
	key: 0,
	class: "picker-empty"
};
var _hoisted_22 = ["onClick", "onKeydown"];
var _hoisted_23 = { class: "si-order" };
var _hoisted_24 = { class: "si-main" };
var _hoisted_25 = { class: "si-name" };
var _hoisted_26 = { class: "si-meta" };
var _hoisted_27 = { class: "dim" };
var _hoisted_28 = { class: "dim" };
var _hoisted_29 = { class: "form-actions" };
var _hoisted_30 = {
	key: 1,
	class: "filter-page"
};
var _hoisted_31 = { class: "filter-page-bar" };
var _hoisted_32 = { class: "dim" };
//#endregion
//#region ../../pages/server/src/components/ScServerFormDrawer.vue
var ScServerFormDrawer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScServerFormDrawer",
	props: /*@__PURE__*/ mergeModels({
		node: {},
		cloneSource: {},
		protocols: {},
		filterTypes: {},
		existingNames: {}
	}, {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["saved"], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* 服务管理 —— Server 节点编辑抽屉。
		*
		* 三个区段：
		*   1. 基本信息：名称 / 协议（下拉取后端 /protocols，含 Server SPI 动态发现项）/ 引擎 / 监听 / 启用
		*   2. 协议专属配置：按协议动态渲染（代理需 backendHost+backendPort，SIP 需 token，HTTP 走通用传输项）
		*   3. 过滤器编排：左侧 ServerFilter SPI 列表点击加入右侧，支持重复添加、排序、启停、删除；
		*      点击右侧任一插件进入该实现的配置页（不同实现不同页面）
		*
		* 保存提供两种落法：
		*   - 保存：全量替换（运行中的节点会先停止再按新配置重启）
		*   - 保存并热更新：过滤器链就地替换，服务不中断；仅监听参数变更时才自动重启
		*/
		const props = __props;
		const emit = __emit;
		const router = useRouter();
		const visible = useModel(__props, "modelValue");
		/** 是否新建（含克隆）—— node 为空或 node.id 为 0（克隆场景 id 被置零） */
		const isCreating = computed(() => !props.node || props.node.id === 0);
		/** 是否克隆模式 */
		const isClone = computed(() => !props.node && !!props.cloneSource);
		/** 抽屉标题（编辑/克隆/插件配置三态） */
		const drawerTitle = computed(() => {
			if (view.value !== "edit") return `插件配置 - ${form.value.filters[activeIndex.value]?.name || ""}`;
			if (isClone.value) return `克隆服务 - ${props.cloneSource?.name || ""}`;
			if (!isCreating.value) return `编辑服务 - ${props.node?.name || ""}`;
			return "新增服务";
		});
		/** 视图：编辑 / 单个插件配置页 */
		const view = ref("edit");
		/** 当前配置的过滤器下标 */
		const activeIndex = ref(0);
		/** 当前配置的过滤器参数草稿 */
		const filterParams = ref({});
		/** 提交中 */
		const submitting = ref(false);
		/** 参数热更新中 */
		const applying = ref(false);
		/** 表单模型 */
		const form = ref({
			name: "",
			protocol: "http",
			engine: "jdk",
			host: "0.0.0.0",
			port: 18080,
			enabled: 1,
			remark: "",
			config: {},
			filters: []
		});
		/** HTTP 通用传输项 */
		const COMMON_FIELDS = [
			{
				name: "contextPath",
				label: "上下文路径",
				type: "string",
				placeholder: "/api"
			},
			{
				name: "charset",
				label: "字符集",
				type: "string",
				placeholder: "UTF-8"
			},
			{
				name: "readTimeout",
				label: "读超时(ms)",
				type: "number"
			},
			{
				name: "writeTimeout",
				label: "写超时(ms)",
				type: "number"
			},
			{
				name: "backlog",
				label: "积压队列",
				type: "number"
			},
			{
				name: "maxConnections",
				label: "最大连接数",
				type: "number"
			},
			{
				name: "maxConcurrency",
				label: "最大并发数",
				type: "number"
			},
			{
				name: "maxRequestSize",
				label: "最大请求体(字节)",
				type: "number"
			},
			{
				name: "responseTimeout",
				label: "响应超时(ms)",
				type: "number"
			},
			{
				name: "gzipEnabled",
				label: "启用 Gzip",
				type: "boolean"
			},
			{
				name: "reactor",
				label: "Reactor 模式",
				type: "boolean"
			}
		];
		/** 代理专属字段 */
		const PROXY_FIELDS = [{
			name: "backendHost",
			label: "后端地址",
			type: "string",
			placeholder: "127.0.0.1"
		}, {
			name: "backendPort",
			label: "后端端口",
			type: "number"
		}];
		/** SIP 专属字段 */
		const SIP_FIELDS = [{
			name: "token",
			label: "认证令牌",
			type: "string"
		}, {
			name: "dataPlaneMode",
			label: "数据平面模式",
			type: "string",
			placeholder: "tcp / udp"
		}];
		/** 当前协议元数据 */
		const currentProtocol = computed(() => props.protocols.find((p) => p.alias === form.value.protocol));
		/** 是否代理类协议 */
		const isProxy = computed(() => !!currentProtocol.value?.requiresBackend);
		/** 是否 SIP 协议 */
		const isSip = computed(() => form.value.protocol === "sip");
		/** 协议专属字段集合（按协议类型动态过滤，不再对所有协议展示全部 11 项通用字段） */
		const protocolFields = computed(() => {
			const fields = [];
			const alias = form.value.protocol;
			const meta = currentProtocol.value;
			if (isProxy.value) fields.push(...PROXY_FIELDS);
			if (isSip.value) fields.push(...SIP_FIELDS);
			if (alias === "http" || alias === "https" || alias === "http2") fields.push(...COMMON_FIELDS);
			if (meta?.params?.length) {
				for (const p of meta.params) if (!fields.some((f) => f.name === p.name)) fields.push({
					name: p.name,
					label: p.name,
					type: p.type ?? "string",
					placeholder: p.desc
				});
			}
			return fields;
		});
		/**
		* 引擎候选 —— 由后端下发（Server SPI 实际注册名），前端不硬编码。
		*
		* HTTP 一个实现注册多个引擎名（jdk/jdk-http、nio/nio-http、aio/aio-http/iocp），
		* 候选集合随 SPI 注册表变化；其余协议只有自身这一个引擎。
		*/
		const engineOptions = computed(() => {
			const meta = currentProtocol.value;
			return (meta?.engines?.length ? meta.engines : [meta?.defaultEngine || "jdk"]).map((v) => ({
				label: v,
				value: v
			}));
		});
		/** 插件分组标题 */
		const GROUP_LABELS = {
			storage: "存储",
			discovery: "服务发现",
			routing: "路由",
			proxy: "代理",
			security: "安全",
			generic: "通用"
		};
		/** 左侧可用插件按分组归集 */
		const filterGroups = computed(() => {
			const groups = /* @__PURE__ */ new Map();
			props.filterTypes.forEach((f) => {
				const key = f.group || "generic";
				if (!groups.has(key)) groups.set(key, []);
				groups.get(key).push(f);
			});
			return Array.from(groups.entries()).map(([key, items]) => ({
				key,
				label: GROUP_LABELS[key] || key,
				items
			}));
		});
		/** 左侧搜索 */
		const pickerKeyword = ref("");
		/**
		* 自定义 ServerFilter 全限定类名。
		*
		* <p>元数据里 group=custom 那条是「任意 ServerFilter 实现」的入口，它的
		* {@code type} 只是一句说明（"ServerFilter 全限定类名"），直接当类型下发后端
		* 会构造失败。必须由用户填真实 FQCN，再以它作为 type/name。</p>
		*/
		const customFilterType = ref("");
		/** 是否为「自定义实现」入口 */
		function isCustomPickerItem(meta) {
			return meta.group === "custom" || meta.type === "ServerFilter 全限定类名";
		}
		/** 粗校验 Java 全限定类名（至少两段、每段是合法标识符） */
		function isQualifiedClassName(value) {
			return /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/.test(value.trim());
		}
		/** 过滤后的左侧插件 */
		function groupItems(items) {
			const kw = pickerKeyword.value.trim().toLowerCase();
			if (!kw) return items;
			return items.filter((i) => `${i.type} ${i.desc}`.toLowerCase().includes(kw));
		}
		/** 已选插件数量统计 */
		const selectedCount = computed(() => form.value.filters.length);
		watch(visible, (open) => {
			if (!open) return;
			view.value = "edit";
			pickerKeyword.value = "";
			const n = props.node ?? props.cloneSource;
			if (n) {
				form.value = {
					name: n.name,
					protocol: n.protocol,
					engine: n.engine || "jdk",
					host: n.host || "0.0.0.0",
					port: n.port ?? null,
					enabled: n.enabled ?? 1,
					remark: n.remark || "",
					config: { ...n.config || {} },
					filters: (n.filters || []).map((f) => ({
						...f,
						params: { ...f.params || {} }
					}))
				};
				if (isClone.value) form.value.name = `${n.name}-clone`;
			} else {
				const first = props.protocols[0];
				form.value = {
					name: "",
					protocol: first?.alias || "http",
					engine: first?.defaultEngine || "jdk",
					host: "0.0.0.0",
					port: first?.defaultPort ?? 18080,
					enabled: 1,
					remark: "",
					config: {},
					filters: []
				};
			}
		});
		/** 切换协议时同步引擎与默认端口 */
		watch(() => form.value.protocol, (next, prev) => {
			if (next === prev) return;
			const meta = props.protocols.find((p) => p.alias === next);
			form.value.engine = meta?.defaultEngine || "jdk";
			if (!form.value.port || form.value.port === props.protocols.find((p) => p.alias === prev)?.defaultPort) form.value.port = meta?.defaultPort ?? null;
		});
		/** 读取协议配置项 */
		function configValue(name) {
			return form.value.config?.[name] ?? "";
		}
		/** 写入协议配置项 */
		function setConfig(name, value) {
			const next = { ...form.value.config || {} };
			if (value === "" || value === null || value === void 0) delete next[name];
			else next[name] = value;
			form.value.config = next;
		}
		/** 生成同服务内唯一的过滤器名 */
		function uniqueName(base) {
			const used = new Set(form.value.filters.map((f) => f.name));
			if (!used.has(base)) return base;
			let i = 2;
			while (used.has(`${base}-${i}`)) i += 1;
			return `${base}-${i}`;
		}
		/** 新增一个过滤器实例（支持重复添加同一实现） */
		function addFilter(meta) {
			const custom = isCustomPickerItem(meta);
			const resolvedType = custom ? customFilterType.value.trim() : meta.type;
			if (custom) {
				if (!isQualifiedClassName(resolvedType)) {
					message.warning("请先填写 ServerFilter 的全限定类名（如 com.chua.xxx.MyFilter）");
					return;
				}
				if (form.value.filters.some((f) => f.type === resolvedType)) {
					message.warning(`该实现已在链上：${resolvedType}`);
					return;
				}
			}
			const name = uniqueName(resolvedType.includes(".") ? resolvedType.split(".").pop() || resolvedType : resolvedType);
			const params = {};
			(meta.params || []).forEach((p) => {
				if (p.defaultValue !== void 0 && p.defaultValue !== null && p.defaultValue !== "") params[p.name] = String(p.defaultValue);
			});
			const nextOrder = form.value.filters.length ? Math.max(...form.value.filters.map((f) => f.order ?? 100)) + 10 : 100;
			form.value.filters.push({
				name,
				type: resolvedType,
				order: nextOrder,
				enabled: true,
				params
			});
			if (custom) customFilterType.value = "";
			message.success(`已添加插件 ${name}`);
		}
		/** 移除 */
		function removeFilter(index) {
			const target = form.value.filters[index];
			form.value.filters.splice(index, 1);
			message.success(`已移除插件 ${target?.name ?? ""}`);
		}
		/** 上移 / 下移 */
		function moveFilter(index, delta) {
			const target = index + delta;
			if (target < 0 || target >= form.value.filters.length) return;
			const list = form.value.filters;
			const [item] = list.splice(index, 1);
			list.splice(target, 0, item);
			list.forEach((f, i) => {
				f.order = 100 + i * 10;
			});
		}
		/** 启用开关（编辑态仅改草稿） */
		function toggleDraft(index, enabled) {
			const f = form.value.filters[index];
			if (f) f.enabled = enabled;
		}
		/** 进入某个过滤器的配置页 */
		function openFilterConfig(index) {
			const f = form.value.filters[index];
			if (!f) return;
			activeIndex.value = index;
			filterParams.value = { ...f.params || {} };
			view.value = "filter";
		}
		/** 当前配置页的插件元数据 */
		const activeFilterType = computed(() => form.value.filters[activeIndex.value]?.type || form.value.filters[activeIndex.value]?.name || "");
		const activeMeta = computed(() => props.filterTypes.find((f) => f.type === activeFilterType.value) || null);
		/** 返回编辑视图（回写参数草稿） */
		function backToEdit(commit = true) {
			if (commit) {
				const f = form.value.filters[activeIndex.value];
				if (f) f.params = { ...filterParams.value };
			}
			view.value = "edit";
		}
		/** 该服务是否运行中 */
		const isLive = computed(() => props.node?.status === "RUNNING");
		/** 热更新当前过滤器参数（需节点已存在） */
		async function applyFilterParams() {
			const node = props.node;
			if (!node) {
				message.info("服务尚未创建，参数将随创建一并提交");
				backToEdit();
				return;
			}
			const f = form.value.filters[activeIndex.value];
			if (f) f.params = { ...filterParams.value };
			applying.value = true;
			try {
				await updateServerFilterParams(node.id, activeIndex.value, filterParams.value);
				message.success("过滤器参数已热更新，服务未中断");
				emit("saved");
				backToEdit(false);
			} catch (e) {
				message.error(e.message);
			} finally {
				applying.value = false;
			}
		}
		/**
		* 打开插件深度查看页（不同实现不同页面）。
		*
		* node 型（如 file-storage）的深度页面由插件自身 HTTP 服务托管，但表单态尚未保存/启动、
		* 拿不到节点地址，因此只给出提示；保存启动后可从服务详情页打开。
		* route 型（如 service-discovery）由宿主应用托管，校验路由存在后跳转。
		*/
		function openFilterDetailPage() {
			const target = resolveFilterDetail(activeMeta.value, form.value.filters[activeIndex.value], null);
			if (!target) {
				message.info("该插件未提供深度查看页");
				return;
			}
			if (target.kind === "unavailable") {
				message.info(target.reason);
				return;
			}
			if (target.kind === "node") {
				window.open(target.url, "_blank", "noopener");
				return;
			}
			if (!router.resolve(target.path).matched.length) {
				message.info(`当前应用未接入该插件的深度查看页（${target.path}）`);
				return;
			}
			visible.value = false;
			router.push(target.path);
		}
		/** 表单校验（规则集中在 utils/serverNodeForm，便于单测） */
		function validate() {
			const result = validateServerNodeForm(form.value, { requiresBackend: isProxy.value }, props.existingNames);
			if (!result.ok) {
				message.warning(result.message || "表单校验未通过");
				return false;
			}
			return true;
		}
		/** 组装请求体（规则集中在 utils/serverNodeForm，便于单测） */
		function buildPayload() {
			return buildServerNodePayload(form.value);
		}
		/** 失败响应里是否带已落库的节点（后端常见「已保存但启动失败」场景） */
		function hasPersistedNode(e) {
			const data = e?.data;
			if (!data || typeof data !== "object") return false;
			const d = data;
			if ("id" in d) return true;
			const nested = d.node;
			return !!nested && typeof nested === "object" && "id" in nested;
		}
		/** 保存（全量替换） */
		async function submit() {
			if (!validate()) return;
			submitting.value = true;
			try {
				if (!isCreating.value) {
					await updateServerNode(props.node.id, buildPayload());
					message.success("已保存，运行中的实例已按新配置重启");
				} else {
					await createServerNode(buildPayload());
					message.success("已创建");
				}
				emit("saved");
				visible.value = false;
			} catch (e) {
				message.error(e.message);
				if (hasPersistedNode(e)) {
					emit("saved");
					visible.value = false;
				}
			} finally {
				submitting.value = false;
			}
		}
		/** 保存并热更新（过滤器链就地替换，服务不中断） */
		async function submitHot() {
			if (!validate()) return;
			const payload = buildPayload();
			if (isCreating.value) {
				submitting.value = true;
				try {
					await createServerNode(payload);
					message.success("已创建");
					emit("saved");
					visible.value = false;
				} catch (e) {
					message.error(e.message);
					if (hasPersistedNode(e)) {
						emit("saved");
						visible.value = false;
					}
				} finally {
					submitting.value = false;
				}
				return;
			}
			submitting.value = true;
			try {
				const result = await hotUpdateServerNode(props.node.id, payload);
				if (result?.restarted) message.warning(result.message || "监听参数变更，已自动重启节点");
				else if (result?.hotApplied) message.success(result.message || "已热更新，服务未中断");
				else message.info(result?.message || "定义已保存");
				emit("saved");
				visible.value = false;
			} catch (e) {
				message.error(e.message);
				if (hasPersistedNode(e)) {
					emit("saved");
					visible.value = false;
				}
			} finally {
				submitting.value = false;
			}
		}
		/** 热切换已保存节点上的过滤器启停 */
		async function toggleLive(index, enabled) {
			const node = props.node;
			if (!node || node.status !== "RUNNING") return;
			try {
				await toggleServerFilter(node.id, index, enabled);
				message.success(`过滤器已${enabled ? "启用" : "停用"}（热生效）`);
				emit("saved");
			} catch (e) {
				message.error(e.message);
			}
		}
		return (_ctx, _cache) => {
			const _component_ReDivider = resolveComponent("ReDivider");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_Plus = resolveComponent("Plus");
			const _component_ArrowRight = resolveComponent("ArrowRight");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReDrawer = resolveComponent("ReDrawer");
			return openBlock(), createBlock(_component_ReDrawer, {
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => visible.value = $event),
				title: drawerTitle.value,
				size: view.value === "edit" ? 1e3 : 760,
				direction: "rtl",
				"close-only": "",
				"footer-hidden": true
			}, {
				content: withCtx(() => [view.value === "edit" ? (openBlock(), createElementBlock("div", _hoisted_1$2, [
					createVNode(_component_ReForm, {
						"label-width": "110px",
						"label-position": "right"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReDivider, { "content-position": "left" }, {
								default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("基本信息", -1)])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "服务名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.name,
									"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.value.name = $event),
									placeholder: "如 fileserver-01"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "协议类型",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.protocol,
									"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.value.protocol = $event),
									data: __props.protocols.map((p) => ({
										label: `${p.alias}${p.spi ? "（SPI）" : ""} - ${p.desc}`,
										value: p.alias
									})),
									filterable: "",
									style: { "width": "100%" }
								}, null, 8, ["modelValue", "data"]), currentProtocol.value ? (openBlock(), createElementBlock("div", _hoisted_2$2, [createTextVNode(" 默认端口 " + toDisplayString(currentProtocol.value.defaultPort ?? "-") + " · 默认引擎 " + toDisplayString(currentProtocol.value.defaultEngine ?? "-") + " ", 1), currentProtocol.value.spi ? (openBlock(), createElementBlock("span", _hoisted_3$2, "Server SPI 动态协议")) : createCommentVNode("", true)])) : createCommentVNode("", true)]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "传输引擎" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.engine,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.engine = $event),
									data: engineOptions.value,
									style: { "width": "100%" }
								}, null, 8, ["modelValue", "data"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "监听地址" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.host,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.value.host = $event),
									placeholder: "0.0.0.0"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, {
								label: "监听端口",
								required: ""
							}, {
								default: withCtx(() => [createVNode(_component_ReInputNumber, {
									modelValue: form.value.port,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.port = $event),
									min: 1,
									max: 65535,
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "自动启用" }, {
								default: withCtx(() => [createVNode(_component_ReSwitch, {
									"model-value": form.value.enabled === 1,
									onChange: _cache[5] || (_cache[5] = (v) => form.value.enabled = v ? 1 : 0)
								}, null, 8, ["model-value"]), _cache[17] || (_cache[17] = createBaseVNode("span", {
									class: "form-hint",
									style: { "margin-left": "10px" }
								}, "启用后随应用启动自动拉起", -1))]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "备注" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.remark,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.value.remark = $event),
									type: "textarea",
									rows: 2,
									placeholder: "用途说明"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReDivider, { "content-position": "left" }, {
								default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("协议配置", -1)])]),
								_: 1
							}),
							createBaseVNode("div", _hoisted_4$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(protocolFields.value, (field) => {
								return openBlock(), createElementBlock("div", {
									key: field.name,
									class: "cfg-field"
								}, [createBaseVNode("span", _hoisted_5$2, toDisplayString(field.label), 1), field.type === "boolean" ? (openBlock(), createBlock(_component_ReSwitch, {
									key: 0,
									"model-value": String(configValue(field.name)).toLowerCase() === "true" || String(configValue(field.name)) === "1",
									onChange: (v) => setConfig(field.name, v ? "true" : "false")
								}, null, 8, ["model-value", "onChange"])) : field.type === "number" ? (openBlock(), createBlock(_component_ReInputNumber, {
									key: 1,
									"model-value": configValue(field.name) === "" ? void 0 : Number(configValue(field.name)),
									min: 0,
									style: { "width": "100%" },
									"onUpdate:modelValue": (v) => setConfig(field.name, v)
								}, null, 8, ["model-value", "onUpdate:modelValue"])) : (openBlock(), createBlock(_component_ReInput, {
									key: 2,
									"model-value": String(configValue(field.name)),
									placeholder: field.placeholder || "",
									"onUpdate:modelValue": (v) => setConfig(field.name, v)
								}, null, 8, [
									"model-value",
									"placeholder",
									"onUpdate:modelValue"
								]))]);
							}), 128))]),
							createVNode(_component_ReDivider, { "content-position": "left" }, {
								default: withCtx(() => [_cache[19] || (_cache[19] = createTextVNode(" 过滤器编排 ", -1)), createBaseVNode("span", _hoisted_6$2, "已挂载 " + toDisplayString(selectedCount.value) + " 个插件，同一实现可重复添加", 1)]),
								_: 1
							})
						]),
						_: 1
					}),
					createBaseVNode("div", _hoisted_7$2, [createBaseVNode("div", _hoisted_8$2, [createBaseVNode("div", _hoisted_9$2, [_cache[20] || (_cache[20] = createBaseVNode("span", null, "可用插件", -1)), createVNode(_component_ReInput, {
						modelValue: pickerKeyword.value,
						"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => pickerKeyword.value = $event),
						placeholder: "搜索",
						clearable: "",
						"prefix-icon": "Search",
						style: { "width": "130px" }
					}, null, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_10$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(filterGroups.value, (group) => {
						return openBlock(), createElementBlock("div", {
							key: group.key,
							class: "picker-group"
						}, [groupItems(group.items).length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_11$2, toDisplayString(group.label), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(groupItems(group.items), (item) => {
							return openBlock(), createElementBlock("div", {
								key: item.type,
								class: "picker-item",
								role: "button",
								tabindex: "0",
								onClick: ($event) => addFilter(item),
								onKeydown: [withKeys(withModifiers(($event) => addFilter(item), ["prevent"]), ["enter"]), withKeys(withModifiers(($event) => addFilter(item), ["prevent"]), ["space"])]
							}, [
								createBaseVNode("div", _hoisted_13$1, [
									createBaseVNode("span", _hoisted_14$1, toDisplayString(item.type), 1),
									createBaseVNode("span", _hoisted_15$1, toDisplayString(item.desc), 1),
									isCustomPickerItem(item) ? (openBlock(), createElementBlock("div", {
										key: 0,
										class: "pi-custom",
										onClick: _cache[9] || (_cache[9] = withModifiers(() => {}, ["stop"])),
										onKeydown: _cache[10] || (_cache[10] = withModifiers(() => {}, ["stop"]))
									}, [createVNode(_component_ReInput, {
										modelValue: customFilterType.value,
										"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => customFilterType.value = $event),
										placeholder: "com.example.MyServerFilter",
										clearable: "",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])], 32)) : createCommentVNode("", true)
								]),
								createVNode(_component_ReTag, { type: item.spi ? "success" : "primary" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(item.spi ? "SPI" : "预设"), 1)]),
									_: 2
								}, 1032, ["type"]),
								createVNode(_component_Plus, { class: "pi-add" })
							], 40, _hoisted_12$2);
						}), 128))], 64)) : createCommentVNode("", true)]);
					}), 128)), !__props.filterTypes.length ? (openBlock(), createElementBlock("div", _hoisted_16$1, "未获取到插件元数据")) : createCommentVNode("", true)])]), createBaseVNode("div", _hoisted_17$1, [createBaseVNode("div", _hoisted_18$1, [_cache[21] || (_cache[21] = createBaseVNode("span", null, "已挂载插件", -1)), createBaseVNode("span", _hoisted_19$1, toDisplayString(selectedCount.value) + " 个", 1)]), createBaseVNode("div", _hoisted_20$1, [!form.value.filters.length ? (openBlock(), createElementBlock("div", _hoisted_21$1, " 点击左侧插件添加到此处；点击条目可打开该实现的配置页 ")) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(form.value.filters, (f, index) => {
						return openBlock(), createElementBlock("div", {
							key: f.name,
							class: normalizeClass(["selected-item", { "is-off": f.enabled === false }]),
							role: "button",
							tabindex: "0",
							onClick: ($event) => openFilterConfig(index),
							onKeydown: [withKeys(withModifiers(($event) => openFilterConfig(index), ["prevent"]), ["enter"]), withKeys(withModifiers(($event) => openFilterConfig(index), ["prevent"]), ["space"])]
						}, [
							createBaseVNode("div", _hoisted_23, toDisplayString(index + 1), 1),
							createBaseVNode("div", _hoisted_24, [createBaseVNode("div", _hoisted_25, [createTextVNode(toDisplayString(f.name) + " ", 1), f.type && f.type !== f.name ? (openBlock(), createBlock(_component_ReTag, {
								key: 0,
								type: "info"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(f.type), 1)]),
								_: 2
							}, 1024)) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_26, [
								createBaseVNode("span", _hoisted_27, "order " + toDisplayString(f.order ?? 100), 1),
								_cache[22] || (_cache[22] = createBaseVNode("span", { class: "dim" }, "·", -1)),
								createBaseVNode("span", _hoisted_28, toDisplayString(Object.keys(f.params || {}).length) + " 个参数", 1),
								createVNode(_component_ReTag, { type: f.enabled === false ? "info" : "success" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(f.enabled === false ? "已停用" : "已启用"), 1)]),
									_: 2
								}, 1032, ["type"])
							])]),
							createVNode(_component_ArrowRight, {
								class: "si-go",
								"aria-hidden": "true"
							}),
							createBaseVNode("div", {
								class: "si-ops",
								onClick: _cache[11] || (_cache[11] = withModifiers(() => {}, ["stop"]))
							}, [
								createVNode(_component_ReSwitch, {
									"model-value": f.enabled !== false,
									onChange: (v) => {
										toggleDraft(index, !!v);
										toggleLive(index, !!v);
									}
								}, null, 8, ["model-value", "onChange"]),
								_cache[23] || (_cache[23] = createBaseVNode("span", {
									class: "si-ops-line",
									"aria-hidden": "true"
								}, null, -1)),
								createVNode(_component_ReButton, {
									icon: "Setting",
									layout: "square",
									type: "primary",
									tip: "配置该插件",
									onClick: ($event) => openFilterConfig(index)
								}, null, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "Top",
									layout: "square",
									tip: "上移一位",
									disabled: index === 0,
									onClick: ($event) => moveFilter(index, -1)
								}, null, 8, ["disabled", "onClick"]),
								createVNode(_component_ReButton, {
									icon: "Bottom",
									layout: "square",
									tip: "下移一位",
									disabled: index === form.value.filters.length - 1,
									onClick: ($event) => moveFilter(index, 1)
								}, null, 8, ["disabled", "onClick"]),
								createVNode(_component_ReButton, {
									icon: "Delete",
									layout: "square",
									type: "danger",
									tip: "从链上移除",
									onClick: ($event) => removeFilter(index)
								}, null, 8, ["onClick"])
							])
						], 42, _hoisted_22);
					}), 128))])])]),
					createBaseVNode("div", _hoisted_29, [
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Check",
							type: "primary",
							loading: submitting.value,
							onClick: submit
						}, {
							default: withCtx(() => [..._cache[24] || (_cache[24] = [createTextVNode("保存", -1)])]),
							_: 1
						}, 8, ["loading"]),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Lightning",
							loading: submitting.value,
							onClick: submitHot
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(isCreating.value ? "创建并启动" : "保存并热更新"), 1)]),
							_: 1
						}, 8, ["loading"]),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Close",
							onClick: _cache[12] || (_cache[12] = ($event) => visible.value = false)
						}, {
							default: withCtx(() => [..._cache[25] || (_cache[25] = [createTextVNode("取消", -1)])]),
							_: 1
						}),
						_cache[26] || (_cache[26] = createBaseVNode("span", { class: "dim" }, "热更新会就地替换过滤器链，服务不中断；仅监听地址/端口/引擎变更时才重启", -1))
					])
				])) : (openBlock(), createElementBlock("div", _hoisted_30, [createBaseVNode("div", _hoisted_31, [createVNode(_component_ReButton, {
					"show-text": "",
					icon: "ArrowLeft",
					onClick: _cache[13] || (_cache[13] = ($event) => backToEdit())
				}, {
					default: withCtx(() => [..._cache[27] || (_cache[27] = [createTextVNode("返回编排", -1)])]),
					_: 1
				}), createBaseVNode("span", _hoisted_32, "第 " + toDisplayString(activeIndex.value + 1) + " 个插件 · " + toDisplayString(form.value.filters[activeIndex.value]?.name), 1)]), createVNode(ScFilterConfigPanel_default, {
					modelValue: filterParams.value,
					"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => filterParams.value = $event),
					meta: activeMeta.value,
					"filter-type": activeFilterType.value,
					live: isLive.value,
					applying: applying.value,
					onApply: applyFilterParams,
					onOpenDetailPage: openFilterDetailPage
				}, null, 8, [
					"modelValue",
					"meta",
					"filter-type",
					"live",
					"applying"
				])]))]),
				_: 1
			}, 8, [
				"modelValue",
				"title",
				"size"
			]);
		};
	}
}), [["__scopeId", "data-v-5b7b0f9e"]]);
//#endregion
//#region ../../pages/server/src/components/ScServerDetailDrawer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = {
	key: 0,
	class: "server-detail"
};
var _hoisted_2$1 = { class: "status-cell" };
var _hoisted_3$1 = { class: "mono" };
var _hoisted_4$1 = {
	key: 0,
	class: "url-cell"
};
var _hoisted_5$1 = {
	key: 1,
	class: "dim"
};
var _hoisted_6$1 = ["title"];
var _hoisted_7$1 = { class: "mono" };
var _hoisted_8$1 = {
	key: 1,
	class: "detail-empty"
};
var _hoisted_9$1 = {
	key: 2,
	class: "detail-empty"
};
var _hoisted_10$1 = {
	key: 3,
	class: "filter-list"
};
var _hoisted_11$1 = { class: "fr-order" };
var _hoisted_12$1 = { class: "fr-main" };
var _hoisted_13 = { class: "fr-name" };
var _hoisted_14 = { class: "fr-desc" };
var _hoisted_15 = {
	key: 0,
	class: "fr-params"
};
var _hoisted_16 = {
	key: 1,
	class: "dim",
	style: { "font-size": "11px" }
};
var _hoisted_17 = { class: "fr-ops" };
var _hoisted_18 = { class: "detail-actions" };
var _hoisted_19 = {
	key: 1,
	class: "filter-page"
};
var _hoisted_20 = { class: "filter-page-bar" };
var _hoisted_21 = { class: "dim" };
//#endregion
//#region ../../pages/server/src/components/ScServerDetailDrawer.vue
var ScServerDetailDrawer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScServerDetailDrawer",
	props: /*@__PURE__*/ mergeModels({
		nodeId: {},
		filterTypes: {}
	}, {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["changed", "open-detail-page"], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* 服务管理 —— Server 节点详情抽屉。
		*
		* 展示运行态与过滤器链；对运行中的服务提供：
		*   - 单个过滤器热启停（/filters/{i}/toggle）
		*   - 单个过滤器参数热更新（/filters/{i}/params，进入该实现的配置页）
		*   - 插件深度查看页入口（不同实现不同页面，如 file-storage → 文件管理器）
		*/
		const props = __props;
		const emit = __emit;
		const visible = useModel(__props, "modelValue");
		/** 视图：详情 / 单个插件配置页 */
		const view = ref("detail");
		/** 节点数据 */
		const node = ref(null);
		/** 加载中 */
		const loading = ref(false);
		/** 操作中 */
		const acting = ref(false);
		/** 当前配置的过滤器下标 */
		const activeIndex = ref(0);
		/** 参数草稿 */
		const filterParams = ref({});
		/** 状态文案 */
		const statusText = {
			RUNNING: "运行中",
			STOPPED: "已停止",
			ERROR: "异常"
		};
		/** 是否运行中 */
		const isLive = computed(() => node.value?.status === "RUNNING");
		/** 访问地址一键复制 */
		async function copyServerUrl() {
			const url = node.value?.serverUrl;
			if (!url) return;
			try {
				await navigator.clipboard.writeText(url);
				message.success("已复制到剪贴板");
			} catch {
				const ta = document.createElement("textarea");
				ta.value = url;
				ta.style.cssText = "position:fixed;opacity:0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
				message.success("已复制到剪贴板");
			}
		}
		/** 重启（先停再启，用于 ERROR 节点排障） */
		async function onRestart() {
			if (!node.value) return;
			acting.value = true;
			try {
				await restartServerNode(node.value.id);
				message.success("服务已重启");
				await load();
				emit("changed");
			} catch (e) {
				message.error(e.message);
			} finally {
				acting.value = false;
			}
		}
		/**
		* 从过滤器链上移除指定下标的过滤器（热更新实现，详情抽屉内直接操作）。
		*/
		async function removeFilter(index) {
			if (!node.value) return;
			const target = node.value.filters?.[index];
			if (!target) return;
			const remaining = (node.value.filters || []).filter((_, i) => i !== index);
			acting.value = true;
			try {
				await hotUpdateServerNode(node.value.id, {
					name: node.value.name,
					protocol: node.value.protocol,
					engine: node.value.engine,
					host: node.value.host,
					port: node.value.port,
					enabled: node.value.enabled,
					remark: node.value.remark,
					config: node.value.config || {},
					filters: remaining.map((f, i) => ({
						name: f.name,
						type: f.type,
						order: 100 + i * 10,
						enabled: f.enabled,
						params: f.params || {}
					}))
				});
				message.success(`已移除插件「${target.name}」`);
				await load();
				emit("changed");
			} catch (e) {
				message.error(e.message);
			} finally {
				acting.value = false;
			}
		}
		/** 当前配置的插件类型 */
		const activeFilterType = computed(() => {
			const f = node.value?.filters?.[activeIndex.value];
			return f?.type || f?.name || "";
		});
		/** 当前配置的插件元数据 */
		const activeMeta = computed(() => props.filterTypes.find((f) => f.type === activeFilterType.value) || null);
		watch(visible, (open) => {
			if (!open) return;
			view.value = "detail";
			load();
		});
		watch(() => props.nodeId, () => {
			if (visible.value) load();
		});
		async function load() {
			if (props.nodeId == null) return;
			loading.value = true;
			try {
				node.value = await getServerNode(props.nodeId);
			} catch (e) {
				message.error(e.message);
			} finally {
				loading.value = false;
			}
		}
		/** 插件元数据 */
		function metaOf(index) {
			const f = node.value?.filters?.[index];
			if (!f) return void 0;
			return props.filterTypes.find((t) => t.type === (f.type || f.name));
		}
		/** 该插件是否提供深度查看入口（node 型 / route 型都算） */
		function hasDetail(index) {
			return hasFilterDetail(metaOf(index));
		}
		/** 过滤器参数条目 */
		function paramEntries(index) {
			const params = node.value?.filters?.[index]?.params || {};
			return Object.entries(params).map(([key, value]) => ({
				key,
				value: String(value)
			}));
		}
		async function onStart() {
			if (!node.value) return;
			acting.value = true;
			try {
				await startServerNode(node.value.id);
				message.success("服务已启动");
				await load();
				emit("changed");
			} catch (e) {
				message.error(e.message);
			} finally {
				acting.value = false;
			}
		}
		async function onStop() {
			if (!node.value) return;
			acting.value = true;
			try {
				await stopServerNode(node.value.id);
				message.success("服务已停止");
				await load();
				emit("changed");
			} catch (e) {
				message.error(e.message);
			} finally {
				acting.value = false;
			}
		}
		/** 热切换单个过滤器启停 */
		async function onToggleFilter(index, enabled) {
			if (!node.value) return;
			try {
				await toggleServerFilter(node.value.id, index, enabled);
				message.success(`插件已${enabled ? "启用" : "停用"}（热生效，服务未中断）`);
				await load();
				emit("changed");
			} catch (e) {
				message.error(e.message);
			}
		}
		/** 进入插件配置页 */
		function openConfig(index) {
			activeIndex.value = index;
			filterParams.value = { ...node.value?.filters?.[index]?.params || {} };
			view.value = "filter";
		}
		/** 热更新当前插件参数 */
		async function applyParams() {
			if (!node.value) return;
			acting.value = true;
			try {
				await updateServerFilterParams(node.value.id, activeIndex.value, filterParams.value);
				message.success("插件参数已热更新，服务未中断");
				await load();
				emit("changed");
				view.value = "detail";
			} catch (e) {
				message.error(e.message);
			} finally {
				acting.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_ReText = resolveComponent("ReText");
			const _component_ReDescriptionsItem = resolveComponent("ReDescriptionsItem");
			const _component_ReStatusIndicator = resolveComponent("ReStatusIndicator");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReDescriptions = resolveComponent("ReDescriptions");
			const _component_ReDivider = resolveComponent("ReDivider");
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReSkeleton = resolveComponent("ReSkeleton");
			const _component_ReDrawer = resolveComponent("ReDrawer");
			return openBlock(), createBlock(_component_ReDrawer, {
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => visible.value = $event),
				title: view.value === "detail" ? `服务详情 - ${node.value?.name || ""}` : `插件配置 - ${node.value?.filters?.[activeIndex.value]?.name || ""}`,
				size: view.value === "detail" ? 820 : 760,
				direction: "rtl",
				"close-only": "",
				"footer-hidden": true
			}, {
				content: withCtx(() => [view.value === "detail" ? (openBlock(), createElementBlock("div", _hoisted_1$1, [createVNode(_component_ReSkeleton, {
					loading: loading.value,
					rows: 6,
					count: 1,
					animated: ""
				}, {
					default: withCtx(() => [node.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						createVNode(_component_ReDescriptions, {
							column: 2,
							border: ""
						}, {
							default: withCtx(() => [
								createVNode(_component_ReDescriptionsItem, { label: "服务名称" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(node.value.name) + " ", 1), node.value.id ? (openBlock(), createBlock(_component_ReText, {
										key: 0,
										type: "secondary",
										style: {
											"margin-left": "8px",
											"font-size": "11px"
										}
									}, {
										default: withCtx(() => [createTextVNode("#" + toDisplayString(node.value.id), 1)]),
										_: 1
									})) : createCommentVNode("", true)]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "运行状态" }, {
									default: withCtx(() => [createBaseVNode("span", _hoisted_2$1, [createVNode(_component_ReStatusIndicator, {
										type: node.value.status === "RUNNING" ? "success" : node.value.status === "ERROR" ? "danger" : "info",
										pulse: node.value.status === "RUNNING"
									}, null, 8, ["type", "pulse"]), createTextVNode(" " + toDisplayString(statusText[node.value.status] || node.value.status), 1)])]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "协议类型" }, {
									default: withCtx(() => [createVNode(_component_ReTag, null, {
										default: withCtx(() => [createTextVNode(toDisplayString(node.value.protocolDesc || node.value.protocol), 1)]),
										_: 1
									}), createVNode(_component_ReText, {
										type: "info",
										style: { "margin-left": "6px" }
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(node.value.protocol), 1)]),
										_: 1
									})]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "传输引擎" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(node.value.engine || "-"), 1)]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "监听地址" }, {
									default: withCtx(() => [createBaseVNode("span", _hoisted_3$1, toDisplayString(node.value.host || "0.0.0.0") + ":" + toDisplayString(node.value.port ?? "-"), 1)]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "访问地址" }, {
									default: withCtx(() => [node.value.serverUrl ? (openBlock(), createElementBlock("div", _hoisted_4$1, [createVNode(_component_ReText, { type: "primary" }, {
										default: withCtx(() => [createTextVNode(toDisplayString(node.value.serverUrl), 1)]),
										_: 1
									}), createVNode(_component_ReButton, {
										icon: "Copy",
										layout: "square",
										tip: "复制地址",
										onClick: copyServerUrl
									})])) : (openBlock(), createElementBlock("span", _hoisted_5$1, toDisplayString(node.value.status === "ERROR" ? "服务启动失败，修复后可用" : "未运行"), 1))]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "自动启用" }, {
									default: withCtx(() => [createVNode(_component_ReTag, { type: node.value.enabled === 1 ? "success" : "info" }, {
										default: withCtx(() => [createTextVNode(toDisplayString(node.value.enabled === 1 ? "是" : "否"), 1)]),
										_: 1
									}, 8, ["type"])]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, { label: "已挂插件" }, {
									default: withCtx(() => [createVNode(_component_ReTag, { type: "success" }, {
										default: withCtx(() => [createTextVNode(toDisplayString(node.value.filters?.length ?? 0) + " 个", 1)]),
										_: 1
									})]),
									_: 1
								}),
								createVNode(_component_ReDescriptionsItem, {
									label: "备注",
									span: 2
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(node.value.remark || "-"), 1)]),
									_: 1
								}),
								node.value.error ? (openBlock(), createBlock(_component_ReDescriptionsItem, {
									key: 0,
									label: "最近错误",
									span: 2
								}, {
									default: withCtx(() => [createBaseVNode("span", {
										class: "error-text",
										title: node.value.error
									}, toDisplayString(node.value.error), 9, _hoisted_6$1)]),
									_: 1
								})) : createCommentVNode("", true)
							]),
							_: 1
						}),
						createVNode(_component_ReDivider, { "content-position": "left" }, {
							default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode("协议配置", -1)])]),
							_: 1
						}),
						Object.keys(node.value.config || {}).length ? (openBlock(), createBlock(_component_ReDescriptions, {
							key: 0,
							column: 2,
							border: ""
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(node.value.config, (v, k) => {
								return openBlock(), createBlock(_component_ReDescriptionsItem, {
									key: k,
									label: String(k)
								}, {
									default: withCtx(() => [createBaseVNode("span", _hoisted_7$1, toDisplayString(v), 1)]),
									_: 2
								}, 1032, ["label"]);
							}), 128))]),
							_: 1
						})) : (openBlock(), createElementBlock("div", _hoisted_8$1, "未配置协议专属参数")),
						createVNode(_component_ReDivider, { "content-position": "left" }, {
							default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode(" 过滤器链 ", -1), createBaseVNode("span", {
								class: "dim",
								style: {
									"margin-left": "8px",
									"font-size": "11px"
								}
							}, "按 order 升序执行", -1)])]),
							_: 1
						}),
						!node.value.filters?.length ? (openBlock(), createElementBlock("div", _hoisted_9$1, " 未挂载任何 ServerFilter 插件，点击「编辑」进入编排 ")) : (openBlock(), createElementBlock("div", _hoisted_10$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(node.value.filters, (f, index) => {
							return openBlock(), createElementBlock("div", {
								key: f.name,
								class: normalizeClass(["filter-row", { "is-off": f.enabled === false }])
							}, [
								createBaseVNode("div", _hoisted_11$1, toDisplayString(index + 1), 1),
								createBaseVNode("div", _hoisted_12$1, [
									createBaseVNode("div", _hoisted_13, [
										createTextVNode(toDisplayString(f.name) + " ", 1),
										f.type && f.type !== f.name ? (openBlock(), createBlock(_component_ReTag, {
											key: 0,
											type: "info"
										}, {
											default: withCtx(() => [createTextVNode(toDisplayString(f.type), 1)]),
											_: 2
										}, 1024)) : createCommentVNode("", true),
										metaOf(index)?.spi ? (openBlock(), createBlock(_component_ReTag, {
											key: 1,
											type: "success"
										}, {
											default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("SPI", -1)])]),
											_: 1
										})) : createCommentVNode("", true),
										metaOf(index)?.group ? (openBlock(), createBlock(_component_ReTag, { key: 2 }, {
											default: withCtx(() => [createTextVNode(toDisplayString(metaOf(index)?.group), 1)]),
											_: 2
										}, 1024)) : createCommentVNode("", true)
									]),
									createBaseVNode("div", _hoisted_14, toDisplayString(metaOf(index)?.desc || "未找到插件元数据"), 1),
									paramEntries(index).length ? (openBlock(), createElementBlock("div", _hoisted_15, [(openBlock(true), createElementBlock(Fragment, null, renderList(paramEntries(index), (p) => {
										return openBlock(), createBlock(_component_ReTag, {
											key: p.key,
											type: "info",
											style: {
												"margin-right": "4px",
												"margin-bottom": "4px"
											}
										}, {
											default: withCtx(() => [createTextVNode(toDisplayString(p.key) + "=" + toDisplayString(p.value), 1)]),
											_: 2
										}, 1024);
									}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_16, "未配置参数"))
								]),
								createBaseVNode("div", _hoisted_17, [
									createVNode(_component_ReSwitch, {
										"model-value": f.enabled !== false,
										disabled: !isLive.value,
										onChange: (v) => onToggleFilter(index, !!v)
									}, null, 8, [
										"model-value",
										"disabled",
										"onChange"
									]),
									createVNode(_component_ReButton, {
										link: "",
										type: "primary",
										onClick: ($event) => openConfig(index)
									}, {
										default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("配置", -1)])]),
										_: 1
									}, 8, ["onClick"]),
									hasDetail(index) ? (openBlock(), createBlock(_component_ReButton, {
										key: 0,
										icon: "TopRight",
										layout: "square",
										type: "success",
										tip: metaOf(index)?.detailLabel || "查看详情",
										onClick: ($event) => node.value && emit("open-detail-page", node.value, index)
									}, null, 8, ["tip", "onClick"])) : createCommentVNode("", true),
									createVNode(_component_ReButton, {
										icon: "Delete",
										layout: "square",
										type: "danger",
										tip: "从链上移除",
										onClick: ($event) => removeFilter(index)
									}, null, 8, ["onClick"])
								])
							], 2);
						}), 128))])),
						createBaseVNode("div", _hoisted_18, [node.value.status === "ERROR" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Refresh",
							type: "warning",
							loading: acting.value,
							onClick: onRestart
						}, {
							default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("重启服务", -1)])]),
							_: 1
						}, 8, ["loading"]), _cache[9] || (_cache[9] = createBaseVNode("span", { class: "dim" }, "服务异常，点击重启尝试恢复", -1))], 64)) : node.value.status === "RUNNING" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
							createVNode(_component_ReButton, {
								"show-text": "",
								icon: "VideoPause",
								type: "warning",
								loading: acting.value,
								onClick: onStop
							}, {
								default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("停止服务", -1)])]),
								_: 1
							}, 8, ["loading"]),
							createVNode(_component_ReButton, {
								"show-text": "",
								icon: "Refresh",
								onClick: load
							}, {
								default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("刷新状态", -1)])]),
								_: 1
							}),
							_cache[12] || (_cache[12] = createBaseVNode("span", { class: "dim" }, "插件启停与参数调整均热生效，服务不中断", -1))
						], 64)) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [
							createVNode(_component_ReButton, {
								"show-text": "",
								icon: "VideoPlay",
								type: "success",
								loading: acting.value,
								onClick: onStart
							}, {
								default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("启动服务", -1)])]),
								_: 1
							}, 8, ["loading"]),
							createVNode(_component_ReButton, {
								"show-text": "",
								icon: "Refresh",
								onClick: load
							}, {
								default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("刷新状态", -1)])]),
								_: 1
							}),
							_cache[15] || (_cache[15] = createBaseVNode("span", { class: "dim" }, "插件启停与参数调整均热生效，服务不中断", -1))
						], 64))])
					], 64)) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["loading"])])) : (openBlock(), createElementBlock("div", _hoisted_19, [createBaseVNode("div", _hoisted_20, [createVNode(_component_ReButton, {
					"show-text": "",
					icon: "ArrowLeft",
					onClick: _cache[0] || (_cache[0] = ($event) => view.value = "detail")
				}, {
					default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("返回详情", -1)])]),
					_: 1
				}), createBaseVNode("span", _hoisted_21, "第 " + toDisplayString(activeIndex.value + 1) + " 个插件 · " + toDisplayString(node.value?.filters?.[activeIndex.value]?.name), 1)]), createVNode(ScFilterConfigPanel_default, {
					modelValue: filterParams.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filterParams.value = $event),
					meta: activeMeta.value,
					"filter-type": activeFilterType.value,
					live: isLive.value,
					applying: acting.value,
					onApply: applyParams,
					onOpenDetailPage: _cache[2] || (_cache[2] = ($event) => node.value && emit("open-detail-page", node.value, activeIndex.value))
				}, null, 8, [
					"modelValue",
					"meta",
					"filter-type",
					"live",
					"applying"
				])]))]),
				_: 1
			}, 8, [
				"modelValue",
				"title",
				"size"
			]);
		};
	}
}), [["__scopeId", "data-v-ed09e150"]]);
//#endregion
//#region ../../pages/server/src/utils/confirmThen.ts
/**
* 把「取消即 reject」的确认框包成布尔语义。
*
* <p><b>为什么需要它</b>：{@code @repo/core} 的 {@code message.confirm}
* 底层是 {@code msgBox}，它在用户点「取消」时走的是
* {@code .catch(() => reject(false))} —— 也就是<b>抛异常</b>而不是返回
* {@code false}。</p>
*
* <p>这带来两个真实后果：</p>
* <ol>
*   <li>写成 {@code await message.confirm(...)} 且外面没有 try/catch 时，
*       「取消」会产生一个<b>未捕获的 Promise rejection</b>。删除类操作里
*       它是每次取消都往控制台刷一条红字；一旦全局挂了
*       {@code unhandledrejection} 上报，用户刚点「取消」就收到一个
*       「系统繁忙」提示 —— 明明是他自己取消的。</li>
*   <li>更隐蔽的一种写法是 {@code if (await message.confirm(...))}：
*       取消时直接抛穿，后面的语句不执行，看起来「恰好是对的」，
*       于是没人发现这个函数其实靠抛异常来表达「不」，
*       下一个改它的人很容易把 catch 补成「吞掉所有异常」，
*       把真正的删除失败也一起吞掉。</li>
* </ol>
*
* <p>本函数把语义摆正：<b>确认返回 true，取消返回 false，永不抛出</b>。
* 确认框本身的失败（弹不出来等）也算 false —— 拿不到用户的明确同意
* 就不该继续执行破坏性操作。</p>
*/
/**
* 等待一次确认，拿到布尔结果。
*
* @param confirmFn 确认框函数，签名需与 `message.confirm` 兼容
* @param args      透传给确认框的参数
* @returns 用户确认返回 true；取消、关闭、或确认框自身抛错一律返回 false
*/
async function confirmThen(confirmFn, ...args) {
	try {
		await confirmFn(...args);
		return true;
	} catch {
		return false;
	}
}
//#endregion
//#region ../../pages/server/src/utils/autoRefresh.ts
/** 默认策略：10s 起步，失败 2 倍退避，最多 6 次后停在 5min 上限 */
var DEFAULT_AUTO_REFRESH = {
	intervalMs: 1e4,
	backoffFactor: 2,
	maxIntervalMs: 3e5,
	maxBackoffCount: 6
};
/** 浏览器默认依赖；在无 document 的环境（SSR/测试）下退化为「始终可见 + setTimeout」 */
function browserDeps() {
	return {
		setTimer: (fn, ms) => {
			const id = setTimeout(fn, ms);
			return () => clearTimeout(id);
		},
		isVisible: () => {
			if (typeof document === "undefined") return true;
			return document.visibilityState !== "hidden";
		}
	};
}
/**
* 创建自动刷新句柄。
*
* @param task 每轮要执行的拉取；返回值用于判定成功/失败
* @param options 策略配置
* @param deps 调度依赖
* @returns 句柄
*/
function createAutoRefresh(task, options = DEFAULT_AUTO_REFRESH, deps = browserDeps()) {
	let cancelTimer = null;
	let running = false;
	let inFlight = false;
	let failures = 0;
	let interval = options.intervalMs;
	/** 计算下一轮间隔；成功次数为 0 时按退避放大并封顶 */
	function nextInterval() {
		if (failures <= 0) return Math.min(options.intervalMs, options.maxIntervalMs);
		const grown = Math.round(options.intervalMs * options.backoffFactor ** failures);
		return Math.min(grown, options.maxIntervalMs);
	}
	function schedule() {
		cancelTimer?.();
		interval = nextInterval();
		cancelTimer = deps.setTimer(() => {
			tick();
		}, interval);
	}
	async function tick() {
		if (!running) return;
		if (!deps.isVisible()) {
			schedule();
			return;
		}
		if (inFlight) {
			schedule();
			return;
		}
		inFlight = true;
		schedule();
		try {
			await task();
			failures = 0;
		} catch {
			failures = Math.min(failures + 1, options.maxBackoffCount);
		} finally {
			inFlight = false;
		}
	}
	return {
		start() {
			if (running) return;
			running = true;
			schedule();
		},
		stop() {
			running = false;
			cancelTimer?.();
			cancelTimer = null;
		},
		currentIntervalMs() {
			return interval;
		}
	};
}
//#endregion
//#region ../../pages/server/src/utils/metaLoad.ts
/**
* 按加载结果生成提示。
*
* @param result 三类请求的成败与错误信息
* @returns 提示；一切正常时 {@code show=false}
*/
function describeMetaLoad(result) {
	const { nodesOk, protocolsOk, filtersOk, nodesError, protocolsError, filtersError } = result;
	if (!nodesOk) return {
		show: true,
		tone: "error",
		text: `服务列表加载失败：${nodesError ?? "未知原因"}`
	};
	const degraded = [];
	if (!protocolsOk) degraded.push(`协议列表（${protocolsError ?? "未知原因"}）`);
	if (!filtersOk) degraded.push(`插件列表（${filtersError ?? "未知原因"}）`);
	if (degraded.length > 0) return {
		show: true,
		tone: "warning",
		text: `部分元数据加载失败：${degraded.join("、")}。协议与插件下拉可能不完整，新建/编辑前请先刷新确认。`
	};
	return {
		show: false,
		tone: "warning",
		text: ""
	};
}
//#endregion
//#region ../../pages/server/src/utils/nodeList.ts
/** 状态文案表：未知状态走 unknown 兜底，不复用任何已有文案 */
var STATUS_TEXT = {
	RUNNING: "运行中",
	STOPPED: "已停止",
	ERROR: "异常"
};
/** 状态色调表 */
var STATUS_TONE = {
	RUNNING: "success",
	STOPPED: "info",
	ERROR: "danger",
	unknown: "info"
};
/**
* 取空白安全的原因文案。
*
* @param raw 后端原样返回的 error 字段
* @return 去掉首尾空白后的原因；没有可用内容时返回空串
*/
function normalizeReason(raw) {
	return typeof raw === "string" ? raw.trim() : "";
}
/**
* 计算单个节点的状态展示信息。
*
* @param node 节点视图
* @return 状态展示结果；传入 null 时按「未知」处理
*/
function deriveStatusMeta(node) {
	const status = node?.status ?? "";
	const known = status in STATUS_TEXT;
	return {
		text: known ? STATUS_TEXT[status] : `未知(${status || "空"})`,
		tone: STATUS_TONE[known ? status : "unknown"],
		pulse: status === "RUNNING",
		reason: status === "ERROR" ? normalizeReason(node?.error) : ""
	};
}
/**
* 统计列表。
*
* @param nodes 节点列表
* @return 统计结果；传入空列表时全部为 0，不返回 NaN
*/
function summarizeNodes(nodes) {
	const stats = {
		total: 0,
		running: 0,
		stopped: 0,
		error: 0,
		unknown: 0,
		plugins: 0
	};
	if (!Array.isArray(nodes)) return stats;
	for (const node of nodes) {
		stats.total += 1;
		const status = node?.status ?? "";
		if (status === "RUNNING") stats.running += 1;
		else if (status === "STOPPED") stats.stopped += 1;
		else if (status === "ERROR") stats.error += 1;
		else stats.unknown += 1;
		stats.plugins += node?.filters?.length ?? 0;
	}
	return stats;
}
/**
* 取节点参与搜索匹配的文本。
*
* <p>刻意包含 {@code error}：节点异常时用户最想搜的就是报错关键字
* （如端口号、BindException），只搜名称等于把排障入口堵死。</p>
*
* @param node 节点视图
* @return 小写化的匹配文本
*/
function searchableText(node) {
	return [
		node.name,
		node.protocol,
		node.protocolDesc ?? "",
		node.host ?? "",
		node.port ?? "",
		node.engine ?? "",
		node.serverUrl ?? "",
		node.error ?? ""
	].join(" ").toLowerCase();
}
/**
* 按关键字与协议过滤节点。
*
* @param nodes 节点列表
* @param filter 过滤条件
* @return 命中过滤的节点（保持原顺序，不复制元素）
*/
function filterNodes(nodes, filter = {}) {
	if (!Array.isArray(nodes)) return [];
	const keyword = (filter.keyword ?? "").trim().toLowerCase();
	const protocol = filter.protocol ?? "";
	return nodes.filter((node) => {
		if (protocol && node?.protocol !== protocol) return false;
		if (!keyword) return true;
		return searchableText(node).includes(keyword);
	});
}
/**
* 渲染监听地址。
*
* <p>空端口渲染成 {@code -} 而不是 {@code null}：列表里「监听地址」为空
* 通常意味着定义不完整，是需要被看见的异常状态。</p>
*
* @param node 节点视图
* @return 形如 {@code 0.0.0.0:19080} 的文本
*/
function formatListenText(node) {
	return `${node?.host?.trim() ? node.host.trim() : "0.0.0.0"}:${node?.port ?? "-"}`;
}
/**
* 协议下拉选项。
*
* <p>SPI 动态发现的协议加「（SPI）」后缀，与既有列表展示保持一致，
* 避免同一个协议在筛选框和表格里长得不一样。</p>
*
* @param protocols 协议元数据
* @return 下拉选项
*/
function buildProtocolOptions(protocols) {
	if (!Array.isArray(protocols)) return [];
	return protocols.filter((p) => !!p?.alias).map((p) => ({
		label: `${p.alias}${p.spi ? "（SPI）" : ""} - ${p.desc ?? ""}`,
		value: p.alias
	}));
}
/**
* 判断是否为反向代理类协议（表格里用不同颜色区分）。
*
* @param protocol 协议编码
* @return true 表示代理类
*/
function isProxyProtocol(protocol) {
	return typeof protocol === "string" && protocol.indexOf("proxy") >= 0;
}
//#endregion
//#region ../../pages/server/src/views/ScServiceManage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "service-manage sc-page" };
var _hoisted_2 = {
	class: "stats-grid",
	title: "基于 Server 接口的协议服务器节点编排，支持 ServerFilter 插件挂载与热更新"
};
var _hoisted_3 = { class: "page-toolbar" };
var _hoisted_4 = { class: "dim tb-meta" };
var _hoisted_5 = { class: "tb-ops" };
var _hoisted_6 = { style: {
	"position": "relative",
	"min-height": "0",
	"flex": "1 1 0"
} };
var _hoisted_7 = {
	key: 0,
	class: "empty-guide"
};
var _hoisted_8 = { class: "status-cell" };
var _hoisted_9 = { class: "status-line" };
var _hoisted_10 = ["title"];
var _hoisted_11 = { class: "mono" };
var _hoisted_12 = {
	key: 1,
	class: "dim"
};
//#endregion
//#region ../../pages/server/src/views/ScServiceManage.vue
var ScServiceManage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScServiceManage",
	setup(__props) {
		/**
		* 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
		*
		* 主页面职责：
		*   1. Server 节点增删改查，协议下拉取自后端 /protocols（内置四类 + Server SPI 动态发现）
		*   2. 启停、热更新（过滤器链就地替换，不中断服务）
		*   3. 打开编辑抽屉做过滤器编排（左 SPI → 右已选，可重复添加）
		*   4. 打开详情抽屉查看运行态与过滤器链，并支持单过滤器热启停 / 热改参
		*
		* 视觉（对齐「代理管理」「账号管理」页）：顶部 ReSectionHead 已删除——页面标题由
		* 外壳面包屑承担，其中的「新增服务 / 刷新」合并到筛选行右侧、统一改成图标 + tip；
		* 统计卡改用 ReStatCard 的 icon 属性（原先用 #icon 插槽塞裸图标，绕过了组件自带的
		* 渐变图标圆）；数据表格吃满剩余高度、表体内部滚动。
		*
		* ⚠ 统计卡的 icon 必须是脚本作用域里的**组件**（ReStatCard 内部走
		* {@code <component :is="icon" />}），所以图标必须显式 import —— 全局注册的组件
		* 在模板表达式里取不到标识符，写成 {@code :icon="Monitor"} 会静默渲染成 undefined。
		*/
		const router = useRouter();
		/** 节点列表 */
		const nodes = ref([]);
		/** 协议元数据（下拉用） */
		const protocols = ref([]);
		/** 插件元数据（编辑抽屉用） */
		const filterTypes = ref([]);
		/** 加载态 */
		const loading = ref(false);
		/** 操作中的节点 id（按钮 loading） */
		const actingId = ref(null);
		/** 编辑抽屉 */
		const formVisible = ref(false);
		const editingNode = ref(null);
		/** 详情抽屉 */
		const detailVisible = ref(false);
		const detailNodeId = ref(null);
		/** 关键字过滤 */
		const keyword = ref("");
		/** 协议过滤 */
		const filterProtocol = ref("");
		/** 首屏/刷新的加载提示（协议或插件元数据失败时必须出声，不能静默变空） */
		const loadNotice = ref({
			show: false,
			tone: "warning",
			text: ""
		});
		/** 统计 */
		const stats = computed(() => summarizeNodes(nodes.value));
		/** 过滤后的列表 */
		const visibleNodes = computed(() => filterNodes(nodes.value, {
			keyword: keyword.value,
			protocol: filterProtocol.value
		}));
		/** 协议下拉选项（内置 + SPI 动态，SPI 项加后缀标识） */
		const protocolOptions = computed(() => buildProtocolOptions(protocols.value));
		/** 传给抽屉的名称列表（编辑时排除自身，克隆时排除克隆源） */
		const existingNamesForDrawer = computed(() => {
			return nodes.value.filter((n) => n.id !== editingNode.value?.id).map((n) => n.name);
		});
		/**
		* 把任意异常压成一句可展示的短文本。
		*
		* 后端失败时抛出的是 `{code,msg}` 形态的对象而不是 Error，直接
		* `(e as Error).message` 会渲染出 `[object Object]`。
		*/
		function reasonText(e) {
			if (e instanceof Error && e.message) return e.message;
			if (e && typeof e === "object" && "msg" in e) {
				const msg = e.msg;
				if (typeof msg === "string" && msg) return msg;
			}
			return typeof e === "string" && e ? e : "未知错误";
		}
		onMounted(() => {
			refresh();
			autoRefresh.start();
			document.addEventListener("visibilitychange", onVisibilityChange);
		});
		onUnmounted(() => {
			autoRefresh.stop();
			document.removeEventListener("visibilitychange", onVisibilityChange);
		});
		function onVisibilityChange() {
			if (document.visibilityState === "visible") refresh(true);
		}
		/**
		* 拉取列表与元数据。
		*
		* @param silent 静默模式：自动刷新用。不弹 toast —— 每 10 秒一次的话
		*   后端故障期间会把界面糊满错误提示，反而看不见真正的问题。
		*   失败信息由 `loadNotice` 承载。
		*/
		async function refresh(silent = false) {
			loading.value = true;
			try {
				const [nodesResult, protocolsResult, filtersResult] = await Promise.allSettled([
					listServerNodes(),
					listProtocols(),
					listFilterTypes()
				]);
				if (nodesResult.status === "fulfilled") nodes.value = nodesResult.value ?? [];
				if (protocolsResult.status === "fulfilled") protocols.value = protocolsResult.value ?? [];
				if (filtersResult.status === "fulfilled") filterTypes.value = filtersResult.value ?? [];
				loadNotice.value = describeMetaLoad({
					nodesOk: nodesResult.status === "fulfilled",
					protocolsOk: protocolsResult.status === "fulfilled",
					filtersOk: filtersResult.status === "fulfilled",
					nodesError: nodesResult.status === "rejected" ? reasonText(nodesResult.reason) : void 0,
					protocolsError: protocolsResult.status === "rejected" ? reasonText(protocolsResult.reason) : void 0,
					filtersError: filtersResult.status === "rejected" ? reasonText(filtersResult.reason) : void 0
				});
				if (!silent && nodesResult.status === "rejected") message.error(reasonText(nodesResult.reason));
				if (nodesResult.status === "rejected") throw nodesResult.reason;
			} catch (e) {
				if (!silent) message.error(reasonText(e));
			} finally {
				loading.value = false;
			}
		}
		/** 自动刷新句柄 */
		const autoRefresh = createAutoRefresh(() => refresh(true), DEFAULT_AUTO_REFRESH);
		/** 协议展示：SPI 协议取描述，内置取中文描述 */
		function protocolLabel(row) {
			return row.protocolDesc || row.protocol;
		}
		function openCreate() {
			editingNode.value = null;
			formVisible.value = true;
		}
		function openEdit(row) {
			editingNode.value = row;
			formVisible.value = true;
		}
		function openDetail(row) {
			detailNodeId.value = row.id;
			detailVisible.value = true;
		}
		/** 克隆节点：复制全部字段，名称自动加 -clone 后缀，列表校验时排除自身 */
		function openClone(row) {
			editingNode.value = {
				...row,
				id: 0,
				name: `${row.name}-clone`,
				status: "STOPPED",
				error: void 0,
				serverUrl: void 0,
				enabled: row.enabled ?? 0
			};
			formVisible.value = true;
		}
		async function onStart(row) {
			actingId.value = row.id;
			try {
				await startServerNode(row.id);
				message.success(`服务「${row.name}」已启动`);
				await refresh();
			} catch (e) {
				message.error(reasonText(e));
			} finally {
				actingId.value = null;
			}
		}
		async function onStop(row) {
			actingId.value = row.id;
			try {
				await stopServerNode(row.id);
				message.success(`服务「${row.name}」已停止`);
				await refresh();
			} catch (e) {
				message.error(reasonText(e));
			} finally {
				actingId.value = null;
			}
		}
		async function onRestart(row) {
			actingId.value = row.id;
			try {
				await restartServerNode(row.id);
				message.success(`服务「${row.name}」已重启`);
				await refresh();
			} catch (e) {
				message.error(reasonText(e));
			} finally {
				actingId.value = null;
			}
		}
		/**
		* 删除节点。
		*
		* 用 `confirmThen` 而不是直接 `await message.confirm`：后者在「取消」时是
		* **reject(false)**，直接 await 会让取消动作变成一个未捕获的 Promise
		* rejection —— 每取消一次刷一条红字，若全局挂了 unhandledrejection 上报，
		* 用户刚点「取消」还会收到一个「系统繁忙」提示。
		*
		* 这里的 if 是必要的：布尔语义下不判断返回值就等于把「取消」当「确认」。
		*/
		async function onDelete(row) {
			if (!await confirmThen(message.confirm, `确认删除服务「${row.name}」？运行中的实例会先被停止。`, "删除服务")) return;
			actingId.value = row.id;
			try {
				await deleteServerNode(row.id);
				message.success("已删除");
				await refresh();
			} catch (e) {
				message.error(reasonText(e));
			} finally {
				actingId.value = null;
			}
		}
		/**
		* 打开插件深度查看页（不同实现不同页面）。
		*
		* node 型（如 file-storage）的深度页面由插件自身的 HTTP 服务托管，新窗口直开节点地址；
		* route 型（如 service-discovery）由宿主应用托管，先校验路由存在再跳，避免死链。
		*/
		function openDetailPage(row, index) {
			const filter = row.filters?.[index];
			if (!filter) return;
			const target = resolveFilterDetail(filterTypes.value.find((f) => f.type === (filter.type || filter.name)), filter, row);
			if (!target) {
				message.info("该插件未提供深度查看页");
				return;
			}
			if (target.kind === "unavailable") {
				message.info(target.reason);
				return;
			}
			if (target.kind === "node") {
				window.open(target.url, "_blank", "noopener");
				return;
			}
			if (!router.resolve(target.path).matched.length) {
				message.info(`当前应用未接入该插件的深度查看页（${target.path}）`);
				return;
			}
			router.push(target.path);
		}
		return (_ctx, _cache) => {
			const _component_el_alert = resolveComponent("el-alert");
			const _component_ReCountup = resolveComponent("ReCountup");
			const _component_ReStatCard = resolveComponent("ReStatCard");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReStatusIndicator = resolveComponent("ReStatusIndicator");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReText = resolveComponent("ReText");
			const _component_ReTable = resolveComponent("ReTable");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				loadNotice.value.show ? (openBlock(), createBlock(_component_el_alert, {
					key: 0,
					type: loadNotice.value.tone,
					title: loadNotice.value.text,
					"show-icon": "",
					closable: false,
					class: "load-notice"
				}, null, 8, ["type", "title"])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_2, [
					createVNode(_component_ReStatCard, {
						size: "compact",
						title: "服务总数",
						value: stats.value.total,
						desc: "Server 节点",
						icon: unref(monitor_default),
						"icon-color": "var(--metric-cpu)"
					}, {
						value: withCtx(() => [createVNode(_component_ReCountup, {
							value: stats.value.total,
							duration: 600
						}, null, 8, ["value"])]),
						_: 1
					}, 8, ["value", "icon"]),
					createVNode(_component_ReStatCard, {
						size: "compact",
						title: "运行中",
						value: stats.value.running,
						desc: stats.value.total ? `占比 ${Math.round(stats.value.running / stats.value.total * 100)}%` : "暂无服务",
						icon: unref(circle_check_filled_default),
						"icon-color": "var(--status-success)"
					}, {
						value: withCtx(() => [createVNode(_component_ReCountup, {
							value: stats.value.running,
							duration: 600
						}, null, 8, ["value"])]),
						_: 1
					}, 8, [
						"value",
						"desc",
						"icon"
					]),
					createVNode(_component_ReStatCard, {
						size: "compact",
						title: "已停止",
						value: stats.value.stopped,
						desc: "可手动或自动启动",
						icon: unref(video_pause_default),
						"icon-color": "var(--text-tertiary)"
					}, {
						value: withCtx(() => [createVNode(_component_ReCountup, {
							value: stats.value.stopped,
							duration: 600
						}, null, 8, ["value"])]),
						_: 1
					}, 8, ["value", "icon"]),
					createVNode(_component_ReStatCard, {
						size: "compact",
						title: "异常",
						value: stats.value.error,
						desc: stats.value.unknown ? `另有 ${stats.value.unknown} 个状态未知` : "需查看失败原因",
						icon: unref(circle_close_filled_default),
						"icon-color": "var(--status-error, var(--el-color-danger, #ff4c4c))"
					}, {
						value: withCtx(() => [createVNode(_component_ReCountup, {
							value: stats.value.error,
							duration: 600
						}, null, 8, ["value"])]),
						_: 1
					}, 8, [
						"value",
						"desc",
						"icon"
					]),
					createVNode(_component_ReStatCard, {
						size: "compact",
						title: "已挂插件",
						value: stats.value.plugins,
						desc: "ServerFilter 链",
						icon: unref(connection_default),
						"icon-color": "var(--metric-jvm)"
					}, {
						value: withCtx(() => [createVNode(_component_ReCountup, {
							value: stats.value.plugins,
							duration: 600
						}, null, 8, ["value"])]),
						_: 1
					}, 8, ["value", "icon"])
				]),
				createBaseVNode("div", _hoisted_3, [
					createVNode(_component_ReInput, {
						modelValue: keyword.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
						"aria-label": "搜索服务",
						placeholder: "搜索名称 / 协议 / 监听地址",
						clearable: "",
						"prefix-icon": "Search",
						class: "tb-search"
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReSelect, {
						modelValue: filterProtocol.value,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filterProtocol.value = $event),
						"aria-label": "按协议筛选",
						placeholder: "全部协议",
						clearable: "",
						data: protocolOptions.value,
						class: "tb-proto"
					}, null, 8, ["modelValue", "data"]),
					createBaseVNode("span", _hoisted_4, "共 " + toDisplayString(visibleNodes.value.length) + " / " + toDisplayString(stats.value.total) + " 个服务", 1),
					createBaseVNode("div", _hoisted_5, [createVNode(_component_ReButton, {
						icon: "Plus",
						layout: "square",
						type: "primary",
						tip: "新增服务",
						onClick: openCreate
					}), createVNode(_component_ReButton, {
						icon: "Refresh",
						layout: "square",
						tip: "刷新",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"])])
				]),
				createBaseVNode("div", _hoisted_6, [!loading.value && !visibleNodes.value.length && !keyword.value && !filterProtocol.value ? (openBlock(), createElementBlock("div", _hoisted_7, [_cache[6] || (_cache[6] = createStaticVNode("<div class=\"eg-icon\" data-v-e07c3b46><svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" data-v-e07c3b46><rect width=\"48\" height=\"48\" rx=\"12\" fill=\"var(--el-color-primary-light-9)\" data-v-e07c3b46></rect><path d=\"M24 14v20M14 24h20\" stroke=\"var(--el-color-primary)\" stroke-width=\"2.5\" stroke-linecap=\"round\" data-v-e07c3b46></path></svg></div><div class=\"eg-title\" data-v-e07c3b46>暂无服务</div><div class=\"eg-desc\" data-v-e07c3b46>点击下方按钮创建第一个 Server 节点</div>", 3)), createVNode(_component_ReButton, {
					"show-text": "",
					icon: "Plus",
					type: "primary",
					onClick: openCreate
				}, {
					default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("新增服务", -1)])]),
					_: 1
				})])) : createCommentVNode("", true), createVNode(_component_ReTable, {
					data: visibleNodes.value,
					loading: loading.value,
					border: "",
					stripe: "",
					size: "default",
					pagination: false,
					toolbar: false,
					"empty-text": "暂无服务，点击右上角「新增服务」创建",
					onRowClick: openDetail
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							label: "状态",
							"min-width": "220"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("div", _hoisted_8, [createBaseVNode("span", _hoisted_9, [createVNode(_component_ReStatusIndicator, {
								type: unref(deriveStatusMeta)(row).tone,
								pulse: unref(deriveStatusMeta)(row).pulse
							}, null, 8, ["type", "pulse"]), createTextVNode(" " + toDisplayString(unref(deriveStatusMeta)(row).text), 1)]), unref(deriveStatusMeta)(row).reason ? (openBlock(), createElementBlock("span", {
								key: 0,
								class: "status-reason",
								title: unref(deriveStatusMeta)(row).reason
							}, toDisplayString(unref(deriveStatusMeta)(row).reason), 9, _hoisted_10)) : createCommentVNode("", true)])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							prop: "name",
							label: "服务名称",
							"min-width": "140",
							"show-overflow-tooltip": ""
						}),
						createVNode(_component_ReTableColumn, {
							label: "协议",
							"min-width": "150",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, { type: unref(isProxyProtocol)(row.protocol) ? "warning" : "primary" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(protocolLabel(row)), 1)]),
								_: 2
							}, 1032, ["type"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "引擎",
							width: "80"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReText, { type: "info" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.engine || "-"), 1)]),
								_: 2
							}, 1024)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "监听地址",
							"min-width": "150"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_11, toDisplayString(unref(formatListenText)(row)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "插件",
							width: "90"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, { type: (row.filters?.length ?? 0) > 0 ? "success" : "info" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.filters?.length ?? 0), 1)]),
								_: 2
							}, 1032, ["type"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "访问地址",
							"min-width": "180",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [row.serverUrl ? (openBlock(), createBlock(_component_ReText, {
								key: 0,
								type: "primary"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.serverUrl), 1)]),
								_: 2
							}, 1024)) : (openBlock(), createElementBlock("span", _hoisted_12, "-"))]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "自动启用",
							width: "90"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, { type: row.enabled === 1 ? "success" : "info" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.enabled === 1 ? "是" : "否"), 1)]),
								_: 2
							}, 1032, ["type"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "280",
							fixed: "right",
							align: "right"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", {
								class: "ops",
								onClick: _cache[2] || (_cache[2] = withModifiers(() => {}, ["stop"]))
							}, [
								row.status === "ERROR" ? (openBlock(), createBlock(_component_ReButton, {
									key: 0,
									icon: "Refresh",
									layout: "square",
									type: "warning",
									tip: "重启",
									loading: actingId.value === row.id,
									onClick: ($event) => onRestart(row)
								}, null, 8, ["loading", "onClick"])) : row.status !== "RUNNING" ? (openBlock(), createBlock(_component_ReButton, {
									key: 1,
									icon: "VideoPlay",
									layout: "square",
									type: "success",
									tip: "启动",
									loading: actingId.value === row.id,
									onClick: ($event) => onStart(row)
								}, null, 8, ["loading", "onClick"])) : (openBlock(), createBlock(_component_ReButton, {
									key: 2,
									icon: "VideoPause",
									layout: "square",
									type: "warning",
									tip: "停止",
									loading: actingId.value === row.id,
									onClick: ($event) => onStop(row)
								}, null, 8, ["loading", "onClick"])),
								createVNode(_component_ReButton, {
									icon: "View",
									layout: "square",
									type: "primary",
									tip: "详情",
									onClick: withModifiers(($event) => openDetail(row), ["stop"])
								}, null, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "Edit",
									layout: "square",
									tip: "编辑",
									onClick: ($event) => openEdit(row)
								}, null, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "Copy",
									layout: "square",
									tip: "克隆",
									onClick: ($event) => openClone(row)
								}, null, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									icon: "Delete",
									layout: "square",
									type: "danger",
									tip: "删除",
									loading: actingId.value === row.id,
									onClick: ($event) => onDelete(row)
								}, null, 8, ["loading", "onClick"])
							])]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data", "loading"])]),
				createVNode(ScServerFormDrawer_default, {
					modelValue: formVisible.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => formVisible.value = $event),
					node: editingNode.value,
					protocols: protocols.value,
					"filter-types": filterTypes.value,
					"existing-names": existingNamesForDrawer.value,
					"clone-source": editingNode.value?.id === 0 ? editingNode.value : null,
					onSaved: refresh
				}, null, 8, [
					"modelValue",
					"node",
					"protocols",
					"filter-types",
					"existing-names",
					"clone-source"
				]),
				createVNode(ScServerDetailDrawer_default, {
					modelValue: detailVisible.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => detailVisible.value = $event),
					"node-id": detailNodeId.value,
					"filter-types": filterTypes.value,
					onChanged: refresh,
					onOpenDetailPage: openDetailPage
				}, null, 8, [
					"modelValue",
					"node-id",
					"filter-types"
				])
			]);
		};
	}
}), [["__scopeId", "data-v-e07c3b46"]]);
//#endregion
export { ScServiceManage_default as default };
