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
        <ReGraphRelation :nodes="graphNodes" :lines="graphLines" height="500px" />
      </div>
      <el-table v-else :data="edges" border stripe style="width:100%">
        <el-table-column prop="source" :label="t('hotsport.dependencies.source')" min-width="140" />
        <el-table-column prop="target" :label="t('hotsport.dependencies.target')" min-width="140" />
        <el-table-column prop="callCount" :label="t('hotsport.dependencies.callCount')" width="100" align="center" />
        <el-table-column prop="errorCount" :label="t('hotsport.dependencies.errorCount')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.errorCount > 0 ? 'danger' : 'success'" >
              {{ row.errorCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgDurationMs" :label="t('hotsport.dependencies.avgDurationMs')" width="120" align="center" />
        <el-table-column prop="lastCallAt" :label="t('hotsport.dependencies.lastCallAt')" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { getDependencies } from '../api/hotsportApi';
import type { DependencyEdge } from '../api/types';
import type { JsonNode, JsonLine } from '@relation-graph/vue3';
import { ElMessage } from 'element-plus';
import { formatDuration } from '@repo/ui/re-time';
import { costMs } from '@repo/utils';

// ReGraphRelation 的 default 是已包装好的异步组件，直接交给 defineAsyncComponent 即可；
// 写成 `m.default()` 会抛 "m.default is not a function"，图区会整块空白
const ReGraphRelation = defineAsyncComponent(() =>
  import('@repo/ui/re-graph-relation').then((m) => m.default),
);

const { t } = useI18n();
const edges = ref<DependencyEdge[]>([]);
const loading = ref(false);
const viewMode = ref<'graph' | 'table'>('graph');

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
    ElMessage.error(t('hotsport.dependencies.fetchError'));
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
