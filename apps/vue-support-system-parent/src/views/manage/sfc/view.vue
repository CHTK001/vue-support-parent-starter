<template>
  <div class="overflow-hidden">
    <el-dialog v-model="visible" class="max-h-[750px] overflow-hidden" top="10px" :title="title" draggable :close-on-click-modal="false" :overflow="false" @close="onClose">
      <div class="h-[650px] overflow-auto relative">
        <component
          :is="remote"
          v-if="remote"
          style="height: 100%; width: 100%"
          :frameInfo="{
            fullPath: dataReact.data.sysSfcPath,
          }"
        />
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, defineEmits, defineExpose, reactive } from "vue";
import { loadSfcModule } from "@repo/utils";
const emit = defineEmits(["close"]);
const title = ref("");
const visible = ref(false);
const dataReact = reactive({
  data: {},
});
const remote = ref();
/**
 * 关闭弹窗
 */
const onClose = async () => {
  emit("close");
  visible.value = false;
};
const setData = async (data) => {
  Object.assign(dataReact.data, data);
  title.value = dataReact.data.sysSfcChineseName + "[预览]";
};

const open = async () => {
  visible.value = true;
  let modelCache;
  try {
    modelCache = JSON.parse(dataReact.data.sysSfcModelCache);
  } catch (error) {}
  remote.value = await loadSfcModule(dataReact.data.sysSfcName + ".vue", dataReact.data.sysSfcId, dataReact.data);
};

defineExpose({
  setData,
  open,
});
</script>
