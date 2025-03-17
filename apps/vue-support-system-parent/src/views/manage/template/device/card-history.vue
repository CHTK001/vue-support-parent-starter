<script setup>
import { fetchPageProjectForDeviceMenJinHistory } from "@/api/manage/device";
import { defineExpose, nextTick, reactive, shallowRef } from "vue";

const form = shallowRef();
const visible = shallowRef(false);
const tableRef = shallowRef(null);
const params = reactive({});
const handleOpen = async (row, mode) => {
  form.value = row;
  visible.value = true;
  params.sysProjectId = row.sysProjectId;
  params.sysDeviceSerialNumber = row.sysDeviceSerialNumber;
  nextTick(() => {
    tableRef.value.reload(params);
  });
};

const handleClose = () => {
  visible.value = false;
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" title="门禁历史记录" draggable @close="handleClose">
      <ScTable ref="tableRef" :url="fetchPageProjectForDeviceMenJinHistory" :params="params" :search="false" :height="400">
        <el-table-column prop="sysDeviceCardEventTime" label="事件时间"></el-table-column>
        <el-table-column prop="sysDeviceSerialNumber" label="设备序列号"></el-table-column>
        <el-table-column prop="sysDeviceCardEventMajorName" label="主事件类型"></el-table-column>
        <el-table-column prop="sysDeviceCardEventMinorName" label="次事件类型"></el-table-column>
        <el-table-column prop="sysDeviceCardEventMessageId" label="事件ID"></el-table-column>
      </ScTable>
    </el-dialog>
  </div>
</template>
