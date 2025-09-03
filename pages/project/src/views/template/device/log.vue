<template>
  <div>
    <el-dialog draggable :title="env.title" width="80%" v-model="env.visible" @close="handleClose" :close-on-click-modal="false">
      <div class="h-[600px]">
        <ScTable :url="fetchPageProjectForDeviceLog" :columns="env.columns">
          <el-table-column prop="sysDeviceCode" label="状态">
            <template #default="{ row }">
              <el-tag v-if="row.sysDeviceCode === 'SUCCESS'" type="success">成功</el-tag>
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
