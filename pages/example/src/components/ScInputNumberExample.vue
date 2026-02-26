<template>
  <div class="sc-input-number-example">
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScInputNumber v-model="num1" :min="0" :max="10" />
        <ScInputNumber v-model="num2" :min="0" :max="10" controls-position="right" />
        <ScInputNumber v-model="num3" :min="0" :max="1" :step="0.1" :precision="1" />
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸与禁用" :code="codes.sizes">
      <div class="demo-row">
        <ScInputNumber v-model="num4" size="small" :min="0" :max="100" />
        <ScInputNumber v-model="num5" size="default" :min="0" :max="100" />
        <ScInputNumber v-model="num6" size="large" :min="0" :max="100" />
        <ScInputNumber v-model="num7" :min="0" :max="100" disabled />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScInputNumber } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const num1 = ref(1);
const num2 = ref(2);
const num3 = ref(0.5);
const num4 = ref(10);
const num5 = ref(20);
const num6 = ref(30);
const num7 = ref(40);

const codes = {
  basic: `<ScInputNumber v-model="num1" :min="0" :max="10" />
<ScInputNumber v-model="num2" :min="0" :max="10" controls-position="right" />
<ScInputNumber v-model="num3" :min="0" :max="1" :step="0.1" :precision="1" />`,
  sizes: `<ScInputNumber v-model="num4" size="small" :min="0" :max="100" />
<ScInputNumber v-model="num5" size="default" :min="0" :max="100" />
<ScInputNumber v-model="num6" size="large" :min="0" :max="100" />
<ScInputNumber v-model="num7" :min="0" :max="100" disabled />`,
};
</script>

<style scoped lang="scss">
.sc-input-number-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
}
</style>


