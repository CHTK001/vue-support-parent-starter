<template>
  <div class="p-4">
    <el-form label-width="100px">
      <ScElFormItem label="用户名" tips="请输入系统登录用户名">
        <el-input v-model="name" placeholder="用户名" />
      </ScElFormItem>
    </el-form>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScElFormItem from "@repo/components/ScElFormItem/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const name = ref("");
const code = computed(() => `<el-form label-width=\"100px\">\n  <ScElFormItem label=\"用户名\" tips=\"请输入系统登录用户名\">\n    <el-input v-model=\"name\" />\n  </ScElFormItem>\n</el-form>`);
</script>