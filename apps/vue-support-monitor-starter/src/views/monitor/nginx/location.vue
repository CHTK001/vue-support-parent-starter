<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" @close="handleClose" />
  </div>
</template>
<script setup>
import { ref, defineExpose } from "vue";

const visible = ref(false);

const handleClose = async () => {
  visible.value = false;
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  env.title = "nginx配置文件 - " + data.monitorNginxConfigName;
  Object.assign(form, data);
};

defineExpose({
  handleOpen
});
</script>
