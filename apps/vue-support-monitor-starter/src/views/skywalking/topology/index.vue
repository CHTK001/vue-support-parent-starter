<template>
  <div class="skywalking-topology">
    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="SkyWalking">
          <el-select v-model="filterForm.configId" placeholder="请选择配置" @change="handleConfigChange">
            <el-option
              v-for="item in configList"
              :key="item.skywalkingConfigId"
              :label="item.skywalkingConfigName"
              :value="item.skywalkingConfigId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HHmm"
            @change="handleTimeChange"
          />
        </el-form-item>
        <el-form-item label="层">
          <el-select v-model="filterForm.layer" placeholder="请选择层" clearable style="width: 150px">
            <el-option v-for="layer in layerList" :key="layer" :label="layer" :value="layer" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 拓扑图区域 -->
    <el-card class="topology-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>服务拓扑图</span>
          <div class="legend">
            <span class="legend-item">
              <span class="dot real"></span> 真实服务
            </span>
            <span class="legend-item">
              <span class="dot virtual"></span> 虚拟节点
            </span>
          </div>
        </div>
      </template>

      <div v-if="topologyData?.nodes?.length" class="topology-container" ref="containerRef">
        <div class="topology-graph">
          <!-- 节点 -->
          <div
            v-for="(node, index) in layoutNodes"
            :key="node.id"
            class="topology-node"
            :class="{ 'is-virtual': !node.isReal, 'is-selected': selectedNode?.id === node.id }"
            :style="{ left: node.x + 'px', top: node.y + 'px' }"
            @click="selectNode(node)"
          >
            <div class="node-icon">
              <el-icon :size="24"><Monitor /></el-icon>
            </div>
            <div class="node-name">{{ node.name }}</div>
            <div class="node-layer">{{ node.layer || '-' }}</div>
          </div>

          <!-- 连接线 SVG -->
          <svg class="topology-svg" :width="svgWidth" :height="svgHeight">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="var(--el-color-primary)" />
              </marker>
            </defs>
            <g v-for="call in layoutCalls" :key="call.id">
              <line
                :x1="call.x1"
                :y1="call.y1"
                :x2="call.x2"
                :y2="call.y2"
                stroke="var(--el-color-primary)"
                stroke-width="2"
                marker-end="url(#arrow)"
              />
            </g>
          </svg>
        </div>
      </div>
      <el-empty v-else description="暂无拓扑数据" />
    </el-card>

    <!-- 节点详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="节点详情" size="400px">
      <template v-if="selectedNode">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="节点ID">{{ selectedNode.id }}</el-descriptions-item>
          <el-descriptions-item label="节点名称">{{ selectedNode.name }}</el-descriptions-item>
          <el-descriptions-item label="节点类型">{{ selectedNode.type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="层">{{ selectedNode.layer || '-' }}</el-descriptions-item>
          <el-descriptions-item label="是否真实">
            <el-tag :type="selectedNode.isReal ? 'success' : 'info'" size="small">
              {{ selectedNode.isReal ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">调用关系</div>
        <div class="call-list">
          <div v-for="call in nodeRelatedCalls" :key="call.id" class="call-item">
            <span class="call-direction">{{ call.source === selectedNode.id ? '调用 →' : '← 被调用' }}</span>
            <span class="call-target">{{ call.source === selectedNode.id ? getNodeName(call.target) : getNodeName(call.source) }}</span>
          </div>
          <el-empty v-if="!nodeRelatedCalls.length" description="暂无调用关系" :image-size="60" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Monitor } from "@element-plus/icons-vue";
import { getEnabledSkywalkingConfigs, type SkywalkingConfig } from "@/api/skywalking/config";
import {
  getSkywalkingGlobalTopology,
  getSkywalkingServiceTopology,
  getSkywalkingLayers,
  getDefaultTimeRange,
  type TopologyNode,
  type TopologyCall,
  type Topology,
} from "@/api/skywalking/data";

defineOptions({ name: "SkywalkingTopology" });

const route = useRoute();

// 配置列表
const configList = ref<SkywalkingConfig[]>([]);
const layerList = ref<string[]>([]);
const loading = ref(false);
const containerRef = ref<HTMLElement>();

// 时间范围
const timeRange = ref<string[]>([]);

// 筛选表单
const filterForm = reactive({
  configId: undefined as number | undefined,
  startTime: "",
  endTime: "",
  layer: "",
});

// 拓扑数据
const topologyData = ref<Topology | null>(null);
const selectedNode = ref<TopologyNode | null>(null);
const drawerVisible = ref(false);

// SVG 尺寸
const svgWidth = ref(1200);
const svgHeight = ref(600);

// 布局后的节点
const layoutNodes = computed(() => {
  const nodes = topologyData.value?.nodes || [];
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const nodeWidth = 120;
  const nodeHeight = 80;
  const paddingX = 100;
  const paddingY = 50;

  return nodes.map((node, index) => ({
    ...node,
    x: paddingX + (index % cols) * (nodeWidth + 80),
    y: paddingY + Math.floor(index / cols) * (nodeHeight + 60),
  }));
});

// 布局后的连接线
const layoutCalls = computed(() => {
  const calls = topologyData.value?.calls || [];
  const nodeMap = new Map(layoutNodes.value.map((n) => [n.id, n]));

  return calls.map((call) => {
    const source = nodeMap.get(call.source);
    const target = nodeMap.get(call.target);
    return {
      ...call,
      x1: source ? source.x + 60 : 0,
      y1: source ? source.y + 40 : 0,
      x2: target ? target.x + 60 : 0,
      y2: target ? target.y + 40 : 0,
    };
  });
});

// 节点相关的调用
const nodeRelatedCalls = computed(() => {
  if (!selectedNode.value) return [];
  const calls = topologyData.value?.calls || [];
  return calls.filter(
    (call) => call.source === selectedNode.value!.id || call.target === selectedNode.value!.id
  );
});

// 获取节点名称
const getNodeName = (nodeId: string) => {
  const node = topologyData.value?.nodes?.find((n) => n.id === nodeId);
  return node?.name || nodeId;
};

// 初始化时间范围
const initTimeRange = () => {
  const range = getDefaultTimeRange(30);
  filterForm.startTime = range.startTime;
  filterForm.endTime = range.endTime;
  timeRange.value = [range.startTime, range.endTime];
};

// 加载配置列表
const loadConfigList = async () => {
  const res = await getEnabledSkywalkingConfigs();
  if (res.code === "00000") {
    configList.value = res.data || [];
    if (configList.value.length > 0) {
      filterForm.configId = configList.value[0].skywalkingConfigId;
      loadLayers();
      fetchData();
    }
  }
};

// 加载层列表
const loadLayers = async () => {
  if (!filterForm.configId) return;
  const res = await getSkywalkingLayers(filterForm.configId);
  if (res.code === "00000") {
    layerList.value = res.data || [];
  }
};

// 配置变更
const handleConfigChange = () => {
  loadLayers();
};

// 时间变更
const handleTimeChange = (val: string[]) => {
  if (val && val.length === 2) {
    filterForm.startTime = val[0];
    filterForm.endTime = val[1];
  }
};

// 获取拓扑数据
const fetchData = async () => {
  if (!filterForm.configId) {
    ElMessage.warning("请先选择 SkyWalking 配置");
    return;
  }

  loading.value = true;
  try {
    const serviceId = (route.query.serviceId as string) || "";
    let res;
    if (serviceId) {
      res = await getSkywalkingServiceTopology(serviceId, {
        configId: filterForm.configId,
        startTime: filterForm.startTime,
        endTime: filterForm.endTime,
      });
    } else {
      res = await getSkywalkingGlobalTopology({
        configId: filterForm.configId,
        startTime: filterForm.startTime,
        endTime: filterForm.endTime,
        layer: filterForm.layer || undefined,
      });
    }
    if (res.code === "00000") {
      topologyData.value = res.data;
      await nextTick();
      updateSvgSize();
    } else {
      ElMessage.error(res.msg || "获取拓扑数据失败");
    }
  } finally {
    loading.value = false;
  }
};

// 更新 SVG 尺寸
const updateSvgSize = () => {
  const nodes = layoutNodes.value;
  if (nodes.length === 0) return;
  const maxX = Math.max(...nodes.map((n) => n.x)) + 200;
  const maxY = Math.max(...nodes.map((n) => n.y)) + 150;
  svgWidth.value = Math.max(maxX, 800);
  svgHeight.value = Math.max(maxY, 400);
};

// 选择节点
const selectNode = (node: TopologyNode) => {
  selectedNode.value = node;
  drawerVisible.value = true;
};

onMounted(() => {
  initTimeRange();
  loadConfigList();
});
</script>

<style scoped lang="scss">
.skywalking-topology {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .topology-card {
    flex: 1;
    overflow: hidden;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .legend {
        display: flex;
        gap: 16px;
        font-size: 12px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;

          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;

            &.real {
              background: var(--el-color-primary);
            }

            &.virtual {
              background: var(--el-color-info);
            }
          }
        }
      }
    }

    .topology-container {
      height: calc(100% - 20px);
      overflow: auto;
    }

    .topology-graph {
      position: relative;
      min-height: 400px;

      .topology-svg {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }

      .topology-node {
        position: absolute;
        width: 120px;
        padding: 12px;
        background: var(--el-bg-color);
        border: 2px solid var(--el-color-primary);
        border-radius: 8px;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.is-virtual {
          border-color: var(--el-color-info);
          border-style: dashed;
        }

        &.is-selected {
          border-color: var(--el-color-success);
          box-shadow: 0 0 0 3px var(--el-color-success-light-5);
        }

        .node-icon {
          margin-bottom: 4px;
          color: var(--el-color-primary);
        }

        .node-name {
          font-size: 12px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .node-layer {
          font-size: 10px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .section-title {
    font-weight: 600;
    margin: 16px 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .call-list {
    .call-item {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .call-direction {
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }

      .call-target {
        font-weight: 500;
      }
    }
  }
}
</style>
