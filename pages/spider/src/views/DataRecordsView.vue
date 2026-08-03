<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input v-model="spiderCode" placeholder="爬虫编码" clearable style="width: 200px" @keyup.enter="reload" />
        <el-input v-model="executionNo" placeholder="执行批次号(可选)" clearable style="width: 220px" />
        <el-input-number v-model="depth" :min="0" :max="10" placeholder="深度" controls-position="right" />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="spiderId" label="ID" width="80" />
        <el-table-column prop="spiderExecutionNo" label="批次号" width="180" show-overflow-tooltip />
        <el-table-column prop="spiderTargetUrl" label="目标 URL" min-width="320" show-overflow-tooltip />
        <el-table-column prop="spiderDataName" label="数据项名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="spiderDepth" label="深度" width="80" />
        <el-table-column prop="spiderDataStatus" label="状态" width="100" />
        <el-table-column prop="createTime" label="采集时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPayload(row)">查看载荷</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="采集数据载荷" width="640">
      <pre class="payload">{{ payloadText }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { spiderApi } from '../api/spiderApi';
import type { DataRecord } from '../api/types';

const spiderCode = ref('');
const executionNo = ref('');
const depth = ref<number | undefined>(undefined);
const pageNo = ref(1);
const pageSize = ref(50);
const total = ref(0);
const loading = ref(false);
const records = ref<DataRecord[]>([]);

const dialogVisible = ref(false);
const payloadText = ref('');

const reload = async () => {
  if (!spiderCode.value) {
    ElMessage.warning('请先选择爬虫编码');
    return;
  }
  loading.value = true;
  try {
    const res = await spiderApi.pageDataRecords(
      spiderCode.value,
      executionNo.value || undefined,
      depth.value,
      pageNo.value,
      pageSize.value,
    );
    records.value = (res?.records ?? []) as DataRecord[];
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const openPayload = async (row: DataRecord) => {
  if (row.spiderId) {
    try {
      const full = await spiderApi.getDataRecord(row.spiderId);
      payloadText.value = full.spiderDataPayload ?? '';
    } catch {
      payloadText.value = row.spiderDataPayload ?? '';
    }
  } else {
    payloadText.value = row.spiderDataPayload ?? '';
  }
  dialogVisible.value = true;
};

onMounted(() => {
  // 默认从 query 取出 spiderCode（来自定义页跳转）
  const hash = window.location.hash;
  const match = hash.match(/spiderCode=([^&]+)/);
  if (match) spiderCode.value = decodeURIComponent(match[1]);
});
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
.payload {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 480px;
  overflow: auto;
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 12px;
}
</style>