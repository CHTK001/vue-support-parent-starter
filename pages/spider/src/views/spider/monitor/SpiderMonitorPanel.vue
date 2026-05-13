<template>
  <!-- Summary Bar -->
  <div class="spider-monitor__bar">
    <div class="bar-item bar-item--cyan">
      <span class="bar-item__num">{{ animDefs }}</span>
      <span class="bar-item__lbl">定义</span>
    </div>
    <div class="bar-item bar-item--orange">
      <span class="bar-item__num">{{ animRunning }}</span>
      <span class="bar-item__lbl">运行中</span>
    </div>
    <div class="bar-item bar-item--green">
      <span class="bar-item__num">{{ animSuccess }}</span>
      <span class="bar-item__lbl">已完成</span>
    </div>
    <div class="bar-item bar-item--red">
      <span class="bar-item__num">{{ animFailed }}</span>
      <span class="bar-item__lbl">失败</span>
    </div>
    <div class="bar-item bar-item--dim">
      <span class="bar-item__num">{{ collectedTotal }}</span>
      <span class="bar-item__lbl">已采集</span>
    </div>
    <div class="bar-item bar-item--dim">
      <span class="bar-item__num">{{ maxPage }}</span>
      <span class="bar-item__lbl">页数</span>
    </div>
  </div>

  <!-- Timeline -->
  <div class="spider-monitor__timeline">
    <div v-if="timeline.length === 0" class="tl-empty">暂无监控数据</div>
    <div
      v-for="(item, idx) in timeline"
      :key="item.id"
      class="tl-entry"
      :class="{ 'tl-entry--new': item.isNew }"
    >
      <div class="tl-dot" :class="'tl-dot--' + item.statusClass" />
      <div v-if="idx < timeline.length - 1" class="tl-line" />
      <div class="tl-card">
        <div class="tl-card__head">
          <span class="tl-time">{{ item.time }}</span>
          <span class="tl-badge" :class="'tl-badge--' + item.statusClass">{{ item.statusLabel }}</span>
          <span class="tl-page">第 {{ item.pageNum }} 页</span>
        </div>
        <div class="tl-card__body">
          <div class="tl-row">
            <span class="tl-label">目标 URL</span>
            <span class="tl-url" :title="item.url">{{ item.url }}</span>
          </div>
          <div class="tl-row" v-if="item.payload.urlCount !== undefined">
            <span class="tl-label">本页采集</span>
            <span class="tl-val">{{ item.payload.urlCount }} 个 URL</span>
          </div>
          <div class="tl-row">
            <span class="tl-label">累计采集</span>
            <span class="tl-val tl-val--accent">{{ item.accumulated }} 个项目</span>
          </div>
          <div class="tl-row tl-row--context" v-if="item.context">
            <span class="tl-label">上下文</span>
            <span class="tl-val tl-val--muted">{{ item.context }}</span>
          </div>
        </div>
        <div class="tl-card__foot" v-if="item.screenshotUrl">
          <img :src="item.screenshotUrl" class="tl-screenshot" alt="页面截图" @click="previewImg = item.screenshotUrl" />
        </div>
      </div>
    </div>
  </div>

  <!-- Image Preview -->
  <Teleport to="body">
    <div v-if="previewImg" class="spider-img-preview" @click.self="previewImg = ''">
      <button class="spider-img-preview__close" @click="previewImg = ''">&times;</button>
      <img :src="previewImg" class="spider-img-preview__img" alt="截图预览" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import {
  listSpiderDefinitions,
  listSpiderExecutionRecords,
  listSpiderMonitorProgress,
  type SpiderDataRecordView,
  type SpiderDefinition,
  type SpiderExecutionRecordView,
} from "../../../api/spider";

const props = withDefaults(defineProps<{
  spiderCode: string;
  executionNo?: string;
  autoRefresh?: boolean;
}>(), {
  executionNo: "",
  autoRefresh: true,
});

const emit = defineEmits<{
  (e: "update:lastUpdate", val: string): void;
}>();

// ── Data ──
const defs = ref<SpiderDefinition[]>([]);
const execs = ref<SpiderExecutionRecordView[]>([]);
const monitors = ref<SpiderDataRecordView[]>([]);

const animDefs = ref(0);
const animRunning = ref(0);
const animSuccess = ref(0);
const animFailed = ref(0);
const previewImg = ref("");

let timer: ReturnType<typeof setInterval> | null = null;
let lastMonitorCount = 0;

// ── Computed ──
const collectedTotal = computed(() => {
  let total = 0;
  for (const m of monitors.value) {
    try {
      const p = JSON.parse(m.spiderDataPayload);
      total += p.urlCount || 0;
    } catch { /* ignore */ }
  }
  return total;
});

const maxPage = computed(() => {
  let max = 0;
  for (const m of monitors.value) {
    try {
      const p = JSON.parse(m.spiderDataPayload);
      const n = parseInt(p.pageNum) || 0;
      if (n > max) max = n;
    } catch { /* ignore */ }
  }
  return max;
});

interface TimelineItem {
  id: number | string;
  time: string;
  url: string;
  pageNum: number;
  payload: Record<string, unknown>;
  accumulated: number;
  statusClass: string;
  statusLabel: string;
  screenshotUrl: string;
  context: string;
  isNew: boolean;
}

const timeline = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = [];
  let accumulated = 0;
  const data = [...monitors.value].reverse();

  for (let i = 0; i < data.length; i++) {
    const m = data[i];
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(m.spiderDataPayload); } catch { /* ignore */ }

    const urlCount = (payload.urlCount as number) || 0;
    accumulated += urlCount;

    const pageNum = parseInt(String(payload.pageNum || "0")) || 0;
    const execStatus = String(payload.executionStatus || m.spiderDataStatus || "RUNNING");

    let statusClass = "running";
    let statusLabel = "运行中";
    if (execStatus === "SUCCESS" || execStatus === "COMPLETED") {
      statusClass = "success";
      statusLabel = "完成";
    } else if (execStatus === "FAILED") {
      statusClass = "failed";
      statusLabel = "失败";
    } else if (execStatus === "WAITING") {
      statusClass = "waiting";
      statusLabel = "等待";
    }

    let screenshotUrl = "";
    if (payload.screenshotUrl) screenshotUrl = String(payload.screenshotUrl);
    else if (payload.imageUrl) screenshotUrl = String(payload.imageUrl);

    let context = "";
    if (payload.executionContext) context = String(payload.executionContext);
    else if (payload.message) context = String(payload.message);
    else if (payload.nodeName) context = `节点: ${payload.nodeName}`;

    items.push({
      id: m.spiderId ?? i,
      time: formatTime(m.createTime),
      url: m.spiderTargetUrl || "-",
      pageNum,
      payload,
      accumulated,
      statusClass,
      statusLabel,
      screenshotUrl,
      context,
      isNew: i >= data.length - (monitors.value.length - lastMonitorCount),
    });
  }

  return items.reverse();
});

// ── Helpers ──
function formatTime(t?: string) {
  if (!t) return "-";
  try { return new Date(t).toLocaleTimeString(); } catch { return t; }
}

function animate(el: Ref<number>, target: number) {
  const from = el.value;
  if (from === target) return;
  const dur = 600;
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min((now - start) / dur, 1);
    el.value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Load Data ──
async function loadData() {
  try {
    const [definitions, records, progress] = await Promise.all([
      listSpiderDefinitions().catch(() => [] as SpiderDefinition[]),
      listSpiderExecutionRecords(props.spiderCode, 50).catch(() => [] as SpiderExecutionRecordView[]),
      listSpiderMonitorProgress(props.spiderCode, 50).catch(() => [] as SpiderDataRecordView[]),
    ]);
    defs.value = definitions || [];

    if (props.executionNo) {
      const allRecords = records || [];
      const allProgress = progress || [];
      execs.value = allRecords.filter((e) => e.spiderExecutionNo === props.executionNo);
      monitors.value = allProgress.filter((m) => m.spiderExecutionNo === props.executionNo);
    } else {
      execs.value = records || [];
      monitors.value = progress || [];
    }

    lastMonitorCount = monitors.value.length;

    animate(animDefs, defs.value.length);
    animate(animRunning, execs.value.filter((e) => e.spiderExecutionStatus === "RUNNING").length);
    animate(animSuccess, execs.value.filter((e) => e.spiderExecutionStatus === "SUCCESS").length);
    animate(animFailed, execs.value.filter((e) => e.spiderExecutionStatus === "FAILED").length);

    emit("update:lastUpdate", "更新: " + new Date().toLocaleTimeString());
  } catch (e) {
    emit("update:lastUpdate", "⚠️ " + String(e));
  }
}

onMounted(() => {
  loadData();
  if (props.autoRefresh) {
    timer = setInterval(loadData, 15000);
  }
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

defineExpose({ loadData, defs, execs, monitors });
</script>

<style scoped lang="scss">
/* ── Summary Bar ── */
.spider-monitor__bar {
  display: flex; gap: 1px; border-radius: 12px; overflow: hidden;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
}
.bar-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 10px 8px; gap: 2px; background: rgba(255,255,255,0.02);
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.06); }
}
.bar-item__num {
  font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.2;
  &--cyan { color: #06b6d4; }
}
.bar-item__lbl {
  font-size: 10px; color: var(--lay-text-placeholder); text-transform: uppercase; letter-spacing: 0.5px;
}
.bar-item--cyan .bar-item__num { color: #06b6d4; }
.bar-item--orange .bar-item__num { color: #ff9800; }
.bar-item--green .bar-item__num { color: #4caf50; }
.bar-item--red .bar-item__num { color: #f44336; }
.bar-item--dim .bar-item__num { color: var(--lay-text-secondary); }

/* ── Timeline ── */
.spider-monitor__timeline {
  position: relative; padding: 16px 0;
}
.tl-empty {
  text-align: center; padding: 40px; color: var(--lay-text-placeholder); font-size: 13px;
}
.tl-entry {
  position: relative; padding-left: 28px; padding-bottom: 16px;
  transition: opacity 0.3s;
}
.tl-entry--new { animation: tl-fade-in 0.5s ease-out; }
@keyframes tl-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.tl-dot {
  position: absolute; left: 0; top: 6px; width: 12px; height: 12px;
  border-radius: 50%; border: 2px solid; z-index: 1;
  background: var(--lay-bg);
  &--running { border-color: #ff9800; }
  &--success { border-color: #4caf50; }
  &--failed { border-color: #f44336; }
  &--waiting { border-color: #888; }
}
.tl-line {
  position: absolute; left: 5px; top: 18px; bottom: 0; width: 2px;
  background: rgba(255,255,255,0.06);
}
.tl-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; overflow: hidden; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
}
.tl-card__head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 11px;
}
.tl-time { color: var(--lay-text-placeholder); font-variant-numeric: tabular-nums; }
.tl-badge {
  padding: 1px 8px; border-radius: 8px; font-size: 10px; font-weight: 600;
  &--running { background: rgba(255,152,0,0.12); color: #ff9800; }
  &--success { background: rgba(76,175,80,0.12); color: #4caf50; }
  &--failed { background: rgba(244,67,54,0.12); color: #f44336; }
  &--waiting { background: rgba(136,136,136,0.1); color: #888; }
}
.tl-page { margin-left: auto; color: var(--lay-text-secondary); font-weight: 600; }
.tl-card__body { padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
.tl-row {
  display: flex; align-items: baseline; gap: 8px; font-size: 12px;
}
.tl-row--context { margin-top: 4px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.04); }
.tl-label {
  flex-shrink: 0; width: 64px; color: var(--lay-text-placeholder); font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.tl-url {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--lay-accent); font-size: 11px;
}
.tl-val { color: var(--lay-text-primary); font-weight: 500; }
.tl-val--accent { color: #06b6d4; }
.tl-val--muted { color: var(--lay-text-secondary); font-size: 11px; }
.tl-card__foot {
  border-top: 1px solid rgba(255,255,255,0.04); padding: 8px 12px;
}
.tl-screenshot {
  width: 100%; max-height: 200px; object-fit: contain; border-radius: 6px;
  cursor: pointer; transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
}

/* ── Image Preview ── */
.spider-img-preview {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center;
}
.spider-img-preview__close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.1); color: #fff; font-size: 24px; cursor: pointer;
}
.spider-img-preview__img {
  max-width: 90vw; max-height: 90vh; border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}

@media (max-width: 640px) {
  .spider-monitor__bar { flex-wrap: wrap; }
  .bar-item { min-width: 33%; }
}
</style>
