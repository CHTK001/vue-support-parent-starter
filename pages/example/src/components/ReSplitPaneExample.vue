<template>
  <div class="p-2" style="height: 300px;">
    <ReSplitPane :splitSet="{ minPercent: 10, defaultPercent: 40, split: 'vertical' }">
      <template #paneL>
        <div class="flex items-center justify-center h-full bg-[var(--el-fill-color-light)]">左侧</div>
      </template>
      <template #paneR>
        <div class="flex items-center justify-center h-full">右侧</div>
      </template>
    </ReSplitPane>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ReSplitPane from "@repo/components/ReSplitPane/index.tsx";
import CodeDisplay from "./CodeDisplay.vue";

const code = computed(() => `<ReSplitPane :splitSet=\"{ minPercent: 10, defaultPercent: 40, split: 'vertical' }\">\n  <template #paneL>左侧</template>\n  <template #paneR>右侧</template>\n</ReSplitPane>`);
</script>