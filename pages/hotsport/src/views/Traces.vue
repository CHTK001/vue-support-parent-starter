"<template>
  <div class=\"hotsport-traces\">
    <el-card shadow=\"hover\">
      <template #header>
        <div style=\"display:flex; justify-content:space-between; align-items:center;\">
          <span>实时追踪 (Spans)</span>
          <el-button type=\"primary\" size=\"small\" @click=\"refresh\">刷新</el-button>
        </div>
      </template>
      <el-table :data=\"traces\" border stripe style=\"width:100%\">
        <el-table-column prop=\"traceId\" label=\"Trace ID\" width=\"180\" />
        <el-table-column prop=\"spanId\" label=\"Span ID\" width=\"120\" />
        <el-table-column prop=\"className\" label=\"类名\" min-width=\"160\" />
        <el-table-column prop=\"methodName\" label=\"方法\" min-width=\"140\" />
        <el-table-column prop=\"durationMs\" label=\"耗时(ms)\" width=\"100\" align=\"center\">
          <template #default=\"{ row }\">
            <el-tag :type=\"row.durationMs > 100 ? 'danger' : 'success'\" size=\"small\">
              {{ row.durationMs.toFixed(1) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop=\"status\" label=\"状态\" width=\"80\" align=\"center\">
          <template #default=\"{ row }\">
            <el-tag :type=\"row.status === 'OK' ? 'success' : 'danger'\" size=\"small\">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop=\"startTime\" label=\"开始时间\" width=\"180\" />
      </el-table>
      <el-pagination
        v-model:current-page=\"page\"
        v-model:page-size=\"size\"
        :total=\"total\"
        layout=\"total, prev, pager, next\"
        @current-change=\"fetchTraces\"
        style=\"margin-top:16px; justify-content:flex-end;\"
      />
    </el-card>
  </div>
</template>

<script setup lang=\"ts\">
import { ref, onMounted } from 'vue';
import { getAgentTraces } from '../api/hotsportApi';
import type { TraceSpan } from '../api/types';
import { ElMessage } from 'element-plus';

const traces = ref<TraceSpan[]>([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const fetchTraces = async () => {
  try {
    const res = await getAgentTraces();
    if (res.code === 0) {
      traces.value = res.data || [];
      total.value = traces.value.length;
    }
  } catch (e) {
    ElMessage.error('获取追踪数据失败');
  }
};

const refresh = () => fetchTraces();

onMounted(fetchTraces);
</script>"