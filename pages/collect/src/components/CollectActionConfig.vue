<!--
  全局配置面板：展示采集侧全部列表的操作列定义。

  数据直接读 constants/actionColumns.ts —— 那是唯一来源，本面板只是它的可视化视图，
  不另存一份。改 actionColumns.ts 会同时改到六个列表与这里，所以本页永远与真实渲染一致。

  为什么只读：动作回调是各视图私有的，配置表只拥有展示元数据；
  要在界面上「编辑」图标与提示语等于把代码常量搬进运行时，需要持久化与回滚策略，
  当前没有这个需求。这里要保证的是「所见即所得」，而不是「所见即可改」。
-->
<script setup lang="ts">
import ReIcon from "@repo/ui/re-icon";
import { COLLECT_ACTIONS, type CollectActionKey } from "../constants/actionColumns";

defineOptions({ name: "CollectActionConfig" });

/** 列表 → 它的操作列动作；数组顺序即页面渲染顺序 */
const GROUPS: Array<{ list: string; actions: CollectActionKey[] }> = [
  {
    list: "采集流程",
    actions: ["designFlow", "previewFlow", "runFlow", "flowRuns", "flowRecords", "flowMore"],
  },
  { list: "运行记录", actions: ["replay", "records", "logs", "deleteRun"] },
  { list: "采集结果", actions: ["viewResult", "deleteRecord"] },
  { list: "函数库", actions: ["editFunction", "testFunction", "deleteFunction"] },
  { list: "变量管理", actions: ["editVariable", "deleteVariable"] },
  { list: "执行通知", actions: ["editNotice", "testNotice", "deleteNotice"] },
];
</script>

<template>
  <div class="collect-action-config">
    <p class="collect-action-config__hint">
      采集侧全部列表的操作列定义集中在此（唯一来源）。新增或调整动作只需改
      <code>constants/actionColumns.ts</code>，六个列表与本页同步生效。
    </p>

    <table class="collect-action-config__table">
      <thead>
        <tr>
          <th class="collect-action-config__col-list">列表</th>
          <th>操作列（顺序即渲染顺序）</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in GROUPS" :key="group.list">
          <td class="collect-action-config__list">{{ group.list }}</td>
          <td>
            <span
              v-for="key in group.actions"
              :key="key"
              class="collect-action-config__action"
              :class="`collect-action-config__action--${COLLECT_ACTIONS[key].type ?? 'default'}`"
            >
              <ReIcon :name="COLLECT_ACTIONS[key].icon" :size="14" />
              <span class="collect-action-config__tip">{{ COLLECT_ACTIONS[key].tip }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.collect-action-config {
  padding: 4px 2px;
}

.collect-action-config__hint {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.collect-action-config__hint code {
  padding: 1px 6px;
  border-radius: var(--re-surface-radius, 4px);
  background: var(--el-fill-color-light);
  font-size: 12px;
}

.collect-action-config__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.collect-action-config__table th {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-weight: 500;
  text-align: left;
}

.collect-action-config__col-list {
  width: 120px;
}

.collect-action-config__table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  vertical-align: top;
}

.collect-action-config__list {
  color: var(--el-text-color-primary);
  font-weight: 500;
  white-space: nowrap;
}

.collect-action-config__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0 14px 6px 0;
  padding: 3px 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--re-surface-radius, 4px);
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.collect-action-config__action--primary {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}

.collect-action-config__action--success {
  color: var(--el-color-success);
  border-color: var(--el-color-success-light-7);
}

.collect-action-config__action--warning {
  color: var(--el-color-warning);
  border-color: var(--el-color-warning-light-7);
}

.collect-action-config__action--danger {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-7);
}

.collect-action-config__tip {
  white-space: normal;
}
</style>
