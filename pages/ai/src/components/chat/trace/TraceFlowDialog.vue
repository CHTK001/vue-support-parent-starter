<template>
  <!--
    底部状态条上的「链路追踪」弹框。

    为什么是弹框而不是像顶部那样开侧栏：底部条是常驻的，
    点它多半是「刚这一轮怎么走的、慢在哪」，看完就关；弹框不会挤掉消息列宽度，
    也避免和已经在右侧打开的「执行轨迹」面板抢同一个位置。
  -->
  <el-dialog
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
        <TraceFlowGraph v-if="model && !model.empty" :model="model" />
        <p v-else-if="loaded" class="tfd-empty">
          这个会话还没有执行轨迹。轨迹是后端在每次 Agent 运行时记的，跑过一轮后才会出现。
        </p>
      </template>
    </div>

    <template #footer>
      <el-button size="small" :loading="loading" @click="load">刷新</el-button>
      <el-button size="small" type="primary" @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { apiService } from '@/services/ApiService'
import TraceFlowGraph from './TraceFlowGraph.vue'
import {
  buildTraceModel,
  groupTraceRuns,
  type SessionTrace,
  type TraceModel,
  type TraceRun,
} from './traceTypes'

const props = defineProps<{
  modelValue: boolean
  sessionId?: string | number | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const items = ref<SessionTrace[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref('')

/** 按 agent_start 切段，新的在前 */
const runs = computed<TraceRun[]>(() => groupTraceRuns(items.value))
/** 0 = 最近一次运行 */
const runIndex = ref(0)
const selectedRun = computed<TraceRun | undefined>(() => runs.value[runIndex.value])
const model = computed<TraceModel>(() => buildTraceModel(selectedRun.value?.items ?? []))

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
    items.value = []
    loaded.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await apiService.fetchSessionTraces(String(props.sessionId))
    items.value = Array.isArray(res?.items) ? res.items : []
    runIndex.value = 0
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    items.value = []
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
  min-height: 220px;
  max-height: 62vh;
  overflow: auto;
  padding: 4px 2px;
}

.tfd-empty {
  margin: 24px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
