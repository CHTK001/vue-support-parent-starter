<template>
  <RePage data-page="usage-sync" fill title="用量同步日志" subtitle="查看用量同步历史记录">
    <template #actions>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </template>
      <!-- 表格统一 ReTable：默认引擎已是 vxe（不再显式写）。
           后端分页走 ReTable 的 **loader 模式**：传 loader 后组件进入远程模式，
           把 data 当作「当前页数据」直接渲染，页数按 loader 返回的 total 算。
           （此前传 data + total 而不传 loader → 被当成本地分页再切一遍，
             点页码无反应。） -->
      <ReTable
        :data="tableData"
        :columns="logColumns"
        :loading="loading"
        :pagination="true"
        :loader="loadLogsPage"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        stripe
        style="width: 100%"
      >
        <template #col-status="{ row }">
          <el-tag :type="row.status === 'success' ? 'success' : 'danger'" >
            {{ row.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </template>
        <template #col-errorMessage="{ row }">
          <span v-if="row.errorMessage" class="text-red-500">{{ row.errorMessage }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </ReTable>
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref } from 'vue';

import { Refresh } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { usageApi } from '@/services/javaApi';
import RePage from '@/components/ui/RePage.vue';

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
/** 手动刷新时用的页长（loader 模式下页长由 ReTable 内部维护） */
const pageSize = ref(20);

/**
 * 列配置：原来散在模板里的 7 个 el-table-column 收敛到这里。
 *
 * <p>status / errorMessage 两列带 {@code <template #default>}，这里配 {@code slot}，
 * 模板里对应 {@code #col-status} / {@code #col-errorMessage} 插槽。</p>
 */
const logColumns: ReTableColumn[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'syncTime', label: '同步时间', width: 180 },
  { prop: 'provider', label: '供应商', width: 120 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'recordCount', label: '同步记录数', width: 120 },
  { prop: 'duration', label: '耗时(秒)', width: 100 },
  { prop: 'errorMessage', label: '错误信息', minWidth: 200, slot: 'errorMessage' },
];

/**
 * ReTable 的 loader（后端分页）。
 *
 * <p>组件在远程模式下自己调它取当前页，并按返回的 total 算页数 ——
 * 这才是后端分页的正确接法（只传 data + total 会被当成本地分页再切一遍，
 * 点页码无反应）。</p>
 */
async function loadLogsPage({ page, pageSize: size }: { page: number; pageSize: number }) {
  loading.value = true;
  try {
    const res: any = await usageApi.syncLogs({ page, size });
    const data = res?.data || res?.records || res?.list || res || [];
    const records = Array.isArray(data) ? data : (data.records || data.list || []);
    tableData.value = records;
    total.value = Number(data.total ?? res?.total ?? res?.count) || records.length;
    return { total: total.value, records: tableData.value };
  } catch (e: any) {
    message.error(`加载失败: ${e.message}`);
    return { total: 0, records: [] };
  } finally {
    loading.value = false;
  }
}

/** 手动刷新（页面上的「刷新」按钮） */
async function loadData() {
  await loadLogsPage({ page: 1, pageSize: pageSize.value });
}

// 注：表格改为 loader 模式后，首屏数据由 ReTable 自己调 loadLogsPage 取；
// onMounted 不再重复拉一次（否则会打两次接口）。
</script>

