<template>
  <div class="job-workspace">
    <section class="job-metrics">
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">任务总数</span>
        <strong class="spring-metric-value">{{ filteredTaskCount }}</strong>
        <small>当前命名空间内所有任务</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">运行中</span>
        <strong class="spring-metric-value spring-accent-green">{{ runningCount }}</strong>
        <small>已启用并等待调度</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">远程分发</span>
        <strong class="spring-metric-value spring-accent-blue">{{ remoteCount }}</strong>
        <small>由调度中心下发执行</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">最近失败</span>
        <strong class="spring-metric-value spring-accent-amber">{{ failureCount }}</strong>
        <small>最近一次执行状态为 FAILURE</small>
      </article>
    </section>

    <section class="job-focus spring-card">
      <div class="job-focus__head">
        <div>
          <span class="job-focus__eyebrow">Task Focus</span>
          <h2>{{ selectedTaskTitle }}</h2>
          <p>{{ selectedTaskDescription }}</p>
        </div>
        <span v-if="selectedTask" class="spring-chip" :class="selectedStatusClass">
          {{ selectedStatusText }}
        </span>
      </div>

      <div v-if="selectedTask" class="job-focus__meta">
        <article v-for="item in focusMeta" :key="item.label" class="job-focus__meta-card">
          <small>{{ item.label }}</small>
          <strong>{{ item.value }}</strong>
        </article>
      </div>

      <div v-if="selectedTask" class="spring-detail-actions">
        <button type="button" class="spring-ghost-button" @click="$emit('run-action', 'start')">
          启动
        </button>
        <button type="button" class="spring-ghost-button" @click="$emit('run-action', 'stop')">
          停止
        </button>
        <button type="button" class="spring-primary-button" @click="$emit('run-action', 'trigger')">
          立即执行
        </button>
        <button type="button" class="spring-ghost-button" @click="$emit('edit-task')">
          编辑任务
        </button>
        <button type="button" class="spring-ghost-button" @click="$emit('switch-tab', 'logs')">
          查看日志
        </button>
      </div>

      <div v-else class="spring-empty-state">
        请从左侧任务列表选择一个任务开始查看。
      </div>
    </section>

    <section v-if="activeRailTab === 'overview'" class="job-panel-grid">
      <article class="spring-card job-panel">
        <div class="spring-panel-header">
          <div>
            <h2>运行概览</h2>
            <p>聚合当前任务的调度、分发和负责人信息。</p>
          </div>
        </div>
        <div v-if="selectedTask" class="job-overview-list">
          <div v-for="item in overviewItems" :key="item.label" class="job-overview-list__item">
            <small>{{ item.label }}</small>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div v-else class="spring-empty-state">
          尚未选择任务，左侧选择后这里会显示概览摘要。
        </div>
      </article>

      <article class="spring-card job-panel">
        <div class="spring-panel-header">
          <div>
            <h2>最近日志预览</h2>
            <p>默认跟随当前选中任务，快速判断最近执行结果。</p>
          </div>
          <button type="button" class="spring-text-button" @click="$emit('refresh-logs')">
            {{ loadingLogs ? "加载中..." : "刷新日志" }}
          </button>
        </div>
        <div class="job-log-feed">
          <div v-if="loadingLogs" class="spring-empty-state">正在加载日志...</div>
          <div v-else-if="!previewLogs.length" class="spring-empty-state">
            {{ selectedTask ? "当前任务暂无日志。" : "请选择任务后查看日志。" }}
          </div>
          <article v-for="log in previewLogs" v-else :key="log.jobLogNo || String(log.jobLogId)" class="job-log-card">
            <div class="job-log-card__head">
              <div class="spring-table-title">
                <span class="spring-title-strong">{{ log.jobLogNo || `LOG-${log.jobLogId || "-"}` }}</span>
                <span class="spring-muted-line">{{ formatDateTime(log.jobLogTriggerTime) || "-" }}</span>
              </div>
              <span class="spring-chip" :class="logStatusClass(log)">
                {{ log.jobLogExecuteCode || log.jobLogTriggerCode || "UNKNOWN" }}
              </span>
            </div>
            <p>{{ log.jobLogTriggerMsg || "暂无执行消息" }}</p>
            <p class="spring-muted-line">
              {{ log.jobLogTriggerBean || "-" }} · 耗时 {{ log.jobLogCost != null ? `${log.jobLogCost} ms` : "-" }}
            </p>
          </article>
        </div>
      </article>

      <article class="spring-card job-panel">
        <div class="spring-panel-header">
          <div>
            <h2>接口与命名空间</h2>
            <p>保留最常用的运行上下文，便于核对控制台配置。</p>
          </div>
        </div>
        <div class="job-overview-list">
          <div v-for="item in settingSummaryItems" :key="item.label" class="job-overview-list__item">
            <small>{{ item.label }}</small>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </article>
    </section>

    <section v-else-if="activeRailTab === 'detail'" class="spring-card job-panel">
      <div class="spring-panel-header">
        <div>
          <h2>任务详情</h2>
          <p>核心配置、负责人、调度参数和脚本入口。</p>
        </div>
      </div>
      <div v-if="selectedTask" class="job-detail-grid">
        <div v-for="item in detailItems" :key="item.label" class="job-detail-item">
          <small>{{ item.label }}</small>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div v-else class="spring-empty-state">请选择左侧任务查看详情。</div>
    </section>

    <section v-else-if="activeRailTab === 'logs'" class="spring-card job-panel">
      <div class="spring-panel-header">
        <div>
          <h2>最近日志</h2>
          <p>默认跟随当前选中任务，保留最近 6 条执行记录。</p>
        </div>
        <button type="button" class="spring-text-button" @click="$emit('refresh-logs')">
          {{ loadingLogs ? "加载中..." : "刷新日志" }}
        </button>
      </div>
      <div class="job-log-feed">
        <div v-if="loadingLogs" class="spring-empty-state">正在加载日志...</div>
        <div v-else-if="!logs.length" class="spring-empty-state">
          {{ selectedTask ? "当前任务暂无日志。" : "请选择任务后查看日志。" }}
        </div>
        <article v-for="log in logs" v-else :key="log.jobLogNo || String(log.jobLogId)" class="job-log-card">
          <div class="job-log-card__head">
            <div class="spring-table-title">
              <span class="spring-title-strong">{{ log.jobLogNo || `LOG-${log.jobLogId || "-"}` }}</span>
              <span class="spring-muted-line">{{ formatDateTime(log.jobLogTriggerTime) || "-" }}</span>
            </div>
            <span class="spring-chip" :class="logStatusClass(log)">
              {{ log.jobLogExecuteCode || log.jobLogTriggerCode || "UNKNOWN" }}
            </span>
          </div>
          <p>{{ log.jobLogTriggerMsg || "暂无执行消息" }}</p>
          <p class="spring-muted-line">
            {{ log.jobLogTriggerBean || "-" }} · 耗时 {{ log.jobLogCost != null ? `${log.jobLogCost} ms` : "-" }}
          </p>
        </article>
      </div>
    </section>

    <section v-else class="spring-card job-panel">
      <div class="spring-panel-header">
        <div>
          <h2>接口设置</h2>
          <p>默认走控制台会话 API，仅在直连平台接口时补充认证头。</p>
        </div>
      </div>
      <form class="job-settings-form" @submit.prevent="$emit('save-settings')">
        <div class="job-detail-grid">
          <label class="spring-form-field job-detail-item job-detail-item--wide">
            <span>API 根路径</span>
            <input v-model.trim="settings.apiRoot" type="text" placeholder="../job-console/api/">
          </label>
          <label class="spring-form-field job-detail-item">
            <span>Header 名称</span>
            <input v-model.trim="settings.authHeaderName" type="text" placeholder="可选">
          </label>
          <label class="spring-form-field job-detail-item">
            <span>Header 值</span>
            <input v-model.trim="settings.authHeaderValue" type="password" placeholder="可选">
          </label>
        </div>
        <div class="spring-modal-footer">
          <button type="button" class="spring-ghost-button" @click="$emit('restore-settings')">
            恢复已保存配置
          </button>
          <button type="submit" class="spring-primary-button">保存设置</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ConsoleMetricItem, LogRecord, RailTabName, Task } from "../types";

defineProps<{
  activeRailTab: RailTabName;
  detailItems: ConsoleMetricItem[];
  failureCount: number;
  filteredTaskCount: number;
  focusMeta: ConsoleMetricItem[];
  loadingLogs: boolean;
  logs: LogRecord[];
  overviewItems: ConsoleMetricItem[];
  previewLogs: LogRecord[];
  remoteCount: number;
  runningCount: number;
  selectedStatusClass: string;
  selectedStatusText: string;
  selectedTask: Task | null;
  selectedTaskDescription: string;
  selectedTaskTitle: string;
  settingSummaryItems: ConsoleMetricItem[];
  settings: { apiRoot: string; authHeaderName: string; authHeaderValue: string };
}>();

defineEmits<{
  (event: "edit-task"): void;
  (event: "refresh-logs"): void;
  (event: "restore-settings"): void;
  (event: "run-action", action: "start" | "stop" | "trigger"): void;
  (event: "save-settings"): void;
  (event: "switch-tab", tab: RailTabName): void;
}>();

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value).replace("T", " ")
    : parsed.toLocaleString("zh-CN", { hour12: false });
};

const logStatusClass = (log: LogRecord) => {
  const code = String(log.jobLogExecuteCode || log.jobLogTriggerCode || "").toUpperCase();
  if (code === "FAILURE") return "spring-failure";
  if (code === "SUCCESS") return "spring-success";
  return "spring-stopped";
};
</script>

<style scoped lang="scss">
.job-workspace {
  min-height: 100%;
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 8px 10px 8px 18px;
}

.job-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.job-focus,
.job-panel {
  border-radius: var(--spring-radius-lg);
  padding: 22px;
}

.job-focus {
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at top right, rgba(22, 102, 216, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 248, 255, 0.9));
}

.job-focus__head {
  display: flex;
  gap: 18px;
  justify-content: space-between;
  align-items: flex-start;
}

.job-focus__head h2 {
  margin: 8px 0 10px;
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1.08;
}

.job-focus__head p {
  margin: 0;
  max-width: 780px;
  color: var(--spring-muted);
}

.job-focus__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: var(--spring-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.job-focus__meta,
.job-detail-grid,
.job-panel-grid {
  display: grid;
  gap: 14px;
}

.job-focus__meta {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.job-focus__meta-card,
.job-detail-item,
.job-overview-list__item {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid rgba(17, 32, 56, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.job-focus__meta-card small,
.job-detail-item small,
.job-overview-list__item small {
  color: var(--spring-muted);
}

.job-panel-grid {
  grid-template-columns: 1.2fr 1fr 0.9fr;
  align-items: start;
}

.job-overview-list,
.job-log-feed {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.job-log-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(17, 32, 56, 0.04);
}

.job-log-card__head {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.job-log-card p {
  margin: 0;
  line-height: 1.6;
}

.job-detail-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 18px;
}

.job-detail-item--wide {
  grid-column: span 3;
}

.job-settings-form {
  display: grid;
  gap: 18px;
}

@media (max-width: 1320px) {
  .job-panel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .job-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .job-detail-item--wide {
    grid-column: span 2;
  }

  .job-focus__meta,
  .job-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .job-panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .job-workspace,
  .job-focus,
  .job-panel {
    padding: 18px;
  }

  .job-metrics,
  .job-focus__meta,
  .job-detail-grid {
    grid-template-columns: 1fr;
  }

  .job-detail-item--wide {
    grid-column: auto;
  }

  .job-focus__head,
  .job-log-card__head {
    flex-direction: column;
  }
}
</style>
