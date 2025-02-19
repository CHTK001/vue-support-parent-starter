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
      <el-table-column prop="sysDeviceSerialNumber" label="设备序列号" align="center" fixed width="300px" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-if="row.sysDeviceSerialNumber"
            >{{ row.sysDeviceSerialNumber
            }}<el-icon class="cursor-pointer top-[1px] ml-1" v-copy:click="row.sysDeviceSerialNumber">
              <component :is="useRenderIcon('ep:copy-document')"></component>
            </el-icon>
          </el-tag>
          <el-tag v-else>{{ row.sysDeviceSerialNumber }} </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sysDeviceName" label="设备名称" show-overflow-tooltip min-width="160px" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.sysDeviceOnline === 1" title="在线" color="blue">
            <component :is="useRenderIcon('humbleicons:wifi')" />
          </el-icon>
          <el-icon v-else color="red" title="离线"> <component :is="useRenderIcon('humbleicons:wifi-off')" /> </el-icon>{{ row.sysDeviceName }}
          <div class="absolute top-2 right-0 z-[99]" title="管道数量">
            <el-badge type="primary" :value="row.sysDeviceChannelCount"> </el-badge>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="sysDeviceResourceType" label="资源类型" align="center" show-overflow-tooltip width="120px">
        <template #default="{ row }">
          <el-button :title="row.sysDeviceDescription" plain class="btn-text" :icon="useRenderIcon(getResourceIcon(row.sysDeviceResourceType))"></el-button>
          <span class="el-form-item-msg">
            {{ row.sysDeviceVersion }}
          </span>
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
      <el-table-column prop="sysDevicePosition" label="位置" align="center" show-overflow-tooltip> </el-table-column>
      <el-table-column prop="updateTime" label="最后一次更新时间" align="center" width="180px">
        <template #default="{ row }">
          <span :title="'更新来自' + row.sysDeviceSerialNumber">{{ row.updateTime || row.createTime }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" align="center" width="240px">
        <template #default="{ row }">
          <el-button size="small" plain link type="primary" :icon="useRenderIcon('ep:edit')" @click="deviceInstance.dialogOpen(saveDialogRef, row, 'edit')">
            {{ $t("buttons.update") }}
          </el-button>
          <el-button size="small" plain link type="primary" v-if="row.sysDeviceOnline == 1" :icon="useRenderIcon('humbleicons:wifi')" @click="deviceInstance.handleOnline(row)">
            {{ $t("buttons.online") }}
          </el-button>
          <el-button size="small" plain link type="danger" v-else :icon="useRenderIcon('humbleicons:wifi-off')" @click="deviceInstance.handleOnline(row)">
            {{ $t("buttons.offline") }}
          </el-button>

          <el-button size="small" plain link type="danger" v-if="row.sysDeviceResourceType == 'CAMERA'" @click="deviceInstance.handlePreviewUrl(cameraPreviewDialogRef, row, 'view')">
            {{ $t("buttons.preview-url") }}
          </el-button>

          <el-button size="small" plain link type="primary" :icon="useRenderIcon('ri:timeline-view')" @click="deviceInstance.handleTimeline(timelineDialogRef, row)">
            {{ $t("buttons.timeline") }}
          </el-button>
          <el-popconfirm v-if="row.sysDeviceDisabled == 0" :title="$t('message.confimDelete')" @confirm="deviceInstance.onDelete(tableRef, row, deviceForm)">
            <template #reference>
              <el-button size="small" type="danger" plain link :icon="useRenderIcon('ep:delete')">{{ $t("buttons.delete") }}</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </ScTable>
    <SaveDialog ref="saveDialogRef" @success="onSearch" />

    <TimelineDialog ref="timelineDialogRef" />
    <CameraPreviewDialog ref="cameraPreviewDialogRef" />
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

const deviceInstance = createDevice();
const saveDialogRef = shallowRef();
const timelineDialogRef = shallowRef();
const tableRef = shallowRef();
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
