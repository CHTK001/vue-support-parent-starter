<!-- 实时日志：tail -f 式全屏日志流。
     数据来源为整站唯一 WS/SSE 通道的 log 事件（useRealtimeLog），
     不再自建 EventSource，也不做定时轮询。 -->
<template>
  <div class="view rt-log-page">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <i class="dot" :class="active ? 'on' : 'off'" aria-hidden="true" />
        <template v-if="active">接收中</template>
        <template v-else>已暂停</template>
        · 已收 {{ receivedCount.toLocaleString() }} 条 · 显示 {{ visibleItems.length }} 条
        <template v-if="filterLevel"> · 仅 {{ filterLevel }}</template>
      </span>
      <div class="view-bar__actions">
        <el-select v-model="filterLevel" size="small" class="lvl-select" placeholder="全部级别" clearable>
          <el-option v-for="lv in LEVELS" :key="lv" :label="lv" :value="lv" />
        </el-select>
        <el-switch v-model="follow" size="small" active-text="自动滚动" />
        <el-button size="small" round :type="active ? 'warning' : 'primary'" @click="toggle">
          {{ active ? "暂停" : "继续" }}
        </el-button>
        <el-button size="small" round @click="clear">清空</el-button>
      </div>
    </div>

    <!-- 日志流本体 -->
    <div class="panel rt-log-panel">
      <div class="panel-head">
        <span>实时日志流</span>
        <span class="panel-sub">
          最新在最下方 · 单页最多保留 {{ MAX_ITEMS }} 条 · 来源 = 服务端 log 事件
        </span>
      </div>

      <div ref="bodyRef" class="rt-log-body">
        <div v-if="!visibleItems.length" class="rt-empty">
          <div class="rt-empty-title">暂无实时日志</div>
          <div class="rt-empty-desc">
            实时通道已连接时，服务端产生日志会立即出现在这里。<br />
            若无日志推送，可到「日志」页查看已落库的历史记录。
          </div>
        </div>

        <div
          v-for="(log, i) in visibleItems"
          :key="`${log.timestamp}-${i}`"
          class="rt-line"
          :class="`rt-line--${levelClass(log.level)}`"
        >
          <span class="rt-time mono">{{ shortTime(log.timestamp) }}</span>
          <span class="rt-lvl" :class="`rt-lvl--${levelClass(log.level)}`">{{ log.level || "INFO" }}</span>
          <span v-if="log.logger" class="rt-logger mono">{{ log.logger }}</span>
          <span class="rt-msg">{{ log.message }}</span>
          <span v-if="log.traceId" class="rt-trace mono">{{ shortId(String(log.traceId)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRealtimeLog } from "../composables/useRealtime";

const LEVELS = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
const MAX_ITEMS = 500;

const { active, items, receivedCount, start, stop, toggle, clear } = useRealtimeLog({
  maxItems: MAX_ITEMS,
});

/** 级别过滤（空 = 全部） */
const filterLevel = ref("");
/** 自动滚动到底部 */
const follow = ref(true);
const bodyRef = ref<HTMLElement | null>(null);

/** 时间正序（tail 语义：最新在最后一行） */
const visibleItems = computed(() => {
  const lv = filterLevel.value.trim().toUpperCase();
  const list = [...items.value].reverse();
  return lv ? list.filter((l) => String(l.level || "").toUpperCase() === lv) : list;
});

/** 级别 → CSS 类名 */
function levelClass(level: string | undefined): string {
  switch (String(level || "").toUpperCase()) {
    case "ERROR":
    case "FATAL":
      return "error";
    case "WARN":
    case "WARNING":
      return "warn";
    case "DEBUG":
    case "TRACE":
      return "debug";
    default:
      return "info";
  }
}

function shortTime(ts: string | number | undefined): string {
  if (ts == null || ts === "") return "—";
  const d = new Date(ts as string | number);
  if (Number.isNaN(d.getTime())) return String(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function shortId(id: string): string {
  return id ? id.slice(0, 10) : "—";
}

/** 新日志到达且开启跟随时，滚到底部 */
watch(
  () => visibleItems.value.length,
  async () => {
    if (!follow.value) return;
    await nextTick();
    const el = bodyRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
);

onMounted(() => {
  start();
});
</script>

<style scoped>
/* 骨架（.view / .view-bar / .panel / .panel-head / .panel-sub / .mono / .muted）
   由 styles/layout.css 提供，此处只留本页独有部分。 */

.lvl-select {
  width: 118px;
}

/* 状态点：接收中脉动，暂停时熄灭 */
.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  margin-right: 5px;
  vertical-align: 1px;
}

.dot.on {
  background: var(--status-success, var(--apm-success));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-success, var(--apm-success)) 22%, transparent);
}

.dot.off {
  background: var(--text-tertiary, var(--apm-muted));
}

.rt-log-panel {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

/* 日志流：等宽字体、行高紧凑，纵向可滚，横向不换行靠省略 */
.rt-log-body {
  flex: 1;
  min-height: 360px;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--apm-space-2) var(--apm-space-3);
  font-family: var(--apm-font-mono);
  font-size: 12px;
  line-height: 1.75;
}

.rt-line {
  display: flex;
  align-items: baseline;
  gap: var(--apm-space-2);
  padding: 1px 4px;
  border-radius: var(--apm-radius-sm);
}

.rt-line:hover {
  background: var(--bg-hover, var(--apm-panel-active));
}

.rt-line--error {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 7%, transparent);
}

.rt-line--warn {
  background: color-mix(in srgb, var(--status-warning, var(--apm-warning)) 6%, transparent);
}

.rt-time {
  flex-shrink: 0;
  color: var(--text-tertiary, var(--apm-muted));
  font-size: 11px;
}

.rt-lvl {
  flex-shrink: 0;
  width: 46px;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 999px;
  padding: 0 5px;
}

.rt-lvl--error { color: var(--status-error, var(--apm-danger)); background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 12%, transparent); }
.rt-lvl--warn { color: var(--status-warning, var(--apm-warning)); background: color-mix(in srgb, var(--status-warning, var(--apm-warning)) 12%, transparent); }
.rt-lvl--info { color: var(--brand-500, var(--apm-accent)); background: color-mix(in srgb, var(--brand-500, var(--apm-accent)) 10%, transparent); }
.rt-lvl--debug { color: var(--text-tertiary, var(--apm-muted)); background: var(--bg-fill, var(--apm-panel-raised)); }

.rt-logger {
  flex-shrink: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-tertiary, var(--apm-muted));
}

.rt-msg {
  flex: 1;
  min-width: 0;
  color: var(--text-primary, var(--apm-fg));
  white-space: pre-wrap;
  word-break: break-word;
}

.rt-line--error .rt-msg {
  color: var(--status-error, var(--apm-danger));
}

.rt-trace {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-tertiary, var(--apm-muted));
}

.rt-empty {
  padding: var(--apm-space-6) var(--apm-space-4);
  text-align: center;
}

.rt-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, var(--apm-fg-regular));
  margin-bottom: 6px;
}

.rt-empty-desc {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-tertiary, var(--apm-muted));
  font-family: var(--apm-font-sans);
}

@media (max-width: 900px) {
  .rt-logger {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot.on {
    box-shadow: none;
  }
}
</style>
