<template>
  <div class="device-container">
    <div class="device-header-wrapper">
      <el-header class="device-header">
        <div class="device-left-panel">
          <el-form ref="formRef" :inline="true" :model="deviceForm" class="device-search-form">
            <el-form-item label="序列号" prop="sysDeviceSerialNumber" class="device-form-item">
              <el-input v-model="deviceForm.sysDeviceSerialNumber" placeholder="请输入序列号" clearable class="device-input" />
            </el-form-item>

            <el-form-item label="设备名称" prop="sysDeviceName" class="device-form-item">
              <el-input v-model="deviceForm.sysDeviceName" placeholder="请输入设备名称" clearable class="device-input" />
            </el-form-item>
            <el-form-item label="在线状态" prop="sysCameraTemplateOnline" class="device-form-item">
              <el-segmented
                @change="onSearch"
                v-model="deviceForm.sysDeviceOnline"
                class="device-segmented"
                :options="[
                  { label: '全部', value: null },
                  { label: '在线', value: 1 },
                  { label: '离线', value: 0 },
                ]"
              ></el-segmented>
            </el-form-item>
            <el-form-item label="设备状态" prop="sysDeviceStatus" class="device-form-item">
              <el-segmented
                @change="onSearch"
                v-model="deviceForm.sysDeviceStatus"
                class="device-segmented"
                :options="[
                  { label: '全部', value: null },
                  { label: '启用', value: 0 },
                  { label: '禁用', value: 1 },
                ]"
              ></el-segmented>
            </el-form-item>
          </el-form>
        </div>
        <div class="device-right-panel">
          <div class="device-right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" @click="onSearch" class="device-btn device-search-btn" />
            <el-button title="新增" :icon="useRenderIcon('ep:plus')" @click="deviceInstance.dialogOpen(saveDialogRef, {}, 'save')" class="device-btn device-add-btn" />
          </div>
        </div>
      </el-header>
    </div>
    <ScTable ref="tableRef" :url="fetchPageProjectForDevice" :params="deviceForm" :columns="env.columns" class="overflow-auto">
      <el-table-column label="序号" type="index" align="center" fixed width="60px" />
      <el-table-column prop="sysDeviceSerialNumber" label="设备序列号" align="left" fixed width="280px">
        <template #default="{ row }">
          <div>
            <span v-if="row.sysDeviceSerialNumber" class="cursor-default">
              <el-popover width="300px" placement="right" trigger="hover">
                <template #reference>
                  <div class="flex flex-row justify-between relative">
                    <div v-copy:click="row.sysDeviceSerialNumber" class="flex flex-col justify-between">
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
                          'text-green': row.sysDeviceOnline === 1,
                          'text-red': row.sysDeviceOnline != 1,
                        }"
                      >
                        <IconifyIconOnline v-if="row.sysDeviceOnline === 1" icon="humbleicons:wifi" />
                        <IconifyIconOnline v-else icon="humbleicons:wifi-off" />
                      </div>
                      <IconifyIconOnline class="cursor-pointer" title="预览" v-if="row.sysDeviceResourceType == 'CAMERA'" icon="mingcute:computer-camera-fill" @click="deviceInstance.handlePreviewUrl(cameraPreviewDialogRef, row, 'view')" />
                      <IconifyIconOnline v-else :icon="getResourceIcon(row.sysDeviceResourceType)" />
                    </div>
                  </div>
                </template>
                <div class="flex flex-col">
                  <el-form>
                    <el-form-item label="设备序列号" class="!mb-0">
                      <el-text>{{ row.sysDeviceSerialNumber }}</el-text>
                    </el-form-item>
                    <el-form-item label="设备名称" class="!mb-0">
                      <el-text>{{ row.sysDeviceName }}</el-text>
                    </el-form-item>
                    <el-form-item label="设备版本" class="!mb-0">
                      <el-text>{{ row.sysDeviceVersion }}</el-text>
                    </el-form-item>
                    <el-form-item label="设备管道数" class="!mb-0">
                      <el-text>{{ row.sysDeviceChannelCount }}</el-text>
                    </el-form-item>
                  </el-form>
                </div>
              </el-popover>
            </span>
            <el-tag v-else>{{ row.sysDeviceSerialNumber }} </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="sysDeviceOrgCode" label="组织编码" align="left" show-overflow-tooltip min-width="220px">
        <template #default="{ row }">
          <span v-if="row.sysDeviceOrgName || row.sysDeviceOrgCode">
            <span>{{ row.sysDeviceOrgName }}</span>
            <span class="el-form-item-msg">{{ row.sysDeviceOrgCode }}</span>
          </span>
          <span v-else class="text-empty">暂无</span>
        </template>
      </el-table-column>

      <el-table-column prop="sysDeviceNetAddress" label="网路地址" align="center" show-overflow-tooltip width="180px">
        <template #default="{ row }">
          <span v-if="row.sysDeviceNetAddress" style="font-size: 14px">{{ row.sysDeviceNetAddress }}</span>
          <span v-else class="text-empty">暂无</span>
        </template>
      </el-table-column>

      <el-table-column prop="updateTime" label="最后一次更新时间" align="left" width="180px">
        <template #default="{ row }">
          <div>
            <!-- 显示相对时间 -->
            <span>{{ getTimeAgo(row.updateTime || row.createTime) }}</span>
            <br />
            <!-- 显示具体时间 -->
            <span class="text-gray-400">{{ row.updateTime || row.createTime }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="sysDevicePosition" label="位置" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.sysDevicePosition" style="font-size: 14px">{{ row.sysDevicePosition }}</span>
          <span v-else class="text-empty">暂无</span>
        </template>
      </el-table-column>

      <el-table-column label="是否禁用" prop="sysDeviceStatus" width="160px" align="center">
        <template #default="{ row }">
          <el-segmented
            @change="deviceInstance.handleUpdateData(row)"
            v-model="row.sysDeviceStatus"
            :options="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          ></el-segmented>
        </template>
      </el-table-column>
      <el-table-column label="设备状态" prop="sysDeviceOnline" width="240px" align="center">
        <template #default="{ row }">
          <el-segmented
            disabled
            v-model="row.sysDeviceOnline"
            :options="[
              { label: '全部', value: null },
              { label: '在线', value: 1 },
              { label: '离线', value: 0 },
            ]"
          ></el-segmented>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" align="center" width="300px">
        <template #default="{ row }">
          <div class="flex justify-start">
            <el-button class="btn-text" :icon="useRenderIcon('ep:edit')" @click="deviceInstance.dialogOpen(saveDialogRef, row, 'edit')"> </el-button>

            <el-button class="btn-text" title="历史在线" type="warning" :icon="useRenderIcon('ri:timeline-view')" @click="deviceInstance.handleTimeline(timelineDialogRef, row)"> </el-button>
            <el-button class="btn-text" title="管道管理" :icon="useRenderIcon('bi:pip')" @click="deviceInstance.handleChannel(channelDialogRef, row, 'view')"> </el-button>

            <el-popconfirm v-if="row.sysDeviceDisabled == 0" :title="$t('message.confimDelete')" @confirm="deviceInstance.onDelete(tableRef, row, deviceForm)">
              <template #reference>
                <el-button class="btn-text" type="danger" plain link :icon="useRenderIcon('ep:delete')"></el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </ScTable>
    <SaveDialog ref="saveDialogRef" @success="onSearch" />
    <TimelineDialog ref="timelineDialogRef" />
    <CardHistory ref="cardHistoryRef" />
    <ChannelDialog ref="channelDialogRef" @success="onSearch" />
  </div>
</template>
<script setup>
import { fetchPageProjectForDevice } from "@/api/manage/device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, reactive, shallowRef } from "vue";
import { createDevice, getResourceIcon } from "../template/device/hook/device";
import { IconifyIconOnline } from "@repo/components/ReIcon";
// 导入时间处理工具函数
import { getTimeAgo } from "@repo/utils";
const SaveDialog = defineAsyncComponent(() => import("../template/device/save.vue"));
const TimelineDialog = defineAsyncComponent(() => import("../template/device/timeline.vue"));
const CardHistory = defineAsyncComponent(() => import("../template/device/card-history.vue"));
const ChannelDialog = defineAsyncComponent(() => import("../template/device/channel/index.vue"));

const deviceInstance = createDevice();
const saveDialogRef = shallowRef();
const timelineDialogRef = shallowRef();
const channelDialogRef = shallowRef();
const tableRef = shallowRef();
const cardHistoryRef = shallowRef();
const cameraPreviewDialogRef = shallowRef();

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
</script>
<style lang="scss" scoped>
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
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  animation: device-scale-in 0.4s ease-out;
}

.device-header {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: auto !important;
}

.device-left-panel {
  width: 100%;
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
  
  &:focus, &:hover {
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
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.device-table {
  height: 100%;
  
  :deep(.el-table) {
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    
    th {
      background: #f8fafc !important;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
    
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
  
  :deep(.el-table__row) {
    animation: device-fade-in 0.3s ease-out forwards;
    animation-delay: calc(var(--el-transition-duration) * 0.05 * var(--row-index, 0));
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
  color: #306814;
  font-weight: 700;
}

.device-text-red {
  color: #f00e0e;
  font-weight: 700;
}

/* 添加新样式 */
:deep(.el-form-item-msg) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

:deep(.text-empty) {
  color: #909399;
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
</style>
