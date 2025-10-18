<template>
  <div class="p-4">
    <ScUpload v-model="files" multiple />
    <p class="mt-2">已选择：{{ files?.length || 0 }} 个文件</p>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScUpload from "@repo/components/ScUpload/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const files = ref([]);
const code = computed(() => `<ScUpload v-model=\"files\" multiple />`);
</script>