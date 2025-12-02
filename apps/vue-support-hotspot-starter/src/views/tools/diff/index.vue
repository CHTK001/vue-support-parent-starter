<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:file-compare-line" class="title-icon" />
            文件对比工具
          </h1>
          <p class="page-subtitle">对比两个文件的差异，支持 JSON/YAML/文本</p>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <el-row class="h-full" :gutter="16">
          <el-col :md="8" class="h-full">
            <div class="file-header">
              <IconifyIconOnline icon="ri:file-add-line" class="file-icon" />
              <span>新文件</span>
            </div>
            <ScCodeEditor v-if="type === 'yaml'" v-model="newContent" height="100%" class="h-full" mode="text/x-yaml" @updateValue="it => (newContent = it)" />
            <el-input v-model="newContent" class="textarea-with-line-numbers" type="textarea" autosize />
          </el-col>
          <el-col :md="8" class="h-full">
            <div class="file-header">
              <IconifyIconOnline icon="ri:file-line" class="file-icon" />
              <span>旧文件</span>
            </div>
            <ScCodeEditor v-if="type === 'yaml'" v-model="oldContent" height="100%" class="h-full" mode="text/x-yaml" @updateValue="it => (oldContent = it)" />
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
            <div class="diff-result" v-html="prettyHtml" />
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>
<script setup>
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import * as Diff2Html from "diff2html";
import * as Diff from "diff";
import "codemirror/addon/lint/yaml-lint";
import "codemirror/mode/yaml/yaml";

import * as YamlLoader from "js-yaml";
import "diff2html/bundles/css/diff2html.min.css";
import { computed, ref } from "vue";

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
<style scoped lang="scss">
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .file-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.diff-result {
  height: calc(100% - 100px);
  overflow: auto;
  border-radius: 4px;
}

:deep(.el-card) {
  border-radius: 8px;

  .el-card__body {
    height: 100%;
  }
}

:deep(.el-textarea__inner) {
  height: 100% !important;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  resize: none;
}

:deep(.el-textarea) {
  height: calc(100% - 60px);
}
</style>
