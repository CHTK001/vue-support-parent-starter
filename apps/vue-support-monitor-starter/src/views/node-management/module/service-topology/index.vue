<template>
  <div class="service-topology system-container modern-bg">
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
          <el-tooltip content="适应画布" placement="top">
            <el-button :icon="FullScreen" @click="fitView" />
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
    <sc-drawer
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
    </sc-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { Refresh, RefreshRight, FullScreen } from "@element-plus/icons-vue";
import { message } from "@repo/utils";
import {
  getServiceTopologyForAgent,
  type ServiceTopologyData,
  type TopologyNode,
  type TopologyEdge,
} from "@/api/server/agent-data";
import { Graph, register, Quadratic } from "@antv/g6";
import type { IEdge } from "@antv/g6";

// 数据
const topologyData = ref<ServiceTopologyData>({
  nodes: [],
  edges: [],
});
const loading = ref(false);

// G6 图实例
const graphContainer = ref<HTMLElement | null>(null);
let graphInstance: Graph | null = null;

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
 * 注册线条流动动画
 */
const registerEdgeAnimation = () => {
  // 创建自定义边类，继承自 Quadratic
  class FlowLineEdge extends Quadratic {
    afterDraw(cfg: any, group: any) {
      if (!cfg || !group) return;
      
      const shape = group.get("children")[0];
      if (!shape) return;

      const startPoint = shape.getPoint(0);
      const endPoint = shape.getPoint(1);
      
      // 创建流动的圆点
      const circle = group.addShape("circle", {
        attrs: {
          x: startPoint.x,
          y: startPoint.y,
          fill: "#1890ff",
          r: 4,
          shadowColor: "#1890ff",
          shadowBlur: 10,
        },
        name: "flow-circle",
      });

      // 执行动画
      circle.animate(
        (ratio: number) => {
          const point = shape.getPoint(ratio);
          return {
            x: point.x,
            y: point.y,
          };
        },
        {
          repeat: true,
          duration: 2000,
          easing: "easeLinear",
        }
      );
    }
  }

  // 注册自定义边
  register("edge", "flow-line", FlowLineEdge);
};

/**
 * 渲染 G6 图谱
 */
const renderGraph = () => {
  if (!graphContainer.value || topologyData.value.nodes.length === 0) return;

  // 注册动画边
  registerEdgeAnimation();

  const width = graphContainer.value.clientWidth || 800;
  const height = graphContainer.value.clientHeight || 600;

  // 构建 G6 数据
  const nodes = topologyData.value.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: "circle",
    size: 60,
    style: {
      fill: "#409EFF",
      stroke: "#1677ff",
      lineWidth: 2,
      shadowColor: "rgba(64, 158, 255, 0.3)",
      shadowBlur: 10,
    },
    labelCfg: {
      position: "bottom" as const,
      offset: 10,
      style: {
        fill: "#333",
        fontSize: 12,
        fontWeight: 500,
      },
    },
  }));

  const edges = topologyData.value.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    type: "flow-line",
    label: `${edge.callCount}`,
    style: {
      stroke: "#91d5ff",
      lineWidth: Math.min(edge.callCount / 10 + 1, 5),
      endArrow: {
        type: "triangle",
        size: 8,
        fill: "#91d5ff",
      },
    },
    labelCfg: {
      autoRotate: true,
      style: {
        fill: "#666",
        fontSize: 10,
        background: {
          fill: "#fff",
          padding: [2, 4, 2, 4],
          radius: 2,
        },
      },
    },
  }));

  // 销毁旧实例
  if (graphInstance) {
    graphInstance.destroy();
  }

  // 创建 G6 图实例
  graphInstance = new Graph({
    container: graphContainer.value,
    width,
    height,
    fitView: true,
    fitViewPadding: 50,
    animate: true,
    modes: {
      default: ["drag-canvas", "zoom-canvas", "drag-node"],
    },
    layout: {
      type: "force",
      preventOverlap: true,
      nodeStrength: -300,
      edgeStrength: 0.1,
      linkDistance: 200,
      nodeSpacing: 50,
    },
    defaultNode: {
      type: "circle",
      size: 60,
      style: {
        fill: "#409EFF",
        stroke: "#1677ff",
        lineWidth: 2,
      },
    },
    defaultEdge: {
      type: "flow-line",
      style: {
        stroke: "#91d5ff",
        lineWidth: 2,
      },
    },
    nodeStateStyles: {
      hover: {
        fill: "#69c0ff",
        shadowColor: "rgba(64, 158, 255, 0.6)",
        shadowBlur: 20,
      },
      selected: {
        fill: "#1890ff",
        stroke: "#096dd9",
        lineWidth: 3,
      },
    },
    edgeStateStyles: {
      hover: {
        stroke: "#1890ff",
        lineWidth: 3,
      },
    },
  });

  // 加载数据
  graphInstance.data({ nodes, edges });
  graphInstance.render();

  // 节点点击事件
  graphInstance.on("node:click", (evt) => {
    const nodeId = evt.item?.getID();
    if (nodeId) {
      const node = topologyData.value.nodes.find((n) => n.id === nodeId);
      if (node) {
        selectedNode.value = node;
        detailVisible.value = true;
      }
    }
  });

  // 节点悬停效果
  graphInstance.on("node:mouseenter", (evt) => {
    const node = evt.item;
    if (node) {
      graphInstance?.setItemState(node, "hover", true);
    }
  });

  graphInstance.on("node:mouseleave", (evt) => {
    const node = evt.item;
    if (node) {
      graphInstance?.setItemState(node, "hover", false);
    }
  });

  // 边悬停效果
  graphInstance.on("edge:mouseenter", (evt) => {
    const edge = evt.item;
    if (edge) {
      graphInstance?.setItemState(edge, "hover", true);
    }
  });

  graphInstance.on("edge:mouseleave", (evt) => {
    const edge = evt.item;
    if (edge) {
      graphInstance?.setItemState(edge, "hover", false);
    }
  });
};

/**
 * 适应画布
 */
const fitView = () => {
  graphInstance?.fitView(50);
};

/**
 * 重置视图
 */
const resetView = () => {
  graphInstance?.fitCenter();
  graphInstance?.zoom(1);
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
  if (graphInstance && graphContainer.value) {
    const width = graphContainer.value.clientWidth;
    const height = graphContainer.value.clientHeight;
    graphInstance.changeSize(width, height);
    graphInstance.fitCenter();
  }
};

onMounted(() => {
  loadTopologyData();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  graphInstance?.destroy();
});
</script>

<style lang="scss" scoped>

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


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
