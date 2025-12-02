<template>
  <div class="example-container">
    <h2 class="example-title">MonacoEditor 代码编辑器示例</h2>
    <p class="example-desc">
      基于 Monaco Editor 的代码编辑器，支持语法高亮、代码补全等功能
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="insertCode">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          插入代码
        </el-button>
        <el-button @click="clearCode">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <MonacoEditor
        v-model="config.code"
        :language="config.language"
        :theme="config.theme"
        :height="config.height"
      />

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="语言">
              <el-select v-model="config.language" style="width: 100%">
                <el-option label="JavaScript" value="javascript" />
                <el-option label="TypeScript" value="typescript" />
                <el-option label="JSON" value="json" />
                <el-option label="HTML" value="html" />
                <el-option label="CSS" value="css" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="主题">
              <el-select v-model="config.theme" style="width: 100%">
                <el-option label="暗色" value="vs-dark" />
                <el-option label="亮色" value="vs" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高度">
              <el-input-number
                v-model="config.height"
                :min="100"
                :max="600"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
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
import { reactive, computed } from "vue";
import MonacoEditor from "@repo/components/MonacoEditor/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * MonacoEditor 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  code: "console.log('Hello, Monaco!');\n",
  language: "javascript",
  theme: "vs-dark",
  height: 300,
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
    name: "language",
    type: "string",
    default: "'javascript'",
    description: "编程语言",
  },
  {
    name: "theme",
    type: "string",
    default: "'vs-dark'",
    description: "主题（vs/vs-dark）",
  },
  { name: "height", type: "number", default: "300", description: "编辑器高度" },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<MonacoEditor
  v-model="code"
  language="${config.language}"
  theme="${config.theme}"
  :height="${config.height}"
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import MonacoEditor from "@repo/components/MonacoEditor/index.vue";

const code = ref("console.log('Hello!')");`,
  },
]);

function insertCode() {
  config.code += "\n// 新增代码 - " + new Date().toLocaleTimeString();
}

function clearCode() {
  config.code = "";
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

.props-table {
  margin-bottom: 20px;
}
</style>
