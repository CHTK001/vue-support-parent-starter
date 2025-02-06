<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" width="70%" draggable :close-on-click-modal="false">
      <el-table :data="tableData" :tree-props="treeProps" row-key="sysDeviceOrgId" height="600px" border>
        <el-table-column prop="sysDeviceOrgId" label="组织编码" />
        <el-table-column prop="sysDeviceOrgName" label="组织名称" />
        <el-table-column prop="sysDeviceOrgPid" label="父组织" />
      </el-table>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchListProjectOrgForDevice } from "@/api/manage/project-device";
import { buildTree } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";

const env = reactive({
  visible: false,
  children: "children",
});
const treeProps = reactive({});
const tableData = ref([]);

const handleLoader = async () => {
  fetchListProjectOrgForDevice(env.data).then((res) => {
    tableData.value = buildTree(res?.data || [], "sysDeviceOrgId", "sysDeviceOrgPid");
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
