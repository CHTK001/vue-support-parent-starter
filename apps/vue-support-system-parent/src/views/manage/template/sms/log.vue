<template>
  <div>
    <el-dialog draggable :title="env.title" width="80%" v-model="env.visible" @close="handleClose" :close-on-click-modal="false">
      <div class="h-[600px]">
        <ScTable :url="fetchPageProjectForSmsLog" :columns="env.columns">
          <el-table-column prop="sysSmsCode" label="状态">
            <template #default="{ row }">
              <el-tag v-if="row.sysSmsCode === 'SUCCESS'" type="success">成功</el-tag>
              <el-tag v-else type="danger">失败</el-tag>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { defineExpose, reactive, ref } from "vue";
import { fetchPageProjectForSmsLog } from "@/api/manage/project-sms";
const env = reactive({
  data: {},
  visible: false,
  title: "日志",
  columns: [
    {
      label: "接受方",
      prop: "sysSmsLogTarget",
    },
    {
      label: "发送模板",
      prop: "sysSmsLogContent",
    },
    {
      label: "模板参数",
      prop: "sysSmsLogParam",
    },
    {
      label: "耗时",
      prop: "sysSmsCost",
      formatter: (row) => {
        return row.sysSmsCost + " ms";
      },
    },
    {
      label: "失败原因",
      prop: "sysSmsMessage",
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
