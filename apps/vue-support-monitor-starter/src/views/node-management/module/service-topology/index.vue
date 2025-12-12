<template>
  <div class="service-topology">
    <!-- 工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>
            <IconifyIconOnline icon="ri:share-line" />
            服务关系图谱
          </h3>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新" placement="top">
            <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadTopologyData" />
          </el-tooltip>
          <el-tooltip content="重置视图" placement="top">
            <el-button :icon="RefreshRight" @click="resetView" />
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <ScCard
        layout="stats"
        label="服务节点"
        :value="topologyData.nodes.length"
        icon="ri:server-line"
        theme="primary"
        hoverable
      />
      <ScCard
        layout="stats"
        label="调用关系"
        :value="topologyData.edges.length"
        icon="ri:links-line"
        theme="success"
        hoverable
      />
      <ScCard
        layout="stats"
        label="总调用次数"
        :value="totalCallCount"
        icon="ri:bar-chart-line"
        theme="purple"
        hoverable
      />
    </div>

    <!-- 图谱容器 -->
    <el-card class="graph-card" shadow="never">
      <div ref="graphContainer" class="graph-container" v-loading="loading" />
      
      <el-empty v-if="!loading && topologyData.nodes.length === 0" description="暂无服务拓扑数据" />
    </el-card>

    <!-- 节点详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="节点详情"
      direction="rtl"
      size="400px"
    >
      <div v-if="selectedNode" class="node-detail">
        <div class="detail-header">
          <IconifyIconOnline icon="ri:server-line" class="node-icon" />
          <div class="node-info">
            <h3>{{ selectedNode.label }}</h3>
            <span class="node-address">{{ selectedNode.id }}</span>
          </div>
        </div>

        <el-divider />

        <h4>调用关系</h4>
        <div class="relations-list">
          <div
            v-for="edge in getNodeEdges(selectedNode.id)"
            :key="edge.source + edge.target"
            class="relation-item"
          >
            <div class="relation-direction">
              <span class="source">{{ edge.source }}</span>
              <IconifyIconOnline icon="ri:arrow-right-line" />
              <span class="target">{{ edge.target }}</span>
            </div>
            <div class="relation-stats">
              <el-tag size="small" type="info">
                调用 {{ edge.callCount }} 次
              </el-tag>
              <span class="last-time">
                {{ formatTime(edge.lastCallTime) }}
              </span>
            </div>
          </div>
          
          <el-empty v-if="getNodeEdges(selectedNode.id).length === 0" description="暂无调用关系" :image-size="60" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { Refresh, RefreshRight } from "@element-plus/icons-vue";
import { message } from "@repo/utils";
import {
  getServiceTopologyForAgent,
  type ServiceTopologyData,
  type TopologyNode,
  type TopologyEdge,
} from "@/api/server/agent-data";
import * as echarts from "echarts";

// 数据
const topologyData = ref<ServiceTopologyData>({
  nodes: [],
  edges: [],
});
const loading = ref(false);

// 图表
const graphContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 详情
const detailVisible = ref(false);
const selectedNode = ref<TopologyNode | null>(null);

/**
 * 总调用次数
 */
const totalCallCount = computed(() => {
  return topologyData.value.edges.reduce((sum, edge) => sum + edge.callCount, 0);
});

/**
 * 加载拓扑数据
 */
const loadTopologyData = async () => {
  loading.value = true;
  try {
    const response = await getServiceTopologyForAgent();
    if (response.success && response.data) {
      topologyData.value = response.data;
      await nextTick();
      renderGraph();
    } else {
      topologyData.value = { nodes: [], edges: [] };
    }
  } catch (error) {
    console.error("加载服务拓扑失败:", error);
    message("加载服务拓扑失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 渲染图谱
 */
const renderGraph = () => {
  if (!graphContainer.value || topologyData.value.nodes.length === 0) return;

  if (!chartInstance) {
    chartInstance = echarts.init(graphContainer.value);
  }

  const nodes = topologyData.value.nodes.map((node) => ({
    id: node.id,
    name: node.label,
    symbolSize: 50,
    category: 0,
    label: {
      show: true,
      position: "bottom" as const,
      formatter: node.label,
    },
    itemStyle: {
      color: "#409EFF",
    },
  }));

  const edges = topologyData.value.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    value: edge.callCount,
    lineStyle: {
      width: Math.min(edge.callCount / 10 + 1, 5),
      curveness: 0.2,
    },
    label: {
      show: true,
      formatter: `${edge.callCount}`,
      fontSize: 10,
    },
  }));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { dataType: string; data: { name?: string; source?: string; target?: string; value?: number } };
        if (p.dataType === "node") {
          return `<b>${p.data.name}</b>`;
        }
        if (p.dataType === "edge") {
          return `${p.data.source} → ${p.data.target}<br/>调用次数: ${p.data.value}`;
        }
        return "";
      },
    },
    series: [
      {
        type: "graph",
        layout: "force",
        animation: true,
        data: nodes,
        links: edges,
        roam: true,
        draggable: true,
        force: {
          repulsion: 300,
          gravity: 0.1,
          edgeLength: 150,
        },
        emphasis: {
          focus: "adjacency",
          lineStyle: {
            width: 5,
          },
        },
        edgeSymbol: ["none", "arrow"],
        edgeSymbolSize: [0, 10],
        lineStyle: {
          color: "#aaa",
          opacity: 0.6,
        },
      },
    ],
  };

  chartInstance.setOption(option);

  chartInstance.on("click", (params: unknown) => {
    const p = params as { dataType: string; data: { id?: string } };
    if (p.dataType === "node" && p.data?.id) {
      const node = topologyData.value.nodes.find((n) => n.id === p.data.id);
      if (node) {
        selectedNode.value = node;
        detailVisible.value = true;
      }
    }
  });
};

/**
 * 重置视图
 */
const resetView = () => {
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: "restore",
    });
  }
};

/**
 * 获取节点相关的边
 */
const getNodeEdges = (nodeId: string): TopologyEdge[] => {
  return topologyData.value.edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId
  );
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
};

/**
 * 窗口大小变化
 */
const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  loadTopologyData();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
});
</script>

<style lang="scss" scoped>
.service-topology {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;

  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .toolbar-right {
        display: flex;
        gap: 8px;
      }
    }
  }

  .stats-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .graph-card {
    .graph-container {
      width: 100%;
      height: 600px;
    }
  }

  .node-detail {
    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;

      .node-icon {
        font-size: 48px;
        color: var(--el-color-primary);
      }

      .node-info {
        h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .node-address {
          color: var(--el-text-color-secondary);
          font-size: 14px;
          font-family: monospace;
        }
      }
    }

    h4 {
      margin: 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .relations-list {
      .relation-item {
        padding: 12px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        margin-bottom: 12px;

        .relation-direction {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;

          .source,
          .target {
            font-family: monospace;
            padding: 2px 8px;
            background: var(--el-fill-color-light);
            border-radius: 4px;
          }
        }

        .relation-stats {
          display: flex;
          align-items: center;
          gap: 12px;

          .last-time {
            color: var(--el-text-color-secondary);
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>
