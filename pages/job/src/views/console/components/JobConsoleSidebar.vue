<template>
  <aside class="job-nav">
    <div class="job-nav__toolbar">
      <label class="spring-field">
        <span>命名空间</span>
        <select v-model="localNamespace" :disabled="loadingNamespaces">
          <option value="">
            {{ loadingNamespaces ? "加载中..." : "请选择命名空间" }}
          </option>
          <option v-for="item in namespaces" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </label>

      <label class="spring-field">
        <span>任务筛选</span>
        <input
          v-model.trim="filters.keyword"
          type="text"
          placeholder="任务编号 / Bean / 名称"
        >
      </label>

      <div class="job-nav__filters">
        <label class="spring-field">
          <span>状态</span>
          <select v-model="filters.status">
            <option value="">全部</option>
            <option value="running">运行中</option>
            <option value="stopped">已停止</option>
            <option value="success">最近成功</option>
            <option value="failure">最近失败</option>
          </select>
        </label>

        <label class="spring-field">
          <span>分发</span>
          <select v-model="filters.dispatch">
            <option value="">全部</option>
            <option value="LOCAL">本地</option>
            <option value="REMOTE">远程</option>
          </select>
        </label>
      </div>

      <div class="job-nav__actions">
        <button type="button" class="spring-ghost-button" @click="$emit('reset-filters')">
          重置筛选
        </button>
        <button type="button" class="spring-primary-button" @click="$emit('refresh')">
          刷新
        </button>
      </div>
    </div>

    <div class="job-nav__summary">
      <article class="job-nav__summary-card">
        <small>远程分发</small>
        <strong>{{ remoteCount }}</strong>
      </article>
      <article class="job-nav__summary-card">
        <small>最近失败</small>
        <strong>{{ failureCount }}</strong>
      </article>
    </div>

    <div class="job-nav__list">
      <div v-if="loadingTasks" class="job-nav__empty">正在加载任务...</div>
      <div v-else-if="!tasks.length" class="job-nav__empty">
        {{ localNamespace ? "当前筛选条件下没有任务。" : "请先选择命名空间。" }}
      </div>
      <button
        v-for="task in tasks"
        v-else
        :key="task.jobNo || task.taskKey || task.taskName"
        type="button"
        class="job-nav__item"
        :class="{ 'is-active': isSelected(task) }"
        @click="$emit('select-task', task)"
      >
        <div class="job-nav__item-top">
          <div class="job-nav__item-copy">
            <strong>{{ task.taskName || "未命名任务" }}</strong>
            <span>{{ task.jobNo || task.taskKey || "-" }}</span>
          </div>
          <span class="spring-chip" :class="statusClass(task)">
            {{ task.enabled ? "RUNNING" : "STOPPED" }}
          </span>
        </div>
        <div class="job-nav__item-meta">
          <span>{{ task.scheduleType || "CRON" }}</span>
          <span>{{ task.dispatchMode || "LOCAL" }}</span>
          <span>{{ formatDateTime(task.nextExecutionTime) || "未安排" }}</span>
        </div>
        <p>{{ task.description || "暂无任务描述" }}</p>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Task } from "../types";

const props = defineProps<{
  failureCount: number;
  filters: { dispatch: string; keyword: string; status: string };
  loadingNamespaces: boolean;
  loadingTasks: boolean;
  namespace: string;
  namespaces: string[];
  remoteCount: number;
  selectedTask: Task | null;
  tasks: Task[];
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "reset-filters"): void;
  (event: "select-task", task: Task): void;
  (event: "update:namespace", value: string): void;
}>();

const localNamespace = computed({
  get: () => props.namespace,
  set: value => emit("update:namespace", value),
});

const isSelected = (task: Task) => {
  if (!props.selectedTask) return false;
  return Boolean(
    (task.jobNo && task.jobNo === props.selectedTask.jobNo)
    || (task.taskKey && task.taskKey === props.selectedTask.taskKey),
  );
};

const statusClass = (task: Task) => {
  const lastRunStatus = String(task.lastRunStatus || "").toUpperCase();
  if (lastRunStatus === "FAILURE") return "spring-failure";
  if (lastRunStatus === "SUCCESS") return "spring-success";
  return task.enabled ? "spring-running" : "spring-stopped";
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value).replace("T", " ")
    : parsed.toLocaleString("zh-CN", { hour12: false });
};
</script>

<style scoped lang="scss">
.job-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 8px 14px 8px 8px;
}

.job-nav__toolbar {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid rgba(17, 32, 56, 0.08);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 249, 255, 0.9));
}

.job-nav__filters,
.job-nav__summary,
.job-nav__actions {
  display: grid;
  gap: 12px;
}

.job-nav__filters,
.job-nav__summary,
.job-nav__actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.job-nav__summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(17, 32, 56, 0.04);
}

.job-nav__summary-card small {
  color: var(--spring-muted);
}

.job-nav__summary-card strong {
  font-size: 18px;
}

.job-nav__list {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 12px;
  overflow: auto;
}

.job-nav__empty {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 18px;
  border: 1px dashed rgba(17, 32, 56, 0.14);
  border-radius: 24px;
  color: var(--spring-muted);
  background: rgba(255, 255, 255, 0.55);
  text-align: center;
}

.job-nav__item {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(17, 32, 56, 0.08);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 248, 255, 0.88));
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.job-nav__item:hover,
.job-nav__item.is-active {
  border-color: rgba(22, 102, 216, 0.22);
  transform: translateY(-1px);
  box-shadow: 0 16px 28px -24px rgba(22, 102, 216, 0.5);
}

.job-nav__item.is-active {
  background:
    linear-gradient(180deg, rgba(233, 242, 255, 0.94), rgba(246, 249, 255, 0.92));
}

.job-nav__item-top {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.job-nav__item-copy {
  display: grid;
  gap: 6px;
}

.job-nav__item-copy strong {
  font-size: 15px;
}

.job-nav__item-copy span,
.job-nav__item p,
.job-nav__item-meta {
  color: var(--spring-muted);
}

.job-nav__item p {
  margin: 0;
  line-height: 1.6;
}

.job-nav__item-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
}

@media (max-width: 760px) {
  .job-nav {
    padding: 0;
  }

  .job-nav__filters,
  .job-nav__summary,
  .job-nav__actions {
    grid-template-columns: 1fr;
  }
}
</style>
