<template>
  <div class="sc-checkbox-example">
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScCheckbox v-model="checked1">默认</ScCheckbox>
        <ScCheckbox v-model="checked2" border>带边框</ScCheckbox>
        <ScCheckbox v-model="checked3" disabled>禁用</ScCheckbox>
      </div>
    </DemoBlock>

    <DemoBlock title="多选组" :code="codes.group">
      <div class="demo-column">
        <div class="group-row">
          <span class="group-label">爱好：</span>
          <ScCheckboxGroup v-model="hobbies">
            <ScCheckbox label="code">编程</ScCheckbox>
            <ScCheckbox label="music">音乐</ScCheckbox>
            <ScCheckbox label="movie">电影</ScCheckbox>
            <ScCheckbox label="sport">运动</ScCheckbox>
          </ScCheckboxGroup>
        </div>
        <div class="value-display">当前选择：{{ hobbies.join("，") || "无" }}</div>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScCheckbox, ScCheckboxGroup } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const checked1 = ref(true);
const checked2 = ref(false);
const checked3 = ref(false);
const hobbies = ref<string[]>(["code", "music"]);

const codes = {
  basic: `<ScCheckbox v-model="checked1">默认</ScCheckbox>
<ScCheckbox v-model="checked2" border>带边框</ScCheckbox>
<ScCheckbox v-model="checked3" disabled>禁用</ScCheckbox>`,
  group: `<ScCheckboxGroup v-model="hobbies">
  <ScCheckbox label="code">编程</ScCheckbox>
  <ScCheckbox label="music">音乐</ScCheckbox>
  <ScCheckbox label="movie">电影</ScCheckbox>
  <ScCheckbox label="sport">运动</ScCheckbox>
</ScCheckboxGroup>`,
};
</script>

<style scoped lang="scss">
.sc-checkbox-example {
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

  .group-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .group-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .value-display {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>


