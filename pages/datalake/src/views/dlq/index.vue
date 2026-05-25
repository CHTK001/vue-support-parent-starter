<template>
  <div class="p-4">
    <!-- 工具栏 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">死信队列</span>
        <div class="flex gap-2">
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
          <el-popconfirm title="确定清空所有死信?" @confirm="handleClear">
            <template #reference>
              <el-button type="danger">清空</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="traceId" label="Trace ID" width="300" show-overflow-tooltip />
        <el-table-column prop="pipelineId" label="Pipeline ID" width="180" />
        <el-table-column prop="errorMessage" label="错误信息" min-width="250" show-overflow-tooltip />
        <el-table-column prop="failCount" label="失败次数" width="100" align="center" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="flex gap-1">
              <el-button type="primary" size="small" @click="handleRetry(row.id)">重试</el-button>
              <el-popconfirm title="确定删除?" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          :page-size="20"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { fetchDlqList, fetchRetryDlq, fetchDeleteDlq, fetchClearDlq } from "../../api/dlq";
import type { DlqEntry } from "../../types";

defineOptions({ name: "DatalakeDlqPage" });

const loading = ref(false);
const list = ref<DlqEntry[]>([]);
const page = ref(1);
const total = ref(0);

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchDlqList(page.value);
    list.value = data?.data || [];
    total.value = data?.data?.length || 0;
  } catch {} finally {
    loading.value = false;
  }
};

const handleRetry = async (id: number) => {
  try {
    await fetchRetryDlq(id);
    ElMessage.success("重试成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "重试失败");
  }
};

const handleDelete = async (id: number) => {
  try {
    await fetchDeleteDlq(id);
    ElMessage.success("删除成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "删除失败");
  }
};

const handleClear = async () => {
  try {
    await fetchClearDlq();
    ElMessage.success("清空成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "清空失败");
  }
};

onMounted(loadData);
</script>
