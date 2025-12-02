<template>
  <div>
    <el-dialog
      v-model="env.visible"
      :title="env.title"
      width="70%"
      draggable
      :close-on-click-modal="false"
      class="org-dialog"
    >
      <el-table
        :data="tableData"
        :tree-props="treeProps"
        row-key="sysDeviceOrgId"
        height="600px"
        border
      >
        <el-table-column prop="sysDeviceOrgId" label="组织编码" />
        <el-table-column prop="sysDeviceOrgName" label="组织名称" />
        <el-table-column prop="sysDeviceOrgPid" label="父组织" />
      </el-table>
    </el-dialog>
  </div>
</template>
<script setup>
import { buildTree } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
import { fetchListProjectOrgForDevice } from "../../../api/manage/project-device";

const env = reactive({
  visible: false,
  children: "children",
});
const treeProps = reactive({});
const tableData = ref([]);

const handleLoader = async () => {
  fetchListProjectOrgForDevice(env.data).then((res) => {
    tableData.value = buildTree(
      res?.data || [],
      "sysDeviceOrgId",
      "sysDeviceOrgPid"
    );
  });
};
const handleOpen = async (data) => {
  env.visible = true;
  env.title = data.sysProjectName + "组织";
  env.data = data;
  handleLoader();
};

const handleClose = async () => {
  env.visible = false;
};

defineExpose({ handleOpen, handleClose });
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
</style>
