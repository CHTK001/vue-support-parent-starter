<template>
  <el-dialog v-model="visible" title="文件部署" width="500px" :close-on-click-modal="false">
    <div class="deploy-warning">
      <IconifyIconOnline icon="ri:alert-line" class="warning-icon" />
      <span>确定要将该文件部署到维护组下的所有主机上吗？</span>
    </div>
    <div class="file-info">
      <div class="info-item">
        <span class="info-label">文件名称：</span>
        <span class="info-value">{{ fileName }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">目标路径：</span>
        <span class="info-value">{{ filePath || "/" }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">自动解压：</span>
        <span class="info-value">{{ fileExtract ? "是" : "否" }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">覆盖文件：</span>
        <span class="info-value">{{ fileOverride ? "是" : "否" }}</span>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="deploy" :loading="deploying">确认部署</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from "vue";

const emit = defineEmits(["update:visible", "deploy", "close"]);

const visible = ref(false);
const deploying = ref(false);
const fileId = ref(null);
const fileName = ref("");
const filePath = ref("");
const fileExtract = ref(false);
const fileOverride = ref(false);

// 打开对话框
const open = file => {
  fileId.value = file.maintenanceFileId;
  fileName.value = file.maintenanceFileName;
  filePath.value = file.maintenanceFilePath;
  fileExtract.value = file.maintenanceFileExtract === 1;
  fileOverride.value = file.maintenanceFileOverride === 1;
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 部署文件
const deploy = () => {
  deploying.value = true;
  emit("deploy", fileId.value);
};

defineExpose({
  open,
  close,
  deploying: {
    get: () => deploying.value,
    set: val => (deploying.value = val)
  }
});
</script>

<style lang="scss" scoped>
.deploy-warning {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: var(--el-color-warning-light-9);
  border-radius: 4px;
  margin-bottom: 16px;

  .warning-icon {
    font-size: 24px;
    color: var(--el-color-warning);
    margin-right: 8px;
  }
}

.file-info {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;

  .info-item {
    margin-bottom: 8px;
    display: flex;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-weight: 500;
      color: var(--el-text-color-secondary);
      min-width: 80px;
    }

    .info-value {
      flex: 1;
      word-break: break-all;
    }
  }
}
</style>
