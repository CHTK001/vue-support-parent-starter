<template>
  <div class="p-4">
    <ScFile v-model="path" :url="load" placeholder="请选择文件" class="w-[400px]" />
    <p class="mt-2">已选：{{ path }}</p>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScFile from "@repo/components/ScFile/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const path = ref("");

const mockRoot = [
  { absolutePath: 'C:/', isLeaf: false, fileName: 'C:盘', fileType: 'DIRECTORY' },
  { absolutePath: 'D:/', isLeaf: false, fileName: 'D:盘', fileType: 'DIRECTORY' }
];
const mockChildren = (base) => [
  { absolutePath: base + 'logs/', isLeaf: false, fileName: 'logs', fileType: 'DIRECTORY' },
  { absolutePath: base + 'app.log', isLeaf: true, fileName: 'app.log', fileType: 'FILE' }
];

const load = async (params) => {
  if (!params.absolutePath) {
    return Promise.resolve({ data: mockRoot });
  }
  return Promise.resolve({ data: mockChildren(params.absolutePath) });
};

const code = computed(() => `<ScFile v-model=\"path\" :url=\"load\" placeholder=\"请选择文件\" />`);
</script>