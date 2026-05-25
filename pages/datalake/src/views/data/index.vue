<template>
  <div class="p-4">
    <!-- 查询表单 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="queryForm" inline>
        <el-form-item label="Pipeline ID">
          <el-input v-model="queryForm.pipelineId" placeholder="输入 Pipeline ID" clearable />
        </el-form-item>
        <el-form-item label="每页条数">
          <el-input-number v-model="queryForm.limit" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Trace 追踪 -->
    <el-card shadow="never" class="mb-4">
      <el-form inline>
        <el-form-item label="Trace ID 追踪">
          <el-input v-model="traceId" placeholder="输入 Trace ID" clearable style="width: 400px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleTrace" :loading="traceLoading">追踪</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Trace 结果 -->
    <el-card v-if="traceResult" shadow="never" class="mb-4">
      <template #header>
        <span>链路追踪结果</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="Trace ID">{{ traceResult.traceId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ traceResult.state }}</el-descriptions-item>
        <el-descriptions-item label="Pipeline ID">{{ traceResult.pipelineId }}</el-descriptions-item>
        <el-descriptions-item label="设备 ID">{{ traceResult.deviceId }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ traceResult.retryCount }}</el-descriptions-item>
        <el-descriptions-item label="时间戳">{{ new Date(traceResult.timestamp).toLocaleString() }}</el-descriptions-item>
      </el-descriptions>
      <div class="mt-3">
        <h4 class="mb-2 font-bold">Trace Log:</h4>
        <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm max-h-60 overflow-auto">
          <div v-for="(log, i) in traceResult.traceLog" :key="i" class="py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
            {{ log }}
          </div>
        </div>
      </div>
    </el-card>

    <!-- 查询结果 -->
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span>查询结果</span>
          <el-tag v-if="result">共 {{ result.total }} 条</el-tag>
        </div>
      </template>
      <el-table :data="result?.data || []" v-loading="loading" stripe>
        <el-table-column prop="traceId" label="Trace ID" width="280" show-overflow-tooltip />
        <el-table-column prop="pipelineId" label="Pipeline ID" width="180" />
        <el-table-column prop="state" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="stateType(row.state)">{{ row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据" min-width="300">
          <template #default="{ row }">
            <el-tag v-for="(v, k) in (row.parsed || {})" :key="k" class="mr-1 mb-1" size="small">
              {{ k }}: {{ v }}
            </el-tag>
            <span v-if="!row.parsed || Object.keys(row.parsed).length === 0" class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ new Date(row.timestamp).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重试" width="80" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { fetchDataQuery, fetchTrace } from "../../api/data";
import type { QueryResult, DataEnvelope } from "../../types";

defineOptions({ name: "DatalakeDataPage" });

const loading = ref(false);
const traceLoading = ref(false);
const traceId = ref("");
const traceResult = ref<DataEnvelope | null>(null);
const result = ref<QueryResult | null>(null);

const queryForm = reactive({ pipelineId: "", limit: 20, offset: 0 });

const stateType = (state: string) => {
  const map: Record<string, string> = {
    SINK_OK: "success", STANDARDIZED: "success", PUSHED: "success",
    SINK_FAIL: "danger", FILTERED: "warning",
  };
  return map[state] || "info";
};

const handleQuery = async () => {
  if (!queryForm.pipelineId) {
    ElMessage.warning("请输入 Pipeline ID");
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchDataQuery(queryForm);
    result.value = data?.data || null;
  } catch (e: any) {
    ElMessage.error(e?.msg || "查询失败");
  } finally {
    loading.value = false;
  }
};

const handleTrace = async () => {
  if (!traceId.value) {
    ElMessage.warning("请输入 Trace ID");
    return;
  }
  traceLoading.value = true;
  try {
    const { data } = await fetchTrace(traceId.value);
    traceResult.value = data?.data || null;
    if (!traceResult.value) ElMessage.warning("未找到该 Trace");
  } catch (e: any) {
    ElMessage.error(e?.msg || "追踪失败");
    traceResult.value = null;
  } finally {
    traceLoading.value = false;
  }
};
</script>
