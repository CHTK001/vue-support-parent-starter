<template>
  <div>
    <el-dialog v-model="env.visible" width="300px" :title="env.title" draggable :close-on-click-modal="false">
      <div class="flex">
        <el-select @change="handleChangeChannel" ref="selectValueRef" v-model="channelValue" placeholder="请选择管道" clearable multiple>
          <el-option v-for="item in env.form.sysDeviceChannels?.split(',')" :key="item" :label="'管道::' + item" :value="item"></el-option>
        </el-select>
        <div type="primary" :icon="useRenderIcon('ep:right')" @click="handleOpenRealCanvas" class="h-full auto-height">
          <el-icon></el-icon>
        </div>
      </div>
    </el-dialog>
    <CameraPreviewDialog ref="cameraPreviewDialogRef"></CameraPreviewDialog>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineExpose, defineAsyncComponent, reactive, shallowRef, computed, watch } from "vue";
const CameraPreviewDialog = defineAsyncComponent(() => import("./camera-preview.vue"));

const channelValue = shallowRef(null);
const selectValueRef = shallowRef(null);
const env = reactive({
  visible: false,
  title: "预览",
  form: {},
});

const handleChangeChannel = () => {
  const width = selectValueRef.value?.offsetWidth;
};

const handleOpen = async (item) => {
  env.visible = true;
  env.form = item;
  env.title = "预览" + item.sysDeviceName;
};

const handleOpenRealCanvas = async () => {
  debugger;
};

const handleClose = async () => {
  env.visible = false;
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
<style scoped>
.auto-height {
  --button-height: 100%;
  height: var(--button-height);
}
</style>
