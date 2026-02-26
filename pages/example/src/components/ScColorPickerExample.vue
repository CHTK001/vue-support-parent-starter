<template>
  <div class="sc-color-picker-example">
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScColorPicker v-model="color1" />
        <ScColorPicker v-model="color2" show-alpha />
      </div>
    </DemoBlock>

    <DemoBlock title="预设颜色" :code="codes.predefine">
      <div class="demo-row">
        <ScColorPicker v-model="color3" :predefine="predefine" />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScColorPicker } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const color1 = ref("#409EFF");
const color2 = ref("rgba(64, 158, 255, 0.8)");
const color3 = ref("#67C23A");

const predefine = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#303133",
];

const codes = {
  basic: `<ScColorPicker v-model="color1" />
<ScColorPicker v-model="color2" show-alpha />`,
  predefine: `<ScColorPicker v-model="color3" :predefine="[
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#303133',
]" />`,
};
</script>

<style scoped lang="scss">
.sc-color-picker-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
}
</style>


