<template>
  <el-tooltip placement="bottom" :show-after="200">
    <template #content>
      <div class="koi-alerts__tip">
        <div class="koi-alerts__tip-title">{{ titleText }}</div>
        <ul v-if="topAlerts.length" class="koi-alerts__list">
          <li
            v-for="alert in topAlerts"
            :key="alert.id"
            class="koi-alerts__row"
            :class="`is-${alert.severity.toLowerCase()}`"
          >
            <span class="koi-alerts__row-msg">{{ alert.message }}</span>
            <span class="koi-alerts__row-time">{{ clockOf(alert.ts) }}</span>
          </li>
        </ul>
        <div v-else class="koi-alerts__empty">{{ t("header.alerts.empty") }}</div>
      </div>
    </template>
    <div
      class="koi-alerts"
      :class="[`is-${tone}`, { 'is-clickable': !!to }]"
      :role="to ? 'button' : 'img'"
      :tabindex="to ? 0 : -1"
      :aria-label="titleText"
      @click="go"
      @keydown.enter.prevent="go"
      @keydown.space.prevent="go"
    >
      <el-icon :size="17"><Bell /></el-icon>
      <span v-if="count > 0" class="koi-alerts__badge">{{ displayCount }}</span>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
/**
 * 顶栏告警角标（APM 未处置告警数）
 *
 * <p>只统计 OPEN（及后端未给 status 的历史数据）：ACKNOWLEDGED / MUTED / IGNORED
 * 都不该继续红着，否则角标会变成"永远有数"的噪音源。</p>
 *
 * <p>仅在 app.yaml `other.toolbar.items` 显式列出 `alerts` 时渲染
 * （见 headerItems.ts 的 HEADER_EXTRA_ITEMS）。不登记 BACKEND_CAPABILITIES：
 * 这条靠 yaml 显式启用即代表"本应用后端有 APM"，没必要再给所有应用加一次启动探测。</p>
 *
 * <p>options：
 * <ul>
 *   <li>{@code limit}：拉取条数，默认 50</li>
 *   <li>{@code intervalMs}：轮询间隔，默认 60000，下限 15000</li>
 *   <li>{@code to}：点击跳转的路由（如 /hotspot/alerts）；不填则纯展示</li>
 * </ul></p>
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { Bell } from "@element-plus/icons-vue";
import { getApmAlerts, summarizeAlerts, type ApmAlert } from "@repo/core";

const props = defineProps<{
  /** 来自 app.yaml items[].options */
  options?: Record<string, unknown>;
}>();

const { t } = useI18n();
const router = useRouter();

/** 拉取条数 */
const limit = computed(() => {
  const n = Number(props.options?.limit ?? 50);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 50;
});

/** 轮询间隔：下限 15s，避免把后端打成性能问题 */
const intervalMs = computed(() => {
  const n = Number(props.options?.intervalMs ?? 60000);
  return Number.isFinite(n) && n >= 15000 ? n : 60000;
});

/** 点击跳转目标（可选） */
const to = computed(() => (typeof props.options?.to === "string" ? props.options.to.trim() : ""));

const alerts = ref<ApmAlert[]>([]);
let timer: ReturnType<typeof setInterval> | undefined;
/** 卸载后不再写状态：请求可能比组件活得久 */
let disposed = false;

async function refresh(): Promise<void> {
  const list = await getApmAlerts(limit.value);
  if (disposed) return;
  alerts.value = list;
}

const summary = computed(() => summarizeAlerts(alerts.value));
const count = computed(() => summary.value.open);
const displayCount = computed(() => (count.value > 99 ? "99+" : String(count.value)));

const tone = computed<"critical" | "warning" | "idle">(() => {
  if (summary.value.maxSeverity === "CRITICAL") return "critical";
  if (summary.value.maxSeverity === "WARNING") return "warning";
  return "idle";
});

/** 待处置告警（新的在后端就已经排前面） */
const openAlerts = computed(() => alerts.value.filter((a) => (a.status ?? "OPEN") === "OPEN"));
const topAlerts = computed(() => openAlerts.value.slice(0, 5));

const titleText = computed(() =>
  count.value > 0 ? t("header.alerts.open", { n: count.value }) : t("header.alerts.none"),
);

/** 时间戳 → HH:mm */
function clockOf(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function go(): void {
  if (!to.value || !router) return;
  void router.push(to.value);
}

onMounted(() => {
  void refresh();
  timer = setInterval(() => void refresh(), intervalMs.value);
});

onBeforeUnmount(() => {
  disposed = true;
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.koi-alerts {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--el-text-color-secondary);
  border-radius: var(--el-radius-md, 8px);
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &.is-clickable {
    cursor: pointer;
  }

  &.is-clickable:hover {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
  }

  &.is-warning {
    color: var(--el-color-warning);
  }

  &.is-critical {
    color: var(--el-color-danger);
  }

  &.is-clickable:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  }
}

.koi-alerts__badge {
  position: absolute;
  top: 1px;
  right: 0;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  color: var(--el-color-white);
  text-align: center;
  background: var(--el-color-danger);
  border-radius: 8px;
}

.is-warning .koi-alerts__badge {
  background: var(--el-color-warning);
}

.is-critical .koi-alerts__badge {
  background: var(--el-color-danger);
}

.koi-alerts__tip {
  max-width: 320px;
  font-size: 12px;
}

.koi-alerts__tip-title {
  margin-bottom: 4px;
  font-weight: 600;
}

.koi-alerts__list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.koi-alerts__row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  padding: 2px 0;
}

.koi-alerts__row-msg {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.koi-alerts__row.is-critical .koi-alerts__row-msg {
  color: var(--el-color-danger);
}

.koi-alerts__row-time {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

.koi-alerts__empty {
  opacity: 0.75;
}

/* 动效降级 */
@media (prefers-reduced-motion: reduce) {
  .koi-alerts {
    transition: none;
  }
}
</style>
