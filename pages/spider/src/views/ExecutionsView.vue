<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input v-model="spiderCode" placeholder="爬虫编码" clearable style="width: 200px" @keyup.enter="reload" />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
        <el-button :icon="Refresh" @click="reload">刷新</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table v-loading="loading" :data="executions" border stripe>
        <el-table-column prop="spiderExecutionNo" label="批次号" width="180" show-overflow-tooltip />
        <el-table-column prop="spiderTriggerType" label="触发" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.spiderExecutionStatus)">{{ statusLabel(row.spiderExecutionStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="spiderMaxDepthReached" label="最大深度" width="100" />
        <el-table-column prop="spiderCollectedCount" label="采集条数" width="100" />
        <el-table-column prop="spiderUrlCompleted" label="URL完成" width="100" />
        <el-table-column prop="spiderUrlTotal" label="URL总数" width="100" />
        <el-table-column prop="spiderStartedAt" label="开始时间" width="180" />
        <el-table-column prop="spiderFinishedAt" label="结束时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.spiderExecutionStatus === 'RUNNING'" link type="danger" @click="stopRow(row)">停止</el-button>
            <el-button link type="primary" @click="pollStatus(row.spiderExecutionNo)">查看进度</el-button>
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
          @current-change="reload"
          @size-change="reload"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="`执行进度 ${currentNo}`" width="520">
      <div v-if="currentStatus">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="状态">{{ statusLabel(currentStatus.status) }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ currentStatus.completedCount }}</el-descriptions-item>
          <el-descriptions-item label="总数">{{ currentStatus.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="已采集">{{ currentStatus.collectedCount }}</el-descriptions-item>
          <el-descriptions-item label="最大深度">{{ currentStatus.maxDepthReached }}</el-descriptions-item>
          <el-descriptions-item label="爬虫编码">{{ currentStatus.spiderCode }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { spiderApi } from '../api/spiderApi';
import type { ExecutionRecord, ExecutionStatus } from '../api/types';

const spiderCode = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const executions = ref<ExecutionRecord[]>([]);

const dialogVisible = ref(false);
const currentStatus = ref<ExecutionStatus | null>(null);
const currentNo = ref('');

const reload = async () => {
  if (!spiderCode.value) {
    ElMessage.warning('请先输入爬虫编码');
    return;
  }
  loading.value = true;
  try {
    const res = await spiderApi.pageExecutions(spiderCode.value, pageNo.value, pageSize.value);
    executions.value = (res?.records ?? []) as ExecutionRecord[];
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const stopRow = async (row: ExecutionRecord) => {
  try {
    await ElMessageBox.confirm(`确认停止执行 ${row.spiderExecutionNo}?`, '提示', { type: 'warning' });
    await spiderApi.stop(row.spiderExecutionNo);
    ElMessage.success('已发送停止指令');
    reload();
  } catch (e) {
    if ((e as any) === 'cancel') return;
    ElMessage.error('停止失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const pollStatus = async (no: string) => {
  currentNo.value = no;
  try {
    currentStatus.value = await spiderApi.status(no);
    dialogVisible.value = true;
  } catch (e) {
    ElMessage.error('查询失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const statusType = (s?: string) =>
  ({ SUCCESS: 'success', FAILED: 'danger', RUNNING: 'warning', STOPPED: 'info' } as Record<string, string>)[s ?? ''] || 'info';

const statusLabel = (s?: string) =>
  ({ SUCCESS: '成功', FAILED: '失败', RUNNING: '运行中', STOPPED: '已停止' } as Record<string, string>)[s ?? ''] || s || '-';

onMounted(() => {
  const hash = window.location.hash;
  const match = hash.match(/spiderCode=([^&]+)/);
  if (match) spiderCode.value = decodeURIComponent(match[1]);
});
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
</style>