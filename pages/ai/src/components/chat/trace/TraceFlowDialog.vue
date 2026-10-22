<template>
  <!--
    底部状态条上的「链路追踪」弹框。

    为什么是弹框而不是像顶部那样开侧栏：底部条是常驻的，
    点它多半是「刚这一轮怎么走的、慢在哪」，看完就关；弹框不会挤掉消息列宽度，
    也避免和已经在右侧打开的「执行轨迹」面板抢同一个位置。
  -->
  <ReDialog
    :model-value="modelValue"
    title="链路追踪"
    width="860px"
    top="8vh"
    append-to-body
    destroy-on-close
    class="trace-flow-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="tfd-header">
        <span class="tfd-title">链路追踪</span>
        <!-- 数据来源：实时（WS 帧还在推）或历史（后端落库） -->
        <span class="tfd-live" :class="{ 'is-live': isLive }" :title="isLive ? '正在根据 WS 实时帧渲染' : '来自后端落库的历史轨迹'">
          {{ isLive ? '实时' : '历史' }}
        </span>
        <!-- 轨迹按会话累积、以 agent_start 切成多段：默认看最近一次，可往回翻 -->
        <div v-if="runs.length > 1" class="tfd-runs">
          <button type="button" class="tfd-run-btn" :disabled="runIndex >= runs.length - 1"
            aria-label="上一段运行" @click="pickRun(runIndex + 1)">‹ 上一段</button>
          <span class="tfd-run-idx">{{ runs.length - runIndex }} / {{ runs.length }}</span>
          <button type="button" class="tfd-run-btn" :disabled="runIndex <= 0"
            aria-label="下一段运行" @click="pickRun(runIndex - 1)">下一段 ›</button>
        </div>
      </div>
    </template>

    <div class="tfd-body" v-loading="loading">
      <el-alert v-if="error" type="error" :closable="false" show-icon
        :title="'读取执行轨迹失败：' + error" />
      <template v-else>
        <!--
          type="flow" → 走 ReChart 内置的 G6 资金流引擎（复刻官方 fund-flow 示例），
          数据由 buildTraceFlowTree 把 TraceModel 转成树后喂给 :data。
          相比旧的逐行手写关系图：节点可伸缩拖拽、可折叠，同一信息换一种画法。
        -->
        <ReChart
          v-if="model && !model.empty"
          type="flow"
          :data="flowTree"
          height="100%"
          :indent="260"
        />
        <p v-else-if="loaded" class="tfd-empty">
          这个会话还没有执行轨迹。轨迹是后端在每次 Agent 运行时记的，跑过一轮后才会出现。
        </p>
      </template>
    </div>

    <template #footer>
      <el-button size="small" :loading="loading" @click="load">刷新</el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReChart from '@repo/ui/re-chart'
import ReDialog from '@repo/ui/re-dialog'
import { apiService } from '@/services/ApiService'
import {
  buildTraceModel,
  groupTraceRuns,
  type SessionTrace,
  type TraceModel,
  type TraceRun,
} from './traceTypes'
import { buildTraceFlowTree } from './traceFlowTree'

const props = defineProps<{
  modelValue: boolean
  sessionId?: string | number | null
  /**
   * WS 实时轨迹（来自当前会话消息里的 traceLog）。
   *
   * <p>为什么要这条输入：`/traces` 是**落库后**的历史数据，一轮跑完才查得到；
   * 而用户点开链路追踪时，常常正想看「这一轮现在走到哪一步了」。
   * 把实时帧一起并进来，同一张图就同时具备「实时生长」与「历史回放」两种能力 ——
   * 不必写两套渲染。</p>
   */
  liveTraces?: SessionTrace[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

/** 后端落库的历史轨迹 */
const history = ref<SessionTrace[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref('')

/**
 * 历史 + 实时合并。
 *
 * 去重键带上 kind/spanId/时间/序号：实时帧与落库行是**同一条事件**的两种来源，
 * 不合并的话同一轮会画两遍。历史优先（更权威），实时只补历史里还没有的尾部。
 */
const merged = computed<SessionTrace[]>(() => {
  const key = (t: SessionTrace) => `${t.kind}|${t.spanId ?? ''}|${t.eventTime}|${t.seq ?? 0}`
  const map = new Map<string, SessionTrace>()
  for (const t of history.value) map.set(key(t), t)
  for (const t of props.liveTraces ?? []) {
    if (!map.has(key(t))) map.set(key(t), t)
  }
  return [...map.values()]
})

/** 是否还在「实时」阶段：实时里有比历史最新一条更晚的事件 */
const isLive = computed(() => {
  const live = props.liveTraces ?? []
  if (!live.length) return false
  const histMax = history.value.reduce((m, t) => Math.max(m, t.eventTime ?? 0), 0)
  return live.some((t) => (t.eventTime ?? 0) > histMax)
})

/** 按 agent_start 切段，新的在前 */
const runs = computed<TraceRun[]>(() => groupTraceRuns(merged.value))
/** 0 = 最近一次运行 */
const runIndex = ref(0)
const selectedRun = computed<TraceRun | undefined>(() => runs.value[runIndex.value])
const model = computed<TraceModel>(() => buildTraceModel(selectedRun.value?.items ?? []))
/** TraceModel → ReChart flow 树（根 → 轮次 → 步骤） */
const flowTree = computed(() => (model.value.empty ? null : buildTraceFlowTree(model.value)))

function pickRun(index: number) {
  runIndex.value = Math.min(Math.max(index, 0), Math.max(0, runs.value.length - 1))
}

/**
 * 读轨迹。
 *
 * 每次打开都重新拉：用户点这个按钮通常就是想看「刚刚那一轮」，
 * 用缓存会出现「刚跑完却看不到新步骤」的假象。
 */
async function load() {
  if (!props.sessionId) {
    history.value = []
    loaded.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await apiService.fetchSessionTraces(String(props.sessionId))
    history.value = Array.isArray(res?.items) ? res.items : []
    runIndex.value = 0
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    history.value = []
  } finally {
    loading.value = false
    loaded.value = true
  }
}

// 只在真正打开时拉，关着的时候不做无用请求
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loaded.value = false
      void load()
    }
  },
)

watch(() => props.sessionId, () => {
  if (props.modelValue) void load()
})
</script>

<style scoped>
.tfd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 28px;
}

.tfd-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 来源标记：实时=绿色呼吸点，历史=灰底 */
.tfd-live {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.tfd-live.is-live {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.tfd-live.is-live::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--el-color-success);
  animation: tfd-blink 1.2s ease-in-out infinite;
}

@keyframes tfd-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

@media (prefers-reduced-motion: reduce) {
  .tfd-live.is-live::before {
    animation: none;
  }
}

.tfd-runs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tfd-run-btn {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.tfd-run-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tfd-run-idx {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.tfd-body {
  height: 62vh;
  min-height: 220px;
  overflow: hidden;
  padding: 4px 2px;
}

/* 流线图容器：占满 tfd-body，内层 G6 画布按 100% 撑高 */
.tfd-body :deep(.re-chart__body) {
  height: 100%;
}

.tfd-empty {
  margin: 24px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
