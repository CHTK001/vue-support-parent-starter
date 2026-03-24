<template>
  <div class="sc-progress-example">
    <DemoBlock title="线性进度条" :code="codes.line">
      <div class="demo-column">
        <ScProgress :percentage="30" />
        <ScProgress :percentage="70" status="success" />
        <ScProgress :percentage="50" status="warning" text-position="top" />
        <ScProgress
          :percentage="85"
          :stages="stages"
          text-position="right"
          :width="260"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="液体进度条" :code="codes.liquid">
      <div class="demo-row">
        <ScProgress type="liquid" :percentage="40" :size="120" />
        <ScProgress
          type="liquid"
          :percentage="72"
          :size="140"
          desc="CPU 使用率"
        />
        <ScProgress
          type="liquid"
          :percentage="92"
          :size="140"
          status="success"
          :stages="stages"
        />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ScProgress } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const stages = computed(() => [
  { threshold: 30, color: "#67C23A" },
  { threshold: 60, color: "#E6A23C" },
  { threshold: 100, color: "#F56C6C" },
]);

const codes = {
  line: `<ScProgress :percentage="30" />
<ScProgress :percentage="70" status="success" />
<ScProgress :percentage="50" status="warning" text-position="top" />
<ScProgress
  :percentage="85"
  :stages="[
    { threshold: 30, color: '#67C23A' },
    { threshold: 60, color: '#E6A23C' },
    { threshold: 100, color: '#F56C6C' },
  ]"
  text-position="right"
  :width="260"
/>`,
  liquid: `<ScProgress type="liquid" :percentage="40" :size="120" />
<ScProgress
  type="liquid"
  :percentage="72"
  :size="140"
  desc="CPU 使用率"
/>
<ScProgress
  type="liquid"
  :percentage="92"
  :size="140"
  status="success"
  :stages="[
    { threshold: 30, color: '#67C23A' },
    { threshold: 60, color: '#E6A23C' },
    { threshold: 100, color: '#F56C6C' },
  ]"
/>`,
};
</script>

<style scoped lang="scss">
.sc-progress-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .demo-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>


