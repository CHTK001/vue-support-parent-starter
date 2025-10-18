<template>
  <div class="p-4">
    <ReSeamlessScroll :data="list" :classOption="{ key: 1, direction: 'top', step: 1, autoPlay: true, limitMoveNum: 3 }">
      <ul>
        <li v-for="(it, i) in list" :key="i" class="py-2">{{ it }}</li>
      </ul>
    </ReSeamlessScroll>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ReSeamlessScroll from "@repo/components/ReSeamlessScroll/src/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const list = ref(["条目 1", "条目 2", "条目 3", "条目 4", "条目 5", "条目 6"]);

const code = computed(() => `<ReSeamlessScroll :data=\"list\" :classOption=\"{ key:1, direction:'top', step:1 }\">\n  <ul>\n    <li v-for=\"(it,i) in list\" :key=\"i\">{{ it }}</li>\n  </ul>\n</ReSeamlessScroll>`);
</script>