<template>
  <div class="exec-data">
    <div class="exec-data__header">
      <span class="exec-data__title">提取数据</span>
      <span class="exec-data__count">{{ records.length }} 条记录</span>
    </div>

    <div v-if="records.length === 0" class="exec-data__empty">暂无提取数据</div>

    <el-table
      v-else
      :data="records"
      stripe
      size="small"
      class="exec-data__table"
      @expand-change="onExpandChange"
    >
      <el-table-column type="expand" width="32">
        <template #default="{ row }">
          <div class="exec-data__expanded">
            <div class="exec-data__expanded-row">
              <span class="exec-data__expanded-label">Payload</span>
              <pre class="exec-data__json">{{ prettyJson(row.spiderDataPayload) }}</pre>
            </div>
            <div class="exec-data__expanded-row" v-if="row.spiderDataName">
              <span class="exec-data__expanded-label">名称</span>
              <span class="exec-data__expanded-val">{{ row.spiderDataName }}</span>
            </div>
            <DebugDataViewer label="原始数据" :data="row" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="spiderTargetUrl" label="目标 URL" min-width="180" show-overflow-tooltip />
      <el-table-column prop="spiderDataCode" label="Schema Code" width="120" />
      <el-table-column prop="spiderDataStatus" label="状态" width="80">
        <template #default="{ row }">
          <span class="exec-data__status" :class="'is-' + (row.spiderDataStatus || '').toLowerCase()">
            {{ row.spiderDataStatus }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { SpiderParseResultView } from "../../../../api/spider";
import DebugDataViewer from "./DebugDataViewer.vue";

defineProps<{
  records: SpiderParseResultView[];
}>();

function prettyJson(str?: string): string {
  if (!str) return "-";
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function formatTime(t?: string): string {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return t;
  }
}

function onExpandChange() {
  // no-op, keep for el-table expand event
}
</script>

<style scoped>
.exec-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exec-data__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.exec-data__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--lay-text-primary);
}
.exec-data__count {
  font-size: 10px;
  color: var(--lay-text-placeholder);
}
.exec-data__empty {
  text-align: center;
  padding: 40px;
  color: var(--lay-text-placeholder);
  font-size: 13px;
}
.exec-data__table {
  width: 100%;
  --el-table-bg-color: rgba(255,255,255,0.02);
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255,255,255,0.04);
  --el-table-border-color: rgba(255,255,255,0.06);
  --el-table-text-color: var(--lay-text-primary);
  --el-table-header-text-color: var(--lay-text-secondary);
  --el-table-row-hover-bg-color: rgba(34,211,238,0.04);
}
.exec-data__status {
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}
.exec-data__status.is-success { background: rgba(76,175,80,0.12); color: #4caf50; }
.exec-data__status.is-failed { background: rgba(244,67,54,0.12); color: #f44336; }
.exec-data__status.is-running { background: rgba(255,152,0,0.12); color: #ff9800; }
.exec-data__expanded {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exec-data__expanded-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.exec-data__expanded-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  min-width: 60px;
  flex-shrink: 0;
  margin-top: 2px;
}
.exec-data__expanded-val {
  font-size: 12px;
  color: var(--lay-text-primary);
}
.exec-data__json {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--lay-text-secondary);
  font-family: "JetBrains Mono", "Fira Code", monospace;
  white-space: pre;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  flex: 1;
}
</style>
