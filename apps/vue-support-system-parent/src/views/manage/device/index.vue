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
            <el-form-item label="设备状态" prop="sysCameraTemplateOnline">
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
      <el-table-column prop="sysDeviceSerialNumber" label="设备序列号" align="left" fixed width="300px">
        <template #default="{ row }">
          <span v-if="row.sysDeviceSerialNumber" class="cursor-default">
            <el-tooltip :content="`${row.sysDeviceSerialNumber}(${row.sysDeviceName})`">
              <span v-copy:click="row.sysDeviceSerialNumber">
                {{ row.sysDeviceSerialNumber }}
                <span class="el-form-item-msg">
                  {{ row.sysDeviceName }}
                </span>
              </span>
            </el-tooltip>
          </span>
          <el-tag v-else>{{ row.sysDeviceSerialNumber }} </el-tag>
          <div class="absolute top-2 right-0 z-[99]">
            <el-badge v-if="row.sysDeviceOnline === 1" type="success" value="在线" color="green" class="top-[1.5px]">
              <template #content="{ value }">
                <el-icon title="在线">
                  <component :is="useRenderIcon('humbleicons:wifi')" />
                </el-icon>
              </template>
            </el-badge>
            <el-badge v-else type="danger" value="离线" class="top-[1.5px]">
              <template #content="{ value }">
                <el-icon title="离线"> <component :is="useRenderIcon('humbleicons:wifi-off')" /> </el-icon>
              </template>
            </el-badge>
            <el-badge v-if="row.sysDeviceStatus === 0" type="success" value="启" color="green"></el-badge>
            <el-badge v-else type="danger" value="禁"></el-badge>
            <el-badge type="primary" :value="row.sysDeviceChannelCount"> </el-badge>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="sysDeviceResourceType" label="资源类型" align="center" show-overflow-tooltip width="120px">
        <template #default="{ row }">
          <el-tooltip v-if="row.sysDeviceDescription || row.sysDeviceVersion" :content="`${row.sysDeviceDescription || ''}  ${row.sysDeviceVersion || ''}`">
            <el-button :title="row.sysDeviceDescription" plain class="btn-text" :icon="useRenderIcon(getResourceIcon(row.sysDeviceResourceType))"></el-button>
          </el-tooltip>
          <el-button v-else plain class="btn-text" :icon="useRenderIcon(getResourceIcon(row.sysDeviceResourceType))"></el-button>
        </template>
      </el-table-column>

      <el-table-column prop="sysDeviceNetAddress" label="网路地址" align="center" show-overflow-tooltip width="180px"> </el-table-column>

      <el-table-column prop="sysDeviceOrgCode" label="组织编码" align="center" show-overflow-tooltip min-width="180px">
        <template #default="scope">
          {{ scope.row.sysDeviceOrgName }}
          <span class="el-form-item-msg">{{ scope.row.sysDeviceOrgCode }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sysDeviceChannelNumber" label="管道号" align="center" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.sysDeviceChannelNumber || "" }}
          <span class="el-form-item-msg">{{ scope.row.sysDeviceChannelName }}</span>
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

      <el-table-column prop="sysDevicePosition" label="位置" align="center" show-overflow-tooltip> </el-table-column>
      <el-table-column prop="updateTime" label="最后一次更新时间" align="center" width="180px">
        <template #default="{ row }">
          <span :title="'更新来自' + row.sysDeviceSerialNumber">{{ row.updateTime || row.createTime }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" align="center" width="300px">
        <template #default="{ row }">
          <div class="flex justify-end">
            <el-button class="btn-text" :icon="useRenderIcon('ep:edit')" @click="deviceInstance.dialogOpen(saveDialogRef, row, 'edit')"> </el-button>
            <el-button class="btn-text" title="在线监测" type="primary" v-if="row.sysDeviceOnline == 1" :icon="useRenderIcon('humbleicons:wifi')" @click="deviceInstance.handleOnline(row)"> </el-button>
            <el-button class="btn-text" title="在线监测" type="danger" v-else :icon="useRenderIcon('humbleicons:wifi-off')" @click="deviceInstance.handleOnline(row)"> </el-button>

            <el-button class="btn-text" title="历史在线" type="warning" :icon="useRenderIcon('ri:timeline-view')" @click="deviceInstance.handleTimeline(timelineDialogRef, row)"> </el-button>
            <el-button class="btn-text" title="预览地址" :icon="useRenderIcon('bi:eye')" v-if="row.sysDeviceResourceType == 'CAMERA'" @click="deviceInstance.handlePreviewUrl(cameraPreviewDialogRef, row, 'view')"> </el-button>
            <el-button class="btn-text" title="历史信息" :icon="useRenderIcon('bi:eye')" v-if="row.sysDeviceResourceType == 'MEN_JIN'" @click="deviceInstance.handlePreviewCardHistory(cardHistoryRef, row, 'view')"> </el-button>

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
    <CameraPreviewDialog ref="cameraPreviewDialogRef" />
    <CardHistory ref="cardHistoryRef" />
  </div>
</template>
<script setup>
import { fetchPageProjectForDevice } from "@/api/manage/device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, reactive, shallowRef } from "vue";
import { createDevice, getResourceIcon } from "../template/device/hook/device";
const SaveDialog = defineAsyncComponent(() => import("../template/device/save.vue"));
const CameraPreviewDialog = defineAsyncComponent(() => import("../template/device/preview/index.vue"));
const TimelineDialog = defineAsyncComponent(() => import("../template/device/timeline.vue"));
const CardHistory = defineAsyncComponent(() => import("../template/device/card-history.vue"));

const deviceInstance = createDevice();
const saveDialogRef = shallowRef();
const timelineDialogRef = shallowRef();
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
