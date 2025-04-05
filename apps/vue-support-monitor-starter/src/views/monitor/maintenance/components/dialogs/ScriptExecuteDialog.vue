<template>
  <el-dialog v-model="visible" title="执行脚本" width="500px" :close-on-click-modal="false">
    <div class="execute-warning">
      <IconifyIconOnline icon="ri:alert-line" class="warning-icon" />
      <span>确定要在维护组下的所有主机上执行该脚本吗？</span>
    </div>
    <div class="script-info">
      <div class="info-item">
        <span class="info-label">脚本名称：</span>
        <span class="info-value">{{ scriptName }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">描述：</span>
        <span class="info-value">{{ scriptDesc || "暂无描述" }}</span>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="execute" :loading="executing">确认执行</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from "vue";

const emit = defineEmits(["update:visible", "execute", "close"]);

const visible = ref(false);
const executing = ref(false);
const scriptId = ref(null);
const scriptName = ref("");
const scriptDesc = ref("");

// 打开对话框
const open = script => {
  scriptId.value = script.maintenanceScriptId;
  scriptName.value = script.maintenanceScriptName;
  scriptDesc.value = script.maintenanceScriptDesc;
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 执行脚本
const execute = () => {
  executing.value = true;
  emit("execute", scriptId.value);
};

defineExpose({
  open,
  close,
  executing: {
    get: () => executing.value,
    set: val => (executing.value = val)
  }
});
</script>

<style lang="scss" scoped>
.execute-warning {
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

.script-info {
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
