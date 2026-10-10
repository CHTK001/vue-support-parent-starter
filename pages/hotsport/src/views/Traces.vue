<template>
  <div class="hotsport-traces">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>{{ t('hotsport.traces.title') }}</span>
          <el-button type="primary" @click="refresh">{{ t('hotsport.refresh') }}</el-button>
        </div>
      </template>
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
           边框/斑马纹样式，既有 :deep(.el-table…) 覆盖和 e2e 选择器一概不失效；
           pagination=false —— 分页仍由下方 el-pagination 自管，否则会多出一套页码控件；
           toolbar=false 不新增工具栏按钮（按钮清单与改造前逐个一致）；
           原 el-table 的 border 走 ReTable 默认（border: true），stripe 走同名 prop。 -->
      <ReTable
        :data="traces"
        :columns="traceColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        stripe
        style="width:100%"
      >
        <template #col-durationMs="{ row }">
          <el-tag :type="durationMs(row) > 100 ? 'danger' : 'success'">
            {{ durationMs(row).toFixed(1) }}
          </el-tag>
        </template>
        <template #col-status="{ row }">
          <el-tag :type="(!row.status || row.status === 'OK') ? 'success' : 'danger'">
            {{ row.status || 'OK' }}
          </el-tag>
        </template>
      </ReTable>
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
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { getAgentTraces } from '../api/hotsportApi';
import type { TraceSpan } from '../api/types';
import { ElMessage } from 'element-plus';

const { t } = useI18n();
const traces = ref<TraceSpan[]>([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);

/**
 * 列配置：原来散在模板里的 7 个 el-table-column 收敛到这里。
 *
 * <p>用 computed 而不是普通常量 —— 列标题里有 {@code t(...)}，写成常量只在
 * setup 时算一次，切语言表头不会跟着变（原模板里的 {@code :label="t(…)")}
 * 是每次渲染都算的）。</p>
 */
const traceColumns = computed<ReTableColumn[]>(() => [
  { prop: 'traceId', label: 'Trace ID', width: 180 },
  { prop: 'spanId', label: 'Span ID', width: 120 },
  { prop: 'className', label: t('hotsport.traces.className'), minWidth: 160 },
  { prop: 'methodName', label: t('hotsport.traces.method'), minWidth: 140 },
  { prop: 'durationMs', label: t('hotsport.traces.durationMs'), width: 100, align: 'center' },
  { prop: 'status', label: t('hotsport.traces.status'), width: 80, align: 'center' },
  { prop: 'startTime', label: t('hotsport.traces.startTime'), width: 180 },
]);

/** 耗时数值（旧列只有 label 没有 prop，这里顺带把取值口径收成一个函数，插槽里不再重复三元） */
function durationMs(row: Record<string, unknown>): number {
  const span = row as unknown as TraceSpan;
  return Number(span.durationMs ?? span.duration ?? 0);
}

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