import { $n as normalizeClass, E as createTextVNode, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { n as i18n } from "./src-BVnZQO9c.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region src/views/ReRelationGraphLab.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "rrglab" };
var _hoisted_2 = { class: "rrglab__panel" };
var _hoisted_3 = { class: "rrglab__group" };
var _hoisted_4 = { class: "rrglab__btns" };
var _hoisted_5 = ["data-testid", "onClick"];
var _hoisted_6 = { class: "rrglab__group" };
var _hoisted_7 = { class: "rrglab__btns" };
var _hoisted_8 = { class: "rrglab__group" };
var _hoisted_9 = { class: "rrglab__stat" };
var _hoisted_10 = { "data-testid": "stat-layout" };
var _hoisted_11 = { "data-testid": "stat-selection" };
var _hoisted_12 = { "data-testid": "stat-hover" };
var _hoisted_13 = { "data-testid": "stat-events" };
var _hoisted_14 = { "data-testid": "stat-fixed" };
var _hoisted_15 = { "data-testid": "stat-matches" };
var _hoisted_16 = { "data-testid": "stat-undo" };
var _hoisted_17 = { "data-testid": "stat-redo" };
var _hoisted_18 = { class: "rrglab__group" };
var _hoisted_19 = { class: "rrglab__btns" };
var _hoisted_20 = { class: "rrglab__group rrglab__group--grow" };
var _hoisted_21 = {
	class: "rrglab__log",
	"data-testid": "event-log"
};
var _hoisted_22 = { class: "rrglab__stage" };
var _hoisted_23 = ["data-node-id"];
var _hoisted_24 = { class: "rrglab__nodecard-title" };
var _hoisted_25 = { class: "rrglab__nodecard-sub" };
//#endregion
//#region src/views/ReRelationGraphLab.vue
var ReRelationGraphLab_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReRelationGraphLab",
	__name: "ReRelationGraphLab",
	setup(__props) {
		/**
		* ReRelationGraph 能力验收台（隐藏路由，showLink:false）
		*
		* <p>把关系图组件的能力逐项做成「可点可验」的场景：节点原型/图片、边类型/方向/动态、
		* 布局切换、固定、拖拽、小地图、缩放、同组与临近高亮、右键菜单、ctrl 多选、
		* 以及运行时动态增删节点与边。配套浏览器验收脚本 `scripts/re-relation-graph-lab-acceptance.mjs`。</p>
		*
		* <p>放在 monitor 应用里是因为它已在跑且全局注册了 Re* 组件；路由不挂在侧边栏，不影响用户。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const DATA_IMG = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\"><circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#10b981\"/><text x=\"32\" y=\"40\" font-size=\"28\" text-anchor=\"middle\" fill=\"#fff\">A</text></svg>");
		const NODE_TYPES = [
			"circle",
			"rect",
			"ellipse",
			"html",
			"star",
			"triangle",
			"diamond",
			"donut",
			"hexagon"
		];
		const EDGE_TYPES = [
			"line",
			"polyline",
			"quadratic",
			"cubic",
			"cubic-horizontal",
			"cubic-vertical"
		];
		const LAYOUTS = [
			"force",
			"d3-force",
			"fruchterman",
			"mds",
			"circular",
			"concentric",
			"radial",
			"grid",
			"random",
			"dagre",
			"antv-dagre",
			"snake"
		];
		const scenario = ref("prototype");
		const layout = ref("circular");
		const minimise = ref(false);
		const highlight = ref("both");
		const logLines = ref([]);
		const selection = ref([]);
		const lastHover = ref("-");
		const eventCount = ref(0);
		const graphRef = ref(null);
		const extraSeq = ref(1);
		/** 最近一次 data-change 载荷的元素数量（用于验收「回调拿到实时模型」） */
		const lastDataChange = ref(null);
		const say = (m) => {
			logLines.value.unshift(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()}  ${m}`);
			if (logLines.value.length > 14) logLines.value.pop();
			eventCount.value += 1;
		};
		/** 各场景的图数据 */
		const graph = computed(() => {
			switch (scenario.value) {
				case "prototype": return {
					nodes: NODE_TYPES.map((t, i) => ({
						id: `p-${t}`,
						label: t,
						type: t,
						size: 46,
						group: i % 2 === 0 ? "even" : "odd",
						data: {
							kind: "prototype",
							t
						}
					})),
					edges: NODE_TYPES.slice(1).map((t, i) => ({
						id: `pe-${i}`,
						source: `p-${NODE_TYPES[i]}`,
						target: `p-${t}`,
						label: "",
						directed: true,
						data: { kind: "chain" }
					}))
				};
				case "image": return {
					nodes: [
						{
							id: "img-1",
							label: "图片节点A",
							image: DATA_IMG,
							size: 56,
							group: "img",
							data: { kind: "image" }
						},
						{
							id: "img-2",
							label: "图片节点B",
							image: DATA_IMG,
							size: 48,
							group: "img",
							data: { kind: "image" }
						},
						{
							id: "img-3",
							label: "图片节点C",
							image: DATA_IMG,
							size: 48,
							group: "img",
							data: { kind: "image" }
						},
						{
							id: "plain",
							label: "普通节点",
							type: "circle",
							size: 40,
							group: "plain",
							data: { kind: "plain" }
						}
					],
					edges: [
						{
							id: "ie-1",
							source: "img-1",
							target: "img-2",
							label: "相关",
							directed: true,
							data: {}
						},
						{
							id: "ie-2",
							source: "img-1",
							target: "img-3",
							label: "相关",
							directed: true,
							data: {}
						},
						{
							id: "ie-3",
							source: "img-3",
							target: "plain",
							label: "引用",
							directed: false,
							animated: true,
							data: {}
						}
					]
				};
				case "edge": return {
					nodes: [{
						id: "e-a",
						label: "源",
						size: 46,
						group: "e",
						data: {}
					}, {
						id: "e-b",
						label: "目标",
						size: 46,
						group: "e",
						data: {}
					}],
					edges: [...EDGE_TYPES.map((t, i) => ({
						id: `et-${t}`,
						source: "e-a",
						target: "e-b",
						type: t,
						label: t,
						directed: true,
						animated: t === "cubic" || t === "polyline",
						data: {
							kind: "edgetype",
							t
						}
					}))]
				};
				case "layout": return {
					nodes: Array.from({ length: 28 }, (_, i) => ({
						id: `l-${i}`,
						label: `N${i}`,
						size: i % 5 === 0 ? 42 : 30,
						group: `g${i % 4}`,
						data: {
							kind: "layout",
							i
						}
					})),
					edges: Array.from({ length: 27 }, (_, i) => ({
						id: `le-${i}`,
						source: `l-${i}`,
						target: `l-${i + 1}`,
						directed: true,
						data: {}
					}))
				};
				case "group": {
					const mk = (g, n) => Array.from({ length: n }, (_, i) => ({
						id: `${g}-${i}`,
						label: `${g}${i}`,
						size: 34,
						group: g,
						data: {
							kind: "group",
							g
						}
					}));
					return {
						nodes: [
							...mk("A", 4),
							...mk("B", 4),
							...mk("C", 3)
						],
						edges: [{
							id: "ga-1",
							source: "A-0",
							target: "B-0",
							label: "跨组",
							directed: true,
							data: {}
						}, {
							id: "ga-2",
							source: "B-1",
							target: "C-0",
							label: "跨组",
							directed: true,
							data: {}
						}]
					};
				}
				case "html": return {
					nodes: [
						{
							id: "h-1",
							label: "服务A",
							type: "html",
							size: [150, 56],
							group: "svc",
							data: {
								kind: "service",
								ip: "10.0.0.1"
							}
						},
						{
							id: "h-2",
							label: "服务B",
							type: "html",
							size: [150, 56],
							group: "svc",
							data: {
								kind: "service",
								ip: "10.0.0.2"
							}
						},
						{
							id: "h-3",
							label: "服务C",
							type: "html",
							size: [150, 56],
							group: "svc",
							data: {
								kind: "service",
								ip: "10.0.0.3"
							}
						}
					],
					edges: [{
						id: "he-1",
						source: "h-1",
						target: "h-2",
						label: "调用",
						directed: true,
						data: {}
					}, {
						id: "he-2",
						source: "h-2",
						target: "h-3",
						label: "调用",
						directed: true,
						data: {}
					}]
				};
				default: return {
					nodes: [
						{
							id: "d-1",
							label: "起点",
							size: 44,
							group: "d",
							data: {}
						},
						{
							id: "d-2",
							label: "节点2",
							size: 38,
							group: "d",
							data: {}
						},
						{
							id: "d-3",
							label: "节点3",
							size: 38,
							group: "d",
							data: {}
						}
					],
					edges: [{
						id: "de-1",
						source: "d-1",
						target: "d-2",
						directed: true,
						data: {}
					}, {
						id: "de-2",
						source: "d-2",
						target: "d-3",
						directed: true,
						data: {}
					}]
				};
			}
		});
		const scenarios = [
			{
				key: "prototype",
				label: "节点原型(9种)"
			},
			{
				key: "image",
				label: "图片节点"
			},
			{
				key: "edge",
				label: "边类型(7种)"
			},
			{
				key: "layout",
				label: "大图(布局)"
			},
			{
				key: "group",
				label: "分组(高亮)"
			},
			{
				key: "dynamic",
				label: "动态增删"
			},
			{
				key: "html",
				label: "节点插槽(html)"
			}
		];
		const onNodeClick = (n, ev) => {
			say(`node-click ${n.id}（ctrl=${(ev?.originalEvent?.ctrlKey ?? ev?.ctrlKey) === true}）`);
		};
		const onNodeRightClick = (n) => say(`node-right-click ${n.id}`);
		const onNodeDblClick = (n) => say(`node-dblclick ${n.id}`);
		const onNodeHover = (n) => {
			lastHover.value = n ? String(n.id) : "-";
			if (n) say(`node-hover ${n.id}`);
		};
		const onEdgeClick = (e) => say(`edge-click ${e.id}`);
		const onSelectionChange = (ids) => {
			selection.value = ids;
			say(`selection-change [${ids.join(",")}]`);
		};
		const onLayoutChange = (name) => say(`layout-change ${name}`);
		const onDataChange = (d) => {
			lastDataChange.value = {
				nodes: d.nodes?.length ?? 0,
				edges: d.edges?.length ?? 0
			};
			say(`data-change nodes=${d.nodes?.length ?? 0} edges=${d.edges?.length ?? 0}`);
		};
		const addNode = async () => {
			const id = `x-${extraSeq.value++}`;
			await graphRef.value?.addNode({
				id,
				label: id,
				size: 34,
				group: "x",
				data: { kind: "added" }
			});
			say(`调用 addNode ${id}`);
		};
		const addEdge = async () => {
			const ids = graph.value.nodes.map((n) => n.id);
			const a = ids[ids.length - 2];
			const b = `x-${extraSeq.value - 1}`;
			await graphRef.value?.addEdge({
				id: `${a}->${b}`,
				source: a,
				target: b,
				label: "动态",
				directed: true,
				animated: true,
				data: {}
			});
			say(`调用 addEdge ${a}->${b}`);
		};
		const removeSelected = async () => {
			const ids = [...selection.value];
			for (const id of ids) await graphRef.value?.removeNode(id);
			say(`调用 removeNode [${ids.join(",")}]`);
		};
		const fixedCount = ref(0);
		const pinSelected = async () => {
			const ids = selection.value.length ? selection.value : graph.value.nodes.slice(0, 1).map((n) => n.id);
			const inst = graphRef.value?.getInstance?.();
			if (!inst) return;
			for (const id of ids) try {
				inst.updateNodeData([{
					id,
					data: { __fixed: true },
					style: { pinned: true }
				}]);
			} catch (e) {
				say(`pin 失败 ${id}: ${String(e.message).slice(0, 60)}`);
			}
			await inst.draw?.();
			fixedCount.value += ids.length;
			say(`已固定 [${ids.join(",")}]`);
		};
		const cycleLayout = async () => {
			const idx = LAYOUTS.indexOf(layout.value);
			const next = LAYOUTS[(idx + 1) % LAYOUTS.length];
			layout.value = next;
			await graphRef.value?.setLayout(next);
			say(`setLayout ${next}`);
		};
		const toggleMinimap = () => {
			minimise.value = !minimise.value;
			say(`小地图 ${minimise.value ? "开" : "关"}`);
		};
		const zoomIn = async () => {
			await graphRef.value?.zoomIn();
			say("zoomIn");
		};
		const zoomOut = async () => {
			await graphRef.value?.zoomOut();
			say("zoomOut");
		};
		const fit = async () => {
			await graphRef.value?.fitView();
			say("fitView");
		};
		ref(false);
		const toggleHighlight = () => {
			const order = [
				"none",
				"group",
				"adjacent",
				"both"
			];
			const i = order.indexOf(highlight.value);
			highlight.value = order[(i + 1) % order.length];
			say(`highlight ${highlight.value}`);
		};
		const ctrlMulti = ref(true);
		const searchMatches = ref(0);
		const canUndo = ref(false);
		const canRedo = ref(false);
		const connectMode = ref(false);
		const doSearch = (kw) => {
			const ids = graphRef.value?.search?.(kw) ?? [];
			searchMatches.value = ids.length;
			say(`search "${kw}" -> [${ids.join(",")}]`);
		};
		const locateFirst = async () => {
			const id = graph.value.nodes[0]?.id;
			if (id) {
				await graphRef.value?.locate?.(id);
				say(`locate ${id}`);
			}
		};
		const exportImg = async () => {
			const url = await graphRef.value?.exportImage?.("png", 1);
			window.__rrgLastExport = url;
			say(`exportImage len=${url ? String(url).length : 0}`);
		};
		const doUndo = async () => {
			await graphRef.value?.undo?.();
			say("undo");
		};
		const doRedo = async () => {
			await graphRef.value?.redo?.();
			say("redo");
		};
		const toggleConnect = () => {
			connectMode.value = !connectMode.value;
			graphRef.value?.setConnectMode?.(connectMode.value);
			say(`connectMode ${connectMode.value}`);
		};
		const onEdgeCreated = (e) => say(`edge-created ${e?.id ?? ""}`);
		const onHistoryChange = (s) => {
			canUndo.value = s.canUndo;
			canRedo.value = s.canRedo;
			say(`history undo=${s.canUndo} redo=${s.canRedo}`);
		};
		onMounted(() => {
			window.__rrgLab = {
				/** G6 模型里的节点数 */
				nodeCount: () => graphRef.value?.getInstance?.()?.getNodeData?.()?.length ?? -1,
				/** G6 模型里的边数 */
				edgeCount: () => graphRef.value?.getInstance?.()?.getEdgeData?.()?.length ?? -1,
				/** 当前缩放比例 */
				zoom: () => graphRef.value?.getInstance?.()?.getZoom?.() ?? -1,
				/** 节点坐标铺开程度与缩放（回归守卫：装载后布局必须真的跑过，适配不得顶格） */
				posSpan: () => {
					const g = graphRef.value?.getInstance?.();
					const data = g?.getNodeData?.() ?? [];
					const xs = data.map((d) => d.style?.x).filter((v) => typeof v === "number");
					const ys = data.map((d) => d.style?.y).filter((v) => typeof v === "number");
					if (!xs.length || !ys.length) return {
						xSpan: 0,
						ySpan: 0,
						zoom: g?.getZoom?.() ?? -1
					};
					return {
						xSpan: Math.round(Math.max(...xs) - Math.min(...xs)),
						ySpan: Math.round(Math.max(...ys) - Math.min(...ys)),
						zoom: g?.getZoom?.() ?? -1
					};
				},
				/** 全部节点 type */
				nodeTypes: () => (graphRef.value?.getInstance?.()?.getNodeData?.() ?? []).map((d) => d.type),
				/** 全部边 type */
				edgeTypes: () => (graphRef.value?.getInstance?.()?.getEdgeData?.() ?? []).map((d) => d.type),
				/** 指定元素的计算样式（含 lineDash / src / size 等） */
				elementStyle: (id) => graphRef.value?.getInstance?.()?.getElementData?.(id)?.style ?? null,
				/** 指定元素的当前状态数组 */
				states: (id) => graphRef.value?.getInstance?.()?.getElementState?.(id) ?? [],
				/** 原始 G6 实例（仅验收用） */
				instance: () => graphRef.value?.getInstance?.() ?? null,
				/** 搜索命中数（走 API） */
				searchCount: (kw) => (graphRef.value?.search?.(kw) ?? []).length,
				/** 导出图片 dataURL 前缀（验证返回的是图片） */
				exportImageHead: async () => String(await graphRef.value?.exportImage?.("png", 1) ?? "").slice(0, 22),
				/** 撤销 / 重做可用性 */
				canUndo: () => graphRef.value?.canUndo?.() ?? false,
				canRedo: () => graphRef.value?.canRedo?.() ?? false,
				/** 连线模式开关 */
				setConnectMode: (on) => graphRef.value?.setConnectMode?.(on),
				getConnectMode: () => graphRef.value?.getConnectMode?.() ?? false,
				/** 节点内容插槽容器数量（DOM 里的 .rrg__node-content） */
				nodeSlotCount: () => document.querySelectorAll(".rrg__node-content").length,
				/** 切换应用语言（验证组件文案随共享 i18n 切换） */
				setLang: (l) => {
					i18n.global.locale.value = l;
				},
				getLang: () => i18n.global.locale.value,
				/** 最近一次 data-change 载荷的元素数量（验证回调拿到实时模型而非 props 旧值） */
				lastDataChange: () => lastDataChange.value,
				/** 指定节点当前 label（业务字段） */
				nodeLabel: (id) => (graphRef.value?.getInstance?.()?.getNodeData?.() ?? []).find((n) => n.id === id)?.data?.__label ?? "-",
				/** 指定边当前 label（业务字段） */
				edgeLabel: (id) => (graphRef.value?.getInstance?.()?.getEdgeData?.() ?? []).find((e) => e.id === id)?.data?.__label ?? "-",
				/** 选中元素（走组件 API，用于工具栏更新/删除按钮的验收） */
				select: (ids) => graphRef.value?.select?.(ids),
				/** 画布像素非透明占比（证明真画出来了） */
				painted: () => {
					const list = [...document.querySelectorAll(".rrglab__stage canvas")];
					let best = 0;
					list.forEach((c) => {
						const ctx = c.getContext("2d");
						if (!ctx) return;
						let p = 0;
						let t = 0;
						const step = Math.max(1, Math.floor(Math.min(c.width, c.height) / 100));
						for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) {
							t++;
							if (ctx.getImageData(x, y, 1, 1).data[3] > 0) p++;
						}
						best = Math.max(best, t ? p / t : 0);
					});
					return best;
				}
			};
		});
		return (_ctx, _cache) => {
			const _component_ReRelationGraph = resolveComponent("ReRelationGraph");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [
				_cache[16] || (_cache[16] = createBaseVNode("div", { class: "rrglab__title" }, "ReRelationGraph 能力验收台", -1)),
				createBaseVNode("div", _hoisted_3, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "rrglab__label" }, "场景", -1)), createBaseVNode("div", _hoisted_4, [(openBlock(), createElementBlock(Fragment, null, renderList(scenarios, (s) => {
					return createBaseVNode("button", {
						key: s.key,
						class: normalizeClass(["rrglab__btn", { "is-active": scenario.value === s.key }]),
						"data-testid": "scenario-" + s.key,
						onClick: ($event) => {
							scenario.value = s.key;
							say("场景 " + s.key);
						}
					}, toDisplayString(s.label), 11, _hoisted_5);
				}), 64))])]),
				createBaseVNode("div", { class: "rrglab__group" }, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "rrglab__label" }, "动态控制", -1)), createBaseVNode("div", { class: "rrglab__btns" }, [
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-add-node",
						onClick: addNode
					}, "加节点"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-add-edge",
						onClick: addEdge
					}, "加边"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-remove",
						onClick: removeSelected
					}, "删选中"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-pin",
						onClick: pinSelected
					}, "固定选中")
				])]),
				createBaseVNode("div", _hoisted_6, [_cache[4] || (_cache[4] = createBaseVNode("span", { class: "rrglab__label" }, "视图", -1)), createBaseVNode("div", _hoisted_7, [
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-layout",
						onClick: cycleLayout
					}, "切换布局"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-zoom-in",
						onClick: zoomIn
					}, "放大"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-zoom-out",
						onClick: zoomOut
					}, "缩小"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-fit",
						onClick: fit
					}, "适配"),
					createBaseVNode("button", {
						class: normalizeClass(["rrglab__btn", { "is-active": minimise.value }]),
						"data-testid": "act-minimap",
						onClick: toggleMinimap
					}, "小地图", 2),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-highlight",
						onClick: toggleHighlight
					}, "高亮:" + toDisplayString(highlight.value), 1),
					createBaseVNode("button", {
						class: normalizeClass(["rrglab__btn", { "is-active": ctrlMulti.value }]),
						"data-testid": "act-ctrl",
						onClick: _cache[0] || (_cache[0] = ($event) => ctrlMulti.value = !ctrlMulti.value)
					}, "ctrl多选:" + toDisplayString(ctrlMulti.value ? "开" : "关"), 3)
				])]),
				createBaseVNode("div", _hoisted_8, [_cache[13] || (_cache[13] = createBaseVNode("span", { class: "rrglab__label" }, "状态", -1)), createBaseVNode("div", _hoisted_9, [
					createBaseVNode("div", null, [_cache[5] || (_cache[5] = createTextVNode("布局：", -1)), createBaseVNode("b", _hoisted_10, toDisplayString(layout.value), 1)]),
					createBaseVNode("div", null, [_cache[6] || (_cache[6] = createTextVNode("选中：", -1)), createBaseVNode("b", _hoisted_11, toDisplayString(selection.value.join(",") || "-"), 1)]),
					createBaseVNode("div", null, [_cache[7] || (_cache[7] = createTextVNode("悬停：", -1)), createBaseVNode("b", _hoisted_12, toDisplayString(lastHover.value), 1)]),
					createBaseVNode("div", null, [_cache[8] || (_cache[8] = createTextVNode("事件数：", -1)), createBaseVNode("b", _hoisted_13, toDisplayString(eventCount.value), 1)]),
					createBaseVNode("div", null, [_cache[9] || (_cache[9] = createTextVNode("已固定：", -1)), createBaseVNode("b", _hoisted_14, toDisplayString(fixedCount.value), 1)]),
					createBaseVNode("div", null, [_cache[10] || (_cache[10] = createTextVNode("命中：", -1)), createBaseVNode("b", _hoisted_15, toDisplayString(searchMatches.value), 1)]),
					createBaseVNode("div", null, [_cache[11] || (_cache[11] = createTextVNode("可撤销：", -1)), createBaseVNode("b", _hoisted_16, toDisplayString(canUndo.value ? "1" : "0"), 1)]),
					createBaseVNode("div", null, [_cache[12] || (_cache[12] = createTextVNode("可重做：", -1)), createBaseVNode("b", _hoisted_17, toDisplayString(canRedo.value ? "1" : "0"), 1)])
				])]),
				createBaseVNode("div", _hoisted_18, [_cache[14] || (_cache[14] = createBaseVNode("span", { class: "rrglab__label" }, "补齐能力", -1)), createBaseVNode("div", _hoisted_19, [
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-search",
						onClick: _cache[1] || (_cache[1] = ($event) => doSearch("服务"))
					}, "搜索\"服务\""),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-locate",
						onClick: locateFirst
					}, "定位首个"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-export",
						onClick: exportImg
					}, "导出图片"),
					createBaseVNode("button", {
						class: normalizeClass(["rrglab__btn", { "is-active": connectMode.value }]),
						"data-testid": "act-connect",
						onClick: toggleConnect
					}, "连线:" + toDisplayString(connectMode.value ? "开" : "关"), 3),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-undo",
						onClick: doUndo
					}, "撤销"),
					createBaseVNode("button", {
						class: "rrglab__btn",
						"data-testid": "act-redo",
						onClick: doRedo
					}, "重做")
				])]),
				createBaseVNode("div", _hoisted_20, [_cache[15] || (_cache[15] = createBaseVNode("span", { class: "rrglab__label" }, "事件日志", -1)), createBaseVNode("div", _hoisted_21, [(openBlock(true), createElementBlock(Fragment, null, renderList(logLines.value, (l, i) => {
					return openBlock(), createElementBlock("div", { key: i }, toDisplayString(l), 1);
				}), 128))])])
			]), createBaseVNode("div", _hoisted_22, [(openBlock(), createBlock(_component_ReRelationGraph, {
				ref_key: "graphRef",
				ref: graphRef,
				key: scenario.value,
				nodes: graph.value.nodes,
				edges: graph.value.edges,
				layout: layout.value,
				height: "100%",
				toolbar: true,
				minimap: minimise.value,
				zoom: true,
				drag: true,
				highlight: highlight.value,
				"multi-select": ctrlMulti.value,
				"context-menu": true,
				editable: true,
				"node-size": 38,
				debug: "",
				onNodeClick,
				onNodeRightClick,
				onNodeDblclick: onNodeDblClick,
				onNodeHover,
				onEdgeClick,
				onSelectionChange,
				onLayoutChange,
				onDataChange,
				onEdgeCreated,
				onHistoryChange
			}, {
				"node-content": withCtx(({ node, selected }) => [createBaseVNode("div", {
					class: normalizeClass(["rrglab__nodecard", { "is-selected": selected }]),
					"data-node-id": node.id
				}, [createBaseVNode("div", _hoisted_24, toDisplayString(node.label ?? node.id), 1), createBaseVNode("div", _hoisted_25, toDisplayString(node.data?.ip ?? node.id), 1)], 10, _hoisted_23)]),
				_: 1
			}, 8, [
				"nodes",
				"edges",
				"layout",
				"minimap",
				"highlight",
				"multi-select"
			]))])]);
		};
	}
}), [["__scopeId", "data-v-7b0b6512"]]);
//#endregion
export { ReRelationGraphLab_default as default };
