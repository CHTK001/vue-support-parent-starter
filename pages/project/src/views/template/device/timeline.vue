<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      :title="env.title"
      width="360px"
      draggable
      :close-on-click-modal="false"
      class="timeline-dialog"
    >
      <el-skeleton :loading="env.loading">
        <template #default>
          <el-empty v-if="tableData.length == 0" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(activity, index) in tableData"
              :key="index"
              :timestamp="activity.collectTime"
            >
              <el-tag :type="activity.online == 1 ? 'success' : 'danger'">
                {{ activity.online == 1 ? "上线" : "下线" }}
              </el-tag>
            </el-timeline-item>
          </el-timeline>
        </template>
      </el-skeleton>
    </sc-dialog>
  </div>
</template>
<script setup>
import { defineExpose, reactive, ref } from "vue";
import { fetchTimelineProjectForDevice } from "../../../api/manage/project-device";

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

:deep(.el-timeline) {
  padding-left: 8px;

  .el-timeline-item {
    padding-bottom: 24px;

    .el-timeline-item__node {
      width: 14px;
      height: 14px;
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .el-timeline-item__wrapper {
      padding-left: 24px;
    }

    .el-timeline-item__timestamp {
      color: var(--el-text-color-secondary);
      font-size: 13px;
      margin-top: 8px;
    }
  }
}

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 600;
  padding: 6px 16px;
  font-size: 14px;
}

:deep(.el-empty) {
  padding: 40px 0;
}

:deep(.el-skeleton) {
  padding: 16px 0;
}
</style>
