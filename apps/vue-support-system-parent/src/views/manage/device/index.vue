<template>
  <div class="h-full">
    <div>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" :inline="true" :model="deviceForm" class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto">
            <el-form-item label="序列号" prop="sysDeviceSerialNumber">
              <el-input v-model="deviceForm.sysDeviceSerialNumber" placeholder="请输入序列号" clearable />
            </el-form-item>

            <el-form-item label="设备名称" prop="sysDeviceName">
              <el-input v-model="deviceForm.sysDeviceName" placeholder="请输入设备名称" clearable />
            </el-form-item>
            <el-form-item label="在线状态" prop="sysCameraTemplateOnline">
              <el-segmented
                @change="onSearch"
                v-model="deviceForm.sysDeviceOnline"
                :options="[
                  { label: '全部', value: null },
                  { label: '在线', value: 1 },
                  { label: '离线', value: 0 },
                ]"
              ></el-segmented>
            </el-form-item>
            <el-form-item label="设备状态" prop="sysDeviceStatus">
              <el-segmented
                @change="onSearch"
                v-model="deviceForm.sysDeviceStatus"
                :options="[
                  { label: '全部', value: null },
                  { label: '启用', value: 0 },
                  { label: '禁用', value: 1 },
                ]"
              ></el-segmented>
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" @click="onSearch" />
            <el-button title="新增" :icon="useRenderIcon('ep:plus')" @click="deviceInstance.dialogOpen(saveDialogRef, {}, 'save')" class="mr-3" />
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
.text-green {
  color: #306814;
  font-weight: 700;
}
.text-red {
  color: #f00e0e;
  font-weight: 700;
}
</style>
