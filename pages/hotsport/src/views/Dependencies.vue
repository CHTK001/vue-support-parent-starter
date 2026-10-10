<template>
  <div class="hotsport-dependencies">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>{{ t('hotsport.dependencies.title') }}</span>
          <div>
            <el-button-group>
              <el-button :type="viewMode === 'graph' ? 'primary' : 'default'"  @click="viewMode = 'graph'">{{ t('hotsport.graph') }}</el-button>
              <el-button :type="viewMode === 'table' ? 'primary' : 'default'"  @click="viewMode = 'table'">{{ t('hotsport.list') }}</el-button>
            </el-button-group>
            <el-button type="primary"  @click="refresh" :loading="loading">{{ t('hotsport.refresh') }}</el-button>
          </div>
        </div>
      </template>
      <div v-if="viewMode === 'graph'" class="deps-graph-wrapper">
        <ReRelationGraph :nodes="graphNodes" :lines="graphLines" height="500px" />
      </div>
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
           e2e 选择器；pagination=false / toolbar=false —— 原表既无分页也无工具栏按钮；
           原 el-table 带 border → 走 ReTable 默认边框（border: true），stripe 走同名 prop；
           layout-table.minHeight=0 关掉组件默认的 440px 撑高与 fill 自适应。 -->
      <ReTable
        v-else
        :data="edges as unknown as Record<string, unknown>[]"
        :columns="edgeColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        stripe
        :layout-table="{ minHeight: 0 }"
        style="width:100%"
      >
        <template #col-errorCount="{ row }">
          <el-tag :type="errorCountOf(row) > 0 ? 'danger' : 'success'" >
            {{ errorCountOf(row) }}
          </el-tag>
        </template>
      </ReTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { getDependencies } from '../api/hotsportApi';
import type { DependencyEdge } from '../api/types';
import type { JsonNode, JsonLine } from '@relation-graph/vue3';

import { formatDuration } from '@repo/ui/re-time';
import { costMs } from '@repo/utils';

// ReRelationGraph 的 default 是已包装好的异步组件，直接交给 defineAsyncComponent 即可；
// 写成 `m.default()` 会抛 "m.default is not a function"，图区会整块空白
const ReRelationGraph = defineAsyncComponent(() =>
  import('@repo/ui/re-relation-graph').then((m) => m.default),
);

const { t } = useI18n();
const edges = ref<DependencyEdge[]>([]);
const loading = ref(false);
const viewMode = ref<'graph' | 'table'>('graph');

/**
 * 列表视图的列配置：原来散在模板里的 6 个 el-table-column 收敛到这里。
 *
 * <p>列标题里有 {@code t(...)}，写成常量只在 setup 时算一次，切语言表头不会跟着变
 * （原模板里的 {@code :label="t(…)"} 是每次渲染都算的），所以用 computed。</p>
 */
const edgeColumns = computed<ReTableColumn[]>(() => [
  { prop: 'source', label: t('hotsport.dependencies.source'), minWidth: 140 },
  { prop: 'target', label: t('hotsport.dependencies.target'), minWidth: 140 },
  { prop: 'callCount', label: t('hotsport.dependencies.callCount'), width: 100, align: 'center' },
  {
    prop: 'errorCount',
    label: t('hotsport.dependencies.errorCount'),
    width: 100,
    align: 'center',
    slot: 'errorCount',
  },
  { prop: 'avgDurationMs', label: t('hotsport.dependencies.avgDurationMs'), width: 120, align: 'center' },
  { prop: 'lastCallAt', label: t('hotsport.dependencies.lastCallAt'), width: 180 },
]);

/** 插槽里的 row 是宽类型（unknown）：错误次数是比较/插值入参，先收窄成 number */
function errorCountOf(row: Record<string, unknown>): number {
  return Number(row.errorCount ?? 0);
}

const graphNodes = computed<JsonNode[]>(() => {
  const nodeSet = new Map<string, number>();
  edges.value.forEach((e) => {
    nodeSet.set(e.source, (nodeSet.get(e.source) || 0) + e.callCount);
    nodeSet.set(e.target, (nodeSet.get(e.target) || 0) + e.callCount);
  });
  return Array.from(nodeSet.entries()).map(([id, totalCalls]) => ({
    id,
    text: `${id} (${totalCalls})`,
  }));
});

const graphLines = computed<JsonLine[]>(() =>
  edges.value.map((e) => ({
    id: `${e.source}->${e.target}`,
    from: e.source,
    to: e.target,
    text: formatDuration(costMs(e.avgDurationMs) ?? 0),
    color: e.errorCount > 0 ? '#f56c6c' : '#67c23a',
  })),
);

const fetchEdges = async () => {
  loading.value = true;
  try {
    const res = (await getDependencies()) as DependencyEdge[] | { items?: DependencyEdge[] };
    edges.value = Array.isArray(res) ? res : (res.items || []);
  } catch (e) {
    message.error(t('hotsport.dependencies.fetchError'));
  } finally {
    loading.value = false;
  }
};

const refresh = () => fetchEdges();

onMounted(fetchEdges);
</script>

<style scoped>
.hotsport-dependencies {
  height: 100%;
}
.deps-graph-wrapper {
  width: 100%;
  min-height: 520px;
}
</style>
