<template>
  <div class="sc-radio-example">
    <DemoBlock title="单选框" :code="codes.basic">
      <div class="demo-row">
        <ScRadio v-model="value1" label="A">选项 A</ScRadio>
        <ScRadio v-model="value1" label="B">选项 B</ScRadio>
        <ScRadio v-model="value1" label="C" disabled>禁用</ScRadio>
      </div>
    </DemoBlock>

    <DemoBlock title="单选组" :code="codes.group">
      <div class="demo-column">
        <ScRadioGroup v-model="value2">
          <ScRadio label="small">小号</ScRadio>
          <ScRadio label="default">默认</ScRadio>
          <ScRadio label="large">大号</ScRadio>
        </ScRadioGroup>
        <div class="value-display">当前选择：{{ value2 }}</div>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScRadio, ScRadioGroup } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const value1 = ref<string | number | boolean>("A");
const value2 = ref("default");

const codes = {
  basic: `<ScRadio v-model="value1" label="A">选项 A</ScRadio>
<ScRadio v-model="value1" label="B">选项 B</ScRadio>
<ScRadio v-model="value1" label="C" disabled>禁用</ScRadio>`,
  group: `<ScRadioGroup v-model="value2">
  <ScRadio label="small">小号</ScRadio>
  <ScRadio label="default">默认</ScRadio>
  <ScRadio label="large">大号</ScRadio>
</ScRadioGroup>`,
};
</script>

<style scoped lang="scss">
.sc-radio-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .value-display {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>


