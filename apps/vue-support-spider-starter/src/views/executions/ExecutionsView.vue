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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
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

    <!-- 执行详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="执行详情"
      width="820"
      destroy-on-close
    >
      <div v-if="detail" class="detail-root">
        <el-descriptions :column="2" border size="small" class="mb-3">
          <el-descriptions-item label="批次号">{{ detail.executionNo }}</el-descriptions-item>
          <el-descriptions-item label="爬虫编码">{{ detail.spiderCode }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="small" :type="statusType(detail.status)">
              {{ statusLabel(detail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="抓取数">{{ detail.resultCount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ detail.startTime ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ detail.endTime ?? '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.errorMessage" label="错误信息" :span="2">
            <span class="text-red-500">{{ detail.errorMessage }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="results-title">抓取结果（{{ results.length }}）</div>
        <div v-if="results.length === 0" class="empty">暂无抓取结果</div>
        <div v-else>
          <div v-for="(r, idx) in results" :key="idx" class="result-card">
            <div class="result-title-row">
              <span class="result-idx">#{{ idx + 1 }}</span>
              <span class="result-title">{{ r.title || '(无标题)' }}</span>
              <el-tag v-if="r.depth != null" size="small" type="info">深度 {{ r.depth }}</el-tag>
            </div>
            <div class="result-url" :title="r.url">{{ r.url }}</div>
            <div v-if="r.aiSummary" class="result-ai">
              <strong>AI：</strong>{{ r.aiSummary }}
            </div>
            <div v-if="text" class="result-text">{{ truncate(r.text, 200) }}</div>
            <details v-if="hasStructured(r.structured)" class="result-structured">
              <summary>结构化元数据</summary>
              <pre>{{ JSON.stringify(r.structured, null, 2) }}</pre>
            </details>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { executionApi } from "@/api";
import type {
  PageResult,
  ExecutionRecord,
  SpiderResultItem,
} from "@/types/spider";

const spiderCode = ref("");
const pageNo = ref(1);
const pageSize = ref(20);
const list = ref<ExecutionRecord[]>([]);
const total = ref(0);
const loading = ref(false);

/**
 * 详情弹窗状态
 */
const detailVisible = ref(false);
const detail = ref<ExecutionRecord | null>(null);

/**
 * 解析后的抓取结果（来自 detail.resultsJson）。
 */
const results = computed<SpiderResultItem[]>(() => {
  if (!detail.value?.resultsJson) return [];
  try {
    const parsed = JSON.parse(detail.value.resultsJson);
    return Array.isArray(parsed) ? (parsed as SpiderResultItem[]) : [];
  } catch {
    return [];
  }
});

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
 * 打开详情弹窗：拉取最新单条记录（含 resultsJson）。
 */
async function openDetail(row: ExecutionRecord): Promise<void> {
  if (!row.executionNo) return;
  try {
    const fresh = (await executionApi.detail(row.executionNo)) as ExecutionRecord;
    detail.value = fresh;
    detailVisible.value = true;
  } catch (e) {
    ElMessage.error('详情加载失败: ' + (e instanceof Error ? e.message : String(e)));
  }
}

/**
 * 截断字符串，超过 maxLen 字符后追加 …。
 */
function truncate(s: string | undefined, maxLen: number): string {
  if (!s) return '';
  return s.length <= maxLen ? s : s.substring(0, maxLen) + '…';
}

/**
 * structured 是否非空。
 */
function hasStructured(v: Record<string, unknown> | undefined): boolean {
  return !!v && Object.keys(v).length > 0;
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
.mb-3 {
  margin-bottom: 12px;
}

.detail-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.results-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.result-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  background: var(--el-bg-color);
  margin-bottom: 8px;
}
.result-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.result-idx {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.result-url {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  word-break: break-all;
}
.result-ai {
  font-size: 13px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 6px;
}
.result-text {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  margin-bottom: 6px;
  white-space: pre-wrap;
}
.result-structured {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.result-structured summary {
  cursor: pointer;
  padding: 4px 0;
}
.result-structured pre {
  background: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
  font-size: 12px;
}
.text-red-500 {
  color: var(--el-color-danger);
}
</style>
