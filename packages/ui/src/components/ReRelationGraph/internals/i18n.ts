/**
 * ReRelationGraph 内部 i18n 助手。
 *
 * <p>复用 {@link @repo/languages} 的全局 i18n 实例（vue-i18n，legacy:false）。
 * 组件文案以 `rrg` 命名空间 {@link mergeLocaleMessage} 进去，语言切换
 * （{@code i18n.global.locale.value = …}）仍能实时响应。</p>
 *
 * <p>为什么不直接写在 {@link @repo/languages/src/modules/zh|en}：语言包是应用级
 * 菜单文案，把组件文案挂上去耦合了语言包与组件；这里自含式注册，外界无侵入。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import i18n from "@repo/languages";

/** 一棵可嵌套的文案树 */
type MsgTree = { [key: string]: string | MsgTree };

const ZH: MsgTree = {
  toolbar: {
    aria: "关系图工具栏",
    layout: "选择布局",
    zoomIn: "放大",
    zoomOut: "缩小",
    fit: "适配视口",
    tuning: "调参",
    tuningPanel: "布局参数",
    tuningClose: "关闭",
    tuningUnsupported: "当前布局不支持调参，请切换到力导向布局",
    tuningApply: "重新布局",
    tuningReset: "恢复默认",
    edgeLabelsAll: "显示全部边标签",
    minimap: "小地图",
    minimapOn: "隐藏小地图",
    minimapOff: "显示小地图",
    search: "搜索节点",
    searchPlaceholder: "搜索节点…",
    clearSearch: "清除搜索",
    export: "导出",
    exportTip: "导出图片",
    undo: "撤销",
    redo: "重做",
    connect: "连线",
    connectTip: "连线模式",
    connectOn: "切回 2D 并退出连线模式",
    connectOff: "退出连线模式",
    toggleMode2d: "2D",
    toggleMode3d: "3D",
    modeTitle2d: "切回 2D 画布",
    modeTitle3d: "切换到 3D 力导向视图",
    updateNode: "更新节点",
    updateNodeTip: "更新选中节点（label 追加 _udt）",
    updateEdge: "更新边",
    updateEdgeTip: "更新选中边（label 追加 _udt）",
    removeNode: "删除节点",
    removeNodeTip: "删除选中节点",
    removeEdge: "删除边",
    removeEdgeTip: "删除选中边",
  },
  canvas: {
    aria: "关系图画布，Ctrl+加号放大、Ctrl+减号缩小、Ctrl+Z 撤销、Ctrl+Y 重做、Ctrl+F 搜索、Esc 取消",
  },
  menu: {
    node: "节点：{{label}}",
    edge: "边：{{id}}",
    canvas: "空白处",
    deleteNode: "删除该节点",
    deleteEdge: "删除该边",
    close: "关闭",
  },
  empty: "暂无数据",
  group: "分组",
  hint: {
    htmlNodeUnsupported3d: "节点插槽（#node-content）仅在 2D 视图生效",
    exportHtmlLimitation: "导出图片仅包含画布内容，DOM 插槽节点不包含在内",
  },
  layouts: {
    force: "力导向",
    "d3-force": "D3 力导向",
    "force-atlas2": "ForceAtlas2",
    fruchterman: "Fruchterman",
    mds: "MDS 降维",
    circular: "环形",
    concentric: "同心圆",
    radial: "辐射",
    grid: "网格",
    random: "随机",
    dagre: "有向分层",
    "antv-dagre": "有向分层(antv)",
    snake: "蛇形",
    "compact-box": "紧凑树",
    dendrogram: "树状图",
    indented: "缩进树",
    mindmap: "思维导图",
    fishbone: "鱼骨图",
  },
};

const EN: MsgTree = {
  toolbar: {
    aria: "Relation graph toolbar",
    layout: "Layout",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    fit: "Fit View",
    tuning: "Tune",
    tuningPanel: "Layout parameters",
    tuningClose: "Close",
    tuningUnsupported: "Current layout cannot be tuned. Switch to a force-directed layout.",
    tuningApply: "Re-layout",
    tuningReset: "Reset",
    edgeLabelsAll: "Show all edge labels",
    minimap: "Mini Map",
    minimapOn: "Hide Mini Map",
    minimapOff: "Show Mini Map",
    search: "Search nodes",
    searchPlaceholder: "Search nodes…",
    clearSearch: "Clear search",
    export: "Export",
    exportTip: "Export Image",
    undo: "Undo",
    redo: "Redo",
    connect: "Connect",
    connectTip: "Connect Mode",
    connectOn: "Switch to 2D and exit connect mode",
    connectOff: "Exit connect mode",
    toggleMode2d: "2D",
    toggleMode3d: "3D",
    modeTitle2d: "Back to 2D canvas",
    modeTitle3d: "Switch to 3D force-directed view",
    updateNode: "Update Node",
    updateNodeTip: "Update the selected node (append _udt to label)",
    updateEdge: "Update Edge",
    updateEdgeTip: "Update the selected edge (append _udt to label)",
    removeNode: "Delete Node",
    removeNodeTip: "Delete the selected node",
    removeEdge: "Delete Edge",
    removeEdgeTip: "Delete the selected edge",
  },
  canvas: {
    aria: "Relation graph canvas. Ctrl+Plus zoom in, Ctrl+Minus zoom out, Ctrl+Z undo, Ctrl+Y redo, Ctrl+F search, Esc cancel",
  },
  menu: {
    node: "Node: {{label}}",
    edge: "Edge: {{id}}",
    canvas: "Blank area",
    deleteNode: "Delete node",
    deleteEdge: "Delete edge",
    close: "Close",
  },
  empty: "No data",
  group: "Group",
  hint: {
    htmlNodeUnsupported3d: "Node slot (#node-content) is 2D-only",
    exportHtmlLimitation:
      "Exported image only contains canvas content (HTML slot nodes are excluded)",
  },
  layouts: {
    force: "Force",
    "d3-force": "D3 force",
    "force-atlas2": "ForceAtlas2",
    fruchterman: "Fruchterman",
    mds: "MDS",
    circular: "Circular",
    concentric: "Concentric",
    radial: "Radial",
    grid: "Grid",
    random: "Random",
    dagre: "Dagre",
    "antv-dagre": "antv-Dagre",
    snake: "Snake",
    "compact-box": "Compact tree",
    dendrogram: "Dendrogram",
    indented: "Indented tree",
    mindmap: "Mindmap",
    fishbone: "Fishbone",
  },
};

let merged = false;
/** 把组件文案注册进共享 i18n 实例，仅执行一次。 */
const ensureMerged = (): void => {
  if (merged) {
    return;
  }
  merged = true;
  i18n.global.mergeLocaleMessage("zh", { rrg: ZH });
  i18n.global.mergeLocaleMessage("en", { rrg: EN });
};

/**
 * 翻译助手。
 *
 * @param key      完整 key（含 `rrg.` 前缀）或去掉前缀的 key
 * @param fallback key 未命中时兜底显示的文案
 * @return 翻译结果
 */
export const t = (key: string, fallback = ""): string => {
  ensureMerged();
  const full = key.startsWith("rrg.") ? key : `rrg.${key}`;
  const res = String(i18n.global.t(full) ?? "");
  return res === full || res === "" ? fallback : res;
};

/** 布局名翻译：命中时返回对应语言名，否则回退到传入的 zh 标签。 */
export const tLayout = (value: string, fallback: string): string =>
  t(`layouts.${value}`, fallback);
