<template>
  <div class="page-container">
    <el-card shadow="never" class="header-bar">
      <div class="flex items-center gap-3">
        <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
        <div class="title">{{ flowCode }} 调试日志</div>
        <el-tag v-if="executionNo">批次: {{ executionNo }}</el-tag>
        <div class="flex-1" />
        <el-input v-model="executionNo" placeholder="批次号（executionNo）" clearable style="width: 320px" />
        <el-button type="primary" :icon="Search" @click="load">查询</el-button>
        <el-button type="success" :icon="VideoPlay" :loading="running" @click="runAgain">运行一次</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table v-loading="loading" :data="logs" border stripe>
        <el-table-column prop="flowNodeKey" label="节点" width="140" />
        <el-table-column prop="flowNodeType" label="类型" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.flowNodeStatus)">{{ row.flowNodeStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="flowNodeCostMs" label="耗时(ms)" width="100" />
        <el-table-column prop="createTime" label="执行时间" width="180" />
        <el-table-column prop="flowNodeMessage" label="输出 / 异常" min-width="320" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 流程调试执行页：回放节点执行日志（按 executionNo 或流程编码）。
 */
import { onMounted, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Search, VideoPlay } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { spiderApi } from '../api/spiderApi';
import type { FlowNodeLog } from '../api/types';

const route = useRoute();
const router = useRouter();
const flowCode = computed<string>(() => String(route.params.code ?? ''));
const executionNo = ref<string>(String(route.query.executionNo ?? ''));
const loading = ref(false);
const running = ref(false);
const logs = ref<FlowNodeLog[]>([]);

const goBack = () => router.push('/spider/flow-list');

const statusTag = (s?: string) => {
  if (s === 'SUCCESS') return 'success';
  if (s === 'FAILED') return 'danger';
  return 'info';
};

const load = async () => {
  loading.value = true;
  try {
    const params: { executionNo?: string } = {};
    if (executionNo.value) params.executionNo = executionNo.value;
    logs.value = await spiderApi.flowNodeLogs(params);
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const runAgain = async () => {
  running.value = true;
  try {
    const newNo = await spiderApi.runFlow(flowCode.value);
    executionNo.value = newNo;
    ElMessage.success(`执行成功: ${newNo}`);
    await load();
  } catch (e) {
    ElMessage.error('执行失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    running.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.page-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header-bar :deep(.el-card__body) {
  padding: 10px 16px;
}
.title {
  font-weight: 600;
  font-size: 16px;
  margin-left: 8px;
}
</style>
