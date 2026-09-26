<template>
  <div class="h-full overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a]">
    <div class="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2f2f2f]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">用量同步日志</h1>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">查看用量同步历史记录</p>
        </div>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="syncTime" label="同步时间" width="180" />
        <el-table-column prop="provider" label="供应商" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recordCount" label="同步记录数" width="120" />
        <el-table-column prop="duration" label="耗时(秒)" width="100" />
        <el-table-column prop="errorMessage" label="错误信息" min-width="200">
          <template #default="{ row }">
            <span v-if="row.errorMessage" class="text-red-500">{{ row.errorMessage }}</span>
            <span v-else class="text-gray-400">-</span>
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
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { usageApi } from '@/services/javaApi';

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

async function loadData() {
  loading.value = true;
  try {
    const res: any = await usageApi.syncLogs({
      page: currentPage.value,
      size: pageSize.value,
    });
    const data = res?.data || res?.records || res?.list || res || [];
    tableData.value = Array.isArray(data) ? data : (data.records || data.list || []);
    total.value = Number(data.total ?? res?.total ?? res?.count) || tableData.value.length;
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>
