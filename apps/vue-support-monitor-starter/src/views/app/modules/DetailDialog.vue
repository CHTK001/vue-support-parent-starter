<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    draggable
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="detail-dialog"
    @close="handleClose"
  >
    <!-- 项目信息头部 -->
    <div class="project-header">
      <div class="project-icon-wrapper">
        <img
          v-if="data.systemDataSettingIcon"
          :src="data.systemDataSettingIcon"
          class="project-icon"
        />
        <div v-else class="project-icon-placeholder">
          <IconifyIconOnline icon="ri:apps-2-line" />
        </div>
      </div>
      <div class="project-info">
        <h3 class="project-name">{{ data.monitorName }}</h3>
        <p class="project-platform">{{ data.monitorApplicationName }}</p>
      </div>
      <div class="project-stats">
        <div class="stat-item">
          <span class="stat-value" :class="{ online: deviceCount > 0 }">{{
            deviceCount
          }}</span>
          <span class="stat-label">在线设备</span>
        </div>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="device-section">
      <div class="section-header">
        <IconifyIconOnline icon="ri:server-line" class="section-icon" />
        <span class="section-title">设备列表</span>
      </div>

      <div v-if="devices.length > 0" class="device-list">
        <div
          v-for="(device, index) in devices"
          :key="device.serverId || index"
          class="device-card"
        >
          <div class="device-status">
            <div class="status-dot online"></div>
          </div>
          <div class="device-info">
            <div class="device-main">
              <span class="device-host">{{ device.host }}</span>
              <span class="device-port">:{{ device.port }}</span>
            </div>
            <div class="device-meta">
              <span class="meta-item" v-if="device.metadata?.hostname">
                <IconifyIconOnline icon="ri:computer-line" class="meta-icon" />
                {{ device.metadata.hostname }}
              </span>
              <span class="meta-item" v-if="device.metadata?.contextPath">
                <IconifyIconOnline icon="ri:link" class="meta-icon" />
                {{ device.metadata.contextPath }}
              </span>
              <span class="meta-item" v-if="device.metadata?.javaVersion">
                <IconifyIconOnline
                  icon="simple-icons:openjdk"
                  class="meta-icon"
                />
                {{ device.metadata.javaVersion }}
              </span>
            </div>
          </div>
          <div class="device-actions">
            <el-tooltip content="访问服务" placement="top">
              <el-button size="small" circle @click="handleVisitDevice(device)">
                <IconifyIconOnline icon="ri:external-link-line" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无在线设备" />
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";

interface Discovery {
  host: string;
  port: number;
  serverId: string;
  protocol?: string;
  metadata?: Record<string, string>;
}

interface MonitorApplication {
  monitorId?: number;
  monitorName?: string;
  monitorApplicationName?: string;
  systemDataSettingIcon?: string;
  monitorRequests?: Discovery[];
}

interface Props {
  visible: boolean;
  data: MonitorApplication;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  data: () => ({}),
});

const emit = defineEmits(["update:visible", "close"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const dialogTitle = computed(() => {
  return `${props.data.monitorName || "项目"} - 设备详情`;
});

const devices = computed<Discovery[]>(() => {
  return props.data.monitorRequests || [];
});

const deviceCount = computed(() => devices.value.length);

const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};

/**
 * 访问设备
 */
const handleVisitDevice = (device: Discovery) => {
  const protocol = device.protocol || "http";
  const contextPath = device.metadata?.contextPath || "";
  const url = `${protocol}://${device.host}:${device.port}${contextPath}`;
  window.open(url, "_blank");
};
</script>

<style scoped lang="scss">
.detail-dialog {
  :deep(.el-dialog__body) {
    padding: 0 20px 20px;
  }
}

.project-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  margin-bottom: 20px;

  .project-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .project-icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .project-icon-placeholder {
      font-size: 32px;
      color: #3b82f6;
    }
  }

  .project-info {
    flex: 1;

    .project-name {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    .project-platform {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
  }

  .project-stats {
    .stat-item {
      text-align: center;
      padding: 12px 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: #94a3b8;

        &.online {
          color: #10b981;
        }
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
      }
    }
  }
}

.device-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;

    .section-icon {
      font-size: 20px;
      color: #3b82f6;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  .device-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .device-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;

    &:hover {
      background: #fff;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .device-status {
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #94a3b8;

        &.online {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
          animation: pulse 2s infinite;
        }
      }
    }

    .device-info {
      flex: 1;

      .device-main {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;

        .device-port {
          color: #3b82f6;
        }
      }

      .device-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #64748b;

          .meta-icon {
            font-size: 14px;
          }
        }
      }
    }

    .device-actions {
      .el-button {
        color: #3b82f6;

        &:hover {
          background: rgba(59, 130, 246, 0.1);
        }
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
