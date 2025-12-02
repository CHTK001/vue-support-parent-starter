<template>
  <div class="example-container">
    <h2 class="example-title">ScUpload 文件上传示例</h2>
    <p class="example-desc">文件上传组件，支持多文件、拖拽上传等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="danger" plain @click="clearFiles">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空文件
        </el-button>
      </div>

      <ScUpload v-model="config.files" :multiple="config.multiple" />

      <div class="upload-info">
        已选择：<strong>{{ config.files?.length || 0 }}</strong> 个文件
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="多文件上传">
              <el-switch v-model="config.multiple" />
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
import ScUpload from "@repo/components/ScUpload/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScUpload 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  files: [] as any[],
  multiple: true,
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "array",
    default: "[]",
    description: "文件列表（v-model）",
  },
  {
    name: "multiple",
    type: "boolean",
    default: "false",
    description: "是否支持多文件",
  },
  {
    name: "accept",
    type: "string",
    default: "'*'",
    description: "接受的文件类型",
  },
  { name: "limit", type: "number", default: "-", description: "最大上传数量" },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScUpload v-model="files"${config.multiple ? " multiple" : ""} />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScUpload from "@repo/components/ScUpload/index.vue";

const files = ref([]);`,
  },
]);

function clearFiles() {
  config.files = [];
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

.upload-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
  color: var(--el-text-color-regular);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>
