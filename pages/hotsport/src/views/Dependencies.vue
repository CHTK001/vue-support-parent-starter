<template>
  <div class="hotsport-dependencies">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>服务依赖关系</span>
          <div>
            <el-button-group>
              <el-button :type="viewMode === 'graph' ? 'primary' : 'default'" size="small" @click="viewMode = 'graph'">关系图</el-button>
              <el-button :type="viewMode === 'table' ? 'primary' : 'default'" size="small" @click="viewMode = 'table'">列表</el-button>
            </el-button-group>
            <el-button type="primary" size="small" @click="refresh" :loading="loading">刷新</el-button>
          </div>
        </div>
      </template>
      <div v-if="viewMode === 'graph'" class="deps-graph-wrapper">
        <ReGraphRelation :nodes="graphNodes" :lines="graphLines" height="500px" />
      </div>
      <el-table v-else :data="edges" border stripe style="width:100%">
        <el-table-column prop="source" label="源服务" min-width="140" />
        <el-table-column prop="target" label="目标服务" min-width="140" />
        <el-table-column prop="callCount" label="调用次数" width="100" align="center" />
        <el-table-column prop="errorCount" label="错误数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.errorCount > 0 ? 'danger' : 'success'" size="small">
              {{ row.errorCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgDurationMs" label="平均耗时(ms)" width="120" align="center" />
        <el-table-column prop="lastCallAt" label="最后调用" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getDependencies } from '../api/hotsportApi';
import type { DependencyEdge } from '../api/types';
import type { JsonNode, JsonLine } from '@relation-graph/vue3';
import { ElMessage } from 'element-plus';
import ReGraphRelation from '@repo/ui/re-graph-relation';

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
    from: e.source,
    to: e.target,
    text: `${e.avgDurationMs}ms`,
    color: e.errorCount > 0 ? '#f56c6c' : '#67c23a',
  })),
);

const fetchEdges = async () => {
  loading.value = true;
  try {
    const res = await getDependencies();
    if (res.code === 0) {
      edges.value = res.data || [];
    }
  } catch (e) {
    ElMessage.error('获取依赖数据失败');
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
