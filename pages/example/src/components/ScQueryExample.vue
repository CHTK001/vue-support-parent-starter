<template>
  <div class="example-container">
    <h2 class="example-title">ScQuery 查询输入框示例</h2>
    <p class="example-desc">查询输入框组件，支持防抖、清空等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="search">
          <IconifyIconOnline icon="ri:search-line" class="mr-1" />
          搜索
        </el-button>
        <el-button @click="clearQuery">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <ScQuery v-model="config.query" :placeholder="config.placeholder" />

      <div class="query-info">
        当前查询：<code>{{ config.query || "(空)" }}</code>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="占位文本">
              <el-input v-model="config.placeholder" />
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
import { ElMessage } from "element-plus";
import ScQuery from "@repo/components/ScQuery/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScQuery 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  query: "",
  placeholder: "请输入关键词",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "''",
    description: "查询值（v-model）",
  },
  {
    name: "placeholder",
    type: "string",
    default: "'请输入'",
    description: "占位文本",
  },
  {
    name: "debounce",
    type: "number",
    default: "300",
    description: "防抖延迟（毫秒）",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScQuery v-model="query" placeholder="${config.placeholder}" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScQuery from "@repo/components/ScQuery/index.vue";

const query = ref("");`,
  },
]);

function search() {
  ElMessage.success(`搜索: ${config.query || "(空)"}`);
}

function clearQuery() {
  config.query = "";
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

.query-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
  color: var(--el-text-color-regular);

  code {
    padding: 2px 6px;
    background: var(--el-fill-color);
    border-radius: 4px;
    font-family: monospace;
  }
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>
