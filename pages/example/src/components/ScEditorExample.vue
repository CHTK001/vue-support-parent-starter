<template>
  <div class="example-container">
    <h2 class="example-title">ScEditor 富文本编辑器示例</h2>
    <p class="example-desc">
      基于 WangEditor 的富文本编辑器，支持图片上传、视频插入等功能
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="insertText">
          <IconifyIconOnline icon="ri:text" class="mr-1" />
          插入文本
        </el-button>
        <el-button @click="clearContent">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空内容
        </el-button>
        <el-button @click="getContent">
          <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
          获取内容
        </el-button>
      </div>

      <ScEditor v-model="content" :height="config.height" />

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="编辑器高度">
              <el-input v-model="config.height" placeholder="如 300px" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-divider content-position="left">当前内容预览</el-divider>
      <div class="content-preview" v-html="content"></div>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { message } from "@repo/utils";
import ScEditor from "@repo/components/ScEditor/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScEditor 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const content = ref(
  "<p>这是编辑器的初始内容，支持<strong>加粗</strong>、<em>斜体</em>等格式。</p>"
);

const config = reactive({
  height: "300px",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "''",
    description: "编辑器内容（v-model）",
  },
  {
    name: "height",
    type: "string",
    default: "'300px'",
    description: "编辑器高度",
  },
  {
    name: "placeholder",
    type: "string",
    default: "'请输入内容'",
    description: "占位文本",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScEditor v-model="content" height="${config.height}" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScEditor from "@repo/components/ScEditor/index.vue";

const content = ref("<p>编辑器内容</p>");`,
  },
]);

function insertText() {
  content.value +=
    "<p>新插入的文本内容 - " + new Date().toLocaleTimeString() + "</p>";
  message("已插入文本", { type: "success" });
}

function clearContent() {
  content.value = "";
  message("已清空内容", { type: "info" });
}

function getContent() {
  message("内容已输出到控制台", { type: "success" });
  console.log("编辑器内容:", content.value);
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.config-form {
  margin-top: 16px;
}

.content-preview {
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  min-height: 100px;
}

.props-table {
  margin-bottom: 20px;
}
</style>
