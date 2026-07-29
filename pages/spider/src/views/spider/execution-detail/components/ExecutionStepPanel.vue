<template>
  <div class="exec-steps">
    <div class="exec-steps__header">
      <span class="exec-steps__title">步骤事件时间线</span>
      <span class="exec-steps__count">{{ events.length }} 条事件</span>
    </div>
    <div v-if="events.length === 0" class="exec-steps__empty">暂无事件数据</div>
    <div v-else class="exec-steps__list">
      <div
        v-for="(evt, idx) in sortedEvents"
        :key="idx"
        class="exec-steps__item"
        :class="{ 'exec-steps__item--new': idx < 3 }"
      >
        <div class="exec-steps__dot" :class="'exec-steps__dot--' + eventTypeClass(evt.spiderEventType)" />
        <div v-if="idx < sortedEvents.length - 1" class="exec-steps__line" />
        <div class="exec-steps__card" @click="toggleExpand(evt)">
          <div class="exec-steps__head">
            <span class="exec-steps__badge" :class="'exec-steps__badge--' + eventTypeClass(evt.spiderEventType)">
              {{ evt.spiderEventType }}
            </span>
            <span class="exec-steps__node-name">{{ evt.spiderNodeName }}</span>
            <span class="exec-steps__time">{{ formatTime(evt.spiderEventTime) }}</span>
          </div>
          <div class="exec-steps__msg" v-if="evt.spiderMessage">{{ evt.spiderMessage }}</div>
          <DebugDataViewer v-if="expanded.has(evt)" label="事件数据" :data="evt" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import type { SpiderExecutionEventView } from "../../../../types/orchestration";
import DebugDataViewer from "./DebugDataViewer.vue";

const props = defineProps<{
  events: SpiderExecutionEventView[];
}>();

const expanded = reactive(new Set<SpiderExecutionEventView>());

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => {
    const ta = a.spiderEventTime || "";
    const tb = b.spiderEventTime || "";
    return ta.localeCompare(tb);
  });
});

function eventTypeClass(type: string): string {
  if (!type) return "info";
  const t = type.toUpperCase();
  if (t.includes("ERROR") || t.includes("FAIL")) return "error";
  if (t.includes("SUCCESS") || t.includes("COMPLETE")) return "success";
  if (t.includes("START") || t.includes("BEGIN")) return "start";
  if (t.includes("MANUAL") || t.includes("HUMAN")) return "manual";
  if (t.includes("AI") || t.includes("DECISION") || t.includes("BROWSER")) return "ai";
  return "info";
}

function formatTime(t?: string): string {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleTimeString();
  } catch {
    return t;
  }
}

function toggleExpand(evt: SpiderExecutionEventView) {
  if (expanded.has(evt)) expanded.delete(evt);
  else expanded.add(evt);
}
</script>

<style scoped>
.exec-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exec-steps__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.exec-steps__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.exec-steps__count {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.exec-steps__empty {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.exec-steps__list {
  position: relative;
  padding: 8px 0;
}
.exec-steps__item {
  position: relative;
  padding-left: 28px;
  padding-bottom: 12px;
  transition: opacity 0.3s;
}
.exec-steps__item--new {
  animation: fade-in 0.4s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.exec-steps__dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid;
  background: var(--el-bg-color);
  z-index: 1;
}
.exec-steps__dot--info { border-color: var(--el-color-info); }
.exec-steps__dot--start { border-color: var(--el-color-success); }
.exec-steps__dot--success { border-color: var(--el-color-success); }
.exec-steps__dot--error { border-color: var(--el-color-danger); }
.exec-steps__dot--manual { border-color: var(--el-color-warning); }
.exec-steps__dot--ai { border-color: var(--el-color-info); }
.exec-steps__line {
  position: absolute;
  left: 4px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.05);
}
.exec-steps__card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.exec-steps__card:hover {
  border-color: rgba(34,211,238,0.15);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.exec-steps__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.exec-steps__badge {
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.exec-steps__badge--info { background: rgba(99,102,241,0.12); color: var(--el-color-info); }
.exec-steps__badge--start { background: rgba(34,197,94,0.12); color: var(--el-color-success-light-3); }
.exec-steps__badge--success { background: rgba(76,175,80,0.12); color: var(--el-color-success); }
.exec-steps__badge--error { background: rgba(244,67,54,0.12); color: var(--el-color-danger); }
.exec-steps__badge--manual { background: rgba(255,152,0,0.12); color: var(--el-color-warning); }
.exec-steps__badge--ai { background: rgba(34,211,238,0.12); color: var(--el-color-info); }
.exec-steps__node-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.exec-steps__time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.exec-steps__msg {
  margin-top: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
</style>
