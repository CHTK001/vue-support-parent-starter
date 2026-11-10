<template>
  <!--
    会话「执行轨迹」面板（右上角 Timeline 按钮打开）。

    2026-11 版式：面板里是两个页签。
      1. 上下文窗口（默认）：回答「这次请求到底把哪些内容塞进了上下文、占了多少」，
         数据来自 /token-stats 快照 + 会话消息，见 ContextWindowPanel.vue。
      2. 执行轨迹：原有的甘特图 + 明细，数据来自 /traces。

    为什么不做成「删掉甘特、只留上下文」：两者看的是同一轮执行的两种维度 ——
    甘特看时间都花在哪，上下文看 token 都花在哪。合成一个页签会互相挤占，
    所以用页签并列，默认打开先看更常被问的上下文占用。
  -->
  <div class="trace-panel">
    <nav class="tp-tabs" role="tablist" aria-label="执行轨迹视图">
      <button
        type="button"
        role="tab"
        class="tp-tab"
        :class="{ 'is-active': tab === 'context' }"
        :aria-selected="tab === 'context'"
        @click="tab = 'context'"
      >上下文窗口</button>
      <button
        type="button"
        role="tab"
        class="tp-tab"
        :class="{ 'is-active': tab === 'trace' }"
        :aria-selected="tab === 'trace'"
        @click="tab = 'trace'"
      >
        执行轨迹
        <em v-if="model.callCount">{{ model.callCount }}</em>
      </button>
    </nav>

    <ContextWindowPanel
      v-if="tab === 'context'"
      :session-id="props.sessionId"
      @close="emit('close')"
    />

    <template v-else>
      <TraceToolbar
        v-model="toggles"
        :total-ms="model.totalMs"
        :turn-count="model.turnCount"
        :call-count="model.callCount"
        :loading="showLoading"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiService } from "@/services/ApiService";
import TraceToolbar from "./TraceToolbar.vue";
import TraceGantt from "./TraceGantt.vue";
import TraceDetailList from "./TraceDetailList.vue";
import ContextWindowPanel from "./ContextWindowPanel.vue";
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
const emit = defineEmits<{ close: [] }>();

/** 默认落在上下文窗口：用户打开这个面板，多数时候是在问「上下文怎么又满了」 */
const tab = ref<"context" | "trace">("context");

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

/**
 * 轨迹懒加载：面板默认开在「上下文窗口」页签，切到轨迹页签才真正请求 /traces。
 * 这是有意的 —— /traces 在未接入轨迹回调的 Agent 上是空表，先拉一次只是多一个
 * 请求和一次「暂无执行轨迹」的空态闪烁。
 */
let traceLoaded = false;

/**
 * 刷新反馈的最短可见时长（与 ContextWindowPanel 一致）。
 *
 * /traces 在本机常在几十毫秒内返回，工具条刷新图标的置灰一闪而过，用户以为点了没反应。
 * 这里只把「显示中的加载态」延长到 400ms，不额外发请求、不影响 loading 的既有语义
 * （空态判断仍用真实 loading，避免把「加载中…」也拖长）。
 */
const MIN_LOADING_MS = 400;
const loadingFloor = ref(false);
const showLoading = computed(() => loading.value || loadingFloor.value);
let floorTimer: ReturnType<typeof setTimeout> | null = null;

function holdLoadingFloor() {
  if (floorTimer) clearTimeout(floorTimer);
  loadingFloor.value = true;
  floorTimer = setTimeout(() => {
    loadingFloor.value = false;
    floorTimer = null;
  }, MIN_LOADING_MS);
}

onBeforeUnmount(() => {
  if (floorTimer) clearTimeout(floorTimer);
});

async function load() {
  holdLoadingFloor();
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
    traceLoaded = true;
  } catch (e) {
    // 失败要显性说出来：空白面板会被误读成「这次运行没有轨迹」
    error.value = e instanceof Error ? e.message : String(e);
    items.value = [];
    loaded.value = true;
  } finally {
    loading.value = false;
    loaded.value = true;
  }
}

watch(
  () => tab.value,
  (next) => {
    if (next === "trace" && !traceLoaded && !loading.value) void load();
  },
);

// 会话变了要重新取：轨迹和上下文用量都是按会话的
watch(
  () => props.sessionId,
  () => {
    traceLoaded = false;
    items.value = [];
    runIndex.value = 0;
    loaded.value = false;
    if (tab.value === "trace") void load();
  },
);

onMounted(() => {
  if (tab.value === "trace") void load();
});
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

/* 页签条：与面板内其它控件同字号，靠下边线压住内容区 */
.tp-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex: 0 0 auto;
}

.tp-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.tp-tab:hover {
  background: var(--el-fill-color-light);
}
.tp-tab.is-active {
  color: var(--el-color-primary);
  background: var(--el-fill-color-lighter);
  border-color: var(--el-border-color-lighter);
  font-weight: 600;
}
.tp-tab em {
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
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
  color: var(--el-text-color-secondary);
}

.state-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.trace-state-error .state-title {
  color: var(--el-color-danger);
}
</style>
