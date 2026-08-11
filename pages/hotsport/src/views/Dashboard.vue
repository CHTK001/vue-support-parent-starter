<template>
  <div class="hotsport-dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="28"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>实时调用拓扑</span>
          </template>
          <ReEcharts :option="topologyOption" height="320px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>近期调用趋势</span>
          </template>
          <ReEcharts :option="trendOption" height="320px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ReEcharts from '@repo/ui/re-echarts';
import { getStats, getAgentDependencies } from '../api/hotsportApi';
import type { ApmStats, DependencyEdge } from '../api/types';
import { ElMessage } from 'element-plus';
import { DataLine, Document, Share, Warning } from '@element-plus/icons-vue';

const stats = ref<{ label: string; value: number; icon: any; color: string }[]>([]);
const dependencies = ref<DependencyEdge[]>([]);

const fetchStats = async () => {
  try {
    const res = await getStats();
    if (res.code === 0) {
      const d = res.data;
      stats.value = [
        { label: '调用次数', value: d.transmissionCount || 0, icon: DataLine, color: '#409eff' },
        { label: '追踪链路', value: d.traceCount || 0, icon: Document, color: '#67c23a' },
        { label: '依赖节点', value: d.dependencyCount || 0, icon: Share, color: '#e6a23c' },
        { label: '泄漏告警', value: d.leakCount || 0, icon: Warning, color: '#f56c6c' },
      ];
    }
  } catch (e) {
    ElMessage.error('获取统计数据失败');
  }
};

const fetchDependencies = async () => {
  try {
    const res = await getAgentDependencies();
    if (res.code === 0) {
      dependencies.value = res.data || [];
    }
  } catch (e) {
    // ignore
  }
};

const topologyOption = computed(() => {
  const nodes = new Map<string, { name: string; symbolSize: number }>();
  const edges: { source: string; target: string; value: number }[] = [];
  dependencies.value.forEach(dep => {
    if (!nodes.has(dep.source)) nodes.set(dep.source, { name: dep.source, symbolSize: 20 + dep.callCount * 0.1 });
    if (!nodes.has(dep.target)) nodes.set(dep.target, { name: dep.target, symbolSize: 20 + dep.callCount * 0.1 });
    edges.push({ source: dep.source, target: dep.target, value: dep.callCount });
  });
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'graph',
      layout: 'force',
      force: { repulsion: 200, edgeLength: 120 },
      roam: true,
      data: Array.from(nodes.values()),
      edges,
      categories: [],
      label: { show: true, position: 'bottom', fontSize: 10 },
      edgeSymbol: ['none', 'arrow'],
      edgeLabel: { show: true, formatter: (p: any) => p.data.value },
      lineStyle: { color: '#ccc', width: 1, curveness: 0.3 },
    }]
  };
});

const trendOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'] },
  yAxis: { type: 'value' },
  series: [{ data: [12, 18, 24, 16, 30, 22], type: 'line', smooth: true }]
};

onMounted(() => {
  fetchStats();
  fetchDependencies();
});
</script>

<style scoped>
.hotsport-dashboard { padding: 16px; }
.stat-card { margin-bottom: 16px; }
.stat-content { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; }
.stat-value { font-size: 24px; font-weight: 600; }
.stat-label { color: #909399; font-size: 14px; }
.chart-row { margin-top: 16px; }
.chart-card { margin-bottom: 16px; }
</style>