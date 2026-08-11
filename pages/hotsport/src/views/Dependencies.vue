<template>
  <div class="hotsport-dependencies">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>服务依赖关系</span>
          <el-button type="primary" size="small" @click="refresh">刷新</el-button>
        </div>
      </template>
      <el-table :data="edges" border stripe style="width:100%">
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
import { ref, onMounted } from 'vue';
import { getDependencies } from '../api/hotsportApi';
import type { DependencyEdge } from '../api/types';
import { ElMessage } from 'element-plus';

const edges = ref<DependencyEdge[]>([]);

const fetchEdges = async () => {
  try {
    const res = await getDependencies();
    if (res.code === 0) {
      edges.value = res.data || [];
    }
  } catch (e) {
    ElMessage.error('获取依赖数据失败');
  }
};

const refresh = () => fetchEdges();

onMounted(fetchEdges);
</script>