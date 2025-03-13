<template>
  <div>
    <el-row class="h-full">
      <el-col :md="12" class="h-full">
        <el-input v-model="newContent" class="textarea-with-line-numbers" type="textarea" autosize />
      </el-col>
      <el-col :md="12" class="h-full pl-2">
        <JsonEditorVue v-model="oldContent" class="editor h-full" @blur="validate" />
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import JsonEditorVue from "json-editor-vue3";

import { computed, ref } from "vue";

const newContent = ref("");
const oldContent = computed(() => {
  try {
    return JSON.parse(newContent.value);
  } catch (error) {
    return {};
  }
});
</script>
<style scoped>
.textarea-with-line-numbers {
  counter-reset: line;
}

.textarea-with-line-numbers textarea::before {
  counter-increment: line;
  content: counter(line);
  border-right: 1px solid #ccc;
  margin-right: 5px;
  padding-right: 5px;
  color: #999;
  font-size: 12px;
  text-align: right;
  display: block;
  width: 30px;
}
:deep(.el-textarea__inner) {
  height: 100% !important; /* 设置textarea高度全屏 */
  border: none; /* 移除边框 */
  padding: 0; /* 移除填充 */
  resize: none; /* 禁止调整大小 */
}
:deep(.el-textarea) {
  height: 100%;
}
</style>
