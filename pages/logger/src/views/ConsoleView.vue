<script setup lang="ts">
/**
 * 实时控制台：/v2/logger/stream（原生 EventSource，event = "log" / "heartbeat"）。
 *
 * - 级别 / 应用过滤走服务端（变化时重建 EventSource 并清空旧缓冲）；
 * - 关键字为前端过滤（不重连）；
 * - 缓冲上限 MAX_BUFFER = 1000，超出丢弃最旧；
 * - 原生 EventSource 断线自动重连；重连成功后弹出「已自动重连」提示；
 * - 暂停 = 主动 close，恢复 = 重建连接；
 * - 点击行展开详情（thread / instance / mdc / stacktrace）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  LOG_LEVELS,
  clearEvents,
  fetchApps,
  normLevel,
  openLogStream,
  type LoggerEvent,
} from "../api/logger";
import { formatTs } from "../utils/format";
import LevelTag from "../components/LevelTag.vue";

/** 缓冲上限：超出丢弃最旧 */
const MAX_BUFFER = 1000;

interface BufferItem {
  seq: number;
  event: LoggerEvent;
}

const buffer = ref<BufferItem[]>([]);
const apps = ref<string[]>([]);
const levelFilter = ref<string[]>([]);
const appFilter = ref("");
const keyword = ref("");
const autoScroll = ref(true);
const paused = ref(false);
const connected = ref(false);
const clearing = ref(false);
const expandedSeq = ref<number | null>(null);
const listBody = ref<HTMLElement | null>(null);

let seq = 0;
let stopStream: (() => void) | null = null;
let hadError = false;

/** 关键字前端过滤：匹配消息 / logger / 应用 / 线程 */
const filteredItems = computed<BufferItem[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return buffer.value;
  return buffer.value.filter((item) => {
    const { message = "", logger = "", app = "", thread = "" } = item.event;
    return `${message}\n${logger}\n${app}\n${thread}`.toLowerCase().includes(kw);
  });
});

function pushEvent(event: LoggerEvent): void {
  buffer.value.push({ seq: ++seq, event });
  if (buffer.value.length > MAX_BUFFER) {
    buffer.value.splice(0, buffer.value.length - MAX_BUFFER);
  }
}

function startStream(): void {
  stopStream?.();
  stopStream = null;
  if (paused.value) return;
  stopStream = openLogStream({
    app: appFilter.value || undefined,
    level: levelFilter.value.length > 0 ? levelFilter.value : undefined,
    onEvent: pushEvent,
    onHeartbeat: () => {
      connected.value = true;
    },
    onOpen: () => {
      connected.value = true;
      if (hadError) {
        hadError = false;
        ElMessage.info("连接中断，已自动重连");
      }
    },
    onError: () => {
      hadError = true;
      connected.value = false;
    },
  });
}

/** 服务端过滤条件变化：清空旧缓冲并重建流 */
watch([levelFilter, appFilter], () => {
  buffer.value = [];
  expandedSeq.value = null;
  startStream();
});

function togglePause(): void {
  paused.value = !paused.value;
  if (paused.value) {
    stopStream?.();
    stopStream = null;
    connected.value = false;
  } else {
    startStream();
  }
}

function clearBuffer(): void {
  buffer.value = [];
  expandedSeq.value = null;
}

async function clearServerEvents(): Promise<void> {
  clearing.value = true;
  try {
    await clearEvents({ app: appFilter.value || undefined, level: levelFilter.value });
    buffer.value = [];
    expandedSeq.value = null;
    ElMessage.success("服务端日志已清除");
  } catch {
    // 错误提示由 http 层统一弹出
  } finally {
    clearing.value = false;
  }
}

/** 删除类操作：必须经确认框，点取消不动数据 */
async function confirmClearServer(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      "将删除服务端缓冲的日志事件（受当前应用/级别过滤影响），该操作不可恢复。是否继续？",
      "清空服务端日志",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return; // 用户取消
  }
  await clearServerEvents();
}

function toggleExpand(itemSeq: number): void {
  expandedSeq.value = expandedSeq.value === itemSeq ? null : itemSeq;
}

/** 新日志到达后按开关自动滚动到底部 */
watch(
  () => filteredItems.value.length,
  async () => {
    if (!autoScroll.value) return;
    await nextTick();
    const el = listBody.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
);

onMounted(async () => {
  startStream();
  try {
    const list = await fetchApps();
    apps.value = Array.from(new Set((list ?? []).map((item) => item.app || "").filter(Boolean)));
  } catch {
    // 错误提示由 http 层统一弹出
  }
});

onBeforeUnmount(() => {
  stopStream?.();
  stopStream = null;
});
</script>

<template>
  <div class="console-view logger-scope">
    <!-- 工具条：级别/应用（服务端过滤）+ 关键字（前端过滤）+ 自动滚动/暂停/清空 -->
    <div class="logger-card console-toolbar">
      <div class="toolbar-field">
        <span class="field-label">级别</span>
        <el-select
          v-model="levelFilter"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          placeholder="全部级别"
          class="field-wide"
        >
          <el-option v-for="lv in LOG_LEVELS" :key="lv" :label="lv" :value="lv" />
        </el-select>
      </div>
      <div class="toolbar-field">
        <span class="field-label">应用</span>
        <el-select v-model="appFilter" clearable filterable placeholder="全部应用" class="field-mid">
          <el-option v-for="app in apps" :key="app" :label="app" :value="app" />
        </el-select>
      </div>
      <div class="toolbar-field">
        <span class="field-label">关键字</span>
        <el-input v-model="keyword" clearable placeholder="前端过滤：消息 / logger / 线程" class="field-wide" />
      </div>
      <div class="toolbar-field toolbar-switch">
        <el-switch v-model="autoScroll" />
        <span class="field-label">自动滚动</span>
      </div>
      <div class="toolbar-actions">
        <span class="conn-state" :class="connected ? 'is-on' : 'is-off'">
          <span class="conn-dot"></span>
          {{ connected ? "实时接收中" : paused ? "已暂停" : "等待连接…" }}
        </span>
        <el-button size="small" :type="paused ? 'primary' : 'warning'" plain @click="togglePause">
          {{ paused ? "恢复接收" : "暂停接收" }}
        </el-button>
        <el-button size="small" plain @click="clearBuffer">清空缓冲</el-button>
        <el-button size="small" type="danger" plain :loading="clearing" @click="confirmClearServer">
          清空服务端
        </el-button>
      </div>
    </div>

    <!-- 日志流列表 -->
    <div class="logger-card console-panel">
      <div ref="listBody" class="log-list">
        <el-empty v-if="filteredItems.length === 0" description="暂无日志，等待推送…" :image-size="72" class="log-empty" />
        <div
          v-for="item in filteredItems"
          :key="item.seq"
          class="log-row"
          :class="[`log-row--${normLevel(item.event.level).toLowerCase()}`, { 'is-expanded': expandedSeq === item.seq }]"
          @click="toggleExpand(item.seq)"
        >
          <div class="log-line">
            <span class="log-ts">{{ formatTs(item.event.ts) }}</span>
            <LevelTag :level="item.event.level" />
            <span class="log-app">{{ item.event.app || "-" }}</span>
            <span class="log-logger" :title="item.event.logger">{{ item.event.logger || "-" }}</span>
            <span class="log-msg" :title="item.event.message">{{ item.event.message || "-" }}</span>
          </div>
          <div v-if="expandedSeq === item.seq" class="log-detail" @click.stop>
            <div class="detail-grid">
              <div class="detail-cell"><label>时间</label><span>{{ formatTs(item.event.ts, true) }}</span></div>
              <div class="detail-cell"><label>级别</label><span>{{ normLevel(item.event.level) }}</span></div>
              <div class="detail-cell"><label>应用</label><span>{{ item.event.app || "-" }}</span></div>
              <div class="detail-cell"><label>实例</label><span>{{ item.event.instance || "-" }}</span></div>
              <div class="detail-cell"><label>线程</label><span>{{ item.event.thread || "-" }}</span></div>
              <div class="detail-cell"><label>Logger</label><span>{{ item.event.logger || "-" }}</span></div>
            </div>
            <div class="detail-block">
              <label>消息</label>
              <pre>{{ item.event.message || "-" }}</pre>
            </div>
            <div v-if="item.event.stacktrace" class="detail-block">
              <label>堆栈</label>
              <pre class="detail-stack">{{ item.event.stacktrace }}</pre>
            </div>
            <div v-if="item.event.mdc && Object.keys(item.event.mdc).length > 0" class="detail-block">
              <label>MDC</label>
              <pre>{{ JSON.stringify(item.event.mdc, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
      <div class="console-footer">
        <span>前端显示 {{ filteredItems.length }} 条</span>
        <span>缓冲 {{ buffer.length }} / {{ MAX_BUFFER }}（超出丢弃最旧）</span>
        <span>点击行可展开详情</span>
      </div>
    </div>
  </div>
</template>
