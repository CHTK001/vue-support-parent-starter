<template>
  <div class="example-container">
    <h2 class="example-title">ScFile 文件选择器示例</h2>
    <p class="example-desc">文件选择器组件，支持树形目录浏览、文件选择等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button @click="clearPath">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          清空选择
        </el-button>
      </div>

      <ScFile
        v-model="config.path"
        :url="loadFiles"
        :placeholder="config.placeholder"
        class="file-selector"
      />

      <div class="file-info">
        已选择：<code>{{ config.path || "(未选择)" }}</code>
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
import ScFile from "@repo/components/ScFile/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScFile 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  path: "",
  placeholder: "请选择文件",
});

// 模拟数据
const mockRoot = [
  {
    absolutePath: "C:/",
    isLeaf: false,
    fileName: "C:盘",
    fileType: "DIRECTORY",
  },
  {
    absolutePath: "D:/",
    isLeaf: false,
    fileName: "D:盘",
    fileType: "DIRECTORY",
  },
];

const mockChildren = (base: string) => [
  {
    absolutePath: base + "logs/",
    isLeaf: false,
    fileName: "logs",
    fileType: "DIRECTORY",
  },
  {
    absolutePath: base + "app.log",
    isLeaf: true,
    fileName: "app.log",
    fileType: "FILE",
  },
];

const loadFiles = async (params: { absolutePath?: string }) => {
  if (!params.absolutePath) {
    return Promise.resolve({ data: mockRoot });
  }
  return Promise.resolve({ data: mockChildren(params.absolutePath) });
};

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "''",
    description: "选中的文件路径（v-model）",
  },
  {
    name: "url",
    type: "function",
    default: "-",
    description: "加载文件列表的函数",
  },
  {
    name: "placeholder",
    type: "string",
    default: "'请选择'",
    description: "占位文本",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScFile v-model="path" :url="loadFiles" placeholder="${config.placeholder}" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScFile from "@repo/components/ScFile/index.vue";

const path = ref("");

const loadFiles = async (params) => {
  // 返回文件列表数据
  return { data: [...] };
};`,
  },
]);

function clearPath() {
  config.path = "";
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

.file-selector {
  max-width: 400px;
}

.file-info {
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
