<template>
  <!--
    链路追踪「关系图」（不是甘特图）。

    为什么另做一张图：甘特图回答的是「每一段花了多久、谁和谁重叠」，
    读它要先理解时间轴；而用户想要的是一眼看清「这次回答到底走了哪几步」——
    启动 → 第 1 轮模型调用 → 思考 → 工具 xxx → 输出 → 第 2 轮 … → 结束。
    所以这里按**因果顺序**把节点串成链条，每行一个轮次，行内用箭头连接，
    跨行用左侧竖轨串起来，形成一张完整的关系图。

    数据全部来自既有的 TraceModel（span 已配对好、轮次已编号），不重新解析原始事件。
  -->
  <div class="tflow" role="figure" :aria-label="`链路追踪关系图，共 ${rows.length} 段`">
    <!-- 顶部：整次运行的汇总 -->
    <div class="tflow-summary">
      <span class="tflow-chip tflow-chip--start">Agent 启动</span>
      <span class="tflow-meta">{{ formatClock(model.start).slice(0, 8) }}</span>
      <span class="tflow-sep">·</span>
      <span class="tflow-meta">总时长 {{ formatDuration(model.totalMs) }}</span>
      <span class="tflow-sep">·</span>
      <span class="tflow-meta">{{ model.turnCount }} 轮</span>
      <span class="tflow-sep">·</span>
      <span class="tflow-meta">{{ model.callCount }} 次工具</span>
      <span class="tflow-chip tflow-chip--end">结束</span>
    </div>

    <p v-if="!rows.length" class="tflow-empty">本次运行没有可展示的步骤（轨迹为空）</p>

    <!-- 每一行 = 一个轮次（或模型调用之前的准备段） -->
    <div v-for="(row, i) in rows" :key="row.key" class="tflow-row">
      <div class="tflow-row-rail">
        <span class="tflow-row-dot" :class="{ 'is-first': i === 0, 'is-last': i === rows.length - 1 }" />
      </div>
      <div class="tflow-row-body">
        <div class="tflow-row-title">{{ row.title }}</div>
        <div class="tflow-chain">
          <template v-for="(node, j) in row.nodes" :key="`${row.key}-${j}`">
            <span v-if="j > 0" class="tflow-arrow" aria-hidden="true">→</span>
            <span class="tflow-node" :class="`tflow-node--${node.tone}`" :title="node.hint || node.label">
              <span class="tflow-node__label">{{ node.label }}</span>
              <span v-if="node.ms !== null && node.ms !== undefined" class="tflow-node__ms">{{ formatDuration(node.ms) }}</span>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  formatClock,
  formatDuration,
  kindLabel,
  type TraceModel,
  type TracePoint,
  type TraceSpan,
} from './traceTypes'

const props = defineProps<{ model: TraceModel }>()

/** 节点语气（只用于配色，语义来自 trace 的 kind/lane） */
type Tone = 'start' | 'turn' | 'think' | 'text' | 'tool' | 'result' | 'end'

interface FlowNode {
  label: string
  tone: Tone
  ms?: number | null
  hint?: string
}

interface FlowRow {
  key: string
  title: string
  nodes: FlowNode[]
}

/**
 * 一个 span 归一成一个节点。
 *
 * 时长沿用模型里已算好的值：未闭合的区间是 null，这里照样留空 ——
 * 推一个数字出来比空着更容易误导（与 traceTypes 的口径一致）。
 */
function toNode(span: TraceSpan): FlowNode {
  if (span.lane === 'tool') {
    /*
     * 工具链路的三种 kind 必须分开标：
     * tool_call=发起、tool_args=入参、tool_result=结果。
     * 原先 args 也被算成「结果」，实测一次 execute 调用在图上是
     * 「工具 execute → 结果 execute → 结果 execute」——两个「结果」纯属自造歧义。
     */
    const prefix = span.kind === 'tool_result' ? '结果' : span.kind === 'tool_args' ? '入参' : '工具'
    return {
      label: span.toolName ? `${prefix} ${span.toolName}` : kindLabel(span.kind),
      tone: span.kind === 'tool_result' ? 'result' : 'tool',
      ms: span.durationMs,
      hint: span.texts?.[0]?.slice(0, 200),
    }
  }
  if (span.kind === 'thinking') {
    return { label: '深度思考', tone: 'think', ms: span.durationMs, hint: span.texts?.[0]?.slice(0, 200) }
  }
  if (span.kind === 'text') {
    return { label: '助手输出', tone: 'text', ms: span.durationMs, hint: span.texts?.[0]?.slice(0, 200) }
  }
  return { label: kindLabel(span.kind), tone: 'think', ms: span.durationMs, hint: span.texts?.[0]?.slice(0, 200) }
}

/**
 * 一个**点事件**归一成节点。
 *
 * 为什么必须把它并进来：轨迹表里有些步骤只有点事件、没有 span 区间
 * （例如部分 text / tool_call），只画 spans 会漏步骤 —— 实测某次运行
 * 只画出 1 个「模型调用」节点，图看着像断了，实际上记了别的步骤。
 *
 * usage / hint / edge 不进图：用量已在顶部汇总里，hint/edge 是内部提示，
 * 摆在链路上只会让人以为它们是"一步一步"里的步骤。
 */
function pointToNode(point: TracePoint): FlowNode | null {
  if (point.kind === 'usage' || point.kind === 'hint' || point.kind === 'edge') return null
  if (point.kind === 'tool_call' || point.kind === 'tool_args' || point.kind === 'tool_result') {
    // 与 toNode 同一口径：发起 / 入参 / 结果三态分开，别把 args 也叫「结果」
    const prefix = point.kind === 'tool_result' ? '结果' : point.kind === 'tool_args' ? '入参' : '工具'
    return {
      label: point.toolName ? `${prefix} ${point.toolName}` : kindLabel(point.kind),
      tone: point.kind === 'tool_result' ? 'result' : 'tool',
      hint: point.text?.slice(0, 200),
    }
  }
  if (point.kind === 'thinking') return { label: '深度思考', tone: 'think', hint: point.text?.slice(0, 200) }
  if (point.kind === 'text') return { label: '助手输出', tone: 'text', hint: point.text?.slice(0, 200) }
  return { label: kindLabel(point.kind), tone: 'think', hint: point.text?.slice(0, 200) }
}

/**
 * 把 span 与点事件按时间合并，串成「每轮一行」的关系图。
 *
 * 分行依据：模型调用（lane=model）是轮次的分界线 —— 一次条带就是一轮里的一次模型交互，
 * 同一轮的思考/工具/输出都挂在这一行；第一条模型调用之前的步骤归到「准备」行，不丢弃。
 */
const rows = computed<FlowRow[]>(() => {
  interface FlowItem {
    time: number
    isTurn: boolean
    turnNo: number | null
    spanId: string
    node: FlowNode
  }

  const items: FlowItem[] = []
  for (const span of props.model.spans) {
    items.push({
      time: span.start,
      isTurn: span.lane === 'model',
      turnNo: span.turn ?? null,
      spanId: span.spanId,
      node: toNode(span),
    })
  }
  for (const point of props.model.points) {
    // Agent 起止已在顶部汇总条里表达，重复画会把每段都包一层
    if (point.kind === 'agent_start' || point.kind === 'agent_end') continue
    const node = pointToNode(point)
    if (!node) continue
    items.push({
      time: point.time,
      isTurn: false,
      turnNo: null,
      spanId: `pt-${point.seq}-${point.time}`,
      node,
    })
  }
  items.sort((a, b) => a.time - b.time)

  const out: FlowRow[] = []
  let current: FlowRow | null = null
  let turnSeq = 0
  for (const item of items) {
    if (item.isTurn) {
      turnSeq += 1
      current = {
        key: `turn-${item.turnNo ?? turnSeq}-${item.spanId}`,
        title: `第 ${item.turnNo ?? turnSeq} 轮 · 模型调用`,
        nodes: [item.node],
      }
      out.push(current)
      continue
    }
    if (!current) {
      current = { key: 'prep', title: '准备', nodes: [] }
      out.push(current)
    }
    current.nodes.push(item.node)
  }

  // 某一行只有模型调用、后面没有任何步骤时，显式标一句，避免看起来像「图断了」
  for (const row of out) {
    if (!row.nodes.length) row.nodes.push({ label: '（无步骤）', tone: 'think' })
  }
  return out
})
</script>

<style scoped>
.tflow {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.tflow-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.tflow-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tflow-sep {
  color: var(--el-text-color-placeholder);
}

.tflow-chip {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.tflow-chip--start {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.tflow-chip--end {
  margin-left: auto;
  color: var(--el-color-info);
  background: color-mix(in srgb, var(--el-color-info) 12%, transparent);
}

.tflow-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

/* 左侧竖轨：把各行串成一条链路，读起来是「一张图」而不是一堆列表 */
.tflow-row-rail {
  position: relative;
  flex: 0 0 12px;
  display: flex;
  justify-content: center;
}

.tflow-row-rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--el-border-color);
}

.tflow-row:first-child .tflow-row-rail::before {
  top: 10px;
}

.tflow-row:last-child .tflow-row-rail::before {
  bottom: calc(100% - 10px);
}

.tflow-row-dot {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  margin-top: 5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--el-bg-color);
  border: 2px solid var(--el-color-primary);
}

.tflow-row-dot.is-first {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
}

.tflow-row-body {
  flex: 1 1 auto;
  min-width: 0;
  padding-bottom: 2px;
}

.tflow-row-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}

.tflow-chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.tflow-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.tflow-node {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  max-width: 320px;
  padding: 3px 9px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  cursor: default;
}

.tflow-node__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tflow-node__ms {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* 语气配色：模型=主色、工具=橙、结果=绿、输出=默认、思考=紫 */
.tflow-node--turn {
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.tflow-node--tool {
  border-color: color-mix(in srgb, var(--el-color-warning) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}

.tflow-node--result {
  border-color: color-mix(in srgb, var(--el-color-success) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
}

.tflow-node--think {
  border-color: color-mix(in srgb, var(--el-color-info) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-info) 8%, transparent);
}

.tflow-empty {
  margin: 8px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
