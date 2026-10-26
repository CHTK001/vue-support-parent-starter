<script setup lang="ts">
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
import { computed, onMounted, ref } from "vue";

import i18n from "@repo/languages";

defineOptions({ name: "ReRelationGraphLab" });

type Scenario = "prototype" | "image" | "edge" | "layout" | "group" | "dynamic" | "html";

/** 1x1 透明 PNG，避免验收依赖外网图片 */
const DATA_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="#10b981"/><text x="32" y="40" font-size="28" text-anchor="middle" fill="#fff">A</text></svg>');

const NODE_TYPES = ["circle", "rect", "ellipse", "html", "star", "triangle", "diamond", "donut", "hexagon"];
// cubic-radial 需要树根（G6 里它取 model.getRootsData()[0] 作参照），普通关系图用不了，
// 验收台用其余 6 种；组件仍暴露该类型供树形数据使用。
const EDGE_TYPES = ["line", "polyline", "quadratic", "cubic", "cubic-horizontal", "cubic-vertical"];
// 树布局（dendrogram / indented / mindmap / compact-box）在 G6 里**要求树形数据**，
// 用在普通关系图上会抛 "Tree structure not found"。验收台只轮换关系图适用的布局；
// 组件本身仍暴露全部布局名，树形数据场景可用。
const LAYOUTS = ["force", "d3-force", "fruchterman", "mds", "circular", "concentric", "radial", "grid", "random", "dagre", "antv-dagre", "snake"];

const scenario = ref<Scenario>("prototype");
const layout = ref<string>("circular");
const minimize = ref(false);
const highlight = ref(true);
const logLines = ref<string[]>([]);
const selection = ref<string[]>([]);
const lastHover = ref<string>("-");
const eventCount = ref(0);
const graphRef = ref<any>(null);
const extraSeq = ref(1);
/** 框选开关（新内核 brushSelect） */
const brushOn = ref(false);
const toggleBrush = () => {
  brushOn.value = !brushOn.value;
  graphRef.value?.setBrushSelect?.(brushOn.value);
  say(`框选 ${brushOn.value ? "开" : "关"}`);
};

const say = (m: string) => {
  logLines.value.unshift(`${new Date().toLocaleTimeString()}  ${m}`);
  if (logLines.value.length > 14) {
    logLines.value.pop();
  }
  eventCount.value += 1;
};

/** 各场景的图数据 */
const graph = computed(() => {
  switch (scenario.value) {
    case "prototype": {
      return {
        nodes: NODE_TYPES.map((t, i) => ({
          id: `p-${t}`, label: t, type: t, size: 46,
          group: i % 2 === 0 ? "even" : "odd", data: { kind: "prototype", t },
        })),
        edges: NODE_TYPES.slice(1).map((t, i) => ({
          id: `pe-${i}`, source: `p-${NODE_TYPES[i]}`, target: `p-${t}`,
          label: "", directed: true, data: { kind: "chain" },
        })),
      };
    }
    case "image": {
      return {
        nodes: [
          { id: "img-1", label: "图片节点A", image: DATA_IMG, size: 56, group: "img", data: { kind: "image" } },
          { id: "img-2", label: "图片节点B", image: DATA_IMG, size: 48, group: "img", data: { kind: "image" } },
          { id: "img-3", label: "图片节点C", image: DATA_IMG, size: 48, group: "img", data: { kind: "image" } },
          { id: "plain", label: "普通节点", type: "circle", size: 40, group: "plain", data: { kind: "plain" } },
        ],
        edges: [
          { id: "ie-1", source: "img-1", target: "img-2", label: "相关", directed: true, data: {} },
          { id: "ie-2", source: "img-1", target: "img-3", label: "相关", directed: true, data: {} },
          { id: "ie-3", source: "img-3", target: "plain", label: "引用", directed: false, animated: true, data: {} },
        ],
      };
    }
    case "edge": {
      return {
        nodes: [
          { id: "e-a", label: "源", size: 46, group: "e", data: {} },
          { id: "e-b", label: "目标", size: 46, group: "e", data: {} },
        ],
        edges: [
          ...EDGE_TYPES.map((t, i) => ({
            id: `et-${t}`, source: "e-a", target: "e-b", type: t, label: t,
            directed: true, animated: t === "cubic" || t === "polyline", data: { kind: "edgetype", t },
          })),
        ],
      };
    }
    case "layout": {
      const n = 28;
      return {
        nodes: Array.from({ length: n }, (_, i) => ({
          id: `l-${i}`, label: `N${i}`, size: i % 5 === 0 ? 42 : 30,
          group: `g${i % 4}`, data: { kind: "layout", i },
        })),
        edges: Array.from({ length: n - 1 }, (_, i) => ({
          id: `le-${i}`, source: `l-${i}`, target: `l-${i + 1}`, directed: true, data: {},
        })),
      };
    }
    case "group": {
      const mk = (g: string, n: number) =>
        Array.from({ length: n }, (_, i) => ({
          id: `${g}-${i}`, label: `${g}${i}`, size: 34, group: g, data: { kind: "group", g },
        }));
      const nodes = [...mk("A", 4), ...mk("B", 4), ...mk("C", 3)];
      return {
        nodes,
        edges: [
          { id: "ga-1", source: "A-0", target: "B-0", label: "跨组", directed: true, data: {} },
          { id: "ga-2", source: "B-1", target: "C-0", label: "跨组", directed: true, data: {} },
        ],
      };
    }
    case "html": {
      // 节点内容插槽场景：#node-content 为 type=html 的节点渲染自定义卡片
      return {
        nodes: [
          { id: "h-1", label: "服务A", type: "html", size: [150, 56], group: "svc", data: { kind: "service", ip: "10.0.0.1" } },
          { id: "h-2", label: "服务B", type: "html", size: [150, 56], group: "svc", data: { kind: "service", ip: "10.0.0.2" } },
          { id: "h-3", label: "服务C", type: "html", size: [150, 56], group: "svc", data: { kind: "service", ip: "10.0.0.3" } },
        ],
        edges: [
          { id: "he-1", source: "h-1", target: "h-2", label: "调用", directed: true, data: {} },
          { id: "he-2", source: "h-2", target: "h-3", label: "调用", directed: true, data: {} },
        ],
      };
    }
    default: {
      return {
        nodes: [
          { id: "d-1", label: "起点", size: 44, group: "d", data: {} },
          { id: "d-2", label: "节点2", size: 38, group: "d", data: {} },
          { id: "d-3", label: "节点3", size: 38, group: "d", data: {} },
        ],
        edges: [
          { id: "de-1", source: "d-1", target: "d-2", directed: true, data: {} },
          { id: "de-2", source: "d-2", target: "d-3", directed: true, data: {} },
        ],
      };
    }
  }
});

const scenarios: Array<{ key: Scenario; label: string }> = [
  { key: "prototype", label: "节点原型(9种)" },
  { key: "image", label: "图片节点" },
  { key: "edge", label: "边类型(7种)" },
  { key: "layout", label: "大图(布局)" },
  { key: "group", label: "分组(高亮)" },
  { key: "dynamic", label: "动态增删" },
  { key: "html", label: "节点插槽(html)" },
];

// ---------- 事件（新内核契约：{ id, data }） ----------
const onNodeClick = (d: { id: string; data?: any }) => say(`node-click ${d.id}`);
const onNodeDblClick = (d: { id: string }) => say(`node-dblclick ${d.id}`);
const onNodeHover = (d: { id: string; data?: any } | null) => {
  lastHover.value = d ? String(d.id) : "-";
  if (d) say(`node-mouseover ${d.id}`);
};
const onEdgeClick = (d: { id: string }) => say(`edge-click ${d.id}`);
const onSelectionChange = (d: { nodes: string[]; edges: string[] }) => {
  selection.value = [...d.nodes, ...d.edges];
  say(`selection-change [${selection.value.join(",")}]`);
};
const onHistoryChange = (s: { canUndo: boolean; canRedo: boolean }) => {
  canUndo.value = s.canUndo;
  canRedo.value = s.canRedo;
  say(`history undo=${s.canUndo} redo=${s.canRedo}`);
};
// ---------- 工具栏动作（1.4 动态控制） ----------
const addNode = async () => {
  const id = `x-${extraSeq.value++}`;
  graphRef.value?.addNode({ id, label: id, size: 34, group: "x", data: { kind: "added" } });
  say(`调用 addNode ${id}`);
};
const addEdge = async () => {
  const ids = graph.value.nodes.map((n: any) => n.id);
  const a = ids[ids.length - 2];
  const b = `x-${extraSeq.value - 1}`;
  graphRef.value?.addEdge({ id: `${a}->${b}`, source: a, target: b, label: "动态", data: {} });
  say(`调用 addEdge ${a}->${b}`);
};
const removeSelected = async () => {
  const ids = [...selection.value];
  graphRef.value?.removeNodes(ids);
  say(`调用 removeNodes [${ids.join(",")}]`);
};
const fixedCount = ref(0);
const pinSelected = async () => {
  // 固定 = 拖拽后位置不被布局重置；这里把选中节点标 fixed 并重跑布局验证坐标保留
  const ids = selection.value.length ? selection.value : graph.value.nodes.slice(0, 1).map((n: any) => n.id);
  const inst = graphRef.value?.graph as {
    updateNodeData?: (d: unknown) => void;
    draw?: () => Promise<void>;
  } | null;
  if (!inst) {
    return;
  }
  for (const id of ids) {
    try {
      inst.updateNodeData?.([{ id, data: { __fixed: true }, style: { pinned: true } }]);
    } catch (e) {
      say(`pin 失败 ${id}: ${String((e as Error).message).slice(0, 60)}`);
    }
  }
  await inst.draw?.();
  fixedCount.value += ids.length;
  say(`已固定 [${ids.join(",")}]`);
};
const cycleLayout = async () => {
  const idx = LAYOUTS.indexOf(layout.value);
  const next = LAYOUTS[(idx + 1) % LAYOUTS.length];
  layout.value = next;
  say(`layout ${next}`);
};
const toggleMinimap = () => { minimize.value = !minimize.value; say(`小地图 ${minimize.value ? "开" : "关"}`); };
const zoomIn = async () => {
  await graphRef.value?.graph?.zoomBy?.(1.2);
  say("zoomBy 1.2");
};
const zoomOut = async () => {
  await graphRef.value?.graph?.zoomBy?.(1 / 1.2);
  say("zoomBy 0.83");
};
const fit = async () => { await graphRef.value?.fitView?.(); say("fitView"); };
const toggleHighlight = () => {
  highlight.value = !highlight.value;
  say(`highlight ${highlight.value}`);
};

// ---------- 新内核补的能力：搜索定位 / 高亮 / 交叉数 / 预设 ----------
const searchMatches = ref(0);
const canUndo = ref(false);
const canRedo = ref(false);
const crossingCount = ref(0);

/** 按 label 子串找节点（新内核没有内置 search，业务侧直接用数据过滤） */
const doSearch = (kw: string) => {
  const ids = graph.value.nodes
    .filter((n: any) => String(n.label ?? n.id).includes(kw))
    .map((n: any) => String(n.id));
  searchMatches.value = ids.length;
  if (ids.length) graphRef.value?.highlightElements?.(ids);
  say(`搜索 "${kw}" -> [${ids.join(",")}]`);
};
const locateFirst = async () => {
  const id = graph.value.nodes[0]?.id;
  if (id) { await graphRef.value?.centerOn?.(id); say(`centerOn ${id}`); }
};
const doUndo = async () => { graphRef.value?.undo?.(); say("undo"); };
const doRedo = async () => { graphRef.value?.redo?.(); say("redo"); };
const countCrossing = () => {
  crossingCount.value = Number(graphRef.value?.countEdgeCrossings?.() ?? 0);
  say(`countEdgeCrossings ${crossingCount.value}`);
};

// 验收脚本用的只读探针：直接问 G6 实例（DOM 层看不出的东西：元素数量/类型/状态/缩放）
onMounted(() => {
  /** 底层 G6 Graph 实例（新内核通过 `graph` getter 暴露） */
  const g6 = () => graphRef.value?.graph ?? null;
  (window as unknown as Record<string, unknown>).__rrgLab = {
    /** G6 模型里的节点数 */
    nodeCount: () => g6()?.getNodeData?.()?.length ?? -1,
    /** G6 模型里的边数 */
    edgeCount: () => g6()?.getEdgeData?.()?.length ?? -1,
    /** 当前缩放比例 */
    zoom: () => g6()?.getZoom?.() ?? -1,
    /** 节点坐标铺开程度与缩放（回归守卫：装载后布局必须真的跑过，适配不得顶格） */
    posSpan: () => {
      const g = g6();
      const data = (g?.getNodeData?.() ?? []) as Array<{ style?: { x?: number; y?: number } }>;
      const xs = data.map(d => d.style?.x).filter((v): v is number => typeof v === "number");
      const ys = data.map(d => d.style?.y).filter((v): v is number => typeof v === "number");
      if (!xs.length || !ys.length) {
        return { xSpan: 0, ySpan: 0, zoom: g?.getZoom?.() ?? -1 };
      }
      return {
        xSpan: Math.round(Math.max(...xs) - Math.min(...xs)),
        ySpan: Math.round(Math.max(...ys) - Math.min(...ys)),
        zoom: g?.getZoom?.() ?? -1,
      };
    },
    /** 全部节点 type */
    nodeTypes: () => (g6()?.getNodeData?.() ?? []).map((d: any) => d.type),
    /** 全部边 type */
    edgeTypes: () => (g6()?.getEdgeData?.() ?? []).map((d: any) => d.type),
    /** 指定元素的计算样式（含 lineDash / src / size 等） */
    elementStyle: (id: string) => g6()?.getElementData?.(id)?.style ?? null,
    /** 指定元素的当前状态数组 */
    states: (id: string) => g6()?.getElementState?.(id) ?? [],
    /** 原始 G6 实例（仅验收用） */
    instance: () => g6(),
    /** 搜索命中数（新内核没有内置 search，按 label 子串在业务数据上过滤） */
    searchCount: (kw: string) =>
      graph.value.nodes.filter((n: any) => String(n.label ?? n.id).includes(kw)).length,
    /** 边交叉数（新内核 countEdgeCrossings） */
    crossings: () => Number(graphRef.value?.countEdgeCrossings?.() ?? -1),
    /** 撤销 / 重做可用性 */
    canUndo: () => graphRef.value?.canUndo ?? false,
    canRedo: () => graphRef.value?.canRedo ?? false,
    /** 节点内容插槽容器数量（DOM 里的 .rrg__node-content） */
    nodeSlotCount: () => document.querySelectorAll(".rrg__node-content").length,
    /** 切换应用语言（验证组件文案随共享 i18n 切换） */
    setLang: (l: string) => { (i18n.global.locale as any).value = l; },
    getLang: () => (i18n.global.locale as any).value,
    /** 当前折叠的分组 id 列表 */
    collapsedGroups: () => graphRef.value?.getCollapsedGroups?.() ?? [],
    /** 指定节点当前 label（业务字段） */
    nodeLabel: (id: string) =>
      (g6()?.getNodeData?.() ?? []).find((n: any) => n.id === id)?.data?.__label ?? "-",
    /** 指定边当前 label（业务字段） */
    edgeLabel: (id: string) =>
      (g6()?.getEdgeData?.() ?? []).find((e: any) => e.id === id)?.data?.__label ?? "-",
    /** 选中元素（走组件 API，用于工具栏更新/删除按钮的验收） */
    select: (ids: string[]) => graphRef.value?.select?.(ids),
    /** 只点亮一组元素（不改选中集合） */
    highlightElements: (ids: string[]) => graphRef.value?.highlightElements?.(ids),
    /** 平移到某个元素 */
    centerOn: (id: string) => graphRef.value?.centerOn?.(id),
    /** 画布像素非透明占比（证明真画出来了） */
    painted: () => {
      const list = [...document.querySelectorAll(".rrglab__stage canvas")] as HTMLCanvasElement[];
      let best = 0;
      list.forEach(c => {
        const ctx = c.getContext("2d");
        if (!ctx) {
          return;
        }
        let p = 0;
        let t = 0;
        const step = Math.max(1, Math.floor(Math.min(c.width, c.height) / 100));
        for (let y = 0; y < c.height; y += step) {
          for (let x = 0; x < c.width; x += step) {
            t++;
            if (ctx.getImageData(x, y, 1, 1).data[3] > 0) {
              p++;
            }
          }
        }
        best = Math.max(best, t ? p / t : 0);
      });
      return best;
    },
  };
});
</script>

<template>
  <div class="rrglab">
    <div class="rrglab__panel">
      <div class="rrglab__title">ReRelationGraph 能力验收台</div>

      <div class="rrglab__group">
        <span class="rrglab__label">场景</span>
        <div class="rrglab__btns">
          <button
            v-for="s in scenarios"
            :key="s.key"
            class="rrglab__btn"
            :class="{ 'is-active': scenario === s.key }"
            :data-testid="'scenario-' + s.key"
            @click="scenario = s.key; say('场景 ' + s.key)"
          >{{ s.label }}</button>
        </div>
      </div>

      <div class="rrglab__group">
        <span class="rrglab__label">动态控制</span>
        <div class="rrglab__btns">
          <button class="rrglab__btn" data-testid="act-add-node" @click="addNode">加节点</button>
          <button class="rrglab__btn" data-testid="act-add-edge" @click="addEdge">加边</button>
          <button class="rrglab__btn" data-testid="act-remove" @click="removeSelected">删选中</button>
          <button class="rrglab__btn" data-testid="act-pin" @click="pinSelected">固定选中</button>
        </div>
      </div>

      <div class="rrglab__group">
        <span class="rrglab__label">视图</span>
        <div class="rrglab__btns">
          <button class="rrglab__btn" data-testid="act-layout" @click="cycleLayout">切换布局</button>
          <button class="rrglab__btn" data-testid="act-zoom-in" @click="zoomIn">放大</button>
          <button class="rrglab__btn" data-testid="act-zoom-out" @click="zoomOut">缩小</button>
          <button class="rrglab__btn" data-testid="act-fit" @click="fit">适配</button>
          <button class="rrglab__btn" :class="{ 'is-active': minimize }" data-testid="act-minimap" @click="toggleMinimap">小地图</button>
          <button class="rrglab__btn" @click="toggleHighlight">高亮:{{ highlight ? '开' : '关' }}</button>
          <button class="rrglab__btn" :class="{ 'is-active': brushOn }" data-testid="act-ctrl" @click="toggleBrush">框选:{{ brushOn ? '开' : '关' }}</button>
        </div>
      </div>

      <div class="rrglab__group">
        <span class="rrglab__label">状态</span>
        <div class="rrglab__stat">
          <div>布局：<b data-testid="stat-layout">{{ layout }}</b></div>
          <div>选中：<b data-testid="stat-selection">{{ selection.join(",") || "-" }}</b></div>
          <div>悬停：<b data-testid="stat-hover">{{ lastHover }}</b></div>
          <div>事件数：<b data-testid="stat-events">{{ eventCount }}</b></div>
          <div>已固定：<b data-testid="stat-fixed">{{ fixedCount }}</b></div>
          <div>命中：<b data-testid="stat-matches">{{ searchMatches }}</b></div>
          <div>交叉数：<b data-testid="stat-crossings">{{ crossingCount }}</b></div>
          <div>可撤销：<b data-testid="stat-undo">{{ canUndo ? "1" : "0" }}</b></div>
          <div>可重做：<b data-testid="stat-redo">{{ canRedo ? "1" : "0" }}</b></div>
        </div>
      </div>

      <div class="rrglab__group">
        <span class="rrglab__label">补齐能力</span>
        <div class="rrglab__btns">
          <button class="rrglab__btn" data-testid="act-search" @click="doSearch('服务')">搜索"服务"</button>
          <button class="rrglab__btn" data-testid="act-locate" @click="locateFirst">定位首个</button>
          <button class="rrglab__btn" data-testid="act-crossings" @click="countCrossing">数交叉</button>
          <button class="rrglab__btn" data-testid="act-undo" @click="doUndo">撤销</button>
          <button class="rrglab__btn" data-testid="act-redo" @click="doRedo">重做</button>
        </div>
      </div>

      <div class="rrglab__group rrglab__group--grow">
        <span class="rrglab__label">事件日志</span>
        <div class="rrglab__log" data-testid="event-log">
          <div v-for="(l, i) in logLines" :key="i">{{ l }}</div>
        </div>
      </div>
    </div>

    <div class="rrglab__stage">
      <ReRelationGraph
        ref="graphRef"
        :key="scenario"
        :nodes="graph.nodes"
        :edges="graph.edges"
        :layout="layout"
        height="100%"
        :toolbar="true"
        :minimap="minimize"
        :highlight="highlight"
        :node-size="38"
        @node-click="onNodeClick"
        @node-dblclick="onNodeDblClick"
        @node-mouseover="onNodeHover"
        @edge-click="onEdgeClick"
        @selection-change="onSelectionChange"
        @history-change="onHistoryChange"
      >
        <template #node-content="{ node, selected }">
          <div
            class="rrglab__nodecard"
            :class="{ 'is-selected': selected }"
            :data-node-id="node.id"
          >
            <div class="rrglab__nodecard-title">{{ node.label ?? node.id }}</div>
            <div class="rrglab__nodecard-sub">{{ node.data?.ip ?? node.id }}</div>
          </div>
        </template>
      </ReRelationGraph>
    </div>
  </div>
</template>

<style scoped>
.rrglab { display: flex; gap: 12px; height: calc(100vh - 120px); padding: 12px; box-sizing: border-box; }
.rrglab__panel { width: 320px; flex: 0 0 320px; display: flex; flex-direction: column; gap: 10px; overflow: auto; }
.rrglab__stage { flex: 1 1 auto; min-width: 0; }
.rrglab__title { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.rrglab__group { display: flex; flex-direction: column; gap: 6px; }
.rrglab__group--grow { flex: 1 1 auto; min-height: 120px; }
.rrglab__label { font-size: 12px; color: var(--text-tertiary); }
.rrglab__btns { display: flex; flex-wrap: wrap; gap: 6px; }
.rrglab__btn { font-size: 12px; padding: 4px 8px; border: 1px solid var(--border-default, #dcdfe6); border-radius: 6px; background: var(--bg-elevated, #fff); color: var(--text-primary); cursor: pointer; }
.rrglab__btn:hover { border-color: var(--brand-400, #409eff); color: var(--brand-500, #409eff); }
.rrglab__btn.is-active { border-color: var(--brand-500, #409eff); color: var(--brand-500, #409eff); background: var(--brand-50, #ecf5ff); }
.rrglab__stat { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; font-size: 12px; color: var(--text-secondary); }
.rrglab__log { flex: 1 1 auto; overflow: auto; font-family: "JetBrains Mono", Consolas, monospace; font-size: 11px; line-height: 1.6; color: var(--text-secondary); border: 1px solid var(--border-subtle, #ebeef5); border-radius: 6px; padding: 6px 8px; background: var(--bg-elevated, #fff); }
.rrglab__nodecard { width: 150px; min-height: 52px; padding: 6px 10px; box-sizing: border-box; border: 1px solid var(--border-default, #dcdfe6); border-radius: 8px; background: var(--bg-elevated, #fff); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); display: flex; flex-direction: column; justify-content: center; gap: 2px; }
.rrglab__nodecard.is-selected { border-color: var(--brand-500, #409eff); box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25); }
.rrglab__nodecard-title { font-size: 12px; font-weight: 600; color: var(--text-primary, #303133); }
.rrglab__nodecard-sub { font-size: 11px; color: var(--text-secondary, #606266); }
</style>
