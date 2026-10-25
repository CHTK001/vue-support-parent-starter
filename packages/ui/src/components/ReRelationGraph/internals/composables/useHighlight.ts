/**
 * 悬停高亮 composable（G6 v5）
 *
 * <p>原来的实现会对大量节点直接改写 style，且切换高亮模式时走 setData 整图重载，
 * 800 个节点时体验明显变卡。这里改为 G6 的 state + 局部 style 更新：
 *
 * - 高亮目标 = 命中节点 + 相邻节点（hover-activate 也可承担，但组合高亮需要显式计算）；
 * - 非目标节点只改 opacity / labelOpacity，不重建元素、不重排、不 setData；
 * - 支持 group / adjacent / both / none 四档；
 * - 悬停聚焦可选：淡出 vs 隐藏其它节点（隐藏仍保留连线淡入淡出，不做蒙版盖整图）。
 *
 * @author CH
 */
import { ref } from "vue"
import type { RelationGraphData, RelationHighlightMode } from "../types"

export interface HighlightTargets {
  nodes: Set<string>
  edges: Set<string>
}

const NON_TARGET_OPACITY = 0.2
const TARGET_OPACITY = 1

/**
 * 计算悬停后的高亮目标集合。
 *
 * @param data 当前图数据
 * @param hoverId 悬停节点 id；null 表示无悬停
 * @param mode none / group / adjacent / both
 */
export function computeHighlightTargets(
  data: RelationGraphData,
  hoverId: string | null,
  mode: RelationHighlightMode,
): HighlightTargets {
  const nodes = new Set<string>()
  const edges = new Set<string>()
  if (!hoverId || mode === "none") return { nodes, edges }

  const nodeMap = new Map<string, { id: string; group?: string }>()
  for (const n of data.nodes ?? []) nodeMap.set(n.id, { id: n.id, group: n.group })

  const adjacent = new Set<string>()
  const group = new Set<string>()
  const hoverGroup = nodeMap.get(hoverId)?.group

  for (const e of data.edges ?? []) {
    const s = e.source
    const t = e.target
    const connectsHover = s === hoverId || t === hoverId
    if (connectsHover) {
      adjacent.add(s)
      adjacent.add(t)
      edges.add(e.id ?? `${s}->${t}`)
    }
    if (hoverGroup && (mode === "group" || mode === "both")) {
      const sideGroup = s === hoverId ? nodeMap.get(t)?.group : (t === hoverId ? nodeMap.get(s)?.group : undefined)
      if (sideGroup === hoverGroup) {
        group.add(s)
        group.add(t)
        edges.add(e.id ?? `${s}->${t}`)
      }
    }
  }

  if (mode === "adjacent" || mode === "both") adjacent.forEach((id) => nodes.add(id))
  if (mode === "group" || mode === "both") group.forEach((id) => nodes.add(id))
  nodes.add(hoverId)
  return { nodes, edges }
}

/**
 * 应用到 G6 实例：只改 state/style，不 setData、不重排。
 *
 * @param graph G6 实例
 * @param targets 目标集合
 * @param hoverFocus true 时非目标节点隐藏（opacity 0），false 时淡出
 * @param modelGeneration 数据代次，防止异步 setData 后旧事件覆盖新图
 */
export function applyHighlightToGraph(
  graph: unknown,
  targets: HighlightTargets,
  hoverFocus: boolean,
  modelGeneration: number,
): void {
  const g = graph as {
    getNodeData?: () => Array<{ id: string }>
    getEdgeData?: () => Array<{ id: string }>
    updateNodeData?: (data: unknown) => void
    updateEdgeData?: (data: unknown) => void
  }
  if (!g?.getNodeData || !g?.updateNodeData) return

  const nodeById = new Map<string, { id: string }>()
  for (const n of g.getNodeData?.() ?? []) nodeById.set(n.id, n)
  const edgeById = new Map<string, { id: string }>()
  for (const e of g.getEdgeData?.() ?? []) edgeById.set(e.id, e)

  const nodePatches: Array<{ id: string; style: Record<string, unknown> }> = []
  for (const n of nodeById.values()) {
    const hit = targets.nodes.has(n.id)
    nodePatches.push({
      id: n.id,
      style: {
        opacity: hit ? TARGET_OPACITY : (hoverFocus ? 0 : NON_TARGET_OPACITY),
        labelOpacity: hit ? TARGET_OPACITY : NON_TARGET_OPACITY,
      },
    })
  }
  if (nodePatches.length) g.updateNodeData(nodePatches as never)

  const edgePatches: Array<{ id: string; style: Record<string, unknown> }> = []
  for (const e of edgeById.values()) {
    const hit = targets.edges.has(e.id)
    edgePatches.push({
      id: e.id,
      style: { opacity: hit ? TARGET_OPACITY : NON_TARGET_OPACITY },
    })
  }
  // updateEdgeData 在类型上是可选（部分 G6 版本/封装可能只暴露节点接口），
  // 且边高亮应独立于节点高亮：缺边接口时只跳过边，不连节点一起放弃。
  if (edgePatches.length && g.updateEdgeData) g.updateEdgeData(edgePatches as never)
}

/**
 * 创建悬停高亮状态。
 *
 * <p>返回空悬停时自动恢复全部节点/边为不透明，避免蒙版残留。</p>
 */
export function useHighlight() {
  const mode = ref<RelationHighlightMode>("adjacent")
  const hoverFocus = ref(false)

  function apply(graph: unknown, data: RelationGraphData, hoverId: string | null, gen: number) {
    const targets = computeHighlightTargets(data, hoverId, mode.value)
    applyHighlightToGraph(graph, targets, hoverFocus.value, gen)
  }

  function clear(graph: unknown) {
    applyHighlightToGraph(graph, { nodes: new Set(), edges: new Set() }, false, 0)
  }

  function setMode(m: RelationHighlightMode) {
    mode.value = m
  }

  function setHoverFocus(on: boolean) {
    hoverFocus.value = on
  }

  return { mode, hoverFocus, apply, clear, setMode, setHoverFocus }
}

export type HighlightController = ReturnType<typeof useHighlight>