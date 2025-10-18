<template>
  <div class="p-4">
    <el-input v-model="ip" placeholder="输入IP，如 8.8.8.8" class="w-[260px] mb-2" />
    <ScIp :ip="ip" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScIp from "@repo/components/ScIp/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const ip = ref("8.8.8.8");
const code = computed(() => `<ScIp :ip=\"'${ip.value}'\" />`);
</script>