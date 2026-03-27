<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="820px"
    draggable
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="detail-shell">
      <div class="project-header">
        <div class="project-icon">
          <img
            v-if="data.systemDataSettingIcon"
            :src="data.systemDataSettingIcon"
            alt=""
          />
          <IconifyIconOnline v-else icon="ri:apps-2-line" />
        </div>
        <div class="project-copy">
          <h3>{{ data.monitorName || "未命名应用" }}</h3>
          <p>{{ data.monitorApplicationName || "未知平台" }}</p>
        </div>
        <div class="project-stat">
          <span class="project-stat-value" :class="{ online: deviceCount > 0 }">
            {{ deviceCount }}
          </span>
          <span class="project-stat-label">在线设备</span>
        </div>
      </div>

      <div class="device-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:server-line" />
          <span>设备列表</span>
        </div>

        <div v-if="devices.length" class="device-list">
          <div
            v-for="(device, index) in devices"
            :key="device.serverId || index"
            class="device-card"
          >
            <div class="device-status"></div>
            <div class="device-copy">
              <div class="device-address">
                <span>{{ device.host }}</span>
                <span class="port">:{{ device.port }}</span>
              </div>
              <div class="device-meta">
                <span v-if="device.metadata?.hostname">
                  <IconifyIconOnline icon="ri:computer-line" />
                  {{ device.metadata.hostname }}
                </span>
                <span v-if="device.metadata?.contextPath">
                  <IconifyIconOnline icon="ri:link" />
                  {{ device.metadata.contextPath }}
                </span>
                <span v-if="device.metadata?.javaVersion">
                  <IconifyIconOnline icon="simple-icons:openjdk" />
                  {{ device.metadata.javaVersion }}
                </span>
              </div>
            </div>
            <el-button size="small" circle @click="handleVisitDevice(device)">
              <IconifyIconOnline icon="ri:external-link-line" />
            </el-button>
          </div>
        </div>
        <el-empty v-else description="暂无在线设备" />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Discovery {
  host: string;
  port: number;
  serverId?: string;
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
  visible?: boolean;
  data?: MonitorApplication;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  data: () => ({}),
});

const emit = defineEmits(["update:visible", "close"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value),
});

const dialogTitle = computed(() => {
  return `${props.data.monitorName || "应用"}详情`;
});

const devices = computed(() => props.data.monitorRequests || []);
const deviceCount = computed(() => devices.value.length);

const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};

const handleVisitDevice = (device: Discovery) => {
  const protocol = device.protocol || "http";
  const contextPath = device.metadata?.contextPath || "";
  window.open(`${protocol}://${device.host}:${device.port}${contextPath}`, "_blank");
};
</script>

<style scoped lang="scss">
.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef6ff, #f8fbff);
  border: 1px solid var(--el-border-color-lighter);
}

.project-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  color: var(--el-color-primary);
  font-size: 28px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.project-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-copy {
  flex: 1;
}

.project-copy h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.project-copy p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.project-stat {
  min-width: 92px;
  text-align: center;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
}

.project-stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
}

.project-stat-value.online {
  color: var(--el-color-success);
}

.project-stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-title :deep(svg) {
  color: var(--el-color-primary);
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow: auto;
}

.device-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.device-status {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px rgba(103, 194, 58, 0.15);
}

.device-copy {
  flex: 1;
  min-width: 0;
}

.device-address {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 4px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.device-address .port {
  color: var(--el-color-primary);
}

.device-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.device-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
