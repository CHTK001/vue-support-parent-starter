<script setup lang="ts">
/**
 * 下载历史页
 *
 * 分页 + 表格，支持金字塔构建、删除、清空。
 * @author CH
 * @since 4.0.0
 */
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getDownloadHistory,
  deleteDownloadRecord,
  clearDownloadHistory,
  buildPyramidForFile,
} from "@/api/history";
import type { DownloadHistoryRecord } from "@/types";

const records = ref<DownloadHistoryRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);

const statusMap: Record<string, { label: string; type: string }> = {
  completed: { label: "已完成", type: "success" },
  downloaded: { label: "已下载", type: "primary" },
  failed: { label: "失败", type: "danger" },
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 可读的文件大小字符串
 */
function formatSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes > 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes > 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * 格式化耗时
 * @param s 秒数
 * @returns 可读的耗时字符串
 */
function formatDuration(s?: number) {
  if (!s) return "-";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}分${sec}秒` : `${sec}秒`;
}

/** 刷新当前页历史列表 */
async function refresh() {
  loading.value = true;
  try {
    const res = await getDownloadHistory(page.value, pageSize.value);
    records.value = res.records ?? [];
    total.value = res.total ?? 0;
  } catch (e: any) {
    records.value = [];
  } finally {
    loading.value = false;
  }
}

/**
 * 删除单条历史记录
 * @param id 记录 ID
 */
async function onDelete(id: string | number) {
  try {
    await ElMessageBox.confirm("确定删除该记录？", "删除", { type: "warning" });
    await deleteDownloadRecord(id);
    ElMessage.success("已删除");
    refresh();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(`删除失败：${e?.message ?? e}`);
  }
}

/** 清空全部下载历史 */
async function onClearAll() {
  try {
    await ElMessageBox.confirm("确定清空全部下载历史？此操作不可恢复。", "清空历史", { type: "warning" });
    await clearDownloadHistory();
    ElMessage.success("已清空");
    refresh();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(`清空失败：${e?.message ?? e}`);
  }
}

/**
 * 为指定记录构建金字塔
 * @param id 记录 ID
 */
async function onBuildPyramid(id: string | number) {
  try {
    const res = await buildPyramidForFile(id);
    ElMessage.success(res.message || "已触发金字塔构建");
  } catch (e: any) {
    ElMessage.error(`金字塔构建失败：${e?.message ?? e}`);
  }
}

/**
 * 切换页码
 * @param p 目标页码
 */
function onPageChange(p: number) {
  page.value = p;
  refresh();
}

onMounted(refresh);
</script>

<template>
  <div class="history-page">
    <div class="history-head">
      <div class="history-title">
        <el-icon><Clock /></el-icon>
        <span>下载历史</span>
        <el-tag type="info" effect="plain">{{ total }} 条记录</el-tag>
      </div>
      <el-button type="danger" plain :disabled="total === 0" @click="onClearAll">
        清空历史
      </el-button>
    </div>

    <el-table :data="records" v-loading="loading" border stripe empty-text="暂无下载历史" class="history-table">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="sourceName" label="图源" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.sourceName || row.source || "-" }}</template>
      </el-table-column>
      <el-table-column label="级别" width="60" align="center">
        <template #default="{ row }">{{ row.zoom ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="格式" width="90">
        <template #default="{ row }">{{ row.format || "-" }}</template>
      </el-table-column>
      <el-table-column label="瓦片数" width="80" align="right">
        <template #default="{ row }">{{ row.tileCount?.toLocaleString() ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="文件大小" width="100" align="right">
        <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="(statusMap[row.status]?.type as any) ?? 'info'" >
            {{ statusMap[row.status]?.label ?? row.status ?? "-" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="耗时" width="90" align="right">
        <template #default="{ row }">{{ formatDuration(row.durationSecs) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ row.createdAt ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="onBuildPyramid(row.id)">金字塔</el-button>
          <el-button link type="danger" @click="onDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="history-pager">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.history-page {
  height: calc(100vh - 128px);
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px;
}
.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.history-table {
  flex: 1;
  width: 100%;
}
.history-pager {
  padding: 12px 4px 4px;
  display: flex;
  justify-content: center;
}
</style>