<template>
  <div>
    <el-row class="h-full">
      <el-col :md="8" class="h-full">
        <div>新文件</div>
        <ScCodeEditor v-if="type === 'yaml'" v-model="newContent" height="100%" class="h-full" mode="text/x-yaml" @updateValue="it => (newContent = it)" />
        <JsonEditorVue v-else-if="type === 'json'" v-model="newContent" lang="zh" class="editor h-full" @update:modelValue="it => (newContent = JSON.stringify(it, null, 4))" @blur="validate" />
        <el-input v-model="newContent" class="textarea-with-line-numbers" type="textarea" autosize />
      </el-col>
      <el-col :md="8" class="h-full pl-2">
        <div>旧文件</div>
        <ScCodeEditor v-if="type === 'yaml'" v-model="oldContent" height="100%" class="h-full" mode="text/x-yaml" @updateValue="it => (oldContent = it)" />
        <JsonEditorVue v-else-if="type === 'json'" v-model="oldContent" lang="zh" class="editor h-full" @blur="validate" @update:modelValue="it => (oldContent = JSON.stringify(it, null, 4))" />
        <el-input v-else v-model="oldContent" class="textarea-with-line-numbers" type="textarea" autosize />
      </el-col>
      <el-col :md="8" class="h-full pl-2">
        <el-form :inline="true">
          <el-form-item label="类型">
            <el-select v-model="type" class="!w-[100px]">
              <el-option value="json" label="JsonView" />
              <el-option value="yaml" label="Yaml" />
              <el-option value="text" label="文本" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示方式" class="!w-[200px]">
            <el-select v-model="outputFormat">
              <el-option value="side-by-side" label="side-by-side" />
              <el-option value="line-by-line" label="line-by-line" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="!h-full" v-html="prettyHtml" />
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import ScCodeEditor from "@repo/ui/components/scCodeEditor/index.vue";
import * as Diff2Html from "diff2html";
import * as Diff from "diff";
import "codemirror/addon/lint/yaml-lint";
import "codemirror/mode/yaml/yaml";

import * as YamlLoader from "js-yaml";
import "diff2html/bundles/css/diff2html.min.css";
import { computed, ref } from "vue";
import JsonEditorVue from "json-editor-vue3";

const newContent = ref("");
const type = ref("");
const outputFormat = ref("side-by-side");
const oldContent = ref("");
const prettyHtml = computed(() => {
  return Diff2Html.html(Diff.createTwoFilesPatch("新文件", "旧文件", newContent.value, oldContent.value), {
    drawFileList: true,
    matching: "lines",
    outputFormat: outputFormat.value
  });
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
