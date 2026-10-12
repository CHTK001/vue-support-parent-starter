<template>
  <!--
    会话执行轨迹面板：会话顶部的「轨迹」页签内容。

    数据来自 GET /v2/sessions/{id}/traces（后端 sys_ai_session_trace 表），
    由 Agent 执行时异步写入。空态要区分「这次运行没产生轨迹」和「加载失败」——
    两者对使用者的含义完全不同，不能都显示成空白。
  -->
  <div class="trace-panel">
    <TraceToolbar
      v-model="toggles"
      :total-ms="model.totalMs"
      :turn-count="model.turnCount"
      :call-count="model.callCount"
      :loading="loading"
      :run-index="runIndex"
      :run-count="runs.length"
      :run-title="runTitle"
      @pick-run="pickRun"
      @refresh="load"
    />

    <div v-if="error" class="trace-state trace-state-error">
      <p class="state-title">轨迹加载失败</p>
      <p class="state-desc">{{ error }}</p>
      <button class="state-action" type="button" @click="load">重试</button>
    </div>

    <div v-else-if="loading && !loaded" class="trace-state">加载中…</div>

    <div v-else-if="model.empty" class="trace-state">
      <p class="state-title">暂无执行轨迹</p>
      <p class="state-desc">
        轨迹在 Agent 执行过程中异步写入。若本次对话还没产生轨迹，或所用 Agent
        未接入轨迹回调，这里会是空的。
      </p>
    </div>

    <div v-else class="trace-body">
      <!--
        甘特图在上、明细在下，同一滚动区里一次看全。
        曾做成「甘特图 / 明细」两个页签，但两者看的是同一批事件、互相是上下文：
        切到明细就失去时间轴，切回甘特图又不知道那根横条具体发生了什么。
        并排堆叠后，横条与下面那一行明细一一对得上。
      -->
      <div class="trace-scroll">
        <TraceGantt
          :spans="model.spans"
          :points="model.points"
          :start="model.start"
          :total-ms="model.totalMs"
          :show-duration="toggles.showDuration"
          :show-turn="toggles.showTurn"
          :show-calls="toggles.showCalls"
        />
        <TraceDetailList :model="model" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { apiService } from "@/services/ApiService";
import TraceToolbar from "./TraceToolbar.vue";
import TraceGantt from "./TraceGantt.vue";
import TraceDetailList from "./TraceDetailList.vue";
import {
  buildTraceModel,
  formatClock,
  groupTraceRuns,
  type SessionTrace,
  type TraceModel,
  type TraceRun,
} from "./traceTypes";

type ToggleKey = "showDuration" | "showTurn" | "showCalls";

const props = defineProps<{ sessionId: string | number }>();

const items = ref<SessionTrace[]>([]);
const loading = ref(false);
const loaded = ref(false);
const error = ref("");
const toggles = ref<Record<ToggleKey, boolean>>({
  showDuration: true,
  showTurn: true,
  showCalls: true,
});

/** 轨迹表按会话累积，按 agent_start 切成若干次运行，新的在前 */
const runs = computed<TraceRun[]>(() => groupTraceRuns(items.value));

/** 选中的运行下标，0 = 最近一次 */
const runIndex = ref(0);
const selectedRun = computed<TraceRun | undefined>(() => runs.value[runIndex.value]);

const model = computed<TraceModel>(() => buildTraceModel(selectedRun.value?.items ?? []));

function pickRun(index: number) {
  runIndex.value = Math.min(Math.max(index, 0), Math.max(0, runs.value.length - 1));
}

const runTitle = computed(() => {
  const run = selectedRun.value;
  return run ? formatClock(run.start).slice(0, 8) : "";
});

async function load() {
  if (!props.sessionId) {
    items.value = [];
    runIndex.value = 0;
    loaded.value = true;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const res = await apiService.fetchSessionTraces(String(props.sessionId));
    items.value = Array.isArray(res?.items) ? res.items : [];
    // 重新加载后回到最近一次运行：刷新多半是为了看刚刚发生的那轮
    runIndex.value = 0;
  } catch (e) {
    // 失败要显性说出来：空白面板会被误读成「这次运行没有轨迹」
    error.value = e instanceof Error ? e.message : String(e);
    items.value = [];
  } finally {
    loading.value = false;
    loaded.value = true;
  }
}

onMounted(load);
watch(() => props.sessionId, load);
</script>

<style scoped>
.trace-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  /* 原写死 #fff：轨迹面板收编进右栏 rail（重设计 2026-10-12）后会出现在暗色下，
     改用主题底色令牌，明暗自动跟随 */
  background: var(--el-bg-color);
}

.trace-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.trace-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.trace-state {
  padding: 40px 24px;
  text-align: center;
  color: #6b7280;
}

.state-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.state-desc {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.7;
  max-width: 420px;
  margin-inline: auto;
}

.state-action {
  padding: 4px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.trace-state-error .state-title {
  color: #b91c1c;
}
</style>
