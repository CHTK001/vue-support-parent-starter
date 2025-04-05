<template>
  <el-dialog v-model="dialogVisible" :title="title" :width="width" :destroy-on-close="destroyOnClose" :close-on-click-modal="closeOnClickModal" @closed="handleClosed" @open="handleOpen">
    <slot></slot>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "对话框",
  },
  width: {
    type: String,
    default: "500px",
  },
  destroyOnClose: {
    type: Boolean,
    default: true,
  },
  closeOnClickModal: {
    type: Boolean,
    default: false,
  },
  cancelText: {
    type: String,
    default: "取消",
  },
  confirmText: {
    type: String,
    default: "确认",
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel", "closed", "open"]);

const dialogVisible = ref(props.modelValue);
const confirmLoading = ref(false);

// 监听modelValue变化
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val;
  }
);

// 监听dialogVisible变化
watch(
  () => dialogVisible.value,
  (val) => {
    emit("update:modelValue", val);
  }
);

// 打开对话框
const openDialog = () => {
  dialogVisible.value = true;
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  emit("cancel");
};

// 确认按钮点击
const handleConfirm = () => {
  emit("confirm");
};

// 对话框关闭后的回调
const handleClosed = () => {
  emit("closed");
};

// 对话框打开的回调
const handleOpen = () => {
  emit("open");
};

// 设置确认按钮加载状态
const setConfirmLoading = (loading: boolean) => {
  confirmLoading.value = loading;
};

defineExpose({
  openDialog,
  closeDialog,
  setConfirmLoading,
});
</script>

<style lang="scss" scoped>
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .el-dialog__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-weight: 700;
      color: var(--el-color-primary);
      font-size: 18px;
    }
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 16px 20px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
