<template>
  <div>
    <el-dialog v-model="visible" :title="title" draggable :close-on-click-modal="false" @close="onClose">
      <component :is="remote" v-if="remote" style="height: 100%; width: 100%" />
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, defineEmits, defineExpose, reactive } from "vue";
import { loadSfcModule } from "@/utils/sfc";
const emit = defineEmits(["close"]);
const title = ref("");
const visible = ref(false);
const dataReact = reactive({
  data: {}
});
const remote = ref();
/**
 * 关闭弹窗
 */
const onClose = async () => {
  emit("close");
  visible.value = false;
};
const setData = async data => {
  Object.assign(dataReact.data, data);
  title.value = dataReact.data.sysSfcChineseName + "[预览]";
};

const open = async () => {
  visible.value = true;
  let modelCache;
  try {
    modelCache = JSON.parse(dataReact.data.sysSfcModelCache);
  } catch (error) {}
  remote.value = await loadSfcModule(dataReact.data.sysSfcName + ".vue", dataReact.data.sysSfcId, modelCache);
};

defineExpose({
  setData,
  open
});
</script>
