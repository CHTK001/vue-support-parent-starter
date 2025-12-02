<template>
  <div>
    <el-dialog
      draggable
      :title="env.title"
      width="80%"
      v-model="env.visible"
      @close="handleClose"
      :close-on-click-modal="false"
      class="log-dialog"
    >
      <div class="h-[600px]">
        <ScTable :url="fetchPageProjectForDeviceLog" :columns="env.columns">
          <el-table-column prop="sysDeviceCode" label="状态">
            <template #default="{ row }">
              <el-tag v-if="row.sysDeviceCode === 'SUCCESS'" type="success"
                >成功</el-tag
              >
              <el-tag v-else type="danger">失败</el-tag>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { defineExpose, reactive } from "vue";
import { fetchPageProjectForDeviceLog } from "../../../api/manage/project-device";
const env = reactive({
  data: {},
  visible: false,
  title: "日志",
  columns: [
    {
      label: "接受方",
      prop: "sysDeviceLogTarget",
    },
    {
      label: "发送模板",
      prop: "sysDeviceLogContent",
    },
    {
      label: "模板参数",
      prop: "sysDeviceLogParam",
    },
    {
      label: "耗时",
      prop: "sysDeviceCost",
      formatter: (row) => {
        return row.sysDeviceCost + " ms";
      },
    },
    {
      label: "失败原因",
      prop: "sysDeviceMessage",
    },
    {
      label: "创建时间",
      prop: "createTime",
    },
  ],
});

const handleOpen = async (data) => {
  env.data = data;
  env.visible = true;
  env.title = data.sysProjectName + "日志";
};

const handleClose = async () => {
  env.visible = false;
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>

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

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
  padding: 4px 12px;
}
</style>
