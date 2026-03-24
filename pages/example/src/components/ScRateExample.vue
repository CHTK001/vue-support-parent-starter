<template>
  <div class="sc-rate-example">
    <DemoBlock title="基础评分" :code="codes.basic">
      <div class="demo-row">
        <ScRate v-model="value1" />
        <ScRate v-model="value2" allow-half />
        <ScRate v-model="value3" show-score />
      </div>
    </DemoBlock>

    <DemoBlock title="自定义文字与颜色" :code="codes.custom">
      <div class="demo-row">
        <div class="demo-item">
          <ScRate v-model="value4" show-text :texts="texts" />
          <div class="value-display">当前：{{ texts[value4 - 1] || "未评分" }}</div>
        </div>
        <ScRate
          v-model="value5"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
        />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScRate } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const value1 = ref(3);
const value2 = ref(3.5);
const value3 = ref(4);
const value4 = ref(4);
const value5 = ref(5);

const texts = ["极差", "失望", "一般", "满意", "惊喜"];

const codes = {
  basic: `<ScRate v-model="value1" />
<ScRate v-model="value2" allow-half />
<ScRate v-model="value3" show-score />`,
  custom: `<ScRate v-model="value4" show-text :texts="['极差', '失望', '一般', '满意', '惊喜']" />
<ScRate
  v-model="value5"
  :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
/>`,
};
</script>

<style scoped lang="scss">
.sc-rate-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .demo-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .value-display {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>


