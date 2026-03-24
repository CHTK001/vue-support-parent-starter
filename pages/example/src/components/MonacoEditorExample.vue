<template>
  <div class="example-container">
    <h2 class="example-title">MonacoEditor 代码编辑器示例</h2>
    <p class="example-desc">
      基于 Monaco Editor 的代码编辑器，支持语法高亮、代码补全等功能
    </p>

    <ScDivider content-position="left">功能演示</ScDivider>

    <div class="demo-section">
      <div class="demo-controls">
        <ScButton type="primary" @click="insertCode">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          插入代码
        </ScButton>
        <ScButton @click="clearCode">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </ScButton>
      </div>

      <MonacoEditor
        v-model="config.code"
        :language="config.language"
        :theme="config.theme"
        :height="config.height"
      />

      <ScDivider content-position="left">属性配置</ScDivider>

      <ScForm label-width="120px" class="config-form">
        <ScRow :gutter="20">
          <ScCol :span="8">
            <ScFormItem label="语言">
              <ScSelect v-model="config.language" style="width: 100%">
                <ScOption label="JavaScript" value="javascript" />
                <ScOption label="TypeScript" value="typescript" />
                <ScOption label="JSON" value="json" />
                <ScOption label="HTML" value="html" />
                <ScOption label="CSS" value="css" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
          <ScCol :span="8">
            <ScFormItem label="主题">
              <ScSelect v-model="config.theme" style="width: 100%">
                <ScOption label="暗色" value="vs-dark" />
                <ScOption label="亮色" value="vs" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
          <ScCol :span="8">
            <ScFormItem label="高度">
              <ScInputNumber 
                v-model="config.height"
                :min="100"
                :max="600"
                style="width: 100%"
              />
            </ScFormItem>
          </ScCol>
        </ScRow>
      </ScForm>
    </div>

    <ScDivider content-position="left">代码示例</ScDivider>

    <CodePreview :tabs="codeTabs" />

    <ScDivider content-position="left">属性说明</ScDivider>

    <ScTable :data="propsData" border stripe class="props-table">
      <ScTableColumn prop="name" label="属性名" width="180" />
      <ScTableColumn prop="type" label="类型" width="150" />
      <ScTableColumn prop="default" label="默认值" width="120" />
      <ScTableColumn prop="description" label="说明" />
    </ScTable>
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
