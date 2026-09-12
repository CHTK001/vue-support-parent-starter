<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">资源泄漏</span>
        <el-select v-model="filterType" placeholder="类型" clearable size="small" class="filter-select">
          <el-option label="File" value="File" />
          <el-option label="Socket" value="Socket" />
          <el-option label="Connection" value="Connection" />
          <el-option label="Thread" value="Thread" />
        </el-select>
      </div>
      <el-button size="small" round :loading="loading" @click="load">
        <el-icon class="mr-1"><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <div class="table-panel">
      <el-table
        v-loading="loading"
        :data="items"
        class="apm-table"
        empty-text="暂无泄漏记录"
      >
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.resourceType)" size="small" round>
              {{ row.resourceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源" min-width="200">
          <template #default="{ row }">
            <span class="mono">{{ row.resourceName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="线程" min-width="140">
          <template #default="{ row }">
            <span class="mono muted">{{ row.thread || "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="存活" width="100" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="agePercent(row.ageMs)"
              :color="ageColor(row.ageMs)"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'danger' : 'info'" size="small" effect="dark">
              {{ row.active ? "活跃" : "已关闭" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测时间" width="160">
          <template #default="{ row }">
            <span class="muted">{{ row.detectedAt || "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调用栈" width="90" align="center">
          <template #default="{ row }">
            <el-popover v-if="row.stackTrace" trigger="hover" width="420" placement="left">
              <template #reference>
                <el-button size="small" text type="primary">展开</el-button>
              </template>
              <pre class="stack">{{ row.stackTrace }}</pre>
            </el-popover>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="load"
          @current-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { pageLeaks } from "../api/apmApi";
import type { LeakRecord } from "../api/apmApi";

const items = ref<LeakRecord[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const filterType = ref("");

async function load() {
  loading.value = true;
  try {
    const res = await pageLeaks({
      page: page.value,
      size: size.value,
      resourceType: filterType.value || undefined,
    });
    items.value = res.items;
    total.value = res.total;
  } catch {
    ElMessage.error("加载泄漏记录失败");
  } finally {
    loading.value = false;
  }
}

function typeTag(t: string) {
  switch (t) {
    case "File":
      return "warning";
    case "Socket":
      return "danger";
    case "Connection":
      return "primary";
    case "Thread":
      return "success";
    default:
      return "info";
  }
}

/** 存活 0~60s 映射到 0~100% */
function agePercent(ageMs: number) {
  return Math.min(100, Math.round((ageMs / 60000) * 100));
}

function ageColor(ageMs: number) {
  if (ageMs > 30000) return "#ef4444";
  if (ageMs > 10000) return "#f59e0b";
  return "#22c55e";
}

onMounted(load);
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.mr-1 {
  margin-right: 4px;
  vertical-align: -2px;
}

.filter-select {
  width: 140px;
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 8px;
}

.apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.muted {
  color: var(--apm-muted);
}

.stack {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
  color: var(--apm-fg);
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 8px 4px;
}
</style>
