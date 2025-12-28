<template>
  <sc-dialog v-model="dialogVisible" draggable title="设备详情" width="700px" :close-on-click-modal="true" :destroy-on-close="true" class="device-detail-dialog" @close="handleClose">
    <div class="device-detail-container">
      <div class="device-detail-left">
        <div
          class="device-detail-svg-container"
          @click="deviceData.sysDeviceResourceType === 'CAMERA' && deviceData.sysDeviceOnline == 1 ? deviceInstance.handlePreviewUrl(cameraPreviewDialogRef, deviceData, 'view') : null"
          :class="{
            'device-detail-online': deviceData.sysDeviceOnline == 1,
            'device-detail-offline': deviceData.sysDeviceOnline != 1,
            'device-detail-clickable': deviceData.sysDeviceResourceType === 'CAMERA' && deviceData.sysDeviceOnline == 1,
          }"
        >
          <IconifyIconOnline :icon="getDeviceIcon(deviceData.sysDeviceResourceType)" class="device-detail-svg-icon" />
          <div class="device-detail-status-indicator"></div>
        </div>
        <div class="device-detail-status-text" :class="{ 'device-detail-online-text': deviceData.sysDeviceOnline == 1, 'device-detail-offline-text': deviceData.sysDeviceOnline != 1 }">
          {{ deviceData.sysDeviceOnline == 1 ? "在线" : "离线" }}
        </div>
      </div>
      <div class="device-detail-right">
        <el-descriptions :column="1" border class="device-detail-descriptions">
          <el-descriptions-item label="设备名称" class="device-detail-item">
            <div class="device-detail-value">{{ deviceData.sysDeviceName || "暂无" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="设备序列号" class="device-detail-item">
            <div class="device-detail-copy-container">
              <span class="device-detail-value">{{ deviceData.sysDeviceSerialNumber || "暂无" }}</span>
              <el-button v-if="deviceData.sysDeviceSerialNumber" v-copy:click="deviceData.sysDeviceSerialNumber" type="primary" link size="small" :icon="useRenderIcon('ep:copy-document')" class="device-detail-copy-btn"></el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="网络地址" class="device-detail-item">
            <ScIp :ip="deviceData.sysDeviceNetAddress" :physical-address="deviceData.sysDeviceNetPhysicalAddress" />
          </el-descriptions-item>
          <el-descriptions-item label="设备版本" class="device-detail-item">
            <div class="device-detail-value">{{ deviceData.sysDeviceVersion || "暂无" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="设备管道数" class="device-detail-item">
            <div class="device-detail-value">{{ deviceData.sysDeviceChannelCount || "0" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="组织信息" class="device-detail-item">
            <div v-if="deviceData.sysDeviceOrgName || deviceData.sysDeviceOrgCode" class="device-detail-org">
              <div class="device-detail-value">{{ deviceData.sysDeviceOrgName || "暂无" }}</div>
              <div class="device-detail-secondary">{{ deviceData.sysDeviceOrgCode || "暂无" }}</div>
            </div>
            <span v-else class="device-detail-empty">暂无</span>
          </el-descriptions-item>
          <el-descriptions-item label="位置信息" class="device-detail-item">
            <div class="device-detail-value">{{ deviceData.sysDevicePosition || "暂无" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新时间" class="device-detail-item">
            <div class="device-detail-time">
              <div class="device-detail-value">{{ getTimeAgo(deviceData.updateTime || deviceData.createTime) }}</div>
              <div class="device-detail-secondary">{{ deviceData.updateTime || deviceData.createTime || "暂无" }}</div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="设备状态" class="device-detail-item">
            <el-tag :type="deviceData.sysDeviceStatus === 0 ? 'success' : 'danger'" class="device-detail-tag">
              {{ deviceData.sysDeviceStatus === 0 ? "启用" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 添加管道信息展示 -->
        <div v-if="deviceData.channelList && deviceData.channelList.length > 0" class="device-detail-channels">
          <div class="device-detail-channels-title">
            <IconifyIconOnline icon="mdi:pipe" class="device-detail-channels-icon" />
            <span>管道信息</span>
          </div>
          <div class="device-detail-channels-list">
            <el-tag v-for="(channel, index) in deviceData.channelList" :key="index" :type="channel.sysDeviceChannelStatus === 1 ? 'success' : 'danger'" class="device-detail-channel-tag">
              {{ channel.sysDeviceChannelName || "未命名" }}
              <span class="device-detail-channel-no">({{ channel.sysDeviceChannelNo || "无编号" }})</span>
            </el-tag>

            <div v-if="!deviceData.channelList || deviceData.channelList.length === 0" class="device-detail-empty">暂无管道信息</div>
          </div>
        </div>
      </div>
    </div>
  </sc-dialog>
</template>

<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { deepClean, getTimeAgo } from "@repo/utils";
import { defineAsyncComponent, defineExpose, reactive, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { createDevice } from "../../template/device/hook/device";
const ScIp = defineAsyncComponent(() => import("@repo/components/ScIp/index.vue"));
const deviceInstance = createDevice();
const cameraPreviewDialogRef = shallowRef();

const router = useRouter();
const dialogVisible = ref(false);
const deviceData = reactive({});

// 获取设备图标
const getDeviceIcon = (type) => {
  const iconMap = {
    CAMERA: "mingcute:computer-camera-fill",
    DOOR: "mdi:door",
    ALARM: "mdi:alarm-light",
    SENSOR: "mdi:access-point",
    OTHER: "mdi:devices",
  };

  return iconMap[type] || "mdi:devices";
};

// 打开弹窗
const open = (row) => {
  Object.assign(deviceData, row);
  dialogVisible.value = true;
};

const handleClose = async () => {
  deepClean(deviceData);
  dialogVisible.value = false;
};
// 预览摄像头
const handlePreview = () => {
  dialogVisible.value = false;
  router.push({
    path: "/manage/device/preview",
    query: { id: deviceData.id },
  });
};

defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.device-detail-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
}

.device-detail-container {
  display: flex;
  gap: 28px;
}

.device-detail-left {
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 12px;
}

.device-detail-svg-container {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #f5f7fa;
  margin-bottom: 20px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateY(0);

  &.device-detail-clickable {
    cursor: pointer;

    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover:after {
      opacity: 1;
    }
  }

  &:hover {
    transform: translateY(-5px);
  }

  &.device-detail-online {
    box-shadow:
      0 0 0 8px rgba(48, 104, 20, 0.1),
      0 10px 20px rgba(0, 0, 0, 0.1);
    animation: device-detail-pulse 2.5s infinite;
  }

  &.device-detail-offline {
    box-shadow:
      0 0 0 8px rgba(240, 14, 14, 0.1),
      0 10px 20px rgba(0, 0, 0, 0.1);
    filter: grayscale(0.8);
  }
}

.device-detail-svg-icon {
  font-size: 68px;
  color: #409eff;
  transition: all 0.3s ease;

  .device-detail-offline & {
     color: var(--el-text-color-primary);
  }
}

.device-detail-status-indicator {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transition: all 0.3s ease;

  .device-detail-online & {
    background-color: #67c23a;
    box-shadow: 0 0 0 4px rgba(103, 194, 58, 0.3);
    animation: device-detail-blink 1.5s infinite;
  }

  .device-detail-offline & {
    background-color: #f56c6c;
    box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.3);
  }
}

.device-detail-status-text {
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  animation: device-detail-fade-in 0.5s ease-out;

  &.device-detail-online-text {
    color: #67c23a;
  }

  &.device-detail-offline-text {
    color: #f56c6c;
  }
}

.device-detail-right {
  flex: 1;
  animation: device-detail-slide-in 0.5s ease-out;
}

.device-detail-descriptions {
  :deep(.el-descriptions__body) {
    background-color: var(--el-table-tr-bg-color);
  }

  :deep(.el-descriptions__label) {
    width: 120px;
    color: var(--el-text-color-primary);
    font-weight: 600;
    background-color: var(--el-table-tr-bg-color);
  }

  :deep(.el-descriptions__content) {
    padding: 12px 16px;
  }
}

.device-detail-item {
  transition: background-color 0.3s ease;

  &:hover {
    :deep(.el-descriptions__content) {
      background-color: #f8faff;
    }
  }
}

.device-detail-value {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.device-detail-copy-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-detail-copy-btn {
  opacity: 0.6;
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

.device-detail-secondary {
  font-size: 12px;
   color: var(--el-text-color-primary);
  margin-top: 4px;
}

.device-detail-empty {
  color: #c0c4cc;
  font-style: italic;
}

.device-detail-org {
  display: flex;
  flex-direction: column;
}

.device-detail-time {
  display: flex;
  flex-direction: column;
}

.device-detail-tag {
  font-size: 13px;
  padding: 0 10px;
  height: 26px;
  line-height: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.device-detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.device-detail-btn {
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.device-detail-btn-icon {
  font-size: 16px;
}

.device-detail-preview-btn {
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.2);

  &:hover {
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
  }
}

@keyframes device-detail-pulse {
  0% {
    box-shadow:
      0 0 0 0 rgba(48, 104, 20, 0.4),
      0 10px 20px rgba(0, 0, 0, 0.1);
  }

  70% {
    box-shadow:
      0 0 0 10px rgba(48, 104, 20, 0),
      0 10px 20px rgba(0, 0, 0, 0.1);
  }

  100% {
    box-shadow:
      0 0 0 0 rgba(48, 104, 20, 0),
      0 10px 20px rgba(0, 0, 0, 0.1);
  }
}

@keyframes device-detail-blink {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }

  100% {
    opacity: 1;
  }
}

@keyframes device-detail-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes device-detail-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.device-detail-camera-hint {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin-top: -10px;
  margin-bottom: 10px;
  opacity: 0.8;
  animation: device-detail-fade-in 0.5s ease-out 0.3s both;
}

.device-detail-channels {
  margin-top: 20px;
  background-color: var(--el-table-tr-bg-color);
  border-radius: 8px;
  padding: 16px;
  animation: device-detail-fade-in 0.5s ease-out 0.2s both;
}

.device-detail-channels-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.device-detail-channels-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.device-detail-channels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-detail-channel-tag {
  padding: 0 10px;
  height: 28px;
  line-height: 26px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.device-detail-channel-no {
  font-size: 12px;
  opacity: 0.8;
  margin-left: 2px;
}

@keyframes device-detail-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
