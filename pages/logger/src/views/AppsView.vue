<script setup lang="ts">
/**
 * 应用实例：GET /v2/logger/apps。
 * errorCount > 0 的实例在应用列挂「异常」标签、错误数红色加粗（行级高亮）；
 * lastSeen 以相对时间展示；支持应用/实例关键字过滤与刷新。
 */
import { computed, onMounted, ref } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchApps, type LoggerAppInfo } from "../api/logger";
import { relativeTime } from "../utils/format";

const rows = ref<LoggerAppInfo[]>([]);
const loading = ref(false);
const keyword = ref("");

const columns: ReTableColumn[] = [
  { prop: "app", label: "应用", minWidth: 200 },
  { prop: "instance", label: "实例", minWidth: 220, showOverflowTooltip: true },
  { prop: "lastSeen", label: "最近上报", width: 140 },
  { prop: "eventCount", label: "日志数", width: 120, align: "right" },
  { prop: "errorCount", label: "错误数", width: 120, align: "right" },
];

const filteredRows = computed<LoggerAppInfo[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return rows.value;
  return rows.value.filter((row) => `${row.app ?? ""}\n${row.instance ?? ""}`.toLowerCase().includes(kw));
});

const errorTotal = computed(() => rows.value.reduce((sum, row) => sum + (Number(row.errorCount) || 0), 0));

async function load(): Promise<void> {
  loading.value = true;
  try {
    rows.value = (await fetchApps()) ?? [];
  } catch {
    // 错误提示由 http 层统一弹出
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="apps-view logger-scope">
    <div class="logger-card apps-toolbar">
      <el-input v-model="keyword" clearable placeholder="过滤应用 / 实例" style="width: 240px" />
      <div class="apps-summary">
        <span>实例 {{ rows.length }}</span>
        <span :class="{ 'is-error': errorTotal > 0 }">错误总数 {{ errorTotal }}</span>
        <el-button size="small" plain :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>
    <div class="logger-card">
      <ReTable :columns="columns" :data="filteredRows">
        <template #col-app="{ row }">
          <span class="app-cell">
            <span class="app-name">{{ row.app || "-" }}</span>
            <el-tag v-if="Number(row.errorCount) > 0" type="danger" size="small" effect="light">异常</el-tag>
          </span>
        </template>
        <template #col-lastSeen="{ row }">{{ relativeTime(row.lastSeen) }}</template>
        <template #col-errorCount="{ row }">
          <span class="error-count" :class="{ 'is-error': Number(row.errorCount) > 0 }">{{ row.errorCount ?? 0 }}</span>
        </template>
      </ReTable>
    </div>
  </div>
</template>
