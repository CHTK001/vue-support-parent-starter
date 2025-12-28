<template>
  <div>
    <sc-dialog v-model="visible" draggable title="编码" width="70vw" top="10px" @close="handleClose">
      <ScCodeEditor v-model="form.sysSfcContent" style="width: 100%; height: 70vh" :options="options" mode="vue" @updateValue="handleUpdateValue" />
    </sc-dialog>
  </div>
</template>

<script setup>
import "codemirror/mode/vue/vue";
import { reactive, defineAsyncComponent, defineExpose, ref } from "vue";
const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"));
const form = reactive({ sysSfcContent: "" });
const visible = ref(false);
const emits = defineEmits(["update:modelValue"]);
const options = {
  col: 300,
  height: 2000,
  hintOptions: {
    // 自定义提示选项
    completeSingle: false,
  },
};

const setData = async (item) => {
  Object.assign(form, item);
  return this;
};

const handleUpdateValue = async (value) => {
  emits("updateValue", value);
};
const handleClose = async () => {
  visible.value = false;
};

const open = async () => {
  visible.value = true;
};

defineExpose({ setData, open });
</script>
