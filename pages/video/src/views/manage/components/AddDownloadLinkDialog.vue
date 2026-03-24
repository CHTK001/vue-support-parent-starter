<template>
  <base-dialog v-model="dialogVisible" top="20px" draggable :title="title" width="500px" @confirm="submitForm" @cancel="closeDialog" ref="dialogRef">
    <add-download-link ref="addLinkFormRef" :video-id="videoId" :show-video-id-select="false" @success="handleSuccess" />
  </base-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AddDownloadLink from "./AddDownloadLink.vue";
import BaseDialog from "./BaseDialog.vue";

const props = defineProps({
  videoId: {
    type: [Number],
    required: true,
  },
  title: {
    type: String,
    default: "新增下载链接",
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["success", "update:modelValue"]);

const dialogVisible = ref(props.modelValue);
const addLinkFormRef = ref();
const dialogRef = ref();

// 打开对话框
const openDialog = () => {
  dialogVisible.value = true;
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  emit("update:modelValue", false);
};

// 提交表单
const submitForm = async () => {
  if (!addLinkFormRef.value) return;

  dialogRef.value?.setConfirmLoading(true);
  try {
    // 调用子组件的提交方法
    await addLinkFormRef.value.submitForm();
  } finally {
    dialogRef.value?.setConfirmLoading(false);
  }
};

// 处理成功提交
const handleSuccess = (data) => {
  emit("success", data);
  closeDialog();
};

// 监听modelValue变化
defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style lang="scss" scoped>
/* 样式已移至BaseDialog组件 */
</style>
