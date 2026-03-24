<template>
  <div class="device-container system-container modern-bg">
    <div class="device-header-wrapper">
      <el-header class="device-header">
        <div class="device-left-panel">
          <ScForm 
            ref="formRef"
            :inline="true"
            :model="deviceForm"
            class="device-search-form"
          >
            <ScFormItem 
              label="序列号"
              prop="sysDeviceSerialNumber"
              class="device-form-item"
            >
              <ScInput 
                v-model="deviceForm.sysDeviceSerialNumber"
                placeholder="请输入序列号"
                clearable
                class="device-input"
              />
            </ScFormItem>

            <ScFormItem 
              label="设备名称"
              prop="sysDeviceName"
              class="device-form-item"
            >
              <ScInput 
                v-model="deviceForm.sysDeviceName"
                placeholder="请输入设备名称"
                clearable
                class="device-input"
              />
            </ScFormItem>
            <ScFormItem 
              label="在线状态"
              prop="sysCameraTemplateOnline"
              class="device-form-item"
            >
              <el-segmented
                v-model="deviceForm.sysDeviceOnline"
                class="device-segmented"
                :options="[
                  { label: '全部', value: null },
                  { label: '在线', value: 1 },
                  { label: '离线', value: 0 },
                ]"
                @change="onSearch"
              />
            </ScFormItem>
            <ScFormItem 
              label="设备状态"
              prop="sysDeviceStatus"
              class="device-form-item"
            >
              <el-segmented
                v-model="deviceForm.sysDeviceStatus"
                class="device-segmented"
                :options="[
                  { label: '全部', value: null },
                  { label: '启用', value: 0 },
                  { label: '禁用', value: 1 },
                ]"
                @change="onSearch"
              />
            </ScFormItem>
          </ScForm>
        </div>
        <div class="device-right-panel">
          <div class="device-right-panel-search">
            <!-- 添加批量播放按钮，仅在有选中项时显示 -->
            <ScButton 
              v-if="selectedRows.length > 0"
              type="success"
              class="device-btn device-play-btn"
              @click="handleBatchPreview"
            >
              <IconifyIconOnline icon="mdi:play-circle" />
              <span class="ml-1">批量播放 ({{ selectedRows.length }})</span>
            </ScButton>
            <ScButton 
              type="primary"
              :icon="useRenderIcon('ri:search-line')"
              class="device-btn device-search-btn"
              @click="onSearch"
            />
            <ScButton 
              title="新增"
              :icon="useRenderIcon('ep:plus')"
              class="device-btn device-add-btn"
              @click="deviceInstance.dialogOpen(saveDialogRef, {}, 'save')"
            />
          </div>
        </div>
      </el-header>
    </div>
    <ScTable
      ref="tableRef"
      :url="fetchPageProjectForDevice"
      :params="deviceForm"
      :columns="env.columns"
      class="overflow-auto"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
    >
      <!-- 添加多选列 -->
      <ScTableColumn type="selection" width="55" fixed="left" />
      <ScTableColumn 
        label="序号"
        type="index"
        align="center"
        fixed
        width="60px"
      />
      <ScTableColumn 
        prop="sysDeviceSerialNumber"
        label="设备序列号"
        align="left"
        fixed
        width="280px"
      >
        <template #default="{ row }">
          <div>
            <span v-if="row.sysDeviceSerialNumber" class="cursor-default">
              <ScPopover width="300px" placement="right" trigger="hover">
                <template #reference>
                  <div class="flex flex-row justify-between relative">
                    <div
                      v-copy:click="row.sysDeviceSerialNumber"
                      class="flex flex-col justify-between"
                    >
                      <span>
                        {{ row.sysDeviceName }}
                      </span>
                      <span class="el-form-item-msg">
                        {{ row.sysDeviceSerialNumber }}
                      </span>
                    </div>
                    <div class="flex justify-center items-center text-[18px]">
                      <div
                        :class="{
                          'device-text-green': row.sysDeviceOnline === 1,
                          'device-text-red': row.sysDeviceOnline != 1,
                        }"
                      >
                        <IconifyIconOnline
                          v-if="row.sysDeviceOnline === 1"
                          icon="humbleicons:wifi"
                        />
                        <IconifyIconOnline v-else icon="humbleicons:wifi-off" />
                      </div>
                      <IconifyIconOnline
                        v-if="row.sysDeviceResourceType == 'CAMERA'"
                        class="cursor-pointer"
                        title="预览"
                        icon="mingcute:computer-camera-fill"
                        @click="
                          deviceInstance.handlePreviewUrl(
                            cameraPreviewDialogRef,
                            row,
                            'view'
                          )
                        "
                      />
                      <IconifyIconOnline
                        v-else
                        :icon="getResourceIcon(row.sysDeviceResourceType)"
                      />
                    </div>
                  </div>
                </template>
                <div class="device-popover-content">
                  <!-- 顶部状态头 -->
                  <div class="popover-header">
                    <div
                      class="popover-status"
                      :class="{ 'is-online': row.sysDeviceOnline === 1 }"
                    >
                      <IconifyIconOnline
                        :icon="
                          row.sysDeviceOnline === 1
                            ? 'mdi:access-point'
                            : 'mdi:access-point-off'
                        "
                        class="status-icon"
                      />
                      <span class="status-text">{{
                        row.sysDeviceOnline === 1 ? "在线" : "离线"
                      }}</span>
                    </div>
                    <div class="popover-type">
                      <IconifyIconOnline
                        :icon="getResourceIcon(row.sysDeviceResourceType)"
                      />
                      <span>{{ row.sysDeviceResourceType || "设备" }}</span>
                    </div>
                  </div>

                  <!-- 设备信息列表 -->
                  <div class="popover-info-list">
                    <!-- 设备序列号 -->
                    <div class="info-item">
                      <div class="info-icon">
                        <IconifyIconOnline icon="mdi:barcode-scan" />
                      </div>
                      <div class="info-content">
                        <span class="info-label">序列号</span>
                        <span class="info-value">{{
                          row.sysDeviceSerialNumber || "暂无"
                        }}</span>
                      </div>
                    </div>

                    <!-- 设备名称 -->
                    <div class="info-item">
                      <div class="info-icon">
                        <IconifyIconOnline icon="mdi:devices" />
                      </div>
                      <div class="info-content">
                        <span class="info-label">设备名称</span>
                        <span class="info-value">{{
                          row.sysDeviceName || "暂无"
                        }}</span>
                      </div>
                    </div>

                    <!-- 设备版本 -->
                    <div class="info-item">
                      <div class="info-icon">
                        <IconifyIconOnline icon="mdi:tag-outline" />
                      </div>
                      <div class="info-content">
                        <span class="info-label">版本</span>
                        <span class="info-value">{{
                          row.sysDeviceVersion || "暂无"
                        }}</span>
                      </div>
                    </div>

                    <!-- 设备管道数 -->
                    <div class="info-item">
                      <div class="info-icon highlight">
                        <IconifyIconOnline icon="mdi:pipe" />
                      </div>
                      <div class="info-content">
                        <span class="info-label">管道数</span>
                        <span class="info-value highlight">{{
                          row.sysDeviceChannelCount || "0"
                        }}</span>
                      </div>
                    </div>

                    <!-- 网络地址 -->
                    <div class="info-item" v-if="row.sysDeviceNetAddress">
                      <div class="info-icon">
                        <IconifyIconOnline icon="mdi:ip-network" />
                      </div>
                      <div class="info-content">
                        <span class="info-label">网络地址</span>
                        <span class="info-value">{{
                          row.sysDeviceNetAddress
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 底部更新时间 -->
                  <div class="popover-footer">
                    <IconifyIconOnline icon="mdi:clock-outline" />
                    <span>{{
                      row.updateTime || row.createTime || "暂无更新记录"
                    }}</span>
                  </div>
                </div>
              </ScPopover>
            </span>
            <ScTag v-else>{{ row.sysDeviceSerialNumber }}</ScTag>
          </div>
        </template>
      </ScTableColumn>

      <ScTableColumn 
        prop="sysDeviceOrgCode"
        label="组织编码"
        align="left"
        show-overflow-tooltip
        min-width="220px"
      >
        <template #default="{ row }">
          <span v-if="row.sysDeviceOrgName || row.sysDeviceOrgCode">
            <span>{{ row.sysDeviceOrgName }}</span>
            <span class="el-form-item-msg">{{ row.sysDeviceOrgCode }}</span>
          </span>
          <span v-else class="text-empty">暂无</span>
        </template>
      </ScTableColumn>

      <ScTableColumn 
        prop="sysDeviceNetAddress"
        label="网路地址"
        align="center"
        show-overflow-tooltip
        width="180px"
      >
        <template #default="{ row }">
          <ScIp
            :key="row.sysDeviceNetAddress"
            :ip="row.sysDeviceNetAddress"
            :physical-address="row.sysDeviceNetPhysicalAddress"
          />
        </template>
      </ScTableColumn>

      <ScTableColumn 
        prop="updateTime"
        label="最后一次更新时间"
        align="left"
        width="180px"
      >
        <template #default="{ row }">
          <div>
            <!-- 显示相对时间 -->
            <span>{{ getTimeAgo(row.updateTime || row.createTime) }}</span>
            <br />
            <!-- 显示具体时间 -->
            <span class="text-gray-400">{{
              row.updateTime || row.createTime
            }}</span>
          </div>
        </template>
      </ScTableColumn>

      <ScTableColumn 
        prop="sysDevicePosition"
        label="位置"
        align="center"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span v-if="row.sysDevicePosition" style="font-size: 14px">{{
            row.sysDevicePosition
          }}</span>
          <span v-else class="text-empty">暂无</span>
        </template>
      </ScTableColumn>

      <ScTableColumn 
        label="是否禁用"
        prop="sysDeviceStatus"
        width="160px"
        align="center"
      >
        <template #default="{ row }">
          <el-segmented
            v-model="row.sysDeviceStatus"
            :options="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
            @change="deviceInstance.handleUpdateData(row)"
          />
        </template>
      </ScTableColumn>
      <ScTableColumn 
        label="设备状态"
        prop="sysDeviceOnline"
        width="240px"
        align="center"
      >
        <template #default="{ row }">
          <el-segmented
            v-model="row.sysDeviceOnline"
            disabled
            :options="[
              { label: '全部', value: null },
              { label: '在线', value: 1 },
              { label: '离线', value: 0 },
            ]"
          />
        </template>
      </ScTableColumn>

      <ScTableColumn 
        label="操作"
        fixed="right"
        align="center"
        min-width="200px"
      >
        <template #default="{ row }">
          <div class="flex justify-start">
            <ScButton 
              class="btn-text"
              :icon="useRenderIcon('ep:edit')"
              @click.stop="
                deviceInstance.dialogOpen(saveDialogRef, row, 'edit')
              "
            />

            <ScButton 
              class="btn-text"
              title="历史在线"
              type="warning"
              :icon="useRenderIcon('ri:timeline-view')"
              @click.stop="
                deviceInstance.handleTimeline(timelineDialogRef, row)
              "
            />
            <ScButton 
              class="btn-text"
              title="管道管理"
              :icon="useRenderIcon('bi:pip')"
              @click.stop="
                deviceInstance.handleChannel(channelDialogRef, row, 'view')
              "
            />

            <ScPopconfirm 
              v-if="row.sysDeviceDisabled == 0"
              :title="$t('message.confimDelete')"
              @confirm="deviceInstance.onDelete(tableRef, row, deviceForm)"
            >
              <template #reference>
                <ScButton 
                  class="btn-text"
                  type="danger"
                  plain
                  link
                  :icon="useRenderIcon('ep:delete')"
                />
              </template>
            </ScPopconfirm>
          </div>
        </template>
      </ScTableColumn>
    </ScTable>
    <SaveDialog ref="saveDialogRef" @success="onSearch" />
    <TimelineDialog ref="timelineDialogRef" />
    <CardHistory ref="cardHistoryRef" />
    <ChannelDialog ref="channelDialogRef" @success="onSearch" />
    <DeviceDetailDialog ref="deviceDetailDialogRef" />
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components";
import { defineAsyncComponent, reactive, ref, shallowRef } from "vue";
import { fetchPageProjectForDevice } from "../../api/manage/device";
import { createDevice, getResourceIcon } from "../template/device/hook/device";
// 导入时间处理工具函数
import { getTimeAgo, message } from "@repo/utils";
const SaveDialog = defineAsyncComponent(
  () => import("../template/device/save.vue")
);
const TimelineDialog = defineAsyncComponent(
  () => import("../template/device/timeline.vue")
);
const CardHistory = defineAsyncComponent(
  () => import("../template/device/card-history.vue")
);
const ChannelDialog = defineAsyncComponent(
  () => import("../template/device/channel/index.vue")
);
const ScIp = defineAsyncComponent(
  () => import("@repo/components/ScIp/index.vue")
);
const DeviceDetailDialog = defineAsyncComponent(
  () => import("./components/DeviceDetailDialog.vue")
);

const deviceInstance = createDevice();
const saveDialogRef = shallowRef();
const timelineDialogRef = shallowRef();
const channelDialogRef = shallowRef();
const tableRef = shallowRef();
const cardHistoryRef = shallowRef();
const cameraPreviewDialogRef = shallowRef();
const deviceDetailDialogRef = shallowRef();

const deviceForm = reactive({
  sysDeviceOnline: null,
  sysDeviceStatus: null,
});
const onSearch = async () => {
  tableRef.value.reload(deviceForm);
};
const env = reactive({
  columns: [],
});
const handleRowClick = (row) => {
  deviceDetailDialogRef.value.open(row);
};

// 添加选中行数据的状态管理
const selectedRows = ref([]);

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 处理批量预览
const handleBatchPreview = () => {
  // 过滤出摄像头类型的设备
  const cameraDevices = selectedRows.value.filter(
    (row) => row.sysDeviceResourceType === "CAMERA"
  );
  if (cameraDevices.length === 0) {
    message("请至少选择一个摄像头设备", { type: "warning" });
    return;
  }

  // 调用预览方法，传入选中的摄像头设备列表
  deviceInstance.handlePreviewUrl(
    cameraPreviewDialogRef,
    cameraDevices,
    "view"
  );
};
</script>
<style lang="scss" scoped>
/* 设备详情弹出框样式 */
.device-popover-content {
  padding: 8px;
  border-radius: 12px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.device-info-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.device-info-item {
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(4px);

    .device-info-icon {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    padding-bottom: 4px;
  }
}

.device-info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  transition: all 0.3s ease;
  background-color: var(--el-color-primary-light-9);
}

.device-info-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

.device-channel-count {
  font-weight: 600;
  color: var(--el-color-primary);
}

.device-text-green {
  color: var(--el-color-success);
  font-weight: 700;
}

.device-text-red {
  color: var(--el-color-danger);
  font-weight: 700;
}

/* 动画定义 */
@keyframes device-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes device-scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 主容器样式 */
.device-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  animation: device-fade-in 0.5s ease-out;
  overflow: hidden;
}

/* 头部样式 */
.device-header-wrapper {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: var(--el-box-shadow-light);
  animation: device-scale-in 0.4s ease-out;
}

.device-header {
  padding: 16px;
  display: flex;
  flex-direction: row;
  height: auto !important;
}

.device-search-form {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-form-item {
  margin-bottom: 12px !important;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.device-input {
  width: 220px !important;
  transition: all 0.3s ease;

  &:focus,
  &:hover {
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.device-segmented {
  transition: all 0.3s ease;

  :deep(.el-segmented-item) {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }

    &.is-active {
      font-weight: 600;
    }
  }
}

.device-right-panel {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.device-right-panel-search {
  display: flex;
  gap: 10px;
}

.device-btn {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
}

.device-search-btn {
  background-color: var(--el-color-primary);

  &:hover {
    background-color: var(--el-color-primary-light-3);
  }
}

.device-add-btn {
  &:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
  }
}

/* 表格样式 */
.device-table-wrapper {
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.device-table {
  height: 100%;

  :deep(.el-table) {
    height: 100%;
    border-radius: 8px;
    overflow: hidden;

    tr {
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.05) !important;
      }
    }

    td {
      padding: 12px 0;
      transition: all 0.3s ease;
    }
  }

  :deep(.el-button.btn-text) {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

/* 原有样式保留但添加前缀 */
.device-text-green {
  color: var(--el-color-success);
  font-weight: 700;
}

.device-text-red {
  color: var(--el-color-danger);
  font-weight: 700;
}

/* 添加新样式 */
:deep(.el-form-item-msg) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

:deep(.text-empty) {
  color: var(--el-text-color-primary);
  font-style: italic;
}

:deep(.el-popover) {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  animation: device-scale-in 0.3s ease-out;
}

:deep(.el-tag) {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

:deep(.el-popconfirm__action) {
  margin-top: 8px;
}

/* 添加批量播放按钮样式 */
.device-play-btn {
  display: flex;
  align-items: center;
  background-color: var(--el-color-success);
  color: var(--el-text-color-primary);
  animation: device-scale-in 0.3s ease-out;

  &:hover {
    background-color: var(--el-color-success-light-3);
  }

  .ml-1 {
    margin-left: 4px;
  }
}
</style>
