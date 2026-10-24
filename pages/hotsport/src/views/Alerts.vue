<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">告警中心</span>
        <ReTag :type="criticalCount ? 'danger' : 'success'" round>
          {{ criticalCount ? `${criticalCount} 个 CRITICAL` : "全部正常" }}
        </ReTag>
        <span class="match-hint" v-if="!loading">最近 {{ items.length }} 条事件 · 10s 自动刷新</span>
      </div>
      <div class="toolbar-right">
        <ReSelect v-model="severityFilter" :options="severityOptions" placeholder="严重级别" clearable class="sev-filter" />
        <ReSelect v-model="statusFilter" :options="statusOptions" placeholder="状态" clearable class="sev-filter" />
        <ReButton icon="SetUp" show-text round @click="openRules">规则管理</ReButton>
        <ReButton icon="BellFilled" show-text round @click="openChannels">通知渠道</ReButton>
        <ReButton icon="Refresh" show-text round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <ReStatCard
        size="compact"
        title="总告警数"
        :value="items.length"
        :desc="`最近 ${windowLabel} 事件`"
        :icon="Bell"
        icon-color="var(--apm-accent)"
      />
      <ReStatCard
        size="compact"
        title="CRITICAL"
        :value="criticalCount"
        :desc="criticalCount ? '存在严重告警' : '无严重告警'"
        :icon="Warning"
        :icon-color="criticalCount ? 'var(--apm-danger)' : 'var(--apm-success)'"
      />
      <ReStatCard
        size="compact"
        title="WARNING"
        :value="warningCount"
        :desc="warningCount ? '存在预警事件' : '无预警事件'"
        :icon="Warning"
        :icon-color="warningCount ? 'var(--apm-warning)' : 'var(--apm-success)'"
      />
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <div class="table-panel" v-else-if="filteredItems.length">
      <ReTab v-model="view" :tabs="tabItems" class="alert-tabs">
        <template #table>
          <ReTable
            :data="filteredItems as unknown as Record<string, unknown>[]"
            :columns="tableColumns"
            :loading="loading"
            :layout-table="{ minHeight: 260 }"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-ts="{ row }">
              <span class="muted mono">{{ formatTime(row.ts) }}</span>
            </template>
            <template #col-metric="{ row }">
              <span class="mono metric-text">{{ (row as unknown as ApmAlert).metric }}</span>
              <ReTag
                v-if="(row as unknown as ApmAlert).severity === 'CRITICAL'"
                type="danger"

                round
                class="critical-flag"
              >
                CRITICAL
              </ReTag>
            </template>
            <template #col-current="{ row }">
              <span class="mono">{{ (row as unknown as ApmAlert).current }}</span>
            </template>
            <template #col-threshold="{ row }">
              <span class="mono muted">{{ (row as unknown as ApmAlert).threshold }}</span>
            </template>
            <template #col-severity="{ row }">
              <ReTag :type="sevTag((row as unknown as ApmAlert).severity)" round>
                {{ (row as unknown as ApmAlert).severity }}
              </ReTag>
            </template>
            <template #col-status="{ row }">
              <ReTag :type="statusTag((row as unknown as ApmAlert).status)" round>
                {{ (row as unknown as ApmAlert).status || 'OPEN' }}
              </ReTag>
            </template>
            <template #col-message="{ row }">
              <span class="msg-text">{{ (row as unknown as ApmAlert).message }}</span>
            </template>
            <template #col-actions="{ row }">
              <el-dropdown trigger="click" v-if="(row as unknown as ApmAlert).status !== 'ACKNOWLEDGED'">
                <el-button text type="primary">处置</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleAction(row, 'acknowledge')">确认</el-dropdown-item>
                    <el-dropdown-item @click="handleAction(row, 'mute')">静默</el-dropdown-item>
                    <el-dropdown-item @click="handleAction(row, 'ignore')">忽略</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <span v-else class="mono muted">已确认</span>
            </template>
          </ReTable>
        </template>
        <template #timeline>
          <div class="timeline-wrap">
            <ReTimeline :items="timelineItems" :size="'small'">
              <template #description="{ item }">
                <p class="timeline-desc">
                  {{ item.description }}
                  <span class="mono muted timeline-values" v-if="timelineMeta(item)">
                    · 当前 {{ timelineMeta(item)!.current }} / 阈值 {{ timelineMeta(item)!.threshold }}
                  </span>
                </p>
              </template>
            </ReTimeline>
          </div>
        </template>
      </ReTab>
    </div>

    <div class="table-panel" v-else>
      <ReEmpty description="暂无告警事件，系统健康" />
    </div>

    <!-- 规则管理抽屉 -->
    <ReDrawer v-model="rulesVisible" title="告警规则管理" size="560px" direction="rtl">
      <div class="rule-form">
        <ReInput v-model="newRule.metric" placeholder="指标名（如 heap_percent / error_rate / active_leaks）" class="grow" />
        <ReInputNumber v-model="newRule.threshold" placeholder="阈值" class="grow" :min="0" />
        <ReSelect v-model="newRule.severity" :data="severityOptions" placeholder="级别" class="grow" />
        <ReInputNumber v-model="newRule.debounceMs" placeholder="去抖(ms)" class="grow" :min="0" />
        <el-button type="primary" :icon="Plus" show-text :loading="addingRule" @click="addRule" text>新增规则</el-button>
      </div>
      <div class="rule-list">
        <div v-for="r in rules" :key="r.metric" class="rule-item">
          <div class="rule-info">
            <div class="rule-metric mono">{{ r.metric }}</div>
            <div class="rule-threshold">
              <ReTag :type="r.enabled ? 'success' : 'info'" round>
                {{ r.enabled ? "启用" : "停用" }}
              </ReTag>
              <span class="mono muted">阈值 {{ r.threshold }} · {{ r.severity }} · 去抖 {{ r.debounceMs }}ms</span>
            </div>
          </div>
          <div class="rule-actions">
            <ReButton text type="primary" @click="toggleRule(r)">{{ r.enabled ? "停用" : "启用" }}</ReButton>
            <ReButton text type="danger" @click="deleteRule(r)">删除</ReButton>
          </div>
        </div>
        <ReEmpty v-if="!rules.length" description="暂无自定义规则" />
      </div>
    </ReDrawer>

    <!-- 通知渠道抽屉 -->
    <ReDrawer v-model="channelsVisible" title="通知渠道配置" size="560px" direction="rtl">
      <div class="channel-form">
        <div class="channel-type-row">
          <ReSelect v-model="newChannel.type" placeholder="渠道类型" class="type-select">
            <el-option label="邮件 (Email)" value="email" />
            <el-option label="钉钉 (DingTalk)" value="dingtalk" />
            <el-option label="飞书 (Feishu)" value="feishu" />
            <el-option label="自定义 Webhook" value="webhook" />
          </ReSelect>
          <ReInput v-model="newChannel.name" placeholder="渠道名称，如：值班群" class="grow" />
        </div>
        <ReInput v-model="newChannel.webhookUrl" placeholder="Webhook URL 或邮箱地址" class="grow" />
        <el-button type="primary" :icon="Plus" show-text @click="addChannel" text>添加渠道</el-button>
      </div>
      <div class="channel-list">
        <div v-for="ch in channels" :key="ch.id" class="channel-item">
          <div class="channel-info">
            <div class="channel-name">
              <el-tag size="small" round>{{ ch.type }}</el-tag>
              <span class="mono">{{ ch.name }}</span>
            </div>
            <div class="channel-url muted">{{ ch.webhookUrl || ch.config?.url || "—" }}</div>
          </div>
          <div class="rule-actions">
            <ReButton text size="small" @click="toggleChannel(ch)">
              {{ ch.enabled ? "停用" : "启用" }}
            </ReButton>
            <ReButton text type="danger" size="small" @click="deleteChannel(ch)">删除</ReButton>
          </div>
        </div>
        <ReEmpty v-if="!channels.length" description="暂无配置的通知渠道" />
      </div>
    </ReDrawer>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Bell, BellFilled, Warning, Plus } from "@element-plus/icons-vue";

import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReEmpty from "@repo/ui/re-empty";
import ReTab from "@repo/ui/re-tab";
import ReTimeline from "@repo/ui/re-timeline";
import ReSelect from "@repo/ui/re-select";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReDrawer from "@repo/ui/re-drawer";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getAlerts, getAlertRules, addAlertRule, toggleAlertRule, deleteAlertRule, acknowledgeAlert, muteAlert, ignoreAlert } from "../api/apmApi";
import type { ApmAlert, AlertRule } from "../api/apmApi";

/** ReTimeline items（@repo/ui/re-timeline 未导出该接口，与 index.vue 中定义对齐） */
interface TimelineItem {
  id?: string | number;
  title: string;
  description?: string;
  time?: string;
  dotColor?: string;
  dotType?: "primary" | "success" | "warning" | "danger" | "info" | "hollow";
  current?: number;
  threshold?: number;
}

const items = ref<ApmAlert[]>([]);
const loading = ref(false);
const view = ref("table");
const severityFilter = ref("");
const statusFilter = ref("");
let timer: number | undefined;

const severityOptions = [
  { label: "CRITICAL", value: "CRITICAL" },
  { label: "WARNING", value: "WARNING" },
];

const statusOptions = [
  { label: "OPEN", value: "OPEN" },
  { label: "ACKNOWLEDGED", value: "ACKNOWLEDGED" },
  { label: "MUTED", value: "MUTED" },
  { label: "IGNORED", value: "IGNORED" },
];

/** 严重级别 + 状态筛选后的事件（ReTable 数据源） */
const filteredItems = computed(() => {
  let list = items.value;
  if (severityFilter.value) {
    list = list.filter((a) => a.severity === severityFilter.value);
  }
  if (statusFilter.value) {
    list = list.filter((a) => (a.status || "OPEN") === statusFilter.value);
  }
  return list;
});

/** 告警状态 tag 类型 */
function statusTag(status?: string): "success" | "warning" | "info" | "danger" {
  switch (status) {
    case "ACKNOWLEDGED": return "success";
    case "MUTED": return "warning";
    case "IGNORED": return "info";
    default: return "danger";
  }
}

const tabItems = [
  { name: "table", label: "表格视图" },
  { name: "timeline", label: "事件时间线" },
];

const criticalCount = computed(() => items.value.filter((a) => a.severity === "CRITICAL").length);
const warningCount = computed(() => items.value.filter((a) => a.severity === "WARNING").length);
const windowLabel = items.value.length ? "100 条内" : "0";

/** 时间线也应用严重级别筛选 */

const tableColumns: ReTableColumn[] = [
  { prop: "ts", label: "时间", width: 110, slot: "ts" },
  { prop: "metric", label: "指标", minWidth: 160, slot: "metric" },
  { prop: "current", label: "当前值", width: 90, align: "right", slot: "current" },
  { prop: "threshold", label: "阈值", width: 80, align: "right", slot: "threshold" },
  { prop: "severity", label: "级别", width: 90, align: "center", slot: "severity" },
  { prop: "status", label: "状态", width: 100, align: "center", slot: "status" },
  { prop: "message", label: "描述", minWidth: 200, slot: "message" },
  { prop: "actions", label: "操作", width: 90, align: "center", slot: "actions" },
];

const timelineItems = computed<TimelineItem[]>(() =>
  [...filteredItems.value]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30)
    .map((a, i) => ({
      id: i,
      title: a.metric,
      description: a.message,
      time: formatTime(a.ts),
      dotType: a.severity === "CRITICAL" ? "danger" : "warning",
      current: a.current,
      threshold: a.threshold,
    })),
);

function sevTag(sev: string): "danger" | "warning" {
  return sev === "CRITICAL" ? "danger" : "warning";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function timelineMeta(item: TimelineItem): { current: number; threshold: number } | null {
  if (item.current === undefined || item.threshold === undefined) return null;
  return { current: item.current, threshold: item.threshold };
}

async function load() {
  loading.value = true;
  try {
    items.value = await getAlerts(100);
  } catch {
    message.error("加载告警失败");
  } finally {
    loading.value = false;
  }
}

// ---- 规则管理 ----

const rulesVisible = ref(false);
const rules = ref<AlertRule[]>([]);
const addingRule = ref(false);
const newRule = ref({
  metric: "",
  threshold: 90,
  severity: "WARNING",
  debounceMs: 5000,
});

/** 打开规则管理抽屉并加载规则 */
async function openRules() {
  rulesVisible.value = true;
  try {
    rules.value = (await getAlertRules()) || [];
  } catch {
    message.error("加载规则失败");
  }
}

async function addRule() {
  const metric = newRule.value.metric.trim();
  if (!metric) {
    message.warning("请输入指标名");
    return;
  }
  addingRule.value = true;
  try {
    await addAlertRule({
      metric,
      threshold: newRule.value.threshold,
      severity: newRule.value.severity,
      debounceMs: newRule.value.debounceMs,
    });
    message.success(`已新增规则 ${metric}`);
    newRule.value.metric = "";
    rules.value = (await getAlertRules()) || [];
  } catch {
    message.error("新增规则失败");
  } finally {
    addingRule.value = false;
  }
}

/** 启停规则（前端先乐观更新，失败回滚） */
async function toggleRule(r: AlertRule) {
  const target = !r.enabled;
  const prev = r.enabled;
  r.enabled = target;
  try {
    await toggleAlertRule(r.metric, target);
    message.success(`${r.metric} 已${target ? "启用" : "停用"}`);
  } catch {
    r.enabled = prev;
    message.error("操作失败");
  }
}

async function deleteRule(r: AlertRule) {
  try {
    await deleteAlertRule(r.metric);
    rules.value = rules.value.filter((x) => x.metric !== r.metric);
    message.success(`已删除规则 ${r.metric}`);
  } catch {
    message.error("删除失败");
  }
}

// ---- 通知渠道 ----

interface NotificationChannel {
  id: string;
  type: "email" | "dingtalk" | "feishu" | "webhook";
  name: string;
  enabled: boolean;
  webhookUrl?: string;
  config?: Record<string, string>;
}

const channelsVisible = ref(false);
const channels = ref<NotificationChannel[]>([]);
const newChannel = ref<{ type: string; name: string; webhookUrl: string }>({
  type: "dingtalk",
  name: "",
  webhookUrl: "",
});

/** 打开渠道抽屉并加载 */
function openChannels() {
  channelsVisible.value = true;
  loadChannels();
}

function loadChannels() {
  try {
    const raw = localStorage.getItem("apm-notification-channels");
    channels.value = raw ? JSON.parse(raw) : [];
  } catch {
    channels.value = [];
  }
}

function saveChannels() {
  try {
    localStorage.setItem("apm-notification-channels", JSON.stringify(channels.value));
  } catch { /* 忽略 */ }
}

function addChannel() {
  const name = newChannel.value.name.trim();
  if (!name) { message.warning("请输入渠道名称"); return; }
  const webhookUrl = newChannel.value.webhookUrl.trim();
  if (!webhookUrl) { message.warning("请输入 URL 或地址"); return; }
  const ch: NotificationChannel = {
    id: `ch-${Date.now()}`,
    type: newChannel.value.type as NotificationChannel["type"],
    name,
    enabled: true,
    webhookUrl,
  };
  channels.value.push(ch);
  saveChannels();
  newChannel.value.name = "";
  newChannel.value.webhookUrl = "";
  message.success(`已添加渠道「${name}」`);
}

function toggleChannel(ch: NotificationChannel) {
  ch.enabled = !ch.enabled;
  saveChannels();
}

function deleteChannel(ch: NotificationChannel) {
  channels.value = channels.value.filter((x) => x.id !== ch.id);
  saveChannels();
  message.success(`已删除渠道「${ch.name}」`);
}

// ---- 事件处置 ----

/** 处置告警：确认 / 静默 / 忽略 */
async function handleAction(row: Record<string, unknown>, action: "acknowledge" | "mute" | "ignore") {
  const alert = row as unknown as ApmAlert;
  const label = { acknowledge: "确认", mute: "静默", ignore: "忽略" }[action];
  try {
    const ok =
      action === "acknowledge" ? await acknowledgeAlert(alert.id)
      : action === "mute" ? await muteAlert(alert.id)
      : await ignoreAlert(alert.id);
    if (ok) {
      alert.status = action === "acknowledge" ? "ACKNOWLEDGED" : action === "mute" ? "MUTED" : "IGNORED";
      message.success(`已${label}告警事件`);
    }
  } catch {
    message.error(`${label}失败`);
  }
}

onMounted(() => {
  load();
  timer = window.setInterval(load, 10000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
/* ========================================================
   Alerts · koi 令牌（渐进式替换）
   颜色优先取 koi 令牌，未加载 koi 时以 --apm-* 语义令牌兜底：
   var(--koi-token, var(--apm-*))。hotsport 独立运行时不加载 koi，视觉不崩。

   处理方式：仅替换 <style> 令牌。本页的 ReTable 8 个具名列插槽、
   ReTab #table / #timeline 插槽以及两个 ReDrawer 对话框均由脚本
   ref / 插槽绑定，重写模板会破坏绑定，故模板与 <script> 原样保留。
   ======================================================== */

/* 骨架与 .stat-row/.table-panel/.mono/.muted 由 styles/layout.css 提供 */

/* 严重级别筛选 */
.sev-filter {
  width: 130px;
}

.table-panel {
  overflow: hidden;
}

.metric-text {
  color: var(--text-primary, var(--apm-fg));
  font-weight: 500;
}

.critical-flag {
  margin-left: var(--apm-space-2);
}

.msg-text {
  color: var(--text-secondary, var(--apm-fg-regular));
}

/* 时间线视图 */
.timeline-wrap {
  padding: var(--apm-space-3);
}

.timeline-wrap :deep(.re-timeline__title) {
  color: var(--text-primary, var(--apm-fg));
}

.timeline-wrap :deep(.re-timeline__time) {
  color: var(--text-tertiary, var(--apm-muted));
}

.timeline-wrap :deep(.re-timeline__description) {
  color: var(--text-tertiary, var(--apm-muted));
}

.timeline-desc {
  margin: 0;
}

.timeline-values {
  font-size: 12px;
}

/* ---- 规则管理抽屉 ---- */
.rule-form {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
  padding-bottom: var(--apm-space-4);
  border-bottom: 1px solid var(--border-default, var(--apm-border));
  margin-bottom: var(--apm-space-4);
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apm-space-3);
  padding: var(--apm-space-3) var(--apm-space-4);
  background: var(--bg-elevated, var(--apm-panel-raised));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-md, var(--apm-radius-md));
}

.rule-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.rule-metric {
  color: var(--text-primary, var(--apm-fg));
  font-weight: 600;
}

.rule-threshold {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* ---- 通知渠道抽屉 ---- */
.channel-form {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
  padding-bottom: var(--apm-space-4);
  border-bottom: 1px solid var(--border-default, var(--apm-border));
  margin-bottom: var(--apm-space-4);
}

.channel-type-row {
  display: flex;
  gap: var(--apm-space-2);
}

.type-select {
  width: 160px;
  flex-shrink: 0;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
}

.channel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apm-space-3);
  padding: var(--apm-space-3) var(--apm-space-4);
  background: var(--bg-elevated, var(--apm-panel-raised));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-md, var(--apm-radius-md));
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.channel-name {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, var(--apm-fg));
}

.channel-url {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
