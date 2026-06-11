<template>
  <div class="device-preview-shell">
    <CameraPreviewDialog ref="cameraPreviewDialogRef" />
  </div>
</template>

<script setup>
import { Base64 } from "js-base64";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/utils";
import CameraPreviewDialog from "./camera-preview.vue";

const route = useRoute();
const cameraPreviewDialogRef = ref();

const openFromData = async (rawData) => {
  if (!rawData) {
    return;
  }

  try {
    const payload = JSON.parse(Base64.decode(String(rawData)));
    await nextTick();
    cameraPreviewDialogRef.value?.handleOpen(payload);
  } catch (error) {
    message("预览数据解析失败", { type: "error" });
  }
};

const syncRoutePreview = () => openFromData(route.query.data);

const handleOpen = async (devices) => {
  await nextTick();
  cameraPreviewDialogRef.value?.handleOpen(devices);
};

const handleClose = () => {
  cameraPreviewDialogRef.value?.handleClose?.();
};

onMounted(syncRoutePreview);

watch(
  () => route.query.data,
  () => {
    syncRoutePreview();
  },
);

onBeforeUnmount(handleClose);

defineExpose({ handleOpen, handleClose });
</script>

<style scoped lang="scss">
.device-preview-shell {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color);
}
</style>
