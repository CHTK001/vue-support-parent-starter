<template>
  <div class="hotsport-traces">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>{{ t('hotsport.traces.title') }}</span>
          <el-button type="primary" @click="refresh">{{ t('hotsport.refresh') }}</el-button>
        </div>
      </template>
      <el-table :data="traces" border stripe style="width:100%">
        <el-table-column prop="traceId" label="Trace ID" width="180" />
        <el-table-column prop="spanId" label="Span ID" width="120" />
        <el-table-column prop="className" :label="t('hotsport.traces.className')" min-width="160" />
        <el-table-column prop="methodName" :label="t('hotsport.traces.method')" min-width="140" />
        <el-table-column :label="t('hotsport.traces.durationMs')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.durationMs ?? row.duration ?? 0) > 100 ? 'danger' : 'success'" >
              {{ ((row.durationMs ?? row.duration ?? 0)).toFixed(1) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('hotsport.traces.status')" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="(!row.status || row.status === 'OK') ? 'success' : 'danger'" >
              {{ row.status || 'OK' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" :label="t('hotsport.traces.startTime')" width="180" />
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchTraces"
        style="margin-top:16px; justify-content:flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAgentTraces } from '../api/hotsportApi';
import type { TraceSpan } from '../api/types';
import { ElMessage } from 'element-plus';

const { t } = useI18n();
const traces = ref<TraceSpan[]>([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const fetchTraces = async () => {
  try {
    traces.value = (await getAgentTraces()) || [];
    total.value = traces.value.length;
  } catch (e) {
    ElMessage.error(t('hotsport.traces.fetchError'));
  }
};

const refresh = () => fetchTraces();

onMounted(fetchTraces);
</script>