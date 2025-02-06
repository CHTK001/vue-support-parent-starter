<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" width="300px" draggable :close-on-click-modal="false">
      <el-skeleton :loading="env.loading">
        <template #default>
          <el-empty v-if="tableData.length == 0" />
          <el-timeline v-else>
            <el-timeline-item v-for="(activity, index) in tableData" :key="index" :timestamp="activity.collectTime">
              <el-tag :type="activity.online == 1 ? 'success' : 'danger'">
                {{ activity.online == 1 ? "上线" : "下线" }}
              </el-tag>
            </el-timeline-item>
          </el-timeline>
        </template>
      </el-skeleton>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchTimelineProjectForDevice } from "@/api/manage/project-device";
import { buildTree } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";

const env = reactive({
  visible: false,
  loading: true,
  children: "children",
});
const treeProps = reactive({});
const tableData = ref([]);

const handleLoader = async () => {
  env.loading = true;
  fetchTimelineProjectForDevice({
    sysDeviceCameraId: env.data.sysDeviceId,
  })
    .then((res) => {
      tableData.value = res?.data || [];
    })
    .finally(() => {
      env.loading = false;
    });
};
const handleOpen = async (data) => {
  env.visible = true;
  env.title = data.sysDeviceName + " - 组织";
  env.data = data;
  handleLoader();
};

const handleClose = async () => {
  env.visible = false;
  env.loading = true;
};

defineExpose({ handleOpen, handleClose });
</script>
