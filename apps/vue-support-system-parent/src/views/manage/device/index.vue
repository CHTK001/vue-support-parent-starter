<template>
  <div class="h-full">
    <ScTable ref="tableRef" :url="fetchPageProjectForDevice" :params="form" :columns="env.columns" class="overflow-auto">
      <el-table-column label="序号" type="index" align="center" fixed width="60px" />
      <el-table-column prop="sysDeviceSerialNumber" label="设备序列号" align="center" fixed width="300px" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag>{{ row.sysDeviceSerialNumber }} </el-tag>
          <el-icon class="cursor-pointer" v-copy:click="row.sysDeviceSerialNumber">
            <component :is="useRenderIcon('ep:copy-document')"></component>
          </el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="sysDeviceName" label="设备名称" show-overflow-tooltip min-width="160px">
        <template #default="{ row }">
          <el-icon v-if="row.sysDeviceOnline === 1" title="在线" color="blue">
            <component :is="useRenderIcon('humbleicons:wifi')" />
          </el-icon>
          <el-icon v-else color="red" title="离线"> <component :is="useRenderIcon('humbleicons:wifi-off')" /> </el-icon>{{ row.sysDeviceName }}
          <div class="absolute top-0 right-0 z-[99]" title="管道数量">
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
      <el-table-column label="是否禁用" prop="sysDeviceStatus" width="160px">
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
      <el-table-column label="设备状态" prop="sysDeviceOnline" width="240px">
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

          <el-button size="small" plain link type="danger" v-if="row.sysDeviceResourceType == 'CAMERA'" @click="deviceInstance.handlePreviewUrl(cameraPreviewDialogRef, row)">
            {{ $t("buttons.preview-url") }}
          </el-button>

          <el-button size="small" plain link type="primary" :icon="useRenderIcon('ri:timeline-view')" @click="deviceInstance.handleTimeline(timelineDialogRef, row)">
            {{ $t("buttons.timeline") }}
          </el-button>
          <el-popconfirm v-if="row.sysDeviceDisabled == 0" title="确定删除吗？" @confirm="deviceInstance.onDelete(tableRef, row, form)">
            <template #reference>
              <el-button size="small" type="danger" plain link :icon="useRenderIcon('ep:delete')">{{ $t("buttons.delete") }}</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </ScTable>
    <SaveDialog ref="saveDialogRef" @success="onSearch" />

    <LogDialog ref="logDialogRef" />
    <TimelineDialog ref="timelineDialogRef" />
    <CameraPreviewDialog ref="cameraPreviewDialogRef" />
  </div>
</template>
<script lang="tsx" setup>
import { fetchPageProjectForDevice } from "@/api/manage/device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, reactive, shallowRef } from "vue";
import { createDevice, getResourceIcon } from "../template/device/hook/device";
const SaveDialog = defineAsyncComponent(() => import("../template/device/save.vue"));
const CameraPreviewDialog = defineAsyncComponent(() => import("../template/device/camera-preview.vue"));
const TimelineDialog = defineAsyncComponent(() => import("../template/device/timeline.vue"));

const deviceInstance = createDevice();
const saveDialogRef = shallowRef();
const logDialogRef = shallowRef();
const timelineDialogRef = shallowRef();
const tableRef = shallowRef();
const cameraPreviewDialogRef = shallowRef();

const form = reactive({});
const onSearch = async () => {
  tableRef.value.reload(form);
};
const env = reactive({
  columns: [],
});
</script>
