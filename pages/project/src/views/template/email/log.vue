<template>
  <div>
    <sc-dialog draggable :title="env.title" width="80%" v-model="env.visible" @close="handleClose" :close-on-click-modal="false">
      <div class="h-[600px]">
        <ScTable :url="fetchPageProjectForEmailLog" :columns="env.columns">
          <el-table-column prop="sysEmailRead" label="是否已读">
            <template #default="{ row }">
              <el-tag v-if="row.sysEmailRead == 1" type="success">已读</el-tag>
              <el-tag v-else type="danger">未读</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysEmailCode" label="状态">
            <template #default="{ row }">
              <el-tag v-if="row.sysEmailCode === 'SUCCESS'" type="success">成功</el-tag>
              <el-tag v-else type="danger">失败</el-tag>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </sc-dialog>
  </div>
</template>
<script setup>
import { defineExpose, reactive } from "vue";
import { fetchPageProjectForEmailLog } from "../../../api/manage/project-email";
const env = reactive({
  data: {},
  visible: false,
  title: "日志",
  columns: [
    {
      label: "接受方",
      prop: "sysEmailLogTarget",
    },
    {
      label: "发送模板",
      prop: "sysEmailLogContent",
    },
    {
      label: "模板参数",
      prop: "sysEmailLogParam",
    },
    {
      label: "耗时",
      prop: "sysEmailCost",
      formatter: (row) => {
        return row.sysEmailCost + " ms";
      },
    },
    {
      label: "失败原因",
      prop: "sysEmailMessage",
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
