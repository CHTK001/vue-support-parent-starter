<template>
  <div class="file-handles system-container modern-bg">
    <!-- 工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>
            <IconifyIconOnline icon="ri:file-list-line" />
            文件句柄监控
          </h3>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="ipAddress"
            placeholder="IP地址"
            class="ip-input"
            clearable
          />
          <el-input
            v-model="port"
            placeholder="端口"
            class="port-input"
            type="number"
            clearable
          />
          <el-button type="primary" @click="loadFileHandles">
            <IconifyIconOnline icon="ri:search-line" />
            查询
          </el-button>
          <el-tooltip content="刷新统计" placement="top">
            <el-button type="primary" :icon="Refresh" :loading="statsLoading" @click="loadStats" />
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <ScCard
        layout="stats"
        label="监控节点"
        :value="stats.totalNodes"
        icon="ri:server-line"
        theme="primary"
        hoverable
      />
      <ScCard
        layout="stats"
        label="总句柄数"
        :value="stats.totalHandles"
        icon="ri:file-line"
        theme="success"
        hoverable
      />
    </div>

    <!-- 节点句柄分布 -->
    <el-card class="nodes-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <IconifyIconOnline icon="ri:pie-chart-line" />
            节点句柄分布
          </span>
        </div>
      </template>

      <div v-loading="statsLoading" class="nodes-grid">
        <div
          v-for="node in stats.nodes"
          :key="node.node"
          class="node-item"
          @click="selectNode(node.node)"
        >
          <div class="node-header">
            <IconifyIconOnline icon="ri:server-line" class="node-icon" />
            <span class="node-name">{{ node.node }}</span>
          </div>
          <div class="node-count">
            <span class="count-value">{{ node.handleCount }}</span>
            <span class="count-label">句柄</span>
          </div>
          <el-progress
            :percentage="getPercentage(node.handleCount)"
            :stroke-width="6"
            :show-text="false"
            :color="getProgressColor(node.handleCount)"
          />
        </div>

        <el-empty v-if="!statsLoading && stats.nodes.length === 0" description="暂无节点数据" />
      </div>
    </el-card>

    <!-- 句柄列表 -->
    <el-card class="handles-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <IconifyIconOnline icon="ri:list-check" />
            句柄列表
            <el-tag v-if="selectedNodeAddress" size="small" type="info" class="selected-node">
              {{ selectedNodeAddress }}
            </el-tag>
          </span>
          <span class="count">共 {{ fileHandles.length }} 个</span>
        </div>
      </template>

      <ScTable
        :data="fileHandles"
        :columns="tableColumns"
        :loading="handlesLoading"
        :show-pagination="false"
      >
        <template #handleType="{ row }">
          <el-tag :type="getHandleTypeTag(row.handleType)" size="small">
            {{ row.handleType || "UNKNOWN" }}
          </el-tag>
        </template>

        <template #mode="{ row }">
          <el-tag size="small" effect="plain">
            {{ row.mode || "-" }}
          </el-tag>
        </template>

        <template #filePath="{ row }">
          <div class="file-path" :title="row.filePath">
            {{ row.filePath || "-" }}
          </div>
        </template>

        <template #bytes="{ row }">
          <div class="bytes-info">
            <span class="read">
              <IconifyIconOnline icon="ri:download-line" />
              {{ formatBytes(row.readBytes) }}
            </span>
            <span class="write">
              <IconifyIconOnline icon="ri:upload-line" />
              {{ formatBytes(row.writeBytes) }}
            </span>
          </div>
        </template>

        <template #openTime="{ row }">
          {{ formatTime(row.openTime) }}
        </template>

        <template #lastAccessTime="{ row }">
          {{ formatTime(row.lastAccessTime) }}
        </template>
      </ScTable>

      <el-empty v-if="!handlesLoading && fileHandles.length === 0 && selectedNodeAddress" description="该节点暂无句柄数据" />
      <el-empty v-if="!handlesLoading && !selectedNodeAddress" description="请选择节点或输入IP:端口查询" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { message } from "@repo/utils";
import {
  getFileHandlesForAgent,
  getFileHandleStatsForAgent,
  type AgentFileHandleDTO,
  type FileHandleStats,
} from "@/api/server/agent-data";

// 查询参数
const ipAddress = ref("");
const port = ref<number | string>("");
const selectedNodeAddress = ref("");

// 统计数据
const stats = reactive<FileHandleStats>({
  totalNodes: 0,
  totalHandles: 0,
  nodes: [],
});
const statsLoading = ref(false);

// 句柄数据
const fileHandles = ref<AgentFileHandleDTO[]>([]);
const handlesLoading = ref(false);

// 表格列配置
const tableColumns = [
  { label: "FD", prop: "fd", width: 80 },
  { label: "类型", prop: "handleType", slot: "handleType", width: 100 },
  { label: "模式", prop: "mode", slot: "mode", width: 100 },
  { label: "文件路径", prop: "filePath", slot: "filePath", minWidth: 200 },
  { label: "读写", prop: "bytes", slot: "bytes", width: 180 },
  { label: "PID", prop: "pid", width: 100 },
  { label: "打开时间", prop: "openTime", slot: "openTime", width: 160 },
  { label: "最后访问", prop: "lastAccessTime", slot: "lastAccessTime", width: 160 },
];

/**
 * 加载统计数据
 */
const loadStats = async () => {
  statsLoading.value = true;
  try {
    const response = await getFileHandleStatsForAgent();
    if (response.success && response.data) {
      stats.totalNodes = response.data.totalNodes;
      stats.totalHandles = response.data.totalHandles;
      stats.nodes = response.data.nodes || [];
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
    message("加载统计数据失败", { type: "error" });
  } finally {
    statsLoading.value = false;
  }
};

/**
 * 加载文件句柄
 */
const loadFileHandles = async () => {
  if (!ipAddress.value || !port.value) {
    message("请输入 IP 地址和端口", { type: "warning" });
    return;
  }

  handlesLoading.value = true;
  selectedNodeAddress.value = `${ipAddress.value}:${port.value}`;
  
  try {
    const response = await getFileHandlesForAgent(ipAddress.value, Number(port.value));
    if (response.success && response.data) {
      fileHandles.value = response.data;
    } else {
      fileHandles.value = [];
    }
  } catch (error) {
    console.error("加载文件句柄失败:", error);
    message("加载文件句柄失败", { type: "error" });
  } finally {
    handlesLoading.value = false;
  }
};

/**
 * 选择节点
 */
const selectNode = (nodeAddress: string) => {
  const [ip, p] = nodeAddress.split(":");
  ipAddress.value = ip;
  port.value = p;
  loadFileHandles();
};

/**
 * 获取百分比
 */
const getPercentage = (count: number): number => {
  if (stats.totalHandles === 0) return 0;
  return Math.min((count / stats.totalHandles) * 100, 100);
};

/**
 * 获取进度条颜色
 */
const getProgressColor = (count: number): string => {
  const percentage = getPercentage(count);
  if (percentage >= 50) return "#f56c6c";
  if (percentage >= 30) return "#e6a23c";
  return "#67c23a";
};

/**
 * 获取句柄类型标签
 */
const getHandleTypeTag = (type: string) => {
  switch (type?.toUpperCase()) {
    case "FILE":
      return "primary" as const;
    case "SOCKET":
      return "success" as const;
    case "PIPE":
      return "warning" as const;
    default:
      return "info" as const;
  }
};

/**
 * 格式化字节
 */
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadStats();
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


.file-handles {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;

  .toolbar-card {
    margin-bottom: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

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
        align-items: center;

        .ip-input {
          width: 150px;
        }

        .port-input {
          width: 100px;
        }
      }
    }
  }

  .stats-section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .nodes-card {
    margin-bottom: 20px;

    .card-header {
      .title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }
    }

    .nodes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      min-height: 100px;

      .node-item {
        padding: 16px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          .node-icon {
            font-size: 20px;
            color: var(--el-color-primary);
          }

          .node-name {
            font-size: 14px;
            font-family: monospace;
            color: var(--el-text-color-primary);
          }
        }

        .node-count {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;

          .count-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--el-color-primary);
          }

          .count-label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .handles-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;

        .selected-node {
          margin-left: 8px;
        }
      }

      .count {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }

    .file-path {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 13px;
    }

    .bytes-info {
      display: flex;
      gap: 12px;
      font-size: 13px;

      .read {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--el-color-success);
      }

      .write {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
