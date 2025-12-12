<template>
  <el-dialog
    v-model="visible"
    title="URL QPS 统计"
    width="1100px"
    :before-close="handleClose"
    append-to-body
    class="url-qps-dialog"
    destroy-on-close
    top="5vh"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <div class="header-icon-wrapper">
            <IconifyIconOnline icon="ri:bar-chart-2-line" class="header-icon" />
          </div>
          <div class="header-text">
            <h3>URL QPS 统计</h3>
            <p v-if="nodeInfo">
              <span class="node-name">{{ nodeInfo.nodeName || nodeInfo.applicationName }}</span>
              <span class="node-address">{{ nodeInfo.ipAddress }}:{{ nodeInfo.port }}</span>
            </p>
          </div>
        </div>
        <div class="header-stats" v-if="summary">
          <div class="stat-item">
            <span class="stat-value">{{ summary.totalUrls || 0 }}</span>
            <span class="stat-label">接口数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatNumber(summary.totalRequests) }}</span>
            <span class="stat-label">总请求</span>
          </div>
          <div class="stat-item success">
            <span class="stat-value">{{ summary.successRate || '0%' }}</span>
            <span class="stat-label">成功率</span>
          </div>
        </div>
      </div>
    </template>

    <div class="url-qps-content">
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="tabs-wrapper">
        <el-tab-pane label="QPS 统计" name="qps">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <el-input
                v-model="searchText"
                placeholder="搜索 URL..."
                clearable
                class="search-input"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:search-line" />
                </template>
              </el-input>
              <span class="search-result" v-if="searchText">
                找到 <strong>{{ filteredQpsData.length }}</strong> 个
              </span>
            </div>
            <div class="toolbar-right">
              <el-tooltip content="清除统计数据" placement="top">
                <el-button
                  type="danger"
                  :loading="clearing"
                  @click="handleClearData"
                  plain
                >
                  <IconifyIconOnline v-if="!clearing" icon="ri:delete-bin-line" />
                  清除
                </el-button>
              </el-tooltip>
              <el-tooltip content="刷新数据" placement="top">
                <el-button
                  type="primary"
                  :loading="loading"
                  @click="handleRefresh"
                >
                  <IconifyIconOnline v-if="!loading" icon="ri:refresh-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <!-- QPS 统计表格 -->
          <div class="table-wrapper">
            <ScTable
              ref="qpsTableRef"
              :data="filteredQpsData"
              table-name="node-url-qps"
              :page-size="50"
              border
              max-height="calc(90vh - 320px)"
              :loading="loading"
              @refresh="handleRefresh"
            >
              <el-table-column label="URL" min-width="280">
                <template #default="{ row }">
                  <div class="url-cell">
                    <el-tag :type="getMethodTagType(row.method)" size="small" class="method-tag">
                      {{ row.method || 'ALL' }}
                    </el-tag>
                    <span class="url-path" :title="row.url">{{ row.url }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="QPS" width="90" align="center">
                <template #default="{ row }">
                  <span class="qps-value">{{ (row.qps || 0).toFixed(2) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="总请求" width="100" align="center">
                <template #default="{ row }">
                  <span class="count-value">{{ formatNumber(row.historyTotalCount) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="成功" width="90" align="center">
                <template #default="{ row }">
                  <span class="success-count">{{ formatNumber(row.historySuccessCount) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="失败" width="90" align="center">
                <template #default="{ row }">
                  <span class="fail-count" :class="{ 'has-fail': row.historyFailCount > 0 }">
                    {{ formatNumber(row.historyFailCount) }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="平均耗时" width="100" align="center">
                <template #default="{ row }">
                  <span class="duration-value">{{ row.avgDuration || 0 }}ms</span>
                </template>
              </el-table-column>

              <el-table-column label="最小/最大" width="120" align="center">
                <template #default="{ row }">
                  <span class="duration-range">
                    {{ row.minDuration || 0 }}/{{ row.maxDuration || 0 }}ms
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="成功率" width="100" align="center">
                <template #default="{ row }">
                  <el-progress
                    :percentage="calculateSuccessRate(row)"
                    :stroke-width="6"
                    :color="getSuccessRateColor(row)"
                  />
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </el-tab-pane>

        <el-tab-pane label="URL 映射" name="mappings">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <el-input
                v-model="mappingSearchText"
                placeholder="搜索 URL..."
                clearable
                class="search-input"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:search-line" />
                </template>
              </el-input>
              <span class="search-result" v-if="mappingSearchText">
                找到 <strong>{{ filteredMappings.length }}</strong> 个
              </span>
            </div>
            <div class="toolbar-right">
              <el-tooltip content="刷新映射" placement="top">
                <el-button
                  type="primary"
                  :loading="loadingMappings"
                  @click="loadMappings"
                >
                  <IconifyIconOnline v-if="!loadingMappings" icon="ri:refresh-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <!-- URL 映射表格 -->
          <div class="table-wrapper">
            <ScTable
              ref="mappingsTableRef"
              :data="filteredMappings"
              table-name="node-url-mappings"
              :page-size="50"
              border
              max-height="calc(90vh - 320px)"
              :loading="loadingMappings"
              @refresh="loadMappings"
            >
              <el-table-column label="URL 模式" min-width="280">
                <template #default="{ row }">
                  <div class="url-cell">
                    <div class="methods-wrapper" v-if="row.methods && row.methods.length > 0">
                      <el-tag
                        v-for="method in row.methods"
                        :key="method"
                        :type="getMethodTagType(method)"
                        size="small"
                        class="method-tag"
                      >
                        {{ method }}
                      </el-tag>
                    </div>
                    <el-tag v-else type="info" size="small" class="method-tag">ALL</el-tag>
                    <span class="url-path" :title="row.pattern">{{ row.pattern }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="处理器" min-width="300">
                <template #default="{ row }">
                  <span class="handler-text" :title="row.handler">
                    {{ row.handler || '-' }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="Controller" min-width="200">
                <template #default="{ row }">
                  <span class="controller-text" :title="row.controller">
                    {{ getSimpleClassName(row.controller) }}
                  </span>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getNodeUrlMappings,
  getNodeUrlQps,
  getNodeQpsSummary,
  clearNodeQpsData,
} from "@/api/server/node-url-qps";

// QPS 统计信息接口
interface QpsInfo {
  url: string;
  method: string;
  count: number;
  successCount: number;
  failCount: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  qps: number;
  statusCodes: Record<string, number>;
  historyTotalCount: number;
  historySuccessCount: number;
  historyFailCount: number;
}

// URL 映射信息接口
interface MappingInfo {
  pattern: string;
  methods: string[];
  handler: string;
  controller: string;
  produces: string[];
  consumes: string[];
}

// 汇总信息接口
interface Summary {
  nodeUrl: string;
  lastUpdateTime: number;
  totalUrls: number;
  totalRequests: number;
  totalSuccess: number;
  totalFail: number;
  avgQps: number;
  successRate: string;
}

/**
 * 编码节点URL
 */
const encodeNodeUrl = (ip: string, port: number): string => {
  return btoa(`${ip}:${port}`);
};

/**
 * 格式化数字
 */
const formatNumber = (num?: number): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

/**
 * 获取 HTTP 方法标签类型
 */
const getMethodTagType = (
  method?: string
): "success" | "warning" | "info" | "primary" | "danger" | undefined => {
  switch (method?.toUpperCase()) {
    case "GET":
      return "primary";
    case "POST":
      return "success";
    case "PUT":
      return "warning";
    case "DELETE":
      return "danger";
    case "PATCH":
      return "info";
    default:
      return undefined;
  }
};

/**
 * 计算成功率
 */
const calculateSuccessRate = (row: QpsInfo): number => {
  const total = row.historyTotalCount || 0;
  const success = row.historySuccessCount || 0;
  if (total === 0) return 100;
  return Math.round((success / total) * 100);
};

/**
 * 获取成功率颜色
 */
const getSuccessRateColor = (row: QpsInfo): string => {
  const rate = calculateSuccessRate(row);
  if (rate >= 99) return "#67c23a";
  if (rate >= 95) return "#e6a23c";
  return "#f56c6c";
};

/**
 * 获取简单类名
 */
const getSimpleClassName = (fullName?: string): string => {
  if (!fullName) return "-";
  const parts = fullName.split(".");
  return parts[parts.length - 1] || fullName;
};

// 定义组件属性
interface Props {
  modelValue: boolean;
  nodeInfo?: {
    nodeName?: string;
    applicationName: string;
    ipAddress: string;
    port: number;
  } | null;
}

// 定义事件
interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const activeTab = ref("qps");
const qpsTableRef = ref();
const mappingsTableRef = ref();
const qpsData = ref<QpsInfo[]>([]);
const mappings = ref<MappingInfo[]>([]);
const summary = ref<Summary | null>(null);
const loading = ref(false);
const loadingMappings = ref(false);
const clearing = ref(false);
const searchText = ref("");
const mappingSearchText = ref("");

// 过滤后的 QPS 数据
const filteredQpsData = computed(() => {
  if (!searchText.value) return qpsData.value;
  return qpsData.value.filter((item) =>
    item.url?.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 过滤后的映射数据
const filteredMappings = computed(() => {
  if (!mappingSearchText.value) return mappings.value;
  return mappings.value.filter((item) =>
    item.pattern?.toLowerCase().includes(mappingSearchText.value.toLowerCase())
  );
});

// 监听节点信息变化
watch(
  () => props.nodeInfo,
  (newNodeInfo) => {
    if (newNodeInfo && visible.value) {
      loadQpsData();
      loadSummary();
    }
  },
  { immediate: true }
);

// 监听弹框显示状态
watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadQpsData();
    loadSummary();
  } else if (!newVisible) {
    qpsData.value = [];
    mappings.value = [];
    summary.value = null;
    searchText.value = "";
    mappingSearchText.value = "";
    activeTab.value = "qps";
  }
});

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === "mappings" && mappings.value.length === 0) {
    loadMappings();
  }
});

// 加载 QPS 数据
const loadQpsData = async () => {
  if (!props.nodeInfo) return;

  loading.value = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getNodeUrlQps(encodedNodeUrl);

    if (response.success && (response as any).data) {
      qpsData.value = (response as any).data || [];
    } else {
      qpsData.value = [];
    }
  } catch (error) {
    console.error("Load QPS data error:", error);
    qpsData.value = [];
  } finally {
    loading.value = false;
  }
};

// 加载汇总数据
const loadSummary = async () => {
  if (!props.nodeInfo) return;

  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getNodeQpsSummary(encodedNodeUrl);

    if (response.success && (response as any).data) {
      summary.value = (response as any).data;
    }
  } catch (error) {
    console.error("Load summary error:", error);
  }
};

// 加载 URL 映射
const loadMappings = async () => {
  if (!props.nodeInfo) return;

  loadingMappings.value = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getNodeUrlMappings(encodedNodeUrl);

    if (response.success && (response as any).data) {
      mappings.value = (response as any).data || [];
    } else {
      message.error("获取 URL 映射失败: " + ((response as any).msg || "未知错误"));
      mappings.value = [];
    }
  } catch (error) {
    console.error("Load mappings error:", error);
    message.error("网络错误，请稍后重试");
    mappings.value = [];
  } finally {
    loadingMappings.value = false;
  }
};

// 清除数据
const handleClearData = async () => {
  if (!props.nodeInfo) return;

  try {
    await ElMessageBox.confirm("确定要清除该节点的 QPS 统计数据吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    clearing.value = true;
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await clearNodeQpsData(encodedNodeUrl);

    if (response.success) {
      message.success("清除成功");
      await loadQpsData();
      await loadSummary();
    } else {
      message.error("清除失败: " + ((response as any).msg || "未知错误"));
    }
  } catch (error) {
    if ((error as any) !== "cancel") {
      console.error("Clear data error:", error);
      message.error("网络错误，请稍后重试");
    }
  } finally {
    clearing.value = false;
  }
};

// 刷新数据
const handleRefresh = async () => {
  await loadQpsData();
  await loadSummary();
  message.success("刷新成功");
};

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--el-color-primary-light-9);
      border-radius: 10px;

      .header-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 8px;

        .node-name {
          font-weight: 500;
        }

        .node-address {
          font-family: "JetBrains Mono", "Consolas", monospace;
          font-size: 12px;
          padding: 2px 6px;
          background: var(--el-fill-color-light);
          border-radius: 4px;
        }
      }
    }
  }

  .header-stats {
    display: flex;
    gap: 12px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 14px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;

      .stat-value {
        font-size: 16px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }

      &.success .stat-value {
        color: var(--el-color-success);
      }
    }
  }
}

.url-qps-content {
  .tabs-wrapper {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-input {
        width: 240px;

        :deep(.el-input__wrapper) {
          border-radius: 6px;
          background: var(--el-bg-color);
        }
      }

      .search-result {
        font-size: 13px;
        color: var(--el-text-color-secondary);

        strong {
          color: var(--el-color-primary);
        }
      }
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .table-wrapper {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
  }

  .url-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .methods-wrapper {
      display: flex;
      gap: 4px;
    }

    .method-tag {
      flex-shrink: 0;
    }

    .url-path {
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 13px;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .qps-value {
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .count-value {
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-weight: 500;
  }

  .success-count {
    font-family: "JetBrains Mono", "Consolas", monospace;
    color: var(--el-color-success);
  }

  .fail-count {
    font-family: "JetBrains Mono", "Consolas", monospace;
    color: var(--el-text-color-secondary);

    &.has-fail {
      color: var(--el-color-danger);
      font-weight: 600;
    }
  }

  .duration-value {
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-size: 12px;
  }

  .duration-range {
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .handler-text {
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  .controller-text {
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-size: 12px;
    color: var(--el-color-primary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
