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
      <el-table-column prop="spiderTargetUrl" label="目标 URL" min-width="140" show-overflow-tooltip />
      <el-table-column prop="spiderDepth" label="深度" width="60" align="center">
        <template #default="{ row }">
          <span class="exec-data__depth">{{ extractDepth(row) }}</span>
        </template>
      </el-table-column>
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

function extractDepth(row: any): string {
  if (row.spiderDepth != null) return String(row.spiderDepth);
  try {
    const p = JSON.parse(row.spiderDataPayload || "{}");
    if (p.depth != null) return String(p.depth);
  } catch {}
  return "-";
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
  color: var(--el-text-color-primary);
}
.exec-data__count {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.exec-data__empty {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.exec-data__table {
  width: 100%;
  --el-table-bg-color: var(--el-bg-color);
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-text-color: var(--el-text-color-primary);
  --el-table-header-text-color: var(--el-text-color-secondary);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
}
.exec-data__status {
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}
.exec-data__status.is-success { background: color-mix(in srgb, var(--el-color-success) 12%, transparent); color: var(--el-color-success); }
.exec-data__status.is-failed { background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); color: var(--el-color-danger); }
.exec-data__status.is-running { background: color-mix(in srgb, var(--el-color-warning) 15%, transparent); color: var(--el-color-warning); }
.exec-data__depth {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
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
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  min-width: 60px;
  flex-shrink: 0;
  margin-top: 2px;
}
.exec-data__expanded-val {
  font-size: 12px;
  color: var(--el-text-color-primary);
}
.exec-data__json {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  font-family: "JetBrains Mono", "Fira Code", monospace;
  white-space: pre;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  flex: 1;
}
</style>
