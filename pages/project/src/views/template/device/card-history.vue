<script setup>
import { defineExpose, nextTick, reactive, shallowRef } from "vue";
import { fetchPageProjectForDeviceMenJinHistory } from "../../../api/manage/device";

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
    <sc-dialog
      v-model="visible"
      title="门禁历史记录"
      draggable
      @close="handleClose"
      class="history-dialog"
    >
      <ScTable
        ref="tableRef"
        :url="fetchPageProjectForDeviceMenJinHistory"
        :params="params"
        :search="false"
        :height="400"
      >
        <ScTableColumn 
          prop="sysDeviceCardEventTime"
          label="事件时间"
        ></ScTableColumn>
        <ScTableColumn 
          prop="sysDeviceSerialNumber"
          label="设备序列号"
        ></ScTableColumn>
        <ScTableColumn 
          prop="sysDeviceCardEventMajorName"
          label="主事件类型"
        ></ScTableColumn>
        <ScTableColumn 
          prop="sysDeviceCardEventMinorName"
          label="次事件类型"
        ></ScTableColumn>
        <ScTableColumn 
          prop="sysDeviceCardEventMessageId"
          label="事件ID"
        ></ScTableColumn>
      </ScTable>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: var(--el-bg-color);
  }
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--el-border-color-lighter);

  th {
    background: linear-gradient(
      180deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color-lighter) 100%
    ) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-table__row {
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(
        90deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-bg-color) 100%
      ) !important;
    }
  }
}
</style>
