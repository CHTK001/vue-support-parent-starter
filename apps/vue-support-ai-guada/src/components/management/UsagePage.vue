<template>
  <div class="h-full overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a]">
    <!-- 页面头部 -->
    <div class="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2f2f2f]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">用量管理</h1>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">查看和管理API用量统计，支持导出和同步</p>
        </div>
        <div class="flex items-center gap-2">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
            @change="loadData"
          />
          <el-button type="primary" @click="handleSync">
            <el-icon><Refresh /></el-icon>
            手动同步
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出CSV
          </el-button>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="shrink-0 px-6 py-4 grid grid-cols-4 gap-4">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-label">总调用次数</div>
          <div class="stat-value">{{ stats.totalCalls || 0 }}</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-label">总Prompt Tokens</div>
          <div class="stat-value">{{ stats.totalPromptTokens || 0 }}</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-label">总Completion Tokens</div>
          <div class="stat-value">{{ stats.totalCompletionTokens || 0 }}</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-label">预估费用(元)</div>
          <div class="stat-value text-green-600">¥{{ stats.totalCost || '0.00' }}</div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-auto px-6 pb-6">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="model" label="模型" min-width="150" />
        <el-table-column prop="provider" label="供应商" width="120" />
        <el-table-column prop="callCount" label="调用次数" width="120" />
        <el-table-column prop="promptTokens" label="Prompt Tokens" width="150" />
        <el-table-column prop="completionTokens" label="Completion Tokens" width="150" />
        <el-table-column prop="totalTokens" label="总Tokens" width="120" />
        <el-table-column prop="cost" label="费用(元)" width="120">
          <template #default="{ row }">
            <span class="text-green-600">¥{{ row.cost || '0.00' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Download } from '@element-plus/icons-vue';
import { usageApi } from '@/services/javaApi';

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const dateRange = ref<[Date, Date] | null>(null);
const stats = reactive({
  totalCalls: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalCost: '0.00',
});

async function loadData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    if (dateRange.value) {
      params.startDate = dateRange.value[0]?.toISOString().split('T')[0];
      params.endDate = dateRange.value[1]?.toISOString().split('T')[0];
    }

    // 加载统计
    try {
      const statRes: any = await usageApi.statistics(params);
      const statData = statRes?.data || statRes || {};
      stats.totalCalls = statData.totalCalls || 0;
      stats.totalPromptTokens = statData.totalPromptTokens || 0;
      stats.totalCompletionTokens = statData.totalCompletionTokens || 0;
      stats.totalCost = statData.totalCost || '0.00';
    } catch (e) {
      console.warn('统计加载失败', e);
    }

    // 加载列表
    const res: any = await usageApi.list(params);
    const data = res?.data || res?.records || res?.list || res || [];
    tableData.value = Array.isArray(data) ? data : (data.records || data.list || []);
    total.value = res?.total || res?.count || tableData.value.length;
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  try {
    await usageApi.sync();
    ElMessage.success('同步成功');
    loadData();
  } catch (e: any) {
    ElMessage.error(`同步失败: ${e.message}`);
  }
}

async function handleExport() {
  try {
    const res: any = await usageApi.export();
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `usage_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('导出成功');
  } catch (e: any) {
    ElMessage.error(`导出失败: ${e.message}`);
  }
}

onMounted(loadData);
</script>

<style scoped>
.stat-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.dark .stat-card {
  border-color: #374151;
  background-color: #1f2937;
}
.stat-item {
  text-align: center;
  padding: 8px 0;
}
.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}
.dark .stat-value {
  color: #f9fafb;
}
</style>
