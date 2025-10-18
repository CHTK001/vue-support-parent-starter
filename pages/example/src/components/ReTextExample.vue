<template>
  <div class="p-4">
    <ReText :lineClamp="2" class="w-[400px]">
      这是一段很长很长的文本，用于演示多行省略显示效果。鼠标悬停将通过 tippy 显示完整内容……
    </ReText>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ReText from "@repo/components/ReText/src/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const code = computed(() => `<ReText :lineClamp=\"2\">长文本内容</ReText>`);
</script>