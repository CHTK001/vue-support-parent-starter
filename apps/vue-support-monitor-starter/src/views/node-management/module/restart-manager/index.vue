<template>
  <el-dialog
    v-model="visible"
    title="节点重启管理"
    width="500px"
    :before-close="handleClose"
    append-to-body
    class="restart-manager-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <IconifyIconOnline icon="ri:restart-line" class="header-icon" />
          <div class="header-text">
            <h3>节点重启管理</h3>
            <p v-if="nodeInfo">
              {{ nodeInfo.nodeName || nodeInfo.applicationName }}
              ({{ nodeInfo.ipAddress }}:{{ nodeInfo.port }})
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="restart-manager-content">
      <!-- 警告提示 -->
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="warning-alert"
      >
        <template #title>
          <span class="alert-title">操作警告</span>
        </template>
        <div class="alert-content">
          <p>重启或关闭节点可能会导致以下影响：</p>
          <ul>
            <li>正在处理的请求可能会中断</li>
            <li>节点暂时无法提供服务</li>
            <li>关闭操作需要手动重新启动节点</li>
          </ul>
          <p>请确保已做好准备工作后再进行操作。</p>
        </div>
      </el-alert>

      <!-- 节点状态 -->
      <div class="node-status-section">
        <div class="status-item">
          <span class="status-label">节点状态</span>
          <el-tag :type="isOnline ? 'success' : 'danger'">
            {{ isOnline ? "在线" : "离线" }}
          </el-tag>
        </div>
        <div class="status-item" v-if="nodeInfo">
          <span class="status-label">应用名称</span>
          <span class="status-value">{{ nodeInfo.applicationName }}</span>
        </div>
        <div class="status-item" v-if="nodeInfo">
          <span class="status-label">节点地址</span>
          <span class="status-value">
            {{ nodeInfo.ipAddress }}:{{ nodeInfo.port }}
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button
          type="warning"
          size="large"
          :loading="loading.restart"
          :disabled="!isOnline"
          @click="handleRestart"
          class="action-btn"
        >
          <IconifyIconOnline icon="ri:restart-line" />
          重启节点
        </el-button>

        <el-button
          type="danger"
          size="large"
          :loading="loading.shutdown"
          :disabled="!isOnline"
          @click="handleShutdown"
          class="action-btn"
        >
          <IconifyIconOnline icon="ri:shut-down-line" />
          关闭节点
        </el-button>
      </div>

      <!-- 操作说明 -->
      <div class="tips-section">
        <div class="tip-item">
          <IconifyIconOnline icon="ri:restart-line" class="tip-icon warning" />
          <div class="tip-content">
            <strong>重启节点</strong
            >：节点将优雅关闭后自动重新启动，通常需要30-60秒完成重启。
          </div>
        </div>
        <div class="tip-item">
          <IconifyIconOnline icon="ri:shut-down-line" class="tip-icon danger" />
          <div class="tip-content">
            <strong>关闭节点</strong
            >：节点将优雅关闭，关闭后需要手动重新启动服务。
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from "vue";
import { message, messageBox } from "@repo/utils";
import {
  restartNodeForNodeControl,
  shutdownNodeForNodeControl,
  isNodeOnlineForNodeControl,
} from "@/api/server/node-control";

interface Props {
  modelValue: boolean;
  nodeInfo?: {
    nodeName?: string;
    applicationName: string;
    ipAddress: string;
    port: number;
  } | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const loading = reactive({
  restart: false,
  shutdown: false,
  check: false,
});

const isOnline = ref(false);

/**
 * 检查节点在线状态
 */
const checkNodeStatus = async () => {
  if (!props.nodeInfo) {
    isOnline.value = false;
    return;
  }

  loading.check = true;
  try {
    const response = await isNodeOnlineForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    if (response.success) {
      isOnline.value = response.data ?? false;
    } else {
      isOnline.value = false;
    }
  } catch {
    isOnline.value = false;
  } finally {
    loading.check = false;
  }
};

/**
 * 重启节点
 */
const handleRestart = async () => {
  if (!props.nodeInfo) return;

  try {
    await messageBox.confirm(
      `确定要重启节点 ${props.nodeInfo.applicationName} (${props.nodeInfo.ipAddress}:${props.nodeInfo.port}) 吗？`,
      "确认重启",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    loading.restart = true;
    const response = await restartNodeForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );

    if (response.success) {
      message.success("重启命令已发送，节点正在重启中...");
      emit("success");
    } else {
      message.error(response.msg || "重启节点失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重启节点失败:", error);
      message.error("重启节点失败");
    }
  } finally {
    loading.restart = false;
  }
};

/**
 * 关闭节点
 */
const handleShutdown = async () => {
  if (!props.nodeInfo) return;

  try {
    await messageBox.confirm(
      `确定要关闭节点 ${props.nodeInfo.applicationName} (${props.nodeInfo.ipAddress}:${props.nodeInfo.port}) 吗？关闭后需要手动重新启动！`,
      "确认关闭",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
      }
    );

    loading.shutdown = true;
    const response = await shutdownNodeForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );

    if (response.success) {
      message.success("关闭命令已发送，节点正在关闭中...");
      emit("success");
    } else {
      message.error(response.msg || "关闭节点失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("关闭节点失败:", error);
      message.error("关闭节点失败");
    }
  } finally {
    loading.shutdown = false;
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  visible.value = false;
};

watch(
  () => props.nodeInfo,
  (newNodeInfo) => {
    if (newNodeInfo && visible.value) {
      checkNodeStatus();
    }
  },
  { immediate: true }
);

watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    checkNodeStatus();
  }
});
</script>

<style lang="scss" scoped>
.dialog-header {
  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: var(--el-color-warning);
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.restart-manager-content {
  .warning-alert {
    margin-bottom: 20px;

    .alert-title {
      font-weight: 600;
    }

    .alert-content {
      p {
        margin: 8px 0;
      }

      ul {
        margin: 8px 0;
        padding-left: 20px;

        li {
          margin: 4px 0;
        }
      }
    }
  }

  .node-status-section {
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      &:not(:last-child) {
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .status-label {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .status-value {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }

  .action-section {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    .action-btn {
      flex: 1;
      height: 60px;
      font-size: 16px;
    }
  }

  .tips-section {
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;

    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;

      &:not(:last-child) {
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .tip-icon {
        font-size: 20px;
        margin-top: 2px;

        &.warning {
          color: var(--el-color-warning);
        }

        &.danger {
          color: var(--el-color-danger);
        }
      }

      .tip-content {
        flex: 1;
        font-size: 14px;
        color: var(--el-text-color-secondary);

        strong {
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
