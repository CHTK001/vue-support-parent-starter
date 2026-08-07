<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center justify-between">
        <el-input
          v-model="spiderCode"
          placeholder="爬虫编码"
          clearable
          style="width: 200px"
          @keyup.enter="load"
        />
        <div class="flex items-center gap-2">
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" circle @click="load" />
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table v-loading="loading" :data="list" stripe empty-text="暂无执行记录">
        <el-table-column prop="executionNo" label="批次号" min-width="200" show-overflow-tooltip />
        <el-table-column prop="spiderCode" label="爬虫编码" min-width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="抓取数" width="80" align="center">
          <template #default="{ row }">
            {{ row.resultCount ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="() => { pageNo = 1; load(); }"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { executionApi } from "@/api";
import type { PageResult, ExecutionRecord } from "@/types/spider";

const spiderCode = ref("");
const pageNo = ref(1);
const pageSize = ref(20);
const list = ref<ExecutionRecord[]>([]);
const total = ref(0);
const loading = ref(false);

/**
 * 加载执行记录列表。
 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const page = (await executionApi.page(
      pageNo.value,
      pageSize.value,
      spiderCode.value || undefined
    )) as PageResult<ExecutionRecord>;
    list.value = page.records ?? [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

/**
 * 状态徽章颜色。
 */
function statusType(status?: string): "success" | "info" | "warning" | "danger" {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "RUNNING":
      return "warning";
    case "FAILED":
      return "danger";
    default:
      return "info";
  }
}

/**
 * 状态徽章文案。
 */
function statusLabel(status?: string): string {
  switch (status) {
    case "SUCCESS":
      return "成功";
    case "RUNNING":
      return "运行中";
    case "FAILED":
      return "失败";
    default:
      return status ?? "未知";
  }
}

onMounted(load);
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar :deep(.el-card__body) {
  padding: 12px 16px;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.justify-end {
  justify-content: flex-end;
}
.mt-3 {
  margin-top: 12px;
}
</style>
