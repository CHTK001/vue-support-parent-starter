<script setup lang="ts">
/**
 * ReRelationGraph · 三国演义知识图谱集成示例
 *
 * <p>展示 {@link @repo/ui/re-relation-graph}（G6 5.1.1 原生，bubble-sets 基础）
 * 在真实业务数据上的效果：三国人物按势力分组（蜀汉/曹魏/东吴/吕布集团/董卓集团/
 * 袁绍集团/东汉朝廷），气泡集包裹同势力节点，force 布局防重叠。</p>
 *
 * <p>数据源：{@link ../../data/sanguo}（忠实于知识库三国图谱的势力结构）。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ReRelationGraph, {
  GRAPH_PRESETS,
  applyPreset,
  groupColorOf,
  LAYOUT_OPTIONS,
  type GroupType,
  type LayoutType,
} from "@repo/ui/re-relation-graph";
import { sanguoNodes, sanguoEdges } from "../data/sanguo";

// 业务端节点：id / label / group（势力）/ type / size
/** 头像取色直接用组件的分组配色（保证头像底色和节点/轮廓同色） */
const avatarColorOf = (group: string) => groupColorOf(group);

/** 生成一个圆形字符头像（纯 data URI SVG，离线可用，不依赖任何图床） */
const avatarOf = (text: string, color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="${color}"/>
      <circle cx="48" cy="40" r="15" fill="#ffffff" fill-opacity="0.92"/>
      <path d="M20 88c4-16 15-24 28-24s24 8 28 24z" fill="#ffffff" fill-opacity="0.92"/>
      <text x="48" y="72" font-size="0" fill="#fff">${text}</text>
    </svg>`,
  )}`;

/** 徽标：把「主公 / 军师 / 猛将」这类身份标在节点右上角（真实三国身份） */
const NODE_BADGES: Record<string, { text: string; color: string }> = {
  刘备: { text: "主公", color: "#2f7ed8" },
  曹操: { text: "主公", color: "#c0392b" },
  孙权: { text: "主公", color: "#16a085" },
  诸葛亮: { text: "军师", color: "#6c5ce7" },
  郭嘉: { text: "军师", color: "#6c5ce7" },
  周瑜: { text: "都督", color: "#6c5ce7" },
  关羽: { text: "猛将", color: "#e67e22" },
  张飞: { text: "猛将", color: "#e67e22" },
  吕布: { text: "猛将", color: "#e67e22" },
  许褚: { text: "猛将", color: "#e67e22" },
};

/** 头像只给几个核心人物开（其余保持圆形节点，演示两种节点混排） */
const AVATAR_NODES = new Set(["刘备", "曹操", "孙权", "诸葛亮", "吕布"]);

/** 节点头像（演示 image 节点）/ 节点徽标（演示 badge）两个开关 */
const showAvatar = ref(true);
const nodeBadge = ref(true);

/** 业务端节点：id / label / group（势力）/ type / size + 头像 + 徽标 */
const nodes = computed(() =>
  sanguoNodes.map((n) => {
    const group = n.data.cluster;
    const badge = NODE_BADGES[n.id];
    const color = avatarColorOf(group);
    return {
      id: n.id,
      label: n.id,
      group,
      // 业务类型原样传（person / location / event），形状由组件按白名单回落成 circle
      type: n.data.type,
      size: n.style.size ?? 40,
      ...(showAvatar.value && AVATAR_NODES.has(n.id) && n.data.type === "person"
        ? { image: avatarOf(n.id, color), imageRadius: 999 }
        : {}),
      ...(badge ? { badge: badge.text, badgeColor: badge.color } : {}),
    };
  }),
);

/** 边：把数据里补的「关系名」透传成 label（没写的就不显示） */
const edges = computed(() =>
  sanguoEdges.map((e) => ({
    source: e.source,
    target: e.target,
    label: e.data?.relation ?? "",
  })),
);

/** 边样式（组件级默认值，逐条边可在数据里覆盖） */
const edgeArrow = ref<boolean | "both">(false);
const edgeDashed = ref(false);
const edgeLabel = ref(true);
const edgeWidth = ref(1.4);

/** 场景预设：一键套用「布局 + 轮廓 + 交互开关 + 边样式」一整组参数 */
const presetKey = ref(GRAPH_PRESETS[0].key);
const presetEffect = computed(
  () => GRAPH_PRESETS.find((p) => p.key === presetKey.value)?.effect ?? "",
);
const applyPresetNow = (key: string) => {
  const preset = GRAPH_PRESETS.find((p) => p.key === key);
  const p = applyPreset(key);
  layout.value = p.layout;
  layoutOptions.value = { ...(p.layoutOptions ?? {}) };
  groupType.value = p.groupType ?? "none";
  groupVisible.value = p.groupVisible ?? false;
  groupAutoHide.value = p.groupAutoHide ?? true;
  highlight.value = p.highlight ?? true;
  clickSelect.value = p.clickSelect ?? false;
  brushSelect.value = p.brushSelect ?? false;
  minimap.value = p.minimap ?? false;
  combo.value = p.combo ?? false;
  nodeTooltip.value = p.nodeTooltip ?? true;
  edgeTooltip.value = p.edgeTooltip ?? true;
  nodeBadge.value = p.nodeBadge ?? true;
  edgeArrow.value = p.edgeArrow ?? false;
  edgeDashed.value = p.edgeDashed ?? false;
  edgeWidth.value = p.edgeWidth ?? 1.4;
  edgeLabel.value = p.edgeLabel ?? true;
  toolbarVariant.value = p.toolbarVariant ?? "pill";
  toolbarCollapsible.value = p.toolbarCollapsible ?? true;
  hoverInfo.value = `已套用预设：${preset?.label ?? key}`;
};

/** 当前布局：缺省分组布局（每组自动占据画布一块独立区域） */
const layout = ref<LayoutType>("group");

/** 分组轮廓：气泡集 / Hull 轮廓 / 不分组 */
const groupType = ref<GroupType>("bubble");

/** 分组轮廓显隐 */
const groupVisible = ref(true);

/** 非分组布局下自动隐藏轮廓（避免散布局里轮廓互相重叠） */
const groupAutoHide = ref(true);

/** 内置工具栏（图标 + Popover 面板）开关 */
const toolbar = ref(true);

/** 工具栏外观变体（设计探索用：胶囊 / 卡片 / 侧轨） */
const toolbarVariant = ref<"pill" | "card" | "rail">("pill");

/** 工具栏停靠位置（四角 + 左右侧居中） */
const toolbarPosition = ref<"top-left" | "top-right" | "bottom-left" | "bottom-right">(
  "top-right",
);

/** 工具栏能否折叠 */
const toolbarCollapsible = ref(true);

/** 节点 / 边悬浮提示（默认开启） */
const tooltip = ref(true);
/** 节点 / 边悬浮提示可以各自单独关（演示「只给节点配提示、边不要」） */
const nodeTooltip = ref(true);
const edgeTooltip = ref(true);

/** 右键时是否把命中元素补进选择 */
const rightClickSelect = ref(true);

/** 最近一次右键回参（验证「右键把元素信息当入参交给业务」） */
const ctxInfo = ref("（在节点 / 边 / 分组 / 空白处右键试试，这里会显示回参）");
const onContextmenu = (d: {
  targetType: string;
  id: string;
  group?: string;
  selection: { nodes: string[]; edges: string[]; combos: string[] };
}) => {
  const who = d.targetType === "canvas" ? "空白画布" : `${d.targetType} ${d.group ?? d.id}`;
  ctxInfo.value = `右键 ${who}｜选中 ${d.selection.nodes.length} 节点 / ${d.selection.edges.length} 边 / ${d.selection.combos.length} 分组`;
};

/** 右键菜单里的动作（演示：菜单拿到的就是右键回参） */
const menuAction = (action: string, menu: { id?: string; targetType?: string }, close: () => void) => {
  if (action === "focus" && menu.id) {
    graphComp.value?.focus?.([menu.id]);
    hoverInfo.value = `菜单「聚焦」→ ${menu.id}`;
  } else if (action === "path-from" && menu.id) {
    // 组件内部会记下端点；两端齐了它就直接算，这里同步页面上的显示
    const done = graphComp.value?.setPathEndpoint?.(menu.id, "from");
    pathFrom.value = menu.id;
    hoverInfo.value = done
      ? `路径：${pathFrom.value} → ${pathTo.value}`
      : `已把「${menu.id}」设为起点，再右键一个节点设为终点`;
  } else if (action === "path-to" && menu.id) {
    const done = graphComp.value?.setPathEndpoint?.(menu.id, "to");
    pathTo.value = menu.id;
    hoverInfo.value = done
      ? `路径：${pathFrom.value} → ${pathTo.value}`
      : `已把「${menu.id}」设为终点，再右键一个节点设为起点`;
  } else if (action === "remove" && menu.id && menu.targetType === "node") {
    graphComp.value?.removeNode?.(menu.id);
    syncCount();
    hoverInfo.value = `菜单「删除」→ ${menu.id}（剩余 ${nodeCount.value} 个节点）`;
  }
  close();
};

/** 点选（单击选中）*/
const clickSelect = ref(false);
/** 框选（拖拽拉框多选）*/
const brushSelect = ref(false);
/** 悬停高亮 1 度邻居（默认开启）*/
const highlight = ref(true);
/** 小地图 */
const minimap = ref(false);
/** 分组折叠（把势力画成 combo，可点开 / 收起）*/
const combo = ref(false);

/* ---------------- 最短路径（算法示例：BFS 最少边数） ---------------- */

/**
 * 起点 / 终点。
 *
 * <p>不再由页面上的两个下拉决定 —— 端点由**右键菜单**指定（右键谁谁就是端点），
 * 页面这里只负责显示当前选的是谁，并给一个「算路径 / 显示全部」的按钮。</p>
 */
const pathFrom = ref("");
const pathTo = ref("");
/** 是否正处在「只显示路径」模式 */
const pathActive = ref(false);
/** 计算结果 */
const pathInfo = ref("（右键节点设为起点，再右键一个设为终点；也可以点上面的「算路径」）");

/** 两个端点都齐了才允许算 */
const canRunPath = computed(() => Boolean(pathFrom.value && pathTo.value && pathFrom.value !== pathTo.value));

const runShortestPath = () => {
  if (!canRunPath.value) {
    pathInfo.value = "先右键两个节点，分别设为起点和终点";
    return;
  }
  const cmp = graphComp.value as unknown as {
    shortestPath?: (s: string, t: string) => { nodes: string[]; edges: string[]; found: boolean };
  } | null;
  const res = cmp?.shortestPath?.(pathFrom.value, pathTo.value);
  pathActive.value = Boolean(res?.found);
  pathInfo.value = res?.found
    ? `${pathFrom.value} → ${pathTo.value}：${res.nodes.length} 个节点 / ${res.edges.length} 条边（${res.nodes.join(" → ")}）`
    : `没有找到 ${pathFrom.value} 到 ${pathTo.value} 的路径`;
};

const clearPath = () => {
  (graphComp.value as unknown as { clearPath?: () => void } | null)?.clearPath?.();
  pathActive.value = false;
  pathInfo.value = "已恢复显示全部节点";
};

/** 选中集合变化（点选 / 框选 / 工具栏算路径都会触发） */
const onSelectionChange = (d: { nodes: string[]; edges: string[] }) => {
  const names = d.nodes.slice(0, 8).join("、");
  hoverInfo.value = d.nodes.length
    ? `选中 ${d.nodes.length} 个节点${d.edges.length ? ` / ${d.edges.length} 条边` : ""}：${names}${d.nodes.length > 8 ? "…" : ""}`
    : "已清空选择";
};

/** 工具栏 / 右键算出来的路径结果 */
const onPathChange = (d: { from: string; to: string; found: boolean; nodes: string[]; edges: string[] }) => {
  // 退出路径模式时 from / to 都是空串，别显示成「没有找到 → 的路径」
  if (!d.from && !d.to) {
    pathActive.value = false;
    pathInfo.value = "已恢复显示全部节点";
    return;
  }
  pathFrom.value = d.from;
  pathTo.value = d.to;
  pathActive.value = d.found;
  pathInfo.value = d.found
    ? `${d.from} → ${d.to}：${d.nodes.length} 节点 / ${d.edges.length} 边（${d.nodes.join(" → ")}）`
    : `没有找到 ${d.from} → ${d.to} 的路径`;
};

/** 当前布局参数（工具栏「布局设置」改动会回传到这里） */
const layoutOptions = ref<Record<string, unknown>>({});

/** 组件实例（用于验收 / 调试暴露 graph 句柄） */
const graphComp = ref<{
  graph: unknown;
  layout?: string;
  groupType?: string;
  groupVisible?: boolean;
  focus?: (id: string[]) => void;
  getNodes?: () => Array<{ id: string; label?: string; group?: string }>;
  addNode?: (node: { id: string; label?: string; group?: string; size?: number }) => void;
  removeNode?: (id: string) => void;
  updateNode?: (id: string, patch: Record<string, unknown>) => void;
  countEdgeCrossings?: () => number;
  collapseGroup?: (group: string) => Promise<void>;
  expandGroup?: (group: string) => Promise<void>;
  getCollapsedGroups?: () => string[];
  shortestPathFromSelection?: () => { nodes: string[]; edges: string[]; found: boolean };
  shortestPath?: (s: string, t: string) => { nodes: string[]; edges: string[]; found: boolean };
  setPathEndpoint?: (id: string, role: "from" | "to") => boolean;
  clearPath?: () => void;
  pathActive?: boolean;
  pathFrom?: string;
  pathTo?: string;
  clearStates?: () => void;
  pathInfo?: string;
  undo?: () => boolean;
  redo?: () => boolean;
  clearHistory?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  history?: {
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
    lastAction: string;
  };
  selectAll?: () => boolean;
  deleteSelection?: () => boolean;
} | null>(null);

/* ---------------- 边交叉数（回答「能不能做到边完全不交叉」） ---------------- */

/** 当前布局落定后的边交叉数；散布局 / 分层布局可横向对比 */
const crossingCount = ref<number | null>(null);
const refreshCrossings = () => {
  crossingCount.value = graphComp.value?.countEdgeCrossings?.() ?? null;
};

/** 分组折叠（combo）演示：初始折叠的分组 */
const collapsedGroups = ref<string[]>([]);
const allGroups = [...new Set(sanguoNodes.map((n) => n.data.cluster))];
const collapseAll = async () => {
  collapsedGroups.value = [...allGroups];
  await Promise.all(allGroups.map((g) => graphComp.value?.collapseGroup?.(g)));
  hoverInfo.value = `已折叠全部 ${allGroups.length} 个分组`;
};
const expandAll = async () => {
  const groups = [...allGroups];
  collapsedGroups.value = [];
  await Promise.all(groups.map((g) => graphComp.value?.expandGroup?.(g)));
  hoverInfo.value = "已展开全部分组";
};

/** 最近一次 hover 事件（验证 mouseover / mouseout 已接通） */
const hoverInfo = ref("（把鼠标移到节点或边上，这里会实时显示）");

/** 自定义工具示例：一键聚焦某个势力 */
const quickFocusGroups = ["蜀汉", "曹魏", "东吴"];
const focusGroup = (group: string) => {
  const ids = sanguoNodes.filter((n) => n.data.cluster === group).map((n) => n.id);
  graphComp.value?.focus?.(ids);
  hoverInfo.value = `聚焦 ${group}（${ids.length} 个节点）`;
};

/* ---------------- 外部方法演示：节点增删改查（走组件 expose，不碰 props） ---------------- */

/** 当前节点数（读的是组件内部数据副本，含命令式新增的节点） */
const nodeCount = ref(nodes.value.length);
const syncCount = () => {
  nodeCount.value = graphComp.value?.getNodes?.().length ?? 0;
};

/** 新增一个「客串」节点到指定势力（演示 addNode） */
const addGuest = (group: string) => {
  const seq = (nodeCount.value % 90) + 1;
  graphComp.value?.addNode?.({
    id: `${group}·客串${seq}`,
    label: `客串${seq}`,
    group,
    size: 28,
  });
  syncCount();
  hoverInfo.value = `addNode → ${group}·客串${seq}（当前 ${nodeCount.value} 个节点）`;
};

/** 删掉刚加的最后一批节点（演示 removeNode + 连带删边） */
const removeLastGuest = () => {
  const list = graphComp.value?.getNodes?.() ?? [];
  const guest = [...list].reverse().find((n) => String(n.id).includes("客串"));
  if (!guest) {
    hoverInfo.value = "没有可删除的「客串」节点，先点「+ 客串」";
    return;
  }
  graphComp.value?.removeNode?.(String(guest.id));
  syncCount();
  hoverInfo.value = `removeNode → ${guest.id}（剩余 ${nodeCount.value} 个节点）`;
};

/** 改一个节点的标签 / 半径（演示 updateNode） */
const renameGuest = () => {
  const list = graphComp.value?.getNodes?.() ?? [];
  const guest = [...list].reverse().find((n) => String(n.id).includes("客串"));
  if (!guest) {
    hoverInfo.value = "没有可修改的「客串」节点，先点「+ 客串」";
    return;
  }
  const label = `改·${Math.random().toString(36).slice(2, 5)}`;
  graphComp.value?.updateNode?.(String(guest.id), { label, size: 44 });
  hoverInfo.value = `updateNode → ${guest.id} 改名为 ${label}（size 44）`;
};

/* ---------------- 编辑历史（撤销 / 重做）与键盘快捷键 ---------------- */

/** 历史总开关（关掉后命令式改动不再压栈，工具栏上的撤销按钮也消失） */
const historyEnabled = ref(true);
/** 组件内快捷键开关 */
const keyboardEnabled = ref(true);

/** 最近一次历史状态（由 history-change 事件回传） */
const historyInfo = ref({ canUndo: false, canRedo: false, undoCount: 0, redoCount: 0, lastAction: "" });
const onHistoryChange = (d: typeof historyInfo.value) => {
  historyInfo.value = d;
};

/** 最近命中的快捷键（验证「组件内键盘」真的收得到） */
const lastShortcut = ref("（点一下画布让它拿到焦点，再按 Ctrl+Z / Delete / Ctrl+A / Esc）");
const onShortcut = (d: { action: string; combo: string }) => {
  lastShortcut.value = `快捷键 ${d.combo} → ${d.action}`;
};

const doUndo = () => {
  const ok = graphComp.value?.undo?.();
  syncCount();
  hoverInfo.value = ok ? "撤销了一步（Ctrl+Z）" : "没有可撤销的改动";
};

const doRedo = () => {
  const ok = graphComp.value?.redo?.();
  syncCount();
  hoverInfo.value = ok ? "重做了一步（Ctrl+Shift+Z）" : "没有可重做的改动";
};

/** 清空历史（避免示例里来回撤销到很久以前） */
const resetHistory = () => {
  graphComp.value?.clearHistory?.();
  hoverInfo.value = "已清空撤销 / 重做历史";
};

const onNodeMouseover = (d: { id: string; data?: unknown }) => {
  const cluster =
    ((d.data as { data?: { cluster?: string } } | undefined)?.data?.cluster ?? "") ||
    ((d.data as { cluster?: string } | undefined)?.cluster ?? "");
  hoverInfo.value = `node-mouseover → ${d.id}（${cluster}）`;
};
const onNodeMouseout = (d: { id: string }) => {
  hoverInfo.value = `node-mouseout → ${d.id}`;
};
const onEdgeMouseover = (d: { id: string; source: string; target: string; data?: unknown }) => {
  const src = d.source || ((d.data as { source?: string } | undefined)?.source ?? "");
  const tgt = d.target || ((d.data as { target?: string } | undefined)?.target ?? "");
  hoverInfo.value = `edge-mouseover → ${src} — ${tgt}`;
};
const onEdgeMouseout = (d: { id: string; source: string; target: string; data?: unknown }) => {
  const src = d.source || ((d.data as { source?: string } | undefined)?.source ?? "");
  const tgt = d.target || ((d.data as { target?: string } | undefined)?.target ?? "");
  hoverInfo.value = `edge-mouseout → ${src} — ${tgt}`;
};

onMounted(() => {
  // 把 G6 实例（组件实例）暴露到 window，供验收脚本断言。
  // 注意：切换布局时组件会整图重建，graph 句柄会换成新实例，
  // 因此这里持续刷新（而不是取到一次就停止），脚本始终拿到活得那个。
  const timer = window.setInterval(() => {
    if (graphComp.value?.graph) {
      (window as any).__RRG__ = graphComp.value.graph;
      (window as any).__RRGCMP__ = graphComp.value;
      syncCount();
      refreshCrossings();
    }
  }, 500);
  onBeforeUnmount(() => window.clearInterval(timer));
});
</script>

<template>
  <div class="rrg-lab">
    <div class="rrg-lab__head">
      <div class="rrg-lab__row">
        <div class="rrg-lab__title">ReRelationGraph · 三国演义知识图谱（G6 5.1.1 原生）</div>
        <div class="rrg-lab__controls">
          <span class="rrg-lab__layout-label">布局</span>
          <el-select v-model="layout" size="small" style="width: 190px">
            <el-option
              v-for="opt in LAYOUT_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <span class="rrg-lab__layout-label">分组轮廓</span>
          <el-select v-model="groupType" size="small" style="width: 140px">
            <el-option label="气泡集 bubble-sets" value="bubble" />
            <el-option label="Hull 轮廓" value="hull" />
            <el-option label="不分组" value="none" />
          </el-select>

          <el-switch v-model="groupVisible" size="small" active-text="显示分组" />

          <el-divider direction="vertical" />

          <span class="rrg-lab__layout-label">内置工具栏</span>
          <el-switch v-model="toolbar" size="small" />
          <el-select v-model="toolbarVariant" size="small" style="width: 118px" :disabled="!toolbar">
            <el-option label="胶囊 pill" value="pill" />
            <el-option label="卡片 card" value="card" />
            <el-option label="侧轨 rail" value="rail" />
          </el-select>
        </div>
      </div>

      <div class="rrg-lab__row rrg-lab__row--sub">
        <div class="rrg-lab__controls">
          <span class="rrg-lab__layout-label">工具栏停靠</span>
          <el-select v-model="toolbarPosition" size="small" style="width: 116px" :disabled="!toolbar">
            <el-option label="左上" value="top-left" />
            <el-option label="右上" value="top-right" />
            <el-option label="左下" value="bottom-left" />
            <el-option label="右下" value="bottom-right" />
          </el-select>

          <el-switch v-model="toolbarCollapsible" size="small" active-text="可折叠" />
          <el-switch v-model="tooltip" size="small" active-text="悬浮提示" />
          <el-switch v-model="groupAutoHide" size="small" active-text="散布局隐藏轮廓" />
        </div>
      </div>

      <div class="rrg-lab__row rrg-lab__row--sub">
        <div class="rrg-lab__controls">
          <span class="rrg-lab__layout-label">交互</span>
          <el-switch v-model="clickSelect" size="small" active-text="点选" />
          <el-switch v-model="brushSelect" size="small" active-text="框选" />
          <el-switch v-model="highlight" size="small" active-text="悬停高亮" />
          <el-switch v-model="nodeTooltip" size="small" active-text="节点提示" />
          <el-switch v-model="edgeTooltip" size="small" active-text="边提示" />
          <el-switch v-model="rightClickSelect" size="small" active-text="右键选中" />
          <el-switch v-model="minimap" size="small" active-text="小地图" />
          <el-switch v-model="combo" size="small" active-text="分组折叠" />
          <el-button size="small" :disabled="!combo" @click="collapseAll">全部折叠</el-button>
          <el-button size="small" :disabled="!combo" @click="expandAll">全部展开</el-button>
          <el-select
            v-model="collapsedGroups"
            size="small"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="初始折叠分组"
            style="width: 156px"
            :disabled="!combo"
          >
            <el-option v-for="g in allGroups" :key="`cg-${g}`" :label="g" :value="g" />
          </el-select>
          <el-tag size="small" type="warning" effect="plain">
            边交叉 {{ crossingCount ?? "-" }}
          </el-tag>

          <el-divider direction="vertical" />

          <span class="rrg-lab__layout-label">最短路径</span>
          <el-tag size="small" effect="plain" type="info">
            {{ pathFrom || "未选起点" }} → {{ pathTo || "未选终点" }}
          </el-tag>
          <el-button size="small" type="primary" :disabled="!canRunPath" @click="runShortestPath">
            算路径
          </el-button>
          <el-button size="small" :disabled="!pathActive" @click="clearPath">显示全部</el-button>
          <span class="rrg-lab__hint" title="右键节点 → 设为路径起点 / 终点">（右键设起终点）</span>
        </div>
      </div>

      <div class="rrg-lab__row rrg-lab__row--sub">
        <div class="rrg-lab__controls">
          <span class="rrg-lab__layout-label">场景预设</span>
          <el-select
            v-model="presetKey"
            size="small"
            style="width: 128px"
            @change="applyPresetNow"
          >
            <el-option v-for="p in GRAPH_PRESETS" :key="p.key" :label="p.label" :value="p.key" />
          </el-select>
          <el-tag size="small" type="info" effect="plain">{{ presetEffect }}</el-tag>

          <el-divider direction="vertical" />

          <span class="rrg-lab__layout-label">节点外观</span>
          <el-switch v-model="showAvatar" size="small" active-text="头像" />
          <el-switch v-model="nodeBadge" size="small" active-text="徽标" />

          <el-divider direction="vertical" />

          <span class="rrg-lab__layout-label">边样式</span>
          <el-select v-model="edgeArrow" size="small" style="width: 96px">
            <el-option label="无箭头" :value="false" />
            <el-option label="单向箭头" :value="true" />
            <el-option label="双向箭头" value="both" />
          </el-select>
          <el-switch v-model="edgeDashed" size="small" active-text="虚线" />
          <el-switch v-model="edgeLabel" size="small" active-text="边标签" />
          <el-select v-model="edgeWidth" size="small" style="width: 92px">
            <el-option label="细线" :value="1" />
            <el-option label="常规" :value="1.4" />
            <el-option label="粗线" :value="2.4" />
          </el-select>
        </div>
      </div>

      <div class="rrg-lab__row rrg-lab__row--sub">
        <div class="rrg-lab__controls">
          <span class="rrg-lab__layout-label">外部方法（节点增删改查）</span>
          <el-button size="small" @click="addGuest('蜀汉')">+ 客串</el-button>
          <el-button size="small" :disabled="nodeCount === 0" @click="removeLastGuest">
            删客串
          </el-button>
          <el-button size="small" :disabled="nodeCount === 0" @click="renameGuest">
            改客串
          </el-button>
          <el-tag size="small" type="info" effect="plain">当前 {{ nodeCount }} 个节点</el-tag>

          <el-divider direction="vertical" />

          <span class="rrg-lab__layout-label">编辑历史</span>
          <el-button size="small" :disabled="!historyInfo.canUndo" @click="doUndo">
            撤销
          </el-button>
          <el-button size="small" :disabled="!historyInfo.canRedo" @click="doRedo">
            重做
          </el-button>
          <el-button size="small" @click="resetHistory">清历史</el-button>
          <el-switch v-model="historyEnabled" size="small" active-text="记录" />
          <el-switch v-model="keyboardEnabled" size="small" active-text="快捷键" />
          <el-tag size="small" type="success" effect="plain">
            可撤销 {{ historyInfo.undoCount }} / 可重做 {{ historyInfo.redoCount }}
          </el-tag>
          <el-tag size="small" type="warning" effect="plain">{{ lastShortcut }}</el-tag>
        </div>
      </div>
      <div class="rrg-lab__desc">
        以 G6 官方 bubble-sets 示例为地基：三国人物按势力分组（蜀汉 / 曹魏 / 东吴 / 吕布集团 /
        董卓集团 / 袁绍集团 / 东汉朝廷），<b>分组轮廓</b>可选「气泡集」或「Hull 轮廓」包裹同势力节点。
        <b>默认「分组布局」</b>给每个势力分配画布上一块独立区域（同组必聚、组间不重叠）；
        右上角内置工具栏（21px 图标、贴边）可切布局、切轮廓、调参数，还有
        <b>视图与交互</b>（点选 / 框选 / 悬停高亮 / <b>节点提示 / 边提示</b>（可分别开关，内容走在
        <code>#node-tooltip</code> / <code>#edge-tooltip</code> 插槽里）/ 小地图 / 分组折叠）、
        <b>分组折叠</b>（逐个分组折叠，可指定初始折叠）与<b>最短路径</b>
        （右键节点设为起点 / 终点，算完只显示这条链路、其余节点与边全部隐藏）。
        在节点 / 边 / 分组 / 空白处<b>右键</b>，会把命中元素和选中集合当入参浮出业务菜单。
        节点支持<b>头像</b>（image 节点）与<b>右上角徽标</b>（主公 / 军师 / 猛将），边支持
        <b>箭头 / 虚线 / 线宽 / 关系标签</b>（逐条边可覆盖组件级默认值）。
        「场景预设」下拉可一键套用知识图谱 / 组织架构 / 流程拓扑 / 社交关系 / 家族谱系五套参数。
        所有命令式增删改都会记历史：点一下画布拿到焦点后可用
        <b>Ctrl+Z</b> 撤销 / <b>Ctrl+Shift+Z</b>（或 Ctrl+Y）重做 / <b>Ctrl+A</b> 全选 /
        <b>Delete</b> 删除选中 / <b>Esc</b> 清空选择，工具栏里也有撤销 / 重做按钮。
        右上角「边交叉」实时显示当前布局的边-边交叉数，方便挑「最少交叉」的布局。
      </div>
    </div>
    <div class="rrg-lab__hover">{{ hoverInfo }}</div>
    <div class="rrg-lab__hover rrg-lab__hover--path">{{ pathInfo }}</div>
    <div class="rrg-lab__hover">{{ ctxInfo }}</div>
    <ReRelationGraph
      ref="graphComp"
      v-model:layout="layout"
      v-model:groupType="groupType"
      v-model:groupVisible="groupVisible"
      v-model:layoutOptions="layoutOptions"
      :nodes="nodes"
      :edges="edges"
      :toolbar="toolbar"
      :toolbar-variant="toolbarVariant"
      :toolbar-position="toolbarPosition"
      :toolbar-collapsible="toolbarCollapsible"
      :group-auto-hide="groupAutoHide"
      v-model:tooltip="tooltip"
      v-model:node-tooltip="nodeTooltip"
      v-model:edge-tooltip="edgeTooltip"
      :right-click-select="rightClickSelect"
      v-model:click-select="clickSelect"
      v-model:brush-select="brushSelect"
      v-model:highlight="highlight"
      v-model:minimap="minimap"
      v-model:combo="combo"
      :node-badge="nodeBadge"
      :edge-arrow="edgeArrow"
      :edge-dashed="edgeDashed"
      :edge-width="edgeWidth"
      :edge-label="edgeLabel"
      :collapsed-groups="collapsedGroups"
      :history="historyEnabled"
      :keyboard="keyboardEnabled"
      height="100%"
      class="rrg-lab__canvas"
      @node-mouseover="onNodeMouseover"
      @node-mouseout="onNodeMouseout"
      @edge-mouseover="onEdgeMouseover"
      @edge-mouseout="onEdgeMouseout"
      @nodes-change="syncCount"
      @selection-change="onSelectionChange"
      @path-change="onPathChange"
      @contextmenu="onContextmenu"
      @history-change="onHistoryChange"
      @shortcut="onShortcut"
    >
      <!-- 自定义工具位：业务自己的按钮可直接塞进内置工具栏 -->
      <template #toolbar-extra>
        <button
          v-for="g in quickFocusGroups"
          :key="g"
          type="button"
          class="rrg-lab__quick"
          :title="`聚焦 ${g}`"
          @click="focusGroup(g)"
        >
          {{ g.slice(0, 2) }}
        </button>
      </template>

      <!-- 节点提示：完全由业务模板决定（回参 = 业务节点对象） -->
      <template #node-tooltip="{ node }">
        <div class="rrg-tipdemo">
          <div class="rrg-tipdemo__title">{{ node.label ?? node.id }}</div>
          <div class="rrg-tipdemo__row"><span>势力</span><b>{{ node.group ?? "未分组" }}</b></div>
          <div class="rrg-tipdemo__row"><span>类型</span><b>{{ node.type ?? "circle" }}</b></div>
        </div>
      </template>

      <!-- 边提示：单独一份模板，回参 = 业务边对象 + 两端 -->
      <template #edge-tooltip="{ edge, source, target }">
        <div class="rrg-tipdemo">
          <div class="rrg-tipdemo__title">{{ source }} → {{ target }}</div>
          <div class="rrg-tipdemo__row"><span>关系</span><b>{{ edge.label || "（未命名）" }}</b></div>
        </div>
      </template>

      <!-- 右键菜单：回参 menu 就是组件算好的「命中元素 + 选中集合 + 坐标」 -->
      <template #context-menu="{ menu, close }">
        <div class="rrg-ctxdemo">
          <div class="rrg-ctxdemo__head">
            {{ menu.targetType === "canvas" ? "空白画布" : `${menu.group ?? menu.id}` }}
            <span class="rrg-ctxdemo__sub">
              选中 {{ menu.selection.nodes.length }} 节点 / {{ menu.selection.edges.length }} 边
            </span>
          </div>
          <button
            v-if="menu.id"
            type="button"
            class="rrg-ctxdemo__item"
            @click="menuAction('focus', menu, close)"
          >
            聚焦到它
          </button>
          <button
            v-if="menu.targetType === 'node'"
            type="button"
            class="rrg-ctxdemo__item"
            @click="menuAction('path-from', menu, close)"
          >
            设为路径起点{{ pathFrom === menu.id ? "（当前）" : "" }}
          </button>
          <button
            v-if="menu.targetType === 'node'"
            type="button"
            class="rrg-ctxdemo__item"
            @click="menuAction('path-to', menu, close)"
          >
            设为路径终点{{ pathTo === menu.id ? "（当前）" : "" }}
          </button>
          <button
            v-if="menu.targetType === 'node'"
            type="button"
            class="rrg-ctxdemo__item is-danger"
            @click="menuAction('remove', menu, close)"
          >
            删除这个节点
          </button>
          <button type="button" class="rrg-ctxdemo__item" @click="close()">关闭</button>
        </div>
      </template>
    </ReRelationGraph>
  </div>
</template>

<style lang="scss" scoped>
.rrg-lab {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 480px;
  padding: 14px;
  box-sizing: border-box;
}

.rrg-lab__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rrg-lab__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rrg-lab__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rrg-lab__layout-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 自定义工具位按钮：与工具栏内部图标按钮同一观感（方角、细边） */
.rrg-lab__quick {
  height: 30px;
  padding: 0 7px;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.rrg-lab__quick:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.rrg-lab__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.rrg-lab__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.rrg-lab__hover {
  font-size: 12px;
  color: var(--el-color-primary);
  font-family: monospace;
  padding: 4px 10px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
  min-height: 22px;
}

/* 最短路径结果行：彩色 / 橙红，与 hover 行区分 */
.rrg-lab__hover--path {
  color: var(--el-color-danger);
}

/* 起终点之间的箭头（保留：业务自定义面板里可能还在用） */
.rrg-lab__arrow {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 行内操作提示 */
.rrg-lab__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rrg-lab__canvas {
  flex: 1;
  min-height: 400px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  overflow: hidden;
}
</style>

<!--
  插槽内容会被注入到画布容器的 DOM 里（画的 tooltip / 右键浮层），
  此时父组件的 scoped 样式不一定命中，所以这两块用全局样式，靠唯一前缀隔离。
-->
<style lang="scss">
.rrg-tipdemo {
  min-width: 104px;
  font-size: 12px;
  line-height: 1.65;
  color: #303133;
}
.rrg-tipdemo__title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 2px;
}
.rrg-tipdemo__row {
  display: flex;
  gap: 8px;

  span {
    color: #909399;
  }
}

.rrg-ctxdemo {
  display: flex;
  flex-direction: column;
  min-width: 156px;
  font-size: 12px;
}
.rrg-ctxdemo__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px 6px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  border-bottom: 1px solid var(--el-border-color-lighter, #e4e7ed);
  margin-bottom: 4px;
}
.rrg-ctxdemo__sub {
  font-weight: 400;
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
}
.rrg-ctxdemo__item {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary, #303133);
  font-size: 12px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--el-fill-color-light, #f5f7fa);
  }

  &.is-danger {
    color: var(--el-color-danger, #f56c6c);
  }
}
</style>
