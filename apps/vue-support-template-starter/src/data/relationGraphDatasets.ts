/**
 * ReRelationGraph 调试页的示例数据集
 *
 * <p>把原来「节点 / 边各一个 textarea，手动贴 JSON」改成 el-segmented 分段切换：
 * 每一档是一份完整数据（nodes + edges 同时就位），点一下即可换图。</p>
 *
 * <p>刻意准备三种规模，用来同时验证「看得清」与「扛得住」：</p>
 * <ul>
 *   <li><b>三国势力</b>（44 节点）：真实业务形态，按 cluster 分组、多类型节点</li>
 *   <li><b>小圈子</b>（12 节点）：环形 + 星型混合，便于看清边、标签与分组轮廓的细节</li>
 *   <li><b>压力测试</b>（400 节点 / 约 800 边）：验证大图下的布局耗时、
 *       小地图与交互是否卡顿，是排查「节点太多导致卡顿」的依据数据</li>
 * </ul>
 */
import { sanguoNodes, sanguoEdges } from "./sanguo";

/** 关系图节点（与 @repo/ui/re-relation-graph 的 RelationNode 对齐） */
export interface DemoNode {
  id: string;
  label: string;
  group: string;
  type: string;
  size: number;
}

/** 关系图边 */
export interface DemoEdge {
  source: string;
  target: string;
}

/** 一份完整示例数据 */
export interface DemoDataset {
  /** 分段按钮文案 */
  label: string;
  /** 选中后的行为说明 */
  hint: string;
  nodes: DemoNode[];
  edges: DemoEdge[];
}

/* ==================== ① 三国势力（真实业务形态） ==================== */

/** 三国势力图谱：按 cluster 分组，person 用圆形、其余保留原类型 */
const sanguo: DemoDataset = {
  label: "三国势力",
  hint: "44 节点 / 按势力分 8 组 · 真实业务形态（多分组、多节点类型、大小按重要度）",
  nodes: sanguoNodes.map((n) => ({
    id: n.id,
    label: n.id,
    group: n.data.cluster,
    type: n.data.type === "person" ? "circle" : n.data.type,
    size: n.style.size ?? 40,
  })),
  edges: sanguoEdges.map((e) => ({ source: e.source, target: e.target })),
};

/* ==================== ② 小圈子（结构最清楚） ==================== */

const TEAM_NODES: Array<[string, string, string, number]> = [
  // [id, group, type, size]
  ["阿岩", "前端", "circle", 56],
  ["小柯", "前端", "circle", 40],
  ["阿岚", "前端", "circle", 38],
  ["老周", "后端", "circle", 56],
  ["阿淼", "后端", "circle", 42],
  ["小杜", "后端", "circle", 38],
  ["阿澈", "后端", "circle", 34],
  ["林工", "数据", "circle", 52],
  ["阿霓", "数据", "circle", 40],
  ["小满", "设计", "circle", 48],
  ["阿绘", "设计", "circle", 36],
  ["运维台", "平台", "rect", 44],
];

/** 12 节点的小圈子：1 个中枢 + 3 条分支，边少而清晰，便于看样式细节 */
const smallTeam: DemoDataset = {
  label: "小圈子",
  hint: "12 节点 / 4 组 · 结构最简单的样例，适合看节点样式、标签、分组轮廓与最短路径",
  nodes: TEAM_NODES.map(([id, group, type, size]) => ({ id, label: id, group, type, size })),
  edges: [
    // 中枢：老周 连所有人（自成星型，最短路径演示效果明显）
    { source: "老周", target: "阿岩" },
    { source: "老周", target: "小柯" },
    { source: "老周", target: "阿岚" },
    { source: "老周", target: "阿淼" },
    { source: "老周", target: "小杜" },
    { source: "老周", target: "阿澈" },
    { source: "老周", target: "林工" },
    { source: "老周", target: "小满" },
    { source: "老周", target: "运维台" },
    // 组内协作
    { source: "阿岩", target: "小柯" },
    { source: "阿岩", target: "阿岚" },
    { source: "阿淼", target: "小杜" },
    { source: "小杜", target: "阿澈" },
    { source: "林工", target: "阿霓" },
    { source: "林工", target: "阿淼" },
    { source: "小满", target: "阿绘" },
    { source: "小满", target: "阿岩" },
    { source: "运维台", target: "阿澈" },
  ],
};

/* ==================== ③ 压力测试（大图） ==================== */

/**
 * 造一份大图：按「组 × 成员」铺开，组内连成链再各挂一条到组中枢。
 *
 * <p>规模取 400 节点 / 800 边左右 —— 这个量级足以暴露力导向布局的耗时、
 * 小地图的重绘开销与悬浮/选中高亮的重算成本，又不会让低配机器直接卡死
 * 到无法观察。节点 id 用「组号-序号」，保证确定性（每次生成结果一致），
 * 便于对比不同布局在同一份数据上的表现。</p>
 */
function makeStress(): DemoDataset {
  const GROUPS = 20;
  const PER_GROUP = 20;
  const nodes: DemoNode[] = [];
  const edges: DemoEdge[] = [];

  for (let g = 0; g < GROUPS; g++) {
    const groupName = `G${String(g + 1).padStart(2, "0")}`;
    for (let i = 0; i < PER_GROUP; i++) {
      nodes.push({
        id: `${groupName}-${i + 1}`,
        label: `${g + 1}-${i + 1}`,
        group: groupName,
        type: "circle",
        // 每组第 1 个当中枢，画得大一点，便于看出组的锚点
        size: i === 0 ? 40 : 22,
      });
      // 组内成链：20 个节点 -> 19 条边
      if (i > 0) {
        edges.push({ source: `${groupName}-${i}`, target: `${groupName}-${i + 1}` });
      }
      // 其余节点各挂一条到本组中枢：再多 19 条边
      if (i > 1) {
        edges.push({ source: `${groupName}-1`, target: `${groupName}-${i + 1}` });
      }
    }
    // 组间：相邻两组的中枢相连，形成一条贯穿全部组的骨架
    if (g > 0) {
      const prev = `G${String(g).padStart(2, "0")}-1`;
      edges.push({ source: prev, target: `${groupName}-1` });
    }
  }

  return {
    label: "压力测试",
    hint: `${nodes.length} 节点 / ${edges.length} 边 · 用于验证大图下布局耗时、小地图与交互是否卡顿`,
    nodes,
    edges,
  };
}

const stress = makeStress();

/* ==================== 导出 ==================== */

/** 全部示例数据集（顺序即分段按钮顺序，首项为默认） */
export const relationGraphDatasets: DemoDataset[] = [sanguo, smallTeam, stress];

/** 默认数据集（三国势力） */
export const defaultDataset = relationGraphDatasets[0];

/** 按 label 取数据集（找不到时回落默认） */
export const datasetByLabel = (label: string): DemoDataset =>
  relationGraphDatasets.find((d) => d.label === label) ?? defaultDataset;

/**
 * 兼容旧引用：原先导出的 relationGraphData() 返回默认数据。
 *
 * @deprecated 改用 {@link defaultDataset} 或 {@link relationGraphDatasets}
 */
export const relationGraphData = () => ({
  nodes: defaultDataset.nodes,
  edges: defaultDataset.edges,
});
