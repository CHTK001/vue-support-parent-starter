<template>
  <ScDialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    :before-close="handleClose"
  >
    <div class="node-detail-content">
      <!-- 节点基本信息 -->
      <div class="node-info-section" v-if="nodeInfo">
        <div class="info-header">
          <div class="info-icon">
            <IconifyIconOnline icon="ri:server-line" />
          </div>
          <div class="info-content">
            <div class="info-name">
              {{ nodeInfo.nodeName || nodeInfo.applicationName }}
            </div>
            <div class="info-address">
              <IconifyIconOnline icon="ri:global-line" />
              <span>{{ nodeInfo.ipAddress }}:{{ nodeInfo.port }}</span>
              <el-tag
                :type="getStatusType(nodeInfo.status)"
                size="small"
                class="ml-2"
              >
                {{ getStatusText(nodeInfo.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能卡片 -->
      <div class="feature-cards">
        <div
          v-for="item in featureList"
          :key="item.key"
          class="feature-card"
          :class="{ disabled: item.disabled }"
          @click="handleFeatureClick(item)"
        >
          <div class="card-icon" :style="{ background: item.color }">
            <IconifyIconOnline :icon="item.icon" />
          </div>
          <div class="card-content">
            <div class="card-title">{{ item.title }}</div>
            <div class="card-desc">{{ item.desc }}</div>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-s-line" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import type { OnlineNodeInfo } from "@/api/server/node-management";
import { apiCheckNodeHealth } from "@/api/server/node-management";
import ScDialog from "@repo/components/ScDialog/src/index.vue";

/**
 * 节点详情组件
 * @author CH
 * @since 2024-12-08
 */

const props = defineProps<{
  /** 节点信息 */
  nodeInfo: OnlineNodeInfo | null;
}>();

const emit = defineEmits<{
  /** 更新可见状态 */
  (e: "update:modelValue", value: boolean): void;
  /** 打开日志配置 */
  (e: "openLoggerConfig", node: OnlineNodeInfo): void;
  /** 打开日志查看 */
  (e: "openLogViewer", node: OnlineNodeInfo): void;
  /** 打开配置查看 */
  (e: "openConfigViewer", node: OnlineNodeInfo): void;
  /** 打开重启管理 */
  (e: "openRestartManager", node: OnlineNodeInfo): void;
}>();

const visible = defineModel<boolean>({ default: false });
const router = useRouter();
const checkingHealth = ref(false);

/** 对话框标题 */
const dialogTitle = computed(() => {
  if (props.nodeInfo) {
    return `节点详情 - ${props.nodeInfo.nodeName || props.nodeInfo.applicationName}`;
  }
  return "节点详情";
});

/** 功能列表 */
const featureList = computed(() => [
  {
    key: "documentation",
    title: "API 文档",
    desc: "查看节点提供的 API 接口文档",
    icon: "ri:file-text-line",
    color: "linear-gradient(135deg, #3b82f6, #2563eb)",
    disabled: false,
  },
  {
    key: "loggerConfig",
    title: "日志配置",
    desc: "调整日志等级 (Actuator / LoggingConfigBean)",
    icon: "ri:settings-4-line",
    color: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    disabled: false,
  },
  {
    key: "logViewer",
    title: "日志查看",
    desc: "查看节点实时日志输出",
    icon: "ri:file-list-3-line",
    color: "linear-gradient(135deg, #06b6d4, #0891b2)",
    disabled: false,
  },
  {
    key: "configViewer",
    title: "系统配置",
    desc: "查看节点系统配置信息 (Actuator)",
    icon: "ri:tools-line",
    color: "linear-gradient(135deg, #f59e0b, #d97706)",
    disabled: false,
  },
  {
    key: "monitor",
    title: "监控大屏",
    desc: "查看节点运行时监控数据",
    icon: "ri:dashboard-line",
    color: "linear-gradient(135deg, #10b981, #059669)",
    disabled: false,
  },
  {
    key: "scifiDashboard",
    title: "科幻大屏",
    desc: "科幻风格的节点监控可视化",
    icon: "ri:planet-line",
    color: "linear-gradient(135deg, #00f6ff, #0080ff)",
    disabled: false,
  },
  {
    key: "healthCheck",
    title: "健康检查",
    desc: "检查节点健康状态",
    icon: "ri:stethoscope-line",
    color: "linear-gradient(135deg, #ec4899, #db2777)",
    disabled: false,
  },
  {
    key: "restart",
    title: "重启管理",
    desc: "重启应用或优雅关闭",
    icon: "ri:restart-line",
    color: "linear-gradient(135deg, #ef4444, #dc2626)",
    disabled: false,
  },
]);

/**
 * 获取状态类型
 * @param status 状态
 */
const getStatusType = (status: string): "success" | "warning" | "danger" | "info" | "primary" => {
  const statusMap: Record<string, "success" | "warning" | "danger" | "info" | "primary"> = {
    ONLINE: "success",
    OFFLINE: "danger",
    CONNECTING: "warning",
    ERROR: "danger",
    MAINTENANCE: "info",
  };
  return statusMap[status] || "info";
};

/**
 * 获取状态文本
 * @param status 状态
 */
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    ONLINE: "在线",
    OFFLINE: "离线",
    CONNECTING: "连接中",
    ERROR: "异常",
    MAINTENANCE: "维护中",
  };
  return textMap[status] || status;
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  visible.value = false;
};

/**
 * 处理功能卡片点击
 * @param item 功能项
 */
const handleFeatureClick = async (item: (typeof featureList.value)[0]) => {
  if (item.disabled || !props.nodeInfo) return;

  const node = props.nodeInfo;

  switch (item.key) {
    case "documentation":
      openNodeDocumentation(node);
      break;
    case "loggerConfig":
      emit("openLoggerConfig", node);
      handleClose();
      break;
    case "logViewer":
      emit("openLogViewer", node);
      handleClose();
      break;
    case "configViewer":
      emit("openConfigViewer", node);
      handleClose();
      break;
    case "monitor":
      openNodeMonitoring(node);
      break;
    case "scifiDashboard":
      openScifiDashboard(node);
      break;
    case "healthCheck":
      await checkNodeHealth(node);
      break;
    case "restart":
      emit("openRestartManager", node);
      handleClose();
      break;
  }
};

/**
 * 打开节点文档
 * @param node 节点信息
 */
const openNodeDocumentation = (node: OnlineNodeInfo) => {
  const contextPath = node.metadata?.contextPath || "/";
  const routeData = router.resolve({
    name: "nodeDocumentation",
    params: { nodeId: node.nodeId },
    query: {
      nodeName: node.nodeName || node.applicationName,
      nodeAddress: `${node.ipAddress}:${node.port}`,
      contextPath: contextPath,
    },
  });
  window.open(routeData.href, "_blank");
};

/**
 * 打开监控大屏
 * @param node 节点信息
 */
const openNodeMonitoring = (node: OnlineNodeInfo) => {
  const routeData = router.resolve({
    name: "nodeMonitorDashboard",
    params: { nodeId: node.nodeId },
    query: {
      nodeName: node.nodeName || node.applicationName,
      nodeAddress: `${node.ipAddress}:${node.port}`,
    },
  });
  window.open(routeData.href, "_blank");
};

/**
 * 打开科幻大屏
 * @param node 节点信息
 */
const openScifiDashboard = (node: OnlineNodeInfo) => {
  const routeData = router.resolve({
    name: "nodeScifiDashboard",
    params: { nodeId: node.nodeId },
    query: {
      nodeName: node.nodeName || node.applicationName,
      nodeAddress: `${node.ipAddress}:${node.port}`,
    },
  });
  window.open(routeData.href, "_blank");
};

/**
 * 检查节点健康状态
 * @param node 节点信息
 */
const checkNodeHealth = async (node: OnlineNodeInfo) => {
  if (checkingHealth.value) return;

  checkingHealth.value = true;
  try {
    const response = await apiCheckNodeHealth(node.ipAddress, node.port);
    if (response.code === "00000") {
      message.success(
        `节点 ${node.nodeName || node.applicationName} 健康检查通过`
      );
    } else {
      message.warning(`节点健康检查失败: ${response.msg}`);
    }
  } catch (error) {
    console.error("节点健康检查失败:", error);
    message.error("节点健康检查失败");
  } finally {
    checkingHealth.value = false;
  }
};
</script>

<style scoped lang="scss">
.node-detail-content {
  .node-info-section {
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    margin-bottom: 24px;

    .info-header {
      display: flex;
      align-items: center;
      gap: 16px;

      .info-icon {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 28px;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .info-content {
        flex: 1;

        .info-name {
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 6px;
        }

        .info-address {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
          font-family: "JetBrains Mono", "Consolas", monospace;

          i {
            font-size: 14px;
          }
        }
      }
    }
  }

  .feature-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .feature-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      background: #fff;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(.disabled) {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);

        .card-arrow {
          transform: translateX(4px);
          color: var(--el-color-primary);
        }
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .card-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 22px;
        flex-shrink: 0;
      }

      .card-content {
        flex: 1;
        min-width: 0;

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .card-arrow {
        font-size: 20px;
        color: var(--el-text-color-placeholder);
        transition: all 0.3s ease;
        flex-shrink: 0;
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .node-detail-content {
    .feature-cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>
