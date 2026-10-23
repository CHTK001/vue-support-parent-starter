/**
 * traceFlowTree —— 把 TraceModel（链路追踪视图模型）转成 ReChart `type="flow"` 树。
 *
 * <p>用途：底部状态条的「链路追踪」按钮点开后，用 ReChart 的 G6 资金流引擎
 * 渲染这次运行的步骤关系图（而不再用旧的逐行手写图）。G6 引擎期望的是
 * {@link ReChartFlowNode} 树结构：根 → 轮次 → 步骤，节点可着色、可折叠。</p>
 *
 * <p>这一步只做「视图模型 → 树」的映射，不复解析原始轨迹：TraceModel 已经把
 * span 配对、轮次编号都做好了，这里沿用它的 lane/kind/时长的语义，与
 * 旧实现 TraceFlowGraph 保持同口径（工具三态的「工具/入参/结果」前缀、思考/输出
 * 文案等），目标是同样的信息，只是换一种画法。</p>
 */
import type { ReChartFlowNode } from '@repo/ui/re-chart'
import { formatDuration, kindLabel, type TraceModel, type TracePoint, type TraceSpan } from './traceTypes'

/** 节点语气 → G6 状态色 key（对应 treeNode 的 FLOW_STATUS_COLORS 调色板） */
type FlowStatus = 'G' | 'B' | 'Y' | 'R' | 'DI'

/** 工具三态的前缀：**只在这里定义一次**，命名与配对编号都引用它 */
const TOOL_PREFIX = { tool_call: '工具', tool_args: '入参', tool_result: '结果' } as const

/**
 * 节点 → 时长（毫秒）。
 *
 * <p>为什么用 WeakMap 而不是往节点上挂字段：节点对象会交给 ReChart/G6 的布局引擎，
 * 多塞自定义字段等于把别人的内部结构当公共契约用。时长只需要在"编号之后"贴到显示名上，
 * 用一张旁表记着最省事，也不会被引擎序列化出去。</p>
 *
 * <p>点事件没有区间、因此没有时长，这里只装 span 的 durationMs ——
 * 缺就是缺，不推算（与 traceTypes 的时长口径一致）。</p>
 */
const nodeDuration = new WeakMap<ReChartFlowNode, number>()

/**
 * 给节点名补时长后缀。
 *
 * <p>必须在配对编号**之后**调用：先 `工具 execute #1` 再补 `· 814ms`；
 * 反过来会变成 `工具 execute · 814ms #1`，编号被挤到时长后面，扫一眼找不到第几次调用。</p>
 */
function appendDuration(nodes: ReChartFlowNode[]): ReChartFlowNode[] {
  for (const n of nodes) {
    const ms = nodeDuration.get(n)
    if (ms !== undefined && ms !== null) {
      n.name = `${n.name} · ${formatDuration(ms)}`
    }
  }
  return nodes
}

/**
 * 单个 span → 流线节点。
 * 与前身 TraceFlowGraph.toNode 同口径：工具三态分开、思考/文本有文案、带时长。
 *
 * <p><b>工具节点必须和点事件同一种命名</b>（`工具 xxx` / `入参 xxx` / `结果 xxx`）。
 * 原先 span 路径只写 `toolName`（显示成 `execute`），点事件路径写成 `工具 execute` ——
 * 两套名字混在一张图里，配对编号是按前缀认的，于是调用节点永远拿不到 #N
 * （实测：三个调用没有编号，入参/结果却从 #1 开始），读者根本对不上。</p>
 *
 * <p><b>时长</b>：span 有区间就有 durationMs，登记进 nodeDuration，由 appendDuration 统一贴到
 * 名字末尾（工具/思考/输出都贴）。用户报障「工具调用用时缺少」就是这里原来整个丢掉了时长。</p>
 */
function spanToFlowNode(span: TraceSpan): ReChartFlowNode {
  let node: ReChartFlowNode

  if (span.lane === 'tool') {
    const prefix = TOOL_PREFIX[(span.kind as keyof typeof TOOL_PREFIX)] ?? TOOL_PREFIX.tool_call
    node = {
      id: span.spanId,
      name: `${prefix} ${span.toolName || kindLabel(span.kind)}`,
      label: span.texts?.[0]?.slice(0, 200),
      status: span.kind === 'tool_result' ? 'R' : 'Y',
    }
  } else {
    const base: Pick<ReChartFlowNode, 'id' | 'name' | 'status'> =
      span.kind === 'thinking'
        ? { id: span.spanId, name: '深度思考', status: 'DI' }
        : span.kind === 'text'
          ? { id: span.spanId, name: '助手输出', status: 'G' }
          : { id: span.spanId, name: kindLabel(span.kind), status: 'B' }
    node = { ...base, label: span.texts?.[0]?.slice(0, 200) || kindLabel(span.kind), name: base.name as string }
  }

  if (span.durationMs !== null && span.durationMs !== undefined) {
    nodeDuration.set(node, span.durationMs)
  }
  return node
}

/**
 * 点事件 → 流线节点；usage/hint/edge/agent 起止不进本图（与旧实现一致）。
 */
function pointToFlowNode(point: TracePoint): ReChartFlowNode | null {
  if (point.kind === 'usage' || point.kind === 'hint' || point.kind === 'edge') return null
  if (point.kind === 'agent_start' || point.kind === 'agent_end') return null

  const key = `pt-${point.seq}-${point.time}`
  if (point.kind === 'tool_call' || point.kind === 'tool_args' || point.kind === 'tool_result') {
    const prefix = TOOL_PREFIX[(point.kind as keyof typeof TOOL_PREFIX)] ?? TOOL_PREFIX.tool_call
    return {
      id: key,
      name: point.toolName ? `${prefix} ${point.toolName}` : kindLabel(point.kind),
      label: point.text?.slice(0, 200),
      status: point.kind === 'tool_result' ? ('R' as FlowStatus) : ('Y' as FlowStatus),
    }
  }
  if (point.kind === 'thinking') {
    return { id: key, name: '深度思考', label: point.text?.slice(0, 200), status: 'DI' }
  }
  if (point.kind === 'text') {
    return { id: key, name: '助手输出', label: point.text?.slice(0, 200), status: 'G' }
  }
  return { id: key, name: kindLabel(point.kind), label: point.text?.slice(0, 200), status: 'B' }
}

/**
 * 同轮内按次配对工具调用，与 TraceFlowGraph.groupToolCalls 同一套启发式规则。
 *
 * <p>轨迹表没有「这条入参属于哪次调用」的字段，只能按**同轮内的出现次序**配对：
 * 第 i 次调用 ↔ 第 i 条入参 ↔ 第 i 条结果。三类数量相等时才把三联排到一起
 * （G6 树里子节点顺序就是数组顺序），数量对不上就只编号、不搬位置 ——
 * 宁可看起来乱一点，也不编造归属。</p>
 */
function relabelToolSeq(items: ReChartFlowNode[]): ReChartFlowNode[] {
  const pick = (n: ReChartFlowNode) => {
    const s = n.name || ''
    if (s.startsWith(TOOL_PREFIX.tool_call)) return 'call'
    if (s.startsWith(TOOL_PREFIX.tool_args)) return 'args'
    if (s.startsWith(TOOL_PREFIX.tool_result)) return 'result'
    return null
  }
  const calls = items.filter((n) => pick(n) === 'call')
  const args = items.filter((n) => pick(n) === 'args')
  const results = items.filter((n) => pick(n) === 'result')

  calls.forEach((n, i) => { n.name = `${n.name} #${i + 1}` })
  args.forEach((n, i) => { n.name = `${n.name} #${i + 1}` })
  results.forEach((n, i) => { n.name = `${n.name} #${i + 1}` })

  if (!calls.length || args.length !== calls.length || results.length !== calls.length) {
    return items
  }
  const firstToolIdx = items.findIndex((n) => pick(n) !== null)
  const before = items.slice(0, firstToolIdx).filter((n) => pick(n) === null)
  const after = items.slice(firstToolIdx).filter((n) => pick(n) === null)
  const triplets: ReChartFlowNode[] = []
  for (let i = 0; i < calls.length; i += 1) {
    triplets.push(calls[i], args[i], results[i])
  }
  return [...before, ...triplets, ...after]
}

/** 占位 + 工具配对编号 + 时长后缀（顺序不能换：先编号，再补时长） */
function decorateRow(nodes: ReChartFlowNode[], rowKey: string): ReChartFlowNode[] {
  if (!nodes.length) {
    return [{ id: `${rowKey}-none`, name: '（无步骤）', status: 'DI' }]
  }
  return appendDuration(relabelToolSeq(nodes))
}

/**
 * 把 TraceModel 转成 ReChart `type="flow"` 的树（根 → 轮次 → 步骤）。
 *
 * 模型调用（lane=model）是轮次分界：每条模型调用开一行，同一轮的思考/工具/输出
 * 挂在该行下；第一条模型调用之前的步骤归到「准备」行。与 TraceFlowGraph.rows
 * 的分行规则一致，只是编码成树而非列表。
 */
export function buildTraceFlowTree(model: TraceModel): ReChartFlowNode {
  interface RowItem {
    key: string
    title: string
    nodes: ReChartFlowNode[]
  }

  const rows: RowItem[] = []
  let current: RowItem | null = null
  let turnSeq = 0

  // 按时间把 span 和点合并排序
  const flow: Array<{ time: number; node: ReChartFlowNode; isTurn: boolean; turnNo: number | null; spanId: string }> = []
  for (const span of model.spans) {
    flow.push({ time: span.start, node: spanToFlowNode(span), isTurn: span.lane === 'model', turnNo: span.turn ?? null, spanId: span.spanId })
  }
  for (const point of model.points) {
    const node = pointToFlowNode(point)
    if (!node) continue
    flow.push({ time: point.time, node, isTurn: false, turnNo: null, spanId: node.id })
  }
  flow.sort((a, b) => a.time - b.time)

  for (const it of flow) {
    if (it.isTurn) {
      turnSeq += 1
      current = {
        key: `turn-${it.turnNo ?? turnSeq}-${it.spanId}`,
        title: `第 ${it.turnNo ?? turnSeq} 轮 · 模型调用`,
        nodes: [it.node],
      }
      rows.push(current)
      continue
    }
    if (!current) {
      current = { key: 'prep', title: '准备', nodes: [] }
      rows.push(current)
    }
    current.nodes.push(it.node)
  }

  const children: ReChartFlowNode[] = rows.map((row, i) => {
    const stepNodes = decorateRow(row.nodes, row.key)
    return {
      id: row.key,
      name: row.title,
      status: i === 0 ? ('G' as FlowStatus) : ('B' as FlowStatus),
      label: `${stepNodes.length} 步 · ${formatDuration(model.totalMs)}`,
      children: stepNodes,
    }
  })

  return {
    id: 'root',
    name: 'Agent 运行',
    status: 'B',
    label: `${model.turnCount} 轮 · ${model.callCount} 次工具 · 总 ${formatDuration(model.totalMs)}`,
    children,
  }
}